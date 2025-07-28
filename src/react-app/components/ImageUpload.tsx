import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ImageUploadProps {
  onUpload: (imageUrl: string, imageId: string) => void;
  onError?: (error: string) => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  multiple?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  onError,
  maxSize = 10, // 10MB default
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  multiple = false,
  className = '',
  children
}) => {
  const { token } = useAuth();
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use: ${acceptedTypes.join(', ')}`;
    }

    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<void> => {
    const fileId = `upload_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // Add to uploads state
    setUploads(prev => [...prev, {
      fileId,
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }]);

    try {
      // Step 1: Get signed upload URL
      const signedUrlResponse = await fetch('/api/upload/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        })
      });

      if (!signedUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, fileId: serverFileId, r2Key } = await signedUrlResponse.json();

      // Step 2: Upload file to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const result = await uploadResponse.json();

      // Update upload status
      setUploads(prev => prev.map(upload => 
        upload.fileId === fileId 
          ? { ...upload, progress: 100, status: 'completed' }
          : upload
      ));

      // Call success callback
      onUpload(result.url || `/files/${r2Key}`, serverFileId);

      // Remove from uploads after delay
      setTimeout(() => {
        setUploads(prev => prev.filter(upload => upload.fileId !== fileId));
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      // Update upload status
      setUploads(prev => prev.map(upload => 
        upload.fileId === fileId 
          ? { ...upload, status: 'error', error: errorMessage }
          : upload
      ));

      onError?.(errorMessage);

      // Remove from uploads after delay
      setTimeout(() => {
        setUploads(prev => prev.filter(upload => upload.fileId !== fileId));
      }, 5000);
    }
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        onError?.(validationError);
        continue;
      }

      await uploadFile(file);
    }
  }, [maxSize, acceptedTypes, token, onUpload, onError]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = event.dataTransfer.files;
    if (files) {
      handleFiles(files);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drop zone */}
      <div
        onClick={openFileDialog}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
          }
        `}
      >
        {children || (
          <div className="space-y-2">
            <div className="text-gray-600">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-green-600">Click to upload</span> or drag and drop
            </div>
            <div className="text-xs text-gray-500">
              {acceptedTypes.map(type => type.split('/')[1]).join(', ').toUpperCase()} up to {maxSize}MB
            </div>
          </div>
        )}
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploads.map((upload) => (
            <div key={upload.fileId} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 truncate">
                  {upload.fileName}
                </span>
                <span className="text-xs text-gray-500">
                  {upload.status === 'uploading' && `${upload.progress}%`}
                  {upload.status === 'completed' && '✓'}
                  {upload.status === 'error' && '✗'}
                </span>
              </div>
              
              {upload.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
              
              {upload.status === 'error' && upload.error && (
                <div className="text-xs text-red-600 mt-1">
                  {upload.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
