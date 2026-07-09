import { describe, it, expect } from 'vitest';
import {
  heatScore,
  fitMultiplier,
  decayFactor,
  classifyTier,
  tierNumber,
  HEAT_WEIGHTS,
  type HeatSignals,
} from '@/lib/revops/heat/heat-score';

// Fixed "now" so decay is deterministic across CI/local.
const NOW = Date.parse('2026-07-07T00:00:00Z');
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000);

// The 7 real account-intent companies from the grounded facts.
const INTENT_ACCOUNTS: Array<[string, number]> = [
  ['Home Depot', 100],
  ['Kroger', 100],
  ['Mondelez', 85],
  ['GXO', 84],
  ['AB InBev', 65],
  ['GM', 65],
  ['Tyson', 55],
];

describe('weights (max-points ceilings)', () => {
  it('intent is the highest-weighted first-party signal, web/deck the lowest', () => {
    expect(HEAT_WEIGHTS.intent).toBeGreaterThan(HEAT_WEIGHTS.qual);
    expect(HEAT_WEIGHTS.qual).toBeGreaterThan(HEAT_WEIGHTS.pounce);
    expect(HEAT_WEIGHTS.pounce).toBeGreaterThanOrEqual(HEAT_WEIGHTS.deck);
    expect(HEAT_WEIGHTS.deck).toBe(HEAT_WEIGHTS.web);
  });
  it('total point budget stays in a sane band so stacking saturates under 100', () => {
    const total = Object.values(HEAT_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(150);
    expect(total).toBeLessThan(220);
  });
});

describe('decayFactor', () => {
  it('is 1 with no timestamp', () => {
    expect(decayFactor(null, NOW)).toBe(1);
    expect(decayFactor(undefined, NOW)).toBe(1);
    expect(decayFactor('', NOW)).toBe(1);
  });
  it('is ~1/e at 14 days', () => {
    expect(decayFactor(daysAgo(14), NOW)).toBeCloseTo(Math.exp(-1), 3);
  });
  it('nearly zero at ~2 months (old deck view)', () => {
    expect(decayFactor(daysAgo(56), NOW)).toBeLessThan(0.03);
  });
  it('parses epoch-ms strings (HubSpot datetime) and CSV timestamps', () => {
    expect(decayFactor(String(NOW), NOW)).toBeCloseTo(1, 3);
    // deck CSV format "2026-07-06 12:00" ~1 day old
    expect(decayFactor('2026-07-06 00:00', NOW)).toBeCloseTo(Math.exp(-1 / 14), 2);
  });
});

describe('fitMultiplier', () => {
  it('floors a tiny-yard vendor near 0.30', () => {
    expect(fitMultiplier(20)).toBeLessThan(0.35);
  });
  it('caps a large network at 1.0', () => {
    expect(fitMultiplier(4450)).toBe(1);
    expect(fitMultiplier(2000)).toBe(1);
  });
  it('is monotonic in dock doors', () => {
    expect(fitMultiplier(70)).toBeLessThan(fitMultiplier(850));
    expect(fitMultiplier(850)).toBeLessThan(fitMultiplier(1600));
  });
  it('falls back to TAM tier when no dock data', () => {
    expect(fitMultiplier(0, 'A')).toBeGreaterThan(fitMultiplier(0, 'B'));
    expect(fitMultiplier(0, 'B')).toBeGreaterThan(fitMultiplier(0, 'C'));
    expect(fitMultiplier(undefined, '')).toBeLessThan(fitMultiplier(0, 'C'));
  });
});

describe('the 7 intent accounts land in Tier 1 and score high', () => {
  for (const [name, score] of INTENT_ACCOUNTS) {
    it(`${name} (intent ${score}) is tier1`, () => {
      const r = heatScore(
        { name, tam: 'in', tamTier: 'A', dockDoors: 1500, intentScore: score, lastIntentAt: daysAgo(3) },
        NOW,
      );
      expect(r.tier).toBe('tier1');
      expect(r.heat).toBeGreaterThan(20);
      expect(r.reason).toMatch(/intent_score/);
    });
  }

  it('Home Depot (intent 100, biggest yard) outranks Tyson (intent 55)', () => {
    const hd = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 4450, intentScore: 100, lastIntentAt: daysAgo(2) }, NOW);
    const ty = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 900, intentScore: 55, lastIntentAt: daysAgo(2) }, NOW);
    expect(hd.heat).toBeGreaterThan(ty.heat);
  });
});

