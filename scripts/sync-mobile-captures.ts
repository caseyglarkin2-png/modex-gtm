#!/usr/bin/env npx tsx
/**
 * sync-mobile-captures.ts — Sync booth / field captures into HubSpot and local Personas.
 *
 * What it does:
 * - Finds unsynced `MobileCapture` rows (`synced_at IS NULL` by default)
 * - Ensures the Account exists locally
 * - Finds or creates the matching HubSpot contact
 * - Finds or creates the matching local Persona and links `hubspot_contact_id`
 * - Marks the capture as synced and logs an Activity row
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/sync-mobile-captures.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/sync-mobile-captures.ts --limit 25
 *   npx tsx --env-file=.env.local scripts/sync-mobile-captures.ts --id 42
 *   npx tsx --env-file=.env.local scripts/sync-mobile-captures.ts --force
 */
import 'dotenv/config';

import { PrismaClient, type Account, type MobileCapture, type Persona } from '@prisma/client';
import { getHubSpotClient, isHubSpotConfigured, withHubSpotRetry } from '../src/lib/hubspot/client';
import {
  normalizeName,
  normalizeTitle,
  parseDomainFromEmail,
  scoreContactQuality,
  splitName,
} from '../src/lib/contact-standard';

const prisma = new PrismaClient();

const CONTACT_PROPERTIES = [
  'email',
  'firstname',
  'lastname',
  'company',
  'jobtitle',
  'phone',
] as const;

const COMPANY_PROPERTIES = ['name', 'domain', 'industry'] as const;

type CliOptions = {
  dryRun: boolean;
  force: boolean;
  limit: number;
  id?: number;
};

type HubSpotContactRecord = {
  id: string;
  properties?: Record<string, string | null | undefined>;
};

type HubSpotContactSyncResult = {
  id: string | null;
  companyId: string | null;
  companyCreated: boolean;
  created: boolean;
  matched: boolean;
  email: string | null;
  phone: string | null;
  title: string | null;
};

type SyncStats = {
  processed: number;
  synced: number;
  skipped: number;
  errors: number;
  createdAccounts: number;
  createdPersonas: number;
  createdHubSpotCompanies: number;
  createdHubSpotContacts: number;
  matchedHubSpotContacts: number;
};

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const getArgValue = (flag: string) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };

  const limit = Number.parseInt(getArgValue('--limit') ?? '100', 10);
  const idArg = getArgValue('--id');
  const id = idArg ? Number.parseInt(idArg, 10) : undefined;

  return {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    limit: Number.isFinite(limit) && limit > 0 ? limit : 100,
    id: id && Number.isFinite(id) ? id : undefined,
  };
}

