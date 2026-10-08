/**
 * R63-A S15: the tomorrow preview listed Nfi's case study twice, under Owed to buyers and again under The day after,
 * both "Due tomorrow." One line per obligation: a buyer obligation stays in Owed with its day, and the tomorrow list
 * carries only what Owed does not (a snooze coming back, a follow-up, a meeting).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { todaySummary } from '@/lib/gap/work/today';
import type { Commitment } from '@/lib/gap/work/commitment-model';
import { addDays, nyDay, nyDayAt } from '@/lib/gap/work/dates';
import { WorkToday } from '@/components/gap/work-today';

const REAL_NOW = new Date('2026-10-07T22:00:00Z');
// The preview reads Work as it will stand tomorrow at 8 am New York (the page's own rule).
const PREVIEW = nyDayAt(addDays(nyDay(REAL_NOW), 1), 8);
const commitment = (over: Partial<Commitment>): Commitment => ({
  commitmentId: 'seller:nfi-case-study',
  accountName: 'Nfi Scratch Co r63',
  kind: 'deliverable',
  title: 'Send them the case study',
  basis: null,
  owner: 'casey@freightroll.com',
  dueAt: nyDayAt('2026-10-09', 12).toISOString(),
  person: null,
  dealId: null,
  threadId: null,
  status: 'open',
  snoozeUntil: null,
  dependency: null,
  proof: null,
  reason: null,
  source: { kind: 'seller', id: '1' },
  detail: null,
  createdAt: '2026-10-07T14:00:00Z',
  createdBy: 'casey@freightroll.com',
  updatedAt: '2026-10-07T14:00:00Z',
  updatedBy: 'casey@freightroll.com',
  ...over,
});

describe('R63-A S15: one line per obligation', () => {
  it('the preview lists the case study once, under Owed with its day, and The day after never repeats it', () => {
    const t = todaySummary({ now: PREVIEW, commitments: [commitment({})], done: [], waiting: [] });
    expect(t.owed.map((o) => [o.title, o.line])).toEqual([['Send them the case study', 'Due tomorrow.']]);
    expect(t.tomorrow).toEqual([]);
    render(<WorkToday today={t} preview />);
    expect(screen.getAllByText(/Send them the case study/)).toHaveLength(1);
  });

  it('what Owed does not carry still shows under tomorrow (a snooze coming back)', () => {
    const snoozed = commitment({ commitmentId: 'seller:back', kind: 'reminder', title: 'Back to Nfi', status: 'snoozed', snoozeUntil: nyDayAt('2026-10-09').toISOString(), dueAt: nyDayAt('2026-10-09').toISOString() });
    const t = todaySummary({ now: PREVIEW, commitments: [snoozed], done: [], waiting: [] });
    expect(t.tomorrow.map((x) => [x.title, x.line])).toEqual([['Back to Nfi', 'Back tomorrow.']]);
  });
});
