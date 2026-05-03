export type AccountCommandTabId = 'overview' | 'contacts' | 'assets' | 'engagement' | 'tasks' | 'meetings' | 'pipeline';

export type AccountCommandTab = {
  id: AccountCommandTabId;
  label: string;
  legacyIds: string[];
  purpose: string;
};

export const accountCommandTabs: AccountCommandTab[] = [
  { id: 'overview', label: 'Overview', legacyIds: ['overview'], purpose: 'Account thesis, status, score, and next-best action.' },
  { id: 'contacts', label: 'Contacts', legacyIds: ['personas'], purpose: 'People, priorities, readiness, and contact actions.' },
  { id: 'assets', label: 'Assets', legacyIds: ['brief', 'routes'], purpose: 'Briefs, audit routes, QR assets, microsites, and generated content.' },
  { id: 'engagement', label: 'Engagement', legacyIds: ['activity'], purpose: 'Unified history across emails, activities, captures, meetings, and microsites.' },
  { id: 'tasks', label: 'Tasks', legacyIds: ['activity'], purpose: 'Open next steps and operator work for this account.' },
  { id: 'meetings', label: 'Meetings', legacyIds: ['activity'], purpose: 'Meeting status, prep, booked meetings, and follow-up.' },
  { id: 'pipeline', label: 'Pipeline', legacyIds: ['waves'], purpose: 'Stage, wave motion, campaign phase, and pipeline movement.' },
];

export function getCanonicalAccountTabForLegacy(legacyId: string): AccountCommandTab | undefined {
  return accountCommandTabs.find((tab) => tab.id === legacyId || tab.legacyIds.includes(legacyId));
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

export function buildAccountNextBestAction(
  account: AccountNextActionSource,
  input: { contactCount: number; assetCount: number; openTaskCount: number },
): AccountNextBestAction {
  if (account.next_action) {
    return {
      label: account.next_action,
      detail: account.due_date ? `Due ${formatAccountDate(account.due_date)}` : 'No due date set',
      route: '#tasks',
      tone: 'attention',
    };
  }

  if (input.contactCount === 0) {
    return {
      label: 'Map first contact',
      detail: 'No contacts are attached to this account yet.',
      route: '#contacts',
      tone: 'blocked',
    };
  }

  if (input.assetCount === 0) {
    return {
      label: 'Create account asset',
      detail: 'No account-owned assets are ready yet.',
      route: '#assets',
      tone: 'attention',
    };
  }

  if (!/contacted|replied|meeting/i.test(account.outreach_status ?? '')) {
    return {
      label: 'Launch first outbound touch',
      detail: 'Contacts and assets are ready; outreach has not started.',
      route: '#engagement',
      tone: 'ready',
    };
  }

  if (/booked|held|completed/i.test(account.meeting_status ?? '')) {
    return {
      label: 'Advance post-meeting follow-up',
      detail: 'Meeting signal exists; move the opportunity forward.',
      route: '#pipeline',
      tone: 'ready',
    };
  }

  return {
    label: 'Review account context',
    detail: 'No urgent next action is set.',
    route: '#overview',
    tone: 'ready',
  };
}

export type AccountTimelineItem = {
  id: string;
  kind: 'activity' | 'email' | 'meeting' | 'microsite' | 'capture';
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

export function buildAccountTimeline(input: {
  activities: ActivitySource[];
  emails: EmailSource[];
  meetings: MeetingSource[];
  micrositeSessions: MicrositeSource[];
  captures: CaptureSource[];
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
  ];

  return items
    .filter((item) => !Number.isNaN(item.occurredAt.getTime()))
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())
    .slice(0, input.limit ?? 12);
}

function formatAccountDate(value: Date | string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
