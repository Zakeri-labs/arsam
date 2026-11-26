import { NextResponse } from 'next/server';
import { blacklistHashes, ingest, MAX_BATCH, maybeSweepOrphanMedia, touchAgent, verifyAgent } from '@/lib/whatsapp';

// Endpoint for the office WhatsApp agent (windows-agent/). Bearer token only.

const denied = () => NextResponse.json({ error: 'invalid agent token' }, { status: 401 });

// GET - SHA-256 of each blacklisted number, so the agent skips them without the
// panel ever handing out the private family numbers themselves.
export async function GET(request: Request) {
  if (!(await verifyAgent(request))) return denied();
  try {
    return NextResponse.json({ blacklist_sha256: await blacklistHashes() });
  } catch {
    // strict read failed: tell the agent to skip this cycle rather than send everything
    return NextResponse.json({ error: 'blacklist unavailable' }, { status: 503 });
  }
}

// POST { messages: [...], agent: "version/host" } - store a batch (idempotent on message id)
export async function POST(request: Request) {
  if (!(await verifyAgent(request))) return denied();
  try {
    const body = await request.json().catch(() => null);
    const messages = Array.isArray(body?.messages) ? body.messages : null;
    if (!messages || messages.length > MAX_BATCH) {
      return NextResponse.json({ error: `messages must be an array of at most ${MAX_BATCH}` }, { status: 400 });
    }
    const result = await ingest(messages);
    await touchAgent(result.stored, typeof body.agent === 'string' ? body.agent : '');
    // Check-ins also clear files no message points to (e.g. the upload of a message the
    // blacklist refused), at most every 30 minutes.
    await maybeSweepOrphanMedia().catch(err => console.error('WhatsApp orphan sweep failed:', err));
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('WhatsApp ingest failed:', error);
    return NextResponse.json({ error: 'ingest failed' }, { status: 500 });
  }
}
