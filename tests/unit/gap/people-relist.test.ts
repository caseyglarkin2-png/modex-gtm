// @vitest-environment node
/**
 * The undo of `never` (2026-10-10). Casey, verbatim: "Add undo for 'never.' First identify exactly what 'never'
 * changes. Provide a clear reversal through the existing disposition workflow, with an audit trail. Reverse only that
 * disposition; do not remove a buyer opt-out, unrelated suppression or completed activity. Demonstrate the original
 * action and its reversal."
 *
 * What `never` changes: ONE `prospect.decision` row in gap_audit_events on `person:<address>` or `domain:<domain>`,
 * read by loadDecided (work/intel.ts) into the decided set (`person:<a>`, `never:person:<a>`, `domain:<d>`), which
 * rankPeople honors (the Prospects to reengage list on Work and in the briefing). Nothing else is written.
 *
 * Pinned here:
 *   - the demonstration: a fixture address listed, never'd (absent), relisted (present), with exactly two ledger rows
 *     (never, then relist carrying the never it ends) and nothing deleted;
 *   - the reversal reverses only the never: on an address that also has a suppression row, do_not_contact on its
 *     persona, a confirmed opt-out disposition and completed activity (a send, a reply), the never plus its relist
 *     write exactly two gap_audit_events rows and nothing else, every other row is byte-identical, and the address
 *     stays off the list (the opt-out still holds);
 *   - the newest never-or-relist row on a key decides (a later never starts a new one; a relist never expires);
 *   - refusals: relist on a signal or a trigger, relist where no never stands (no row written);
 *   - a domain never and its relist; a person relisted under a standing domain never stays off and is told why.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { applyDecision, decisionLine, domainNeverCovering, neverStanding } from '@/lib/gap/work/decide';
import { PROSPECT_DECISION, RECORDED_DECISIONS, PERSON_DECISIONS, SKIP_DAYS, decidedFrom, loadDecided, loadIntelligence, neverMarksFrom } from '@/lib/gap/work/intel';
import { DIRECT_SENT } from '@/lib/gap/execution/draft-ledger';

const NOW = new Date('2026-10-10T12:00:00Z');
const ACTOR = 'casey@freightroll.com';
const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const later = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

const inbound = (id: string, from: string, subject: string) => ({ id, thread_id: `t-${id}`, from_email: from, from_name: null, subject, snippet: 'Thanks, following up on this.', received_at: days(20), source: 'gmail', thread: { account_name: null } });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function world(extra: { personas?: Row[]; unsubscribed?: Row[]; dispositions?: Row[]; audit?: Row[]; inbound?: Row[]; meetings?: Row[] } = {}) {
  return ledgerDb({
    accounts: ['Kenco'],
    personas: extra.personas ?? [],
    unsubscribed: extra.unsubscribed ?? [],
    dispositions: extra.dispositions ?? [],
    audit: extra.audit ?? [],
    meetings: extra.meetings ?? [],
    inbound: [
      inbound('m1', 'pat@riserify.com', 'Re: a question about the yards'),
      inbound('m2', 'jo@firecrown.com', 'Re: yard visibility pilot'),
      inbound('m3', 'amy@mail.firecrown.com', 'Re: our yards next quarter'),
      inbound('m4', 'kim@acmefoods.com', 'Re: the yards at Dayton'),
      ...(extra.inbound ?? []),
    ],
  }, NOW);
}

/** A client whose every write is recorded by model and method (the proof that nothing else is written). */
function recording(c: Row) {
  const writes: string[] = [];
  const WRITE = new Set(['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany']);
  const client = Object.fromEntries(Object.entries(c).map(([model, t]) => [model, new Proxy(t as Row, {
    get(target, prop) {
      const v = target[prop as string];
      if (typeof prop === 'string' && WRITE.has(prop) && typeof v === 'function') return (...a: unknown[]) => { writes.push(`${model}.${prop}`); return v(...a); };
      return v;
    },
  })]));
  return { client, writes };
}

