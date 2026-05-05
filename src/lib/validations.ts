import { z } from 'zod';
export { micrositeTrackingSnapshotSchema as MicrositeTrackingSchema } from './microsites/tracking';

// ── Capture ──────────────────────────────────────────
export const CaptureSchema = z.object({
  account: z.string().min(1, 'Account is required'),
  contact: z.string().min(1, 'Contact name is required'),
  title: z.string().optional(),
  notes: z.string().optional(),
  interest: z.number().int().min(1).max(5),
  urgency: z.number().int().min(1).max(5),
  influence: z.number().int().min(1).max(5),
  fit: z.number().int().min(1).max(5),
  heat_score: z.number().int().min(4).max(20),
  due_date: z.string().optional(),
  status: z.string().optional().default('Open'),
});
export type CaptureInput = z.infer<typeof CaptureSchema>;

// ── Activity ─────────────────────────────────────────
export const ActivitySchema = z.object({
  account: z.string().min(1, 'Account is required'),
  persona: z.string().optional(),
  activity_type: z.enum(['Email', 'LinkedIn DM', 'Phone Call', 'Meeting', 'Event', 'Note', 'Follow-up', 'Other']),
  outcome: z.string().optional(),
  next_step: z.string().optional(),
  next_step_due: z.string().optional(),
  notes: z.string().optional(),
  owner: z.string().optional().default('Casey'),
});
export type ActivityInput = z.infer<typeof ActivitySchema>;

// ── Meeting ───────────────────────────────────────────
export const MeetingSchema = z.object({
  account: z.string().min(1, 'Account is required'),
  attendees: z.string().min(1, 'Attendees required'),
  meeting_type: z.enum(['In-Person', 'Virtual', 'Phone', 'Booth']).default('In-Person'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  objective: z.string().optional(),
  owner: z.string().optional().default('Jake'),
  status: z.string().optional().default('Scheduled'),
});
export type MeetingInput = z.infer<typeof MeetingSchema>;

// ── Status Updates ────────────────────────────────────
export const AccountStatusSchema = z.object({
  account: z.string().min(1),
  field: z.enum(['research_status', 'outreach_status', 'meeting_status']),
  value: z.string().min(1),
});

export const PersonaStatusSchema = z.object({
  persona_id: z.string().min(1),
  status: z.string().min(1),
});

export const IntelStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(['Open', 'Closed', 'In Progress']),
});

// ── AI Generation ─────────────────────────────────────
export const GenerateContentSchema = z.object({
  type: z.enum(['email', 'follow_up', 'dm', 'call_script', 'meeting_prep', 'infographic']),
  accountName: z.string().min(1),
  personaName: z.string().optional(),
  campaignSlug: z.string().optional(),
  tone: z.enum(['formal', 'conversational', 'provocative']).default('conversational'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  context: z.record(z.string(), z.string()).optional(),
  useLiveIntel: z.boolean().optional().default(false),
  refreshContext: z.boolean().optional().default(false),
});
export type GenerateContentInput = z.infer<typeof GenerateContentSchema>;

// ── Add Account ───────────────────────────────────────
export const AddAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  vertical: z.string().min(1, 'Vertical is required'),
  parent_brand: z.string().optional(),
  why_now: z.string().optional(),
  primo_angle: z.string().optional(),
  tier: z.enum(['Tier 1', 'Tier 2', 'Tier 3']).default('Tier 3'),
  owner: z.string().optional().default('Casey'),
  notes: z.string().optional(),
});
export type AddAccountInput = z.infer<typeof AddAccountSchema>;

