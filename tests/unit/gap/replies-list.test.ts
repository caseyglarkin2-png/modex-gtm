/**
 * listReplies (GAP Prospecting OS, Sprint 4, S4-T3). Pins: only known
 * addresses (an enrollment or a persona with a hypothesis) appear; the
 * source key is (kind by message source, id = InboundMessage.id); the
 * snippet strips HTML and never exceeds 280 chars; `undispositioned` drops
 * only HUMAN-CONFIRMED rows and attaches an unconfirmed AI row as
 * `suggestion`; `all` keeps everything with `dispositionId`; the cursor
 * resumes after the last row looked at.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { htmlToText, listReplies, loadKnownAddresses, snippetOf, sourceOfInbound, suggestionFromRow, SNIPPET_LENGTH } from '@/lib/gap/replies/list';

/* eslint-disable @typescript-eslint/no-explicit-any */
function asyncSpy(impl?: (...args: any[]) => Promise<any>) {
  return impl ? vi.fn<(...args: any[]) => Promise<any>>(impl) : vi.fn<(...args: any[]) => Promise<any>>();
}

const T = (n: number) => new Date(Date.UTC(2026, 8, 23, 12, 0, n));

const ENROLLMENTS = [
  { id: 'E1', to_email: 'jordan@acme.example', status: 'paused', hypothesis_id: 'H1', persona_id: 7, account_name: 'Acme Logistics', hubspot_contact_id: 'hs-7', enrolled_at: T(0) },
  { id: 'E2', to_email: 'sam@beta.example', status: 'stopped', hypothesis_id: 'H2', persona_id: null, account_name: 'Beta Foods', hubspot_contact_id: null, enrolled_at: T(0) },
];
const PERSONAS = [
  {
    id: 7, email: 'Jordan@Acme.example', account_name: 'Acme Logistics', hubspot_contact_id: 'hs-7',
    prospecting_hypotheses: [{ id: 'H1', status: 'active', problem_family: 'hidden_capacity', created_at: T(0) }],
  },
  {
    id: 9, email: 'lee@gamma.example', account_name: 'Gamma Retail', hubspot_contact_id: null,
    prospecting_hypotheses: [
      { id: 'H3', status: 'draft', problem_family: 'network_standardization', created_at: T(5) },
      { id: 'H4', status: 'approved', problem_family: 'hidden_capacity', created_at: T(1) },
    ],
  },
];

const MESSAGES = [
  { id: 'm5', source: 'gmail', from_email: 'jordan@acme.example', subject: 'Re: yards', body_text: 'Yes we lose trailers every week. Call me.', body_html: null, snippet: null, received_at: T(5) },
  { id: 'hs:44', source: 'hubspot', from_email: 'Sam@beta.example', subject: 'Re: dock', body_text: null, body_html: '<div><p>Not <b>now</b>.</p><style>p{}</style>&nbsp;Q1 maybe.</div>', snippet: null, received_at: T(4) },
  { id: 'm3', source: 'gmail', from_email: 'lee@gamma.example', subject: null, body_text: null, body_html: null, snippet: 'thin', received_at: T(3) },
  { id: 'm2', source: 'gmail', from_email: 'jordan@acme.example', subject: 'Re: yards', body_text: 'x'.repeat(500), body_html: null, snippet: null, received_at: T(2) },
  { id: 'm1', source: 'gmail', from_email: 'stranger@nowhere.example', subject: 'spam', body_text: 'buy now', body_html: null, snippet: null, received_at: T(1) },
];

function makePrisma(dispositions: any[] = []) {
  return {
    sequenceEnrollment: { findMany: asyncSpy(async () => ENROLLMENTS) },
    persona: {
      findMany: asyncSpy(async (q: any = {}) =>
        q?.orderBy?.id === 'asc' ? [...PERSONAS].sort((a, b) => a.id - b.id) : PERSONAS,
      ),
    },
    inboundMessage: {
      findMany: asyncSpy(async (q: any) => {
        const emails: string[] = q.where.from_email.in;
        let rows = MESSAGES.filter((m) => emails.includes(m.from_email.toLowerCase()));
        if (q.cursor) {
          const at = rows.findIndex((r) => r.id === q.cursor.id);
          rows = rows.slice(at + (q.skip ?? 0));
        }
        return rows.slice(0, q.take);
      }),
    },
    conversationDisposition: {
      findMany: asyncSpy(async (q: any) => dispositions.filter((d) => q.where.source_id.in.includes(d.source_id))),
    },
  };
}

let prisma: ReturnType<typeof makePrisma>;

beforeEach(() => {
  prisma = makePrisma();
});

