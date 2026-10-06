/**
 * TRANSCRIPTION (account-first UX, UX-12, contract 5.8): server-side speech to text behind a provider capability.
 *
 * Spend boundary (Casey, 2026-10-06): transcription is NEW paid usage even on the provider already configured for
 * TTS (ElevenLabs). The path is complete and tested against a mock; production calls a paid provider only when BOTH
 * `GAP_TRANSCRIPTION_ENABLED=true` and `GAP_TRANSCRIPTION_PROVIDER=elevenlabs` are set with the key present, which
 * Casey sets after approving the spend. Until then the route answers `transcription_disabled` and the UI says so;
 * no audio ever leaves the browser. Audio is never stored here. OpenAI is not used (its credits are uncertain).
 */

export type TranscriptionProvider = 'elevenlabs' | 'mock' | 'disabled';

export interface TranscribeDeps {
  fetch?: typeof fetch;
  provider?: TranscriptionProvider;
  apiKey?: string | null;
}

export type TranscribeResult = { ok: true; text: string; provider: TranscriptionProvider } | { ok: false; reason: 'transcription_disabled' | 'empty_audio' | 'provider_error'; detail?: string };

export const TRANSCRIBE_MAX_BYTES = 10 * 1024 * 1024;
export const DICTATE_MAX_SECONDS = 120;
export const DISABLED_MESSAGE = 'Dictate is off until transcription spend is approved. Typing always works, and the keyboard microphone dictates into the note.';

/** Which provider this process may call: paid only when explicitly enabled; mock never in production; else disabled. */
export function transcriptionProvider(env: NodeJS.ProcessEnv = process.env): TranscriptionProvider {
  const enabled = (env.GAP_TRANSCRIPTION_ENABLED ?? '').trim().toLowerCase() === 'true';
  const provider = (env.GAP_TRANSCRIPTION_PROVIDER ?? '').trim().toLowerCase();
  if (enabled && provider === 'elevenlabs' && (env.ELEVENLABS_API_KEY ?? '').trim()) return 'elevenlabs';
  if (provider === 'mock' && env.NODE_ENV !== 'production') return 'mock';
  return 'disabled';
}

export async function transcribe(audio: Blob, deps: TranscribeDeps = {}): Promise<TranscribeResult> {
  const provider = deps.provider ?? transcriptionProvider();
  if (provider === 'disabled') return { ok: false, reason: 'transcription_disabled', detail: DISABLED_MESSAGE };
  if (!audio || audio.size === 0) return { ok: false, reason: 'empty_audio' };
  if (audio.size > TRANSCRIBE_MAX_BYTES) return { ok: false, reason: 'provider_error', detail: 'the recording is too large' };
  if (provider === 'mock') {
    // The mock never reads audio content: it returns a fixed line so the whole path can be exercised without spend.
    return { ok: true, text: 'Mock transcript: the buyer said trailers wait an hour at the gate on Mondays.', provider: 'mock' };
  }
  const apiKey = deps.apiKey ?? process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) return { ok: false, reason: 'transcription_disabled', detail: DISABLED_MESSAGE };
  const f = deps.fetch ?? fetch;
  const form = new FormData();
  form.append('model_id', 'scribe_v1');
  form.append('file', audio, 'dictation.webm');
  let res: Response;
  try {
    res = await f('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': apiKey }, body: form });
  } catch (e) {
    return { ok: false, reason: 'provider_error', detail: e instanceof Error ? e.message : 'network error' };
  }
  if (!res.ok) return { ok: false, reason: 'provider_error', detail: `ElevenLabs ${res.status}` };
  const body = (await res.json().catch(() => ({}))) as { text?: string };
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) return { ok: false, reason: 'provider_error', detail: 'empty transcript' };
  return { ok: true, text, provider: 'elevenlabs' };
}
