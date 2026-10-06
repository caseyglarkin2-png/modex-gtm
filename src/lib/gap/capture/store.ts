/**
 * BUYER TRUTH CAPTURE (Phase 2 D1-D4, 2026-09-28).
 *
 * After a real conversation, often on a phone, Casey saves what the buyer
 * said as a RAW NOTE (paste, transcript or dictation). The note is kept as
 * written. The machine proposes candidate Buyer Input Data (capture/extract.ts:
 * verbatim sentences with a proposed type); nothing is truth until Casey
 * confirms a candidate, which records a normal human-confirmed BID through
 * the existing BID service. Rejected candidates are recorded, never deleted.
 *
 * Storage: the append-only GAP audit ledger, the no-new-table decision the
 * draft ledger and account motion also use.
 *   capture.note        the raw note, its context, account/person (or an
 *                       unlinked hint), and the candidates proposed once
 *   capture.linked      Casey resolved an unlinked note to an account/person
 *   capture.candidate   Casey confirmed (with the BID id) or rejected a candidate
 *   capture.meeting     a meeting outcome recorded from the note
 * Identity is never invented: an ambiguous account or person stays unlinked
 * until Casey resolves it.
 */
import { randomUUID } from 'node:crypto';
import { recordBid } from '../bid/service';
import { recordDisposition } from '../disposition/service';
import { BID_TYPES, type BidType } from '../taxonomy';
import { buyerSpeakers, excludedLines, extractCandidates, extractCommitments, quoteInSource, quoteWithinSentence, sentencesWithSpeaker, type CandidateBid, type CandidateCommitment } from './extract';
import { ensureCommitment } from '../work/commitments';
import { isDay, nyDayAt } from '../work/dates';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const CAPTURE_NOTE = 'capture.note' as const;
export const CAPTURE_LINKED = 'capture.linked' as const;
export const CAPTURE_CANDIDATE = 'capture.candidate' as const;
export const CAPTURE_MEETING = 'capture.meeting' as const;
export const CAPTURE_SUBJECT = 'capture' as const;

export const CAPTURE_CONTEXTS = ['meeting', 'call', 'conference', 'email', 'linkedin'] as const;
export type CaptureContext = (typeof CAPTURE_CONTEXTS)[number];
/** The BID source a context records as (a conference conversation is a meeting). */
export const BID_SOURCE_OF: Record<CaptureContext, 'meeting' | 'call' | 'email' | 'linkedin'> = { meeting: 'meeting', call: 'call', conference: 'meeting', email: 'email', linkedin: 'linkedin' };

export const MEETING_OUTCOMES = ['qualified_problem', 'disqualified_problem', 'more_discovery', 'no_decision', 'next_meeting'] as const;
export type MeetingOutcome = (typeof MEETING_OUTCOMES)[number];
/** Each meeting outcome as the existing response class (the meeting-to-qualified-problem metric reads channel meeting). */
export const MEETING_RESPONSE_CLASS: Record<MeetingOutcome, string> = {
  qualified_problem: 'problem_confirmed',
  disqualified_problem: 'problem_rejected',
  more_discovery: 'no_signal',
  no_decision: 'no_signal',
  next_meeting: 'meeting_accepted',
};

export const RAW_TEXT_MAX = 20_000;

export interface CaptureView {
  id: string;
  accountName: string | null;
  accountHint: string | null;
  personaId: number | null;
  context: CaptureContext;
  rawText: string;
  createdAt: string;
  createdBy: string;
  candidates: Array<CandidateBid & { decision: null | { kind: 'confirmed'; bidId: string; type: string; by: string } | { kind: 'rejected'; by: string } }>;
  meetings: Array<{ outcome: MeetingOutcome; dispositionId: string | null; nextLearningObjective: string | null; at: string }>;
  /** R44: the deal the action that opened Capture named, when it did. */
  dealId: string | null;
  /** R44: what opened Capture (a Work card, a reply, an obligation, the account page), when known. */
  source: { kind: string; id: string } | null;
  /** R44: the obligations the note states (who owes what by when), each confirmed into a commitment or rejected. */
  commitments: Array<CandidateCommitment & { decision: null | { kind: 'confirmed'; commitmentId: string; by: string } | { kind: 'rejected'; by: string } }>;
  /** R44: the lines never proposed as buyer words (a pasted summary, the seller's own read), with why. */
  excluded: Array<{ text: string; reason: string }>;
}

