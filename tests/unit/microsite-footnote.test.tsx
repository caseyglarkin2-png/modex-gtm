import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  ConfidenceBadge,
  FootnoteList,
  FootnoteMarker,
  numberFootnotes,
} from '@/components/microsites/footnote';
import type { FootnoteData } from '@/lib/microsites/schema';

describe('numberFootnotes', () => {
  it('numbers each unique footnote in order of first appearance', () => {
    const inputs: FootnoteData[] = [
      { id: 'a', source: 'A', confidence: 'public' },
      { id: 'b', source: 'B', confidence: 'measured' },
      { id: 'c', source: 'C', confidence: 'estimated' },
    ];
    expect(numberFootnotes(inputs).map((f) => f.n)).toEqual([1, 2, 3]);
  });

  it('deduplicates by id, keeping the first occurrence', () => {
    const inputs: FootnoteData[] = [
      { id: 'a', source: 'A', confidence: 'public' },
      { id: 'b', source: 'B', confidence: 'measured' },
      { id: 'a', source: 'A duplicate (ignored)', confidence: 'public' },
      { id: 'c', source: 'C', confidence: 'inferred' },
    ];
    const result = numberFootnotes(inputs);
    expect(result).toHaveLength(3);
    expect(result.map((f) => f.id)).toEqual(['a', 'b', 'c']);
    expect(result[0].source).toBe('A');
  });
});

describe('FootnoteMarker', () => {
  it('renders a bracketed numeric anchor pointing at the footnote anchor', () => {
    // Polish pass replaced raw <sup>2</sup> with bracketed mono "[2]" so
    // markers read as academic-print, not HTML default.
    render(<FootnoteMarker n={2} />);
    const link = screen.getByLabelText('Footnote 2');
    expect(link.getAttribute('href')).toBe('#fn-2');
    expect(link.textContent).toBe('[2]');
  });
});

describe('ConfidenceBadge', () => {
  it('renders the bracketed label for each confidence level', () => {
    // Polish pass replaced saturated rounded pills (Measured / Public data
    // / Estimated / Inferred) with monospace bracketed lowercase tags.
    const { rerender } = render(<ConfidenceBadge confidence="measured" />);
    expect(screen.getByText('[measured]')).toBeDefined();
    rerender(<ConfidenceBadge confidence="public" />);
    expect(screen.getByText('[public]')).toBeDefined();
    rerender(<ConfidenceBadge confidence="estimated" />);
    expect(screen.getByText('[estimated]')).toBeDefined();
    rerender(<ConfidenceBadge confidence="inferred" />);
    expect(screen.getByText('[inferred]')).toBeDefined();
  });
});

describe('FootnoteList', () => {
  it('renders nothing when there are no footnotes', () => {
    const { container } = render(<FootnoteList footnotes={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a numbered ordered list with anchor ids', () => {
    const numbered = numberFootnotes([
      { id: 'ata', source: 'ATA 2024 Yard Ops Survey', confidence: 'public' },
      { id: 'dot', source: 'DOT inspection telemetry', confidence: 'measured', detail: 'Public registry' },
    ]);
    const { container } = render(<FootnoteList footnotes={numbered} />);
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe('fn-1');
    expect(items[1].id).toBe('fn-2');
    expect(screen.getByText('ATA 2024 Yard Ops Survey')).toBeDefined();
    expect(screen.getByText('Public registry')).toBeDefined();
  });
});
