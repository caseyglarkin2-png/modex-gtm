/**
 * One-shot backfill — links historical sent emails to their Gmail thread.
 *
 * EmailLog.thread_id was added before it was ever written, so pre-existing
 * rows have no thread. This resolves each row's provider_message_id to a
 * Gmail threadId, stamps EmailLog.thread_id, and ensures an EmailThread
 * row exists — so old conversations show up in the in-app inbox.
 *
 * Run once, after the inbox migration (`npm run db:push`):
 *   npx tsx scripts/backfill-thread-linkage.ts
 *
 * Requires GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN
 * and DATABASE_URL in the environment.
 */
import { prisma } from '../src/lib/prisma';
import { getMessageThreadId } from '../src/lib/email/gmail-inbox';

async function main() {
  const rows = await prisma.emailLog.findMany({
    where: { thread_id: null, provider_message_id: { not: null } },
    select: {
      id: true,
      provider_message_id: true,
      account_name: true,
      subject: true,
      sent_at: true,
    },
    orderBy: { sent_at: 'asc' },
  });

  console.log(`Backfilling thread linkage for ${rows.length} email log(s)...`);

  let linked = 0;
  let skipped = 0;
  const ensuredThreads = new Set<string>();

  for (const row of rows) {
    try {
      const threadId = await getMessageThreadId(row.provider_message_id as string);
      if (!threadId) {
        skipped++;
        continue;
      }

      await prisma.emailLog.update({
        where: { id: row.id },
        data: { thread_id: threadId },
      });

      if (!ensuredThreads.has(threadId)) {
        ensuredThreads.add(threadId);
        await prisma.emailThread.upsert({
          where: { id: threadId },
          create: {
            id: threadId,
            account_name: row.account_name,
            subject: row.subject,
            last_message_at: row.sent_at,
          },
          update: {},
        });
      }

      linked++;
      if (linked % 25 === 0) console.log(`  ...${linked} linked`);
    } catch (error) {
      skipped++;
      console.error(
        `  failed for email log ${row.id}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.log(
    `Done. Linked ${linked}, skipped ${skipped}, ${ensuredThreads.size} thread(s) ensured.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
