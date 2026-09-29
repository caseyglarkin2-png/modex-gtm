/**
 * ADD TO GAP (the one front door): links and conversations are delegated to
 * the existing Share to GAP and Buyer Truth Capture flows; a person goes to
 * /api/gap/people; a note in a buyer's words offers Capture; nothing says sent.
 */
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { WorkIntake } from '@/components/gap/work-intake';

const SOURCES = [{ id: 'src1', name: 'Inland26 · Chicago', sourceType: 'conference', relationshipContext: 'Met at Inland26', members: 3, current: true }];

describe('<WorkIntake>', () => {
  it('delegates a link to Share to GAP and a conversation to Buyer Truth Capture (no second flow)', () => {
    render(<WorkIntake sources={SOURCES} />);
    expect(screen.getByTestId('intake-choice-signal')).toHaveAttribute('href', '/gap/signals/new');
    expect(screen.getByTestId('intake-choice-conversation')).toHaveAttribute('href', '/gap/capture');
  });

  it('a person goes to the current source through /api/gap/people; buyer words offer Capture; nothing is sent', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, workSourceId: 'src1', resolution: 'new_candidate', accountName: 'Acme Foods', buyerWords: true }), { status: 201 }));
    render(<WorkIntake sources={SOURCES} />);
    expect(screen.getByTestId('intake-person')).toHaveTextContent('Adding to Inland26 · Chicago (Met at Inland26)');
    fireEvent.change(screen.getByTestId('intake-person-name'), { target: { value: 'Angi Acosta' } });
    fireEvent.change(screen.getByTestId('intake-person-company'), { target: { value: 'Acme Foods' } });
    fireEvent.change(screen.getByTestId('intake-person-note'), { target: { value: 'Asked about small carrier facility impact' } });
    fireEvent.click(screen.getByTestId('intake-person-save'));
    await waitFor(() => expect(screen.getByTestId('intake-person-result')).toBeInTheDocument());
    expect(f.mock.calls[0][0]).toBe('/api/gap/people');
    expect(JSON.parse(String((f.mock.calls[0][1] as RequestInit).body))).toMatchObject({ name: 'Angi Acosta', company: 'Acme Foods', note: 'Asked about small carrier facility impact' });
    expect(screen.getByTestId('intake-person-result')).toHaveTextContent('New person at Acme Foods, staged for your review. Nothing is sent.');
    expect(screen.getByTestId('intake-person-buyer-words')).toBeInTheDocument();
    f.mockRestore();
  });

  it('a list is previewed before it can be added (the add button is disabled until a preview exists)', () => {
    render(<WorkIntake sources={SOURCES} initialMode="people" />);
    expect(screen.getByTestId('intake-commit')).toBeDisabled();
    fireEvent.change(screen.getByTestId('intake-text'), { target: { value: 'Name,Company\nA B,Acme' } });
    expect(screen.getByTestId('intake-commit')).toBeDisabled();
    expect(screen.getByTestId('intake-preview')).not.toBeDisabled();
  });
});
