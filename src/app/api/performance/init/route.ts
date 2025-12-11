/**
 * Performance Optimization Initialization API
 * Initializes global performance optimizations for scale
 */

import { NextRequest, NextResponse } from 'next/server';
import { globalPerformanceIntegration } from '@/lib/performance/global-performance-integration';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType, region, configuration } = body;

    logger.info('Performance optimization initialization requested', {
      testType,
      region,
      hasConfiguration: !!configuration
    });

    // Initialize the global performance integration
    if (!globalPerformanceIntegration) {
      throw new Error('Global performance integration not available');
    }

    let result;

    switch (testType) {
      case 'init':
        // Initialize all performance optimizations
        await globalPerformanceIntegration.initialize();
        result = { status: 'initialized', message: 'Global performance optimization initialized' };
        break;

      case 'status':
        // Get current performance status
        result = await globalPerformanceIntegration.getPerformanceStatus();
        break;

      case 'optimize-region':
        // Optimize for specific region
        if (!region) {
          throw new Error('Region parameter required for regional optimization');
        }
        await globalPerformanceIntegration.optimizeForRegion(region);
        result = { status: 'optimized', region, message: `Performance optimized for region: ${region}` };
        break;

      case 'performance-test':
        // Run performance test
        const { test: performanceTestType } = body;
        result = await globalPerformanceIntegration.runPerformanceTest(performanceTestType);
        break;

      default:
        throw new Error(`Unknown test type: ${testType}`);
    }

    logger.info('Performance optimization completed successfully', {
      testType,
      result: { ...result, timestamp: new Date().toISOString() }
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: result
    });

  } catch (error) {
    logger.error('Performance optimization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current performance status
    const status = await globalPerformanceIntegration.getPerformanceStatus();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: status
    });

  } catch (error) {
    logger.error('Failed to get performance status', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}