/**
 * Community Recipe API Routes
 * Handles user-generated recipe sharing, management, and collaboration
 */

import { NextRequest, NextResponse } from 'next/server';
import { communitySocialPlatform } from '@/lib/community-social-platform';
import { withErrorHandling } from '@/lib/api-error-handling';
import { trackEvent } from '@/lib/analytics';
import { getConfig } from '@/lib/config';

// GET /api/community/recipes - Search and browse user recipes
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const filters = {
    category,
    difficulty,
    page,
    limit,
    sortBy,
    sortOrder
  };

  const recipes = await communitySocialPlatform.searchUserRecipes(query, filters);
  
  trackEvent({
    name: 'community_recipes_searched',
    properties: {
      query,
      filters,
      resultCount: recipes.length
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      recipes,
      pagination: {
        page,
        limit,
        total: recipes.length,
        hasMore: recipes.length === limit
      }
    }
  });
});

// POST /api/community/recipes - Create a new user recipe
export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const { userId, recipeData } = body;

  if (!userId || !recipeData) {
    return NextResponse.json(
      { success: false, error: 'Missing userId or recipeData' },
      { status: 400 }
    );
  }

  const recipe = await communitySocialPlatform.createUserRecipe(userId, recipeData);

  return NextResponse.json({
    success: true,
    data: { recipe }
  }, { status: 201 });
});

// Middleware for authenticated routes
async function requireAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  const token = authHeader.substring(7);
  // In real implementation, validate JWT token and extract userId
  return { userId: 'user_123' }; // Mock userId for demo
}