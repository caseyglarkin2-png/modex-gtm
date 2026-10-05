'use client';

/**
 * CONTACT CURRENTNESS, the seller's word (owner resolution, 2026-10-05). Casey discovered a departure by hand;
 * this is the lightweight way to tell GAP: THIS PERSON LEFT (with the new company, title, a source URL and a note),
 * or the role is wrong, or confirm them current. A human-confirmed correction: audited, immediate for every gate,
 * never do-not-contact, never HubSpot. VERIFY CURRENT ROLE runs one bounded public check. Voice: no em dashes.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function EmploymentControl({ personaId, name, accountName, state, compact = false }: { personaId: number; name: string; accountName: string; state?: { label: string; why: string } | null; compact?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<null | 'left' | 'role_changed'>(null);
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<{ ok: boolean; text: string } | null>(null);

  async function post(path: string, body: unknown, done: (b: Record<string, unknown>) => string) {
    setBusy(path);
    setOutcome(null);
    try {
      const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const b = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setOutcome({ ok: false, text: `Not recorded: ${String(b.error ?? res.status).replace(/_/g, ' ')}.` });
        return;
      }
      setOutcome({ ok: true, text: done(b) });
      setMode(null);
      router.refresh();
    } catch (e) {
      setOutcome({ ok: false, text: e instanceof Error ? e.message : 'network error' });
    } finally {
      setBusy(null);
    }
  }

  const correct = (status: 'left' | 'role_changed' | 'current') =>
    post(`/api/gap/personas/${personaId}/employment`, { status, newCompany: company.trim() || null, newTitle: title.trim() || null, sourceUrl: url.trim() || null, note: note.trim() || null }, (b) => {
      const read = b.read as { state?: string } | undefined;
      return status === 'left' ? `Recorded: ${name} left ${accountName}${company.trim() ? ` (now ${company.trim()})` : ''}. Not eligible for ${accountName} outreach; not do-not-contact.` : `Recorded (${String(read?.state ?? 'current').replace(/_/g, ' ').toLowerCase()}).`;
    });
  const verify = () =>
    post(`/api/gap/personas/${personaId}/employment/verify`, {}, (b) => {
      const v = b.verification as { verdict?: string; company?: string | null; title?: string | null; sourceUrl?: string | null; summary?: string | null } | undefined;
      const read = b.read as { state?: string } | undefined;
      return v?.verdict === 'unknown' ? `No source-backed answer${v?.summary ? ` (${v.summary})` : ''}. Nothing was asserted.` : `Verified from ${v?.sourceUrl ?? 'a source'}: ${v?.verdict === 'left' ? `now at ${v.company ?? 'another employer'}` : `current at ${accountName}`}${v?.title ? `, ${v.title}` : ''}. State: ${String(read?.state ?? '').replace(/_/g, ' ').toLowerCase()}.`;
    });

  return (
    <div className={compact ? 'mt-1 text-xs' : 'mt-2 space-y-1 text-xs'} data-testid="employment-control" data-persona={personaId}>
      {state && !compact ? (
        <p className="text-[var(--muted-foreground)]" data-testid="employment-state">
          Employment: {state.label}. {state.why}
        </p>
      ) : null}
      {mode === null ? (
        <p className="flex flex-wrap gap-x-3 gap-y-1">
          <button type="button" className="underline" onClick={() => setMode('left')} data-testid="employment-left">
            This person left
          </button>
          <button type="button" className="underline" onClick={() => setMode('role_changed')} data-testid="employment-wrong-role">
            Current role is wrong
          </button>
          <button type="button" className="underline" disabled={busy !== null} onClick={() => void verify()} data-testid="employment-verify">
            {busy?.endsWith('/verify') ? 'Verifying...' : 'Verify current role'}
          </button>
        </p>
      ) : (
        <div className="space-y-1 rounded-md border border-[var(--border)] p-2" data-testid="employment-form">
          <p className="font-medium">{mode === 'left' ? `${name} left ${accountName}.` : `${name}'s role is wrong.`} Add what you know (optional).</p>
          {mode === 'left' ? <input aria-label="New company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="New company" className="block w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1" /> : null}
          <input aria-label="New title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={mode === 'left' ? 'New title' : 'Correct title'} className="block w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1" />
          <input aria-label="Source URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Source URL (a profile, an announcement)" className="block w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1" />
          <input aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" className="block w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1" />
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={busy !== null} onClick={() => void correct(mode)} data-testid="employment-save">
              {busy ? 'Saving...' : mode === 'left' ? 'Record: left the company' : 'Record the correct role'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setMode(null)}>
              Cancel
            </Button>
          </div>
          <p className="text-[var(--muted-foreground)]">This removes them from {accountName} outreach at once. It never marks them do not contact and never changes HubSpot.</p>
        </div>
      )}
      {outcome ? (
        <p role={outcome.ok ? 'status' : 'alert'} className={outcome.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-[var(--destructive)]'} data-testid="employment-outcome">
          {outcome.text}
        </p>
      ) : null}
    </div>
  );
}
