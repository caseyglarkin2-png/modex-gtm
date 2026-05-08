import { buildOutcomeFollowUpRecommendation, parseOperatorOutcomeLabel } from '@/lib/revops/operator-outcomes';

export type AccountCommandTabId = 'brief' | 'committee' | 'outreach' | 'history';

export type AccountCommandTab = {
  id: AccountCommandTabId;
  label: string;
  legacyIds: string[];
  purpose: string;
};

export const accountCommandTabs: AccountCommandTab[] = [
  { id: 'brief', label: 'Brief', legacyIds: ['overview'], purpose: 'Account thesis, status, score, next-best action, microsite engagement, and intro path.' },
  { id: 'committee', label: 'Committee', legacyIds: ['contacts', 'personas'], purpose: 'People, priorities, readiness, and contact actions.' },
  { id: 'outreach', label: 'Outreach', legacyIds: ['assets', 'engagement', 'routes', 'activity'], purpose: 'Briefs, audit routes, QR assets, microsites, generated content, and the unified engagement history.' },
  { id: 'history', label: 'History', legacyIds: ['tasks', 'meetings', 'pipeline', 'waves'], purpose: 'Open next steps, meeting records, and pipeline / wave motion.' },
];

export function getCanonicalAccountTabForLegacy(legacyId: string): AccountCommandTab | undefined {
  return accountCommandTabs.find((tab) => tab.id === legacyId || tab.legacyIds.includes(legacyId));
}

export function parseAccountTab(value: string | undefined | null): AccountCommandTabId {
  if (!value) return 'brief';
  const matched = getCanonicalAccountTabForLegacy(value);
  return matched?.id ?? 'brief';
}

export type AccountNextActionSource = {
  next_action: string | null;
  due_date: Date | string | null;
  research_status: string | null;
  outreach_status: string | null;
  meeting_status: string | null;
};

export type AccountNextBestAction = {
  label: string;
  detail: string;
  route: string;
  tone: 'ready' | 'attention' | 'blocked';
};

export type AccountEngagementSummary = {
  sent: number;
  delivered: number;
  opened: number;
  replied: number;
  positiveReplies: number;
  meetingsInfluenced: number;
  latestOutcomeLabel: string | null;
  latestOutcomeNote: string | null;
};

export function buildAccountNextBestAction(
  account: AccountNextActionSource,
  input: {
    contactCount: number;
    assetCount: number;
    openTaskCount: number;
    replyCount?: number;
    coverageGapCount?: number;
    latestOutcomeLabel?: string | null;
    latestOutcomeNotes?: string | null;
    hasMeetingSignal?: boolean;
  },
): AccountNextBestAction {
  if (account.next_action) {
    return {
      label: account.next_action,
      detail: account.due_date ? `Due ${formatAccountDate(account.due_date)}` : 'No due date set',
      route: '#history',
      tone: 'attention',
    };
  }

  const outcomeRecommendation = buildOutcomeFollowUpRecommendation({
    outcomeLabel: input.latestOutcomeLabel,
    coverageGapCount: input.coverageGapCount,
    hasMeetingSignal: input.hasMeetingSignal,
    notes: input.latestOutcomeNotes,
  });
  if (outcomeRecommendation) {
    return outcomeRecommendation.nextAction;
  }

  if (input.contactCount === 0) {
    return {
      label: 'Map first contact',
      detail: 'No contacts are attached to this account yet.',
      route: '#committee',
      tone: 'blocked',
    };
  }

  if (input.assetCount === 0) {
    return {
      label: 'Create account asset',
      detail: 'No account-owned assets are ready yet.',
      route: '#outreach',
      tone: 'attention',
    };
  }

  if ((input.replyCount ?? 0) > 0) {
    return {
      label: input.coverageGapCount && input.coverageGapCount > 0 ? 'Expand committee coverage while the thread is warm' : 'Respond while the thread is active',
      detail: input.coverageGapCount && input.coverageGapCount > 0
        ? 'A reply exists, but the account still has uncovered buyer lanes before the next send.'
        : 'Reply activity exists on this account. Keep the motion moving before it cools.',
      route: input.coverageGapCount && input.coverageGapCount > 0 ? '#committee' : '#outreach',
      tone: 'ready',
    };
  }

  if (!/contacted|replied|meeting/i.test(account.outreach_status ?? '')) {
    return {
      label: 'Launch first outbound touch',
      detail: 'Contacts and assets are ready; outreach has not started.',
      route: '#outreach',
      tone: 'ready',
    };
  }

  if (/booked|held|completed/i.test(account.meeting_status ?? '')) {
    return {
      label: 'Advance post-meeting follow-up',
      detail: 'Meeting signal exists; move the opportunity forward.',
      route: '#history',
      tone: 'ready',
    };
  }

  return {
    label: 'Review account context',
    detail: 'No urgent next action is set.',
    route: '#brief',
    tone: 'ready',
  };
}

