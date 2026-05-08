import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoShell } from '@/components/microsites/memo-shell';

const baseProps = {
  accountName: 'General Mills',
  preparedDate: '2026-05-08',
  title: 'Yard execution as a network constraint for General Mills',
  authorByline: 'Casey Larkin · YardFlow',
};

describe('MemoShell', () => {
  it('renders the prepared-date eyebrow + title + author byline', () => {
    render(<MemoShell {...baseProps}><p>body</p></MemoShell>);
    expect(screen.getByText(/Private analysis · prepared 2026-05-08/i)).toBeDefined();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('General Mills');
    expect(screen.getByText('Casey Larkin · YardFlow')).toBeDefined();
  });

  it('omits reader eyebrow + context detail when not provided', () => {
    render(<MemoShell {...baseProps}><p>body</p></MemoShell>);
    expect(screen.queryByText(/prepared for/i)).toBeNull();
  });

  it('shows reader eyebrow when set (Sprint M5 personalization slot)', () => {
    render(<MemoShell {...baseProps} readerEyebrow="prepared for Dan Poland"><p>body</p></MemoShell>);
    expect(screen.getByText('prepared for Dan Poland')).toBeDefined();
  });

  it('shows context detail (e.g. footprint summary) under the title', () => {
    render(<MemoShell {...baseProps} contextDetail="47-plant footprint"><p>body</p></MemoShell>);
    expect(screen.getByText('47-plant footprint')).toBeDefined();
  });

  it('renders the needs-hand-tuning banner when flagged', () => {
    render(<MemoShell {...baseProps} needsHandTuning><p>body</p></MemoShell>);
    expect(screen.getByText(/generic analysis/i)).toBeDefined();
  });

  it('does not render the banner when not flagged', () => {
    render(<MemoShell {...baseProps}><p>body</p></MemoShell>);
    expect(screen.queryByText(/generic analysis/i)).toBeNull();
  });

  it('does not include any "book a call" affordance in the chrome', () => {
    render(<MemoShell {...baseProps}><p>body</p></MemoShell>);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText(/book/i)).toBeNull();
    expect(screen.queryByText(/calendar/i)).toBeNull();
  });

  it('renders the footer brand line', () => {
    render(<MemoShell {...baseProps}><p>body</p></MemoShell>);
    expect(screen.getByText(/YardFlow by FreightRoll/i)).toBeDefined();
  });

  it('passes the accent CSS var down for the FootnoteMarker to consume', () => {
    const { container } = render(
      <MemoShell {...baseProps} accentColor="#059669"><p>body</p></MemoShell>,
    );
    const shell = container.querySelector('[data-shell="memo"]');
    expect(shell).not.toBeNull();
    const inlineStyle = shell?.getAttribute('style') ?? '';
    expect(inlineStyle).toContain('--memo-accent');
  });
});
