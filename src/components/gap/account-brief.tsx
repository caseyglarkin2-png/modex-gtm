/**
 * ACCOUNT INTELLIGENCE view: the 30-second glance first, then the deep view with
 * progressive disclosure (one <details> per section). Every statement shows its
 * truth class and its sources; a model shows inputs, formula, range and
 * assumptions. Section status is a chip, never a score. Server-renderable.
 */
import type { AccountIntelligenceBrief, Section } from '@/lib/gap/account-intel/build';
import type { SectionStatus, Statement, TruthClass } from '@/lib/gap/account-intel/truth';

const TRUTH_LABEL: Record<TruthClass, string> = {
  BUYER_CONFIRMED: 'Buyer confirmed',
  VERIFIED_PUBLIC: 'Verified',
  MODELED_ESTIMATE: 'Modeled',
  INFERENCE: 'Inference',
  UNKNOWN: 'Unknown',
  CONTRADICTED: 'Contradicted',
};
const TRUTH_TONE: Record<TruthClass, string> = {
  BUYER_CONFIRMED: 'border-emerald-600 text-emerald-700 dark:text-emerald-400',
  VERIFIED_PUBLIC: 'border-sky-600 text-sky-700 dark:text-sky-400',
  MODELED_ESTIMATE: 'border-amber-600 text-amber-700 dark:text-amber-400',
  INFERENCE: 'border-[var(--border)] text-[var(--muted-foreground)]',
  UNKNOWN: 'border-[var(--border)] text-[var(--muted-foreground)]',
  CONTRADICTED: 'border-red-600 text-red-700 dark:text-red-400',
};
const STATUS_TONE: Record<SectionStatus, string> = {
  KNOWN: 'border-emerald-600 text-emerald-700 dark:text-emerald-400',
  PARTIAL: 'border-sky-600 text-sky-700 dark:text-sky-400',
  MODELED: 'border-amber-600 text-amber-700 dark:text-amber-400',
  UNKNOWN: 'border-[var(--border)] text-[var(--muted-foreground)]',
  STALE: 'border-orange-600 text-orange-700 dark:text-orange-400',
  CONTRADICTED: 'border-red-600 text-red-700 dark:text-red-400',
};

/** Only http(s) sources become links; anything else renders as text. */
const safeUrl = (u: string | null) => {
  if (!u) return null;
  try {
    const p = new URL(u).protocol;
    return p === 'http:' || p === 'https:' ? u : null;
  } catch {
    return null;
  }
};
/** A glance line never shows a raw URL (the deep view links the source). */
const glanceText = (s: string) => s.replace(/\s*https?:\/\/[^\s)]+/g, '').replace(/\s+([).,;])/g, '$1').trim();
const clip = (s: string, n = 220) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const money = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}K` : `$${Math.round(n)}`);

function Chip({ text, tone, testId }: { text: string; tone: string; testId?: string }) {
  return (
    <span data-testid={testId} className={`inline-block whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>
      {text}
    </span>
  );
}

function StatementRow({ s }: { s: Statement }) {
  const m = s.model;
  const fmt = (v: number) => (m?.unit === 'USD per year' ? money(v) : v.toLocaleString('en-US'));
  return (
    <li className="space-y-1 border-b border-[var(--border)] py-2 last:border-0" data-testid="brief-statement" data-truth={s.truth}>
      <div className="flex items-start gap-2">
        <Chip text={TRUTH_LABEL[s.truth]} tone={TRUTH_TONE[s.truth]} />
        <p className="min-w-0 break-words text-sm">{s.text}</p>
      </div>
      {m ? (
        <div className="ml-1 space-y-0.5 text-xs text-[var(--muted-foreground)]" data-testid="brief-model">
          <p>
            Range: {fmt(m.range[0])} to {fmt(m.range[1])} {m.unit === 'USD per year' ? 'a year' : m.unit}
          </p>
          <p>Formula: {m.formula}</p>
          <p>Inputs: {Object.entries(m.inputs).map(([k, v]) => `${k} ${v}`).join(', ')}</p>
          <p>Assumptions: {m.assumptions.join('; ')}</p>
        </div>
      ) : null}
      {s.falsifiableBy ? <p className="ml-1 text-xs text-[var(--muted-foreground)]">Wrong if: {s.falsifiableBy}</p> : null}
      {s.contradictedBy?.length ? <p className="ml-1 text-xs text-red-700 dark:text-red-400">Contradicted by: {s.contradictedBy.map((c) => c.label).join(', ')}</p> : null}
      {s.sources.length ? (
        <p className="ml-1 break-words text-xs text-[var(--muted-foreground)]">
          Source:{' '}
          {s.sources.map((src, i) => (
            <span key={`${src.kind}-${src.ref ?? i}`}>
              {i ? ', ' : ''}
              {safeUrl(src.url) ? (
                <a href={safeUrl(src.url)!} target="_blank" rel="noreferrer" className="underline">
                  {src.label}
                </a>
              ) : (
                src.label
              )}
              {src.at ? ` (${src.at.slice(0, 10)})` : ''}
            </span>
          ))}
        </p>
      ) : null}
    </li>
  );
}

