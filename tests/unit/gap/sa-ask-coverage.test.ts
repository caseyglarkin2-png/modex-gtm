// @vitest-environment node
/**
 * Seller acceptance follow-up (2026-10-09), C4: the Ask context says what it was built from. Casey's rule: retrieve
 * HubSpot associations, the Gmail conversation and Sent, drafts, the vault, Clawd and the signals before declaring
 * there is no context, and show incomplete coverage honestly. AskContext carries `coverage` (one row per source) and
 * `coverageLine` (the gaps in one line; null when everything was read); it is derived from the reads the account page
 * already makes, never a new read. Pinned: a context with the vault and Clawd unread says so; a fully read context has
 * no line; compactContext keeps both and scrubs an address out of a detail.
 */
import { describe, expect, it } from 'vitest';
import { askCoverageOf, coverageFromPage } from '@/lib/gap/ask/context';
import { ASK_COVERAGE_WORDS, compactContext, coverageLineOf, type AskCoverage } from '@/lib/gap/ask/grounding';
import type { PursuitState } from '@/lib/gap/pursuit/state';
import type { AccountStory } from '@/lib/gap/story/story';

const state = { accountName: 'Kenco', state: 'ready', stateLine: 'Ready for a first touch: Dave Kiesling', person: null, blocker: null, unlock: null, coldTouchAllowed: true, chooseAllowed: true, replyClass: null, lastInbound: null, lastOutbound: null, chosenMissing: null, next: null, followUp: null, deals: [] } as unknown as PursuitState;
const read = (over: Partial<Record<AskCoverage['source'], Partial<AskCoverage>>> = {}): AskCoverage[] => (['hubspot', 'gmail_thread', 'gmail_sent', 'gmail_drafts', 'vault', 'clawd', 'signals'] as const).map((source) => ({ source, status: 'read', detail: null, ...(over[source] ?? {}) }));

