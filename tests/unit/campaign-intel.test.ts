import { describe, expect, it } from 'vitest';
import {
  ALLENTOWN_CAMPAIGN,
  ALLENTOWN_TOUR_TARGET,
  buildCampaignIntel,
  committeeCoverage,
  deriveAngle,
  emptyIntel,
  engagementTemperature,
  inferCommitteeRole,
  nextAccountsToInvite,
  nextBestAction,
  nextMoves,
  tourFunnel,
  type CampaignEmailLog,
  type DiscoveryIntelRow,
  type Temperature,
} from '@/lib/campaigns/campaign-intel';
import type { ViewAccount, ViewContact } from '@/lib/campaigns/canonical-view';

const DAY = 86_400_000;
const NOW = Date.parse('2026-06-13T12:00:00Z');

/* ─── fixtures ───────────────────────────────────────────────────────────── */

function person(over: Partial<ViewContact> = {}): ViewContact {
  return {
    id: 'p1',
    accId: 'a1',
    name: 'Shawn Mitchell',
    initials: 'SM',
    role: 'Director of Operations',
    engagement: 'draft',
    title: { v: 'Director of Operations', src: 'HS', verified: true },
    titleConflict: null,
    why: '',
    draft: { status: 'draft', subject: 'Allentown tour invite', body: '', src: 'ICP+HS' },
    events: [],
    web: null,
    nextStep: null,
    ...over,
  } as ViewContact;
}

function account(over: Partial<ViewAccount> = {}): ViewAccount {
  return {
    id: 'a1',
    name: 'UNFI',
    domain: 'unfi.com',
    icp: 1,
    tam: 'in',
    stage: 'draft',
    attention: false,
    attentionReason: '',
    industry: { v: 'Wholesale Distribution', src: 'HS' },
    revenue: { v: '$30.0B', src: 'HS' },
    employees: { v: '28,000', src: 'HS' },
    hq: { v: 'Providence, RI', src: 'HS' },
    dcs: { v: 'Wholesale Distribution', src: 'HS' },
    footprint: { v: 'TAM tier A', src: 'ICP' },
    pa: { city: 'unfi.com', left: '40%', top: '50%' },
    why: '',
    signals: [],
    committee: ['p1'],
    conflicts: [],
    nextAction: null,
    web: null,
    ...over,
  } as ViewAccount;
}

function log(over: Partial<CampaignEmailLog> = {}): CampaignEmailLog {
  return {
    toEmail: 'shawn@unfi.com',
    status: 'sent',
    openedAt: null,
    openCount: 0,
    replyCount: 0,
    sentAt: NOW - DAY,
    ...over,
  };
}

/* ─── engagementTemperature ──────────────────────────────────────────────── */

describe('engagementTemperature', () => {
  it('the current all-staged state reads STAGED (nothing sent)', () => {
    const h = engagementTemperature(person(), null, NOW);
    expect(h.temp).toBe('staged');
    expect(h.score).toBe(40);
  });

  it('a reply (reply_count > 0) is HOT', () => {
    const h = engagementTemperature(person(), log({ replyCount: 1 }), NOW);
    expect(h.temp).toBe('replied');
    expect(h.score).toBe(95);
  });

  it('a reply via draft.status replied is HOT even with no log', () => {
    const h = engagementTemperature(person({ draft: { status: 'replied', subject: 's', body: '', src: 'GM' } }), null, NOW);
    expect(h.temp).toBe('replied');
  });

  it('an opened, unreplied note is WARM', () => {
    const h = engagementTemperature(person(), log({ status: 'opened', openedAt: NOW - 3600_000, openCount: 1 }), NOW);
    expect(h.temp).toBe('warm');
    expect(h.score).toBe(75);
  });

  it('a web revisit (sessions > 1) is WARM even without an open', () => {
    const p = person({ web: { sessions: 2, identified: 1, lastSeen: '1h ago', pages: [] } });
    const h = engagementTemperature(p, log({ status: 'sent' }), NOW);
    expect(h.temp).toBe('warm');
  });

  it('a hot page on the web record counts as a revisit', () => {
    const p = person({ web: { sessions: 1, identified: 1, lastSeen: '1h', pages: [{ path: '/for/unfi', views: 3, hot: true }] } });
    const h = engagementTemperature(p, null, NOW);
    expect(h.temp).toBe('warm');
  });

  it('sent, no open, inside the window is SENT (waiting)', () => {
    const h = engagementTemperature(person(), log({ status: 'sent', sentAt: NOW - DAY }), NOW);
    expect(h.temp).toBe('sent');
    expect(h.score).toBe(50);
  });

  it('sent, no open, 2+ days is COOLING', () => {
    const h = engagementTemperature(person(), log({ status: 'sent', sentAt: NOW - 3 * DAY }), NOW);
    expect(h.temp).toBe('cooling');
    expect(h.score).toBe(30);
  });

  it('staged (40) outranks cooling (30): a ready-to-send is higher leverage than a cold one', () => {
    const staged = engagementTemperature(person(), null, NOW);
    const cooling = engagementTemperature(person(), log({ sentAt: NOW - 4 * DAY }), NOW);
    expect(staged.score).toBeGreaterThan(cooling.score);
  });

  it('no em dashes in any temperature reason', () => {
    const temps = [null, log({ replyCount: 1 }), log({ status: 'opened', openedAt: NOW }), log({ sentAt: NOW - DAY }), log({ sentAt: NOW - 4 * DAY })];
    for (const l of temps) {
      expect(engagementTemperature(person(), l, NOW).why).not.toContain('—');
    }
  });
});

