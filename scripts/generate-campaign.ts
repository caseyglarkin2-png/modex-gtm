/**
 * Campaign Generation Pipeline for MODEX 2026
 * 
 * Reads 102K contacts from all-contacts.csv
 * Filters to 500 ICP-relevant VP/Director/C-suite at shipper companies
 * Assigns vertical, CTA tier, template variant, subject line
 * Generates personalized emails with validation
 * Outputs batches to /tmp/campaign/batch_N.json
 * 
 * Usage: npx tsx scripts/generate-campaign.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { CONTACT_STANDARD, scoreContactQuality } from '../src/lib/contact-standard';

// ============================================================
// CONFIGURATION
// ============================================================

const OUTPUT_DIR = '/tmp/campaign';
const BATCH_SIZE = 25;
const TARGET_COUNT = 500;

// Domains we must NEVER email
const BANNED_DOMAINS = new Set([
  'dannon.com', 'danone.com', 'bluetriton.com', 'yardflow.ai',
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'icloud.com', 'me.com', 'live.com', 'msn.com', 'protonmail.com',
]);

// Domains known to bounce/block
const BLOCKED_DOMAINS = new Set([
  'niagarawater.com', 'homedepot.com', 'heb.com', 'fedex.com',
  'johndeere.com', 'kencogroup.com', 'bn.com', 'hmna.com',
  'hormel.com', 'gapac.com', 'jmsmucker.com', 'lpcorp.com',
  'xpo.com', 'kraftheinz.com',
]);

// 3PL/carrier/consulting/tech domains (not YardFlow's ICP - they're carriers, not shippers)
const EXCLUDE_DOMAINS = new Set([
  'dhl.com', 'geodis.com', 'ryder.com', 'penske.com', 'ups.com',
  'sclogistics.com', 'schneider.com', 'maersk.com', 'bnsf.com',
  'nscorp.com', 'cevalogistics.com', 'up.com', 'gxo.com',
  'forwardair.com', 'redwoodlogistics.com', 'crowley.com',
  'hubgroup.com', 'wwex.com', 'rlcarriers.com', 'chrobinson.com',
  'jbhunt.com', 'kuehne-nagel.com', 'nfiindustries.com', 'arcb.com',
  'werner.com', 'usxpress.com', 'lineagelogistics.com',
  'universallogistics.com', 'fmlogistic.com', 'aramex.com',
  'nipponexpress.com', 'olddominionfreight.com', 'saia.com',
  'estes-express.com', 'coyote.com', 'convoy.com', 'flexport.com',
  'project44.com', 'fourkites.com', 'trimble.com', 'descartes.com',
  'e2open.com', 'kinaxis.com', 'coupa.com', 'jaggaer.com',
  'oracle.com', 'sap.com', 'manhattan.com', 'blueyonder.com',
  'warburgpincus.com', 'alixpartners.com', 'usbank.com',
  'mckinsey.com', 'kearney.com', 'bcg.com', 'deloitte.com',
  'accenture.com', 'capgemini.com', 'zebra.com', 'honeywell.com',
]);

// Industries to exclude (not shippers with yards)
const EXCLUDE_INDUSTRIES = new Set([
  'hospital & health care', 'health, wellness & fitness',
  'financial services', 'banking', 'insurance',
  'management consulting', 'information technology & services',
  'computer software', 'internet', 'medical practice',
  'military', 'government administration', 'law practice',
  'higher education', 'education management',
  'nonprofit organization management', 'staffing and recruiting',
  'human resources', 'accounting', 'real estate',
  'investment management', 'venture capital & private equity',
  'telecommunications', 'media production', 'entertainment',
  'music', 'broadcast media', 'publishing', 'writing and editing',
  'public relations and communications', 'marketing and advertising',
  'market research', 'events services', 'graphic design',
  'photography', 'performing arts', 'fine art', 'museums and institutions',
  'religious institutions', 'civic & social organization',
  'political organization', 'international affairs',
  'think tanks', 'public policy', 'judiciary', 'legislative office',
]);

// 20 target accounts get sniper emails only - exclude from campaign
const TARGET_ACCOUNT_DOMAINS = new Set([
  'genmills.com', 'generalmills.com', 'fritolay.com', 'pepsico.com',
  'diageo.com', 'hormel.com', 'jmsmucker.com', 'homedepot.com',
  'gapac.com', 'heb.com', 'dannon.com', 'danone.com',
  'coca-cola.com', 'campbells.com', 'mondelezinternational.com',
  'cat.com', 'ford.com', 'ge.com', 'lowes.com', 'bestbuy.com',
]);

// Seniority levels we target
const TARGET_SENIORITY = new Set(['VP', 'Director', 'Executive', 'Senior']);

// Supply chain relevant keywords in titles  
const SC_KEYWORDS = [
  'supply chain', 'logistics', 'warehouse', 'distribution', 'operations',
  'transportation', 'fleet', 'freight', 'yard', 'dock', 'shipping',
  'procurement', 'fulfillment', 'plant', 'manufacturing', 'facility',
];

// Banned email phrases
const BANNED_PHRASES = [
  'i hope this finds you', 'reaching out', 'just following up',
  'i wanted to', 'leverage', 'utilize', 'facilitate', 'streamline',
  'landscape', 'ecosystem', 'synergy', 'bandwidth', 'circle back',
  'touch base', 'move the needle', 'low-hanging fruit', 'deep dive',
  'paradigm', 'holistic', 'robust', 'cutting-edge', 'game-changer',
];

// ============================================================
// VERTICAL DEFINITIONS + TEMPLATES
// ============================================================

type Vertical = 'food_bev' | 'cpg_retail' | 'auto_heavy' | 'industrial' | 'general_mfg' | 'distribution' | 'pharma';

const INDUSTRY_TO_VERTICAL: Record<string, Vertical> = {
  'food & beverages': 'food_bev', 'food production': 'food_bev',
  'wine & spirits': 'food_bev', 'dairy': 'food_bev', 'farming': 'food_bev',
  'retail': 'cpg_retail', 'consumer goods': 'cpg_retail',
  'consumer electronics': 'cpg_retail', 'apparel & fashion': 'cpg_retail',
  'cosmetics': 'cpg_retail', 'sporting goods': 'cpg_retail',
  'luxury goods & jewelry': 'cpg_retail', 'supermarkets': 'cpg_retail',
  'automotive': 'auto_heavy', 'aviation & aerospace': 'auto_heavy',
  'defense & space': 'auto_heavy', 'shipbuilding': 'auto_heavy',
  'building materials': 'industrial', 'construction': 'industrial',
  'glass, ceramics & concrete': 'industrial', 'mining & metals': 'industrial',
  'chemicals': 'industrial', 'plastics': 'industrial',
  'paper & forest products': 'industrial', 'packaging and containers': 'industrial',
  'textiles': 'industrial', 'oil & energy': 'industrial',
  'renewables & environment': 'industrial',
  'pharmaceuticals': 'pharma', 'biotechnology': 'pharma',
  'medical devices': 'pharma',
  'wholesale': 'distribution', 'warehousing': 'distribution',
  'import and export': 'distribution', 'restaurants': 'distribution',
};

function getVertical(industry: string): Vertical {
  return INDUSTRY_TO_VERTICAL[industry.toLowerCase()] ?? 'general_mfg';
}

// Title hook generation based on actual job title
function getTitleHook(title: string, company: string): string {
  const t = title.toLowerCase();
  if (t.includes('chief') || t.includes('cso') || t.includes('coo') || t.includes('clo'))
    return `Owning the full supply chain at ${company}`;
  if (t.includes('vp') || t.includes('vice president'))
    return `Running supply chain at a company like ${company}`;
  if (t.includes('svp') || t.includes('senior vice'))
    return `Leading supply chain strategy at ${company}`;
  if (t.includes('evp') || t.includes('executive vice'))
    return `Driving operational excellence at ${company}`;
  if (t.includes('director') && t.includes('logistics'))
    return `Overseeing logistics at ${company}`;
  if (t.includes('director') && t.includes('operations'))
    return `Managing operations at ${company}`;
  if (t.includes('director') && t.includes('supply'))
    return `Directing supply chain at ${company}`;
  if (t.includes('director') && t.includes('warehouse'))
    return `Running warehouse operations at ${company}`;
  if (t.includes('director') && t.includes('distribution'))
    return `Managing distribution at ${company}`;
  if (t.includes('director') && t.includes('transport'))
    return `Overseeing transportation at ${company}`;
  if (t.includes('director') && t.includes('procurement'))
    return `Leading procurement at ${company}`;
  if (t.includes('director') && t.includes('manufacturing'))
    return `Running manufacturing ops at ${company}`;
  if (t.includes('director') && t.includes('plant'))
    return `Managing plant operations at ${company}`;
  if (t.includes('director') && t.includes('fulfillment'))
    return `Running fulfillment at ${company}`;
  if (t.includes('head of'))
    return `Leading ${t.replace('head of', '').trim()} at ${company}`;
  if (t.includes('senior') && t.includes('director'))
    return `Running supply chain ops at ${company}`;
  if (t.includes('director'))
    return `Directing operations at ${company}`;
  if (t.includes('senior') && t.includes('manager'))
    return `Managing the supply chain at ${company}`;
  return `Running operations at ${company}`;
}

// ============================================================
// EMAIL TEMPLATES (7 verticals x 3 variants)
// ============================================================

interface Template {
  body: (firstName: string, company: string, titleHook: string) => string;
}

const TEMPLATES: Record<Vertical, Template[]> = {
  food_bev: [
    {
      body: (fn, co, hook) =>
`${fn},

${hook} means you probably know this already. Cold chain compliance doesn't start at the dock. It starts the moment a reefer pulls through the gate.

At most food facilities we talk to, trailers sit in the yard 4-6 hours before anyone checks temp. That's not a logistics gap. It's a food safety liability hiding in plain sight.

We built YardFlow to give operations teams real-time visibility from gate to dock. Every trailer, every temp, every minute.

We're at MODEX April 13-16. Worth 15 minutes to see how it works?`,
    },
    {
      body: (fn, co, hook) =>
`${fn},

Quick question. How does ${co} track reefer dwell time in the yard right now? Excel? Whiteboard? Radio calls?

Most food and beverage operations we talk to don't have a clean answer. The yard is the one place where cold chain visibility goes dark.

YardFlow closes that gap. Real-time trailer tracking from gate entry to dock assignment. No hardware install. Works on day one.

Headed to MODEX in Atlanta April 13-16. Would love to show you a 5-minute demo at our booth.`,
    },
    {
      body: (fn, co, hook) =>
`${fn},

Nobody plans a food safety audit around what's sitting in the yard. But that's exactly where the exposure is.

A reefer at 39 degrees for six hours doesn't show up on any dashboard until someone physically walks the lot. By then you're managing a problem, not preventing one.

We built YardFlow to fix that. Automated trailer tracking with temp monitoring baked in. Gate to dock, no blind spots.

We'll be at MODEX in Atlanta next month. Can I get 15 minutes on your calendar?`,
    },
  ],

  cpg_retail: [
    {
      body: (fn, co, hook) =>
`${fn},

${hook} means you know the math. Twenty trailers in the yard. Four open docks. Retail replenishment windows that don't care about your constraints.

The bottleneck isn't the warehouse. It's the 200 yards between the gate and the dock door. That's where throughput goes to die.

YardFlow gives you real-time yard visibility so dock scheduling actually works. No more radio calls. No more windshield surveys.

We're at MODEX April 13-16 in Atlanta. Got 15 minutes for a quick look?`,
    },
    {
      body: (fn, co, hook) =>
`${fn},

Here's something I keep hearing from CPG ops teams. "We optimized everything inside the four walls. The yard is still chaos."

Detention charges. Missed appointment windows. Dock congestion that backs up the whole day. It all traces back to zero visibility in the yard.

YardFlow is a yard management system that gives you real-time trailer positions, automated dock assignments, and gate-to-door tracking. No hardware. Works on day one.

We'll be at MODEX in Atlanta in a couple weeks. Want to stop by our booth for a quick demo?`,
    },
    {
      body: (fn, co, hook) =>
`${fn},

Quick one. When ${co} has 30+ trailers on-site and dock appointments stacking up, how does the yard team prioritize?

Most CPG operations we talk to say it's a mix of radio, memory, and hope. That works until it doesn't. And the cost of "doesn't" is a missed retail window.

YardFlow replaces the guesswork with real-time yard visibility. Every trailer tracked from gate to dock.

At MODEX in Atlanta April 13-16. Happy to walk you through it in person.`,
    },
  ],

  auto_heavy: [
    {
      body: (fn, co, hook) =>
`${fn},

JIT falls apart in the last hundred yards. A parts trailer sits unnoticed through a shift change and suddenly the line is down.

${hook} means you've probably felt this. The yard is the one place where sequencing visibility goes dark.

YardFlow gives production-linked yard visibility. Every inbound trailer tracked in real time so the dock team knows what's coming before the driver calls in.

We're at MODEX April 13-16 in Atlanta. Worth a 15-minute look?`,
    },
    {
      body: (fn, co, hook) =>
`${fn},

Quick question for you. When an inbound parts trailer hits ${co}'s gate, how long before the dock team knows it's there?

At most manufacturing sites we visit, the answer is "when the driver walks in and asks." That gap between gate and dock awareness is where JIT breaks down.

YardFlow closes it. Automated gate check-in, real-time yard map, production-priority dock assignments. No hardware install needed.

Headed to MODEX in Atlanta April 13-16. Can I grab 15 minutes to show you how it works?`,
    },
    {
      body: (fn, co, hook) =>
`${fn},

Here's the pattern I keep seeing at heavy manufacturing sites. Inbound trailers queue at the gate. The yard fills up. Nobody knows which trailer has the parts the line needs next.

Then production stops. And suddenly everyone cares about the yard.

YardFlow prevents that. Real-time trailer tracking from gate to dock, prioritized by production schedule. Your dock team always knows what to pull next.

We'll be at MODEX in Atlanta in a couple weeks. Got time for a quick demo?`,
    },
  ],

  industrial: [
    {
      body: (fn, co, hook) =>
`${fn},

${hook} means you deal with heavy loads, tight windows, and a yard that doesn't manage itself.

Most industrial sites we visit run the yard on radio calls and clipboard checks. It works until you've got 40 trailers on-site and three dock doors backed up. Then it's a fire drill.

YardFlow gives you a real-time digital yard map. Every trailer, every status, every minute. No hardware install needed.

We're at MODEX April 13-16 in Atlanta. Worth 15 minutes to take a look?`,
    },
    {
      body: (fn, co, hook) =>
`${fn},

Quick one. When ${co} has a full yard and trucks waiting at the gate, what's the playbook?

At most industrial facilities, it's a scramble. Someone walks the lot, checks what's ready to move, makes a call. That 30-minute scramble happens three times a day.

YardFlow replaces the scramble with real-time visibility. Automated tracking from gate to dock. Your team always knows what's where.

At MODEX in Atlanta April 13-16. Happy to show you a quick demo.`,
    },
    {
      body: (fn, co, hook) =>
`${fn},

The yard at an industrial site is a different animal. Flatbeds, hazmat, oversized loads. Every trailer has different handling requirements and nobody has a clean view of what's sitting where.

That's the gap YardFlow fills. Real-time trailer tracking with status visibility. Your team sees every unit in the yard, knows what needs attention, and doesn't waste time walking the lot.

We'll be at MODEX in Atlanta next month. Can I get 15 minutes on your calendar?`,
    },
  ],

  general_mfg: [
    {
      body: (fn, co, hook) =>
`${fn},

${hook} means you've probably seen this. Production doesn't stop at the dock door. When inbound materials sit in the yard for two shifts, the line feels it.

The problem is visibility. Nobody owns the yard, so nobody tracks it. That's where throughput leaks hide.

YardFlow gives you a real-time yard map. Every trailer tracked from gate to dock. Your team knows what's on-site and what needs to move.

We're at MODEX April 13-16 in Atlanta. Got 15 minutes for a quick look?`,
    },
    {
      body: (fn, co, hook) =>
`${fn},

Quick question. How does ${co} track what's sitting in the yard right now? If I asked your dock team, could they tell me in under 60 seconds?

At most manufacturing sites, the answer is no. The yard is a black hole between the gate and the dock. That's where dwell time hides and throughput dies.

YardFlow fixes it. Real-time trailer tracking, automated dock assignments, zero hardware install.

At MODEX in Atlanta April 13-16. Want to swing by for a 5-minute demo?`,
    },
    {
      body: (fn, co, hook) =>
`${fn},

Here's what I keep hearing from manufacturing ops leaders. "We've optimized the warehouse. We've optimized the line. The yard? That's still a mess."

It makes sense. The yard didn't have good tools until now. Whiteboards and radio calls were the best option. But when you're running 30+ trailers a day, that doesn't scale.

YardFlow is a real-time yard management system. Gate to dock visibility, automated assignments, and zero hardware installation.

We'll be at MODEX in Atlanta in a couple weeks. Happy to show you how it works.`,
    },
  ],

  distribution: [
    {
      body: (fn, co, hook) =>
`${fn},

Cross-dock velocity depends on yard choreography. When trailers queue up at the door, throughput drops and the whole schedule slides.

${hook} means you've seen this firsthand. The yard is the pacing constraint that nobody measures.

YardFlow gives distribution teams real-time yard visibility. Every trailer tracked, every dock assignment automated, every gate move logged.

We're at MODEX April 13-16 in Atlanta. Worth 15 minutes to see it live?`,
    },
    {
      body: (fn, co, hook) =>
`${fn},

Quick one. On ${co}'s busiest day, how many trailers are in the yard at peak? And how does the team track them?

Most distribution ops we talk to say "too many" and "we don't." That's not a knock. The yard just hasn't had good tools.

YardFlow changes that. Real-time yard map, automated dock scheduling, gate-to-door tracking. Works on day one with no hardware install.

At MODEX in Atlanta April 13-16. Want to stop by for a demo?`,
    },
    {
      body: (fn, co, hook) =>
`${fn},

Distribution throughput has a ceiling. It's not the sortation. It's not the labor. It's the yard.

When 20 trailers are on-site and nobody knows which ones are loaded, empty, or ready to move, the dock team wastes hours figuring it out. Every day.

YardFlow puts a real-time screen on the yard. Every trailer, every status, every minute. Your team always knows what to pull next.

We'll be at MODEX in Atlanta next month. Can I grab 15 minutes?`,
    },
  ],

  pharma: [
    {
      body: (fn, co, hook) =>
`${fn},

GDP compliance doesn't pause in the yard. When a temperature-sensitive trailer sits at the gate for four hours, that's audit exposure.

${hook} means you know the stakes. The yard is the one place where compliance visibility tends to go dark.

YardFlow gives pharma operations real-time yard tracking with dwell time monitoring. Every trailer from gate to dock, every minute accounted for.

We're at MODEX April 13-16 in Atlanta. Got 15 minutes to take a look?`,
    },
    {
      body: (fn, co, hook) =>
`${fn},

Quick question. When a temp-controlled trailer arrives at ${co}'s facility, how long before it gets a dock assignment?

For most pharma operations, the honest answer is "depends who's working the yard." That variability creates compliance risk that's hard to audit and harder to fix.

YardFlow automates it. Gate check-in triggers dock assignment based on priority rules. Every trailer tracked in real time. Full audit trail.

At MODEX in Atlanta April 13-16. Happy to walk you through it.`,
    },
    {
      body: (fn, co, hook) =>
`${fn},

Here's what keeps coming up in conversations with pharma supply chain leaders. The warehouse is validated. The transport is validated. The yard? That's a gap.

Nobody wants to explain to an auditor why a GDP-critical trailer sat in the yard for six hours with no documented handling.

YardFlow closes that gap. Real-time yard tracking with timestamped event logs for every gate and dock move.

We'll be at MODEX in Atlanta in a couple weeks. Can I get 15 minutes on your calendar?`,
    },
  ],
};

// Subject line pools per vertical
const SUBJECT_LINES: Record<Vertical, string[]> = {
  food_bev: [
    '{first_name}, quick yard question',
    'Cold chain gap between {company}\'s gate and dock',
    'Who owns the yard at {company}?',
    '{first_name} - MODEX April 14?',
    'The 6-hour blind spot in {company}\'s cold chain',
  ],
  cpg_retail: [
    '{first_name}, quick yard question',
    'Dock congestion eating {company}\'s throughput?',
    'The bottleneck outside {company}\'s four walls',
    '{first_name} - MODEX April 14?',
    '20 trailers, 4 docks, zero visibility',
  ],
  auto_heavy: [
    '{first_name}, quick yard question',
    'When JIT breaks down in {company}\'s yard',
    'The last 100 yards before {company}\'s line',
    '{first_name} - MODEX April 14?',
    'Shift change + full yard = line down',
  ],
  industrial: [
    '{first_name}, quick yard question',
    '40 trailers, 3 docks, no visibility',
    'The yard problem nobody owns at {company}',
    '{first_name} - MODEX April 14?',
    '{company}\'s yard running on radio and hope?',
  ],
  general_mfg: [
    '{first_name}, quick yard question',
    'The 48-hour bottleneck at {company}',
    '{company}\'s yard - who tracks it?',
    '{first_name} - MODEX April 14?',
    'Where throughput hides at {company}',
  ],
  distribution: [
    '{first_name}, quick yard question',
    'Yard choreography at {company}',
    'What slows {company}\'s cross-dock velocity?',
    '{first_name} - MODEX April 14?',
    'Peak day yard chaos at {company}',
  ],
  pharma: [
    '{first_name}, quick yard question',
    'GDP compliance gap in {company}\'s yard',
    'The unvalidated yard at {company}',
    '{first_name} - MODEX April 14?',
    'Audit risk between {company}\'s gate and dock',
  ],
};

// ============================================================
// CONTACT SELECTION
// ============================================================

interface Contact {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  seniority: string;
  industry: string;
  domain: string;
  qualityScore: number;
  qualityBand: 'A' | 'B' | 'C' | 'D';
  isContactReady: boolean;
  doNotContact: boolean;
}

interface GeneratedEmail {
  to: string;
  subject: string;
  body: string;
  accountName: string;
  personaName: string;
  vertical: Vertical;
  templateVariant: number;
  subjectVariant: number;
  qualityScore: number;
  qualityBand: 'A' | 'B' | 'C' | 'D';
  isContactReady: boolean;
  doNotContact: boolean;
}

function loadAlreadySent(): Set<string> {
  const sent = new Set<string>();
  const csv = fs.readFileSync('emails-sent-1774719075246.csv', 'utf-8');
  const records = parse(csv, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  for (const row of records) {
    const email = (row['to'] || row['email'] || row['to_email'] || '').trim().toLowerCase();
    if (email && email.includes('@')) sent.add(email);
  }
  // Also load any emails sent during this campaign session
  const recentFile = '/tmp/already_sent_b1.json';
  if (fs.existsSync(recentFile)) {
    const recent: string[] = JSON.parse(fs.readFileSync(recentFile, 'utf-8'));
    for (const email of recent) {
      if (email) sent.add(email.trim().toLowerCase());
    }
  }
  return sent;
}

function loadContacts(): Contact[] {
  const csvData = fs.readFileSync('all-contacts.csv', 'utf-8');
  const records = parse(csvData, { columns: true, skip_empty_lines: true, relax_column_count: true }) as Record<string, string>[];
  
  const contacts: Contact[] = [];
  const rejectedByQuality: Array<{ email: string; company: string; score: number }> = [];
  
  for (const row of records) {
    const email = (row['Email'] || '').trim().toLowerCase();
    if (!email || !email.includes('@')) continue;
    
    const domain = email.split('@')[1];
    if (BANNED_DOMAINS.has(domain)) continue;
    if (BLOCKED_DOMAINS.has(domain)) continue;
    if (EXCLUDE_DOMAINS.has(domain)) continue;
    if (TARGET_ACCOUNT_DOMAINS.has(domain)) continue;
    
    const title = (row['Job Title'] || '').trim();
    const seniority = (row['Employment Seniority'] || '').trim();
    const industry = (row['Industry'] || '').trim().toLowerCase();
    const firstName = (row['First Name'] || '').trim();
    const lastName = (row['Last Name'] || '').trim();
    const company = (row['Company Name'] || '').trim();
    
    if (!title || !firstName || !company) continue;
    if (!TARGET_SENIORITY.has(seniority)) continue;
    if (EXCLUDE_INDUSTRIES.has(industry)) continue;
    
    // Skip numeric HubSpot IDs as company names
    if (/^\d/.test(company) || company.length < 2) continue;
    
    // Skip carrier/logistics/freight companies by domain or company name
    const CARRIER_KEYWORDS = ['logistics', 'freight', 'transport', 'trucking', 'shipping', 'express', 'cargo', 'carrier', 'forwarding'];
    const domainLower = domain.toLowerCase();
    const companyLower = company.toLowerCase();
    if (CARRIER_KEYWORDS.some(kw => domainLower.includes(kw) || companyLower.includes(kw))) continue;
    
    const titleLower = title.toLowerCase();
    const isRelevant = SC_KEYWORDS.some(kw => titleLower.includes(kw));
    if (!isRelevant) continue;
    
    const quality = scoreContactQuality({
      name: `${firstName} ${lastName}`.trim(),
      title,
      accountName: company,
      email,
      companyDomain: domain,
      sourceEvidenceCount: 2,
    });

    if (quality.score < CONTACT_STANDARD.minQualityScoreForSend || quality.emailConfidence < CONTACT_STANDARD.minEmailConfidenceForSend) {
      rejectedByQuality.push({ email, company, score: quality.score });
      continue;
    }

    contacts.push({
      email, firstName, lastName, company, title, seniority,
      industry: industry || 'manufacturing', domain,
      qualityScore: quality.score,
      qualityBand: quality.band,
      isContactReady: quality.isReady,
      doNotContact: false,
    });
  }

  if (rejectedByQuality.length > 0) {
    fs.mkdirSync('/tmp/campaign', { recursive: true });
    fs.writeFileSync('/tmp/campaign/rejected_quality.json', JSON.stringify(rejectedByQuality.slice(0, 2000), null, 2));
    console.log(`  Rejected by quality standard: ${rejectedByQuality.length} (saved to /tmp/campaign/rejected_quality.json)`);
  }
  
  return contacts;
}

function selectContacts(contacts: Contact[], alreadySent: Set<string>): Contact[] {
  // Remove already sent
  const fresh = contacts.filter(c => !alreadySent.has(c.email));
  
  // Group by company, max 2 per company
  const byCompany = new Map<string, Contact[]>();
  for (const c of fresh) {
    const key = c.company.toLowerCase();
    if (!byCompany.has(key)) byCompany.set(key, []);
    byCompany.get(key)!.push(c);
  }
  
  const SENIORITY_RANK: Record<string, number> = { VP: 0, Executive: 1, Director: 2, Senior: 3 };
  
  const selected: Contact[] = [];
  for (const [, people] of byCompany) {
    people.sort((a, b) => (SENIORITY_RANK[a.seniority] ?? 99) - (SENIORITY_RANK[b.seniority] ?? 99));
    selected.push(...people.slice(0, 2));
  }
  
  // Sort by seniority rank (VPs first)
  selected.sort((a, b) => (SENIORITY_RANK[a.seniority] ?? 99) - (SENIORITY_RANK[b.seniority] ?? 99));
  
  return selected.slice(0, TARGET_COUNT);
}

// ============================================================
// EMAIL GENERATION
// ============================================================

function generateEmail(contact: Contact, index: number): GeneratedEmail {
  const vertical = getVertical(contact.industry);
  const templates = TEMPLATES[vertical];
  const subjects = SUBJECT_LINES[vertical];
  
  const templateVariant = index % templates.length;
  const subjectVariant = index % subjects.length;
  
  const titleHook = getTitleHook(contact.title, contact.company);
  const body = templates[templateVariant].body(contact.firstName, contact.company, titleHook);
  
  let subject = subjects[subjectVariant]
    .replace('{first_name}', contact.firstName)
    .replace('{company}', contact.company);
  
  return {
    to: contact.email,
    subject,
    body,
    accountName: contact.company,
    personaName: `${contact.firstName} ${contact.lastName}`.trim(),
    vertical,
    templateVariant,
    subjectVariant,
    qualityScore: contact.qualityScore,
    qualityBand: contact.qualityBand,
    isContactReady: contact.isContactReady,
    doNotContact: contact.doNotContact,
  };
}

// ============================================================
// VALIDATION
// ============================================================

interface ValidationError {
  email: string;
  issue: string;
}

function validateEmail(email: GeneratedEmail): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Emdash check
  if (email.body.includes('\u2014') || email.body.includes('\u2013')) {
    errors.push({ email: email.to, issue: 'Contains em/en dash' });
  }
  if (email.subject.includes('\u2014') || email.subject.includes('\u2013')) {
    errors.push({ email: email.to, issue: 'Subject contains em/en dash' });
  }
  
  // Semicolon check
  if (email.body.includes(';')) {
    errors.push({ email: email.to, issue: 'Contains semicolon' });
  }
  
  // Sentence length check
  const sentences = email.body.split(/[.!?]+/).filter(s => s.trim().length > 0);
  for (const sent of sentences) {
    const wordCount = sent.trim().split(/\s+/).length;
    if (wordCount > 30) {
      errors.push({ email: email.to, issue: `Sentence too long (${wordCount} words): "${sent.trim().substring(0, 60)}..."` });
    }
  }
  
  // Banned phrases (exclude company name from check)
  const bodyLower = email.body.toLowerCase();
  const companyLower = email.accountName.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (bodyLower.includes(phrase) && !companyLower.includes(phrase)) {
      errors.push({ email: email.to, issue: `Contains banned phrase: "${phrase}"` });
    }
  }
  
  // Template literal check
  if (email.body.includes('{first_name}') || email.body.includes('{company}') || email.body.includes('{title_hook}')) {
    errors.push({ email: email.to, issue: 'Contains unfilled template variable' });
  }
  if (email.subject.includes('{first_name}') || email.subject.includes('{company}')) {
    errors.push({ email: email.to, issue: 'Subject contains unfilled template variable' });
  }
  
  // Word count check (target under 120 words)
  const wordCount = email.body.split(/\s+/).length;
  if (wordCount > 150) {
    errors.push({ email: email.to, issue: `Body too long (${wordCount} words)` });
  }
  
  // Empty name check
  if (email.body.includes('\n\n,') || email.body.startsWith(',')) {
    errors.push({ email: email.to, issue: 'Missing first name in greeting' });
  }
  
  return errors;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('=== MODEX 2026 Campaign Generator ===\n');
  
  // Step 1: Load suppression list
  console.log('Loading suppression list...');
  const alreadySent = loadAlreadySent();
  console.log(`  ${alreadySent.size} emails in suppression list`);
  
  // Step 2: Load and filter contacts
  console.log('\nLoading contacts...');
  const allContacts = loadContacts();
  console.log(`  ${allContacts.length} ICP-relevant contacts found`);
  
  // Step 3: Select top 500
  console.log('\nSelecting top contacts...');
  const selected = selectContacts(allContacts, alreadySent);
  console.log(`  ${selected.length} contacts selected`);
  
  // Stats
  const verticalCounts: Record<string, number> = {};
  const seniorityCounts: Record<string, number> = {};
  const uniqueCompanies = new Set<string>();
  const uniqueDomains = new Set<string>();
  const qualityBands: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  
  for (const c of selected) {
    const v = getVertical(c.industry);
    verticalCounts[v] = (verticalCounts[v] || 0) + 1;
    seniorityCounts[c.seniority] = (seniorityCounts[c.seniority] || 0) + 1;
    uniqueCompanies.add(c.company);
    uniqueDomains.add(c.domain);
    qualityBands[c.qualityBand] = (qualityBands[c.qualityBand] || 0) + 1;
  }
  
  console.log('\n  Verticals:');
  for (const [v, cnt] of Object.entries(verticalCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${v}: ${cnt}`);
  }
  console.log('\n  Seniority:');
  for (const [s, cnt] of Object.entries(seniorityCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${s}: ${cnt}`);
  }
  console.log(`\n  Unique companies: ${uniqueCompanies.size}`);
  console.log(`  Unique domains: ${uniqueDomains.size}`);
  console.log(`  Quality bands: A(${qualityBands.A}) B(${qualityBands.B}) C(${qualityBands.C}) D(${qualityBands.D})`);
  
  // Step 4: Generate emails
  console.log('\nGenerating emails...');
  const emails: GeneratedEmail[] = [];
  const allErrors: ValidationError[] = [];
  
  for (let i = 0; i < selected.length; i++) {
    const email = generateEmail(selected[i], i);
    const errors = validateEmail(email);
    allErrors.push(...errors);
    emails.push(email);
  }
  
  // Step 5: Report validation
  if (allErrors.length > 0) {
    console.log(`\n  VALIDATION ERRORS: ${allErrors.length}`);
    for (const err of allErrors) {
      console.log(`    ${err.email}: ${err.issue}`);
    }
    console.log('\n  Fix template issues before proceeding.');
    process.exit(1);
  }
  console.log('  All emails passed validation.');
  
  // Subject line distribution
  console.log('\n  Subject line distribution:');
  const subjectPatterns: Record<string, number> = {};
  for (const e of emails) {
    // Generalize subject for counting
    const pattern = `${e.vertical}:variant${e.subjectVariant}`;
    subjectPatterns[pattern] = (subjectPatterns[pattern] || 0) + 1;
  }
  for (const [p, cnt] of Object.entries(subjectPatterns).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
    console.log(`    ${p}: ${cnt}`);
  }
  
  // Step 6: Output batches
  console.log('\nWriting batches...');
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const batchCount = Math.ceil(emails.length / BATCH_SIZE);
  for (let b = 0; b < batchCount; b++) {
    const batch = emails.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    const outPath = path.join(OUTPUT_DIR, `batch_${b + 1}.json`);
    
    // Output in send-email.ts format
    const sendItems = batch.map(e => ({
      to: e.to,
      subject: e.subject,
      body: e.body,
      accountName: e.accountName,
      personaName: e.personaName,
      isContactReady: e.isContactReady,
      doNotContact: e.doNotContact,
      qualityBand: e.qualityBand,
      qualityScore: e.qualityScore,
    }));
    
    fs.writeFileSync(outPath, JSON.stringify(sendItems, null, 2));
    
    // Batch stats
    const batchVerticals: Record<string, number> = {};
    for (const e of batch) {
      batchVerticals[e.vertical] = (batchVerticals[e.vertical] || 0) + 1;
    }
    console.log(`  Batch ${b + 1}: ${batch.length} emails → ${outPath}`);
    console.log(`    Verticals: ${Object.entries(batchVerticals).map(([v, c]) => `${v}(${c})`).join(', ')}`);
  }
  
  // Step 7: Write manifest
  const manifest = {
    generated: new Date().toISOString(),
    totalEmails: emails.length,
    batches: batchCount,
    batchSize: BATCH_SIZE,
    uniqueCompanies: uniqueCompanies.size,
    uniqueDomains: uniqueDomains.size,
    verticalBreakdown: verticalCounts,
    seniorityBreakdown: seniorityCounts,
    subjectPatterns,
    qualityBands,
    contactStandard: {
      minQualityScoreForSend: CONTACT_STANDARD.minQualityScoreForSend,
      minEmailConfidenceForSend: CONTACT_STANDARD.minEmailConfidenceForSend,
    },
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\n  Manifest written to ${OUTPUT_DIR}/manifest.json`);
  
  console.log('\n=== READY TO SEND ===');
  console.log(`Send each batch with: npx tsx scripts/send-email.ts /tmp/campaign/batch_N.json`);
  console.log(`Monitor bounce rate after batch 1. If >5%, pause and investigate.`);
}

main().catch(console.error);
