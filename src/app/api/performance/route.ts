import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor, PerformanceOptimizer } from '@/lib/performance-monitor';
import { enhancedCache } from '@/lib/enhanced-cache';
import { logger } from '@/lib/logger';

// Performance monitoring and metrics API
export async function GET(request: NextRequest) {
  try {
    const startTime = performance.now();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const report = searchParams.get('report');
    const export = searchParams.get('export') === 'true';
    const optimize = searchParams.get('optimize') === 'true';
    const warm = searchParams.get('warm') === 'true';

    let result: any = {};

    // Handle cache warming request
    if (warm) {
      await PerformanceOptimizer.warmCache();
      result.warmingStatus = 'completed';
    }

    // Handle optimization request
    if (optimize) {
      PerformanceOptimizer.optimizeMemoryUsage();
      result.optimizationStatus = 'completed';
    }

    // Get performance report
    if (report === 'full') {
      const performanceReport = await performanceMonitor.getPerformanceReport();
      result.report = performanceReport;
    } else if (report === 'metrics') {
      const metrics = await performanceMonitor.exportMetrics();
      result.metrics = metrics;
    } else {
      // Default: basic performance stats
      const [cachePerf, apiPerf] = await Promise.all([
        performanceMonitor.monitorCachePerformance(),
        performanceMonitor.monitorApiPerformance()
      ]);
      
      result.cache = cachePerf;
      result.api = apiPerf;
      result.timestamp = Date.now();
    }

    // Export format for external monitoring
    if (export) {
      const exportedMetrics = await performanceMonitor.exportMetrics();
      result = exportedMetrics;
    }

    const responseTime = performance.now() - startTime;
    
    // Log performance monitoring request
    logger.info('Performance API request', {
      report,
      export,
      optimize,
      warm,
      responseTime: Math.round(responseTime)
    });

    // Create response with performance headers
    const response = NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-cache', // Always get fresh performance data
        'X-Response-Time': `${Math.round(responseTime)}ms`,
        'X-Performance-Report': report || 'basic'
      }
    });

    return response;
  } catch (error) {
    logger.error('Performance API error', error);
    return NextResponse.json(
      { 
        error: 'Performance monitoring failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Cache management endpoints
export async function POST(request: NextRequest) {
  try {
    const startTime = performance.now();
    
    const body = await request.json();
    const { action, key, pattern, ttl } = body;

    let result: any = {};

    switch (action) {
      case 'clear':
        await enhancedCache.invalidatePattern(pattern || '*');
        result.status = 'cache_cleared';
        result.pattern = pattern || '*';
        break;

      case 'delete':
        if (!key) {
          return NextResponse.json(
            { error: 'Key is required for delete action' },
            { status: 400 }
          );
        }
        await enhancedCache.del(key);
        result.status = 'key_deleted';
        result.key = key;
        break;

      case 'warm':
        await PerformanceOptimizer.warmCache();
        result.status = 'cache_warmed';
        break;

      case 'metrics':
        const metrics = await enhancedCache.getMetrics();
        result.metrics = metrics;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: clear, delete, warm, metrics' },
          { status: 400 }
        );
    }

    const responseTime = performance.now() - startTime;
    
    logger.info('Cache management request', {
      action,
      key,
      pattern,
      responseTime: Math.round(responseTime)
    });

    const response = NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-cache',
        'X-Response-Time': `${Math.round(responseTime)}ms`,
        'X-Action': action
      }
    });

    return response;
  } catch (error) {
    logger.error('Cache management API error', error);
    return NextResponse.json(
      { 
        error: 'Cache management failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}