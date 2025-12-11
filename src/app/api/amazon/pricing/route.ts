/**
 * Amazon Pricing API - Dynamic Pricing Display
 * 
 * Provides real-time pricing information and currency conversion
 * for Amazon products across all supported regions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { amazonURLGenerator } from '../../../lib/amazon-regional';
import { logger } from '../../../lib/logger';

// Validation schema
const PricingRequestSchema = z.object({
  asins: z.array(z.string().min(1)).min(1).max(50),
  regions: z.array(z.string()).optional(),
  includeComparison: z.boolean().default(true),
  targetCurrency: z.string().optional()
});

const PriceHistorySchema = z.object({
  asin: z.string().min(1),
  region: z.string(),
  days: z.number().min(1).max(365).default(30)
});

/**
 * Mock price history database (in production, this would be real historical data)
 */
const MOCK_PRICE_HISTORY: Record<string, Array<{ date: string; price: number; currency: string }>> = {
  'B08N5WRWNW': [
    { date: '2024-01-01', price: 4.99, currency: 'USD' },
    { date: '2024-01-15', price: 5.29, currency: 'USD' },
    { date: '2024-02-01', price: 4.79, currency: 'USD' },
    { date: '2024-02-15', price: 4.99, currency: 'USD' }
  ],
  'B09X4R5TEST': [
    { date: '2024-01-01', price: 3.99, currency: 'EUR' },
    { date: '2024-01-15', price: 4.19, currency: 'EUR' },
    { date: '2024-02-01', price: 3.89, currency: 'EUR' },
    { date: '2024-02-15', price: 3.99, currency: 'EUR' }
  ]
};

/**
 * Get current pricing for products
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedQuery = PricingRequestSchema.parse(body);

    const regions = validatedQuery.regions || ['US', 'UK', 'DE', 'FR', 'NL', 'CA', 'AU', 'JP'];
    const targetCurrency = validatedQuery.targetCurrency || 'USD';

    const pricingData = [];

    for (const asin of validatedQuery.asins) {
      const productPricing = {
        asin,
        currentPrice: 0,
        originalCurrency: '',
        convertedPrice: 0,
        targetCurrency,
        priceChange: {
          percentage: 0,
          direction: 'stable' as 'up' | 'down' | 'stable'
        },
        regionalPrices: [] as Array<{
          region: string;
          price: number;
          currency: string;
          convertedPrice: number;
          url: string;
          availability: string;
        }>,
        priceHistory: [] as Array<{ date: string; price: number; currency: string }>
      };

      // Get pricing for each region
      for (const region of regions) {
        try {
          // In a real implementation, you would fetch from Amazon PA-API
          // For now, we'll use mock data based on region
          const mockPrice = getMockPriceForRegion(asin, region);
          
          if (mockPrice) {
            const convertedPrice = await amazonURLGenerator.convertCurrency(
              mockPrice.price,
              mockPrice.currency,
              targetCurrency
            );

            const url = await amazonURLGenerator.generateProductURL(asin, region);

            productPricing.regionalPrices.push({
              region,
              price: mockPrice.price,
              currency: mockPrice.currency,
              convertedPrice,
              url,
              availability: mockPrice.availability || 'in-stock'
            });

            // Set current price from first available region
            if (productPricing.currentPrice === 0) {
              productPricing.currentPrice = mockPrice.price;
              productPricing.originalCurrency = mockPrice.currency;
              productPricing.convertedPrice = convertedPrice;
            }
          }
        } catch (error) {
          console.warn(`Failed to get pricing for ${asin} in region ${region}:`, error);
        }
      }

      // Calculate price change if we have history data
      if (MOCK_PRICE_HISTORY[asin]) {
        const history = MOCK_PRICE_HISTORY[asin];
        productPricing.priceHistory = history;
        
        if (history.length >= 2) {
          const latest = history[history.length - 1];
          const previous = history[history.length - 2];
          
          if (latest.currency === previous.currency) {
            const change = ((latest.price - previous.price) / previous.price) * 100;
            productPricing.priceChange = {
              percentage: Math.abs(change),
              direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
            };
          }
        }
      }

      pricingData.push(productPricing);
    }

    // Sort regions by price for comparison
    for (const product of pricingData) {
      product.regionalPrices.sort((a, b) => a.convertedPrice - b.convertedPrice);
    }

    logger.info('Pricing data retrieved', {
      asins: validatedQuery.asins,
      regions,
      targetCurrency,
      productsProcessed: pricingData.length
    });

    return NextResponse.json({
      success: true,
      data: {
        pricing: pricingData,
        targetCurrency,
        lastUpdated: new Date().toISOString(),
        priceAlerts: generatePriceAlerts(pricingData),
        bestDeals: findBestDeals(pricingData)
      }
    });

  } catch (error) {
    logger.error('Pricing API failed', { error: error.message });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve pricing data'
    }, { status: 500 });
  }
}

/**
 * Get price history for a specific product
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = {
      asin: searchParams.get('asin'),
      region: searchParams.get('region') || 'US',
      days: parseInt(searchParams.get('days') || '30')
    };

    const validatedQuery = PriceHistorySchema.parse(query);

    // Get mock price history (in production, this would be real historical data)
    const history = MOCK_PRICE_HISTORY[validatedQuery.asin] || [];
    
    // Filter by days and region if needed
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - validatedQuery.days);
    
    const filteredHistory = history.filter(entry => 
      new Date(entry.date) >= cutoffDate
    );

    // Calculate price statistics
    const prices = filteredHistory.map(entry => entry.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    const priceChange = prices.length >= 2 
      ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100
      : 0;

    logger.info('Price history retrieved', {
      asin: validatedQuery.asin,
      region: validatedQuery.region,
      dataPoints: filteredHistory.length
    });

    return NextResponse.json({
      success: true,
      data: {
        asin: validatedQuery.asin,
        region: validatedQuery.region,
        history: filteredHistory,
        statistics: {
          minPrice,
          maxPrice,
          avgPrice,
          priceChange,
          dataPoints: filteredHistory.length
        },
        priceAlerts: {
          belowAverage: avgPrice * 0.9, // Alert if price drops 10% below average
          significantDrop: prices[0] * 0.95 // Alert if price drops 5% from first recorded
        }
      }
    });

  } catch (error) {
    logger.error('Price history API failed', { error: error.message });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve price history'
    }, { status: 500 });
  }
}

/**
 * Get mock price data for a specific region (replace with real Amazon PA-API calls)
 */
