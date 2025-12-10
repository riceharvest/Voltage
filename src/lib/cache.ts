import { logger } from './logger';

// In-memory fallback cache
const memoryCache = new Map<string, { value: any; expiry?: number }>();

// Redis client type for when available
type RedisClientType = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, mode?: string, duration?: number) => Promise<'OK' | null>;
  setEx: (key: string, seconds: number, value: string) => Promise<'OK' | null>;
  del: (key: string) => Promise<number>;
  keys: (pattern: string) => Promise<string[]>;
  exists: (key: string) => Promise<number>;
  flushAll: () => Promise<'OK' | null>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  connect: () => Promise<void>;
};

class CacheManager {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private useMemoryFallback = false;

  async connect(): Promise<void> {
    if (this.isConnected && this.client) return;

    // Skip Redis connection in test environments or when explicitly disabled
    if (process.env.NODE_ENV === 'test' || 
        process.env.DISABLE_REDIS === 'true' || 
        !process.env.REDIS_URL ||
        process.env.CI === 'true') {
      logger.info('Using in-memory cache fallback (test/development mode)');
      this.useMemoryFallback = true;
      return;
    }

    try {
      // Dynamic import to avoid module resolution errors
      const { createClient } = await import('redis');
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
      }) as RedisClientType;

      this.client.on('error', (err: any) => {
        logger.warn('Redis Client Error - falling back to memory cache', err.message);
        this.isConnected = false;
        this.useMemoryFallback = true;
      });

      this.client.on('connect', () => {
        logger.info('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('Redis Client Disconnected - using memory cache');
        this.isConnected = false;
        this.useMemoryFallback = true;
      });

      await this.client.connect();
    } catch (error: any) {
      logger.warn('Failed to connect to Redis - using memory cache', error?.message || error);
      this.useMemoryFallback = true;
    }
  }

  private getFromMemory<T>(key: string): T | null {
    const item = memoryCache.get(key);
    if (!item) return null;
    
    // Check expiry
    if (item.expiry && Date.now() > item.expiry) {
      memoryCache.delete(key);
      return null;
    }
    
    return item.value;
  }

  private setToMemory(key: string, value: any, ttlSeconds?: number): void {
    const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
    memoryCache.set(key, { value, expiry });
  }

  async get<T>(key: string): Promise<T | null> {
    // Always use memory cache in test environments or when Redis fails
    if (this.useMemoryFallback || !this.client || !this.isConnected) {
      return this.getFromMemory<T>(key);
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}`, error);
      return this.getFromMemory<T>(key); // Fallback to memory
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);

    // Always use memory cache in test environments or when Redis fails
    if (this.useMemoryFallback || !this.client || !this.isConnected) {
      this.setToMemory(key, value, ttlSeconds);
      return;
    }

    try {
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      logger.error(`Cache set error for key ${key}`, error);
      // Fallback to memory cache
      this.setToMemory(key, value, ttlSeconds);
    }
  }

  async del(key: string): Promise<void> {
    // Always use memory cache in test environments or when Redis fails
    if (this.useMemoryFallback || !this.client || !this.isConnected) {
      memoryCache.delete(key);
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}`, error);
      // Fallback to memory cache
      memoryCache.delete(key);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    // Always use memory cache in test environments or when Redis fails
    if (this.useMemoryFallback || !this.client || !this.isConnected) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          memoryCache.delete(key);
        }
      }
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}`, error);
      // Fallback to memory cache
      const regex = new RegExp(pattern.replace('*', '.*'));
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          memoryCache.delete(key);
        }
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    // Always use memory cache in test environments or when Redis fails
    if (this.useMemoryFallback || !this.client || !this.isConnected) {
      const item = memoryCache.get(key);
      if (!item) return false;
      
      // Check expiry
      if (item.expiry && Date.now() > item.expiry) {
        memoryCache.delete(key);
        return false;
      }
      
      return true;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}`, error);
      // Fallback to memory cache
      return this.exists(key); // This will use the memory fallback
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  // Cache invalidation strategies
  async invalidateDataCache(): Promise<void> {
    await this.delPattern('data:*');
  }

  async invalidateApiCache(): Promise<void> {
    await this.delPattern('api:*');
  }

  async invalidateAll(): Promise<void> {
    // Always use memory cache in test environments or when Redis fails
    if (this.useMemoryFallback || !this.client || !this.isConnected) {
      memoryCache.clear();
      return;
    }

    try {
      await this.client.flushAll();
    } catch (error) {
      logger.error('Cache flush all error', error);
      // Fallback to memory cache
      memoryCache.clear();
    }
  }
}

// Singleton instance
export const cache = new CacheManager();

// Initialize cache connection (only on server side)
if (typeof window === 'undefined') { // Only on server side
  cache.connect().catch((error) => {
    logger.error('Failed to initialize cache connection', error);
  });
}

// Cache key generators
export const cacheKeys = {
  data: {
    ingredients: 'data:ingredients',
    suppliers: 'data:suppliers',
    flavors: 'data:flavors',
    safetyLimits: 'data:safety-limits',
  },
  api: {
    gdprStatus: (ip: string) => `api:gdpr-status:${ip}`,
    health: 'api:health',
  },
};

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 300,    // 5 minutes
  MEDIUM: 1800,  // 30 minutes
  LONG: 3600,    // 1 hour
  DAY: 86400,    // 1 day
  WEEK: 604800,  // 1 week
};