/**
 * Incremental qualification evaluation — the daily-cron-sized slice.
 *
 * The full TAM walk (evaluateQualification) covers ~5.6k companies / ~48k contacts and takes
 * ~40 minutes — far past Vercel's 300s function limit. The daily delta is tiny, so the cron
 * runs THIS instead: evaluate only
 *   (a) contacts modified inside the lookback window, resolved to their associated companies
 *       and kept when that company is TAM (`yardflow_tam='in'`), plus
 *   (b) TAM companies modified inside the window (catches newly-TAM-tagged accounts whose
 *       contacts weren't themselves touched), expanded to their contacts.
 *
 * Stateless on purpose: the window is wall-clock (default 26h for a daily schedule — built-in
 * overlap), idempotent (unchanged contacts produce changed=false), no cursor to corrupt.
 * Oversized days (bulk edits) are capped with explicit truncation warnings; a local full run
 * (`scripts/tam/backfill-qualification.mjs`) is the catch-up tool.
 */
import { getHubSpotClient, withHubSpotRetry, isHubSpotConfigured } from '@/lib/hubspot/client';
import { YARDFLOW_ICP_SCORE_PROPERTY } from '@/lib/hubspot/properties';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/companies/models/Filter';
import {
  CONTACT_READ_PROPS,
  readContacts,
  fetchAssociatedContactIds,
  buildDiff,
  dedupeByContact,
} from './evaluate';
import type { QualCompany, QualContact, VerdictDiff, EvaluateResult, Verdict } from './types';

const YARDFLOW_TAM_PROPERTY = 'yardflow_tam';
const TAM_TIER_PROPERTY = 'tam_tier';

// Caps keep the run inside the serverless budget; overflow is reported, never silent.
export const MAX_INCREMENTAL_CONTACTS = 3000;
export const MAX_INCREMENTAL_COMPANIES = 300;
const DEFAULT_SINCE_HOURS = 26;

/** Parse the ?sinceHours= param: default 26 (daily + overlap), clamped to [1, 168]. Pure. */
export function resolveSinceHours(param: string | null): number {
  const n = Number(param);
  if (!param || Number.isNaN(n) || n <= 0) return DEFAULT_SINCE_HOURS;
  return Math.min(168, Math.max(1, Math.floor(n)));
}

function mapContact(raw: { id: string; properties: Record<string, string | null> }): QualContact {
  const p = raw.properties;
  return {
    id: raw.id,
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
  };
}

/** Contacts whose lastmodifieddate >= sinceMs, capped. Returns contacts + whether truncated. */
async function fetchContactsModifiedSince(
  sinceMs: number,
): Promise<{ contacts: QualContact[]; truncated: boolean }> {
  if (!isHubSpotConfigured()) return { contacts: [], truncated: false };
  const client = getHubSpotClient();
  const out: QualContact[] = [];
  let after: string | undefined = undefined;
  let truncated = false;

  do {
    const page = await withHubSpotRetry(
      () =>
        client.crm.contacts.searchApi.doSearch({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'lastmodifieddate',
                  operator: FilterOperatorEnum.Gte as never,
                  value: String(sinceMs),
                },
              ],
            },
          ],
          properties: [...CONTACT_READ_PROPS],
          limit: 100,
          after: after ?? '0',
          sorts: [],
        }),
      'fetchContactsModifiedSince',
    );
    for (const raw of page.results) {
      out.push(mapContact(raw as { id: string; properties: Record<string, string | null> }));
    }
    if (out.length >= MAX_INCREMENTAL_CONTACTS) {
      truncated = true;
      break;
    }
    after = page.paging?.next?.after;
  } while (after);

  return { contacts: out.slice(0, MAX_INCREMENTAL_CONTACTS), truncated };
}

