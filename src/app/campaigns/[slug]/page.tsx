import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, BarChart3, FileText, GitBranch, Inbox, Settings, Target } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { prisma } from '@/lib/prisma';
import { ensureDefaultCampaign } from '@/lib/campaigns';
import { slugify } from '@/lib/data';
import {
  buildCampaignEngagementItems,
  buildCampaignTargetCohorts,
  campaignWorkspaceTabs,
  type CampaignWorkspaceTabId,
} from '@/lib/campaign-workspace';
import { CampaignControls } from './campaign-controls';
import { CampaignSettingsForm } from './campaign-settings-form';
import { CampaignGenerationContractForm } from './campaign-generation-contract-form';
import { isGenerationContractPolicyEnabled } from '@/lib/revops/campaign-generation-contract';
import { parseInfographicMetadata, type JourneyStageIntent } from '@/lib/revops/infographic-journey';
import { InfographicJourneyControls } from '@/components/revops/infographic-journey-controls';

export const dynamic = 'force-dynamic';

export default async function CampaignDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await ensureDefaultCampaign();

  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    include: {
      outreach_waves: {
        orderBy: [{ wave_order: 'asc' }],
      },
      email_logs: {
        orderBy: { sent_at: 'desc' },
        take: 25,
      },
      generated_content: {
        orderBy: { created_at: 'desc' },
        take: 25,
      },
      activities: {
        orderBy: { created_at: 'desc' },
        take: 25,
      },
      _count: {
        select: {
          outreach_waves: true,
          email_logs: true,
          activities: true,
          generated_content: true,
        },
      },
      generation_contract: true,
    },
  });

  if (!campaign) notFound();

  const targetAccountNames = Array.from(new Set(campaign.outreach_waves.map((wave) => wave.account_name)));
  const [targetAccounts, contactGroups, generatedGroups, sentGroups] = await Promise.all([
    prisma.account.findMany({
      where: { name: { in: targetAccountNames } },
      select: { name: true, priority_score: true, priority_band: true, outreach_status: true },
    }),
    prisma.persona.groupBy({
      by: ['account_name'],
      where: { account_name: { in: targetAccountNames } },
      _count: { _all: true },
    }),
    prisma.generatedContent.groupBy({
      by: ['account_name'],
      where: { campaign_id: campaign.id },
      _count: { _all: true },
    }),
    prisma.emailLog.groupBy({
      by: ['account_name'],
      where: { campaign_id: campaign.id },
      _count: { _all: true },
    }),
  ]);

  const targetAccountMap = new Map(targetAccounts.map((account) => [account.name, account]));
  const contactCountMap = new Map(contactGroups.map((group) => [group.account_name, group._count._all]));
  const generatedCountMap = new Map(generatedGroups.map((group) => [group.account_name, group._count._all]));
  const sentCountMap = new Map(sentGroups.map((group) => [group.account_name, group._count._all]));
  const targetCohorts = buildCampaignTargetCohorts(campaign.outreach_waves.map((wave) => {
    const account = targetAccountMap.get(wave.account_name);
    return {
      accountName: wave.account_name,
      wave: wave.wave,
      status: account?.outreach_status ?? wave.status,
      priorityScore: account?.priority_score ?? wave.priority_score,
      priorityBand: account?.priority_band ?? wave.tier,
      contactCount: contactCountMap.get(wave.account_name) ?? 0,
      generatedCount: generatedCountMap.get(wave.account_name) ?? 0,
      sentCount: sentCountMap.get(wave.account_name) ?? 0,
    };
  }));
  const engagementItems = buildCampaignEngagementItems([
    ...campaign.email_logs.map((email) => ({
      id: `email-${email.id}`,
      kind: 'email' as const,
      accountName: email.account_name,
      title: email.reply_count > 0 ? 'Reply signal' : `Email ${email.status}`,
      detail: `${email.subject} -> ${email.to_email}`,
      occurredAt: email.sent_at,
      status: email.status,
    })),
    ...campaign.activities.map((activity) => ({
      id: `activity-${activity.id}`,
      kind: 'activity' as const,
      accountName: activity.account_name,
      title: activity.activity_type,
      detail: activity.outcome ?? activity.notes ?? activity.next_step ?? 'Activity logged',
      occurredAt: activity.activity_date ?? activity.created_at,
      status: activity.outcome ?? activity.next_step ?? 'open',
    })),
  ]);

  const campaignSettings = campaign.key_dates && typeof campaign.key_dates === 'object' && !Array.isArray(campaign.key_dates)
    ? (campaign.key_dates as Record<string, unknown>)
    : {};
  const contractPolicyEnabled = isGenerationContractPolicyEnabled(campaign.key_dates);
  const cadence = Array.isArray(campaignSettings.suggestedIntervals)
    ? (campaignSettings.suggestedIntervals as Array<number | string>).join(', ')
    : 'Not configured';
  const automationPaused = Boolean(campaignSettings.automationPaused) || campaign.status === 'paused';
  const journeyActivities = campaign.activities.filter((activity) => activity.activity_type === 'Infographic Journey').slice(0, 10);
  const latestGenerated = campaign.generated_content[0] ? parseInfographicMetadata(campaign.generated_content[0].version_metadata) : null;
  const initialJourneyStage = (latestGenerated?.stageIntent ?? 'cold') as JourneyStageIntent;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Campaigns', href: '/campaigns' }, { label: campaign.name }]} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">{campaign.campaign_type.replace(/_/g, ' ')} · owner {campaign.owner}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={campaign.status === 'active' ? 'default' : 'outline'}>{campaign.status}</Badge>
          <Link href={`/campaigns/${campaign.slug}/analytics`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              Analytics <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Target Accounts" value={campaign.target_account_count} />
        <StatCard label="Waves" value={campaign._count.outreach_waves} />
        <StatCard label="Emails" value={campaign._count.email_logs} />
        <StatCard label="Activity" value={campaign._count.activities} />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          {campaignWorkspaceTabs.map((tab) => {
            const Icon = campaignTabIcon(tab.id);
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-1">
                <Icon className="h-3.5 w-3.5" /> {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Messaging Angle</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm">{campaign.messaging_angle || 'No messaging angle set yet.'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">MODEX Saved View</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>This campaign is the canonical home for legacy Outreach Waves and Campaign HQ.</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/campaigns/${campaign.slug}?view=phases&legacy=waves`}>
                    <Button variant="outline" size="sm">Legacy Waves View</Button>
                  </Link>
                  <Link href={`/campaigns/${campaign.slug}?view=overview&legacy=campaign-hq`}>
                    <Button variant="outline" size="sm">Legacy Campaign HQ View</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="phases" className="space-y-4">
          {campaign.outreach_waves.length === 0 ? (
            <Card><CardContent className="p-4 text-sm text-muted-foreground">No phases linked yet.</CardContent></Card>
          ) : (
            [0, 1, 2, 3].map((order) => {
              const waves = campaign.outreach_waves.filter((wave) => wave.wave_order === order);
              if (waves.length === 0) return null;
              const progressed = waves.filter((wave) => !/not started|planned/i.test(wave.status)).length;
              const pct = Math.round((progressed / waves.length) * 100);

              return (
                <Card key={order}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-sm">{waves[0]?.wave ?? `Wave ${order}`}</CardTitle>
                      <Badge variant="outline">{progressed}/{waves.length} progressed</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-cyan-600" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="grid gap-2 lg:grid-cols-2">
                      {waves.map((wave) => (
                        <div key={wave.id} className="rounded-lg border p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <Link href={`/accounts/${slugify(wave.account_name)}`} className="font-medium text-primary hover:underline">
                              {wave.account_name}
                            </Link>
                            <Badge variant="secondary">{wave.status}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{wave.channel_mix} · {wave.primary_objective}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="targets" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Target Cohort</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-2 text-left font-medium">Account</th>
                    <th className="py-2 text-left font-medium">Wave</th>
                    <th className="py-2 text-left font-medium">Readiness</th>
                    <th className="py-2 text-center font-medium">Contacts</th>
                    <th className="py-2 text-center font-medium">Content</th>
                    <th className="py-2 text-center font-medium">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {targetCohorts.map((target) => (
                    <tr key={`${target.accountName}-${target.wave}`} className="border-b last:border-0">
                      <td className="py-2">
                        <Link href={`/accounts/${slugify(target.accountName)}`} className="font-medium text-primary hover:underline">
                          {target.accountName}
                        </Link>
                        <p className="text-xs text-muted-foreground">Score {target.priorityScore ?? '—'} · Band {target.priorityBand ?? '—'}</p>
                      </td>
                      <td className="py-2">{target.wave}</td>
                      <td className="py-2">
                        <Badge variant={target.readiness === 'ready' ? 'success' : 'warning'}>{target.readinessLabel}</Badge>
                      </td>
                      <td className="py-2 text-center">{target.contactCount}</td>
                      <td className="py-2 text-center">{target.generatedCount}</td>
                      <td className="py-2 text-center">{target.sentCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <CampaignGenerationContractForm
            campaignId={campaign.id}
            campaignSlug={campaign.slug}
            accountNames={targetAccountNames}
            policyEnabled={contractPolicyEnabled}
            initial={{
              objective: campaign.generation_contract?.objective ?? '',
              personaHypothesis: campaign.generation_contract?.persona_hypothesis ?? '',
              offer: campaign.generation_contract?.offer ?? '',
              proof: campaign.generation_contract?.proof ?? '',
              cta: campaign.generation_contract?.cta ?? '',
              metric: campaign.generation_contract?.metric ?? '',
            }}
          />
          <div className="flex justify-end">
            <Link href={`/generated-content?campaign=${encodeURIComponent(campaign.slug)}`}>
              <Button size="sm" className="gap-1.5">Open Filtered Content Studio <ArrowRight className="h-3.5 w-3.5" /></Button>
            </Link>
          </div>
          {campaign.generated_content.length === 0 ? (
            <Card><CardContent className="p-4 text-sm text-muted-foreground">No generated campaign content yet.</CardContent></Card>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {campaign.generated_content.map((content) => (
                <Card key={content.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{content.content_type} v{content.version}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{content.account_name} · {content.persona_name ?? 'Account level'} · {formatDate(content.created_at)}</p>
                      </div>
                      <Badge variant={content.is_published ? 'success' : 'outline'}>{content.is_published ? 'published' : 'draft'}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <InfographicJourneyControls
            accountName={targetAccountNames[0] ?? campaign.name}
            campaignId={campaign.id}
            initialStage={initialJourneyStage}
          />
          {journeyActivities.length > 0 ? (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Journey Timeline</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {journeyActivities.map((activity) => (
                  <div key={activity.id} className="rounded-md border p-2 text-xs">
                    <p className="font-medium">{activity.account_name}: {activity.outcome ?? 'Journey transition'}</p>
                    <p className="text-muted-foreground">{activity.notes ?? 'No note'}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
          {engagementItems.length === 0 ? (
            <Card><CardContent className="p-4 text-sm text-muted-foreground">No campaign engagement yet.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {engagementItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{item.kind}</Badge>
                          <Link href={`/accounts/${slugify(item.accountName)}`} className="text-sm font-medium text-primary hover:underline">
                            {item.accountName}
                          </Link>
                        </div>
                        <p className="mt-2 text-sm font-medium">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(item.occurredAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Cadence & Automation</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Template: {String(campaignSettings.templateKey ?? 'manual')}</p>
              <p>Touches: {String(campaignSettings.touchCount ?? 'Not set')}</p>
              <p>Suggested intervals: {cadence} days</p>
              <p>AI angle: {String(campaignSettings.aiPromptAngle ?? 'No AI angle configured')}</p>
              <p>Automation status: {automationPaused ? 'Paused' : 'Running'}</p>
              <CampaignControls slug={campaign.slug} status={campaign.status} paused={automationPaused} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Campaign Settings</CardTitle></CardHeader>
            <CardContent>
              <CampaignSettingsForm
                slug={campaign.slug}
                name={campaign.name}
                owner={campaign.owner}
                status={campaign.status as 'draft' | 'active' | 'paused' | 'completed'}
                targetAccountCount={campaign.target_account_count}
                messagingAngle={campaign.messaging_angle ?? ''}
                touchCount={Number(campaignSettings.touchCount ?? 4)}
                suggestedIntervals={Array.isArray(campaignSettings.suggestedIntervals)
                  ? (campaignSettings.suggestedIntervals as Array<number | string>).join(', ')
                  : '0, 3, 7, 14'}
                isSystemDefault={campaign.slug === 'modex-2026-follow-up'}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{label}</CardTitle></CardHeader>
      <CardContent><p className="text-3xl font-bold">{value}</p></CardContent>
    </Card>
  );
}

function campaignTabIcon(tabId: CampaignWorkspaceTabId) {
  switch (tabId) {
    case 'phases':
      return GitBranch;
    case 'targets':
      return Target;
    case 'content':
      return FileText;
    case 'engagement':
      return Inbox;
    case 'settings':
      return Settings;
    case 'overview':
    default:
      return BarChart3;
  }
}

function formatDate(value: Date) {
  return value.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
