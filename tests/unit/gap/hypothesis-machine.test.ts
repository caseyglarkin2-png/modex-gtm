import { describe, expect, it } from 'vitest';

import {
  HYPOTHESIS_STATUSES,
  HYPOTHESIS_TERMINAL_STATUSES,
} from '@/lib/gap/taxonomy';
import {
  LEGAL_TRANSITIONS,
  expiresAtFor,
  isTerminalStatus,
  transition,
  type HypothesisAction,
  type HypothesisSnapshot,
} from '@/lib/gap/hypothesis/machine';

const NOW = new Date('2026-09-23T12:00:00.000Z');
const FUTURE = new Date('2026-10-23T12:00:00.000Z');
const PAST = new Date('2026-09-01T12:00:00.000Z');

const ALL_ACTIONS: HypothesisAction[] = [
  'submit',
  'reject_review',
  'approve',
  'activate',
  'resolve',
  'close_unresolved',
  'expire',
  'withdraw',
];

function snapshot(overrides: Partial<HypothesisSnapshot> = {}): HypothesisSnapshot {
  return {
    status: 'draft',
    problemFamily: 'hidden_capacity',
    persona: 'site_ops',
    observation: 'They opened a second DC in Ohio [S:sig_a]. Trailer counts doubled [S:sig_b].',
    problemHypothesis: 'My guess is the new DC is running gate checks on paper.',
    falsificationQuestions: ['Do drivers check in at a guard shack?'],
    linkedSignals: [
      { id: 'sig_a', hasEvidence: true, expiresAt: FUTURE },
      { id: 'sig_b', hasEvidence: false, expiresAt: null },
    ],
    reviewedBy: null,
    primaryPersonaId: null,
    personaSuppressed: false,
    version: null,
    expiresAt: null,
    confirmedDispositions: [],
    ...overrides,
  };
}

const ctx = { now: NOW };

describe('terminal statuses', () => {
  for (const status of HYPOTHESIS_TERMINAL_STATUSES) {
    for (const action of ALL_ACTIONS) {
      it(`${status} + ${action} -> terminal`, () => {
        expect(transition(snapshot({ status }), action, { now: NOW, actor: 'casey', reason: 'x', outcome: 'confirmed' })).toEqual({
          ok: false,
          reason: 'terminal',
        });
      });
    }
  }

  it('isTerminalStatus matches the taxonomy list', () => {
    for (const status of HYPOTHESIS_STATUSES) {
      expect(isTerminalStatus(status)).toBe(
        (HYPOTHESIS_TERMINAL_STATUSES as readonly string[]).includes(status),
      );
    }
  });
});

