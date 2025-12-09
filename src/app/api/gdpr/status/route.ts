import { NextRequest, NextResponse } from 'next/server';
import { isUserInEU, hasConsent } from '@/lib/gdpr';
import { cache, cacheKeys, CACHE_TTL } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    // Get client IP for caching key
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    const cacheKey = cacheKeys.api.gdprStatus(ip);

    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Compute GDPR status
    const isEU = await isUserInEU(request);
    const cookies = Object.fromEntries(request.cookies);
    const result = {
      isEU,
      hasConsent: hasConsent(cookies),
      consentRequired: isEU && !hasConsent(cookies)
    };

    // Cache the result (short TTL since GDPR status can change)
    await cache.set(cacheKey, result, CACHE_TTL.SHORT);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking GDPR status:', error);
    // Default to requiring consent if there's an error
    return NextResponse.json({
      isEU: true,
      hasConsent: false,
      consentRequired: true
    });
  }
}