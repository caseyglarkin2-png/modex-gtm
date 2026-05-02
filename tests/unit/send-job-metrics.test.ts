import { describe, expect, it } from 'vitest';
import { computeSendJobMetrics, type SendJobMetricRow, type SendJobRecipientMetricRow } from '@/lib/admin/send-job-metrics';

function ts(value: string) {
  return new Date(value);
}

describe('computeSendJobMetrics', () => {
  it('computes send job and recipient totals', () => {
    const jobs: SendJobMetricRow[] = [
      {
        status: 'completed',
        created_at: ts('2026-05-01T10:00:00.000Z'),
        started_at: ts('2026-05-01T10:00:00.000Z'),
        completed_at: ts('2026-05-01T10:00:15.000Z'),
        sent_count: 4,
        failed_count: 0,
        skipped_count: 0,
      },
      {
        status: 'partial',
        created_at: ts('2026-05-01T10:01:00.000Z'),
        started_at: ts('2026-05-01T10:01:00.000Z'),
        completed_at: ts('2026-05-01T10:01:30.000Z'),
        sent_count: 2,
        failed_count: 1,
        skipped_count: 1,
      },
      {
        status: 'failed',
        created_at: ts('2026-05-01T10:02:00.000Z'),
        started_at: ts('2026-05-01T10:02:00.000Z'),
        completed_at: ts('2026-05-01T10:02:20.000Z'),
        sent_count: 0,
        failed_count: 3,
        skipped_count: 0,
      },
    ];

    const recipients: SendJobRecipientMetricRow[] = [
      {
        account_name: 'Acme Foods',
        to_email: 'ops@acme.com',
        status: 'failed',
        error_message: 'Mailbox unavailable',
        created_at: ts('2026-05-01T10:03:00.000Z'),
      },
    ];

    const metrics = computeSendJobMetrics(jobs, recipients);

    expect(metrics.totalJobs).toBe(3);
    expect(metrics.completedJobs).toBe(1);
    expect(metrics.partialJobs).toBe(1);
    expect(metrics.failedJobs).toBe(1);
    expect(metrics.sentRecipients).toBe(6);
    expect(metrics.failedRecipients).toBe(4);
    expect(metrics.skippedRecipients).toBe(1);
    expect(metrics.avgCompletionSeconds).toBe(21.7);
    expect(metrics.recentFailedRecipients).toHaveLength(1);
    expect(metrics.recentFailedRecipients[0]?.accountName).toBe('Acme Foods');
  });
});
