/**
 * OWNER RESOLUTION: the loader (owner resolution, 2026-10-05). Gathers what the pure resolver (owner-resolution.ts)
 * reads, from the stores GAP already has, in this order and never beyond it:
 *
 *   1. existing GAP personas at the account (with their contact currentness)
 *   2. ALL associated HubSpot contacts: the account's own company (the linked company, else the account identity)
 *      PLUS its verified corporate family's linked companies (family-people.ts: parent_brand and HubSpot hierarchy
 *      only, each member through its own linked company id, a divested unit never, capped, deduplicated by contact
 *      id and by email, every person carrying where they were read)
 *   3. staged AccountContactCandidates
 *   4. relationships (work-source members) and the hypothesis context
 *
 * It also proposes POSSIBLE ACCOUNT ALIASES (alias-review.ts) from the employment conflicts it read: a CRM or provider
 * spelling that is not the account's, for Casey to confirm or reject; never an alias by itself.
 *
 * No Apollo call, no web research, no write. The HubSpot read is the one hubspot-people.ts read (cached 15 minutes).
 * House `prisma: any` glue.
 */
import { typeFromVertical } from '../account-intel/build';
import type { EntityType } from '../entity/fit';
import type { AccountCompanyDeps } from './account-company';
import { loadRejectedAliases, proposeAliases, type AliasConflictEvidence, type AliasProposal } from './alias-review';
import { apolloEvidence, crmEvidence, type EmploymentEvidence } from './employment';
import { accountEmploymentContext, loadEmployment, loadHubSpotContactRoleEvidence, personaRole, readHubSpotOnlyEmployment, type HubSpotEmploymentProps } from './employment-store';
import { loadFamilyPeople, type FamilyPeopleDeps, type FamilyPeopleRead } from './family-people';
import { readRole, ROLE_LABEL, type RoleRead } from './role-currentness';
import type { HubSpotPeopleReads, HubSpotPerson } from './hubspot-people';
import { resolveOwner, type OwnerCandidateInput, type OwnerPurpose, type OwnerResolution } from './owner-resolution';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export interface LoadOwnerResolutionInput {
  accountName: string;
  purpose: OwnerPurpose;
  hypothesisId?: string | null;
  now: Date;
  /**
   * Read-only dogfood override of the account kind (the row's vertical is the truth the UI reads; many carrier and
   * 3PL rows still carry "Unknown"). The routes never pass it; the dogfood script does, to show the carrier doctrine.
   */
  entityType?: EntityType | null;
}

export interface LoadOwnerResolutionDeps {
  hubspotPeople?: HubSpotPeopleReads;
  company?: AccountCompanyDeps;
  /** Tests: a smaller cap (the total across the account and its family). */
  cap?: number;
  /** The corporate-family read (HubSpot parent / child hierarchy); tests pass none. */
  family?: FamilyPeopleDeps['family'];
}

/** What the family read did, for the resolver's checked line and the dogfood receipt. */
export interface FamilySummary {
  companies: number;
  count: number;
  capHit: boolean;
  searched: string[];
  excluded: string[];
  dedupe: { byId: number; byEmail: number };
}

export type LoadOwnerResolutionResult =
  | { ok: true; resolution: OwnerResolution; hubspot: { companyIds: string[]; via: string; detail: string }; people: HubSpotPerson[]; family: FamilySummary; aliasProposals: AliasProposal[] }
  | { ok: false; reason: 'account_not_found' | 'hypothesis_not_found' | 'hypothesis_not_at_account' };

const iso = (d: unknown): string | null => (d instanceof Date || typeof d === 'string' ? (Number.isNaN(new Date(d).getTime()) ? null : new Date(d).toISOString()) : null);

