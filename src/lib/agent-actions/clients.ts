import type { AgentActionTarget } from '@/lib/agent-actions/types';

type EnrichedAgentActionTarget = AgentActionTarget & {
  personaName?: string;
  personaTitle?: string;
};

function withBearer(headers: HeadersInit | undefined, token: string | undefined) {
  return {
    Accept: 'application/json',
    ...(headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function withApiKey(headers: HeadersInit | undefined, token: string | undefined) {
  return {
    Accept: 'application/json',
    ...(headers ?? {}),
    ...(token ? { 'X-Api-Key': token } : {}),
  };
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { raw: text };
  }
}

async function requestJson(baseUrl: string, path: string, init?: RequestInit) {
  const response = await fetch(new URL(path, baseUrl), init);
  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error((payload.error as string | undefined) ?? `Request failed (${response.status})`);
  }
  return payload;
}

function companySlug(value: string) {
  return encodeURIComponent(value.trim().replace(/\s+/g, '_'));
}

function normalizeDomain(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .toLowerCase();
}

export class ClawdServiceClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token?: string,
  ) {}

  static fromEnv() {
    const baseUrl = process.env.CLAWD_CONTROL_PLANE_URL?.trim();
    if (!baseUrl) return null;
    return new ClawdServiceClient(baseUrl, process.env.CLAWD_CONTROL_PLANE_TOKEN?.trim());
  }

  async getHealth() {
    return requestJson(this.baseUrl, '/api/health', {
      headers: withBearer(undefined, this.token),
      cache: 'no-store',
    });
  }

  async getAccountResearch(company: string, refresh = false) {
    const params = new URLSearchParams({
      company,
      refresh: refresh ? '1' : '0',
    });
    const [intel, workbench] = await Promise.allSettled([
      requestJson(this.baseUrl, `/api/tam/enrich?${params.toString()}`, {
        headers: withBearer(undefined, this.token),
        cache: 'no-store',
      }),
      requestJson(this.baseUrl, `/api/account/workbench?company=${encodeURIComponent(company)}&force_refresh=${refresh ? '1' : '0'}`, {
        headers: withBearer(undefined, this.token),
        cache: 'no-store',
      }),
    ]);

    return {
      intel: intel.status === 'fulfilled' ? intel.value : null,
      workbench: workbench.status === 'fulfilled' ? workbench.value : null,
      errors: [intel, workbench]
        .filter((result) => result.status === 'rejected')
        .map((result) => (result as PromiseRejectedResult).reason instanceof Error ? (result as PromiseRejectedResult).reason.message : String((result as PromiseRejectedResult).reason)),
    };
  }

  async getContactDossier(email: string) {
    return requestJson(this.baseUrl, `/api/contacts/detail?email=${encodeURIComponent(email)}`, {
      headers: withBearer(undefined, this.token),
      cache: 'no-store',
    });
  }

  private async resolveCompanyDomain(company: string) {
    const candidate = normalizeDomain(company);
    if (candidate.includes('.') && !candidate.includes(' ')) {
      return candidate;
    }

    const workbench = await requestJson(this.baseUrl, `/api/account/workbench?company=${encodeURIComponent(company)}&force_refresh=0`, {
      headers: withBearer(undefined, this.token),
      cache: 'no-store',
    });
    const companyPayload = ((workbench.company ?? workbench.account ?? {}) as Record<string, unknown>);
    const domain = typeof companyPayload.domain === 'string' ? companyPayload.domain : '';
    if (!domain) {
      throw new Error(`Unable to resolve a company domain for ${company}.`);
    }
    return normalizeDomain(domain);
  }

  async getCompanyContacts(company: string) {
    const domain = await this.resolveCompanyDomain(company);
    return requestJson(this.baseUrl, `/api/contacts/company?domain=${encodeURIComponent(domain)}`, {
      headers: withBearer(undefined, this.token),
      cache: 'no-store',
    });
  }

  async getCommittee(company: string) {
    return requestJson(this.baseUrl, `/api/committees/${companySlug(company)}`, {
      headers: withBearer(undefined, this.token),
      cache: 'no-store',
    });
  }

  async buildCommittee(company: string) {
    return requestJson(this.baseUrl, `/api/committees/${companySlug(company)}/build`, {
      method: 'POST',
      headers: withBearer({ 'Content-Type': 'application/json' }, this.token),
      body: JSON.stringify({ enrich: true }),
      cache: 'no-store',
    });
  }

  async discoverProspects(limit: number) {
    return requestJson(this.baseUrl, '/api/prospects/discover', {
      method: 'POST',
      headers: withBearer({ 'Content-Type': 'application/json' }, this.token),
      body: JSON.stringify({ limit }),
      cache: 'no-store',
    });
  }

  async enrichContact(email: string) {
    return requestJson(this.baseUrl, `/api/contact/enrich?email=${encodeURIComponent(email)}`, {
      headers: withBearer(undefined, this.token),
      cache: 'no-store',
    });
  }

  async getPipelineSnapshot(limit: number) {
    const [pipeline, funnel] = await Promise.allSettled([
      requestJson(this.baseUrl, `/api/pipeline?limit=${limit}`, {
        headers: withBearer(undefined, this.token),
        cache: 'no-store',
      }),
      requestJson(this.baseUrl, '/api/pipeline/funnel', {
        headers: withBearer(undefined, this.token),
        cache: 'no-store',
      }),
    ]);

    return {
      pipeline: pipeline.status === 'fulfilled' ? pipeline.value : null,
      funnel: funnel.status === 'fulfilled' ? funnel.value : null,
      errors: [pipeline, funnel]
        .filter((result) => result.status === 'rejected')
        .map((result) => (result as PromiseRejectedResult).reason instanceof Error ? (result as PromiseRejectedResult).reason.message : String((result as PromiseRejectedResult).reason)),
    };
  }

  async draftOutreach(target: AgentActionTarget) {
    return requestJson(this.baseUrl, '/api/outreach/draft', {
      method: 'POST',
      headers: withBearer({ 'Content-Type': 'application/json' }, this.token),
      body: JSON.stringify({
        email: target.email,
        company: target.company ?? target.accountName,
        contact: undefined,
        campaign: process.env.CLAWD_DEFAULT_CAMPAIGN ?? 'yardflow',
        use_ai: true,
      }),
      cache: 'no-store',
    });
  }
}