export type AccountTimelineItem = {
  id: string;
  kind: 'activity' | 'email' | 'meeting' | 'microsite' | 'capture' | 'send_job' | 'outcome';
  title: string;
  detail: string;
  occurredAt: Date;
  href?: string;
};

type ActivitySource = {
  id: number;
  activity_type: string;
  notes: string | null;
  outcome: string | null;
  next_step: string | null;
  activity_date: Date | null;
  created_at: Date;
};

type EmailSource = {
  id: number;
  subject: string;
  status: string;
  to_email: string;
  reply_count: number;
  sent_at: Date;
};

type MeetingSource = {
  id: number;
  meeting_status: string;
  persona: string | null;
  meeting_date: Date | null;
  objective: string | null;
  created_at: Date;
};

type MicrositeSource = {
  path: string;
  personName?: string | null;
  isHighIntent: boolean;
  viewedAt: Date;
  ctaCount: number;
};

type CaptureSource = {
  id: number;
  title: string | null;
  intent: string | null;
  next_step: string | null;
  captured_at: Date;
};

type SendJobRecipientSource = {
  id: number;
  send_job_id: number;
  generated_content_id: number;
  account_name: string;
  to_email: string;
  status: string;
  error_message: string | null;
  sent_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type OperatorOutcomeSource = {
  id: string;
  generated_content_id: number | null;
  outcome_label: string | null;
  source_kind: string;
  source_id: string;
  notes: string | null;
  created_at: Date;
};

type EngagementEmailSource = {
  status: string;
  reply_count: number;
  open_count?: number | null;
  opened_at?: Date | null;
  delivered_at?: Date | null;
};

type EngagementMeetingSource = {
  meeting_status: string;
};

export function buildAccountTimeline(input: {
  activities: ActivitySource[];
  emails: EmailSource[];
  meetings: MeetingSource[];
  micrositeSessions: MicrositeSource[];
  captures: CaptureSource[];
  sendRecipients?: SendJobRecipientSource[];
  operatorOutcomes?: OperatorOutcomeSource[];
  limit?: number;
}): AccountTimelineItem[] {
  const items: AccountTimelineItem[] = [
    ...input.activities.map((activity) => ({
      id: `activity-${activity.id}`,
      kind: 'activity' as const,
      title: activity.activity_type,
      detail: activity.outcome ?? activity.notes ?? activity.next_step ?? 'Activity logged',
      occurredAt: activity.activity_date ?? activity.created_at,
    })),
    ...input.emails.map((email) => ({
      id: `email-${email.id}`,
      kind: 'email' as const,
      title: email.reply_count > 0 ? 'Email reply signal' : `Email ${email.status}`,
      detail: `${email.subject} -> ${email.to_email}`,
      occurredAt: email.sent_at,
    })),
    ...input.meetings.map((meeting) => ({
      id: `meeting-${meeting.id}`,
      kind: 'meeting' as const,
      title: meeting.meeting_status,
      detail: meeting.objective ?? meeting.persona ?? 'Meeting record',
      occurredAt: meeting.meeting_date ?? meeting.created_at,
    })),
    ...input.micrositeSessions.map((session) => ({
      id: `microsite-${session.path}-${session.viewedAt.toISOString()}`,
      kind: 'microsite' as const,
      title: session.isHighIntent ? 'High-intent microsite session' : 'Microsite session',
      detail: `${session.personName ?? 'Overview'} viewed ${session.ctaCount} CTA${session.ctaCount === 1 ? '' : 's'}`,
      occurredAt: session.viewedAt,
      href: session.path,
    })),
    ...input.captures.map((capture) => ({
      id: `capture-${capture.id}`,
      kind: 'capture' as const,
      title: capture.title ?? 'Field capture',
      detail: capture.intent ?? capture.next_step ?? 'Captured buyer context',
      occurredAt: capture.captured_at,
    })),
    ...(input.sendRecipients ?? []).map((recipient) => ({
      id: `send-job-${recipient.id}`,
      kind: 'send_job' as const,
      title: recipient.status === 'sent'
        ? 'Send delivered to recipient'
        : recipient.status === 'failed'
          ? 'Send failed'
          : 'Send skipped',
      detail: recipient.status === 'failed'
        ? `${recipient.to_email} · ${recipient.error_message ?? 'Send failed'} · asset ${recipient.generated_content_id}`
        : recipient.status === 'skipped'
          ? `${recipient.to_email} · ${recipient.error_message ?? 'Send skipped'} · asset ${recipient.generated_content_id}`
          : `${recipient.to_email} · asset ${recipient.generated_content_id}`,
      occurredAt: recipient.sent_at ?? recipient.updated_at ?? recipient.created_at,
      href: `/generated-content?account=${encodeURIComponent(recipient.account_name)}`,
    })),
    ...(input.operatorOutcomes ?? []).map((outcome) => ({
      id: `outcome-${outcome.id}`,
      kind: 'outcome' as const,
      title: `Outcome: ${parseOperatorOutcomeLabel(outcome.outcome_label)?.replaceAll('-', ' ') ?? 'logged'}`,
      detail: outcome.notes?.trim()
        ? outcome.notes.trim()
        : `${outcome.source_kind} · ${outcome.source_id}`,
      occurredAt: outcome.created_at,
      href: outcome.generated_content_id ? `/generated-content?contentId=${outcome.generated_content_id}` : undefined,
    })),
  ];

  return items
    .filter((item) => !Number.isNaN(item.occurredAt.getTime()))
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())
    .slice(0, input.limit ?? 12);
}

