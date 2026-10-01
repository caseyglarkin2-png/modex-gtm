/**
 * Phase 2 C1 (PersonaAngle), C5 (NEXT UP v2), the cockpit motion loader and
 * the account motion panel.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { loadAngles, setAngle, suggestAngle, PERSONA_ANGLE } from '@/lib/gap/motion/persona-angle';
import { buildNextUpCandidates, heldAccountsOf, pickNextUpV2, type NextCandidate } from '@/lib/gap/routing/next-up';
import { loadCockpitMotions } from '@/lib/gap/motion/cockpit';
import { AccountMotionPanel } from '@/components/gap/account-motion-panel';
import type { CockpitMotion } from '@/lib/gap/motion/cockpit';

describe('PersonaAngle', () => {
  it('suggests only from the title (labelled suggested elsewhere), never inventing responsibilities; nothing for an empty title', () => {
    expect(suggestAngle({ title: 'VP Transportation', personaKey: 'transportation', accountName: 'Kroger' })).toMatch(/^Runs transportation at Kroger/);
    expect(suggestAngle({ title: 'Director of DC Operations', personaKey: 'distribution', accountName: 'PepsiCo' })).toMatch(/^Runs distribution at PepsiCo/);
    expect(suggestAngle({ title: 'Sr Director Transportation Procurement', personaKey: 'transportation', accountName: 'PepsiCo' })).toMatch(/^Buys transportation for PepsiCo/);
    expect(suggestAngle({ title: '', personaKey: null, accountName: 'X' })).toBeNull();
    expect(suggestAngle({ title: 'Brand Ambassador', personaKey: null, accountName: 'X' })).toBeNull();
    for (const t of ['VP Supply Chain', 'Chief Supply Chain Officer', 'Plant Manager', 'Security Manager']) expect(suggestAngle({ title: t, personaKey: null, accountName: 'Acme' })).not.toMatch(/throughput/);
  });

  it('setAngle appends one audit row (human-owned); empty and overlong text are refused; unknown person 404', async () => {
    const rows: any[] = [];
    const prisma = {
      persona: { findUnique: vi.fn(async ({ where }: any) => (where.id === 7 ? { id: 7, account_name: 'PepsiCo' } : null)) },
      gapAuditEvent: { create: vi.fn(async ({ data }: any) => { rows.push(data); return { created_at: new Date() }; }) },
    };
    expect(await setAngle(prisma, { personaId: 7, text: '   ', source: 'human', actor: 'casey' })).toEqual({ ok: false, reason: 'empty' });
    expect(await setAngle(prisma, { personaId: 7, text: 'x'.repeat(241), source: 'human', actor: 'casey' })).toEqual({ ok: false, reason: 'too_long' });
    expect(await setAngle(prisma, { personaId: 9, text: 'ok', source: 'human', actor: 'casey' })).toEqual({ ok: false, reason: 'persona_not_found' });
    const r = await setAngle(prisma, { personaId: 7, text: '  Owns the NA beverage DC network.  ', source: 'accepted_suggestion', actor: 'casey' });
    expect(r).toMatchObject({ ok: true, angle: { text: 'Owns the NA beverage DC network.', source: 'accepted_suggestion' } });
    expect(rows).toEqual([{ kind: PERSONA_ANGLE, actor: 'casey', subject_type: 'persona', subject_id: '7', payload: { accountName: 'PepsiCo', text: 'Owns the NA beverage DC network.', source: 'accepted_suggestion' } }]);
  });

  it('loadAngles: the newest row per person wins (keyed on the person, so it survives hypothesis revision)', async () => {
    const prisma = {
      gapAuditEvent: {
        findMany: vi.fn(async () => [
          { subject_id: '7', actor: 'casey', payload: { text: 'newest', source: 'human' }, created_at: new Date('2026-09-28') },
          { subject_id: '7', actor: 'casey', payload: { text: 'older' }, created_at: new Date('2026-09-20') },
        ]),
      },
    };
    const m = await loadAngles(prisma, [7]);
    expect(m.get(7)?.text).toBe('newest');
  });
});

describe('NEXT UP v2: deterministic, one per account, never a held account', () => {
  const c = (lane: NextCandidate['lane'], account: string | null, key: Array<number | string>, over: Partial<NextCandidate> = {}): NextCandidate => ({ lane, accountName: account, title: `${lane}:${account}`, detail: '', href: '/gap', sortKey: key, ...over });

  it('lane order first; within a lane the rule key; one item per account; held accounts and gate failures skipped', () => {
    const picked = pickNextUpV2(
      [
        c('research', 'PepsiCo', [-5]),
        c('ready', 'Kroger', [1]),
        c('ready', 'PepsiCo', [2]),
        c('review', 'PepsiCo', [-3]),
        c('replies', 'Acme', [200]),
        c('replies', 'Beta', [100]),
        c('follow_up', 'Gamma', [1], { failsGate: true }),
      ],
      new Set(['Kroger']),
    );
    expect(picked.map((p) => p.title)).toEqual(['replies:Beta', 'replies:Acme', 'ready:PepsiCo']);
  });

  it('buildNextUpCandidates: oldest reply first, soonest primary-fact expiry first in READY, most people first in REVIEW/RESEARCH', () => {
    const person = { id: 1, displayName: 'Jordan', email: 'j@x.com', title: 'VP' };
    const cands = buildNextUpCandidates({
      replies: [
        { accountName: 'A', contactEmail: 'new@a.com', subject: 's', snippet: '', receivedAt: '2026-09-28T10:00:00Z' },
        { accountName: 'B', contactEmail: 'old@b.com', subject: 's', snippet: '', receivedAt: '2026-09-27T10:00:00Z' },
      ],
      followUps: [],
      ready: [
        { id: 'r1', account: { name: 'Late' }, persona: person, hypothesis: { id: 'h1' }, createdAt: '2026-09-20', ruleId: 'enroll' },
        { id: 'r2', account: { name: 'Soon' }, persona: person, hypothesis: { id: 'h2' }, createdAt: '2026-09-25', ruleId: 'enroll' },
      ],
      primaryExpiry: new Map([['h1', '2026-12-01T00:00:00Z'], ['h2', '2026-10-05T00:00:00Z']]),
      reviewGroups: [{ accountName: 'Small', people: 1 }, { accountName: 'Big', people: 4 }],
      readyOneOffs: [],
      researchGroups: [{ accountName: 'PepsiCo', people: 5 }],
      researchCards: [],
      inbox: [{ accountName: 'Unfi', ready: 1, people: 0 }],
      tiers: new Map(),
      openHref: (lane, id) => `/gap?lane=${lane}&open=${id}`,
    });
    const picked = pickNextUpV2(cands, new Set(), 10);
    expect(picked.map((p) => p.title)).toEqual([
      'old@b.com replied',
      'new@a.com replied',
      'Contact Jordan',
      'Contact Jordan',
      'Decide the Big thesis',
      'Decide the Small thesis',
      'Find verified evidence for the PepsiCo thesis',
      'Judge 1 verified fact at Unfi',
    ]);
    expect(picked[2].href).toBe('/gap?lane=ready&open=r2');
  });

  it('heldAccountsOf: an open deal or unknown opportunity truth on any current card holds the account', () => {
    expect([...heldAccountsOf([{ account: { name: 'Kroger' }, ruleId: 'active_opportunity' }, { account: { name: 'X' }, ruleId: 'opportunity_unknown' }, { account: { name: 'Y' }, ruleId: 'enroll' }])].sort()).toEqual(['Kroger', 'X']);
  });
});

describe('loadCockpitMotions', () => {
  const item = (id: string, pid: number, action: string, title: string) => ({
    id,
    action,
    lane: 'work_queue',
    ruleId: 'enroll',
    priority: 50,
    blocked: false,
    target: null,
    explain: null,
    account: { name: 'PepsiCo', hubspotCompanyId: null, tam: 'in', tamTier: 'A', heatTier: 1 },
    persona: { id: pid, personaKey: 'supply_chain', displayName: `P${pid}`, email: `p${pid}@pepsico.com`, hubspotContactId: null, title, phone: '+15550000000', linkedinUrl: 'https://linkedin.com/in/x' },
    hypothesis: { id: `h${pid}`, status: 'active', family: 'hidden_capacity', confidence: 50 },
    suppression: { class: 'clear', hits: [] },
    touch: null,
    humanAction: null,
    humanActionAt: null,
    createdAt: new Date('2026-09-28'),
  });
  const prisma = {
    gapAuditEvent: { findMany: vi.fn(async () => []) },
    routingDecision: { findMany: vi.fn(async () => []) },
    inboundMessage: { findMany: vi.fn(async () => []) },
    prospectingHypothesis: { findMany: vi.fn(async () => [{ id: 'h1', persona: 'supply_chain' }, { id: 'h2', persona: 'supply_chain' }]) },
  };

  it('holds every email card but the primary; call and LinkedIn cards are human judgment and never held', async () => {
    const items = [item('e1', 1, 'one_off_email', 'VP Supply Chain'), item('e2', 2, 'enroll_gap_sequence', 'Supply Chain Manager'), item('c3', 3, 'call_now', 'Director DC'), item('l4', 4, 'linkedin_manual_task', 'Director DC')];
    const r = await loadCockpitMotions(prisma, items as never, new Date('2026-09-30T15:00:00Z'), { thesisCurrent: async () => ({ current: true as const }) });
    expect(r.heldCardIds).toEqual(['e2']);
    expect(r.motions).toHaveLength(1);
    expect(r.motions[0]).toMatchObject({ state: 'ready', primary: { personaId: 1 }, next: { personaId: 2 } });
    expect(r.motions[0].angles['1'].suggested).toMatch(/PepsiCo/);
  });
});

describe('<AccountMotionPanel>', () => {
  const motion: CockpitMotion = {
    accountName: 'PepsiCo',
    state: 'ready',
    primary: { personaId: 1, name: 'Jordan VP', title: 'VP Supply Chain', cardId: 'e1', factors: ['VP (VP Supply Chain)', 'matches the thesis role (supply chain)', 'email and phone'], chosen: false },
    next: { personaId: 2, name: 'Sam Mgr', title: 'Manager', cardId: 'e2', factors: ['manager'], unlock: 'after 5 business days with no response to Jordan VP, or at once if that address fails', unlockAt: null },
    alsoWaiting: [{ personaId: 3, name: 'Dana Dir', title: 'Director', cardId: 'e3', factors: ['director'] }],
    heldCardIds: ['e2', 'e3'],
    headline: 'Suggested primary: Jordan VP.',
    angles: { '1': { personaId: 1, angle: null, suggested: 'Owns the PepsiCo supply chain network.' }, '2': { personaId: 2, angle: { personaId: 2, text: 'Works the DC.', source: 'human', by: 'casey', at: '' }, suggested: null } },
  };

  it('shows primary, why (suggested vs owned), next and the unlock condition', () => {
    render(<AccountMotionPanel motion={motion} />);
    expect(screen.getByTestId('motion-primary')).toHaveTextContent('Suggested primary: Jordan VP');
    expect(screen.getByTestId('angle-suggested')).toHaveTextContent('Suggested why: Owns the PepsiCo supply chain network.');
    expect(screen.getByTestId('angle-current')).toHaveTextContent('Why this person: Works the DC.');
    expect(screen.getByTestId('motion-unlock')).toHaveTextContent('Unlocks after 5 business days with no response');
    // Review C P1: everyone else waiting is visible and can be made the primary.
    expect(screen.getByTestId('motion-also-waiting')).toHaveTextContent('Dana Dir');
  });

  it('any waiting person can be made the primary (the current primary becomes next)', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 201 }));
    render(<AccountMotionPanel motion={motion} />);
    fireEvent.click(screen.getByTestId('motion-make-primary'));
    await waitFor(() => expect(f).toHaveBeenCalledTimes(1));
    expect(JSON.parse(String((f.mock.calls[0] as [string, RequestInit])[1].body))).toEqual({ accountName: 'PepsiCo', primaryPersonaId: 3, nextPersonaId: 1 });
    f.mockRestore();
  });

  it('accepting a suggested angle records it as accepted_suggestion; swapping records the new primary', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 201 }));
    render(<AccountMotionPanel motion={motion} />);
    fireEvent.click(screen.getByTestId('angle-accept'));
    await waitFor(() => expect(f).toHaveBeenCalledTimes(1));
    expect(f.mock.calls[0][0]).toBe('/api/gap/personas/1/angle');
    expect(JSON.parse(String((f.mock.calls[0] as [string, RequestInit])[1].body))).toEqual({ text: 'Owns the PepsiCo supply chain network.', source: 'accepted_suggestion' });
    fireEvent.click(screen.getByTestId('motion-swap'));
    await waitFor(() => expect(f).toHaveBeenCalledTimes(2));
    expect(JSON.parse(String((f.mock.calls[1] as [string, RequestInit])[1].body))).toEqual({ accountName: 'PepsiCo', primaryPersonaId: 2, nextPersonaId: 1 });
    f.mockRestore();
  });
});
