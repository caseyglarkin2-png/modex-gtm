/**
 * GAP routing run (Sprint 2, S2-T7).
 *
 * The one orchestration seam over the routing module: pick accounts, assemble
 * inputs per (account, persona) through `assembleForAccount` (S2-T5), route
 * each through `routePersona` (S2-T6), and store one `RoutingDecision` row per
 * decision. Skips, from the assembler or the router, are counted in the report
 * and never stored.
 *
 * MODE IS ALWAYS SHADOW IN SPRINT 2. Every row this file writes carries
 * `mode: SHADOW_MODE`. Nothing here enrolls, sends, or calls HubSpot to write;
 * the only side effects are `routing_decisions` rows and one audit event,
 * the run's completion marker. A structural test greps this file to prove the other mode value
 * never appears here.
 *
 * There is no "latest run" (debt burn, 2026-09-26): the queue shows each
 * person's newest applicable decision from any run (queue.ts), so a run may
 * route one person or one account without hiding anyone else's card. Reads
 * run concurrently under fixed bounds; writes land in account order; one
 * account that fails is reported in `failed` and never aborts the others.
 *
 * Everything with a network or a clock is injected through `deps`:
 * - `suppression`: the routing-time suppression read (never the send gate).
 * - `hubspotSnapshot`: the per-account HubSpot read (company properties plus
 *   the personas' contact properties); absent or unconfigured means a null
 *   snapshot and `tam: 'unknown'`, which the rules route to research.
 *   `createHubSpotSnapshotProvider` is the default, over injected reads.
 * - `top100`: the Top100 manifest and rosters, when the caller has them.
 * - `assemble` / `route` / `audit`: the real functions by default, mocks in
 *   tests. No test in this module touches the network.
 */

import { audit as auditEvent } from '../audit';
import { createLimiter, withTimeout } from './bounded';
import { ROUTING_RUN_DONE } from './queue';
import type { Top100Manifest, Top100RosterPerson } from '../top100/reader';
import { EXPLAIN_LEAK_MARKER, isExplainLeakError } from './explain';
import { assembleForAccount, isSkip } from './inputs';
import type { AssembleAccountArgs, AssembleForAccountOptions, AssembleResult, HubSpotAccountSnapshot, Top100Context } from './inputs';
import { routePersona } from './route';
import type { SuppressionReader } from './suppression-read';
import type { RouteResult, RoutingDecision, RoutingInputs } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** The only mode Sprint 2 writes. */
export const SHADOW_MODE = 'shadow' as const;

export const DEFAULT_MAX_PAIRS = 500;
export const DEFAULT_MAX_PERSONAS_PER_ACCOUNT = 2;

export interface RunRoutingOptions {
  now: Date;
  /** Defaults to `run-<now ISO>`. */
  runId?: string;
  /** Explicit accounts. Default: every Account with a contact-ready persona, rank order, TAM out dropped. */
  accountNames?: string[];
  /** Hard cap on (account, persona) pairs routed in one run. */
  maxPairs?: number;
  maxPersonasPerAccount?: number;
  /**
   * Targeted routing: route exactly these people at `accountNames` and no one
   * else (APPROVE + USE). Without it each account routes its top personas
   * plus the people named by its approved/active hypotheses.
   */
  personaIds?: number[];
  /** Count only; no row written. */
  dryRun?: boolean;
  actor: string;
}

export interface Top100RunContext {
  manifest: Top100Manifest | null;
  /** Roster people keyed by manifest account key. */
  rosterByKey: Record<string, Top100RosterPerson[]>;
}

export type HubSpotSnapshotProvider = (
  accountName: string,
  hubspotCompanyId: string | null,
) => Promise<HubSpotAccountSnapshot | null>;

export interface RunRoutingDeps {
  suppression: SuppressionReader;
  hubspotSnapshot?: HubSpotSnapshotProvider;
  top100?: Top100RunContext | null;
  assemble?: (prisma: PrismaLike, args: AssembleAccountArgs, opts?: AssembleForAccountOptions) => Promise<AssembleResult[]>;
  route?: (inputs: RoutingInputs) => RouteResult;
  audit?: typeof auditEvent;
  /** Tests only; production uses the constants below. */
  accountConcurrency?: number;
  personConcurrency?: number;
  accountTimeoutMs?: number;
}

