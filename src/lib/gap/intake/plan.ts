/**
 * COHORT PLANNING (Universal Work Intake, 2026-09-28): qualify ACCOUNTS once,
 * then give every person there the account's state. Research is planned per
 * account: 400 subscribers at 170 accounts never become 400 research jobs.
 *
 * Transparent states (no score), each with its reason:
 *   not_icp              outside GAP's watched universe (no deal lookup, no research spend)
 *   in_deal              an open HubSpot deal: the In Deals workflow, never cold
 *   opportunity_unknown  deal status could not be read: held, never cold
 *   evidence_ready       a live verified fact exists: worth Casey's review
 *   already_covered      a live fact and every thesis there approved and in use
 *   research             no live verified fact: the account joins the research queue
 * A person-level stop wins over the account: do_not_contact (Persona flag or a
 * hard-invalid address), human_review (ambiguous identity), needs_identity.
 *
 * Existing truth only: signals/watch.ts (universe), opportunity/active-opportunity.ts
 * (deals), research/inbox.ts (evidence, theses), research runs (freshness).
 * Writes only the member's qualification (derived state) and one audit row.
 */
import { loadWatchProfilesCached } from '../signals/watch';
import { resolveAccountOpportunity, type OpportunityTruth } from '../opportunity/active-opportunity';
import { loadEvidenceInbox, type InboxAccount } from '../research/inbox';
import { isIdentityImprovement, loadIntakeContext, stageCandidate } from './service';
import { memberKey } from './resolve';
import { resolveIntakeRow } from './resolve';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type Qualification = 'research' | 'evidence_ready' | 'already_covered' | 'in_deal' | 'opportunity_unknown' | 'not_icp' | 'needs_identity' | 'do_not_contact' | 'human_review';

export interface AccountFacts {
  accountName: string;
  watched: boolean;
  opportunity: OpportunityTruth['status'] | null;
  liveFacts: number;
  bestFactReason: string | null;
  theses: Array<{ useLabel: string | null }>;
  lastResearchAt: Date | null;
}

const HARD_INVALID = new Set(['hard_bounce', 'hard_bounced', 'invalid']);
const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

export function qualifyAccount(f: AccountFacts, _now: Date): { state: Qualification; reason: string } {
  if (!f.watched) return { state: 'not_icp', reason: 'not in the watched universe (tier / priority band / thesis / watchlist)' };
  if (f.opportunity === 'ACTIVE') return { state: 'in_deal', reason: 'open HubSpot deal: work it from the deal' };
  if (f.opportunity === 'UNKNOWN') return { state: 'opportunity_unknown', reason: 'deal status could not be read: held, never cold' };
  if (f.liveFacts > 0) {
    if (f.theses.length > 0 && f.theses.every((t) => !t.useLabel)) return { state: 'already_covered', reason: 'verified evidence and every thesis there is approved and in use' };
    return { state: 'evidence_ready', reason: `${plural(f.liveFacts, 'verified fact')}${f.bestFactReason ? `; best: ${f.bestFactReason}` : ''}` };
  }
  return { state: 'research', reason: `no live verified fact; ${f.lastResearchAt ? `last researched ${f.lastResearchAt.toISOString().slice(0, 10)}` : 'never researched'}` };
}

export interface PlanDeps {
  watch?: (prisma: PrismaLike) => Promise<Array<{ accountName: string }>>;
  opportunity?: (prisma: PrismaLike, accountName: string) => Promise<OpportunityTruth>;
  inbox?: (prisma: PrismaLike, now: Date, opts: { accounts: string[] }) => Promise<InboxAccount[]>;
  /** Re-resolve members whose identity may have improved; returns how many changed. */
  reresolve?: (prisma: PrismaLike, members: PlanMember[]) => Promise<number>;
}

interface PlanMember {
  id: string;
  work_source_id: string;
  kind: string;
  status: string;
  resolution: string;
  account_name: string | null;
  persona_id: number | null;
  qualification: string | null;
  qualification_reason: string | null;
  name?: string | null;
  title?: string | null;
  company?: string | null;
  email?: string | null;
  linkedin_url?: string | null;
  company_domain?: string | null;
  source_identifier?: string | null;
  raw?: unknown;
}

