// Browser-side preparation and upload of contract photos / videos.
// Phone photos (4–10 MB) are shrunk to ~1600px JPEG before upload; videos are limited to
// 60 s and re-encoded to ≤720p at ~1.5 Mbps (≈11 MB per minute) when they are large.
// Files go straight to storage through a signed URL, never through our server.

export const MAX_VIDEO_SECONDS = 60;
const MAX_VIDEO_UPLOAD_BYTES = 30 * 1024 * 1024; // matches lib/storage MAX_CONTRACT_VIDEO_BYTES
const SMALL_VIDEO_BYTES = 8 * 1024 * 1024; // smaller videos are uploaded as they are
const VIDEO_BITRATE = 1_500_000;

export class MediaError extends Error {}

const baseName = (name: string) => (name.replace(/\.[^.]+$/, '') || 'file').slice(0, 60);

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new MediaError('خطا در پردازش تصویر'))), type, quality));
}

async function decodeImage(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
    } catch {
      URL.revokeObjectURL(url);
      throw new MediaError('این فرمت تصویر پشتیبانی نمی‌شود؛ لطفاً عکس JPG یا PNG انتخاب کنید.');
    }
  }
}

/** Resizes a photo to at most `maxDim` px on its long side and re-encodes it as JPEG. */
export async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<File> {
  const { source, width, height, close } = await decodeImage(file);
  try {
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new MediaError('خطا در پردازش تصویر');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    return new File([blob], `${baseName(file.name)}.jpg`, { type: 'image/jpeg' });
  } finally {
    close();
  }
}

function loadVideo(file: File): Promise<{ video: HTMLVideoElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.onloadedmetadata = () => {
      if (Number.isFinite(video.duration)) return resolve({ video, url });
      // Recorded WebM files often carry no duration: seeking far past the end makes the browser compute it
      const done = () => {
        clearTimeout(timer);
        video.ondurationchange = null;
        video.currentTime = 0;
        resolve({ video, url });
      };
      const timer = setTimeout(done, 4000);
      video.ondurationchange = () => Number.isFinite(video.duration) && done();
      video.currentTime = 1e101;
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new MediaError('این ویدیو در مرورگر قابل خواندن نیست.'));
    };
    video.src = url;
  });
}

const seek = (video: HTMLVideoElement, time: number) =>
  new Promise<void>(resolve => {
    video.onseeked = () => resolve();
    video.currentTime = time;
  });

function fitSize(w: number, h: number, maxLong: number, maxShort: number) {
  const scale = Math.min(1, maxLong / Math.max(w, h), maxShort / Math.min(w, h));
  // Encoders want even dimensions
  return { width: Math.round((w * scale) / 2) * 2, height: Math.round((h * scale) / 2) * 2 };
}

async function capturePoster(video: HTMLVideoElement, name: string): Promise<File | null> {
  try {
    await seek(video, Math.min(0.5, (video.duration || 1) / 2));
    const { width, height } = fitSize(video.videoWidth, video.videoHeight, 1280, 960);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')?.drawImage(video, 0, 0, width, height);
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.8);
    return new File([blob], `${baseName(name)}-poster.jpg`, { type: 'image/jpeg' });
  } catch {
    return null;
  }
}

function pickRecorderType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return candidates.find(t => MediaRecorder.isTypeSupported(t)) || null;
}

async function reencode(video: HTMLVideoElement, mimeType: string, onProgress: (p: number) => void): Promise<Blob> {
  const { width, height } = fitSize(video.videoWidth, video.videoHeight, 1280, 720);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx || typeof canvas.captureStream !== 'function') throw new MediaError('unsupported');

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: VIDEO_BITRATE });
  const chunks: Blob[] = [];
  recorder.ondataavailable = e => e.data.size && chunks.push(e.data);
  const stopped = new Promise<void>(resolve => (recorder.onstop = () => resolve()));

  // Frames are only drawn while the page is on screen: leaving it would produce a broken video
  if (document.hidden) throw new MediaError(INTERRUPTED);
  await seek(video, 0);
  let done = false;
  const draw = () => {
    if (done) return;
    ctx.drawImage(video, 0, 0, width, height);
    onProgress(Math.min(0.99, video.currentTime / (video.duration || 1)));
    const v = video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number };
    if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(draw);
    else requestAnimationFrame(draw);
  };

  let fail: (err: Error) => void = () => {};
  const failed = new Promise<never>((_, reject) => (fail = reject));
  failed.catch(() => {});
  const onVisibility = () => document.hidden && fail(new MediaError(INTERRUPTED));
  document.addEventListener('visibilitychange', onVisibility);
  // Playback that stops advancing (app switched, decoder stalled) ends the attempt instead of hanging
  let lastTime = -1;
  let lastMove = Date.now();
  const watchdog = setInterval(() => {
    if (video.currentTime !== lastTime) {
      lastTime = video.currentTime;
      lastMove = Date.now();
    } else if (Date.now() - lastMove > 6000) {
      fail(new MediaError(INTERRUPTED));
    }
  }, 1000);

  try {
    recorder.start(1000);
    const ended = new Promise<void>(resolve => (video.onended = () => resolve()));
    await Promise.race([video.play(), failed]);
    draw();
    await Promise.race([ended, failed]);
  } finally {
    done = true;
    clearInterval(watchdog);
    document.removeEventListener('visibilitychange', onVisibility);
    video.pause();
    if (recorder.state !== 'inactive') recorder.stop();
    await stopped;
    stream.getTracks().forEach(t => t.stop());
  }
  onProgress(1);
  return new Blob(chunks, { type: mimeType.split(';')[0] });
}

