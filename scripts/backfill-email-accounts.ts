/**
 * backfill-email-accounts.ts
 *
 * Creates Account + Persona records for every company and contact
 * that was reached via the email campaign but not yet in the DB.
 *
 * Safe to run multiple times — uses upsert on unique keys.
 * Run: npx tsx scripts/backfill-email-accounts.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

// ─── Domain → Account mapping ────────────────────────────────────────────────
type AccountMeta = {
  name: string;
  vertical: string;
  parent?: string;
  icp_fit?: number;
  strategic_value?: number;
};

const DOMAIN_MAP: Record<string, AccountMeta> = {
  // Existing 20 accounts (will upsert-skip, safe)
  'genmills.com':     { name: 'General Mills', vertical: 'Food & Beverage', icp_fit: 28 },
  'fritolay.com':     { name: 'Frito-Lay', vertical: 'Food & Beverage', parent: 'PepsiCo', icp_fit: 28 },
  'pepsico.com':      { name: 'Frito-Lay', vertical: 'Food & Beverage', parent: 'PepsiCo', icp_fit: 28 },
  'diageo.com':       { name: 'Diageo', vertical: 'Food & Beverage', icp_fit: 26 },
  'hormel.com':       { name: 'Hormel Foods', vertical: 'Food & Beverage', icp_fit: 26 },
  'hormelfoods.com':  { name: 'Hormel Foods', vertical: 'Food & Beverage', icp_fit: 26 },
  'jmsmucker.com':    { name: 'JM Smucker', vertical: 'Food & Beverage', icp_fit: 26 },
  'homedepot.com':    { name: 'The Home Depot', vertical: 'Retail', icp_fit: 24 },
  'gapac.com':        { name: 'Georgia Pacific', vertical: 'Industrial', parent: 'Koch Industries', icp_fit: 22 },
  'heb.com':          { name: 'H-E-B', vertical: 'Retail', icp_fit: 22 },
  'bn.com':           { name: 'Barnes & Noble', vertical: 'Retail', icp_fit: 18 },
  'barnesandnoble.com': { name: 'Barnes & Noble', vertical: 'Retail', icp_fit: 18 },
  'fedex.com':        { name: 'FedEx', vertical: 'Logistics', icp_fit: 20 },
  'johndeere.com':    { name: 'John Deere', vertical: 'Manufacturing', icp_fit: 18 },
  'hmna.com':         { name: 'Hyundai Motor America', vertical: 'Automotive', icp_fit: 18 },
  'honda.com':        { name: 'Honda', vertical: 'Automotive', icp_fit: 18 },
  'kencogroup.com':   { name: 'Kenco Logistics Services', vertical: 'Logistics', icp_fit: 20 },
  // New accounts from email campaign
  'refresco.com':     { name: 'Refresco', vertical: 'Food & Beverage', icp_fit: 26 },
  'niagarawater.com': { name: 'Niagara Bottling', vertical: 'Food & Beverage', icp_fit: 24 },
  'bluetriton.com':   { name: 'BlueTriton Brands', vertical: 'Food & Beverage', icp_fit: 24 },
  'ardaghgroup.com':  { name: 'Ardagh Group', vertical: 'Packaging', icp_fit: 20 },
  'flocorp.com':      { name: 'Flowers Foods', vertical: 'Food & Beverage', icp_fit: 22 },
  'flowersfoods.com': { name: 'Flowers Foods', vertical: 'Food & Beverage', icp_fit: 22 },
  'berryglobal.com':  { name: 'Berry Global', vertical: 'Packaging', icp_fit: 20 },
  'dfamilk.com':      { name: 'Dairy Farmers of America', vertical: 'Food & Beverage', icp_fit: 24 },
  'vmcmail.com':      { name: 'Vulcan Materials', vertical: 'Industrial', icp_fit: 16 },
  'vulcanmaterials.com': { name: 'Vulcan Materials', vertical: 'Industrial', icp_fit: 16 },
  'treehousefoods.com': { name: 'TreeHouse Foods', vertical: 'Food & Beverage', icp_fit: 22 },
  'graphicpkg.com':   { name: 'Graphic Packaging', vertical: 'Packaging', icp_fit: 18 },
  'mondelezinternational.com': { name: 'Mondelez International', vertical: 'Food & Beverage', icp_fit: 26 },
  'kdrp.com':         { name: 'Keurig Dr Pepper', vertical: 'Food & Beverage', icp_fit: 24 },
  'nucor.com':        { name: 'Nucor', vertical: 'Industrial', icp_fit: 16 },
  'liparifoods.com':  { name: 'Lipari Foods', vertical: 'Food & Beverage', icp_fit: 18 },
  'pfgc.com':         { name: 'Performance Food Group', vertical: 'Logistics', icp_fit: 20 },
  'lpcorp.com':       { name: 'LP Building Solutions', vertical: 'Industrial', icp_fit: 16 },
  'cat.com':          { name: 'Caterpillar', vertical: 'Manufacturing', icp_fit: 18 },
  'cbrands.com':      { name: 'Constellation Brands', vertical: 'Food & Beverage', icp_fit: 22 },
  'ab-inbev.com':     { name: 'AB InBev', vertical: 'Food & Beverage', icp_fit: 24 },
  'campbells.com':    { name: "Campbell's", vertical: 'Food & Beverage', icp_fit: 22 },
  'delmonte.com':     { name: 'Del Monte Foods', vertical: 'Food & Beverage', icp_fit: 20 },
  'dollartree.com':   { name: 'Dollar Tree', vertical: 'Retail', icp_fit: 18 },
  'coca-cola.com':    { name: 'Coca-Cola', vertical: 'Food & Beverage', icp_fit: 26 },
  'ford.com':         { name: 'Ford Motor', vertical: 'Automotive', icp_fit: 18 },
  'toyota.com':       { name: 'Toyota', vertical: 'Automotive', icp_fit: 18 },
  'stellantis.com':   { name: 'Stellantis', vertical: 'Automotive', icp_fit: 16 },
  'eaton.com':        { name: 'Eaton', vertical: 'Manufacturing', icp_fit: 16 },
  'ecolab.com':       { name: 'Ecolab', vertical: 'Industrial', icp_fit: 16 },
  'sonoco.com':       { name: 'Sonoco Products', vertical: 'Packaging', icp_fit: 16 },
  'ingredion.com':    { name: 'Ingredion', vertical: 'Food & Beverage', icp_fit: 18 },
  'mccormick.com':    { name: 'McCormick', vertical: 'Food & Beverage', icp_fit: 18 },
  'bunge.com':        { name: 'Bunge', vertical: 'Food & Beverage', icp_fit: 18 },
  'eastman.com':      { name: 'Eastman Chemical', vertical: 'Industrial', icp_fit: 14 },
  'lowes.com':        { name: "Lowe's", vertical: 'Retail', icp_fit: 20 },
  'bestbuy.com':      { name: 'Best Buy', vertical: 'Retail', icp_fit: 16 },
  'ge.com':           { name: 'GE', vertical: 'Manufacturing', icp_fit: 18 },
  'fmc.com':          { name: 'FMC Corporation', vertical: 'Industrial', icp_fit: 14 },
  'califiafarms.com': { name: 'Califia Farms', vertical: 'Food & Beverage', icp_fit: 16 },
  'darigold.com':     { name: 'Darigold', vertical: 'Food & Beverage', icp_fit: 18 },
  'fairlife.com':     { name: 'Fairlife', vertical: 'Food & Beverage', parent: 'Coca-Cola', icp_fit: 20 },
  'amys.com':         { name: "Amy's Kitchen", vertical: 'Food & Beverage', icp_fit: 14 },
  'anchorglass.com':  { name: 'Anchor Glass', vertical: 'Packaging', icp_fit: 14 },
  'ascendmaterials.com': { name: 'Ascend Materials', vertical: 'Industrial', icp_fit: 14 },
  'b-f.com':          { name: 'Brown-Forman', vertical: 'Food & Beverage', icp_fit: 18 },
  'batoryfoods.com':  { name: 'Batory Foods', vertical: 'Food & Beverage', icp_fit: 14 },
  'celsius.com':      { name: 'Celsius Holdings', vertical: 'Food & Beverage', icp_fit: 14 },
  'championpetfoods.com': { name: 'Champion Petfoods', vertical: 'Food & Beverage', icp_fit: 14 },
  'chg.com':          { name: 'CHG Healthcare', vertical: 'Healthcare', icp_fit: 10 },
  'ferrarausa.com':   { name: 'Ferrara Candy', vertical: 'Food & Beverage', icp_fit: 18 },
  'freshrealm.com':   { name: 'FreshRealm', vertical: 'Food & Beverage', icp_fit: 14 },
  'fsfreshfoods.com': { name: 'FS Fresh Foods', vertical: 'Food & Beverage', icp_fit: 12 },
  'gehlfoods.com':    { name: 'Gehl Foods', vertical: 'Food & Beverage', icp_fit: 14 },
  'georgianut.com':   { name: 'Georgia Nut', vertical: 'Food & Beverage', icp_fit: 12 },
  'idq.com':          { name: 'International Dairy Queen', vertical: 'Food & Beverage', parent: 'Berkshire Hathaway', icp_fit: 16 },
  'egglifefoods.com': { name: 'Egglife Foods', vertical: 'Food & Beverage', icp_fit: 12 },
  'fbgpg.com':        { name: 'Faber-Castell USA', vertical: 'Industrial', icp_fit: 10 },
  'dcsg.com':         { name: 'DCSG', vertical: 'Retail', icp_fit: 16 },
  'dbschenker.com':   { name: 'DB Schenker', vertical: 'Logistics', icp_fit: 20 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function extractName(email: string): { firstName: string; lastName: string; fullName: string } {
  const local = email.split('@')[0];
  // Handle formats: first.last, first_last, firstlast, flast, etc.
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const lastName = parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1);
    return { firstName, lastName, fullName: `${firstName} ${lastName}` };
  }
  const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  return { firstName, lastName: '', fullName: firstName };
}

function computeScore(meta: AccountMeta): number {
  const icpFit = meta.icp_fit ?? 15;
  const modexSignal = 10; // All these accounts received MODEX outreach
  const primoStoryFit = meta.vertical === 'Food & Beverage' ? 14 : 10;
  const warmIntro = 0;
  const strategicValue = meta.strategic_value ?? 6;
  const meetingEase = 3;
  return icpFit + modexSignal + primoStoryFit + warmIntro + strategicValue + meetingEase;
}

function scoreToBand(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  return 'D';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const csvPath = path.join(process.cwd(), 'emails-sent-1774719075246.csv');
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true }) as Array<{
    to: string; subject: string; last_event: string; sent_at: string;
  }>;

  const TEST_EMAILS = new Set([
    'casey@freightroll.com', 'casey@yardflow.ai', 'caseyglarkin2@gmail.com',
    'jake@freightroll.com', 'jake@yardflow.ai',
  ]);

  // Build deduplicated account → emails map
  const accountContacts = new Map<string, { meta: AccountMeta; emails: Map<string, { subject: string; status: string }> }>();

  for (const row of rows) {
    const email = row.to.trim().toLowerCase();
    if (!email || TEST_EMAILS.has(email) || !email.includes('@')) continue;
    const domain = email.split('@')[1];
    if (domain === 'test.com') continue;

    const meta = DOMAIN_MAP[domain];
    if (!meta) {
      console.warn(`[SKIP] Unknown domain: ${domain} (${email})`);
      continue;
    }

    if (!accountContacts.has(meta.name)) {
      accountContacts.set(meta.name, { meta, emails: new Map() });
    }
    const entry = accountContacts.get(meta.name)!;
    // Keep latest status per email (upsert logic)
    if (!entry.emails.has(email) || row.last_event === 'opened' || row.last_event === 'clicked') {
      entry.emails.set(email, { subject: row.subject, status: row.last_event ?? 'unknown' });
    }
  }

  console.log(`\nBackfilling ${accountContacts.size} accounts with ${Array.from(accountContacts.values()).reduce((s, v) => s + v.emails.size, 0)} unique contacts...\n`);

  // Get existing accounts to compute correct rank for new ones
  const existingCount = await prisma.account.count();
  let rankCounter = existingCount + 1;

  let accountsCreated = 0;
  let accountsSkipped = 0;
  let personasCreated = 0;
  let personasSkipped = 0;

  for (const [accountName, { meta, emails }] of accountContacts.entries()) {
    const score = computeScore(meta);
    const band = scoreToBand(score);
    const slug = toSlug(accountName);

    // Upsert account — skip fields that already exist for existing accounts
    const existing = await prisma.account.findUnique({ where: { name: accountName } });

    if (!existing) {
      await prisma.account.create({
        data: {
          rank: rankCounter++,
          name: accountName,
          parent_brand: meta.parent ?? null,
          vertical: meta.vertical,
          icp_fit: meta.icp_fit ?? 15,
          modex_signal: 10,
          primo_story_fit: meta.vertical === 'Food & Beverage' ? 14 : 10,
          warm_intro: 0,
          strategic_value: meta.strategic_value ?? 6,
          meeting_ease: 3,
          priority_score: score,
          priority_band: band,
          tier: score >= 80 ? 'Tier 1' : score >= 70 ? 'Tier 2' : 'Tier 3',
          outreach_status: 'Contacted',
          research_status: 'Not started',
          meeting_status: 'No meeting',
          owner: 'Casey',
          source: 'email-campaign-backfill',
        },
      });
      accountsCreated++;
      console.log(`  [+] Account: ${accountName} (${band}, score ${score})`);
    } else {
      // Update outreach_status to Contacted if we emailed them
      if (existing.outreach_status === 'Not started') {
        await prisma.account.update({
          where: { name: accountName },
          data: { outreach_status: 'Contacted' },
        });
      }
      accountsSkipped++;
    }

    // Upsert personas for each unique email
    for (const [email, { subject, status }] of emails.entries()) {
      const { firstName, lastName, fullName } = extractName(email);
      const domain = email.split('@')[1];
      const personaId = `${slug}-${email.split('@')[0]}`;

      // Determine email_status from Resend event
      const emailStatus = status === 'bounced' ? 'bounced' :
                          status === 'opened' || status === 'clicked' ? 'verified' :
                          status === 'delivered' ? 'verified' : 'unverified';

      try {
        await prisma.persona.upsert({
          where: { account_name_email: { account_name: accountName, email } },
          create: {
            persona_id: personaId,
            account_name: accountName,
            name: fullName,
            first_name: firstName,
            last_name: lastName || null,
            normalized_name: fullName.toLowerCase(),
            email,
            email_status: emailStatus,
            email_confidence: emailStatus === 'verified' ? 90 : emailStatus === 'bounced' ? 0 : 60,
            company_domain: domain,
            priority: score >= 80 ? 'P1' : score >= 70 ? 'P2' : 'P3',
            seniority: 'Unknown',
            persona_status: 'Found',
            do_not_contact: status === 'bounced',
            is_contact_ready: status !== 'bounced',
            source_type: 'email-campaign-backfill',
            notes: `Outreach: "${subject.slice(0, 80)}" — ${status}`,
            account_score: score,
            quality_score: emailStatus === 'verified' ? 75 : emailStatus === 'bounced' ? 10 : 55,
            quality_band: emailStatus === 'verified' ? 'B' : 'D',
            contact_standard_version: '2026-03-29',
          },
          update: {
            // If we have better data (opened > delivered > unknown), update status
            email_status: emailStatus === 'verified' || emailStatus === 'bounced' ? emailStatus : undefined as never,
            do_not_contact: status === 'bounced' ? true : undefined as never,
            updated_at: new Date(),
          },
        });
        personasCreated++;
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('Unique constraint')) {
          personasSkipped++;
        } else {
          console.warn(`  [WARN] Persona upsert failed for ${email}:`, err instanceof Error ? err.message : err);
          personasSkipped++;
        }
      }
    }
  }

  const totalAccounts = await prisma.account.count();
  const totalPersonas = await prisma.persona.count();

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BACKFILL COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Accounts created:  ${accountsCreated}
Accounts updated:  ${accountsSkipped} (existing, outreach status synced)
Personas created:  ${personasCreated}
Personas skipped:  ${personasSkipped} (already existed)

DB totals after:
  Accounts: ${totalAccounts}
  Personas: ${totalPersonas}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
