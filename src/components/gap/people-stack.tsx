'use client';

/**
 * PEOPLE STACK (account-first UX, UX-03, 2026-10-05): the few people who matter at one account, with the action beside
 * the decision. Renders the pure stack (lib/gap/people/stack.ts) over the one owner-resolution read; never ranks.
 *
 *   - 3 to 5 rows by default; "Show N more on record" opens the rest and the set-aside people with their reasons
 *   - no ordinals on a tie, and the tie is said in words; a badge only when the resolver recommends
 *   - each row: name, title, slot, ONE distinguishing reason, currentness only when material, reachability, action
 *   - the chosen person carries the primary actions (Prepare email, Call prep, Log a touch); the others carry Choose
 *   - "Why this person?" opens every resolver reason (the evidence is disclosed, never deleted)
 *
 * Choosing records the account motion choice (POST /api/gap/accounts/motion, append-only, audited); a HubSpot-only
 * person is added to GAP first (POST /api/gap/people/import, the existing account-scoped import). Nothing here
 * drafts, sends, enrolls, writes HubSpot or spends Apollo; every send still runs its own gates. Voice: no em dashes.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PeopleStack, StackRow } from '@/lib/gap/people/stack';
import { SET_ASIDE_LABEL } from '@/lib/gap/people/stack';
import type { OwnerResolution } from '@/lib/gap/people/owner-resolution';
import type { PursuitState } from '@/lib/gap/pursuit/state';

export interface PeopleStackViewProps {
  accountName: string;
  stack: PeopleStack;
  state: PursuitState;
  /** The hypothesis the first touch runs on (the action pack); null when no grounded angle exists yet. */
  hypothesisId: string | null;
  /** The set-aside people with their reasons (the resolver's own list), for the expanded view. */
  excluded: OwnerResolution['excluded'];
}

type Busy = { key: string; step: 'adding' | 'choosing' } | null;

const BTN = 'inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-medium';
const PRIMARY = `${BTN} bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-60`;
const OUTLINE = `${BTN} border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-60`;
const TEXT = 'inline-flex min-h-9 items-center text-xs underline text-[var(--muted-foreground)]';

