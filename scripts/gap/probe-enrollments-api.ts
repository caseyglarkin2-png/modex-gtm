/**
 * GAP Prospecting OS, Sprint 2, S2-T0: the HubSpot enrollments-API write probe.
 * PREPARED ONLY. It decides whether enrollment can ever run in API mode.
 *
 * READ THIS BEFORE RUNNING WITH --confirm
 * ---------------------------------------
 * Executing this script enrolls ONE contact into a probe sequence owned by
 * HubSpot user 85093129 (Casey). HubSpot sends that sequence's step 1 as a
 * real email from Casey's identity to that contact. It is a live send, even
 * though the recipient is internal, and it therefore needs the owner's go
 * recorded in docs/GAP_PROSPECTING_OS.md (ticket S2-T0) BEFORE the env gate
 * below is set. Do not set GAP_PROBE_OWNER_GO on Casey's behalf.
 *
 * What it does, in order:
 *   1. GET  /automation/v4/sequences?userId=85093129&limit=100   (read-only)
 *      to find a sequence whose name starts with `YF | Probe |`.
 *   2. POST /automation/v4/sequences/enrollments
 *      body {sequenceId, contactId, senderEmail, userId}
 *      for ONE contact whose email is on an internal domain
 *      (freightroll.com or yardflow.ai; anything else is refused).
 *   3. GET  /automation/v4/sequences/enrollments/contact/{contactId}?userId=85093129
 *      and print the readback.
 *   4. Print the unenroll instruction. The v4 API documents no unenroll; the
 *      operator unenrolls in the HubSpot UI (contact record > Sequences >
 *      Unenroll) and confirms the sequence shows zero active enrollments.
 *
 * Modes:
 *   npx tsx scripts/gap/probe-enrollments-api.ts
 *       dry run: prints exactly what it WOULD do, makes NO network call, exits 0.
 *   npx tsx scripts/gap/probe-enrollments-api.ts --confirm --contact-id <id> --contact-email <email> [--sender-email <email>]
 *       live: every gate below must pass or it prints `REFUSED: <reason>` and exits 2.
 *
 * Gates for the POST (all required): `--confirm`; env GAP_PROBE_OWNER_GO equal
 * to the literal `I approve one probe enrollment`; the contact email on an
 * internal domain; the sender email on an internal domain; HUBSPOT_ACCESS_TOKEN
 * present (read only after the other gates pass); a `YF | Probe |` sequence
 * found by the read in step 1. Exit codes: 0 done, 2 refused, 1 HTTP failure.
 *
 * No function in this file touches `fetch` until every gate has passed, so the
 * dry run and every refusal are provably offline.
 */

const HUBSPOT_USER_ID = '85093129';
const HUBSPOT_BASE = 'https://api.hubapi.com';
const PROBE_PREFIX = 'YF | Probe |';
const OWNER_GO_PHRASE = 'I approve one probe enrollment';
const INTERNAL_DOMAINS = ['freightroll.com', 'yardflow.ai'] as const;
const DEFAULT_SENDER = 'casey@freightroll.com';

const SEQUENCES_URL = `${HUBSPOT_BASE}/automation/v4/sequences?userId=${HUBSPOT_USER_ID}&limit=100`;
const ENROLL_URL = `${HUBSPOT_BASE}/automation/v4/sequences/enrollments`;
const readbackUrl = (contactId: string) =>
  `${HUBSPOT_BASE}/automation/v4/sequences/enrollments/contact/${encodeURIComponent(contactId)}?userId=${HUBSPOT_USER_ID}`;

interface Args {
  confirm: boolean;
  contactId: string | null;
  contactEmail: string | null;
  senderEmail: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { confirm: false, contactId: null, contactEmail: null, senderEmail: DEFAULT_SENDER };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--confirm') args.confirm = true;
    else if (a === '--contact-id') args.contactId = argv[++i] ?? null;
    else if (a === '--contact-email') args.contactEmail = argv[++i] ?? null;
    else if (a === '--sender-email') args.senderEmail = argv[++i] ?? DEFAULT_SENDER;
    else {
      console.log(`REFUSED: unknown argument ${a}`);
      process.exit(2);
    }
  }
  return args;
}

function isInternal(email: string | null): boolean {
  if (!email) return false;
  const at = email.lastIndexOf('@');
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return (INTERNAL_DOMAINS as readonly string[]).includes(domain);
}

function unenrollInstruction(contactId: string, sequenceName: string): string {
  return [
    'UNENROLL (manual; the v4 API documents no unenroll endpoint):',
    `  1. Open https://app.hubspot.com/contacts/3819073/record/0-1/${contactId}`,
    `  2. In the right rail, Sequences > "${sequenceName}" > Unenroll.`,
    '  3. Re-run step 3 (the readback GET) and confirm the enrollment reads as unenrolled or absent.',
    '  4. Record the result (accepted or refused, and the readback) under S2-T0 in docs/GAP_PROSPECTING_OS.md.',
  ].join('\n');
}

