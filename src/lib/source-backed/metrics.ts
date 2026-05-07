import { prisma } from '@/lib/prisma';

export type SourceBackedMetricName =
  | 'approval_blocks'
  | 'sidecar_unavailable'
  | 'citation_rejections'
  | 'one_account_invariant_violations'
  | 'cc_sanitization_drops';

export async function recordSourceBackedMetric(input: {
  metric: SourceBackedMetricName;
  endpoint: string;
  accountName?: string | null;
  value?: number;
  details?: Record<string, unknown>;
}) {
  if (!input.accountName?.trim()) return;
  await prisma.activity.create({
    data: {
      account_name: input.accountName,
      activity_type: 'Agent Workflow',
      owner: 'Codex',
      outcome: `source_backed_metric:${input.metric}`.slice(0, 240),
      notes: JSON.stringify({
        metric: input.metric,
        endpoint: input.endpoint,
        value: input.value ?? 1,
        details: input.details ?? {},
      }),
      activity_date: new Date(),
    },
  }).catch(() => undefined);
}
