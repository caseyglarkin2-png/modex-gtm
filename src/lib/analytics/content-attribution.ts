import type { PrismaClient } from '@prisma/client';
import { DEAL_ATTRIBUTION_CONTRACT_V1 } from '@/lib/revops/sprint11-contracts';

export type AttributionView = 'variant' | 'provider' | 'prompt_template';
export type AttributionConfidence = 'low' | 'medium' | 'high';

type SendLike = {
  id: number;
  account_name: string;
  campaign_id: number | null;
  generated_content_id: number | null;
  status: string;
  open_count: number;
  reply_count: number;
  clicked_at: Date | null;
  sent_at: Date;
};

type GeneratedContentLike = {
  id: number;
  account_name: string;
  campaign_id: number | null;
  content_type: string;
  provider_used: string | null;
  version: number;
  version_metadata: unknown;
};

type RecipientLike = {
  email_log_id: number | null;
  variant_key: string | null;
};

type MeetingLike = {
  id: number;
  account_name: string;
  meeting_status: string;
  meeting_date: Date | null;
  created_at: Date;
};

type ActivityLike = {
  id: number;
  account_name: string;
  activity_type: string;
  outcome: string | null;
  activity_date: Date | null;
  created_at: Date;
};

type AccountLike = {
  name: string;
  priority_score: number | null;
  pipeline_stage: string;
};

type CampaignLike = {
  id: number;
  name: string;
};

export type ContentAttributionRow = {
  contentVersionId: number;
  accountName: string;
  campaignId: number | null;
  campaignName: string;
  variantKey: string;
  providerUsed: string;
  promptTemplate: string;
  sends: number;
  delivered: number;
  opened: number;
  clicked: number;
  replies: number;
  meetings: number;
  pipelineMovements: number;
  estimatedDealValue: number;
  confidence: AttributionConfidence;
  firstSentAt: Date | null;
  lastSentAt: Date | null;
};

export type ContentAttributionSummary = {
  view: AttributionView;
  bucket: string;
  sends: number;
  replies: number;
  meetings: number;
  pipelineMovements: number;
  estimatedDealValue: number;
  replyRatePct: number;
  meetingRatePct: number;
  confidence: AttributionConfidence;
};

type ContentAttributionInput = {
  sends: SendLike[];
  generatedContent: GeneratedContentLike[];
  recipients: RecipientLike[];
  meetings: MeetingLike[];
  activities: ActivityLike[];
  accounts: AccountLike[];
  campaigns: CampaignLike[];
};

function toDays(ms: number): number {
  return ms / (24 * 60 * 60 * 1000);
}

function plusDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function normalizePromptTemplate(value: unknown): string {
  if (!value || typeof value !== 'object') return 'unknown';
  const metadata = value as Record<string, unknown>;
  const candidate = metadata.prompt_template ?? metadata.template_key ?? metadata.template;
  return typeof candidate === 'string' && candidate.trim().length > 0 ? candidate.trim() : 'unknown';
}

function isMeetingCountable(status: string): boolean {
  return status.toLowerCase() !== 'no meeting';
}

function isPipelineMovement(activity: ActivityLike): boolean {
  const haystack = `${activity.activity_type} ${activity.outcome ?? ''}`.toLowerCase();
  return /(stage|pipeline|proposal|closed|meeting booked|qualified|opportunity|progressed)/.test(haystack);
}

export function getAttributionConfidence(sampleSize: number): AttributionConfidence {
  if (sampleSize < 10) return 'low';
  if (sampleSize < 30) return 'medium';
  return 'high';
}

