import { describe, expect, it } from 'vitest';
import { computeStuckJobs } from '@/lib/admin/stuck-jobs';

describe('computeStuckJobs', () => {
  it('returns only processing jobs older than threshold', () => {
    const now = new Date('2026-05-02T17:40:00.000Z');
    const result = computeStuckJobs({
      now,
      thresholdMs: 15 * 60 * 1000,
      generationJobs: [
        {
          id: 1,
          account_name: 'Acme Logistics',
          status: 'processing',
          started_at: new Date('2026-05-02T17:10:00.000Z'),
          updated_at: new Date('2026-05-02T17:12:00.000Z'),
        },
        {
          id: 2,
          account_name: 'Blue Yard',
          status: 'processing',
          started_at: new Date('2026-05-02T17:33:00.000Z'),
          updated_at: new Date('2026-05-02T17:33:00.000Z'),
        },
        {
          id: 3,
          account_name: 'Delta Foods',
          status: 'completed',
          started_at: new Date('2026-05-02T17:00:00.000Z'),
          updated_at: new Date('2026-05-02T17:34:00.000Z'),
        },
      ],
      sendJobs: [
        {
          id: 10,
          status: 'processing',
          started_at: new Date('2026-05-02T17:15:00.000Z'),
          updated_at: new Date('2026-05-02T17:15:00.000Z'),
          total_recipients: 8,
          sent_count: 2,
          failed_count: 1,
        },
        {
          id: 11,
          status: 'completed',
          started_at: new Date('2026-05-02T17:20:00.000Z'),
          updated_at: new Date('2026-05-02T17:35:00.000Z'),
          total_recipients: 3,
          sent_count: 3,
          failed_count: 0,
        },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      kind: 'generation',
      id: 1,
      label: 'Acme Logistics',
      ageMinutes: 30,
    });
    expect(result[1]).toMatchObject({
      kind: 'send',
      id: 10,
      label: 'Send Job #10',
      ageMinutes: 25,
    });
  });
});
