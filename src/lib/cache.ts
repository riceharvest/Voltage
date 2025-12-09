import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

class CacheManager {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected && this.client) return;

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 60000,
          lazyConnect: true,
        },
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis', error);
      // Fallback to in-memory cache for development
      this.client = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      const serializedValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      logger.error(`Cache set error for key ${key}`, error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}`, error);
      return false;
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
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.flushAll();
    } catch (error) {
      logger.error('Cache flush all error', error);
    }
  }
}

// Singleton instance
export const cache = new CacheManager();

// Initialize cache connection
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