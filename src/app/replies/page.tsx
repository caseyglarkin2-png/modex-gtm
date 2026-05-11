/**
 * Reply Tracker — operator view of HubSpot email activity for the 40 named accounts.
 *
 * Internal-only page. Auth-gated by the global middleware (no public-route exception).
 * Server component — all HubSpot calls are server-side only; token never leaks to browser.
 */

import { AlertCircle, CheckCircle2, Clock, Mail, MailOpen, MailX, MinusCircle } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isHubSpotConfigured } from '@/lib/hubspot/client';
import { getNamedAccountActivity, type NamedAccountContact } from '@/lib/reply-tracker';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reply Tracker' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(isoString: string | null): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function needsFollowUpBadge(row: NamedAccountContact) {
  if (row.needsFollowUp) {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200 text-xs font-medium">
        Follow up
      </Badge>
    );
  }
  return null;
}

function openedIndicator(opened: boolean) {
  if (opened) {
    return (
      <span className="flex items-center gap-1 text-emerald-700 text-sm">
        <MailOpen className="h-3.5 w-3.5" />
        Yes
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[var(--muted-foreground)] text-sm">
      <MinusCircle className="h-3.5 w-3.5" />
      No
    </span>
  );
}

function repliedIndicator(replied: boolean) {
  if (replied) {
    return (
      <span className="flex items-center gap-1 text-emerald-700 text-sm font-medium">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Yes
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[var(--muted-foreground)] text-sm">
      <MinusCircle className="h-3.5 w-3.5" />
      No
    </span>
  );
}

function nextStepBadge(step: string) {
  const colorMap: Record<string, string> = {
    'send cold v1': 'bg-slate-100 text-slate-700 border-slate-200',
    'send follow-up 2': 'bg-orange-100 text-orange-800 border-orange-200',
    'warm — schedule call': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'follow up soon': 'bg-blue-100 text-blue-800 border-blue-200',
    monitor: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  const cls = colorMap[step] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <Badge className={`${cls} text-xs font-medium`}>{step}</Badge>
  );
}

function rowPriority(row: NamedAccountContact): number {
  // Lower number = higher priority (sorts to top)
  if (row.needsFollowUp) return 0;
  if (row.replied) return 3;
  if (row.lastEmailSentAt && row.opened) return 2;
  if (row.lastEmailSentAt) return 1;
  return 4; // never emailed — show at bottom so the urgent contacts dominate
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ReplyTrackerPage() {
  const hubspotConnected = isHubSpotConfigured();

  let rows: NamedAccountContact[] = [];
  if (hubspotConnected) {
    rows = await getNamedAccountActivity();
  }

  // Check if HubSpot returned a global 401 (all rows have error)
  const allErrored = rows.length > 0 && rows.every((r) => r.error);
  const connected = hubspotConnected && !allErrored;

  // Sort: needs-follow-up first, then by recency
  const sorted = [...rows].sort((a, b) => {
    const priorityDiff = rowPriority(a) - rowPriority(b);
    if (priorityDiff !== 0) return priorityDiff;
    // Secondary: most recent first within same bucket
    if (a.daysSinceLastActivity !== null && b.daysSinceLastActivity !== null) {
      return b.daysSinceLastActivity - a.daysSinceLastActivity;
    }
    return 0;
  });

  const needsFollowUpCount = rows.filter((r) => r.needsFollowUp).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Reply Tracker' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)] tracking-tight">
            Reply Tracker — 40 named accounts
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Operator view of email engagement per contact. Server-rendered from HubSpot.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {connected && needsFollowUpCount > 0 && (
            <Badge className="bg-red-100 text-red-800 border-red-200 text-sm px-3 py-1">
              {needsFollowUpCount} need{needsFollowUpCount === 1 ? 's' : ''} follow-up
            </Badge>
          )}
          {connected ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
              HubSpot connected
            </Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
              HubSpot disconnected
            </Badge>
          )}
        </div>
      </div>

      {/* Disconnected empty state */}
      {!connected && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-start gap-4 py-8">
            <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-yellow-900">HubSpot connection needs refreshing</p>
              <p className="text-sm text-yellow-800 mt-1">
                Set <code className="bg-yellow-100 px-1 rounded text-xs font-mono">HUBSPOT_ACCESS_TOKEN</code> to enable reply tracking.
                Once reconnected, this page will show email engagement for all 40 named contacts.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats summary */}
      {connected && rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                Total contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{rows.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Needs follow-up
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-red-600">{needsFollowUpCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Replied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-emerald-600">
                {rows.filter((r) => r.replied).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                Never emailed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-600">
                {rows.filter((r) => !r.lastEmailSentAt && !r.error).length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main table */}
      {connected && sorted.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--muted)] border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
                    Account
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
                    Contact
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
                    Last sent
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
                    Opened
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
                    Replied
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
                    Days since
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
                    Next step
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sorted.map((row, i) => (
                  <tr
                    key={`${row.accountSlug}-${row.email}-${i}`}
                    className={`hover:bg-[var(--muted)]/50 transition-colors ${
                      row.needsFollowUp ? 'bg-red-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--foreground)]">
                          {row.accountName}
                        </span>
                        {row.needsFollowUp && needsFollowUpBadge(row)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{row.personName}</p>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{row.personTitle}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {row.error ? (
                        <span className="flex items-center gap-1 text-xs text-amber-700">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Lookup error
                        </span>
                      ) : (
                        <div>
                          <p className="text-[var(--foreground)]">{formatDate(row.lastEmailSentAt)}</p>
                          {row.lastEmailSubject && (
                            <p className="text-xs text-[var(--muted-foreground)] mt-0.5 max-w-[180px] truncate" title={row.lastEmailSubject}>
                              {row.lastEmailSubject}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!row.error && openedIndicator(row.opened)}
                    </td>
                    <td className="px-4 py-3">
                      {!row.error && repliedIndicator(row.replied)}
                    </td>
                    <td className="px-4 py-3">
                      {row.daysSinceLastActivity !== null ? (
                        <span
                          className={`text-sm font-medium ${
                            row.daysSinceLastActivity >= 10
                              ? 'text-red-600'
                              : row.daysSinceLastActivity >= 5
                              ? 'text-amber-600'
                              : 'text-[var(--foreground)]'
                          }`}
                        >
                          {row.daysSinceLastActivity}d
                        </span>
                      ) : (
                        <span className="text-[var(--muted-foreground)] text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!row.error && nextStepBadge(row.suggestedNextStep)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty-data state (connected but no contacts — shouldn't happen with 40 accounts) */}
      {connected && sorted.length === 0 && (
        <Card>
          <CardContent className="flex items-center gap-4 py-12 justify-center text-[var(--muted-foreground)]">
            <MailX className="h-6 w-6" />
            <p>No contacts found. Check that account data files are loaded.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
