import { z } from 'zod';

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
  type: z.enum(['email', 'dm', 'call_script', 'meeting_prep', 'infographic']),
  accountName: z.string().min(1),
  personaName: z.string().optional(),
  tone: z.enum(['formal', 'conversational', 'provocative']).default('conversational'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  // Extra context passed from account data
  context: z.record(z.string(), z.string()).optional(),
});
export type GenerateContentInput = z.infer<typeof GenerateContentSchema>;

// ── Email Send ────────────────────────────────────────
export const SendEmailSchema = z.object({
  to: z.string().email('Valid email required'),
  cc: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  bodyHtml: z.string().min(1, 'Body is required'),
  accountName: z.string().optional(),
  personaName: z.string().optional(),
});
export type SendEmailInput = z.infer<typeof SendEmailSchema>;

export const BulkSendEmailSchema = z.object({
  recipients: z.array(z.object({
    to: z.string().email(),
    personaName: z.string().optional(),
  })).min(1),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
  accountName: z.string().optional(),
});
