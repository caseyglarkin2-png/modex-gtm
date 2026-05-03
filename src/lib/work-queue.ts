import { slugify } from '@/lib/data';
import { computeStuckJobs, type StuckGenerationJobRow, type StuckSendJobRow } from '@/lib/admin/stuck-jobs';

export type WorkQueueTabId =
  | 'my-work'
  | 'follow-ups'
  | 'captures'
  | 'approvals'
  | 'system-jobs'
  | 'stuck-failed';

export type WorkQueueTab = {
  id: WorkQueueTabId;
  label: string;
  purpose: string;
};

export type WorkQueueItemTypeId =
  | 'operator-action'
  | 'follow-up'
  | 'capture'
  | 'approval'
  | 'generation-job'
  | 'send-job'
  | 'stuck-job';

export type WorkQueueItemType = {
  id: WorkQueueItemTypeId;
  label: string;
  source: string;
  displayBehavior: string;
  canonicalTab: WorkQueueTabId;
};

export type QueueSeverity = 'high' | 'medium' | 'low';

export type WorkQueueItem = {
  id: string;
  itemType: WorkQueueItemTypeId;
  sourceId: string;
  accountName?: string;
  accountSlug?: string;
  campaignName?: string;
  campaignSlug?: string;
  title: string;
  detail: string;
  dueAt?: Date;
  createdAt: Date;
  statusLabel: string;
  severity: QueueSeverity;
  sourceTab: WorkQueueTabId;
  quickActions: {
    completeKey: string;
    snoozeKey: string;
    retry?: { kind: 'generation' | 'send'; id: number };
    accountHref?: string;
    campaignHref?: string;
  };
};

export type QueueActivitySource = {
  id: number;
  account_name: string;
  activity_type: string;
  next_step: string | null;
  outcome: string | null;
  next_step_due: Date | null;
  notes: string | null;
  created_at: Date;
};

export type QueueCaptureSource = {
  id: number;
  account_name: string;
  persona_name: string | null;
  notes: string | null;
  heat_score: number;
  due_date: Date | null;
  followup_status: string | null;
  created_at: Date;
};

export type QueueApprovalSource = {
  id: number;
  type: string;
  account_name: string | null;
  subject: string | null;
  preview: string | null;
  read: boolean;
  created_at: Date;
};

export type QueueGenerationSource = {
  id: number;
  account_name: string;
  status: string;
  retry_count: number;
  error_message: string | null;
  campaign: { slug: string; name: string } | null;
  created_at: Date;
  updated_at: Date;
  started_at: Date | null;
};

export type QueueSendSource = {
  id: number;
  status: string;
  failed_count: number;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
  started_at: Date | null;
  recipients: Array<{
    account_name: string;
    status: string;
    error_message: string | null;
    campaign: { slug: string; name: string } | null;
  }>;
};

export type WorkQueueSources = {
  activities: QueueActivitySource[];
  captures: QueueCaptureSource[];
  approvals: QueueApprovalSource[];
  generationJobs: QueueGenerationSource[];
  sendJobs: QueueSendSource[];
};

export const workQueueTabs: WorkQueueTab[] = [
  { id: 'my-work', label: 'My Work', purpose: 'Prioritized operator tasks that are ready to execute now.' },
  { id: 'follow-ups', label: 'Follow-ups', purpose: 'Buyer-response and operator follow-up work from activities and engagement signals.' },
  { id: 'captures', label: 'Captures', purpose: 'Field/mobile captures awaiting processing and outreach handoff.' },
  { id: 'approvals', label: 'Approvals', purpose: 'Approval-gated items that need operator confirmation.' },
  { id: 'system-jobs', label: 'System Jobs', purpose: 'Generation and send system work, including retry workflows.' },
  { id: 'stuck-failed', label: 'Stuck/Failed', purpose: 'Escalation list for failed or stuck background jobs.' },
];

export const workQueueItemTypes: WorkQueueItemType[] = [
  {
    id: 'operator-action',
    label: 'Operator Action',
    source: 'Activity',
    displayBehavior: 'Shows owner next step with due-date urgency and direct account context.',
    canonicalTab: 'my-work',
  },
  {
    id: 'follow-up',
    label: 'Follow-up',
    source: 'Activity (including engagement follow-up tasks)',
    displayBehavior: 'Highlights follow-up tasks and allows in-place completion/snooze.',
    canonicalTab: 'follow-ups',
  },
  {
    id: 'capture',
    label: 'Capture',
    source: 'MobileCapture and offline queue',
    displayBehavior: 'Shows heat, contact context, and conversion into follow-up work.',
    canonicalTab: 'captures',
  },
  {
    id: 'approval',
    label: 'Approval',
    source: 'Notification approval signal',
    displayBehavior: 'Shows unread approval requests and routes to decision surface.',
    canonicalTab: 'approvals',
  },
  {
    id: 'generation-job',
    label: 'Generation Job',
    source: 'GenerationJob',
    displayBehavior: 'Shows job status and retry actions when failures occur.',
    canonicalTab: 'system-jobs',
  },
  {
    id: 'send-job',
    label: 'Send Job',
    source: 'SendJob + SendJobRecipient',
    displayBehavior: 'Shows recipient failures and retry-failed action at job level.',
    canonicalTab: 'system-jobs',
  },
  {
    id: 'stuck-job',
    label: 'Stuck Job',
    source: 'Derived from processing jobs older than threshold',
    displayBehavior: 'Escalates stale jobs with recommended remediation path.',
    canonicalTab: 'stuck-failed',
  },
];

