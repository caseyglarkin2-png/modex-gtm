export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getWavesByAccount,
  getMeetingBriefByAccount,
  slugify,
  getAuditRoutes,
  getQrAssets,
} from '@/lib/data';
import { dbGetAccountByName, dbGetAccounts, dbGetActivitiesByAccount, dbGetMicrositeAccountAnalytics, dbGetPersonasByAccount } from '@/lib/db';
import {
  accountCommandTabs,
  buildAccountNextBestAction,
  buildAccountTimeline,
  type AccountCommandTabId,
} from '@/lib/account-command-center';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { BandBadge } from '@/components/band-badge';
import { StatusBadge } from '@/components/status-badge';
import { CopyButton } from '@/components/copy-button';
import { EmptyState } from '@/components/empty-state';
import { ExternalLink, Users, FileText, Activity, Calendar, Inbox, ListTodo, GitBranch, BriefcaseBusiness } from 'lucide-react';
import { LogActivityDialog } from '@/components/log-activity-dialog';
import { BookMeetingDialog } from '@/components/book-meeting-dialog';
import { GeneratorDialog } from '@/components/ai/generator-dialog';
import { EmailComposer } from '@/components/email/composer';
import { OnePagerDialog } from '@/components/ai/one-pager-preview';
import { OutreachSequenceDialog } from '@/components/ai/outreach-sequence';
import { OutreachWizard } from '@/components/outreach-wizard';
import { Breadcrumb } from '@/components/breadcrumb';
import { AddPersonaDialog } from '@/components/add-persona-dialog';
import { EditableStatus } from '@/components/editable-status';
import { EditablePersonaStatus } from '@/components/editable-persona-status';
import { VoiceScriptButton } from '@/components/voice-script-button';
import type { RecentMicrositeSession } from '@/lib/microsites/analytics';
import { ensureMicrositeForAccount } from '@/lib/microsites/ensure-microsite';
import { prisma } from '@/lib/prisma';
import { buildAccountTags } from '@/lib/research/account-tags';
import { evaluateContentQuality } from '@/lib/content-quality';
import { resolveContentQaChecklist } from '@/lib/revops/content-qa-checklist';
import { computeRecipientReadiness } from '@/lib/revops/recipient-readiness';
import { parseInfographicMetadata, type JourneyStageIntent } from '@/lib/revops/infographic-journey';
import { formatCanonicalConflictLabel } from '@/lib/revops/canonical-records';
import { ensureCanonicalRecords } from '@/lib/revops/canonical-sync';
import { InfographicJourneyControls } from '@/components/revops/infographic-journey-controls';
import { AccountGeneratedAssetActions } from '@/components/accounts/account-generated-asset-actions';