const people = async (c: unknown, now: Date) => (await loadIntelligence(c, { now, peopleLimit: 50 })).people.map((p) => p.id).sort();
const ledger = (db: ReturnType<typeof world>) => db.store.gapAuditEvent.filter((e) => e.kind === PROSPECT_DECISION).map((e) => [e.subject_id, (e.payload as { decision: string }).decision]);

describe('the demonstration: never, then its reversal', () => {
  it('a fixture address is listed, never\'d (absent), relisted (present); the ledger holds the never and the relist, nothing deleted', { timeout: 120_000 }, async () => {
    const db = world();
    const { client: c, writes } = recording(db.client());
    // 1. Listed.
    expect(await people(c, NOW)).toContain('pat@riserify.com');
    // 2. The original action: never (as the briefing's link applies it).
    const never = await applyDecision(c, { key: 'person:Pat@Riserify.com', decision: 'never', actor: ACTOR, now: NOW, via: 'gmail:link' });
    expect(never).toMatchObject({ ok: true, key: 'person:pat@riserify.com', decision: 'never', effects: ['not_a_prospect'] });
    expect(await people(c, NOW)).not.toContain('pat@riserify.com');
    const standing = await neverStanding(c, 'person:pat@riserify.com');
    expect(standing).toMatchObject({ key: 'person:pat@riserify.com', kind: 'person', id: 'pat@riserify.com', actor: ACTOR, via: 'gmail:link' });
    // 3. The reversal: relist, its own row on the same key.
    const relist = await applyDecision(c, { key: 'person:pat@riserify.com', decision: 'relist', actor: ACTOR, now: later(1), via: 'gmail:link' });
    expect(relist).toMatchObject({ ok: true, key: 'person:pat@riserify.com', decision: 'relist', effects: ['relisted'], angleTaskId: null, stillCoveredBy: null });
    if (!relist.ok) return;
    expect(decisionLine(relist)).toBe('Listed again: pat@riserify.com is no longer marked not a prospect (marked Oct 10, 2026), so the prospects to reengage can list them again. Only that mark was reversed: an opt-out, a suppression or do not contact still stands, and nothing else changed. Nothing was sent to anyone.');
    // 4. Present again, and it stays present past the skip horizon (a relist never expires).
    expect(await people(c, later(1))).toContain('pat@riserify.com');
    expect(await people(c, later(SKIP_DAYS + 5))).toContain('pat@riserify.com');
    expect(await neverStanding(c, 'person:pat@riserify.com')).toBeNull();
    // The audit trail: two rows, the never kept, the relist naming the never it ended.
    expect(ledger(db)).toEqual([['person:pat@riserify.com', 'never'], ['person:pat@riserify.com', 'relist']]);
    const [neverRow, relistRow] = db.store.gapAuditEvent.filter((e) => e.kind === PROSPECT_DECISION);
    expect(relistRow).toMatchObject({ actor: ACTOR, subject_type: 'prospect', subject_id: 'person:pat@riserify.com' });
    expect(relistRow.payload).toMatchObject({ decision: 'relist', via: 'gmail:link', at: later(1).toISOString(), effects: ['relisted'], endsNever: { eventId: neverRow.id, at: new Date(neverRow.created_at).toISOString(), actor: ACTOR, via: 'gmail:link' } });
    expect(new Date(relistRow.created_at).getTime()).toBeGreaterThan(new Date(neverRow.created_at).getTime());
    // The only writes in the whole sequence are the two ledger rows.
    expect(writes).toEqual(['gapAuditEvent.create', 'gapAuditEvent.create']);
  });
});