/** R44: what opened Capture, from the link's `from` (a Work card, a reply, an obligation, the account page). */
export const CAPTURE_SOURCE_KINDS = ['work', 'reply', 'commitment', 'account', 'meeting'] as const;

export type CaptureRefusal =
  | 'empty_note'
  | 'note_too_long'
  | 'bad_context'
  | 'account_not_found'
  | 'persona_not_at_account'
  | 'capture_not_found'
  | 'candidate_not_found'
  | 'already_decided'
  | 'quote_not_in_source'
  | 'bad_bid_type'
  | 'capture_unlinked'
  | 'hypothesis_not_at_account'
  | 'no_contact'
  | 'bad_outcome'
  | 'quote_required'
  | 'speaker_required'
  | 'contact_not_at_account'
  | 'bad_due'
  | 'title_required';

type Ok<T> = { ok: true } & T;
type Refused = { ok: false; reason: CaptureRefusal; detail?: string };

async function audit(prisma: PrismaLike, kind: string, actor: string, captureId: string, payload: Record<string, unknown>) {
  await prisma.gapAuditEvent.create({ data: { kind, actor, subject_type: CAPTURE_SUBJECT, subject_id: captureId, payload: JSON.parse(JSON.stringify(payload)) } });
}

/** Save a raw note and propose candidates once. Unknown account text is kept as an unlinked hint, never guessed. */
export async function createCapture(
  prisma: PrismaLike,
  input: { accountName?: string | null; accountHint?: string | null; personaId?: number | null; dealId?: string | null; source?: { kind: string; id: string } | null; context: string; rawText: string; actor: string; now: Date },
): Promise<Ok<{ capture: CaptureView }> | Refused> {
  const raw = String(input.rawText ?? '');
  if (!raw.trim()) return { ok: false, reason: 'empty_note' };
  if (raw.length > RAW_TEXT_MAX) return { ok: false, reason: 'note_too_long' };
  if (!(CAPTURE_CONTEXTS as readonly string[]).includes(input.context)) return { ok: false, reason: 'bad_context' };
  let accountName: string | null = null;
  if (input.accountName?.trim()) {
    const a = await prisma.account.findUnique({ where: { name: input.accountName.trim() }, select: { name: true } });
    if (!a) return { ok: false, reason: 'account_not_found' };
    accountName = a.name;
  }
  let personaId: number | null = null;
  if (input.personaId != null) {
    const p = await prisma.persona.findUnique({ where: { id: input.personaId }, select: { id: true, account_name: true } });
    if (!p || (accountName && p.account_name !== accountName)) return { ok: false, reason: 'persona_not_at_account' };
    personaId = p.id;
    accountName = accountName ?? p.account_name;
  }
  const id = randomUUID();
  const candidates = extractCandidates(raw);
  const source = input.source && (CAPTURE_SOURCE_KINDS as readonly string[]).includes(input.source.kind) && input.source.id?.trim() ? { kind: input.source.kind, id: input.source.id.trim().slice(0, 200) } : null;
  await audit(prisma, CAPTURE_NOTE, input.actor, id, {
    accountName,
    accountHint: accountName ? null : input.accountHint?.trim() || null,
    personaId,
    context: input.context,
    rawText: raw,
    candidates,
    capturedAt: input.now.toISOString(),
    // R44: the deal and the action that opened Capture, the obligations the note states and what is never buyer words.
    dealId: input.dealId?.trim() || null,
    source,
    commitments: extractCommitments(raw, input.now),
    excluded: excludedLines(raw),
  });
  const view = await loadCapture(prisma, id);
  return view ? { ok: true, capture: view } : { ok: false, reason: 'capture_not_found' };
}

