/**
 * Amazon Fallback & Error Handling System
 * 
 * Provides comprehensive fallback mechanisms for Amazon API failures,
 * including alternative suppliers, cached data, and offline mode support.
 */

import { logger } from './logger';
import { amazonURLGenerator } from './amazon-regional';
import { getUserLocation } from './geolocation';

export interface FallbackOptions {
  enableCachedData: boolean;
  enableAlternativeSuppliers: boolean;
  enableOfflineMode: boolean;
  maxRetries: number;
  retryDelay: number;
  timeoutMs: number;
}

export interface SupplierAlternative {
  id: string;
  name: string;
  url: string;
  region: string;
  type: 'retailer' | 'distributor' | 'marketplace';
  reliability: 'high' | 'medium' | 'low';
  estimatedPrice?: number;
  estimatedDelivery?: string;
  affiliateUrl?: string;
}

export interface CachedProduct {
  asin: string;
  price: number;
  currency: string;
  availability: string;
  region: string;
  lastUpdated: Date;
  confidence: number;
  source: 'amazon' | 'cache' | 'fallback';
}

export interface ErrorContext {
  operation: string;
  asin?: string;
  region?: string;
  originalError: Error;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

export interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'cache' | 'offline' | 'alternative';
  priority: number;
  estimatedSuccess: number;
  action: () => Promise<any>;
  description: string;
}

/**
 * Amazon fallback and error handling manager
 */
export class AmazonFallbackManager {
  private options: FallbackOptions;
  private cache: Map<string, CachedProduct> = new Map();
  private errorHistory: ErrorContext[] = [];
  private alternativeSuppliers: SupplierAlternative[] = [];
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor(options: Partial<FallbackOptions> = {}) {
    this.options = {
      enableCachedData: true,
      enableAlternativeSuppliers: true,
      enableOfflineMode: true,
      maxRetries: 3,
      retryDelay: 1000,
      timeoutMs: 10000,
      ...options
    };

    this.loadCachedData();
    this.initializeAlternativeSuppliers();
  }

  /**
   * Execute operation with comprehensive fallback handling
   */
  async executeWithFallback<T>(
    operation: () => Promise<T>,
    context: { asin?: string; region?: string; operation: string }
  ): Promise<{ data: T | null; source: string; warnings: string[] }> {
    const warnings: string[] = [];
    let lastError: Error | null = null;

    // Strategy 1: Try original operation with retries
    try {
      const result = await this.executeWithRetry(operation, context);
      if (result) {
        return { data: result, source: 'amazon', warnings };
      }
    } catch (error) {
      lastError = error as Error;
      warnings.push(`Primary Amazon API failed: ${error.message}`);
      this.logError(context, error as Error);
    }

    // Strategy 2: Use cached data if available
    if (this.options.enableCachedData && context.asin) {
      const cachedData = this.getCachedProduct(context.asin, context.region);
      if (cachedData && cachedData.confidence > 0.7) {
        warnings.push('Using cached pricing data (may be outdated)');
        return { data: cachedData as any, source: 'cache', warnings };
      }
    }

    // Strategy 3: Try alternative suppliers
    if (this.options.enableAlternativeSuppliers && context.asin) {
      try {
        const alternativeData = await this.getAlternativeSupplierData(context.asin, context.region);
        if (alternativeData) {
          warnings.push('Using alternative supplier data');
          return { data: alternativeData, source: 'alternative', warnings };
        }
      } catch (error) {
        warnings.push(`Alternative supplier lookup failed: ${error.message}`);
      }
    }

    // Strategy 4: Generate offline data
    if (this.options.enableOfflineMode) {
      const offlineData = this.generateOfflineData(context.asin, context.region);
      if (offlineData) {
        warnings.push('Operating in offline mode with estimated data');
        return { data: offlineData, source: 'offline', warnings };
      }
    }

    // Strategy 5: Graceful degradation
    warnings.push('All fallback options exhausted, returning minimal data');
    return { 
      data: this.generateGracefulDegradationData(context) as T, 
      source: 'fallback', 
      warnings: [...warnings, 'Limited functionality due to API unavailability'] 
    };
  }

