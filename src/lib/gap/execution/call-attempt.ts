/**
 * CALL ATTEMPTS (X16a, GAP OS sales execution engine, 2026-10-08). Server only.
 *
 * Calls are first-class activity, truthfully. Releasing the dial link from a card is recorded as an ATTEMPT
 * (`call.attempt_started`, basis self-reported: the seller clicked the link; nothing proves the phone rang). It is
 * never a call: a call is a confirmed disposition on the call channel (disposition/service.ts), which is what the
 * scorecard counts and what makes the follow-up (work/commitments.ts, X16b). The brief reads the attempts as the
 * person's timeline (X16c). A LinkedIn release records nothing here. Fail-open: the link is released whether or not
 * the row is written.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const CALL_ATTEMPT_STARTED = 'call.attempt_started';
export const CALL_ATTEMPT_SUBJECT = 'routing_decision';

export interface CallAttemptInput {
  decisionId: string;
  accountName: string;
  personaId: number | null;
  channel: 'call' | 'linkedin';
  actor: string;
  now: Date;
}

export async function recordCallAttempt(prisma: PrismaLike, input: CallAttemptInput): Promise<{ recorded: boolean }> {
  if (input.channel !== 'call' || typeof prisma?.gapAuditEvent?.create !== 'function') return { recorded: false };
  try {
    await prisma.gapAuditEvent.create({
      data: {
        kind: CALL_ATTEMPT_STARTED,
        actor: input.actor,
        subject_type: CALL_ATTEMPT_SUBJECT,
        subject_id: input.decisionId,
        payload: { accountName: input.accountName, personaId: input.personaId, basis: 'self_reported', at: input.now.toISOString() },
      },
    });
    return { recorded: true };
  } catch {
    return { recorded: false };
  }
}

export interface CallAttemptRow {
  decisionId: string;
  accountName: string | null;
  at: string;
}

/** The recorded attempts on a person, newest first (for the brief's timeline). Soft: an unreadable ledger reads as none. */
export async function loadCallAttempts(prisma: PrismaLike, personaId: number, opts: { take?: number } = {}): Promise<CallAttemptRow[]> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return [];
  const rows: Array<{ subject_id: string; payload: unknown; created_at: Date | string }> = await prisma.gapAuditEvent
    .findMany({ where: { kind: CALL_ATTEMPT_STARTED, payload: { path: ['personaId'], equals: personaId } }, orderBy: { created_at: 'desc' }, take: opts.take ?? 10, select: { subject_id: true, payload: true, created_at: true } })
    .catch(() => []);
  return rows.map((r) => {
    const p = (r.payload && typeof r.payload === 'object' ? r.payload : {}) as Record<string, unknown>;
    return { decisionId: r.subject_id, accountName: typeof p.accountName === 'string' ? p.accountName : null, at: new Date(r.created_at).toISOString() };
  });
}
