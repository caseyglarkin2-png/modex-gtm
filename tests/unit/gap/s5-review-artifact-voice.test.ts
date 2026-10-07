/**
 * Sprint 5 review, SHOULD 6 (R53): the recap to Ann read "What I owe you: - Send Ann the dock schedule template"
 * (third person to the person herself) and the introduction email carried the CRM deal name "YardFlow - Kroger
 * Scratch Co x71007". Now what we owe the recipient is in the second person, what we owe someone else on their side is
 * listed for the team by name, and the CRM deal name never reaches buyer text (the guard refuses it).
 */
import { describe, expect, it } from 'vitest';
import { artifactProblems, prepareArtifacts, toSecondPerson, type ArtifactInput } from '@/lib/gap/deals/artifacts';
import { planFor } from '@/lib/gap/deals/action-plan';

const CRM_NAME = 'YardFlow - Kroger Scratch Co x71007';
const DEAL = { id: '392057001', name: CRM_NAME, contacts: [{ name: 'Ann Scratch', title: 'VP Supply Chain Operations' }, { name: 'Ben Scratch', title: 'Director, Columbus DC' }] };
const input = (over: Partial<ArtifactInput> = {}): ArtifactInput => ({
  accountName: 'Kroger Scratch Co',
  deal: DEAL,
  needs: [{ id: 'b1', type: 'business_problem', quote: 'Trailers sit two hours before a door opens.', who: 'Ann Scratch', at: '2026-10-02T15:00:00.000Z', accountLevel: false }],
  plan: planFor(DEAL.id, [], []),
  commitments: [
    { commitmentId: 'c1', kind: 'deliverable', title: 'Send Ann the dock schedule template', line: 'Due Oct 9.', dueAt: '2026-10-09T13:00:00.000Z', person: 'Ann Scratch' },
    { commitmentId: 'c2', kind: 'answer_request', title: "Answer Ann's question on the gate cameras", line: 'Due Oct 9.', dueAt: null, person: null },
    { commitmentId: 'c3', kind: 'deliverable', title: 'Send Ben the Columbus detention numbers', line: 'Due Oct 10.', dueAt: '2026-10-10T13:00:00.000Z', person: 'Ben Scratch' },
  ],
  roi: null,
  ...over,
});

describe('Sprint 5 review: the artifacts are written to their recipient, in their words', () => {
  it('what we owe Ann is said to her as you; what we owe Ben is listed for the team, by name', () => {
    const [recap] = prepareArtifacts(input());
    expect(recap.text).toContain(['What I owe you:', '- Send you the dock schedule template', '- Answer your question on the gate cameras', '', 'What I owe your team:', '- Send Ben the Columbus detention numbers'].join('\n'));
    expect(recap.text).not.toMatch(/Send Ann|Ann's question/);
    expect(recap.problems).toEqual([]);
  });

  it('the second person: full and first name, the possessive, never a longer word that starts with the name', () => {
    expect(toSecondPerson("Send Ann Scratch the plan and Ann's notes", 'Ann Scratch')).toBe('Send you the plan and your notes');
    expect(toSecondPerson('Share the Annual report with Ann', 'Ann Scratch')).toBe('Share the Annual report with you');
    expect(toSecondPerson('Send Ann the template', null)).toBe('Send Ann the template');
  });

  it('no buyer text carries the CRM deal name; the guard refuses it outside their own quoted words', () => {
    const arts = prepareArtifacts(input());
    for (const a of arts) {
      expect(a.text).not.toContain(CRM_NAME);
      expect(a.problems).toEqual([]);
    }
    expect(arts.find((a) => a.kind === 'introduction')!.text).toContain('Before we go further, who else needs to be part of this');
    expect(artifactProblems(`Before we go further on ${CRM_NAME}, who else`, [], [CRM_NAME])).toEqual([`the CRM deal name "${CRM_NAME}" (say what it is in their words)`]);
    const quoted = `We call it ${CRM_NAME} internally too.`;
    expect(artifactProblems(`- "${quoted}" (Ann Scratch)`, [quoted], [CRM_NAME])).toEqual([]);
  });

  it('the pilot question is asked of the recipient, never about them by name', () => {
    const criteria = prepareArtifacts(input({ needs: [] })).find((a) => a.kind === 'pilot_criteria')!;
    expect(criteria.text).toBe('Pilot success criteria: none agreed yet.\n\nWhat would you need to see at the end of a pilot to call it worth rolling out?');
  });
});
