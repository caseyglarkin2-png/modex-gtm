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
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PeopleStack, StackRow } from '@/lib/gap/people/stack';
import { SET_ASIDE_LABEL } from '@/lib/gap/people/stack';
import type { PursuitState } from '@/lib/gap/pursuit/state';
import { EmploymentControl } from './employment-control';

/** A set-aside person, serializable (the resolver's exclusion carries regexes and reads that never cross to the client). */
export interface SetAsidePerson {
  key: string;
  name: string;
  title: string | null;
  code: string;
  reason: string;
}

export interface PeopleStackViewProps {
  accountName: string;
  stack: PeopleStack;
  state: PursuitState;
  /** The hypothesis the first touch runs on (the action pack); null when no grounded angle exists yet. */
  hypothesisId: string | null;
  /** The set-aside people with their reasons (the resolver's own list), for the expanded view. */
  excluded: SetAsidePerson[];
  /** UX-04: NEXT already carries the one primary control for the chosen person, so the row shows no second one. */
  primaryInNext?: boolean;
}

type Busy = { key: string; step: 'adding' | 'choosing' } | null;

const BTN = 'inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-medium';
const PRIMARY = `${BTN} bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-60`;
const OUTLINE = `${BTN} border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-60`;
const TEXT = 'inline-flex min-h-9 items-center text-xs underline text-[var(--muted-foreground)]';

