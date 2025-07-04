import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Photo } from '@/types';

// Data storage paths
const DATA_DIR = path.join(process.cwd(), 'data');
const PHOTOS_FILE = path.join(DATA_DIR, 'photos.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initialize photos file if it doesn't exist
if (!fs.existsSync(PHOTOS_FILE)) {
  fs.writeFileSync(PHOTOS_FILE, JSON.stringify({}));
}

// Extended Photo type for internal storage (includes userId)
interface StoredPhoto extends Photo {
  userId: string;
}

interface PhotosData {
  [photoId: string]: StoredPhoto;
}

// Load photos data
function loadPhotos(): PhotosData {
  try {
    const data = fs.readFileSync(PHOTOS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load photos:', error);
    return {};
  }
}

// Save photos data
function savePhotos(photos: PhotosData): void {
  try {
    fs.writeFileSync(PHOTOS_FILE, JSON.stringify(photos, null, 2));
  } catch (error) {
    console.error('Failed to save photos:', error);
  }
}

// Generate unique ID
function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Save uploaded file
export function saveUploadedFile(
  userId: string,
  originalName: string,
  buffer: Buffer
): Photo {
  const photos = loadPhotos();
  const photoId = generateId();
  
  // Generate unique filename
  const extension = path.extname(originalName);
  const filename = `${photoId}${extension}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  // Save file to disk
  fs.writeFileSync(filePath, buffer);

  // Create photo record
  const photo: StoredPhoto = {
    id: photoId,
    userId,
    filename,
    originalName,
    url: `/uploads/${filename}`,
    size: buffer.length,
    uploadedAt: new Date().toISOString(),
  };

  photos[photoId] = photo;
  savePhotos(photos);

  return photo;
}

// Get photos for a user
export function getUserPhotos(userId: string): Photo[] {
  const photos = loadPhotos();
  return Object.values(photos)
    .filter(photo => photo.userId === userId)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

// Get photo by ID
export function getPhotoById(photoId: string): Photo | null {
  const photos = loadPhotos();
  return photos[photoId] || null;
}

// Delete photo
export function deletePhoto(photoId: string, userId: string): boolean {
  const photos = loadPhotos();
  const photo = photos[photoId];

  if (!photo || photo.userId !== userId) {
    return false;
  }

  // Delete file from disk
  const filePath = path.join(UPLOADS_DIR, photo.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Remove from photos data
  delete photos[photoId];
  savePhotos(photos);

  return true;
}

// Get all photos (for admin purposes)
export function getAllPhotos(): Photo[] {
  const photos = loadPhotos();
  return Object.values(photos).sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

// Clean up orphaned files
export function cleanupOrphanedFiles(): void {
  const photos = loadPhotos();
  const validFilenames = new Set(Object.values(photos).map(photo => photo.filename));

  if (fs.existsSync(UPLOADS_DIR)) {
    const files = fs.readdirSync(UPLOADS_DIR);
    
    for (const file of files) {
      if (!validFilenames.has(file)) {
        const filePath = path.join(UPLOADS_DIR, file);
        try {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up orphaned file: ${file}`);
        } catch (error) {
          console.error(`Failed to delete orphaned file ${file}:`, error);
        }
      }
    }
  }
} 