/**
 * Named debt closed (2026-09-29): the intake planner knows account motion. An account already in a live
 * conversation, or with a first touch out in the last 30 days, is ALREADY COVERED: follow the thread,
 * never stack a second cold touch because the account also appeared on a list. Deal gates still win.
 */
import { describe, expect, it } from 'vitest';
import { qualifyAccount } from '@/lib/gap/intake/plan';

const NOW = new Date('2026-09-29T12:00:00Z');
const base = { accountName: 'Acme Foods', watched: true, opportunity: 'CLEAR' as const, liveFacts: 2, bestFactReason: 'a physical network transformation', theses: [], lastResearchAt: null };

describe('qualifyAccount knows account motion', () => {
  it('a live conversation is already covered: follow up in the thread', () => {
    expect(qualifyAccount({ ...base, motion: { kind: 'conversation', detail: 'dana@acme.example, positive interest' } }, NOW)).toEqual({ state: 'already_covered', reason: 'in a live conversation (dana@acme.example, positive interest): follow up in the thread' });
  });
  it('a first touch out is already covered: wait for it', () => {
    expect(qualifyAccount({ ...base, motion: { kind: 'touched', detail: 'a first touch to dana@acme.example went out 2026-09-20' } }, NOW)).toMatchObject({ state: 'already_covered', reason: expect.stringMatching(/wait for it, do not stack another$/) });
  });
  it('deal gates still win over motion', () => {
    expect(qualifyAccount({ ...base, opportunity: 'ACTIVE', motion: { kind: 'conversation', detail: 'x' } }, NOW).state).toBe('in_deal');
    expect(qualifyAccount({ ...base, opportunity: 'UNKNOWN', motion: { kind: 'touched', detail: 'x' } }, NOW).state).toBe('opportunity_unknown');
  });
  it('no motion keeps the evidence path', () => {
    expect(qualifyAccount({ ...base, motion: null }, NOW).state).toBe('evidence_ready');
  });
});
