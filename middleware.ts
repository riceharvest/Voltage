import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

// Create the i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'en',
  localeDetection: true
});

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  const existing = rateLimitMap.get(ip);
  if (!existing || existing.resetTime < windowStart) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (existing.count >= maxRequests) {
    return true;
  }

  existing.count++;
  return false;
}

export async function middleware(request: NextRequest) {
  // Run i18n middleware first
  const i18nResponse = await intlMiddleware(request);
  if (i18nResponse && i18nResponse.status !== 200) {
    return i18nResponse;
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const { pathname } = request.nextUrl;

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    if (isRateLimited(ip, 100, 15 * 60 * 1000)) { // 100 requests per 15 minutes
      return NextResponse.json(
        { error: 'Too many requests from this IP, please try again later.' },
        { status: 429 }
      );
    }
  }

  // Stricter rate limiting for auth routes
  if (pathname.startsWith('/api/auth/')) {
    if (isRateLimited(`${ip}-auth`, 5, 15 * 60 * 1000)) { // 5 auth attempts per 15 minutes
      return NextResponse.json(
        { error: 'Too many authentication attempts, please try again later.' },
        { status: 429 }
      );
    }
  }

  // Age verification check for all routes except API routes and static files
  if (!pathname.startsWith('/api/') &&
      !pathname.startsWith('/_next/') &&
      !pathname.includes('.') &&
      pathname !== '/') {
    const ageVerified = request.cookies.get('age-verified')?.value === 'true';
    if (!ageVerified) {
      // Redirect to home page where age verification will be shown
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Handle CORS for API routes
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*'); // In production, specify allowed origins
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};