/** Batch-resolve contact -> associated company ids (v4 associations, chunks of 100). */
async function fetchCompanyIdsForContacts(contactIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (contactIds.length === 0) return map;
  const client = getHubSpotClient();

  for (let i = 0; i < contactIds.length; i += 100) {
    const chunk = contactIds.slice(i, i + 100);
    const res = await withHubSpotRetry(
      () =>
        client.crm.associations.v4.batchApi.getPage('contacts', 'companies', {
          inputs: chunk.map((id) => ({ id })),
        }),
      `assocBatch(${chunk.length})`,
    );
    for (const row of res.results as unknown as {
      _from?: { id: string };
      from?: { id: string };
      to: { toObjectId: string | number }[];
    }[]) {
      const fromId = String(row._from?.id ?? row.from?.id ?? '');
      if (!fromId) continue;
      map.set(fromId, (row.to || []).map((t) => String(t.toObjectId)));
    }
  }
  return map;
}

/** Batch-read companies with TAM properties; returns companyId -> QualCompany. */
async function readCompanies(ids: string[]): Promise<Map<string, QualCompany>> {
  const map = new Map<string, QualCompany>();
  if (ids.length === 0) return map;
  const client = getHubSpotClient();

  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const res = await withHubSpotRetry(
      () =>
        client.crm.companies.batchApi.read({
          inputs: chunk.map((id) => ({ id })),
          properties: [
            'name', YARDFLOW_TAM_PROPERTY, TAM_TIER_PROPERTY, YARDFLOW_ICP_SCORE_PROPERTY,
            'intent_score', 'trigger_score', 'last_intent_at', 'last_intent_source',
          ],
          propertiesWithHistory: [],
        }),
      `readCompanies(${chunk.length})`,
    );
    for (const raw of res.results) {
      const p = (raw as { id: string; properties: Record<string, string | null> }).properties;
      map.set((raw as { id: string }).id, {
        id: (raw as { id: string }).id,
        name: p.name || '',
        icpScore: parseFloat(p[YARDFLOW_ICP_SCORE_PROPERTY] || '0') || 0,
        tam: p[YARDFLOW_TAM_PROPERTY] || '',
        tier: p[TAM_TIER_PROPERTY] || '',
        intentScore: parseFloat(p.intent_score || '0') || 0,
        triggerScore: parseFloat(p.trigger_score || '0') || 0,
        lastIntentAt: p.last_intent_at || '',
        lastIntentSource: p.last_intent_source || '',
      });
    }
  }
  return map;
}

/** TAM companies whose hs_lastmodifieddate >= sinceMs (newly tagged / re-tiered), capped. */
async function fetchTamCompaniesModifiedSince(
  sinceMs: number,
): Promise<{ companies: QualCompany[]; truncated: boolean }> {
  if (!isHubSpotConfigured()) return { companies: [], truncated: false };
  const client = getHubSpotClient();
  const out: QualCompany[] = [];
  let after: string | undefined = undefined;
  let truncated = false;

  do {
    const page = await withHubSpotRetry(
      () =>
        client.crm.companies.searchApi.doSearch({
          filterGroups: [
            {
              filters: [
                { propertyName: YARDFLOW_TAM_PROPERTY, operator: FilterOperatorEnum.Eq, value: 'in' },
                {
                  propertyName: 'hs_lastmodifieddate',
                  operator: FilterOperatorEnum.Gte,
                  value: String(sinceMs),
                },
              ],
            },
          ],
          properties: [
            'name', YARDFLOW_TAM_PROPERTY, TAM_TIER_PROPERTY, YARDFLOW_ICP_SCORE_PROPERTY,
            // Carries account heat AND closes the cascade blind spot: a modex
            // intent stamp bumps hs_lastmodifieddate, so a newly-hot account is
            // re-evaluated here and its committee re-promoted next cron.
            'intent_score', 'trigger_score', 'last_intent_at', 'last_intent_source',
          ],
          limit: 100,
          after: after ?? '0',
          sorts: [],
        }),
      'fetchTamCompaniesModifiedSince',
    );
    for (const raw of page.results) {
      const p = (raw as { id: string; properties: Record<string, string | null> }).properties;
      out.push({
        id: (raw as { id: string }).id,
        name: p.name || '',
        icpScore: parseFloat(p[YARDFLOW_ICP_SCORE_PROPERTY] || '0') || 0,
        tam: p[YARDFLOW_TAM_PROPERTY] || '',
        tier: p[TAM_TIER_PROPERTY] || '',
        intentScore: parseFloat(p.intent_score || '0') || 0,
        triggerScore: parseFloat(p.trigger_score || '0') || 0,
        lastIntentAt: p.last_intent_at || '',
        lastIntentSource: p.last_intent_source || '',
      });
    }
    if (out.length >= MAX_INCREMENTAL_COMPANIES) {
      truncated = true;
      break;
    }
    after = page.paging?.next?.after;
  } while (after);

  return { companies: out.slice(0, MAX_INCREMENTAL_COMPANIES), truncated };
}

