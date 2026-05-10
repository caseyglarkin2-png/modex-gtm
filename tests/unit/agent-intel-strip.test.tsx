import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentIntelStrip } from '@/components/agent-actions/agent-intel-strip';
import { createDefaultAgentActionFreshness } from '@/lib/agent-actions/freshness';
import type { AgentActionResult } from '@/lib/agent-actions/types';

vi.mock('@/components/agent-actions/agent-action-dialog', () => ({
  AgentActionDialog: ({ trigger }: { trigger: unknown }) => <>{trigger}</>,
}));

function buildResult(partial?: Partial<AgentActionResult>): AgentActionResult {
  const freshness = createDefaultAgentActionFreshness('2026-05-06T00:00:00.000Z');
  return {
    action: 'content_context',
    provider: 'local',
    status: 'ok',
    summary: 'Summary',
    cards: [
      { title: 'Research Summary', body: 'Research body' },
      { title: 'Contact Coverage', body: 'Contact body' },
      { title: 'Committee Coverage', body: 'Committee body' },
      { title: 'Buyer Map', body: 'Buyer map body' },
    ],
    data: {},
    freshness,
    nextActions: ['Build committee'],
    ...partial,
  };
}

function responseFor(payload: unknown, ok = true): Response {
  return {
    ok,
    text: async () => JSON.stringify(payload),
  } as Response;
}

describe('AgentIntelStrip', () => {
  let nowMs = new Date('2026-05-06T00:00:00.000Z').getTime();

  beforeEach(() => {
    vi.clearAllMocks();
    nowMs = new Date('2026-05-06T00:00:00.000Z').getTime();
    vi.spyOn(Date, 'now').mockImplementation(() => nowMs);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not auto-refresh when initial intel is stale', async () => {
    const staleFreshness = {
      ...createDefaultAgentActionFreshness('2026-05-01T00:00:00.000Z'),
      stale: true,
      status: 'stale' as const,
    };
    vi.stubGlobal('fetch', vi.fn());

    render(
      <AgentIntelStrip
        accountName="Dollar General"
        initialResult={buildResult({ freshness: staleFreshness })}
      />,
    );

    expect(screen.getByText(/Intel is stale\. Refresh manually/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('dedupes in-flight refreshes and enforces refresh cooldown', async () => {
    let resolveFirst: ((value: Response) => void) | null = null;
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => new Promise<Response>((resolve) => {
        resolveFirst = resolve;
      }))
      .mockResolvedValue(responseFor(buildResult()));
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AgentIntelStrip
        accountName="Dollar General"
        initialResult={buildResult()}
      />,
    );

    const refreshButton = screen.getByRole('button', { name: 'Refresh Intel' });
    fireEvent.click(refreshButton);
    fireEvent.click(refreshButton);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst?.(responseFor(buildResult()));
    });
    await waitFor(() => {
      expect(screen.getByText(/Last refreshed/)).toBeInTheDocument();
    });

    fireEvent.click(refreshButton);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    nowMs += 1300;
    fireEvent.click(refreshButton);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      expect(refreshButton).not.toBeDisabled();
    });
  });
});
