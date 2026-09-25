import { describe, expect, it } from 'vitest';
import { buildCallPack, stripObservationCitations } from '@/lib/gap/sequence/call-pack';

describe('stripObservationCitations', () => {
  it('removes [S:id] tokens, leaving plain spoken text', () => {
    expect(stripObservationCitations('Acme opened a second DC in Reno [S:sig_1].')).toBe('Acme opened a second DC in Reno.');
  });

  it('is a no-op on text with no citations', () => {
    expect(stripObservationCitations('Plain text.')).toBe('Plain text.');
  });
});

describe('buildCallPack', () => {
  const base = {
    firstName: 'Joey',
    senderFirstName: 'Casey',
    accountName: 'Kroger',
    observationPlain: 'Kroger consolidated two DCs into one yard.',
    problemHypothesis: 'Physical handoffs may be constraining production capacity.',
    diagnosticQuestion: 'Does the consolidated yard run its own gate schedule?',
  };

  it('opens with the name, the sender, an explicit permission ask, and the cited observation -- never a pitch first', () => {
    const pack = buildCallPack(base);
    expect(pack.opener).toContain('Joey');
    expect(pack.opener).toContain('Casey with YardFlow');
    expect(pack.opener).toContain(base.observationPlain);
    expect(pack.opener.toLowerCase()).not.toContain('yardflow platform');
  });

  it('uses the hypothesis falsification question as diagnostic 1 when one exists', () => {
    const pack = buildCallPack(base);
    expect(pack.diagnostic1).toBe(base.diagnosticQuestion);
  });

  it('falls back to a generic diagnostic question when no falsification question exists, never fabricating a fact', () => {
    const pack = buildCallPack({ ...base, diagnosticQuestion: null });
    expect(pack.diagnostic1).toContain('Kroger');
    expect(pack.diagnostic1).not.toBe(null);
  });

  it('the voicemail stays short (a 20-30 second read) and never invents a new fact beyond the observation', () => {
    const pack = buildCallPack(base);
    expect(pack.voicemail.split(/\s+/).length).toBeLessThan(60);
    expect(pack.voicemail).toContain(base.observationPlain);
  });
});
