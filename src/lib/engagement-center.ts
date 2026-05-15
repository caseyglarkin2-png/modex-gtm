import { slugify } from '@/lib/data';
import { OPERATOR_OUTCOME_TAXONOMY, type OperatorOutcomeLabel } from '@/lib/revops/operator-outcomes';
import { classifyFailure, recommendRetryForClass, type FailureClass } from '@/lib/revops/failure-intelligence';

export type EngagementTabId =
  | 'inbox'
  | 'hot-accounts'
  | 'microsite-sessions'
  | 'bounces-failures'
  | 'recent-touches'
  | 'learning-review';

export type EngagementTab = {
  id: EngagementTabId;
  label: string;
  purpose: string;
};

export type EngagementSource =
  | 'notification'
  | 'email-log'
  | 'send-job-recipient'
  | 'microsite-engagement'
  | 'meeting'
  | 'activity';

export type EngagementKind =
  | 'reply'
  | 'open'
  | 'click'
  | 'bounce'
  | 'failure'
  | 'microsite-session'
  | 'meeting'
  | 'activity';

export type EngagementSeverity = 'high' | 'medium' | 'low';

export type EngagementItem = {
  id: string;
  source: EngagementSource;
  kind: EngagementKind;
  tab: EngagementTabId;
  occurredAt: Date;
  accountName?: string;
  accountSlug?: string;
  personaLabel?: string;
  campaignId?: number;
  campaignName?: string;
  campaignSlug?: string;
  title: string;
  preview: string;
  statusLabel: string;
  unread: boolean;
  severity: EngagementSeverity;
  failureClass?: FailureClass;
  retryRecommendation?: ReturnType<typeof recommendRetryForClass>['recommended'];
  actions: {
    markReadHref?: string;
    followUpHref?: string;
    accountHref?: string;
    campaignHref?: string;
    assetHref?: string;
    regenerateFromSignalHref?: string;
    outcomeHrefs?: Partial<Record<OperatorOutcomeLabel, string>>;
  };
};

export type HotAccount = {
  accountName: string;
  accountSlug: string;
  score: number;
  signalCount: number;
  unreadSignals: number;
  topSignal: EngagementKind;
  nextAction: string;
  accountHref: string;
};

export type NotificationSource = {
  id: number;
  type: string;
  account_name: string | null;
  persona_email: string | null;
  subject: string | null;
  preview: string | null;
  read: boolean;
  created_at: Date;
};

export type EmailLogSource = {
  id: number;
  account_name: string;
  persona_name: string | null;
  to_email: string;
  subject: string;
  campaign_id: number | null;
  campaign?: { name: string; slug: string } | null;
  status: string;
  generated_content_id: number | null;
  opened_at: Date | null;
  clicked_at: Date | null;
  sent_at: Date;
};

export type SendJobFailureSource = {
  id: number;
  account_name: string;
  persona_name: string | null;
  to_email: string;
  error_message: string | null;
  campaign_id: number | null;
  generated_content_id?: number | null;
  campaign?: { name: string; slug: string } | null;
  updated_at: Date;
};

export type MicrositeSource = {
  id: string;
  account_name: string;
  person_name: string | null;
  path: string;
  scroll_depth_pct: number;
  duration_seconds: number;
  cta_ids: string[];
  updated_at: Date;
};

export type MeetingSource = {
  id: number;
  account_name: string;
  persona: string | null;
  meeting_status: string;
  objective: string | null;
  meeting_date: Date | null;
  updated_at: Date;
};

export type ActivitySource = {
  id: number;
  account_name: string;
  activity_type: string;
  persona: string | null;
  outcome: string | null;
  next_step: string | null;
  created_at: Date;
};

export type EngagementSourceBundle = {
  notifications: NotificationSource[];
  emailLogs: EmailLogSource[];
  sendFailures: SendJobFailureSource[];
  micrositeSessions: MicrositeSource[];
  meetings: MeetingSource[];
  activities: ActivitySource[];
};

