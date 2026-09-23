import { describe, expect, it } from 'vitest';

import { HEDGE_TOKENS, PROBLEM_FAMILIES } from '@/lib/gap/taxonomy';
import { validateObservation } from '@/lib/gap/hypothesis/observation';
import {
  FALSIFICATION_QUESTIONS,
  FAMILY_PERSONAS,
  PROBLEM_TEMPLATES,
  WHAT_A_NO_MEANS,
  buildCandidates,
  type BuildCandidate,
  type BuildInput,
  type BuildPersona,
  type BuildSignal,
} from '@/lib/gap/hypothesis/build';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-09-23T12:00:00.000Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS);
const daysAhead = (days: number) => new Date(NOW.getTime() + days * DAY_MS);

/** Generated text may never carry product names, private intent words, or the retired vocabulary. */
const EM_DASH = String.fromCharCode(0x2014);
const FORBIDDEN_TEXT = new RegExp(
  ['intent', '/demo', '/for\\b', 'visited', 'viewed', 'yardflow', 'flowyms', 'freightroll', 'throughput', EM_DASH].join('|'),
  'i',
);

const S1_TITLE = 'Honda adds a second shift at Anna Engine Plant with 110 dock doors';
const S2_TITLE = 'Honda retools Ohio plants for mixed hybrid and ICE production on the same lines';

const PERSONAS: BuildPersona[] = [
  { id: 1, personaKey: 'site_ops', name: 'Plant Logistics Manager', doNotContact: false, emailValid: true },
  { id: 2, personaKey: 'technology', name: 'IT Director', doNotContact: false, emailValid: true },
  { id: 3, personaKey: 'finance_procurement', name: 'Procurement Lead', doNotContact: true, emailValid: true },
];

const S1: BuildSignal = {
  id: 'S1',
  type: 'site_expansion',
  title: S1_TITLE,
  observedAt: daysAgo(3),
  confidence: 90,
  freshnessExpiresAt: daysAhead(30),
  externalOk: true,
  pounceCategories: ['network_capex'],
};

const S2: BuildSignal = {
  id: 'S2',
  type: 'news',
  title: S2_TITLE,
  // The title alone carries no cue; the summary is what classifies it (hidden_capacity cues).
  summary: 'The retool adds dock doors and trailer spots and raises production capacity on the line.',
  observedAt: daysAgo(20),
  confidence: 70,
  freshnessExpiresAt: daysAhead(10),
  externalOk: true,
};

const S3_UNTITLED: BuildSignal = {
  id: 'S3',
  type: 'news',
  title: '',
  observedAt: daysAgo(1),
  confidence: 80,
  freshnessExpiresAt: daysAhead(30),
};

const S4_EXPIRED: BuildSignal = {
  id: 'S4',
  type: 'site_expansion',
  title: 'Honda idles the Marysville line with 40 dock doors for a retool',
  observedAt: daysAgo(90),
  confidence: 80,
  freshnessExpiresAt: daysAgo(1),
};

const S5_UNMAPPED: BuildSignal = {
  id: 'S5',
  type: 'news',
  title: 'Honda names a new regional president',
  observedAt: daysAgo(2),
  confidence: 60,
  freshnessExpiresAt: daysAhead(30),
};

const INPUT: BuildInput = {
  accountName: 'Honda',
  personas: PERSONAS,
  signals: [S1, S2, S3_UNTITLED, S4_EXPIRED, S5_UNMAPPED],
  now: NOW,
};

function tokens(text: string): string[] {
  return text
    .replace(/\[S:[A-Za-z0-9_-]+\]/g, ' ')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 0);
}

let cached: ReturnType<typeof buildCandidates> | null = null;
/** Built lazily inside each test so a builder throw is attributed to the test, not to collection. */
function result(): ReturnType<typeof buildCandidates> {
  cached ??= buildCandidates(INPUT);
  return cached;
}

function siteOpsHiddenCapacity(): BuildCandidate {
  const { candidates } = result();
  const candidate = candidates.find((c) => c.personaId === 1 && c.problemFamily === 'hidden_capacity');
  if (!candidate) throw new Error('fixture expectation: site_ops hidden_capacity candidate missing');
  return candidate;
}

describe('buildCandidates: signal hygiene', () => {
  it('skips an untitled signal with signal_untitled', () => {
    expect(result().skipped).toContainEqual({ signalId: 'S3', reason: 'signal_untitled' });
  });

  it('skips an expired signal with signal_expired', () => {
    expect(result().skipped).toContainEqual({ signalId: 'S4', reason: 'signal_expired' });
  });

  it('skips a signal with no family cue with unmapped_signal', () => {
    expect(result().skipped).toContainEqual({ signalId: 'S5', reason: 'unmapped_signal' });
  });

  it('never cites a dropped signal', () => {
    const { candidates } = result();
    for (const candidate of candidates) {
      expect(candidate.signalIds).not.toContain('S3');
      expect(candidate.signalIds).not.toContain('S4');
      expect(candidate.signalIds).not.toContain('S5');
    }
  });
});

