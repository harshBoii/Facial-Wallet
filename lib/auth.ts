import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Data storage paths
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({}));
}

if (!fs.existsSync(SESSIONS_FILE)) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify({}));
}

// Types
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  faceDescriptors: number[][];
  createdAt: string;
}

interface Session {
  userId: string;
  expiresAt: string;
}

interface UsersData {
  [userId: string]: User;
}

interface SessionsData {
  [sessionId: string]: Session;
}

// Load data from files
export function loadUsers(): UsersData {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load users:', error);
    return {};
  }
}

export function loadSessions(): SessionsData {
  try {
    const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load sessions:', error);
    return {};
  }
}

// Save data to files
function saveUsers(users: UsersData): void {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Failed to save users:', error);
  }
}

function saveSessions(sessions: SessionsData): void {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  } catch (error) {
    console.error('Failed to save sessions:', error);
  }
}

// Generate unique ID
function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

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
  // Increased threshold to be more lenient
  const threshold = 0.8;
  return distance < threshold;
}

// Session management
export function createSession(userId: string): string {
  const sessions = loadSessions();
  const sessionId = generateId();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  sessions[sessionId] = {
    userId,
    expiresAt,
  };

  saveSessions(sessions);
  return sessionId;
}

export function getSession(sessionId: string): Session | null {
  const sessions = loadSessions();
  const session = sessions[sessionId];

  if (!session) {
    return null;
  }

  // Check if session is expired
  if (new Date(session.expiresAt) < new Date()) {
    delete sessions[sessionId];
    saveSessions(sessions);
    return null;
  }

  return session;
}

export function deleteSession(sessionId: string): void {
  const sessions = loadSessions();
  delete sessions[sessionId];
  saveSessions(sessions);
}

// User management
export function createUser(faceDescriptors: number[][]): User {
  const users = loadUsers();
  const userId = generateId();

  const user: User = {
    id: userId,
    name: `User ${userId.slice(0, 8)}`,
    email: '',
    phone: '',
    bio: '',
    faceDescriptors,
    createdAt: new Date().toISOString(),
  };

  users[userId] = user;
  saveUsers(users);
  return user;
}

export function findUserByFace(faceDescriptor: number[]): User | null {
  const users = loadUsers();

  for (const user of Object.values(users)) {
    for (const storedDescriptor of user.faceDescriptors) {
      if (isFaceMatch(faceDescriptor, storedDescriptor)) {
        return user;
      }
    }
  }

  return null;
}

export function getUserById(userId: string): User | null {
  const users = loadUsers();
  return users[userId] || null;
}

export function addFaceDescriptor(userId: string, faceDescriptor: number[]): void {
  const users = loadUsers();
  const user = users[userId];

  if (!user) {
    throw new Error('User not found');
  }

  user.faceDescriptors.push(faceDescriptor);
  saveUsers(users);
}

export function updateUserProfile(userId: string, profileData: { name: string; email: string; phone: string; bio: string }): User {
  const users = loadUsers();
  const user = users[userId];

  if (!user) {
    throw new Error('User not found');
  }

  // Update user profile data
  user.name = profileData.name;
  user.email = profileData.email;
  user.phone = profileData.phone;
  user.bio = profileData.bio;

  saveUsers(users);
  return user;
}

// Cookie management
export function setAuthCookie(sessionId: string): void {
  const cookieStore = cookies();
  cookieStore.set('session', sessionId, {
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });
}

export function getAuthCookie(): string | null {
  const cookieStore = cookies();
  return cookieStore.get('session')?.value || null;
}

export function clearAuthCookie(): void {
  const cookieStore = cookies();
  cookieStore.delete('session');
}

// Request-based authentication
export function getCurrentUser(request: NextRequest): User | null {
  const sessionId = request.cookies.get('session')?.value;
  if (!sessionId) {
    return null;
  }

  const session = getSession(sessionId);
  if (!session) {
    return null;
  }

  return getUserById(session.userId);
}

// Clean up expired sessions
export function cleanupExpiredSessions(): void {
  const sessions = loadSessions();
  const now = new Date();
  let hasChanges = false;

  for (const [sessionId, session] of Object.entries(sessions)) {
    if (new Date(session.expiresAt) < now) {
      delete sessions[sessionId];
      hasChanges = true;
    }
  }

  if (hasChanges) {
    saveSessions(sessions);
  }
} 