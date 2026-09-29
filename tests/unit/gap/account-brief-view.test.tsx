/**
 * Release A/D: the ONE account surface. The 30-second glance leads with the next
 * action, every statement shows its truth class and source, a model shows its
 * range and formula, section status is a chip (never a score), and an
 * ungrounded draft hypothesis is labelled as unable to lead.
 */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { AccountBriefView } from '@/components/gap/account-brief';
import { accountHref, accountSlug } from '@/lib/gap/account-intel/href';

const NOW = new Date('2026-09-29T15:00:00.000Z');

const inputs = (over: Partial<AccountInputs> = {}): AccountInputs => ({
  account: { name: 'Acme Foods', tier: 'Tier 1', priorityBand: 'A', vertical: 'cpg', parentBrand: null, hubspotCompanyId: '42' },
  aliases: [],
  domains: ['acmefoods.com'],
  siblings: [],
  watched: true,
  watchReasons: ['Tier 1'],
  facts: [{ id: 'f1', quote: 'Acme Foods will open a new automated distribution center in Reno in 2027.', url: 'https://news.example/reno', title: 'Acme newsroom', publishedAt: '2026-09-10T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event', currentness: null }],
  signals: [],
  lastResearch: null,
  hypotheses: [{ id: 'h1', status: 'draft', observation: 'Acme Foods will open a new automated distribution center in Reno in 2027.', problem: 'My guess is that inbound arrivals at the new DC pile up at the gate.', rootCauses: ['Arrivals are not sequenced'], impacts: [], falsification: ['How are inbound trailers staged?'], whatANoMeans: 'Arrivals already flow.', primarySignalId: 'f1' }],
  bids: [],
  personas: [{ id: 'p1', name: 'Dana Ops', title: 'VP Distribution', doNotContact: false, hasEmail: true, emailStatus: 'valid' }],
  candidates: [],
  memberships: [],
  firstTouches: [],
  conversation: null,
  opportunity: { status: 'CLEAR', detail: 'no open deal', deals: [] },
  pack: null,
  microsite: null,
  facilityFact: null,
  roi: { hardSavingsAnnual: 1_200_000, totalValueAnnual: 3_400_000, facilities: 12, calculatorVersion: null, assumptions: ['Engine defaults'] },
  ...over,
});

describe('account intelligence view', () => {
  it('leads with the next action and the 14-field glance', () => {
    render(<AccountBriefView brief={buildAccountBrief(inputs(), NOW)} />);
    expect(within(screen.getByTestId('brief-next-action')).getByText(/Review the thesis/)).toBeTruthy();
    for (const k of ['motion', 'icpState', 'whyNow', 'network', 'freight', 'bestFact', 'topHypothesis', 'currentTech', 'likelyOwner', 'relationship', 'commercialState', 'biggestUnknown', 'nextQuestion']) expect(screen.getByTestId(`glance-${k}`)).toBeTruthy();
    expect(screen.getByTestId('glance-likelyOwner').textContent).toMatch(/Dana Ops, VP Distribution \(LIKELY/);
  });

  it('shows the truth class and source on each statement, and a model as a range with its formula', () => {
    render(<AccountBriefView brief={buildAccountBrief(inputs(), NOW)} />);
    const econ = screen.getByTestId('brief-section-economics');
    const model = within(econ).getByTestId('brief-model');
    expect(model.textContent).toMatch(/Range: \$1\.2M to \$3\.4M a year/);
    expect(model.textContent).toMatch(/Formula: shared ROI engine/);
    const catalyst = within(screen.getByTestId('brief-section-catalysts')).getAllByTestId('brief-statement')[0];
    expect(catalyst.getAttribute('data-truth')).toBe('VERIFIED_PUBLIC');
    expect(within(catalyst).getByRole('link').getAttribute('href')).toBe('https://news.example/reno');
  });

  it('section status is a chip, never a score', () => {
    const { container } = render(<AccountBriefView brief={buildAccountBrief(inputs(), NOW)} />);
    expect(screen.getByTestId('brief-status-economics').textContent).toBe('MODELED');
    expect(container.textContent).not.toMatch(/score/i);
  });

  it('an ungrounded draft is labelled as unable to lead; the glance says no strong hypothesis', () => {
    render(<AccountBriefView brief={buildAccountBrief(inputs({ facts: [] }), NOW)} />);
    expect(screen.getByTestId('brief-hypothesis').getAttribute('data-grounded')).toBe('false');
    expect(screen.getByTestId('brief-hypothesis').textContent).toMatch(/this draft cannot lead/);
    expect(screen.getByTestId('glance-topHypothesis').textContent).toMatch(/^Top hypothesisNo strong hypothesis yet/);
    expect(screen.getByTestId('brief-next-action').textContent).toMatch(/Do not contact yet/);
  });

  it('long statements are clipped in the glance, never in the section', () => {
    const quote = `Acme Foods will redesign its distribution network. ${'More detail about the program and the sites. '.repeat(10)}`;
    const b = buildAccountBrief(inputs({ facts: [{ ...inputs().facts[0], quote }] }), NOW);
    render(<AccountBriefView brief={b} />);
    expect(screen.getByTestId('glance-bestFact').textContent!.length).toBeLessThan(260);
    expect(screen.getByTestId('brief-section-catalysts').textContent).toContain(quote.trim());
  });

  it('one link scheme for the account, the app-wide slug', () => {
    expect(accountSlug('General Mills, Inc.')).toBe('general-mills-inc');
    expect(accountHref('Nestlé USA')).toBe('/gap/accounts/nestl-usa');
  });
});

describe('review fixes: safe links, refused statements said', () => {
  it('a non-http source URL renders as text, never a link', () => {
    const b = buildAccountBrief(inputs({ facts: [{ ...inputs().facts[0], url: 'data:text/html,<script>x</script>' }] }), NOW);
    render(<AccountBriefView brief={b} />);
    const row = within(screen.getByTestId('brief-section-catalysts')).getAllByTestId('brief-statement')[0];
    expect(within(row).queryByRole('link')).toBeNull();
  });
  it('a withheld statement is announced in its section', () => {
    const b = buildAccountBrief(inputs({ roi: { hardSavingsAnnual: 1_000_000, totalValueAnnual: 1_000_000, facilities: 3, calculatorVersion: null, assumptions: ['x'] } }), NOW);
    render(<AccountBriefView brief={b} />);
    expect(screen.getByTestId('brief-refused-economics').textContent).toMatch(/1 statement was withheld .*modeled point estimate/);
  });
});

describe('glance polish (Release D)', () => {
  it('watch reasons read as words and a glance line never shows a raw URL', () => {
    const b = buildAccountBrief(inputs({ watchReasons: ['audited_for_page', 'gap_thesis'], pack: null }), NOW);
    b.glance.network = '28 facilities (FY2025 Form 10-K, Item 2 Properties. https://www.sec.gov/Archives/edgar/data/40704/x.htm)';
    render(<AccountBriefView brief={b} />);
    expect(screen.getByTestId('glance-icpState').textContent).toMatch(/Watched: audited for a \/for page, has a GAP thesis/);
    expect(screen.getByTestId('glance-network').textContent).not.toMatch(/https?:/);
    expect(screen.getByTestId('glance-network').textContent).toMatch(/Item 2 Properties\.\)$/);
  });
});
