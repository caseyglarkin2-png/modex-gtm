/**
 * Red team T7: HONEST COPY, pinned as exact text.
 *
 * Posture: VERIFIED FACT -> hypothesis as a question -> low-friction
 * discovery. Never public trivia ("PEP 10-Q mentions: capital expenditure"),
 * never a confident diagnosis, never another company's site, never a cost
 * question before the buyer has said the problem is real.
 */
import { describe, expect, it } from 'vitest';
import { SEED_FAMILIES } from '@/lib/gap/sequences/families';
import { renderStepCopy } from '@/lib/gap/sequence/render';
import { citedQuote, sourceLabel } from '@/lib/gap/research/propose';
import { buildCallPack, stripObservationCitations } from '@/lib/gap/sequence/call-pack';
import { hypothesisSendable, outreachEvidence, sendableEvidence } from '@/lib/gap/research/evidence-gate';
import { checkWordCount } from '@/lib/gap/compiler/checks/c07-structure';

const GIANT_EAGLE =
  'On July 1, 2026, the Company announced it had entered into an agreement and plan of merger pursuant to which it will acquire Giant Eagle, Inc. (“Giant Eagle”).';
const OBSERVATION = citedQuote('KROGER CO 10-Q (filed 2026-09-18)', GIANT_EAGLE, 'sig-ge', 'Kroger');

const FORBIDDEN = [/\bmentions:/i, /\b(Fontana|Columbus|Bluewater|Reno)\b/, /\bcost\b/i, /\bhow many\b/i, /\bmy guess is the doors\b/i, /Signals observed/];

describe('T7 first touch (verified fact -> hypothesis as a question)', () => {
  it('renders the exact buyer-facing email from the approved fact', () => {
    const fam = SEED_FAMILIES.find((f) => f.key === 'new_sites_acquisitions')!;
    const step = fam.steps.steps[0].templates!;
    const r = renderStepCopy({ subject: step.subjectTemplate ?? '', body: step.bodyTemplate ?? '' }, { observation: OBSERVATION, firstName: 'Joey', account: 'Kroger' } as never);
    expect(r.unrendered).toBeNull();
    expect(r.queued.subject).toBe('The new sites');
    expect(r.queued.body).toBe(
      [
        'Hi Joey,',
        `From Kroger's 10-Q filed September 18: "On July 1, 2026, the Company announced it had entered into an agreement and plan of merger pursuant to which it will acquire Giant Eagle, Inc. (“Giant Eagle”)".`,
        '',
        'New or acquired sites usually bring their own habits at the gate and in the yards, and they tend to stay until someone decides how the yards should run. That might not be true at Kroger.',
        '',
        'Has your team settled how the new sites will run their yards, or is that still open?',
        '',
        'Casey Larkin, YardFlow by FreightRoll',
      ].join('\n'),
    );
  });

  it('every family\'s first touch opens with the fact, disclaims knowing the account, ends on a question, and carries nothing forbidden', () => {
    for (const fam of SEED_FAMILIES) {
      const step = fam.steps.steps[0].templates!;
      const r = renderStepCopy({ subject: step.subjectTemplate ?? '', body: step.bodyTemplate ?? '' }, { observation: OBSERVATION, firstName: 'Joey', account: 'Kroger' } as never);
      const paragraphs = r.queued.body.split('\n\n');
      expect(paragraphs[0], fam.key).toContain('Giant Eagle');
      expect(r.queued.body, fam.key).toMatch(/might not be true at Kroger/);
      expect(paragraphs[paragraphs.length - 2].trim().endsWith('?'), fam.key).toBe(true);
      for (const f of FORBIDDEN) expect(r.queued.body, `${fam.key} ${f}`).not.toMatch(f);
    }
  });
});

