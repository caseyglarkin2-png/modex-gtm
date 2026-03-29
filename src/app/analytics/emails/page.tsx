import { Breadcrumb } from '@/components/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Email Analytics' };

export default async function EmailAnalyticsPage() {
  const emails = await prisma.emailLog.findMany({
    orderBy: { sent_at: 'desc' },
    take: 100,
  });

  const kpis = {
    totalSent: emails.length,
    delivered: emails.filter((e) => e.status === 'delivered' || e.status === 'sent').length,
    bounced: emails.filter((e) => e.status === 'bounced').length,
    opened: emails.filter((e) => e.status === 'opened').length,
  };

  const deliveryRate = kpis.totalSent > 0 ? ((kpis.delivered / kpis.totalSent) * 100).toFixed(1) : '0.0';
  const bounceRate = kpis.totalSent > 0 ? ((kpis.bounced / kpis.totalSent) * 100).toFixed(1) : '0.0';
  const openRate = kpis.delivered > 0 ? ((kpis.opened / kpis.delivered) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Analytics', href: '/analytics' }, { label: 'Emails' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track all emails sent from the platform
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      {/* Recent Emails Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Emails</CardTitle>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No emails sent yet. Generate a sequence in Studio and send your first email!
            </p>
          ) : (
            <div className="space-y-3">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="rounded-lg border border-input p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{email.subject}</p>
                        <Badge variant={
                          email.status === 'bounced' ? 'destructive' :
                          email.status === 'opened' ? 'default' :
                          'secondary'
                        } className="text-xs">
                          {email.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        To: {email.to_email} · {email.account_name}
                        {email.persona_name && ` · ${email.persona_name}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(email.sent_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
