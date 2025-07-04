'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FaceRecognition from '@/components/FaceRecognition';

export default function HomePage() {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkAuth();
  }, []);

  // Handle login with face recognition
  const handleLoginWithFace = async () => {
    setIsAuthenticating(true);
    setShowCamera(true);
  };

  // Handle enrollment process
  const handleEnroll = async () => {
    setIsEnrolling(true);
    setShowCamera(true);
  };

  // Handle successful authentication
  const handleAuthSuccess = (userId: string) => {
    setShowCamera(false);
    setIsAuthenticating(false);
    router.push('/dashboard');
  };

  // Handle successful enrollment
  const handleEnrollmentSuccess = (userId: string) => {
    setShowCamera(false);
    setIsEnrolling(false);
    router.push('/dashboard');
  };

  // Handle authentication failure
  const handleAuthFailure = (error: string) => {
    setShowCamera(false);
    setIsAuthenticating(false);
    alert(`Authentication failed: ${error}`);
  };

  // Handle enrollment failure
  const handleEnrollmentFailure = (error: string) => {
    setShowCamera(false);
    setIsEnrolling(false);
    alert(`Enrollment failed: ${error}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Photo Wallet
          </h1>
          <p className="text-gray-600">
            Secure photo storage with facial recognition
          </p>
        </div>

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEnrolling ? 'Face Enrollment' : 'Face Recognition'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isEnrolling
                    ? 'Please capture 5 reference images for enrollment'
                    : 'Please look at the camera for authentication'}
                </p>
              </div>
              
              <FaceRecognition
                isEnrolling={isEnrolling}
                onAuthSuccess={handleAuthSuccess}
                onAuthFailure={handleAuthFailure}
                onEnrollmentSuccess={handleEnrollmentSuccess}
                onEnrollmentFailure={handleEnrollmentFailure}
                onClose={() => setShowCamera(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        {isLoggedIn ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Welcome back, {user?.name || 'User'}!
                </h2>
                <p className="text-gray-600">
                  You're already logged in to your Photo Wallet.
                </p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </button>
                
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Edit Profile
                </button>
                
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                    router.push('/');
                  }}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-6">
              {/* Login Button */}
              <button
                onClick={handleLoginWithFace}
                disabled={isAuthenticating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAuthenticating ? 'Authenticating...' : 'Login with Face'}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Enrollment Button */}
              <button
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isEnrolling ? 'Enrolling...' : 'Enroll New Face'}
              </button>

              {/* Info Text */}
              <div className="text-center text-sm text-gray-600">
                <p>
                  First time? Click "Enroll New Face" to register your face.
                </p>
                <p className="mt-1">
                  Already enrolled? Click "Login with Face" to authenticate.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>Secure facial recognition powered by face-api.js</p>
        </div>
      </div>
    </div>
  );
} 