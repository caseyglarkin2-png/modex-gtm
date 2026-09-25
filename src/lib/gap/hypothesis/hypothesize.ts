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
 *      proposed a second time, plus its TERMINAL ones with their linked
 *      signal ids, so a withdrawn or resolved hypothesis is not rebuilt from
 *      the same signals until a genuinely new one appears.
 *   4. Build candidates with the pure builder, then propose each surviving
 *      candidate as a draft under a deterministic `sourceRef` (account,
 *      persona, family, hash of the signal ids), so the service's
 *      duplicate_source_ref refusal makes a re-run a no-op. `dryRun` counts
 *      everything and writes no hypothesis (signals are still registered:
 *      they are frozen facts, not outreach, and the builder needs their ids).
 *
 * One account's failure (a trigger whose Account row is missing makes
 * registerSignal throw) is isolated: it is counted and named in the report
 * and the run moves on to the next account.
 *
 * House convention for DB glue is `prisma: any` (see ./service.ts).
 *
 * Voice: no em dashes, "yards" plural.
 */

import { createHash } from 'node:crypto';

import { HYPOTHESIS_TERMINAL_STATUSES, type Persona as PersonaKey } from '../taxonomy';
import { audit as defaultAudit } from '../audit';
import {
  loadIdentityContext as defaultLoadIdentityContext,
  registerAlias as defaultRegisterAlias,
  type RegisterAliasInput,
  type RegisterAliasResult,
} from '../identity/service';
import { resolveIdentity as defaultResolveIdentity, type IdentityContext, type IdentityInput, type ResolveIdentityResult } from '../identity/resolve';
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
  /** 6A: identity resolution. Injectable so tests need not stand up the real DB-backed context. */
  loadIdentityContext?: (prisma: any) => Promise<IdentityContext>;
  resolveIdentity?: (ctx: IdentityContext, input: IdentityInput) => ResolveIdentityResult;
  registerAlias?: (prisma: any, input: RegisterAliasInput) => Promise<RegisterAliasResult>;
  audit?: (prisma: any, input: Parameters<typeof defaultAudit>[1]) => ReturnType<typeof defaultAudit>;
}

