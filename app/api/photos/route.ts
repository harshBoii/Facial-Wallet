import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-mongo';
import Photo from '@/models/Photo';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    console.log('Photos API called');
    await connectDB();
    console.log('Database connected for photos');

    // Check authentication
    const user = await getCurrentUser(request);
    console.log('User check for photos:', user ? 'authenticated' : 'not authenticated');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's photos
    console.log('Fetching photos for user:', user._id);
    const photos = await Photo.find({ userId: user._id })
      .sort({ uploadedAt: -1 })
      .lean();
    console.log('Found photos:', photos.length);

    const photosWithUrls = photos.map(photo => ({
      id: photo._id,
      filename: photo.filename,
      originalName: photo.originalName,
      size: photo.size,
      uploadedAt: photo.uploadedAt,
      url: `/api/photos/${photo._id}`,
      mimeType: photo.mimeType,
    }));

    console.log('Returning photos:', photosWithUrls);
    return NextResponse.json(photosWithUrls);
  } catch (error) {
    console.error('Failed to load photos:', error);
    return NextResponse.json(
      { error: 'Failed to load photos' },
      { status: 500 }
    );
  }
} 