function SectionBlock({ s }: { s: Section }) {
  return (
    <details className="rounded-md border border-[var(--border)] px-3 py-2" data-testid={`brief-section-${s.key}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
        <span className="text-sm font-semibold">{s.title}</span>
        <Chip text={s.status} tone={STATUS_TONE[s.status]} testId={`brief-status-${s.key}`} />
      </summary>
      <ul className="mt-2">
        {s.statements.map((st, i) => (
          <StatementRow key={`${s.key}-${i}`} s={st} />
        ))}
      </ul>
      {s.unknowns.length ? (
        <div className="mt-2 text-xs">
          <p className="font-semibold">Unknown</p>
          <ul className="list-disc pl-4 text-[var(--muted-foreground)]">
            {s.unknowns.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {s.refused.length ? (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400" data-testid={`brief-refused-${s.key}`}>
          {s.refused.length} {s.refused.length === 1 ? 'statement was' : 'statements were'} withheld because they did not carry what their truth class needs: {s.refused.map((r) => r.split(':')[0].replace(/_/g, ' ')).join(', ')}.
        </p>
      ) : null}
      <p className="mt-2 text-[10px] text-[var(--muted-foreground)]">Goes stale after {s.freshnessDays} days without a newer source.</p>
    </details>
  );
}

const GLANCE_ROWS: Array<[keyof AccountIntelligenceBrief['glance'], string]> = [
  ['motion', 'Motion'],
  ['icpState', 'ICP / state'],
  ['whyNow', 'Why now'],
  ['network', 'Network'],
  ['freight', 'Freight'],
  ['bestFact', 'Best verified fact'],
  ['topHypothesis', 'Top hypothesis'],
  ['currentTech', 'Current tech'],
  ['likelyOwner', 'Who probably owns it'],
  ['relationship', 'Relationship'],
  ['commercialState', 'Commercial state'],
  ['biggestUnknown', 'Biggest unknown'],
  ['nextQuestion', 'Next question'],
];

export function AccountBriefView({ brief, afterGlance }: { brief: AccountIntelligenceBrief; afterGlance?: React.ReactNode }) {
  const g = brief.glance;
  const t = brief.thesis;
  return (
    <div className="space-y-5" data-testid="account-brief">
      <section className="space-y-3" data-testid="brief-glance">
        <div className="rounded-md border border-[var(--primary)] px-3 py-2" data-testid="brief-next-action">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">Next action</p>
          <p className="text-sm font-medium">{g.nextAction}</p>
        </div>
        <dl className="grid grid-cols-1 gap-x-3 gap-y-1.5 text-sm sm:grid-cols-[10rem_1fr]">
          {GLANCE_ROWS.map(([k, label]) => (
            <div key={k} className="contents" data-testid={`glance-${k}`}>
              <dt className="text-xs font-semibold text-[var(--muted-foreground)] sm:pt-0.5">{label}</dt>
              <dd className="min-w-0 break-words">{clip(glanceText(g[k] ?? 'None yet'))}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-1.5" data-testid="brief-status-strip">
          {Object.values(brief.sections).map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1 text-[10px]">
              <span className="text-[var(--muted-foreground)]">{s.title.split(' ')[0]}</span>
              <Chip text={s.status} tone={STATUS_TONE[s.status]} />
            </span>
          ))}
        </div>
      </section>

      {afterGlance}

      <section className="space-y-2" data-testid="brief-thesis">
        <h2 className="text-sm font-semibold">Account thesis</h2>
        <p className="text-xs text-[var(--muted-foreground)]">{t.status}</p>
        <dl className="space-y-1 text-sm">
          <div><dt className="inline font-semibold">Why this account: </dt><dd className="inline break-words">{clip(t.whyThisAccount, 400)}</dd></div>
          <div><dt className="inline font-semibold">Why now: </dt><dd className="inline break-words">{clip(t.whyNow, 400)}</dd></div>
          <div><dt className="inline font-semibold">What may be broken: </dt><dd className="inline">{t.whatMayBeBroken}</dd></div>
          <div><dt className="inline font-semibold">Why it may matter: </dt><dd className="inline">{t.whyItMayMatter}</dd></div>
          <div><dt className="inline font-semibold">Where YardFlow may fit: </dt><dd className="inline">{t.whereYardFlowMayFit}</dd></div>
          <div><dt className="inline font-semibold">What would make us wrong: </dt><dd className="inline">{t.wrongIf ?? 'Not stated yet.'}</dd></div>
        </dl>
        {t.whyNotPursue.length ? (
          <div className="text-sm" data-testid="brief-why-not">
            <p className="font-semibold">Why we should not pursue</p>
            <ul className="list-disc pl-5">
              {t.whyNotPursue.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="space-y-2" data-testid="brief-hypotheses">
        <h2 className="text-sm font-semibold">Hypotheses</h2>
        {brief.hypotheses.length ? (
          <ul className="space-y-2">
            {brief.hypotheses.map((h) => (
              <li key={h.id} className="rounded-md border border-[var(--border)] px-3 py-2 text-sm" data-testid="brief-hypothesis" data-grounded={h.grounded}>
                <div className="flex items-start gap-2">
                  <Chip text={TRUTH_LABEL[h.truth]} tone={TRUTH_TONE[h.truth]} />
                  <p className="min-w-0 break-words">{h.problem}</p>
                </div>
                <p className="mt-1 break-words text-xs text-[var(--muted-foreground)]">
                  Observation{h.observation.verified ? ' (verified)' : ' (not a live verified fact: this draft cannot lead)'}: {clip(h.observation.text)}
                </p>
                {h.wrongIf ? <p className="text-xs text-[var(--muted-foreground)]">Wrong if: {h.wrongIf}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">No strong hypothesis yet.</p>
        )}
      </section>

      <section className="space-y-2" data-testid="brief-discovery">
        <h2 className="text-sm font-semibold">Discovery plan</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {brief.discovery.map((q) => (
            <li key={q.type}>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{q.type.replace(/_/g, ' ')}</span>
              <p>{q.question}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{q.why}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-2" data-testid="brief-wedge">
        <h2 className="text-sm font-semibold">Site and wedge strategy</h2>
        <p className="text-sm">{brief.wedge.archetype ?? 'Archetype unknown'}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{brief.wedge.note}</p>
        {brief.wedge.candidates.map((c) => (
          <details key={c.siteId} className="rounded-md border border-[var(--border)] px-3 py-2 text-sm" data-testid="brief-wedge-site">
            <summary className="cursor-pointer font-medium">{c.name}</summary>
            <dl className="mt-1 space-y-1 text-xs">
              <div><dt className="inline font-semibold">Why this site: </dt><dd className="inline">{c.whyThisSite.join(', ') || 'Not stated'}</dd></div>
              <div><dt className="inline font-semibold">What we know: </dt><dd className="inline">{c.whatWeKnow.join('; ')}</dd></div>
              <div><dt className="inline font-semibold">What we model: </dt><dd className="inline">{c.whatWeModel.join('; ') || 'Nothing modeled'}</dd></div>
              <div><dt className="inline font-semibold">Why a pilot: </dt><dd className="inline">{c.whyPilot}</dd></div>
              <div><dt className="inline font-semibold">Must verify: </dt><dd className="inline">{c.mustVerify.join('; ')}</dd></div>
            </dl>
          </details>
        ))}
        {brief.wedge.expansion.length ? <p className="text-xs text-[var(--muted-foreground)]">{brief.wedge.expansion.join(' → ')}</p> : null}
      </section>

      <section className="space-y-2" data-testid="brief-sections">
        <h2 className="text-sm font-semibold">Everything GAP knows, by section</h2>
        {Object.values(brief.sections).map((s) => (
          <SectionBlock key={s.key} s={s} />
        ))}
      </section>
    </div>
  );
}
