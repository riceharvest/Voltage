/**
 * Enhanced Multi-Level Caching System
 * 
 * This module provides a sophisticated caching solution that combines multiple
 * caching layers (Redis, memory, service worker, localStorage) with intelligent
 * fallback mechanisms, compression, and performance monitoring.
 * 
 * Key Features:
 * - Multi-level caching with automatic fallback
 * - LRU eviction with memory management
 * - Data compression for large objects
 * - Performance metrics and monitoring
 * - Cache warming and background synchronization
 * - Cross-platform compatibility (server/client)
 * 
 * @module enhanced-cache
 * @author Energy Drink App Team
 * @since 2.0.0
 */

import { logger } from './logger';
import { secrets } from './secret-manager';

// Enhanced Cache Types
/**
 * Represents a single entry in the enhanced cache
 * @template T The type of data being cached
 * @interface CacheEntry
 */
interface CacheEntry<T> {
  /** The cached data */
  value: T;
  /** Expiration timestamp in milliseconds */
  expiry: number;
  /** Number of times this entry has been accessed */
  hitCount: number;
  /** Timestamp of last access */
  lastAccessed: number;
  /** Size of the cached data in bytes */
  size: number;
  /** Whether the data is compressed */
  compressed?: boolean;
}

/**
 * Cache performance and usage metrics
 * @interface CacheMetrics
 */
interface CacheMetrics {
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Number of entries evicted */
  evictions: number;
  /** Current memory usage in bytes */
  memoryUsage: number;
  /** Compression ratio percentage */
  compressionRatio: number;
  /** Average response time in milliseconds */
  avgResponseTime: number;
}

/**
 * Configuration for the enhanced cache system
 * @interface CacheConfig
 */
interface CacheConfig {
  /** Maximum memory allocation for cache in bytes */
  maxMemory: number;
  /** Size threshold for enabling compression in bytes */
  compressionThreshold: number;
  /** Default TTL values for different data types */
  ttlDefaults: {
    short: number;   // 5 minutes
    medium: number;  // 30 minutes
    long: number;    // 1 hour
    day: number;     // 24 hours
  };
  /** Enable data compression */
  enableCompression: boolean;
  /** Enable performance metrics collection */
  enableMetrics: boolean;
}

/**
 * Compresses data using base64 encoding (server-side) or returns as-is (client-side)
 * 
 * @param data - String data to compress
 * @returns Compressed or original data
 * @private
 */
const compress = (data: string): string => {
  if (typeof window === 'undefined' && typeof Buffer !== 'undefined') {
    return Buffer.from(data).toString('base64');
  }
  return data;
};

/**
 * Decompresses data using base64 decoding (server-side) or returns as-is (client-side)
 * 
 * @param data - Compressed or original data
 * @returns Decompressed data
 * @private
 */
const decompress = (data: string): string => {
  if (typeof window === 'undefined' && typeof Buffer !== 'undefined') {
    try {
      return Buffer.from(data, 'base64').toString('utf-8');
    } catch {
      return data;
    }
  }
  return data;
};

/**
 * Enhanced Memory Cache Implementation
 * 
 * Provides LRU (Least Recently Used) eviction, compression, and performance monitoring
 * for in-memory caching with configurable TTL and memory limits.
 * 
 * @class EnhancedMemoryCache
 * @template T The type of data to cache
 */
