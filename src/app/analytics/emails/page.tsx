import { Breadcrumb } from '@/components/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Eye, AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { EmailAnalyticsClient } from './email-analytics-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Email Analytics' };

export default async function EmailAnalyticsPage() {
  const [emails, totalCount, replyCount] = await Promise.all([
    prisma.emailLog.findMany({
      orderBy: { sent_at: 'desc' },
      take: 500,
    }),
    prisma.emailLog.count(),
    prisma.notification.count({ where: { type: 'reply' } }),
  ]);

  const kpis = {
    totalSent: totalCount,
    delivered: emails.filter((e) => e.status === 'delivered' || e.status === 'sent').length,
    bounced: emails.filter((e) => e.status === 'bounced').length,
    opened: emails.filter((e) => e.status === 'opened').length,
    replies: replyCount,
  };

  const deliveryRate = kpis.totalSent > 0 ? ((kpis.delivered / kpis.totalSent) * 100).toFixed(1) : '0.0';
  const bounceRate = kpis.totalSent > 0 ? ((kpis.bounced / kpis.totalSent) * 100).toFixed(1) : '0.0';
  const openRate = kpis.delivered > 0 ? ((kpis.opened / kpis.delivered) * 100).toFixed(1) : '0.0';

  const serializedEmails = emails.map((e) => ({
    id: e.id,
    to_email: e.to_email,
    subject: e.subject,
    status: e.status,
    account_name: e.account_name,
    persona_name: e.persona_name,
    sent_at: e.sent_at.toISOString(),
    opened_at: e.opened_at?.toISOString() ?? null,
    thread_id: e.thread_id,
    reply_count: e.reply_count,
    hubspot_engagement_id: e.hubspot_engagement_id,
  }));

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Analytics', href: '/analytics' }, { label: 'Emails' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track all emails sent from the platform. {totalCount} total.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="mt-1 text-3xl font-bold">{kpis.totalSent}</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-2.5">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivery Rate</p>
                <p className="mt-1 text-3xl font-bold">{deliveryRate}%</p>
                <p className="mt-1 text-xs text-muted-foreground">{kpis.delivered} delivered</p>
              </div>
              <div className="rounded-lg bg-emerald-500/10 p-2.5">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Rate</p>
                <p className="mt-1 text-3xl font-bold">{openRate}%</p>
                <p className="mt-1 text-xs text-muted-foreground">{kpis.opened} opened</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-2.5">
                <Eye className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Replies</p>
                <p className="mt-1 text-3xl font-bold">{kpis.replies}</p>
              </div>
              <div className="rounded-lg bg-cyan-500/10 p-2.5">
                <MessageSquare className="h-5 w-5 text-cyan-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bounce Rate</p>
                <p className={`mt-1 text-3xl font-bold ${parseFloat(bounceRate) > 5 ? 'text-red-500' : ''}`}>
                  {bounceRate}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{kpis.bounced} bounced</p>
              </div>
              <div className="rounded-lg bg-red-500/10 p-2.5">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Table with Filters + Row Actions */}
      <EmailAnalyticsClient emails={serializedEmails} />
    </div>
  );
}