describe('buildCandidates: personas', () => {
  it('site_ops gets a hidden_capacity candidate citing S1 and S2', () => {
    const candidate = siteOpsHiddenCapacity();
    expect(candidate.persona).toBe('site_ops');
    expect(candidate.signalIds).toEqual(expect.arrayContaining(['S1', 'S2']));
    expect(candidate.primarySignalId).toBe('S1');
  });

  it('technology is not relevant to hidden_capacity and gets no candidate outside its list', () => {
    const { candidates, skipped } = result();
    expect(skipped).toContainEqual({ personaId: 2, reason: 'persona_not_relevant' });
    for (const candidate of candidates.filter((c) => c.personaId === 2)) {
      expect(FAMILY_PERSONAS[candidate.problemFamily]).toContain('technology');
    }
  });

  it('a doNotContact persona is skipped with persona_suppressed and gets no candidate', () => {
    const { candidates, skipped } = result();
    expect(skipped).toContainEqual({ personaId: 3, reason: 'persona_suppressed' });
    expect(candidates.filter((c) => c.personaId === 3)).toHaveLength(0);
  });

  it('no candidate is produced without signal ids', () => {
    const { candidates } = result();
    expect(candidates.length).toBeGreaterThan(0);
    for (const candidate of candidates) {
      expect(candidate.signalIds.length).toBeGreaterThan(0);
      expect(candidate.signalIds).toContain(candidate.primarySignalId);
    }
  });

  it('maxCandidatesPerPersona caps the output per persona', () => {
    const wide: BuildInput = {
      ...INPUT,
      signals: [
        S1,
        {
          id: 'S6',
          type: 'job_posting',
          title: 'Honda hires gate guards and adds a driver check-in lane at Marysville',
          observedAt: daysAgo(4),
          confidence: 65,
          freshnessExpiresAt: daysAhead(20),
        },
      ],
    };
    const uncapped = buildCandidates({ ...wide, maxCandidatesPerPersona: 2 });
    const capped = buildCandidates({ ...wide, maxCandidatesPerPersona: 1 });
    const siteOpsUncapped = uncapped.candidates.filter((c) => c.personaId === 1);
    const siteOpsCapped = capped.candidates.filter((c) => c.personaId === 1);
    expect(siteOpsUncapped.map((c) => c.problemFamily).sort()).toEqual(['driver_gate_scale', 'hidden_capacity']);
    expect(siteOpsCapped).toHaveLength(1);
    expect(siteOpsCapped[0].problemFamily).toBe('hidden_capacity');
    expect(capped.skipped).toContainEqual({ personaId: 1, reason: 'persona_family_capped' });
  });
});

describe('buildCandidates: observation', () => {
  it('cites S1 and passes validateObservation against its own signal ids', () => {
    const candidate = siteOpsHiddenCapacity();
    expect(candidate.observation).toContain('[S:S1]');
    expect(candidate.observation).toContain('[S:S2]');
    expect(validateObservation(candidate.observation, candidate.signalIds)).toMatchObject({ ok: true });
  });

  it('contains only words from the cited signal titles (no paraphrase)', () => {
    const candidate = siteOpsHiddenCapacity();
    const titleWords = new Set(tokens(`${S1_TITLE} ${S2_TITLE}`));
    const observationWords = tokens(candidate.observation);
    expect(observationWords.length).toBeGreaterThan(0);
    const foreign = observationWords.filter((word) => !titleWords.has(word));
    expect(foreign).toEqual([]);
  });

  it('omits a first-party signal from the observation but keeps it as support', () => {
    const firstParty: BuildSignal = {
      id: 'S7',
      type: 'website_behavior',
      title: 'Honda dock doors and trailer spots capacity page session',
      observedAt: daysAgo(1),
      confidence: 95,
      freshnessExpiresAt: daysAhead(5),
      externalOk: false,
    };
    const { candidates, skipped } = buildCandidates({ ...INPUT, signals: [S1, S2, firstParty] });
    const candidate = candidates.find((c) => c.personaId === 1 && c.problemFamily === 'hidden_capacity');
    expect(candidate).toBeDefined();
    expect(candidate!.observation).not.toContain('[S:S7]');
    expect(candidate!.observation).not.toContain('session');
    expect(candidate!.whyNow).not.toContain('session');
    expect(candidate!.signalIds).toContain('S7');
    expect(candidate!.primarySignalId).toBe('S1');
    expect(skipped).toContainEqual({ signalId: 'S7', reason: 'first_party_omitted_from_observation' });
  });

  it('skips a family whose only signals are first-party with no_citable_signal', () => {
    const firstParty: BuildSignal = {
      id: 'S7',
      type: 'website_behavior',
      title: 'Honda dock doors capacity page session',
      observedAt: daysAgo(1),
      confidence: 95,
      freshnessExpiresAt: daysAhead(5),
      externalOk: false,
    };
    const { candidates, skipped } = buildCandidates({ ...INPUT, signals: [firstParty] });
    expect(candidates).toHaveLength(0);
    expect(skipped).toContainEqual({ personaId: 1, signalId: 'S7', reason: 'no_citable_signal' });
  });
});

