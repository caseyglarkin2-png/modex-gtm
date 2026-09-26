import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/hubspot/client', () => ({ getHubSpotClient: vi.fn(), isHubSpotConfigured: () => false, withHubSpotRetry: vi.fn() }));
vi.mock('@/lib/gap/routing/suppression-read', () => ({ createClawdSuppressionReader: () => ({}) }));

import { routeAfterUse, summarizeUseOutcomes } from '@/lib/gap/routing/interactive';

const NOW = new Date('2026-09-26T14:00:00Z');

function card(id: string, personaId: number, action: string, ruleId: string, extra: Record<string, unknown> = {}) {
  return {
    id, action, lane: action === 'do_not_contact' ? 'blocked' : 'work_queue', ruleId, priority: 50, blocked: action === 'do_not_contact', target: null, explain: null,
    account: { name: 'PepsiCo', hubspotCompanyId: '1', tam: 'in', tamTier: 'A', heatTier: 4 },
    persona: { id: personaId, personaKey: null, displayName: `p${personaId}`, email: `p${personaId}@pepsico.com`, hubspotContactId: null, title: 'VP', phone: null, linkedinUrl: null },
    hypothesis: { id: `h${personaId}`, status: 'active', family: 'hidden_capacity', confidence: 42 },
    suppression: { class: 'clear', hits: [] }, humanAction: null, humanActionAt: null, createdAt: NOW,
    ...extra,
  } as any;
}

const PEOPLE = [916, 928, 976, 1007, 1845].map((personaId) => ({ personaId, name: `p${personaId}` }));

describe('summarizeUseOutcomes', () => {
  it('reports where each approved person landed, and never drops one the run skipped', () => {
    const items = [
      card('a', 916, 'enroll_gap_sequence', 'enroll'),
      card('b', 928, 'enroll_gap_sequence', 'enroll'),
      card('c', 976, 'call_now', 'hot_call', { persona: { ...card('x', 976, '', '').persona, phone: '+1 212 555 0100' } }),
      card('d', 1007, 'research_required', 'evidence_thin'),
      card('e', 9999, 'enroll_gap_sequence', 'enroll'), // someone else's card: not reported
    ];
    const out = summarizeUseOutcomes('run-1', items, PEOPLE);
    expect(out.counts).toMatchObject({ ready: 3, research: 1, not_routed: 1, blocked: 0 });
    expect(out.people.map((p) => [p.personaId, p.lane])).toEqual([
      [916, 'ready'], [928, 'ready'], [976, 'ready'], [1007, 'research'], [1845, 'not_routed'],
    ]);
    expect(out.people.find((p) => p.personaId === 1845)?.decisionId).toBeNull();
  });

  it('a hard-suppressed person is BLOCKED, not ready', () => {
    const out = summarizeUseOutcomes('run-1', [card('a', 916, 'do_not_contact', 'suppressed')], PEOPLE.slice(0, 1));
    expect(out.people[0].lane).toBe('blocked');
  });
});

describe('summarizeUseOutcomes: failures', () => {
  it('a person whose account failed is FAILED with the reason carried, while the other account still reports its cards', () => {
    const people = [
      { personaId: 916, name: 'p916', accountName: 'PepsiCo' },
      { personaId: 50, name: 'k50', accountName: 'Kroger' },
    ];
    const out = summarizeUseOutcomes('run-1', [card('a', 916, 'enroll_gap_sequence', 'enroll')], people, [{ accountName: 'Kroger', reason: 'account_timeout' }]);
    expect(out.people.map((p) => [p.personaId, p.lane])).toEqual([[916, 'ready'], [50, 'failed']]);
    expect(out.counts).toMatchObject({ ready: 1, failed: 1, not_routed: 0 });
    expect(out.failures).toEqual([{ accountName: 'Kroger', reason: 'account_timeout' }]);
  });
});

