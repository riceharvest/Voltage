/**
 * Community Social Interaction API Routes
 * Handles likes, comments, follows, shares, and social interactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { communitySocialPlatform } from '@/lib/community-social-platform';
import { withErrorHandling } from '@/lib/api-error-handling';
import { trackEvent } from '@/lib/analytics';

// POST /api/community/interactions/like - Like a recipe
export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const { userId, recipeId } = body;

  if (!userId || !recipeId) {
    return NextResponse.json(
      { success: false, error: 'Missing userId or recipeId' },
      { status: 400 }
    );
  }

  await communitySocialPlatform.likeRecipe(userId, recipeId);

  return NextResponse.json({
    success: true,
    message: 'Recipe liked successfully'
  });
});

// DELETE /api/community/interactions/like - Unlike a recipe
export const DELETE = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const { userId, recipeId } = body;

  if (!userId || !recipeId) {
    return NextResponse.json(
      { success: false, error: 'Missing userId or recipeId' },
      { status: 400 }
    );
  }

  await communitySocialPlatform.unlikeRecipe(userId, recipeId);

  return NextResponse.json({
    success: true,
    message: 'Recipe unliked successfully'
  });
});