/**
 * ACCOUNT-SCOPED HUBSPOT IMPORT (owner resolution, 2026-10-05). Casey's click on ADD TO GAP / ADD + USE authorizes
 * linking ONE existing HubSpot contact into ONE named GAP account. It is not the generic intake (contacts/actions.ts
 * importHubSpotContactInternal, external-contact-import.ts), which resolves an account from the contact's company
 * field and CREATES one when nothing matches: that path would manufacture "Frito-Lay" or "fedex.com" as a new GAP
 * account from a source field. This one:
 *
 *   - asserts the HubSpot contact is associated with the account's HubSpot company (the linked one, or the account
 *     identity's companies: the same rule deal truth uses)
 *   - asserts the requested GAP account exists and NEVER creates one
 *   - matches an existing Persona by HubSpot id, then by email, and LINKS rather than duplicates; a persona already
 *     at a corporate-family account (a PepsiCo subsidiary row) with no history there is re-homed, audited, else refused
 *   - NEVER writes HubSpot, NEVER calls Apollo, is idempotent (a second click reports `already`)
 *   - records one audit row (person.imported_from_hubspot)
 *
 * Reads only toward HubSpot. House `prisma: any` glue.
 */
import { getHubSpotClient, withHubSpotRetry } from '@/lib/hubspot/client';
import { normalizeName, normalizeTitle, parseDomainFromEmail, scoreContactQuality, splitName } from '@/lib/contact-standard';
import { isBlockedRecipientDomain } from '@/lib/contacts/blocked-domains';
import { loadCorporateFamily, sameCompany } from '../family/family';
import { resolveAccountHubSpotCompanies, type AccountCompanyDeps } from './account-company';
import { entityBoundaryFor } from './entity-boundary';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const IMPORTED_FROM_HUBSPOT = 'person.imported_from_hubspot' as const;

export interface HubSpotContactRead {
  id: string;
  properties: Record<string, string | null | undefined>;
}

/** The two READS the import needs: the contact, and the companies it is associated with. Injected; the SDK by default. */
export interface AccountImportReads {
  readContact(id: string): Promise<HubSpotContactRead | null>;
  companyIdsForContact(id: string): Promise<string[]>;
}

const CONTACT_PROPS = ['firstname', 'lastname', 'jobtitle', 'email', 'phone', 'city', 'state', 'country', 'company', 'hs_email_optout', 'hs_linkedin_url', 'linkedin_url'];

export const hubspotAccountImportReads: AccountImportReads = {
  async readContact(id) {
    const client = getHubSpotClient();
    try {
      const r = await withHubSpotRetry(() => client.crm.contacts.basicApi.getById(id, CONTACT_PROPS), `gap-import contact read (${id})`);
      return r ? { id: String(r.id), properties: (r.properties ?? {}) as Record<string, string | null> } : null;
    } catch (e) {
      if ((e as { code?: number }).code === 404) return null;
      throw e;
    }
  },
  async companyIdsForContact(id) {
    const client = getHubSpotClient();
    const out: string[] = [];
    let after: string | undefined;
    do {
      const page = (await withHubSpotRetry(() => client.crm.associations.v4.basicApi.getPage('contacts', id, 'companies', after, 500), `gap-import contact companies (${id})`)) as { results?: Array<{ toObjectId: string | number }>; paging?: { next?: { after?: string } } };
      for (const r of page.results ?? []) out.push(String(r.toObjectId));
      after = page.paging?.next?.after;
    } while (after);
    return out;
  },
};

export type AccountImportStatus = 'created' | 'linked' | 'already' | 'rehomed';

export type AccountImportResult =
  | { ok: true; status: AccountImportStatus; personaId: number; accountName: string; name: string; title: string | null; hasEmail: boolean; from?: string; auditId: string; notes: string[] }
  | { ok: false; reason: 'account_not_found' | 'account_not_linked' | 'contact_not_found' | 'contact_not_associated' | 'blocked_domain' | 'contact_opted_out' | 'persona_at_other_account' | 'no_email_and_no_id' | 'hubspot_unreadable'; detail?: string };

