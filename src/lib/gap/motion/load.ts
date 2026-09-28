/**
 * What account motion needs from the database (Phase 2 C): Casey's recorded
 * primary / next choices, the account's recent GAP first touches (from the
 * append-only send ledger), and an account reply still waiting for triage.
 * Read only, except `recordMotionChoice` (one append-only audit row).
 */
import { DIRECT_SENT, DRAFTED, DRAFT_DISCARDED, DRAFT_SENT, DRAFT_SUBJECT_TYPE, MANUAL_SENT } from '../execution/draft-ledger';
import { isHardBounceStatus } from '../../email/bounce';
import { accountRepliedRecently } from '../replies/account-reply';
import { ACCOUNT_MOTION, MOTION_UNLOCK_BUSINESS_DAYS, type FirstTouch, type MotionChoice } from './account-motion';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** First touches older than this can no longer hold a motion (the unlock window is far shorter). */
const FIRST_TOUCH_LOOKBACK_MS = 30 * 86_400_000;

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
      kind: { in: [DIRECT_SENT, MANUAL_SENT, DRAFTED, DRAFT_SENT, DRAFT_DISCARDED] },
    },
    select: { kind: true, subject_id: true, payload: true, created_at: true },
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
    touches.push({ account, personaId: Number.isInteger(pid) ? pid : null, recipient: String(r.payload?.recipient ?? '').toLowerCase(), sentAt, released: false, ...(outstanding ? { outstanding: true } : {}) });
  };
  for (const r of rows) {
    if (r.kind === DIRECT_SENT || r.kind === MANUAL_SENT) push(r, String(r.payload?.sentAt ?? new Date(r.created_at).toISOString()), false);
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
    list.push({ personaId: t.personaId, recipient: t.recipient, sentAt: t.sentAt, released: t.released, ...(t.outstanding ? { outstanding: true } : {}) });
    out.set(t.account, list);
  }
  return out;
}

/** An account reply nobody has triaged yet, found through any address GAP holds at the account. */
export async function loadReplyHolds(prisma: PrismaLike, emailsByAccount: ReadonlyMap<string, string>, now: Date): Promise<Map<string, { from: string; receivedAt: string }>> {
  const out = new Map<string, { from: string; receivedAt: string }>();
  for (const [account, email] of emailsByAccount) {
    const r = await accountRepliedRecently(prisma, email, now);
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
): Promise<{ owner: string; sentAt: string; unlockAt: string } | null> {
  const { addBusinessDays } = await import('../sequence/business-days');
  const touches = (await loadAccountFirstTouches(prisma, [input.accountName], input.now)).get(input.accountName) ?? [];
  const email = input.email.trim().toLowerCase();
  for (const t of touches.sort((a, b) => b.sentAt.localeCompare(a.sentAt))) {
    if (t.released) continue;
    if ((t.personaId !== null && t.personaId === input.personaId) || t.recipient === email) continue;
    // An outstanding draft holds until it is sent or deleted; its unlock date is not yet known.
    if (t.outstanding) return { owner: t.recipient || `person ${t.personaId}`, sentAt: t.sentAt, unlockAt: 'after that draft is sent or deleted' };
    const unlockAt = addBusinessDays(new Date(t.sentAt), MOTION_UNLOCK_BUSINESS_DAYS);
    if (input.now.getTime() < unlockAt.getTime()) return { owner: t.recipient || `person ${t.personaId}`, sentAt: t.sentAt, unlockAt: unlockAt.toISOString() };
  }
  return null;
}
