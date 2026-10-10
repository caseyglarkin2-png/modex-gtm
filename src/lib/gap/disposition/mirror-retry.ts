/**
 * THE DISPOSITION MIRROR, RETRIED (the DONE unification, 2026-10-10). Server only; called by the GAP mailbox cron after
 * the commands of the tick (src/app/api/cron/gap-mailbox/route.ts).
 *
 * A completion DONE on a reply whose HubSpot mirror FAILED is applied with `receipt: 'recorded_not_mirrored'`, the
 * reason and `retryable: true` (replies/commands-apply.ts). This pass re-attempts the mirror for those rows, bounded:
 *   - at most MIRROR_RETRY_MAX attempts per disposition (each attempt is one `disposition.mirror_retry` ledger row with
 *     its number, its receipt and its reason); after the last the row stays visible as recorded_not_mirrored
 *   - at most `limit` dispositions per tick
 *   - the mirror is the one used by Capture (hubspot-mirror.ts mirrorDisposition), idempotent by `gap:disp:<id>`: a note
 *     that landed before is reused, never posted twice; `written` or `skipped:already_mirrored` ends the row `mirrored`
 *   - a skip by policy (the mirror off, no contact) is recorded with its reason and counts as an attempt
 *   - R5 review (finding 4): overlapping ticks never post twice: the mirror claims the key before posting
 *     (hubspot-mirror.ts MIRROR_IN_FLIGHT); a pass that finds it claimed (`skipped:in_flight`) records no attempt and
 *     counts nothing (the claiming pass's attempt is the attempt)
 * The ledger is append-only: a retry adds rows, it never edits the applied row. Nothing here sends or enrolls.
 * R5 review (finding 5b): the receipts are read from the applied rows AND from the DONE receipts written the moment the
 * disposition was recorded (commands-apply.ts DONE_RECEIPT), so a DONE whose later step threw still has its mirror retried.
 */
import { dispositionMirrorKey, mirrorDisposition as defaultMirror } from '../hubspot-mirror';
import { mirrorReceiptOf } from '../replies/done-reply';
import { COMMAND_APPLIED, DONE_RECEIPT } from '../replies/commands-apply';
import { dispositionMirrorSummary, type DispositionProvenance } from './service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const MIRROR_RETRY = 'disposition.mirror_retry' as const;
export const MIRROR_RETRY_MAX = 3;
export const MIRROR_RETRY_LIMIT = 10;
/** The applied rows read per pass (newest first). */
const APPLIED_SCAN = 200;

