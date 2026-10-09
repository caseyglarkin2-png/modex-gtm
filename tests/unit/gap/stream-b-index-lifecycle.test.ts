// @vitest-environment node
/**
 * C48 (the commercial-context audit, 2026-10-08): the vault and Clawd index lifecycle over an injected in-memory
 * cache. Pinned: a second read with nothing changed reuses every file's chunks by its content hash and re-parses
 * none; changing one Kenco note refreshes that file's chunks only, the vanished chunk tombstoned as superseded and
 * kept in the history; a deleted private person note's chunks are tombstoned as deleted and cannot reappear from
 * the cache on any later read; an unreadable vault serves the last successful sync, said STALE with its time, and
 * a sync older than a day is stale; Clawd notes missing from a newer snapshot are tombstoned (superseded when the
 * identity lives on, deleted when it does not) and a timed-out Clawd serves the cache as stale; without a cache
 * every read is a full read with no history and nothing changes in the claims.
 */
import { describe, expect, it, vi } from 'vitest';
import { createKnowledgeCache, retrieveAccountKnowledge, syncLine, STALE_AFTER_MS } from '@/lib/gap/context/retrieval';
import { validateClaims } from '@/lib/gap/context/commercial-context';
import { ACCOUNT, CRAIG, FILES, KENCO, NOTES, NOW, snapshot } from './stream-b-fixture';

const spyVault = (files: Record<string, string>) => {
  const readFile = vi.fn(async (p: string) => files[p] ?? null);
  return { readFile, adapter: { readFile } };
};
const later = (ms: number) => new Date(NOW.getTime() + ms);

