/**
 * The candidate queue UI: the six things Casey needs per company are on the
 * card, ADD runs the duplicate check before the add button exists, and a
 * refusal says what already exists.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { CandidateQueue } from '@/components/gap/candidate-queue';
import type { QueueItem } from '@/lib/gap/entity/candidates';

const item = (over: Partial<QueueItem> = {}): QueueItem => ({
  company: 'Harbor Foods Group', companyKey: 'harbor foods group', people: 2, titles: ['VP Supply Chain'], sources: ['MMYQB'], sourceIds: ['s1'], relationship: ['MMYQB subscriber'],
  verdict: 'DIRECT_BUYER', entityType: 'shipper', ambiguous: false, scouted: true, scoutedAt: '2026-09-29T00:00:00Z', domain: 'harborfoods.com', what: 'Foodservice distributor.', why: 'A shipper with cited network evidence (1 claim).',
  network: [{ claim: 'Operates 12 distribution centers.', url: 'https://harborfoods.example/about' }], freight: [], unknowns: ['Who runs yard operations'], decision: 'open', ...over,
});

afterEach(() => vi.unstubAllGlobals());

describe('candidate queue', () => {
  it('shows company, why a fit, evidence links, relationship source and unknowns', () => {
    render(<CandidateQueue items={[item()]} title="New" />);
    const card = screen.getByTestId('candidate');
    expect(within(card).getByTestId('candidate-verdict').textContent).toBe('Direct buyer');
    expect(card.textContent).toMatch(/Why a fit: A shipper with cited network evidence/);
    expect(within(card).getByRole('link', { name: 'source' }).getAttribute('href')).toBe('https://harborfoods.example/about');
    expect(card.textContent).toMatch(/Relationship source: MMYQB; MMYQB subscriber \(context, never evidence or consent\)/);
    expect(card.textContent).toMatch(/What we don't know: Who runs yard operations/);
  });

  it('an unscouted name-rule fit says it came from the name only', () => {
    render(<CandidateQueue items={[item({ verdict: 'NOT_FIT', entityType: 'vendor', scouted: false, why: 'The name reads as a software or staffing firm.' })]} title="New" />);
    expect(screen.getByTestId('candidate-verdict').textContent).toBe('Not a fit (name only)');
  });

  it('entity type and fit are shown separately: a 3PL can be a direct buyer', () => {
    render(<CandidateQueue items={[item({ verdict: 'DIRECT_BUYER', entityType: '3pl' })]} title="New" />);
    expect(screen.getByTestId('candidate-entity').textContent).toBe('3PL / contract logistics');
    expect(screen.getByTestId('candidate-verdict').textContent).toBe('Direct buyer');
  });

  it('ADD runs the duplicate check first; a refusal names the existing account and no add button appears', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: false, reason: 'possible_duplicate', matches: ['Harbor Foods'] }) }));
    vi.stubGlobal('fetch', fetchMock);
    render(<CandidateQueue items={[item()]} title="New" />);
    fireEvent.click(screen.getByTestId('candidate-add'));
    expect(screen.queryByTestId('candidate-add-confirm')).toBeNull();
    fireEvent.click(screen.getByTestId('candidate-check-button'));
    await waitFor(() => expect(screen.getByTestId('candidate-check').textContent).toMatch(/already exists:.*Harbor Foods.*Map to it instead/));
    expect(JSON.parse((fetchMock.mock.calls[0] as unknown as [string, { body: string }])[1].body)).toMatchObject({ op: 'check', name: 'Harbor Foods Group', domain: 'harborfoods.com' });
    expect(screen.queryByTestId('candidate-add-confirm')).toBeNull();
  });

  it('a clear check shows the add button; adding needs a vertical', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, hubspotCompanyId: null, notes: ['No HubSpot company found by domain or name.'] }) })));
    render(<CandidateQueue items={[item()]} title="New" />);
    fireEvent.click(screen.getByTestId('candidate-add'));
    fireEvent.click(screen.getByTestId('candidate-check-button'));
    const confirm = await screen.findByTestId('candidate-add-confirm');
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
  });
});
