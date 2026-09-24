/**
 * Approval path (GAP Prospecting OS, Sprint 3, S3-T9).
 *
 * `requestApproval` writes the existing SendApprovalRequest row in the shape
 * the queue page and the PATCH /api/revops/send-approvals resolver consume;
 * `isApproved` only reads. Neither ever approves anything.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import {
  APPROVAL_BASE_RISK,
  APPROVAL_CHANNEL,
  APPROVAL_RISK_PER_REVIEW,
  APPROVAL_SLA_HOURS,
  compileReasonTag,
  isApproved,
  requestApproval,
} from '@/lib/gap/compiler/approval';

const NOW = new Date('2026-09-23T12:00:00Z');

function fakePrisma(overrides: { compile?: unknown; existing?: unknown; latest?: unknown } = {}) {
  const compile = overrides.compile === undefined ? { id: 'cmp_1', result: { verdict: 'review_required' } } : overrides.compile;
  return {
    gapCompile: {
      findUnique: vi.fn(async () => compile),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'cmp_1', ...data })),
    },
    sendApprovalRequest: {
      findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
        where.status === 'pending' ? (overrides.existing ?? null) : (overrides.latest ?? null),
      ),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'apr_1', status: data.status })),
    },
  };
}

function request(overrides: Record<string, unknown> = {}) {
  return {
    compileId: 'cmp_1',
    hypothesisId: 'hyp_1',
    draftQueueItemId: 42,
    accountName: 'Boston Beer Company',
    reason: 'review_required: C14, C15',
    reviewCodes: ['C14', 'C15'],
    requestedBy: 'casey@freightroll.com',
    now: NOW,
    ...overrides,
  };
}

describe('requestApproval', () => {
  it('creates a pending SendApprovalRequest in the shape the queue and resolver consume', async () => {
    const prisma = fakePrisma();
    const r = await requestApproval(prisma, request());
    expect(r).toEqual({ ok: true, id: 'apr_1', existing: false, status: 'pending' });

    expect(prisma.sendApprovalRequest.create).toHaveBeenCalledTimes(1);
    const { data } = (prisma.sendApprovalRequest.create.mock.calls[0] as unknown as [{ data: Record<string, unknown> }])[0];
    expect(data).toEqual({
      send_job_id: null,
      channel: APPROVAL_CHANNEL,
      account_name: 'Boston Beer Company',
      risk_score: APPROVAL_BASE_RISK + APPROVAL_RISK_PER_REVIEW * 2,
      risk_reasons: ['gap_compile:cmp_1', 'C14', 'C15', 'hypothesis:hyp_1', 'draft_queue_item:42'],
      status: 'pending',
      requested_by: 'casey@freightroll.com',
      comment: 'review_required: C14, C15',
      sla_due_at: new Date(NOW.getTime() + APPROVAL_SLA_HOURS * 60 * 60 * 1000),
    });
    expect(APPROVAL_CHANNEL).toBe('gap_compile');
    expect(APPROVAL_BASE_RISK).toBe(30);
    expect(APPROVAL_RISK_PER_REVIEW).toBe(10);
    expect(APPROVAL_SLA_HOURS).toBe(24);
    expect(compileReasonTag('cmp_1')).toBe('gap_compile:cmp_1');
  });

  it('links the request back onto the GapCompile row as result.approval_request_id, keeping the rest of result', async () => {
    const prisma = fakePrisma({ compile: { id: 'cmp_1', result: { verdict: 'review_required', wordCount: 51 } } });
    await requestApproval(prisma, request());
    expect(prisma.gapCompile.update).toHaveBeenCalledTimes(1);
    expect(prisma.gapCompile.update).toHaveBeenCalledWith({
      where: { id: 'cmp_1' },
      data: { result: { verdict: 'review_required', wordCount: 51, approval_request_id: 'apr_1' } },
      select: { id: true },
    });
  });

  it('is idempotent: an open request for the same compile is returned, not duplicated', async () => {
    const prisma = fakePrisma({ existing: { id: 'apr_existing', status: 'pending' } });
    const r = await requestApproval(prisma, request());
    expect(r).toEqual({ ok: true, id: 'apr_existing', existing: true, status: 'pending' });
    expect(prisma.sendApprovalRequest.create).not.toHaveBeenCalled();
    expect(prisma.gapCompile.update).not.toHaveBeenCalled();
    expect(prisma.sendApprovalRequest.findFirst).toHaveBeenCalledWith({
      where: { status: 'pending', risk_reasons: { has: 'gap_compile:cmp_1' } },
      orderBy: { created_at: 'desc' },
      select: { id: true, status: true },
    });
  });

  it('refuses compile_not_found without writing', async () => {
    const prisma = fakePrisma({ compile: null });
    const r = await requestApproval(prisma, request());
    expect(r).toEqual({ ok: false, reason: 'compile_not_found' });
    expect(prisma.sendApprovalRequest.create).not.toHaveBeenCalled();
  });

  it('zero review codes still carries the compile tag and the base risk', async () => {
    const prisma = fakePrisma();
    await requestApproval(prisma, request({ reviewCodes: [], hypothesisId: undefined, draftQueueItemId: undefined, accountName: undefined }));
    const { data } = (prisma.sendApprovalRequest.create.mock.calls[0] as unknown as [{ data: Record<string, unknown> }])[0];
    expect(data.risk_reasons).toEqual(['gap_compile:cmp_1']);
    expect(data.risk_score).toBe(APPROVAL_BASE_RISK);
    expect(data.account_name).toBeNull();
  });
});

describe('isApproved', () => {
  it('reads the latest request for the compile: approved -> true', async () => {
    const prisma = fakePrisma({ latest: { id: 'apr_1', status: 'approved' } });
    expect(await isApproved(prisma, 'cmp_1')).toEqual({ approved: true, status: 'approved', requestId: 'apr_1' });
    expect(prisma.sendApprovalRequest.findFirst).toHaveBeenCalledWith({
      where: { risk_reasons: { has: 'gap_compile:cmp_1' } },
      orderBy: { created_at: 'desc' },
      select: { id: true, status: true },
    });
  });

  it('pending or rejected -> false with the status; no request -> false with null', async () => {
    expect(await isApproved(fakePrisma({ latest: { id: 'apr_1', status: 'pending' } }), 'cmp_1')).toEqual({
      approved: false,
      status: 'pending',
      requestId: 'apr_1',
    });
    expect(await isApproved(fakePrisma({ latest: { id: 'apr_1', status: 'rejected' } }), 'cmp_1')).toEqual({
      approved: false,
      status: 'rejected',
      requestId: 'apr_1',
    });
    expect(await isApproved(fakePrisma(), 'cmp_1')).toEqual({ approved: false, status: null, requestId: null });
  });
});

describe('approval.ts never approves', () => {
  it('has no sendApprovalRequest.update and never writes an approved status', () => {
    const source = readFileSync(path.resolve(process.cwd(), 'src/lib/gap/compiler/approval.ts'), 'utf8');
    expect(source).not.toMatch(/sendApprovalRequest\.update/);
    expect(source).not.toMatch(/sendApprovalRequest\.updateMany/);
    expect(source).not.toMatch(/status:\s*'approved'/);
  });
});
