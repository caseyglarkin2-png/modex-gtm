'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CurationSummary } from '@/lib/discovery/curate';
import type { ScoredOutput } from '@/lib/discovery/types';

interface Props {
  output: ScoredOutput;
  curation: CurationSummary;
}

export function ScanPanel({ output, curation }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Last Scan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total discoveries" value={output.totalDiscoveries} />
          <Stat label="Existing accounts" value={output.existingAccountMatches} />
          <Stat label="Net-new" value={output.netNewProspects} />
          <Stat label="Corridors" value={output.corridors.length} />
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Tier A" value={output.tierA} />
          <Stat label="Tier B" value={output.tierB} />
          <Stat label="Tier C" value={output.tierC} />
          <Stat label="Tier D" value={output.tierD} />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            Curation (sellable target set)
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Curated sites" value={curation.curatedTotal} />
            <Stat label="Duplicates merged" value={curation.mergedTotal} />
            <Stat label="Shippers" value={curation.bySegment.shipper} />
            <Stat label="Carriers" value={curation.bySegment.carrier} />
            <Stat label="3PLs" value={curation.bySegment['3pl']} />
            <Stat label="Parcel (demoted)" value={curation.bySegment.parcel} />
            <Stat label="High confidence" value={curation.byConfidence.high} />
            <Stat label="Low confidence" value={curation.byConfidence.low} />
          </div>
        </div>

        <div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Scored {new Date(output.generatedAt).toLocaleString()} · source: {output.inputFile}
          </p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-[var(--muted-foreground)]">Refresh command</p>
          <code className="block rounded bg-[var(--accent)] px-3 py-2 font-mono text-xs">
            npx tsx scripts/prospect-discovery/score-and-rank.ts
          </code>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold">{value}</p>
    </div>
  );
}