describe('buildCandidates: hypothesis text', () => {
  it('problemHypothesis carries a hedge token', () => {
    const candidate = siteOpsHiddenCapacity();
    const lower = candidate.problemHypothesis.toLowerCase();
    expect(HEDGE_TOKENS.some((token) => lower.includes(token))).toBe(true);
  });

  it('every family template is hedged and every family has two falsification questions and a no-meaning', () => {
    for (const family of PROBLEM_FAMILIES) {
      const lower = PROBLEM_TEMPLATES[family]('Acme').toLowerCase();
      expect(HEDGE_TOKENS.some((token) => lower.includes(token)), family).toBe(true);
      expect(FALSIFICATION_QUESTIONS[family]).toHaveLength(2);
      expect(WHAT_A_NO_MEANS[family].trim().length).toBeGreaterThan(0);
      expect(FAMILY_PERSONAS[family].length).toBeGreaterThan(0);
    }
  });

  it('names the account and embeds the catalog problem text', () => {
    const candidate = siteOpsHiddenCapacity();
    expect(candidate.problemHypothesis).toContain('Honda');
    expect(candidate.problemHypothesis.toLowerCase()).toContain('physical handoffs constrain production capacity');
  });

  it('root causes and impacts come from the catalog, three each', () => {
    const candidate = siteOpsHiddenCapacity();
    expect(candidate.rootCauseHypotheses).toEqual(['Gate waiting', 'Trailer search', 'Stale asset state']);
    expect(candidate.impactHypotheses).toEqual(['Fewer turns', 'Lost production capacity', 'Overtime']);
  });

  it('whyNow states the observed window and the titles, with no forbidden tokens', () => {
    const candidate = siteOpsHiddenCapacity();
    expect(candidate.whyNow).toBe(`Signals observed 3 to 20 days ago: ${S1_TITLE}; ${S2_TITLE}`);
    expect(candidate.whyNow).not.toMatch(FORBIDDEN_TEXT);
  });

  it('no generated text contains forbidden tokens', () => {
    const { candidates } = result();
    for (const candidate of candidates) {
      const text = [
        candidate.observation,
        candidate.problemHypothesis,
        candidate.whyNow,
        candidate.whatANoMeans,
        ...candidate.rootCauseHypotheses,
        ...candidate.impactHypotheses,
        ...candidate.falsificationQuestions,
      ].join('\n');
      expect(text).not.toMatch(FORBIDDEN_TEXT);
    }
  });

  it('falsification questions and no-meaning come from the family tables', () => {
    const candidate = siteOpsHiddenCapacity();
    expect(candidate.falsificationQuestions).toEqual(FALSIFICATION_QUESTIONS.hidden_capacity);
    expect(candidate.whatANoMeans).toBe(WHAT_A_NO_MEANS.hidden_capacity);
  });
});

describe('buildCandidates: scoring and expiry', () => {
  it('confidence is 30 + round(avg/5) + 5 for two signals, clamped to 50', () => {
    // avg(90, 70) = 80 -> 16; 30 + 16 + 5 = 51 -> clamped to 50
    expect(siteOpsHiddenCapacity().confidence).toBe(50);
  });

  it('confidence for a single signal omits the multi-signal bonus', () => {
    // avg(70) = 70 -> 14; 30 + 14 + 0 = 44
    const { candidates } = buildCandidates({ ...INPUT, signals: [S2] });
    const candidate = candidates.find((c) => c.personaId === 1 && c.problemFamily === 'hidden_capacity');
    expect(candidate?.confidence).toBe(44);
  });

  it('confidence never leaves 30..50', () => {
    const low: BuildSignal = { ...S2, id: 'S8', confidence: 0 };
    const { candidates } = buildCandidates({ ...INPUT, signals: [low] });
    const candidate = candidates.find((c) => c.personaId === 1);
    expect(candidate?.confidence).toBe(30);
  });

  it('expiresAt equals the earliest linked signal expiry', () => {
    expect(siteOpsHiddenCapacity().expiresAt).toEqual(daysAhead(10));
  });

  it('records the builder and the family hits in provenance', () => {
    const candidate = siteOpsHiddenCapacity();
    expect(candidate.provenance.builder).toBe('gap-builder-v1');
    expect(candidate.provenance.familyHits.hidden_capacity).toBeGreaterThan(0);
  });
});

describe('buildCandidates: determinism', () => {
  it('yields deep-equal output on repeated calls', () => {
    expect(buildCandidates(INPUT)).toEqual(buildCandidates(INPUT));
  });

  it('is independent of signal and persona input order', () => {
    const reversed: BuildInput = {
      ...INPUT,
      personas: [...INPUT.personas].reverse(),
      signals: [...INPUT.signals].reverse(),
    };
    expect(buildCandidates(reversed).candidates).toEqual(buildCandidates(INPUT).candidates);
  });

  it('does not mutate its input', () => {
    const snapshot = JSON.stringify(INPUT);
    buildCandidates(INPUT);
    expect(JSON.stringify(INPUT)).toBe(snapshot);
  });
});
