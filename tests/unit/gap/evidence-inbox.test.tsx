/**
 * Phase 2 B2: the Verified Evidence Inbox. Grouped by account; only live,
 * verified outreach facts not yet on a thesis and not ignored are "ready";
 * contradictions and rejected sources are visible; USE goes through the
 * existing use_evidence operation and never approves; IGNORE is append-only.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const groupsFor = vi.fn();
vi.mock('@/lib/gap/hypothesis/thesis-groups', () => ({ loadThesisGroups: (...a: unknown[]) => groupsFor(...a) }));

import { loadEvidenceInbox } from '@/lib/gap/research/inbox';
import { EvidenceInbox } from '@/components/gap/evidence-inbox';
import { EvidenceActions } from '@/components/gap/evidence-actions';

const NOW = new Date('2026-09-28T15:00:00.000Z');
const inDays = (n: number) => new Date(NOW.getTime() + n * 86_400_000);
const verified = { verified: 'excerpt_found_at_source', retrievedAt: '2026-09-28T10:41:00.000Z', researchRunId: 'run-bg' };
const sig = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  account_name: 'PepsiCo',
  source_kind: 'evidence_record',
  source_type: 'public_secondary',
  title: 'PepsiCo expands autonomous freight',
  evidence_text: 'PepsiCo will expand its autonomous freight program to a new distribution center in Texas this year.',
  evidence_url: 'https://news.example/pep',
  external_ok: true,
  observed_at: new Date('2026-08-26'),
  freshness_expires_at: inDays(80),
  metadata: verified,
  ...over,
});

function db(over: { signals?: any[]; ignored?: string[]; linked?: string[]; runs?: any[] } = {}) {
  return {
    prospectingSignal: { findMany: vi.fn(async () => over.signals ?? []) },
    gapAuditEvent: { findMany: vi.fn(async () => (over.ignored ?? []).map((subject_id) => ({ subject_id }))) },
    hypothesisSignal: { findMany: vi.fn(async () => (over.linked ?? []).map((signal_id) => ({ signal_id }))) },
    researchRun: { findMany: vi.fn(async () => over.runs ?? []) },
  };
}

beforeEach(() => {
  groupsFor.mockReset();
  groupsFor.mockResolvedValue([
    { fingerprint: 'a'.repeat(64), accountName: 'PepsiCo', problemFamily: 'hidden_capacity', members: [
      { id: 'h1', status: 'approved', next: 'revise', problem_hypothesis: 'Arrival variability moves into the yard.' },
      { id: 'h2', status: 'draft', next: 'find_evidence', problem_hypothesis: 'Arrival variability moves into the yard.' },
      { id: 'h3', status: 'active', next: 'in_use', problem_hypothesis: 'Arrival variability moves into the yard.' },
    ] },
  ]);
});

describe('loadEvidenceInbox', () => {
  it('ready = verified, live, not on a thesis, not ignored; USE targets only editable and revise rows', async () => {
    const p = db({
      signals: [
        sig('s-ready'),
        sig('s-linked'),
        sig('s-ignored'),
        sig('s-expired', { freshness_expires_at: inDays(-1) }),
        sig('s-not-physical', { evidence_text: 'PepsiCo reported strong quarterly results and raised full year guidance for investors.' }),
      ],
      ignored: ['s-ignored'],
      linked: ['s-linked'],
    });
    const [a] = await loadEvidenceInbox(p, NOW);
    expect(a.accountName).toBe('PepsiCo');
    expect(a.ready.map((f) => f.signalId)).toEqual(['s-ready']);
    expect(a.ready[0]).toMatchObject({ runId: 'run-bg', daysLeft: 80, sourceUrl: 'https://news.example/pep' });
    expect(a.ready[0].why).toContain('word for word at the source on 2026-09-28');
    expect(a.theses).toEqual([expect.objectContaining({ usableIds: ['h1', 'h2'], people: 3 })]);
  });

  it('contradictions are shown, not filtered; rejected sources and the last run give an explicit answer', async () => {
    const p = db({
      signals: [
        sig('s-open', { evidence_text: 'PepsiCo is opening the Dallas distribution center next month with new dock doors.' }),
        sig('s-close', { evidence_text: 'PepsiCo is closing the Dallas distribution center and moving volume to Houston.' }),
      ],
      runs: [{ id: 'run-bg', account_name: 'PepsiCo', created_at: new Date('2026-09-28T10:41:00Z'), provider_status: { purpose: 'gap_background_research', outcome: 'conflicting_evidence', notes: ['edgar: no cik'], result: { rejected: [{ url: 'https://x.test/a', reason: 'excerpt_not_found_at_source' }] } } }],
    });
    const [a] = await loadEvidenceInbox(p, NOW);
    expect(a.contradictions).toHaveLength(1);
    expect(a.contradictions[0].site).toBe('Dallas');
    // Review B2: neither side of a contradiction is ready to USE.
    expect(a.ready).toEqual([]);
    expect(a.contradictions[0].facts.map((f) => f.signalId).sort()).toEqual(['s-close', 's-open']);
    expect(a.rejected).toEqual([{ url: 'https://x.test/a', reason: 'excerpt_not_found_at_source', at: '2026-09-28T10:41:00.000Z' }]);
    expect(a.lastRun).toMatchObject({ outcome: 'conflicting_evidence', background: true });
  });

  it('an account researched with nothing verified still appears, with the reason', async () => {
    groupsFor.mockResolvedValue([]);
    const p = db({ runs: [{ id: 'r2', account_name: 'Kroger', created_at: new Date('2026-09-28T10:45:00Z'), provider_status: { purpose: 'gap_background_research', outcome: 'insufficient_evidence', result: { rejected: [] } } }] });
    const accounts = await loadEvidenceInbox(p, NOW);
    render(<EvidenceInbox accounts={accounts} now={NOW} />);
    expect(screen.getByTestId('evidence-account')).toHaveTextContent('Kroger');
    expect(screen.getByTestId('evidence-account')).toHaveTextContent('no verifiable physical-network fact found');
  });
});

describe('<EvidenceInbox> / <EvidenceActions>', () => {
  it('renders the account summary line: sources found apart from outreach facts verified; a non-evidence source is shown with provenance and reason', async () => {
    const p = db({
      signals: [sig('s-ready')],
      runs: [{ id: 'run-bg', account_name: 'PepsiCo', created_at: NOW, provider_status: { purpose: 'gap_background_research', outcome: 'evidence_found', result: { sources: [
        { url: 'https://gatik.ai/news/pepsico', title: 'Gatik and PepsiCo expand', publishedAt: '2026-06-09T00:00:00.000Z', status: 'not_verified', reason: 'describes_past_event' },
        { url: 'https://x.test/a', status: 'not_verified', reason: 'page_does_not_name_account' },
        { url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/z', status: 'not_verified', reason: 'source_too_weak' },
      ] } } }],
    });
    render(<EvidenceInbox accounts={await loadEvidenceInbox(p, NOW)} now={NOW} />);
    expect(screen.getByTestId('evidence-account-summary')).toHaveTextContent('3 sources found by research (45 days) · 1 outreach fact verified');
    const src = screen.getAllByTestId('evidence-source')[0];
    expect(src).toHaveTextContent('gatik.ai · published Jun 9, 2026');
    expect(src).toHaveTextContent('Gatik and PepsiCo expand');
    expect(src).toHaveTextContent('Not verified for outreach: describes a past event, not a current change');
    // A page that does not use the full name is shown (it may use a brand); only the search redirect is dropped.
    expect(screen.getAllByTestId('evidence-source')).toHaveLength(2);
    expect(screen.getByTestId('evidence-view-all-sources')).toHaveAttribute('href', '/gap/accounts/pepsico/sources');
    expect(screen.getByTestId('evidence-fact')).toHaveTextContent('PepsiCo will expand its autonomous freight program');
  });

  it('USE posts the existing use_evidence operation with this fact as the ONE primary fact, and says nothing was approved', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, results: [{ ok: true, detail: 'new draft revision created; the approved version is kept in history' }] }), { status: 200 }));
    render(<EvidenceActions signalId="s-ready" sourceUrl="https://news.example/pep" runId="run-bg" theses={[{ fingerprint: 'a'.repeat(64), problemFamily: 'hidden_capacity', summary: '', people: 3, usableIds: ['h1', 'h2'] }]} />);
    fireEvent.click(screen.getByTestId('evidence-use'));
    await waitFor(() => expect(screen.getByTestId('evidence-done')).toBeInTheDocument());
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/gap/theses');
    expect(JSON.parse(String(init.body))).toEqual({ op: 'use_evidence', fingerprint: 'a'.repeat(64), hypothesisIds: ['h1', 'h2'], signalIds: ['s-ready'], primarySignalId: 's-ready' });
    expect(screen.getByTestId('evidence-done')).toHaveTextContent('new draft revision created');
    expect(screen.getByRole('link', { name: 'Review it' })).toHaveAttribute('href', '/gap?lane=review');
    f.mockRestore();
  });

  it('no thesis at the account: the only use is drafting one (a DRAFT through the existing propose route)', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, ids: ['h9'] }), { status: 201 }));
    render(<EvidenceActions signalId="s1" sourceUrl={null} runId="run-bg" theses={[]} />);
    fireEvent.click(screen.getByTestId('evidence-draft'));
    await waitFor(() => expect(screen.getByTestId('evidence-done')).toHaveTextContent('Nothing is approved'));
    expect((f.mock.calls[0] as [string])[0]).toBe('/api/gap/research/run-bg/propose');
    // Review B2: the clicked fact is the opener, never whichever fact the run lists first.
    expect(JSON.parse(String((f.mock.calls[0] as [string, RequestInit])[1].body))).toEqual({ signalIds: ['s1'] });
    f.mockRestore();
  });

  it('a contradicted fact offers no USE and no draft: only ignore this side or open the source', () => {
    render(<EvidenceActions signalId="s1" sourceUrl="https://x.test" runId="run-bg" theses={[{ fingerprint: 'a'.repeat(64), problemFamily: 'hidden_capacity', summary: '', people: 1, usableIds: ['h2'] }]} contradicted />);
    expect(screen.queryByTestId('evidence-use')).toBeNull();
    expect(screen.queryByTestId('evidence-draft')).toBeNull();
    expect(screen.getByTestId('evidence-ignore')).toHaveTextContent('Ignore this side');
  });

  it('IGNORE records the ignore and hides the candidate', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 201 }));
    render(<EvidenceActions signalId="s1" sourceUrl={null} runId={null} theses={[]} />);
    fireEvent.click(screen.getByTestId('evidence-ignore'));
    await waitFor(() => expect(screen.getByTestId('evidence-ignored')).toBeInTheDocument());
    expect(JSON.parse(String((f.mock.calls[0] as [string, RequestInit])[1].body))).toEqual({ signalId: 's1' });
    f.mockRestore();
  });

  it('a refused USE says it was not applied', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: false, reason: 'opener_too_long:s1', results: [] }), { status: 409 }));
    render(<EvidenceActions signalId="s1" sourceUrl={null} runId={null} theses={[{ fingerprint: 'a'.repeat(64), problemFamily: 'hidden_capacity', summary: '', people: 1, usableIds: ['h2'] }]} />);
    fireEvent.click(screen.getByTestId('evidence-use'));
    await waitFor(() => expect(screen.getByTestId('evidence-error')).toHaveTextContent('Not applied: opener_too_long:s1'));
    f.mockRestore();
  });
});
