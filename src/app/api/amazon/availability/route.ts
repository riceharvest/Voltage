/**
 * Amazon Availability API - Stock Availability Checking
 * 
 * Provides real-time stock availability information for Amazon products
 * across all supported regions with fallback handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { amazonURLGenerator } from '../../../lib/amazon-regional';
import { logger } from '../../../lib/logger';

// Validation schema
const AvailabilityRequestSchema = z.object({
  asins: z.array(z.string().min(1)).min(1).max(50),
  regions: z.array(z.string()).optional(),
  checkAlternatives: z.boolean().default(true)
});

const StockAlertSchema = z.object({
  asin: z.string().min(1),
  region: z.string(),
  threshold: z.number().min(0).max(100).default(5),
  email: z.string().email().optional(),
  webhook: z.string().url().optional()
});

/**
 * Mock stock availability database (in production, this would be real Amazon PA-API data)
 */
const MOCK_AVAILABILITY: Record<string, Record<string, {
  status: 'in-stock' | 'out-of-stock' | 'limited' | 'pre-order' | 'discontinued';
  stockLevel?: number;
  restockDate?: string;
  fulfillmentType: 'FBA' | 'FBM' | 'FBM-prime';
  sellerCount: number;
  shippingOptions: string[];
  priceStability: 'stable' | 'fluctuating' | 'increasing';
}>> = {
  'B08N5WRWNW': {
    'US': {
      status: 'in-stock',
      stockLevel: 50,
      fulfillmentType: 'FBA',
      sellerCount: 15,
      shippingOptions: ['Same-day', 'Next-day', 'Standard'],
      priceStability: 'stable'
    },
    'UK': {
      status: 'limited',
      stockLevel: 3,
      fulfillmentType: 'FBA',
      sellerCount: 8,
      shippingOptions: ['Next-day', 'Standard'],
      priceStability: 'fluctuating'
    },
    'DE': {
      status: 'in-stock',
      stockLevel: 25,
      fulfillmentType: 'FBA',
      sellerCount: 12,
      shippingOptions: ['Next-day', 'Standard', 'Economy'],
      priceStability: 'stable'
    },
    'FR': {
      status: 'limited',
      stockLevel: 7,
      fulfillmentType: 'FBM',
      sellerCount: 6,
      shippingOptions: ['Standard', 'Economy'],
      priceStability: 'increasing'
    },
    'NL': {
      status: 'in-stock',
      stockLevel: 15,
      fulfillmentType: 'FBA',
      sellerCount: 4,
      shippingOptions: ['Next-day', 'Standard'],
      priceStability: 'stable'
    }
  },
  'B09X4R5TEST': {
    'US': {
      status: 'out-of-stock',
      restockDate: '2024-03-15',
      fulfillmentType: 'FBA',
      sellerCount: 20,
      shippingOptions: ['Standard'],
      priceStability: 'stable'
    },
    'UK': {
      status: 'pre-order',
      restockDate: '2024-03-01',
      fulfillmentType: 'FBM',
      sellerCount: 3,
      shippingOptions: ['Standard'],
      priceStability: 'stable'
    },
    'DE': {
      status: 'in-stock',
      stockLevel: 30,
      fulfillmentType: 'FBA',
      sellerCount: 10,
      shippingOptions: ['Next-day', 'Standard'],
      priceStability: 'stable'
    }
  }
};

