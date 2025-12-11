import { NextRequest, NextResponse } from 'next/server';
import { optimizedDataService } from '@/lib/optimized-data-service';
import { logger } from '@/lib/logger';

// Enhanced Search API with intelligent caching and result ranking
export async function GET(request: NextRequest) {
  try {
    const startTime = performance.now();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const types = searchParams.get('types')?.split(',') || ['flavors', 'ingredients', 'suppliers'];
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Validate search types
    const validTypes = ['flavors', 'ingredients', 'suppliers'];
    const filteredTypes = types.filter(type => validTypes.includes(type));

    if (filteredTypes.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid search type is required (flavors, ingredients, suppliers)' },
        { status: 400 }
      );
    }

    // Get search results from optimized service
    const results = await optimizedDataService.search(query, {
      types: filteredTypes as ('flavors' | 'ingredients' | 'suppliers')[],
      limit
    });

    // Enhance results with relevance scoring
    const enhancedResults = {
      ...results,
      query,
      searchTime: performance.now() - startTime,
      relevanceScores: {
        flavors: results.flavors.map(flavor => ({
          id: flavor.id,
          score: calculateRelevanceScore(query, flavor)
        })),
        ingredients: results.ingredients.map(ingredient => ({
          id: ingredient.id,
          score: calculateRelevanceScore(query, ingredient)
        })),
        suppliers: results.suppliers.map(supplier => ({
          id: supplier.id,
          score: calculateRelevanceScore(query, supplier)
        }))
      }
    };

    const responseTime = performance.now() - startTime;
    
    // Log performance metrics
    logger.info('Search API request', {
      query,
      types: filteredTypes,
      limit,
      responseTime: Math.round(responseTime),
      totalResults: results.totalResults
    });

    // Create response with performance headers
    const response = NextResponse.json(enhancedResults, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', // 1 hour, 1 day stale
        'X-Response-Time': `${Math.round(responseTime)}ms`,
        'X-Total-Results': results.totalResults.toString(),
        'X-Search-Time': `${Math.round(responseTime)}ms`,
        'X-Query-Length': query.length.toString()
      }
    });

    return response;
  } catch (error) {
    logger.error('Search API error', error);
    return NextResponse.json(
      { error: 'Search failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Relevance scoring algorithm
function calculateRelevanceScore(query: string, item: any): number {
  const queryLower = query.toLowerCase();
  let score = 0;
  
  // Name/title match (highest weight)
  if (item.name && item.name.toLowerCase().includes(queryLower)) {
    score += 10;
    if (item.name.toLowerCase().startsWith(queryLower)) {
      score += 5; // Bonus for starts with
    }
  }
  
  // Description match (medium weight)
  if (item.description && item.description.toLowerCase().includes(queryLower)) {
    score += 5;
  }
  
  // Category match (medium weight)
  if (item.category && item.category.toLowerCase().includes(queryLower)) {
    score += 3;
  }
  
  // Ingredient match (for flavors)
  if (item.ingredients && Array.isArray(item.ingredients)) {
    const ingredientMatch = item.ingredients.find((ing: string) => 
      ing.toLowerCase().includes(queryLower)
    );
    if (ingredientMatch) {
      score += 7;
    }
  }
  
  // Supplier/brand match (for suppliers)
  if (item.brand && item.brand.toLowerCase().includes(queryLower)) {
    score += 6;
  }
  
  // Caffeine range relevance (for flavors)
  if (item.caffeine) {
    const caffeineQuery = query.toLowerCase();
    if (caffeineQuery.includes('low') && item.caffeine < 50) score += 2;
    if (caffeineQuery.includes('medium') && item.caffeine >= 50 && item.caffeine <= 100) score += 2;
    if (caffeineQuery.includes('high') && item.caffeine > 100) score += 2;
  }
  
  return Math.min(score, 20); // Cap at 20
}