function normalizeLoose(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function sameLoose(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeLoose(a);
  const right = normalizeLoose(b);
  return Boolean(left && right && left === right);
}

function derivePriority(heatScore: number): string {
  if (heatScore >= 16) return 'P1';
  if (heatScore >= 12) return 'P2';
  if (heatScore >= 8) return 'P3';
  return 'P4';
}

function deriveBand(heatScore: number): string {
  if (heatScore >= 16) return 'A';
  if (heatScore >= 12) return 'B';
  if (heatScore >= 8) return 'C';
  return 'D';
}

function buildCaptureNote(capture: MobileCapture): string {
  const parts = [
    `Mobile capture #${capture.id} synced from field notes.`,
    capture.outcome ? `Outcome: ${capture.outcome}` : null,
    capture.next_step ? `Next step: ${capture.next_step}` : null,
    capture.notes ? `Notes: ${capture.notes}` : null,
  ].filter(Boolean);

  return parts.join('\n');
}

function getFullName(record: HubSpotContactRecord): string {
  const first = record.properties?.firstname ?? '';
  const last = record.properties?.lastname ?? '';
  return `${first} ${last}`.trim();
}

async function ensureLocalAccount(capture: MobileCapture, dryRun: boolean): Promise<{ account: Account; created: boolean }> {
  const existing = await prisma.account.findFirst({
    where: { name: { equals: capture.account_name, mode: 'insensitive' } },
  });

  if (existing) {
    return { account: existing, created: false };
  }

  const rank = (await prisma.account.count()) + 1;
  const accountData = {
    rank,
    name: capture.account_name,
    vertical: 'Unknown',
    priority_band: deriveBand(capture.heat_score),
    priority_score: capture.heat_score * 5,
    icp_fit: Math.min(100, capture.fit * 20),
    modex_signal: 0,
    primo_story_fit: 0,
    warm_intro: 0,
    strategic_value: Math.min(100, capture.interest * 20),
    meeting_ease: Math.min(100, capture.urgency * 20),
    source: 'mobile_capture',
    owner: capture.owner ?? 'Casey',
    next_action: capture.next_step ?? 'Review mobile capture',
    notes: buildCaptureNote(capture),
  };

  if (dryRun) {
    return {
      account: {
        id: -capture.id,
        created_at: new Date(),
        updated_at: new Date(),
        parent_brand: null,
        signal_type: null,
        why_now: null,
        primo_angle: null,
        best_intro_path: null,
        source_url_1: null,
        source_url_2: null,
        current_motion: null,
        due_date: null,
        hubspot_company_id: null,
        research_status: 'Not started',
        outreach_status: 'Not started',
        meeting_status: 'No meeting',
        tier: 'Tier 3',
        ...accountData,
      },
      created: true,
    };
  }

  const created = await prisma.account.create({ data: accountData });
  return { account: created, created: true };
}

async function findLocalPersona(accountName: string, personaName: string): Promise<Persona | null> {
  const normalized = normalizeName(personaName);

  return prisma.persona.findFirst({
    where: {
      account_name: { equals: accountName, mode: 'insensitive' },
      OR: [
        { normalized_name: normalized },
        { name: { equals: personaName, mode: 'insensitive' } },
      ],
    },
  });
}

async function ensureHubSpotCompany(account: Account, dryRun: boolean): Promise<{ id: string | null; created: boolean }> {
  if (account.hubspot_company_id) {
    return { id: account.hubspot_company_id, created: false };
  }

  const client = getHubSpotClient();
  const search = await withHubSpotRetry(
    () =>
      client.crm.companies.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              { propertyName: 'name', operator: 'EQ', value: account.name },
            ],
          },
        ],
        properties: [...COMPANY_PROPERTIES],
        limit: 1,
        after: '0',
        sorts: [],
      }),
    `sync-mobile-captures:search-company:${account.name}`,
  );

  const existing = search.results[0]?.id ?? null;
  if (existing) {
    if (!dryRun) {
      await prisma.account.update({
        where: { id: account.id },
        data: { hubspot_company_id: existing },
      });
    }
    return { id: existing, created: false };
  }

  if (dryRun) {
    return { id: null, created: true };
  }

  const created = await withHubSpotRetry(
    () =>
      client.crm.companies.basicApi.create({
        properties: {
          name: account.name,
          ...(account.vertical ? { industry: account.vertical } : {}),
        },
        associations: [],
      }),
    `sync-mobile-captures:create-company:${account.name}`,
  );

  await prisma.account.update({
    where: { id: account.id },
    data: { hubspot_company_id: created.id },
  });

  return { id: created.id, created: true };
}

async function findHubSpotMatchByName(personaName: string, accountName: string): Promise<HubSpotContactRecord | null> {
  const query = [personaName, accountName].filter(Boolean).join(' ').trim();
  if (!query) return null;

  const client = getHubSpotClient();
  const result = await withHubSpotRetry(
    () =>
      client.crm.contacts.searchApi.doSearch({
        query,
        properties: [...CONTACT_PROPERTIES],
        limit: 10,
        after: '0',
        sorts: [],
        filterGroups: [],
      }),
    `sync-mobile-captures:search-contact:${query}`,
  );

  const targetName = normalizeLoose(personaName);
  const targetAccount = normalizeLoose(accountName);

  const best = result.results.find((contact) => {
    const fullName = normalizeLoose(getFullName(contact as HubSpotContactRecord));
    const company = normalizeLoose((contact as HubSpotContactRecord).properties?.company);
    return fullName === targetName && (!company || !targetAccount || company === targetAccount || company.includes(targetAccount));
  });

  if (best) return best as HubSpotContactRecord;

  const fallback = result.results.find((contact) => {
    const fullName = normalizeLoose(getFullName(contact as HubSpotContactRecord));
    return fullName === targetName;
  });

  return (fallback as HubSpotContactRecord | undefined) ?? null;
}