export function buildContentAttributionRows(input: ContentAttributionInput): ContentAttributionRow[] {
  const contentById = new Map(input.generatedContent.map((item) => [item.id, item]));
  const campaignById = new Map(input.campaigns.map((campaign) => [campaign.id, campaign.name]));
  const accountByName = new Map(input.accounts.map((account) => [account.name, account]));
  const variantByEmailLogId = new Map(
    input.recipients
      .filter((recipient): recipient is { email_log_id: number; variant_key: string | null } => recipient.email_log_id !== null)
      .map((recipient) => [recipient.email_log_id, recipient.variant_key ?? 'control']),
  );
  const meetingsByAccount = new Map<string, MeetingLike[]>();
  input.meetings.forEach((meeting) => {
    const existing = meetingsByAccount.get(meeting.account_name) ?? [];
    existing.push(meeting);
    meetingsByAccount.set(meeting.account_name, existing);
  });
  const activitiesByAccount = new Map<string, ActivityLike[]>();
  input.activities.forEach((activity) => {
    const existing = activitiesByAccount.get(activity.account_name) ?? [];
    existing.push(activity);
    activitiesByAccount.set(activity.account_name, existing);
  });

  const groups = new Map<string, {
    row: ContentAttributionRow;
    meetingIds: Set<number>;
    movementIds: Set<number>;
    accountsContributing: Set<string>;
  }>();

  input.sends
    .filter((send) => send.generated_content_id !== null)
    .forEach((send) => {
      const content = contentById.get(send.generated_content_id!);
      if (!content) return;

      const variantKey = variantByEmailLogId.get(send.id) ?? 'control';
      const key = `${content.id}:${variantKey}`;
      const existing = groups.get(key);
      const sentAt = send.sent_at;
      const meetingWindowEnd = plusDays(sentAt, DEAL_ATTRIBUTION_CONTRACT_V1.stageProgressionDays);
      const closeWindowEnd = plusDays(sentAt, DEAL_ATTRIBUTION_CONTRACT_V1.closeWindowDays);

      const accountMeetings = (meetingsByAccount.get(send.account_name) ?? []).filter((meeting) => {
        if (!isMeetingCountable(meeting.meeting_status)) return false;
        const timestamp = meeting.meeting_date ?? meeting.created_at;
        return timestamp >= sentAt && timestamp <= meetingWindowEnd;
      });

      const accountMovements = (activitiesByAccount.get(send.account_name) ?? []).filter((activity) => {
        const timestamp = activity.activity_date ?? activity.created_at;
        if (timestamp < sentAt || timestamp > closeWindowEnd) return false;
        return isPipelineMovement(activity);
      });

      const account = accountByName.get(send.account_name);
      const stageValueBoost = account && ['proposal', 'closed', 'meeting'].includes((account.pipeline_stage ?? '').toLowerCase())
        ? Math.max(10000, (account.priority_score ?? 0) * 1000)
        : 0;

      if (!existing) {
        const row: ContentAttributionRow = {
          contentVersionId: content.id,
          accountName: content.account_name,
          campaignId: content.campaign_id,
          campaignName: content.campaign_id ? (campaignById.get(content.campaign_id) ?? 'Unassigned') : 'Unassigned',
          variantKey,
          providerUsed: content.provider_used ?? 'unknown',
          promptTemplate: normalizePromptTemplate(content.version_metadata),
          sends: 1,
          delivered: send.status === 'bounced' ? 0 : 1,
          opened: send.open_count > 0 ? 1 : 0,
          clicked: send.clicked_at ? 1 : 0,
          replies: send.reply_count > 0 ? 1 : 0,
          meetings: 0,
          pipelineMovements: 0,
          estimatedDealValue: stageValueBoost,
          confidence: 'low',
          firstSentAt: sentAt,
          lastSentAt: sentAt,
        };
        const group = {
          row,
          meetingIds: new Set<number>(),
          movementIds: new Set<number>(),
          accountsContributing: new Set<string>([send.account_name]),
        };
        accountMeetings.forEach((meeting) => group.meetingIds.add(meeting.id));
        accountMovements.forEach((activity) => group.movementIds.add(activity.id));
        group.row.meetings = group.meetingIds.size;
        group.row.pipelineMovements = group.movementIds.size;
        groups.set(key, group);
        return;
      }

      existing.row.sends += 1;
      existing.row.delivered += send.status === 'bounced' ? 0 : 1;
      existing.row.opened += send.open_count > 0 ? 1 : 0;
      existing.row.clicked += send.clicked_at ? 1 : 0;
      existing.row.replies += send.reply_count > 0 ? 1 : 0;
      existing.row.firstSentAt = existing.row.firstSentAt && existing.row.firstSentAt < sentAt ? existing.row.firstSentAt : sentAt;
      existing.row.lastSentAt = existing.row.lastSentAt && existing.row.lastSentAt > sentAt ? existing.row.lastSentAt : sentAt;

      accountMeetings.forEach((meeting) => existing.meetingIds.add(meeting.id));
      accountMovements.forEach((activity) => existing.movementIds.add(activity.id));
      existing.row.meetings = existing.meetingIds.size;
      existing.row.pipelineMovements = existing.movementIds.size;
      if (!existing.accountsContributing.has(send.account_name)) {
        existing.accountsContributing.add(send.account_name);
        existing.row.estimatedDealValue += stageValueBoost;
      }
    });

  return [...groups.values()]
    .map((group) => ({
      ...group.row,
      confidence: getAttributionConfidence(group.row.sends),
    }))
    .sort((left, right) => right.replies - left.replies || right.meetings - left.meetings || right.sends - left.sends);
}

