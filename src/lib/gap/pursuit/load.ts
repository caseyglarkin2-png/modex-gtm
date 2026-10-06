/**
 * PURSUIT STATE loader (account-first UX, UX-03, 2026-10-05): gathers what the pure projection (state.ts) decides on,
 * from readers GAP already has and nothing else: the account brief and inputs (motion type, opportunity truth, first
 * touches, family hold), the account context (restriction, history), the cockpit's own queue and account motion (the
 * same read the Ready lane uses), the newest motion choice and audited persona assignment, the reply list, and the ONE
 * owner-resolution read for the cold first touch. Every read is soft: a failed read leaves its slot empty and the page
 * still renders (the send gates fail closed on their own). Nothing is written. House `prisma: any` glue.
 */
import type { AccountIntelligenceBrief, AccountInputs } from '../account-intel/build';
import type { AccountContext } from '../context/context';
import { listQueue } from '../routing/queue';
import { cockpitOpenHref } from '../routing/card-readiness';
import { laneWithMotion, loadCockpitMotions } from '../motion/cockpit';
import { EMAIL_ACTIONS, MOTION_UNLOCK_BUSINESS_DAYS } from '../motion/account-motion';
import { loadMotionChoices } from '../motion/load';
import { loadAnchorChoices } from '../motion/persona-angle';
import { loadSellerPreferences } from '../people/seller-preference';
import { hypothesisSendable } from '../research/evidence-gate';
import { EVIDENCE_SIGNAL_SELECT } from '../sequence/render';
import { listReplies } from '../replies/list';
import { loadOwnerResolution } from '../people/owner-resolution-load';
import type { OwnerResolution } from '../people/owner-resolution';
import { buildPeopleStack, type PeopleStack } from '../people/stack';
import { readyTargetOf, type ReadyTarget } from '../context/send-target';
import { isRealRelationship, projectPursuitState, type PursuitInput, type PursuitReply, type PursuitState } from './state';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

const soft = <T,>(p: Promise<T>, fallback: T): Promise<T> => p.catch(() => fallback);

export interface PursuitView {
  state: PursuitState;
  resolution: OwnerResolution | null;
  stack: PeopleStack | null;
  /** The hypothesis the first touch runs on: the chosen person's recorded anchor (UX-06, Option A) when it is a grounded open thesis here, else the top grounded one. */
  hypothesisId: string | null;
  /** The chosen person's recorded anchor choice, if any (even when no longer usable). */
  anchorChoice: string | null;
  /** The open theses whose opening the send gate would let out (null when the read failed: nothing is called usable). */
  sendableTheses: Set<string> | null;
  /** The usable theses (open, grounded, not under review, and ones the send gate would let out): the only openers. */
  usableTheses: string[];
  /** The cockpit's ready first-touch card for this account (what loadReadyTarget returns), from the same queue read. */
  ready: ReadyTarget | null;
}

/** "Reply from Courtney Keen: I am in the office but ..." (context/context.ts projectHistory). */
const HISTORY_REPLY = /^Reply from\s+([^:<]+?)\s*(?:<[^>]*>)?\s*:\s*([\s\S]*)$/;

