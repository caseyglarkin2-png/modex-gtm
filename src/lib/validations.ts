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
  tone: z.enum(['formal', 'conversational', 'provocative']).default('conversational'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  context: z.record(z.string(), z.string()).optional(),
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

// ── Email Send ────────────────────────────────────────
export const SendEmailSchema = z.object({
  to: z.string().email('Valid email required'),
  cc: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  bodyHtml: z.string().min(1, 'Body is required'),
  accountName: z.string().optional(),
  personaName: z.string().optional(),
  generatedContentId: z.number().int().positive().optional(),
});
export type SendEmailInput = z.infer<typeof SendEmailSchema>;

export const BulkSendEmailSchema = z.object({
  recipients: z.array(z.object({
    to: z.string().email(),
    personaName: z.string().optional(),
    accountName: z.string().optional(),
  })).min(1),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
  accountName: z.string().optional(),
});
