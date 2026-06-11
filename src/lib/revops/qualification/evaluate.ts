/**
 * Qualification EVALUATE pipeline (Tasks 2.1 + 2.2).
 *
 * Three read-only fetchers pull TAM companies + their contacts from HubSpot,
 * then buildDiff runs classifyContact over every pair to produce a VerdictDiff
 * list. evaluateQualification orchestrates the full pipeline.
 *
 * No live calls are made when HubSpot is not configured — all fetchers return [].
 */
import { getHubSpotClient, withHubSpotRetry, isHubSpotConfigured } from '@/lib/hubspot/client';
import { YARDFLOW_ICP_SCORE_PROPERTY } from '@/lib/hubspot/properties';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/companies/models/Filter';
import { classifyContact } from './model';
import type { QualCompany, QualContact, VerdictDiff, EvaluateResult, Verdict } from './types';

// ---------------------------------------------------------------------------
// Contact properties the evaluate pipeline reads
// ---------------------------------------------------------------------------
const CONTACT_READ_PROPS = [
  'email',
  'firstname',
  'lastname',
  'jobtitle',
  'lifecyclestage',
  'hs_seniority',
  'hs_role',
  'yardflow_qual_verdict',
  'intent_score',
  'last_intent_at',
  'last_intent_source',
  'hs_sales_email_last_replied',
  'hs_email_open',
  'hs_email_replied',
  'engagements_last_meeting_booked',
];

// ---------------------------------------------------------------------------
// Task 2.1 — fetchers
// ---------------------------------------------------------------------------

/**
 * Paginate through all companies with yardflow_icp_score >= minScore.
 * Returns QualCompany[] with id, name, icpScore as a number.
 * Returns [] when HubSpot is not configured.
 */
export async function fetchTamCompanies(minScore = 70): Promise<QualCompany[]> {
  if (!isHubSpotConfigured()) return [];

  const client = getHubSpotClient();
  const results: QualCompany[] = [];
  let after: string | undefined = undefined;

  do {
    const page = await withHubSpotRetry(
      () =>
        client.crm.companies.searchApi.doSearch({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: YARDFLOW_ICP_SCORE_PROPERTY,
                  operator: FilterOperatorEnum.Gte,
                  value: String(minScore),
                },
              ],
            },
          ],
          properties: ['name', YARDFLOW_ICP_SCORE_PROPERTY],
          limit: 100,
          after: after ?? '0',
          sorts: [],
        }),
      `fetchTamCompanies(minScore=${minScore})`,
    );

    for (const raw of page.results) {
      const props = (raw as { id: string; properties: Record<string, string | null> }).properties;
      results.push({
        id: (raw as { id: string }).id,
        name: props.name || '',
        icpScore: parseFloat(props[YARDFLOW_ICP_SCORE_PROPERTY] || '0') || 0,
      });
    }

    after = page.paging?.next?.after;
  } while (after);

  return results;
}

/**
 * Return the IDs of all contacts associated with a given company.
 * Uses associations v4 basicApi.getPage('companies', companyId, 'contacts').
 * Returns [] when HubSpot is not configured or the company has no contacts.
 */
export async function fetchAssociatedContactIds(companyId: string): Promise<string[]> {
  if (!isHubSpotConfigured()) return [];

  const client = getHubSpotClient();
  const ids: string[] = [];
  let after: string | undefined = undefined;

  do {
    const page = await withHubSpotRetry(
      () =>
        client.crm.associations.v4.basicApi.getPage(
          'companies',
          companyId,
          'contacts',
          after,
          100,
        ),
      `fetchAssociatedContactIds(${companyId})`,
    );

    for (const item of page.results) {
      // toObjectId may be returned as number or string depending on SDK version — coerce.
      ids.push(String((item as { toObjectId: string | number }).toObjectId));
    }

    after = page.paging?.next?.after;
  } while (after);

  return ids;
}

/**
 * Batch-read contacts by ID (chunks of 100) and map them to QualContact.
 * All string fields default to ''; yardflow_qual_verdict defaults to 'none'.
 * Returns [] when HubSpot is not configured or ids is empty.
 */
