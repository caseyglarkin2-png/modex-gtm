import { Breadcrumb } from '@/components/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { Activity, Zap } from 'lucide-react';
import { GenerationJobList } from '@/components/queue/generation-job-list';
import { slugify } from '@/lib/data';
import { GeneratedContentGrid, type QueueGeneratedAccountCard } from '@/components/queue/generated-content-grid';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Generation Queue' };

export default async function GenerationQueuePage() {
  const [jobs, generatedRows] = await Promise.all([
    prisma.generationJob.findMany({
      orderBy: { created_at: 'desc' },
      take: 120,
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
      },
    }),
  ]);

  const stats = {
    pending: jobs.filter((j) => j.status === 'pending').length,
    processing: jobs.filter((j) => j.status === 'processing').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };

  const jobsWithCampaignNames = jobs.map((job) => ({
    ...job,
    campaign_name: undefined,
    campaign_id: job.campaign_id ?? undefined,
  } as any));

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

  const recipientsByAccount = recipients.reduce<Record<string, Array<{ id: number; name: string; email: string; title?: string }>>>((acc, persona) => {
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
        versions: [],
      };
    }

    acc[row.account_name].versions.push({
      id: row.id,
      version: row.version,
      provider_used: row.provider_used,
      external_send_count: row.external_send_count,
      is_published: row.is_published,
      content: row.content,
      created_at: row.created_at.toISOString(),
    });
    return acc;
  }, {});

  const generatedCards = Object.values(cardMap).sort((left, right) => left.account_name.localeCompare(right.account_name));

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Generation Queue' }]} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Generation Queue</h1>
          <p className="text-sm text-muted-foreground">Track one-pager generation jobs and their status.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5" />
          {jobs.length} jobs
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
