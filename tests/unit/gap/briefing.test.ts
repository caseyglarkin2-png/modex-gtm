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
    // C31: the count names its basis (the plan's items, what START and NEXT walk).
    expect(out.subject).toBe('GAP today, Thu Oct 8: 3 to execute [GAP#day0token]');
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

describe('I04: the briefing leads with intelligence, then the items in sections, the stalled deals in one line', () => {
  const links = { start: 'https://x/start', work: 'https://x/work', item: (it: PlanItem) => `https://x/item/${it.token}`, decide: (key: string, d: string) => `https://x/decide/${encodeURIComponent(key)}/${d}` };
  const intelItem = (over: Partial<import('@/lib/gap/work/intel').IntelItem> & { kind: 'signal' | 'trigger' | 'person'; id: string; title: string }): import('@/lib/gap/work/intel').IntelItem => ({ key: `${over.kind}:${over.id}`, source: 's', url: null, publishedAt: null, observedAt: '2026-10-01T00:00:00.000Z', truth: 'historical_observation', line: 'news.example, published Jun 24, 2026. Historical observation.', accountName: null, accountHint: null, relevance: null, categories: [], person: null, decisions: ['pursue', 'explore', 'save', 'skip', 'dismiss', 'more'], rank: 0, ...over });
  const intel = {
    signals: [intelItem({ kind: 'signal', id: 's-old', title: 'Kenco opens new innovation lab', accountName: 'Kenco' })],
    triggers: [intelItem({ kind: 'trigger', id: '7', title: 'Tractor Supply opens Idaho DC with automation', accountHint: 'Tractor Supply Company', truth: 'unverified_status', line: 'chainstoreage.com, published Oct 7, 2026. Unverified present-day status. Tractor Supply Company is not a GAP account yet.' })],
    people: [intelItem({ kind: 'person', id: 'dave@kencogroup.com', title: 'Dave Kiesling, VP Operations at Kenco', accountName: 'Kenco', line: 'Wrote to us Sep 16, 2026 (2 messages); no open deal.' })],
    totals: { signals: 14, triggers: 3, people: 9 },
    angles: { 'signal:s-old': { whyItMatters: 'My guess is the lab means the warehouses are standardized while the yards still run on radio.', starters: ['How does the gate know where a trailer goes?', 'Who owns dwell?'], peopleNamed: [{ name: 'Dave Kiesling', title: 'VP Operations' }], proposedAction: 'email' } },
  };
  const dealPlan: DayPlan = {
    ...PLAN,
    items: [
      ...PLAN.items,
      item({ key: 'deal:Boston Beer:2026-10-08', rank: 3, accountName: 'Boston Beer', kind: 'deal', stateKind: 'in_deal', title: 'In a deal', why: 'A stalled deal: the close date (Sep 30) has passed and the deal is still open.', href: '/gap/accounts/boston-beer?view=brief', token: 'e'.repeat(32) }),
      item({ key: 'deal:Kroger:2026-10-08', rank: 4, accountName: 'Kroger', kind: 'deal', stateKind: 'in_deal', title: 'Next step on the deal: Send the pilot scope to Ann', why: "The deal's next step: Send the pilot scope to Ann", href: '/gap/accounts/kroger?view=brief', token: 'f'.repeat(32) }),
      item({ key: 'follow_up:Swire:2026-10-08', rank: 5, accountName: 'Swire', kind: 'follow_up', stateKind: 'follow_up', title: 'Follow up with Bryan Sink when they are back', why: 'Back today.', href: '/gap/accounts/swire', token: '1'.repeat(32) }),
    ],
  };

  it('intelligence comes before the items, each with its decision links and the prepared angle; the sections name what is owed, ready and followed up; stalled deals are one line; the count in the subject is unchanged', () => {
    const out = renderBriefing({ plan: dealPlan, dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false, intel }, NOW);
    // C31: the execution count and the intelligence shown, counted apart (3 shown of 26 waiting).
    expect(out.subject).toBe('GAP today, Thu Oct 8: 6 to execute, 3 to decide [GAP#tok]');
    const t = out.text;
    expect(t.indexOf('Intelligence worth a look (2 of 17)')).toBeLessThan(t.indexOf('Begin with item 1'));
    expect(t).toContain('- Kenco: Kenco opens new innovation lab. news.example, published Jun 24, 2026. Historical observation. The angle: My guess is the lab means the warehouses are standardized while the yards still run on radio. Who: Dave Kiesling (VP Operations). Ask: How does the gate know where a trailer goes?');
    expect(t).toContain('Pursue: https://x/decide/signal%3As-old/pursue  Skip: https://x/decide/signal%3As-old/skip  Dismiss: https://x/decide/signal%3As-old/dismiss  More: https://x/decide/signal%3As-old/more');
    expect(t).toContain('- Tractor Supply Company: Tractor Supply opens Idaho DC with automation. chainstoreage.com, published Oct 7, 2026. Unverified present-day status. Tractor Supply Company is not a GAP account yet.');
    expect(t).toContain('Prospects to reengage (1 of 9). They wrote to us and went quiet.');
    expect(out.html).toContain('<li>- Kenco: Kenco opens new innovation lab.');
    expect(t).toContain('- Kenco: Dave Kiesling, VP Operations at Kenco. Wrote to us Sep 16, 2026 (2 messages); no open deal.');
    expect(t).toContain('Ready to send (1)\n3. PepsiCo: Ready for a first touch.');
    expect(t).toContain('Owed and in conversation (2)\n1. Boston Beer: Someone replied.');
    expect(t).toContain('Follow-ups (1)\n6. Swire: Follow up with Bryan Sink when they are back.');
    expect(t).toContain('Deals with a next step (1)\n5. Kroger: Next step on the deal: Send the pilot scope to Ann.');
    expect(t).toContain('Deals, in one line (1): Boston Beer (the close date (Sep 30) has passed and the deal is still open). The deal workspace holds the detail.');
    expect(t).toContain('Begin with item 1, Boston Beer: Someone replied. https://x/start');
    expect(t).not.toMatch(/^4\. Boston Beer: In a deal/m);
    expect(out.html).toContain('<h3>Intelligence worth a look (2 of 17)</h3>');
    expect(out.html).toContain('<a href="https://x/decide/signal%3As-old/pursue">Pursue</a>');
    for (const line of t.split('\n')) expect(line).not.toMatch(/^(START|APPROVE|REVISE|SKIP|DEFER|DONE|NEXT|HELP)\b/);
  });

  it('without a decide signer the item points at Work; without intelligence the older shape renders; no intelligence waiting is said', () => {
    const noSign = renderBriefing({ plan: PLAN, dayToken: 'tok', links: { ...links, decide: () => null }, commandsEnabled: false, legacyDigest: false, intel }, NOW);
    expect(noSign.text).toContain('Decide it on Work: https://x/work');
    const older = renderBriefing({ plan: PLAN, dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false }, NOW);
    expect(older.text).not.toMatch(/Intelligence/);
    expect(older.text).toContain('1. Boston Beer: Someone replied.');
    const none = renderBriefing({ plan: PLAN, dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false, intel: { signals: [], triggers: [], people: [], totals: { signals: 0, triggers: 0, people: 0 }, angles: {} } }, NOW);
    expect(none.text).toContain('No intelligence is waiting for a decision today.');
  });
});

