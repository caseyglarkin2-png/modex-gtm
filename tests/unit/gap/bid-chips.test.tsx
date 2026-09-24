/**
 * BID chips (GAP Prospecting OS, Sprint 4, S4-T5).
 *
 * Pins one chip per BID_TYPE, the quote gate (a chip cannot be added
 * without at least three characters of the buyer's words), the unit rule
 * for impact and metric, the emitted draft shape, and removal.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BID_TYPES } from '@/lib/gap/taxonomy';
import {
  BID_ERROR_TEXT,
  BID_QUOTE_MIN_LENGTH,
  BidChips,
  NUMERIC_BID_TYPES,
  toBidDraft,
  validateBidDraft,
  type BidDraft,
} from '@/components/gap/bid-chips';

function panel(overrides: Partial<Parameters<typeof validateBidDraft>[0]> = {}) {
  return { type: 'business_problem' as const, rawBuyerLanguage: '', normalizedSummary: '', numericValue: '', unit: '', ...overrides };
}

describe('validateBidDraft', () => {
  it('requires the buyer quote and at least the minimum length', () => {
    expect(BID_QUOTE_MIN_LENGTH).toBe(3);
    expect(validateBidDraft(panel())).toBe('quote_required');
    expect(validateBidDraft(panel({ rawBuyerLanguage: '   ' }))).toBe('quote_required');
    expect(validateBidDraft(panel({ rawBuyerLanguage: 'ok' }))).toBe('quote_too_short');
    expect(validateBidDraft(panel({ rawBuyerLanguage: 'gate' }))).toBeNull();
  });

  it('requires a unit whenever a numeric value is given on impact or metric', () => {
    expect(NUMERIC_BID_TYPES).toEqual(['impact', 'metric']);
    expect(validateBidDraft(panel({ type: 'metric', rawBuyerLanguage: '45 minutes', numericValue: '45' }))).toBe('unit_required');
    expect(validateBidDraft(panel({ type: 'impact', rawBuyerLanguage: '45 minutes', numericValue: 'lots' }))).toBe('invalid_numeric_value');
    expect(validateBidDraft(panel({ type: 'metric', rawBuyerLanguage: '45 minutes', numericValue: '45', unit: 'minutes per truck' }))).toBeNull();
    expect(validateBidDraft(panel({ type: 'metric', rawBuyerLanguage: '45 minutes' }))).toBeNull();
  });

  it('ignores value and unit on a non-numeric type', () => {
    expect(validateBidDraft(panel({ type: 'objection', rawBuyerLanguage: 'we have a YMS', numericValue: '9' }))).toBeNull();
    expect(toBidDraft(panel({ type: 'objection', rawBuyerLanguage: ' we have a YMS ', numericValue: '9', unit: 'x' }))).toEqual({
      type: 'objection',
      rawBuyerLanguage: 'we have a YMS',
    });
  });

  it('toBidDraft omits empty optionals and carries value and unit as a pair', () => {
    expect(toBidDraft(panel({ type: 'metric', rawBuyerLanguage: '45 minutes a truck', normalizedSummary: ' 45 min dwell ', numericValue: '45', unit: 'minutes per truck' }))).toEqual({
      type: 'metric',
      rawBuyerLanguage: '45 minutes a truck',
      normalizedSummary: '45 min dwell',
      numericValue: 45,
      unit: 'minutes per truck',
    });
  });
});

describe('<BidChips>', () => {
  it('renders one chip per BID type, none pressed', () => {
    render(<BidChips value={[]} onChange={() => {}} />);
    for (const type of BID_TYPES) {
      const chip = screen.getByTestId(`bid-chip-${type}`);
      expect(chip).toHaveAttribute('aria-pressed', 'false');
      expect(chip).toHaveTextContent(type.replace(/_/g, ' '));
    }
    expect(screen.queryByTestId('bid-panel')).toBeNull();
  });

  it('a chip cannot be added without a quote: Add stays disabled and onChange is never called', () => {
    const onChange = vi.fn();
    render(<BidChips value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('bid-chip-business_problem'));
    expect(screen.getByTestId('bid-chip-business_problem')).toHaveAttribute('aria-pressed', 'true');
    const add = screen.getByTestId('bid-add');
    expect(add).toBeDisabled();
    expect(add).toHaveAttribute('title', BID_ERROR_TEXT.quote_required);
    fireEvent.click(add);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Quote'), { target: { value: 'ok' } });
    expect(add).toBeDisabled();
    expect(add).toHaveAttribute('title', BID_ERROR_TEXT.quote_too_short);
    fireEvent.click(add);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('adds the BID with the quote and closes the panel', () => {
    const onChange = vi.fn();
    render(<BidChips value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('bid-chip-business_problem'));
    fireEvent.change(screen.getByLabelText('Quote'), { target: { value: 'Trucks sit at the gate for an hour.' } });
    fireEvent.change(screen.getByLabelText('Summary'), { target: { value: 'Gate dwell' } });
    const add = screen.getByTestId('bid-add');
    expect(add).toBeEnabled();
    fireEvent.click(add);
    expect(onChange).toHaveBeenCalledWith([
      { type: 'business_problem', rawBuyerLanguage: 'Trucks sit at the gate for an hour.', normalizedSummary: 'Gate dwell' },
    ]);
    expect(screen.queryByTestId('bid-panel')).toBeNull();
  });

  it('impact and metric expose value and unit; the unit is required once a value is typed', () => {
    const onChange = vi.fn();
    render(<BidChips value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('bid-chip-business_problem'));
    expect(screen.queryByLabelText('Value')).toBeNull();

    fireEvent.click(screen.getByTestId('bid-chip-metric'));
    expect(screen.getByTestId('bid-panel')).toHaveAttribute('data-bid-type', 'metric');
    fireEvent.change(screen.getByLabelText('Quote'), { target: { value: 'About 45 minutes a truck.' } });
    fireEvent.change(screen.getByLabelText('Value'), { target: { value: '45' } });
    const add = screen.getByTestId('bid-add');
    expect(add).toBeDisabled();
    expect(add).toHaveAttribute('title', BID_ERROR_TEXT.unit_required);
    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'minutes per truck' } });
    expect(add).toBeEnabled();
    fireEvent.click(add);
    expect(onChange).toHaveBeenCalledWith([
      { type: 'metric', rawBuyerLanguage: 'About 45 minutes a truck.', numericValue: 45, unit: 'minutes per truck' },
    ]);
  });

  it('lists added BIDs with a count on the chip and removes one', () => {
    const onChange = vi.fn();
    const value: BidDraft[] = [
      { type: 'business_problem', rawBuyerLanguage: 'Gate is the bottleneck.' },
      { type: 'business_problem', rawBuyerLanguage: 'We lose a shift a week.' },
    ];
    render(<BidChips value={value} onChange={onChange} />);
    expect(screen.getAllByTestId('bid-added')).toHaveLength(2);
    expect(screen.getByTestId('bid-chip-business_problem')).toHaveTextContent('2');
    const first = screen.getAllByTestId('bid-added')[0];
    fireEvent.click(within(first).getByRole('button', { name: 'Remove business problem' }));
    expect(onChange).toHaveBeenCalledWith([{ type: 'business_problem', rawBuyerLanguage: 'We lose a shift a week.' }]);
  });

  it('a seed opens the panel with the quote prefilled and reports consumption', () => {
    const onSeedConsumed = vi.fn();
    render(<BidChips value={[]} onChange={() => {}} seed={{ type: 'impact', quote: 'We pay detention weekly.' }} onSeedConsumed={onSeedConsumed} />);
    expect(screen.getByTestId('bid-panel')).toHaveAttribute('data-bid-type', 'impact');
    expect((screen.getByLabelText('Quote') as HTMLTextAreaElement).value).toBe('We pay detention weekly.');
    expect(onSeedConsumed).toHaveBeenCalled();
  });

  it('disabled blocks opening a panel', () => {
    render(<BidChips value={[]} onChange={() => {}} disabled />);
    fireEvent.click(screen.getByTestId('bid-chip-priority'));
    expect(screen.queryByTestId('bid-panel')).toBeNull();
  });
});
