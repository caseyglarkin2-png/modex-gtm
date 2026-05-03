export type HomeAccountSource = {
  name: string;
  owner: string;
  next_action: string | null;
  due_date: Date | string | null;
};

export type HomeActivitySource = {
  account_name: string | null;
  owner: string | null;
  activity_type: string;
  next_step: string | null;
  next_step_due: Date | string | null;
  notes?: string | null;
  outcome?: string | null;
};

export type HomeCampaignSource = {
  name: string;
  slug: string;
  status: string;
  owner: string;
  target_account_count: number;
  start_date: Date | string | null;
  end_date: Date | string | null;
  messaging_angle: string | null;
  _count: {
    outreach_waves: number;
    email_logs: number;
    activities: number;
    generated_content: number;
  };
};

export type HomeFocusItem = {
  type: 'Account' | 'Activity';
  account: string;
  owner: string;
  summary: string;
  due: Date;
  dueLabel: string;
  urgency: 'overdue' | 'today' | 'upcoming';
};

export type HomeCampaignHealth = {
  name: string;
  slug: string;
  owner: string;
  status: string;
  label: string;
  targetAccountCount: number;
  generatedCount: number;
  sentCount: number;
  activityCount: number;
  waveCount: number;
  readinessScore: number;
  href: string;
};

export type HomeHealthSnapshot = {
  generationFailures: number;
  sendFailures: number;
  stuckJobs: number;
  engagementAlerts: number;
  tone: 'healthy' | 'attention' | 'blocked';
  label: string;
};

export type HomeProofStatus = {
  sprint: string;
  status: string;
  result: 'pass' | 'pending' | 'fail';
  route: string;
  evidence: string;
};

export type HomeCockpitSnapshot = {
  today: {
    overdue: number;
    dueToday: number;
    dueThisWeek: number;
    engagementAlerts: number;
    focusItems: HomeFocusItem[];
  };
  activeCampaigns: HomeCampaignHealth[];
  health: HomeHealthSnapshot;
  proofStatus: HomeProofStatus;
};

type BuildHomeCockpitInput = {
  accounts: HomeAccountSource[];
  activities: HomeActivitySource[];
  campaigns: HomeCampaignSource[];
  generationFailures: number;
  sendFailures: number;
  stuckJobs: number;
  engagementAlerts: number;
  proofStatus: HomeProofStatus;
  now?: Date;
};

export function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isSameCalendarDay(left: Date, right: Date) {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

export function formatDueLabel(due: Date, today: Date) {
  const diffDays = Math.round((startOfDay(due).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays}d`;
}

function parseDueDate(value: Date | string | null) {
  if (!value) return null;
  const due = new Date(value);
  return Number.isNaN(due.getTime()) ? null : due;
}

export function buildFocusItems(
  accounts: HomeAccountSource[],
  activities: HomeActivitySource[],
  now = new Date(),
): HomeFocusItem[] {
  const today = startOfDay(now);

  const items = [
    ...accounts
      .filter((account) => account.next_action && account.due_date)
      .map((account) => ({
        type: 'Account' as const,
        account: account.name,
        owner: account.owner,
        summary: account.next_action ?? 'Next action ready',
        due: parseDueDate(account.due_date),
      })),
    ...activities
      .filter((activity) => activity.account_name && activity.next_step && activity.next_step_due)
      .map((activity) => ({
        type: 'Activity' as const,
        account: activity.account_name ?? 'Unknown account',
        owner: activity.owner ?? 'Unassigned',
        summary: activity.next_step ?? 'Follow up',
        due: parseDueDate(activity.next_step_due),
      })),
  ]
    .filter((item): item is Omit<typeof item, 'due'> & { due: Date } => item.due !== null)
    .sort((left, right) => left.due.getTime() - right.due.getTime())
    .filter((item, index, allItems) => index === allItems.findIndex((candidate) => (
      candidate.account === item.account &&
      candidate.summary === item.summary &&
      candidate.due.getTime() === item.due.getTime()
    )));

  return items.map((item) => {
    const dueTime = startOfDay(item.due).getTime();
    const urgency = dueTime < today.getTime()
      ? 'overdue'
      : dueTime === today.getTime()
        ? 'today'
        : 'upcoming';

    return {
      ...item,
      dueLabel: formatDueLabel(item.due, today),
      urgency,
    };
  });
}

function buildCampaignHealth(campaign: HomeCampaignSource): HomeCampaignHealth {
  const targetAccountCount = Math.max(campaign.target_account_count, campaign._count.outreach_waves, 0);
  const readinessScore = targetAccountCount === 0
    ? 0
    : Math.min(100, Math.round((campaign._count.generated_content / targetAccountCount) * 100));

  return {
    name: campaign.name,
    slug: campaign.slug,
    owner: campaign.owner,
    status: campaign.status,
    label: campaign.messaging_angle ?? 'Campaign motion ready for operator review.',
    targetAccountCount,
    generatedCount: campaign._count.generated_content,
    sentCount: campaign._count.email_logs,
    activityCount: campaign._count.activities,
    waveCount: campaign._count.outreach_waves,
    readinessScore,
    href: `/campaigns/${campaign.slug}`,
  };
}

function buildHealthSnapshot(input: Pick<BuildHomeCockpitInput, 'generationFailures' | 'sendFailures' | 'stuckJobs' | 'engagementAlerts'>): HomeHealthSnapshot {
  const issueCount = input.generationFailures + input.sendFailures + input.stuckJobs;
  const tone = input.stuckJobs > 0 || input.sendFailures > 0
    ? 'blocked'
    : issueCount > 0 || input.engagementAlerts > 0
      ? 'attention'
      : 'healthy';

  return {
    generationFailures: input.generationFailures,
    sendFailures: input.sendFailures,
    stuckJobs: input.stuckJobs,
    engagementAlerts: input.engagementAlerts,
    tone,
    label: tone === 'healthy' ? 'Ready' : tone === 'attention' ? 'Needs review' : 'Blocked work',
  };
}

export function buildHomeCockpitSnapshot(input: BuildHomeCockpitInput): HomeCockpitSnapshot {
  const now = input.now ?? new Date();
  const today = startOfDay(now);
  const sevenDaysOut = new Date(today);
  sevenDaysOut.setDate(today.getDate() + 7);
  const focusItems = buildFocusItems(input.accounts, input.activities, now);

  return {
    today: {
      overdue: focusItems.filter((item) => item.urgency === 'overdue').length,
      dueToday: focusItems.filter((item) => item.urgency === 'today').length,
      dueThisWeek: focusItems.filter((item) => item.due.getTime() >= today.getTime() && item.due.getTime() <= sevenDaysOut.getTime()).length,
      engagementAlerts: input.engagementAlerts,
      focusItems: focusItems.slice(0, 6),
    },
    activeCampaigns: input.campaigns
      .filter((campaign) => campaign.status !== 'archived')
      .map(buildCampaignHealth)
      .sort((left, right) => right.readinessScore - left.readinessScore)
      .slice(0, 3),
    health: buildHealthSnapshot(input),
    proofStatus: input.proofStatus,
  };
}
