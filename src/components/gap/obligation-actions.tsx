'use client';

/**
 * Done, Snooze and Skip on one commitment (GAP OS execution recovery, R40 / R41), shared by the Work card and the
 * account page. Each records the status through `POST /api/gap/commitments` (one append-only row; done carries the
 * seller's note as its proof), then the page reloads. Nothing here sends, enrolls or writes anywhere else.
 */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { refreshNow } from '@/components/gap/refresh-now';
import type { SkippedAtClosure as SkippedItem } from '@/lib/gap/work/commitment-model';

const SMALL = 'inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--border)] px-2.5 text-xs hover:bg-[var(--muted)] disabled:opacity-60 sm:min-h-9';
const INPUT = 'min-h-11 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm sm:min-h-9';

export async function postJson(url: string, body: unknown): Promise<{ ok: boolean; error: string | null }> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) return { ok: true, error: null };
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: j.error ?? `HTTP ${res.status}` };
  } catch {
    return { ok: false, error: 'no connection' };
  }
}

export const REFUSAL_TEXT: Record<string, string> = {
  terminal: 'it is already closed',
  until_in_past: 'that date has passed',
  until_too_far: 'that is more than 90 days out',
  until_required: 'choose a date',
  reason_required: 'say why in a few words',
  proof_required: 'say what shows it is done',
};

const RESTORE_REFUSAL: Record<string, string> = {
  not_found: 'it is no longer on record',
  not_skipped_at_closure: 'the closure did not skip it',
  deal_closed: 'the deal is closed again',
  account_not_found: 'the account is no longer on record',
};
const shortDay = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' }) : null);

/**
 * Sprint 5 review (R55): a reopened deal's next step lists what its closure skipped, with the due dates; Restore puts
 * one back as a new open obligation (the skipped record stays as history). Nothing here sends or writes HubSpot.
 */
export function SkippedAtClosure({ items }: { items: ReadonlyArray<SkippedItem & { restored: boolean }> }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, string>>({});
  if (!items.length) return null;
  async function restore(id: string) {
    setBusy(id);
    const r = await postJson('/api/gap/commitments', { op: 'restore', commitmentId: id });
    setBusy(null);
    setDone((m) => ({ ...m, [id]: r.ok ? 'Restored.' : `Not restored: ${RESTORE_REFUSAL[r.error ?? ''] ?? r.error}.` }));
    if (r.ok) refreshNow(router);
  }
  return (
    <div className="mt-1 space-y-1 rounded-md border border-dashed border-[var(--border)] p-2" data-testid="skipped-at-closure">
      <p className="text-xs font-medium">Skipped when the deal closed. Restore what still stands:</p>
      <ul className="space-y-1">
        {items.map((s) => (
          <li key={s.commitmentId} className="flex flex-wrap items-center gap-2 text-xs" data-testid="skipped-at-closure-item">
            <span className="min-w-0 flex-1">
              {s.title}
              <span className="text-[var(--muted-foreground)]">{s.dueAt ? `, due ${shortDay(s.dueAt)}` : ', no date set'}</span>
            </span>
            {s.restored ? (
              <span className="text-[var(--muted-foreground)]" data-testid="skipped-restored">Restored</span>
            ) : done[s.commitmentId] ? (
              <span role="status" className="text-[var(--muted-foreground)]" data-testid="restore-status">{done[s.commitmentId]}</span>
            ) : (
              <button type="button" className={SMALL} disabled={busy === s.commitmentId} data-testid="restore-obligation" onClick={() => void restore(s.commitmentId)}>
                Restore
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ObligationActions({ commitmentId, proofNeeded = null }: { commitmentId: string | null; /** Batch item 8: a milestone's own proof, asked for on Done. */ proofNeeded?: string | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<'none' | 'done' | 'snooze' | 'skip'>('none');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  if (!commitmentId) return null;
  async function record(to: 'done' | 'snoozed' | 'skipped') {
    setBusy(true);
    setStatus(null);
    const r = await postJson('/api/gap/commitments', { op: 'status', commitmentId, to, ...(to === 'done' && text.trim() ? { note: text.trim() } : {}), ...(to === 'snoozed' ? { until: text.trim() } : {}), ...(to === 'skipped' && text.trim() ? { reason: text.trim() } : {}) });
    setBusy(false);
    if (!r.ok) {
      setStatus(`Not recorded: ${REFUSAL_TEXT[r.error ?? ''] ?? r.error}.`);
      return;
    }
    setStatus(to === 'done' ? 'Recorded as done.' : to === 'snoozed' ? 'Snoozed.' : 'Skipped.');
    setMode('none');
    refreshNow(router);
  }
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      {mode === 'none' ? (
        <>
          <button type="button" className={SMALL} data-testid="obligation-done" onClick={() => { setMode('done'); setText(''); }}>Done</button>
          <button type="button" className={SMALL} data-testid="obligation-snooze" onClick={() => { setMode('snooze'); setText(''); }}>Snooze</button>
          <button type="button" className={SMALL} data-testid="obligation-skip" onClick={() => { setMode('skip'); setText(''); }}>Skip</button>
        </>
      ) : (
        <>
          <label className="flex min-w-0 flex-1 items-center gap-2 text-xs">
            <span className="shrink-0" data-testid="obligation-input-label">{mode === 'done' ? (proofNeeded ? `What shows it is done (${proofNeeded})` : 'What shows it is done') : mode === 'snooze' ? 'Back on' : 'Why not (optional)'}</span>
            <input className={`${INPUT} min-w-0 flex-1`} type={mode === 'snooze' ? 'date' : 'text'} maxLength={240} value={text} onChange={(e) => setText(e.target.value)} data-testid="obligation-input" />
          </label>
          <button type="button" className={SMALL} disabled={busy || ((mode === 'snooze' || mode === 'done') && !text.trim())} data-testid="obligation-confirm" onClick={() => void record(mode === 'done' ? 'done' : mode === 'snooze' ? 'snoozed' : 'skipped')}>
            {mode === 'done' ? 'Record done' : mode === 'snooze' ? 'Snooze' : 'Skip it'}
          </button>
          <button type="button" className={SMALL} onClick={() => setMode('none')}>Cancel</button>
        </>
      )}
      {status ? <span role="status" className="text-xs text-[var(--muted-foreground)]" data-testid="obligation-status">{status}</span> : null}
    </div>
  );
}
