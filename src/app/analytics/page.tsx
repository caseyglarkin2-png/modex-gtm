import Link from 'next/link';
import { Breadcrumb } from '@/components/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { BandBadge } from '@/components/band-badge';
import {
  BarChart3, Mail, MousePointerClick, Eye, TrendingUp, Users, Building2,
  CalendarCheck, Activity, ArrowRight, Sparkles, DollarSign, FileText, Download, Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dbGetDashboardStats, dbGetAccounts, dbGetMicrositeAnalytics } from '@/lib/db';
import { getCampaignSummaries } from '@/lib/campaigns';
import { AutoRefresh } from '@/components/auto-refresh';

export const metadata = { title: 'Analytics — Board Report' };
export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const [stats, accounts, microsite, campaigns] = await Promise.all([
    dbGetDashboardStats(),
    dbGetAccounts(),
    dbGetMicrositeAnalytics(),
    getCampaignSummaries(),
  ]);

  // Pipeline funnel from live DB
  const funnel = [
    { label: 'Target Accounts', count: stats.accountCount, pct: 100 },
    { label: 'Research Complete', count: stats.researched, pct: stats.accountCount ? Math.round((stats.researched / stats.accountCount) * 100) : 0 },
    { label: 'Contacted', count: stats.contacted, pct: stats.contacted ? Math.round((stats.contacted / Math.max(stats.emailsSent, 1)) * 100) : 0 },
    { label: 'Meetings Booked', count: stats.meetingsBooked, pct: stats.accountCount ? Math.round((stats.meetingsBooked / stats.accountCount) * 100) : 0 },
  ];

  // ROI comparison data
  const twoSalesReps = 180000; // ~$90k base × 2

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Analytics' }]} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics &amp; Board Report</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Live metrics from the MODEX 2026 RevOps Operating System
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1.5 text-xs">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <AutoRefresh intervalMs={30_000} />
          </Badge>
          <Link href="/pipeline">
            <Button variant="outline" size="sm" className="text-xs gap-1">Pipeline Board</Button>
          </Link>
          <Link href="/analytics/quarterly">
            <Button variant="outline" size="sm" className="text-xs gap-1">Quarterly Review</Button>
          </Link>
          <Link href="/analytics/emails">
            <Button variant="outline" size="sm" className="text-xs gap-1">Email Analytics</Button>
          </Link>
          <Link href="/api/export?type=pipeline" target="_blank">
            <Button variant="outline" size="sm" className="text-xs gap-1">Export Pipeline CSV</Button>
          </Link>
          <Link href="/api/export?type=activities" target="_blank">
            <Button variant="outline" size="sm" className="text-xs gap-1">Export Activities CSV</Button>
          </Link>
          <Link href="/api/export?type=microsites" target="_blank">
            <Button variant="outline" size="sm" className="text-xs gap-1">Export Microsite CSV</Button>
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Emails Sent</p>
                <p className="mt-1 text-3xl font-bold">{stats.emailsSent}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{stats.emailsDelivered} delivered · {stats.emailsBounced} bounced</p>
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
                <p className="text-sm text-[var(--muted-foreground)]">Open Rate</p>
                <p className="mt-1 text-3xl font-bold">{stats.openRate}%</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{stats.emailsOpened} opened of {stats.emailsDelivered} delivered</p>
              </div>
              <div className="rounded-lg bg-emerald-500/10 p-2.5">
                <Eye className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Bounce Rate</p>
                <p className={`mt-1 text-3xl font-bold ${stats.bounceRate > 10 ? 'text-red-500' : stats.bounceRate > 5 ? 'text-amber-500' : ''}`}>{stats.bounceRate}%</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{stats.emailsBounced} bounced · {stats.deliveryRate}% delivery</p>
              </div>
              <div className={`rounded-lg p-2.5 ${stats.bounceRate > 10 ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                <TrendingUp className={`h-5 w-5 ${stats.bounceRate > 10 ? 'text-red-500' : 'text-amber-500'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Meetings</p>
                <p className="mt-1 text-3xl font-bold">{stats.meetingsCount}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{stats.meetingsBooked} accounts booked</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-2.5">
                <CalendarCheck className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Campaign Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{campaign.campaign_type.replace(/_/g, ' ')}</p>
                  </div>
                  <Badge variant={campaign.status === 'active' ? 'default' : 'outline'}>{campaign.status}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded border p-2">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Emails</p>
                    <p className="text-lg font-bold">{campaign._count.email_logs}</p>
                  </div>
                  <div className="rounded border p-2">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Waves</p>
                    <p className="text-lg font-bold">{campaign._count.outreach_waves}</p>
                  </div>
                  <div className="rounded border p-2">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Activity</p>
                    <p className="text-lg font-bold">{campaign._count.activities}</p>
                  </div>
                </div>
                <Link href={`/campaigns/${campaign.slug}/analytics`}>
                  <Button variant="outline" size="sm" className="mt-3 gap-1 text-xs">Open Campaign Analytics</Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Pipeline Funnel + ROI ─────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" /> Pipeline Funnel (Live)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnel.map((stage) => (
              <div key={stage.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{stage.label}</span>
                  <span className="font-semibold">{stage.count} <span className="text-xs font-normal text-[var(--muted-foreground)]">({stage.pct}%)</span></span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-all"
                    style={{ width: `${stage.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-emerald-500" /> ROI: GTM Advisor vs. 2 Sales Reps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">GTM Advisor (Casey)</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">$0</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Equity + commission only</p>
                </div>
                <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-500">2 Sales Reps</p>
                  <p className="mt-2 text-2xl font-bold text-red-500">${twoSalesReps.toLocaleString()}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">~$90k base × 2 + benefits</p>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--border)] p-4 space-y-2">
                <p className="text-sm font-medium">What the advisor delivers:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
                    <span>{stats.accountCount} accounts targeted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-[var(--primary)]" />
                    <span>{stats.personaCount} personas mapped</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-[var(--primary)]" />
                    <span>{stats.emailsSent} emails sent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-[var(--primary)]" />
                    <span>{stats.activitiesCount} activities logged</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5 text-[var(--primary)]" />
                    <span>{stats.generatedCount} AI content pieces</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-[var(--primary)]" />
                    <span>Full RevOps OS built</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[var(--muted-foreground)] italic">
                The RevOps OS is a force multiplier — it compounds with every account added.
                Two sales reps ramp 3-6 months. This system is live now.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Activity Summary + Coverage ────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" /> Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Activities', value: stats.activitiesCount, icon: Activity },
                { label: 'Meetings', value: stats.meetingsCount, icon: CalendarCheck },
                { label: 'Captures', value: stats.capturesCount, icon: Users },
                { label: 'AI Tasks', value: stats.generatedCount, icon: Sparkles },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3">
                  <div className="rounded-md bg-[var(--accent)] p-2">
                    <item.icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{item.value}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" /> Account Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-3 mb-4">
                {(['A', 'B', 'C', 'D'] as const).map((band) => (
                  <div key={band} className="rounded-lg border border-[var(--border)] p-3 text-center">
                    <BandBadge band={band} />
                    <p className="mt-2 text-2xl font-bold">{stats.bandCounts[band]}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                {stats.personaCount} personas across {stats.accountCount} accounts • {stats.p1Count} P1 priority contacts
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MousePointerClick className="h-4 w-4" /> Microsite Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {microsite.totalSessions === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                No microsite engagement captured yet. Public account pages are instrumented and will populate this dashboard as visits land.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {[
                    {
                      label: 'Sessions',
                      value: microsite.totalSessions,
                      detail: `${microsite.highIntentSessions} high-intent`,
                      icon: Eye,
                    },
                    {
                      label: 'Accounts Active',
                      value: microsite.accountsEngaged,
                      detail: `${microsite.ctaSessions} CTA sessions`,
                      icon: Building2,
                    },
                    {
                      label: 'Proposal Reads',
                      value: microsite.proposalSessions,
                      detail: 'Sessions that opened the shareable brief',
                      icon: FileText,
                    },
                    {
                      label: 'ROI Reads',
                      value: microsite.roiSessions,
                      detail: 'Sessions that reached the value model',
                      icon: Calculator,
                    },
                    {
                      label: 'Export Clicks',
                      value: microsite.exportSessions,
                      detail: 'Board-ready export downloads requested',
                      icon: Download,
                    },
                    {
                      label: 'Avg Scroll',
                      value: `${microsite.avgScrollDepthPct}%`,
                      detail: `${formatDurationCompact(microsite.avgDurationSeconds)} average read`,
                      icon: TrendingUp,
                    },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-[var(--border)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-[var(--muted-foreground)]">{item.label}</p>
                          <p className="mt-1 text-2xl font-bold">{item.value}</p>
                          <p className="mt-1 text-xs text-[var(--muted-foreground)]">{item.detail}</p>
                        </div>
                        <div className="rounded-md bg-[var(--accent)] p-2">
                          <item.icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-[var(--border)] p-4">
                  <p className="text-sm font-medium">Operator takeaway</p>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
                    Proposal reads show who is carrying the brief internally. ROI reads show who made it to the value case. Export clicks are the highest-intent signal in the stack and should trigger same-day follow-up.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" /> Hot Microsite Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {microsite.hotAccounts.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                No hot accounts yet. This list will rank accounts by CTA activity, deep reads, scroll depth, and recency.
              </p>
            ) : (
              <div className="space-y-3">
                {microsite.hotAccounts.map((account) => (
                  <div key={account.accountName} className="rounded-lg border border-[var(--border)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/accounts/${slugifyAccountName(account.accountName)}`} className="text-sm font-semibold text-[var(--primary)] hover:underline">
                            {account.accountName}
                          </Link>
                          <MicrositeHeatBadge score={account.engagementScore} />
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          {account.primarySignal} · {account.sessionCount} sessions · {account.avgScrollDepthPct}% average scroll
                        </p>
                      </div>
                      <Link href={account.lastPath} className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline">
                        Open microsite <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    <p className="mt-3 text-sm text-[var(--muted-foreground)] leading-relaxed">
                      {account.recommendedAction}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
                      <span>{account.proposalSessions} proposal reads</span>
                      <span>{account.roiSessions} ROI reads</span>
                      <span>{account.exportSessions} exports</span>
                      <span>Last seen {formatTimestamp(account.lastViewedAt)}</span>
                      {account.lastPersonName && <span>Latest viewer: {account.lastPersonName}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" /> Recent Microsite Sessions
            </CardTitle>
            <Badge variant="outline" className="text-xs">{microsite.totalSessions} tracked</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {microsite.recentSessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              No tracked microsite sessions yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                    <th className="pb-2 text-left font-medium">Account</th>
                    <th className="pb-2 text-left font-medium hidden md:table-cell">Viewer</th>
                    <th className="pb-2 text-center font-medium">Intent</th>
                    <th className="pb-2 text-center font-medium">Depth</th>
                    <th className="pb-2 text-center font-medium hidden sm:table-cell">Signals</th>
                    <th className="pb-2 text-right font-medium">Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {microsite.recentSessions.map((session) => (
                    <tr key={`${session.accountName}-${session.path}-${session.viewedAt.toISOString()}`} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-2">
                        <div className="flex flex-col">
                          <Link href={session.path} className="text-xs font-medium text-[var(--primary)] hover:underline">
                            {session.accountName}
                          </Link>
                          <span className="text-[10px] text-[var(--muted-foreground)]">{session.path}</span>
                        </div>
                      </td>
                      <td className="py-2 text-xs hidden md:table-cell text-[var(--muted-foreground)]">
                        {session.personName ?? 'Overview'}
                      </td>
                      <td className="py-2 text-center">
                        <MicrositeIntentBadge highIntent={session.isHighIntent} score={session.intentScore} />
                      </td>
                      <td className="py-2 text-center text-xs">
                        {session.scrollDepthPct}% · {formatDurationCompact(session.durationSeconds)}
                      </td>
                      <td className="py-2 text-center text-xs hidden sm:table-cell text-[var(--muted-foreground)]">
                        <div className="flex flex-wrap justify-center gap-1.5">
                          <span>{session.sectionsViewedCount} sections</span>
                          <span>{session.ctaCount} CTAs</span>
                          <span>{Math.max(session.variantCount - 1, 0)} switches</span>
                          {session.proposalViewed && <span>Proposal</span>}
                          {session.roiViewed && <span>ROI</span>}
                          {session.exportClicked && <span>Export</span>}
                        </div>
                      </td>
                      <td className="py-2 text-right text-xs text-[var(--muted-foreground)]">
                        {formatTimestamp(session.viewedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Recent Email Activity (Send Log) ─────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" /> Email Send Log
            </CardTitle>
            <Badge variant="outline" className="text-xs">{stats.emailsSent} total</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {stats.recentEmails.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              No emails sent yet. Send your first outreach from Campaign HQ.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                    <th className="pb-2 text-left font-medium">Account</th>
                    <th className="pb-2 text-left font-medium hidden sm:table-cell">To</th>
                    <th className="pb-2 text-left font-medium">Subject</th>
                    <th className="pb-2 text-center font-medium">Status</th>
                    <th className="pb-2 text-right font-medium">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentEmails.map((email) => (
                    <tr key={email.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-2 text-xs font-medium">{email.account_name || '—'}</td>
                      <td className="py-2 text-xs hidden sm:table-cell text-[var(--muted-foreground)]">{email.to_email}</td>
                      <td className="py-2 text-xs max-w-48 truncate">{email.subject}</td>
                      <td className="py-2 text-center">
                        <EmailStatusBadge status={email.status} opened={!!email.opened_at} clicked={!!email.clicked_at} />
                      </td>
                      <td className="py-2 text-right text-xs text-[var(--muted-foreground)]">
                        {(email.sent_at ?? email.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Account Pipeline Table ────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" /> Account Pipeline Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                  <th className="pb-2 text-left font-medium">#</th>
                  <th className="pb-2 text-left font-medium">Account</th>
                  <th className="pb-2 text-center font-medium">Band</th>
                  <th className="pb-2 text-left font-medium">Research</th>
                  <th className="pb-2 text-left font-medium">Outreach</th>
                  <th className="pb-2 text-left font-medium">Meeting</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2 text-xs text-[var(--muted-foreground)]">{a.rank}</td>
                    <td className="py-2">
                      <Link href={`/accounts/${a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="font-medium text-xs text-[var(--primary)] hover:underline">
                        {a.name}
                      </Link>
                    </td>
                    <td className="py-2 text-center"><BandBadge band={a.priority_band} /></td>
                    <td className="py-2"><StatusBadge status={a.research_status} /></td>
                    <td className="py-2"><StatusBadge status={a.outreach_status} /></td>
                    <td className="py-2"><StatusBadge status={a.meeting_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatDurationCompact(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function formatTimestamp(value: Date) {
  return value.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function slugifyAccountName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function MicrositeHeatBadge({ score }: { score: number }) {
  if (score >= 70) return <Badge className="bg-red-500 text-white text-xs">Hot {score}</Badge>;
  if (score >= 45) return <Badge className="bg-amber-500 text-white text-xs">Warm {score}</Badge>;
  return <Badge className="bg-blue-500 text-white text-xs">Watch {score}</Badge>;
}

function MicrositeIntentBadge({ highIntent, score }: { highIntent: boolean; score: number }) {
  if (highIntent) return <Badge className="bg-emerald-500 text-white text-xs">High {score}</Badge>;
  return <Badge variant="outline" className="text-xs">Light {score}</Badge>;
}

function EmailStatusBadge({ status, opened, clicked }: { status: string; opened: boolean; clicked: boolean }) {
  if (clicked) return <Badge className="bg-violet-500 text-white text-xs">Clicked</Badge>;
  if (opened) return <Badge className="bg-emerald-500 text-white text-xs">Opened</Badge>;
  if (status === 'delivered') return <Badge className="bg-blue-500 text-white text-xs">Delivered</Badge>;
  if (status === 'bounced') return <Badge variant="destructive" className="text-xs">Bounced</Badge>;
  if (status === 'failed') return <Badge variant="destructive" className="text-xs">Failed</Badge>;
  return <Badge variant="secondary" className="text-xs">Sent</Badge>;
}
