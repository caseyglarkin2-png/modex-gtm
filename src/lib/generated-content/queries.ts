import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/data';
import type { QueueGeneratedAccountCard } from '@/components/queue/generated-content-grid';
import { evaluateContentQuality } from '@/lib/content-quality';
import { resolveContentQaChecklist } from '@/lib/revops/content-qa-checklist';
import { computeRecipientReadiness } from '@/lib/revops/recipient-readiness';
import { parseInfographicMetadata } from '@/lib/revops/infographic-journey';
import { ensureCanonicalRecords } from '@/lib/revops/canonical-sync';

export type GenerationJobRecord = {
  account_name: string;
  status: string;
};

export type GeneratedContentRecord = {
  id: number;
  account_name: string;
  version: number;
  provider_used: string | null;
  external_send_count: number;
  is_published: boolean;
  content: string;
  version_metadata?: unknown;
  created_at: Date;
  campaign_id: number | null;
  campaign: {
    name: string;
    campaign_type: string;
    generation_contract?: {
      is_complete: boolean;
      quality_score: number;
    } | null;
  } | null;
  checklist_state?: {
    completed_item_ids: string[];
  } | null;
};

export type PersonaRecord = {
  id: number;
  account_name: string;
  name: string;
  normalized_name?: string | null;
  email: string | null;
  title: string | null;
  role_in_deal: string | null;
  email_confidence: number;
  quality_score: number;
  last_enriched_at: Date | null;
  email_valid?: boolean;
  company_domain?: string | null;
  hubspot_contact_id?: string | null;
  do_not_contact?: boolean;
};

export type WorkspaceRecipient = {
  id: number;
  name: string;
  email: string;
  title?: string;
  readiness: ReturnType<typeof computeRecipientReadiness>;
  role_in_deal?: string;
  canonicalStatus?: 'resolved' | 'conflict' | 'unresolved';
  canonicalConflicts?: string[];
  canonicalBlockedReason?: string | null;
};

export type GeneratedContentWorkspaceData = {
  cards: QueueGeneratedAccountCard[];
  recipientsByAccount: Record<string, WorkspaceRecipient[]>;
};

const generatedContentBaseSelect = {
  id: true,
  account_name: true,
  version: true,
  provider_used: true,
  external_send_count: true,
  is_published: true,
  content: true,
  created_at: true,
  version_metadata: true,
  campaign_id: true,
  campaign: {
    select: {
      name: true,
      campaign_type: true,
    },
  },
  checklist_state: {
    select: {
      completed_item_ids: true,
    },
  },
} as const;

const generatedContentWithContractSelect = {
  ...generatedContentBaseSelect,
  campaign: {
    select: {
      ...generatedContentBaseSelect.campaign.select,
      generation_contract: {
        select: {
          is_complete: true,
          quality_score: true,
        },
      },
    },
  },
} as const;

function isMissingCampaignContractTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: string; meta?: unknown };
  return candidate.code === 'P2021' && JSON.stringify(candidate.meta ?? '').includes('campaign_generation_contracts');
}

async function fetchGeneratedRows(): Promise<GeneratedContentRecord[]> {
  const query = {
    where: { content_type: 'one_pager' },
    orderBy: [{ account_name: 'asc' as const }, { version: 'desc' as const }],
    take: 500,
  };

  try {
    return (await prisma.generatedContent.findMany({
      ...query,
      select: generatedContentWithContractSelect,
    })) as GeneratedContentRecord[];
  } catch (error) {
    if (!isMissingCampaignContractTableError(error)) throw error;
    return (await prisma.generatedContent.findMany({
      ...query,
      select: generatedContentBaseSelect,
    })) as GeneratedContentRecord[];
  }
}

