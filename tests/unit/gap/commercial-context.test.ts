// @vitest-environment node
/**
 * C13 (the commercial-context audit, 2026-10-08): the one packet contract. Untyped claims are refused; a refresh
 * time is never an observation date; external use excludes internal, modeled and inferred claims and superseded
 * ones; the revision fingerprint is order independent and moves only when a source id, version or date moves;
 * the empty packet says every source is absent, never an empty history.
 */
import { describe, expect, it } from 'vitest';
import { byAuthority, contextFingerprint, coverageLine, emptyPacket, externallyUsable, validateClaims, type ContextClaim } from '@/lib/gap/context/commercial-context';

const NOW = new Date('2026-10-08T15:00:00Z');
const claim = (over: Partial<ContextClaim> = {}): ContextClaim => ({
  claimId: 'c1', sourceId: 'gmail:1a0aa7d3c587d944', sourceKind: 'gmail', authority: 'buyer_words', eventAt: '2026-09-16T14:02:00.000Z', observedAt: '2026-09-16T14:02:00.000Z', indexedAt: null, url: null, version: null, completeness: 'complete', visibility: 'internal',
  text: 'We will keep Open Dock at the ungated locations and pilot Blue Yonder YMS where the WMS is migrating.', claimClass: 'buyer_said', about: 'account', subjectId: 'Kenco Logistics', ...over,
});

describe('C13: the commercial-context packet', () => {
  it('refuses an untyped claim by its fault, and a refresh time passed off as an observation date', () => {
    expect(validateClaims([claim()])).toMatchObject({ ok: true });
    expect(validateClaims([claim({ sourceId: '' })])).toEqual({ ok: false, faults: [{ claimId: 'c1', reason: 'no_source_id' }] });
    expect(validateClaims([claim({ claimClass: 'opinion' as never })])).toEqual({ ok: false, faults: [{ claimId: 'c1', reason: 'no_class' }] });
    expect(validateClaims([claim({ authority: undefined })])).toEqual({ ok: false, faults: [{ claimId: 'c1', reason: 'no_authority' }] });
    expect(validateClaims([claim({ visibility: undefined })])).toEqual({ ok: false, faults: [{ claimId: 'c1', reason: 'no_visibility' }] });
    expect(validateClaims([claim({ text: '  ' })])).toEqual({ ok: false, faults: [{ claimId: 'c1', reason: 'no_text' }] });
    // C15: a vault file rebuilt today with a July wedge: the wedge's observedAt is July (or unknown), never the rebuild time.
    expect(validateClaims([claim({ sourceKind: 'clawd', eventAt: null, observedAt: '2026-10-08T13:02:52.000Z', indexedAt: '2026-10-08T13:02:52.000Z' })])).toEqual({ ok: false, faults: [{ claimId: 'c1', reason: 'refresh_as_observation' }] });
    expect(validateClaims([claim({ sourceKind: 'clawd', eventAt: null, observedAt: '2026-07-11T00:00:00.000Z', indexedAt: '2026-10-08T13:02:52.000Z' })])).toMatchObject({ ok: true });
  });

  it('external use excludes internal, modeled, inferred and superseded claims; authority answers one question at a time', () => {
    const buyer = claim({ visibility: 'external_ok' });
    const modeled = claim({ claimId: 'c2', claimClass: 'modeled', authority: 'modeled', visibility: 'external_ok', text: '$98.9M modeled' });
    const standup = claim({ claimId: 'c3', claimClass: 'seller_noted', authority: 'seller_interpretation', sourceKind: 'vault', sourceId: 'vault:Kenco#standup', text: 'the committee is the problem' });
    const scanned = claim({ claimId: 'c4', claimClass: 'inference', authority: 'seller_interpretation', visibility: 'external_ok', text: 'deck scanned, so they are interested' });
    const old = claim({ claimId: 'c5', visibility: 'external_ok', supersededBy: 'c1', text: 'an older statement' });
    expect(externallyUsable([buyer, modeled, standup, scanned, old]).map((c) => c.claimId)).toEqual(['c1']);
    expect(byAuthority([buyer, standup], 'seller_interpretation').map((c) => c.claimId)).toEqual(['c3']);
    const crmNoDeal = claim({ claimId: 'v1', sourceKind: 'vault', authority: 'seller_interpretation', claimClass: 'seller_noted', text: 'no associated deal', observedAt: '2026-07-11T00:00:00.000Z' });
    const crmDeal = claim({ claimId: 'h1', sourceKind: 'crm', authority: 'deal_existence', claimClass: 'checked_public', text: 'open deal 62704698979', observedAt: '2026-10-08T14:55:00.000Z' });
    // C17: deal existence is the CRM's to answer; the vault's no-deal line is not in that authority.
    expect(byAuthority([crmNoDeal, crmDeal], 'deal_existence').map((c) => c.claimId)).toEqual(['h1']);
  });

  it('the fingerprint is order independent and moves only when a source id, version or date moves', () => {
    const base = emptyPacket(NOW);
    const a = { ...base, buyerFacts: [claim(), claim({ claimId: 'c2', sourceId: 'gmail:2' })] };
    const b = { ...base, buyerFacts: [claim({ claimId: 'c2', sourceId: 'gmail:2' }), claim()] };
    expect(contextFingerprint(a)).toBe(contextFingerprint(b));
    expect(contextFingerprint({ ...a, buyerFacts: [claim({ text: 'different words, same source and date' }), claim({ claimId: 'c2', sourceId: 'gmail:2' })] })).toBe(contextFingerprint(a));
    expect(contextFingerprint({ ...a, buyerFacts: [claim({ observedAt: '2026-10-01T00:00:00.000Z' }), claim({ claimId: 'c2', sourceId: 'gmail:2' })] })).not.toBe(contextFingerprint(a));
    expect(contextFingerprint({ ...a, opportunity: { ...a.opportunity, status: 'open', deals: [{ id: '62704698979', name: 'YardFlow - Kenco', stage: 'presentationscheduled', nextStep: null, closeDate: null, contactIds: [] }] } })).not.toBe(contextFingerprint(a));
    expect(contextFingerprint({ ...a, identity: { ...a.identity, accountName: 'Kenco Logistics', via: 'domain' } })).not.toBe(contextFingerprint(a));
  });

  it('the empty packet says every source is absent, never an empty history; coverage reads as words', () => {
    const p = emptyPacket(NOW);
    expect(p.opportunity).toMatchObject({ status: 'unknown', coverage: 'absent' });
    expect(p.coverage.map(coverageLine)).toEqual(['crm: not configured', 'gmail: not configured', 'vault: not configured', 'clawd: not configured']);
    expect(coverageLine({ source: 'gmail', configured: true, reachable: true, completeness: 'partial', watermark: '2026-10-05T10:00:00.000Z', indexedAt: null, query: 'from:dave.kiesling@kencogroup.com', omittedReason: 'page 2 not read' })).toBe('gmail: partial, newest 2026-10-05');
    expect(coverageLine({ source: 'clawd', configured: true, reachable: false, completeness: 'unknown', watermark: null, indexedAt: null, query: 'Kenco', omittedReason: 'timeout' })).toBe('clawd: unreachable (timeout)');
  });
});
