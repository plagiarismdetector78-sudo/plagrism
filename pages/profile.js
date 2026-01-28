import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../components/Navbar';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      if (!userId || !token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditForm(data);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Profile fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
        // Update local storage if name changed
        if (updatedProfile.name) {
          localStorage.setItem('name', updatedProfile.name);
        }
      } else {
        setError('Failed to update profile');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('name');
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Profile - Skill Scanner</title>
        <meta name="description" content="Manage your Skill Scanner profile and account settings" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-50">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          </div>
        </div>

        <div className="relative z-10">
          <Navbar />

          <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">My Profile</h1>
              <p className="text-gray-300 text-lg">Manage your account information and preferences</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-400/20 border border-red-400/50 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-red-300 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            {profile && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-2">
                  <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-white">Personal Information</h2>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Profile
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <form onSubmit={handleSaveProfile} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Full Name
                            </label>
                            <input
                              type="text"
                              name="name"
                              value={editForm.name || ''}
                              onChange={handleEditChange}
                              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                              placeholder="Enter your full name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Email
                            </label>
                            <input
                              type="email"
                              value={profile.email}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 cursor-not-allowed"
                              disabled
                            />
                            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              value={editForm.phone || ''}
                              onChange={handleEditChange}
                              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                              placeholder="Enter your phone number"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Role
                            </label>
                            <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 capitalize">
                              {profile.role}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Bio
                          </label>
                          <textarea
                            name="bio"
                            value={editForm.bio || ''}
                            onChange={handleEditChange}
                            rows="4"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm resize-none"
                            placeholder="Tell us about yourself..."
                          />
                        </div>

                        <div className="flex space-x-4 pt-4">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50"
                          >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(false);
                              setEditForm(profile);
                            }}
                            className="flex-1 bg-white/10 border border-white/20 text-white py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                            <div className="text-white text-lg">{profile.name || 'Not set'}</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <div className="text-white text-lg">{profile.email}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                            <div className="text-white text-lg">{profile.phone || 'Not set'}</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                            <div className="text-white text-lg capitalize">{profile.role}</div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                          <div className="text-white text-lg">
                            {profile.bio || 'No bio provided'}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Member Since</label>
                          <div className="text-white text-lg">
                            {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Account Status */}
                  <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Account Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Verification</span>
                        <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                          Verified
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Role</span>
                        <span className="text-white capitalize">{profile.role}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Status</span>
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => router.push(profile.role === 'interviewer' ? '/dashboard/interviewer' : '/dashboard/candidate')}
                        className="w-full text-left px-4 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all duration-200"
                      >
                        Go to Dashboard
                      </button>
                      <button
                        onClick={() => router.push('/meeting/setup')}
                        className="w-full text-left px-4 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all duration-200"
                      >
                        Schedule Interview
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/30 transition-all duration-200"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}