/**
 * Research UX + account boundaries (2026-09-28), on the canonical PepsiCo /
 * Gatik and General Mills cases:
 *   - a continuation shows as ONE fact with a compact source chain (primary
 *     source, currentness confirmed), its folded rows are not shown twice
 *   - truth is not usefulness: the General Mills network redesign is the BEST
 *     FACT, the Brazil divestiture OTHER VERIFIED CONTEXT, both still verified
 *   - the Use button is named by what the server will do
 *   - one section per account; no card from one account inside another's
 *   - the server refuses a fact from another account, both ways, before any
 *     write, and a frozen approved row is never edited (a revision is drafted)
 */
// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const groupsFor = vi.hoisted(() => vi.fn());
vi.mock('@/lib/gap/hypothesis/thesis-groups', async (orig) => ({ ...(await orig<object>()), loadThesisGroups: groupsFor }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { loadEvidenceInbox, researchSections, labelForUse } from '@/lib/gap/research/inbox';
import { EvidenceAccount } from '@/components/gap/evidence-inbox';
import { VERIFIED_EXCERPT } from '@/lib/gap/research/evidence-gate';

const NOW = new Date('2026-09-28T15:00:00.000Z');
const PRIMARY = 'June 8, 2026 PepsiCo and Gatik announced a multi-year strategic partnership to bring autonomous freight into PepsiCo’s North America food and beverage supply chain, marking the largest commercial autonomous freight deployment to date.';
const AUG = 'Gatik moves freight for PepsiCo across roughly 250 retail locations in Texas, Arizona and Arkansas.';
const PEPSI_URL = 'https://www.pepsico.com/en/newsroom/press-releases/2026/pepsico-and-gatik-announce-multi-year-agreement-to-deploy-autonomous-freight-in-north-america';
const FW_JUN = 'https://www.freightwaves.com/news/pepsico-gatik-driverless-trucking-deployment';
const FW_AUG = 'https://www.freightwaves.com/news/gatik-driverless-freight-series-d';
const GM_NETWORK = 'General Mills will redesign the plant and warehouse network behind Cheerios, Blue Buffalo and Pillsbury over the next two years.';
const GM_BRAZIL = 'General Mills entered into a definitive agreement to sell its Brazil business, including two plants.';

const sig = (id: string, account: string, text: string, url: string, observed: string, expires: string, over: Record<string, unknown> = {}) => ({
  id, account_name: account, source_kind: 'evidence_record', source_id: `ev-${id}`, source_type: 'public_secondary', title: `${account} story`, evidence_text: text, evidence_url: url, external_ok: true,
  observed_at: new Date(observed), freshness_expires_at: new Date(expires), metadata: { verified: VERIFIED_EXCERPT, retrievedAt: '2026-09-28T10:00:00Z', researchRunId: 'run-1' }, ...over,
});

const pepPrimary = sig('p-jun8', 'PepsiCo', PRIMARY, PEPSI_URL, '2026-06-08', '2026-10-06', { source_type: 'public_primary' });
const pepFwJun = sig('p-jun9', 'PepsiCo', PRIMARY.replace('June 8, 2026 ', ''), FW_JUN, '2026-06-09', '2026-10-07');
const pepAug = sig('p-aug', 'PepsiCo', AUG, FW_AUG, '2026-08-25', '2026-12-23');
const pepCont = sig('p-cont', 'PepsiCo', PRIMARY, PEPSI_URL, '2026-06-08', '2026-12-23', {
  source_type: 'public_primary',
  source_id: 'continuity:ev-p-jun8:2026-08-25',
  metadata: {
    verified: VERIFIED_EXCERPT, retrievedAt: '2026-09-28T10:00:00Z', researchRunId: 'run-1',
    continuity: { kind: 'ongoing_state', primary: { signalId: 'p-jun8', url: PEPSI_URL, publishedAt: '2026-06-08T00:00:00.000Z' }, currentness: { signalId: 'p-aug', url: FW_AUG, publishedAt: '2026-08-25T17:56:46.000Z', excerpt: AUG }, otherSources: [{ signalId: 'p-jun9', url: FW_JUN, publishedAt: '2026-06-09T14:26:10.000Z' }] },
  },
});
const gmNetwork = sig('g-net', 'General Mills', GM_NETWORK, 'https://www.generalmills.com/news/network', '2026-09-10', '2027-01-08', { source_type: 'public_primary' });
const gmBrazil = sig('g-bra', 'General Mills', GM_BRAZIL, 'https://www.sec.gov/gis-8k.htm', '2026-09-20', '2027-03-19', { source_type: 'public_primary' });

function inboxDb(signals: any[]) {
  return {
    prospectingSignal: { findMany: vi.fn(async () => signals) },
    gapAuditEvent: { findMany: vi.fn(async () => []) },
    hypothesisSignal: { findMany: vi.fn(async () => []) },
    researchRun: { findMany: vi.fn(async () => []) },
  };
}

beforeEach(() => {
  groupsFor.mockReset();
  groupsFor.mockResolvedValue([
    { fingerprint: 'p'.repeat(64), accountName: 'PepsiCo', problemFamily: 'hidden_capacity', members: [{ id: 'pa1', status: 'approved', next: 'revise', problem_hypothesis: 'x' }, { id: 'pa2', status: 'approved', next: 'revise', problem_hypothesis: 'x' }] },
    { fingerprint: 'g'.repeat(64), accountName: 'General Mills', problemFamily: 'network_change', members: [{ id: 'gd1', status: 'draft', next: 'find_evidence', problem_hypothesis: 'y' }] },
  ]);
});

describe('source chain: one fact, primary source and currentness', () => {
  it('the continuation is the ONE PepsiCo fact shown; the rows it folds in are not listed twice', async () => {
    const accounts = await loadEvidenceInbox(inboxDb([pepCont, pepPrimary, pepFwJun, pepAug]), NOW);
    const pep = accounts.find((a) => a.accountName === 'PepsiCo')!;
    expect(pep.ready.map((f) => f.signalId)).toEqual(['p-cont']);
    expect(pep.ready[0].chain).toMatchObject({
      kind: 'primary', basis: 'corroborated',
      source: { label: 'PepsiCo', url: PEPSI_URL },
      currentness: { label: 'freightwaves.com', url: FW_AUG },
      others: [{ label: 'freightwaves.com', url: FW_JUN }],
    });
    expect(pep.bestSignalId).toBe('p-cont');
  });

  it('renders compactly: PRIMARY SOURCE PepsiCo · Jun 8 / CURRENTNESS CONFIRMED freightwaves.com · Aug 25', async () => {
    const [pep] = (await loadEvidenceInbox(inboxDb([pepCont, pepPrimary, pepFwJun, pepAug]), NOW)).filter((a) => a.accountName === 'PepsiCo');
    render(<EvidenceAccount a={pep} now={NOW} />);
    const chain = screen.getByTestId('evidence-chain');
    expect(chain).toHaveTextContent('Primary source');
    expect(chain).toHaveTextContent('PepsiCo · Jun 8');
    expect(chain).toHaveTextContent('Currentness confirmed');
    expect(screen.getByTestId('evidence-currentness')).toHaveTextContent('freightwaves.com · Aug 25');
    expect(chain).toHaveTextContent('from the newer confirmation');
  });

  it('without a continuation the June row alone is shown with its own clock (from publication)', async () => {
    const [pep] = (await loadEvidenceInbox(inboxDb([pepPrimary]), NOW)).filter((a) => a.accountName === 'PepsiCo');
    expect(pep.ready[0].chain).toMatchObject({ currentness: null, basis: 'publication' });
    expect(pep.ready[0].daysLeft).toBe(8);
  });
});

describe('truth is not usefulness (General Mills)', () => {
  it('the network redesign is the BEST FACT; the Brazil divestiture is OTHER VERIFIED CONTEXT; both are shown and verified', async () => {
    const [gm] = (await loadEvidenceInbox(inboxDb([gmBrazil, gmNetwork]), NOW)).filter((a) => a.accountName === 'General Mills');
    expect(gm.ready.map((f) => f.signalId)).toEqual(['g-net', 'g-bra']); // the newer divestiture does not outrank it
    expect(gm.bestSignalId).toBe('g-net');
    render(<EvidenceAccount a={gm} now={NOW} />);
    expect(within(screen.getByTestId('evidence-best')).getByText(/redesign the plant and warehouse network/)).toBeInTheDocument();
    expect(within(screen.getByTestId('evidence-context')).getByText(/sell its Brazil business/)).toBeInTheDocument();
  });

  it('only context left: no best fact is invented', async () => {
    const [gm] = (await loadEvidenceInbox(inboxDb([gmBrazil]), NOW)).filter((a) => a.accountName === 'General Mills');
    expect(gm.bestSignalId).toBeNull();
    expect(gm.ready).toHaveLength(1);
  });
});

describe('the Use button is named by what the server will do', () => {
  it('drafts only: USE IN DRAFT; approved needing revision: USE & CREATE REVISION; both: USE FOR THIS THESIS; nothing usable: none', () => {
    expect(labelForUse(['draft', 'review_required'])).toBe('USE IN DRAFT');
    expect(labelForUse(['approved', 'approved'])).toBe('USE & CREATE REVISION');
    expect(labelForUse(['draft', 'approved'])).toBe('USE FOR THIS THESIS');
    expect(labelForUse([])).toBeNull();
  });

  it('PepsiCo (approved, needs revision) reads USE & CREATE REVISION, and the NEXT action says nothing is approved', async () => {
    const [pep] = (await loadEvidenceInbox(inboxDb([pepCont, pepPrimary, pepFwJun, pepAug]), NOW)).filter((a) => a.accountName === 'PepsiCo');
    expect(pep.theses[0].useLabel).toBe('USE & CREATE REVISION');
    render(<EvidenceAccount a={pep} now={NOW} />);
    expect(screen.getByTestId('evidence-use')).toHaveTextContent('USE & CREATE REVISION');
    expect(screen.getByTestId('evidence-next')).toHaveTextContent('USE & CREATE REVISION, then review the draft. Nothing is approved for you.');
  });
});

describe('account-centric sections', () => {
  it('each account gets only its own theses; General Mills evidence never sits in the PepsiCo section', async () => {
    const accounts = await loadEvidenceInbox(inboxDb([gmNetwork, gmBrazil, pepCont, pepPrimary, pepAug]), NOW);
    const cards = [{ accountName: 'PepsiCo', id: 'card-pep' }, { accountName: 'General Mills', id: 'card-gm' }, { accountName: 'Kroger', id: 'card-kr' }];
    const sections = researchSections(accounts, cards);
    for (const s of sections) {
      expect(s.cards.every((c) => c.accountName === s.account.accountName)).toBe(true);
      expect(s.account.ready.every((f) => f.signalId.startsWith(s.account.accountName === 'PepsiCo' ? 'p-' : 'g-'))).toBe(true);
      expect(s.account.theses.every((t) => (s.account.accountName === 'PepsiCo' ? t.fingerprint[0] === 'p' : t.fingerprint[0] === 'g'))).toBe(true);
    }
    // an account with only a thesis waiting still gets its own section, after the ones with evidence
    expect(sections.map((s) => s.account.accountName).slice(-1)).toEqual(['Kroger']);
    expect(sections.find((s) => s.account.accountName === 'Kroger')!.account.next).toMatch(/No verified fact to use yet/);
  });
});
