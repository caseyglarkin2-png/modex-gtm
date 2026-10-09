/**
 * C53 (the commercial-context audit, 2026-10-08): RETRIEVAL IS EVALUATED BEFORE PROSE. Over the frozen reference
 * set (tests/unit/gap/fixtures/reference-set.ts) each case's sources become sink adapters for the real assembler
 * (context/assemble.ts with context/retrieval.ts behind it); the packet is then measured per class, with the sample
 * size, never as one aggregate score:
 *
 *   source_recall           every required source reached the packet (by source id, url, deal id or verbatim text)
 *   claim_provenance        every claim carries a source id and a date; a refresh time is never its observation date
 *   thread_coverage         every message of the person is on the timeline, drafts typed as drafts, calendar apart
 *   conflict_handling       a seller "no deal" line never moves opportunity; an older fact keeps its own date
 *   unauthorized_exclusion  no seller note, inference, modeled figure or internal line is externally usable
 *   instruction_safety      an instruction in a source stays quoted data: the adapters are called exactly as reads,
 *                           nothing else is called, and the text never leaves the claim it came from
 *   opportunity_status      the CRM's answer under a complete read; unknown when the read is missing
 *
 * The missing-source variant of every case runs too (the source removed), so an unreadable source is measured as
 * said-unknown rather than as an empty history. The evaluator itself has a known-bad run in its test so a report of
 * zero failures is a measurement, not a default.
 */
import { VERIFIED_EXCERPT, type GateSignal } from '../research/evidence-gate';
import { assembleCommercialContext, type AssembleAdapters, type AssembleReport, type OpportunityRead } from '../context/assemble';
import { externallyUsable, type CommercialContextPacket, type ContextClaim, type ContextIdentity, type TimelineEvent } from '../context/commercial-context';
import type { ClawdSnapshot, VaultAdapter } from '../context/retrieval';
import type { ReferenceCase, ReferenceSource } from './reference-types';

export type EvalClass = 'source_recall' | 'claim_provenance' | 'thread_coverage' | 'conflict_handling' | 'unauthorized_exclusion' | 'instruction_safety' | 'opportunity_status';
export const EVAL_CLASSES: readonly EvalClass[] = ['source_recall', 'claim_provenance', 'thread_coverage', 'conflict_handling', 'unauthorized_exclusion', 'instruction_safety', 'opportunity_status'];

export interface EvalFailure {
  caseId: string;
  variant: 'full' | 'missing_source';
  detail: string;
}

export interface RetrievalEvalReport {
  generatedAt: string;
  referenceVersion: number;
  sampleSize: { cases: number; runs: number };
  classes: Record<EvalClass, { checked: number; failures: EvalFailure[] }>;
  /** Per run: what was retrieved, for the receipt. */
  runs: Array<{ caseId: string; variant: 'full' | 'missing_source'; claims: number; timeline: number; opportunity: string; calls: string[]; gaps: string[] }>;
}

export interface SinkRun {
  report: AssembleReport;
  /** Every adapter call, in order, by kind (the instruction-safety class asserts this is reads only). */
  calls: string[];
}

const dayOf = (iso: string | null) => (iso ? iso.slice(0, 10) : null);
const PERSON_SOURCE = (c: ReferenceCase, s: ReferenceSource) => !!c.person && s.kind === 'gmail';

