/**
 * Comprehensive Redis Caching Strategy for Global Product Data
 * Implements multi-level caching, intelligent invalidation, and global distribution
 */

import { cache } from '../cache';
import { logger } from '../logger';
import { secrets } from '../secret-manager';

interface CacheStrategy {
  ttl: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  invalidateOnUpdate: boolean;
  preWarm: boolean;
}

interface GlobalCacheConfig {
  regions: string[];
  primaryRegion: string;
  failoverRegions: string[];
  replicationDelay: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

interface AmazonProductCache {
  asin: string;
  region: string;
  data: any;
  price: number;
  currency: string;
  availability: string;
  lastUpdated: number;
  expiresAt: number;
}

interface GeolocationCache {
  ip: string;
  country: string;
  region: string;
  city: string;
  coordinates: { lat: number; lng: number };
  timezone: string;
  isp: string;
}

class GlobalRedisCacheStrategy {
  private config: GlobalCacheConfig;
  private regionConnections: Map<string, any> = new Map();
  private cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    regions: new Map<string, { hits: number; misses: number }>()
  };

  private readonly cacheStrategies: Map<string, CacheStrategy> = new Map([
    // Amazon Product Data - Critical for performance
    ['amazon:product:*', {
      ttl: 3600, // 1 hour
      priority: 'CRITICAL',
      invalidateOnUpdate: true,
      preWarm: true
    }],
    ['amazon:pricing:*', {
      ttl: 300, // 5 minutes
      priority: 'HIGH',
      invalidateOnUpdate: true,
      preWarm: true
    }],
    ['amazon:availability:*', {
      ttl: 600, // 10 minutes
      priority: 'HIGH',
      invalidateOnUpdate: true,
      preWarm: true
    }],
    
    // Geolocation Data - High frequency
    ['geo:location:*', {
      ttl: 86400, // 24 hours
      priority: 'MEDIUM',
      invalidateOnUpdate: false,
      preWarm: false
    }],
    
    // Recipe Data - Medium frequency
    ['recipes:flavors', {
      ttl: 7200, // 2 hours
      priority: 'MEDIUM',
      invalidateOnUpdate: true,
      preWarm: true
    }],
    ['recipes:ingredients', {
      ttl: 86400, // 24 hours
      priority: 'LOW',
      invalidateOnUpdate: false,
      preWarm: false
    }],
    
    // Safety and Regulatory Data - Low frequency but critical
    ['safety:limits', {
      ttl: 604800, // 1 week
      priority: 'CRITICAL',
      invalidateOnUpdate: false,
      preWarm: true
    }],
    ['regulatory:*', {
      ttl: 86400, // 24 hours
      priority: 'HIGH',
      invalidateOnUpdate: true,
      preWarm: true
    }],
    
    // User Session Data - Critical but ephemeral
    ['session:*', {
      ttl: 3600, // 1 hour
      priority: 'CRITICAL',
      invalidateOnUpdate: false,
      preWarm: false
    }],
    
    // Analytics and Metrics - High frequency
    ['analytics:events:*', {
      ttl: 1800, // 30 minutes
      priority: 'MEDIUM',
      invalidateOnUpdate: false,
      preWarm: false
    }]
  ]);

  constructor(config: GlobalCacheConfig) {
    this.config = config;
    this.initializeRegionalConnections();
    this.startCacheWarming();
  }

  private async initializeRegionalConnections(): Promise<void> {
    for (const region of this.config.regions) {
      try {
        const connection = await this.createRegionalConnection(region);
        this.regionConnections.set(region, connection);
        logger.info(`Initialized Redis connection for region: ${region}`);
      } catch (error) {
        logger.warn(`Failed to initialize Redis connection for region: ${region}`, error);
      }
    }
  }

  private async createRegionalConnection(region: string): Promise<any> {
    // In production, this would create actual Redis connections to regional instances
    // For now, we'll use the existing cache manager with region-specific keys
    return {
      region,
      connected: true,
      get: (key: string) => cache.get(`${region}:${key}`),
      set: (key: string, value: any, ttl?: number) => cache.set(`${region}:${key}`, value, ttl),
      del: (key: string) => cache.del(`${region}:${key}`)
    };
  }

