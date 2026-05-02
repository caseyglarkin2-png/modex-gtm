export function normalizeCompanyDomain(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0];
  return normalized || null;
}

export function normalizeCompanyName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function likelySameCompanyName(left: string, right: string): boolean {
  const a = normalizeCompanyName(left);
  const b = normalizeCompanyName(right);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export function isNewAccountSendEligible(qualityScore: number): boolean {
  return qualityScore >= 80;
}
