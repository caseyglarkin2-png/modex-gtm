'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Copy, Video, Volume2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type MicrositeAudioAsset = {
  slug: string;
  accountName: string;
  hasCustomAudio: boolean;
  audioGeneratedAt: string | null;
  hasVideo: boolean;
};

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? 'unknown'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function MicrositeAudioPanel({ assets }: { assets: MicrositeAudioAsset[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  const customCount = assets.filter((asset) => asset.hasCustomAudio).length;
  const videoCount = assets.filter((asset) => asset.hasVideo).length;

  async function copyCommand(slug: string) {
    const command = `npm run audio:run -- --account ${slug}`;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(slug);
      toast.success('Regeneration command copied — run it in the repo terminal');
      window.setTimeout(() => setCopied((current) => (current === slug ? null : current)), 2000);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
      <h3 className="text-sm font-semibold">Audio &amp; video assets</h3>
      <p className="text-xs text-[var(--muted-foreground)]">
        {customCount} custom audio brief{customCount !== 1 ? 's' : ''} · {videoCount} video coda
        {videoCount !== 1 ? 's' : ''}. Regeneration runs offline through the audio pipeline — copy a
        command to run it in the repo terminal.
      </p>
      <div className="mt-3 space-y-1.5">
        {assets.map((asset) => (
          <div
            key={asset.slug}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--border)] p-2.5"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium">{asset.accountName}</span>
              {asset.hasCustomAudio ? (
                <Badge variant="success">
                  <Volume2 className="mr-1 h-3 w-3" />
                  Custom{asset.audioGeneratedAt ? ` · ${formatDate(asset.audioGeneratedAt)}` : ''}
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Volume2 className="mr-1 h-3 w-3" />
                  Shared brief
                </Badge>
              )}
              {asset.hasVideo ? (
                <Badge variant="info">
                  <Video className="mr-1 h-3 w-3" />
                  Video coda
                </Badge>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => copyCommand(asset.slug)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-medium transition-colors hover:bg-[var(--muted)]"
            >
              {copied === asset.slug ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied === asset.slug ? 'Copied' : 'Regen command'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
