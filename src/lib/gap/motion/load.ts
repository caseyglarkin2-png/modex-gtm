/**
 * What account motion needs from the database (Phase 2 C): Casey's recorded
 * primary / next choices, the account's recent GAP first touches (from the
 * append-only send ledger), and an account reply still waiting for triage.
 * Read only, except `recordMotionChoice` (one append-only audit row).
 */
import { DIRECT_CLAIMED, DIRECT_RELEASED, DIRECT_SENT, DRAFTED, DRAFT_CLAIMED, DRAFT_DISCARDED, DRAFT_SENT, DRAFT_SUBJECT_TYPE, MANUAL_SENT } from '../execution/draft-ledger';
import { historyFromRows } from '../execution/person-history';
import { isHardBounceStatus } from '../../email/bounce';
import { accountRepliedRecently } from '../replies/account-reply';
import { ACCOUNT_MOTION, MOTION_UNLOCK_BUSINESS_DAYS, type FirstTouch, type MotionChoice } from './account-motion';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** First touches older than this can no longer hold a motion (the unlock window is far shorter). */
const FIRST_TOUCH_LOOKBACK_MS = 30 * 86_400_000;

/**
 * Final review P1 (practitioner + buyer lenses): once a buyer at the account has
 * RESPONDED (a human-confirmed disposition that is a real answer: a problem
 * confirmed or rejected, not a priority, a meeting, a request, an objection, do
 * not contact), the account is in a conversation. The motion never unlocks a
 * colleague for a cold first touch "with no response" after that: going around
 * a buyer's answer is Casey's call, never the queue's. Not a response: a call
 * nobody answered, a voicemail, a gatekeeper, an out of office, a bounce, no
 * signal, wrong person, and a referral (the buyer pointed at a colleague).
 */
export const CONVERSATION_RESPONSE_CLASSES: ReadonlySet<string> = new Set([
  'problem_confirmed',
  'problem_partially_confirmed',
  'problem_rejected',
  'not_priority',
  'timing',
  'existing_solution',
  'request_information',
  'meeting_accepted',
  'meeting_declined',
  'do_not_contact',
]);
export const ACCOUNT_CONVERSATION_DAYS = 90;

export interface AccountConversation {
  who: string;
  responseClass: string;
  at: string;
}

/** The newest buyer response at each account in the window (human-confirmed only). */
export async function loadAccountConversations(prisma: PrismaLike, accountNames: readonly string[], now: Date): Promise<Map<string, AccountConversation>> {
  const out = new Map<string, AccountConversation>();
  if (accountNames.length === 0 || !prisma.conversationDisposition?.findMany) return out;
  const rows: Array<{ account_name: string; contact_email: string; response_class: string; created_at: Date }> = await prisma.conversationDisposition.findMany({
    where: {
      account_name: { in: [...accountNames] },
      human_confirmed: true,
      response_class: { in: [...CONVERSATION_RESPONSE_CLASSES] },
      created_at: { gte: new Date(now.getTime() - ACCOUNT_CONVERSATION_DAYS * 86_400_000) },
    },
    select: { account_name: true, contact_email: true, response_class: true, created_at: true },
    orderBy: { created_at: 'desc' },
  });
  for (const r of rows) {
    // Belt and braces over the query: only a real answer with a real date counts.
    if (!CONVERSATION_RESPONSE_CLASSES.has(r.response_class) || !r.created_at || Number.isNaN(new Date(r.created_at).getTime())) continue;
    if (!out.has(r.account_name)) out.set(r.account_name, { who: String(r.contact_email).toLowerCase(), responseClass: r.response_class, at: new Date(r.created_at).toISOString() });
  }
  return out;
}

export async function loadMotionChoices(prisma: PrismaLike, accountNames: readonly string[]): Promise<Map<string, MotionChoice>> {
  const out = new Map<string, MotionChoice>();
  if (accountNames.length === 0) return out;
  const rows: Array<{ subject_id: string; actor: string; payload: Record<string, unknown>; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: { kind: ACCOUNT_MOTION, subject_type: 'account', subject_id: { in: [...accountNames] } },
    select: { subject_id: true, actor: true, payload: true, created_at: true },
    orderBy: { created_at: 'desc' },
  });
  for (const r of rows) {
    if (out.has(r.subject_id)) continue;
    const primary = Number(r.payload?.primaryPersonaId);
    if (!Number.isInteger(primary)) continue;
    const next = Number(r.payload?.nextPersonaId);
    out.set(r.subject_id, { primaryPersonaId: primary, nextPersonaId: Number.isInteger(next) ? next : null, by: r.actor, at: new Date(r.created_at).toISOString() });
  }
  return out;
}