describe('pure helpers', () => {
  it('htmlToText strips tags and styles, decodes the common entities, collapses whitespace', () => {
    expect(htmlToText('<div><p>Not <b>now</b>.</p><style>p{}</style>&nbsp;Q1 &amp; Q2</div>')).toBe('Not now. Q1 & Q2');
  });

  it('snippetOf prefers body_text, falls back to stripped html, then the stored snippet, and clips at 280', () => {
    expect(snippetOf({ body_text: '  a  b ', body_html: '<b>x</b>' })).toBe('a b');
    expect(snippetOf({ body_text: null, body_html: '<p>hello</p>' })).toBe('hello');
    expect(snippetOf({ body_text: null, body_html: null, snippet: '<i>s</i>' })).toBe('s');
    expect(snippetOf({ body_text: 'y'.repeat(1000) })).toHaveLength(SNIPPET_LENGTH);
  });

  it('sourceOfInbound keys hubspot rows as hubspot_engagement and everything else as inbound_message, id = row id', () => {
    expect(sourceOfInbound({ id: 'hs:44', source: 'hubspot' })).toEqual({ kind: 'hubspot_engagement', id: 'hs:44' });
    expect(sourceOfInbound({ id: 'm1', source: 'gmail' })).toEqual({ kind: 'inbound_message', id: 'm1' });
    expect(sourceOfInbound({ id: 'm1' })).toEqual({ kind: 'inbound_message', id: 'm1' });
  });

  it('suggestionFromRow reads only an unconfirmed ai row with the written shape', () => {
    const good = { id: 'D_ai', human_confirmed: false, created_by: 'ai', ai_suggested: { responseClass: 'timing', bids: [{ type: 'priority', quote: 'Q1', why: 'said so' }], why: 'timing words' } };
    expect(suggestionFromRow(good)).toEqual({ id: 'D_ai', responseClass: 'timing', bids: [{ type: 'priority', quote: 'Q1', why: 'said so' }], why: 'timing words' });
    expect(suggestionFromRow({ ...good, human_confirmed: true })).toBeNull();
    expect(suggestionFromRow({ ...good, created_by: 'casey' })).toBeNull();
    expect(suggestionFromRow({ ...good, ai_suggested: 'garbage' })).toBeNull();
  });
});

