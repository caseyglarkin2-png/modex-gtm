'use client';

/**
 * WHAT GAP SHOULD LEARN NEXT (Account Intelligence C): the research plan read off the brief. A research task has
 * a DEEPEN button (one focused run; every excerpt is re-fetched at its own source before it becomes a fact); a
 * question only the buyer can answer is shown as a question; what GAP will not research says why. No score.
 * Voice: no em dashes.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ResearchPlan } from '@/lib/gap/account-intel/orchestrate';

const SECTION_LABEL: Record<string, string> = { catalysts: 'Catalysts', footprint: 'Footprint', technology: 'Technology', freight: 'Freight', org: 'Who owns it', economics: 'Economics', yard: 'Yard process', commercial: 'Commercial' };
const OUTCOME: Record<string, string> = { evidence_found: 'found verified evidence', insufficient_evidence: 'found nothing it could verify (an honest answer)', conflicting_evidence: 'found sources that disagree' };

export function ResearchPlanView({ accountName, plan }: { accountName: string; plan: ResearchPlan }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  async function deepen(section: string) {
    setBusy(section);
    setMsg(null);
    let res: Response;
    let body: { outcome?: string; facts?: number; error?: string; reason?: string } = {};
    try {
      res = await fetch('/api/gap/accounts/deepen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountName, section }) });
      body = ((await res.json().catch(() => ({}))) ?? {}) as typeof body;
    } catch {
      return setMsg('The request did not complete. The run may have started; reopen the page before trying again.');
    } finally {
      setBusy(null);
    }
    if (res.status === 504) return setMsg('The run took too long to answer; it may have partly run. Reopen the page to see what it found.');
    if (!res.ok) return setMsg(body.reason ?? `Not run: ${body.error ?? res.status}`);
    setMsg(`${SECTION_LABEL[section] ?? section}: ${OUTCOME[body.outcome ?? ''] ?? body.outcome}${body.facts ? ` (${body.facts} ${body.facts === 1 ? 'fact' : 'facts'})` : ''}.`);
    router.refresh();
  }
  if (!plan.tasks.length && !plan.skipped.length) return null;
  return (
    <section className="space-y-2" data-testid="research-plan">
      <h2 className="text-sm font-semibold">What GAP should learn next</h2>
      <ol className="space-y-2">
        {plan.tasks.map((t) => (
          <li key={`${t.section}-${t.provider}`} className="rounded-md border border-[var(--border)] px-3 py-2 text-sm" data-testid="research-task" data-provider={t.provider}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              {SECTION_LABEL[t.section] ?? t.section} · {t.provider === 'research' ? 'research' : t.provider === 'human' ? 'ask the buyer' : 'HubSpot'}
            </p>
            <p>{t.provider === 'research' ? t.why : t.focus}</p>
            {t.provider === 'research' ? (
              <button type="button" disabled={!!busy} onClick={() => void deepen(t.section)} className="mt-1 min-h-[36px] rounded-md border border-[var(--border)] px-2 text-xs hover:bg-[var(--muted)] disabled:opacity-60" data-testid={`deepen-${t.section}`}>
                {busy === t.section ? 'Researching...' : `Deepen ${SECTION_LABEL[t.section]?.toLowerCase() ?? t.section}`}
              </button>
            ) : (
              <p className="text-xs text-[var(--muted-foreground)]">{t.why}</p>
            )}
          </li>
        ))}
      </ol>
      {msg ? <p className="text-xs" data-testid="research-plan-result">{msg}</p> : null}
      {plan.skipped.length ? (
        <details className="text-xs text-[var(--muted-foreground)]">
          <summary className="cursor-pointer">Not researching ({plan.skipped.length})</summary>
          <ul className="list-disc pl-5">
            {plan.skipped.map((s) => (
              <li key={s.section}>
                {SECTION_LABEL[s.section] ?? s.section}: {s.reason}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