class EnhancedMemoryCache {
  /** Internal cache storage using Map for O(1) access */
  private cache = new Map<string, CacheEntry<any>>();
  /** LRU access order tracking for eviction */
  private accessOrder: string[] = [];
  /** Performance and usage metrics */
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    memoryUsage: 0,
    compressionRatio: 0,
    avgResponseTime: 0
  };
  
  /** Cache configuration */
  private config: CacheConfig;
  /** Response time tracking window (last 100 operations) */
  private responseTimeWindow: number[] = [];

  /**
   * Creates an enhanced memory cache instance
   * @param config - Cache configuration options
   */
  constructor(config: CacheConfig) {
    this.config = config;
  }

  /**
   * Calculates the size of a value in bytes
   * Uses Blob API for accurate size calculation with fallback
   * 
   * @param value - Value to measure
   * @returns Size in bytes
   * @private
   */
  private getSize(value: any): number {
    try {
      const str = JSON.stringify(value);
      return new Blob([str]).size;
    } catch {
      return 1024; // Default size estimate
    }
  }

  /**
   * Evicts the least recently used cache entry
   * Updates metrics and memory usage tracking
   * 
   * @private
   */
  private evictLRU(): void {
    if (this.cache.size === 0) return;
    
    const lruKey = this.accessOrder.shift();
    if (lruKey) {
      const entry = this.cache.get(lruKey);
      if (entry) {
        this.metrics.memoryUsage -= entry.size;
        this.cache.delete(lruKey);
        this.metrics.evictions++;
      }
    }
  }

  /**
   * Updates the access order for LRU tracking
   * Moves accessed key to end of access order
   * 
   * @param key - Cache key that was accessed
   * @private
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * Determines if a value should be compressed based on size and configuration
   * 
   * @param value - Value to evaluate for compression
   * @returns True if value should be compressed
   * @private
   */
  private shouldCompress(value: any): boolean {
    const size = this.getSize(value);
    return this.config.enableCompression && size > this.config.compressionThreshold;
  }

  /**
   * Retrieves a value from the cache
   * Handles expiration, compression, metrics tracking, and LRU updates
   * 
   * @template T The expected type of the cached value
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    
    const entry = this.cache.get(key);
    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    // Check expiry
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.metrics.misses++;
      return null;
    }

    // Update access tracking
    this.updateAccessOrder(key);
    entry.hitCount++;
    entry.lastAccessed = Date.now();

    // Calculate response time
    const responseTime = performance.now() - startTime;
    this.responseTimeWindow.push(responseTime);
    if (this.responseTimeWindow.length > 100) {
      this.responseTimeWindow.shift();
    }
    this.metrics.avgResponseTime = this.responseTimeWindow.reduce((a, b) => a + b, 0) / this.responseTimeWindow.length;

    this.metrics.hits++;
    
    let value = entry.value;
    if (entry.compressed) {
      value = JSON.parse(decompress(value));
    }

    return value;
  }

  /**
   * Stores a value in the cache with optional TTL
   * Handles compression, memory management, and LRU eviction
   * 
   * @template T The type of value being cached
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlSeconds - Time to live in seconds (optional)
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : Date.now() + (this.config.ttlDefaults.medium * 1000);
    
    let size = this.getSize(value);
    let storedValue = value;
    let compressed = false;

    if (this.shouldCompress(value)) {
      storedValue = compress(JSON.stringify(value)) as any;
      compressed = true;
      size = this.getSize(storedValue);
    }

    // Check memory limit and evict if necessary
    while (this.metrics.memoryUsage + size > this.config.maxMemory && this.cache.size > 0) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value: storedValue,
      expiry,
      hitCount: 0,
      lastAccessed: Date.now(),
      size,
      compressed
    };

    this.cache.set(key, entry);
    this.metrics.memoryUsage += size;
    this.accessOrder.push(key);
  }

  /**
   * Removes a specific entry from the cache
   * 
   * @param key - Cache key to delete
   */
  async del(key: string): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      this.metrics.memoryUsage -= entry.size;
      this.cache.delete(key);
      
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    }
  }

  /**
   * Clears all entries from the cache
   * Resets metrics and access tracking
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.accessOrder = [];
    this.metrics.memoryUsage = 0;
    this.metrics.evictions++;
  }

  /**
   * Returns current cache metrics
   * 
   * @returns Current performance and usage metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Returns comprehensive cache statistics
   * 
   * @returns Detailed cache statistics including hit rate and memory usage
   */
  getStats() {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0;
    
    return {
      ...this.getMetrics(),
      hitRate: Math.round(hitRate * 100) / 100,
      entries: this.cache.size,
      memoryUsageMB: Math.round((this.metrics.memoryUsage / 1024 / 1024) * 100) / 100
    };
  }
}

