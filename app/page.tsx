'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FaceRecognition from '@/components/FaceRecognition';
import PhotoUpload from '@/components/PhotoUpload';
import PhotoGallery from '@/components/PhotoGallery';
import { Photo } from '@/types';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(true);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setIsEnrolled(true);
        setUser(data.user);
      } else {
        setIsAuthenticated(false);
        setIsEnrolled(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setIsEnrolled(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setIsAuthenticated(false);
      setIsEnrolled(false);
      setUser(null);
      setShowEnrollment(false);
      setShowPhotoUpload(false);
      setShowPhotoGallery(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleEnrollmentSuccess = (userId: string) => {
    setIsEnrolled(true);
    setIsAuthenticated(true);
    setShowEnrollment(false);
    // After successful enrollment, the user should be authenticated
    // We can set a basic user object since we have the userId
    setUser({
      id: userId,
      name: 'User',
      createdAt: new Date().toISOString()
    });
  };

  const handleAuthenticationSuccess = (userId: string) => {
    setIsAuthenticated(true);
    setIsEnrolled(true);
    // After successful authentication, get the full user details
    checkAuthStatus();
  };

  const handlePhotoUploadSuccess = (photo: Photo) => {
    console.log('Photo uploaded successfully:', photo);
    // Optionally refresh the photo gallery
    setShowPhotoGallery(true);
  };

  const handlePhotoUploadError = (error: string) => {
    console.error('Photo upload error:', error);
    alert(`Upload failed: ${error}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Photo Wallet</h1>
            <p className="text-gray-600">Secure facial recognition authentication</p>
          </div>

          {!isEnrolled ? (
            <div className="space-y-4">
              <p className="text-center text-gray-600 mb-6">
                Welcome! To get started, you need to enroll your face for authentication.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setIsEnrolling(true);
                    setShowEnrollment(true);
                  }}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Enroll Face
                </button>
                <button
                  onClick={() => {
                    setIsEnrolling(false);
                    setShowEnrollment(true);
                  }}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Login with Face
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Login with OTP
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-gray-600 mb-6">
                Please authenticate using your face to access your photo wallet.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setIsEnrolling(false);
                    setShowEnrollment(true);
                  }}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Authenticate
                </button>
                <button
                  onClick={() => {
                    setIsEnrolling(true);
                    setShowEnrollment(true);
                  }}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Enroll New Face
                </button>
              </div>
            </div>
          )}

          {showEnrollment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {isEnrolling ? 'Face Enrollment' : 'Face Authentication'}
                  </h2>
                  <button
                    onClick={() => setShowEnrollment(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <FaceRecognition
                  isEnrolling={isEnrolling}
                  onAuthSuccess={handleAuthenticationSuccess}
                  onAuthFailure={(error) => {
                    console.error('Authentication failed:', error);
                    alert(`Authentication failed: ${error}`);
                  }}
                  onEnrollmentSuccess={handleEnrollmentSuccess}
                  onEnrollmentFailure={(error) => {
                    console.error('Enrollment failed:', error);
                    alert(`Enrollment failed: ${error}`);
                  }}
                  onClose={() => setShowEnrollment(false)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Photo Wallet</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/profile')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Profile
              </button>
              <button
                onClick={() => router.push('/debug')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Debug
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPhotoUpload(!showPhotoUpload);
                  setShowPhotoGallery(false);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  showPhotoUpload
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Upload Photo
              </button>
              <button
                onClick={() => {
                  setShowPhotoGallery(!showPhotoGallery);
                  setShowPhotoUpload(false);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  showPhotoGallery
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                View Gallery
              </button>
            </div>
          </div>

          {user && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span> {user.name}
                </div>
                {user.email && (
                  <div>
                    <span className="font-medium text-gray-700">Email:</span> {user.email}
                  </div>
                )}
                {user.phone && (
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span> {user.phone}
                  </div>
                )}
                {user.bio && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Bio:</span> {user.bio}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Photo Upload Section */}
        {showPhotoUpload && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Photo</h3>
            <PhotoUpload
              onUploadSuccess={handlePhotoUploadSuccess}
              onUploadError={handlePhotoUploadError}
            />
          </div>
        )}

        {/* Photo Gallery Section */}
        {showPhotoGallery && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Photo Gallery</h3>
            <PhotoGallery />
          </div>
        )}

        {/* Default Welcome Message */}
        {!showPhotoUpload && !showPhotoGallery && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Photo Wallet</h3>
            <p className="text-gray-600 mb-6">
              Upload and manage your photos securely. Use the buttons above to get started.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowPhotoUpload(true);
                  setShowPhotoGallery(false);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Upload Photo
              </button>
              <button
                onClick={() => {
                  setShowPhotoGallery(true);
                  setShowPhotoUpload(false);
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                View Gallery
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 