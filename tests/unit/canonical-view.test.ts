import { describe, expect, it } from 'vitest';
import {
  adaptCanonicalView,
  formatRevenue,
  formatCount,
  formatIndustry,
  formatSegment,
  sourceCode,
  initialsOf,
  deriveContactStage,
  deriveAccountStage,
  type RawCanonicalCampaign,
} from '@/lib/campaigns/canonical-view';

describe('formatters', () => {
  it('formats revenue to compact USD', () => {
    expect(formatRevenue('164683000000')).toBe('$164.7B');
    expect(formatRevenue('16603000000')).toBe('$16.6B');
    expect(formatRevenue('850000000')).toBe('$850M');
    expect(formatRevenue('31784000000')).toBe('$31.8B');
    expect(formatRevenue('2000000000000')).toBe('$2T');
    expect(formatRevenue(null)).toBe('');
    expect(formatRevenue('')).toBe('');
  });

  it('formats employee counts with separators', () => {
    expect(formatCount('470000')).toBe('470,000');
    expect(formatCount('29000')).toBe('29,000');
    expect(formatCount(null)).toBe('');
  });

  it('maps industry enums to readable labels', () => {
    expect(formatIndustry('RETAIL')).toBe('Retail');
    expect(formatIndustry('WHOLESALE')).toBe('Wholesale Distribution');
    expect(formatIndustry('FOOD_BEVERAGES')).toBe('Food & Beverage');
    expect(formatIndustry('SUPERMARKETS')).toBe('Supermarkets & Grocery');
    expect(formatIndustry('SOME_UNKNOWN_ENUM')).toBe('Some Unknown Enum');
  });

  it('maps segment slugs to readable labels', () => {
    expect(formatSegment('building_materials_industrial')).toBe('Building Materials / Industrial');
    expect(formatSegment('cpg_food_beverage')).toBe('CPG · Food & Beverage');
    expect(formatSegment('mystery_segment')).toBe('Mystery Segment');
  });

  it('maps source names to chip codes', () => {
    expect(sourceCode('hubspot')).toBe('HS');
    expect(sourceCode('posthog')).toBe('PH');
    expect(sourceCode('apollo')).toBe('AP');
    expect(sourceCode('modex')).toBe('ICP+HS');
    expect(sourceCode(null)).toBe('HS');
  });

  it('derives initials', () => {
    expect(initialsOf('Shawn Mitchell')).toBe('SM');
    expect(initialsOf('Jen Harper')).toBe('JH');
    expect(initialsOf('Madonna')).toBe('MA');
  });
});

describe('stage derivation', () => {
  it('derives contact stage from draft status with no events', () => {
    const person = {
      id: 1,
      accountId: 1,
      name: 'X',
      role: 'r',
      facts: {},
      why: null,
      draft: { source: 'modex', status: 'draft', subject: 's' },
      events: [],
      web: null,
      nextStep: null,
    };
    expect(deriveContactStage(person as never)).toBe('draft');
  });

  it('prefers replied/opened/sent from events', () => {
    const person = {
      id: 1,
      accountId: 1,
      name: 'X',
      role: 'r',
      facts: {},
      why: null,
      draft: { source: 'modex', status: 'draft', subject: 's' },
      events: [{ type: 'Opened', when: null, source: 'gmail' }],
      web: null,
      nextStep: null,
    };
    expect(deriveContactStage(person as never)).toBe('opened');
  });

  it('takes the strongest account stage across the committee', () => {
    expect(deriveAccountStage(['draft', 'sent', 'opened'])).toBe('opened');
    expect(deriveAccountStage(['draft', 'draft'])).toBe('draft');
    expect(deriveAccountStage([])).toBe('draft');
  });
});

