/**
 * USE THIS PERSON (owner resolution, 2026-10-05): the one governed seller action behind ADD + USE IN ROUTING /
 * USE [NAME] IN ROUTING on an approved hypothesis. In order, each step audited on its own, failing closed at the
 * first refusal (approval is never rolled back; a step that did not run is reported as such):
 *
 *   1. import  (HubSpot-only person) the account-scoped import links them into THIS account (account-import.ts)
 *   2. check   the chosen person is an ELIGIBLE owner by the same owner resolution the UI showed (never a departed,
 *              conflicted, suppressed, other-region or divested person, whatever the client sent)
 *   3. assign  primary_persona_id on the approved hypothesis (assign-persona.ts; audited)
 *   4. activate the machine's own transition with every guard (optional: Casey may assign without using yet)
 *   5. route   that person at that account, shadow mode, targeted (routing/interactive.ts routeAfterUse)
 *
 * Nothing here drafts, sends or enrolls. The AI never picks: `candidate` is Casey's click.
 */
import { assignHypothesisPersona } from '../hypothesis/assign-persona';
import { transitionHypothesis } from '../hypothesis/service';
import { routeAfterUse, type RouteAfterUseResult } from '../routing/interactive';
import { importHubSpotContactToAccount, type AccountImportDeps } from './account-import';
import { loadOwnerResolution, type LoadOwnerResolutionDeps } from './owner-resolution-load';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface UseOwnerInput {
  hypothesisId: string;
  candidate: { personaId?: number | null; hubspotContactId?: string | null };
  /** false: attach only (Casey decides to use later). */
  activate: boolean;
  actor: string;
  now: Date;
}

export interface UseOwnerStep {
  step: 'import' | 'check' | 'assign' | 'activate' | 'route';
  ok: boolean;
  /** 'skipped' when an earlier step stopped the action. */
  status?: string;
  reason?: string;
  detail?: string;
}

export interface UseOwnerResult {
  ok: boolean;
  hypothesisId: string;
  /** The hypothesis status after the action (approval is never rolled back). */
  hypothesisStatus: string | null;
  personaId: number | null;
  personaName: string | null;
  steps: UseOwnerStep[];
  routing: RouteAfterUseResult | null;
}

export interface UseOwnerDeps {
  import?: typeof importHubSpotContactToAccount;
  resolve?: typeof loadOwnerResolution;
  assign?: typeof assignHypothesisPersona;
  transition?: typeof transitionHypothesis;
  route?: typeof routeAfterUse;
  importDeps?: AccountImportDeps;
  resolveDeps?: LoadOwnerResolutionDeps;
}