/**
 * Service Worker Cache Integration
 * 
 * Provides browser-side caching using the Cache Storage API
 * for offline functionality and cross-session persistence.
 * 
 * @class ServiceWorkerCache
 * @template T The type of data to cache
 */
class ServiceWorkerCache {
  /** Cache storage name */
  private cacheName: string = 'enhanced-data-cache-v1';

  /**
   * Retrieves a value from service worker cache
   * 
   * @template T The expected type of the cached value
   * @param key - Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    if (typeof window === 'undefined') return null;
    
    try {
      const cache = await caches.open(this.cacheName);
      const response = await cache.match(key);
      if (response) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      logger.error('Service worker cache get error', error);
    }
    return null;
  }

  /**
   * Stores a value in service worker cache
   * 
   * @template T The type of value being cached
   * @param key - Cache key
   * @param value - Value to cache
   */
  async set<T>(key: string, value: T): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const cache = await caches.open(this.cacheName);
      const response = new Response(JSON.stringify(value), {
        headers: { 'Content-Type': 'application/json' }
      });
      await cache.put(key, response);
    } catch (error) {
      logger.error('Service worker cache set error', error);
    }
  }

  /**
   * Clears all entries from service worker cache
   */
  async clear(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const cache = await caches.open(this.cacheName);
      await cache.clear();
    } catch (error) {
      logger.error('Service worker cache clear error', error);
    }
  }
}

/**
 * Local Storage Cache Implementation
 * 
 * Provides browser-side caching using localStorage for simple
 * key-value storage with TTL support.
 * 
 * @class LocalStorageCache
 * @template T The type of data to cache
 */
class LocalStorageCache {
  /** Prefix for cache keys to avoid conflicts */
  private prefix = 'cache:';

  /**
   * Retrieves a value from local storage cache
   * 
   * @template T The expected type of the cached value
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  async get<T>(key: string): Promise<T | null> {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;
      
      const { value, expiry } = JSON.parse(item);
      
      if (expiry && Date.now() > expiry) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }
      
      return value;
    } catch (error) {
      logger.error('Local storage cache get error', error);
      return null;
    }
  }

  /**
   * Stores a value in local storage cache
   * 
   * @template T The type of value being cached
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlSeconds - Time to live in seconds (optional)
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;
      const item = { value, expiry };
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      logger.error('Local storage cache set error', error);
    }
  }

  /**
   * Clears all entries from local storage cache
   */
  async clear(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      logger.error('Local storage cache clear error', error);
    }
  }
}

/**
 * Main Enhanced Cache Manager
 * 
 * Orchestrates multiple caching layers with intelligent fallback,
 * automatic synchronization, and performance monitoring.
 * 
 * @class EnhancedCacheManager
 */
class EnhancedCacheManager {
  /** Memory cache instance for fast access */
  private memoryCache: EnhancedMemoryCache;
  /** Service worker cache for offline functionality */
  private serviceWorkerCache: ServiceWorkerCache;
  /** Local storage cache for simple persistence */
  private localStorageCache: LocalStorageCache;
  /** Redis client for distributed caching */
  private redisCache: any;
  /** Whether to use memory-only fallback */
  private useMemoryFallback = false;
  /** Background cache warming interval */
  private warmingInterval: NodeJS.Timeout | null = null;

  /**
   * Creates an enhanced cache manager instance
   */
  constructor() {
    const config: CacheConfig = {
      maxMemory: 50 * 1024 * 1024, // 50MB
      compressionThreshold: 1024, // 1KB
      ttlDefaults: {
        short: 300,    // 5 minutes
        medium: 1800,  // 30 minutes
        long: 3600,    // 1 hour
        day: 86400     // 1 day
      },
      enableCompression: true,
      enableMetrics: true
    };

    this.memoryCache = new EnhancedMemoryCache(config);
    this.serviceWorkerCache = new ServiceWorkerCache();
    this.localStorageCache = new LocalStorageCache();
  }

