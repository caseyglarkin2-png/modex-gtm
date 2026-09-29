/**
 * Relationship context (Universal Work Intake, 2026-09-28): how Casey knows a
 * person reaches the six-line brief as CONTEXT (his, never evidence, never
 * sent by itself) and every first touch's immutable attribution carries the
 * work sources, so "do MMYQB subscribers become conversations?" is answerable
 * later (association, never claimed causation).
 */
import { describe, expect, it, vi } from 'vitest';
import { loadRelationshipContext, workSourcesFor } from '@/lib/gap/intake/context';
import { buildBrief } from '@/lib/gap/execution/six-line-brief';
import { captureSendAttribution } from '@/lib/gap/execution/send-attribution';

const members = [
  { kind: 'person', persona_id: 7, account_name: 'Acme Foods', relationship_context: 'MMYQB subscriber', note: null, ingested_at: new Date('2026-09-28T12:00:00Z'), work_source: { id: 's1', name: 'MMYQB LinkedIn subscribers', source_type: 'newsletter' } },
  { kind: 'person', persona_id: 7, account_name: 'Acme Foods', relationship_context: 'Met at Inland26', note: 'Asked about trailer staging', ingested_at: new Date('2026-09-29T15:00:00Z'), work_source: { id: 's2', name: 'Inland26 · Chicago', source_type: 'conference' } },
  { kind: 'account', persona_id: null, account_name: 'Acme Foods', relationship_context: null, note: null, ingested_at: new Date('2026-09-20T12:00:00Z'), work_source: { id: 's3', name: '2026 Top 100 shippers', source_type: 'target_list' } },
];
const prisma = (rows = members): any => ({ gapWorkSourceMember: { findMany: vi.fn(async ({ where }: any) => rows.filter((m) => (where.OR as any[]).some((o) => (o.persona_id !== undefined && m.persona_id === o.persona_id && m.kind === 'person') || (o.kind === 'account' && m.kind === 'account' && m.account_name === o.account_name)))) } });

describe('relationship context', () => {
  it('lists every source a person (and their account) came from, with Casey\'s own notes', async () => {
    const lines = await loadRelationshipContext(prisma(), { personaId: 7, accountName: 'Acme Foods' });
    expect(lines).toEqual([
      'Met at Inland26 (Inland26 · Chicago, Sep 29). Your note: "Asked about trailer staging"',
      'MMYQB subscriber (MMYQB LinkedIn subscribers, Sep 28)',
      'Acme Foods is on 2026 Top 100 shippers',
    ]);
  });

  it('no membership, no context (and a missing table never breaks the brief)', async () => {
    expect(await loadRelationshipContext(prisma([]), { personaId: 9, accountName: 'Globex' })).toEqual([]);
    expect(await loadRelationshipContext({} as never, { personaId: 9, accountName: 'Globex' })).toEqual([]);
  });

  it('the brief carries it as CONTEXT, apart from KNOW (context is never evidence)', () => {
    const brief = buildBrief({ hypothesis: { account_name: 'Acme Foods', signals: [], falsification_questions: [] }, firstName: 'Angi', angle: null, suggestedAngle: null, history: null, context: ['MMYQB subscriber (MMYQB LinkedIn subscribers, Sep 28)'] });
    expect(brief.context).toEqual(['MMYQB subscriber (MMYQB LinkedIn subscribers, Sep 28)']);
    expect(brief.know.fact).toBeNull();
  });
});

describe('send attribution knows the work sources', () => {
  it('the immutable attribution records every source for the person and the account', async () => {
    const p: any = {
      ...prisma(),
      prospectingHypothesis: { findUnique: vi.fn(async () => ({ problem_family: 'hidden_capacity', persona: 'vp_ops', signals: [] })) },
      persona: { findUnique: vi.fn(async () => ({ title: 'VP Ops', seniority: 'vp', role_in_deal: null })) },
      account: { findUnique: vi.fn(async () => ({ tier: 'Tier 1', hubspot_company_id: '1' })) },
      canonicalAccountLink: { findUnique: vi.fn(async () => null) },
      sequenceVersion: { findUnique: vi.fn(async () => null) },
    };
    const a = await captureSendAttribution(p, { hypothesisId: 'h1', personaId: 7, accountName: 'Acme Foods', stepIndex: 0, sequenceVersionId: null, at: new Date('2026-09-30T12:00:00Z') });
    expect('unrecorded' in a).toBe(false);
    expect((a as any).workSources).toEqual([
      { workSourceId: 's2', name: 'Inland26 · Chicago', sourceType: 'conference', relationshipContext: 'Met at Inland26', level: 'person' },
      { workSourceId: 's1', name: 'MMYQB LinkedIn subscribers', sourceType: 'newsletter', relationshipContext: 'MMYQB subscriber', level: 'person' },
      { workSourceId: 's3', name: '2026 Top 100 shippers', sourceType: 'target_list', relationshipContext: null, level: 'account' },
    ]);
  });

  it('workSourcesFor is empty (never a failure) when nothing is known', async () => {
    expect(await workSourcesFor(prisma([]), { personaId: null, accountName: 'Globex' })).toEqual([]);
  });
});
