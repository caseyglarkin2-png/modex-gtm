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
 *   Kroger Scratch Co    an open HubSpot deal (the stub's deals file names it) -> In a deal
 *   Nfi Scratch Co       a 3PL with many eligible people and no choice -> Choose who hears this first
 *   Dannon Scratch Co    one person, no source, no fact, no thesis -> Research, nothing to draft
 *   Mills Scratch Co     an approved thesis whose only fact is a sale abroad -> the gate refuses it (not usable)
 *   Heb Scratch Co       the only operator on record LEFT the account -> Research: find the operator
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
  stub: { companies: string[]; deals: Record<string, Array<{ id: number; dealname: string; dealstage: string; hs_is_closed: boolean }>> };
}

const slugOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function seedCorpus(prisma: PrismaClient, opts: { tag?: string; now?: Date } = {}): Promise<Corpus> {
  const now = opts.now ?? new Date();
  const tag = opts.tag ?? '';
  const nameOf = (base: string) => (tag ? `${base} ${tag}` : base);
  const out: Corpus = { tag, seededAt: now.toISOString(), accounts: [], stub: { companies: [], deals: {} } };
  let rank = 9200;
  let accession = 0;

  async function account(base: string, over: { vertical?: string; tier?: string; band?: string } = {}) {
    const name = nameOf(base);
    await prisma.account.upsert({ where: { name }, update: {}, create: { rank: (rank += 1), name, vertical: over.vertical ?? 'cpg', tier: over.tier ?? 'Tier 1', priority_band: over.band ?? 'A' } });
    const entry: CorpusAccount = { name, slug: slugOf(name), expected: '', people: [], facts: [], hypotheses: [], chosenPersonaId: null };
    out.accounts.push(entry);
    out.stub.companies.push(name);
    return entry;
  }
  async function person(a: CorpusAccount, first: string, title: string, over: { last?: string } = {}) {
    const last = over.last ?? 'Scratch';
    const email = `${first.toLowerCase()}@${a.slug}.example.com`;
    const row = await prisma.persona.upsert({
      where: { persona_id: `corpus:${a.slug}:${first.toLowerCase()}` },
      update: {},
      create: { persona_id: `corpus:${a.slug}:${first.toLowerCase()}`, account_name: a.name, priority: 'P1', name: `${first} ${last}`, first_name: first, last_name: last, title, seniority: 'director', email, email_valid: true, email_status: 'valid', is_contact_ready: true, do_not_contact: false, company_domain: `${a.slug}.example.com` },
      select: { id: true, name: true, title: true, email: true },
    });
    a.people.push({ id: row.id, name: row.name, title: row.title, email: row.email ?? email });
    return row;
  }
  /** A verified, dated, quoted, external-ok fact on a publisher page: what the evidence gate admits (research/evidence-gate.ts). */
  async function fact(a: CorpusAccount, key: string, text: string, over: { title?: string; observedAt?: string; type?: string; host?: string } = {}) {
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
      confidence: 80,
      metadata: { verified: VERIFIED_EXCERPT },
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
    await fact(a, 'tulsa', `${a.name} will close its warehouse operations at its Tulsa, Oklahoma, production facility and shift duties to a new site in the area.`, { title: `${a.name} to cease warehouse operations at Oklahoma production site`, observedAt: '2026-07-23T00:00:00Z' });
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
  // ---- Kroger Scratch Co: in a deal (the stub reports an open deal) ----
  {
    const a = await account('Kroger Scratch Co', { vertical: 'grocery' });
    a.expected = 'In a deal: work it from the deal, never a cold first touch; the deal still blocks conflicting cold outreach';
    await person(a, 'Ann', 'VP Supply Chain Operations');
    await fact(a, 'automation', `${a.name} is automating its Ohio distribution center with a new robotic fulfillment system.`, { title: `${a.name} automates Ohio DC`, observedAt: '2026-09-10T00:00:00Z', type: 'automation_program' });
    out.stub.deals[a.name] = [{ id: 7001, dealname: `YardFlow - ${a.name}`, dealstage: 'appointmentscheduled', hs_is_closed: false }];
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
