/**
 * Regional Amazon URL Generation & Management
 * 
 * Provides dynamic URL generation for 8 Amazon regions with affiliate integration,
 * localized product search, filtering, and currency conversion support.
 * 
 * @example
 * ```typescript
 * const regionalURL = await generateAmazonURL('B08N5WRWNW', 'NL', {
 *   searchQuery: 'energy drink',
 *   category: 'grocery'
 * });
 * ```
 */

import { AmazonProduct } from './types';
import amazonRegions from '../data/suppliers/amazon-regions.json';

export interface AmazonRegionConfig {
  code: string;
  name: string;
  domain: string;
  currency: string;
  locale: string;
  affiliateProgram: string;
  affiliateTag: string;
  compliance: {
    gdpr: boolean;
    dataPrivacy: string;
    ageVerification: boolean;
    cookieConsent: boolean;
    impressum?: boolean;
  };
  supportedLanguages: string[];
  shippingRegions: string[];
  productCategories: string[];
}

export interface RegionalSearchParams {
  searchQuery?: string;
  category?: string;
  brand?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  sortBy?: 'relevance' | 'price-low' | 'price-high' | 'rating' | 'newest';
  filters?: Record<string, string | string[]>;
  affiliateTag?: string;
}

export interface CurrencyConversion {
  rate: number;
  from: string;
  to: string;
  lastUpdated: Date;
}

export interface AmazonURLOptions {
  includeAffiliate: boolean;
  includeTracking: boolean;
  includeLocale: boolean;
  includeCurrency: boolean;
  customParameters?: Record<string, string>;
}

/**
 * Amazon regional URL generator with comprehensive features
 */
