'use client';
/**
 * ACCEPT AN ANGLE (C24 + C25 of the commercial-context audit, 2026-10-08): the one control that fires the promotion
 * of a prepared angle into the existing draft workflow. The seller picks the person the angle offered and the
 * action (the angle's proposal first), the control posts to /api/gap/angles/promote and shows the line GAP answers.
 * When existing work competes (409), it shows that line, the drafts found, and only the choices the service offers
 * (reuse or a fresh one; revise only, never a second draft, when an unsent draft carries the seller's own edits);
 * a choice posts again with it. Nothing here sends; a draft is said as a draft. The lead mounts it beside the
 * prepared angle (intel-panel.tsx); pinned by tests/unit/gap/stream-b-angle-promote.test.tsx.
 */
import { useState } from 'react';

export interface AnglePromoteProps {
  taskId: string;
  people: Array<{ personaId: number; name: string | null; title: string | null }>;
  proposedAction: 'email' | 'call' | 'research';
  accountName: string | null;
  /** P2-8: for a person item, the person who wrote in: the reply goes to them (posted as personaId null); the offered people stay as alternatives. */
  writer?: { email: string; name: string | null } | null;
}

type Choice = 'reuse' | 'revise' | 'fresh';
interface Competing { line: string; offers: Choice[]; items: Array<{ id: string; subject: string | null; at: string; provider: string; sellerEdited: boolean }> }

const BTN = 'rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--muted)] disabled:opacity-50';
const PRIMARY = 'rounded-md bg-[var(--primary)] px-2 py-1 text-xs text-[var(--primary-foreground)] disabled:opacity-50';
const ACTION_LABEL: Record<AnglePromoteProps['proposedAction'], string> = { email: 'Draft the email', call: 'Prepare the call', research: 'Research first' };
const CHOICE_LABEL: Record<Choice, string> = { reuse: 'Reuse that draft', revise: 'Revise it where it is', fresh: 'Write a fresh one' };

export function AnglePromote({ taskId, people, proposedAction, accountName, writer = null }: AnglePromoteProps) {
  const [personaId, setPersonaId] = useState<number | null>(writer ? null : people[0]?.personaId ?? null);
  const hasRecipient = !!writer || people.length > 0;
  const [busy, setBusy] = useState(false);
  const [line, setLine] = useState<string | null>(null);
  const [href, setHref] = useState<string | null>(null);
  const [competing, setCompeting] = useState<Competing | null>(null);
  const [lastAction, setLastAction] = useState<AnglePromoteProps['proposedAction']>(proposedAction);

  async function promote(action: AnglePromoteProps['proposedAction'], choice: Choice | null = null) {
    setBusy(true);
    setLastAction(action);
    try {
      const res = await fetch('/api/gap/angles/promote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId, personaId, action, ...(choice ? { choice } : {}) }) });
      const data = (await res.json().catch(() => ({}))) as { line?: string; href?: string | null; error?: string; detail?: string | null; competing?: { items?: Competing['items'] }; offers?: Choice[] };
      if (res.status === 409 && data.competing) {
        setCompeting({ line: data.line ?? 'Existing work competes with this draft.', offers: data.offers ?? [], items: data.competing.items ?? [] });
        setLine(null);
        return;
      }
      setCompeting(null);
      if (!res.ok) {
        setLine(`GAP did not prepare it: ${data.detail ?? data.error ?? `HTTP ${res.status}`}.`);
        setHref(null);
        return;
      }
      setLine(data.line ?? 'Prepared.');
      setHref(data.href ?? null);
    } catch {
      setLine('GAP could not be reached just now. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 space-y-2 text-xs" data-testid="angle-promote" data-task={taskId}>
      {hasRecipient ? (
        <label className="flex flex-wrap items-center gap-2">
          <span className="text-[var(--muted-foreground)]">For</span>
          <select className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1" value={personaId ?? ''} onChange={(e) => setPersonaId(e.target.value ? Number(e.target.value) : null)} disabled={busy} data-testid="angle-promote-person">
            {writer ? <option value="">Reply to {writer.name ?? writer.email}</option> : null}
            {people.map((p) => <option key={p.personaId} value={p.personaId}>{p.name ?? `person ${p.personaId}`}{p.title ? ` (${p.title})` : ''}</option>)}
          </select>
        </label>
      ) : <p className="text-[var(--muted-foreground)]">No person is on record{accountName ? ` at ${accountName}` : ''}: the email and the call wait for one.</p>}
      <div className="flex flex-wrap items-center gap-2">
        {(['email', 'call', 'research'] as const).map((a) => (
          <button key={a} type="button" className={a === proposedAction ? PRIMARY : BTN} disabled={busy || (a !== 'research' && !hasRecipient)} onClick={() => void promote(a)} data-testid={`angle-promote-${a}`}>
            {ACTION_LABEL[a]}{a === proposedAction ? ' (proposed)' : ''}
          </button>
        ))}
      </div>
      {competing ? (
        <div className="rounded-md border border-amber-400 p-2" data-testid="angle-promote-competing">
          <p>{competing.line}</p>
          <ul className="mt-1 list-disc pl-4">
            {competing.items.map((i) => <li key={`${i.provider}:${i.id}`}>{i.subject ?? 'untitled draft'} ({i.provider === 'gmail' ? 'Gmail' : 'GAP'}, {i.at.slice(0, 10)}{i.sellerEdited ? ', with your edits' : ''})</li>)}
          </ul>
          <div className="mt-2 flex flex-wrap gap-2">
            {competing.offers.map((c) => <button key={c} type="button" className={BTN} disabled={busy} onClick={() => void promote(lastAction, c)} data-testid={`angle-promote-choice-${c}`}>{CHOICE_LABEL[c]}</button>)}
          </div>
        </div>
      ) : null}
      {line ? <p role="status" className="text-[var(--muted-foreground)]" data-testid="angle-promote-line">{line}{href ? <> <a href={href} className="underline">Open it</a>.</> : null}</p> : null}
    </div>
  );
}
