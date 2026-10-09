/**
 * C54 (the commercial-context audit, 2026-10-08): GENERATED COMMERCIAL USEFULNESS, measured over held-out outputs.
 * The real handler (agents/develop-angle.ts) runs over the frozen reference set, each generating case whole and with
 * one source removed, for the three decisions a seller can take (pursue, more, explore): 36 outputs. Each output is
 * scored per check, with the sample size, never one aggregate:
 *
 *   produced             the handler returned an angle (a refusal names its reason; a voice break is a refusal)
 *   motion_and_person    deal work at an open deal is deal work scoped to the right deal; a cold case is never deal work
 *   known_answer         the output acknowledges what the record already answers (the case's must-say phrases)
 *   no_prohibited_claim  none of the case's prohibited claims appears
 *   no_authority_leak    no seller note, inference or internal line's words appear in the output
 *   supported_claims     every sentence labelled fact cites a record label (C22); an output without support is said
 *   specific_next_step   the proposed action fits the motion and the starters are open questions
 *   disconfirming        at least one starter admits a "no" (asks whether, or, if, still, already, not)
 *   house_voice          no em dash, no throughput, yards plural, no product, no money (the handler's own checks)
 *   missing_source_said  when a whole source kind could not be read (the missing-source variant removed the last CRM, vault
 *                        or Clawd source), the angle's context gaps or caveat name it; a silent angle fails
 *   supported_claims     also: at least one sentence is a FACT citing a record label, so the C22 fact path is exercised
 *
 * The run records the model and provider that answered, the prompt hash, the reference version and each packet
 * revision, and the cost from the spend ledger. A MOCKED run (a scripted generator) is labelled so and never claimed
 * as a live evaluation; the live run needs a funded model route and Casey's go.
 */
import { createHash } from 'node:crypto';
import { developAngle, type DevelopAngleDeps, type PreparedAngle } from '../agents/develop-angle';
import type { ClaimedTask } from '../agents/tasks';
import { MODEL_CALL, MODEL_CALL_SUBJECT } from '../ai/spend';
import { runCase } from './retrieval-eval';
import type { ReferenceCase, ReferenceSource } from './reference-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type QualityCheck = 'produced' | 'motion_and_person' | 'known_answer' | 'no_prohibited_claim' | 'no_authority_leak' | 'supported_claims' | 'specific_next_step' | 'disconfirming' | 'house_voice' | 'missing_source_said';
export const QUALITY_CHECKS: readonly QualityCheck[] = ['produced', 'motion_and_person', 'known_answer', 'no_prohibited_claim', 'no_authority_leak', 'supported_claims', 'specific_next_step', 'disconfirming', 'house_voice', 'missing_source_said'];
export const DECISIONS = ['pursue', 'more', 'explore'] as const;
export type Decision = (typeof DECISIONS)[number];
/** The motions that produce an angle; a reply owed, an opt-out, a vendor or a suspicious sender never reach the handler (the ranker keeps them out). */
export const GENERATING_MOTIONS = new Set(['deal_work', 'reengage', 'research_first', 'review_first']);

export interface QualityOutput {
  caseId: string;
  variant: 'full' | 'missing_source';
  decision: Decision;
  ok: boolean;
  refusal: string | null;
  angle: PreparedAngle | null;
  packetRevision: string | null;
  promptHash: string | null;
  model: string | null;
  failures: Array<{ check: QualityCheck; detail: string }>;
}

export interface QualityReport {
  generatedAt: string;
  mode: 'MOCKED' | 'LIVE';
  referenceVersion: number;
  sampleSize: { cases: number; outputs: number; refused: number };
  checks: Record<QualityCheck, { checked: number; failures: Array<{ caseId: string; variant: string; decision: Decision; detail: string }> }>;
  outputs: QualityOutput[];
  cost: { usd: number; calls: number; failed: number; refused: number };
  versions: { models: string[]; promptHashes: number };
}

export type Generate = NonNullable<DevelopAngleDeps['generate']>;

const lower = (s: string) => s.toLowerCase();
const words = (s: string) => s.split(/\s+/).filter(Boolean);

