import { describe, expect, it } from 'vitest';
import { classifySuppression, type SuppressionEvidence } from '@/lib/gap/suppression/provenance';

function ev(over: Partial<SuppressionEvidence> & { dnc?: boolean; status?: string | null } = {}): SuppressionEvidence {
  return {
    verdict: over.verdict ?? 'clear',
    legs: over.legs ?? {},
    persona: { doNotContact: over.dnc ?? false, emailStatus: over.status ?? 'unverified' },
  };
}

describe('classifySuppression', () => {
  it('clear when no leg fired and the column is false', () => {
    const c = classifySuppression(ev({ legs: { clawd: 'clear', hubspot: 'clear' } }));
    expect(c.class).toBe('clear');
    expect(c.emailBlockedAtSend).toBe(false);
  });

  it('service_unreadable when the authority could not be read, never a DNC', () => {
    const c = classifySuppression(ev({ verdict: 'unknown', legs: { clawd_contract: 'unknown' } }));
    expect(c.class).toBe('service_unreadable');
    expect(c.hits).toEqual([]);
    expect(c.emailBlockedAtSend).toBe(true);
  });

  it.each(['hubspot_optout', 'verbal_do_not_call', 'sendgrid_suppression', 'unsubscribed', 'hs_email_optout'])(
    'hard_compliance for the recipient-decision leg %s',
    (leg) => {
      const c = classifySuppression(ev({ verdict: 'suppressed', legs: { [leg]: 'hit' } }));
      expect(c.class).toBe('hard_compliance');
    },
  );

  it('an unrecognized leg fails closed to hard_compliance', () => {
    expect(classifySuppression(ev({ verdict: 'suppressed', legs: { brand_new_leg: 'hit' } })).class).toBe('hard_compliance');
  });

  it('the local column with a historical `bounced` status is soft_deliverability (the General Mills case)', () => {
    const c = classifySuppression(ev({ verdict: 'suppressed', legs: { modex_do_not_contact: 'hit', clawd: 'clear' }, dnc: true, status: 'bounced' }));
    expect(c.class).toBe('soft_deliverability');
    expect(c.hits).toEqual(['modex_do_not_contact']);
    expect(c.emailBlockedAtSend).toBe(true);
  });

  it('the local column with a hard-bounce or invalid status is hard_invalid_address', () => {
    expect(classifySuppression(ev({ dnc: true, status: 'hard_bounce' })).class).toBe('hard_invalid_address');
    expect(classifySuppression(ev({ dnc: true, status: 'invalid' })).class).toBe('hard_invalid_address');
  });

  it('the local column with no status evidence is unknown_provenance, not a permanent DNC', () => {
    expect(classifySuppression(ev({ dnc: true, status: 'unverified' })).class).toBe('unknown_provenance');
    expect(classifySuppression(ev({ dnc: true, status: 'blocked' })).class).toBe('unknown_provenance');
  });

  it('clawd do_not_send carries no reason on the wire: unknown_provenance', () => {
    expect(classifySuppression(ev({ verdict: 'suppressed', legs: { clawd_do_not_send: 'hit' } })).class).toBe('unknown_provenance');
  });

  it('precedence: a soft local bounce never masks an opt-out on another plane', () => {
    const c = classifySuppression(
      ev({ verdict: 'suppressed', legs: { modex_do_not_contact: 'hit', hubspot_optout: 'hit' }, dnc: true, status: 'bounced' }),
    );
    expect(c.class).toBe('hard_compliance');
    expect(c.reasons).toEqual([
      { leg: 'modex_do_not_contact', class: 'soft_deliverability' },
      { leg: 'hubspot_optout', class: 'hard_compliance' },
    ]);
  });

  it('precedence: unknown beats soft, invalid beats unknown', () => {
    expect(
      classifySuppression(ev({ verdict: 'suppressed', legs: { modex_do_not_contact: 'hit', clawd_do_not_send: 'hit' }, dnc: true, status: 'bounced' })).class,
    ).toBe('unknown_provenance');
    expect(
      classifySuppression(ev({ verdict: 'suppressed', legs: { clawd_do_not_send: 'hit' }, dnc: true, status: 'hard_bounce' })).class,
    ).toBe('hard_invalid_address');
  });
});
