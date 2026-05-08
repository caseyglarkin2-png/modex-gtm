import Link from 'next/link';
import { ArrowRight, Library, ListChecks, Send, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/metric-card';
import { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  buildContentStudioSummary,
  contentStudioTabs,
  type ContentStudioTabId,
} from '@/lib/content-studio';
import {
  getActionableIntel,
  getAuditRoutes,
  getListsConfig,
  getMeetingBriefs,
  getQrAssets,
  getSearchStrings,
  slugify,
  type AuditRoute,
} from '@/lib/data';
import { dbGetAccounts, dbGetActionableIntel, dbGetMeetings, dbGetPersonas } from '@/lib/db';
import { fetchGeneratedContentWorkspaceData } from '@/lib/generated-content/queries';
import { getAllAccountMicrositeData } from '@/lib/microsites/accounts';
import { prisma } from '@/lib/prisma';
import { rankPlaybookBlocks } from '@/lib/revops/playbook-library';
import type { AssetSendRecipient } from '@/components/email/asset-send-dialog';
import { AuditRoutesTab } from '@/components/studio/audit-routes-tab';
import { BriefsTab } from '@/components/studio/briefs-tab';
import { GeneratedContentTab } from '@/components/studio/generated-content-tab';
import { IntelTab } from '@/components/studio/intel-tab';
import { MicrositesTab } from '@/components/studio/microsites-tab';
import { QrTab } from '@/components/studio/qr-tab';
import { SearchStringsTab } from '@/components/studio/search-strings-tab';
import { UrlTabs } from '@/components/studio/url-tabs';
import { StudioClient } from './studio-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Content Studio' };

const studioTabIds = new Set<ContentStudioTabId>(contentStudioTabs.map((tab) => tab.id));

function getDefaultTab(value: string | undefined): ContentStudioTabId {
  return studioTabIds.has(value as ContentStudioTabId) ? (value as ContentStudioTabId) : 'generate';
}

async function buildQrDataUrl(value: string, width: number) {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width,
    color: { dark: '#111827', light: '#FFFFFF' },
  });
}

