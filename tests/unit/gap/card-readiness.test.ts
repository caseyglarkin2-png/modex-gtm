import { describe, expect, it } from 'vitest';
import { cardReadiness, sellerLaneOf, type ReadinessInput } from '@/lib/gap/routing/card-readiness';
import { ROUTING_ACTIONS } from '@/lib/gap/taxonomy';
import type { SuppressionClass } from '@/lib/gap/suppression/provenance';

const RULES_FOR_RESEARCH = ['no_hypothesis', 'bounced_or_invalid', 'tam_unknown', 'hyp_stale', 'disp_wrong_person', 'suppression_review', 'something_new'];

function item(over: Partial<ReadinessInput> = {}): ReadinessInput {
  return {
    id: 'dec-1',
    action: 'enroll_gap_sequence',
    blocked: false,
    ruleId: 'enroll',
    account: { name: 'Kroger', hubspotCompanyId: '555' },
    persona: {
      id: 1886,
      displayName: 'Joey Maggard',
      email: 'joey.maggard@kroger.com',
      phone: '+15137624000',
      linkedinUrl: 'http://www.linkedin.com/in/joey-maggard',
      hubspotContactId: '217681150841',
    },
    hypothesis: { id: 'hyp-1', status: 'active' },
    suppression: { class: 'clear', hits: [] },
    ...over,
  };
}

/** Every combination of present/missing contact data and hypothesis. */
function variants(base: ReadinessInput): ReadinessInput[] {
  const out: ReadinessInput[] = [];
  for (const email of [base.persona.email, null])
    for (const phone of [base.persona.phone ?? null, null])
      for (const linkedinUrl of [base.persona.linkedinUrl ?? null, null])
        for (const hubspotContactId of [base.persona.hubspotContactId, null])
          for (const hubspotCompanyId of [base.account.hubspotCompanyId, null])
            for (const hypothesis of [base.hypothesis, null])
              out.push({
                ...base,
                account: { ...base.account, hubspotCompanyId },
                persona: { ...base.persona, email, phone, linkedinUrl, hubspotContactId },
                hypothesis,
              });
  return out;
}

const CLASSES: SuppressionClass[] = ['clear', 'soft_deliverability', 'hard_invalid_address', 'unknown_provenance'];