export async function loadPursuit(prisma: PrismaLike, args: { brief: AccountIntelligenceBrief; inputs: AccountInputs; ctx: AccountContext; now: Date }): Promise<PursuitView> {
  const { brief, inputs, ctx, now } = args;
  const accountName = inputs.account.name;

  const [resolutionRes, queue, choices, assigned, repliesPage, preferences] = await Promise.all([
    soft(loadOwnerResolution(prisma, { accountName, purpose: 'COLD_FIRST_TOUCH', now }), null),
    soft(listQueue(prisma, { accountName, limit: 200 }), { items: [], asOf: null } as unknown as Awaited<ReturnType<typeof listQueue>>),
    soft(loadMotionChoices(prisma, [accountName]), new Map()),
    soft(loadAssignedPersona(prisma, accountName), null),
    soft(listReplies(prisma, { state: 'all', limit: 200 }), { items: [], nextCursor: null }),
    soft(loadSellerPreferences(prisma, accountName, now), new Map()),
  ]);
  const resolution = resolutionRes && 'ok' in resolutionRes && resolutionRes.ok ? resolutionRes.resolution : null;

  // The cockpit's account motion and lanes, from the same read the Ready lane uses.
  const motions = queue.items.length ? await soft(loadCockpitMotions(prisma, queue.items, now), null) : null;
  const mine = motions?.motions.find((m) => m.accountName === accountName) ?? null;
  const held = new Set(motions?.heldCardIds ?? []);
  const thesisHeld = new Set(motions?.thesisHeldCardIds ?? []);
  const due = queue.items.find((it) => laneWithMotion(it, held, thesisHeld) === 'follow_up') ?? null;

  // Replies: the GAP mailbox list (with its triage state) and the account history's reply rows (older threads).
  const replies: PursuitReply[] = [];
  for (const r of repliesPage.items.filter((x) => x.accountName === accountName)) {
    replies.push({ from: r.contactEmail, name: null, at: r.receivedAt, subject: r.subject, snippet: r.snippet, triaged: !!r.dispositionId });
  }
  const lastSend = ctx.history.filter((h) => h.kind === 'email_sent' || h.kind === 'asset_sent').sort((a, b) => b.at.localeCompare(a.at))[0] ?? null;
  for (const h of ctx.history.filter((x) => x.kind === 'reply')) {
    const m = h.text.match(HISTORY_REPLY);
    if (!m) continue;
    if (replies.some((r) => Math.abs(new Date(r.at).getTime() - new Date(h.at).getTime()) < 60_000)) continue;
    // Answered (a later send) counts as handled; otherwise the thread is still open.
    const answered = !!lastSend && lastSend.at > h.at;
    replies.push({ from: m[1].trim(), name: m[1].trim(), at: h.at, subject: null, snippet: m[2].trim(), triaged: answered });
  }

  const choice = choices.get(accountName) ?? null;
  const od = inputs.firstTouches.find((t) => t.state === 'draft outstanding') ?? null;
  // R10 parity: a proven GAP first touch inside the unlock window IS the motion, cockpit card or not (after a send the
  // card is acted and the queue read may hold nothing for the account, while the ledger holds the touch). The brief
  // already says "In motion" from the same ledger; the pursuit state must not read research over it.
  let motion = mine;
  if ((!motion || motion.state === 'idle') && !od) {
    const windowMs = (MOTION_UNLOCK_BUSINESS_DAYS + 2) * 86_400_000;
    const sent = inputs.firstTouches
      .filter((t) => t.state === 'sent' && t.sentAt && now.getTime() - new Date(t.sentAt).getTime() < windowMs)
      .sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)))[0];
    if (sent && typeof sent.personaId === 'number') {
      const who = inputs.personas.find((p) => p.id === sent.personaId);
      if (who) motion = { accountName, state: 'in_motion', primary: { cardId: '', personaId: who.id, name: who.name, title: who.title ?? null, email: sent.recipient, reason: 'the first touch was sent to them' }, next: null, alsoWaiting: [], heldCardIds: [], headline: `In motion: ${who.name} got a first touch on ${String(sent.sentAt).slice(0, 10)}. One cold email motion at a time.` } as unknown as typeof mine;
    }
  }
  const restriction = ctx.relationship.restriction;

  const input: PursuitInput = {
    accountName,
    now,
    motionType: brief.motion.type,
    opportunity: inputs.opportunity ?? { status: 'UNKNOWN', detail: 'opportunity truth not read', deals: [] },
    restriction: restriction ? { kind: restriction.kind, introducer: restriction.introducer, route: restriction.route } : null,
    familyHold: brief.family?.hold ? { detail: brief.family.hold.detail } : null,
    motion: motion ? { state: motion.state, primary: motion.primary ? { personaId: motion.primary.personaId, name: motion.primary.name, title: motion.primary.title } : null, next: motion.next ? { personaId: motion.next.personaId, name: motion.next.name, title: motion.next.title, unlock: motion.next.unlock } : null, headline: motion.headline } : null,
    choice: choice ? { personaId: choice.primaryPersonaId, by: choice.by, at: choice.at, source: 'motion' } : null,
    activePersona: assigned,
    replies,
    lastOutbound: lastSend ? { to: lastSend.text.replace(/^.*?\bto\s+/, '').slice(0, 80), at: lastSend.at, what: lastSend.text, source: 'GAP history' } : null,
    outstandingDraft: od ? { recipient: od.recipient, name: null, decisionId: od.decisionId ?? '' } : null,
    followUpDue: due ? { personaId: due.persona.id, name: due.persona.displayName ?? due.persona.email ?? 'the person', dueAt: due.touch?.dueAt ?? now.toISOString(), cardHref: cockpitOpenHref('follow_up', due.id) } : null,
    eligible: (resolution?.eligible ?? []).map((c) => ({ key: c.key, personaId: c.personaId, hubspotContactId: c.hubspotContactId, name: c.name, title: c.title })),
    // A relationship is real when you met them, were introduced or referred; a newsletter subscriber or a list
    // membership is a signal (contract 5.3), never a relationship that leads the account.
    relationship: brief.motion.met && isRealRelationship(brief.motion.met.sourceType, brief.motion.met.source)
      ? { name: brief.motion.met.name, title: brief.motion.met.title ?? null, why: `met at ${brief.motion.met.source}` }
      : brief.motion.type === 'REFERRAL_LED' && brief.motion.who
        ? { name: brief.motion.who, title: null, why: brief.motion.why }
        : null,
    briefNext: brief.glance.nextAction,
  };
  let state = projectPursuitState(input);
  // Only a HUMAN choice is passed as chosen (chosenBy set); a lone eligible person is the resolver's preselection and
  // reads "GAP: the only eligible person", never "Chosen by you" (trust review).
  const chosenKey = state.person?.chosenBy && (resolution?.eligible ?? []).some((c) => c.key === state.person!.key) ? state.person.key : null;
  // UX-07: the seller's set-asides and the motion's NEXT IF NO RESPONSE person travel with the stack.
  const nextCandidates = new Set<number>([...(mine?.alsoWaiting ?? []).map((p) => p.personaId), ...(mine?.next ? [mine.next.personaId] : [])]);
  const stack = resolution ? buildPeopleStack(resolution, { chosenKey, chosenBy: state.person?.chosenBy ?? null, preferences, nextPersonaId: mine?.next?.personaId ?? null, nextCandidates }) : null;
  // UX-06 (Option A): a recorded anchor choice switches the thesis the pack opens on, only to a grounded open thesis.
  const anchors = state.person?.personaId ? await soft(loadAnchorChoices(prisma, [state.person.personaId]), new Map()) : new Map();
  const anchorChoice: string | null = state.person?.personaId ? (anchors.get(state.person.personaId)?.hypothesisId ?? null) : null;
  const openStatuses = new Set(['approved', 'active', 'confirmed', 'partially_confirmed']);
  const anchored = anchorChoice ? brief.hypotheses.find((h) => h.id === anchorChoice && h.grounded && h.truth !== 'CONTRADICTED') ?? null : null;
  const sendableTheses = await soft(loadSendableTheses(prisma, accountName, now), null);
  // The pack opens on a USABLE thesis only (open, grounded, not under review, and one the send gate would let out),
  // the same set the anchor block shows; the recorded choice wins when it is usable. An unread gate opens nothing.
  const usable = (h: (typeof brief.hypotheses)[number] | null) => !!h && !!sendableTheses && sendableTheses.has(h.id) && h.needsReview.length === 0 && openStatuses.has(inputs.hypotheses.find((x) => x.id === h.id)?.status ?? '');
  const anchoredOpen = usable(anchored) ? anchored : null;
  const usableTheses = brief.hypotheses.filter((h) => h.grounded && h.truth !== 'CONTRADICTED' && usable(h)).map((h) => h.id);
  // Nobody is asked to choose who hears a first touch that nothing could open: without a usable thesis the account is
  // research (the people stand); a chosen person keeps READY, and NEXT says to review the angle first.
  if (state.state === 'choose_person' && sendableTheses && usableTheses.length === 0) {
    state = { ...state, state: 'research', stateLine: `Research: no usable angle to open on yet${state.stateLine.includes('eligible') ? ` (${state.stateLine.replace(/^.*\((\d+ eligible)\).*$/, '$1')})` : ''}`, coldTouchAllowed: false, blocker: `No thesis the send gate would let out grounds a first touch at ${accountName} yet. The people below stand; the angle is what is missing.`, unlock: 'A verified fact and an approved angle.' };
  }
  // Execution recovery R10/R12: a chosen GAP person with NO usable thesis is not Ready either (Work's cold card never
  // says Ready without one): the account is research with the person kept, and a proposal under review is the move.
  if (state.state === 'ready' && state.person?.personaId != null && !/^Relationship-led/.test(state.stateLine) && sendableTheses && usableTheses.length === 0) {
    const underReview = inputs.hypotheses.some((h) => h.status === 'review_required' || h.status === 'draft');
    state = { ...state, state: 'research', stateLine: underReview ? `Research: a proposal is under review for ${state.person.name}` : `Research: no usable angle to open on yet for ${state.person.name}`, coldTouchAllowed: false, blocker: underReview ? `A thesis for ${state.person.name} is waiting for your review on this page; the first touch is prepared once it is approved.` : `No thesis the send gate would let out grounds a first touch at ${accountName} yet. ${state.person.name} stands; the angle is what is missing.`, unlock: underReview ? 'Approve the proposal on this page.' : 'A verified fact and an approved angle.' };
  }
  const topUsable = brief.hypotheses.find((h) => usableTheses.includes(h.id)) ?? null;
  // R12: the cockpit records a motion only where it changes what the seller sees (two or more cards, a pause, a live
  // motion), so a one-card READY account has no motion and, before this, no ready target: NEXT then pointed at a
  // preview that pointed at the lane. The ready target is the person's own READY email card, motion or not.
  const readyCard = state.state === 'ready' && state.person?.personaId != null
    ? queue.items.find((it) => EMAIL_ACTIONS.has(it.action) && it.persona?.id === state.person!.personaId && laneWithMotion(it, held, thesisHeld) === 'ready') ?? null
    : null;
  const ready = readyTargetOf(mine) ?? (readyCard ? { name: state.person!.name, title: state.person!.title, href: cockpitOpenHref('ready', readyCard.id), headline: `Ready: ${state.person!.name}.` } : null);
  return { state, resolution, stack, hypothesisId: anchoredOpen?.id ?? topUsable?.id ?? null, anchorChoice, sendableTheses, usableTheses, ready };
}

