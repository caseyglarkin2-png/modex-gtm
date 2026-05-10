import { prisma } from '@/lib/prisma';
import { createHash } from 'node:crypto';
import { getAccountContext } from '@/lib/db';
import { generateText } from '@/lib/ai/client';
import { buildEmailPrompt, buildOutreachSequencePrompt, type PromptContext } from '@/lib/ai/prompts';
import { buildAgentActionCacheKey, readCachedAgentAction, writeCachedAgentAction, getAgentActionTtlMs, applyFreshness } from '@/lib/agent-actions/cache';
import { getConfiguredAgentClients } from '@/lib/agent-actions/clients';
import { buildAgentActionFreshness, buildFreshnessDimension, createDefaultAgentActionFreshness } from '@/lib/agent-actions/freshness';
import type { AgentActionCapability, AgentActionCard, AgentActionRequest, AgentActionResult, AgentActionTarget, AgentActionType } from '@/lib/agent-actions/types';
import { SOURCE_EVIDENCE_INGEST_ENABLED } from '@/lib/feature-flags';
import { createResearchRun, upsertEvidenceRecords } from '@/lib/source-backed/evidence';
import { buildGenerationInputContract } from '@/lib/agent-actions/generation-input';
import { buildSourceBackedContractFromGeneratedText } from '@/lib/source-backed/attribution';

type ResolvedTarget = AgentActionTarget & {
  accountName?: string;
  accountNames?: string[];
  company?: string;
  email?: string;
  personaName?: string;
  personaTitle?: string;
};

function safeString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function summarizeList(values: string[], max = 4) {
  return values.filter(Boolean).slice(0, max).join(' • ');
}

function nowIso() {
  return new Date().toISOString();
}

function baseResult(action: AgentActionType, provider: AgentActionResult['provider']): AgentActionResult {
  return {
    action,
    provider,
    status: 'ok',
    summary: '',
    cards: [],
    data: {},
    freshness: {
      ...createDefaultAgentActionFreshness(nowIso()),
    },
    nextActions: [],
  };
}

function previewJson(value: unknown, maxLength = 500) {
  const text = JSON.stringify(value, null, 2);
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function card(title: string, body: string, tone?: AgentActionCard['tone']): AgentActionCard {
  return { title, body, tone };
}

function normalizeDomain(value: string | null | undefined) {
  return typeof value === 'string'
    ? value.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '').toLowerCase()
    : '';
}

function extractArrayRecords(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter(Boolean) as Array<Record<string, unknown>> : [];
}

function hashEvidenceClaim(claim: string) {
  return createHash('sha256').update(claim).digest('hex');
}

export function sanitizeOutreachDraftText(value: string): string {
  const normalized = value
    .replace(/\r\n/g, '\n')
    .replace(/—/g, ', ')
    .replace(/\bdwtb\.dev\b/gi, 'yardflow.ai')
    .replace(/\bDWTB\?!\s*Studios\b.*$/gim, 'YardFlow by FreightRoll')
    .replace(/\n{3,}/g, '\n\n');

  const withoutLegacySignature = normalized
    .replace(/\n-{3,}\nYardFlow by FreightRoll[\s\S]*$/i, '')
    .replace(/\n-{3,}\nDWTB\?!\s*Studios[\s\S]*$/i, '')
    .replace(/\nIf you'd prefer not to hear from me[\s\S]*$/i, '');

  return withoutLegacySignature.trim();
}

function sanitizeOutreachDraftPayload(value: unknown): unknown {
  if (typeof value === 'string') return sanitizeOutreachDraftText(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeOutreachDraftPayload(item));
  if (!value || typeof value !== 'object') return value;

  const entries = Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => {
    if (typeof entryValue === 'string') {
      if (key === 'subject' || key === 'body' || key === 'draft' || key === 'content' || key === 'message') {
        return [key, sanitizeOutreachDraftText(entryValue)];
      }
      return [key, entryValue.replace(/—/g, ', ').replace(/\bdwtb\.dev\b/gi, 'yardflow.ai')];
    }
    return [key, sanitizeOutreachDraftPayload(entryValue)];
  });

  return Object.fromEntries(entries);
}

function sanitizeDraftOutreachResult(result: AgentActionResult): AgentActionResult {
  const data = (result.data ?? {}) as Record<string, unknown>;
  if (!data.draft) return result;

  const sanitizedDraft = sanitizeOutreachDraftPayload(data.draft);
  const sanitizedCards = result.cards.map((entry) => (
    entry.title.toLowerCase().includes('draft')
      ? { ...entry, body: sanitizeOutreachDraftText(entry.body) }
      : entry
  ));

  return {
    ...result,
    summary: sanitizeOutreachDraftText(result.summary),
    cards: sanitizedCards,
    data: {
      ...data,
      draft: sanitizedDraft,
    },
  };
}

function maybeSanitizeResult(action: AgentActionType, result: AgentActionResult): AgentActionResult {
  if (action !== 'draft_outreach') return result;
  return sanitizeDraftOutreachResult(result);
}

