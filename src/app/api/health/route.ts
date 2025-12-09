import { NextResponse } from 'next/server';
import { cache, cacheKeys, CACHE_TTL } from '@/lib/cache';

export async function GET() {
  // Check cache first
  const cached = await cache.get(cacheKeys.api.health);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Generate fresh health data
  const result = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  };

  // Cache for a short time since uptime changes
  await cache.set(cacheKeys.api.health, result, CACHE_TTL.SHORT);

  return NextResponse.json(result);
}