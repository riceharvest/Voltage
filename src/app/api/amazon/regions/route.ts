/**
 * Amazon Regions API - Regional Configuration Management
 * 
 * Provides comprehensive regional configuration data for Amazon affiliate integration,
 * including compliance settings, supported currencies, and localizations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserLocation, getAvailableAmazonRegions } from '../../../lib/geolocation';
import { amazonURLGenerator } from '../../../lib/amazon-regional';
import amazonRegions from '../../../data/suppliers/amazon-regions.json';
import { logger } from '../../../lib/logger';

// Validation schema
const RegionRequestSchema = z.object({
  countryCode: z.string().optional(),
  includeRecommendations: z.boolean().default(true),
  includeCompliance: z.boolean().default(true)
});

/**
 * Get regional configuration for Amazon integration
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = {
      countryCode: searchParams.get('countryCode') || undefined,
      includeRecommendations: searchParams.get('includeRecommendations') !== 'false',
      includeCompliance: searchParams.get('includeCompliance') !== 'false'
    };

    const validatedQuery = RegionRequestSchema.parse(query);

    // Get user location for regional recommendations
    const userLocation = validatedQuery.countryCode 
      ? { country: validatedQuery.countryCode }
      : await getUserLocation();

    const userCountry = userLocation.country || 'US';

    // Get recommended regions based on user location
    const recommendedRegions = validatedQuery.includeRecommendations 
      ? getRecommendedRegions(userCountry)
      : [];

    // Get all available regions
    const allRegions = amazonURLGenerator.getAllRegions();

    // Format regions with additional metadata
    const formattedRegions = Object.entries(allRegions).map(([code, region]) => ({
      code,
      name: region.name,
      domain: region.domain,
      currency: region.currency,
      locale: region.locale,
      isRecommended: recommendedRegions.includes(code),
      isUserRegion: code === userCountry,
      affiliateTag: region.affiliateTag,
      compliance: validatedQuery.includeCompliance ? region.compliance : undefined,
      supportedLanguages: region.supportedLanguages,
      shippingRegions: region.shippingRegions,
      productCategories: region.productCategories
    }));

    // Sort regions: recommended first, then user region, then alphabetically
    const sortedRegions = formattedRegions.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      if (a.isUserRegion && !b.isUserRegion) return -1;
      if (!a.isUserRegion && b.isUserRegion) return 1;
      return a.name.localeCompare(b.name);
    });

    // Generate regional category URLs for each region
    const categoryUrls = await generateCategoryUrlsForRegions(sortedRegions);

    logger.info('Regions configuration retrieved', {
      userCountry,
      totalRegions: sortedRegions.length,
      recommendedRegions: recommendedRegions.length
    });

    return NextResponse.json({
      success: true,
      data: {
        regions: sortedRegions,
        userLocation: {
          country: userCountry,
          isEU: isEUCountry(userCountry),
          isGDPRApplicable: isEUCountry(userCountry)
        },
        recommendations: {
          primary: recommendedRegions[0] || 'US',
          alternatives: recommendedRegions.slice(1),
          fallback: 'US'
        },
        categoryUrls,
        globalSettings: amazonRegions.globalSettings,
        affiliateTracking: amazonRegions.affiliateTracking
      }
    });

  } catch (error) {
    logger.error('Regions API failed', { error: error.message });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve regional configuration'
    }, { status: 500 });
  }
}

/**
 * Get specific region configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { regionCode } = body;

    if (!regionCode) {
      return NextResponse.json({
        success: false,
        error: 'Region code is required'
      }, { status: 400 });
    }

    const regionConfig = amazonURLGenerator.getRegionConfig(regionCode);
    
    if (!regionConfig) {
      return NextResponse.json({
        success: false,
        error: 'Region not found'
      }, { status: 404 });
    }

    // Generate useful URLs for this region
    const urls = {
      grocery: amazonURLGenerator.generateCategoryURL(regionCode, 's?k=energy+drink&i=grocery'),
      health: amazonURLGenerator.generateCategoryURL(regionCode, 's?k=caffeine&i=health'),
      sports: amazonURLGenerator.generateCategoryURL(regionCode, 's?k=sports+drink&i=sports'),
      search: await amazonURLGenerator.generateSearchURL(regionCode, { searchQuery: 'energy drink' })
    };

    // Get recommended regions
    const userLocation = await getUserLocation();
    const recommendedRegions = amazonURLGenerator.getRecommendedRegions(userLocation.country);

    logger.info('Specific region configuration retrieved', {
      regionCode,
      userLocation: userLocation.country
    });

    return NextResponse.json({
      success: true,
      data: {
        region: {
          ...regionConfig,
          urls,
          isRecommended: recommendedRegions.includes(regionCode),
          isUserRegion: regionCode === userLocation.country
        },
        recommendations: {
          primary: recommendedRegions[0] || 'US',
          alternatives: recommendedRegions.slice(1),
          fallback: 'US'
        }
      }
    });

  } catch (error) {
    logger.error('Specific region retrieval failed', { error: error.message });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve region configuration'
    }, { status: 500 });
  }
}

/**
 * Get recommended regions based on user location
 */
function getRecommendedRegions(userCountry: string): string[] {
  return amazonURLGenerator.getRecommendedRegions(userCountry);
}

/**
 * Check if country is in EU
 */
function isEUCountry(countryCode: string): boolean {
  const euCountries = new Set([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
    'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
    'SI', 'ES', 'SE'
  ]);
  
  return euCountries.has(countryCode.toUpperCase());
}

/**
 * Generate category URLs for all regions
 */
async function generateCategoryUrlsForRegions(regions: any[]): Promise<Record<string, Record<string, string>>> {
  const categoryUrls: Record<string, Record<string, string>> = {};
  
  for (const region of regions) {
    const code = region.code;
    categoryUrls[code] = {
      grocery: amazonURLGenerator.generateCategoryURL(code, 's?k=energy+drink&i=grocery'),
      health: amazonURLGenerator.generateCategoryURL(code, 's?k=caffeine&i=health'),
      sports: amazonURLGenerator.generateCategoryURL(code, 's?k=sports+drink&i=sports'),
      search: await amazonURLGenerator.generateSearchURL(code, { searchQuery: 'energy drink' })
    };
  }
  
  return categoryUrls;
}