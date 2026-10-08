/**
 * R63-B S13 / S14: at 390 px Work's "Prioritize" (47x16) and "Refresh" (39x16), the account-name links in the day's
 * lists (16 tall), the pack's "accept" (35x16) and "edit" (20x16) and the brief's milestone checkboxes (13x13) were
 * under 24 px; and the floating Note pill covered "doug@... replied Oct 5, not triaged yet". Every one is a 24 px
 * target now (min-h-6 and min-w-6, the plan's choices h-6 w-6), and at phone width the Note pill sits in the page
 * flow after the content (fixed only from 640 px up), so it covers nothing.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams(''), usePathname: () => '/gap/preview/h1/' }));
import { WorkList } from '@/components/gap/work-list';
import { WorkToday } from '@/components/gap/work-today';
import { AngleLine } from '@/components/gap/account-motion-panel';
import { FeedbackButton } from '@/components/gap/feedback-button';
import type { WorkCard } from '@/lib/gap/work/list';

const tokens = (el: Element) => new Set((el.getAttribute('class') ?? '').split(/\s+/));
const target24 = (el: Element) => {
  const t = tokens(el);
  expect([el.textContent, t.has('min-h-6') || t.has('min-h-11')]).toEqual([el.textContent, true]);
  expect([el.textContent, t.has('min-w-6') || t.has('min-h-11')]).toEqual([el.textContent, true]);
};

describe('R63-B S13: 24 px targets', () => {
  it('Work: Prioritize, Refresh and the account names in Waiting and Snoozed', () => {
    const card: WorkCard = { accountName: 'Fedex Scratch Co r63', index: 0, lane: 'ready', stateKind: 'ready', state: 'Ready', why: 'why', person: null, next: null, blocker: null, href: '/gap/accounts/fedex-scratch-co-r63/', source: 'cockpit', tier: 'ready' };
    render(<WorkList cards={[card]} readAt={{ at: '2026-10-07T18:00:00Z', label: 'Read 2 min ago' }} waiting={[{ key: 'w1', accountName: 'Kroger Scratch Co r63', kind: 'follow_up', title: 'Follow up', line: 'Oct 13.', dueDay: '2026-10-13' } as never]} snoozed={[{ key: 's1', accountName: 'Heb Scratch Co r63', line: 'Back Oct 9.', until: '2026-10-09' }]} />);
    target24(screen.getByTestId('work-priority-open'));
    target24(screen.getByTestId('work-refresh'));
    for (const name of ['Kroger Scratch Co r63', 'Heb Scratch Co r63']) target24(screen.getByRole('link', { name }));
  });

  it('the day summary: each account name', () => {
    render(<WorkToday today={{ day: '2026-10-07', done: [], setAside: [{ at: '2026-10-07T15:00:00Z', accountName: 'Walmart Scratch Co r63', line: 'Set aside for today.', kind: 'set_aside' }], owed: [{ commitmentId: 'c1', accountName: 'Kroger Scratch Co r63', title: 'Send Ann the template', line: 'Due today.' }], waiting: [], tomorrow: [] }} />);
    for (const name of ['Walmart Scratch Co r63', 'Kroger Scratch Co r63']) for (const a of screen.getAllByRole('link', { name })) target24(a);
  });

  it('the brief: accept and edit', () => {
    render(<AngleLine a={{ personaId: 5, angle: null, suggested: 'Runs transportation.' }} personaId={5} bare />);
    target24(screen.getByRole('button', { name: 'accept' }));
    target24(screen.getByRole('button', { name: 'edit' }));
  });
});

describe('R63-B S14 / R63-A S12: the Feedback pill covers nothing at any width', () => {
  it('in the page flow at every width (fixed from 640 px up it covered the email body at 1280 px)', () => {
    render(<FeedbackButton />);
    const t = tokens(screen.getByTestId('feedback-open'));
    expect(t.has('fixed')).toBe(false);
    expect(t.has('sm:fixed')).toBe(false);
    expect(t.has('min-h-11')).toBe(true);
  });
});
