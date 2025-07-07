import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-mongo';
import { uploadFile } from '@/lib/gridfs';
import Photo from '@/models/Photo';
import connectDB from '@/lib/mongodb';

const allowedTypes = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (!allowedTypes.includes(file.type)) return NextResponse.json({ error: 'Only Excel files (XLS, XLSX) are allowed' }, { status: 400 });
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'File size too large. Maximum 20MB allowed.' }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const filename = `${user._id}_${timestamp}_${file.name}`;
    const gridfsId = await uploadFile(buffer, filename, {
      userId: user._id,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      type: 'excel',
    }, file.type);
    const photo = await Photo.create({
      userId: user._id,
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      gridfsId,
      type: 'excel',
    });
    return NextResponse.json({ id: photo._id, filename: photo.filename, originalName: photo.originalName, size: photo.size, uploadedAt: photo.uploadedAt, url: `/api/photos/${photo._id}` });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload excel file' }, { status: 500 });
  }
} 