export async function loadCapture(prisma: PrismaLike, id: string): Promise<CaptureView | null> {
  const rows: Array<{ kind: string; actor: string; payload: Record<string, unknown>; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: { subject_type: CAPTURE_SUBJECT, subject_id: id },
    orderBy: { created_at: 'asc' },
    select: { kind: true, actor: true, payload: true, created_at: true },
  });
  const note = rows.find((r) => r.kind === CAPTURE_NOTE);
  if (!note) return null;
  const p = note.payload;
  let accountName = (p.accountName as string | null) ?? null;
  let personaId = typeof p.personaId === 'number' ? p.personaId : null;
  for (const r of rows.filter((x) => x.kind === CAPTURE_LINKED)) {
    accountName = String(r.payload.accountName ?? accountName ?? '') || null;
    personaId = typeof r.payload.personaId === 'number' ? r.payload.personaId : personaId;
  }
  const decisions = new Map<string, CaptureView['candidates'][number]['decision']>();
  const commitmentDecisions = new Map<string, CaptureView['commitments'][number]['decision']>();
  for (const r of rows.filter((x) => x.kind === CAPTURE_CANDIDATE)) {
    const cid = String(r.payload.candidateId ?? '');
    if (!cid) continue;
    if (typeof r.payload.commitmentCandidate === 'boolean' && r.payload.commitmentCandidate) {
      if (commitmentDecisions.has(cid)) continue;
      commitmentDecisions.set(cid, r.payload.decision === 'confirmed' ? { kind: 'confirmed', commitmentId: String(r.payload.commitmentId), by: r.actor } : { kind: 'rejected', by: r.actor });
      continue;
    }
    if (decisions.has(cid)) continue;
    decisions.set(cid, r.payload.decision === 'confirmed' ? { kind: 'confirmed', bidId: String(r.payload.bidId), type: String(r.payload.type), by: r.actor } : { kind: 'rejected', by: r.actor });
  }
  const candidates = (Array.isArray(p.candidates) ? (p.candidates as CandidateBid[]) : []).map((c) => ({ ...c, decision: decisions.get(c.id) ?? null }));
  const commitments = (Array.isArray(p.commitments) ? (p.commitments as CandidateCommitment[]) : []).map((c) => ({ ...c, decision: commitmentDecisions.get(c.id) ?? null }));
  return {
    id,
    accountName,
    accountHint: (p.accountHint as string | null) ?? null,
    personaId,
    context: p.context as CaptureContext,
    rawText: String(p.rawText ?? ''),
    createdAt: new Date(note.created_at).toISOString(),
    createdBy: note.actor,
    candidates,
    meetings: rows
      .filter((r) => r.kind === CAPTURE_MEETING)
      .map((r) => ({ outcome: r.payload.outcome as MeetingOutcome, dispositionId: (r.payload.dispositionId as string | null) ?? null, nextLearningObjective: (r.payload.nextLearningObjective as string | null) ?? null, at: new Date(r.created_at).toISOString() })),
    dealId: typeof p.dealId === 'string' ? p.dealId : null,
    source: p.source && typeof (p.source as { kind?: unknown }).kind === 'string' ? (p.source as { kind: string; id: string }) : null,
    commitments,
    excluded: Array.isArray(p.excluded) ? (p.excluded as Array<{ text: string; reason: string }>) : [],
  };
}

/**
 * R44: the seller's decision on one obligation the note states. CONFIRM makes it an R40 commitment (one-shot: its id
 * is this capture and candidate, so a double tap or a retry makes one), with the edited title and day, the person
 * (who asked, or who promised) and the deal from the note; its basis is the verbatim sentence with its speaker (the
 * seller's own words say "You", never a buyer quote). REJECT records the rejection. Either way, once.
 */
