import path from 'path';
import { createHash, randomUUID } from 'crypto';
import { supabase } from './supabase';
import type { ContractAttachment } from './db-cars';

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

// --- Contract media (handover wizard): photos and short videos, uploaded straight to storage ---
// These include passports, licences and car photos, so they live in a PRIVATE bucket: nothing is
// reachable by URL until the server signs a short-lived link for someone allowed to see it.

export const CONTRACT_MEDIA_BUCKET = 'contract-media';
export const MEDIA_URL_TTL_SECONDS = 60 * 60;
const CONTRACT_MEDIA_PATH = /^contracts\/[A-Za-z0-9_.-]+$/;

export const isContractMediaPath = (p: unknown): p is string => typeof p === 'string' && CONTRACT_MEDIA_PATH.test(p) && !p.includes('..');

/** Signed read URLs for many objects at once (one storage call per 100 paths). Missing objects are skipped. */
export async function signContractMedia(paths: string[], expiresIn = MEDIA_URL_TTL_SECONDS): Promise<Map<string, string>> {
  const unique = Array.from(new Set(paths.filter(isContractMediaPath)));
  const out = new Map<string, string>();
  for (let i = 0; i < unique.length; i += 100) {
    const { data, error } = await supabase.storage.from(CONTRACT_MEDIA_BUCKET).createSignedUrls(unique.slice(i, i + 100), expiresIn);
    if (error) throw error;
    for (const row of data || []) if (row.path && row.signedUrl) out.set(row.path, row.signedUrl);
  }
  return out;
}

/**
 * Adds short-lived signed URLs to stored attachments before they leave the server.
 * With a share token, videos also get the token-checked link that is printed in the PDF.
 */
export async function presentContractAttachments<T extends { id: string; attachments?: ContractAttachment[] }>(
  contracts: T[],
  shareTokens?: Map<string, string | null>
): Promise<T[]> {
  const paths: string[] = [];
  for (const c of contracts) for (const a of c.attachments || []) paths.push(a.path || '', a.posterPath || '');
  const signed = await signContractMedia(paths);
  return contracts.map(c => ({
    ...c,
    attachments: (c.attachments || []).map(a => {
      const token = shareTokens?.get(c.id);
      return {
        ...a,
        url: (a.path && signed.get(a.path)) || (a.path ? undefined : a.url),
        posterUrl: (a.posterPath && signed.get(a.posterPath)) || (a.posterPath ? undefined : a.posterUrl),
        linkUrl: a.kind === 'car_video' && a.path && token ? `/api/contract-share/${token}/media?f=${encodeURIComponent(a.path)}` : undefined,
      };
    }),
  }));
}

export const MAX_CONTRACT_IMAGE_BYTES = 10 * 1024 * 1024;
// Videos are compressed in the browser first (720p, ~1.5 Mbps, max 60 s ≈ 11 MB); this is the hard cap
export const MAX_CONTRACT_VIDEO_BYTES = 30 * 1024 * 1024;

const CONTRACT_IMAGE_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};
const CONTRACT_VIDEO_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

/** Validates a contract photo/video and returns a random storage path under contracts/. */
export function planContractMedia(originalName: string, fileSize: number, video: boolean) {
  const ext = path.extname(originalName || '').toLowerCase();
  const contentType = (video ? CONTRACT_VIDEO_TYPES : CONTRACT_IMAGE_TYPES)[ext];
  if (!contentType) {
    throw new UploadRejected(video ? 'فقط ویدیوی mp4، webm یا mov مجاز است.' : 'فقط تصویر jpg، png یا webp مجاز است.');
  }
  const max = video ? MAX_CONTRACT_VIDEO_BYTES : MAX_CONTRACT_IMAGE_BYTES;
  if (!(fileSize > 0) || fileSize > max) {
    throw new UploadRejected(`حجم فایل (${(fileSize / (1024 * 1024)).toFixed(1)}MB) بیش از سقف مجاز (${max / (1024 * 1024)} مگابایت) است.`);
  }
  return { objectPath: `contracts/${video ? 'video' : 'photo'}_${randomUUID()}${ext}`, contentType };
}

