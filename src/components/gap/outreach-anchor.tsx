'use client';

/**
 * OUTREACH ANCHOR (account-first UX, UX-06, Option A): for the chosen person, the one reviewed story the opening is
 * built on, and the honest alternatives. Renders the pure projection (lib/gap/story/anchor.ts); never ranks, never
 * writes copy.
 *
 *   PRIMARY ANCHOR          one approved grounded thesis (its observation, its source, how it was chosen)
 *   WHY THIS PERSON CARES   Our read
 *   SUPPORTING FACT         optional, only when eligible
 *   BEST PROOF              YardFlow's, clearly ours
 *   DO NOT USE              named, collapsed
 *   USE A DIFFERENT STORY   the other open theses; choosing one records anchorHypothesisId on the person's angle row
 *                           (POST /api/gap/personas/[id]/anchor) and the page re-renders on that thesis
 *   DRAFT + REVIEW STORY    a checked story line with no thesis: a prefilled draft (story, source, proposed
 *                           observation) through the existing hypothesis authority (POST /api/gap/hypotheses, then
 *                           submit); review happens in the cockpit's REVIEW lane. Never straight into copy.
 *
 * Nothing here sends, enrolls, writes HubSpot or spends Apollo. Voice: no em dashes.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { OutreachAnchor } from '@/lib/gap/story/anchor';
import { OBSERVATION_REFUSAL_TEXT } from '@/lib/gap/hypothesis/observation';
import { Tag } from './seller-tag';

const BTN = 'inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-medium';
const OUTLINE = `${BTN} border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-60`;
const PRIMARY = `${BTN} bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-60`;
const TEXT = 'inline-flex min-h-9 items-center text-xs underline text-[var(--muted-foreground)]';

/** The seller's persona key for a title (the propose API's enum); a title that names nothing is supply_chain. */
export function personaKeyFor(title: string | null): string {
  const t = (title ?? '').toLowerCase();
  if (/\b(chief|coo|cso|csco|evp|executive vice)\b/.test(t)) return 'executive_ops';
  if (/automation|robotic|engineering/.test(t)) return 'automation';
  if (/transport|freight|fleet|carrier|linehaul|line haul/.test(t)) return 'transportation';
  if (/distribution|warehous|fulfil|\bdc\b/.test(t)) return 'distribution';
  if (/plant|site|facility|yard|gate|dock/.test(t)) return 'site_ops';
  if (/security|compliance|safety/.test(t)) return 'security';
  if (/finance|procure|sourcing/.test(t)) return 'finance_procurement';
  if (/technology|systems|digital|it\b/.test(t)) return 'technology';
  return 'supply_chain';
}

export interface OutreachAnchorViewProps {
  accountName: string;
  anchor: OutreachAnchor;
  /** The pursuit state's cold-touch permission: a hold shows nothing to use, only the alternatives to read. */
  coldTouchAllowed: boolean;
}

type Busy = { kind: 'switch' | 'draft'; id: string } | null;

