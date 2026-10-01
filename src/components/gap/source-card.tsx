'use client';
/**
 * One source card (research aperture). Provenance first: publisher, date and age, the headline as the link, the
 * page's own words (a search summary is labelled, never quoted), who said it. Then the evidence status with the
 * factual reason. GAP's "why found" themes come last and are advisory only: nothing is hidden on them.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ageLabel, STATUS_LABEL, type AccountSource } from '@/lib/gap/sources/source-copy';
import { accountHref } from '@/lib/gap/account-intel/href';

const STATUS_TONE: Record<AccountSource['status'], string> = {
  VERIFIED_FOR_OUTREACH: 'border-emerald-600/50 text-emerald-700 dark:text-emerald-400',
  NOT_VERIFIED_FOR_OUTREACH: 'border-[var(--border)] text-[var(--muted-foreground)]',
  COULD_NOT_VERIFY: 'border-amber-500/50 text-amber-700 dark:text-amber-400',
};

const ORIGIN: Record<AccountSource['origin'], string> = { casey_shared: 'You shared', gap_discovered: 'GAP found (news)', gap_research: 'GAP found (research)' };

const REFUSAL: Record<string, string> = {
  other_account: 'This link is filed under another account.',
  needs_account: 'Name the account in Signal intake first.',
  account_not_found: 'Account not found.',
  bad_url: 'This link cannot be followed.',
};

export function SourceCard({ s, accountName, compact = false }: { s: AccountSource; accountName: string; compact?: boolean }) {
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
        setMsg(op === 'verify' ? 'Queued for the evidence check. If it does not qualify, it stays here with the reason.' : op === 'ignore' ? 'Set aside (not deleted).' : 'Unassigned; name the right account in Signal intake.');
        router.refresh();
      }
    } catch {
      setMsg('Could not save that. Try again.');
    } finally {
      setBusy(null);
    }
  }
  const quote = s.excerpt && s.excerptKind === 'verbatim';
  return (
    <li data-testid="source-card" data-status={s.status} className="min-w-0 space-y-1 border-b border-[var(--border)] py-2 text-sm last:border-0">
      <p className="text-xs text-[var(--muted-foreground)]" data-testid="source-provenance">
        <span className="font-semibold text-[var(--foreground)]">{s.publisher || 'unknown publisher'}</span> · {ageLabel(s.publishedAt, s.ageDays)}
        {s.publishedAt && !s.freshTrigger ? (
          <span data-testid="source-not-fresh" className="ml-1 rounded border border-[var(--border)] px-1 text-[10px] font-semibold uppercase">
            Not a fresh trigger
          </span>
        ) : null}
      </p>
      <a href={s.link} target="_blank" rel="noopener noreferrer" className="block break-words font-medium underline decoration-dotted underline-offset-2 hover:decoration-solid" data-testid="source-open">
        {s.title || s.link}
      </a>
      {s.excerpt && s.excerptKind !== 'headline' ? (
        quote ? (
          <p className="break-words text-xs" data-testid="source-excerpt">
            &ldquo;{compact && s.excerpt.length > 240 ? `${s.excerpt.slice(0, 240)}…` : s.excerpt}&rdquo;
          </p>
        ) : (
          <p className="break-words text-xs text-[var(--muted-foreground)]" data-testid="source-excerpt">
            {s.excerptKind === 'search_summary' ? 'Search summary, not a quote: ' : s.excerptKind === 'typed' ? 'Your note: ' : ''}
            {s.excerpt}
          </p>
        )
      ) : null}
      {s.attribution ? (
        <p className="text-xs" data-testid="source-attribution">
          Said by {s.attribution} (third party), not {accountName}.
        </p>
      ) : null}
      {s.alsoOnPage?.length ? (
        <details className="text-xs" data-testid="source-also">
          <summary className="cursor-pointer text-[var(--muted-foreground)]">
            {s.alsoOnPage.length} other {s.alsoOnPage.length === 1 ? 'statement' : 'statements'} on this page
          </summary>
          <ul className="mt-1 space-y-1">
            {s.alsoOnPage.map((a) => (
              <li key={a.excerpt} className="break-words">
                &ldquo;{a.excerpt.length > 240 ? `${a.excerpt.slice(0, 240)}…` : a.excerpt}&rdquo;
                {a.attribution ? ` Said by ${a.attribution} (third party), not ${accountName}.` : ''} <span className="font-semibold">{STATUS_LABEL[a.status]}</span>
                {a.reason ? `: ${a.reason}` : ''}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <p className="flex flex-wrap items-center gap-1.5 text-xs">
        <span data-testid="source-status" className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_TONE[s.status]}`}>
          {STATUS_LABEL[s.status]}
        </span>
        {s.reason ? <span data-testid="source-reason">{s.reason}</span> : null}
      </p>
      <p className="text-[11px] text-[var(--muted-foreground)]" data-testid="source-why">
        {ORIGIN[s.origin]} · themes: {s.whyFound.join(', ')}
      </p>
      <div className="flex flex-wrap gap-2 pt-1 text-xs">
        <a href={s.link} target="_blank" rel="noopener noreferrer" className="rounded-md border border-[var(--border)] px-2 py-1 hover:bg-[var(--muted)]">
          Open source
        </a>
        {s.status !== 'VERIFIED_FOR_OUTREACH' ? (
          <button type="button" disabled={!!busy} onClick={() => act('verify')} className="rounded-md border border-[var(--border)] px-2 py-1 hover:bg-[var(--muted)] disabled:opacity-50" data-testid="source-verify">
            {busy === 'verify' ? 'Queuing…' : 'Verify as evidence'}
          </button>
        ) : null}
        <a href={`${accountHref(accountName)}#research-plan`} className="rounded-md border border-[var(--border)] px-2 py-1 hover:bg-[var(--muted)]" data-testid="source-research-more">
          Research more
        </a>
        <button type="button" disabled={!!busy} onClick={() => act('ignore')} className="rounded-md border border-[var(--border)] px-2 py-1 hover:bg-[var(--muted)] disabled:opacity-50" data-testid="source-ignore">
          Ignore
        </button>
        <button type="button" disabled={!!busy} onClick={() => act('wrong_account')} className="rounded-md border border-[var(--border)] px-2 py-1 hover:bg-[var(--muted)] disabled:opacity-50" data-testid="source-wrong-account">
          Wrong account
        </button>
      </div>
      {msg ? (
        <p className="text-xs" role="status" data-testid="source-msg">
          {msg}
        </p>
      ) : null}
    </li>
  );
}
