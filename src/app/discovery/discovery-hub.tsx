'use client';

import { useMemo, useState } from 'react';
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

export function DiscoveryHub({ rows, corridors, output }: Props) {
  const [tierFilter, setTierFilter] = useState<string | null>(null);
  const [corridorFilter, setCorridorFilter] = useState<string | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<ProspectRow | null>(null);

  const corridorNames = useMemo(
    () => corridors.map((c) => c.name).sort(),
    [corridors],
  );

  const filtered = useMemo(
    () => filterProspects(rows, { tier: tierFilter ?? undefined, corridor: corridorFilter ?? undefined }),
    [rows, tierFilter, corridorFilter],
  );

  function handleSelectCorridor(name: string) {
    setCorridorFilter(name);
  }

  function handleSelectProspectById(placeId: string) {
    const prospect = rows.find((r) => r.placeId === placeId);
    if (prospect) setSelectedProspect(prospect);
  }

  return (
    <>
      <Tabs defaultValue="prospects">
        <TabsList>
          <TabsTrigger value="prospects">Prospects</TabsTrigger>
          <TabsTrigger value="corridors">Corridors</TabsTrigger>
          <TabsTrigger value="scan">Scan</TabsTrigger>
        </TabsList>

        <TabsContent value="prospects" className="space-y-4">
          <FilterBar
            tierFilter={tierFilter}
            corridorFilter={corridorFilter}
            corridorNames={corridorNames}
            onTierChange={setTierFilter}
            onCorridorChange={setCorridorFilter}
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
              <ProspectsTable
                prospects={filtered}
                onRowClick={setSelectedProspect}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="corridors">
          <CorridorsView
            corridors={corridors}
            onSelectCorridor={handleSelectCorridor}
          />
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