export interface PlanResult {
  members: number;
  accounts: number;
  deferredAccounts: number;
  changed: number;
  reresolved: number;
  byState: Record<string, number>;
  researchAccounts: string[];
}

/** Identity improves over time (an account added, an alias registered): re-resolve the members still open. */
async function reresolveMembers(prisma: PrismaLike, members: PlanMember[]): Promise<number> {
  const open = members.filter((m) => m.resolution === 'unresolved' || m.resolution === 'new_candidate');
  if (!open.length) return 0;
  const ctx = await loadIntakeContext(prisma);
  let changed = 0;
  for (const m of open) {
    const r = resolveIntakeRow(ctx, { kind: m.kind === 'account' ? 'account' : 'person', raw: {}, ...(m.name ? { name: m.name } : {}), ...(m.title ? { title: m.title } : {}), ...(m.company ? { company: m.company } : {}), ...(m.email ? { email: m.email } : {}), ...(m.linkedin_url ? { linkedinUrl: m.linkedin_url } : {}), ...(m.company_domain ? { companyDomain: m.company_domain } : {}) });
    // Only an improvement moves: unresolved -> anything known, new_candidate -> resolved (the Persona now exists).
    if (!isIdentityImprovement(m, r)) continue;
    const row = { kind: (m.kind === 'account' ? 'account' : 'person') as 'account' | 'person', raw: {}, ...(m.name ? { name: m.name } : {}), ...(m.title ? { title: m.title } : {}), ...(m.company ? { company: m.company } : {}), ...(m.email ? { email: m.email } : {}) };
    // A person newly placed at a known account is staged, the same as at import (never a dead-end row).
    const candidateId = row.kind === 'person' && r.resolution === 'new_candidate' ? await stageCandidate(prisma, { row, key: memberKey(row), resolved: r }, { id: m.work_source_id, source_type: 'reresolve' }) : null;
    await prisma.gapWorkSourceMember.update({ where: { id: m.id }, data: { resolution: r.resolution, resolution_basis: r.basis, account_name: r.accountName, persona_id: r.personaId, resolution_candidates: r.candidates.length ? r.candidates : undefined, ...(candidateId ? { candidate_id: candidateId } : {}) } });
    Object.assign(m, { resolution: r.resolution, account_name: r.accountName, persona_id: r.personaId });
    changed += 1;
  }
  return changed;
}

