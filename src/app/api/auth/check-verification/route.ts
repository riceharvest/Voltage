import { NextRequest, NextResponse } from 'next/server';
import { decryptData, shouldDeleteData } from '@/lib/gdpr';

export async function GET(request: NextRequest) {
  try {
    const encryptedCookie = request.cookies.get('age-verified')?.value;

    if (!encryptedCookie) {
      return NextResponse.json(
        { verified: false },
        { status: 403 }
      );
    }

    // Decrypt the user data
    const decryptedData = decryptData(encryptedCookie);
    const userData = JSON.parse(decryptedData);

    // Check if data should be deleted based on retention policy
    if (shouldDeleteData(userData.verificationTimestamp)) {
      // Data is too old, delete the cookie
      const response = NextResponse.json(
        { verified: false, reason: 'data_expired' },
        { status: 403 }
      );
      response.cookies.set('age-verified', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
      });
      return response;
    }

    // Verify the data is still valid (user is still 18+)
    const currentYear = new Date().getFullYear();
    const age = currentYear - userData.birthYear;

    if (age < 18) {
      // User is no longer 18+, delete cookie
      const response = NextResponse.json(
        { verified: false, reason: 'age_invalid' },
        { status: 403 }
      );
      response.cookies.set('age-verified', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
      });
      return response;
    }

    return NextResponse.json({
      verified: true,
      age,
      verificationDate: userData.verificationTimestamp
    });
  } catch (error) {
    console.error('Verification check error:', error);
    // If decryption fails, treat as not verified
    return NextResponse.json(
      { verified: false },
      { status: 403 }
    );
  }
}