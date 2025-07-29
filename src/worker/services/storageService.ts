export interface FileUpload {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  r2Key: string;
  r2Bucket: string;
  uploadStatus: 'pending' | 'completed' | 'failed';
  userId: string;
  createdAt: string;
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  url?: string;
  error?: string;
}

export interface SignedUploadUrl {
  uploadUrl: string;
  fileId: string;
  r2Key: string;
}

export class StorageService {
  private r2: R2Bucket;
  private baseUrl: string;
  private db: D1Database;

  constructor(r2Bucket: R2Bucket, db: D1Database, bucketName: string, baseUrl: string) {
    this.r2 = r2Bucket;
    this.db = db;
    this.baseUrl = baseUrl;
    // bucketName is stored in the constructor but not used in this implementation
    console.log(`Storage service initialized for bucket: ${bucketName}`);
  }

  // Generate a signed upload URL for direct client uploads
  async generateSignedUploadUrl(
    userId: string,
    fileName: string,
    fileType: string,
    fileSize: number
  ): Promise<SignedUploadUrl> {
    // Validate file type
    if (!this.isAllowedFileType(fileType)) {
      throw new Error(`File type ${fileType} is not allowed`);
    }

    // Validate file size (max 10MB)
    if (fileSize > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit');
    }

    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const sanitizedFileName = this.sanitizeFileName(fileName);
    
    // Create R2 key with organized structure
    const r2Key = `uploads/${userId}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileId}_${sanitizedFileName}`;

    // For R2, we'll use a presigned URL approach
    // Note: This is a simplified implementation. In production, you'd use R2's presigned URL API
    const uploadUrl = `${this.baseUrl}/api/upload/${fileId}`;

    return {
      uploadUrl,
      fileId,
      r2Key
    };
  }

