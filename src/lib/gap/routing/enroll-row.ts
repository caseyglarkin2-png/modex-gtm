/**
 * Enroll-row emitter (GAP Prospecting OS, Sprint 2, S2-T8). Spec section 6.
 *
 * Turns `enroll_gap_sequence` routing decisions into the hand-enroll table
 * the Top100 lane already prints (yardflow-hubspot/top100/scripts/enroll-table.mjs):
 * one row per account, contacts as `Name <email>` joined with `<br>`, skips
 * as `Name (reason)`. A human reads this table and enrolls in HubSpot by
 * hand; nothing in this file enrolls, writes, or calls the network.
 *
 * `buildEnrollRows` and the two renderers are pure. `loadDecisions` is the
 * one reader: it takes a Prisma client (type-only import, no runtime
 * dependency) and turns the latest run's decision rows into emitter items.
 * RoutingDecision rows are written by S2-T7, which lands after this ticket,
 * so the reader is deliberately tolerant of an empty table and of rows whose
 * `inputs_snapshot` does not yet carry `account` and `persona`.
 *
 * Compile gate (S3-T10 phase 2, additive): a `hubspot_native` contact renders
 * under Enroll only when each of its four Top100 steps has a GapCompile row
 * whose verdict is `pass`, or `review_required` with an approved
 * SendApprovalRequest (`isApproved` in compiler/approval.ts). The rows are
 * the ones `scripts/gap/compile-top100.ts --persist` writes: they carry
 * `inputs_snapshot.contract.top100Compile.hubspotContactId` (the constant
 * TOP100_COMPILE_KEY in import/top100-compile.ts), and the newest row per
 * (contact, step_index) is the one that counts. Steps are checked in order
 * and the first problem names the skip: `compile_missing` when a step has no
 * row, `compile_not_passed:<stepIndex>` when it has one that is not a pass
 * or an approved review. `loadDecisions` evaluates the gate for every
 * native item and sets `EnrollRowItem.compile`; `buildEnrollRows` fails
 * closed: a native item with no `compile` field at all is `compile_missing`,
 * so a pure caller (the enroll service builds its own item) must evaluate
 * the gate, or carry `{ ok: true }` deliberately, to render a contact.
 * modex_queue and build_required items keep their own reasons. The gate
 * reads no flag: this is the human enroll table, so GAP_AUTO_ENROLL does not
 * enter into it.
 */

import type { PrismaClient } from '@prisma/client';
import { isApproved } from '../compiler/approval';
import { TOP100_COMPILE_KEY } from '../import/top100-compile';
import type { RoutingAction } from '../taxonomy';
import { resolveLatestRunId } from './queue';
import { resolveEnrollTarget } from './rules';
import type { EnrollTarget, RoutingDecision, RoutingExplain, RoutingInputs } from './types';

export const ENROLL_ACTION: RoutingAction = 'enroll_gap_sequence';

export const ENROLL_TABLE_COLUMNS = [
  'Account',
  'Sequence (HubSpot id)',
  'Send from',
  'Enroll these contacts',
  'Skip (reason)',
] as const;

export const ENROLL_TABLE_HEADER = `| ${ENROLL_TABLE_COLUMNS.join(' | ')} |`;
export const ENROLL_TABLE_DIVIDER = '|---|---|---|---|---|';

export const UNKNOWN_SENDER = 'unknown (choose at enroll time)';
export const NOT_BUILT = 'NOT BUILT';

export const SKIP_REASON: Record<Exclude<EnrollTarget, 'hubspot_native'> | 'no_email', string> = {
  build_required: 'build_required (no rig-built sequence for this account)',
  modex_queue: 'modex_queue (no native sequence; secondary lane)',
  no_email: 'no email',
};

/** Number of Top100 touches per contact; every lane sequence carries exactly four. */
export const COMPILE_GATE_STEP_COUNT = 4;

export const COMPILE_MISSING = 'compile_missing';

export function compileNotPassed(stepIndex: number): string {
  return `compile_not_passed:${stepIndex}`;
}

export type CompileGateResult =
  | { ok: true; compileIds: string[] }
  | { ok: false; reason: string; stepIndex: number | null };