export interface AccountImportInput {
  accountName: string;
  hubspotContactId: string;
  actor: string;
  now: Date;
  /**
   * The verified family company the person was READ from (owner resolution's family read, 2026-10-05): the contact
   * may be associated with that company instead of the account's own. Accepted only when the id is the linked
   * HubSpot company of a verified corporate-family member that is not a divested unit; recorded in the audit.
   */
  familyCompanyId?: string | null;
}

export interface AccountImportDeps {
  reads?: AccountImportReads;
  company?: AccountCompanyDeps;
  /** Canonical sync after the write (revops/canonical-sync.ts); injected so tests never touch it. */
  sync?: (scope: { accountNames: string[]; personaIds: number[] }) => Promise<unknown>;
}

const clean = (v: string | null | undefined) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const cleanEmail = (v: string | null | undefined) => {
  const e = clean(v)?.toLowerCase() ?? null;
  return e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
};

/** Is `other` in the same corporate family as `account` (a parent / subsidiary by parent_brand, or the same company)? */
async function sameFamily(prisma: PrismaLike, account: { name: string; parent_brand: string | null }, other: string): Promise<boolean> {
  if (sameCompany(account.name, other)) return true;
  if (account.parent_brand && sameCompany(account.parent_brand, other)) return true;
  const row: { parent_brand: string | null } | null = await prisma.account.findUnique({ where: { name: other }, select: { parent_brand: true } });
  if (row?.parent_brand && (sameCompany(row.parent_brand, account.name) || (account.parent_brand && sameCompany(row.parent_brand, account.parent_brand)))) return true;
  return false;
}

/** Any history that ties this persona to its current account: a thesis, a buyer answer, buyer truth, an enrollment, a GAP send or draft. */
async function historyAt(prisma: PrismaLike, personaId: number): Promise<string[]> {
  const out: string[] = [];
  const count = async (label: string, fn: () => Promise<number>) => {
    try {
      const n = await fn();
      if (n > 0) out.push(`${n} ${label}`);
    } catch {
      out.push(`${label} (unreadable)`);
    }
  };
  await count('hypotheses as the primary person', () => prisma.prospectingHypothesis.count({ where: { primary_persona_id: personaId } }));
  await count('confirmed buyer answers', () => prisma.conversationDisposition.count({ where: { persona_id: personaId, human_confirmed: true } }));
  await count('buyer truth rows', () => prisma.buyerInputData.count({ where: { persona_id: personaId } }));
  await count('sequence enrollments', () => prisma.sequenceEnrollment.count({ where: { persona_id: personaId } }));
  await count('GAP send or draft ledger rows', () => prisma.gapAuditEvent.count({ where: { subject_type: 'routing_decision', kind: { startsWith: 'execution.gmail_' }, payload: { path: ['personaId'], equals: personaId } } }));
  return out;
}

