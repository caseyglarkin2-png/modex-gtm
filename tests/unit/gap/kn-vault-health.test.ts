// @vitest-environment node
/**
 * Stream A (GAP OS knowledge, 2026-10-09): the C46 context component says the vault as read when the knowledge table
 * holds rows ("vault: N notes (92 calls, 78 account notes), synced HH:MM New York"), not configured in one line when
 * it is empty and nothing is set, and DEGRADED when the last gap-vault-sync tick failed (the ledger row says). The
 * loader reads the table and the ledger through its own prisma and hands prisma to the knowledge read so the
 * coverage comes from the table too.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { evaluateHealth, type HealthInputs } from '@/lib/gap/health/health';
import { loadHealthInputs } from '@/lib/gap/health/load';
import { recordVaultSync } from '@/lib/gap/knowledge/vault-sync';

const NOW = new Date('2026-10-09T14:39:00Z'); // 10:39 New York (EDT)
const base = (): HealthInputs => ({
  mailbox: { senderConfigured: true, lastSuccessAt: new Date(NOW.getTime() - 60_000), lastFailureAt: null, consecutiveFailures: 0, lastMessage: null },
  hubspot: { configured: true, ok: true, ms: 100, error: null },
  suppression: { configured: true, verdict: 'clear', ms: 200, error: null },
  sender: { configured: true, mailbox: 'casey@yardflow.ai' },
  routing: { lastRunAt: new Date(NOW.getTime() - 3_600_000) },
});
type ContextProbe = Exclude<NonNullable<HealthInputs['context']>, { failed: string }>;
const probe = (over: Partial<ContextProbe> = {}): ContextProbe => ({
  identity: { readable: true, companies: 412, aliases: 96, error: null },
  associations: { readable: true, ms: 140, error: null },
  sent: { configured: true, readable: true, ms: 900, error: null },
  vault: { configured: true, reachable: true, completeness: 'complete', watermark: '2026-10-07T00:00:00.000Z', indexedAt: '2026-10-09T14:39:00.000Z', omittedReason: null },
  clawd: { configured: true, reachable: true, completeness: 'complete', watermark: '2026-10-06T00:00:00.000Z', indexedAt: '2026-10-09T13:02:52.000Z', omittedReason: null },
  canary: { account: 'Kenco', domain: 'kencogroup.com' },
  ...over,
});
const ctx = (i: HealthInputs) => evaluateHealth(i, NOW).components.find((c) => c.key === 'context')!;
const kinds = { account: 78, person: 508, deal: 12, meeting: 85, raw: 92, other: 0 };

describe('the context component with the synced vault table', () => {
  it('rows on record: the vault is said as read with its counts and the New York sync time; complete and fresh stays complete', () => {
    const c = ctx({ ...base(), context: probe({ vaultTable: { readable: true, rows: 775, lastSyncedAt: '2026-10-09T14:39:00.000Z', kinds, tokenConfigured: true, localDir: false, lastSync: { ok: true, at: '2026-10-09T14:39:05.000Z', error: null, written: 3, skipped: false } } }) });
    expect(c.state).toBe('HEALTHY');
    expect(c.label).toBe('Commercial context complete and fresh');
    expect(c.detail, c.detail).toContain('vault: 775 notes (92 calls, 78 account notes, 85 meeting notes, 12 deal notes, 508 people notes), synced 10:39 New York');
    expect(c.detail, 'the coverage row still speaks for the canary account').toContain('vault: complete, newest knowledge 2026-10-07, rebuilt 2026-10-09');
    const other = ctx({ ...base(), context: probe({ vaultTable: { readable: true, rows: 3, lastSyncedAt: '2026-10-08T22:10:00.000Z', kinds: { account: 1, person: 0, deal: 0, meeting: 1, raw: 1, other: 0 }, tokenConfigured: true, localDir: false, lastSync: null } }) });
    expect(other.detail, 'another day carries its date').toContain('vault: 3 notes (1 call, 1 account note, 1 meeting note), synced Oct 8, 18:10 New York');
  });

  it('an empty table and nothing set: one "not configured" line naming what is missing, said as partial, never twice', () => {
    const c = ctx({ ...base(), context: probe({ vault: { configured: false, reachable: false, completeness: 'unknown', watermark: null, indexedAt: null, omittedReason: 'no vault configured (the knowledge table is empty; run the vault sync)' }, vaultTable: { readable: true, rows: 0, lastSyncedAt: null, kinds: { account: 0, person: 0, deal: 0, meeting: 0, raw: 0, other: 0 }, tokenConfigured: false, localDir: false, lastSync: null } }) });
    expect(c.state).toBe('HEALTHY');
    expect(c.label).toBe('Commercial context partial · vault');
    expect(c.detail).toContain('vault: not configured (no GAP_VAULT_GITHUB_TOKEN, no GAP_VAULT_DIR, the knowledge table is empty)');
    expect(c.detail.match(/vault: not configured/g), 'once').toHaveLength(1);
    const waiting = ctx({ ...base(), context: probe({ vault: { configured: false, reachable: false, completeness: 'unknown', watermark: null, indexedAt: null, omittedReason: 'no vault configured (the knowledge table is empty; run the vault sync)' }, vaultTable: { readable: true, rows: 0, lastSyncedAt: null, kinds: { account: 0, person: 0, deal: 0, meeting: 0, raw: 0, other: 0 }, tokenConfigured: true, localDir: false, lastSync: null } }) });
    expect(waiting.detail).toContain('vault: not configured (the token is set; the knowledge table is empty until the first gap-vault-sync tick)');
  });

  it('the last sync failed: DEGRADED with the tick time and the error, while the table still serves; an unreadable table is DEGRADED too', () => {
    const c = ctx({ ...base(), context: probe({ vaultTable: { readable: true, rows: 775, lastSyncedAt: '2026-10-09T13:12:00.000Z', kinds, tokenConfigured: true, localDir: false, lastSync: { ok: false, at: '2026-10-09T14:12:00.000Z', error: 'github commits HTTP 401', written: null, skipped: false } } }) });
    expect(c.state).toBe('DEGRADED');
    expect(c.label).toBe('Commercial context incomplete · vault sync failed');
    expect(c.detail).toContain('vault sync failed: the last tick 10:12 New York (github commits HTTP 401); the table still serves what it held');
    expect(c.detail).toContain('vault: 775 notes');
    const u = ctx({ ...base(), context: probe({ vaultTable: { readable: false, error: 'relation "gap_knowledge_notes" does not exist', tokenConfigured: true, localDir: false } }) });
    expect(u.state).toBe('DEGRADED');
    expect(u.label).toBe('Commercial context incomplete · vault table unreadable (relation "gap_knowledge_notes" does not exist)');
  });
});

describe('the loader reads the table and the ledger', () => {
  it('counts the rows by kind, reads the newest sync and the last tick; the knowledge read gets prisma so the coverage comes from the table', async () => {
    const db = ledgerDb({ accounts: ['Kenco'], knowledgeNotes: [
      { path: '02_Accounts/Kenco.md', sha: 'a', git_sha: null, kind: 'account', account_name: 'Kenco', domain: 'kencogroup.com', people: [], note_date: null, title: 'Kenco', frontmatter: { type: 'account', company: 'Kenco', last_refreshed: '2026-10-09', next_action: 'Regroup with Craig the week of 2026-10-12.', next_action_due: '2026-10-15' }, text: '# Kenco\n\n## One-line read\nThe largest woman-owned 3PL.\n', source: null, vault_pushed_at: null, synced_at: new Date('2026-10-09T14:39:00Z') },
      { path: '00_Inbox/raw/2026-07-16-call.md', sha: 'b', git_sha: null, kind: 'raw', account_name: null, domain: null, people: ['craig.morrison@kencogroup.com'], note_date: new Date('2026-07-16T00:00:00Z'), title: 'Kenco x YardFlow', frontmatter: { type: 'raw', source: 'fireflies' }, text: '## Transcript (verbatim)\n**Craig Morrison:** The yard is radios.\n', source: 'fireflies', vault_pushed_at: null, synced_at: new Date('2026-10-09T14:38:00Z') },
    ] }, NOW);
    await recordVaultSync(db.client(), { ok: true, repo: 'o/r', branch: 'main', commitSha: 'c1', treeSha: 't1', commitAt: null, etag: null, counts: null, durationMs: 5, error: null, skipped: null });
    const client = db.client() as Record<string, unknown>;
    const prisma = { ...client, canonicalCompany: { count: async () => 1, findMany: async () => [], findFirst: async () => ({ primary_account_name: 'Kenco', domain: 'kencogroup.com' }) }, gapAccountAlias: { count: async () => 0, findMany: async () => [] } };
    const env = { GAP_VAULT_GITHUB_TOKEN: 'set' };
    const inputs = await loadHealthInputs(prisma as never, { env, clock: () => NOW.getTime() });
    const c = inputs.context as ContextProbe;
    expect(c.vaultTable).toEqual({ readable: true, rows: 2, lastSyncedAt: '2026-10-09T14:39:00.000Z', kinds: { account: 1, person: 0, deal: 0, meeting: 0, raw: 1, other: 0 }, tokenConfigured: true, localDir: false, lastSync: { ok: true, at: expect.any(String), error: null, written: null, skipped: false } });
    expect(c.vault, 'the coverage came from the table through prisma (configured, reachable, the sync time as index time)').toMatchObject({ configured: true, reachable: true, indexedAt: '2026-10-09T14:39:00.000Z' });
    expect(c.canary).toEqual({ account: 'Kenco', domain: 'kencogroup.com' });
    const comp = evaluateHealth(inputs, NOW).components.find((x) => x.key === 'context')!;
    expect(comp.detail).toContain('vault: 2 notes (1 call, 1 account note), synced 10:39 New York');
    // A client that does not know the model is not probed (absent, nothing claimed); one that knows it and cannot read it
    // (the migration not applied: the query throws) is said unreadable, never a crash.
    const bare = await loadHealthInputs({ gapAuditEvent: { findMany: async () => [], findFirst: async () => null, count: async () => 0 } } as never, { env: {}, clock: () => NOW.getTime() });
    expect((bare.context as ContextProbe).vaultTable).toBeUndefined();
    const missing = await loadHealthInputs({ gapAuditEvent: { findMany: async () => [], findFirst: async () => null, count: async () => 0 }, gapKnowledgeNote: { count: async () => { throw new Error('The table `public.gap_knowledge_notes` does not exist'); }, findFirst: async () => null } } as never, { env: {}, clock: () => NOW.getTime() });
    expect((missing.context as ContextProbe).vaultTable).toEqual({ readable: false, error: 'The table `public.gap_knowledge_notes` does not exist', tokenConfigured: false, localDir: false });
    const m = evaluateHealth(missing, NOW).components.find((x) => x.key === 'context')!;
    expect(m.state).toBe('DEGRADED');
    expect(m.detail).toContain('vault table unreadable (The table `public.gap_knowledge_notes` does not exist)');
  });
});
