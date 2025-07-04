import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Log all cookies for debugging
    const cookies = request.cookies;
    const cookieData: Record<string, string> = {};
    
    cookies.getAll().forEach(cookie => {
      cookieData[cookie.name] = cookie.value;
    });

    return NextResponse.json({
      cookies: cookieData,
      hasSessionCookie: !!cookies.get('session'),
      sessionValue: cookies.get('session')?.value || null,
      userAgent: request.headers.get('user-agent'),
      host: request.headers.get('host'),
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json(
      { error: 'Failed to test auth' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test setting a cookie
    const testSessionId = `test-${Date.now()}`;
    const response = NextResponse.json({
      message: 'Test session created',
      sessionId: testSessionId,
      timestamp: new Date().toISOString()
    });

    // Set a test cookie
    response.cookies.set('test-session', testSessionId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Auth test POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create test session' },
      { status: 500 }
    );
  }
} 