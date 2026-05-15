import Link from 'next/link';
import { Activity, AlertTriangle, ArrowRight, Inbox, MousePointerClick } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/metric-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  buildEngagementItems,
  buildHotAccounts,
  engagementCenterTabs,
  engagementWindows,
  filterItemsWithinWindow,
  formatRelativeTime,
  parseEngagementTab,
  parseEngagementWindow,
  type EngagementItem,
  type EngagementWindowId,
} from '@/lib/engagement-center';
import { buildFailureClusters, buildRetryRecommendations } from '@/lib/revops/failure-intelligence';
import { computeLearningReviewSlaDueAt } from '@/lib/revops/engagement-learning';
import { OPERATOR_OUTCOME_TAXONOMY, parseOperatorOutcomeLabel } from '@/lib/revops/operator-outcomes';
import { prisma } from '@/lib/prisma';
import { dbGetMicrositeAnalytics } from '@/lib/db';
import { readTrafficQuality } from '@/lib/microsites/bot-detection';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Engagement' };

type SearchParams = {
  tab?: string;
  window?: string;
  markRead?: string;
  followUpAccount?: string;
  followUpSource?: string;
  outcomeAccount?: string;
  outcomeSource?: string;
  outcomeLabel?: string;
  outcomeCampaignId?: string;
  outcomeContentVersionId?: string;
  remediateAction?: 'retry-later' | 'switch-persona' | 'mark-bad-address';
  remediateRecipient?: string;
};