export default async function StudioPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const activeTab = getDefaultTab(params.tab);

  const briefs = getMeetingBriefs();
  const searchStrings = getSearchStrings();
  const fileIntel = getActionableIntel();
  const auditRoutes = getAuditRoutes();
  const qrAssets = getQrAssets();
  const microsites = getAllAccountMicrositeData();
  const firstBrief = briefs[0];
  const firstMicrosite = microsites[0];

  const [generatedRows, jobs] = await Promise.all([
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

  const summary = buildContentStudioSummary(
    {
      generated: generatedRows.length,
      generationJobs: jobs.length,
      briefs: briefs.length,
      searchStrings: searchStrings.length,
      intel: fileIntel.length,
      auditRoutes: auditRoutes.length,
      qrAssets: qrAssets.length,
      microsites: microsites.length,
      proposals: microsites.length,
    },
    generatedRows,
    jobs,
  );

  const failedJob = jobs.find((job) => job.status === 'failed');

  const assetCards = [
    {
      label: 'Generated Content',
      count: summary.generated,
      href: '/studio?tab=generated-content',
      detail: `${summary.sendReadyGenerated} send-ready, ${summary.reviewRequiredGenerated} requiring review`,
    },
    {
      label: 'Meeting Briefs',
      count: summary.briefs,
      href: firstBrief ? `/briefs/${slugify(firstBrief.account)}` : '/studio?tab=briefs',
      detail: 'Account prep, talking points, and pain hypotheses',
    },
    {
      label: 'Search Strings',
      count: summary.searchStrings,
      href: '/studio?tab=search-strings',
      detail: 'Copyable Sales Nav, LinkedIn, and X-Ray queries',
    },
    {
      label: 'Actionable Intel',
      count: summary.intel,
      href: '/studio?tab=intel',
      detail: 'Research items with owner and status',
    },
    {
      label: 'Audit Routes',
      count: summary.auditRoutes,
      href: '/studio?tab=audit-routes',
      detail: 'Copyable URLs and audit asks',
    },
    {
      label: 'QR Assets',
      count: summary.qrAssets,
      href: '/studio?tab=qr-assets',
      detail: 'Scannable booth and leave-behind assets',
    },
    {
      label: 'Microsites',
      count: summary.microsites,
      href: firstMicrosite ? `/for/${firstMicrosite.slug}` : '/studio?tab=microsites',
      detail: 'Public account experiences and variants',
    },
    {
      label: 'Proposals',
      count: summary.proposals,
      href: firstMicrosite ? `/proposal/${firstMicrosite.slug}` : '/studio?tab=microsites',
      detail: 'Board-ready public proposal assets',
    },
  ];

  // Per-tab data — only fetched for the active tab
  const generateData = activeTab === 'generate'
    ? await Promise.all([dbGetAccounts(), dbGetPersonas()])
    : null;
  const accounts = generateData?.[0] ?? null;
  const personas = generateData?.[1] ?? null;

  const personasByAccount = personas
    ? personas.reduce<Record<string, Array<{ name: string; title: string | null }>>>((acc, persona) => {
        if (!acc[persona.account_name]) acc[persona.account_name] = [];
        acc[persona.account_name].push({ name: persona.name, title: persona.title ?? null });
        return acc;
      }, {})
    : {};
  const recipientsByAccount = personas
    ? personas.reduce<Record<string, AssetSendRecipient[]>>((acc, persona) => {
        if (!persona.email) return acc;
        if (!acc[persona.account_name]) acc[persona.account_name] = [];
        acc[persona.account_name].push({
          id: persona.id,
          name: persona.name,
          email: persona.email,
          title: persona.title ?? undefined,
          role_in_deal: persona.role_in_deal ?? undefined,
        });
        return acc;
      }, {})
    : {};

  const briefsRawMeetings = activeTab === 'briefs' ? await dbGetMeetings() : null;

  const intelRows = activeTab === 'intel' ? await dbGetActionableIntel() : null;
  const intelItems = intelRows
    ? intelRows.map((r) => ({
        id: r.id,
        account: r.account,
        slug: slugify(r.account),
        intel_type: r.intel_type,
        why_it_matters: r.why_it_matters ?? '',
        how_to_find_it: r.how_to_find ?? '',
        owner: r.owner ?? '',
        status: r.status,
        field_to_update: r.field_to_update ?? '',
      }))
    : null;

  const generatedContentData = activeTab === 'generated-content'
    ? await fetchGeneratedContentWorkspaceData()
    : null;

  const rankedPlaybookBlocks = activeTab === 'playbook'
    ? await rankPlaybookBlocks(prisma, 40)
    : null;

  // QR generation only when QR tab is active (CPU-intensive)
  const qrData = activeTab === 'qr-assets'
    ? await (async () => {
        const listsConfig = getListsConfig();
        const routesByAccount = new Map<string, AuditRoute>(
          auditRoutes.map((route) => [route.account, route]),
        );
        const fallbackQrUrl = listsConfig.qr_journey.master_url;
        const fallbackQrPreview = await buildQrDataUrl(fallbackQrUrl, 220);
        const fallbackQrPrint = await buildQrDataUrl(fallbackQrUrl, 1200);
        const qrPreviews = new Map<string, string>();
        const qrPrints = new Map<string, string>();
        await Promise.all(
          qrAssets.map(async (qr) => {
            const [preview, print] = await Promise.all([
              buildQrDataUrl(qr.audit_url, 220),
              buildQrDataUrl(qr.audit_url, 1200),
            ]);
            qrPreviews.set(qr.account, preview);
            qrPrints.set(qr.account, print);
          }),
        );
        return { listsConfig, routesByAccount, qrPreviews, qrPrints, fallbackQrPreview, fallbackQrPrint };
      })()
    : null;

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
        <MetricCard label="Total assets" value={summary.totalAssets} />
        <MetricCard label="Generated" value={summary.generated} />
        <MetricCard label="Send-ready" value={summary.sendReadyGenerated} tone="text-emerald-600" />
        <MetricCard label="Failed jobs" value={summary.failedJobs} tone={summary.failedJobs > 0 ? 'text-red-600' : 'text-emerald-600'} />
      </div>

      <UrlTabs activeTab={activeTab} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {contentStudioTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {activeTab === 'generate' ? (
          <TabsContent value="generate" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4" /> Generate
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[var(--muted-foreground)]">
                Create account-specific assets, test prompt versions, rehearse delivery, and hand off campaign-ready content.
              </CardContent>
            </Card>
            <StudioClient
              accounts={(accounts ?? []).map((account) => ({
                name: account.name,
                vertical: account.vertical,
                priority_band: account.priority_band,
              }))}
              personasByAccount={personasByAccount}
              recipientsByAccount={recipientsByAccount}
            />
          </TabsContent>
        ) : null}

        {activeTab === 'library' ? (
          <TabsContent value="library" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Library className="h-4 w-4" /> Asset Library
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {assetCards.map((asset) => (
                  <Link key={asset.label} href={asset.href} className="rounded-lg border p-4 transition-colors hover:bg-[var(--muted)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{asset.label}</p>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{asset.detail}</p>
                      </div>
                      <Badge variant="outline">{asset.count}</Badge>
                    </div>
                    <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)]">
                      Open asset <ArrowRight className="h-3 w-3" />
                    </p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {activeTab === 'generated-content' && generatedContentData ? (
          <TabsContent value="generated-content" className="space-y-4">
            <GeneratedContentTab
              cards={generatedContentData.cards}
              recipientsByAccount={generatedContentData.recipientsByAccount}
            />
          </TabsContent>
        ) : null}

        {activeTab === 'briefs' ? (
          <TabsContent value="briefs" className="space-y-4">
            <BriefsTab briefs={briefs} rawMeetings={briefsRawMeetings ?? []} />
          </TabsContent>
        ) : null}

        {activeTab === 'search-strings' ? (
          <TabsContent value="search-strings" className="space-y-4">
            <SearchStringsTab strings={searchStrings} />
          </TabsContent>
        ) : null}

        {activeTab === 'intel' && intelItems ? (
          <TabsContent value="intel" className="space-y-4">
            <IntelTab items={intelItems} />
          </TabsContent>
        ) : null}

        {activeTab === 'audit-routes' ? (
          <TabsContent value="audit-routes" className="space-y-4">
            <AuditRoutesTab routes={auditRoutes} />
          </TabsContent>
        ) : null}

        {activeTab === 'qr-assets' && qrData ? (
          <TabsContent value="qr-assets" className="space-y-4">
            <QrTab
              assets={qrAssets}
              listsConfig={qrData.listsConfig}
              routesByAccount={qrData.routesByAccount}
              qrPreviews={qrData.qrPreviews}
              qrPrints={qrData.qrPrints}
              fallbackQrPreview={qrData.fallbackQrPreview}
              fallbackQrPrint={qrData.fallbackQrPrint}
            />
          </TabsContent>
        ) : null}

        {activeTab === 'microsites' ? (
          <TabsContent value="microsites" className="space-y-4">
            <MicrositesTab accounts={microsites} />
          </TabsContent>
        ) : null}

        {activeTab === 'queue' ? (
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
                      <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">{status}</p>
                      <p className="mt-1 text-2xl font-bold">{jobs.filter((job) => job.status === status).length}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm text-[var(--muted-foreground)]">
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
        ) : null}

        {activeTab === 'send-readiness' ? (
          <TabsContent value="send-readiness" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Send className="h-4 w-4" /> Send Readiness
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <MetricCard variant="plain" size="md" label="Published, unsent" value={summary.sendReadyGenerated} tone="text-emerald-600" />
                  <MetricCard variant="plain" size="md" label="Needs review" value={summary.reviewRequiredGenerated} tone="text-amber-600" />
                  <MetricCard variant="plain" size="md" label="Already sent" value={generatedRows.filter((row) => row.external_send_count > 0).length} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm text-[var(--muted-foreground)]">
                  <p>Generated one-pagers keep their existing filters, recipient selection, publish, preview, and send controls.</p>
                  <Link href="/studio?tab=generated-content">
                    <Button size="sm" className="gap-1.5">
                      Review Generated Content <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {activeTab === 'playbook' && rankedPlaybookBlocks ? (
          <TabsContent value="playbook" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Library className="h-4 w-4" /> Playbook Block Rankings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rankedPlaybookBlocks.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)]">No playbook blocks have been saved yet.</p>
                ) : rankedPlaybookBlocks.map((block) => (
                  <div key={block.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{block.title}</p>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{block.block_type} · {(block.tags ?? []).join(' · ') || 'untagged'}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">score {block.performance.score.toFixed(2)}</Badge>
                        <Badge variant="outline">confidence {(block.performance.confidence * 100).toFixed(0)}%</Badge>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-[var(--muted-foreground)] md:grid-cols-4">
                      <p>Sends: {block.performance.sends}</p>
                      <p>Replies: {block.performance.replies}</p>
                      <p>Meetings: {block.performance.meetings}</p>
                      <p>Weight: {block.performance.outcomeWeight.toFixed(2)}x</p>
                    </div>
                    <p className="mt-2 line-clamp-3 text-xs text-[var(--muted-foreground)]">{block.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </UrlTabs>
    </div>
  );
}