export async function decideCommitmentCandidate(
  prisma: PrismaLike,
  input: { captureId: string; candidateId: string; decision: 'confirm' | 'reject'; title?: string | null; dueDay?: string | null; personaId?: number | null; actor: string; now: Date },
): Promise<Ok<{ commitmentId: string | null; capture: CaptureView }> | Refused> {
  const run = async (tx: PrismaLike): Promise<Ok<{ commitmentId: string | null; capture: CaptureView }> | Refused> => {
    const view = await loadCapture(tx, input.captureId);
    if (!view) return { ok: false, reason: 'capture_not_found' };
    const cand = view.commitments.find((c) => c.id === input.candidateId);
    if (!cand) return { ok: false, reason: 'candidate_not_found' };
    if (cand.decision) return { ok: false, reason: 'already_decided' };
    if (input.decision === 'reject') {
      await audit(tx, CAPTURE_CANDIDATE, input.actor, input.captureId, { candidateId: cand.id, commitmentCandidate: true, decision: 'rejected', quote: cand.quote });
      return { ok: true, commitmentId: null, capture: (await loadCapture(tx, input.captureId))! };
    }
    if (!view.accountName) return { ok: false, reason: 'capture_unlinked' };
    if (!quoteInSource(cand.quote, view.rawText)) return { ok: false, reason: 'quote_not_in_source' };
    const title = (input.title ?? cand.title).replace(/\s+/g, ' ').trim();
    if (!title) return { ok: false, reason: 'title_required' };
    const day = input.dueDay === undefined || input.dueDay === null ? cand.due?.day ?? null : input.dueDay.trim() || null;
    if (day && !isDay(day)) return { ok: false, reason: 'bad_due' };
    const pid = input.personaId ?? view.personaId;
    let person: { personaId: number | null; name: string | null; email: string | null } | null = null;
    if (pid != null) {
      const p = await tx.persona.findUnique({ where: { id: pid }, select: { id: true, name: true, email: true, account_name: true } });
      if (!p || p.account_name !== view.accountName) return { ok: false, reason: 'persona_not_at_account' };
      person = { personaId: p.id, name: p.name ?? null, email: p.email ?? null };
    }
    const r = await ensureCommitment(
      tx,
      {
        accountName: view.accountName,
        kind: cand.kind,
        title: title.slice(0, 200),
        basis: `${cand.speaker ?? 'In the note'}: "${cand.quote}"`,
        dueAt: day ? nyDayAt(day) : null,
        person,
        dealId: view.dealId,
        status: cand.kind === 'buyer_promise' ? 'waiting' : 'open',
        dependency: cand.kind === 'buyer_promise' ? `${person?.name ?? cand.speaker ?? 'their'} delivery` : null,
        source: { kind: 'capture', id: `${view.id}:${cand.id}` },
        detail: cand.due?.ambiguous ? { ambiguousDate: cand.due.phrase } : null,
      },
      { actor: input.actor, now: input.now },
    );
    if (!r.ok) return { ok: false, reason: r.reason === 'account_not_found' ? 'account_not_found' : r.reason === 'bad_due' ? 'bad_due' : 'title_required', detail: r.reason };
    await audit(tx, CAPTURE_CANDIDATE, input.actor, input.captureId, { candidateId: cand.id, commitmentCandidate: true, decision: 'confirmed', commitmentId: r.commitment.commitmentId, title, dueDay: day, quote: cand.quote });
    return { ok: true, commitmentId: r.commitment.commitmentId, capture: (await loadCapture(tx, input.captureId))! };
  };
  if (typeof prisma.$transaction !== 'function' || typeof prisma.$executeRaw !== 'function') return run(prisma);
  return prisma.$transaction(async (tx: PrismaLike) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`gap_capture:${input.captureId}`}))`;
    return run(tx);
  });
}

export interface BatchItem {
  candidateId: string;
  decision: 'confirm' | 'reject';
  type?: string | null;
  quote?: string | null;
  personaId?: number | null;
  title?: string | null;
  dueDay?: string | null;
}

/**
 * R44: ONE review of the whole note: every buyer statement and every obligation, each kept or rejected, each with
 * its own correction (a relabelled type, a shortened quote, who said it, an edited title or day). Each item runs
 * through the same single decision (so the gates are the same and nothing is recorded twice); one refusal never
 * blocks the others, and the answer says, per item, what happened.
 */
export async function decideBatch(
  prisma: PrismaLike,
  input: { captureId: string; hypothesisId?: string | null; items: BatchItem[]; actor: string; now: Date },
): Promise<Ok<{ results: Array<{ candidateId: string; ok: boolean; reason?: string; detail?: string; bidId?: string | null; commitmentId?: string | null }>; capture: CaptureView }> | Refused> {
  const view = await loadCapture(prisma, input.captureId);
  if (!view) return { ok: false, reason: 'capture_not_found' };
  const results: Array<{ candidateId: string; ok: boolean; reason?: string; detail?: string; bidId?: string | null; commitmentId?: string | null }> = [];
  for (const item of input.items) {
    if (/^k\d+$/.test(item.candidateId)) {
      const r = await decideCommitmentCandidate(prisma, { captureId: input.captureId, candidateId: item.candidateId, decision: item.decision, title: item.title, dueDay: item.dueDay, personaId: item.personaId, actor: input.actor, now: input.now });
      results.push(r.ok ? { candidateId: item.candidateId, ok: true, commitmentId: r.commitmentId } : { candidateId: item.candidateId, ok: false, reason: r.reason, detail: r.detail });
    } else {
      const r = await decideCandidate(prisma, { captureId: input.captureId, candidateId: item.candidateId, decision: item.decision, type: item.type, quote: item.quote, hypothesisId: input.hypothesisId ?? null, personaId: item.personaId, actor: input.actor, now: input.now });
      results.push(r.ok ? { candidateId: item.candidateId, ok: true, bidId: r.bidId } : { candidateId: item.candidateId, ok: false, reason: r.reason, detail: r.detail });
    }
  }
  return { ok: true, results, capture: (await loadCapture(prisma, input.captureId))! };
}

/** Resolve an unlinked note to an account (and optionally a person). Append-only. */
export async function linkCapture(prisma: PrismaLike, input: { captureId: string; accountName: string; personaId?: number | null; actor: string }): Promise<Ok<{ capture: CaptureView }> | Refused> {
  const view = await loadCapture(prisma, input.captureId);
  if (!view) return { ok: false, reason: 'capture_not_found' };
  const a = await prisma.account.findUnique({ where: { name: input.accountName.trim() }, select: { name: true } });
  if (!a) return { ok: false, reason: 'account_not_found' };
  if (input.personaId != null) {
    const p = await prisma.persona.findUnique({ where: { id: input.personaId }, select: { account_name: true } });
    if (!p || p.account_name !== a.name) return { ok: false, reason: 'persona_not_at_account' };
  }
  await audit(prisma, CAPTURE_LINKED, input.actor, input.captureId, { accountName: a.name, personaId: input.personaId ?? null });
  return { ok: true, capture: (await loadCapture(prisma, input.captureId))! };
}

async function contactFor(prisma: PrismaLike, accountName: string, personaId: number | null, explicit: string | null | undefined): Promise<{ email: string; personaId: number | null } | 'not_at_account' | null> {
  const e = (explicit ?? '').trim().toLowerCase();
  if (e) {
    // Review D: an explicit address must be a person GAP holds at THIS account (never another company's).
    const p = await prisma.persona.findFirst({ where: { email: { equals: e, mode: 'insensitive' }, account_name: accountName }, select: { id: true } });
    return p ? { email: e, personaId: p.id } : 'not_at_account';
  }
  if (personaId == null) return null;
  const p = await prisma.persona.findUnique({ where: { id: personaId }, select: { email: true, account_name: true } });
  if (!p || p.account_name !== accountName || !p.email) return null;
  return { email: String(p.email).toLowerCase(), personaId };
}

/**
 * Casey's decision on one candidate. CONFIRM records a human-confirmed BID
 * (the existing service) against a hypothesis at the note's account, with the
 * exact quote, optionally relabelled or with an edited quote that is STILL
 * verbatim in the note. REJECT records the rejection. Either way, once.
 */
export async function decideCandidate(prisma: PrismaLike, input: Parameters<typeof decideCandidateUnlocked>[1]): ReturnType<typeof decideCandidateUnlocked> {
  // Review D: one decision per candidate even under a double tap: serialize on the capture.
  if (typeof prisma.$transaction !== 'function' || typeof prisma.$executeRaw !== 'function') return decideCandidateUnlocked(prisma, input);
  return prisma.$transaction(async (tx: PrismaLike) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`gap_capture:${input.captureId}`}))`;
    return decideCandidateUnlocked(tx, input);
  });
}