describe('T7: the PepsiCo shape can produce no first touch and no call script', () => {
  const keyword = { id: 'k', account_name: 'PepsiCo', source_kind: 'pounce_trigger', source_type: 'public_secondary', evidence_text: null, evidence_url: 'https://www.sec.gov/x', observed_at: new Date('2026-07-09T00:00:00Z'), external_ok: null, metadata: null };
  const verified = (id: string, text: string) => ({ id, account_name: 'PepsiCo', source_kind: 'evidence_record', source_type: 'public_primary', evidence_text: text, evidence_url: 'https://www.sec.gov/x', observed_at: new Date('2026-07-09T00:00:00Z'), external_ok: true, metadata: { verified: 'excerpt_found_at_source' } });

  it('the keyword hit plus the three verified-but-irrelevant 10-Q sentences is INSUFFICIENT', () => {
    const ev = outreachEvidence(
      [
        keyword,
        verified('r', 'These pre-tax charges are expected to consist of approximately 50 % of severance and other employee-related costs, 15 % for asset impairments (all non-cash) resulting from plant closures and related actions, and 35 % for other costs associated with the implementation of our initiatives.'),
        verified('f', 'These new or increased legal or regulatory requirements, along with initiatives to meet our sustainability goals, could result in significant increased costs and additional investments in facilities and equipment.'),
        verified('l', 'Our Liquidity and Capital Resources We believe that our cash generating capability and financial condition, together with our revolving credit facilities, working capital lines and other available methods of debt financing, such as commercial paper borrowings and long-term debt financing, will be adequate to meet our operating, investing and financing needs, including with respect to our net capital spending plans.'),
      ],
      'PepsiCo',
    );
    expect(ev.tier).toBe('INSUFFICIENT');
    expect(ev.refused.map((r) => r.reason)).toEqual(['keyword_only', 'not_a_physical_network_change', 'not_a_physical_network_change', 'not_a_physical_network_change']);
  });
});

describe('T7 call opener (real fact + hypothesis as a question; impact only after acknowledgement)', () => {
  it('pins the opener, the current-state question, the post-acknowledgement impact question and the voicemail', () => {
    const pack = buildCallPack({
      firstName: 'Joey',
      senderFirstName: 'Casey',
      accountName: 'Kroger',
      observationPlain: stripObservationCitations(OBSERVATION),
      problemHypothesis: 'My guess is that physical handoffs constrain production capacity at Kroger.',
      diagnosticQuestion: 'Does the Giant Eagle network run its own gate process today?',
      title: 'corporate supply chain planning manager',
    });
    const fact = `From Kroger's 10-Q filed September 18: "On July 1, 2026, the Company announced it had entered into an agreement and plan of merger pursuant to which it will acquire Giant Eagle, Inc. (“Giant Eagle”)".`;
    // Execution acceptance (2026-10-01): the APPROVED hypothesis, as a guess and a question; never a stock line.
    expect(pack.opener).toBe(`Joey, Casey with YardFlow. You weren't expecting me, so tell me if this is off. ${fact} My guess is that physical handoffs constrain production capacity at Kroger. Is that actually an issue for you, or am I off?`);
    expect(pack.diagnostic1).toBe('Does the Giant Eagle network run its own gate process today?');
    expect(pack.impactIfAcknowledged).toBe('If they said it is real: when it happens, what does it cost you, in hours or in trucks waiting?');
    expect(pack.voicemail).toBe(`Joey, Casey with YardFlow. ${fact} I have one question about whether that is changing anything for your team, not a pitch. Call me back if it is worth two minutes.`);
    for (const text of [pack.opener, pack.voicemail]) {
      expect(text).not.toMatch(/\bcost\b/i);
      expect(text).not.toMatch(/\bmentions:/i);
    }
  });
});

