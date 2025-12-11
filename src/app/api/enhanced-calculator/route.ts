/**
 * Enhanced Calculator API Route
 * 
 * Comprehensive API endpoint for the enhanced calculator with all new features
 * including multi-mode calculations, batch scaling, Amazon integration,
 * cultural adaptations, and performance analytics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { EnhancedCalculatorService, CalculatorInput } from '@/lib/enhanced-calculator-service';
import { PerformanceAnalyticsService } from '@/lib/performance-analytics-service';
import { RateLimitService } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitService = new RateLimitService();
    const clientId = request.headers.get('x-client-id') || 'unknown';
    
    if (!rateLimitService.allowRequest(clientId, 'enhanced-calculation')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const calculatorInput: CalculatorInput = body.input;
    
    // Validate input
    if (!calculatorInput.targetFlavor) {
      return NextResponse.json(
        { error: 'Target flavor is required' },
        { status: 400 }
      );
    }

    // Initialize services
    const calculatorService = new EnhancedCalculatorService();
    const analyticsService = new PerformanceAnalyticsService();

    // Track calculation start
    const sessionId = request.headers.get('x-session-id') || crypto.randomUUID();
    const userId = request.headers.get('x-user-id') || undefined;
    
    const startTime = Date.now();
    
    // Perform enhanced calculation
    const result = await calculatorService.performEnhancedCalculation(calculatorInput);
    
    const responseTime = Date.now() - startTime;
    
    // Track analytics
    analyticsService.trackCalculation(sessionId, userId, calculatorInput, result, responseTime);
    
    // Track feature usage
    Object.entries(calculatorInput).forEach(([key, value]) => {
      if (key.startsWith('enable') || key.startsWith('use')) {
        const feature = key.replace(/^(enable|use)/, '').toLowerCase();
        if (value) {
          analyticsService.trackFeatureUsage(sessionId, userId, feature, 'enable');
        }
      }
    });

    // Track user interactions
    analyticsService.trackUserInteraction(sessionId, userId, 'calculator', 'submit', {
      category: calculatorInput.category,
      mode: calculatorInput.mode,
      featuresEnabled: Object.keys(calculatorInput).filter(key => 
        calculatorInput[key as keyof CalculatorInput] === true
      )
    });

    // Log successful calculation
    console.log(`Enhanced calculation completed for session ${sessionId}`, {
      category: calculatorInput.category,
      mode: calculatorInput.mode,
      responseTime,
      featuresUsed: Object.keys(result).filter(key => result[key] !== undefined)
    });

    return NextResponse.json({
      success: true,
      data: {
        result,
        metadata: {
          sessionId,
          responseTime,
          timestamp: Date.now(),
          version: '2.0.0'
        }
      }
    });

  } catch (error) {
    console.error('Enhanced calculator error:', error);
    
    // Track error in analytics
    const analyticsService = new PerformanceAnalyticsService();
    const sessionId = request.headers.get('x-session-id') || 'unknown';
    const userId = request.headers.get('x-user-id') || undefined;
    
    if (error instanceof Error) {
      analyticsService.trackError(sessionId, userId, error, 'enhanced-calculator-api');
    }

    return NextResponse.json(
      {
        error: 'Calculation failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Handle analytics and status requests
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    const analyticsService = new PerformanceAnalyticsService();
    
    switch (action) {
      case 'analytics':
        const period = parseInt(searchParams.get('period') || '24');
        const report = analyticsService.generateReport(period);
        return NextResponse.json({ success: true, data: report });
        
      case 'real-time':
        const realTimeData = analyticsService.getRealTimeData();
        return NextResponse.json({ success: true, data: realTimeData });
        
      case 'health':
        return NextResponse.json({
          success: true,
          data: {
            status: 'healthy',
            version: '2.0.0',
            features: [
              'multi-mode-calculator',
              'batch-optimization',
              'amazon-integration',
              'regional-adaptation',
              'cultural-customization',
              'performance-analytics',
              'mobile-optimization'
            ],
            timestamp: Date.now()
          }
        });
        
      case 'export':
        const format = searchParams.get('format') as 'json' | 'csv' || 'json';
        const exportedData = analyticsService.exportData(format);
        
        return new NextResponse(exportedData, {
          headers: {
            'Content-Type': format === 'json' ? 'application/json' : 'text/csv',
            'Content-Disposition': `attachment; filename="calculator-analytics.${format}"`
          }
        });
        
      default:
        return NextResponse.json({
          success: true,
          data: {
            message: 'Enhanced Calculator API',
            version: '2.0.0',
            endpoints: {
              'POST /api/enhanced-calculator': 'Perform enhanced calculation',
              'GET /api/enhanced-calculator?action=analytics&period=24': 'Get analytics report',
              'GET /api/enhanced-calculator?action=real-time': 'Get real-time monitoring data',
              'GET /api/enhanced-calculator?action=health': 'Check API health',
              'GET /api/enhanced-calculator?action=export&format=json': 'Export analytics data'
            },
            features: [
              'Multi-mode calculator (DIY, Premade, Hybrid)',
              'Advanced batch scaling and optimization',
              'Real-time Amazon pricing integration',
              'Cultural and regional adaptations',
              'Performance analytics and monitoring',
              'Mobile-optimized interface with haptic feedback'
            ]
          }
        });
    }
    
  } catch (error) {
    console.error('Enhanced calculator API error:', error);
    
    return NextResponse.json(
      {
        error: 'API request failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Reset analytics data (admin only)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const analyticsService = new PerformanceAnalyticsService();
    analyticsService.reset();
    
    return NextResponse.json({
      success: true,
      message: 'Analytics data reset successfully'
    });
    
  } catch (error) {
    console.error('Reset analytics error:', error);
    
    return NextResponse.json(
      {
        error: 'Reset failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}