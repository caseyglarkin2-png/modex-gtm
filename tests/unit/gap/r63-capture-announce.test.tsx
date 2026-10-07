/**
 * R63-B S4: every live region was empty after "Saved for ...", "This reply already has its capture ...: one per reply."
 * and "Recorded: Do not contact them again." Capture now keeps one polite live region mounted for the whole flow (the
 * form and the review) and says every save, refusal and record in it.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const recordBid = vi.fn();
const recordDisposition = vi.fn();
const loadReplyForCapture = vi.fn();
vi.mock('@/lib/gap/bid/service', () => ({ recordBid: (...a: unknown[]) => recordBid(...a) }));
vi.mock('@/lib/gap/disposition/service', () => ({ recordDisposition: (...a: unknown[]) => recordDisposition(...a) }));
vi.mock('@/lib/gap/replies/list', () => ({ loadReplyForCapture: (...a: unknown[]) => loadReplyForCapture(...a) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }), useSearchParams: () => new URLSearchParams('') }));

import { createCapture, decideBatch } from '@/lib/gap/capture/store';
import { CaptureFlow } from '@/components/gap/capture-flow';

const NOW = new Date('2026-10-07T15:00:00.000Z');
const ACCOUNT = 'Walmart Scratch Co r63';

function db() {
  const audit: Array<Record<string, unknown>> = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma: any = {
    gapAuditEvent: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        audit.push({ ...data, created_at: new Date(NOW.getTime() + audit.length) });
        return { id: `a${audit.length}` };
      }),
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => audit.filter((r) => r.subject_type === where.subject_type && (where.subject_id ? r.subject_id === where.subject_id : true) && (where.kind ? r.kind === where.kind : true))),
    },
    account: { findUnique: vi.fn(async ({ where }: { where: { name: string } }) => (where.name === ACCOUNT ? { name: where.name } : null)) },
    persona: {
      findUnique: vi.fn(async ({ where }: { where: { id: number } }) => (where.id === 5 ? { id: 5, account_name: ACCOUNT, email: 'doug@walmart-scratch-co-r63.example.com', name: 'Doug Scratch' } : null)),
      findFirst: vi.fn(async () => null),
    },
    prospectingHypothesis: { findUnique: vi.fn(async ({ where }: { where: { id: string } }) => (where.id === 'h-wm' ? { id: 'h-wm', account_name: ACCOUNT } : null)) },
  };
  return prisma;
}
const open = async (prisma: unknown) => {
  const r = await createCapture(prisma, { accountName: ACCOUNT, personaId: 5, source: { kind: 'reply', id: 'gm-stop' }, context: 'email', rawText: 'stop', actor: 'casey@freightroll.com', now: NOW });
  if (!r.ok) throw new Error(r.reason);
  return r.capture;
};
const live = () => screen.getByTestId('capture-live');

beforeEach(() => {
  recordBid.mockReset();
  recordDisposition.mockReset();
  recordDisposition.mockResolvedValue({ ok: true, dispositionId: 'disp-1', bidIds: [], humanConfirmed: true, effects: 'none', refusals: [] });
  loadReplyForCapture.mockReset();
  loadReplyForCapture.mockResolvedValue({ item: { id: 'gm-stop', source: { kind: 'inbound_message', id: 'gm-stop' }, contactEmail: 'doug@walmart-scratch-co-r63.example.com', personaId: 5, accountName: ACCOUNT, hypothesisId: 'h-wm', hypothesisTitle: 'Texas DC', subject: 'Re: trailer turns at your sites', snippet: 'stop', receivedAt: '2026-10-05T14:00:00.000Z', enrollmentId: null, enrollmentStatus: null, suggestion: null, fromName: 'Doug Scratch' }, text: 'stop', dispositionId: null });
});
afterEach(() => vi.unstubAllGlobals());

describe('R63-B S4: Capture says every save, refusal and record in one polite live region', () => {
  it('a save is said in the region that was already on the page (the same node from the form to the review)', async () => {
    const c = await open(db());
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(c), { status: 201 })));
    render(<CaptureFlow initialAccount={ACCOUNT} initialContext="email" initialText="stop" source={{ kind: 'reply', id: 'gm-stop' }} />);
    const region = live();
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('role', 'status');
    expect(region.textContent).toBe('');
    fireEvent.click(screen.getByTestId('capture-save'));
    await waitFor(() => expect(live().textContent).toBe(`Saved for ${ACCOUNT}. The note is kept exactly as you wrote it.`));
    expect(live()).toBe(region);
  });

  it('the second save on a reply says the one capture; a refusal is said too', async () => {
    const c = await open(db());
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ...c, existing: true }), { status: 200 })));
    const { unmount } = render(<CaptureFlow initialAccount={ACCOUNT} initialContext="email" initialText="stop" source={{ kind: 'reply', id: 'gm-stop' }} />);
    fireEvent.click(screen.getByTestId('capture-save'));
    await waitFor(() => expect(live().textContent).toBe(`This reply already has its capture for ${ACCOUNT}: one per reply. Its review is below.`));
    unmount();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'account_not_found' }), { status: 404 })));
    render(<CaptureFlow initialAccount={ACCOUNT} initialContext="email" initialText="stop" />);
    fireEvent.click(screen.getByTestId('capture-save'));
    await waitFor(() => expect(live().textContent).toBe('Not saved: account_not_found'));
  });

  it('recording what the reply means is said: "Recorded: Do not contact them again."', async () => {
    const prisma = db();
    const c = await open(prisma);
    const after = await decideBatch(prisma, { captureId: c.id, items: [{ candidateId: 'reply', decision: 'confirm', responseClass: 'do_not_contact' }], actor: 'casey@freightroll.com', now: NOW });
    if (!after.ok) throw new Error('batch');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ results: [{ candidateId: 'reply', ok: true }], capture: after.capture }), { status: 200 })));
    render(<CaptureFlow initial={c} initialAccount={ACCOUNT} />);
    const item = screen.getByTestId('capture-reply-kind');
    fireEvent.change(within(item).getByTestId('capture-reply-class'), { target: { value: 'do_not_contact' } });
    fireEvent.click(screen.getByTestId('capture-batch-submit'));
    await waitFor(() => expect(live().textContent).toBe('Recorded: Do not contact them again. The reply is answered on the account.'));
  });
});