export interface EnrollRowItem {
  decision: RoutingDecision;
  inputs: Pick<RoutingInputs, 'account' | 'persona'>;
  /** The inputs assembler carries no display name; the reader fills it from the Persona row. Falls back to the email. */
  displayName?: string | null;
  /** The manifest's preferred sender for the account, when known. */
  preferredSender?: string | null;
  /** The Tier A "what I know" line; rendered as a trailing `<br>` note in the contacts cell. */
  whatIKnow?: string | null;
  /**
   * The compile gate verdict for this contact (see the header). Set by
   * `loadDecisions` for every native item. Absent on a native item reads as
   * `compile_missing` (fail closed); ignored on non-native items.
   */
  compile?: CompileGateResult | null;
}

export interface EnrollContact {
  account: string;
  personaId: number;
  hubspotContactId: string | null;
  name: string;
  email: string;
  whatIKnow: string | null;
}

export interface SkipRow {
  account: string;
  personaId: number;
  name: string;
  email: string | null;
  reason: string;
}

export interface EnrollRow {
  account: string;
  hubspotCompanyId: string | null;
  sequence: { hubspotSequenceId: string; name: string } | null;
  sendFrom: string;
  contacts: EnrollContact[];
  skips: SkipRow[];
}

export interface EnrollTable {
  rows: EnrollRow[];
  /** Every skip across every account, in table order. */
  skipped: SkipRow[];
}

// ---------------------------------------------------------------------------
// Pure: decisions -> table
// ---------------------------------------------------------------------------

function targetOf(item: EnrollRowItem): EnrollTarget {
  if (item.decision.target) return item.decision.target;
  // Same resolution routePersona uses; it reads only persona.top100.
  return resolveEnrollTarget({ persona: item.inputs.persona } as RoutingInputs);
}

function displayNameOf(item: EnrollRowItem): string {
  const n = item.displayName?.trim();
  if (n) return n;
  const e = item.inputs.persona.email?.trim();
  if (e) return e;
  return item.inputs.persona.hubspotContactId ? `contact ${item.inputs.persona.hubspotContactId}` : `persona ${item.inputs.persona.id}`;
}

/** Group by account name, in first-seen order. Non-enroll decisions are ignored. */
export function buildEnrollRows(items: EnrollRowItem[]): EnrollTable {
  const rows = new Map<string, EnrollRow>();
  const skipped: SkipRow[] = [];

  for (const item of items) {
    if (item.decision.action !== ENROLL_ACTION) continue;
    const { account, persona } = item.inputs;

    let row = rows.get(account.name);
    if (!row) {
      row = {
        account: account.name,
        hubspotCompanyId: account.hubspotCompanyId ?? null,
        sequence: null,
        sendFrom: UNKNOWN_SENDER,
        contacts: [],
        skips: [],
      };
      rows.set(account.name, row);
    }
    const top100 = persona.top100 ?? null;
    if (!row.sequence && top100?.hubspotSequenceId) {
      row.sequence = { hubspotSequenceId: top100.hubspotSequenceId, name: top100.sequenceName ?? '' };
    }
    if (row.sendFrom === UNKNOWN_SENDER && item.preferredSender?.trim()) row.sendFrom = item.preferredSender.trim();

    const name = displayNameOf(item);
    const email = persona.email?.trim() || null;
    const skip = (reason: string) => {
      const s: SkipRow = { account: account.name, personaId: persona.id, name, email, reason };
      row!.skips.push(s);
      skipped.push(s);
    };

    // The lane's filter, in its order: a sequence_block wins over everything else.
    if (top100?.sequenceBlock) {
      skip(top100.sequenceBlock);
      continue;
    }
    const target = targetOf(item);
    if (target !== 'hubspot_native') {
      skip(SKIP_REASON[target]);
      continue;
    }
    if (!email) {
      skip(SKIP_REASON.no_email);
      continue;
    }
    // Compile gate, fail closed: only copy the compiler passed (or a human
    // approved) is enrollable, and a native item nobody evaluated is missing.
    if (!item.compile) {
      skip(COMPILE_MISSING);
      continue;
    }
    if (!item.compile.ok) {
      skip(item.compile.reason);
      continue;
    }
    row.contacts.push({
      account: account.name,
      personaId: persona.id,
      hubspotContactId: persona.hubspotContactId ?? null,
      name,
      email,
      whatIKnow: item.whatIKnow?.trim() || null,
    });
  }

  return { rows: [...rows.values()], skipped };
}

