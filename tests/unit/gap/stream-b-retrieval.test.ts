// @vitest-environment node
/**
 * C14, C15, C16 (the commercial-context audit, 2026-10-08): the vault and Clawd become attributed claims. Pinned:
 * the account note's dated inbox notes and the July discovery meeting are retrievable beside the note itself, each
 * with its path and heading as the source id; an October 8 refreshed file with an undated July wedge yields an
 * undated claim (indexedAt October, observedAt null), never an October observation; a note at another account is not
 * followed and a private personal detail or a mention of another account never reaches external use; Clawd's notes
 * are selected by identity and version (the newest current, an identical copy dropped, an older different text kept
 * superseded and in conflict), the same whatever order they came in; the coverage says offline, timeout, not found
 * and not configured apart from empty; the story readers keep their outputs through the new path.
 */
import { describe, expect, it, vi } from 'vitest';
import { clawdClaims, parseClawdNote, retrieveAccountKnowledge, currentClawdClaim, wikiLinks, MAX_LINKED_NOTES } from '@/lib/gap/context/retrieval';
import { externallyUsable, validateClaims } from '@/lib/gap/context/commercial-context';
import { fetchClawdVaultNote, knowledgeAdapters, loadAccountKnowledge, readLocalVaultNote } from '@/lib/gap/story/load';

import { FILES, ACCOUNT, NOTES, NOW, KENCO as kenco, snapshot, vaultOf } from './stream-b-fixture';

describe('C14: bounded account-specific retrieval from the vault', () => {
  it('the recent inbox note, the July discovery and the account note are all retrievable, each attributed by path and heading; every claim validates', async () => {
    const k = await retrieveAccountKnowledge({ vault: vaultOf(FILES) }, kenco);
    expect(validateClaims(k.claims)).toMatchObject({ ok: true });
    const ids = k.claims.map((c) => c.sourceId);
    expect(ids).toContain('vault:02_Accounts/Kenco Logistics.md#YardFlow wedge');
    expect(ids).toContain('vault:02_Accounts/Kenco Logistics.md#Inbox notes');
    expect(ids).toContain('vault:05_Meetings/2026-07-16 Kenco Logistics.md#Buyer words (verbatim)');
    expect(ids).toContain('vault:00_Inbox/raw/2026-10-07-call-sales-standup.md#Transcript (verbatim)');
    expect(ids).toContain('vault:03_People/Craig Morrison.md#frontmatter');
    const standup = k.claims.find((c) => c.sourceId.endsWith('#Inbox notes') && /crowded out/.test(c.text))!;
    expect(standup).toMatchObject({ observedAt: '2026-10-07T00:00:00.000Z', eventAt: '2026-10-07T00:00:00.000Z', indexedAt: '2026-10-08T00:00:00.000Z', claimClass: 'seller_noted', authority: 'seller_interpretation', visibility: 'internal' });
    expect(standup.text).not.toMatch(/Source:|\[\[/);
    const dave = k.claims.find((c) => /open dock, we've got Terminal/.test(c.text))!;
    expect(dave).toMatchObject({ claimClass: 'buyer_said', authority: 'buyer_words', visibility: 'external_ok', eventAt: '2026-07-16T00:00:00.000Z', observedAt: '2026-07-16T00:00:00.000Z', sourceKind: 'vault' });
    const span = k.claims.find((c) => c.sourceId.includes('raw/2026-10-07') && /Casey Larkin:/.test(c.text))!;
    expect(span).toMatchObject({ claimClass: 'seller_noted', observedAt: '2026-10-07T00:00:00.000Z' });
    expect(k.claims.some((c) => c.sourceId.includes('raw/2026-10-07') && /sub zero/.test(c.text))).toBe(false);
    expect(k.followed).toEqual(expect.arrayContaining(['05_Meetings/2026-07-16 Kenco Logistics.md', '00_Inbox/raw/2026-10-07-call-sales-standup.md', '03_People/Craig Morrison.md']));
    expect(k.notFollowed).toEqual(expect.arrayContaining([{ link: '2026-07-16 Ball Corporation', reason: 'other_account' }, { link: 'Dave Kiesling', reason: 'other_account' }, { link: '2026-07-29-call-sales-standup', reason: 'not_found' }]));
    expect(k.coverage.find((c) => c.source === 'vault')).toMatchObject({ configured: true, reachable: true, completeness: 'complete', watermark: '2026-10-08T00:00:00.000Z', indexedAt: '2026-10-08T00:00:00.000Z', query: '02_Accounts/Kenco Logistics.md' });
  });

  it('unrelated accounts, private personal details, engagement and modeled figures never reach external use; the Ball note is not read at all', async () => {
    const k = await retrieveAccountKnowledge({ vault: vaultOf(FILES) }, kenco);
    const text = k.claims.map((c) => c.text).join('\n');
    expect(text).not.toMatch(/we hear about Kenco a lot/);
    const external = externallyUsable(k.claims).map((c) => c.text);
    expect(external).toEqual(expect.arrayContaining([expect.stringContaining("open dock, we've got Terminal"), expect.stringContaining('case study work')]));
    expect(external.join('\n')).not.toMatch(/medical|wife|pre-op|Ohio|Ball Corporation|deck|\$98\.9M|no associated deal|already emailed/i);
    const wife = k.claims.find((c) => /pre-op/.test(c.text))!;
    expect(wife).toMatchObject({ claimClass: 'internal_only', visibility: 'internal' });
    const medical = k.claims.find((c) => /medical procedure on the 30th/.test(c.text))!;
    expect(medical).toMatchObject({ claimClass: 'buyer_said', visibility: 'internal' });
    expect(k.claims.find((c) => /opened the YardFlow network deck/.test(c.text))).toMatchObject({ claimClass: 'internal_only' });
    expect(k.claims.find((c) => /\$98\.9M/.test(c.text))).toMatchObject({ claimClass: 'modeled', authority: 'modeled', visibility: 'internal' });
    expect(k.claims.find((c) => /no associated deal/.test(c.text))).toMatchObject({ claimClass: 'seller_noted', authority: 'seller_interpretation' });
    expect(k.claims.find((c) => /already emailed/.test(c.text))).toMatchObject({ claimClass: 'internal_only', observedAt: '2026-10-08T00:00:00.000Z' });
  });

  it('C15: the October 8 refreshed file with an undated July wedge yields an undated claim; the September buyer mail would keep September (the validator refuses a refresh time as an observation)', async () => {
    const k = await retrieveAccountKnowledge({ vault: vaultOf(FILES) }, { ...kenco, followLinks: false });
    const wedge = k.claims.find((c) => c.sourceId.endsWith('#YardFlow wedge'))!;
    expect(wedge).toMatchObject({ observedAt: null, eventAt: null, indexedAt: '2026-10-08T00:00:00.000Z', version: null });
    expect(k.followed).toEqual([]);
    // Mutation: pass the refresh time off as the observation and the contract's own check goes RED.
    expect(validateClaims([{ ...wedge, observedAt: wedge.indexedAt }])).toEqual({ ok: false, faults: [{ claimId: wedge.claimId, reason: 'refresh_as_observation' }] });
  });

  it('the link bound is a count of files, said in the coverage; a vault that throws is unreachable with the reason; no vault dir is not configured; no account note is reachable and empty', async () => {
    const many: Record<string, string> = { ...FILES };
    const links = Array.from({ length: MAX_LINKED_NOTES + 3 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')} Kenco Logistics`);
    for (const l of links) many[`05_Meetings/${l}.md`] = `---\ntype: meeting\naccount: Kenco Logistics\ndate: ${l.slice(0, 10)}\n---\n## What actually happened\nA call about the yards on ${l.slice(0, 10)}.\n`;
    many['02_Accounts/Kenco Logistics.md'] = `${ACCOUNT}\n## History\n${links.map((l) => `- ${l.slice(0, 10)}: see [[${l}]].`).join('\n')}\n`;
    const k = await retrieveAccountKnowledge({ vault: vaultOf(many) }, kenco);
    expect(k.followed.length).toBe(MAX_LINKED_NOTES);
    expect(k.notFollowed.filter((n) => n.reason === 'bound').length).toBeGreaterThan(0);
    expect(k.coverage[0]).toMatchObject({ source: 'vault', completeness: 'partial' });
    expect(k.coverage[0].omittedReason).toMatch(/bound/);
    const thrown = await retrieveAccountKnowledge({ vault: { readFile: async () => { throw new Error('EACCES'); } } }, kenco);
    expect(thrown.coverage[0]).toMatchObject({ source: 'vault', configured: true, reachable: false, omittedReason: 'vault unreadable: EACCES' });
    expect(thrown.claims).toEqual([]);
    const none = await retrieveAccountKnowledge({}, kenco);
    expect(none.coverage).toEqual([expect.objectContaining({ source: 'vault', configured: false }), expect.objectContaining({ source: 'clawd', configured: false })]);
    const empty = await retrieveAccountKnowledge({ vault: vaultOf({}) }, kenco);
    expect(empty.coverage[0]).toMatchObject({ reachable: true, completeness: 'complete', omittedReason: 'no account note' });
    expect(wikiLinks('see [[A|alias]] and [[B#h]] and [[a]]')).toEqual(['A', 'B']);
  });
});

describe('C16: Clawd knowledge by source identity and version', () => {
  it('the newest wedge is current, the identical July copy is one claim, the older different text is kept superseded and in conflict; the order of the array changes nothing; rebuilt_at is indexedAt, never observedAt', () => {
    const a = clawdClaims(snapshot(), kenco);
    const b = clawdClaims(snapshot([...NOTES].reverse()), kenco);
    const c = clawdClaims(snapshot([NOTES[3], NOTES[1], NOTES[4], NOTES[0], NOTES[2]]), kenco);
    expect(b).toEqual(a);
    expect(c).toEqual(a);
    expect(validateClaims(a)).toMatchObject({ ok: true });
    const wedges = a.filter((x) => x.sourceId.startsWith('clawd:vault wedge:'));
    expect(wedges).toHaveLength(2);
    const current = currentClawdClaim(a, 'vault wedge')!;
    expect(current).toMatchObject({ sourceId: 'clawd:vault wedge:2026-08-07', version: '2026-08-07', observedAt: '2026-08-07T00:00:00.000Z', indexedAt: '2026-10-08T13:02:52.000Z', eventAt: null, claimClass: 'seller_noted', visibility: 'internal' });
    const older = wedges.find((w) => w.version === '2026-07-11')!;
    expect(older).toMatchObject({ supersededBy: current.claimId, conflictsWith: [current.claimId], text: 'Primo proof first, then the committee.' });
    expect(current.conflictsWith).toEqual([older.claimId]);
    expect(a.find((x) => x.sourceId === 'clawd:hubspot:undated')).toMatchObject({ observedAt: null, indexedAt: '2026-10-08T13:02:52.000Z', claimClass: 'seller_noted', authority: 'seller_interpretation', text: 'no associated deal (dealStage null)' });
    expect(a.find((x) => x.sourceId.startsWith('clawd:deck engagement'))).toMatchObject({ claimClass: 'internal_only' });
    expect(externallyUsable(a)).toEqual([]);
    expect(parseClawdNote('<strong>Vault wedge (2026-07-10):</strong> x')).toEqual({ identity: 'vault wedge', version: '2026-07-10', text: 'x' });
    expect(parseClawdNote('just a sentence')).toEqual({ identity: 'note', version: null, text: 'just a sentence' });
    expect(parseClawdNote('  ')).toBeNull();
  });

  it('the coverage says timeout, not found, no domain and the 10-note cap apart from an empty snapshot; the vault and Clawd run side by side', async () => {
    const timeout = await retrieveAccountKnowledge({ vault: vaultOf(FILES), clawd: { fetchSnapshot: async () => { throw new Error('The operation was aborted due to timeout'); } } }, kenco);
    expect(timeout.coverage.find((c) => c.source === 'clawd')).toMatchObject({ configured: true, reachable: false, omittedReason: 'timeout', query: 'kencogroup.com' });
    expect(timeout.claims.some((c) => c.sourceKind === 'vault')).toBe(true);
    const missing = await retrieveAccountKnowledge({ clawd: { fetchSnapshot: async () => ({ found: false, rebuiltAt: null, reasoningNotes: [] }) } }, kenco);
    expect(missing.coverage.find((c) => c.source === 'clawd')).toMatchObject({ reachable: true, completeness: 'complete', omittedReason: 'no snapshot for the domain' });
    const noDomain = await retrieveAccountKnowledge({ clawd: { fetchSnapshot: async () => snapshot() } }, { ...kenco, domain: null });
    expect(noDomain.coverage.find((c) => c.source === 'clawd')).toMatchObject({ reachable: true, omittedReason: 'no domain to ask' });
    const capped = await retrieveAccountKnowledge({ clawd: { fetchSnapshot: async () => snapshot(Array.from({ length: 10 }, (_, i) => `Note ${i}: text ${i}`)) } }, kenco);
    expect(capped.coverage.find((c) => c.source === 'clawd')).toMatchObject({ completeness: 'partial', omittedReason: 'the snapshot holds at most 10 notes', indexedAt: '2026-10-08T13:02:52.000Z' });
    const both = await retrieveAccountKnowledge({ vault: vaultOf(FILES), clawd: { fetchSnapshot: async () => snapshot() } }, kenco);
    expect(both.claims.filter((c) => c.sourceKind === 'clawd')).toHaveLength(4);
    expect(both.coverage.find((c) => c.source === 'clawd')).toMatchObject({ reachable: true, completeness: 'complete', watermark: '2026-08-07T00:00:00.000Z' });
  });
});

describe('the story readers through the retrieval', () => {
  const env = { CLAWD_CONTROL_PLANE_URL: 'https://clawd.example/', CLAWD_CONTROL_PLANE_TOKEN: 'tok', GAP_VAULT_DIR: 'C:/vault/' };
  const json = (body: unknown, ok = true, status = 200) => ({ ok, status, json: async () => body }) as unknown as Response;
  it('the local note is the wedge paragraph with the file date as its label and no observation date; the adapters read the vault dir and the Clawd route; loadAccountKnowledge joins both', async () => {
    const readFile = vi.fn(async (p: string) => FILES[p.replace('C:/vault/', '')] ?? null);
    const n = await readLocalVaultNote('Kenco Logistics', { env, readFile });
    expect(n).toMatchObject({ text: expect.stringMatching(/^You have already automated the four walls/), at: '2026-10-08', observedAt: null, indexedAt: '2026-10-08T00:00:00.000Z', sourceId: 'vault:02_Accounts/Kenco Logistics.md#YardFlow wedge' });
    expect(readFile.mock.calls.map((c) => c[0])).toEqual(['C:/vault/02_Accounts/Kenco Logistics.md']);
    const fetchImpl = vi.fn(async () => json({ found: true, rebuilt_at: '2026-10-08 13:02:52.123456+00:00', snapshot: { reasoning_notes: NOTES } }));
    expect(await fetchClawdVaultNote('kencogroup.com', { env, fetchImpl })).toMatchObject({ text: 'Craig is bought in; phase the rollout across ~140 facilities.', at: '2026-08-07', observedAt: '2026-08-07T00:00:00.000Z', indexedAt: '2026-10-08T13:02:52.123Z' });
    const k = await loadAccountKnowledge({ accountName: 'Kenco Logistics', aliases: ['Kenco'], domain: 'kencogroup.com', now: NOW }, { env, readFile, fetchImpl });
    expect(k.claims.some((c) => c.sourceKind === 'vault')).toBe(true);
    expect(k.claims.some((c) => c.sourceKind === 'clawd')).toBe(true);
    expect(knowledgeAdapters({ env: {} })).toEqual({ vault: null, clawd: null });
  });
});
