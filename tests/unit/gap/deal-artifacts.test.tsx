/**
 * R53 (GAP OS execution recovery): the next deal artifact or stakeholder move, PREPARED and never sent. The recap is
 * the buyer's confirmed words in order and only the steps the BUYER agreed; the introduction names the stakeholder move;
 * pilot criteria are the buyer's own measures or an honest question; the business-case inputs keep the ROI model
 * MODELED with its inputs, cite the buyer's numbers as theirs and label YardFlow's proof as YardFlow's. No artifact
 * claims the prospect's acceptance or a legal or security approval that is not in the buyer's own quoted words; each
 * is labeled "Prepared, not sent" with its citations and a copy control.
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { artifactProblems, nextArtifact, prepareArtifacts, YARDFLOW_PROOF, type ArtifactInput } from '@/lib/gap/deals/artifacts';
import { planFor, type Milestone } from '@/lib/gap/deals/action-plan';
import { DealArtifacts } from '@/components/gap/deal-artifacts';
import { loadDealWorkspace, recapSentAtOf } from '@/lib/gap/deals/workspace';
import { ledgerDb } from './fixtures/ledger-db';
import { stableHash } from '@/lib/gap/deals/crm-model';

const DEAL = { id: '70001', name: 'YardFlow - Kroger', contacts: [{ name: 'Ann Scratch', title: 'VP Supply Chain Operations' }] };
const agreed = (step: Milestone['step'], over: Partial<Milestone> = {}): Milestone => ({ ...planFor(DEAL.id, [], []).find((m) => m.step === step)!, state: 'agreed', commitmentId: `plan:${DEAL.id}:${step}`, phase: 'upcoming', line: 'No date agreed yet.', ...over });
const base = (over: Partial<ArtifactInput> = {}): ArtifactInput => ({
  accountName: 'Kroger Scratch Co',
  deal: DEAL,
  needs: [
    { id: 'b1', type: 'business_problem', quote: 'Trailers sit two hours before a door opens.', who: 'Ann Scratch', at: '2026-10-02T15:00:00.000Z', accountLevel: false },
    { id: 'b2', type: 'metric', quote: 'We pay about forty thousand a month in detention.', who: 'Ann Scratch', at: '2026-10-03T15:00:00.000Z', accountLevel: false },
    { id: 'b3', type: 'current_state', quote: 'Every DC still checks trailers in on paper.', who: 'Cal Scratch', at: '2026-10-04T15:00:00.000Z', accountLevel: true },
  ],
  plan: planFor(DEAL.id, [], []).map((m) => (m.step === 'pilot' ? agreed('pilot', { title: 'Pilot at Columbus: two weeks', dueDay: '2026-10-20', responsible: { side: 'buyer', name: 'Ann Scratch' }, buyerAgreed: { by: 'Ann Scratch', on: '2026-10-05' } }) : m.step === 'discovery' ? agreed('discovery') : m)),
  commitments: [{ commitmentId: 'capture:n1:k1', kind: 'deliverable', title: 'Send Ann the dock schedule template', line: 'Due Oct 9.', dueAt: '2026-10-09T13:00:00.000Z' }],
  roi: { hardSavingsAnnual: 1234567.4, totalValueAnnual: 2345678, facilities: 12, calculatorVersion: 'v3', assumptions: ['Shared engine defaults for this facility mix'] },
  ...over,
});

describe('the prepared artifacts (R53)', () => {
  it('the recap: their confirmed words in order, only the steps THEY agreed, what we owe as ours; prepared, never sent, cited', () => {
    const [recap] = prepareArtifacts(base());
    expect(recap).toMatchObject({ kind: 'recap', status: 'Prepared, not sent', governed: false, to: 'Ann Scratch', problems: [] });
    expect(recap.text).toBe([
      'Hi Ann,',
      '',
      'Thank you for the time. Here is what I heard, in your words, so you can correct anything I got wrong:',
      '- "Trailers sit two hours before a door opens." (Ann Scratch)',
      '- "We pay about forty thousand a month in detention." (Ann Scratch)',
      '- "Every DC still checks trailers in on paper." (Cal Scratch)',
      '',
      'What we agreed as next steps:',
      '- Pilot at Columbus: two weeks, by Oct 20 (Ann Scratch)',
      '',
      'What I owe you:',
      // Sprint 5 review (R53): written to Ann, in the second person.
      '- Send you the dock schedule template',
      '',
      'If any of this is off, tell me and I will fix it.',
    ].join('\n'));
    // Discovery was agreed by the seller only: never presented as the buyer's agreement.
    expect(recap.text).not.toMatch(/Discovery/);
    expect(recap.gaps).toEqual(['1 agreed step left out: the buyer\'s agreement is not recorded.']);
    expect(recap.citations.map((c) => c.ref)).toEqual(['bid:b1', 'bid:b2', 'bid:b3', `plan:${DEAL.id}:pilot`]);
    expect(recap.citations[2].label).toBe('Cal Scratch, Oct 4 (buyer confirmed, account-level)');
    expect(recap.why).toBe('3 confirmed statements from Ann Scratch and Cal Scratch on YardFlow - Kroger: send them back so Ann can correct them, with the 1 step they agreed.');
  });

  it('with nothing confirmed the recap says there is nothing to send yet; pilot criteria ask instead of inventing a target', () => {
    const arts = prepareArtifacts(base({ needs: [] }));
    const recap = arts.find((a) => a.kind === 'recap')!;
    expect(recap.why).toBe('Nothing confirmed from the buyer on YardFlow - Kroger yet: there is no recap to send until there is.');
    expect(recap.gaps[0]).toBe('No confirmed buyer statement on this deal yet.');
    const criteria = arts.find((a) => a.kind === 'pilot_criteria')!;
    expect(criteria.text).toBe('Pilot success criteria: none agreed yet.\n\nWhat would you need to see at the end of a pilot to call it worth rolling out?');
    expect(criteria.text).not.toMatch(/\d/);
    expect(criteria.gaps).toEqual(['No success measure confirmed by the buyer: nothing is invented.']);
  });

  it('the introduction names the stakeholder move; the business case keeps the model MODELED, their numbers theirs and our proof ours', () => {
    const arts = prepareArtifacts(base());
    const intro = arts.find((a) => a.kind === 'introduction')!;
    expect(intro.why).toBe('Only Ann Scratch is on YardFlow - Kroger; stakeholder alignment is still only proposed: ask Ann who else must agree.');
    expect(intro.to).toBe('Ann Scratch');
    const bc = arts.find((a) => a.kind === 'business_case')!;
    expect(bc.text).toMatch(/^Business-case inputs \(for your review, not a conclusion\):/);
    expect(bc.text).toMatch(/- Modeled, not measured: about \$1,234,567 a year in hard savings and \$2,345,678 a year in total value across 12 facilities, from our ROI model \(version v3\)\./);
    expect(bc.text).toMatch(/- Model input: Shared engine defaults for this facility mix/);
    expect(bc.text).toMatch(/- Your number: "We pay about forty thousand a month in detention\." \(Ann Scratch\)/);
    expect(bc.text).toContain(YARDFLOW_PROOF);
    expect(YARDFLOW_PROOF).toMatch(/measured/);
    expect(YARDFLOW_PROOF).toMatch(/not a forecast for your yards/);
    expect(bc.problems).toEqual([]);
    for (const a of arts) {
      expect(a.status).toBe('Prepared, not sent');
      expect(a.text).not.toMatch(/\u2014/);
      expect(a.text).not.toMatch(/approved|signed off|accepted/i);
    }
  });

  it('the guard: an em dash, "throughput", an unqualified canon figure or a claimed approval is refused unless it is the buyer\'s own quote', () => {
    expect(artifactProblems('A recap \u2014 with a dash.')).toEqual(['an em dash']);
    expect(artifactProblems('It frees throughput at the gate.')).toEqual(['"throughput" (say production capacity)']);
    expect(artifactProblems('Since legal has approved the pilot, we can start.')).toEqual(['a claim of approval or acceptance the buyer did not make: "legal has approved"']);
    expect(artifactProblems('Thanks: you have approved the pilot scope.')).toEqual(['a claim of approval or acceptance the buyer did not make: "you have approved"']);
    expect(artifactProblems('We cut drop and hook from 48 to 24 minutes.')).toEqual(['a turn time figure without "measured"']);
    expect(artifactProblems('That is worth $1M+ per site.')).toEqual(['a modeled per site figure without "modeled"']);
    const quote = 'Security has approved the gate cameras for the pilot.';
    expect(artifactProblems(`- "${quote}" (Ann Scratch)`, [quote])).toEqual([]);
    expect(artifactProblems(`- "${quote}" (Ann Scratch)`)).toEqual(['a claim of approval or acceptance the buyer did not make: "Security has approved"']);
  });

  it('the one the deal needs now: the recap when their words are confirmed; else an introduction when alignment is planned and one person is on the deal; else pilot criteria once a pilot is agreed; else the business case', () => {
    const pick = (over: Partial<ArtifactInput>) => {
      const i = base(over);
      return nextArtifact(prepareArtifacts(i), i).kind;
    };
    expect(pick({})).toBe('recap');
    expect(pick({ needs: [] })).toBe('introduction');
    expect(pick({ needs: [], deal: { ...DEAL, contacts: [...DEAL.contacts, { name: 'Ben Scratch', title: null }] } })).toBe('pilot_criteria');
    expect(pick({ needs: [], deal: { ...DEAL, contacts: [...DEAL.contacts, { name: 'Ben Scratch', title: null }] }, plan: planFor(DEAL.id, [], []) })).toBe('business_case');
  });

  // Batch item 8 (R53 finding): the recap stayed the next move forever, even after it was copied or written to HubSpot.
  it('a recap copied or written is not the next move again: the deal moves to the introduction, until the buyer says something new', () => {
    const pick = (over: Partial<ArtifactInput>, recapSentAt: string | null) => {
      const i = base(over);
      return nextArtifact(prepareArtifacts(i), { ...i, recapSentAt }).kind;
    };
    expect(pick({}, null)).toBe('recap');
    expect(pick({}, '2026-10-05T12:00:00.000Z')).toBe('introduction');
    const newer = [...base().needs, { id: 'b4', type: 'priority', quote: 'Columbus is first.', who: 'Ann Scratch', at: '2026-10-06T15:00:00.000Z', accountLevel: false }];
    expect(pick({ needs: newer }, '2026-10-05T12:00:00.000Z')).toBe('recap');
    // The last recap sent back is the newer of a copy the seller recorded and an approved HubSpot note written.
    const used = [{ payload: { dealId: DEAL.id, kind: 'recap' }, created_at: new Date('2026-10-04T12:00:00Z') }, { payload: { dealId: 'other', kind: 'recap' }, created_at: new Date('2026-10-09T12:00:00Z') }, { payload: { dealId: DEAL.id, kind: 'introduction' }, created_at: new Date('2026-10-09T12:00:00Z') }];
    const written = { dealId: DEAL.id, origin: { kind: 'recap', id: `${DEAL.id}:x`, label: 'the recap' }, state: 'written', lastAttemptAt: '2026-10-05T12:00:00.000Z', approvedAt: '2026-10-05T11:59:00.000Z' };
    expect(recapSentAtOf(used, [], DEAL.id)).toBe('2026-10-04T12:00:00.000Z');
    expect(recapSentAtOf(used, [written as never], DEAL.id)).toBe('2026-10-05T12:00:00.000Z');
    expect(recapSentAtOf(used, [{ ...written, state: 'failed' } as never], DEAL.id)).toBe('2026-10-04T12:00:00.000Z');
    expect(recapSentAtOf([], [], DEAL.id)).toBeNull();
  });

  it('the deal workspace reads the recorded copy: the recap is next until it is copied, then the introduction', async () => {
    const ACCOUNT = 'Kroger Scratch Co';
    const seed = (audit: unknown[]) =>
      ledgerDb({
        accounts: [ACCOUNT],
        personas: [{ id: 1, name: 'Ann Scratch', title: 'VP Supply Chain Operations', email: 'ann@kroger.example.com', hubspot_contact_id: '81', account_name: ACCOUNT }],
        bids: [{ id: 'b1', account_name: ACCOUNT, type: 'business_problem', raw_buyer_language: 'Trailers sit two hours before a door opens.', normalized_summary: null, contact_email: 'ann@kroger.example.com', human_confirmed: true, supersedes_id: null, confirmed_at: new Date('2026-10-03T15:00:00Z'), captured_at: new Date('2026-10-03T15:00:00Z'), metadata: { scope: { dealId: DEAL.id } } }],
        audit: audit as never,
      });
    const x = { accountName: ACCOUNT, deals: [{ id: DEAL.id, name: DEAL.name, stage: 'Appointment scheduled', contactIds: ['81'] }], commitments: [], now: new Date('2026-10-06T19:00:00Z') };
    expect((await loadDealWorkspace(seed([]).client(), x)).artifacts[DEAL.id].next.kind).toBe('recap');
    const copied = await loadDealWorkspace(seed([{ id: 'u1', kind: 'deal.artifact_used', actor: 'casey', subject_type: 'account', subject_id: ACCOUNT, created_at: new Date('2026-10-05T12:00:00Z'), payload: { dealId: DEAL.id, kind: 'recap', textHash: 'x', how: 'copied' } }]).client(), x);
    expect(copied.unread).toEqual([]);
    expect(copied.artifacts[DEAL.id].next.kind).toBe('introduction');
  });

  it('copying a prepared artifact records it (never a send) so the next move moves on', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, id: 'u1' }), { status: 201 }));
    try {
      const i = base();
      const all = prepareArtifacts(i);
      render(<DealArtifacts next={nextArtifact(all, i)} all={all} accountName="Kroger Scratch Co" dealId={DEAL.id} />);
      fireEvent.click(screen.getAllByTestId('artifact-copy')[0]);
      await waitFor(() => expect(screen.getByTestId('artifact-copied').textContent).toBe('Copied and recorded. Nothing was sent.'));
      expect(fetchSpy).toHaveBeenCalledWith('/api/gap/deals/artifact-used', expect.objectContaining({ method: 'POST', body: JSON.stringify({ accountName: 'Kroger Scratch Co', dealId: DEAL.id, kind: 'recap', textHash: stableHash(all[0].text) }) }));
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('the view: the next artifact first, labeled "Prepared, not sent", with its citations and a copy control that sends nothing', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const i = base();
    const all = prepareArtifacts(i);
    render(<DealArtifacts next={nextArtifact(all, i)} all={all} />);
    const lead = screen.getAllByTestId('deal-artifact').find((x) => x.getAttribute('data-next') === 'true')!;
    expect(lead.getAttribute('data-kind')).toBe('recap');
    expect(screen.getAllByTestId('artifact-status')[0].textContent).toBe('Prepared, not sent');
    fireEvent.click(screen.getAllByTestId('artifact-copy')[0]);
    await waitFor(() => expect(screen.getByTestId('artifact-copied').textContent).toBe('Copied. Nothing was sent.'));
    expect(writeText).toHaveBeenCalledWith(all[0].text);
  });

  it('a flagged text cannot be copied', () => {
    const i = base();
    const all = prepareArtifacts(i).map((a) => (a.kind === 'recap' ? { ...a, problems: ['an em dash'] } : a));
    render(<DealArtifacts next={all[0]} all={all} />);
    expect((screen.getAllByTestId('artifact-copy')[0] as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId('artifact-problems').textContent).toBe('Not ready: an em dash.');
  });
});
