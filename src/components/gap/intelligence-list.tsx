/**
 * THE INTELLIGENCE LIST (IW05): every retained item, newest first, each said as what it is. A server component with
 * no state: the truth label, the account (or the producer's hint, or "no account yet"), the title linked to its url
 * when there is one, the producer and the dates in words, the excerpt, the producer's own uncertainty on its own
 * line, the producer's read labelled as the producer's, the sources as links, the CRM ids as text, the disposition
 * when decided, the account page link. No decision buttons (decisions stay on Work), no Slack, no CRM, no outreach.
 * Imported text is rendered as text: React escapes it, nothing here interprets it.
 */
import Link from 'next/link';
import type { BrowseItem } from '@/lib/gap/signals/intelligence-browse';
import { TRUTH_TEXT } from '@/lib/gap/work/truth-text';
import { accountHref } from '@/lib/gap/account-intel/href';

/** "Oct 9, 2026" for a YYYY-MM-DD value (no zone shift) or for an instant on the seller's calendar. */
export function whenWords(v: string | null | undefined): string | null {
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }
  const t = new Date(v);
  if (Number.isNaN(t.getTime())) return null;
  const dateOnly = t.getUTCHours() === 0 && t.getUTCMinutes() === 0 && t.getUTCSeconds() === 0 && t.getUTCMilliseconds() === 0;
  return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: dateOnly ? 'UTC' : 'America/New_York' });
}

const TRUTH_TONE: Record<string, string> = {
  verified_fact: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  unverified_status: 'bg-sky-500/15 text-sky-800 dark:text-sky-300',
  historical_observation: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
  contradicted: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
};

/** "reported Oct 9, 2026 by Yards First Brief; event date Oct 8, 2026; imported Oct 9, 2026" (or the capture words for a non-import). */
export function datesLine(it: BrowseItem): string {
  const parts: string[] = [];
  if (it.reportedOn) parts.push(`reported ${whenWords(it.reportedOn)}${it.producerLabel ? ` by ${it.producerLabel}` : ''}`);
  else if (it.publishedAt) parts.push(`published ${whenWords(it.publishedAt)}`);
  if (it.eventDate) parts.push(`event date ${whenWords(it.eventDate)}`);
  parts.push(`${it.producer ? 'imported' : it.kind === 'trigger' ? 'seen' : 'captured'} ${whenWords(it.importedAt)}`);
  if (it.producerStatus) parts.push(`the producer marked it ${it.producerStatus}`);
  if (it.revisions > 0) parts.push(`revised ${it.revisions} time${it.revisions === 1 ? '' : 's'}`);
  return parts.join('; ');
}

const hostOf = (u: string): string => {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u;
  }
};

export function IntelligenceRow({ it }: { it: BrowseItem }) {
  const sourceWord = it.producerLabel ?? (it.kind === 'trigger' ? 'Pounce' : it.origin.replace(/_/g, ' '));
  return (
    <li data-testid="intel-row" data-key={it.key} className={`space-y-1.5 rounded-md border border-[var(--border)] p-3 ${it.archived ? 'opacity-75' : ''}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded px-2 py-0.5 font-semibold ${TRUTH_TONE[it.truth] ?? 'bg-[var(--muted)]'}`} data-testid="intel-truth">
          {TRUTH_TEXT[it.truth]}
        </span>
        <span className="font-semibold" data-testid="intel-account">
          {it.accountName ? (
            <Link href={accountHref(it.accountName)} className="underline decoration-dotted underline-offset-2 hover:decoration-solid">
              {it.accountName}
            </Link>
          ) : it.accountHint ? (
            `${it.accountHint} (the producer's hint)`
          ) : (
            'no account yet'
          )}
        </span>
        <span className="text-[var(--muted-foreground)]">{sourceWord}{it.recordKind ? ` · ${it.recordKind}` : ''}</span>
        {it.archived ? <span className="rounded bg-[var(--muted)] px-2 py-0.5 text-[var(--muted-foreground)]">archive</span> : null}
        {it.decided ? <span className="rounded bg-[var(--muted)] px-2 py-0.5 text-[var(--muted-foreground)]" data-testid="intel-decided">decided{it.feedback ? `: ${it.feedback.replace(/_/g, ' ')}` : ''}</span> : null}
      </div>
      <p className="break-words text-sm font-medium">
        {it.url ? (
          <a href={it.url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2 hover:decoration-solid">
            {it.title}
          </a>
        ) : (
          it.title
        )}
      </p>
      <p className="text-xs text-[var(--muted-foreground)]" data-testid="intel-dates">{datesLine(it)}</p>
      {it.excerpt ? <p className="break-words text-sm">{it.excerpt}</p> : null}
      {it.uncertainty ? <p className="break-words text-xs italic text-[var(--muted-foreground)]" data-testid="intel-uncertainty">Uncertainty: {it.uncertainty}</p> : null}
      {it.interpretation ? <p className="break-words text-xs text-[var(--muted-foreground)]" data-testid="intel-interpretation">The producer&apos;s read: {it.interpretation}</p> : null}
      {it.sources.length ? (
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <span className="text-[var(--muted-foreground)]">Sources:</span>
          {it.sources.map((s, i) =>
            s.url ? (
              <a key={`${s.url}-${i}`} href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2 hover:decoration-solid">
                {s.label ?? s.publisher ?? hostOf(s.url)}
              </a>
            ) : (
              <span key={`${s.publisher ?? s.label ?? 'source'}-${i}`}>{s.label ?? s.publisher ?? 'a source'}</span>
            ),
          )}
        </p>
      ) : null}
      {it.sourceRecordIds.length ? (
        <p className="text-xs text-[var(--muted-foreground)]" data-testid="intel-crm-ids">
          CRM records: {it.sourceRecordIds.map((r) => `${r.system} ${r.type ? `${r.type} ` : ''}${r.id}`).join(', ')}
        </p>
      ) : null}
      <p className="flex flex-wrap gap-x-3 text-xs text-[var(--muted-foreground)]">
        {it.categories.length ? <span>Themes: {it.categories.map((c) => c.replace(/_/g, ' ')).join(', ')}</span> : null}
        {it.suggestions > 0 ? <span>{it.suggestions} drafted suggestion{it.suggestions === 1 ? '' : 's'} in the archive, never sent</span> : null}
        {it.accountName ? (
          <Link href={accountHref(it.accountName)} className="underline decoration-dotted underline-offset-2 hover:decoration-solid">
            Account page
          </Link>
        ) : null}
      </p>
    </li>
  );
}

export function IntelligenceList({ items }: { items: BrowseItem[] }) {
  if (!items.length) return <p className="text-sm text-[var(--muted-foreground)]">Nothing retained matches these filters.</p>;
  return (
    <ul className="space-y-2" data-testid="intel-list">
      {items.map((it) => (
        <IntelligenceRow key={it.key} it={it} />
      ))}
    </ul>
  );
}
