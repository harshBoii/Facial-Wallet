import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import connectDB from './mongodb';

let bucket: GridFSBucket | null = null;

export async function getGridFSBucket(): Promise<GridFSBucket> {
  if (!bucket) {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not established');
    bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'files' });
  }
  return bucket;
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  metadata: any = {},
  contentType?: string
): Promise<mongoose.Types.ObjectId> {
  const bucket = await getGridFSBucket();
  const uploadStream = bucket.openUploadStream(filename, {
    metadata,
    contentType,
  });
  return new Promise((resolve, reject) => {
    uploadStream.on('finish', () => {
      resolve(uploadStream.id);
    });
    uploadStream.on('error', (error) => {
      reject(error);
    });
    uploadStream.end(buffer);
  });
}

export async function downloadFile(fileId: mongoose.Types.ObjectId): Promise<Buffer> {
  const bucket = await getGridFSBucket();
  return new Promise((resolve, reject) => {
    const downloadStream = bucket.openDownloadStream(fileId);
    const chunks: Buffer[] = [];
    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    downloadStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    downloadStream.on('error', (error) => {
      reject(error);
    });
  });
}

export async function deleteFile(fileId: mongoose.Types.ObjectId): Promise<void> {
  const bucket = await getGridFSBucket();
  await bucket.delete(fileId);
} 