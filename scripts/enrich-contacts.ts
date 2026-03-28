import { PrismaClient, Prisma } from '@prisma/client';
import {
  CONTACT_STANDARD_VERSION,
  normalizeName,
  normalizeTitle,
  parseDomainFromEmail,
  scoreContactQuality,
  splitName,
} from '../src/lib/contact-standard';

const prisma = new PrismaClient();

const KNOWN_DOMAINS: Record<string, string> = {
  'Dannon': 'danone.com',
  'General Mills': 'genmills.com',
  'Frito-Lay': 'pepsico.com',
  'Diageo': 'diageo.com',
  'Hormel Foods': 'hormel.com',
  'JM Smucker': 'jmsmucker.com',
  'The Home Depot': 'homedepot.com',
  'Georgia Pacific': 'gapac.com',
  'H-E-B': 'heb.com',
  'FedEx': 'fedex.com',
  'John Deere': 'johndeere.com',
};

const BANNED_DOMAINS = new Set(['dannon.com', 'danone.com', 'bluetriton.com', 'yardflow.ai']);
const BLOCKED_DOMAINS = new Set([
  'niagarawater.com', 'homedepot.com', 'heb.com', 'fedex.com',
  'johndeere.com', 'kencogroup.com', 'bn.com', 'hmna.com',
  'hormel.com', 'gapac.com', 'jmsmucker.com', 'lpcorp.com',
  'xpo.com', 'kraftheinz.com', 'freightroll.com',
]);

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanLinkedInUrl(url: string): string {
  const trimmed = url.trim();
  return trimmed.replace(/\?.*$/, '').replace(/\/$/, '');
}

function generateEmailGuesses(name: string, domain?: string | null): string[] {
  if (!domain) return [];
  const { firstName, lastName } = splitName(name);
  if (!firstName || !lastName) return [];

  const first = firstName.toLowerCase();
  const last = lastName.toLowerCase();
  const fi = first[0];

  return [
    `${first}.${last}@${domain}`,
    `${fi}${last}@${domain}`,
    `${first}${last}@${domain}`,
    `${first}_${last}@${domain}`,
    `${last}.${first}@${domain}`,
  ];
}

async function searchLinkedInProfile(name: string, account: string): Promise<{ url: string | null; sourceUrl: string | null }> {
  const query = `${name} ${account} linkedin`;
  const endpoint = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(endpoint, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; YardFlowResearchBot/1.0; +https://yardflow.ai)',
    },
  });

  if (!res.ok) return { url: null, sourceUrl: null };
  const html = await res.text();

  const match = html.match(/uddg=([^"&]+linkedin\.com%2F(in|pub)%2F[^"&]+)/i);
  if (!match?.[1]) return { url: null, sourceUrl: endpoint };

  const decoded = decodeURIComponent(match[1]);
  return { url: cleanLinkedInUrl(decoded), sourceUrl: endpoint };
}

async function enrichPersona(persona: {
  id: number;
  name: string;
  title: string | null;
  account_name: string;
  email: string | null;
  linkedin_url: string | null;
}) {
  const split = splitName(persona.name);
  const knownDomain = KNOWN_DOMAINS[persona.account_name] || null;
  const currentDomain = parseDomainFromEmail(persona.email);
  const companyDomain = currentDomain || knownDomain;

  const generatedEmails = generateEmailGuesses(persona.name, companyDomain);
  const proposedEmail = persona.email || generatedEmails[0] || null;
  const proposedDomain = parseDomainFromEmail(proposedEmail) || companyDomain;

  if (proposedDomain && (BANNED_DOMAINS.has(proposedDomain) || BLOCKED_DOMAINS.has(proposedDomain))) {
    await prisma.persona.update({
      where: { id: persona.id },
      data: {
        company_domain: proposedDomain,
        do_not_contact: true,
        is_contact_ready: false,
        email_status: 'blocked',
        contact_standard_version: CONTACT_STANDARD_VERSION,
        last_enriched_at: new Date(),
      },
    });
    return { updated: true, blocked: true };
  }

  let linkedInUrl = persona.linkedin_url;
  let sourceUrl: string | null = null;

  if (!linkedInUrl) {
    try {
      const found = await searchLinkedInProfile(persona.name, persona.account_name);
      linkedInUrl = found.url;
      sourceUrl = found.sourceUrl;
    } catch {
      linkedInUrl = null;
    }
  }

  const quality = scoreContactQuality({
    name: persona.name,
    title: persona.title,
    accountName: persona.account_name,
    email: proposedEmail,
    companyDomain: proposedDomain,
    linkedinUrl: linkedInUrl,
    sourceUrl,
    sourceEvidenceCount: sourceUrl ? 1 : 0,
  });

  const sourceEvidence: Prisma.InputJsonValue = {
    generatedEmails,
    sourceUrl,
    linkedinFound: !!linkedInUrl,
    enrichedAt: new Date().toISOString(),
  };

  await prisma.persona.update({
    where: { id: persona.id },
    data: {
      first_name: split.firstName || null,
      last_name: split.lastName || null,
      normalized_name: normalizeName(persona.name),
      normalized_title: normalizeTitle(persona.title),
      email: proposedEmail,
      email_status: proposedEmail ? 'guessed' : 'unverified',
      email_confidence: quality.emailConfidence,
      company_domain: proposedDomain,
      phone_status: 'unknown',
      linkedin_url: linkedInUrl,
      linkedin_confidence: quality.linkedinConfidence,
      source_type: linkedInUrl ? 'search+linkedin' : 'search',
      source_url: sourceUrl,
      source_evidence: sourceEvidence,
      quality_score: quality.score,
      quality_band: quality.band,
      is_contact_ready: quality.isReady,
      do_not_contact: false,
      contact_standard_version: CONTACT_STANDARD_VERSION,
      last_enriched_at: new Date(),
    },
  });

  return { updated: true, blocked: false, ready: quality.isReady };
}

async function main() {
  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : 200;

  console.log('=== Contact Enrichment Pipeline ===');
  console.log(`Target records: ${limit}`);

  const personas = await prisma.persona.findMany({
    where: {
      OR: [
        { is_contact_ready: false },
        { company_domain: null },
        { email: null },
        { last_enriched_at: null },
      ],
      do_not_contact: false,
    },
    select: {
      id: true,
      name: true,
      title: true,
      account_name: true,
      email: true,
      linkedin_url: true,
    },
    take: limit,
    orderBy: { updated_at: 'asc' },
  });

  console.log(`Loaded ${personas.length} personas`);

  let updated = 0;
  let ready = 0;
  let blocked = 0;

  for (const persona of personas) {
    const result = await enrichPersona(persona);
    if (result.updated) updated++;
    if (result.ready) ready++;
    if (result.blocked) blocked++;
    await sleep(500);
  }

  const summary = await prisma.persona.groupBy({
    by: ['quality_band'],
    _count: { _all: true },
  });

  console.log(`Updated: ${updated}`);
  console.log(`Ready for send: ${ready}`);
  console.log(`Blocked: ${blocked}`);
  console.log('Band distribution:');
  for (const row of summary) {
    console.log(`  ${row.quality_band}: ${row._count._all}`);
  }

  await prisma.$disconnect();
}

main().catch(async err => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
