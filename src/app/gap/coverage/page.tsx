/**
 * /gap/coverage: what GAP is monitoring, how fresh each source class is per account, what failed, and whether the
 * allowance can meet the declared objectives (R20). An operator page under More: read only, from the ledgers the
 * discovery and research jobs write. A cron having run is never presented as "every account was searched".
 */
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { loadCoverage, type AccountCoverage } from '@/lib/gap/signals/coverage';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { Breadcrumb } from '@/components/breadcrumb';
import { AccountLink } from '@/components/gap/account-link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Coverage' };

const ago = (iso: string | null, now: Date) => {
  if (!iso) return 'never';
  const h = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 3_600_000));
  return h < 1 ? 'just now' : h < 48 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};
const TONE: Record<AccountCoverage['state'], string> = { covered: 'text-emerald-700 dark:text-emerald-400', stale: 'text-amber-700 dark:text-amber-400', never: 'text-[var(--muted-foreground)]', failed: 'text-red-700 dark:text-red-400' };

export default async function CoveragePage() {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect('/login');
  const now = new Date();
  const r = await loadCoverage(prisma, now);
  const c = r.capacity;
  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'GAP', href: '/gap' }, { label: 'Coverage' }]} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Coverage</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">What GAP is monitoring, how fresh each source class is, what failed. Read from the discovery and research ledgers; a cron having run never means every account was searched.</p>
      </div>
      <GapSubnav />
      <section className="rounded-md border border-[var(--border)] p-3 text-sm" data-testid="coverage-capacity">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Capacity against the objectives</h2>
        <p className="mt-1">
          {c.accounts} watched accounts ({c.priorityAccounts} priority: in motion, chosen, in a deal, a meeting within 14 days) x {c.bundles} source-class bundles. Grounded search runs {c.runsPerDay} times a day, {c.accountsPerRun} accounts a run: {c.turnsPerDay} turns a day, a full rotation every {c.fullRotationDays} days. News runs with the same cron for every watched account.
        </p>
        <ul className="mt-1 list-disc pl-5 text-xs">
          <li>Every bundle within seven days: {c.meetsSevenDayTarget ? 'met' : `not met (needs ${c.requiredTurnsPerDay} turns a day)`}.</li>
          <li>A daily pass for priority accounts: {c.meetsPriorityDailyTarget ? `met (${c.rotationTurnsPerDay} turns a day are left for the rotation)` : 'not met'}.</li>
        </ul>
        {c.choice ? <p className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs" data-testid="coverage-choice">{c.choice}</p> : null}
      </section>
      <section className="space-y-2" data-testid="coverage-accounts">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Accounts: {r.counts.covered} covered, {r.counts.stale} stale, {r.counts.never} never, {r.counts.failed} failed
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-[var(--muted-foreground)]">
              <tr>
                <th className="py-1 pr-2">Account</th>
                <th className="py-1 pr-2">State</th>
                <th className="py-1 pr-2">News</th>
                {r.accounts[0]?.bundles.map((b, k) => (
                  <th key={k} className="py-1 pr-2" title={b.classes.join(', ')}>Bundle {k + 1}</th>
                ))}
                <th className="py-1 pr-2">Research</th>
              </tr>
            </thead>
            <tbody>
              {r.accounts.map((a) => (
                <tr key={a.accountName} className="border-t border-[var(--border)]" data-testid="coverage-row" data-state={a.state}>
                  <td className="py-1 pr-2">
                    <AccountLink name={a.accountName} />
                    {a.priority ? <span className="ml-1 rounded border border-[var(--primary)] px-1 text-[10px] uppercase text-[var(--primary)]" title={a.priorityWhy.join('; ')}>priority</span> : null}
                  </td>
                  <td className={`py-1 pr-2 font-medium ${TONE[a.state]}`}>{a.state}{a.lastGroundedFailed ? ' (last turn failed)' : ''}</td>
                  <td className="py-1 pr-2">{ago(a.lastNewsAt, now)}</td>
                  {a.bundles.map((b, k) => (
                    <td key={k} className={`py-1 pr-2 ${TONE[b.state]}`}>{b.state === 'never' ? 'never' : b.state === 'failed' ? 'failed' : ago(b.lastAt, now)}</td>
                  ))}
                  <td className="py-1 pr-2">{ago(a.lastResearchAt, now)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="text-xs text-[var(--muted-foreground)]" data-testid="coverage-classes">
        <h2 className="font-semibold uppercase tracking-wide">Source classes</h2>
        <ul className="mt-1 list-disc pl-5">
          {r.classes.map((x) => (
            <li key={x.cls}>{x.cls}: {x.mode === 'automated' ? 'automated' : 'manual only'} ({x.via}).</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
