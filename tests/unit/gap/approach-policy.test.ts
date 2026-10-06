/**
 * R30: evidence is admitted by approach, never by one universal rule and never by a permissive fallback. The
 * event-led path is exactly the physical-change gate; the job / procurement path admits a live posting or notice and
 * nothing else; the report-led path is not enabled and says so; a reply, a deal or a warm introduction needs no
 * thesis. A job claim under the event-led path is refused with the reason; a closed posting is refused.
 */
import { describe, expect, it } from 'vitest';
import { APPROACH_POLICY, approachOfHypothesis, claimAdmittedFor, contextApproachOf, isApproach } from '@/lib/gap/research/approach-policy';
import { hypothesisSendable, outreachFactRefusal, VERIFIED_EXCERPT } from '@/lib/gap/research/evidence-gate';

const AT = new Date('2026-09-20T00:00:00Z');
const signal = (over: Record<string, unknown>) => ({ id: 's1', account_name: 'PepsiCo', source_kind: 'evidence_record', source_type: 'public_secondary', evidence_url: 'https://jobs.pepsico.com/yard-ops-dallas', observed_at: AT, external_ok: true, metadata: { verified: VERIFIED_EXCERPT }, title: 'PepsiCo Careers', ...over });
const JOB = 'PepsiCo is now hiring a Yard Operations Manager in Dallas who will be responsible for trailer spotting, gate check-in and dock scheduling.';
const PHYSICAL = 'PepsiCo will close its warehouse operations at its Tulsa, Oklahoma, production facility and shift duties to a new site in the area.';

describe('the approach policy', () => {
  it('every approach states what it needs, what it admits and what it forbids; the report-led path is not enabled; no approach admits everything', () => {
    for (const p of Object.values(APPROACH_POLICY)) {
      expect(p.requires.length).toBeGreaterThan(0);
      expect(p.forbids.length).toBeGreaterThan(0);
      expect(p.admits.length).toBeLessThan(4);
    }
    expect(APPROACH_POLICY.report_led.enabled).toBe(false);
    expect(claimAdmittedFor('report_led', { claimClass: 'FACT' })).toEqual({ ok: false, reason: 'approach_not_enabled' });
    expect(isApproach('event_led')).toBe(true);
    expect(isApproach('permissive')).toBe(false);
  });
  it('a job claim is admitted under the job/procurement approach only when not closed; a physical fact is admitted under event-led and job-led; fit-led needs an ongoing state', () => {
    expect(claimAdmittedFor('event_led', { claimClass: 'JOB_POSTING' })).toEqual({ ok: false, reason: 'claim_not_admitted_for_approach' });
    expect(claimAdmittedFor('job_procurement_led', { claimClass: 'JOB_POSTING', attributes: { postingStatus: 'open' } })).toEqual({ ok: true });
    expect(claimAdmittedFor('job_procurement_led', { claimClass: 'JOB_POSTING', attributes: { postingStatus: 'closed' } })).toEqual({ ok: false, reason: 'posting_closed' });
    expect(claimAdmittedFor('job_procurement_led', { claimClass: 'PROCUREMENT' })).toEqual({ ok: true });
    expect(claimAdmittedFor('job_procurement_led', { claimClass: 'LEADERSHIP' })).toEqual({ ok: false, reason: 'claim_not_admitted_for_approach' });
    expect(claimAdmittedFor('fit_led', { claimClass: 'FACT', continuity: 'event' })).toEqual({ ok: false, reason: 'not_an_ongoing_state' });
    expect(claimAdmittedFor('fit_led', { claimClass: 'FACT', continuity: 'ongoing_state' })).toEqual({ ok: true });
  });
  it('a reply, a deal and a warm introduction need no thesis; a cold fact-led motion maps to no context approach', () => {
    expect(contextApproachOf('FOLLOW_UP')).toBe('existing_thread_reply');
    expect(contextApproachOf('IN_DEAL')).toBe('active_deal_follow_up');
    expect(contextApproachOf('RELATIONSHIP_LED')).toBe('warm_intro');
    expect(contextApproachOf('FACT_LED')).toBeNull();
    for (const a of ['existing_thread_reply', 'active_deal_follow_up', 'warm_intro'] as const) expect(APPROACH_POLICY[a].needsThesis).toBe(false);
  });
});

