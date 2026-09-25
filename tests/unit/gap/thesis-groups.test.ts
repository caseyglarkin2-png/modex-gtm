import { describe, expect, it } from 'vitest';
import { groupSiblings, thesisFingerprint, type ThesisRow } from '@/lib/gap/hypothesis/siblings';
import { evidenceDepth, type DepthSignal } from '@/lib/gap/research/depth';

const row = (id: string, persona: number, over: Partial<ThesisRow> = {}): ThesisRow => ({
  id,
  account_name: 'PepsiCo',
  problem_family: 'hidden_capacity',
  observation: 'PEP 10-Q (2026-07-09) mentions: capital expenditure [S:s1].',
  problem_hypothesis: 'My guess is that physical handoffs constrain production capacity at PepsiCo.',
  root_cause_hypotheses: ['Gate waiting', 'Trailer search'],
  impact_hypotheses: ['Fewer turns'],
  falsification_questions: ['How many trailers wait at the gate?'],
  what_a_no_means: 'Closed.',
  status: 'draft',
  primary_persona_id: persona,
  signalIds: ['s1'],
  ...over,
});

describe('sibling thesis groups', () => {
  it('identical thesis + different persona (and status) groups together', () => {
    const groups = groupSiblings([row('a', 916), row('b', 928), row('c', 1016, { status: 'active' })]);
    expect(groups).toHaveLength(1);
    expect(groups[0].members.map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });

  it('same account + family but different evidence does NOT group (Casey note linked to one row)', () => {
    expect(groupSiblings([row('a', 916), row('b', 1027, { signalIds: ['s1', 'note-1'] })])).toEqual([]);
  });

  it('same account + family but a materially different hypothesis or root causes does NOT group', () => {
    expect(groupSiblings([row('a', 1), row('b', 2, { problem_hypothesis: 'My guess is the bottler network, not the plants, sets the pace.' })])).toEqual([]);
    expect(groupSiblings([row('a', 1), row('b', 2, { root_cause_hypotheses: ['Bottler handoffs'] })])).toEqual([]);
  });

  it('whitespace, case and list order do not split a group; a singleton is not a group', () => {
    expect(thesisFingerprint(row('a', 1))).toBe(thesisFingerprint(row('b', 2, { root_cause_hypotheses: ['trailer search', 'Gate  waiting'] })));
    expect(groupSiblings([row('a', 1)])).toEqual([]);
  });
});

const sig = (id: string, over: Partial<DepthSignal> = {}): DepthSignal => ({ id, source_kind: 'evidence_record', source_type: 'public_primary', evidence_url: null, evidence_text: 'x', title: id, ...over });

describe('evidence depth (independence by origin)', () => {
  it('an unquoted keyword trigger counts as no source: INSUFFICIENT', () => {
    expect(evidenceDepth([sig('k', { source_kind: 'pounce_trigger', evidence_url: 'https://www.sec.gov/Archives/edgar/data/77476/000007747626000035/pep.htm', evidence_text: '' })])).toMatchObject({ independentSources: 0, label: 'INSUFFICIENT', keywordOnly: 1 });
  });

  it('two passages of the same filing are one source (SINGLE-SOURCE, still approvable)', () => {
    const f = 'https://www.sec.gov/Archives/edgar/data/56873/000110465926108926/kr-10q.htm';
    expect(evidenceDepth([sig('a', { evidence_url: f, evidence_text: 'We will acquire Giant Eagle, Inc.' }), sig('b', { evidence_url: f, evidence_text: 'Another passage of the same 10-Q.' })])).toMatchObject({ independentSources: 1, label: 'SINGLE-SOURCE' });
  });

  it('the same syndicated excerpt at two URLs counts once', () => {
    const t = 'Kroger will build a new distribution center in Kentucky while it closes three others.';
    expect(evidenceDepth([sig('a', { evidence_url: 'https://news-a.example/story', evidence_text: t, source_type: 'public_secondary' }), sig('b', { evidence_url: 'https://news-b.example/reprint', evidence_text: `  ${t} `, source_type: 'public_secondary' })]).independentSources).toBe(1);
  });

  it('a filing plus an independent trade report is CORROBORATED; plus operator knowledge is WELL-SUPPORTED', () => {
    const d = evidenceDepth([
      sig('a', { evidence_url: 'https://www.sec.gov/Archives/edgar/data/56873/000110465926079552/8k.htm', evidence_text: 'will acquire Giant Eagle, Inc.' }),
      sig('b', { evidence_url: 'https://www.supplychaindive.com/news/kroger-giant-eagle', evidence_text: 'Kroger plans to fold Giant Eagle distribution into its network.', source_type: 'public_secondary' }),
    ]);
    expect(d).toMatchObject({ independentSources: 2, label: 'CORROBORATED' });
    expect(evidenceDepth([...['a', 'b'].map((id, i) => sig(id, { evidence_url: `https://x${i}.example/p`, evidence_text: `fact ${i} about sites` })), sig('n', { source_kind: 'operator_knowledge', evidence_text: 'bottler network' })]).label).toBe('WELL-SUPPORTED');
  });
});

describe('orderGroupsForReview', async () => {
  const { orderGroupsForReview } = await import('@/lib/gap/hypothesis/thesis-groups');
  const g = (name: string, reviewable: number, n: number, members: number) => ({ name, reviewable, members: Array(members).fill(0), depth: { independentSources: n, label: 'x', origins: [], keywordOnly: 0 } as any });
  it('pending groups first, corroborated before single-source, then most people unlocked by one research action', () => {
    const order = orderGroupsForReview([g('done', 0, 3, 4), g('single-5', 5, 1, 5), g('corr-2', 2, 2, 2), g('single-3', 3, 1, 3), g('none-8', 5, 0, 8)]).map((x) => x.name);
    expect(order).toEqual(['corr-2', 'single-5', 'none-8', 'single-3', 'done']);
  });
});
