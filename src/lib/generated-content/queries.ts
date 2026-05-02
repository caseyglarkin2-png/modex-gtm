import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/data';
import type { QueueGeneratedAccountCard } from '@/components/queue/generated-content-grid';

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
  created_at: Date;
  campaign_id: number | null;
  campaign: { name: string } | null;
};

export type PersonaRecord = {
  id: number;
  account_name: string;
  name: string;
  email: string | null;
  title: string | null;
};

export type WorkspaceRecipient = {
  id: number;
  name: string;
  email: string;
  title?: string;
};

export type GeneratedContentWorkspaceData = {
  cards: QueueGeneratedAccountCard[];
  recipientsByAccount: Record<string, WorkspaceRecipient[]>;
};

export function buildGeneratedContentWorkspaceData(
  generatedRows: GeneratedContentRecord[],
  jobs: GenerationJobRecord[],
  recipients: PersonaRecord[],
): GeneratedContentWorkspaceData {
  const recipientsByAccount = recipients.reduce<Record<string, WorkspaceRecipient[]>>((acc, persona) => {
    if (!persona.email) return acc;
    if (!acc[persona.account_name]) acc[persona.account_name] = [];
    acc[persona.account_name].push({
      id: persona.id,
      name: persona.name,
      email: persona.email,
      title: persona.title ?? undefined,
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
    prisma.generatedContent.findMany({
      where: { content_type: 'one_pager' },
      orderBy: [{ account_name: 'asc' }, { version: 'desc' }],
      take: 500,
      select: {
        id: true,
        account_name: true,
        version: true,
        provider_used: true,
        external_send_count: true,
        is_published: true,
        content: true,
        created_at: true,
        campaign_id: true,
        campaign: {
          select: { name: true },
        },
      },
    }),
  ]);

  const accountsWithGenerated = Array.from(new Set(generatedRows.map((row) => row.account_name)));
  const recipients = accountsWithGenerated.length > 0
    ? await prisma.persona.findMany({
        where: {
          account_name: { in: accountsWithGenerated },
          email: { not: null },
          do_not_contact: false,
        },
        select: {
          id: true,
          account_name: true,
          name: true,
          email: true,
          title: true,
        },
        orderBy: [{ account_name: 'asc' }, { name: 'asc' }],
      })
    : [];

  return buildGeneratedContentWorkspaceData(
    generatedRows as GeneratedContentRecord[],
    jobs as GenerationJobRecord[],
    recipients as PersonaRecord[],
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
