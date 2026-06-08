/**
 * Activate the Wave 3 Tier-A buyer committees: stage each contact as a deduped
 * Outbox draft (#1) and upsert their company + contact into HubSpot (#2).
 *
 * Dry-run by default — prints exactly what it would create and writes nothing.
 * Pass --live to execute.
 *
 *   npx dotenv-cli -e C:/Users/casey/modex-gtm/.env.local -- \
 *     npx tsx scripts/prospect-discovery/activate-wave3.ts \
 *       --csv C:/Users/casey/modex-gtm/output/prospect-discovery/wave3-tierA-buyer-committee-2026-06-04.csv
 *
 * Add --live to write. Outbox staging needs QUEUE_AGENT_SECRET in env; HubSpot
 * upsert needs HUBSPOT_ACCESS_TOKEN. Both paths dedupe (queue: unique active
 * recipient; HubSpot: search-before-create), so re-runs never duplicate.
 */
import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { buildWave3Outreach, WAVE3_FRAMING_COUNT, type Wave3Contact } from '../../src/lib/discovery/wave3-outreach';

interface Row {
  company: string;
  domain: string;
  icp_score: string;
  facilities_in_tierA: string;
  contact_name: string;
  contact_title: string;
  contact_tier: string;
  confidence: string;
  linkedin_url: string;
  source_url: string;
  inferred_email: string;
  email_status: string;
  notes: string;
}

const args = process.argv.slice(2);
const LIVE = args.includes('--live');
const csvPath =
  args[args.indexOf('--csv') + 1] && args.includes('--csv')
    ? args[args.indexOf('--csv') + 1]
    : 'output/prospect-discovery/wave3-tierA-buyer-committee-2026-06-04.csv';
const OWNER = 'casey@freightroll.com';
const BASE = process.env.WAVE3_BASE_URL ?? 'https://modex-gtm.vercel.app';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function firstName(full: string): string {
  return (full || '').trim().split(/\s+/)[0] ?? '';
}

interface StagedDraft {
  company: string;
  domain: string;
  contactName: string;
  title: string;
  toEmail: string;
  emailStatus: string;
  emailValid: boolean;
  angleIndex: number;
  subject: string;
  body: string;
}

function buildDrafts(rows: Row[]): StagedDraft[] {
  // angleIndex rotates per contact WITHIN a company so each committee member
  // gets a distinct framing.
  const seenPerCompany = new Map<string, number>();
  return rows.map((r) => {
    const idx = seenPerCompany.get(r.company) ?? 0;
    seenPerCompany.set(r.company, idx + 1);
    const contact: Wave3Contact = {
      company: r.company,
      firstName: firstName(r.contact_name),
      title: r.contact_title,
      facilities: Number(r.facilities_in_tierA) || undefined,
    };
    const { subject, body } = buildWave3Outreach(contact, idx);
    const toEmail = (r.inferred_email || '').trim().toLowerCase();
    return {
      company: r.company,
      domain: r.domain,
      contactName: r.contact_name,
      title: r.contact_title,
      toEmail,
      emailStatus: r.email_status,
      emailValid: EMAIL_RE.test(toEmail),
      angleIndex: idx,
      subject,
      body,
    };
  });
}

async function postQueueBatch(items: object[]): Promise<{ added: number; skipped: unknown[] }> {
  const secret = process.env.QUEUE_AGENT_SECRET;
  if (!secret) throw new Error('QUEUE_AGENT_SECRET not in env — cannot stage drafts live.');
  const res = await fetch(`${BASE}/api/cron/queue`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(`queue POST ${res.status}: ${await res.text()}`);
  return res.json() as Promise<{ added: number; skipped: unknown[] }>;
}

async function main() {
  const csv = readFileSync(csvPath, 'utf8');
  const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as Row[];
  const drafts = buildDrafts(rows);

  const companies = [...new Map(rows.map((r) => [r.domain || r.company, r])).values()];
  const invalid = drafts.filter((d) => !d.emailValid);

  console.log(`\n=== Wave 3 activation (${LIVE ? 'LIVE' : 'DRY RUN'}) ===`);
  console.log(`CSV: ${csvPath}`);
  console.log(`Companies: ${companies.length}  |  Contacts (drafts): ${drafts.length}  |  Framings rotated: ${WAVE3_FRAMING_COUNT}`);
  console.log(`Emails: ${drafts.length - invalid.length} well-formed, ${invalid.length} malformed`);
  console.log(`Note: all CSV emails are inferred/unverified — they land as drafts for Casey's review, never auto-sent.`);
  if (invalid.length) {
    console.log('\nMalformed emails (skipped from staging):');
    for (const d of invalid) console.log(`  - ${d.company} / ${d.contactName}: "${d.toEmail}"`);
  }

  // Show a few sample drafts so the copy can be eyeballed.
  console.log('\n--- sample drafts ---');
  for (const d of drafts.slice(0, 3)) {
    console.log(`\n[${d.company} · ${d.contactName} · ${d.title}]  (angle ${d.angleIndex})`);
    console.log(`Subject: ${d.subject}`);
    console.log(d.body);
  }

  const stageable = drafts.filter((d) => d.emailValid);

  if (!LIVE) {
    console.log(`\nDRY RUN — nothing written. Would stage ${stageable.length} drafts and upsert ${companies.length} companies + ${stageable.length} contacts in HubSpot.`);
    console.log('Re-run with --live to execute.');
    return;
  }

  // ---- LIVE ----
  // #1 Outbox: one deduped batch (<=200; we have far fewer).
  const items = stageable.map((d) => ({
    toEmail: d.toEmail,
    accountName: d.company,
    personaName: d.contactName,
    subject: d.subject,
    body: d.body,
    source: 'casey' as const,
    owner: OWNER,
  }));
  console.log(`\nStaging ${items.length} drafts to ${BASE}/api/cron/queue …`);
  const q = await postQueueBatch(items);
  console.log(`Outbox: added ${q.added}, skipped ${q.skipped.length} (already queued/emailed/unsubscribed).`);

  // #2 HubSpot upserts (dedup by domain / email).
  const { upsertCompany } = await import('../../src/lib/hubspot/companies');
  const { upsertContact } = await import('../../src/lib/hubspot/contacts');
  let coCreated = 0;
  let coUpdated = 0;
  const byDomain = new Map<string, Row>();
  for (const r of rows) byDomain.set(r.domain || r.company, r);
  for (const r of byDomain.values()) {
    try {
      await upsertCompany({ name: r.company, domain: r.domain || undefined });
      coUpdated++; // upsertCompany doesn't report which; count as processed
    } catch (e) {
      console.log(`  company upsert failed for ${r.company}: ${(e as Error).message}`);
    }
  }
  let ctProcessed = 0;
  for (const d of stageable) {
    try {
      const [first, ...rest] = d.contactName.split(/\s+/);
      await upsertContact({
        email: d.toEmail,
        firstname: first,
        lastname: rest.join(' ') || undefined,
        jobtitle: d.title || undefined,
        company: d.company,
      });
      ctProcessed++;
    } catch (e) {
      console.log(`  contact upsert failed for ${d.contactName}: ${(e as Error).message}`);
    }
  }
  console.log(`HubSpot: ${coUpdated} companies upserted, ${ctProcessed} contacts upserted.`);
  console.log('\nDone. Drafts are in the Outbox as status=draft for review, ready for one-click committee send.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