/** Whether any alternative of a must-say or prohibited entry ("Oct 14|meeting is ahead") appears in the text. */
export function mentions(text: string, entry: string): boolean {
  const t = lower(text);
  return entry.split('|').some((alt) => alt.trim() && t.includes(lower(alt.trim())));
}

/** A six-word span from an internal source that appears verbatim in the output is a leak. */
export function leakedSpan(text: string, source: ReferenceSource): string | null {
  const w = words(source.text.replace(/^(Sent|Draft[^:]*):\s*/, ''));
  const t = lower(text);
  for (let i = 0; i + 6 <= w.length; i += 1) {
    const span = w.slice(i, i + 6).join(' ');
    if (t.includes(lower(span))) return span;
  }
  return null;
}

const ACTION_BY_MOTION: Record<string, ReadonlyArray<string>> = { deal_work: ['email', 'call'], reengage: ['email', 'call'], research_first: ['research', 'email'], review_first: ['research'] };
const DISCONFIRMING_RE = /\b(or|whether|if|still|already|not|ever|which)\b/i;

export function scoreAngle(c: ReferenceCase, variant: 'full' | 'missing_source', angle: PreparedAngle): Array<{ check: QualityCheck; detail: string }> {
  const f: Array<{ check: QualityCheck; detail: string }> = [];
  const text = [angle.whyItMatters, ...angle.starters, angle.caveat ?? '', angle.sourceLine ?? ''].join(' ');
  const dealSourcePresent = c.sources.some((s) => /^hubspot:deal:/.test(s.sourceId) && !(variant === 'missing_source' && s.sourceId === c.missingSource.remove));
  // motion_and_person
  if (c.expected.motion === 'deal_work' && dealSourcePresent) {
    if (!angle.inDeal) f.push({ check: 'motion_and_person', detail: 'deal work expected, the angle is not deal work' });
    const scoped = c.id === 'two-deals' ? '62700000010' : c.sources.find((s) => /^hubspot:deal:/.test(s.sourceId))?.sourceId.replace(/^hubspot:deal:/, '') ?? null;
    if (scoped && variant === 'full' && angle.dealId !== scoped) f.push({ check: 'motion_and_person', detail: `scoped to deal ${angle.dealId ?? 'none'}, expected ${scoped}` });
  } else if (angle.inDeal && !dealSourcePresent) f.push({ check: 'motion_and_person', detail: 'deal work claimed with no deal on record' });
  // known_answer: an entry is required only while a remaining source can supply it (the missing-source variant removes one).
  const remaining = c.sources.filter((s) => !(variant === 'missing_source' && s.sourceId === c.missingSource.remove));
  const supplied = remaining.map((s) => lower(s.text)).join('\n');
  const derivable = (entry: string) => entry.split('|').some((alt) => alt.trim() && supplied.includes(lower(alt.trim()))) || /^open deal\b|deal work/i.test(entry) && remaining.some((s) => /^hubspot:deal:/.test(s.sourceId));
  for (const m of c.expected.mustSay) if (derivable(m) && !mentions(text, m)) f.push({ check: 'known_answer', detail: `does not say "${m}"` });
  // no_prohibited_claim: the prohibited list was written against the whole record; the missing-source variant is judged by missing_source_said instead.
  if (variant === 'full') for (const p of c.expected.prohibited) if (mentions(text, p.claim)) f.push({ check: 'no_prohibited_claim', detail: `says "${p.claim}": ${p.reason}` });
  // no_authority_leak
  for (const s of c.sources.filter((x) => x.claimClass === 'seller_noted' || x.claimClass === 'inference' || x.claimClass === 'internal_only' || x.claimClass === 'modeled')) {
    const span = leakedSpan(text, s);
    if (span) f.push({ check: 'no_authority_leak', detail: `${s.sourceId} (${s.claimClass}): "${span}"` });
  }
  // supported_claims (C57 pass 2, 6b: an all-inference answer never exercises the fact path; one cited fact is required where the record offers a buyer line or a checked fact)
  if (!angle.support || !angle.support.length) f.push({ check: 'supported_claims', detail: 'no support block on the angle' });
  else {
    for (const s of angle.support) if (s.kind === 'fact' && !s.refs.length) f.push({ check: 'supported_claims', detail: `a fact with no record label: "${s.text.slice(0, 60)}"` });
    const recordOffersFacts = remaining.some((s) => (s.claimClass === 'buyer_said' && s.externalOk) || (s.claimClass === 'checked_public' && s.externalOk));
    if (recordOffersFacts && !angle.support.some((s) => s.kind === 'fact' && s.refs.length)) f.push({ check: 'supported_claims', detail: 'the record offers buyer words or a checked fact, and no sentence cites one as a fact' });
  }
  // missing_source_said
  if (variant === 'missing_source') {
    const removed = c.sources.find((s) => s.sourceId === c.missingSource.remove);
    const kind = removed?.kind === 'crm' ? 'crm' : removed?.kind === 'vault' ? 'vault' : removed?.kind === 'clawd' ? 'clawd' : null;
    const noneLeft = kind ? !c.sources.some((s) => s.kind === removed!.kind && s.sourceId !== c.missingSource.remove) : false;
    if (kind && noneLeft) {
      const said = (angle.contextGaps ?? []).some((g) => g.toLowerCase().includes(kind)) || /not read|could not be read|unknown|unavailable/i.test(angle.caveat ?? '');
      if (!said) f.push({ check: 'missing_source_said', detail: `${kind} could not be read and neither the context gaps nor the caveat say so` });
    }
  }
  // specific_next_step
  const allowed = ACTION_BY_MOTION[c.expected.motion] ?? ['email', 'call', 'research'];
  if (!allowed.includes(angle.proposedAction)) f.push({ check: 'specific_next_step', detail: `action ${angle.proposedAction} for motion ${c.expected.motion}` });
  if (angle.starters.length < 2 || angle.starters.some((s) => !/\?\s*$/.test(s))) f.push({ check: 'specific_next_step', detail: 'the starters are not two open questions' });
  // disconfirming
  if (!angle.starters.some((s) => DISCONFIRMING_RE.test(s))) f.push({ check: 'disconfirming', detail: 'no starter admits a no' });
  // house_voice (the handler refuses these already; a kept warning is counted here)
  if (angle.warnings?.length) f.push({ check: 'house_voice', detail: angle.warnings.join('; ') });
  if (/—/.test(text) || /\bthroughput\b/i.test(text)) f.push({ check: 'house_voice', detail: 'em dash or throughput in the output' });
  return f;
}

