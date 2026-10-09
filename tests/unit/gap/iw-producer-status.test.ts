/**
 * IW13: the continuing sync is visible. One status per producer from the import ledger: never, current, stalled since
 * a date, failed with its reason; the vault from its own ledger rows; the briefing's coverage paragraph; a partial run
 * followed by a later run advances the cursor and the state.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { loadProducerStatus, producerShort, producerStatusLine, type ProducerStatus } from '@/lib/gap/signals/producer-status';
import { INTEL_IMPORTED_EVENT, INTEL_PRODUCERS, REPORT_ARCHIVE_CLASS } from '@/lib/gap/signals/intelligence-record';
import { VAULT_SYNCED_KIND } from '@/lib/gap/knowledge/vault-sync';

const NOW = new Date('2026-10-09T18:00:00.000Z');
const day = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function run(producer: string, at: Date, over: Partial<Row> = {}, payload: Record<string, unknown> = {}): Row {
  return {
    id: `ev-${producer}-${at.getTime()}`,
    kind: INTEL_IMPORTED_EVENT,
    actor: 'casey:import',
    subject_type: 'producer',
    subject_id: producer,
    payload: { runId: `${producer}-run`, runIds: [`${producer}-run`], cursor: null, accepted: 3, duplicates: 1, revised: 0, invalid: 0, reportedOnFrom: '2026-10-09', reportedOnTo: '2026-10-09', producerState: { status: 'ok' }, at: at.toISOString(), ...payload },
    created_at: at,
    ...over,
  };
}

function signal(i: number, producer: string, archive = false): Row {
  return { id: `sig${i}`, url_hash: `h${i}`, title: `t${i}`, origin: 'report_import', source_class: archive ? REPORT_ARCHIVE_CLASS : 'report', resolution: 'resolved', research_status: 'none', relevance: 'account_context', categories: [], submitted_by: `import:${producer}`, metadata: {}, feedback: null, feedback_at: null, created_at: day(1) };
}

const by = (list: ProducerStatus[], p: string) => list.find((s) => s.producer === p)!;

describe('loadProducerStatus', () => {
  it('no ledger at all: every known producer is never, the vault never synced, waiting for its token', async () => {
    const db = ledgerDb({}, NOW);
    const list = await loadProducerStatus(db.client(), NOW, { env: {} });
    expect(list.map((s) => s.producer)).toEqual([...Object.keys(INTEL_PRODUCERS), 'vault']);
    for (const p of Object.keys(INTEL_PRODUCERS)) expect(by(list, p)).toMatchObject({ state: 'never', lastImportAt: null, lastCounts: null, cursor: null, totalItems: 0, totalReports: 0, line: `${INTEL_PRODUCERS[p].label}: never imported.` });
    expect(by(list, 'vault')).toMatchObject({ state: 'never', line: 'the vault: never synced; the cron waits for its GitHub token.' });
    expect(producerStatusLine(list)).toBe('Sources: none read this time. Not read this time: Yards First Brief: never imported; Freight X Signal Desk: never imported; HubSpot Activity & Engagement report: never imported; Clawd signal hunter: never imported; the vault: never synced.');
  });

  it('current, stalled since a date, failed with its reason, and a producer the ledger names that INTEL_PRODUCERS does not', async () => {
    const db = ledgerDb(
      {
        audit: [
          run('yards_first_brief', day(0.2), {}, { accepted: 3, revised: 1, duplicates: 2, invalid: 0, cursor: 'page-3' }),
          run('codex_hubspot_report', day(3), {}, { reportedOnTo: '2026-10-06' }),
          run('clawd_signal_hunter', day(1), {}, { accepted: 0, producerState: { status: 'failed', detail: 'the export was missing' } }),
          run('some_new_tool', day(5)),
        ],
        signals: [signal(1, 'yards_first_brief'), signal(2, 'yards_first_brief'), signal(3, 'yards_first_brief'), signal(4, 'yards_first_brief', true), signal(5, 'yards_first_brief', true), signal(6, 'codex_hubspot_report')],
      },
      NOW,
    );
    const list = await loadProducerStatus(db.client(), NOW, { env: {} });
    const yfb = by(list, 'yards_first_brief');
    expect(yfb).toMatchObject({ state: 'current', label: 'Yards First Brief', cadenceDays: 1, lastRunId: 'yards_first_brief-run', lastReportedOn: '2026-10-09', lastCounts: { accepted: 3, revised: 1, duplicates: 2, invalid: 0 }, lastProducerState: { status: 'ok', detail: null }, cursor: 'page-3', totalItems: 3, totalReports: 2 });
    expect(yfb.line).toBe('Yards First Brief: last import Oct 9, 2026 (2 reports, 3 items, reports through Oct 9, 2026); current.');
    const hs = by(list, 'codex_hubspot_report');
    expect(hs.state).toBe('stale');
    expect(hs.line).toBe('HubSpot Activity & Engagement report: last import Oct 6, 2026 (0 reports, 1 item, reports through Oct 6, 2026); stalled since Oct 6, 2026.');
    const clawd = by(list, 'clawd_signal_hunter');
    expect(clawd).toMatchObject({ state: 'failed', lastProducerState: { status: 'failed', detail: 'the export was missing' } });
    expect(clawd.line).toBe('Clawd signal hunter: last import Oct 8, 2026 (0 reports, 0 items, reports through Oct 9, 2026); the last run failed (the export was missing).');
    const other = by(list, 'some_new_tool');
    expect(other).toMatchObject({ label: 'some_new_tool', cadenceDays: 7, state: 'current' });
    expect(by(list, 'freight_x_signal_desk').state).toBe('never');
    // Short forms and the paragraph.
    expect(producerShort(yfb)).toBe('Yards First Brief Oct 9, 2026 (3 items)');
    expect(producerShort(hs)).toBe('HubSpot Activity & Engagement report: stalled since Oct 6, 2026');
    expect(producerShort(clawd)).toBe('Clawd signal hunter: failed Oct 8, 2026');
    expect(producerStatusLine(list)).toBe('Sources: Yards First Brief Oct 9, 2026 (3 items); some_new_tool Oct 4, 2026 (0 items). Not read this time: Freight X Signal Desk: never imported; HubSpot Activity & Engagement report: stalled since Oct 6, 2026; Clawd signal hunter: failed Oct 8, 2026; the vault: never synced.');
  });

  it('a partial run followed by a later run advances the cursor and the state; a later run without a cursor keeps the last one', async () => {
    const db = ledgerDb({ audit: [run('yards_first_brief', day(2), {}, { cursor: 'p1', producerState: { status: 'partial', detail: 'rate limited' } })] }, NOW);
    const partial = by(await loadProducerStatus(db.client(), NOW, { env: {} }), 'yards_first_brief');
    expect(partial).toMatchObject({ state: 'current', cursor: 'p1', lastProducerState: { status: 'partial', detail: 'rate limited' } });
    expect(partial.line).toContain('; the last run was partial (rate limited); current.');
    db.store.gapAuditEvent.push(run('yards_first_brief', day(0.1), {}, { cursor: 'p2' }));
    const later = by(await loadProducerStatus(db.client(), NOW, { env: {} }), 'yards_first_brief');
    expect(later).toMatchObject({ state: 'current', cursor: 'p2', lastProducerState: { status: 'ok', detail: null } });
    db.store.gapAuditEvent.push(run('yards_first_brief', day(0.05), {}, { cursor: null }));
    expect(by(await loadProducerStatus(db.client(), NOW, { env: {} }), 'yards_first_brief').cursor).toBe('p2');
    // A failed run after a good one is failed, not current; a good one after that is current again.
    db.store.gapAuditEvent.push(run('yards_first_brief', day(0.04), {}, { producerState: { status: 'failed', detail: 'no file' } }));
    expect(by(await loadProducerStatus(db.client(), NOW, { env: {} }), 'yards_first_brief').state).toBe('failed');
    db.store.gapAuditEvent.push(run('yards_first_brief', day(0.03)));
    expect(by(await loadProducerStatus(db.client(), NOW, { env: {} }), 'yards_first_brief').state).toBe('current');
  });

  it('the vault line: the local push waits for the cron token, the cron says what it wrote, a failed sync says why, an old one is stalled', async () => {
    const notes = [
      { path: '02_Accounts/Kenco.md', sha: 'a', git_sha: null, kind: 'account', account_name: 'Kenco', domain: null, people: [], note_date: null, title: 'Kenco', frontmatter: {}, text: 'x', source: null, vault_pushed_at: null, synced_at: day(0.5) },
      { path: '00_Inbox/raw/call.md', sha: 'b', git_sha: null, kind: 'raw', account_name: null, domain: null, people: [], note_date: null, title: 'Call', frontmatter: {}, text: 'y', source: 'fireflies', vault_pushed_at: null, synced_at: day(0.5) },
    ];
    const local = { id: 'v1', kind: VAULT_SYNCED_KIND, actor: 'casey:vault-push', subject_type: 'vault', subject_id: 'local:YardFlow-GTM-Obsidian-Vault', payload: { ok: true, repo: 'local:YardFlow-GTM-Obsidian-Vault', branch: 'local', commitSha: null, treeSha: null, commitAt: null, etag: null, counts: { seen: 2, unchangedByGitSha: 0, unchangedBySha: 0, read: 2, written: 2, remaining: 0, byKind: {}, errors: [] }, durationMs: 5, error: null, skipped: null }, created_at: day(0.5) };
    const db = ledgerDb({ knowledgeNotes: notes, audit: [local] }, NOW);
    const noToken = by(await loadProducerStatus(db.client(), NOW, { env: {} }), 'vault');
    expect(noToken).toMatchObject({ state: 'current', totalItems: 2, label: 'the vault', lastCounts: { accepted: 2, duplicates: 0, invalid: 0 } });
    expect(noToken.line).toBe('the vault: synced Oct 9, 2026 (2 notes) by the local push; the cron waits for its GitHub token.');
    const withToken = by(await loadProducerStatus(db.client(), NOW, { env: { GAP_VAULT_GITHUB_TOKEN: 'set' } }), 'vault');
    expect(withToken.line).toBe('the vault: synced Oct 9, 2026 (2 notes) by the local push; the cron has not run yet.');
    expect(producerShort(withToken)).toBe('the vault Oct 9, 2026 (2 notes)');
    db.store.gapAuditEvent.push({ id: 'v2', kind: VAULT_SYNCED_KIND, actor: 'cron:gap-vault-sync', subject_type: 'vault', subject_id: 'o/r', payload: { ok: true, repo: 'o/r', branch: 'main', commitSha: 'c1', treeSha: 't1', commitAt: '2026-10-09T10:00:00.000Z', etag: 'W/"e1"', counts: { seen: 20, unchangedByGitSha: 8, unchangedBySha: 0, read: 12, written: 12, remaining: 0, byKind: {}, errors: [] }, durationMs: 900, error: null, skipped: null }, created_at: day(0.2) });
    const cron = by(await loadProducerStatus(db.client(), NOW, { env: { GAP_VAULT_GITHUB_TOKEN: 'set' } }), 'vault');
    expect(cron).toMatchObject({ state: 'current', lastRunId: 'c1', lastReportedOn: '2026-10-09', cursor: 'W/"e1"', lastCounts: { accepted: 12, duplicates: 8 } });
    expect(cron.line).toBe('the vault: synced Oct 9, 2026 (2 notes) by the cron, 12 written, 0 remaining.');
    db.store.gapAuditEvent.push({ id: 'v3', kind: VAULT_SYNCED_KIND, actor: 'cron:gap-vault-sync', subject_type: 'vault', subject_id: 'o/r', payload: { ok: false, repo: 'o/r', branch: 'main', commitSha: null, treeSha: null, commitAt: null, etag: null, counts: null, durationMs: 100, error: 'GitHub 401', skipped: null }, created_at: day(0.1) });
    const failed = by(await loadProducerStatus(db.client(), NOW, { env: { GAP_VAULT_GITHUB_TOKEN: 'set' } }), 'vault');
    expect(failed.state).toBe('failed');
    expect(failed.line).toBe('the vault: the last sync failed Oct 9, 2026 (GitHub 401) (2 notes held).');
    const old = ledgerDb({ knowledgeNotes: notes, audit: [{ ...local, created_at: day(4) }] }, NOW);
    const stale = by(await loadProducerStatus(old.client(), NOW, { env: {} }), 'vault');
    expect(stale.state).toBe('stale');
    expect(stale.line).toBe('the vault: synced Oct 5, 2026 (2 notes) by the local push; the cron waits for its GitHub token; stalled since Oct 5, 2026.');
    expect(producerShort(stale)).toBe('the vault: stalled since Oct 5, 2026');
  });

  it('a client without the tables answers never, not a throw', async () => {
    const list = await loadProducerStatus({}, NOW, { env: {} });
    expect(list.every((s) => s.state === 'never')).toBe(true);
  });
});
