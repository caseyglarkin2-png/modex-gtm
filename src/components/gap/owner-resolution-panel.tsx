'use client';

/**
 * OWNER RESOLUTION (seller dogfood correction, 2026-10-05). An approved account-level hypothesis has no person to
 * test it with: instead of "Refused: no_persona", the seller sees the best people on record, ranked by the one
 * owner-resolution read (GET /api/gap/hypotheses/[id]/owner), each with its reasons, chooses one, and presses USE.
 * The click is one governed action (POST): import if HubSpot-only, check, assign, activate, targeted shadow route,
 * each step reported. Several plausible owners: a choice, nobody preselected. Nobody: FIND OPERATOR (source-backed
 * research staged for review). Nothing here drafts, sends or enrolls. Voice: no em dashes.
 */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { AliasProposal } from '@/lib/gap/people/alias-review';
import type { OwnerCandidate, OwnerResolution } from '@/lib/gap/people/owner-resolution';
import type { UseOwnerResult } from '@/lib/gap/people/owner-action';
import { refusalCopy, refusalSentence } from '@/lib/gap/ui/refusal-copy';
import { AliasProposalControl } from './alias-proposal-control';
import { EmploymentControl } from './employment-control';
import { LegacySuppressionReview } from './legacy-suppression-review';
import { UseOutcome, type UseOutcomeResponse } from './use-outcome';

export interface OwnerResolutionPanelProps {
  hypothesisId: string;
  accountName: string;
  /** The hypothesis moved (activated) or its person changed: the owner refetches. */
  onChanged?: (result: { to: string | null }) => void;
}

type Load = { state: 'loading' } | { state: 'error'; text: string } | { state: 'ready'; resolution: OwnerResolution; aliasProposals: AliasProposal[] };

/** Only the top candidates whose role nobody has verified offer VERIFY CURRENT ROLE: never on render, one click, one bounded check. */
const VERIFY_TOP = 3;
/** UX-03: the default rows before "Show N more" (the People Stack's default plus one, the analyst path). */
const PANEL_DEFAULT_ROWS = 5;

const STEP_LABEL: Record<string, string> = { import: 'Add to GAP', check: 'Check', assign: 'Attach', activate: 'Use in routing', route: 'Route' };

function stepText(s: UseOwnerResult['steps'][number]): string {
  if (s.ok) return s.status === 'skipped' ? 'skipped' : s.detail ? s.detail : s.status ?? 'done';
  const code = String(s.reason ?? '');
  // Every step reason has seller copy (review S7); a suffixed code reads through its prefix and the exclusion's own
  // sentence stands in as the why. The fallback never shows a token: it shows the detail sentence or a plain line.
  return refusalSentence(code, s.detail) ?? (s.detail ? s.detail : 'This step did not complete. Reload and try again.');
}

