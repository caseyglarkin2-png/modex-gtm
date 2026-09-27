/**
 * Red team T5: ONE-CLICK UNSUBSCRIBE (RFC 8058) that actually works.
 *
 * The List-Unsubscribe header advertised one-click but pointed at the
 * /unsubscribe PAGE, and the API's form branch expected the address in the
 * body. A mailbox provider's one-click is:
 *
 *   POST <the header URL, identity + token in its query>
 *   Content-Type: application/x-www-form-urlencoded
 *   List-Unsubscribe=One-Click
 *
 * with no Origin. This pins that exact request end to end: the
 * unsubscribed_emails row, persona do_not_contact through the canonical
 * path, the next touch stopped and the next send refused.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/hubspot/contacts', () => ({ upsertContact: vi.fn(async () => null) }));
vi.mock('@/lib/gap/routing/inputs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/gap/routing/inputs')>();
  return { ...actual, readComms: vi.fn(async () => ({ meetingBooked: false })) };
});

const store = vi.hoisted(() => ({ prisma: null as any }));
vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return store.prisma;
  },
}));

import { POST } from '@/app/api/unsubscribe/route';
import { generateToken } from '@/lib/email/unsubscribe-token';
import { listUnsubscribeHeaders } from '@/lib/email/templates';
import { COMPANY_POSTAL_ADDRESS, oneClickUnsubscribeUrl, unsubscribePageUrl } from '@/lib/email/compliance';
import { computeNextTouch } from '@/lib/gap/execution/next-touch';
import { prepareSellerEmail } from '@/lib/gap/execution/seller-draft';
import { MANUAL_SENT } from '@/lib/gap/execution/draft-ledger';
import { NOW, baseDeps, db, prismaOf, type Db } from './gap/fixtures/seller-db';
import { findFirstFrom, matchesWhere } from './gap/fixtures/where';

const JOEY = 'joey.maggard@kroger.com';

function world() {
  const d: Db & { unsub: any[] } = { ...db(), unsub: [] };
  const p: any = prismaOf(d);
  p.unsubscribedEmail = {
    findUnique: vi.fn(async ({ where }: any) => d.unsub.find((u) => u.email === where.email) ?? null),
    findFirst: vi.fn(async (args: any) => findFirstFrom(d.unsub, args)),
    create: vi.fn(async ({ data }: any) => {
      d.unsub.push(data);
      return data;
    }),
  };
  p.persona.updateMany = vi.fn(async ({ where, data }: any) => {
    const hit = d.personas.filter((x) => matchesWhere(x, where));
    for (const x of hit) Object.assign(x, data);
    return { count: hit.length };
  });
  p.persona.findFirst = vi.fn(async (args: any) => findFirstFrom(d.personas, args));
  p.conversationDisposition = { findFirst: vi.fn(async () => null) };
  p.inboundMessage = { findFirst: vi.fn(async () => null), findMany: vi.fn(async () => []) };
  d.audit.push({ id: 'm0', kind: MANUAL_SENT, subject_type: 'routing_decision', subject_id: 'dec-joey', created_at: new Date('2026-09-25T20:59:19Z'), payload: { engine: 'manual', stepIndex: 0, recipient: JOEY, personaId: 1886, sequenceVersionId: 'ver-hc', subject: 's', gmailSentMessageId: 'g', gmailThreadId: 't', sentAt: '2026-09-25T20:59:19.000Z' } });
  store.prisma = p;
  return { d, p };
}

const oneClick = (query: string, body = 'List-Unsubscribe=One-Click', headers: Record<string, string> = {}) =>
  POST(
    new NextRequest(`https://modex-gtm.vercel.app/api/unsubscribe/?${query}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
      body,
    }),
  );

beforeEach(() => {
  process.env.UNSUBSCRIBE_SECRET = 'test-unsub-secret';
  process.env.NEXT_PUBLIC_APP_URL = 'https://modex-gtm.vercel.app';
});

describe('RFC 8058 one-click POST', () => {
  it('the exact one-click request unsubscribes: row, persona DNC, next touch stopped, next send refused', async () => {
    const { d, p } = world();
    const res = await oneClick(`email=${encodeURIComponent(JOEY)}&token=${generateToken(JOEY)}`);
    expect(res.status).toBe(200);
    expect(d.unsub.map((u) => u.email)).toEqual([JOEY]);
    expect(d.personas.find((x) => x.id === 1886).do_not_contact).toBe(true);

    const touch = await computeNextTouch(p, 'dec-joey', new Date('2026-10-02T12:00:00Z'), { getThread: async () => [], gapSender: () => null });
    expect(touch).toMatchObject({ state: 'stopped' });

    d.audit.length = 0; // even with no send on record, the person is not sendable
    const r = await prepareSellerEmail(p, { decisionId: 'dec-joey', actor: 'casey@freightroll.com', now: NOW, stepIndex: 0 }, baseDeps(d));
    expect(r).toMatchObject({ ok: false, reason: 'persona_do_not_contact' });
  });

  it('no Origin header is required for one-click', async () => {
    world();
    const res = await oneClick(`email=${encodeURIComponent(JOEY)}&token=${generateToken(JOEY)}`, 'List-Unsubscribe=One-Click', {});
    expect(res.status).toBe(200);
  });

  it('a bad token is refused and writes nothing', async () => {
    const { d } = world();
    const res = await oneClick(`email=${encodeURIComponent(JOEY)}&token=${'0'.repeat(64)}`);
    expect(res.status).toBe(403);
    expect(d.unsub).toHaveLength(0);
    expect(d.personas.find((x) => x.id === 1886).do_not_contact).toBe(false);
  });

  it('a form body carrying anything but List-Unsubscribe=One-Click is refused (identity comes only from the signed URL)', async () => {
    const { d } = world();
    const other = 'jason.gaiser@kroger.com';
    const res = await oneClick(`email=${encodeURIComponent(JOEY)}&token=${generateToken(JOEY)}`, `List-Unsubscribe=One-Click&email=${encodeURIComponent(other)}`);
    expect(res.status).toBe(400);
    expect(d.unsub).toHaveLength(0);
  });
});

describe('the advertised header targets the one-click endpoint', () => {
  it('app templates: List-Unsubscribe is the API URL with the signed identity in its query', () => {
    const h = listUnsubscribeHeaders(JOEY);
    expect(h['List-Unsubscribe']).toBe(`<https://yardflow.ai/api/unsubscribe/?email=${encodeURIComponent(JOEY)}&token=${generateToken(JOEY)}>`);
    expect(h['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
  });

  it('GAP seller email: header is the API one-click URL; the visible footer names the postal address', async () => {
    const { d, p } = world();
    d.audit.length = 0;
    const deps = { ...baseDeps(d) } as any;
    delete deps.unsubscribeUrl;
    const r = await prepareSellerEmail(p, { decisionId: 'dec-joey', actor: 'casey@freightroll.com', now: NOW, stepIndex: 0 }, deps);
    if (!r.ok || !('prepared' in r)) throw new Error(JSON.stringify(r));
    expect(r.prepared.headers['List-Unsubscribe']).toBe(`<https://yardflow.ai/api/unsubscribe/?email=${encodeURIComponent(JOEY)}&token=${generateToken(JOEY)}>`);
    expect(r.prepared.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(r.prepared.html).toContain(COMPANY_POSTAL_ADDRESS.replace(/&/g, '&amp;'));
    expect(r.prepared.text).toContain(COMPANY_POSTAL_ADDRESS);
    expect(COMPANY_POSTAL_ADDRESS).toBe('FreightRoll Inc. · 330 E. Liberty St, Ann Arbor, MI 48104');
  });
});

describe('Release B review #5: the idempotent path re-applies do_not_contact', () => {
  it('an existing unsubscribe row with a persona still contactable (a prior partial failure) is repaired on retry', async () => {
    const { d } = world();
    d.unsub.push({ email: JOEY });
    expect(d.personas.find((x) => x.id === 1886).do_not_contact).toBe(false);
    const res = await oneClick(`email=${encodeURIComponent(JOEY)}&token=${generateToken(JOEY)}`);
    expect(res.status).toBe(200);
    expect(d.personas.find((x) => x.id === 1886).do_not_contact).toBe(true);
  });
});

/** A multipart/form-data one-click exactly as a mailbox provider sends it (explicit boundary, no Origin). */
function multipart(fields: Record<string, string>) {
  const b = '----gap-one-click-boundary';
  const CRLF = String.fromCharCode(13, 10);
  const body =
    Object.entries(fields)
      .map(([k, v]) => `--${b}${CRLF}Content-Disposition: form-data; name="${k}"${CRLF}${CRLF}${v}${CRLF}`)
      .join('') + `--${b}--${CRLF}`;
  return new NextRequest(`https://modex-gtm.vercel.app/api/unsubscribe/?email=${encodeURIComponent(JOEY)}&token=${generateToken(JOEY)}`, {
    method: 'POST',
    headers: { 'content-type': `multipart/form-data; boundary=${b}` },
    body,
  });
}

