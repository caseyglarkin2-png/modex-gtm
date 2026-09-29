/** Release C UI: research tasks get a DEEPEN button, buyer questions are shown as questions, skips say why. Plus the orchestrator's memory. */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { ResearchPlanView } from '@/components/gap/research-plan';
import { loadResearchHistory, type ResearchPlan } from '@/lib/gap/account-intel/orchestrate';

afterEach(() => vi.unstubAllGlobals());

const plan: ResearchPlan = {
  tasks: [
    { section: 'catalysts', depth: 'DEEPEN', provider: 'research', focus: 'Recent changes...', why: 'No live verified fact gates contact: nothing public to open on yet.' },
    { section: 'org', depth: 'DEEPEN', provider: 'human', focus: 'Who owns yard performance across the plants and DCs? (ask; never guessed from a title)', why: 'Ownership is the question research cannot answer.' },
  ],
  skipped: [{ section: 'technology', reason: 'The same focus came back empty on 2026-09-25; not repeated for 14 days.' }],
};

describe('ResearchPlanView', () => {
  it('research gets a Deepen button; a buyer question is a question, not a button; skips say why', () => {
    render(<ResearchPlanView accountName="Acme Foods" plan={plan} />);
    expect(screen.getByTestId('deepen-catalysts').textContent).toBe('Deepen catalysts');
    const human = screen.getAllByTestId('research-task').find((el) => el.getAttribute('data-provider') === 'human')!;
    expect(human.textContent).toMatch(/Who owns yard performance/);
    expect(human.querySelector('button')).toBeNull();
    expect(screen.getByText(/came back empty on 2026-09-25/)).toBeTruthy();
  });

  it('Deepen posts the account and section and reports an honest empty result', async () => {
    const f = vi.fn(async () => ({ ok: true, json: async () => ({ outcome: 'insufficient_evidence', facts: 0 }) }));
    vi.stubGlobal('fetch', f);
    render(<ResearchPlanView accountName="Acme Foods" plan={plan} />);
    fireEvent.click(screen.getByTestId('deepen-catalysts'));
    await waitFor(() => expect(screen.getByTestId('research-plan-result').textContent).toBe('Catalysts: found nothing it could verify (an honest answer).'));
    expect(JSON.parse((f.mock.calls[0] as unknown as [string, { body: string }])[1].body)).toEqual({ accountName: 'Acme Foods', section: 'catalysts' });
  });
});

describe('loadResearchHistory', () => {
  it('keeps only DEEPEN runs, with their section and outcome', async () => {
    const prisma = { researchRun: { findMany: async () => [
      { created_at: new Date('2026-09-25T00:00:00Z'), provider_status: { orchestrator: 'deepen', section: 'technology', outcome: 'insufficient_evidence' } },
      { created_at: new Date('2026-09-26T00:00:00Z'), provider_status: { purpose: 'gap_research_this', outcome: 'evidence_found' } },
    ] } };
    expect(await loadResearchHistory(prisma, 'Acme Foods', new Date('2026-09-29T00:00:00Z'))).toEqual([{ section: 'technology', outcome: 'insufficient_evidence', at: '2026-09-25T00:00:00.000Z' }]);
  });
});
