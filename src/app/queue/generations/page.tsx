import { Breadcrumb } from '@/components/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { Activity, Zap } from 'lucide-react';
import { GenerationJobList } from '@/components/queue/generation-job-list';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Generation Queue' };

export default async function GenerationQueuePage() {
  const jobs = await prisma.generationJob.findMany({
    orderBy: { created_at: 'desc' },
    take: 100,
  });

  const stats = {
    pending: jobs.filter((j) => j.status === 'pending').length,
    processing: jobs.filter((j) => j.status === 'processing').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };

  const jobsWithCampaignNames = jobs.map((job) => ({
    ...job,
    campaign_name: undefined,
  }));

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
    </div>
  );
}
