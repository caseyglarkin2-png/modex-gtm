'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CorridorMap } from '@/components/discovery/corridor-map';
import { filterProspects } from '@/lib/discovery/filters';
import type { CurationSummary } from '@/lib/discovery/curate';
import { rankWorklist, WEIGHT_PRESETS } from '@/lib/discovery/scoring';
import type { RankedRow } from '@/lib/discovery/scoring';
import type { Corridor, CuratedRow, ProspectSegment, ScoredOutput } from '@/lib/discovery/types';
import { CorridorsView } from './corridors-view';
import { FilterBar } from './filter-bar';
import { ProspectDetailSheet } from './prospect-detail-sheet';
import { ProspectsTable } from './prospects-table';
import { ScanPanel } from './scan-panel';
import { WeightControl } from './weight-control';
import { usePinned } from './use-pinned';
import { useTouchLog } from './use-touch-log';

const WEIGHT_STORAGE_KEY = 'discovery.weighting';
const DEFAULT_WEIGHTING = 'proximity-led';

// The default "work these today" slice: high-fit (Tier A/B), near a live
// reference site, no parcel. Widen toggles it off to show the full set.
const SLICE_TIERS = ['A', 'B'];
const SLICE_MAX_DISTANCE_MI = 25;

interface Props {
  rows: CuratedRow[];
  corridors: Corridor[];
  output: ScoredOutput;
  curation: CurationSummary;
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

export function DiscoveryHub({ rows, corridors, output, curation }: Props) {
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
  const [segmentFilter, setSegmentFilter] = useState<string | null>(searchParams.get('segment'));
  const [weighting, setWeighting] = useState<string>(searchParams.get('weight') ?? DEFAULT_WEIGHTING);
  // Daily slice on by default; ?all=1 (or the widen toggle) opens the full set.
  const [dailySlice, setDailySlice] = useState<boolean>(searchParams.get('all') !== '1');
  const [selectedProspect, setSelectedProspect] = useState<RankedRow | null>(null);
  const { pinned, toggle: togglePinned } = usePinned();
  const { touches, logTouch } = useTouchLog();

  // Restore the persisted weighting on mount (URL wins over localStorage so a
  // shared link is authoritative). Runs client-only — localStorage is unavailable on the server.
  useEffect(() => {
    if (searchParams.get('weight')) return;
    const stored = window.localStorage.getItem(WEIGHT_STORAGE_KEY);
    if (stored && stored in WEIGHT_PRESETS) setWeighting(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const corridorNames = useMemo(() => corridors.map((c) => c.name).sort(), [corridors]);

  // Per-segment counts for the filter chips (computed over the full curated set).
  const segmentCounts = useMemo(() => {
    const counts: Record<ProspectSegment, number> = { shipper: 0, carrier: 0, '3pl': 0, parcel: 0 };
    for (const r of rows) counts[r.segment] += 1;
    return counts;
  }, [rows]);

  // When the daily slice is on (and the user hasn't drilled into a specific tier
  // or corridor), narrow to Casey's sellable set: Tier A/B near a reference.
  const sliceActive = dailySlice && !tierFilter && !corridorFilter;

  const filtered = useMemo(
    () =>
      filterProspects(rows, {
        tier: tierFilter ?? undefined,
        corridor: corridorFilter ?? undefined,
        minScore: minScore ?? undefined,
        segment: segmentFilter ?? undefined,
        // Default daily slice hides parcel / last-mile; selecting the Parcel chip reveals it.
        excludeParcel: true,
        tiers: sliceActive ? SLICE_TIERS : undefined,
        maxDistance: sliceActive ? SLICE_MAX_DISTANCE_MI : undefined,
      }),
    [rows, tierFilter, corridorFilter, minScore, segmentFilter, sliceActive],
  );

  // Re-aim: rank the filtered slice by the proximity-led, re-weightable worklist
  // score. The table/map render this order by default (DataTable keeps input order
  // until a column is clicked).
  const ranked = useMemo<RankedRow[]>(
    () => rankWorklist(filtered, WEIGHT_PRESETS[weighting] ?? WEIGHT_PRESETS[DEFAULT_WEIGHTING]),
    [filtered, weighting],
  );

  // Pinned "my targets" float to the top of the worklist regardless of score.
  const ordered = useMemo<RankedRow[]>(() => {
    if (pinned.size === 0) return ranked;
    const pin: RankedRow[] = [];
    const rest: RankedRow[] = [];
    for (const r of ranked) (pinned.has(r.placeId) ? pin : rest).push(r);
    return [...pin, ...rest];
  }, [ranked, pinned]);

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

  const handleSegmentChange = useCallback((segment: string | null) => {
    setSegmentFilter(segment);
    syncUrl({ segment });
  }, []);

  const handleWeightingChange = useCallback((value: string) => {
    setWeighting(value);
    window.localStorage.setItem(WEIGHT_STORAGE_KEY, value);
    syncUrl({ weight: value === DEFAULT_WEIGHTING ? null : value });
  }, []);

  const handleToggleSlice = useCallback((next: boolean) => {
    setDailySlice(next);
    syncUrl({ all: next ? null : '1' });
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
      const prospect = ordered.find((r) => r.placeId === placeId);
      if (prospect) setSelectedProspect(prospect);
    },
    [ordered],
  );

  return (
    <>
      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="prospects">Worklist</TabsTrigger>
          <TabsTrigger value="corridors">Corridors</TabsTrigger>
          <TabsTrigger value="scan">Scan</TabsTrigger>
        </TabsList>

        <TabsContent value="prospects" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Work these today</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                {sliceActive ? (
                  <>
                    Tier A/B within {SLICE_MAX_DISTANCE_MI} mi of a live YardFlow site ·{' '}
                    {ordered.length.toLocaleString()} of {rows.length.toLocaleString()} sites
                    {pinned.size > 0 && ` · ${pinned.size} pinned`}
                  </>
                ) : (
                  <>
                    Full set · {ordered.length.toLocaleString()} sites
                    {pinned.size > 0 && ` · ${pinned.size} pinned`}
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleSlice(!dailySlice)}
              aria-pressed={!dailySlice}
              className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-medium transition hover:border-[var(--primary)]"
            >
              {dailySlice ? 'Widen to all sites' : 'Back to my slice'}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <FilterBar
              tierFilter={tierFilter}
              corridorFilter={corridorFilter}
              minScore={minScore}
              segmentFilter={segmentFilter}
              segmentCounts={segmentCounts}
              corridorNames={corridorNames}
              onTierChange={handleTierChange}
              onCorridorChange={handleCorridorChange}
              onMinScoreChange={handleMinScoreChange}
              onSegmentChange={handleSegmentChange}
              resultCount={ordered.length}
            />
            <WeightControl weighting={weighting} onChange={handleWeightingChange} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Corridor Map</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[480px]">
                  <CorridorMap
                    prospects={ordered}
                    corridors={corridors}
                    onSelectProspect={handleSelectProspectById}
                  />
                </div>
              </CardContent>
            </Card>
            <div className="min-w-0">
              <ProspectsTable
                prospects={ordered}
                onRowClick={setSelectedProspect}
                pinned={pinned}
                onTogglePin={togglePinned}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="corridors">
          <CorridorsView corridors={corridors} onSelectCorridor={handleSelectCorridor} />
        </TabsContent>

        <TabsContent value="scan">
          <ScanPanel output={output} curation={curation} />
        </TabsContent>
      </Tabs>

      <ProspectDetailSheet
        prospect={selectedProspect}
        onClose={() => setSelectedProspect(null)}
        pinned={pinned}
        onTogglePin={togglePinned}
        touches={touches}
        onLogTouch={logTouch}
      />
    </>
  );
}
