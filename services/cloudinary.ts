import { CloudinaryUploadResponse } from '@/types';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export class CloudinaryService {
  static async uploadImage(
    imageUri: string,
    folder: string = 'campushare-hub'
  ): Promise<CloudinaryUploadResponse> {
    try {
      // Read the image file
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const formData = new FormData();
      formData.append('file', `data:image/jpeg;base64,${base64}`);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET || '');
      formData.append('folder', folder);
      formData.append('resource_type', 'auto');

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return {
        public_id: response.data.public_id,
        url: response.data.url,
        secure_url: response.data.secure_url,
        width: response.data.width,
        height: response.data.height,
        format: response.data.format,
        created_at: response.data.created_at,
      };
    } catch (error) {
      console.error('[Cloudinary] Upload failed:', error);
      throw new Error('Failed to upload image to Cloudinary');
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