export function PeopleStackView({ accountName, stack, state, hypothesisId, excluded, primaryInNext = false }: PeopleStackViewProps) {
  const router = useRouter();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [note, setNote] = useState<{ kind: 'status' | 'alert'; text: string } | null>(null);
  const toggle = (key: string) => setOpen((prev) => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  // After a choice the chosen row re-renders at the top and the Choose button unmounts: focus follows the person
  // (WCAG 2.4.3), never falls to the page body.
  const justChose = useRef<string | null>(null);
  useEffect(() => {
    const key = justChose.current;
    if (!key) return;
    const row = stack.rows.find((r) => r.chosen && r.key === key);
    if (!row) return;
    justChose.current = null;
    document.getElementById(`row-${key}`)?.focus();
  }, [stack]);

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
      justChose.current = row.key;
      router.refresh();
    } catch (e) {
      setNote({ kind: 'alert', text: e instanceof Error ? e.message : 'network error' });
    } finally {
      setBusy(null);
    }
  }

  const chosenRow = stack.rows.find((r) => r.chosen) ?? null;
  const rows = showAll ? [...stack.rows, ...stack.more] : stack.rows;
  // A relationship-led account: the person you met or the introducer leads, and they are not an owner-resolution row.
  const lead = state.person && /^(relationship|intro):/.test(state.person.key) ? state.person : null;
  // Under a hold or a deal no ordinal and no "choose who": the list is the people on record, not a cold-touch choice.
  const choosing = state.chooseAllowed;
  const callAllowed = state.state !== 'opted_out' && state.state !== 'in_deal' && state.state !== 'held' && state.state !== 'research';
  // Under research (no angle yet) choosing is allowed but quiet: an outline control that says what it is for.
  const quietChoose = state.state === 'research';

  return (
    <section className="space-y-2" data-testid="people-stack" aria-labelledby="people-stack-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="people-stack-heading" className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {choosing
            ? `People${stack.hidden ? ` (${stack.rows.length} of ${stack.rows.length + stack.hidden} eligible for a first touch)` : ' (eligible for a first touch)'}`
            : `People on record${stack.hidden ? ` (${stack.rows.length} of ${stack.rows.length + stack.hidden})` : ''}${state.state === 'in_deal' ? ': in a deal, work it from the deal' : ''}`}
        </h2>
        {stack.chooseLabel && choosing ? <p className="text-xs font-medium" data-testid="people-stack-choose-label">{stack.chooseLabel}: GAP does not pick.</p> : null}
        {!choosing ? <p className="text-xs text-[var(--muted-foreground)]" data-testid="people-stack-on-record">On record; no cold touch right now (see Next).</p> : null}
      </div>
      {stack.tieLine && choosing ? (
        <p className="text-xs text-[var(--muted-foreground)]" data-testid="people-stack-tie">
          {stack.tieLine}
        </p>
      ) : null}
      {lead ? (
        <div className="rounded-md border border-[var(--primary)] bg-[var(--muted)]/30 p-3" data-testid="people-stack-lead">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="font-medium">
              {lead.name}
              {lead.title ? <span className="font-normal text-[var(--muted-foreground)]">, {lead.title}</span> : null}
            </p>
            <span className="rounded-sm border border-[var(--border)] px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Relationship route</span>
          </div>
          <p className="mt-0.5 text-sm">{state.stateLine}. {state.unlock ?? ''}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Link href={`/gap/capture?account=${encodeURIComponent(accountName)}`} className={PRIMARY} data-testid="people-stack-lead-log">
              Log the touch
            </Link>
          </div>
        </div>
      ) : null}
      {stack.chosenMissing || state.chosenMissing ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs" role="status" data-testid="people-stack-chosen-missing">
          {stack.chosenMissing ?? state.chosenMissing}
        </p>
      ) : null}

      {/* An unordered list with the role restated: the order is said in words (ordinals or the tie line), never implied by the list. */}
      <ul role="list" className="space-y-2" data-testid="people-stack-rows">
        {rows.map((row) => (
          <li key={row.key} className={`rounded-md border p-3 ${row.chosen ? 'border-[var(--primary)] bg-[var(--muted)]/30' : 'border-[var(--border)]'}`} data-testid="people-stack-row" data-key={row.key} data-chosen={row.chosen ? 'true' : 'false'} data-slot={row.slot}>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {row.ordinal !== null && choosing ? <span className="text-xs font-semibold tabular-nums text-[var(--muted-foreground)]" data-testid="people-stack-ordinal">{row.ordinal}.</span> : null}
              <p id={`row-${row.key}`} tabIndex={-1} className="font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">
                {row.name}
                {row.title ? <span className="font-normal text-[var(--muted-foreground)]">, {row.title}</span> : null}
              </p>
              <span className="rounded-sm border border-[var(--border)] px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">{row.slot}</span>
              {row.badge ? <span className="rounded-sm border border-[var(--primary)] px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]" data-testid="people-stack-badge">{row.badge}</span> : null}
              {row.chosen ? <span className="text-xs font-medium text-[var(--primary)]" data-testid="people-stack-chosen">Chosen{row.chosenBy ? ` by ${row.chosenBy}` : ''}</span> : null}
            </div>
            <p id={`reason-${row.key}`} className="mt-0.5 text-sm" data-testid="people-stack-reason">{row.reason}</p>
            {row.currentness ? (
              <p className={`mt-0.5 text-xs ${/conflict|changed|in question|left|separate|divested/i.test(row.currentness) ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`} data-testid="people-stack-currentness">
                {row.currentness}
              </p>
            ) : null}
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{row.reachability}</p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {row.chosen && !state.coldTouchAllowed ? (
                <>
                  <span className="text-xs text-amber-700 dark:text-amber-400" data-testid="people-stack-held">
                    {state.state === 'in_motion' ? 'First touch sent; waiting.' : 'No cold touch right now (see Next).'}
                  </span>
                  {row.personaId !== null && callAllowed ? (
                    <Link href={`/gap/call/${row.personaId}`} className={OUTLINE} data-testid="people-stack-call">
                      Call prep
                    </Link>
                  ) : null}
                  <Link href={`/gap/capture?account=${encodeURIComponent(accountName)}`} className={OUTLINE} data-testid="people-stack-log">
                    Log a touch
                  </Link>
                </>
              ) : row.chosen ? (
                <>
                  {hypothesisId && row.personaId !== null ? (
                    primaryInNext ? null : (
                      <Link href={`/gap/preview/${hypothesisId}?personaId=${row.personaId}`} className={PRIMARY} data-testid="people-stack-prepare">
                        Prepare email
                      </Link>
                    )
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
              ) : row.coldEligible && state.chooseAllowed ? (
                <button type="button" className={chosenRow || quietChoose ? OUTLINE : PRIMARY} disabled={busy !== null} onClick={() => void choose(row)} data-testid="people-stack-choose" aria-describedby={`reason-${row.key}`}>
                  {busy?.key === row.key
                    ? busy.step === 'adding' ? 'Adding to GAP...' : 'Choosing...'
                    : chosenRow
                      ? `Make ${row.name.split(' ')[0]} first instead`
                      : `Choose ${row.name.split(' ')[0]}${row.personaId === null ? ' (adds them to GAP)' : ''}${quietChoose ? ' for when an angle exists' : ''}`}
                </button>
              ) : row.coldEligible ? (
                <span className="text-xs text-[var(--muted-foreground)]" data-testid="people-stack-held">No cold touch right now (see Next).</span>
              ) : (
                <span className="text-xs text-[var(--muted-foreground)]" data-testid="people-stack-slot-only">Not a cold first touch: unlocks by a meeting, a referral or your explicit choice.</span>
              )}
              <button type="button" className={TEXT} aria-expanded={open.has(row.key)} aria-controls={`why-${row.key}`} aria-label={open.has(row.key) ? `Hide why ${row.name}` : `Why ${row.name}?`} onClick={() => toggle(row.key)} data-testid="people-stack-why">
                {open.has(row.key) ? 'Hide why' : 'Why this person?'}
              </button>
            </div>
            <div id={`why-${row.key}`} hidden={!open.has(row.key)} className="mt-2 space-y-1 border-t border-[var(--border)] pt-2 text-xs text-[var(--muted-foreground)]">
              {open.has(row.key) ? (
                <>
                  <ul className="space-y-0.5" data-testid="people-stack-why-list">
                    {row.why.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                  {row.personaId !== null ? (
                    <EmploymentControl personaId={row.personaId} name={row.name} title={row.title} accountName={accountName} compact onDone={() => router.refresh()} />
                  ) : row.hubspotContactId ? (
                    <EmploymentControl hubspotContactId={row.hubspotContactId} name={row.name} title={row.title} accountName={accountName} compact onDone={() => router.refresh()} />
                  ) : null}
                </>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {!showAll && stack.setAside.line ? (
        <p className="text-xs text-[var(--muted-foreground)]" data-testid="people-stack-set-aside-line">{stack.setAside.line}</p>
      ) : null}

      {/* One always-mounted status region (its text changes, so screen readers announce it); an alert only when something refused. */}
      <p role="status" aria-live="polite" className="text-xs" data-testid="people-stack-note">
        {note?.kind === 'status' ? note.text : ''}
      </p>
      {note?.kind === 'alert' ? (
        <p role="alert" className="text-xs text-red-700 dark:text-red-400" data-testid="people-stack-alert">
          {note.text}
        </p>
      ) : null}

      {stack.slots.length ? (
        <ul className="space-y-1 text-xs" data-testid="people-stack-slots" aria-label="Also on record">
          {stack.slots.map((row) => (
            <li key={row.key} className="flex flex-wrap items-baseline gap-x-2" data-testid="people-stack-slot" data-slot={row.slot}>
              <span className="rounded-sm border border-[var(--border)] px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">{row.slot}</span>
              <span>
                <span className="font-medium">{row.name}</span>
                {row.title ? <span className="text-[var(--muted-foreground)]">, {row.title}</span> : null}
              </span>
              <span className="text-[var(--muted-foreground)]">(not a cold first touch)</span>
              <button type="button" className={TEXT} aria-expanded={open.has(row.key)} aria-controls={`why-${row.key}`} aria-label={open.has(row.key) ? `Hide why ${row.name}` : `Why ${row.name}?`} onClick={() => toggle(row.key)} data-testid="people-stack-why">
                {open.has(row.key) ? 'Hide why' : 'Why?'}
              </button>
              <ul id={`why-${row.key}`} hidden={!open.has(row.key)} className="basis-full space-y-0.5 pl-2 text-[var(--muted-foreground)]" data-testid={open.has(row.key) ? 'people-stack-why-list' : undefined}>
                {[row.reason, ...row.why].map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
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
                  <li key={e.key} data-code={e.code}>
                    <span className="font-medium text-[var(--foreground)]">{e.name}</span>
                    {e.title ? `, ${e.title}` : ''}: {SET_ASIDE_LABEL[e.code] ?? e.code.replace(/_/g, ' ')}. {e.reason}
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
