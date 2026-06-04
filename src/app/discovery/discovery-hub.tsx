'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CorridorMap } from '@/components/discovery/corridor-map';
import { filterProspects } from '@/lib/discovery/filters';
import type { Corridor, ProspectRow, ScoredOutput } from '@/lib/discovery/types';
import { CorridorsView } from './corridors-view';
import { FilterBar } from './filter-bar';
import { ProspectDetailSheet } from './prospect-detail-sheet';
import { ProspectsTable } from './prospects-table';
import { ScanPanel } from './scan-panel';

interface Props {
  rows: ProspectRow[];
  corridors: Corridor[];
  output: ScoredOutput;
}

const VALID_TABS = ['prospects', 'corridors', 'scan'] as const;

/**
 * Reflect filter/tab state in the URL without triggering a Next.js navigation.
 * The page is force-dynamic and holds the full (~8 MB) prospect set client-side,
 * so a router.replace() would re-run the server component and re-ship everything.
 * history.replaceState keeps the URL shareable/refresh-safe at zero cost.
 */
function syncUrl(params: Record<string, string | null>) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') sp.delete(key);
    else sp.set(key, value);
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
}

export function DiscoveryHub({ rows, corridors, output }: Props) {
  const searchParams = useSearchParams();

  const initialTab = VALID_TABS.includes(searchParams.get('tab') as (typeof VALID_TABS)[number])
    ? (searchParams.get('tab') as string)
    : 'prospects';
  const initialMinScore = (() => {
    const raw = searchParams.get('minScore');
    const n = raw == null ? NaN : parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  })();

  const [tab, setTab] = useState<string>(initialTab);
  const [tierFilter, setTierFilter] = useState<string | null>(searchParams.get('tier'));
  const [corridorFilter, setCorridorFilter] = useState<string | null>(searchParams.get('corridor'));
  const [minScore, setMinScore] = useState<number | null>(initialMinScore);
  const [selectedProspect, setSelectedProspect] = useState<ProspectRow | null>(null);

  const corridorNames = useMemo(() => corridors.map((c) => c.name).sort(), [corridors]);

  const filtered = useMemo(
    () =>
      filterProspects(rows, {
        tier: tierFilter ?? undefined,
        corridor: corridorFilter ?? undefined,
        minScore: minScore ?? undefined,
      }),
    [rows, tierFilter, corridorFilter, minScore],
  );

  const handleTabChange = useCallback((value: string) => {
    setTab(value);
    syncUrl({ tab: value === 'prospects' ? null : value });
  }, []);

  const handleTierChange = useCallback((tier: string | null) => {
    setTierFilter(tier);
    syncUrl({ tier });
  }, []);

  const handleCorridorChange = useCallback((corridor: string | null) => {
    setCorridorFilter(corridor);
    syncUrl({ corridor });
  }, []);

  const handleMinScoreChange = useCallback((score: number | null) => {
    setMinScore(score);
    syncUrl({ minScore: score == null ? null : String(score) });
  }, []);

  // Clicking a corridor card jumps to the Prospects tab filtered to that corridor.
  const handleSelectCorridor = useCallback(
    (name: string) => {
      setCorridorFilter(name);
      setTab('prospects');
      syncUrl({ corridor: name, tab: null });
    },
    [],
  );

  const handleSelectProspectById = useCallback(
    (placeId: string) => {
      const prospect = rows.find((r) => r.placeId === placeId);
      if (prospect) setSelectedProspect(prospect);
    },
    [rows],
  );

  return (
    <>
      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="prospects">Prospects</TabsTrigger>
          <TabsTrigger value="corridors">Corridors</TabsTrigger>
          <TabsTrigger value="scan">Scan</TabsTrigger>
        </TabsList>

        <TabsContent value="prospects" className="space-y-4">
          <FilterBar
            tierFilter={tierFilter}
            corridorFilter={corridorFilter}
            minScore={minScore}
            corridorNames={corridorNames}
            onTierChange={handleTierChange}
            onCorridorChange={handleCorridorChange}
            onMinScoreChange={handleMinScoreChange}
            resultCount={filtered.length}
          />

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Corridor Map</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[480px]">
                  <CorridorMap
                    prospects={filtered}
                    corridors={corridors}
                    onSelectProspect={handleSelectProspectById}
                  />
                </div>
              </CardContent>
            </Card>
            <div className="min-w-0">
              <ProspectsTable prospects={filtered} onRowClick={setSelectedProspect} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="corridors">
          <CorridorsView corridors={corridors} onSelectCorridor={handleSelectCorridor} />
        </TabsContent>

        <TabsContent value="scan">
          <ScanPanel output={output} />
        </TabsContent>
      </Tabs>

      <ProspectDetailSheet
        prospect={selectedProspect}
        onClose={() => setSelectedProspect(null)}
      />
    </>
  );
}
