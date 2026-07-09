'use client';

import { useEffect, useState } from 'react';
import { DemoSurface } from './demo-surface';
import type { DemoPack } from '@/lib/demo/pack-schema';

/**
 * D2.8, Embeddable variant of the demo for the existing /for/[account]
 * microsites. The host page passes an account slug; this component
 * fetches the matching pack from /demo-packs/<slug>.json and renders the
 * atlas in `embed` mode. Falls back to a "preparing your network" stub
 * when the pack is missing (still useful in dev when packs haven't been
 * generated yet) or fails validation.
 *
 * Why client-side fetch and not props: the microsite content files are
 * already a TypeScript registry; threading 100KB+ pack JSON through
 * compile time would bloat the bundle. Lazy fetch keeps the microsite
 * Time-to-First-Byte the same as today.
 */

interface Props {
  /** micrositeSlug, same value used in /for/[account] and /demo/[account]. */
  accountSlug: string;
}

export function DemoEmbed({ accountSlug }: Props) {
  const [pack, setPack] = useState<DemoPack | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/demo-packs/${accountSlug}.json`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`pack not found (${r.status})`);
        const json = (await r.json()) as DemoPack;
        if (!cancelled) setPack(json);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [accountSlug]);

  if (error) {
    return (
      <div className="rounded-lg border border-[#00B4FF]/[0.16] bg-[#0a0c10] px-5 py-4 text-xs text-white/70">
        Live network atlas is being generated. The static map below reflects the same composition.
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border border-[#00B4FF]/[0.16] bg-[#0a0c10] font-mono text-xs uppercase tracking-[0.18em] text-white/40">
        Loading your network…
      </div>
    );
  }

  return <DemoSurface pack={pack} mode="embed" />;
}
