// @vitest-environment node
/**
 * R5 review (finding 5a): a failed disposition mirror must not drop out of sight. The retry pass
 * (disposition/mirror-retry.ts) stops after three attempts and nothing read the exhausted rows: health now says
 * "Dispositions awaiting a HubSpot mirror: N (M exhausted)" from the same receipts and attempts the pass reads, and
 * the mailbox cron's own result is not a clean ok while exhausted rows exist (gap-mailbox-route.test.ts).
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { evaluateHealth, HEALTH_REPAIR, type HealthInputs } from '@/lib/gap/health/health';
import { loadHealthInputs } from '@/lib/gap/health/load';
import { loadMirrorBacklog, mirrorRetryVerdict, MIRROR_RETRY, MIRROR_RETRY_MAX } from '@/lib/gap/disposition/mirror-retry';
import { COMMAND_APPLIED, DONE_RECEIPT } from '@/lib/gap/replies/commands-apply';

const NOW = new Date('2026-10-10T14:00:00Z');
const min = (n: number) => new Date(NOW.getTime() - n * 60_000);

function base(): HealthInputs {
  return {
    mailbox: { senderConfigured: true, lastSuccessAt: min(4), lastFailureAt: null, consecutiveFailures: 0, lastMessage: 'apply: 3 inbox messages' },
    hubspot: { configured: true, ok: true, ms: 420, error: null },
    suppression: { configured: true, verdict: 'clear', ms: 3100, error: null },
    sender: { configured: true, mailbox: 'casey@yardflow.ai' },
    routing: { lastRunAt: min(12) },
  };
}

const failedReceipt = (kind: string, dispositionId: string, retryable = true) => ({ kind, actor: 'cron:gap-mailbox', subject_type: 'work_item', subject_id: `reply:${dispositionId}`, payload: { command: 'done', dispositionId, receipt: 'recorded_not_mirrored', mirrorReason: 'HubSpot 502 Bad Gateway', retryable }, created_at: min(60) });
const attempt = (dispositionId: string, n: number, receipt: 'mirrored' | 'recorded_not_mirrored' = 'recorded_not_mirrored') => ({ kind: MIRROR_RETRY, actor: 'cron:gap-mailbox', subject_type: 'disposition', subject_id: dispositionId, payload: { attempt: n, of: MIRROR_RETRY_MAX, receipt }, created_at: min(50 - n) });

function ledger() {
  return ledgerDb(
    {
      audit: [
        // d1: three failed attempts: exhausted.
        failedReceipt(COMMAND_APPLIED, 'd1'),
        attempt('d1', 1),
        attempt('d1', 2),
        attempt('d1', 3),
        // d2: one failed attempt, still retried; its receipt was written before a later step threw (a DONE receipt only).
        failedReceipt(DONE_RECEIPT, 'd2'),
        attempt('d2', 1),
        // d3: mirrored on its first retry.
        failedReceipt(COMMAND_APPLIED, 'd3'),
        attempt('d3', 1, 'mirrored'),
        // d4: skipped by policy (the mirror off): not awaiting a mirror.
        failedReceipt(COMMAND_APPLIED, 'd4', false),
        // d5: both an applied row and a DONE receipt: counted once.
        failedReceipt(COMMAND_APPLIED, 'd5'),
        failedReceipt(DONE_RECEIPT, 'd5'),
      ],
      // d5's note landed after all (a replayed DONE found the key mirrored): not awaiting.
      mirror: [{ key: 'gap:disp:d5', object_type: 'contact', object_id: 'hs-5', note_id: 'n-5', written_at: min(10), error: null }],
    },
    NOW,
  );
}

describe('the dispositions awaiting a HubSpot mirror (R5 review, finding 5a)', () => {
  it('the backlog: retryable failed receipts not yet mirrored, the exhausted among them; policy skips and landed notes are not awaiting', async () => {
    expect(await loadMirrorBacklog(ledger().client())).toEqual({ awaiting: 2, exhausted: 1 });
    expect(await loadMirrorBacklog(ledgerDb({}, NOW).client())).toEqual({ awaiting: 0, exhausted: 0 });
  });

  it('health says it: "Dispositions awaiting a HubSpot mirror: N (M exhausted)", degraded with its owner and retry; none is healthy; unread is no component; unreadable is said', async () => {
    const inputs = await loadHealthInputs(ledger().client() as never, { env: {}, clock: () => NOW.getTime() });
    expect(inputs.crmMirror).toEqual({ awaiting: 2, exhausted: 1 });
    const c = evaluateHealth(inputs, NOW).components.find((x) => x.key === 'crm_mirror')!;
    expect(c).toMatchObject({ state: 'DEGRADED', label: 'Dispositions awaiting a HubSpot mirror: 2 (1 exhausted)', owner: HEALTH_REPAIR.crm_mirror.owner, retry: HEALTH_REPAIR.crm_mirror.retry });
    expect(c.detail).toMatch(/1 used all 3 attempts/);
    expect(evaluateHealth({ ...base(), crmMirror: { awaiting: 1, exhausted: 0 } }, NOW).components.find((x) => x.key === 'crm_mirror')).toMatchObject({ state: 'DEGRADED', label: 'Dispositions awaiting a HubSpot mirror: 1 (0 exhausted)' });
    expect(evaluateHealth({ ...base(), crmMirror: { awaiting: 0, exhausted: 0 } }, NOW).components.find((x) => x.key === 'crm_mirror')).toMatchObject({ state: 'HEALTHY', label: 'No disposition is awaiting a HubSpot mirror' });
    expect(evaluateHealth(base(), NOW).components.map((x) => x.key)).not.toContain('crm_mirror');
    expect(evaluateHealth({ ...base(), crmMirror: null }, NOW).components.find((x) => x.key === 'crm_mirror')).toMatchObject({ state: 'DEGRADED', label: 'The HubSpot mirror backlog is not readable' });
    // A client without the mirror table is not read (older callers keep their shape).
    const bare = await loadHealthInputs({ gapAuditEvent: { findMany: async () => [], findFirst: async () => null, count: async () => 0 } } as never, { env: {}, clock: () => NOW.getTime() });
    expect(bare.crmMirror).toBeUndefined();
  });

  it("the retry pass's verdict for the cron: never a clean ok while a disposition is exhausted or the pass failed", () => {
    expect(mirrorRetryVerdict({ tried: 1, mirrored: 1, failed: 0, exhausted: [] })).toEqual({ ok: true, line: null });
    expect(mirrorRetryVerdict({ tried: 0, mirrored: 0, failed: 0, exhausted: ['d1', 'd2'] })).toEqual({ ok: false, line: '2 disposition(s) exhausted the HubSpot mirror retries' });
    expect(mirrorRetryVerdict({ error: 'db down' })).toEqual({ ok: false, line: 'the HubSpot mirror retry failed (db down)' });
  });
});
