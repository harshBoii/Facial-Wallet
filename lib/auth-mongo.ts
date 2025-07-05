import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from './mongodb';
import User from '@/models/User';
import Session from '@/models/Session';

// Face recognition utilities
function normalizeDescriptor(descriptor: number[]): number[] {
  // Normalize the descriptor to unit length
  const magnitude = Math.sqrt(descriptor.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return descriptor;
  return descriptor.map(val => val / magnitude);
}

function calculateFaceDistance(descriptor1: number[], descriptor2: number[]): number {
  if (descriptor1.length !== descriptor2.length) {
    console.log(`Descriptor length mismatch: ${descriptor1.length} vs ${descriptor2.length}`);
    throw new Error('Descriptor lengths do not match');
  }

  // Normalize both descriptors before calculating distance
  const normalized1 = normalizeDescriptor(descriptor1);
  const normalized2 = normalizeDescriptor(descriptor2);

  // Use Euclidean distance for face recognition
  let sum = 0;
  for (let i = 0; i < normalized1.length; i++) {
    const diff = normalized1[i] - normalized2[i];
    sum += diff * diff;
  }
  const distance = Math.sqrt(sum);
  console.log(`Distance calculation: sum=${sum.toFixed(4)}, distance=${distance.toFixed(4)}`);
  return distance;
}

function isFaceMatch(descriptor1: number[], descriptor2: number[]): boolean {
  const distance = calculateFaceDistance(descriptor1, descriptor2);
  // Use a more lenient threshold for face matching
  // Face-api.js typically uses 0.6 as the default threshold
  const threshold = 0.05
  ;
  const isMatch = distance < threshold;
  console.log(`Face match check: distance=${distance.toFixed(4)}, threshold=${threshold}, match=${isMatch}`);
  return isMatch;
}

function validateAndCleanDescriptor(descriptor: number[]): number[] {
  // Ensure descriptor is an array of numbers
  if (!Array.isArray(descriptor)) {
    throw new Error('Descriptor must be an array');
  }
  
  // Convert to numbers and filter out invalid values
  const cleaned = descriptor
    .map(val => {
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    })
    .filter(val => val !== 0 || Math.random() < 0.1); // Keep some zeros but not all
  
  // Ensure descriptor has reasonable length (face-api.js typically uses 128 dimensions)
  if (cleaned.length < 100) {
    throw new Error('Descriptor too short');
  }
  
  return cleaned;
}

// Session management
export async function createSession(userId: string): Promise<string> {
  await connectDB();
  
  const sessionId = new mongoose.Types.ObjectId().toString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  console.log('Creating session:', { sessionId, userId, expiresAt });
  
  await Session.create({
    _id: sessionId,
    userId,
    expiresAt,
  });

  console.log('Session created successfully');
  return sessionId;
}

export async function getSession(sessionId: string): Promise<any> {
  await connectDB();
  
  console.log('Retrieving session:', sessionId);
  const session = await Session.findById(sessionId);
  
  if (!session) {
    console.log('Session not found');
    return null;
  }

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    console.log('Session expired, deleting');
    await Session.findByIdAndDelete(sessionId);
    return null;
  }

  console.log('Session found and valid:', { userId: session.userId, expiresAt: session.expiresAt });
  return session;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await connectDB();
  await Session.findByIdAndDelete(sessionId);
}

// User management
export async function createUser(faceDescriptors: number[][]): Promise<any> {
  await connectDB();
  
  console.log('Creating new user with descriptors:', faceDescriptors.length);
  console.log('Sample descriptor values:', faceDescriptors[0]?.slice(0, 5));
  
  const user = await User.create({
    name: `User ${new mongoose.Types.ObjectId().toString().slice(0, 8)}`,
    faceDescriptors,
  });

  console.log('User created successfully:', { 
    id: user._id, 
    name: user.name, 
    descriptors: user.faceDescriptors.length,
    sampleStored: user.faceDescriptors[0]?.slice(0, 5)
  });
  return user;
}

