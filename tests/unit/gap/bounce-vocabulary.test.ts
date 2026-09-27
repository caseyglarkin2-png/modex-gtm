/**
 * Red team T9: ONE bounce vocabulary. The HubSpot webhook (and now the GAP
 * mailbox DSN intake) write email_status 'hard_bounce'; routing and enrollment
 * only recognised 'bounced' / 'hard_bounced', so a hard bounce was caught only
 * because do_not_contact happened to be set alongside it.
 */
import { describe, expect, it } from 'vitest';
import { emailUsable } from '@/lib/gap/routing/rules';
import { suppressionLegFor } from '@/lib/gap/sequence/enrollment';
import { HARD_BOUNCE_STATUSES, isHardBounceStatus } from '@/lib/email/bounce';
import { HARD_INVALID_STATUSES } from '@/lib/gap/suppression/provenance';

describe('every hard-bounce spelling is recognised by every reader', () => {
  it.each(['bounced', 'hard_bounce', 'hard_bounced'])('%s: routing treats the email as unusable', (status) => {
    expect(emailUsable({ persona: { emailValid: true, emailStatus: status } } as never)).toBe(false);
  });

  it.each(['bounced', 'hard_bounce', 'hard_bounced'])('%s: enrollment suppression fires the bounced leg even without do_not_contact', (status) => {
    expect(suppressionLegFor({ unsubscribed: false, doNotContact: false, emailStatus: status })).toBe('bounced');
  });

  it('the canonical set and the next-touch set agree on every hard-bounce spelling', () => {
    for (const s of ['hard_bounce', 'hard_bounced']) {
      expect(HARD_BOUNCE_STATUSES.has(s)).toBe(true);
      expect(HARD_INVALID_STATUSES.has(s)).toBe(true);
    }
  });
});

describe('ops closeout 14: one predicate, case-insensitive, on every plane', () => {
  it.each(['Bounced', 'HARD_BOUNCE', ' hard_bounced '])('%s: routing and enrollment read it as a bounce too', (status) => {
    expect(isHardBounceStatus(status)).toBe(true);
    expect(emailUsable({ persona: { emailValid: true, emailStatus: status } } as never)).toBe(false);
    expect(suppressionLegFor({ unsubscribed: false, doNotContact: false, emailStatus: status })).toBe('bounced');
  });

  it.each([null, undefined, '', 'unverified', 'verified', 'replied', 'blocked'])('%s is not a bounce', (status) => {
    expect(isHardBounceStatus(status as string | null | undefined)).toBe(false);
  });
});
