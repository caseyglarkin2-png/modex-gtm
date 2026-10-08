/**
 * TODAY on Work (GAP OS execution recovery, R45): what was done today, what is still owed to buyers, what waits on
 * them, and what is due tomorrow, each counted and listed (a count is its list). Derived from actual state
 * (lib/gap/work/today.ts); nothing is stored for it. Presentational.
 */
import Link from 'next/link';
import { accountHref } from '@/lib/gap/account-intel/href';
import type { TodaySummary } from '@/lib/gap/work/today';
import { remainingLine, scorecard } from '@/lib/gap/work/scorecard';
import type { TargetKind } from '@/lib/gap/work/settings';

const dayName = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

function Group({ title, testId, items }: { title: string; testId: string; items: Array<{ key: string; accountName: string | null; text: string }> }) {
  return (
    <details className="text-sm" data-testid={testId} data-count={items.length} open={items.length > 0 && items.length <= 3}>
      <summary className="min-h-11 cursor-pointer py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] sm:min-h-0 sm:py-1">
        {title} ({items.length})
      </summary>
      {items.length ? (
        <ul className="mb-1 space-y-0.5 text-xs">
          {items.map((x) => (
            <li key={x.key}>
              {x.accountName ? (
                <>
                  <Link href={accountHref(x.accountName)} className="inline-flex min-h-6 min-w-6 items-center underline">{x.accountName}</Link>:{' '}
                </>
              ) : null}
              {x.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-1 text-xs italic text-[var(--muted-foreground)]">None.</p>
      )}
    </details>
  );
}

/** X13: today's activity against the seller's targets (work/scorecard.ts); counts come from the ledger, never navigation. */
function Scorecard({ today, targets }: { today: TodaySummary; targets: Partial<Record<TargetKind, number>> }) {
  const rows = scorecard(today.done, targets);
  const anyTarget = rows.some((r) => r.target !== null);
  const line = remainingLine(rows);
  return (
    <div className="mt-2 border-t border-[var(--border)] pt-2 text-xs" data-testid="scorecard">
      <p className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Today&apos;s activity</p>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {rows.map((r) => (
          <li key={r.kind} data-testid={`scorecard-${r.kind}`}>
            {r.label} {r.count}{r.target !== null ? ` of ${r.target}` : ''}
          </li>
        ))}
      </ul>
      {anyTarget ? (
        <p className="mt-1 text-[var(--muted-foreground)]">{line ?? 'Every target met today.'}</p>
      ) : (
        <p className="mt-1 text-[var(--muted-foreground)]">
          No daily targets set. <Link href="/gap/settings" className="underline">Set targets</Link> and the count stands beside each.
        </p>
      )}
    </div>
  );
}

export function WorkToday({ today, preview = false, targets }: { today: TodaySummary; preview?: boolean; targets?: Partial<Record<TargetKind, number>> }) {
  return (
    <section className="rounded-md border border-[var(--border)] px-3 py-2" data-testid="work-today" aria-labelledby="work-today-heading">
      <h2 id="work-today-heading" className="text-sm font-semibold">
        {preview ? 'Tomorrow' : 'Today'}, {dayName(today.day)}
      </h2>
      <div className="grid gap-x-6 sm:grid-cols-2">
        <Group title="Done today" testId="today-done" items={today.done.map((d, k) => ({ key: `${d.at}:${k}`, accountName: d.accountName, text: d.line }))} />
        <Group title="Set aside or logged today" testId="today-set-aside" items={(today.setAside ?? []).map((d, k) => ({ key: `${d.at}:${k}`, accountName: d.accountName, text: d.line }))} />
        <Group title="Owed to buyers" testId="today-owed" items={today.owed.map((o) => ({ key: o.commitmentId, accountName: o.accountName, text: `${o.title}. ${o.line}` }))} />
        <Group title="Waiting on them" testId="today-waiting" items={today.waiting.map((w) => ({ key: w.key, accountName: w.accountName, text: `${w.title}. ${w.line}` }))} />
        <Group title={preview ? 'The day after' : 'Tomorrow'} testId="today-tomorrow" items={today.tomorrow.map((t) => ({ key: t.key, accountName: t.accountName, text: `${t.title}. ${t.line}` }))} />
      </div>
      {!preview && targets ? <Scorecard today={today} targets={targets} /> : null}
    </section>
  );
}
