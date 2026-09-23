/**
 * Hypothesize job (GAP Prospecting OS, Sprint 1, S1-T12).
 *
 * The logic behind /api/cron/gap-hypothesize, kept out of the route so it is
 * unit-testable with a hand-rolled prisma and injected collaborators. One run:
 *
 *   1. Load the recent, non-dismissed pounce triggers, highest score first,
 *      grouped by account and capped at `maxAccounts` distinct accounts.
 *   2. Per account, register each trigger as a signal (idempotent on the
 *      trigger id) and load the account's contact-ready personas.
 *   3. Load the account's OPEN hypotheses (draft, review_required, approved,
 *      active) so a (persona, family) that is already being worked is not
 *      proposed a second time.
 *   4. Build candidates with the pure builder, then propose each surviving
 *      candidate as a draft. `dryRun` counts everything and writes no
 *      hypothesis (signals are still registered: they are frozen facts, not
 *      outreach, and the builder needs their ids).
 *
 * House convention for DB glue is `prisma: any` (see ./service.ts).
 *
 * Voice: no em dashes, "yards" plural.
 */

import type { Persona as PersonaKey } from '../taxonomy';
import { fromPounceTrigger, type PounceTriggerRow, type ProspectingSignalInput } from '../signals/projection';
import { registerSignal as defaultRegisterSignal, type RegisterResult } from '../signals/registry';
import {
  buildCandidates as defaultBuildCandidates,
  type BuildInput,
  type BuildPersona,
  type BuildResult,
  type BuildSignal,
} from './build';
import { proposeHypothesis as defaultProposeHypothesis, type ProposeInput, type ProposeResult } from './service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const HYPOTHESIZE_ACTOR = 'cron:gap-hypothesize' as const;
export const DEFAULT_LOOKBACK_DAYS = 30;
export const DEFAULT_MAX_ACCOUNTS = 50;

/** Statuses that count as "already being worked" for the open-hypothesis skip. */
export const OPEN_HYPOTHESIS_STATUSES = ['draft', 'review_required', 'approved', 'active'] as const;

export interface HypothesizeOptions {
  now: Date;
  lookbackDays?: number;
  maxAccounts?: number;
  dryRun?: boolean;
  actor?: string;
}

export interface HypothesizeDeps {
  registerSignal?: (prisma: any, input: ProspectingSignalInput) => Promise<RegisterResult>;
  proposeHypothesis?: (prisma: any, input: ProposeInput) => Promise<ProposeResult>;
  buildCandidates?: (input: BuildInput) => BuildResult;
}

export interface HypothesizeReport {
  accountsScanned: number;
  triggersSeen: number;
  signals: { created: number; existing: number; refused: number };
  candidates: number;
  proposed: number;
  skippedOpen: number;
  refused: Record<string, number>;
  buildSkipped: Record<string, number>;
  dryRun: boolean;
}

/** The persona columns the job reads. */
interface PersonaRow {
  id: number;
  name: string;
  title: string | null;
  persona_lane: string | null;
  function?: string | null;
  email: string | null;
  email_valid: boolean;
  do_not_contact: boolean;
}

interface OpenHypothesisRow {
  primary_persona_id: number | null;
  problem_family: string;
}

// ---------------------------------------------------------------------------
// Persona key mapping
// ---------------------------------------------------------------------------

/**
 * Title or lane keywords to persona key. First match wins, so the order is
 * the precedence: "SVP, Purchasing & Supply Chain" is supply_chain, not
 * finance_procurement. Short tokens (IT, CIO, CFO, DC) are word-bounded so
 * "Editor" and "Broadcast" do not read as a function. Default executive_ops.
 * Same rules as the importers' title map; kept local so this module stays
 * free of the import surface other agents are editing.
 */
const PERSONA_KEY_RULES: Array<{ key: PersonaKey; pattern: RegExp }> = [
  { key: 'supply_chain', pattern: /supply\s*chain/i },
  { key: 'transportation', pattern: /logistics|transportation/i },
  { key: 'site_ops', pattern: /\bplant\b|\bsite\b|operations|manufacturing/i },
  { key: 'automation', pattern: /automation|engineering/i },
  { key: 'technology', pattern: /technology|\bit\b|\bcio\b/i },
  { key: 'finance_procurement', pattern: /procurement|finance|\bcfo\b/i },
  { key: 'distribution', pattern: /distribution|warehouse|\bdc\b/i },
  { key: 'security', pattern: /security/i },
];

export function personaKeyFor(lane: string | null | undefined, title: string | null | undefined): PersonaKey {
  const haystack = `${lane ?? ''} ${title ?? ''}`.trim();
  if (haystack.length === 0) return 'executive_ops';
  for (const rule of PERSONA_KEY_RULES) {
    if (rule.pattern.test(haystack)) return rule.key;
  }
  return 'executive_ops';
}

