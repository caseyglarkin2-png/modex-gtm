/**
 * S4-T1: recordUnsubscribe extraction.
 *
 * Three things are pinned here.
 *
 * 1. Call-shape snapshot of POST /api/unsubscribe. The `ROUTE_*` constants
 *    below were captured against the pre-refactor route (HEAD c6fee23c) and
 *    are the byte-level contract the refactored route must keep: the same
 *    prisma and HubSpot calls, in the same order, with the same arguments,
 *    and the same response bodies and status codes.
 * 2. The helper alone (source 'gap_disposition') produces the identical call
 *    sequence, is idempotent on the second call, and never throws for HubSpot.
 * 3. Structural invariant: no file under src/lib/gap or src/app/api/gap
 *    writes Persona.do_not_contact. The helper in src/lib/email is the only
 *    GAP-reachable writer (spec section 7: the column is the cross-plane modex
 *    suppression leg, so a stray writer would silently fork consent state).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';

process.env.UNSUBSCRIBE_SECRET = 'test-secret';
delete process.env.NEXT_PUBLIC_APP_URL;

type Call = [name: string, args: unknown];
const calls: Call[] = [];

/**
 * Recording is separate from the mocks so tests can freely swap a mock's
 * return value (mockResolvedValueOnce and friends) without losing the call
 * log: the wrapper logs, then delegates to the vi.fn.
 */
function recorded<T extends (...args: any[]) => any>(name: string, fn: T): T {
  return ((...args: unknown[]) => {
    calls.push([name, args[0]]);
    return fn(...args);
  }) as T;
}

const findUnique = vi.fn(async (_args: unknown): Promise<unknown> => null);
const create = vi.fn(async (args: unknown) => ({ id: 'ue_1', ...(args as { data: object }).data }));
const updateMany = vi.fn(async (_args: unknown) => ({ count: 1 }));
const findFirst = vi.fn(async (_args: unknown): Promise<unknown> => ({ id: 7, hubspot_contact_id: 'hs_123' }));
const upsertContact = vi.fn(async (_args: unknown): Promise<string | null> => 'hs_123');
/** Ops closeout: the unsubscribe also invalidates outstanding GAP drafts (unsubscribe-drafts.ts). */
const NO_DRAFTS = { found: 0, deleted: 0, pending: 0 };
const invalidateGapDraftsFor = vi.fn(async (_prisma: unknown, _email: string) => NO_DRAFTS);

const prismaMock = {
  unsubscribedEmail: {
    findUnique: recorded('unsubscribedEmail.findUnique', findUnique),
    create: recorded('unsubscribedEmail.create', create),
  },
  persona: {
    updateMany: recorded('persona.updateMany', updateMany),
    findFirst: recorded('persona.findFirst', findFirst),
  },
};

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/hubspot/contacts', () => ({ upsertContact: recorded('hubspot.upsertContact', upsertContact) }));
vi.mock('@/lib/gap/execution/unsubscribe-drafts', () => ({
  invalidateGapDraftsFor: (prisma: unknown, email: string) => {
    calls.push(['gap.invalidateDrafts', email]);
    return invalidateGapDraftsFor(prisma, email);
  },
}));

const { POST } = await import('@/app/api/unsubscribe/route');
const { generateToken } = await import('@/lib/email/unsubscribe-token');
const { recordUnsubscribe } = await import('@/lib/email/unsubscribe');

const APP_URL = 'https://modex-gtm.vercel.app';
const FRESH = 'fresh@example.com';

