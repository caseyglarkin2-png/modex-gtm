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

const YARDFLOW_TAM_PROPERTY = 'yardflow_tam';
const TAM_TIER_PROPERTY = 'tam_tier';
import {
  classifyContact, hasIntent, hasRoleGate, hasAccountIntent, seniorityRank,
  ACCOUNT_INTENT_SQL_CAP_PER_ACCOUNT,
} from './model';
import type { QualCompany, QualContact, VerdictDiff, EvaluateResult, Verdict } from './types';

// ---------------------------------------------------------------------------
// Contact properties the evaluate pipeline reads (shared with incremental.ts)
// ---------------------------------------------------------------------------
export const CONTACT_READ_PROPS = [
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
 * Paginate through all companies tagged yardflow_tam = 'in'.
 * Returns QualCompany[] with id, name, icpScore, tam, tier.
 * Returns [] when HubSpot is not configured.
 */
export async function fetchTamCompanies(): Promise<QualCompany[]> {
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
                  propertyName: YARDFLOW_TAM_PROPERTY,
                  operator: FilterOperatorEnum.Eq,
                  value: 'in',
                },
              ],
            },
          ],
          properties: [
            'name', YARDFLOW_TAM_PROPERTY, TAM_TIER_PROPERTY, YARDFLOW_ICP_SCORE_PROPERTY,
            // Account-grade heat — the keystone join. Without these the company's
            // own intent never reaches classifyContact and hot accounts never
            // promote their committee (see model.ts hasAccountIntent).
            'intent_score', 'trigger_score', 'last_intent_at', 'last_intent_source',
          ],
          limit: 100,
          after: after ?? '0',
          sorts: [],
        }),
      `fetchTamCompanies()`,
    );

    for (const raw of page.results) {
      const props = (raw as { id: string; properties: Record<string, string | null> }).properties;
      results.push({
        id: (raw as { id: string }).id,
        name: props.name || '',
        icpScore: parseFloat(props[YARDFLOW_ICP_SCORE_PROPERTY] || '0') || 0,
        tam: props[YARDFLOW_TAM_PROPERTY] || '',
        tier: props[TAM_TIER_PROPERTY] || '',
        intentScore: parseFloat(props.intent_score || '0') || 0,
        triggerScore: parseFloat(props.trigger_score || '0') || 0,
        lastIntentAt: props.last_intent_at || '',
        lastIntentSource: props.last_intent_source || '',
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

const pulseNum = (s: string): number => {
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
};

/**
 * Per-account cap on ACCOUNT-INTENT-driven SQL promotions (blast-radius guard,
 * added after the adversarial critic). A single hot signal must not flip an
 * entire 500-person committee to SQL: at each hot account, only the top-N
 * seniors promote on account heat alone; the rest stay MQL. Person-intent SQLs
 * (individually earned via hasIntent) are NEVER capped. Returns the set of
 * `${companyId}:${contactId}` that the cap demotes back to MQL. Deterministic
 * ordering (seniority, then icp, then id) so which N survive is stable run to
 * run — no flapping. Pure.
 */
export function accountIntentSqlCap(
  pairs: { company: QualCompany; contact: QualContact }[],
  nowMs: number,
  cap: number = ACCOUNT_INTENT_SQL_CAP_PER_ACCOUNT,
): Set<string> {
  const demoted = new Set<string>();
  const byCompany = new Map<string, { company: QualCompany; contact: QualContact }[]>();
  for (const p of pairs) {
    const arr = byCompany.get(p.company.id);
    if (arr) arr.push(p);
    else byCompany.set(p.company.id, [p]);
  }
  for (const group of byCompany.values()) {
    const company = group[0].company;
    if (!hasAccountIntent(company, nowMs)) continue; // no account heat -> nothing to cap
    // account-ONLY NEW promotions = role-gated, would be SQL by account heat, NOT
    // personally engaged, and NOT already SQL. Already-SQL contacts are being
    // worked (a human is on them), so they never count against the cap or get
    // demoted — the cap only bounds how many NEW contacts promote in one run.
    const acctOnly = group.filter(
      ({ contact }) => hasRoleGate(contact) && !hasIntent(contact) && contact.yardflow_qual_verdict !== 'sql',
    );
    if (acctOnly.length <= cap) continue;
    const ranked = [...acctOnly].sort(
      (a, b) =>
        seniorityRank(b.contact) - seniorityRank(a.contact) ||
        b.company.icpScore - a.company.icpScore ||
        a.contact.id.localeCompare(b.contact.id),
    );
    for (const { company: c, contact } of ranked.slice(cap)) demoted.add(`${c.id}:${contact.id}`);
  }
  return demoted;
}

export function buildDiff(
  pairs: { company: QualCompany; contact: QualContact }[],
  nowMs: number = Date.now(),
): VerdictDiff[] {
  const demoted = accountIntentSqlCap(pairs, nowMs);
  return pairs.map(({ company, contact }) => {
    let newVerdict = classifyContact(company, contact, nowMs);
    // Cap demotes an account-only SQL back to MQL (it is still a qualified
    // committee member, just below the per-account SQL cut this run).
    const capped = newVerdict === 'sql' && demoted.has(`${company.id}:${contact.id}`);
    if (capped) newVerdict = 'mql';
    const currentVerdict = (contact.yardflow_qual_verdict || 'none') as Verdict;
    // Anti-flap (2026-07-20 critic): never un-qualify a contact that is ALREADY
    // SQL while it is still a role-gated TAM contact. intent_score is
    // last-write-wins with no decay, so a later lower-scoring session would
    // otherwise demote a worked lead SQL->MQL and flap it back next session. A
    // human handoff is one-way; account heat cooling does not revoke it.
    if (currentVerdict === 'sql' && newVerdict === 'mql' && company.tam === 'in' && hasRoleGate(contact)) {
      newVerdict = 'sql';
    }
    const hasPulse =
      pulseNum(contact.hs_email_open) >= 1 || pulseNum(contact.hs_email_replied) >= 1;
    return {
      hasPulse,
      contactId: contact.id,
      name: `${contact.firstname} ${contact.lastname}`.trim(),
      email: contact.email,
      companyId: company.id,
      companyName: company.name,
      icpScore: company.icpScore,
      tamTier: company.tier,
      seniority: contact.hs_seniority,
      role: contact.hs_role,
      jobtitle: contact.jobtitle,
      currentLifecycle: contact.lifecyclestage,
      currentVerdict,
      newVerdict,
      changed: newVerdict !== currentVerdict,
      reason: `tam=${company.tam} tier=${company.tier || '-'} icp=${company.icpScore} acctIntent=${company.intentScore ?? 0} acctTrigger=${company.triggerScore ?? 0} seniority=${contact.hs_seniority || '-'} role=${contact.hs_role || '-'}${capped ? ' [capped: account-SQL over per-account limit]' : ''} -> ${newVerdict}`,
    };
  });
}

export async function evaluateQualification(): Promise<EvaluateResult> {
  const evaluatedAt = new Date().toISOString();
  const companies = await fetchTamCompanies();
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
