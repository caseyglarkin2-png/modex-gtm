/**
 * RECONCILE THE OCTOBER 9 ROWS (seller acceptance follow-up, 2026-10-09). DRY RUN BY DEFAULT; applies nothing
 * without BOTH `--apply` and GAP_RECONCILE_APPLY=yes in the environment, and never against a database whose host is
 * not the one named in GAP_RECONCILE_HOST (so a copied command cannot hit production by accident).
 *
 *   npx tsx scripts/gap/reconcile-october9.ts            (dry run: prints what it WOULD write, writes nothing)
 *   npx tsx scripts/gap/reconcile-october9.ts --apply    (with GAP_RECONCILE_APPLY=yes and GAP_RECONCILE_HOST=<host>)
 *
 * What it reconciles, each as an APPEND-ONLY ledger row (history is never edited):
 *   1. The Southern Glazer's reminder (reply:ooo:diego.fonseca@sgws.com:2026-05-26) was closed by "DONE: researching
 *      catalysts" at 2026-10-09T12:30:51Z. The note reads as progress (work/done-note.ts), so the close is reversed:
 *      an `account.commitment` status row returns it to its pre-DONE status (snoozed until 2026-05-26, which the day
 *      builder now reads as availability, never as a due item), with the reason and the message id on the row, and a
 *      `work.command_applied` row with effect `progress_noted` records the note as progress on the same item.
 *   2. Nothing is written for Kenco: the pursued person is placed at read time by the identity machinery (builder C),
 *      and the superseded angle tasks stay as history.
 * It refuses to run twice (the reversal row is found and the script says so).
 */
import { PrismaClient } from '@prisma/client';
import { readDoneNote } from '../../src/lib/gap/work/done-note';

const COMMITMENT_ID = 'reply:ooo:diego.fonseca@sgws.com:2026-05-26';
const ACCOUNT = "Southern Glazer's Wine & Spirits";
const DONE_MESSAGE_ID = '1a1209eed855f272';
const REVERSAL_MARK = 'reconcile-october9:progress-not-done';

async function main() {
  const apply = process.argv.includes('--apply');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const url = new URL(process.env.DATABASE_URL);
  if (apply) {
    if (process.env.GAP_RECONCILE_APPLY !== 'yes') throw new Error('--apply needs GAP_RECONCILE_APPLY=yes');
    if (!process.env.GAP_RECONCILE_HOST || url.hostname !== process.env.GAP_RECONCILE_HOST) throw new Error('--apply needs GAP_RECONCILE_HOST equal to the database host');
  }
  url.searchParams.set('connection_limit', '1');
  const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  try {
    const rows: Array<{ id: string; kind: string; actor: string; created_at: Date; payload: Record<string, unknown> | null }> = await prisma.gapAuditEvent.findMany({
      where: { OR: [{ kind: 'account.commitment', subject_type: 'account', subject_id: ACCOUNT }, { kind: 'work.command_applied', subject_type: 'work_item', subject_id: `commitment:${COMMITMENT_ID}` }] },
      orderBy: [{ created_at: 'asc' }],
    });
    const mine = rows.filter((r) => r.kind === 'account.commitment' && ((r.payload?.commitment as { commitmentId?: string } | undefined)?.commitmentId === COMMITMENT_ID));
    const already = mine.find((r) => (r.payload as { reason?: string } | null)?.reason === REVERSAL_MARK);
    if (already) { console.log(`already reconciled at ${already.created_at.toISOString()} (${already.id}); nothing to do`); return; }
    const done = [...mine].reverse().find((r) => (r.payload?.op === 'status') && ((r.payload?.commitment as { status?: string } | undefined)?.status === 'done'));
    if (!done) { console.log('no done row found for the commitment; nothing to reconcile'); return; }
    const c = done.payload?.commitment as Record<string, unknown>;
    const note = String((c.proof as { note?: string } | undefined)?.note ?? '');
    const reading = readDoneNote(note);
    console.log(`done row ${done.id} at ${done.created_at.toISOString()} by ${done.actor}; note reads as ${reading.kind}${reading.kind === 'progress' ? ` (cue "${reading.cue}")` : ''}`);
    if (reading.kind !== 'progress') { console.log('the note is a completion; nothing to reverse'); return; }
    const before = [...mine].reverse().find((r) => r.created_at < done.created_at && r.payload?.op === 'status' && (r.payload?.commitment as { status?: string } | undefined)?.status !== 'done') ?? mine[0];
    const prior = (before?.payload?.commitment ?? c) as Record<string, unknown>;
    const restored = { ...c, status: prior.status ?? 'snoozed', proof: null, snoozeUntil: prior.snoozeUntil ?? c.dueAt ?? null, dueAt: prior.dueAt ?? c.dueAt ?? null, updatedAt: new Date().toISOString() };
    const reversal = { op: 'status', commitment: restored, reason: REVERSAL_MARK, reverses: done.id, note: `"${note.split('\n')[0]}" read as work in progress, not a completed follow-up (seller acceptance follow-up, 2026-10-09); the item returns to its state before the DONE`, gmailMessageId: DONE_MESSAGE_ID };
    const progress = { command: 'done', effect: 'progress_noted', basis: 'self_reported', note: note.split('\n')[0], cue: reading.cue, revision: 0, commitmentId: COMMITMENT_ID, gmailMessageId: DONE_MESSAGE_ID, from: done.actor, at: done.created_at.toISOString(), reconciledBy: REVERSAL_MARK };
    console.log('WOULD WRITE 1:', JSON.stringify({ kind: 'account.commitment', actor: 'gap:reconcile', subject_type: 'account', subject_id: ACCOUNT, payload: reversal }).slice(0, 600));
    console.log('WOULD WRITE 2:', JSON.stringify({ kind: 'work.command_applied', actor: done.actor, subject_type: 'work_item', subject_id: `commitment:${COMMITMENT_ID}`, payload: progress }).slice(0, 600));
    if (!apply) { console.log('dry run: nothing written'); return; }
    await prisma.gapAuditEvent.create({ data: { kind: 'account.commitment', actor: 'gap:reconcile', subject_type: 'account', subject_id: ACCOUNT, payload: reversal } });
    await prisma.gapAuditEvent.create({ data: { kind: 'work.command_applied', actor: done.actor, subject_type: 'work_item', subject_id: `commitment:${COMMITMENT_ID}`, payload: progress } });
    console.log('applied: 2 rows written');
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });
