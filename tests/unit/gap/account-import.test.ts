/**
 * ACCOUNT-SCOPED HUBSPOT IMPORT (owner resolution, 2026-10-05). Casey's click links ONE existing HubSpot contact
 * into ONE named GAP account: the contact must be associated with the account's HubSpot company, the account must
 * exist and is never created, an existing persona is linked (or re-homed within the corporate family when it has no
 * history there), never duplicated; HubSpot is never written and Apollo is never called; a second click is `already`.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { importHubSpotContactToAccount, type AccountImportReads } from '@/lib/gap/people/account-import';

const NOW = new Date('2026-10-05T15:00:00Z');
const ISAAC = { id: '219885493392', properties: { firstname: 'Isaac', lastname: 'Scott', jobtitle: 'Sr Director of Transportation - Frito-Lay', email: 'isaac.scott@pepsico.com', city: 'Orlando', state: 'Florida', country: 'United States', company: 'Pepsi', hs_email_optout: null } };

function reads(contacts: Record<string, any>, assoc: Record<string, string[]>): AccountImportReads {
  return { readContact: async (id) => contacts[id] ?? null, companyIdsForContact: async (id) => assoc[id] ?? [] };
}

function db(seed: { accounts: any[]; personas?: any[]; history?: Record<number, number> }) {
  const personas = [...(seed.personas ?? [])];
  const audit: any[] = [];
  const created: any[] = [];
  const updates: any[] = [];
  const sel = (p: any) => ({ id: p.id, account_name: p.account_name, name: p.name, title: p.title ?? null, email: p.email ?? null, email_status: p.email_status ?? null, do_not_contact: !!p.do_not_contact, hubspot_contact_id: p.hubspot_contact_id ?? null });
  const findFirst = async ({ where }: any) => {
    const rows = personas.filter((p) => {
      if (where.hubspot_contact_id !== undefined) return p.hubspot_contact_id === where.hubspot_contact_id;
      if (where.email?.equals) return (p.email ?? '').toLowerCase() === where.email.equals.toLowerCase() && (!where.account_name || p.account_name === where.account_name);
      return false;
    });
    return rows.length ? sel(rows[0]) : null;
  };
  const tx = {
    persona: {
      update: vi.fn(async (args: any) => { updates.push(args); const p = personas.find((x) => x.id === args.where.id); Object.assign(p, args.data); return p; }),
      create: vi.fn(async ({ data }: any) => { const row = { id: 7000 + created.length, ...data }; personas.push(row); created.push(row); return { id: row.id }; }),
    },
    contactEnrichment: { upsert: vi.fn(async () => ({ id: 1 })) },
    contactEnrichmentField: { upsert: vi.fn(async () => ({})) },
    gapAuditEvent: { create: vi.fn(async ({ data }: any) => { audit.push(data); return { id: `aud_${audit.length}` }; }) },
  };
  const counts = seed.history ?? {};
  const prisma = {
    account: {
      findUnique: vi.fn(async ({ where }: any) => seed.accounts.find((a) => a.name === where.name) ?? null),
      // Never called: an account-scoped import creates no account.
      create: vi.fn(async () => { throw new Error('account.create must never be called'); }),
    },
    persona: { findFirst: vi.fn(findFirst), findMany: vi.fn(async () => personas.map(sel)) },
    canonicalAccountLink: { findMany: vi.fn(async () => []) },
    prospectingHypothesis: { count: vi.fn(async ({ where }: any) => counts[where.primary_persona_id] ?? 0) },
    conversationDisposition: { count: vi.fn(async () => 0) },
    buyerInputData: { count: vi.fn(async () => 0) },
    sequenceEnrollment: { count: vi.fn(async () => 0) },
    gapAuditEvent: { count: vi.fn(async () => 0), create: tx.gapAuditEvent.create },
    $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  };
  return { prisma, audit, created, updates, personas, tx };
}

const PEPSI = { name: 'PepsiCo', hubspot_company_id: '56630459299', parent_brand: null };
const FRITO = { name: 'Frito-Lay', hubspot_company_id: '54772621360', parent_brand: 'PepsiCo' };
const deps = (r: AccountImportReads) => ({ reads: r, sync: vi.fn(async () => undefined), company: { configured: () => true } });

describe('the association assert and the account assert', () => {
  it('a contact associated with the account company is created at the account, audited, with no Apollo and no HubSpot write', async () => {
    const { prisma, audit, created } = db({ accounts: [PEPSI] });
    const d = deps(reads({ [ISAAC.id]: ISAAC }, { [ISAAC.id]: ['56630459299', '54772621360'] }));
    const r = await importHubSpotContactToAccount(prisma, { accountName: 'PepsiCo', hubspotContactId: ISAAC.id, actor: 'casey@yardflow.ai', now: NOW }, d);
    expect(r).toMatchObject({ ok: true, status: 'created', accountName: 'PepsiCo', name: 'Isaac Scott', title: 'Sr Director of Transportation - Frito-Lay', hasEmail: true });
    expect(created[0]).toMatchObject({ account_name: 'PepsiCo', hubspot_contact_id: ISAAC.id, email: 'isaac.scott@pepsico.com', persona_id: 'hs-219885493392', is_contact_ready: true, do_not_contact: false, source_type: 'hubspot' });
    expect(audit[0]).toMatchObject({ kind: 'person.imported_from_hubspot', actor: 'casey@yardflow.ai', subject_type: 'persona', payload: { status: 'created', accountName: 'PepsiCo', hubspotContactId: ISAAC.id, hubspotWritten: false, apolloSpent: 0, accountCreated: false } });
    expect(prisma.account.create).not.toHaveBeenCalled();
    expect(d.sync).toHaveBeenCalledWith({ accountNames: ['PepsiCo'], personaIds: [7000] });
  });
  it('a contact NOT associated with the account company is refused: the company field never decides', async () => {
    const { prisma, created, audit } = db({ accounts: [PEPSI] });
    const r = await importHubSpotContactToAccount(prisma, { accountName: 'PepsiCo', hubspotContactId: ISAAC.id, actor: 'c', now: NOW }, deps(reads({ [ISAAC.id]: ISAAC }, { [ISAAC.id]: ['99'] })));
    expect(r).toMatchObject({ ok: false, reason: 'contact_not_associated' });
    expect(!r.ok && r.detail).toMatch(/associated with company 99, not with PepsiCo \(56630459299\)/);
    expect(created).toEqual([]);
    expect(audit).toEqual([]);
  });
  it('an unknown GAP account, an unlinked account, an unknown contact: refused, nothing created', async () => {
    const { prisma, created } = db({ accounts: [PEPSI, { name: 'Loose', hubspot_company_id: null, parent_brand: null }] });
    const d = deps(reads({ [ISAAC.id]: ISAAC }, { [ISAAC.id]: ['56630459299'] }));
    expect(await importHubSpotContactToAccount(prisma, { accountName: 'Frito-Lay', hubspotContactId: ISAAC.id, actor: 'c', now: NOW }, d)).toMatchObject({ ok: false, reason: 'account_not_found' });
    expect(await importHubSpotContactToAccount(prisma, { accountName: 'Loose', hubspotContactId: ISAAC.id, actor: 'c', now: NOW }, d)).toMatchObject({ ok: false, reason: 'account_not_linked' });
    expect(await importHubSpotContactToAccount(prisma, { accountName: 'PepsiCo', hubspotContactId: '1', actor: 'c', now: NOW }, d)).toMatchObject({ ok: false, reason: 'contact_not_found' });
    expect(created).toEqual([]);
    expect(prisma.account.create).not.toHaveBeenCalled();
  });
});

describe('dedupe by HubSpot id and email: link, never duplicate; idempotent', () => {
  it('an existing persona at the account with the HubSpot id is `already`; one without it is `linked`', async () => {
    const { prisma, created, updates } = db({ accounts: [PEPSI], personas: [{ id: 5, account_name: 'PepsiCo', name: 'Isaac Scott', title: null, email: 'isaac.scott@pepsico.com', hubspot_contact_id: null }] });
    const d = deps(reads({ [ISAAC.id]: ISAAC }, { [ISAAC.id]: ['56630459299'] }));
    const first = await importHubSpotContactToAccount(prisma, { accountName: 'PepsiCo', hubspotContactId: ISAAC.id, actor: 'c', now: NOW }, d);
    expect(first).toMatchObject({ ok: true, status: 'linked', personaId: 5, title: 'Sr Director of Transportation - Frito-Lay' });
    expect(updates[0].data).toMatchObject({ hubspot_contact_id: ISAAC.id, title: 'Sr Director of Transportation - Frito-Lay' });
    const second = await importHubSpotContactToAccount(prisma, { accountName: 'PepsiCo', hubspotContactId: ISAAC.id, actor: 'c', now: NOW }, d);
    expect(second).toMatchObject({ ok: true, status: 'already', personaId: 5 });
    expect(created).toEqual([]);
  });
  it('a persona at a corporate-family account with no history there is re-homed, audited, with the legacy flags left alone and said', async () => {
    const { prisma, created, updates, audit } = db({ accounts: [PEPSI, FRITO], personas: [{ id: 13, account_name: 'Frito-Lay', name: 'Dr. Isaac Scott', title: 'National Senior Director Transportation at PepsiCo (Frito-Lay)', email: 'isaac.scott@pepsico.com', hubspot_contact_id: ISAAC.id, do_not_contact: true, email_status: 'bounced' }] });
    const d = deps(reads({ [ISAAC.id]: ISAAC }, { [ISAAC.id]: ['56630459299'] }));
    const r = await importHubSpotContactToAccount(prisma, { accountName: 'PepsiCo', hubspotContactId: ISAAC.id, actor: 'c', now: NOW }, d);
    expect(r).toMatchObject({ ok: true, status: 'rehomed', personaId: 13, from: 'Frito-Lay', accountName: 'PepsiCo' });
    expect(r.ok && r.notes).toEqual(['Moved from the Frito-Lay account (a PepsiCo family account) with no history there.', 'The GAP record carries do not contact (left as it is: review it deliberately).', "The GAP record's email status is bounced (left as it is)."]);
    expect(updates[0]).toMatchObject({ where: { id: 13 }, data: { account_name: 'PepsiCo' } });
    expect(updates[0].data).not.toHaveProperty('do_not_contact');
    expect(updates[0].data).not.toHaveProperty('email_status');
    expect(audit[0].payload).toMatchObject({ status: 'rehomed', from: 'Frito-Lay', accountName: 'PepsiCo', matchedBy: 'hubspot_contact_id' });
    expect(created).toEqual([]);
    expect(d.sync).toHaveBeenCalledWith({ accountNames: ['PepsiCo', 'Frito-Lay'], personaIds: [13] });
  });
  it('a family persona WITH history at the old account is refused: history is never rewritten', async () => {
    const { prisma, updates } = db({ accounts: [PEPSI, FRITO], personas: [{ id: 13, account_name: 'Frito-Lay', name: 'Dr. Isaac Scott', email: 'isaac.scott@pepsico.com', hubspot_contact_id: ISAAC.id }], history: { 13: 2 } });
    const r = await importHubSpotContactToAccount(prisma, { accountName: 'PepsiCo', hubspotContactId: ISAAC.id, actor: 'c', now: NOW }, deps(reads({ [ISAAC.id]: ISAAC }, { [ISAAC.id]: ['56630459299'] })));
    expect(r).toMatchObject({ ok: false, reason: 'persona_at_other_account' });
    expect(!r.ok && r.detail).toMatch(/history there \(2 hypotheses as the primary person\)/);
    expect(updates).toEqual([]);
  });
  it('a persona at an unrelated account (matched by email) is refused, never moved, never duplicated', async () => {
    const { prisma, updates, created } = db({ accounts: [PEPSI, { name: 'Other Co', hubspot_company_id: '1', parent_brand: null }], personas: [{ id: 2, account_name: 'Other Co', name: 'Isaac Scott', email: 'isaac.scott@pepsico.com', hubspot_contact_id: null }] });
    const r = await importHubSpotContactToAccount(prisma, { accountName: 'PepsiCo', hubspotContactId: ISAAC.id, actor: 'c', now: NOW }, deps(reads({ [ISAAC.id]: ISAAC }, { [ISAAC.id]: ['56630459299'] })));
    expect(r).toMatchObject({ ok: false, reason: 'persona_at_other_account' });
    expect(!r.ok && r.detail).toMatch(/not in PepsiCo's corporate family/);
    expect(updates).toEqual([]);
    expect(created).toEqual([]);
  });
});

describe('boundaries the code itself keeps', () => {
  it('the module never imports Apollo or a HubSpot write, and never creates an account', () => {
    const src = readFileSync('src/lib/gap/people/account-import.ts', 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    // Imports and calls only (the audit payload records apolloSpent: 0 on purpose).
    expect(code).not.toMatch(/from ['"][^'"]*apollo|apollo-(client|enrichment)|enrichPersona|searchApollo|apolloPolicy|people\/match/i);
    expect(code).not.toMatch(/account\.create|upsertContact|updateContact|basicApi\.(create|update)|batchApi\.(create|update)/);
  });
  it('an opted-out contact is added as do not contact, with the note', async () => {
    const { prisma, created } = db({ accounts: [PEPSI] });
    const c = { ...ISAAC, properties: { ...ISAAC.properties, hs_email_optout: 'true' } };
    const r = await importHubSpotContactToAccount(prisma, { accountName: 'PepsiCo', hubspotContactId: ISAAC.id, actor: 'c', now: NOW }, deps(reads({ [ISAAC.id]: c }, { [ISAAC.id]: ['56630459299'] })));
    expect(r.ok && r.notes[0]).toMatch(/Opted out of email in HubSpot/);
    expect(created[0]).toMatchObject({ do_not_contact: true, is_contact_ready: false });
  });
});
