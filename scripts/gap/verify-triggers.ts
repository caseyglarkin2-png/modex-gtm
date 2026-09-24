/**
 * GAP Prospecting OS: verify the hand SQL guards are live on the database
 * DATABASE_URL points at. Run after every `prisma db push` followed by
 * `prisma db execute --file prisma/sql/2026-09-23-gap-os.sql`.
 *
 *   DATABASE_URL=postgresql://... npx tsx scripts/gap/verify-triggers.ts
 *
 * Everything runs inside ONE transaction that is always rolled back, so it is
 * safe against any database, including production: no row survives. Each guard
 * performs the forbidden write inside a savepoint and expects the guard's
 * specific message token (never a generic "it threw"), then performs the
 * allowed write and expects success. The process exits non-zero naming the
 * first failing guard and prints a guard -> PASS/FAIL table.
 *
 * Spec: docs/GAP_PROSPECTING_OS.md sections 4.6 and 5.3.
 */
import { PrismaClient } from '@prisma/client';

type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

const ROLLBACK_SENTINEL = 'GAP_VERIFY_ROLLBACK';

class GuardFailure extends Error {
  constructor(public readonly guard: string, message: string) {
    super(message);
  }
}

function errorText(err: unknown): string {
  if (!err || typeof err !== 'object') return String(err);
  const e = err as { message?: unknown; meta?: unknown; cause?: unknown };
  const parts = [e.message, e.meta ? JSON.stringify(e.meta) : '', e.cause ? String(e.cause) : ''];
  return parts.filter(Boolean).join(' ');
}

let savepointSeq = 0;

