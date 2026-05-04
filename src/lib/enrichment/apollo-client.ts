import { z } from 'zod';
import { ApolloSearchResponseFixtureSchema, ApolloPersonFixtureSchema } from '@/lib/enrichment/contracts';

export type ApolloPerson = z.infer<typeof ApolloPersonFixtureSchema>;

export type ApolloSavedContact = ApolloPerson & {
  contact_id?: string;
  name?: string;
  organization_name?: string;
  company?: string;
  phone_numbers?: Array<{ raw_number?: string; sanitized_number?: string }>;
  linkedin_url?: string;
};

export type ApolloLabel = {
  id: string;
  name: string;
  modality?: 'contacts' | 'accounts' | string;
  cached_count?: number;
};

export type ApolloSavedAccount = {
  id: string;
  name: string;
  website_url?: string | null;
  domain?: string | null;
  industry?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  estimated_num_employees?: number | null;
};

function getApolloApiKey(): string | null {
  return (process.env.APOLLO_API_KEY || process.env.CODEX_APOLLO_API_KEY_MASTER || '').trim() || null;
}

function apolloHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': apiKey,
  };
}

export function isApolloConfigured(): boolean {
  return Boolean(getApolloApiKey());
}

export async function searchApolloPeople(query: string): Promise<ApolloPerson[]> {
  const apiKey = getApolloApiKey();
  if (!apiKey) return [];

  const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
    method: 'POST',
    headers: apolloHeaders(apiKey),
    body: JSON.stringify({
      q_organization_domains_list: [],
      q_keywords: query,
      page: 1,
      per_page: 25,
    }),
  });

  if (!response.ok) {
    throw new Error(`Apollo search failed (${response.status})`);
  }

  const json = await response.json();
  const parsed = ApolloSearchResponseFixtureSchema.parse(json);
  return parsed.people;
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeSavedContact(record: unknown): ApolloSavedContact | null {
  if (!record || typeof record !== 'object') return null;
  const raw = record as Record<string, unknown>;
  const id = readString(raw, 'id') ?? readString(raw, 'contact_id');
  if (!id) return null;
  const name = readString(raw, 'name');
  const firstName = readString(raw, 'first_name') ?? name?.split(/\s+/)[0] ?? 'Unknown';
  const lastName = readString(raw, 'last_name') ?? name?.split(/\s+/).slice(1).join(' ') ?? '';
  const organization = raw.organization && typeof raw.organization === 'object'
    ? raw.organization as ApolloSavedContact['organization']
    : undefined;

  return {
    ...raw,
    id,
    contact_id: readString(raw, 'contact_id'),
    first_name: firstName,
    last_name: lastName,
    name,
    email: readString(raw, 'email'),
    title: readString(raw, 'title'),
    organization,
    organization_name: readString(raw, 'organization_name'),
    company: readString(raw, 'company'),
    linkedin_url: readString(raw, 'linkedin_url'),
    confidence: typeof raw.confidence === 'number' ? raw.confidence : undefined,
  } as ApolloSavedContact;
}

