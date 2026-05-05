import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AccountEngagementSummary } from '@/lib/account-command-center';

type AccountEngagementSummaryCardProps = {
  summary: AccountEngagementSummary;
};

const METRIC_COPY = [
  { key: 'sent', label: 'Sent' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'opened', label: 'Opened' },
  { key: 'replied', label: 'Replied' },
  { key: 'positiveReplies', label: 'Positive Replies' },
  { key: 'meetingsInfluenced', label: 'Meetings Influenced' },
] as const;

export function AccountEngagementSummaryCard({ summary }: AccountEngagementSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm">Engagement Summary</CardTitle>
          {summary.latestOutcomeLabel ? (
            <Badge variant="outline" className="capitalize">
              Latest outcome: {summary.latestOutcomeLabel.replaceAll('-', ' ')}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {METRIC_COPY.map((metric) => (
            <div key={metric.key} className="rounded-lg border border-[var(--border)] p-3">
              <p className="text-[10px] uppercase text-[var(--muted-foreground)]">{metric.label}</p>
              <p className="mt-1 text-xl font-bold">{summary[metric.key]}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          {summary.latestOutcomeNote?.trim()
            ? summary.latestOutcomeNote
            : 'Use this account-level view to decide whether to expand coverage, change the message, or push the next meeting.'}
        </p>
      </CardContent>
    </Card>
  );
}
