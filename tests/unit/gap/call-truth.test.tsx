/**
 * Red team T8: CALL TRUTH.
 *  - a no-answer / voicemail / gatekeeper is never buyer truth: it moves no
 *    Learning rate, numerator or denominator
 *  - problem_confirmed and problem_partially_confirmed require the buyer's
 *    words, typed; the server refuses without them, and the form offers no
 *    one-click path from an AI suggestion to confirmed truth
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { computeConversationFunnel, computeHypothesisFunnel } from '@/lib/gap/learning/metrics';
import { validateDisposition } from '@/lib/gap/disposition/model';
import { DispositionForm } from '@/components/gap/disposition-form';

const conv = (responseClass: string, hypothesisId = 'h1', channel = 'call') =>
  ({ hypothesisId, responseClass, channel, rootCauseConfirmed: false, impactAcknowledged: false, impactQuantified: false }) as never;

describe('T8: no-answer events never feed Learning as buyer truth', () => {
  it('only unanswered calls: every conversation rate has an empty denominator', () => {
    const f = computeConversationFunnel([conv('no_answer'), conv('voicemail'), conv('gatekeeper'), conv('no_answer')]);
    for (const r of Object.values(f)) expect((r as { denominator: number }).denominator).toBe(0);
  });

  it('three no-answers beside one real confirmation: resonance is 1 of 1, not 1 of 4', () => {
    const f = computeConversationFunnel([conv('no_answer'), conv('no_answer'), conv('voicemail'), conv('problem_confirmed')]);
    expect(f.problemResonanceRate).toMatchObject({ numerator: 1, denominator: 1 });
  });

  it('a hypothesis with only unanswered calls has no buyer interaction (not in the resolution denominator)', () => {
    const h = computeHypothesisFunnel([{ id: 'h1', status: 'active' } as never], [conv('no_answer'), conv('voicemail')]);
    expect(h.resolutionRate.denominator).toBe(0);
  });
});

describe('T8: confirmed buyer truth needs the buyer\'s words', () => {
  it.each(['problem_confirmed', 'problem_partially_confirmed'])('%s without buyer language is refused quote_required (server model)', (responseClass) => {
    for (const buyerLanguage of [undefined, null, '', '   ']) {
      expect(validateDisposition({ contactEmail: 'a@b.com', channel: 'call', responseClass, buyerLanguage })).toMatchObject({ ok: false, field: 'buyerLanguage', reason: 'quote_required' });
    }
    expect(validateDisposition({ contactEmail: 'a@b.com', channel: 'call', responseClass, buyerLanguage: 'We lose an hour a shift looking for trailers.' })).toMatchObject({ ok: true });
  });

  it('an AI suggestion of problem_confirmed offers NO one-click confirm (only classes that need nothing typed can be one click)', () => {
    render(
      <DispositionForm
        mode="reply"
        prefill={{ hypothesisId: 'h1', contactEmail: 'a@b.com', channel: 'email', source: { kind: 'inbound_message', id: 'm1' } as never }}
        suggestion={{ id: 'ai-1', responseClass: 'problem_confirmed', bids: [{ type: 'problem', quote: 'yes the yard is a mess', why: 'x' }], why: 'x' }}
        client={{ postDisposition: vi.fn() } as never}
        autoFocus={false}
      />,
    );
    expect(screen.queryByTestId('confirm-suggestion')).toBeNull();
  });
});
