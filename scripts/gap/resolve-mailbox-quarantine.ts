/**
 * Ops closeout 13A: close a quarantined GAP mailbox message after a human has
 * read it in Gmail (casey@yardflow.ai) and acted on whatever it said.
 *
 *   npx tsx scripts/gap/resolve-mailbox-quarantine.ts                         list the unresolved ones
 *   npx tsx scripts/gap/resolve-mailbox-quarantine.ts <gmailMessageId> "<note>" --actor <email>
 *
 * The mailbox cron retries every unresolved quarantine each run and stays in
 * error while any is unresolved; this (or a successful retry) is the only way
 * one stops being reported. It writes one mailbox.quarantine_resolved audit
 * row and nothing else: no consent, bounce or reply truth is inferred from it.
 */
import { PrismaClient } from '@prisma/client';
import { resolveQuarantine } from '../../src/lib/gap/replies/gap-mailbox';

async function main() {
  const [id, note] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const actorIdx = process.argv.indexOf('--actor');
  const actor = actorIdx > 0 ? process.argv[actorIdx + 1] : undefined;
  const prisma = new PrismaClient();
  try {
    if (!id) {
      const q = await prisma.gapAuditEvent.findMany({ where: { subject_type: 'gmail_message', kind: 'mailbox.quarantined' }, select: { subject_id: true, payload: true, created_at: true } });
      const done = new Set((await prisma.gapAuditEvent.findMany({ where: { subject_type: 'gmail_message', kind: 'mailbox.quarantine_resolved' }, select: { subject_id: true } })).map((r) => r.subject_id));
      const open = q.filter((r) => !done.has(r.subject_id));
      console.log(open.length === 0 ? 'No unresolved quarantined mailbox messages.' : open.map((r) => `${r.subject_id}  quarantined ${r.created_at.toISOString()}  ${JSON.stringify((r.payload as { lastError?: string } | null)?.lastError ?? '')}`).join('\n'));
      return;
    }
    if (!note || !actor || !actor.includes('@')) throw new Error('usage: <gmailMessageId> "<what you did>" --actor <your email>');
    await resolveQuarantine(prisma, id, actor, note);
    console.log(`Resolved ${id}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
