// frontend/src/pages/Settings.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../useAuth';
import ThemeToggle from '../components/ThemeToggle';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { logout, token, user } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.msg || 'Failed to delete account');
      }

      // Successfully deleted account
      toast.success('Account deleted successfully');
      logout();
      navigate('/signup');
    } catch (err: any) {
      console.error('Account deletion error:', err);
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>
        
        <div className="space-y-8">
          {/* Profile Settings */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {user?.role === "influencer" && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Edit Profile</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    Update your profile information and public visibility settings.
                  </p>
                  <button
                    onClick={() => navigate('/influencer-profile')}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
              
              {user?.role === "brand" && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Brand Profile</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    Manage your brand information and sponsorship preferences.
                  </p>
                  <button
                    onClick={() => navigate('/brand-profile')}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm"
                  >
                    Edit Brand Profile
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Appearance Settings */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">Dark Mode</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Toggle between light and dark themes
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>
          
          {/* Account Settings */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account</h2>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-900/50">
              <h3 className="font-medium text-red-800 dark:text-red-200 mb-1">Delete Account</h3>
              <p className="text-red-700 dark:text-red-300 text-sm mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
