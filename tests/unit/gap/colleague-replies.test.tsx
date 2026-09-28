/**
 * Phase 2 D5 (colleague replies in triage), D6 (a triaged HubSpot reply clears
 * the account hold), the capture routes and the phone capture UI.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { listReplies } from '@/lib/gap/replies/list';
import { accountRepliedRecently } from '@/lib/gap/replies/account-reply';
import { CaptureFlow } from '@/components/gap/capture-flow';

const T = (m: number) => new Date(Date.UTC(2026, 8, 28, 12, m));

function repliesDb(inbound: any[], dispositions: any[] = []) {
  return {
    sequenceEnrollment: { findMany: vi.fn(async () => []) },
    persona: {
      findMany: vi.fn(async () => [
        { id: 7, email: 'maria@pepsico.com', account_name: 'PepsiCo', hubspot_contact_id: null, prospecting_hypotheses: [{ id: 'H-PEP', status: 'active', problem_family: 'hidden_capacity', created_at: T(0) }] },
      ]),
    },
    inboundMessage: {
      findMany: vi.fn(async ({ where }: any) =>
        where.from_email?.in ? inbound.filter((r) => where.from_email.in.includes(r.from_email)) : inbound.filter((r) => (where.OR ?? []).some((o: any) => r.from_email.endsWith(o.from_email.endsWith))),
      ),
    },
    conversationDisposition: { findMany: vi.fn(async ({ where }: any) => dispositions.filter((d) => where.source_id.in.includes(d.source_id))) },
  };
}
const row = (id: string, from: string, subject = 'Re: yards', m = 5) => ({ id, source: 'gmail', from_email: from, subject, body_text: 'Forwarding to our DC team.', body_html: null, snippet: null, received_at: T(m) });

describe('D5: account-level / colleague replies appear in triage', () => {
  it('a reply from someone else at the account domain is listed, labelled account-level, with its OWN sender (never the colleague GAP emailed)', async () => {
    const r = await listReplies(repliesDb([row('m1', 'maria@pepsico.com', 'Re: yards', 1), row('m2', 'assistant@pepsico.com', 'Re: yards', 9)]));
    const col = r.items.find((i) => i.id === 'm2')!;
    expect(col).toMatchObject({ accountLevel: true, contactEmail: 'assistant@pepsico.com', personaId: null, accountName: 'PepsiCo', hypothesisId: 'H-PEP' });
    expect(r.items.find((i) => i.id === 'm1')).toMatchObject({ accountLevel: false, contactEmail: 'maria@pepsico.com', personaId: 7 });
    expect(r.items.map((i) => i.id)).toEqual(['m2', 'm1']);
  });

  it('auto-replies and already-dispositioned colleague replies are not listed as undispositioned work', async () => {
    const r = await listReplies(repliesDb([row('m3', 'ooo@pepsico.com', 'Automatic reply: out of office'), row('m4', 'boss@pepsico.com')], [{ id: 'd', source_kind: 'inbound_message', source_id: 'm4', human_confirmed: true, created_by: 'casey', ai_suggested: null }]));
    expect(r.items.filter((i) => i.accountLevel)).toEqual([]);
  });
});

describe('D6: hold clearing', () => {
  it('a human disposition of a reply that arrived through HubSpot clears the account hold', async () => {
    const inbound = [{ id: 'hs:991', from_email: 'boss@pepsico.com', subject: 'Re: yards', received_at: T(1) }];
    const prisma = (dispositions: any[]) => ({
      inboundMessage: { findMany: vi.fn(async () => inbound) },
      conversationDisposition: { findMany: vi.fn(async ({ where }: any) => dispositions.filter((d) => where.source_kind.in.includes(d.source_kind) && where.source_id.in.includes(d.source_id))) },
    });
    expect(await accountRepliedRecently(prisma([]), 'maria@pepsico.com', T(30))).toMatchObject({ id: 'hs:991' });
    expect(await accountRepliedRecently(prisma([{ source_kind: 'hubspot_engagement', source_id: 'hs:991' }]), 'maria@pepsico.com', T(30))).toBeNull();
  });
});

describe('<CaptureFlow> (phone capture)', () => {
  it('saves the raw note and shows candidates that are NOT truth until confirmed; confirm sends the thesis and the speaker', async () => {
    const view = {
      id: 'cap1',
      accountName: 'PepsiCo',
      accountHint: null,
      personaId: 7,
      context: 'meeting',
      rawText: 'Maria: We lose about 3 hours per shift hunting for trailers.',
      createdAt: '',
      createdBy: 'casey',
      candidates: [{ id: 'c1', quote: 'We lose about 3 hours per shift hunting for trailers.', type: 'metric', cues: ['3 hours'], decision: null }],
      meetings: [],
    };
    const f = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, init?: any) => {
      const u = String(url);
      if (u.startsWith('/api/gap/capture/lookup?account=')) return new Response(JSON.stringify({ people: [{ id: 7, name: 'Maria', title: 'VP' }], hypotheses: [{ id: 'h-pep', status: 'active', problem_family: 'hidden_capacity', primary_persona_id: 7 }] }));
      if (u.startsWith('/api/gap/capture/lookup?q=')) return new Response(JSON.stringify({ accounts: ['PepsiCo'], people: [] }));
      if (u === '/api/gap/captures' && init?.method === 'POST') return new Response(JSON.stringify(view), { status: 201 });
      if (u === '/api/gap/captures/cap1') return new Response(JSON.stringify({ ok: true, bidId: 'b1', capture: { ...view, candidates: [{ ...view.candidates[0], decision: { kind: 'confirmed', bidId: 'b1', type: 'metric', by: 'casey' } }] } }));
      return new Response('{}', { status: 404 });
    });
    render(<CaptureFlow />);
    fireEvent.change(screen.getByPlaceholderText('Account or person'), { target: { value: 'Peps' } });
    fireEvent.click(await screen.findByTestId('capture-pick-account'));
    fireEvent.change(screen.getByTestId('capture-text'), { target: { value: view.rawText } });
    fireEvent.click(screen.getByTestId('capture-save'));
    expect(await screen.findByTestId('capture-candidates')).toHaveTextContent('Candidate buyer truth (not truth until you confirm)');
    const save = f.mock.calls.find((c) => String(c[0]) === '/api/gap/captures')!;
    expect(JSON.parse(String((save[1] as RequestInit).body))).toEqual({ accountName: 'PepsiCo', accountHint: null, personaId: null, context: 'meeting', rawText: view.rawText });
    await waitFor(() => expect(screen.getByLabelText('Thesis')).toHaveValue('h-pep'));
    fireEvent.click(screen.getByTestId('candidate-confirm'));
    await waitFor(() => expect(screen.getByTestId('capture-candidate')).toHaveAttribute('data-state', 'confirmed'));
    const decide = f.mock.calls.find((c) => String(c[0]) === '/api/gap/captures/cap1')!;
    expect(JSON.parse(String((decide[1] as RequestInit).body))).toMatchObject({ op: 'decide', candidateId: 'c1', decision: 'confirm', hypothesisId: 'h-pep', personaId: 7 });
    f.mockRestore();
  });

  it('an unlinked note asks Casey to choose the account before anything can be confirmed', async () => {
    const view = { id: 'cap2', accountName: null, accountHint: 'pepsi guy', personaId: null, context: 'conference', rawText: 'x', createdAt: '', createdBy: 'c', candidates: [{ id: 'c1', quote: 'We lose trailers every day in the yard.', type: 'business_problem', cues: [], decision: null }], meetings: [] };
    render(<CaptureFlow initial={view as never} />);
    expect(screen.getByTestId('capture-unlinked')).toHaveTextContent('Not linked to an account yet');
    expect(screen.getByTestId('candidate-confirm')).toBeDisabled();
  });
});
