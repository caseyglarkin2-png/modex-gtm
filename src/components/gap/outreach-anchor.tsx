'use client';

/**
 * OPENING STORY (the outreach anchor; account-first UX, UX-06, Option A; execution recovery R11/R12, 2026-10-06):
 * for the chosen person, the one reviewed story the email opening is built on, and the honest alternatives. Renders
 * the pure projection (lib/gap/story/anchor.ts); never ranks, never writes copy.
 *
 *   in the open    the primary anchor (its sentence, source, basis), why this person cares (Our read)
 *   PROPOSALS      a thesis drafted from a checked fact, where the action lives: the exact opening sentence, the
 *                  guess, the person, what would prove it wrong, the problem family and its basis, and ONE labeled
 *                  review control (APPROVE AND USE: the existing audited submit/approve/activate transitions through
 *                  PATCH /api/gap/hypotheses/[id] {advance}). Send stays a separate explicit action. An incomplete
 *                  proposal asks the one question that completes it (the problem family); a refused submit says why
 *                  and stays editable. A proposal never hides its fact.
 *   one disclosure best proof (YardFlow's, clearly ours), the supporting fact, the do-not-use list
 *   one disclosure USE A DIFFERENT STORY (the other theses; choosing one records anchorHypothesisId on the person's
 *                  angle row through POST /api/gap/personas/[id]/anchor and the page re-renders on that thesis) and
 *                  DRAFT A THESIS from a checked fact no thesis is grounded on (POST /api/gap/story/draft: the one
 *                  service that gates the fact, derives the family with a basis, keeps one draft per fact and person,
 *                  and submits a complete draft for review in the same call). Never straight into copy.
 *
 * Nothing here sends, enrolls, writes HubSpot or spends Apollo. Voice: no em dashes.
 */
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AnchorPending, OutreachAnchor } from '@/lib/gap/story/anchor';
import { PRIMARY_BY_TEXT } from '@/lib/gap/story/anchor-text';
import { familyChoices, label as familyLabel } from '@/lib/gap/story/propose-family';
import { OBSERVATION_REFUSAL_TEXT } from '@/lib/gap/hypothesis/observation';
import { Tag } from './seller-tag';
import { draftDefaultsFor, storyDraftPayload } from '@/lib/gap/story/draft-defaults';

const BTN = 'inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-medium';
const OUTLINE = `${BTN} border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-60`;
const PRIMARY = `${BTN} bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-60`;
const TEXT = 'inline-flex min-h-9 items-center text-xs underline text-[var(--muted-foreground)]';
const SUMMARY = 'group-open:hidden';
const SUMMARY_OPEN = 'hidden group-open:inline';

// R35: the persona key and the draft text live in one lib module, so Ask GAP's proposal posts the same payload.
export { personaKeyFor } from '@/lib/gap/story/draft-defaults';

/** Plain words for a refused transition (the machine's stable reasons). */
export const TRANSITION_REFUSAL_TEXT: Record<string, string> = {
  unmapped_family: 'The problem family is missing: choose the problem this fact points at.',
  evidence_insufficient: 'The send gate would refuse this opening: its fact is not verified outreach evidence any more.',
  no_evidence: 'No evidence is linked to this thesis.',
  evidence_expired: 'Its evidence has expired.',
  opener_too_long: 'The opening quote is longer than a first touch can carry.',
  no_persona: 'No person is assigned to this thesis.',
  suppressed: 'That person is on the suppression list: nothing can be prepared for them.',
  persona_left_account: 'That person has left the account.',
  persona_employment_conflict: 'That person\'s employer is in conflict: verify their role first.',
  unhedged_hypothesis: 'Our guess must read as a guess (my guess, likely, might).',
  no_falsification: 'Say what would prove the thesis wrong.',
  stale_status: 'The thesis moved under you: the page is refreshed.',
};


export interface OutreachAnchorViewProps {
  accountName: string;
  anchor: OutreachAnchor;
  /** The pursuit state's cold-touch permission: a hold shows nothing to use, only the alternatives to read. */
  coldTouchAllowed: boolean;
}

