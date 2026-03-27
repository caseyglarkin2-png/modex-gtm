'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Volume2, Mic, Sparkles, Play, Square, Download,
  Loader2, Upload, RefreshCw, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'tts' | 'sfx' | 'clone';

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  accent: string;
  use_case: string;
}

export function StudioClient() {
  const [tab, setTab] = useState<Tab>('tts');

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg bg-[var(--muted)] p-1 w-fit">
        {([
          { id: 'tts' as Tab, label: 'Text-to-Speech', icon: Volume2 },
          { id: 'sfx' as Tab, label: 'Sound Effects', icon: Sparkles },
          { id: 'clone' as Tab, label: 'Voice Clone', icon: Mic },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === id
                ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === 'tts' && <TTSPanel />}
      {tab === 'sfx' && <SFXPanel />}
      {tab === 'clone' && <ClonePanel />}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TEXT-TO-SPEECH PANEL
   ═══════════════════════════════════════════ */
function TTSPanel() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [loading, setLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');

  useEffect(() => {
    fetch('/api/voice/voices')
      .then((r) => r.json())
      .then((d: { voices?: Voice[] }) => {
        if (d.voices) {
          setVoices(d.voices);
          // Default to env voice or Chris
          const defaultId = d.voices.find((v) => v.name.includes('Chris'))?.voice_id ?? d.voices[0]?.voice_id ?? '';
          setSelectedVoice(defaultId);
        }
      })
      .catch(() => toast.error('Failed to load voices'));
  }, []);

  async function generate() {
    if (!text.trim()) { toast.error('Enter text'); return; }
    setLoading(true);
    if (audio) { audio.pause(); setPlaying(false); }
    if (audioUrl) URL.revokeObjectURL(audioUrl);

    try {
      const res = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: selectedVoice || undefined }),
      });
      if (!res.ok) throw new Error((await res.json() as { error?: string }).error ?? 'Generation failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      const player = new Audio(url);
      player.onended = () => setPlaying(false);
      setAudio(player);
      player.play();
      setPlaying(true);
      toast.success('Generated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'TTS failed');
    } finally {
      setLoading(false);
    }
  }

  function togglePlay() {
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-blue-500" /> Text-to-Speech
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            className="w-full min-h-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Paste your email, call script, or any text you want to hear out loud..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={5000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted-foreground)]">{text.length}/5000 chars</span>
            <div className="flex gap-2">
              {audioUrl && (
                <>
                  <Button variant="outline" size="sm" onClick={togglePlay}>
                    {playing ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    <span className="ml-1">{playing ? 'Stop' : 'Replay'}</span>
                  </Button>
                  <a href={audioUrl} download="elevenlabs-tts.mp3">
                    <Button variant="outline" size="sm">
                      <Download className="h-3.5 w-3.5" /> <span className="ml-1">Download</span>
                    </Button>
                  </a>
                </>
              )}
              <Button onClick={generate} disabled={loading || !text.trim()}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Volume2 className="h-3.5 w-3.5 mr-1" />}
                Generate Speech
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice picker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Voice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {voices.map((v) => (
              <button
                key={v.voice_id}
                onClick={() => setSelectedVoice(v.voice_id)}
                className={cn(
                  'w-full text-left rounded-md px-3 py-2 text-sm transition-colors',
                  selectedVoice === v.voice_id
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'hover:bg-[var(--muted)]'
                )}
              >
                <div className="font-medium text-xs">{v.name}</div>
                <div className={cn('text-[10px]', selectedVoice === v.voice_id ? 'text-[var(--primary-foreground)]/70' : 'text-[var(--muted-foreground)]')}>
                  {v.accent} · {v.use_case}
                </div>
              </button>
            ))}
            {voices.length === 0 && (
              <p className="text-xs text-[var(--muted-foreground)] py-4 text-center">Loading voices...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SOUND EFFECTS PANEL
   ═══════════════════════════════════════════ */

const SFX_PRESETS = [
  'warehouse forklift beeping reverse alarm',
  'freight truck air brakes hissing',
  'conveyor belt running industrial',
  'loading dock roller door opening metal',
  'radio walkie talkie click static chatter',
  'pallet jack wheels on concrete floor',
  'applause professional conference audience',
  'notification chime success digital',
  'phone ringing office professional',
  'typing keyboard fast mechanical',
];

function SFXPanel() {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [loading, setLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [history, setHistory] = useState<Array<{ prompt: string; url: string }>>([]);

  async function generate(text?: string) {
    const t = text ?? prompt;
    if (!t.trim()) { toast.error('Describe a sound'); return; }
    setLoading(true);
    if (audio) { audio.pause(); setPlaying(false); }

    try {
      const res = await fetch('/api/voice/sound-effects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t, duration }),
      });
      if (!res.ok) throw new Error((await res.json() as { error?: string }).error ?? 'SFX generation failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(url);

      const player = new Audio(url);
      player.onended = () => setPlaying(false);
      setAudio(player);
      player.play();
      setPlaying(true);

      setHistory((prev) => [{ prompt: t, url }, ...prev.slice(0, 9)]);
      toast.success('Sound effect generated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'SFX failed');
    } finally {
      setLoading(false);
    }
  }

  function togglePlay() {
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" /> Sound Effects Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Describe the sound you want... e.g. 'warehouse forklift beeping in reverse'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={500}
          />
          <div className="flex items-center gap-3">
            <label className="text-xs text-[var(--muted-foreground)]">Duration:</label>
            <input
              type="range" min={1} max={22} value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs font-mono w-8">{duration}s</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted-foreground)]">{prompt.length}/500</span>
            <div className="flex gap-2">
              {audioUrl && (
                <>
                  <Button variant="outline" size="sm" onClick={togglePlay}>
                    {playing ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    <span className="ml-1">{playing ? 'Stop' : 'Replay'}</span>
                  </Button>
                  <a href={audioUrl} download="elevenlabs-sfx.mp3">
                    <Button variant="outline" size="sm">
                      <Download className="h-3.5 w-3.5" /> <span className="ml-1">Download</span>
                    </Button>
                  </a>
                </>
              )}
              <Button onClick={() => generate()} disabled={loading || !prompt.trim()}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                Generate Sound
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Presets + History */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quick Presets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {SFX_PRESETS.map((p) => (
                <Badge
                  key={p}
                  variant="outline"
                  className="cursor-pointer hover:bg-[var(--muted)] text-[10px]"
                  onClick={() => { setPrompt(p); generate(p); }}
                >
                  {p.split(' ').slice(0, 3).join(' ')}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {history.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="truncate max-w-[140px] text-[var(--muted-foreground)]">{h.prompt}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { const a = new Audio(h.url); a.play(); }}>
                        <Play className="h-3 w-3" />
                      </Button>
                      <a href={h.url} download={`sfx-${i}.mp3`}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Download className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   VOICE CLONE PANEL
   ═══════════════════════════════════════════ */
function ClonePanel() {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [clonedVoiceId, setClonedVoiceId] = useState('');
  const [testText, setTestText] = useState("Hey, this is Casey from FreightRoll. I wanted to connect about what we're seeing at the yard level.");
  const [testAudio, setTestAudio] = useState<HTMLAudioElement | null>(null);
  const [testPlaying, setTestPlaying] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleClone() {
    if (!name.trim() || !file) { toast.error('Provide a name and audio file'); return; }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('file', file);

      const res = await fetch('/api/voice/voices', { method: 'POST', body: form });
      if (!res.ok) throw new Error((await res.json() as { error?: string }).error ?? 'Clone failed');

      const data = await res.json() as { voice_id: string };
      setClonedVoiceId(data.voice_id);
      toast.success(`Voice "${name}" cloned! ID: ${data.voice_id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Clone failed');
    } finally {
      setLoading(false);
    }
  }

  async function testVoice() {
    if (!clonedVoiceId || !testText.trim()) return;
    setTestLoading(true);
    if (testAudio) { testAudio.pause(); setTestPlaying(false); }

    try {
      const res = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText, voiceId: clonedVoiceId }),
      });
      if (!res.ok) throw new Error('Test failed');

      const blob = await res.blob();
      if (testUrl) URL.revokeObjectURL(testUrl);
      const url = URL.createObjectURL(blob);
      setTestUrl(url);

      const player = new Audio(url);
      player.onended = () => setTestPlaying(false);
      setTestAudio(player);
      player.play();
      setTestPlaying(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Voice test failed');
    } finally {
      setTestLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mic className="h-4 w-4 text-emerald-500" /> Instant Voice Clone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-[var(--muted-foreground)]">
            Upload a clean audio sample (30s–5min) of your voice. ElevenLabs will clone it instantly.
            Use it for call scripts, email rehearsals, and meeting prep — in your own voice.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-medium">Voice Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Casey"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Audio Sample</label>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center rounded-md border-2 border-dashed border-input py-8 cursor-pointer hover:bg-[var(--muted)] transition-colors"
            >
              {file ? (
                <div className="text-center">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-6 w-6 mx-auto text-[var(--muted-foreground)] mb-1" />
                  <p className="text-sm text-[var(--muted-foreground)]">Click to upload audio file</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">MP3, WAV, M4A — 30s to 5 min</p>
                </div>
              )}
            </div>
          </div>

          <Button onClick={handleClone} disabled={loading || !name.trim() || !file} className="w-full">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Mic className="h-3.5 w-3.5 mr-1" />}
            Clone Voice
          </Button>
        </CardContent>
      </Card>

      {/* Test cloned voice */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Test Your Voice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {clonedVoiceId ? (
            <>
              <div className="rounded-md bg-emerald-500/10 p-3">
                <p className="text-xs font-medium text-emerald-700">Voice cloned successfully!</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1 font-mono">ID: {clonedVoiceId}</p>
              </div>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Type something to hear in your cloned voice..."
              />
              <div className="flex gap-2">
                <Button onClick={testVoice} disabled={testLoading}>
                  {testLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                  Test Voice
                </Button>
                {testUrl && (
                  <a href={testUrl} download="cloned-voice-test.mp3">
                    <Button variant="outline">
                      <Download className="h-3.5 w-3.5 mr-1" /> Download
                    </Button>
                  </a>
                )}
              </div>
              <div className="rounded-md bg-blue-500/10 p-3 text-xs">
                <p className="font-medium text-blue-700">To use this voice everywhere:</p>
                <p className="text-[var(--muted-foreground)] mt-1">
                  Set <code className="bg-[var(--muted)] px-1 rounded">ELEVENLABS_VOICE_ID={clonedVoiceId}</code> in Vercel env vars, then redeploy.
                  All call scripts, email previews, and meeting briefs will use your voice.
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mic className="h-8 w-8 text-[var(--muted-foreground)] mb-2" />
              <p className="text-sm text-[var(--muted-foreground)]">Clone a voice first</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Upload an audio sample on the left to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
