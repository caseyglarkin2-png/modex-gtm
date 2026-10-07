/**
 * TODAY on Work (GAP OS execution recovery, R45): what was done today, what is still owed to buyers, what waits on
 * them, and what is due tomorrow, each counted and listed (a count is its list). Derived from actual state
 * (lib/gap/work/today.ts); nothing is stored for it. Presentational.
 */
import Link from 'next/link';
import { accountHref } from '@/lib/gap/account-intel/href';
import type { TodaySummary } from '@/lib/gap/work/today';

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
                  <Link href={accountHref(x.accountName)} className="underline">{x.accountName}</Link>:{' '}
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

export function WorkToday({ today, preview = false }: { today: TodaySummary; preview?: boolean }) {
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
    </section>
  );
}
