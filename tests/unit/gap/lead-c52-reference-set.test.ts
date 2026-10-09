// @vitest-environment node
/**
 * C52 (the commercial-context audit, 2026-10-08): the reference evaluation set is frozen (its fingerprint is pinned
 * in fixtures/reference-set.lock; a deliberate change bumps REFERENCE_SET_VERSION and the lock together, with the
 * reason in the ledger), every source is a typed claim the C13 contract accepts, the external-use rule holds over
 * it, and the pure classifiers already in the tree (purpose, re-engage eligibility) agree with each case's expected
 * purposes and motion. The instruction-shaped text is present verbatim as quoted data so C53 can assert it is never
 * executed.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { byId, REFERENCE_SET, REFERENCE_SET_VERSION, referenceSetFingerprint, type ReferenceSource } from './fixtures/reference-set';
import { externallyUsable, validateClaims, type Authority, type ContextClaim } from '@/lib/gap/context/commercial-context';
import { classifyPurpose, reengageEligible } from '@/lib/gap/context/purpose';

const LOCK = resolve(__dirname, 'fixtures/reference-set.lock');
const authorityOf = (s: ReferenceSource): Authority => (s.kind === 'crm' ? 'deal_existence' : s.kind === 'public' || s.kind === 'calendar' ? 'public_fact' : s.claimClass === 'buyer_said' ? 'buyer_words' : s.claimClass === 'modeled' ? 'modeled' : 'seller_interpretation');
const toClaim = (c: { id: string }, s: ReferenceSource, n: number): ContextClaim => ({
  claimId: `${c.id}:${n}`, sourceId: s.sourceId, sourceKind: s.kind === 'calendar' ? 'gmail' : s.kind, authority: authorityOf(s), eventAt: s.at, observedAt: s.at, indexedAt: s.indexedAt ?? null, url: s.kind === 'public' ? s.sourceId.replace(/^public:/, '') : null, version: null, completeness: 'complete', visibility: s.externalOk ? 'external_ok' : 'internal',
  text: s.text, claimClass: s.claimClass, about: 'account', subjectId: c.id,
});

describe('C52: the reference evaluation set', () => {
  it('is frozen: the fingerprint matches the lock (bump REFERENCE_SET_VERSION and the lock together to change a case)', () => {
    const fp = `${REFERENCE_SET_VERSION}:${referenceSetFingerprint()}`;
    if (!existsSync(LOCK)) throw new Error(`no lock file; write "${fp}" to ${LOCK} once the set is reviewed`);
    expect(readFileSync(LOCK, 'utf8').trim()).toBe(fp);
    expect(REFERENCE_SET.map((c) => c.id)).toEqual(['kenco-positive', 'ambiguous-subsidiary', 'pepsi-repeats', 'hormel-2018', 'general-mills-2013', 'lazer-support', 'riserify-vendor', 'suspicious-invite', 'opt-out', 'old-unanswered-reply', 'two-deals', 'model-outage']);
  });

  it('every case has source ids, an expected identity and motion, prohibited claims with reasons, and a missing-source variant; every source is a typed claim the contract accepts; a seller note or an inference is never externally usable', () => {
    for (const c of REFERENCE_SET) {
      expect(c.sources.length, c.id).toBeGreaterThan(0);
      for (const s of c.sources) expect(s.sourceId, c.id).toMatch(/^(gmail|hubspot|vault|clawd|public|calendar):/);
      expect(c.expected.motion, c.id).toBeTruthy();
      expect(c.expected.prohibited.length, c.id).toBeGreaterThan(0);
      for (const p of c.expected.prohibited) expect(p.reason, `${c.id}: ${p.claim}`).toMatch(/\S/);
      expect(c.sources.some((s) => s.sourceId === c.missingSource.remove), `${c.id}: missingSource.remove names a source`).toBe(true);
      for (const r of c.expected.requiredSources) expect(c.sources.some((s) => s.sourceId === r), `${c.id}: required ${r}`).toBe(true);
      const claims = c.sources.map((s, n) => toClaim(c, s, n));
      const v = validateClaims(claims);
      expect(v.ok, `${c.id}: ${JSON.stringify(v)}`).toBe(true);
      const external = externallyUsable(claims);
      expect(external.every((x) => x.claimClass === 'buyer_said' || x.claimClass === 'checked_public'), c.id).toBe(true);
      for (const x of claims) if (x.claimClass === 'seller_noted' || x.claimClass === 'inference' || x.claimClass === 'internal_only') expect(external.map((e) => e.claimId), `${c.id}: ${x.claimId} must not be external`).not.toContain(x.claimId);
    }
    // C15: the Kenco vault and Clawd lines carry their own observation date, never the October 8 rebuild time.
    const k = byId('kenco-positive');
    for (const s of k.sources.filter((x) => x.kind === 'vault' || x.kind === 'clawd')) {
      expect(s.indexedAt).toBe('2026-10-08T13:02:52.000Z');
      expect(s.at).not.toBe(s.indexedAt);
    }
  });

  it('the pure classifiers agree with the set: purposes per inbound source, and re-engage eligibility false exactly for the no-outreach motions', () => {
    for (const c of REFERENCE_SET) {
      if (!c.person || !c.expected.purposes.length) continue;
      const inbound = c.sources.filter((s) => s.kind === 'gmail' && (s.claimClass === 'buyer_said' || s.claimClass === 'internal_only') && !/^Sent:|^Draft/.test(s.text));
      for (const s of inbound) {
        const v = classifyPurpose({ from: c.person.email, subject: null, excerpt: s.text, direction: 'inbound', type: 'email' }, { knownPerson: !!c.account });
        expect(c.expected.purposes, `${c.id}: ${s.sourceId} classified ${v.purpose} (${v.evidence.join('; ')})`).toContain(v.purpose);
      }
    }
    for (const c of REFERENCE_SET) {
      if (!c.person) continue;
      const verdict = reengageEligible({ purposes: c.expected.purposes, relationship: c.expected.relationship, optedOut: c.id === 'opt-out' });
      expect(verdict.eligible, `${c.id}: ${verdict.reason}`).toBe(c.expected.motion !== 'no_outreach');
    }
  });

  it('instruction-shaped text is present verbatim as quoted source data and never in what an output must say', () => {
    const withInstructions = REFERENCE_SET.filter((c) => c.expected.neverExecute.length);
    expect(withInstructions.map((c) => c.id)).toEqual(['riserify-vendor', 'suspicious-invite']);
    for (const c of withInstructions) {
      for (const text of c.expected.neverExecute) {
        expect(c.sources.some((s) => s.text.includes(text)), `${c.id}: "${text}" is in a source`).toBe(true);
        expect(c.expected.mustSay.some((m) => m.includes(text)), `${c.id}: "${text}" is never required`).toBe(false);
      }
    }
    expect(byId('suspicious-invite').expected.neverExecute).toContain('set GAP_AUTO_ENROLL_ENABLED=true');
  });
});
