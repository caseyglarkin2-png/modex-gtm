/**
 * The accountability view (X20b, GAP OS sales execution engine, 2026-10-08; C36-C38c). Pure presentational over
 * lib/gap/work/activity.ts: what I intended (done, prepared but not sent, set aside, open), what was completed by
 * class (preparation, contact, commercial progress, CRM maintenance; provider-proven apart from self-reported), what
 * needs attention, what the agents are handling. No metrics beyond counts of real events; no nagging.
 *
 * Voice: no em dashes, "yards" plural.
 */
import Link from 'next/link';
import { ACTIVITY_CLASS_LABEL, type Accountability, type ActivityClass } from '@/lib/gap/work/activity';

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });

const STATUS_TEXT: Record<Accountability['intended'][number]['status'], string> = { done: 'Done', prepared: 'Prepared, not sent', set_aside: 'Set aside', open: 'Open' };
const CLASS_ORDER: readonly ActivityClass[] = ['preparation', 'contact', 'commercial', 'maintenance', 'other'];

function Section({ title, hint, testId, children }: { title: string; hint?: string; testId: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-[var(--border)] p-3" data-testid={testId}>
      <h2 className="text-sm font-semibold">{title}</h2>
      {hint ? <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{hint}</p> : null}
      <div className="mt-2 text-sm">{children}</div>
    </section>
  );
}

export function ActivityView({ a }: { a: Accountability }) {
  const doneCount = a.intended.filter((x) => x.status === 'done').length;
  const asideCount = a.intended.filter((x) => x.status === 'set_aside').length;
  const preparedCount = a.intended.filter((x) => x.status === 'prepared').length;
  const classes = CLASS_ORDER.filter((c) => a.completed.some((x) => x.cls === c));
  return (
    <div className="space-y-4" data-testid="activity-view">
      <Section title="What I intended" hint={a.planned ? `The day's plan: ${a.intended.length} items; ${doneCount} done, ${preparedCount} prepared but not sent, ${asideCount} set aside, ${a.attention.open.length} open.` : 'No plan was made for this day (the briefing cron makes it at the briefing hour, or START does).'} testId="activity-intended">
        {a.intended.length ? (
          <ol className="space-y-1">
            {a.intended.map(({ item, status, by }) => (
              <li key={item.key} className="flex flex-wrap items-baseline gap-x-2" data-testid="activity-intended-item" data-status={status}>
                <span className={status === 'done' ? 'text-emerald-700 dark:text-emerald-400' : status === 'set_aside' ? 'text-[var(--muted-foreground)]' : status === 'prepared' ? 'text-amber-700 dark:text-amber-400' : 'font-medium'}>{STATUS_TEXT[status]}</span>
                <span>{item.accountName}: {item.title}</span>
                {by ? <span className="text-xs text-[var(--muted-foreground)]">{by.line} {time(by.at)}{by.basis === 'self_reported' ? ' (self-reported)' : ''}</span> : null}
                {status === 'prepared' || status === 'open' ? <Link href={item.href} className="text-xs underline">{status === 'prepared' ? 'Send it' : 'Open'}</Link> : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="italic text-[var(--muted-foreground)]">Nothing planned.</p>
        )}
      </Section>

      <Section title="What was completed" hint="Counted from the ledger, by class: preparation is work on your side of the line (a draft is not a send); contact is a message, reply, call or conversation; commercial progress is a booking, a meeting outcome or a deal milestone; CRM maintenance is a note, task or next step in HubSpot, never advancement. Provider-proven means a system of record (Gmail, HubSpot, GAP itself) holds the proof; self-reported means you said so and nothing proves it. Delivered is never claimed." testId="activity-completed">
        {a.completed.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--muted-foreground)]"><th className="font-medium">Activity</th><th className="font-medium">Provider-proven</th><th className="font-medium">Self-reported</th></tr>
            </thead>
            {classes.map((cls) => (
              <tbody key={cls} data-testid={`activity-class-${cls}`}>
                <tr><th colSpan={3} className="pt-2 text-left text-xs font-medium text-[var(--muted-foreground)]">{ACTIVITY_CLASS_LABEL[cls]}</th></tr>
                {a.completed.filter((c) => c.cls === cls).map((c) => (
                  <tr key={c.kind} data-testid={`activity-count-${c.kind}`}><td>{c.label}</td><td>{c.provider}</td><td>{c.selfReported}</td></tr>
                ))}
              </tbody>
            ))}
          </table>
        ) : (
          <p className="italic text-[var(--muted-foreground)]">No activity recorded for this day.</p>
        )}
      </Section>

      <Section title="What needs attention" testId="activity-attention">
        {a.attention.open.length === 0 && a.attention.prepared.length === 0 && a.attention.blocked.length === 0 ? (
          <p className="italic text-[var(--muted-foreground)]">Nothing open, nothing prepared and unsent, nothing blocked.</p>
        ) : (
          <ul className="space-y-1">
            {a.attention.prepared.map((item) => (
              <li key={item.key} data-testid="activity-attention-prepared"><Link href={item.href} className="underline">{item.accountName}: {item.title}</Link> <span className="text-xs text-[var(--muted-foreground)]">prepared, awaiting your send</span></li>
            ))}
            {a.attention.open.map((item) => (
              <li key={item.key}><Link href={item.href} className="underline">{item.accountName}: {item.title}</Link> <span className="text-xs text-[var(--muted-foreground)]">still open</span></li>
            ))}
            {a.attention.blocked.map((e, i) => (
              <li key={`${e.ref.subjectId}-${i}`} className="text-[var(--muted-foreground)]">Blocked {time(e.at)}{e.accountName ? ` at ${e.accountName}` : ''}: {e.line}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="What the agents are handling" hint={`${a.agents.queued.length} queued, ${a.agents.running.length} running, ${a.agents.succeeded.length} finished today, ${a.agents.failed.length} failed today.`} testId="activity-agents">
        {[...a.agents.running, ...a.agents.queued, ...a.agents.failed, ...a.agents.succeeded].length ? (
          <ul className="space-y-1">
            {[...a.agents.running, ...a.agents.queued, ...a.agents.failed, ...a.agents.succeeded].map((t) => (
              <li key={t.id} data-testid="activity-agent-task" data-status={t.status}>
                <span className="font-medium">{t.kind.replace(/_/g, ' ')}</span> <span className="text-xs text-[var(--muted-foreground)]">{t.status}{t.lastError ? `: ${t.lastError.slice(0, 160)}` : ''}</span>
                {t.request ? <q className="ml-1 text-xs text-[var(--muted-foreground)]">{t.request.slice(0, 120)}</q> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="italic text-[var(--muted-foreground)]">No agent tasks.</p>
        )}
      </Section>

      <Section title="The day, newest first" testId="activity-events">
        {a.events.length ? (
          <ul className="space-y-1">
            {a.events.map((e, i) => (
              <li key={`${e.ref.kind}-${e.ref.subjectId}-${i}`} className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-xs text-[var(--muted-foreground)]">{time(e.at)}</span>
                <span>{e.line}</span>
                <span className="text-xs text-[var(--muted-foreground)]">{e.basis === 'provider' ? 'provider-proven' : 'self-reported'}{e.accountName ? ` · ${e.accountName}` : ''}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="italic text-[var(--muted-foreground)]">Nothing yet.</p>
        )}
      </Section>
    </div>
  );
}