/**
 * Pair modified contacts with their TAM companies. Pure — exported for tests.
 * Contacts with no associated TAM company are dropped (verdict would be 'none' anyway,
 * and we must not churn verdicts for the 4.7k out-of-TAM companies' contacts).
 */
export function pairContactsToTamCompanies(
  contacts: QualContact[],
  companyIdsByContact: Map<string, string[]>,
  companiesById: Map<string, QualCompany>,
): { company: QualCompany; contact: QualContact }[] {
  const pairs: { company: QualCompany; contact: QualContact }[] = [];
  for (const contact of contacts) {
    for (const cid of companyIdsByContact.get(contact.id) || []) {
      const company = companiesById.get(cid);
      if (company && company.tam === 'in') pairs.push({ company, contact });
    }
  }
  return pairs;
}

/** The daily-sized evaluation. Read-only; same EvaluateResult contract as the full walk. */
export async function evaluateIncremental(sinceHours: number): Promise<EvaluateResult> {
  const evaluatedAt = new Date().toISOString();
  const sinceMs = Date.now() - sinceHours * 3600_000;
  const warnings: string[] = [];

  // (a) modified contacts -> their TAM companies
  const { contacts: touchedContacts, truncated: contactsTruncated } =
    await fetchContactsModifiedSince(sinceMs);
  if (contactsTruncated)
    warnings.push(
      `contacts truncated at ${MAX_INCREMENTAL_CONTACTS} (bulk-edit day?) — run the local full sweep to catch up`,
    );
  const assoc = await fetchCompanyIdsForContacts(touchedContacts.map((c) => c.id));
  const companyIds = [...new Set([...assoc.values()].flat())];
  const companiesById = await readCompanies(companyIds);
  const pairs = pairContactsToTamCompanies(touchedContacts, assoc, companiesById);

  // (b) modified TAM companies -> their contacts (newly tagged accounts)
  const { companies: touchedCompanies, truncated: companiesTruncated } =
    await fetchTamCompaniesModifiedSince(sinceMs);
  if (companiesTruncated)
    warnings.push(
      `companies truncated at ${MAX_INCREMENTAL_COMPANIES} — run the local full sweep to catch up`,
    );
  const seenViaContacts = new Set(pairs.map((p) => `${p.company.id}:${p.contact.id}`));
  for (const company of touchedCompanies) {
    try {
      const ids = await fetchAssociatedContactIds(company.id);
      const contacts = await readContacts(ids);
      for (const contact of contacts) {
        if (!seenViaContacts.has(`${company.id}:${contact.id}`)) pairs.push({ company, contact });
      }
    } catch (err) {
      warnings.push(
        `company ${company.id} (${company.name}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const diff = dedupeByContact(buildDiff(pairs));
  const counts: Record<Verdict, number> = { none: 0, mql: 0, sql: 0 };
  for (const d of diff) counts[d.newVerdict] += 1;

  return {
    evaluatedAt,
    companies: companiesById.size + touchedCompanies.length,
    contacts: diff.length,
    counts,
    changes: diff.filter((d: VerdictDiff) => d.changed).length,
    diff,
    warnings,
  };
}
