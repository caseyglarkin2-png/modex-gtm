/**
 * Phase 2 final review P1 (practitioner lens): a verified fact that another
 * verified fact at the account contradicts is never KNOW and never quoted.
 */
// Imported at load (not inside the test): the seller-draft module graph is large, and loading it inside the test
// raced the 5s test timeout on a busy machine.
import { prepareSellerEmail } from '@/lib/gap/execution/seller-draft';
import { describe, expect, it, vi } from 'vitest';
import { contradictedFactIds } from '@/lib/gap/research/conflicts';
import { knowOf, buildBrief } from '@/lib/gap/execution/six-line-brief';
import { NOW, baseDeps, db, prismaOf } from './fixtures/seller-db';

const OPEN = 'Kroger will open its Dallas distribution center in March 2027 to serve Texas stores.';
const CLOSE = 'Kroger is closing the Dallas distribution center and moving volume to Houston.';
const fact = (id: string, text: string, over: Record<string, unknown> = {}) => ({ id, evidence_text: text, freshness_expires_at: null, ...over });

function reader(facts: unknown[], ignored: string[] = []) {
  return {
    prospectingSignal: { findMany: vi.fn(async () => facts) },
    gapAuditEvent: { findMany: vi.fn(async () => ignored.map((subject_id) => ({ subject_id }))) },
  };
}

describe('contradictedFactIds', () => {
  it('an opening and a closing of the same site contradict each other', async () => {
    const m = await contradictedFactIds(reader([fact('s1', OPEN), fact('s2', CLOSE)]), 'Kroger', NOW);
    expect([...m.keys()].sort()).toEqual(['s1', 's2']);
    expect(m.get('s1')).toBe('Dallas');
  });

  it('ignoring one side resolves it; an expired side does not count', async () => {
    expect((await contradictedFactIds(reader([fact('s1', OPEN), fact('s2', CLOSE)], ['s2']), 'Kroger', NOW)).size).toBe(0);
    expect((await contradictedFactIds(reader([fact('s1', OPEN), fact('s2', CLOSE, { freshness_expires_at: new Date('2026-01-01') })]), 'Kroger', NOW)).size).toBe(0);
  });

  it('a failed read throws (the send gate fails closed)', async () => {
    const broken = { prospectingSignal: { findMany: vi.fn(async () => { throw new Error('db down'); }) }, gapAuditEvent: { findMany: vi.fn() } };
    await expect(contradictedFactIds(broken, 'Kroger', NOW)).rejects.toThrow('db down');
  });
});

describe('KNOW never shows a contradicted fact', () => {
  const hyp = { account_name: 'Kroger', signals: [{ role: 'primary', signal: { id: 's1', account_name: 'Kroger', source_kind: 'evidence_record', source_type: 'public_secondary', title: 'Kroger Dallas', evidence_text: OPEN, evidence_url: 'https://x', external_ok: true, observed_at: NOW, metadata: { verified: 'excerpt_found_at_source' } } }] };

  it('says why instead of calling it verified', () => {
    expect(knowOf(hyp, NOW, new Map([['s1', 'Dallas']]))).toEqual({ fact: null, reason: 'Verified facts about Dallas contradict each other: neither can be quoted. Ignore the side you do not believe in Research.' });
    expect(knowOf(hyp, NOW).fact).not.toBeNull();
  });

  it('a contradiction check that could not run never lets the fact read as known', () => {
    const b = buildBrief({ hypothesis: hyp, firstName: 'J', angle: null, suggestedAngle: null, history: null, now: NOW, contradicted: null });
    expect(b.know).toEqual({ fact: null, reason: 'Could not check this fact against the other evidence just now. Every send re-checks before anything goes out.' });
  });
});

describe('the send gate refuses a contradicted fact', () => {
  it('prepareSellerEmail: fact_contradicted, before any Gmail call', async () => {
    const d = db();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma: any = prismaOf(d);
    const linked = d.hypotheses[0].signals[0].signal;
    prisma.prospectingSignal = { findMany: vi.fn(async () => [fact(linked.id, OPEN), fact('sig-close', CLOSE)]) };
    const r = await prepareSellerEmail(prisma, { decisionId: 'dec-joey', actor: 'casey@freightroll.com', now: NOW, stepIndex: 0 }, baseDeps(d));
    expect(r).toMatchObject({ ok: false, reason: 'fact_contradicted' });
  });
});
