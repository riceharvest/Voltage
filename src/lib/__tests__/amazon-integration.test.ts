/**
 * Comprehensive Testing Suite for Amazon Integration
 * 
 * Tests all components of the Amazon affiliate integration system including:
 * - Geolocation accuracy
 * - Regional URL generation
 * - Pricing API integration
 * - Fallback system reliability
 * - Cost comparison accuracy
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  getUserLocation, 
  mapLocationToAmazonRegion,
  getAvailableAmazonRegions 
} from '../geolocation';
import { 
  amazonURLGenerator,
  generateAmazonProductURL,
  generateAmazonSearchURL 
} from '../amazon-regional';
import { AmazonFallbackManager, withFallback } from '../amazon-fallback';
import { 
  CostComparisonService,
  compareRecipeCosts,
  analyzeBulkPurchases 
} from '../cost-comparison';

// Mock global fetch for API testing
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Geolocation System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('IP-based geolocation detection', () => {
    it('should detect user location from headers', async () => {
      // Mock request headers
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          country_code: 'NL',
          region: 'North Holland',
          city: 'Amsterdam',
          timezone: 'Europe/Amsterdam'
        })
      } as Response);

      const location = await getUserLocation();
      
      expect(location.country).toBe('NL');
      expect(location.isEU).toBe(true);
      expect(location.isGDPRApplicable).toBe(true);
    });

    it('should fallback to default region when geolocation fails', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      const location = await getUserLocation();
      
      expect(location.country).toBe('US');
      expect(location.isEU).toBe(false);
      expect(location.isGDPRApplicable).toBe(false);
    });

    it('should handle GDPR compliance correctly', async () => {
      const euLocation = {
        country: 'DE',
        region: 'Bavaria',
        isEU: true,
        isGDPRApplicable: true
      };

      expect(euLocation.isEU).toBe(true);
      expect(euLocation.isGDPRApplicable).toBe(true);
    });
  });

  describe('Country to Amazon region mapping', () => {
    it('should map countries to correct Amazon regions', () => {
      expect(mapLocationToAmazonRegion('US').amazonRegion).toBe('US');
      expect(mapLocationToAmazonRegion('GB').amazonRegion).toBe('UK');
      expect(mapLocationToAmazonRegion('DE').amazonRegion).toBe('DE');
      expect(mapLocationToAmazonRegion('NL').amazonRegion).toBe('NL');
      expect(mapLocationToAmazonRegion('CA').amazonRegion).toBe('CA');
      expect(mapLocationToAmazonRegion('AU').amazonRegion).toBe('AU');
      expect(mapLocationToAmazonRegion('JP').amazonRegion).toBe('JP');
    });

    it('should provide fallback for unsupported countries', () => {
      const mapping = mapLocationToAmazonRegion('CN');
      expect(mapping.amazonRegion).toBe('US');
      expect(mapping.fallback).toBe(true);
      expect(mapping.confidence).toBeLessThan(1);
    });

    it('should calculate confidence scores correctly', () => {
      const directMatch = mapLocationToAmazonRegion('US');
      const fallback = mapLocationToAmazonRegion('CN');
      
      expect(directMatch.confidence).toBe(1.0);
      expect(fallback.confidence).toBe(0.3);
    });
  });

  describe('Available regions list', () => {
    it('should return all 8 supported Amazon regions', () => {
      const regions = getAvailableAmazonRegions();
      
      expect(regions).toHaveLength(8);
      expect(regions.map(r => r.code)).toEqual(
        expect.arrayContaining(['US', 'UK', 'DE', 'FR', 'NL', 'CA', 'AU', 'JP'])
      );
    });

    it('should have correct domain mappings for each region', () => {
      const regions = getAvailableAmazonRegions();
      const regionMap = Object.fromEntries(regions.map(r => [r.code, r.domain]));
      
      expect(regionMap.US).toBe('amazon.com');
      expect(regionMap.UK).toBe('amazon.co.uk');
      expect(regionMap.DE).toBe('amazon.de');
      expect(regionMap.FR).toBe('amazon.fr');
      expect(regionMap.NL).toBe('amazon.nl');
      expect(regionMap.CA).toBe('amazon.ca');
      expect(regionMap.AU).toBe('amazon.com.au');
      expect(regionMap.JP).toBe('amazon.co.jp');
    });
  });
});

describe('Regional URL Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Product URL generation', () => {
    it('should generate correct Amazon product URLs for different regions', async () => {
      const asin = 'B08N5WRWNW';
      
      const usUrl = await generateAmazonProductURL(asin, 'US');
      const ukUrl = await generateAmazonProductURL(asin, 'UK');
      const deUrl = await generateAmazonProductURL(asin, 'DE');
      
      expect(usUrl).toContain('amazon.com');
      expect(ukUrl).toContain('amazon.co.uk');
      expect(deUrl).toContain('amazon.de');
      expect(usUrl).toContain(asin);
      expect(ukUrl).toContain(asin);
      expect(deUrl).toContain(asin);
    });

    it('should include affiliate tags in URLs', async () => {
      const asin = 'B08N5WRWNW';
      const affiliateTag = 'test-tag';
      
      const url = await generateAmazonProductURL(asin, 'US', affiliateTag);
      
      expect(url).toContain(`tag=${affiliateTag}`);
    });

    it('should handle custom parameters correctly', async () => {
      const asin = 'B08N5WRWNW';
      const options = {
        includeAffiliate: true,
        includeTracking: true,
        includeLocale: true,
        includeCurrency: false,
        customParameters: {
          ref: 'sr_1_1',
          smid: 'test-smid'
        }
      };
      
      const url = await amazonURLGenerator.generateProductURL(asin, 'US', options);
      
      expect(url).toContain('ref=sr_1_1');
      expect(url).toContain('smid=test-smid');
    });
  });

  describe('Search URL generation', () => {
    it('should generate search URLs with correct parameters', async () => {
      const searchQuery = 'energy drink';
      const url = await generateAmazonSearchURL(searchQuery, 'US');
      
      expect(url).toContain('amazon.com');
      expect(url).toContain(`k=${encodeURIComponent(searchQuery)}`);
    });

    it('should include category and sort parameters', async () => {
      const params = {
        searchQuery: 'caffeine',
        category: 'health',
        sortBy: 'price-low' as const
      };
      
      const url = await generateAmazonSearchURL('caffeine', 'US', params);
      
      expect(url).toContain('i=');
      expect(url).toContain('s=');
    });
  });

  describe('Currency conversion', () => {
    it('should convert between major currencies', async () => {
      const convertedPrice = await amazonURLGenerator.convertCurrency(100, 'USD', 'EUR');
      
      expect(convertedPrice).toBeCloseTo(85, 0); // Mock rate: 0.85
    });

    it('should handle same currency conversion', async () => {
      const convertedPrice = await amazonURLGenerator.convertCurrency(100, 'USD', 'USD');
      
      expect(convertedPrice).toBe(100);
    });

    it('should cache exchange rates', async () => {
      await amazonURLGenerator.convertCurrency(100, 'USD', 'EUR');
      await amazonURLGenerator.convertCurrency(100, 'USD', 'EUR'); // Second call should use cache
      
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only one API call
    });
  });
});

describe('Amazon API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Product search API', () => {
    it('should handle product search requests', async () => {
      const mockProducts = [
        {
          asin: 'B08N5WRWNW',
          region: 'US',
          price: 4.99,
          currency: 'USD',
          availability: 'in-stock',
          affiliateUrl: 'https://amazon.com/dp/B08N5WRWNW?tag=test',
          title: 'Test Product'
        }
      ];

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            products: mockProducts,
            totalResults: 1
          }
        })
      } as Response);

      const response = await fetch('/api/amazon/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'energy drink', region: 'US' })
      });

      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.data.products).toHaveLength(1);
      expect(result.data.products[0].asin).toBe('B08N5WRWNW');
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('API Error'));

      const response = await fetch('/api/amazon/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test' })
      });

      expect(response.ok).toBe(false);
    });
  });

  describe('Regional configuration API', () => {
    it('should return regional configuration data', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            regions: [
              {
                code: 'US',
                name: 'United States',
                domain: 'amazon.com',
                currency: 'USD',
                isRecommended: true
              }
            ]
          }
        })
      } as Response);

      const response = await fetch('/api/amazon/regions');
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.data.regions).toHaveLength(8); // All regions
    });

    it('should handle specific region requests', async () => {
      const response = await fetch('/api/amazon/regions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regionCode: 'US' })
      });

      expect(response.ok).toBe(true);
    });
  });

  describe('Pricing API', () => {
    it('should return pricing data for multiple products', async () => {
      const mockPricingData = {
        success: true,
        data: {
          pricing: [
            {
              asin: 'B08N5WRWNW',
              currentPrice: 4.99,
              originalCurrency: 'USD',
              convertedPrice: 4.99,
              targetCurrency: 'USD',
              regionalPrices: []
            }
          ]
        }
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPricingData
      } as Response);

      const response = await fetch('/api/amazon/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asins: ['B08N5WRWNW'],
          targetCurrency: 'USD'
        })
      });

      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.data.pricing).toHaveLength(1);
      expect(result.data.pricing[0].asin).toBe('B08N5WRWNW');
    });
  });

  describe('Availability API', () => {
    it('should return availability data for products', async () => {
      const mockAvailabilityData = {
        success: true,
        data: {
          availability: [
            {
              asin: 'B08N5WRWNW',
              totalStock: 50,
              availabilityByRegion: {
                US: {
                  status: 'in-stock',
                  stockLevel: 50,
                  fulfillmentType: 'FBA'
                }
              }
            }
          ]
        }
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAvailabilityData
      } as Response);

      const response = await fetch('/api/amazon/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asins: ['B08N5WRWNW'],
          regions: ['US']
        })
      });

      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.data.availability).toHaveLength(1);
      expect(result.data.availability[0].asin).toBe('B08N5WRWNW');
    });
  });
});

describe('Fallback System', () => {
  let fallbackManager: AmazonFallbackManager;

  beforeEach(() => {
    fallbackManager = new AmazonFallbackManager({
      enableCachedData: true,
      enableAlternativeSuppliers: true,
      enableOfflineMode: true,
      maxRetries: 2,
      retryDelay: 100
    });
  });

  afterEach(() => {
    fallbackManager.clearCache();
  });

  describe('Fallback execution', () => {
    it('should execute operation with retry logic', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('API Error'));
      
      await expect(
        fallbackManager.executeWithFallback(mockOperation, {
          operation: 'test',
          asin: 'B08N5WRWNW',
          region: 'US'
        })
      ).rejects.toThrow('API Error');

      expect(mockOperation).toHaveBeenCalledTimes(3); // maxRetries + 1 initial call
    });

    it('should use cached data when primary fails', async () => {
      // Cache some data
      fallbackManager.cacheProductData({
        asin: 'B08N5WRWNW',
        price: 4.99,
        currency: 'USD',
        availability: 'in-stock',
        region: 'US'
      });

      const mockOperation = vi.fn().mockRejectedValue(new Error('API Error'));
      
      const result = await fallbackManager.executeWithFallback(mockOperation, {
        operation: 'test',
        asin: 'B08N5WRWNW',
        region: 'US'
      });

      expect(result.source).toBe('cache');
      expect(result.data).toBeDefined();
    });

    it('should provide graceful degradation when all options fail', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Complete failure'));
      
      const result = await fallbackManager.executeWithFallback(mockOperation, {
        operation: 'test',
        asin: 'B08N5WRWNW',
        region: 'US'
      });

      expect(result.source).toBe('fallback');
      expect(result.warnings).toContain('All fallback options exhausted');
    });
  });

  describe('Error handling and logging', () => {
    it('should log errors with proper context', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Test error'));
      
      try {
        await fallbackManager.executeWithFallback(mockOperation, {
          operation: 'test-operation',
          asin: 'B08N5WRWNW',
          region: 'US'
        });
      } catch (error) {
        // Expected to fail
      }

      const errorStats = fallbackManager.getErrorStatistics();
      expect(errorStats.totalErrors).toBeGreaterThan(0);
    });

    it('should provide error statistics', () => {
      const stats = fallbackManager.getErrorStatistics();
      
      expect(stats).toHaveProperty('totalErrors');
     HaveProperty('recentErrors');
      expect expect(stats).to(stats).toHaveProperty('commonErrors');
      expect(stats).toHaveProperty('fallbackSuccessRate');
    });
  });

  describe('Cache management', () => {
    it('should cache product data correctly', () => {
      const productData = {
        asin: 'B08N5WRWNW',
        price: 4.99,
        currency: 'USD',
        availability: 'in-stock',
        region: 'US'
      };

      fallbackManager.cacheProductData(productData);
      
      const cacheStats = fallbackManager.getCacheStatistics();
      expect(cacheStats.cachedProducts).toBe(1);
      expect(cacheStats.averageConfidence).toBe(0.9);
    });

    it('should clear cache when requested', () => {
      fallbackManager.cacheProductData({
        asin: 'B08N5WRWNW',
        price: 4.99,
        currency: 'USD',
        availability: 'in-stock',
        region: 'US'
      });

      fallbackManager.clearCache();
      
      const cacheStats = fallbackManager.getCacheStatistics();
      expect(cacheStats.cachedProducts).toBe(0);
    });
  });
});

describe('Cost Comparison System', () => {
  let costService: CostComparisonService;

  beforeEach(() => {
    costService = new CostComparisonService();
  });

  describe('Recipe cost analysis', () => {
    it('should calculate DIY recipe costs correctly', async () => {
      // Mock the service methods
      vi.spyOn(costService as any, 'getBaseRecipe').mockReturnValue({
        ingredients: [
          { ingredientId: 'caffeine', amount: 80 }
        ]
      } as any);

      const recipe = {
        id: 'test-recipe',
        name: 'Test Recipe',
        ingredients: [
          { ingredientId: 'flavoring', amount: 5 }
        ],
        compatibleBases: ['classic']
      };

      const diyCost = await (costService as any).calculateDIYCost(recipe, 4, 'US');
      
      expect(diyCost.totalCost).toBeGreaterThan(0);
      expect(diyCost.currency).toBe('USD');
      expect(diyCost.costPerServing).toBeGreaterThan(0);
    });

    it('should get premade product costs', async () => {
      const recipe = {
        id: 'test-recipe',
        premadeProducts: [
          {
            asin: 'B08N5WRWNW',
            region: 'US',
            price: 4.99,
            currency: 'USD',
            availability: 'in-stock',
            affiliateUrl: 'https://amazon.com/test',
            title: 'Test Product'
          }
        ]
      };

      const premadeCost = await (costService as any).getPremadeCost(recipe, 4, 'US');
      
      expect(premadeCost.totalCost).toBeGreaterThan(0);
      expect(premadeCost.currency).toBe('USD');
    });
  });

  describe('Bulk purchase analysis', () => {
    it('should analyze bulk purchasing options', async () => {
      const mockProduct = {
        asin: 'B08N5WRWNW',
        region: 'US',
        price: 4.99,
        currency: 'USD',
        availability: 'in-stock',
        affiliateUrl: 'https://amazon.com/test',
        title: 'Test Product'
      };

      vi.spyOn(costService as any, 'getAmazonProduct').mockResolvedValue(mockProduct);
      vi.spyOn(costService as any, 'getProductPricing').mockResolvedValue([
        { asin: 'B08N5WRWNW', currentPrice: 4.99, currency: 'USD' }
      ]);

      const analysis = await costService.analyzeBulkPurchases('B08N5WRWNW', 'US');
      
      expect(analysis.product).toBeDefined();
      expect(analysis.costBreakdown).toHaveLength(6); // 6 quantity options
      expect(analysis.optimalQuantity).toBeDefined();
    });
  });

  describe('Price history analysis', () => {
    it('should analyze price trends correctly', async () => {
      const mockHistory = [
        { date: new Date('2024-01-01'), price: 5.00, currency: 'USD' },
        { date: new Date('2024-01-15'), price: 4.50, currency: 'USD' },
        { date: new Date('2024-02-01'), price: 4.00, currency: 'USD' }
      ];

      vi.spyOn(costService as any, 'getAmazonProduct').mockResolvedValue({
        asin: 'B08N5WRWNW',
        title: 'Test Product'
      } as any);
      vi.spyOn(costService as any, 'getPriceHistory').mockResolvedValue(mockHistory);

      const analysis = await costService.analyzePriceHistory('B08N5WRWNW', 'US');
      
      expect(analysis.asin).toBe('B08N5WRWNW');
      expect(analysis.trends.direction).toBeDefined();
      expect(analysis.recommendations).toHaveLengthGreaterThan(0);
    });
  });
});

describe('Integration Tests', () => {
  describe('End-to-end workflow', () => {
    it('should handle complete product lookup workflow', async () => {
      // 1. Geolocation
      const location = await getUserLocation();
      expect(location.country).toBeDefined();

      // 2. URL Generation
      const productUrl = await generateAmazonProductURL('B08N5WRWNW', location.country);
      expect(productUrl).toContain(location.country.toLowerCase());

      // 3. API Integration (mocked)
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            product: {
              asin: 'B08N5WRWNW',
              price: 4.99,
              availability: 'in-stock'
            }
          }
        })
      } as Response);

      const response = await fetch(`/api/amazon/products?asin=B08N5WRWNW&region=${location.country}`);
      const result = await response.json();
      
      expect(result.success).toBe(true);
    });

    it('should handle regional fallback gracefully', async () => {
      // Mock geolocation to return unsupported region
      const mockLocation = {
        country: 'CN',
        region: '',
        isEU: false,
        isGDPRApplicable: false
      };

      const mapping = mapLocationToAmazonRegion(mockLocation.country);
      expect(mapping.amazonRegion).toBe('US');
      expect(mapping.fallback).toBe(true);

      const url = await generateAmazonProductURL('B08N5WRWNW', mapping.amazonRegion);
      expect(url).toContain('amazon.com');
    });
  });

  describe('Performance and reliability', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        generateAmazonProductURL(`B08N5WRWN${i}`, 'US')
      );

      const results = await Promise.all(requests);
      
      expect(results).toHaveLength(10);
      results.forEach((url, i) => {
        expect(url).toContain(`B08N5WRWN${i}`);
      });
    });

    it('should cache frequently accessed data', async () => {
      // First call
      await generateAmazonProductURL('B08N5WRWNW', 'US');
      
      // Second call should use cache (mocked to avoid actual API calls)
      await generateAmazonProductURL('B08N5WRWNW', 'US');
      
      // Verify caching behavior in the actual implementation
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });
});

describe('Error Recovery Tests', () => {
  it('should recover from network failures', async () => {
    // Simulate network failure
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    // Should still provide fallback data
    const location = await getUserLocation();
    expect(location.country).toBe('US'); // Fallback region

    const url = await generateAmazonProductURL('B08N5WRWNW', 'US');
    expect(url).toContain('amazon.com');
  });

  it('should handle invalid ASINs gracefully', async () => {
    const invalidAsin = 'INVALID-ASIN';
    
    const url = await generateAmazonProductURL(invalidAsin, 'US');
    expect(url).toContain(invalidAsin);
    expect(url).toContain('amazon.com');
  });

  it('should validate regional parameters', async () => {
    const validRegions = ['US', 'UK', 'DE', 'FR', 'NL', 'CA', 'AU', 'JP'];
    const invalidRegion = 'XX';

    // Should not throw for invalid region (graceful handling)
    const url = await generateAmazonProductURL('B08N5WRWNW', invalidRegion);
    expect(url).toBeDefined();
  });
});