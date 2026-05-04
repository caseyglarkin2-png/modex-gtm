import { z } from 'zod';
import { ApolloSearchResponseFixtureSchema, ApolloPersonFixtureSchema } from '@/lib/enrichment/contracts';

export type ApolloPerson = z.infer<typeof ApolloPersonFixtureSchema>;

export type ApolloSavedContact = ApolloPerson & {
  contact_id?: string;
  organization_name?: string;
  company?: string;
  phone_numbers?: Array<{ raw_number?: string; sanitized_number?: string }>;
  linkedin_url?: string;
};

function getApolloApiKey(): string | null {
  return process.env.APOLLO_API_KEY || process.env.CODEX_APOLLO_API_KEY_MASTER || null;
}

export function isApolloConfigured(): boolean {
  return Boolean(getApolloApiKey());
}

export async function searchApolloPeople(query: string): Promise<ApolloPerson[]> {
  const apiKey = getApolloApiKey();
  if (!apiKey) return [];

  const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
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
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
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
    .map((record) => ApolloPersonFixtureSchema.passthrough().safeParse(record))
    .filter((parsed): parsed is { success: true; data: ApolloSavedContact } => parsed.success)
    .map((parsed) => parsed.data);

  return {
    contacts,
    page: json.pagination?.page ?? page,
    perPage: json.pagination?.per_page ?? perPage,
    totalEntries: json.pagination?.total_entries ?? contacts.length,
  };
}
