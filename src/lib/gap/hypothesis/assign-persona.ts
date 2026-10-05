/**
 * HYPOTHESIS PERSONA ASSIGNMENT (owner resolution, 2026-10-05). An approved account-level hypothesis (proposed from
 * research, no person attached) gets the person Casey chose to test it with. It says exactly one thing: "Casey chose
 * this person to test this approved account hypothesis with." It never rewrites the narrative, never pretends the
 * fact was person-specific, and never activates on its own (activation is the machine's own transition, with every
 * guard, on Casey's next click or in the same governed action).
 *
 * Recorded on the hypothesis's own event log (hypothesis_events, action `assign_persona`: prior and new
 * primary_persona_id, actor, timestamp, source, candidate evidence) and mirrored to the audit ledger
 * (hypothesis.persona_assigned). The persona MUST belong to the same canonical account; suppression (do-not-contact,
 * unsubscribed) and contact currentness (LEFT / CONFLICT) refuse before any write. Once active the row is frozen:
 * an active motion is never casually retargeted.
 *
 * House `prisma: any` glue; the row moves under an optimistic status predicate like every other write here.
 */
import { audit as defaultAudit, recordHypothesisEvent } from '../audit';
import { employmentRefusal } from '../people/employment';
import { loadPersonaEmployment } from '../people/employment-store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** Statuses a person may be attached in: the hypothesis is not yet in use. */
export const ASSIGNABLE_STATUSES: readonly string[] = ['draft', 'review_required', 'approved'];

export type AssignPersonaRefusal =
  | 'not_found'
  | 'persona_not_found'
  | 'persona_not_at_account'
  | 'hypothesis_in_use'
  | 'hypothesis_closed'
  | 'persona_do_not_contact'
  | 'recipient_unsubscribed'
  | 'persona_left_account'
  | 'persona_employment_conflict'
  | 'stale_status'
  | 'same_person';

export interface AssignPersonaInput {
  hypothesisId: string;
  personaId: number;
  actor: string;
  now: Date;
  /** Why: the seller flow that chose them (owner resolution), with the candidate's reasons as evidence. */
  source: 'owner_resolution';
  evidence?: { candidateKey?: string | null; reasons?: string[]; hubspotContactId?: string | null; importStatus?: string | null };
}

export type AssignPersonaResult =
  | { ok: true; hypothesisId: string; status: string; priorPersonaId: number | null; personaId: number; eventId: string }
  | { ok: false; reason: AssignPersonaRefusal; detail?: string };

class Refusal extends Error {
  constructor(public readonly reason: AssignPersonaRefusal, public readonly detail?: string) {
    super(reason);
  }
}

export async function assignHypothesisPersona(prisma: PrismaLike, input: AssignPersonaInput, deps: { audit?: typeof defaultAudit } = {}): Promise<AssignPersonaResult> {
  const row: { id: string; account_name: string; status: string; primary_persona_id: number | null; problem_family: string } | null = await prisma.prospectingHypothesis.findUnique({
    where: { id: input.hypothesisId },
    select: { id: true, account_name: true, status: true, primary_persona_id: true, problem_family: true },
  });
  if (!row) return { ok: false, reason: 'not_found' };
  if (row.status === 'active') return { ok: false, reason: 'hypothesis_in_use', detail: 'The hypothesis is in use; an active motion is not retargeted here.' };
  if (!ASSIGNABLE_STATUSES.includes(row.status)) return { ok: false, reason: 'hypothesis_closed', detail: row.status };
  if (row.primary_persona_id === input.personaId) return { ok: false, reason: 'same_person' };

  const persona: { id: number; account_name: string; name: string; email: string | null; do_not_contact: boolean } | null = await prisma.persona.findUnique({
    where: { id: input.personaId },
    select: { id: true, account_name: true, name: true, email: true, do_not_contact: true },
  });
  if (!persona) return { ok: false, reason: 'persona_not_found' };
  // The same canonical account, by name: a family account's person is not this account's owner.
  if (persona.account_name !== row.account_name) return { ok: false, reason: 'persona_not_at_account', detail: `${persona.name} is a GAP contact at ${persona.account_name}, not ${row.account_name}.` };
  if (persona.do_not_contact) return { ok: false, reason: 'persona_do_not_contact' };
  const email = String(persona.email ?? '').trim().toLowerCase();
  if (email) {
    const unsub = await prisma.unsubscribedEmail.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true } });
    if (unsub) return { ok: false, reason: 'recipient_unsubscribed' };
  }
  // Contact currentness at decision time (amendment H): a departed or conflicted person is never attached.
  const employment = await loadPersonaEmployment(prisma, persona.id, { now: input.now });
  const blocked = employment ? employmentRefusal(employment.state) : null;
  if (blocked) return { ok: false, reason: blocked, detail: employment?.why };

  try {
    const eventId: string = await prisma.$transaction(async (tx: PrismaLike) => {
      const moved = await tx.prospectingHypothesis.updateMany({ where: { id: row.id, status: row.status, primary_persona_id: row.primary_persona_id }, data: { primary_persona_id: persona.id } });
      if (moved.count !== 1) throw new Refusal('stale_status');
      return recordHypothesisEvent(prisma, tx, {
        hypothesisId: row.id,
        fromStatus: row.status,
        toStatus: row.status,
        action: 'assign_persona',
        actor: input.actor,
        reason: input.source,
        payload: {
          priorPrimaryPersonaId: row.primary_persona_id,
          primaryPersonaId: persona.id,
          personaName: persona.name,
          source: input.source,
          at: input.now.toISOString(),
          employment: employment ? { state: employment.state, why: employment.why } : null,
          evidence: input.evidence ?? null,
          narrativeChanged: false,
        },
      });
    });
    const auditFn = deps.audit ?? defaultAudit;
    try {
      void auditFn(prisma, {
        kind: 'hypothesis.persona_assigned',
        actor: input.actor,
        subjectType: 'hypothesis',
        subjectId: row.id,
        payload: { priorPrimaryPersonaId: row.primary_persona_id, primaryPersonaId: persona.id, status: row.status, source: input.source, evidence: input.evidence ?? null },
        review: { target: row.account_name, title: `assign_persona ${row.problem_family}`, intent: `Casey chose ${persona.name} to test this approved account hypothesis with` },
      }).catch(() => undefined);
    } catch {
      // the ledger never gates the assignment
    }
    return { ok: true, hypothesisId: row.id, status: row.status, priorPersonaId: row.primary_persona_id, personaId: persona.id, eventId };
  } catch (e) {
    if (e instanceof Refusal) return { ok: false, reason: e.reason, detail: e.detail };
    throw e;
  }
}
