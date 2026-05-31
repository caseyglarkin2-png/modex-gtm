'use client';

import dynamic from 'next/dynamic';
import type { ArchetypeId, DemoPack } from '@/lib/demo/pack-schema';

/**
 * Dynamic wrapper around the Leaflet network atlas — `ssr: false` because
 * Leaflet touches `window` on import. Public surface API stays clean
 * (no Leaflet types leak into callers).
 */

const NetworkAtlasInner = dynamic(() => import('./network-atlas-inner'), {
  ssr: false,
  loading: () => (
    // G.T4 — CLS-free skeleton. Fills the parent's reserved height
    // (h-[400px]/flex-1) so there is zero layout shift on hydrate.
    <div
      className="motion-safe:animate-pulse flex h-full w-full items-center justify-center"
      style={{
        background:
          'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,180,255,0.08), transparent 70%), linear-gradient(180deg, #0a0c10, #050505)',
      }}
      aria-busy="true"
      aria-label="Loading network atlas"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
        Loading network atlas…
      </span>
    </div>
  ),
});

interface NetworkAtlasProps {
  pack: DemoPack;
  selectedSiteId: string | null;
  archetypeFilter: Set<ArchetypeId> | null;
  onSelectSite: (siteId: string | null) => void;
}

export function NetworkAtlas(props: NetworkAtlasProps) {
  return <NetworkAtlasInner {...props} />;
}
