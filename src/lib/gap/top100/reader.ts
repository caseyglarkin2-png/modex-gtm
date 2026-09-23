/**
 * Top100 lane reader (pure parsers).
 *
 * The lane at C:\Users\casey\yardflow-hubspot\top100 is the record of the live
 * outbound program: run_manifest.json (accounts, built sequences, senders),
 * data/roster/<key>.json (the people per account and their eligibility),
 * EXCLUSIONS.csv (accounts that must never be approached), and
 * data/monitor/<day>.json (the daily send and reply tally).
 *
 * These parsers are the only place those shapes are interpreted. They take
 * already-parsed JSON or raw CSV text and never touch the filesystem, so a
 * CLI feeds them file contents and a test feeds them fixtures. If the lane
 * changes a field name or a value vocabulary, it fails here first, with a
 * named reason, instead of silently reaching routing or HubSpot.
 *
 * Vocabulary notes, read from the lane on 2026-09-23:
 * - manifest sequence.state values seen: ENROLLED, BUILT_NOT_ENROLLED, PARKED.
 *   PARKED carries only a state, no sequence id, and is not a built sequence.
 * - manifest reserve[] holds objects {key, score, confidence}, not bare keys.
 * - roster eligibility values seen: the eight in KNOWN_ELIGIBILITIES below.
 * - roster priority is numeric.
 * - a roster person may carry sequence_block (HUBSPOT_CROSS_ACCOUNT_BOUNCE);
 *   scripts/enroll-table.mjs in the lane skips those, and eligibleForEnroll
 *   mirrors that filter exactly.
 */

export interface Top100ManifestSequence {
  hubspotSequenceId: string;
  name: string;
  templateIds: Record<string, string>;
  delaysBusinessDays: number[];
  builtAt: string | null;
  enrolled: number;
  state: 'ENROLLED' | 'BUILT_NOT_ENROLLED' | 'BUILT_MISMATCH' | (string & {});
  enrolledCheckedAt: string | null;
}

export interface Top100ManifestAccount {
  key: string;
  name: string;
  domain: string | null;
  hubspotCompanyId: string | null;
  tier: string | null;
  segment: string | null;
  rank: number | null;
  score: number | null;
  preferredSender: string | null;
  selected: boolean;
  sequence: Top100ManifestSequence | null;
  branches: Record<string, unknown>;
}

export interface Top100ReserveEntry {
  key: string;
  score: number | null;
  confidence: string | null;
}

export interface Top100Manifest {
  runId: string;
  portal: string;
  accounts: Record<string, Top100ManifestAccount>;
  selectedKeys: string[];
  reserveKeys: string[];
  reserve: Top100ReserveEntry[];
  senders: Record<string, { status: string | null; notes: string | null }>;
  warnings: string[];
}

export const KNOWN_ELIGIBILITIES = [
  'ELIGIBLE',
  'EMAIL_UNVERIFIED',
  'HOLD_RECENT_TOUCH',
  'IN_SEQUENCE',
  'RESEARCH_ONLY_NO_EMAIL',
  'HOLD_TITLE_CHANGED',
  'EMAIL_BAD',
  'WARM_PERSONAL',
] as const;

export type KnownRosterEligibility = (typeof KNOWN_ELIGIBILITIES)[number];
export type RosterEligibility = KnownRosterEligibility | (string & {});

export interface Top100RosterPerson {
  key: string;
  name: string;
  title: string | null;
  functions: string[];
  hubspotContactId: string | null;
  email: string | null;
  emailState: string | null;
  emailSource: string | null;
  eligibility: RosterEligibility;
  eligibilityKnown: boolean;
  sequenceBlock: string | null;
  suppression: string | null;
  suppressionDetail: string | null;
  lastTouch: string | null;
  touchLane: string | null;
  replyAuditVerdict: string | null;
  priority: number | null;
  selected: boolean;
  crmStatus: string | null;
}

export interface Top100Roster {
  key: string;
  people: Top100RosterPerson[];
  warnings: string[];
}

export interface Top100Exclusion {
  entity: string;
  canonicalIdentity: string;
  hubspotCompanyId: string | null;
  reason: string;
  supportingSourceId: string;
  owner: string;
  checkedAt: string;
  releaseRequirement: string;
}