export interface MirrorRetryReport {
  tried: number;
  mirrored: number;
  failed: number;
  /** Dispositions that used their last attempt and stay recorded_not_mirrored. */
  exhausted: string[];
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export async function retryDispositionMirrors(
  prisma: PrismaLike,
  opts: { now: Date; limit?: number; actor?: string },
  deps: { mirror?: typeof defaultMirror } = {},
): Promise<MirrorRetryReport> {
  const report: MirrorRetryReport = { tried: 0, mirrored: 0, failed: 0, exhausted: [] };
  const limit = Math.max(0, Math.floor(opts.limit ?? MIRROR_RETRY_LIMIT));
  if (!limit || typeof prisma?.gapAuditEvent?.findMany !== 'function') return report;
  const applied: Array<{ payload: unknown }> = await prisma.gapAuditEvent.findMany({
    where: { kind: { in: [COMMAND_APPLIED, DONE_RECEIPT] }, payload: { path: ['receipt'], equals: 'recorded_not_mirrored' } },
    orderBy: [{ created_at: 'desc' }],
    take: APPLIED_SCAN,
    select: { payload: true },
  });
  const ids: string[] = [];
  for (const row of applied) {
    const p = isObj(row.payload) ? row.payload : {};
    const id = typeof p.dispositionId === 'string' ? p.dispositionId : null;
    if (p.receipt === 'recorded_not_mirrored' && p.retryable === true && id && !ids.includes(id)) ids.push(id);
  }
  if (!ids.length) return report;
  const attempts: Array<{ subject_id: string; payload: unknown }> = await prisma.gapAuditEvent.findMany({
    where: { kind: MIRROR_RETRY, subject_type: 'disposition', subject_id: { in: ids } },
    select: { subject_id: true, payload: true },
  });
  const mirror = deps.mirror ?? defaultMirror;
  for (const id of ids) {
    if (report.tried >= limit) break;
    const mine = attempts.filter((a) => a.subject_id === id).map((a) => (isObj(a.payload) ? a.payload : {}));
    if (mine.some((a) => a.receipt === 'mirrored')) continue;
    if (mine.length >= MIRROR_RETRY_MAX) {
      report.exhausted.push(id);
      continue;
    }
    const d: { id: string; hypothesis_id: string | null; account_name: string; hubspot_contact_id: string | null; response_class: string; channel: string; confirmed_at: Date | string | null; created_at: Date | string; metadata: unknown; human_confirmed: boolean } | null =
      await prisma.conversationDisposition.findUnique({
        where: { id },
        select: { id: true, hypothesis_id: true, account_name: true, hubspot_contact_id: true, response_class: true, channel: true, confirmed_at: true, created_at: true, metadata: true, human_confirmed: true },
      });
    if (!d || !d.human_confirmed) continue;
    const title: string | null = d.hypothesis_id && typeof prisma?.prospectingHypothesis?.findUnique === 'function'
      ? ((await prisma.prospectingHypothesis.findUnique({ where: { id: d.hypothesis_id }, select: { problem_family: true } }).catch(() => null))?.problem_family ?? null)
      : null;
    const provenance = isObj(d.metadata) && isObj(d.metadata.provenance) ? (d.metadata.provenance as unknown as DispositionProvenance) : null;
    report.tried += 1;
    let status: string;
    try {
      const r = await mirror(prisma, {
        dispositionId: d.id,
        hubspotContactId: d.hubspot_contact_id,
        responseClass: d.response_class,
        confirmedAt: new Date(d.confirmed_at ?? d.created_at),
        hypothesisId: d.hypothesis_id,
        accountName: d.account_name,
        summary: dispositionMirrorSummary({ responseClass: d.response_class, channel: d.channel, provenance }),
        channel: d.channel,
        ...(title ? { hypothesisTitle: title } : {}),
      });
      status = r.status;
    } catch (err) {
      status = `error:${err instanceof Error ? err.message : String(err)}`;
    }
    if (status === 'skipped:in_flight') {
      report.tried -= 1;
      continue;
    }
    const receipt = mirrorReceiptOf(status);
    const attempt = mine.length + 1;
    if (receipt.receipt === 'mirrored') report.mirrored += 1;
    else {
      report.failed += 1;
      if (attempt >= MIRROR_RETRY_MAX) report.exhausted.push(id);
    }
    await prisma.gapAuditEvent.create({
      data: {
        kind: MIRROR_RETRY,
        actor: opts.actor ?? 'cron:gap-mailbox',
        subject_type: 'disposition',
        subject_id: id,
        payload: { attempt, of: MIRROR_RETRY_MAX, status, ...(receipt.receipt === 'mirrored' ? { receipt: 'mirrored' } : { receipt: 'recorded_not_mirrored', reason: receipt.reason }), at: opts.now.toISOString() },
      },
    });
  }
  return report;
}

/**
 * R5 review (finding 5a): the dispositions awaiting a HubSpot mirror, read the way the retry pass reads them (the
 * retryable recorded_not_mirrored receipts on the applied rows and the DONE receipts), less those mirrored since (a
 * mirrored attempt, or the mirror row holding the note), and how many of them used every attempt. A skip by policy
 * (the mirror off, no contact) is not awaiting a mirror. Read by health (health/load.ts); bounded like the pass.
 */
export async function loadMirrorBacklog(prisma: PrismaLike): Promise<{ awaiting: number; exhausted: number }> {
  const rows: Array<{ payload: unknown }> = await prisma.gapAuditEvent.findMany({
    where: { kind: { in: [COMMAND_APPLIED, DONE_RECEIPT] }, payload: { path: ['receipt'], equals: 'recorded_not_mirrored' } },
    orderBy: [{ created_at: 'desc' }],
    take: APPLIED_SCAN,
    select: { payload: true },
  });
  const ids = [...new Set(rows.map((r) => (isObj(r.payload) ? r.payload : {})).filter((p) => p.receipt === 'recorded_not_mirrored' && p.retryable === true && typeof p.dispositionId === 'string').map((p) => String(p.dispositionId)))];
  if (!ids.length) return { awaiting: 0, exhausted: 0 };
  const attempts: Array<{ subject_id: string; payload: unknown }> = await prisma.gapAuditEvent.findMany({
    where: { kind: MIRROR_RETRY, subject_type: 'disposition', subject_id: { in: ids } },
    select: { subject_id: true, payload: true },
  });
  const landed: Array<{ key: string; error: string | null }> = typeof prisma?.gapHubSpotMirror?.findMany === 'function'
    ? await prisma.gapHubSpotMirror.findMany({ where: { key: { in: ids.map(dispositionMirrorKey) } }, select: { key: true, error: true } })
    : [];
  const mirrored = new Set(landed.filter((m) => m.error === null).map((m) => m.key));
  let awaiting = 0;
  let exhausted = 0;
  for (const id of ids) {
    const mine = attempts.filter((a) => a.subject_id === id).map((a) => (isObj(a.payload) ? a.payload : {}));
    if (mine.some((a) => a.receipt === 'mirrored') || mirrored.has(dispositionMirrorKey(id))) continue;
    awaiting += 1;
    if (mine.length >= MIRROR_RETRY_MAX) exhausted += 1;
  }
  return { awaiting, exhausted };
}

/**
 * R5 review (finding 5a): the retry pass's verdict for the mailbox cron's own result: never a clean ok while a
 * disposition has used every attempt, or when the pass itself failed. The line goes into the cron's status message.
 */
export function mirrorRetryVerdict(r: MirrorRetryReport | { error: string }): { ok: boolean; line: string | null } {
  if ('error' in r) return { ok: false, line: `the HubSpot mirror retry failed (${r.error.slice(0, 200)})` };
  if (r.exhausted.length) return { ok: false, line: `${r.exhausted.length} disposition(s) exhausted the HubSpot mirror retries` };
  return { ok: true, line: null };
}
