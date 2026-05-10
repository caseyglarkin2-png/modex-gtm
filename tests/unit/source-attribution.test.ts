import { describe, expect, it } from 'vitest';
import {
  assertMinimumCitationThreshold,
  buildSourceBackedContractFromGeneratedText,
  extractSourceMarkers,
  readSourceBackedContractFromMetadata,
  stripSourceMarkers,
} from '@/lib/source-backed/attribution';

describe('source-backed attribution', () => {
  it('extracts and strips inline source markers', () => {
    const content = 'Angle text [[SRC:signal_1]] and more [[SRC:proof_1]].';
    expect(extractSourceMarkers(content)).toEqual(['signal_1', 'proof_1']);
    expect(stripSourceMarkers(content)).toBe('Angle text and more .');
  });

  it('builds contract from generated text + generation input', () => {
    const contract = buildSourceBackedContractFromGeneratedText({
      content: 'We can reduce dock variance [[SRC:signal_1]].',
      accountName: 'Acme Foods',
      personaName: 'Pat Brewer',
      generationInput: {
        account_brief: 'Acme has dock variability.',
        signals: ['Dock variability is increasing'],
        angle: 'Lead with gate-to-dock consistency.',
        recommended_contacts: ['Pat Brewer'],
        committee_gaps: [],
        proof_context: ['Primo reduced drop and hook time'],
        cta_mode: 'scorecard_reply',
        provenance: {
          provider: 'local',
          status: 'ok',
        },
        freshness: {
          fetchedAt: '2026-05-07T00:00:00.000Z',
          source: 'live',
          stale: false,
          status: 'fresh',
          dimensions: {
            summary: {
              key: 'summary',
              label: 'Research summary',
              status: 'fresh',
              stale: false,
              source: 'live',
              fetchedAt: '2026-05-07T00:00:00.000Z',
              updatedAt: '2026-05-07T00:00:00.000Z',
              ageHours: 0,
              note: '',
            },
            signals: {
              key: 'signals',
              label: 'Signals',
              status: 'fresh',
              stale: false,
              source: 'live',
              fetchedAt: '2026-05-07T00:00:00.000Z',
              updatedAt: '2026-05-07T00:00:00.000Z',
              ageHours: 0,
              note: '',
            },
            contacts: {
              key: 'contacts',
              label: 'Contacts',
              status: 'fresh',
              stale: false,
              source: 'local',
              fetchedAt: '2026-05-07T00:00:00.000Z',
              updatedAt: '2026-05-07T00:00:00.000Z',
              ageHours: 0,
              note: '',
            },
            generated_content: {
              key: 'generated_content',
              label: 'Generated content',
              status: 'fresh',
              stale: false,
              source: 'local',
              fetchedAt: '2026-05-07T00:00:00.000Z',
              updatedAt: '2026-05-07T00:00:00.000Z',
              ageHours: 0,
              note: '',
            },
          },
        },
        changed_since_last_refresh: null,
      },
    });

    expect(contract?.contract).toBe('source_backed_contract_v1');
    expect(contract?.evidence_refs.length).toBeGreaterThan(0);
    expect(contract?.angles.length).toBeGreaterThan(0);
  });

  it('enforces citation threshold for required attribution', () => {
    const reject = assertMinimumCitationThreshold({
      attribution: null,
      requireAttribution: true,
      citationThreshold: 1,
    });
    expect(reject.ok).toBe(false);
  });

  it('parses stored attribution from metadata and falls back for legacy rows', () => {
    const fromMetadata = readSourceBackedContractFromMetadata({
      source_backed_contract_v1: {
        contract: 'source_backed_contract_v1',
        account_wedge: 'Wedge',
        person_wedge: 'Person wedge',
        angles: [{ id: 'a1', label: 'Primary angle', rationale: 'Why now', evidence_ref_ids: ['signal_1'] }],
        evidence_refs: [{ id: 'signal_1', label: 'Signal', claim: 'Claim', source_type: 'signal', provider: 'test' }],
        citation_count: 1,
        citation_threshold: 1,
      },
    });
    expect(fromMetadata.contract?.contract).toBe('source_backed_contract_v1');
    expect(fromMetadata.legacyFallback).toBe(false);

    const legacy = readSourceBackedContractFromMetadata({});
    expect(legacy.contract).toBe(null);
    expect(legacy.legacyFallback).toBe(true);
  });
});
