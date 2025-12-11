import { NextRequest, NextResponse } from 'next/server';
import { advancedSearchEngine } from '@/lib/search-engine';
import { logger } from '@/lib/logger';

/**
 * Enhanced Search API with comprehensive search and discovery features
 * 
 * Supports advanced filtering, flavor profile matching, visual search,
 * personalized recommendations, and intelligent suggestions across
 * recipes, ingredients, suppliers, and products.
 */
export async function POST(request: NextRequest) {
  try {
    const startTime = performance.now();
    const body = await request.json();
    
    const {
      query,
      filters,
      options = {},
      searchType = 'comprehensive'
    } = body;

    // Validate search parameters
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Log search request for analytics
    logger.info('Enhanced search request', {
      query,
      filters,
      searchType,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    // Perform search based on type
    let results;
    switch (searchType) {
      case 'visual':
        results = await advancedSearchEngine.performVisualSearch(query, options);
        break;
      case 'recommendations':
        results = await advancedSearchEngine.getPersonalizedRecommendations(query, options);
        break;
      case 'suggestions':
        const suggestions = await advancedSearchEngine.generateSuggestions(query, options.limit || 10);
        return NextResponse.json({
          suggestions,
          query,
          searchTime: performance.now() - startTime
        });
      default:
        results = await advancedSearchEngine.search({
          query,
          filters,
          ...options
        });
    }

    const responseTime = performance.now() - startTime;

    // Add performance headers
    const response = NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600', // 5 min cache
        'X-Response-Time': `${Math.round(responseTime)}ms`,
        'X-Search-Type': searchType,
        'X-Query-Length': query.length.toString(),
        'X-Results-Count': results.totalResults?.toString() || '0'
      }
    });

    // Log search completion
    logger.info('Enhanced search completed', {
      query,
      searchType,
      responseTime: Math.round(responseTime),
      resultsCount: results.totalResults || 0,
      success: true
    });

    return response;
  } catch (error) {
    logger.error('Enhanced search error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for simple search queries
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = performance.now();
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const caffeine = searchParams.get('caffeine');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const sortBy = searchParams.get('sort') || 'relevance';
    const sortOrder = searchParams.get('order') || 'desc';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Build filters from query parameters
    const filters: any = {};
    if (category) filters.categories = [category];
    if (caffeine) filters.caffeineLevels = [caffeine];

    // Perform search
    const results = await advancedSearchEngine.search({
      query,
      filters,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      limit
    });

    const responseTime = performance.now() - startTime;

    return NextResponse.json({
      ...results,
      responseTime,
      query,
      parameters: { category, caffeine, limit, sortBy, sortOrder }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
        'X-Response-Time': `${Math.round(responseTime)}ms`
      }
    });
  } catch (error) {
    logger.error('GET search error', error);
    return NextResponse.json(
      { error: 'Search failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}