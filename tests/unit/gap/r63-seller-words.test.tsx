/**
 * R63-B S15: internal words on seller screens: "HubSpot opportunity CLEAR" in the pack's HISTORY, a thesis row named
 * "Open Walmart Scratch Co r63 hidden_capacity", and "not_found" on the call page (that one is fixed with S7). Each
 * is said in words now.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { historyLines, opportunityHistoryLine, type BriefHistory } from '@/lib/gap/execution/six-line-brief';
import { HypothesisList } from '@/app/gap/hypotheses/hypothesis-list';
import type { HypothesisRow } from '@/components/gap/hypothesis-drawer';

const clear: BriefHistory = { personTouches: { count: 0, lastAt: null }, colleagueTouches: [], accountReply: null, lastResponse: null, opportunity: { status: 'CLEAR', detail: '', checkedAt: '' } };

describe('R63-B S15: seller words, never the reader\'s codes', () => {
  it('HubSpot\'s answer in HISTORY', () => {
    expect(opportunityHistoryLine({ status: 'CLEAR', detail: '', checkedAt: '' })).toBe('No open HubSpot deal, checked moments ago');
    expect(opportunityHistoryLine({ status: 'ACTIVE', detail: '"Walmart pilot"', checkedAt: '' })).toBe('An open HubSpot deal: "Walmart pilot", checked moments ago');
    expect(opportunityHistoryLine({ status: 'UNKNOWN', detail: 'check HubSpot before contacting', checkedAt: '' })).toBe('HubSpot could not be checked: check HubSpot before contacting');
    for (const status of ['CLEAR', 'ACTIVE', 'UNKNOWN'] as const) {
      const lines = historyLines('Doug', 'Walmart Scratch Co r63', { ...clear, opportunity: { status, detail: '', checkedAt: '' } }).lines;
      expect(lines.join(' ')).not.toMatch(/\b(CLEAR|ACTIVE|UNKNOWN)\b/);
    }
  });

  it('a thesis row is named in the words its cells show', () => {
    const row: HypothesisRow = { id: 'h1', account_name: 'Walmart Scratch Co r63', problem_family: 'hidden_capacity', persona: 'vp_operations', status: 'active', confidence: 40, observation: 'x', problem_hypothesis: 'y', updated_at: '2026-10-07T00:00:00.000Z' } as HypothesisRow;
    render(<HypothesisList items={[row]} status="active" />);
    const named = screen.getByRole('button', { name: 'Open Walmart Scratch Co r63 hidden capacity' });
    expect(named.getAttribute('aria-label')).not.toMatch(/_/);
  });
});