export const engagementCenterTabs: EngagementTab[] = [
  {
    id: 'inbox',
    label: 'Inbox',
    purpose: 'Replies, opens/clicks, and immediate buyer-response triage.',
  },
  {
    id: 'hot-accounts',
    label: 'Hot Accounts',
    purpose: 'Highest-priority account response signals and next action.',
  },
  {
    id: 'microsite-sessions',
    label: 'Microsite Sessions',
    purpose: 'Track active microsite behavior with direct account and asset links.',
  },
  {
    id: 'bounces-failures',
    label: 'Bounces/Failures',
    purpose: 'Delivery failures and bounce signals that require remediation.',
  },
  {
    id: 'recent-touches',
    label: 'Recent Touches',
    purpose: 'Latest activity and meeting context across the funnel.',
  },
  {
    id: 'learning-review',
    label: 'Learning Review',
    purpose: 'Weekly signal-to-content proposals with review, approval, and deploy/rollback tracking.',
  },
];

function formatNotificationType(type: string): EngagementKind {
  const normalized = type.toLowerCase();
  if (normalized.includes('reply')) return 'reply';
  if (normalized.includes('click')) return 'click';
  if (normalized.includes('open')) return 'open';
  if (normalized.includes('bounce')) return 'bounce';
  return 'reply';
}

function kindSeverity(kind: EngagementKind, unread: boolean, highIntent = false): EngagementSeverity {
  if (kind === 'failure' || kind === 'bounce' || kind === 'reply') return 'high';
  if (kind === 'microsite-session' && (highIntent || unread)) return 'high';
  if (kind === 'click' || kind === 'meeting') return 'medium';
  return unread ? 'medium' : 'low';
}

function createFollowUpHref(tab: EngagementTabId, accountName: string, source: string): string {
  const params = new URLSearchParams({ tab, followUpAccount: accountName, followUpSource: source });
  return `/engagement?${params.toString()}`;
}

function createMarkReadHref(tab: EngagementTabId, notificationId: number): string {
  const params = new URLSearchParams({ tab, markRead: String(notificationId) });
  return `/engagement?${params.toString()}`;
}

function createOutcomeHref(
  tab: EngagementTabId,
  accountName: string,
  source: string,
  outcomeLabel: OperatorOutcomeLabel,
  campaignId?: number | null,
  generatedContentId?: number | null,
): string {
  const params = new URLSearchParams({
    tab,
    outcomeAccount: accountName,
    outcomeSource: source,
    outcomeLabel,
  });
  if (campaignId) params.set('outcomeCampaignId', String(campaignId));
  if (generatedContentId) params.set('outcomeContentVersionId', String(generatedContentId));
  return `/engagement?${params.toString()}`;
}

function createRegenerateFromSignalHref(
  accountName: string,
  sourceKind: string,
  sourceId: string,
  signalKind: string,
  signalContext: string,
  campaignId?: number | null,
  generatedContentId?: number | null,
): string {
  const params = new URLSearchParams({
    account: accountName,
    regenAccount: accountName,
    regenSourceKind: sourceKind,
    regenSourceId: sourceId,
    regenSignalKind: signalKind,
    regenContext: signalContext,
  });
  if (campaignId) params.set('regenCampaignId', String(campaignId));
  if (generatedContentId) params.set('regenGeneratedContentId', String(generatedContentId));
  return `/generated-content?${params.toString()}`;
}

function createOutcomeHrefMap(
  tab: EngagementTabId,
  accountName: string,
  source: string,
  campaignId?: number | null,
  generatedContentId?: number | null,
): Partial<Record<OperatorOutcomeLabel, string>> {
  return Object.fromEntries(
    OPERATOR_OUTCOME_TAXONOMY.map((label) => [
      label,
      createOutcomeHref(tab, accountName, source, label, campaignId, generatedContentId),
    ]),
  ) as Partial<Record<OperatorOutcomeLabel, string>>;
}

function toCampaignHref(campaignId: number | null | undefined, campaignSlug: string | null | undefined): string | undefined {
  if (campaignSlug) return `/campaigns/${campaignSlug}`;
  if (campaignId) return '/campaigns';
  return undefined;
}