export class AmazonRegionalURLGenerator {
  private regions: Record<string, AmazonRegionConfig>;
  private currencyRates: Map<string, CurrencyConversion> = new Map();
  private cache: Map<string, string> = new Map();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.regions = amazonRegions.regions;
  }

  /**
   * Generate Amazon product URL for specific region
   */
  async generateProductURL(
    asin: string, 
    region: string, 
    options: AmazonURLOptions = { includeAffiliate: true, includeTracking: true, includeLocale: true, includeCurrency: false }
  ): Promise<string> {
    const cacheKey = `product:${asin}:${region}:${JSON.stringify(options)}`;
    const cached = this.getCachedURL(cacheKey);
    if (cached) return cached;

    const regionConfig = this.getRegionConfig(region);
    if (!regionConfig) {
      throw new Error(`Invalid region: ${region}`);
    }

    const url = this.buildProductURL(asin, regionConfig, options);
    this.cacheURL(cacheKey, url);
    
    return url;
  }

  /**
   * Generate Amazon search URL with parameters
   */
  async generateSearchURL(
    region: string, 
    params: RegionalSearchParams
  ): Promise<string> {
    const regionConfig = this.getRegionConfig(region);
    if (!regionConfig) {
      throw new Error(`Invalid region: ${region}`);
    }

    const searchParams = new URLSearchParams();
    
    // Basic search parameters
    if (params.searchQuery) {
      searchParams.set('k', params.searchQuery);
    }
    
    // Category filtering
    if (params.category) {
      searchParams.set('i', this.mapCategoryToAmazon(params.category, region));
    }
    
    // Brand filtering
    if (params.brand) {
      searchParams.set('brand', params.brand);
    }
    
    // Price range
    if (params.priceRange) {
      searchParams.set('rh', `p_36:${params.priceRange.min * 100}-${params.priceRange.max * 100}`);
    }
    
    // Sorting
    if (params.sortBy) {
      searchParams.set('s', this.mapSortToAmazon(params.sortBy, region));
    }
    
    // Custom filters
    if (params.filters) {
      for (const [key, value] of Object.entries(params.filters)) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else {
          searchParams.set(key, value);
        }
      }
    }
    
    // Affiliate tag
    if (params.affiliateTag || regionConfig.affiliateTag) {
      searchParams.set('tag', params.affiliateTag || regionConfig.affiliateTag);
    }

    const baseUrl = `https://${regionConfig.domain}/s`;
    const url = `${baseUrl}?${searchParams.toString()}`;
    
    return url;
  }

  /**
   * Generate category browsing URL
   */
  generateCategoryURL(
    region: string, 
    categoryPath: string, 
    options: AmazonURLOptions = { includeAffiliate: true, includeTracking: false, includeLocale: false, includeCurrency: false }
  ): string {
    const regionConfig = this.getRegionConfig(region);
    if (!regionConfig) {
      throw new Error(`Invalid region: ${region}`);
    }

    const searchParams = new URLSearchParams();
    
    if (options.includeAffiliate && regionConfig.affiliateTag) {
      searchParams.set('tag', regionConfig.affiliateTag);
    }

    const baseUrl = `https://${regionConfig.domain}/${categoryPath}`;
    return searchParams.toString() ? `${baseUrl}?${searchParams.toString()}` : baseUrl;
  }

  /**
   * Convert currency for price comparison
   */
  async convertCurrency(
    amount: number, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    const cacheKey = `${fromCurrency}-${toCurrency}`;
    const cached = this.currencyRates.get(cacheKey);
    
    if (cached && Date.now() - cached.lastUpdated.getTime() < this.CACHE_DURATION) {
      return amount * cached.rate;
    }

    try {
      // In a real implementation, you would fetch from a currency API
      const rate = await this.fetchCurrencyRate(fromCurrency, toCurrency);
      
      const conversion: CurrencyConversion = {
        rate,
        from: fromCurrency,
        to: toCurrency,
        lastUpdated: new Date()
      };
      
      this.currencyRates.set(cacheKey, conversion);
      return amount * rate;
    } catch (error) {
      console.warn('Currency conversion failed:', error);
      return amount; // Return original amount if conversion fails
    }
  }

  /**
   * Get regional price comparison for multiple regions
   */
  async getRegionalPriceComparison(
    product: AmazonProduct
  ): Promise<Array<{ region: string; price: number; currency: string; convertedPrice: number; url: string }>> {
    const comparisons: Array<{ region: string; price: number; currency: string; convertedPrice: number; url: string }> = [];
    
    // Get product URL for each region
    for (const regionCode of Object.keys(this.regions)) {
      const regionConfig = this.regions[regionCode];
      
      // Convert price to target currency
      const convertedPrice = await this.convertCurrency(
        product.price, 
        product.currency, 
        regionConfig.currency
      );
      
      // Generate URL for this region
      const url = await this.generateProductURL(product.asin, regionCode);
      
      comparisons.push({
        region: regionCode,
        price: product.price,
        currency: product.currency,
        convertedPrice,
        url
      });
    }
    
    return comparisons;
  }

  /**
   * Get region configuration
   */
  getRegionConfig(region: string): AmazonRegionConfig | null {
    return this.regions[region.toUpperCase()] || null;
  }

  /**
   * Get all available regions
   */
  getAllRegions(): Record<string, AmazonRegionConfig> {
    return this.regions;
  }

  /**
   * Get recommended regions based on location
   */
  getRecommendedRegions(userCountry: string): string[] {
    const recommendations: string[] = [];
    
    // Direct match
    if (this.regions[userCountry]) {
      recommendations.push(userCountry);
    }
    
    // Regional recommendations
    if (['US', 'CA'].includes(userCountry)) {
      recommendations.push('US');
    } else if (['GB', 'IE'].includes(userCountry)) {
      recommendations.push('UK');
    } else if (['AT', 'DE', 'LU', 'CH'].includes(userCountry)) {
      recommendations.push('DE');
    } else if (['BE', 'NL'].includes(userCountry)) {
      recommendations.push('NL');
    } else if (['FR', 'MC', 'AD'].includes(userCountry)) {
      recommendations.push('FR');
    }
    
    // Always include US as fallback
    if (!recommendations.includes('US')) {
      recommendations.push('US');
    }
    
    return recommendations;
  }

  /**
   * Build product URL with all options
   */
  private buildProductURL(asin: string, regionConfig: AmazonRegionConfig, options: AmazonURLOptions): string {
    const baseUrl = `https://${regionConfig.domain}/dp/${asin}`;
    const searchParams = new URLSearchParams();
    
    if (options.includeAffiliate && regionConfig.affiliateTag) {
      searchParams.set('tag', regionConfig.affiliateTag);
    }
    
    if (options.includeLocale && regionConfig.locale) {
      searchParams.set('locale', regionConfig.locale);
    }
    
    if (options.includeCurrency) {
      searchParams.set('currency', regionConfig.currency);
    }
    
    if (options.includeTracking) {
      searchParams.set('ref', 'sr_1_1');
    }
    
    if (options.customParameters) {
      for (const [key, value] of Object.entries(options.customParameters)) {
        searchParams.set(key, value);
      }
    }
    
    return searchParams.toString() ? `${baseUrl}?${searchParams.toString()}` : baseUrl;
  }

  /**
   * Map category to Amazon's internal category system
   */
  private mapCategoryToAmazon(category: string, region: string): string {
    const categoryMap: Record<string, Record<string, string>> = {
      grocery: {
        'US': 'food-and-beverages',
        'UK': 'grocery',
        'DE': 'lebensmittel',
        'FR': 'epicerie',
        'NL': 'levensmiddelen',
        'CA': 'grocery',
        'AU': 'food-beverage',
        'JP': 'food-beverage'
      },
      health: {
        'US': 'health-personal-care',
        'UK': 'drugstore',
        'DE': 'drogerie-und-kosmetik',
        'FR': 'sante-parapharmacie',
        'NL': 'drogisterij',
        'CA': 'health-personal-care',
        'AU': 'health-beauty',
        'JP': 'drug-store'
      },
      sports: {
        'US': 'sports-and-outdoors',
        'UK': 'sport',
        'DE': 'sport-freizeit',
        'FR': 'sport-loisirs',
        'NL': 'sport-outdoor',
        'CA': 'sports',
        'AU': 'sport-recreation',
        'JP': 'sports'
      }
    };
    
    return categoryMap[category]?.[region] || 'food-and-beverages';
  }

  /**
   * Map sort options to Amazon's internal sort system
   */
  private mapSortToAmazon(sortBy: string, region: string): string {
    const sortMap: Record<string, string> = {
      'relevance': 'relevancerank',
      'price-low': 'price-asc-rank',
      'price-high': 'price-desc-rank',
      'rating': 'review-rank',
      'newest': 'release-date-rank'
    };
    
    return sortMap[sortBy] || 'relevancerank';
  }

  /**
   * Fetch currency rate from external API
   */
  private async fetchCurrencyRate(from: string, to: string): Promise<number> {
    // In a real implementation, you would use a service like:
    // - ExchangeRate-API
    // - CurrencyAPI
    // - Fixer.io
    // - Open Exchange Rates
    
    // For demo purposes, return mock rates
    const mockRates: Record<string, number> = {
      'USD-EUR': 0.85,
      'EUR-USD': 1.18,
      'USD-GBP': 0.73,
      'GBP-USD': 1.37,
      'USD-CAD': 1.25,
      'CAD-USD': 0.80,
      'USD-AUD': 1.35,
      'AUD-USD': 0.74,
      'USD-JPY': 110.0,
      'JPY-USD': 0.009
    };
    
    const key = `${from}-${to}`;
    const rate = mockRates[key];
    
    if (!rate) {
      throw new Error(`No exchange rate found for ${from} to ${to}`);
    }
    
    return rate;
  }

  /**
   * Cache URL with expiry
   */
  private cacheURL(key: string, url: string): void {
    this.cache.set(key, url);
    setTimeout(() => {
      this.cache.delete(key);
    }, this.CACHE_DURATION);
  }

  /**
   * Get cached URL if still valid
   */
  private getCachedURL(key: string): string | null {
    return this.cache.get(key) || null;
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.cache.clear();
    this.currencyRates.clear();
  }
}

