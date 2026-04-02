/**
 * sniper-10.ts — 10 top-priority contacts, one per account.
 * Highest-ranking supply chain decision-maker at each company.
 * Hand-crafted copy. No em dashes. No semicolons. Short paragraphs.
 */

import type { BatchContact } from '../batch-send-gmail';

const BASE = 'https://modex-gtm.vercel.app';

export const CONTACTS: BatchContact[] = [
  // ── 1. Rob Ferguson — JM Smucker ─────────────────────────────────────
  {
    to: 'rob.ferguson@jmsmucker.com',
    firstName: 'Rob',
    accountName: 'JM Smucker',
    personaName: 'Rob Ferguson',
    accountSlug: 'jm-smucker',
    subject: 'Smucker yard ops after Hostess integration',
    body: [
      'Rob,',
      'Quick question. With the Hostess facilities folding into the Smucker network, how is your team handling yard management across 25+ sites? Most companies in that integration window don\'t have a standardized answer.',
      'The yard is the blind spot. TMS handles the route. WMS handles the warehouse. But between the gate and the dock, most sites run on clipboards and radio calls.',
      'Primo Brands replaced Kaleris with YardFlow at every facility. They cut gate-to-dock time in half.',
      `Put together a short overview for your team: ${BASE}/for/jm-smucker`,
      'We\'re at MODEX April 13-16 in Atlanta. Worth 15 minutes on the floor?',
      'Casey',
    ],
  },
  // ── 2. Will Bonifant — Hormel Foods ───────────────────────────────────
  {
    to: 'will.bonifant@hormel.com',
    firstName: 'Will',
    accountName: 'Hormel Foods',
    personaName: 'Will Bonifant',
    accountSlug: 'hormel-foods',
    subject: 'Hormel yard standardization across 40+ plants',
    body: [
      'Will,',
      'Hormel runs 40+ production facilities. I\'d bet each one handles yard traffic a little differently. Some might use a YMS. Most probably don\'t.',
      'That inconsistency is where detention charges pile up and dock appointments drift. When there\'s no real-time visibility between the gate and the dock, your team is flying blind at every site.',
      'Primo Brands had the same problem across their network. They switched to YardFlow and cut dwell time in half at every facility.',
      `Built a quick overview for Hormel: ${BASE}/for/hormel-foods`,
      'At MODEX next week in Atlanta. Open to a quick conversation?',
      'Casey',
    ],
  },
  // ── 3. Ryan Hutcherson — Georgia Pacific ──────────────────────────────
  {
    to: 'ryan.hutcherson@gapac.com',
    firstName: 'Ryan',
    accountName: 'Georgia Pacific',
    personaName: 'Ryan Hutcherson',
    accountSlug: 'georgia-pacific',
    subject: 'GP mill yards - quick thought',
    body: [
      'Ryan,',
      'Georgia Pacific runs 150+ manufacturing sites. Every mill yard is its own universe. Different gate procedures, different dock scheduling, different levels of visibility.',
      'That\'s the pattern we keep seeing. Big industrial operations with sophisticated WMS setups but the yard between the gate and the dock is still manual. That\'s where 20%+ of trailer dwell time hides.',
      'Primo Brands replaced their yard management system with YardFlow. Cut gate-to-dock time in half across every facility.',
      `Short overview for GP: ${BASE}/for/georgia-pacific`,
      'Your HQ is 10 miles from MODEX. We\'re there April 13-16. Coffee worth it?',
      'Casey',
    ],
  },
  // ── 4. Troy Retzloff — H-E-B ─────────────────────────────────────────
  {
    to: 'troy.retzloff@heb.com',
    firstName: 'Troy',
    accountName: 'H-E-B',
    personaName: 'Troy Retzloff',
    accountSlug: 'h-e-b',
    subject: 'H-E-B distribution yard visibility',
    body: [
      'Troy,',
      'H-E-B runs one of the best distribution networks in grocery. But as you build out new DCs for the DFW expansion, yard management at each site gets harder to standardize.',
      'The gap between the gate and the dock is where most DCs lose time. Carriers wait. Dock windows slip. Nobody has real-time visibility on what\'s in the yard.',
      'YardFlow closes that gap. Primo Brands deployed it across their entire network and cut gate-to-dock time by 50%.',
      `Quick overview for H-E-B: ${BASE}/for/h-e-b`,
      'At MODEX April 13-16. Worth a conversation?',
      'Casey',
    ],
  },
  // ── 5. John Deaton — The Home Depot ───────────────────────────────────
  {
    to: 'john.deaton@homedepot.com',
    firstName: 'John',
    accountName: 'The Home Depot',
    personaName: 'John Deaton',
    accountSlug: 'the-home-depot',
    subject: 'Home Depot supply chain - yard gap',
    body: [
      'John,',
      'Home Depot has invested over $1B in supply chain infrastructure over the past three years. TMS, WMS, automation. But the yard at each DC is typically the last piece that\'s still manual.',
      'At 200+ distribution points, a 10-minute improvement in gate-to-dock time compounds fast. That means fewer detention charges, tighter dock utilization, and better carrier relationships.',
      'Primo Brands switched to YardFlow and cut dwell time in half. The math looks similar at Home Depot scale.',
      `Put together a brief overview: ${BASE}/for/the-home-depot`,
      'We have a booth at MODEX next week in Atlanta. Would 15 minutes work?',
      'Casey',
    ],
  },
  // ── 6. Jim Small — Honda ──────────────────────────────────────────────
  {
    to: 'jim.small@honda.com',
    firstName: 'Jim',
    accountName: 'Honda',
    personaName: 'Jim Small',
    accountSlug: 'honda',
    subject: 'Honda Logistics yard visibility',
    body: [
      'Jim,',
      'Automotive inbound logistics is the most yard-intensive operation there is. Parts arrive JIT. A single yard delay can ripple into a production line shutdown.',
      'Most manufacturing plants we talk to don\'t have real-time visibility between the gate and the dock. The yard runs on manual check-ins and radio calls.',
      'Primo Brands replaced their yard system with YardFlow and cut gate-to-dock time in half. The density of your Marysville and East Liberty operations makes the case even stronger.',
      `Overview for Honda: ${BASE}/for/honda`,
      'At MODEX April 13-16. Open to a conversation?',
      'Casey',
    ],
  },
  // ── 7. Cory Reed — John Deere ─────────────────────────────────────────
  {
    to: 'cory.reed@johndeere.com',
    firstName: 'Cory',
    accountName: 'John Deere',
    personaName: 'Cory Reed',
    accountSlug: 'john-deere',
    subject: 'Deere supply management - yard gap',
    body: [
      'Cory,',
      'Deere has digitized almost everything in the "Smart Industrial" strategy. Precision ag, autonomous equipment, predictive maintenance. But the factory yard is usually the gap.',
      'Between the gate and the dock at a Deere plant, most sites still run manual. That\'s where inbound parts queue up, staging gets chaotic during seasonal peaks, and nobody has real-time data.',
      'Primo Brands replaced Kaleris with YardFlow. Cut gate-to-dock time in half. The complexity of Deere\'s multi-campus manufacturing makes the fit even tighter.',
      `Short overview for Deere: ${BASE}/for/john-deere`,
      'At MODEX in Atlanta next week. Worth 15 minutes?',
      'Casey',
    ],
  },
  // ── 8. Annette Danek-Akey — Barnes & Noble ────────────────────────────
  {
    to: 'annette.danek-akey@bn.com',
    firstName: 'Annette',
    accountName: 'Barnes & Noble',
    personaName: 'Annette Danek-Akey',
    accountSlug: 'barnes-noble',
    subject: 'B&N distribution yard ops',
    body: [
      'Annette,',
      'B&N\'s distribution centers handle massive seasonal volume swings. Back-to-school, holidays, new releases. When inbound trailers start stacking up in the yard, dock scheduling falls apart.',
      'Most DCs we talk to don\'t have real-time visibility on what\'s between the gate and the dock. YardFlow fixes that. Automated gate check-in, real-time yard positioning, and faster dock assignment.',
      'Primo Brands deployed it at every facility and cut their dwell time in half.',
      `Quick overview for B&N: ${BASE}/for/barnes-noble`,
      'We\'re at MODEX April 13-16 in Atlanta. Open to a conversation?',
      'Casey',
    ],
  },
  // ── 9. Kristi Montgomery — Kenco Logistics ────────────────────────────
  {
    to: 'kristi.montgomery@kencogroup.com',
    firstName: 'Kristi',
    accountName: 'Kenco Logistics Services',
    personaName: 'Kristi Montgomery',
    accountSlug: 'kenco-logistics-services',
    subject: 'Yard tech for Kenco clients',
    body: [
      'Kristi,',
      'Your role in strategic transformation is exactly why I\'m reaching out. Kenco manages yards for dozens of clients. If yard ops improve at one site, that compounds across the entire portfolio.',
      'Most 3PL yards run on manual check-ins and radio dispatching. No real-time visibility between gate and dock. That\'s where detention charges accumulate and dock windows slip.',
      'Primo Brands switched from Kaleris to YardFlow. Gate-to-dock time dropped 50% across every facility. For a 3PL, that\'s a competitive advantage you can sell to every client.',
      `Overview for Kenco: ${BASE}/for/kenco-logistics-services`,
      'At MODEX next week. Would 15 minutes work?',
      'Casey',
    ],
  },
  // ── 10. Yongchul Chung — Hyundai Motor America ────────────────────────
  {
    to: 'yongchul.chung@hmna.com',
    firstName: 'Yongchul',
    accountName: 'Hyundai Motor America',
    personaName: 'Yongchul Chung',
    accountSlug: 'hyundai-motor-america',
    subject: 'Hyundai logistics yard visibility',
    body: [
      'Yongchul,',
      'With the new Metaplant in Georgia ramping up and NA volume growing, Hyundai\'s yard operations at VPCs and distribution centers are handling more trailers than ever.',
      'The gap between gate check-in and dock assignment is where most automotive logistics teams lose time. Manual yard management doesn\'t scale with EV production volumes.',
      'Primo Brands replaced their yard system with YardFlow and cut gate-to-dock time in half. Automotive yards are even more complex.',
      `Overview for Hyundai: ${BASE}/for/hyundai-motor-america`,
      'We\'re at MODEX in Atlanta April 13-16. Worth a quick conversation?',
      'Casey',
    ],
  },
];
