/**
 * R63 BLOCKER, the surface half: the floating "Compose email" button opened the legacy composer on GAP pages, and that
 * composer sent to a person whose "stop" reply was on file. GAP has its own send spine behind its gate, so no GAP page
 * offers the legacy composer: the button renders nothing under /gap and is unchanged elsewhere.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const nav = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname, useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/components/email/composer', () => ({ EmailComposer: () => null }));

import { GlobalComposeButton, isGapPath } from '@/components/global-compose-button';

const at = (pathname: string) => {
  nav.pathname = pathname;
  const { unmount } = render(<GlobalComposeButton />);
  const shown = screen.queryByRole('button', { name: 'Compose email' }) !== null;
  unmount();
  return shown;
};

describe('R63: the legacy composer is absent on every GAP page', () => {
  it('no Compose email button anywhere under /gap', () => {
    for (const p of ['/gap', '/gap/', '/gap/accounts/walmart-scratch-co-r63/', '/gap/capture/', '/gap/replies/', '/gap/learning/']) expect([p, at(p)]).toEqual([p, false]);
  });
  it('unchanged outside GAP, and a path that only starts with the letters is not GAP', () => {
    for (const p of ['/', '/accounts/acme-foods', '/queue', '/gapfoo']) expect([p, at(p)]).toEqual([p, true]);
    expect([isGapPath('/gap'), isGapPath('/gap/x'), isGapPath('/gaps'), isGapPath(null)]).toEqual([true, true, false, false]);
  });
});
