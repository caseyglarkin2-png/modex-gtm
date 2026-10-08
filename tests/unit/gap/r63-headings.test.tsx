/**
 * R63-B S6: the pack page had one heading, so KNOW, PROOF, THINK, LEARN, HISTORY and EMAIL could not be jumped to,
 * and the Work cards had none. The brief's rows and the pack's sections are h2 headings and each Work card is an h3
 * named by its account, all with the same visible words.
 */
import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams('') }));
import { buildBrief } from '@/lib/gap/execution/six-line-brief';
import { SixLineBriefView } from '@/components/gap/six-line-brief';
import { WorkList } from '@/components/gap/work-list';
import type { WorkCard } from '@/lib/gap/work/list';

const hyp = { account_name: 'Walmart Scratch Co r63', problem_hypothesis: 'Load moves onto the remaining handoffs.', falsification_questions: ['Did the change add trailer volume?'], what_a_no_means: 'If trailers do not wait longer, the thesis is closed.', signals: [] };

describe('R63-B S6: real headings', () => {
  it('the brief: each row is an h2 with its own visible words', () => {
    const b = buildBrief({ hypothesis: hyp, firstName: 'Doug', angle: null, suggestedAngle: 'Runs transportation.', history: null, account: { accountName: 'Walmart Scratch Co r63', motion: { type: 'FACT_LED', who: null, why: 'x' }, motionLine: 'Fact-led, on the verified fact.', firstDiscoveryQuestion: null } });
    render(<SixLineBriefView brief={b} personaId={null} accountName="Walmart Scratch Co r63" />);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Know', 'Proof', 'Think', 'Learn', 'Why you', 'History', 'Account', 'Wrong if']);
  });

  it('the pack: Email, Call, Sequence, Thesis needs review and Missing prerequisite are h2 headings', () => {
    const src = readFileSync('src/components/gap/action-pack-view.tsx', 'utf8');
    for (const label of ['>Email{touchStep', '>Call</h2>', '>Sequence</h2>', '>Thesis needs review</h2>', '>Missing prerequisite</h2>']) expect(src).toContain(label);
    expect(src).not.toMatch(/<p className="[^"]*uppercase[^"]*">(Email|Call|Sequence|Thesis needs review|Missing prerequisite)/);
  });

  it('Work: each card is an h3 named by its account', () => {
    const card = (index: number, accountName: string): WorkCard => ({ accountName, index, lane: 'ready', stateKind: 'ready', state: 'Ready for a first touch', why: 'why', person: null, next: null, blocker: null, href: `/gap/accounts/${accountName.toLowerCase()}/`, source: 'cockpit' });
    render(<WorkList cards={[card(0, 'Fedex Scratch Co r63'), card(1, 'Nfi Scratch Co r63')]} />);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(expect.arrayContaining(['Fedex Scratch Co r63', 'Nfi Scratch Co r63']));
  });
});
