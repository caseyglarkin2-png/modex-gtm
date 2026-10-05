/**
 * THE DECISION-TIME EMPLOYMENT GATE (owner resolution, 2026-10-05). Contact currentness is evaluated when GAP is
 * about to RELY on a person: showing them as actionable WHO, attaching them to a hypothesis, routing them, creating
 * a Gmail draft, sending, enrolling. One helper, one answer, from the evidence on record (database only: a human
 * correction, a derived verification, the intakes' fields, a buyer interaction). No network, no Apollo, never a
 * render-time research call. A departed (LEFT_COMPANY_CONFIRMED) or conflicted (EMPLOYMENT_CONFLICT) person fails
 * closed at every one of those seams with the same two reasons; it is never do-not-contact.
 */
import { employmentRefusal, type EmploymentState } from './employment';
import { loadPersonaEmployment } from './employment-store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type EmploymentGateReason = 'persona_left_account' | 'persona_employment_conflict';

export interface EmploymentGateRefusal {
  reason: EmploymentGateReason;
  state: EmploymentState;
  detail: string;
}

/**
 * Null when the person may be relied on at their account (current, likely, unverified, or no persona). A fake
 * without the persona delegate reads as not blocked (production always has it).
 */
export async function employmentGate(prisma: PrismaLike, personaId: number | null | undefined, now: Date): Promise<EmploymentGateRefusal | null> {
  if (typeof personaId !== 'number' || typeof prisma?.persona?.findMany !== 'function') return null;
  const read = await loadPersonaEmployment(prisma, personaId, { now });
  if (!read) return null;
  const reason = employmentRefusal(read.state);
  if (!reason) return null;
  return { reason, state: read.state, detail: read.why };
}
