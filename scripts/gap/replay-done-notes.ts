/**
 * REPLAY THE FACTS OF A DONE NOTE RECORDED BEFORE THE FACT READER EXISTED (the morning audit of October 10). DRY RUN BY DEFAULT.
 *
 *   npx tsx scripts/gap/replay-done-notes.ts [--since 2026-10-09] [--account Kenco]           (prints what would be recorded)
 *   npx tsx scripts/gap/replay-done-notes.ts --apply   (needs GAP_RECONCILE_APPLY=yes and GAP_RECONCILE_HOST=<db host>)
 *
 * Casey's DONE on Kenco at 17:00Z on October 9 ("we have meeting scheduled for 10.14.2026. sent them a quick note
 * today ...") was recorded as `account_logged` with the note alone: the fact reader (knowledge program C3, deployed
 * 17:43Z the same day) did not exist yet, so the October 14 meeting never became a prepare_meeting commitment and the
 * sent note never became a claim. This replays every `work.command_applied` DONE row since `--since` whose payload has
 * no `meetings` and no `claims`: the note is read with the clock of the row (the dates it names resolve as they did
 * that day), the meeting goes through the same writer the command uses (`commitmentsFromSellerNote`, one per day,
 * idempotent), and one `work.done_facts_replayed` ledger row records what was added with the original row's id. The
 * original row is never edited. No mail, no HubSpot.
 */
import { PrismaClient } from '@prisma/client';
import { doneNoteFacts, sellerWordsOf, type DoneFact } from '../../src/lib/gap/work/done-note';
import { commitmentsFromSellerNote } from '../../src/lib/gap/work/commitments';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null; };
const APPLY = process.argv.includes('--apply');
const SINCE = new Date(`${arg('--since') ?? '2026-10-09'}T00:00:00Z`);
const ACCOUNT = arg('--account');
const REPLAYED = 'work.done_facts_replayed';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const host = new URL(process.env.DATABASE_URL).hostname;
  if (APPLY && (process.env.GAP_RECONCILE_APPLY !== 'yes' || process.env.GAP_RECONCILE_HOST !== host)) throw new Error('--apply needs GAP_RECONCILE_APPLY=yes and GAP_RECONCILE_HOST equal to the database host');
  const prisma = new PrismaClient();
  try {
    const rows: Array<{ id: string; created_at: Date; subject_id: string; payload: Record<string, unknown> | null }> = await prisma.gapAuditEvent.findMany({ where: { kind: 'work.command_applied', created_at: { gte: SINCE } }, orderBy: { created_at: 'asc' }, select: { id: true, created_at: true, subject_id: true, payload: true } });
    const done = rows.filter((r) => { const p = r.payload ?? {}; return p.command === 'done' && (p.effect === 'account_logged' || p.effect === 'commitment_done') && !p.meetings && !p.claims && typeof p.note === 'string'; });
    const already = new Set(((await prisma.gapAuditEvent.findMany({ where: { kind: REPLAYED }, select: { payload: true } })) as Array<{ payload: Record<string, unknown> | null }>).map((r) => String(r.payload?.originalId ?? '')));
    let planned = 0;
    for (const r of done) {
      const p = r.payload ?? {};
      const accountName = r.subject_id.split(':')[1] ?? '';
      if (ACCOUNT && accountName.toLowerCase() !== ACCOUNT.toLowerCase()) continue;
      if (already.has(r.id)) { console.log(`skip ${r.id} (${accountName}): already replayed`); continue; }
      const words = sellerWordsOf(String(p.note));
      const facts: DoneFact[] = doneNoteFacts(words, r.created_at);
      if (!facts.length) { console.log(`skip ${r.id} (${accountName}): the note states no dated meeting or sent note`); continue; }
      planned += 1;
      console.log(`${APPLY ? 'APPLY' : 'PLAN'} ${r.id} ${r.created_at.toISOString()} ${accountName}: ${facts.map((f) => (f.kind === 'meeting' ? `meeting ${f.day}` : `sent note to ${f.who ?? 'them'} ${f.when ?? ''}`)).join('; ')}`);
      if (!APPLY) continue;
      const claims = facts.filter((f): f is Extract<DoneFact, { kind: 'sent' }> => f.kind === 'sent').map((f) => ({ kind: 'sent' as const, who: f.who, when: f.when, channel: f.channel, words: f.words }));
      const meetings = facts.some((f) => f.kind === 'meeting')
        ? (await commitmentsFromSellerNote(prisma, { accountName, facts, note: words, gmailMessageId: String(p.gmailMessageId ?? r.id), person: null, dealId: null, actor: 'replay-done-notes', now: r.created_at })).meetings
        : [];
      await prisma.gapAuditEvent.create({ data: { kind: REPLAYED, actor: 'replay-done-notes', subject_type: 'work_item', subject_id: r.subject_id, payload: { originalId: r.id, originalAt: r.created_at.toISOString(), accountName, meetings, claims, note: words.slice(0, 500) } } });
      console.log(`  recorded: ${meetings.map((m) => `${m.title} (${m.day}, ${m.created ? 'created' : 'existed'})`).join('; ') || 'no meeting'}; ${claims.length} claim${claims.length === 1 ? '' : 's'}`);
    }
    console.log(`${planned} row${planned === 1 ? '' : 's'} ${APPLY ? 'replayed' : 'would be replayed'}; ${APPLY ? '' : 'dry run: nothing written'}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });
