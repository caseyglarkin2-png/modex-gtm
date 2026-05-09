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
  it('renders the cover classification + title + author byline', () => {
    render(<MemoShell {...baseProps}><p>body</p></MemoShell>);
    // M8 redesign — cover classification chrome includes "Private analysis".
    expect(screen.getByText(/Private analysis/i)).toBeDefined();
    // Date appears in cover Date row + colophon "Issued ..." line.
    expect(screen.queryAllByText(/May 8, 2026/).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('General Mills');
    // Author byline appears on cover meta-row + cover Author row.
    expect(screen.queryAllByText('Casey Larkin · YardFlow').length).toBeGreaterThan(0);
  });

  it('omits the prepared-for row on the cover when no readerEyebrow is set', () => {
    render(<MemoShell {...baseProps}><p>body</p></MemoShell>);
    // The "Prepared for" dt is conditional on readerEyebrow.
    expect(screen.queryByText(/^prepared for$/i)).toBeNull();
  });

  it('shows the prepared-for recipient + title when readerEyebrow is set', () => {
    render(
      <MemoShell {...baseProps} readerEyebrow="Prepared for Dan Poland · VP Supply Chain">
        <p>body</p>
      </MemoShell>,
    );
    // "Prepared for" dt rendered, recipient name + title combined into the dd.
    expect(screen.getByText(/^prepared for$/i)).toBeDefined();
    expect(screen.getByText(/Dan Poland · VP Supply Chain/)).toBeDefined();
  });

  it('joins the contextDetail onto the Subject line', () => {
    render(<MemoShell {...baseProps} contextDetail="47-plant footprint"><p>body</p></MemoShell>);
    // Subject row dd is "{accountName} · {contextDetail}".
    expect(screen.getByText(/General Mills · 47-plant footprint/)).toBeDefined();
  });

  it('renders the Draft v0 badge in the cover classification when needsHandTuning', () => {
    render(<MemoShell {...baseProps} needsHandTuning><p>body</p></MemoShell>);
    expect(screen.getByText(/Draft · v0/i)).toBeDefined();
  });

  it('does not render the Draft badge when not flagged', () => {
    render(<MemoShell {...baseProps}><p>body</p></MemoShell>);
    expect(screen.queryByText(/Draft · v0/i)).toBeNull();
  });

  it('does not include any "book a call" affordance in the chrome', () => {
    render(<MemoShell {...baseProps}><p>body</p></MemoShell>);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText(/book/i)).toBeNull();
    expect(screen.queryByText(/calendar/i)).toBeNull();
  });

  it('renders a colophon line with account + document id + issued date', () => {
    render(<MemoShell {...baseProps}><p>body</p></MemoShell>);
    // M8 colophon pattern: "{ACCOUNT} · {DOC-ID} · Issued {date}"
    expect(screen.getByText(/General Mills · YF-GEN-001 · Issued May 8, 2026/)).toBeDefined();
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

  it('emits a Continue affordance pointing at the first toc entry when provided', () => {
    render(
      <MemoShell
        {...baseProps}
        tocEntries={[{ id: 'thesis', num: '§01', label: 'The thesis' }]}
      >
        <p>body</p>
      </MemoShell>,
    );
    const continueLink = screen.getByText(/^continue$/i).closest('a');
    expect(continueLink?.getAttribute('href')).toBe('#thesis');
  });
});