export interface Top100IdentityLoad {
  sent: number;
  bounced: number;
}

export interface Top100Monitor {
  day: string;
  at: string;
  contactsWithCopy: number;
  enrolled: number;
  enrolledByAccount: Record<string, number>;
  sendsByIdentity: Record<string, Top100IdentityLoad>;
  replies: string[];
  bounced: string[];
  optedOut: string[];
  halts: string[];
}

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Non-empty string or null. The lane writes '' where it means "unset". */
function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function fail(reason: string): never {
  throw new Error(reason);
}

// ---------------------------------------------------------------------------
// run_manifest.json
// ---------------------------------------------------------------------------

function parseSequence(key: string, raw: unknown, warnings: string[]): Top100ManifestSequence | null {
  if (raw === undefined || raw === null) return null;
  if (!isObj(raw)) {
    warnings.push(`${key}: sequence is not an object`);
    return null;
  }
  const id = str(raw.hubspot_sequence_id);
  const state = str(raw.state) ?? 'UNKNOWN';
  if (!id) {
    warnings.push(`${key}: sequence.state ${state} without hubspot_sequence_id`);
    return null;
  }
  const templateIds: Record<string, string> = {};
  if (isObj(raw.templates)) {
    for (const [step, tid] of Object.entries(raw.templates)) {
      const t = typeof tid === 'number' ? String(tid) : str(tid);
      if (t) templateIds[step] = t;
    }
  } else {
    warnings.push(`${key}: sequence.templates missing`);
  }
  const delays = Array.isArray(raw.delays_business_days)
    ? raw.delays_business_days.filter((d): d is number => typeof d === 'number')
    : [];
  if (!Array.isArray(raw.delays_business_days)) warnings.push(`${key}: sequence.delays_business_days missing`);
  const name = str(raw.name);
  if (!name) warnings.push(`${key}: sequence.name missing`);
  const enrolled = num(raw.enrolled);
  if (enrolled === null) warnings.push(`${key}: sequence.enrolled missing`);
  if (!str(raw.state)) warnings.push(`${key}: sequence.state missing`);
  return {
    hubspotSequenceId: id,
    name: name ?? '',
    templateIds,
    delaysBusinessDays: delays,
    builtAt: str(raw.built_at),
    enrolled: enrolled ?? 0,
    state,
    enrolledCheckedAt: str(raw.enrolled_checked_at),
  };
}

function parseAccount(key: string, raw: unknown, warnings: string[]): Top100ManifestAccount {
  if (!isObj(raw)) fail(`bad_manifest: account ${key} is not an object`);
  const name = str(raw.name);
  if (!name) warnings.push(`${key}: name missing`);
  return {
    key: str(raw.key) ?? key,
    name: name ?? '',
    domain: str(raw.domain),
    hubspotCompanyId: str(raw.company_id),
    tier: str(raw.tier),
    segment: str(raw.segment),
    rank: num(raw.rank),
    score: num(raw.score),
    preferredSender: str(raw.preferred_sender),
    selected: raw.selected === true,
    sequence: parseSequence(key, raw.sequence, warnings),
    branches: isObj(raw.branches) ? raw.branches : {},
  };
}

/** Parse run_manifest.json. Throws `bad_manifest` when the top level or `accounts` is not an object. */
export function parseManifest(json: unknown): Top100Manifest {
  if (!isObj(json)) fail('bad_manifest: not an object');
  if (!isObj(json.accounts)) fail('bad_manifest: accounts is not an object');
  const warnings: string[] = [];
  const accounts: Record<string, Top100ManifestAccount> = {};
  for (const [key, raw] of Object.entries(json.accounts)) {
    accounts[key] = parseAccount(key, raw, warnings);
  }
  const reserve: Top100ReserveEntry[] = [];
  if (Array.isArray(json.reserve)) {
    for (const r of json.reserve) {
      if (typeof r === 'string') reserve.push({ key: r, score: null, confidence: null });
      else if (isObj(r) && str(r.key)) reserve.push({ key: str(r.key) as string, score: num(r.score), confidence: str(r.confidence) });
      else warnings.push('reserve entry without a key');
    }
  }
  const senders: Top100Manifest['senders'] = {};
  if (isObj(json.senders)) {
    for (const [identity, s] of Object.entries(json.senders)) {
      senders[identity] = isObj(s) ? { status: str(s.status), notes: str(s.notes) } : { status: null, notes: null };
    }
  }
  const runId = str(json.run_id);
  if (!runId) warnings.push('run_id missing');
  const portalRaw = json.portal;
  const portal = typeof portalRaw === 'number' ? String(portalRaw) : (str(portalRaw) ?? '');
  if (!portal) warnings.push('portal missing');
  return {
    runId: runId ?? '',
    portal,
    accounts,
    selectedKeys: strList(json.selected_keys),
    reserveKeys: reserve.map((r) => r.key),
    reserve,
    senders,
    warnings,
  };
}

