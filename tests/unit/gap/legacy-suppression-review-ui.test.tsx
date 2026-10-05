/**
 * Legacy suppression review panel (WHO truth, 2026-10-05): the seller reads WHY this person is blocked (the lines
 * and the source table), WHAT WOULD HAVE TO BE TRUE, the later-delivery evidence and the human decisions. The
 * CLEAR LEGACY LOCAL FLAG button exists ONLY when the review allows it, and the click needs an inline confirmation
 * that names exactly what it touches. When not allowed, the class and why are a sentence and there is no button.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LegacySuppressionReview } from '@/components/gap/legacy-suppression-review';
import type { SuppressionReview } from '@/lib/gap/suppression/legacy-review';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const allowed = (over: Partial<SuppressionReview> = {}): SuppressionReview => ({
  personaId: 13,
  name: 'Isaac Scott',
  accountName: 'PepsiCo',
  email: 'isaac.scott@pepsico.com',
  class: 'LEGACY_CONFLICT',
  sources: [
    { source: 'modex_flag', verdict: 'hit', detail: 'do_not_contact is true on the GAP record', hard: false },
    { source: 'modex_email_status', verdict: 'hit', detail: "email_status is 'bounced'", hard: false },
    { source: 'unsubscribed_emails', verdict: 'clear', detail: 'no unsubscribe row for this address', hard: false },
    { source: 'hubspot_optout', verdict: 'clear', detail: 'hs_email_optout is not set on HubSpot contact 219885493392', hard: false },
    { source: 'hubspot_bounce', verdict: 'clear', detail: 'no bad address', hard: false },
    { source: 'clawd_contract', verdict: 'hit', detail: 'blocked, keys exactly [modex_do_not_contact]', hard: false },
    { source: 'email_log_bounces', verdict: 'hit', detail: '2 bounces on record (bounce type never recorded)', at: '2026-03-27T10:05:00.000Z', hard: false },
    { source: 'email_log_deliveries', verdict: 'clear', detail: '3 deliveries to this exact address after the last bounce', at: '2026-03-30T15:00:00.000Z', hard: false },
    { source: 'gap_ledger', verdict: 'clear', detail: 'no prior review', hard: false },
    { source: 'override_history', verdict: 'clear', detail: 'never cleared before', hard: false },
    { source: 'gmail_dsn', verdict: 'not_read', detail: 'Gmail was not read for this review', hard: false },
  ],
  whyBlocked: ['The local GAP flag is set: do_not_contact is true and the email status reads bounced.', '3 messages were delivered to the same address after the last bounce on 2026-03-27. The address accepts mail.'],
  whatWouldClear: ["Casey's confirmed click on CLEAR LEGACY LOCAL FLAG. Every hard-safety source is clean and the only block is the stale local flag."],
  laterDeliveries: [
    { at: '2026-03-27T15:00:00.000Z', subject: 'Re: Frito-Lay yards', status: 'delivered' },
    { at: '2026-03-28T15:00:00.000Z', subject: 'Re: Frito-Lay yards', status: 'delivered' },
    { at: '2026-03-30T15:00:00.000Z', subject: 'Frito-Lay yards', status: 'delivered' },
  ],
  lastBounceAt: '2026-03-27T10:05:00.000Z',
  humanDecisions: [{ kind: 'person.imported_from_hubspot', actor: 'casey@freightroll.com', at: '2026-10-05T17:00:00.000Z', note: null }],
  clear: { allowed: true, touches: ['personas.do_not_contact', 'personas.email_status'], why: 'Allowed: every hard-safety source is clean and the only block is the stale local flag.' },
  readAt: '2026-10-05T18:00:00.000Z',
  ...over,
});

const confirmed = (): SuppressionReview =>
  allowed({
    class: 'CONFIRMED_SUPPRESSION',
    sources: allowed().sources.map((s) => (s.source === 'unsubscribed_emails' ? { ...s, verdict: 'hit', hard: true, detail: 'an unsubscribe row exists', at: '2026-04-01T00:00:00.000Z' } : s)),
    whyBlocked: ["Isaac Scott is on the unsubscribe list (since 2026-04-01). That is the recipient's own decision and this surface can never clear it."],
    whatWouldClear: ['Nothing on this surface. A real unsubscribe, HubSpot opt-out, hard bounce or clawd suppression is cleared only by the recipient or the owner at that source, never here.'],
    clear: { allowed: false, touches: [], why: 'Not allowed: a hard-safety source says do not contact. That can never be cleared here.' },
  });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LegacySuppressionReview', () => {
  it('reads the review on mount and renders why, the source table with every verdict, what would clear it, the deliveries and the decisions', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (String(url) === '/api/gap/personas/13/suppression-review') return jsonResponse(allowed());
      throw new Error(`unexpected ${String(url)}`);
    });
    render(<LegacySuppressionReview personaId={13} name="Isaac Scott" accountName="PepsiCo" />);
    await waitFor(() => expect(screen.getByTestId('suppression-class')).toHaveTextContent(/Legacy local flag, contradicted by later deliveries/));
    expect(fetchMock.mock.calls[0][1]?.method ?? 'GET').toBe('GET');
    const panel = screen.getByTestId('suppression-review');
    expect(within(panel).getByText(/Why this person is blocked/)).toBeInTheDocument();
    expect(screen.getByTestId('suppression-why')).toHaveTextContent(/3 messages were delivered to the same address after the last bounce/);
    expect(within(panel).getByText(/What would have to be true to clear it/)).toBeInTheDocument();
    expect(within(panel).getByText(/Casey's confirmed click on CLEAR LEGACY LOCAL FLAG/)).toBeInTheDocument();
    const table = within(panel).getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(12);
    expect(within(table).getByText('Unsubscribe list').closest('tr')).toHaveTextContent(/Clear/);
    expect(within(table).getByText('clawd cross-plane contract (five legs)').closest('tr')).toHaveTextContent(/Blocks/);
    expect(within(table).getByText('Gmail delivery failure notices').closest('tr')).toHaveTextContent(/Not read/);
    expect(within(panel).getByText(/Delivered to the same address after the last bounce \(2026-03-27\)/)).toBeInTheDocument();
    expect(within(panel).getAllByText(/Re: Frito-Lay yards/)).toHaveLength(2);
    expect(within(panel).getByText(/imported from hubspot/)).toBeInTheDocument();
    expect(panel.textContent).not.toMatch(/—/);
  });
  it('when allowed: the button opens an inline confirmation naming exactly what it touches; Keep blocked closes it without a POST', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse(allowed()));
    render(<LegacySuppressionReview personaId={13} name="Isaac Scott" accountName="PepsiCo" />);
    const button = await screen.findByTestId('suppression-clear');
    expect(button).toHaveTextContent(/Clear legacy local flag/i);
    expect(screen.queryByTestId('suppression-confirm')).toBeNull();
    fireEvent.click(button);
    const confirm = screen.getByTestId('suppression-confirm');
    expect(confirm).toHaveTextContent('Clears only the local do-not-contact flag and the historical bounced status on this GAP record. It never touches an unsubscribe, a HubSpot opt-out, a hard bounce or clawd.');
    expect(confirm).toHaveTextContent(/personas\.do_not_contact/);
    expect(confirm).toHaveTextContent(/personas\.email_status/);
    fireEvent.click(screen.getByTestId('suppression-cancel'));
    expect(screen.queryByTestId('suppression-confirm')).toBeNull();
    expect(fetchMock.mock.calls.filter((c) => c[1]?.method === 'POST')).toHaveLength(0);
  });
  it('Confirm clear POSTs confirmed true with the expected email, shows the outcome sentence, re-reads the review and calls onCleared', async () => {
    const after = allowed({ class: 'CLEAR', whyBlocked: ['No suppression on any plane for Isaac Scott. Nothing to clear.'], whatWouldClear: [], clear: { allowed: false, touches: [], why: 'Not needed: nothing is blocked.' } });
    let reads = 0;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      if (init?.method === 'POST') {
        expect(String(url)).toBe('/api/gap/personas/13/suppression-review');
        expect(JSON.parse(String(init.body))).toEqual({ confirmed: true, expectedEmail: 'isaac.scott@pepsico.com' });
        return jsonResponse({ ok: true, auditId: 'aud_1', before: { do_not_contact: true, email_status: 'bounced' }, after: { do_not_contact: false, email_status: 'unverified' }, review: allowed() });
      }
      reads += 1;
      return jsonResponse(reads === 1 ? allowed() : after);
    });
    const onCleared = vi.fn();
    render(<LegacySuppressionReview personaId={13} name="Isaac Scott" accountName="PepsiCo" onCleared={onCleared} />);
    fireEvent.click(await screen.findByTestId('suppression-clear'));
    fireEvent.click(screen.getByTestId('suppression-confirm-button'));
    await waitFor(() => expect(screen.getByTestId('suppression-outcome')).toHaveTextContent(/Cleared the legacy local flag on Isaac Scott's GAP record \(isaac\.scott@pepsico\.com\): do_not_contact is now false and the email status reads unverified\. Nothing else was touched/));
    await waitFor(() => expect(screen.getByTestId('suppression-class')).toHaveTextContent(/^Clear/));
    expect(onCleared).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('suppression-clear')).toBeNull();
    expect(fetchMock.mock.calls.filter((c) => c[1]?.method === 'POST')).toHaveLength(1);
  });
  it('a 409 refusal shows the kept-blocked sentence with the reason and re-reads the review; nothing is cleared', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      if (init?.method === 'POST') return jsonResponse({ ok: false, reason: 'hard_suppression', detail: 'a hard-safety source says do not contact (Unsubscribe list). That can never be cleared here.', review: confirmed() }, 409);
      return jsonResponse(allowed());
    });
    render(<LegacySuppressionReview personaId={13} name="Isaac Scott" accountName="PepsiCo" />);
    fireEvent.click(await screen.findByTestId('suppression-clear'));
    fireEvent.click(screen.getByTestId('suppression-confirm-button'));
    await waitFor(() => expect(screen.getByTestId('suppression-outcome')).toHaveTextContent(/Kept blocked: a hard-safety source says do not contact \(Unsubscribe list\)\. That can never be cleared here\./));
    expect(screen.getByTestId('suppression-outcome')).toHaveAttribute('role', 'alert');
  });
  it('when not allowed: the class and why read as a sentence and there is NO clear button and NO confirmation', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse(confirmed()));
    render(<LegacySuppressionReview personaId={13} name="Isaac Scott" accountName="PepsiCo" />);
    await waitFor(() => expect(screen.getByTestId('suppression-class')).toHaveTextContent(/Confirmed suppression/));
    expect(screen.getByTestId('suppression-class')).toHaveTextContent(/A hard-safety source says do not contact\. This surface can never clear it\./);
    expect(screen.getByTestId('suppression-why')).toHaveTextContent(/on the unsubscribe list/);
    expect(screen.getByText(/Not allowed: a hard-safety source says do not contact/)).toBeInTheDocument();
    expect(screen.queryByTestId('suppression-clear')).toBeNull();
    expect(screen.queryByTestId('suppression-confirm')).toBeNull();
    expect(screen.queryByTestId('suppression-confirm-button')).toBeNull();
  });
  it('an unresolved review names the missing evidence and offers no button; a failed read says so', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => jsonResponse(allowed({ class: 'UNRESOLVED', laterDeliveries: [], whatWouldClear: ['At least one delivery, open, click or reply to isaac.scott@pepsico.com dated after the last bounce (2026-03-27), or a verified current address.'], clear: { allowed: false, touches: [], why: 'Not allowed: the evidence is missing.' } })));
    const { unmount } = render(<LegacySuppressionReview personaId={13} name="Isaac Scott" accountName="PepsiCo" />);
    await waitFor(() => expect(screen.getByTestId('suppression-class')).toHaveTextContent(/Not resolved/));
    expect(screen.getByText(/At least one delivery, open, click or reply to isaac\.scott@pepsico\.com/)).toBeInTheDocument();
    expect(screen.queryByTestId('suppression-clear')).toBeNull();
    expect(screen.getByText(/No delivery to this address is on record after the last bounce/)).toBeInTheDocument();
    unmount();
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => jsonResponse({ error: 'not_found' }, 404));
    render(<LegacySuppressionReview personaId={999} name="Nobody" accountName="PepsiCo" />);
    await waitFor(() => expect(screen.getByTestId('suppression-review')).toHaveTextContent(/could not be read \(not found\)/));
  });
});