function getMockPriceForRegion(asin: string, region: string): { price: number; currency: string; availability: string } | null {
  const mockPricing: Record<string, Record<string, { price: number; currency: string; availability: string }>> = {
    'B08N5WRWNW': {
      'US': { price: 4.99, currency: 'USD', availability: 'in-stock' },
      'UK': { price: 3.99, currency: 'GBP', availability: 'in-stock' },
      'DE': { price: 4.29, currency: 'EUR', availability: 'in-stock' },
      'FR': { price: 4.49, currency: 'EUR', availability: 'limited' },
      'NL': { price: 4.39, currency: 'EUR', availability: 'in-stock' },
      'CA': { price: 6.99, currency: 'CAD', availability: 'in-stock' },
      'AU': { price: 7.99, currency: 'AUD', availability: 'pre-order' },
      'JP': { price: 599, currency: 'JPY', availability: 'in-stock' }
    },
    'B09X4R5TEST': {
      'US': { price: 5.49, currency: 'USD', availability: 'in-stock' },
      'UK': { price: 4.29, currency: 'GBP', availability: 'in-stock' },
      'DE': { price: 4.99, currency: 'EUR', availability: 'in-stock' },
      'FR': { price: 5.19, currency: 'EUR', availability: 'in-stock' },
      'NL': { price: 3.99, currency: 'EUR', availability: 'in-stock' },
      'CA': { price: 7.49, currency: 'CAD', availability: 'limited' },
      'AU': { price: 8.99, currency: 'AUD', availability: 'in-stock' },
      'JP': { price: 649, currency: 'JPY', availability: 'out-of-stock' }
    }
  };

  return mockPricing[asin]?.[region] || null;
}

/**
 * Generate price alerts based on current data
 */
function generatePriceAlerts(pricingData: any[]): Array<{
  asin: string;
  type: 'price-drop' | 'best-price' | 'limited-availability';
  message: string;
  urgency: 'low' | 'medium' | 'high';
}> {
  const alerts = [];

  for (const product of pricingData) {
    // Price drop alert
    if (product.priceChange.direction === 'down' && product.priceChange.percentage > 5) {
      alerts.push({
        asin: product.asin,
        type: 'price-drop' as const,
        message: `Price dropped ${product.priceChange.percentage.toFixed(1)}% - save now!`,
        urgency: product.priceChange.percentage > 10 ? 'high' : 'medium'
      });
    }

    // Best price alert
    if (product.regionalPrices.length > 1) {
      const bestPrice = product.regionalPrices[0];
      const worstPrice = product.regionalPrices[product.regionalPrices.length - 1];
      const savings = ((worstPrice.convertedPrice - bestPrice.convertedPrice) / worstPrice.convertedPrice) * 100;
      
      if (savings > 15) {
        alerts.push({
          asin: product.asin,
          type: 'best-price' as const,
          message: `Best price in ${bestPrice.region} - save ${savings.toFixed(1)}%!`,
          urgency: 'medium'
        });
      }
    }

    // Limited availability alert
    const limitedItems = product.regionalPrices.filter(p => p.availability === 'limited');
    if (limitedItems.length > 0) {
      alerts.push({
        asin: product.asin,
        type: 'limited-availability' as const,
        message: `Limited stock available in ${limitedItems.map(p => p.region).join(', ')}`,
        urgency: 'high'
      });
    }
  }

  return alerts;
}

/**
 * Find best deals across all products
 */
function findBestDeals(pricingData: any[]): Array<{
  asin: string;
  bestPrice: number;
  bestRegion: string;
  savings: number;
  originalPrice: number;
  url: string;
}> {
  const deals = [];

  for (const product of pricingData) {
    if (product.regionalPrices.length > 1) {
      const bestPrice = product.regionalPrices[0];
      const averagePrice = product.regionalPrices.reduce((sum, p) => sum + p.convertedPrice, 0) / product.regionalPrices.length;
      const savings = ((averagePrice - bestPrice.convertedPrice) / averagePrice) * 100;
      
      if (savings > 10) {
        deals.push({
          asin: product.asin,
          bestPrice: bestPrice.convertedPrice,
          bestRegion: bestPrice.region,
          savings,
          originalPrice: product.currentPrice,
          url: bestPrice.url
        });
      }
    }
  }

  return deals.sort((a, b) => b.savings - a.savings).slice(0, 10);
}