/** The task a Pursue on the case would queue (what work/decide.ts carries), built from the case's sources. */
export function taskFor(c: ReferenceCase, variant: 'full' | 'missing_source', decision: Decision, now: Date): ClaimedTask {
  const removed = variant === 'missing_source' ? c.missingSource.remove : null;
  const sources = c.sources.filter((s) => s.sourceId !== removed);
  const inbound = sources.filter((s) => s.kind === 'gmail' && s.claimClass === 'buyer_said').sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''));
  const deals = sources.filter((s) => /^hubspot:deal:/.test(s.sourceId)).map((s) => {
    const m = /Deal "([^"]+)" at (\w+)(?:; next step: ([^;]+))?(?:; contacts: ([^.]+))?/.exec(s.text);
    const contacts = (m?.[4] ?? '').split(',').map((x) => x.trim());
    return { id: s.sourceId.replace(/^hubspot:deal:/, ''), name: m?.[1] ?? null, stage: m?.[2] ?? 'unknown', nextStep: m?.[3]?.trim() ?? null, onContact: !!c.person && contacts.includes(c.person.name) };
  });
  const scoped = deals.filter((d) => d.onContact).length ? deals.filter((d) => d.onContact) : deals;
  const pub = sources.find((s) => s.kind === 'public');
  const base = { title: c.title, decision, note: null, categories: [] as string[] };
  const input = c.person
    ? { ...base, email: c.person.email, name: c.person.name, title: c.person.title, accountName: c.expected.identity.ambiguous ? null : c.account?.name ?? null, accountHint: c.expected.identity.ambiguous ? c.account?.domains[0] ?? null : null, resolvedVia: c.expected.identity.via, ambiguous: c.expected.identity.ambiguous, lastWroteAt: inbound[0]?.at ?? null, messages: inbound.length, subject: null, inboundMessageId: inbound[0]?.sourceId ?? null, excerpt: inbound[0]?.text ?? null, deals: scoped.map((d) => ({ id: d.id, name: d.name, stage: d.stage, nextStep: d.nextStep })), dealCoverage: deals.length ? 'complete' : 'unavailable', opportunity: deals.length ? 'open' : 'unknown' }
    : { ...base, url: pub?.sourceId.replace(/^public:/, '') ?? null, source: pub ? new URL(pub.sourceId.replace(/^public:/, '')).hostname : null, publishedAt: pub?.at ?? null, accountName: c.account?.name ?? null, accountHint: null };
  const itemKey = c.person ? `person:${c.person.email}` : `signal:ref-${c.id}`;
  return { id: `at_${c.id}_${variant}_${decision}`, kind: 'develop_angle', itemKey, itemToken: '', day: now.toISOString().slice(0, 10), revision: 0, request: decision, requestedBy: 'casey@freightroll.com', requestedFrom: 'app', status: 'running', attempts: 1, attempt: 1, queuedAt: now.toISOString(), leaseUntil: new Date(now.getTime() + 60_000).toISOString(), fence: 'eval', input, result: null, lastError: null, final: false } as unknown as ClaimedTask;
}

