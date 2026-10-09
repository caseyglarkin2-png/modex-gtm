// @vitest-environment node
/**
 * C56 (the commercial-context audit, 2026-10-08): the October 8 replay over a sink-backed world through the real
 * orchestration (plan, intelligence, both briefing renderings, Pursue, the angle on the C53 packet, the promotion
 * into a Gmail draft, the accountability read). Every ticket C01-C44 receives an explicit disposition and none is a
 * silent exception; nothing is sent; no credential, no model.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { REFERENCE_SET } from './fixtures/reference-set';
import { mockedGenerator } from './fixtures/mocked-angle-generator';
import { CHRIS, DAN, renderReplay, replayOctober8, replayWorldSeed, TICKET_IDS } from '@/lib/gap/evaluation/replay-october8';

const NOW = new Date('2026-10-09T15:00:00Z');

describe('C56: the October 8 replay', () => {
  it('runs the day end to end on sinks: every C01-C44 ticket has a disposition, none an exception, nothing sent, both renderings present', async () => {
    const seed = replayWorldSeed(NOW);
    const db = ledgerDb({ accounts: seed.accounts, personas: seed.personas, inbound: seed.inbound, signals: seed.signals, triggers: seed.triggers }, NOW);
    const r = await replayOctober8(db.client(), { now: NOW, cases: REFERENCE_SET, generate: mockedGenerator() });
    const byId = new Map(r.dispositions.map((d) => [d.id, d]));
    for (const id of TICKET_IDS) expect(byId.has(id), id).toBe(true);
    const exceptions = r.dispositions.filter((d) => d.status === 'exception');
    expect(exceptions, exceptions.map((d) => `${d.id}: ${d.evidence}`).join('\n')).toEqual([]);
    expect(r.sent).toEqual([]);
    expect(r.drafts).toHaveLength(1);
    expect(r.briefing.text.length).toBeGreaterThan(200);
    expect(r.briefing.html).toContain('<');
    expect(r.intel.people.map((p) => p.id)).toContain(CHRIS);
    expect(r.intel.people.map((p) => p.id)).not.toContain(DAN);
    expect(r.plan.items.length).toBeGreaterThanOrEqual(14);
    const md = renderReplay(r, NOW, { measuredOctober8: 'The 18 items by kind (the measured record).' });
    expect(md).toContain('| C01 | demonstrated |');
    expect(md).toContain('| C39 | covered_by_test |');
    expect(md).toContain('exceptions 0.');
    expect(md).not.toMatch(/\?t=[A-Za-z0-9%._-]{20,}/);
  });
});
