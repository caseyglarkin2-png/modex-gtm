/**
 * C24 + C25 (the commercial-context audit, 2026-10-08): <AnglePromote>, the one control that fires the promotion.
 * Pinned: the offered people are the only choices and the proposed action is marked; a click posts the task, the
 * person and the action and shows the line GAP answers with its link; a 409 shows the competing line, the drafts
 * found and only the offered choices; a choice posts again with it; a seller-edited draft offers revise only; a
 * refusal is shown in words; nothing posts a send.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnglePromote } from '@/components/gap/angle-promote';

afterEach(() => vi.restoreAllMocks());

const people = [{ personaId: 1, name: 'Dave Kiesling', title: 'VP Transportation' }, { personaId: 2, name: 'Craig Morrison', title: 'Asset Leader' }];
const json = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body }) as unknown as Response;

describe('C24/C25: <AnglePromote>', () => {
  it('posts the task, the chosen person and the action; shows the line and the link; a stranger is not offered', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json(200, { ok: true, lane: 'reply', line: "A Gmail draft of the reply is saved in Dave Kiesling's thread. Edit or send it there, or CONFIRM + SEND from GAP; nothing was sent.", href: '/gap/accounts/kenco-logistics/' }));
    render(<AnglePromote taskId="at_1" people={people} proposedAction="email" accountName="Kenco Logistics" />);
    const select = screen.getByTestId('angle-promote-person') as HTMLSelectElement;
    expect([...select.options].map((o) => o.textContent)).toEqual(['Dave Kiesling (VP Transportation)', 'Craig Morrison (Asset Leader)']);
    expect(screen.getByTestId('angle-promote-email').textContent).toBe('Draft the email (proposed)');
    fireEvent.change(select, { target: { value: '2' } });
    fireEvent.click(screen.getByTestId('angle-promote-email'));
    await waitFor(() => expect(screen.getByTestId('angle-promote-line').textContent).toContain('A Gmail draft of the reply is saved'));
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ taskId: 'at_1', personaId: 2, action: 'email' });
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/gap/angles/promote');
    expect(screen.getByRole('link', { name: 'Open it' }).getAttribute('href')).toBe('/gap/accounts/kenco-logistics/');
  });

  it('a 409 shows the competing line, the drafts and only the offered choices; the choice posts again; a seller-edited draft offers revise only', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json(409, { ok: false, reason: 'competing_work', line: '1 existing draft for this person and deal: reuse or revise before a new one is written.', offers: ['reuse', 'fresh'], competing: { found: true, items: [{ id: 'd-1', subject: 'Re: YardFlow and the 2027 roadmap', at: '2026-10-05T10:00:00.000Z', provider: 'gmail', sellerEdited: false }] } }))
      .mockResolvedValueOnce(json(200, { ok: true, lane: 'existing', line: 'Reusing the existing draft "Re: YardFlow and the 2027 roadmap" (in Gmail, 2026-10-05): send or edit it there; nothing new was written.', href: '/gap/accounts/kenco-logistics/' }));
    render(<AnglePromote taskId="at_1" people={people} proposedAction="email" accountName="Kenco Logistics" />);
    fireEvent.click(screen.getByTestId('angle-promote-email'));
    const box = await screen.findByTestId('angle-promote-competing');
    expect(box.textContent).toContain('1 existing draft for this person and deal');
    expect(within(box).getByRole('listitem').textContent).toBe('Re: YardFlow and the 2027 roadmap (Gmail, 2026-10-05)');
    expect(within(box).getAllByRole('button').map((b) => b.textContent)).toEqual(['Reuse that draft', 'Write a fresh one']);
    expect(screen.queryByTestId('angle-promote-choice-revise')).toBeNull();
    fireEvent.click(screen.getByTestId('angle-promote-choice-reuse'));
    await waitFor(() => expect(screen.getByTestId('angle-promote-line').textContent).toContain('Reusing the existing draft'));
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({ taskId: 'at_1', personaId: 1, action: 'email', choice: 'reuse' });
    expect(screen.queryByTestId('angle-promote-competing')).toBeNull();
    // A seller-edited draft: revise is the only offer.
    fetchMock.mockResolvedValueOnce(json(409, { ok: false, reason: 'competing_seller_edit', line: 'An unsent draft carries your own edits: revise it, GAP will not write a second one.', offers: ['revise'], competing: { found: true, items: [{ id: 'r-e', subject: 'Phased 2027 proposal', at: '2026-10-05T11:30:00.000Z', provider: 'gmail', sellerEdited: true }] } }));
    fireEvent.click(screen.getByTestId('angle-promote-email'));
    const box2 = await screen.findByTestId('angle-promote-competing');
    expect(within(box2).getAllByRole('button').map((b) => b.textContent)).toEqual(['Revise it where it is']);
    expect(within(box2).getByRole('listitem').textContent).toContain('with your edits');
    expect(fetchMock.mock.calls.every((c) => !/send/i.test(String(c[0])))).toBe(true);
  });

  it('P2-8: with a writer and no offered people the email stays enabled, defaults to "Reply to <name>" and posts personaId null; an offered person stays an alternative and posts its id', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, { ok: true, lane: 'reply', line: 'A Gmail draft of the reply is saved.', href: null }));
    render(<AnglePromote taskId="at_w" people={[]} proposedAction="email" accountName="Kenco Logistics" writer={{ email: 'dave.kiesling@kencogroup.com', name: 'Dave Kiesling' }} />);
    const box = screen.getAllByTestId('angle-promote').find((n) => n.getAttribute('data-task') === 'at_w')!;
    expect((within(box).getByTestId('angle-promote-email') as HTMLButtonElement).disabled).toBe(false);
    const select = within(box).getByTestId('angle-promote-person') as HTMLSelectElement;
    expect([...select.options].map((o) => o.textContent)).toEqual(['Reply to Dave Kiesling']);
    fireEvent.click(within(box).getByTestId('angle-promote-email'));
    await waitFor(() => expect(within(box).getByTestId('angle-promote-line').textContent).toContain('A Gmail draft of the reply is saved'));
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ taskId: 'at_w', personaId: null, action: 'email' });
    render(<AnglePromote taskId="at_w2" people={people} proposedAction="email" accountName="Kenco Logistics" writer={{ email: 'dave.kiesling@kencogroup.com', name: null }} />);
    const box2 = screen.getAllByTestId('angle-promote').find((n) => n.getAttribute('data-task') === 'at_w2')!;
    const select2 = within(box2).getByTestId('angle-promote-person') as HTMLSelectElement;
    expect([...select2.options].map((o) => o.textContent)).toEqual(['Reply to dave.kiesling@kencogroup.com', 'Dave Kiesling (VP Transportation)', 'Craig Morrison (Asset Leader)']);
    fireEvent.change(select2, { target: { value: '2' } });
    fireEvent.click(within(box2).getByTestId('angle-promote-email'));
    await waitFor(() => expect(fetchMock.mock.calls.length).toBe(2));
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({ taskId: 'at_w2', personaId: 2, action: 'email' });
  });

  it('a refusal is shown in words; with no person on record only research is enabled', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json(400, { ok: false, error: 'gap_sender_unconfigured', detail: null }));
    render(<AnglePromote taskId="at_1" people={people} proposedAction="call" accountName={null} />);
    fireEvent.click(screen.getByTestId('angle-promote-call'));
    await waitFor(() => expect(screen.getByTestId('angle-promote-line').textContent).toBe('GAP did not prepare it: gap_sender_unconfigured.'));
    render(<AnglePromote taskId="at_2" people={[]} proposedAction="research" accountName="Kenco Logistics" />);
    const second = screen.getAllByTestId('angle-promote').find((n) => n.getAttribute('data-task') === 'at_2')!;
    expect(second.textContent).toContain('No person is on record at Kenco Logistics');
    expect((within(second).getByTestId('angle-promote-email') as HTMLButtonElement).disabled).toBe(true);
    expect((within(second).getByTestId('angle-promote-research') as HTMLButtonElement).disabled).toBe(false);
  });
});
