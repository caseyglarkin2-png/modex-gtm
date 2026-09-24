/**
 * GAP compile approval path (Sprint 3, S3-T9). Spec section 8.
 *
 * A `review_required` compile asks a human through the EXISTING approval
 * surface: one `SendApprovalRequest` row, in the shape its writer
 * (src/lib/revops/send-approvals.ts) and its consumers (src/app/queue/page.tsx
 * work-queue card, src/app/ops/page.tsx pending count, and the resolver
 * PATCH src/app/api/revops/send-approvals/route.ts) already read. Nothing
 * here approves anything; only the resolver moves `status`.
 *
 * Field mapping (the model has no metadata or JSON column):
 *   send_job_id    null                        no SendJob exists yet
 *   channel        'gap_compile'               the queue card prints "Send approval (gap_compile)"
 *   account_name   the account when known      queue card + index
 *   risk_score     30 + 10 per review check    spec section 8
 *   risk_reasons   ['gap_compile:<id>', ...review check codes,
 *                   'hypothesis:<id>'?, 'draft_queue_item:<n>'?]
 *                  The first entry is the lookup key: a String[] survives the
 *                  resolver's PATCH (which only touches status, approved_by,
 *                  comment, resolved_at), so idempotency and `isApproved` key
 *                  on it with `risk_reasons: { has: ... }`.
 *   status         'pending'
 *   requested_by   the compiling actor
 *   comment        the human reason (the queue card's preview line)
 *   sla_due_at     now + 24 h                  spec section 8
 * The request id is written back onto the GapCompile row as
 * `result.approval_request_id` (merged into the existing result JSON).
 *
 * Idempotent: an open (pending) request for the same compile id is returned
 * with `existing: true`, never duplicated. House `prisma: any` glue.
 */

export const APPROVAL_CHANNEL = 'gap_compile';
export const APPROVAL_BASE_RISK = 30;
export const APPROVAL_RISK_PER_REVIEW = 10;
export const APPROVAL_SLA_HOURS = 24;

const REASON_PREFIX = 'gap_compile:';

/** The risk_reasons entry that ties a request to its compile. */
export function compileReasonTag(compileId: string): string {
  return `${REASON_PREFIX}${compileId}`;
}

export interface RequestApprovalInput {
  compileId: string;
  draftQueueItemId?: number | null;
  hypothesisId?: string | null;
  accountName?: string | null;
  /** Human reason; lands in `comment`, the queue card's preview line. */
  reason: string;
  /** Codes of the review-severity checks that failed; each adds to the risk score. */
  reviewCodes?: readonly string[];
  requestedBy: string;
  now: Date;
}

export type RequestApprovalResult =
  | { ok: true; id: string; existing: boolean; status: string }
  | { ok: false; reason: 'compile_not_found' };

export async function requestApproval(prisma: any, input: RequestApprovalInput): Promise<RequestApprovalResult> {
  const tag = compileReasonTag(input.compileId);

  const compileRow = await prisma.gapCompile.findUnique({
    where: { id: input.compileId },
    select: { id: true, result: true },
  });
  if (!compileRow) return { ok: false, reason: 'compile_not_found' };

  const open = await prisma.sendApprovalRequest.findFirst({
    where: { status: 'pending', risk_reasons: { has: tag } },
    orderBy: { created_at: 'desc' },
    select: { id: true, status: true },
  });
  if (open) return { ok: true, id: open.id, existing: true, status: open.status };

  const reviewCodes = [...(input.reviewCodes ?? [])];
  const riskReasons = [tag, ...reviewCodes];
  if (input.hypothesisId) riskReasons.push(`hypothesis:${input.hypothesisId}`);
  if (input.draftQueueItemId != null) riskReasons.push(`draft_queue_item:${input.draftQueueItemId}`);

  const created = await prisma.sendApprovalRequest.create({
    data: {
      send_job_id: null,
      channel: APPROVAL_CHANNEL,
      account_name: input.accountName ?? null,
      risk_score: APPROVAL_BASE_RISK + APPROVAL_RISK_PER_REVIEW * reviewCodes.length,
      risk_reasons: riskReasons,
      status: 'pending',
      requested_by: input.requestedBy,
      comment: input.reason,
      sla_due_at: new Date(input.now.getTime() + APPROVAL_SLA_HOURS * 60 * 60 * 1000),
    },
    select: { id: true, status: true },
  });

  const previous = compileRow.result && typeof compileRow.result === 'object' && !Array.isArray(compileRow.result)
    ? (compileRow.result as Record<string, unknown>)
    : {};
  await prisma.gapCompile.update({
    where: { id: input.compileId },
    data: { result: { ...previous, approval_request_id: created.id } },
    select: { id: true },
  });

  return { ok: true, id: created.id, existing: false, status: created.status };
}

export interface ApprovalStatus {
  approved: boolean;
  status: string | null;
  requestId: string | null;
}

/** Read the latest approval request for a compile. Never writes. */
export async function isApproved(prisma: any, compileId: string): Promise<ApprovalStatus> {
  const latest = await prisma.sendApprovalRequest.findFirst({
    where: { risk_reasons: { has: compileReasonTag(compileId) } },
    orderBy: { created_at: 'desc' },
    select: { id: true, status: true },
  });
  if (!latest) return { approved: false, status: null, requestId: null };
  return { approved: latest.status === 'approved', status: latest.status, requestId: latest.id };
}
