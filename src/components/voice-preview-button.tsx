'use client';

/**
 * Listen (TTS through /api/voice/preview). UX-04 cleanup (account-first UX): ONE player at a time (pressing Listen
 * on another text stops the first), pause and resume instead of a stop that rewinds, the audio stops and its object
 * URL is released when the button unmounts (a route change never leaves audio playing with no control left, WCAG
 * 1.4.2), and the loading state is announced. Voice: no em dashes.
 */
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  text: string;
  label?: string;
  className?: string;
}

/** The one player on the page: starting another stops this one. */
let current: { audio: HTMLAudioElement; url: string; stop: () => void } | null = null;

function release(p: { audio: HTMLAudioElement; url: string } | null) {
  if (!p) return;
  p.audio.pause();
  p.audio.src = '';
  URL.revokeObjectURL(p.url);
}

export function VoicePreviewButton({ text, label = 'Listen', className }: Props) {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const mine = useRef<{ audio: HTMLAudioElement; url: string } | null>(null);

  // Unmount: stop and release this button's audio; never leave playback with no control.
  useEffect(() => {
    return () => {
      if (mine.current) {
        if (current && current.audio === mine.current.audio) current = null;
        release(mine.current);
        mine.current = null;
      }
    };
  }, []);

  async function handleClick() {
    if (mine.current && state === 'playing') {
      mine.current.audio.pause();
      setState('paused');
      return;
    }
    if (mine.current && state === 'paused') {
      if (current && current.audio !== mine.current.audio) current.stop();
      current = { ...mine.current, stop: () => { release(mine.current); mine.current = null; setState('idle'); } };
      await mine.current.audio.play().catch(() => toast.error('Audio playback error'));
      setState('playing');
      return;
    }
    if (!text.trim()) {
      toast.error('Nothing to play yet.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/voice/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || 'Voice preview failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      // One player: stop whatever else is playing before this starts.
      if (current) current.stop();
      const me = { audio, url };
      mine.current = me;
      current = { ...me, stop: () => { release(me); if (mine.current === me) { mine.current = null; setState('idle'); } } };
      audio.onended = () => {
        setState('idle');
        if (current && current.audio === audio) current = null;
        release(me);
        if (mine.current === me) mine.current = null;
      };
      audio.onerror = () => {
        setState('idle');
        toast.error('Audio playback error');
      };
      await audio.play();
      setState('playing');
    } catch (err) {
      setState('idle');
      toast.error(err instanceof Error ? err.message : 'Voice preview failed');
    } finally {
      setLoading(false);
    }
  }

  const name = loading ? `Loading: ${label}` : state === 'playing' ? `Pause: ${label}` : state === 'paused' ? `Resume: ${label}` : label;
  return (
    <>
      <Button type="button" variant="outline" size="sm" className={className} disabled={loading} onClick={() => void handleClick()} aria-pressed={state === 'playing'} aria-busy={loading} aria-label={name}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : state === 'playing' ? <Pause className="h-3.5 w-3.5" /> : state === 'paused' ? <Play className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        <span className="ml-1.5 text-xs">{loading ? 'Loading' : state === 'playing' ? 'Pause' : state === 'paused' ? 'Resume' : label}</span>
      </Button>
      <span role="status" aria-live="polite" className="sr-only">{loading ? 'Loading the audio.' : state === 'playing' ? 'Playing.' : state === 'paused' ? 'Paused.' : ''}</span>
    </>
  );
}
