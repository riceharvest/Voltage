import { NextRequest, NextResponse } from 'next/server';
import { decryptData, shouldDeleteData } from '@/lib/gdpr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get user's encrypted data
    const cookieStore = await cookies();
    const encryptedCookie = cookieStore.get('age-verified')?.value;

    if (!encryptedCookie) {
      return NextResponse.json(
        { error: 'No user data found' },
        { status: 404 }
      );
    }

    // Decrypt and return anonymized user data
    const decryptedData = decryptData(encryptedCookie);
    const userData = JSON.parse(decryptedData);

    // Return only non-sensitive, anonymized data for GDPR access requests
    const accessibleData = {
      ageVerified: userData.ageVerified,
      verificationTimestamp: userData.verificationTimestamp,
      // IP and user agent are anonymized/stripped for privacy
      dataRetentionDays: 30, // Age verification data retention
      dataPurposes: [
        'Age verification for legal compliance',
        'Preventing access to inappropriate content'
      ],
      dataRecipients: ['This website only'],
      legalBasis: 'Legal obligation (age verification requirement)'
    };

    return NextResponse.json({
      data: accessibleData,
      rights: {
        access: true,
        rectification: false, // Age data cannot be changed
        erasure: true,
        restriction: true,
        portability: false,
        objection: true
      }
    });
  } catch (error) {
    console.error('Data access error:', error);
    return NextResponse.json(
      { error: 'Failed to access data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Delete user's data (GDPR right to erasure)
    const cookieStore = await cookies();

    // Remove age verification cookie
    cookieStore.set('age-verified', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    // Remove GDPR consent cookie
    cookieStore.set('gdpr-consent', '', {
      httpOnly: false, // Consent cookie is not httpOnly
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: 'All user data has been deleted'
    });
  } catch (error) {
    console.error('Data deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    );
  }
}