export interface RunReport {
  runId: string;
  mode: typeof SHADOW_MODE;
  accountsScanned: number;
  pairs: number;
  decisions: number;
  skips: Record<string, number>;
  byRule: Record<string, number>;
  byAction: Record<string, number>;
  /** Accounts that failed (timeout, read or write fault) with the exact reason. Their earlier cards stay current. */
  failed: Array<{ accountName: string; reason: string }>;
  dryRun: boolean;
}

/** What `loadDecisions` (enroll-row.ts) and `listQueue` (queue.ts) read back off a row. */
export interface DecisionSnapshot {
  account: RoutingInputs['account'];
  persona: RoutingInputs['persona'];
  hypothesis: { id: string; status: string; family: string; confidence: number } | null;
  comms: RoutingInputs['comms'];
  suppression: RoutingInputs['suppression'];
  target: RoutingDecision['target'] | null;
  displayName: string | null;
  preferredSender: string | null;
  whatIKnow: string | null;
}

interface AccountRef {
  name: string;
  hubspot_company_id: string | null;
}

function bump(counter: Record<string, number>, key: string): void {
  counter[key] = (counter[key] ?? 0) + 1;
}

function lowerName(s: string | null | undefined): string {
  return String(s ?? '').trim().toLowerCase();
}

/**
 * Map the `yardflow_tam` company property to the assembler's three-valued
 * TAM. Anything that is not exactly in or out is unknown, never in.
 */
export function tamFromProperty(value: string | null | undefined): HubSpotAccountSnapshot['tam'] {
  const v = lowerName(value);
  if (v === 'in') return 'in';
  if (v === 'out') return 'out';
  return 'unknown';
}

/** Company properties the snapshot reads (same set the heat assembler reads). */
export const SNAPSHOT_COMPANY_PROPERTIES = [
  'yardflow_tam',
  'tam_tier',
  'intent_score',
  'last_intent_at',
  'trigger_score',
  'last_trigger_at',
] as const;

/** Contact properties the snapshot reads: the qualification verdict and the last intent source. */
export const SNAPSHOT_CONTACT_PROPERTIES = ['yardflow_qual_verdict', 'last_intent_source'] as const;

/** HubSpot's contacts batch read takes at most 100 ids per call. */
export const CONTACT_BATCH_SIZE = 100;

export type HubSpotProps = Record<string, string | null | undefined>;

export interface HubSpotContactRead {
  id: string;
  properties: HubSpotProps;
}

/** The two READS the provider needs. Both are injected; the route wires the SDK, tests wire fakes. */
export interface SnapshotReads {
  readCompany(hubspotCompanyId: string, properties: readonly string[]): Promise<{ properties: HubSpotProps } | null>;
  readContacts(hubspotContactIds: string[], properties: readonly string[]): Promise<HubSpotContactRead[]>;
}

function tierFromProperty(value: string | null | undefined): HubSpotAccountSnapshot['tamTier'] {
  const v = String(value ?? '').trim().toUpperCase();
  return v === 'A' || v === 'B' || v === 'C' ? v : '';
}