  /**
   * Establishes connection to Redis with fallback handling
   * Automatically falls back to memory-only mode if Redis is unavailable
   * 
   * @private
   */
  private async connectRedis(): Promise<void> {
    if (process.env.NODE_ENV === 'test' || 
        process.env.DISABLE_REDIS === 'true' || 
        !secrets.getRedisUrl() ||
        process.env.CI === 'true') {
      this.useMemoryFallback = true;
      return;
    }

    try {
      const { createClient } = await import('redis');
      this.redisCache = createClient({
        url: secrets.getRedisUrl() || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
      });

      this.redisCache.on('error', (err: any) => {
        logger.warn('Redis Client Error - using enhanced memory cache', err.message);
        this.useMemoryFallback = true;
      });

      this.redisCache.on('connect', () => {
        logger.info('Redis Client Connected');
      });

      await this.redisCache.connect();
    } catch (error) {
      logger.warn('Failed to connect to Redis - using enhanced memory cache', error);
      this.useMemoryFallback = true;
    }
  }

  /**
   * Initializes the cache manager and starts background processes
   */
  async initialize(): Promise<void> {
    await this.connectRedis();
    this.startCacheWarming();
  }

  /**
   * Starts automatic cache warming at regular intervals
   * Preloads critical data to improve response times
   * 
   * @private
   */
  private startCacheWarming(): void {
    // Warm up critical data every 30 minutes
    this.warmingInterval = setInterval(async () => {
      await this.warmCache();
    }, 30 * 60 * 1000);
  }

  /**
   * Performs cache warming for critical data
   * Loads essential data proactively to improve user experience
   * 
   * @private
   */
  private async warmCache(): Promise<void> {
    const criticalKeys = [
      'data:ingredients',
      'data:suppliers',
      'data:safety-limits',
      'api:flavors:popular'
    ];

    for (const key of criticalKeys) {
      try {
        const value = await this.get(key);
        if (!value) {
          // Trigger data loading for critical keys
          await this.preloadCriticalData(key);
        }
      } catch (error) {
        logger.error(`Cache warming error for key ${key}`, error);
      }
    }
  }

  /**
   * Preloads critical data for cache warming
   * This would trigger background loading of essential data
   * 
   * @param key - Cache key to preload
   * @private
   */
  private async preloadCriticalData(key: string): Promise<void> {
    // This would trigger background loading of critical data
    logger.info(`Preloading critical data for key: ${key}`);
  }

  /**
   * Multi-level cache retrieval with intelligent fallback
   * Tries caches in order: Redis -> Memory -> Service Worker -> Local Storage
   * 
   * @template T The expected type of the cached value
   * @param key - Cache key
   * @returns Cached value or null if not found in any layer
   */
  async get<T>(key: string): Promise<T | null> {
    // Try Redis first (if available and connected)
    if (!this.useMemoryFallback && this.redisCache) {
      try {
        const value = await this.redisCache.get(key);
        if (value) {
          return JSON.parse(value);
        }
      } catch (error) {
        logger.error('Redis get error, falling back to memory cache', error);
      }
    }

    // Try memory cache
    const memoryValue = await this.memoryCache.get<T>(key);
    if (memoryValue) {
      // Update lower levels asynchronously
      this.updateLowerLevels(key, memoryValue).catch(console.error);
      return memoryValue;
    }

    // Try service worker cache (browser only)
    const swValue = await this.serviceWorkerCache.get<T>(key);
    if (swValue) {
      // Update higher levels asynchronously
      this.updateHigherLevels(key, swValue).catch(console.error);
      return swValue;
    }

    // Try local storage cache
    const lsValue = await this.localStorageCache.get<T>(key);
    if (lsValue) {
      // Update higher levels asynchronously
      this.updateHigherLevels(key, lsValue).catch(console.error);
      return lsValue;
    }

    return null;
  }

