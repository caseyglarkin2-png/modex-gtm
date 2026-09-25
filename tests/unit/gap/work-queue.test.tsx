import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkQueue } from '@/app/gap/work-queue';

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('<WorkQueue> empty states and reload', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('says "No routing run yet" (never mentions a cron or an API) when there is no run at all', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ runId: null, items: [], nextCursor: null }));
    render(<WorkQueue />);
    await waitFor(() => expect(screen.getByText('No routing run yet.')).toBeInTheDocument());
    expect(screen.queryByText(/cron/i)).toBeNull();
    expect(screen.queryByText(/\bapi\b/i)).toBeNull();
    expect(screen.getByText(/does not contact anyone/i)).toBeInTheDocument();
  });

  it('distinguishes a real run with a filtered-empty result from no run at all', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ runId: 'run-1', items: [], nextCursor: null }));
    render(<WorkQueue />);
    await waitFor(() => expect(screen.getByText('No decisions match this filter.')).toBeInTheDocument());
  });

  it('states the operator loop above the queue: GAP recommends, Casey records', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ runId: null, items: [], nextCursor: null }));
    render(<WorkQueue />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByText('GAP recommends what to do next.')).toBeInTheDocument();
    expect(screen.getByText(/tell GAP what you did/i)).toBeInTheDocument();
  });

  it('refetches the queue when reloadKey changes (a completed routing run), with no page reload', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ runId: 'run-1', items: [], nextCursor: null }));
    const { rerender } = render(<WorkQueue reloadKey="run-1" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    rerender(<WorkQueue reloadKey="run-2" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
