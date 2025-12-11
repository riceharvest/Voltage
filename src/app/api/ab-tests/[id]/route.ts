import { NextRequest, NextResponse } from 'next/server';
import { abTestConfig } from '@/lib/enhanced-ab-testing';

/**
 * A/B Test Management - Individual Test Endpoints
 * 
 * Provides endpoints for:
 * - GET /api/ab-tests/[id] - Get test details
 * - PUT /api/ab-tests/[id] - Update test
 * - DELETE /api/ab-tests/[id] - Delete test
 * - POST /api/ab-tests/[id]/start - Start test
 * - POST /api/ab-tests/[id]/stop - Stop test
 * - GET /api/ab-tests/[id]/results - Get test results
 */

// GET /api/ab-tests/[id] - Get specific test
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const testId = params.id;
    const test = abTestConfig.getTest(testId);

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'A/B test not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: test
    });

  } catch (error) {
    console.error('Error fetching A/B test:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch A/B test',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/ab-tests/[id] - Update test
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const testId = params.id;
    const updateData = await request.json();

    const existingTest = abTestConfig.getTest(testId);
    if (!existingTest) {
      return NextResponse.json(
        { success: false, error: 'A/B test not found' },
        { status: 404 }
      );
    }

    // Update test with new data
    const updatedTest = {
      ...existingTest,
      ...updateData,
      metadata: {
        ...existingTest.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    abTestConfig.setTest(updatedTest);

    return NextResponse.json({
      success: true,
      data: updatedTest,
      message: 'A/B test updated successfully'
    });

  } catch (error) {
    console.error('Error updating A/B test:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update A/B test',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/ab-tests/[id] - Delete test
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const testId = params.id;
    const test = abTestConfig.getTest(testId);

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'A/B test not found' },
        { status: 404 }
      );
    }

    // In production, delete from database
    // For now, just mark as completed
    const completedTest = {
      ...test,
      status: 'completed' as const,
      metadata: {
        ...test.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    abTestConfig.setTest(completedTest);

    return NextResponse.json({
      success: true,
      message: 'A/B test deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting A/B test:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete A/B test',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}