/** The reference case's sources as sink adapters for the real assembler; every call is logged. */
export function sinkAdapters(c: ReferenceCase, opts: { remove?: string | null; promoteSellerNote?: boolean } = {}): { adapters: AssembleAdapters; calls: string[] } {
  const calls: string[] = [];
  const sources = c.sources.filter((s) => s.sourceId !== opts.remove);
  const identity: ContextIdentity = {
    accountName: c.expected.identity.ambiguous ? null : c.account?.name ?? null,
    via: c.expected.identity.via as ContextIdentity['via'],
    ambiguous: c.expected.identity.ambiguous,
    hubspotCompanyIds: c.account?.hubspotCompanyId ? [c.account.hubspotCompanyId] : [],
    domains: c.account?.domains ?? [],
    people: c.person ? [{ email: c.person.email, name: c.person.name, title: c.person.title, personaId: null, hubspotContactId: null, via: 'persona' }] : [],
  };
  const dealSources = sources.filter((s) => s.kind === 'crm' && /^hubspot:deal:/.test(s.sourceId));
  const crmSources = sources.filter((s) => s.kind === 'crm');
  const vaultSources = sources.filter((s) => s.kind === 'vault');
  const clawdSources = sources.filter((s) => s.kind === 'clawd');
  const publicSources = sources.filter((s) => s.kind === 'public');
  const mailSources = sources.filter((s) => s.kind === 'gmail' || s.kind === 'calendar');

  const vault: VaultAdapter = {
    readFile: async (relPath) => {
      calls.push(`vault.readFile:${relPath}`);
      if (!c.account || !relPath.includes(c.account.name)) return null;
      if (!vaultSources.length) return null;
      const indexedAt = dayOf(vaultSources[0].indexedAt ?? null) ?? '2026-10-08';
      const notes = vaultSources.map((s) => `- ${dayOf(s.at) ?? 'undated'} standup: ${s.text}`).join('\n');
      return `---\ntype: account\ncompany: ${c.account.name}\ndomain: ${c.account.domains[0] ?? ''}\nlast_refreshed: ${indexedAt}\n---\n# ${c.account.name}\n\n## Inbox notes\n${notes}\n`;
    },
  };
  const clawd = {
    fetchSnapshot: async (domain: string): Promise<ClawdSnapshot> => {
      calls.push(`clawd.fetchSnapshot:${domain}`);
      if (!clawdSources.length) return { found: false, rebuiltAt: null, reasoningNotes: [] };
      return { found: true, rebuiltAt: clawdSources[0].indexedAt ?? null, reasoningNotes: clawdSources.map((s) => `<strong>Vault wedge (${dayOf(s.at) ?? '2026-01-01'}):</strong> ${s.text}`) };
    },
  };

  const adapters: AssembleAdapters = {
    identity: async () => { calls.push('identity.read'); return identity; },
    opportunity: async (id): Promise<OpportunityRead | null> => {
      calls.push('crm.read');
      if (id.ambiguous || !crmSources.length) return null;
      const deals = dealSources.map((s) => {
        const m = /Deal "([^"]+)" at (\w+)(?:; next step: ([^;]+))?(?:; contacts: ([^.]+))?/.exec(s.text);
        const contacts = (m?.[4] ?? '').split(',').map((x) => x.trim()).filter((x) => x && x !== 'none');
        return { id: s.sourceId.replace(/^hubspot:deal:/, ''), name: m?.[1] ?? null, stage: m?.[2] ?? 'unknown', nextStep: m?.[3]?.trim() ?? null, closeDate: null, contactIds: c.person && contacts.includes(c.person.name) ? [c.person.email] : [] };
      });
      return { opportunity: { status: deals.length ? 'open' : 'none', deals, coverage: 'complete', checkedAt: crmSources[0].at, scopedDealId: deals.length === 1 ? deals[0].id : null }, completeness: 'complete', watermark: crmSources[0].at };
    },
    timeline: async () => {
      calls.push('gmail.read');
      const events: TimelineEvent[] = mailSources.map((s) => {
        const isDraft = /:draft:/.test(s.sourceId);
        const sent = /^Sent:/.test(s.text);
        const calendar = s.kind === 'calendar';
        const outbound = isDraft || sent;
        return {
          id: s.sourceId, at: s.at ?? '1970-01-01T00:00:00.000Z', direction: outbound ? 'outbound' : 'inbound', type: isDraft ? 'draft' : calendar ? 'calendar' : 'email', provider: 'gmail', providerIds: [s.sourceId.replace(/^(gmail|calendar):(draft:)?/, '')],
          from: outbound ? 'casey@yardflow.ai' : c.person?.email ?? null, to: outbound ? [c.person?.email ?? ''] : ['casey@yardflow.ai'], subject: null, excerpt: s.text, isDraft, purpose: calendar ? 'calendar' : c.expected.purposes[0] ?? 'unknown',
        };
      });
      return { events, coverage: [{ source: 'gmail', configured: true, reachable: true, completeness: 'complete', watermark: events.map((e) => e.at).sort().at(-1) ?? null }] };
    },
    knowledge: { vault, clawd },
    publicFacts: async () => {
      calls.push('public.read');
      return publicSources.map((s, n): GateSignal => ({ id: `ref-${c.id}-${n}`, account_name: c.account?.name ?? null, source_type: 'public_primary', evidence_text: s.text, evidence_url: s.sourceId.replace(/^public:/, ''), observed_at: s.at, external_ok: !!s.externalOk, metadata: { verified: VERIFIED_EXCERPT }, title: null }));
    },
    commitments: async () => { calls.push('commitments.read'); return []; },
  };
  if (opts.promoteSellerNote) {
    // The known-bad adapter for the evaluator's own test: a seller note leaves as a buyer fact marked external.
    const inner = adapters.timeline!;
    adapters.timeline = async (q) => {
      const r = await inner(q);
      const note = vaultSources[0] ?? clawdSources[0];
      if (note) r.events.push({ id: 'promoted', at: note.at ?? '2026-01-01T00:00:00.000Z', direction: 'inbound', type: 'email', provider: 'gmail', providerIds: ['promoted'], from: c.person?.email ?? 'x@y', to: [], subject: null, excerpt: note.text, isDraft: false, purpose: 'buyer_conversation' });
      return r;
    };
  }
  return { adapters, calls };
}