describe('the reversal reverses only the never', () => {
  const ADDR = 'lee@harborfoods.com';
  const seed = () => world({
    personas: [{ id: 41, email: ADDR, name: 'Lee Park', title: 'Director of Logistics', account_name: null, do_not_contact: true, hubspot_contact_id: '901' }],
    unsubscribed: [{ id: 'u1', email: ADDR, unsubscribed_at: days(5), reason: 'unsubscribe link', email_log_id: null }],
    dispositions: [{ id: 'd1', hypothesis_id: 'h1', account_name: 'Harbor Foods', persona_id: 41, contact_email: ADDR, source_kind: 'reply', source_id: 'm9', channel: 'email', response_class: 'do_not_contact', human_confirmed: true, confirmed_by: ACTOR, confirmed_at: days(5), created_by: ACTOR, created_at: days(5) }],
    audit: [
      { id: 'ev-sent', kind: DIRECT_SENT, actor: ACTOR, subject_type: 'persona', subject_id: '41', payload: { to: ADDR, subject: 'The yards at Harbor' }, created_at: days(25) },
      { id: 'ev-disp', kind: 'disposition.recorded', actor: ACTOR, subject_type: 'disposition', subject_id: 'd1', payload: { responseClass: 'do_not_contact' }, created_at: days(5) },
    ],
    meetings: [{ id: 'mt1', persona_email: ADDR, held_at: days(30), outcome: 'held' }],
    inbound: [inbound('m9', ADDR, 'Re: the yards at Harbor')],
  });

  it('a suppression row, do_not_contact, a confirmed opt-out disposition and completed activity are untouched; only two ledger rows are written; the address stays off the list', { timeout: 120_000 }, async () => {
    const db = seed();
    const { client: c, writes } = recording(db.client());
    const snapshot = () => JSON.stringify(Object.fromEntries(Object.entries(db.store).map(([k, rows]) => [k, k === 'gapAuditEvent' ? (rows as Row[]).filter((e) => e.kind !== PROSPECT_DECISION) : rows])));
    const before = snapshot();
    // Off the list before any decision: the opt-out holds on its own.
    expect(await people(c, NOW)).not.toContain(ADDR);
    expect(await people(c, NOW)).toContain('pat@riserify.com');
    const n = await applyDecision(c, { key: `person:${ADDR}`, decision: 'never', actor: ACTOR, now: NOW });
    expect(n).toMatchObject({ ok: true, effects: ['not_a_prospect'] });
    expect((await loadDecided(c, NOW)).has(`never:person:${ADDR}`)).toBe(true);
    const r = await applyDecision(c, { key: `person:${ADDR}`, decision: 'relist', actor: ACTOR, now: NOW });
    expect(r).toMatchObject({ ok: true, decision: 'relist', effects: ['relisted'] });
    // The never ended; nothing else moved.
    const decided = await loadDecided(c, NOW);
    expect(decided.has(`never:person:${ADDR}`)).toBe(false);
    expect(decided.has(`person:${ADDR}`)).toBe(false);
    expect(writes).toEqual(['gapAuditEvent.create', 'gapAuditEvent.create']);
    expect(snapshot()).toBe(before);
    expect(db.store.unsubscribedEmail).toEqual([expect.objectContaining({ id: 'u1', email: ADDR })]);
    expect(db.store.persona[0]).toMatchObject({ id: 41, do_not_contact: true });
    expect(db.store.conversationDisposition[0]).toMatchObject({ id: 'd1', response_class: 'do_not_contact', human_confirmed: true });
    expect(db.store.gapAuditEvent.filter((e) => e.kind !== PROSPECT_DECISION).map((e) => e.id)).toEqual(['ev-sent', 'ev-disp']);
    // Still off the list after the relist: the opt-out is not the never's to reverse.
    expect(await people(c, later(1))).not.toContain(ADDR);
    expect(await people(c, later(1))).toContain('pat@riserify.com');
  });
});

