import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  buildContentStudioSummary,
  contentAssetTypes,
  contentStudioTabs,
  type ContentStudioTabId,
} from '@/lib/content-studio';
import { getActionableIntel, getAuditRoutes, getMeetingBriefs, getQrAssets, getSearchStrings, slugify } from '@/lib/data';
import { StudioClient } from './studio-client';
import { dbGetAccounts, dbGetPersonas } from '@/lib/db';
import { getAllAccountMicrositeData } from '@/lib/microsites/accounts';
import { prisma } from '@/lib/prisma';
import { ArrowRight, Copy, FileText, Library, ListChecks, Send, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Content Studio' };

const studioTabIds = new Set<ContentStudioTabId>(contentStudioTabs.map((tab) => tab.id));

function getDefaultTab(value: string | undefined): ContentStudioTabId {
  return studioTabIds.has(value as ContentStudioTabId) ? (value as ContentStudioTabId) : 'generate';
}

export default async function StudioPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const defaultTab = getDefaultTab(params.tab);
  const [accounts, personas, generatedRows, jobs] = await Promise.all([
    dbGetAccounts(),
    dbGetPersonas(),
    prisma.generatedContent.findMany({
      where: { content_type: 'one_pager' },
      orderBy: { created_at: 'desc' },
      take: 500,
      select: { account_name: true, is_published: true, external_send_count: true, created_at: true },
    }),
    prisma.generationJob.findMany({
      orderBy: { created_at: 'desc' },
      take: 150,
      select: { account_name: true, status: true, retry_count: true, error_message: true },
    }),
  ]);

  const personasByAccount = personas.reduce<Record<string, Array<{ name: string; title: string | null }>>>((acc, persona) => {
    if (!acc[persona.account_name]) acc[persona.account_name] = [];
    acc[persona.account_name].push({ name: persona.name, title: persona.title ?? null });
    return acc;
  }, {});

  const briefs = getMeetingBriefs();
  const searchStrings = getSearchStrings();
  const intel = getActionableIntel();
  const auditRoutes = getAuditRoutes();
  const qrAssets = getQrAssets();
  const microsites = getAllAccountMicrositeData();
  const firstBrief = briefs[0];
  const firstMicrosite = microsites[0];

  const summary = buildContentStudioSummary(
    {
      generated: generatedRows.length,
      generationJobs: jobs.length,
      briefs: briefs.length,
      searchStrings: searchStrings.length,
      intel: intel.length,
      auditRoutes: auditRoutes.length,
      qrAssets: qrAssets.length,
      microsites: microsites.length,
      proposals: microsites.length,
    },
    generatedRows,
    jobs,
  );

  const assetCards = [
    {
      label: 'Generated Content',
      count: summary.generated,
      href: '/generated-content',
      detail: `${summary.sendReadyGenerated} send-ready, ${summary.reviewRequiredGenerated} requiring review`,
    },
    {
      label: 'Meeting Briefs',
      count: summary.briefs,
      href: firstBrief ? `/briefs/${slugify(firstBrief.account)}` : '/briefs',
      detail: 'Account prep, talking points, and pain hypotheses',
    },
    {
      label: 'Search Strings',
      count: summary.searchStrings,
      href: '/search',
      detail: 'Copyable Sales Nav, LinkedIn, and X-Ray queries',
    },
    {
      label: 'Actionable Intel',
      count: summary.intel,
      href: '/intel',
      detail: 'Research items with owner and status',
    },
    {
      label: 'Audit Routes',
      count: summary.auditRoutes,
      href: '/audit-routes',
      detail: 'Copyable URLs and audit asks',
    },
    {
      label: 'QR Assets',
      count: summary.qrAssets,
      href: '/qr',
      detail: 'Scannable booth and leave-behind assets',
    },
    {
      label: 'Microsites',
      count: summary.microsites,
      href: firstMicrosite ? `/for/${firstMicrosite.slug}` : '/for',
      detail: 'Public account experiences and variants',
    },
    {
      label: 'Proposals',
      count: summary.proposals,
      href: firstMicrosite ? `/proposal/${firstMicrosite.slug}` : '/for',
      detail: 'Board-ready public proposal assets',
    },
  ];

  const failedJob = jobs.find((job) => job.status === 'failed');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Content Studio' }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content Studio</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Generate, find, review, queue, and send-ready every content asset from one canonical workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <ContentMetricCard label="Total assets" value={summary.totalAssets} />
        <ContentMetricCard label="Generated" value={summary.generated} />
        <ContentMetricCard label="Send-ready" value={summary.sendReadyGenerated} tone="text-emerald-600" />
        <ContentMetricCard label="Failed jobs" value={summary.failedJobs} tone={summary.failedJobs > 0 ? 'text-red-600' : 'text-emerald-600'} />
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {contentStudioTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4" /> Generate
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Create account-specific assets, test prompt versions, rehearse delivery, and hand off campaign-ready content.
            </CardContent>
          </Card>
          <StudioClient
            accounts={accounts.map((account) => ({
              name: account.name,
              vertical: account.vertical,
              priority_band: account.priority_band,
            }))}
            personasByAccount={personasByAccount}
          />
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Library className="h-4 w-4" /> Asset Library
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {assetCards.map((asset) => (
                <Link key={asset.label} href={asset.href} className="rounded-lg border p-4 transition-colors hover:bg-muted">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{asset.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{asset.detail}</p>
                    </div>
                    <Badge variant="outline">{asset.count}</Badge>
                  </div>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Open asset <ArrowRight className="h-3 w-3" />
                  </p>
                </Link>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="h-4 w-4" /> Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                {['pending', 'processing', 'completed', 'failed'].map((status) => (
                  <div key={status} className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{status}</p>
                    <p className="mt-1 text-2xl font-bold">{jobs.filter((job) => job.status === status).length}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm text-muted-foreground">
                <p>
                  {failedJob
                    ? `${failedJob.account_name} has a failed generation job with retry history available.`
                    : 'Generation retry paths remain available from the queue workspace.'}
                </p>
                <Link href="/queue/generations">
                  <Button size="sm" className="gap-1.5">
                    Open Generation Queue <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send-readiness" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Send className="h-4 w-4" /> Send Readiness
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <ContentReadinessCard label="Published, unsent" value={summary.sendReadyGenerated} tone="text-emerald-600" />
                <ContentReadinessCard label="Needs review" value={summary.reviewRequiredGenerated} tone="text-amber-600" />
                <ContentReadinessCard label="Already sent" value={generatedRows.filter((row) => row.external_send_count > 0).length} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm text-muted-foreground">
                <p>Generated one-pagers keep their existing filters, recipient selection, publish, preview, and send controls.</p>
                <Link href="/generated-content">
                  <Button size="sm" className="gap-1.5">
                    Review Generated Content <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asset-types" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" /> Asset Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contentAssetTypes.map((asset) => (
                <div key={asset.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{asset.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{asset.routeBehavior}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>Owner: {asset.owner}</Badge>
                      <Badge variant="outline">{contentStudioTabs.find((tab) => tab.id === asset.canonicalTab)?.label}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Copy className="h-3 w-3" /> {asset.legacyRoutes.join(', ')}
                    </span>
                    <span>{asset.statusBehavior}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ContentMetricCard({ label, value, tone = 'text-[var(--foreground)]' }: { label: string; value: number; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function ContentReadinessCard({ label, value, tone = 'text-[var(--foreground)]' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-lg border p-4 text-center">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