describe('C48: the vault index lifecycle', () => {
  it('a second unchanged read reuses every chunk by hash and re-parses nothing; changing one note refreshes only its chunks, the vanished chunk tombstoned as superseded and kept; the claims are the same as an uncached read', async () => {
    const cache = createKnowledgeCache();
    const files = { ...FILES };
    const v = spyVault(files);
    const first = await retrieveAccountKnowledge({ vault: v.adapter }, { ...KENCO, cache });
    expect(first.sync[0]).toMatchObject({ source: 'vault', stale: false, servedFromCache: false, reused: [], tombstoned: [], lastSyncAt: NOW.toISOString() });
    expect(first.sync[0].refreshed).toEqual(expect.arrayContaining(['02_Accounts/Kenco Logistics.md', '05_Meetings/2026-07-16 Kenco Logistics.md', '03_People/Craig Morrison.md']));
    const plain = await retrieveAccountKnowledge({ vault: spyVault(files).adapter }, KENCO);
    expect(first.claims).toEqual(plain.claims);
    expect(plain.sync[0]).toMatchObject({ refreshed: expect.any(Array), reused: [], tombstoned: [] });
    expect(plain.tombstones).toEqual([]);

    const second = await retrieveAccountKnowledge({ vault: v.adapter }, { ...KENCO, now: later(60_000), cache });
    expect(second.claims).toEqual(first.claims);
    expect(second.sync[0]).toMatchObject({ refreshed: [], tombstoned: [], stale: false, lastSyncAt: later(60_000).toISOString() });
    expect(second.sync[0].reused.sort()).toEqual(first.sync[0].refreshed.sort());
    expect(syncLine(second.sync[0])).toBe(`vault: synced (last successful sync ${later(60_000).toISOString().slice(0, 16).replace('T', ' ')}); ${second.sync[0].reused.length} reused`);

    // Change one line of the account note: only that file is refreshed; the old chunk is superseded, the others reused.
    files['02_Accounts/Kenco Logistics.md'] = ACCOUNT.replace('Casey: Craig owns shunting and spotting.', 'Casey: Craig owns shunting, spotting and the gate.');
    const third = await retrieveAccountKnowledge({ vault: v.adapter }, { ...KENCO, now: later(120_000), cache });
    expect(third.sync[0].refreshed).toEqual(['02_Accounts/Kenco Logistics.md']);
    expect(third.sync[0].reused.sort()).toEqual(second.sync[0].reused.filter((x) => x !== '02_Accounts/Kenco Logistics.md').sort());
    expect(third.sync[0].tombstoned).toHaveLength(1);
    const gone = third.tombstones.find((t) => t.claim.claimId === third.sync[0].tombstoned[0])!;
    expect(gone).toMatchObject({ reason: 'superseded', at: later(120_000).toISOString(), claim: { text: expect.stringContaining('Craig owns shunting and spotting') } });
    expect(third.claims.some((c) => c.claimId === gone.claim.claimId)).toBe(false);
    expect(third.claims.some((c) => /spotting and the gate/.test(c.text))).toBe(true);
    expect(third.claims.filter((c) => c.sourceId.startsWith('vault:05_Meetings'))).toEqual(first.claims.filter((c) => c.sourceId.startsWith('vault:05_Meetings')));
    expect(validateClaims(third.claims)).toMatchObject({ ok: true });
    // The cached read matches a cold uncached read of the changed files, chunk for chunk.
    const cold = await retrieveAccountKnowledge({ vault: spyVault(files).adapter }, { ...KENCO, now: later(120_000) });
    expect(third.claims.map((c) => c.claimId).sort()).toEqual(cold.claims.map((c) => c.claimId).sort());
  });

  it('a deleted private person note is tombstoned as deleted and cannot reappear from the cache on any later read; the history keeps it', async () => {
    const cache = createKnowledgeCache();
    const files = { ...FILES };
    const v = spyVault(files);
    const first = await retrieveAccountKnowledge({ vault: v.adapter }, { ...KENCO, cache });
    const craig = first.claims.filter((c) => c.sourceId.startsWith('vault:03_People/Craig Morrison.md'));
    expect(craig.length).toBeGreaterThan(0);
    expect(craig.some((c) => /medical procedure/.test(c.text))).toBe(true);
    delete files['03_People/Craig Morrison.md'];
    const second = await retrieveAccountKnowledge({ vault: v.adapter }, { ...KENCO, now: later(1000), cache });
    expect(second.claims.some((c) => c.sourceId.startsWith('vault:03_People/Craig Morrison.md'))).toBe(false);
    expect(second.sync[0].tombstoned.sort()).toEqual(craig.map((c) => c.claimId).sort());
    expect(second.tombstones.every((t) => t.reason === 'deleted' && t.at === later(1000).toISOString())).toBe(true);
    expect(second.notFollowed).toEqual(expect.arrayContaining([{ link: 'Craig Morrison', reason: 'not_found' }]));
    // Later reads, unchanged or with the vault unreadable (served from the cache): the private note never comes back.
    const third = await retrieveAccountKnowledge({ vault: v.adapter }, { ...KENCO, now: later(2000), cache });
    // The meeting note's own buyer line about his procedure is the meeting's and stays; the person note's chunks do not.
    expect(third.claims.some((c) => c.sourceId.startsWith('vault:03_People/Craig Morrison.md'))).toBe(false);
    expect(third.claims.some((c) => /Lives in Ohio/.test(c.text))).toBe(false);
    expect(third.tombstones.map((t) => t.claim.claimId).sort()).toEqual(craig.map((c) => c.claimId).sort());
    const offline = await retrieveAccountKnowledge({ vault: { readFile: async () => { throw new Error('vault not mounted'); } } }, { ...KENCO, now: later(3000), cache });
    expect(offline.claims.length).toBeGreaterThan(0);
    expect(offline.claims.some((c) => c.sourceId.startsWith('vault:03_People/Craig Morrison.md'))).toBe(false);
    expect(offline.claims.map((c) => c.claimId).sort()).toEqual(third.claims.map((c) => c.claimId).sort());
    // Restored on disk: it is read again as a fresh file (a new read, not the cache), so the seller's own restore is honoured.
    files['03_People/Craig Morrison.md'] = CRAIG;
    const back = await retrieveAccountKnowledge({ vault: v.adapter }, { ...KENCO, now: later(4000), cache });
    expect(back.sync[0].refreshed).toEqual(['03_People/Craig Morrison.md']);
    expect(back.claims.some((c) => c.sourceId.startsWith('vault:03_People/Craig Morrison.md') && /Lives in Ohio/.test(c.text))).toBe(true);
  });

  it('an unreadable vault serves the last successful sync, said STALE with its time on the coverage row; a day-old sync is stale even when it reads; without a cache an unreadable vault is empty and said so', async () => {
    const cache = createKnowledgeCache();
    const v = spyVault({ ...FILES });
    await retrieveAccountKnowledge({ vault: v.adapter }, { ...KENCO, cache });
    const down = await retrieveAccountKnowledge({ vault: { readFile: async () => { throw new Error('EIO'); } } }, { ...KENCO, now: later(5000), cache });
    expect(down.claims.length).toBeGreaterThan(0);
    expect(down.coverage[0]).toMatchObject({ source: 'vault', configured: true, reachable: false, indexedAt: NOW.toISOString(), omittedReason: `vault unreadable: EIO; stale: served from the cache, last successful sync ${NOW.toISOString()}` });
    expect(down.sync[0]).toMatchObject({ stale: true, servedFromCache: true, lastSyncAt: NOW.toISOString() });
    expect(syncLine(down.sync[0])).toBe(`vault: STALE (served from the cache; last successful sync ${NOW.toISOString().slice(0, 16).replace('T', ' ')})`);
    // The same cache, read a day later with nothing changed: the sync is refreshed now, so not stale; but a cache whose last sync is a day old and is served offline says so.
    const old = await retrieveAccountKnowledge({ vault: { readFile: async () => { throw new Error('EIO'); } } }, { ...KENCO, now: later(STALE_AFTER_MS + 1000), cache });
    expect(old.sync[0].stale).toBe(true);
    const fresh = await retrieveAccountKnowledge({ vault: v.adapter }, { ...KENCO, now: later(STALE_AFTER_MS + 2000), cache });
    expect(fresh.sync[0]).toMatchObject({ stale: false, lastSyncAt: later(STALE_AFTER_MS + 2000).toISOString() });
    const bare = await retrieveAccountKnowledge({ vault: { readFile: async () => { throw new Error('EIO'); } } }, KENCO);
    expect(bare.claims).toEqual([]);
    expect(bare.coverage[0].omittedReason).toBe('vault unreadable: EIO');
    expect(bare.sync[0]).toMatchObject({ stale: true, servedFromCache: false, lastSyncAt: null });
    expect(syncLine(bare.sync[0])).toBe('vault: STALE (never synced)');
  });
});

