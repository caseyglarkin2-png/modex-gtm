/**
 * Compile report UI (GAP Prospecting OS, Sprint 3, S3-T12).
 *
 * Pins: every check code and its outcome render, the per-step and overall
 * verdict chips, the approval state on a review_required step, the pure
 * newest-per-step and overall-verdict helpers, and the privacy invariant:
 * a raw GapCompile row's `inputs_snapshot` (and any other column the report
 * does not name) never reaches the DOM.
 */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  CompileReport,
  allStepsCleared,
  newestPerStep,
  overallVerdict,
  readChecks,
  toReportStep,
  type CompileReportStep,
  type CompileRowLike,
} from '@/components/gap/compile-report';

const SENTINEL = 'PRIVATE_INTENT_SENTINEL_visited_/demo/acme';

const CHECKS = [
  { code: 'C01', passed: true, severity: 'reject', detail: 'every marker resolves' },
  { code: 'C02', passed: true, severity: 'reject', detail: 'hedged' },
  { code: 'C07', passed: false, severity: 'reject', detail: 'word count 131 exceeds 120' },
  { code: 'C14', passed: false, severity: 'review', detail: 'singular "yard" outside "yard network"' },
];

/** A raw row as prisma would hand it back, INCLUDING the columns the report must never show. */
function rawRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cmp_1',
    hypothesis_id: 'H1',
    sequence_version_id: 'v1',
    draft_queue_item_id: null,
    step_index: 0,
    verdict: 'pass',
    checks: CHECKS,
    word_count: 88,
    cta_family: 'question',
    evidence_ids_used: ['ev_1'],
    compiler_version: 'gap-compiler/1',
    critic: { verdict: 'pass', raw: SENTINEL },
    inputs_snapshot: { contract: { lastIntentSource: SENTINEL }, body: SENTINEL },
    result: { verdict: 'pass', snapshot: SENTINEL },
    created_by: 'casey',
    created_at: new Date('2026-09-22T10:00:00.000Z'),
    ...overrides,
  };
}

function step(overrides: Partial<CompileReportStep> = {}): CompileReportStep {
  return {
    stepIndex: 0,
    compileId: 'cmp_1',
    verdict: 'pass',
    subject: 'Gate clerks at Acme',
    body: 'Hi Jane,\n\nYour Ohio DC posted three gate-clerk roles.',
    wordCount: 88,
    ctaFamily: 'question',
    checks: readChecks(CHECKS),
    approval: null,
    compiledAt: '2026-09-22T10:00:00.000Z',
    ...overrides,
  };
}

describe('toReportStep', () => {
  it('picks the report columns by name and carries no other column of the row', () => {
    const out = toReportStep(0, rawRow() as unknown as CompileRowLike, { subject: 'S', body: 'B' }, null);
    expect(out).toEqual({
      stepIndex: 0,
      compileId: 'cmp_1',
      verdict: 'pass',
      subject: 'S',
      body: 'B',
      wordCount: 88,
      ctaFamily: 'question',
      checks: readChecks(CHECKS),
      approval: null,
      compiledAt: '2026-09-22T10:00:00.000Z',
    });
    expect(Object.keys(out)).not.toContain('inputs_snapshot');
    expect(JSON.stringify(out)).not.toContain(SENTINEL);
  });

  it('a missing row is verdict missing with the version copy and no checks', () => {
    expect(toReportStep(2, null, { subject: 'S2', body: 'B2' }, null)).toEqual({
      stepIndex: 2,
      compileId: null,
      verdict: 'missing',
      subject: 'S2',
      body: 'B2',
      wordCount: null,
      ctaFamily: null,
      checks: [],
      approval: null,
      compiledAt: null,
    });
  });

  it('keeps the approval only on a review_required row', () => {
    const approval = { approved: false, status: 'pending', requestId: 'sar_1' };
    expect(toReportStep(0, rawRow({ verdict: 'review_required' }) as unknown as CompileRowLike, null, approval).approval).toEqual(approval);
    expect(toReportStep(0, rawRow({ verdict: 'pass' }) as unknown as CompileRowLike, null, approval).approval).toBeNull();
  });

  it('readChecks drops malformed entries and defaults severity to reject', () => {
    expect(readChecks([{ code: 'C01', passed: true }, { nope: 1 }, 'x', { code: 'C14', passed: false, severity: 'review', detail: 'd' }])).toEqual([
      { code: 'C01', passed: true, severity: 'reject', detail: '' },
      { code: 'C14', passed: false, severity: 'review', detail: 'd' },
    ]);
    expect(readChecks(null)).toEqual([]);
  });
});