/**
 * Get stock availability for products
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedQuery = AvailabilityRequestSchema.parse(body);

    const regions = validatedQuery.regions || ['US', 'UK', 'DE', 'FR', 'NL', 'CA', 'AU', 'JP'];

    const availabilityData = [];

    for (const asin of validatedQuery.asins) {
      const productAvailability = {
        asin,
        totalStock: 0,
        availabilityByRegion: {} as Record<string, any>,
        alternatives: [] as Array<{
          asin: string;
          region: string;
          status: string;
          price?: number;
          similarity: number;
        }>,
        restockPredictions: [] as Array<{
          region: string;
          predictedDate: string;
          confidence: number;
        }>,
        urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
      };

      // Check availability in each region
      for (const region of regions) {
        const regionData = getMockAvailability(asin, region);
        
        if (regionData) {
          productAvailability.availabilityByRegion[region] = {
            status: regionData.status,
            stockLevel: regionData.stockLevel,
            fulfillmentType: regionData.fulfillmentType,
            sellerCount: regionData.sellerCount,
            shippingOptions: regionData.shippingOptions,
            priceStability: regionData.priceStability,
            restockDate: regionData.restockDate,
            url: await amazonURLGenerator.generateProductURL(asin, region)
          };

          // Add to total stock if in-stock
          if (regionData.status === 'in-stock' && regionData.stockLevel) {
            productAvailability.totalStock += regionData.stockLevel;
          }
        } else {
          // No data available for this region/ASIN combination
          productAvailability.availabilityByRegion[region] = {
            status: 'unknown',
            fulfillmentType: 'unknown',
            sellerCount: 0,
            shippingOptions: [],
            priceStability: 'stable',
            url: await amazonURLGenerator.generateProductURL(asin, region)
          };
        }
      }

      // Find alternative products if requested
      if (validatedQuery.checkAlternatives) {
        productAvailability.alternatives = await findAlternativeProducts(asin, regions);
      }

      // Generate restock predictions
      productAvailability.restockPredictions = generateRestockPredictions(asin, productAvailability.availabilityByRegion);

      // Determine urgency level
      productAvailability.urgencyLevel = determineUrgencyLevel(productAvailability);

      availabilityData.push(productAvailability);
    }

    logger.info('Availability data retrieved', {
      asins: validatedQuery.asins,
      regions,
      productsProcessed: availabilityData.length
    });

    return NextResponse.json({
      success: true,
      data: {
        availability: availabilityData,
        summary: generateAvailabilitySummary(availabilityData),
        alerts: generateAvailabilityAlerts(availabilityData),
        recommendations: generateRecommendations(availabilityData)
      }
    });

  } catch (error) {
    logger.error('Availability API failed', { error: error.message });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve availability data'
    }, { status: 500 });
  }
}

/**
 * Set up stock alerts for products
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedQuery = StockAlertSchema.parse(body);

    // In a real implementation, you would store this in a database
    // and set up monitoring for stock level changes
    
    const alertConfig = {
      asin: validatedQuery.asin,
      region: validatedQuery.region,
      threshold: validatedQuery.threshold,
      email: validatedQuery.email,
      webhook: validatedQuery.webhook,
      createdAt: new Date().toISOString(),
      active: true
    };

    logger.info('Stock alert configured', {
      asin: validatedQuery.asin,
      region: validatedQuery.region,
      threshold: validatedQuery.threshold
    });

    return NextResponse.json({
      success: true,
      data: {
        alert: alertConfig,
        message: 'Stock alert configured successfully'
      }
    });

  } catch (error) {
    logger.error('Stock alert configuration failed', { error: error.message });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to configure stock alert'
    }, { status: 500 });
  }
}

/**
 * Get mock availability data for a specific region
 */
function getMockAvailability(asin: string, region: string) {
  return MOCK_AVAILABILITY[asin]?.[region] || null;
}

/**
 * Find alternative products for out-of-stock items
 */
async function findAlternativeProducts(originalAsin: string, regions: string[]) {
  const alternatives = [];

  // Mock alternative products
  const mockAlternatives = [
    {
      asin: 'B08N5WRWNW-alt1',
      region: 'US',
      status: 'in-stock',
      price: 5.49,
      similarity: 0.9
    },
    {
      asin: 'B08N5WRWNW-alt2',
      region: 'UK',
      status: 'in-stock',
      price: 4.29,
      similarity: 0.85
    }
  ];

  for (const alt of mockAlternatives) {
    if (regions.includes(alt.region)) {
      alternatives.push({
        ...alt,
        url: await amazonURLGenerator.generateProductURL(alt.asin, alt.region)
      });
    }
  }

  return alternatives;
}

/**
 * Generate restock predictions based on historical data
 */
