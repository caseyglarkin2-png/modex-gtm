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

describe('routeAfterUse', () => {
  it('runs the bounded routable scope (never the broad default), applies, and reads THAT run back', async () => {
    const run = vi.fn(async () => ({ runId: 'run-9', mode: 'shadow', accountsScanned: 7, pairs: 20, decisions: 20, skips: {}, byRule: {}, byAction: {}, dryRun: false })) as any;
    const listQueue = vi.fn(async () => ({ runId: 'run-9', items: [card('a', 916, 'enroll_gap_sequence', 'enroll')], nextCursor: null })) as any;
    const r = await routeAfterUse({} as any, { actor: 'casey@freightroll.com', now: NOW, people: PEOPLE.slice(0, 1) }, {
      resolveScope: async () => ({ hypothesesCount: 21, accountNames: ['PepsiCo', 'Kroger'] }),
      run,
      listQueue,
    });
    expect(r).toMatchObject({ ok: true, runId: 'run-9', counts: { ready: 1 } });
    expect(run.mock.calls[0][1]).toMatchObject({ dryRun: false, accountNames: ['PepsiCo', 'Kroger'], actor: 'casey@freightroll.com' });
    expect(listQueue.mock.calls[0][1]).toEqual({ runId: 'run-9', limit: 100 });
  });

  it('a scope over the cap is refused with the reason, and nothing is run', async () => {
    const run = vi.fn();
    const r = await routeAfterUse({} as any, { actor: 'c', now: NOW, people: [] }, { resolveScope: async () => ({ tooLarge: true, accountCount: 30, cap: 25 }), run: run as any });
    expect(r).toEqual({ ok: false, reason: 'routable_scope_too_large', detail: '30 accounts are in use; the interactive cap is 25.' });
    expect(run).not.toHaveBeenCalled();
  });

  it('a routing crash comes back as a reason to show inline, never a throw', async () => {
    const r = await routeAfterUse({} as any, { actor: 'c', now: NOW, people: [] }, {
      resolveScope: async () => ({ hypothesesCount: 1, accountNames: ['PepsiCo'] }),
      run: (async () => { throw new Error('hubspot 502'); }) as any,
    });
    expect(r).toEqual({ ok: false, reason: 'routing_failed', detail: 'hubspot 502' });
  });
});