describe('newestPerStep and overallVerdict', () => {
  it('newestPerStep picks the newest row for each step and null for an uncompiled step', () => {
    const rows = [
      rawRow({ id: 'old0', step_index: 0, verdict: 'reject', created_at: new Date('2026-09-20T00:00:00.000Z') }),
      rawRow({ id: 'new0', step_index: 0, verdict: 'pass', created_at: new Date('2026-09-22T00:00:00.000Z') }),
      rawRow({ id: 'only1', step_index: 1, verdict: 'review_required', created_at: new Date('2026-09-21T00:00:00.000Z') }),
    ] as unknown as CompileRowLike[];
    const picked = newestPerStep(rows, 3);
    expect(picked.map((r) => r?.id ?? null)).toEqual(['new0', 'only1', null]);
  });

  it('overallVerdict is the strictest step: reject > missing > unapproved review > pass', () => {
    expect(overallVerdict([])).toBe('missing');
    expect(overallVerdict([step(), step({ stepIndex: 1, verdict: 'reject' })])).toBe('reject');
    expect(overallVerdict([step(), step({ stepIndex: 1, verdict: 'missing' })])).toBe('missing');
    expect(overallVerdict([step(), step({ stepIndex: 1, verdict: 'review_required', approval: { approved: false, status: 'pending', requestId: 'r' } })])).toBe(
      'review_required',
    );
    expect(overallVerdict([step(), step({ stepIndex: 1, verdict: 'review_required', approval: { approved: true, status: 'approved', requestId: 'r' } })])).toBe(
      'pass',
    );
    expect(overallVerdict([step(), step({ stepIndex: 1 })])).toBe('pass');
  });

  it('allStepsCleared is false on empty, on a missing step, and on an unapproved review', () => {
    expect(allStepsCleared([])).toBe(false);
    expect(allStepsCleared([step(), step({ stepIndex: 1, verdict: 'missing' })])).toBe(false);
    expect(allStepsCleared([step({ verdict: 'review_required', approval: { approved: false, status: 'pending', requestId: 'r' } })])).toBe(false);
    expect(allStepsCleared([step({ verdict: 'review_required', approval: { approved: true, status: 'approved', requestId: 'r' } })])).toBe(true);
  });
});

describe('<CompileReport>', () => {
  it('renders every check code with its outcome, the subject, body, word count, CTA family and the verdict chips', () => {
    render(<CompileReport steps={[step({ verdict: 'reject' })]} />);
    const card = screen.getByTestId('compile-step-0');
    expect(card).toHaveAttribute('data-verdict', 'reject');
    for (const code of ['C01', 'C02', 'C07', 'C14']) {
      const row = within(card).getByText(code).closest('tr');
      expect(row).not.toBeNull();
      expect(row).toHaveAttribute('data-check', code);
    }
    expect(within(within(card).getByText('C01').closest('tr') as HTMLElement).getByText('pass')).toBeInTheDocument();
    expect(within(within(card).getByText('C07').closest('tr') as HTMLElement).getByText('reject')).toBeInTheDocument();
    expect(within(within(card).getByText('C14').closest('tr') as HTMLElement).getByText('review')).toBeInTheDocument();
    expect(within(card).getByText('word count 131 exceeds 120')).toBeInTheDocument();
    expect(within(card).getByText('Gate clerks at Acme')).toBeInTheDocument();
    expect(within(card).getByText(/three gate-clerk roles/)).toBeInTheDocument();
    expect(within(card).getByText('88 words')).toBeInTheDocument();
    expect(within(card).getByText('CTA: question')).toBeInTheDocument();

    const chips = screen.getAllByText('reject').filter((el) => el.getAttribute('data-verdict') === 'reject');
    // One per-step chip and one overall chip.
    expect(chips).toHaveLength(2);
  });

  it('a review_required step shows the approval state, pending or approved', () => {
    const { rerender } = render(
      <CompileReport steps={[step({ verdict: 'review_required', approval: { approved: false, status: 'pending', requestId: 'sar_9' } })]} />,
    );
    expect(screen.getByTestId('approval-state')).toHaveTextContent('Approval: pending (sar_9)');
    expect(screen.getByTestId('compile-report')).toHaveTextContent('review required');

    rerender(<CompileReport steps={[step({ verdict: 'review_required', approval: { approved: true, status: 'approved', requestId: 'sar_9' } })]} />);
    expect(screen.getByTestId('approval-state')).toHaveTextContent('Approval: approved (sar_9)');
    const overall = screen.getAllByText('pass').find((el) => el.getAttribute('data-verdict') === 'pass');
    expect(overall).toBeDefined();
  });

  it('a step that was never compiled says so and renders an empty check table', () => {
    render(<CompileReport steps={[toReportStep(1, null, { subject: 'S', body: 'B' }, null)]} />);
    const card = screen.getByTestId('compile-step-1');
    expect(card).toHaveAttribute('data-verdict', 'missing');
    expect(within(card).getByText('This step has not been compiled.')).toBeInTheDocument();
    expect(within(card).queryByRole('table')).toBeNull();
  });

  it('never renders inputs_snapshot, critic or result payloads from the raw row', () => {
    const raw = rawRow({ verdict: 'review_required' }) as unknown as CompileRowLike;
    const mapped = toReportStep(0, raw, { subject: 'S', body: 'B' }, { approved: false, status: 'pending', requestId: 'sar_1' });
    const { container } = render(<CompileReport steps={[mapped]} />);
    expect(container.innerHTML).not.toContain(SENTINEL);
    expect(container.innerHTML).not.toContain('inputs_snapshot');
    expect(container.innerHTML).not.toContain('lastIntentSource');
  });
});