describe('PepsiCo — top deck account + a trigger — is hot', () => {
  // 7 people / 12 views on the deck, but that blast was May 12 (decayed).
  // Plus a pounce trigger (grounded: trigger_score on PepsiCo).
  it('lands tier1 via fresh pounce and outscores a cold TAM peer', () => {
    const pepsi = heatScore(
      {
        name: 'PepsiCo',
        tam: 'in',
        tamTier: 'A',
        dockDoors: 1145,
        deckViews: 12,
        deckVisitors: 7,
        deckLastViewedAt: '2026-05-12 20:07',
        pounceScore: 60,
        lastTriggerAt: daysAgo(4),
        forViews: 4,
      },
      NOW,
    );
    expect(pepsi.tier).toBe('tier1');
    const cold = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 1145 }, NOW);
    expect(pepsi.heat).toBeGreaterThan(cold.heat);
  });
});

describe('fit suppresses a loud small-yard vendor', () => {
  it('a vendor with tiny dock doors is beaten by a real target with the SAME raw signals', () => {
    const signals = { tam: 'in', intentScore: 80, lastIntentAt: daysAgo(2), forViews: 40 };
    const vendor = heatScore({ ...signals, tamTier: 'C', dockDoors: 15 }, NOW);
    const target = heatScore({ ...signals, tamTier: 'A', dockDoors: 2200 }, NOW);
    expect(vendor.fit).toBeLessThan(0.4);
    expect(target.fit).toBe(1);
    expect(vendor.heat).toBeLessThan(target.heat * 0.6);
  });
});

describe('qual: a stale MQL list does not dominate the ranking (2026-07-07 fix)', () => {
  it('MQL saturates its own low sub-ceiling — 120 MQL cannot peg the 45-pt qual component', () => {
    const r = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 1000, mqlCount: 120 }, NOW);
    // MQL is 25% of the 45-pt ceiling => max ~11.25 pts, never the full 45.
    expect(r.breakdown.qual.contribution).toBeLessThan(12);
  });

  it('a cold 120-MQL/0-SQL account does NOT outrank a live 4-SQL account (US Foods vs PepsiCo)', () => {
    const usFoods = heatScore({ name: 'US Foods', tam: 'in', tamTier: 'A', dockDoors: 1100, mqlCount: 121 }, NOW);
    const pepsi = heatScore(
      {
        name: 'PepsiCo',
        tam: 'in',
        tamTier: 'A',
        dockDoors: 1145,
        partialPack: true,
        sqlCount: 4,
        mqlCount: 77,
        pounceScore: 60,
        lastTriggerAt: daysAgo(4),
        forViews: 4,
      },
      NOW,
    );
    expect(pepsi.heat).toBeGreaterThan(usFoods.heat);
  });

  it('a big MQL list with NO recent sales activity is aged out below a small fresh-activity list', () => {
    const coldList = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 1000, mqlCount: 120, qualLastActivityAt: daysAgo(120) }, NOW);
    const freshList = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 1000, mqlCount: 8, qualLastActivityAt: daysAgo(1) }, NOW);
    expect(freshList.breakdown.qual.contribution).toBeGreaterThan(coldList.breakdown.qual.contribution);
  });

  it('SQL is durable — an old sales-activity date does NOT decay the SQL portion', () => {
    const oldStamp = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 1000, sqlCount: 4, qualLastActivityAt: daysAgo(200) }, NOW);
    const noStamp = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 1000, sqlCount: 4 }, NOW);
    expect(oldStamp.breakdown.qual.contribution).toBeCloseTo(noStamp.breakdown.qual.contribution, 5);
  });
});

describe('web double-count suppression (2026-07-07 fix)', () => {
  it('suppresses the web component when the account already carries an account-level intent_score', () => {
    const withIntent = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 2000, intentScore: 100, lastIntentAt: daysAgo(2), forViews: 60 }, NOW);
    expect(withIntent.breakdown.web.contribution).toBe(0);
    expect(withIntent.breakdown.web.value).toBe(0);
  });

  it('still scores the web component when there is no account intent_score', () => {
    const noIntent = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 2000, forViews: 60 }, NOW);
    expect(noIntent.breakdown.web.contribution).toBeGreaterThan(0);
  });
});

describe('partialPack fit relief (2026-07-07 fix)', () => {
  it('a known-partial pack is not fit-penalized for its under-counted footprint', () => {
    expect(fitMultiplier(1145, 'A', true)).toBe(1);
    expect(fitMultiplier(1145, 'A', true)).toBeGreaterThan(fitMultiplier(1145, 'A', false));
  });
  it('does not change fit for a full-footprint pack', () => {
    expect(fitMultiplier(2200, 'A', false)).toBe(1);
  });
});

describe('decay: an old deck view fades below a fresh SQL', () => {
  it('fresh 1-SQL account outranks a stale 12-view deck account', () => {
    const staleDeck = heatScore(
      { tam: 'in', tamTier: 'A', dockDoors: 1000, deckViews: 12, deckVisitors: 7, deckLastViewedAt: daysAgo(56) },
      NOW,
    );
    const freshSql = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 1000, sqlCount: 1 }, NOW);
    expect(freshSql.heat).toBeGreaterThan(staleDeck.heat);
  });

  it('the same deck engagement scores much higher when it is fresh', () => {
    const fresh = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 1000, deckViews: 12, deckVisitors: 7, deckLastViewedAt: daysAgo(1) }, NOW);
    const stale = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 1000, deckViews: 12, deckVisitors: 7, deckLastViewedAt: daysAgo(56) }, NOW);
    expect(fresh.breakdown.deck.value).toBeGreaterThan(stale.breakdown.deck.value * 5);
  });
});