describe('Release C review SF1: sendableEvidence', () => {
  const fact = { id: 'f', account_name: 'Kroger', source_kind: 'evidence_record', source_type: 'public_primary', evidence_text: GIANT_EAGLE, evidence_url: 'https://www.sec.gov/x', observed_at: new Date('2026-09-18T00:00:00Z'), external_ok: true, metadata: { verified: 'excerpt_found_at_source' } };
  const keyword = { id: 'k', account_name: 'Kroger', source_kind: 'pounce_trigger', source_type: 'public_secondary', evidence_text: null, evidence_url: 'https://www.sec.gov/x', observed_at: new Date('2026-09-18T00:00:00Z'), external_ok: null, metadata: null };

  it('is VERIFIED_FACT only when the observation cites at least one signal and every cited signal is an outreach fact', () => {
    // Ops closeout 16: the supported shape is a verbatim quote of the cited fact (bare prose is refused: observation-support.test.ts).
    expect(sendableEvidence(`"${GIANT_EAGLE.replace(/\.$/, '')}" [S:f].`, [fact, keyword], 'Kroger')).toMatchObject({ tier: 'VERIFIED_FACT', nonFactCitations: [], unsupported: null });
    expect(sendableEvidence('Giant Eagle [S:f]. Capex [S:k].', [fact, keyword], 'Kroger')).toMatchObject({ tier: 'INSUFFICIENT', nonFactCitations: ['k'] });
    expect(sendableEvidence('Giant Eagle [S:f]. Ghost [S:gone].', [fact], 'Kroger')).toMatchObject({ tier: 'INSUFFICIENT', nonFactCitations: ['gone'] });
    expect(sendableEvidence('Giant Eagle, uncited.', [fact], 'Kroger')).toMatchObject({ tier: 'INSUFFICIENT', nonFactCitations: [] });
    expect(sendableEvidence(null, [fact], 'Kroger').tier).toBe('INSUFFICIENT');
    expect(sendableEvidence('Capex [S:k].', [keyword], 'Kroger').tier).toBe('INSUFFICIENT');
  });
});

describe('Release C review SF3/SF4: call questions and source labels', () => {
  const base = { firstName: 'Joey', senderFirstName: 'Casey', accountName: 'Kroger', observationPlain: 'A fact.', problemHypothesis: 'p' };

  it.each([
    'What does it cost you when a trailer waits?',
    'How many trailers wait on a typical day?',
    'How long does a driver wait at the gate?',
    'Roughly what percent of loads are late?',
    'Is it more than $10k a month?',
  ])('a quantifying diagnostic (%s) is never the current-state question', (q) => {
    expect(buildCallPack({ ...base, diagnosticQuestion: q }).diagnostic1).toBe('How does that work at Kroger today?');
  });

  it('a current-state diagnostic is kept', () => {
    expect(buildCallPack({ ...base, diagnosticQuestion: 'Do drivers check in at a guard shack?' }).diagnostic1).toBe('Do drivers check in at a guard shack?');
  });

  it('a filing title reads the way a person would say it; any other title is kept', () => {
    expect(sourceLabel('KROGER CO 10-Q (filed 2026-09-18)')).toBe("From Kroger's 10-Q filed September 18");
    expect(sourceLabel('PEPSICO INC 10-K (2026-02-03)', 'PepsiCo')).toBe("From PepsiCo's 10-K filed February 3");
    expect(sourceLabel('THE HERSHEY CO 8-K', "Hershey's")).toBe("From Hershey's 8-K");
    expect(sourceLabel('UNITED STATES STEEL CORP 10-Q')).toBe("From United States Steel's 10-Q");
    expect(sourceLabel('GENERAL MILLS INC 10-Q')).toBe("From General Mills' 10-Q");
    expect(sourceLabel('Acme opens Ohio DC (press release)')).toBe('Acme opens Ohio DC (press release)');
  });
});

describe('red team T7: the honest first touch fits the compiler (C07) for every seed family', () => {
  it('with the real Kroger 10-Q quote, every family passes the step 0 word range', () => {
    for (const fam of SEED_FAMILIES) {
      const step = fam.steps.steps[0].templates!;
      const r = renderStepCopy({ subject: step.subjectTemplate ?? '', body: step.bodyTemplate ?? '' }, { observation: OBSERVATION, firstName: 'Joey', account: 'Kroger' } as never);
      const evidence = [{ id: 'sig-ge', title: 'KROGER CO 10-Q (filed 2026-09-18)', url: null, externalOk: true, fresh: true, superseded: false, firstParty: false, excerpt: GIANT_EAGLE }];
      const c = checkWordCount({ subject: r.marked.subject, body: r.marked.body } as never, { stepIndex: 0, evidence, contract: null, priorStepBodies: [] } as never);
      expect(c.passed, `${fam.key}: ${c.detail}`).toBe(true);
    }
  });
});