function generateRestockPredictions(asin: string, availabilityByRegion: Record<string, any>) {
  const predictions = [];

  for (const [region, data] of Object.entries(availabilityByRegion)) {
    if (data.status === 'out-of-stock' && data.restockDate) {
      // Simple prediction based on restock date
      const confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence
      
      predictions.push({
        region,
        predictedDate: data.restockDate,
        confidence
      });
    } else if (data.status === 'limited' && data.stockLevel && data.stockLevel < 10) {
      // Predict restock for low stock items
      const predictedDate = new Date();
      predictedDate.setDate(predictedDate.getDate() + Math.floor(Math.random() * 14) + 7); // 7-21 days
      
      predictions.push({
        region,
        predictedDate: predictedDate.toISOString().split('T')[0],
        confidence: 0.6 // Lower confidence for predictions
      });
    }
  }

  return predictions;
}

/**
 * Determine urgency level based on availability data
 */
function determineUrgencyLevel(productAvailability: any): 'low' | 'medium' | 'high' | 'critical' {
  const { totalStock, availabilityByRegion } = productAvailability;
  
  // Critical: no stock anywhere
  if (totalStock === 0) {
    return 'critical';
  }
  
  // High: very low total stock and limited availability
  if (totalStock < 10) {
    return 'high';
  }
  
  // Medium: moderate stock levels
  if (totalStock < 50) {
    return 'medium';
  }
  
  // Low: good stock levels
  return 'low';
}

/**
 * Generate availability summary
 */
function generateAvailabilitySummary(availabilityData: any[]) {
  const summary = {
    totalProducts: availabilityData.length,
    inStock: 0,
    outOfStock: 0,
    limited: 0,
    preOrder: 0,
    totalStock: 0
  };

  for (const product of availabilityData) {
    for (const regionData of Object.values(product.availabilityByRegion)) {
      switch (regionData.status) {
        case 'in-stock':
          summary.inStock++;
          if (regionData.stockLevel) {
            summary.totalStock += regionData.stockLevel;
          }
          break;
        case 'out-of-stock':
          summary.outOfStock++;
          break;
        case 'limited':
          summary.limited++;
          if (regionData.stockLevel) {
            summary.totalStock += regionData.stockLevel;
          }
          break;
        case 'pre-order':
          summary.preOrder++;
          break;
      }
    }
  }

  return summary;
}

/**
 * Generate availability alerts
 */
function generateAvailabilityAlerts(availabilityData: any[]) {
  const alerts = [];

  for (const product of availabilityData) {
    if (product.urgencyLevel === 'critical') {
      alerts.push({
        type: 'out-of-stock',
        severity: 'critical',
        message: `${product.asin} is out of stock in all regions`,
        asin: product.asin
      });
    } else if (product.urgencyLevel === 'high') {
      alerts.push({
        type: 'low-stock',
        severity: 'high',
        message: `${product.asin} has very limited stock (${product.totalStock} units)`,
        asin: product.asin
      });
    }

    // Check for limited stock alerts
    for (const [region, data] of Object.entries(product.availabilityByRegion)) {
      if (data.status === 'limited' && data.stockLevel && data.stockLevel < 5) {
        alerts.push({
          type: 'limited-stock',
          severity: 'medium',
          message: `${product.asin} has only ${data.stockLevel} units left in ${region}`,
          asin: product.asin,
          region
        });
      }
    }
  }

  return alerts;
}

/**
 * Generate purchasing recommendations
 */
function generateRecommendations(availabilityData: any[]) {
  const recommendations = [];

  for (const product of availabilityData) {
    const inStockRegions = Object.entries(product.availabilityByRegion)
      .filter(([_, data]) => data.status === 'in-stock')
      .sort(([_, a], [__, b]) => (b.stockLevel || 0) - (a.stockLevel || 0));

    if (inStockRegions.length > 0) {
      const [bestRegion, bestData] = inStockRegions[0];
      
      recommendations.push({
        asin: product.asin,
        recommendation: 'available-now',
        region: bestRegion,
        reason: `In stock with ${bestData.stockLevel || 'unknown'} units available`,
        urgency: product.urgencyLevel,
        url: bestData.url
      });
    } else if (product.alternatives.length > 0) {
      const bestAlt = product.alternatives[0];
      
      recommendations.push({
        asin: product.asin,
        recommendation: 'alternative',
        alternative: bestAlt.asin,
        region: bestAlt.region,
        reason: 'Original product unavailable, consider alternative',
        urgency: product.urgencyLevel,
        url: bestAlt.url
      });
    }
  }

  return recommendations;
}