describe('the newest never-or-relist row on a key decides', () => {
  const row = (subject_id: string, decision: string, at: string, extra: Row = {}): Row => ({ id: `ev-${subject_id}-${decision}-${at}`, subject_id, actor: ACTOR, payload: { decision, ...extra }, created_at: new Date(at) });

  it('never, relist, never stands; never, relist ends it; a skip after a relist decides for SKIP_DAYS; other keys and decisions are untouched (pure)', () => {
    const desc = (rows: Row[]) => [...rows].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    const a = 'person:a@x-co.com';
    const ended = desc([row(a, 'never', '2026-10-01T00:00:00Z'), row(a, 'relist', '2026-10-02T00:00:00Z')]);
    expect(neverMarksFrom(ended as never)).toEqual([]);
    expect(decidedFrom(ended as never, NOW)).toEqual(new Set());
    const again = desc([...ended, row(a, 'never', '2026-10-03T00:00:00Z', { note: 'vendor' })]);
    expect(neverMarksFrom(again as never)).toEqual([{ key: a, kind: 'person', id: 'a@x-co.com', since: '2026-10-03T00:00:00.000Z', actor: ACTOR, note: 'vendor', via: null, eventId: `ev-${a}-never-2026-10-03T00:00:00Z` }]);
    expect(decidedFrom(again as never, NOW)).toEqual(new Set([a, `never:${a}`]));
    // A skip after the relist decides as a skip does: hidden for SKIP_DAYS, then back.
    const skipped = desc([...ended, row(a, 'skip', '2026-10-09T00:00:00Z')]);
    expect(decidedFrom(skipped as never, NOW)).toEqual(new Set([a]));
    expect(decidedFrom(skipped as never, later(SKIP_DAYS + 1))).toEqual(new Set());
    // A domain's relist ends only that domain's never; another domain and a trigger keep theirs.
    const mixed = desc([row('domain:x-co.com', 'never', '2026-10-01T00:00:00Z'), row('domain:y-co.com', 'never', '2026-10-01T00:00:00Z'), row('trigger:7', 'dismiss', '2026-10-01T00:00:00Z'), row('domain:x-co.com', 'relist', '2026-10-05T00:00:00Z')]);
    expect(decidedFrom(mixed as never, NOW)).toEqual(new Set(['domain:y-co.com', 'trigger:7']));
    // The relist is a recorded decision, never one offered on an item.
    expect(RECORDED_DECISIONS).toContain('relist');
    expect(PERSON_DECISIONS as readonly string[]).not.toContain('relist');
  });

  it('R5 review (finding 9): a relist reverses only the never: the newest decision before the never stands again (dismiss, never, relist: dismissed)', () => {
    const desc = (rows: Row[]) => [...rows].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    const a = 'person:a@x-co.com';
    const dismissed = desc([row(a, 'dismiss', '2026-10-01T00:00:00Z'), row(a, 'never', '2026-10-02T00:00:00Z'), row(a, 'relist', '2026-10-03T00:00:00Z')]);
    expect(neverMarksFrom(dismissed as never)).toEqual([]);
    expect(decidedFrom(dismissed as never, NOW)).toEqual(new Set([a]));
    // The decision before the never is read as it always is: an explore decides nothing, a skip only for SKIP_DAYS.
    const explored = desc([row(a, 'explore', '2026-10-01T00:00:00Z'), row(a, 'never', '2026-10-02T00:00:00Z'), row(a, 'relist', '2026-10-03T00:00:00Z')]);
    expect(decidedFrom(explored as never, NOW)).toEqual(new Set());
    const skipped = desc([row(a, 'skip', '2026-10-08T00:00:00Z'), row(a, 'never', '2026-10-08T01:00:00Z'), row(a, 'relist', '2026-10-08T02:00:00Z')]);
    expect(decidedFrom(skipped as never, NOW)).toEqual(new Set([a]));
    expect(decidedFrom(skipped as never, later(SKIP_DAYS + 3))).toEqual(new Set());
    // Two nevers each relisted: the decision before the first stands; nothing before it: undecided.
    const twice = desc([row(a, 'dismiss', '2026-10-01T00:00:00Z'), row(a, 'never', '2026-10-02T00:00:00Z'), row(a, 'relist', '2026-10-03T00:00:00Z'), row(a, 'never', '2026-10-04T00:00:00Z'), row(a, 'relist', '2026-10-05T00:00:00Z')]);
    expect(decidedFrom(twice as never, NOW)).toEqual(new Set([a]));
    const bare = desc([row(a, 'never', '2026-10-02T00:00:00Z'), row(a, 'relist', '2026-10-03T00:00:00Z')]);
    expect(decidedFrom(bare as never, NOW)).toEqual(new Set());
  });
});