const INTERRUPTED = 'interrupted';

/**
 * Checks length, captures a still frame for the PDF and, for large files, re-encodes to 720p.
 * `onProgress` gets 0..1 while re-encoding (runs in real time, so the page must stay open).
 */
export async function prepareVideo(file: File, onProgress: (p: number) => void): Promise<{ video: File; poster: File | null }> {
  const ext = (file.name.match(/\.(mp4|webm|mov)$/i)?.[1] || '').toLowerCase();
  let loaded: { video: HTMLVideoElement; url: string };
  try {
    loaded = await loadVideo(file);
  } catch (err) {
    // e.g. an iPhone HEVC .mov on desktop Chrome: cannot be read here, but a small one can still be stored
    if (ext && file.size <= SMALL_VIDEO_BYTES) return { video: file, poster: null };
    throw err;
  }
  const { video, url } = loaded;
  try {
    if (Number.isFinite(video.duration) && video.duration > MAX_VIDEO_SECONDS + 0.5) {
      throw new MediaError(`ویدیو باید حداکثر ${MAX_VIDEO_SECONDS} ثانیه باشد (این ویدیو ${Math.round(video.duration)} ثانیه است).`);
    }
    const poster = await capturePoster(video, file.name);

    if (ext && file.size <= SMALL_VIDEO_BYTES) return { video: file, poster };

    const mimeType = pickRecorderType();
    let interrupted = false;
    if (mimeType) {
      try {
        const blob = await reencode(video, mimeType, onProgress);
        const outExt = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
        if (blob.size > 0 && (blob.size < file.size || !ext)) {
          if (blob.size > MAX_VIDEO_UPLOAD_BYTES) throw new MediaError('حجم ویدیو حتی پس از فشرده‌سازی زیاد است؛ ویدیوی کوتاه‌تری ضبط کنید.');
          return { video: new File([blob], `${baseName(file.name)}.${outExt}`, { type: blob.type }), poster };
        }
      } catch (err) {
        if (err instanceof MediaError && err.message !== 'unsupported' && err.message !== INTERRUPTED) throw err;
        interrupted = err instanceof MediaError && err.message === INTERRUPTED;
        // Re-encoding not possible (or cut short): fall back to the original if it is small enough
      }
    }

    if (ext && file.size <= MAX_VIDEO_UPLOAD_BYTES) return { video: file, poster };
    throw new MediaError(
      interrupted
        ? 'فشرده‌سازی ویدیو نیمه‌کاره ماند؛ تا پایان فشرده‌سازی صفحه را باز نگه دارید و دوباره تلاش کنید.'
        : 'حجم ویدیو زیاد است و این مرورگر امکان فشرده‌سازی ندارد؛ ویدیوی کوتاه‌تری ضبط کنید.'
    );
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}

/** Uploads one prepared file through a signed URL; returns its public URL. */
export async function uploadContractFile(file: File, video: boolean, onProgress?: (p: number) => void): Promise<string> {
  const signRes = await fetch('/api/cars/contracts/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, fileSize: file.size, video }),
  });
  const sign = await signRes.json().catch(() => ({}));
  if (!signRes.ok || !sign.signedUrl) throw new MediaError(sign.error || 'خطا در دریافت مجوز آپلود');

  // XHR instead of fetch: upload progress for large videos
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', sign.signedUrl);
    xhr.setRequestHeader('Content-Type', sign.contentType || file.type || 'application/octet-stream');
    xhr.upload.onprogress = e => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new MediaError('آپلود فایل ناموفق بود')));
    xhr.onerror = () => reject(new MediaError('ارتباط با سرور ذخیره‌سازی قطع شد'));
    xhr.send(file);
  });
  return sign.publicUrl as string;
}
