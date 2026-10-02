/**
 * Stabilization A: the truth vocabulary. A source is not a fact; a verified fact is not necessarily outreach
 * evidence; a third party's claim stays the third party's; Scout's citations are sources, never checked claims.
 */
import { describe, expect, it, vi } from 'vitest';
import { outreachFactRefusal } from '@/lib/gap/research/evidence-gate';
import { liveFactFailure } from '@/lib/gap/research/claim-rules';
import { axesOf } from '@/lib/gap/sources/source-copy';
import { groupEvents, loadAccountSources, type AccountSource } from '@/lib/gap/sources/account-sources';

const NOW = new Date('2026-10-01T12:00:00Z');
const OWN = 'PepsiCo will deploy autonomous box trucks to move freight from its distribution centers to retail stores across Texas.';
const VENDOR = '"Our trucks now move freight for PepsiCo across 250 retail locations, and that\'s what we\'re deploying across Texas," said Gautam Narang, CEO of Gatik.';
const gate = (over: Record<string, unknown>) => ({ id: 's1', account_name: 'PepsiCo', source_kind: 'evidence_record', source_type: 'public_secondary', evidence_text: OWN, evidence_url: 'https://www.freightwaves.com/n', observed_at: new Date('2026-09-20'), external_ok: true, metadata: { verified: 'excerpt_found_at_source' }, ...over });

describe('the strict outreach gate is stricter, never looser', () => {
  it("a vendor's claim about the account is not the account's outreach evidence", () => {
    expect(outreachFactRefusal(gate({}), 'PepsiCo')).toBeNull();
    expect(outreachFactRefusal(gate({ evidence_text: VENDOR }), 'PepsiCo')).toBe('third_party_statement');
  });
  it('a claim stored on a search-redirect link is not outreach evidence (no publisher page to open)', () => {
    expect(outreachFactRefusal(gate({ evidence_url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZ' }), 'PepsiCo')).toBe('redirect_source');
    expect(liveFactFailure(OWN, 'PepsiCo', 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZ')).toBe('redirect_unresolved');
  });
});

describe('two axes, never one', () => {
  it('a rule failed before any check leaves the claim unchecked, never false', () => {
    expect(axesOf('describes_past_event')).toEqual({ verification: 'UNCHECKED', outreach: 'NOT_ELIGIBLE' });
    expect(axesOf('quoted_third_party')).toEqual({ verification: 'VERIFIED_AT_SOURCE', outreach: 'NOT_ELIGIBLE' });
    expect(axesOf('excerpt_not_found_at_source')).toEqual({ verification: 'COULD_NOT_VERIFY', outreach: 'NOT_ELIGIBLE' });
    expect(axesOf('source_unreadable:fetch 403')).toEqual({ verification: 'COULD_NOT_VERIFY', outreach: 'NOT_EVALUATED' });
    expect(axesOf('contradiction')).toEqual({ verification: 'CONTRADICTED', outreach: 'NOT_ELIGIBLE' });
    expect(axesOf('being_checked')).toEqual({ verification: 'VERIFYING', outreach: 'NOT_EVALUATED' });
  });
});

describe('Scout citations are sources, not checked claims', () => {
  it("each page Scout cited appears as a source labelled as Scout's, unchecked, never outreach evidence", async () => {
    const prisma = {
      researchRun: { findMany: vi.fn(async () => []) },
      gapSignal: { findMany: vi.fn(async () => []) },
      prospectingSignal: { findMany: vi.fn(async () => []) },
      gapAccountCandidate: { findFirst: vi.fn(async () => ({ scouted_at: new Date('2026-09-29T00:00:00Z'), scout: { network: [{ claim: 'Lineage operates more than 480 temperature-controlled warehouses.', url: 'https://www.lineagelogistics.com/about' }], freight: [{ claim: 'Runs a dedicated fleet.', url: 'https://www.lineagelogistics.com/fleet' }] } })) },
    };
    const s = await loadAccountSources(prisma as never, 'Lineage', { now: NOW });
    expect(s.items.map((i) => [i.origin, i.verification, i.outreach, i.excerptKind])).toEqual([
      ['scout', 'UNCHECKED', 'NOT_EVALUATED', 'search_summary'],
      ['scout', 'UNCHECKED', 'NOT_EVALUATED', 'search_summary'],
    ]);
    expect(s.items[0].reason).toBe('cited by Scout for its company verdict; not checked as a claim');
    expect(s).toMatchObject({ claimsVerified: 0, outreachEligible: 0 });
  });
});

describe('events group sources without hiding any', () => {
  const src = (key: string, over: Partial<AccountSource>): AccountSource => ({
    key, link: key, title: key, publisher: key, publishedAt: '2026-09-20T00:00:00.000Z', discoveredAt: '2026-09-21T00:00:00.000Z', ageDays: 11, freshTrigger: true, excerpt: null, excerptKind: null, attribution: null, whyFound: ['other'], origin: 'gap_discovered', verification: 'UNCHECKED', outreach: 'NOT_EVALUATED', reason: null, signalId: null, factId: null, reviewed: false, eventId: null, ...over,
  });
  it('one story: its best source leads, the others are "+ N more"; unreviewed events come first', () => {
    const items = [src('a', { eventId: 'e1' }), src('b', { eventId: 'e1', verification: 'VERIFIED_AT_SOURCE', outreach: 'ELIGIBLE' }), src('c', { eventId: 'e1' }), src('d', { reviewed: true, publishedAt: '2026-09-30T00:00:00.000Z' })];
    const ev = groupEvents(items);
    expect(ev.map((e) => [e.lead.key, e.more.map((m) => m.key).sort()])).toEqual([['b', ['a', 'c']], ['d', []]]);
    expect(ev.flatMap((e) => [e.lead, ...e.more])).toHaveLength(4);
  });
});