describe('red team T7: the numbers in a verified quote are covered by C01', () => {
  it('evidence refs carry the quoted excerpt, and the Kroger first touch passes C01', async () => {
    const { evidenceRefsFromSignals } = await import('@/lib/gap/compiler/evidence-from-signals');
    const { checkObservationUnsupported } = await import('@/lib/gap/compiler/checks/c01-evidence');
    const sig = {
      id: 'sig-ge',
      title: 'KROGER CO 10-Q (filed 2026-09-18)',
      evidence_url: 'https://www.sec.gov/x',
      external_ok: true,
      observed_at: new Date('2026-09-18T00:00:00Z'),
      freshness_expires_at: null,
      source_type: 'public_primary',
      metadata: { verified: 'excerpt_found_at_source' },
      evidence_text: GIANT_EAGLE,
      source_kind: 'evidence_record',
    };
    const refs = evidenceRefsFromSignals([sig], new Date('2026-09-26T00:00:00Z'));
    expect(refs[0].excerpt).toBe(GIANT_EAGLE);
    for (const fam of SEED_FAMILIES) {
      const step = fam.steps.steps[0].templates!;
      const r = renderStepCopy({ subject: step.subjectTemplate ?? '', body: step.bodyTemplate ?? '' }, { observation: OBSERVATION, firstName: 'Joey', account: 'Kroger' } as never);
      const c = checkObservationUnsupported({ subject: r.marked.subject, body: r.marked.body } as never, { stepIndex: 0, hypothesis: { observation: OBSERVATION, problemHypothesis: 'p', problemFamily: fam.problemFamily }, evidence: refs, contract: null, priorStepBodies: [] });
      expect(c.passed, `${fam.key}: ${c.detail}`).toBe(true);
    }
  });
});

describe('Release C re-review S8, under I06: an ENDED fact never opens a call (an expired one does, cited with its date)', () => {
  const sig = { id: 'sig-ge', title: 'KROGER CO 10-Q (filed 2026-09-18)', account_name: 'Kroger', source_kind: 'evidence_record', source_type: 'public_primary', evidence_text: GIANT_EAGLE, evidence_url: 'https://www.sec.gov/x', observed_at: new Date('2026-09-18T00:00:00Z'), external_ok: true, metadata: { verified: 'excerpt_found_at_source' } };
  const now = new Date('2026-09-27T00:00:00Z');
  it('the call-pack gate uses live signals only', () => {
    expect(hypothesisSendable({ observation: OBSERVATION, account_name: 'Kroger', signals: [{ signal: { ...sig, freshness_expires_at: null } }] }, now)).toBe(true);
    expect(hypothesisSendable({ observation: OBSERVATION, account_name: 'Kroger', signals: [{ signal: { ...sig, freshness_expires_at: new Date('2026-12-01T00:00:00Z') } }] }, now)).toBe(true);
    expect(hypothesisSendable({ observation: OBSERVATION, account_name: 'Kroger', signals: [{ signal: { ...sig, freshness_expires_at: new Date('2026-09-20T00:00:00Z') } }] }, now)).toBe(true);
    expect(hypothesisSendable({ observation: OBSERVATION, account_name: 'Kroger', signals: [{ signal: { ...sig, metadata: { ...sig.metadata, continuity: { kind: 'ended' } } } }] }, now)).toBe(false);
  });

  it('the action pack view builds its call script through that gate', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync('src/components/gap/action-pack-view.tsx', 'utf8');
    expect(src).toContain('hypothesisSendable(hypothesis, new Date())');
    expect(src).not.toMatch(/sendableEvidence\(/);
  });
});

/**
 * Final red-team regression (RevOps P1): "Copy email" was the one path around
 * every gate. It rendered for a compiler REJECT, a do-not-contact person and an
 * INSUFFICIENT hypothesis, and copied a body with no unsubscribe footer. A
 * paste into Gmail plus "record manual send" is how the only production GAP
 * send happened.
 */
describe('final regression: Copy email is gated like SEND', () => {
  it('execution acceptance: COPY EMAIL is the governed server copy (every gate plus suppression); no plain copy of the email, the address, the phone or the opener', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync('src/components/gap/action-pack-view.tsx', 'utf8');
    expect(src).toContain('const copyable = Boolean(sendable && verifiedFact && persona?.email && decision)');
    expect(src).toContain('<GovernedCopyButton decisionId={decision.id} stepIndex={touchStep} />');
    expect(src).not.toMatch(/<CopyButton\b/);
    expect(src).not.toMatch(/Copy email address|Copy phone|Copy call opener/);
  });
});
