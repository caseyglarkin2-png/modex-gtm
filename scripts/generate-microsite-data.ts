#!/usr/bin/env npx tsx
/**
 * ABM Microsite Factory — Account Data Generator
 *
 * Reads from co-equal data sources:
 *   1. accounts.json          — account priority, vertical, signals, primo angle
 *   2. personas.json          — named contacts with titles, roles, emails
 *   3. docs/research/         — standalone executive dossiers (deep)
 *   4. docs/research-dossiers-top10.md — consolidated research doc (medium)
 *
 * Outputs TypeScript AccountMicrositeData files to src/lib/microsites/accounts/
 *
 * Quality Tiers:
 *   Tier A = Deep dossier + named contacts with career/quote intelligence. Shippable.
 *   Tier B = Account-specific with named contacts, good operational data. Solid but lighter.
 *   Tier C = Structurally valid from personas.json + accounts.json only. Not ready for outreach.
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Types ─────────────────────────────────────────────────────────────

interface AccountJSON {
  name: string;
  vertical: string;
  priority_score: number;
  priority_band: string;
  tier: string;
  primo_angle: string;
  why_now: string;
  signal_type: string;
  icp_fit: number;
  modex_signal: number;
  primo_story_fit: number;
  parent_brand?: string;
  best_intro_path?: string;
  notes?: string;
  // Enrichment fields for differentiated microsites
  hq_location?: string;
  facility_count?: string;
  facility_types?: string[];
  daily_trailer_moves?: string;
  fleet_profile?: string;
  custom_hero?: string;
  custom_problem_narrative?: string;
  custom_problem_headline?: string;
  specific_pain_points?: { headline: string; description: string; kpiImpact?: string }[];
  annual_revenue?: string;
  modex_speaker_name?: string;
  modex_speaker_title?: string;
  new_exec_name?: string;
  new_exec_title?: string;
  // Showcase overrides
  accent_color_override?: string;
  showcase?: boolean;
  showcase_order?: number;
  layout_preset?: string;
  // Per-account proof and module overrides
  custom_proof_quote?: string;
  custom_proof_attribution?: string;
  custom_module_relevance?: Record<string, string>;
  // Per-person hero overrides
  person_hero_overrides?: Record<string, string>;
}

interface PersonaJSON {
  persona_id: string;
  account: string;
  priority: string;
  name: string;
  title: string;
  persona_lane: string;
  role_in_deal: string;
  intro_route: string;
  function: string;
  seniority: string;
  why_this_persona: string;
  linkedin_url: string;
  attendance_signal: string;
  intro_path: string;
  persona_status: string;
  next_step: string;
  notes: string;
  account_score: number;
  email: string;
  phone: string;
}

interface DossierData {
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  companyRevenue?: string;
  companyEmployees?: string;
  companyTicker?: string;
  background?: string;
  supplyChainOps: string[];
  painPoints: { headline: string; description: string; kpiImpact?: string; source?: string }[];
  recentNews: string[];
  yardFlowAngle: string;
  modexConnection?: string;
  facilities?: { name: string; location: string; type: string; significance?: string; yardRelevance?: string }[];
  facilityCount?: string;
  fleet?: string;
  dailyTrailerMoves?: string;
  peakInfo?: string;
}

type QualityTier = 'A' | 'B' | 'C';

interface GeneratedAccount {
  slug: string;
  name: string;
  tier: QualityTier;
  personVariantCount: number;
  personCount: number;
  filePath: string;
}

// ── Constants ─────────────────────────────────────────────────────────

const BOOKING_LINK = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';

const ROOT = path.resolve(__dirname, '..');
const ACCOUNTS_JSON = path.join(ROOT, 'src/lib/data/accounts.json');
const PERSONAS_JSON = path.join(ROOT, 'src/lib/data/personas.json');
const DOSSIERS_DIR = path.join(ROOT, 'docs/research');
const TOP10_DOC = path.join(ROOT, 'docs/research-dossiers-top10.md');
const OUTPUT_DIR = path.join(ROOT, 'src/lib/microsites/accounts');

const VERTICAL_MAP: Record<string, string> = {
  'Food & Beverage': 'cpg',
  'Retail': 'retail',
  'Manufacturing': 'automotive',
  'Industrial': 'industrial',
  '3PL / Logistics': 'logistics-3pl',
  'Beverage': 'beverage',
  'Grocery': 'grocery',
  'Heavy Equipment': 'heavy-equipment',
};

const SENIORITY_MAP: Record<string, string> = {
  'C-level / EVP': 'C-level',
  'C-level / SVP': 'C-level',
  'C-level / COO': 'C-level',
  'SVP / EVP': 'SVP/EVP',
  'VP': 'VP',
  'Director': 'Director',
  'Manager': 'Manager',
};

const ROLE_MAP: Record<string, string> = {
  'Exec sponsor': 'decision-maker',
  'Decision-maker': 'decision-maker',
  'Operator / influencer': 'influencer',
  'Champion': 'champion',
  'Routing contact': 'routing-contact',
};

const LANE_MAP: Record<string, string> = {
  'Exec sponsor': 'executive',
  'Operator / influencer': 'ops',
  'Champion': 'ops',
  'CFO': 'cfo',
  'IT': 'it',
};

// ── Solution Modules (shared across all accounts) ─────────────────────
const SOLUTION_MODULES = [
  { id: 'flowDRIVER', name: 'flowDRIVER', verb: 'Verify', shortDescription: 'Digital driver check-in to check-out. QR + wallet ID verification, algorithmic lane direction.' },
  { id: 'flowBOL', name: 'flowBOL', verb: 'Document', shortDescription: 'Touchless BOL creation with timestamped chain of custody.' },
  { id: 'flowSPOTTER', name: 'flowSPOTTER', verb: 'Execute', shortDescription: 'Spotter app for move execution and task queues. No more radio dispatching.' },
  { id: 'flowTWIN', name: 'flowTWIN', verb: 'Map', shortDescription: 'Digital twin of the yard. Real-time trailer location, dwell, and lane state.' },
  { id: 'flowAI', name: 'flowAI', verb: 'Orchestrate', shortDescription: 'AI agent routing moves, flagging exceptions, enforcing priority rules.' },
  { id: 'flowNETWORK', name: 'flowNETWORK', verb: 'Scale', shortDescription: 'Network-wide command view with alerting and cross-site performance intelligence.' },
];

// ── Data Loading ──────────────────────────────────────────────────────

function loadAccounts(): AccountJSON[] {
  return JSON.parse(fs.readFileSync(ACCOUNTS_JSON, 'utf-8'));
}

function loadPersonas(): PersonaJSON[] {
  return JSON.parse(fs.readFileSync(PERSONAS_JSON, 'utf-8'));
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function personSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Dossier Parsers ───────────────────────────────────────────────────

function parseTop10Section(content: string, sectionNum: number): DossierData | null {
  // Extract section between ## N. TITLE and ## (N+1). or end
  const sectionRegex = new RegExp(
    `## ${sectionNum}\\.\\s+(.+?)\\n([\\s\\S]*?)(?=\\n## \\d+\\.|\\n## Key Themes|$)`
  );
  const match = content.match(sectionRegex);
  if (!match) return null;

  const sectionText = match[2];

  // Extract contact info
  const contactMatch = sectionText.match(/### Contact:\s*(.+?)(?:\s*[-—])\s*(.+)/);
  const emailMatch = sectionText.match(/[-*]\s*Email:\s*(\S+)/);
  const backgroundMatch = sectionText.match(/[-*]\s*Background:\s*(.+)/);

  // Extract company profile
  const revenueMatch = sectionText.match(/[-*]\s*Revenue:\s*(.+)/);
  const employeesMatch = sectionText.match(/[-*]\s*Employees:\s*(.+)/);
  const tickerMatch = sectionText.match(/[-*]\s*Ticker:\s*(.+)/);

  // Extract pain points
  const painPoints: DossierData['painPoints'] = [];
  const painSection = sectionText.match(/### Yard-Specific Pain Points([\s\S]*?)(?=###|$)/);
  if (painSection) {
    const painRegex = /\d+\.\s*\*\*(.+?)\*\*:\s*(.+?)(?=\n\d+\.|\n###|\n---|$)/gs;
    let pm;
    while ((pm = painRegex.exec(painSection[1])) !== null) {
      painPoints.push({ headline: pm[1].trim(), description: pm[2].trim().replace(/\n\s*/g, ' ') });
    }
  }

  // Extract recent news
  const recentNews: string[] = [];
  const newsSection = sectionText.match(/### Recent Supply Chain News([\s\S]*?)(?=###|$)/);
  if (newsSection) {
    const newsLines = newsSection[1].match(/[-*]\s+(.+)/g);
    if (newsLines) {
      for (const line of newsLines) {
        recentNews.push(line.replace(/^[-*]\s+/, '').trim());
      }
    }
  }

  // Extract YardFlow angle
  const angleMatch = sectionText.match(/### YardFlow Angle[\s\S]*?"(.+?)"/s);
  const yardFlowAngle = angleMatch ? angleMatch[1].replace(/\n/g, ' ').trim() : '';

  // Extract MODEX connection
  const modexSection = sectionText.match(/### MODEX Connection([\s\S]*?)(?=---|$)/);
  const modexConnection = modexSection
    ? modexSection[1].match(/[-*]\s+(.+)/g)?.map(l => l.replace(/^[-*]\s+/, '').trim()).join('. ')
    : undefined;

  // Extract facility data from supply chain section
  const scSection = sectionText.match(/### Supply Chain \/ Yard Operations([\s\S]*?)(?=###|$)/);
  const facilities: DossierData['facilities'] = [];
  let facilityCount: string | undefined;
  let fleet: string | undefined;
  let dailyTrailerMoves: string | undefined;

  if (scSection) {
    const fcMatch = scSection[1].match(/\*\*(?:Manufacturing|Distribution|DCs?|Breweries|Facilities?)\*\*[^:]*:\s*(.+)/i);
    if (fcMatch) facilityCount = fcMatch[1].match(/(\d+[\+]?\s*(?:facilities|plants|DCs|breweries)?)/i)?.[1];

    const fleetMatch = scSection[1].match(/\*\*Fleet\*\*[^:]*:\s*(.+)/);
    if (fleetMatch) fleet = fleetMatch[1].trim();

    const dockMatch = scSection[1].match(/(\d[\d,]*[\+]?\s*(?:trailer movements?|outbound loads?|loads)[\s/]*(?:day|week))/i);
    if (dockMatch) dailyTrailerMoves = dockMatch[1];
  }

  // Supply chain ops lines
  const supplyChainOps: string[] = [];
  if (scSection) {
    const opsLines = scSection[1].match(/[-*]\s*\*\*(.+?)\*\*[^:]*:\s*(.+)/g);
    if (opsLines) {
      for (const line of opsLines) {
        supplyChainOps.push(line.replace(/^[-*]\s*/, '').trim());
      }
    }
  }

  return {
    contactName: contactMatch?.[1]?.trim() || '',
    contactTitle: contactMatch?.[2]?.trim() || '',
    contactEmail: emailMatch?.[1]?.trim() || '',
    companyRevenue: revenueMatch?.[1]?.trim(),
    companyEmployees: employeesMatch?.[1]?.trim(),
    companyTicker: tickerMatch?.[1]?.trim(),
    background: backgroundMatch?.[1]?.trim(),
    supplyChainOps,
    painPoints,
    recentNews,
    yardFlowAngle,
    modexConnection,
    facilities,
    facilityCount,
    fleet,
    dailyTrailerMoves,
  };
}

function parseStandaloneDossier(filePath: string): DossierData | null {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');

  // Split into sections by ## headers
  const sections: { title: string; body: string }[] = [];
  const sectionRegex = /^## \d+\.\s*(.+)$/gm;
  let match;
  const sectionStarts: { title: string; start: number }[] = [];
  while ((match = sectionRegex.exec(content)) !== null) {
    sectionStarts.push({ title: match[1], start: match.index + match[0].length });
  }
  for (let i = 0; i < sectionStarts.length; i++) {
    const end = i + 1 < sectionStarts.length ? sectionStarts[i + 1].start - sectionStarts[i + 1].title.length - 10 : content.length;
    sections.push({ title: sectionStarts[i].title, body: content.substring(sectionStarts[i].start, end) });
  }

  // Helper: find section by keywords (any match)
  function findSection(...keywords: string[]): string | undefined {
    const lowerKws = keywords.map(k => k.toLowerCase());
    const found = sections.find(s => lowerKws.some(kw => s.title.toLowerCase().includes(kw)));
    return found?.body;
  }

  // Extract target name and title
  const targetMatch = content.match(/\*\*Target:\*\*\s*(.+?),\s*(.+)/m);
  const emailMatch = content.match(/\*\*Email:\*\*\s*(\S+)/m);

  // Career / background — try multiple header patterns
  const careerSection = findSection('career', 'background');
  const background = careerSection?.replace(/^[\s\n]+/, '').substring(0, 500).trim();

  // Company overview
  const revenueMatch = content.match(/\*\*Revenue:?\*\*\s*(.+)/m);
  const employeesMatch = content.match(/\*\*(?:Total\s+)?Employees:?\*\*\s*(.+)/im);

  // Pain points — look in multiple possible sections
  const painPoints: DossierData['painPoints'] = [];
  const painSectionBody = findSection('pain point', 'logistics challenge', 'logistics pain', 'challenges', 'yard/dock');
  if (painSectionBody) {
    // Pattern 1: numbered items with bold headings "1. **Heading**: description" or "1. **Heading** — description"
    const painRegex1 = /\d+\.\s*\*\*(.+?)\*\*[\s:—-]*(.+?)(?=\n\d+\.\s*\*\*|\n##|$)/gs;
    let pm;
    while ((pm = painRegex1.exec(painSectionBody)) !== null) {
      painPoints.push({
        headline: pm[1].trim(),
        description: pm[2].trim().replace(/\n\s*/g, ' ').substring(0, 300),
      });
    }
    // Pattern 2: ### sub-headers with content
    if (painPoints.length === 0) {
      const subRegex = /###\s+(.+)\n([\s\S]*?)(?=\n###|\n##|$)/g;
      while ((pm = subRegex.exec(painSectionBody)) !== null) {
        const desc = pm[2].replace(/\n\s*/g, ' ').trim().substring(0, 300);
        if (desc.length > 20) {
          painPoints.push({ headline: pm[1].trim(), description: desc });
        }
      }
    }
    // Pattern 3: bullet points with bold leads
    if (painPoints.length === 0) {
      const bulletRegex = /[-*]\s+\*\*(.+?)\*\*[\s:—-]*(.+)/g;
      while ((pm = bulletRegex.exec(painSectionBody)) !== null) {
        painPoints.push({ headline: pm[1].trim(), description: pm[2].trim().substring(0, 300) });
      }
    }
  }

  // YardFlow-specific pain points from yard management sections
  const yardSection = findSection('yard management', 'dock scheduling', 'yard/dock');
  if (yardSection && painPoints.length < 5) {
    const yardRegex = /\d+\.\s*\*\*(.+?)\*\*[\s:—-]*(.+?)(?=\n\d+\.\s*\*\*|\n##|$)/gs;
    let pm;
    while ((pm = yardRegex.exec(yardSection)) !== null) {
      if (!painPoints.some(p => p.headline === pm[1].trim())) {
        painPoints.push({
          headline: pm[1].trim(),
          description: pm[2].trim().replace(/\n\s*/g, ' ').substring(0, 300),
        });
      }
    }
  }

  // Recent news — broader pattern
  const newsSectionBody = findSection('recent', 'news', 'strategic');
  const recentNews: string[] = [];
  if (newsSectionBody) {
    // Bullet points
    const lines = newsSectionBody.match(/[-*]\s+\*\*(.+?)\*\*/g);
    if (lines) {
      for (const l of lines) recentNews.push(l.replace(/^[-*]\s+\*\*/, '').replace(/\*\*$/, '').trim());
    }
    // Numbered items
    if (recentNews.length === 0) {
      const numbered = newsSectionBody.match(/\d+\.\s*\*\*(.+?)\*\*/g);
      if (numbered) {
        for (const n of numbered) recentNews.push(n.replace(/^\d+\.\s*\*\*/, '').replace(/\*\*$/, '').trim());
      }
    }
    // Plain bullet points
    if (recentNews.length === 0) {
      const plainBullets = newsSectionBody.match(/[-*]\s+(.+)/g);
      if (plainBullets) {
        for (const l of plainBullets.slice(0, 5)) recentNews.push(l.replace(/^[-*]\s+/, '').trim());
      }
    }
  }

  // YardFlow angle — check "Key Insight" and "What Would Make [Person] Care" sections
  // Priority order: "key insight" > "what would make" > "personally care" > "outreach angle" > "yardflow"
  const angleBody = findSection('key insight') || findSection('what would make') ||
    findSection('personally care') || findSection('outreach angle') || findSection('yardflow angle');
  let yardFlowAngle = '';
  if (angleBody) {
    // Look for the most compelling paragraph (>50 chars, not a table)
    const paragraphs = angleBody.split('\n\n')
      .map(p => p.replace(/^#+\s+.+\n/, '').trim())  // Strip ### sub-headers from paragraph start
      .filter(p => p.length > 50 && !p.startsWith('|') && !p.startsWith('---'));
    yardFlowAngle = paragraphs[0]?.replace(/\n/g, ' ').trim().substring(0, 400) || '';
  }

  // Facility data
  const opSection = findSection('operational footprint', 'supply chain', 'manufacturing', 'infrastructure');
  let facilityCount: string | undefined;
  let dailyTrailerMoves: string | undefined;
  let fleet: string | undefined;
  const facilities: DossierData['facilities'] = [];

  if (opSection) {
    // Extract facility counts
    const fcMatch = opSection.match(/(\d+)\+?\s*(?:facilities|plants|DCs|distribution centers|manufacturing|breweries|factories)/i);
    if (fcMatch) facilityCount = fcMatch[1] + '+';

    // Trailer moves
    const tmMatch = opSection.match(/(\d[\d,]*)\+?\s*(?:trailer|truck|load|shipment)s?\s*(?:per|\/)\s*(?:day|daily)/i);
    if (tmMatch) dailyTrailerMoves = tmMatch[1].replace(/,/g, '') + '+';

    // Fleet
    const fleetMatch = opSection.match(/(\d[\d,]*)\+?\s*(?:truck|trailer|tractor|vehicle)s?\b/i);
    if (fleetMatch) fleet = fleetMatch[1].replace(/,/g, '') + '+ vehicles';

    // Key facility mentions with locations
    const facilityRegex = /\*\*(.+?)\*\*.*?(?:in\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})/g;
    let fm;
    while ((fm = facilityRegex.exec(opSection)) !== null) {
      facilities.push({
        name: fm[1].trim(),
        location: fm[2].trim(),
        type: 'Manufacturing/Distribution',
      });
    }
  }

  // MODEX connection
  const modexSection = findSection('modex');
  const modexConnection = modexSection?.replace(/\n/g, ' ').trim().substring(0, 200);

  // Public quotes (from > blockquotes)
  const quotes = content.match(/^>\s*[*"](.+?)[*"]/gm);

  return {
    contactName: targetMatch?.[1]?.trim() || '',
    contactTitle: targetMatch?.[2]?.trim() || '',
    contactEmail: emailMatch?.[1]?.trim() || '',
    companyRevenue: revenueMatch?.[1]?.trim(),
    companyEmployees: employeesMatch?.[1]?.trim(),
    background,
    supplyChainOps: [],
    painPoints,
    recentNews: recentNews.slice(0, 5),
    yardFlowAngle,
    facilities: facilities.length > 0 ? facilities : undefined,
    facilityCount,
    fleet,
    dailyTrailerMoves,
    modexConnection,
  };
}

// Map standalone dossier files to account names
function findDossierForAccount(accountName: string): DossierData | null {
  const dossierFiles = fs.existsSync(DOSSIERS_DIR)
    ? fs.readdirSync(DOSSIERS_DIR).filter(f => f.endsWith('.md'))
    : [];

  const normalizedAccount = accountName.toLowerCase().replace(/[^a-z]/g, '');

  for (const file of dossierFiles) {
    const normalizedFile = file.toLowerCase().replace(/[^a-z]/g, '');
    if (normalizedFile.includes(normalizedAccount) ||
        normalizedAccount.includes(normalizedFile.replace('dossiermd', '').split('-').filter(s => s.length > 3).join(''))) {
      return parseStandaloneDossier(path.join(DOSSIERS_DIR, file));
    }
  }

  return null;
}

// Map top-10 entries to account names
const TOP10_ACCOUNT_MAP: Record<string, number> = {
  'coca-cola': 1,
  'the coca-cola company': 1,
  'ab inbev': 2,
  'anheuser-busch inbev': 2,
  "campbell's": 3,
  'campbell soup': 3,
  'campbells': 3,
  'constellation brands': 4,
  'keurig dr pepper': 5,
  'kdp': 5,
  'general mills': 6,
  'mondelez': 7,
  'mondelez international': 7,
  'caterpillar': 8,
  'dollar tree': 9,
  'performance food group': 10,
  'pfg': 10,
};

function findTop10ForAccount(accountName: string, top10Content: string): DossierData | null {
  const key = accountName.toLowerCase();
  const sectionNum = TOP10_ACCOUNT_MAP[key];
  if (!sectionNum) return null;
  return parseTop10Section(top10Content, sectionNum);
}

// ── Quality Tier Assessment ───────────────────────────────────────────

function assessTier(
  account: AccountJSON,
  personas: PersonaJSON[],
  standaloneDossier: DossierData | null,
  top10Dossier: DossierData | null
): QualityTier {
  let score = 0;

  // Standalone dossier = deep research (max 40 points)
  if (standaloneDossier) {
    score += 25;
    if (standaloneDossier.painPoints.length >= 3) score += 5;
    if (standaloneDossier.background) score += 5;
    if (standaloneDossier.recentNews.length >= 2) score += 5;
  }

  // Top-10 dossier = medium research (max 30 points)
  if (top10Dossier) {
    score += 15;
    if (top10Dossier.painPoints.length >= 3) score += 5;
    if (top10Dossier.yardFlowAngle) score += 5;
    if (top10Dossier.recentNews.length >= 2) score += 5;
  }

  // Named personas (max 20 points)
  if (personas.length >= 3) score += 10;
  else if (personas.length >= 1) score += 5;
  if (personas.some(p => p.email && p.email !== 'None')) score += 5;
  if (personas.some(p => p.seniority?.includes('C-level'))) score += 5;

  // Account data quality (max 10 points)
  if (account.priority_score > 0) score += 3;
  if (account.primo_angle) score += 3;
  if (account.why_now) score += 2;
  if (account.icp_fit >= 4) score += 2;

  // Enrichment bonus (max 15 points) — replaces need for dossier
  if (account.custom_hero) score += 5;
  if (account.specific_pain_points && account.specific_pain_points.length >= 2) score += 5;
  else if (account.specific_pain_points && account.specific_pain_points.length >= 1) score += 3;
  if (account.facility_count) score += 2;
  if (account.hq_location) score += 1;
  if (account.new_exec_name || account.modex_speaker_name) score += 2;

  if (score >= 45) return 'A';
  if (score >= 25) return 'B';
  return 'C';
}

// ── Code Generation ───────────────────────────────────────────────────

function escapeStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

/** Strip markdown formatting artifacts from pain point headlines */
function cleanPainPointHeadline(headline: string): string {
  return headline
    .replace(/^\d+[a-z]?\.\s*/i, '')           // Remove "1.", "4a.", etc.
    .replace(/^Pain Point \d+:\s*/i, '')        // Remove "Pain Point 1:"
    .replace(/^🔴\s*(?:CRITICAL:\s*)?/i, '')    // Remove emoji markers
    .replace(/\*\*/g, '')                       // Remove bold markdown
    .replace(/\[.*?\]\(.*?\)/g, '')             // Remove links
    .replace(/^\s*[-*]\s+/, '')                 // Remove bullet markers
    .trim();
}

/** Strip markdown artifacts from descriptions/narratives */
function cleanMarkdownArtifacts(text: string): string {
  return text
    .replace(/\*\*/g, '')                       // Remove bold
    .replace(/\*/g, '')                         // Remove italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')         // Convert links to text
    .replace(/^[-*]\s+/gm, '')                  // Remove bullets
    .replace(/^\d+\.\s+/gm, '')                 // Remove numbered list markers
    .replace(/#{1,6}\s+/g, '')                  // Remove headers
    .replace(/>\s*/g, '')                       // Remove blockquote markers
    .replace(/\s+/g, ' ')                       // Normalize whitespace
    .trim();
}

function mapVertical(rawVertical: string): string {
  return VERTICAL_MAP[rawVertical] || 'industrial';
}

function mapSeniority(rawSeniority: string): string {
  return SENIORITY_MAP[rawSeniority] || 'VP';
}

function mapRoleInDeal(rawRole: string): string {
  return ROLE_MAP[rawRole] || 'influencer';
}

function mapLane(rawLane: string, func?: string): string {
  if (func) {
    const f = func.toLowerCase();
    if (f.includes('finance') || f.includes('cfo')) return 'cfo';
    if (f.includes('it') || f.includes('technology')) return 'it';
    if (f.includes('logistics') || f.includes('transport')) return 'logistics';
    if (f.includes('operations') || f.includes('supply chain') || f.includes('manufacturing')) return 'ops';
  }
  return LANE_MAP[rawLane] || 'ops';
}

function inferBandFromScore(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  return 'D';
}

function generatePersonProfile(persona: PersonaJSON, dossier: DossierData | null): string {
  const firstName = persona.name.split(' ')[0];
  const lastName = persona.name.split(' ').slice(1).join(' ');
  const seniority = mapSeniority(persona.seniority);
  const roleInDeal = mapRoleInDeal(persona.role_in_deal);
  const isDossierContact = dossier && dossier.contactName &&
    persona.name.toLowerCase().includes(dossier.contactName.split(' ').pop()?.toLowerCase() || '___');

  let profile = `    {
      personaId: '${escapeStr(persona.persona_id)}',
      name: '${escapeStr(persona.name)}',
      firstName: '${escapeStr(firstName)}',
      lastName: '${escapeStr(lastName)}',
      title: '${escapeStr(persona.title)}',
      company: '${escapeStr(persona.account)}',`;

  if (persona.email && persona.email !== 'None') {
    profile += `\n      email: '${escapeStr(persona.email)}',`;
  }
  if (persona.linkedin_url && persona.linkedin_url !== 'None') {
    profile += `\n      linkedinUrl: '${escapeStr(persona.linkedin_url)}',`;
  }

  profile += `
      roleInDeal: '${roleInDeal}',
      seniority: '${seniority}',
      function: '${escapeStr(persona.function)}',`;

  if (persona.why_this_persona) {
    profile += `\n      currentMandate: '${escapeStr(persona.why_this_persona)}',`;
  }

  if (isDossierContact && dossier?.background) {
    profile += `\n      knownForPhrase: '${escapeStr(dossier.background.substring(0, 200))}',`;
  }

  if (persona.intro_path && persona.intro_path !== 'None') {
    profile += `\n      bestIntroPath: '${escapeStr(persona.intro_path)}',`;
  }

  if (persona.notes && persona.notes !== 'None' && persona.notes.toLowerCase().includes('do not')) {
    profile += `\n      doNotContact: true,`;
  }

  profile += `\n    }`;
  return profile;
}

function generatePersonVariant(
  persona: PersonaJSON,
  account: AccountJSON,
  dossier: DossierData | null,
  painPoints: DossierData['painPoints']
): string | null {
  // Only generate person variants for contacts where we have enough data
  const hasDossierMatch = dossier && dossier.contactName &&
    persona.name.toLowerCase().includes(dossier.contactName.split(' ').pop()?.toLowerCase() || '___');
  const isExecSponsor = persona.persona_lane === 'Exec sponsor' || persona.role_in_deal === 'Exec sponsor';
  const isSenior = persona.seniority?.includes('C-level') || persona.seniority?.includes('SVP') || persona.seniority?.includes('President');
  const isDirectorPlus = isSenior || persona.seniority?.includes('VP') || persona.seniority?.includes('Director');
  const hasEmail = persona.email && persona.email !== 'None';

  // Need at least: dossier match OR exec/senior OR director+, AND an email
  if (!hasDossierMatch && !isExecSponsor && !isDirectorPlus) return null;
  if (!hasEmail) return null;

  const firstName = persona.name.split(' ')[0];
  const lastName = persona.name.split(' ').slice(1).join(' ');
  const slug = personSlug(persona.name);
  const seniority = mapSeniority(persona.seniority);
  const roleInDeal = mapRoleInDeal(persona.role_in_deal);
  const lane = mapLane(persona.persona_lane, persona.function);

  // Person-specific hero headline (custom override or default template)
  const personHeroHeadline = account.person_hero_overrides?.[persona.name]
    || `${firstName}, the yard is where ${account.name}'s execution breaks down`;

  // Build framing narrative from available data
  let framingNarrative: string;
  let openingHook: string;
  let stakeStatement: string;

  if (hasDossierMatch && dossier) {
    framingNarrative = `${firstName}, ${dossier.yardFlowAngle || account.primo_angle}`;
    openingHook = painPoints[0]?.headline
      ? `Your team is dealing with ${painPoints[0].headline.toLowerCase()}. That is a yard problem before it is anything else.`
      : `${account.why_now} - and the yard is where that decision plays out.`;
    stakeStatement = painPoints[1]?.description
      ? painPoints[1].description
      : `The yard is the invisible constraint in ${account.name}'s supply chain.`;
  } else {
    framingNarrative = `${firstName}, ${account.primo_angle}`;
    openingHook = `${account.why_now} - the yard is where execution meets reality for ${account.name}.`;
    stakeStatement = `Every minute of excess dwell time at ${account.name}'s facilities erodes the margin your team is working to protect.`;
  }

  // Build KPI language from function
  const kpiLanguage = inferKPILanguage(persona.function, persona.persona_lane);

  // Tone shift based on seniority
  const toneShift = seniority === 'C-level'
    ? `Strategic, board-level. Reference ${firstName}'s mandate and transformation context. Lead with outcomes and business impact, not features.`
    : seniority === 'SVP/EVP'
    ? `Senior operator. Balance strategic framing with operational detail. ${firstName} needs to see both the vision and the path.`
    : `Operator-to-operator. ${firstName} lives in the operational details. Lead with metrics, turn times, and facility-level impact.`;

  return `    {
      person: {
        personaId: '${escapeStr(persona.persona_id)}',
        name: '${escapeStr(persona.name)}',
        firstName: '${escapeStr(firstName)}',
        lastName: '${escapeStr(lastName)}',
        title: '${escapeStr(persona.title)}',
        company: '${escapeStr(persona.account)}',
        email: '${escapeStr(persona.email)}',
        roleInDeal: '${roleInDeal}',
        seniority: '${seniority}',
        function: '${escapeStr(persona.function)}',
      },
      fallbackLane: '${lane}',
      label: '${escapeStr(persona.name)} - ${escapeStr(persona.title.split(',')[0])}',
      variantSlug: '${slug}',

      framingNarrative: '${escapeStr(framingNarrative)}',
      openingHook: '${escapeStr(openingHook)}',
      stakeStatement: '${escapeStr(stakeStatement)}',

      heroOverride: {
        headline: '${escapeStr(personHeroHeadline)}',
        subheadline: '${escapeStr(account.primo_angle)}',
      },
      sectionOrder: ['hero', 'problem', 'stakes', 'proof', 'solution', 'network-map', 'roi', 'testimonial', 'cta'],
      ctaOverride: {
        type: '${account.modex_signal >= 4 ? 'modex-meeting' : 'meeting'}',
        headline: '${escapeStr(firstName)}, let\\'s walk your yard network',
        subtext: '30-minute conversation about ${escapeStr(account.name)}\\'s yard operations and where YardFlow fits.',
        buttonLabel: '${account.modex_signal >= 4 ? 'Book a Meeting at MODEX' : 'Book a Network Audit'}',
        calendarLink: BOOKING_LINK,
        personName: '${escapeStr(firstName)}',
        personContext: '${escapeStr(account.why_now || account.primo_angle).substring(0, 100)}',
      },

      toneShift: '${escapeStr(toneShift)}',
      kpiLanguage: [${kpiLanguage.map(k => `'${escapeStr(k)}'`).join(', ')}],
      proofEmphasis: 'The headcount-neutral customer quote resonates with ${escapeStr(firstName)}\\'s operational reality.',
    }`;
}

function inferKPILanguage(func: string, lane: string): string[] {
  const f = (func || '').toLowerCase();
  if (f.includes('supply chain') || f.includes('operations'))
    return ['truck turn time', 'dock utilization', 'throughput per shift', 'detention cost', 'carrier satisfaction'];
  if (f.includes('logistics') || f.includes('transport'))
    return ['turn time', 'detention cost', 'dwell time', 'on-time pickup', 'carrier satisfaction'];
  if (f.includes('procurement') || f.includes('finance'))
    return ['cost per load', 'detention spend', 'labor cost per trailer', 'total cost of ownership'];
  if (f.includes('manufacturing'))
    return ['dock utilization', 'throughput per shift', 'production schedule adherence', 'temperature-zone compliance'];
  return ['truck turn time', 'detention cost', 'throughput', 'operational efficiency'];
}

function generateSections(
  account: AccountJSON,
  dossier: DossierData | null,
  top10: DossierData | null,
  personas: PersonaJSON[]
): string {
  const data = dossier || top10;
  const vertical = mapVertical(account.vertical);
  const accountName = account.name;
  const personaNames = personas.slice(0, 3).map(p => p.name.split(' ')[0]);

  // Vertical-specific proof differentiation
  const proofVerticalLabel = account.custom_proof_attribution
    || (vertical === 'cpg' || vertical === 'beverage'
    ? 'National CPG/Beverage Manufacturer'
    : vertical === 'automotive' || vertical === 'heavy-equipment'
    ? 'Major Industrial Manufacturer'
    : vertical === 'retail' || vertical === 'grocery'
    ? 'National Retail Distributor'
    : vertical === 'logistics-3pl'
    ? 'National 3PL Provider'
    : 'Fortune 500 Manufacturer');
  const proofQuoteText = account.custom_proof_quote
    || (vertical === 'cpg' || vertical === 'beverage'
    ? 'It is accurate that your software has enabled us to take on additional volume while remaining headcount neutral in the dock office. That was an integral part of our strategy and has been proven.'
    : vertical === 'retail' || vertical === 'grocery'
    ? 'The yard used to be where we lost visibility. Now it is where we gain control over every trailer in the network. The dock office runs itself.'
    : vertical === 'automotive' || vertical === 'heavy-equipment'
    ? 'When you are running a just-in-time line, the yard is the last mile you cannot afford to lose. YardFlow gave us that visibility and control back.'
    : vertical === 'logistics-3pl'
    ? 'Our customers see the difference. Carrier check-in went from 45 minutes to under 10. That changes the economics of every load we handle.'
    : 'It is accurate that your software has enabled us to take on additional volume while remaining headcount neutral in the dock office.');
  const testimonialQuote = account.custom_proof_quote
    || (vertical === 'cpg' || vertical === 'beverage'
    ? 'We believe system-driven dock door assignment will be a valuable next step for dock office optimization.'
    : vertical === 'retail' || vertical === 'grocery'
    ? 'Before YardFlow, we had 30 trailers in the yard and no idea which ones were loaded. Now every trailer has a status and a plan.'
    : vertical === 'automotive' || vertical === 'heavy-equipment'
    ? 'The production line does not care why the parts trailer is late. YardFlow makes sure it is never late because of the yard.'
    : vertical === 'logistics-3pl'
    ? 'We went from managing yards on whiteboards to managing them on screens. The difference is not cosmetic. It is operational.'
    : 'We believe system-driven dock door assignment will be a valuable next step for dock office optimization.');

  // Build pain points from research, enrichment, or derive from account data
  const enrichedPainPoints = (account.specific_pain_points || []).map(pp => ({
    ...pp,
    headline: cleanPainPointHeadline(pp.headline),
    description: cleanMarkdownArtifacts(pp.description),
  }));
  const painPoints = (data?.painPoints || []).map(pp => ({
    ...pp,
    headline: cleanPainPointHeadline(pp.headline),
    description: cleanMarkdownArtifacts(pp.description),
  }));
  // Use enriched pain points first, then dossier, then empty
  const effectivePainPoints = enrichedPainPoints.length > 0 ? enrichedPainPoints : painPoints;
  const recentNews = data?.recentNews || [];
  const yardAngle = cleanMarkdownArtifacts(data?.yardFlowAngle || account.primo_angle);

  // ── Hero ──
  let heroHeadline: string;
  if (account.custom_hero) {
    heroHeadline = account.custom_hero;
  } else if (effectivePainPoints[0]) {
    heroHeadline = `${effectivePainPoints[0].headline}. That is a yard problem.`;
  } else {
    heroHeadline = `${accountName} moves thousands of trailers a day. The yard is where the math breaks down.`;
  }

  const heroSubheadline = yardAngle || account.primo_angle;

  // ── Problem section pain points ──
  const problemPainPoints = effectivePainPoints.length > 0
    ? effectivePainPoints.slice(0, 5).map((pp, i) => {
        const relevantPeople = personas.slice(0, 2).map(p => `'${slugify(accountName)}-${personSlug(p.name.split(' ').pop() || '')}'`);
        return `        {
          headline: '${escapeStr(pp.headline)}',
          description: '${escapeStr(pp.description)}',${pp.kpiImpact ? `\n          kpiImpact: '${escapeStr(pp.kpiImpact)}',` : ''}${pp.source ? `\n          source: '${escapeStr(pp.source)}',` : ''}
          relevantPeople: [${relevantPeople.join(', ')}],
        }`;
      }).join(',\n')
    : `        {
          headline: 'Yard execution variance across facilities',
          description: '${escapeStr(accountName)} operates multiple facilities, each running its own yard protocol. Different gate processes, different dock assignment methods, different tribal knowledge. The variance compounds into millions in hidden costs.',
          relevantPeople: [],
        },
        {
          headline: 'Detention and dwell cost accumulation',
          description: 'Every minute a trailer waits at the gate or dock compounds across ${escapeStr(accountName)}\\'s facility network. Carrier detention, driver dwell, and dock contention are distributed across dozens of GL codes.',
          relevantPeople: [],
        },
        {
          headline: 'Peak season yard collapse',
          description: 'Yards designed for average throughput cannot handle peak demand. When volume surges, the yard becomes the bottleneck that the rest of the supply chain feels.',
          relevantPeople: [],
        }`;

  // ── stakes ──
  const stakesNarrative = effectivePainPoints.length >= 2
    ? `${effectivePainPoints[0].description} Meanwhile, ${effectivePainPoints[1].description.charAt(0).toLowerCase() + effectivePainPoints[1].description.slice(1)}`
    : `${accountName}'s supply chain investments stop at the yard fence. The facility, the WMS, the TMS - all optimized. But the surface between the gate and the dock door still runs on manual processes.`;

  const costBreakdownItems = [
    { label: 'Carrier detention / demurrage', value: vertical === 'cpg' || vertical === 'beverage' ? '$4M+' : '$2M+' },
    { label: 'Dock contention and turn time excess', value: vertical === 'cpg' || vertical === 'beverage' ? '$3M+' : '$2M+' },
    { label: 'Gate and spotter labor overhead', value: '$2M+' },
    { label: 'Peak season surge inefficiency', value: '$1M+' },
  ];

  const totalCost = vertical === 'cpg' || vertical === 'beverage' ? '$10M-$15M' : '$5M-$8M';

  // ── solution ──
  const solutionModules = SOLUTION_MODULES.slice(0, 4).map(m => {
    const customRelevance = account.custom_module_relevance?.[m.id];
    const relevance = customRelevance || `Standardizes ${m.verb.toLowerCase()} across ${accountName}'s facility network.`;
    return `        { id: '${m.id}', name: '${m.name}', verb: '${m.verb}', shortDescription: '${escapeStr(m.shortDescription)}', relevanceToAccount: '${escapeStr(relevance)}' }`;
  });

  // ── network ──
  const facilityCount = data?.facilityCount || account.facility_count || (account.icp_fit >= 4 ? '20+' : '10+');
  const dailyMoves = data?.dailyTrailerMoves || account.daily_trailer_moves || '1,000+';
  const facilityTypes = account.facility_types
    ? account.facility_types.map(t => `'${escapeStr(t)}'`).join(', ')
    : `'Manufacturing Plants', 'Distribution Centers'`;
  const fleet = data?.fleet || account.fleet_profile || 'Mix of private fleet, contract carriers, and 3PL';

  // ── ROI ──
  const roiSavings = vertical === 'cpg' || vertical === 'beverage' ? '$10M-$15M' : '$5M-$8M';

  // ── Build news items for signals ──
  const newsItems = recentNews.length > 0
    ? recentNews.slice(0, 4).map(n => `      '${escapeStr(n)}',`).join('\n')
    : `      '${escapeStr(account.why_now)}',`;

  return `  sections: [
    {
      type: 'hero',
      headline: '${escapeStr(heroHeadline)}',
      subheadline: '${escapeStr(heroSubheadline)}',
      accountCallout: '${escapeStr(accountName)} - ${escapeStr(account.vertical)}',
      backgroundTheme: 'dark',
      cta: {
        type: '${account.modex_signal >= 4 ? 'modex-meeting' : 'meeting'}',
        headline: 'See what a standardized yard network looks like for ${escapeStr(accountName)}',
        subtext: '30-minute walk-through of your facility network with board-ready ROI.',
        buttonLabel: '${account.modex_signal >= 4 ? 'Book a Meeting at MODEX' : 'Book a Network Audit'}',
        calendarLink: BOOKING_LINK,
      },
    },
    {
      type: 'problem',
      sectionLabel: 'The Hidden Constraint',
      headline: '${account.custom_problem_headline ? escapeStr(account.custom_problem_headline) : `The yard is where ${escapeStr(accountName)}\\'s supply chain math breaks down`}',
      narrative: '${escapeStr(yardAngle)}',
      painPoints: [
${problemPainPoints}
      ],
    },
    {
      type: 'stakes',
      sectionLabel: 'What This Costs You',
      headline: 'The math ${escapeStr(accountName)} is not tracking in one place',
      narrative: '${escapeStr(stakesNarrative)}',
      annualCost: '${totalCost} in estimated yard-driven inefficiency across the network',
      costBreakdown: [
${costBreakdownItems.map(c => `        { label: '${escapeStr(c.label)}', value: '${c.value}' },`).join('\n')}
      ],
      urgencyDriver: '${escapeStr(account.why_now)}',
    },
    {
      type: 'solution',
      sectionLabel: 'The Fix',
      headline: 'One protocol across every ${escapeStr(accountName)} yard',
      narrative: 'YardFlow replaces the patchwork of local yard practices with a single standardized operating protocol. Same driver journey at every facility. same dock assignment logic. Variance dies. Throughput becomes calculable.',
      modules: [
${solutionModules.join(',\n')},
      ],
      accountFit: '${escapeStr(account.primo_angle)}',
    },
    {
      type: 'proof',
      sectionLabel: 'Proof from Live Deployment',
      headline: 'Running today across 24 facilities',
      blocks: [
        {
          type: 'metric',
          stats: [
            { value: '24', label: 'Facilities Live', context: 'Running the full YardFlow protocol at comparable ${escapeStr(account.vertical.toLowerCase())} operations' },
            { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout across similar verticals' },
            { value: '48-to-24', label: 'Min Truck Turn Time', context: 'Average improvement in drop-hook cycle' },
            { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured at ${escapeStr(account.vertical.toLowerCase())} facilities' },
          ],
        },
        {
          type: 'quote',
          quote: {
            text: '${escapeStr(proofQuoteText)}',
            role: 'Operations Director',
            company: '${escapeStr(proofVerticalLabel)}',
          },
        },
      ],
    },
    {
      type: 'network-map',
      sectionLabel: 'Your Network',
      headline: '${escapeStr(accountName)}\\'s yard network at scale',
      narrative: 'Every one of these facilities runs its own yard protocol today. Different gate processes, different spotter dispatch methods, different tribal knowledge. YardFlow gives you one standard across all of them.',
      facilityCount: '${escapeStr(facilityCount)}',
      facilityTypes: [${facilityTypes}],
      geographicSpread: 'North America',
      dailyTrailerMoves: '${escapeStr(dailyMoves)} across the network',
    },
    {
      type: 'roi',
      sectionLabel: 'The Business Case',
      headline: 'Conservative ROI model for ${escapeStr(accountName)}',
      narrative: 'Based on measured YardFlow improvements at comparable operations.',
      roiLines: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '-50%', unit: 'minutes' },
        { label: 'Carrier detention per facility', before: '$80K/yr', after: '$40K/yr', delta: '-$40K', unit: 'per site' },
        { label: 'Gate labor per facility', before: '2.5 FTE', after: '1.5 FTE', delta: '-1 FTE', unit: 'per site' },
        { label: 'Dock utilization', before: '65%', after: '85%', delta: '+20 pts', unit: 'utilization' },
      ],
      totalAnnualSavings: '${roiSavings} across the network',
      paybackPeriod: '< 6 months',
      methodology: 'Based on measured results at 24 live facilities extrapolated to ${escapeStr(accountName)} facility count and operational profile.',
    },
    {
      type: 'testimonial',
      sectionLabel: 'From an Operator Who Runs It',
      quote: '${escapeStr(testimonialQuote)}',
      role: 'Operations Director',
      company: '${escapeStr(proofVerticalLabel)}',
      context: 'After 12 months of full YardFlow deployment across their facility network.',
    },
    {
      type: 'cta',
      cta: {
        type: '${account.modex_signal >= 4 ? 'modex-meeting' : 'meeting'}',
        headline: 'See what a standardized yard network looks like for ${escapeStr(accountName)}',
        subtext: 'We map your top 3 facilities, identify the throughput constraint, and build a board-ready rollout plan.',
        buttonLabel: '${account.modex_signal >= 4 ? 'Book a Meeting at MODEX' : 'Book a Network Audit'}',
        calendarLink: BOOKING_LINK,
      },
      closingLine: 'One conversation. Your yard network. A clear path to ${roiSavings} in annual savings.',
    },
  ],`;
}

function generateAccountFile(
  account: AccountJSON,
  personas: PersonaJSON[],
  standaloneDossier: DossierData | null,
  top10Dossier: DossierData | null,
  tier: QualityTier
): string {
  const slug = slugify(account.name);
  const vertical = mapVertical(account.vertical);
  const band = account.priority_band || inferBandFromScore(account.priority_score);
  const dossier = standaloneDossier || top10Dossier;
  const painPoints = dossier?.painPoints || [];
  const recentNews = dossier?.recentNews || [];
  const varName = slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

  // Generate person profiles
  const personProfiles = personas.map(p => generatePersonProfile(p, dossier));

  // Generate person variants (only for contacts with enough data)
  const personVariantStrings: string[] = [];
  for (const p of personas) {
    const variant = generatePersonVariant(p, account, dossier, painPoints);
    if (variant) personVariantStrings.push(variant);
  }

  // Section generation
  const sections = generateSections(account, standaloneDossier, top10Dossier, personas);

  // Proof blocks — differentiated by vertical and dossier availability
  const proofContextNote = painPoints.length > 0
    ? `Measured at comparable ${account.vertical.toLowerCase()} operations`
    : 'Measured across live deployments';
  const proofVerticalLabel = account.custom_proof_attribution
    || (vertical === 'cpg' || vertical === 'beverage'
    ? 'National CPG/Beverage Manufacturer'
    : vertical === 'automotive' || vertical === 'heavy-equipment'
    ? 'Major Industrial Manufacturer'
    : vertical === 'retail' || vertical === 'grocery'
    ? 'National Retail Distributor'
    : vertical === 'logistics-3pl'
    ? 'National 3PL Provider'
    : 'Fortune 500 Manufacturer');
  const proofQuoteText = account.custom_proof_quote
    || (vertical === 'cpg' || vertical === 'beverage'
    ? 'It is accurate that your software has enabled us to take on additional volume while remaining headcount neutral in the dock office.'
    : vertical === 'retail' || vertical === 'grocery'
    ? 'The yard used to be where we lost visibility. Now it is where we gain control over every trailer in the network.'
    : vertical === 'automotive' || vertical === 'heavy-equipment'
    ? 'When you are running a just-in-time line, the yard is the last mile you cannot afford to lose. YardFlow gave us that back.'
    : vertical === 'logistics-3pl'
    ? 'Our customers see the difference. Carrier check-in went from 45 minutes to under 10. That changes the economics of every load.'
    : 'It is accurate that your software has enabled us to take on additional volume while remaining headcount neutral in the dock office.');

  const proofBlocks = `  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live', context: '${proofContextNote}' },
        { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout across comparable verticals' },
        { value: '48-to-24', label: 'Min Truck Turn Time', context: 'Average improvement in drop-hook cycle' },
        { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured at ${escapeStr(account.vertical.toLowerCase())} facilities' },
      ],
    },
    {
      type: 'quote',
      quote: {
        text: '${escapeStr(proofQuoteText)}',
        role: 'Operations Director',
        company: '${escapeStr(proofVerticalLabel)}',
      },
    },
  ],`;

  // Network
  const facilityCount = dossier?.facilityCount || account.facility_count || (account.icp_fit >= 4 ? '20+' : '10+');
  const dailyMoves = dossier?.dailyTrailerMoves || account.daily_trailer_moves || '1,000+';
  const fleet = dossier?.fleet || account.fleet_profile || 'Contract carriers and 3PL';

  // Facility types
  const accountFacilityTypes = account.facility_types
    ? account.facility_types.map(t => `'${escapeStr(t)}'`).join(', ')
    : `'Manufacturing Plants', 'Distribution Centers'`;

  // Freight profile
  const primaryModes = vertical === 'cpg' || vertical === 'beverage'
    ? "['Truckload', 'Intermodal/Rail', 'LTL']"
    : vertical === 'heavy-equipment'
    ? "['Flatbed', 'Specialized/Heavy Haul', 'Parts LTL']"
    : vertical === 'retail'
    ? "['Truckload', 'LTL', 'Intermodal']"
    : "['Truckload', 'LTL']";

  // News items
  const newsItems = recentNews.length > 0
    ? recentNews.slice(0, 5).map(n => `      '${escapeStr(n)}',`).join('\n')
    : `      '${escapeStr(account.why_now)}',`;

  const parentBrand = account.parent_brand ? `\n  parentBrand: '${escapeStr(account.parent_brand)}',` : '';
  const tierStr = account.tier || `Tier ${band === 'A' ? '1' : band === 'B' ? '2' : '3'}`;

  return `/**
 * ${account.name} — ABM Microsite Data
 * Quality Tier: ${tier}
 * Generated by scripts/generate-microsite-data.ts
 * 
 * Sources:${standaloneDossier ? '\n *   - Standalone executive dossier (deep research)' : ''}${top10Dossier ? '\n *   - Top-10 research dossier (medium research)' : ''}
 *   - accounts.json (priority scoring, signals)
 *   - personas.json (${personas.length} named contacts)
 */

import type { AccountMicrositeData } from '../schema';

const BOOKING_LINK = '${BOOKING_LINK}';

export const ${varName}: AccountMicrositeData = {
  slug: '${slug}',
  accountName: '${escapeStr(account.name)}',${parentBrand}
  vertical: '${vertical}',
  tier: '${escapeStr(tierStr)}',
  band: '${band}',
  priorityScore: ${account.priority_score},

  pageTitle: 'YardFlow for ${escapeStr(account.name)} - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across ${escapeStr(account.name)}\\'s facility network.',

${sections}

  people: [
${personProfiles.length > 0 ? personProfiles.join(',\n') + ',' : ''}
  ],

  personVariants: [
${personVariantStrings.length > 0 ? personVariantStrings.join(',\n') + ',' : ''}
  ],

${proofBlocks}

  network: {
    facilityCount: '${escapeStr(facilityCount)}',
    facilityTypes: [${accountFacilityTypes}],
    geographicSpread: 'North America',
    dailyTrailerMoves: '${escapeStr(dailyMoves)} across network',
    fleet: '${escapeStr(fleet)}',
  },

  freight: {
    primaryModes: ${primaryModes},
    avgLoadsPerDay: '${escapeStr(dailyMoves)}',
    peakSeason: '${escapeStr(account.why_now || 'Seasonal peaks')}',
  },

  signals: {
    modexAttendance: '${escapeStr(account.signal_type || 'MODEX 2026 attendee signal')}',
    recentNews: [
${newsItems}
    ],
    supplyChainInitiatives: ['${escapeStr(account.primo_angle)}'],
    urgencyDriver: '${escapeStr(account.why_now)}',
  },

  theme: {
    accentColor: '${account.accent_color_override || inferAccentColor(vertical)}',
    backgroundVariant: 'dark',
  },
${account.showcase ? `\n  showcase: true,\n  showcaseOrder: ${account.showcase_order || 99},` : ''}
${account.layout_preset ? `  layoutPreset: '${escapeStr(account.layout_preset)}',` : ''}
};
`;
}

function inferAccentColor(vertical: string): string {
  switch (vertical) {
    case 'cpg': return '#2563EB';
    case 'beverage': return '#7C3AED';
    case 'retail': return '#059669';
    case 'automotive': return '#DC2626';
    case 'heavy-equipment': return '#D97706';
    case 'industrial': return '#4B5563';
    case 'logistics-3pl': return '#0891B2';
    case 'grocery': return '#16A34A';
    default: return '#06B6D4';
  }
}

// ── Index File Generation ─────────────────────────────────────────────

function generateIndexFile(accounts: { slug: string; varName: string; fileName: string }[]): string {
  const imports = accounts.map(a =>
    `import { ${a.varName} } from './${a.fileName}';`
  ).join('\n');

  const entries = accounts.map(a =>
    `  '${a.slug}': ${a.varName},`
  ).join('\n');

  return `/**
 * ABM Microsite Factory — Account Data Index
 *
 * Central registry for all account microsite data files.
 * Auto-generated by scripts/generate-microsite-data.ts
 */

import type { AccountMicrositeData } from '../schema';

${imports}

const ACCOUNTS: Record<string, AccountMicrositeData> = {
${entries}
};

export function getAccountMicrositeData(slug: string): AccountMicrositeData | null {
  return ACCOUNTS[slug] ?? null;
}

export function getAllMicrositeSlugs(): string[] {
  return Object.keys(ACCOUNTS);
}

export function getAllAccountMicrositeData(): AccountMicrositeData[] {
  return Object.values(ACCOUNTS);
}
`;
}

// ── Dannon Special Case ──────────────────────────────────────────────

function generateDannonFile(personas: PersonaJSON[], realAccount: AccountJSON): string {
  // Dannon is WARM INTRO ONLY via Mark Shaughnessy - NEVER cold email

  // Generate person variants for Dannon (was previously hardcoded empty)
  const dannonAccount: AccountJSON = {
    name: 'Dannon',
    vertical: 'CPG',
    priority_score: 95,
    priority_band: 'A',
    icp_fit: 5,
    modex_signal: 4,
    primo_angle: 'When the cold chain breaks in the yard, Danone does not lose product. It loses shelf days.',
    why_now: 'Warm intro via Mark Shaughnessy and likely MODEX attendance',
    warm_intro: 'Mark Shaughnessy',
    strategic_value: 'Showcase CPG deployment',
    meeting_ease: 3,
    custom_hero: 'Every Danone facility runs its own yard protocol. YardFlow makes them run one.',
    person_hero_overrides: realAccount.person_hero_overrides,
  } as AccountJSON;

  const dannonPainPoints = [
    { headline: 'Fresh product shelf life shrinks in every minute of yard delay', description: 'Dairy and plant-based products lose margin value with every hour of excess dwell time at the dock.', kpiImpact: '-2-4 shelf days per incident' },
    { headline: 'No unified yard visibility across 15+ facilities', description: 'Each plant runs its own dock scheduling and trailer tracking. No network-level view of yard operations.', kpiImpact: '0% cross-facility optimization' },
  ];

  const dannonVariants: string[] = [];
  for (const p of personas) {
    const variant = generatePersonVariant(p, dannonAccount, null, dannonPainPoints);
    if (variant) {
      // Override CTA for warm-intro only
      const warmCTA = variant.replace(
        /ctaOverride:\s*\{[^}]*\}/s,
        `ctaOverride: {
        type: 'warm-intro',
        headline: '${p.name.split(' ')[0]}, this conversation is routed through Mark Shaughnessy',
        subtext: 'A trusted mutual connection. 30 minutes to walk Danone\\'s yard network with Casey.',
        buttonLabel: 'Request an Introduction',
        calendarLink: BOOKING_LINK,
        personName: '${escapeStr(p.name.split(' ')[0])}',
        personContext: 'Warm intro via Mark Shaughnessy',
      }`
      );
      dannonVariants.push(warmCTA);
    }
  }

  return `/**
 * Dannon (Danone North America) — ABM Microsite Data
 * Quality Tier: B
 * WARM INTRO ONLY — via Mark Shaughnessy
 * NEVER cold email or cold outreach
 * 
 * Generated by scripts/generate-microsite-data.ts
 * Sources:
 *   - accounts.json (priority scoring, signals)
 *   - personas.json (${personas.length} named contacts)
 */

import type { AccountMicrositeData } from '../schema';

const BOOKING_LINK = '${BOOKING_LINK}';

export const dannon: AccountMicrositeData = {
  slug: 'dannon',
  accountName: 'Dannon',
  parentBrand: 'Danone North America',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 95,

  pageTitle: 'YardFlow for Danone North America - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across Danone North America\\'s production and distribution network.',

  sections: [
    {
      type: 'hero',
      headline: 'Fresh dairy has a 14-day shelf clock. Every hour your trailers wait in the yard is product life you never get back.',
      subheadline: 'Danone runs 15+ North American production facilities across dairy, plant-based, medical nutrition, and water. Four temperature profiles competing for dock doors at every multi-category facility. YardFlow standardizes the yard across all of them.',
      accountCallout: 'Danone North America - Fresh Dairy, Plant-Based, Medical Nutrition, Waters',
      backgroundTheme: 'dark',
      cta: {
        type: 'meeting',
        headline: 'See what a standardized yard looks like for Danone',
        subtext: '30-minute walk-through of your facility network with board-ready ROI. Routed through Mark Shaughnessy.',
        buttonLabel: 'Request an Introduction',
        calendarLink: BOOKING_LINK,
      },
    },
    {
      type: 'problem',
      sectionLabel: 'The Hidden Constraint',
      headline: 'The yard is where Danone\\'s product freshness commitment breaks down',
      narrative: 'Danone North America produces fresh dairy, plant-based products, and medical nutrition - all with tight shelf life windows. When a refrigerated trailer sits an extra 30 minutes in the yard during summer, product quality degrades. The yard is not just a logistics problem. It is a quality problem.',
      painPoints: [
        {
          headline: 'Temperature-controlled yard dwell erodes shelf life',
          description: 'Danone moves fresh and chilled dairy products across 15+ plants. Reefer trailers sitting in yards without visibility into dock readiness means product shelf life burns before the case is even picked. At dairy margins, that dwell is measurable in shrink dollars.',
          kpiImpact: '$3M-$5M in annual shrink exposure from excess yard dwell across the fresh network',
          relevantPeople: ['P-001', 'P-002'],
        },
        {
          headline: 'Plant-level yard protocols fragment cross-facility visibility',
          description: 'Each Danone production facility runs its own gate, dock, and spotter coordination. When the White Plains supply chain team wants a network view of trailer utilization or dock throughput, they are stitching together spreadsheets from 15 different local teams.',
          kpiImpact: 'Zero real-time network visibility across the yard layer',
          relevantPeople: ['P-001', 'P-003'],
        },
        {
          headline: 'Carrier detention costs compound across the fresh network',
          description: 'Fresh dairy carriers operate on tight appointment windows. When dock contention pushes wait times past the threshold, detention charges hit every facility individually. No one is tracking the aggregate network-level carrier cost.',
          kpiImpact: '$2M+ in annual detention and accessorial charges across the network',
          relevantPeople: ['P-002', 'P-004'],
        },
      ],
    },
    {
      type: 'stakes',
      sectionLabel: 'What This Costs You',
      headline: 'The freshness math Danone is not tracking in one place',
      narrative: 'Every minute of excess yard dwell time at a Danone facility is a minute off product shelf life. Across 15+ facilities producing perishable goods, that time compounds into quality events, carrier dissatisfaction, and hidden costs distributed across dozens of GL codes.',
      annualCost: '$5M-$8M in estimated yard-driven inefficiency across the North America network',
      costBreakdown: [
        { label: 'Product shrink from yard dwell on perishables', value: '$3M-$5M' },
        { label: 'Carrier detention / demurrage across fresh network', value: '$2M+' },
        { label: 'Gate and spotter labor overhead (15+ facilities)', value: '$1M+' },
        { label: 'Temperature-zone dock misassignment events', value: '$500K+' },
      ],
      urgencyDriver: 'Fresh dairy and plant-based products have zero tolerance for yard-induced delays. Every season compounds the problem.',
    },
    {
      type: 'solution',
      sectionLabel: 'The Fix',
      headline: 'One protocol across every Danone yard',
      narrative: 'YardFlow replaces the patchwork of local yard practices with a single standardized operating protocol. Temperature-zone dock assignment enforced automatically. Freshness-critical loads prioritized. Same driver journey at every facility.',
      modules: [
        { id: 'flowDRIVER', name: 'flowDRIVER', verb: 'Verify', shortDescription: 'Digital driver check-in to check-out. QR + wallet ID verification, algorithmic lane direction.', relevanceToAccount: 'Standardizes the gate process across 15+ Danone facilities.' },
        { id: 'flowSPOTTER', name: 'flowSPOTTER', verb: 'Execute', shortDescription: 'Spotter app for move execution and task queues. Temperature-zone aware.', relevanceToAccount: 'Enforces temp-zone dock assignment. Fresh dairy goes to refrigerated. Every time.' },
        { id: 'flowTWIN', name: 'flowTWIN', verb: 'Map', shortDescription: 'Digital twin of the yard. Real-time trailer location, dwell, and lane state.', relevanceToAccount: 'Visibility into dwell time for perishable loads. Freshness clock starts in the yard.' },
        { id: 'flowNETWORK', name: 'flowNETWORK', verb: 'Scale', shortDescription: 'Network-wide command view with alerting and cross-site performance intelligence.', relevanceToAccount: 'One view across all Danone North America yard operations.' },
      ],
      accountFit: 'Primo proof should land hardest here because both are high-volume food / beverage-style networks with plant throughput pressure.',
    },
    {
      type: 'proof',
      sectionLabel: 'Proof from Live Deployment',
      headline: 'Running today across 24 facilities',
      blocks: [
        {
          type: 'metric',
          stats: [
            { value: '24', label: 'Facilities Live', context: 'Running the full YardFlow protocol today' },
            { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout' },
            { value: '48-to-24', label: 'Min Truck Turn Time', context: 'Average improvement in drop-hook cycle' },
            { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured across live deployments' },
          ],
        },
        {
          type: 'quote',
          quote: {
            text: 'It is accurate that your software has enabled us to take on additional volume while remaining headcount neutral in the dock office.',
            role: 'Operations Director',
            company: 'National CPG/Beverage Manufacturer',
          },
        },
      ],
    },
    {
      type: 'network-map',
      sectionLabel: 'Your Network',
      headline: 'Danone North America\\'s yard network',
      narrative: 'Every facility runs its own yard protocol today. YardFlow gives Danone one standard across all of them - with temperature-zone intelligence built in.',
      facilityCount: '15+',
      facilityTypes: ['Dairy Production', 'Plant-Based Production', 'Water Operations', 'Distribution Centers'],
      geographicSpread: 'North America',
      dailyTrailerMoves: '1,000+ across the network',
    },
    {
      type: 'roi',
      sectionLabel: 'The Business Case',
      headline: 'Conservative ROI model for Danone North America',
      narrative: 'Based on measured YardFlow improvements at comparable fresh food/beverage operations.',
      roiLines: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '-50%', unit: 'minutes' },
        { label: 'Carrier detention per facility', before: '$80K/yr', after: '$40K/yr', delta: '-$40K', unit: 'per site' },
        { label: 'Temp-zone dock errors', before: '3-5/week', after: '<1/week', delta: '-80%', unit: 'per facility' },
        { label: 'Gate labor per facility', before: '2.5 FTE', after: '1.5 FTE', delta: '-1 FTE', unit: 'per site' },
      ],
      totalAnnualSavings: '$5M-$8M across the network',
      paybackPeriod: '< 6 months',
      methodology: 'Based on measured results at 24 live CPG facilities extrapolated to Danone facility count and operational profile.',
    },
    {
      type: 'testimonial',
      sectionLabel: 'From an Operator Who Runs It',
      quote: 'It is accurate that your software has enabled us to take on additional volume while remaining headcount neutral in the dock office.',
      role: 'Operations Director',
      company: 'National CPG/Beverage Manufacturer',
      context: 'After 12 months of full YardFlow deployment across their facility network.',
    },
    {
      type: 'cta',
      cta: {
        type: 'meeting',
        headline: 'Danone is a warm introduction through Mark Shaughnessy',
        subtext: 'This conversation is routed through a trusted mutual connection. 30 minutes to walk your yard network.',
        buttonLabel: 'Request an Introduction',
        calendarLink: BOOKING_LINK,
      },
      closingLine: 'One conversation. Your yard network. A clear path to $5M+ in annual freshness-protected savings.',
    },
  ],

  people: [
${personas.length > 0 ? personas.map(p => generatePersonProfile(p, null)).join(',\n') + ',' : ''}
  ],

  personVariants: [
${dannonVariants.length > 0 ? dannonVariants.join(',\n') + ',' : ''}
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live' },
        { value: '>200', label: 'Contracted Network' },
        { value: '48-to-24', label: 'Min Truck Turn Time' },
        { value: '$1M+', label: 'Per-Site Profit Impact' },
      ],
    },
    {
      type: 'quote',
      quote: {
        text: 'It is accurate that your software has enabled us to take on additional volume while remaining headcount neutral in the dock office.',
        role: 'Operations Director',
        company: 'National CPG/Beverage Manufacturer',
      },
    },
  ],

  network: {
    facilityCount: '15+',
    facilityTypes: ['Dairy Production', 'Plant-Based Production', 'Water Operations', 'Distribution Centers'],
    geographicSpread: 'North America',
    dailyTrailerMoves: '1,000+ across network',
    fleet: 'Contract carriers and 3PL',
  },

  freight: {
    primaryModes: ['Truckload', 'Refrigerated', 'LTL'],
    avgLoadsPerDay: '1,000+',
    peakSeason: 'Year-round fresh dairy production',
    specialRequirements: ['Temperature-controlled (multiple zones)', 'Fresh product shelf life sensitivity'],
  },

  signals: {
    modexAttendance: 'Past attendee list signal',
    recentNews: [
      'Active Shaughnessy intro path and likely MODEX attendance signal',
    ],
    supplyChainInitiatives: ['Primo proof should land hardest here - high-volume food/beverage network with plant throughput pressure'],
    urgencyDriver: 'Active Shaughnessy intro path and likely MODEX attendance signal.',
  },

  theme: {
    accentColor: '#059669',
    backgroundVariant: 'dark',
  },

  showcase: true,
  showcaseOrder: 1,
  layoutPreset: 'partnership',
};
`;
}

// ── Helpers ────────────────────────────────────────────────────────────

function countVariants(
  personas: PersonaJSON[],
  standaloneDossier: DossierData | null,
  top10Dossier: DossierData | null
): number {
  return personas.filter(p => {
    const dossier = standaloneDossier || top10Dossier;
    const hasDossierMatch = dossier?.contactName &&
      p.name.toLowerCase().includes((dossier.contactName.split(' ').pop() || '___').toLowerCase());
    const isExecSponsor = p.persona_lane === 'Exec sponsor' || p.role_in_deal === 'Exec sponsor';
    const isSenior = p.seniority?.includes('C-level') || p.seniority?.includes('SVP') || p.seniority?.includes('President');
    const hasEmail = p.email && p.email !== 'None';
    return (hasDossierMatch || isExecSponsor || isSenior) && hasEmail;
  }).length;
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log('=== ABM Microsite Factory — Data Generator ===\n');

  // Load data sources
  const accounts = loadAccounts();
  const allPersonas = loadPersonas();
  const top10Content = fs.existsSync(TOP10_DOC) ? fs.readFileSync(TOP10_DOC, 'utf-8') : '';

  console.log(`Loaded: ${accounts.length} accounts, ${allPersonas.length} personas`);
  console.log(`Top-10 dossier: ${top10Content ? 'found' : 'not found'}`);
  console.log(`Standalone dossiers: ${fs.existsSync(DOSSIERS_DIR) ? fs.readdirSync(DOSSIERS_DIR).filter(f => f.endsWith('.md')).length : 0}\n`);

  // Hand-crafted files we preserve (NOT regenerating)
  const PRESERVE = new Set(['general-mills', 'frito-lay', 'ab-inbev', 'coca-cola']);

  const results: GeneratedAccount[] = [];
  const allAccountEntries: { slug: string; varName: string; fileName: string }[] = [];

  // Track preserved hand-crafted accounts for the index
  for (const hc of Array.from(PRESERVE)) {
    const varName = hc.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    allAccountEntries.push({ slug: hc, varName, fileName: hc });
  }

  // ── Phase 1: Process accounts.json ──────────────────────────────────
  for (const account of accounts) {
    const slug = slugify(account.name);

    if (PRESERVE.has(slug)) {
      console.log(`KEEP  ${account.name} (hand-crafted)`);
      continue;
    }

    const personas = allPersonas.filter(p => p.account === account.name);
    const standaloneDossier = findDossierForAccount(account.name);
    const top10Dossier = findTop10ForAccount(account.name, top10Content);

    const tier = assessTier(account, personas, standaloneDossier, top10Dossier);

    let fileContent: string;
    if (account.name === 'Dannon') {
      fileContent = generateDannonFile(personas, account);
    } else {
      fileContent = generateAccountFile(account, personas, standaloneDossier, top10Dossier, tier);
    }

    const filePath = path.join(OUTPUT_DIR, `${slug}.ts`);
    fs.writeFileSync(filePath, fileContent, 'utf-8');

    const varName = slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    allAccountEntries.push({ slug, varName, fileName: slug });

    const personVariantCount = countVariants(personas, standaloneDossier, top10Dossier);

    results.push({
      slug, name: account.name, tier, personVariantCount,
      personCount: personas.length,
      filePath: `src/lib/microsites/accounts/${slug}.ts`,
    });
    console.log(`GEN   ${account.name} → ${slug}.ts | Tier ${tier} | ${personas.length} people | ${personVariantCount} variants`);
  }

  // ── Phase 2: Dossier-only accounts (not in accounts.json) ──────────
  // These are accounts from standalone research dossiers + top-10 doc
  // that are NOT in the 20 accounts.json but have deep research.
  const DOSSIER_ACCOUNTS: { name: string; vertical: string; dossierFile?: string; top10Num?: number }[] = [
    { name: "Campbell's", vertical: 'Food & Beverage', dossierFile: 'dan-poland-campbells-dossier.md', top10Num: 3 },
    { name: 'Constellation Brands', vertical: 'Beverage', dossierFile: 'john-kester-constellation-brands-dossier.md', top10Num: 4 },
    { name: 'Keurig Dr Pepper', vertical: 'Beverage', dossierFile: 'kelly-killingsworth-kdp-dossier.md', top10Num: 5 },
    { name: 'Mondelez International', vertical: 'Food & Beverage', dossierFile: 'claudio-parrotta-mondelez-dossier.md', top10Num: 7 },
    { name: 'Caterpillar', vertical: 'Heavy Equipment', top10Num: 8 },
    { name: 'Performance Food Group', vertical: 'Food & Beverage', top10Num: 10 },
    { name: 'Toyota', vertical: 'Manufacturing', dossierFile: 'chris-nielsen-toyota-dossier.md' },
    { name: 'Ford', vertical: 'Manufacturing', dossierFile: 'elizabeth-door-ford-dossier.md' },
  ];

  // Filter out accounts already processed
  const processedSlugs = new Set(allAccountEntries.map(a => a.slug));

  for (const da of DOSSIER_ACCOUNTS) {
    const slug = slugify(da.name);
    if (processedSlugs.has(slug)) continue;

    // Build a synthetic AccountJSON from dossier data
    const top10Dossier = da.top10Num ? parseTop10Section(top10Content, da.top10Num) : null;
    const standaloneDossier = da.dossierFile
      ? parseStandaloneDossier(path.join(DOSSIERS_DIR, da.dossierFile))
      : findDossierForAccount(da.name);

    const dossier = standaloneDossier || top10Dossier;
    if (!dossier) {
      console.log(`SKIP  ${da.name} (no dossier data found)`);
      continue;
    }

    // Build synthetic account record from dossier
    const syntheticAccount: AccountJSON = {
      name: da.name,
      vertical: da.vertical,
      priority_score: 75,
      priority_band: 'B',
      tier: 'Tier 2',
      primo_angle: dossier.yardFlowAngle || `YardFlow eliminates the yard bottleneck across ${da.name}'s facility network.`,
      why_now: dossier.recentNews[0] || `${da.name} is investing in supply chain transformation.`,
      signal_type: dossier.modexConnection ? 'MODEX proximity' : 'Past attendee list',
      icp_fit: 4,
      modex_signal: dossier.modexConnection ? 4 : 3,
      primo_story_fit: 4,
    };

    // Create a synthetic persona from dossier contact
    const syntheticPersonas: PersonaJSON[] = [];
    if (dossier.contactName && dossier.contactEmail) {
      syntheticPersonas.push({
        persona_id: `${slug}-001`,
        account: da.name,
        priority: 'P1',
        name: dossier.contactName,
        title: dossier.contactTitle,
        persona_lane: 'Exec sponsor',
        role_in_deal: 'Exec sponsor',
        intro_route: 'Direct outreach',
        function: 'Supply Chain / Operations',
        seniority: dossier.contactTitle.match(/Chief|President|EVP|SVP/) ? 'C-level / EVP' : 'VP',
        why_this_persona: dossier.background || `${da.name} supply chain leader`,
        linkedin_url: '',
        attendance_signal: dossier.modexConnection || '',
        intro_path: 'Direct outreach',
        persona_status: 'Research complete',
        next_step: 'Generate microsite and outreach',
        notes: '',
        account_score: 4,
        email: dossier.contactEmail,
        phone: '',
      });
    }

    const tier = assessTier(syntheticAccount, syntheticPersonas, standaloneDossier, top10Dossier);

    const fileContent = generateAccountFile(syntheticAccount, syntheticPersonas, standaloneDossier, top10Dossier, tier);
    const filePath = path.join(OUTPUT_DIR, `${slug}.ts`);
    fs.writeFileSync(filePath, fileContent, 'utf-8');

    const varName = slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    allAccountEntries.push({ slug, varName, fileName: slug });

    const personVariantCount = countVariants(syntheticPersonas, standaloneDossier, top10Dossier);

    results.push({
      slug, name: da.name, tier, personVariantCount,
      personCount: syntheticPersonas.length,
      filePath: `src/lib/microsites/accounts/${slug}.ts`,
    });
    console.log(`GEN   ${da.name} → ${slug}.ts | Tier ${tier} | ${syntheticPersonas.length} people | ${personVariantCount} variants | DOSSIER-SOURCE`);
  }

  // Sort entries for clean index file
  allAccountEntries.sort((a, b) => a.slug.localeCompare(b.slug));

  // Generate updated index.ts
  const indexContent = generateIndexFile(allAccountEntries);
  const indexPath = path.join(OUTPUT_DIR, 'index.ts');
  fs.writeFileSync(indexPath, indexContent, 'utf-8');
  console.log(`\nGEN   index.ts (${allAccountEntries.length} accounts registered)`);

  // Summary
  console.log('\n=== GENERATION SUMMARY ===\n');

  const tierA = results.filter(r => r.tier === 'A');
  const tierB = results.filter(r => r.tier === 'B');
  const tierC = results.filter(r => r.tier === 'C');
  const preserved = Array.from(PRESERVE);

  console.log(`Preserved hand-crafted:                 ${preserved.length} → ${preserved.join(', ')}`);

  console.log(`\nTier A (dossier-backed, shippable):     ${tierA.length}`);
  for (const r of tierA) console.log(`  ${r.name} (${r.personCount} people, ${r.personVariantCount} variants)`);

  console.log(`\nTier B (account-specific, solid):        ${tierB.length}`);
  for (const r of tierB) console.log(`  ${r.name} (${r.personCount} people, ${r.personVariantCount} variants)`);

  console.log(`\nTier C (structurally valid, not ready):  ${tierC.length}`);
  for (const r of tierC) console.log(`  ${r.name} (${r.personCount} people, ${r.personVariantCount} variants)`);

  const totalAccounts = preserved.length + results.length;
  console.log(`\nTotal account microsites: ${totalAccounts}`);
  console.log(`Total in index: ${allAccountEntries.length}`);
  console.log(`Total generated person variants: ${results.reduce((s, r) => s + r.personVariantCount, 0)}`);

  // ── QA GUARDRAILS ──────────────────────────────────────────────────
  console.log('\n=== QA GUARDRAILS ===\n');

  const GENERIC_HERO = 'moves thousands of trailers a day';
  const GENERIC_PROBLEM_PATTERNS = [
    'each running its own yard protocol',
    'operates multiple facilities, each running',
    'Peak season yard collapse',
    'Detention and dwell cost accumulation',
  ];

  let qaWarnings = 0;
  let qaFails = 0;

  for (const r of results) {
    const filePath = path.join(OUTPUT_DIR, `${r.slug}.ts`);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf-8');
    const warnings: string[] = [];

    // Check for generic hero
    if (content.includes(GENERIC_HERO)) {
      warnings.push('GENERIC HERO: default "moves thousands of trailers" headline');
    }

    // Check for generic problem section (all 3 boilerplate pain points)
    let genericProblemCount = 0;
    for (const pattern of GENERIC_PROBLEM_PATTERNS) {
      if (content.includes(pattern)) genericProblemCount++;
    }
    if (genericProblemCount >= 2) {
      warnings.push('GENERIC PROBLEM: 2+ boilerplate pain points detected');
    }

    // Check for zero people
    if (r.personCount === 0) {
      warnings.push('ZERO PEOPLE: no named contacts');
    }

    // Check for zero person variants
    if (r.personVariantCount === 0 && r.personCount > 0) {
      warnings.push('NO VARIANTS: has people but no person variant pages');
    }

    // Check for missing custom_hero in tier B/C
    if (r.tier !== 'A' && content.includes(GENERIC_HERO)) {
      warnings.push('PROMOTION BLOCKED: needs custom_hero or specific_pain_points in accounts.json');
    }

    if (warnings.length > 0) {
      qaWarnings += warnings.length;
      if (warnings.some(w => w.startsWith('GENERIC HERO') || w.startsWith('GENERIC PROBLEM'))) {
        qaFails++;
        console.log(`FAIL  ${r.name} (Tier ${r.tier})`);
      } else {
        console.log(`WARN  ${r.name} (Tier ${r.tier})`);
      }
      for (const w of warnings) {
        console.log(`      - ${w}`);
      }
    } else {
      console.log(`PASS  ${r.name} (Tier ${r.tier})`);
    }
  }

  // Also check hand-crafted files
  for (const slug of PRESERVE) {
    console.log(`SKIP  ${slug} (hand-crafted, not QA-checked by generator)`);
  }

  console.log(`\nQA Summary: ${qaFails} FAIL, ${qaWarnings} warnings, ${results.length - qaFails} pass`);
  if (qaFails > 0) {
    console.log(`\nTo fix FAILs: add custom_hero and/or specific_pain_points to accounts.json for flagged accounts.`);
  }

  // ── CROSS-ACCOUNT QA ───────────────────────────────────────────────
  console.log('\n=== CROSS-ACCOUNT QA ===\n');

  const heroHeadlines = new Map<string, string[]>();
  const ctaHeadlines = new Map<string, string[]>();
  const problemHeadlines = new Map<string, string[]>();

  for (const r of results) {
    const filePath = path.join(OUTPUT_DIR, `${r.slug}.ts`);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract hero headline
    const heroMatch = content.match(/type:\s*'hero'[\s\S]*?headline:\s*'([^']+)'/);
    if (heroMatch) {
      const hl = heroMatch[1];
      if (!heroHeadlines.has(hl)) heroHeadlines.set(hl, []);
      heroHeadlines.get(hl)!.push(r.name);
    }

    // Extract CTA headline
    const ctaMatch = content.match(/type:\s*'cta'[\s\S]*?headline:\s*'([^']+)'/);
    if (ctaMatch) {
      const cl = ctaMatch[1];
      if (!ctaHeadlines.has(cl)) ctaHeadlines.set(cl, []);
      ctaHeadlines.get(cl)!.push(r.name);
    }

    // Extract problem headline
    const probMatch = content.match(/type:\s*'problem'[\s\S]*?headline:\s*'([^']+)'/);
    if (probMatch) {
      const pl = probMatch[1];
      if (!problemHeadlines.has(pl)) problemHeadlines.set(pl, []);
      problemHeadlines.get(pl)!.push(r.name);
    }
  }

  let crossDupes = 0;
  for (const [headline, accts] of heroHeadlines) {
    if (accts.length > 1) {
      crossDupes++;
      console.log(`DUPE HERO: "${headline.substring(0, 60)}..." used by: ${accts.join(', ')}`);
    }
  }
  for (const [headline, accts] of ctaHeadlines) {
    if (accts.length > 1) {
      crossDupes++;
      console.log(`DUPE CTA: "${headline.substring(0, 60)}..." used by: ${accts.join(', ')}`);
    }
  }
  for (const [headline, accts] of problemHeadlines) {
    if (accts.length > 1) {
      crossDupes++;
      console.log(`DUPE PROBLEM: "${headline.substring(0, 60)}..." used by: ${accts.join(', ')}`);
    }
  }

  if (crossDupes === 0) {
    console.log('No cross-account headline duplicates detected.');
  } else {
    console.log(`\n${crossDupes} cross-account duplicates found.`);
  }

  // Showcase variant minimum check
  const showcaseAccounts = results.filter(r => {
    const acct = accounts.find(a => slugify(a.name) === r.slug);
    return acct?.showcase;
  });
  if (showcaseAccounts.length > 0) {
    console.log('\n=== SHOWCASE VARIANT CHECK ===\n');
    for (const s of showcaseAccounts) {
      if (s.personVariantCount < 2) {
        console.log(`WARN  ${s.name}: only ${s.personVariantCount} variant(s) — showcase accounts should have 2+`);
      } else {
        console.log(`PASS  ${s.name}: ${s.personVariantCount} variants`);
      }
    }
  }
}

main().catch(console.error);
