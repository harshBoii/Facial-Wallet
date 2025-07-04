import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from './mongodb';
import User from '@/models/User';
import Session from '@/models/Session';

// Face recognition utilities
function calculateFaceDistance(descriptor1: number[], descriptor2: number[]): number {
  if (descriptor1.length !== descriptor2.length) {
    throw new Error('Descriptor lengths do not match');
  }

  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

function isFaceMatch(descriptor1: number[], descriptor2: number[]): boolean {
  const distance = calculateFaceDistance(descriptor1, descriptor2);
  // Threshold for face matching (lower = more strict)
  const threshold = 0.8;
  return distance < threshold;
}

// Session management
export async function createSession(userId: string): Promise<string> {
  await connectDB();
  
  const sessionId = new mongoose.Types.ObjectId().toString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await Session.create({
    _id: sessionId,
    userId,
    expiresAt,
  });

  return sessionId;
}

export async function getSession(sessionId: string): Promise<any> {
  await connectDB();
  
  const session = await Session.findById(sessionId);
  
  if (!session) {
    return null;
  }

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    await Session.findByIdAndDelete(sessionId);
    return null;
  }

  return session;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await connectDB();
  await Session.findByIdAndDelete(sessionId);
}

// User management
export async function createUser(faceDescriptors: number[][]): Promise<any> {
  await connectDB();
  
  const user = await User.create({
    name: `User ${new mongoose.Types.ObjectId().toString().slice(0, 8)}`,
    faceDescriptors,
  });

  return user;
}

export async function findUserByFace(faceDescriptor: number[]): Promise<any> {
  await connectDB();
  
  const users = await User.find({});
  
  for (const user of users) {
    for (const storedDescriptor of user.faceDescriptors) {
      if (isFaceMatch(faceDescriptor, storedDescriptor)) {
        return user;
      }
    }
  }

  return null;
}

export async function getUserById(userId: string): Promise<any> {
  await connectDB();
  return await User.findById(userId);
}

export async function addFaceDescriptor(userId: string, faceDescriptor: number[]): Promise<void> {
  await connectDB();
  
  await User.findByIdAndUpdate(userId, {
    $push: { faceDescriptors: faceDescriptor }
  });
}

export async function updateUserProfile(userId: string, profileData: {
  name: string;
  email: string;
  phone: string;
  bio: string;
}): Promise<any> {
  await connectDB();
  
  const user = await User.findByIdAndUpdate(
    userId,
    {
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      bio: profileData.bio,
    },
    { new: true }
  );

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

// Request-based authentication
export async function getCurrentUser(request: NextRequest): Promise<any> {
  const sessionId = request.cookies.get('session')?.value;
  if (!sessionId) {
    return null;
  }

  const session = await getSession(sessionId);
  if (!session) {
    return null;
  }

  return await getUserById(session.userId);
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  await connectDB();
  await Session.deleteMany({ expiresAt: { $lt: new Date() } });
} 