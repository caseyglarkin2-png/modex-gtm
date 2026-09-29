/**
 * Final red team (research integrity): a web search that could not run is infrastructure state. It is never
 * "nothing found", never reused as an answer, never uses up a research request, and it fails over like Scout.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { runEvidenceResearch } from '@/lib/gap/research/run';
import { webCandidates } from '@/lib/gap/research/providers';
import { _resetCooldowns, type ScoutProvider } from '@/lib/gap/entity/providers';
import { operatingCount } from '@/lib/gap/entity/fit';

const NOW = new Date('2026-09-25T18:00:00.000Z');
function db() {
  const runs: Array<Record<string, unknown>> = [];
  const audit: Array<Record<string, unknown>> = [];
  const prisma = {
    researchRun: {
      create: async ({ data }: { data: Record<string, unknown> }) => (runs.push({ id: `run${runs.length}`, ...data }), { id: `run${runs.length - 1}` }),
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => Object.assign(runs.find((r) => r.id === where.id)!, data),
    },
    evidenceRecord: { findMany: async () => [] },
    prospectingSignal: { findMany: async () => [] },
    gapAuditEvent: { create: async ({ data }: { data: Record<string, unknown> }) => (audit.push(data), data) },
  };
  return { prisma, runs, audit };
}
const input = { accountName: 'Kroger', personaId: null, hypothesisId: null, problemFamily: null, decisionId: null, actor: 'x', now: NOW };
const prov = (name: ScoutProvider['name'], ask: ScoutProvider['ask']): ScoutProvider => ({ name, available: () => true, ask });
beforeEach(() => _resetCooldowns());

describe('research web outage', () => {
  it('the web search throwing is provider_unavailable, not insufficient_evidence', async () => {
    const { prisma, audit } = db();
    const r = await runEvidenceResearch(prisma as never, input, { edgar: async () => ({ candidates: [], note: '0 filings' }), web: async () => { throw new Error('no grounded web search (gemini quota)'); }, fetchText: async () => '' });
    expect(r.outcome).toBe('provider_unavailable');
    expect(audit[0]).toMatchObject({ payload: { outcome: 'provider_unavailable' } });
  });
  it('an honest empty answer from a working search is still insufficient_evidence', async () => {
    const { prisma } = db();
    const r = await runEvidenceResearch(prisma as never, input, { edgar: async () => ({ candidates: [], note: '0' }), web: async () => ({ candidates: [], note: '0 web proposals' }), fetchText: async () => '' });
    expect(r.outcome).toBe('insufficient_evidence');
  });
});

describe('webCandidates rides the grounded chain', () => {
  it('Gemini quota fails over; an empty grounded array is an answer', async () => {
    const quota = Object.assign(new Error('429 quota PerDay'), { status: 429 });
    const r = await webCandidates('Kroger', '', { providers: [prov('gemini', async () => { throw quota; }), prov('gateway_web', async () => ({ text: '[]', citations: ['https://news.example/a'] }))] });
    expect(r).toMatchObject({ candidates: [], note: '0 web proposals via gateway_web' });
  });
  it('no provider able to search throws (so the run records an outage), and an ungrounded answer is not used', async () => {
    await expect(webCandidates('Kroger', '', { providers: [prov('gemini', async () => ({ text: '[{"url":"https://x.example","excerpt":"a long enough excerpt from model memory, never searched at all"}]', citations: [], citedHosts: [] }))] })).rejects.toThrow(/no grounded web search \(gemini no citations/);
    await expect(webCandidates('Kroger', '', { providers: [] })).rejects.toThrow(/no provider configured/);
  });
});

describe('Scout claims matched only by site are a weaker lead', () => {
  it('two site-only operating claims count once: never a direct buyer on their own', () => {
    expect(operatingCount([{ claim: 'Operates 40 distribution centers', siteOnly: true }, { claim: 'Runs a fleet of 800 tractors', siteOnly: true }])).toBe(1);
    expect(operatingCount([{ claim: 'Operates 40 distribution centers' }, { claim: 'Runs a fleet of 800 tractors', siteOnly: true }])).toBe(2);
  });
});
