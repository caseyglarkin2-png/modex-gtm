/**
 * `evidenceRefsFromSignals` (R3-3): the compiler-owned projection of a
 * hypothesis's linked signals onto compile evidence refs. It is a move of the
 * enroll service's function; the parity test below proves both produce the
 * same refs so the service's import can be switched without a behavior change.
 */

import { describe, expect, it } from 'vitest';

import { evidenceRefsFromSignals as fromService } from '@/lib/gap/enroll/service';
import { EVIDENCE_MAX_AGE_DAYS, evidenceRefsFromSignals } from '@/lib/gap/compiler/evidence-from-signals';

const NOW = new Date('2026-09-23T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

function signal(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sig_1',
    title: 'Ohio DC job postings, August',
    evidence_url: 'https://example.test/jobs',
    external_ok: true,
    observed_at: new Date(NOW.getTime() - 3 * DAY),
    freshness_expires_at: new Date(NOW.getTime() + 30 * DAY),
    source_type: 'public_primary',
    metadata: null,
    ...overrides,
  };
}

describe('evidenceRefsFromSignals', () => {
  it('projects a fresh public signal onto a usable ref', () => {
    expect(evidenceRefsFromSignals([signal()], NOW)).toEqual([
      {
        id: 'sig_1',
        title: 'Ohio DC job postings, August',
        url: 'https://example.test/jobs',
        externalOk: true,
        fresh: true,
        superseded: false,
        firstParty: false,
      },
    ]);
  });

  it('fresh comes from freshness_expires_at when set, else from observed_at within the 45-day window', () => {
    expect(evidenceRefsFromSignals([signal({ freshness_expires_at: new Date(NOW.getTime() - DAY) })], NOW)[0].fresh).toBe(false);
    expect(EVIDENCE_MAX_AGE_DAYS).toBe(45);
    const within = signal({ freshness_expires_at: null, observed_at: new Date(NOW.getTime() - 44 * DAY) });
    const beyond = signal({ freshness_expires_at: null, observed_at: new Date(NOW.getTime() - 46 * DAY) });
    expect(evidenceRefsFromSignals([within], NOW)[0].fresh).toBe(true);
    expect(evidenceRefsFromSignals([beyond], NOW)[0].fresh).toBe(false);
  });

  it('fails closed on unstated flags: external_ok null reads false, metadata.superseded true reads superseded', () => {
    const ref = evidenceRefsFromSignals([signal({ external_ok: null, metadata: { superseded: true } })], NOW)[0];
    expect(ref.externalOk).toBe(false);
    expect(ref.superseded).toBe(true);
  });

  it('first-party is first_party*, crm and manual source types', () => {
    for (const [sourceType, expected] of [
      ['first_party', true],
      ['first_party_intent', true],
      ['crm', true],
      ['manual', true],
      ['public_primary', false],
      ['public_secondary', false],
    ] as const) {
      expect(evidenceRefsFromSignals([signal({ source_type: sourceType })], NOW)[0].firstParty, sourceType).toBe(expected);
    }
  });

  it('skips rows with no string id and accepts ISO strings for the dates', () => {
    const refs = evidenceRefsFromSignals(
      [
        null as unknown as ReturnType<typeof signal>,
        signal({ id: 7 }),
        signal({ id: 'sig_2', observed_at: '2026-09-20T00:00:00.000Z', freshness_expires_at: '2026-10-20T00:00:00.000Z' }),
      ],
      NOW,
    );
    expect(refs.map((r) => [r.id, r.fresh])).toEqual([['sig_2', true]]);
  });

  it('is byte-identical to the enroll service\'s export (the import can be switched with no behavior change)', () => {
    const rows = [
      signal(),
      signal({ id: 'sig_2', external_ok: null, freshness_expires_at: null, observed_at: new Date(NOW.getTime() - 50 * DAY) }),
      signal({ id: 'sig_3', source_type: 'crm', metadata: { superseded: true }, evidence_url: null, title: null }),
    ];
    expect(JSON.stringify(evidenceRefsFromSignals(rows, NOW))).toBe(JSON.stringify(fromService(rows, NOW)));
  });
});
