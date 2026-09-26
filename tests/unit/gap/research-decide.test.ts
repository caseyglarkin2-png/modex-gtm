import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/hubspot/client', () => ({ getHubSpotClient: vi.fn(), isHubSpotConfigured: () => false, withHubSpotRetry: vi.fn() }));

import { decideResearchProposal, isFromResearchRun } from '@/lib/gap/research/decide';

const NOW = new Date('2026-09-26T15:00:00Z');

function store(rows: Array<{ id: string; status: string; source_ref: string | null; primary_persona_id: number | null }>) {
  return {
    prospectingHypothesis: {
      findMany: vi.fn(async ({ where }: any) =>
        rows.filter((r) => where.id.in.includes(r.id)).map((r) => ({ ...r, primary_persona: { name: `p${r.primary_persona_id}` } })),
      ),
    },
  } as any;
}

/** A state machine fake that records every legal transition it was asked for. */
function machine(statuses: Record<string, string>) {
  const calls: Array<[string, string]> = [];
  const next: Record<string, Record<string, string>> = {
    draft: { submit: 'review_required', withdraw: 'rejected' },
    review_required: { approve: 'approved', withdraw: 'rejected' },
    approved: { activate: 'active', withdraw: 'rejected' },
  };
  const transition = vi.fn(async (_p: unknown, id: string, action: string) => {
    calls.push([id, action]);
    const to = next[statuses[id]]?.[action];
    if (!to) return { ok: false as const, reason: `ILLEGAL_TRANSITION:${statuses[id]}:${action}` };
    const from = statuses[id];
    statuses[id] = to;
    return { ok: true as const, from, to, effects: [] };
  });
  return { transition: transition as any, calls };
}

const RUN = 'rr-1';

describe('decideResearchProposal', () => {
  it('APPROVE + USE is ONE call: submit, approve and activate per draft (each a real audited transition), then ONE targeted routing of exactly those people', async () => {
    const rows = [
      { id: 'h1', status: 'draft', source_ref: `research:${RUN}`, primary_persona_id: 1886 },
      { id: 'h2', status: 'draft', source_ref: `research:${RUN}:p1788`, primary_persona_id: 1788 },
    ];
    const m = machine({ h1: 'draft', h2: 'draft' });
    const routeAfterUse = vi.fn(async () => ({ ok: true as const, runId: 'run-9', people: [], counts: {} as any, failures: [] }));
    const r = await decideResearchProposal(store(rows), { researchRunId: RUN, hypothesisIds: ['h1', 'h2'], decision: 'approve_and_use', actor: 'casey', now: NOW }, { transition: m.transition, routeAfterUse });
    expect(m.calls).toEqual([
      ['h1', 'submit'], ['h1', 'approve'], ['h1', 'activate'],
      ['h2', 'submit'], ['h2', 'approve'], ['h2', 'activate'],
    ]);
    expect('results' in r && r.results.map((x) => [x.hypothesisId, x.ok, x.to])).toEqual([['h1', true, 'active'], ['h2', true, 'active']]);
    expect(routeAfterUse).toHaveBeenCalledTimes(1);
    expect((routeAfterUse.mock.calls[0] as any[])[1]).toMatchObject({ actor: 'casey', people: [{ personaId: 1886, name: 'p1886' }, { personaId: 1788, name: 'p1788' }] });
    // Every transition carries the operator and the reason (the audit trail).
    expect(m.transition.mock.calls[0][3]).toMatchObject({ actor: 'casey', reason: `research proposal ${RUN}: approve + use` });
  });

  it('REJECT withdraws each draft and routes nothing', async () => {
    const m = machine({ h1: 'draft' });
    const routeAfterUse = vi.fn();
    const r = await decideResearchProposal(store([{ id: 'h1', status: 'draft', source_ref: `research:${RUN}`, primary_persona_id: 1 }]), { researchRunId: RUN, hypothesisIds: ['h1'], decision: 'reject', actor: 'casey', now: NOW }, { transition: m.transition, routeAfterUse: routeAfterUse as any });
    expect(m.calls).toEqual([['h1', 'withdraw']]);
    expect(r).toMatchObject({ ok: true, routing: null, results: [{ hypothesisId: 'h1', to: 'rejected' }] });
    expect(routeAfterUse).not.toHaveBeenCalled();
  });

  it('refuses a hypothesis this research run did not propose, and moves nothing', async () => {
    const m = machine({ h1: 'draft', hX: 'draft' });
    const rows = [
      { id: 'h1', status: 'draft', source_ref: `research:${RUN}`, primary_persona_id: 1 },
      { id: 'hX', status: 'draft', source_ref: 'research:other-run', primary_persona_id: 2 },
    ];
    const r = await decideResearchProposal(store(rows), { researchRunId: RUN, hypothesisIds: ['h1', 'hX'], decision: 'approve_and_use', actor: 'c', now: NOW }, { transition: m.transition });
    expect(r).toEqual({ ok: false, reason: 'not_from_this_research', ids: ['hX'] });
    expect(m.calls).toEqual([]);
  });

  it('an unknown id is not_found', async () => {
    expect(await decideResearchProposal(store([]), { researchRunId: RUN, hypothesisIds: ['nope'], decision: 'reject', actor: 'c', now: NOW })).toEqual({ ok: false, reason: 'not_found', ids: ['nope'] });
  });

  it('source refs: the run itself and its per-person siblings only', () => {
    expect(isFromResearchRun(`research:${RUN}`, RUN)).toBe(true);
    expect(isFromResearchRun(`research:${RUN}:p42`, RUN)).toBe(true);
    expect(isFromResearchRun(`research:${RUN}0`, RUN)).toBe(false);
    expect(isFromResearchRun(null, RUN)).toBe(false);
  });
});