describe('draft + submit', () => {
  it('moves to review_required with no effects', () => {
    expect(transition(snapshot(), 'submit', ctx)).toEqual({
      ok: true,
      to: 'review_required',
      effects: [],
    });
  });

  it('refuses no_signals', () => {
    expect(transition(snapshot({ linkedSignals: [] }), 'submit', ctx)).toEqual({
      ok: false,
      reason: 'no_signals',
    });
  });

  it('refuses empty_observation', () => {
    expect(transition(snapshot({ observation: '  ' }), 'submit', ctx)).toEqual({
      ok: false,
      reason: 'empty_observation',
    });
  });

  it('refuses uncited_sentence', () => {
    expect(
      transition(snapshot({ observation: 'They opened a DC [S:sig_a]. Trailers doubled.' }), 'submit', ctx),
    ).toEqual({ ok: false, reason: 'uncited_sentence' });
  });

  it('refuses unlinked_citation', () => {
    expect(transition(snapshot({ observation: 'They opened a DC [S:ghost].' }), 'submit', ctx)).toEqual({
      ok: false,
      reason: 'unlinked_citation',
    });
  });

  it('refuses no_problem', () => {
    expect(transition(snapshot({ problemHypothesis: '   ' }), 'submit', ctx)).toEqual({
      ok: false,
      reason: 'no_problem',
    });
  });

  it('refuses unhedged_hypothesis', () => {
    expect(
      transition(snapshot({ problemHypothesis: 'The new DC runs gate checks on paper.' }), 'submit', ctx),
    ).toEqual({ ok: false, reason: 'unhedged_hypothesis' });
  });

  it('matches hedge tokens case-insensitively', () => {
    expect(
      transition(snapshot({ problemHypothesis: 'I SUSPECT the new DC runs gate checks on paper.' }), 'submit', ctx),
    ).toEqual({ ok: true, to: 'review_required', effects: [] });
  });

  it('refuses no_falsification when every question is blank', () => {
    expect(transition(snapshot({ falsificationQuestions: ['', '   '] }), 'submit', ctx)).toEqual({
      ok: false,
      reason: 'no_falsification',
    });
  });

  it('refuses no_falsification when the list is empty', () => {
    expect(transition(snapshot({ falsificationQuestions: [] }), 'submit', ctx)).toEqual({
      ok: false,
      reason: 'no_falsification',
    });
  });

  it('refuses unmapped_family for the unmapped sentinel', () => {
    expect(transition(snapshot({ problemFamily: 'unmapped' }), 'submit', ctx)).toEqual({
      ok: false,
      reason: 'unmapped_family',
    });
  });

  it('refuses unmapped_family for an unknown family', () => {
    expect(transition(snapshot({ problemFamily: 'made_up' }), 'submit', ctx)).toEqual({
      ok: false,
      reason: 'unmapped_family',
    });
  });

  it('checks guards in table order: no_signals before the observation validator', () => {
    expect(
      transition(snapshot({ linkedSignals: [], observation: '' }), 'submit', ctx),
    ).toEqual({ ok: false, reason: 'no_signals' });
  });
});

describe('review_required + reject_review', () => {
  it('moves back to draft when a reason is given', () => {
    expect(
      transition(snapshot({ status: 'review_required' }), 'reject_review', { now: NOW, reason: 'weak evidence' }),
    ).toEqual({ ok: true, to: 'draft', effects: [] });
  });

  it('refuses no_reason', () => {
    expect(transition(snapshot({ status: 'review_required' }), 'reject_review', { now: NOW, reason: '  ' })).toEqual({
      ok: false,
      reason: 'no_reason',
    });
  });
});

describe('review_required + approve', () => {
  const reviewCtx = { now: NOW, actor: 'casey' };

  it('moves to approved with set_reviewed', () => {
    expect(transition(snapshot({ status: 'review_required' }), 'approve', reviewCtx)).toEqual({
      ok: true,
      to: 'approved',
      effects: ['set_reviewed'],
    });
  });

  it('refuses no_actor', () => {
    expect(transition(snapshot({ status: 'review_required' }), 'approve', { now: NOW, actor: '' })).toEqual({
      ok: false,
      reason: 'no_actor',
    });
  });

  it('refuses no_evidence when no linked signal carries evidence', () => {
    expect(
      transition(
        snapshot({
          status: 'review_required',
          linkedSignals: [{ id: 'sig_a', hasEvidence: false, expiresAt: FUTURE }],
        }),
        'approve',
        reviewCtx,
      ),
    ).toEqual({ ok: false, reason: 'no_evidence' });
  });

  it('refuses evidence_expired when every evidenced signal is past its expiry', () => {
    expect(
      transition(
        snapshot({
          status: 'review_required',
          linkedSignals: [
            { id: 'sig_a', hasEvidence: true, expiresAt: PAST },
            { id: 'sig_b', hasEvidence: false, expiresAt: FUTURE },
          ],
        }),
        'approve',
        reviewCtx,
      ),
    ).toEqual({ ok: false, reason: 'evidence_expired' });
  });

  it('treats an evidenced signal with null expiresAt as live', () => {
    expect(
      transition(
        snapshot({
          status: 'review_required',
          linkedSignals: [{ id: 'sig_a', hasEvidence: true, expiresAt: null }],
        }),
        'approve',
        reviewCtx,
      ),
    ).toEqual({ ok: true, to: 'approved', effects: ['set_reviewed'] });
  });

  it('treats a signal expiring exactly now as expired', () => {
    expect(
      transition(
        snapshot({
          status: 'review_required',
          linkedSignals: [{ id: 'sig_a', hasEvidence: true, expiresAt: new Date(NOW) }],
        }),
        'approve',
        reviewCtx,
      ),
    ).toEqual({ ok: false, reason: 'evidence_expired' });
  });
});