describe('C48: the Clawd index lifecycle', () => {
  it('an unchanged snapshot reuses; a note missing from a newer snapshot is tombstoned (superseded when its identity lives on, deleted when it does not); a timed-out Clawd serves the cache as stale; a vanished snapshot tombstones everything', async () => {
    const cache = createKnowledgeCache();
    const first = await retrieveAccountKnowledge({ clawd: { fetchSnapshot: async () => snapshot() } }, { ...KENCO, cache });
    expect(first.sync[1]).toMatchObject({ source: 'clawd', refreshed: ['snapshot'], reused: [], tombstoned: [], stale: false });
    const again = await retrieveAccountKnowledge({ clawd: { fetchSnapshot: async () => snapshot() } }, { ...KENCO, now: later(1000), cache });
    expect(again.sync[1]).toMatchObject({ refreshed: [], reused: ['snapshot'], tombstoned: [] });
    expect(again.claims).toEqual(first.claims);
    // A rebuild drops the July wedge and the deck line: the wedge is superseded (the identity lives on), the deck line deleted.
    const rebuilt = { found: true, rebuiltAt: '2026-10-09T13:00:00.000Z', reasoningNotes: [NOTES[1], NOTES[3]] };
    const third = await retrieveAccountKnowledge({ clawd: { fetchSnapshot: async () => rebuilt } }, { ...KENCO, now: later(2000), cache });
    expect(third.sync[1].refreshed).toEqual(['snapshot']);
    const reasons = Object.fromEntries(third.tombstones.map((t) => [t.claim.sourceId, t.reason]));
    expect(reasons).toEqual({ 'clawd:vault wedge:2026-07-11': 'superseded', 'clawd:deck engagement:undated': 'deleted' });
    expect(third.claims.map((c) => c.sourceId).sort()).toEqual(['clawd:hubspot:undated', 'clawd:vault wedge:2026-08-07']);
    expect(third.claims.every((c) => c.indexedAt === '2026-10-09T13:00:00.000Z')).toBe(true);
    const timeout = await retrieveAccountKnowledge({ clawd: { fetchSnapshot: async () => { throw new Error('The operation was aborted due to timeout'); } } }, { ...KENCO, now: later(3000), cache });
    expect(timeout.claims.map((c) => c.sourceId).sort()).toEqual(['clawd:hubspot:undated', 'clawd:vault wedge:2026-08-07']);
    expect(timeout.coverage[1]).toMatchObject({ reachable: false, indexedAt: '2026-10-09T13:00:00.000Z', omittedReason: `timeout; stale: served from the cache, last successful sync ${later(2000).toISOString()}` });
    expect(timeout.sync[1]).toMatchObject({ stale: true, servedFromCache: true });
    expect(timeout.tombstones).toHaveLength(2);
    const gone = await retrieveAccountKnowledge({ clawd: { fetchSnapshot: async () => ({ found: false, rebuiltAt: null, reasoningNotes: [] }) } }, { ...KENCO, now: later(4000), cache });
    expect(gone.claims).toEqual([]);
    expect(gone.sync[1].tombstoned.sort()).toEqual(third.claims.map((c) => c.claimId).sort());
    expect(gone.tombstones).toHaveLength(4);
    const still = await retrieveAccountKnowledge({ clawd: { fetchSnapshot: async () => { throw new Error('timeout'); } } }, { ...KENCO, now: later(5000), cache });
    expect(still.claims).toEqual([]);
    expect(still.sync[1]).toMatchObject({ stale: true, servedFromCache: false });
  });
});