function personaStore(rows: Array<{ id: number; account_name: string | null }>) {
  return { persona: { findMany: vi.fn(async ({ where }: any) => rows.filter((r) => where.id.in.includes(r.id))) } } as any;
}

const REPORT = { runId: 'run-9', mode: 'shadow', accountsScanned: 1, pairs: 1, decisions: 1, skips: {}, byRule: {}, byAction: {}, failed: [], dryRun: false };

describe('routeAfterUse (targeted)', () => {
  it('routes ONLY the approved people at their own account, applies, and reads THAT run back', async () => {
    const run = vi.fn(async () => REPORT) as any;
    const listQueue = vi.fn(async () => ({ runId: 'run-9', asOf: null, items: [card('a', 916, 'enroll_gap_sequence', 'enroll')], nextCursor: null })) as any;
    const prisma = personaStore([{ id: 916, account_name: 'PepsiCo' }, { id: 50, account_name: 'Kroger' }]);
    const r = await routeAfterUse(prisma, { actor: 'casey@freightroll.com', now: NOW, people: PEOPLE.slice(0, 1) }, { run, listQueue });
    expect(r).toMatchObject({ ok: true, runId: 'run-9', counts: { ready: 1 } });
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][1]).toMatchObject({ dryRun: false, accountNames: ['PepsiCo'], personaIds: [916], actor: 'casey@freightroll.com' });
    expect(run.mock.calls[0][1].accountNames).not.toContain('Kroger');
    expect(listQueue.mock.calls[0][1]).toEqual({ runId: 'run-9', limit: 100 });
  });

  it('sibling approval routes the selected people only, one run, one account', async () => {
    const run = vi.fn(async () => REPORT) as any;
    const listQueue = vi.fn(async () => ({ runId: 'run-9', asOf: null, items: [], nextCursor: null })) as any;
    const prisma = personaStore(PEOPLE.map((p) => ({ id: p.personaId, account_name: 'PepsiCo' })));
    await routeAfterUse(prisma, { actor: 'c', now: NOW, people: PEOPLE.slice(0, 3) }, { run, listQueue });
    expect(run.mock.calls[0][1]).toMatchObject({ accountNames: ['PepsiCo'], personaIds: [916, 928, 976] });
  });

  it('26+ accounts in use do not matter: approving one account routes one account (the old 25-account scope cap is gone)', async () => {
    const run = vi.fn(async () => REPORT) as any;
    const listQueue = vi.fn(async () => ({ runId: 'run-9', asOf: null, items: [], nextCursor: null })) as any;
    const prisma = personaStore([{ id: 916, account_name: 'PepsiCo' }]);
    prisma.prospectingHypothesis = { findMany: vi.fn(async () => Array.from({ length: 40 }, (_, i) => ({ account_name: `Acct ${i}` }))) };
    const r = await routeAfterUse(prisma, { actor: 'c', now: NOW, people: PEOPLE.slice(0, 1) }, { run, listQueue });
    expect(r.ok).toBe(true);
    expect(prisma.prospectingHypothesis.findMany).not.toHaveBeenCalled();
    expect(run.mock.calls[0][1].accountNames).toEqual(['PepsiCo']);
  });

  it('a routing crash comes back as a reason to show inline, never a throw', async () => {
    const r = await routeAfterUse(personaStore([{ id: 916, account_name: 'PepsiCo' }]), { actor: 'c', now: NOW, people: PEOPLE.slice(0, 1) }, {
      run: (async () => { throw new Error('hubspot 502'); }) as any,
    });
    expect(r).toEqual({ ok: false, reason: 'routing_failed', detail: 'hubspot 502' });
  });

  it('nobody to route is a reason, and nothing runs', async () => {
    const run = vi.fn();
    expect(await routeAfterUse(personaStore([]), { actor: 'c', now: NOW, people: [] }, { run: run as any })).toEqual({ ok: false, reason: 'no_people' });
    expect(run).not.toHaveBeenCalled();
  });
});
