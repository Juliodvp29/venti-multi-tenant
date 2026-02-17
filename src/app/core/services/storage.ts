import { inject, Injectable, signal } from '@angular/core';
import { Supabase } from './supabase';
import { UploadProgress, UploadResult } from '@core/types';
import { environment } from '@env/environment';

export type StorageBucket = keyof typeof environment.storage.buckets;

export interface ImageOptimizationOptions {
  convertToWebP?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly supabase = inject(Supabase);

  readonly uploadProgress = signal<UploadProgress>({
    status: 'idle',
    progress: 0,
  });

  // Default optimization settings
  private readonly defaultOptimization: ImageOptimizationOptions = {
    convertToWebP: true,
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 0.85,
    generateThumbnail: false,
    thumbnailSize: 300,
  };

  // ── Bucket helpers ───────────────────────────────────────

  private getBucket(bucket: StorageBucket): string {
    return environment.storage.buckets[bucket];
  }

  private getPublicUrl(bucket: StorageBucket, path: string): string {
    const { data } = this.supabase.storage.from(this.getBucket(bucket)).getPublicUrl(path);
    return data.publicUrl;
  }

  // ── File validation ──────────────────────────────────────

  validateImage(file: File): string | null {
    const { allowedImageTypes, maxFileSizeMb } = environment.storage;
    if (!allowedImageTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Use: ${allowedImageTypes.join(', ')}`;
    }
    if (file.size > maxFileSizeMb * 1024 * 1024) {
      return `El archivo supera el límite de ${maxFileSizeMb}MB`;
    }
    return null;
  }

  // ── Image Optimization ───────────────────────────────────

  /**
   * Convert image to WebP format
   */
  private async convertToWebP(file: File, quality = 0.85): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('WebP conversion failed'));
            }
          },
          'image/webp',
          quality
        );

        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Resize image if it exceeds max dimensions
   */
  private async resizeImage(
    file: File | Blob,
    maxWidth: number,
    maxHeight: number,
    quality = 0.85
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      img.onload = () => {
        let { width, height } = img;

        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Image resize failed'));
            }
          },
          'image/webp',
          quality
        );

        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate thumbnail from image
   */
  private async generateThumbnail(
    file: File | Blob,
    size: number,
    quality = 0.8
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      img.onload = () => {
        const { width, height } = img;
        const ratio = Math.min(size / width, size / height);
        const newWidth = Math.round(width * ratio);
        const newHeight = Math.round(height * ratio);

        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Thumbnail generation failed'));
            }
          },
          'image/webp',
          quality
        );

        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Optimize image with all configured options
   */
  private async optimizeImage(
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<{ optimized: Blob; thumbnail?: Blob }> {
    const opts = { ...this.defaultOptimization, ...options };
    let processedImage: Blob = file;

    // Step 1: Convert to WebP if enabled
    if (opts.convertToWebP && file.type !== 'image/webp') {
      processedImage = await this.convertToWebP(file, opts.quality);
    }

    // Step 2: Resize if needed
    if (opts.maxWidth && opts.maxHeight) {
      processedImage = await this.resizeImage(
        processedImage,
        opts.maxWidth,
        opts.maxHeight,
        opts.quality
      );
    }

    // Step 3: Generate thumbnail if needed
    let thumbnail: Blob | undefined;
    if (opts.generateThumbnail && opts.thumbnailSize) {
      thumbnail = await this.generateThumbnail(
        processedImage,
        opts.thumbnailSize,
        0.8
      );
    }

    return { optimized: processedImage, thumbnail };
  }

  // ── Upload ───────────────────────────────────────────────

  async uploadFile(
    bucket: StorageBucket,
    file: File,
    path: string,
    options?: { upsert?: boolean; contentType?: string }
  ): Promise<UploadResult> {
    this.uploadProgress.set({ status: 'uploading', progress: 0 });

    const filePath = `${path}/${crypto.randomUUID()}-${file.name}`;

    const { data, error } = await this.supabase.storage
      .from(this.getBucket(bucket))
      .upload(filePath, file, {
        upsert: options?.upsert ?? false,
        contentType: options?.contentType ?? file.type,
      });

    if (error) {
      this.uploadProgress.set({ status: 'error', progress: 0, error: error.message });
      throw error;
    }

    const publicUrl = this.getPublicUrl(bucket, data.path);
    this.uploadProgress.set({ status: 'success', progress: 100, url: publicUrl });

    return {
      url: publicUrl,
      path: data.path,
      fullPath: data.fullPath,
    };
  }

  async uploadImage(
    bucket: StorageBucket,
    file: File,
    folder: string,
    optimizationOptions?: ImageOptimizationOptions
  ): Promise<UploadResult & { thumbnailUrl?: string }> {
    const validationError = this.validateImage(file);
    if (validationError) throw new Error(validationError);

    this.uploadProgress.set({ status: 'uploading', progress: 10 });

    // Optimize image
    const { optimized, thumbnail } = await this.optimizeImage(file, optimizationOptions);

    this.uploadProgress.set({ status: 'uploading', progress: 50 });

    // Create File from Blob with WebP extension
    const fileName = file.name.replace(/\.[^/.]+$/, '.webp');
    const optimizedFile = new File([optimized], fileName, { type: 'image/webp' });

    // Upload main image
    const result = await this.uploadFile(bucket, optimizedFile, folder, {
      contentType: 'image/webp',
    });

    // Upload thumbnail if generated
    let thumbnailUrl: string | undefined;
    if (thumbnail) {
      const thumbFileName = `thumb_${fileName}`;
      const thumbFile = new File([thumbnail], thumbFileName, { type: 'image/webp' });
      const thumbPath = `${folder}/thumbnails`;
      const thumbResult = await this.uploadFile(bucket, thumbFile, thumbPath, {
        contentType: 'image/webp',
      });
      thumbnailUrl = thumbResult.url;
    }

    return { ...result, thumbnailUrl };
  }

  async uploadMultiple(
    bucket: StorageBucket,
    files: File[],
    folder: string,
    optimizationOptions?: ImageOptimizationOptions
  ): Promise<(UploadResult & { thumbnailUrl?: string })[]> {
    const uploads = files.map((file) =>
      this.uploadImage(bucket, file, folder, optimizationOptions)
    );
    return Promise.all(uploads);
  }

  // ── Delete ───────────────────────────────────────────────

  async deleteFile(bucket: StorageBucket, path: string): Promise<void> {
    const { error } = await this.supabase.storage.from(this.getBucket(bucket)).remove([path]);
    if (error) throw error;
  }

  async deleteFiles(bucket: StorageBucket, paths: string[]): Promise<void> {
    const { error } = await this.supabase.storage.from(this.getBucket(bucket)).remove(paths);
    if (error) throw error;
  }

  // ── List ─────────────────────────────────────────────────

  async listFiles(bucket: StorageBucket, folder: string) {
    const { data, error } = await this.supabase.storage
      .from(this.getBucket(bucket))
      .list(folder, { limit: 100, offset: 0 });
    if (error) throw error;
    return data ?? [];
  }

  // ── URL helpers ──────────────────────────────────────────

  getImageUrl(bucket: StorageBucket, path: string): string {
    return this.getPublicUrl(bucket, path);
  }

  extractPathFromUrl(url: string): string {
    // Extract the storage path from a full Supabase public URL
    const bucketBase = `${environment.supabase.url}/storage/v1/object/public/`;
    return url.replace(bucketBase, '').split('/').slice(1).join('/');
  }

  resetProgress(): void {
    this.uploadProgress.set({ status: 'idle', progress: 0 });
  }
}
