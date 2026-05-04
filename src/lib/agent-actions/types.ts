import { z } from 'zod';

export const AGENT_ACTION_TYPES = [
  'account_research',
  'contact_dossier',
  'company_contacts',
  'committee_refresh',
  'prospect_discover',
  'contact_enrich',
  'content_context',
  'pipeline_snapshot',
  'draft_outreach',
  'sequence_recommendation',
] as const;

export type AgentActionType = (typeof AGENT_ACTION_TYPES)[number];

export const AgentActionTargetSchema = z.object({
  accountName: z.string().min(1).optional(),
  personaId: z.number().int().positive().optional(),
  email: z.string().email().optional(),
  company: z.string().min(1).optional(),
});

export type AgentActionTarget = z.infer<typeof AgentActionTargetSchema>;

export const AgentActionRequestSchema = z.object({
  action: z.enum(AGENT_ACTION_TYPES),
  target: AgentActionTargetSchema.default({}),
  refresh: z.boolean().optional().default(false),
  depth: z.enum(['quick', 'deep']).optional().default('quick'),
  limit: z.number().int().min(1).max(100).optional(),
});

export type AgentActionRequest = z.infer<typeof AgentActionRequestSchema>;

export type AgentActionCardTone = 'default' | 'success' | 'warning';

export interface AgentActionCard {
  title: string;
  body: string;
  tone?: AgentActionCardTone;
}

export interface AgentActionResult {
  action: AgentActionType;
  provider: 'clawd' | 'sales_agent' | 'modex';
  status: 'ok' | 'partial' | 'error';
  summary: string;
  cards: AgentActionCard[];
  data: Record<string, unknown>;
  freshness: {
    fetchedAt: string;
    stale: boolean;
    source: 'live' | 'cache';
  };
  nextActions: string[];
}

export interface AgentActionCapability {
  action: AgentActionType;
  preferredProvider: 'clawd' | 'sales_agent' | 'modex';
  fallbackProvider: 'clawd' | 'sales_agent' | 'modex' | null;
  configured: boolean;
}

