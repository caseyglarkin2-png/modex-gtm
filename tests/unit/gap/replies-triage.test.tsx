/**
 * REPLIES lane in the cockpit (weekend reduction, 2026-09-26): the first waiting
 * reply opens on its own and the state filter is hidden; /gap/replies (history)
 * keeps the filter and opens nothing.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { RepliesTriage } from '@/app/gap/replies/replies-triage';
import type { GapApiClient } from '@/lib/gap/ui/gap-api-client';

const REPLY = {
  id: 'gm_1', source: { kind: 'inbound_message', id: 'gm_1' }, contactEmail: 'riley@example.com', personaId: 2, accountName: 'GAP Test Foods',
  hypothesisId: 'hyp_1', hypothesisTitle: 'hidden_capacity', subject: 'Re: dock doors', snippet: 'Not this quarter.', receivedAt: '2026-09-26T00:00:00Z', enrollmentId: null, enrollmentStatus: null,
};

function client(): GapApiClient {
  return { listReplies: vi.fn(async () => ({ ok: true, status: 200, data: { items: [REPLY], nextCursor: null } })), postDisposition: vi.fn(), getCallBrief: vi.fn(), postBid: vi.fn(), suggestReply: vi.fn() } as unknown as GapApiClient;
}

describe('<RepliesTriage>', () => {
  it('in the cockpit: the first reply is already open and there is no filter', async () => {
    render(<RepliesTriage client={client()} inCockpit />);
    await waitFor(() => expect(screen.getByTestId('disposition-form')).toBeInTheDocument());
    expect(screen.queryByLabelText('Reply state filter')).toBeNull();
  });

  it('on the history page: the filter is there and nothing opens on its own', async () => {
    render(<RepliesTriage client={client()} />);
    await screen.findByTestId('reply-row');
    expect(screen.getByLabelText('Reply state filter')).toBeInTheDocument();
    expect(screen.queryByTestId('disposition-form')).toBeNull();
  });
});