/* ─── deriveAngle ────────────────────────────────────────────────────────── */

describe('deriveAngle', () => {
  it('cold chain role -> cold-chain', () => {
    expect(deriveAngle(person({ role: 'Cold Chain Logistics Lead', why: '' }))).toBe('cold-chain');
  });
  it('network optimization why -> network', () => {
    expect(deriveAngle(person({ role: 'VP', why: 'owns multi-DC network optimization' }))).toBe('network');
  });
  it('beverage -> beverage', () => {
    expect(deriveAngle(person({ role: 'Plant Manager', why: 'runs a beverage bottling line' }))).toBe('beverage');
  });
  it('local -> local', () => {
    expect(deriveAngle(person({ role: 'Site Lead', why: 'site is in Allentown, a neighbor' }))).toBe('local');
  });
  it('default -> tour', () => {
    expect(deriveAngle(person({ role: 'Analyst', why: '' }))).toBe('tour');
  });
});

/* ─── nextBestAction ─────────────────────────────────────────────────────── */

describe('nextBestAction', () => {
  it('replied -> Respond to {first} at leverage 95', () => {
    const a = nextBestAction(person(), { temp: 'replied', score: 95, why: '' });
    expect(a.verb).toBe('Respond to Shawn');
    expect(a.leverage).toBe(95);
    expect(a.detail).toContain('the 29th');
    expect(a.detail).toContain('Breinigsville');
  });

  it('warm -> Follow up while warm with the derived asset', () => {
    const a = nextBestAction(person({ role: 'VP', why: 'network optimization' }), { temp: 'warm', score: 75, why: '' });
    expect(a.verb).toBe('Follow up with Shawn while warm');
    expect(a.detail).toContain('ROI one-pager');
    expect(a.leverage).toBe(80);
  });

  it('cooling -> Bump or pivot at leverage 45', () => {
    const a = nextBestAction(person(), { temp: 'cooling', score: 30, why: '' });
    expect(a.verb).toBe('Bump or pivot on Shawn');
    expect(a.leverage).toBe(45);
  });

  it('staged -> Send staged draft (subject), leverage 70', () => {
    const a = nextBestAction(person(), { temp: 'staged', score: 40, why: '' });
    expect(a.verb).toBe("Send Shawn's staged draft");
    expect(a.detail).toBe('Allentown tour invite');
    expect(a.leverage).toBe(70);
  });

  it('no em dashes in any action copy', () => {
    const temps: Temperature[] = ['replied', 'warm', 'cooling', 'sent', 'staged'];
    for (const t of temps) {
      const a = nextBestAction(person(), { temp: t, score: 1, why: '' });
      expect(`${a.verb} ${a.detail}`).not.toContain('—');
    }
  });

  it('honors a non-Allentown campaign config', () => {
    const cfg = { ...ALLENTOWN_CAMPAIGN, basePath: '/campaigns/dallas', hostPhrase: 'Dallas', tourDate: 'July 9' };
    const a = nextBestAction(person(), { temp: 'replied', score: 95, why: '' }, cfg);
    expect(a.detail).toContain('Dallas');
    expect(a.detail).toContain('July 9');
    expect(a.targetHref).toContain('/campaigns/dallas');
  });
});

