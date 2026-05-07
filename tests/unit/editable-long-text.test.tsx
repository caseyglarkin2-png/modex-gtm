import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditableLongText } from '@/components/editable-long-text';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}));

describe('<EditableLongText> (S4-T2)', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the current value in display mode and switches to edit mode on pencil click', () => {
    render(<EditableLongText accountSlug="boston-beer-company" field="why_now" currentValue="Pressure is rising." />);
    expect(screen.getByText('Pressure is rising.')).toBeInTheDocument();
    expect(screen.queryByTestId('editable-long-text-edit-why_now')).toBeNull();

    fireEvent.click(screen.getByTestId('editable-long-text-pencil-why_now'));
    expect(screen.getByTestId('editable-long-text-edit-why_now')).toBeInTheDocument();
    expect((screen.getByLabelText('Edit why_now') as HTMLTextAreaElement).value).toBe('Pressure is rising.');
  });

  it('shows the empty fallback when currentValue is null', () => {
    render(<EditableLongText accountSlug="boston-beer-company" field="primo_angle" currentValue={null} emptyFallback="No angle yet" />);
    expect(screen.getByText('No angle yet')).toBeInTheDocument();
  });

  it('saves edits via PATCH and exits edit mode on success', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, changed: [{ field: 'why_now', newValue: 'New text' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    render(<EditableLongText accountSlug="boston-beer-company" field="why_now" currentValue="Old text" />);

    fireEvent.click(screen.getByTestId('editable-long-text-pencil-why_now'));
    const textarea = screen.getByLabelText('Edit why_now');
    fireEvent.change(textarea, { target: { value: 'New text' } });
    fireEvent.click(screen.getByTestId('editable-long-text-save-why_now'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/accounts/boston-beer-company', expect.objectContaining({
        method: 'PATCH',
      }));
    });
    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    expect(JSON.parse(init.body)).toEqual({ why_now: 'New text' });
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Saved'));
  });

  it('does NOT call PATCH on Cancel', () => {
    render(<EditableLongText accountSlug="boston-beer-company" field="why_now" currentValue="Old text" />);
    fireEvent.click(screen.getByTestId('editable-long-text-pencil-why_now'));
    fireEvent.change(screen.getByLabelText('Edit why_now'), { target: { value: 'Should not save' } });
    fireEvent.click(screen.getByTestId('editable-long-text-cancel-why_now'));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('editable-long-text-edit-why_now')).toBeNull();
  });

  it('caps draft length at maxLength characters', () => {
    render(<EditableLongText accountSlug="boston-beer-company" field="why_now" currentValue={null} maxLength={20} />);
    fireEvent.click(screen.getByTestId('editable-long-text-pencil-why_now'));
    const textarea = screen.getByLabelText('Edit why_now') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'a'.repeat(50) } });
    expect(textarea.value).toHaveLength(20);
  });

  it('surfaces a toast error when the PATCH fails', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Boom' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    render(<EditableLongText accountSlug="boston-beer-company" field="why_now" currentValue="Old" />);
    fireEvent.click(screen.getByTestId('editable-long-text-pencil-why_now'));
    fireEvent.change(screen.getByLabelText('Edit why_now'), { target: { value: 'New' } });
    fireEvent.click(screen.getByTestId('editable-long-text-save-why_now'));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    // Stays in edit mode so the operator can retry without retyping
    expect(screen.getByTestId('editable-long-text-edit-why_now')).toBeInTheDocument();
  });
});
