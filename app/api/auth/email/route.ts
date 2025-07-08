import { NextRequest, NextResponse } from 'next/server';
import { requestEmailLogin, verifyEmailOtp, updateUserEmail } from '@/lib/auth-mongo';

export async function POST(request: NextRequest) {
  try {
    const url = request.nextUrl.pathname;
    const body = await request.json();
    if (body.userId && body.email && !url.endsWith('/verify')) {
      const result = await updateUserEmail(body.userId, body.email);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      return NextResponse.json({ message: 'Email saved successfully' });
    }
    if (url.endsWith('/verify')) {
      // OTP verification
      const { email, otp } = body;
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
    } else {
      // Request OTP
      const { email } = body;
      const result = await requestEmailLogin(email);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      return NextResponse.json({ message: result.message });
    }
  } catch (error) {
    console.error('Email OTP endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 