describe('C4: the Ask context carries its coverage', () => {
  it('a context with the vault and Clawd unread says so in one line; a fully read context has coverageLine null', () => {
    const gaps = read({ gmail_sent: { status: 'not_read', detail: 'no GAP sender configured' }, vault: { status: 'not_read', detail: 'not configured' }, clawd: { status: 'not_read', detail: 'not configured' } });
    expect(coverageLineOf(gaps)).toBe('Not read this time: Gmail Sent (no GAP sender configured), the vault (not configured), Clawd (not configured)');
    expect(coverageLineOf(read())).toBeNull();
    expect(coverageLineOf([])).toBeNull();
    // A failed read and a partial read are said apart from an unread one.
    expect(coverageLineOf(read({ hubspot: { status: 'failed', detail: 'identity_unresolved' }, gmail_drafts: { status: 'partial', detail: '1 GAP draft known from the ledger; Gmail drafts not read' } }))).toBe('Not read this time: HubSpot (identity_unresolved). Partly read: Gmail drafts (1 GAP draft known from the ledger; Gmail drafts not read)');
    expect(Object.keys(ASK_COVERAGE_WORDS)).toEqual(['hubspot', 'gmail_thread', 'gmail_sent', 'gmail_drafts', 'vault', 'clawd', 'signals']);
  });

  it('compactContext keeps the coverage and the line, scrubs an address out of a detail, and carries an empty coverage with no line when the caller said nothing', () => {
    const ctx = compactContext({ accountName: 'Kenco', state, nextText: 'x', story: null, anchor: null, stack: null, coverage: read({ vault: { status: 'not_read', detail: 'not configured' }, clawd: { status: 'failed', detail: 'could not be read for dave.kiesling@kencogroup.com' } }) });
    expect(ctx.coverage!.map((c) => [c.source, c.status])).toEqual([['hubspot', 'read'], ['gmail_thread', 'read'], ['gmail_sent', 'read'], ['gmail_drafts', 'read'], ['vault', 'not_read'], ['clawd', 'failed'], ['signals', 'read']]);
    expect(ctx.coverage!.find((c) => c.source === 'clawd')!.detail).toBe('could not be read for their address');
    expect(ctx.coverageLine).toBe('Not read this time: the vault (not configured), Clawd (could not be read for their address)');
    const full = compactContext({ accountName: 'Kenco', state, nextText: 'x', story: null, anchor: null, stack: null, coverage: read() });
    expect(full.coverageLine).toBeNull();
    const silent = compactContext({ accountName: 'Kenco', state, nextText: 'x', story: null, anchor: null, stack: null });
    expect(silent).toMatchObject({ coverage: [], coverageLine: null });
  });

  it('askCoverageOf reads the page: HubSpot from the opportunity read (null is not read, UNKNOWN is failed with its detail), Sent never read (the sender said), drafts from the ledger only, the vault and Clawd from their configuration and the story, the signals read', () => {
    const none = askCoverageOf({ opportunity: null, vaultNote: false, vaultConfigured: false, clawdConfigured: false, clawdFailed: false, senderConfigured: false, draftsOnRecord: 0 });
    expect(none.map((c) => `${c.source}:${c.status}`)).toEqual(['hubspot:not_read', 'gmail_thread:partial', 'gmail_sent:not_read', 'gmail_drafts:not_read', 'vault:not_read', 'clawd:not_read', 'signals:read']);
    expect(coverageLineOf(none)).toBe("Not read this time: HubSpot (not read this time), Gmail Sent (no GAP sender configured), Gmail drafts (Gmail drafts not read), the vault (not configured), Clawd (not configured). Partly read: the Gmail thread (GAP's synced inbox, not a live thread read)");
    const most = askCoverageOf({ opportunity: { status: 'ACTIVE', detail: '', deals: [] }, vaultNote: true, vaultConfigured: true, clawdConfigured: true, clawdFailed: false, senderConfigured: true, draftsOnRecord: 2 });
    expect(most.map((c) => `${c.source}:${c.status}`)).toEqual(['hubspot:read', 'gmail_thread:partial', 'gmail_sent:not_read', 'gmail_drafts:partial', 'vault:read', 'clawd:read', 'signals:read']);
    expect(most.find((c) => c.source === 'gmail_sent')!.detail).toBe('not read on the account page');
    expect(most.find((c) => c.source === 'gmail_drafts')!.detail).toBe('2 GAP drafts known from the ledger; Gmail drafts not read');
    const unknown = askCoverageOf({ opportunity: { status: 'UNKNOWN', detail: 'identity_unresolved', deals: [] }, vaultNote: false, vaultConfigured: true, clawdConfigured: true, clawdFailed: true, senderConfigured: true, draftsOnRecord: 0 });
    expect(unknown.find((c) => c.source === 'hubspot')).toEqual({ source: 'hubspot', status: 'failed', detail: 'identity_unresolved' });
    expect(unknown.find((c) => c.source === 'vault')).toEqual({ source: 'vault', status: 'partial', detail: 'no account note found, or the read failed' });
    expect(unknown.find((c) => c.source === 'clawd')).toEqual({ source: 'clawd', status: 'failed', detail: 'could not be read' });
  });

  it('coverageFromPage derives everything from the inputs, the story and the environment, with no read', () => {
    const story = { rows: [{ key: 'note', label: 'Your note', tag: 'Our read', sentences: [{ text: 'Met Dave at the show.', tag: 'Our read', basis: 'vault', basisIds: [] }], wrongIf: null, collapsed: false }, { key: 'between_us', label: 'Between us', tag: 'Unknown', sentences: [{ text: "No touch in GAP's own records; clawd's send history could not be read.", tag: 'Unknown', basis: 'GAP', basisIds: [] }], wrongIf: null, collapsed: false }], first: [], checkBeforeContacting: [], setAsideCaveats: [] } as unknown as AccountStory;
    const env = { GAP_VAULT_DIR: 'C:/vault', CLAWD_CONTROL_PLANE_URL: 'https://clawd.example', CLAWD_CONTROL_PLANE_TOKEN: 'x', GAP_GMAIL_USER_EMAIL: 'casey@freightroll.com' };
    const c = coverageFromPage({ opportunity: { status: 'CLEAR', detail: '', deals: [] }, firstTouches: [{ recipient: 'dave@kencogroup.com', sentAt: null, state: 'draft outstanding', gmailDraftId: 'd1' }] }, story, env);
    expect(c.map((x) => `${x.source}:${x.status}`)).toEqual(['hubspot:read', 'gmail_thread:partial', 'gmail_sent:not_read', 'gmail_drafts:partial', 'vault:read', 'clawd:failed', 'signals:read']);
    const bare = coverageFromPage({ opportunity: null, firstTouches: [] }, null, {});
    expect(bare.map((x) => `${x.source}:${x.status}`)).toEqual(['hubspot:not_read', 'gmail_thread:partial', 'gmail_sent:not_read', 'gmail_drafts:not_read', 'vault:not_read', 'clawd:not_read', 'signals:read']);
    expect(coverageLineOf(bare)).toContain('Gmail Sent (no GAP sender configured), Gmail drafts (Gmail drafts not read), the vault (not configured), Clawd (not configured)');
  });
});