// ---------------------------------------------------------------------------
// Renderers
// ---------------------------------------------------------------------------

/** A cell must not break the table: pipes are escaped, newlines become `<br>`. */
function cell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

function contactCell(c: EnrollContact): string {
  const base = `${cell(c.name)} <${cell(c.email)}>`;
  return c.whatIKnow ? `${base}<br>what I know: ${cell(c.whatIKnow)}` : base;
}

function skipCell(s: SkipRow): string {
  return `${cell(s.name)} (${cell(s.reason)})`;
}

/** Exactly the lane's table: header, divider, one line per account. */
export function renderEnrollTableMarkdown(table: EnrollTable): string {
  const lines = [ENROLL_TABLE_HEADER, ENROLL_TABLE_DIVIDER];
  for (const row of table.rows) {
    const sequence = row.sequence ? `${cell(row.sequence.name)} (${cell(row.sequence.hubspotSequenceId)})` : NOT_BUILT;
    const contacts = row.contacts.map(contactCell).join('<br>') || 'none';
    const skips = row.skips.map(skipCell).join('<br>');
    lines.push(`| ${cell(row.account)} | ${sequence} | ${cell(row.sendFrom)} | ${contacts} | ${skips} |`);
  }
  return lines.join('\n');
}

export interface EnrollTableJson {
  columns: readonly string[];
  rows: Array<{
    account: string;
    hubspotCompanyId: string | null;
    sequence: { hubspotSequenceId: string; name: string } | null;
    sendFrom: string;
    enroll: Array<Omit<EnrollContact, 'account'>>;
    skip: Array<Omit<SkipRow, 'account'>>;
  }>;
  enrollCount: number;
  skipCount: number;
}

export function renderEnrollTableJson(table: EnrollTable): EnrollTableJson {
  const rows = table.rows.map((row) => ({
    account: row.account,
    hubspotCompanyId: row.hubspotCompanyId,
    sequence: row.sequence,
    sendFrom: row.sendFrom,
    enroll: row.contacts.map((c) => ({
      personaId: c.personaId,
      hubspotContactId: c.hubspotContactId,
      name: c.name,
      email: c.email,
      whatIKnow: c.whatIKnow,
    })),
    skip: row.skips.map((s) => ({ personaId: s.personaId, name: s.name, email: s.email, reason: s.reason })),
  }));
  return {
    columns: ENROLL_TABLE_COLUMNS,
    rows,
    enrollCount: rows.reduce((n, r) => n + r.enroll.length, 0),
    skipCount: table.skipped.length,
  };
}

// ---------------------------------------------------------------------------
// Reader: RoutingDecision rows -> items
// ---------------------------------------------------------------------------

/** The routing reader plus the two tables the compile gate reads (`gapCompile.findMany`, `sendApprovalRequest.findFirst`). */
type DecisionReader = Pick<PrismaClient, 'routingDecision' | 'systemConfig' | 'gapCompile' | 'sendApprovalRequest'>;

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function optStr(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null;
}

const TARGETS: ReadonlySet<string> = new Set<EnrollTarget>(['hubspot_native', 'modex_queue', 'build_required']);

const EMPTY_EXPLAIN: RoutingExplain = {
  whyAccount: '',
  whyPerson: '',
  whyProblem: '',
  whyNow: '',
  whyAction: '',
  evidenceIds: [],
  signalIds: [],
  wouldProveWrong: '',
};

interface DecisionRow {
  id: string;
  run_id: string;
  action: string;
  lane: string;
  rule_id: string;
  priority: number;
  explain: unknown;
  inputs_snapshot: unknown;
  persona: { name: string } | null;
}

/**
 * Read the `enroll_gap_sequence` decisions of one run. When `runId` is
 * omitted the run is the `gap_routing_last_run` pointer, falling back to the
 * newest row only when the pointer is missing (N6), so a partial run never
 * feeds the enroll table. An empty table, or a run with no enroll decisions,
 * yields an empty list, never an error. Rows whose snapshot lacks `account`
 * or `persona` objects are dropped: the emitter cannot name what it cannot see.
 */
