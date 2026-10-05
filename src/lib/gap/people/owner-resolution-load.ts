/**
 * OWNER RESOLUTION: the loader (owner resolution, 2026-10-05). Gathers what the pure resolver (owner-resolution.ts)
 * reads, from the stores GAP already has, in this order and never beyond it:
 *
 *   1. existing GAP personas at the account (with their contact currentness)
 *   2. ALL associated HubSpot contacts (the linked company, else the account identity; capped, deduplicated)
 *   3. staged AccountContactCandidates
 *   4. relationships (work-source members) and the hypothesis context
 *
 * No Apollo call, no web research, no write. The HubSpot read is the one hubspot-people.ts read (cached 15 minutes).
 * House `prisma: any` glue.
 */
import { typeFromVertical } from '../account-intel/build';
import type { EntityType } from '../entity/fit';
import { resolveAccountHubSpotCompanies, type AccountCompanyDeps } from './account-company';
import { loadEmployment, type HubSpotEmploymentProps } from './employment-store';
import { loadHubSpotPeopleForCompanies, type HubSpotPeopleReads, type HubSpotPerson } from './hubspot-people';
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
  /** Tests: a smaller cap. */
  cap?: number;
}

export type LoadOwnerResolutionResult =
  | { ok: true; resolution: OwnerResolution; hubspot: { companyIds: string[]; via: string; detail: string }; people: HubSpotPerson[] }
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

  const companies = await resolveAccountHubSpotCompanies(prisma, account.name, deps.company);
  const [personas, aliases, candidates, members, hs] = await Promise.all([
    prisma.persona.findMany({ where: { account_name: account.name }, select: { id: true, name: true, title: true, email: true, do_not_contact: true, email_status: true, hubspot_contact_id: true } }) as Promise<Row[]>,
    (prisma.gapAccountAlias?.findMany ? prisma.gapAccountAlias.findMany({ where: { account_name: account.name }, select: { alias: true } }).catch(() => []) : Promise.resolve([])) as Promise<Row[]>,
    (prisma.accountContactCandidate?.findMany ? prisma.accountContactCandidate.findMany({ where: { account_name: account.name, state: 'staged' }, select: { id: true, full_name: true, title: true, email: true }, take: 30 }).catch(() => []) : Promise.resolve([])) as Promise<Row[]>,
    (prisma.gapWorkSourceMember?.findMany ? prisma.gapWorkSourceMember.findMany({ where: { account_name: account.name, status: { notIn: ['ignored', 'not_now'] } }, select: { id: true, name: true, kind: true, title: true, persona_id: true, relationship_context: true, work_source: { select: { name: true, source_type: true } } }, take: 30 }).catch(() => []) : Promise.resolve([])) as Promise<Row[]>,
    companies.ids.length ? loadHubSpotPeopleForCompanies(companies.ids, deps.hubspotPeople, deps.cap ?? 1000, input.now.getTime()) : Promise.resolve(null),
  ]);
  const hsPeople = hs?.people ?? [];
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
  const aliasList = [...new Set([...(aliases as Row[]).map((a) => String(a.alias)), ...(account.parent_brand ? [account.parent_brand] : [])])];
  const employment = await loadEmployment(prisma, personas.map((p) => p.id as number), { now: input.now, hubspot: hsProps, aliasesFor: () => aliasList });

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
      // A HubSpot-only person: the CRM is the only claim (unverified), unless Apollo's sweep says they moved.
      employment: null,
    })),
    ...candidates.map((c): OwnerCandidateInput => ({ key: `staged:${c.id}`, source: 'staged', name: String(c.full_name ?? ''), title: c.title ?? null, hasEmail: !!c.email })),
    ...members.filter((m) => m.kind === 'person' && typeof m.persona_id !== 'number' && m.name).map((m): OwnerCandidateInput => ({ key: `member:${m.id}`, source: 'relationship', name: String(m.name), title: m.title ?? null, hasEmail: false, relationship: m.relationship_context ?? `from ${m.work_source?.name ?? 'a source'}` })),
  ];

  const resolution = resolveOwner({
    account: { name: account.name, entityType: input.entityType ?? typeFromVertical(account.vertical), aliases: aliasList },
    purpose: input.purpose,
    hypothesis: hypothesis ? { id: hypothesis.id, status: hypothesis.status, primaryPersonaId: hypothesis.primary_persona_id ?? null, observation: hypothesis.observation ?? '', problemHypothesis: hypothesis.problem_hypothesis ?? null, problemFamily: hypothesis.problem_family ?? null } : null,
    candidates: inputs,
    hubspot: { read: !!hs, count: hsPeople.length, truncated: !!hs?.truncated, via: companies.ids.length ? (hs ? companies.via : 'unreadable') : companies.via === 'unreadable' ? 'unreadable' : 'none' },
    now: input.now,
  });
  void iso;
  return { ok: true, resolution, hubspot: { companyIds: companies.ids, via: companies.via, detail: companies.detail }, people: hsPeople };
}
