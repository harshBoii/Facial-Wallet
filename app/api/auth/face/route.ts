import { NextRequest, NextResponse } from 'next/server';
import { findUserByFace, createSession } from '@/lib/auth-mongo';
import connectDB from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    console.log('Face authentication endpoint called');
    await connectDB();
    console.log('Database connected for face auth');
    
    const { faceDescriptor } = await request.json();
    console.log('Face descriptor received, length:', faceDescriptor?.length);
    console.log('Face descriptor type:', typeof faceDescriptor);
    console.log('Face descriptor is array:', Array.isArray(faceDescriptor));
    console.log('Sample descriptor values:', faceDescriptor?.slice(0, 5));

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      console.log('Invalid face descriptor format');
      return NextResponse.json(
        { error: 'Invalid face descriptor' },
        { status: 400 }
      );
    }

    // Validate descriptor values
    if (faceDescriptor.length === 0) {
      console.log('Empty face descriptor');
      return NextResponse.json(
        { error: 'Empty face descriptor' },
        { status: 400 }
      );
    }

    // Check if all values are numbers
    const hasInvalidValues = faceDescriptor.some(val => typeof val !== 'number' || isNaN(val));
    if (hasInvalidValues) {
      console.log('Face descriptor contains invalid values');
      return NextResponse.json(
        { error: 'Invalid face descriptor values' },
        { status: 400 }
      );
    }

    console.log('Face descriptor validation passed');
    console.log('Descriptor length:', faceDescriptor.length);
    console.log('First 5 values:', faceDescriptor.slice(0, 5));
    console.log('Last 5 values:', faceDescriptor.slice(-5));

    // Find user by face
    console.log('Searching for user by face...');
    const user = await findUserByFace(faceDescriptor);

    if (!user) {
      console.log('No user found for face descriptor');
      return NextResponse.json(
        { error: 'Face not recognized. Please enroll first.' },
        { status: 401 }
      );
    }

    console.log('User found:', user._id, 'Name:', user.name);

    // Create session
    const sessionId = await createSession(user._id.toString());
    console.log('Created session:', sessionId);
    
    const response = NextResponse.json({
      userId: user._id,
      message: 'Authentication successful',
    });
    
    // Set session cookie
    response.cookies.set('session', sessionId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    console.log('Authentication successful for user:', user._id);
    return response;
  } catch (error) {
    console.error('Face authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 