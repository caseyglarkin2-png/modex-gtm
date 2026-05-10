import { describe, expect, it } from 'vitest';
import { buildSourceBackedContractFromGeneratedText, extractSourceMarkers } from '@/lib/source-backed/attribution';

/**
 * The backfill script in scripts/backfill-source-attribution.ts wraps these
 * primitives with row I/O. Testing the script's I/O directly would require
 * a live DB; instead, this suite locks the contract-building branches that
 * the script depends on: (a) text with markers + valid generation input
 * builds a real contract; (b) text without markers returns null so the
 * script falls through to its legacy-stub branch.
 */
describe('backfill-source-attribution — branch coverage (S1-T6)', () => {
  it('builds a contract when the asset text has markers and generation input is present', () => {
    const generationInput = {
      account_brief: 'Acme — gate-to-dock variance.',
      angle: 'Lead with throughput pressure.',
      signals: ['Volume up 18% YoY', 'Dock dwell rising'],
      proof_context: ['Live at 24 facilities'],
      recommended_contacts: ['Taylor Lane'],
      committee_gaps: [],
      cta_mode: 'scorecard_reply',
      provenance: { provider: 'local' as const, status: 'ok' as const },
      freshness: { status: 'fresh', stale: false } as never,
      changed_since_last_refresh: null,
    };
    const content = [
      'The yard is where consolidation breaks down. [[SRC:signal_1]]',
      '',
      'Throughput is up. [[SRC:signal_2]] Live at 24 facilities. [[SRC:proof_1]]',
    ].join('\n');

    expect(extractSourceMarkers(content)).toEqual(['signal_1', 'signal_2', 'proof_1']);

    const contract = buildSourceBackedContractFromGeneratedText({
      content,
      accountName: 'Acme',
      generationInput,
    });

    expect(contract).not.toBeNull();
    expect(contract?.contract).toBe('source_backed_contract_v1');
    expect(contract?.citation_count).toBe(3);
    expect(contract?.evidence_refs.length).toBeGreaterThanOrEqual(2);
  });

  it('returns a zero-citation contract when text has no markers but generation input has signals', () => {
    // The script in scripts/backfill-source-attribution.ts uses
    // markers.length > 0 as a separate gate before calling this function;
    // this test confirms the function itself produces a citation_count=0
    // contract in this branch (catalog exists, no markers consumed).
    const generationInput = {
      account_brief: 'Acme.',
      angle: 'Lead.',
      signals: ['Some signal'],
      proof_context: [],
      recommended_contacts: [],
      committee_gaps: [],
      cta_mode: 'scorecard_reply',
      provenance: { provider: 'local' as const, status: 'ok' as const },
      freshness: { status: 'fresh', stale: false } as never,
      changed_since_last_refresh: null,
    };
    const content = 'No markers here. Just plain text.';
    expect(extractSourceMarkers(content)).toEqual([]);
    const contract = buildSourceBackedContractFromGeneratedText({
      content,
      accountName: 'Acme',
      generationInput,
    });
    expect(contract).not.toBeNull();
    expect(contract?.citation_count).toBe(0);
  });

  it('returns null when generation input has no evidence catalog (cold-start asset)', () => {
    const content = 'Some markers. [[SRC:signal_1]]';
    const contract = buildSourceBackedContractFromGeneratedText({
      content,
      accountName: 'Acme',
      generationInput: null,
    });
    expect(contract).toBeNull();
  });
});
