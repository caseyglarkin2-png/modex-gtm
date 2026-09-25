// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }), usePathname: () => '/gap' }));

import { SendFromYardflow } from '@/components/gap/send-from-yardflow';
import { GapCockpit } from '@/components/gap/gap-cockpit';

const HASH = 'b'.repeat(64);
const PREVIEW = { crmLogging: 'on', fromName: 'Casey Larkin', from: 'casey@yardflow.ai', toName: 'joey maggard', to: 'joey.maggard@kroger.com', subject: 'Doors versus spots', body: 'Hi Joey,\n\nBody.', contentHash: HASH, stepIndex: 0 };
const json = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('<SendFromYardflow>', () => {
  it('Send email only previews; the final check shows From, To, Subject, body and HubSpot ON; Confirm + send posts the exact hash and recipient', async () => {
    fetchMock.mockResolvedValueOnce(json({ ok: true, preview: PREVIEW }));
    render(<SendFromYardflow decisionId="dec-1" mailbox="casey@yardflow.ai" />);
    fireEvent.click(screen.getByRole('button', { name: 'Send email' }));
    const confirm = await screen.findByTestId('send-confirm');
    expect(JSON.parse(String((fetchMock.mock.calls[0] as any[])[1].body))).toEqual({});
    expect(confirm).toHaveTextContent('Casey Larkin <casey@yardflow.ai>');
    expect(confirm).toHaveTextContent('joey maggard <joey.maggard@kroger.com>');
    expect(confirm).toHaveTextContent('HubSpot: ON');
    expect(confirm).not.toHaveTextContent(/bcc|gmail_direct|HUMAN_APPROVED|review_required/i);

    fetchMock.mockResolvedValueOnce(json({ ok: true, alreadySent: false, sent: { sentAt: '2026-09-26T14:00:00Z', gmailSentMessageId: 'm-1' }, humanAction: 'recorded' }, 201));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm + send' }));
    await screen.findByTestId('send-done');
    expect(JSON.parse(String((fetchMock.mock.calls[1] as any[])[1].body))).toEqual({ confirm: { contentHash: HASH, recipient: 'joey.maggard@kroger.com' } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('Back sends nothing; a refusal is explained in plain words', async () => {
    fetchMock.mockResolvedValueOnce(json({ ok: true, preview: PREVIEW }));
    render(<SendFromYardflow decisionId="dec-1" mailbox="casey@yardflow.ai" />);
    fireEvent.click(screen.getByRole('button', { name: 'Send email' }));
    await screen.findByTestId('send-confirm');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.queryByTestId('send-confirm')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockResolvedValueOnce(json({ error: 'copy_changed_since_review', detail: 'x' }, 409));
    fireEvent.click(screen.getByRole('button', { name: 'Send email' }));
    await waitFor(() => expect(screen.getByTestId('send-refused')).toHaveTextContent('The email changed after you reviewed it. Nothing was sent.'));
  });
});

describe('<GapCockpit>', () => {
  it('speaks in Casey work lanes, not internal states', () => {
    render(<GapCockpit data={{ review: 1, research: 2, ready: 3, followUp: 1, replies: { count: 0, atLeast: false }, active: null }} />);
    const text = screen.getByTestId('gap-cockpit').textContent ?? '';
    for (const lane of ['Review', 'Research', 'Ready', 'Follow up', 'Replies']) expect(text).toContain(lane);
    expect(text).not.toMatch(/review_required|routing|lane|shadow|gmail_direct|sequence version|active/i);
    expect(screen.getByTestId('cockpit-tile-ready')).toHaveAttribute('href', '/gap?lane=ready');
  });
});
