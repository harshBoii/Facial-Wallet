import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-mongo';
import Photo from '@/models/Photo';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Check authentication
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's photos
    const photos = await Photo.find({ userId: user._id })
      .sort({ uploadedAt: -1 })
      .lean();

    const photosWithUrls = photos.map(photo => ({
      id: photo._id,
      filename: photo.filename,
      originalName: photo.originalName,
      size: photo.size,
      uploadedAt: photo.uploadedAt,
      url: `/api/photos/${photo._id}`,
    }));

    return NextResponse.json(photosWithUrls);
  } catch (error) {
    console.error('Failed to load photos:', error);
    return NextResponse.json(
      { error: 'Failed to load photos' },
      { status: 500 }
    );
  }
} 