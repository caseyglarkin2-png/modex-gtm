/**
 * Backfill GeneratedContent from EmailLog
 *
 * Purpose: Migrate historical email logs to the new GeneratedContent tracking system.
 * - Creates GeneratedContent records from EmailLog entries
 * - Links EmailLog.generated_content_id back to the created record
 * - Only processes email logs without an existing generated_content_id
 *
 * Usage:
 *   npx tsx scripts/backfill-generated-content.ts [--dry-run] [--limit N]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Args {
  dryRun: boolean;
  limit?: number;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1] ?? '0', 10) : undefined,
  };
}

async function main() {
  const args = parseArgs();

  console.log('🔍 Starting GeneratedContent backfill...');
  console.log(`Mode: ${args.dryRun ? 'DRY RUN (no writes)' : 'LIVE (will write to database)'}`);
  if (args.limit) console.log(`Limit: ${args.limit} records`);

  // Find all email logs without a generated_content_id
  const emailLogs = await prisma.emailLog.findMany({
    where: {
      generated_content_id: null,
    },
    orderBy: {
      sent_at: 'asc',
    },
    take: args.limit,
  });

  console.log(`\n📊 Found ${emailLogs.length} email logs to backfill\n`);

  if (emailLogs.length === 0) {
    console.log('✅ Nothing to backfill. All email logs are already linked.');
    return;
  }

  let created = 0;
  let linked = 0;
  let errors = 0;

  for (const log of emailLogs) {
    try {
      if (args.dryRun) {
        console.log(`[DRY RUN] Would create GeneratedContent for email log ${log.id}:`);
        console.log(`  Account: ${log.account_name}`);
        console.log(`  Persona: ${log.persona_name ?? 'N/A'}`);
        console.log(`  Subject: ${log.subject.slice(0, 60)}...`);
        console.log(`  Sent: ${log.sent_at.toISOString()}`);
        created++;
      } else {
        // Create GeneratedContent record
        const generatedContent = await prisma.generatedContent.create({
          data: {
            account_name: log.account_name,
            persona_name: log.persona_name,
            content_type: 'email',
            content: `Subject: ${log.subject}\n\n${log.body_html}`,
            created_at: log.sent_at, // Preserve original timestamp
          },
        });

        // Link EmailLog to GeneratedContent
        await prisma.emailLog.update({
          where: { id: log.id },
          data: { generated_content_id: generatedContent.id },
        });

        created++;
        linked++;

        if (created % 10 === 0) {
          console.log(`Progress: ${created}/${emailLogs.length} processed...`);
        }
      }
    } catch (err) {
      errors++;
      console.error(`❌ Error processing email log ${log.id}:`, err);
    }
  }

  console.log('\n✅ Backfill complete!\n');
  console.log(`📈 Summary:`);
  console.log(`  - GeneratedContent records created: ${created}`);
  console.log(`  - EmailLog entries linked: ${linked}`);
  console.log(`  - Errors: ${errors}`);

  if (args.dryRun) {
    console.log('\n⚠️  This was a dry run. No changes were made to the database.');
    console.log('Run without --dry-run to apply changes.');
  }
}

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