export function OutreachAnchorView({ accountName, anchor, coldTouchAllowed }: OutreachAnchorViewProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [note, setNote] = useState<{ kind: 'status' | 'alert'; text: string } | null>(null);
  const [drafting, setDrafting] = useState<string | null>(null);
  const [observation, setObservation] = useState('');
  const [problem, setProblem] = useState('');
  const [drafted, setDrafted] = useState<{ id: string; status: string } | null>(null);
  const person = anchor.person;

  async function switchStory(hypothesisId: string) {
    if (!person?.personaId) return;
    setNote(null);
    setBusy({ kind: 'switch', id: hypothesisId });
    try {
      const res = await fetch(`/api/gap/personas/${person.personaId}/anchor`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hypothesisId }) });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setNote({ kind: 'alert', text: `Could not switch the story (${body.error ?? res.status}). Nothing changed.` });
        return;
      }
      setNote({ kind: 'status', text: `${person.name.split(' ')[0]}'s opening now builds on that thesis. Nothing is sent; the email still runs every check.` });
      router.refresh();
    } catch (e) {
      setNote({ kind: 'alert', text: e instanceof Error ? e.message : 'network error' });
    } finally {
      setBusy(null);
    }
  }

  function openDraft(d: OutreachAnchor['draftable'][number]) {
    setDrafted(null);
    setNote(null);
    setDrafting(d.factId);
    setObservation(d.proposedObservation);
    setProblem('My guess is that this change moves load onto the gates, yards and docks they run, and that is where site capacity is won or lost.');
  }

  async function submitDraft(d: OutreachAnchor['draftable'][number]) {
    setNote(null);
    setBusy({ kind: 'draft', id: d.factId });
    try {
      const propose = await fetch('/api/gap/hypotheses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          accountName,
          primaryPersonaId: person?.personaId ?? null,
          persona: personaKeyFor(person?.title ?? null),
          problemFamily: 'unmapped',
          observation,
          problemHypothesis: problem,
          rootCauseHypotheses: [],
          impactHypotheses: [],
          falsificationQuestions: ['How do trailers get checked in and found at the sites this change touches today?'],
          whatANoMeans: 'If trailers do not wait longer at those sites since the change, it moved no load onto the yard: this thesis is closed for them.',
          confidence: 40,
          signalIds: [d.factId],
        }),
      });
      const body = (await propose.json().catch(() => ({}))) as { id?: string; error?: string; reason?: string };
      if (!propose.ok || !body.id) {
        const code = body.reason ?? body.error ?? String(propose.status);
        setNote({ kind: 'alert', text: (OBSERVATION_REFUSAL_TEXT as Record<string, string>)[code] ?? `Could not draft the thesis (${code}). Nothing changed.` });
        return;
      }
      // Submit for review through the same transition every thesis takes; approval stays a human click in REVIEW.
      const submit = await fetch(`/api/gap/hypotheses/${encodeURIComponent(body.id)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'submit' }) });
      const sub = (await submit.json().catch(() => ({}))) as { status?: string; error?: string };
      setDrafted({ id: body.id, status: submit.ok ? sub.status ?? 'review_required' : 'draft' });
      setNote({ kind: 'status', text: submit.ok ? 'Drafted and submitted for review. Approve it in the REVIEW lane; the opening then builds on it.' : `Drafted (${sub.error ?? submit.status}); submit it from the REVIEW lane.` });
      setDrafting(null);
      router.refresh();
    } catch (e) {
      setNote({ kind: 'alert', text: e instanceof Error ? e.message : 'network error' });
    } finally {
      setBusy(null);
    }
  }

  const first = person ? person.name.split(' ')[0] : null;
  const p = anchor.primary;
  const usableAlternatives = anchor.alternatives.filter((t) => t.usable || t.status === 'review_required');
  const unusable = anchor.alternatives.filter((t) => !t.usable && t.status !== 'review_required');
  const storyCount = usableAlternatives.length + anchor.draftable.length;

  return (
    <section className="space-y-2 rounded-md border border-[var(--border)] px-3 py-2" data-testid="outreach-anchor" aria-labelledby="outreach-anchor-heading">
      <h2 id="outreach-anchor-heading" className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        Outreach anchor{first ? ` for ${first}` : ''}
      </h2>

      {p ? (
        <div className="space-y-0.5" data-testid="anchor-primary" data-hypothesis={p.hypothesisId}>
          <div className="flex items-start gap-2">
            <Tag tag="Checked" />
            <p className="min-w-0 break-words text-sm">{p.observation}</p>
          </div>
          <p className="ml-1 text-xs text-[var(--muted-foreground)]">
            {p.basis}; {p.status === 'active' ? 'an active thesis' : p.status === 'approved' ? 'an approved thesis' : p.status}; chosen by {anchor.primaryBy}. The email is built on it and still runs every check.
          </p>
        </div>
      ) : (
        <p className="text-sm text-amber-700 dark:text-amber-400" data-testid="anchor-none">
          No usable thesis at {accountName} yet: nothing to open on.{' '}
          {unusable.length ? `${unusable.length === 1 ? 'The open thesis' : `${unusable.length} open theses`} would be refused by the send gate (${unusable[0].unusableWhy}).` : ''}{' '}
          {anchor.draftable.length ? 'A checked story below can be drafted and reviewed.' : 'Research finds the fact; review grounds the thesis.'}
        </p>
      )}

      {anchor.whyTheyCare ? (
        <div className="flex items-start gap-2" data-testid="anchor-why">
          <Tag tag="Our read" />
          <p className="min-w-0 break-words text-sm">{anchor.whyTheyCare.text}</p>
        </div>
      ) : null}

      <details className="text-sm" data-testid="anchor-more">
        <summary className="min-h-11 cursor-pointer py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Best proof, supporting fact, do not use ({anchor.doNotUse.length}) <span className="ml-2 font-normal normal-case underline">Show</span>
        </summary>
        <div className="mt-1 space-y-3">
          {anchor.supporting ? (
            <div className="space-y-0.5" data-testid="anchor-supporting">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Supporting fact</p>
              <div className="flex items-start gap-2">
                <Tag tag={anchor.supporting.tag} />
                <p className="min-w-0 break-words text-sm">{anchor.supporting.text}</p>
              </div>
              <p className="ml-1 text-xs text-[var(--muted-foreground)]">{anchor.supporting.basis}</p>
            </div>
          ) : null}
          <div className="space-y-0.5" data-testid="anchor-proof">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Best proof</p>
            <div className="flex items-start gap-2">
              <span className="inline-block shrink-0 whitespace-nowrap rounded border border-[var(--primary)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">{anchor.bestProof.tag}</span>
              <p className="min-w-0 break-words text-sm">{anchor.bestProof.text}</p>
            </div>
            <p className="ml-1 text-xs text-[var(--muted-foreground)]">YardFlow&apos;s own number, never theirs.</p>
          </div>
          {anchor.doNotUse.length ? (
            <div className="space-y-0.5" data-testid="anchor-do-not-use">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Do not use ({anchor.doNotUse.length})</p>
              <ul className="space-y-1 text-xs">
                {anchor.doNotUse.map((d, k) => (
                  <li key={k}>
                    <span className="text-[var(--foreground)]">{d.text}</span> <span className="text-[var(--muted-foreground)]">({d.reason})</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </details>

      {storyCount || unusable.length ? (
        <details className="text-sm" data-testid="anchor-alternatives" open={!p && anchor.draftable.length > 0 ? true : undefined}>
          <summary className="min-h-11 cursor-pointer py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {p ? 'Use a different story' : 'Draft and review a story'} ({storyCount}) <span className="ml-2 font-normal normal-case underline">Show</span>
          </summary>
          <div className="mt-1 space-y-2">
          {usableAlternatives.length ? (
            <ul className="space-y-2">
              {usableAlternatives.map((t) => (
                <li key={t.hypothesisId} className="flex flex-wrap items-center gap-x-3 gap-y-1" data-testid="anchor-alternative" data-hypothesis={t.hypothesisId}>
                  <p className="min-w-0 flex-1 text-sm">
                    {t.observation}
                    <span className="text-xs text-[var(--muted-foreground)]"> ({t.basis}; {t.status === 'review_required' ? 'under review' : t.status}; {t.relevance.tier === 'none' ? 'off their remit' : `${t.relevance.tier} on their remit`})</span>
                  </p>
                  {t.status === 'review_required' ? (
                    <Link href="/gap?lane=review" className={OUTLINE}>Review it</Link>
                  ) : person?.personaId && coldTouchAllowed ? (
                    <button type="button" className={OUTLINE} disabled={busy !== null} onClick={() => void switchStory(t.hypothesisId)} data-testid="anchor-use-story">
                      {busy?.kind === 'switch' && busy.id === t.hypothesisId ? 'Switching...' : 'Use this story'}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {unusable.length ? (
            <ul className="space-y-1 text-xs text-[var(--muted-foreground)]" data-testid="anchor-unusable">
              {unusable.map((t) => (
                <li key={t.hypothesisId} data-hypothesis={t.hypothesisId}>
                  Not usable: {t.observation.slice(0, 120)}{t.observation.length > 120 ? '...' : ''} ({t.unusableWhy})
                </li>
              ))}
            </ul>
          ) : null}
          {anchor.draftable.length ? (
            <ul className="space-y-2">
              {anchor.draftable.map((d) => (
                <li key={d.factId} className="space-y-2 border-t border-[var(--border)] pt-2 first:border-t-0 first:pt-0" data-testid="anchor-draftable" data-fact={d.factId}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="min-w-0 flex-1 text-sm">
                      {d.story}
                      <span className="text-xs text-[var(--muted-foreground)]"> ({d.sourceLabel}; no thesis yet)</span>
                    </p>
                    {drafting === d.factId ? null : (
                      <button type="button" className={OUTLINE} disabled={busy !== null} onClick={() => openDraft(d)} data-testid="anchor-draft-open">
                        Draft + review this story
                      </button>
                    )}
                  </div>
                  {drafting === d.factId ? (
                    <form
                      className="space-y-2"
                      data-testid="anchor-draft-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void submitDraft(d);
                      }}
                    >
                      <p className="text-xs"><span className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Story</span> {d.story}</p>
                      <p className="text-xs"><span className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Source</span> {d.sourceUrl ? <a href={d.sourceUrl} target="_blank" rel="noreferrer" className="underline">{d.sourceLabel}</a> : d.sourceLabel}</p>
                      <label className="block text-xs">
                        <span className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Proposed outreach observation</span>
                        <textarea className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent p-2 text-sm" rows={3} value={observation} onChange={(e) => setObservation(e.target.value)} data-testid="anchor-draft-observation" />
                        <span className="text-[var(--muted-foreground)]">A sentence about what changed, in the source&apos;s words, with its citation. A headline is refused.</span>
                      </label>
                      <label className="block text-xs">
                        <span className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Our guess (hedged)</span>
                        <textarea className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent p-2 text-sm" rows={2} value={problem} onChange={(e) => setProblem(e.target.value)} data-testid="anchor-draft-problem" />
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="submit" className={PRIMARY} disabled={busy !== null} data-testid="anchor-draft-submit">
                          {busy?.kind === 'draft' ? 'Drafting...' : 'Review + use'}
                        </button>
                        <button type="button" className={TEXT} onClick={() => setDrafting(null)}>Cancel</button>
                        <span className="text-xs text-[var(--muted-foreground)]">Creates a draft thesis and submits it for review. Nothing is sent.</span>
                      </div>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {drafted ? (
            <p className="text-xs" data-testid="anchor-drafted">
              Thesis {drafted.status === 'review_required' ? 'submitted for review' : 'drafted'}.{' '}
              <Link href="/gap?lane=review" className="underline">Open the REVIEW lane</Link>
            </p>
          ) : null}
          </div>
        </details>
      ) : null}

      <p role="status" aria-live="polite" className="text-xs" data-testid="anchor-note">
        {note?.kind === 'status' ? note.text : ''}
      </p>
      {note?.kind === 'alert' ? (
        <p role="alert" className="text-xs text-red-700 dark:text-red-400" data-testid="anchor-alert">
          {note.text}
        </p>
      ) : null}
    </section>
  );
}
