// @vitest-environment node
/**
 * C54 (the commercial-context audit, 2026-10-08): the generated-usefulness harness. The real handler runs over the
 * frozen reference set with a scripted generator (MOCKED, labelled so, never a live claim): 36 held-out outputs are
 * scored per check with the sample size; a deliberately bad answer (a prohibited claim, a leaked seller note, a
 * pitch) is caught by the scorer; the run records the packet revision, the prompt hash and the cost from the ledger.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { REFERENCE_SET, REFERENCE_SET_VERSION, byId } from './fixtures/reference-set';
import { mockedGenerator } from './fixtures/mocked-angle-generator';
import { DECISIONS, evaluateQuality, GENERATING_MOTIONS, leakedSpan, mentions, QUALITY_CHECKS, renderQualityEval, scoreAngle, taskFor } from '@/lib/gap/evaluation/quality-eval';
import type { PreparedAngle } from '@/lib/gap/agents/develop-angle';

const NOW = new Date('2026-10-08T15:00:00Z');
const world = () => ledgerDb({ accounts: [...new Set(REFERENCE_SET.map((c) => c.account?.name).filter((x): x is string => !!x))], personas: REFERENCE_SET.filter((c) => c.person && c.account).map((c, n) => ({ id: n + 1, email: c.person!.email, name: c.person!.name, title: c.person!.title, account_name: c.account!.name, do_not_contact: false })) }, NOW);

describe('C54: the quality harness', () => {
  it('36 held-out outputs (6 generating cases x 2 variants x 3 decisions) through the real handler with the mocked generator; every check reports its sample; the report is labelled MOCKED', async () => {
    const r = await evaluateQuality(REFERENCE_SET, { now: NOW, referenceVersion: REFERENCE_SET_VERSION, prisma: world().client(), generate: mockedGenerator() });
    expect(r.mode).toBe('MOCKED');
    expect(r.sampleSize).toEqual({ cases: 6, outputs: 36, refused: 0 });
    expect(REFERENCE_SET.filter((c) => GENERATING_MOTIONS.has(c.expected.motion)).map((c) => c.id)).toEqual(['kenco-positive', 'ambiguous-subsidiary', 'pepsi-repeats', 'hormel-2018', 'general-mills-2013', 'two-deals']);
    expect(r.checks.produced.checked).toBe(36);
    for (const k of QUALITY_CHECKS) {
      // FINDING C54-1 (closed by builder B, agents/develop-angle.ts sourceLineFor through work/intel.ts isDateOnly): a date-only
      // publication names its own day; the pepsi case's three decisions are back to [].
      expect(r.checks[k].failures, k).toEqual([]);
    }
    expect(r.outputs.every((o) => o.packetRevision && o.promptHash)).toBe(true);
    expect(r.versions.models).toEqual(['mocked']);
    expect(r.cost).toEqual({ usd: 0, calls: 0, failed: 0, refused: 0 });
    const kenco = r.outputs.find((o) => o.caseId === 'kenco-positive' && o.variant === 'full' && o.decision === 'pursue')!;
    expect(kenco.angle).toMatchObject({ inDeal: true, dealId: '62700000001' });
    const md = renderQualityEval(r);
    expect(md).toContain('HARNESS CHECK ONLY (MOCKED generator; this is NOT a live model evaluation');
    expect(md).toContain('| no_prohibited_claim | 36 | 0 |');
    expect(md).toContain('| known_answer | 36 | 0 |');
    expect(md).toContain('| missing_source_said | 36 | 0 |');
    expect(md).toContain('| supported_claims | 36 | 0 |');
    expect(md).toContain('| no_authority_leak | 36 | 0 |');
    expect(md).toContain(`${DECISIONS.length} decisions = 36 outputs`);
  });

  it('a deliberately bad answer never passes: the handler refuses it or the scorer catches the prohibited claim, the leaked seller note, the pitch and the missing disconfirming question', async () => {
    const r = await evaluateQuality(REFERENCE_SET, { now: NOW, referenceVersion: REFERENCE_SET_VERSION, prisma: world().client(), generate: mockedGenerator({ bad: 'Dan Keller' }), cases: [byId('kenco-positive')] });
    expect(r.outputs.every((o) => !o.ok || o.failures.length > 0)).toBe(true);
    expect(renderQualityEval(r)).toContain('## Failures');
    // The scorer on its own, over the bad angle as if the handler had let it through.
    const k = byId('kenco-positive');
    const bad = { whyItMatters: 'There is no live opportunity here, so a cold opener is the move: no associated deal yet; the committee is the problem, so press on their yards today.', accounts: [], roles: [], people: [], peopleNamed: [], starters: ['Can we book thirty minutes to show the product?', 'Who signs the contract?'], proposedAction: 'email' as const, caveat: null, key: 'x', title: 'x', accountName: null, accountHint: null, sourceLine: '', preparedAt: NOW.toISOString(), inDeal: false, dealId: null, support: [] } as unknown as PreparedAngle;
    const checks = scoreAngle(k, 'full', bad);
    const details = (c: string) => checks.filter((f) => f.check === c).map((f) => f.detail);
    expect(details('no_prohibited_claim').some((d) => /no live opportunity/.test(d))).toBe(true);
    expect(details('no_prohibited_claim').some((d) => /cold opener/.test(d))).toBe(true);
    expect(details('no_authority_leak').some((d) => /vault:Kestrel\.md#standup-2026-07-11 \(seller_noted\)/.test(d))).toBe(true);
    expect(details('disconfirming').length).toBeGreaterThan(0);
    expect(details('motion_and_person').length).toBeGreaterThan(0);
    expect(details('supported_claims')).toEqual(['no support block on the angle']);
  });

  it('the scorer and the task builder: mentions reads alternatives; a six-word span is a leak; the task carries what a Pursue carries (the person, the deal on the contact, the last message)', () => {
    expect(mentions('a meeting is ahead on Oct 14', 'Oct 14|meeting is ahead')).toBe(true);
    expect(mentions('nothing', 'Oct 14|meeting is ahead')).toBe(false);
    const k = byId('kenco-positive');
    const vault = k.sources.find((s) => s.kind === 'vault')!;
    expect(leakedSpan('as noted, no associated deal yet; the committee is the problem here', vault)).toBe('No associated deal yet; the committee');
    expect(leakedSpan('the committee', vault)).toBeNull();
    const t = taskFor(byId('two-deals'), 'full', 'pursue', NOW);
    expect(t.itemKey).toBe('person:a.diaz@meridianfoods.example');
    expect(t.input).toMatchObject({ accountName: 'Meridian Foods', deals: [{ id: '62700000010', name: 'YardFlow - Meridian Dallas' }], opportunity: 'open', excerpt: expect.stringContaining('Dallas yard pilot') });
    const good = { whyItMatters: 'My guess is the record already says Open Dock stays, the account is in an open deal and a meeting is ahead on Oct 14, so the roadmap conversation about their yards continues from there rather than as a fresh opener.', accounts: [], roles: [], people: [], peopleNamed: [], starters: ['Is Open Dock still the plan at the ungated yards, or has that moved?', 'Who owns the roadmap sync on your side?'], proposedAction: 'email' as const, caveat: null, key: 'x', title: 'x', accountName: null, accountHint: null, sourceLine: '', preparedAt: NOW.toISOString(), inDeal: true, dealId: '62700000001', support: [{ text: 'x', where: 'whyItMatters' as const, refs: [{ label: 'K1' }] as never, kind: 'fact' as const }] } as unknown as PreparedAngle;
    expect(scoreAngle(k, 'full', good)).toEqual([]);
    expect(scoreAngle(k, 'full', { ...good, inDeal: false, dealId: null }).map((f) => f.check)).toEqual(['motion_and_person', 'motion_and_person']);
  });
});
