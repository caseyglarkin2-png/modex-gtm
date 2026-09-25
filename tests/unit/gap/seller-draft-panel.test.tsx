import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SellerDraftPanel } from '@/components/gap/seller-draft-panel';

const refreshMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const base = { decisionId: 'dec-joey', senderIdentity: 'casey@freightroll.com', drafts: [], ineligibleReason: null };

afterEach(() => {
  vi.restoreAllMocks();
  refreshMock.mockReset();
});

describe('<SellerDraftPanel>', () => {
  it('offers Create Gmail draft only when the copy is compiler-cleared; otherwise Check copy', () => {
    const { rerender } = render(<SellerDraftPanel {...base} emailReady />);
    expect(screen.getByRole('button', { name: 'Create Gmail draft' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Check copy' })).toBeNull();
    rerender(<SellerDraftPanel {...base} emailReady={false} />);
    expect(screen.getByRole('button', { name: 'Check copy' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create Gmail draft' })).toBeNull();
    expect(screen.queryByRole('button', { name: /send/i })).toBeNull();
  });

  it('an ineligible card shows why and no button at all', () => {
    render(<SellerDraftPanel {...base} emailReady ineligibleReason="This person carries a do-not-contact flag." />);
    expect(screen.getByTestId('draft-ineligible')).toHaveTextContent('do-not-contact');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('Create Gmail draft posts to the draft route only and shows DRAFT CREATED with recipient, subject and timestamp', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ ok: true, alreadyDrafted: false, receipt: { recipient: 'joey.maggard@kroger.com', subject: 'Doors versus spots', createdAt: '2026-09-25T15:00:00.000Z' } }, 201),
    );
    render(<SellerDraftPanel {...base} emailReady />);
    fireEvent.click(screen.getByRole('button', { name: 'Create Gmail draft' }));
    const box = await screen.findByTestId('draft-created');
    expect(box).toHaveTextContent('Draft created');
    expect(box).toHaveTextContent('recipient: joey.maggard@kroger.com');
    expect(box).toHaveTextContent('subject: Doors versus spots');
    expect(box).toHaveTextContent('timestamp:');
    expect(screen.getByRole('link', { name: 'Open Gmail drafts' })).toHaveAttribute('href', 'https://mail.google.com/mail/?authuser=casey%40freightroll.com#drafts');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/gap/decisions/dec-joey/gmail-draft');
    expect(init.body).toBe('{}');
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('/act'))).toBe(false);
  });

  it('Check copy sends checkOnly and, on review, points at the approval queue', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ error: 'copy_review_required', detail: 'critic_unconfigured' }, 409));
    render(<SellerDraftPanel {...base} emailReady={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Check copy' }));
    await waitFor(() => expect(screen.getByTestId('draft-review')).toHaveTextContent('critic_unconfigured'));
    expect((fetchMock.mock.calls[0][1] as RequestInit).body).toBe('{"checkOnly":true}');
    expect(screen.getByRole('link', { name: 'Open the approval queue' })).toHaveAttribute('href', '/queue');
  });

  it('lists drafts with their fate and offers Check if sent only for a draft still in Gmail', () => {
    render(
      <SellerDraftPanel
        {...base}
        emailReady
        drafts={[
          { gmailDraftId: 'r1', recipient: 'a@x.com', subject: 's1', createdAt: '2026-09-25T15:00:00Z', fate: 'drafted', sentAt: null, gmailSentMessageId: null },
          { gmailDraftId: 'r2', recipient: 'a@x.com', subject: 's2', createdAt: '2026-09-24T15:00:00Z', fate: 'sent', sentAt: '2026-09-24T16:00:00Z', gmailSentMessageId: 'm9' },
        ]}
      />,
    );
    expect(screen.getAllByTestId('draft-row')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Check if sent' })).toHaveLength(1);
  });
});