describe('listReplies', () => {
  it('lists known addresses only, newest first, with the source key, plain snippet and the address context', async () => {
    const page = await listReplies(prisma, { state: 'all' });
    expect(page.items.map((i) => i.id)).toEqual(['m5', 'hs:44', 'm3', 'm2']);
    expect(page.nextCursor).toBeNull();
    const [m5, hs44, m3] = page.items;
    expect(m5).toMatchObject({
      source: { kind: 'inbound_message', id: 'm5' },
      contactEmail: 'jordan@acme.example',
      personaId: 7,
      accountName: 'Acme Logistics',
      hypothesisId: 'H1',
      hypothesisTitle: 'hidden_capacity',
      subject: 'Re: yards',
      snippet: 'Yes we lose trailers every week. Call me.',
      receivedAt: T(5).toISOString(),
      enrollmentId: 'E1',
      enrollmentStatus: 'paused',
      suggestion: null,
      dispositionId: null,
    });
    expect(hs44).toMatchObject({ source: { kind: 'hubspot_engagement', id: 'hs:44' }, snippet: 'Not now. Q1 maybe.', accountName: 'Beta Foods', hypothesisId: 'H2', enrollmentId: 'E2', personaId: null });
    expect(hs44.snippet).not.toContain('<');
    // A persona with hypotheses but no enrollment: the approved one beats the newer draft.
    expect(m3).toMatchObject({ personaId: 9, hypothesisId: 'H4', enrollmentId: null, snippet: 'thin' });
    expect(page.items[3].snippet).toHaveLength(280);
    expect(prisma.inboundMessage.findMany.mock.calls[0][0].where.from_email.in).toEqual(
      expect.arrayContaining(['jordan@acme.example', 'sam@beta.example', 'lee@gamma.example']),
    );
    expect(prisma.inboundMessage.findMany.mock.calls[0][0].where.from_email.in).not.toContain('stranger@nowhere.example');
  });

  it('undispositioned drops rows with a human-confirmed disposition and attaches an unconfirmed AI row as the suggestion', async () => {
    prisma = makePrisma([
      { id: 'D1', source_kind: 'inbound_message', source_id: 'm5', human_confirmed: true, created_by: 'casey', ai_suggested: null },
      { id: 'D_ai', source_kind: 'hubspot_engagement', source_id: 'hs:44', human_confirmed: false, created_by: 'ai', ai_suggested: { responseClass: 'timing', bids: [], why: 'Q1 maybe' } },
    ]);
    const page = await listReplies(prisma, { state: 'undispositioned' });
    expect(page.items.map((i) => i.id)).toEqual(['hs:44', 'm3', 'm2']);
    expect(page.items[0].suggestion).toEqual({ id: 'D_ai', responseClass: 'timing', bids: [], why: 'Q1 maybe' });
    expect(page.items[0]).not.toHaveProperty('dispositionId');
    expect(prisma.conversationDisposition.findMany.mock.calls[0][0].where).toEqual({
      source_kind: { in: ['inbound_message', 'hubspot_engagement'] },
      source_id: { in: ['m5', 'hs:44', 'm3', 'm2'] },
    });
  });

  it('state=all keeps the dispositioned row and names its disposition', async () => {
    prisma = makePrisma([{ id: 'D1', source_kind: 'inbound_message', source_id: 'm5', human_confirmed: true, created_by: 'casey', ai_suggested: null }]);
    const page = await listReplies(prisma, { state: 'all' });
    expect(page.items[0]).toMatchObject({ id: 'm5', dispositionId: 'D1' });
  });

  it('pages with a cursor: limit 2 stops mid-list and resumes after the last row looked at', async () => {
    const first = await listReplies(prisma, { state: 'all', limit: 2 });
    expect(first.items.map((i) => i.id)).toEqual(['m5', 'hs:44']);
    expect(first.nextCursor).toBe('hs:44');
    const second = await listReplies(prisma, { state: 'all', limit: 2, cursor: first.nextCursor });
    expect(second.items.map((i) => i.id)).toEqual(['m3', 'm2']);
    expect(second.nextCursor).toBeNull();
  });

  it('the undispositioned filter keeps pulling pages until the limit is met', async () => {
    prisma = makePrisma([
      { id: 'D1', source_kind: 'inbound_message', source_id: 'm5', human_confirmed: true, created_by: 'casey', ai_suggested: null },
      { id: 'D2', source_kind: 'hubspot_engagement', source_id: 'hs:44', human_confirmed: true, created_by: 'casey', ai_suggested: null },
    ]);
    const page = await listReplies(prisma, { state: 'undispositioned', limit: 1 });
    expect(page.items.map((i) => i.id)).toEqual(['m3']);
    expect(page.nextCursor).toBe('m3');
    expect(prisma.inboundMessage.findMany.mock.calls.length).toBeGreaterThan(1);
  });

  it('no known addresses means an empty page and no inbox query', async () => {
    prisma.sequenceEnrollment.findMany.mockResolvedValueOnce([]);
    prisma.persona.findMany.mockResolvedValueOnce([]);
    expect(await listReplies(prisma)).toEqual({ items: [], nextCursor: null });
    expect(prisma.inboundMessage.findMany).not.toHaveBeenCalled();
  });
});

describe('loadKnownAddresses', () => {
  it('SF8: two personas sharing an email resolve to the lowest-id persona, deterministically, regardless of DB row order', async () => {
    const shared = 'dup@acme.example';
    const outOfOrder = {
      sequenceEnrollment: { findMany: asyncSpy(async () => []) },
      persona: {
        // Seeded newest-id-first: the fix must sort, not trust array order,
        // the SAME rule hubspot-poller.ts's loadScopedPersonas uses, so a
        // reply from a shared email attributes to the same persona in both
        // reply triage and the poller.
        findMany: asyncSpy(async (q: any = {}) => {
          // Raw (unsorted) order puts the WRONG persona last, so a caller
          // that forgets to request id-asc order and relies on last-wins
          // (the pre-fix behavior) would pick the wrong one.
          const rows = [
            { id: 4, email: shared, account_name: 'Right Account', hubspot_contact_id: 'hs-4', prospecting_hypotheses: [{ id: 'HR', status: 'active', problem_family: 'right_family', created_at: T(0) }] },
            { id: 30, email: shared, account_name: 'Wrong Account', hubspot_contact_id: 'hs-30', prospecting_hypotheses: [{ id: 'HW', status: 'active', problem_family: 'wrong_family', created_at: T(0) }] },
          ];
          return q?.orderBy?.id === 'asc' ? rows.sort((a, b) => a.id - b.id) : rows;
        }),
      },
    };
    const map = await loadKnownAddresses(outOfOrder);
    const known = map.get(shared);
    expect(known?.personaId).toBe(4);
    expect(known?.accountName).toBe('Right Account');
    expect(known?.hypothesisId).toBe('HR');
  });
});