export interface HypothesizeReport {
  accountsScanned: number;
  triggersSeen: number;
  /**
   * 6A: per-trigger identity resolution, BEFORE grouping. `refused` reasons
   * are the resolver's own (`unresolved_company`, `ambiguous_identity`,
   * `no_input`); a refused trigger is skipped for signal registration
   * entirely -- it never reaches registerSignal, so it can never throw the
   * FK violation that used to abort its whole account's processing.
   */
  identity: {
    resolved: number;
    /** A resolution via the normalized-name fallback tier was cached as an explicit alias for next run. */
    aliasesRegistered: number;
    /** A higher tier (company id/domain) disagreed with a lower one; the higher tier won and the disagreement was audited. */
    conflicts: number;
    refused: Record<string, number>;
  };
  signals: { created: number; existing: number; refused: number };
  candidates: number;
  proposed: number;
  /** Proposals the service refused as duplicate_source_ref: the same candidate already exists. */
  existing: number;
  skippedOpen: number;
  /** Candidates whose (persona, family) already has a terminal hypothesis built on the same or more signals. */
  skippedResolved: number;
  refused: Record<string, number>;
  buildSkipped: Record<string, number>;
  /** Account keys whose per-account body threw; the run continued past them. */
  errors: string[];
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

interface PriorHypothesisRow {
  primary_persona_id: number | null;
  problem_family: string;
  status: string;
  signals?: Array<{ signal_id: string }>;
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

/**
 * Deterministic proposal key so the same candidate is never proposed twice:
 * the service refuses a repeat as duplicate_source_ref. The hash covers the
 * sorted signal ids, so a genuinely new signal yields a new ref.
 */
export function pounceSourceRef(accountName: string, personaId: number, family: string, signalIds: readonly string[]): string {
  const digest = createHash('sha1').update([...signalIds].sort().join('\n')).digest('hex').slice(0, 12);
  return `pounce:${accountName}:${personaId}:${family}:${digest}`;
}

const OPEN_SET: ReadonlySet<string> = new Set(OPEN_HYPOTHESIS_STATUSES);
const TERMINAL_SET: ReadonlySet<string> = new Set(HYPOTHESIS_TERMINAL_STATUSES);

/** What the account's prior hypotheses block, in the shapes the candidate loop checks. */
interface PriorIndex {
  /** Open (persona, family) keys, plus family-only keys for open import drafts with no persona. */
  open: Set<string>;
  /** Terminal rows by (persona, family): each entry is that row's linked signal id set. */
  terminal: Map<string, Array<Set<string>>>;
}

function indexPrior(rows: PriorHypothesisRow[]): PriorIndex {
  const open = new Set<string>();
  const terminal = new Map<string, Array<Set<string>>>();
  for (const row of rows) {
    if (OPEN_SET.has(row.status)) {
      open.add(openKey(row.primary_persona_id, row.problem_family));
    } else if (TERMINAL_SET.has(row.status) && row.primary_persona_id !== null) {
      const key = openKey(row.primary_persona_id, row.problem_family);
      const ids = new Set((row.signals ?? []).map((link) => link.signal_id));
      const list = terminal.get(key);
      if (list) list.push(ids);
      else terminal.set(key, [ids]);
    }
  }
  return { open, terminal };
}

/**
 * An open row with the same (persona, family) blocks, and so does an open row
 * with the same family and no persona (an import draft not yet assigned): it
 * is the same problem being worked for the whole account.
 */
function blockedByOpen(index: PriorIndex, personaId: number, family: string): boolean {
  return index.open.has(openKey(personaId, family)) || index.open.has(openKey(null, family));
}

/**
 * A terminal row with the same (persona, family) whose linked signals are a
 * superset of, or equal to, the candidate's blocks: nothing new has been
 * observed since that hypothesis was resolved or withdrawn.
 */
function blockedByResolved(index: PriorIndex, personaId: number, family: string, signalIds: readonly string[]): boolean {
  const priors = index.terminal.get(openKey(personaId, family));
  if (!priors) return false;
  return priors.some((linked) => signalIds.every((id) => linked.has(id)));
}

function errorKey(err: unknown): string {
  if (err instanceof Error && err.name && err.name !== 'Error') return err.name;
  return 'account_error';
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
 * Group triggers by their RESOLVED (6A canonical) account name, in the
 * resolution order (which preserves the score-desc query order). The first
 * trigger of each account is its best and the map's insertion order ranks
 * accounts by their best trigger. Capped at `max`.
 */
function groupByResolvedAccount(
  resolved: Array<{ trigger: PounceTriggerRow; accountName: string }>,
  max: number,
): Map<string, PounceTriggerRow[]> {
  const groups = new Map<string, PounceTriggerRow[]>();
  for (const { trigger, accountName } of resolved) {
    const existing = groups.get(accountName);
    if (existing) {
      existing.push(trigger);
    } else if (groups.size < max) {
      groups.set(accountName, [trigger]);
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
  const loadIdentityContext = deps.loadIdentityContext ?? defaultLoadIdentityContext;
  const resolveIdentity = deps.resolveIdentity ?? defaultResolveIdentity;
  const registerAlias = deps.registerAlias ?? defaultRegisterAlias;
  const audit = deps.audit ?? defaultAudit;

  const now = opts.now;
  const lookbackDays = opts.lookbackDays ?? DEFAULT_LOOKBACK_DAYS;
  const maxAccounts = opts.maxAccounts ?? DEFAULT_MAX_ACCOUNTS;
  const dryRun = Boolean(opts.dryRun);
  const actor = opts.actor ?? HYPOTHESIZE_ACTOR;

  const report: HypothesizeReport = {
    accountsScanned: 0,
    triggersSeen: 0,
    identity: { resolved: 0, aliasesRegistered: 0, conflicts: 0, refused: {} },
    signals: { created: 0, existing: 0, refused: 0 },
    candidates: 0,
    proposed: 0,
    existing: 0,
    skippedOpen: 0,
    skippedResolved: 0,
    refused: {},
    buildSkipped: {},
    errors: [],
    dryRun,
  };

  // 1. Recent, live triggers, best first.
  const since = new Date(now.getTime() - lookbackDays * DAY_MS);
  const triggers: PounceTriggerRow[] = await prisma.pounceTrigger.findMany({
    where: { dismissed: false, first_seen_at: { gte: since } },
    orderBy: [{ score: 'desc' }, { first_seen_at: 'desc' }],
  });

  // 6A: resolve every trigger's account identity BEFORE grouping. A trigger
  // that does not resolve to exactly one Account is skipped here, counted by
  // reason, and never reaches registerSignal -- so it can never throw the FK
  // violation that used to abort its whole (raw-named) account's processing.
  const identityContext = await loadIdentityContext(prisma);
  const resolvedTriggers: Array<{ trigger: PounceTriggerRow; accountName: string }> = [];
  for (const trigger of triggers) {
    const result = resolveIdentity(identityContext, {
      rawName: trigger.account_name,
      hubspotCompanyId: trigger.hubspot_company_id ?? null,
    });
    if (!result.ok) {
      bump(report.identity.refused, result.reason);
      continue;
    }
    report.identity.resolved += 1;
    if (result.conflict) {
      report.identity.conflicts += 1;
      await audit(prisma, {
        kind: 'identity.conflict',
        actor,
        subjectType: 'pounce_trigger',
        subjectId: String(trigger.id),
        payload: {
          rawName: trigger.account_name,
          resolvedVia: result.via,
          resolvedAccountName: result.accountName,
          conflictVia: result.conflict.via,
          conflictAccountName: result.conflict.accountName,
        },
      });
    }
    // A resolution earned only through name normalization is cached as an
    // explicit alias, so the next run resolves it through the faster, higher
    // -confidence tier C instead of re-deriving it from the raw name every time.
    if (!dryRun && result.via === 'normalized' && trigger.account_name.trim() !== result.accountName) {
      const registered = await registerAlias(prisma, {
        alias: trigger.account_name,
        accountName: result.accountName,
        source: 'hypothesize_cron',
        createdBy: actor,
      });
      if (registered.created) report.identity.aliasesRegistered += 1;
    }
    resolvedTriggers.push({ trigger, accountName: result.accountName });
  }

  const byAccount = groupByResolvedAccount(resolvedTriggers, Math.max(0, maxAccounts));

  for (const [accountName, accountTriggers] of byAccount) {
    report.accountsScanned += 1;
    report.triggersSeen += accountTriggers.length;
    try {
      await hypothesizeAccount(prisma, accountName, accountTriggers, { now, dryRun, actor }, report, {
        registerSignal,
        proposeHypothesis,
        buildCandidates,
      });
    } catch (err) {
      // One bad account (say, a trigger whose Account row is missing) must
      // not abort the whole run: count it, name it, move on.
      bump(report.refused, errorKey(err));
      report.errors.push(accountName);
    }
  }

  return report;
}

interface AccountContext {
  now: Date;
  dryRun: boolean;
  actor: string;
}

async function hypothesizeAccount(
  prisma: any,
  accountName: string,
  accountTriggers: PounceTriggerRow[],
  ctx: AccountContext,
  report: HypothesizeReport,
  deps: Required<Pick<HypothesizeDeps, 'registerSignal' | 'proposeHypothesis' | 'buildCandidates'>>,
): Promise<void> {
  const { now, dryRun, actor } = ctx;
  const { registerSignal, proposeHypothesis, buildCandidates } = deps;

  // 2a. Register each trigger as a frozen signal, under the 6A-resolved
  // canonical account name (accountName here), never the trigger's own raw
  // text: fromPounceTrigger is a pure projection and knows nothing about
  // identity resolution, so its accountName is overridden at this call site.
  const signals: BuildSignal[] = [];
  for (const trigger of accountTriggers) {
    const projected = fromPounceTrigger(trigger, { registeredBy: actor, now });
    if (!projected.ok) {
      report.signals.refused += 1;
      continue;
    }
    const signalInput: ProspectingSignalInput = { ...projected.signal, accountName };
    const registered = await registerSignal(prisma, signalInput);
    if (registered.created) report.signals.created += 1;
    else report.signals.existing += 1;
    signals.push(toBuildSignal(registered.id, signalInput, trigger.categories));
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

  // 3. What is already being worked, or was already resolved, for this account.
  const priorRows: PriorHypothesisRow[] = await prisma.prospectingHypothesis.findMany({
    where: {
      account_name: accountName,
      status: { in: [...OPEN_HYPOTHESIS_STATUSES, ...HYPOTHESIS_TERMINAL_STATUSES] },
    },
    select: {
      primary_persona_id: true,
      problem_family: true,
      status: true,
      signals: { select: { signal_id: true } },
    },
  });
  const prior = indexPrior(priorRows);

  // 4. Build, then propose what is neither open nor already resolved on these signals.
  const built = buildCandidates({ accountName, personas, signals, now });
  for (const skip of built.skipped) bump(report.buildSkipped, skip.reason);
  report.candidates += built.candidates.length;

  for (const candidate of built.candidates) {
    if (blockedByOpen(prior, candidate.personaId, candidate.problemFamily)) {
      report.skippedOpen += 1;
      continue;
    }
    if (blockedByResolved(prior, candidate.personaId, candidate.problemFamily, candidate.signalIds)) {
      report.skippedResolved += 1;
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
      sourceRef: pounceSourceRef(candidate.accountName, candidate.personaId, candidate.problemFamily, candidate.signalIds),
      metadata: { builder: candidate.provenance, source: 'pounce' },
      createdBy: actor,
    });
    if (result.ok) report.proposed += 1;
    else if (result.reason === 'duplicate_source_ref') report.existing += 1;
    else bump(report.refused, result.reason);
  }
}
