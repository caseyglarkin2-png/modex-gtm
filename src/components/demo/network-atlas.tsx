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
    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-xs uppercase tracking-widest text-slate-400">
      Loading network…
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
