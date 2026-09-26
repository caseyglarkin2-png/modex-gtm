/**
 * NEXT UP (weekend reduction, 2026-09-26): the cockpit's home names the best
 * next minute in operator priority and only points; it never acts.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GapCockpit, NextUp, pickNextUp } from '@/components/gap/gap-cockpit';

const c = (title: string, href: string) => ({ title, detail: 'd', href });

describe('pickNextUp', () => {
  it('orders reply, follow up, ready, review, research, and skips empty lanes', () => {
    const items = pickNextUp({
      research: c('Research Unfi', '/gap?lane=research'),
      ready: c('Contact salvador', '/gap?lane=ready&open=d1#card-d1'),
      replies: c('joey replied', '/gap?lane=replies'),
      review: null,
    });
    expect(items.map((i) => i.lane)).toEqual(['replies', 'ready', 'research']);
  });
});

describe('<NextUp>', () => {
  it('one DO THIS NEXT button to the first item; the rest are listed as then', () => {
    render(<NextUp items={pickNextUp({ ready: c('Contact salvador', '/gap?lane=ready&open=d1#card-d1'), research: c('Research Unfi', '/gap?lane=research') })} />);
    expect(screen.getByTestId('next-up-title')).toHaveTextContent('Contact salvador');
    expect(screen.getByTestId('do-this-next')).toHaveAttribute('href', '/gap?lane=ready&open=d1#card-d1');
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('nothing to do is said plainly', () => {
    render(<NextUp items={[]} />);
    expect(screen.getByTestId('next-up')).toHaveTextContent('Nothing needs you right now.');
  });
});

describe('<GapCockpit>', () => {
  it('every lane tile stays on /gap (no link out to /gap/hypotheses or /gap/replies)', () => {
    render(<GapCockpit data={{ review: 1, research: 2, ready: 3, followUp: 0, replies: { count: 1, atLeast: false }, active: 'review' }} />);
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/gap?lane=review', '/gap?lane=research', '/gap?lane=ready', '/gap?lane=follow_up', '/gap?lane=replies']);
    expect(screen.getByTestId('cockpit-tile-review')).toHaveAttribute('aria-current', 'page');
  });
});
