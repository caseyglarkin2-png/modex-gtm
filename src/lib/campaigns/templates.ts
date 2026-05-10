export type CampaignTemplateKey =
  | 'trade_show_follow_up'
  | 'cold_outbound'
  | 'warm_intro'
  | 'seasonal_push';

export interface CampaignTemplate {
  key: CampaignTemplateKey;
  label: string;
  description: string;
  defaultCampaignType: string;
  defaultStatus: 'draft' | 'active';
  defaultTouchCount: number;
  suggestedIntervals: number[];
  aiPromptAngle: string;
  requiredFields: string[];
  defaultMessagingAngle: string;
  defaultDurationDays: number;
  defaultTargetAccounts: number;
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    key: 'trade_show_follow_up',
    label: 'Trade Show Follow-Up',
    description: '4-touch drip with microsite and post-event follow-up momentum.',
    defaultCampaignType: 'trade_show',
    defaultStatus: 'active',
    defaultTouchCount: 4,
    suggestedIntervals: [0, 2, 5, 8],
    aiPromptAngle: 'Ground the email in a real event interaction and move to a soft next step.',
    requiredFields: ['event_name', 'event_dates', 'microsite_url'],
    defaultMessagingAngle: 'The yard is the constraint. Follow up fast while the industry-event conversation is still warm.',
    defaultDurationDays: 21,
    defaultTargetAccounts: 8,
  },
  {
    key: 'cold_outbound',
    label: 'Cold Outbound',
    description: '5-touch problem-led sequence anchored on invisible yard bottlenecks.',
    defaultCampaignType: 'cold_outbound',
    defaultStatus: 'draft',
    defaultTouchCount: 5,
    suggestedIntervals: [0, 3, 7, 12, 18],
    aiPromptAngle: 'Lead with operational signal, make a humble hypothesis, and ask for a reaction not a hard meeting.',
    requiredFields: ['primary_problem', 'proof_point', 'cta_style'],
    defaultMessagingAngle: 'Use signal-led notes to show where the dock and yard are slowing growth.',
    defaultDurationDays: 30,
    defaultTargetAccounts: 20,
  },
  {
    key: 'warm_intro',
    label: 'Warm Intro',
    description: '2-touch referral motion with soft credibility transfer and low friction ask.',
    defaultCampaignType: 'warm_intro',
    defaultStatus: 'active',
    defaultTouchCount: 2,
    suggestedIntervals: [0, 4],
    aiPromptAngle: 'Reference the mutual connection and keep the note brief, respectful, and human.',
    requiredFields: ['mutual_contact', 'why_intro_now'],
    defaultMessagingAngle: 'Use the warm path first. Keep the ask soft and context-rich.',
    defaultDurationDays: 14,
    defaultTargetAccounts: 5,
  },
  {
    key: 'seasonal_push',
    label: 'Seasonal Push',
    description: '3-touch urgency sequence for quarter-end and seasonal operational crunches.',
    defaultCampaignType: 'seasonal_push',
    defaultStatus: 'draft',
    defaultTouchCount: 3,
    suggestedIntervals: [0, 5, 10],
    aiPromptAngle: 'Tie the note to a near-term operating deadline or demand spike and show what breaks first in the yard.',
    requiredFields: ['quarter', 'deadline', 'capacity_constraint'],
    defaultMessagingAngle: 'Make the timing real. Show what gets missed if the yard is still manual during the spike.',
    defaultDurationDays: 21,
    defaultTargetAccounts: 12,
  },
];

export function getCampaignTemplate(key?: string | null): CampaignTemplate {
  return CAMPAIGN_TEMPLATES.find((template) => template.key === key) ?? CAMPAIGN_TEMPLATES[0];
}