  // Track file upload in database
  async trackFileUpload(
    fileId: string,
    userId: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    r2Key: string,
    bucketName: string,
    status: 'pending' | 'completed' | 'failed' = 'pending'
  ): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO file_uploads (id, user_id, file_name, file_size, file_type, r2_key, r2_bucket, upload_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      await stmt.bind(fileId, userId, fileName, fileSize, fileType, r2Key, bucketName, status).run();
    } catch (error) {
      console.error('Database tracking error:', error);
      // Don't throw - file upload can succeed even if tracking fails
    }
  }

  // Update file upload status
  async updateFileUploadStatus(fileId: string, status: 'completed' | 'failed'): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        UPDATE file_uploads SET upload_status = ? WHERE id = ?
      `);

      await stmt.bind(status, fileId).run();
    } catch (error) {
      console.error('Database status update error:', error);
    }
  }

  // Get user's uploaded files from database
  async getUserFiles(userId: string, fileType?: string): Promise<any[]> {
    try {
      let query = `
        SELECT id, file_name, file_size, file_type, r2_key, r2_bucket, upload_status, created_at
        FROM file_uploads
        WHERE user_id = ? AND upload_status = 'completed'
      `;
      const params = [userId];

      if (fileType) {
        if (fileType === 'images') {
          query += ` AND file_type LIKE 'image/%'`;
        } else if (fileType === 'documents') {
          query += ` AND file_type NOT LIKE 'image/%'`;
        }
      }

      query += ` ORDER BY created_at DESC`;

      const stmt = this.db.prepare(query);
      const result = await stmt.bind(...params).all();

      return result.results?.map((file: any) => ({
        id: file.id,
        fileName: file.file_name,
        fileSize: file.file_size,
        fileType: file.file_type,
        r2Key: file.r2_key,
        bucket: file.r2_bucket,
        status: file.upload_status,
        createdAt: file.created_at,
        url: this.getPublicUrl(file.r2_key)
      })) || [];
    } catch (error) {
      console.error('Database file query error:', error);
      return [];
    }
  }

  // Upload file directly to R2
  async uploadFile(
    r2Key: string,
    fileData: ArrayBuffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    try {
      const object = await this.r2.put(r2Key, fileData, {
        httpMetadata: {
          contentType,
        },
        customMetadata: metadata
      });

      if (object) {
        return {
          success: true,
          url: this.getPublicUrl(r2Key)
        };
      } else {
        return {
          success: false,
          error: 'Failed to upload file to R2'
        };
      }
    } catch (error) {
      console.error('R2 upload error:', error);
      return {
        success: false,
        error: 'Upload failed'
      };
    }
  }

  // Get file from R2
  async getFile(r2Key: string): Promise<R2Object | null> {
    try {
      return await this.r2.get(r2Key);
    } catch (error) {
      console.error('R2 get error:', error);
      return null;
    }
  }

  // Delete file from R2
  async deleteFile(r2Key: string): Promise<boolean> {
    try {
      await this.r2.delete(r2Key);
      return true;
    } catch (error) {
      console.error('R2 delete error:', error);
      return false;
    }
  }

  // Generate public URL for file
  getPublicUrl(r2Key: string): string {
    // In production, this would be your R2 custom domain or public URL
    return `${this.baseUrl}/files/${r2Key}`;
  }

  // Upload profile image
  async uploadProfileImage(
    userId: string,
    imageData: ArrayBuffer,
    contentType: string,
    originalFileName: string
  ): Promise<UploadResult> {
    const fileExtension = this.getFileExtension(originalFileName);
    const r2Key = `profiles/${userId}/avatar_${Date.now()}${fileExtension}`;

    return this.uploadFile(r2Key, imageData, contentType, {
      userId,
      type: 'profile_image',
      originalFileName
    });
  }

  // Upload listing image
  async uploadListingImage(
    userId: string,
    listingId: string,
    imageData: ArrayBuffer,
    contentType: string,
    originalFileName: string,
    altText?: string
  ): Promise<UploadResult> {
    const fileExtension = this.getFileExtension(originalFileName);
    const r2Key = `listings/${listingId}/${Date.now()}_${Math.random().toString(36).substring(2)}${fileExtension}`;

    const result = await this.uploadFile(r2Key, imageData, contentType, {
      userId,
      listingId,
      type: 'listing_image',
      originalFileName,
      altText: altText || ''
    });

    return {
      ...result,
      fileId: r2Key // Use r2Key as fileId for listing images
    };
  }

  // Upload document
  async uploadDocument(
    userId: string,
    documentData: ArrayBuffer,
    contentType: string,
    originalFileName: string,
    documentType: 'certification' | 'license' | 'other' = 'other'
  ): Promise<UploadResult> {
    const sanitizedFileName = this.sanitizeFileName(originalFileName);
    const r2Key = `documents/${userId}/${documentType}/${Date.now()}_${sanitizedFileName}`;

    return this.uploadFile(r2Key, documentData, contentType, {
      userId,
      type: 'document',
      documentType,
      originalFileName
    });
  }

  // Resize image (basic implementation)
  async resizeImage(
    imageData: ArrayBuffer,
    _maxWidth: number,
    _maxHeight: number,
    _quality: number = 0.8
  ): Promise<ArrayBuffer> {
    // This is a placeholder for image resizing
    // In production, you might use a service like Cloudflare Images or implement WebAssembly-based image processing
    // For now, return the original image data
    return imageData;
  }

  // Generate thumbnail
  async generateThumbnail(
    imageData: ArrayBuffer,
    size: number = 200
  ): Promise<ArrayBuffer> {
    // Placeholder for thumbnail generation
    return this.resizeImage(imageData, size, size, 0.7);
  }

  // Validate file type
  private isAllowedFileType(contentType: string): boolean {
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      // Archives
      'application/zip',
      'application/x-zip-compressed'
    ];

    return allowedTypes.includes(contentType.toLowerCase());
  }

  // Get file extension from filename
  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.substring(lastDot) : '';
  }

  // Sanitize filename for safe storage
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  // Get file info from R2
  async getFileInfo(r2Key: string): Promise<{
    size: number;
    lastModified: Date;
    contentType: string;
    metadata: Record<string, string>;
  } | null> {
    try {
      const object = await this.r2.head(r2Key);
      if (!object) return null;

      return {
        size: object.size,
        lastModified: object.uploaded,
        contentType: object.httpMetadata?.contentType || 'application/octet-stream',
        metadata: object.customMetadata || {}
      };
    } catch (error) {
      console.error('R2 head error:', error);
      return null;
    }
  }

  // List files in a directory
  async listFiles(prefix: string, limit: number = 100): Promise<{
    files: Array<{
      key: string;
      size: number;
      lastModified: Date;
    }>;
    truncated: boolean;
  }> {
    try {
      const result = await this.r2.list({
        prefix,
        limit
      });

      return {
        files: result.objects.map(obj => ({
          key: obj.key,
          size: obj.size,
          lastModified: obj.uploaded
        })),
        truncated: result.truncated
      };
    } catch (error) {
      console.error('R2 list error:', error);
      return {
        files: [],
        truncated: false
      };
    }
  }

  // Clean up old files (for maintenance)
  async cleanupOldFiles(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    try {
      const result = await this.r2.list({
        prefix: 'temp/',
        limit: 1000
      });

      let deletedCount = 0;
      for (const object of result.objects) {
        if (object.uploaded < cutoffDate) {
          await this.r2.delete(object.key);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Cleanup error:', error);
      return 0;
    }
  }

  // Get storage usage for a user
  async getUserStorageUsage(userId: string): Promise<{
    totalSize: number;
    fileCount: number;
    breakdown: Record<string, { size: number; count: number }>;
  }> {
    try {
      const result = await this.r2.list({
        prefix: `uploads/${userId}/`,
        limit: 1000
      });

      let totalSize = 0;
      let fileCount = 0;
      const breakdown: Record<string, { size: number; count: number }> = {};

      for (const object of result.objects) {
        totalSize += object.size;
        fileCount++;

        // Categorize by file type based on path
        let category = 'other';
        if (object.key.includes('/profiles/')) category = 'profiles';
        else if (object.key.includes('/listings/')) category = 'listings';
        else if (object.key.includes('/documents/')) category = 'documents';

        if (!breakdown[category]) {
          breakdown[category] = { size: 0, count: 0 };
        }
        breakdown[category].size += object.size;
        breakdown[category].count++;
      }

      return {
        totalSize,
        fileCount,
        breakdown
      };
    } catch (error) {
      console.error('Storage usage error:', error);
      return {
        totalSize: 0,
        fileCount: 0,
        breakdown: {}
      };
    }
  }
}
