import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateCSRFToken } from '@/lib/csrf';
import { encryptData, anonymizeIP } from '@/lib/gdpr';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    const csrfToken = request.headers.get('x-csrf-token');
    if (!csrfToken) {
      return NextResponse.json(
        { error: 'CSRF token missing' },
        { status: 403 }
      );
    }

    const isValidCSRF = await validateCSRFToken(csrfToken);
    if (!isValidCSRF) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    const { birthYear } = await request.json();

    if (!birthYear || typeof birthYear !== 'number') {
      return NextResponse.json(
        { error: 'Invalid birth year' },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    if (age < 18) {
      return NextResponse.json(
        { error: 'You must be at least 18 years old' },
        { status: 403 }
      );
    }

    if (age > 120) {
      return NextResponse.json(
        { error: 'Invalid birth year' },
        { status: 400 }
      );
    }

    // Get client information for GDPR compliance
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const forwarded = headersList.get('x-forwarded-for');
    const realIP = headersList.get('x-real-ip');
    const clientIP = forwarded?.split(',')[0]?.trim() || realIP || '';

    // Create user data object with sensitive information
    const userData = {
      ageVerified: true,
      birthYear, // Store birth year for age recalculation
      verificationTimestamp: new Date().toISOString(),
      ipAddress: anonymizeIP(clientIP), // Anonymized IP for GDPR
      userAgent: userAgent.substring(0, 200), // Truncate for privacy
    };

    // Encrypt sensitive user data
    const encryptedData = encryptData(JSON.stringify(userData));

    // Set secure encrypted cookie for age verification
    const cookieStore = await cookies();
    cookieStore.set('age-verified', encryptedData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Age verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}