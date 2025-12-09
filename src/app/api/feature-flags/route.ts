import { NextRequest, NextResponse } from 'next/server';
import { featureFlags, FeatureFlag } from '@/lib/feature-flags';

/**
 * GET /api/feature-flags
 * Get all feature flags or check a specific flag
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const flagName = searchParams.get('name');
  const userId = searchParams.get('userId');
  const environment = searchParams.get('environment');

  try {
    if (flagName) {
      // Check if a specific flag is enabled
      const context = {
        userId: userId || undefined,
        environment: environment || process.env.NODE_ENV
      };

      const isEnabled = featureFlags.isEnabled(flagName, context);

      return NextResponse.json({
        flag: flagName,
        enabled: isEnabled,
        context
      });
    } else {
      // Return all flags
      const allFlags = featureFlags.getAllFlags();
      const stats = featureFlags.getStats();

      return NextResponse.json({
        flags: allFlags,
        stats
      });
    }
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feature-flags
 * Create or update a feature flag
 */
export async function POST(request: NextRequest) {
  try {
    const body: FeatureFlag = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Flag name is required' },
        { status: 400 }
      );
    }

    // Set default values
    const flag: FeatureFlag = {
      name: body.name,
      enabled: body.enabled ?? false,
      rolloutPercentage: body.rolloutPercentage ?? 0,
      conditions: body.conditions || {},
      metadata: {
        ...body.metadata,
        updatedAt: new Date().toISOString(),
        createdAt: body.metadata?.createdAt || new Date().toISOString()
      }
    };

    featureFlags.setFlag(flag);

    return NextResponse.json({
      success: true,
      flag
    });
  } catch (error) {
    console.error('Error creating/updating feature flag:', error);
    return NextResponse.json(
      { error: 'Failed to create/update feature flag' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/feature-flags?name=flagName
 * Remove a feature flag
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const flagName = searchParams.get('name');

  if (!flagName) {
    return NextResponse.json(
      { error: 'Flag name is required' },
      { status: 400 }
    );
  }

  try {
    const removed = featureFlags.removeFlag(flagName);

    if (!removed) {
      return NextResponse.json(
        { error: 'Flag not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Flag '${flagName}' removed`
    });
  } catch (error) {
    console.error('Error removing feature flag:', error);
    return NextResponse.json(
      { error: 'Failed to remove feature flag' },
      { status: 500 }
    );
  }
}