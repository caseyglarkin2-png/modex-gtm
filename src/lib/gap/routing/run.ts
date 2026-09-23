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
 * the only side effects are `routing_decisions` rows, one SystemConfig key
 * (`gap_routing_last_run`) and one fire-and-forget audit event. A structural
 * test greps this file to prove the other mode value never appears here.
 *
 * Everything with a network or a clock is injected through `deps`:
 * - `suppression`: the routing-time suppression read (never the send gate).
 * - `hubspotSnapshot`: the per-account HubSpot read; absent means a null
 *   snapshot and `tam: 'unknown'`, which the rules route to research.
 * - `top100`: the Top100 manifest and rosters, when the caller has them.
 * - `assemble` / `route` / `audit`: the real functions by default, mocks in
 *   tests. No test in this module touches the network.
 */

import { audit as auditEvent } from '../audit';
import type { Top100Manifest, Top100RosterPerson } from '../top100/reader';
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
export const LAST_RUN_CONFIG_KEY = 'gap_routing_last_run';

export interface RunRoutingOptions {
  now: Date;
  /** Defaults to `run-<now ISO>`. */
  runId?: string;
  /** Explicit accounts. Default: every Account with a contact-ready persona, rank order, TAM out dropped. */
  accountNames?: string[];
  /** Hard cap on (account, persona) pairs routed in one run. */
  maxPairs?: number;
  maxPersonasPerAccount?: number;
  /** Count only; no row, no SystemConfig write. */
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

/**
 * Build the assembler's snapshot from the fields `getCompanyById` returns.
 * That reader fetches `yardflow_tam` only, so tier, intent and trigger fields
 * stay empty here and heat ranks by fresh triggers alone. A null company (no
 * HubSpot config, no id, or a failed read) is a null snapshot.
 */
export function snapshotFromCompany(company: { yardflow_tam?: string | null } | null | undefined): HubSpotAccountSnapshot | null {
  if (!company) return null;
  return { tam: tamFromProperty(company.yardflow_tam), tamTier: '' };
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
    dryRun,
  };

  const explicit = Array.isArray(opts.accountNames);
  const accounts = explicit
    ? await listNamedAccounts(prisma, opts.accountNames as string[])
    : await listDefaultAccounts(prisma, maxPairs);

  for (const account of accounts) {
    if (report.pairs >= maxPairs) break;
    report.accountsScanned += 1;

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
    if (!explicit && snapshot?.tam === 'out') {
      bump(report.skips, 'tam_out');
      continue;
    }

    const manifestAccount = manifestAccountFor(deps.top100, account);
    const preferredSender = manifestAccount?.preferredSender ?? null;

    const results = await assemble(
      prisma,
      { accountName: account.name, now, hubspotSnapshot: snapshot, top100: top100ContextFor(deps.top100, account), suppression: deps.suppression },
      { maxPersonas },
    );

    const routed: Array<{ inputs: RoutingInputs; decision: RoutingDecision }> = [];
    for (const result of results) {
      if (isSkip(result)) {
        bump(report.skips, result.skip);
        continue;
      }
      if (report.pairs >= maxPairs) break;
      report.pairs += 1;
      const outcome = route(result);
      if (outcome.kind === 'skip') {
        bump(report.skips, outcome.reason);
        continue;
      }
      bump(report.byRule, outcome.decision.ruleId);
      bump(report.byAction, outcome.decision.action);
      report.decisions += 1;
      routed.push({ inputs: result, decision: outcome.decision });
    }

    if (dryRun || routed.length === 0) continue;

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
          inputs_snapshot: buildSnapshot(inputs, decision, names.get(inputs.persona.id) ?? null, preferredSender),
        },
        select: { id: true },
      });
    }
  }

  if (!dryRun) {
    try {
      await prisma.systemConfig.upsert({
        where: { key: LAST_RUN_CONFIG_KEY },
        update: { value: runId },
        create: { key: LAST_RUN_CONFIG_KEY, value: runId },
      });
    } catch {
      // The pointer is a convenience; the rows carry run_id themselves.
    }
  }

  // Fire-and-forget: the audit ledger never gates the report.
  void Promise.resolve()
    .then(() =>
      audit(prisma, {
        kind: 'routing.run',
        actor: opts.actor,
        subjectType: 'routing_run',
        subjectId: runId,
        payload: { ...report },
      }),
    )
    .catch(() => undefined);

  return report;
}
