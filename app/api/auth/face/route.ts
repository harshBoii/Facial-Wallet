import { NextRequest, NextResponse } from 'next/server';
import { findUserByFace, createSession } from '@/lib/auth-mongo';
import connectDB from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { faceDescriptor } = await request.json();

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return NextResponse.json(
        { error: 'Invalid face descriptor' },
        { status: 400 }
      );
    }

    // Find user by face
    const user = await findUserByFace(faceDescriptor);

    if (!user) {
      console.log('No user found for face descriptor');
      return NextResponse.json(
        { error: 'Face not recognized. Please enroll first.' },
        { status: 401 }
      );
    }

    console.log('User found:', user._id);

    // Create session
    const sessionId = await createSession(user._id.toString());
    
    const response = NextResponse.json({
      userId: user._id,
      message: 'Authentication successful',
    });
    
    // Set session cookie
    response.cookies.set('session', sessionId, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Face authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 