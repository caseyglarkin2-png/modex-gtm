'use client';

/**
 * PEOPLE STACK (account-first UX, UX-03, 2026-10-05; compacted in UX-05, 2026-10-06): the few people who matter at one
 * account, with the action beside the decision. Renders the pure stack (lib/gap/people/stack.ts) over the one
 * owner-resolution read; never ranks.
 *
 *   - 3 to 5 rows by default; "Show N more on record" opens the rest and the set-aside people with their reasons
 *   - no ordinals on a tie, and the tie is said in words; a badge only when the resolver recommends
 *   - a CARD only for the chosen person (name, title, slot, reason, currentness, reachability, actions); every other
 *     row is compact: name and title, one reason with its material cue, Choose and Why on the same line; under a
 *     hold or a deal no row is a card (UX-05: the Account Story takes the room the cards used)
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
import { refreshNow } from '@/components/gap/refresh-now';

/** A set-aside person, serializable (the resolver's exclusion carries regexes and reads that never cross to the client). */
export interface SetAsidePerson {
  key: string;
  name: string;
  title: string | null;
  code: string;
  reason: string;
  /** divested_entity: the company's own release behind the set-aside (serializable), when it has one. */
  source?: { url: string; publisher: string; quote: string; publishedAt: string } | null;
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
  /** UX-05: set-asides that rest on an unverified report, said under the set-aside line (the story computes them). */
  setAsideCaveats?: Array<{ text: string; tag: string }>;
}

type Busy = { key: string; step: 'adding' | 'choosing' | 'next' | 'preference' | 'employment' | 'verify' } | null;
/** UX-07: every seller decision reads back in one line with Undo in place; nothing is sent by any of them. */
type Note = { kind: 'status' | 'alert'; text: string; undo?: { label: string; run: () => Promise<void> } };
const NOT_NOW_DEFAULT_DAYS = 30;
const dateInput = (d: Date) => d.toISOString().slice(0, 10);
const sayDate = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });

const BTN = 'inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-medium';
const PRIMARY = `${BTN} bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-60`;
const OUTLINE = `${BTN} border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-60`;
const TEXT = 'inline-flex min-h-9 items-center text-xs underline text-[var(--muted-foreground)]';

/** R63-A N6: a reason the cue already starts with is said once ("Current (confirmed), Current (confirmed): ..."). */
export function compactReason(reason: string | null, cue: string): string | null {
  return cue && reason && cue.toLowerCase().startsWith(reason.toLowerCase()) ? null : reason;
}

/** The compact row's cue: a material currentness, then the reachability (always; a seller choosing needs it). */
function cueOf(row: StackRow): string {
  return [row.currentness, row.reachability.charAt(0).toLowerCase() + row.reachability.slice(1)].filter(Boolean).join(', ');
}

