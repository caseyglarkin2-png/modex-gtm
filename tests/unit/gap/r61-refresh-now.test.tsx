/**
 * R61: an in-place action shows its result at once. On the account page a refreshed tree that had arrived (about
 * 200 ms) was shown only on the next React update anywhere (the bell's 15 s poll: 13.9 s; with the poll held, never).
 * Every GAP refresh now announces itself and the GAP layout's nudge updates over the next seconds (measured after the
 * change on the production build: 236 ms with the poll held).
 */
import { act, render } from '@testing-library/react';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAP_REFRESHED, REFRESH_NUDGES_MS, RefreshNudge, refreshNow } from '@/components/gap/refresh-now';

describe('refreshNow and the layout nudge', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('refreshes the router and announces it', () => {
    const router = { refresh: vi.fn() };
    const heard = vi.fn();
    window.addEventListener(GAP_REFRESHED, heard);
    refreshNow(router);
    window.removeEventListener(GAP_REFRESHED, heard);
    expect(router.refresh).toHaveBeenCalledTimes(1);
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it('the nudge re-renders after each announced refresh, early and late, and stops listening when unmounted', () => {
    const spy = vi.spyOn(window, 'setTimeout');
    const { unmount } = render(<RefreshNudge />);
    const before = spy.mock.calls.length;
    act(() => {
      refreshNow({ refresh: () => {} });
    });
    const scheduled = spy.mock.calls.slice(before).map((c) => c[1]);
    expect(scheduled).toEqual([...REFRESH_NUDGES_MS]);
    expect(REFRESH_NUDGES_MS[0]).toBeLessThanOrEqual(150);
    expect(REFRESH_NUDGES_MS[REFRESH_NUDGES_MS.length - 1]).toBeGreaterThanOrEqual(6000);
    act(() => {
      vi.advanceTimersByTime(REFRESH_NUDGES_MS[REFRESH_NUDGES_MS.length - 1] + 1);
    });
    unmount();
    const afterUnmount = spy.mock.calls.length;
    refreshNow({ refresh: () => {} });
    expect(spy.mock.calls.length).toBe(afterUnmount);
    spy.mockRestore();
  });

  it('the GAP layout mounts the nudge once', () => {
    const layout = readFileSync('src/app/gap/layout.tsx', 'utf8');
    expect(layout.match(/<RefreshNudge \/>/g)).toHaveLength(1);
  });

  it('no GAP component refreshes without announcing it (a bare router.refresh() would wait for an unrelated update)', () => {
    const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : /\.tsx?$/.test(n) ? [join(d, n)] : []));
    const bare = [...walk('src/components/gap'), ...walk('src/app/gap')].filter((f) => !/refresh-now\.tsx$/.test(f) && /router\.refresh\(\)/.test(readFileSync(f, 'utf8')));
    expect(bare).toEqual([]);
  });
});