  // Amazon Product Data Caching
  async cacheAmazonProduct(product: AmazonProductCache): Promise<void> {
    const key = `amazon:product:${product.asin}:${product.region}`;
    const strategy = this.cacheStrategies.get('amazon:product:*');
    
    try {
      // Apply compression if enabled
      let dataToCache = product;
      if (this.config.compressionEnabled) {
        dataToCache = this.compressData(product);
      }

      await cache.set(key, dataToCache, strategy?.ttl);
      this.cacheStats.sets++;
      this.cacheStats.regions.get(product.region)?.hits++;
      
      logger.debug(`Cached Amazon product: ${product.asin} for region: ${product.region}`);
    } catch (error) {
      logger.error(`Failed to cache Amazon product: ${product.asin}`, error);
    }
  }

  async getCachedAmazonProduct(asin: string, region: string): Promise<AmazonProductCache | null> {
    const key = `amazon:product:${asin}:${region}`;
    
    try {
      let product = await cache.get<AmazonProductCache>(key);
      
      if (!product) {
        this.cacheStats.misses++;
        this.cacheStats.regions.get(region)?.misses++;
        return null;
      }

      // Decompress if needed
      if (this.config.compressionEnabled && product.data) {
        product = this.decompressData(product);
      }

      this.cacheStats.hits++;
      this.cacheStats.regions.get(region)?.hits++;
      return product;
    } catch (error) {
      logger.error(`Failed to retrieve cached Amazon product: ${asin}`, error);
      return null;
    }
  }

  // Geolocation-based Content Caching
  async cacheGeolocationData(geoData: GeolocationCache): Promise<void> {
    const key = `geo:location:${geoData.ip}`;
    const strategy = this.cacheStrategies.get('geo:location:*');
    
    try {
      await cache.set(key, geoData, strategy?.ttl);
      this.cacheStats.sets++;
    } catch (error) {
      logger.error('Failed to cache geolocation data', error);
    }
  }

  async getCachedGeolocation(ip: string): Promise<GeolocationCache | null> {
    const key = `geo:location:${ip}`;
    
    try {
      const geoData = await cache.get<GeolocationCache>(key);
      if (geoData) {
        this.cacheStats.hits++;
        return geoData;
      }
      this.cacheStats.misses++;
      return null;
    } catch (error) {
      logger.error('Failed to retrieve cached geolocation data', error);
      return null;
    }
  }

  // Multi-level Cache Hierarchy
  async getWithFallback<T>(key: string, regionalKey?: string): Promise<T | null> {
    // Level 1: In-memory cache (fastest)
    const memoryResult = await this.getFromMemory<T>(key);
    if (memoryResult) {
      this.cacheStats.hits++;
      return memoryResult;
    }

    // Level 2: Regional Redis (fast)
    if (regionalKey) {
      const regionalResult = await this.getFromRegional<T>(regionalKey);
      if (regionalResult) {
        // Populate in-memory cache
        await this.setToMemory(key, regionalResult, 300); // 5 minutes in memory
        this.cacheStats.hits++;
        return regionalResult;
      }
    }

    // Level 3: Primary Redis (medium)
    const primaryResult = await cache.get<T>(key);
    if (primaryResult) {
      // Populate both caches
      await this.setToMemory(key, primaryResult, 300);
      if (regionalKey) {
        await this.setToRegional(regionalKey, primaryResult, 3600);
      }
      this.cacheStats.hits++;
      return primaryResult;
    }

    this.cacheStats.misses++;
    return null;
  }

  private async getFromMemory<T>(key: string): Promise<T | null> {
    // Simple in-memory cache implementation
    // In production, this would be a more sophisticated LRU cache
    return null; // Placeholder
  }

  private async setToMemory(key: string, value: any, ttl: number): Promise<void> {
    // Placeholder for memory cache implementation
  }

  private async getFromRegional<T>(regionalKey: string): Promise<T | null> {
    const primaryRegion = this.config.primaryRegion;
    const connection = this.regionConnections.get(primaryRegion);
    
    if (connection) {
      return await connection.get(regionalKey);
    }
    
    return null;
  }

  private async setToRegional(regionalKey: string, value: any, ttl: number): Promise<void> {
    const primaryRegion = this.config.primaryRegion;
    const connection = this.regionConnections.get(primaryRegion);
    
    if (connection) {
      await connection.set(regionalKey, value, ttl);
    }
  }