/* ─── inferCommitteeRole + committeeCoverage ─────────────────────────────── */

describe('inferCommitteeRole', () => {
  it('VP of Operations -> economic buyer', () => {
    expect(inferCommitteeRole('VP of Operations')).toBe('economic buyer');
  });
  it('Director of Supply Chain -> economic buyer', () => {
    expect(inferCommitteeRole('Director of Supply Chain')).toBe('economic buyer');
  });
  it('DC Operations Manager -> practitioner', () => {
    expect(inferCommitteeRole('DC Operations Manager')).toBe('practitioner');
  });
  it('Regional General Manager -> regional P&L owner', () => {
    expect(inferCommitteeRole('Regional General Manager')).toBe('regional P&L owner');
  });
  it('Corporate Head of Supply Chain -> corporate supply chain', () => {
    expect(inferCommitteeRole('Corporate Head of Supply Chain')).toBe('corporate supply chain');
  });
  it('unrelated title -> null', () => {
    expect(inferCommitteeRole('Marketing Coordinator')).toBeNull();
  });
});

describe('committeeCoverage', () => {
  it('covers roles from contacted titles and names the missing ones', () => {
    const persons = [
      person({ id: 'p1', role: 'VP of Operations', title: { v: 'VP of Operations', src: 'HS' } }),
      person({ id: 'p2', role: 'DC Operations Manager', title: { v: 'DC Operations Manager', src: 'HS' } }),
    ];
    const cov = committeeCoverage(account(), persons);
    expect(cov.coveredRoles).toContain('economic buyer');
    expect(cov.coveredRoles).toContain('practitioner');
    expect(cov.missingRoles).toContain('regional P&L owner');
    expect(cov.missingRoles).toContain('corporate supply chain');
    expect(cov.coveragePct).toBeCloseTo(0.5);
    expect(cov.contacted).toHaveLength(2);
  });

  it('no contacted people -> 0% coverage, all roles missing', () => {
    const cov = committeeCoverage(account(), []);
    expect(cov.coveragePct).toBe(0);
    expect(cov.missingRoles).toHaveLength(4);
  });
});

/* ─── nextAccountsToInvite ───────────────────────────────────────────────── */

function row(over: Partial<DiscoveryIntelRow> = {}): DiscoveryIntelRow {
  return {
    name: 'Niagara Bottling',
    cityState: 'Breinigsville, PA',
    tier: 'A',
    worklistScore: 80,
    nearestPrimoDistance: 3,
    contactCount: 0,
    ...over,
  };
}

describe('nextAccountsToInvite', () => {
  it('ranks zero-contact corridor rows by score then ascending distance, excludes campaign accounts', () => {
    const rows: DiscoveryIntelRow[] = [
      row({ name: 'Alpha', worklistScore: 90, nearestPrimoDistance: 5 }),
      row({ name: 'Beta', worklistScore: 90, nearestPrimoDistance: 2 }), // same score, closer -> first
      row({ name: 'Gamma', worklistScore: 70, nearestPrimoDistance: 1 }),
      row({ name: 'HasContacts', worklistScore: 99, nearestPrimoDistance: 1, contactCount: 3 }), // filtered: has contacts
      row({ name: 'InCampaign', worklistScore: 95, nearestPrimoDistance: 1 }), // filtered: already in campaign
    ];
    const out = nextAccountsToInvite(rows, new Set(['InCampaign']), 5);
    expect(out.map((c) => c.name)).toEqual(['Beta', 'Alpha', 'Gamma']);
  });

  it('zero-contact filter drops every row with contactCount > 0', () => {
    const rows = [row({ name: 'X', contactCount: 1 }), row({ name: 'Y', contactCount: 0 })];
    const out = nextAccountsToInvite(rows, new Set(), 10);
    expect(out.map((c) => c.name)).toEqual(['Y']);
  });

  it('campaign-name match is case-insensitive', () => {
    const out = nextAccountsToInvite([row({ name: 'Niagara Bottling' })], new Set(['niagara bottling']), 5);
    expect(out).toHaveLength(0);
  });

  it('reason is a tight one-liner with tier and distance, no em dash', () => {
    const out = nextAccountsToInvite([row({ tier: 'A', nearestPrimoDistance: 2.7 })], new Set(), 1);
    expect(out[0].reason).toBe('Tier A, 2.7 mi from the live site, no committee yet.');
    expect(out[0].reason).not.toContain('—');
  });

  it('respects the limit', () => {
    const rows = Array.from({ length: 10 }, (_, i) => row({ name: `R${i}`, worklistScore: 100 - i }));
    expect(nextAccountsToInvite(rows, new Set(), 3)).toHaveLength(3);
  });
});