function postJson(body: Record<string, unknown>) {
  return new NextRequest(`${APP_URL}/api/unsubscribe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: APP_URL },
    body: JSON.stringify(body),
  });
}

/** Captured against the pre-refactor route. Fresh email, persona has a HubSpot id. */
const ROUTE_FRESH_SEQUENCE: Call[] = [
  ['unsubscribedEmail.findUnique', { where: { email: FRESH } }],
  ['unsubscribedEmail.create', { data: { email: FRESH, email_log_id: 42, reason: 'no longer relevant' } }],
  ['persona.updateMany', { where: { email: { equals: FRESH, mode: 'insensitive' } }, data: { do_not_contact: true } }],
  ['persona.findFirst', { where: { email: { equals: FRESH, mode: 'insensitive' } } }],
  ['hubspot.upsertContact', { email: FRESH, hs_email_optout: 'true' }],
  // Ops closeout: after every consent write, the GAP drafts to this recipient are invalidated.
  ['gap.invalidateDrafts', FRESH],
];

/** Captured against the pre-refactor route. Email already in the table: one read, nothing else. */
// Red team Release B review #5: the already-unsubscribed path re-applies the
// do_not_contact mirror (guarded to rows still contactable). No new
// unsubscribe row, no HubSpot call.
const ROUTE_ALREADY_SEQUENCE: Call[] = [
  ['unsubscribedEmail.findUnique', { where: { email: FRESH } }],
  ['persona.updateMany', { where: { email: { equals: FRESH, mode: 'insensitive' }, do_not_contact: false }, data: { do_not_contact: true } }],
  ['gap.invalidateDrafts', FRESH],
];

beforeEach(() => {
  calls.length = 0;
  vi.clearAllMocks();
  findUnique.mockResolvedValue(null);
  findFirst.mockResolvedValue({ id: 7, hubspot_contact_id: 'hs_123' });
  updateMany.mockResolvedValue({ count: 1 });
  upsertContact.mockResolvedValue('hs_123');
});

describe('POST /api/unsubscribe call-shape snapshot (pre-refactor contract)', () => {
  it('fresh email: findUnique, create, updateMany, findFirst, upsertContact, in that order', async () => {
    const res = await POST(postJson({ email: FRESH, token: generateToken(FRESH), emailLogId: 42, reason: 'no longer relevant' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ success: true, message: 'Successfully unsubscribed' });
    expect(calls).toStrictEqual(ROUTE_FRESH_SEQUENCE);
  });

  it('already unsubscribed: one findUnique, the DNC mirror re-applied, no new row, no HubSpot, same 200 body', async () => {
    findUnique.mockResolvedValueOnce({ id: 'ue_0', email: FRESH });
    const res = await POST(postJson({ email: FRESH, token: generateToken(FRESH) }));
    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ success: true, message: 'Email already unsubscribed' });
    expect(calls).toStrictEqual(ROUTE_ALREADY_SEQUENCE);
  });

  it('persona without a HubSpot id: rows written, upsertContact never called', async () => {
    findFirst.mockResolvedValueOnce({ id: 7, hubspot_contact_id: null });
    const res = await POST(postJson({ email: FRESH, token: generateToken(FRESH) }));
    expect(res.status).toBe(200);
    expect(calls.map((c) => c[0])).toStrictEqual([
      'unsubscribedEmail.findUnique',
      'unsubscribedEmail.create',
      'persona.updateMany',
      'persona.findFirst',
      'gap.invalidateDrafts',
    ]);
    expect(upsertContact).not.toHaveBeenCalled();
  });

  it('HubSpot throwing is fail-open: rows written and the route still answers 200 success', async () => {
    upsertContact.mockRejectedValueOnce(new Error('hubspot down'));
    const res = await POST(postJson({ email: FRESH, token: generateToken(FRESH) }));
    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ success: true, message: 'Successfully unsubscribed' });
    expect(create).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledTimes(1);
  });

  it('a prisma failure after validation is a 500 carrying the error message', async () => {
    create.mockRejectedValueOnce(new Error('db down'));
    const res = await POST(postJson({ email: FRESH, token: generateToken(FRESH) }));
    expect(res.status).toBe(500);
    expect(await res.json()).toStrictEqual({ error: 'db down' });
  });

  it('token validation still guards the write path: bad token is 403 with no DB call', async () => {
    const res = await POST(postJson({ email: FRESH, token: 'deadbeef' }));
    expect(res.status).toBe(403);
    expect(await res.json()).toStrictEqual({ error: 'Invalid unsubscribe token' });
    expect(calls).toStrictEqual([]);
  });

  it('missing token after the unsigned cutoff is 403 with no DB call', async () => {
    const res = await POST(postJson({ email: FRESH }));
    expect(res.status).toBe(403);
    expect(await res.json()).toStrictEqual({ error: 'Unsubscribe token required' });
    expect(calls).toStrictEqual([]);
  });

  it('cross-origin JSON is 403 before anything else runs', async () => {
    const req = new NextRequest(`${APP_URL}/api/unsubscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
      body: JSON.stringify({ email: FRESH, token: generateToken(FRESH) }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(await res.json()).toStrictEqual({ error: 'Forbidden: cross-origin request' });
    expect(calls).toStrictEqual([]);
  });

  it.each(['https://yardflow.ai', 'https://www.yardflow.ai'])('ops closeout 4: the branded page at %s (proxied to this app) is same-site', async (origin) => {
    const req = new NextRequest(`${APP_URL}/api/unsubscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({ email: FRESH, token: generateToken(FRESH) }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it.each(['https://yardflow.ai.evil.example', 'https://evilyardflow.ai', 'http://yardflow.ai'])('ops closeout 4: a look-alike origin %s is still cross-origin', async (origin) => {
    const req = new NextRequest(`${APP_URL}/api/unsubscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({ email: FRESH, token: generateToken(FRESH) }),
    });
    expect((await POST(req)).status).toBe(403);
  });
});