export function summarizeContentAttribution(
  rows: ContentAttributionRow[],
  view: AttributionView,
): ContentAttributionSummary[] {
  const bucketMap = new Map<string, ContentAttributionSummary>();
  rows.forEach((row) => {
    const bucket = view === 'variant'
      ? row.variantKey
      : view === 'provider'
        ? row.providerUsed
        : row.promptTemplate;
    const existing = bucketMap.get(bucket);
    if (!existing) {
      bucketMap.set(bucket, {
        view,
        bucket,
        sends: row.sends,
        replies: row.replies,
        meetings: row.meetings,
        pipelineMovements: row.pipelineMovements,
        estimatedDealValue: row.estimatedDealValue,
        replyRatePct: row.sends > 0 ? (row.replies / row.sends) * 100 : 0,
        meetingRatePct: row.sends > 0 ? (row.meetings / row.sends) * 100 : 0,
        confidence: getAttributionConfidence(row.sends),
      });
      return;
    }

    existing.sends += row.sends;
    existing.replies += row.replies;
    existing.meetings += row.meetings;
    existing.pipelineMovements += row.pipelineMovements;
    existing.estimatedDealValue += row.estimatedDealValue;
    existing.replyRatePct = existing.sends > 0 ? (existing.replies / existing.sends) * 100 : 0;
    existing.meetingRatePct = existing.sends > 0 ? (existing.meetings / existing.sends) * 100 : 0;
    existing.confidence = getAttributionConfidence(existing.sends);
  });

  return [...bucketMap.values()].sort(
    (left, right) => right.replies - left.replies || right.meetings - left.meetings || right.estimatedDealValue - left.estimatedDealValue,
  );
}

export function toConfidenceBadgeTone(confidence: AttributionConfidence): 'outline' | 'secondary' | 'default' {
  if (confidence === 'low') return 'outline';
  if (confidence === 'medium') return 'secondary';
  return 'default';
}

export async function getContentAttributionRows(
  prisma: PrismaClient,
  campaignId?: number,
): Promise<ContentAttributionRow[]> {
  const sendWhere = campaignId
    ? { generated_content_id: { not: null }, campaign_id: campaignId }
    : { generated_content_id: { not: null } };

  const sends = await prisma.emailLog.findMany({
    where: sendWhere,
    select: {
      id: true,
      account_name: true,
      campaign_id: true,
      generated_content_id: true,
      status: true,
      open_count: true,
      reply_count: true,
      clicked_at: true,
      sent_at: true,
    },
  });

  if (sends.length === 0) return [];

  const contentIds = [...new Set(sends.map((send) => send.generated_content_id).filter((id): id is number => typeof id === 'number'))];
  const accountNames = [...new Set(sends.map((send) => send.account_name))];
  const campaignIds = [...new Set(sends.map((send) => send.campaign_id).filter((id): id is number => typeof id === 'number'))];

  const [generatedContent, recipients, meetings, activities, accounts, campaigns] = await Promise.all([
    prisma.generatedContent.findMany({
      where: { id: { in: contentIds } },
      select: {
        id: true,
        account_name: true,
        campaign_id: true,
        content_type: true,
        provider_used: true,
        version: true,
        version_metadata: true,
      },
    }),
    prisma.sendJobRecipient.findMany({
      where: { email_log_id: { in: sends.map((send) => send.id) } },
      select: {
        email_log_id: true,
        variant_key: true,
      },
    }),
    prisma.meeting.findMany({
      where: { account_name: { in: accountNames } },
      select: {
        id: true,
        account_name: true,
        meeting_status: true,
        meeting_date: true,
        created_at: true,
      },
    }),
    prisma.activity.findMany({
      where: { account_name: { in: accountNames } },
      select: {
        id: true,
        account_name: true,
        activity_type: true,
        outcome: true,
        activity_date: true,
        created_at: true,
      },
    }),
    prisma.account.findMany({
      where: { name: { in: accountNames } },
      select: {
        name: true,
        priority_score: true,
        pipeline_stage: true,
      },
    }),
    campaignIds.length > 0
      ? prisma.campaign.findMany({
        where: { id: { in: campaignIds } },
        select: { id: true, name: true },
      })
      : Promise.resolve([]),
  ]);

  return buildContentAttributionRows({
    sends,
    generatedContent,
    recipients,
    meetings,
    activities,
    accounts,
    campaigns,
  });
}

export function formatAttributionWindowLabel(): string {
  return [
    `first-touch ${DEAL_ATTRIBUTION_CONTRACT_V1.firstTouchDays}d`,
    `stage ${DEAL_ATTRIBUTION_CONTRACT_V1.stageProgressionDays}d`,
    `close ${DEAL_ATTRIBUTION_CONTRACT_V1.closeWindowDays}d`,
  ].join(' · ');
}

export function hasLowConfidenceSummaries(rows: ContentAttributionSummary[]): boolean {
  return rows.some((row) => row.confidence === 'low');
}

export function deriveAttributionView(value: string | null | undefined): AttributionView {
  if (value === 'provider') return 'provider';
  if (value === 'prompt_template') return 'prompt_template';
  return 'variant';
}

export function dedupeRuleLabel(): string {
  const [left, right] = DEAL_ATTRIBUTION_CONTRACT_V1.dedupeKey;
  return `${left}+${right}`;
}

export function attributionAgeDays(row: ContentAttributionRow): number | null {
  if (!row.lastSentAt) return null;
  return Math.max(0, Math.round(toDays(Date.now() - row.lastSentAt.getTime())));
}