function toNotificationItems(notifications: NotificationSource[]): EngagementItem[] {
  return notifications.map((notification) => {
    const kind = formatNotificationType(notification.type);
    const accountSlug = notification.account_name ? slugify(notification.account_name) : undefined;
    const unread = !notification.read;
    return {
      id: `notification-${notification.id}`,
      source: 'notification',
      kind,
      tab: kind === 'bounce' ? 'bounces-failures' : 'inbox',
      occurredAt: notification.created_at,
      accountName: notification.account_name ?? undefined,
      accountSlug,
      personaLabel: notification.persona_email ?? undefined,
      title: notification.subject ?? `${notification.type} signal`,
      preview: notification.preview ?? 'No preview available.',
      statusLabel: unread ? 'Unread' : 'Read',
      unread,
      severity: kindSeverity(kind, unread),
      actions: {
        markReadHref: unread ? createMarkReadHref(kind === 'bounce' ? 'bounces-failures' : 'inbox', notification.id) : undefined,
        followUpHref: notification.account_name
          ? createFollowUpHref(kind === 'bounce' ? 'bounces-failures' : 'inbox', notification.account_name, `notification:${notification.id}`)
          : undefined,
        accountHref: accountSlug ? `/accounts/${accountSlug}` : undefined,
        outcomeHrefs: notification.account_name
          ? createOutcomeHrefMap(kind === 'bounce' ? 'bounces-failures' : 'inbox', notification.account_name, `notification:${notification.id}`)
          : undefined,
        regenerateFromSignalHref: notification.account_name
          ? createRegenerateFromSignalHref(
              notification.account_name,
              'notification',
              String(notification.id),
              kind === 'bounce' ? 'bounce' : 'reply-objection',
              notification.preview ?? notification.subject ?? `${notification.type} signal`,
            )
          : undefined,
      },
    };
  });
}

function toEmailSignalItems(emailLogs: EmailLogSource[]): EngagementItem[] {
  const signals = emailLogs.filter((row) => row.clicked_at || row.opened_at);
  return signals.map((row) => {
    const clicked = Boolean(row.clicked_at);
    const occurredAt = row.clicked_at ?? row.opened_at ?? row.sent_at;
    const kind: EngagementKind = clicked ? 'click' : 'open';
    const accountSlug = slugify(row.account_name);
    const campaignHref = toCampaignHref(row.campaign_id, row.campaign?.slug ?? null);

    return {
      id: `email-log-${row.id}-${kind}`,
      source: 'email-log',
      kind,
      tab: 'inbox',
      occurredAt,
      accountName: row.account_name,
      accountSlug,
      personaLabel: row.persona_name ?? row.to_email,
      campaignId: row.campaign_id ?? undefined,
      campaignName: row.campaign?.name ?? undefined,
      campaignSlug: row.campaign?.slug ?? undefined,
      title: clicked ? `Link clicked: ${row.subject}` : `Opened: ${row.subject}`,
      preview: clicked ? 'Buyer clicked through an email link.' : 'Buyer opened the message.',
      statusLabel: clicked ? 'Clicked' : 'Opened',
      unread: false,
      severity: kindSeverity(kind, false),
      actions: {
        followUpHref: createFollowUpHref('inbox', row.account_name, `email-log:${row.id}`),
        accountHref: `/accounts/${accountSlug}`,
        campaignHref,
        outcomeHrefs: createOutcomeHrefMap('inbox', row.account_name, `email-log:${row.id}`, row.campaign_id, row.generated_content_id),
        regenerateFromSignalHref: createRegenerateFromSignalHref(
          row.account_name,
          'email-log',
          String(row.id),
          clicked ? 'reply-objection' : 'positive-signal',
          clicked ? `Buyer clicked email link for ${row.subject}` : `Buyer opened email: ${row.subject}`,
          row.campaign_id,
          row.generated_content_id,
        ),
      },
    };
  });
}

function toFailureItems(failures: SendJobFailureSource[]): EngagementItem[] {
  return failures.map((failure) => {
    const accountSlug = slugify(failure.account_name);
    const campaignHref = toCampaignHref(failure.campaign_id, failure.campaign?.slug ?? null);
    const failureClass = classifyFailure(failure.error_message);
    const recommendation = recommendRetryForClass(failureClass);
    return {
      id: `send-failure-${failure.id}`,
      source: 'send-job-recipient',
      kind: 'failure',
      tab: 'bounces-failures',
      occurredAt: failure.updated_at,
      accountName: failure.account_name,
      accountSlug,
      personaLabel: failure.persona_name ?? failure.to_email,
      campaignId: failure.campaign_id ?? undefined,
      campaignName: failure.campaign?.name ?? undefined,
      campaignSlug: failure.campaign?.slug ?? undefined,
      title: `Send failure: ${failure.to_email}`,
      preview: failure.error_message ?? 'Provider rejected send; retry or update recipient data.',
      statusLabel: 'Failed',
      unread: true,
      severity: 'high',
      failureClass,
      retryRecommendation: recommendation.recommended,
      actions: {
        followUpHref: createFollowUpHref('bounces-failures', failure.account_name, `send-failure:${failure.id}`),
        accountHref: `/accounts/${accountSlug}`,
        campaignHref,
        outcomeHrefs: createOutcomeHrefMap('bounces-failures', failure.account_name, `send-failure:${failure.id}`, failure.campaign_id),
        regenerateFromSignalHref: createRegenerateFromSignalHref(
          failure.account_name,
          'send-failure',
          String(failure.id),
          'bounce',
          failure.error_message ?? `Delivery failed for ${failure.to_email}`,
          failure.campaign_id,
          failure.generated_content_id,
        ),
      },
    };
  });
}