export function PeopleStackView({ accountName, stack, state, hypothesisId, excluded }: PeopleStackViewProps) {
  const router = useRouter();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [note, setNote] = useState<{ kind: 'status' | 'alert'; text: string } | null>(null);
  const toggle = (key: string) => setOpen((prev) => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });

  async function choose(row: StackRow) {
    setNote(null);
    try {
      let personaId = row.personaId;
      if (personaId === null && row.hubspotContactId) {
        setBusy({ key: row.key, step: 'adding' });
        const res = await fetch('/api/gap/people/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accountName, hubspotContactId: row.hubspotContactId }) });
        const body = (await res.json().catch(() => ({}))) as { ok?: boolean; personaId?: number; error?: string; detail?: string | null };
        if (!res.ok || !body.personaId) {
          setNote({ kind: 'alert', text: `Could not add ${row.name} to GAP (${body.error ?? res.status}${body.detail ? `: ${body.detail}` : ''}). Nothing changed.` });
          return;
        }
        personaId = body.personaId;
      }
      if (personaId === null) {
        setNote({ kind: 'alert', text: `${row.name} is not a GAP contact and has no HubSpot record to add from. Nothing changed.` });
        return;
      }
      setBusy({ key: row.key, step: 'choosing' });
      const res = await fetch('/api/gap/accounts/motion', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accountName, primaryPersonaId: personaId }) });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setNote({ kind: 'alert', text: `Could not make ${row.name} first (${body.error ?? res.status}). Nothing changed.` });
        return;
      }
      setNote({ kind: 'status', text: `${row.name} is first at ${accountName.replace(/\.$/, '')}. Nothing is sent by choosing; every send runs its own gates.` });
      router.refresh();
    } catch (e) {
      setNote({ kind: 'alert', text: e instanceof Error ? e.message : 'network error' });
    } finally {
      setBusy(null);
    }
  }

  const chosenRow = stack.rows.find((r) => r.chosen) ?? null;
  const rows = showAll ? [...stack.rows, ...stack.more] : stack.rows;

  return (
    <section className="space-y-2" data-testid="people-stack" aria-labelledby="people-stack-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="people-stack-heading" className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          People{stack.hidden ? ` (top ${stack.rows.length} of ${stack.rows.length + stack.hidden} on record)` : ''}
        </h2>
        {stack.chooseLabel ? <p className="text-xs font-medium" data-testid="people-stack-choose-label">{stack.chooseLabel}: GAP does not pick.</p> : null}
      </div>
      {stack.tieLine ? (
        <p className="text-xs text-[var(--muted-foreground)]" data-testid="people-stack-tie">
          {stack.tieLine}
        </p>
      ) : null}
      {stack.chosenMissing || state.chosenMissing ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs" role="status" data-testid="people-stack-chosen-missing">
          {stack.chosenMissing ?? state.chosenMissing}
        </p>
      ) : null}

      <ol className="space-y-2" data-testid="people-stack-rows">
        {rows.map((row) => (
          <li key={row.key} className={`rounded-md border p-3 ${row.chosen ? 'border-[var(--primary)] bg-[var(--muted)]/30' : 'border-[var(--border)]'}`} data-testid="people-stack-row" data-key={row.key} data-chosen={row.chosen ? 'true' : 'false'} data-slot={row.slot}>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {row.ordinal !== null ? <span className="text-xs font-semibold tabular-nums text-[var(--muted-foreground)]" data-testid="people-stack-ordinal">{row.ordinal}.</span> : null}
              <p className="font-medium">
                {row.name}
                {row.title ? <span className="font-normal text-[var(--muted-foreground)]">, {row.title}</span> : null}
              </p>
              <span className="rounded-sm border border-[var(--border)] px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">{row.slot}</span>
              {row.badge ? <span className="rounded-sm border border-[var(--primary)] px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]" data-testid="people-stack-badge">{row.badge}</span> : null}
              {row.chosen ? <span className="text-xs font-medium text-[var(--primary)]" data-testid="people-stack-chosen">Chosen{row.chosenBy ? ` by ${row.chosenBy}` : ''}</span> : null}
            </div>
            <p className="mt-0.5 text-sm" data-testid="people-stack-reason">{row.reason}</p>
            {row.currentness ? <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400" data-testid="people-stack-currentness">{row.currentness}</p> : null}
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{row.reachability}</p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {row.chosen ? (
                <>
                  {hypothesisId && row.personaId !== null ? (
                    <Link href={`/gap/preview/${hypothesisId}?personaId=${row.personaId}`} className={PRIMARY} data-testid="people-stack-prepare">
                      Prepare email
                    </Link>
                  ) : row.personaId === null && row.hubspotContactId ? (
                    <button type="button" className={PRIMARY} disabled={busy !== null} onClick={() => void choose(row)} data-testid="people-stack-add">
                      {busy?.key === row.key ? 'Adding...' : `Add ${row.name.split(' ')[0]} to GAP`}
                    </button>
                  ) : (
                    <span className="text-xs text-[var(--muted-foreground)]" data-testid="people-stack-no-angle">No verified angle to prepare a first touch on yet.</span>
                  )}
                  {row.personaId !== null ? (
                    <Link href={`/gap/call/${row.personaId}`} className={OUTLINE} data-testid="people-stack-call">
                      Call prep
                    </Link>
                  ) : null}
                  <Link href={`/gap/capture?account=${encodeURIComponent(accountName)}`} className={OUTLINE} data-testid="people-stack-log">
                    Log a touch
                  </Link>
                </>
              ) : row.coldEligible && state.coldTouchAllowed ? (
                <button type="button" className={chosenRow ? OUTLINE : PRIMARY} disabled={busy !== null} onClick={() => void choose(row)} data-testid="people-stack-choose" aria-describedby={`why-${row.key}`}>
                  {busy?.key === row.key ? (busy.step === 'adding' ? 'Adding to GAP...' : 'Choosing...') : chosenRow ? `Make ${row.name.split(' ')[0]} first instead` : `Choose ${row.name.split(' ')[0]}`}
                </button>
              ) : row.coldEligible ? (
                <span className="text-xs text-[var(--muted-foreground)]" data-testid="people-stack-held">{state.blocker ?? 'No cold touch right now.'}</span>
              ) : (
                <span className="text-xs text-[var(--muted-foreground)]" data-testid="people-stack-slot-only">Not a cold first touch: unlocks by a meeting, a referral or your explicit choice.</span>
              )}
              <button type="button" className={TEXT} aria-expanded={open.has(row.key)} aria-controls={`why-${row.key}`} onClick={() => toggle(row.key)} data-testid="people-stack-why">
                {open.has(row.key) ? 'Hide why' : 'Why this person?'}
              </button>
            </div>
            {open.has(row.key) ? (
              <ul id={`why-${row.key}`} className="mt-2 space-y-0.5 border-t border-[var(--border)] pt-2 text-xs text-[var(--muted-foreground)]" data-testid="people-stack-why-list">
                {row.why.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            ) : (
              <span id={`why-${row.key}`} className="sr-only">{row.reason}</span>
            )}
          </li>
        ))}
      </ol>

      {note ? (
        <p role={note.kind} className={`text-xs ${note.kind === 'alert' ? 'text-red-700 dark:text-red-400' : ''}`} data-testid="people-stack-note">
          {note.text}
        </p>
      ) : null}

      {stack.hidden || stack.setAside.count ? (
        <div className="space-y-1 text-xs">
          <button type="button" className={TEXT} aria-expanded={showAll} onClick={() => setShowAll((v) => !v)} data-testid="people-stack-show-all">
            {showAll ? 'Show fewer' : `${stack.showAllLabel ?? 'Show everyone on record'}${stack.setAside.count ? ` and ${stack.setAside.count} set aside` : ''}`}
          </button>
          {showAll && excluded.length ? (
            <div data-testid="people-stack-set-aside">
              <p className="font-semibold text-[var(--muted-foreground)]">Set aside ({excluded.length})</p>
              <ul className="mt-0.5 space-y-0.5 text-[var(--muted-foreground)]">
                {excluded.map((e) => (
                  <li key={e.candidate.key} data-code={e.code}>
                    <span className="font-medium text-[var(--foreground)]">{e.candidate.name}</span>
                    {e.candidate.title ? `, ${e.candidate.title}` : ''}: {SET_ASIDE_LABEL[e.code] ?? e.code.replace(/_/g, ' ')}. {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      <p className="text-[11px] text-[var(--muted-foreground)]">Choosing records your choice for this account only. Nothing is sent by choosing; every send runs its own gates.</p>
    </section>
  );
}
