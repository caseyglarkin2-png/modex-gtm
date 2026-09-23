/**
 * GAP Prospecting OS, Sprint 4, S4-T6: the native unenroll-on-reply probe.
 * PREPARED ONLY. It decides whether a reply to a HubSpot-native Top100
 * sequence unenrolls the replier by itself (section 7: "unenroll by API once
 * the write probe passes"; section 11 lane: "a reply unenrolls the replier
 * natively in HubSpot").
 *
 * READ THIS BEFORE RUNNING WITH --confirm
 * ---------------------------------------
 * Every request this script can make is a read (HTTP GET). It never sends,
 * never enrolls, never unenrolls and never changes a HubSpot record. Even so,
 * the reads run against the live portal with the private-app token, so they
 * need the owner's go recorded in docs/GAP_PROSPECTING_OS.md section 15 as a
 * line containing `OWNER GO native unenroll` and a date, and the same date in
 * env OWNER_GO_NATIVE_UNENROLL. Do not record that line on Casey's behalf.
 *
 * The verification is two phases around a reply that a human sends from an
 * internal mailbox (freightroll.com or yardflow.ai) after the internal contact
 * was enrolled by hand in the HubSpot UI:
 *   before  the contact's enrollment in the named sequence reads as active
 *   (human) the internal contact replies to the sequence email
 *   after   an INCOMING_EMAIL engagement from that contact exists with a
 *           timestamp after the enrollment, AND the enrollment no longer reads
 *           as active (or is absent)
 * Both phases print the sequence settings so the unenroll-on-reply setting is
 * on the record next to the observed behavior.
 *
 * Modes:
 *   npx tsx scripts/gap/probe-native-unenroll.ts
 *       dry run: prints exactly what it WOULD do, makes NO network call, exits 0.
 *   npx tsx scripts/gap/probe-native-unenroll.ts --confirm --phase before|after \
 *       --sequence-id <id> --contact-id <id> --contact-email <internal email>
 *       live reads: every gate below must pass or it prints `REFUSED: <reason>`
 *       and exits 2.
 *
 * Gates for the reads (all required, in this order): `--confirm`; a line with
 * `OWNER GO native unenroll <date>` in section 15 of the spec
 * (`owner_go_not_recorded` otherwise); env OWNER_GO_NATIVE_UNENROLL set
 * (`owner_go_env_missing`) and equal to that date (`owner_go_mismatch`);
 * `--phase`, `--sequence-id`, a numeric `--contact-id` and an internal
 * `--contact-email`; HUBSPOT_ACCESS_TOKEN present. Exit codes: 0 done,
 * 2 refused, 1 an HTTP failure or a failed criterion.
 *
 * HUBSPOT_ACCESS_TOKEN is deleted from process.env at startup unless
 * `--confirm` and a matching owner go are BOTH present, so a dry run or a
 * refused run holds no credential at all. No function in this file touches
 * `fetch` until every gate has passed.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

const HUBSPOT_USER_ID = '85093129';
const HUBSPOT_BASE = 'https://api.hubapi.com';
const PORTAL_ID = '3819073';
const OWNER_GO_MARKER = 'OWNER GO native unenroll';
const OWNER_GO_ENV = 'OWNER_GO_NATIVE_UNENROLL';
const INTERNAL_DOMAINS = ['freightroll.com', 'yardflow.ai'] as const;
const SPEC_PATH = path.join(process.cwd(), 'docs', 'GAP_PROSPECTING_OS.md');
const EMAIL_PROPERTIES = ['hs_timestamp', 'hs_email_direction', 'hs_email_from_email', 'hs_email_subject'] as const;
const MAX_ENGAGEMENTS = 25;

export const PHASES = ['before', 'after'] as const;
export type Phase = (typeof PHASES)[number];

// Ids are gated to digits before any of these reach the network, so no
// encoding is needed and the dry run can print `<contact-id>` placeholders as is.
export const enrollmentsUrl = (contactId: string): string =>
  `${HUBSPOT_BASE}/automation/v4/sequences/enrollments/contact/${contactId}?userId=${HUBSPOT_USER_ID}`;
export const sequenceUrl = (sequenceId: string): string =>
  `${HUBSPOT_BASE}/automation/v4/sequences/${sequenceId}?userId=${HUBSPOT_USER_ID}`;
export const emailAssociationsUrl = (contactId: string): string =>
  `${HUBSPOT_BASE}/crm/v4/objects/contacts/${contactId}/associations/emails?limit=100`;
export const emailUrl = (emailId: string): string =>
  `${HUBSPOT_BASE}/crm/v3/objects/emails/${emailId}?properties=${EMAIL_PROPERTIES.join(',')}`;

export interface ProbeArgs {
  confirm: boolean;
  phase: Phase | null;
  sequenceId: string | null;
  contactId: string | null;
  contactEmail: string | null;
  unknown: string | null;
}

export function parseArgs(argv: string[]): ProbeArgs {
  const args: ProbeArgs = { confirm: false, phase: null, sequenceId: null, contactId: null, contactEmail: null, unknown: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--confirm') args.confirm = true;
    else if (a === '--phase') {
      const v = argv[++i] ?? '';
      args.phase = (PHASES as readonly string[]).includes(v) ? (v as Phase) : null;
      if (!args.phase) args.unknown = `--phase ${v || '<missing>'}`;
    } else if (a === '--sequence-id') args.sequenceId = argv[++i] ?? null;
    else if (a === '--contact-id') args.contactId = argv[++i] ?? null;
    else if (a === '--contact-email') args.contactEmail = argv[++i] ?? null;
    else if (!args.unknown) args.unknown = a;
  }
  return args;
}

export function isInternal(email: string | null): boolean {
  if (!email) return false;
  const at = email.lastIndexOf('@');
  if (at < 0) return false;
  return (INTERNAL_DOMAINS as readonly string[]).includes(email.slice(at + 1).toLowerCase());
}

export type OwnerGoVerdict =
  | { ok: true; date: string }
  | { ok: false; reason: 'owner_go_not_recorded' | 'owner_go_env_missing' | 'owner_go_mismatch'; recorded: string[] };

/** Section 15 of the spec: from its heading to the next `## ` heading. */
function section15(specText: string): string {
  const start = specText.search(/^## 15\./m);
  if (start < 0) return '';
  const rest = specText.slice(start);
  const next = rest.slice(4).search(/^## /m);
  return next < 0 ? rest : rest.slice(0, next + 4);
}

/** The dates recorded on `OWNER GO native unenroll` lines in section 15. */
export function recordedOwnerGoDates(specText: string): string[] {
  return section15(specText)
    .split(/\r?\n/)
    .filter((line) => line.includes(OWNER_GO_MARKER))
    .map((line) => line.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? '')
    .filter(Boolean);
}

export function checkOwnerGo(envValue: string | undefined, specText: string): OwnerGoVerdict {
  const recorded = recordedOwnerGoDates(specText);
  if (recorded.length === 0) return { ok: false, reason: 'owner_go_not_recorded', recorded };
  if (!envValue) return { ok: false, reason: 'owner_go_env_missing', recorded };
  if (!recorded.includes(envValue.trim())) return { ok: false, reason: 'owner_go_mismatch', recorded };
  return { ok: true, date: envValue.trim() };
}

export interface ProbeOptions {
  argv: string[];
  /** Mutated: the token is deleted unless --confirm and the owner go both hold. process.env in production. */
  env: Record<string, string | undefined>;
  /** Test seam; defaults to reading docs/GAP_PROSPECTING_OS.md from the repo. */
  specText?: string;
  /** Test seam; only reached after every gate has passed. */
  fetchImpl?: typeof fetch;
}

export interface ProbeOutcome {
  code: 0 | 1 | 2;
  lines: string[];
}

function printPlan(args: ProbeArgs, out: string[]): void {
  const contactId = args.contactId ?? '<contact-id>';
  const sequenceId = args.sequenceId ?? '<sequence-id>';
  const contactEmail = args.contactEmail ?? '<internal email on freightroll.com or yardflow.ai>';
  out.push('probe-native-unenroll: DRY RUN. No network call is made in this mode.');
  out.push('');
  out.push('Every request below is a read (HTTP GET). This probe never sends, never enrolls and never unenrolls.');
  out.push('');
  out.push(`Precondition (human, in the HubSpot UI): enroll the internal contact ${contactEmail} (id ${contactId}) into sequence ${sequenceId}.`);
  out.push('');
  out.push('Phase BEFORE (run before the reply):');
  out.push(`  1. GET ${enrollmentsUrl(contactId)}`);
  out.push('     Authorization: Bearer $HUBSPOT_ACCESS_TOKEN. Print the readback for the named sequence: enrollment id, status, enrolledAt.');
  out.push(`  2. GET ${sequenceUrl(sequenceId)}`);
  out.push('     Print the sequence settings raw, and every settings key whose name mentions reply or unenroll.');
  out.push(`  3. GET ${emailAssociationsUrl(contactId)}`);
  out.push(`     then, for each of the newest ${MAX_ENGAGEMENTS} associated email ids, GET ${emailUrl('<email-id>')}`);
  out.push('     Print the INCOMING_EMAIL engagements from the contact (the baseline: expected none newer than the enrollment).');
  out.push('  Criterion BEFORE: the enrollment for the sequence is present and reads active. Otherwise the probe is not set up yet.');
  out.push('');
  out.push(`(human) Reply to the sequence email from the internal mailbox ${contactEmail}.`);
  out.push('');
  out.push('Phase AFTER (run after the reply has landed in HubSpot, usually within a few minutes):');
  out.push('  the same three reads, in the same order.');
  out.push('  Criterion AFTER (both required):');
  out.push(`    a. an INCOMING_EMAIL engagement whose hs_email_from_email is ${contactEmail} and whose hs_timestamp is after the enrollment's enrolledAt exists`);
  out.push('    b. the enrollment for the sequence no longer reads active (status not active, or the enrollment is absent)');
  out.push('  a and b   => VERDICT PASS: native unenroll-on-reply confirmed for this sequence; record it under S4-T6.');
  out.push('  not a     => VERDICT INCONCLUSIVE (no reply seen yet): re-run the AFTER phase later.');
  out.push('  a, not b  => VERDICT FAIL: the reply did not unenroll; the reply path must stop the enrollment itself.');
  out.push('');
  out.push('Gates for the reads (all required, checked in this order before any network call):');
  out.push('  --confirm on the command line');
  out.push(`  a line containing "${OWNER_GO_MARKER} <YYYY-MM-DD>" in section 15 of docs/GAP_PROSPECTING_OS.md (else REFUSED: owner_go_not_recorded)`);
  out.push(`  env ${OWNER_GO_ENV} equal to that date (else owner_go_env_missing or owner_go_mismatch)`);
  out.push('  --phase before|after, a numeric --sequence-id, a numeric --contact-id, --contact-email on an internal domain');
  out.push('  HUBSPOT_ACCESS_TOKEN present (it is deleted from the environment unless --confirm and the owner go both hold)');
  out.push('Any gate failing prints REFUSED: <reason> and exits 2.');
}

function refuse(out: string[], reason: string): ProbeOutcome {
  out.push(`REFUSED: ${reason}`);
  return { code: 2, lines: out };
}

// ---------------------------------------------------------------------------
// Network. Nothing above this line references fetch; nothing below runs until
// every gate in runProbe() has passed. Every request is a GET.
// ---------------------------------------------------------------------------

async function get(fetchImpl: typeof fetch, token: string, url: string): Promise<{ status: number; json: unknown }> {
  const res = await fetchImpl(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const text = await res.text();
  let json: unknown = text;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // keep raw text
  }
  return { status: res.status, json };
}

interface EnrollmentView {
  id: string;
  status: string;
  enrolledAt: Date | null;
  raw: unknown;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

function parseTimestamp(raw: unknown): Date | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  const d = /^\d{10,}$/.test(s) ? new Date(Number(s)) : new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** The enrollment readback rows that belong to `sequenceId`, tolerant of the field names HubSpot uses. */
export function enrollmentsForSequence(json: unknown, sequenceId: string): EnrollmentView[] {
  const root = asRecord(json);
  const rows = Array.isArray(root.results) ? root.results : Array.isArray(json) ? json : [];
  const out: EnrollmentView[] = [];
  for (const row of rows) {
    const r = asRecord(row);
    const seq = r.sequenceId ?? asRecord(r.sequence).id;
    if (String(seq) !== String(sequenceId)) continue;
    out.push({
      id: String(r.id ?? r.enrollmentId ?? ''),
      status: String(r.status ?? r.enrollmentStatus ?? r.state ?? ''),
      enrolledAt: parseTimestamp(r.enrolledAt ?? r.createdAt ?? r.enrollmentDate),
      raw: row,
    });
  }
  return out;
}

export function isActiveStatus(status: string): boolean {
  return /^(active|enrolled|in_progress|executing|running)$/i.test(status.trim());
}

/** Settings keys that mention reply or unenroll, so the configured behavior sits next to the observed one. */
export function replySettings(sequenceJson: unknown): Record<string, unknown> {
  const root = asRecord(sequenceJson);
  const settings = asRecord(root.settings);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries({ ...root, ...settings })) {
    if (/reply|unenroll/i.test(k) && typeof v !== 'object') out[k] = v;
  }
  return out;
}

interface IncomingEmailView {
  id: string;
  from: string;
  timestamp: Date | null;
  subject: string;
}

export function incomingEmailFrom(emailJson: unknown, contactEmail: string): IncomingEmailView | null {
  const root = asRecord(emailJson);
  const p = asRecord(root.properties);
  if (String(p.hs_email_direction ?? '') !== 'INCOMING_EMAIL') return null;
  const from = String(p.hs_email_from_email ?? '').trim().toLowerCase();
  if (from !== contactEmail.trim().toLowerCase()) return null;
  return {
    id: String(root.id ?? ''),
    from,
    timestamp: parseTimestamp(p.hs_timestamp),
    subject: String(p.hs_email_subject ?? ''),
  };
}

export type Verdict = 'PASS' | 'INCONCLUSIVE' | 'FAIL' | 'NOT_ENROLLED' | 'READY';

/** The pure criterion. `before`: READY when active. `after`: PASS, INCONCLUSIVE (no reply seen) or FAIL (reply seen, still active). */
export function evaluate(
  phase: Phase,
  enrollments: EnrollmentView[],
  replies: IncomingEmailView[],
): { verdict: Verdict; detail: string } {
  const active = enrollments.filter((e) => isActiveStatus(e.status));
  if (phase === 'before') {
    return active.length > 0
      ? { verdict: 'READY', detail: `enrollment ${active[0].id} reads ${active[0].status}` }
      : { verdict: 'NOT_ENROLLED', detail: 'no active enrollment for the sequence; enroll the internal contact by hand first' };
  }
  const enrolledAt = enrollments.map((e) => e.enrolledAt).filter((d): d is Date => d !== null).sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
  const replyAfter = replies.find((r) => r.timestamp !== null && (enrolledAt === null || r.timestamp.getTime() > enrolledAt.getTime()));
  if (!replyAfter) return { verdict: 'INCONCLUSIVE', detail: 'no INCOMING_EMAIL from the contact after the enrollment; re-run later' };
  if (active.length > 0) {
    return { verdict: 'FAIL', detail: `reply ${replyAfter.id} at ${replyAfter.timestamp?.toISOString()} seen but enrollment ${active[0].id} still reads ${active[0].status}` };
  }
  const ended = enrollments[0];
  return {
    verdict: 'PASS',
    detail: `reply ${replyAfter.id} at ${replyAfter.timestamp?.toISOString()} seen and the enrollment ${ended ? `reads ${ended.status}` : 'is absent'}`,
  };
}

async function runReads(args: ProbeArgs, token: string, fetchImpl: typeof fetch, out: string[]): Promise<ProbeOutcome> {
  const phase = args.phase as Phase;
  const contactId = args.contactId as string;
  const sequenceId = args.sequenceId as string;
  const contactEmail = args.contactEmail as string;

  out.push(`step 1: GET ${enrollmentsUrl(contactId)}`);
  const enrollRes = await get(fetchImpl, token, enrollmentsUrl(contactId));
  out.push(`step 1: HTTP ${enrollRes.status}`);
  if (enrollRes.status !== 200) {
    out.push(JSON.stringify(enrollRes.json).slice(0, 800));
    return { code: 1, lines: out };
  }
  const enrollments = enrollmentsForSequence(enrollRes.json, sequenceId);
  out.push(`step 1: ${enrollments.length} enrollment(s) for sequence ${sequenceId}: ${JSON.stringify(enrollments.map((e) => ({ id: e.id, status: e.status, enrolledAt: e.enrolledAt?.toISOString() ?? null })))}`);

  out.push(`step 2: GET ${sequenceUrl(sequenceId)}`);
  const seqRes = await get(fetchImpl, token, sequenceUrl(sequenceId));
  out.push(`step 2: HTTP ${seqRes.status}`);
  if (seqRes.status === 200) {
    out.push(`step 2: settings ${JSON.stringify(asRecord(seqRes.json).settings ?? null)}`);
    out.push(`step 2: reply/unenroll keys ${JSON.stringify(replySettings(seqRes.json))}`);
  } else {
    out.push(JSON.stringify(seqRes.json).slice(0, 800));
  }

  out.push(`step 3: GET ${emailAssociationsUrl(contactId)}`);
  const assocRes = await get(fetchImpl, token, emailAssociationsUrl(contactId));
  out.push(`step 3: HTTP ${assocRes.status}`);
  if (assocRes.status !== 200) {
    out.push(JSON.stringify(assocRes.json).slice(0, 800));
    return { code: 1, lines: out };
  }
  const assocRows = asRecord(assocRes.json).results;
  const emailIds = (Array.isArray(assocRows) ? assocRows : [])
    .map((r) => String(asRecord(r).toObjectId ?? asRecord(r).id ?? ''))
    .filter(Boolean)
    .slice(-MAX_ENGAGEMENTS);
  const replies: IncomingEmailView[] = [];
  for (const id of emailIds) {
    const emailRes = await get(fetchImpl, token, emailUrl(id));
    if (emailRes.status !== 200) continue;
    const view = incomingEmailFrom(emailRes.json, contactEmail);
    if (view) replies.push(view);
  }
  replies.sort((a, b) => (a.timestamp?.getTime() ?? 0) - (b.timestamp?.getTime() ?? 0));
  out.push(`step 3: ${emailIds.length} associated email(s) read, ${replies.length} INCOMING_EMAIL from ${contactEmail}: ${JSON.stringify(replies.map((r) => ({ id: r.id, at: r.timestamp?.toISOString() ?? null, subject: r.subject })))}`);

  const { verdict, detail } = evaluate(phase, enrollments, replies);
  out.push('');
  out.push(`VERDICT (${phase}): ${verdict}. ${detail}`);
  out.push(`Record this under S4-T6 in docs/GAP_PROSPECTING_OS.md with the contact record https://app.hubspot.com/contacts/${PORTAL_ID}/record/0-1/${contactId}.`);
  const ok = phase === 'before' ? verdict === 'READY' : verdict === 'PASS';
  return { code: ok ? 0 : 1, lines: out };
}

export async function runProbe(options: ProbeOptions): Promise<ProbeOutcome> {
  const out: string[] = [];
  const args = parseArgs(options.argv);
  const specText = options.specText ?? readFileSync(SPEC_PATH, 'utf8');
  const ownerGo = checkOwnerGo(options.env[OWNER_GO_ENV], specText);

  // Hold a credential only when both halves of the authorization are present.
  if (!(args.confirm && ownerGo.ok)) delete options.env.HUBSPOT_ACCESS_TOKEN;

  if (!args.confirm) {
    printPlan(args, out);
    return { code: 0, lines: out };
  }

  // Gates, in order. Every one prints REFUSED and exits 2 before any network call.
  if (!ownerGo.ok) {
    const hint =
      ownerGo.reason === 'owner_go_not_recorded'
        ? `no line containing "${OWNER_GO_MARKER}" in section 15 of docs/GAP_PROSPECTING_OS.md`
        : ownerGo.reason === 'owner_go_env_missing'
          ? `env ${OWNER_GO_ENV} is not set; recorded date(s): ${ownerGo.recorded.join(', ')}`
          : `env ${OWNER_GO_ENV} does not match the recorded date(s): ${ownerGo.recorded.join(', ')}`;
    return refuse(out, `${ownerGo.reason} (${hint})`);
  }
  if (args.unknown) return refuse(out, `unknown or malformed argument ${args.unknown}`);
  if (!args.phase) return refuse(out, '--phase before|after is required');
  if (!args.sequenceId || !/^\d+$/.test(args.sequenceId)) return refuse(out, '--sequence-id <numeric HubSpot sequence id> is required');
  if (!args.contactId || !/^\d+$/.test(args.contactId)) return refuse(out, '--contact-id <numeric HubSpot contact id> is required');
  if (!args.contactEmail) return refuse(out, '--contact-email <email> is required');
  if (!isInternal(args.contactEmail)) {
    return refuse(out, `contact email ${args.contactEmail} is not on an internal domain (${INTERNAL_DOMAINS.join(', ')})`);
  }
  const token = options.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) return refuse(out, 'HUBSPOT_ACCESS_TOKEN is not set');

  out.push(`probe-native-unenroll: LIVE READS, phase ${args.phase}, owner go ${ownerGo.date}. Contact ${args.contactId} (${args.contactEmail}), sequence ${args.sequenceId}.`);
  return runReads(args, token, options.fetchImpl ?? fetch, out);
}

const invokedDirectly = /probe-native-unenroll\.ts$/.test((process.argv[1] ?? '').replace(/\\/g, '/'));
if (invokedDirectly) {
  runProbe({ argv: process.argv.slice(2), env: process.env }).then(
    (outcome) => {
      for (const line of outcome.lines) console.log(line);
      process.exit(outcome.code);
    },
    (err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    },
  );
}
