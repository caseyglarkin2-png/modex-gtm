import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MicrositeShell } from '@/components/microsites/microsite-shell';

describe('MicrositeShell', () => {
  it('renders thesis, navigation, variants, and persistent CTAs', () => {
    render(
      <MicrositeShell
        accountName="Frito-Lay"
        accentColor="#06B6D4"
        contextLabel="For Brian Watson · Frito-Lay"
        contextDetail="Vice President of Supply Chain"
        framingNarrative="This brief is tuned to network standardization and throughput."
        title="Brian Watson operating brief"
        summary="A yard-first read on the network constraint."
        thesis="The network is only as fast as the yard handoff."
        focusPoints={['Network visibility', 'Trailer staging', 'Dock throughput']}
        navItems={[
          { id: 'hero-1', label: 'Opportunity' },
          { id: 'proof-2', label: 'Proof' },
        ]}
        primaryCta={{ href: 'https://example.com', label: 'Book a Meeting at MODEX' }}
        statusLabel="A-Band · Supply Chain"
        variantLinks={[
          { href: '/for/frito-lay', label: 'Overview', slug: 'overview' },
          { href: '/for/frito-lay/brian-watson', label: 'Brian Watson', slug: 'brian-watson', active: true },
        ]}
      >
        <div>Section body</div>
      </MicrositeShell>,
    );

    expect(screen.getByText('Brian Watson operating brief')).toBeInTheDocument();
    expect(screen.getByText('Commercial Thesis')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Opportunity' })).toHaveAttribute('href', '#hero-1');
    expect(screen.getAllByRole('link', { name: 'Book a Meeting at MODEX' })).toHaveLength(4);
    expect(screen.getByRole('link', { name: 'Brian Watson' })).toHaveAttribute('data-ms-variant-slug', 'brian-watson');
    expect(screen.getByText('Section body')).toBeInTheDocument();
  });
});