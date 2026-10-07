/**
 * REPRESENTATIVE ACCOUNT / CONDITION CORPUS (GAP OS execution recovery, R02, 2026-10-06). SCRATCH DATABASE ONLY.
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:55432/gap_finish_e2e npx tsx scripts/gap/recovery/seed-corpus.ts [--out <file>]
 *
 * Test-safe identities that reproduce the production SHAPES (never the real people or companies) the mandate names,
 * through the real intake and hypothesis authorities (registerSignal, proposeHypothesis, the transition machine,
 * recordMotionChoice), so a page, a route or a journey test exercises the same code production runs:
 *
 *   Pepsi Scratch Co     the recorded failure: Tom chosen, two checked facts (a warehouse closure, a partner
 *                        announcement), one sensitive fact (layoffs), NO usable thesis -> Research
 *   Fedex Scratch Co     a chosen person and an APPROVED grounded thesis on a verified fact -> Ready
 *   Walmart Scratch Co   a buyer replied "stop" -> Opted out (never cold work)
 *   Kroger Scratch Co    TWO open HubSpot deals under one company (R50), each with its own contact (Ann on the yard
 *                        pilot, Ben on the Columbus DC deal) -> In a deal; neither deal's work is the other's.
 *                        R51: a meeting with Ben on the Columbus deal tomorrow at 10 am New York, and a pilot meeting
 *                        with Ann that was CANCELED (nothing to prepare unless it is rebooked)
 *   Nfi Scratch Co       a 3PL with many eligible people and no choice -> Choose who hears this first
 *   Dannon Scratch Co    one person, no source, no fact, no thesis -> Research, nothing to draft
 *   Mills Scratch Co     an approved thesis whose only fact is a sale abroad -> the gate refuses it (not usable)
 *   Heb Scratch Co       the only operator on record LEFT the account -> Research: find the operator
 *   Costco Scratch Co    R55: a CLOSED-WON deal (a customer), a chosen person and an approved thesis that would read Ready
 *                        anywhere else -> Held: a customer; no first-touch campaign; expansion is the seller's call
 *   Sysco Scratch Co     R55: a CLOSED-LOST deal on Sep 1 and only an older fact -> Parked until something material changes
 *   Tyson Scratch Co     a verified JOB POSTING (claim class JOB_POSTING) and a chosen person, no thesis (R34): a
 *                        job-led opening in the posting's own words, prepared and reviewed, then sent from the job family
 *
 * Expected useful outcome per account is asserted by tests/unit/gap/scratch/*.scratch.test.ts, never assumed Ready.
 * Idempotent per tag: rerun with --tag to add a second corpus beside the first. Nothing here sends, drafts or
 * enrolls; HubSpot is never called (the stub answers the page later). People use reserved example.com addresses.
 */
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { registerSignal } from '../../../src/lib/gap/signals/registry';
import { VERIFIED_EXCERPT } from '../../../src/lib/gap/research/evidence-gate';
import { citedQuote } from '../../../src/lib/gap/research/propose';
import { proposeHypothesis, transitionHypothesis } from '../../../src/lib/gap/hypothesis/service';
import { recordMotionChoice } from '../../../src/lib/gap/motion/load';
import { recordEmploymentCorrection } from '../../../src/lib/gap/people/employment-store';

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
export const ACTOR = 'casey@freightroll.com';

export interface CorpusAccount {
  name: string;
  slug: string;
  expected: string;
  people: Array<{ id: number; name: string; title: string | null; email: string }>;
  facts: Array<{ id: string; label: string }>;
  hypotheses: Array<{ id: string; status: string }>;
  chosenPersonaId: number | null;
}

export interface Corpus {
  tag: string;
  seededAt: string;
  accounts: CorpusAccount[];
  /** For scripts/gap/recovery/stubs.mjs: the accounts the HubSpot stub must know, and the deals it must report. */
  stub: { companies: string[]; deals: Record<string, StubDeal[]> };
}

/** One deal the HubSpot stub reports (scripts/gap/recovery/stubs.mjs). */
export interface StubDeal {
  id: number;
  dealname: string;
  dealstage: string;
  hs_is_closed: boolean;
  /** R55: closed won (true) or lost (false); absent while open. */
  hs_is_closed_won?: boolean;
  closedate?: string;
  hs_next_step?: string;
  /** R50: the HubSpot contact ids on the deal. */
  contacts?: string[];
}

const slugOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** The HubSpot company id the stub (scripts/gap/recovery/stubs.mjs) derives for a name: the same hash, so the real company reads find it. */
export function stubCompanyId(name: string): string {
  const key = name.trim().toLowerCase();
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return String(900000000 + (h % 100000000));
}

/** A numeric id unique to the tag (deal and contact ids must not collide between two corpora in one stub). */
export function taggedId(tag: string, n: number): number {
  let h = 0;
  for (const c of tag) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (tag ? (h % 90000) + 10000 : 0) * 10000 + n;
}

export async function seedCorpus(prisma: PrismaClient, opts: { tag?: string; now?: Date } = {}): Promise<Corpus> {
  const now = opts.now ?? new Date();
  const tag = opts.tag ?? '';
  const nameOf = (base: string) => (tag ? `${base} ${tag}` : base);
  const out: Corpus = { tag, seededAt: now.toISOString(), accounts: [], stub: { companies: [], deals: {} } };
  let rank = 9200;
  let accession = 0;

  async function account(base: string, over: { vertical?: string; tier?: string; band?: string } = {}) {
    const name = nameOf(base);
    // The HubSpot company id the stub answers for (TAM in, no deals unless the deals file names it), so routing's own
    // company read and the people read run for real against the controlled boundary.
    await prisma.account.upsert({ where: { name }, update: { hubspot_company_id: stubCompanyId(name) }, create: { rank: (rank += 1), name, vertical: over.vertical ?? 'cpg', tier: over.tier ?? 'Tier 1', priority_band: over.band ?? 'A', hubspot_company_id: stubCompanyId(name) } });
    const entry: CorpusAccount = { name, slug: slugOf(name), expected: '', people: [], facts: [], hypotheses: [], chosenPersonaId: null };
    out.accounts.push(entry);
    out.stub.companies.push(name);
    return entry;
  }
  async function person(a: CorpusAccount, first: string, title: string, over: { last?: string; hubspotContactId?: string } = {}) {
    const last = over.last ?? 'Scratch';
    const email = `${first.toLowerCase()}@${a.slug}.example.com`;
    const row = await prisma.persona.upsert({
      where: { persona_id: `corpus:${a.slug}:${first.toLowerCase()}` },
      update: over.hubspotContactId ? { hubspot_contact_id: over.hubspotContactId } : {},
      create: { persona_id: `corpus:${a.slug}:${first.toLowerCase()}`, account_name: a.name, priority: 'P1', name: `${first} ${last}`, first_name: first, last_name: last, title, seniority: 'director', email, email_valid: true, email_status: 'valid', is_contact_ready: true, do_not_contact: false, company_domain: `${a.slug}.example.com`, ...(over.hubspotContactId ? { hubspot_contact_id: over.hubspotContactId } : {}) },
      select: { id: true, name: true, title: true, email: true },
    });
    a.people.push({ id: row.id, name: row.name, title: row.title, email: row.email ?? email });
    return row;
  }
  /** A verified, dated, quoted, external-ok fact on a publisher page: what the evidence gate admits (research/evidence-gate.ts). */
  async function fact(a: CorpusAccount, key: string, text: string, over: { title?: string; observedAt?: string; type?: string; host?: string; claimClass?: string; claimAttributes?: Record<string, unknown>; expiresAt?: string; metadata?: Record<string, unknown> } = {}) {
    const title = over.title ?? `${a.name} news (${key})`;
    const r = await registerSignal(prisma, {
      accountName: a.name,
      sourceKind: 'evidence_record',
      sourceId: `corpus:${a.slug}:${key}`,
      type: (over.type ?? 'site_expansion') as never,
      title,
      sourceType: 'public_secondary',
      evidenceUrl: `https://${over.host ?? 'news.example.com'}/${a.slug}/${key}-${(accession += 1)}`,
      evidenceText: text,
      externalOk: true,
      observedAt: new Date(over.observedAt ?? '2026-09-16T00:00:00Z'),
      ...(over.expiresAt ? { freshnessExpiresAt: new Date(over.expiresAt) } : {}),
      confidence: 80,
      // R22/R34: a claim of its own type keeps its class and attributes (research/claim-types.ts), as the verifier mints it.
      ...(over.claimClass ? { claimClass: over.claimClass } : {}),
      metadata: { verified: VERIFIED_EXCERPT, ...(over.claimClass ? { claimType: over.claimClass.toLowerCase(), claimAttributes: over.claimAttributes ?? {} } : {}), ...(over.metadata ?? {}) },
      registeredBy: ACTOR,
    });
    a.facts.push({ id: r.id, label: key });
    return { id: r.id, title, text };
  }
  const narrative = {
    persona: 'transportation',
    problemFamily: 'hidden_capacity',
    problemHypothesis: 'My guess is that the network change above moves load onto the physical handoffs that remain, and that is where production capacity is won or lost.',
    rootCauseHypotheses: ['Manual gate check-in'],
    impactHypotheses: ['Detention at the remaining sites'],
    whyNow: null,
    falsificationQuestions: ['Did the change above add trailer volume or dwell at the sites that remain?'],
    whatANoMeans: 'If trailers do not wait longer at the sites that remain, the change moved no load onto the yard: this thesis is closed for this account.',
    confidence: 40,
    createdBy: ACTOR,
  };
  async function thesis(a: CorpusAccount, personaId: number, f: { id: string; title: string; text: string }, to: 'draft' | 'review_required' | 'approved' | 'active') {
    const r = await proposeHypothesis(prisma, { ...narrative, accountName: a.name, primaryPersonaId: personaId, observation: citedQuote(f.title, f.text, f.id, a.name), signalIds: [f.id], primarySignalId: f.id, sourceRef: `corpus:${a.slug}:${f.id}:p${personaId}` });
    // A rerun finds its own earlier row (the source_ref is the idempotency key) and carries on from its status.
    const id = r.ok ? r.id : r.reason === 'duplicate_source_ref' && r.existingId ? r.existingId : null;
    if (!id) throw new Error(`propose at ${a.name}: ${JSON.stringify(r)}`);
    const ctx = { now, actor: ACTOR, reason: 'corpus seed' };
    const order = ['draft', 'review_required', 'approved', 'active'] as const;
    const current = (await prisma.prospectingHypothesis.findUnique({ where: { id }, select: { status: true } }))?.status ?? 'draft';
    const steps: Array<'submit' | 'approve' | 'activate'> = (['submit', 'approve', 'activate'] as const).slice(Math.max(0, order.indexOf(current as never)), order.indexOf(to));
    for (const action of steps) {
      const t = await transitionHypothesis(prisma, id, action, ctx);
      if (!t.ok) throw new Error(`${action} at ${a.name}: ${t.reason}`);
    }
    a.hypotheses.push({ id, status: to });
    return id;
  }
  async function choose(a: CorpusAccount, personaId: number) {
    const r = await recordMotionChoice(prisma, { accountName: a.name, primaryPersonaId: personaId, nextPersonaId: null, actor: ACTOR });
    if (!r.ok) throw new Error(`choose at ${a.name}: ${r.reason}`);
    a.chosenPersonaId = personaId;
  }
  /** A Meeting row (the table the account context and Work read), idempotent by its corpus key. */
  async function meeting(a: CorpusAccount, key: string, m: { date: Date; time: string | null; status: string; objective: string; attendees: string; dealId: string | null }) {
    const idStr = `corpus:${a.slug}:${key}`;
    const have = await prisma.meeting.findFirst({ where: { meeting_id_str: idStr }, select: { id: true } });
    if (have) return have.id;
    const row = await prisma.meeting.create({ data: { meeting_id_str: idStr, account_name: a.name, meeting_status: m.status, meeting_date: m.date, meeting_time: m.time, objective: m.objective, persona: m.attendees, hubspot_deal_id: m.dealId }, select: { id: true } });
    return row.id;
  }
  async function reply(a: CorpusAccount, p: { email: string | null; name: string }, text: string, at: string) {
    const threadId = `corpus-thread-${a.slug}`;
    await prisma.emailThread.upsert({ where: { id: threadId }, update: {}, create: { id: threadId, account_name: a.name, persona_email: p.email, subject: 'Re: trailer turns at your sites', last_message_at: new Date(at) } });
    await prisma.inboundMessage.upsert({ where: { id: `corpus-msg-${a.slug}` }, update: {}, create: { id: `corpus-msg-${a.slug}`, thread_id: threadId, from_email: p.email ?? '', from_name: p.name, subject: 'Re: trailer turns at your sites', body_text: text, snippet: text.slice(0, 80), received_at: new Date(at), source: 'gmail' } });
  }

  // ---- Pepsi Scratch Co: the recorded failure shape ----
  {
    const a = await account('Pepsi Scratch Co');
    a.expected = 'Research with two checked facts and no usable thesis; Tom chosen; the draft from the warehouse closure must prepare a valid proposal and stay visible';
    const tom = await person(a, 'Tom', 'Senior Director - Logistics, Distribution & Transportation');
    await person(a, 'Kay', 'Senior Director - Transportation');
    // The PRODUCTION row's own fields (read-only by the lead, 2026-10-07): type site_expansion, observed 2026-07-23T10:17:19Z,
    // an explicit expiry 2026-11-20T10:17:19Z, no claim class, public_secondary, metadata.change, no continuity key.
    await fact(a, 'tulsa', `${a.name} will close its warehouse operations at its Tulsa, Oklahoma, production facility and shift duties to a new site in the area.`, { title: `${a.name} to cease warehouse operations at Oklahoma production site`, observedAt: '2026-07-23T10:17:19Z', expiresAt: '2026-11-20T10:17:19Z', metadata: { change: 'closure' } });
    await fact(a, 'gatik', `${a.name} and Gatik announced a multi-year agreement to deploy autonomous freight across its North America distribution network.`, { title: `${a.name} and Gatik announce multi-year agreement`, observedAt: '2026-08-25T00:00:00Z', type: 'technology_signal' });
    await fact(a, 'maryland', `${a.name} is ceasing manufacturing and warehouse operations at a bottling plant in Maryland, which will result in 143 layoffs, according to a WARN notice.`, { title: `${a.name} ending manufacturing and warehouse operations in Maryland`, observedAt: '2026-09-16T00:00:00Z' });
    await choose(a, tom.id);
  }
  // ---- Fedex Scratch Co: ready ----
  {
    const a = await account('Fedex Scratch Co', { vertical: 'logistics' });
    a.expected = 'Ready for a first touch to the chosen person on one approved grounded thesis';
    const glen = await person(a, 'Glen', 'Managing Director, Surface Transportation');
    await person(a, 'Lisa', 'VP Operations');
    const f = await fact(a, 'hubs', `${a.name} will close two freight terminals in Ohio and consolidate their linehaul operations into its Columbus hub in 2027.`, { title: `${a.name} consolidates Ohio terminals`, observedAt: '2026-10-01T00:00:00Z' });
    await thesis(a, glen.id, f, 'approved');
    await choose(a, glen.id);
  }
  // ---- Walmart Scratch Co: opted out ----
  {
    const a = await account('Walmart Scratch Co', { vertical: 'retail' });
    a.expected = 'Opted out: record it; never a cold action, never at the head of Work';
    const doug = await person(a, 'Doug', 'Senior Director, Transportation');
    const f = await fact(a, 'dc', `${a.name} opened a new 1.1 million square foot distribution center in Texas.`, { title: `${a.name} opens Texas DC`, observedAt: '2026-09-20T00:00:00Z' });
    // A reply is only read for a person GAP has worked (replies/list.ts loadKnownAddresses): an approved thesis for Doug.
    await thesis(a, doug.id, f, 'approved');
    await reply(a, { email: doug.email, name: doug.name }, 'stop', '2026-10-05T14:00:00Z');
  }
  // ---- Kroger Scratch Co: two open deals under one company, each with its own contact (R50) ----
  {
    const a = await account('Kroger Scratch Co', { vertical: 'grocery' });
    a.expected = 'In a deal (two): each deal worked on its own, never a cold first touch; neither deal shares the other\'s obligations, requirements or next steps';
    const annContact = String(taggedId(tag, 81));
    const benContact = String(taggedId(tag, 82));
    await person(a, 'Ann', 'VP Supply Chain Operations', { hubspotContactId: annContact });
    await person(a, 'Ben', 'Director, Columbus Distribution Center', { hubspotContactId: benContact });
    await fact(a, 'automation', `${a.name} is automating its Ohio distribution center with a new robotic fulfillment system.`, { title: `${a.name} automates Ohio DC`, observedAt: '2026-09-10T00:00:00Z', type: 'automation_program' });
    out.stub.deals[a.name] = [
      { id: taggedId(tag, 7001), dealname: `YardFlow - ${a.name}`, dealstage: 'appointmentscheduled', hs_is_closed: false, contacts: [annContact], hs_next_step: 'Pilot scope call with Ann' },
      { id: taggedId(tag, 7002), dealname: `${a.name} Columbus DC`, dealstage: 'qualifiedtobuy', hs_is_closed: false, contacts: [benContact] },
    ];
    // R51: tomorrow (New York) as a date-only row, the way the meetings table stores a day; the time rides in meeting_time.
    const tomorrow = new Date(`${new Date(now.getTime() + 86_400_000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })}T00:00:00Z`);
    await meeting(a, 'columbus-walk', { date: tomorrow, time: '10:00 AM', status: 'Scheduled', objective: 'Columbus yard walk with Ben', attendees: 'Ben Scratch', dealId: String(taggedId(tag, 7002)) });
    await meeting(a, 'pilot-scope', { date: tomorrow, time: '2:00 PM', status: 'Canceled', objective: 'Pilot scope call', attendees: 'Ann Scratch', dealId: String(taggedId(tag, 7001)) });
  }
  // ---- Nfi Scratch Co: many eligible people, no choice ----
  {
    const a = await account('Nfi Scratch Co', { vertical: '3PL / Logistics' });
    a.expected = 'Choose who hears this first (many eligible); a usable thesis exists; nobody is auto-picked';
    const titles = ['VP Transportation', 'Director of Transportation', 'Senior Manager, Fleet Operations', 'Director, Distribution', 'VP Operations', 'Director, Yard Operations'];
    const people = [];
    for (let i = 0; i < titles.length; i += 1) people.push(await person(a, `Person${i + 1}`, titles[i]));
    const f = await fact(a, 'terminal', `${a.name} opened a new cross-dock terminal in New Jersey adding 120 dock doors.`, { title: `${a.name} opens New Jersey terminal`, observedAt: '2026-09-28T00:00:00Z' });
    await thesis(a, people[0].id, f, 'approved');
  }
  // ---- Dannon Scratch Co: nothing ----
  {
    const a = await account('Dannon Scratch Co');
    a.expected = 'Research: no source, no fact, no thesis; nothing to draft; an honest no-action';
    await person(a, 'Pat', 'Director Logistics');
  }
  // ---- Mills Scratch Co: a thesis the gate refuses ----
  {
    const a = await account('Mills Scratch Co');
    a.expected = 'Research: the only thesis opens on a sale abroad, not usable; nothing to open on';
    const p = await person(a, 'Jo', 'Director Transportation');
    const f = await fact(a, 'brazil', `${a.name} entered into an agreement to sell its business in Brazil to a local buyer.`, { title: `${a.name} agrees to sell Brazil business`, observedAt: '2026-09-23T00:00:00Z', type: 'acquisition' });
    // Production reached ACTIVE on this shape before the gate existed (General Mills); the machine refuses it today,
    // so the legacy state is reproduced the only way it can still arise: a direct status write.
    const id = await thesis(a, p.id, f, 'draft');
    await prisma.prospectingHypothesis.update({ where: { id }, data: { status: 'active', reviewed_by: ACTOR, reviewed_at: new Date('2026-09-26T02:47:26Z'), activated_at: new Date('2026-09-26T02:50:00Z') } });
    a.hypotheses[a.hypotheses.length - 1].status = 'active (legacy, gate refuses)';
  }
  // ---- Heb Scratch Co: the only operator left ----
  {
    const a = await account('Heb Scratch Co', { vertical: 'grocery' });
    a.expected = 'Research: find the operator (the only operator on record left the account); nobody is mailed';
    const d = await person(a, 'Dakota', 'Director Transportation');
    await fact(a, 'expansion', `${a.name} is expanding its San Antonio distribution campus with a new 500,000 square foot warehouse.`, { title: `${a.name} expands San Antonio campus`, observedAt: '2026-09-18T00:00:00Z' });
    const left = await recordEmploymentCorrection(prisma, { personaId: d.id, actor: ACTOR, now, status: 'left', newCompany: null, note: 'corpus: left the account' });
    if (!left.ok) throw new Error(`employment at ${a.name}: ${left.reason}`);
  }
  // ---- Costco Scratch Co: a customer (R55) ----
  {
    const a = await account('Costco Scratch Co', { vertical: 'retail' });
    a.expected = 'Held: a customer (closed won); no first-touch campaign even with an approved thesis and a chosen person; expansion is explicit context';
    const val = await person(a, 'Val', 'Director of Transportation');
    const f = await fact(a, 'dc', `${a.name} opened a new cross-dock in Arizona with 90 dock doors.`, { title: `${a.name} opens Arizona cross-dock`, observedAt: '2026-09-25T00:00:00Z' });
    await thesis(a, val.id, f, 'approved');
    await choose(a, val.id);
    out.stub.deals[a.name] = [{ id: taggedId(tag, 7101), dealname: `${a.name} yard network`, dealstage: 'closedwon', hs_is_closed: true, hs_is_closed_won: true, closedate: '2026-09-15T16:00:00.000Z' }];
  }
  // ---- Sysco Scratch Co: parked after a lost deal (R55) ----
  {
    const a = await account('Sysco Scratch Co', { vertical: 'food' });
    a.expected = 'Parked: the deal closed lost Sep 1 and nothing material has changed since; a newer verified fact or a buyer reply unparks it';
    const lee = await person(a, 'Lee', 'VP Transportation');
    const f = await fact(a, 'terminal', `${a.name} opened a new distribution terminal in Ohio with 60 dock doors.`, { title: `${a.name} opens Ohio terminal`, observedAt: '2026-08-20T00:00:00Z' });
    await thesis(a, lee.id, f, 'approved');
    await choose(a, lee.id);
    out.stub.deals[a.name] = [{ id: taggedId(tag, 7201), dealname: `${a.name} pilot`, dealstage: 'closedlost', hs_is_closed: true, hs_is_closed_won: false, closedate: '2026-09-01T16:00:00.000Z' }];
  }
  // ---- Tyson Scratch Co: a job-led opening (R34) ----
  {
    const a = await account('Tyson Scratch Co', { vertical: 'food' });
    a.expected = "A job-led opening: the posting's own words and one question (still open? are the yards where the day gets lost?); drafted, reviewed, then sent from the job family, never in the physical-change words";
    const rae = await person(a, 'Rae', 'Director of Transportation');
    await fact(a, 'yard-ops-posting', `${a.name} is hiring a Yard Operations Manager at its Amarillo distribution center to manage trailer moves and dock appointments.`, { title: `Yard Operations Manager - Amarillo | ${a.name} Careers`, observedAt: '2026-09-30T00:00:00Z', type: 'job_posting', host: `careers.${a.slug}.example.com`, claimClass: 'JOB_POSTING', claimAttributes: { role: 'Yard Operations Manager', postingStatus: 'open' } });
    await choose(a, rae.id);
  }

  return out;
}

async function main() {
  if (!SCRATCH_URL.test(process.env.DATABASE_URL ?? '')) throw new Error('refusing: DATABASE_URL is not the scratch database (127.0.0.1:5433/gap_dev or 55432/gap_finish_e2e)');
  if (process.env.HUBSPOT_ACCESS_TOKEN) throw new Error('refusing: HUBSPOT_ACCESS_TOKEN is set; the corpus never touches HubSpot');
  const tagIdx = process.argv.indexOf('--tag');
  const outIdx = process.argv.indexOf('--out');
  const prisma = new PrismaClient();
  try {
    const corpus = await seedCorpus(prisma, { tag: tagIdx > 0 ? process.argv[tagIdx + 1] : undefined });
    const text = JSON.stringify(corpus, null, 2);
    if (outIdx > 0) writeFileSync(process.argv[outIdx + 1], text);
    console.log(text);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && /seed-corpus\.ts$/.test(process.argv[1].replace(/\\/g, '/'))) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