export async function listApolloLabels(): Promise<ApolloLabel[]> {
  const apiKey = getApolloApiKey();
  if (!apiKey) return [];

  const response = await fetch('https://api.apollo.io/api/v1/labels', {
    headers: { 'X-Api-Key': apiKey, accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Apollo labels failed (${response.status})`);

  const json = await response.json() as unknown;
  const records = Array.isArray(json)
    ? json
    : (json && typeof json === 'object' && Array.isArray((json as { labels?: unknown[] }).labels))
      ? (json as { labels: unknown[] }).labels
      : [];

  const labels: ApolloLabel[] = [];
  for (const record of records) {
      if (!record || typeof record !== 'object') continue;
      const raw = record as Record<string, unknown>;
      const id = readString(raw, 'id') ?? readString(raw, '_id') ?? readString(raw, 'key');
      const name = readString(raw, 'name');
      if (!id || !name) continue;
      labels.push({
        id,
        name,
        modality: readString(raw, 'modality'),
        cached_count: typeof raw.cached_count === 'number' ? raw.cached_count : undefined,
      });
  }

  return labels.sort((left, right) => (right.cached_count ?? 0) - (left.cached_count ?? 0));
}

export async function searchApolloSavedContacts(input: {
  contactLabelIds?: string[];
  qKeywords?: string;
  page?: number;
  perPage?: number;
}): Promise<{ contacts: ApolloSavedContact[]; page: number; perPage: number; totalEntries: number }> {
  const apiKey = getApolloApiKey();
  if (!apiKey) return { contacts: [], page: input.page ?? 1, perPage: input.perPage ?? 100, totalEntries: 0 };

  const page = input.page ?? 1;
  const perPage = Math.min(Math.max(input.perPage ?? 100, 1), 100);
  const body = {
    page,
    per_page: perPage,
    sort_by_field: 'contact_updated_at',
    sort_ascending: false,
    ...(input.qKeywords?.trim() ? { q_keywords: input.qKeywords.trim() } : {}),
    ...(input.contactLabelIds?.length ? { contact_label_ids: input.contactLabelIds } : {}),
  };

  const response = await fetch('https://api.apollo.io/api/v1/contacts/search', {
    method: 'POST',
    headers: apolloHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Apollo contacts search failed (${response.status})`);
  }

  const json = await response.json() as {
    contacts?: unknown[];
    people?: unknown[];
    pagination?: { page?: number; per_page?: number; total_entries?: number };
  };
  const records = Array.isArray(json.contacts) ? json.contacts : Array.isArray(json.people) ? json.people : [];
  const contacts = records
    .map(normalizeSavedContact)
    .filter((contact): contact is ApolloSavedContact => Boolean(contact));

  return {
    contacts,
    page: json.pagination?.page ?? page,
    perPage: json.pagination?.per_page ?? perPage,
    totalEntries: json.pagination?.total_entries ?? contacts.length,
  };
}

export async function searchApolloSavedAccounts(input: {
  accountLabelIds?: string[];
  page?: number;
  perPage?: number;
}): Promise<{ accounts: ApolloSavedAccount[]; page: number; perPage: number; totalEntries: number }> {
  const apiKey = getApolloApiKey();
  if (!apiKey) return { accounts: [], page: input.page ?? 1, perPage: input.perPage ?? 100, totalEntries: 0 };

  const page = input.page ?? 1;
  const perPage = Math.min(Math.max(input.perPage ?? 100, 1), 100);
  const response = await fetch('https://api.apollo.io/api/v1/accounts/search', {
    method: 'POST',
    headers: apolloHeaders(apiKey),
    body: JSON.stringify({
      page,
      per_page: perPage,
      ...(input.accountLabelIds?.length ? { account_label_ids: input.accountLabelIds } : {}),
    }),
  });
  if (!response.ok) throw new Error(`Apollo accounts search failed (${response.status})`);

  const json = await response.json() as {
    accounts?: Array<Record<string, unknown>>;
    pagination?: { page?: number; per_page?: number; total_entries?: number };
  };
  const accounts = (json.accounts ?? [])
    .map((record) => ({
      id: String(record.id ?? ''),
      name: String(record.name ?? ''),
      website_url: readString(record, 'website_url') ?? null,
      domain: readString(record, 'domain') ?? null,
      industry: readString(record, 'industry') ?? null,
      phone: readString(record, 'phone') ?? null,
      linkedin_url: readString(record, 'linkedin_url') ?? null,
      estimated_num_employees: typeof record.estimated_num_employees === 'number' ? record.estimated_num_employees : null,
    }))
    .filter((account) => account.id && account.name);

  return {
    accounts,
    page: json.pagination?.page ?? page,
    perPage: json.pagination?.per_page ?? perPage,
    totalEntries: json.pagination?.total_entries ?? accounts.length,
  };
}
