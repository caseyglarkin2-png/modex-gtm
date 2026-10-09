// @vitest-environment node
/**
 * C29, C30, C34 (the commercial-context audit, 2026-10-08), the intelligence reader's side. C29: a publication value
 * stored at midnight UTC is a date, shown as that calendar day, never the prior New York day; a real instant converts.
 * C30: related reports of one event at one account are one item with every source kept; distinct events stay apart;
 * a decision on any member covers the cluster. C34: the decided set is read in pages, the selection says its windows
 * and whether more exists, and a caller can ask for the next page; nothing reintroduces an age cutoff.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { DECIDED_PAGE, isDateOnly, loadDecided, loadIntelligence, PROSPECT_DECISION, rankSignals } from '@/lib/gap/work/intel';

const NOW = new Date('2026-10-08T15:00:00Z');
const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const sig = (id: string, over: Record<string, unknown> = {}) => ({ id, url: `https://x/${id}`, url_hash: id, title: `Title ${id}`, source_name: 'x', source_class: 'news', published_at: days(3), created_at: days(3), origin: 'discovery', account_name: 'PepsiCo', account_hint: null, relevance: 'account_context', categories: [], score: 1, resolution: 'resolved', research_status: 'none', feedback: null, feedback_at: null, event_id: null, note: null, ...over });

describe('C29: publication date semantics', () => {
  it('a midnight-UTC value is a date and shows as that day; an instant shows in New York', () => {
    expect(isDateOnly('2026-10-08T00:00:00.000Z')).toBe(true);
    expect(isDateOnly('2026-10-08T00:00:01.000Z')).toBe(false);
    const filing = rankSignals([sig('pep', { title: 'PEP 10-Q', source_name: 'EDGAR', published_at: new Date('2026-10-08T00:00:00.000Z') })], NOW)[0];
    expect(filing.line).toContain('published Oct 8, 2026');
    expect(filing.publishedDateOnly).toBe(true);
    const instant = rankSignals([sig('news', { published_at: new Date('2026-10-08T02:30:00.000Z') })], NOW)[0];
    expect(instant.line).toContain('published Oct 7, 2026');
    expect(instant.publishedDateOnly).toBeUndefined();
  });
});

describe('C30: related reports of one event are one item with every source', () => {
  it('three corroborating reports at one account cluster under the strongest with the other sources named; a different event stays apart; a decision on a member covers the cluster', () => {
    const rows = [
      sig('a', { title: 'PepsiCo and Gatik expand autonomous middle-mile trucking to Texas', source_name: 'FreightWaves', score: 5 }),
      sig('b', { title: 'Gatik, PepsiCo expand driverless middle-mile trucks in Texas', source_name: 'Supply Chain Dive', score: 3 }),
      sig('c', { title: 'PepsiCo expands Gatik autonomous trucking in Texas', source_name: 'Reuters', score: 4, published_at: days(4), created_at: days(4) }),
      sig('d', { title: 'PepsiCo opens a new distribution center in Denver', source_name: 'news', score: 2 }),
      sig('e', { title: 'Gatik, PepsiCo expand driverless middle-mile trucks in Texas', source_name: 'Costco Connection', account_name: 'Costco Wholesale', score: 1 }),
    ];
    const items = rankSignals(rows, NOW);
    expect(items.map((i) => i.id)).toEqual(['a', 'd', 'e']);
    expect([...(items[0].clusterIds ?? [])].sort()).toEqual(['a', 'b', 'c']);
    expect(items[0].clusterIds?.[0]).toBe('a');
    expect(items[0].alsoReported?.map((x) => x.source).sort()).toEqual(['Reuters', 'Supply Chain Dive']);
    expect(items[0].line).toMatch(/Also reported by (Supply Chain Dive, Reuters|Reuters, Supply Chain Dive)\.$/);
    expect(items[1].alsoReported).toBeUndefined();
    // A decision on b (a member) removes the whole cluster; d and e stay.
    const decided = rankSignals(rows.map((r) => (r.id === 'b' ? { ...r, feedback: 'use', feedback_at: days(1) } : r)), NOW);
    expect(decided.map((i) => i.id)).toEqual(['d', 'e']);
  });
});

describe('C34: visibility beyond the bounded windows', () => {
  it('the decided set reads every page; the selection names its windows and says when more exists; the next page is reachable; the people intake says when it hit its cap', async () => {
    const audit = Array.from({ length: DECIDED_PAGE + 3 }, (_, n) => ({ kind: PROSPECT_DECISION, actor: 'casey', subject_type: 'intelligence', subject_id: `signal:s${n}`, payload: { decision: 'dismiss' }, created_at: days(1) }));
    const db = ledgerDb({ audit, signals: [sig('s0'), sig('s2001'), sig('s2002'), sig('live')] }, NOW);
    const decided = await loadDecided(db.client(), NOW);
    expect(decided.size).toBe(DECIDED_PAGE + 3);
    expect(decided.has('signal:s2002')).toBe(true);
    const page1 = await loadIntelligence(db.client(), { now: NOW, limit: 1, identity: null });
    expect(page1.selection.signals).toMatch(/ranked from three bounded pulls/);
    expect(page1.selection).toMatchObject({ moreSignals: false, skipSignals: 0, peopleWindowDays: 180, peopleIntakeTruncated: false });
    const many = ledgerDb({ signals: [sig('a', { title: 'PepsiCo opens a Denver distribution center' }), sig('b', { title: 'Frito-Lay names a new chief supply chain officer' }), sig('c', { title: 'PepsiCo fleet adds electric tractors in California' })] }, NOW);
    const first = await loadIntelligence(many.client(), { now: NOW, limit: 2, identity: null });
    expect(first.signals).toHaveLength(2);
    expect(first.selection.moreSignals).toBe(true);
    const second = await loadIntelligence(many.client(), { now: NOW, limit: 2, skipSignals: 2, identity: null });
    expect(second.signals).toHaveLength(1);
    expect(second.selection).toMatchObject({ moreSignals: false, skipSignals: 2 });
    expect(second.selection.signals).toContain('from 3');
  });
});
