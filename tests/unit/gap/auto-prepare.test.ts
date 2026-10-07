// @vitest-environment node
/**
 * Batch item 5, R33 (Casey's approved policy): automatic, REVERSIBLE preparation. A fresh verified claim no thesis
 * cites becomes a reviewable proposal through the one draft service, with no Draft press: never approved, activated,
 * routed or sent; never a twin; never for a story set aside; bounded per run; off without GAP_HYPOTHESIS_ENABLED.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTO_PREPARE_AUDIT, AUTO_PREPARE_MAX, prepareProposalsFromResearch } from '@/lib/gap/research/auto-prepare';

const NOW = new Date('2026-10-07T15:00:00Z');
const TULSA = 'PepsiCo will close its warehouse operations at its Tulsa, Oklahoma, production facility and shift duties to a new site in the area.';
const GATIK = 'PepsiCo and Gatik announced a multi-year agreement to deploy autonomous freight across its North America distribution network.';
const WMS = 'PepsiCo deployed a new warehouse management system across its Texas distribution centers.';

function world(links: Array<{ signal_id: string; status: string }> = []) {
  const signals = [
    { id: 's-tulsa', title: 'PepsiCo to cease warehouse operations', evidence_text: TULSA, claim_class: null, metadata: {} },
    { id: 's-gatik', title: 'PepsiCo and Gatik', evidence_text: GATIK, claim_class: null, metadata: {} },
    { id: 's-wms', title: 'PepsiCo WMS', evidence_text: WMS, claim_class: null, metadata: {} },
    { id: 's-denver', title: 'PepsiCo Denver', evidence_text: 'PepsiCo is building a 1.2 million square foot distribution center in Denver, opening in 2027.', claim_class: null, metadata: {} },
  ];
  const audit: unknown[] = [];
  const prisma = {
    hypothesisSignal: { findMany: vi.fn(async () => links.map((l) => ({ signal_id: l.signal_id, hypothesis: { status: l.status, account_name: 'PepsiCo' } }))) },
    prospectingSignal: { findMany: vi.fn(async ({ where }: { where: { id: { in: string[] } } }) => signals.filter((s) => where.id.in.includes(s.id))) },
    gapAuditEvent: { create: vi.fn(async ({ data }: { data: unknown }) => { audit.push(data); return { id: 'a' }; }) },
  };
  let n = 0;
  const draft = vi.fn(async (_p: unknown, i: { factId: string }) => ({ ok: true as const, hypothesisId: `h-${i.factId}-${(n += 1)}`, status: 'review_required', existing: false, existingVia: null, family: 'hidden_capacity', familyBasis: 'x', preparation: 'submitted' as const, missing: [], submitRefusal: null }));
  return { prisma, draft, audit };
}
const fact = (signalId: string, fresh = true) => ({ signalId, fresh });

describe('automatic reversible preparation (R33)', () => {
  beforeEach(() => {
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_HYPOTHESIS_ENABLED = 'true';
  });
  afterEach(() => {
    delete process.env.GAP_HYPOTHESIS_ENABLED;
  });

  it('a fresh verified claim no thesis cites is prepared through the one draft service, read off the fact, account-level, and audited; nothing beyond review', async () => {
    const w = world();
    const out = await prepareProposalsFromResearch(w.prisma, { accountName: 'PepsiCo', facts: [fact('s-tulsa')], actor: 'gap-background-research', now: NOW }, { draft: w.draft as never });
    expect(out).toEqual([{ factId: 's-tulsa', outcome: 'prepared', hypothesisId: 'h-s-tulsa-1', preparation: 'submitted', approach: 'event_led' }]);
    expect(w.draft).toHaveBeenCalledTimes(1);
    expect(w.draft.mock.calls[0][1]).toMatchObject({ accountName: 'PepsiCo', factId: 's-tulsa', personaId: null, problemFamily: null, problemHypothesis: expect.stringMatching(/closing the Tulsa, Oklahoma, production facility/), falsificationQuestions: [expect.stringMatching(/Tulsa/)], observation: expect.stringMatching(/\[S:s-tulsa\]\.$/) });
    expect(w.audit).toEqual([{ kind: AUTO_PREPARE_AUDIT, actor: 'gap-background-research', subject_type: 'prospecting_hypothesis', subject_id: 'h-s-tulsa-1', payload: { accountName: 'PepsiCo', factId: 's-tulsa', preparation: 'submitted', status: 'review_required', approach: 'event_led' } }]);
  });

  it('an ongoing partnership is prepared FIT-LED; a one-time software deployment opens nothing; a cited fact, a set-aside story and a stale fact are left alone', async () => {
    const w = world([{ signal_id: 's-denver', status: 'active' }, { signal_id: 's-tulsa', status: 'rejected' }]);
    const out = await prepareProposalsFromResearch(w.prisma, { accountName: 'PepsiCo', facts: [fact('s-gatik'), fact('s-wms'), fact('s-denver'), fact('s-tulsa'), { signalId: 's-gatik', fresh: false }], actor: 'a', now: NOW }, { draft: w.draft as never });
    expect(out.map((o) => [o.factId, o.outcome])).toEqual([['s-gatik', 'prepared'], ['s-wms', 'no_approach'], ['s-denver', 'cited'], ['s-tulsa', 'set_aside'], ['s-gatik', 'not_fresh']]);
    expect(out[0]).toMatchObject({ approach: 'fit_led' });
    expect(w.draft.mock.calls[0][1]).toMatchObject({ problemHypothesis: expect.stringMatching(/Gatik program/) });
  });

  it('a rerun answers the existing proposal (no twin, no audit); the draft service refusing a set-aside story is reported as set aside; bounded per run', async () => {
    const w = world();
    w.draft.mockResolvedValueOnce({ ok: true, hypothesisId: 'h-old', status: 'review_required', existing: true, existingVia: 'same_fact', family: 'hidden_capacity', familyBasis: 'x', preparation: 'submitted', missing: [], submitRefusal: null } as never);
    w.draft.mockResolvedValueOnce({ ok: false, reason: 'story_set_aside', detail: 'x' } as never);
    const out = await prepareProposalsFromResearch(w.prisma, { accountName: 'PepsiCo', facts: [fact('s-tulsa'), fact('s-gatik')], actor: 'a', now: NOW }, { draft: w.draft as never });
    expect(out).toEqual([{ factId: 's-tulsa', outcome: 'existing', hypothesisId: 'h-old', preparation: 'submitted' }, { factId: 's-gatik', outcome: 'set_aside' }]);
    expect(w.audit).toEqual([]);
    const many = world();
    const capped = await prepareProposalsFromResearch(many.prisma, { accountName: 'PepsiCo', facts: [fact('s-tulsa'), fact('s-gatik'), fact('s-denver')], actor: 'a', now: NOW }, { draft: many.draft as never });
    expect(capped.filter((o) => o.outcome === 'prepared')).toHaveLength(AUTO_PREPARE_MAX);
    expect(capped[AUTO_PREPARE_MAX]).toEqual({ factId: 's-denver', outcome: 'cap_reached' });
  });

  it('off without GAP_HYPOTHESIS_ENABLED: nothing is read or prepared', async () => {
    delete process.env.GAP_HYPOTHESIS_ENABLED;
    const w = world();
    expect(await prepareProposalsFromResearch(w.prisma, { accountName: 'PepsiCo', facts: [fact('s-tulsa')], actor: 'a', now: NOW }, { draft: w.draft as never })).toEqual([]);
    expect(w.draft).not.toHaveBeenCalled();
    expect(w.prisma.hypothesisSignal.findMany).not.toHaveBeenCalled();
  });
});
