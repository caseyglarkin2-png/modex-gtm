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

  it('always explains that routing is safe, shows the scope, and disables Run routing when there is nothing to route', () => {
    render(<RunRoutingPanel canRun={false} routableHypotheses={0} routableAccounts={0} />);
    expect(screen.getByText(/Routes only accounts with approved or active hypotheses/)).toBeInTheDocument();
    expect(screen.getByText(/Creates recommendation cards only\. Does not send or enroll\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run routing' })).toBeDisabled();
  });

  it('shows the exact routable scope before the click', () => {
    render(<RunRoutingPanel canRun routableHypotheses={3} routableAccounts={2} />);
    expect(screen.getByTestId('run-routing-scope')).toHaveTextContent('3 routable hypotheses, 2 accounts');
  });

  it('POSTs /api/gap/routing/run?mode=apply with scope:routable_hypotheses, never a client-supplied account list or a secret', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ runId: 'run-1', accountsScanned: 2, pairs: 3, decisions: 1, skips: { tam_out: 1 } }),
    );
    render(<RunRoutingPanel canRun routableHypotheses={3} routableAccounts={2} />);

    fireEvent.click(screen.getByRole('button', { name: 'Run routing' }));
    expect(screen.getByRole('button', { name: 'Running...' })).toBeDisabled();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/gap/routing/run?mode=apply');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ scope: 'routable_hypotheses' });
    expect(String(init.body)).not.toMatch(/secret|accountNames/i);
    expect(Object.keys(init.headers as Record<string, string>).join(',')).not.toMatch(/cron|secret/i);
  });

  it('shows the run summary and refreshes the page on success', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ runId: 'run-1', accountsScanned: 2, pairs: 3, decisions: 1, skips: { tam_out: 1 } }),
    );
    render(<RunRoutingPanel canRun routableHypotheses={3} routableAccounts={2} />);
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
    render(<RunRoutingPanel canRun routableHypotheses={3} routableAccounts={2} />);
    fireEvent.click(screen.getByRole('button', { name: 'Run routing' }));

    const error = await screen.findByTestId('run-routing-error');
    expect(error).toHaveTextContent('unauthenticated');
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('an aborted request (the 60s client timeout firing) shows the timeout message, never refreshes, and never auto-retries', async () => {
    fetchMock.mockImplementationOnce(() => Promise.reject(new DOMException('Aborted', 'AbortError')));
    render(<RunRoutingPanel canRun routableHypotheses={3} routableAccounts={2} />);
    fireEvent.click(screen.getByRole('button', { name: 'Run routing' }));

    const timeout = await screen.findByTestId('run-routing-timeout');
    expect(timeout).toHaveTextContent('Routing is taking too long. No outbound action was taken. Check routing status before trying again.');
    expect(refreshMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1); // no automatic retry
  });

  it('wires an AbortController signal into the fetch call, aborting no earlier than 60 seconds', () => {
    vi.useFakeTimers();
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');
    fetchMock.mockImplementationOnce(() => new Promise(() => {})); // never resolves on its own
    render(<RunRoutingPanel canRun routableHypotheses={3} routableAccounts={2} />);
    fireEvent.click(screen.getByRole('button', { name: 'Run routing' }));

    vi.advanceTimersByTime(59_999);
    expect(abortSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(abortSpy).toHaveBeenCalledTimes(1);

    abortSpy.mockRestore();
    vi.useRealTimers();
  });
});
