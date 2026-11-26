import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MEDIA_BUCKET, uploadPathFor, verifyAgent } from '@/lib/whatsapp';

const MAX_BYTES = 50 * 1024 * 1024;

// POST { fileName, size } - signed upload URL in the private whatsapp-media bucket
export async function POST(request: Request) {
  if (!(await verifyAgent(request))) return NextResponse.json({ error: 'invalid agent token' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const size = Number(body?.size || 0);
  if (!(size > 0) || size > MAX_BYTES) return NextResponse.json({ error: 'file too large or empty' }, { status: 400 });
  const path = uploadPathFor(String(body?.fileName || 'file'));
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error('WhatsApp media signed URL failed:', error);
    return NextResponse.json({ error: 'could not sign upload' }, { status: 500 });
  }
  return NextResponse.json({ path, signedUrl: data.signedUrl });
}