describe('Release B review: RFC 8058 multipart/form-data one-click', () => {
  it('a multipart one-click POST (the RFC SHOULD) with no Origin unsubscribes', async () => {
    const { d } = world();
    const res = await POST(multipart({ 'List-Unsubscribe': 'One-Click' }));
    expect(res.status).toBe(200);
    expect(d.unsub.map((u) => u.email)).toEqual([JOEY]);
  });

  it('a malformed multipart body is a 400, never a 500, and writes nothing', async () => {
    const { d } = world();
    const res = await POST(new NextRequest(`https://modex-gtm.vercel.app/api/unsubscribe/?email=${encodeURIComponent(JOEY)}&token=${generateToken(JOEY)}`, { method: 'POST', headers: { 'content-type': 'multipart/form-data; boundary=x' }, body: 'not multipart' }));
    expect(res.status).toBe(400);
    expect(d.unsub).toHaveLength(0);
  });

  it('a multipart body carrying an extra field is refused', async () => {
    const { d } = world();
    const res = await POST(multipart({ 'List-Unsubscribe': 'One-Click', email: 'jason.gaiser@kroger.com' }));
    expect(res.status).toBe(400);
    expect(d.unsub).toHaveLength(0);
  });
});

describe('ops closeout 4: the branded unsubscribe path', () => {
  it('links and the RFC 8058 header name yardflow.ai by default (the rewrite there terminates at this app)', () => {
    delete process.env.UNSUBSCRIBE_BASE_URL;
    expect(oneClickUnsubscribeUrl(JOEY)).toBe(`https://yardflow.ai/api/unsubscribe/?email=${encodeURIComponent(JOEY)}&token=${generateToken(JOEY)}`);
    expect(unsubscribePageUrl(JOEY, 42)).toBe(`https://yardflow.ai/unsubscribe/?email=${encodeURIComponent(JOEY)}&token=${generateToken(JOEY)}&id=42`);
  });

  it('UNSUBSCRIBE_BASE_URL overrides it (a rollback needs no deploy of copy)', () => {
    process.env.UNSUBSCRIBE_BASE_URL = 'https://modex-gtm.vercel.app/';
    try {
      expect(oneClickUnsubscribeUrl(JOEY).startsWith('https://modex-gtm.vercel.app/api/unsubscribe/?')).toBe(true);
    } finally {
      delete process.env.UNSUBSCRIBE_BASE_URL;
    }
  });
});
