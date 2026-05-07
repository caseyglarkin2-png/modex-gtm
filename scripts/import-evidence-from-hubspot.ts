#!/usr/bin/env npx tsx
/**
 * import-evidence-from-hubspot.ts
 *
 * Cold-start seed for source-backed evidence in production.
 *
 * For each priority Account in the local DB, this script:
 *   1. Looks up the matching HubSpot Company by domain (falls back to name).
 *   2. Combines high-signal text from the local Account (why_now, primo_angle,
 *      source_url_1/2) with HubSpot company properties (description, about_us,
 *      linkedinbio, hs_recent_intent_signals) into a list of evidence claims.
 *   3. Upserts a single ResearchRun (provider='hubspot+local-curation',
 *      status='succeeded') and the resulting EvidenceRecord rows via the
 *      existing services in src/lib/source-backed/evidence.ts.
 *
 * Idempotent: deterministic_key + the upsert in upsertEvidenceRecords dedupe
 * across re-runs, so it is safe to replay.
 *
 * Usage:
 *   npx tsx scripts/import-evidence-from-hubspot.ts --dry-run [--limit 50]
 *   npx tsx scripts/import-evidence-from-hubspot.ts --limit 25
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { Client as HubSpotClient } from '@hubspot/api-client';
import { createResearchRun, upsertEvidenceRecords } from '../src/lib/source-backed/evidence';

const PROVIDER = 'hubspot+local-curation';

const HUBSPOT_COMPANY_PROPS = [
  'name',
  'domain',
  'website',
  'description',
  'about_us',
  'linkedinbio',
  'hs_recent_intent_signals',
  'hs_quick_context',
  'industry',
];

type ClaimDraft = {
  claim: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceType: 'hubspot_company' | 'local_account_curation';
  observedAt: Date;
};

function readFlag(name: string): boolean {
  return process.argv.includes(name);
}

function readNumberFlag(name: string, fallback: number): number {
  const i = process.argv.findIndex((a) => a === name);
  if (i < 0) return fallback;
  const n = Number(process.argv[i + 1]);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function trim(value?: string | null): string | null {
  if (!value) return null;
  const s = String(value).trim();
  return s.length === 0 ? null : s;
}

function normalizeDomain(value?: string | null): string | null {
  const s = trim(value);
  if (!s) return null;
  return s
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .toLowerCase();
}

function hashClaim(parts: string[]): string {
  return createHash('sha256').update(parts.join('||')).digest('hex').slice(0, 32);
}

function getHubSpotClient(): HubSpotClient {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error('HUBSPOT_ACCESS_TOKEN not set in environment');
  return new HubSpotClient({ accessToken: token });
}

async function findHubSpotCompany(
  hs: HubSpotClient,
  account: { name: string; domain?: string | null },
): Promise<Record<string, string | undefined> | null> {
  const filterGroups: Array<{ filters: Array<{ propertyName: string; operator: string; value: string }> }> = [];
  const dom = normalizeDomain(account.domain);
  if (dom) {
    filterGroups.push({ filters: [{ propertyName: 'domain', operator: 'EQ', value: dom }] });
  }
  filterGroups.push({ filters: [{ propertyName: 'name', operator: 'EQ', value: account.name }] });

  try {
    const result = await hs.crm.companies.searchApi.doSearch({
      filterGroups: filterGroups as never,
      properties: HUBSPOT_COMPANY_PROPS,
      limit: 1,
      after: 0 as unknown as string,
      sorts: [],
    });
    if (result.results && result.results.length > 0) {
      return result.results[0].properties as Record<string, string | undefined>;
    }
  } catch (err) {
    console.warn(`[hubspot-search] ${account.name}: ${(err as Error).message}`);
  }
  return null;
}

function buildClaimsFromLocal(account: {
  name: string;
  why_now: string | null;
  primo_angle: string | null;
  source_url_1: string | null;
  source_url_2: string | null;
  signal_type: string | null;
  best_intro_path: string | null;
}, observedAt: Date): ClaimDraft[] {
  const drafts: ClaimDraft[] = [];
  const why = trim(account.why_now);
  const angle = trim(account.primo_angle);
  const intro = trim(account.best_intro_path);
  const signal = trim(account.signal_type);
  const src1 = trim(account.source_url_1);
  const src2 = trim(account.source_url_2);
  const fallbackUrl = src1 ?? src2 ?? `https://yardflow.local/account/${encodeURIComponent(account.name)}`;

  if (why) {
    drafts.push({
      claim: `Why now: ${why}`,
      sourceUrl: src1 ?? fallbackUrl,
      sourceTitle: src1 ? 'Curated source #1' : `${account.name} — local curation`,
      sourceType: 'local_account_curation',
      observedAt,
    });
  }
  if (angle) {
    drafts.push({
      claim: `Primo angle: ${angle}`,
      sourceUrl: src2 ?? src1 ?? fallbackUrl,
      sourceTitle: src2 ? 'Curated source #2' : src1 ? 'Curated source #1' : `${account.name} — local curation`,
      sourceType: 'local_account_curation',
      observedAt,
    });
  }
  if (intro) {
    drafts.push({
      claim: `Best intro path: ${intro}`,
      sourceUrl: fallbackUrl,
      sourceTitle: `${account.name} — local curation`,
      sourceType: 'local_account_curation',
      observedAt,
    });
  }
  if (signal) {
    drafts.push({
      claim: `Signal type: ${signal}`,
      sourceUrl: fallbackUrl,
      sourceTitle: `${account.name} — local curation`,
      sourceType: 'local_account_curation',
      observedAt,
    });
  }
  return drafts;
}

function buildClaimsFromHubSpot(
  account: { name: string },
  hs: Record<string, string | undefined>,
  observedAt: Date,
): ClaimDraft[] {
  const drafts: ClaimDraft[] = [];
  const websiteRaw = hs.website ?? hs.domain ?? '';
  const websiteUrl = websiteRaw
    ? websiteRaw.startsWith('http')
      ? websiteRaw
      : `https://${websiteRaw.replace(/^www\./i, '')}`
    : `https://yardflow.local/hubspot/${encodeURIComponent(account.name)}`;

  const description = trim(hs.description);
  const aboutUs = trim(hs.about_us);
  const linkedinBio = trim(hs.linkedinbio);
  const intentSignals = trim(hs.hs_recent_intent_signals);
  const quickCtx = trim(hs.hs_quick_context);

  if (description) {
    drafts.push({
      claim: `Company description: ${description}`,
      sourceUrl: websiteUrl,
      sourceTitle: `${account.name} website`,
      sourceType: 'hubspot_company',
      observedAt,
    });
  }
  if (aboutUs && aboutUs !== description) {
    drafts.push({
      claim: `About us: ${aboutUs}`,
      sourceUrl: websiteUrl,
      sourceTitle: `${account.name} website`,
      sourceType: 'hubspot_company',
      observedAt,
    });
  }
  if (linkedinBio) {
    drafts.push({
      claim: `LinkedIn bio: ${linkedinBio}`,
      sourceUrl: `https://www.linkedin.com/company/${encodeURIComponent(account.name.toLowerCase().replace(/\s+/g, '-'))}`,
      sourceTitle: `${account.name} on LinkedIn`,
      sourceType: 'hubspot_company',
      observedAt,
    });
  }
  if (intentSignals) {
    drafts.push({
      claim: `Recent intent signals (HubSpot, last 30d): ${intentSignals}`,
      sourceUrl: websiteUrl,
      sourceTitle: `${account.name} — HubSpot intent signals`,
      sourceType: 'hubspot_company',
      observedAt,
    });
  }
  if (quickCtx) {
    drafts.push({
      claim: `Quick context: ${quickCtx}`,
      sourceUrl: websiteUrl,
      sourceTitle: `${account.name} — HubSpot quick context`,
      sourceType: 'hubspot_company',
      observedAt,
    });
  }
  return drafts;
}

async function loadPriorityAccounts(prisma: PrismaClient, limit: number) {
  const rows = await prisma.account.findMany({
    where: {
      OR: [{ priority_band: { in: ['A', 'B'] } }, { tier: 'Tier 1' }],
    },
    orderBy: [{ priority_score: 'desc' }, { rank: 'asc' }],
    take: limit,
    select: {
      id: true,
      name: true,
      rank: true,
      tier: true,
      priority_band: true,
      priority_score: true,
      why_now: true,
      primo_angle: true,
      best_intro_path: true,
      source_url_1: true,
      source_url_2: true,
      signal_type: true,
    },
  });
  return rows;
}

async function main() {
  const dryRun = readFlag('--dry-run');
  const limit = readNumberFlag('--limit', 25);

  const prisma = new PrismaClient();
  const hs = getHubSpotClient();
  const observedAt = new Date();

  const summary = {
    mode: dryRun ? 'DRY_RUN' : 'LIVE',
    accounts_scanned: 0,
    accounts_with_hubspot_match: 0,
    accounts_with_no_data: 0,
    research_runs_created: 0,
    evidence_records_upserted: 0,
    per_account: [] as Array<{
      name: string;
      hubspot_match: boolean;
      claim_count: number;
      research_run_id?: string;
    }>,
  };

  try {
    const accounts = await loadPriorityAccounts(prisma, limit);
    summary.accounts_scanned = accounts.length;
    console.log(`[hubspot-evidence-import] mode=${summary.mode} accounts=${accounts.length} limit=${limit}`);

    for (const acct of accounts) {
      const hsCompany = await findHubSpotCompany(hs, { name: acct.name });
      const matched = !!hsCompany;
      if (matched) summary.accounts_with_hubspot_match += 1;

      const localClaims = buildClaimsFromLocal(
        {
          name: acct.name,
          why_now: acct.why_now,
          primo_angle: acct.primo_angle,
          source_url_1: acct.source_url_1,
          source_url_2: acct.source_url_2,
          signal_type: acct.signal_type,
          best_intro_path: acct.best_intro_path,
        },
        observedAt,
      );
      const hsClaims = hsCompany ? buildClaimsFromHubSpot({ name: acct.name }, hsCompany, observedAt) : [];
      const drafts = [...localClaims, ...hsClaims];

      if (drafts.length === 0) {
        summary.accounts_with_no_data += 1;
        summary.per_account.push({ name: acct.name, hubspot_match: matched, claim_count: 0 });
        console.log(`  [${acct.name}] no claims (no local or HubSpot text), skipped`);
        continue;
      }

      if (dryRun) {
        summary.evidence_records_upserted += drafts.length;
        summary.per_account.push({ name: acct.name, hubspot_match: matched, claim_count: drafts.length });
        console.log(`  [${acct.name}] dry-run: would upsert ${drafts.length} claims (hubspot_match=${matched})`);
        continue;
      }

      const run = await createResearchRun(prisma, {
        accountName: acct.name,
        status: 'succeeded',
        runKey: `hubspot-import:${observedAt.toISOString()}:${acct.id}`,
        providerStatus: { hubspot: matched ? 'matched' : 'no_match', local_curation: localClaims.length > 0 ? 'present' : 'absent' },
        startedAt: observedAt,
        completedAt: observedAt,
      });
      summary.research_runs_created += 1;

      const evidenceInputs = drafts.map((d, idx) => {
        const detKey = `hubspot-import:${acct.id}:${idx}:${d.sourceType}`;
        return {
          accountName: acct.name,
          claim: d.claim,
          claimHash: hashClaim([acct.name, d.claim, d.sourceUrl]),
          sourceUrl: d.sourceUrl,
          sourceTitle: d.sourceTitle,
          sourceType: d.sourceType,
          provider: PROVIDER,
          observedAt: d.observedAt,
          deterministicKey: detKey,
          metadata: { import_run_at: observedAt.toISOString(), origin: 'hubspot-evidence-import' },
        };
      });

      await upsertEvidenceRecords(prisma, run.id, evidenceInputs);
      summary.evidence_records_upserted += evidenceInputs.length;
      summary.per_account.push({
        name: acct.name,
        hubspot_match: matched,
        claim_count: evidenceInputs.length,
        research_run_id: run.id,
      });
      console.log(`  [${acct.name}] upserted ${evidenceInputs.length} claims (hubspot_match=${matched}) run=${run.id}`);
    }

    console.log('\n=== SUMMARY ===');
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[hubspot-evidence-import] failed', err);
  process.exit(1);
});
