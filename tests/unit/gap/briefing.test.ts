/**
 * X05a (GAP OS sales execution engine, 2026-10-08): the signed action link and the briefing render, both pure.
 * Pinned: a link token is signed with GAP_ACTION_SECRET and carries its expiry; a forged signature, a tampered
 * payload, an expired token or a missing secret is refused with its reason (never a fallback to trust); the briefing
 * subject names the day, the count that needs the seller and the day token in brackets; the items are listed in the
 * plan's order with account, person, what and why, each with its link; no line of the body starts with a command
 * word (a reply quoting the body must never read as a command: the review's quoted-text finding); the commands
 * footer appears only when email commands are enabled; the briefing says in words when nothing needs the seller.
 */
import { describe, expect, it } from 'vitest';
import { signActionToken, verifyActionToken } from '@/lib/gap/work/action-token';
import { COMMAND_WORDS, renderBriefing } from '@/lib/gap/work/briefing';
import type { DayPlan, PlanItem } from '@/lib/gap/work/plan';

const NOW = new Date('2026-10-08T11:05:00Z');
const SECRET = 'test-action-secret';

const item = (over: Partial<PlanItem> & { key: string; rank: number; accountName: string }): PlanItem => ({
  kind: 'ready',
  stateKind: 'ready',
  title: 'Ready for a first touch',
  why: 'A prepared first touch',
  href: '/gap/pack/dec-1',
  person: null,
  refs: {},
  token: 'a'.repeat(32),
  ...over,
});

const PLAN: DayPlan = {
  day: '2026-10-08',
  plannedAt: '2026-10-08T11:00:00.000Z',
  fresh: true,
  counts: { needsYou: 3, parked: 12, obligationsDue: 1, waiting: 4, snoozed: 1 },
  items: [
    item({ key: 'reply:msg-77', rank: 0, accountName: 'Boston Beer', kind: 'reply', stateKind: 'replied', title: 'Someone replied', why: 'Phil Savastano wrote Oct 8', href: '/gap/accounts/boston-beer#record-reply', person: { name: 'Phil Savastano', title: 'VP Operations' }, token: 'b'.repeat(32) }),
    item({ key: 'commitment:c-1', rank: 1, accountName: 'Kroger', kind: 'commitment', stateKind: 'in_deal', title: 'Send the dock comparison', why: 'Due today', href: '/gap/accounts/kroger', person: { name: 'Joey Maggard', title: null }, token: 'c'.repeat(32) }),
    item({ key: 'first_touch:dec-1', rank: 2, accountName: 'PepsiCo', person: { name: 'Karen Ortiz', title: 'Director, Transportation' }, token: 'd'.repeat(32) }),
  ],
};

describe('X05a: the signed action token', () => {
  it('signs and verifies a payload with its expiry; the op, the item and the day survive the round trip', () => {
    const t = signActionToken({ op: 'open', item: 'd'.repeat(32), day: '2026-10-08' }, { secret: SECRET, now: NOW, ttlSeconds: 7 * 86_400 });
    expect(t).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    const v = verifyActionToken(t, { secret: SECRET, now: new Date('2026-10-12T11:05:00Z') });
    expect(v).toEqual({ ok: true, payload: { op: 'open', item: 'd'.repeat(32), day: '2026-10-08', exp: Math.floor(NOW.getTime() / 1000) + 7 * 86_400 } });
  });

  it('refuses a forged signature, a tampered payload, an expired token, a malformed token and a missing secret, each by name', () => {
    const t = signActionToken({ op: 'start', day: '2026-10-08' }, { secret: SECRET, now: NOW, ttlSeconds: 3600 });
    const [payload, sig] = t.split('.');
    expect(verifyActionToken(`${payload}.${sig.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A'))}`, { secret: SECRET, now: NOW })).toEqual({ ok: false, reason: 'bad_signature' });
    const tampered = Buffer.from(JSON.stringify({ op: 'open', day: '2026-10-08', exp: 9_999_999_999 })).toString('base64url');
    expect(verifyActionToken(`${tampered}.${sig}`, { secret: SECRET, now: NOW })).toEqual({ ok: false, reason: 'bad_signature' });
    expect(verifyActionToken(t, { secret: SECRET, now: new Date('2026-10-08T12:06:00Z') })).toEqual({ ok: false, reason: 'expired' });
    expect(verifyActionToken('nonsense', { secret: SECRET, now: NOW })).toEqual({ ok: false, reason: 'malformed' });
    expect(verifyActionToken(t, { secret: 'other', now: NOW })).toEqual({ ok: false, reason: 'bad_signature' });
    expect(verifyActionToken(t, { secret: '', now: NOW })).toEqual({ ok: false, reason: 'no_secret' });
    expect(() => signActionToken({ op: 'start', day: '2026-10-08' }, { secret: '', now: NOW, ttlSeconds: 10 })).toThrow('no_secret');
  });
});

