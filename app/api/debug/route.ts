import { NextRequest, NextResponse } from 'next/server';
import { loadUsers, loadSessions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const users = loadUsers();
    const sessions = loadSessions();

    return NextResponse.json({
      users: Object.keys(users).length,
      sessions: Object.keys(sessions).length,
      userDetails: Object.values(users).map(user => ({
        id: user.id,
        name: user.name,
        faceDescriptorsCount: user.faceDescriptors.length,
        createdAt: user.createdAt,
      })),
      sessionDetails: Object.entries(sessions).map(([sessionId, session]) => ({
        sessionId,
        userId: session.userId,
        expiresAt: session.expiresAt,
      })),
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Debug failed' },
      { status: 500 }
    );
  }
} 