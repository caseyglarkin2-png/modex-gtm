'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ScoredOutput } from '@/lib/discovery/types';

interface Props {
  output: ScoredOutput;
}

export function ScanPanel({ output }: Props) {
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
