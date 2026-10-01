/**
 * Phase 2 F: IN DEALS + DEAL BRIEF v0. When HubSpot says the account has an
 * open deal, GAP stops cold prospecting there but stays useful: it lists the
 * account under In Deals (live truth, UNKNOWN listed separately) and shows a
 * read-only Deal Brief filled ONLY from human-confirmed buyer truth, with
 * every empty section shown as UNKNOWN and one next learning objective that
 * Casey owns (a machine suggestion is labelled as one). No HubSpot writes.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { buildDealBrief, loadDealBrief, setLearningObjective, DEAL_OBJECTIVE, TRUTH_SECTIONS } from '@/lib/gap/deals/deal-brief';
import { heldDealAccounts, stageLabel } from '@/lib/gap/deals/in-deals';
import { DealBriefView } from '@/components/gap/deal-brief';
import { resolveOpportunity } from '@/lib/gap/opportunity/active-opportunity';

const NOW = new Date('2026-09-28T15:00:00.000Z');
const bid = (over: Record<string, unknown>) => ({
  id: 'b1',
  type: 'business_problem',
  raw_buyer_language: 'Trucks wait two hours at the gate on Mondays.',
  normalized_summary: null,
  contact_email: 'ops@kroger.com',
  source: 'meeting',
  human_confirmed: true,
  confirmed_by: 'casey@freightroll.com',
  confirmed_at: new Date('2026-09-20T12:00:00Z'),
  supersedes_id: null,
  ai_extracted: false,
  captured_at: new Date('2026-09-20T12:00:00Z'),
  ...over,
});
const disp = (over: Record<string, unknown>) => ({
  id: 'd1',
  response_class: 'meeting_accepted',
  contact_email: 'ops@kroger.com',
  channel: 'meeting',
  buyer_language: null,
  next_best_action: null,
  human_confirmed: true,
  confirmed_by: 'casey@freightroll.com',
  confirmed_at: new Date('2026-09-21T12:00:00Z'),
  created_at: new Date('2026-09-21T12:00:00Z'),
  ...over,
});
const people = [{ email: 'ops@kroger.com', name: 'Dana Ops', title: 'Director, DC Operations' }];
const base = { accountName: 'Kroger', bids: [], dispositions: [], evidenceConflicts: [], people, dealContacts: 0, objective: null, meetingObjective: null };

describe('buildDealBrief: confirmed buyer truth only', () => {
  it('maps each confirmed BID type to its section with who said it, the source and who confirmed it', () => {
    const b = buildDealBrief({
      ...base,
      bids: [
        bid({ id: 'cs', type: 'current_state', raw_buyer_language: 'We check trailers in on paper.' }),
        bid({ id: 'bp' }),
        bid({ id: 'rc', type: 'root_cause', raw_buyer_language: 'Carriers all arrive at 6am.' }),
        bid({ id: 'im', type: 'impact', raw_buyer_language: 'Detention runs us six figures.' }),
        bid({ id: 'me', type: 'metric', raw_buyer_language: 'Dwell is 3.5 hours average.' }),
        bid({ id: 'fs', type: 'future_state', raw_buyer_language: 'We want drivers through in 20 minutes.' }),
        bid({ id: 'co', type: 'constraint', raw_buyer_language: 'It has to work with our WMS.' }),
      ],
    });
    expect(b.sections.current_state.map((e) => e.quote)).toEqual(['We check trailers in on paper.']);
    expect(b.sections.problem[0]).toMatchObject({ quote: 'Trucks wait two hours at the gate on Mondays.', who: 'Dana Ops', source: 'meeting', confirmedBy: 'casey@freightroll.com' });
    expect(b.sections.root_cause).toHaveLength(1);
    expect(b.sections.business_impact.map((e) => e.quote)).toEqual(['Detention runs us six figures.', 'Dwell is 3.5 hours average.']);
    expect(b.sections.future_state).toHaveLength(1);
    expect(b.sections.requirements).toHaveLength(1);
    expect(b.unknowns).toEqual([]);
    expect(b.known).toBe(6);
  });

  it('an unconfirmed (machine proposed) or superseded BID is never buyer truth', () => {
    const b = buildDealBrief({
      ...base,
      bids: [
        bid({ id: 'ai', human_confirmed: false, ai_extracted: true, raw_buyer_language: 'AI thinks the gate is slow.' }),
        bid({ id: 'old', type: 'root_cause', raw_buyer_language: 'Old claim.' }),
        bid({ id: 'fix', type: 'root_cause', raw_buyer_language: 'Corrected, not confirmed yet.', human_confirmed: false, supersedes_id: 'old' }),
      ],
    });
    expect(b.sections.problem).toEqual([]);
    expect(b.sections.root_cause).toEqual([]);
    expect(b.known).toBe(0);
  });

  it('every empty section is listed as UNKNOWN', () => {
    const b = buildDealBrief({ ...base, bids: [bid({})] });
    expect(b.unknowns).toEqual(TRUTH_SECTIONS.filter((s) => s !== 'problem'));
    expect(b.known).toBe(1);
  });

  it('stakeholders are the BID speakers plus the HubSpot deal contacts (count)', () => {
    const b = buildDealBrief({ ...base, bids: [bid({}), bid({ id: 'x', contact_email: 'vp@kroger.com', type: 'impact' })], dealContacts: 3 });
    expect(b.stakeholders).toEqual([
      { who: 'Dana Ops', title: 'Director, DC Operations', email: 'ops@kroger.com' },
      { who: 'vp@kroger.com', title: null, email: 'vp@kroger.com' },
    ]);
    expect(b.dealContacts).toBe(3);
  });

  it('buyer commitments come from confirmed meeting_accepted outcomes only', () => {
    const b = buildDealBrief({
      ...base,
      dispositions: [disp({ next_best_action: 'Walk the Delaware yard' }), disp({ id: 'd2', human_confirmed: false, confirmed_by: null, confirmed_at: null }), disp({ id: 'd3', response_class: 'no_signal' })],
    });
    expect(b.commitments).toEqual([{ what: 'Agreed to a meeting', who: 'Dana Ops', at: '2026-09-21T12:00:00.000Z', confirmedBy: 'casey@freightroll.com', next: 'Walk the Delaware yard' }]);
  });

  it('contradictions: a confirmed problem and a rejected problem, buyer objections, and conflicting public facts', () => {
    const b = buildDealBrief({
      ...base,
      bids: [bid({ id: 'ob', type: 'objection', raw_buyer_language: 'We already use a YMS at two sites.' })],
      dispositions: [disp({ response_class: 'problem_confirmed', buyer_language: 'Yes the gate backs up.' }), disp({ id: 'd2', response_class: 'problem_rejected', contact_email: 'vp@kroger.com' })],
      evidenceConflicts: [{ site: 'Columbus DC' }],
    });
    expect(b.contradictions).toEqual([
      'Dana Ops confirmed the problem (Sep 21); vp@kroger.com rejected it (Sep 21).',
      'Objection from Dana Ops: "We already use a YMS at two sites."',
      'Public facts disagree about Columbus DC.',
    ]);
  });
});

describe('the next learning objective is Casey’s', () => {
  it('Casey’s own objective wins over a meeting objective and a suggestion', () => {
    const b = buildDealBrief({ ...base, objective: { text: 'Who signs for yard spend?', by: 'casey@freightroll.com', at: '2026-09-27T00:00:00.000Z' }, meetingObjective: { text: 'Walk the yard', by: 'casey@freightroll.com', at: '2026-09-26T00:00:00.000Z' } });
    expect(b.objective).toEqual({ text: 'Who signs for yard spend?', owned: true, from: 'set', by: 'casey@freightroll.com', at: '2026-09-27T00:00:00.000Z' });
  });

  it('a meeting’s next learning objective (typed by Casey at capture) is used when none is set', () => {
    const b = buildDealBrief({ ...base, meetingObjective: { text: 'Walk the yard', by: 'casey@freightroll.com', at: '2026-09-26T00:00:00.000Z' } });
    expect(b.objective).toMatchObject({ text: 'Walk the yard', owned: true, from: 'meeting' });
  });

  it('otherwise a machine suggestion, labelled as one, aimed at the first unknown', () => {
    expect(buildDealBrief(base).objective).toEqual({ text: 'Learn the problem in their words: what breaks in their yards, and how often?', owned: false });
    expect(buildDealBrief({ ...base, bids: [bid({})] }).objective).toEqual({ text: 'Learn how their yards run today: how trailers are checked in, found and moved.', owned: false });
  });

  it('setLearningObjective appends an audit row on the account; empty, too long or unknown account is refused', async () => {
    const create = vi.fn(async () => ({ created_at: NOW }));
    const prisma = { account: { findUnique: vi.fn(async ({ where }: { where: { name: string } }) => (where.name === 'Kroger' ? { name: 'Kroger' } : null)) }, gapAuditEvent: { create } };
    expect(await setLearningObjective(prisma, { accountName: 'Kroger', text: '  ', actor: 'c@x' })).toEqual({ ok: false, reason: 'empty' });
    expect(await setLearningObjective(prisma, { accountName: 'Kroger', text: 'x'.repeat(241), actor: 'c@x' })).toEqual({ ok: false, reason: 'too_long' });
    expect(await setLearningObjective(prisma, { accountName: 'Nope', text: 'Who signs?', actor: 'c@x' })).toEqual({ ok: false, reason: 'account_not_found' });
    const r = await setLearningObjective(prisma, { accountName: 'Kroger', text: ' Who  signs? ', actor: 'c@x' });
    expect(r).toMatchObject({ ok: true, objective: { text: 'Who signs?', by: 'c@x' } });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: { kind: DEAL_OBJECTIVE, actor: 'c@x', subject_type: 'account', subject_id: 'Kroger', payload: { text: 'Who signs?' } } }));
  });
});

describe('loadDealBrief reads (never writes)', () => {
  it('reads the account’s BIDs, confirmed dispositions, people, objectives and conflicts', async () => {
    const audit = vi.fn(async ({ where }: { where: { kind: string } }) =>
      where.kind === DEAL_OBJECTIVE
        ? [{ actor: 'c@x', payload: { text: 'Who signs?' }, created_at: NOW }]
        : [{ actor: 'c@x', payload: { accountName: 'Kroger', nextLearningObjective: 'Walk the yard' }, created_at: NOW }],
    );
    const prisma = {
      buyerInputData: { findMany: vi.fn(async () => [bid({})]) },
      conversationDisposition: { findMany: vi.fn(async () => [disp({})]) },
      persona: { findMany: vi.fn(async () => people) },
      gapAuditEvent: { findMany: audit },
    };
    const b = await loadDealBrief(prisma, 'Kroger', { now: NOW, dealContacts: 2, conflicts: async () => [] });
    expect(b.sections.problem).toHaveLength(1);
    expect(b.commitments).toHaveLength(1);
    expect(b.objective).toMatchObject({ text: 'Who signs?', owned: true });
    expect(prisma.conversationDisposition.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { account_name: 'Kroger', human_confirmed: true } }));
  });
});

describe('In Deals', () => {
  it('the tile counts accounts routing holds for an open deal (one per account)', () => {
    const items = [
      { ruleId: 'active_opportunity', account: { name: 'Kroger' } },
      { ruleId: 'active_opportunity', account: { name: 'Kroger' } },
      { ruleId: 'opportunity_unknown', account: { name: 'UNFI' } },
      { ruleId: 'evidence_thin', account: { name: 'PepsiCo' } },
    ];
    expect(heldDealAccounts(items)).toEqual(['Kroger']);
  });

  it('stage ids read as words; a custom stage says so', () => {
    expect(stageLabel('contractsent')).toBe('Contract sent');
    expect(stageLabel('1417384082')).toBe('Custom stage 1417384082');
    expect(stageLabel(null)).toBe('Stage unknown');
  });
});

describe('deal last activity is read from HubSpot', () => {
  it('an open deal carries its last activity (notes_last_updated, else hs_lastmodifieddate)', async () => {
    const reads = {
      companiesByDomains: async () => ({ companies: [{ id: 'c', name: 'Kroger' }], truncated: false }),
      companiesByNames: async () => ({ companies: [], truncated: false }),
      companiesById: async () => ({ companies: [], missing: [] }),
      associations: async (from: string) => ({ byId: new Map(from === 'companies' ? [['c', ['d1', 'd2']]] : []), truncated: false }),
      readDeals: async () => [
        { id: 'd1', properties: { dealname: 'A', dealstage: 's', pipeline: 'p', hs_is_closed: 'false', notes_last_updated: '2026-09-25T00:00:00Z', hs_lastmodifieddate: '2026-09-26T00:00:00Z' } },
        { id: 'd2', properties: { dealname: 'B', dealstage: 's', pipeline: 'p', hs_is_closed: 'false', hs_lastmodifieddate: '2026-09-24T00:00:00Z' } },
      ],
    };
    const t = await resolveOpportunity({ accountName: 'Kroger', hubspotCompanyId: null, domains: ['kroger.com'], contactIds: [] }, reads as never);
    expect(t.status).toBe('ACTIVE');
    if (t.status !== 'ACTIVE') return;
    expect(t.deals.map((d) => d.lastActivityAt)).toEqual(['2026-09-25T00:00:00.000Z', '2026-09-24T00:00:00.000Z']);
  });
});

describe('F4: no HubSpot writes from the deals surface', () => {
  it('the deals modules, route and view import no HubSpot client or write helper', () => {
    const root = path.resolve(__dirname, '../../..');
    const files = [
      ...readdirSync(path.join(root, 'src/lib/gap/deals')).map((f) => path.join(root, 'src/lib/gap/deals', f)),
      path.join(root, 'src/app/api/gap/deals/objective/route.ts'),
      path.join(root, 'src/components/gap/deal-brief.tsx'),
    ];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/@\/lib\/hubspot|hubspot-mirror|getHubSpotClient|basicApi\.(create|update)|batchApi\.(create|update)/);
    }
  });
});

describe('<DealBriefView>', () => {
  it('shows UNKNOWN for every empty section, the quote and who confirmed it, and labels a suggestion', () => {
    const b = buildDealBrief({ ...base, bids: [bid({})], dealContacts: 2 });
    render(<DealBriefView brief={b} deals={[{ name: 'YardFlow - Kroger', stage: 'Appointment scheduled', lastActivityAt: '2026-09-25T00:00:00.000Z' }]} />);
    expect(screen.getByTestId('deal-brief-problem')).toHaveTextContent('Trucks wait two hours at the gate on Mondays.');
    expect(screen.getByTestId('deal-brief-problem')).toHaveTextContent('Dana Ops');
    expect(screen.getByTestId('deal-brief-problem')).toHaveTextContent('confirmed by casey@freightroll.com');
    for (const s of ['current_state', 'root_cause', 'business_impact', 'future_state', 'requirements']) expect(screen.getByTestId(`deal-brief-${s}`)).toHaveTextContent('UNKNOWN');
    expect(screen.getByTestId('deal-brief-objective')).toHaveTextContent('Suggested (not yours yet)');
    expect(screen.getByTestId('deal-brief-known')).toHaveTextContent('1 of 6 known');
  });
});

describe('review F fixes', () => {
  it('a confirmed problem on one thesis and a rejected problem on another is NOT a contradiction', () => {
    const b = buildDealBrief({ ...base, dispositions: [disp({ response_class: 'problem_confirmed', hypothesis_id: 'h1' }), disp({ id: 'd2', response_class: 'problem_rejected', hypothesis_id: 'h2' })] });
    expect(b.contradictions).toEqual([]);
  });

  it('a newer meeting objective beats an older one Casey set', () => {
    const b = buildDealBrief({ ...base, objective: { text: 'Old', by: 'c@x', at: '2026-09-01T00:00:00.000Z' }, meetingObjective: { text: 'Walk the yard', by: 'c@x', at: '2026-09-28T00:00:00.000Z' } });
    expect(b.objective).toMatchObject({ text: 'Walk the yard', from: 'meeting' });
  });

});
