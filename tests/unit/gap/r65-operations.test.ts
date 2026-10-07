// @vitest-environment node
/**
 * R65 (GAP OS execution recovery): the operator sees failures, Casey sees decisions. The operations report counts
 * broken handoffs (drafts stranded, proposals incomplete, dead-letter signals), the research queue's age, research
 * freshness and cost, preparation latency, seller corrections, outcomes and the HubSpot changes pending or failed
 * with their owners and where to retry; a count GAP could not read is unreadable (null), never zero. The health
 * check carries it only on request, so the Work strip stays light.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = { value: { user: { email: 'casey@freightroll.com' } } as null | { user: { email: string } } };
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/gap/flags', async (orig) => ({ ...(await orig<Record<string, unknown>>()), assertGapEnabled: () => null }));
vi.mock('@/lib/gap/health/load', () => ({
  loadHealthInputs: async () => ({
    mailbox: { senderConfigured: true, lastSuccessAt: new Date(), lastFailureAt: null, consecutiveFailures: 0, lastMessage: null },
    hubspot: { configured: true, ok: true, ms: 10, error: null },
    suppression: { configured: true, verdict: 'clear', ms: 10, error: null },
    sender: { configured: true, mailbox: 'casey@yardflow.ai' },
    routing: { lastRunAt: new Date() },
  }),
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/gap/health/route';
import { evaluateOperations, loadOperationsInputs, type OperationsInputs } from '@/lib/gap/health/operations';

const NOW = new Date('2026-10-07T15:00:00Z');
const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

const healthyInputs = (): OperationsInputs => ({
  windowDays: 7,
  handoffs: { stranded: 0, strandedOldestAt: null, incomplete: 0, incompleteOldestAt: null, deadLetters: 0, deadLetterOldestAt: null },
  queue: { queued: 2, oldestQueuedAt: days(0.1), researchingStuck: 0 },
  research: { runs: 14, runsFailed: 0, turns: 80, turnsFailed: 0, queuedByTurns: 12, verified: 9, lastRunAt: days(0.1), lastTurnAt: days(0.05) },
  preparation: { summaries: 40, medianAgeMs: 30 * 60_000, oldestAgeMs: 5 * 3_600_000, stale: 0 },
  corrections: { bidsCorrected: 1, captureRejected: 2, storiesSetAside: 1, obligationsSkippedBySeller: 3, crmDiscarded: 0 },
  outcomes: { obligationsDone: 11, obligationsSkipped: 3, obligationsOverdue: 2, repliesReceived: 6, repliesRecorded: 5, meetingsBooked: 2, meetingsHeld: 1, meetingsCanceled: 1 },
  decisions: { thesesWaitingReview: 4 },
  crm: { readable: true, pendingApproval: [], approvedNotWritten: [], failed: [] },
});

describe('R65: the operations report', () => {
  it('healthy: nothing broken; the decisions, outcomes and research cost are said in words', () => {
    const r = evaluateOperations(healthyInputs(), NOW);
    expect([r.state, r.headline]).toEqual(['HEALTHY', 'Nothing broken or stuck']);
    expect(r.failures.every((f) => f.state === 'HEALTHY')).toBe(true);
    expect(r.decisions.map((d) => d.label)).toEqual(['4 theses waiting for your review', '0 HubSpot changes waiting for your approval', '0 approved HubSpot changes not written (approved writes are off or it is waiting): retry each once writes are on', 'Obligations overdue now: 2']);
    expect(r.outcomes.map((o) => o.label)).toEqual([
      'Obligations in 7 days: 11 done, 3 skipped',
      'Replies in 7 days: 6 received, 5 recorded',
      'Meetings in 7 days: 2 booked, 1 held, 1 canceled',
      'Your corrections in 7 days: 1 buyer statements corrected, 2 capture lines rejected, 1 stories set aside, 3 obligations skipped, 0 HubSpot changes discarded',
    ]);
    expect(r.research.find((x) => x.key === 'research_cost')?.label).toBe('Research in 7 days: 14 runs, 80 grounded turns, 12 pages queued, 9 facts verified, 0 runs and 0 turns failed');
  });

  it('failures, worst first: a queue not draining is BLOCKED; stranded, incomplete, dead letters and failed HubSpot changes are DEGRADED with where to act', () => {
    const i = healthyInputs();
    i.handoffs = { stranded: 1, strandedOldestAt: days(1), incomplete: 2, incompleteOldestAt: days(2), deadLetters: 3, deadLetterOldestAt: days(4) };
    i.queue = { queued: 5, oldestQueuedAt: days(4), researchingStuck: 0 };
    i.crm.failed = [{ proposalId: 'p1', accountName: 'Kroger Scratch Co', dealName: 'YardFlow - Kroger', kind: 'note', state: 'failed', owner: 'casey@freightroll.com', since: days(1), detail: 'HubSpot 503', href: '/gap/accounts/kroger-scratch-co?view=brief#deal-workspace', action: 'Retry it on the deal' }];
    const r = evaluateOperations(i, NOW);
    expect(r.state).toBe('BLOCKED');
    expect(r.failures[0]).toMatchObject({ key: 'queue_age', state: 'BLOCKED', label: 'The research queue is not draining: 5 signals queued, the oldest for 4 days', href: '/gap/coverage' });
    expect(r.failures.filter((f) => f.state === 'DEGRADED').map((f) => f.key)).toEqual(['drafts_stranded', 'proposals_incomplete', 'dead_letter_signals', 'crm_failed']);
    expect(r.failures.find((f) => f.key === 'crm_failed')).toMatchObject({ count: 1, href: '/gap/accounts/kroger-scratch-co?view=brief#deal-workspace', owner: 'casey@freightroll.com', retry: expect.stringMatching(/^The deal brief: Retry/) });
    // Every failure names who repairs it and how (the operator's view).
    for (const f of r.failures) expect([f.key, !!f.owner, !!f.retry]).toEqual([f.key, true, true]);
    expect(r.failures.find((f) => f.key === 'drafts_stranded')).toMatchObject({ owner: 'operator', retry: expect.stringMatching(/repair-stranded-drafts\.ts --dry-run/) });
    expect(r.headline).toMatch(/^The research queue is not draining/);
  });

  it('a count GAP could not read is unreadable, never zero, and degrades the state', () => {
    const i = healthyInputs();
    i.handoffs.deadLetters = null;
    i.crm = { readable: false, pendingApproval: [], approvedNotWritten: [], failed: [] };
    const r = evaluateOperations(i, NOW);
    expect(r.state).toBe('DEGRADED');
    expect(r.failures.find((f) => f.key === 'dead_letter_signals')).toMatchObject({ state: 'DEGRADED', count: null, label: expect.stringMatching(/could not be read$/) });
    expect(r.failures.find((f) => f.key === 'crm_failed')?.label).toBe('HubSpot changes could not be read');
    expect(r.decisions.find((d) => d.key === 'crm_waiting_approval')?.count).toBeNull();
  });

  it('the loader reads each count on its own: a missing table is that count unreadable, never every count, never an error', async () => {
    const prisma = { prospectingHypothesis: { count: async () => 2, findFirst: async () => ({ created_at: new Date(days(1)) }) } };
    const i = await loadOperationsInputs(prisma, NOW);
    expect(i.handoffs.stranded).toBe(2);
    expect(i.handoffs.strandedOldestAt).toBe(days(1));
    expect(i.decisions.thesesWaitingReview).toBe(2);
    expect([i.handoffs.deadLetters, i.queue.queued, i.research.runs, i.research.turns, i.outcomes.repliesReceived, i.preparation.summaries]).toEqual([null, null, null, null, null, null]);
    expect(i.crm.readable).toBe(false);
    expect(evaluateOperations(i, NOW).state).toBe('DEGRADED');
  });
});

describe('R65: the health check carries the operator view on request only', () => {
  beforeEach(() => {
    session.value = { user: { email: 'casey@freightroll.com' } };
  });
  it('the Work strip call stays light; ?operations=1 adds the operations report', async () => {
    const plain = await (await GET(new NextRequest('http://localhost/api/gap/health'))).json();
    expect(plain.operations).toBeUndefined();
    expect(plain.overall).toBe('HEALTHY');
    const ops = await (await GET(new NextRequest('http://localhost/api/gap/health?operations=1'))).json();
    expect(ops.overall).toBe('HEALTHY');
    expect(ops.operations).toMatchObject({ state: 'DEGRADED', failures: expect.any(Array), decisions: expect.any(Array) });
    expect(ops.operations.inputs.handoffs.stranded).toBeNull();
  });
});