export function buildGeneratedContentWorkspaceData(
  generatedRows: GeneratedContentRecord[],
  jobs: GenerationJobRecord[],
  recipients: PersonaRecord[],
  canonicalStatuses?: Map<number, { status: 'resolved' | 'conflict' | 'unresolved'; conflictCodes: string[]; sendBlockReason: string | null }>,
): GeneratedContentWorkspaceData {
  const recipientsByAccount = recipients.reduce<Record<string, WorkspaceRecipient[]>>((acc, persona) => {
    if (!persona.email) return acc;
    if (!acc[persona.account_name]) acc[persona.account_name] = [];
    const canonical = canonicalStatuses?.get(persona.id);
    acc[persona.account_name].push({
      id: persona.id,
      name: persona.name,
      email: persona.email,
      title: persona.title ?? undefined,
      role_in_deal: persona.role_in_deal ?? undefined,
      readiness: computeRecipientReadiness({
        email_confidence: persona.email_confidence,
        quality_score: persona.quality_score,
        title: persona.title,
        role_in_deal: persona.role_in_deal,
        last_enriched_at: persona.last_enriched_at,
      }),
      canonicalStatus: canonical?.status,
      canonicalConflicts: canonical?.conflictCodes,
      canonicalBlockedReason: canonical?.sendBlockReason,
    });
    return acc;
  }, {});

  const queueCountsByAccount = jobs.reduce<Record<string, { pending: number; processing: number }>>((acc, job) => {
    if (!acc[job.account_name]) acc[job.account_name] = { pending: 0, processing: 0 };
    if (job.status === 'pending') acc[job.account_name].pending += 1;
    if (job.status === 'processing') acc[job.account_name].processing += 1;
    return acc;
  }, {});

  const cardMap = generatedRows.reduce<Record<string, QueueGeneratedAccountCard>>((acc, row) => {
    if (!acc[row.account_name]) {
      const counts = queueCountsByAccount[row.account_name] ?? { pending: 0, processing: 0 };
      acc[row.account_name] = {
        account_name: row.account_name,
        account_slug: slugify(row.account_name),
        latest_version: row.version,
        pending_jobs: counts.pending,
        processing_jobs: counts.processing,
        campaign_names: [],
        versions: [],
      };
    }

    const card = acc[row.account_name];
    const infographic = parseInfographicMetadata(row.version_metadata);
    const checklist = resolveContentQaChecklist({
      campaignType: row.campaign?.campaign_type,
      completedItemIds: row.checklist_state?.completed_item_ids ?? [],
      content: row.content,
      accountName: row.account_name,
    });
    const version = {
      id: row.id,
      version: row.version,
      provider_used: row.provider_used,
      external_send_count: row.external_send_count,
      is_published: row.is_published,
      content: row.content,
      created_at: row.created_at.toISOString(),
      campaign_id: row.campaign_id ?? undefined,
      campaign_name: row.campaign?.name ?? undefined,
      campaign_type: row.campaign?.campaign_type ?? undefined,
      contract: row.campaign?.generation_contract
        ? {
          complete: row.campaign.generation_contract.is_complete,
          qualityScore: row.campaign.generation_contract.quality_score,
        }
        : undefined,
      quality: evaluateContentQuality(row.content, row.account_name),
      checklist,
      checklist_completed_item_ids: checklist.completedItemIds,
      infographic_type: infographic.infographicType,
      stage_intent: infographic.stageIntent,
      bundle_id: infographic.bundleId,
      sequence_position: infographic.sequencePosition,
    };
    card.versions.push(version);

    if (version.campaign_name && !card.campaign_names.includes(version.campaign_name)) {
      card.campaign_names.push(version.campaign_name);
    }
    return acc;
  }, {});

  const cards = Object.values(cardMap)
    .map((card) => ({
      ...card,
      campaign_names: [...card.campaign_names].sort((left, right) => left.localeCompare(right)),
      versions: [...card.versions].sort((left, right) => right.version - left.version),
    }))
    .sort((left, right) => left.account_name.localeCompare(right.account_name));

  return { cards, recipientsByAccount };
}

export async function fetchGeneratedContentWorkspaceData(): Promise<GeneratedContentWorkspaceData> {
  const [jobs, generatedRows] = await Promise.all([
    prisma.generationJob.findMany({
      orderBy: { created_at: 'desc' },
      take: 150,
      select: { account_name: true, status: true },
    }),
    fetchGeneratedRows(),
  ]);

  const accountsWithGenerated = Array.from(new Set(generatedRows.map((row) => row.account_name)));
  const recipients = accountsWithGenerated.length > 0
    ? await prisma.persona.findMany({
        where: {
          account_name: { in: accountsWithGenerated },
          email: { not: null },
        },
        select: {
          id: true,
          account_name: true,
          name: true,
          normalized_name: true,
          email: true,
          title: true,
          role_in_deal: true,
          email_confidence: true,
          quality_score: true,
          last_enriched_at: true,
          email_valid: true,
          company_domain: true,
          hubspot_contact_id: true,
          do_not_contact: true,
        },
        orderBy: [{ account_name: 'asc' }, { name: 'asc' }],
      })
    : [];

  const canonicalWorkspace = accountsWithGenerated.length > 0
    ? await ensureCanonicalRecords({ accountNames: accountsWithGenerated })
    : null;

  return buildGeneratedContentWorkspaceData(
    generatedRows,
    jobs as GenerationJobRecord[],
    recipients as PersonaRecord[],
    canonicalWorkspace?.contactsByPersonaId as Map<number, { status: 'resolved' | 'conflict' | 'unresolved'; conflictCodes: string[]; sendBlockReason: string | null }> | undefined,
  );
}

export function computeGenerationQueueStats(jobs: Array<{ status: string }>) {
  return {
    pending: jobs.filter((j) => j.status === 'pending').length,
    processing: jobs.filter((j) => j.status === 'processing').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };
}
