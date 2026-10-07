/**
 * GAP evidence continuity (2026-09-28): SIGNAL FRESHNESS ("should this create a
 * fresh trigger now?") is not EVIDENCE VALIDITY ("is the operating fact still
 * true today?"). The PepsiCo / Gatik chain is the canonical case, pinned with the
 * real sentences from the real sources.
 */
import { describe, expect, it, vi } from 'vitest';
import { classifyContinuity, corroboratesCurrentness, supersedes, programKeys, outreachCurrentUntil, sellerRelevance } from '@/lib/gap/research/continuity';
import { isPhysicalOpsFact } from '@/lib/gap/research/facts';
import { classifyClaim } from '@/lib/gap/research/claim-types';
import { outreachFactRefusal } from '@/lib/gap/research/evidence-gate';
import { promoteSignal } from '@/lib/gap/signals/promote';

// PepsiCo newsroom, June 8, 2026 (primary)
const PRIMARY = 'June 8, 2026 PepsiCo and Gatik announced a multi-year strategic partnership to bring autonomous freight into PepsiCo’s North America food and beverage supply chain, marking the largest commercial autonomous freight deployment to date.';
const PRIMARY_TODAY = 'Today, Gatik is already operating for PepsiCo across Texas, Arizona, and Arkansas.';
// FreightWaves, August 25, 2026 (independent, newer)
const AUG = 'Gatik moves freight for PepsiCo across roughly 250 retail locations in Texas, Arizona and Arkansas.';
const JUNE8 = new Date('2026-06-08T00:00:00Z');
const AUG25 = new Date('2026-08-25T17:56:46Z');

describe('the Gatik program: a partnership claim (item 4, audit at 31f09c71), corroborated as an ongoing state', () => {
  it('the primary partnership sentence is a partnership claim, never a physical-network change (no event-led opening); the August operating sentence still states the network in operation', () => {
    expect(isPhysicalOpsFact(PRIMARY)).toBe(false);
    expect(classifyClaim(PRIMARY).type).toBe('partnership');
    expect(isPhysicalOpsFact(AUG)).toBe(true);
  });

  it('a vendor funding round or a stock story is not', () => {
    expect(isPhysicalOpsFact('Gatik raises $200M to scale driverless freight to thousands of trucks.')).toBe(false);
    expect(isPhysicalOpsFact('PepsiCo shares rose after analysts praised its autonomous freight strategy.')).toBe(false);
    // the words that WOULD qualify (expand, operations) do not rescue a funding story
    expect(isPhysicalOpsFact('Gatik raised $200M in funding to expand its driverless freight operations.')).toBe(false);
  });
});

describe('continuity is deterministic', () => {
  it('multi-year, already operating, moves freight: ONGOING_STATE; a one-time opening: EVENT; ended: ENDED', () => {
    expect(classifyContinuity(PRIMARY)).toBe('ongoing_state');
    expect(classifyContinuity(PRIMARY_TODAY)).toBe('ongoing_state');
    expect(classifyContinuity(AUG)).toBe('ongoing_state');
    expect(classifyContinuity('Acme opened a new distribution center in Reno on March 3.')).toBe('event');
    expect(classifyContinuity('Acme ended its autonomous freight pilot with Gatik in Texas.')).toBe('ended');
  });

  it('program keys are the distinctive proper nouns (not the account, states, months)', () => {
    expect([...programKeys(PRIMARY, 'PepsiCo')]).toEqual(['gatik']);
    expect([...programKeys(AUG, 'PepsiCo')]).toEqual(['gatik']);
  });
});