export type MotionChoiceRefusal = 'persona_not_at_account' | 'same_person';

/** Casey's choice of primary (and optional next) for an account's email motion. Append-only. */
export async function recordMotionChoice(
  prisma: PrismaLike,
  input: { accountName: string; primaryPersonaId: number; nextPersonaId: number | null; actor: string },
): Promise<{ ok: true } | { ok: false; reason: MotionChoiceRefusal }> {
  if (input.nextPersonaId !== null && input.nextPersonaId === input.primaryPersonaId) return { ok: false, reason: 'same_person' };
  const ids = [input.primaryPersonaId, ...(input.nextPersonaId !== null ? [input.nextPersonaId] : [])];
  const people: Array<{ id: number; account_name: string }> = await prisma.persona.findMany({ where: { id: { in: ids } }, select: { id: true, account_name: true } });
  if (people.length !== ids.length || people.some((p) => p.account_name !== input.accountName)) return { ok: false, reason: 'persona_not_at_account' };
  await prisma.gapAuditEvent.create({
    data: { kind: ACCOUNT_MOTION, actor: input.actor, subject_type: 'account', subject_id: input.accountName, payload: { primaryPersonaId: input.primaryPersonaId, nextPersonaId: input.nextPersonaId } },
  });
  return { ok: true };
}

/**
 * GAP first touches (step 0) at each account in the lookback: Gmail-proven
 * sends (direct, manual, a draft proven sent) and drafts still outstanding (a
 * first touch in flight). `released` when the person's address has since
 * failed (hard bounce, invalid, do not contact, unsubscribed).
 */