function toMicrositeItems(sessions: MicrositeSource[]): EngagementItem[] {
  return sessions.map((session) => {
    const accountSlug = slugify(session.account_name);
    const highIntent = session.cta_ids.length > 0 || session.scroll_depth_pct >= 65 || session.duration_seconds >= 90;
    return {
      id: `microsite-${session.id}`,
      source: 'microsite-engagement',
      kind: 'microsite-session',
      tab: 'microsite-sessions',
      occurredAt: session.updated_at,
      accountName: session.account_name,
      accountSlug,
      personaLabel: session.person_name ?? undefined,
      title: highIntent ? 'High-intent microsite session' : 'Microsite session',
      preview: `${session.scroll_depth_pct}% depth · ${session.duration_seconds}s dwell · ${session.cta_ids.length} CTA clicks`,
      statusLabel: highIntent ? 'Hot session' : 'Session',
      unread: highIntent,
      severity: kindSeverity('microsite-session', highIntent, highIntent),
      actions: {
        followUpHref: createFollowUpHref('microsite-sessions', session.account_name, `microsite:${session.id}`),
        accountHref: `/accounts/${accountSlug}`,
        assetHref: session.path,
        outcomeHrefs: createOutcomeHrefMap('microsite-sessions', session.account_name, `microsite:${session.id}`),
        regenerateFromSignalHref: createRegenerateFromSignalHref(
          session.account_name,
          'microsite',
          session.id,
          highIntent ? 'positive-signal' : 'unknown',
          `${session.scroll_depth_pct}% depth, ${session.duration_seconds}s dwell, ${session.cta_ids.length} CTA clicks`,
        ),
      },
    };
  });
}

function toRecentTouchItems(meetings: MeetingSource[], activities: ActivitySource[]): EngagementItem[] {
  const meetingItems: EngagementItem[] = meetings.map((meeting) => {
    const accountSlug = slugify(meeting.account_name);
    return {
      id: `meeting-${meeting.id}`,
      source: 'meeting',
      kind: 'meeting',
      tab: 'recent-touches',
      occurredAt: meeting.meeting_date ?? meeting.updated_at,
      accountName: meeting.account_name,
      accountSlug,
      personaLabel: meeting.persona ?? undefined,
      title: `Meeting ${meeting.meeting_status.toLowerCase()}`,
      preview: meeting.objective ?? 'Meeting context captured in workspace.',
      statusLabel: meeting.meeting_status,
      unread: false,
      severity: kindSeverity('meeting', false),
      actions: {
        accountHref: `/accounts/${accountSlug}`,
        outcomeHrefs: createOutcomeHrefMap('recent-touches', meeting.account_name, `meeting:${meeting.id}`),
        regenerateFromSignalHref: createRegenerateFromSignalHref(
          meeting.account_name,
          'meeting',
          String(meeting.id),
          'reply-objection',
          meeting.objective ?? `Meeting status ${meeting.meeting_status}`,
        ),
      },
    };
  });

  const activityItems: EngagementItem[] = activities.map((activity) => {
    const accountSlug = slugify(activity.account_name);
    return {
      id: `activity-${activity.id}`,
      source: 'activity',
      kind: 'activity',
      tab: 'recent-touches',
      occurredAt: activity.created_at,
      accountName: activity.account_name,
      accountSlug,
      personaLabel: activity.persona ?? undefined,
      title: activity.activity_type,
      preview: activity.outcome ?? activity.next_step ?? 'Activity update recorded.',
      statusLabel: 'Logged',
      unread: false,
      severity: kindSeverity('activity', false),
      actions: {
        accountHref: `/accounts/${accountSlug}`,
        outcomeHrefs: createOutcomeHrefMap('recent-touches', activity.account_name, `activity:${activity.id}`),
        regenerateFromSignalHref: createRegenerateFromSignalHref(
          activity.account_name,
          'activity',
          String(activity.id),
          'reply-objection',
          activity.outcome ?? activity.next_step ?? activity.activity_type,
        ),
      },
    };
  });

  return [...meetingItems, ...activityItems];
}

