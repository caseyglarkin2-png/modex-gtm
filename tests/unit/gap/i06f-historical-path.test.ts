// @vitest-environment node
/**
 * I06f (GAP OS prospecting first, the course correction, 2026-10-08): an OLDER observation progresses through the
 * full preparation path, not merely the intelligence list. One 2018 site expansion at Hormel Foods, verified and
 * quoted, goes: the draft gate (draftFactRefusal) -> the observation, written with its date -> actionability READY
 * -> the machine approves and activates (no calendar expiry) -> routing does not hold it for age (R12 reads
 * usability) -> the compiler's C01 accepts the copy because it states "May 2018", and refuses the same copy without
 * the date -> the send gate and enrollment read it as usable. The same fact a newer source says ENDED is refused at
 * every one of those gates, by name. Pure functions throughout: the same code production runs, no database.
 */
import { describe, expect, it } from 'vitest';
import { draftFactRefusal } from '@/lib/gap/story/draft-from-fact';
import { citedQuote, reportedFor } from '@/lib/gap/research/propose';
import { validateObservation } from '@/lib/gap/hypothesis/observation';
import { outreachReadiness } from '@/lib/gap/hypothesis/actionability';
import { transition } from '@/lib/gap/hypothesis/machine';
import { routePersona } from '@/lib/gap/routing/route';
import { DEFAULT_FRESHNESS, type RoutingInputs } from '@/lib/gap/routing/types';
import { evidenceRefsFromSignals } from '@/lib/gap/compiler/evidence-from-signals';
import { checkObservationUnsupported } from '@/lib/gap/compiler/checks/c01-evidence';
import { hypothesisSendable, VERIFIED_EXCERPT } from '@/lib/gap/research/evidence-gate';
import { checkEvidenceFreshness } from '@/lib/gap/enroll/service';
import { factUsability, isCurrentFact } from '@/lib/gap/research/currentness';

const NOW = new Date('2026-10-08T15:00:00Z');
const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);
const QUOTE = 'Hormel Foods broke ground on a 300,000-square-foot distribution center expansion at its Austin, Minnesota plant.';
const TITLE = 'Hormel plans distribution center expansion at Austin plant';

const fact = (over: Record<string, unknown> = {}) => ({
  id: 'f-hormel-2018', account_name: 'Hormel Foods', source_kind: 'evidence_record', source_type: 'public_secondary', evidence_text: QUOTE,
  evidence_url: 'https://news.example.com/hormel/austin', observed_at: new Date('2018-05-01T12:00:00Z'), external_ok: true,
  metadata: { verified: VERIFIED_EXCERPT }, title: TITLE, claim_class: null, type: 'site_expansion', freshness_expires_at: null, ...over,
});

function routing(over: Partial<RoutingInputs['hypothesis']> = {}): RoutingInputs {
  return {
    now: NOW,
    account: { name: 'Hormel Foods', slug: 'hormel-foods', hubspotCompanyId: '111', tam: 'in', tamTier: 'A', heatTier: 2, heat: 60, intentScore: null, lastIntentAt: null, triggerScore: 5, lastTriggerAt: daysAgo(3), outreachStatus: 'not_started', opportunity: { status: 'CLEAR', companyIds: ['111'] } },
    signals: { freshTriggers: [], newestAgeDays: null },
    persona: { id: 42, personaKey: 'executive_ops', roleGatePassed: true, seniorityRank: 3, email: 'vp@hormel.example', emailValid: true, emailStatus: 'valid', phone: '+15555550100', phoneStatus: 'valid', linkedinUrl: 'https://www.linkedin.com/in/hormel-vp', hubspotContactId: '222', qualVerdict: 'qualified', lastIntentSource: null, doNotContact: false, top100: null },
    hypothesis: {
      id: 'hyp-hormel', status: 'active', family: 'hidden_capacity', confidence: 0.6,
      // I06: the fact is historical (not fresh) and usable; no calendar expiry.
      evidenceFresh: false, evidenceUsable: true, hasNewerVersion: false, expiresAt: null, resumeAt: null, version: 1,
      observation: 'Hormel Foods expanded its Austin distribution center in May 2018.', problemHypothesis: 'My guess is the expanded yards still run gate checks on paper.', whyNow: null,
      falsificationQuestions: ['Does the Austin site run the same gate process as before the expansion?'], whatANoMeans: 'The expansion came with a standard gate process.', evidenceIds: ['f-hormel-2018'], signalIds: ['f-hormel-2018'],
      ...over,
    },
    comms: { inFlight: false, lastOutboundAt: null, lastInboundAt: null, undispositionedInbound: false, lastDisposition: null, meetingBooked: false },
    suppression: { verdict: 'clear', legs: { unsubscribed: 'clear', do_not_contact: 'clear', clawd: 'clear', hs_email_optout: 'clear' } },
    freshness: { ...DEFAULT_FRESHNESS },
  } as RoutingInputs;
}

const decision = (i: RoutingInputs) => { const r = routePersona(i); if (r.kind !== 'decision') throw new Error(`expected a decision, got skip ${r.reason}`); return r.decision; };
const toMarkers = (observation: string) => observation.replace(/\[S:([A-Za-z0-9_-]+)\]/g, '[[SRC:$1]]');
const draft = (body: string) => ({ subject: 'Austin yards', body: `Hi Sam,\n\n${body}\n\nMy guess is the expanded yards still run gate checks on paper. Is that close?\n\nCasey Larkin` });
const c01ctx = (observation: string, evidence: ReturnType<typeof evidenceRefsFromSignals>) => ({ stepIndex: 0, hypothesis: { observation, problemHypothesis: 'My guess is the expanded yards still run gate checks on paper.', problemFamily: 'hidden_capacity' }, evidence, priorStepBodies: [], contract: null });

