import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth-mongo';
import connectDB from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const sessionId = request.cookies.get('session')?.value;
    
    if (sessionId) {
      await deleteSession(sessionId);
    }
    
    const response = NextResponse.json({
      message: 'Logged out successfully',
    });
    
    // Clear session cookie
    response.cookies.set('session', '', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
} 