export async function planWorkSources(
  prisma: PrismaLike,
  input: { now: Date; actor: string; workSourceId?: string; maxAccounts?: number; timeBudgetMs?: number; clock?: () => number },
  deps: PlanDeps = {},
): Promise<PlanResult> {
  const clock = input.clock ?? Date.now;
  const started = clock();
  const sources: Array<{ id: string; intent: string }> = await prisma.gapWorkSource.findMany({ where: { status: 'active', ...(input.workSourceId ? { id: input.workSourceId } : {}) }, select: { id: true, intent: true } });
  const sourceIds = sources.map((s) => s.id);
  const members: PlanMember[] = sourceIds.length
    ? await prisma.gapWorkSourceMember.findMany({ where: { work_source_id: { in: sourceIds }, status: { in: ['active', 'research_requested'] } }, orderBy: [{ ingested_at: 'asc' }] })
    : [];
  const live = members.filter((m) => m.status === 'active' || m.status === 'research_requested');
  const reresolved = await (deps.reresolve ?? reresolveMembers)(prisma, live);

  // Person-level facts: do not contact.
  const personaIds = [...new Set(live.map((m) => m.persona_id).filter((x): x is number => typeof x === 'number'))];
  const personas: Array<{ id: number; do_not_contact: boolean; email_status: string | null }> = personaIds.length ? await prisma.persona.findMany({ where: { id: { in: personaIds } }, select: { id: true, do_not_contact: true, email_status: true } }) : [];
  const stop = new Map(personas.filter((p) => p.do_not_contact || HARD_INVALID.has(String(p.email_status ?? ''))).map((p) => [p.id, p.do_not_contact ? 'marked do not contact' : `email ${p.email_status}`]));

  // Accounts, once each, in the order their members arrived; budgeted.
  const accountOrder = [...new Set(live.filter((m) => m.account_name && (m.resolution === 'resolved' || m.resolution === 'new_candidate')).map((m) => m.account_name as string))];
  const maxAccounts = input.maxAccounts ?? 60;
  const budget = input.timeBudgetMs ?? 90_000;
  const watched = new Set((await (deps.watch ?? loadWatchProfilesCached)(prisma).catch(() => [])).map((p) => p.accountName));
  const inbox = new Map((await (deps.inbox ?? ((p, now, o) => loadEvidenceInbox(p, now, o)))(prisma, input.now, { accounts: accountOrder }).catch(() => [])).map((a) => [a.accountName, a]));
  const lastRuns: Array<{ account_name: string; _max: { created_at: Date | null } }> = accountOrder.length
    ? await prisma.researchRun.groupBy({ by: ['account_name'], where: { account_name: { in: accountOrder }, run_key: { startsWith: 'gap_research:' } }, _max: { created_at: true } }).catch(() => [])
    : [];
  const lastOf = new Map(lastRuns.map((r) => [r.account_name, r._max.created_at ? new Date(r._max.created_at) : null]));

  const stateOf = new Map<string, { state: Qualification; reason: string }>();
  let deferred = 0;
  for (const name of accountOrder) {
    if (stateOf.size >= maxAccounts || clock() - started > budget) {
      deferred += 1;
      continue;
    }
    const isWatched = watched.has(name);
    const opp = isWatched ? await (deps.opportunity ?? ((p, a) => resolveAccountOpportunity(p, a)))(prisma, name) : null;
    const box = inbox.get(name);
    stateOf.set(name, qualifyAccount({ accountName: name, watched: isWatched, opportunity: opp?.status ?? null, liveFacts: box?.ready.length ?? 0, bestFactReason: box?.ready[0]?.relevance?.reason ?? null, theses: box?.theses ?? [], lastResearchAt: lastOf.get(name) ?? null }, input.now));
  }

  let changed = 0;
  const byState: Record<string, number> = {};
  for (const m of live) {
    let q: { state: Qualification; reason: string } | null = null;
    if (m.persona_id && stop.has(m.persona_id)) q = { state: 'do_not_contact', reason: stop.get(m.persona_id)! };
    else if (m.resolution === 'ambiguous') q = { state: 'human_review', reason: 'more than one possible match: you decide' };
    else if (m.resolution === 'unresolved') q = { state: 'needs_identity', reason: m.kind === 'person' && !m.company ? 'no company given' : 'company not in GAP yet' };
    else if (m.account_name && stateOf.has(m.account_name)) q = stateOf.get(m.account_name)!;
    if (!q) continue; // an account past this run's budget stays unplanned: never guessed
    byState[q.state] = (byState[q.state] ?? 0) + 1;
    if (m.qualification === q.state && m.qualification_reason === q.reason) continue;
    await prisma.gapWorkSourceMember.update({ where: { id: m.id }, data: { qualification: q.state, qualification_reason: q.reason, qualified_at: input.now } });
    Object.assign(m, { qualification: q.state, qualification_reason: q.reason });
    changed += 1;
  }
  const researchAccounts = [...stateOf.entries()].filter(([, s]) => s.state === 'research').map(([n]) => n);
  if (changed || reresolved) {
    await prisma.gapAuditEvent.create({ data: { kind: 'work_source.planned', actor: input.actor, subject_type: 'work_source', subject_id: input.workSourceId ?? 'all', payload: { members: live.length, accounts: stateOf.size, deferredAccounts: deferred, changed, reresolved, byState } } });
  }
  return { members: live.length, accounts: stateOf.size, deferredAccounts: deferred, changed, reresolved, byState, researchAccounts };
}
