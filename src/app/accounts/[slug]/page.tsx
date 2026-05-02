export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getWavesByAccount,
  getMeetingBriefByAccount,
  slugify,
  getAuditRoutes,
} from '@/lib/data';
import { dbGetAccountByName, dbGetAccounts, dbGetActivitiesByAccount, dbGetMicrositeAccountAnalytics, dbGetPersonasByAccount } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { BandBadge } from '@/components/band-badge';
import { StatusBadge } from '@/components/status-badge';
import { CopyButton } from '@/components/copy-button';
import { EmptyState } from '@/components/empty-state';
import { ArrowLeft, ExternalLink, Users, Waves, FileText, Route, Activity, Calendar } from 'lucide-react';
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
  const [microsite, rawActivities, activeCampaigns] = await Promise.all([
    dbGetMicrositeAccountAnalytics(account.name),
    dbGetActivitiesByAccount(account.name),
    prisma.campaign.findMany({
      where: { status: 'active' },
      orderBy: [{ start_date: 'desc' }, { created_at: 'desc' }],
      take: 6,
      select: { slug: true, name: true, messaging_angle: true, campaign_type: true },
    }),
  ]);
  const activities = rawActivities.map((activity) => ({
    ...activity,
    activityDateLabel: activity.activity_date ? formatActivityDate(activity.activity_date) : '',
    nextStepDueLabel: activity.next_step_due ? formatActivityDate(activity.next_step_due) : '',
  }));
  const micrositeOverviewPath = `/for/${slug}`;
  const micrositeInfo = ensureMicrositeForAccount(account.name);

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
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Accounts', href: '/accounts' }, { label: account.name }]} />

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
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="personas" className="gap-1"><Users className="h-3.5 w-3.5" /> Personas ({personas.length})</TabsTrigger>
          <TabsTrigger value="waves" className="gap-1"><Waves className="h-3.5 w-3.5" /> Waves</TabsTrigger>
          <TabsTrigger value="brief" className="gap-1"><FileText className="h-3.5 w-3.5" /> Brief</TabsTrigger>
          <TabsTrigger value="routes" className="gap-1"><Route className="h-3.5 w-3.5" /> Routes</TabsTrigger>
          <TabsTrigger value="activity" className="gap-1"><Activity className="h-3.5 w-3.5" /> Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
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

        {/* Personas Tab */}
        <TabsContent value="personas" className="space-y-3">
          <div className="flex justify-end">
            <AddPersonaDialog accountName={account.name} />
          </div>
          {personas.length === 0 ? (
            <EmptyState title="No personas mapped" description="Personas will appear here once added." />
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

        {/* Waves Tab */}
        <TabsContent value="waves" className="space-y-3">
          {waves.length === 0 ? (
            <EmptyState title="No wave assignments" description="This account hasn't been assigned to an outreach wave yet." />
          ) : (
            waves.map((w, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{w.wave}</span>
                    <StatusBadge status={w.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
                    <span>Channel: {w.channel_mix}</span>
                    <span>Owner: {w.owner}</span>
                    <span>Start: {w.start_date}</span>
                    <span>Follow-up 1: {w.follow_up_1}</span>
                  </div>
                  <p className="text-sm">{w.primary_objective}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Brief Tab */}
        <TabsContent value="brief">
          {!brief ? (
            <EmptyState title="No brief available" description="Meeting brief not yet created for this account." />
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <GeneratorDialog accountName={account.name} defaultType="meeting_prep" />
                <GeneratorDialog accountName={account.name} defaultType="call_script" />
                <OnePagerDialog accountName={account.name} />
              </div>
              {[
                { label: 'Why This Account', value: brief.why_this_account },
                { label: 'Why Now', value: brief.why_now },
                { label: 'Likely Pain Points', value: brief.likely_pain_points },
                { label: 'Primo Relevance', value: brief.primo_relevance },
                { label: 'Best First Meeting Outcome', value: brief.best_first_meeting_outcome },
                { label: 'Suggested Attendees', value: brief.suggested_attendees },
                { label: 'Prep Assets Needed', value: brief.prep_assets_needed },
                { label: 'Open Questions', value: brief.open_questions },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">{s.label}</p>
                    <p className="mt-1.5 text-sm leading-relaxed">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
              {(brief.source_url_1 || brief.source_url_2) && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Sources</p>
                    <div className="mt-1.5 space-y-1">
                      {brief.source_url_1 && (
                        <a href={brief.source_url_1} target="_blank" rel="noopener noreferrer" className="block text-sm text-[var(--primary)] hover:underline break-all">
                          {brief.source_url_1}
                        </a>
                      )}
                      {brief.source_url_2 && (
                        <a href={brief.source_url_2} target="_blank" rel="noopener noreferrer" className="block text-sm text-[var(--primary)] hover:underline break-all">
                          {brief.source_url_2}
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes">
          {!auditRoute ? (
            <EmptyState title="No audit route" description="No audit route has been created for this account." />
          ) : (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <a href={auditRoute.audit_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--primary)] hover:underline break-all flex-1">
                    {auditRoute.audit_url}
                  </a>
                  <CopyButton text={auditRoute.audit_url} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-[var(--muted-foreground)]">Suggested Message</p>
                    <div className="flex items-start gap-2">
                      <p className="mt-0.5 text-sm flex-1">{auditRoute.suggested_message}</p>
                      <CopyButton text={auditRoute.suggested_message} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--muted-foreground)]">Fast Ask</p>
                    <p className="mt-0.5 text-sm">{auditRoute.fast_ask}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--muted-foreground)]">Proof Asset</p>
                    <p className="mt-0.5 text-sm">{auditRoute.proof_asset}</p>
                  </div>
                  {auditRoute.warm_route && (
                    <div>
                      <p className="text-xs font-medium text-[var(--muted-foreground)]">Warm Route</p>
                      <p className="mt-0.5 text-sm">{auditRoute.warm_route}</p>
                    </div>
                  )}
                </div>
                <Separator />
                <a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Schedule Meeting
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">{activities.length} logged activities</p>
            <LogActivityDialog accountName={account.name} personas={personas.map((p) => ({ name: p.name }))} />
          </div>
          {activities.length === 0 ? (
            <EmptyState title="No activities yet" description="Click Log Activity to record an email, call, or meeting." />
          ) : (
            <div className="relative border-l-2 border-[var(--border)] ml-3 space-y-0">
              {activities.map((a, i) => (
                <div key={a.id ?? i} className="relative pl-6 pb-5">
                  <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">{a.activity_type}</Badge>
                    <span className="text-xs text-[var(--muted-foreground)]">{a.activityDateLabel}</span>
                  </div>
                  {a.notes && <p className="mt-1.5 text-sm">{a.notes}</p>}
                  {a.outcome && <p className="mt-1 text-xs">Outcome: {a.outcome}</p>}
                  {a.next_step && <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Next: {a.next_step} {a.nextStepDueLabel ? `(by ${a.nextStepDueLabel})` : ''}</p>}
                </div>
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