export async function useOwnerForHypothesis(prisma: PrismaLike, input: UseOwnerInput, deps: UseOwnerDeps = {}): Promise<UseOwnerResult> {
  const steps: UseOwnerStep[] = [];
  const stop = (hypothesisStatus: string | null, personaId: number | null, personaName: string | null): UseOwnerResult => ({ ok: false, hypothesisId: input.hypothesisId, hypothesisStatus, personaId, personaName, steps, routing: null });
  const row: { id: string; account_name: string; status: string; primary_persona_id: number | null } | null = await prisma.prospectingHypothesis.findUnique({ where: { id: input.hypothesisId }, select: { id: true, account_name: true, status: true, primary_persona_id: true } });
  if (!row) {
    steps.push({ step: 'check', ok: false, reason: 'not_found' });
    return stop(null, null, null);
  }

  // 1. import (HubSpot-only)
  let personaId = typeof input.candidate.personaId === 'number' ? input.candidate.personaId : null;
  let personaName: string | null = null;
  if (personaId === null && input.candidate.hubspotContactId) {
    const imp = await (deps.import ?? importHubSpotContactToAccount)(prisma, { accountName: row.account_name, hubspotContactId: input.candidate.hubspotContactId, actor: input.actor, now: input.now }, deps.importDeps);
    if (!imp.ok) {
      steps.push({ step: 'import', ok: false, reason: imp.reason, detail: imp.detail });
      return stop(row.status, null, null);
    }
    steps.push({ step: 'import', ok: true, status: imp.status, detail: imp.notes.join(' ') || undefined });
    personaId = imp.personaId;
    personaName = imp.name;
  }
  if (personaId === null) {
    steps.push({ step: 'check', ok: false, reason: 'no_candidate', detail: 'Choose a person (a GAP contact or a HubSpot contact).' });
    return stop(row.status, null, null);
  }

  // 2. check: the person Casey clicked must be an eligible owner by the same read the UI showed.
  const res = await (deps.resolve ?? loadOwnerResolution)(prisma, { accountName: row.account_name, purpose: 'HYPOTHESIS_ACTIVATION', hypothesisId: row.id, now: input.now }, deps.resolveDeps);
  if (!res.ok) {
    steps.push({ step: 'check', ok: false, reason: res.reason });
    return stop(row.status, personaId, personaName);
  }
  const key = `gap:${personaId}`;
  const eligible = res.resolution.eligible.find((c) => c.key === key);
  if (!eligible) {
    const ex = res.resolution.excluded.find((e) => e.candidate.key === key);
    steps.push({ step: 'check', ok: false, reason: ex ? `candidate_not_eligible:${ex.code}` : 'candidate_not_eligible', detail: ex?.reason ?? 'This person is not an eligible owner for this hypothesis (not a direct operator for it, or not on record at this account).' });
    return stop(row.status, personaId, personaName);
  }
  personaName = eligible.name;
  steps.push({ step: 'check', ok: true, detail: eligible.reasons.join(' ') });

  // 3. assign
  if (row.primary_persona_id !== personaId) {
    const a = await (deps.assign ?? assignHypothesisPersona)(prisma, { hypothesisId: row.id, personaId, actor: input.actor, now: input.now, source: 'owner_resolution', evidence: { candidateKey: key, reasons: eligible.reasons, hubspotContactId: eligible.hubspotContactId, importStatus: steps.find((s) => s.step === 'import')?.status ?? null } });
    if (!a.ok) {
      steps.push({ step: 'assign', ok: false, reason: a.reason, detail: a.detail });
      return stop(row.status, personaId, personaName);
    }
    steps.push({ step: 'assign', ok: true, status: a.status });
  } else steps.push({ step: 'assign', ok: true, status: 'already' });

  if (!input.activate) {
    steps.push({ step: 'activate', ok: true, status: 'skipped' }, { step: 'route', ok: true, status: 'skipped' });
    return { ok: true, hypothesisId: row.id, hypothesisStatus: row.status, personaId, personaName, steps, routing: null };
  }

  // 4. activate: the machine, with every guard (evidence, review, suppression, currentness, version).
  let status = row.status;
  if (status === 'approved') {
    const t = await (deps.transition ?? transitionHypothesis)(prisma, row.id, 'activate', { now: input.now, actor: input.actor, reason: 'owner_resolution: use this person in routing' });
    if (!t.ok) {
      steps.push({ step: 'activate', ok: false, reason: t.reason });
      return { ok: false, hypothesisId: row.id, hypothesisStatus: status, personaId, personaName, steps, routing: null };
    }
    status = t.to;
    steps.push({ step: 'activate', ok: true, status });
  } else {
    steps.push({ step: 'activate', ok: false, reason: status === 'active' ? 'already_active' : `not_approved:${status}`, detail: status === 'active' ? undefined : 'Approve the hypothesis first.' });
    if (status !== 'active') return { ok: false, hypothesisId: row.id, hypothesisStatus: status, personaId, personaName, steps, routing: null };
  }

  // 5. targeted shadow routing of exactly this person at this account.
  const routing = await (deps.route ?? routeAfterUse)(prisma, { actor: input.actor, now: input.now, people: [{ personaId, name: personaName }] });
  steps.push({ step: 'route', ok: routing.ok, reason: routing.ok ? undefined : routing.reason, detail: routing.ok ? routing.people.map((p) => `${p.name ?? p.personaId}: ${p.lane.replace(/_/g, ' ')}`).join('; ') : routing.detail });
  return { ok: routing.ok, hypothesisId: row.id, hypothesisStatus: status, personaId, personaName, steps, routing };
}