/* ─── tourFunnel ─────────────────────────────────────────────────────────── */

describe('tourFunnel', () => {
  it('counts confirmed/warm/invited/staged and the toSource gap against the target', () => {
    const accounts = [
      account({ id: 'a1', stage: 'booked' }), // confirmed
      account({ id: 'a2' }),
      account({ id: 'a3' }),
      account({ id: 'a4' }),
      account({ id: 'a5' }),
    ];
    const temps = new Map<string, Temperature>([
      ['a2', 'warm'],
      ['a3', 'sent'],
      ['a4', 'staged'],
      // a5 has no temp -> no contact
    ]);
    const f = tourFunnel(accounts, temps, 12);
    expect(f.target).toBe(12);
    expect(f.confirmed).toBe(1);
    expect(f.warm).toBe(1);
    expect(f.invited).toBe(1);
    expect(f.staged).toBe(1);
    // 4 accounts have any contact (booked + warm + sent + staged); a5 has none
    expect(f.toSource).toBe(12 - 4);
    expect(f.pct).toBeCloseTo((1 + 1) / 12);
  });

  it('the all-staged current state: nothing confirmed/warm, all staged count toward toSource reduction', () => {
    const accounts = [account({ id: 'a1' }), account({ id: 'a2' })];
    const temps = new Map<string, Temperature>([['a1', 'staged'], ['a2', 'staged']]);
    const f = tourFunnel(accounts, temps, 12);
    expect(f.confirmed).toBe(0);
    expect(f.warm).toBe(0);
    expect(f.staged).toBe(2);
    expect(f.toSource).toBe(10);
    expect(f.pct).toBe(0);
  });

  it('defaults to ALLENTOWN_TOUR_TARGET', () => {
    const f = tourFunnel([], new Map());
    expect(f.target).toBe(ALLENTOWN_TOUR_TARGET);
    expect(f.toSource).toBe(ALLENTOWN_TOUR_TARGET);
  });
});

/* ─── nextMoves ──────────────────────────────────────────────────────────── */

describe('nextMoves', () => {
  it('orders by leverage desc and puts the hottest move on top', () => {
    const replied = person({ id: 'p1', accId: 'a1' });
    const staged = person({ id: 'p2', accId: 'a2' });
    const accounts = [account({ id: 'a1', committee: ['p1'] }), account({ id: 'a2', committee: ['p2'] })];
    const moves = nextMoves({
      accounts,
      persons: [replied, staged],
      logByPersonId: new Map([
        ['p1', log({ replyCount: 1 })],
        ['p2', null],
      ]),
      personsByAccountId: new Map([
        ['a1', [replied]],
        ['a2', [staged]],
      ]),
      inviteCandidates: [],
      now: NOW,
    });
    expect(moves[0].kind).toBe('person');
    expect(moves[0].verb).toBe('Respond to Shawn');
    expect(moves[0].leverage).toBe(95);
    // strictly non-increasing leverage
    for (let i = 1; i < moves.length; i++) {
      expect(moves[i - 1].leverage).toBeGreaterThanOrEqual(moves[i].leverage);
    }
  });

  it('merges committee-gap and invite moves into the queue', () => {
    const p = person({ id: 'p1', accId: 'a1', role: 'VP of Operations', title: { v: 'VP of Operations', src: 'HS' } });
    const acc = account({ id: 'a1', committee: ['p1'] });
    const moves = nextMoves({
      accounts: [acc],
      persons: [p],
      logByPersonId: new Map([['p1', null]]),
      personsByAccountId: new Map([['a1', [p]]]),
      inviteCandidates: [
        { name: 'Niagara Bottling', tier: 'A', score: 88, distanceMi: 2.7, cityState: 'Breinigsville, PA', reason: 'Tier A, 2.7 mi from the live site, no committee yet.' },
      ],
      now: NOW,
    });
    expect(moves.some((m) => m.kind === 'committee' && m.verb.includes('Source'))).toBe(true);
    expect(moves.some((m) => m.kind === 'invite' && m.verb.includes('Niagara'))).toBe(true);
    // committee move names the missing roles
    const committee = moves.find((m) => m.kind === 'committee')!;
    expect(committee.why).toContain('regional P&L owner');
  });

  it('no em dashes anywhere in the move queue', () => {
    const p = person({ id: 'p1', accId: 'a1' });
    const moves = nextMoves({
      accounts: [account({ id: 'a1', committee: ['p1'] })],
      persons: [p],
      logByPersonId: new Map([['p1', null]]),
      personsByAccountId: new Map([['a1', [p]]]),
      inviteCandidates: [{ name: 'X', tier: 'B', score: 1, distanceMi: 9, cityState: 'Y, PA', reason: 'Tier B, 9 mi from the live site, no committee yet.' }],
      now: NOW,
    });
    for (const m of moves) {
      expect(`${m.verb} ${m.why}`).not.toContain('—');
    }
  });
});