  /**
   * Multi-level cache storage with distribution to all available layers
   * Stores data across Redis, memory, service worker, and local storage
   * 
   * @template T The type of value being cached
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlSeconds - Time to live in seconds (optional)
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || 1800; // Default 30 minutes

    // Set in all available caches
    const promises = [];

    // Redis
    if (!this.useMemoryFallback && this.redisCache) {
      promises.push(
        this.redisCache.setEx(key, ttl, JSON.stringify(value))
          .catch(error => logger.error('Redis set error', error))
      );
    }

    // Memory cache
    promises.push(
      this.memoryCache.set(key, value, ttl)
        .catch(error => logger.error('Memory cache set error', error))
    );

    // Service worker cache
    if (typeof window !== 'undefined') {
      promises.push(
        this.serviceWorkerCache.set(key, value)
          .catch(error => logger.error('Service worker cache set error', error))
      );
    }

    // Local storage
    promises.push(
      this.localStorageCache.set(key, value, ttl)
        .catch(error => logger.error('Local storage cache set error', error))
    );

    await Promise.allSettled(promises);
  }

  /**
   * Updates lower-level caches (Redis, Memory) with data from higher levels
   * Used to propagate cache hits from lower levels back up
   * 
   * @template T The type of value being updated
   * @param key - Cache key
   * @param value - Value to propagate
   * @private
   */
  private async updateLowerLevels<T>(key: string, value: T): Promise<void> {
    const promises = [];

    // Update Redis
    if (!this.useMemoryFallback && this.redisCache) {
      promises.push(
        this.redisCache.set(key, JSON.stringify(value))
          .catch(error => logger.error('Redis update error', error))
      );
    }

    // Update memory cache
    promises.push(
      this.memoryCache.set(key, value)
        .catch(error => logger.error('Memory cache update error', error))
    );

    await Promise.allSettled(promises);
  }

