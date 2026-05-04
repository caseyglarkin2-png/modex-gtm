import { CONTENT_QUALITY_SEND_BLOCK_THRESHOLD } from '@/lib/content-quality';

export type ApprovalTrigger = 'volume-threshold' | 'low-score' | 'new-domain' | 'high-bounce-risk';

export type ApprovalRiskInput = {
  recipientCount: number;
  qualityScore?: number | null;
  domains: string[];
  knownDomains: string[];
  recentBounceRate?: number | null;
};

export type ApprovalPolicyResult = {
  required: boolean;
  riskScore: number;
  triggers: ApprovalTrigger[];
  rationale: string[];
};

const VOLUME_THRESHOLD = 40;
const HIGH_BOUNCE_RATE = 0.08;

export function evaluateApprovalPolicy(input: ApprovalRiskInput): ApprovalPolicyResult {
  const triggers: ApprovalTrigger[] = [];
  const rationale: string[] = [];
  let riskScore = 0;

  if (input.recipientCount >= VOLUME_THRESHOLD) {
    triggers.push('volume-threshold');
    riskScore += 35;
    rationale.push(`Large send batch (${input.recipientCount}) exceeds volume threshold ${VOLUME_THRESHOLD}.`);
  }
  if ((input.qualityScore ?? 100) < CONTENT_QUALITY_SEND_BLOCK_THRESHOLD) {
    triggers.push('low-score');
    riskScore += 30;
    rationale.push(`Content quality score ${input.qualityScore ?? 'unknown'} is below safe threshold.`);
  }

  const known = new Set(input.knownDomains.map((d) => d.toLowerCase()));
  const novelDomains = input.domains.filter((domain) => !known.has(domain.toLowerCase()));
  if (novelDomains.length > 0) {
    triggers.push('new-domain');
    riskScore += Math.min(20, novelDomains.length * 5);
    rationale.push(`New target domains detected: ${novelDomains.slice(0, 5).join(', ')}.`);
  }
  if ((input.recentBounceRate ?? 0) >= HIGH_BOUNCE_RATE) {
    triggers.push('high-bounce-risk');
    riskScore += 25;
    rationale.push(`Recent bounce rate ${((input.recentBounceRate ?? 0) * 100).toFixed(1)}% exceeds risk policy.`);
  }

  return {
    required: triggers.length > 0,
    riskScore: Math.min(100, riskScore),
    triggers,
    rationale,
  };
}
