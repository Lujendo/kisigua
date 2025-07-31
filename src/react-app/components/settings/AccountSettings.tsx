import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AccountSettings: React.FC = () => {
  const { user, token, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Verification email sent! Please check your inbox.' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to send verification email' });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setMessage({ type: 'error', text: 'An error occurred while sending verification email' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setMessage({ type: 'error', text: 'Please type "DELETE" to confirm account deletion' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Account deleted successfully. You will be logged out.' });
        setTimeout(() => {
          logout();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete account' });
      }
    } catch (error) {
      console.error('Delete account error:', error);
      setMessage({ type: 'error', text: 'An error occurred while deleting your account' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/export-data', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kisigua-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setMessage({ type: 'success', text: 'Data export downloaded successfully!' });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to export data' });
      }
    } catch (error) {
      console.error('Export data error:', error);
      setMessage({ type: 'error', text: 'An error occurred while exporting your data' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
        <p className="text-sm text-gray-600 mb-6">
          Manage your account security, data, and preferences.
        </p>

        {/* Success/Error Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className="flex">
              <svg className={`h-5 w-5 ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {message.type === 'success' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
              <p className="ml-3 text-sm">{message.text}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Email Verification */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-md font-medium text-gray-900">Email Verification</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {user?.emailVerified 
                    ? 'Your email address is verified' 
                    : 'Your email address needs verification'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {user?.emailVerified ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Not Verified
                    </span>
                    <button
                      onClick={handleResendVerification}
                      disabled={isLoading}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      Resend Email
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Account Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Account Type:</span>
                <span className="ml-2 font-medium capitalize">{user?.role}</span>
              </div>
              <div>
                <span className="text-gray-600">Member Since:</span>
                <span className="ml-2 font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Last Login:</span>
                <span className="ml-2 font-medium">
                  {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Account Status:</span>
                <span className="ml-2 font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Data Management</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Export Your Data</p>
                  <p className="text-sm text-gray-600">Download a copy of all your data</p>
                </div>
                <button
                  onClick={handleExportData}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-md font-medium text-red-900 mb-3">Danger Zone</h4>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-red-900">Delete Account</p>
                <p className="text-sm text-red-700 mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-red-900 mb-1">
                        Type "DELETE" to confirm:
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                        placeholder="DELETE"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isLoading || deleteConfirmText !== 'DELETE'}
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                        }}
                        className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
