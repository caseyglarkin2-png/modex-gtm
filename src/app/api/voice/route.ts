import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { generateText } from '@/lib/ai/client';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY?.trim();
// Casey's voice ID — override with ELEVENLABS_VOICE_ID env var once you get it from ElevenLabs dashboard
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? 'JBFqnCBsd6RMkjVDRZzb'; // Default: George (professional male)
const ELEVENLABS_MODEL = process.env.ELEVENLABS_MODEL ?? 'eleven_turbo_v2_5';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { ok } = rateLimit(`voice:${ip}`);
  if (!ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 503 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { script, accountName, personaName, autoGenerate } = body as {
    script?: string;
    accountName?: string;
    personaName?: string;
    autoGenerate?: boolean;
  };

  let finalScript = script?.trim();

  // Auto-generate a call script using AI if not provided
  if (!finalScript && autoGenerate && accountName) {
    const prompt = `Write a short, natural 30-45 second phone call script for a cold outreach call.
Caller: Casey Larkin, GTM at FreightRoll — AI-powered freight visibility platform for supply chain teams.
Account: ${accountName}${personaName ? `\nContact: ${personaName}` : ''}

The script should:
- Sound natural when read aloud (no bullet points, no markdown)
- Open with context-setting without being scripted-sounding
- Reference a real pain point (e.g. freight cost visibility, DC throughput, supplier reliability)
- Include a clear ask: a 15-minute Zoom call
- End with a professional close

Return only the spoken words — no stage directions, no labels.`;

    try {
      finalScript = await generateText(prompt, 300);
      // Strip any markdown the AI might add
      finalScript = finalScript.replace(/[#*_`]/g, '').replace(/\n{3,}/g, '\n\n').trim();
    } catch (err) {
      return NextResponse.json({ error: 'Failed to generate script: ' + (err instanceof Error ? err.message : String(err)) }, { status: 500 });
    }
  }

  if (!finalScript) {
    return NextResponse.json({ error: 'Provide script text or set autoGenerate=true with accountName' }, { status: 400 });
  }

  // Call ElevenLabs TTS
  const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: finalScript,
      model_id: ELEVENLABS_MODEL,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  });

  if (!ttsRes.ok) {
    const errText = await ttsRes.text();
    return NextResponse.json({ error: `ElevenLabs error (${ttsRes.status}): ${errText.slice(0, 200)}` }, { status: 502 });
  }

  const audioBuffer = await ttsRes.arrayBuffer();

  return new NextResponse(audioBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(audioBuffer.byteLength),
      'X-Script-Text': encodeURIComponent(finalScript.slice(0, 500)),
    },
  });
}
