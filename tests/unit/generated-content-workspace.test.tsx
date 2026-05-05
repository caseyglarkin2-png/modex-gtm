import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GeneratedContentWorkspace } from '@/components/generated-content/generated-content-workspace';
import type { QueueGeneratedAccountCard } from '@/components/queue/generated-content-grid';

const mockedReplace = vi.fn();
let mockedPathname = '/generated-content';
let mockedParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
  useRouter: () => ({ replace: mockedReplace }),
  useSearchParams: () => ({
    get: (key: string) => mockedParams.get(key),
    toString: () => mockedParams.toString(),
  }),
}));

vi.mock('@/components/queue/generated-content-grid', () => ({
  GeneratedContentGrid: ({ cards }: { cards: Array<{ account_name: string }> }) => (
    <div>
      <p data-testid="card-count">{cards.length}</p>
      {cards.map((card) => (
        <p key={card.account_name}>{card.account_name}</p>
      ))}
    </div>
  ),
}));

const cards: QueueGeneratedAccountCard[] = [
  {
    account_name: 'Acme Foods',
    account_slug: 'acme-foods',
    latest_version: 2,
    pending_jobs: 0,
    processing_jobs: 0,
    campaign_names: ['Q2 Launch'],
    versions: [
      {
        id: 11,
        version: 2,
        provider_used: 'ai_gateway',
        external_send_count: 1,
        is_published: true,
        content: 'x',
        created_at: '2026-05-01T00:00:00.000Z',
        quality: {
          score: 80,
          scores: { clarity: 80, personalization: 80, cta_strength: 80, compliance_risk: 20, deliverability_risk: 20 },
          flags: [],
          fixes: [],
          blockedByThreshold: false,
        },
      },
    ],
  },
  {
    account_name: 'Blue Rail',
    account_slug: 'blue-rail',
    latest_version: 1,
    pending_jobs: 0,
    processing_jobs: 0,
    campaign_names: ['RevOps'],
    versions: [
      {
        id: 22,
        version: 1,
        provider_used: 'openai',
        external_send_count: 0,
        is_published: false,
        content: 'y',
        created_at: '2026-05-01T00:00:00.000Z',
        quality: {
          score: 55,
          scores: { clarity: 55, personalization: 55, cta_strength: 55, compliance_risk: 40, deliverability_risk: 35 },
          flags: ['low_clarity'],
          fixes: ['Tighten structure with a short summary and explicit next steps.'],
          blockedByThreshold: true,
        },
      },
    ],
  },
];

describe('GeneratedContentWorkspace', () => {
  beforeEach(() => {
    mockedReplace.mockReset();
    mockedPathname = '/generated-content';
    mockedParams = new URLSearchParams();
  });

  it('applies query-string filters to visible cards', () => {
    mockedParams = new URLSearchParams('q=revops');
    render(<GeneratedContentWorkspace cards={cards} recipientsByAccount={{}} />);

    expect(screen.getByTestId('card-count')).toHaveTextContent('1');
    expect(screen.getByText('Blue Rail')).toBeInTheDocument();
    expect(screen.queryByText('Acme Foods')).not.toBeInTheDocument();
  });

  it('updates URL params when search text changes', () => {
    vi.useFakeTimers();
    render(<GeneratedContentWorkspace cards={cards} recipientsByAccount={{}} />);

    fireEvent.change(screen.getByPlaceholderText('Search accounts/campaigns'), {
      target: { value: 'acme' },
    });
    vi.advanceTimersByTime(300);

    expect(mockedReplace).toHaveBeenCalledWith('/generated-content?q=acme');
    vi.useRealTimers();
  });

  it('renders advisory-state filter copy instead of checklist-first language', () => {
    render(<GeneratedContentWorkspace cards={cards} recipientsByAccount={{}} />);

    expect(screen.getByText('Any Advisory State')).toBeInTheDocument();
    expect(screen.queryByText('Checklist Complete')).not.toBeInTheDocument();
  });
});
