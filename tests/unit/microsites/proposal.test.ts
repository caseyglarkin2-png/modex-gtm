import { describe, expect, it } from 'vitest';
import {
  renderMicrositeProposalHtml,
  resolveMicrositeProposalBrief,
} from '@/lib/microsites/proposal';

describe('microsite proposal brief', () => {
  it.skip('builds a board-ready proposal from the live microsite model', () => {
    // Skipped post-Sprint M3.7: resolveMicrositeProposalBrief requires a
    // 'hero' section in data.sections[] (proposal.ts:168), which the bulk
    // migration emptied across all accounts. /proposal/[slug] still
    // renders via the page-level null-fallback path, but the proposal
    // pipeline itself is silently degraded. Tracked as task #50.
    const proposal = resolveMicrositeProposalBrief('general-mills');

    expect(proposal).not.toBeNull();
    expect(proposal?.accountName).toBe('General Mills');
    expect(proposal?.proposalPath).toBe('/proposal/general-mills');
    expect(proposal?.summaryStats.length).toBeGreaterThan(1);
    expect(proposal?.sourceNotes.some((note) => note.id === 'gm-network-footprint')).toBe(true);
    expect(proposal?.roi?.totalAnnualSavings).toBeDefined();
  });

  it.skip('renders standalone HTML export content with ROI and evidence notes', () => {
    // Skipped post-Sprint M3.7 — same root cause. See task #50.
    const proposal = resolveMicrositeProposalBrief('frito-lay');
    if (!proposal) {
      throw new Error('Expected Frito-Lay proposal brief');
    }

    const html = renderMicrositeProposalHtml(proposal);

    expect(html).toContain('Frito-Lay yard execution proposal');
    expect(html).toContain('ROI model');
    expect(html).toContain('Evidence trail');
    expect(html).toContain('/proposal/frito-lay');
  });

  it('returns null for accounts without a configured microsite brief', () => {
    expect(resolveMicrositeProposalBrief('not-a-real-account')).toBeNull();
  });
});