export async function loadAccountFirstTouches(prisma: PrismaLike, accountNames: readonly string[], now: Date): Promise<Map<string, FirstTouch[]>> {
  const out = new Map<string, FirstTouch[]>();
  if (accountNames.length === 0) return out;
  const decisions: Array<{ id: string; account_name: string }> = await prisma.routingDecision.findMany({ where: { account_name: { in: [...accountNames] } }, select: { id: true, account_name: true } });
  if (decisions.length === 0) return out;
  const accountOf = new Map(decisions.map((d) => [d.id, d.account_name]));
  // No created_at window here (review C P1): a draft made weeks ago can be sent from Gmail today,
  // and an outstanding one holds for as long as it is outstanding. The window applies to send times below.
  const rows: Array<{ kind: string; subject_id: string; payload: Record<string, unknown>; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: {
      subject_type: DRAFT_SUBJECT_TYPE,
      subject_id: { in: decisions.map((d) => d.id) },
      kind: { in: [DIRECT_SENT, MANUAL_SENT, DRAFTED, DRAFT_SENT, DRAFT_DISCARDED, DIRECT_CLAIMED, DRAFT_CLAIMED, DIRECT_RELEASED] },
    },
    select: { id: true, kind: true, subject_id: true, payload: true, created_at: true },
  });
  const since = now.getTime() - FIRST_TOUCH_LOOKBACK_MS;
  const drafted = new Map<string, { row: (typeof rows)[number] }>();
  const sentOf = new Map<string, string>();
  const discarded = new Set<string>();
  for (const r of rows) {
    const draftId = String(r.payload?.gmailDraftId ?? '');
    if (!draftId) continue;
    if (r.kind === DRAFTED) drafted.set(draftId, { row: r });
    // A proven send wins over a discard (the same rule as listDraftRecords).
    if (r.kind === DRAFT_SENT) sentOf.set(draftId, String(r.payload?.sentAt ?? new Date(r.created_at).toISOString()));
    if (r.kind === DRAFT_DISCARDED) discarded.add(draftId);
  }
  const touches: Array<FirstTouch & { account: string }> = [];
  const push = (r: (typeof rows)[number], sentAt: string, outstanding: boolean) => {
    const account = String(r.payload?.accountName ?? accountOf.get(r.subject_id) ?? '');
    if (!account) return;
    if (Number(r.payload?.stepIndex ?? 0) !== 0) return;
    if (!outstanding && new Date(sentAt).getTime() < since) return;
    const pid = Number(r.payload?.personaId);
    const draftId = String(r.payload?.gmailDraftId ?? '');
    touches.push({ account, personaId: Number.isInteger(pid) ? pid : null, recipient: String(r.payload?.recipient ?? '').toLowerCase(), sentAt, released: false, ...(outstanding ? { outstanding: true } : {}), ...(outstanding && draftId ? { decisionId: r.subject_id, gmailDraftId: draftId } : {}) });
  };
  for (const r of rows) {
    if (r.kind === DIRECT_SENT || r.kind === MANUAL_SENT) push(r, String(r.payload?.sentAt ?? new Date(r.created_at).toISOString()), false);
  }
  // Final review P1 (reliability lens): a first touch whose outcome is not recorded (Gmail may have sent it,
  // or a draft may exist) holds the account exactly like an outstanding draft, until it is reconciled.
  const unresolved = historyFromRows(rows as never, null, '', [...accountOf.keys()]).unresolvedClaims.filter((c) => c.stepIndex === null || c.stepIndex === 0);
  const claimRow = new Map(rows.map((r) => [String((r as { id?: string }).id ?? ''), r]));
  for (const c of unresolved) {
    const account = accountOf.get(c.decisionId);
    if (!account) continue;
    // The claim row names its person; the key is only the fallback (older keys carry no person).
    const payload = claimRow.get(c.eventId)?.payload ?? {};
    const m = /^gmail_direct:person:([^:]+):(.+):step:\d+/.exec(c.idempotencyKey);
    const pid = Number(payload.personaId ?? (m ? m[1] : NaN));
    const recipient = String(payload.recipient ?? m?.[2] ?? '').toLowerCase();
    touches.push({ account, personaId: Number.isInteger(pid) ? pid : null, recipient, sentAt: c.claimedAt, released: false, outstanding: true });
  }
  // A live GAP enrollment (the modex queue or a HubSpot sequence row) queued this person's first touch.
  const enrollments: unknown[] = prisma.sequenceEnrollment?.findMany
    ? await prisma.sequenceEnrollment.findMany({
        where: { account_name: { in: [...accountNames] }, created_at: { gte: new Date(since) }, is_test: false, legacy: false },
        select: { account_name: true, persona_id: true, to_email: true, created_at: true },
      })
    : [];
  for (const e of enrollments as Array<{ account_name: string; persona_id: number | null; to_email?: string | null; created_at: Date }>) {
    touches.push({ account: e.account_name, personaId: e.persona_id ?? null, recipient: String(e.to_email ?? '').toLowerCase(), sentAt: new Date(e.created_at).toISOString(), released: false });
  }
  for (const [draftId, d] of drafted) {
    const sentAt = sentOf.get(draftId);
    // Review C P1: a draft proven sent is dated by its real Gmail send; one still outstanding holds
    // the account until it is sent or deleted (Casey can press Send in Gmail at any time).
    if (sentAt) push(d.row, sentAt, false);
    else if (!discarded.has(draftId)) push(d.row, String(d.row.payload?.createdAt ?? new Date(d.row.created_at).toISOString()), true);
  }
  // Released when the address has since failed.
  const pids = [...new Set(touches.map((t) => t.personaId).filter((x): x is number => x !== null))];
  const personas: Array<{ id: number; do_not_contact: boolean; email_status: string | null }> = pids.length ? await prisma.persona.findMany({ where: { id: { in: pids } }, select: { id: true, do_not_contact: true, email_status: true } }) : [];
  const failed = new Set(personas.filter((p) => p.do_not_contact || isHardBounceStatus(p.email_status)).map((p) => p.id));
  const recipients = [...new Set(touches.map((t) => t.recipient).filter(Boolean))];
  const unsub: Array<{ email: string }> = recipients.length ? await prisma.unsubscribedEmail.findMany({ where: { email: { in: recipients } }, select: { email: true } }) : [];
  const unsubscribed = new Set(unsub.map((u) => u.email.toLowerCase()));
  for (const t of touches) {
    t.released = (t.personaId !== null && failed.has(t.personaId)) || unsubscribed.has(t.recipient);
    const list = out.get(t.account) ?? [];
    list.push({ personaId: t.personaId, recipient: t.recipient, sentAt: t.sentAt, released: t.released, ...(t.outstanding ? { outstanding: true } : {}), ...(t.decisionId && t.gmailDraftId ? { decisionId: t.decisionId, gmailDraftId: t.gmailDraftId } : {}) });
    out.set(t.account, list);
  }
  return out;
}

/** An account reply nobody has triaged yet, found through any address GAP holds at the account. */
export async function loadReplyHolds(prisma: PrismaLike, emailsByAccount: ReadonlyMap<string, string>, now: Date): Promise<Map<string, { from: string; receivedAt: string }>> {
  const out = new Map<string, { from: string; receivedAt: string }>();
  for (const [account, email] of emailsByAccount) {
    // Final review P1: every company domain at the account, not only this card's.
    const r = await accountRepliedRecently(prisma, email, now, { accountName: account });
    if (r) out.set(account, { from: r.from_email, receivedAt: new Date(r.received_at).toISOString() });
  }
  return out;
}