describe('refusals', () => {
  it('relist on a signal or a trigger, or where no never stands (twice in a row included), is refused and writes nothing', async () => {
    const db = world();
    const c = db.client();
    expect(await applyDecision(c, { key: 'signal:s1', decision: 'relist', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'relist_is_for_senders' });
    expect(await applyDecision(c, { key: 'trigger:7', decision: 'relist', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'relist_is_for_senders' });
    expect(await applyDecision(c, { key: 'person:kim@acmefoods.com', decision: 'relist', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'nothing_to_relist' });
    expect(await applyDecision(c, { key: 'domain:riserify.com', decision: 'relist', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'nothing_to_relist' });
    // A skip on the key is not a never: still nothing to relist.
    await applyDecision(c, { key: 'person:kim@acmefoods.com', decision: 'skip', actor: ACTOR, now: NOW });
    expect(await applyDecision(c, { key: 'person:kim@acmefoods.com', decision: 'relist', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'nothing_to_relist' });
    expect(ledger(db)).toEqual([['person:kim@acmefoods.com', 'skip']]);
    // A second relist after the first is a no-op said as such.
    await applyDecision(c, { key: 'person:pat@riserify.com', decision: 'never', actor: ACTOR, now: NOW });
    expect((await applyDecision(c, { key: 'person:pat@riserify.com', decision: 'relist', actor: ACTOR, now: NOW })).ok).toBe(true);
    expect(await applyDecision(c, { key: 'person:pat@riserify.com', decision: 'relist', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'nothing_to_relist' });
    expect(ledger(db)).toEqual([['person:kim@acmefoods.com', 'skip'], ['person:pat@riserify.com', 'never'], ['person:pat@riserify.com', 'relist']]);
  });
});

describe('a domain never and its relist', () => {
  it('relisting a person under a standing domain never keeps them off and says why; the domain relist lists everyone at it again', { timeout: 120_000 }, async () => {
    const db = world();
    const c = db.client();
    await applyDecision(c, { key: 'domain:firecrown.com', decision: 'never', actor: ACTOR, now: NOW });
    await applyDecision(c, { key: 'person:jo@firecrown.com', decision: 'never', actor: ACTOR, now: NOW });
    expect(await people(c, NOW)).toEqual(['kim@acmefoods.com', 'pat@riserify.com']);
    expect(await domainNeverCovering(c, 'amy@mail.firecrown.com')).toMatchObject({ key: 'domain:firecrown.com' });
    // The panel's list: both marks stand, newest first.
    expect((await loadIntelligence(c, { now: NOW })).notProspects?.map((m) => m.key)).toEqual(['person:jo@firecrown.com', 'domain:firecrown.com']);
    const p = await applyDecision(c, { key: 'person:jo@firecrown.com', decision: 'relist', actor: ACTOR, now: NOW });
    expect(p).toMatchObject({ ok: true, effects: ['relisted', 'still_not_a_prospect_by:domain:firecrown.com'], stillCoveredBy: { key: 'domain:firecrown.com' } });
    if (!p.ok) return;
    expect(decisionLine(p)).toContain('They stay off the list while everyone at firecrown.com is marked not a prospect; list that domain again to list them.');
    expect(await people(c, NOW)).toEqual(['kim@acmefoods.com', 'pat@riserify.com']);
    const d = await applyDecision(c, { key: 'domain:firecrown.com', decision: 'relist', actor: ACTOR, now: NOW });
    expect(d).toMatchObject({ ok: true, key: 'domain:firecrown.com', decision: 'relist', effects: ['relisted_domain'] });
    if (!d.ok) return;
    expect(decisionLine(d)).toBe('Listed again: people at firecrown.com are no longer marked not a prospect (marked Oct 10, 2026), so the prospects to reengage can list them again. Only that mark was reversed: an opt-out, a suppression or do not contact still stands, and nothing else changed. Nothing was sent to anyone.');
    expect(await people(c, NOW)).toEqual(['amy@mail.firecrown.com', 'jo@firecrown.com', 'kim@acmefoods.com', 'pat@riserify.com']);
    expect((await loadIntelligence(c, { now: NOW })).notProspects).toEqual([]);
    expect(ledger(db)).toEqual([['domain:firecrown.com', 'never'], ['person:jo@firecrown.com', 'never'], ['person:jo@firecrown.com', 'relist'], ['domain:firecrown.com', 'relist']]);
  });
});
