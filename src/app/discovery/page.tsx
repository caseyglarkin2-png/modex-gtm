import { Breadcrumb } from '@/components/breadcrumb';
import { MetricCard } from '@/components/metric-card';
import { Card, CardContent } from '@/components/ui/card';
import { Compass, Layers, Radar, Trophy } from 'lucide-react';
import { loadLatestScored, getDiscoverySummary, toProspectRow } from '@/lib/discovery/data';
import { DiscoveryHub } from './discovery-hub';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Discovery' };

export default function DiscoveryPage() {
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
  const rows = output.prospects
    .filter((p) => !p.excluded)
    .map(toProspectRow);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Discovery' }]} />
      <p className="text-sm text-[var(--muted-foreground)]">
        Net-new prospects discovered via corridor scanning, ranked by ICP fit score.
      </p>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Net-new prospects"
          value={summary.totalNetNew}
          tone="text-[var(--foreground)]"
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
        Scored {new Date(summary.generatedAt).toLocaleDateString()} · from {output.inputFile}
      </p>

      <DiscoveryHub rows={rows} corridors={output.corridors} output={output} />
    </div>
  );
}
