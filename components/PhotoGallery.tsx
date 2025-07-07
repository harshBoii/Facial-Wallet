'use client';

import React, { useState, useEffect } from 'react';
import { Photo } from '@/types';

interface PhotoGalleryProps {
  onPhotoSelect?: (photo: Photo) => void;
}

export default function PhotoGallery({ onPhotoSelect }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      console.log('Fetching photos...');
      const response = await fetch('/api/photos', {
        credentials: 'include'
      });
      
      console.log('Photos response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }
      
      const data = await response.json();
      console.log('Photos data:', data);
      setPhotos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }
      
      // Remove the photo from the local state
      setPhotos(photos.filter(photo => photo.id !== photoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
    }
  };

  // Group photos by type
  const images = photos.filter(p => p.mimeType.startsWith('image/'));
  const videos = photos.filter(p => p.mimeType.startsWith('video/'));
  const audios = photos.filter(p => p.mimeType.startsWith('audio/'));
  const excels = photos.filter(p => p.mimeType.includes('excel') || p.mimeType.includes('spreadsheet'));
  const documents = photos.filter(p =>
    (p.mimeType.includes('pdf') || p.mimeType.includes('word') || (p.mimeType.startsWith('application/') && !p.mimeType.includes('excel') && !p.mimeType.includes('spreadsheet') && !p.mimeType.includes('word') && !p.mimeType.includes('pdf')))
  );

  const folders = [
    { key: 'images', label: 'Images', icon: '🖼️', items: images },
    { key: 'videos', label: 'Videos', icon: '🎬', items: videos },
    { key: 'audios', label: 'Audio', icon: '🎵', items: audios },
    { key: 'excels', label: 'Excel Files', icon: '📊', items: excels },
    { key: 'documents', label: 'Documents', icon: '📄', items: documents },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchPhotos}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!openFolder) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-4">
        {folders.map(folder => (
          <button
            key={folder.key}
            className="flex flex-col items-center justify-center bg-gray-100 rounded-lg shadow hover:bg-blue-50 transition p-6 cursor-pointer h-40"
            onClick={() => setOpenFolder(folder.key)}
            disabled={folder.items.length === 0}
            style={{ opacity: folder.items.length === 0 ? 0.5 : 1 }}
          >
            <span className="text-5xl mb-2">{folder.icon}</span>
            <span className="font-semibold text-lg mb-1">{folder.label}</span>
            <span className="text-xs text-gray-500">{folder.items.length} file{folder.items.length !== 1 ? 's' : ''}</span>
          </button>
        ))}
      </div>
    );
  }

  const currentFolder = folders.find(f => f.key === openFolder);

  return (
    <div>
      <button
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
        onClick={() => setOpenFolder(null)}
      >
        ← Back to Folders
      </button>
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <span className="mr-2 text-2xl">{currentFolder?.icon}</span>
        {currentFolder?.label}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {currentFolder?.items.map(photo => (
          <div key={photo.id} className="relative group">
            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
              {openFolder === 'images' && (
                <img
                  src={photo.url}
                  alt={photo.originalName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    console.error('Failed to load image:', photo.url);
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YWFhYSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              )}
              {openFolder === 'videos' && (
                <video
                  src={photo.url}
                  controls
                  className="w-full h-full object-cover"
                  style={{ background: '#222' }}
                >
                  Your browser does not support the video tag.
                </video>
              )}
              {openFolder === 'audios' && (
                <audio controls className="w-full">
                  <source src={photo.url} type={photo.mimeType} />
                  Your browser does not support the audio element.
                </audio>
              )}
              {openFolder === 'excels' && (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <span className="text-4xl mb-2">📊</span>
                  <a
                    href={photo.url}
                    download={photo.originalName}
                    className="text-blue-600 underline text-xs mt-1"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                  >Download</a>
                  <span className="text-xs text-gray-600 mt-1 truncate max-w-[90%]">{photo.originalName}</span>
                </div>
              )}
              {openFolder === 'documents' && (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <span className="text-4xl mb-2">
                    {photo.mimeType.includes('pdf') && '📄'}
                    {photo.mimeType.includes('word') && '📄'}
                    {photo.mimeType.startsWith('application/') && !photo.mimeType.includes('pdf') && !photo.mimeType.includes('excel') && !photo.mimeType.includes('spreadsheet') && !photo.mimeType.includes('word') && '📁'}
                  </span>
                  <a
                    href={photo.url}
                    download={photo.originalName}
                    className="text-blue-600 underline text-xs mt-1"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                  >Download</a>
                  <span className="text-xs text-gray-600 mt-1 truncate max-w-[90%]">{photo.originalName}</span>
                </div>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
              title="Delete file"
            >×</button>
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="truncate">{photo.originalName}</p>
              <p className="text-xs opacity-75">{new Date(photo.uploadedAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 