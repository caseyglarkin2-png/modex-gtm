import { slugify } from '@/lib/data';
import { getMicrositeUrl } from '@/lib/site-url';
import { getAccountMicrositeData } from './accounts';

export interface EnsureMicrositeResult {
  slug: string;
  url: string;
  ready: boolean;
  personSlug?: string;
}

export function ensureMicrositeForAccount(accountName: string, personName?: string): EnsureMicrositeResult {
  const slug = slugify(accountName);
  const personSlug = personName ? slugify(personName) : undefined;
  const ready = Boolean(getAccountMicrositeData(slug));

  return {
    slug,
    url: getMicrositeUrl(slug, personSlug),
    ready,
    personSlug,
  };
}