  /**
   * Updates higher-level caches (Memory, Redis) with data from lower levels
   * Used to propagate cache hits from higher levels back up
   * 
   * @template T The type of value being updated
   * @param key - Cache key
   * @param value - Value to propagate
   * @private
   */
  private async updateHigherLevels<T>(key: string, value: T): Promise<void> {
    const promises = [];

    // Update memory cache
    promises.push(
      this.memoryCache.set(key, value)
        .catch(error => logger.error('Memory cache update error', error))
    );

    // Update Redis
    if (!this.useMemoryFallback && this.redisCache) {
      promises.push(
        this.redisCache.set(key, JSON.stringify(value))
          .catch(error => logger.error('Redis update error', error))
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Deletes a value from all cache layers
   * 
   * @param key - Cache key to delete
   */
  async del(key: string): Promise<void> {
    const promises = [];

    // Delete from Redis
    if (!this.useMemoryFallback && this.redisCache) {
      promises.push(
        this.redisCache.del(key)
          .catch(error => logger.error('Redis delete error', error))
      );
    }

    // Delete from memory cache
    promises.push(
      this.memoryCache.del(key)
        .catch(error => logger.error('Memory cache delete error', error))
    );

    // Note: Service worker and local storage don't have efficient delete operations
    // They rely on TTL expiration

    await Promise.allSettled(promises);
  }

  /**
   * Invalidates cache entries matching a pattern
   * Uses Redis pattern matching and clears memory cache
   * 
   * @param pattern - Glob-style pattern for cache key matching
   */
  async invalidatePattern(pattern: string): Promise<void> {
    // Invalidate Redis with pattern
    if (!this.useMemoryFallback && this.redisCache) {
      try {
        const keys = await this.redisCache.keys(pattern);
        if (keys.length > 0) {
          await this.redisCache.del(keys);
        }
      } catch (error) {
        logger.error('Redis pattern delete error', error);
      }
    }

    // Clear memory cache (pattern matching for memory cache would require iteration)
    await this.memoryCache.clear();
  }

  /**
   * Returns performance metrics from all cache layers
   * 
   * @returns Combined metrics from all cache systems
   */
  async getMetrics() {
    const memoryStats = this.memoryCache.getStats();
    
    return {
      memory: memoryStats,
      redis: !this.useMemoryFallback && this.redisCache ? 'connected' : 'disabled',
      serviceWorker: typeof window !== 'undefined' ? 'available' : 'server-side',
      localStorage: typeof window !== 'undefined' ? 'available' : 'server-side'
    };
  }

  /**
   * Cleans up resources and disconnects from external services
   */
  async disconnect(): Promise<void> {
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
      this.warmingInterval = null;
    }

    if (this.redisCache) {
      await this.redisCache.disconnect();
    }
  }
}

/**
 * Enhanced Cache Key Generators
 * 
 * Provides centralized cache key generation for consistent naming
 * across the application with proper namespacing and versioning.
 * 
 * @example
 * ```typescript
 * // Generate a paginated flavors cache key
 * const key = enhancedCacheKeys.data.flavorsPaginated(1, 20, { category: 'energy' });
 * // Result: "data:flavors:paginated:1:20:{\"category\":\"energy\"}"
 * ```
 */
export const enhancedCacheKeys = {
  /** Data layer cache keys */
  data: {
    /** Ingredients data cache key */
    ingredients: 'data:ingredients',
    /** Suppliers data cache key */
    suppliers: 'data:suppliers',
    /** All flavors cache key */
    flavors: 'data:flavors',
    /** Filtered flavors cache key */
    flavorsFiltered: (filters: any) => `data:flavors:filtered:${JSON.stringify(filters)}`,
    /** Paginated flavors cache key */
    flavorsPaginated: (page: number, limit: number, filters?: any) => 
      `data:flavors:paginated:${page}:${limit}:${JSON.stringify(filters || {})}`,
    /** Safety limits cache key */
    safetyLimits: 'data:safety-limits',
    /** Search results cache key */
    search: (query: string, filters?: any) => `data:search:${query}:${JSON.stringify(filters || {})}`,
  },
  /** API layer cache keys */
  api: {
    /** Health check cache key */
    health: 'api:health',
    /** Flavors API cache key */
    flavors: 'api:flavors',
    /** Ingredients API cache key */
    ingredients: 'api:ingredients',
    /** Suppliers API cache key */
    suppliers: 'api:suppliers',
    /** Search API cache key */
    search: (query: string) => `api:search:${query}`,
    /** Bulk operations cache key */
    bulk: (ids: string[]) => `api:bulk:${ids.sort().join(',')}`,
  },
  /** Performance monitoring cache keys */
  performance: {
    /** Performance metrics cache key */
    metrics: 'performance:metrics',
    /** Performance monitoring cache key */
    monitoring: 'performance:monitoring',
    /** Analytics cache key */
    analytics: 'performance:analytics',
  }
};

/**
 * Enhanced Cache Manager Singleton Instance
 * 
 * The main entry point for all cache operations. This singleton instance
 * provides multi-level caching with intelligent fallback and performance monitoring.
 * 
 * @example
 * ```typescript
 * // Basic usage
 * await enhancedCache.set('user:profile:123', userData, 1800);
 * const userData = await enhancedCache.get('user:profile:123');
 * 
 * // With automatic fallback
 * const data = await enhancedCache.get('data:critical') || await fetchFromAPI();
 * ```
 */
export const enhancedCache = new EnhancedCacheManager();

// Initialize cache (server-side only)
if (typeof window === 'undefined') {
  enhancedCache.initialize().catch((error) => {
    logger.error('Failed to initialize enhanced cache', error);
  });
}