function dedupeContacts(contacts: Array<Record<string, unknown>>) {
  const seen = new Set<string>();
  return contacts.filter((contact) => {
    const key = safeString(contact.email).toLowerCase() || safeString(contact.name).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function getSalesAgentCompanyContacts(
  salesAgent: ReturnType<typeof getConfiguredAgentClients>['salesAgent'],
  company: string,
  companyPayload?: Record<string, unknown> | null,
  limit = 10,
) {
  if (!salesAgent) return [];

  const queries = [
    normalizeDomain(companyPayload?.domain as string | undefined),
    normalizeDomain(companyPayload?.website as string | undefined),
    company,
  ].filter(Boolean);

  const results: Array<Record<string, unknown>> = [];
  for (const query of queries) {
    try {
      const payload = await salesAgent.searchContacts(query, limit);
      const contacts = extractArrayRecords((payload as Record<string, unknown>).contacts);
      if (contacts.length > 0) {
        results.push(...contacts);
        if (results.length >= limit) break;
      }
    } catch {
      // Ignore individual search failures and let other sources try.
    }
  }

  return dedupeContacts(results).slice(0, limit);
}

async function resolveTarget(target: AgentActionTarget): Promise<ResolvedTarget> {
  const resolved: ResolvedTarget = { ...target };
  if (resolved.personaId) {
    const persona = await prisma.persona.findUnique({
      where: { id: resolved.personaId },
      select: {
        id: true,
        name: true,
        title: true,
        email: true,
        account_name: true,
      },
    });
    if (persona) {
      resolved.accountName = resolved.accountName ?? persona.account_name;
      resolved.accountNames = resolved.accountNames?.length ? resolved.accountNames : [persona.account_name];
      resolved.company = resolved.company ?? persona.account_name;
      resolved.email = resolved.email ?? persona.email ?? undefined;
      resolved.personaName = persona.name;
      resolved.personaTitle = persona.title ?? undefined;
    }
  }

  if (!resolved.accountName && resolved.email) {
    const persona = await prisma.persona.findFirst({
      where: { email: resolved.email },
      select: {
        name: true,
        title: true,
        account_name: true,
      },
    });
    if (persona) {
      resolved.accountName = persona.account_name;
      resolved.accountNames = resolved.accountNames?.length ? resolved.accountNames : [persona.account_name];
      resolved.company = resolved.company ?? persona.account_name;
      resolved.personaName = persona.name;
      resolved.personaTitle = persona.title ?? undefined;
    }
  }

  if (!resolved.company && resolved.accountName) {
    resolved.company = resolved.accountName;
  }
  if (!resolved.accountNames?.length && resolved.accountName) {
    resolved.accountNames = [resolved.accountName];
  }

  return resolved;
}

async function recordAgentActivity(accountName: string | undefined, action: AgentActionType, summary: string) {
  if (!accountName) return;
  await prisma.activity.create({
    data: {
      account_name: accountName,
      activity_type: 'Agent Action',
      owner: 'Codex',
      outcome: `${action.replace(/_/g, ' ')}: ${summary}`.slice(0, 240),
      notes: JSON.stringify({
        source: 'agent_actions',
        action,
        summary,
      }),
      activity_date: new Date(),
    },
  }).catch(() => undefined);
}

async function buildLocalPromptContext(target: ResolvedTarget): Promise<PromptContext | null> {
  if (!target.accountName) return null;
  const { account, personas } = await getAccountContext(target.accountName, target.accountNames);
  if (!account) return null;
  const persona = target.personaName
    ? personas.find((candidate) => candidate.name?.toLowerCase() === target.personaName?.toLowerCase())
    : personas[0];

  return {
    accountName: target.accountName,
    personaName: persona?.name ?? target.personaName,
    personaTitle: persona?.title ?? target.personaTitle,
    bandLabel: account.priority_band,
    score: account.priority_score,
    notes: account.why_now ?? undefined,
    vertical: account.vertical ?? undefined,
    primoAngle: account.primo_angle ?? undefined,
    parentBrand: account.parent_brand ?? undefined,
    tone: 'casual',
    length: 'medium',
  };
}

function parseSequenceBody(value: string) {
  const lines = value.trim().split('\n').filter(Boolean);
  const subject = lines[0]?.replace(/^subject:\s*/i, '').trim() || 'A tighter way to approach the yard';
  const body = lines[0]?.toLowerCase().startsWith('subject:')
    ? lines.slice(1).join('\n').trim()
    : value.trim();
  return { subject, body };
}

async function buildLocalDraftFallback(target: ResolvedTarget, contentContextSummary?: string) {
  const ctx = await buildLocalPromptContext(target);
  if (!ctx) throw new Error('Account context not found for local draft fallback.');
  const raw = await generateText(buildEmailPrompt({
    ...ctx,
    agentContextSummary: contentContextSummary,
  }), 400);
  const { subject, body } = parseSequenceBody(raw);
  return { subject, body };
}

async function buildLocalSequenceFallback(target: ResolvedTarget, contentContextSummary?: string) {
  const ctx = await buildLocalPromptContext(target);
  if (!ctx) throw new Error('Account context not found for local sequence fallback.');
  const step = 'initial_email' as const;
  const raw = await generateText(buildOutreachSequencePrompt({
    ...ctx,
    agentContextSummary: contentContextSummary,
  }, step), 400);
  return parseSequenceBody(raw);
}

function isFresh(savedAt: string, ttlMs: number) {
  return Date.now() - new Date(savedAt).getTime() <= ttlMs;
}

async function runContentContext(target: ResolvedTarget, refresh: boolean, depth: AgentActionRequest['depth'], limit = 10): Promise<AgentActionResult> {
  const result = baseResult('content_context', 'local');
  const { clawd, salesAgent } = getConfiguredAgentClients();

  if (!target.accountName) {
    result.status = 'error';
    result.summary = 'Account context is required to assemble live content context.';
    return result;
  }
  const scopedAccountName = target.accountName;

  const [accountBundle, latestEmail, latestAsset] = await Promise.all([
    getAccountContext(scopedAccountName, target.accountNames),
    prisma.emailLog.findFirst({
      where: { account_name: { in: target.accountNames?.length ? target.accountNames : [scopedAccountName] } },
      orderBy: { sent_at: 'desc' },
      select: { subject: true, sent_at: true, to_email: true, reply_count: true },
    }).catch(() => null),
    prisma.generatedContent.findFirst({
      where: { account_name: { in: target.accountNames?.length ? target.accountNames : [scopedAccountName] } },
      orderBy: { created_at: 'desc' },
      select: { content_type: true, created_at: true, version_metadata: true },
    }).catch(() => null),
  ]);

  const company = target.company ?? scopedAccountName;
  const [accountResearch, companyContacts, committee, pipelineSnapshot, salesSequence, salesAnalysis, salesDecisionMakers] = await Promise.allSettled([
    clawd?.getAccountResearch(company, refresh),
    clawd?.getCompanyContacts(company),
    clawd?.getCommittee(company).catch(() => null),
    clawd?.getPipelineSnapshot(limit),
    salesAgent?.getSequenceRecommendation({ ...target, company, limit }).catch(() => null),
    salesAgent?.analyzeCompany(company, target.personaTitle).catch(() => null),
    salesAgent?.findDecisionMakers(company).catch(() => null),
  ]);

  const personas = accountBundle.personas ?? [];
  const latestContactEnrichedAt = personas
    .map((persona) => persona.last_enriched_at)
    .filter((value): value is Date => value instanceof Date)
    .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;
  const contactNames = personas.map((persona) => persona.name);
  const committeePayload = committee.status === 'fulfilled' ? committee.value : null;
  const workbenchPayload = accountResearch.status === 'fulfilled' ? accountResearch.value?.workbench : null;
  const researchPayload = accountResearch.status === 'fulfilled' ? accountResearch.value?.intel : null;
  const companyContactsPayload = companyContacts.status === 'fulfilled' ? companyContacts.value : null;
  const pipelinePayload = pipelineSnapshot.status === 'fulfilled' ? pipelineSnapshot.value : null;
  const salesSequencePayload = salesSequence.status === 'fulfilled' ? salesSequence.value : null;
  const salesAnalysisPayload = salesAnalysis.status === 'fulfilled' ? salesAnalysis.value : null;
  const salesDecisionMakersPayload = salesDecisionMakers.status === 'fulfilled' ? salesDecisionMakers.value : null;
  const decisionMakers = Array.isArray((salesDecisionMakersPayload as Record<string, unknown> | null)?.decision_makers)
    ? (((salesDecisionMakersPayload as Record<string, unknown>).decision_makers as Array<unknown>).filter(Boolean) as Array<Record<string, unknown>>)
    : [];
  const salesContacts = await getSalesAgentCompanyContacts(
    salesAgent,
    company,
    companyContactsPayload as Record<string, unknown> | null,
    limit,
  );
  const liveContactCount = salesContacts.length > 0 ? salesContacts.length : decisionMakers.length;
  const liveContactPreview = salesContacts.length > 0
    ? salesContacts.map((contact) => safeString(contact.name) || safeString(contact.email))
    : decisionMakers.map((contact) => safeString(contact.name) || safeString(contact.email));

  const summaryParts = [
    safeString(researchPayload?.summary) || safeString(workbenchPayload?.summary),
    accountBundle.account?.why_now ? `Why now: ${accountBundle.account.why_now}` : '',
    committeePayload && typeof committeePayload === 'object'
      ? `Committee coverage: ${String((committeePayload as Record<string, unknown>).member_count ?? 0)} members`
      : '',
    decisionMakers.length ? `Decision makers: ${decisionMakers.length}` : '',
    latestEmail?.subject ? `Latest send: ${latestEmail.subject}` : '',
  ].filter(Boolean);

  result.summary = summaryParts.join(' ');
  result.cards = [
    card(
      'Research Summary',
      summarizeList([
        safeString(researchPayload?.summary),
        safeString(workbenchPayload?.summary),
        accountBundle.account?.primo_angle ?? '',
      ], 3) || 'No external research summary is cached yet.',
      'default',
    ),
    card(
      'Contact Coverage',
      `${personas.length} target personas${contactNames.length ? ` • ${summarizeList(contactNames)}` : ''}${liveContactCount > 0 ? ` • ${liveContactCount} live external contacts • ${summarizeList(liveContactPreview)}` : ''}`,
      liveContactCount > 0 ? 'success' : 'warning',
    ),
    card(
      'Committee Coverage',
      committeePayload && typeof committeePayload === 'object'
        ? summarizeList([
            safeString((committeePayload as Record<string, unknown>).decision_maker),
            `Members: ${String((committeePayload as Record<string, unknown>).member_count ?? 0)}`,
          ])
        : 'Committee has not been built yet or is unavailable.',
      committeePayload ? 'success' : 'warning',
    ),
    card(
      'Buyer Map',
      decisionMakers.length
        ? summarizeList(decisionMakers.slice(0, 4).map((contact) => safeString(contact.name) || safeString(contact.email)))
        : 'No sales-agent decision-maker suggestions yet.',
      decisionMakers.length ? 'success' : 'warning',
    ),
    card(
      'Pipeline',
      pipelinePayload?.pipeline
        ? `Pipeline snapshot available${pipelinePayload?.funnel ? ' with funnel totals.' : '.'}`
        : 'No live pipeline snapshot available.',
      pipelinePayload?.pipeline ? 'success' : 'warning',
    ),
    card(
      'Drafting Signals',
      salesSequencePayload
        ? 'Sales-agent sequence recommendation is available for this account.'
        : (latestAsset ? `Latest generated asset: ${latestAsset.content_type}` : 'No live sequence recommendation available.'),
      salesSequencePayload ? 'success' : 'default',
    ),
    card(
      'Account Analysis',
      salesAnalysisPayload
        ? summarizeList([
            safeString((salesAnalysisPayload as Record<string, unknown>).status),
            safeString(((salesAnalysisPayload as Record<string, unknown>).analysis as Record<string, unknown> | undefined)?.size),
          ]) || 'sales-agent account analysis is available.'
        : 'No live sales-agent account analysis available.',
      salesAnalysisPayload ? 'success' : 'default',
    ),
  ];
  result.nextActions = [
    committeePayload ? 'Draft outreach with committee-aware language' : 'Build committee before broad outreach',
    companyContactsPayload ? 'Open same-company contacts and pick the strongest operator lane' : 'Find more same-company contacts',
    latestEmail?.reply_count ? 'Lean into the active thread context' : 'Generate a new one-pager with live intel',
  ];
  result.freshness = buildAgentActionFreshness({
    fetchedAt: result.freshness.fetchedAt,
    source: 'live',
    dimensions: {
      summary: buildFreshnessDimension({
        key: 'summary',
        label: 'Research summary',
        updatedAt: researchPayload || workbenchPayload ? result.freshness.fetchedAt : null,
        fetchedAt: result.freshness.fetchedAt,
        source: 'live',
      }),
      signals: buildFreshnessDimension({
        key: 'signals',
        label: 'Signals',
        updatedAt: latestEmail?.sent_at ?? latestAsset?.created_at ?? result.freshness.fetchedAt,
        fetchedAt: result.freshness.fetchedAt,
        source: latestEmail?.sent_at || latestAsset?.created_at ? 'local' : 'live',
      }),
      contacts: buildFreshnessDimension({
        key: 'contacts',
        label: 'Contacts',
        updatedAt: latestContactEnrichedAt,
        fetchedAt: result.freshness.fetchedAt,
        source: 'local',
      }),
      generated_content: buildFreshnessDimension({
        key: 'generated_content',
        label: 'Generated content',
        updatedAt: latestAsset?.created_at ?? null,
        fetchedAt: result.freshness.fetchedAt,
        source: 'local',
      }),
    },
  });
  result.data = {
    account: {
      name: accountBundle.account?.name ?? target.accountName,
      vertical: accountBundle.account?.vertical ?? null,
      whyNow: accountBundle.account?.why_now ?? null,
      primoAngle: accountBundle.account?.primo_angle ?? null,
    },
    research: researchPayload,
    workbench: workbenchPayload,
    committee: committeePayload,
    companyContacts: companyContactsPayload,
    salesContacts,
    pipeline: pipelinePayload,
    salesAgent: {
      sequenceRecommendation: salesSequencePayload,
      accountAnalysis: salesAnalysisPayload,
      decisionMakers: salesDecisionMakersPayload,
    },
    latestEmail,
    latestAsset,
    contactFreshness: {
      latestEnrichedAt: latestContactEnrichedAt?.toISOString() ?? null,
      mappedContactCount: personas.length,
      liveContactCount,
    },
    depth,
  };

  if (SOURCE_EVIDENCE_INGEST_ENABLED) {
    try {
      const providerStatus = {
        clawd: accountResearch.status === 'fulfilled' ? 'healthy' : 'unavailable',
        sales_agent: companyContacts.status === 'fulfilled' || salesDecisionMakers.status === 'fulfilled' ? 'healthy' : 'unavailable',
      };
      const providerErrors = {
        ...(accountResearch.status === 'rejected' ? { clawd: String(accountResearch.reason) } : {}),
        ...(companyContacts.status === 'rejected' ? { company_contacts: String(companyContacts.reason) } : {}),
        ...(salesDecisionMakers.status === 'rejected' ? { sales_agent: String(salesDecisionMakers.reason) } : {}),
      };
      const runStatus = Object.keys(providerErrors).length === 0
        ? 'succeeded'
        : Object.keys(providerErrors).length >= 2
          ? 'failed'
          : 'partial';

      const run = await createResearchRun(prisma, {
        accountName: target.accountName,
        status: runStatus,
        runKey: `content_context:${scopedAccountName}:${Date.now()}`,
        providerStatus,
        errorMap: providerErrors,
        startedAt: new Date(Date.now() - 2_000),
        completedAt: new Date(),
      });

      const evidenceClaims = result.cards
        .filter((entry) => entry.body && !/no .*available/i.test(entry.body))
        .slice(0, 8)
        .map((entry) => ({
          accountName: scopedAccountName,
          claim: `${entry.title}: ${entry.body}`.slice(0, 1200),
          claimHash: hashEvidenceClaim(`${entry.title}:${entry.body}`),
          sourceUrl: `https://yardflow.local/agent-actions/content-context/${encodeURIComponent(scopedAccountName)}`,
          sourceTitle: `Content context ${entry.title}`,
          sourceType: 'local',
          provider: 'agent_actions',
          observedAt: new Date(),
          deterministicKey: `content_context:${scopedAccountName}:${hashEvidenceClaim(entry.title).slice(0, 12)}`,
          metadata: {
            tone: entry.tone ?? 'default',
            status: result.status,
          },
        }));

      if (evidenceClaims.length > 0) {
        await upsertEvidenceRecords(prisma, run.id, evidenceClaims);
      }

      result.data = {
        ...(result.data as Record<string, unknown>),
        evidence: {
          runId: run.id,
          status: runStatus,
          providerStatus,
          claimCount: evidenceClaims.length,
        },
      };
    } catch {
      // Evidence ingest is best-effort and must not break intel refresh.
    }
  }

  if (!result.summary) {
    result.status = 'partial';
    result.summary = `Assembled local context for ${scopedAccountName}, but live sidecar research is limited right now.`;
  }

  return result;
}

async function runActionUncached(request: AgentActionRequest, target: ResolvedTarget): Promise<AgentActionResult> {
  const { clawd, salesAgent } = getConfiguredAgentClients();
  const company = target.company ?? target.accountName;
  const email = target.email;

  switch (request.action) {
    case 'account_research': {
      if (!company) {
        return { ...baseResult(request.action, 'clawd'), status: 'error', summary: 'Company is required for account research.' };
      }
      if (!clawd && !salesAgent) {
        return { ...baseResult(request.action, 'local'), status: 'partial', summary: 'Clawd is not configured. Local context is available.' };
      }
      const [clawdPayload, salesPayload] = await Promise.allSettled([
        clawd?.getAccountResearch(company, request.refresh),
        salesAgent?.analyzeCompany(company, target.personaTitle),
      ]);
      const payload = clawdPayload.status === 'fulfilled' ? clawdPayload.value : null;
      const sales = salesPayload.status === 'fulfilled' ? salesPayload.value : null;
      const result = baseResult(request.action, payload ? 'clawd' : sales ? 'sales_agent' : 'local');
      result.status = payload?.intel || payload?.workbench || sales ? 'ok' : 'partial';
      result.summary =
        safeString(payload?.intel?.summary) ||
        safeString(payload?.workbench?.summary) ||
        safeString(((sales as Record<string, unknown> | null)?.analysis as Record<string, unknown> | undefined)?.summary) ||
        `Research fetched for ${company}.`;
      result.cards = [
        card('Research', previewJson(payload?.intel) || 'No TAM enrichment payload returned.', payload?.intel ? 'success' : 'warning'),
        card('Workbench', previewJson(payload?.workbench) || 'No account workbench payload returned.', payload?.workbench ? 'success' : 'warning'),
        card('Sales-Agent Analysis', previewJson(sales) || 'No sales-agent analysis returned.', sales ? 'success' : 'warning'),
      ];
      result.data = {
        clawd: payload,
        salesAgent: sales,
      };
      result.nextActions = ['Generate with live intel', 'Find more contacts', 'Build committee'];
      return result;
    }
    case 'contact_dossier': {
      if (!email || !clawd) {
        return { ...baseResult(request.action, clawd ? 'clawd' : 'local'), status: 'error', summary: 'Contact email and Clawd configuration are required for dossier lookup.' };
      }
      const payload = await clawd.getContactDossier(email);
      const contactPayload = ((payload as Record<string, unknown>).contact ?? {}) as Record<string, unknown>;
      const dossierPayload = ((payload as Record<string, unknown>).dossier ?? {}) as Record<string, unknown>;
      const historyPayload = Array.isArray((payload as Record<string, unknown>).history)
        ? (((payload as Record<string, unknown>).history as Array<unknown>)[0] ?? {}) as Record<string, unknown>
        : {};
      const result = baseResult(request.action, 'clawd');
      result.summary = `Loaded live dossier for ${email}.`;
      result.cards = [
        card('Contact', summarizeList([safeString(contactPayload.name), safeString(contactPayload.title), safeString(contactPayload.company)]) || email, 'success'),
        card('History', summarizeList([safeString(dossierPayload.summary), safeString(historyPayload.summary)]) || 'History is available in the raw dossier payload.', 'default'),
      ];
      result.data = payload;
      result.nextActions = ['Draft outreach from dossier', 'Enrich this contact', 'Find same-company contacts'];
      return result;
    }
    case 'company_contacts': {
      if (!company || (!clawd && !salesAgent)) {
        return { ...baseResult(request.action, clawd ? 'clawd' : salesAgent ? 'sales_agent' : 'local'), status: 'error', summary: 'Company and a live sidecar configuration are required for company contact lookup.' };
      }
      const [clawdPayload, salesPayload] = await Promise.allSettled([
        clawd?.getCompanyContacts(company),
        salesAgent?.findDecisionMakers(company),
      ]);
      const companyPayload = clawdPayload.status === 'fulfilled' ? (clawdPayload.value as Record<string, unknown>) : null;
      const decisionMakers = salesPayload.status === 'fulfilled'
        ? extractArrayRecords((salesPayload.value as Record<string, unknown>).decision_makers)
        : [];
      const salesContacts = await getSalesAgentCompanyContacts(salesAgent, company, companyPayload, request.limit ?? 10);
      const contacts = dedupeContacts([...salesContacts, ...decisionMakers]);
      const result = baseResult(request.action, contacts.length > 0 ? 'sales_agent' : companyPayload ? 'clawd' : 'local');
      result.summary = contacts.length > 0
        ? `Found ${contacts.length} live contacts for ${company}.`
        : companyPayload
          ? `Loaded live company context for ${company}, but no external contacts were returned.`
          : `No live contacts found for ${company}.`;
      result.cards = [
        card(
          'Top Contacts',
          contacts.length
            ? summarizeList(contacts.slice(0, 4).map((contact) => safeString(contact.name) || safeString(contact.full_name) || safeString(contact.email)))
            : 'No live company contacts returned.',
          contacts.length ? 'success' : 'warning',
        ),
        card(
          'Company Context',
          companyPayload ? summarizeList([safeString(companyPayload.name), safeString(companyPayload.domain), safeString(companyPayload.industry)], 3) || previewJson(companyPayload) : 'No live company profile returned.',
          companyPayload ? 'default' : 'warning',
        ),
      ];
      result.data = {
        company: companyPayload,
        contacts,
        decisionMakers,
      };
      result.nextActions = ['Pick strongest operator and draft outreach', 'Build committee'];
      return result;
    }
    case 'committee_refresh': {
      if (!company || !clawd) {
        return { ...baseResult(request.action, clawd ? 'clawd' : 'local'), status: 'error', summary: 'Company and Clawd configuration are required for committee build.' };
      }
      const payload = await clawd.buildCommittee(company);
      const result = baseResult(request.action, 'clawd');
      result.summary = `Committee refreshed for ${company}.`;
      result.cards = [
        card('Decision Maker', safeString((payload as Record<string, unknown>).decision_maker) || 'No decision maker identified yet.', (payload as Record<string, unknown>).decision_maker ? 'success' : 'warning'),
        card('Coverage', `Members: ${String((payload as Record<string, unknown>).member_count ?? 0)}`, 'default'),
      ];
      result.data = payload;
      result.nextActions = ['Draft outreach', 'Find more contacts', 'Generate one-pager with live intel'];
      return result;
    }
    case 'prospect_discover': {
      const limit = request.limit ?? 10;
      const result = baseResult(request.action, clawd ? 'clawd' : salesAgent ? 'sales_agent' : 'local');
      const errors: string[] = [];
      if (clawd) {
        try {
          const payload = await clawd.discoverProspects(limit);
          const prospects = Array.isArray(payload.prospects) ? payload.prospects as Array<Record<string, unknown>> : [];
          result.summary = `Discovered ${prospects.length} prospect-ready accounts.`;
          result.cards = [
            card('Top Prospects', summarizeList(prospects.slice(0, 4).map((prospect) => safeString(prospect.company) || safeString(prospect.name))) || 'No prospects returned.', prospects.length ? 'success' : 'warning'),
          ];
          result.data = payload;
          result.nextActions = ['Open top account', 'Build committee', 'Generate one-pager'];
          return result;
        } catch (error) {
          errors.push(error instanceof Error ? error.message : String(error));
        }
      }
      if (salesAgent && company) {
        const payload = await salesAgent.findDecisionMakers(company);
        const prospects = Array.isArray((payload as Record<string, unknown>).decision_makers)
          ? ((payload as Record<string, unknown>).decision_makers as Array<Record<string, unknown>>)
          : [];
        result.provider = 'sales_agent';
        result.summary = `Found ${prospects.length} likely decision makers at ${company}.`;
        result.cards = [
          card('Decision Makers', summarizeList(prospects.slice(0, 4).map((prospect) => safeString(prospect.name) || safeString(prospect.email))) || 'No decision makers returned.', prospects.length ? 'success' : 'warning'),
        ];
        result.data = {
          ...payload,
          upstreamErrors: errors,
        };
        result.nextActions = ['Draft outreach', 'Generate one-pager', 'Enrich the strongest contact'];
        return result;
      }
      result.status = 'partial';
      result.summary = errors.length > 0 ? errors.join(' ') : 'Prospect discovery is unavailable because no sidecar service is configured.';
      return result;
    }
    case 'contact_enrich': {
      if (!email) {
        return { ...baseResult(request.action, 'local'), status: 'error', summary: 'Contact email is required for enrichment.' };
      }
      const result = baseResult(request.action, salesAgent ? 'sales_agent' : clawd ? 'clawd' : 'local');
      const errors: string[] = [];
      if (salesAgent) {
        try {
          const payload = await salesAgent.enrichContact(target);
          result.summary = `sales-agent enrichment loaded for ${email}.`;
          result.cards = [card('Enrichment', previewJson(payload), 'success')];
          result.data = payload;
          result.nextActions = ['Apply enrichment', 'Draft outreach'];
          return result;
        } catch (error) {
          errors.push(error instanceof Error ? error.message : String(error));
        }
      }
      if (clawd) {
        try {
          const payload = await clawd.enrichContact(email);
          result.provider = 'clawd';
          result.summary = `Clawd enrichment loaded for ${email}.`;
          result.cards = [card('Enrichment', previewJson(payload), 'success')];
          result.data = payload;
          result.nextActions = ['Apply enrichment', 'Draft outreach'];
          return result;
        } catch (error) {
          errors.push(error instanceof Error ? error.message : String(error));
        }
      }
      result.status = 'partial';
      result.summary = errors.length ? errors.join(' ') : `No live enrichment service is configured for ${email}.`;
      return result;
    }
    case 'pipeline_snapshot': {
      if (!clawd) {
        return { ...baseResult(request.action, 'local'), status: 'partial', summary: 'Clawd is not configured for pipeline snapshots.' };
      }
      const payload = await clawd.getPipelineSnapshot(request.limit ?? 50);
      const result = baseResult(request.action, 'clawd');
      result.status = payload.pipeline || payload.funnel ? 'ok' : 'partial';
      result.summary = payload.pipeline ? 'Loaded live pipeline snapshot.' : 'Pipeline snapshot is partially unavailable.';
      result.cards = [
        card('Pipeline', previewJson(payload.pipeline), payload.pipeline ? 'success' : 'warning'),
        card('Funnel', previewJson(payload.funnel), payload.funnel ? 'success' : 'warning'),
      ];
      result.data = payload;
      result.nextActions = ['Refresh account intel', 'Generate one-pager with live intel'];
      return result;
    }
    case 'draft_outreach': {
      const contentContext = target.accountName
        ? await runContentContext(target, request.refresh, request.depth, request.limit ?? 10)
        : null;
      const summary = contentContext?.summary;
      const generationInput = buildGenerationInputContract(contentContext, 'scorecard_reply');
      const result = baseResult(request.action, salesAgent ? 'sales_agent' : clawd ? 'clawd' : 'local');
      const errors: string[] = [];
      if (salesAgent) {
        try {
          const payload = await salesAgent.draftOutreach(target);
          const draftPayload = payload as Record<string, unknown>;
          const draftBody = safeString(draftPayload.body) || safeString((draftPayload.draft as Record<string, unknown> | undefined)?.body);
          const sourceAttribution = buildSourceBackedContractFromGeneratedText({
            content: draftBody,
            accountName: target.accountName ?? '',
            personaName: target.personaName,
            generationInput,
            citationThreshold: 1,
          });
          result.summary = `sales-agent draft is ready${target.accountName ? ` for ${target.accountName}` : ''}.`;
          result.cards = [card('Draft', previewJson(payload), 'success')];
          result.data = { draft: payload, contentContext, sourceAttribution };
          result.nextActions = ['Open compose and send', 'Regenerate with live intel'];
          return result;
        } catch (error) {
          errors.push(error instanceof Error ? error.message : String(error));
        }
      }
      if (clawd) {
        try {
          const payload = await clawd.draftOutreach(target);
          const draftPayload = payload as Record<string, unknown>;
          const draftBody = safeString(draftPayload.body) || safeString((draftPayload.draft as Record<string, unknown> | undefined)?.body);
          const sourceAttribution = buildSourceBackedContractFromGeneratedText({
            content: draftBody,
            accountName: target.accountName ?? '',
            personaName: target.personaName,
            generationInput,
            citationThreshold: 1,
          });
          result.provider = 'clawd';
          result.summary = `Clawd draft is ready${target.accountName ? ` for ${target.accountName}` : ''}.`;
          result.cards = [card('Draft', previewJson(payload), 'success')];
          result.data = { draft: payload, contentContext, sourceAttribution };
          result.nextActions = ['Open compose and send', 'Regenerate with live intel'];
          return result;
        } catch (error) {
          errors.push(error instanceof Error ? error.message : String(error));
        }
      }
      try {
        const fallback = await buildLocalDraftFallback(target, summary);
        const sourceAttribution = buildSourceBackedContractFromGeneratedText({
          content: fallback.body,
          accountName: target.accountName ?? '',
          personaName: target.personaName,
          generationInput,
          citationThreshold: 1,
        });
        result.provider = 'local';
        result.summary = `Generated a local fallback draft${target.accountName ? ` for ${target.accountName}` : ''}.`;
        result.cards = [
          card('Subject', fallback.subject, 'success'),
          card('Body', fallback.body, 'default'),
        ];
        result.data = { draft: fallback, contentContext, errors, sourceAttribution };
        result.nextActions = ['Open compose and send', 'Generate one-pager with live intel'];
        return result;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
      result.status = 'error';
      result.summary = errors.join(' ') || 'Draft generation failed.';
      result.data = { contentContext };
      return result;
    }
    case 'sequence_recommendation': {
      const contentContext = target.accountName
        ? await runContentContext(target, request.refresh, request.depth, request.limit ?? 10)
        : null;
      const result = baseResult(request.action, salesAgent ? 'sales_agent' : 'local');
      const errors: string[] = [];
      if (salesAgent) {
        try {
          const payload = await salesAgent.getSequenceRecommendation({ ...target, limit: request.limit });
          result.summary = `sales-agent sequence recommendation is ready${target.accountName ? ` for ${target.accountName}` : ''}.`;
          result.cards = [card('Recommendation', previewJson(payload), 'success')];
          result.data = { recommendation: payload, contentContext };
          result.nextActions = ['Generate sequence', 'Draft first touch'];
          return result;
        } catch (error) {
          errors.push(error instanceof Error ? error.message : String(error));
        }
      }
      try {
        const fallback = await buildLocalSequenceFallback(target, contentContext?.summary);
        result.provider = 'local';
        result.summary = `Generated a local sequence recommendation${target.accountName ? ` for ${target.accountName}` : ''}.`;
        result.cards = [
          card('Suggested Subject', fallback.subject, 'success'),
          card('Suggested Opening', fallback.body, 'default'),
        ];
        result.data = { recommendation: fallback, contentContext, errors };
        result.nextActions = ['Generate sequence', 'Open compose'];
        return result;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
      result.status = 'error';
      result.summary = errors.join(' ') || 'Sequence recommendation failed.';
      result.data = { contentContext };
      return result;
    }
    case 'content_context':
      return runContentContext(target, request.refresh, request.depth, request.limit ?? 10);
    default:
      return { ...baseResult(request.action, 'local'), status: 'error', summary: 'Unsupported action.' };
  }
}

export async function runAgentAction(request: AgentActionRequest): Promise<AgentActionResult> {
  const resolvedTarget = await resolveTarget(request.target);
  const enrichedRequest: AgentActionRequest = {
    ...request,
    target: {
      accountName: resolvedTarget.accountName,
      accountNames: resolvedTarget.accountNames,
      company: resolvedTarget.company,
      email: resolvedTarget.email,
      personaId: resolvedTarget.personaId,
    },
  };
  const cacheKey = buildAgentActionCacheKey(enrichedRequest);
  const ttlMs = getAgentActionTtlMs(request.action);
  const cached = await readCachedAgentAction(cacheKey);

  if (!request.refresh && cached && isFresh(cached.savedAt, ttlMs)) {
    return maybeSanitizeResult(request.action, applyFreshness(cached.result, 'cache', false));
  }

  try {
    const liveResult = await runActionUncached(request, resolvedTarget);
    const sanitizedResult = maybeSanitizeResult(request.action, liveResult);
    await writeCachedAgentAction(cacheKey, sanitizedResult);
    await recordAgentActivity(resolvedTarget.accountName, request.action, sanitizedResult.summary);
    return sanitizedResult;
  } catch (error) {
    if (cached) {
      return maybeSanitizeResult(request.action, applyFreshness(cached.result, 'cache', true));
    }
    const result = baseResult(request.action, 'local');
    result.status = 'error';
    result.summary = error instanceof Error ? error.message : 'Agent action failed.';
    return result;
  }
}

export function listAgentActionCapabilities(): AgentActionCapability[] {
  const { clawd, salesAgent } = getConfiguredAgentClients();
  const clawdConfigured = Boolean(clawd);
  const salesConfigured = Boolean(salesAgent);

  const preferredProvider = (action: AgentActionType): AgentActionCapability => {
    switch (action) {
      case 'contact_enrich':
      case 'draft_outreach':
      case 'sequence_recommendation':
        return {
          action,
          preferredProvider: salesConfigured ? 'sales_agent' : clawdConfigured ? 'clawd' : 'local',
          fallbackProvider: salesConfigured ? (clawdConfigured ? 'clawd' : 'local') : clawdConfigured ? 'local' : null,
          configured: salesConfigured || clawdConfigured,
        };
      case 'content_context':
        return {
          action,
          preferredProvider: 'local',
          fallbackProvider: clawdConfigured || salesConfigured ? 'clawd' : null,
          configured: true,
        };
      default:
        return {
          action,
          preferredProvider: clawdConfigured ? 'clawd' : 'local',
          fallbackProvider: clawdConfigured ? 'local' : null,
          configured: clawdConfigured,
        };
    }
  };

  const actions: AgentActionType[] = [
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
  ];

  return actions.map((action) => preferredProvider(action));
}
