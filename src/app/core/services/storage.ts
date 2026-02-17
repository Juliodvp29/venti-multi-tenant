import { inject, Injectable, signal } from '@angular/core';
import { Supabase } from './supabase';
import { UploadProgress, UploadResult } from '@core/types';
import { environment } from '@env/environment';

export type StorageBucket = keyof typeof environment.storage.buckets;

@Injectable({
  providedIn: 'root',
})
export class StorageService {
   private readonly supabase = inject(Supabase);

  readonly uploadProgress = signal<UploadProgress>({
    status: 'idle',
    progress: 0,
  });

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
    folder: string
  ): Promise<UploadResult> {
    const validationError = this.validateImage(file);
    if (validationError) throw new Error(validationError);
    return this.uploadFile(bucket, file, folder);
  }

  async uploadMultiple(
    bucket: StorageBucket,
    files: File[],
    folder: string
  ): Promise<UploadResult[]> {
    const uploads = files.map((file) => this.uploadImage(bucket, file, folder));
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