export function readManifest(text: string): Top100Manifest {
  return parseManifest(JSON.parse(text));
}

/** Accounts with a HubSpot sequence id, sorted by rank ascending; null ranks last, ties by key. */
export function builtSequences(manifest: Top100Manifest): Top100ManifestAccount[] {
  return Object.values(manifest.accounts)
    .filter((a) => a.sequence !== null)
    .sort((a, b) => {
      if (a.rank === null && b.rank === null) return a.key.localeCompare(b.key);
      if (a.rank === null) return 1;
      if (b.rank === null) return -1;
      return a.rank - b.rank || a.key.localeCompare(b.key);
    });
}

// ---------------------------------------------------------------------------
// data/roster/<key>.json
// ---------------------------------------------------------------------------

const KNOWN_ELIGIBILITY_SET: ReadonlySet<string> = new Set(KNOWN_ELIGIBILITIES);

function parsePerson(rosterKey: string, raw: unknown, index: number, warnings: string[]): Top100RosterPerson {
  if (!isObj(raw)) fail(`bad_roster: selected_people[${index}] is not an object`);
  const name = str(raw.name) ?? `#${index}`;
  const eligibilityRaw = str(raw.eligibility);
  const eligibility: RosterEligibility = eligibilityRaw ?? 'UNKNOWN';
  const eligibilityKnown = eligibilityRaw !== null && KNOWN_ELIGIBILITY_SET.has(eligibilityRaw);
  if (!eligibilityKnown) warnings.push(`${rosterKey}: ${name}: unknown eligibility ${eligibility}`);
  const replyAudit = isObj(raw.reply_audit) ? str(raw.reply_audit.verdict) : null;
  const contactId = typeof raw.hubspot_contact_id === 'number' ? String(raw.hubspot_contact_id) : str(raw.hubspot_contact_id);
  const priority = num(raw.priority);
  return {
    key: str(raw.key) ?? rosterKey,
    name,
    title: str(raw.title),
    functions: strList(raw.functions),
    hubspotContactId: contactId,
    email: str(raw.email),
    emailState: str(raw.email_state),
    emailSource: str(raw.email_source),
    eligibility,
    eligibilityKnown,
    sequenceBlock: str(raw.sequence_block),
    suppression: str(raw.suppression),
    suppressionDetail: str(raw.suppression_detail),
    lastTouch: str(raw.last_touch),
    touchLane: str(raw.touch_lane),
    replyAuditVerdict: replyAudit,
    priority,
    selected: raw.selected === true,
    crmStatus: str(raw.crm_status),
  };
}

/** Parse one roster file. Throws `bad_roster` when the top level or `selected_people` is malformed. */
export function parseRoster(json: unknown): Top100Roster {
  if (!isObj(json)) fail('bad_roster: not an object');
  if (!Array.isArray(json.selected_people)) fail('bad_roster: selected_people is not an array');
  const warnings: string[] = [];
  const key = str(json.key) ?? '';
  if (!key) warnings.push('roster key missing');
  const people = json.selected_people.map((p, i) => parsePerson(key, p, i, warnings));
  return { key, people, warnings };
}

export function readRoster(text: string): Top100Roster {
  return parseRoster(JSON.parse(text));
}

/**
 * Mirror of the lane's enroll filter (scripts/enroll-table.mjs):
 * `p.eligibility === 'ELIGIBLE' && p.email && !p.sequence_block`.
 */
