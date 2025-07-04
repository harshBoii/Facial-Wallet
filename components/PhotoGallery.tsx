'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Photo {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  url: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onPhotoDeleted: () => void;
}

export default function PhotoGallery({ photos, onPhotoDeleted }: PhotoGalleryProps) {
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);

  const handleDeletePhoto = async (photoId: string) => {
    if (confirm('Are you sure you want to delete this photo?')) {
      setDeletingPhoto(photoId);
      try {
        const response = await fetch(`/api/photos/${photoId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (response.ok) {
          onPhotoDeleted();
        } else {
          alert('Failed to delete photo');
        }
      } catch (error) {
        console.error('Delete photo error:', error);
        alert('Failed to delete photo');
      } finally {
        setDeletingPhoto(null);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-gray-500">No photos uploaded yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Upload your first photo to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="relative aspect-square">
            <Image
              src={photo.url}
              alt={photo.originalName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            <div className="absolute top-2 right-2">
              <button
                onClick={() => handleDeletePhoto(photo.id)}
                disabled={deletingPhoto === photo.id}
                className="bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
                title="Delete photo"
              >
                {deletingPhoto === photo.id ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="p-3">
            <p className="text-sm font-medium text-gray-900 truncate" title={photo.originalName}>
              {photo.originalName}
            </p>
            <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
              <span>{formatFileSize(photo.size)}</span>
              <span>{formatDate(photo.uploadedAt)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 