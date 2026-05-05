import { buildAgentActionCacheKey } from '@/lib/agent-actions/cache';
import { buildAgentActionFreshness, buildFreshnessDimension } from '@/lib/agent-actions/freshness';
import type { AgentActionRequest, AgentActionResult } from '@/lib/agent-actions/types';

export const ACCOUNT_PAGE_SEND_PRIMARY = 'E2E Boston Beer Company';
export const ACCOUNT_PAGE_SEND_ALIAS = 'The E2E Boston Beer Company';
export const ACCOUNT_PAGE_SEND_ACCOUNTS = [ACCOUNT_PAGE_SEND_PRIMARY, ACCOUNT_PAGE_SEND_ALIAS] as const;

export type AccountPageSendFixture = {
  primaryAccountName: string;
  aliasAccountName: string;
  accountSlug: string;
  cacheKey: string;
  validRecipient: {
    personaId: string;
    name: string;
    email: string;
  };
  malformedRecipient: {
    personaId: string;
    name: string;
    email: string;
  };
  unsubscribedRecipient: {
    personaId: string;
    name: string;
    email: string;
  };
  stagedCandidate: {
    candidateKey: string;
    fullName: string;
    email: string;
  };
  sendJob: {
    requestId: string;
  };
};

function buildSeedFreshness(nowIso: string) {
  return buildAgentActionFreshness({
    fetchedAt: nowIso,
    source: 'cache',
    dimensions: {
      summary: buildFreshnessDimension({
        key: 'summary',
        label: 'Research summary',
        updatedAt: nowIso,
        fetchedAt: nowIso,
        source: 'cache',
      }),
      signals: buildFreshnessDimension({
        key: 'signals',
        label: 'Signals',
        updatedAt: nowIso,
        fetchedAt: nowIso,
        source: 'cache',
      }),
      contacts: buildFreshnessDimension({
        key: 'contacts',
        label: 'Contacts',
        updatedAt: nowIso,
        fetchedAt: nowIso,
        source: 'local',
      }),
      generated_content: buildFreshnessDimension({
        key: 'generated_content',
        label: 'Generated content',
        updatedAt: nowIso,
        fetchedAt: nowIso,
        source: 'local',
      }),
    },
  });
}

export function buildAccountPageSendFixture(): AccountPageSendFixture {
  const request: AgentActionRequest = {
    action: 'content_context',
    refresh: false,
    depth: 'quick',
    target: {
      accountName: ACCOUNT_PAGE_SEND_PRIMARY,
      company: ACCOUNT_PAGE_SEND_PRIMARY,
      accountNames: [...ACCOUNT_PAGE_SEND_ACCOUNTS],
    },
  };

  return {
    primaryAccountName: ACCOUNT_PAGE_SEND_PRIMARY,
    aliasAccountName: ACCOUNT_PAGE_SEND_ALIAS,
    accountSlug: 'e2e-boston-beer-company',
    cacheKey: buildAgentActionCacheKey(request),
    validRecipient: {
      personaId: 'e2e-boston-valid',
      name: 'Pat Brewer',
      email: 'pat.brewer@e2ebostonbeer.com',
    },
    malformedRecipient: {
      personaId: 'e2e-boston-invalid',
      name: 'Alex Badpayload',
      email: 'not-an-email',
    },
    unsubscribedRecipient: {
      personaId: 'e2e-boston-unsubscribed',
      name: 'Taylor Optout',
      email: 'taylor.optout@e2ebostonbeer.com',
    },
    stagedCandidate: {
      candidateKey: 'jamie.yardley@e2ebostonbeer.com::director-logistics',
      fullName: 'Jamie Yardley',
      email: 'jamie.yardley@e2ebostonbeer.com',
    },
    sendJob: {
      requestId: 'proof-send-job-1',
    },
  };
}

export function buildSeededAccountContentContext(now = new Date()): AgentActionResult {
  const nowIso = now.toISOString();
  return {
    action: 'content_context',
    provider: 'modex',
    status: 'ok',
    summary: 'Boston Beer has fresh account intel, one promoted operator contact, a staged logistics candidate, and a recent positive reply to work from.',
    cards: [
      {
        title: 'Research Summary',
        body: 'Boston Beer is a proof account for the canonical account-page workflow. The current hypothesis is gate-to-dock variance plus fragmented account identity.',
        tone: 'success',
      },
      {
        title: 'Contact Coverage',
        body: '3 mapped contacts across operator and executive lanes. One additional staged logistics candidate is ready for promotion.',
        tone: 'success',
      },
      {
        title: 'Committee Coverage',
        body: 'Operator lane is covered. Executive sponsor exists. Transformation lane is still thin.',
        tone: 'warning',
      },
      {
        title: 'Buyer Map',
        body: 'Pat Brewer, Taylor Optout, Jamie Yardley',
        tone: 'default',
      },
      {
        title: 'Pipeline',
        body: 'Account is in outbound validation with a warm reply signal.',
        tone: 'default',
      },
      {
        title: 'Drafting Signals',
        body: 'Live proof exists for canonical identity resolution, recipient filtering, and inline recovery steps.',
        tone: 'success',
      },
    ],
    data: {
      company: {
        name: ACCOUNT_PAGE_SEND_PRIMARY,
        domain: 'e2ebostonbeer.com',
      },
      latestEmail: {
        subject: 'yard network scorecard for E2E Boston Beer Company',
        sent_at: nowIso,
        to_email: 'pat.brewer@e2ebostonbeer.com',
        reply_count: 1,
      },
      latestAsset: {
        content_type: 'one_pager',
        created_at: nowIso,
      },
      contactFreshness: {
        mappedContactCount: 3,
        liveContactCount: 4,
        latestEnrichedAt: nowIso,
      },
      pipeline: {
        pipeline: { stage: 'outbound_validation' },
        funnel: { replied: 1, meetings: 0 },
      },
      salesContacts: [
        { name: 'Pat Brewer', title: 'VP Transportation', email: 'pat.brewer@e2ebostonbeer.com' },
        { name: 'Jamie Yardley', title: 'Director Logistics', email: 'jamie.yardley@e2ebostonbeer.com' },
      ],
      salesAgent: {
        decisionMakers: {
          decision_makers: [
            { name: 'Pat Brewer', title: 'VP Transportation' },
            { name: 'Taylor Optout', title: 'Chief Supply Chain Officer' },
          ],
        },
      },
    },
    freshness: buildSeedFreshness(nowIso),
    nextActions: [
      'Promote the staged logistics contact, send the proof asset, and turn the warm reply into a meeting.',
      'Keep the malformed and unsubscribed contacts out of the next send.',
    ],
  };
}
