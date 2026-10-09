import { describe, expect, it } from 'vitest';
import { vaultTableAdapter } from '@/lib/gap/knowledge/vault-table-adapter';
import { reresolveKnowledgeAccounts } from '@/lib/gap/knowledge/vault-sync';

const notes = [
  { id: 'a1', path: '02_Accounts/Kenco Logistics.md', kind: 'account', title: 'Kenco Logistics', account_name: 'Kenco', domain: 'kencogroup.com', frontmatter: { type: 'account', company: 'Kenco Logistics', next_action: 'Regroup with Craig' }, text: '# Kenco Logistics\n\nThe largest woman-owned 3PL.', synced_at: new Date('2026-10-09T18:00:00Z') },
  { id: 'm1', path: '05_Meetings/2026-09-16 Kenco Logistics.md', kind: 'meeting', title: 'Kenco x YardFlow - Next Steps', account_name: 'Kenco Logistics', domain: null, frontmatter: { type: 'meeting', account: 'Kenco Logistics' }, text: '', synced_at: new Date('2026-10-09T18:00:00Z') },
  { id: 'm2', path: '05_Meetings/2026-09-10 Sales Standup.md', kind: 'meeting', title: 'Sales Standup', account_name: null, domain: null, frontmatter: { type: 'meeting' }, text: '', synced_at: new Date('2026-10-09T18:00:00Z') },
  { id: 'r1', path: '00_Inbox/raw/2026-07-16-call-kenco.md', kind: 'raw', title: 'Kenco x YardFlow - Discovery', account_name: null, domain: null, frontmatter: { type: 'raw', source: 'fireflies' }, text: '', synced_at: new Date('2026-10-09T18:00:00Z') },
];
const updates: Array<{ id: string; account_name: string }> = [];
const stub = {
  account: { findMany: async () => [{ name: 'Kenco' }, { name: 'PepsiCo' }] },
  gapKnowledgeNote: {
    findUnique: async (q: { where: { path: string } }) => notes.find((n) => n.path === q.where.path) ?? null,
    findFirst: async (q: { where: { kind?: string; account_name?: { equals?: string; mode?: string; not?: null }; OR?: Array<Record<string, unknown>> } }) => {
      const w = q.where;
      return notes.find((n) => (!w.kind || n.kind === w.kind)
        && (!w.account_name?.equals || (n.account_name ?? '').toLowerCase() === w.account_name.equals.toLowerCase())
        && (!('not' in (w.account_name ?? {})) || n.account_name !== null)
        && (!w.OR || w.OR.some((o) => (o.title && (n.title ?? '').toLowerCase() === String((o.title as { equals: string }).equals).toLowerCase()) || (o.frontmatter && (n.frontmatter as Record<string, unknown>).company === (o.frontmatter as { equals: string }).equals)))) ?? null;
    },
    findMany: async (q: { where?: { kind?: { in: string[] } } }) => notes.filter((n) => !q.where?.kind || q.where.kind.in.includes(n.kind)),
    update: async (q: { where: { id: string }; data: { account_name: string } }) => { updates.push({ id: q.where.id, account_name: q.data.account_name }); return {}; },
  },
};

describe('the lead wiring of the knowledge table, second half (knowledge program, 2026-10-09)', () => {
  it('the table adapter answers "02_Accounts/<GAP account>.md" with the note resolved to that account (the vault names the file by the company)', async () => {
    const a = vaultTableAdapter(stub as never);
    expect(await a.readFile('02_Accounts/Kenco Logistics.md'), 'the exact path still answers').toContain('The largest woman-owned 3PL');
    expect(await a.readFile('02_Accounts/Kenco.md'), 'the GAP account name answers through the resolved account').toContain('The largest woman-owned 3PL');
    expect(await a.readFile('02_Accounts/kenco.md'), 'case does not matter').toContain('3PL');
    expect(await a.readFile('02_Accounts/PepsiCo.md'), 'an account with no note is null, never another account\'s note').toBeNull();
    expect(await a.readFile('05_Meetings/Kenco.md'), 'only the account folder is answered by account').toBeNull();
  });

  it('re-resolve places a note whose account is the vault\'s own name through the vault\'s account notes, leaves the placed and the unplaceable alone, and writes only on apply', async () => {
    const resolveAccount = async (raw: string | null) => raw; // the identity context places nothing here; the vault map must
    const dry = await reresolveKnowledgeAccounts(stub as never, { apply: false, resolveAccount: async (raw, domain) => {
      // the real resolver consults the vault's account notes after the identity context; mirror it with the stub's findFirst
      const note = await stub.gapKnowledgeNote.findFirst({ where: { kind: 'account', account_name: { not: null }, OR: [{ title: { equals: raw ?? '' } }, { frontmatter: { path: ['company'], equals: raw ?? '' } }] } });
      return note?.account_name ?? (await resolveAccount(raw)) ?? (domain ? null : null);
    } });
    expect(dry.looked, 'the meeting named the vault way and the raw call with no name are looked at; the placed account note is not').toBe(1);
    expect(dry.changed).toBe(1);
    expect(dry.samples).toEqual([{ path: '05_Meetings/2026-09-16 Kenco Logistics.md', from: 'Kenco Logistics', to: 'Kenco' }]);
    expect(updates, 'a dry run writes nothing').toEqual([]);
    const applied = await reresolveKnowledgeAccounts(stub as never, { apply: true, resolveAccount: async (raw) => (raw === 'Kenco Logistics' ? 'Kenco' : raw) });
    expect(applied.changed).toBe(1);
    expect(updates).toEqual([{ id: 'm1', account_name: 'Kenco' }]);
  });
});
