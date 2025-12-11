/**
 * Community Challenges API Routes
 * Handles challenge creation, participation, and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { communitySocialPlatform } from '@/lib/community-social-platform';
import { withErrorHandling } from '@/lib/api-error-handling';
import { trackEvent } from '@/lib/analytics';

// GET /api/community/challenges - Get active challenges
export const GET = withErrorHandling(async (req: NextRequest) => {
  const challenges = await communitySocialPlatform.getActiveChallenges();

  return NextResponse.json({
    success: true,
    data: { challenges }
  });
});

// POST /api/community/challenges - Create a new challenge
export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const { creatorId, challengeData } = body;

  if (!creatorId || !challengeData) {
    return NextResponse.json(
      { success: false, error: 'Missing creatorId or challengeData' },
      { status: 400 }
    );
  }

  const challenge = await communitySocialPlatform.createChallenge(creatorId, challengeData);

  return NextResponse.json({
    success: true,
    data: { challenge }
  }, { status: 201 });
});