import { Breadcrumb } from '@/components/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { Activity, Zap } from 'lucide-react';
import Link from 'next/link';
import { GenerationJobList, type GenerationJobRow } from '@/components/queue/generation-job-list';
import { GeneratedContentGrid } from '@/components/queue/generated-content-grid';
import { buildGeneratedContentWorkspaceData, computeGenerationQueueStats } from '@/lib/generated-content/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Generation Queue' };

function normalizeJobStatus(status: string): GenerationJobRow['status'] {
  if (status === 'pending' || status === 'processing' || status === 'completed' || status === 'failed') {
    return status;
  }
  return 'pending';
}

export default async function GenerationQueuePage() {
  const [jobs, generatedRows, recipients] = await Promise.all([
    prisma.generationJob.findMany({
      orderBy: { created_at: 'desc' },
      take: 120,
      include: {
        campaign: {
          select: { name: true },
        },
      },
    }),
    prisma.generatedContent.findMany({
      where: { content_type: 'one_pager' },
      orderBy: [{ account_name: 'asc' }, { version: 'desc' }],
      take: 300,
      select: {
        id: true,
        account_name: true,
        version: true,
        provider_used: true,
        external_send_count: true,
        is_published: true,
        created_at: true,
        content: true,
        campaign_id: true,
        campaign: {
          select: { name: true },
        },
      },
    }),
    prisma.persona.findMany({
      where: { email: { not: null }, do_not_contact: false },
      select: {
        id: true,
        account_name: true,
        name: true,
        email: true,
        title: true,
      },
      orderBy: [{ account_name: 'asc' }, { name: 'asc' }],
    }),
  ]);

  const stats = computeGenerationQueueStats(jobs);
  const accountsWithGenerated = new Set(generatedRows.map((row) => row.account_name));
  const recipientsForGeneratedAccounts = recipients.filter((recipient) => accountsWithGenerated.has(recipient.account_name));
  const { cards: generatedCards, recipientsByAccount } = buildGeneratedContentWorkspaceData(generatedRows, jobs, recipientsForGeneratedAccounts);
  const jobsWithCampaignNames: GenerationJobRow[] = jobs.map((job) => ({
    id: job.id,
    account_name: job.account_name,
    campaign_id: job.campaign_id ?? undefined,
    persona_name: job.persona_name ?? undefined,
    content_type: job.content_type,
    status: normalizeJobStatus(job.status),
    provider_used: job.provider_used ?? undefined,
    error_message: job.error_message ?? undefined,
    retry_count: job.retry_count,
    created_at: job.created_at.toISOString(),
    completed_at: job.completed_at?.toISOString(),
    campaign_name: job.campaign?.name ?? undefined,
  }));

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Generation Queue' }]} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Generation Queue</h1>
          <p className="text-sm text-muted-foreground">Track one-pager generation jobs and their status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/generated-content"
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
          >
            <Zap className="h-3.5 w-3.5" />
            Generated Content
          </Link>
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            {jobs.length} jobs
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{stats.processing}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Job List</h2>
        <GenerationJobList jobs={jobsWithCampaignNames} />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Generated Content</h2>
        <GeneratedContentGrid cards={generatedCards} recipientsByAccount={recipientsByAccount} />
      </div>
    </div>
  );
}