type Busy = { kind: 'switch' | 'draft' | 'review' | 'withdraw' | 'family'; id: string } | null;

type DraftResponse = {
  ok?: boolean;
  hypothesisId?: string;
  status?: string;
  existing?: boolean;
  existingVia?: 'same_fact' | 'open_work' | null;
  family?: string;
  familyBasis?: string | null;
  preparation?: 'submitted' | 'incomplete' | 'draft';
  missing?: string[];
  submitRefusal?: string | null;
  error?: string;
  detail?: string;
};

function refusalWords(code: string | null | undefined): string {
  if (!code) return 'refused';
  return (OBSERVATION_REFUSAL_TEXT as Record<string, string>)[code] ?? TRANSITION_REFUSAL_TEXT[code] ?? `refused (${code})`;
}

export function OutreachAnchorView({ accountName, anchor, coldTouchAllowed }: OutreachAnchorViewProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [note, setNote] = useState<{ kind: 'status' | 'alert'; text: string } | null>(null);
  const [drafting, setDrafting] = useState<string | null>(null);
  const [observation, setObservation] = useState('');
  const [problem, setProblem] = useState('');
  const [familyPick, setFamilyPick] = useState<Record<string, string>>({});
  const [drafted, setDrafted] = useState<{ id: string; preparation: string } | null>(null);
  // After a switch or a submit the clicked control unmounts: focus moves to the status line (WCAG 2.4.3).
  const noteRef = useRef<HTMLParagraphElement>(null);
  const person = anchor.person;
  const first = person ? person.name.split(' ')[0] : null;
  const p = anchor.primary;
  const usableAlternatives = anchor.alternatives.filter((t) => t.usable || t.status === 'review_required');
  const unusable = anchor.alternatives.filter((t) => !t.usable && t.status !== 'review_required');
  const pending = anchor.pending ?? [];
  const storyCount = usableAlternatives.length + anchor.draftable.length;

  function announce(kind: 'status' | 'alert', text: string) {
    setNote({ kind, text });
    requestAnimationFrame(() => noteRef.current?.focus());
  }

  async function switchStory(hypothesisId: string) {
    if (!person?.personaId) return;
    setNote(null);
    setBusy({ kind: 'switch', id: hypothesisId });
    try {
      const res = await fetch(`/api/gap/personas/${person.personaId}/anchor`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hypothesisId }) });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        announce('alert', `Could not switch the story (${body.error ?? res.status}). Nothing changed.`);
        return;
      }
      announce('status', `${first}'s opening now builds on that thesis. Nothing is sent; the email still runs every check.`);
      router.refresh();
    } catch (e) {
      announce('alert', e instanceof Error ? e.message : 'network error');
    } finally {
      setBusy(null);
    }
  }

  function openDraft(d: OutreachAnchor['draftable'][number]) {
    setDrafted(null);
    setNote(null);
    setDrafting(d.factId);
    setObservation(d.proposedObservation);
    setProblem(draftDefaultsFor(d.claimClass).problem);
  }

  /** The one draft call: gates the fact, derives or takes the family, one draft per fact and person, submits when complete. */
  async function postDraft(factId: string, text: { observation: string; problem: string }, problemFamily: string | null, claimClass: string | null | undefined): Promise<DraftResponse | null> {
    const res = await fetch('/api/gap/story/draft', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(storyDraftPayload({ accountName, factId, claimClass, proposedObservation: text.observation, person: person ? { personaId: person.personaId ?? null, title: person.title ?? null } : null, problem: text.problem, problemFamily })),
    });
    const body = (await res.json().catch(() => ({}))) as DraftResponse;
    if (!res.ok || !body.hypothesisId) {
      const code = body.detail ?? body.error ?? String(res.status);
      announce('alert', body.error === 'fact_not_outreach_evidence' ? `This fact would be refused by the send gate (${code}): nothing was drafted.` : `Could not draft the thesis: ${refusalWords(code)} Nothing changed.`);
      return null;
    }
    return body;
  }

  function describe(body: DraftResponse): string {
    const who = first ? ` for ${first}` : '';
    if (body.preparation === 'submitted') return `${body.existing && body.existingVia === 'open_work' ? `${first ?? 'This person'} already had this thesis open: it is` : 'Drafted and'} under review below${who}. Approve it there and the first touch is prepared. Nothing is sent.`;
    if (body.preparation === 'incomplete') return `Drafted${who}. One thing is missing: which problem this fact points at. Choose it below and it goes to review.`;
    return `Drafted${who}, not yet submitted: ${refusalWords(body.submitRefusal)}`;
  }

  async function submitDraft(d: OutreachAnchor['draftable'][number]) {
    setNote(null);
    setBusy({ kind: 'draft', id: d.factId });
    try {
      const body = await postDraft(d.factId, { observation, problem }, null, d.claimClass);
      if (!body) return;
      setDrafted({ id: body.hypothesisId!, preparation: body.preparation ?? 'draft' });
      setDrafting(null);
      announce('status', describe(body));
      router.refresh();
    } catch (e) {
      announce('alert', e instanceof Error ? e.message : 'network error');
    } finally {
      setBusy(null);
    }
  }

  /** The one question on an incomplete proposal: the problem family. Same service, same draft, then review. */
  async function setFamily(item: AnchorPending) {
    const family = familyPick[item.hypothesisId];
    if (!family) {
      announce('alert', 'Choose the problem this fact points at first.');
      return;
    }
    setNote(null);
    setBusy({ kind: 'family', id: item.hypothesisId });
    try {
      const body = await postDraft(item.factId, { observation: item.observationRaw, problem: item.problem }, family, item.claimClass);
      if (!body) return;
      announce('status', describe(body));
      router.refresh();
    } catch (e) {
      announce('alert', e instanceof Error ? e.message : 'network error');
    } finally {
      setBusy(null);
    }
  }

  /** APPROVE AND USE: the existing audited transitions (submit if needed, approve, activate, route) in one labeled click. */
  async function approveAndUse(item: AnchorPending) {
    setNote(null);
    setBusy({ kind: 'review', id: item.hypothesisId });
    try {
      const res = await fetch(`/api/gap/hypotheses/${encodeURIComponent(item.hypothesisId)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ advance: 'approve_and_use' }) });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; to?: string | null; detail?: string; reason?: string; error?: string };
      if (!res.ok || body.ok === false) {
        announce('alert', `Not approved: ${refusalWords(body.reason ?? body.error)} ${body.to === 'approved' ? 'It is approved but not in use.' : 'Nothing changed.'}`);
        router.refresh();
        return;
      }
      announce('status', `Approved and in use${first ? ` for ${first}` : ''}: the opening now builds on this story. The email is still a separate step and runs every check.`);
      router.refresh();
    } catch (e) {
      announce('alert', e instanceof Error ? e.message : 'network error');
    } finally {
      setBusy(null);
    }
  }

  /** USE THIS STORY: an approved thesis not yet in use is activated and routed through the same audited advance. */
  async function usePrimary(hypothesisId: string) {
    setNote(null);
    setBusy({ kind: 'review', id: hypothesisId });
    try {
      const res = await fetch(`/api/gap/hypotheses/${encodeURIComponent(hypothesisId)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ advance: 'approve_and_use' }) });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; to?: string | null; reason?: string; error?: string };
      if (!res.ok || body.ok === false) {
        announce('alert', `Not put in use: ${refusalWords(body.reason ?? body.error)} Nothing changed.`);
        router.refresh();
        return;
      }
      announce('status', `In use${first ? ` for ${first}` : ''}: the email is prepared on this story. Sending is still a separate step and runs every check.`);
      router.refresh();
    } catch (e) {
      announce('alert', e instanceof Error ? e.message : 'network error');
    } finally {
      setBusy(null);
    }
  }

  async function notThisStory(item: AnchorPending) {
    setNote(null);
    setBusy({ kind: 'withdraw', id: item.hypothesisId });
    try {
      const res = await fetch(`/api/gap/hypotheses/${encodeURIComponent(item.hypothesisId)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'withdraw', reason: 'not this story (set aside on the account page)' }) });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        announce('alert', `Could not set it aside (${body.error ?? res.status}). Nothing changed.`);
        return;
      }
      announce('status', 'Set aside. The fact stays checked; GAP will not propose this story again unless something material changes.');
      router.refresh();
    } catch (e) {
      announce('alert', e instanceof Error ? e.message : 'network error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section id="outreach-anchor" className="space-y-2 rounded-md border border-[var(--border)] px-3 py-2 scroll-mt-20" data-testid="outreach-anchor" aria-labelledby="outreach-anchor-heading">
      <h2 id="outreach-anchor-heading" className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        Opening story{first ? ` for ${first}` : ''}
      </h2>

      {p ? (
        <div className="space-y-0.5" data-testid="anchor-primary" data-hypothesis={p.hypothesisId}>
          <div className="flex items-start gap-2">
            <Tag tag="Checked" />
            <p className="min-w-0 break-words text-sm">{p.observation}</p>
          </div>
          <p className="ml-1 text-xs text-[var(--muted-foreground)]">
            {p.basis}; {p.status === 'active' ? 'an active thesis' : p.status === 'approved' ? 'an approved thesis, not yet in use' : p.status}; basis: {anchor.primaryBy ? PRIMARY_BY_TEXT[anchor.primaryBy] : 'none'}. The email is built on it and still runs every check.
          </p>
          {p.status === 'approved' && coldTouchAllowed ? (
            <div className="ml-1 flex flex-wrap items-center gap-2">
              <button type="button" className={PRIMARY} disabled={busy !== null} onClick={() => void usePrimary(p.hypothesisId)} data-testid="anchor-use-primary">
                {busy?.kind === 'review' && busy.id === p.hypothesisId ? 'Putting in use...' : 'Put this story in use'}
              </button>
              <span className="text-xs text-[var(--muted-foreground)]">Approved stories are put in use here; the email is then prepared on it. Nothing is sent.</span>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-amber-700 dark:text-amber-400" data-testid="anchor-none">
          No usable thesis at {accountName} yet: nothing to open on.
          {unusable.length ? ` ${unusable.length === 1 ? 'The open thesis' : `${unusable.length} open theses`} would be refused by the send gate: ${unusable[0].unusableWhy}.` : ''}
          {pending.length ? ` ${pending.length === 1 ? 'A proposal' : `${pending.length} proposals`} below ${pending.length === 1 ? 'is' : 'are'} waiting for your review.` : anchor.draftable.length ? ' A checked fact below can become a thesis (it goes to review).' : (anchor.tooOld ?? []).length ? ' The checked stories here are too old for a first touch (below); open the research plan to find a current fact.' : ' Open the research plan to find a fact; review grounds the thesis.'}
        </p>
      )}

      {anchor.whyTheyCare ? (
        <div className="flex items-start gap-2" data-testid="anchor-why">
          <Tag tag="Our read" />
          <p className="min-w-0 break-words text-sm">{anchor.whyTheyCare.text}</p>
        </div>
      ) : null}

      {pending.length ? (
        <ul className="space-y-2" data-testid="anchor-pending-list" aria-label="Proposals waiting for your review">
          {pending.map((item) => {
            const mine = busy?.id === item.hypothesisId;
            const heading = !item.familyKnown ? 'Proposal: one thing missing' : item.status === 'review_required' ? 'Proposal under review' : 'Proposal drafted, not yet submitted';
            return (
              <li key={item.hypothesisId} className="space-y-1.5 rounded-md border border-[var(--primary)] px-3 py-2" data-testid="anchor-pending" data-hypothesis={item.hypothesisId} data-status={item.status} data-family-known={item.familyKnown ? 'true' : 'false'}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--primary)]">{heading}</p>
                <div className="flex items-start gap-2">
                  <Tag tag="Checked" />
                  <p className="min-w-0 break-words text-sm" data-testid="anchor-pending-observation">{item.observation}</p>
                </div>
                {item.stale ? <p className="text-xs text-amber-700 dark:text-amber-400" data-testid="anchor-pending-stale">{item.stale} Set it aside; it cannot be approved for a first touch.</p> : null}
                <p className="ml-1 text-xs text-[var(--muted-foreground)]">
                  {item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="underline">{item.sourceLabel}</a> : item.sourceLabel}. This is the sentence the opening is built on; nothing else from the source reaches the buyer.
                </p>
                <div className="flex items-start gap-2">
                  <Tag tag="Our read" />
                  <p className="min-w-0 break-words text-sm">{item.problem}</p>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
                  <dt className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">For</dt>
                  <dd>{item.personName ?? (item.personaId == null ? 'the account (no person yet)' : `person ${item.personaId}`)}</dd>
                  <dt className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Problem</dt>
                  <dd data-testid="anchor-pending-family">{item.familyKnown ? familyLabel(item.family) : 'not set yet'}</dd>
                  {item.wouldProveWrong.length ? (
                    <>
                      <dt className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Would prove wrong</dt>
                      <dd>{item.wouldProveWrong[0]}</dd>
                    </>
                  ) : null}
                  <dt className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Send gate</dt>
                  <dd>{item.gate === 'sendable' ? 'would let this opening out' : item.gate === 'refused' ? 'would refuse this opening' : 'judged at approval'}</dd>
                </dl>
                {item.stale ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className={OUTLINE} disabled={busy !== null} onClick={() => void notThisStory(item)} data-testid="anchor-pending-withdraw">
                      {mine && busy?.kind === 'withdraw' ? 'Setting aside...' : 'Not this story'}
                    </button>
                  </div>
                ) : !item.familyKnown ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end" data-testid="anchor-pending-family-form">
                    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs">
                      <span>Which problem does this fact point at?</span>
                      <select className="min-h-11 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm" value={familyPick[item.hypothesisId] ?? ''} onChange={(e) => setFamilyPick((m) => ({ ...m, [item.hypothesisId]: e.target.value }))} data-testid="anchor-pending-family-select">
                        <option value="">Choose one</option>
                        {familyChoices().map((c) => (
                          <option key={c.family} value={c.family}>{c.label}: {c.problem}</option>
                        ))}
                      </select>
                    </label>
                    <button type="button" className={PRIMARY} disabled={busy !== null} onClick={() => void setFamily(item)} data-testid="anchor-pending-set-family">
                      {mine && busy?.kind === 'family' ? 'Submitting...' : 'Set the problem and submit for review'}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {coldTouchAllowed || item.status === 'review_required' || item.status === 'draft' ? (
                      <button type="button" className={PRIMARY} disabled={busy !== null || !coldTouchAllowed} title={coldTouchAllowed ? undefined : 'A hold on the account stops approval for use'} onClick={() => void approveAndUse(item)} data-testid="anchor-pending-approve">
                        {mine && busy?.kind === 'review' ? 'Approving...' : 'Approve and use this story'}
                      </button>
                    ) : null}
                    <button type="button" className={OUTLINE} disabled={busy !== null} onClick={() => void notThisStory(item)} data-testid="anchor-pending-withdraw">
                      {mine && busy?.kind === 'withdraw' ? 'Setting aside...' : 'Not this story'}
                    </button>
                    <span className="text-xs text-[var(--muted-foreground)]">Approve runs the same checks every thesis takes; the email is a separate step. Nothing is sent.</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      <details className="group text-sm" data-testid="anchor-more">
        <summary className="min-h-11 cursor-pointer py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Best proof, supporting fact and the do-not-use list ({anchor.doNotUse.length})
          <span className={`ml-2 font-normal normal-case underline ${SUMMARY}`}>Show</span>
          <span className={`ml-2 font-normal normal-case underline ${SUMMARY_OPEN}`}>Hide</span>
        </summary>
        <div className="mt-1 space-y-3">
          {anchor.supporting ? (
            <div className="space-y-0.5" data-testid="anchor-supporting">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Supporting fact</p>
              <div className="flex items-start gap-2">
                <Tag tag={anchor.supporting.tag} />
                <p className="min-w-0 break-words text-sm">{anchor.supporting.text}</p>
              </div>
              <p className="ml-1 text-xs text-[var(--muted-foreground)]">{anchor.supporting.basis}</p>
            </div>
          ) : null}
          <div className="space-y-0.5" data-testid="anchor-proof">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Best proof</p>
            <div className="flex items-start gap-2">
              <span className="inline-block shrink-0 whitespace-nowrap rounded border border-[var(--primary)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">{anchor.bestProof.tag}</span>
              <p className="min-w-0 break-words text-sm">{anchor.bestProof.text}</p>
            </div>
            <p className="ml-1 text-xs text-[var(--muted-foreground)]">YardFlow&apos;s own number, never theirs.</p>
          </div>
          {anchor.doNotUse.length ? (
            <div className="space-y-0.5" data-testid="anchor-do-not-use">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Do not use ({anchor.doNotUse.length})</p>
              <ul className="space-y-1 text-xs">
                {anchor.doNotUse.map((d, k) => (
                  <li key={k}>
                    <span className="text-[var(--foreground)]">{d.text}</span> <span className="text-[var(--muted-foreground)]">({d.reason})</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </details>

      {storyCount || unusable.length ? (
        <details className="group text-sm" data-testid="anchor-alternatives">
          <summary className="min-h-11 cursor-pointer py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {p ? `Use a different story (${storyCount})` : `Draft a thesis from a checked fact (${anchor.draftable.length})`}
            <span className={`ml-2 font-normal normal-case underline ${SUMMARY}`}>Show</span>
            <span className={`ml-2 font-normal normal-case underline ${SUMMARY_OPEN}`}>Hide</span>
          </summary>
          <div className="mt-1 space-y-2">
            {usableAlternatives.length ? (
              <ul className="space-y-2">
                {usableAlternatives.map((t) => (
                  <li key={t.hypothesisId} className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3" data-testid="anchor-alternative" data-hypothesis={t.hypothesisId}>
                    <p className="min-w-0 flex-1 text-sm">
                      {t.sameAsSupporting ? 'The supporting fact above, as its own story. ' : ''}{t.observation}
                      <span className="text-xs text-[var(--muted-foreground)]"> ({t.basis}; {t.status === 'review_required' ? 'under review' : t.status}; {t.relevance.tier === 'none' ? 'off their remit' : `${t.relevance.tier} on their remit`})</span>
                    </p>
                    {t.status === 'review_required' ? (
                      <span className="text-xs text-[var(--muted-foreground)]">Review it above.</span>
                    ) : person?.personaId && coldTouchAllowed ? (
                      <button type="button" className={OUTLINE} disabled={busy !== null} onClick={() => void switchStory(t.hypothesisId)} data-testid="anchor-use-story">
                        {busy?.kind === 'switch' && busy.id === t.hypothesisId ? 'Switching...' : 'Use this story'}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {unusable.length ? (
              <ul className="space-y-1 text-xs text-[var(--muted-foreground)]" data-testid="anchor-unusable">
                {unusable.map((t) => (
                  <li key={t.hypothesisId} data-hypothesis={t.hypothesisId}>
                    Not usable: {t.observation.slice(0, 120)}{t.observation.length > 120 ? '...' : ''}. {!anchor.primary && t.hypothesisId === unusable[0].hypothesisId ? 'The reason above.' : `${t.unusableWhy}.`}
                  </li>
                ))}
              </ul>
            ) : null}
            {anchor.draftable.length ? (
              <ul className="space-y-2">
                {anchor.draftable.map((d) => (
                  <li key={d.factId} className="space-y-2 border-t border-[var(--border)] pt-2 first:border-t-0 first:pt-0" data-testid="anchor-draftable" data-fact={d.factId}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
                      <p className="min-w-0 flex-1 text-sm">
                        {d.story}
                        <span className="text-xs text-[var(--muted-foreground)]"> ({d.sourceLabel}; no thesis yet){d.currentLine ? ` ${d.currentLine}` : ''}</span>
                      </p>
                      {drafting === d.factId ? null : (
                        <button type="button" className={OUTLINE} disabled={busy !== null} onClick={() => openDraft(d)} data-testid="anchor-draft-open">
                          Draft a thesis from this fact
                        </button>
                      )}
                    </div>
                    {drafting === d.factId ? (
                      <form
                        className="space-y-2"
                        data-testid="anchor-draft-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void submitDraft(d);
                        }}
                      >
                        <p className="text-xs"><span className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Story</span> {d.story}</p>
                        <p className="text-xs"><span className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Source</span> {d.sourceUrl ? <a href={d.sourceUrl} target="_blank" rel="noreferrer" className="underline">{d.sourceLabel}</a> : d.sourceLabel}</p>
                        <div className="text-xs">
                          <label htmlFor={`anchor-observation-${d.factId}`} className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Proposed outreach observation</label>
                          <textarea id={`anchor-observation-${d.factId}`} aria-describedby={`anchor-observation-help-${d.factId}`} className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent p-2 text-sm" rows={3} value={observation} onChange={(e) => setObservation(e.target.value)} data-testid="anchor-draft-observation" />
                          <p id={`anchor-observation-help-${d.factId}`} className="text-[var(--muted-foreground)]">A sentence about what changed, in the source&apos;s words, with its citation. A pasted headline is refused.</p>
                        </div>
                        <div className="text-xs">
                          <label htmlFor={`anchor-problem-${d.factId}`} className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Our guess (hedged)</label>
                          <textarea id={`anchor-problem-${d.factId}`} aria-describedby={`anchor-problem-help-${d.factId}`} className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent p-2 text-sm" rows={2} value={problem} onChange={(e) => setProblem(e.target.value)} data-testid="anchor-draft-problem" />
                          <p id={`anchor-problem-help-${d.factId}`} className="text-[var(--muted-foreground)]">What we think the change does to their yards, as a guess the buyer can refute.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="submit" className={PRIMARY} disabled={busy !== null} data-testid="anchor-draft-submit">
                            {busy?.kind === 'draft' ? 'Drafting...' : 'Submit for review'}
                          </button>
                          <button type="button" className={TEXT} onClick={() => setDrafting(null)}>Cancel</button>
                          <span className="text-xs text-[var(--muted-foreground)]">Creates the thesis and puts it under review above, on this page. Nothing is sent.</span>
                        </div>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {drafted ? (
              <p className="text-xs" data-testid="anchor-drafted">
                {drafted.preparation === 'submitted' ? 'Thesis under review above.' : drafted.preparation === 'incomplete' ? 'Thesis drafted; one thing to set above.' : 'Thesis drafted; see the reason above.'}{' '}
                <Link href="#outreach-anchor" className="underline">Review it here</Link>
              </p>
            ) : null}
          </div>
        </details>
      ) : null}
      {(anchor.tooOld ?? []).length ? (
        <ul className="space-y-1 text-xs text-[var(--muted-foreground)]" data-testid="anchor-too-old" aria-label="Stories too old for a first touch">
          <li className="font-semibold uppercase tracking-wide">Not offered: too old for a first touch</li>
          {(anchor.tooOld ?? []).map((t) => (
            <li key={t.factId} data-fact={t.factId}>
              {t.story} ({t.sourceUrl ? <a href={t.sourceUrl} target="_blank" rel="noreferrer" className="underline">{t.sourceLabel}</a> : t.sourceLabel}). {t.line}
            </li>
          ))}
        </ul>
      ) : null}

      <p ref={noteRef} tabIndex={-1} role="status" aria-live="polite" className="rounded text-xs outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]" data-testid="anchor-note">
        {note?.kind === 'status' ? note.text : ''}
      </p>
      {note?.kind === 'alert' ? (
        <p role="alert" className="text-xs text-red-700 dark:text-red-400" data-testid="anchor-alert">
          {note.text}
        </p>
      ) : null}
    </section>
  );
}