export function buildAccountEngagementSummary(input: {
  emails: EngagementEmailSource[];
  meetings: EngagementMeetingSource[];
  operatorOutcomes: Array<Pick<OperatorOutcomeSource, 'outcome_label' | 'notes' | 'created_at'>>;
}): AccountEngagementSummary {
  const sortedOutcomes = [...input.operatorOutcomes].sort((left, right) => right.created_at.getTime() - left.created_at.getTime());
  const latestOutcome = sortedOutcomes[0] ?? null;
  const positiveReplies = sortedOutcomes.filter((outcome) => {
    const label = parseOperatorOutcomeLabel(outcome.outcome_label);
    return label === 'positive' || label === 'closed-won';
  }).length;

  return {
    sent: input.emails.length,
    delivered: input.emails.filter((email) => (
      Boolean(email.delivered_at)
      || ['delivered', 'opened', 'clicked'].includes((email.status ?? '').toLowerCase())
      || (email.reply_count ?? 0) > 0
    )).length,
    opened: input.emails.filter((email) => (
      Boolean(email.opened_at)
      || (email.open_count ?? 0) > 0
      || ['opened', 'clicked'].includes((email.status ?? '').toLowerCase())
    )).length,
    replied: input.emails.filter((email) => (email.reply_count ?? 0) > 0).length,
    positiveReplies,
    meetingsInfluenced: input.meetings.filter((meeting) => /booked|held|completed|scheduled/i.test(meeting.meeting_status ?? '')).length,
    latestOutcomeLabel: latestOutcome?.outcome_label ?? null,
    latestOutcomeNote: latestOutcome?.notes ?? null,
  };
}

function formatAccountDate(value: Date | string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
