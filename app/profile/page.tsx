'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Check authentication and load profile
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include',
        });

        if (!response.ok) {
          router.push('/');
          return;
        }

        const userData = await response.json();
        if (userData.user) {
          // Load profile data
          const profileResponse = await fetch('/api/profile', {
            credentials: 'include',
          });

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            setProfile(profileData);
            setFormData({
              name: profileData.name || '',
              email: profileData.email || '',
              phone: profileData.phone || '',
              bio: profileData.bio || '',
            });
          } else {
            // Create default profile
            setProfile({
              id: userData.user.id,
              name: userData.user.name,
              email: '',
              phone: '',
              bio: '',
              createdAt: userData.user.createdAt,
            });
            setFormData({
              name: userData.user.name,
              email: '',
              phone: '',
              bio: '',
            });
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
      } else {
        console.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 mt-20">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Profile Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEditing ? 'Edit Profile' : 'Profile Information'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your personal information and preferences
                </p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-8 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 ">
            {isEditing ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Name */}
                  <div className="space-y-3">
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-800 tracking-wide uppercase">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-3">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-800 tracking-wide uppercase">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="Enter your email address"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-3">
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-800 tracking-wide uppercase">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {/* Bio */}
                  <div className="lg:col-span-2 space-y-3">
                    <label htmlFor="bio" className="block text-sm font-semibold text-gray-800 tracking-wide uppercase">
                      Professional Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={5}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm resize-none"
                      placeholder="Tell us about your professional background and expertise..."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-6 pt-8 border-t-2 border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: profile?.name || '',
                        email: profile?.email || '',
                        phone: profile?.phone || '',
                        bio: profile?.bio || '',
                      });
                    }}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Name */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-800 tracking-wide uppercase">
                      Full Name
                    </label>
                    <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-gray-900 font-medium">{profile?.name || 'Not provided'}</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-800 tracking-wide uppercase">
                      Email Address
                    </label>
                    <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-gray-900 font-medium">{profile?.email || 'Not provided'}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-800 tracking-wide uppercase">
                      Phone Number
                    </label>
                    <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-gray-900 font-medium">{profile?.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="lg:col-span-2 space-y-3">
                    <label className="block text-sm font-semibold text-gray-800 tracking-wide uppercase">
                      Professional Bio
                    </label>
                    <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 min-h-[120px]">
                      <p className="text-gray-900 leading-relaxed">{profile?.bio || 'No bio provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Account Info */}
                <div className="pt-8 border-t-2 border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-2 h-8 bg-blue-600 rounded-full mr-4"></span>
                    Account Information
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-800 tracking-wide uppercase">
                        User ID
                      </label>
                      <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-600 font-mono">{profile?.id}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-800 tracking-wide uppercase">
                        Member Since
                      </label>
                      <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-600 font-medium">
                          {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 