describe('I05: the pursued section and the reserved slots', () => {
  const links = { start: 'https://x/start', work: 'https://x/work', item: (it: PlanItem) => `https://x/item/${it.token}`, decide: () => null, account: (name: string) => `https://x/accounts/${name.toLowerCase()}/` };
  const mk = (kind: 'signal' | 'trigger', id: string, title: string): import('@/lib/gap/work/intel').IntelItem => ({ kind, id, key: `${kind}:${id}`, title, source: 's', url: null, publishedAt: null, observedAt: '2026-10-01T00:00:00.000Z', truth: 'historical_observation', line: 'line.', accountName: null, accountHint: kind === 'trigger' ? 'Some Co' : null, relevance: null, categories: [], person: null, decisions: ['pursue', 'explore', 'save', 'skip', 'dismiss', 'more'], rank: 0 });
  it('what Casey pursued leads, with the angle when ready and the state when not; the top triggers reach the email beside the top signals', () => {
    const intel = {
      signals: Array.from({ length: 12 }, (_, k) => mk('signal', `s${k}`, `Signal ${k}`)),
      triggers: Array.from({ length: 5 }, (_, k) => mk('trigger', `t${k}`, `Trigger ${k}`)),
      people: [],
      pursued: [
        { key: 'signal:p1', taskId: 'at_test', writer: null, kind: 'signal' as const, title: 'Kenco opens new innovation lab', accountName: 'Kenco', accountHint: null, url: null, decision: 'pursue', decidedAt: '2026-10-08T15:00:00.000Z', status: 'ready' as const, error: null, angle: { whyItMatters: 'My guess is the lab standardizes the warehouses while the yards run on radio.', starters: ['How does the gate know where a trailer goes?', 'Who owns dwell?'], roles: ['VP Operations'], accounts: ['Kenco'], peopleNamed: [{ personaId: 1, name: 'Dave Kiesling', title: 'VP Operations' }], proposedAction: 'email', caveat: null, sourceLine: 'freightwaves.com, published Jun 24, 2026 (a historical observation)' } },
        { key: 'trigger:7', taskId: 'at_test', writer: null, kind: 'trigger' as const, title: 'Tractor Supply opens Idaho DC', accountName: null, accountHint: 'Tractor Supply Company', url: null, decision: 'pursue', decidedAt: '2026-10-08T15:30:00.000Z', status: 'in_progress' as const, error: null, angle: null },
      ],
      totals: { signals: 40, triggers: 5, people: 0 },
      angles: {},
    };
    const out = renderBriefing({ plan: PLAN, dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false, intel }, NOW);
    const t = out.text;
    // Intelligence wiring (2026-10-09): newly collected intelligence leads; what Casey pursued follows it.
    expect(t.indexOf('Pursued (2): what GAP prepared on your decisions.')).toBeGreaterThan(t.indexOf('Intelligence worth a look'));
    expect(t).toContain('- Kenco: Kenco opens new innovation lab. The angle: My guess is the lab standardizes the warehouses while the yards run on radio. Who: Dave Kiesling (VP Operations). Ask: How does the gate know where a trailer goes? Proposed: an email.');
    expect(t).toContain('   Open Kenco: https://x/accounts/kenco/');
    expect(t).toContain('- Tractor Supply Company: Tractor Supply opens Idaho DC. GAP is developing the angle; it comes back here and on Work.');
    expect(t).toContain('Intelligence worth a look (6 of 45).');
    expect(t).toContain('- Some Co: Trigger 0.');
    expect(t).toContain('- Some Co: Trigger 1.');
    expect(t).not.toContain('Trigger 2.');
    expect(t).toContain('Signal 3.');
    expect(t).not.toContain('Signal 4.');
    for (const line of t.split('\n')) expect(line).not.toMatch(/^(START|APPROVE|REVISE|SKIP|DEFER|DONE|NEXT|HELP)\b/);
  });
});
