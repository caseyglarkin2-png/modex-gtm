/**
 * GAP Signal Intelligence final review (three lenses): verified P0/P1 fixes.
 *   - a reassigned signal starts over: never the old account's verified fact, event or promotion
 *   - the page must name the account's FULL name (never its first token), and a sentence from a
 *     signal's page must itself name the account
 *   - a share that still needs Casey never falls out of the inbox
 *   - the status says what GAP will actually do with a discovered non-candidate
 */
import { describe, expect, it, vi } from 'vitest';
import { applySignalOp, listSignals } from '@/lib/gap/signals/ops';
import { signalStatus } from '@/lib/gap/signals/intake';
import { textNamesAccount, verificationContext, verifyCandidate } from '@/lib/gap/research/run';

const NOW = new Date('2026-09-28T15:00:00.000Z');

describe('reassigning starts the signal over', () => {
  const verified = { id: 's1', created_at: NOW, url: 'https://x.com/a', title: 'Frito-Lay opens Texas plant', origin: 'casey_share', account_name: 'Frito-Lay', resolution: 'resolved', research_status: 'fact_found', research_run_id: 'run-1', event_id: 'e-old', promoted_trigger_id: 7, feedback: null, metadata: { clustered: true, promotedAt: '2026-09-28T10:00:00Z', research: { runId: 'run-1' } } };
  const db = (row: Record<string, unknown>) => ({
    gapSignal: {
      findUnique: vi.fn(async () => row),
      count: vi.fn(async () => 1),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => Object.assign(row, data)),
    },
    account: { findFirst: vi.fn(async () => ({ name: 'PepsiCo' })) },
    gapAuditEvent: { create: vi.fn(async () => ({})) },
  });

  it('assign to a different account: research, event and promotion reset; a shared link is followed up again', async () => {
    const row = { ...verified };
    await applySignalOp(db(row), { id: 's1', actor: 'casey', now: NOW, op: 'assign', accountName: 'PepsiCo' });
    expect(row).toMatchObject({ account_name: 'PepsiCo', research_status: 'queued', research_run_id: null, event_id: 's1', promoted_trigger_id: null });
    expect(row.metadata).toMatchObject({ clustered: false, research: null, promotedAt: null, reassignedFrom: 'Frito-Lay' });
  });

  it('wrong account on a verified signal: back to Needs you with nothing verified carried over', async () => {
    const row = { ...verified };
    await applySignalOp(db(row), { id: 's1', actor: 'casey', now: NOW, op: 'feedback', value: 'wrong_account' });
    expect(row).toMatchObject({ account_name: null, resolution: 'needs_account', research_status: 'none', research_run_id: null, event_id: 's1', promoted_trigger_id: null });
  });
});

describe('verification names the account by its full name', () => {
  it('whole words of the full normalized name, never the first token', () => {
    const gm = verificationContext('General Mills').accountKey;
    expect(textNamesAccount('General Motors will close its Lansing plant.', gm)).toBe(false);
    expect(textNamesAccount('General Mills will open a new distribution center in Georgia.', gm)).toBe(true);
    expect(textNamesAccount('An affordable new plant opens.', verificationContext('Ford').accountKey)).toBe(false);
    expect(textNamesAccount('H-E-B will open a new distribution center in Houston.', verificationContext('H-E-B').accountKey)).toBe(true);
  });

  it("a sentence from a signal's page must itself name the account (a competitor's paragraph is not its fact)", async () => {
    const page = 'Walmart builds five automated distribution centers in Texas this year. Kroger lags behind in automation.';
    const ctx = verificationContext('Kroger', async () => page);
    const r = await verifyCandidate({ provider: 'signal', url: 'https://x.com/a', title: 't', publishedAt: NOW, excerpt: 'Walmart builds five automated distribution centers in Texas this year.', sourceType: 'public_secondary' }, ctx);
    expect(r).toEqual({ ok: false, reason: 'sentence_does_not_name_account' });
  });
});

describe('the inbox and the status tell the truth', () => {
  it('a share that still needs Casey is always fetched, however old', async () => {
    const findMany = vi.fn(async () => []);
    await listSignals({ gapSignal: { findMany } });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ origin: { in: ['casey_share', 'conference_note'] }, resolution: { in: ['needs_account', 'ambiguous'] } }) }));
  });

  it('a discovered risk or leadership story says it is kept as context, not "waiting for research"', () => {
    expect(signalStatus({ url: 'https://n.com/a', resolution: 'resolved', research_status: 'none', feedback: null, origin: 'discovery', relevance: 'risk' }).status).toBe('Context kept');
    expect(signalStatus({ url: 'https://n.com/a', resolution: 'resolved', research_status: 'none', feedback: null, origin: 'casey_share', relevance: 'risk' }).status).toBe('Captured');
  });
});