function intFromProperty(value: string | null | undefined): number | null {
  const s = String(value ?? '').trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function dateFromProperty(value: string | null | undefined): Date | null {
  const s = String(value ?? '').trim();
  if (!s) return null;
  // HubSpot returns date-times as ISO strings, and datetime properties sometimes as epoch millis.
  const d = /^\d{11,}$/.test(s) ? new Date(Number(s)) : new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function strFromProperty(value: string | null | undefined): string | null {
  const s = String(value ?? '').trim();
  return s ? s : null;
}

/**
 * Build the assembler's snapshot from raw HubSpot properties. A null company
 * with no contacts is a null snapshot; a null company with contacts still
 * carries them (tam unknown), so a persona's verified-reply leg can fire on an
 * account whose company row is missing.
 */
export function snapshotFromProperties(company: HubSpotProps | null, contacts: HubSpotContactRead[] = []): HubSpotAccountSnapshot | null {
  if (!company && contacts.length === 0) return null;
  const snapshot: HubSpotAccountSnapshot = {
    tam: tamFromProperty(company?.yardflow_tam),
    tamTier: tierFromProperty(company?.tam_tier),
    intentScore: intFromProperty(company?.intent_score),
    lastIntentAt: dateFromProperty(company?.last_intent_at),
    triggerScore: intFromProperty(company?.trigger_score),
    lastTriggerAt: dateFromProperty(company?.last_trigger_at),
  };
  if (contacts.length > 0) {
    snapshot.contacts = {};
    for (const c of contacts) {
      const id = String(c.id ?? '').trim();
      if (!id) continue;
      snapshot.contacts[id] = {
        qualVerdict: strFromProperty(c.properties?.yardflow_qual_verdict),
        lastIntentSource: strFromProperty(c.properties?.last_intent_source),
      };
    }
  }
  return snapshot;
}

export interface SnapshotProviderOptions {
  /** Default: always configured. The route passes `isHubSpotConfigured`. */
  configured?: () => boolean;
}

/**
 * The run's default snapshot provider: one company read plus one contacts
 * batch read per account (all reads, never a write). Contact ids come from
 * the account's contact-ready Persona rows. Unconfigured HubSpot is a null
 * snapshot for every account; a failed read degrades to "that part unknown"
 * rather than failing the run.
 */
export function createHubSpotSnapshotProvider(
  prisma: PrismaLike,
  reads: SnapshotReads,
  opts: SnapshotProviderOptions = {},
): HubSpotSnapshotProvider {
  const configured = opts.configured ?? (() => true);
  return async (accountName, hubspotCompanyId) => {
    if (!configured()) return null;

    let company: HubSpotProps | null = null;
    if (hubspotCompanyId) {
      try {
        company = (await reads.readCompany(hubspotCompanyId, SNAPSHOT_COMPANY_PROPERTIES))?.properties ?? null;
      } catch {
        company = null;
      }
    }

    let contactIds: string[] = [];
    try {
      const rows = (await prisma.persona.findMany({
        where: { account_name: accountName, is_contact_ready: true, hubspot_contact_id: { not: null } },
        select: { hubspot_contact_id: true },
      })) as Array<{ hubspot_contact_id: string | null }>;
      contactIds = [...new Set(rows.map((r) => String(r.hubspot_contact_id ?? '').trim()).filter(Boolean))];
    } catch {
      contactIds = [];
    }

    const contacts: HubSpotContactRead[] = [];
    for (let i = 0; i < contactIds.length; i += CONTACT_BATCH_SIZE) {
      const batch = contactIds.slice(i, i + CONTACT_BATCH_SIZE);
      try {
        contacts.push(...(await reads.readContacts(batch, SNAPSHOT_CONTACT_PROPERTIES)));
      } catch {
        // This batch reads as unknown; the others still count.
      }
    }

    return snapshotFromProperties(company, contacts);
  };
}

/** The manifest account for a name or HubSpot id, when the Top100 lane knows it. */
function manifestAccountFor(top100: Top100RunContext | null | undefined, account: AccountRef) {
  const manifest = top100?.manifest;
  if (!manifest) return null;
  const wanted = lowerName(account.name);
  for (const entry of Object.values(manifest.accounts)) {
    if (account.hubspot_company_id && entry.hubspotCompanyId === account.hubspot_company_id) return entry;
    if (lowerName(entry.name) === wanted || lowerName(entry.key) === wanted) return entry;
  }
  return null;
}

/** Roster for the assembler: the matched account's people, else every roster (it matches by email or contact id anyway). */
function top100ContextFor(top100: Top100RunContext | null | undefined, account: AccountRef): Top100Context | null {
  if (!top100) return null;
  const entry = manifestAccountFor(top100, account);
  const roster = entry ? (top100.rosterByKey[entry.key] ?? []) : Object.values(top100.rosterByKey).flat();
  return { manifest: top100.manifest, roster: roster.length > 0 ? roster : null };
}

function buildSnapshot(
  inputs: RoutingInputs,
  decision: RoutingDecision,
  displayName: string | null,
  preferredSender: string | null,
): DecisionSnapshot {
  return {
    account: inputs.account,
    persona: inputs.persona,
    hypothesis: inputs.hypothesis
      ? {
          id: inputs.hypothesis.id,
          status: inputs.hypothesis.status,
          family: inputs.hypothesis.family,
          confidence: inputs.hypothesis.confidence,
        }
      : null,
    comms: inputs.comms,
    suppression: inputs.suppression,
    target: decision.target ?? null,
    displayName,
    preferredSender,
    whatIKnow: null,
  };
}

async function listDefaultAccounts(prisma: PrismaLike, cap: number): Promise<AccountRef[]> {
  const rows = (await prisma.account.findMany({
    where: { personas: { some: { is_contact_ready: true } } },
    orderBy: [{ rank: 'asc' }, { name: 'asc' }],
    take: cap,
    select: { name: true, hubspot_company_id: true },
  })) as AccountRef[];
  return rows;
}

/**
 * The interactive "Run routing" button's scope (dogfood fix, 2026-09-25).
 * `hypothesisLive` in ./rules.ts is the same "approved or active" test,
 * applied there to one already-assembled RoutingInputs; this is the
 * account-selection-time version of the same rule, over the DB directly.
 */
export const ROUTABLE_HYPOTHESIS_STATUSES = ['approved', 'active'] as const;

/** A conservative cap: an interactive click must never scan hundreds of accounts. */
export const DEFAULT_ROUTABLE_SCOPE_ACCOUNT_CAP = 25;

export interface RoutableHypothesisScope {
  hypothesesCount: number;
  accountNames: string[];
}

export interface RoutableHypothesisScopeTooLarge {
  tooLarge: true;
  accountCount: number;
  cap: number;
}

/**
 * Distinct account names carrying an approved/active hypothesis, deduplicated.
 * Refuses (rather than silently routing the world) when that set is larger
 * than `cap` -- the interactive button must never fall back to the broad
 * account universe.
 */
export async function resolveRoutableHypothesisScope(
  prisma: PrismaLike,
  cap: number = DEFAULT_ROUTABLE_SCOPE_ACCOUNT_CAP,
): Promise<RoutableHypothesisScope | RoutableHypothesisScopeTooLarge> {
  const rows: Array<{ account_name: string }> = await prisma.prospectingHypothesis.findMany({
    where: { status: { in: [...ROUTABLE_HYPOTHESIS_STATUSES] } },
    select: { account_name: true },
  });
  const accountNames = [...new Set(rows.map((r) => r.account_name))];
  if (accountNames.length > cap) {
    return { tooLarge: true, accountCount: accountNames.length, cap };
  }
  return { hypothesesCount: rows.length, accountNames };
}

/** Primary people of this account's approved/active hypotheses (routed beside the top N). */
async function hypothesisPersonaIds(prisma: PrismaLike, accountName: string): Promise<number[]> {
  if (typeof prisma?.prospectingHypothesis?.findMany !== 'function') return [];
  try {
    const rows: Array<{ primary_persona_id: number | null }> = await prisma.prospectingHypothesis.findMany({
      where: { account_name: accountName, status: { in: [...ROUTABLE_HYPOTHESIS_STATUSES] }, primary_persona_id: { not: null } },
      select: { primary_persona_id: true },
    });
    return [...new Set(rows.map((r) => r.primary_persona_id).filter((x): x is number => typeof x === 'number'))];
  } catch {
    return [];
  }
}

async function listNamedAccounts(prisma: PrismaLike, names: string[]): Promise<AccountRef[]> {
  const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n.length > 0))];
  if (unique.length === 0) return [];
  const rows = (await prisma.account.findMany({
    where: { name: { in: unique } },
    select: { name: true, hubspot_company_id: true },
  })) as AccountRef[];
  const byName = new Map(rows.map((r) => [r.name, r]));
  // Keep the caller's order; a name with no Account row still gets scanned so the assembler reports account_not_found.
  return unique.map((n) => byName.get(n) ?? { name: n, hubspot_company_id: null });
}