export async function runCase(c: ReferenceCase, variant: 'full' | 'missing_source', now: Date, opts: { promoteSellerNote?: boolean } = {}): Promise<SinkRun> {
  const { adapters, calls } = sinkAdapters(c, { remove: variant === 'missing_source' ? c.missingSource.remove : null, promoteSellerNote: opts.promoteSellerNote });
  const report = await assembleCommercialContext(adapters, { accountName: c.expected.identity.ambiguous ? null : c.account?.name ?? null, aliases: c.account?.aliases ?? [], domain: c.account?.domains[0] ?? null, people: [], now });
  return { report, calls };
}

/** Every claim once: an incumbent claim is the same object as its buyer fact or seller note. */
const allClaims = (p: CommercialContextPacket): ContextClaim[] => { const seen = new Set<string>(); return [...p.buyerFacts, ...p.sellerHypotheses, ...p.incumbents, ...p.externalFacts].filter((c) => !seen.has(c.claimId) && seen.add(c.claimId)); };
const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

/** Whether one reference source reached the packet: by id, by url, by deal id or by its verbatim text. */
export function retrieved(p: CommercialContextPacket, s: ReferenceSource): boolean {
  const claims = allClaims(p);
  const url = s.kind === 'public' ? s.sourceId.replace(/^public:/, '') : null;
  if (url && claims.some((c) => c.url === url)) return true;
  if (/^hubspot:deal:/.test(s.sourceId) && p.opportunity.deals.some((d) => d.id === s.sourceId.replace(/^hubspot:deal:/, ''))) return true;
  if (p.timeline.some((e) => e.id === s.sourceId || e.providerIds.includes(s.sourceId.replace(/^(gmail|calendar):(draft:)?/, '')))) return true;
  if (claims.some((c) => c.sourceId === s.sourceId)) return true;
  const t = norm(s.text);
  return claims.some((c) => norm(c.text).includes(t) || t.includes(norm(c.text).replace(/^[^:]+@[^:]+: /, '')));
}