export function OwnerResolutionPanel({ hypothesisId, accountName, onChanged }: OwnerResolutionPanelProps) {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [chosen, setChosen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<UseOwnerResult | null>(null);
  const [research, setResearch] = useState<string | null>(null);
  const [showExcluded, setShowExcluded] = useState(false);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [glossary, setGlossary] = useState(false);
  // UX-03 (account-first): the top few by default, the rest one labelled, counted step away; never a wall of 53.
  const [showAllEligible, setShowAllEligible] = useState(false);
  const toggleOpen = (key: string) => setOpen((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });

  async function fetchResolution() {
    setLoad({ state: 'loading' });
    try {
      const res = await fetch(`/api/gap/hypotheses/${encodeURIComponent(hypothesisId)}/owner`, { cache: 'no-store' });
      const body = (await res.json().catch(() => ({}))) as { resolution?: OwnerResolution; aliasProposals?: AliasProposal[]; error?: string };
      if (!res.ok || !body.resolution) {
        setLoad({ state: 'error', text: `Could not read the people on record (${body.error ?? res.status}).` });
        return;
      }
      setLoad({ state: 'ready', resolution: body.resolution, aliasProposals: body.aliasProposals ?? [] });
      setChosen(body.resolution.preselected);
    } catch (e) {
      setLoad({ state: 'error', text: e instanceof Error ? e.message : 'network error' });
    }
  }
  useEffect(() => {
    void fetchResolution();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hypothesisId]);

  async function act(c: OwnerCandidate, activate: boolean) {
    setBusy(`${c.key}:${activate ? 'use' : 'attach'}`);
    setResult(null);
    try {
      const body = c.personaId !== null ? { personaId: c.personaId, activate } : { hubspotContactId: c.hubspotContactId, activate };
      const res = await fetch(`/api/gap/hypotheses/${encodeURIComponent(hypothesisId)}/owner`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const r = (await res.json().catch(() => null)) as UseOwnerResult | null;
      if (!r) {
        setResult({ ok: false, hypothesisId, hypothesisStatus: null, personaId: null, personaName: c.name, steps: [{ step: 'check', ok: false, reason: `HTTP ${res.status}` }], routing: null });
        return;
      }
      setResult(r);
      if (r.steps.some((s) => (s.step === 'assign' || s.step === 'activate') && s.ok && s.status !== 'skipped')) onChanged?.({ to: r.hypothesisStatus });
      if (r.steps.some((s) => s.step === 'import' && s.ok)) void fetchResolution();
    } catch (e) {
      setResult({ ok: false, hypothesisId, hypothesisStatus: null, personaId: null, personaName: c.name, steps: [{ step: 'check', ok: false, reason: 'network_error', detail: e instanceof Error ? e.message : String(e) }], routing: null });
    } finally {
      setBusy(null);
    }
  }

  async function findOperator() {
    setBusy('research');
    setResearch(null);
    try {
      const res = await fetch('/api/gap/people/find-operator', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accountName }) });
      const b = (await res.json().catch(() => ({}))) as { note?: string; staged?: Array<{ name: string; title: string | null }>; error?: string };
      setResearch(res.ok ? `${b.note ?? 'Done.'}${b.staged?.length ? ` Staged: ${b.staged.map((s) => `${s.name}${s.title ? ` (${s.title})` : ''}`).join(', ')}.` : ''}` : `Research did not run (${b.error ?? res.status}).`);
    } catch (e) {
      setResearch(e instanceof Error ? e.message : 'network error');
    } finally {
      setBusy(null);
    }
  }

  if (load.state === 'loading') return <section data-testid="owner-resolution" className="mt-4 rounded-md border border-[var(--border)] p-3 text-sm text-[var(--muted-foreground)]">Reading the people on record...</section>;
  if (load.state === 'error') return <section data-testid="owner-resolution" role="alert" className="mt-4 rounded-md border border-[var(--destructive)] p-3 text-sm">{load.text}</section>;
  const r = load.resolution;
  const selected = r.eligible.find((c) => c.key === chosen) ?? null;
  const actionLabel = (c: OwnerCandidate) => (c.action === 'add_then_use' ? `Add ${c.name} to GAP + use in routing` : `Use ${c.name} in routing`);
  const routing: UseOutcomeResponse | null = result?.routing ? (result.routing as unknown as UseOutcomeResponse) : null;
  const purposeWord = r.purpose === 'HYPOTHESIS_ACTIVATION' ? 'this hypothesis' : r.purpose === 'SITE_PILOT' ? 'a site pilot' : r.purpose === 'TRANSFORMATION_INITIATIVE' ? 'this initiative' : 'the first touch';
  // The one-line summary a rep reads first: the recommendation's reason, else the lane sentence; the thesis fit beside it.
  const summaryOf = (c: OwnerCandidate) => c.reasons.filter((why) => /^(Primary operator|Adjacent operator|Facility \/ yard operator|Executive sponsor|Transformation \/ technology|Thesis fit)/.test(why));
  const detailsOf = (c: OwnerCandidate) => c.reasons.filter((why) => !summaryOf(c).includes(why));
  const groups = groupExcluded(r.excluded);
  // The default rows (the chosen person always among them) and the tie rule from the resolver's own rank keys.
  const chosenRow = chosen ? r.eligible.find((c) => c.key === chosen) ?? null : null;
  const head = r.eligible.slice(0, PANEL_DEFAULT_ROWS);
  const shown = showAllEligible ? r.eligible : chosenRow && !head.some((c) => c.key === chosenRow.key) ? [...head, chosenRow] : head;
  const sameRank = (a?: number[], b?: number[]) => !!a && !!b && a.length === b.length && a.every((v, k) => v === b[k]);
  const tie = shown.some((c, i, a) => i > 0 && sameRank(a[i - 1].rank, c.rank));

  return (
    <section data-testid="owner-resolution" data-next-step={r.nextStep} className="mt-4 space-y-3 rounded-md border border-[var(--primary)] p-3 text-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">Who should test {purposeWord}?</p>
        <p className="mt-1" data-testid="owner-resolution-headline">{r.headline}</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          GAP ranks the people on record and says why. You choose; nothing starts until you click, and no email is sent by choosing.
          {r.hypothesis ? ` The fact is ${r.hypothesis.factLabel}; people are ranked for it (${r.account.kind === 'carrier_3pl' ? 'a carrier / 3PL: network, hub, terminal, linehaul, planning and engineering owners' : 'a shipper: transportation, logistics, freight and fleet owners'}).` : ''}
        </p>
        <button type="button" className="mt-1 text-[11px] underline text-[var(--muted-foreground)]" onClick={() => setGlossary((v) => !v)} data-testid="owner-glossary-toggle">
          {glossary ? 'Hide what these terms mean' : 'What these terms mean'}
        </button>
        {glossary ? (
          <dl className="mt-1 grid grid-cols-1 gap-x-4 gap-y-0.5 text-[11px] text-[var(--muted-foreground)] sm:grid-cols-2" data-testid="owner-glossary">
            {GLOSSARY.map(([term, meaning]) => (
              <div key={term}>
                <dt className="inline font-medium text-[var(--foreground)]">{term}: </dt>
                <dd className="inline">{meaning}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      {r.eligible.length ? (
        <fieldset className="space-y-2" data-testid="owner-candidates">
          <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {shown.length < r.eligible.length ? `Best people on record (top ${shown.length} of ${r.eligible.length})` : `Best people on record (${r.eligible.length})`}
          </legend>
          {tie ? (
            <p className="text-xs text-[var(--muted-foreground)]" data-testid="owner-tie">
              GAP could not separate these people on evidence (the same responsibility, market and reachability); the order is name order. Choose on what you know.
            </p>
          ) : null}
          {shown.map((c, i) => (
            <label key={c.key} className={`block cursor-pointer rounded-md border p-2 ${chosen === c.key ? 'border-[var(--primary)] bg-[var(--muted)]/40' : 'border-[var(--border)]'}`} data-testid="owner-candidate" data-key={c.key}>
              <div className="flex items-start gap-2">
                <input type="radio" name={`owner-${hypothesisId}`} value={c.key} checked={chosen === c.key} onChange={() => setChosen(c.key)} className="mt-1 h-6 w-6" aria-label={`Choose ${c.name}${c.title ? `, ${c.title}` : ''}`} aria-describedby={`owner-why-${c.key}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {tie ? '' : `${i + 1}. `}{c.name}
                    {c.title ? <span className="font-normal text-[var(--muted-foreground)]">, {c.title}</span> : null}
                    {c.action === 'add_then_use' ? <span className="ml-2 rounded-sm border border-[var(--border)] px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">HubSpot only</span> : null}
                    {r.recommended?.key === c.key ? (
                      <span className="ml-2 rounded-sm border border-[var(--primary)] px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]" data-testid="owner-recommended">
                        Recommended for {r.purpose === 'HYPOTHESIS_ACTIVATION' ? 'this hypothesis' : r.purpose === 'SITE_PILOT' ? 'a site pilot' : 'this initiative'}
                      </span>
                    ) : null}
                  </p>
                  {r.recommended?.key === c.key ? (
                    <p className="mt-0.5 text-xs" data-testid="owner-recommended-why">
                      {r.recommended.why}
                    </p>
                  ) : null}
                  <ul id={`owner-why-${c.key}`} className="mt-0.5 space-y-0.5 text-xs text-[var(--muted-foreground)]">
                    {summaryOf(c).map((why) => (
                      <li key={why}>{why}</li>
                    ))}
                  </ul>
                  {c.caution ? <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{c.caution}</p> : null}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <button type="button" className="text-[11px] underline text-[var(--muted-foreground)]" onClick={(e) => { e.preventDefault(); toggleOpen(c.key); }} data-testid="owner-candidate-details">
                      {open.has(c.key) ? 'Hide details' : `Details${c.location ? ` (${c.location})` : ''}`}
                    </button>
                  </div>
                  {open.has(c.key) ? (
                    <ul className="mt-1 space-y-0.5 text-xs text-[var(--muted-foreground)]" data-testid="owner-candidate-detail-list">
                      {c.location ? <li>{c.location}</li> : null}
                      {detailsOf(c).map((why) => (
                        <li key={why}>{why}</li>
                      ))}
                    </ul>
                  ) : null}
                  {i < VERIFY_TOP && (!c.role || c.role.state === 'ROLE_UNVERIFIED') ? (
                    c.personaId !== null ? (
                      <EmploymentControl personaId={c.personaId} name={c.name} title={c.title} accountName={accountName} compact onDone={() => void fetchResolution()} />
                    ) : c.hubspotContactId ? (
                      <EmploymentControl hubspotContactId={c.hubspotContactId} name={c.name} title={c.title} accountName={accountName} compact onDone={() => void fetchResolution()} />
                    ) : null
                  ) : null}
                </div>
              </div>
            </label>
          ))}
          {r.eligible.length > shown.length || showAllEligible ? (
            <button type="button" className="inline-flex min-h-9 items-center text-xs underline" aria-expanded={showAllEligible} onClick={() => setShowAllEligible((v) => !v)} data-testid="owner-show-all">
              {showAllEligible ? 'Show fewer' : `Show ${r.eligible.length - shown.length} more on record (ranked lower on evidence)`}
            </button>
          ) : null}
        </fieldset>
      ) : (
        <div className="rounded-md border border-dashed border-[var(--border)] p-2" data-testid="owner-not-resolved">
          <p className="font-medium">Owner not resolved.</p>
          <p className="text-xs text-[var(--muted-foreground)]">{r.research.why}</p>
          <p className="text-xs text-[var(--muted-foreground)]">Looks for: {r.research.slots.join('; ')}.</p>
        </div>
      )}

      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {selected ? (
            <>
              <Button type="button" disabled={busy !== null} onClick={() => void act(selected, true)} data-testid="owner-use">
                {busy === `${selected.key}:use` ? 'Working...' : actionLabel(selected)}
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={busy !== null} onClick={() => void act(selected, false)} data-testid="owner-attach">
                {busy === `${selected.key}:attach` ? 'Working...' : selected.action === 'add_then_use' ? 'Add + attach only' : 'Attach only'}
              </Button>
            </>
          ) : r.eligible.length ? (
            <p className="text-xs text-[var(--muted-foreground)]">{r.recommended ? 'Choose one person above. The recommendation is a reason, not a selection: GAP does not pick.' : 'Choose one person above. GAP does not pick.'}</p>
          ) : null}
          <Button type="button" variant={r.eligible.length ? 'ghost' : 'default'} size="sm" disabled={busy !== null} onClick={() => void findOperator()} data-testid="owner-find">
            {busy === 'research' ? 'Researching...' : 'Find operator'}
          </Button>
        </div>
        {selected ? (
          <p className="text-[11px] text-[var(--muted-foreground)]" data-testid="owner-action-help">
            {selected.action === 'add_then_use' ? 'Adds them to GAP, attaches them to this hypothesis and starts routing (shadow). ' : 'Attaches them to this hypothesis and starts routing (shadow). '}
            No email is sent by this click; every send still runs its own gates. Attach only keeps the hypothesis approved for later.
          </p>
        ) : null}
      </div>
      {research ? <p className="text-xs" role="status" data-testid="owner-research-note">{research}</p> : null}

      {result ? (
        <div className="space-y-1 rounded-md border border-[var(--border)] p-2 text-xs" data-testid="owner-result" data-ok={result.ok ? 'true' : 'false'}>
          <ol className="space-y-0.5">
            {result.steps.map((s) => (
              <li key={s.step} data-step={s.step} data-ok={s.ok ? 'true' : 'false'}>
                <span className="font-medium">{STEP_LABEL[s.step] ?? s.step}:</span> {stepText(s)}
              </li>
            ))}
          </ol>
          {routing ? <UseOutcome approved={1} inUse={result.hypothesisStatus === 'active' ? 1 : 0} routing={routing} /> : null}
          {!result.ok && result.steps.some((s) => !s.ok && s.step === 'activate') ? <p>{refusalCopy(String(result.steps.find((s) => !s.ok)?.reason ?? ''))?.next ?? 'The person is attached; the hypothesis stays approved.'}</p> : null}
        </div>
      ) : null}

      {r.sponsor || r.tech || r.site ? (
        <p className="text-xs text-[var(--muted-foreground)]" data-testid="owner-slots">
          Also on record:{r.sponsor ? ` sponsor ${r.sponsor.name}${r.sponsor.title ? ` (${r.sponsor.title})` : ''}.` : ''}
          {r.tech ? ` technology ${r.tech.name}${r.tech.title ? ` (${r.tech.title})` : ''}.` : ''}
          {r.site ? ` site operator ${r.site.name}${r.site.title ? ` (${r.site.title})` : ''}.` : ''}
        </p>
      ) : null}
      {r.excluded.length ? (
        <div className="text-xs">
          <button type="button" className="underline" onClick={() => setShowExcluded((v) => !v)} data-testid="owner-excluded-toggle">
            {showExcluded ? 'Hide' : 'Show'} {r.excluded.length} set aside ({groups.map((g) => `${g.label.toLowerCase()} ${g.items.length}`).join(', ')})
          </button>
          {showExcluded ? (
            <div className="mt-1 space-y-2" data-testid="owner-excluded">
              {groups.map((g) => (
                <div key={g.code} data-group={g.code}>
                  <p className="font-semibold text-[var(--muted-foreground)]">{g.label} ({g.items.length})</p>
                  <ul className="mt-0.5 space-y-1">
                    {g.items.map((e) => (
                      <li key={e.candidate.key} data-code={e.code}>
                        <span className="font-medium">{e.candidate.name}</span>
                        {e.candidate.title ? <span className="text-[var(--muted-foreground)]">, {e.candidate.title}</span> : null}: {e.reason}
                        {e.code === 'do_not_contact' && e.candidate.personaId !== null ? (
                          <>
                            {' '}
                            <button type="button" className="underline" onClick={() => setReviewing((v) => (v === e.candidate.personaId ? null : e.candidate.personaId))} data-testid="owner-review-suppression" data-persona={e.candidate.personaId}>
                              {reviewing === e.candidate.personaId ? 'Hide the review' : 'Review the legacy flag'}
                            </button>
                            {reviewing === e.candidate.personaId ? <LegacySuppressionReview personaId={e.candidate.personaId} name={e.candidate.name} accountName={accountName} onCleared={() => void fetchResolution()} /> : null}
                          </>
                        ) : null}
                        {e.code === 'role_changed' || e.code === 'role_conflict' ? (
                          e.candidate.personaId !== null ? (
                            <EmploymentControl personaId={e.candidate.personaId} name={e.candidate.name} title={e.candidate.title} accountName={accountName} compact onDone={() => void fetchResolution()} />
                          ) : e.candidate.hubspotContactId ? (
                            <EmploymentControl hubspotContactId={e.candidate.hubspotContactId} name={e.candidate.name} title={e.candidate.title} accountName={accountName} compact onDone={() => void fetchResolution()} />
                          ) : null
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {load.aliasProposals.length ? (
        <div className="space-y-1 text-xs" data-testid="owner-alias-proposals">
          <p className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Possible account aliases (confirm or reject; nothing changes until you do)</p>
          {load.aliasProposals.map((p) => (
            <AliasProposalControl key={p.key} proposal={p} onDecided={() => void fetchResolution()} />
          ))}
        </div>
      ) : null}
      <p className="text-[11px] text-[var(--muted-foreground)]">Checked first: {r.checked.join(' · ')}. {r.apollo.note}</p>
    </section>
  );
}

/** The set-aside reasons in the order a rep asks about them, each with a plain label. */
const EXCLUSION_LABEL: Array<[string, string]> = [
  ['do_not_contact', 'Do not contact'],
  ['unsubscribed', 'Unsubscribed'],
  ['opted_out', 'Opted out in HubSpot'],
  ['left_company', 'Left the company'],
  ['employment_conflict', 'Employer in question'],
  ['role_changed', 'Role changed'],
  ['role_conflict', 'Role in question'],
  ['divested_entity', 'Divested unit'],
  ['other_region', 'Another region'],
  ['no_name', 'No name on record'],
];

function groupExcluded(excluded: OwnerResolution['excluded']): Array<{ code: string; label: string; items: OwnerResolution['excluded'] }> {
  const out: Array<{ code: string; label: string; items: OwnerResolution['excluded'] }> = [];
  for (const [code, label] of EXCLUSION_LABEL) {
    const items = excluded.filter((e) => e.code === code);
    if (items.length) out.push({ code, label, items });
  }
  const known = new Set(EXCLUSION_LABEL.map(([c]) => c));
  const rest = excluded.filter((e) => !known.has(e.code));
  if (rest.length) out.push({ code: 'other', label: 'Other', items: rest });
  return out;
}

/** Plain words for a rep who is new to GAP's vocabulary. */
const GLOSSARY: Array<[string, string]> = [
  ['Primary operator', 'runs transportation, freight or the fleet (at a carrier: the physical network). The person we sell to first.'],
  ['Adjacent operator', 'runs supply chain, distribution or warehousing; transportation ownership not stated. A sponsor or alternate.'],
  ['Thesis fit', 'whether the fact behind this hypothesis lands on what this person runs (direct, related, or not).'],
  ['Employment', 'whether current evidence says they still work here. The CRM alone is "not verified".'],
  ['Role', 'whether the title GAP ranks on is still theirs. A changed or disputed role is set aside until verified.'],
  ['Recommended', 'the first strong difference between the top two people, in words. A reason, never a selection.'],
  ['HubSpot only', 'in HubSpot but not yet a GAP contact; choosing them adds them to GAP first.'],
  ['Set aside', 'people considered and excluded, each with the exact reason. Nobody is dropped silently.'],
];
