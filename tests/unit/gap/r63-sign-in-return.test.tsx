/**
 * R63-B S8: signed out, an account URL went to "/login/" with no return path, and sign-in landed on the home page. The
 * GAP pages' own sign-in fallback now carries the page, the login page reads the `callbackUrl` the session gate adds
 * (production already adds it: GET /gap/ answers 307 to /login/?callbackUrl=...), and sign-in lands back on the page.
 * Only a page on this site is ever carried (no open redirect).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const nav = vi.hoisted(() => ({ redirect: vi.fn((to: string) => { throw new Error(`REDIRECT ${to}`); }), push: vi.fn(), refresh: vi.fn() }));
const signIn = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ redirect: nav.redirect, notFound: vi.fn(() => { throw new Error('NOT_FOUND'); }), useRouter: () => ({ push: nav.push, refresh: nav.refresh }) }));
vi.mock('next-auth/react', () => ({ signIn }));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => null) }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

import { loginHref, safeReturnPath } from '@/lib/auth-return';
import LoginPage from '@/app/login/page';
import AccountPage from '@/app/gap/accounts/[slug]/page';

beforeEach(() => {
  process.env.GAP_OS_ENABLED = 'true';
  process.env.GAP_ROUTING_ENABLED = 'true';
  vi.clearAllMocks();
});

describe('R63-B S8: sign-in comes back to the page', () => {
  it('the return path: a page on this site only', () => {
    expect(loginHref('/gap/accounts/walmart-scratch-co-r63/')).toBe('/login?callbackUrl=%2Fgap%2Faccounts%2Fwalmart-scratch-co-r63%2F');
    expect(loginHref('https://evil.example/steal')).toBe('/login');
    expect(loginHref('//evil.example/steal')).toBe('/login');
    expect(loginHref(null)).toBe('/login');
    expect(safeReturnPath('https://modex-gtm.vercel.app/gap/accounts/x/?view=brief#next', 'https://modex-gtm.vercel.app')).toBe('/gap/accounts/x/?view=brief#next');
    expect(safeReturnPath('https://evil.example/gap/', 'https://modex-gtm.vercel.app')).toBe('/');
    expect(safeReturnPath('javascript:alert(1)', 'https://modex-gtm.vercel.app')).toBe('/');
    expect(safeReturnPath('/\\evil.example', 'https://modex-gtm.vercel.app')).toBe('/');
  });

  it('signed out, the account page sends sign-in with the account to come back to', async () => {
    await expect(AccountPage({ params: Promise.resolve({ slug: 'walmart-scratch-co-r63' }) })).rejects.toThrow('REDIRECT /login?callbackUrl=%2Fgap%2Faccounts%2Fwalmart-scratch-co-r63%2F');
  });

  it('the login page signs in back to the callback page, and to home when the callback is another site', () => {
    window.history.pushState({}, '', `/login/?callbackUrl=${encodeURIComponent(`${window.location.origin}/gap/accounts/walmart-scratch-co-r63/`)}`);
    const { unmount } = render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/ }));
    expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/gap/accounts/walmart-scratch-co-r63/' });
    unmount();
    window.history.pushState({}, '', `/login/?callbackUrl=${encodeURIComponent('https://evil.example/gap/')}`);
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/ }));
    expect(signIn).toHaveBeenLastCalledWith('google', { callbackUrl: '/' });
  });

  it('no GAP page signs in without the page to come back to', () => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(f)) files.push(p);
      }
    };
    walk('src/app/gap');
    walk('src/components/gap');
    const bare = files.filter((f) => readFileSync(f, 'utf8').includes("redirect('/login')"));
    expect(bare).toEqual([]);
  });
});
