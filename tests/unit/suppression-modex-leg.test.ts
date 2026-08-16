/**
 * modex's do-not-contact leg: the store that 242 decisions were recorded in and
 * that nothing on any send path could read.
 *
 * THE PROPERTY THAT MATTERS MOST HERE is not "it finds suppressed people". It
 * is that a FAILURE never renders as an empty suppression list. An empty list
 * means "we checked, nobody is suppressed"; a 503 means "we could not check".
 * A caller cannot distinguish those if the store answers 200 with `[]` on
 * error, and treating an unreadable authority as a clear one is the exact
 * defect this whole contract exists to close. So the error test below is the
 * load-bearing one, not the happy path.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedFindMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: { persona: { findMany: (...a: unknown[]) => mockedFindMany(...a) } },
}));

import { findSuppressedPersonas } from '@/lib/suppression/modex-leg';
import { POST } from '@/app/api/suppression/personas/route';

const TOKEN = 'test-pounce-token';

function post(body: unknown, token: string | null = TOKEN) {
  return new NextRequest('http://localhost/api/suppression/personas', {
    method: 'POST',
    headers: token ? { 'x-pounce-token': token, 'content-type': 'application/json' } : {},
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockedFindMany.mockReset();
  process.env.POUNCE_INGEST_TOKEN = TOKEN;
});

describe('findSuppressedPersonas', () => {
  it('S1: blocks the EXACT address a decision was recorded against', async () => {
    // seannewtz@dswinc.com is do_not_contact in modex AND appears in clawd's
    // outreach_sends at that exact address. Not an alias miss: a straight
    // override of a recorded decision.
    mockedFindMany.mockResolvedValue([{ email: 'seannewtz@dswinc.com' }]);
    const r = await findSuppressedPersonas(['seannewtz@dswinc.com']);
    expect(r.suppressed).toEqual(['seannewtz@dswinc.com']);
  });

  it('S2: blocks a SIBLING address via the coarse key', async () => {
    // modex holds john.drake@; clawd mailed john_d_drake@. Exact matching
    // cannot catch this, which is why both sides are keyed rather than compared.
    mockedFindMany.mockResolvedValue([{ email: 'john.drake@homedepot.com' }]);
    const r = await findSuppressedPersonas(['john_d_drake@homedepot.com']);
    expect(r.suppressed).toEqual(['john_d_drake@homedepot.com']);
  });

  it('S3: does NOT block a different human sharing one token', async () => {
    mockedFindMany.mockResolvedValue([{ email: 'brian.watson@pepsico.com' }]);
    const r = await findSuppressedPersonas(['brian.guinn@pepsico.com']);
    expect(r.suppressed).toEqual([]);
  });

  it('returns the CALLER\'s original strings, not our normalized ones', async () => {
    // The caller has to match these back to its own recipient records. Handing
    // back a normalized address would silently fail that join, and the send
    // would proceed because nothing appeared to match.
    mockedFindMany.mockResolvedValue([{ email: 'john.drake@homedepot.com' }]);
    const r = await findSuppressedPersonas(['  John_D_Drake@HomeDepot.com  ']);
    expect(r.suppressed).toEqual(['  John_D_Drake@HomeDepot.com  ']);
  });

  it('reports unkeyable input instead of treating it as clear', async () => {
    mockedFindMany.mockResolvedValue([]);
    const r = await findSuppressedPersonas(['not-an-email', 'ok.person@heb.com']);
    expect(r.unkeyable).toEqual(['not-an-email']);
    expect(r.keyed).toBe(1);
  });

  it('only ever queries personas already marked do_not_contact', async () => {
    // A leg that read every persona and filtered in JS would be one refactor
    // away from returning the whole table as suppressed.
    mockedFindMany.mockResolvedValue([]);
    await findSuppressedPersonas(['a.person@heb.com']);
    expect(mockedFindMany.mock.calls[0][0].where.do_not_contact).toBe(true);
  });

  it('PROPAGATES a store failure rather than reporting nobody suppressed', async () => {
    mockedFindMany.mockRejectedValue(new Error('connection refused'));
    await expect(findSuppressedPersonas(['x@heb.com'])).rejects.toThrow('connection refused');
  });
});

describe('POST /api/suppression/personas', () => {
  it('answers 503, NOT 200-with-empty, when the store is unreadable', async () => {
    // S4. The single most important assertion in this file. If this ever
    // becomes a 200, every caller silently converts an outage into consent.
    mockedFindMany.mockRejectedValue(new Error('connection refused'));
    const res = await POST(post({ emails: ['x@heb.com'] }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.suppressed).toBeUndefined();
  });

  it('distinguishes a genuine CLEAR from a failure by status code alone', async () => {
    // The two shapes a caller must tell apart, asserted side by side so a
    // future edit that collapses them fails here.
    mockedFindMany.mockResolvedValue([]);
    const ok = await POST(post({ emails: ['clear@heb.com'] }));
    expect(ok.status).toBe(200);
    expect((await ok.json()).suppressed).toEqual([]);

    mockedFindMany.mockRejectedValue(new Error('down'));
    const bad = await POST(post({ emails: ['clear@heb.com'] }));
    expect(bad.status).toBe(503);
  });

  it('refuses an absent token: absent config is not permission', async () => {
    delete process.env.POUNCE_INGEST_TOKEN;
    const res = await POST(post({ emails: ['x@heb.com'] }, 'anything'));
    expect(res.status).toBe(401);
  });

  it('refuses a wrong token', async () => {
    const res = await POST(post({ emails: ['x@heb.com'] }, 'wrong'));
    expect(res.status).toBe(401);
  });

  it('rejects a batch larger than clawd will accept', async () => {
    // Matched to clawd's own 500 limit. If the two disagreed, a caller that
    // chunked for one would get a 400 on the tail chunk from the other, and a
    // 400 is UNKNOWN, which halts a send for a purely cosmetic reason.
    const res = await POST(post({ emails: new Array(501).fill('a@b.com') }));
    expect(res.status).toBe(400);
  });

  it('rejects a malformed body rather than treating it as an empty check', async () => {
    expect((await POST(post({ emails: 'nope' }))).status).toBe(400);
    expect((await POST(post({}))).status).toBe(400);
  });
});