export class SalesAgentClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token?: string,
  ) {}

  static fromEnv() {
    const baseUrl = process.env.SALES_AGENT_BASE_URL?.trim();
    if (!baseUrl) return null;
    return new SalesAgentClient(baseUrl, process.env.SALES_AGENT_API_KEY?.trim());
  }

  private request(path: string, init?: RequestInit) {
    return requestJson(this.baseUrl, path, {
      ...init,
      headers: withApiKey(init?.headers, this.token),
      cache: 'no-store',
    });
  }

  async getHealth() {
    const healthPath = process.env.SALES_AGENT_HEALTH_PATH || '/health';
    return this.request(healthPath);
  }

  async enrichContact(target: EnrichedAgentActionTarget) {
    const path = process.env.SALES_AGENT_CONTACT_ENRICH_PATH || '/api/enrichment/contact';
    const email = target.email;
    if (!email) throw new Error('Contact email is required for sales-agent enrichment.');
    const [firstName = '', ...rest] = (target.personaName ?? '').trim().split(/\s+/);
    const lastName = rest.join(' ');
    return this.request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        company: target.company ?? target.accountName ?? '',
        job_title: target.personaTitle ?? '',
      }),
    });
  }

  async draftOutreach(target: EnrichedAgentActionTarget) {
    const path = process.env.SALES_AGENT_DRAFT_OUTREACH_PATH || '/api/llm/draft-email';
    return this.request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_name: target.personaName ?? target.email ?? 'Operator',
        recipient_company: target.company ?? target.accountName ?? 'Unknown Account',
        recipient_role: target.personaTitle ?? null,
        purpose: process.env.SALES_AGENT_DEFAULT_PURPOSE ?? 'Earn a reply with a crisp, operator-grade outreach note and offer the short scorecard if useful.',
        thread_context: process.env.SALES_AGENT_DEFAULT_THREAD_CONTEXT ?? null,
        voice_style: process.env.SALES_AGENT_DEFAULT_VOICE_STYLE ?? 'concise, confident, practical, operator-led, use we not I, no meeting ask on first touch',
      }),
    });
  }

  async getSequenceRecommendation(target: EnrichedAgentActionTarget & { limit?: number }) {
    const path = process.env.SALES_AGENT_SEQUENCE_RECOMMENDATION_PATH || '/api/campaigns/generate-preview';
    return this.request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_type: 'outbound',
        goal_type: 'meetings',
        goal_target: Math.min(target.limit ?? 5, 100),
        contact_sample: {
          company: target.company ?? target.accountName ?? '',
          name: target.personaName ?? '',
          title: target.personaTitle ?? '',
          email: target.email ?? '',
        },
        custom_instructions: process.env.SALES_AGENT_DEFAULT_CAMPAIGN
          ? `Campaign context: ${process.env.SALES_AGENT_DEFAULT_CAMPAIGN}. Default to low-friction scorecard/reply CTAs. Do not ask for meetings or dates on first touch.`
          : 'Default to low-friction scorecard/reply CTAs. Do not ask for meetings or dates on first touch.',
      }),
    });
  }

  async findDecisionMakers(company: string) {
    return this.request('/api/accounts/decision-makers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_name: company }),
    });
  }

  async analyzeCompany(company: string, contactTitle?: string) {
    return this.request('/api/accounts/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: company,
        contact_title: contactTitle ?? null,
      }),
    });
  }

  async searchContacts(query: string, limit = 10) {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
    });
    return this.request(`/api/contacts?${params.toString()}`);
  }
}

export function getConfiguredAgentClients() {
  return {
    clawd: ClawdServiceClient.fromEnv(),
    salesAgent: SalesAgentClient.fromEnv(),
  };
}
