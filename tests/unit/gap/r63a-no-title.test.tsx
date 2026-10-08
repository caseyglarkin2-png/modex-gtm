/**
 * R63-A N10: Dannon's People list named Mark Shaughnessy with no title, a bare name beside people who have one. A row
 * with no title on record says so.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { resolveOwner, type OwnerCandidateInput } from '@/lib/gap/people/owner-resolution';
import { buildPeopleStack } from '@/lib/gap/people/stack';
import { projectPursuitState } from '@/lib/gap/pursuit/state';
import { PeopleStackView } from '@/components/gap/people-stack';

const NOW = new Date('2026-10-07T15:00:00Z');
const person = (id: number, name: string, title: string | null): OwnerCandidateInput => ({ key: `gap:${id}`, source: 'gap', personaId: id, name, title: title as string, hasEmail: true, employment: { state: 'CURRENT_UNVERIFIED', why: 'CRM only.', decidedBy: [], elsewhere: null, verifyNeeded: false } });

describe('R63-A N10: a person with no title says so', () => {
  it('the row reads "title not on record"; a titled row keeps its title', () => {
    const r = resolveOwner({ account: { name: 'Dannon Scratch Co', entityType: 'manufacturer' }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [person(1, 'Pat Scratch', 'Director Logistics'), person(2, 'Mark Shaughnessy', null)], hubspot: { read: true, count: 0, truncated: false, via: 'linked' }, now: NOW });
    const state = projectPursuitState({ accountName: 'Dannon Scratch Co', now: NOW, motionType: 'FACT_LED', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible: r.eligible.map((c) => ({ key: c.key, personaId: c.personaId, name: c.name, title: c.title })) });
    const built = buildPeopleStack(r, { chosenKey: null });
    // The relationship route as Dannon's page shows it: a person on record with no title.
    const stack = { ...built, rows: [...built.rows, { ...built.rows[0], key: 'gap:2', personaId: 2, name: 'Mark Shaughnessy', title: null, chosen: false, chosenBy: null, slot: 'Relationship route' as const, ordinal: null }] };
    render(<PeopleStackView accountName="Dannon Scratch Co" stack={stack} state={state} hypothesisId="h1" excluded={[]} />);
    const rows = screen.getAllByTestId('people-stack-row');
    const mark = rows.find((x) => x.textContent?.includes('Mark Shaughnessy'));
    const pat = rows.find((x) => x.textContent?.includes('Pat Scratch'));
    expect(mark?.querySelector('[data-testid="people-stack-no-title"]')?.textContent).toBe(', title not on record');
    expect(pat?.textContent).toContain('Pat Scratch, Director Logistics');
    expect(pat?.querySelector('[data-testid="people-stack-no-title"]')).toBeNull();
  });
});
