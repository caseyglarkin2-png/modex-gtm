import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentIntelStrip } from '@/components/agent-actions/agent-intel-strip';
import type { AgentActionResult } from '@/lib/agent-actions/types';

vi.mock('@/components/agent-actions/agent-action-dialog', () => ({
  AgentActionDialog: ({ trigger }: { trigger: ReactNode }) => <div>{trigger}</div>,
}));

function buildResult(overrides?: Partial<AgentActionResult>): AgentActionResult {
  return {
    action: 'content_context',
    provider: 'modex',
    status: 'ok',
    summary: 'Baseline summary.',
    cards: [
      { title: 'Research Summary', body: 'Baseline summary.', tone: 'success' },
      { title: 'Contact Coverage', body: '2 mapped contacts.', tone: 'default' },
      { title: 'Committee Coverage', body: 'Committee has not been built yet.', tone: 'warning' },
      { title: 'Buyer Map', body: 'Primary contact is the operator lead.', tone: 'default' },
    ],
    data: {
      salesContacts: [{ name: 'Alex' }, { name: 'Jamie' }],
    },
    freshness: {
      fetchedAt: '2026-05-05T12:00:00.000Z',
      stale: false,
      source: 'live',
      status: 'fresh',
      dimensions: {
        summary: {
          key: 'summary',
          label: 'Research summary',
          status: 'fresh',
          stale: false,
          source: 'live',
          fetchedAt: '2026-05-05T12:00:00.000Z',
          updatedAt: '2026-05-05T12:00:00.000Z',
          ageHours: 0,
          note: 'Research summary is current enough to use as-is.',
        },
        signals: {
          key: 'signals',
          label: 'Signals',
          status: 'fresh',
          stale: false,
          source: 'local',
          fetchedAt: '2026-05-05T12:00:00.000Z',
          updatedAt: '2026-05-05T11:00:00.000Z',
          ageHours: 1,
          note: 'Signals are current enough to use as-is.',
        },
        contacts: {
          key: 'contacts',
          label: 'Contacts',
          status: 'aging',
          stale: false,
          source: 'local',
          fetchedAt: '2026-05-05T12:00:00.000Z',
          updatedAt: '2026-05-04T00:00:00.000Z',
          ageHours: 36,
          note: 'Contacts are aging. Refresh soon before broadening the motion.',
        },
        generated_content: {
          key: 'generated_content',
          label: 'Generated content',
          status: 'fresh',
          stale: false,
          source: 'local',
          fetchedAt: '2026-05-05T12:00:00.000Z',
          updatedAt: '2026-05-05T09:00:00.000Z',
          ageHours: 3,
          note: 'Generated content is current enough to use as-is.',
        },
      },
    },
    nextActions: ['Generate the first one-pager.'],
    ...overrides,
  };
}

describe('AgentIntelStrip refresh behavior', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('refreshes intel inline and passes account scope to the route', async () => {
    const next = buildResult({
      summary: 'Updated summary after refresh.',
      nextActions: ['Refresh happened.'],
      freshness: {
        ...buildResult().freshness,
        fetchedAt: '2026-05-05T13:00:00.000Z',
      },
    });
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify(next),
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AgentIntelStrip
        accountName="Boston Beer Company"
        accountNames={['Boston Beer Company', 'The Boston Beer Company']}
        initialResult={buildResult()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Refresh Intel/i }));

    await waitFor(() => {
      expect(screen.getByText('Updated summary after refresh.')).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/agent-actions', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        action: 'content_context',
        refresh: true,
        target: {
          accountName: 'Boston Beer Company',
          accountNames: ['Boston Beer Company', 'The Boston Beer Company'],
          company: 'Boston Beer Company',
        },
      }),
    }));
  });
});