describe('recordUnsubscribe helper', () => {
  it('source gap_disposition produces the identical call sequence to the route', async () => {
    const result = await recordUnsubscribe(prismaMock, {
      email: FRESH,
      source: 'gap_disposition',
      emailLogId: 42,
      reason: 'no longer relevant',
      dispositionId: 'disp_1',
      actor: 'casey',
      now: new Date('2026-09-23T12:00:00Z'),
    });
    expect(calls).toStrictEqual(ROUTE_FRESH_SEQUENCE);
    expect(result).toStrictEqual({ ok: true, created: true, personaUpdated: 1, hubspot: 'written', gapDrafts: NO_DRAFTS });
  });

  it('second call for the same email: created false, no new row, zero HubSpot calls; the DNC mirror is re-applied (Release B review #5)', async () => {
    findUnique.mockResolvedValueOnce({ id: 'ue_0', email: FRESH });
    const result = await recordUnsubscribe(prismaMock, { email: FRESH, source: 'gap_disposition' });
    expect(calls).toStrictEqual(ROUTE_ALREADY_SEQUENCE);
    expect(create).not.toHaveBeenCalled();
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(upsertContact).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ ok: true, created: false, personaUpdated: 1, hubspot: 'skipped:already_unsubscribed', gapDrafts: NO_DRAFTS });
  });

  it('HubSpot throwing: rows still written, result carries failed:<message>, nothing thrown', async () => {
    upsertContact.mockRejectedValueOnce(new Error('hubspot down'));
    const result = await recordUnsubscribe(prismaMock, { email: FRESH, source: 'manual' });
    expect(create).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: { email: { equals: FRESH, mode: 'insensitive' } },
      data: { do_not_contact: true },
    });
    expect(result).toStrictEqual({ ok: true, created: true, personaUpdated: 1, hubspot: 'failed:hubspot down', gapDrafts: NO_DRAFTS });
  });

  it('persona lookup throwing is also fail-open (the route wraps the findFirst in the same try)', async () => {
    findFirst.mockRejectedValueOnce(new Error('persona read failed'));
    const result = await recordUnsubscribe(prismaMock, { email: FRESH, source: 'manual' });
    expect(result.hubspot).toBe('failed:persona read failed');
    expect(result.created).toBe(true);
    expect(upsertContact).not.toHaveBeenCalled();
  });

  it('persona without a HubSpot id: skipped:no_hubspot_contact_id and no upsert', async () => {
    findFirst.mockResolvedValueOnce({ id: 7, hubspot_contact_id: null });
    const result = await recordUnsubscribe(prismaMock, { email: FRESH, source: 'gap_disposition' });
    expect(result.hubspot).toBe('skipped:no_hubspot_contact_id');
    expect(upsertContact).not.toHaveBeenCalled();
  });

  it('upsertContact returning null (HubSpot not configured or sync off) reads as skipped:not_configured', async () => {
    upsertContact.mockResolvedValueOnce(null);
    const result = await recordUnsubscribe(prismaMock, { email: FRESH, source: 'gap_disposition' });
    expect(result.hubspot).toBe('skipped:not_configured');
  });

  it('hubspot.enabled false: rows written, no persona lookup, no upsert, skipped:disabled', async () => {
    const result = await recordUnsubscribe(prismaMock, { email: FRESH, source: 'gap_disposition', hubspot: { enabled: false } });
    expect(calls.map((c) => c[0])).toStrictEqual(['unsubscribedEmail.findUnique', 'unsubscribedEmail.create', 'persona.updateMany', 'gap.invalidateDrafts']);
    expect(result.hubspot).toBe('skipped:disabled');
  });

  it('an injected HubSpot client is used instead of the module default', async () => {
    const injected = vi.fn(async () => 'hs_999');
    const result = await recordUnsubscribe(prismaMock, {
      email: FRESH,
      source: 'gap_disposition',
      hubspot: { enabled: true, client: { upsertContact: injected } },
    });
    expect(injected).toHaveBeenCalledWith({ email: FRESH, hs_email_optout: 'true' });
    expect(upsertContact).not.toHaveBeenCalled();
    expect(result.hubspot).toBe('written');
  });

  it('personaUpdated reports the updateMany count', async () => {
    updateMany.mockResolvedValueOnce({ count: 3 });
    const result = await recordUnsubscribe(prismaMock, { email: FRESH, source: 'gap_disposition' });
    expect(result.personaUpdated).toBe(3);
  });

  it('lowercases and trims the email before every read and write', async () => {
    await recordUnsubscribe(prismaMock, { email: '  Fresh@Example.COM ', source: 'gap_disposition' });
    expect(calls).toStrictEqual([
      ['unsubscribedEmail.findUnique', { where: { email: FRESH } }],
      ['unsubscribedEmail.create', { data: { email: FRESH, email_log_id: undefined, reason: undefined } }],
      ['persona.updateMany', { where: { email: { equals: FRESH, mode: 'insensitive' } }, data: { do_not_contact: true } }],
      ['persona.findFirst', { where: { email: { equals: FRESH, mode: 'insensitive' } } }],
      ['hubspot.upsertContact', { email: FRESH, hs_email_optout: 'true' }],
      ['gap.invalidateDrafts', FRESH],
    ]);
  });

  it('a prisma failure on the consent rows propagates (only HubSpot is fail-open)', async () => {
    create.mockRejectedValueOnce(new Error('db down'));
    await expect(recordUnsubscribe(prismaMock, { email: FRESH, source: 'gap_disposition' })).rejects.toThrow('db down');
    expect(upsertContact).not.toHaveBeenCalled();
    expect(invalidateGapDraftsFor).not.toHaveBeenCalled();
  });

  it('ops closeout: GAP draft cleanup throwing never fails the unsubscribe: consent written, result carries failed:<message>', async () => {
    invalidateGapDraftsFor.mockRejectedValueOnce(new Error('gmail down'));
    const result = await recordUnsubscribe(prismaMock, { email: FRESH, source: 'unsubscribe_link' });
    expect(create).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ ok: true, created: true, gapDrafts: 'failed:gmail down' });
  });

  it('ops closeout: gapDrafts.enabled false skips the cleanup', async () => {
    const result = await recordUnsubscribe(prismaMock, { email: FRESH, source: 'manual', gapDrafts: { enabled: false } });
    expect(invalidateGapDraftsFor).not.toHaveBeenCalled();
    expect(result.gapDrafts).toBe('skipped:disabled');
  });
});