describe('approved + activate', () => {
  const activatable = () =>
    snapshot({
      status: 'approved',
      reviewedBy: 'casey',
      primaryPersonaId: 42,
      version: { status: 'frozen', firstTouchProductProof: false },
    });

  it('moves to active with the three effects in order', () => {
    expect(transition(activatable(), 'activate', ctx)).toEqual({
      ok: true,
      to: 'active',
      effects: ['set_activated', 'freeze_narrative', 'set_expires_at'],
    });
  });

  it('activates with no version attached', () => {
    expect(transition({ ...activatable(), version: null }, 'activate', ctx)).toEqual({
      ok: true,
      to: 'active',
      effects: ['set_activated', 'freeze_narrative', 'set_expires_at'],
    });
  });

  it('refuses not_reviewed', () => {
    expect(transition({ ...activatable(), reviewedBy: null }, 'activate', ctx)).toEqual({
      ok: false,
      reason: 'not_reviewed',
    });
  });

  it('refuses not_reviewed for a blank reviewer', () => {
    expect(transition({ ...activatable(), reviewedBy: '  ' }, 'activate', ctx)).toEqual({
      ok: false,
      reason: 'not_reviewed',
    });
  });

  it('refuses no_evidence', () => {
    expect(
      transition(
        { ...activatable(), linkedSignals: [{ id: 'sig_a', hasEvidence: false, expiresAt: null }] },
        'activate',
        ctx,
      ),
    ).toEqual({ ok: false, reason: 'no_evidence' });
  });

  it('refuses evidence_expired', () => {
    expect(
      transition(
        { ...activatable(), linkedSignals: [{ id: 'sig_a', hasEvidence: true, expiresAt: PAST }] },
        'activate',
        ctx,
      ),
    ).toEqual({ ok: false, reason: 'evidence_expired' });
  });

  it('refuses no_persona', () => {
    expect(transition({ ...activatable(), primaryPersonaId: null }, 'activate', ctx)).toEqual({
      ok: false,
      reason: 'no_persona',
    });
  });

  it('refuses suppressed', () => {
    expect(transition({ ...activatable(), personaSuppressed: true }, 'activate', ctx)).toEqual({
      ok: false,
      reason: 'suppressed',
    });
  });

  it('refuses version_retired', () => {
    expect(
      transition(
        { ...activatable(), version: { status: 'retired', firstTouchProductProof: false } },
        'activate',
        ctx,
      ),
    ).toEqual({ ok: false, reason: 'version_retired' });
  });

  it('refuses first_touch_proof', () => {
    expect(
      transition(
        { ...activatable(), version: { status: 'draft', firstTouchProductProof: true } },
        'activate',
        ctx,
      ),
    ).toEqual({ ok: false, reason: 'first_touch_proof' });
  });
});

describe('active + resolve', () => {
  const resolvable = () =>
    snapshot({
      status: 'active',
      confirmedDispositions: [{ responseClass: 'problem_partially_confirmed', createdAt: PAST }],
    });

  it('moves to the requested outcome with resolve effects', () => {
    expect(transition(resolvable(), 'resolve', { now: NOW, outcome: 'partially_confirmed' })).toEqual({
      ok: true,
      to: 'partially_confirmed',
      effects: ['set_resolved', 'stop_enrollments:hypothesis_resolved'],
    });
  });

  it('moves to each of the three outcomes', () => {
    for (const outcome of ['confirmed', 'partially_confirmed', 'rejected'] as const) {
      expect(transition(resolvable(), 'resolve', { now: NOW, outcome })).toEqual({
        ok: true,
        to: outcome,
        effects: ['set_resolved', 'stop_enrollments:hypothesis_resolved'],
      });
    }
  });

  it('refuses no_outcome', () => {
    expect(transition(resolvable(), 'resolve', ctx)).toEqual({ ok: false, reason: 'no_outcome' });
  });

  it('refuses no_confirmed_disposition when there are no dispositions', () => {
    expect(
      transition({ ...resolvable(), confirmedDispositions: [] }, 'resolve', { now: NOW, outcome: 'confirmed' }),
    ).toEqual({ ok: false, reason: 'no_confirmed_disposition' });
  });

  it('refuses no_confirmed_disposition when no disposition is a problem_ class', () => {
    expect(
      transition(
        {
          ...resolvable(),
          confirmedDispositions: [{ responseClass: 'meeting_accepted', createdAt: PAST }],
        },
        'resolve',
        { now: NOW, outcome: 'confirmed' },
      ),
    ).toEqual({ ok: false, reason: 'no_confirmed_disposition' });
  });
});

