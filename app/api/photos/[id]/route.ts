import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-mongo';
import { downloadImage } from '@/lib/gridfs';
import Photo from '@/models/Photo';
import connectDB from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Photo serving endpoint called for ID:', params.id);
    await connectDB();

    // Check authentication
    const user = await getCurrentUser(request);
    console.log('User check for photo serving:', user ? 'authenticated' : 'not authenticated');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get photo metadata
    const photo = await Photo.findById(params.id);
    console.log('Photo found:', photo ? 'yes' : 'no');
    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Check if user owns this photo
    console.log('Photo owner check:', photo.userId.toString(), 'vs', user._id.toString());
    if (photo.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Download image from GridFS
    console.log('Downloading image from GridFS...');
    const imageBuffer = await downloadImage(photo.gridfsId);
    console.log('Image downloaded, size:', imageBuffer.length);

    // Return image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': photo.mimeType,
        'Content-Length': photo.size.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Failed to serve photo:', error);
    return NextResponse.json(
      { error: 'Failed to serve photo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get photo metadata
    const photo = await Photo.findById(params.id);
    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Check if user owns this photo
    if (photo.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete from GridFS
    const { deleteImage } = await import('@/lib/gridfs');
    await deleteImage(photo.gridfsId);

    // Delete metadata from database
    await Photo.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Failed to delete photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
} 