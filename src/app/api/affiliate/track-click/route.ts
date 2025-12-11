import { NextResponse } from 'next/server';
import { trackAffiliateClick } from '@/lib/analytics';
import { generateAttributionIdWithClick } from '@/lib/attribution';

interface ClickData {
  affiliate: string;
  productId?: string;
  flavorId?: string;
  referrer?: string;
  userAgent?: string;
  timestamp?: string;
}

export async function POST(request: Request) {
  try {
    let clickData: ClickData;
    
    try {
      const requestBody = await request.text();
      if (!requestBody.trim()) {
        return NextResponse.json(
          { error: 'Request body is empty' },
          { status: 400 }
        );
      }
      clickData = JSON.parse(requestBody);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!clickData.affiliate) {
      return NextResponse.json(
        { error: 'Affiliate name is required' },
        { status: 400 }
      );
    }

    // Generate attribution ID and track click using enhanced analytics
    const attributionId = trackAffiliateClick(clickData.affiliate, clickData.productId);

    // Log click event with attribution data (for analytics dashboard)
    const clickEvent = {
      id: attributionId,
      affiliate: clickData.affiliate,
      productId: clickData.productId,
      flavorId: clickData.flavorId,
      referrer: clickData.referrer || request.headers.get('referer'),
      userAgent: clickData.userAgent || request.headers.get('user-agent'),
      timestamp: clickData.timestamp || new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      type: 'click'
    };

    // In a production app, you would store this in a database
    // For now, we'll store it in memory or file system for demonstration
    console.log('Affiliate click tracked:', clickEvent);

    return NextResponse.json({
      success: true,
      attributionId,
      message: 'Click tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking affiliate click:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check endpoint for the click tracking service
  return NextResponse.json({
    service: 'affiliate-click-tracking',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
}