async function ensureHubSpotContact(
  capture: MobileCapture,
  account: Account,
  persona: Persona | null,
  dryRun: boolean,
): Promise<HubSpotContactSyncResult> {
  const client = getHubSpotClient();
  const personaName = (capture.persona_name ?? persona?.name ?? '').trim();
  const title = normalizeTitle(capture.title ?? persona?.title ?? '') || null;
  const phone = persona?.phone ?? null;
  const email = persona?.email?.toLowerCase() ?? null;
  const split = splitName(personaName);

  const companyResult = await ensureHubSpotCompany(account, dryRun);

  let existing: HubSpotContactRecord | null = null;

  if (persona?.hubspot_contact_id) {
    try {
      const found = await withHubSpotRetry(
        () => client.crm.contacts.basicApi.getById(persona.hubspot_contact_id, [...CONTACT_PROPERTIES]),
        `sync-mobile-captures:get-contact:${persona.hubspot_contact_id}`,
      );
      existing = found as HubSpotContactRecord;
    } catch {
      existing = null;
    }
  }

  if (!existing && email) {
    const result = await withHubSpotRetry(
      () =>
        client.crm.contacts.searchApi.doSearch({
          filterGroups: [
            {
              filters: [
                { propertyName: 'email', operator: 'EQ', value: email },
              ],
            },
          ],
          properties: [...CONTACT_PROPERTIES],
          limit: 1,
          after: '0',
          sorts: [],
        }),
      `sync-mobile-captures:search-email:${email}`,
    );

    existing = (result.results[0] as HubSpotContactRecord | undefined) ?? null;
  }

  if (!existing && personaName) {
    existing = await findHubSpotMatchByName(personaName, account.name);
  }

  const properties: Record<string, string> = {
    ...(split.firstName ? { firstname: split.firstName } : {}),
    ...(split.lastName ? { lastname: split.lastName } : {}),
    company: account.name,
    ...(title ? { jobtitle: title } : {}),
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
  };

  if (existing) {
    if (!dryRun) {
      await withHubSpotRetry(
        () => client.crm.contacts.basicApi.update(existing!.id, { properties }),
        `sync-mobile-captures:update-contact:${existing.id}`,
      );
    }

    return {
      id: existing.id,
      companyId: companyResult.id,
      companyCreated: companyResult.created,
      created: false,
      matched: true,
      email: (existing.properties?.email ?? email) || null,
      phone: (existing.properties?.phone ?? phone) || null,
      title: (existing.properties?.jobtitle ?? title) || null,
    };
  }

  if (dryRun) {
    return {
      id: null,
      companyId: companyResult.id,
      companyCreated: companyResult.created,
      created: true,
      matched: false,
      email,
      phone,
      title,
    };
  }

  const created = await withHubSpotRetry(
    () =>
      client.crm.contacts.basicApi.create({
        properties,
        associations: [],
      }),
    `sync-mobile-captures:create-contact:${account.name}:${personaName}`,
  );

  return {
    id: created.id,
    companyId: companyResult.id,
    companyCreated: companyResult.created,
    created: true,
    matched: false,
    email,
    phone,
    title,
  };
}

