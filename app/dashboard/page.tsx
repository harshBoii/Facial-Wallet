'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PhotoUpload from '@/components/PhotoUpload';
import PhotoGallery from '@/components/PhotoGallery';
import { Photo, User } from '@/types';
import FileUploadTabs from '@/components/FileUploadTabs';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check authentication and load user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        if (!response.ok) {
          router.push('/');
          return;
        }
        
        const userData = await response.json();
        // Extract the user object from the response
        setUser(userData.user);
        
        // Load user's photos
        await loadPhotos();
      } catch (error) {
        console.error('Authentication check failed:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Load user's photos
  const loadPhotos = async () => {
    try {
      const response = await fetch('/api/photos');
      if (response.ok) {
        const photosData = await response.json();
        setPhotos(photosData);
      }
    } catch (error) {
      console.error('Failed to load photos:', error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Handle photo upload success
  const handlePhotoUploaded = (newPhoto: Photo) => {
    setPhotos(prev => [newPhoto, ...prev]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to home
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-slate-800">
                Photo Wallet
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-slate-600 font-medium">
                Welcome, {user.name || user.id}
              </span>
              <button
                onClick={() => router.push('/profile')}
                className="text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors font-medium"
              >
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* User Info Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-slate-200/50">
            <h2 className="text-2xl font-semibold text-slate-800 mb-6 flex items-center">
              <svg className="w-6 h-6 text-slate-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Account Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100/50">
                <p className="text-sm text-slate-500 mb-2 font-medium">Name</p>
                <p className="font-semibold text-slate-800 text-lg">{user.name || 'Not set'}</p>
              </div>
              {user.email && (
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100/50">
                  <p className="text-sm text-slate-500 mb-2 font-medium">Email</p>
                  <p className="font-semibold text-slate-800 text-lg">{user.email}</p>
                </div>
              )}
              {user.phone && (
                <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-100/50">
                  <p className="text-sm text-slate-500 mb-2 font-medium">Phone</p>
                  <p className="font-semibold text-slate-800 text-lg">{user.phone}</p>
                </div>
              )}
              <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-slate-100/50">
                <p className="text-sm text-slate-500 mb-2 font-medium">User ID</p>
                <p className="font-mono text-sm text-slate-600">{user.id}</p>
              </div>
              {user.bio && (
                <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100/50 md:col-span-2 lg:col-span-3">
                  <p className="text-sm text-slate-500 mb-2 font-medium">Bio</p>
                  <p className="text-slate-800 leading-relaxed">{user.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* File Upload Tabs Section */}

          {/* Gallery Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-slate-200/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-slate-800 flex items-center">
                <svg className="w-6 h-6 text-slate-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Your Files ({photos.length})
              </h2>
              <button
                onClick={() => router.push('/gallery')}
                className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>View Full Gallery</span>
              </button>
            </div>
            <PhotoGallery />
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-slate-200/50">
            <h2 className="text-2xl font-semibold text-slate-800 mb-6 flex items-center">
              <svg className="w-6 h-6 text-slate-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Files
            </h2>
            <FileUploadTabs />
          </div>

        </div>
      </main>
    </div>
  );
} 