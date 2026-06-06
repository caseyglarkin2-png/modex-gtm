import { describe, it, expect } from 'vitest';
import { resolveSenderIdentity } from '@/lib/email/sender-identity';
import { wrapHtml } from '@/lib/email/templates';

const CASEY_BOOKING_LINK =
  'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';

describe('resolveSenderIdentity', () => {
  it('returns the Casey identity for Casey emails (case-insensitive), unknown, undefined, and null', () => {
    const inputs: (string | undefined | null)[] = [
      'casey@freightroll.com',
      'CASEY@freightroll.com',
      'caseyglarkin2@gmail.com',
      undefined,
      null,
      'someone-unknown@example.com',
    ];
    for (const input of inputs) {
      const id = resolveSenderIdentity(input);
      expect(id.name).toBe('Casey Larkin');
      expect(id.role).toBe('GTM Lead');
      expect(id.bookingLink).toBe(CASEY_BOOKING_LINK);
    }
  });

  it('returns the Jake identity (no bookingLink) for jake@freightroll.com', () => {
    const id = resolveSenderIdentity('jake@freightroll.com');
    expect(id.name).toBe('Jake');
    expect(id.role).toBe('FreightRoll');
    expect(id.bookingLink).toBeUndefined();
  });
});

describe('wrapHtml sender identity', () => {
  it('defaults to the byte-identical Casey signature when no identity is passed', () => {
    const html = wrapHtml('hi', 'Acme');
    expect(html).toContain('Casey Larkin');
    expect(html).toContain('GTM Lead');
    expect(html).toContain(CASEY_BOOKING_LINK);
  });

  it('renders Jake signature and falls back to default booking link when jake has none', () => {
    const html = wrapHtml(
      'hi',
      'Acme',
      undefined,
      undefined,
      undefined,
      undefined,
      resolveSenderIdentity('jake@freightroll.com'),
    );
    expect(html).toContain('Jake');
    expect(html).not.toContain('Casey Larkin');
    // Jake has no bookingLink, so the audit link falls back to the default.
    expect(html).toContain(CASEY_BOOKING_LINK);
  });

  it('introduces no em or en dashes via the sender identity path', () => {
    const html = wrapHtml(
      'hi',
      'Acme',
      undefined,
      undefined,
      undefined,
      undefined,
      resolveSenderIdentity('jake@freightroll.com'),
    );
    // Jake's name/role must not add em (—) or en (–) dashes.
    const jakeSegment = html.slice(html.indexOf('Jake') - 50, html.indexOf('Jake') + 200);
    expect(jakeSegment).not.toContain('—');
    expect(jakeSegment).not.toContain('–');
  });
});
