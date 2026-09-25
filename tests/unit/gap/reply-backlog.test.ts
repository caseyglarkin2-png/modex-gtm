import { describe, expect, it, vi } from 'vitest';
import { computeReplyBacklog, loadReplyBacklog, type ReplyBacklogRow } from '@/lib/gap/learning/reply-backlog';

const NOW = new Date('2026-09-24T12:00:00.000Z');
const HOUR = 60 * 60 * 1000;

function row(id: string, hoursAgo: number): ReplyBacklogRow {
  return { id, receivedAt: new Date(NOW.getTime() - hoursAgo * HOUR) };
}

describe('computeReplyBacklog', () => {
  it('counts only rows older than the threshold with no disposition', () => {
    const rows = [row('m1', 30), row('m2', 10), row('m3', 25)];
    const backlog = computeReplyBacklog(rows, new Set(), NOW, 24);
    expect(backlog.count).toBe(2); // m1 (30h) and m3 (25h), not m2 (10h, under threshold)
  });

  it('a row with a disposition never counts, regardless of age -- it was handled, not dropped', () => {
    const rows = [row('m1', 100)];
    const backlog = computeReplyBacklog(rows, new Set(['m1']), NOW, 24);
    expect(backlog).toEqual({ count: 0, oldestAgeHours: null, thresholdHours: 24 });
  });

  it('reports the oldest unprocessed reply age in hours, rounded to one decimal', () => {
    const rows = [row('m1', 30), row('m2', 48.25)];
    const backlog = computeReplyBacklog(rows, new Set(), NOW, 24);
    expect(backlog.count).toBe(2);
    expect(backlog.oldestAgeHours).toBe(48.3);
  });

  it('zero rows is zero backlog with a null oldest age, not an error', () => {
    expect(computeReplyBacklog([], new Set(), NOW, 24)).toEqual({ count: 0, oldestAgeHours: null, thresholdHours: 24 });
  });
});

function makeBacklogPrisma(overrides: {
  messages?: any[];
  enrollments?: any[];
  mirrors?: any[];
  dispositions?: any[];
} = {}) {
  return {
    inboundMessage: {
      findMany: vi.fn<(...args: any[]) => Promise<any>>(async () => overrides.messages ?? []),
    },
    sequenceEnrollment: {
      findMany: vi.fn<(...args: any[]) => Promise<any>>(async () => overrides.enrollments ?? []),
    },
    gapHubSpotMirror: {
      findMany: vi.fn<(...args: any[]) => Promise<any>>(async () => overrides.mirrors ?? []),
    },
    conversationDisposition: {
      findMany: vi.fn<(...args: any[]) => Promise<any>>(async () => overrides.dispositions ?? []),
    },
  };
}

describe('loadReplyBacklog', () => {
  it('joins InboundMessage against ConversationDisposition by the SAME (source_kind, source_id) predicate disposition/service.ts uses', async () => {
    const prisma = makeBacklogPrisma({
      messages: [
        { id: 'm1', received_at: new Date(NOW.getTime() - 30 * HOUR), from_email: 'buyer@acme.com', source: 'gmail', hubspot_engagement_id: null },
        { id: 'm2', received_at: new Date(NOW.getTime() - 30 * HOUR), from_email: 'buyer@acme.com', source: 'gmail', hubspot_engagement_id: null },
      ],
      enrollments: [{ to_email: 'buyer@acme.com' }],
      dispositions: [{ source_id: 'm1' }],
    });

    const backlog = await loadReplyBacklog(prisma, NOW);

    expect(backlog.count).toBe(1); // only m2, m1 already has a disposition
    expect(prisma.conversationDisposition.findMany.mock.calls[0][0].where.source_kind).toEqual({ in: ['inbound_message', 'hubspot_engagement'] });
  });

  it('an empty message window never even queries dispositions', async () => {
    const prisma = makeBacklogPrisma({ messages: [] });

    const backlog = await loadReplyBacklog(prisma, NOW);

    expect(backlog).toEqual({ count: 0, oldestAgeHours: null, thresholdHours: 24 });
    expect(prisma.conversationDisposition.findMany).not.toHaveBeenCalled();
  });

  it('unrelated inbound mail (no GAP enrollment, no GAP-mirrored engagement) does not count as backlog', async () => {
    const prisma = makeBacklogPrisma({
      messages: [
        { id: 'm1', received_at: new Date(NOW.getTime() - 30 * HOUR), from_email: 'random@somewhere.com', source: 'gmail', hubspot_engagement_id: null },
      ],
      enrollments: [{ to_email: 'buyer@acme.com' }], // a different, GAP-known address
    });

    const backlog = await loadReplyBacklog(prisma, NOW);

    expect(backlog).toEqual({ count: 0, oldestAgeHours: null, thresholdHours: 24 });
    expect(prisma.conversationDisposition.findMany).not.toHaveBeenCalled();
  });

  it('a real GAP-related gmail reply (from a SequenceEnrollment recipient) counts', async () => {
    const prisma = makeBacklogPrisma({
      messages: [
        { id: 'm1', received_at: new Date(NOW.getTime() - 30 * HOUR), from_email: 'Buyer@Acme.com', source: 'gmail', hubspot_engagement_id: null },
      ],
      enrollments: [{ to_email: 'buyer@acme.com' }],
    });

    const backlog = await loadReplyBacklog(prisma, NOW);

    expect(backlog.count).toBe(1);
  });

  it('a real GAP-related hubspot reply (a GAP-mirrored engagement id) counts', async () => {
    const prisma = makeBacklogPrisma({
      messages: [
        { id: 'hs:1', received_at: new Date(NOW.getTime() - 30 * HOUR), from_email: 'buyer@acme.com', source: 'hubspot', hubspot_engagement_id: 'eng_1' },
      ],
      mirrors: [{ object_id: 'eng_1' }],
    });

    const backlog = await loadReplyBacklog(prisma, NOW);

    expect(backlog.count).toBe(1);
  });

  it('an unmirrored hubspot engagement does not count, even from a known GAP address', async () => {
    const prisma = makeBacklogPrisma({
      messages: [
        { id: 'hs:2', received_at: new Date(NOW.getTime() - 30 * HOUR), from_email: 'buyer@acme.com', source: 'hubspot', hubspot_engagement_id: 'eng_2' },
      ],
      enrollments: [{ to_email: 'buyer@acme.com' }],
      mirrors: [{ object_id: 'some_other_engagement' }],
    });

    const backlog = await loadReplyBacklog(prisma, NOW);

    expect(backlog).toEqual({ count: 0, oldestAgeHours: null, thresholdHours: 24 });
  });

  it('a human-confirmed disposition removes a GAP-attributed message from backlog', async () => {
    const prisma = makeBacklogPrisma({
      messages: [
        { id: 'm1', received_at: new Date(NOW.getTime() - 30 * HOUR), from_email: 'buyer@acme.com', source: 'gmail', hubspot_engagement_id: null },
      ],
      enrollments: [{ to_email: 'buyer@acme.com' }],
      dispositions: [{ source_id: 'm1' }],
    });

    const backlog = await loadReplyBacklog(prisma, NOW);

    expect(backlog).toEqual({ count: 0, oldestAgeHours: null, thresholdHours: 24 });
  });
});
