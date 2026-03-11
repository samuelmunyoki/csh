import { CloudinaryUploadResponse } from '@/types';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export class CloudinaryService {
  static async uploadImage(
    imageUri: string,
    folder: string = 'campushare-hub',
    onProgress?: (progress: number) => void
  ): Promise<CloudinaryUploadResponse> {
    try {
      // Validate image URI
      if (!this.validateImageUri(imageUri)) {
        throw new Error('Invalid image format. Please use JPG, PNG, GIF, or WebP.');
      }

      // Check file size (5MB limit)
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (fileInfo.size && fileInfo.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB.');
      }

      onProgress?.(10);

      // Read the image file
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      onProgress?.(30);

      const formData = new FormData();
      formData.append('file', `data:image/jpeg;base64,${base64}`);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET || '');
      formData.append('folder', folder);
      formData.append('resource_type', 'auto');
      formData.append('tags', folder);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded / progressEvent.total) * 60 + 30
              );
              onProgress?.(percentCompleted);
            }
          },
        }
      );

      onProgress?.(100);

      if (!response.data.public_id) {
        throw new Error('No public ID returned from Cloudinary');
      }

      return {
        public_id: response.data.public_id,
        url: response.data.url,
        secure_url: response.data.secure_url,
        width: response.data.width,
        height: response.data.height,
        format: response.data.format,
        created_at: response.data.created_at,
      };
    } catch (error: any) {
      console.error('[Cloudinary] Upload failed:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cloudinary credentials are invalid. Please check your configuration.');
      }
      
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.error?.message || 'Invalid image data');
      }
      
      if (error.message.includes('timeout')) {
        throw new Error('Image upload timed out. Please check your connection.');
      }

      throw error;
    }
  }

  static getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: 'auto' | 'low' | 'normal' | 'good' | 'best';
      fetch_format?: 'auto' | 'webp' | 'jpg' | 'png';
    } = {}
  ): string {
    const { width = 500, height = 500, quality = 'auto', fetch_format = 'auto' } = options;

    const params = [
      `w_${width}`,
      `h_${height}`,
      'c_fill',
      `q_${quality}`,
      `f_${fetch_format}`,
    ].join(',');

    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${params}/${publicId}`;
  }

  static async deleteImage(publicId: string): Promise<void> {
    try {
      // Note: Direct deletion from client-side requires authenticated requests
      // Better approach: Use Firebase Cloud Function or backend endpoint
      console.warn('[Cloudinary] Image deletion should be handled server-side');
    } catch (error) {
      console.error('[Cloudinary] Deletion failed:', error);
    }
  }

  static validateImageUri(uri: string): boolean {
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const extension = uri.split('.').pop()?.toLowerCase();
    return extension ? validExtensions.includes(extension) : false;
  }

  static getImageThumbUrl(publicId: string): string {
    return this.getOptimizedUrl(publicId, {
      width: 200,
      height: 200,
      quality: 'good',
    });
  }

  static getImageDisplayUrl(publicId: string): string {
    return this.getOptimizedUrl(publicId, {
      width: 800,
      height: 600,
      quality: 'good',
      fetch_format: 'auto',
    });
  }
}
