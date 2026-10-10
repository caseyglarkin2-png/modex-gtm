// @vitest-environment node
/**
 * The people fix of October 10, 2026: a persistent "not a prospect" control. The briefing's "Prospects to reengage"
 * listed Casey's own insurance adjuster, firecrown.com and riserify.com. Pinned:
 *   - a `never` on an address drops it from rankPeople on every later day, past SKIP_DAYS, and a later decision on
 *     the key (an old email's Skip, Explore or More) never undoes it;
 *   - a `never` on a domain drops every address at that domain and its subdomains, and nothing else;
 *   - decide.ts takes `never` on a person or a domain only, refuses it on a signal or a trigger, refuses a domain key
 *     any other decision, a freemail or our own domain, and a domain that places at a GAP account;
 *   - the briefing's person item carries the "Not a prospect: never list this sender again" link, and the domain link
 *     only when the sender is at no account; a signal carries neither.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { applyDecision, decisionLine, parseDecisionKey } from '@/lib/gap/work/decide';
import { PERSON_DECISIONS, PROSPECT_DECISION, SKIP_DAYS, loadDecided, loadIntelligence, neverCovers, rankPeople, type IntelItem } from '@/lib/gap/work/intel';
import { renderBriefing } from '@/lib/gap/work/briefing';
import type { DayPlan } from '@/lib/gap/work/plan';

const NOW = new Date('2026-10-10T12:00:00Z');
const ACTOR = 'casey@freightroll.com';
const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const later = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

const inbound = (id: string, from: string, subject: string) => ({ id, thread_id: `t-${id}`, from_email: from, from_name: null, subject, snippet: 'Thanks, following up on this.', received_at: days(20), source: 'gmail', thread: { account_name: null } });

function world(extra: { companies?: Array<Record<string, unknown>>; links?: Array<Record<string, unknown>>; aliases?: Array<Record<string, unknown>> } = {}) {
  return ledgerDb({
    accounts: ['Kenco'],
    personas: [],
    inbound: [
      inbound('m1', 'claims@goldstaradjusters.com', 'Re: Gold Star Adjusters - Larkin - #HO260036'),
      inbound('m2', 'jo@firecrown.com', 'Re: yard visibility pilot'),
      inbound('m3', 'amy@mail.firecrown.com', 'Re: our yards next quarter'),
      inbound('m4', 'pat@riserify.com', 'Re: a question about the yards'),
      inbound('m5', 'kim@acmefoods.com', 'Re: the yards at Dayton'),
    ],
    ...extra,
  }, NOW);
}

const people = async (c: unknown, now: Date) => (await loadIntelligence(c, { now, peopleLimit: 50 })).people.map((p) => p.id).sort();

describe('never on an address', () => {
  it('drops the address from rankPeople on every later day (inside the 180-day people window), past the skip horizon, whatever comes after it on the key', { timeout: 120_000 }, async () => {
    const db = world();
    const c = db.client();
    // Not vacuous: every sender is listed before any decision.
    expect(await people(c, NOW)).toEqual(['amy@mail.firecrown.com', 'claims@goldstaradjusters.com', 'jo@firecrown.com', 'kim@acmefoods.com', 'pat@riserify.com']);
    const r = await applyDecision(c, { key: 'person:Claims@GoldStarAdjusters.com', decision: 'never', actor: ACTOR, now: NOW, via: 'gmail:link' });
    expect(r).toMatchObject({ ok: true, key: 'person:claims@goldstaradjusters.com', decision: 'never', effects: ['not_a_prospect'] });
    if (!r.ok) return;
    expect(decisionLine(r)).toBe('Not a prospect: claims@goldstaradjusters.com is never listed to reengage again. Nothing was sent to anyone.');
    expect(db.store.gapAuditEvent.filter((e) => e.kind === PROSPECT_DECISION).map((e) => [e.subject_id, (e.payload as { decision: string }).decision])).toEqual([['person:claims@goldstaradjusters.com', 'never']]);
    for (const n of [0, 1, SKIP_DAYS + 1, 150]) { const p = await people(c, later(n)); expect(p).toContain('kim@acmefoods.com'); expect(p).not.toContain('claims@goldstaradjusters.com'); }
    // An old email's Skip after the never would expire after SKIP_DAYS; Explore and More un-decide a key. None undoes a never.
    for (const d of ['skip', 'explore', 'more'] as const) {
      await applyDecision(c, { key: 'person:claims@goldstaradjusters.com', decision: d, actor: ACTOR, now: NOW });
      expect(await people(c, later(SKIP_DAYS + 5))).not.toContain('claims@goldstaradjusters.com');
    }
    // A skip alone (the control) does expire: the rule is the never's, not a change to skip.
    await applyDecision(c, { key: 'person:pat@riserify.com', decision: 'skip', actor: ACTOR, now: NOW });
    expect(await people(c, later(1))).not.toContain('pat@riserify.com');
    expect(await people(c, later(SKIP_DAYS + 5))).toContain('pat@riserify.com');
  });

  it('rankPeople reads the never marker and the domain keys (pure)', () => {
    const rows = [
      { from_email: 'a@x-co.com', from_name: null, subject: 'Re: yards', received_at: days(20), thread_account: null },
      { from_email: 'b@deep.sub.x-co.com', from_name: null, subject: 'Re: yards', received_at: days(20), thread_account: null },
      { from_email: 'c@y-co.com', from_name: null, subject: 'Re: yards', received_at: days(20), thread_account: null },
      { from_email: 'd@notx-co.com', from_name: null, subject: 'Re: yards', received_at: days(20), thread_account: null },
    ];
    const base = { now: NOW, dealAccounts: null, unsubscribed: new Set<string>() };
    expect(rankPeople(rows, [], { ...base, decided: new Set() }).map((i) => i.id).sort()).toEqual(['a@x-co.com', 'b@deep.sub.x-co.com', 'c@y-co.com', 'd@notx-co.com']);
    expect(rankPeople(rows, [], { ...base, decided: new Set(['domain:x-co.com']) }).map((i) => i.id).sort()).toEqual(['c@y-co.com', 'd@notx-co.com']);
    expect(rankPeople(rows, [], { ...base, decided: new Set(['never:person:c@y-co.com']) }).map((i) => i.id).sort()).toEqual(['a@x-co.com', 'b@deep.sub.x-co.com', 'd@notx-co.com']);
    expect(neverCovers(new Set(['domain:x-co.com']), 'B@Deep.Sub.X-Co.com')).toBe(true);
    expect(neverCovers(new Set(['domain:x-co.com']), 'd@notx-co.com')).toBe(false);
    // A top-level label alone is never a domain key that matches ("com").
    expect(neverCovers(new Set(['domain:com']), 'a@x-co.com')).toBe(false);
    // The person items offer the never; the decision list of a signal does not.
    expect(rankPeople(rows, [], { ...base, decided: new Set() })[0].decisions).toEqual(PERSON_DECISIONS);
    expect(PERSON_DECISIONS).toContain('never');
  });
});

describe('never on a domain', () => {
  it('drops every address at the domain and its subdomains on every later day (inside the people window), and nothing else', { timeout: 60_000 }, async () => {
    const db = world();
    const c = db.client();
    const r = await applyDecision(c, { key: 'domain:firecrown.com', decision: 'never', actor: ACTOR, now: NOW, via: 'gmail:link' });
    expect(r).toMatchObject({ ok: true, key: 'domain:firecrown.com', decision: 'never', effects: ['not_a_prospect_domain'] });
    if (!r.ok) return;
    expect(decisionLine(r)).toBe('Not a prospect: no one at firecrown.com is listed to reengage again. Nothing was sent to anyone.');
    for (const n of [0, SKIP_DAYS + 1, 150]) expect(await people(c, later(n))).toEqual(['claims@goldstaradjusters.com', 'kim@acmefoods.com', 'pat@riserify.com']);
    expect((await loadDecided(c, later(400))).has('domain:firecrown.com')).toBe(true);
  });

  it('is refused for a signal or a trigger, for any other decision, for freemail or our own domain, and for a domain that places at an account', async () => {
    const db = world({ companies: [{ id: 'domain:kencogroup.com', company_key: 'domain:kencogroup.com', domain: 'kencogroup.com', status: 'resolved' }], links: [{ account_name: 'Kenco', canonical_company_id: 'domain:kencogroup.com', status: 'resolved' }], aliases: [] });
    const c = db.client();
    expect(await applyDecision(c, { key: 'signal:s1', decision: 'never', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'never_is_for_senders' });
    expect(await applyDecision(c, { key: 'trigger:7', decision: 'never', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'never_is_for_senders' });
    expect(await applyDecision(c, { key: 'domain:riserify.com', decision: 'skip', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'domain_takes_never_only' });
    expect(await applyDecision(c, { key: 'domain:gmail.com', decision: 'never', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'domain_not_allowed' });
    expect(await applyDecision(c, { key: 'domain:yardflow.ai', decision: 'never', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'domain_not_allowed' });
    expect(await applyDecision(c, { key: 'domain:kencogroup.com', decision: 'never', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'domain_is_an_account' });
    expect(db.store.gapAuditEvent.filter((e) => e.kind === PROSPECT_DECISION)).toEqual([]);
    expect(parseDecisionKey('domain:www.Riserify.com')).toEqual({ kind: 'domain', domain: 'riserify.com' });
    expect(parseDecisionKey('domain:not a domain')).toBeNull();
    expect(parseDecisionKey('domain:com')).toBeNull();
  });
});

describe('the briefing link', () => {
  const plan: DayPlan = { day: '2026-10-10', plannedAt: '2026-10-10T11:00:00.000Z', fresh: true, counts: { needsYou: 0, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 }, items: [] };
  const links = { start: 'https://x/start', work: 'https://x/work', item: () => 'https://x/item', decide: (key: string, d: string) => `https://x/decide/${encodeURIComponent(key)}/${d}` };
  const mk = (over: Partial<IntelItem> & { kind: IntelItem['kind']; id: string; title: string }): IntelItem => ({ key: `${over.kind}:${over.id}`, source: 's', url: null, publishedAt: null, observedAt: '2026-10-01T00:00:00.000Z', truth: 'historical_observation', line: 'Wrote to us Sep 20, 2026 (1 message).', accountName: null, accountHint: null, relevance: null, categories: [], person: null, decisions: PERSON_DECISIONS, rank: 0, ...over });

  it('a person carries the never link in its words; the domain link only for a sender at no account; a signal carries neither', () => {
    const intel = {
      signals: [mk({ kind: 'signal', id: 's1', title: 'A story', accountName: 'Kenco' })],
      triggers: [],
      people: [
        mk({ kind: 'person', id: 'jo@firecrown.com', title: 'jo@firecrown.com (firecrown.com)', accountHint: 'firecrown.com' }),
        mk({ kind: 'person', id: 'dave@kencogroup.com', title: 'Dave Kiesling at Kenco', accountName: 'Kenco' }),
      ],
      totals: { signals: 1, triggers: 0, people: 2 },
      angles: {},
    };
    const out = renderBriefing({ plan, dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false, intel }, NOW);
    const t = out.text;
    expect(t).toContain('Not a prospect: never list this sender again: https://x/decide/person%3Ajo%40firecrown.com/never  Not a prospect: never list anyone at firecrown.com: https://x/decide/domain%3Afirecrown.com/never');
    expect(t).toContain('Not a prospect: never list this sender again: https://x/decide/person%3Adave%40kencogroup.com/never');
    expect(t).not.toContain('domain%3Akencogroup.com');
    expect(t).not.toContain('signal%3As1/never');
    expect(out.html).toContain('<a href="https://x/decide/person%3Ajo%40firecrown.com/never">Not a prospect: never list this sender again</a>');
    expect(out.html).toContain('<a href="https://x/decide/domain%3Afirecrown.com/never">Not a prospect: never list anyone at firecrown.com</a>');
  });
});