describe('active + close_unresolved', () => {
  it('moves to unresolved with the manual stop effect', () => {
    expect(
      transition(snapshot({ status: 'active' }), 'close_unresolved', { now: NOW, reason: 'champion left' }),
    ).toEqual({ ok: true, to: 'unresolved', effects: ['stop_enrollments:manual'] });
  });

  it('refuses no_reason', () => {
    expect(transition(snapshot({ status: 'active' }), 'close_unresolved', ctx)).toEqual({
      ok: false,
      reason: 'no_reason',
    });
  });
});

describe('expire', () => {
  for (const status of ['approved', 'active'] as const) {
    it(`${status} expires on hypothesis expiresAt <= now`, () => {
      expect(transition(snapshot({ status, expiresAt: PAST }), 'expire', ctx)).toEqual({
        ok: true,
        to: 'expired',
        effects: ['stop_enrollments:hypothesis_expired'],
      });
    });

    it(`${status} expires when every linked signal has expired`, () => {
      expect(
        transition(
          snapshot({
            status,
            expiresAt: null,
            linkedSignals: [
              { id: 'sig_a', hasEvidence: true, expiresAt: PAST },
              { id: 'sig_b', hasEvidence: false, expiresAt: new Date(NOW) },
            ],
          }),
          'expire',
          ctx,
        ),
      ).toEqual({ ok: true, to: 'expired', effects: ['stop_enrollments:hypothesis_expired'] });
    });

    it(`${status} refuses not_yet_expired when the hypothesis is live and one signal is live`, () => {
      expect(
        transition(
          snapshot({
            status,
            expiresAt: FUTURE,
            linkedSignals: [
              { id: 'sig_a', hasEvidence: true, expiresAt: PAST },
              { id: 'sig_b', hasEvidence: false, expiresAt: FUTURE },
            ],
          }),
          'expire',
          ctx,
        ),
      ).toEqual({ ok: false, reason: 'not_yet_expired' });
    });

    it(`${status} refuses not_yet_expired when a signal has no expiry`, () => {
      expect(
        transition(
          snapshot({
            status,
            expiresAt: null,
            linkedSignals: [
              { id: 'sig_a', hasEvidence: true, expiresAt: PAST },
              { id: 'sig_b', hasEvidence: false, expiresAt: null },
            ],
          }),
          'expire',
          ctx,
        ),
      ).toEqual({ ok: false, reason: 'not_yet_expired' });
    });

    it(`${status} refuses not_yet_expired with no expiresAt and no signals`, () => {
      expect(transition(snapshot({ status, expiresAt: null, linkedSignals: [] }), 'expire', ctx)).toEqual({
        ok: false,
        reason: 'not_yet_expired',
      });
    });
  }
});

describe('withdraw', () => {
  for (const status of ['draft', 'review_required', 'approved'] as const) {
    it(`${status} withdraws to rejected with a reason`, () => {
      expect(transition(snapshot({ status }), 'withdraw', { now: NOW, reason: 'duplicate' })).toEqual({
        ok: true,
        to: 'rejected',
        effects: [],
      });
    });

    it(`${status} refuses no_reason`, () => {
      expect(transition(snapshot({ status }), 'withdraw', ctx)).toEqual({ ok: false, reason: 'no_reason' });
    });
  }

  it('active cannot withdraw', () => {
    expect(transition(snapshot({ status: 'active' }), 'withdraw', { now: NOW, reason: 'x' })).toEqual({
      ok: false,
      reason: 'ILLEGAL_TRANSITION:active->withdraw',
    });
  });
});

