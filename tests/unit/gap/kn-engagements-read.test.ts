// @vitest-environment node
/**
 * B2 (knowledge program, 2026-10-09): HubSpot engagements on the account story. The story read HubSpot for deals and
 * people only; the notes, calls, meetings and logged emails on the company record never reached "what has happened
 * between us". Pinned: loadCompanyEngagements reads the four objects through the search POST (read-only: never a
 * write), newest first within the window, a note, a call and a meeting render on the story in date order tagged by
 * origin (never buyer words; an email FROM them is a reply), a 500 reads as failed with its detail while the rest
 * stands, the SystemConfig cache answers the second read, an absent token is not read and not cached, and the
 * coverage carries the hubspot_engagements row with its count.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { ENGAGEMENT_CACHE_MS, ENGAGEMENT_FAILURE_CACHE_MS, engagementCacheKey, engagementText, loadCompanyEngagements, readCompanyEngagements } from '@/lib/gap/hubspot/engagements';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectStory } from '@/lib/gap/story/story';
import { mergeTouches } from '@/lib/gap/story/touches';
import { coverageFromPage } from '@/lib/gap/ask/context';
import { coverageLineOf } from '@/lib/gap/ask/grounding';
import type { PursuitState } from '@/lib/gap/pursuit/state';

const NOW = new Date('2026-10-09T13:00:00Z');
const ms = (iso: string) => String(new Date(iso).getTime());

type Call = { url: string; method: string; body: Record<string, unknown> | null };
function hubspot(over: Partial<Record<'notes' | 'calls' | 'meetings' | 'emails', { status?: number; results?: unknown[] }>> = {}) {
  const calls: Call[] = [];
  const rows = {
    notes: [{ id: 'n1', properties: { hs_timestamp: ms('2026-09-09T15:00:00Z'), hs_note_body: '<p>Spoke with Dave about the <b>Primo</b> record &amp; the yards.</p>' } }],
    calls: [{ id: 'c1', properties: { hs_timestamp: ms('2026-09-20T16:00:00Z'), hs_call_title: 'Intro call with Dave', hs_call_body: 'He runs 40 trailers a day at Hopkins.' } }],
    meetings: [{ id: 'm1', properties: { hs_timestamp: ms('2026-09-01T14:00:00Z'), hs_meeting_title: 'Yard walk', hs_meeting_outcome: 'COMPLETED', hs_meeting_body: 'Walked the Hopkins yard.' } }],
    emails: [
      { id: 'e1', properties: { hs_timestamp: ms('2026-09-24T15:00:00Z'), hs_email_subject: 'Re: the record', hs_email_text: 'Poking holes in the Primo record now.', hs_email_direction: 'INCOMING_EMAIL', hs_email_from_email: 'craig.morrison@kencogroup.com' } },
      { id: 'e2', properties: { hs_timestamp: ms('2026-09-22T15:00:00Z'), hs_email_subject: 'The record', hs_email_text: 'Here is the record.', hs_email_direction: 'EMAIL', hs_email_from_email: 'casey@yardflow.ai', hs_email_to_email: 'craig.morrison@kencogroup.com' } },
      // Older than the window: HubSpot would not return it under the filter; a stray old row is still dated as it is.
    ],
  };
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const object = url.match(/\/crm\/v3\/objects\/(\w+)\/search$/)?.[1] as keyof typeof rows | undefined;
    calls.push({ url, method: init?.method ?? 'GET', body: init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null });
    if (!object) return new Response('not found', { status: 404 });
    const o = over[object];
    if (o?.status && o.status >= 400) return new Response('boom', { status: o.status });
    return new Response(JSON.stringify({ results: o?.results ?? rows[object] }), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

describe('B2: loadCompanyEngagements', () => {
  it('reads notes, calls, meetings and emails through the search POST only (never a write), newest first, bodies as text, an email with its sender and direction', async () => {
    const hs = hubspot();
    const r = await readCompanyEngagements('55608495412', { token: 'tok', now: NOW, fetchImpl: hs.fetchImpl });
    expect(r.read, r.detail ?? '').toBe(true);
    expect(r.items.map((i) => [i.kind, i.id, i.at.slice(0, 10)])).toEqual([['email', 'e1', '2026-09-24'], ['email', 'e2', '2026-09-22'], ['call', 'c1', '2026-09-20'], ['note', 'n1', '2026-09-09'], ['meeting', 'm1', '2026-09-01']]);
    expect(r.items.find((i) => i.id === 'n1')).toMatchObject({ title: null, body: 'Spoke with Dave about the Primo record & the yards.' });
    expect(r.items.find((i) => i.id === 'c1')).toMatchObject({ title: 'Intro call with Dave', body: 'He runs 40 trailers a day at Hopkins.' });
    expect(r.items.find((i) => i.id === 'm1')).toMatchObject({ title: 'Yard walk', body: 'COMPLETED: Walked the Hopkins yard.' });
    expect(r.items.find((i) => i.id === 'e1')).toMatchObject({ title: 'Re: the record', from: 'craig.morrison@kencogroup.com', direction: 'incoming' });
    expect(r.items.find((i) => i.id === 'e2')).toMatchObject({ direction: 'outgoing', from: 'casey@yardflow.ai', to: 'craig.morrison@kencogroup.com' });
    // Read-only by construction: four searches, each filtered by the company association and the window, sorted newest first, bounded.
    expect(hs.calls.map((c) => c.url.replace(/^https:\/\/api\.hubapi\.com/, ''))).toEqual(['/crm/v3/objects/notes/search', '/crm/v3/objects/calls/search', '/crm/v3/objects/meetings/search', '/crm/v3/objects/emails/search']);
    expect(hs.calls.every((c) => c.method === 'POST' && /\/search$/.test(c.url)), 'only search reads, never a write').toBe(true);
    const body = hs.calls[0].body as { filterGroups: Array<{ filters: Array<{ propertyName: string; operator: string; value: string }> }>; sorts: Array<{ propertyName: string; direction: string }>; limit: number };
    expect(body.filterGroups[0].filters.map((f) => [f.propertyName, f.operator])).toEqual([['associations.company', 'EQ'], ['hs_timestamp', 'GTE']]);
    expect(body.filterGroups[0].filters[0].value).toBe('55608495412');
    expect(Number(body.filterGroups[0].filters[1].value)).toBe(NOW.getTime() - 365 * 86_400_000);
    expect(body.sorts).toEqual([{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }]);
    expect(body.limit).toBe(50);
  });

  it('a 500 on one object reads as failed with its detail; the other objects stand; the limit is honoured', async () => {
    const hs = hubspot({ calls: { status: 500 } });
    const r = await readCompanyEngagements('1', { token: 'tok', now: NOW, fetchImpl: hs.fetchImpl, limit: 2 });
    expect(r.read).toBe(false);
    expect(r.detail).toBe('HubSpot calls read failed (500)');
    expect(r.items.map((i) => i.id)).toEqual(['e1', 'e2', 'n1', 'm1']);
    expect((hs.calls[0].body as { limit: number }).limit).toBe(2);
  });

  it('the SystemConfig cache answers the second read for 30 minutes; a failed read is retried after a minute; no token is not read and not cached', async () => {
    const db = ledgerDb({}, NOW);
    const prisma = db.client();
    const hs = hubspot();
    const first = await loadCompanyEngagements('7', { token: 'tok', now: NOW, fetchImpl: hs.fetchImpl, prisma });
    expect(first.items.length).toBe(5);
    expect(hs.calls.length).toBe(4);
    const cachedRow = await prisma.systemConfig.findUnique({ where: { key: engagementCacheKey('7') } });
    expect(cachedRow, 'the read is cached per company').toBeTruthy();
    const second = await loadCompanyEngagements('7', { token: 'tok', now: new Date(NOW.getTime() + ENGAGEMENT_CACHE_MS - 1000), fetchImpl: hs.fetchImpl, prisma });
    expect(hs.calls.length, 'the cache answered').toBe(4);
    expect(second.items.map((i) => i.id)).toEqual(first.items.map((i) => i.id));
    const third = await loadCompanyEngagements('7', { token: 'tok', now: new Date(NOW.getTime() + ENGAGEMENT_CACHE_MS + 1000), fetchImpl: hs.fetchImpl, prisma });
    expect(hs.calls.length, 'past the cache the read runs again').toBe(8);
    expect(third.read).toBe(true);
    // A failure is cached briefly, then retried.
    const bad = hubspot({ notes: { status: 503 } });
    const prisma2 = ledgerDb({}, NOW).client();
    const f1 = await loadCompanyEngagements('9', { token: 'tok', now: NOW, fetchImpl: bad.fetchImpl, prisma: prisma2 });
    expect(f1.read).toBe(false);
    expect(f1.detail).toContain('503');
    await loadCompanyEngagements('9', { token: 'tok', now: new Date(NOW.getTime() + ENGAGEMENT_FAILURE_CACHE_MS - 1000), fetchImpl: bad.fetchImpl, prisma: prisma2 });
    expect(bad.calls.length, 'the failure answered from the cache for a minute').toBe(4);
    await loadCompanyEngagements('9', { token: 'tok', now: new Date(NOW.getTime() + ENGAGEMENT_FAILURE_CACHE_MS + 1000), fetchImpl: bad.fetchImpl, prisma: prisma2 });
    expect(bad.calls.length, 'then retried').toBe(8);
    // No token: not read, nothing fetched, nothing cached.
    const none = hubspot();
    const prisma3 = ledgerDb({}, NOW).client();
    const n = await loadCompanyEngagements('11', { token: undefined, now: NOW, fetchImpl: none.fetchImpl, prisma: prisma3 });
    expect(n).toMatchObject({ items: [], read: false, detail: 'HubSpot is not configured' });
    expect(none.calls.length).toBe(0);
    expect(await prisma3.systemConfig.findUnique({ where: { key: engagementCacheKey('11') } })).toBeNull();
    // A timeout is said as one, never as an empty read.
    const slow = (async (_u: string, init?: RequestInit) => new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'TimeoutError' }))))) as unknown as typeof fetch;
    const t = await readCompanyEngagements('5', { token: 'tok', now: NOW, fetchImpl: slow, timeoutMs: 20 });
    expect(t.read).toBe(false);
    expect(t.detail).toContain('timed out');
    expect(engagementText('<div>Line one<br>Line &quot;two&quot;</div>', 12)).toBe('Line one...');
  });
});

const state = { accountName: 'Kenco', state: 'in_deal', stateLine: 'In a deal', person: null, blocker: null, unlock: null, coldTouchAllowed: false, chooseAllowed: false, replyClass: null, lastInbound: null, lastOutbound: null, chosenMissing: null, next: null, followUp: null, deals: [] } as unknown as PursuitState;
const inputsWith = (over: Partial<AccountInputs>): AccountInputs =>
  ({
    account: { name: 'Kenco', tier: 'Tier 1', priorityBand: 'A', vertical: '3PL', parentBrand: null, hubspotCompanyId: '55608495412' },
    aliases: [], domains: ['kencogroup.com'], siblings: [], watched: true, watchReasons: [],
    facts: [], signals: [], lastResearch: null, hypotheses: [], bids: [],
    personas: [{ id: 1, name: 'Craig Morrison', title: 'VP Operations', email: 'craig.morrison@kencogroup.com', doNotContact: false, hasEmail: true, emailStatus: 'valid' }], candidates: [], memberships: [], firstTouches: [], conversation: null,
    opportunity: { status: 'ACTIVE', detail: '', deals: [{ id: '62704698979', name: 'YardFlow - Kenco', stage: 'Presentation scheduled' }] },
    pack: null, microsite: null, facilityFact: null, roi: null,
    ...over,
  }) as unknown as AccountInputs;
const engagements: AccountInputs['engagements'] = {
  read: true,
  detail: null,
  items: [
    { kind: 'email', id: 'e1', at: '2026-09-24T15:00:00.000Z', title: 'Re: the record', body: 'Poking holes in the Primo record now.', from: 'craig.morrison@kencogroup.com', direction: 'incoming' },
    { kind: 'email', id: 'e2', at: '2026-09-22T15:00:00.000Z', title: 'The record', body: 'Here is the record.', from: 'casey@yardflow.ai', to: 'craig.morrison@kencogroup.com', direction: 'outgoing' },
    { kind: 'call', id: 'c1', at: '2026-09-20T16:00:00.000Z', title: 'Intro call with Dave', body: 'He runs 40 trailers a day at Hopkins.' },
    { kind: 'note', id: 'n1', at: '2026-09-09T15:00:00.000Z', title: null, body: 'Spoke with Dave about the Primo record and the yards.' },
    { kind: 'meeting', id: 'm1', at: '2026-09-01T14:00:00.000Z', title: 'Yard walk', body: 'COMPLETED: Walked the Hopkins yard.' },
    // A meeting ahead is not "logged" history.
    { kind: 'meeting', id: 'm2', at: '2026-10-20T14:00:00.000Z', title: 'Follow-up', body: 'SCHEDULED' },
  ],
};

describe('B2: the engagements on the story and in the coverage', () => {
  it('a call, a note and a meeting render as dated HubSpot rows in date order, Checked and tagged by origin; the incoming email is their reply (Buyer said) and the outgoing one is our send; the meeting ahead is not told as history', () => {
    const inputs = inputsWith({ engagements });
    const touches = mergeTouches({ history: [], firstTouches: [], clawd: { read: 'ok', sends: [] }, replies: [], people: inputs.personas.map((p) => ({ name: p.name, title: p.title, email: p.email ?? null })), engagements, now: NOW });
    expect(touches.map((t) => [t.kind, t.source, t.at.slice(0, 10)])).toEqual([['meeting', 'HubSpot', '2026-10-20'], ['reply', 'HubSpot', '2026-09-24'], ['send', 'HubSpot', '2026-09-22'], ['call', 'HubSpot', '2026-09-20'], ['note', 'HubSpot', '2026-09-09'], ['meeting', 'HubSpot', '2026-09-01']]);
    const brief = buildAccountBrief(inputs, NOW);
    const story = projectStory({ accountName: 'Kenco', now: NOW, state, brief, inputs, whyNow: [], know: [], touches, clawdRead: 'ok', vaultNote: null, excluded: [] });
    const row = story.rows.find((r) => r.key === 'between_us')!;
    const texts = row.sentences.map((s) => s.text);
    const hs = texts.filter((t) => /^HubSpot /.test(t));
    expect(hs).toEqual(['HubSpot call logged Sep 20: Intro call with Dave: He runs 40 trailers a day at Hopkins.', 'HubSpot note Sep 9: Spoke with Dave about the Primo record and the yards.', 'HubSpot meeting logged Sep 1: Yard walk: COMPLETED: Walked the Hopkins yard.']);
    for (const s of row.sentences.filter((x) => /^HubSpot /.test(x.text))) {
      expect(s.tag, s.text).toBe('Checked');
      expect(s.basis, s.text).toMatch(/^HubSpot, Sep \d+$/);
      expect(s.basisIds[0], s.text).toMatch(/^hubspot:(call|note|meeting):/);
    }
    // Their email is the one buyer sentence; the note is never buyer words.
    const buyer = row.sentences.filter((s) => s.tag === 'Buyer said');
    expect(buyer.map((s) => s.text), texts.join(' | ')).toEqual(['Craig Morrison, VP Operations replied on Sep 24: "Poking holes in the Primo record now.".']);
    expect(buyer[0].basis).toBe('HubSpot, Sep 24');
    // Our logged send is the last email; their later reply answered it.
    expect(texts[0]).toBe('Last email to Craig Morrison, VP Operations, Sep 22: "The record".');
    expect(texts.join(' ')).not.toContain('No answer on record');
    expect(texts.join(' ')).not.toContain('Follow-up');
    expect(texts.join(' ')).not.toContain('Nothing has happened');
  });

  it('the coverage carries hubspot_engagements read with its count, not read when the inputs hold nothing, failed with the detail, not configured as not read; the line says what was read', () => {
    const read = coverageFromPage(inputsWith({ engagements }), null, {});
    expect(read.find((c) => c.source === 'hubspot_engagements')).toEqual({ source: 'hubspot_engagements', status: 'read', detail: '6' });
    expect(coverageLineOf(read)).toContain('Read: HubSpot engagements (6)');
    const none = coverageFromPage(inputsWith({}), null, {});
    expect(none.find((c) => c.source === 'hubspot_engagements')).toEqual({ source: 'hubspot_engagements', status: 'not_read', detail: 'not read this time' });
    const failed = coverageFromPage(inputsWith({ engagements: { items: [], read: false, detail: 'HubSpot calls read failed (500)' } }), null, {});
    expect(failed.find((c) => c.source === 'hubspot_engagements')).toEqual({ source: 'hubspot_engagements', status: 'failed', detail: 'HubSpot calls read failed (500)' });
    const unconfigured = coverageFromPage(inputsWith({ engagements: { items: [], read: false, detail: 'HubSpot is not configured' } }), null, {});
    expect(unconfigured.find((c) => c.source === 'hubspot_engagements')!.status).toBe('not_read');
    expect(coverageLineOf(failed)).toMatch(/^Not read this time: .*HubSpot engagements \(HubSpot calls read failed \(500\)\)/);
    vi.restoreAllMocks();
  });
});
