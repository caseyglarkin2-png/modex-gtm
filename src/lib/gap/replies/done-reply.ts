/**
 * DONE ON A REPLY, recorded the way Capture records a reply (the DONE unification, 2026-10-10). Server only.
 *
 * Casey, verbatim: "Unify DONE activity handling. Route email-reply DONE through the same canonical activity recording
 * and HubSpot mirror used by Capture. Reuse the existing service. Preserve progress versus completion, activity type,
 * person/account associations and provenance. Retries must not duplicate either local activity or CRM records. A failed
 * mirror must remain visible and retryable without claiming CRM success."
 *
 * A COMPLETION DONE on a reply item (replies/commands-apply.ts; a progress note never reaches this file) is recorded
 * through the one disposition service (disposition/service.ts recordDisposition), exactly as Capture's reply review:
 *   - the reply is read the way Capture opens it (replies/list.ts loadReplyForCapture): the person, the persona, the
 *     account and the thesis come from the reply row, never from the plan item's words
 *   - the message is classified the way Capture classifies it (replies/classify.ts) and the class is the one the
 *     message itself states (capture/reply-kind.ts proposedReplyKind: an opt-out is do_not_contact, an automatic
 *     notice out_of_office, a failed address bounce, a named referral referral); a card the Work list showed as
 *     bounced keeps that reading (stricter, never looser); R5 review (finding 1): do not contact ONLY when the message
 *     itself is the opt-out: an opted-out card bound to any other message records nothing (`not_the_opt_out`), so the
 *     opt-out of one person is never written on another; a plain reply whose note names a dated meeting is
 *     meeting_accepted (by the seller's word); any other plain reply is request_information (a person wrote and the
 *     seller answered by hand, once: the class whose effect is exactly that). Nothing here enrolls or sends
 *   - the source is `{ kind: 'email_command', id: <the command's Gmail message id> }`, so the same command applied
 *     twice collides on the (source_kind, source_id) key: one disposition, one activity row (`disposition.recorded`),
 *     one HubSpot mirror call at most. The reply rides on the row as inbound_message_id; the seller's words and the
 *     provenance ride in metadata.provenance ("self-reported by email command"), never as the buyer's language
 *   - with no thesis on the reply (or a closed one), the row stands without one (the service's reply-triage rule)
 *   - a reply already recorded (Capture, or an earlier DONE by another command) is never recorded twice
 *
 * The mirror's outcome is said as it is: `mirrored` only when HubSpot holds the note; a failure is
 * `recorded_not_mirrored` with the reason and is retried (disposition/mirror-retry.ts, at most three times); a skip by
 * policy (the mirror off, no HubSpot contact) is `recorded_not_mirrored` with the reason and is not retried.
 */
import { dispositionMirrorKey } from '../hubspot-mirror';
import { proposedReplyKind, REPLY_KIND_WORDS, type ReplyKindClass } from '../capture/reply-kind';
import { recordDisposition as defaultRecordDisposition, type RecordDispositionDeps } from '../disposition/service';
import type { DoneFact } from '../work/done-note';
import { classifyReply, type ReplyClass } from './classify';
import { loadReplyForCapture } from './list';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** Why the class is what it is: the message states it, the seller's note names a meeting, or a plain reply the seller handled. */
export type DoneReplyBasis = 'message' | 'card' | 'note' | 'handled';

/** The refusal's words: the item's message is not the opt-out, so nothing is recorded on its writer. */
export const NOT_THE_OPT_OUT = "the item's message is not the opt-out";

/**
 * Pure: the disposition class of a completion DONE on a reply. Never a class that needs the buyer's words. R5 review
 * (finding 1): an opted-out card whose message is not itself the opt-out is refused (never do not contact on its writer).
 */
export function doneReplyClass(c: Pick<ReplyClass, 'kind' | 'human'>, facts: readonly DoneFact[], card: { stateKind?: string | null } = {}): { responseClass: ReplyKindClass; basis: DoneReplyBasis } | { refused: 'not_the_opt_out' } {
  if (card.stateKind === 'opted_out') return c.kind === 'opt_out' ? { responseClass: 'do_not_contact', basis: 'message' } : { refused: 'not_the_opt_out' };
  const stated = proposedReplyKind(c);
  if (stated) return { responseClass: stated, basis: 'message' };
  if (card.stateKind === 'bounced') return { responseClass: 'bounce', basis: 'card' };
  if (facts.some((f) => f.kind === 'meeting')) return { responseClass: 'meeting_accepted', basis: 'note' };
  return { responseClass: 'request_information', basis: 'handled' };
}

/** What the mirror came to, as a receipt. `retryable` only for a failure (a skip by policy is not retried). */
export type MirrorReceipt = { receipt: 'mirrored' } | { receipt: 'recorded_not_mirrored'; reason: string; retryable: boolean };

