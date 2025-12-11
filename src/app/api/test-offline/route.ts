import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Test offline endpoint called:', {
      timestamp: new Date().toISOString(),
      action: body.action,
      receivedAt: body.timestamp
    });

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json({
      success: true,
      message: 'Test offline action processed successfully',
      processedAt: Date.now(),
      receivedData: body
    });
  } catch (error) {
    console.error('Test offline endpoint error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process offline action',
        errorDetails: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // For testing cache retrieval
  return NextResponse.json({
    message: 'Test offline endpoint is working',
    timestamp: Date.now(),
    url: request.url,
    method: request.method
  });
}