export function buildEngagementItems(input: EngagementSourceBundle): EngagementItem[] {
  return [
    ...toNotificationItems(input.notifications),
    ...toEmailSignalItems(input.emailLogs),
    ...toFailureItems(input.sendFailures),
    ...toMicrositeItems(input.micrositeSessions),
    ...toRecentTouchItems(input.meetings, input.activities),
  ].sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
}

function signalWeight(kind: EngagementKind, severity: EngagementSeverity) {
  const base =
    kind === 'reply'
      ? 8
      : kind === 'failure' || kind === 'bounce'
        ? 7
        : kind === 'microsite-session'
          ? 6
          : kind === 'click'
            ? 4
            : kind === 'open'
              ? 2
              : kind === 'meeting'
                ? 3
                : 1;
  return severity === 'high' ? base + 2 : severity === 'medium' ? base + 1 : base;
}

export function buildHotAccounts(items: EngagementItem[]): HotAccount[] {
  const byAccount = new Map<string, HotAccount>();

  for (const item of items) {
    if (!item.accountName || !item.accountSlug) continue;
    const key = item.accountSlug;
    const existing = byAccount.get(key);
    const weight = signalWeight(item.kind, item.severity);
    const nextAction =
      item.kind === 'failure' || item.kind === 'bounce'
        ? 'Fix delivery and retry.'
        : item.kind === 'reply'
          ? 'Respond to buyer and schedule follow-up.'
          : item.kind === 'microsite-session'
            ? 'Follow up while engagement is active.'
            : 'Open account and advance next step.';

    if (!existing) {
      byAccount.set(key, {
        accountName: item.accountName,
        accountSlug: item.accountSlug,
        score: weight,
        signalCount: 1,
        unreadSignals: item.unread ? 1 : 0,
        topSignal: item.kind,
        nextAction,
        accountHref: `/accounts/${item.accountSlug}`,
      });
      continue;
    }

    existing.score += weight;
    existing.signalCount += 1;
    existing.unreadSignals += item.unread ? 1 : 0;
    if (weight >= signalWeight(existing.topSignal, item.severity)) {
      existing.topSignal = item.kind;
      existing.nextAction = nextAction;
    }
  }

  return [...byAccount.values()].sort((left, right) => right.score - left.score || left.accountName.localeCompare(right.accountName));
}

export function getEngagementTabForLegacySignal(kind: EngagementKind): EngagementTabId {
  if (kind === 'failure' || kind === 'bounce') return 'bounces-failures';
  if (kind === 'microsite-session') return 'microsite-sessions';
  if (kind === 'meeting' || kind === 'activity') return 'recent-touches';
  return 'inbox';
}

export function parseEngagementTab(tab: string | undefined): EngagementTabId {
  const tabIds = new Set(engagementCenterTabs.map((item) => item.id));
  return tabIds.has(tab as EngagementTabId) ? (tab as EngagementTabId) : 'inbox';
}

// ── Recency: relative time + activity-window helpers ──────────────────
//
// A sales rep opening the engagement workspace scans for *motion*, not
// dates. These power the Recent Activity feed: relative timestamps and
// a selectable look-back window.

export type EngagementWindowId = '1h' | '24h' | '7d';

export const engagementWindows: { id: EngagementWindowId; label: string; ms: number }[] = [
  { id: '1h', label: 'Last hour', ms: 60 * 60 * 1000 },
  { id: '24h', label: 'Last 24h', ms: 24 * 60 * 60 * 1000 },
  { id: '7d', label: 'Last 7 days', ms: 7 * 24 * 60 * 60 * 1000 },
];

export function parseEngagementWindow(value: string | undefined): EngagementWindowId {
  return value === '1h' || value === '7d' ? value : '24h';
}

/** "just now" / "12m ago" / "3h ago" / "2d ago" / "3w ago" / date. */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'just now';
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return date.toLocaleDateString();
}

/** Items from buildEngagementItems() that occurred within the window. */
export function filterItemsWithinWindow(
  items: EngagementItem[],
  windowId: EngagementWindowId,
  now: Date = new Date(),
): EngagementItem[] {
  const config = engagementWindows.find((entry) => entry.id === windowId) ?? engagementWindows[1];
  const cutoff = now.getTime() - config.ms;
  return items.filter((item) => item.occurredAt.getTime() >= cutoff);
}
