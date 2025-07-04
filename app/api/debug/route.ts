import { NextRequest, NextResponse } from 'next/server';
import { findUserByFace, getCurrentUser } from '@/lib/auth-mongo';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// Face recognition utilities for testing
function normalizeDescriptor(descriptor: number[]): number[] {
  const magnitude = Math.sqrt(descriptor.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return descriptor;
  return descriptor.map(val => val / magnitude);
}

function calculateFaceDistance(descriptor1: number[], descriptor2: number[]): number {
  if (descriptor1.length !== descriptor2.length) {
    throw new Error('Descriptor lengths do not match');
  }

  const normalized1 = normalizeDescriptor(descriptor1);
  const normalized2 = normalizeDescriptor(descriptor2);

  let sum = 0;
  for (let i = 0; i < normalized1.length; i++) {
    const diff = normalized1[i] - normalized2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

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
    
    const { faceDescriptor, testMode } = await request.json();
    
    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return NextResponse.json(
        { error: 'Invalid face descriptor' },
        { status: 400 }
      );
    }

    if (testMode === 'sample') {
      // Test with a sample descriptor to see if matching works
      const users = await User.find({});
      if (users.length === 0) {
        return NextResponse.json({
          message: 'No users found to test with',
          descriptorLength: faceDescriptor.length,
        });
      }

      const user = users[0];
      if (user.faceDescriptors.length === 0) {
        return NextResponse.json({
          message: 'No face descriptors found for testing',
          descriptorLength: faceDescriptor.length,
        });
      }

      const sampleDescriptor = user.faceDescriptors[0];
      const distance = calculateFaceDistance(faceDescriptor, sampleDescriptor);
      
      return NextResponse.json({
        descriptorLength: faceDescriptor.length,
        sampleDescriptorLength: sampleDescriptor.length,
        distance: distance.toFixed(4),
        threshold: 0.6,
        isMatch: distance < 0.6,
        user: {
          id: user._id,
          name: user.name,
        },
      });
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