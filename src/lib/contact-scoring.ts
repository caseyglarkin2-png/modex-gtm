/**
 * Contact quality scoring — extends contact-standard scoring with ICP + seniority dimensions.
 * Sprint 5.5: Title seniority (25%), Email confidence (25%), Company ICP (25%), Completeness (25%)
 */

const SENIORITY_KEYWORDS: Record<string, number> = {
  'chief': 100,
  'ceo': 100,
  'cfo': 100,
  'coo': 100,
  'cto': 100,
  'cio': 100,
  'president': 95,
  'owner': 90,
  'founder': 90,
  'evp': 85,
  'svp': 85,
  'vp': 80,
  'vice president': 80,
  'gm': 75,
  'general manager': 75,
  'director': 70,
  'head of': 70,
  'senior director': 75,
  'sr director': 75,
  'sr. director': 75,
  'senior manager': 60,
  'manager': 50,
  'lead': 45,
  'supervisor': 40,
  'coordinator': 30,
  'analyst': 25,
  'specialist': 20,
  'associate': 15,
  'intern': 5,
};

const ICP_VERTICALS = new Set([
  'cpg', 'consumer packaged goods', 'food', 'beverage', 'fmcg',
  'retail', 'grocery', 'distribution', 'logistics', '3pl',
  'manufacturing', 'automotive', 'industrial',
]);

const ICP_KEYWORDS = new Set([
  'supply chain', 'logistics', 'distribution', 'warehouse', 'fulfillment',
  'yard', 'dock', 'transportation', 'freight', 'operations',
  'fleet', 'procurement', 'inventory',
]);

export interface ContactScore {
  total: number;
  band: 'A' | 'B' | 'C' | 'D';
  seniorityScore: number;
  emailConfidenceScore: number;
  icpFitScore: number;
  completenessScore: number;
}

export interface ContactScoringInput {
  title?: string;
  email?: string;
  company?: string;
  industry?: string;
  hasPhone?: boolean;
  hasLinkedin?: boolean;
  hasName?: boolean;
}

export function scoreContact(input: ContactScoringInput): ContactScore {
  // 1. Title seniority (0-100, weighted 25%)
  const seniorityScore = scoreSeniority(input.title);

  // 2. Email confidence (0-100, weighted 25%)
  const emailConfidenceScore = scoreEmailConfidence(input.email, input.company);

  // 3. Company ICP fit (0-100, weighted 25%)
  const icpFitScore = scoreIcpFit(input.company, input.industry, input.title);

  // 4. Completeness (0-100, weighted 25%)
  const completenessScore = scoreCompleteness(input);

  const total = Math.round(
    seniorityScore * 0.25 +
    emailConfidenceScore * 0.25 +
    icpFitScore * 0.25 +
    completenessScore * 0.25,
  );

  let band: 'A' | 'B' | 'C' | 'D' = 'D';
  if (total >= 75) band = 'A';
  else if (total >= 55) band = 'B';
  else if (total >= 35) band = 'C';

  return { total, band, seniorityScore, emailConfidenceScore, icpFitScore, completenessScore };
}

function scoreSeniority(title?: string): number {
  if (!title) return 0;
  const lower = title.toLowerCase();
  for (const [keyword, score] of Object.entries(SENIORITY_KEYWORDS)) {
    if (lower.includes(keyword)) return score;
  }
  return 10; // Has title but unknown seniority
}

function scoreEmailConfidence(email?: string, company?: string): number {
  if (!email || !email.includes('@')) return 0;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return 0;

  const isFreeEmail = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'].includes(domain);
  if (isFreeEmail) return 30;

  // Corporate domain — check if matches company
  if (company) {
    const companyLower = company.toLowerCase().replace(/[^a-z0-9]/g, '');
    const domainBase = domain.split('.')[0];
    if (domainBase && companyLower.includes(domainBase)) return 95;
  }

  return 70; // Corporate domain but can't verify match
}

function scoreIcpFit(company?: string, industry?: string, title?: string): number {
  let score = 0;
  const fields = [company, industry, title].filter(Boolean).join(' ').toLowerCase();

  for (const vertical of ICP_VERTICALS) {
    if (fields.includes(vertical)) {
      score += 40;
      break;
    }
  }

  for (const keyword of ICP_KEYWORDS) {
    if (fields.includes(keyword)) {
      score += 20;
      break;
    }
  }

  // Large companies get a baseline
  if (company && company.length > 3) score += 20;

  return Math.min(score, 100);
}

function scoreCompleteness(input: ContactScoringInput): number {
  let score = 0;
  if (input.hasName !== false) score += 20; // default true if not explicitly false
  if (input.email) score += 30;
  if (input.title) score += 20;
  if (input.hasPhone) score += 15;
  if (input.hasLinkedin) score += 15;
  return Math.min(score, 100);
}