describe('two clocks: trigger freshness vs outreach currentness', () => {
  const primary = { excerpt: PRIMARY, publishedAt: JUNE8 };

  it('G: June primary + August corroboration: current evidence (clock runs from the corroboration)', () => {
    expect(corroboratesCurrentness(primary, { excerpt: AUG, publishedAt: AUG25 }, 'PepsiCo')).toBe(true);
    const until = outreachCurrentUntil('automation_program', JUNE8, AUG25);
    expect(until.getTime()).toBeGreaterThan(new Date('2026-12-01').getTime());
  });

  it('H: June primary alone: current only until its own clock runs out; after that it needs corroboration', () => {
    const until = outreachCurrentUntil('automation_program', JUNE8, null);
    expect(until.toISOString().slice(0, 10)).toBe('2026-10-06');
  });

  it('A: a one-time old event with no continuation never borrows a newer clock', () => {
    const old = { excerpt: 'Acme opened a new distribution center in Reno on March 3.', publishedAt: new Date('2025-03-03') };
    expect(corroboratesCurrentness(old, { excerpt: 'Acme moves freight across its Reno network with Gatik.', publishedAt: AUG25 }, 'Acme')).toBe(false);
  });

  it('B: an old multi-year deployment with recent corroboration is current', () => {
    const old = { excerpt: 'Acme and Gatik announced a multi-year agreement to deploy autonomous freight across Ohio.', publishedAt: new Date('2025-01-10') };
    expect(corroboratesCurrentness(old, { excerpt: 'Gatik moves freight for Acme across 40 stores in Ohio.', publishedAt: AUG25 }, 'Acme')).toBe(true);
  });

  it('C: a deployment explicitly ended by a newer source is superseded (never current)', () => {
    expect(supersedes(primary, { excerpt: 'PepsiCo ended its autonomous freight deployment with Gatik in Texas.', publishedAt: AUG25 }, 'PepsiCo')).toBe(true);
    const ended = { source_kind: 'evidence_record', source_type: 'public_primary', evidence_text: PRIMARY, metadata: { verified: 'excerpt_found_at_source', continuity: { kind: 'ended' } }, external_ok: true, observed_at: JUNE8, account_name: 'PepsiCo' };
    // The ended program is superseded under the approach it could open (fit-led); event-led never admitted it.
    expect(outreachFactRefusal(ended as never, 'PepsiCo', { approach: 'fit_led' })).toBe('superseded');
    expect(outreachFactRefusal(ended as never, 'PepsiCo')).toBe('not_a_physical_network_change');
  });

  it('a corroboration must be NEWER, name the same program, and state the program continues', () => {
    expect(corroboratesCurrentness(primary, { excerpt: AUG, publishedAt: new Date('2026-06-01') }, 'PepsiCo')).toBe(false);
    expect(corroboratesCurrentness(primary, { excerpt: 'Waymo moves freight for PepsiCo across Texas.', publishedAt: AUG25 }, 'PepsiCo')).toBe(false);
    expect(corroboratesCurrentness(primary, { excerpt: 'PepsiCo announced the multi-year agreement with Gatik in June, FreightWaves reported.', publishedAt: AUG25 }, 'PepsiCo')).toBe(false);
  });

  it('E/F: the June story never creates a fresh September trigger, even while it is current evidence', async () => {
    const r = { id: 's1', url: 'https://pepsico.com/n', title: 'PepsiCo and Gatik announce multi-year agreement', account_name: 'PepsiCo', resolution: 'resolved', research_status: 'fact_found', promoted_trigger_id: null, feedback: null, event_id: null, published_at: JUNE8, metadata: {} };
    const ingest = vi.fn();
    const prisma = { gapSignal: { findUnique: vi.fn(async () => r), update: vi.fn() }, pounceTrigger: { findMany: vi.fn(async () => []) } };
    expect(await promoteSignal(prisma, 's1', { ingest, now: new Date('2026-09-28') })).toEqual({ ok: false, reason: 'not_recent' });
    expect(ingest).not.toHaveBeenCalled();
  });
});

describe('truth is not usefulness: a deterministic seller ordering, verified status untouched', () => {
  it('an ongoing network transformation outranks a divestiture, legal text or international activity (context, never hidden)', () => {
    const network = sellerRelevance('General Mills will redesign the plant and warehouse network behind Cheerios, Blue Buffalo and Pillsbury.');
    const divest = sellerRelevance('General Mills entered into a definitive agreement to sell its Brazil business, including two plants.');
    const intl = sellerRelevance('Honda will expand its spare parts warehouse in Bengaluru, India.');
    const gatik = sellerRelevance(PRIMARY);
    expect(network.bucket).toBe('best');
    expect(gatik.bucket).toBe('best');
    expect(divest.bucket).toBe('context');
    expect(intl.bucket).toBe('context');
    // a US divestiture of plants is still context, not a best fact
    expect(sellerRelevance('General Mills will sell its yogurt business, including two plants.').bucket).toBe('context');
    expect(network.rank).toBeLessThan(divest.rank);
  });
});