/** The forbidden write: must raise with `token` somewhere in the error text. */
async function expectRefused(tx: Tx, guard: string, token: string, sql: string, label: string) {
  const sp = `gap_sp_${++savepointSeq}`;
  await tx.$executeRawUnsafe(`SAVEPOINT ${sp}`);
  let accepted = false;
  let text = '';
  try {
    await tx.$executeRawUnsafe(sql);
    accepted = true;
  } catch (err) {
    text = errorText(err);
  } finally {
    await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${sp}`);
  }
  if (accepted) {
    throw new GuardFailure(guard, `${label}: forbidden write was ACCEPTED (expected ${token})`);
  }
  if (!text.includes(token)) {
    throw new GuardFailure(guard, `${label}: refused, but without token ${token}. Got: ${text.slice(0, 300)}`);
  }
}

/** The allowed write: must succeed. */
async function expectOk(tx: Tx, guard: string, sql: string, label: string) {
  try {
    await tx.$executeRawUnsafe(sql);
  } catch (err) {
    throw new GuardFailure(guard, `${label}: allowed write was REFUSED: ${errorText(err).slice(0, 300)}`);
  }
}

async function scalar<T>(tx: Tx, sql: string): Promise<T> {
  const rows = (await tx.$queryRawUnsafe(sql)) as Array<Record<string, T>>;
  const first = rows[0];
  if (!first) throw new Error(`no row for: ${sql}`);
  return Object.values(first)[0] as T;
}

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

// ---------------------------------------------------------------------------
// Fixture builders. Every id and unique value carries the run tag so the
// script never collides with real rows even though it always rolls back.
// ---------------------------------------------------------------------------

const TAG = `gapv_${Date.now().toString(36)}`;
let seq = 0;
const nid = (prefix: string) => `${TAG}_${prefix}_${++seq}`;

async function seedAccount(tx: Tx): Promise<string> {
  const name = `GAP Verify ${TAG}`;
  await tx.$executeRawUnsafe(
    `INSERT INTO accounts (rank, name, vertical, updated_at) VALUES (9999, ${q(name)}, 'verify', now())`,
  );
  return name;
}

async function insertSignal(tx: Tx, account: string, overrides: Record<string, string> = {}): Promise<string> {
  const id = nid('sig');
  const cols: Record<string, string> = {
    id: q(id),
    account_name: q(account),
    source_kind: q('manual'),
    source_id: q(id),
    type: q('news'),
    title: q('A fact'),
    source_type: q('manual'),
    observed_at: 'now()',
    confidence: '50',
    registered_by: q('verify'),
    updated_at: 'now()',
    ...overrides,
  };
  await tx.$executeRawUnsafe(
    `INSERT INTO prospecting_signals (${Object.keys(cols).join(',')}) VALUES (${Object.values(cols).join(',')})`,
  );
  return id;
}

function hypothesisInsertSql(id: string, account: string, overrides: Record<string, string> = {}): string {
  const cols: Record<string, string> = {
    id: q(id),
    account_name: q(account),
    problem_family: q('hidden_capacity'),
    observation: q('Fact. [S:x]'),
    problem_hypothesis: q('Maybe.'),
    root_cause_hypotheses: `'["a"]'::jsonb`,
    impact_hypotheses: `'["b"]'::jsonb`,
    falsification_questions: `'["c?"]'::jsonb`,
    persona: q('site_ops'),
    confidence: '40',
    status: q('draft'),
    created_by: q('verify'),
    updated_at: 'now()',
    ...overrides,
  };
  return `INSERT INTO prospecting_hypotheses (${Object.keys(cols).join(',')}) VALUES (${Object.values(cols).join(',')})`;
}

async function insertHypothesis(tx: Tx, account: string, overrides: Record<string, string> = {}): Promise<string> {
  const id = nid('hyp');
  await tx.$executeRawUnsafe(hypothesisInsertSql(id, account, overrides));
  return id;
}

async function insertFamily(tx: Tx, overrides: Record<string, string> = {}): Promise<string> {
  const id = nid('fam');
  const cols: Record<string, string> = {
    id: q(id),
    engine: q('modex_draft_queue'),
    updated_at: 'now()',
    ...overrides,
  };
  await tx.$executeRawUnsafe(
    `INSERT INTO sequence_families (${Object.keys(cols).join(',')}) VALUES (${Object.values(cols).join(',')})`,
  );
  return id;
}

let versionSeq = 0;
async function insertVersion(tx: Tx, familyId: string, overrides: Record<string, string> = {}): Promise<string> {
  const id = nid('ver');
  const cols: Record<string, string> = {
    id: q(id),
    family_id: q(familyId),
    version: String(++versionSeq),
    steps: `'[{"delay":{"value":0,"unit":"days"},"purpose":"intrigue"}]'::jsonb`,
    steps_hash: q(`hash_${id}`),
    status: q('draft'),
    updated_at: 'now()',
    ...overrides,
  };
  await tx.$executeRawUnsafe(
    `INSERT INTO sequence_versions (${Object.keys(cols).join(',')}) VALUES (${Object.values(cols).join(',')})`,
  );
  return id;
}

function enrollmentInsertSql(
  id: string,
  familyId: string,
  versionId: string,
  account: string,
  overrides: Record<string, string> = {},
): string {
  const cols: Record<string, string> = {
    id: q(id),
    engine: q('modex_draft_queue'),
    family_id: q(familyId),
    sequence_version_id: q(versionId),
    account_name: q(account),
    to_email: q(`${id}@example.com`),
    sender: q('casey@yardflow.ai'),
    owner: q('casey@freightroll.com'),
    status: q('active'),
    is_test: 'false',
    enrolled_by: q('verify'),
    updated_at: 'now()',
    ...overrides,
  };
  return `INSERT INTO sequence_enrollments (${Object.keys(cols).join(',')}) VALUES (${Object.values(cols).join(',')})`;
}

async function insertEnrollment(
  tx: Tx,
  familyId: string,
  versionId: string,
  account: string,
  overrides: Record<string, string> = {},
): Promise<string> {
  const id = nid('enr');
  await tx.$executeRawUnsafe(enrollmentInsertSql(id, familyId, versionId, account, overrides));
  return id;
}

function dispositionInsertSql(id: string, hypothesisId: string, account: string, overrides: Record<string, string> = {}): string {
  const cols: Record<string, string> = {
    id: q(id),
    hypothesis_id: q(hypothesisId),
    account_name: q(account),
    contact_email: q(`${id}@example.com`),
    source_kind: q('verify'),
    source_id: q(id),
    channel: q('email'),
    response_class: q('problem_confirmed'),
    human_confirmed: 'false',
    created_by: q('verify'),
    updated_at: 'now()',
    ...overrides,
  };
  return `INSERT INTO conversation_dispositions (${Object.keys(cols).join(',')}) VALUES (${Object.values(cols).join(',')})`;
}

async function insertDisposition(tx: Tx, hypothesisId: string, account: string, overrides: Record<string, string> = {}): Promise<string> {
  const id = nid('disp');
  await tx.$executeRawUnsafe(dispositionInsertSql(id, hypothesisId, account, overrides));
  return id;
}

function bidInsertSql(id: string, hypothesisId: string, account: string, overrides: Record<string, string> = {}): string {
  const cols: Record<string, string> = {
    id: q(id),
    hypothesis_id: q(hypothesisId),
    account_name: q(account),
    contact_email: q(`${id}@example.com`),
    type: q('business_problem'),
    raw_buyer_language: q('We lose trailers every Friday.'),
    source: q('call'),
    captured_at: 'now()',
    captured_by: q('verify'),
    human_confirmed: 'false',
    updated_at: 'now()',
    ...overrides,
  };
  return `INSERT INTO buyer_input_data (${Object.keys(cols).join(',')}) VALUES (${Object.values(cols).join(',')})`;
}

async function insertBid(tx: Tx, hypothesisId: string, account: string, overrides: Record<string, string> = {}): Promise<string> {
  const id = nid('bid');
  await tx.$executeRawUnsafe(bidInsertSql(id, hypothesisId, account, overrides));
  return id;
}

function copyEventInsertSql(id: string, overrides: Record<string, string> = {}): string {
  const cols: Record<string, string> = {
    id: q(id),
    hubspot_contact_id: q(`${TAG}_contact`),
    account_key: q('verify'),
    property: q('yf_top100_step1_body'),
    step_index: '1',
    field: q('body'),
    new_value: q('Hello'),
    ts: `now() + interval '${++seq} seconds'`,
    source: q('gap_push'),
    ...overrides,
  };
  return `INSERT INTO sequence_copy_events (${Object.keys(cols).join(',')}) VALUES (${Object.values(cols).join(',')})`;
}

/**
 * draft -> active with everything the R1-7 guard demands (a reviewer and, on
 * the row, at least one linked signal carrying evidence). Links are added
 * BEFORE this runs because N4 refuses a link into a hypothesis past review.
 */
function promoteToActiveSql(hypothesisId: string): string {
  return `UPDATE prospecting_hypotheses SET status = 'active', reviewed_by = 'verify', reviewed_at = now(), activated_at = now() WHERE id = ${q(hypothesisId)}`;
}

function hypothesisEventInsertSql(id: string, hypothesisId: string): string {
  return `INSERT INTO hypothesis_events (id, hypothesis_id, from_status, to_status, action, actor) VALUES (${q(id)}, ${q(hypothesisId)}, 'draft', 'review_required', 'submit', 'verify')`;
}

// ---------------------------------------------------------------------------
// The guards. Each one: forbidden write -> token, then allowed write -> ok.
// ---------------------------------------------------------------------------

type Guard = { name: string; run: (tx: Tx, account: string) => Promise<void> };

const guards: Guard[] = [
  {
    name: 'CHECK hypotheses.status',
    async run(tx, account) {
      const g = this.name;
      await expectRefused(tx, g, 'gap_ck_hypotheses_status', hypothesisInsertSql(nid('hyp'), account, { status: q('bogus') }), 'status=bogus');
      await expectOk(tx, g, hypothesisInsertSql(nid('hyp'), account, { status: q('review_required') }), 'status=review_required');
    },
  },
  {
    name: 'CHECK hypotheses.problem_family + persona + confidence',
    async run(tx, account) {
      const g = this.name;
      await expectRefused(tx, g, 'gap_ck_hypotheses_problem_family', hypothesisInsertSql(nid('hyp'), account, { problem_family: q('yard_stuff') }), 'family=yard_stuff');
      await expectRefused(tx, g, 'gap_ck_hypotheses_persona', hypothesisInsertSql(nid('hyp'), account, { persona: q('ceo') }), 'persona=ceo');
      await expectRefused(tx, g, 'gap_ck_hypotheses_confidence', hypothesisInsertSql(nid('hyp'), account, { confidence: '101' }), 'confidence=101');
      await expectOk(tx, g, hypothesisInsertSql(nid('hyp'), account, { problem_family: q('unmapped'), persona: q('technology'), confidence: '0' }), 'unmapped/technology/0');
    },
  },
  {
    name: 'CHECK signals.source_kind + type + source_type + confidence',
    async run(tx, account) {
      const g = this.name;
      const bad = async (token: string, o: Record<string, string>, label: string) => {
        const id = nid('sig');
        await expectRefused(
          tx, g, token,
          `INSERT INTO prospecting_signals (id, account_name, source_kind, source_id, type, title, source_type, observed_at, confidence, registered_by, updated_at) VALUES (${q(id)}, ${q(account)}, ${o.source_kind ?? "'manual'"}, ${q(id)}, ${o.type ?? "'news'"}, 't', ${o.source_type ?? "'manual'"}, now(), ${o.confidence ?? '50'}, 'v', now())`,
          label,
        );
      };
      await bad('gap_ck_signals_source_kind', { source_kind: "'rumor'" }, 'source_kind=rumor');
      await bad('gap_ck_signals_type', { type: "'vibe'" }, 'type=vibe');
      await bad('gap_ck_signals_source_type', { source_type: "'secret'" }, 'source_type=secret');
      await bad('gap_ck_signals_confidence', { confidence: '-1' }, 'confidence=-1');
      await insertSignal(tx, account, { source_kind: q('top100_evidence'), type: q('technology_signal'), source_type: q('public_primary'), confidence: '100' });
    },
  },
  {
    name: 'CHECK dispositions.response_class incl. call-only + channel',
    async run(tx, account) {
      const g = this.name;
      const hyp = await insertHypothesis(tx, account);
      await expectRefused(tx, g, 'gap_ck_dispositions_response_class', dispositionInsertSql(nid('disp'), hyp, account, { response_class: q('positive_interest') }), 'response_class=positive_interest (a lane key, not a class)');
      await expectRefused(tx, g, 'gap_ck_dispositions_channel', dispositionInsertSql(nid('disp'), hyp, account, { channel: q('fax') }), 'channel=fax');
      await expectOk(tx, g, dispositionInsertSql(nid('disp'), hyp, account, { response_class: q('no_answer'), channel: q('call') }), 'no_answer/call');
      await expectOk(tx, g, dispositionInsertSql(nid('disp'), hyp, account, { response_class: q('voicemail'), channel: q('call') }), 'voicemail/call');
      await expectOk(tx, g, dispositionInsertSql(nid('disp'), hyp, account, { response_class: q('gatekeeper'), channel: q('call') }), 'gatekeeper/call');
    },
  },
  {
    name: 'CHECK bid.type + source',
    async run(tx, account) {
      const g = this.name;
      const hyp = await insertHypothesis(tx, account);
      await expectRefused(tx, g, 'gap_ck_bid_type', bidInsertSql(nid('bid'), hyp, account, { type: q('feeling') }), 'type=feeling');
      await expectRefused(tx, g, 'gap_ck_bid_source', bidInsertSql(nid('bid'), hyp, account, { source: q('crm') }), 'source=crm');
      await expectOk(tx, g, bidInsertSql(nid('bid'), hyp, account, { type: q('metric'), source: q('meeting'), numeric_value: '48.5', unit: q('min') }), 'metric/meeting');
    },
  },
  {
    name: 'CHECK families.engine, versions.status, enrollments.engine/status/stop_reason, copy_events.source',
    async run(tx, account) {
      const g = this.name;
      await expectRefused(tx, g, 'gap_ck_families_engine', `INSERT INTO sequence_families (id, engine, updated_at) VALUES (${q(nid('fam'))}, 'outreach_io', now())`, 'engine=outreach_io');
      const fam = await insertFamily(tx, { engine: q('hubspot_native'), hubspot_sequence_id: q(`${TAG}_hs`) });
      await expectRefused(tx, g, 'gap_ck_versions_status', `INSERT INTO sequence_versions (id, family_id, version, steps, steps_hash, status, updated_at) VALUES (${q(nid('ver'))}, ${q(fam)}, 99, '[]'::jsonb, 'h', 'published', now())`, 'status=published');
      const ver = await insertVersion(tx, fam);
      await expectRefused(tx, g, 'gap_ck_enrollments_engine', enrollmentInsertSql(nid('enr'), fam, ver, account, { engine: q('apollo') }), 'engine=apollo');
      await expectRefused(tx, g, 'gap_ck_enrollments_status', enrollmentInsertSql(nid('enr'), fam, ver, account, { status: q('running') }), 'status=running');
      await expectRefused(tx, g, 'gap_ck_enrollments_stop_reason', enrollmentInsertSql(nid('enr'), fam, ver, account, { status: q('stopped'), stop_reason: q('felt_like_it') }), 'stop_reason=felt_like_it');
      await expectOk(tx, g, enrollmentInsertSql(nid('enr'), fam, ver, account, { status: q('stopped'), stop_reason: q('legacy_unknown'), is_test: 'true' }), 'stopped/legacy_unknown');
      await expectRefused(tx, g, 'gap_ck_copy_events_source', copyEventInsertSql(nid('cpy'), { source: q('manual') }), 'source=manual');
      await expectOk(tx, g, copyEventInsertSql(nid('cpy'), { source: q('journal_import') }), 'source=journal_import');
    },
  },
  {
    name: 'PARTIAL UNIQUE enrollments(to_email) while active/paused/stop_pending',
    async run(tx, account) {
      const g = this.name;
      const fam = await insertFamily(tx);
      const ver = await insertVersion(tx, fam);
      const email = q(`${TAG}_dup@example.com`);
      await insertEnrollment(tx, fam, ver, account, { to_email: email, status: q('paused') });
      await expectRefused(tx, g, 'Key (to_email)', enrollmentInsertSql(nid('enr'), fam, ver, account, { to_email: email, status: q('active') }), 'second live row for the same address');
      await expectRefused(tx, g, 'Key (to_email)', enrollmentInsertSql(nid('enr'), fam, ver, account, { to_email: email, status: q('stop_pending') }), 'stop_pending counts as live');
      await expectOk(tx, g, enrollmentInsertSql(nid('enr'), fam, ver, account, { to_email: email, status: q('stopped'), stop_reason: q('manual') }), 'a stopped row for the same address');
      await expectOk(tx, g, enrollmentInsertSql(nid('enr'), fam, ver, account, { to_email: email, status: q('completed') }), 'a completed row for the same address');
    },
  },
  {
    name: 'PARTIAL UNIQUE hypotheses(source_ref) where not null',
    async run(tx, account) {
      const g = this.name;
      const ref = q(`pic:${TAG}#1`);
      await insertHypothesis(tx, account, { source_ref: ref });
      await expectRefused(tx, g, 'Key (source_ref)', hypothesisInsertSql(nid('hyp'), account, { source_ref: ref }), 'same source_ref twice');
      await expectOk(tx, g, hypothesisInsertSql(nid('hyp'), account, { source_ref: 'NULL' }), 'null source_ref');
      await expectOk(tx, g, hypothesisInsertSql(nid('hyp'), account, { source_ref: 'NULL' }), 'null source_ref again');
    },
  },
  {
    name: 'FREEZE first non-test, non-legacy enrollment freezes its version; test and legacy enrollments do not (R2-5)',
    async run(tx, account) {
      const g = this.name;
      const fam = await insertFamily(tx);
      const verTest = await insertVersion(tx, fam);
      await insertEnrollment(tx, fam, verTest, account, { is_test: 'true' });
      const afterTest = await scalar<string>(tx, `SELECT status FROM sequence_versions WHERE id = ${q(verTest)}`);
      if (afterTest !== 'draft') throw new GuardFailure(g, `a test enrollment froze the version (status=${afterTest})`);

      // R2-5: a legacy readback row (HubSpot said this contact is enrolled in a
      // lane-built sequence) is a ledger entry, not a modex send. It must not
      // freeze the placeholder scaffold as v1.
      const verLegacy = await insertVersion(tx, fam);
      await insertEnrollment(tx, fam, verLegacy, account, { is_test: 'false', legacy: 'true' });
      const afterLegacy = await scalar<string>(tx, `SELECT status FROM sequence_versions WHERE id = ${q(verLegacy)}`);
      if (afterLegacy !== 'draft') throw new GuardFailure(g, `a legacy=true non-test enrollment froze the version (status=${afterLegacy}); the freeze trigger WHEN clause must exclude legacy rows`);

      const ver = await insertVersion(tx, fam);
      const enr = await insertEnrollment(tx, fam, ver, account);
      const row = (await tx.$queryRawUnsafe(
        `SELECT status, frozen_by_enrollment_id, frozen_at FROM sequence_versions WHERE id = ${q(ver)}`,
      )) as Array<{ status: string; frozen_by_enrollment_id: string | null; frozen_at: Date | null }>;
      const v = row[0];
      if (!v || v.status !== 'frozen') throw new GuardFailure(g, `non-test enrollment did not freeze the version (status=${v?.status})`);
      if (v.frozen_by_enrollment_id !== enr) throw new GuardFailure(g, `frozen_by_enrollment_id=${v.frozen_by_enrollment_id}, expected ${enr}`);
      if (!v.frozen_at) throw new GuardFailure(g, 'frozen_at not set');

      const enr2 = await insertEnrollment(tx, fam, ver, account);
      const still = await scalar<string>(tx, `SELECT frozen_by_enrollment_id FROM sequence_versions WHERE id = ${q(ver)}`);
      if (still !== enr) throw new GuardFailure(g, `second enrollment ${enr2} overwrote frozen_by_enrollment_id (now ${still})`);
    },
  },
  {
    name: 'GAP_VERSION_FROZEN update',
    async run(tx, account) {
      const g = this.name;
      const T = 'GAP_VERSION_FROZEN';
      const fam = await insertFamily(tx);
      const draft = await insertVersion(tx, fam);
      const frozen = await insertVersion(tx, fam);
      await insertEnrollment(tx, fam, frozen, account);

      await expectRefused(tx, g, T, `UPDATE sequence_versions SET steps = '[]'::jsonb WHERE id = ${q(frozen)}`, 'frozen: steps');
      await expectRefused(tx, g, T, `UPDATE sequence_versions SET steps_hash = 'x' WHERE id = ${q(frozen)}`, 'frozen: steps_hash');
      await expectRefused(tx, g, T, `UPDATE sequence_versions SET version = 77 WHERE id = ${q(frozen)}`, 'frozen: version');
      await expectRefused(tx, g, T, `UPDATE sequence_versions SET hubspot_template_ids = '["t1"]'::jsonb WHERE id = ${q(frozen)}`, 'frozen: hubspot_template_ids');
      await expectRefused(tx, g, T, `UPDATE sequence_versions SET provenance = '{"x":1}'::jsonb WHERE id = ${q(frozen)}`, 'frozen: provenance');
      await expectRefused(tx, g, T, `UPDATE sequence_versions SET status = 'draft' WHERE id = ${q(frozen)}`, 'frozen -> draft');
      await expectRefused(tx, g, T, `UPDATE sequence_versions SET status = 'retired' WHERE id = ${q(draft)}`, 'draft -> retired');

      await expectOk(tx, g, `UPDATE sequence_versions SET steps = '[]'::jsonb, steps_hash = 'y', change_note = 'edited' WHERE id = ${q(draft)}`, 'draft: steps + hash');
      await expectOk(tx, g, `UPDATE sequence_versions SET change_note = 'note only' WHERE id = ${q(frozen)}`, 'frozen: change_note');
      await expectOk(tx, g, `UPDATE sequence_versions SET status = 'retired', retired_at = now() WHERE id = ${q(frozen)}`, 'frozen -> retired');
      await expectRefused(tx, g, T, `UPDATE sequence_versions SET status = 'frozen' WHERE id = ${q(frozen)}`, 'retired -> frozen');
    },
  },
  {
    name: 'GAP_VERSION_FROZEN draft -> frozen only by a citing live enrollment (R3-7b)',
    async run(tx, account) {
      const g = this.name;
      const T = 'GAP_VERSION_FROZEN';
      const fam = await insertFamily(tx);
      const draft = await insertVersion(tx, fam);
      const W = `WHERE id = ${q(draft)}`;
      await expectRefused(tx, g, T, `UPDATE sequence_versions SET status = 'frozen', frozen_at = now() ${W}`, 'draft -> frozen by a plain UPDATE (no frozen_by_enrollment_id)');
      await expectRefused(tx, g, T, `UPDATE sequence_versions SET status = 'frozen', frozen_at = now(), frozen_by_enrollment_id = ${q(`${TAG}_nonexistent`)} ${W}`, 'draft -> frozen citing an enrollment that does not exist');
      const testEnr = await insertEnrollment(tx, fam, draft, account, { is_test: 'true' });
      await expectRefused(tx, g, T, `UPDATE sequence_versions SET status = 'frozen', frozen_at = now(), frozen_by_enrollment_id = ${q(testEnr)} ${W}`, 'draft -> frozen citing a test enrollment');
      const legacyEnr = await insertEnrollment(tx, fam, draft, account, { legacy: 'true' });
      await expectRefused(tx, g, T, `UPDATE sequence_versions SET status = 'frozen', frozen_at = now(), frozen_by_enrollment_id = ${q(legacyEnr)} ${W}`, 'draft -> frozen citing a legacy enrollment');
      const otherDraft = await insertVersion(tx, fam);
      const otherEnr = await insertEnrollment(tx, fam, otherDraft, account);
      await expectRefused(tx, g, T, `UPDATE sequence_versions SET status = 'frozen', frozen_at = now(), frozen_by_enrollment_id = ${q(otherEnr)} ${W}`, 'draft -> frozen citing a live enrollment pinned to another version');
      const still = await scalar<string>(tx, `SELECT status FROM sequence_versions ${W}`);
      if (still !== 'draft') throw new GuardFailure(g, `the draft moved to ${still} without a citing live enrollment`);
      await expectOk(tx, g, `UPDATE sequence_versions SET steps = '[]'::jsonb, steps_hash = 'still-draft' ${W}`, 'draft: still editable');

      // The allowed path is the freeze trigger's own statement (AFTER INSERT on
      // a live enrollment), which cites the row it just saw; the BEFORE UPDATE
      // guard admits exactly that.
      const enr = await insertEnrollment(tx, fam, draft, account);
      const row = (await tx.$queryRawUnsafe(`SELECT status, frozen_by_enrollment_id, frozen_at FROM sequence_versions ${W}`)) as Array<{ status: string; frozen_by_enrollment_id: string | null; frozen_at: Date | null }>;
      const v = row[0];
      if (!v || v.status !== 'frozen' || v.frozen_by_enrollment_id !== enr || !v.frozen_at) {
        throw new GuardFailure(g, `the freeze trigger's own statement was refused or incomplete: ${JSON.stringify(v)}, expected frozen by ${enr}`);
      }
    },
  },
  {
    name: 'GAP_VERSION_FROZEN insert: frozen only with import provenance (R3-7b)',
    async run(tx) {
      const g = this.name;
      const T = 'GAP_VERSION_FROZEN';
      const fam = await insertFamily(tx);
      const frozenInsert = (overrides: Record<string, string>) => {
        const id = nid('ver');
        const cols: Record<string, string> = {
          id: q(id),
          family_id: q(fam),
          version: String(++versionSeq),
          steps: `'[]'::jsonb`,
          steps_hash: q(`hash_${id}`),
          status: q('frozen'),
          frozen_at: 'now()',
          updated_at: 'now()',
          ...overrides,
        };
        return `INSERT INTO sequence_versions (${Object.keys(cols).join(',')}) VALUES (${Object.values(cols).join(',')})`;
      };
      await expectRefused(tx, g, T, frozenInsert({}), 'insert frozen with no provenance');
      await expectRefused(tx, g, T, frozenInsert({ provenance: `'{"kind":"gap_edit"}'::jsonb` }), 'insert frozen with provenance kind gap_edit (a live family)');
      await expectRefused(tx, g, T, frozenInsert({ provenance: `'{"source":"manifest"}'::jsonb` }), 'insert frozen with provenance lacking kind (the Sprint 2 placeholder shape)');
      await expectRefused(tx, g, T, frozenInsert({ provenance: `'{"kind":"journal"}'::jsonb`, frozen_at: 'NULL' }), 'insert frozen journal without frozen_at');
      await expectOk(tx, g, frozenInsert({ provenance: `'{"kind":"journal","journal_ts":"2026-09-14T15:00:00.000Z"}'::jsonb` }), 'insert frozen with provenance kind journal');
      await expectOk(tx, g, frozenInsert({ provenance: `'{"kind":"manifest"}'::jsonb` }), 'insert frozen with provenance kind manifest');
      await expectOk(tx, g, frozenInsert({ provenance: `'{"kind":"modex_legacy","sequence_id":1}'::jsonb` }), 'insert frozen with provenance kind modex_legacy');
      await expectOk(tx, g, frozenInsert({ status: q('draft'), frozen_at: 'NULL' }), 'insert draft with no provenance (the live path)');
      await expectOk(tx, g, frozenInsert({ status: q('draft'), frozen_at: 'NULL', provenance: `'{"kind":"gap_edit"}'::jsonb` }), 'insert draft with any provenance');
    },
  },
  {
    name: 'GAP_VERSION_FROZEN delete',
    async run(tx, account) {
      const g = this.name;
      const fam = await insertFamily(tx);
      const draft = await insertVersion(tx, fam);
      const frozen = await insertVersion(tx, fam);
      await insertEnrollment(tx, fam, frozen, account, { is_test: 'false' });
      // The FK from the enrollment would also block the delete; test the
      // trigger on a frozen version with no enrollment rows left.
      await expectOk(tx, g, `UPDATE sequence_enrollments SET status = 'stopped', stop_reason = 'manual' WHERE sequence_version_id = ${q(frozen)}`, 'stop the enrollment');
      await expectRefused(tx, g, 'GAP_VERSION_FROZEN', `DELETE FROM sequence_versions WHERE id = ${q(frozen)}`, 'delete frozen');
      await expectOk(tx, g, `DELETE FROM sequence_versions WHERE id = ${q(draft)}`, 'delete draft');
    },
  },
  {
    name: 'GAP_ENROLLMENT_PIN',
    async run(tx, account) {
      const g = this.name;
      const T = 'GAP_ENROLLMENT_PIN';
      const fam = await insertFamily(tx);
      const fam2 = await insertFamily(tx);
      const ver = await insertVersion(tx, fam);
      const ver2 = await insertVersion(tx, fam);
      const hyp = await insertHypothesis(tx, account);
      const enr = await insertEnrollment(tx, fam, ver, account);
      const W = `WHERE id = ${q(enr)}`;
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET sequence_version_id = ${q(ver2)} ${W}`, 'sequence_version_id');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET family_id = ${q(fam2)} ${W}`, 'family_id');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET engine = 'manual' ${W}`, 'engine');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET to_email = 'other@example.com' ${W}`, 'to_email');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET hubspot_contact_id = '123' ${W}`, 'hubspot_contact_id');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET hubspot_sequence_id = '456' ${W}`, 'hubspot_sequence_id');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET hypothesis_id = ${q(hyp)} ${W}`, 'hypothesis_id');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET rendered_steps = '[]'::jsonb ${W}`, 'rendered_steps');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET rendered_steps_hash = 'h' ${W}`, 'rendered_steps_hash');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET enrolled_at = now() - interval '1 day' ${W}`, 'enrolled_at');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET legacy = true ${W}`, 'legacy');
      // R3-N6: identity of the send never moves either.
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET is_test = true ${W}`, 'is_test (R3-N6)');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET persona_id = 1 ${W}`, 'persona_id (R3-N6)');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET account_name = ${q(`GAP Verify Other ${TAG}`)} ${W}`, 'account_name (R3-N6)');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET owner = 'someone@example.com' ${W}`, 'owner (R3-N6)');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET sender = 'someone@example.com' ${W}`, 'sender (R3-N6)');
      await expectOk(tx, g, `UPDATE sequence_enrollments SET status = 'paused', current_step_index = 1, external_state = '{"enrolled":true}'::jsonb, external_synced_at = now() ${W}`, 'status/step/readback');
      await expectOk(tx, g, `UPDATE sequence_enrollments SET status = 'stopped', stop_reason = 'replied', stopped_at = now(), stopped_by = 'verify' ${W}`, 'stop with reason');
    },
  },
  {
    name: 'GAP_ENROLLMENT_PIN legacy attribution backfill: hubspot_native only, own family, rendered_steps in the same statement (R3-1)',
    async run(tx, account) {
      const g = this.name;
      const T = 'GAP_ENROLLMENT_PIN';
      const fam = await insertFamily(tx, { engine: q('hubspot_native'), hubspot_sequence_id: q(`${TAG}_hs_r31a`) });
      const famOther = await insertFamily(tx, { engine: q('hubspot_native'), hubspot_sequence_id: q(`${TAG}_hs_r31b`) });
      const placeholder = await insertVersion(tx, fam);
      const reconstructed = await insertVersion(tx, fam);
      const later = await insertVersion(tx, fam);
      const foreign = await insertVersion(tx, famOther);
      const steps = `'[{"index":0,"subject":"s","body":"b"}]'::jsonb`;
      const three = (versionId: string) => `sequence_version_id = ${q(versionId)}, rendered_steps = ${steps}, rendered_steps_hash = 'h1'`;

      // R3-1: a modex legacy row has rendered_steps NULL by design (the
      // DraftQueueItem rows are its record). It never qualifies for the
      // backfill arm, so it can never be re-pointed at another version.
      const modexLegacy = await insertEnrollment(tx, fam, placeholder, account, { engine: q('modex_draft_queue'), legacy: 'true' });
      const M = `WHERE id = ${q(modexLegacy)}`;
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET ${three(reconstructed)} ${M}`, 'modex legacy row: the three attribution columns (engine modex_draft_queue never qualifies)');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET sequence_version_id = ${q(reconstructed)} ${M}`, 'modex legacy row: sequence_version_id alone');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET rendered_steps = ${steps}, rendered_steps_hash = 'h1' ${M}`, 'modex legacy row: rendered copy alone');

      // A Sprint 2 HubSpot readback row: legacy, hubspot_native, pinned to the placeholder, no rendered steps yet.
      const legacy = await insertEnrollment(tx, fam, placeholder, account, { engine: q('hubspot_native'), legacy: 'true' });
      const W = `WHERE id = ${q(legacy)}`;
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET ${three(foreign)} ${W}`, 'hubspot_native legacy row: a version from another family');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET sequence_version_id = ${q(reconstructed)} ${W}`, 'hubspot_native legacy row: sequence_version_id without rendered_steps');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET sequence_version_id = ${q(reconstructed)}, rendered_steps_hash = 'h1' ${W}`, 'hubspot_native legacy row: version and hash without rendered_steps');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET to_email = 'other@example.com' ${W}`, 'hubspot_native legacy row: to_email');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET ${three(reconstructed)}, to_email = 'other@example.com' ${W}`, 'hubspot_native legacy row: three columns plus to_email');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET ${three(reconstructed)}, legacy = false ${W}`, 'hubspot_native legacy row: three columns plus legacy');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET ${three(foreign)}, family_id = ${q(famOther)} ${W}`, 'hubspot_native legacy row: three columns plus family_id (moving the row to the other family)');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET ${three(reconstructed)}, engine = 'modex_draft_queue' ${W}`, 'hubspot_native legacy row: three columns plus engine');
      await expectOk(tx, g, `UPDATE sequence_enrollments SET ${three(reconstructed)} ${W}`, 'hubspot_native legacy row: the proper single-statement backfill');
      const pinned = await scalar<string>(tx, `SELECT sequence_version_id FROM sequence_enrollments ${W}`);
      if (pinned !== reconstructed) throw new GuardFailure(g, `backfill did not land (sequence_version_id=${pinned})`);

      // Once rendered_steps is set the row is fully pinned again.
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET sequence_version_id = ${q(later)} ${W}`, 'after backfill: second version change');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET ${three(later)} ${W}`, 'after backfill: the three columns again');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET rendered_steps = '[]'::jsonb ${W}`, 'after backfill: rendered_steps');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET rendered_steps_hash = 'h2' ${W}`, 'after backfill: rendered_steps_hash');
      await expectOk(tx, g, `UPDATE sequence_enrollments SET external_state = '{"seen":true}'::jsonb ${W}`, 'after backfill: readback still writable');

      // A non-legacy hubspot_native row with NULL rendered_steps gets no backfill arm.
      const live = await insertEnrollment(tx, fam, placeholder, account, { engine: q('hubspot_native'), legacy: 'false' });
      const L = `WHERE id = ${q(live)}`;
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET ${three(reconstructed)} ${L}`, 'non-legacy hubspot_native: the three attribution columns must stay refused');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET sequence_version_id = ${q(reconstructed)} ${L}`, 'non-legacy hubspot_native: sequence_version_id');
      await expectRefused(tx, g, T, `UPDATE sequence_enrollments SET rendered_steps = ${steps} ${L}`, 'non-legacy hubspot_native: rendered_steps');
    },
  },
  {
    name: 'GAP_APPEND_ONLY sequence_copy_events',
    async run(tx) {
      const g = this.name;
      const id = nid('cpy');
      await expectOk(tx, g, copyEventInsertSql(id), 'insert');
      await expectRefused(tx, g, 'GAP_APPEND_ONLY', `UPDATE sequence_copy_events SET new_value = 'changed' WHERE id = ${q(id)}`, 'update');
      await expectRefused(tx, g, 'GAP_APPEND_ONLY', `DELETE FROM sequence_copy_events WHERE id = ${q(id)}`, 'delete');
      await expectOk(tx, g, copyEventInsertSql(nid('cpy')), 'a later event for the same property');
    },
  },
  {
    name: 'GAP_APPEND_ONLY hypothesis_events',
    async run(tx, account) {
      const g = this.name;
      const hyp = await insertHypothesis(tx, account);
      const id = nid('evt');
      await expectOk(tx, g, hypothesisEventInsertSql(id, hyp), 'insert');
      await expectRefused(tx, g, 'GAP_APPEND_ONLY', `UPDATE hypothesis_events SET reason = 'rewritten' WHERE id = ${q(id)}`, 'update');
      await expectRefused(tx, g, 'GAP_APPEND_ONLY', `DELETE FROM hypothesis_events WHERE id = ${q(id)}`, 'delete');
      await expectOk(tx, g, hypothesisEventInsertSql(nid('evt'), hyp), 'a second event');
    },
  },
  {
    name: 'GAP_APPEND_ONLY gap_audit_events',
    async run(tx) {
      const g = this.name;
      const id = nid('aud');
      const ins = (i: string) =>
        `INSERT INTO gap_audit_events (id, kind, actor, subject_type, subject_id, payload) VALUES (${q(i)}, 'verify', 'verify', 'enrollment', ${q(TAG)}, '{"ok":true}'::jsonb)`;
      await expectOk(tx, g, ins(id), 'insert');
      await expectRefused(tx, g, 'GAP_APPEND_ONLY', `UPDATE gap_audit_events SET payload = '{"ok":false}'::jsonb WHERE id = ${q(id)}`, 'update');
      await expectRefused(tx, g, 'GAP_APPEND_ONLY', `DELETE FROM gap_audit_events WHERE id = ${q(id)}`, 'delete');
      await expectOk(tx, g, ins(nid('aud')), 'a second event');
    },
  },
  {
    name: 'GAP_BID_IMMUTABLE',
    async run(tx, account) {
      const g = this.name;
      const T = 'GAP_BID_IMMUTABLE';
      const hyp = await insertHypothesis(tx, account);
      const hyp2 = await insertHypothesis(tx, account);
      const bid = await insertBid(tx, hyp, account);
      const W = `WHERE id = ${q(bid)}`;
      await expectRefused(tx, g, T, `UPDATE buyer_input_data SET raw_buyer_language = 'edited' ${W}`, 'raw_buyer_language');
      await expectRefused(tx, g, T, `UPDATE buyer_input_data SET type = 'impact' ${W}`, 'type');
      await expectRefused(tx, g, T, `UPDATE buyer_input_data SET source = 'email' ${W}`, 'source');
      await expectRefused(tx, g, T, `UPDATE buyer_input_data SET captured_at = now() - interval '1 day' ${W}`, 'captured_at');
      await expectRefused(tx, g, T, `UPDATE buyer_input_data SET captured_by = 'someone' ${W}`, 'captured_by');
      await expectRefused(tx, g, T, `UPDATE buyer_input_data SET hypothesis_id = ${q(hyp2)} ${W}`, 'hypothesis_id');
      await expectRefused(tx, g, T, `UPDATE buyer_input_data SET contact_email = 'x@example.com' ${W}`, 'contact_email');
      await expectRefused(tx, g, T, `UPDATE buyer_input_data SET numeric_value = 1 ${W}`, 'numeric_value');
      await expectRefused(tx, g, T, `UPDATE buyer_input_data SET unit = 'hours' ${W}`, 'unit');
      await expectRefused(tx, g, T, `DELETE FROM buyer_input_data ${W}`, 'delete');
      await expectOk(tx, g, `UPDATE buyer_input_data SET normalized_summary = 'Trailers lost weekly' ${W}`, 'normalized_summary while unconfirmed');
      await expectOk(tx, g, `UPDATE buyer_input_data SET human_confirmed = true, confirmed_by = 'verify', confirmed_at = now() ${W}`, 'confirm');
      await expectRefused(tx, g, T, `UPDATE buyer_input_data SET normalized_summary = 'again' ${W}`, 'normalized_summary after confirm');
      await expectRefused(tx, g, T, `UPDATE buyer_input_data SET metadata = '{"x":1}'::jsonb ${W}`, 'metadata after confirm');
      await expectRefused(tx, g, T, `UPDATE buyer_input_data SET human_confirmed = false ${W}`, 'unconfirm');
      await expectOk(tx, g, `UPDATE buyer_input_data SET updated_at = now() ${W}`, 'updated_at touch after confirm');
      // A correction is a new row pointing back; the second correction of the
      // same row hits the supersedes_id unique.
      await expectOk(tx, g, bidInsertSql(nid('bid'), hyp, account, { supersedes_id: q(bid) }), 'correction row');
      await expectRefused(tx, g, 'Key (supersedes_id)', bidInsertSql(nid('bid'), hyp, account, { supersedes_id: q(bid) }), 'second correction of the same row');
    },
  },
  {
    name: 'GAP_SIGNAL_FROZEN',
    async run(tx, account) {
      const g = this.name;
      const T = 'GAP_SIGNAL_FROZEN';
      const sig = await insertSignal(tx, account);
      const W = `WHERE id = ${q(sig)}`;
      await expectRefused(tx, g, T, `UPDATE prospecting_signals SET title = 'new title' ${W}`, 'title');
      await expectRefused(tx, g, T, `UPDATE prospecting_signals SET summary = 's' ${W}`, 'summary');
      await expectRefused(tx, g, T, `UPDATE prospecting_signals SET evidence_url = 'https://x' ${W}`, 'evidence_url');
      await expectRefused(tx, g, T, `UPDATE prospecting_signals SET evidence_text = 'e' ${W}`, 'evidence_text');
      await expectRefused(tx, g, T, `UPDATE prospecting_signals SET observed_at = now() - interval '1 day' ${W}`, 'observed_at');
      await expectRefused(tx, g, T, `UPDATE prospecting_signals SET source_kind = 'crm' ${W}`, 'source_kind');
      await expectRefused(tx, g, T, `UPDATE prospecting_signals SET source_id = 'other' ${W}`, 'source_id');
      await expectRefused(tx, g, T, `UPDATE prospecting_signals SET source_type = 'crm' ${W}`, 'source_type');
      await expectRefused(tx, g, T, `UPDATE prospecting_signals SET claim_class = 'FACT' ${W}`, 'claim_class');
      await expectOk(tx, g, `UPDATE prospecting_signals SET metadata = '{"seen":1}'::jsonb ${W}`, 'metadata');
    },
  },
  {
    name: 'GAP_HYPOTHESIS_FROZEN narrative',
    async run(tx, account) {
      const g = this.name;
      const T = 'GAP_HYPOTHESIS_FROZEN';
      const draft = await insertHypothesis(tx, account);
      const review = await insertHypothesis(tx, account, { status: q('review_required') });
      const active = await insertHypothesis(tx, account, { status: q('active') });
      const W = `WHERE id = ${q(active)}`;
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET observation = 'rewritten [S:y]' ${W}`, 'observation');
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET problem_hypothesis = 'p' ${W}`, 'problem_hypothesis');
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET root_cause_hypotheses = '[]'::jsonb ${W}`, 'root_cause_hypotheses');
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET impact_hypotheses = '[]'::jsonb ${W}`, 'impact_hypotheses');
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET why_now = 'now' ${W}`, 'why_now');
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET falsification_questions = '[]'::jsonb ${W}`, 'falsification_questions');
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET what_a_no_means = 'n' ${W}`, 'what_a_no_means');
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET problem_family = 'cost_to_ship' ${W}`, 'problem_family');
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET persona = 'finance_procurement' ${W}`, 'persona');
      await expectOk(tx, g, `UPDATE prospecting_hypotheses SET status = 'confirmed', resolved_at = now(), resolved_by = 'verify', resolution = '{"problem":"confirmed"}'::jsonb, metadata = '{"note":1}'::jsonb ${W}`, 'active: non-narrative columns');
      await expectOk(tx, g, `UPDATE prospecting_hypotheses SET observation = 'rewritten [S:y]', problem_family = 'cost_to_ship' WHERE id = ${q(draft)}`, 'draft: narrative');
      await expectOk(tx, g, `UPDATE prospecting_hypotheses SET observation = 'rewritten [S:y]' WHERE id = ${q(review)}`, 'review_required: narrative');
    },
  },
  {
    name: 'GAP_HYPOTHESIS_FROZEN unlink signal',
    async run(tx, account) {
      const g = this.name;
      // Links are added while the hypothesis is still draft (N4 refuses a link
      // into a hypothesis past review), then the hypothesis is promoted.
      const sig = await insertSignal(tx, account, { evidence_text: q('Evidence for the unlink case.') });
      const draft = await insertHypothesis(tx, account);
      const active = await insertHypothesis(tx, account);
      await expectOk(tx, g, `INSERT INTO hypothesis_signals (hypothesis_id, signal_id, role) VALUES (${q(draft)}, ${q(sig)}, 'primary'), (${q(active)}, ${q(sig)}, 'supporting')`, 'link both while draft');
      await expectOk(tx, g, promoteToActiveSql(active), 'promote the second hypothesis to active');
      await expectRefused(tx, g, 'gap_ck_hypothesis_signals_role', `INSERT INTO hypothesis_signals (hypothesis_id, signal_id, role) VALUES (${q(draft)}, ${q(await insertSignal(tx, account))}, 'decorative')`, 'role=decorative');
      await expectRefused(tx, g, 'GAP_HYPOTHESIS_FROZEN', `DELETE FROM hypothesis_signals WHERE hypothesis_id = ${q(active)} AND signal_id = ${q(sig)}`, 'unlink from active');
      await expectOk(tx, g, `DELETE FROM hypothesis_signals WHERE hypothesis_id = ${q(draft)} AND signal_id = ${q(sig)}`, 'unlink from draft');
    },
  },
  {
    name: 'GAP_HYPOTHESIS_FROZEN link into a hypothesis past review (N4)',
    async run(tx, account) {
      const g = this.name;
      const T = 'GAP_HYPOTHESIS_FROZEN';
      const sig = await insertSignal(tx, account);
      const draft = await insertHypothesis(tx, account);
      const review = await insertHypothesis(tx, account, { status: q('review_required') });
      const active = await insertHypothesis(tx, account, { status: q('active') });
      const rejected = await insertHypothesis(tx, account, { status: q('rejected') });
      const link = (hyp: string) => `INSERT INTO hypothesis_signals (hypothesis_id, signal_id, role) VALUES (${q(hyp)}, ${q(sig)}, 'supporting')`;
      await expectRefused(tx, g, T, link(active), 'link into active');
      await expectRefused(tx, g, T, link(rejected), 'link into rejected');
      await expectOk(tx, g, link(draft), 'link into draft');
      await expectOk(tx, g, link(review), 'link into review_required');
    },
  },
  {
    name: 'GAP_HYPOTHESIS_FROZEN re-point link by update (R1-6)',
    async run(tx, account) {
      const g = this.name;
      const T = 'GAP_HYPOTHESIS_FROZEN';
      const sigA = await insertSignal(tx, account, { evidence_text: q('Evidence for the re-point case.') });
      const sigB = await insertSignal(tx, account);
      const sigC = await insertSignal(tx, account);
      const draft = await insertHypothesis(tx, account);
      const draft2 = await insertHypothesis(tx, account);
      const active = await insertHypothesis(tx, account);
      await expectOk(tx, g, `INSERT INTO hypothesis_signals (hypothesis_id, signal_id, role) VALUES (${q(active)}, ${q(sigA)}, 'primary'), (${q(draft)}, ${q(sigB)}, 'primary')`, 'link while draft');
      await expectOk(tx, g, promoteToActiveSql(active), 'promote to active');
      await expectRefused(tx, g, T, `UPDATE hypothesis_signals SET signal_id = ${q(sigC)} WHERE hypothesis_id = ${q(active)} AND signal_id = ${q(sigA)}`, 'active: re-point signal_id');
      await expectRefused(tx, g, T, `UPDATE hypothesis_signals SET hypothesis_id = ${q(draft2)} WHERE hypothesis_id = ${q(active)} AND signal_id = ${q(sigA)}`, 'active: move link out');
      await expectRefused(tx, g, T, `UPDATE hypothesis_signals SET hypothesis_id = ${q(active)} WHERE hypothesis_id = ${q(draft)} AND signal_id = ${q(sigB)}`, 'draft: move link INTO active');
      await expectOk(tx, g, `UPDATE hypothesis_signals SET role = 'supporting' WHERE hypothesis_id = ${q(active)} AND signal_id = ${q(sigA)}`, 'active: role only');
      await expectOk(tx, g, `UPDATE hypothesis_signals SET signal_id = ${q(sigC)} WHERE hypothesis_id = ${q(draft)} AND signal_id = ${q(sigB)}`, 'draft: re-point signal_id');
      await expectOk(tx, g, `UPDATE hypothesis_signals SET hypothesis_id = ${q(draft2)} WHERE hypothesis_id = ${q(draft)} AND signal_id = ${q(sigC)}`, 'draft: move link to another draft');
    },
  },
  {
    name: 'GAP_HYPOTHESIS_UNSUPPORTED approve without reviewer (R1-7)',
    async run(tx, account) {
      const g = this.name;
      const T = 'GAP_HYPOTHESIS_UNSUPPORTED';
      const sig = await insertSignal(tx, account, { evidence_url: q('https://example.com/fact') });
      const hyp = await insertHypothesis(tx, account, { status: q('review_required') });
      await expectOk(tx, g, `INSERT INTO hypothesis_signals (hypothesis_id, signal_id) VALUES (${q(hyp)}, ${q(sig)})`, 'link evidenced signal');
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET status = 'approved' WHERE id = ${q(hyp)}`, 'approved with reviewed_by NULL');
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET status = 'active', activated_at = now() WHERE id = ${q(hyp)}`, 'active with reviewed_by NULL');
      await expectOk(tx, g, `UPDATE prospecting_hypotheses SET status = 'draft' WHERE id = ${q(hyp)}`, 'review_required -> draft needs nothing');
    },
  },
  {
    name: 'GAP_HYPOTHESIS_UNSUPPORTED approve without evidence (R1-7)',
    async run(tx, account) {
      const g = this.name;
      const T = 'GAP_HYPOTHESIS_UNSUPPORTED';
      const bare = await insertSignal(tx, account);
      const none = await insertHypothesis(tx, account, { status: q('review_required') });
      const unevidenced = await insertHypothesis(tx, account, { status: q('review_required') });
      await expectOk(tx, g, `INSERT INTO hypothesis_signals (hypothesis_id, signal_id) VALUES (${q(unevidenced)}, ${q(bare)})`, 'link a signal with no url and no text');
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET status = 'approved', reviewed_by = 'verify', reviewed_at = now() WHERE id = ${q(none)}`, 'no linked signals');
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET status = 'approved', reviewed_by = 'verify', reviewed_at = now() WHERE id = ${q(unevidenced)}`, 'linked signal without evidence');
      await expectOk(tx, g, `UPDATE prospecting_hypotheses SET status = 'rejected', reviewed_by = 'verify' WHERE id = ${q(unevidenced)}`, 'withdraw needs no evidence');
    },
  },
  {
    name: 'GAP_HYPOTHESIS_UNSUPPORTED approve with reviewer and evidenced signal allowed (R1-7)',
    async run(tx, account) {
      const g = this.name;
      const T = 'GAP_HYPOTHESIS_UNSUPPORTED';
      const bare = await insertSignal(tx, account);
      const evidenced = await insertSignal(tx, account, { evidence_text: q('Anna is truck only.') });
      const hyp = await insertHypothesis(tx, account, { status: q('review_required') });
      await expectOk(tx, g, `INSERT INTO hypothesis_signals (hypothesis_id, signal_id) VALUES (${q(hyp)}, ${q(bare)}), (${q(hyp)}, ${q(evidenced)})`, 'link one bare and one evidenced signal');
      await expectOk(tx, g, `UPDATE prospecting_hypotheses SET status = 'approved', reviewed_by = 'verify', reviewed_at = now() WHERE id = ${q(hyp)}`, 'approve');
      await expectOk(tx, g, `UPDATE prospecting_hypotheses SET status = 'active', activated_at = now() WHERE id = ${q(hyp)}`, 'approved -> active');
      // A second hypothesis goes draft -> active directly with the same evidence: allowed.
      const hyp2 = await insertHypothesis(tx, account);
      await expectOk(tx, g, `INSERT INTO hypothesis_signals (hypothesis_id, signal_id) VALUES (${q(hyp2)}, ${q(evidenced)})`, 'link evidenced');
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET status = 'active' WHERE id = ${q(hyp2)}`, 'draft -> active without reviewer');
      await expectOk(tx, g, `UPDATE prospecting_hypotheses SET status = 'active', reviewed_by = 'verify', reviewed_at = now(), activated_at = now() WHERE id = ${q(hyp2)}`, 'draft -> active with reviewer + evidence');
    },
  },
  {
    name: 'GAP_SIGNAL_FROZEN external_ok, account_name, confidence, freshness (R1-8)',
    async run(tx, account) {
      const g = this.name;
      const T = 'GAP_SIGNAL_FROZEN';
      const other = `GAP Verify Other ${TAG}`;
      await expectOk(tx, g, `INSERT INTO accounts (rank, name, vertical, updated_at) VALUES (9998, ${q(other)}, 'verify', now())`, 'second account');
      const sig = await insertSignal(tx, account, { external_ok: 'false', freshness_expires_at: `now() + interval '7 days'` });
      const W = `WHERE id = ${q(sig)}`;
      await expectRefused(tx, g, T, `UPDATE prospecting_signals SET external_ok = true ${W}`, 'external_ok false -> true');
      await expectRefused(tx, g, T, `UPDATE prospecting_signals SET external_ok = NULL ${W}`, 'external_ok false -> null');
      await expectRefused(tx, g, T, `UPDATE prospecting_signals SET account_name = ${q(other)} ${W}`, 'account_name');
      await expectRefused(tx, g, T, `UPDATE prospecting_signals SET confidence = 90 ${W}`, 'confidence');
      await expectRefused(tx, g, T, `UPDATE prospecting_signals SET freshness_expires_at = now() + interval '90 days' ${W}`, 'freshness extended');
      await expectRefused(tx, g, T, `UPDATE prospecting_signals SET freshness_expires_at = NULL ${W}`, 'freshness cleared');
      await expectOk(tx, g, `UPDATE prospecting_signals SET metadata = '{"seen":2}'::jsonb, hubspot_company_id = '99', persona_id = NULL ${W}`, 'metadata and resolution pointers');
    },
  },
  {
    name: 'GAP_HYPOTHESIS_FROZEN confidence, secondary_families, contrary_evidence, predicted_buyer_language, buying_center (R1-9b)',
    async run(tx, account) {
      const g = this.name;
      const T = 'GAP_HYPOTHESIS_FROZEN';
      const draft = await insertHypothesis(tx, account);
      const active = await insertHypothesis(tx, account, { status: q('active') });
      const W = `WHERE id = ${q(active)}`;
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET confidence = 41 ${W}`, 'confidence bump on active');
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET secondary_families = '["cost_to_ship"]'::jsonb ${W}`, 'secondary_families');
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET contrary_evidence = 'none' ${W}`, 'contrary_evidence');
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET predicted_buyer_language = 'we lose trailers' ${W}`, 'predicted_buyer_language');
      await expectRefused(tx, g, T, `UPDATE prospecting_hypotheses SET buying_center = 'ops' ${W}`, 'buying_center');
      await expectOk(tx, g, `UPDATE prospecting_hypotheses SET confidence = 41, secondary_families = '["cost_to_ship"]'::jsonb, contrary_evidence = 'none', predicted_buyer_language = 'x', buying_center = 'ops' WHERE id = ${q(draft)}`, 'all five on draft');
      await expectOk(tx, g, `UPDATE prospecting_hypotheses SET expires_at = now() + interval '30 days', sequence_family_id = NULL, metadata = '{"k":1}'::jsonb ${W}`, 'active: operational columns');
    },
  },
  {
    name: 'GAP_DISPOSITION_FROZEN',
    async run(tx, account) {
      const g = this.name;
      const T = 'GAP_DISPOSITION_FROZEN';
      const hyp = await insertHypothesis(tx, account);
      const disp = await insertDisposition(tx, hyp, account);
      const W = `WHERE id = ${q(disp)}`;
      await expectOk(tx, g, `UPDATE conversation_dispositions SET response_class = 'timing', buyer_language = 'call me in Q1' ${W}`, 'unconfirmed: class + language');
      await expectOk(tx, g, `UPDATE conversation_dispositions SET metadata = '{"resumeAt":"2027-01-04T00:00:00.000Z"}'::jsonb ${W}`, 'unconfirmed: metadata');
      await expectOk(tx, g, `UPDATE conversation_dispositions SET human_confirmed = true, confirmed_by = 'verify', confirmed_at = now() ${W}`, 'confirm');
      // S4-T3: a confirmed row's resumeAt is a fact; metadata freezes with the classes.
      await expectRefused(tx, g, T, `UPDATE conversation_dispositions SET metadata = '{"resumeAt":"2027-06-01T00:00:00.000Z"}'::jsonb ${W}`, 'metadata after confirm');
      await expectRefused(tx, g, T, `UPDATE conversation_dispositions SET metadata = NULL ${W}`, 'metadata cleared after confirm');
      await expectRefused(tx, g, T, `UPDATE conversation_dispositions SET response_class = 'not_priority' ${W}`, 'response_class after confirm');
      await expectRefused(tx, g, T, `UPDATE conversation_dispositions SET root_cause_class = 'x' ${W}`, 'root_cause_class after confirm');
      await expectRefused(tx, g, T, `UPDATE conversation_dispositions SET impact_class = 'x' ${W}`, 'impact_class after confirm');
      await expectRefused(tx, g, T, `UPDATE conversation_dispositions SET buyer_language = 'never' ${W}`, 'buyer_language after confirm');
      await expectRefused(tx, g, T, `UPDATE conversation_dispositions SET human_confirmed = false ${W}`, 'unconfirm');
      await expectOk(tx, g, `UPDATE conversation_dispositions SET next_best_action = 'follow up Q1', hubspot_contact_id = '42' ${W}`, 'confirmed: non-frozen columns');
      await expectRefused(tx, g, 'Key (source_kind, source_id)', dispositionInsertSql(nid('disp'), hyp, account, { source_kind: q('verify'), source_id: q(disp) }), 'same (source_kind, source_id) twice');
    },
  },
  {
    name: 'CHECK gap_account_aliases.source (6A)',
    async run(tx, account) {
      const g = this.name;
      const aliasInsertSql = (id: string, overrides: Record<string, string> = {}) => {
        const cols: Record<string, string> = {
          id: q(id),
          alias: q('Verify Alias Co'),
          normalized_alias: q(`verify alias ${id}`),
          account_name: q(account),
          source: q('manual'),
          created_by: q('verify'),
          created_at: 'now()',
          ...overrides,
        };
        return `INSERT INTO gap_account_aliases (${Object.keys(cols).join(',')}) VALUES (${Object.values(cols).join(',')})`;
      };
      await expectRefused(tx, g, 'gap_ck_gap_account_aliases_source', aliasInsertSql(nid('alias'), { source: q('scraped_guess') }), 'source=scraped_guess');
      await expectOk(tx, g, aliasInsertSql(nid('alias'), { source: q('hypothesize_cron') }), 'source=hypothesize_cron');
      await expectOk(tx, g, aliasInsertSql(nid('alias')), 'source=manual');
    },
  },
  {
    name: 'UNIQUE gap_account_aliases.normalized_alias (6A)',
    async run(tx, account) {
      const g = this.name;
      const key = `verify dup ${nid('key')}`;
      const aliasInsertSql = (id: string, overrides: Record<string, string> = {}) => {
        const cols: Record<string, string> = {
          id: q(id),
          alias: q('Verify Dup Co'),
          normalized_alias: q(key),
          account_name: q(account),
          source: q('manual'),
          created_by: q('verify'),
          created_at: 'now()',
          ...overrides,
        };
        return `INSERT INTO gap_account_aliases (${Object.keys(cols).join(',')}) VALUES (${Object.values(cols).join(',')})`;
      };
      await expectOk(tx, g, aliasInsertSql(nid('alias')), 'first registration');
      await expectRefused(tx, g, 'Key (normalized_alias)', aliasInsertSql(nid('alias')), 'same normalized_alias twice, even for a different source');
    },
  },
];

// ---------------------------------------------------------------------------

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set; refusing to guess a database.');
    process.exit(2);
  }
  const prisma = new PrismaClient();
  const results: Array<{ guard: string; ok: boolean; detail: string }> = [];

  try {
    await prisma.$transaction(
      async (tx) => {
        const account = await seedAccount(tx);
        for (const guard of guards) {
          try {
            await guard.run(tx, account);
            results.push({ guard: guard.name, ok: true, detail: '' });
          } catch (err) {
            if (err instanceof GuardFailure) {
              results.push({ guard: guard.name, ok: false, detail: err.message });
            } else {
              // A fixture insert failed: the schema and the script disagree.
              results.push({ guard: guard.name, ok: false, detail: `fixture error: ${errorText(err).slice(0, 300)}` });
            }
          }
        }
        throw new Error(ROLLBACK_SENTINEL);
      },
      { maxWait: 15_000, timeout: 180_000 },
    );
  } catch (err) {
    if (!(err instanceof Error) || err.message !== ROLLBACK_SENTINEL) {
      console.error('verify-triggers: transaction failed before the guards could run');
      console.error(errorText(err));
      await prisma.$disconnect();
      process.exit(2);
    }
  } finally {
    await prisma.$disconnect();
  }

  const width = Math.max(...results.map((r) => r.guard.length)) + 2;
  console.log('');
  console.log(`${'guard'.padEnd(width)}result`);
  console.log(`${'-'.repeat(width)}------`);
  for (const r of results) {
    console.log(`${r.guard.padEnd(width)}${r.ok ? 'PASS' : 'FAIL'}${r.ok ? '' : `  ${r.detail}`}`);
  }
  const failed = results.filter((r) => !r.ok);
  console.log('');
  console.log(`${results.length - failed.length}/${results.length} guards passed (transaction rolled back)`);
  if (failed.length > 0) {
    console.error(`FIRST FAILING GUARD: ${failed[0].guard}: ${failed[0].detail}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(errorText(err));
  process.exit(2);
});
