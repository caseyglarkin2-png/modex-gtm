/**
 * N11: compile-top100's stdout and `_summary.json` worst list must not print
 * real lane persona names. A person is shown as the HubSpot contact id when
 * the lane has one, else as initials.
 */

import { describe, expect, it } from 'vitest';

import { initialsOf, redactPerson, redactWorst } from '@/lib/gap/compiler/redact-person';

describe('redactPerson (N11)', () => {
  it('shows the HubSpot contact id when the person key is one', () => {
    expect(redactPerson('Jordan Vale', '100000000001')).toBe('100000000001');
  });

  it('falls back to initials when the key is a name slug or missing', () => {
    expect(redactPerson('Jordan Vale', 'jordan-vale')).toBe('J.V.');
    expect(redactPerson("Riley O'Kafor Jr.", null)).toBe('R.O.J.');
    expect(initialsOf('   ')).toBe('?');
  });

  it('redactWorst maps every entry through the step list by account and person', () => {
    const steps = [
      { account: 'acme', personKey: '100000000001', person: 'Jordan Vale' },
      { account: 'acme', personKey: 'riley-okafor', person: 'Riley Okafor' },
    ];
    const worst = [
      { account: 'acme', person: 'Jordan Vale', step: 2, verdict: 'reject' as const, failed: 1, code: 'C01', detail: 'd' },
      { account: 'acme', person: 'Riley Okafor', step: 1, verdict: 'reject' as const, failed: 1, code: 'C09', detail: 'd' },
      { account: 'other', person: 'Sam Unknown', step: 1, verdict: 'pass' as const, failed: 0, code: 'C01', detail: 'd' },
    ];
    expect(redactWorst(worst, steps).map((w) => w.person)).toEqual(['100000000001', 'R.O.', 'S.U.']);
    expect(JSON.stringify(redactWorst(worst, steps))).not.toContain('Jordan');
  });
});