/**
 * Structural invariant. Heuristic, documented:
 *  - block comments and line comments are stripped first (a `//` preceded by
 *    `:` is left alone so URLs inside strings survive);
 *  - a "write" is `do_not_contact:` appearing inside the balanced braces of a
 *    `data: {` object (that is where prisma create / update / updateMany /
 *    upsert take their values), or a SQL-style `do_not_contact =` assignment
 *    (single `=`, so `===` comparisons do not match);
 *  - `select:` and `where:` blocks are therefore excluded by construction:
 *    they are not `data:` objects.
 * The helper itself is run through the same detector as a positive control so
 * a detector that silently stops matching cannot pass the suite.
 */
const SCAN_ROOTS = ['src/lib/gap', 'src/app/api/gap'];
const WRITER = 'src/lib/email/unsubscribe.ts';

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
}

function dataBlocks(src: string): string[] {
  const blocks: string[] = [];
  const re = /\bdata\s*:\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    let depth = 0;
    let i = m.index + m[0].length - 1;
    const start = i;
    for (; i < src.length; i += 1) {
      if (src[i] === '{') depth += 1;
      else if (src[i] === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    blocks.push(src.slice(start, i + 1));
  }
  return blocks;
}

function writesDoNotContact(source: string): boolean {
  const stripped = stripComments(source);
  if (dataBlocks(stripped).some((b) => /\bdo_not_contact\s*:/.test(b))) return true;
  return /\bdo_not_contact\s*(?<![=!<>])=(?!=)/.test(stripped);
}

describe('structural invariant: the helper is the only GAP writer of Persona.do_not_contact', () => {
  const root = process.cwd();

  it('positive control: the detector flags the helper in src/lib/email', () => {
    expect(writesDoNotContact(readFileSync(path.join(root, WRITER), 'utf8'))).toBe(true);
  });

  it('no file under src/lib/gap or src/app/api/gap writes do_not_contact', () => {
    const files = SCAN_ROOTS.flatMap((r) => walk(path.join(root, r)));
    expect(files.length).toBeGreaterThan(20);
    const offenders = files
      .filter((f) => writesDoNotContact(readFileSync(f, 'utf8')))
      .map((f) => path.relative(root, f).replace(/\\/g, '/'));
    expect(offenders, `files writing do_not_contact outside ${WRITER}: ${offenders.join(', ')}`).toStrictEqual([]);
  });
});
