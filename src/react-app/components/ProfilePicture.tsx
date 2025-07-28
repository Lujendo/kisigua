import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ImageUpload } from './ImageUpload';

interface ProfilePictureProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

export const ProfilePicture: React.FC<ProfilePictureProps> = ({
  size = 'md',
  editable = false,
  className = ''
}) => {
  const { user, token } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState((user as any)?.profileImageUrl);

  const handleImageUpload = async (imageUrl: string, imageId: string) => {
    try {
      setIsUploading(true);

      // Update user profile with new image
      const response = await fetch('/api/user/profile-image', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageUrl,
          imageId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile image');
      }

      const result = await response.json();
      setProfileImageUrl(result.user.profileImageUrl);
      setShowUploader(false);
    } catch (error) {
      console.error('Profile image update error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    // You could show a toast notification here
  };

  const getInitials = () => {
    if (!user) return '?';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const baseClasses = `
    ${sizeClasses[size]} 
    rounded-full 
    object-cover 
    border-2 
    border-gray-200
    ${className}
  `;

  if (showUploader && editable) {
    return (
      <div className="relative">
        <div className={`${baseClasses} bg-gray-100 flex items-center justify-center`}>
          <svg className="w-1/2 h-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        
        <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-64">
          <div className="mb-2">
            <h3 className="text-sm font-medium text-gray-900">Upload Profile Picture</h3>
            <p className="text-xs text-gray-500">Choose a photo to represent you</p>
          </div>
          
          <ImageUpload
            onUpload={handleImageUpload}
            onError={handleUploadError}
            maxSize={5} // 5MB limit for profile pictures
            acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
            multiple={false}
            className="mb-3"
          >
            <div className="text-center py-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-green-600">Click to upload</span> or drag and drop
              </div>
              <div className="text-xs text-gray-500 mt-1">
                JPG, PNG, WEBP up to 5MB
              </div>
            </div>
          </ImageUpload>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowUploader(false)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              disabled={isUploading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      {profileImageUrl ? (
        <img
          src={profileImageUrl}
          alt={`${user?.firstName} ${user?.lastName}`}
          className={baseClasses}
        />
      ) : (
        <div className={`${baseClasses} bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-medium`}>
          {getInitials()}
        </div>
      )}

      {editable && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full transition-all duration-200">
          <button
            onClick={() => setShowUploader(true)}
            className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium transition-opacity"
            disabled={isUploading}
          >
            {isUploading ? (
              <div className="flex items-center space-x-1">
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Uploading...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Edit</span>
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