function toBuildPersona(row: PersonaRow): BuildPersona {
  return {
    id: row.id,
    personaKey: personaKeyFor(row.persona_lane, row.title),
    name: row.name,
    title: row.title ?? null,
    doNotContact: Boolean(row.do_not_contact),
    emailValid: Boolean(row.email_valid),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

function bump(counter: Record<string, number>, key: string): void {
  counter[key] = (counter[key] ?? 0) + 1;
}

function openKey(personaId: number | null, family: string): string {
  return `${personaId ?? 'none'}:${family}`;
}

/** A registered signal in the builder's shape, from the projected input plus its store id. */
function toBuildSignal(id: string, signal: ProspectingSignalInput, categories: string[]): BuildSignal {
  return {
    id,
    type: signal.type,
    title: signal.title,
    summary: signal.summary ?? null,
    evidenceUrl: signal.evidenceUrl ?? null,
    evidenceText: signal.evidenceText ?? null,
    observedAt: signal.observedAt,
    confidence: signal.confidence,
    freshnessExpiresAt: signal.freshnessExpiresAt ?? null,
    externalOk: signal.externalOk ?? null,
    pounceCategories: [...categories],
  };
}

/**
 * Group triggers by account in first-seen order. The query is ordered by
 * score desc, so the first trigger of each account is its best and the map's
 * insertion order ranks accounts by their best trigger. Capped at `max`.
 */
function groupByAccount(triggers: PounceTriggerRow[], max: number): Map<string, PounceTriggerRow[]> {
  const groups = new Map<string, PounceTriggerRow[]>();
  for (const trigger of triggers) {
    const name = trigger.account_name.trim();
    const existing = groups.get(name);
    if (existing) {
      existing.push(trigger);
    } else if (groups.size < max) {
      groups.set(name, [trigger]);
    }
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Job
// ---------------------------------------------------------------------------

export async function runHypothesize(
  prisma: any,
  opts: HypothesizeOptions,
  deps: HypothesizeDeps = {},
): Promise<HypothesizeReport> {
  const registerSignal = deps.registerSignal ?? defaultRegisterSignal;
  const proposeHypothesis = deps.proposeHypothesis ?? defaultProposeHypothesis;
  const buildCandidates = deps.buildCandidates ?? defaultBuildCandidates;

  const now = opts.now;
  const lookbackDays = opts.lookbackDays ?? DEFAULT_LOOKBACK_DAYS;
  const maxAccounts = opts.maxAccounts ?? DEFAULT_MAX_ACCOUNTS;
  const dryRun = Boolean(opts.dryRun);
  const actor = opts.actor ?? HYPOTHESIZE_ACTOR;

  const report: HypothesizeReport = {
    accountsScanned: 0,
    triggersSeen: 0,
    signals: { created: 0, existing: 0, refused: 0 },
    candidates: 0,
    proposed: 0,
    skippedOpen: 0,
    refused: {},
    buildSkipped: {},
    dryRun,
  };

  // 1. Recent, live triggers, best first.
  const since = new Date(now.getTime() - lookbackDays * DAY_MS);
  const triggers: PounceTriggerRow[] = await prisma.pounceTrigger.findMany({
    where: { dismissed: false, first_seen_at: { gte: since } },
    orderBy: [{ score: 'desc' }, { first_seen_at: 'desc' }],
  });
  const byAccount = groupByAccount(triggers, Math.max(0, maxAccounts));

  for (const [accountName, accountTriggers] of byAccount) {
    report.accountsScanned += 1;
    report.triggersSeen += accountTriggers.length;

    // 2a. Register each trigger as a frozen signal.
    const signals: BuildSignal[] = [];
    for (const trigger of accountTriggers) {
      const projected = fromPounceTrigger(trigger, { registeredBy: actor, now });
      if (!projected.ok) {
        report.signals.refused += 1;
        continue;
      }
      const registered = await registerSignal(prisma, projected.signal);
      if (registered.created) report.signals.created += 1;
      else report.signals.existing += 1;
      signals.push(toBuildSignal(registered.id, projected.signal, trigger.categories));
    }

    // 2b. Contact-ready personas with an address on file.
    const personaRows: PersonaRow[] = await prisma.persona.findMany({
      where: {
        account_name: accountName,
        is_contact_ready: true,
        do_not_contact: false,
        email: { not: null },
      },
      orderBy: { id: 'asc' },
    });
    const personas = personaRows
      .filter((row) => typeof row.email === 'string' && row.email.trim().length > 0)
      .map(toBuildPersona);

    // 3. What is already being worked for this account.
    const openRows: OpenHypothesisRow[] = await prisma.prospectingHypothesis.findMany({
      where: { account_name: accountName, status: { in: [...OPEN_HYPOTHESIS_STATUSES] } },
      select: { primary_persona_id: true, problem_family: true },
    });
    const open = new Set(openRows.map((row) => openKey(row.primary_persona_id, row.problem_family)));

    // 4. Build, then propose what is not already open.
    const built = buildCandidates({ accountName, personas, signals, now });
    for (const skip of built.skipped) bump(report.buildSkipped, skip.reason);
    report.candidates += built.candidates.length;

    for (const candidate of built.candidates) {
      if (open.has(openKey(candidate.personaId, candidate.problemFamily))) {
        report.skippedOpen += 1;
        continue;
      }
      if (dryRun) continue;

      const result = await proposeHypothesis(prisma, {
        accountName: candidate.accountName,
        primaryPersonaId: candidate.personaId,
        persona: candidate.persona,
        problemFamily: candidate.problemFamily,
        secondaryFamilies: candidate.secondaryFamilies,
        observation: candidate.observation,
        problemHypothesis: candidate.problemHypothesis,
        rootCauseHypotheses: candidate.rootCauseHypotheses,
        impactHypotheses: candidate.impactHypotheses,
        whyNow: candidate.whyNow,
        falsificationQuestions: candidate.falsificationQuestions,
        whatANoMeans: candidate.whatANoMeans,
        confidence: candidate.confidence,
        signalIds: candidate.signalIds,
        primarySignalId: candidate.primarySignalId,
        sourceRef: null,
        metadata: { builder: candidate.provenance, source: 'pounce' },
        createdBy: actor,
      });
      if (result.ok) report.proposed += 1;
      else bump(report.refused, result.reason);
    }
  }

  return report;
}
