import { prisma } from '@/lib/prisma';
import { runAgentAction } from '@/lib/agent-actions/broker';
import type { AgentActionResult } from '@/lib/agent-actions/types';
import { buildGenerationInputContract } from '@/lib/agent-actions/generation-input';
import { DEFAULT_CTA_MODE } from '@/lib/revops/cold-outbound-policy';

type GetAgentContentContextArgs = {
  accountName: string;
  accountNames?: string[];
  personaName?: string;
  refresh?: boolean;
};

export async function getAgentContentContext({
  accountName,
  accountNames,
  personaName,
  refresh = false,
}: GetAgentContentContextArgs): Promise<AgentActionResult | null> {
  const scopedAccountNames = Array.from(new Set(accountNames?.length ? accountNames : [accountName]));
  const persona = personaName
    ? await prisma.persona.findFirst({
        where: {
          account_name: { in: scopedAccountNames },
          name: {
            equals: personaName,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          email: true,
        },
      }).catch(() => null)
    : null;

  return runAgentAction({
    action: 'content_context',
    refresh,
    depth: 'quick',
    target: {
      accountName,
      accountNames: scopedAccountNames,
      company: accountName,
      personaId: persona?.id,
      email: persona?.email ?? undefined,
    },
  }).catch(() => null);
}

export function toAgentMetadata(result: AgentActionResult | null, ctaMode = DEFAULT_CTA_MODE) {
  if (!result) return null;
  return {
    provider: result.provider,
    status: result.status,
    summary: result.summary,
    nextActions: result.nextActions,
    freshness: result.freshness,
    generationInput: buildGenerationInputContract(result, ctaMode),
  };
}
