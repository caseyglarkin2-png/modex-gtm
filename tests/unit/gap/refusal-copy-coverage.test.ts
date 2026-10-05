/**
 * SELLER COPY COVERAGE (review S7, 2026-10-05): every refusal code the owner action, the import, the discard and the
 * employment controls can answer has a sentence; a suffixed code reads through its prefix; the exclusion's own
 * sentence stands in as the why. No machine token reaches Casey on a stale panel.
 */
import { describe, expect, it } from 'vitest';
import { refusalSentence } from '@/lib/gap/ui/refusal-copy';

const OWNER_ACTION = ['not_found', 'no_candidate', 'candidate_not_eligible', 'candidate_not_eligible:left_company', 'candidate_not_eligible:employment_conflict', 'hypothesis_closed', 'not_approved:draft', 'not_approved:review_required', 'already_active', 'stale_status', 'same_person', 'persona_not_at_account', 'hypothesis_in_use', 'persona_do_not_contact', 'recipient_unsubscribed', 'persona_left_account', 'persona_employment_conflict', 'routing_failed', 'no_people'];
const IMPORT = ['account_not_found', 'account_not_linked', 'contact_not_found', 'contact_not_associated', 'blocked_domain', 'contact_opted_out', 'persona_at_other_account', 'hubspot_unreadable'];
const DISCARD = ['decision_not_found', 'draft_not_found', 'draft_mismatch', 'recipient_mismatch', 'sender_mailbox_mismatch', 'gap_sender_unconfigured', 'gmail_unreadable', 'reconcile_failed', 'invalid_reason'];
const EMPLOYMENT = ['invalid_url', 'missing_company', 'human_correction_stands', 'persona_not_found'];

describe('every refusal code has seller copy', () => {
  it.each([...OWNER_ACTION, ...IMPORT, ...DISCARD, ...EMPLOYMENT])('%s', (code) => {
    const s = refusalSentence(code);
    expect(s).toBeTruthy();
    expect(s).not.toMatch(/_/);
    expect(s).not.toMatch(/\u2014/);
    expect(s).toMatch(/Next: /);
  });
  it('the exclusion sentence stands in as the why for candidate_not_eligible, and a bare token never shows', () => {
    const detail = 'Historical H-E-B contact. Current-employer evidence now points to ADUSA Distribution. Not eligible for H-E-B outreach.';
    expect(refusalSentence('candidate_not_eligible:left_company', detail)).toBe(`Nothing was attached or routed. ${detail} Next: Reload the owners, choose another person, or correct the record if you know otherwise.`);
    expect(refusalSentence('candidate_not_eligible:left_company')).toMatch(/not eligible as the owner any more/);
    expect(refusalSentence('totally_unknown_code')).toBeNull();
  });
  it('a detail never replaces the why for an ordinary code', () => {
    expect(refusalSentence('already_active', 'ignored')).toMatch(/already in use/);
    expect(refusalSentence('already_active', 'ignored')).not.toMatch(/ignored/);
  });
});
