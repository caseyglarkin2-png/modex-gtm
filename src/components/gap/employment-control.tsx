'use client';

/**
 * CONTACT CURRENTNESS, the seller's word (owner resolution, 2026-10-05). Casey discovered a departure by hand;
 * this is the lightweight way to tell GAP: THIS PERSON LEFT (with the new company, title, a source URL and a note),
 * or the role is wrong, or confirm them current. A human-confirmed correction: audited, immediate for every gate,
 * never do-not-contact, never HubSpot. VERIFY CURRENT ROLE runs one bounded public check and answers five cases in
 * seller words: still in the stored role; still here but the role changed (to a named title, or to one not yet
 * established: verify the remit); left; sources disagree; nothing source-backed. A HubSpot-only person (no GAP
 * record) mounts with `hubspotContactId` + `title` and verifies through /api/gap/people/verify-role; the corrections
 * need a persona. Voice: no em dashes.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { refreshNow } from '@/components/gap/refresh-now';

type Verification = { verdict?: string; company?: string | null; title?: string | null; priorTitle?: string | null; sourceUrl?: string | null; summary?: string | null };
type RoleReadLike = { state?: string; effectiveTitle?: string | null; usableForRanking?: boolean };

/** The remit word in a stored title ("transportation" in "Sr Director - West Transportation Command Center"), for the sentence. */
const REMIT_WORDS = ['transportation', 'logistics', 'supply chain', 'distribution', 'fleet', 'warehouse', 'network', 'yards', 'terminal', 'operations'];
export function remitWord(title: string | null | undefined): string | null {
  const t = (title ?? '').toLowerCase();
  return REMIT_WORDS.find((w) => t.includes(w === 'yards' ? 'yard' : w)) ?? null;
}

const host = (url: string | null | undefined): string => {
  try {
    return new URL(String(url ?? '')).hostname.replace(/^www\./, '');
  } catch {
    return 'a source';
  }
};

/** The five outcomes, in seller words. Exported for the panel's own copy. */
export function verifyOutcomeText(v: Verification | undefined, input: { name: string; accountName: string; storedTitle: string | null | undefined }): string {
  const { name, accountName, storedTitle } = input;
  const verdict = v?.verdict ?? 'unknown';
  if (verdict === 'same_role') return `Verified from ${host(v?.sourceUrl)}: still ${v?.title ?? storedTitle ?? 'in the stored role'} at ${accountName}.`;
  if (verdict === 'different_role') {
    if (v?.title) return `Still at ${accountName}; the role changed to "${v.title}"${v.priorTitle ?? storedTitle ? ` (from "${v.priorTitle ?? storedTitle}")` : ''} per ${host(v.sourceUrl)}. Usable for ranking under the new title.`;
    const remit = remitWord(storedTitle);
    return `Still at ${accountName}, but the stored ${remit ? `${remit} ` : ''}role changed. Verify current remit before using.`;
  }
  if (verdict === 'left') return `Verified from ${host(v?.sourceUrl)}: now at ${v?.company ?? 'another employer'}${v?.title ? `, ${v.title}` : ''}. Not eligible for ${accountName} outreach; not do-not-contact.`;
  if (verdict === 'conflict') return `Sources disagree about ${name}'s current role at ${accountName}${v?.summary ? ` (${v.summary})` : ''}. Verify before using.`;
  return `No source-backed answer${v?.summary ? ` (${v.summary})` : ''}. Nothing was asserted.`;
}

