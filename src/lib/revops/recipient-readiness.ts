export type RecipientReadinessInput = {
  email_confidence?: number | null;
  quality_score?: number | null;
  title?: string | null;
  role_in_deal?: string | null;
  last_enriched_at?: string | Date | null;
};

export type RecipientReadinessBreakdown = {
  contact_confidence: number;
  role_fit: number;
  account_context: number;
  freshness: number;
};

export type RecipientReadinessTier = 'high' | 'medium' | 'low';

export type RecipientReadiness = {
  score: number;
  tier: RecipientReadinessTier;
  stale: boolean;
  freshness_days: number | null;
  breakdown: RecipientReadinessBreakdown;
  reasons: string[];
};

export const RECIPIENT_READINESS_FLOOR_BY_CAMPAIGN_TYPE: Record<string, number> = {
  trade_show: 65,
  outbound: 70,
  expansion: 60,
  default: 65,
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeRoleFit(title?: string | null, roleInDeal?: string | null): number {
  const haystack = `${title ?? ''} ${roleInDeal ?? ''}`.toLowerCase();
  if (!haystack.trim()) return 40;
  if (/(chief|cfo|coo|ceo|vp|vice president|svp|head|director)/.test(haystack)) return 90;
  if (/(manager|lead|supervisor|operations|logistics|supply chain)/.test(haystack)) return 75;
  if (/(analyst|coordinator|assistant|intern)/.test(haystack)) return 45;
  return 60;
}

function normalizeAccountContext(title?: string | null, roleInDeal?: string | null): number {
  const hasTitle = Boolean(title?.trim());
  const role = (roleInDeal ?? '').toLowerCase();
  if (role.includes('decision')) return 90;
  if (role.includes('influenc') || role.includes('champion')) return 80;
  if (hasTitle) return 70;
  return 50;
}

export function computeRecipientReadiness(
  input: RecipientReadinessInput,
  now = new Date(),
): RecipientReadiness {
  const emailConfidence = clamp(input.email_confidence ?? 0);
  const qualityScore = clamp(input.quality_score ?? 0);
  const contact_confidence = clamp(emailConfidence * 0.7 + qualityScore * 0.3);
  const role_fit = normalizeRoleFit(input.title, input.role_in_deal);
  const account_context = normalizeAccountContext(input.title, input.role_in_deal);

  const enrichedAt = toDate(input.last_enriched_at);
  const freshnessDays = enrichedAt
    ? Math.max(0, Math.floor((now.getTime() - enrichedAt.getTime()) / (24 * 60 * 60 * 1000)))
    : null;
  const stale = freshnessDays === null || freshnessDays > 45;
  const freshness = freshnessDays === null ? 25 : freshnessDays <= 14 ? 95 : freshnessDays <= 30 ? 80 : freshnessDays <= 45 ? 65 : 35;

  const score = clamp(contact_confidence * 0.35 + role_fit * 0.25 + account_context * 0.2 + freshness * 0.2);
  const tier: RecipientReadinessTier = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';

  const reasons: string[] = [];
  if (contact_confidence < 60) reasons.push('Low contact confidence');
  if (role_fit < 60) reasons.push('Weak role fit for buyer motion');
  if (account_context < 60) reasons.push('Missing account context alignment');
  if (stale) reasons.push('Stale or missing enrichment');

  return {
    score,
    tier,
    stale,
    freshness_days: freshnessDays,
    breakdown: {
      contact_confidence,
      role_fit,
      account_context,
      freshness,
    },
    reasons,
  };
}

export function getRecipientReadinessFloor(campaignType?: string | null): number {
  if (!campaignType) return RECIPIENT_READINESS_FLOOR_BY_CAMPAIGN_TYPE.default;
  return RECIPIENT_READINESS_FLOOR_BY_CAMPAIGN_TYPE[campaignType] ?? RECIPIENT_READINESS_FLOOR_BY_CAMPAIGN_TYPE.default;
}
