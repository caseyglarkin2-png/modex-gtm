/**
 * R63-B N11: Capture opened with a reply id GAP does not hold (`from=reply:no-such-message`) still said "Opened from a
 * reply". It now opens a plain note and says the reply is not on file; a real reply still opens as that reply.
 */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadReplyForCapture = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    account: { findUnique: vi.fn(async ({ where }: { where: { name: string } }) => (where.name === 'Walmart Scratch Co r63' ? { name: where.name } : null)) },
    persona: { findUnique: vi.fn(async () => ({ id: 5, name: 'Doug Scratch', account_name: 'Walmart Scratch Co r63' })) },
  },
}));
vi.mock('@/lib/gap/capture/store', async (orig) => ({ ...(await orig<typeof import('@/lib/gap/capture/store')>()), listRecentCaptures: vi.fn(async () => []) }));
vi.mock('@/lib/gap/replies/list', () => ({ loadReplyForCapture: (...a: unknown[]) => loadReplyForCapture(...a) }));
vi.mock('next/navigation', () => ({ notFound: vi.fn(), redirect: vi.fn(), useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }), useSearchParams: () => new URLSearchParams(''), usePathname: () => '/gap/capture/' }));

import CapturePage from '@/app/gap/capture/page';

beforeEach(() => {
  process.env.GAP_OS_ENABLED = 'true';
  process.env.GAP_HYPOTHESIS_ENABLED = 'true';
  loadReplyForCapture.mockReset();
});

const page = async (from: string) => render(await CapturePage({ searchParams: Promise.resolve({ account: 'Walmart Scratch Co r63', person: '5', context: 'email', from }) }));

describe('R63-B N11: a capture link to a reply GAP does not hold', () => {
  it('opens a plain note, says the reply is not on file, and never says "Opened from a reply"', async () => {
    loadReplyForCapture.mockResolvedValue(null);
    await page('reply:no-such-message');
    expect(screen.getByTestId('capture-reply-missing')).toHaveTextContent('The reply this link names is not on file for Walmart Scratch Co r63. This note is not tied to a reply.');
    expect(screen.queryByTestId('capture-source')).toBeNull();
    expect(document.body.textContent).not.toMatch(/Opened from a reply/);
  });

  it('a real reply still opens as that reply', async () => {
    loadReplyForCapture.mockResolvedValue({ item: { id: 'gm-stop', accountName: 'Walmart Scratch Co r63', personaId: 5 }, text: 'stop', dispositionId: null });
    await page('reply:gm-stop');
    expect(screen.queryByTestId('capture-reply-missing')).toBeNull();
    expect(screen.getByTestId('capture-source')).toHaveTextContent('Opened from');
  });
});