describe('tiering rules', () => {
  it('deck-only engagement is tier2', () => {
    const r = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 800, deckViews: 3, deckVisitors: 1, deckLastViewedAt: daysAgo(5) }, NOW);
    expect(r.tier).toBe('tier2');
  });
  it('/for-only engagement is tier2', () => {
    const r = heatScore({ tam: 'in', tamTier: 'B', forViews: 5 }, NOW);
    expect(r.tier).toBe('tier2');
  });
  it('Tier-A TAM with an MQL but no engagement is tier3', () => {
    const r = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 900, mqlCount: 2 }, NOW);
    expect(r.tier).toBe('tier3');
  });
  it('bare TAM-in is tier4', () => {
    const r = heatScore({ tam: 'in', tamTier: 'C', dockDoors: 200 }, NOW);
    expect(r.tier).toBe('tier4');
  });
  it('a SQL always beats deck to tier1', () => {
    const r = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 900, sqlCount: 1, deckViews: 3 }, NOW);
    expect(r.tier).toBe('tier1');
  });
  it('a stale pounce trigger does NOT force tier1', () => {
    const r = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 900, pounceScore: 60, lastTriggerAt: daysAgo(60) }, NOW);
    expect(r.tier).not.toBe('tier1');
  });
});

describe('bounds + breakdown integrity', () => {
  it('heat is always 0..100', () => {
    const maxed = heatScore(
      { tam: 'in', tamTier: 'A', dockDoors: 5000, intentScore: 100, lastIntentAt: NOW, sqlCount: 10, mqlCount: 10, pounceScore: 100, lastTriggerAt: NOW, deckViews: 100, deckVisitors: 50, deckLastViewedAt: NOW, forViews: 500 },
      NOW,
    );
    expect(maxed.heat).toBeLessThanOrEqual(100);
    expect(maxed.heat).toBeGreaterThan(0);
    const empty = heatScore({ tam: 'in', tamTier: 'C', dockDoors: 100 }, NOW);
    expect(empty.heat).toBeGreaterThanOrEqual(0);
  });
  it('component points sum to r.points, then saturate·fit == heat', () => {
    const r = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 1000, intentScore: 80, lastIntentAt: NOW, sqlCount: 1 }, NOW);
    const sumPts = Object.values(r.breakdown).reduce((a, c) => a + c.contribution, 0);
    expect(sumPts).toBeCloseTo(r.points, 1);
    const base = 100 * (1 - Math.exp(-r.points / 70));
    expect(Math.round(base * r.fit)).toBe(r.heat);
  });
  it('tierNumber maps 1..4', () => {
    expect(tierNumber('tier1')).toBe(1);
    expect(tierNumber('tier4')).toBe(4);
  });
});

describe('classifyTier is consistent with heatScore', () => {
  it('agrees on tier for a sampled signal', () => {
    const s: HeatSignals = { tam: 'in', tamTier: 'A', dockDoors: 900, intentScore: 65, lastIntentAt: daysAgo(2) };
    const r = heatScore(s, NOW);
    const t = classifyTier(s, r.breakdown, NOW);
    expect(t.tier).toBe(r.tier);
  });
});

describe('stale intent (the 2026-07-08 adversarial-review findings)', () => {
  it('a 400-day-old intent_score is NOT "Live intent" tier1', () => {
    const r = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 900, intentScore: 100, lastIntentAt: daysAgo(400) }, NOW);
    expect(r.tier).not.toBe('tier1');
    expect(r.reason).not.toContain('Live intent');
  });
  it('fresh intent is still tier1', () => {
    const r = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 900, intentScore: 65, lastIntentAt: daysAgo(2) }, NOW);
    expect(r.tier).toBe('tier1');
  });
  it('fully-decayed intent does NOT suppress a fresh /for web signal', () => {
    const r = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 900, intentScore: 100, lastIntentAt: daysAgo(400), forViews: 40 }, NOW);
    expect(r.breakdown.web.contribution).toBeGreaterThan(0);
    expect(r.tier).toBe('tier2'); // web-engaged, no live-intent signal
  });
  it('live intent still suppresses the web component (no double count)', () => {
    const r = heatScore({ tam: 'in', tamTier: 'A', dockDoors: 900, intentScore: 65, lastIntentAt: NOW, forViews: 40 }, NOW);
    expect(r.breakdown.web.contribution).toBe(0);
  });
});
