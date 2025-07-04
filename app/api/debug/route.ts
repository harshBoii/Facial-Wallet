import { NextRequest, NextResponse } from 'next/server';
import { findUserByFace, getCurrentUser } from '@/lib/auth-mongo';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get all users
    const users = await User.find({});
    const userInfo = users.map(user => ({
      id: user._id,
      name: user.name,
      descriptorCount: user.faceDescriptors.length,
      createdAt: user.createdAt,
    }));

    // Get current user from session
    const currentUser = await getCurrentUser(request);
    
    return NextResponse.json({
      totalUsers: users.length,
      users: userInfo,
      currentUser: currentUser ? {
        id: currentUser._id,
        name: currentUser.name,
        descriptorCount: currentUser.faceDescriptors.length,
      } : null,
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Debug failed' },
      { status: 500 }
    );
  }
}

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

    // Test face matching
    const user = await findUserByFace(faceDescriptor);
    
    return NextResponse.json({
      descriptorLength: faceDescriptor.length,
      userFound: !!user,
      user: user ? {
        id: user._id,
        name: user.name,
        descriptorCount: user.faceDescriptors.length,
      } : null,
    });
  } catch (error) {
    console.error('Debug face matching error:', error);
    return NextResponse.json(
      { error: 'Face matching test failed' },
      { status: 500 }
    );
  }
} 