import Link from 'next/link';
import { ArrowRight, Library, Sparkles } from 'lucide-react';
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
import {
  dbGetAccounts,
  dbGetActionableIntel,
  dbGetMeetings,
  dbGetMicrositeAnalytics,
  dbGetMicrositeBatchStatus,
  dbGetPersonas,
} from '@/lib/db';
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

  const micrositeEngagement = activeTab === 'microsites'
    ? await Promise.all([dbGetMicrositeAnalytics(), dbGetMicrositeBatchStatus()])
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Studio</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Generate, review, and send every content asset from one canonical workspace.
          </p>
        </div>
        <Link href="/queue/generations">
          <Button variant="outline" size="sm" className="gap-1.5">
            Generation queue
            {summary.failedJobs > 0 ? ` · ${summary.failedJobs} failed` : ''}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total assets" value={summary.totalAssets} />
        <MetricCard label="Generated" value={summary.generated} />
        <MetricCard label="Send-ready" value={summary.sendReadyGenerated} tone="text-emerald-600" />
        <MetricCard label="Failed jobs" value={summary.failedJobs} tone={summary.failedJobs > 0 ? 'text-red-600' : 'text-emerald-600'} />
      </div>

      <UrlTabs activeTab={activeTab} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1.5 bg-transparent p-0">
          {contentStudioTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--muted)]/60 data-[state=active]:border-[var(--primary)] data-[state=active]:bg-[var(--primary)] data-[state=active]:text-[var(--primary-foreground)] data-[state=active]:shadow-none"
            >
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
            <MicrositesTab
              accounts={microsites}
              analytics={micrositeEngagement?.[0] ?? null}
              batch={micrositeEngagement?.[1] ?? null}
            />
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
