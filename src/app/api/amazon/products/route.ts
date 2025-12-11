/**
 * Amazon Product API - Product Search and Retrieval
 * 
 * Provides comprehensive product search and retrieval functionality
 * for Amazon products across all supported regions with affiliate integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { amazonURLGenerator } from '../../../lib/amazon-regional';
import { getUserLocation } from '../../../lib/geolocation';
import { AmazonProduct } from '../../../lib/types';
import { logger } from '../../../lib/logger';

// Validation schema for product search
const ProductSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  region: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }).optional(),
  sortBy: z.enum(['relevance', 'price-low', 'price-high', 'rating', 'newest']).optional(),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0)
});

const ProductLookupSchema = z.object({
  asin: z.string().min(1, 'ASIN is required'),
  region: z.string().optional()
});

/**
 * Mock Amazon product database (in production, this would be replaced with real Amazon PA-API calls)
 */
const MOCK_PRODUCTS: AmazonProduct[] = [
  {
    asin: 'B08N5WRWNW',
    region: 'US',
    price: 4.99,
    currency: 'USD',
    availability: 'in-stock',
    affiliateUrl: 'https://amazon.com/dp/B08N5WRWNW?tag=yourtag-20',
    rating: 4.5,
    brand: 'Red Bull',
    title: 'Red Bull Energy Drink, 8.4 Fl Oz (24 Pack)',
    imageUrl: 'https://example.com/red-bull-24pack.jpg'
  },
  {
    asin: 'B09X4R5TEST',
    region: 'NL',
    price: 3.99,
    currency: 'EUR',
    availability: 'in-stock',
    affiliateUrl: 'https://amazon.nl/dp/B09X4R5TEST?tag=yourtag-24',
    rating: 4.3,
    brand: 'Monster Energy',
    title: 'Monster Energy Ultra, 500ml (24 Pack)',
    imageUrl: 'https://example.com/monster-24pack.jpg'
  },
  {
    asin: 'B07Y8RTEST',
    region: 'DE',
    price: 4.29,
    currency: 'EUR',
    availability: 'in-stock',
    affiliateUrl: 'https://amazon.de/dp/B07Y8RTEST?tag=yourtag-22',
    rating: 4.7,
    brand: 'Rockstar',
    title: 'Rockstar Energy Drink, 500ml (12 Pack)',
    imageUrl: 'https://example.com/rockstar-12pack.jpg'
  }
];

/**
 * Search for Amazon products
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedQuery = ProductSearchSchema.parse(body);

    // Get user's location for regional recommendations
    const userLocation = await getUserLocation();
    const searchRegion = validatedQuery.region || userLocation.country || 'US';

    // Generate search URL for the region
    const searchUrl = await amazonURLGenerator.generateSearchURL(searchRegion, {
      searchQuery: validatedQuery.query,
      category: validatedQuery.category,
      brand: validatedQuery.brand,
      priceRange: validatedQuery.priceRange,
      sortBy: validatedQuery.sortBy
    });

    // In a real implementation, you would make actual Amazon PA-API calls here
    // For now, we'll filter mock products based on search criteria
    let results = MOCK_PRODUCTS.filter(product => {
      const matchesQuery = product.title.toLowerCase().includes(validatedQuery.query.toLowerCase()) ||
                           product.brand?.toLowerCase().includes(validatedQuery.query.toLowerCase());
      const matchesRegion = product.region === searchRegion;
      
      return matchesQuery && matchesRegion;
    });

    // Apply pagination
    const paginatedResults = results.slice(
      validatedQuery.offset,
      validatedQuery.offset + validatedQuery.limit
    );

    // Generate regional URLs for each product
    const productsWithUrls = await Promise.all(
      paginatedResults.map(async (product) => ({
        ...product,
        affiliateUrl: await amazonURLGenerator.generateProductURL(product.asin, searchRegion),
        searchUrl
      }))
    );

    logger.info('Product search completed', {
      query: validatedQuery.query,
      region: searchRegion,
      resultsCount: productsWithUrls.length
    });

    return NextResponse.json({
      success: true,
      data: {
        products: productsWithUrls,
        searchUrl,
        region: searchRegion,
        totalResults: results.length,
        pagination: {
          offset: validatedQuery.offset,
          limit: validatedQuery.limit,
          hasMore: validatedQuery.offset + validatedQuery.limit < results.length
        }
      }
    });

  } catch (error) {
    logger.error('Product search failed', { error: error.message });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Product search failed'
    }, { status: 500 });
  }
}

/**
 * Get specific product by ASIN
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = {
      asin: searchParams.get('asin'),
      region: searchParams.get('region') || undefined
    };

    const validatedQuery = ProductLookupSchema.parse(query);

    // Get user location for regional recommendations
    const userLocation = await getUserLocation();
    const lookupRegion = validatedQuery.region || userLocation.country || 'US';

    // Find product in mock database
    const product = MOCK_PRODUCTS.find(p => 
      p.asin === validatedQuery.asin && p.region === lookupRegion
    );

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }

    // Generate regional URLs
    const productUrl = await amazonURLGenerator.generateProductURL(
      product.asin, 
      lookupRegion
    );

    // Get price comparison across regions
    const priceComparison = await amazonURLGenerator.getRegionalPriceComparison(product);

    logger.info('Product lookup completed', {
      asin: validatedQuery.asin,
      region: lookupRegion
    });

    return NextResponse.json({
      success: true,
      data: {
        product: {
          ...product,
          affiliateUrl: productUrl
        },
        priceComparison,
        availableRegions: [lookupRegion],
        searchUrl: await amazonURLGenerator.generateSearchURL(lookupRegion, {
          searchQuery: product.brand || product.title
        })
      }
    });

  } catch (error) {
    logger.error('Product lookup failed', { error: error.message });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Product lookup failed'
    }, { status: 500 });
  }
}