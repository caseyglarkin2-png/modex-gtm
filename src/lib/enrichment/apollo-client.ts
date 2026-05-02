import { z } from 'zod';
import { ApolloSearchResponseFixtureSchema, ApolloPersonFixtureSchema } from '@/lib/enrichment/contracts';

export type ApolloPerson = z.infer<typeof ApolloPersonFixtureSchema>;

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
