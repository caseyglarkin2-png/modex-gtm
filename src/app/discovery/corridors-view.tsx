'use client';

import { BandBadge } from '@/components/band-badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Corridor } from '@/lib/discovery/types';

interface Props {
  corridors: Corridor[];
  onSelectCorridor: (name: string) => void;
}

export function CorridorsView({ corridors, onSelectCorridor }: Props) {
  const sorted = [...corridors].sort(
    (a, b) => b.avgIcpScore * b.totalProspects - a.avgIcpScore * a.totalProspects,
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((c) => {
        const tier = c.avgIcpScore >= 70 ? 'A' : c.avgIcpScore >= 50 ? 'B' : c.avgIcpScore >= 30 ? 'C' : 'D';
        return (
          <Card
            key={c.name}
            className="cursor-pointer transition hover:border-[var(--primary)]"
            onClick={() => onSelectCorridor(c.name)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{c.name}</span>
                <BandBadge band={tier} />
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                <span>{c.totalProspects} prospect{c.totalProspects === 1 ? '' : 's'}</span>
                <span>{c.tierACount} Tier A</span>
                <span>Avg {Math.round(c.avgIcpScore)}</span>
              </div>
              {c.topProspects.length > 0 && (
                <p className="mt-2 truncate text-xs text-[var(--muted-foreground)]">
                  Top: {c.topProspects.slice(0, 3).join(', ')}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