describe('X05a: renderBriefing (pure)', () => {
  const links = { start: 'https://app.example/gap/start?t=S', work: 'https://app.example/gap/', item: (it: PlanItem) => `https://app.example/gap/item?t=${it.token.slice(0, 4)}` };
  const out = renderBriefing({ plan: PLAN, dayToken: 'day0token', links, commandsEnabled: false, legacyDigest: false }, NOW);

  it('the subject names the day, the count and the day token', () => {
    expect(out.subject).toBe('GAP today, Thu Oct 8: 3 need you [GAP#day0token]');
  });

  it('lists the items in order with account, person, what, why and the link; the start link leads', () => {
    const lines = out.text.split('\n');
    expect(lines[0]).toMatch(/^Good morning\./);
    expect(out.text.indexOf('https://app.example/gap/start?t=S')).toBeLessThan(out.text.indexOf('1. Boston Beer'));
    expect(out.text).toContain('1. Boston Beer: Someone replied. Phil Savastano (VP Operations). Phil Savastano wrote Oct 8.');
    expect(out.text).toContain('https://app.example/gap/item?t=bbbb');
    expect(out.text).toContain('2. Kroger: Send the dock comparison. Joey Maggard. Due today.');
    expect(out.text).toContain('3. PepsiCo: Ready for a first touch. Karen Ortiz (Director, Transportation). A prepared first touch.');
    expect(out.text.indexOf('1. Boston Beer')).toBeLessThan(out.text.indexOf('2. Kroger'));
    expect(out.text).toContain('Waiting on them: 4. Parked (research, holds, set aside): 12. Snoozed: 1.');
    expect(out.html).toContain('<a href="https://app.example/gap/start?t=S"');
    expect(out.html).toContain('PepsiCo');
  });

  it('no line of the body starts with a command word, and the commands footer appears only when enabled', () => {
    const words = new RegExp(`^(${COMMAND_WORDS.join('|')})\\b`, 'i');
    for (const line of out.text.split('\n')) expect(line).not.toMatch(words);
    expect(out.text).not.toMatch(/Reply with START/i);
    const withCommands = renderBriefing({ plan: PLAN, dayToken: 'day0token', links, commandsEnabled: true, legacyDigest: false }, NOW);
    expect(withCommands.text).toMatch(/To work from your inbox, reply with START/);
    for (const line of withCommands.text.split('\n')) expect(line).not.toMatch(words);
  });

  it('says in words when nothing needs the seller, and names the legacy pipeline digest when it still runs', () => {
    const empty = renderBriefing({ plan: { ...PLAN, items: [], counts: { ...PLAN.counts, needsYou: 0 } }, dayToken: 'x', links, commandsEnabled: false, legacyDigest: true }, NOW);
    expect(empty.subject).toBe('GAP today, Thu Oct 8: nothing needs you [GAP#x]');
    expect(empty.text).toContain('Nothing on the list needs you today.');
    expect(empty.text).toContain('The HubSpot pipeline digest still arrives separately');
  });
});

describe('X18: the briefing says what carried over', () => {
  it('a carried item says the day it came from and the body counts the carried work; nothing carried, no such line', () => {
    const plan: DayPlan = { ...PLAN, items: [PLAN.items[0], { ...PLAN.items[1], carriedFrom: '2026-10-07' }, { ...PLAN.items[2], carriedFrom: '2026-10-06' }] };
    const out = renderBriefing({ plan, dayToken: 'tok', links: { start: 'https://x/start', work: 'https://x/work', item: (it) => `https://x/item/${it.token}` }, commandsEnabled: false, legacyDigest: false }, NOW);
    expect(out.text).toContain('2. Kroger: Send the dock comparison. Joey Maggard. Due today. Carried from Wed Oct 7.');
    expect(out.text).toContain('Carried over: 2 of 3 (one from Wed Oct 7, one from Tue Oct 6).');
    expect(out.html).toContain('Carried from Wed Oct 7.');
    const none = renderBriefing({ plan: PLAN, dayToken: 'tok', links: { start: 'https://x/start', work: 'https://x/work', item: (it) => `https://x/item/${it.token}` }, commandsEnabled: false, legacyDigest: false }, NOW);
    expect(none.text).not.toMatch(/Carried/);
  });
});
