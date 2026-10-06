/**
 * V2 NOW + BRIEF render. The fold order (state, NEXT with its control, WHO, WHY NOW, then the gap), seller labels only
 * (no enums, no "eligible as outreach evidence", no "Wrong if" outside THINK), the labelled private line, Listen fed the
 * private-free text, and BRIEF sections with "View details" one click deeper.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectEngagement, projectRelationship, type AccountContext } from '@/lib/gap/context/context';
import { projectNow } from '@/lib/gap/context/now';
import { projectBrief } from '@/lib/gap/context/brief';
import { AccountNowView } from '@/components/gap/account-now';
import { AccountBriefSections } from '@/components/gap/account-brief-sections';

const NOW = new Date('2026-10-02T12:00:00Z');
const fact = { id: 'f1', quote: 'Acme Foods will open a new distribution center in Reno in 2027.', url: 'https://news.example/reno', title: 'news', publishedAt: '2026-09-20T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
const hyp = { id: 'h1', status: 'draft', observation: fact.quote, problem: 'My guess is that inbound arrivals pile up at the gate.', rootCauses: [], impacts: [], falsification: ['How are arrivals staged?'], whatANoMeans: 'Arrivals flow.', primarySignalId: 'f1' };
const i: AccountInputs = {
  account: { name: 'Acme Foods', tier: 'Tier 1', priorityBand: 'A', vertical: 'cpg', parentBrand: null, hubspotCompanyId: '42' },
  aliases: [], domains: ['acmefoods.com'], siblings: [], watched: true, watchReasons: ['priority'],
  facts: [fact], signals: [], lastResearch: null, hypotheses: [hyp], bids: [], personas: [{ id: 1, name: 'Dana Trans', title: 'Director of Transportation', doNotContact: false, hasEmail: true, emailStatus: 'valid' }], candidates: [], memberships: [], firstTouches: [], conversation: null,
  opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
};
const ctx: AccountContext = {
  relationship: projectRelationship({ restriction: null, account: { best_intro_path: null, owner: 'Casey' }, personas: [], memberships: [], meetings: [], emails: [{ to_email: 'dana@acmefoods.com', subject: 'Yard question', sent_at: '2026-09-01', reply_count: 0 }], now: NOW }),
  engagement: projectEngagement([{ path: '/for/acme', sections_viewed: ['a', 'b', 'roi'], cta_ids: ['book'], scroll_depth_pct: 90, duration_seconds: 300, updated_at: '2026-09-25', human: true }], NOW),
  history: [], assets: [], legacyNote: { text: 'Prep MODEX booth visit', at: '2026-03-01' },
};

describe('NOW render', () => {
  it('the fold order, seller labels only, the labelled private line, Listen without it', () => {
    const brief = buildAccountBrief(i, NOW);
    const v = projectNow(brief, ctx, i, NOW);
    const { container } = render(<AccountNowView v={v} nextHref="/gap/preview/h1" nextLabel="Review the thesis and first touch" links={[]} />);
    // UX-04: THE GAP shows only when the buyer confirmed something (nothing here), so it is absent, never out of order.
    const order = ['now-state', 'now-next', 'now-who', 'now-why-now', 'now-ask'].map((id) => container.innerHTML.indexOf(`data-testid="${id}"`));
    expect(order.every((x, k) => x > -1 && (k === 0 || x > order[k - 1]))).toBe(true);
    expect(screen.queryByTestId('now-gap')).toBeNull();
    expect(screen.queryByTestId('now-impact')).toBeNull();
    expect(screen.getByTestId('now-next-control').getAttribute('href')).toBe('/gap/preview/h1');
    expect(screen.getByTestId('now-private').textContent).toMatch(/^Private: interest signal, never mention to the buyer/);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/FACT_LED|NO_GOOD_MOTION|VERIFIED_PUBLIC|INFERENCE|Eligible as outreach evidence|ICP \/ state|Motion:/);
    expect(text.match(/Wrong if/g)?.length ?? 0).toBeLessThanOrEqual(1);
    expect(text).not.toMatch(/Prep MODEX booth visit/);
    expect(v.listen).not.toMatch(/Private|session|CTA/);
  });
});

describe('BRIEF render', () => {
  it('sections with seller tags and View details into SOURCES; the legacy note is a dated legacy line, never the next step', () => {
    const brief = buildAccountBrief(i, NOW);
    render(<AccountBriefSections sections={projectBrief(brief, ctx, i, NOW)} sourcesHref="/gap/accounts/acme-foods?view=sources" deep={{ assets: { label: 'Content Studio', href: '/studio?account=Acme%20Foods' } }} />);
    expect(screen.getByTestId('brief-v2-network')).toBeTruthy();
    expect(screen.getByTestId('brief-v2-people').textContent).toMatch(/Primary operator: Dana Trans \(Director of Transportation\)/);
    expect(screen.getByTestId('brief-v2-private').textContent).toMatch(/never mention to the buyer/);
    expect(screen.getByTestId('brief-v2-commercial').textContent).toMatch(/Legacy note \(MODEX-era record, 2026-03-01; never the next step\): Prep MODEX booth visit/);
    expect(screen.getAllByText(/View details/)[0].getAttribute('href')).toMatch(/^\/gap\/accounts\/acme-foods\?view=sources#brief-section-/);
  });
});
