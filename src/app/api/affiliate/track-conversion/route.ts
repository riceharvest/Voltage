import { NextResponse } from 'next/server';
import { trackAffiliateConversion } from '@/lib/analytics';
import { validateAttributionId } from '@/lib/attribution';

interface ConversionData {
  affiliate: string;
  attributionId: string;
  value?: number;
  currency?: string;
  productId?: string;
  flavorId?: string;
  conversionType?: 'purchase' | 'signup' | 'trial';
  orderId?: string;
  timestamp?: string;
}

export async function POST(request: Request) {
  try {
    let conversionData: ConversionData;
    
    try {
      const requestBody = await request.text();
      if (!requestBody.trim()) {
        return NextResponse.json(
          { error: 'Request body is empty' },
          { status: 400 }
        );
      }
      conversionData = JSON.parse(requestBody);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!conversionData.affiliate || !conversionData.attributionId) {
      return NextResponse.json(
        { error: 'Affiliate and attribution ID are required' },
        { status: 400 }
      );
    }

    // Validate attribution ID format and existence
    const isValidAttribution = validateAttributionId(conversionData.attributionId);
    if (!isValidAttribution) {
      return NextResponse.json(
        { error: 'Invalid or expired attribution ID' },
        { status: 400 }
      );
    }

    // Track the conversion event
    trackAffiliateConversion(
      conversionData.affiliate,
      conversionData.value,
      conversionData.currency || 'EUR'
    );

    // Create conversion event record
    const conversionEvent = {
      id: conversionData.attributionId,
      affiliate: conversionData.affiliate,
      productId: conversionData.productId,
      flavorId: conversionData.flavorId,
      value: conversionData.value,
      currency: conversionData.currency || 'EUR',
      conversionType: conversionData.conversionType || 'purchase',
      orderId: conversionData.orderId,
      timestamp: conversionData.timestamp || new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      type: 'conversion',
      status: 'confirmed'
    };

    // Log conversion event (in production, store in database)
    console.log('Affiliate conversion tracked:', conversionEvent);

    return NextResponse.json({
      success: true,
      attributionId: conversionData.attributionId,
      message: 'Conversion tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking affiliate conversion:', error);
    return NextResponse.json(
      { error: 'Failed to track conversion' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check endpoint for the conversion tracking service
  return NextResponse.json({
    service: 'affiliate-conversion-tracking',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
}