export function EmploymentControl({ personaId, hubspotContactId, name, accountName, title, state, compact = false, onDone }: { personaId?: number; /** A HubSpot-only person: verify only, through /api/gap/people/verify-role. */ hubspotContactId?: string; name: string; accountName: string; /** The stored title, for the sentence and the HubSpot-only body. */ title?: string | null; state?: { label: string; why: string } | null; compact?: boolean; /** After a recorded correction or verification (the owner panel refetches its resolution). */ onDone?: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<null | 'left' | 'role_changed'>(null);
  const [company, setCompany] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<{ ok: boolean; text: string } | null>(null);
  const hubspotOnly = personaId == null && !!hubspotContactId;

  async function post(path: string, body: unknown, done: (b: Record<string, unknown>) => string) {
    setBusy(path);
    setOutcome(null);
    try {
      const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const b = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setOutcome({ ok: false, text: `Not recorded: ${String(b.error ?? res.status).replace(/_/g, ' ')}.` });
        return;
      }
      setOutcome({ ok: true, text: done(b) });
      setMode(null);
      refreshNow(router);
      onDone?.();
    } catch (e) {
      setOutcome({ ok: false, text: e instanceof Error ? e.message : 'network error' });
    } finally {
      setBusy(null);
    }
  }

  const correct = (status: 'left' | 'role_changed' | 'current') =>
    post(
      hubspotOnly ? '/api/gap/people/verify-role' : `/api/gap/personas/${personaId}/employment`,
      hubspotOnly
        ? { hubspotContactId, accountName, name, title: title ?? null, correction: { status, newCompany: company.trim() || null, newTitle: newTitle.trim() || null, sourceUrl: url.trim() || null, note: note.trim() || null } }
        : { status, newCompany: company.trim() || null, newTitle: newTitle.trim() || null, sourceUrl: url.trim() || null, note: note.trim() || null },
      (b) => {
      const read = b.read as { state?: string } | undefined;
      const role = b.role as RoleReadLike | undefined;
      if (status === 'left') return `Recorded: ${name} left ${accountName}${company.trim() ? ` (now ${company.trim()})` : ''}. Not eligible for ${accountName} outreach; not do-not-contact.`;
      if (status === 'role_changed') return newTitle.trim() ? `Recorded: ${name}'s role at ${accountName} is now "${newTitle.trim()}". Usable for ranking under the new title.` : `Recorded: ${name}'s stored role at ${accountName} is no longer theirs; the new title is not known. Verify current remit before using.`;
      return `Recorded. Employment now reads ${String(read?.state ?? 'current').replace(/_/g, ' ').toLowerCase()}${role?.state ? ` and the role reads ${String(role.state).replace(/^ROLE_/, '').replace(/_/g, ' ').toLowerCase()}` : ''}.`;
      },
    );
  const verify = () => {
    const path = hubspotOnly ? '/api/gap/people/verify-role' : `/api/gap/personas/${personaId}/employment/verify`;
    const body = hubspotOnly ? { hubspotContactId, accountName, name, title: title ?? null } : {};
    return post(path, body, (b) => verifyOutcomeText(b.verification as Verification | undefined, { name, accountName, storedTitle: title }));
  };

  return (
    <div className={compact ? 'mt-1 text-xs' : 'mt-2 space-y-1 text-xs'} data-testid="employment-control" data-persona={personaId} data-hubspot-contact={hubspotContactId}>
      {state && !compact ? (
        <p className="text-[var(--muted-foreground)]" data-testid="employment-state">
          Employment: {state.label}. {state.why}
        </p>
      ) : null}
      {mode === null ? (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`Check ${name}`}>
          <button type="button" className={chip} disabled={busy !== null} onClick={() => void verify()} data-testid="employment-verify" title="One source-backed public check of their current role. Nothing is asserted without a source.">
            {busy?.endsWith('verify') || busy?.endsWith('verify-role') ? 'Verifying...' : 'Verify role'}
          </button>
          <button type="button" className={chip} onClick={() => setMode('role_changed')} data-testid="employment-wrong-role" title="You know their role is different now. Records your word; never changes HubSpot.">
            Role is wrong
          </button>
          <button type="button" className={chip} onClick={() => setMode('left')} data-testid="employment-left" title="You know they no longer work here. Removes them from this account's outreach at once; never do-not-contact.">
            Left the company
          </button>
        </div>
      ) : (
        <div className="space-y-1 rounded-md border border-[var(--border)] p-2" data-testid="employment-form">
          <p className="font-medium">{mode === 'left' ? `${name} left ${accountName}.` : `${name}'s role is wrong.`} Add what you know (optional).</p>
          {mode === 'left' ? <input aria-label="New company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="New company" className="block w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1" /> : null}
          <input aria-label="New title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={mode === 'left' ? 'New title' : 'Correct title (leave blank if unknown)'} className="block w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1" />
          <input aria-label="Source URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Source URL (a profile, an announcement)" className="block w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1" />
          <input aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" className="block w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1" />
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={busy !== null} onClick={() => void correct(mode)} data-testid="employment-save">
              {busy ? 'Saving...' : mode === 'left' ? 'Record: left the company' : 'Record the correct role'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setMode(null)}>
              Cancel
            </Button>
          </div>
          <p className="text-[var(--muted-foreground)]">{mode === 'left' ? `This removes them from ${accountName} outreach at once.` : `This keeps them at ${accountName}; a blank title keeps them out of ranking until the remit is verified.`} It never marks them do not contact and never changes HubSpot.</p>
        </div>
      )}
      {outcome ? (
        <p role={outcome.ok ? 'status' : 'alert'} className={outcome.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-[var(--destructive)]'} data-testid="employment-outcome">
          {outcome.text}
        </p>
      ) : null}
    </div>
  );
}

/** A small secondary button: the three checks sit beside a name without reading as body links. */
const chip = 'rounded-md border border-[var(--border)] px-2 py-0.5 text-[11px] font-medium text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-60';
