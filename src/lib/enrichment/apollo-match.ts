import type { ApolloPerson } from '@/lib/enrichment/apollo-client';

export type ApolloMatchReason = 'email' | 'domain_name' | 'company_title' | 'none';

export type ApolloMatchResult = {
  person: ApolloPerson | null;
  score: number;
  reason: ApolloMatchReason;
};

export type ApolloMatchInput = {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function domainFromEmail(email: string): string {
  const [, domain = ''] = normalize(email).split('@');
  return domain;
}

function domainFromWebsite(url: string): string {
  return normalize(url).replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] ?? '';
}

function companyRoot(company: string): string {
  return normalize(company).replace(/[^a-z0-9]/g, '');
}

export function matchApolloPerson(input: ApolloMatchInput, candidates: ApolloPerson[]): ApolloMatchResult {
  const email = normalize(input.email);
  const domain = domainFromEmail(email);
  const first = normalize(input.firstName);
  const last = normalize(input.lastName);
  const company = companyRoot(input.company);
  const title = normalize(input.title);

  let best: ApolloMatchResult = { person: null, score: 0, reason: 'none' };

  for (const person of candidates) {
    const personEmail = normalize(person.email ?? '');
    const personDomainFromEmail = personEmail
      ? domainFromEmail(personEmail)
      : domainFromWebsite(person.organization?.website_url ?? '');
    const personDomainFromWebsite = domainFromWebsite(person.organization?.website_url ?? '');
    const personFirst = normalize(person.first_name ?? '');
    const personLast = normalize(person.last_name ?? '');
    const personCompany = companyRoot(person.organization?.name ?? '');
    const personTitle = normalize(person.title ?? '');

    if (personEmail && personEmail === email) {
      return { person, score: 100, reason: 'email' };
    }

    let score = 0;
    const normalizedInputDomain = domain.replace(/^www\./, '');
    if (
      normalizedInputDomain &&
      (
        (personDomainFromEmail && personDomainFromEmail.includes(normalizedInputDomain)) ||
        (personDomainFromWebsite && personDomainFromWebsite.includes(normalizedInputDomain))
      )
    ) score += 40;
    if (first && personFirst && first === personFirst) score += 20;
    if (last && personLast && last === personLast) score += 25;
    if (company && personCompany && (company.includes(personCompany) || personCompany.includes(company))) score += 10;
    if (title && personTitle && title.split(' ').some((token) => token.length > 3 && personTitle.includes(token))) score += 5;

    if (score > best.score) {
      best = {
        person,
        score,
        reason: score >= 80 ? 'domain_name' : 'company_title',
      };
    }
  }

  if (best.score < 60) return { person: null, score: best.score, reason: 'none' };
  return best;
}
