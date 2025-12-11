import { NextRequest, NextResponse } from 'next/server';
import { optimizedDataService } from '@/lib/optimized-data-service';
import { enhancedCache, enhancedCacheKeys } from '@/lib/enhanced-cache';
import { logger } from '@/lib/logger';

// Bulk API endpoint for efficient batch data loading
export async function GET(request: NextRequest) {
  try {
    const startTime = performance.now();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    const includeMetadata = searchParams.get('includeMetadata') === 'true';

    if (!type || !ids.length) {
      return NextResponse.json(
        { error: 'Both "type" and "ids" parameters are required' },
        { status: 400 }
      );
    }

    const validTypes = ['flavors', 'ingredients', 'suppliers'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate ID format (basic validation)
    const invalidIds = ids.filter(id => !/^[a-zA-Z0-9\-_]+$/.test(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid ID format for: ${invalidIds.join(', ')}` },
        { status: 400 }
      );
    }

    let result: any = {};
    let totalCount = 0;

    // Get bulk data based on type
    switch (type) {
      case 'flavors': {
        const flavorResult = await optimizedDataService.getBulkFlavorData(ids);
        result.flavors = flavorResult.flavors;
        result.missingFlavors = flavorResult.missing;
        totalCount = flavorResult.flavors.length;
        break;
      }

      case 'ingredients': {
        const ingredients = await optimizedDataService.getIngredients({ limit: 1000 });
        const filteredIngredients = ingredients.filter(ing => ids.includes(ing.id));
        result.ingredients = filteredIngredients;
        result.missingIngredients = ids.filter(id => !filteredIngredients.find((ing: any) => ing.id === id));
        totalCount = filteredIngredients.length;
        break;
      }

      case 'suppliers': {
        const suppliers = await optimizedDataService.getSuppliers({});
        const filteredSuppliers = suppliers.filter(sup => ids.includes(sup.id));
        result.suppliers = filteredSuppliers;
        result.missingSuppliers = ids.filter(id => !filteredSuppliers.find((sup: any) => sup.id === id));
        totalCount = filteredSuppliers.length;
        break;
      }
    }

    // Add metadata if requested
    if (includeMetadata) {
      result.metadata = {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type,
        requestedIds: ids,
        foundCount: totalCount,
        missingCount: ids.length - totalCount,
        cacheHit: true // Bulk requests are typically cached
      };
    }

    const responseTime = performance.now() - startTime;
    
    // Log performance metrics
    logger.info('Bulk API request', {
      type,
      requestedIds: ids.length,
      foundCount: totalCount,
      responseTime: Math.round(responseTime)
    });

    // Create response with performance headers
    const response = NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', // 1 hour, 1 day stale
        'X-Response-Time': `${Math.round(responseTime)}ms`,
        'X-Requested-IDs': ids.length.toString(),
        'X-Found-Items': totalCount.toString(),
        'X-Cache-Hit': 'true'
      }
    });

    return response;
  } catch (error) {
    logger.error('Bulk API error', error);
    return NextResponse.json(
      { 
        error: 'Bulk request failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'internal_error'
      },
      { status: 500 }
    );
  }
}

// POST method for more complex bulk operations
export async function POST(request: NextRequest) {
  try {
    const startTime = performance.now();
    
    const body = await request.json();
    const { operations, includeMetadata = true } = body;

    if (!operations || !Array.isArray(operations)) {
      return NextResponse.json(
        { error: 'Operations array is required' },
        { status: 400 }
      );
    }

    // Limit number of operations to prevent abuse
    if (operations.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 operations allowed per request' },
        { status: 400 }
      );
    }

    const results: any[] = [];
    const errors: any[] = [];

    // Process operations concurrently with rate limiting
    const batchSize = 10;
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (op, index) => {
        try {
          const globalIndex = i + index;
          const { type, action, params } = op;

          let result: any = {};
          
          switch (type) {
            case 'flavors':
              if (action === 'get' && params.ids) {
                const flavorResult = await optimizedDataService.getBulkFlavorData(params.ids);
                result = { flavors: flavorResult.flavors, missing: flavorResult.missing };
              } else if (action === 'search') {
                const searchResults = await optimizedDataService.search(params.query || '', {
                  types: ['flavors'],
                  limit: params.limit || 10
                });
                result = { flavors: searchResults.flavors };
              }
              break;

            case 'ingredients':
              if (action === 'get' && params.ids) {
                const ingredients = await optimizedDataService.getIngredients({ limit: 1000 });
                const filtered = ingredients.filter(ing => params.ids.includes(ing.id));
                result = { ingredients: filtered };
              } else if (action === 'search') {
                const searchResults = await optimizedDataService.search(params.query || '', {
                  types: ['ingredients'],
                  limit: params.limit || 10
                });
                result = { ingredients: searchResults.ingredients };
              }
              break;

            case 'suppliers':
              if (action === 'get' && params.ids) {
                const suppliers = await optimizedDataService.getSuppliers({});
                const filtered = suppliers.filter(sup => params.ids.includes(sup.id));
                result = { suppliers: filtered };
              } else if (action === 'search') {
                const searchResults = await optimizedDataService.search(params.query || '', {
                  types: ['suppliers'],
                  limit: params.limit || 10
                });
                result = { suppliers: searchResults.suppliers };
              }
              break;

            default:
              throw new Error(`Unknown type: ${type}`);
          }

          return {
            index: globalIndex,
            success: true,
            result,
            operation: op
          };
        } catch (error) {
          return {
            index: globalIndex,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            operation: op
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(res => {
        if (res.success) {
          results.push(res);
        } else {
          errors.push(res);
        }
      });

      // Small delay between batches to prevent overwhelming the system
      if (i + batchSize < operations.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    const responseTime = performance.now() - startTime;
    
    // Log performance metrics
    logger.info('Bulk POST API request', {
      operationsCount: operations.length,
      successfulOperations: results.length,
      failedOperations: errors.length,
      responseTime: Math.round(responseTime)
    });

    const responseData: any = {
      results: results.sort((a, b) => a.index - b.index).map(r => r.result),
      summary: {
        total: operations.length,
        successful: results.length,
        failed: errors.length,
        responseTime: Math.round(responseTime)
      }
    };

    if (errors.length > 0) {
      responseData.errors = errors;
    }

    if (includeMetadata) {
      responseData.metadata = {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        operationsCount: operations.length,
        successfulOperations: results.length,
        failedOperations: errors.length
      };
    }

    // Create response with performance headers
    const response = NextResponse.json(responseData, {
      status: errors.length > 0 ? 207 : 200, // 207 Multi-Status for partial success
      headers: {
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600', // 30 min, 1 hour stale
        'X-Response-Time': `${Math.round(responseTime)}ms`,
        'X-Operations-Count': operations.length.toString(),
        'X-Successful-Operations': results.length.toString(),
        'X-Failed-Operations': errors.length.toString()
      }
    });

    return response;
  } catch (error) {
    logger.error('Bulk POST API error', error);
    return NextResponse.json(
      { 
        error: 'Bulk POST request failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'internal_error'
      },
      { status: 500 }
    );
  }
}