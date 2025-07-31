import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationPreferences {
  emailNotifications: {
    newListings: boolean;
    favorites: boolean;
    messages: boolean;
    newsletter: boolean;
    security: boolean;
  };
  pushNotifications: {
    newListings: boolean;
    favorites: boolean;
    messages: boolean;
  };
}

const NotificationSettings: React.FC = () => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: {
      newListings: true,
      favorites: true,
      messages: true,
      newsletter: false,
      security: true
    },
    pushNotifications: {
      newListings: false,
      favorites: true,
      messages: true
    }
  });

  const handleEmailToggle = (key: keyof NotificationPreferences['emailNotifications']) => {
    setPreferences(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [key]: !prev.emailNotifications[key]
      }
    }));
  };

  const handlePushToggle = (key: keyof NotificationPreferences['pushNotifications']) => {
    setPreferences(prev => ({
      ...prev,
      pushNotifications: {
        ...prev.pushNotifications,
        [key]: !prev.pushNotifications[key]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Notification preferences updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update preferences' });
      }
    } catch (error) {
      console.error('Notification preferences update error:', error);
      setMessage({ type: 'error', text: 'An error occurred while updating your preferences' });
    } finally {
      setIsLoading(false);
    }
  };

  const ToggleSwitch: React.FC<{ enabled: boolean; onChange: () => void; disabled?: boolean }> = ({ 
    enabled, 
    onChange, 
    disabled = false 
  }) => (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
        enabled ? 'bg-green-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
        <p className="text-sm text-gray-600 mb-6">
          Choose how you want to be notified about activity on Kisigua.
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Email Notifications */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Notifications
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">New Listings</p>
                  <p className="text-sm text-gray-500">Get notified when new sustainable locations are added in your area</p>
                </div>
                <ToggleSwitch 
                  enabled={preferences.emailNotifications.newListings}
                  onChange={() => handleEmailToggle('newListings')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Favorite Updates</p>
                  <p className="text-sm text-gray-500">Get notified when your favorite locations have updates</p>
                </div>
                <ToggleSwitch 
                  enabled={preferences.emailNotifications.favorites}
                  onChange={() => handleEmailToggle('favorites')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Messages</p>
                  <p className="text-sm text-gray-500">Get notified when you receive new messages</p>
                </div>
                <ToggleSwitch 
                  enabled={preferences.emailNotifications.messages}
                  onChange={() => handleEmailToggle('messages')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Newsletter</p>
                  <p className="text-sm text-gray-500">Receive our weekly newsletter with sustainability tips and featured locations</p>
                </div>
                <ToggleSwitch 
                  enabled={preferences.emailNotifications.newsletter}
                  onChange={() => handleEmailToggle('newsletter')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Security Alerts</p>
                  <p className="text-sm text-gray-500">Important security notifications about your account (recommended)</p>
                </div>
                <ToggleSwitch 
                  enabled={preferences.emailNotifications.security}
                  onChange={() => handleEmailToggle('security')}
                />
              </div>
            </div>
          </div>

          {/* Push Notifications */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 1 6 6v2.25a2.25 2.25 0 0 0 2.25 2.25H21a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1 0-1.5h2.25A2.25 2.25 0 0 0 7.5 12V9.75a6 6 0 0 1 6-6Z" />
              </svg>
              Push Notifications
            </h4>
            <p className="text-sm text-gray-500 mb-4">
              Receive instant notifications on your device (requires browser permission)
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">New Listings</p>
                  <p className="text-sm text-gray-500">Instant alerts for new sustainable locations</p>
                </div>
                <ToggleSwitch 
                  enabled={preferences.pushNotifications.newListings}
                  onChange={() => handlePushToggle('newListings')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Favorite Updates</p>
                  <p className="text-sm text-gray-500">Instant alerts for favorite location updates</p>
                </div>
                <ToggleSwitch 
                  enabled={preferences.pushNotifications.favorites}
                  onChange={() => handlePushToggle('favorites')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Messages</p>
                  <p className="text-sm text-gray-500">Instant alerts for new messages</p>
                </div>
                <ToggleSwitch 
                  enabled={preferences.pushNotifications.messages}
                  onChange={() => handlePushToggle('messages')}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationSettings;