// --- Company signature: one PNG under settings/, random name so its URL cannot be guessed ---

const SIGNATURE_FOLDER = 'settings';
const SIGNATURE_PREFIX = 'company-signature_';
export const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024;

async function listSignatureObjects() {
  const { data, error } = await supabase.storage
    .from(UPLOAD_BUCKET)
    .list(SIGNATURE_FOLDER, { search: SIGNATURE_PREFIX, sortBy: { column: 'created_at', order: 'desc' } });
  if (error) throw error;
  return (data || []).filter(o => o.name.startsWith(SIGNATURE_PREFIX));
}

export async function getCompanySignatureUrl(): Promise<string | null> {
  const [latest] = await listSignatureObjects();
  return latest ? publicUrlFor(`${SIGNATURE_FOLDER}/${latest.name}`) : null;
}

/** Stores a new signature PNG and removes the previous ones. */
export async function saveCompanySignature(file: File): Promise<string> {
  if (file.size > MAX_SIGNATURE_BYTES) throw new UploadRejected('حجم فایل امضا حداکثر ۲ مگابایت است.');
  if (path.extname(file.name || '').toLowerCase() !== '.png') throw new UploadRejected('فایل امضا باید PNG باشد.');
  const previous = await listSignatureObjects();
  const objectPath = `${SIGNATURE_FOLDER}/${SIGNATURE_PREFIX}${randomUUID()}.png`;
  const { error } = await supabase.storage
    .from(UPLOAD_BUCKET)
    .upload(objectPath, await file.arrayBuffer(), { contentType: 'image/png', upsert: false });
  if (error) throw error;
  if (previous.length) {
    await supabase.storage.from(UPLOAD_BUCKET).remove(previous.map(o => `${SIGNATURE_FOLDER}/${o.name}`));
  }
  return publicUrlFor(objectPath);
}

export async function deleteCompanySignature(): Promise<void> {
  const previous = await listSignatureObjects();
  if (!previous.length) return;
  const { error } = await supabase.storage.from(UPLOAD_BUCKET).remove(previous.map(o => `${SIGNATURE_FOLDER}/${o.name}`));
  if (error) throw error;
}

// --- Renter signature: drawn on the customer's phone, kept in the private bucket ---
// One fixed path per contract (derived from its id), so no database column is needed.
// It can be written once only: a signed contract cannot be re-signed through the public link.

export const MAX_RENTER_SIGNATURE_BYTES = 1024 * 1024;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

export const renterSignaturePath = (contractId: string) =>
  `contracts/renter-signature_${createHash('sha256').update(contractId).digest('hex').slice(0, 32)}.png`;

export async function getRenterSignatureUrl(contractId: string): Promise<string | null> {
  const objectPath = renterSignaturePath(contractId);
  const signed = await signContractMedia([objectPath]);
  return signed.get(objectPath) || null;
}

/** Saves the renter's signature PNG. Returns false when the contract was already signed. */
export async function saveRenterSignature(contractId: string, bytes: ArrayBuffer): Promise<boolean> {
  const view = new Uint8Array(bytes);
  if (!view.length || view.length > MAX_RENTER_SIGNATURE_BYTES || PNG_MAGIC.some((b, i) => view[i] !== b)) {
    throw new UploadRejected('امضا معتبر نیست.');
  }
  const { error } = await supabase.storage
    .from(CONTRACT_MEDIA_BUCKET)
    .upload(renterSignaturePath(contractId), bytes, { contentType: 'image/png', upsert: false });
  if (error) {
    if ((error as any).statusCode === '409' || /already exists|duplicate/i.test(error.message)) return false;
    throw error;
  }
  return true;
}
