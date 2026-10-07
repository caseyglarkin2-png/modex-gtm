'use client';
/**
 * One source card (research aperture). Provenance first: publisher, date and age, the headline as the link, the
 * page's own words (a search summary is labelled, never quoted), who made the claim. Then the claim on its two
 * axes: VERIFIED AT SOURCE (or not) and ELIGIBLE AS OUTREACH EVIDENCE (or not), with the factual reason. GAP's
 * "why found" themes come last and are advisory only: nothing is hidden on them.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ageLabel, claimLine, OUTREACH_LABEL, VERIFICATION_LABEL, type AccountSource, type OutreachState, type VerificationState } from '@/lib/gap/sources/source-copy';
import { refreshNow } from '@/components/gap/refresh-now';

const VERIFICATION_TONE: Record<VerificationState, string> = {
  VERIFIED_AT_SOURCE: 'border-emerald-600/50 text-emerald-700 dark:text-emerald-400',
  VERIFYING: 'border-[var(--border)] text-[var(--muted-foreground)]',
  UNCHECKED: 'border-[var(--border)] text-[var(--muted-foreground)]',
  COULD_NOT_VERIFY: 'border-amber-500/50 text-amber-700 dark:text-amber-400',
  CONTRADICTED: 'border-red-600/50 text-red-700 dark:text-red-400',
};
const OUTREACH_TONE: Record<OutreachState, string> = {
  ELIGIBLE: 'border-emerald-600/50 text-emerald-700 dark:text-emerald-400',
  NOT_ELIGIBLE: 'border-[var(--border)] text-[var(--muted-foreground)]',
  NOT_EVALUATED: 'border-[var(--border)] text-[var(--muted-foreground)]',
  NEEDS_HUMAN_JUDGMENT: 'border-amber-500/50 text-amber-700 dark:text-amber-400',
};

const ORIGIN: Record<AccountSource['origin'], string> = { casey_shared: 'You shared', gap_discovered: 'GAP found (news)', gap_research: 'GAP found (research)', scout: 'Scout citation' };

const REFUSAL: Record<string, string> = {
  other_account: 'This link is filed under another account.',
  needs_account: 'Name the account in Signal intake first.',
  account_not_found: 'Account not found.',
  bad_url: 'This link cannot be followed.',
};

export function SourceCard({ s, accountName, compact = false, researchHref }: { s: AccountSource; accountName: string; compact?: boolean; researchHref?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  async function act(op: 'verify' | 'ignore' | 'wrong_account') {
    setBusy(op);
    setMsg(null);
    try {
      const res = await fetch('/api/gap/account-sources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountName, url: s.link, title: s.title, publishedAt: s.publishedAt, op }) });
      const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: string | null };
      if (!res.ok) setMsg(`${REFUSAL[body.error ?? ''] ?? 'Could not save that.'}${body.detail ? ` (${body.detail})` : ''}`);
      else {
        setMsg(
          op === 'verify'
            ? 'Queued for a check at the source. Checking only: nothing is alerted, drafted or sent. If it does not verify, it stays here with the reason.'
            : op === 'ignore'
              ? 'Set aside (not deleted).'
              : 'Unassigned; name the right account in Signal intake.',
        );
        refreshNow(router);
      }
    } catch {
      setMsg('Could not save that. Try again.');
    } finally {
      setBusy(null);
    }
  }
  const quote = s.excerpt && s.excerptKind === 'verbatim';
  const themes = s.whyFound.filter((w) => w !== 'other');
  const btn = 'rounded-md border border-[var(--border)] px-2 py-1 hover:bg-[var(--muted)] disabled:opacity-50';
  const max = compact ? 240 : 1200;
  return (
    <li data-testid="source-card" data-verification={s.verification} data-outreach={s.outreach} className="min-w-0 space-y-1 border-b border-[var(--border)] py-2 text-sm last:border-0">
      <p className="text-xs text-[var(--muted-foreground)]" data-testid="source-provenance">
        <span className="font-semibold text-[var(--foreground)]">{s.publisher || 'publisher not recorded'}</span> · {ageLabel(s.publishedAt, s.ageDays)}
        {s.publishedAt && !s.freshTrigger ? (
          <span data-testid="source-not-fresh" className="ml-1 rounded border border-[var(--border)] px-1 text-[10px] font-semibold uppercase">
            Not a fresh trigger
          </span>
        ) : null}
      </p>
      <a href={s.link} target="_blank" rel="noopener noreferrer" className="block break-words font-medium underline decoration-dotted underline-offset-2 hover:decoration-solid" data-testid="source-open">
        {s.title || untitled(s.link, s.publisher)}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      {s.excerpt && s.excerptKind !== 'headline' ? (
        quote ? (
          <p className={`break-words text-xs ${compact ? 'line-clamp-2' : ''}`} data-testid="source-excerpt">
            {quoteMarks(clip(s.excerpt, max))}
            {s.excerpt.length > max ? ' (continues at the source)' : ''}
          </p>
        ) : (
          <p className={`break-words text-xs text-[var(--muted-foreground)] ${compact ? 'line-clamp-2' : ''}`} data-testid="source-excerpt">
            {s.excerptKind === 'search_summary' ? 'Search summary, not a quote: ' : s.excerptKind === 'typed' ? 'Your note: ' : ''}
            {s.excerpt}
          </p>
        )
      ) : null}
      {s.attribution ? (
        <p className="text-xs" data-testid="source-attribution">
          Claim made by {s.attribution} (third party), not {accountName}.
        </p>
      ) : null}
      {s.alsoOnPage?.length ? (
        <details className="text-xs" data-testid="source-also">
          <summary className="cursor-pointer text-[var(--muted-foreground)]">
            {s.alsoOnPage.length} other {s.alsoOnPage.length === 1 ? 'claim' : 'claims'} on this page
          </summary>
          <ul className="mt-1 space-y-1">
            {s.alsoOnPage.map((a) => (
              <li key={a.excerpt} className="break-words">
                {quoteMarks(clip(a.excerpt, 240))}
                {a.attribution ? ` Claim made by ${a.attribution} (third party), not ${accountName}.` : ''} <span className="font-semibold">{claimLine(a)}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <p className="flex flex-wrap items-center gap-1.5 text-xs">
        <span data-testid="source-verification" className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${VERIFICATION_TONE[s.verification]}`}>
          {VERIFICATION_LABEL[s.verification]}
        </span>
        <span data-testid="source-outreach" className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${OUTREACH_TONE[s.outreach]}`}>
          {OUTREACH_LABEL[s.outreach]}
        </span>
        {s.reason ? <span data-testid="source-reason">{s.reason}</span> : null}
      </p>
      {compact ? null : (
        <p className="text-[11px] text-[var(--muted-foreground)]" data-testid="source-why">
          {ORIGIN[s.origin]}
          {themes.length ? ` · themes (advisory): ${themes.join(', ')}` : ''}
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-1 text-xs">
        {compact ? null : (
          <a href={s.link} target="_blank" rel="noopener noreferrer" className={btn}>
            Open source<span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        {s.verification === 'UNCHECKED' || s.verification === 'COULD_NOT_VERIFY' ? (
          <button type="button" disabled={!!busy} onClick={() => act('verify')} className={btn} data-testid="source-verify">
            {busy === 'verify' ? 'Queuing' : 'Verify claim'}
          </button>
        ) : null}
        {s.outreach === 'ELIGIBLE' ? (
          // The existing audited evidence workflow: USE in the Research lane links it to a thesis, never approves.
          <a href="/gap?lane=research" className={btn} data-testid="source-use">
            Use as outreach evidence
          </a>
        ) : null}
        {compact || !researchHref ? null : (
          <a href={researchHref} className={btn} data-testid="source-research-more">
            Research more
          </a>
        )}
        <button type="button" disabled={!!busy} onClick={() => act('ignore')} className={btn} data-testid="source-ignore">
          Ignore
        </button>
        <button type="button" disabled={!!busy} onClick={() => act('wrong_account')} className={btn} data-testid="source-wrong-account">
          Wrong account
        </button>
      </div>
      <p className="text-xs empty:hidden" role="status" data-testid="source-msg">
        {msg ?? ''}
      </p>
    </li>
  );
}

/** The page's words in quotation marks, once: a sentence that is itself a quotation keeps its own marks. */
function quoteMarks(text: string): string {
  return /^["\u201c\u2018']/.test(text) ? text : `\u201c${text}\u201d`;
}

/** Cut at a word boundary (an ellipsis never sits inside a quotation). */
function clip(text: string, n: number): string {
  if (text.length <= n) return text;
  const cut = text.slice(0, n);
  const sp = cut.lastIndexOf(' ');
  return cut.slice(0, sp > n * 0.6 ? sp : n).replace(/[\s,;:]+$/, '');
}

/** A source with no headline reads as its publisher and the tail of its path, never a 300-character URL. */
function untitled(link: string, publisher: string): string {
  try {
    const tail = new URL(link).pathname.split('/').filter(Boolean).pop() ?? '';
    const words = decodeURIComponent(tail).replace(/\.[a-z]{2,4}$/i, '').replace(/[-_]+/g, ' ').trim();
    return words && words.length <= 90 && words.includes(' ') ? `${publisher}: ${words}` : `${publisher} (untitled page)`;
  } catch {
    return `${publisher} (untitled page)`;
  }
}
