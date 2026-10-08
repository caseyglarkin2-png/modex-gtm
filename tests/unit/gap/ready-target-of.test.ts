/** UX-03: the ready target is derived from an already-loaded account motion (one queue read for NOW and the stack). */
import { describe, expect, it } from 'vitest';
import { readyTargetOf } from '@/lib/gap/context/send-target';

describe('readyTargetOf', () => {
  it('a ready motion with a card yields the pack page of that card (R60: never the cockpit lane)', () => {
    expect(readyTargetOf({ state: 'ready', primary: { name: 'Doug Estrada', title: 'Sr Director', cardId: 'c1' }, headline: 'Suggested primary: Doug.' })).toEqual({ name: 'Doug Estrada', title: 'Sr Director', href: '/gap/pack/c1', headline: 'Suggested primary: Doug.' });
  });
  it('any other state, no primary, or no card yields null', () => {
    expect(readyTargetOf({ state: 'paused_reply', primary: { name: 'D', title: null, cardId: 'c1' }, headline: '' })).toBeNull();
    expect(readyTargetOf({ state: 'ready', primary: null, headline: '' })).toBeNull();
    expect(readyTargetOf({ state: 'ready', primary: { name: 'D', title: null, cardId: null }, headline: '' })).toBeNull();
    expect(readyTargetOf(null)).toBeNull();
  });
});