export function PeopleStackView({ accountName, stack, state, hypothesisId, excluded, primaryInNext = false, setAsideCaveats = [] }: PeopleStackViewProps) {
  const router = useRouter();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [note, setNote] = useState<Note | null>(null);
  const noteRef = useRef<HTMLParagraphElement>(null);
  const toggle = (key: string) => setOpen((prev) => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  // R63-B N4: Escape closes an open "Why this person?" from its button or anywhere in its panel; focus goes back to the
  // button.
  const escapeWhy = (key: string) => (e: React.KeyboardEvent) => {
    if (e.key !== 'Escape' || !open.has(key)) return;
    e.preventDefault();
    e.stopPropagation();
    toggle(key);
    document.getElementById(`why-btn-${key}`)?.focus();
  };
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
      // After an import the person comes back as a GAP contact (key gap:<id>): focus follows that key, not the old one.
      const chosenKey = row.personaId === null ? `gap:${personaId}` : row.key;
      setBusy({ key: row.key, step: 'choosing' });
      const res = await fetch('/api/gap/accounts/motion', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accountName, primaryPersonaId: personaId }) });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setNote({ kind: 'alert', text: `Could not make ${row.name} first (${body.error ?? res.status}). Nothing changed.` });
        return;
      }
      setNote({ kind: 'status', text: `${row.name} is first at ${accountName.replace(/\.$/, '')}. Nothing is sent by choosing; every send runs its own gates.` });
      justChose.current = chosenKey;
      refreshNow(router);
    } catch (e) {
      setNote({ kind: 'alert', text: e instanceof Error ? e.message : 'network error' });
    } finally {
      setBusy(null);
    }
  }

  /** One POST, one read-back line, Undo in place. Nothing here sends: every control is a recorded decision. */
  async function decide(row: StackRow, step: NonNullable<Busy>['step'], url: string, body: Record<string, unknown> | null, said: string, undo?: { label: string; url: string; body: Record<string, unknown> | null }, what = 'record that') {
    setNote(null);
    setBusy({ key: row.key, step });
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      const answer = (await res.json().catch(() => ({}))) as { error?: string; verification?: { verdict?: string; company?: string | null; title?: string | null } };
      if (!res.ok) {
        setNote({ kind: 'alert', text: `Could not ${what} for ${row.name} (${answer.error ?? res.status}). Nothing changed.` });
        return;
      }
      const verdict = answer.verification?.verdict ? ` ${answer.verification.verdict.replace(/_/g, ' ')}${answer.verification.title ? ` (${answer.verification.title}${answer.verification.company ? `, ${answer.verification.company}` : ''})` : ''}.` : '';
      setNote({
        kind: 'status',
        text: `${said}${verdict} Nothing is sent.`,
        undo: undo ? { label: undo.label, run: () => decide(row, step, undo.url, undo.body, `Undone: ${said.replace(/\.$/, '')} no longer stands.`) } : undefined,
      });
      // The control that was pressed may unmount on refresh: focus moves to the read-back line (WCAG 2.4.3).
      requestAnimationFrame(() => noteRef.current?.focus());
      refreshNow(router);
    } catch (e) {
      setNote({ kind: 'alert', text: e instanceof Error ? e.message : 'network error' });
    } finally {
      setBusy(null);
    }
  }
  const account = accountName.replace(/\.$/, '');
  const first = (name: string) => name.split(' ')[0];
  /** Make next: the motion's NEXT IF NO RESPONSE person, recorded on the motion row with the chosen primary. */
  const makeNext = (row: StackRow) => {
    const primary = state.person?.personaId;
    if (!primary || row.personaId === null) return;
    return decide(row, 'next', '/api/gap/accounts/motion', { accountName, primaryPersonaId: primary, nextPersonaId: row.personaId }, `${first(row.name)} is next at ${account} only: next if ${state.person ? first(state.person.name) : 'the chosen person'} is silent.`, { label: 'Undo', url: '/api/gap/accounts/motion', body: { accountName, primaryPersonaId: primary, nextPersonaId: null } }, 'make next');
  };
  const prefer = (row: StackRow, kind: 'not_a_fit' | 'not_now', reason: string, until: string | null) => {
    if (row.personaId === null) return;
    const url = `/api/gap/personas/${row.personaId}/preference`;
    const said = kind === 'not_now' && until ? `${first(row.name)} is set aside at ${account} until ${sayDate(until)}${reason ? ` (${reason})` : ''}.` : `${first(row.name)} is set aside at ${account} as not a fit${reason ? ` (${reason})` : ''}.`;
    return decide(row, 'preference', url, { kind, reason: reason || null, until }, said, { label: 'Undo', url, body: { kind: 'clear' } }, 'set aside');
  };
  const clearPreference = (row: StackRow) => (row.personaId === null ? undefined : decide(row, 'preference', `/api/gap/personas/${row.personaId}/preference`, { kind: 'clear' }, `${first(row.name)} is back among the eligible people at ${account}.`, undefined, 'undo the set-aside'));
  const employment = (row: StackRow, status: 'left' | 'role_changed') => {
    if (row.personaId === null) return;
    const url = `/api/gap/personas/${row.personaId}/employment`;
    // No Undo here: a reversal would record a human "current" that stands over later evidence and that a role
    // check never overwrites (review). The read-back says how to reverse: a new correction on their record.
    return decide(row, 'employment', url, { status }, status === 'left' ? `${first(row.name)} is recorded as having left ${account}: no first touch to them. This correction stands over later evidence; reverse it only with a new correction on their record.` : `${first(row.name)}'s role is recorded as changed at ${account}: verify before any first touch. This correction stands over later evidence; reverse it only with a new correction on their record.`, undefined, 'record that');
  };
  const verifyRole = (row: StackRow) => (row.personaId === null ? undefined : decide(row, 'verify', `/api/gap/personas/${row.personaId}/employment/verify`, null, `Role check for ${first(row.name)}:`, undefined, 'verify the role'));

  const chosenRow = stack.rows.find((r) => r.chosen) ?? null;
  const rows = showAll ? [...stack.rows, ...stack.more] : stack.rows;
  // A relationship-led account: the person you met or the introducer leads, and they are not an owner-resolution row.
  const lead = state.person && /^(relationship|intro):/.test(state.person.key) ? state.person : null;
  // Under a hold or a deal no ordinal and no "choose who": the list is the people on record, not a cold-touch choice.
  const choosing = state.chooseAllowed;
  const callAllowed = state.state !== 'opted_out' && state.state !== 'in_deal' && state.state !== 'held' && state.state !== 'research';
  // Under research (no angle yet) choosing is allowed but quiet: an outline control that says what it is for.
  const quietChoose = state.state === 'research';

  const whyButton = (row: StackRow) => (
    <button type="button" className={TEXT} aria-expanded={open.has(row.key)} id={`why-btn-${row.key}`} onKeyDown={escapeWhy(row.key)} aria-controls={`why-${row.key}`} aria-label={open.has(row.key) ? `Hide why: ${row.name}` : `Why this person? ${row.name}`} onClick={() => toggle(row.key)} data-testid="people-stack-why">
      {open.has(row.key) ? 'Hide why' : 'Why this person?'}
    </button>
  );
  const whyPanel = (row: StackRow) => (
    <div id={`why-${row.key}`} onKeyDown={escapeWhy(row.key)} hidden={!open.has(row.key)} className="mt-2 space-y-1 border-t border-[var(--border)] pt-2 text-xs text-[var(--muted-foreground)]">
      {open.has(row.key) ? (
        <>
          <ul className="space-y-0.5" data-testid="people-stack-why-list">
            {[...(row.chosen ? [] : [row.reachability]), ...row.why].map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          {row.personaId !== null ? (
            <EmploymentControl personaId={row.personaId} name={row.name} title={row.title} accountName={accountName} compact onDone={() => refreshNow(router)} />
          ) : row.hubspotContactId ? (
            <EmploymentControl hubspotContactId={row.hubspotContactId} name={row.name} title={row.title} accountName={accountName} compact onDone={() => refreshNow(router)} />
          ) : null}
        </>
      ) : null}
    </div>
  );
  // Under a hold the heading already says "no cold touch right now": a row never repeats it (Kroger said it five times).
  const chooseControl = (row: StackRow) =>
    !state.chooseAllowed ? null : row.coldEligible ? (
      <button type="button" className={chosenRow || quietChoose ? OUTLINE : PRIMARY} disabled={busy !== null} onClick={() => void choose(row)} data-testid="people-stack-choose" aria-describedby={`reason-${row.key}`}>
        {busy?.key === row.key
          ? busy.step === 'adding' ? 'Adding to GAP...' : 'Choosing...'
          : chosenRow
            ? `Make ${row.name.split(' ')[0]} first instead`
            : `Choose ${row.name.split(' ')[0]}${row.personaId === null ? ' (adds them to GAP)' : ''}${quietChoose ? ' for when an angle exists' : ''}`}
      </button>
    ) : (
      <span className="text-xs text-[var(--muted-foreground)]" data-testid="people-stack-slot-only">Not a cold first touch: unlocks by a meeting, a referral or your explicit choice.</span>
    );
  // UX-07: the seller's priority controls on an eligible GAP contact who is not the chosen person, only while a cold
  // touch is a live choice (never under a reply, an opt-out, a deal or a hold: the heading already says so).
  const priorityControls = (row: StackRow) => {
    if (!choosing || row.chosen || !row.coldEligible) return null;
    if (row.personaId === null) return <span className="text-xs text-[var(--muted-foreground)]" data-testid="people-stack-hubspot-only">Set aside or correct after Choose adds them to GAP.</span>;
    const b = busy?.key === row.key ? busy.step : null;
    // Make next only where the motion can line the person up (a ready email card at the account): the read-back
    // "is next" must be true, never a recorded wish the motion ignores (review).
    const canNext = !!state.person?.personaId && !row.isNext && !row.preference && row.canBeNext;
    return (
      <>
        {canNext ? (
          <button type="button" className={TEXT} disabled={busy !== null} onClick={() => void makeNext(row)} data-testid="people-stack-make-next" aria-describedby={`reason-${row.key}`}>
            {b === 'next' ? 'Recording...' : `Next if ${state.person ? first(state.person.name) : 'the chosen person'} is silent`}
          </button>
        ) : null}
        {row.preference ? (
          <span className="text-xs text-amber-700 dark:text-amber-400" data-testid="people-stack-preference">
            {row.preference.line}{' '}
            <button type="button" className={TEXT} disabled={busy !== null} onClick={() => void clearPreference(row)} data-testid="people-stack-preference-undo">
              {b === 'preference' ? 'Undoing...' : 'Undo'}
            </button>
          </span>
        ) : (
          <details className="group basis-full text-xs" data-testid="people-stack-more-controls">
            <summary className="inline-flex min-h-9 cursor-pointer list-none items-center text-xs text-[var(--muted-foreground)] underline marker:content-none">
              <span className="group-open:hidden">Set aside or correct</span>
              <span className="hidden group-open:inline">Hide set aside or correct</span>
            </summary>
            <div className="mt-1 flex flex-col gap-2 rounded-md border border-[var(--border)] p-2 sm:flex-row sm:flex-wrap sm:items-end">
              <form
                className="flex flex-wrap items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const until = String(f.get('until') ?? '');
                  // Noon UTC on the chosen day: the same calendar day in every US zone, however the line is rendered.
                  void prefer(row, 'not_now', String(f.get('reason') ?? '').trim(), until ? new Date(`${until}T12:00:00Z`).toISOString() : null);
                }}
                data-testid="people-stack-not-now"
              >
                <label className="flex flex-col gap-0.5">
                  <span>Not now until</span>
                  <input name="until" type="date" required defaultValue={dateInput(new Date(Date.now() + NOT_NOW_DEFAULT_DAYS * 86_400_000))} className="min-h-9 rounded-md border border-[var(--border)] bg-transparent px-2" />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span>Why (optional)</span>
                  <input name="reason" type="text" maxLength={240} className="min-h-9 w-40 rounded-md border border-[var(--border)] bg-transparent px-2" />
                </label>
                <button type="submit" className={OUTLINE} disabled={busy !== null}>{b === 'preference' ? 'Recording...' : 'Not now'}</button>
              </form>
              <form
                className="flex flex-wrap items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void prefer(row, 'not_a_fit', String(f.get('reason') ?? '').trim(), null);
                }}
                data-testid="people-stack-not-a-fit"
              >
                <label className="flex flex-col gap-0.5">
                  <span>Not a fit: why (optional)</span>
                  <input name="reason" type="text" maxLength={240} className="min-h-9 w-40 rounded-md border border-[var(--border)] bg-transparent px-2" />
                </label>
                <button type="submit" className={OUTLINE} disabled={busy !== null}>Not a fit</button>
              </form>
              <p className="basis-full text-[var(--muted-foreground)]">At {account} only. Nothing is sent. A set-aside hides nobody from you and clears no safety rule; Undo stays in place.</p>
              <details className="basis-full" data-testid="people-stack-record-controls">
                <summary className="inline-flex min-h-9 cursor-pointer list-none items-center text-xs text-[var(--muted-foreground)] underline marker:content-none">Correct their record (left, wrong role, verify)</summary>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <button type="button" className={OUTLINE} disabled={busy !== null} onClick={() => void employment(row, 'left')} data-testid="people-stack-left">{b === 'employment' ? 'Recording...' : 'Left the company'}</button>
                  <button type="button" className={OUTLINE} disabled={busy !== null} onClick={() => void employment(row, 'role_changed')} data-testid="people-stack-wrong-role">Wrong role</button>
                  <button type="button" className={OUTLINE} disabled={busy !== null} onClick={() => void verifyRole(row)} data-testid="people-stack-verify-role">{b === 'verify' ? 'Checking...' : 'Verify role'}</button>
                </div>
                <p className="mt-1 text-[var(--muted-foreground)]">Left and Wrong role go on their record everywhere, as your correction: they stand over later evidence and a role check never overwrites them, so there is no Undo; reverse one with a new correction. Verify role runs one public check and records what it finds.</p>
              </details>
            </div>
          </details>
        )}
      </>
    );
  };
  const head = (row: StackRow) => (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      {row.ordinal !== null && choosing ? <span className="text-xs font-semibold tabular-nums text-[var(--muted-foreground)]" data-testid="people-stack-ordinal">{row.ordinal}.</span> : null}
      <p id={`row-${row.key}`} tabIndex={-1} className="font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">
        {row.name}
        {/* R63-A N10: a person with no title says so (Dannon's Mark Shaughnessy read as a bare name). */}
        {row.title ? <span className="font-normal text-[var(--muted-foreground)]">, {row.title}</span> : <span className="font-normal text-[var(--muted-foreground)]" data-testid="people-stack-no-title">, title not on record</span>}
      </p>
      {row.slot !== 'Eligible operator' ? <span className="rounded-sm border border-[var(--border)] px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">{row.slot}</span> : null}
      {row.badge ? <span className="rounded-sm border border-[var(--primary)] px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]" data-testid="people-stack-badge">{row.badge}</span> : null}
      {row.chosen ? <span className="text-xs font-medium text-[var(--primary)]" data-testid="people-stack-chosen">Chosen{row.chosenBy ? ` by ${row.chosenBy}` : ''}</span> : null}
    </div>
  );

  return (
    <section id="people-stack" className="scroll-mt-20 space-y-2" data-testid="people-stack" aria-labelledby="people-stack-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="people-stack-heading" className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {choosing
            ? `People${stack.hidden ? ` (${stack.rows.length} of ${stack.rows.length + stack.hidden} eligible for a first touch)` : ' (eligible for a first touch)'}`
            : `People on record${stack.hidden ? ` (${stack.rows.length} of ${stack.rows.length + stack.hidden})` : ''}${state.state === 'in_deal' ? ': in a deal, work it from the deal' : ''}`}
        </h2>
        {stack.chooseLabel && choosing ? <p className="text-xs font-medium" data-testid="people-stack-choose-label">{stack.chooseLabel}: GAP does not pick.</p> : null}
        {!choosing ? <p className="text-xs text-[var(--muted-foreground)]" data-testid="people-stack-on-record">On record; no cold touch right now (see Next).</p> : null}
      </div>
      {state.next && choosing ? (
        <p className="text-xs" data-testid="people-stack-next">
          <span className="font-semibold">Next if no response:</span> {state.next.name}{state.next.title ? `, ${state.next.title}` : ''}. {state.next.unlock}.
        </p>
      ) : null}
      {stack.question && choosing ? (
        <p className="text-sm font-medium" data-testid="people-stack-question">
          {stack.question}
        </p>
      ) : null}
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
      <ul role="list" className="divide-y divide-[var(--border)]" data-testid="people-stack-rows">
        {rows.map((row) => {
          // UX-05: a card only for the chosen person while a cold touch is a live choice; everyone else, and everyone
          // under a hold or a deal, is one compact row.
          const card = row.chosen && choosing;
          if (!card) {
            const cue = cueOf(row);
            const reason = compactReason(row.reason, cue);
            return (
              <li key={row.key} className="py-2" data-testid="people-stack-row" data-key={row.key} data-chosen={row.chosen ? 'true' : 'false'} data-slot={row.slot} data-compact="true">
                {head(row)}
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p id={`reason-${row.key}`} className="min-w-0 text-sm text-[var(--muted-foreground)]" data-testid="people-stack-reason">
                    {reason}
                    <span className={`text-xs ${/conflict|changed|in question|left|separate|divested|no email/i.test(cue) ? 'text-amber-700 dark:text-amber-400' : ''}`} data-testid="people-stack-cue">{reason ? ', ' : ''}{cue}</span>
                  </p>
                  {row.chosen && state.state === 'in_motion' ? (
                    <span className="text-xs text-amber-700 dark:text-amber-400" data-testid="people-stack-held">First touch sent; waiting.</span>
                  ) : null}
                  {row.chosen && row.personaId !== null && callAllowed ? (
                    <Link href={`/gap/call/${row.personaId}`} className={OUTLINE} data-testid="people-stack-call">
                      Call prep
                    </Link>
                  ) : null}
                  {!row.chosen ? chooseControl(row) : null}
                  {whyButton(row)}
                  {priorityControls(row)}
                </div>
                {whyPanel(row)}
              </li>
            );
          }
          return (
            <li key={row.key} className="my-2 rounded-md border border-[var(--primary)] bg-[var(--muted)]/30 p-3" data-testid="people-stack-row" data-key={row.key} data-chosen="true" data-slot={row.slot} data-compact="false">
              {head(row)}
              <p id={`reason-${row.key}`} className="mt-0.5 text-sm" data-testid="people-stack-reason">{row.reason}</p>
              {row.leadOver ? (
                <p className={`mt-0.5 text-xs ${row.leadOver.tie || !row.leadOver.leads ? 'text-[var(--muted-foreground)]' : ''}`} data-testid="people-stack-lead-over" data-tie={row.leadOver.tie ? 'true' : 'false'} data-leads={row.leadOver.leads ? 'true' : 'false'}>
                  {row.chosenBy && !/^GAP:/.test(row.chosenBy) ? (
                    <>
                      <span className="font-semibold">You chose {row.name.split(' ')[0]} ({row.chosenBy}).</span>{' '}
                      {row.leadOver.tie ? `On evidence GAP cannot separate ${row.name.split(' ')[0]} and ${row.leadOver.over.split(' ')[0]}.` : row.leadOver.leads ? `The evidence agrees: ${row.name.split(' ')[0]} ranks ahead of ${row.leadOver.over.split(' ')[0]}. ${row.leadOver.text.replace(/^\w/, (ch) => ch.toUpperCase())}` : `On evidence GAP ranks ${row.leadOver.over.split(' ')[0]} ahead: ${row.leadOver.text}`}
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">Why {row.name.split(' ')[0]} over {row.leadOver.over.split(' ')[0]}?</span> {row.leadOver.text}
                    </>
                  )}
                </p>
              ) : null}
              {row.currentness ? (
                <p className={`mt-0.5 text-xs ${/conflict|changed|in question|left|separate|divested/i.test(row.currentness) ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`} data-testid="people-stack-currentness">
                  {row.currentness}
                </p>
              ) : null}
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{row.reachability}</p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {!state.coldTouchAllowed ? (
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
                ) : (
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
                )}
                {whyButton(row)}
              </div>
              {whyPanel(row)}
            </li>
          );
        })}
      </ul>

      {/* One always-mounted status region (its text changes, so screen readers announce it); an alert only when something refused. */}
      <p ref={noteRef} tabIndex={-1} role="status" aria-live="polite" className="rounded text-xs outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]" data-testid="people-stack-note">
        {note?.kind === 'status' ? note.text : ''}
        {note?.kind === 'status' && note.undo ? (
          <>
            {' '}
            <button type="button" className={TEXT} disabled={busy !== null} onClick={() => void note.undo!.run()} data-testid="people-stack-undo">
              {note.undo.label}
            </button>
          </>
        ) : null}
      </p>
      {note?.kind === 'alert' ? (
        <p role="alert" className="text-xs text-red-700 dark:text-red-400" data-testid="people-stack-alert">
          {note.text}
        </p>
      ) : null}

      {stack.slots.length ? (
        <ul className="space-y-1 text-xs" data-testid="people-stack-slots" aria-label="Also on record">
          {stack.slots.map((row) => (
            <li key={row.key} className="flex flex-wrap items-baseline gap-x-2 gap-y-0" data-testid="people-stack-slot" data-slot={row.slot}>
              <span className="rounded-sm border border-[var(--border)] px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">{row.slot}</span>
              <span>
                <span className="font-medium">{row.name}</span>
                {row.title ? <span className="text-[var(--muted-foreground)]">, {row.title}</span> : null}
              </span>
              <span className="text-[var(--muted-foreground)]">(not a cold first touch)</span>
              <button type="button" className={TEXT} aria-expanded={open.has(row.key)} id={`why-btn-${row.key}`} onKeyDown={escapeWhy(row.key)} aria-controls={`why-${row.key}`} aria-label={open.has(row.key) ? `Hide why: ${row.name}` : `Why this person? ${row.name}`} onClick={() => toggle(row.key)} data-testid="people-stack-why">
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

      {!showAll && stack.setAside.line ? (
        <p className="text-xs text-[var(--muted-foreground)]" data-testid="people-stack-set-aside-line">{stack.setAside.line}</p>
      ) : null}
      {setAsideCaveats.length ? (
        <ul className="space-y-0.5 text-xs text-[var(--muted-foreground)]" data-testid="people-stack-set-aside-caveats" aria-label="Set aside on an unverified report">
          {setAsideCaveats.map((s, k) => (
            <li key={k} data-tag={s.tag}>{s.text}</li>
          ))}
        </ul>
      ) : null}

      {stack.hidden || stack.setAside.count ? (
        <div className="space-y-1 text-xs">
          <button type="button" className={TEXT} aria-expanded={showAll} onClick={() => setShowAll((v) => !v)} data-testid="people-stack-show-all">
            {showAll ? 'Show fewer' : stack.showAllLabel ?? `Show the ${stack.setAside.count} set aside`}
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
    </section>
  );
}