function printPlan(args: Args): void {
  const contactId = args.contactId ?? '<contact-id>';
  const contactEmail = args.contactEmail ?? '<internal email on freightroll.com or yardflow.ai>';
  const body = { sequenceId: '<id of the YF | Probe | sequence from step 1>', contactId, senderEmail: args.senderEmail, userId: HUBSPOT_USER_ID };
  console.log('probe-enrollments-api: DRY RUN. No network call is made in this mode.');
  console.log('');
  console.log('It WOULD do, in order:');
  console.log(`  1. GET ${SEQUENCES_URL}`);
  console.log(`     Authorization: Bearer $HUBSPOT_ACCESS_TOKEN (read-only). Find the first sequence whose name starts with "${PROBE_PREFIX}".`);
  console.log(`     If none exists: REFUSED, exit 2, nothing else runs. Build one in the HubSpot UI first (one step, an internal-only body).`);
  console.log(`  2. POST ${ENROLL_URL}`);
  console.log(`     body ${JSON.stringify(body)}`);
  console.log(`     for ONE contact (${contactEmail}). Anything not on ${INTERNAL_DOMAINS.join(' or ')} is refused.`);
  console.log(`     This sends the probe sequence's step 1 as a real email from ${args.senderEmail}.`);
  console.log(`  3. GET ${readbackUrl(contactId)}`);
  console.log('     and print the readback (enrollment id, status, sequence id).');
  console.log('  4. ' + unenrollInstruction(contactId, `${PROBE_PREFIX} ...`).split('\n').join('\n     '));
  console.log('');
  console.log('Gates for the POST (all required, checked in this order before any network call):');
  console.log('  --confirm on the command line');
  console.log(`  env GAP_PROBE_OWNER_GO equal to the literal "${OWNER_GO_PHRASE}" (set only after the owner go is recorded in docs/GAP_PROSPECTING_OS.md)`);
  console.log('  --contact-id and --contact-email given, the email on an internal domain');
  console.log('  --sender-email (default casey@freightroll.com) on an internal domain');
  console.log('  HUBSPOT_ACCESS_TOKEN present (read only once the gates above pass)');
  console.log('Any gate failing prints REFUSED: <reason> and exits 2.');
}

function refuse(reason: string): number {
  console.log(`REFUSED: ${reason}`);
  return 2;
}

// ---------------------------------------------------------------------------
// Network. Nothing above this line references fetch; nothing below runs until
// every gate in main() has passed.
// ---------------------------------------------------------------------------

async function hubspot(token: string, method: 'GET' | 'POST', url: string, body?: unknown): Promise<{ status: number; json: unknown }> {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
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

function findProbeSequence(json: unknown): { id: string; name: string } | null {
  const results = (json as { results?: unknown })?.results;
  if (!Array.isArray(results)) return null;
  for (const r of results) {
    const name = (r as { name?: unknown })?.name;
    const id = (r as { id?: unknown })?.id;
    if (typeof name === 'string' && name.startsWith(PROBE_PREFIX) && (typeof id === 'string' || typeof id === 'number')) {
      return { id: String(id), name };
    }
  }
  return null;
}

async function runLive(args: Args, token: string): Promise<number> {
  const contactId = args.contactId as string;
  console.log(`step 1: GET ${SEQUENCES_URL}`);
  const list = await hubspot(token, 'GET', SEQUENCES_URL);
  if (list.status !== 200) {
    console.log(`step 1 failed: HTTP ${list.status} ${JSON.stringify(list.json).slice(0, 500)}`);
    return 1;
  }
  const probe = findProbeSequence(list.json);
  if (!probe) return refuse(`no sequence named "${PROBE_PREFIX} ..." exists for user ${HUBSPOT_USER_ID}; build one in the UI first`);
  console.log(`step 1: probe sequence ${probe.id} "${probe.name}"`);

  const body = { sequenceId: probe.id, contactId, senderEmail: args.senderEmail, userId: HUBSPOT_USER_ID };
  console.log(`step 2: POST ${ENROLL_URL} ${JSON.stringify(body)}`);
  const enroll = await hubspot(token, 'POST', ENROLL_URL, body);
  console.log(`step 2: HTTP ${enroll.status}`);
  console.log(JSON.stringify(enroll.json, null, 2));

  console.log(`step 3: GET ${readbackUrl(contactId)}`);
  const readback = await hubspot(token, 'GET', readbackUrl(contactId));
  console.log(`step 3: HTTP ${readback.status}`);
  console.log(JSON.stringify(readback.json, null, 2));

  console.log('');
  console.log(unenrollInstruction(contactId, probe.name));
  console.log('');
  console.log(
    `VERDICT: enrollment ${enroll.status >= 200 && enroll.status < 300 ? 'ACCEPTED' : `REFUSED by HubSpot (HTTP ${enroll.status})`}; readback HTTP ${readback.status}. Record this under S2-T0 in docs/GAP_PROSPECTING_OS.md.`,
  );
  return enroll.status >= 200 && enroll.status < 300 && readback.status === 200 ? 0 : 1;
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.confirm) {
    printPlan(args);
    return 0;
  }

  // Gates, in order. Every one prints REFUSED and exits 2 before any network call.
  if (process.env.GAP_PROBE_OWNER_GO !== OWNER_GO_PHRASE) {
    return refuse(`env GAP_PROBE_OWNER_GO is not the literal "${OWNER_GO_PHRASE}"; the owner go must be recorded in docs/GAP_PROSPECTING_OS.md first`);
  }
  if (!args.contactId || !/^\d+$/.test(args.contactId)) return refuse('--contact-id <numeric HubSpot contact id> is required');
  if (!args.contactEmail) return refuse('--contact-email <email> is required');
  if (!isInternal(args.contactEmail)) return refuse(`contact email ${args.contactEmail} is not on an internal domain (${INTERNAL_DOMAINS.join(', ')})`);
  if (!isInternal(args.senderEmail)) return refuse(`sender email ${args.senderEmail} is not on an internal domain (${INTERNAL_DOMAINS.join(', ')})`);

  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) return refuse('HUBSPOT_ACCESS_TOKEN is not set');

  console.log(`probe-enrollments-api: LIVE. One enrollment of contact ${args.contactId} (${args.contactEmail}) from ${args.senderEmail}.`);
  return runLive(args, token);
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