async function displayNames(prisma: PrismaLike, ids: number[]): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  if (ids.length === 0) return out;
  try {
    const rows = (await prisma.persona.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    })) as Array<{ id: number; name: string | null }>;
    for (const r of rows) if (r.name && r.name.trim()) out.set(r.id, r.name.trim());
  } catch {
    // A display name is a nicety; the emitter falls back to the email.
  }
  return out;
}

/** Accounts routed at once. Each account then competes for the person slots below. */
const ACCOUNT_CONCURRENCY = 3;
/**
 * People assembled at once across the whole run. Each person costs about a
 * dozen DB reads plus one Clawd suppression read (about 3s, measured
 * 2026-09-26; four in parallel take about 4.5s), so this also caps the run's
 * concurrent Clawd reads.
 */
const PERSON_CONCURRENCY = 4;
/** One account that hangs is reported failed; its unrelated neighbours still land. */
const ACCOUNT_TIMEOUT_MS = 120_000;

type AccountStep = { assembleSkip: string } | { routeSkip: string } | { inputs: RoutingInputs; decision: RoutingDecision };

type AccountOutcome =
  | { kind: 'tam_out' }
  | { kind: 'not_scanned' }
  | { kind: 'routed'; preferredSender: string | null; steps: AccountStep[] }
  | { kind: 'failed'; reason: string };

