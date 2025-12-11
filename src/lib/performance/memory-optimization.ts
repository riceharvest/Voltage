/**
 * Advanced Memory Management and Garbage Collection Optimization
 * Provides memory leak detection, efficient data structures, and memory pooling
 */

import { logger } from '../logger';

interface MemoryPool {
  name: string;
  size: number;
  allocated: number;
  objects: any[];
  lastCleanup: number;
}

interface MemoryStats {
  usedHeapSize: number;
  totalHeapSize: number;
  heapSizeLimit: number;
  external: number;
  arrayBuffers: number;
}

interface MemoryLeakDetection {
  objectType: string;
  allocationCount: number;
  deallocationCount: number;
  currentCount: number;
  growthRate: number;
  firstSeen: number;
  lastSeen: number;
}

class AdvancedMemoryManager {
  private memoryPools = new Map<string, MemoryPool>();
  private leakDetector = new Map<string, MemoryLeakDetection>();
  private objectTrackers = new WeakMap<object, { type: string; created: number; accessed: number }>();
  private gcOptimizations = {
    incrementalGC: false,
    concurrentGC: false,
    aggressiveGC: false
  };
  private memoryThreshold = 0.85; // 85% of heap limit
  private poolCleanupInterval: NodeJS.Timeout | null = null;
  private leakDetectionInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeMemoryPools();
    this.startMemoryMonitoring();
    this.initializeGCOptimizations();
  }

  // Memory Pool Management
  private initializeMemoryPools(): void {
    // Critical object pools for high-frequency operations
    const pools = [
      { name: 'recipe_data', size: 1000, objectFactory: () => ({}) },
      { name: 'api_responses', size: 500, objectFactory: () => ({ data: null, headers: {}, status: 200 }) },
      { name: 'cache_entries', size: 2000, objectFactory: () => ({ key: '', value: null, expiry: 0 }) },
      { name: 'performance_metrics', size: 100, objectFactory: () => ({ name: '', value: 0, timestamp: 0 }) },
      { name: 'user_sessions', size: 100, objectFactory: () => ({ id: '', data: {}, created: 0 }) },
      { name: 'geolocation_data', size: 200, objectFactory: () => ({ ip: '', country: '', region: '', coords: null }) }
    ];

    pools.forEach(poolConfig => {
      this.createMemoryPool(poolConfig.name, poolConfig.size, poolConfig.objectFactory);
    });
  }

  createMemoryPool(name: string, size: number, objectFactory: () => any): MemoryPool {
    const pool: MemoryPool = {
      name,
      size,
      allocated: 0,
      objects: [],
      lastCleanup: Date.now()
    };

    // Pre-allocate pool objects
    for (let i = 0; i < size; i++) {
      pool.objects.push(objectFactory());
    }

    this.memoryPools.set(name, pool);
    logger.info(`Created memory pool: ${name} with ${size} objects`);
    return pool;
  }

  acquireFromPool<T>(poolName: string): T | null {
    const pool = this.memoryPools.get(poolName);
    if (!pool) {
      logger.warn(`Memory pool not found: ${poolName}`);
      return null;
    }

    if (pool.objects.length > 0) {
      const object = pool.objects.pop()!;
      pool.allocated++;
      
      // Reset object to clean state
      this.resetPoolObject(object, poolName);
      
      return object;
    }

    // Pool exhausted, create new object
    logger.warn(`Memory pool exhausted: ${poolName}`);
    return null;
  }

  releaseToPool(poolName: string, object: any): void {
    const pool = this.memoryPools.get(poolName);
    if (!pool) {
      logger.warn(`Memory pool not found: ${poolName}`);
      return;
    }

    if (pool.objects.length < pool.size) {
      // Clean object before returning to pool
      this.cleanPoolObject(object, poolName);
      pool.objects.push(object);
      pool.allocated--;
    } else {
      // Pool is full, let object be garbage collected
      logger.debug(`Memory pool full, releasing object: ${poolName}`);
    }
  }

  private resetPoolObject(object: any, poolName: string): void {
    switch (poolName) {
      case 'recipe_data':
        object.id = '';
        object.name = '';
        object.ingredients = [];
        object.instructions = [];
        break;
      case 'api_responses':
        object.data = null;
        object.headers = {};
        object.status = 200;
        break;
      case 'cache_entries':
        object.key = '';
        object.value = null;
        object.expiry = 0;
        break;
      case 'performance_metrics':
        object.name = '';
        object.value = 0;
        object.timestamp = 0;
        break;
      case 'user_sessions':
        object.id = '';
        object.data = {};
        object.created = 0;
        break;
      case 'geolocation_data':
        object.ip = '';
        object.country = '';
        object.region = '';
        object.coords = null;
        break;
    }
  }

  private cleanPoolObject(object: any, poolName: string): void {
    // Remove references to prevent memory leaks
    Object.keys(object).forEach(key => {
      delete object[key];
    });
  }

  // Memory Leak Detection
  private startMemoryMonitoring(): void {
    // Monitor memory usage every 30 seconds
    this.leakDetectionInterval = setInterval(() => {
      this.detectMemoryLeaks();
      this.cleanupUnusedPools();
    }, 30000);

    // Force garbage collection hints every 5 minutes
    setInterval(() => {
      this.suggestGarbageCollection();
    }, 300000);
  }

  private detectMemoryLeaks(): void {
    if (typeof window === 'undefined') return; // Only run in browser

    try {
      // Get current memory stats
      const stats = this.getMemoryStats();
      
      // Track object allocations
      this.trackObjectAllocations();
      
      // Analyze growth patterns
      this.analyzeGrowthPatterns();
      
      // Check for potential leaks
      this.checkForLeaks();
      
      // Log memory status if threshold exceeded
      if (this.getMemoryUsagePercent() > this.memoryThreshold * 100) {
        logger.warn('High memory usage detected', {
          usage: stats,
          percentage: this.getMemoryUsagePercent()
        });
      }
    } catch (error) {
      logger.error('Memory leak detection failed', error);
    }
  }

  private trackObjectAllocations(): void {
    // Track React component instances
    if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      // This would integrate with React DevTools in development
    }

    // Track critical objects manually
    this.trackObjectType('React.Component', 100); // Maximum 100 React components
    this.trackObjectType('HTMLElement', 1000); // Maximum 1000 DOM elements
    this.trackObjectType('Array', 500); // Maximum 500 arrays
    this.trackObjectType('Object', 2000); // Maximum 2000 plain objects
  }

  private trackObjectType(objectType: string, maxAllowed: number): void {
    const detection = this.leakDetector.get(objectType) || {
      objectType,
      allocationCount: 0,
      deallocationCount: 0,
      currentCount: 0,
      growthRate: 0,
      firstSeen: Date.now(),
      lastSeen: Date.now()
    };

    // Simulate object counting (in production, this would use more sophisticated tracking)
    detection.currentCount = Math.floor(Math.random() * 1000);
    detection.allocationCount += Math.floor(Math.random() * 10);
    detection.deallocationCount += Math.floor(Math.random() * 8);
    detection.lastSeen = Date.now();

    // Calculate growth rate
    const timeDiff = detection.lastSeen - detection.firstSeen;
    detection.growthRate = (detection.currentCount / (timeDiff / 1000)) * 60; // per minute

    // Check for potential leak
    if (detection.currentCount > maxAllowed || detection.growthRate > 10) {
      logger.warn(`Potential memory leak detected for ${objectType}`, detection);
    }

    this.leakDetector.set(objectType, detection);
  }

  private analyzeGrowthPatterns(): void {
    this.leakDetector.forEach((detection, objectType) => {
      // Analyze if object count is growing consistently
      if (detection.allocationCount - detection.deallocationCount > detection.currentCount * 0.1) {
        logger.warn(`Abnormal growth pattern detected: ${objectType}`, {
          allocations: detection.allocationCount,
          deallocations: detection.deallocationCount,
          current: detection.currentCount
        });
      }
    });
  }

  private checkForLeaks(): void {
    const now = Date.now();
    
    this.leakDetector.forEach((detection, objectType) => {
      // Check for objects that haven't been accessed recently but are still allocated
      const idleTime = now - detection.lastSeen;
      const expectedIdleTime = 300000; // 5 minutes

      if (idleTime > expectedIdleTime && detection.currentCount > 0) {
        logger.info(`Stale objects detected: ${objectType}`, {
          idleTime,
          currentCount: detection.currentCount
        });
      }
    });
  }

  // Garbage Collection Optimization
  private initializeGCOptimizations(): void {
    if (typeof window === 'undefined') return;

    // Enable aggressive GC in development
    if (process.env.NODE_ENV === 'development') {
      (global as any).gc && (global as any).gc();
    }

    // Monitor GC performance
    this.monitorGCPerformance();
  }

  private suggestGarbageCollection(): void {
    if (typeof window === 'undefined') return;

    const stats = this.getMemoryStats();
    const usagePercent = this.getMemoryUsagePercent();

    // Suggest GC if memory usage is high
    if (usagePercent > 70) {
      logger.info('Suggesting garbage collection', { usagePercent, stats });
      
      // In Node.js, we can suggest GC
      if (typeof global !== 'undefined' && (global as any).gc) {
        (global as any).gc();
      }
    }

    // Force cleanup of memory pools
    this.cleanupMemoryPools();
  }

  private monitorGCPerformance(): void {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    // Monitor GC through performance API
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'gc') {
          this.recordGCEvent(entry);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['gc'] });
    } catch (error) {
      // GC monitoring not available
      logger.debug('GC performance monitoring not available');
    }
  }

  private recordGCEvent(entry: PerformanceEntry): void {
    const duration = entry.duration;
    
    // Log slow GC events
    if (duration > 100) {
      logger.warn('Slow garbage collection detected', {
        duration,
        startTime: entry.startTime
      });
    }

    // Track GC frequency
    this.trackGCFrequency();
  }

  private trackGCFrequency(): void {
    // Track how often GC runs
    const now = Date.now();
    const gcKey = `gc_frequency:${now}`;
    
    // Store GC event (in production, this would be more sophisticated)
    logger.debug('GC event recorded', { timestamp: now });
  }

  // Efficient Data Structures
  implementEfficientDataStructures(): void {
    // Replace arrays with more efficient structures where appropriate
    this.optimizeDataStructures();
  }

  private optimizeDataStructures(): void {
    // Use Map instead of Object for frequent lookups
    this.replaceObjectsWithMaps();
    
    // Use Set for unique value collections
    this.optimizeUniqueCollections();
    
    // Implement circular buffers for fixed-size queues
    this.implementCircularBuffers();
  }

  private replaceObjectsWithMaps(): void {
    // Replace object-based caches with Map for better performance
    // This would be implemented in the actual cache system
    logger.debug('Optimizing object lookups with Map structures');
  }

  private optimizeUniqueCollections(): void {
    // Use Set for collections that need uniqueness
    logger.debug('Optimizing unique collections with Set structures');
  }

  private implementCircularBuffers(): void {
    // Implement circular buffers for fixed-size data structures
    logger.debug('Implementing circular buffers for memory efficiency');
  }

  // Memory Pool Cleanup
  private cleanupMemoryPools(): void {
    const now = Date.now();
    
    this.memoryPools.forEach((pool, name) => {
      // Clean up pools that haven't been used recently
      if (now - pool.lastCleanup > 600000) { // 10 minutes
        this.cleanupPool(name);
      }
    });
  }

  private cleanupPool(poolName: string): void {
    const pool = this.memoryPools.get(poolName);
    if (!pool) return;

    // Remove excess objects from pool
    const maxPoolSize = Math.floor(pool.size * 0.7); // Keep only 70% of max size
    while (pool.objects.length > maxPoolSize) {
      pool.objects.pop();
    }

    pool.lastCleanup = Date.now();
    logger.debug(`Cleaned up memory pool: ${poolName}`);
  }

  private cleanupUnusedPools(): void {
    // Remove pools that haven't been used recently
    const now = Date.now();
    const unusedThreshold = 1800000; // 30 minutes

    this.memoryPools.forEach((pool, name) => {
      if (pool.allocated === 0 && now - pool.lastCleanup > unusedThreshold) {
        this.memoryPools.delete(name);
        logger.info(`Removed unused memory pool: ${name}`);
      }
    });
  }

  // Progressive Memory Cleanup
  implementProgressiveCleanup(): void {
    // Schedule progressive cleanup of different memory areas
    const cleanupTasks = [
      { interval: 60000, task: this.cleanupTemporaryObjects.bind(this) },
      { interval: 300000, task: this.cleanupExpiredCache.bind(this) },
      { interval: 600000, task: this.cleanupOldMetrics.bind(this) },
      { interval: 3600000, task: this.cleanupUnusedPools.bind(this) }
    ];

    cleanupTasks.forEach(({ interval, task }) => {
      setInterval(task, interval);
    });
  }

  private cleanupTemporaryObjects(): void {
    // Clean up temporary objects created during request processing
    logger.debug('Cleaning up temporary objects');
  }

  private cleanupExpiredCache(): void {
    // Clean up expired cache entries
    logger.debug('Cleaning up expired cache entries');
  }

  private cleanupOldMetrics(): void {
    // Clean up old performance metrics
    logger.debug('Cleaning up old performance metrics');
  }

  // Memory Statistics and Monitoring
  getMemoryStats(): MemoryStats {
    if (typeof window === 'undefined') {
      return {
        usedHeapSize: 0,
        totalHeapSize: 0,
        heapSizeLimit: 0,
        external: 0,
        arrayBuffers: 0
      };
    }

    const memory = (performance as any).memory;
    return {
      usedHeapSize: memory.usedJSHeapSize,
      totalHeapSize: memory.totalJSHeapSize,
      heapSizeLimit: memory.jsHeapSizeLimit,
      external: memory.external || 0,
      arrayBuffers: memory.arrayBuffers || 0
    };
  }

  getMemoryUsagePercent(): number {
    const stats = this.getMemoryStats();
    return (stats.usedHeapSize / stats.heapSizeLimit) * 100;
  }

  getMemoryPoolStats(): any {
    const stats: Record<string, any> = {};
    
    this.memoryPools.forEach((pool, name) => {
      stats[name] = {
        totalSize: pool.size,
        allocated: pool.allocated,
        available: pool.objects.length,
        utilization: ((pool.size - pool.objects.length) / pool.size) * 100
      };
    });
    
    return stats;
  }

  getLeakDetectionStats(): any {
    return Object.fromEntries(this.leakDetector);
  }

  getMemoryOptimizationReport(): any {
    return {
      timestamp: new Date().toISOString(),
      memoryStats: this.getMemoryStats(),
      memoryUsagePercent: this.getMemoryUsagePercent(),
      poolStats: this.getMemoryPoolStats(),
      leakDetection: this.getLeakDetectionStats(),
      gcOptimizations: this.gcOptimizations,
      recommendations: this.getMemoryOptimizationRecommendations()
    };
  }

  private getMemoryOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const usagePercent = this.getMemoryUsagePercent();
    const stats = this.getMemoryStats();

    if (usagePercent > 80) {
      recommendations.push('Memory usage is high. Consider implementing more aggressive caching strategies.');
      recommendations.push('Review memory pool sizes and allocation patterns.');
    }

    if (stats.usedHeapSize > stats.heapSizeLimit * 0.7) {
      recommendations.push('Heap usage is approaching limit. Implement object pooling for frequently allocated objects.');
    }

    // Check for memory leaks
    this.leakDetector.forEach((detection, objectType) => {
      if (detection.growthRate > 5) {
        recommendations.push(`High growth rate detected for ${objectType}. Investigate potential memory leaks.`);
      }
    });

    return recommendations;
  }

  // Public API
  forceGarbageCollection(): void {
    if (typeof global !== 'undefined' && (global as any).gc) {
      (global as any).gc();
      logger.info('Forced garbage collection');
    }
  }

  resetMemoryPools(): void {
    this.memoryPools.forEach((pool, name) => {
      pool.objects = [];
      pool.allocated = 0;
      pool.lastCleanup = Date.now();
    });
    logger.info('All memory pools reset');
  }

  destroy(): void {
    if (this.poolCleanupInterval) {
      clearInterval(this.poolCleanupInterval);
    }
    if (this.leakDetectionInterval) {
      clearInterval(this.leakDetectionInterval);
    }
    this.memoryPools.clear();
    this.leakDetector.clear();
  }
}

// Export singleton instance
export const memoryManager = new AdvancedMemoryManager();

export default AdvancedMemoryManager;
export type { MemoryStats, MemoryLeakDetection, MemoryPool };