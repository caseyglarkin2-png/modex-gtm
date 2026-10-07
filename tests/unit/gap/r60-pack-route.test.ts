/**
 * R60: a first touch or follow-up opens its card's own pack page (the email, the call, Send from YardFlow), never the
 * cockpit lane that lists every account's cards; a card with no thesis opens its account; the Work position rides.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

const redirected: string[] = [];
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    redirected.push(url);
    throw new Error(`NEXT_REDIRECT ${url}`);
  },
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
const findUnique = vi.fn();
vi.mock('@/lib/prisma', () => ({ prisma: { routingDecision: { findUnique: (...a: unknown[]) => findUnique(...a) } } }));
vi.mock('@/lib/gap/flags', () => ({ assertGapEnabled: () => null }));

import PackPage from '@/app/gap/pack/[decisionId]/page';
import { isCockpitLaneHref, packHref, withWorkContext } from '@/lib/gap/account-intel/href';

const open = async (decisionId: string, q: Record<string, string> = {}) => {
  redirected.length = 0;
  await expect(PackPage({ params: Promise.resolve({ decisionId }), searchParams: Promise.resolve(q) })).rejects.toThrow(/NEXT_(REDIRECT|NOT_FOUND)/);
  return redirected[0] ?? 'not found';
};

describe('/gap/pack/:decisionId', () => {
  beforeEach(() => findUnique.mockReset());
  it('a card with a thesis opens its pack page for its own person and card', async () => {
    findUnique.mockResolvedValue({ hypothesis_id: 'h1', persona_id: 41, account_name: 'Acme Foods' });
    expect(await open('d9')).toBe('/gap/preview/h1?personaId=41&decisionId=d9');
  });
  it('opened from Work, the position rides along (the pack ends with Back to Work / Next account)', async () => {
    findUnique.mockResolvedValue({ hypothesis_id: 'h1', persona_id: 41, account_name: 'Acme Foods' });
    expect(await open('d9', { from: 'work', i: '4' })).toBe('/gap/preview/h1?personaId=41&decisionId=d9&from=work&i=4');
  });
  it('a card with no thesis opens its account (NEXT there says what is missing); an unknown card is not found', async () => {
    findUnique.mockResolvedValue({ hypothesis_id: null, persona_id: 41, account_name: 'Acme Foods' });
    expect(await open('d9', { from: 'work', i: '2' })).toBe('/gap/accounts/acme-foods?from=work&i=2');
    findUnique.mockResolvedValue(null);
    expect(await open('nope')).toBe('not found');
  });
  it('the Work position is carried onto a pack link, and the pack page renders the Back to Work / Next account bar', () => {
    expect(withWorkContext(packHref('d9'), 'Acme Foods', 4)).toBe('/gap/pack/d9?from=work&i=4');
    const preview = readFileSync('src/app/gap/preview/[hypothesisId]/page.tsx', 'utf8');
    expect(preview).toMatch(/search\.from === 'work' \? <DoneNext /);
  });
});

describe('no seller path lands in a cockpit lane', () => {
  it('a lane link is recognized in every form the app writes it', () => {
    for (const h of ['/gap?lane=research', '/gap/?lane=replies', '/gap?lane=follow_up&open=d1#card-d1', '/gap?fresh=1&lane=review']) expect(isCockpitLaneHref(h), h).toBe(true);
    for (const h of ['/gap', '/gap?fresh=1', '/gap/accounts/acme?view=brief', '/gap/pack/d1', '/gap/replies', '/gap?focus=lane-co']) expect(isCockpitLaneHref(h), h).toBe(false);
  });
  it('Work, the account page, NEXT, the ready target, follow-ups, replies and the candidates link to an account, a pack or Gmail', () => {
    for (const f of ['src/lib/gap/work/list.ts', 'src/lib/gap/pursuit/next.ts', 'src/lib/gap/pursuit/load.ts', 'src/lib/gap/context/send-target.ts', 'src/lib/gap/execution/follow-up-plan.ts', 'src/lib/gap/routing/next-up.ts', 'src/lib/gap/replies/prepare.ts', 'src/app/gap/accounts/[slug]/page.tsx', 'src/components/gap/work-list.tsx']) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/['`"]\/gap\?lane=/);
    }
    expect(readFileSync('src/app/gap/page.tsx', 'utf8')).toMatch(/openHref: \(_lane, decisionId\) => packHref\(decisionId\)/);
  });
});
