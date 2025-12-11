/**
 * Community Discovery API Routes
 * Handles personalized recommendations, trending content, and discovery features
 */

import { NextRequest, NextResponse } from 'next/server';
import { communitySocialPlatform } from '@/lib/community-social-platform';
import { withErrorHandling } from '@/lib/api-error-handling';
import { trackEvent } from '@/lib/analytics';

// GET /api/community/discovery/trending - Get trending recipes
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const category = searchParams.get('category');
  const timeframe = searchParams.get('timeframe') || '7d';

  const trendingRecipes = await communitySocialPlatform.getTrendingRecipes(limit);

  trackEvent({
    name: 'discovery_trending_accessed',
    properties: {
      limit,
      category,
      timeframe
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      trending: trendingRecipes,
      meta: {
        limit,
        category,
        timeframe,
        generatedAt: new Date().toISOString()
      }
    }
  });
});