/* ─── buildCampaignIntel (end-to-end) ────────────────────────────────────── */

describe('buildCampaignIntel', () => {
  it('composes the full bundle for the current all-staged state', () => {
    const p1 = person({ id: 'p1', accId: 'a1', role: 'VP of Operations', title: { v: 'VP of Operations', src: 'HS' } });
    const p2 = person({ id: 'p2', accId: 'a1', name: 'Dana Lee', role: 'DC Operations Manager', title: { v: 'DC Operations Manager', src: 'HS' } });
    const acc = account({ id: 'a1', committee: ['p1', 'p2'] });
    const intel = buildCampaignIntel({
      accounts: [acc],
      persons: [p1, p2],
      logByPersonId: new Map(), // nothing sent -> all staged
      discoveryRows: [
        { name: 'Niagara Bottling', cityState: 'Breinigsville, PA', tier: 'A', worklistScore: 88, nearestPrimoDistance: 2.7, contactCount: 0 },
        { name: 'UNFI', cityState: 'Allentown, PA', tier: 'A', worklistScore: 95, nearestPrimoDistance: 1, contactCount: 0 }, // in campaign -> excluded
      ],
      now: NOW,
    });
    // every person reads STAGED today
    expect(intel.heatByPersonId['p1'].temp).toBe('staged');
    expect(intel.heatByPersonId['p2'].temp).toBe('staged');
    // funnel: 1 account staged, target 12
    expect(intel.funnel.staged).toBe(1);
    expect(intel.funnel.toSource).toBe(11);
    // coverage computed for the account
    expect(intel.coverageByAccountId['a1'].coveredRoles).toContain('economic buyer');
    expect(intel.coverageByAccountId['a1'].coveredRoles).toContain('practitioner');
    // invite excludes the campaign account UNFI, keeps Niagara
    expect(intel.invites.map((i) => i.name)).toContain('Niagara Bottling');
    expect(intel.invites.map((i) => i.name)).not.toContain('UNFI');
    // moves is non-empty and leverage-sorted
    expect(intel.moves.length).toBeGreaterThan(0);
    for (let i = 1; i < intel.moves.length; i++) {
      expect(intel.moves[i - 1].leverage).toBeGreaterThanOrEqual(intel.moves[i].leverage);
    }
  });

  it('empty inputs yield empty-but-valid intel', () => {
    const intel = buildCampaignIntel({ accounts: [], persons: [], logByPersonId: new Map(), discoveryRows: [], now: NOW });
    expect(intel.moves).toHaveLength(0);
    expect(intel.invites).toHaveLength(0);
    expect(intel.funnel.toSource).toBe(ALLENTOWN_TOUR_TARGET);
  });

  it('emptyIntel matches the all-missing shape', () => {
    const e = emptyIntel();
    expect(e.funnel.target).toBe(ALLENTOWN_TOUR_TARGET);
    expect(e.moves).toEqual([]);
  });
});