describe('the gate by approach', () => {
  it('the event-led path is unchanged: a physical change passes, a job claim is refused as not a physical change', () => {
    expect(outreachFactRefusal(signal({ evidence_text: PHYSICAL, claim_class: 'FACT' }), 'PepsiCo')).toBeNull();
    expect(outreachFactRefusal(signal({ evidence_text: JOB, claim_class: 'JOB_POSTING' }), 'PepsiCo')).toBe('not_a_physical_network_change');
    expect(outreachFactRefusal(signal({ evidence_text: JOB, claim_class: 'JOB_POSTING' }), 'PepsiCo', { approach: 'event_led' })).toBe('not_a_physical_network_change');
  });
  it('under the job/procurement approach a verified, own, live job claim passes the attribution and publisher rules; a closed one, a third party\'s and a leadership claim do not', () => {
    expect(outreachFactRefusal(signal({ evidence_text: JOB, claim_class: 'JOB_POSTING' }), 'PepsiCo', { approach: 'job_procurement_led' })).toBeNull();
    expect(outreachFactRefusal(signal({ evidence_text: JOB, claim_class: 'JOB_POSTING', metadata: { verified: VERIFIED_EXCERPT, claimAttributes: { postingStatus: 'closed' } } }), 'PepsiCo', { approach: 'job_procurement_led' })).toBe('posting_closed');
    expect(outreachFactRefusal(signal({ evidence_text: `${JOB.replace(/\.$/, '')}, said the CEO of HireCo.`, claim_class: 'JOB_POSTING', evidence_url: 'https://hireco.example/news' }), 'PepsiCo', { approach: 'job_procurement_led' })).toBe('third_party_statement');
    expect(outreachFactRefusal(signal({ evidence_text: 'PepsiCo named Jane Doe as Senior Vice President of Supply Chain.', claim_class: 'LEADERSHIP' }), 'PepsiCo', { approach: 'job_procurement_led' })).toBe('claim_not_admitted_for_approach');
    // The other gate rules still run: unverified, another account's, a search redirect.
    expect(outreachFactRefusal(signal({ evidence_text: JOB, claim_class: 'JOB_POSTING', metadata: {} }), 'PepsiCo', { approach: 'job_procurement_led' })).toBe('not_verified');
    expect(outreachFactRefusal(signal({ evidence_text: JOB, claim_class: 'JOB_POSTING', account_name: 'Kroger' }), 'PepsiCo', { approach: 'job_procurement_led' })).toBe('other_account');
    expect(outreachFactRefusal(signal({ evidence_text: JOB, claim_class: 'JOB_POSTING', evidence_url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/x' }), 'PepsiCo', { approach: 'job_procurement_led' })).toBe('redirect_source');
    // The report-led approach refuses everything with its reason.
    expect(outreachFactRefusal(signal({ evidence_text: PHYSICAL, claim_class: 'FACT' }), 'PepsiCo', { approach: 'report_led' })).toBe('approach_not_enabled');
  });
  it('a thesis is sendable under the approach it declares: a job-led thesis on a job claim; the same thesis without the declaration is not', () => {
    const observation = `PepsiCo Careers: "${JOB.replace(/\.$/, '')}" [S:s1].`;
    const row = (metadata: unknown) => ({ observation, account_name: 'PepsiCo', metadata, signals: [{ signal: { ...signal({ evidence_text: JOB, claim_class: 'JOB_POSTING' }), freshness_expires_at: null } }] });
    expect(hypothesisSendable(row({ approach: 'job_procurement_led' }), AT)).toBe(true);
    expect(hypothesisSendable(row(null), AT)).toBe(false);
    expect(hypothesisSendable(row({ approach: 'report_led' }), AT)).toBe(false);
    expect(approachOfHypothesis({ metadata: { approach: 'nonsense' } })).toBe('event_led');
  });
});
