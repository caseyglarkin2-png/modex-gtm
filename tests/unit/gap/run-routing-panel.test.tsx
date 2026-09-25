import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RunRoutingPanel } from '@/components/gap/run-routing-panel';

const refreshMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('<RunRoutingPanel>', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    refreshMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('always explains that routing is safe, and disables Run routing when there is nothing to route', () => {
    render(<RunRoutingPanel canRun={false} />);
    expect(screen.getByText('Creates recommendation cards only. Does not send or enroll.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run routing' })).toBeDisabled();
  });

  it('POSTs /api/gap/routing/run?mode=apply as an authenticated same-origin request (no secret in the body or URL)', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ runId: 'run-1', accountsScanned: 2, pairs: 3, decisions: 1, skips: { tam_out: 1 } }),
    );
    render(<RunRoutingPanel canRun />);

    fireEvent.click(screen.getByRole('button', { name: 'Run routing' }));
    expect(screen.getByRole('button', { name: 'Running...' })).toBeDisabled();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/gap/routing/run?mode=apply');
    expect(init.method).toBe('POST');
    expect(String(init.body)).not.toMatch(/secret/i);
    expect(Object.keys(init.headers as Record<string, string>).join(',')).not.toMatch(/cron|secret/i);
  });

  it('shows the run summary and refreshes the page on success', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ runId: 'run-1', accountsScanned: 2, pairs: 3, decisions: 1, skips: { tam_out: 1 } }),
    );
    render(<RunRoutingPanel canRun />);
    fireEvent.click(screen.getByRole('button', { name: 'Run routing' }));

    const summary = await screen.findByTestId('run-routing-complete');
    expect(summary).toHaveTextContent('Accounts evaluated: 2');
    expect(summary).toHaveTextContent('Personas evaluated: 3');
    expect(summary).toHaveTextContent('Decisions created: 1');
    expect(summary).toHaveTextContent('tam out (1)');
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it('shows a plain error when the run fails, and does not refresh', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'unauthenticated' }, 401));
    render(<RunRoutingPanel canRun />);
    fireEvent.click(screen.getByRole('button', { name: 'Run routing' }));

    const error = await screen.findByTestId('run-routing-error');
    expect(error).toHaveTextContent('unauthenticated');
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