export interface QualityRunOptions {
  now: Date;
  referenceVersion: number;
  /** The in-memory or scratch ledger the handler reads the roster and writes the spend ledger into. */
  prisma: PrismaLike;
  /** A scripted generator makes the run MOCKED; absent, the handler's metered model route answers (LIVE). */
  generate?: Generate;
  cases?: readonly ReferenceCase[];
}

export async function evaluateQuality(allCases: readonly ReferenceCase[], opts: QualityRunOptions): Promise<QualityReport> {
  const cases = (opts.cases ?? allCases).filter((c) => GENERATING_MOTIONS.has(c.expected.motion));
  const checks = Object.fromEntries(QUALITY_CHECKS.map((k) => [k, { checked: 0, failures: [] }])) as unknown as QualityReport['checks'];
  const outputs: QualityOutput[] = [];
  const models = new Set<string>();
  const promptHashes = new Set<string>();
  for (const c of cases) {
    for (const variant of ['full', 'missing_source'] as const) {
      const { report } = await runCase(c, variant, opts.now);
      for (const decision of DECISIONS) {
        let promptHash: string | null = null;
        const generate: Generate | undefined = opts.generate
          ? async (prompt, maxTokens) => { promptHash = createHash('sha256').update(prompt).digest('hex').slice(0, 12); const r = await opts.generate!(prompt, maxTokens); models.add(r.provider); return r; }
          : undefined;
        const task = taskFor(c, variant, decision, opts.now);
        let out: QualityOutput;
        try {
          const r = await developAngle(task, { prisma: opts.prisma, now: opts.now }, { packet: report.packet, ...(generate ? { generate } : {}) });
          if (r.ok) {
            const angle = r.result as unknown as PreparedAngle;
            const failures = scoreAngle(c, variant, angle);
            out = { caseId: c.id, variant, decision, ok: true, refusal: null, angle, packetRevision: report.packet.revision, promptHash, model: null, failures };
          } else out = { caseId: c.id, variant, decision, ok: false, refusal: `${r.reason}${r.detail ? `: ${r.detail}` : ''}`, angle: null, packetRevision: report.packet.revision, promptHash, model: null, failures: [{ check: 'produced', detail: `${r.reason}${r.detail ? `: ${r.detail}` : ''}` }] };
        } catch (e) {
          out = { caseId: c.id, variant, decision, ok: false, refusal: `threw: ${e instanceof Error ? e.message.slice(0, 160) : String(e)}`, angle: null, packetRevision: report.packet.revision, promptHash, model: null, failures: [{ check: 'produced', detail: `threw: ${e instanceof Error ? e.message.slice(0, 160) : String(e)}` }] };
        }
        if (promptHash) promptHashes.add(promptHash);
        outputs.push(out);
        for (const k of QUALITY_CHECKS) {
          if (k !== 'produced' && !out.ok) continue;
          checks[k].checked += 1;
          for (const fl of out.failures.filter((x) => x.check === k)) checks[k].failures.push({ caseId: c.id, variant, decision, detail: fl.detail });
        }
      }
    }
  }
  const cost = await spendOf(opts.prisma);
  for (const o of outputs) if (!o.model) o.model = opts.generate ? 'mocked' : cost.models[0] ?? null;
  return { generatedAt: opts.now.toISOString(), mode: opts.generate ? 'MOCKED' : 'LIVE', referenceVersion: opts.referenceVersion, sampleSize: { cases: cases.length, outputs: outputs.length, refused: outputs.filter((o) => !o.ok).length }, checks, outputs, cost: { usd: cost.usd, calls: cost.calls, failed: cost.failed, refused: cost.refused }, versions: { models: opts.generate ? [...models] : cost.models, promptHashes: promptHashes.size } };
}

