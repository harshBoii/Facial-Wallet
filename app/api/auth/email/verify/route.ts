import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailOtp } from '@/lib/auth-mongo';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();
    const result = await verifyEmailOtp(email, otp);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 401 });
    }
    // Set session cookie
    const response = NextResponse.json({ message: result.message, sessionId: result.sessionId });
    response.cookies.set('session', result.sessionId!, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Email OTP verify endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 