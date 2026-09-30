/**
 * Final research-integrity review (2026-09-30): a fact stored before a rule changed stays live forever unless the
 * brief re-checks it. Every stored fact is re-gated against TODAY's fact rules when a brief is read; nothing is
 * deleted (the row stays for audit), it just stops being a live fact.
 */
import { describe, expect, it } from 'vitest';
import { loadAccountInputs } from '@/lib/gap/account-intel/load';

const NOW = new Date('2026-09-30T12:00:00Z');
const row = (id: string, text: string) => ({ id, title: 't', evidence_text: text, evidence_url: 'https://sec.example/a', observed_at: new Date('2026-09-01'), freshness_expires_at: new Date('2026-12-01'), metadata: { verified: 'excerpt_found_at_source' } });
function fake(rows: unknown[]) {
  const empty = { findMany: async () => [], findUnique: async () => null, findFirst: async () => null, count: async () => 0 };
  const own = {
    $queryRaw: async () => [{ name: 'Unfi' }],
    account: { findUnique: async () => ({ name: 'Unfi', tier: null, priority_band: null, vertical: null, parent_brand: null, hubspot_company_id: null }), findMany: async () => [] },
    prospectingSignal: { ...empty, findMany: async ({ where }: { where: { source_kind?: string } }) => (where.source_kind === 'evidence_record' ? rows : []) },
  };
  return new Proxy(own, { get: (t, k) => (k in t ? t[k as keyof typeof t] : typeof k === 'string' && !k.startsWith('$') && k !== 'then' ? empty : undefined) }) as never;
}

describe('stored facts are re-gated on read', () => {
  it('a fact today\'s rules refuse (a software rollout, 10-K description) is not live; a real one is', async () => {
    const i = await loadAccountInputs(fake([
      row('ai', 'The company also completed the rollout of an AI-powered supply chain and procurement planning platform across its distribution network and expanded Lean Daily Management.'),
      row('xpo', 'In our North American LTL business, the caliber of our technology is mission-critical to our success; it optimizes pricing, linehaul, pickup-and-delivery and dock operations.'),
      row('dc', 'Unfi will close its Hopkins, Minnesota distribution center and consolidate volume into its other distribution centers in 2027.'),
    ]), 'Unfi', NOW);
    expect(i?.facts.map((f) => f.id)).toEqual(['dc']);
  });
});