async function decideCandidateUnlocked(
  prisma: PrismaLike,
  input: {
    captureId: string;
    candidateId: string;
    decision: 'confirm' | 'reject';
    type?: string | null;
    quote?: string | null;
    summary?: string | null;
    hypothesisId?: string | null;
    personaId?: number | null;
    contactEmail?: string | null;
    actor: string;
    now: Date;
  },
): Promise<Ok<{ bidId: string | null; capture: CaptureView }> | Refused> {
  const view = await loadCapture(prisma, input.captureId);
  if (!view) return { ok: false, reason: 'capture_not_found' };
  const cand = view.candidates.find((c) => c.id === input.candidateId);
  if (!cand) return { ok: false, reason: 'candidate_not_found' };
  if (cand.decision) return { ok: false, reason: 'already_decided' };
  if (input.decision === 'reject') {
    await audit(prisma, CAPTURE_CANDIDATE, input.actor, input.captureId, { candidateId: cand.id, decision: 'rejected', quote: cand.quote });
    return { ok: true, bidId: null, capture: (await loadCapture(prisma, input.captureId))! };
  }
  const quote = (input.quote ?? cand.quote).trim();
  if (!quoteInSource(quote, view.rawText)) return { ok: false, reason: 'quote_not_in_source' };
  // Review D: a shortened quote stays inside its own sentence (never a fragment of a seller line or a
  // neighbouring sentence) and keeps at least four words.
  if (input.quote && !quoteWithinSentence(quote, cand.quote)) return { ok: false, reason: 'quote_not_in_source', detail: 'An edited quote must stay inside its own sentence and keep at least four words.' };
  const type = (input.type ?? cand.type) as BidType;
  if (!(BID_TYPES as readonly string[]).includes(type)) return { ok: false, reason: 'bad_bid_type' };
  if (!view.accountName) return { ok: false, reason: 'capture_unlinked' };
  const hyp = input.hypothesisId ? await prisma.prospectingHypothesis.findUnique({ where: { id: input.hypothesisId }, select: { id: true, account_name: true } }) : null;
  if (!hyp || hyp.account_name !== view.accountName) return { ok: false, reason: 'hypothesis_not_at_account' };
  // Review D P1: on a note with more than one buyer speaker, WHO said it is Casey's explicit choice
  // for this candidate; the note's person is never assumed for every line.
  const multiSpeaker = buyerSpeakers(view.rawText).length > 1;
  if (multiSpeaker && input.personaId == null && !input.contactEmail) return { ok: false, reason: 'speaker_required', detail: `This note has more than one speaker${cand.speaker ? ` (this line: ${cand.speaker})` : ''}. Choose who said it.` };
  const contact = await contactFor(prisma, view.accountName, multiSpeaker ? (input.personaId ?? null) : (input.personaId ?? view.personaId), input.contactEmail);
  if (contact === 'not_at_account') return { ok: false, reason: 'contact_not_at_account' };
  if (!contact) return { ok: false, reason: 'no_contact', detail: 'Choose who said it (a person at the account) so the words are never assigned to the wrong contact.' };
  const r = await recordBid(prisma, {
    hypothesisId: hyp.id,
    contactEmail: contact.email,
    type,
    rawBuyerLanguage: quote,
    normalizedSummary: input.summary?.trim() || null,
    source: BID_SOURCE_OF[view.context],
    metadata: { captureId: view.id, candidateId: cand.id, proposedBy: 'machine', proposedType: cand.type, confirmedFromCapture: true },
    actor: input.actor,
    actorKind: 'human',
    now: input.now,
  });
  if (!r.ok) return { ok: false, reason: 'no_contact', detail: `BID not recorded: ${r.reason}` };
  await audit(prisma, CAPTURE_CANDIDATE, input.actor, input.captureId, { candidateId: cand.id, decision: 'confirmed', bidId: r.bidId, type, quote, hypothesisId: hyp.id, contactEmail: contact.email });
  return { ok: true, bidId: r.bidId, capture: (await loadCapture(prisma, input.captureId))! };
}

