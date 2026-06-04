'use client';

import dynamic from 'next/dynamic';
import type { ProspectRow, Corridor } from '@/lib/discovery/types';

const CorridorMapInner = dynamic(() => import('./corridor-map-inner'), {
  ssr: false,
  loading: () => (
    <div
      className="motion-safe:animate-pulse flex h-full w-full items-center justify-center"
      style={{
        background:
          'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,180,255,0.08), transparent 70%), linear-gradient(180deg, #0a0c10, #050505)',
      }}
      aria-busy="true"
      aria-label="Loading corridor map"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
        Loading corridor map…
      </span>
    </div>
  ),
});

interface CorridorMapProps {
  prospects: ProspectRow[];
  corridors: Corridor[];
  onSelectProspect?: (placeId: string) => void;
}

export function CorridorMap(props: CorridorMapProps) {
  return <CorridorMapInner {...props} />;
}