/**
 * Global instance of Amazon URL generator
 */
export const amazonURLGenerator = new AmazonRegionalURLGenerator();

/**
 * Convenience functions for common operations
 */
export async function generateAmazonProductURL(
  asin: string, 
  region: string = 'US', 
  affiliateTag?: string
): Promise<string> {
  const options: AmazonURLOptions = {
    includeAffiliate: true,
    includeTracking: true,
    includeLocale: true,
    includeCurrency: false
  };
  
  if (affiliateTag) {
    options.customParameters = { tag: affiliateTag };
  }
  
  return amazonURLGenerator.generateProductURL(asin, region, options);
}

export async function generateAmazonSearchURL(
  searchQuery: string, 
  region: string = 'US', 
  options: Partial<RegionalSearchParams> = {}
): Promise<string> {
  const params: RegionalSearchParams = {
    searchQuery,
    category: 'grocery',
    ...options
  };
  
  return amazonURLGenerator.generateSearchURL(region, params);
}

export function generateAmazonCategoryURL(
  region: string, 
  categoryPath: string, 
  affiliateTag?: string
): string {
  const options: AmazonURLOptions = {
    includeAffiliate: !!affiliateTag,
    includeTracking: false,
    includeLocale: false,
    includeCurrency: false
  };
  
  if (affiliateTag) {
    options.customParameters = { tag: affiliateTag };
  }
  
  return amazonURLGenerator.generateCategoryURL(region, categoryPath, options);
}

export async function convertAmazonPrice(
  price: number, 
  fromCurrency: string, 
  toCurrency: string
): Promise<number> {
  return amazonURLGenerator.convertCurrency(price, fromCurrency, toCurrency);
}

export function getAmazonRegionConfig(region: string): AmazonRegionConfig | null {
  return amazonURLGenerator.getRegionConfig(region);
}

export function getRecommendedAmazonRegions(userCountry: string): string[] {
  return amazonURLGenerator.getRecommendedRegions(userCountry);
}

export default {
  AmazonRegionalURLGenerator,
  amazonURLGenerator,
  generateAmazonProductURL,
  generateAmazonSearchURL,
  generateAmazonCategoryURL,
  convertAmazonPrice,
  getAmazonRegionConfig,
  getRecommendedAmazonRegions
};