/**
 * A MEETING OUTCOME from the note (D4): a human-confirmed disposition on
 * channel meeting (what the meeting-to-qualified-problem metric reads), plus
 * the five-way outcome and an optional next learning objective. A meeting is
 * not success by existing: "qualified problem" needs the buyer's own words
 * from the note.
 */
export async function recordMeetingOutcome(
  prisma: PrismaLike,
  input: { captureId: string; outcome: string; hypothesisId: string; personaId?: number | null; contactEmail?: string | null; buyerQuote?: string | null; nextLearningObjective?: string | null; actor: string; now: Date },
): Promise<Ok<{ dispositionId: string | null; capture: CaptureView }> | Refused> {
  if (!(MEETING_OUTCOMES as readonly string[]).includes(input.outcome)) return { ok: false, reason: 'bad_outcome' };
  const outcome = input.outcome as MeetingOutcome;
  const view = await loadCapture(prisma, input.captureId);
  if (!view) return { ok: false, reason: 'capture_not_found' };
  if (!view.accountName) return { ok: false, reason: 'capture_unlinked' };
  const hyp = await prisma.prospectingHypothesis.findUnique({ where: { id: input.hypothesisId }, select: { id: true, account_name: true } });
  if (!hyp || hyp.account_name !== view.accountName) return { ok: false, reason: 'hypothesis_not_at_account' };
  const contact = await contactFor(prisma, view.accountName, input.personaId ?? view.personaId, input.contactEmail);
  if (contact === 'not_at_account') return { ok: false, reason: 'contact_not_at_account' };
  if (!contact) return { ok: false, reason: 'no_contact' };
  const quote = (input.buyerQuote ?? '').trim();
  if (outcome === 'qualified_problem') {
    if (!quote) return { ok: false, reason: 'quote_required', detail: 'A qualified problem needs the buyer’s own words from the note.' };
    if (!quoteInSource(quote, view.rawText)) return { ok: false, reason: 'quote_not_in_source' };
    // Final review P1 (practitioner lens): the BUYER's words. A line labelled as the seller never
    // qualifies a problem, and the quote must sit inside one buyer sentence (as confirmed BIDs must).
    if (!sentencesWithSpeaker(view.rawText).some((x) => quoteWithinSentence(quote, x.sentence))) {
      return { ok: false, reason: 'quote_not_in_source', detail: 'The quote must be the buyer’s own words from one sentence of the note, never a line you said.' };
    }
    // Review D P1, carried over: with more than one buyer speaker, Casey says who said it.
    if (buyerSpeakers(view.rawText).length > 1 && input.personaId == null && !input.contactEmail) {
      return { ok: false, reason: 'speaker_required', detail: 'This note has more than one speaker. Choose who said it.' };
    }
  }
  const d = await recordDisposition(prisma, {
    hypothesisId: hyp.id,
    personaId: contact.personaId,
    contactEmail: contact.email,
    channel: 'meeting',
    responseClass: MEETING_RESPONSE_CLASS[outcome],
    buyerLanguage: quote || null,
    nextBestAction: input.nextLearningObjective?.trim() || null,
    source: { kind: 'meeting', id: view.id },
    actor: input.actor,
    actorKind: 'human',
    now: input.now,
  });
  if (!d.ok) return { ok: false, reason: 'bad_outcome', detail: `disposition not recorded: ${JSON.stringify(d).slice(0, 200)}` };
  const dispositionId = d.dispositionId ?? null;
  await audit(prisma, CAPTURE_MEETING, input.actor, view.id, { outcome, dispositionId, hypothesisId: hyp.id, accountName: view.accountName, nextLearningObjective: input.nextLearningObjective?.trim() || null });
  return { ok: true, dispositionId, capture: (await loadCapture(prisma, view.id))! };
}

/** Recent notes for the capture page (unlinked first). */
export async function listRecentCaptures(prisma: PrismaLike, limit = 10): Promise<Array<{ id: string; accountName: string | null; accountHint: string | null; context: string; createdAt: string; pending: number }>> {
  const rows: Array<{ subject_id: string }> = await prisma.gapAuditEvent.findMany({ where: { kind: CAPTURE_NOTE, subject_type: CAPTURE_SUBJECT }, orderBy: { created_at: 'desc' }, take: limit, select: { subject_id: true } });
  const out = [];
  for (const r of rows) {
    const v = await loadCapture(prisma, r.subject_id);
    if (v) out.push({ id: v.id, accountName: v.accountName, accountHint: v.accountHint, context: v.context, createdAt: v.createdAt, pending: v.candidates.filter((c) => !c.decision).length });
  }
  return out.sort((a, b) => Number(!!a.accountName) - Number(!!b.accountName));
}
