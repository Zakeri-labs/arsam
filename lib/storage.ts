import path from 'path';
import { randomUUID } from 'crypto';
import { supabase } from './supabase';

// Upload rules shared by every route that writes to the `uploads` bucket.
// Only document/image types on this list are accepted, and the stored content
// type is derived from the extension — never from what the client claims — so
// nobody can host HTML/SVG/script files on our storage.

export const UPLOAD_BUCKET = 'uploads';
export const MAX_DIRECT_UPLOAD_BYTES = 4.2 * 1024 * 1024; // Vercel function body limit
export const MAX_SIGNED_UPLOAD_BYTES = 50 * 1024 * 1024;

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
};

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif']);

export class UploadRejected extends Error {}

/** Validates a client file name and returns a random, safe storage path plus its content type. */
export function planUpload(originalName: string, prefix: string, imagesOnly = false) {
  const ext = path.extname(originalName || '').toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType || (imagesOnly && !IMAGE_EXTENSIONS.has(ext))) {
    throw new UploadRejected(
      imagesOnly ? 'فقط فایل تصویری (jpg, png, webp, gif) مجاز است.' : 'نوع فایل مجاز نیست. فقط تصویر، PDF و فایل‌های Word/Excel/متن پذیرفته می‌شود.'
    );
  }
  return { objectPath: `${prefix}_${randomUUID()}${ext}`, contentType };
}

export function publicUrlFor(objectPath: string): string {
  return supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(objectPath).data.publicUrl;
}

/** Uploads a File from a multipart request after validating its type and size. */
export async function uploadFile(file: File, prefix: string, imagesOnly = false) {
  if (file.size > MAX_DIRECT_UPLOAD_BYTES) {
    throw new UploadRejected(`حجم فایل (${(file.size / (1024 * 1024)).toFixed(1)}MB) بیش از سقف مجاز (۴ مگابایت) است.`);
  }
  const { objectPath, contentType } = planUpload(file.name, prefix, imagesOnly);
  const { error } = await supabase.storage
    .from(UPLOAD_BUCKET)
    .upload(objectPath, await file.arrayBuffer(), { contentType, upsert: false });
  if (error) throw error;
  return { name: file.name, size: file.size, url: publicUrlFor(objectPath) };
}

/** True only for public URLs of objects inside our own uploads bucket. */
export function isOwnUploadUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const base = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
  if (!base) return false;
  const prefix = `${base}/storage/v1/object/public/${UPLOAD_BUCKET}/`;
  return url.startsWith(prefix) && !url.slice(prefix.length).includes('..');
}