export default async function AccountDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const accounts = await dbGetAccounts();
  const matchedAccount = accounts.find((candidate) => slugify(candidate.name) === slug);
  const account = matchedAccount ? await dbGetAccountByName(matchedAccount.name) : null;
  if (!account) notFound();

  const personas = await dbGetPersonasByAccount(account.name);
  const waves = getWavesByAccount(account.name);
  const brief = getMeetingBriefByAccount(account.name);
  const auditRoutes = getAuditRoutes();
  const auditRoute = auditRoutes.find((r) => r.account === account.name);
  const qrAsset = getQrAssets().find((asset) => asset.account === account.name);
  const [microsite, rawActivities, activeCampaigns, generatedAssetRows, emailLogs, meetings, captures, canonicalWorkspace] = await Promise.all([
    dbGetMicrositeAccountAnalytics(account.name),
    dbGetActivitiesByAccount(account.name),
    prisma.campaign.findMany({
      where: { status: 'active' },
      orderBy: [{ start_date: 'desc' }, { created_at: 'desc' }],
      take: 6,
      select: { slug: true, name: true, messaging_angle: true, campaign_type: true },
    }),
    prisma.generatedContent.findMany({
      where: { account_name: account.name },
      orderBy: { created_at: 'desc' },
      take: 8,
      select: {
        id: true,
        content_type: true,
        persona_name: true,
        provider_used: true,
        is_published: true,
        external_send_count: true,
        version: true,
        campaign_id: true,
        campaign: {
          select: {
            campaign_type: true,
          },
        },
        checklist_state: {
          select: {
            completed_item_ids: true,
          },
        },
        version_metadata: true,
        content: true,
        created_at: true,
      },
    }),
    prisma.emailLog.findMany({
      where: { account_name: account.name },
      orderBy: { sent_at: 'desc' },
      take: 12,
      select: { id: true, subject: true, status: true, to_email: true, reply_count: true, sent_at: true },
    }),
    prisma.meeting.findMany({
      where: { account_name: account.name },
      orderBy: [{ meeting_date: 'desc' }, { created_at: 'desc' }],
      take: 8,
      select: { id: true, meeting_status: true, persona: true, meeting_date: true, meeting_time: true, location: true, objective: true, post_next_step: true, notes: true, created_at: true },
    }),
    prisma.mobileCapture.findMany({
      where: { account_name: account.name },
      orderBy: { captured_at: 'desc' },
      take: 8,
      select: { id: true, title: true, intent: true, next_step: true, captured_at: true, owner: true, heat_score: true },
    }),
    ensureCanonicalRecords({ accountNames: [account.name] }),
  ]);
  const activities = rawActivities.map((activity) => ({
    ...activity,
    activityDateLabel: activity.activity_date ? formatActivityDate(activity.activity_date) : '',
    nextStepDueLabel: activity.next_step_due ? formatActivityDate(activity.next_step_due) : '',
  }));
  const micrositeOverviewPath = `/for/${slug}`;
  const micrositeInfo = ensureMicrositeForAccount(account.name);
  const generatedAssets = generatedAssetRows.map((asset) => {
    const checklist = resolveContentQaChecklist({
      campaignType: asset.campaign?.campaign_type,
      completedItemIds: asset.checklist_state?.completed_item_ids ?? [],
      content: asset.content,
      accountName: account.name,
    });
    return {
      ...asset,
      campaign_type: asset.campaign?.campaign_type,
      quality: evaluateContentQuality(asset.content, account.name),
      checklist,
      checklist_completed_item_ids: checklist.completedItemIds,
    };
  });
  const canonicalAccountSummary = canonicalWorkspace.accountSummaries.get(account.name) ?? null;
  const accountRecipients = personas
    .filter((persona) => Boolean(persona.email))
    .map((persona) => {
      const canonical = canonicalWorkspace.contactsByPersonaId.get(persona.id);
      return {
        id: persona.id,
        name: persona.name,
        email: persona.email!,
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
        canonicalConflicts: canonical?.conflictCodes.map(formatCanonicalConflictLabel) ?? [],
        canonicalBlockedReason: canonical?.sendBlockReason,
      };
    });
  const latestSendableAsset = generatedAssets.find((asset) => isSendableAccountAsset(asset.content_type)) ?? null;
  const openTaskCount = Number(Boolean(account.next_action)) + activities.filter((activity) => Boolean(activity.next_step)).length + captures.filter((capture) => Boolean(capture.next_step)).length;
  const assetCount = Number(Boolean(brief)) + Number(Boolean(auditRoute)) + Number(Boolean(qrAsset)) + generatedAssets.length + 1;
  const nextBestAction = buildAccountNextBestAction(account, {
    contactCount: personas.length,
    assetCount,
    openTaskCount,
  });
  const timeline = buildAccountTimeline({
    activities: rawActivities,
    emails: emailLogs,
    meetings,
    micrositeSessions: microsite.recentSessions,
    captures,
  });
  const journeyActivities = rawActivities
    .filter((activity) => activity.activity_type === 'Infographic Journey')
    .slice(0, 6);
  const latestInfographic = generatedAssets[0] ? parseInfographicMetadata(generatedAssets[0].version_metadata) : null;
  const initialJourneyStage = (latestInfographic?.stageIntent ?? 'cold') as JourneyStageIntent;

  const scoreDims = [
    { label: 'ICP Fit', value: account.icp_fit, weight: 30 },
    { label: 'MODEX Signal', value: account.modex_signal, weight: 20 },
    { label: 'Primo Story', value: account.primo_story_fit, weight: 20 },
    { label: 'Warm Intro', value: account.warm_intro, weight: 15 },
    { label: 'Strategic Value', value: account.strategic_value, weight: 10 },
    { label: 'Meeting Ease', value: account.meeting_ease, weight: 5 },
  ];

  const accountTags = buildAccountTags(account);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Accounts', href: '/accounts' }, { label: account.name }]} />

      {/* Hero Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{account.name}</h1>
                <BandBadge band={account.priority_band} />
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {account.parent_brand} &middot; {account.vertical} &middot; {account.signal_type}
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--foreground)]">Account Command Center</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono">{account.tier}</Badge>
              <Badge variant="outline" className="font-mono">Score: {account.priority_score}</Badge>
              <Badge variant="secondary">{account.owner}</Badge>
              <OnePagerDialog
                accountName={account.name}
                trigger={
                  <Button size="sm" className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700">
                    <FileText className="h-3.5 w-3.5" />
                    Generate One-Pager
                  </Button>
                }
              />
              {latestSendableAsset ? (
                <AccountGeneratedAssetActions
                  accountName={account.name}
                  asset={latestSendableAsset}
                  recipients={accountRecipients}
                  showPreview={false}
                  sendLabel="Send Latest Asset"
                />
              ) : null}
              <OutreachWizard
                accountName={account.name}
                micrositeUrl={micrositeInfo.url}
                personas={personas.map((p) => ({
                  name: p.name,
                  title: p.title ?? undefined,
                  priority: p.priority,
                  email: p.email ?? undefined,
                }))}
                campaigns={activeCampaigns.map((campaign) => ({
                  slug: campaign.slug,
                  name: campaign.name,
                  messagingAngle: campaign.messaging_angle,
                  campaignType: campaign.campaign_type,
                }))}
                trigger={
                  <Button size="sm" className="gap-1.5 bg-cyan-600 text-white hover:bg-cyan-700">
                    <Activity className="h-3.5 w-3.5" />
                    Launch Outreach
                  </Button>
                }
              />
              <OutreachSequenceDialog
                accountName={account.name}
                personas={personas.map((p) => ({ name: p.name, title: p.title ?? undefined, priority: p.priority }))}
                campaignSlug={activeCampaigns[0]?.slug}
                trigger={
                  <Button size="sm" className="gap-1.5 bg-amber-600 text-white hover:bg-amber-700">
                    <Activity className="h-3.5 w-3.5" />
                    Generate Outreach
                  </Button>
                }
              />
              <BookMeetingDialog
                accountName={account.name}
                personas={personas.map((p) => ({ name: p.name, priority: p.priority }))}
                calendlyLink={process.env.NEXT_PUBLIC_CALENDLY_LINK}
              />
              <LogActivityDialog
                accountName={account.name}
                personas={personas.map((p) => ({ name: p.name }))}
              />
            </div>
          </div>

          <Separator className="my-4" />

          {/* Status Row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--muted-foreground)]">Research:</span>
              <EditableStatus accountName={account.name} field="research_status" currentValue={account.research_status} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--muted-foreground)]">Outreach:</span>
              <EditableStatus accountName={account.name} field="outreach_status" currentValue={account.outreach_status} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--muted-foreground)]">Meeting:</span>
              <EditableStatus accountName={account.name} field="meeting_status" currentValue={account.meeting_status} />
            </div>
            {account.hubspot_company_id && (
              <a
                href={`https://app.hubspot.com/contacts/${process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || ''}/company/${account.hubspot_company_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View in HubSpot
              </a>
            )}
          </div>

          {/* Score Dimensions */}
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {scoreDims.map((dim) => (
              <div key={dim.label} className="rounded-lg border border-[var(--border)] p-2.5 text-center">
                <p className="text-[10px] text-[var(--muted-foreground)]">{dim.label} ({dim.weight}%)</p>
                <p className="mt-0.5 text-lg font-bold">{dim.value}<span className="text-xs font-normal text-[var(--muted-foreground)]">/5</span></p>
              </div>
            ))}
          </div>

          {/* Research-backed tags (facility fact, vertical, signal, etc.) */}
          <div className="mt-4 flex flex-wrap gap-2">
            {accountTags.map((tag) => (
              <Badge key={`${tag.label}-${tag.value}`} variant="outline" className="flex items-center gap-1">
                <span className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">{tag.label}</span>
                <span className="font-medium">{tag.value}</span>
                {tag.hint ? <span className="text-[10px] text-[var(--muted-foreground)]">({tag.hint})</span> : null}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          {accountCommandTabs.map((tab) => {
            const Icon = accountTabIcon(tab.id);
            const count = tab.id === 'contacts'
              ? personas.length
              : tab.id === 'assets'
                ? assetCount
                : tab.id === 'engagement'
                  ? timeline.length
                  : tab.id === 'tasks'
                    ? openTaskCount
                    : tab.id === 'meetings'
                      ? meetings.length
                      : tab.id === 'pipeline'
                        ? waves.length
                        : null;

            return (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-1">
                <Icon className="h-3.5 w-3.5" />
                {tab.label}{count !== null ? ` (${count})` : ''}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Next Best Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={nextBestAction.tone === 'ready' ? 'success' : nextBestAction.tone === 'blocked' ? 'destructive' : 'warning'}>
                      {nextBestAction.tone}
                    </Badge>
                    <p className="font-medium">{nextBestAction.label}</p>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{nextBestAction.detail}</p>
                </div>
                <Link href={nextBestAction.route}>
                  <Button size="sm" variant="outline">Open work</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          {canonicalAccountSummary ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Canonical Record Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Company Source</p>
                    <p className="mt-1 font-medium">{canonicalAccountSummary.canonicalCompanySource.replaceAll('_', ' ')}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Linked Contacts</p>
                    <p className="mt-1 font-medium">{canonicalAccountSummary.linkedContacts}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Contacts With Email</p>
                    <p className="mt-1 font-medium">{canonicalAccountSummary.sendableContacts}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Unresolved Conflicts</p>
                    <p className={`mt-1 font-medium ${canonicalAccountSummary.unresolvedConflicts > 0 ? 'text-amber-700' : ''}`}>
                      {canonicalAccountSummary.unresolvedConflicts}
                    </p>
                  </div>
                </div>
                {canonicalAccountSummary.duplicateCompanyAccounts.length > 0 ? (
                  <p className="text-xs text-amber-700">
                    Canonical company collision with: {canonicalAccountSummary.duplicateCompanyAccounts.join(', ')}.
                  </p>
                ) : (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Canonical company id: {canonicalAccountSummary.canonicalCompanyId ?? 'not resolved'}.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Why Now</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{account.why_now}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Primo Angle</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{account.primo_angle}</p></CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Microsite Engagement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {microsite.totalSessions === 0 ? (
                <div className="rounded-lg border border-dashed border-[var(--border)] p-4">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No tracked microsite sessions for {account.name} yet. The public overview page is instrumented and ready.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={micrositeOverviewPath} className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline">
                      Open overview microsite <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border border-[var(--border)] p-3">
                      <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Sessions</p>
                      <p className="mt-1 text-xl font-bold">{microsite.totalSessions}</p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{microsite.highIntentSessions} high-intent</p>
                    </div>
                    <div className="rounded-lg border border-[var(--border)] p-3">
                      <p className="text-[10px] uppercase text-[var(--muted-foreground)]">CTA Sessions</p>
                      <p className="mt-1 text-xl font-bold">{microsite.ctaSessions}</p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">Buyer action windows</p>
                    </div>
                    <div className="rounded-lg border border-[var(--border)] p-3">
                      <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Average Scroll</p>
                      <p className="mt-1 text-xl font-bold">{microsite.avgScrollDepthPct}%</p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">Depth across tracked sessions</p>
                    </div>
                    <div className="rounded-lg border border-[var(--border)] p-3">
                      <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Average Read</p>
                      <p className="mt-1 text-xl font-bold">{formatMicrositeDuration(microsite.avgDurationSeconds)}</p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">Time spent on page</p>
                    </div>
                  </div>

                  {microsite.accountSummary && (
                    <div className="rounded-lg border border-[var(--border)] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{microsite.accountSummary.primarySignal}</p>
                            <MicrositeAccountHeatBadge score={microsite.accountSummary.engagementScore} />
                          </div>
                          <p className="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">
                            {microsite.accountSummary.recommendedAction}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link href={microsite.accountSummary.lastPath} className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline">
                            Open latest microsite <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                        Last seen {formatMicrositeTimestamp(microsite.accountSummary.lastViewedAt)}
                        {microsite.accountSummary.lastPersonName ? ` · Latest viewer: ${microsite.accountSummary.lastPersonName}` : ''}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Recent Sessions</p>
                      <Link href={micrositeOverviewPath} className="text-xs font-medium text-[var(--primary)] hover:underline">
                        Open overview microsite
                      </Link>
                    </div>
                    {microsite.recentSessions.slice(0, 4).map((session) => (
                      <MicrositeSessionRow key={`${session.path}-${session.viewedAt.toISOString()}`} session={session} />
                    ))}
                  </div>

                  {microsite.variants.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Variant Performance</p>
                      <div className="space-y-2">
                        {microsite.variants.map((variant) => (
                          <div key={variant.path} className="rounded-lg border border-[var(--border)] p-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Link href={variant.path} className="text-sm font-medium text-[var(--primary)] hover:underline">
                                    {variant.label}
                                  </Link>
                                  {variant.ctaSessions > 0 ? (
                                    <Badge className="bg-emerald-600 text-white">CTA active</Badge>
                                  ) : variant.highIntentSessions > 0 ? (
                                    <Badge className="bg-amber-500 text-white">High intent</Badge>
                                  ) : (
                                    <Badge variant="outline">Watch</Badge>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                                  {variant.sessionCount} sessions · {variant.highIntentSessions} high-intent · {variant.ctaSessions} CTA sessions
                                </p>
                              </div>
                              <div className="text-right text-xs text-[var(--muted-foreground)]">
                                <p>{variant.avgScrollDepthPct}% scroll</p>
                                <p>{formatMicrositeDuration(variant.avgDurationSeconds)} average read</p>
                                <p>{formatMicrositeTimestamp(variant.lastViewedAt)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-[var(--muted-foreground)]">Best Intro Path</CardTitle></CardHeader>
              <CardContent><p className="text-sm font-medium">{account.best_intro_path}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-[var(--muted-foreground)]">Current Motion</CardTitle></CardHeader>
              <CardContent><p className="text-sm font-medium">{account.current_motion}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-[var(--muted-foreground)]">Next Action</CardTitle></CardHeader>
              <CardContent><p className="text-sm font-medium">{account.next_action}</p></CardContent>
            </Card>
          </div>
          {account.notes && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{account.notes}</p></CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-3">
          <div className="flex justify-end">
            <AddPersonaDialog accountName={account.name} />
          </div>
          {personas.length === 0 ? (
            <EmptyState title="No contacts mapped" description="Contacts will appear here once added." />
          ) : (
            personas.map((p) => (
              <Card key={p.persona_id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {p.linkedin_url ? (
                            <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline inline-flex items-center gap-1">
                              {p.name} <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : p.name}
                        </span>
                        <Badge variant={p.priority === 'P1' ? 'default' : 'secondary'} className="text-xs">{p.priority}</Badge>
                        <EditablePersonaStatus personaId={p.persona_id} currentValue={p.persona_status ?? 'Not started'} />
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{p.title}</p>
                      {p.email && (
                        <p className="mt-0.5 text-xs">
                          <CopyButton text={p.email} className="text-[var(--primary)] hover:underline" />
                        </p>
                      )}
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">Lane: {p.persona_lane} &middot; {p.role_in_deal} &middot; {p.seniority}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <GeneratorDialog accountName={account.name} personaName={p.name} personaEmail={p.email ?? undefined} defaultType="email" />
                      <EmailComposer accountName={account.name} personaName={p.name} personaEmail={p.email ?? undefined} />
                      <VoiceScriptButton accountName={account.name} personaName={p.name} />
                      <span className="font-mono text-xs text-[var(--muted-foreground)]">{p.persona_id}</span>
                    </div>
                  </div>
                  {p.next_step && (
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">Next: {p.next_step}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <GeneratorDialog accountName={account.name} defaultType="meeting_prep" />
            <GeneratorDialog accountName={account.name} defaultType="call_script" />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/generated-content?account=${encodeURIComponent(account.name)}`}>
                Open Content Studio
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Meeting Brief</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {!brief ? (
                  <EmptyState title="No brief available" description="Meeting brief not yet created for this account." />
                ) : (
                  <>
                    {[
                      { label: 'Why This Account', value: brief.why_this_account },
                      { label: 'Likely Pain Points', value: brief.likely_pain_points },
                      { label: 'Prep Assets Needed', value: brief.prep_assets_needed },
                    ].map((section) => (
                      <div key={section.label}>
                        <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">{section.label}</p>
                        <p className="mt-1 text-sm leading-relaxed">{section.value}</p>
                      </div>
                    ))}
                    <Link href={`/briefs/${slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline">
                      Open legacy brief <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Audit Route</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {!auditRoute ? (
                  <EmptyState title="No audit route" description="No audit route has been created for this account." />
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <a href={auditRoute.audit_url} target="_blank" rel="noopener noreferrer" className="flex-1 break-all text-sm text-[var(--primary)] hover:underline">
                        {auditRoute.audit_url}
                      </a>
                      <CopyButton text={auditRoute.audit_url} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--muted-foreground)]">Fast Ask</p>
                      <p className="mt-0.5 text-sm">{auditRoute.fast_ask}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--muted-foreground)]">Proof Asset</p>
                      <p className="mt-0.5 text-sm">{auditRoute.proof_asset}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">QR Asset</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {!qrAsset ? (
                  <EmptyState title="No QR asset" description="No QR asset is mapped for this account yet." />
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <a href={qrAsset.audit_url} target="_blank" rel="noopener noreferrer" className="flex-1 break-all text-sm text-[var(--primary)] hover:underline">
                        {qrAsset.audit_url}
                      </a>
                      <CopyButton text={qrAsset.audit_url} />
                    </div>
                    <p className="text-sm">{qrAsset.suggested_use}</p>
                    {qrAsset.proof_asset && <p className="text-xs text-[var(--muted-foreground)]">Proof: {qrAsset.proof_asset}</p>}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Generated Content</CardTitle></CardHeader>
              <CardContent>
                {generatedAssets.length === 0 ? (
                  <EmptyState title="No generated assets" description="Generated one-pagers, emails, and call scripts will appear here." />
                ) : (
                  <div className="space-y-2">
                    {generatedAssets.map((asset) => (
                      <div key={asset.id} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] p-3">
                        <div>
                          <p className="text-sm font-medium">{asset.content_type} v{asset.version}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {asset.persona_name ?? 'Account level'} · {formatActivityDate(asset.created_at)}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                            Provider: {asset.provider_used ?? 'unknown'} · Quality {asset.quality.score} · QA {asset.checklist.requiredComplete}/{asset.checklist.requiredTotal}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={asset.is_published ? 'success' : 'outline'}>
                            {asset.is_published ? 'published' : 'draft'}
                          </Badge>
                          <AccountGeneratedAssetActions
                            accountName={account.name}
                            asset={asset}
                            recipients={accountRecipients}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <InfographicJourneyControls
            accountName={account.name}
            campaignId={generatedAssets[0]?.campaign_id ?? null}
            initialStage={initialJourneyStage}
          />
          {journeyActivities.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Journey Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {journeyActivities.map((activity) => (
                  <div key={activity.id} className="rounded-md border p-2 text-xs">
                    <p className="font-medium">{activity.outcome ?? 'Journey transition'}</p>
                    <p className="text-muted-foreground">{activity.notes}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
          {timeline.length === 0 ? (
            <EmptyState title="No engagement yet" description="Emails, sessions, captures, meetings, and activities will appear here." />
          ) : (
            <div className="relative ml-3 space-y-0 border-l-2 border-[var(--border)]">
              {timeline.map((item) => (
                <div key={item.id} className="relative pb-5 pl-6">
                  <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-xs">{item.kind}</Badge>
                    <span className="text-xs text-[var(--muted-foreground)]">{formatActivityDate(item.occurredAt)}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{item.detail}</p>
                  {item.href && (
                    <Link href={item.href} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline">
                      Open signal <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">{openTaskCount} account task{openTaskCount === 1 ? '' : 's'}</p>
            <LogActivityDialog accountName={account.name} personas={personas.map((p) => ({ name: p.name }))} />
          </div>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Recommended</p>
              <p className="mt-1 text-sm font-medium">{nextBestAction.label}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{nextBestAction.detail}</p>
            </CardContent>
          </Card>
          {activities.filter((activity) => activity.next_step).map((activity) => (
            <Card key={activity.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{activity.next_step}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{activity.activity_type} · {activity.owner ?? 'Unassigned'}</p>
                  </div>
                  {activity.nextStepDueLabel && <Badge variant="warning">{activity.nextStepDueLabel}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Meetings Tab */}
        <TabsContent value="meetings" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--muted-foreground)]">{meetings.length} meeting record{meetings.length === 1 ? '' : 's'}</p>
            <BookMeetingDialog accountName={account.name} personas={personas.map((p) => ({ name: p.name, priority: p.priority }))} calendlyLink={process.env.NEXT_PUBLIC_CALENDLY_LINK} />
          </div>
          {meetings.length === 0 ? (
            <EmptyState title="No meetings booked" description="Book a meeting or log activity when this account moves." />
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <Card key={meeting.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={meeting.meeting_status} />
                          <p className="text-sm font-medium">{meeting.persona ?? 'Account meeting'}</p>
                        </div>
                        {meeting.objective && <p className="mt-1 text-sm text-[var(--muted-foreground)]">{meeting.objective}</p>}
                        {meeting.post_next_step && <p className="mt-1 text-xs text-[var(--muted-foreground)]">Next: {meeting.post_next_step}</p>}
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {meeting.meeting_date ? formatActivityDate(meeting.meeting_date) : 'No date'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-[var(--muted-foreground)]">Pipeline Stage</CardTitle></CardHeader>
              <CardContent><p className="text-sm font-medium">{account.pipeline_stage}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-[var(--muted-foreground)]">Outreach Status</CardTitle></CardHeader>
              <CardContent><StatusBadge status={account.outreach_status} /></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-[var(--muted-foreground)]">Meeting Status</CardTitle></CardHeader>
              <CardContent><StatusBadge status={account.meeting_status} /></CardContent>
            </Card>
          </div>
          {waves.length === 0 ? (
            <EmptyState title="No campaign phases" description="This account has not been assigned to a campaign wave yet." />
          ) : (
            <div className="space-y-3">
              {waves.map((wave, index) => (
                <Card key={`${wave.wave}-${index}`}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{wave.wave}</span>
                      <StatusBadge status={wave.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
                      <span>Channel: {wave.channel_mix}</span>
                      <span>Owner: {wave.owner}</span>
                      <span>Start: {wave.start_date}</span>
                      <span>Follow-up 1: {wave.follow_up_1}</span>
                    </div>
                    <p className="text-sm">{wave.primary_objective}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MicrositeAccountHeatBadge({ score }: { score: number }) {
  if (score >= 70) return <Badge className="bg-red-500 text-white">Hot {score}</Badge>;
  if (score >= 45) return <Badge className="bg-amber-500 text-white">Warm {score}</Badge>;
  return <Badge variant="outline">Watch {score}</Badge>;
}

function accountTabIcon(tabId: AccountCommandTabId) {
  switch (tabId) {
    case 'contacts':
      return Users;
    case 'assets':
      return BriefcaseBusiness;
    case 'engagement':
      return Inbox;
    case 'tasks':
      return ListTodo;
    case 'meetings':
      return Calendar;
    case 'pipeline':
      return GitBranch;
    case 'overview':
    default:
      return FileText;
  }
}

function MicrositeSessionRow({ session }: { session: RecentMicrositeSession }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link href={session.path} className="text-sm font-medium text-[var(--primary)] hover:underline">
              {session.personName ?? 'Overview microsite'}
            </Link>
            {session.isHighIntent ? (
              <Badge className="bg-emerald-600 text-white">High intent</Badge>
            ) : (
              <Badge variant="outline">Light read</Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {session.sectionsViewedCount} sections · {session.ctaCount} CTAs · {Math.max(session.variantCount - 1, 0)} switches
          </p>
        </div>
        <div className="text-right text-xs text-[var(--muted-foreground)]">
          <p>{session.scrollDepthPct}% scroll</p>
          <p>{formatMicrositeDuration(session.durationSeconds)} read</p>
          <p>{formatMicrositeTimestamp(session.viewedAt)}</p>
        </div>
      </div>
    </div>
  );
}

function formatMicrositeDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function formatMicrositeTimestamp(value: Date) {
  return value.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatActivityDate(value: Date) {
  return value.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isSendableAccountAsset(contentType: string) {
  return !['call_script', 'meeting_prep'].includes(contentType);
}
