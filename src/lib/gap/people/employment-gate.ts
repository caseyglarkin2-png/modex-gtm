/**
 * THE DECISION-TIME EMPLOYMENT GATE (owner resolution, 2026-10-05). Contact currentness is evaluated when GAP is
 * about to RELY on a person: showing them as actionable WHO, attaching them to a hypothesis, routing them, creating
 * a Gmail draft, sending, enrolling. One helper, one answer, from the SAME evidence the owner panel reads: the
 * record (a human correction, a derived verification, the intakes' fields, a buyer interaction), the account's own
 * names and domains, and the person's linked HubSpot row (Apollo's sweep writes apollo_employment_status there;
 * review B1: the gate once read less than the panel and let a conflicted person through). The HubSpot read is one
 * cached batch read with a short timeout; when it cannot be read, the gate decides on the record and says so. No
 * Apollo call, never a render-time research call. A departed (LEFT_COMPANY_CONFIRMED) or conflicted
 * (EMPLOYMENT_CONFLICT) person fails closed at every one of those seams with the same two reasons; it is never
 * do-not-contact.
 */
import { employmentRefusal, type EmploymentState } from './employment';
import { accountEmploymentContext, loadPersonaEmployment, type HubSpotEmploymentProps } from './employment-store';
import { hubspotPeopleReads, loadHubSpotEmploymentProps, type HubSpotPeopleReads } from './hubspot-people';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type EmploymentGateReason = 'persona_left_account' | 'persona_employment_conflict';

export interface EmploymentGateRefusal {
  reason: EmploymentGateReason;
  state: EmploymentState;
  detail: string;
}

export interface EmploymentGateDeps {
  /** The live HubSpot read of the person's linked contact. `null`: skip it (tests). Default: the real read when HubSpot is configured. */
  hubspot?: HubSpotPeopleReads | null;
  /** How long the HubSpot read may take before the gate decides on the record alone (default 3 s). */
  timeoutMs?: number;
}

const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('hubspot_timeout')), ms);
    (t as { unref?: () => void }).unref?.();
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });

/**
 * Null when the person may be relied on at their account (current, likely, unverified, or no persona). A fake
 * without the persona delegate reads as not blocked (production always has it).
 */
export async function employmentGate(prisma: PrismaLike, personaId: number | null | undefined, now: Date, deps: EmploymentGateDeps = {}): Promise<EmploymentGateRefusal | null> {
  if (typeof personaId !== 'number' || typeof prisma?.persona?.findMany !== 'function') return null;
  const rows: Array<{ id: number; account_name: string; hubspot_contact_id: string | null }> = await prisma.persona.findMany({ where: { id: { in: [personaId] } }, select: { id: true, account_name: true, hubspot_contact_id: true } });
  const persona = rows.find((r) => r.id === personaId) ?? rows[0];
  if (!persona) return null;
  const ctx = await accountEmploymentContext(prisma, persona.account_name).catch(() => ({ aliases: [] as string[], domains: [] as string[] }));
  const reads = deps.hubspot === undefined ? (process.env.HUBSPOT_ACCESS_TOKEN ? hubspotPeopleReads : null) : deps.hubspot;
  let hubspot: Map<string, HubSpotEmploymentProps> | undefined;
  let hubspotNote = '';
  const contactId = persona.hubspot_contact_id ? String(persona.hubspot_contact_id).trim() : '';
  if (reads && contactId) {
    try {
      hubspot = await withTimeout(loadHubSpotEmploymentProps([contactId], reads, now.getTime()), deps.timeoutMs ?? 3000);
    } catch {
      hubspotNote = ' (HubSpot could not be read just now: decided on the record alone.)';
    }
  }
  const read = await loadPersonaEmployment(prisma, personaId, { now, hubspot, aliasesFor: () => ctx.aliases, domainsFor: () => ctx.domains });
  if (!read) return null;
  const reason = employmentRefusal(read.state);
  if (!reason) return null;
  return { reason, state: read.state, detail: `${read.why}${hubspotNote}` };
}