export async function loadOwnerResolution(prisma: PrismaLike, input: LoadOwnerResolutionInput, deps: LoadOwnerResolutionDeps = {}): Promise<LoadOwnerResolutionResult> {
  const account: { name: string; vertical: string | null; hubspot_company_id: string | null; parent_brand: string | null } | null = await prisma.account.findUnique({
    where: { name: input.accountName },
    select: { name: true, vertical: true, hubspot_company_id: true, parent_brand: true },
  });
  if (!account) return { ok: false, reason: 'account_not_found' };

  let hypothesis: Row | null = null;
  if (input.hypothesisId) {
    hypothesis = await prisma.prospectingHypothesis.findUnique({ where: { id: input.hypothesisId }, select: { id: true, account_name: true, status: true, primary_persona_id: true, observation: true, problem_hypothesis: true, problem_family: true, persona: true } });
    if (!hypothesis) return { ok: false, reason: 'hypothesis_not_found' };
    if (hypothesis.account_name !== account.name) return { ok: false, reason: 'hypothesis_not_at_account' };
  }

  const [personas, aliases, candidates, members, fam] = await Promise.all([
    prisma.persona.findMany({ where: { account_name: account.name }, select: { id: true, name: true, title: true, email: true, do_not_contact: true, email_status: true, hubspot_contact_id: true } }) as Promise<Row[]>,
    (prisma.gapAccountAlias?.findMany ? prisma.gapAccountAlias.findMany({ where: { account_name: account.name }, select: { alias: true } }).catch(() => []) : Promise.resolve([])) as Promise<Row[]>,
    (prisma.accountContactCandidate?.findMany ? prisma.accountContactCandidate.findMany({ where: { account_name: account.name, state: 'staged' }, select: { id: true, full_name: true, title: true, email: true }, take: 30 }).catch(() => []) : Promise.resolve([])) as Promise<Row[]>,
    (prisma.gapWorkSourceMember?.findMany ? prisma.gapWorkSourceMember.findMany({ where: { account_name: account.name, status: { notIn: ['ignored', 'not_now'] } }, select: { id: true, name: true, kind: true, title: true, persona_id: true, relationship_context: true, work_source: { select: { name: true, source_type: true } } }, take: 30 }).catch(() => []) : Promise.resolve([])) as Promise<Row[]>,
    loadFamilyPeople(prisma, account.name, input.now, { hubspotPeople: deps.hubspotPeople, company: deps.company, family: deps.family, caps: deps.cap ? { total: deps.cap, perCompany: deps.cap } : undefined }),
  ]);
  const companies = { ids: fam.primary.companyIds, via: fam.primary.via, detail: familyDetail(fam) };
  const hs = fam.read ? { people: fam.people, truncated: fam.primary.truncated || fam.capHit } : null;
  const hsPeople = fam.people;
  const hsById = new Map(hsPeople.map((p) => [p.id, p]));
  const linked = new Map<string, number>();
  for (const p of personas) if (p.hubspot_contact_id) linked.set(String(p.hubspot_contact_id), p.id);
  const memberByPersona = new Map<number, Row>();
  for (const m of members) if (typeof m.persona_id === 'number') memberByPersona.set(m.persona_id, m);

  // Unsubscribes are the recipient's own decision: read directly, never only the do_not_contact mirror.
  const emails = personas.map((p) => String(p.email ?? '').trim().toLowerCase()).filter(Boolean);
  const unsub: Row[] = emails.length && prisma.unsubscribedEmail?.findMany ? await prisma.unsubscribedEmail.findMany({ where: { email: { in: emails } }, select: { email: true } }).catch(() => []) : [];
  const unsubscribed = new Set(unsub.map((u) => String(u.email).toLowerCase()));

  // Contact currentness for every GAP persona, with the live HubSpot properties where the person is linked.
  const hsProps = new Map<string, HubSpotEmploymentProps>();
  for (const p of hsPeople) hsProps.set(p.id, { company: p.company ?? null, title: p.title, email: null, lastModifiedAt: p.lastModifiedAt ?? null, apolloEmploymentStatus: p.apolloEmploymentStatus ?? null, apolloVerifiedAt: p.apolloVerifiedAt ?? null });
  // The account's own names and domains (the same context the decision-time gate reads, so the two never disagree).
  const ctx = await accountEmploymentContext(prisma, account.name).catch(() => ({ aliases: [] as string[], domains: [] as string[] }));
  const aliasList = [...new Set([...(aliases as Row[]).map((a) => String(a.alias)), ...(account.parent_brand ? [account.parent_brand] : []), ...ctx.aliases])];
  const employment = await loadEmployment(prisma, personas.map((p) => p.id as number), { now: input.now, hubspot: hsProps, aliasesFor: () => aliasList, domainsFor: () => ctx.domains });
  // ROLE currentness evidence recorded against a HubSpot contact id (VERIFY CURRENT ROLE on a HubSpot-only person, or
  // on a person before they became a GAP contact): one batch read of the audit rows, keyed by contact id.
  const contactIds = [...new Set([...hsPeople.map((h) => h.id), ...personas.map((p) => (p.hubspot_contact_id ? String(p.hubspot_contact_id) : '')).filter(Boolean)])];
  const roleEvidence = contactIds.length ? await loadHubSpotContactRoleEvidence(prisma, contactIds).catch(() => new Map<string, EmploymentEvidence[]>()) : new Map<string, EmploymentEvidence[]>();
  const asInput = (r: RoleRead): NonNullable<OwnerCandidateInput['role']> => ({ state: r.state, label: ROLE_LABEL[r.state], why: r.why, effectiveTitle: r.effectiveTitle, priorTitle: r.priorTitle, usableForRanking: r.usableForRanking });
  const roleOf = (storedTitle: string | null, evidence: readonly EmploymentEvidence[], crmTitle: string | null) => asInput(readRole({ accountName: account.name, aliases: aliasList, domains: ctx.domains, storedTitle, crmTitle, evidence, now: input.now }));

  const bounced = (s: unknown) => /bounce|invalid/i.test(String(s ?? ''));
  const inputs: OwnerCandidateInput[] = [
    ...personas.map((p): OwnerCandidateInput => {
      const h = p.hubspot_contact_id ? hsById.get(String(p.hubspot_contact_id)) : undefined;
      const m = memberByPersona.get(p.id);
      return {
        key: `gap:${p.id}`,
        source: 'gap',
        personaId: p.id,
        hubspotContactId: p.hubspot_contact_id ? String(p.hubspot_contact_id) : null,
        name: String(p.name ?? ''),
        title: p.title ?? h?.title ?? null,
        location: h?.location ?? null,
        company: h?.company ?? null,
        hasEmail: !!String(p.email ?? '').trim(),
        doNotContact: !!p.do_not_contact,
        optedOut: !!h?.optedOut,
        unsubscribed: unsubscribed.has(String(p.email ?? '').trim().toLowerCase()),
        emailBounced: bounced(p.email_status),
        employment: employment.get(p.id) ?? null,
        // The CURRENT role: the record's evidence plus anything verified against the linked HubSpot contact.
        role: (() => {
          const emp = employment.get(p.id);
          if (!emp) return null;
          const extra = p.hubspot_contact_id ? roleEvidence.get(String(p.hubspot_contact_id)) ?? [] : [];
          const storedTitle = p.title ?? h?.title ?? null;
          return extra.length ? roleOf(storedTitle, [...emp.evidence, ...extra], h?.title ?? null) : asInput(personaRole(emp, storedTitle, { now: input.now, aliases: aliasList, domains: ctx.domains }));
        })(),
        relationship: m?.relationship_context ?? null,
      };
    }),
    ...hsPeople.filter((h) => !linked.has(h.id)).map((h): OwnerCandidateInput => ({
      key: `hubspot:${h.id}`,
      source: 'hubspot',
      hubspotContactId: h.id,
      name: h.name,
      title: h.title,
      location: h.location,
      company: h.company ?? null,
      hasEmail: h.hasEmail,
      optedOut: h.optedOut,
      provenance: { accountName: h.provenance.accountName, relation: h.provenance.relation, companyId: h.provenance.companyId, separate: h.provenance.boundary?.note ?? null },
      // The CURRENT role for a HubSpot-only person: the CRM row, Apollo's sweep and any verification recorded against
      // the contact id. With nothing verified the stored title stands, unverified.
      role: roleOf(h.title, [...crmEvidence({ company: h.company ?? null, title: h.title, email: null, lastModifiedAt: h.lastModifiedAt ?? null }), ...apolloEvidence({ status: h.apolloEmploymentStatus ?? null, verifiedAt: h.apolloVerifiedAt ?? null, accountName: account.name, title: h.title }), ...(roleEvidence.get(h.id) ?? [])], h.title),
      // A HubSpot-only person: the CRM company field and Apollo's sweep, read like a persona's (review S3): the CRM
      // alone is unverified; Apollo's moved_out sets them aside; the row's modified date proves nothing.
      employment: readHubSpotOnlyEmployment({ accountName: account.name, aliases: aliasList, domains: ctx.domains, props: hsProps.get(h.id) ?? { company: h.company ?? null, title: h.title, email: null, lastModifiedAt: h.lastModifiedAt ?? null, apolloEmploymentStatus: h.apolloEmploymentStatus ?? null, apolloVerifiedAt: h.apolloVerifiedAt ?? null }, now: input.now }),
    })),
    ...candidates.map((c): OwnerCandidateInput => ({ key: `staged:${c.id}`, source: 'staged', name: String(c.full_name ?? ''), title: c.title ?? null, hasEmail: !!c.email })),
    ...members.filter((m) => m.kind === 'person' && typeof m.persona_id !== 'number' && m.name).map((m): OwnerCandidateInput => ({ key: `member:${m.id}`, source: 'relationship', name: String(m.name), title: m.title ?? null, hasEmail: false, relationship: m.relationship_context ?? `from ${m.work_source?.name ?? 'a source'}` })),
  ];

  const family: FamilySummary = {
    companies: fam.family.length,
    count: fam.people.filter((p) => p.provenance.relation !== 'primary').length,
    capHit: fam.capHit,
    searched: fam.searched,
    excluded: fam.excluded.map((e) => `${e.accountName}: ${e.why}`),
    dedupe: fam.dedupe,
  };
  const resolution = resolveOwner({
    account: { name: account.name, entityType: input.entityType ?? typeFromVertical(account.vertical), aliases: aliasList },
    purpose: input.purpose,
    hypothesis: hypothesis ? { id: hypothesis.id, status: hypothesis.status, primaryPersonaId: hypothesis.primary_persona_id ?? null, observation: hypothesis.observation ?? '', problemHypothesis: hypothesis.problem_hypothesis ?? null, problemFamily: hypothesis.problem_family ?? null } : null,
    candidates: inputs,
    hubspot: { read: !!hs, count: hsPeople.length, truncated: !!hs?.truncated, via: companies.ids.length ? (hs ? companies.via : 'unreadable') : companies.via === 'unreadable' ? 'unreadable' : 'none', family: fam.family.length || fam.excluded.length ? { companies: family.companies, count: family.count, capHit: family.capHit, searched: family.searched, excluded: family.excluded } : null },
    now: input.now,
  });

  // POSSIBLE ACCOUNT ALIASES from the employment conflicts just read: the CRM or provider spelling that is not the
  // account's (a banner, a subsidiary, an acquired company). Casey confirms or rejects; nothing here writes.
  const conflicts: AliasConflictEvidence[] = [];
  for (const ci of inputs) {
    const e = ci.employment;
    if (!e || e.state !== 'EMPLOYMENT_CONFLICT' || !e.elsewhere?.company) continue;
    conflicts.push({ personName: ci.name, company: e.elsewhere.company, source: e.elsewhere.source, at: e.elsewhere.at ?? null });
  }
  const rejected = conflicts.length ? await loadRejectedAliases(prisma, account.name).catch(() => [] as string[]) : [];
  const aliasProposals = conflicts.length ? proposeAliases({ accountName: account.name, aliases: aliasList, domains: ctx.domains, conflicts, rejected }) : [];

  void iso;
  return { ok: true, resolution, hubspot: { companyIds: companies.ids, via: companies.via, detail: companies.detail }, people: hsPeople, family, aliasProposals };
}

/** One sentence on what the HubSpot read covered, for the route's `hubspot.detail` and the dogfood. */
function familyDetail(fam: FamilyPeopleRead): string {
  const primary = fam.primary.via === 'linked' ? `linked HubSpot company ${fam.primary.companyIds.join(', ')}` : fam.primary.via === 'identity' ? `resolved by the account identity: ${fam.primary.companyIds.length} HubSpot ${fam.primary.companyIds.length === 1 ? 'company' : 'companies'}` : fam.primary.via === 'unreadable' ? 'HubSpot could not be read' : 'no HubSpot company resolves (link the HubSpot company on the account)';
  const tail = fam.family.length ? `; family: ${fam.family.map((f) => `${f.accountName} (${f.relation}, ${f.count})`).join(', ')}` : '';
  const ex = fam.excluded.length ? `; not read: ${fam.excluded.map((e) => `${e.accountName} (${e.why})`).join('; ')}` : '';
  return `${primary}${tail}${ex}${fam.capHit ? '; cap hit' : ''}`;
}
