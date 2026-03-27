import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY?.trim();

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { ok } = rateLimit(`sfx:${ip}`);
  if (!ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 503 });
  }

  const { text, duration } = await req.json() as { text?: string; duration?: number };
  if (!text || typeof text !== 'string' || text.length < 3) {
    return NextResponse.json({ error: 'text is required (min 3 chars)' }, { status: 400 });
  }

  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: text.slice(0, 500),
      duration_seconds: Math.min(Math.max(duration ?? 5, 1), 22),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `ElevenLabs error: ${err.slice(0, 200)}` }, { status: res.status });
  }

  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(buffer.byteLength),
    },
  });
}