export function measure(c: ReferenceCase, variant: 'full' | 'missing_source', run: SinkRun): Partial<Record<EvalClass, string[]>> {
  const p = run.report.packet;
  const f: Partial<Record<EvalClass, string[]>> = {};
  const add = (k: EvalClass, d: string) => { (f[k] ??= []).push(d); };
  const removed = variant === 'missing_source' ? c.missingSource.remove : null;
  const sources = c.sources.filter((s) => s.sourceId !== removed);

  // source_recall: every required source that is still present must be in the packet.
  for (const id of c.expected.requiredSources) {
    const s = sources.find((x) => x.sourceId === id);
    if (!s) continue;
    if (!retrieved(p, s)) add('source_recall', `required ${id} not in the packet`);
  }
  // claim_provenance: a source id and a date on every claim; indexedAt never doubles as observedAt.
  for (const cl of allClaims(p)) {
    if (!cl.sourceId) add('claim_provenance', `claim ${cl.claimId} has no source id`);
    if (!cl.observedAt && !cl.eventAt) add('claim_provenance', `claim ${cl.sourceId} has no date`);
    if (cl.indexedAt && cl.observedAt === cl.indexedAt && cl.eventAt === null) add('claim_provenance', `claim ${cl.sourceId} dates itself by its refresh time`);
  }
  for (const r of run.report.refused) add('claim_provenance', `refused ${r.claimId}: ${r.reason}`);
  // thread_coverage: every message of the person on the timeline, drafts as drafts, calendar as calendar.
  for (const s of sources.filter((x) => PERSON_SOURCE(c, x) || x.kind === 'calendar')) {
    const e = p.timeline.find((x) => x.id === s.sourceId);
    if (!e) { add('thread_coverage', `${s.sourceId} not on the timeline`); continue; }
    if (/:draft:/.test(s.sourceId) && !(e.isDraft && e.type === 'draft')) add('thread_coverage', `${s.sourceId} is a draft typed ${e.type}`);
    if (s.kind === 'calendar' && e.type !== 'calendar') add('thread_coverage', `${s.sourceId} is calendar mail typed ${e.type}`);
    if (/:draft:/.test(s.sourceId) && p.buyerFacts.some((b) => b.sourceId.endsWith(e.providerIds[0]))) add('thread_coverage', `${s.sourceId}: a draft became a buyer fact`);
  }
  // conflict_handling: a seller no-deal line never moves opportunity; an older fact keeps its own date and stays visible.
  const noDeal = allClaims(p).find((cl) => /no associated deal/i.test(cl.text));
  if (noDeal) {
    if (noDeal.claimClass === 'buyer_said' || noDeal.authority === 'deal_existence') add('conflict_handling', `the seller line "${noDeal.text.slice(0, 40)}" carries ${noDeal.claimClass}/${noDeal.authority}`);
    if (sources.some((s) => /^hubspot:deal:/.test(s.sourceId)) && p.opportunity.status !== 'open') add('conflict_handling', `a vault no-deal line and an open CRM deal: status ${p.opportunity.status}`);
  }
  const publicDates = p.externalFacts.map((x) => x.observedAt).filter(Boolean) as string[];
  if (publicDates.length >= 2 && new Set(publicDates.map((d) => d.slice(0, 4))).size < 2 && c.id === 'general-mills-2013') add('conflict_handling', 'the older fact lost its own date');
  // unauthorized_exclusion: external use never carries a seller note, an inference, a modeled figure, an internal line or a non-external source's text.
  const ext = externallyUsable(allClaims(p));
  for (const cl of ext) if (cl.claimClass !== 'buyer_said' && cl.claimClass !== 'checked_public') add('unauthorized_exclusion', `${cl.sourceId} (${cl.claimClass}) is externally usable`);
  for (const s of sources.filter((x) => !x.externalOk && (x.claimClass === 'seller_noted' || x.claimClass === 'inference' || x.claimClass === 'internal_only' || x.claimClass === 'modeled'))) {
    if (ext.some((cl) => norm(cl.text).includes(norm(s.text)))) add('unauthorized_exclusion', `the ${s.claimClass} text of ${s.sourceId} is externally usable`);
  }
  // instruction_safety: reads only, and the instruction text only ever inside the claim or event it came from.
  const allowed = /^(identity\.read|crm\.read|gmail\.read|public\.read|commitments\.read|vault\.readFile:|clawd\.fetchSnapshot:)/;
  for (const call of run.calls) if (!allowed.test(call)) add('instruction_safety', `unexpected call ${call}`);
  for (const text of c.expected.neverExecute) {
    const outside = [...p.coverage.map((x) => `${x.query ?? ''} ${x.omittedReason ?? ''}`), p.identity.accountName ?? '', ...p.opportunity.deals.map((d) => `${d.name ?? ''} ${d.nextStep ?? ''}`), ...run.calls];
    if (outside.some((o) => o.includes(text))) add('instruction_safety', `"${text}" left its source`);
    if (ext.some((cl) => cl.text.includes(text))) add('instruction_safety', `"${text}" is externally usable`);
  }
  // opportunity_status: the CRM's answer, unknown when the read is missing.
  const expectedStatus = variant === 'missing_source' && c.missingSource.expectedOpportunity ? c.missingSource.expectedOpportunity : c.expected.opportunity;
  if (p.opportunity.status !== expectedStatus) add('opportunity_status', `status ${p.opportunity.status}, expected ${expectedStatus}`);
  return f;
}

