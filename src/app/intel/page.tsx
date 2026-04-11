import Link from 'next/link';
import { dbGetActionableIntel } from '@/lib/db';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { IntelList, type IntelItem } from './intel-list';

export const dynamic = 'force-dynamic';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default async function IntelPage() {
  const raw = await dbGetActionableIntel();

  const items: IntelItem[] = raw.map((r) => ({
    id: r.id,
    account: r.account,
    slug: slugify(r.account),
    intel_type: r.intel_type,
    why_it_matters: r.why_it_matters ?? '',
    how_to_find_it: r.how_to_find ?? '',
    owner: r.owner ?? '',
    status: r.status,
    field_to_update: r.field_to_update ?? '',
  }));

  const openItems = items.filter((item) => item.status !== 'Closed');
  const accountsCoveredCount = new Set(items.map((item) => item.account)).size;
  const ownerCounts = Array.from(
    items.reduce((acc, item) => {
      const owner = item.owner || 'Unassigned';
      acc.set(owner, (acc.get(owner) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
  ).sort((left, right) => right[1] - left[1]);

  const actionBoard = [...openItems].sort((left, right) => left.account.localeCompare(right.account)).slice(0, 6);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Actionable Intel' }]} />
      <IntelListHeader items={items} openCount={openItems.length} />

      <div className="grid gap-4 md:grid-cols-4">
        <IntelMetricCard label="Open now" value={openItems.length} tone={openItems.length > 0 ? 'text-amber-600' : 'text-emerald-600'} />
        <IntelMetricCard label="Accounts covered" value={accountsCoveredCount} tone="text-[var(--foreground)]" />
        <IntelMetricCard label="Owners active" value={ownerCounts.length} tone="text-[var(--foreground)]" />
        <IntelMetricCard label="Closed" value={items.length - openItems.length} tone="text-emerald-600" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Intel Action Board</CardTitle>
              <Link href="/accounts">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Open accounts <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {actionBoard.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/accounts/${item.slug}`} className="truncate text-sm font-medium text-[var(--primary)] hover:underline">
                        {item.account}
                      </Link>
                      <Badge variant="outline" className="text-xs">{item.intel_type}</Badge>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.why_it_matters}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">Update target: {item.field_to_update || 'Account notes'}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge variant="secondary" className="text-xs">{item.owner || 'Unassigned'}</Badge>
                    <Link href={`/accounts/${item.slug}`}>
                      <Button size="sm">Account</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Coverage Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)]/40 p-3 text-sm text-[var(--muted-foreground)]">
              <span className="inline-flex items-center gap-2 text-[var(--foreground)]">
                <Lightbulb className="h-4 w-4" /> {openItems.length} intel item{openItems.length === 1 ? '' : 's'} are still waiting on follow-through.
              </span>
            </div>

            <div className="space-y-2">
              {ownerCounts.slice(0, 4).map(([owner, count]) => (
                <div key={owner} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                  <span className="text-[var(--foreground)]">{owner}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <IntelList items={items} hideHeader />
    </div>
  );
}

function IntelListHeader({ items, openCount }: { items: IntelItem[]; openCount: number }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Actionable Intel ({items.length})</h1>
      <p className="text-sm text-[var(--muted-foreground)]">
        Research tasks and intelligence items. {openCount} open item{openCount !== 1 ? 's' : ''} require action.
      </p>
    </div>
  );
}

function IntelMetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
        <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

