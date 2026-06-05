import { Breadcrumb } from '@/components/breadcrumb';
import { MetricCard } from '@/components/metric-card';
import { Card, CardContent } from '@/components/ui/card';
import { Compass, Layers, Radar, Trophy } from 'lucide-react';
import { loadLatestScored, getDiscoverySummary, buildCuratedRows } from '@/lib/discovery/data';
import { summarizeCuration } from '@/lib/discovery/curate';
import { enrichRowsWithPipeline } from '@/lib/discovery/enrich';
import { DiscoveryHub } from './discovery-hub';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Discovery' };

export default async function DiscoveryPage() {
  const output = loadLatestScored();

  if (!output) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Discovery' }]} />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              No scored prospect data found. Run the scoring pipeline to populate:
            </p>
            <code className="mt-3 block rounded bg-[var(--accent)] px-3 py-2 font-mono text-xs">
              npx tsx scripts/prospect-discovery/score-and-rank.ts
            </code>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = getDiscoverySummary(output);
  const curatedRows = await enrichRowsWithPipeline(buildCuratedRows(output));
  const curation = summarizeCuration(curatedRows);
  // Distinct accounts with a live deal (each account's pipeline state is a shared
  // object, so de-duping by reference counts accounts, not sites).
  const pipelineAccounts = new Set(curatedRows.map((r) => r.pipeline).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Discovery' }]} />
      <p className="text-sm text-[var(--muted-foreground)]">
        Net-new prospects discovered via corridor scanning, ranked by ICP fit score.
      </p>

      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard
          label="Total discoveries"
          value={output.totalDiscoveries}
          tone="text-[var(--foreground)]"
          icon={Radar}
        />
        <MetricCard
          label="Net-new"
          value={summary.totalNetNew}
          tone="text-blue-600"
          icon={Radar}
        />
        <MetricCard
          label="Tier A"
          value={summary.tierACount}
          tone={summary.tierACount > 0 ? 'text-emerald-600' : 'text-[var(--foreground)]'}
          icon={Trophy}
        />
        <MetricCard
          label="Corridors"
          value={summary.corridorCount}
          tone="text-blue-600"
          icon={Layers}
        />
        <MetricCard
          label="Avg ICP score"
          value={summary.avgScore}
          tone="text-[var(--foreground)]"
          icon={Compass}
        />
      </div>

      <p className="text-xs text-[var(--muted-foreground)]">
        Scored {new Date(summary.generatedAt).toLocaleDateString()} · from {output.inputFile} ·{' '}
        curated to {curation.curatedTotal.toLocaleString()} sellable sites
        {curation.mergedTotal > 0 && ` · ${curation.mergedTotal.toLocaleString()} duplicate/gate rows merged`}
        {curation.bySegment.parcel > 0 && ` · ${curation.bySegment.parcel.toLocaleString()} parcel/last-mile demoted`}
        {pipelineAccounts > 0 && ` · ${pipelineAccounts} account${pipelineAccounts === 1 ? '' : 's'} with a live HubSpot deal`}
      </p>

      <DiscoveryHub rows={curatedRows} corridors={output.corridors} output={output} curation={curation} />
    </div>
  );
}
