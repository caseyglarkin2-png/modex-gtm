// @vitest-environment node
/**
 * C12 (the commercial-context audit, 2026-10-08): a seller's classification correction is a durable, explainable
 * ledger row scoped to one thread or one message. Correcting one media thread never blacklists the domain; the next
 * run honours the override and keeps the machine suggestion beside it; a domain scope is refused.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { CLASSIFIED_KIND, applyOverrides, loadOverrides, recordOverride, relationshipOverride } from '@/lib/gap/context/classification-overrides';
import type { Overridable } from '@/lib/gap/context/classification-overrides';

const NOW = new Date('2026-10-08T15:00:00Z');
const ev = (id: string, threadId: string, purpose: Overridable['purpose'], providerIds: string[] = [`gmail:${id}`]): Overridable => ({ id, threadId, purpose, providerIds });

describe('C12: durable, explainable, one-conversation overrides', () => {
  it('records an append-only row with source id, scope, rationale, version and the machine suggestion; refuses a domain scope, no rationale, nothing set', async () => {
    const d = ledgerDb({}, NOW);
    const p = d.client();
    const first = await recordOverride(p, { sourceId: 't-media', scope: 'thread', purpose: 'buyer_conversation', rationale: 'Ann is a reporter but this thread is her asking about a pilot for her own yards', actor: 'casey@freightroll.com', machine: { purpose: 'media', relationship: 'media' }, now: NOW });
    expect(first).toEqual({ ok: true, id: 'ev00001', version: 1 });
    const second = await recordOverride(p, { sourceId: 't-media', scope: 'thread', purpose: 'media', relationship: 'media', rationale: 'Confirmed: it is a story, not a pilot', actor: 'casey@freightroll.com', now: new Date('2026-10-08T16:00:00Z') });
    expect(second).toMatchObject({ ok: true, version: 2 });
    expect(second.ok && second.id).not.toBe(first.ok && first.id);
    expect(d.store.gapAuditEvent.map((r) => [r.kind, r.subject_type, r.subject_id, r.payload.version, r.payload.scope])).toEqual([[CLASSIFIED_KIND, 'conversation', 't-media', 1, 'thread'], [CLASSIFIED_KIND, 'conversation', 't-media', 2, 'thread']]);
    expect(d.store.gapAuditEvent[0].payload.machine).toEqual({ purpose: 'media', relationship: 'media' });
    // @ts-expect-error a domain is never a scope
    expect(await recordOverride(p, { sourceId: 'freightwaves.example', scope: 'domain', purpose: 'media', rationale: 'all of them', actor: 'casey@freightroll.com' })).toEqual({ ok: false, reason: 'scope_not_allowed' });
    expect(await recordOverride(p, { sourceId: 't-x', scope: 'thread', purpose: 'media', rationale: '   ', actor: 'c' })).toEqual({ ok: false, reason: 'no_rationale' });
    expect(await recordOverride(p, { sourceId: 't-x', scope: 'thread', rationale: 'why', actor: 'c' })).toEqual({ ok: false, reason: 'nothing_to_set' });
    expect(await recordOverride(p, { sourceId: '', scope: 'message', purpose: 'media', rationale: 'why', actor: 'c' })).toEqual({ ok: false, reason: 'no_source' });
    expect(await recordOverride({}, { sourceId: 't-x', scope: 'thread', purpose: 'media', rationale: 'why', actor: 'c' })).toEqual({ ok: false, reason: 'not_stored' });
    expect(d.store.gapAuditEvent).toHaveLength(2);
  });

  it('the newest version applies to the one thread it names; another thread from the same domain and the machine suggestion are untouched', async () => {
    const d = ledgerDb({}, NOW);
    const p = d.client();
    await recordOverride(p, { sourceId: 't-media', scope: 'thread', purpose: 'media', rationale: 'a story', actor: 'casey@freightroll.com', machine: { purpose: 'buyer_conversation', relationship: null }, now: NOW });
    await recordOverride(p, { sourceId: 'm-pitch', scope: 'message', purpose: 'vendor_solicitation', rationale: 'a pitch, not a buyer question', actor: 'casey@freightroll.com', now: NOW });
    const events = [ev('m-1', 't-media', 'buyer_conversation'), ev('m-2', 't-media', 'buyer_conversation'), ev('m-3', 't-other-same-domain', 'buyer_conversation'), ev('m-pitch', 't-other-same-domain', 'buyer_conversation'), ev('m-4', 't-other-same-domain', 'buyer_conversation', ['hubspot:88', 'gmail:m-4'])];
    const overrides = await loadOverrides(p, [...events.map((e) => e.id), ...events.map((e) => e.threadId!)]);
    expect([...overrides.keys()]).toEqual(['t-media', 'm-pitch']);
    const out = applyOverrides(events, overrides);
    expect(out.map((e) => [e.id, e.purpose, e.machinePurpose, e.override?.rationale ?? null])).toEqual([
      ['m-1', 'media', 'buyer_conversation', 'a story'],
      ['m-2', 'media', 'buyer_conversation', 'a story'],
      ['m-3', 'buyer_conversation', 'buyer_conversation', null],
      ['m-pitch', 'vendor_solicitation', 'buyer_conversation', 'a pitch, not a buyer question'],
      ['m-4', 'buyer_conversation', 'buyer_conversation', null],
    ]);
    // A later version on the same thread wins; a provider id reaches a message override; a thread relationship is readable.
    await recordOverride(p, { sourceId: 't-media', scope: 'thread', purpose: 'buyer_conversation', relationship: 'prospect', rationale: 'she moved to ops at a 3PL', actor: 'casey@freightroll.com', now: new Date('2026-10-09T10:00:00Z') });
    await recordOverride(p, { sourceId: 'hubspot:88', scope: 'message', purpose: 'customer_support', rationale: 'a device question', actor: 'casey@freightroll.com', now: NOW });
    const again = await loadOverrides(d.client(), ['t-media', 'hubspot:88']);
    expect(again.get('t-media')).toMatchObject({ version: 2, purpose: 'buyer_conversation', relationship: 'prospect', machine: null });
    expect(applyOverrides(events, again).map((e) => [e.id, e.purpose])).toEqual([['m-1', 'buyer_conversation'], ['m-2', 'buyer_conversation'], ['m-3', 'buyer_conversation'], ['m-pitch', 'buyer_conversation'], ['m-4', 'customer_support']]);
    expect(relationshipOverride('t-media', again)).toBe('prospect');
    expect(relationshipOverride('t-other-same-domain', again)).toBeNull();
    expect((await loadOverrides(p, [])).size).toBe(0);
    expect((await loadOverrides({ gapAuditEvent: { findMany: async () => { throw new Error('down'); } } }, ['t-media'])).size).toBe(0);
  });
});
