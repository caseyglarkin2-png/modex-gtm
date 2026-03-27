import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY?.trim();

// GET /api/voice/voices — list available voices
export async function GET() {
  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 503 });
  }

  const res = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': ELEVENLABS_API_KEY },
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err.slice(0, 200) }, { status: res.status });
  }

  const data = await res.json() as { voices: Array<{ voice_id: string; name: string; category: string; labels: Record<string, string> }> };
  const voices = data.voices.map((v) => ({
    voice_id: v.voice_id,
    name: v.name,
    category: v.category,
    accent: v.labels?.accent ?? '',
    use_case: v.labels?.use_case ?? '',
  }));

  return NextResponse.json({ voices });
}

// POST /api/voice/voices — instant voice clone from audio file
export async function POST(req: NextRequest) {
  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 503 });
  }

  const formData = await req.formData();
  const name = formData.get('name') as string;
  const file = formData.get('file') as File | null;

  if (!name || !file) {
    return NextResponse.json({ error: 'name and file are required' }, { status: 400 });
  }

  // Forward to ElevenLabs instant clone
  const cloneForm = new FormData();
  cloneForm.append('name', name);
  cloneForm.append('files', file, file.name);

  const res = await fetch('https://api.elevenlabs.io/v1/voices/add', {
    method: 'POST',
    headers: { 'xi-api-key': ELEVENLABS_API_KEY },
    body: cloneForm,
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Clone failed: ${err.slice(0, 200)}` }, { status: res.status });
  }

  const result = await res.json() as { voice_id: string };
  return NextResponse.json({ voice_id: result.voice_id, name });
}