async function upsertLocalPersona(
  account: Account,
  capture: MobileCapture,
  existingPersona: Persona | null,
  hubspot: HubSpotContactSyncResult,
  dryRun: boolean,
): Promise<{ persona: Persona | null; created: boolean }> {
  const personaName = (capture.persona_name ?? existingPersona?.name ?? '').trim();
  const split = splitName(personaName);
  const normalizedName = normalizeName(personaName);
  const normalizedTitle = normalizeTitle(capture.title ?? existingPersona?.title ?? hubspot.title ?? '');
  const email = hubspot.email ?? existingPersona?.email ?? null;
  const companyDomain = parseDomainFromEmail(email);
  const quality = scoreContactQuality({
    name: personaName,
    title: normalizedTitle,
    accountName: account.name,
    email,
    companyDomain,
    linkedinUrl: existingPersona?.linkedin_url ?? null,
    sourceEvidenceCount: 1,
  });

  const notes = buildCaptureNote(capture);

  if (existingPersona) {
    if (dryRun) {
      return { persona: existingPersona, created: false };
    }

    const nextNotes = existingPersona.notes?.includes(`Mobile capture #${capture.id}`)
      ? existingPersona.notes
      : [existingPersona.notes, notes].filter(Boolean).join('\n\n');

    const updated = await prisma.persona.update({
      where: { id: existingPersona.id },
      data: {
        ...(hubspot.id && existingPersona.hubspot_contact_id !== hubspot.id ? { hubspot_contact_id: hubspot.id } : {}),
        ...(normalizedTitle && !sameLoose(existingPersona.title, normalizedTitle) ? { title: normalizedTitle, normalized_title: normalizedTitle } : {}),
        ...(email && !existingPersona.email ? { email: email.toLowerCase(), email_status: 'confirmed' } : {}),
        ...(hubspot.phone && !existingPersona.phone ? { phone: hubspot.phone } : {}),
        quality_score: Math.max(existingPersona.quality_score ?? 0, quality.score),
        quality_band: quality.band,
        is_contact_ready: existingPersona.is_contact_ready || quality.isReady,
        source_type: existingPersona.source_type ?? 'mobile_capture',
        last_enriched_at: new Date(),
        notes: nextNotes || null,
      },
    });

    return { persona: updated, created: false };
  }

  if (dryRun) {
    return { persona: null, created: true };
  }

  const created = await prisma.persona.create({
    data: {
      persona_id: `MC-${capture.id}`,
      account_name: account.name,
      priority: derivePriority(capture.heat_score),
      name: personaName,
      first_name: split.firstName || null,
      last_name: split.lastName || null,
      normalized_name: normalizedName,
      title: normalizedTitle || null,
      normalized_title: normalizedTitle || null,
      role_in_deal: 'Captured lead',
      seniority: '',
      persona_status: 'Captured',
      notes,
      email: email?.toLowerCase() ?? null,
      email_valid: Boolean(email),
      email_status: email ? 'confirmed' : 'unverified',
      email_confidence: quality.emailConfidence,
      company_domain: companyDomain,
      phone: hubspot.phone ?? null,
      source_type: 'mobile_capture',
      source_evidence: {
        mobileCaptureId: capture.id,
        capturedAt: capture.captured_at.toISOString(),
        channel: capture.channel ?? 'field',
      },
      quality_score: quality.score,
      quality_band: quality.band,
      is_contact_ready: quality.isReady,
      hubspot_contact_id: hubspot.id,
      last_enriched_at: new Date(),
    },
  });

  return { persona: created, created: true };
}

async function markCaptureSynced(
  capture: MobileCapture,
  account: Account,
  personaName: string,
  hubspotId: string | null,
  dryRun: boolean,
): Promise<void> {
  if (dryRun) return;

  await prisma.mobileCapture.update({
    where: { id: capture.id },
    data: { synced_at: new Date() },
  });

  await prisma.activity.create({
    data: {
      account_name: account.name,
      persona: personaName || null,
      activity_type: 'mobile_capture_sync',
      owner: 'System',
      outcome: hubspotId
        ? `Synced mobile capture to HubSpot contact ${hubspotId}`
        : 'Synced mobile capture to local persona only',
      next_step: capture.next_step ?? 'Review captured lead',
      next_step_due: capture.due_date,
      notes: capture.notes ?? null,
      activity_date: capture.captured_at,
    },
  }).catch(() => undefined);
}

