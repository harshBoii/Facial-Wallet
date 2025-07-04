import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-mongo';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('Auth check endpoint called');
    const user = await getCurrentUser(request);
    
    if (!user) {
      console.log('No user found in session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('User found in session:', user._id, 'Name:', user.name);
    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    );
  }
} 