const SKIP_WORDS: Record<string, string> = {
  'skipped:gap_disabled': 'GAP is off',
  'skipped:gap_mirror_disabled': 'the GAP HubSpot mirror is off',
  'skipped:hubspot_sync_disabled': 'HubSpot sync is off',
  'skipped:no_contact_id': 'the person has no HubSpot contact in GAP',
};

/** Pure: a mirror status (the service's refusal reason or the mirror's own status) as a receipt. */
export function mirrorReceiptOf(status: string | null | undefined): MirrorReceipt {
  const s = String(status ?? '').trim();
  if (s === 'written' || s === 'skipped:already_mirrored') return { receipt: 'mirrored' };
  // R5 review (finding 4): another pass held the mirror's lease: its outcome is not known here, so it is read again.
  if (s === 'skipped:in_flight') return { receipt: 'recorded_not_mirrored', reason: 'another HubSpot mirror attempt was in progress', retryable: true };
  if (s.startsWith('skipped:')) return { receipt: 'recorded_not_mirrored', reason: SKIP_WORDS[s] ?? s.slice('skipped:'.length).replace(/_/g, ' '), retryable: false };
  const reason = (s.startsWith('error:') ? s.slice('error:'.length) : s).trim() || 'unknown error';
  return { receipt: 'recorded_not_mirrored', reason: reason.slice(0, 300), retryable: true };
}

export type ReplyDoneResult =
  | {
      kind: 'recorded';
      dispositionId: string;
      responseClass: ReplyKindClass;
      basis: DoneReplyBasis;
      contactEmail: string;
      mirror: MirrorReceipt;
      /** do_not_contact only: the consent writer recorded it. */
      unsubscribed: boolean;
      /** The same command was applied before (a retry after a lost answer): the row it wrote then, never a second one. */
      replay: boolean;
    }
  | { kind: 'recorded_before'; dispositionId: string; responseClass: string; contactEmail: string }
  | { kind: 'not_recorded'; reason: string; /** R5 review (finding 1): the opted-out item's message is not the opt-out. */ code?: 'not_the_opt_out' };

export interface ReplyDoneInput {
  replyId: string;
  /** The seller's words after DONE (the completion note, as read). */
  note: string;
  facts: readonly DoneFact[];
  /** The Gmail message id of the command: the disposition's source id and its idempotency key. */
  commandMessageId: string;
  /** The Work card's state kind (replied, opted_out, bounced): an opted-out card is recorded as do not contact. */
  stateKind?: string | null;
  actor: string;
  now: Date;
}

export interface ReplyDoneDeps {
  /** Defaults to Capture's reader (replies/list.ts loadReplyForCapture). */
  loadReply?: typeof loadReplyForCapture;
  /** Defaults to the one disposition service. */
  recordDisposition?: typeof defaultRecordDisposition;
  /** Passed through to the service (the mirror, the stops, the consent writer, the ledger). */
  disposition?: RecordDispositionDeps;
}

const REPLY_SOURCE_KINDS = ['inbound_message', 'hubspot_engagement'];

/** The reply's human-confirmed disposition already on record: Capture's (by its source) or a DONE's (by inbound_message_id). */
async function recordedFor(prisma: PrismaLike, replyId: string): Promise<{ id: string; source_kind: string; source_id: string; response_class: string } | null> {
  if (typeof prisma?.conversationDisposition?.findFirst !== 'function') return null;
  return prisma.conversationDisposition.findFirst({
    where: { human_confirmed: true, OR: [{ source_kind: { in: REPLY_SOURCE_KINDS }, source_id: replyId }, { source_kind: 'email_command', inbound_message_id: replyId }] },
    select: { id: true, source_kind: true, source_id: true, response_class: true },
    orderBy: { created_at: 'asc' },
  });
}

/** A replayed command: what its row's mirror came to (the mirror ledger keyed by the disposition), and the consent write. */
async function replayReceipt(prisma: PrismaLike, dispositionId: string): Promise<MirrorReceipt> {
  const row: { error?: string | null } | null = typeof prisma?.gapHubSpotMirror?.findUnique === 'function' ? await prisma.gapHubSpotMirror.findUnique({ where: { key: dispositionMirrorKey(dispositionId) } }).catch(() => null) : null;
  if (row && (row.error === null || row.error === undefined)) return { receipt: 'mirrored' };
  if (row?.error) return { receipt: 'recorded_not_mirrored', reason: String(row.error).slice(0, 300), retryable: true };
  // No mirror row: the first attempt's answer was lost before the mirror ran, or the mirror skipped by policy. Retried
  // (the mirror is idempotent by its key, and a policy skip says so on the retry row).
  return { receipt: 'recorded_not_mirrored', reason: 'the first attempt ended before the HubSpot mirror answered', retryable: true };
}

