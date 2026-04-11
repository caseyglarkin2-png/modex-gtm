import Link from 'next/link';
import { getAuditRoutes, slugify } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/copy-button';
import { ArrowRight, ExternalLink, Route } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';

export const metadata = { title: 'Audit Routes' };

export default function AuditRoutesPage() {
  const routes = getAuditRoutes();
  const openRoutes = routes.filter((route) => route.status !== 'Closed');
  const warmRouteCount = routes.filter((route) => route.warm_route && !/no warm intro/i.test(route.warm_route)).length;
  const topPriorityCount = routes.filter((route) => route.rank <= 11).length;
  const untouchedCount = routes.filter((route) => !route.last_touch).length;
  const sprintRoutes = [...openRoutes].sort((left, right) => left.rank - right.rank).slice(0, 6);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Audit Routes' }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Routes ({routes.length})</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          UTM-tracked landing page URLs for yardflow.ai/audit. Copy URLs and messages with one click.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <RouteMetricCard label="Open routes" value={openRoutes.length} tone={openRoutes.length > 0 ? 'text-emerald-600' : 'text-[var(--foreground)]'} />
        <RouteMetricCard label="Warm route paths" value={warmRouteCount} tone={warmRouteCount > 0 ? 'text-amber-600' : 'text-[var(--foreground)]'} />
        <RouteMetricCard label="Top priority" value={topPriorityCount} tone={topPriorityCount > 0 ? 'text-blue-600' : 'text-[var(--foreground)]'} />
        <RouteMetricCard label="Untouched" value={untouchedCount} tone={untouchedCount > 0 ? 'text-[var(--foreground)]' : 'text-emerald-600'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Route Sprint Board</CardTitle>
              <Link href="/qr">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Open QR assets <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sprintRoutes.map((r) => (
                <div key={r.account} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">#{r.rank}</Badge>
                      <Link href={`/accounts/${slugify(r.account)}`} className="truncate text-sm font-semibold text-[var(--primary)] hover:underline">
                        {r.account}
                      </Link>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{r.fast_ask}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">Warm route: {r.warm_route || 'No warm intro noted'} · Owner: {r.owner}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <a href={r.audit_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm">Open route</Button>
                    </a>
                    <CopyButton text={r.audit_url} />
                    <CopyButton text={`${r.fast_ask}\n${r.audit_url}`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Booth Talk Track</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)]/40 p-3 text-sm text-[var(--muted-foreground)]">
              <span className="inline-flex items-center gap-2 text-[var(--foreground)]">
                <Route className="h-4 w-4" /> {warmRouteCount} accounts have a documented warm path into the audit ask.
              </span>
            </div>

            <div className="rounded-lg border border-[var(--border)] p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-[var(--muted-foreground)]">Floor opener</p>
                <CopyButton text="If useful, we can run a 30-minute network audit next week and leave you with a prioritized rollout map." />
              </div>
              <p className="mt-1 text-sm text-[var(--foreground)]">
                If useful, we can run a 30-minute network audit next week and leave you with a prioritized rollout map.
              </p>
            </div>

            <div className="space-y-2">
              {routes.slice(0, 4).map((r) => (
                <div key={`${r.account}-${r.rank}`} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[var(--foreground)]">{r.account}</span>
                    <Badge variant="outline">#{r.rank}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{r.warm_route}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Route Library</h2>
          <p className="text-xs text-[var(--muted-foreground)]">Copy the audit URL and message together when working the MODEX floor or follow-up threads.</p>
        </div>

        <div className="space-y-3">
          {routes.map((r) => (
            <Card key={r.account}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">#{r.rank}</Badge>
                    <Link href={`/accounts/${slugify(r.account)}`} className="font-semibold text-sm text-[var(--primary)] hover:underline">
                      {r.account}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted-foreground)]">{r.owner}</span>
                    <StatusBadge status={r.status} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a href={r.audit_url} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center gap-1 break-all text-sm text-[var(--primary)] hover:underline">
                    {r.audit_url} <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                  <CopyButton text={r.audit_url} />
                </div>

                <div className="flex items-start gap-2">
                  <p className="flex-1 text-sm">{r.suggested_message}</p>
                  <CopyButton text={r.suggested_message} />
                </div>

                <div className="rounded-lg bg-[var(--muted)] p-3 text-xs">
                  <span className="font-medium">Fast Ask:</span> {r.fast_ask}
                </div>

                <div className="flex items-center justify-end">
                  <CopyButton text={`${r.suggested_message}\n\n${r.fast_ask}\n${r.audit_url}`} />
                </div>

                <div className="text-xs text-[var(--muted-foreground)]">
                  Proof: {r.proof_asset} &middot; Warm Route: {r.warm_route}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function RouteMetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
        <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
