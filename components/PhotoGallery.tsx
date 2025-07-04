'use client';

import { useState } from 'react';

interface Photo {
  id: string;
  filename: string;
  url: string;
  uploadedAt: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onPhotoDeleted: () => void;
}

export default function PhotoGallery({ photos, onPhotoDeleted }: PhotoGalleryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Handle photo deletion
  const handleDelete = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    setDeletingId(photoId);

    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onPhotoDeleted();
      } else {
        const error = await response.text();
        alert(`Delete failed: ${error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Format upload date
  const formatDate = (dateString: string) => {
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
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
        >
          {/* Photo */}
          <div className="relative aspect-square">
            <img
              src={photo.url}
              alt={photo.filename}
              className="w-full h-full object-cover"
            />
            
            {/* Delete Button */}
            <button
              onClick={() => handleDelete(photo.id)}
              disabled={deletingId === photo.id}
              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Delete photo"
            >
              {deletingId === photo.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Photo Info */}
          <div className="p-4">
            <p className="text-sm font-medium text-gray-900 truncate">
              {photo.filename}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(photo.uploadedAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
} 