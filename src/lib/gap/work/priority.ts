/**
 * THE SELLER'S EXPLICIT PRIORITY (GAP OS execution recovery, R41, 2026-10-06): "this account first, because ...",
 * set per account with a one-line reason, as append-only `account.priority` rows (the newest wins; `clear` ends it).
 * Work reads it as the third tie-break inside a tier (after the due time and the newest buyer activity) and says so on
 * the card; it never lifts a hold, never makes cold work outrank a buyer's obligation, and never writes anywhere else.
 * No second queue: the priority lives on the account and Work reads it.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const ACCOUNT_PRIORITY = 'account.priority' as const;
export const PRIORITY_REASON_MAX = 140;

export interface AccountPriority {
  accountName: string;
  reason: string;
  by: string;
  at: string;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** The standing priority per account (newest row wins; a `clear` reads as none). */
export async function loadAccountPriorities(prisma: PrismaLike, accountNames: readonly string[]): Promise<Map<string, AccountPriority>> {
  const out = new Map<string, AccountPriority>();
  if (accountNames.length === 0 || typeof prisma?.gapAuditEvent?.findMany !== 'function') return out;
  const rows: Array<{ subject_id: string; actor: string; payload: unknown; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: { kind: ACCOUNT_PRIORITY, subject_type: 'account', subject_id: { in: [...accountNames] } },
    select: { subject_id: true, actor: true, payload: true, created_at: true },
    orderBy: { created_at: 'desc' },
  });
  const seen = new Set<string>();
  for (const r of rows) {
    if (seen.has(r.subject_id)) continue;
    seen.add(r.subject_id);
    const p = isObj(r.payload) ? r.payload : {};
    if (p.level !== 'high' || typeof p.reason !== 'string') continue;
    out.set(r.subject_id, { accountName: r.subject_id, reason: p.reason, by: r.actor, at: new Date(r.created_at).toISOString() });
  }
  return out;
}

export type RecordPriorityResult = { ok: true; priority: AccountPriority | null } | { ok: false; reason: 'account_not_found' | 'reason_required' | 'reason_too_long' };

export async function recordAccountPriority(prisma: PrismaLike, input: { accountName: string; level: 'high' | 'clear'; reason?: string | null; actor: string; now: Date }): Promise<RecordPriorityResult> {
  const account = await prisma.account.findUnique({ where: { name: input.accountName }, select: { name: true } });
  if (!account) return { ok: false, reason: 'account_not_found' };
  const reason = (input.reason ?? '').replace(/\s+/g, ' ').trim();
  if (input.level === 'high' && !reason) return { ok: false, reason: 'reason_required' };
  if (reason.length > PRIORITY_REASON_MAX) return { ok: false, reason: 'reason_too_long' };
  await prisma.gapAuditEvent.create({ data: { kind: ACCOUNT_PRIORITY, actor: input.actor, subject_type: 'account', subject_id: account.name, payload: { level: input.level, reason: reason || null } } });
  return { ok: true, priority: input.level === 'high' ? { accountName: account.name, reason, by: input.actor, at: input.now.toISOString() } : null };
}