/**
 * C3 enforcement at the send gate: a cold first touch to this person is
 * refused while ANOTHER person at the account holds a live GAP first touch
 * inside the unlock window. Null when the motion allows it.
 */
export async function accountMotionRefusal(
  prisma: PrismaLike,
  input: { accountName: string; personaId: number | null; email: string; now: Date },
): Promise<{ owner: string; sentAt: string; unlockAt: string; detail: string } | null> {
  const { addBusinessDays } = await import('../sequence/business-days');
  const email = input.email.trim().toLowerCase();
  const conversation = (await loadAccountConversations(prisma, [input.accountName], input.now)).get(input.accountName);
  if (conversation && conversation.who !== email) {
    return {
      owner: conversation.who,
      sentAt: conversation.at,
      unlockAt: 'never automatically',
      detail: `${conversation.who} at this account answered (${conversation.responseClass.replace(/_/g, ' ')}, ${conversation.at.slice(0, 10)}). The account is in a conversation: a cold first touch to anyone else there is your call, not the queue's.`,
    };
  }
  const touches = (await loadAccountFirstTouches(prisma, [input.accountName], input.now)).get(input.accountName) ?? [];
  const describe = (owner: string, sentAt: string, unlock: string) =>
    `${owner} at this account has a first touch from ${sentAt.slice(0, 10)}. One cold email motion at a time: the next person unlocks ${unlock}, or at once if that address fails.`;
  for (const t of touches.sort((a, b) => b.sentAt.localeCompare(a.sentAt))) {
    if (t.released) continue;
    if ((t.personaId !== null && t.personaId === input.personaId) || t.recipient === email) continue;
    // An outstanding draft holds until it is sent or deleted; its unlock date is not yet known.
    const owner = t.recipient || `person ${t.personaId}`;
    if (t.outstanding) return { owner, sentAt: t.sentAt, unlockAt: 'after that draft is sent or deleted', detail: describe(owner, t.sentAt, 'after that draft is sent or deleted (or the unrecorded send is reconciled)') };
    const unlockAt = addBusinessDays(new Date(t.sentAt), MOTION_UNLOCK_BUSINESS_DAYS);
    if (input.now.getTime() < unlockAt.getTime()) return { owner, sentAt: t.sentAt, unlockAt: unlockAt.toISOString(), detail: describe(owner, t.sentAt, `on ${unlockAt.toISOString().slice(0, 10)} with no response`) };
  }
  return null;
}

export interface RecentFirstTouch {
  accountName: string;
  personaId: number | null;
  recipient: string;
  /** 'sent': a proven send; 'drafted': a GAP draft still outstanding in the mailbox. */
  state: 'sent' | 'drafted';
  at: string;
}

/** Accounts touched by GAP in the window, from the send ledger alone (R14): newest touch per account. */
export async function loadRecentFirstTouchAccounts(prisma: PrismaLike, now: Date, lookbackMs = FIRST_TOUCH_LOOKBACK_MS): Promise<Map<string, RecentFirstTouch>> {
  const out = new Map<string, RecentFirstTouch>();
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return out;
  const rows: Array<{ kind: string; payload: Record<string, unknown> | null; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: { kind: { in: [DIRECT_SENT, MANUAL_SENT, DRAFT_SENT, DRAFTED, DRAFT_DISCARDED] }, subject_type: DRAFT_SUBJECT_TYPE, created_at: { gte: new Date(now.getTime() - lookbackMs) } },
    select: { kind: true, payload: true, created_at: true },
    orderBy: { created_at: 'desc' },
  });
  const discarded = new Set<string>();
  const sentDrafts = new Set<string>();
  for (const r of rows) {
    const draftId = String(r.payload?.gmailDraftId ?? '');
    if (r.kind === DRAFT_DISCARDED && draftId) discarded.add(draftId);
    if (r.kind === DRAFT_SENT && draftId) sentDrafts.add(draftId);
  }
  for (const r of rows) {
    const account = String(r.payload?.accountName ?? '').trim();
    if (!account || out.has(account)) continue;
    if (r.kind === DRAFT_DISCARDED) continue;
    const draftId = String(r.payload?.gmailDraftId ?? '');
    if (r.kind === DRAFTED && (discarded.has(draftId) || sentDrafts.has(draftId))) continue;
    const pid = Number(r.payload?.personaId);
    out.set(account, {
      accountName: account,
      personaId: Number.isInteger(pid) ? pid : null,
      recipient: String(r.payload?.recipient ?? ''),
      state: r.kind === DRAFTED ? 'drafted' : 'sent',
      at: String(r.payload?.sentAt ?? r.created_at.toISOString()),
    });
  }
  return out;
}