// ── Add Persona ───────────────────────────────────────
export const AddPersonaSchema = z.object({
  account_name: z.string().min(1, 'Account is required'),
  name: z.string().trim().min(3, 'Name is required').regex(/^[A-Za-z][A-Za-z\s'.-]+$/, 'Use a valid full name'),
  title: z.string().trim().min(2, 'Title is required').optional(),
  email: z.string().email().optional().or(z.literal('')),
  priority: z.enum(['P1', 'P2', 'P3']).default('P2'),
  persona_lane: z.string().optional(),
  role_in_deal: z.string().optional(),
  linkedin_url: z.string().url().regex(/^https:\/\/(www\.)?linkedin\.com\//i, 'Use a valid LinkedIn URL').optional().or(z.literal('')),
  why_this_persona: z.string().optional(),
  notes: z.string().optional(),
});
export type AddPersonaInput = z.infer<typeof AddPersonaSchema>;

// ── Campaigns ─────────────────────────────────────────
export const CreateCampaignSchema = z.object({
  name: z.string().trim().min(3, 'Campaign name is required'),
  template_key: z.string().trim().min(1).default('trade_show_follow_up'),
  campaign_type: z.string().trim().min(1).default('trade_show'),
  status: z.string().trim().min(1).default('draft'),
  owner: z.string().trim().default('Casey'),
  target_account_count: z.coerce.number().int().min(0).default(0),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  messaging_angle: z.string().trim().optional().nullable(),
  key_dates: z.string().trim().optional().nullable(),
});
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

export const UpdateCampaignSettingsSchema = z.object({
  name: z.string().trim().min(3, 'Campaign name is required'),
  owner: z.string().trim().min(1).default('Casey'),
  status: z.enum(['draft', 'active', 'paused', 'completed']).default('draft'),
  target_account_count: z.coerce.number().int().min(0).default(0),
  messaging_angle: z.string().trim().optional().nullable(),
  touch_count: z.coerce.number().int().min(1).max(12).default(4),
  suggested_intervals: z.string().trim().min(1, 'Intervals are required'),
});
export type UpdateCampaignSettingsInput = z.infer<typeof UpdateCampaignSettingsSchema>;

// ── Email Send ────────────────────────────────────────
export const SendEmailSchema = z.object({
  to: z.string().email('Valid email required'),
  cc: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  bodyHtml: z.string().min(1, 'Body is required'),
  accountName: z.string().optional(),
  personaName: z.string().optional(),
  personaId: z.number().int().positive().optional(),
  generatedContentId: z.number().int().positive().optional(),
  workflowMetadata: z.object({
    surface: z.string().min(1),
    shell: z.string().optional(),
    variant: z.string().optional(),
    recipientSetKey: z.string().optional().nullable(),
    selectedRecipientIds: z.array(z.number().int().positive()).optional(),
    assetId: z.number().int().positive().optional().nullable(),
    assetVersion: z.number().int().positive().optional().nullable(),
    details: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
});
export type SendEmailInput = z.infer<typeof SendEmailSchema>;

export const BulkSendEmailSchema = z.object({
  recipients: z.array(z.object({
    to: z.string().trim().min(1),
    personaId: z.number().int().positive().optional(),
    personaName: z.string().optional(),
    accountName: z.string().optional(),
    readinessScore: z.number().int().min(0).max(100).optional(),
    readinessTier: z.enum(['high', 'medium', 'low']).optional(),
    stale: z.boolean().optional(),
  })).min(1),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
  accountName: z.string().optional(),
  generatedContentId: z.number().int().positive().optional(),
  workflowMetadata: z.object({
    surface: z.string().min(1),
    shell: z.string().optional(),
    variant: z.string().optional(),
    recipientSetKey: z.string().optional().nullable(),
    selectedRecipientIds: z.array(z.number().int().positive()).optional(),
    assetId: z.number().int().positive().optional().nullable(),
    assetVersion: z.number().int().positive().optional().nullable(),
    details: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
});

const SendStrategySchema = z.object({
  timezone_window: z.object({
    timezone: z.string().min(1),
    start_hour: z.number().int().min(0).max(23),
    end_hour: z.number().int().min(1).max(24),
  }),
  daily_cap: z.number().int().min(1).max(10000),
  domain_cap: z.number().int().min(1).max(10000),
  pacing_mode: z.enum(['safe', 'balanced', 'aggressive']),
});

export const BulkSendAsyncSchema = z.object({
  guardWarningsAcknowledged: z.boolean().default(false),
  requestedBy: z.string().optional(),
  workflowMetadata: z.object({
    surface: z.string().min(1),
    shell: z.string().optional(),
    variant: z.string().optional(),
    recipientSetKey: z.string().optional().nullable(),
    selectedRecipientIds: z.array(z.number().int().positive()).optional(),
    assetId: z.number().int().positive().optional().nullable(),
    assetVersion: z.number().int().positive().optional().nullable(),
    details: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
  strategy: SendStrategySchema.optional(),
  experiment: z.object({
    name: z.string().min(3),
    primaryMetric: z.enum(['reply_rate', 'meeting_rate', 'positive_reply_rate']).default('reply_rate'),
    split: z.record(z.string(), z.number().int().min(1).max(100)),
    variants: z.array(z.object({
      variantKey: z.string().min(1),
      subject: z.string().min(1),
      opening: z.string().optional(),
      cta: z.string().optional(),
      split: z.number().int().min(1).max(100),
      isControl: z.boolean().default(false),
    })).min(2),
  }).optional(),
  items: z.array(z.object({
    generatedContentId: z.number().int().positive().optional(),
    accountName: z.string().min(1),
    bundleId: z.string().max(128).optional().nullable(),
    sequencePosition: z.number().int().min(1).max(50).optional().nullable(),
    subject: z.string().min(1),
    bodyHtml: z.string().min(1),
    recipients: z.array(z.object({
      to: z.string().trim().min(1),
      personaId: z.number().int().positive().optional(),
      personaName: z.string().optional(),
      accountName: z.string().optional(),
      readinessScore: z.number().int().min(0).max(100).optional(),
      readinessTier: z.enum(['high', 'medium', 'low']).optional(),
      stale: z.boolean().optional(),
    })).min(1),
  })).min(1),
});
export type BulkSendAsyncInput = z.infer<typeof BulkSendAsyncSchema>;

export const OperatorOutcomeSchema = z.object({
  accountName: z.string().min(1),
  outcomeLabel: z.enum(['positive', 'neutral', 'negative', 'wrong-person', 'bad-timing', 'closed-won', 'closed-lost']),
  sourceKind: z.string().min(1),
  sourceId: z.string().min(1),
  campaignId: z.number().int().positive().optional().nullable(),
  generatedContentId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
});
export type OperatorOutcomeInput = z.infer<typeof OperatorOutcomeSchema>;

export const SignalRegenerationSchema = z.object({
  sourceKind: z.string().min(1),
  sourceId: z.string().min(1),
  signalKind: z.string().min(1),
  context: z.string().min(1),
  campaignId: z.number().int().positive().optional().nullable(),
  generatedContentId: z.number().int().positive().optional().nullable(),
});
export type SignalRegenerationInput = z.infer<typeof SignalRegenerationSchema>;

export const MessageEvolutionStatusSchema = z.enum([
  'proposed',
  'in-review',
  'approved',
  'rejected',
  'deployed',
  'rolled-back',
]);

export const MessageEvolutionUpdateSchema = z.object({
  id: z.string().min(1),
  action: z.enum(['review', 'approve', 'reject', 'deploy', 'rollback']),
  actor: z.string().optional().nullable(),
});
export type MessageEvolutionUpdateInput = z.infer<typeof MessageEvolutionUpdateSchema>;

export const CampaignGenerationContractSchema = z.object({
  campaignId: z.number().int().positive(),
  objective: z.string().min(4),
  personaHypothesis: z.string().min(4),
  offer: z.string().min(4),
  proof: z.string().min(4),
  cta: z.string().min(4),
  metric: z.string().min(4),
  createdBy: z.string().optional().nullable(),
});
export type CampaignGenerationContractInput = z.infer<typeof CampaignGenerationContractSchema>;
