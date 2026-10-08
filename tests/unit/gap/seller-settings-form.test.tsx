/**
 * X13 (GAP OS sales execution engine, 2026-10-08): the settings page's form. The seller sets the briefing address and
 * New York hour, the command senders, the operating mode and the daily targets in the product (the X03 store behind
 * GET/POST /api/gap/settings). Pinned: the form renders the current values; saving posts exactly the store's shape and
 * shows what was saved; a refusal from the route is shown in words beside the field (the GAP mailbox as the briefing
 * address; execute mode); the legacy pipeline digest is named; no secret appears in the form.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SellerSettingsForm } from '@/components/gap/seller-settings-form';
import type { SellerSettings } from '@/lib/gap/work/settings';

const INITIAL: SellerSettings = { briefingTo: 'casey@freightroll.com', briefingHourNy: 7, commandSenders: ['casey@freightroll.com', 'caseyglarkin2@gmail.com'], mode: 'review', targets: { first_touches: 5 } };

describe('X13: SellerSettingsForm', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('renders the current values, the GAP mailbox it refuses, and the legacy digest note', () => {
    render(<SellerSettingsForm initial={INITIAL} gapMailbox="casey@yardflow.ai" legacyDigest />);
    expect(screen.getByLabelText(/Briefing address/)).toHaveValue('casey@freightroll.com');
    expect(screen.getByLabelText(/hour/i)).toHaveValue(7);
    expect(screen.getByLabelText(/Command senders/)).toHaveValue('casey@freightroll.com, caseyglarkin2@gmail.com');
    expect(screen.getByLabelText(/Review/)).toBeChecked();
    expect(screen.getByLabelText(/First touches per day/)).toHaveValue(5);
    expect(screen.getByLabelText(/Calls per day/)).toHaveValue(null);
    expect(screen.getByText(/casey@yardflow.ai/)).toBeInTheDocument();
    expect(screen.getByText(/pipeline digest/i)).toBeInTheDocument();
    expect(screen.queryByText(/GAP_ACTION_SECRET|secret/i)).toBeNull();
  });

  it('saving posts the store shape (addresses, hour, senders, mode, whole-number targets) and shows what was saved', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ settings: { ...INITIAL, targets: { first_touches: 6, calls: 10 } }, gapMailbox: 'casey@yardflow.ai' }) });
    render(<SellerSettingsForm initial={INITIAL} gapMailbox="casey@yardflow.ai" legacyDigest={false} />);
    fireEvent.change(screen.getByLabelText(/First touches per day/), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText(/Calls per day/), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/gap/settings/');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ briefingTo: 'casey@freightroll.com', briefingHourNy: 7, commandSenders: ['casey@freightroll.com', 'caseyglarkin2@gmail.com'], mode: 'review', targets: { first_touches: 6, calls: 10 } });
    await waitFor(() => expect(screen.getByTestId('settings-saved').textContent).toMatch(/Saved/));
  });

  it('a refusal from the route is shown in words beside the field', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: 'briefing_to_is_gap_mailbox', field: 'briefingTo' }) });
    render(<SellerSettingsForm initial={INITIAL} gapMailbox="casey@yardflow.ai" legacyDigest={false} />);
    fireEvent.change(screen.getByLabelText(/Briefing address/), { target: { value: 'casey@yardflow.ai' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    await waitFor(() => expect(screen.getByTestId('settings-error').textContent).toMatch(/GAP mailbox/i));
    expect(screen.getByTestId('settings-error').textContent).toMatch(/Briefing address/);
  });
});