async function spendOf(prisma: PrismaLike): Promise<{ usd: number; calls: number; failed: number; refused: number; models: string[] }> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return { usd: 0, calls: 0, failed: 0, refused: 0, models: [] };
  const rows: Array<{ kind: string; payload: Record<string, unknown> | null }> = await prisma.gapAuditEvent.findMany({ where: { subject_type: MODEL_CALL_SUBJECT, kind: MODEL_CALL } }).catch(() => []);
  const models = new Set<string>();
  let usd = 0, calls = 0, failed = 0, refused = 0;
  for (const r of rows) {
    const p = r.payload ?? {};
    usd += Number(p.costUsd) || 0;
    if (p.outcome === 'ok') calls += 1; else if (p.outcome === 'refused') refused += 1; else failed += 1;
    if (typeof p.model === 'string') models.add(p.model);
  }
  return { usd, calls, failed, refused, models: [...models] };
}

export function renderQualityEval(r: QualityReport): string {
  const L: string[] = [];
  L.push('# GAP OS generated-usefulness evaluation (C54)');
  L.push('');
  L.push(`STATUS: ${r.mode === 'LIVE' ? 'MEASUREMENT (live model route)' : 'HARNESS CHECK ONLY (MOCKED generator; this is NOT a live model evaluation and makes no quality claim)'}, generated ${r.generatedAt} by scripts/gap/quality-eval.ts over reference set v${r.referenceVersion}: ${r.sampleSize.cases} generating cases x 2 variants x ${DECISIONS.length} decisions = ${r.sampleSize.outputs} outputs, ${r.sampleSize.refused} refused. Models: ${r.versions.models.join(', ') || 'none'}; distinct prompts: ${r.versions.promptHashes}. Cost from the spend ledger: $${r.cost.usd.toFixed(4)} over ${r.cost.calls} calls (${r.cost.failed} failed, ${r.cost.refused} refused). Regenerate rather than edit.`);
  L.push(`<!-- verified:${r.generatedAt.slice(0, 10)} -->`);
  L.push('');
  L.push('## Per check (failures over outputs checked; never one aggregate score)');
  L.push('');
  L.push('| Check | Checked | Failures |');
  L.push('|---|---|---|');
  for (const k of QUALITY_CHECKS) L.push(`| ${k} | ${r.checks[k].checked} | ${r.checks[k].failures.length} |`);
  L.push('');
  const failing = QUALITY_CHECKS.filter((k) => r.checks[k].failures.length);
  if (failing.length) {
    L.push('## Failures');
    L.push('');
    for (const k of failing) for (const f of r.checks[k].failures) L.push(`- ${k} · ${f.caseId} (${f.variant}, ${f.decision}): ${f.detail}`);
    L.push('');
  }
  L.push('## Outputs');
  L.push('');
  for (const o of r.outputs) L.push(`- ${o.caseId} (${o.variant}, ${o.decision}): ${o.ok ? `angle, action ${o.angle!.proposedAction}${o.angle!.inDeal ? `, deal ${o.angle!.dealId ?? 'unscoped'}` : ''}, ${o.failures.length} failure(s)` : `refused: ${o.refusal}`}; packet ${o.packetRevision}; prompt ${o.promptHash ?? 'n/a'}`);
  L.push('');
  L.push('Seller review of usefulness is Casey\'s and is recorded apart from this file.');
  L.push('');
  return L.join('\n');
}
