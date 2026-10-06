/**
 * POST /api/gap/voice/transcribe   multipart `audio`   (UX-12 Dictate)
 *
 * Speech to text behind the transcription provider capability (lib/gap/voice/transcribe.ts). 503
 * `transcription_disabled` until Casey approves the spend (then the env flags turn it on; no code change). The audio
 * is transcribed and dropped, never stored. Session only; 400 without audio; 413 over the size cap.
 */
import { NextRequest, NextResponse } from 'next/server';
import { intakeGuard } from '@/lib/gap/intake/route-helpers';
import { transcribe, transcriptionProvider, TRANSCRIBE_MAX_BYTES } from '@/lib/gap/voice/transcribe';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const provider = transcriptionProvider();
  return NextResponse.json({ provider, enabled: provider !== 'disabled' });
}

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const provider = transcriptionProvider();
  if (provider === 'disabled') return NextResponse.json({ error: 'transcription_disabled' }, { status: 503 });
  const form = await request.formData().catch(() => null);
  const audio = form?.get('audio');
  if (!(audio instanceof Blob) || audio.size === 0) return NextResponse.json({ error: 'audio_required' }, { status: 400 });
  if (audio.size > TRANSCRIBE_MAX_BYTES) return NextResponse.json({ error: 'audio_too_large' }, { status: 413 });
  const r = await transcribe(audio, { provider });
  if (!r.ok) return NextResponse.json({ error: r.reason, detail: r.detail ?? null }, { status: r.reason === 'transcription_disabled' ? 503 : 502 });
  return NextResponse.json({ text: r.text, provider: r.provider });
}
