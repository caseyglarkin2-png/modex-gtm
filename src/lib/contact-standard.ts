export const CONTACT_STANDARD_VERSION = '2026-03-28';

export const CONTACT_STANDARD = {
  minQualityScoreForSend: 80,
  minEmailConfidenceForSend: 70,
  minLinkedInConfidenceForSend: 50,
  requiredFields: ['name', 'title', 'account_name', 'company_domain'],
} as const;

export type ContactQualityBand = 'A' | 'B' | 'C' | 'D';

export interface ContactQualityInput {
  name: string;
  title?: string | null;
  accountName: string;
  email?: string | null;
  companyDomain?: string | null;
  linkedinUrl?: string | null;
  sourceUrl?: string | null;
  sourceEvidenceCount?: number;
}

export interface ContactQualityResult {
  score: number;
  band: ContactQualityBand;
  isReady: boolean;
  emailConfidence: number;
  linkedinConfidence: number;
}

export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitName(name: string): { firstName: string; lastName: string } {
  const cleaned = name.trim().replace(/\s+/g, ' ');
  if (!cleaned) return { firstName: '', lastName: '' };

  const parts = cleaned.split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
  return { firstName, lastName };
}

export function normalizeTitle(title?: string | null): string {
  return (title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s/&-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseDomainFromEmail(email?: string | null): string | null {
  if (!email || !email.includes('@')) return null;
  return email.split('@')[1].toLowerCase();
}

export function scoreContactQuality(input: ContactQualityInput): ContactQualityResult {
  let score = 0;

  const hasName = normalizeName(input.name).length >= 3;
  const hasTitle = normalizeTitle(input.title).length >= 3;
  const hasAccount = input.accountName.trim().length >= 2;
  const hasDomain = (input.companyDomain || '').trim().includes('.');
  const hasEmail = !!input.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email);
  const hasLinkedIn = !!input.linkedinUrl && /linkedin\.com\/(in|pub|company)\//i.test(input.linkedinUrl);
  const hasSourceUrl = !!input.sourceUrl;
  const evidenceCount = input.sourceEvidenceCount || 0;

  if (hasName) score += 15;
  if (hasTitle) score += 15;
  if (hasAccount) score += 10;
  if (hasDomain) score += 15;
  if (hasEmail) score += 20;
  if (hasLinkedIn) score += 15;
  if (hasSourceUrl) score += 5;
  if (evidenceCount >= 2) score += 5;

  const emailConfidence = hasEmail
    ? hasDomain && parseDomainFromEmail(input.email) === input.companyDomain
      ? 90
      : 70
    : 0;

  const linkedinConfidence = hasLinkedIn
    ? hasSourceUrl
      ? 90
      : 70
    : 0;

  let band: ContactQualityBand = 'D';
  if (score >= 90) band = 'A';
  else if (score >= 80) band = 'B';
  else if (score >= 70) band = 'C';

  const isReady =
    score >= CONTACT_STANDARD.minQualityScoreForSend &&
    emailConfidence >= CONTACT_STANDARD.minEmailConfidenceForSend;

  return { score, band, isReady, emailConfidence, linkedinConfidence };
}

export function firstNameFromEmail(email: string): string {
  const local = email.split('@')[0] || '';
  const candidate = local
    .split(/[._-]/)[0]
    .replace(/\d+/g, '')
    .trim();

  if (!candidate || candidate.length < 2) return '';
  return candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
}
