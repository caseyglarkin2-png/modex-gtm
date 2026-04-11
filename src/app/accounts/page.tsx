import Link from 'next/link';
import { dbGetAccounts, dbGetPersonas } from '@/lib/db';
import { Breadcrumb } from '@/components/breadcrumb';
import { AddAccountDialog } from '@/components/add-account-dialog';
import { BandBadge } from '@/components/band-badge';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Target } from 'lucide-react';
import { AccountsTable, type AccountRow } from './accounts-table';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Accounts' };

export default async function AccountsPage() {
  const [rawAccounts, rawPersonas] = await Promise.all([dbGetAccounts(), dbGetPersonas()]);

  const accounts: AccountRow[] = rawAccounts.map((a) => ({
    rank: a.rank,
    name: a.name,
    vertical: a.vertical,
    priority_band: a.priority_band,
    tier: a.tier,
    priority_score: a.priority_score,
    persona_count: rawPersonas.filter((p) => p.account_name === a.name).length,
    owner: a.owner,
    research_status: a.research_status,
    outreach_status: a.outreach_status,
    meeting_status: a.meeting_status,
    slug: slugify(a.name),
  }));

  const bandCounts = accounts.reduce((acc, account) => {
    const band = account.priority_band ?? 'Unscored';
    acc.set(band, (acc.get(band) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());

  const readyBandsCount = accounts.filter((account) => /^(A|B)$/i.test(account.priority_band ?? '')).length;
  const needsOutreachCount = accounts.filter((account) => !/contacted|replied|meeting/i.test(account.outreach_status ?? '')).length;
  const researchGapCount = accounts.filter((account) => !/ready|complete/i.test(account.research_status ?? '')).length;
  const meetingBookedCount = accounts.filter((account) => /booked|held/i.test(account.meeting_status ?? '')).length;

  const triageAccounts = [...accounts]
    .filter((account) => !/booked|held/i.test(account.meeting_status ?? ''))
    .sort((left, right) => {
      const scoreDelta = (right.priority_score ?? 0) - (left.priority_score ?? 0);
      if (scoreDelta !== 0) return scoreDelta;
      return (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER);
    })
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Accounts' }]} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          All target accounts ranked by priority score. Click any row to view details.
        </p>
        <AddAccountDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <AccountMetricCard label="Priority A/B" value={readyBandsCount} tone={readyBandsCount > 0 ? 'text-blue-600' : 'text-[var(--foreground)]'} />
        <AccountMetricCard label="Needs outreach" value={needsOutreachCount} tone={needsOutreachCount > 0 ? 'text-amber-600' : 'text-emerald-600'} />
        <AccountMetricCard label="Research gap" value={researchGapCount} tone={researchGapCount > 0 ? 'text-[var(--foreground)]' : 'text-emerald-600'} />
        <AccountMetricCard label="Meetings booked" value={meetingBookedCount} tone={meetingBookedCount > 0 ? 'text-emerald-600' : 'text-[var(--foreground)]'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Priority Triage Board</CardTitle>
              <Link href="/activities?filter=follow-up">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Open queue <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {triageAccounts.map((account) => {
                const nextStep = !/ready|complete/i.test(account.research_status ?? '')
                  ? 'Finish research'
                  : !/contacted|replied|meeting/i.test(account.outreach_status ?? '')
                    ? 'Needs outreach'
                    : 'Advance thread';

                return (
                  <div key={account.slug} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/accounts/${account.slug}`} className="truncate text-sm font-medium text-[var(--primary)] hover:underline">
                          {account.name}
                        </Link>
                        <BandBadge band={account.priority_band ?? ''} />
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        Score {account.priority_score ?? '—'} · {account.persona_count} persona{account.persona_count === 1 ? '' : 's'} · {account.owner ?? 'Unassigned'}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">Next move: {nextStep}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={account.outreach_status ?? 'Not started'} />
                      <Link href={`/accounts/${account.slug}`}>
                        <Button size="sm">Account</Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
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
                <Target className="h-4 w-4" /> {needsOutreachCount} account{needsOutreachCount === 1 ? '' : 's'} still need a first outbound touch.
              </span>
            </div>

            <div className="space-y-2">
              {Array.from(bandCounts.entries())
                .sort((left, right) => left[0].localeCompare(right[0]))
                .map(([band, count]) => (
                  <div key={band} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 text-[var(--foreground)]">
                      <BandBadge band={band} />
                      <span>{band === 'Unscored' ? 'Unscored' : `Band ${band}`}</span>
                    </span>
                    <span className="text-[var(--muted-foreground)]">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <AccountsTable accounts={accounts} />
    </div>
  );
}

function AccountMetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
        <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