export function eligibleForEnroll(person: Top100RosterPerson): boolean {
  return person.eligibility === 'ELIGIBLE' && !!person.email && !person.sequenceBlock;
}

// ---------------------------------------------------------------------------
// EXCLUSIONS.csv
// ---------------------------------------------------------------------------

export const EXCLUSIONS_HEADER = [
  'entity',
  'canonical_identity',
  'hubspot_company_id',
  'reason',
  'supporting_source_id',
  'owner',
  'checked_at',
  'release_requirement',
] as const;

/**
 * Small RFC 4180 tolerant CSV parser: quoted fields may hold commas, doubled
 * quotes and newlines; CRLF and a leading BOM are accepted; a trailing newline
 * does not produce an empty record.
 */
export function parseCsv(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      quoted = true;
      i += 1;
      continue;
    }
    if (c === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (c === '\r' || c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += c === '\r' && src[i + 1] === '\n' ? 2 : 1;
      continue;
    }
    field += c;
    i += 1;
  }
  if (quoted) fail('bad_csv: unterminated quoted field');
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Parse EXCLUSIONS.csv. Throws `bad_exclusions_header` on a header mismatch and `bad_exclusions_row:<line>` on a short or long row. */
export function parseExclusionsCsv(text: string): Top100Exclusion[] {
  const rows = parseCsv(text);
  const header = rows[0];
  if (!header || header.length !== EXCLUSIONS_HEADER.length || header.some((h, i) => h.trim() !== EXCLUSIONS_HEADER[i])) {
    fail(`bad_exclusions_header: got ${JSON.stringify(header ?? [])}`);
  }
  const out: Top100Exclusion[] = [];
  for (let r = 1; r < rows.length; r += 1) {
    const cells = rows[r];
    if (cells.length === 1 && cells[0] === '') continue;
    if (cells.length !== EXCLUSIONS_HEADER.length) fail(`bad_exclusions_row:${r + 1}: ${cells.length} columns`);
    out.push({
      entity: cells[0],
      canonicalIdentity: cells[1],
      hubspotCompanyId: str(cells[2]),
      reason: cells[3],
      supportingSourceId: cells[4],
      owner: cells[5],
      checkedAt: cells[6],
      releaseRequirement: cells[7],
    });
  }
  return out;
}

export function readExclusions(text: string): Top100Exclusion[] {
  return parseExclusionsCsv(text);
}

// ---------------------------------------------------------------------------
// data/monitor/<day>.json
// ---------------------------------------------------------------------------

function numRecord(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (isObj(v)) for (const [k, n] of Object.entries(v)) if (typeof n === 'number') out[k] = n;
  return out;
}

/** Parse a monitor day file. Throws `bad_monitor` when the top level or `day` is missing. */
export function parseMonitor(json: unknown): Top100Monitor {
  if (!isObj(json)) fail('bad_monitor: not an object');
  const day = str(json.day);
  if (!day) fail('bad_monitor: day missing');
  const sendsByIdentity: Record<string, Top100IdentityLoad> = {};
  if (isObj(json.sends_by_identity)) {
    for (const [identity, v] of Object.entries(json.sends_by_identity)) {
      sendsByIdentity[identity] = {
        sent: isObj(v) ? (num(v.sent) ?? 0) : 0,
        bounced: isObj(v) ? (num(v.bounced) ?? 0) : 0,
      };
    }
  }
  return {
    day,
    at: str(json.at) ?? '',
    contactsWithCopy: num(json.contacts_with_copy) ?? 0,
    enrolled: num(json.enrolled) ?? 0,
    enrolledByAccount: numRecord(json.enrolled_by_account),
    sendsByIdentity,
    replies: strList(json.replies_since_0914),
    bounced: strList(json.bounced),
    optedOut: strList(json.opted_out),
    halts: strList(json.halts),
  };
}

export function readMonitor(text: string): Top100Monitor {
  return parseMonitor(JSON.parse(text));
}

/** Sent and bounced counts for one sender identity; zeros when the identity is absent. */
export function identityLoad(monitor: Top100Monitor, identity: string): Top100IdentityLoad {
  const v = monitor.sendsByIdentity[identity];
  return v ? { sent: v.sent, bounced: v.bounced } : { sent: 0, bounced: 0 };
}
