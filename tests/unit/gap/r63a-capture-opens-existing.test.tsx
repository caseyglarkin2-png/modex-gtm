/**
 * R63-A S3: the second "Log what they said" on a reply showed a fresh form and said "already has its capture" only after
 * Save. Capture opened on a reply that has its capture now opens that capture at once, saying so, with its review.
 */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadReplyForCapture = vi.fn();
const loadReplyCapture = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    account: { findUnique: vi.fn(async ({ where }: { where: { name: string } }) => (where.name === 'Nfi Scratch Co r63' ? { name: where.name } : null)) },
    persona: { findUnique: vi.fn(async () => ({ id: 1, name: 'Person1 Scratch', account_name: 'Nfi Scratch Co r63' })) },
  },
}));
vi.mock('@/lib/gap/capture/store', async (orig) => ({ ...(await orig<typeof import('@/lib/gap/capture/store')>()), listRecentCaptures: vi.fn(async () => []), loadReplyCapture: (...a: unknown[]) => loadReplyCapture(...a) }));
vi.mock('@/lib/gap/replies/list', () => ({ loadReplyForCapture: (...a: unknown[]) => loadReplyForCapture(...a) }));
vi.mock('next/navigation', () => ({ notFound: vi.fn(), redirect: vi.fn(), useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }), useSearchParams: () => new URLSearchParams(''), usePathname: () => '/gap/capture/' }));

import CapturePage from '@/app/gap/capture/page';

const ACCOUNT = 'Nfi Scratch Co r63';
const view = { id: 'cap-1', accountName: ACCOUNT, accountHint: null, personaId: 1, context: 'email', rawText: 'Can you send the case study by Friday?', candidates: [], commitments: [], excluded: [], reply: null, source: { kind: 'reply', id: 'm1' }, dealId: null, dealName: null, capturedAt: '2026-10-07T20:00:00.000Z', createdBy: 'casey@freightroll.com', meetingOutcome: null };

beforeEach(() => {
  process.env.GAP_OS_ENABLED = 'true';
  process.env.GAP_HYPOTHESIS_ENABLED = 'true';
  loadReplyForCapture.mockReset();
  loadReplyCapture.mockReset();
  loadReplyForCapture.mockResolvedValue({ item: { id: 'm1', accountName: ACCOUNT, personaId: 1 }, text: 'Can you send the case study by Friday?', dispositionId: null });
});

describe('R63-A S3: a reply that has its capture opens it at once', () => {
  it('the existing capture and its review, said at once; no fresh form', async () => {
    loadReplyCapture.mockResolvedValue(view);
    render(await CapturePage({ searchParams: Promise.resolve({ account: ACCOUNT, person: '1', context: 'email', from: 'reply:m1' }) }));
    expect(loadReplyCapture).toHaveBeenCalledWith(expect.anything(), 'm1');
    expect(screen.getByTestId('capture-existing')).toHaveTextContent(`This reply already has its capture for ${ACCOUNT}: one per reply. Its review is below.`);
    expect(screen.queryByTestId('capture-form')).toBeNull();
    expect(screen.queryByTestId('capture-save')).toBeNull();
  });

  it('a reply with no capture yet opens the form as before', async () => {
    loadReplyCapture.mockResolvedValue(null);
    render(await CapturePage({ searchParams: Promise.resolve({ account: ACCOUNT, person: '1', context: 'email', from: 'reply:m1' }) }));
    expect(screen.getByTestId('capture-form')).toBeTruthy();
    expect(screen.queryByTestId('capture-existing')).toBeNull();
  });
});
