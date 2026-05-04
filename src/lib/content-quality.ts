export type ContentQualityDimension =
  | 'clarity'
  | 'personalization'
  | 'cta_strength'
  | 'compliance_risk'
  | 'deliverability_risk';

export type ContentQualityScores = {
  clarity: number;
  personalization: number;
  cta_strength: number;
  compliance_risk: number;
  deliverability_risk: number;
};

export type ContentQualityResult = {
  score: number;
  scores: ContentQualityScores;
  flags: string[];
  fixes: string[];
  blockedByThreshold: boolean;
};

export const CONTENT_QUALITY_SEND_BLOCK_THRESHOLD = 60;

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countMatches(content: string, patterns: RegExp[]): number {
  return patterns.reduce((sum, pattern) => sum + (pattern.test(content) ? 1 : 0), 0);
}

export function evaluateContentQuality(content: string, accountName: string): ContentQualityResult {
  const body = content || '';
  const lower = body.toLowerCase();
  const wordCount = lower.split(/\s+/).filter(Boolean).length;

  const clarityBase = wordCount >= 90 && wordCount <= 450 ? 72 : 52;
  const claritySignals = countMatches(lower, [
    /\b(overview|summary|next step|timeline|implementation|outcome)\b/,
    /\b(1\.|2\.|3\.|- )/,
  ]);
  const clarity = clamp(clarityBase + claritySignals * 10);

  const accountSignal = accountName.trim().toLowerCase();
  const personalizationSignals = countMatches(lower, [
    new RegExp(`\\b${accountSignal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`),
    /\b(you|your team|your facility|your network)\b/,
  ]);
  const personalization = clamp(40 + personalizationSignals * 25);

  const ctaSignals = countMatches(lower, [
    /\b(book|schedule|confirm|reply|meet|call)\b/,
    /\b(this week|next week|15-minute|30-minute)\b/,
  ]);
  const cta_strength = clamp(35 + ctaSignals * 30);

  const complianceRiskSignals = countMatches(lower, [
    /\b(guarantee|guaranteed|risk-free|no risk|promise)\b/,
    /\b(always|never fail|instant)\b/,
  ]);
  const compliance_risk = clamp(10 + complianceRiskSignals * 30);

  const deliverabilityRiskSignals = countMatches(lower, [
    /\b(free!!!|click here now|act now|urgent)\b/,
    /(https?:\/\/\S+.*https?:\/\/\S+)/,
  ]);
  const deliverability_risk = clamp(10 + deliverabilityRiskSignals * 35);

  const score = clamp(
    (clarity * 0.3)
      + (personalization * 0.25)
      + (cta_strength * 0.25)
      + ((100 - compliance_risk) * 0.1)
      + ((100 - deliverability_risk) * 0.1),
  );

  const flags: string[] = [];
  const fixes: string[] = [];

  if (clarity < 60) {
    flags.push('low_clarity');
    fixes.push('Tighten structure with a short summary and explicit next steps.');
  }
  if (personalization < 60) {
    flags.push('low_personalization');
    fixes.push('Reference account-specific context and operator-relevant language.');
  }
  if (cta_strength < 60) {
    flags.push('weak_cta');
    fixes.push('Add a concrete CTA with a specific action and timeframe.');
  }
  if (compliance_risk >= 50) {
    flags.push('compliance_risk');
    fixes.push('Remove absolute claims and unsupported guarantees.');
  }
  if (deliverability_risk >= 50) {
    flags.push('deliverability_risk');
    fixes.push('Reduce spam-like phrasing and limit excessive links/urgent language.');
  }

  return {
    score,
    scores: {
      clarity,
      personalization,
      cta_strength,
      compliance_risk,
      deliverability_risk,
    },
    flags,
    fixes,
    blockedByThreshold: score < CONTENT_QUALITY_SEND_BLOCK_THRESHOLD,
  };
}