/** The last line of a driver error is the human part ("Can't reach database server ..."); never a stack. */
export function faultText(error: unknown): string {
  const text = (error instanceof Error ? error.message : String(error)).trim().split('\n').filter((l) => l.trim()).pop() ?? 'unknown error';
  return text.trim().slice(0, 200);
}

export async function runRouting(prisma: PrismaLike, opts: RunRoutingOptions, deps: RunRoutingDeps): Promise<RunReport> {
  const now = opts.now;
  const runId = opts.runId ?? `run-${now.toISOString()}`;
  const maxPairs = Math.max(0, opts.maxPairs ?? DEFAULT_MAX_PAIRS);
  const maxPersonas = Math.max(0, opts.maxPersonasPerAccount ?? DEFAULT_MAX_PERSONAS_PER_ACCOUNT);
  const dryRun = opts.dryRun === true;
  const assemble = deps.assemble ?? assembleForAccount;
  const route = deps.route ?? routePersona;
  const audit = deps.audit ?? auditEvent;

  const report: RunReport = {
    runId,
    mode: SHADOW_MODE,
    accountsScanned: 0,
    pairs: 0,
    decisions: 0,
    skips: {},
    byRule: {},
    byAction: {},
    failed: [],
    dryRun,
  };

  const explicit = Array.isArray(opts.accountNames);
  const accounts = explicit
    ? await listNamedAccounts(prisma, opts.accountNames as string[])
    : await listDefaultAccounts(prisma, maxPairs);
  const only = opts.personaIds ? [...new Set(opts.personaIds)] : null;

  // Reads (HubSpot, DB, Clawd) run concurrently and bounded; nothing is written
  // until the committer below takes the outcomes back in account order, so the
  // report and the pair budget are exactly what a one-at-a-time run produces.
  const personLimit = createLimiter(deps.personConcurrency ?? PERSON_CONCURRENCY);
  const accountLimit = createLimiter(deps.accountConcurrency ?? ACCOUNT_CONCURRENCY);
  let budgetSpent = false;

  async function routeAccount(account: AccountRef): Promise<AccountOutcome> {
    if (budgetSpent) return { kind: 'not_scanned' };
    let snapshot: HubSpotAccountSnapshot | null = null;
    if (deps.hubspotSnapshot) {
      try {
        snapshot = await deps.hubspotSnapshot(account.name, account.hubspot_company_id);
      } catch {
        snapshot = null;
      }
    }
    // The default selection is "TAM in or unknown". An explicit name is the
    // operator's choice and goes to the rules, which own the TAM-out verdict.
    if (!explicit && snapshot?.tam === 'out') return { kind: 'tam_out' };

    const results = await assemble(
      prisma,
      { accountName: account.name, now, hubspotSnapshot: snapshot, top100: top100ContextFor(deps.top100, account), suppression: deps.suppression },
      only
        ? { onlyPersonaIds: only, limit: personLimit }
        : { maxPersonas, includePersonaIds: await hypothesisPersonaIds(prisma, account.name), limit: personLimit },
    );

    const steps: AccountStep[] = [];
    for (const result of results) {
      if (isSkip(result)) {
        steps.push({ assembleSkip: result.skip });
        continue;
      }
      let outcome: RouteResult;
      try {
        outcome = route(result);
      } catch (err) {
        // The explain tripwire fired on this pair's human text (observation,
        // sequence block, would-prove-wrong). Count it and keep going (R2-3);
        // the tripwire itself stays: nothing leaky is stored. Any other error
        // fails this account only.
        if (isExplainLeakError(err)) {
          steps.push({ routeSkip: `${EXPLAIN_LEAK_MARKER}:${err.field}` });
          continue;
        }
        throw err;
      }
      steps.push(outcome.kind === 'skip' ? { routeSkip: outcome.reason } : { inputs: result, decision: outcome.decision });
    }
    return { kind: 'routed', preferredSender: manifestAccountFor(deps.top100, account)?.preferredSender ?? null, steps };
  }

  const pending = accounts.map((account) =>
    accountLimit(() => withTimeout(routeAccount(account), deps.accountTimeoutMs ?? ACCOUNT_TIMEOUT_MS, 'account_timeout')).catch(
      (error): AccountOutcome => ({ kind: 'failed', reason: faultText(error) }),
    ),
  );

  for (let i = 0; i < accounts.length; i += 1) {
    if (report.pairs >= maxPairs) break;
    const account = accounts[i];
    const outcome = await pending[i];
    if (outcome.kind === 'not_scanned') break;
    report.accountsScanned += 1;
    if (outcome.kind === 'tam_out') {
      bump(report.skips, 'tam_out');
      continue;
    }
    if (outcome.kind === 'failed') {
      report.failed.push({ accountName: account.name, reason: outcome.reason });
      continue;
    }

    const routed: Array<{ inputs: RoutingInputs; decision: RoutingDecision }> = [];
    for (const step of outcome.steps) {
      if ('assembleSkip' in step) {
        bump(report.skips, step.assembleSkip);
        continue;
      }
      if (report.pairs >= maxPairs) break;
      report.pairs += 1;
      if ('routeSkip' in step) {
        bump(report.skips, step.routeSkip);
        continue;
      }
      bump(report.byRule, step.decision.ruleId);
      bump(report.byAction, step.decision.action);
      report.decisions += 1;
      routed.push(step);
    }
    if (report.pairs >= maxPairs) budgetSpent = true;

    if (dryRun || routed.length === 0) continue;

    try {
      const names = await displayNames(
        prisma,
        routed.map((r) => r.inputs.persona.id),
      );
      for (const { inputs, decision } of routed) {
        await prisma.routingDecision.create({
          data: {
            run_id: runId,
            mode: SHADOW_MODE,
            account_name: inputs.account.name,
            persona_id: inputs.persona.id,
            hypothesis_id: inputs.hypothesis?.id ?? null,
            action: decision.action,
            lane: decision.lane,
            rule_id: decision.ruleId,
            priority: decision.priority,
            explain: decision.explain,
            inputs_snapshot: buildSnapshot(inputs, decision, names.get(inputs.persona.id) ?? null, outcome.preferredSender),
          },
          select: { id: true },
        });
      }
    } catch (error) {
      // Each row is complete on its own: a write that failed part way leaves
      // the rows already written as those people's newest cards, and the rest
      // keep their earlier ones.
      report.failed.push({ accountName: account.name, reason: `write_failed: ${faultText(error)}` });
    }
  }
  // Anything still queued (past the pair budget) starts as a no-op.
  budgetSpent = true;

  // The run's completion marker (queue.ts ROUTING_RUN_DONE): written only
  // after every account was committed, so a run the platform kills half-way
  // never becomes anyone's current card. Awaited so the rows are current the
  // moment the report returns; a failed write never fails the report (the
  // run's rows then stay out of the queue, like a killed run's).
  try {
    await audit(prisma, {
      kind: ROUTING_RUN_DONE,
      actor: opts.actor,
      subjectType: 'routing_run',
      subjectId: runId,
      payload: { ...report },
    });
  } catch {
    // audit() already swallows its own write failures
  }

  return report;
}
