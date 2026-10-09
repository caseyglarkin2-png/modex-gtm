// @vitest-environment node
/**
 * listDraftsTo (C25, pass 2 of the commercial-context audit, 2026-10-09): the seller's own hand-written Gmail drafts
 * to one recipient, read-only, in the OutboundMail shape loadThreadContext.listDrafts expects, newest 25, so a
 * promotion never writes a second draft beside one Casey already wrote. The Gmail client is stubbed; no live call.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listDraftsTo } from '@/lib/email/gmail-inbox';

const originalEnv = { ...process.env };
const SENDER = { refreshToken: 'rt', userEmail: 'casey@yardflow.ai' };
const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64url');

beforeEach(() => {
  process.env = { ...originalEnv, GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret', GOOGLE_REFRESH_TOKEN: 'rt' };
  delete process.env.GAP_SEND_TRANSPORT;
});
afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

function stub(drafts: Array<{ id: string; message: Record<string, unknown> }>, listOk = true) {
  const calls: string[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    calls.push(url);
    if (url.includes('oauth2.googleapis.com/token')) return { ok: true, json: async () => ({ access_token: 'tok' }) } as Response;
    if (/\/drafts\?/.test(url)) return { ok: listOk, status: listOk ? 200 : 500, json: async () => ({ drafts: drafts.map((d) => ({ id: d.id, message: { id: (d.message as { id: string }).id } })) }), text: async () => '' } as Response;
    const m = url.match(/\/drafts\/([^?]+)\?/);
    const d = m ? drafts.find((x) => x.id === decodeURIComponent(m[1])) : undefined;
    if (!d) return { ok: false, status: 404, json: async () => ({}), text: async () => 'no' } as Response;
    return { ok: true, status: 200, json: async () => ({ id: d.id, message: d.message }), text: async () => '' } as Response;
  });
  return calls;
}

const draft = (id: string, to: string, subject: string, text: string, extra: Record<string, unknown> = {}) => ({
  id,
  message: { id: `m-${id}`, threadId: `t-${id}`, internalDate: '1759924800000', labelIds: ['DRAFT'], payload: { mimeType: 'text/plain', headers: [{ name: 'To', value: to }, { name: 'Subject', value: subject }, { name: 'Message-ID', value: `<${id}@mail.gmail.com>` }], body: { data: b64(text) } }, ...extra },
});

describe('listDraftsTo', () => {
  it('lists the drafts addressed to the recipient only, as OutboundMail with isDraft true, the Message-ID and the text; asks Gmail for the newest 25 to that address', async () => {
    const calls = stub([draft('d1', 'Dave Kiesling <dave.kiesling@kencogroup.com>', 'Re: YardFlow and the 2027 roadmap', 'Dave, ahead of budgeting: three numbers.'), draft('d2', 'someone@else.example', 'Other', 'x'), draft('d3', 'dave.kiesling@kencogroup.com, cc@kencogroup.com', 'Second', 'Another')]);
    const out = await listDraftsTo(SENDER, 'Dave.Kiesling@kencogroup.com');
    expect(out.map((d) => d.id)).toEqual(['m-d1', 'm-d3']);
    expect(out[0]).toEqual({ id: 'm-d1', draftId: 'd1', threadId: 't-d1', internalDate: new Date(1759924800000), to: 'Dave Kiesling <dave.kiesling@kencogroup.com>', subject: 'Re: YardFlow and the 2027 roadmap', text: 'Dave, ahead of budgeting: three numbers.', isDraft: true, rfcMessageId: '<d1@mail.gmail.com>' });
    const list = calls.find((u) => /\/drafts\?/.test(u))!;
    expect(list).toContain('/users/casey%40yardflow.ai/drafts?');
    expect(decodeURIComponent(list)).toContain('q=to:dave.kiesling@kencogroup.com');
    expect(list).toContain('maxResults=25');
    expect(calls.every((u) => !/\b(send|modify|trash|delete)\b/.test(u))).toBe(true);
  });

  it('a Gmail list failure throws; nothing is read under the transport sink', async () => {
    stub([], false);
    await expect(listDraftsTo(SENDER, 'dave.kiesling@kencogroup.com')).rejects.toThrow('Gmail drafts list failed (500)');
    const calls = stub([draft('d1', 'dave.kiesling@kencogroup.com', 'x', 'y')]);
    process.env.GAP_SEND_TRANSPORT = 'sink';
    process.env.GAP_SINK_DIR = 'C:/tmp/gap-sink-test';
    expect(await listDraftsTo(SENDER, 'dave.kiesling@kencogroup.com')).toEqual([]);
    expect(calls).toEqual([]);
  });
});
