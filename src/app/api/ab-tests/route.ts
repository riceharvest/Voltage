import { NextRequest, NextResponse } from 'next/server';
import { abTestConfig, EnhancedABTest } from '@/lib/enhanced-ab-testing';

/**
 * A/B Test Management API Endpoints
 * 
 * Provides RESTful API for managing A/B tests with enhanced features:
 * - Dynamic configuration management
 * - Integration with feature flags
 * - Statistical tracking and analysis
 * - GDPR-compliant data handling
 */

// GET /api/ab-tests - List all A/B tests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Filter by status
    const activeOnly = searchParams.get('active') === 'true';

    let tests: EnhancedABTest[];
    
    if (activeOnly) {
      tests = abTestConfig.getActiveTests();
    } else {
      // In production, this would load from database
      // For now, return all configured tests
      tests = Array.from((abTestConfig as any).tests?.values() || []);
    }

    // Filter by status if specified
    if (status) {
      tests = tests.filter(test => test.status === status);
    }

    return NextResponse.json({
      success: true,
      data: tests,
      count: tests.length
    });

  } catch (error) {
    console.error('Error fetching A/B tests:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch A/B tests',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/ab-tests - Create new A/B test
export async function POST(request: NextRequest) {
  try {
    const testData = await request.json();
    
    // Validate required fields
    const requiredFields = ['id', 'name', 'variants'];
    const missingFields = requiredFields.filter(field => !testData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          missingFields 
        },
        { status: 400 }
      );
    }

    // Validate variants
    if (!Array.isArray(testData.variants) || testData.variants.length < 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'A/B tests must have at least 2 variants' 
        },
        { status: 400 }
      );
    }

    // Create enhanced test configuration
    const newTest: EnhancedABTest = {
      id: testData.id,
      name: testData.name,
      description: testData.description || '',
      status: testData.status || 'draft',
      variants: testData.variants,
      conversionGoals: testData.conversionGoals || [],
      targeting: {
        userIds: testData.targeting?.userIds,
        countries: testData.targeting?.countries,
        environments: testData.targeting?.environments,
        custom: testData.targeting?.custom
      },
      trafficAllocation: {
        percentage: testData.trafficAllocation?.percentage || 100,
        startDate: testData.trafficAllocation?.startDate || new Date().toISOString(),
        endDate: testData.trafficAllocation?.endDate
      },
      metadata: {
        createdBy: testData.metadata?.createdBy || 'api',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      featureFlagName: testData.featureFlagName,
      statistics: {
        totalExposures: 0,
        totalConversions: 0,
        conversionRates: {}
      }
    };

    // Check if test already exists
    const existingTest = abTestConfig.getTest(testData.id);
    if (existingTest) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'A/B test with this ID already exists' 
        },
        { status: 409 }
      );
    }

    // In production, save to database
    // For now, just return the created test
    abTestConfig.setTest(newTest);

    return NextResponse.json({
      success: true,
      data: newTest,
      message: 'A/B test created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating A/B test:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create A/B test',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}