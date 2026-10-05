/**
 * Owner-resolution UI (2026-10-05): NOW renders a control beside every line that used to be an instruction (ADD TO
 * GAP for a HubSpot-only WHO, the outstanding-draft remediation, the historical contact, THIS PERSON LEFT); the
 * hypothesis drawer shows owner resolution for an approved row with no person and never the raw no_persona; the
 * owner panel ranks, lets Casey choose, and never picks for him.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
import { AccountNowView } from '@/components/gap/account-now';
import { HypothesisDrawer, type HypothesisRow } from '@/components/gap/hypothesis-drawer';
import { OwnerResolutionPanel } from '@/components/gap/owner-resolution-panel';
import type { NowView } from '@/lib/gap/context/now';
import type { OwnerResolution } from '@/lib/gap/people/owner-resolution';

const nowView = (over: Partial<NowView> = {}): NowView => ({
  name: 'PepsiCo',
  stateLine: 'Manufacturer · Ready for a first touch · Owner: Casey',
  unit: null,
  lastTouch: 'No touch on record.',
  lastReply: null,
  next: { text: 'Add Isaac Scott from HubSpot as a GAP contact, then first-touch them.', source: 'motion' },
  who: { name: 'Isaac Scott', title: 'Sr Director of Transportation - Frito-Lay', why: 'Primary operator.', route: null, location: 'Orlando, Florida, United States', inHubSpotOnly: true, hubspotContactId: '219885493392', personaId: null },
  betterFit: null,
  addToGap: { name: 'Isaac Scott', title: 'Sr Director of Transportation - Frito-Lay', hubspotContactId: '219885493392' },
  outstandingDraft: { recipient: 'michelle.schlie@pepsico.com', name: 'Michelle Schlie', decisionId: 'dec-1', gmailDraftId: 'r710', createdAt: '2026-10-05T00:26:16.378Z' },
  historical: [],
  whoUnknown: null,
  alternate: { name: 'Michelle Schlie', title: 'vice president supply chain', why: 'sponsor' },
  whyNow: [],
  gap: [{ element: 'Current state', state: 'Unknown' }, { element: 'Problem', state: 'Unknown' }, { element: 'Impact', state: 'Unknown' }, { element: 'Root cause', state: 'Unknown' }],
  currentState: 'Current state: not confirmed by the buyer.',
  know: [],
  think: null,
  impact: 'Impact: unknown.',
  ask: null,
  relationship: null,
  private: null,
  wedge: null,
  asset: null,
  listen: '',
  ...over,
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('NOW: controls, not instructions', () => {
  it('a HubSpot-only WHO carries ADD TO GAP; the outstanding draft carries Open in Gmail and a confirmed Discard', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      if (String(url) === '/api/gap/people/import') return jsonResponse({ ok: true, status: 'created', personaId: 7000, notes: [] }, 201);
      if (String(url).endsWith('/gmail-draft/discard')) {
        expect(JSON.parse(String(init?.body))).toEqual({ gmailDraftId: 'r710', recipient: 'michelle.schlie@pepsico.com', reason: 'stale_pre_operator_who_draft' });
        return jsonResponse({ ok: true, action: 'discarded', gmailDraftId: 'r710', recipient: 'michelle.schlie@pepsico.com', ledgerId: 'l' });
      }
      throw new Error(`unexpected ${String(url)}`);
    });
    render(<AccountNowView v={nowView()} nextHref={null} nextLabel={null} links={[]} mailbox="casey@yardflow.ai" />);
    expect(screen.getByTestId('now-who-hubspot-only')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('add-to-gap-button'));
    await waitFor(() => expect(screen.getByTestId('add-to-gap-result')).toHaveTextContent(/Added as a GAP contact\. Isaac Scott is now available to routing at PepsiCo\./));
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ accountName: 'PepsiCo', hubspotContactId: '219885493392' });

    const panel = screen.getByTestId('outstanding-draft');
    expect(within(panel).getByTestId('outstanding-draft-open')).toHaveAttribute('href', 'https://mail.google.com/mail/?authuser=casey%40yardflow.ai#drafts');
    expect(screen.queryByTestId('outstanding-draft-confirm')).toBeNull();
    fireEvent.click(within(panel).getByTestId('outstanding-draft-discard'));
    expect(screen.getByTestId('outstanding-draft-confirm')).toHaveTextContent(/Only that one draft is deleted/);
    fireEvent.click(screen.getByTestId('outstanding-draft-confirm-button'));
    await waitFor(() => expect(screen.getByTestId('outstanding-draft-outcome')).toHaveTextContent(/Discarded the GAP draft to michelle\.schlie@pepsico\.com\. The account motion is released\./));
  });
  it('a historical contact reads in seller words; a GAP-contact WHO carries THIS PERSON LEFT; no machine token anywhere', () => {
    const v = nowView({
      who: { name: 'Jose Huerta', title: 'Director of Transportation', why: 'Primary operator.', route: null, inHubSpotOnly: false, personaId: 2, hubspotContactId: '100', employment: { state: 'CURRENT_UNVERIFIED', label: 'Current per the CRM (not verified)', why: 'The CRM says H-E-B.' } },
      addToGap: null,
      outstandingDraft: null,
      name: 'H-E-B',
      historical: [{ name: 'Dakota Socha', title: 'transportation & reverse logistics', personaId: 1306, elsewhere: 'ADUSA Distribution (Director of Distribution Operations)' }],
    });
    const { container } = render(<AccountNowView v={v} nextHref={null} nextLabel={null} links={[]} />);
    expect(screen.getByTestId('now-historical')).toHaveTextContent('Dakota Socha, transportation & reverse logistics. Historical H-E-B contact. Current-employer evidence now points to ADUSA Distribution (Director of Distribution Operations). Not eligible for H-E-B outreach.');
    expect(screen.getByTestId('employment-left')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/stale_persona|LEFT_COMPANY_CONFIRMED|persona_left_account|no_persona/);
    expect(screen.queryByTestId('add-to-gap')).toBeNull();
  });
});

const RESOLUTION: OwnerResolution = {
  purpose: 'HYPOTHESIS_ACTIVATION',
  account: { name: 'FedEx', entityType: '3pl', kind: 'carrier_3pl' },
  hypothesis: { id: 'h1', status: 'approved', primaryPersonaId: null, factLabel: 'a network program (linehaul, sortation, hubs, network optimization)' },
  eligible: [
    { key: 'gap:2187', source: 'gap', personaId: 2187, hubspotContactId: '219922589799', name: 'Jeffrey Tallman', title: 'Vice President - Operations Planning and Engineering - North America', location: 'Plano, Texas, United States', lane: 'PRIMARY_OPERATOR', laneLabel: 'Primary operator', read: {} as never, relevance: { tier: 'direct', why: 'runs operations planning and engineering: the fact is a network program', families: ['NETWORK_PROGRAM'], factLabel: '' }, employment: null, entity: null, hasEmail: true, action: 'use', reasons: ['Primary operator: runs the carrier network.', 'Thesis fit: runs operations planning and engineering: the fact is a network program.'], caution: null },
    { key: 'hubspot:1', source: 'hubspot', personaId: null, hubspotContactId: '1', name: 'Glen Chaffee', title: 'Managing Director - Transportation & Logistics', location: 'Mars, Pennsylvania, United States', lane: 'PRIMARY_OPERATOR', laneLabel: 'Primary operator', read: {} as never, relevance: { tier: 'related', why: 'runs transportation, adjacent to a network program', families: ['NETWORK_PROGRAM'], factLabel: '' }, employment: null, entity: null, hasEmail: true, action: 'add_then_use', reasons: ['Primary operator: title says they run transportation.'], caution: null },
  ],
  preselected: null,
  nextStep: 'choose',
  headline: '2 plausible owners for this hypothesis: choose one. GAP does not pick.',
  excluded: [{ candidate: { key: 'gap:71', source: 'gap', personaId: 71, hubspotContactId: null, name: 'Scott Temple', title: 'President, FedEx Supply Chain', location: null, lane: 'EXECUTIVE_SPONSOR', laneLabel: 'Executive sponsor', read: {} as never, relevance: null, employment: null, entity: null, hasEmail: true, action: 'use', reasons: [], caution: null }, code: 'divested_entity', reason: 'FedEx Supply Chain was sold to CMA CGM on 2026-10-01.' }],
  others: [],
  sponsor: null,
  tech: null,
  site: null,
  research: { needed: false, slots: [], why: 'Not needed.' },
  apollo: { allowed: false, note: 'Owner resolution never spends an Apollo credit.' },
  checked: ['GAP contacts (13)', 'HubSpot contacts (114, via the account identity)'],
};

describe('the owner-resolution panel', () => {
  it('shows the ranked choice with reasons, picks nobody, and USE sends exactly the chosen person', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      if (!init || init.method !== 'POST') return jsonResponse({ resolution: RESOLUTION, hubspot: { via: 'identity' } });
      expect(JSON.parse(String(init.body))).toEqual({ hubspotContactId: '1', activate: true });
      return jsonResponse({ ok: true, hypothesisId: 'h1', hypothesisStatus: 'active', personaId: 7000, personaName: 'Glen Chaffee', steps: [{ step: 'import', ok: true, status: 'created' }, { step: 'check', ok: true }, { step: 'assign', ok: true, status: 'approved' }, { step: 'activate', ok: true, status: 'active' }, { step: 'route', ok: true, detail: 'Glen Chaffee: research' }], routing: { ok: true, runId: 'r', people: [{ personaId: 7000, name: 'Glen Chaffee', lane: 'research', decisionId: 'd' }], counts: { research: 1 }, failures: [] } });
    });
    const onChanged = vi.fn();
    render(<OwnerResolutionPanel hypothesisId="h1" accountName="FedEx" onChanged={onChanged} />);
    await waitFor(() => expect(screen.getByTestId('owner-resolution-headline')).toHaveTextContent('2 plausible owners for this hypothesis: choose one. GAP does not pick.'));
    expect(screen.getAllByTestId('owner-candidate')).toHaveLength(2);
    expect(screen.queryByTestId('owner-use')).toBeNull();
    expect(screen.getByText(/Thesis fit: runs operations planning and engineering/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Choose Glen Chaffee'));
    expect(screen.getByTestId('owner-use')).toHaveTextContent('Add Glen Chaffee to GAP + use in routing');
    fireEvent.click(screen.getByTestId('owner-use'));
    await waitFor(() => expect(screen.getByTestId('owner-result')).toHaveAttribute('data-ok', 'true'));
    expect(screen.getByTestId('owner-result')).toHaveTextContent(/Add to GAP: created/);
    expect(onChanged).toHaveBeenCalledWith({ to: 'active' });
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(true);
  });
  it('set-aside people are listed with the reason when asked; nobody eligible shows Owner not resolved and FIND OPERATOR', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      if (init?.method === 'POST' && String(url).endsWith('/find-operator')) return jsonResponse({ ok: true, found: [], staged: [{ name: 'New Person', title: 'Director of Transportation' }], alreadyOnRecord: [], note: '1 direct-operator candidate staged for your review.' });
      return jsonResponse({ resolution: { ...RESOLUTION, eligible: [], nextStep: 'find_operator', headline: 'No current direct network operator on record for this hypothesis. Find the operator.', research: { needed: true, slots: ['network owner'], why: 'Nobody on record is a current network operator.' } }, hubspot: {} });
    });
    render(<OwnerResolutionPanel hypothesisId="h1" accountName="FedEx" />);
    await waitFor(() => expect(screen.getByTestId('owner-not-resolved')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('owner-excluded-toggle'));
    expect(screen.getByTestId('owner-excluded')).toHaveTextContent('Scott Temple, President, FedEx Supply Chain: FedEx Supply Chain was sold to CMA CGM on 2026-10-01.');
    fireEvent.click(screen.getByTestId('owner-find'));
    await waitFor(() => expect(screen.getByTestId('owner-research-note')).toHaveTextContent(/1 direct-operator candidate staged for your review\. Staged: New Person \(Director of Transportation\)\./));
  });
});

const row = (over: Partial<HypothesisRow> = {}): HypothesisRow => ({
  id: 'h1',
  account_name: 'FedEx',
  problem_family: 'hidden_capacity',
  persona: 'supply_chain',
  status: 'approved',
  primary_persona_id: null,
  confidence: 60,
  observation: 'From the 10-K: "we are redesigning our network" [S:sig_1].',
  problem_hypothesis: 'My guess is the yard.',
  signals: [{ hypothesis_id: 'h1', signal_id: 'sig_1', role: 'primary', signal: { id: 'sig_1', title: '10-K', source_kind: 'evidence_record', source_type: 'public_primary', evidence_url: 'https://sec.gov/x', evidence_text: 'we are redesigning our network', observed_at: '2026-07-20T00:00:00Z', confidence: 80, external_ok: true } }],
  events: [],
  actionability: { outreachReady: true, reason: null, canApprove: false, canUse: true, next: 'use' },
  ...over,
});

describe('the hypothesis drawer: an approved row with no person enters owner resolution, never the raw no_persona', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      if (String(url).endsWith('/owner') && (!init || init.method !== 'POST')) return jsonResponse({ resolution: RESOLUTION, hubspot: {} });
      // The machine refuses activation for want of a person: approved stays approved.
      if (init?.method === 'PATCH') return jsonResponse({ hypothesisId: 'h1', ok: false, from: 'review_required', to: 'approved', detail: 'approved, but not in use: no_persona', reason: 'no_persona' }, 409);
      return jsonResponse({}, 404);
    });
  });
  it('approved + null person: the owner panel is the primary action; no "Use in routing" button; no machine word', async () => {
    const { container } = render(<HypothesisDrawer hypothesis={row()} onClose={() => {}} onTransition={() => {}} />);
    await waitFor(() => expect(screen.getByTestId('owner-resolution')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Use in routing' })).toBeNull();
    expect(container.textContent).not.toMatch(/no_persona|primary_persona_id/);
  });
  it('Approve + use on a row with no person: the approval stands, the notice is a sentence, the panel opens', async () => {
    const onTransition = vi.fn();
    render(<HypothesisDrawer hypothesis={row({ status: 'review_required', actionability: { outreachReady: true, reason: null, canApprove: true, canUse: true, next: 'approve_use' } })} onClose={() => {}} onTransition={onTransition} />);
    fireEvent.click(screen.getByRole('button', { name: 'Approve + use' }));
    await waitFor(() => expect(screen.getByTestId('hypothesis-owner-notice')).toHaveTextContent('Approved. GAP needs a person to test this with before it can route.'));
    expect(screen.queryByTestId('hypothesis-action-error')).toBeNull();
    expect(onTransition).toHaveBeenCalledWith({ from: 'review_required', to: 'approved', effects: [] });
  });
});