describe('cardReadiness: the two-state invariant for every non-blocked card', () => {
  it('every action x ruleId x data combination is actionable or names the missing prerequisite with a fix link', () => {
    let checked = 0;
    for (const action of ROUTING_ACTIONS) {
      if (action === 'do_not_contact') continue;
      const ruleIds = action === 'research_required' ? RULES_FOR_RESEARCH : ['r'];
      for (const ruleId of ruleIds)
        for (const cls of CLASSES)
          for (const v of variants(item({ action, ruleId, suppression: { class: cls, hits: cls === 'clear' ? [] : ['modex_do_not_contact'] } }))) {
            const r = cardReadiness(v);
            checked += 1;
            expect(['actionable', 'missing_prerequisite']).toContain(r.state);
            if (r.state === 'actionable') {
              expect(r.primary.label.length).toBeGreaterThan(0);
              if (r.primary.href === null) expect(action).toBe('nurture');
            }
            if (r.state === 'missing_prerequisite') {
              expect(r.missing.length).toBeGreaterThan(10);
              expect(r.fix.href.length).toBeGreaterThan(0);
            }
          }
    }
    expect(checked).toBeGreaterThan(1000);
  });

  it('never offers an email action pack without an email address or without a hypothesis', () => {
    for (const action of ['enroll_gap_sequence', 'one_off_email']) {
      const noEmail = cardReadiness(item({ action, persona: { ...item().persona, email: null } }));
      expect(noEmail.state).toBe('missing_prerequisite');
      expect(noEmail.state === 'missing_prerequisite' && noEmail.missing).toContain('No email address');
      const noHyp = cardReadiness(item({ action, hypothesis: null }));
      expect(noHyp.state === 'missing_prerequisite' && noHyp.missing).toContain('No hypothesis covers');
    }
  });

  it('Joey (enroll, full contact data, active hypothesis): actionable, action pack carries HIS persona id and the decision id', () => {
    const r = cardReadiness(item());
    expect(r.state).toBe('actionable');
    expect(r.state === 'actionable' && r.primary.href).toBe('/gap?lane=ready&open=dec-1#card-dec-1');
  });

  it('Jason (research_required, no hypothesis): exact prerequisite, never a fabricated email', () => {
    const r = cardReadiness(item({ action: 'research_required', ruleId: 'no_hypothesis', hypothesis: null, persona: { ...item().persona, id: 1788, displayName: 'jason gaiser' } }));
    expect(r.state).toBe('missing_prerequisite');
    expect(r.state === 'missing_prerequisite' && r.missing).toContain('No hypothesis covers jason at Kroger');
    expect(r.state === 'missing_prerequisite' && r.fix.href).toBe('/gap?lane=review');
  });

  it('unknown provenance is always a review prerequisite, never an outreach action', () => {
    for (const action of ['enroll_gap_sequence', 'call_now', 'linkedin_manual_task']) {
      const r = cardReadiness(item({ action, suppression: { class: 'unknown_provenance', hits: ['clawd_do_not_send'] } }));
      expect(r.state).toBe('missing_prerequisite');
      expect(r.state === 'missing_prerequisite' && r.missing).toContain('clawd_do_not_send');
    }
  });

  it('soft historical bounce keeps the call actionable with a visible warning', () => {
    const r = cardReadiness(item({ action: 'call_now', suppression: { class: 'soft_deliverability', hits: ['modex_do_not_contact'] } }));
    expect(r.state).toBe('actionable');
    expect(r.state === 'actionable' && r.warning?.title).toBe('Historical bounce, not a do-not-contact');
  });

  it('blocked cards stay blocked, with the hard-compliance or outage copy', () => {
    expect(cardReadiness(item({ blocked: true, action: 'do_not_contact', ruleId: 'suppressed', suppression: { class: 'hard_compliance', hits: ['hubspot_optout'] } }))).toMatchObject({ state: 'blocked', title: 'Do not contact' });
    expect(cardReadiness(item({ blocked: true, action: 'research_required', ruleId: 'suppression_unknown', suppression: { class: 'service_unreadable', hits: [] } }))).toMatchObject({ state: 'blocked', title: 'Suppression status unknown' });
  });
});

describe('cardReadiness: sequence cards (last mile)', () => {
  const base = () => ({
    id: 'dec-1', action: 'enroll_gap_sequence', blocked: false, ruleId: 'enroll',
    account: { name: 'Kroger', hubspotCompanyId: '555' },
    persona: { id: 1886, displayName: 'Joey Maggard', email: 'joey@kroger.com', hubspotContactId: '1' },
    hypothesis: { id: 'hyp-1' }, suppression: { class: 'clear' as const, hits: [] },
  });

  it('WAITING: touch 2 due Wed, no action to take', () => {
    const r = cardReadiness({ ...base(), touch: { state: 'waiting', stepIndex: 1, dueAt: '2026-09-30T15:00:00.000Z', sentCount: 1 } });
    expect(r.state === 'actionable' && r.primary.label).toBe('Waiting: touch 2 due Wed, Sep 30');
    expect(r.state === 'actionable' && r.primary.href).toBeNull();
  });

  it('FOLLOW UP: touch due opens the action pack', () => {
    const r = cardReadiness({ ...base(), touch: { state: 'due', stepIndex: 1, dueAt: '2026-09-30T15:00:00.000Z', sentCount: 1 } });
    expect(r.state === 'actionable' && r.primary).toMatchObject({ label: 'Follow up: touch 2', href: '/gap?lane=follow_up&open=dec-1#card-dec-1' });
  });

  it('REPLIED: sequence stopped, points at logging the reply', () => {
    const r = cardReadiness({ ...base(), touch: { state: 'stopped', reason: 'replied', detail: 'Buyer replied.', sentCount: 1 } });
    expect(r.state === 'actionable' && r.primary).toMatchObject({ label: 'Replied: sequence stopped. Log the reply', href: '/gap?lane=replies' });
  });

  it('unreadable sequence state is a named prerequisite, never an outreach action', () => {
    expect(cardReadiness({ ...base(), touch: { state: 'unknown', detail: 'Gmail 503', sentCount: 1 } }).state).toBe('missing_prerequisite');
  });
});