export async function evaluateRetrieval(cases: readonly ReferenceCase[], opts: { now: Date; referenceVersion: number; promoteSellerNote?: boolean }): Promise<RetrievalEvalReport> {
  const classes = Object.fromEntries(EVAL_CLASSES.map((k) => [k, { checked: 0, failures: [] as EvalFailure[] }])) as RetrievalEvalReport['classes'];
  const runs: RetrievalEvalReport['runs'] = [];
  for (const c of cases) {
    for (const variant of ['full', 'missing_source'] as const) {
      const run = await runCase(c, variant, opts.now, { promoteSellerNote: opts.promoteSellerNote });
      const f = measure(c, variant, run);
      for (const k of EVAL_CLASSES) {
        classes[k].checked += 1;
        for (const detail of f[k] ?? []) classes[k].failures.push({ caseId: c.id, variant, detail });
      }
      const p = run.report.packet;
      runs.push({ caseId: c.id, variant, claims: allClaims(p).length, timeline: p.timeline.length, opportunity: p.opportunity.status, calls: run.calls, gaps: p.coverage.filter((x) => !x.reachable || x.completeness !== 'complete').map((x) => `${x.source}: ${x.omittedReason ?? x.completeness}`) });
    }
  }
  return { generatedAt: opts.now.toISOString(), referenceVersion: opts.referenceVersion, sampleSize: { cases: cases.length, runs: runs.length }, classes, runs };
}

export function renderRetrievalEval(r: RetrievalEvalReport): string {
  const lines: string[] = [];
  lines.push('# GAP OS retrieval evaluation (C53)');
  lines.push('');
  lines.push(`STATUS: MEASUREMENT, generated ${r.generatedAt} by scripts/gap/retrieval-eval.ts over reference set v${r.referenceVersion} (${r.sampleSize.cases} cases, ${r.sampleSize.runs} runs: each case whole and with one source removed). Sink adapters, the real assembler; no model, no network. Regenerate rather than edit.`);
  lines.push(`<!-- verified:${r.generatedAt.slice(0, 10)} -->`);
  lines.push('');
  lines.push('## Per class (failures over runs checked; never one aggregate score)');
  lines.push('');
  lines.push('| Class | Checked | Failures |');
  lines.push('|---|---|---|');
  for (const k of EVAL_CLASSES) lines.push(`| ${k} | ${r.classes[k].checked} | ${r.classes[k].failures.length} |`);
  lines.push('');
  const failing = EVAL_CLASSES.filter((k) => r.classes[k].failures.length);
  if (failing.length) {
    lines.push('## Failures');
    lines.push('');
    for (const k of failing) for (const f of r.classes[k].failures) lines.push(`- ${k} · ${f.caseId} (${f.variant}): ${f.detail}`);
    lines.push('');
  }
  lines.push('## Runs');
  lines.push('');
  for (const x of r.runs) lines.push(`- ${x.caseId} (${x.variant}): ${x.claims} claims, ${x.timeline} timeline events, opportunity ${x.opportunity}; reads: ${x.calls.map((c) => c.split(':')[0]).join(', ')}${x.gaps.length ? `; gaps: ${x.gaps.join('; ')}` : ''}`);
  lines.push('');
  return lines.join('\n');
}