/** Record a completion DONE on a reply through the disposition service. Never throws for a refusal; the caller says it. */
export async function recordReplyDone(prisma: PrismaLike, input: ReplyDoneInput, deps: ReplyDoneDeps = {}): Promise<ReplyDoneResult> {
  const r = await (deps.loadReply ?? loadReplyForCapture)(prisma, input.replyId, input.now).catch(() => null);
  if (!r) return { kind: 'not_recorded', reason: 'GAP could not read the reply as one from a person at an account' };
  // The class first (pure): an opted-out item whose message is not the opt-out records nothing, recorded before or not.
  const cls = classifyReply({ snippet: r.text || r.item.snippet, subject: r.item.subject, from: r.item.contactEmail });
  const cl = doneReplyClass(cls, input.facts, { stateKind: input.stateKind });
  if ('refused' in cl) return { kind: 'not_recorded', reason: NOT_THE_OPT_OUT, code: 'not_the_opt_out' };
  const prior = await recordedFor(prisma, r.item.id).catch(() => null);
  if (prior && !(prior.source_kind === 'email_command' && prior.source_id === input.commandMessageId)) {
    return { kind: 'recorded_before', dispositionId: prior.id, responseClass: prior.response_class, contactEmail: r.item.contactEmail };
  }
  const { responseClass, basis } = cl;
  const record = deps.recordDisposition ?? defaultRecordDisposition;
  const body = (hypothesisId: string | null) => ({
    hypothesisId,
    accountName: r.item.accountName,
    inboundMessageId: r.item.id,
    personaId: r.item.personaId,
    contactEmail: r.item.contactEmail,
    channel: 'email',
    responseClass,
    buyerLanguage: null,
    source: { kind: 'email_command', id: input.commandMessageId },
    provenance: { basis: 'self_reported' as const, via: 'email_command' as const, commandMessageId: input.commandMessageId, note: input.note },
    actor: input.actor,
    actorKind: 'human' as const,
    now: input.now,
  });
  let d = await record(prisma, body(r.item.hypothesisId || null), deps.disposition);
  // A thesis that is closed (or gone) is not one this answer can sit on; the row stands without one, never on another.
  if (!d.ok && d.kind === 'refused' && (d.reason === 'hypothesis_terminal' || d.reason === 'hypothesis_not_found') && r.item.hypothesisId) {
    d = await record(prisma, body(null), deps.disposition);
  }
  if (d.ok) {
    const failed = d.refusals.find((x) => x.step === 'mirror');
    const mirror: MirrorReceipt = d.effects !== 'none' && d.effects.mirrored ? { receipt: 'mirrored' } : mirrorReceiptOf(failed?.reason ?? 'error:mirror not run');
    const unsubscribed = d.effects !== 'none' && d.effects.unsubscribed === true;
    return { kind: 'recorded', dispositionId: d.dispositionId, responseClass, basis, contactEmail: r.item.contactEmail, mirror, unsubscribed, replay: false };
  }
  if (d.kind === 'refused' && d.reason === 'duplicate_source' && d.existingId) {
    // The same command, applied again: the row it wrote then is the record. No second row, no second mirror call.
    const unsubscribed =
      responseClass === 'do_not_contact' && typeof prisma?.unsubscribedEmail?.findUnique === 'function'
        ? !!(await prisma.unsubscribedEmail.findUnique({ where: { email: r.item.contactEmail.trim().toLowerCase() } }).catch(() => null))
        : false;
    return { kind: 'recorded', dispositionId: d.existingId, responseClass, basis, contactEmail: r.item.contactEmail, mirror: await replayReceipt(prisma, d.existingId), unsubscribed, replay: true };
  }
  return { kind: 'not_recorded', reason: d.kind === 'invalid_body' ? `${d.field}: ${d.reason}` : d.reason };
}

/** The class in the seller's words, with why it is that class. */
export function classWords(responseClass: string, basis?: DoneReplyBasis): string {
  const words = (REPLY_KIND_WORDS as Record<string, string>)[responseClass] ?? responseClass.replace(/_/g, ' ');
  if (basis === 'note') return `"${words}" (your note names the meeting)`;
  if (basis === 'handled') return `"${words}" (a person wrote and you handled it; GAP's reading when the message says no more)`;
  if (basis === 'card') return `"${words}" (as the item showed it)`;
  return `"${words}"`;
}

/** The sentence the DONE answer carries about the record and HubSpot. Never says mirrored unless HubSpot holds it. */
export function recordLine(r: ReplyDoneResult): string {
  if (r.kind === 'not_recorded') return `No disposition was recorded (${r.reason}), so nothing was written to HubSpot.`;
  if (r.kind === 'recorded_before') return `What their reply means was recorded before (${classWords(r.responseClass)}); nothing was recorded twice.`;
  const head = `Recorded in GAP as ${classWords(r.responseClass, r.basis)}, self-reported by your DONE`;
  if (r.mirror.receipt === 'mirrored') return `${head}, and mirrored to HubSpot as a note on the contact.`;
  if (r.mirror.retryable) return `${head}; the HubSpot mirror failed: ${r.mirror.reason}; it will be retried.`;
  return `${head}; HubSpot was not written: ${r.mirror.reason}.`;
}