describe('I06f: a 2018 observation goes through the whole preparation path', () => {
  const f = fact();

  it('is historical by the clock and usable by the authority', () => {
    expect(isCurrentFact(f, NOW)).toBe(false);
    expect(factUsability(f, NOW)).toMatchObject({ usable: true, historical: true, reason: null });
  });

  it('1. the draft gate lets it carry a thesis; 2. the observation is written with its date and validates', () => {
    expect(draftFactRefusal(f, 'Hormel Foods', NOW)).toBeNull();
    const observation = citedQuote(TITLE, QUOTE, f.id, 'Hormel Foods', reportedFor(f, NOW));
    expect(observation).toBe(`${TITLE} (reported May 2018): "${QUOTE.replace(/\.$/, '')}" [S:f-hormel-2018].`);
    expect(validateObservation(observation, [f.id])).toMatchObject({ ok: true });
  });

  it('3. actionability is READY; 4. the machine approves and activates it with no calendar expiry', () => {
    const observation = citedQuote(TITLE, QUOTE, f.id, 'Hormel Foods', reportedFor(f, NOW));
    expect(outreachReadiness({ observation, account_name: 'Hormel Foods', signals: [f] }, NOW)).toEqual({ ready: true, reason: null });
    const snapshot = {
      status: 'review_required' as const, problemFamily: 'hidden_capacity', persona: 'site_ops', observation,
      problemHypothesis: 'My guess is the expanded yards still run gate checks on paper.', falsificationQuestions: ['Does the Austin site run the same gate process as before?'],
      linkedSignals: [{ id: f.id, hasEvidence: true, outreachFact: true, expiresAt: new Date('2018-08-29T12:00:00Z'), usable: true }],
      reviewedBy: null, primaryPersonaId: null, personaSuppressed: false, version: null, expiresAt: null, confirmedDispositions: [],
    };
    expect(transition(snapshot, 'approve', { now: NOW, actor: 'casey' })).toEqual({ ok: true, to: 'approved', effects: ['set_reviewed'] });
    expect(transition({ ...snapshot, status: 'approved', reviewedBy: 'casey', primaryPersonaId: 42, version: { status: 'frozen', firstTouchProductProof: false } }, 'activate', { now: NOW })).toMatchObject({ ok: true, to: 'active', effects: ['set_activated', 'freeze_narrative', 'set_expires_at'] });
  });

  it('5. routing does not hold the card for age (R12 reads usability)', () => {
    const d = decision(routing());
    expect(d.ruleId).not.toBe('hyp_stale');
    expect(d.action).not.toBe('research_required');
    const ended = decision(routing({ evidenceUsable: false }));
    expect(ended.ruleId).toBe('hyp_stale');
    expect(ended.reason).toBe('evidence_stale');
  });

  it('6. the compiler accepts the copy that states the date and refuses the same copy without it; 7. the send gate and enrollment read it as usable', () => {
    const observation = citedQuote(TITLE, QUOTE, f.id, 'Hormel Foods', reportedFor(f, NOW));
    const refs = evidenceRefsFromSignals([f as never], NOW);
    expect(refs[0]).toMatchObject({ id: f.id, fresh: false, usable: true, observedAt: '2018-05-01T12:00:00.000Z' });
    const dated = checkObservationUnsupported(draft(toMarkers(observation)), c01ctx(observation, refs));
    expect(dated.passed, dated.detail).toBe(true);
    const undated = checkObservationUnsupported(draft(toMarkers(observation.replace(' (reported May 2018)', ''))), c01ctx(observation, refs));
    expect(undated.passed).toBe(false);
    expect(undated.detail).toMatch(/historical evidence f-hormel-2018 without its date \(May 2018\)/);
    expect(hypothesisSendable({ observation, account_name: 'Hormel Foods', signals: [{ signal: f as never }] }, NOW)).toBe(true);
    expect(checkEvidenceFreshness([f], NOW)).toBeNull();
  });

  it('the same fact a newer source says ENDED is refused at every gate, by name, whatever the copy says', () => {
    const ended = fact({ metadata: { verified: VERIFIED_EXCERPT, continuity: { kind: 'ended' } } });
    expect(draftFactRefusal(ended, 'Hormel Foods', NOW)).toEqual({ reason: 'fact_not_outreach_evidence', detail: 'A newer source says this ended: not a story for a first touch.' });
    expect(hypothesisSendable({ observation: 'x [S:f-hormel-2018].', account_name: 'Hormel Foods', signals: [{ signal: ended as never }] }, NOW)).toBe(false);
    expect(checkEvidenceFreshness([ended], NOW)).toBe('evidence_expired');
    const refs = evidenceRefsFromSignals([ended as never], NOW);
    expect(refs[0]).toMatchObject({ usable: false });
    const observation = citedQuote(TITLE, QUOTE, ended.id, 'Hormel Foods', reportedFor(ended, NOW));
    expect(checkObservationUnsupported(draft(toMarkers(observation)), c01ctx(observation, refs)).detail).toMatch(/unusable evidence f-hormel-2018/);
  });
});
