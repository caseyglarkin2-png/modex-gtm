/**
 * BRIEF (V2): the meeting brief. 3-5 seller lines per section, VIEW DETAILS one click deeper (SOURCES).
 * Server-renderable.
 */
import Link from 'next/link';
import type { BriefSection } from '@/lib/gap/context/brief';

const TAG_TONE: Record<string, string> = {
  'Buyer said': 'border-emerald-600 text-emerald-700 dark:text-emerald-400',
  Checked: 'border-sky-600 text-sky-700 dark:text-sky-400',
  'Our read': 'border-[var(--border)] text-[var(--muted-foreground)]',
  Unknown: 'border-[var(--border)] text-[var(--muted-foreground)]',
  Contradicted: 'border-red-600 text-red-700 dark:text-red-400',
};

export function AccountBriefSections({ sections, sourcesHref, deep }: { sections: BriefSection[]; sourcesHref: string; deep: Partial<Record<string, { label: string; href: string }>> }) {
  return (
    <div className="space-y-4" data-testid="account-brief-v2">
      {sections.map((s) => (
        <section key={s.key} className="space-y-1.5 border-b border-[var(--border)] pb-3 last:border-0" data-testid={`brief-v2-${s.key}`}>
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{s.title}</h2>
          {s.lines.length ? (
            <ul className="space-y-1.5">
              {s.lines.map((l, i) => (
                <li key={`${s.key}-${i}`} className="space-y-0.5">
                  <div className="flex items-start gap-2">
                    <span className={`inline-block shrink-0 whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TAG_TONE[l.tag]}`}>{l.tag}</span>
                    <p className="min-w-0 break-words text-sm">{l.text}</p>
                  </div>
                  <p className="ml-1 text-xs text-[var(--muted-foreground)]">
                    {l.basis}
                    {l.cite ? ` · ${l.cite}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
          {s.notes.length ? (
            <ul className={`space-y-1 text-sm ${s.key === 'private' ? 'text-amber-800 dark:text-amber-300' : ''}`}>
              {s.notes.map((n, i) => (
                <li key={`${s.key}-n-${i}`} className="break-words">
                  {n}
                </li>
              ))}
            </ul>
          ) : null}
          {s.unknowns.length ? <p className="text-xs text-amber-700 dark:text-amber-400">Unknown: {s.unknowns.join('; ')}</p> : null}
          <p className="flex flex-wrap gap-x-3 text-xs">
            {s.detailsAnchor ? (
              <Link className="underline" href={`${sourcesHref}#${s.detailsAnchor}`}>
                View details{s.more ? ` (${s.more} more)` : ''}
              </Link>
            ) : s.more ? (
              <span className="text-[var(--muted-foreground)]">{s.more} more</span>
            ) : null}
            {deep[s.key] ? (
              <Link className="underline" href={deep[s.key]!.href}>
                {deep[s.key]!.label}
              </Link>
            ) : null}
          </p>
        </section>
      ))}
    </div>
  );
}
