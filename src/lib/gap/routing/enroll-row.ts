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
 */

import type { PrismaClient } from '@prisma/client';
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

export interface EnrollRowItem {
  decision: RoutingDecision;
  inputs: Pick<RoutingInputs, 'account' | 'persona'>;
  /** The inputs assembler carries no display name; the reader fills it from the Persona row. Falls back to the email. */
  displayName?: string | null;
  /** The manifest's preferred sender for the account, when known. */
  preferredSender?: string | null;
  /** The Tier A "what I know" line; rendered as a trailing `<br>` note in the contacts cell. */
  whatIKnow?: string | null;
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

type DecisionReader = Pick<PrismaClient, 'routingDecision' | 'systemConfig'>;

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
    items.push({
      decision,
      inputs: {
        account: snap.account as unknown as RoutingInputs['account'],
        persona: snap.persona as unknown as RoutingInputs['persona'],
      },
      displayName: optStr(snap.displayName) ?? optStr(row.persona?.name),
      preferredSender: optStr(snap.preferredSender),
      whatIKnow: optStr(snap.whatIKnow),
    });
  }
  return items;
}
