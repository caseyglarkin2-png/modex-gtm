import Link from 'next/link';
import { Activity, AlertTriangle, ArrowRight, Inbox, MousePointerClick } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  buildEngagementItems,
  buildHotAccounts,
  engagementCenterTabs,
  parseEngagementTab,
  type EngagementItem,
} from '@/lib/engagement-center';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Engagement' };

type SearchParams = {
  tab?: string;
  markRead?: string;
  followUpAccount?: string;
  followUpSource?: string;
};

export default async function EngagementPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const selectedTab = parseEngagementTab(params.tab);

  const markReadId = Number(params.markRead);
  if (!Number.isNaN(markReadId) && markReadId > 0) {
    await prisma.notification.updateMany({
      where: { id: markReadId, read: false },
      data: { read: true },
    });
  }

  let followUpCreatedFor: string | null = null;
  let followUpSkippedFor: string | null = null;
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

  const [replyCount, notificationCount, micrositeCount, failedRecipients, notifications, emailLogs, sendFailures, micrositeSessions, meetings, activities] = await Promise.all([
    prisma.notification.count({ where: { type: { contains: 'reply', mode: 'insensitive' } } }),
    prisma.notification.count(),
    prisma.micrositeEngagement.count(),
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
  ]);

  const items = buildEngagementItems({
    notifications,
    emailLogs,
    sendFailures,
    micrositeSessions,
    meetings,
    activities,
  });
  const hotAccounts = buildHotAccounts(items).slice(0, 12);
  const inboxItems = items.filter((item) => item.tab === 'inbox').slice(0, 20);
  const micrositeItems = items.filter((item) => item.tab === 'microsite-sessions').slice(0, 20);
  const failureItems = items.filter((item) => item.tab === 'bounces-failures').slice(0, 20);
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

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={Inbox} label="Replies" value={replyCount} />
        <MetricCard icon={Activity} label="Notifications" value={notificationCount} />
        <MetricCard icon={MousePointerClick} label="Microsite Sessions" value={micrositeCount} />
        <MetricCard icon={AlertTriangle} label="Send Failures" value={failedRecipients} tone="text-amber-600" />
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
      </Tabs>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = 'text-foreground',
}: {
  icon: typeof Inbox;
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${tone}`}>{value}</p>
        </div>
        <div className="rounded-lg bg-muted p-2.5">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
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
                item.occurredAt.toLocaleString(),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={item.unread ? 'default' : 'outline'}>{item.statusLabel}</Badge>
            <Badge variant="outline">{item.kind}</Badge>
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
        </div>
      </CardContent>
    </Card>
  );
}
