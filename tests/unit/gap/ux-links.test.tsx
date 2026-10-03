/**
 * V2 UX links: "Log what happened" opens capture with the account already chosen; BRIEF reads aloud without the
 * private engagement section; a modeled line says where its arithmetic is.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ hypotheses: [], personas: [] }), { status: 200 })));
import { CaptureFlow } from '@/components/gap/capture-flow';
import { briefListenText, type BriefSection } from '@/lib/gap/context/brief';
import { sellerLine } from '@/lib/gap/context/now';

describe('capture opened from an account', () => {
  it('starts with that account chosen', () => {
    render(<CaptureFlow initialAccount="Tyson Foods" />);
    expect(screen.getByTestId('capture-account').textContent).toBe('Tyson Foods');
  });
  it('without one, nothing is chosen', () => {
    render(<CaptureFlow />);
    expect(screen.queryByTestId('capture-account')).toBeNull();
  });
});

describe('BRIEF Listen', () => {
  it('reads every section but the private one', () => {
    const s = (key: string, title: string, notes: string[]): BriefSection => ({ key, title, lines: [], notes, unknowns: [], more: 0, detailsAnchor: null });
    const t = briefListenText('Acme', [s('network', 'Network', ['30 sites']), s('private', 'Private engagement', ['Private: 4 deep sessions on /for/acme'])]);
    expect(t).toBe('Acme, the meeting brief. Network. 30 sites');
    expect(t).not.toMatch(/Private|session/);
  });
});

describe('modeled lines', () => {
  it('say where the arithmetic is', () => {
    const l = sellerLine({ text: 'Roughly $1-3M a year', truth: 'MODELED_ESTIMATE', sources: [{ kind: 'roi', ref: null, label: 'roi', url: null, at: null }], model: { inputs: { a: 1 }, formula: 'x', range: [1, 3], unit: 'USD per year', assumptions: ['y'] } }, 'economics', { domains: [], accountName: 'Acme', citable: new Set() });
    expect(l).toMatchObject({ tag: 'Our read', basis: 'our model (how it is calculated: View details)' });
  });
});
