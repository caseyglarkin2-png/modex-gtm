/**
 * R60: what Casey reads carries no internal code or id. The walk found NEXT reading "HubSpot could not be read just
 * now (identity_unresolved)", a reply row reading "hypothesis cmg...", and deal labels falling back to the HubSpot id.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { unknownReasonWords, unknownUnlock } from '@/lib/gap/opportunity/unknown-words';
import { projectPursuitState, type PursuitInput } from '@/lib/gap/pursuit/state';
import { hypothesisLabel } from '@/components/gap/reply-list';

const NOW = new Date('2026-10-07T15:00:00Z');
const input = (over: Partial<PursuitInput> = {}): PursuitInput => ({
  accountName: 'Nfi Co',
  now: NOW,
  motionType: 'FACT_LED',
  opportunity: { status: 'CLEAR', detail: '', deals: [] },
  restriction: null,
  familyHold: null,
  motion: null,
  choice: null,
  activePersona: null,
  replies: [],
  lastOutbound: null,
  outstandingDraft: null,
  followUpDue: null,
  eligible: [{ key: 'gap:1', personaId: 1, name: 'Val Scratch', title: 'VP Transportation' }],
  ...over,
});

describe('R60: why HubSpot could not be checked, in words', () => {
  it('every reason code reads as words; an unknown code is the plain fallback; a sentence stays as it is', () => {
    for (const code of ['hubspot_unconfigured', 'hubspot_error', 'timeout', 'identity_unresolved', 'identity_ambiguous', 'malformed_response']) {
      const w = unknownReasonWords(code);
      expect(w, code).not.toMatch(/_/);
      expect(w, code).not.toBe(code);
    }
    expect(unknownReasonWords('identity_unresolved')).toBe('GAP cannot tell which HubSpot company this account is');
    expect(unknownReasonWords('some_new_reason')).toBe('HubSpot could not be read just now');
    expect(unknownReasonWords(null)).toBe('HubSpot could not be read just now');
    expect(unknownReasonWords('HubSpot could not be read')).toBe('HubSpot could not be read');
    expect(unknownUnlock('identity_unresolved')).toBe('Link the account to its one HubSpot company.');
    expect(unknownUnlock('timeout')).toBe('HubSpot answers again.');
  });
  it('the held state NEXT reads says the reason in words and what unlocks it', () => {
    const s = projectPursuitState(input({ opportunity: { status: 'UNKNOWN', detail: 'identity_unresolved', deals: [] } }));
    expect(s.state).toBe('held');
    // R63-A S13: no HubSpot company linked is said as that, with the step that lifts it.
    expect(s.blocker).toBe('No HubSpot company is linked to this account. Link it in HubSpot; until then no cold touch.');
    expect(s.blocker).not.toMatch(/identity_unresolved/);
    expect(s.unlock).toBe('Link the account to its one HubSpot company.');
  });
  it('a refused send says the reason in words too', () => {
    expect(readFileSync('src/lib/gap/enroll/service.ts', 'utf8')).toMatch(/\(\$\{unknownReasonWords\(o\.reason\)\}\)/);
  });
});

describe('R60: no internal id where a name is missing', () => {
  it('a reply with no named angle shows none (never "hypothesis <id>")', () => {
    expect(hypothesisLabel({ hypothesisId: 'cmgx0000000000000000000001', hypothesisTitle: null })).toBe('');
  });
  it('an unnamed deal and a deal no longer open are said in words', () => {
    expect(readFileSync('src/components/gap/deal-opportunities.tsx', 'utf8')).toMatch(/d\.name \?\? 'An unnamed HubSpot deal'/);
    const list = readFileSync('src/lib/gap/work/list.ts', 'utf8');
    expect(list).toMatch(/'a deal that is no longer open in HubSpot'/);
    expect(list).not.toMatch(/`HubSpot deal \$\{dealId\}`/);
  });
});