export async function importHubSpotContactToAccount(prisma: PrismaLike, input: AccountImportInput, deps: AccountImportDeps = {}): Promise<AccountImportResult> {
  const reads = deps.reads ?? hubspotAccountImportReads;
  const id = String(input.hubspotContactId ?? '').trim();
  if (!id) return { ok: false, reason: 'contact_not_found' };
  const account: { name: string; hubspot_company_id: string | null; parent_brand: string | null } | null = await prisma.account.findUnique({ where: { name: input.accountName }, select: { name: true, hubspot_company_id: true, parent_brand: true } });
  if (!account) return { ok: false, reason: 'account_not_found' };

  // The account's HubSpot companies, by the one identity rule; the contact must be associated with one of them.
  const companies = await resolveAccountHubSpotCompanies(prisma, account.name, deps.company);
  if (!companies.ids.length) return { ok: false, reason: 'account_not_linked', detail: companies.detail };
  let contact: HubSpotContactRead | null;
  let associated: string[];
  try {
    contact = await reads.readContact(id);
    if (!contact) return { ok: false, reason: 'contact_not_found' };
    associated = await reads.companyIdsForContact(id);
  } catch (e) {
    return { ok: false, reason: 'hubspot_unreadable', detail: e instanceof Error ? e.message : String(e) };
  }
  const notes: string[] = [];
  // A verified family company (the owner panel read the person there): accepted only when it is the linked company
  // of a corporate-family member that is not divested; never a guess from the contact's own company field.
  const familyId = String(input.familyCompanyId ?? '').trim();
  let viaFamily: { accountName: string; companyId: string } | null = null;
  if (familyId && !companies.ids.includes(familyId)) {
    const family = await loadCorporateFamily(prisma, account.name).catch(() => ({ accountName: account.name, parentName: null, members: [] as Array<{ accountName: string; relation: string }> }));
    for (const m of family.members) {
      if (entityBoundaryFor(account.name, { company: m.accountName })?.status === 'divested') continue;
      const row: { hubspot_company_id: string | null } | null = await prisma.account.findUnique({ where: { name: m.accountName }, select: { hubspot_company_id: true } }).catch(() => null);
      if (String(row?.hubspot_company_id ?? '').trim() === familyId) {
        viaFamily = { accountName: m.accountName, companyId: familyId };
        break;
      }
    }
  }
  const accepted = viaFamily ? [...companies.ids, viaFamily.companyId] : companies.ids;
  const match = associated.filter((c) => accepted.includes(c));
  if (!match.length) return { ok: false, reason: 'contact_not_associated', detail: `HubSpot contact ${id} is associated with ${associated.length ? `compan${associated.length === 1 ? 'y' : 'ies'} ${associated.join(', ')}` : 'no company'}, not with ${account.name} (${companies.ids.join(', ')})${familyId && !viaFamily ? `; ${familyId} is not a verified family company of ${account.name}` : ''}.` };
  if (viaFamily) notes.push(`Read from the ${viaFamily.accountName} record (a ${account.name} family company) and linked into ${account.name} at your click.`);

  const p = contact.properties;
  const email = cleanEmail(p.email);
  if (email && isBlockedRecipientDomain(email)) return { ok: false, reason: 'blocked_domain' };
  const firstName = clean(p.firstname);
  const lastName = clean(p.lastname);
  const name = [firstName, lastName].filter(Boolean).join(' ') || email || `HubSpot contact ${id}`;
  const title = clean(p.jobtitle);
  const optedOut = String(p.hs_email_optout ?? '').toLowerCase() === 'true';
  const linkedin = clean(p.hs_linkedin_url) ?? clean(p.linkedin_url);
  // Match an existing persona: by HubSpot id first (an explicit link), then by email at this account (a legacy
  // duplicate that is do-not-contact or bounced never wins over the live row), then anywhere.
  const byId: Row | null = await prisma.persona.findFirst({ where: { hubspot_contact_id: id }, select: PERSONA_SELECT });
  const byEmailHere: Row | null = !byId && email ? await prisma.persona.findFirst({ where: { account_name: account.name, email: { equals: email, mode: 'insensitive' } }, select: PERSONA_SELECT, orderBy: [{ do_not_contact: 'asc' }, { updated_at: 'desc' }] }) : null;
  const byEmailAnywhere: Row | null = !byId && !byEmailHere && email ? await prisma.persona.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: PERSONA_SELECT, orderBy: { id: 'asc' } }) : null;
  const existing = byId ?? byEmailHere ?? byEmailAnywhere;
  const matchedBy = byId ? 'hubspot_contact_id' : byEmailHere ? 'email at the account' : byEmailAnywhere ? 'email at another account' : null;
  // An opted-out contact is never imported or linked by this action: the unsubscribe helper is the only writer of
  // do_not_contact, and owner resolution already sets an opted-out HubSpot person aside with the reason. A contact
  // that is ALREADY this account's linked GAP contact still answers `already` (the second click stays idempotent),
  // with the opt-out noted.
  const alreadyLinkedHere = !!existing && existing.account_name === account.name && String(existing.hubspot_contact_id ?? '') === id;
  if (optedOut && !alreadyLinkedHere) return { ok: false, reason: 'contact_opted_out', detail: `${name} opted out of email in HubSpot. GAP will not add them as a contact to act on; nothing was written.` };
  if (optedOut) notes.push('Opted out of email in HubSpot since they were linked (left as it is: GAP will not contact them).');

  if (existing) {
    if (existing.account_name !== account.name) {
      const family = await sameFamily(prisma, account, existing.account_name);
      const history = family ? await historyAt(prisma, existing.id) : [];
      if (!family) return { ok: false, reason: 'persona_at_other_account', detail: `${existing.name} is already a GAP contact at ${existing.account_name} (matched by ${matchedBy}), which is not in ${account.name}'s corporate family. Nothing was moved or duplicated.` };
      if (history.length) return { ok: false, reason: 'persona_at_other_account', detail: `${existing.name} is a GAP contact at ${existing.account_name} (a ${account.name} family account) with history there (${history.join(', ')}). Moving them would rewrite that history; nothing was changed.` };
      // Re-home within the family: the same person, now at the account Casey chose; the old row's id is kept.
      const auditId = await prisma.$transaction(async (tx: PrismaLike) => {
        await tx.persona.update({ where: { id: existing.id }, data: { account_name: account.name, ...(existing.hubspot_contact_id ? {} : { hubspot_contact_id: id }), ...(existing.title ? {} : title ? { title, normalized_title: normalizeTitle(title) } : {}), ...(existing.email ? {} : email ? { email } : {}) } });
        return auditRow(tx, input, { personaId: existing.id, hubspotContactId: id, accountName: account.name, status: 'rehomed', matchedBy, from: existing.account_name, companyIds: match });
      });
      await (deps.sync ?? defaultSync)({ accountNames: [account.name, existing.account_name], personaIds: [existing.id] }).catch(() => undefined);
      notes.push(`Moved from the ${existing.account_name} account (a ${account.name} family account) with no history there.`);
      if (existing.hubspot_contact_id && String(existing.hubspot_contact_id) !== id) notes.push(`The GAP record is linked to a different HubSpot contact (${existing.hubspot_contact_id}); the one you clicked (${id}) was not linked over it.`);
      if (existing.do_not_contact) notes.push('The GAP record carries do not contact (left as it is: review it deliberately).');
      if (/bounce|invalid/i.test(String(existing.email_status ?? ''))) notes.push(`The GAP record's email status is ${existing.email_status} (left as it is).`);
      return { ok: true, status: 'rehomed', personaId: existing.id, accountName: account.name, name: existing.name, title: existing.title ?? title, hasEmail: !!(existing.email ?? email), from: existing.account_name, auditId, notes };
    }
    // Already at this account: link the HubSpot id when it is missing, fill what is empty, never overwrite.
    const already = !!existing.hubspot_contact_id;
    const auditId = await prisma.$transaction(async (tx: PrismaLike) => {
      const data: Record<string, unknown> = {};
      if (!existing.hubspot_contact_id) data.hubspot_contact_id = id;
      if (!existing.title && title) Object.assign(data, { title, normalized_title: normalizeTitle(title) });
      if (!existing.email && email) data.email = email;
      if (Object.keys(data).length) await tx.persona.update({ where: { id: existing.id }, data });
      return auditRow(tx, input, { personaId: existing.id, hubspotContactId: id, accountName: account.name, status: already ? 'already' : 'linked', matchedBy, companyIds: match });
    });
    if (!already) await (deps.sync ?? defaultSync)({ accountNames: [account.name], personaIds: [existing.id] }).catch(() => undefined);
    if (existing.hubspot_contact_id && String(existing.hubspot_contact_id) !== id) notes.push(`The GAP record is linked to a different HubSpot contact (${existing.hubspot_contact_id}); the one you clicked (${id}) was not linked over it.`);
    if (existing.do_not_contact) notes.push('The GAP record carries do not contact (left as it is: review it deliberately).');
    return { ok: true, status: already ? 'already' : 'linked', personaId: existing.id, accountName: account.name, name: existing.name, title: existing.title ?? title, hasEmail: !!(existing.email ?? email), auditId, notes };
  }

  if (!email) notes.push('No email in HubSpot: added without one (not contact-ready).');
  const quality = scoreContactQuality({ name: name, title: title ?? undefined, accountName: account.name, email, companyDomain: parseDomainFromEmail(email) ?? null, linkedinUrl: linkedin, sourceEvidenceCount: 2 });
  const { firstName: fn, lastName: ln } = splitName(name);
  const created = await prisma.$transaction(async (tx: PrismaLike) => {
    const persona = await tx.persona.create({
      data: {
        persona_id: `hs-${id}`,
        name,
        first_name: fn || firstName,
        last_name: ln || lastName,
        normalized_name: normalizeName(name) || null,
        title,
        normalized_title: title ? normalizeTitle(title) : null,
        email,
        phone: clean(p.phone),
        company_domain: parseDomainFromEmail(email),
        linkedin_url: linkedin,
        account_name: account.name,
        priority: 'P2',
        seniority: '',
        persona_lane: '',
        role_in_deal: '',
        hubspot_contact_id: id,
        email_valid: !!email,
        email_status: 'unverified',
        email_confidence: quality.emailConfidence,
        linkedin_confidence: quality.linkedinConfidence,
        quality_band: quality.band,
        quality_score: quality.score,
        is_contact_ready: !!email,
        persona_status: 'Not started',
        source_type: 'hubspot',
        source_url: linkedin,
        source_evidence: { source: 'hubspot', sourceContactId: id, via: 'owner_resolution', importedBy: input.actor, companyIds: match, ...(viaFamily ? { viaFamily } : {}) },
        last_enriched_at: input.now,
      },
      select: { id: true },
    });
    const enrichment = await tx.contactEnrichment.upsert({ where: { persona_id: persona.id }, update: { hubspot_contact_id: id, last_enriched_at: input.now }, create: { persona_id: persona.id, hubspot_contact_id: id, last_enriched_at: input.now }, select: { id: true } });
    const fields: Array<[string, string | null]> = [['name', name], ['email', email], ['job_title', title], ['company_name', clean(p.company)], ['company_domain', parseDomainFromEmail(email)], ['phone', clean(p.phone)], ['linkedin_url', linkedin]];
    for (const [field_name, field_value] of fields) {
      if (!field_value) continue;
      await tx.contactEnrichmentField.upsert({
        where: { contact_enrichment_id_field_name: { contact_enrichment_id: enrichment.id, field_name } },
        update: { field_value, source: 'hubspot', source_timestamp: input.now, last_writer: 'owner_resolution_import' },
        create: { contact_enrichment_id: enrichment.id, field_name, field_value, source: 'hubspot', source_timestamp: input.now, last_writer: 'owner_resolution_import' },
      });
    }
    const auditId = await auditRow(tx, input, { personaId: persona.id, hubspotContactId: id, accountName: account.name, status: 'created', matchedBy: null, companyIds: match, ...(viaFamily ? { viaFamily } : {}) });
    return { personaId: persona.id as number, auditId };
  });
  await (deps.sync ?? defaultSync)({ accountNames: [account.name], personaIds: [created.personaId] }).catch(() => undefined);
  return { ok: true, status: 'created', personaId: created.personaId, accountName: account.name, name, title, hasEmail: !!email, auditId: created.auditId, notes };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
const PERSONA_SELECT = { id: true, account_name: true, name: true, title: true, email: true, email_status: true, do_not_contact: true, hubspot_contact_id: true } as const;

async function auditRow(tx: PrismaLike, input: AccountImportInput, payload: { personaId: number; hubspotContactId: string; accountName: string; status: AccountImportStatus; matchedBy: string | null; from?: string; companyIds: string[]; viaFamily?: { accountName: string; companyId: string } }): Promise<string> {
  const row = await tx.gapAuditEvent.create({
    data: { kind: IMPORTED_FROM_HUBSPOT, actor: input.actor, subject_type: 'persona', subject_id: String(payload.personaId), payload: { ...payload, at: input.now.toISOString(), hubspotWritten: false, apolloSpent: 0, accountCreated: false } },
    select: { id: true },
  });
  return row.id as string;
}

async function defaultSync(scope: { accountNames: string[]; personaIds: number[] }): Promise<unknown> {
  const { syncCanonicalRecords } = await import('@/lib/revops/canonical-sync');
  return syncCanonicalRecords(scope);
}
