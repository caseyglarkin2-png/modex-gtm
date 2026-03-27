'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Loader2, Square } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceScriptButtonProps {
  accountName: string;
  personaName?: string;
  className?: string;
}

export function VoiceScriptButton({ accountName, personaName, className }: VoiceScriptButtonProps) {
  const [loading, setLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  async function handleClick() {
    // If currently playing, stop it
    if (audio && playing) {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
      return;
    }

    // If we already generated audio, replay it
    if (audio && !playing) {
      audio.play();
      setPlaying(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountName, personaName, autoGenerate: true }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
        // ElevenLabs not configured yet — show helpful message
        if (res.status === 503) {
          toast.info('Voice not set up yet — add ELEVENLABS_API_KEY to activate');
          return;
        }
        throw new Error(err.error ?? 'Failed to generate voice');
      }

      const scriptText = res.headers.get('X-Script-Text');
      if (scriptText) {
        console.log('Script:', decodeURIComponent(scriptText));
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const player = new Audio(url);

      player.onended = () => {
        setPlaying(false);
        URL.revokeObjectURL(url);
      };

      player.play();
      setAudio(player);
      setPlaying(true);
      toast.success(`Playing call script for ${accountName}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Voice generation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={handleClick}
      disabled={loading}
      title={playing ? 'Stop playback' : 'Generate & play call script'}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : playing ? (
        <Square className="h-3.5 w-3.5 fill-current text-red-500" />
      ) : (
        <Phone className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
