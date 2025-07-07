import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest } from 'next';
import multer from 'multer';
import { getCurrentUser } from '@/lib/auth-mongo';
import { uploadFile } from '@/lib/gridfs';
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
    console.log('Upload endpoint called');
    await connectDB();
    console.log('Database connected');

    // Check authentication
    const user = await getCurrentUser(request);
    console.log('User check result:', user ? 'authenticated' : 'not authenticated');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    console.log('Form data parsed');
    const file = formData.get('photo') as File;
    console.log('File from form data:', file ? 'present' : 'missing');

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
    console.log('File converted to buffer, size:', buffer.length);
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${user._id}_${timestamp}_${file.name}`;
    console.log('Generated filename:', filename);

    // Upload to GridFS
    console.log('Starting GridFS upload...');
    const gridfsId = await uploadFile(buffer, filename, {
      userId: user._id,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
    });
    console.log('GridFS upload completed, ID:', gridfsId);

    // Save photo metadata to database
    console.log('Saving photo metadata to database...');
    const photo = await Photo.create({
      userId: user._id,
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      gridfsId,
    });
    console.log('Photo metadata saved, ID:', photo._id);

    const response = {
      id: photo._id,
      filename: photo.filename,
      originalName: photo.originalName,
      size: photo.size,
      uploadedAt: photo.uploadedAt,
      url: `/api/photos/${photo._id}`,
    };
    console.log('Returning response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Photo upload error:', error);
    const errorResponse = { error: 'Failed to upload photo' };
    console.log('Returning error response:', errorResponse);
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 