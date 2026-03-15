import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const ProfileCompletionPopup = ({ userId, missingFields, onClose, onProfileComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    address: '',
    qualification: '',
    recentStudied: '',
    gender: '',
    bio: '',
  });
  const router = useRouter();

  useEffect(() => {
    // Show popup after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchCurrentProfile();
    }
  }, [userId]);

  const fetchCurrentProfile = async () => {
    try {
      const res = await fetch(`/api/get-profile?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(prev => ({ ...prev, ...data.profile }));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...profile }),
      });
      const data = await res.json();

      if (data.success) {
        // Check if profile is now complete
        const checkRes = await fetch(`/api/check-profile-complete?userId=${userId}`);
        const checkData = await checkRes.json();
        
        if (checkData.success && checkData.isComplete) {
          onProfileComplete?.();
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        } else {
          alert('Please complete all required fields: Full Name, Phone, Qualification, Recent Education, and Gender');
        }
      } else {
        alert(data.message || 'Failed to update profile.');
      }
    } catch (error) {
      alert('Network error updating profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const getFieldLabel = (field) => {
    const labels = {
      full_name: 'Full Name',
      phone: 'Phone Number',
      qualification: 'Highest Qualification',
      recent_studied: 'Recent Education',
      gender: 'Gender'
    };
    return labels[field] || field;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 ">
      <div className="backdrop-blur-xl bg-gray-800/95 rounded-3xl border border-white/10 shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mt-20 ">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Complete Your Profile</h3>
              <p className="text-gray-300 text-sm">
                Please complete your profile to access all features
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Missing Fields Warning */}
        {missingFields && missingFields.length > 0 && missingFields[0] !== 'all' && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
            <div className="flex items-center space-x-2 text-yellow-300 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-semibold">Missing Required Fields:</span>
            </div>
            <div className="text-yellow-200 text-sm">
              {missingFields.map(field => getFieldLabel(field)).join(', ')}
            </div>
          </div>
        )}

        {/* Profile Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[
            { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Enter your full name', required: true },
            { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1 (555) 123-4567', required: true },
            { key: 'qualification', label: 'Highest Qualification', type: 'text', placeholder: 'e.g., Bachelor\'s Degree', required: true },
            { key: 'recentStudied', label: 'Recent Education', type: 'text', placeholder: 'e.g., University Name', required: true },
            { key: 'gender', label: 'Gender', type: 'select', options: ['', 'Male', 'Female', 'Other', 'Prefer not to say'], required: true },
          ].map(({ key, label, type, placeholder, options, required }) => (
            <div key={key} className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                {label} {required && <span className="text-red-400">*</span>}
              </label>
              {type === 'select' ? (
                <select
                  value={profile[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                >
                  {options.map(option => (
                    <option key={option} value={option} className="text-gray-800">
                      {option || 'Select gender'}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={type}
                  placeholder={placeholder}
                  value={profile[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                />
              )}
            </div>
          ))}

          {/* Address */}
          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Address
            </label>
            <textarea
              placeholder="Enter your complete address"
              value={profile.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              rows="2"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 resize-none"
            />
          </div>

          {/* Bio */}
          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Bio
            </label>
            <textarea
              placeholder="Tell us about yourself, your skills, and experience..."
              value={profile.bio || ''}
              onChange={(e) => handleChange('bio', e.target.value)}
              rows="3"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
          <button
            onClick={handleClose}
            className="px-6 py-3 text-gray-300 hover:text-white border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-300"
          >
            Later
          </button>
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isUpdating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Complete Profile'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionPopup;