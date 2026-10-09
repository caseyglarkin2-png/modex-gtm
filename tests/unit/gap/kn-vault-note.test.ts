/**
 * Stream A (GAP OS knowledge, 2026-10-09): the pure vault-note parser, pinned on real-shaped fixtures copied from the
 * local vault (an account note, a Fireflies raw capture with participants and a short verbatim excerpt, a meeting
 * note auto-prepped from the calendar). The row is the same whichever way the file came (local push or the GitHub
 * tree): the sha is over the CRLF-normalised text, the git blob id matches git's own, the kind comes from the
 * frontmatter type or the folder, people are the addresses the note names, the date is the note's own day.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { gitBlobSha, isSyncedVaultPath, kindFromPath, knowledgeRowOf, parseVaultFrontmatter, parseVaultNote } from '@/lib/gap/knowledge/vault-note';

const FIX = path.resolve(__dirname, 'fixtures/vault');
const read = (rel: string) => readFileSync(path.join(FIX, rel), 'utf8');

describe('parseVaultNote: an account note', () => {
  const rel = '02_Accounts/Kenco Logistics.md';
  const n = parseVaultNote(rel, read(rel));
  it('is kind account with the company, the domain, the note title and the frontmatter kept', () => {
    expect(n.kind, 'frontmatter type account').toBe('account');
    expect(n.accountName, 'company is the raw account name').toBe('Kenco Logistics');
    expect(n.domain).toBe('kencogroup.com');
    expect(n.title, 'the H1').toBe('Kenco Logistics');
    expect(n.frontmatter.tier).toBe('1');
    expect(n.frontmatter.next_action_due).toBe('2026-10-15');
    expect(n.frontmatter.hubspot_url, 'an empty scalar is an empty string').toBe('');
    expect(n.source, 'an account note has no capture source').toBeNull();
    expect(n.noteDate, 'an account note carries no date of its own (created is not the note date)').toBeNull();
    expect(n.text.startsWith('<!-- seed:auto -->'), 'the body starts after the frontmatter block').toBe(true);
    expect(n.people, 'an address in the body is a person').toEqual(['craig.morrison@kencogroup.com']);
  });
  it('hashes: sha256 of the normalised text and git blob id of the same bytes; CRLF input gives the same row', () => {
    const raw = read(rel);
    expect(n.sha).toBe(createHash('sha256').update(raw.replace(/\r\n/g, '\n')).digest('hex'));
    const bytes = Buffer.from(raw.replace(/\r\n/g, '\n'), 'utf8');
    expect(n.gitSha).toBe(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'));
    expect(gitBlobSha('hello\n'), 'the known git id of "hello\\n"').toBe('ce013625030ba8dba906f756967f9e9ca394464a');
    const crlf = parseVaultNote(rel, raw.replace(/\n/g, '\r\n'));
    expect(crlf.sha).toBe(n.sha);
    expect(crlf.text).toBe(n.text);
  });
});

describe('parseVaultNote: a Fireflies raw capture', () => {
  const rel = '00_Inbox/raw/2026-07-16-call-kenco-x-yardflow-discovery.md';
  const n = parseVaultNote(rel, read(rel));
  it('is kind raw from fireflies, titled by call_title, dated by captured, with every participant as a person and the verbatim in the text', () => {
    expect(n.kind).toBe('raw');
    expect(n.source).toBe('fireflies');
    expect(n.title).toBe('Kenco x YardFlow - Discovery');
    expect(n.noteDate).toBe('2026-07-16T00:00:00.000Z');
    expect(n.people, 'participants first, lowercased, deduped').toEqual(['craig.morrison@kencogroup.com', 'dave.kiesling@kencogroup.com', 'casey@freightroll.com']);
    expect(n.accountName, 'a raw capture names no account in its frontmatter').toBeNull();
    expect(n.text).toContain('## Transcript (verbatim)');
    expect(n.text).toContain('**Craig Morrison:** Honestly the yard is radios and a spotter with a clipboard.');
  });
});

describe('parseVaultNote: a meeting note', () => {
  const rel = '05_Meetings/2026-07-16 Kenco Logistics.md';
  const n = parseVaultNote(rel, read(rel));
  it('is kind meeting for the account, dated by date, with the attendees read from the body and the people list kept as a list', () => {
    expect(n.kind).toBe('meeting');
    expect(n.accountName).toBe('Kenco Logistics');
    expect(n.noteDate).toBe('2026-07-16T00:00:00.000Z');
    expect(n.title, 'the H1 without a Meeting: prefix').toBe('Kenco x YardFlow - Discovery (Kenco Logistics)');
    expect(n.people).toEqual(['craig.morrison@kencogroup.com', 'dave.kiesling@kencogroup.com', 'casey@freightroll.com']);
    expect(n.frontmatter.people, 'an inline list').toEqual(['Craig Morrison', 'Dave Kiesling']);
    expect(n.frontmatter.follow_up_needed).toBe('true');
    expect(n.source, 'the vault does not stamp a meeting source; null, never guessed').toBeNull();
  });
});

describe('the folder rules', () => {
  it('kind comes from the folder when the frontmatter does not say; a dated filename gives the date; an odd file is other', () => {
    const n = parseVaultNote('03_People/Aaron Brown.md', '---\nname: Aaron Brown\ncompany: NFI Industries\nemail: \n---\n# Aaron Brown\n');
    expect(n.kind).toBe('person');
    expect(n.accountName).toBe('NFI Industries');
    expect(n.title).toBe('Aaron Brown');
    expect(n.people).toEqual([]);
    const d = parseVaultNote('00_Inbox/raw/2026-07-07-1634-obsidian-install.md', 'no frontmatter at all\n');
    expect(d.kind).toBe('raw');
    expect(d.noteDate).toBe('2026-07-07T00:00:00.000Z');
    expect(d.title, 'the file stem when there is no H1').toBe('2026-07-07-1634-obsidian-install');
    expect(parseVaultNote('07_Research/x.md', '---\ntype: weird\n---\n').kind).toBe('other');
    expect(kindFromPath('04_Deals\\Crowley - Pilot.md'), 'backslashes are normalised').toBe('deal');
  });
  it('isSyncedVaultPath: markdown under the five folders, never the skipped ones, never a non-markdown file', () => {
    expect(isSyncedVaultPath('02_Accounts/Kenco Logistics.md')).toBe(true);
    expect(isSyncedVaultPath('00_Inbox/raw/2026-07-16-call.md')).toBe(true);
    expect(isSyncedVaultPath('00_Inbox/Capture.md'), 'the inbox root is not synced, only raw').toBe(false);
    expect(isSyncedVaultPath('99_Archive/02_Accounts/Old.md')).toBe(false);
    expect(isSyncedVaultPath('_templates/account.md')).toBe(false);
    expect(isSyncedVaultPath('10_Operating_System/RETIREMENT-HANDOFF.md')).toBe(false);
    expect(isSyncedVaultPath('02_Accounts/logo.png')).toBe(false);
    expect(isSyncedVaultPath('05_Meetings/.obsidian/x.md')).toBe(false);
  });
  it('parseVaultFrontmatter: block lists, quoted scalars and no block at all', () => {
    const { fields, body } = parseVaultFrontmatter('---\ntags:\n  - a\n  - "b c"\nname: "Quoted Name"\n---\nbody\n');
    expect(fields.tags).toEqual(['a', 'b c']);
    expect(fields.name).toBe('Quoted Name');
    expect(body).toBe('body\n');
    expect(parseVaultFrontmatter('plain').fields).toEqual({});
  });
  it('knowledgeRowOf: the identity-matched account name overrides the raw one, null clears it, undefined keeps it', () => {
    const n = parseVaultNote('02_Accounts/Kenco Logistics.md', read('02_Accounts/Kenco Logistics.md'));
    const at = new Date('2026-10-09T14:39:00Z');
    expect(knowledgeRowOf(n, { accountName: 'Kenco', syncedAt: at }).account_name).toBe('Kenco');
    expect(knowledgeRowOf(n, { syncedAt: at }).account_name).toBe('Kenco Logistics');
    const row = knowledgeRowOf(n, { accountName: null, vaultPushedAt: at, syncedAt: at });
    expect(row.account_name).toBeNull();
    expect(row.vault_pushed_at).toBe(at);
    expect(row.git_sha).toBe(n.gitSha);
    expect(row.note_date).toBeNull();
  });
});