export default async function EngagementPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const selectedTab = parseEngagementTab(params.tab);
  const selectedWindow = parseEngagementWindow(params.window);

  const markReadId = Number(params.markRead);
  if (!Number.isNaN(markReadId) && markReadId > 0) {
    await prisma.notification.updateMany({
      where: { id: markReadId, read: false },
      data: { read: true },
    });
  }

  let followUpCreatedFor: string | null = null;
  let followUpSkippedFor: string | null = null;
  let outcomeLoggedFor: { account: string; label: string } | null = null;
  let outcomeSkippedFor: string | null = null;
  let remediationApplied: string | null = null;
  if (params.followUpAccount && params.followUpSource) {
    const noteToken = `engagement-follow-up:${params.followUpSource}:${params.followUpAccount}`;
    const [accountExists, existing] = await Promise.all([
      prisma.account.findUnique({ where: { name: params.followUpAccount }, select: { name: true } }),
      prisma.activity.findFirst({
        where: {
          account_name: params.followUpAccount,
          notes: { contains: noteToken },
        },
      }),
    ]);

    if (!accountExists) {
      followUpSkippedFor = params.followUpAccount;
    } else if (!existing) {
      const dueTomorrow = new Date();
      dueTomorrow.setDate(dueTomorrow.getDate() + 1);
      await prisma.activity.create({
        data: {
          account_name: params.followUpAccount,
          activity_type: 'Follow-up',
          owner: 'Casey',
          outcome: `Follow-up created from ${params.followUpSource} signal`,
          next_step: 'Respond and propose next buyer step',
          next_step_due: dueTomorrow,
          notes: noteToken,
          activity_date: new Date(),
        },
      });
      followUpCreatedFor = params.followUpAccount;
    }
  }

  if (params.outcomeAccount && params.outcomeSource && params.outcomeLabel) {
    const outcomeLabel = parseOperatorOutcomeLabel(params.outcomeLabel);
    const accountExists = await prisma.account.findUnique({
      where: { name: params.outcomeAccount },
      select: { name: true },
    });
    if (!accountExists || !outcomeLabel || !OPERATOR_OUTCOME_TAXONOMY.includes(outcomeLabel)) {
      outcomeSkippedFor = params.outcomeAccount;
    } else {
      const [sourceKind, ...sourceIdParts] = params.outcomeSource.split(':');
      const sourceId = sourceIdParts.join(':');
      if (!sourceKind || !sourceId) {
        outcomeSkippedFor = params.outcomeAccount;
      } else {
        const campaignId = Number.parseInt(params.outcomeCampaignId ?? '', 10);
        const generatedContentId = Number.parseInt(params.outcomeContentVersionId ?? '', 10);
        const existing = await prisma.operatorOutcome.findUnique({
          where: {
            source_kind_source_id_outcome_label: {
              source_kind: sourceKind,
              source_id: sourceId,
              outcome_label: outcomeLabel,
            },
          },
          select: { id: true },
        });
        if (!existing) {
          await prisma.operatorOutcome.create({
            data: {
              account_name: params.outcomeAccount,
              outcome_label: outcomeLabel,
              source_kind: sourceKind,
              source_id: sourceId,
              campaign_id: Number.isInteger(campaignId) ? campaignId : null,
              generated_content_id: Number.isInteger(generatedContentId) ? generatedContentId : null,
              created_by: 'Casey',
            },
          });
          await prisma.activity.create({
            data: {
              account_name: params.outcomeAccount,
              activity_type: 'Outcome',
              owner: 'Casey',
              outcome: `Operator outcome logged: ${outcomeLabel}`,
              next_step: outcomeLabel === 'wrong-person'
                ? 'Replace persona and regenerate'
                : outcomeLabel === 'bad-timing'
                  ? 'Retry in a later sequence window'
                  : outcomeLabel === 'closed-won'
                    ? 'Hand off to expansion playbook'
                    : 'Update messaging and continue sequence',
              notes: `operator-outcome:${sourceKind}:${sourceId}:${outcomeLabel}`,
              activity_date: new Date(),
            },
          }).catch(() => undefined);
          if (['negative', 'wrong-person', 'bad-timing', 'closed-lost'].includes(outcomeLabel)) {
            await prisma.activity.create({
              data: {
                account_name: params.outcomeAccount,
                campaign_id: Number.isInteger(campaignId) ? campaignId : null,
                activity_type: 'Follow-up',
                owner: 'Casey',
                outcome: `Content revision required from ${outcomeLabel}`,
                next_step: 'Regenerate from signal and review diff before publish.',
                next_step_due: computeLearningReviewSlaDueAt(new Date(), 'proposed'),
                notes: `content-revision-required:${sourceKind}:${sourceId}:${outcomeLabel}`,
                activity_date: new Date(),
              },
            }).catch(() => undefined);
          }
        }
        outcomeLoggedFor = { account: params.outcomeAccount, label: outcomeLabel };
      }
    }
  }

  const remediationRecipientId = Number.parseInt(params.remediateRecipient ?? '', 10);
  if (
    params.remediateAction &&
    Number.isInteger(remediationRecipientId) &&
    remediationRecipientId > 0
  ) {
    const recipient = await prisma.sendJobRecipient.findUnique({
      where: { id: remediationRecipientId },
      select: {
        id: true,
        to_email: true,
        account_name: true,
        campaign_id: true,
      },
    });
    if (recipient) {
      if (params.remediateAction === 'retry-later') {
        await prisma.sendJobRecipient.update({
          where: { id: recipient.id },
          data: {
            status: 'pending',
            error_message: 'Retry scheduled from Engagement remediation action',
          },
        }).catch(() => undefined);
        remediationApplied = `Retry later queued for ${recipient.to_email}`;
      }
      if (params.remediateAction === 'mark-bad-address') {
        await prisma.persona.updateMany({
          where: { email: recipient.to_email },
          data: {
            email_valid: false,
            do_not_contact: true,
            email_status: 'invalid',
          },
        }).catch(() => undefined);
        remediationApplied = `Marked bad address: ${recipient.to_email}`;
      }
      if (params.remediateAction === 'switch-persona') {
        await prisma.activity.create({
          data: {
            account_name: recipient.account_name,
            campaign_id: recipient.campaign_id,
            activity_type: 'Follow-up',
            owner: 'Casey',
            outcome: 'Switch persona requested from failure remediation',
            next_step: `Replace recipient ${recipient.to_email} with alternate persona and regenerate.`,
            notes: `failure-remediation:switch-persona:${recipient.id}`,
          },
        }).catch(() => undefined);
        remediationApplied = `Switch persona task created for ${recipient.account_name}`;
      }
    }
  }

  const [replyCount, notificationCount, micrositeAnalytics, failedRecipients, notifications, emailLogs, sendFailures, micrositeSessions, meetings, activities, learningReviewItems] = await Promise.all([
    prisma.notification.count({ where: { type: { contains: 'reply', mode: 'insensitive' } } }),
    prisma.notification.count(),
    dbGetMicrositeAnalytics(),
    prisma.sendJobRecipient.count({ where: { status: 'failed' } }),
    prisma.notification.findMany({
      orderBy: { created_at: 'desc' },
      take: 30,
      select: {
        id: true,
        type: true,
        account_name: true,
        persona_email: true,
        subject: true,
        preview: true,
        created_at: true,
        read: true,
      },
    }),
    prisma.emailLog.findMany({
      where: {
        OR: [{ opened_at: { not: null } }, { clicked_at: { not: null } }],
      },
      orderBy: [{ clicked_at: 'desc' }, { opened_at: 'desc' }],
      take: 30,
      select: {
        id: true,
        account_name: true,
        persona_name: true,
        to_email: true,
        subject: true,
        campaign_id: true,
        generated_content_id: true,
        campaign: {
          select: {
            name: true,
            slug: true,
          },
        },
        status: true,
        opened_at: true,
        clicked_at: true,
        sent_at: true,
      },
    }),
    prisma.sendJobRecipient.findMany({
      where: { status: 'failed' },
      orderBy: { updated_at: 'desc' },
      take: 40,
      select: {
        id: true,
        account_name: true,
        persona_name: true,
        to_email: true,
        error_message: true,
        campaign_id: true,
        generated_content_id: true,
        campaign: {
          select: {
            name: true,
            slug: true,
          },
        },
        updated_at: true,
      },
    }),
    prisma.micrositeEngagement.findMany({
      orderBy: { updated_at: 'desc' },
      take: 40,
      select: {
        id: true,
        account_name: true,
        person_name: true,
        path: true,
        scroll_depth_pct: true,
        duration_seconds: true,
        cta_ids: true,
        updated_at: true,
        metadata: true,
      },
    }),
    prisma.meeting.findMany({
      orderBy: { updated_at: 'desc' },
      take: 25,
      select: {
        id: true,
        account_name: true,
        persona: true,
        meeting_status: true,
        objective: true,
        meeting_date: true,
        updated_at: true,
      },
    }),
    prisma.activity.findMany({
      orderBy: { created_at: 'desc' },
      take: 25,
      select: {
        id: true,
        account_name: true,
        activity_type: true,
        persona: true,
        outcome: true,
        next_step: true,
        created_at: true,
      },
    }),
    prisma.messageEvolutionRegistry.findMany({
      orderBy: [{ status: 'asc' }, { created_at: 'desc' }],
      take: 40,
      select: {
        id: true,
        account_name: true,
        status: true,
        owner: true,
        sla_due_at: true,
        rationale: true,
        rollback_link: true,
        created_at: true,
      },
    }),
  ]);

  // Exclude bot/scanner sessions from the engagement feed. Microsite
  // links are delivered by email, so every URL is hit by the recipient's
  // security scanner — those rows would otherwise pollute the session
  // list and the hot-account ranking.
  const humanMicrositeSessions = micrositeSessions.filter(
    (session) => readTrafficQuality(session.metadata) === 'human',
  );
  const items = buildEngagementItems({
    notifications,
    emailLogs,
    sendFailures,
    micrositeSessions: humanMicrositeSessions,
    meetings,
    activities,
  });
  const hotAccounts = buildHotAccounts(items).slice(0, 12);
  // Recency-first feed — every signal source, newest-first, within the
  // selected look-back window. items is already sorted occurredAt desc.
  const recentItems = filterItemsWithinWindow(items, selectedWindow);
  const inboxItems = items.filter((item) => item.tab === 'inbox').slice(0, 20);
  const micrositeItems = items.filter((item) => item.tab === 'microsite-sessions').slice(0, 20);
  const failureItems = items.filter((item) => item.tab === 'bounces-failures').slice(0, 20);
  const failureClusters = buildFailureClusters(
    failureItems.map((item) => ({
      id: item.id,
      accountName: item.accountName ?? 'unknown',
      occurredAt: item.occurredAt,
      errorMessage: item.preview,
    })),
  );
  const retryRecommendations = buildRetryRecommendations(
    failureItems.map((item) => ({
      id: item.id,
      accountName: item.accountName ?? 'unknown',
      occurredAt: item.occurredAt,
      errorMessage: item.preview,
    })),
  );
  const recentTouchItems = items.filter((item) => item.tab === 'recent-touches').slice(0, 20);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Engagement' }]} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Engagement</h1>
          <p className="text-sm text-muted-foreground">
            Buyer response, notifications, microsite sessions, and failure triage in one workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/analytics/emails">
            <Button variant="outline" size="sm">Email Analytics</Button>
          </Link>
          <Link href="/queue">
            <Button variant="outline" size="sm">Work Queue</Button>
          </Link>
        </div>
      </div>

      <RecentActivityFeed
        items={recentItems}
        selectedWindow={selectedWindow}
        selectedTab={selectedTab}
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard size="md" icon={Inbox} label="Replies" value={replyCount} />
        <MetricCard size="md" icon={Activity} label="Notifications" value={notificationCount} />
        <MetricCard
          size="md"
          icon={MousePointerClick}
          label="Microsite Reads"
          value={micrositeAnalytics.totalSessions}
          detail={`${micrositeAnalytics.uniquePeople} unique · ${micrositeAnalytics.botSessions + micrositeAnalytics.suspectSessions} scanner hits filtered`}
        />
        <MetricCard size="md" icon={AlertTriangle} label="Send Failures" value={failedRecipients} tone="text-amber-600" />
      </div>

      {followUpCreatedFor ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4 text-sm">
            <p>
              Follow-up created for <span className="font-semibold">{followUpCreatedFor}</span> and added to Activities.
            </p>
            <Link href="/activities?filter=follow-up">
              <Button size="sm" variant="outline" className="gap-1.5">
                Open Activities <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {outcomeLoggedFor ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4 text-sm">
            <p>
              Outcome <span className="font-semibold">{outcomeLoggedFor.label}</span> logged for{' '}
              <span className="font-semibold">{outcomeLoggedFor.account}</span>.
            </p>
            <Link href="/analytics?tab=overview">
              <Button size="sm" variant="outline" className="gap-1.5">
                Open Analytics <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {outcomeSkippedFor ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Could not log an operator outcome for <span className="font-semibold text-foreground">{outcomeSkippedFor}</span>.
          </CardContent>
        </Card>
      ) : null}
      {remediationApplied ? (
        <Card>
          <CardContent className="p-4 text-sm">
            {remediationApplied}
          </CardContent>
        </Card>
      ) : null}

      {followUpSkippedFor ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Could not create a follow-up for <span className="font-semibold text-foreground">{followUpSkippedFor}</span> because no matching account record was found.
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue={selectedTab} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {engagementCenterTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="inbox" className="space-y-3">
          {inboxItems.length === 0 ? (
            <EmptyTabCard
              title="Inbox"
              copy="No replies or tracked opens/clicks are available yet."
            />
          ) : (
            inboxItems.map((item) => <EngagementSignalCard key={item.id} item={item} />)
          )}
        </TabsContent>

        <TabsContent value="hot-accounts" className="space-y-3">
          {hotAccounts.length === 0 ? (
            <EmptyTabCard
              title="Hot Accounts"
              copy="No account-level response signals are available yet."
            />
          ) : (
            hotAccounts.map((account) => (
              <Card key={account.accountSlug}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-semibold">{account.accountName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Score {account.score} · {account.signalCount} signals · {account.unreadSignals} unread
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{account.nextAction}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{account.topSignal}</Badge>
                    <Link href={account.accountHref}>
                      <Button size="sm">Open Account</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="microsite-sessions" className="space-y-3">
          {micrositeItems.length === 0 ? (
            <EmptyTabCard
              title="Microsite Sessions"
              copy="No microsite sessions are available yet."
            />
          ) : (
            micrositeItems.map((item) => <EngagementSignalCard key={item.id} item={item} />)
          )}
        </TabsContent>

        <TabsContent value="bounces-failures" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Failure Clusters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {failureClusters.length === 0 ? (
                <p className="text-sm text-muted-foreground">No clustered failures in current sample.</p>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {failureClusters.map((cluster) => (
                    <div key={cluster.className} className="rounded-md border p-2 text-xs">
                      <p className="font-medium">{cluster.className}</p>
                      <p className="text-muted-foreground">{cluster.count} failures</p>
                      {cluster.examples[0] ? <p className="mt-1 text-muted-foreground">{cluster.examples[0]}</p> : null}
                    </div>
                  ))}
                </div>
              )}
              {retryRecommendations.length > 0 ? (
                <div className="rounded-md border p-2 text-xs">
                  <p className="font-medium">Retry Recommendations</p>
                  <div className="mt-1 space-y-1 text-muted-foreground">
                    {retryRecommendations.map((recommendation) => (
                      <p key={recommendation.className}>
                        {recommendation.className}: {recommendation.recommended} ({Math.round(recommendation.recoveryRate * 100)}% recovery)
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
          {failureItems.length === 0 ? (
            <EmptyTabCard
              title="Bounces/Failures"
              copy="No delivery failures are available right now."
            />
          ) : (
            failureItems.map((item) => <EngagementSignalCard key={item.id} item={item} />)
          )}
        </TabsContent>

        <TabsContent value="recent-touches" className="space-y-3">
          {recentTouchItems.length === 0 ? (
            <EmptyTabCard
              title="Recent Touches"
              copy="No recent activity or meeting signals are available yet."
            />
          ) : (
            recentTouchItems.map((item) => <EngagementSignalCard key={item.id} item={item} />)
          )}
        </TabsContent>

        <TabsContent value="learning-review" className="space-y-3">
          {learningReviewItems.length === 0 ? (
            <EmptyTabCard
              title="Learning Review"
              copy="No message evolution items are queued right now."
            />
          ) : (
            learningReviewItems.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-semibold">{entry.account_name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{entry.rationale}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {[
                        `Status ${entry.status}`,
                        `Owner ${entry.owner}`,
                        entry.sla_due_at ? `SLA ${entry.sla_due_at.toLocaleDateString()}` : 'SLA closed',
                        entry.created_at.toLocaleString(),
                      ].join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{entry.status}</Badge>
                    <Link href="/queue?tab=learning-review">
                      <Button size="sm">Open Weekly Review</Button>
                    </Link>
                    {entry.rollback_link ? (
                      <Link href={entry.rollback_link}>
                        <Button variant="outline" size="sm">Rollback Reference</Button>
                      </Link>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyTabCard({ title, copy }: { title: string; copy: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{copy}</p>
      </CardContent>
    </Card>
  );
}

function EngagementSignalCard({ item }: { item: EngagementItem }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.preview}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {[
                item.accountName,
                item.personaLabel,
                item.campaignName,
                formatRelativeTime(item.occurredAt),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={item.unread ? 'default' : 'outline'}>{item.statusLabel}</Badge>
            <Badge variant="outline">{item.kind}</Badge>
            {item.failureClass ? (
              <Badge variant="outline">{item.failureClass}</Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {item.actions.markReadHref ? (
            <Link href={item.actions.markReadHref}>
              <Button variant="outline" size="sm">Mark Read</Button>
            </Link>
          ) : null}
          {item.actions.followUpHref ? (
            <Link href={item.actions.followUpHref}>
              <Button size="sm">Create Follow-Up</Button>
            </Link>
          ) : null}
          {item.actions.accountHref ? (
            <Link href={item.actions.accountHref}>
              <Button variant="outline" size="sm">Open Account</Button>
            </Link>
          ) : null}
          {item.actions.campaignHref ? (
            <Link href={item.actions.campaignHref}>
              <Button variant="outline" size="sm">Open Campaign</Button>
            </Link>
          ) : null}
          {item.actions.assetHref ? (
            <Link href={item.actions.assetHref}>
              <Button variant="outline" size="sm">Open Asset</Button>
            </Link>
          ) : null}
          {item.actions.regenerateFromSignalHref ? (
            <Link href={item.actions.regenerateFromSignalHref}>
              <Button variant="outline" size="sm">Regenerate from Signal</Button>
            </Link>
          ) : null}
          {item.kind === 'failure' ? (
            <>
              <Link href={`/engagement?tab=bounces-failures&remediateAction=retry-later&remediateRecipient=${encodeURIComponent(item.id.replace('send-failure-', ''))}`}>
                <Button variant="outline" size="sm">Retry Later</Button>
              </Link>
              <Link href={`/engagement?tab=bounces-failures&remediateAction=switch-persona&remediateRecipient=${encodeURIComponent(item.id.replace('send-failure-', ''))}`}>
                <Button variant="outline" size="sm">Switch Persona</Button>
              </Link>
              <Link href={`/engagement?tab=bounces-failures&remediateAction=mark-bad-address&remediateRecipient=${encodeURIComponent(item.id.replace('send-failure-', ''))}`}>
                <Button variant="outline" size="sm">Mark Bad Address</Button>
              </Link>
            </>
          ) : null}
          {item.actions.outcomeHrefs
            ? OPERATOR_OUTCOME_TAXONOMY.map((label) => {
                const href = item.actions.outcomeHrefs?.[label];
                if (!href) return null;
                return (
                  <Link key={`${item.id}-${label}`} href={href}>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]">
                      {label}
                    </Button>
                  </Link>
                );
              })
            : null}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Recency-first feed pinned above the workspace tabs. Every signal
 * source merged, newest-first, within a selectable look-back window —
 * the answer to "what happened since I sent that email?" without
 * clicking into a tab.
 */
function RecentActivityFeed({
  items,
  selectedWindow,
  selectedTab,
}: {
  items: EngagementItem[];
  selectedWindow: EngagementWindowId;
  selectedTab: string;
}) {
  const accountCount = new Set(
    items.map((item) => item.accountName).filter(Boolean),
  ).size;
  const windowLabel = (
    engagementWindows.find((entry) => entry.id === selectedWindow)?.label ?? 'Last 24h'
  ).toLowerCase();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {items.length === 0
                ? `No engagement in the ${windowLabel}`
                : `${items.length} engagement${items.length === 1 ? '' : 's'} · ${accountCount} account${accountCount === 1 ? '' : 's'} · ${windowLabel}`}
            </p>
          </div>
          <div className="flex gap-1">
            {engagementWindows.map((entry) => (
              <Link key={entry.id} href={`/engagement?tab=${selectedTab}&window=${entry.id}`}>
                <Button
                  variant={entry.id === selectedWindow ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                >
                  {entry.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            Nothing yet — engagement from the {windowLabel} lands here newest-first.
          </p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {items.slice(0, 15).map((item) => (
              <RecentActivityRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivityRow({ item }: { item: EngagementItem }) {
  const href = item.actions.accountHref ?? item.actions.followUpHref;
  const inner = (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm">
          <span className="font-semibold">{item.accountName ?? 'Unknown account'}</span>
          <span className="text-muted-foreground"> — {item.statusLabel}</span>
        </p>
        <p className="truncate text-xs text-muted-foreground">{item.title}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {item.unread ? (
          <Badge variant="default" className="h-5 px-1.5 text-[10px]">new</Badge>
        ) : null}
        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">{item.kind}</Badge>
        <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">
          {formatRelativeTime(item.occurredAt)}
        </span>
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block transition hover:bg-[var(--accent)]/40">
      {inner}
    </Link>
  ) : (
    inner
  );
}
