// @vitest-environment node
/**
 * Batch item 7 (audit at 31f09c71 and the R62 matrix): the gate holes. A reposted posting and a notice past its due
 * date are not openings; a vendor announcing news about the account is the vendor's claim; Ask never routes a request
 * for outreach copy to the model, however it is phrased; routing never offers the card the corporate-family hold
 * refuses at the click.
 */
import { describe, expect, it } from 'vitest';
import { outreachFactRefusal, VERIFIED_EXCERPT } from '@/lib/gap/research/evidence-gate';
import { currentnessLine, factCurrentness } from '@/lib/gap/research/currentness';
import { liveFactFailure, speakerOrg } from '@/lib/gap/research/claim-rules';
import { actionRequest } from '@/lib/gap/ask/grounding';

const NOW = new Date('2026-10-07T15:00:00Z');
const sig = (text: string, over: Record<string, unknown> = {}) => ({ id: 's1', account_name: 'Tyson', source_kind: 'evidence_record', source_type: 'public_primary', evidence_text: text, evidence_url: 'https://careers.tyson.example.com/yard', observed_at: new Date('2026-10-01T00:00:00Z'), external_ok: true, metadata: { verified: VERIFIED_EXCERPT }, title: 'Yard Operations Manager', claim_class: 'JOB_POSTING', ...over });

describe('a reposted posting and a closed notice are not openings (item 7)', () => {
  it('a posting the source marks reposted is refused for the job-led approach, recorded or read from its words', () => {
    const recorded = sig('Tyson is hiring a Yard Operations Manager at its Amarillo distribution center.', { metadata: { verified: VERIFIED_EXCERPT, claimAttributes: { postingStatus: 'reposted' } } });
    expect(outreachFactRefusal(recorded, 'Tyson', { approach: 'job_procurement_led' })).toBe('posting_reposted');
    expect(outreachFactRefusal(sig('Tyson reposted a Yard Operations Manager position at its Amarillo distribution center.'), 'Tyson', { approach: 'job_procurement_led' })).toBe('posting_reposted');
    expect(outreachFactRefusal(sig('Tyson is hiring a Yard Operations Manager at its Amarillo distribution center.', { metadata: { verified: VERIFIED_EXCERPT, claimAttributes: { postingStatus: 'open' } } }), 'Tyson', { approach: 'job_procurement_led' })).toBeNull();
  });
  it('a notice whose stated due date passed is not current (the one freshness clock), with the words; an open one is current at most until its due date', () => {
    const closed = factCurrentness({ observed_at: new Date('2026-09-25T00:00:00Z'), type: 'news', metadata: { claimAttributes: { dueDate: '2026-10-01' } } }, NOW);
    expect(closed).toMatchObject({ current: false, basis: 'closed' });
    expect(currentnessLine(closed)).toBe('This notice closed on Oct 1, 2026: not a story for a first touch.');
    const open = factCurrentness({ observed_at: new Date('2026-10-01T00:00:00Z'), type: 'news', metadata: { claimAttributes: { dueDate: '2026-10-20' } } }, NOW);
    expect(open).toMatchObject({ current: true, until: '2026-10-21T03:59:59.000Z' });
  });
});

describe('a vendor announcing news about the account is a third party (item 7)', () => {
  it('"<Vendor> announced that <account> ..." is the vendor speaking; the account announcing about itself is its own statement', () => {
    const vendor = 'Kaleris announced that Acme is opening a new distribution center in Reno with 60 dock doors.';
    expect(speakerOrg(vendor)).toBe('Kaleris');
    expect(liveFactFailure(vendor, 'Acme', 'https://news.example.com/acme')).toBe('quoted_third_party');
    const own = 'Acme announced that it is opening a new distribution center in Reno with 60 dock doors.';
    expect(liveFactFailure(own, 'Acme', 'https://news.example.com/acme')).toBeNull();
  });
});

describe('Ask never sends a request for outreach copy to the model (item 7)', () => {
  it('"what should I say to Tom in the first email" is a request for copy, however it is phrased; a question about the record is a read', () => {
    for (const q of ['what should I say to Tom in the first email', 'How should we open the first touch to Ann?', 'What subject line should I use?', 'what do I write in the follow-up email to Kay']) {
      expect([q, actionRequest(q)]).toEqual([q, expect.stringMatching(/^Ask GAP cannot write outreach copy/)]);
    }
    expect(actionRequest('What did we send them?')).toBeNull();
    expect(actionRequest('Who owns transportation here?')).toBeNull();
    expect(actionRequest('How should we open the account review with their team?')).toBeNull();
  });
});
