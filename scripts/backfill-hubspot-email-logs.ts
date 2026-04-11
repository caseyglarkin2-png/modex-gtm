#!/usr/bin/env npx tsx
/**
 * backfill-hubspot-email-logs.ts — Push existing EmailLog records to HubSpot.
 * For each EmailLog without hubspot_engagement_id: create HubSpot email object, store ID.
 *
 * Usage:
 *   npx tsx scripts/backfill-hubspot-email-logs.ts --dry-run
 *   npx tsx scripts/backfill-hubspot-email-logs.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`[backfill-hubspot-email-logs] ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  // Dynamically import to use env vars
  const { logSendToHubSpot } = await import('../src/lib/hubspot/emails');
  const { isHubSpotConfigured } = await import('../src/lib/hubspot/client');
  const { HUBSPOT_LOGGING_ENABLED } = await import('../src/lib/feature-flags');

  if (!isHubSpotConfigured()) {
    console.log('HUBSPOT_ACCESS_TOKEN not set. Exiting.');
    return;
  }
  if (!HUBSPOT_LOGGING_ENABLED) {
    console.log('HUBSPOT_LOGGING_ENABLED is false. Exiting.');
    return;
  }

  const logs = await prisma.emailLog.findMany({
    where: { hubspot_engagement_id: null },
    orderBy: { sent_at: 'asc' },
  });

  console.log(`Found ${logs.length} email logs without HubSpot engagement ID.\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const log of logs) {
    if (dryRun) {
      console.log(`[DRY] Would push: ${log.to_email} — ${log.subject.slice(0, 50)}`);
      created++;
      continue;
    }

    try {
      const engagementId = await logSendToHubSpot(log.subject, log.body_html, log.to_email);
      if (engagementId) {
        await prisma.emailLog.update({
          where: { id: log.id },
          data: { hubspot_engagement_id: engagementId },
        });
        created++;
        console.log(`✓ ${log.to_email} → ${engagementId}`);
      } else {
        skipped++;
        console.log(`- ${log.to_email} — skipped (no engagement ID returned)`);
      }
    } catch (err) {
      errors++;
      console.error(`✗ ${log.to_email} — ${err instanceof Error ? err.message : err}`);
    }

    // Rate limit: ~5 per second
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}, Errors: ${errors}`);
  await prisma.$disconnect();
}

main().catch(console.error);
