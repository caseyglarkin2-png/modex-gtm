// @vitest-environment node
/**
 * Acceptance batch item 2a: ONE freshness authority. The recording's dead end was two clocks on one fact: the
 * compiler aged evidence by a flat 45 days (C01 "cites stale evidence") while the approval gate, routing and the
 * draftable list read only an explicit expiry, so the PepsiCo Tulsa story (dated 2026-07-23) was offered, approved
 * and routed READY, then refused at the preview. research/currentness.ts is the one clock; this file pins the rule,
 * the parity of the compiler and the gate on it, and that no other source decides currentness privately.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { currentnessLine, factCurrentness, isCurrentFact, pendingEffectiveDate } from '@/lib/gap/research/currentness';
import { evidenceRefsFromSignals } from '@/lib/gap/compiler/evidence-from-signals';
import { hypothesisSendable, VERIFIED_EXCERPT } from '@/lib/gap/research/evidence-gate';
import { checkEvidenceFreshness } from '@/lib/gap/enroll/service';

const NOW = new Date('2026-10-07T15:00:00Z');
const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);
const TULSA = 'PepsiCo will close its warehouse operations at its Tulsa, Oklahoma, production facility and shift duties to a new site in the area.';

describe('the one freshness rule', () => {
  it('a recorded expiry wins; a newer source saying it ended is never current; an undated fact is never current', () => {
    expect(factCurrentness({ observed_at: daysAgo(300), freshness_expires_at: new Date(NOW.getTime() + DAY), type: 'news' }, NOW)).toEqual({ current: true, until: new Date(NOW.getTime() + DAY).toISOString(), basis: 'explicit' });
    expect(factCurrentness({ observed_at: daysAgo(1), freshness_expires_at: daysAgo(0.5), type: 'site_expansion' }, NOW).current).toBe(false);
    expect(factCurrentness({ observed_at: daysAgo(1), type: 'site_expansion', metadata: { continuity: { kind: 'ended' } } }, NOW)).toEqual({ current: false, until: null, basis: 'ended' });
    expect(factCurrentness({ observed_at: null, type: 'news' }, NOW)).toEqual({ current: false, until: null, basis: 'undated' });
  });

  it('otherwise the type window from the fact date: a one-day event is stale after its window, a site change keeps its own', () => {
    expect(factCurrentness({ observed_at: daysAgo(75), type: 'news', evidence_text: 'PepsiCo opened a distribution center in Denver.' }, NOW)).toMatchObject({ current: false, basis: 'type_window' });
    expect(factCurrentness({ observed_at: daysAgo(75), type: 'site_expansion', evidence_text: 'PepsiCo opened a distribution center in Denver.' }, NOW)).toMatchObject({ current: true, basis: 'type_window' });
    // A type GAP does not know takes the registry's `other` window (45 days).
    expect(isCurrentFact({ observed_at: daysAgo(44), type: 'mystery' }, NOW)).toBe(true);
    expect(isCurrentFact({ observed_at: daysAgo(46), type: null }, NOW)).toBe(false);
  });

  it('an announced future change with a stated effective date runs its window from that date: a July closure that takes effect in March stays current', () => {
    const announced = new Date('2026-07-23T00:00:00Z');
    expect(pendingEffectiveDate('PepsiCo will close its Tulsa warehouse by March 2027.', announced)?.toISOString()).toBe('2027-03-31T23:59:59.000Z');
    expect(pendingEffectiveDate('The plant is expected to close in the first quarter of 2027.', announced)?.toISOString()).toBe('2027-03-31T23:59:59.000Z');
    expect(pendingEffectiveDate('Kroger plans to open the Ohio DC later this year.', announced)?.toISOString()).toBe('2026-12-31T23:59:59.000Z');
    expect(pendingEffectiveDate('Kroger will open the Ohio DC on Nov. 3, 2026.', announced)?.toISOString()).toBe('2026-11-03T23:59:59.000Z');
    // No future cue, a past date, or no date at all: not a pending change.
    expect(pendingEffectiveDate('Kroger opened the Ohio DC in March 2026.', announced)).toBeNull();
    expect(pendingEffectiveDate('PepsiCo will close a site, as it said in January 2026.', announced)).toBeNull();
    expect(pendingEffectiveDate(TULSA, announced)).toBeNull();
    const c = factCurrentness({ observed_at: announced, type: 'news', evidence_text: 'PepsiCo will close its Tulsa warehouse by March 2027.' }, NOW);
    expect(c).toMatchObject({ current: true, basis: 'effective_date' });
    expect(currentnessLine(c)).toBe('Current until May 15, 2027 (the change takes effect later).');
  });

  it('the production Tulsa shape (no stated date, 2026-07-23) gets ONE honest answer from its type: current as a site change, too old as plain news', () => {
    const asSite = factCurrentness({ observed_at: new Date('2026-07-23T00:00:00Z'), type: 'site_expansion', evidence_text: TULSA }, NOW);
    const asNews = factCurrentness({ observed_at: new Date('2026-07-23T00:00:00Z'), type: 'news', evidence_text: TULSA }, NOW);
    expect([asSite.current, currentnessLine(asSite)]).toEqual([true, 'Current until Nov 19, 2026.']);
    expect([asNews.current, currentnessLine(asNews)]).toEqual([false, 'This story is too old for a first touch: it was current until Sep 5, 2026.']);
  });
});

describe('every reader agrees: the compiler, the gate and enrollment read the same clock (item 2a)', () => {
  const sig = (over: Record<string, unknown>) => ({ id: 's1', title: 'PepsiCo to cease warehouse operations at Oklahoma production site', evidence_url: 'https://news.example.com/tulsa', external_ok: true, observed_at: new Date('2026-07-23T00:00:00Z'), freshness_expires_at: null, source_type: 'public_secondary', source_kind: 'evidence_record', account_name: 'PepsiCo', evidence_text: TULSA, metadata: { verified: VERIFIED_EXCERPT }, type: 'site_expansion', ...over });
  const hyp = (s: Record<string, unknown>) => ({ account_name: 'PepsiCo', observation: `PepsiCo to cease warehouse operations at Oklahoma production site: "${TULSA.replace(/\.$/, '')}" [S:s1].`, signals: [{ signal: s as never }] });

  it.each([
    ['a 75-day-old site change (current)', {}, true],
    ['a 75-day-old news item (too old)', { type: 'news' }, false],
    ['a recorded expiry in the past', { freshness_expires_at: daysAgo(1) }, false],
    ['a newer source says it ended', { metadata: { verified: VERIFIED_EXCERPT, continuity: { kind: 'ended' } } }, false],
  ])('%s: compiler fresh, the send gate and enrollment answer the same', (_label, over, current) => {
    const s = sig(over);
    expect(isCurrentFact(s, NOW)).toBe(current);
    expect(evidenceRefsFromSignals([s as never], NOW)[0].fresh).toBe(current);
    expect(hypothesisSendable(hyp(s), NOW)).toBe(current);
    expect(checkEvidenceFreshness([s], NOW)).toBe(current ? null : 'evidence_expired');
  });
});

describe('no reader decides currentness privately (item 2a structural pin)', () => {
  const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(n) ? [p] : [];
  });
  it('outside research/currentness.ts, no GAP source compares a fact expiry or a fact date to now', () => {
    const offenders: string[] = [];
    for (const f of [...walk('src/lib/gap'), ...walk('src/app/api/gap')]) {
      if (f.replace(/\\/g, '/').endsWith('research/currentness.ts')) continue;
      const text = readFileSync(f, 'utf8');
      const hits = text.split('\n').filter((l) => /freshness_expires_at[^\n]*getTime\(\)\s*(?:<=|>|<|>=)\s*(?:now|input\.now|nowMs)\b|EVIDENCE_MAX_AGE_DAYS/.test(l));
      if (hits.length) offenders.push(`${f}: ${hits[0].trim().slice(0, 120)}`);
    }
    expect(offenders).toEqual([]);
  });
});
