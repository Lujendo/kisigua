import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ImageUpload } from './ImageUpload';
import { ImageGallery, ImageItem } from './ImageGallery';
import { DocumentUpload, DocumentList, DocumentItem } from './DocumentUpload';

interface StorageUsage {
  totalSize: number;
  fileCount: number;
  breakdown: Record<string, { size: number; count: number }>;
}

interface FileManagerProps {
  className?: string;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const FileManager: React.FC<FileManagerProps> = ({ className = '' }) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'images' | 'documents' | 'usage'>('images');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount and tab change
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === 'images') {
        await loadImages();
      } else if (activeTab === 'documents') {
        await loadDocuments();
      } else if (activeTab === 'usage') {
        await loadStorageUsage();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadImages = async () => {
    const response = await fetch('/api/user/files?type=images', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to load images');
    }

    const data = await response.json();
    
    // Convert file list to ImageItem format
    const imageItems: ImageItem[] = data.files
      .filter((file: any) => file.fileType.startsWith('image/'))
      .map((file: any) => ({
        id: file.id,
        url: file.url,
        alt: file.fileName,
        caption: `Uploaded ${new Date(file.createdAt).toLocaleDateString()}`
      }));

    setImages(imageItems);
  };

  const loadDocuments = async () => {
    const response = await fetch('/api/user/files?type=documents', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to load documents');
    }

    const data = await response.json();
    
    // Convert file list to DocumentItem format
    const documentItems: DocumentItem[] = data.files
      .filter((file: any) => !file.fileType.startsWith('image/'))
      .map((file: any) => ({
        id: file.id,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        uploadDate: file.createdAt,
        url: file.url,
        documentType: getDocumentTypeFromPath(file.r2Key)
      }));

    setDocuments(documentItems);
  };

  const loadStorageUsage = async () => {
    const response = await fetch('/api/user/storage-usage', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to load storage usage');
    }

    const data = await response.json();
    setStorageUsage(data.usage);
  };

  // File type is now provided by the database

  const getDocumentTypeFromPath = (path: string): 'certification' | 'license' | 'other' => {
    if (path.includes('/certification/')) return 'certification';
    if (path.includes('/license/')) return 'license';
    return 'other';
  };

  const handleImageUpload = (imageUrl: string, imageId: string) => {
    const newImage: ImageItem = {
      id: imageId,
      url: imageUrl,
      alt: `Uploaded image ${imageId}`,
      caption: `Image ${images.length + 1}`
    };
    setImages(prev => [...prev, newImage]);
  };

  const handleDocumentUpload = (document: DocumentItem) => {
    setDocuments(prev => [...prev, document]);
  };

  const handleImageDelete = async (imageId: string) => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(imageId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete image');
    }
  };

  const handleDocumentDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(documentId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete document');
    }
  };

  const handleDocumentDownload = (document: DocumentItem) => {
    window.open(document.url, '_blank');
  };

  const handleImageReorder = (reorderedImages: ImageItem[]) => {
    setImages(reorderedImages);
    // In a real app, you might want to save the new order to the backend
  };

  const tabs = [
    { id: 'images' as const, label: 'Images', icon: '🖼️' },
    { id: 'documents' as const, label: 'Documents', icon: '📄' },
    { id: 'usage' as const, label: 'Storage Usage', icon: '💾' }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">File Manager</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your uploaded images and documents</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm underline mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        ) : (
          <>
            {activeTab === 'images' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Images</h3>
                  <ImageUpload
                    onUpload={handleImageUpload}
                    onError={setError}
                    multiple={true}
                    maxSize={10}
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Your Images</h3>
                  <ImageGallery
                    images={images}
                    onDelete={handleImageDelete}
                    onReorder={handleImageReorder}
                    editable={true}
                  />
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Documents</h3>
                  <DocumentUpload
                    onUpload={handleDocumentUpload}
                    onError={setError}
                    multiple={true}
                    maxSize={10}
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Your Documents</h3>
                  <DocumentList
                    documents={documents}
                    onDelete={handleDocumentDelete}
                    onDownload={handleDocumentDownload}
                  />
                </div>
              </div>
            )}

            {activeTab === 'usage' && storageUsage && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">{formatBytes(storageUsage.totalSize)}</div>
                      <div className="text-sm text-gray-600">Total Used</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">{storageUsage.fileCount}</div>
                      <div className="text-sm text-gray-600">Total Files</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {Math.round((storageUsage.totalSize / (100 * 1024 * 1024)) * 100)}%
                      </div>
                      <div className="text-sm text-gray-600">of 100MB Used</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(storageUsage.breakdown).map(([category, data]) => (
                      <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 capitalize">{category}</div>
                          <div className="text-sm text-gray-600">{data.count} files</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{formatBytes(data.size)}</div>
                          <div className="text-sm text-gray-600">
                            {Math.round((data.size / storageUsage.totalSize) * 100)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
