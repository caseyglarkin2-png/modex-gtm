/**
 * Stabilization E: the dogfood note. One required field; safe context only (never cookies, headers, tokens or page
 * text); append-only storage; a note never changes seller state; the debug packet is Claude-ready.
 */
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/gap/accounts/pepsico', useSearchParams: () => new URLSearchParams('lane=research&open=card-7&token=abc'), useRouter: () => ({ refresh: vi.fn() }) }));
import { createNote, debugPacket, listFeedback, safeRoute, sanitizeContext, setFeedbackStatus } from '@/lib/gap/feedback/feedback';
import { FeedbackButton, ReportThis, contextFromLocation } from '@/components/gap/feedback-button';

const NOW = new Date('2026-10-01T22:00:00Z');

function db() {
  const rows: Array<Record<string, unknown>> = [];
  const prisma = {
    gapAuditEvent: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => { rows.push({ id: `a${rows.length}`, ...data }); return rows[rows.length - 1]; }),
      findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) => rows.find((r) => r.kind === where.kind && r.subject_id === where.subject_id) ?? null),
      findMany: vi.fn(async ({ where }: { where: { kind: string; subject_id?: { in: string[] } } }) =>
        rows.filter((r) => r.kind === where.kind && (!where.subject_id || where.subject_id.in.includes(String(r.subject_id)))).sort((a, b) => +new Date(String(b.created_at)) - +new Date(String(a.created_at)))),
    },
  };
  return { prisma, rows };
}

describe('safe context only', () => {
  it('unknown keys, cookies, headers and secrets never survive; query secrets are stripped from routes', () => {
    const c = sanitizeContext({ route: '/gap/accounts/pepsico?lane=research&token=abc&code=xyz', cookie: 'session=1', headers: { authorization: 'Bearer x' }, pageText: 'buyer said...', accountName: 'PepsiCo', viewport: { w: 390, h: 844 }, device: 'phone', errorCode: 'suppression_unreadable', sourceUrl: 'https://news.example/a?utm=1&auth=2' });
    expect(c).toEqual({ route: '/gap/accounts/pepsico?lane=research', accountName: 'PepsiCo', viewport: { w: 390, h: 844 }, device: 'phone', errorCode: 'suppression_unreadable', sourceUrl: 'https://news.example/a' });
    expect(JSON.stringify(c)).not.toMatch(/Bearer|session=|buyer said|token|xyz/);
    expect(safeRoute('/gap?session=1&lane=ready')).toBe('/gap?lane=ready');
  });
  it('the URL context names the surface, lane, card and account, never page text', () => {
    expect(contextFromLocation('/gap/accounts/pepsico', new URLSearchParams('lane=research&open=card-7'))).toEqual({ route: '/gap/accounts/pepsico?lane=research&open=card-7', surface: 'accounts', lane: 'research', cardId: 'card-7', accountSlug: 'pepsico' });
  });
});

describe('notes are append-only dogfood memory', () => {
  it('only the note is required; a status is a new row; the newest status wins; nothing else is written', async () => {
    const { prisma, rows } = db();
    expect(await createNote(prisma as never, { note: '   ', actor: 'c', now: NOW })).toEqual({ ok: false, reason: 'note_required' });
    const n = await createNote(prisma as never, { note: 'Suppression timed out on the GM card', context: { errorCode: 'suppression_unreadable', route: '/gap?lane=ready' }, actor: 'casey@freightroll.com', now: NOW, build: 'abc12345' });
    expect(n.ok).toBe(true);
    const id = (n as { id: string }).id;
    await setFeedbackStatus(prisma as never, { id, status: 'later', actor: 'c', now: new Date(NOW.getTime() + 1000) });
    await setFeedbackStatus(prisma as never, { id, status: 'fixed', actor: 'c', now: new Date(NOW.getTime() + 2000) });
    const [f] = await listFeedback(prisma as never);
    expect(f).toMatchObject({ id, note: 'Suppression timed out on the GM card', type: null, status: 'fixed', build: 'abc12345' });
    expect(rows.every((r) => r.subject_type === 'feedback')).toBe(true);
    expect(Object.keys(prisma)).toEqual(['gapAuditEvent']);
    expect(await setFeedbackStatus(prisma as never, { id: 'nope', status: 'fixed', actor: 'c', now: NOW })).toEqual({ ok: false, reason: 'not_found' });
  });
  it('the debug packet says what, where, which object, which build, which route, which error and when', async () => {
    const { prisma } = db();
    await createNote(prisma as never, { note: 'Copy button refused', type: 'bug', context: { surface: 'governed-copy', accountName: 'General Mills', cardId: 'cmu1', errorCode: 'thesis_needs_review', route: '/gap?lane=ready', device: 'phone', viewport: { w: 390, h: 844 } }, actor: 'c', now: NOW, build: 'deadbeef' });
    const p = debugPacket((await listFeedback(prisma as never))[0]);
    expect(p).toContain('WHAT CASEY SAID: Copy button refused');
    expect(p).toContain('ACCOUNT / OBJECT: account General Mills, card cmu1');
    expect(p).toContain('BUILD SHA: deadbeef');
    expect(p).toContain('ERROR CODE: thesis_needs_review');
    expect(p).toContain('ROUTE: /gap?lane=ready');
    expect(p).toContain('TIME: 2026-10-01T22:00:00.000Z');
  });
});

describe('the NOTE button', () => {
  it('one field saves with safe context; REPORT THIS prefills the error code', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, id: 'x' }), { status: 200 }));
    render(
      <>
        <FeedbackButton />
        <ReportThis errorCode="suppression_unreadable" surface="seller-draft" />
      </>,
    );
    fireEvent.click(screen.getByTestId('report-this'));
    expect(screen.getByTestId('feedback-error-code')).toHaveTextContent('suppression_unreadable');
    expect(screen.getByTestId('feedback-save')).toBeDisabled();
    fireEvent.change(screen.getByTestId('feedback-note'), { target: { value: 'Timed out again' } });
    await act(async () => fireEvent.click(screen.getByTestId('feedback-save')));
    await waitFor(() => expect(screen.getByTestId('feedback-status')).toHaveTextContent('Saved to GAP notes.'));
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/gap/feedback');
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ note: 'Timed out again', type: null, context: { errorCode: 'suppression_unreadable', surface: 'seller-draft', accountSlug: 'pepsico', lane: 'research', cardId: 'card-7' } });
    // The token in the address bar is never sent as a field of its own; the server strips it from the route.
    expect(Object.keys(body.context)).not.toContain('token');
    expect(body.context.route).toBe('/gap/accounts/pepsico?lane=research&open=card-7');
    f.mockRestore();
  });
});