const SAMPLE: RawCanonicalCampaign = {
  campaign: {
    tag: 'allentown-tour',
    funnel: [
      { stage: 'contacts', count: 7 },
      { stage: 'drafts', count: 7 },
      { stage: 'sent', count: 0 },
      { stage: 'opened', count: 0 },
      { stage: 'replied', count: 0 },
      { stage: 'booked', count: 0 },
    ],
    liveSite: { name: 'Allentown', city: 'Allentown PA' },
  },
  sources: [
    { code: 'HS', label: 'HubSpot', kind: 'CRM', syncedAt: '2026-06-15T13:00:00+00:00', fresh: true },
    { code: 'AP', label: 'Apollo', kind: 'Enrichment', syncedAt: null, fresh: false },
  ],
  accounts: [
    {
      id: 721,
      name: 'The Home Depot',
      domain: 'homedepot.com',
      pulse: 43.3,
      tam: 'in',
      facts: {
        industry: { value: 'RETAIL', source: 'hubspot', observed_at: null, verified: true },
        revenue: { value: '164683000000', source: 'hubspot', observed_at: null, verified: true },
        employees: { value: '470000', source: 'hubspot', observed_at: null, verified: true },
        hq: {},
        tamSegment: {
          value: 'building_materials_industrial',
          source: 'hubspot',
          observed_at: null,
          verified: true,
        },
      },
      conflicts: [],
      signals: [{ label: 'Qualified', detail: 'x2', source: 'hubspot' }],
      why: 'reason',
      web: { sessions: 0, identified: false, lastSeen: null, pages: [], matchEdge: null },
      committee: [4989],
      nextAction: { do: 'Advance the committee', owner: 'casey', priority: 'normal' },
    },
    {
      id: 756,
      name: 'Keurig Dr Pepper',
      domain: 'keurigdrpepper.com',
      pulse: 1.8,
      tam: 'in',
      facts: {
        industry: { value: 'FOOD_BEVERAGES', source: 'hubspot', observed_at: null, verified: true },
        revenue: { value: '16603000000', source: 'hubspot', observed_at: null, verified: true },
        employees: { value: '29000', source: 'hubspot', observed_at: null, verified: true },
        hq: {},
      },
      conflicts: [
        {
          field: 'employees',
          winner: { value: '29000', source: 'hubspot', note: 'verified' },
          loser: { value: '8620', source: 'hubspot', note: 'older' },
          why: 'most recent verified wins',
          rule: 'most-recent verified source wins',
          override: false,
        },
      ],
      signals: [{ label: 'Anonymous visits', detail: '1', source: 'posthog' }],
      why: 'reason2',
      web: {
        sessions: 1,
        identified: false,
        lastSeen: '2026-06-12T17:56:03.845000+00:00',
        pages: [],
        matchEdge: null,
      },
      committee: [4990],
      nextAction: { do: 'Advance the committee', owner: 'casey', priority: 'normal' },
    },
  ],
  persons: [
    {
      id: 4989,
      accountId: 721,
      name: 'Alan Kwong',
      role: 'Logistics Manager',
      facts: {
        title: { value: 'Logistics Manager', source: 'hubspot', observed_at: null, verified: false },
        titleConflict: null,
      },
      why: 'why person',
      draft: { source: 'modex', status: 'draft', subject: 'A live yard running in eastern PA' },
      events: [{ type: 'Draft prepared', when: null, source: 'modex', detail: 'd', strong: false }],
      web: { sessions: 0, identified: false, lastSeen: null, pages: [], matchEdge: null },
      nextStep: 'Review and send draft',
    },
    {
      id: 4990,
      accountId: 756,
      name: 'Jamie Taylor',
      role: 'Regional Manager',
      facts: {
        title: { value: 'Regional Manager', source: 'hubspot', observed_at: null, verified: false },
        titleConflict: null,
      },
      why: 'why person 2',
      draft: { source: 'modex', status: 'draft', subject: 'subj' },
      events: [],
      web: { sessions: 0, identified: false, lastSeen: null, pages: [], matchEdge: null },
      nextStep: 'Review and send draft',
    },
  ],
  counts: { accounts: 2, persons: 2 },
};