export async function loadDecisions(prisma: DecisionReader, runId?: string): Promise<EnrollRowItem[]> {
  const run = runId || (await resolveLatestRunId(prisma));
  if (!run) return [];
  const rows = (await prisma.routingDecision.findMany({
    where: { run_id: run, action: ENROLL_ACTION },
    orderBy: [{ priority: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      run_id: true,
      action: true,
      lane: true,
      rule_id: true,
      priority: true,
      explain: true,
      inputs_snapshot: true,
      persona: { select: { name: true } },
    },
  })) as unknown as DecisionRow[];

  const items: EnrollRowItem[] = [];
  for (const row of rows) {
    const snap = row.inputs_snapshot;
    if (!isObj(snap) || !isObj(snap.account) || !isObj(snap.persona)) continue;
    const target = optStr(snap.target);
    const decision: RoutingDecision = {
      action: row.action as RoutingAction,
      lane: row.lane as RoutingDecision['lane'],
      ruleId: row.rule_id,
      priority: row.priority,
      blocked: row.lane === 'blocked',
      explain: isObj(row.explain) ? (row.explain as unknown as RoutingExplain) : EMPTY_EXPLAIN,
      ...(target && TARGETS.has(target) ? { target: target as EnrollTarget } : {}),
    };
    const item: EnrollRowItem = {
      decision,
      inputs: {
        account: snap.account as unknown as RoutingInputs['account'],
        persona: snap.persona as unknown as RoutingInputs['persona'],
      },
      displayName: optStr(snap.displayName) ?? optStr(row.persona?.name),
      preferredSender: optStr(snap.preferredSender),
      whatIKnow: optStr(snap.whatIKnow),
    };
    if (targetOf(item) === 'hubspot_native') {
      item.compile = await loadCompileGate(prisma, item.inputs.persona.hubspotContactId ?? null);
    }
    items.push(item);
  }
  return items;
}

// ---------------------------------------------------------------------------
// Compile gate reader
// ---------------------------------------------------------------------------

type CompileGateReader = Pick<DecisionReader, 'gapCompile' | 'sendApprovalRequest'>;

interface CompileGateRow {
  id: string;
  step_index: number | null;
  verdict: string;
}

/**
 * Evaluate the compile gate for one Top100 contact (see the header). Reads
 * the compile rows keyed to the contact through
 * `inputs_snapshot.contract.<TOP100_COMPILE_KEY>.hubspotContactId`, newest
 * first, keeps the newest per step_index, then walks steps 0..3 in order:
 * no row -> `compile_missing`; `pass` -> next step; `review_required` with an
 * approved request -> next step; anything else -> `compile_not_passed:<i>`.
 * A contact without a HubSpot id has no key to look up and is
 * `compile_missing`. Never writes.
 */
export async function loadCompileGate(
  prisma: CompileGateReader,
  hubspotContactId: string | null,
  stepCount = COMPILE_GATE_STEP_COUNT,
): Promise<CompileGateResult> {
  if (!hubspotContactId) return { ok: false, reason: COMPILE_MISSING, stepIndex: null };

  const raw = await prisma.gapCompile.findMany({
    where: { inputs_snapshot: { path: ['contract', TOP100_COMPILE_KEY, 'hubspotContactId'], equals: hubspotContactId } },
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    select: { id: true, step_index: true, verdict: true },
  });
  const rows: CompileGateRow[] = Array.isArray(raw) ? raw : [];

  const newestByStep = new Map<number, CompileGateRow>();
  for (const row of rows) {
    if (typeof row.step_index !== 'number') continue;
    if (!newestByStep.has(row.step_index)) newestByStep.set(row.step_index, row);
  }

  const compileIds: string[] = [];
  for (let stepIndex = 0; stepIndex < stepCount; stepIndex += 1) {
    const row = newestByStep.get(stepIndex);
    if (!row) return { ok: false, reason: COMPILE_MISSING, stepIndex };
    if (row.verdict === 'pass') {
      compileIds.push(row.id);
      continue;
    }
    if (row.verdict === 'review_required') {
      const approval = await isApproved(prisma, row.id);
      if (approval.approved) {
        compileIds.push(row.id);
        continue;
      }
    }
    return { ok: false, reason: compileNotPassed(stepIndex), stepIndex };
  }
  return { ok: true, compileIds };
}
