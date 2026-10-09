/**
 * Stream A (GAP OS knowledge, 2026-10-09): the sync into gap_knowledge_notes and the table-backed vault adapter.
 * Pinned: a dry run writes nothing and counts what would change; an apply upserts by path; the same files again
 * write nothing (sha); a candidate whose git blob id is on record is not even read; the per-run cap leaves the rest
 * said as remaining; the account name goes through the resolver. The adapter hands retrieval the same text the
 * directory would (the Kenco claims come out with their dates), an empty table is "not configured", an unreadable
 * table is said so; knowledgeForAccount finds the account's notes by name, by domain and by placed person, newest
 * first and bounded; story/load picks the table only when told (or in production) and the directory always wins.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { retrieveAccountKnowledge, type VaultAdapter } from '@/lib/gap/context/retrieval';
import { coverageLine } from '@/lib/gap/context/commercial-context';
import { knowledgeForAccount, vaultTableAdapter, vaultTableStatus, vaultTableSummary } from '@/lib/gap/knowledge/vault-table-adapter';
import { parseVaultNote, renderVaultNote } from '@/lib/gap/knowledge/vault-note';
import { lastVaultSync, recordVaultSync, syncVaultNotes, type SyncCandidate } from '@/lib/gap/knowledge/vault-sync';
import { knowledgeAdapters, loadAccountKnowledge } from '@/lib/gap/story/load';
import { ledgerDb } from './fixtures/ledger-db';

const FIX = path.resolve(__dirname, 'fixtures/vault');
const FILES = ['02_Accounts/Kenco Logistics.md', '00_Inbox/raw/2026-07-16-call-kenco-x-yardflow-discovery.md', '05_Meetings/2026-07-16 Kenco Logistics.md'];
const text = (rel: string) => readFileSync(path.join(FIX, rel), 'utf8');
const local = (rels: string[] = FILES, reads?: string[]): SyncCandidate[] => rels.map((p) => ({ path: p, gitSha: null, read: async () => { reads?.push(p); return text(p); } }));
const NOW = new Date('2026-10-09T14:39:00Z');
const resolver = async (raw: string | null) => (raw === 'Kenco Logistics' ? 'Kenco' : raw);

describe('syncVaultNotes', () => {
  it('a dry run reads and counts but writes nothing; an apply upserts one row per path with the resolved account name', async () => {
    const db = ledgerDb({ accounts: ['Kenco'] });
    const dry = await syncVaultNotes(db.client(), local(), { apply: false, now: NOW, resolveAccount: resolver });
    expect(dry, 'dry run counts').toMatchObject({ seen: 3, read: 3, written: 3, unchangedBySha: 0, unchangedByGitSha: 0, remaining: 0, byKind: { account: 1, raw: 1, meeting: 1 } });
    expect(db.store.gapKnowledgeNote, 'nothing written on a dry run').toHaveLength(0);
    const applied = await syncVaultNotes(db.client(), local(), { apply: true, now: NOW, resolveAccount: resolver });
    expect(applied.written).toBe(3);
    const rows = db.store.gapKnowledgeNote;
    expect(rows).toHaveLength(3);
    const acct = rows.find((r) => r.kind === 'account')!;
    expect(acct.account_name, 'the resolver mapped the raw company to the GAP account').toBe('Kenco');
    expect(acct.domain).toBe('kencogroup.com');
    expect(acct.synced_at).toBe(NOW);
    expect(acct.git_sha, 'a local file stores the computed blob id').toMatch(/^[0-9a-f]{40}$/);
    const raw = rows.find((r) => r.kind === 'raw')!;
    expect(raw.source).toBe('fireflies');
    expect(raw.people).toContain('craig.morrison@kencogroup.com');
    expect(raw.note_date).toEqual(new Date('2026-07-16T00:00:00.000Z'));
    expect(raw.account_name, 'a raw capture has no account in its frontmatter').toBeNull();
  });

  it('the same files again write nothing (sha); a tree blob already on record is not read; the cap leaves the rest as remaining', async () => {
    const db = ledgerDb();
    await syncVaultNotes(db.client(), local(), { apply: true, now: NOW, resolveAccount: resolver });
    const again = await syncVaultNotes(db.client(), local(), { apply: true, now: NOW, resolveAccount: resolver });
    expect(again).toMatchObject({ read: 3, written: 0, unchangedBySha: 3 });
    const stored = db.store.gapKnowledgeNote.map((r) => ({ path: r.path, git_sha: r.git_sha as string }));
    const reads: string[] = [];
    const tree: SyncCandidate[] = stored.map((s) => ({ path: s.path, gitSha: s.git_sha, read: async () => { reads.push(s.path); return text(s.path); } }));
    const skipped = await syncVaultNotes(db.client(), tree, { apply: true, now: NOW, resolveAccount: resolver });
    expect(skipped, 'the blob ids matched: nothing read').toMatchObject({ unchangedByGitSha: 3, read: 0, written: 0 });
    expect(reads).toEqual([]);
    const changed: SyncCandidate[] = [{ path: '02_Accounts/Kenco Logistics.md', gitSha: 'f'.repeat(40), read: async () => text('02_Accounts/Kenco Logistics.md').replace('heat: 21', 'heat: 30') }, ...tree.slice(1)];
    const one = await syncVaultNotes(db.client(), changed, { apply: true, now: new Date('2026-10-09T15:00:00Z'), resolveAccount: resolver });
    expect(one, 'one changed blob is read and written; the two others skipped by id').toMatchObject({ unchangedByGitSha: 2, read: 1, written: 1 });
    expect(db.store.gapKnowledgeNote.find((r) => r.kind === 'account')!.git_sha, 'the tree blob id is stored').toBe('f'.repeat(40));
    expect(db.store.gapKnowledgeNote.find((r) => r.kind === 'account')!.frontmatter.heat).toBe('30');
    const fresh = ledgerDb();
    const capped = await syncVaultNotes(fresh.client(), local(), { apply: true, now: NOW, maxFiles: 2, resolveAccount: resolver });
    expect(capped, 'two read, one left for the next run').toMatchObject({ read: 2, written: 2, remaining: 1 });
  });

  it('a file that fails to read is an error row in the counts, never a thrown run; the ledger row is read back as the last sync', async () => {
    const db = ledgerDb();
    const bad: SyncCandidate = { path: '02_Accounts/Broken.md', gitSha: null, read: async () => { throw new Error('ENOENT'); } };
    const r = await syncVaultNotes(db.client(), [bad, ...local()], { apply: true, now: NOW, resolveAccount: resolver });
    expect(r.errors).toEqual([{ path: '02_Accounts/Broken.md', error: 'ENOENT' }]);
    expect(r.written).toBe(3);
    expect(await lastVaultSync(db.client()), 'no cron row yet').toBeNull();
    await recordVaultSync(db.client(), { ok: true, repo: 'o/r', branch: 'main', commitSha: 'c1', treeSha: 't1', commitAt: null, etag: 'W/"e1"', counts: r, durationMs: 12, error: null, skipped: null });
    await recordVaultSync(db.client(), { ok: false, repo: 'o/r', branch: 'main', commitSha: null, treeSha: null, commitAt: null, etag: null, counts: null, durationMs: 3, error: 'github commits HTTP 401', skipped: null });
    const last = await lastVaultSync(db.client());
    expect(last).toMatchObject({ ok: false, error: 'github commits HTTP 401', remaining: 0, written: null, skipped: false });
  });
});

async function seeded() {
  const db = ledgerDb({ accounts: ['Kenco'], personas: [{ account_name: 'Kenco', email: 'Dave.Kiesling@kencogroup.com' }] });
  await syncVaultNotes(db.client(), local(), { apply: true, now: NOW, resolveAccount: resolver });
  return db;
}

describe('vaultTableAdapter', () => {
  it('renders a stored note back to the text retrieval parses: the Kenco claims come out with their dates and the coverage says the sync and the counts', async () => {
    const db = await seeded();
    const adapter = vaultTableAdapter(db.client());
    const rendered = await adapter.readFile('02_Accounts/Kenco Logistics.md');
    expect(rendered?.startsWith('---\ntype: account\ncompany: Kenco Logistics\n'), 'the frontmatter block comes first').toBe(true);
    expect(await adapter.readFile('02_Accounts/Nobody.md')).toBeNull();
    const reparsed = parseVaultNote('02_Accounts/Kenco Logistics.md', rendered!);
    expect(reparsed.frontmatter, 'render then parse keeps the frontmatter').toEqual(parseVaultNote('02_Accounts/Kenco Logistics.md', text('02_Accounts/Kenco Logistics.md')).frontmatter);
    expect(renderVaultNote({ frontmatter: { people: ['A', 'B'], x: null }, text: 'body' })).toBe('---\npeople: [A, B]\nx: \n---\nbody');
    const k = await retrieveAccountKnowledge({ vault: adapter }, { accountName: 'Kenco Logistics', now: NOW });
    const cov = k.coverage.find((c) => c.source === 'vault')!;
    expect(cov.configured).toBe(true);
    expect(cov.reachable).toBe(true);
    expect(cov.indexedAt, 'the sync time is the index time').toBe(NOW.toISOString());
    expect(cov.summary).toBe('1 call, 1 account note, 1 meeting note');
    expect(coverageLine(cov)).toContain('(1 call, 1 account note, 1 meeting note)');
    expect(k.claims.some((c) => c.sourceId.includes('02_Accounts/Kenco Logistics.md#next_action')), 'the next_action claim').toBe(true);
    expect(k.claims.some((c) => c.sourceKind === 'vault' && /05_Meetings\/2026-07-16 Kenco Logistics\.md/.test(c.sourceId)), 'the linked meeting note was followed from the table').toBe(true);
  });

  it('an empty table is not a configured vault; an unreadable one is said unreadable; status counts by kind', async () => {
    const empty = ledgerDb();
    const k = await retrieveAccountKnowledge({ vault: vaultTableAdapter(empty.client()) }, { accountName: 'Kenco Logistics', now: NOW });
    expect(k.coverage.find((c) => c.source === 'vault')).toMatchObject({ configured: false, reachable: false, omittedReason: 'no vault configured (the knowledge table is empty; run the vault sync)' });
    const broken = await retrieveAccountKnowledge({ vault: vaultTableAdapter({}) }, { accountName: 'Kenco Logistics', now: NOW });
    expect(broken.coverage.find((c) => c.source === 'vault')).toMatchObject({ configured: true, reachable: false, omittedReason: 'vault unreadable: gap_knowledge_notes not readable' });
    const db = await seeded();
    const s = await vaultTableStatus(db.client());
    expect(s).toEqual({ rows: 3, syncedAt: NOW.toISOString(), kinds: { account: 1, person: 0, deal: 0, meeting: 1, raw: 1, other: 0 } });
    expect(vaultTableSummary({ rows: 5, syncedAt: null, kinds: { account: 78, person: 0, deal: 2, meeting: 85, raw: 92, other: 0 } })).toBe('92 calls, 78 account notes, 85 meeting notes, 2 deal notes');
    expect(await vaultTableStatus(empty.client())).toMatchObject({ rows: 0, syncedAt: null });
  });
});

describe('knowledgeForAccount', () => {
  it('finds the account note by name, the meeting note by name, the raw call by domain or placed person; newest first; bounded', async () => {
    const db = await seeded();
    const set = await knowledgeForAccount(db.client(), 'Kenco', { domains: ['kencogroup.com'] });
    expect(set.accountNote?.path).toBe('02_Accounts/Kenco Logistics.md');
    expect(set.meetings.map((m) => [m.path, m.matchedBy])).toEqual([['05_Meetings/2026-07-16 Kenco Logistics.md', 'account']]);
    expect(set.calls.map((c) => [c.title, c.matchedBy, c.source])).toEqual([['Kenco x YardFlow - Discovery', 'person', 'fireflies']]);
    expect(set.calls[0].text, 'the verbatim rides along').toContain('## Transcript (verbatim)');
    expect(set.matchedAddresses, 'the placed persona, lowercased').toEqual(['dave.kiesling@kencogroup.com']);
    expect(set.all.map((n) => n.kind), 'same day: the path breaks the tie').toEqual(['account', 'raw', 'meeting']);
    expect(set.truncated).toBe(false);
    const byDomain = await knowledgeForAccount(ledgerDb({ knowledgeNotes: db.store.gapKnowledgeNote.map((r) => ({ ...r })) }).client(), 'Kenco', { domains: ['KencoGroup.com', 'freightroll.com'] });
    expect(byDomain.calls[0].matchedBy, 'no persona on record: the domain matched; the internal domain never does').toBe('domain');
    const none = await knowledgeForAccount(db.client(), 'Nobody', {});
    expect(none).toMatchObject({ accountNote: null, meetings: [], calls: [], all: [] });
    const limited = await knowledgeForAccount(db.client(), 'Kenco', { domains: ['kencogroup.com'], limit: 2 });
    expect(limited.all.map((n) => n.kind), 'the account note first, then the newest').toEqual(['account', 'raw']);
    expect(limited.truncated).toBe(true);
  });
});

describe('story/load picks the table', () => {
  it('a stubbed env without prisma has no vault; prisma given reads the table; a local directory wins over the table; prisma null means none', async () => {
    const db = await seeded();
    expect(knowledgeAdapters({ env: {} }).vault).toBeNull();
    expect(knowledgeAdapters({ env: {}, prisma: null }).vault).toBeNull();
    const table = knowledgeAdapters({ env: {}, prisma: db.client() }).vault as VaultAdapter;
    expect(typeof table.status).toBe('function');
    const k = await loadAccountKnowledge({ accountName: 'Kenco Logistics', domain: 'kencogroup.com', now: NOW }, { env: {}, prisma: db.client() });
    expect(k.coverage.find((c) => c.source === 'vault')).toMatchObject({ configured: true, reachable: true, summary: '1 call, 1 account note, 1 meeting note' });
    const reads: string[] = [];
    const dir = knowledgeAdapters({ env: { GAP_VAULT_DIR: 'C:/vault' }, prisma: db.client(), readFile: async (p) => { reads.push(p); return null; } }).vault!;
    expect(dir.status, 'the directory adapter has no table status').toBeUndefined();
    await dir.readFile('02_Accounts/X.md');
    expect(reads).toEqual(['C:/vault/02_Accounts/X.md']);
  });
});
