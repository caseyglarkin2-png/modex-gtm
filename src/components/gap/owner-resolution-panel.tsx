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
import type { OwnerCandidate, OwnerResolution } from '@/lib/gap/people/owner-resolution';
import type { UseOwnerResult } from '@/lib/gap/people/owner-action';
import { refusalCopy, refusalSentence } from '@/lib/gap/ui/refusal-copy';
import { UseOutcome, type UseOutcomeResponse } from './use-outcome';

export interface OwnerResolutionPanelProps {
  hypothesisId: string;
  accountName: string;
  /** The hypothesis moved (activated) or its person changed: the owner refetches. */
  onChanged?: (result: { to: string | null }) => void;
}

type Load = { state: 'loading' } | { state: 'error'; text: string } | { state: 'ready'; resolution: OwnerResolution };

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

  async function fetchResolution() {
    setLoad({ state: 'loading' });
    try {
      const res = await fetch(`/api/gap/hypotheses/${encodeURIComponent(hypothesisId)}/owner`, { cache: 'no-store' });
      const body = (await res.json().catch(() => ({}))) as { resolution?: OwnerResolution; error?: string };
      if (!res.ok || !body.resolution) {
        setLoad({ state: 'error', text: `Could not read the people on record (${body.error ?? res.status}).` });
        return;
      }
      setLoad({ state: 'ready', resolution: body.resolution });
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

  return (
    <section data-testid="owner-resolution" data-next-step={r.nextStep} className="mt-4 space-y-3 rounded-md border border-[var(--primary)] p-3 text-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">Needs an owner before routing</p>
        <p className="mt-1" data-testid="owner-resolution-headline">{r.headline}</p>
        {r.hypothesis ? <p className="text-xs text-[var(--muted-foreground)]">The fact is {r.hypothesis.factLabel}; candidates are ranked for it ({r.account.kind === 'carrier_3pl' ? 'a carrier / 3PL: network, hub, terminal, linehaul, planning and engineering owners' : 'a shipper: transportation, logistics, freight and fleet owners'}).</p> : null}
      </div>

      {r.eligible.length ? (
        <fieldset className="space-y-2" data-testid="owner-candidates">
          <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Best people on record</legend>
          {r.eligible.map((c, i) => (
            <label key={c.key} className={`block cursor-pointer rounded-md border p-2 ${chosen === c.key ? 'border-[var(--primary)]' : 'border-[var(--border)]'}`} data-testid="owner-candidate" data-key={c.key}>
              <div className="flex items-start gap-2">
                <input type="radio" name={`owner-${hypothesisId}`} value={c.key} checked={chosen === c.key} onChange={() => setChosen(c.key)} className="mt-1" aria-label={`Choose ${c.name}`} />
                <div className="min-w-0">
                  <p className="font-medium">
                    {i + 1}. {c.name}
                    {c.title ? <span className="font-normal text-[var(--muted-foreground)]">, {c.title}</span> : null}
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
                  {c.role && c.role.state !== 'ROLE_UNVERIFIED' ? (
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]" data-testid="owner-role">
                      Role: {c.role.label}. {c.role.why}
                    </p>
                  ) : null}
                  {c.location ? <p className="text-xs text-[var(--muted-foreground)]">{c.location}</p> : null}
                  <ul className="mt-1 space-y-0.5 text-xs text-[var(--muted-foreground)]">
                    {c.reasons.map((why) => (
                      <li key={why}>{why}</li>
                    ))}
                  </ul>
                  {c.caution ? <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{c.caution}</p> : null}
                </div>
              </div>
            </label>
          ))}
        </fieldset>
      ) : (
        <div className="rounded-md border border-dashed border-[var(--border)] p-2" data-testid="owner-not-resolved">
          <p className="font-medium">Owner not resolved.</p>
          <p className="text-xs text-[var(--muted-foreground)]">{r.research.why}</p>
          <p className="text-xs text-[var(--muted-foreground)]">Looks for: {r.research.slots.join('; ')}.</p>
        </div>
      )}

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

      {r.sponsor || r.tech ? (
        <p className="text-xs text-[var(--muted-foreground)]" data-testid="owner-slots">
          {r.sponsor ? `Sponsor: ${r.sponsor.name}${r.sponsor.title ? ` (${r.sponsor.title})` : ''}. ` : ''}
          {r.tech ? `Technology: ${r.tech.name}${r.tech.title ? ` (${r.tech.title})` : ''}.` : ''}
        </p>
      ) : null}
      {r.excluded.length ? (
        <div className="text-xs">
          <button type="button" className="underline" onClick={() => setShowExcluded((v) => !v)} data-testid="owner-excluded-toggle">
            {showExcluded ? 'Hide' : 'Show'} {r.excluded.length} set aside
          </button>
          {showExcluded ? (
            <ul className="mt-1 space-y-1" data-testid="owner-excluded">
              {r.excluded.map((e) => (
                <li key={e.candidate.key} data-code={e.code}>
                  <span className="font-medium">{e.candidate.name}</span>
                  {e.candidate.title ? <span className="text-[var(--muted-foreground)]">, {e.candidate.title}</span> : null}: {e.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <p className="text-[11px] text-[var(--muted-foreground)]">Checked first: {r.checked.join(' · ')}. {r.apollo.note}</p>
    </section>
  );
}