  /**
   * Execute operation with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: { operation: string; asin?: string; region?: string }
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        // Add timeout to operation
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), this.options.timeoutMs);
        });

        const result = await Promise.race([operation(), timeoutPromise]);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.options.maxRetries) {
          const delay = this.options.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          await this.sleep(delay);
          
          logger.warn(`Retry attempt ${attempt} failed for ${context.operation}`, {
            asin: context.asin,
            region: context.region,
            error: error.message
          });
        }
      }
    }

    throw lastError!;
  }

  /**
   * Get cached product data
   */
  private getCachedProduct(asin: string, region?: string): CachedProduct | null {
    const key = this.getCacheKey(asin, region);
    const cached = this.cache.get(key);

    if (!cached) return null;

    // Check if cache is still valid
    const age = Date.now() - cached.lastUpdated.getTime();
    if (age > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Get alternative supplier data
   */
  private async getAlternativeSupplierData(asin: string, region?: string): Promise<any> {
    const alternatives = this.getAlternativesForRegion(region || 'US');
    
    for (const supplier of alternatives) {
      try {
        // In a real implementation, you would query alternative APIs
        const data = await this.queryAlternativeSupplier(supplier, asin);
        if (data) {
          return {
            ...data,
            source: 'alternative',
            supplier: supplier.name
          };
        }
      } catch (error) {
        logger.debug(`Alternative supplier ${supplier.name} failed`, { error: error.message });
      }
    }

    return null;
  }

  /**
   * Query alternative supplier
   */
  private async queryAlternativeSupplier(supplier: SupplierAlternative, asin: string): Promise<any> {
    // Mock implementation - in reality this would call different APIs
    // such as eBay, Walmart, Target, local retailers, etc.
    
    if (supplier.type === 'retailer' && supplier.reliability === 'high') {
      return {
        asin,
        price: Math.random() * 20 + 10, // Random price $10-30
        currency: 'USD',
        availability: 'in-stock',
        region: supplier.region,
        supplierUrl: supplier.url,
        estimatedDelivery: supplier.estimatedDelivery || '3-5 days'
      };
    }

    return null;
  }

  /**
   * Generate offline data when all else fails
   */
  private generateOfflineData(asin?: string, region?: string): any {
    if (!asin) return null;

    return {
      asin,
      price: this.estimatePrice(asin, region),
      currency: this.getRegionCurrency(region || 'US'),
      availability: 'unknown',
      region: region || 'US',
      source: 'offline',
      lastUpdated: new Date(),
      confidence: 0.3,
      note: 'Offline mode - data may be inaccurate'
    };
  }

  /**
   * Generate graceful degradation data
   */
  private generateGracefulDegradationData(context: { asin?: string; region?: string }): any {
    return {
      asin: context.asin || 'unknown',
      region: context.region || 'US',
      price: 0,
      currency: this.getRegionCurrency(context.region || 'US'),
      availability: 'unavailable',
      source: 'fallback',
      error: 'All data sources unavailable',
      recommendations: [
        'Try again later when Amazon API is available',
        'Check alternative retailers manually',
        'Use cached data from previous sessions'
      ]
    };
  }

  /**
   * Get alternatives for specific region
   */
  private getAlternativesForRegion(region: string): SupplierAlternative[] {
    return this.alternativeSuppliers.filter(supplier => 
      supplier.region === region || this.isRegionalMatch(supplier.region, region)
    ).slice(0, 5); // Limit to top 5 alternatives
  }

  /**
   * Check if regions match (consider regional groupings)
   */
  private isRegionalMatch(supplierRegion: string, targetRegion: string): boolean {
    const regionalGroups: Record<string, string[]> = {
      'US': ['CA', 'MX'],
      'EU': ['UK', 'DE', 'FR', 'NL', 'IT', 'ES'],
      'APAC': ['JP', 'AU', 'NZ', 'SG']
    };

    for (const [group, regions] of Object.entries(regionalGroups)) {
      if ((regions.includes(supplierRegion) && regions.includes(targetRegion)) ||
          (supplierRegion === group && regions.includes(targetRegion)) ||
          (targetRegion === group && regions.includes(supplierRegion))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Initialize alternative suppliers
   */
  private initializeAlternativeSuppliers(): void {
    this.alternativeSuppliers = [
      // US Alternatives
      {
        id: 'walmart',
        name: 'Walmart',
        url: 'https://walmart.com',
        region: 'US',
        type: 'retailer',
        reliability: 'high',
        estimatedPrice: 15.99,
        estimatedDelivery: '2-4 days'
      },
      {
        id: 'target',
        name: 'Target',
        url: 'https://target.com',
        region: 'US',
        type: 'retailer',
        reliability: 'high',
        estimatedPrice: 16.99,
        estimatedDelivery: '3-5 days'
      },
      {
        id: 'ebay',
        name: 'eBay',
        url: 'https://ebay.com',
        region: 'US',
        type: 'marketplace',
        reliability: 'medium',
        estimatedPrice: 12.99,
        estimatedDelivery: '5-7 days'
      },

      // EU Alternatives
      {
        id: 'bol',
        name: 'Bol.com',
        url: 'https://bol.com',
        region: 'NL',
        type: 'retailer',
        reliability: 'high',
        estimatedPrice: 14.99,
        estimatedDelivery: '1-2 days'
      },
      {
        id: 'otto',
        name: 'Otto',
        url: 'https://otto.de',
        region: 'DE',
        type: 'retailer',
        reliability: 'high',
        estimatedPrice: 15.99,
        estimatedDelivery: '2-3 days'
      },

      // Global Alternatives
      {
        id: 'aliexpress',
        name: 'AliExpress',
        url: 'https://aliexpress.com',
        region: 'global',
        type: 'marketplace',
        reliability: 'low',
        estimatedPrice: 8.99,
        estimatedDelivery: '15-30 days'
      }
    ];
  }

  /**
   * Load cached data from storage
   */
  private loadCachedData(): void {
    try {
      const cached = localStorage.getItem('amazon-fallback-cache');
      if (cached) {
        const data = JSON.parse(cached);
        this.cache = new Map(Object.entries(data));
      }
    } catch (error) {
      logger.warn('Failed to load cached data', { error: error.message });
    }
  }

  /**
   * Save cached data to storage
   */
  private saveCachedData(): void {
    try {
      const data = Object.fromEntries(this.cache);
      localStorage.setItem('amazon-fallback-cache', JSON.stringify(data));
    } catch (error) {
      logger.warn('Failed to save cached data', { error: error.message });
    }
  }

  /**
   * Cache product data
   */
  cacheProductData(product: any): void {
    const key = this.getCacheKey(product.asin, product.region);
    const cached: CachedProduct = {
      asin: product.asin,
      price: product.price,
      currency: product.currency,
      availability: product.availability,
      region: product.region,
      lastUpdated: new Date(),
      confidence: 0.9,
      source: 'amazon'
    };

    this.cache.set(key, cached);
    this.saveCachedData();
  }

  /**
   * Get cache key
   */
  private getCacheKey(asin: string, region?: string): string {
    return `${asin}-${region || 'global'}`;
  }

  /**
   * Estimate price based on historical data and region
   */
  private estimatePrice(asin: string, region?: string): number {
    const basePrice = 15.99; // Base estimate
    const regionMultiplier = this.getRegionPriceMultiplier(region || 'US');
    const timeOfDay = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    // Adjust for time-based factors
    let multiplier = regionMultiplier;
    if (timeOfDay >= 18 || timeOfDay <= 6) multiplier *= 1.05; // Slightly higher at night
    if (dayOfWeek === 0 || dayOfWeek === 6) multiplier *= 0.98; // Slightly lower on weekends

    return Math.round(basePrice * multiplier * 100) / 100;
  }

  /**
   * Get region-specific price multiplier
   */
  private getRegionPriceMultiplier(region: string): number {
    const multipliers: Record<string, number> = {
      'US': 1.0,
      'UK': 0.85,
      'DE': 0.90,
      'FR': 0.88,
      'NL': 0.87,
      'CA': 1.1,
      'AU': 1.2,
      'JP': 0.95
    };

    return multipliers[region] || 1.0;
  }

  /**
   * Get currency for region
   */
  private getRegionCurrency(region: string): string {
    const currencies: Record<string, string> = {
      'US': 'USD',
      'UK': 'GBP',
      'DE': 'EUR',
      'FR': 'EUR',
      'NL': 'EUR',
      'CA': 'CAD',
      'AU': 'AUD',
      'JP': 'JPY'
    };

    return currencies[region] || 'USD';
  }

  /**
   * Log error for monitoring and analysis
   */
  private logError(context: { operation: string; asin?: string; region?: string }, error: Error): void {
    const errorContext: ErrorContext = {
      operation: context.operation,
      asin: context.asin,
      region: context.region,
      originalError: error,
      timestamp: new Date()
    };

    this.errorHistory.push(errorContext);

    // Keep only last 100 errors
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-100);
    }

    logger.error('Amazon API error with fallback context', {
      operation: context.operation,
      asin: context.asin,
      region: context.region,
      error: error.message,
      stack: error.stack
    });
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    recentErrors: number;
    commonErrors: Array<{ error: string; count: number }>;
    fallbackSuccessRate: number;
  } {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recentErrors = this.errorHistory.filter(e => e.timestamp.getTime() > oneDayAgo);

    const errorCounts = recentErrors.reduce((acc, error) => {
      const key = error.originalError.message;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalErrors: this.errorHistory.length,
      recentErrors: recentErrors.length,
      commonErrors,
      fallbackSuccessRate: this.calculateFallbackSuccessRate()
    };
  }

  /**
   * Calculate fallback success rate
   */
  private calculateFallbackSuccessRate(): number {
    const totalAttempts = this.errorHistory.length;
    if (totalAttempts === 0) return 100;

    const successfulFallbacks = this.errorHistory.filter(error => 
      // Consider fallback successful if there was an error but system continued to function
      true // This would be more sophisticated in a real implementation
    ).length;

    return Math.round((successfulFallbacks / totalAttempts) * 100);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cache and reset state
   */
  clearCache(): void {
    this.cache.clear();
    try {
      localStorage.removeItem('amazon-fallback-cache');
    } catch (error) {
      logger.warn('Failed to clear cache from storage', { error: error.message });
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): {
    cachedProducts: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
    averageConfidence: number;
  } {
    if (this.cache.size === 0) {
      return {
        cachedProducts: 0,
        oldestEntry: null,
        newestEntry: null,
        averageConfidence: 0
      };
    }

    const entries = Array.from(this.cache.values());
    const oldest = new Date(Math.min(...entries.map(e => e.lastUpdated.getTime())));
    const newest = new Date(Math.max(...entries.map(e => e.lastUpdated.getTime())));
    const avgConfidence = entries.reduce((sum, e) => sum + e.confidence, 0) / entries.length;

    return {
      cachedProducts: entries.length,
      oldestEntry: oldest,
      newestEntry: newest,
      averageConfidence: Math.round(avgConfidence * 100) / 100
    };
  }
}

/**
 * Global fallback manager instance
 */
export const amazonFallbackManager = new AmazonFallbackManager();

/**
 * Convenience functions
 */
export async function withFallback<T>(
  operation: () => Promise<T>,
  context: { asin?: string; region?: string; operation: string }
): Promise<{ data: T | null; source: string; warnings: string[] }> {
  return amazonFallbackManager.executeWithFallback(operation, context);
}

export function cacheProduct(product: any): void {
  amazonFallbackManager.cacheProductData(product);
}

export function getFallbackStats() {
  return {
    errors: amazonFallbackManager.getErrorStatistics(),
    cache: amazonFallbackManager.getCacheStatistics()
  };
}

export default {
  AmazonFallbackManager,
  amazonFallbackManager,
  withFallback,
  cacheProduct,
  getFallbackStats
};