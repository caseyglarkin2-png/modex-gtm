/**
 * C44 (the commercial-context audit, 2026-10-08): the action surfaces end in a recoverable state. A request that did
 * not complete (no connection) leaves no spinner and no silent nothing: the button is free again, the line says it
 * may have applied, and Reload and Try again are there; a refusal keeps the surface's own words; a failed server
 * answer retries with the same click and lands on the second try.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IntelPanel } from '@/components/gap/intel-panel';
import { DoneNext } from '@/components/gap/done-next';
import { ObligationActions } from '@/components/gap/obligation-actions';
import { PersonResolve } from '@/components/gap/person-resolve';
import { SourcePlanButton } from '@/components/gap/source-plan-button';
import { DealObjectiveForm } from '@/components/gap/deal-objective-form';
import type { Intelligence, IntelItem } from '@/lib/gap/work/intel';
import { DECISIONS } from '@/lib/gap/work/intel';

const refresh = vi.fn();
const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push }) }));

const item = (over: Partial<IntelItem> & { kind: IntelItem['kind']; id: string; title: string }): IntelItem => ({ key: `${over.kind}:${over.id}`, source: 'news.example', url: null, publishedAt: '2026-06-24T12:00:00.000Z', observedAt: '2026-09-28T12:00:00.000Z', truth: 'historical_observation', line: 'news.example, published Jun 24, 2026.', accountName: 'Kenco', accountHint: null, relevance: null, categories: [], person: null, decisions: DECISIONS, rank: 0, ...over });
const intel: Intelligence = { signals: [item({ kind: 'signal', id: 's-1', title: 'Kenco opens a lab' })], triggers: [], people: [], pursued: [], totals: { signals: 1, triggers: 0, people: 0 } };

const offline = () => vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
const answer = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

afterEach(() => {
  vi.restoreAllMocks();
  refresh.mockReset();
  push.mockReset();
});

describe('C44: Pursue, More, Skip and the rest on the intelligence panel', () => {
  it('no connection: the decision reads unknown with Reload and Try again, the buttons are free again, and the retry lands', async () => {
    const f = offline();
    render(<IntelPanel intel={intel} angles={{}} />);
    const first = screen.getAllByTestId('intel-item')[0];
    fireEvent.click(within(first).getByTestId('intel-decide-pursue'));
    const status = await screen.findByTestId('intel-decided');
    expect(status).toHaveAttribute('data-state', 'unknown');
    expect(status.textContent).toContain('Decided? The request did not complete (no connection). It may have applied. Reload to see; if it did not, try again.');
    expect(status).toHaveAttribute('role', 'alert');
    expect(within(first).getByTestId('intel-decide-pursue')).not.toBeDisabled();
    expect(refresh).not.toHaveBeenCalled();
    f.mockResolvedValueOnce(answer({ ok: true, state: 'queued', line: 'Pursuing the signal. GAP is developing the angle.' }, 200));
    fireEvent.click(screen.getByTestId('intel-decided-retry'));
    await waitFor(() => expect(screen.getByTestId('intel-decided')).toHaveAttribute('data-state', 'queued'));
    expect(screen.getByTestId('intel-decided').textContent).toBe('Pursuing the signal. GAP is developing the angle.');
    expect(f).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String((f.mock.calls[1][1] as RequestInit).body))).toEqual({ key: 'signal:s-1', decision: 'pursue' });
    expect(refresh).toHaveBeenCalled();
  });

  it('an unknown handler is refused in words with no retry consumed; a server failure retries; Reload re-reads the page', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(answer({ error: 'invalid_body', field: 'decision' }, 400));
    render(<IntelPanel intel={intel} angles={{}} />);
    fireEvent.click(screen.getByTestId('intel-decide-skip'));
    await waitFor(() => expect(screen.getByTestId('intel-decided')).toHaveAttribute('data-state', 'refused'));
    expect(screen.getByTestId('intel-decided').textContent).toBe('Not decided: the decision is not valid; fix it and try again.');
    expect(screen.queryByTestId('intel-decided-retry')).toBeNull();
    f.mockResolvedValueOnce(answer({ error: 'db_unavailable' }, 503));
    fireEvent.click(screen.getByTestId('intel-decide-save'));
    await waitFor(() => expect(screen.getByTestId('intel-decided')).toHaveAttribute('data-state', 'failed'));
    expect(screen.getByTestId('intel-decided').textContent).toContain('Not decided: the server failed (db unavailable). Nothing is assumed written; try again.');
    f.mockResolvedValueOnce(answer({}, 504));
    fireEvent.click(screen.getByTestId('intel-decided-retry'));
    await waitFor(() => expect(screen.getByTestId('intel-decided')).toHaveAttribute('data-state', 'unknown'));
    fireEvent.click(screen.getByTestId('intel-decided-reload'));
    expect(refresh).toHaveBeenCalled();
  });
});

describe('C44: DONE, NEXT, Skip, Snooze and the obligations', () => {
  it('DoneNext: a refusal keeps "Could not record it"; no connection says it may have applied with Reload and Try again, and the bar is free', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(answer({ error: 'account_not_found' }, 404));
    render(<DoneNext slug="kenco" index={1} accountName="Kenco" />);
    fireEvent.click(screen.getByTestId('done-next-skip'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/Could not record it \(account_not_found\)\. Nothing changed\./));
    expect(screen.getByTestId('done-next-status')).toHaveAttribute('data-state', 'refused');
    expect(push).not.toHaveBeenCalled();
    f.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    fireEvent.click(screen.getByTestId('done-next-skip'));
    await waitFor(() => expect(screen.getByTestId('done-next-status')).toHaveAttribute('data-state', 'unknown'));
    expect(screen.getByTestId('done-next-status').textContent).toContain('Recorded? The request did not complete (no connection). It may have applied.');
    expect(screen.getByTestId('done-next-skip')).not.toBeDisabled();
    f.mockResolvedValueOnce(answer({ ok: true, state: 'accepted', line: 'Skipped for today.' }, 201));
    fireEvent.click(screen.getByTestId('done-next-status-retry'));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(screen.getByTestId('done-next-status').textContent).toContain('Skipped for today. Back to Work.');
  });

  it('ObligationActions: a transient CRM refusal retries with the same click and nothing changed; done lands on the retry', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(answer({ error: 'deal_unverified', detail: 'HubSpot could not confirm the open deals just now.' }, 409));
    render(<ObligationActions commitmentId="c-1" />);
    fireEvent.click(screen.getByTestId('obligation-done'));
    fireEvent.change(screen.getByTestId('obligation-input'), { target: { value: 'sent the deck' } });
    fireEvent.click(screen.getByTestId('obligation-confirm'));
    await waitFor(() => expect(screen.getByTestId('obligation-status')).toHaveAttribute('data-state', 'refused'));
    expect(screen.getByTestId('obligation-status').textContent).toContain('Not recorded: deal_unverified.');
    expect(screen.getByTestId('obligation-status-retry')).toBeTruthy();
    f.mockResolvedValueOnce(answer({ ok: true, created: true }, 201));
    fireEvent.click(screen.getByTestId('obligation-status-retry'));
    await waitFor(() => expect(screen.getByTestId('obligation-status')).toHaveAttribute('data-state', 'accepted'));
    expect(screen.getByTestId('obligation-status').textContent).toBe('Recorded as done.');
    expect(JSON.parse(String((f.mock.calls[1][1] as RequestInit).body))).toMatchObject({ op: 'status', commitmentId: 'c-1', to: 'done', note: 'sent the deck' });
    expect(refresh).toHaveBeenCalled();
  });
});

describe('C44: the surfaces that used to throw past their busy flag', () => {
  it('PersonResolve, SourcePlanButton and DealObjectiveForm: no connection leaves every button free with an unknown line and a Reload', async () => {
    offline();
    render(
      <>
        <PersonResolve member={{ id: 'm-1', name: 'Dave', accountName: 'Kenco', candidates: [{ personaId: 7, name: 'Dave Kiesling', title: 'VP Ops', accountName: 'Kenco' }] as never }} />
        <SourcePlanButton workSourceId="ws-1" />
        <DealObjectiveForm accountName="Kenco" initial="Learn who owns the yards" />
      </>,
    );
    fireEvent.click(screen.getByTestId('resolve-existing'));
    fireEvent.click(screen.getByTestId('source-plan'));
    fireEvent.click(screen.getByTestId('deal-objective-save'));
    await waitFor(() => expect(screen.getByTestId('person-resolve-status')).toHaveAttribute('data-state', 'unknown'));
    await waitFor(() => expect(screen.getByTestId('source-plan-result')).toHaveAttribute('data-state', 'unknown'));
    await waitFor(() => expect(screen.getByTestId('deal-objective-status')).toHaveAttribute('data-state', 'unknown'));
    expect(screen.getByTestId('person-resolve-status').textContent).toContain('Saved? The request did not complete (no connection).');
    expect(screen.getByTestId('source-plan-result').textContent).toContain('Planned? The request did not complete (no connection).');
    expect(screen.getByTestId('resolve-existing')).not.toBeDisabled();
    expect(screen.getByTestId('source-plan')).not.toBeDisabled();
    expect(screen.getByTestId('source-plan').textContent).toBe('Qualify accounts now');
    expect(screen.getByTestId('deal-objective-save')).not.toBeDisabled();
    expect(screen.getAllByText('Reload to see')).toHaveLength(3);
    expect(screen.getAllByText('Try again')).toHaveLength(3);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('a landed plan says what it qualified and that nothing is sent; a refused resolve keeps its code', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(answer({ accounts: 4, deferredAccounts: 2 }, 200)).mockResolvedValueOnce(answer({ error: 'member_not_found' }, 404));
    render(
      <>
        <SourcePlanButton workSourceId="ws-1" />
        <PersonResolve member={{ id: 'm-1', name: 'Dave', accountName: 'Kenco', candidates: [] as never }} />
      </>,
    );
    fireEvent.click(screen.getByTestId('source-plan'));
    await waitFor(() => expect(screen.getByTestId('source-plan-result')).toHaveAttribute('data-state', 'accepted'));
    expect(screen.getByTestId('source-plan-result').textContent).toBe('Qualified 4 accounts, 2 more next run. Research runs in the background; nothing is sent.');
    fireEvent.click(screen.getByTestId('resolve-leave'));
    await waitFor(() => expect(screen.getByTestId('person-resolve-status')).toHaveAttribute('data-state', 'refused'));
    expect(screen.getByTestId('person-resolve-status').textContent).toContain('Not saved: member not found.');
    expect(f).toHaveBeenCalledTimes(2);
  });
});
