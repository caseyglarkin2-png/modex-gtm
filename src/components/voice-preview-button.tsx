'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2, Square } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  text: string;
  label?: string;
  className?: string;
}

export function VoicePreviewButton({ text, label = 'Listen', className }: Props) {
  const [loading, setLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  async function handlePlay() {
    if (playing && audio) {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
      return;
    }

    if (!text.trim()) {
      toast.error('Nothing to play — generate content first');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Voice preview failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const player = new Audio(url);
      player.onended = () => { setPlaying(false); URL.revokeObjectURL(url); };
      player.onerror = () => { setPlaying(false); toast.error('Audio playback error'); };
      setAudio(player);
      setPlaying(true);
      player.play();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Voice preview failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      disabled={loading}
      onClick={handlePlay}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : playing ? (
        <Square className="h-3.5 w-3.5" />
      ) : (
        <Volume2 className="h-3.5 w-3.5" />
      )}
      <span className="ml-1.5 text-xs">{playing ? 'Stop' : label}</span>
    </Button>
  );
}