export async function findUserByFace(faceDescriptor: number[]): Promise<any> {
  await connectDB();
  
  // Validate input descriptor
  if (!Array.isArray(faceDescriptor) || faceDescriptor.length === 0) {
    console.log('Invalid face descriptor format');
    return null;
  }
  
  console.log(`Searching for user by face. Input descriptor length: ${faceDescriptor.length}`);
  console.log('Sample descriptor values:', faceDescriptor.slice(0, 5));
  
  const users = await User.find({});
  console.log(`Searching for user by face. Total users: ${users.length}`);
  
  let bestMatch = null;
  let bestDistance = Infinity;
  let bestUser = null;
  
  // Try multiple thresholds for more robust matching
  const thresholds = [0.4, 0.5, 0.6, 0.7, 0.8];
  
  for (const user of users) {
    console.log(`Checking user ${user._id} with ${user.faceDescriptors.length} descriptors`);
    
    for (let i = 0; i < user.faceDescriptors.length; i++) {
      const storedDescriptor = user.faceDescriptors[i];
      
      // Validate stored descriptor
      if (!Array.isArray(storedDescriptor) || storedDescriptor.length === 0) {
        console.log(`  Skipping invalid descriptor ${i + 1}`);
        continue;
      }
      
      console.log(`  Stored descriptor ${i + 1} length: ${storedDescriptor.length}`);
      console.log(`  Sample stored values:`, storedDescriptor.slice(0, 5));
      
      try {
        const distance = calculateFaceDistance(faceDescriptor, storedDescriptor);
        console.log(`  Descriptor ${i + 1}: distance = ${distance.toFixed(4)}`);
        
        // Check against multiple thresholds
        for (const threshold of thresholds) {
          if (distance < threshold) {
            console.log(`    Match found with threshold ${threshold}`);
            if (distance < bestDistance) {
              bestDistance = distance;
              bestUser = user;
              console.log(`    New best match: ${user._id} (${user.name}) with distance ${distance.toFixed(4)}`);
            }
            break; // Found a match with this threshold, no need to check higher thresholds
          }
        }
      } catch (error) {
        console.log(`  Error calculating distance for descriptor ${i + 1}:`, error);
      }
    }
  }

  if (bestUser) {
    console.log(`Best matching user found: ${bestUser._id} (${bestUser.name}) with distance ${bestDistance.toFixed(4)}`);
    return bestUser;
  } else {
    console.log('No matching user found');
    return null;
  }
}

export async function getUserById(userId: string): Promise<any> {
  await connectDB();
  return await User.findById(userId);
}

export async function addFaceDescriptor(userId: string, faceDescriptor: number[]): Promise<void> {
  await connectDB();
  
  console.log('Adding face descriptor to user:', userId, 'Descriptor length:', faceDescriptor.length);
  console.log('Sample descriptor values:', faceDescriptor.slice(0, 5));
  
  await User.findByIdAndUpdate(userId, {
    $push: { faceDescriptors: faceDescriptor }
  });
  
  // Verify the descriptor was added
  const updatedUser = await User.findById(userId);
  console.log('Face descriptor added successfully. Total descriptors:', updatedUser.faceDescriptors.length);
  console.log('Latest descriptor sample:', updatedUser.faceDescriptors[updatedUser.faceDescriptors.length - 1]?.slice(0, 5));
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
  console.log('Session ID from cookie:', sessionId);
  
  if (!sessionId) {
    console.log('No session ID found in cookie');
    return null;
  }

  const session = await getSession(sessionId);
  console.log('Session retrieved:', session ? `userId=${session.userId}` : 'null');
  
  if (!session) {
    console.log('No valid session found');
    return null;
  }

  const user = await getUserById(session.userId);
  console.log('User retrieved:', user ? `id=${user._id}, name=${user.name}` : 'null');
  return user;
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  await connectDB();
  await Session.deleteMany({ expiresAt: { $lt: new Date() } });
}