function toCampaignHref(campaignSlug: string | undefined): string | undefined {
  return campaignSlug ? `/campaigns/${campaignSlug}` : undefined;
}

function activitySeverity(activity: QueueActivitySource): QueueSeverity {
  if (activity.next_step_due && activity.next_step_due.getTime() < Date.now()) return 'high';
  if (activity.activity_type.toLowerCase().includes('follow-up')) return 'medium';
  return 'low';
}

export function buildWorkQueueItems(input: WorkQueueSources): WorkQueueItem[] {
  const activityItems: WorkQueueItem[] = input.activities.map((activity) => {
    const accountSlug = slugify(activity.account_name);
    const isFollowUp = activity.activity_type.toLowerCase().includes('follow-up');
    return {
      id: `activity-${activity.id}`,
      itemType: isFollowUp ? 'follow-up' : 'operator-action',
      sourceId: String(activity.id),
      accountName: activity.account_name,
      accountSlug,
      title: isFollowUp ? 'Follow-up task' : activity.activity_type,
      detail: activity.next_step ?? activity.outcome ?? 'No additional detail.',
      dueAt: activity.next_step_due ?? undefined,
      createdAt: activity.created_at,
      statusLabel: activity.next_step_due ? 'Scheduled' : 'Open',
      severity: activitySeverity(activity),
      sourceTab: isFollowUp ? 'follow-ups' : 'my-work',
      quickActions: {
        completeKey: `activity-${activity.id}-complete`,
        snoozeKey: `activity-${activity.id}-snooze`,
        accountHref: `/accounts/${accountSlug}`,
      },
    };
  });

  const captureItems: WorkQueueItem[] = input.captures.map((capture) => {
    const accountSlug = slugify(capture.account_name);
    const heat = capture.heat_score ?? 0;
    const severity: QueueSeverity = heat >= 16 ? 'high' : heat >= 12 ? 'medium' : 'low';
    return {
      id: `capture-${capture.id}`,
      itemType: 'capture',
      sourceId: String(capture.id),
      accountName: capture.account_name,
      accountSlug,
      title: 'Field capture follow-up',
      detail: `${capture.persona_name ?? 'Contact TBD'} · Heat ${heat}/20`,
      dueAt: capture.due_date ?? undefined,
      createdAt: capture.created_at,
      statusLabel: capture.followup_status ?? 'Open',
      severity,
      sourceTab: 'captures',
      quickActions: {
        completeKey: `capture-${capture.id}-complete`,
        snoozeKey: `capture-${capture.id}-snooze`,
        accountHref: `/accounts/${accountSlug}`,
      },
    };
  });

  const approvalItems: WorkQueueItem[] = input.approvals.map((approval) => {
    const accountSlug = approval.account_name ? slugify(approval.account_name) : undefined;
    return {
      id: `approval-${approval.id}`,
      itemType: 'approval',
      sourceId: String(approval.id),
      accountName: approval.account_name ?? undefined,
      accountSlug,
      title: approval.subject ?? 'Approval required',
      detail: approval.preview ?? 'Approval request requires operator review.',
      createdAt: approval.created_at,
      statusLabel: approval.read ? 'Viewed' : 'Needs review',
      severity: approval.read ? 'low' : 'medium',
      sourceTab: 'approvals',
      quickActions: {
        completeKey: `approval-${approval.id}-complete`,
        snoozeKey: `approval-${approval.id}-snooze`,
        accountHref: accountSlug ? `/accounts/${accountSlug}` : undefined,
      },
    };
  });

  const generationItems: WorkQueueItem[] = input.generationJobs.map((job) => {
    const accountSlug = slugify(job.account_name);
    const campaignSlug = job.campaign?.slug;
    const statusLabel = job.status === 'failed' ? 'Failed' : job.status === 'processing' ? 'Processing' : 'Queued';
    const severity: QueueSeverity = job.status === 'failed' ? 'high' : job.status === 'processing' ? 'medium' : 'low';
    return {
      id: `generation-${job.id}`,
      itemType: 'generation-job',
      sourceId: String(job.id),
      accountName: job.account_name,
      accountSlug,
      campaignName: job.campaign?.name,
      campaignSlug,
      title: `Generation job #${job.id}`,
      detail: job.error_message ?? `Retry count ${job.retry_count}`,
      createdAt: job.created_at,
      statusLabel,
      severity,
      sourceTab: 'system-jobs',
      quickActions: {
        completeKey: `generation-${job.id}-complete`,
        snoozeKey: `generation-${job.id}-snooze`,
        retry: job.status === 'failed' && job.retry_count < 3 ? { kind: 'generation', id: job.id } : undefined,
        accountHref: `/accounts/${accountSlug}`,
        campaignHref: toCampaignHref(campaignSlug),
      },
    };
  });

  const sendItems: WorkQueueItem[] = input.sendJobs.map((job) => {
    const failedRecipient = job.recipients.find((recipient) => recipient.status === 'failed');
    const accountName = failedRecipient?.account_name;
    const accountSlug = accountName ? slugify(accountName) : undefined;
    const campaignSlug = failedRecipient?.campaign?.slug;
    return {
      id: `send-${job.id}`,
      itemType: 'send-job',
      sourceId: String(job.id),
      accountName,
      accountSlug,
      campaignName: failedRecipient?.campaign?.name,
      campaignSlug,
      title: `Send job #${job.id}`,
      detail: job.error_message ?? `${job.failed_count} failed recipients`,
      createdAt: job.created_at,
      statusLabel: job.failed_count > 0 ? 'Failed recipients' : job.status,
      severity: job.failed_count > 0 || job.status === 'failed' ? 'high' : job.status === 'processing' ? 'medium' : 'low',
      sourceTab: 'system-jobs',
      quickActions: {
        completeKey: `send-${job.id}-complete`,
        snoozeKey: `send-${job.id}-snooze`,
        retry: job.failed_count > 0 || job.status === 'failed' ? { kind: 'send', id: job.id } : undefined,
        accountHref: accountSlug ? `/accounts/${accountSlug}` : undefined,
        campaignHref: toCampaignHref(campaignSlug),
      },
    };
  });

  const stuckJobs = computeStuckJobs({
    generationJobs: input.generationJobs.map((job) => ({
      id: job.id,
      account_name: job.account_name,
      status: job.status,
      started_at: job.started_at,
      updated_at: job.updated_at,
    })) as StuckGenerationJobRow[],
    sendJobs: input.sendJobs.map((job) => ({
      id: job.id,
      status: job.status,
      started_at: job.started_at,
      updated_at: job.updated_at,
      total_recipients: 0,
      sent_count: 0,
      failed_count: job.failed_count,
    })) as StuckSendJobRow[],
  });

  const stuckItems: WorkQueueItem[] = stuckJobs.map((job) => ({
    id: `stuck-${job.kind}-${job.id}`,
    itemType: 'stuck-job',
    sourceId: String(job.id),
    accountName: job.kind === 'generation' ? job.label : undefined,
    accountSlug: job.kind === 'generation' ? slugify(job.label) : undefined,
    title: job.label,
    detail: job.recommendedAction,
    createdAt: job.updatedAt,
    statusLabel: `${job.ageMinutes}m stale`,
    severity: 'high',
    sourceTab: 'stuck-failed',
    quickActions: {
      completeKey: `stuck-${job.kind}-${job.id}-complete`,
      snoozeKey: `stuck-${job.kind}-${job.id}-snooze`,
      retry: { kind: job.kind === 'generation' ? 'generation' : 'send', id: job.id },
      accountHref: job.kind === 'generation' ? `/accounts/${slugify(job.label)}` : undefined,
    },
  }));

  return [...activityItems, ...captureItems, ...approvalItems, ...generationItems, ...sendItems, ...stuckItems]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
}

export function getMyWorkItems(items: WorkQueueItem[]): WorkQueueItem[] {
  return items
    .filter((item) => (
      item.sourceTab === 'follow-ups' ||
      item.sourceTab === 'captures' ||
      item.sourceTab === 'approvals' ||
      (item.sourceTab === 'system-jobs' && item.severity !== 'low')
    ))
    .sort((left, right) => severityRank(right.severity) - severityRank(left.severity) || right.createdAt.getTime() - left.createdAt.getTime());
}

function severityRank(severity: QueueSeverity): number {
  if (severity === 'high') return 3;
  if (severity === 'medium') return 2;
  return 1;
}

export function parseWorkQueueTab(tab: string | undefined): WorkQueueTabId {
  const tabIds = new Set(workQueueTabs.map((item) => item.id));
  return tabIds.has(tab as WorkQueueTabId) ? (tab as WorkQueueTabId) : 'my-work';
}