describe('illegal pairs', () => {
  it('draft + approve is illegal', () => {
    expect(transition(snapshot(), 'approve', { now: NOW, actor: 'casey' })).toEqual({
      ok: false,
      reason: 'ILLEGAL_TRANSITION:draft->approve',
    });
  });

  it('every non-terminal (from, action) pair not in LEGAL_TRANSITIONS is illegal', () => {
    const nonTerminal = HYPOTHESIS_STATUSES.filter((s) => !isTerminalStatus(s));
    for (const from of nonTerminal) {
      for (const action of ALL_ACTIONS) {
        const legal = LEGAL_TRANSITIONS.some((row) => row.from === from && row.action === action);
        if (legal) continue;
        expect(
          transition(snapshot({ status: from }), action, { now: NOW, actor: 'casey', reason: 'x', outcome: 'confirmed' }),
        ).toEqual({ ok: false, reason: `ILLEGAL_TRANSITION:${from}->${action}` });
      }
    }
  });
});

describe('LEGAL_TRANSITIONS', () => {
  it('covers exactly the rows of the table', () => {
    const expected = [
      { from: 'draft', action: 'submit', to: 'review_required' },
      { from: 'review_required', action: 'reject_review', to: 'draft' },
      { from: 'review_required', action: 'approve', to: 'approved' },
      { from: 'approved', action: 'activate', to: 'active' },
      { from: 'active', action: 'resolve', to: 'outcome' },
      { from: 'active', action: 'close_unresolved', to: 'unresolved' },
      { from: 'approved', action: 'expire', to: 'expired' },
      { from: 'active', action: 'expire', to: 'expired' },
      { from: 'draft', action: 'withdraw', to: 'rejected' },
      { from: 'review_required', action: 'withdraw', to: 'rejected' },
      { from: 'approved', action: 'withdraw', to: 'rejected' },
    ];
    const key = (r: { from: string; action: string; to: string }) => `${r.from}|${r.action}|${r.to}`;
    expect([...LEGAL_TRANSITIONS].map(key).sort()).toEqual(expected.map(key).sort());
    expect(LEGAL_TRANSITIONS).toHaveLength(expected.length);
  });

  it('every legal row succeeds from a satisfying snapshot', () => {
    const satisfying: HypothesisSnapshot = snapshot({
      reviewedBy: 'casey',
      primaryPersonaId: 1,
      expiresAt: PAST,
      confirmedDispositions: [{ responseClass: 'problem_confirmed', createdAt: PAST }],
    });
    for (const row of LEGAL_TRANSITIONS) {
      const result = transition(
        { ...satisfying, status: row.from },
        row.action,
        { now: NOW, actor: 'casey', reason: 'because', outcome: 'confirmed' },
      );
      expect(result.ok, `${row.from}->${row.action}`).toBe(true);
      if (result.ok) expect(result.to).toBe(row.to === 'outcome' ? 'confirmed' : row.to);
    }
  });
});

describe('expiresAtFor', () => {
  it('returns the minimum non-null signal expiresAt', () => {
    const signals = [
      { id: 'a', hasEvidence: true, expiresAt: FUTURE },
      { id: 'b', hasEvidence: true, expiresAt: null },
      { id: 'c', hasEvidence: true, expiresAt: PAST },
    ];
    expect(expiresAtFor(signals, NOW)).toEqual(PAST);
  });

  it('defaults to now + 45 days when no signal carries an expiry', () => {
    const signals = [{ id: 'a', hasEvidence: true, expiresAt: null }];
    expect(expiresAtFor(signals, NOW)).toEqual(new Date('2026-11-07T12:00:00.000Z'));
  });

  it('defaults to now + 45 days for an empty list', () => {
    expect(expiresAtFor([], NOW)).toEqual(new Date(NOW.getTime() + 45 * 24 * 60 * 60 * 1000));
  });

  it('does not mutate the caller inputs', () => {
    const d = new Date(FUTURE);
    const signals = [{ id: 'a', hasEvidence: true, expiresAt: d }];
    const out = expiresAtFor(signals, NOW);
    expect(out).toEqual(FUTURE);
    expect(out).not.toBe(d);
  });
});
