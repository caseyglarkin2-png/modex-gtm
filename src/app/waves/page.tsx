import Link from 'next/link';
import { getOutreachWaves, slugify } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { Waves } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';

export const metadata = { title: 'Outreach Waves' };

const WAVE_ACCENT: Record<number, string> = {
  0: 'border-l-red-500',
  1: 'border-l-blue-500',
  2: 'border-l-violet-500',
  3: 'border-l-emerald-500',
};

export default function WavesPage() {
  const waves = getOutreachWaves();
  const grouped = [0, 1, 2, 3].map((order) => ({
    order,
    label: waves.find((w) => w.wave_order === order)?.wave || `Wave ${order}`,
    items: waves.filter((w) => w.wave_order === order),
  }));

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Outreach Waves' }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Outreach Waves</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          4-wave outreach strategy: Warm intros &rarr; Must-book &rarr; High-value &rarr; Ecosystem.
        </p>
      </div>

      {grouped.map((group) => {
        const progressed = group.items.filter((w) => w.status !== 'Not started' && w.status !== 'Planned').length;
        const pct = group.items.length ? Math.round((progressed / group.items.length) * 100) : 0;
        return (
          <div key={group.order} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Waves className="h-4 w-4" /> {group.label}
                <Badge variant="secondary" className="text-xs">{group.items.length} accounts</Badge>
              </h2>
              <span className="text-xs text-[var(--muted-foreground)]">{progressed}/{group.items.length} progressed ({pct}%)</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
              <div className={`h-full rounded-full ${WAVE_ACCENT[group.order]?.replace('border-l-', 'bg-')} transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <div className="space-y-2">
              {group.items.map((w, i) => (
                <Card key={i} className={`border-l-4 ${WAVE_ACCENT[group.order] || ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link href={`/accounts/${slugify(w.account)}`} className="font-medium text-sm text-[var(--primary)] hover:underline">
                          {w.account}
                        </Link>
                        <Badge variant="outline" className="text-xs">Rank {w.rank}</Badge>
                      </div>
                      <StatusBadge status={w.status} />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)] sm:grid-cols-3">
                      <span>Channel: {w.channel_mix}</span>
                      <span>Owner: {w.owner}</span>
                      <span>Start: {w.start_date}</span>
                      <span>Follow-up 1: {w.follow_up_1}</span>
                      <span>Follow-up 2: {w.follow_up_2}</span>
                      <span>Warm Intro: {w.use_warm_intro ? 'Yes' : 'No'}</span>
                    </div>
                    <p className="mt-2 text-sm">{w.primary_objective}</p>
                    <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Primary: {w.primary_persona_lane} &middot; Secondary: {w.secondary_persona_lane} &middot; Escalation: {w.escalation_trigger}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
