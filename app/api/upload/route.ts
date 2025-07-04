import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest } from 'next';
import multer from 'multer';
import { getCurrentUser } from '@/lib/auth-mongo';
import { uploadImage } from '@/lib/gridfs';
import Photo from '@/models/Photo';
import connectDB from '@/lib/mongodb';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Helper function to run multer
function runMiddleware(req: NextApiRequest, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export async function POST(request: NextRequest) {
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

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 10MB allowed.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${user._id}_${timestamp}_${file.name}`;

    // Upload to GridFS
    const gridfsId = await uploadImage(buffer, filename, {
      userId: user._id,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
    });

    // Save photo metadata to database
    const photo = await Photo.create({
      userId: user._id,
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      gridfsId,
    });

    return NextResponse.json({
      id: photo._id,
      filename: photo.filename,
      originalName: photo.originalName,
      size: photo.size,
      uploadedAt: photo.uploadedAt,
      url: `/api/photos/${photo._id}`,
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
} 