describe('adaptCanonicalView', () => {
  const view = adaptCanonicalView(SAMPLE);

  it('renders the true funnel counts (0 sent)', () => {
    const sent = view.funnel.find((s) => s.stage === 'sent');
    expect(sent?.count).toBe(0);
    expect(view.funnel.find((s) => s.stage === 'contacts')?.count).toBe(7);
  });

  it('keeps the live site as Primo Brands / Breinigsville', () => {
    expect(view.liveSite.name).toBe('Primo Brands');
    expect(view.liveSite.city).toBe('Breinigsville, PA');
  });

  it('formats account firmographics and preserves provenance', () => {
    const hd = view.accounts[0];
    expect(hd.name).toBe('The Home Depot');
    expect(hd.icp).toBe(1);
    expect(hd.revenue.v).toBe('$164.7B');
    expect(hd.revenue.src).toBe('HS');
    expect(hd.industry.v).toBe('Retail');
    expect(hd.employees.v).toBe('470,000');
    expect(hd.dcs.v).toBe('Building Materials / Industrial');
  });

  it('maps conflicts to the component shape and flags the field', () => {
    const kdp = view.accounts[1];
    expect(kdp.conflicts).toHaveLength(1);
    const c = kdp.conflicts[0];
    expect(c.field).toBe('Employees');
    expect(c.winner.v).toBe('29000');
    expect(c.loser.v).toBe('8620');
    expect(c.winner.src).toBe('HS');
    // the employees fact should carry the conflict key
    expect(kdp.employees.conflict).toBe(c.key);
  });

  it('nests persons under accounts via committee and flags web intent attention', () => {
    const kdp = view.accounts[1];
    expect(kdp.committee).toEqual(['p4990']);
    // KDP has 1 web session -> attention
    expect(kdp.attention).toBe(true);
    expect(kdp.web?.sessions).toBe(1);
    // Home Depot has 0 sessions -> no web, no attention (all draft stage)
    expect(view.accounts[0].web).toBeNull();
    expect(view.accounts[0].attention).toBe(false);
  });

  it('adapts persons with draft subject and empty body, plus a next step', () => {
    const alan = view.contacts.find((c) => c.id === 'p4989');
    expect(alan?.name).toBe('Alan Kwong');
    expect(alan?.draft.subject).toBe('A live yard running in eastern PA');
    expect(alan?.draft.body).toBe('');
    expect(alan?.draft.src).toBe('ICP+HS');
    expect(alan?.engagement).toBe('draft');
    expect(alan?.nextStep?.do).toBe('Review and send draft');
    expect(alan?.initials).toBe('AK');
  });

  it('handles empty fact objects without crashing', () => {
    const hd = view.accounts[0];
    expect(hd.hq.v).toBe('—');
  });
});

describe('adaptCanonicalView resilience', () => {
  it('handles a missing-data account (no facts, no committee, null why)', () => {
    const sparse: RawCanonicalCampaign = {
      campaign: { tag: 'allentown-tour', funnel: [], liveSite: null },
      sources: [],
      accounts: [
        {
          id: 5426,
          name: "Redner's Warehouse Markets",
          domain: 'rednersmarkets.com',
          pulse: 0,
          tam: null,
          facts: {
            industry: {},
            revenue: {},
            employees: {},
            hq: {},
            tamSegment: {},
            tamTier: {},
          },
          conflicts: [],
          signals: [],
          why: null,
          web: { sessions: 0, identified: false, lastSeen: null, pages: [], matchEdge: null },
          committee: [],
          nextAction: null,
        },
      ],
      persons: [],
    };
    const view = adaptCanonicalView(sparse);
    const a = view.accounts[0];
    expect(a.tam).toBe('review');
    expect(a.revenue.v).toBe('—');
    expect(a.committee).toEqual([]);
    expect(a.why).toBe('');
    expect(a.nextAction).toBeNull();
    expect(a.attention).toBe(false);
  });
});