async function syncCapture(capture: MobileCapture, options: CliOptions) {
  const personaName = (capture.persona_name ?? '').trim();
  if (!capture.account_name.trim()) {
    return { status: 'skipped' as const, reason: 'missing account_name' };
  }
  if (!personaName) {
    return { status: 'skipped' as const, reason: 'missing persona_name' };
  }

  const { account, created: createdAccount } = await ensureLocalAccount(capture, options.dryRun);
  const existingPersona = await findLocalPersona(account.name, personaName);
  const hubspot = await ensureHubSpotContact(capture, account, existingPersona, options.dryRun);
  const { persona, created: createdPersona } = await upsertLocalPersona(
    account,
    capture,
    existingPersona,
    hubspot,
    options.dryRun,
  );

  await markCaptureSynced(capture, account, persona?.name ?? personaName, hubspot.id, options.dryRun);

  return {
    status: 'synced' as const,
    createdAccount,
    createdPersona,
    createdHubSpotCompany: hubspot.companyCreated,
    createdHubSpotContact: hubspot.created,
    matchedHubSpotContact: hubspot.matched,
  };
}

async function main() {
  const options = parseArgs();

  console.log(`[sync-mobile-captures] ${options.dryRun ? 'DRY RUN' : 'LIVE'} mode`);
  console.log(`force=${options.force} limit=${options.limit}${options.id ? ` id=${options.id}` : ''}\n`);

  if (!isHubSpotConfigured()) {
    throw new Error('HUBSPOT_ACCESS_TOKEN is not set. Add it to .env.local or Vercel env first.');
  }

  const where = options.id
    ? { id: options.id }
    : options.force
      ? {}
      : { synced_at: null };

  const captures = await prisma.mobileCapture.findMany({
    where,
    orderBy: [{ captured_at: 'asc' }],
    take: options.id ? undefined : options.limit,
  });

  if (captures.length === 0) {
    console.log('No mobile captures found for sync.');
    return;
  }

  const stats: SyncStats = {
    processed: 0,
    synced: 0,
    skipped: 0,
    errors: 0,
    createdAccounts: 0,
    createdPersonas: 0,
    createdHubSpotCompanies: 0,
    createdHubSpotContacts: 0,
    matchedHubSpotContacts: 0,
  };

  console.log(`Found ${captures.length} mobile capture${captures.length === 1 ? '' : 's'} to process.\n`);

  for (const capture of captures) {
    stats.processed++;

    try {
      const result = await syncCapture(capture, options);

      if (result.status === 'skipped') {
        stats.skipped++;
        console.log(`- #${capture.id} ${capture.account_name} / ${capture.persona_name ?? 'Unknown'} — skipped (${result.reason})`);
        continue;
      }

      stats.synced++;
      if (result.createdAccount) stats.createdAccounts++;
      if (result.createdPersona) stats.createdPersonas++;
      if (result.createdHubSpotCompany) stats.createdHubSpotCompanies++;
      if (result.createdHubSpotContact) stats.createdHubSpotContacts++;
      if (result.matchedHubSpotContact) stats.matchedHubSpotContacts++;

      const tags = [
        result.createdAccount ? 'new-account' : null,
        result.createdPersona ? 'new-persona' : null,
        result.createdHubSpotContact ? 'new-hubspot-contact' : null,
        result.matchedHubSpotContact ? 'matched-hubspot-contact' : null,
      ].filter(Boolean);

      console.log(`✓ #${capture.id} ${capture.account_name} / ${capture.persona_name} ${tags.length ? `(${tags.join(', ')})` : ''}`);
    } catch (error) {
      stats.errors++;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`✗ #${capture.id} ${capture.account_name} / ${capture.persona_name ?? 'Unknown'} — ${message}`);
    }
  }

  console.log('\nSummary');
  console.log('-------');
  console.log(`Processed: ${stats.processed}`);
  console.log(`Synced: ${stats.synced}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Created accounts: ${stats.createdAccounts}`);
  console.log(`Created personas: ${stats.createdPersonas}`);
  console.log(`Created HubSpot companies: ${stats.createdHubSpotCompanies}`);
  console.log(`Created HubSpot contacts: ${stats.createdHubSpotContacts}`);
  console.log(`Matched HubSpot contacts: ${stats.matchedHubSpotContacts}`);
}

main()
  .catch((error) => {
    console.error('\nSync failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
