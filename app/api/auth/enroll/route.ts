import { NextRequest, NextResponse } from 'next/server';
import { createUser, addFaceDescriptor, createSession, getSession, getUserById } from '@/lib/auth-mongo';
import connectDB from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { faceDescriptor, progress } = await request.json();

    console.log('Enrollment request:', { progress, descriptorLength: faceDescriptor?.length });
    console.log('Face descriptor type:', typeof faceDescriptor);
    console.log('Face descriptor is array:', Array.isArray(faceDescriptor));
    console.log('Sample descriptor values:', faceDescriptor?.slice(0, 5));

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      console.log('Invalid face descriptor format in enrollment');
      return NextResponse.json(
        { error: 'Invalid face descriptor' },
        { status: 400 }
      );
    }

    // Validate descriptor values
    if (faceDescriptor.length === 0) {
      console.log('Empty face descriptor in enrollment');
      return NextResponse.json(
        { error: 'Empty face descriptor' },
        { status: 400 }
      );
    }

    // Check if all values are numbers
    const hasInvalidValues = faceDescriptor.some(val => typeof val !== 'number' || isNaN(val));
    if (hasInvalidValues) {
      console.log('Face descriptor contains invalid values in enrollment');
      return NextResponse.json(
        { error: 'Invalid face descriptor values' },
        { status: 400 }
      );
    }

    // Validate descriptor length (face-api.js typically uses 128 dimensions)
    if (faceDescriptor.length < 100) {
      console.log('Face descriptor too short in enrollment:', faceDescriptor.length);
      return NextResponse.json(
        { error: 'Invalid face descriptor length' },
        { status: 400 }
      );
    }

    console.log('Face descriptor validation passed in enrollment');
    console.log('Descriptor length:', faceDescriptor.length);
    console.log('First 5 values:', faceDescriptor.slice(0, 5));
    console.log('Last 5 values:', faceDescriptor.slice(-5));

    if (typeof progress !== 'number' || progress < 1 || progress > 5) {
      return NextResponse.json(
        { error: 'Invalid progress value' },
        { status: 400 }
      );
    }

    let userId: string;
    let sessionId: string;

    if (progress === 1) {
      // First enrollment - create new user
      console.log('Creating new user with first face descriptor');
      const user = await createUser([faceDescriptor]);
      userId = user._id.toString();
      console.log('Created user:', userId, 'Name:', user.name, 'Descriptors:', user.faceDescriptors.length);
      
      // Create session on first enrollment
      sessionId = await createSession(userId);
      console.log('Created session:', sessionId);
    } else {
      // Get user ID from session (should exist from previous enrollments)
      const existingSessionId = request.cookies.get('session')?.value;
      console.log('Session ID from cookie:', existingSessionId);
      
      if (!existingSessionId) {
        return NextResponse.json(
          { error: 'No active enrollment session' },
          { status: 400 }
        );
      }

      const session = await getSession(existingSessionId);
      if (!session) {
        return NextResponse.json(
          { error: 'Invalid enrollment session' },
          { status: 400 }
        );
      }

      userId = session.userId;
      sessionId = existingSessionId;
      console.log('Adding face descriptor to user:', userId);
      
      // Add face descriptor to existing user
      await addFaceDescriptor(userId, faceDescriptor);
      
      // Verify the descriptor was added
      const updatedUser = await getUserById(userId);
      console.log('Updated user descriptors:', updatedUser.faceDescriptors.length);
    }

    // Check if enrollment is complete
    if (progress === 5) {
      console.log('Enrollment completed for user:', userId);
      const response = NextResponse.json({
        userId,
        message: 'Enrollment completed successfully',
        completed: true,
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
    } else {
      console.log('Enrollment progress:', progress, 'for user:', userId);
      const response = NextResponse.json({
        userId,
        message: `Enrollment progress: ${progress}/5`,
        completed: false,
        progress,
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
    }
  } catch (error) {
    console.error('Face enrollment error:', error);
    return NextResponse.json(
      { error: 'Enrollment failed' },
      { status: 500 }
    );
  }
} 