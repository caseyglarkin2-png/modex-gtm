'use client';

/**
 * DICTATE (account-first UX, UX-12, contract 5.8): a 44 px button with aria-pressed; Recording shows a timer, a
 * visible state and Cancel; Escape discards and says so; Stop sends the audio to /api/gap/voice/transcribe
 * (MediaRecorder + getUserMedia, never SpeechRecognition as the sole path); the transcript goes to the parent as
 * "I heard", editable, and nothing is written until the parent's Confirm. When transcription is off the button
 * says why and records nothing. Audio stays in memory for Retry on a failure and is dropped afterwards.
 */
import { useEffect, useRef, useState } from 'react';
import { DICTATE_MAX_SECONDS, DISABLED_MESSAGE } from '@/lib/gap/voice/transcribe';

type Phase = 'idle' | 'recording' | 'transcribing' | 'failed';

const BTN = 'inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-medium';
const PRIMARY = `${BTN} bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-60`;
const OUTLINE = `${BTN} border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-60`;

export interface DictateProps {
  /** Transcription is on for this deployment (the server says; off until the spend is approved). */
  enabled: boolean;
  onTranscript: (text: string) => void;
  maxSeconds?: number;
}

function pickMime(): string {
  const MR = (globalThis as unknown as { MediaRecorder?: { isTypeSupported?: (t: string) => boolean } }).MediaRecorder;
  for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) if (MR?.isTypeSupported?.(t)) return t;
  return '';
}

export function Dictate({ enabled, onTranscript, maxSeconds = DICTATE_MAX_SECONDS }: DictateProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const kept = useRef<Blob | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelled = useRef(false);

  function releaseStream() {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }
  useEffect(() => () => releaseStream(), []);

  async function send(blob: Blob) {
    setPhase('transcribing');
    setStatus('Transcribing.');
    const form = new FormData();
    form.append('audio', blob, 'dictation.webm');
    try {
      const res = await fetch('/api/gap/voice/transcribe', { method: 'POST', body: form });
      const body = (await res.json().catch(() => ({}))) as { text?: string; error?: string; detail?: string | null };
      if (!res.ok || !body.text) {
        kept.current = blob;
        setPhase('failed');
        setError(body.error === 'transcription_disabled' ? DISABLED_MESSAGE : `Could not transcribe (${body.error ?? res.status}). The recording is kept here: Retry, or type the note.`);
        setStatus('');
        return;
      }
      kept.current = null;
      setPhase('idle');
      setStatus('Transcribed. Read what GAP heard below and confirm before anything is recorded.');
      onTranscript(body.text);
    } catch (e) {
      kept.current = blob;
      setPhase('failed');
      setError(`${e instanceof Error ? e.message : 'network error'}. The recording is kept here: Retry, or type the note.`);
      setStatus('');
    }
  }

  async function start() {
    setError(null);
    if (!enabled) {
      setError(DISABLED_MESSAGE);
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('This browser cannot record audio here. Type the note, or use the keyboard microphone.');
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Microphone access was refused. Type the note, or allow the microphone and try again.');
      return;
    }
    const mime = pickMime();
    const rec = new MediaRecorder(stream.current, mime ? { mimeType: mime } : undefined);
    recorder.current = rec;
    chunks.current = [];
    cancelled.current = false;
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.current.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunks.current, { type: mime || 'audio/webm' });
      releaseStream();
      if (cancelled.current) {
        chunks.current = [];
        setPhase('idle');
        setStatus('Discarded. Nothing was recorded.');
        return;
      }
      void send(blob);
    };
    rec.start(1000);
    setSeconds(0);
    setPhase('recording');
    setStatus('Recording.');
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= maxSeconds) {
          stop();
          return s + 1;
        }
        return s + 1;
      });
    }, 1000);
  }
  function stop() {
    const rec = recorder.current;
    if (!rec || rec.state === 'inactive') return;
    rec.stop();
  }
  function cancel() {
    cancelled.current = true;
    const rec = recorder.current;
    if (rec && rec.state !== 'inactive') rec.stop();
    else {
      releaseStream();
      setPhase('idle');
      setStatus('Discarded. Nothing was recorded.');
    }
  }
  useEffect(() => {
    if (phase !== 'recording') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="dictate" data-phase={phase}>
      {phase === 'recording' ? (
        <>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400" data-testid="dictate-recording">
            <span aria-hidden="true" className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
            Recording <span className="tabular-nums" data-testid="dictate-timer">{mm}:{ss}</span> of {Math.floor(maxSeconds / 60)}:{String(maxSeconds % 60).padStart(2, '0')}
          </span>
          <button type="button" className={PRIMARY} onClick={stop} data-testid="dictate-stop">Stop</button>
          <button type="button" className={OUTLINE} onClick={cancel} data-testid="dictate-cancel">Cancel</button>
        </>
      ) : (
        <>
          <button type="button" className={OUTLINE} aria-pressed={false} disabled={phase === 'transcribing'} onClick={() => void start()} data-testid="dictate-start" title={enabled ? undefined : DISABLED_MESSAGE}>
            {phase === 'transcribing' ? 'Transcribing...' : 'Dictate'}
          </button>
          {phase === 'failed' && kept.current ? (
            <button type="button" className={OUTLINE} onClick={() => void send(kept.current!)} data-testid="dictate-retry">Retry</button>
          ) : null}
          {!enabled ? <span className="text-xs text-[var(--muted-foreground)]" data-testid="dictate-off">{DISABLED_MESSAGE}</span> : null}
        </>
      )}
      <span role="status" aria-live="polite" className="basis-full text-xs text-[var(--muted-foreground)]" data-testid="dictate-status">{status}</span>
      {error ? <p role="alert" className="basis-full text-xs text-red-700 dark:text-red-400" data-testid="dictate-error">{error}</p> : null}
    </div>
  );
}