export async function readContacts(ids: string[]): Promise<QualContact[]> {
  if (!isHubSpotConfigured() || ids.length === 0) return [];

  const client = getHubSpotClient();
  const contacts: QualContact[] = [];

  // Chunk into batches of 100 (HubSpot batch read limit)
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);

    const batch = await withHubSpotRetry(
      () =>
        client.crm.contacts.batchApi.read({
          inputs: chunk.map((id) => ({ id })),
          properties: CONTACT_READ_PROPS,
          propertiesWithHistory: [],
        }),
      `readContacts(chunk ${i / 100 + 1})`,
    );

    for (const raw of batch.results) {
      const p = (raw as { id: string; properties: Record<string, string | null> }).properties;
      contacts.push({
        id: (raw as { id: string }).id,
        email: p.email || '',
        firstname: p.firstname || '',
        lastname: p.lastname || '',
        jobtitle: p.jobtitle || '',
        lifecyclestage: p.lifecyclestage || '',
        hs_seniority: p.hs_seniority || '',
        hs_role: p.hs_role || '',
        yardflow_qual_verdict: p.yardflow_qual_verdict || 'none',
        intent_score: p.intent_score || '',
        last_intent_at: p.last_intent_at || '',
        last_intent_source: p.last_intent_source || '',
        hs_sales_email_last_replied: p.hs_sales_email_last_replied || '',
        hs_email_open: p.hs_email_open || '',
        hs_email_replied: p.hs_email_replied || '',
        engagements_last_meeting_booked: p.engagements_last_meeting_booked || '',
      });
    }
  }

  return contacts;
}

// ---------------------------------------------------------------------------
// Task 2.2 — buildDiff + evaluateQualification
// ---------------------------------------------------------------------------

const VERDICT_RANK: Record<Verdict, number> = { none: 0, mql: 1, sql: 2 };

/**
 * A contact can be associated with multiple TAM companies, producing multiple rows for the
 * same contactId. The verdict is the MINIMUM tier the contact should hold, so the correct
 * single verdict is the MAX across all its qualifying companies. Collapse to one row per
 * contact, keeping the highest-verdict row (and, on ties, the highest ICP company).
 */
export function dedupeByContact(diff: VerdictDiff[]): VerdictDiff[] {
  const byContact = new Map<string, VerdictDiff>();
  for (const d of diff) {
    const prev = byContact.get(d.contactId);
    if (
      !prev ||
      VERDICT_RANK[d.newVerdict] > VERDICT_RANK[prev.newVerdict] ||
      (VERDICT_RANK[d.newVerdict] === VERDICT_RANK[prev.newVerdict] && d.icpScore > prev.icpScore)
    ) {
      byContact.set(d.contactId, d);
    }
  }
  return [...byContact.values()];
}

export function buildDiff(pairs: { company: QualCompany; contact: QualContact }[]): VerdictDiff[] {
  return pairs.map(({ company, contact }) => {
    const newVerdict = classifyContact(company, contact);
    const currentVerdict = (contact.yardflow_qual_verdict || 'none') as Verdict;
    return {
      contactId: contact.id,
      name: `${contact.firstname} ${contact.lastname}`.trim(),
      email: contact.email,
      companyId: company.id,
      companyName: company.name,
      icpScore: company.icpScore,
      seniority: contact.hs_seniority,
      role: contact.hs_role,
      jobtitle: contact.jobtitle,
      currentLifecycle: contact.lifecyclestage,
      currentVerdict,
      newVerdict,
      changed: newVerdict !== currentVerdict,
      reason: `icp=${company.icpScore} seniority=${contact.hs_seniority || '-'} role=${contact.hs_role || '-'} -> ${newVerdict}`,
    };
  });
}

export async function evaluateQualification(minScore = 70): Promise<EvaluateResult> {
  const evaluatedAt = new Date().toISOString();
  const companies = await fetchTamCompanies(minScore);
  const pairs: { company: QualCompany; contact: QualContact }[] = [];
  const warnings: string[] = [];

  // Per-company isolation: a transient failure on one company must not discard the whole run.
  for (const company of companies) {
    try {
      const ids = await fetchAssociatedContactIds(company.id);
      const contacts = await readContacts(ids);
      for (const contact of contacts) pairs.push({ company, contact });
    } catch (err) {
      warnings.push(
        `company ${company.id} (${company.name}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // Collapse multi-company contacts to one row each (max verdict) before counting/applying.
  const diff = dedupeByContact(buildDiff(pairs));
  const counts: Record<Verdict, number> = { none: 0, mql: 0, sql: 0 };
  for (const d of diff) counts[d.newVerdict] += 1;

  return {
    evaluatedAt,
    companies: companies.length,
    contacts: diff.length,
    counts,
    changes: diff.filter((d) => d.changed).length,
    diff,
    warnings,
  };
}