describe('cardReadiness: RESEARCH THIS', () => {
  it('evidence-gap research cards are researchable; other prerequisites are not', () => {
    const b = { id: 'd', action: 'research_required', blocked: false, account: { name: 'Kroger', hubspotCompanyId: '1' }, persona: { id: 1, displayName: 'Joey', email: 'j@k.com', hubspotContactId: '2' }, hypothesis: { id: 'h' } };
    for (const ruleId of ['evidence_thin', 'no_hypothesis', 'hyp_stale']) {
      const r = cardReadiness({ ...b, ruleId });
      expect(r.state === 'missing_prerequisite' && r.researchable).toBe(true);
    }
    const tam = cardReadiness({ ...b, ruleId: 'tam_unknown' });
    expect(tam.state === 'missing_prerequisite' && tam.researchable).toBeFalsy();
  });
});

describe('sellerLaneOf: the /gap work lanes', () => {
  it('an actionable email card is READY; once Casey acted it leaves READY', () => {
    expect(sellerLaneOf(item())).toBe('ready');
    expect(sellerLaneOf({ ...item(), humanAction: 'emailed' })).toBe('later');
  });
  it('a due touch is FOLLOW UP; a waiting, stopped or complete sequence is not', () => {
    expect(sellerLaneOf(item({ touch: { state: 'due', stepIndex: 1, dueAt: '2026-10-01T00:00:00Z', sentCount: 1 } }))).toBe('follow_up');
    for (const state of ['waiting', 'stopped', 'complete', 'unknown'] as const) expect(sellerLaneOf(item({ touch: { state, sentCount: 1 } }))).toBe('later');
  });
  it('a person whose reply is waiting (R3, reply_triage) is never READY: the reply is decided in REPLIES first', () => {
    expect(sellerLaneOf({ ...item({ action: 'one_off_email', ruleId: 'reply_pending' }), lane: 'reply_triage' })).toBe('later');
    expect(sellerLaneOf({ ...item({ action: 'one_off_email', ruleId: 'hot' }), lane: 'work_queue' })).toBe('ready');
  });
  it('Approve only (hypothesis approved, not in use) is never READY: the open decision is USE, which lives in REVIEW', () => {
    expect(sellerLaneOf(item({ action: 'enroll_gap_sequence', ruleId: 'enroll', hypothesis: { id: 'hyp-1', status: 'approved' } }))).toBe('review');
    expect(sellerLaneOf(item({ action: 'enroll_gap_sequence', ruleId: 'enroll', hypothesis: { id: 'hyp-1', status: 'active' } }))).toBe('ready');
  });
  it('missing evidence is RESEARCH; a proposed hypothesis is REVIEW; a system block is blocked; nurture is later', () => {
    expect(sellerLaneOf(item({ action: 'research_required', ruleId: 'evidence_thin' }))).toBe('research');
    expect(sellerLaneOf(item({ action: 'approve_hypothesis', ruleId: 'hyp_proposed' }))).toBe('review');
    expect(sellerLaneOf(item({ action: 'do_not_contact', blocked: true, ruleId: 'suppressed' }))).toBe('blocked');
    expect(sellerLaneOf(item({ action: 'nurture', ruleId: 'active_opportunity' }))).toBe('later');
  });
});