/** UX-06: the account's open theses whose opening the send gate would let out (the pack's own rule over the linked signals). */
export async function loadSendableTheses(prisma: PrismaLike, accountName: string, now: Date): Promise<Set<string>> {
  const rows: Array<{ id: string; account_name: string; observation: string | null; signals: Array<{ role: string | null; signal: Record<string, unknown> | null }> }> = await prisma.prospectingHypothesis.findMany({
    where: { account_name: accountName, superseded_by: { is: null }, status: { in: ['approved', 'active', 'confirmed', 'partially_confirmed', 'review_required'] } },
    select: { id: true, account_name: true, observation: true, metadata: true, signals: { select: { role: true, signal: { select: EVIDENCE_SIGNAL_SELECT } } } },
    take: 50,
  });
  return new Set(rows.filter((r) => hypothesisSendable(r as never, now)).map((r) => r.id));
}

/** The newest audited HUMAN persona assignment on one of the account's active hypotheses (owner resolution USE). */
async function loadAssignedPersona(prisma: PrismaLike, accountName: string): Promise<PursuitInput['activePersona']> {
  const hyps: Array<{ id: string }> = await prisma.prospectingHypothesis.findMany({ where: { account_name: accountName, status: 'active' }, select: { id: true }, take: 50 });
  if (!hyps.length) return null;
  const row: { actor: string; payload: Record<string, unknown>; created_at: Date } | null = await prisma.gapAuditEvent.findFirst({
    where: { kind: 'hypothesis.persona_assigned', subject_type: 'hypothesis', subject_id: { in: hyps.map((h) => h.id) } },
    select: { actor: true, payload: true, created_at: true },
    orderBy: { created_at: 'desc' },
  });
  const pid = Number(row?.payload?.primaryPersonaId);
  if (!row || !Number.isInteger(pid)) return null;
  return { personaId: pid, at: new Date(row.created_at).toISOString(), by: row.actor };
}