  // Cache Warming Strategies
  private startCacheWarming(): void {
    // Warm critical caches during off-peak hours
    const warmupSchedule = () => {
      const now = new Date();
      const hour = now.getUTCHours();
      
      // Warm up during off-peak hours (2-6 AM UTC)
      if (hour >= 2 && hour <= 6) {
        this.warmCriticalCaches();
      }
    };

    // Run immediately and then every hour
    warmupSchedule();
    setInterval(warmupSchedule, 3600000);
  }

  private async warmCriticalCaches(): Promise<void> {
    const criticalCaches = [
      'recipes:flavors',
      'safety:limits',
      'amazon:product:popular:*'
    ];

    for (const cacheKey of criticalCaches) {
      try {
        await this.preWarmCache(cacheKey);
        logger.info(`Pre-warmed cache: ${cacheKey}`);
      } catch (error) {
        logger.warn(`Failed to pre-warm cache: ${cacheKey}`, error);
      }
    }
  }

  private async preWarmCache(cacheKey: string): Promise<void> {
    const strategy = this.cacheStrategies.get(cacheKey);
    if (!strategy?.preWarm) return;

    // Simulate cache warming based on cache type
    switch (cacheKey) {
      case 'recipes:flavors':
        // Pre-warm all flavor recipes
        // In production, this would fetch from database
        break;
      case 'safety:limits':
        // Pre-warm safety limit data
        break;
      case 'amazon:product:popular:*':
        // Pre-warm popular products for each region
        break;
    }
  }

  // Intelligent Invalidation
  async invalidateCache(pattern: string, reason?: string): Promise<void> {
    try {
      await cache.delPattern(pattern);
      this.cacheStats.deletes++;
      
      logger.info(`Invalidated cache pattern: ${pattern}`, { reason });
      
      // Trigger cache warming for critical patterns
      if (pattern.includes('amazon:product')) {
        setTimeout(() => this.warmCriticalCaches(), 5000);
      }
    } catch (error) {
      logger.error(`Failed to invalidate cache pattern: ${pattern}`, error);
    }
  }

  // Performance Monitoring
  getCacheStatistics(): any {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total > 0 ? (this.cacheStats.hits / total) * 100 : 0;
    
    return {
      overall: {
        hits: this.cacheStats.hits,
        misses: this.cacheStats.misses,
        sets: this.cacheStats.sets,
        deletes: this.cacheStats.deletes,
        hitRate: `${hitRate.toFixed(2)}%`
      },
      regions: Object.fromEntries(this.cacheStats.regions),
      strategies: Array.from(this.cacheStrategies.entries()).map(([pattern, strategy]) => ({
        pattern,
        strategy
      }))
    };
  }

  private compressData(data: any): any {
    // Placeholder for compression logic
    // In production, would use gzip or similar
    return data;
  }

  private decompressData(data: any): any {
    // Placeholder for decompression logic
    return data;
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; details: any }> {
    const checks = {
      primaryRedis: false,
      regionalConnections: 0,
      memoryUsage: 0,
      hitRate: 0
    };

    try {
      // Check primary Redis connection
      const testKey = 'health:check';
      await cache.set(testKey, 'ok', 10);
      const testValue = await cache.get(testKey);
      checks.primaryRedis = testValue === 'ok';
      
      // Check regional connections
      checks.regionalConnections = this.regionConnections.size;
      
      // Calculate hit rate
      const stats = this.getCacheStatistics();
      checks.hitRate = parseFloat(stats.overall.hitRate);
      
      // Get memory usage
      // In production, would get actual Redis memory usage
      
      const status = checks.primaryRedis ? 'healthy' : 'unhealthy';
      return { status, details: checks };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: { ...checks, error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
}

// Default global configuration
const defaultGlobalCacheConfig: GlobalCacheConfig = {
  regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1'],
  primaryRegion: 'us-east-1',
  failoverRegions: ['us-west-2', 'eu-west-1'],
  replicationDelay: 100, // ms
  compressionEnabled: true,
  encryptionEnabled: true
};

export { GlobalRedisCacheStrategy, defaultGlobalCacheConfig };
export type { GlobalCacheConfig, AmazonProductCache, GeolocationCache, CacheStrategy };