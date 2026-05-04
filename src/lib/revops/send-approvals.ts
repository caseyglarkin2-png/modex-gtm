import type { PrismaClient } from '@prisma/client';
import { evaluateApprovalPolicy } from '@/lib/revops/send-approval-policy';

export type ApprovalGateInput = {
  channel: 'single' | 'bulk' | 'bulk-async';
  accountName?: string | null;
  recipientCount: number;
  qualityScore?: number | null;
  domains: string[];
  knownDomains: string[];
  recentBounceRate?: number | null;
  requestedBy?: string | null;
};

export async function enforceSendApprovalGate(prisma: PrismaClient, input: ApprovalGateInput) {
  const policy = evaluateApprovalPolicy({
    recipientCount: input.recipientCount,
    qualityScore: input.qualityScore ?? null,
    domains: input.domains,
    knownDomains: input.knownDomains,
    recentBounceRate: input.recentBounceRate ?? null,
  });

  if (!policy.required) {
    return { allowed: true as const, policy };
  }

  const approval = await prisma.sendApprovalRequest.create({
    data: {
      send_job_id: null,
      channel: input.channel,
      account_name: input.accountName ?? null,
      risk_score: policy.riskScore,
      risk_reasons: policy.rationale,
      status: 'pending',
      requested_by: input.requestedBy ?? 'Casey',
      sla_due_at: new Date(Date.now() + 6 * 60 * 60 * 1000),
    },
    select: {
      id: true,
      status: true,
      risk_score: true,
      risk_reasons: true,
      sla_due_at: true,
    },
  });

  return {
    allowed: false as const,
    policy,
    approval,
  };
}
