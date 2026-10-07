'use client';

/**
 * The account motion header in READY (Phase 2 C): who first, who next, and
 * why each person, for one account. Casey confirms or switches the primary
 * (POST /api/gap/accounts/motion) and owns each person's one-line angle
 * (POST /api/gap/personas/{id}/angle). A suggested angle is labelled
 * suggested until he accepts or edits it. Nothing here sends anything.
 * Voice: no em dashes.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CockpitAngle, CockpitMotion } from '@/lib/gap/motion/cockpit';
import { confirmChoiceBody } from '@/lib/gap/motion/account-motion';
import { AccountLink } from './account-link';
import { refreshNow } from '@/components/gap/refresh-now';

/** One person's angle: owned (edit), suggested (accept / edit) or missing (write). `bare` omits the label (the brief supplies it). */
export function AngleLine({ a, personaId, bare = false }: { a: CockpitAngle | undefined; personaId: number; bare?: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(a?.angle?.text ?? a?.suggested ?? '');
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(source: 'human' | 'accepted_suggestion', value: string) {
    setError(null);
    const res = await fetch(`/api/gap/personas/${personaId}/angle`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: value, source }) });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? `HTTP ${res.status}`);
      return;
    }
    setSaved(value.trim());
    setEditing(false);
    refreshNow(router);
  }

  const current = saved ?? a?.angle?.text ?? null;
  if (editing) {
    return (
      <div className="mt-1 space-y-1">
        <textarea aria-label="Why this person" value={text} onChange={(e) => setText(e.target.value)} rows={2} className="w-full rounded-md border border-[var(--border)] bg-transparent p-1 text-xs" />
        <div className="flex gap-2">
          <button type="button" data-testid="angle-save" onClick={() => void save(a?.suggested && text.trim() === a.suggested ? 'accepted_suggestion' : 'human', text)} className="rounded-md border border-[var(--border)] px-2 py-0.5 text-xs">
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-xs underline">
            Cancel
          </button>
        </div>
        {error ? <p role="alert" className="text-xs text-[var(--destructive)]">{error}</p> : null}
      </div>
    );
  }
  if (current) {
    return (
      <p className="mt-1 text-xs" data-testid="angle-current">
        {bare ? null : <span className="font-semibold">Why this person: </span>}{current}{' '}
        <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-6 min-w-6 items-center justify-center px-1 underline">
          edit
        </button>
      </p>
    );
  }
  if (a?.suggested) {
    return (
      <p className="mt-1 text-xs" data-testid="angle-suggested">
        <span className="font-semibold">{bare ? 'Suggested (not yours yet):' : 'Suggested why:'}</span> <span className="italic">{a.suggested}</span>{' '}
        {/* R63-B S13: 24 px targets at phone width. */}
        <button type="button" data-testid="angle-accept" onClick={() => void save('accepted_suggestion', a.suggested!)} className="inline-flex min-h-6 min-w-6 items-center justify-center px-1 underline">
          accept
        </button>{' '}
        <button type="button" data-testid="angle-edit" onClick={() => setEditing(true)} className="inline-flex min-h-6 min-w-6 items-center justify-center px-1 underline">
          edit
        </button>
        {error ? <span role="alert" className="ml-2 text-[var(--destructive)]">{error}</span> : null}
      </p>
    );
  }
  return (
    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
      No angle yet.{' '}
      <button type="button" onClick={() => setEditing(true)} className="underline">
        Write why this person
      </button>
    </p>
  );
}

export function AccountMotionPanel({ motion }: { motion: CockpitMotion }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function swap() {
    if (!motion.next || !motion.primary) return;
    setBusy(true);
    setError(null);
    const res = await fetch('/api/gap/accounts/motion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountName: motion.accountName, primaryPersonaId: motion.next.personaId, nextPersonaId: motion.primary.personaId > 0 ? motion.primary.personaId : null }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? `HTTP ${res.status}`);
      return;
    }
    refreshNow(router);
  }

  async function makePrimary(personaId: number) {
    // needs_owner (no cold WHO among the cards): Casey's choice is the only way one of them leads.
    if (!motion.primary && motion.state !== 'needs_owner') return;
    setBusy(true);
    setError(null);
    const res = await fetch('/api/gap/accounts/motion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountName: motion.accountName, primaryPersonaId: personaId, nextPersonaId: motion.primary && motion.primary.personaId > 0 && motion.primary.personaId !== personaId ? motion.primary.personaId : null }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? `HTTP ${res.status}`);
      return;
    }
    refreshNow(router);
  }

  async function confirm() {
    // A NEXT person who is not a direct operator is never recorded by confirming someone else (re-review C2).
    const body = confirmChoiceBody(motion);
    if (!body) return;
    setBusy(true);
    const res = await fetch('/api/gap/accounts/motion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) refreshNow(router);
  }

  return (
    <section data-testid="account-motion" data-account={motion.accountName} data-state={motion.state} className="space-y-2 rounded-md border border-[var(--border)] bg-[var(--muted)]/30 p-3 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"><AccountLink name={motion.accountName} /> · account motion</p>
      <p data-testid="motion-headline" className={motion.state === 'paused_reply' || motion.state === 'in_conversation' || motion.state === 'needs_owner' ? 'font-medium text-amber-700 dark:text-amber-400' : ''}>
        {motion.headline}
      </p>
      {motion.primary ? (
        <div data-testid="motion-primary">
          <p>
            <span className="font-semibold">{motion.state === 'in_motion' ? 'In motion' : motion.primary.chosen ? 'Primary' : 'Suggested primary'}:</span> {motion.primary.name}
            <span className="ml-1 text-xs text-[var(--muted-foreground)]">({motion.primary.factors.join(' · ')})</span>
          </p>
          {motion.primary.personaId > 0 ? <AngleLine a={motion.angles[String(motion.primary.personaId)]} personaId={motion.primary.personaId} /> : null}
          {!motion.primary.chosen && motion.state === 'ready' ? (
            <button type="button" data-testid="motion-confirm" disabled={busy} onClick={() => void confirm()} className="mt-1 text-xs underline">
              Confirm {motion.primary.name} as primary
            </button>
          ) : null}
        </div>
      ) : null}
      {motion.next ? (
        <div data-testid="motion-next" className="border-t border-[var(--border)] pt-2">
          <p>
            <span className="font-semibold">Next:</span> {motion.next.name}
            <span className="ml-1 text-xs text-[var(--muted-foreground)]">({motion.next.factors.join(' · ')})</span>
          </p>
          <p className="text-xs text-[var(--muted-foreground)]" data-testid="motion-unlock">
            Unlocks {motion.next.unlock}.
          </p>
          <AngleLine a={motion.angles[String(motion.next.personaId)]} personaId={motion.next.personaId} />
          {motion.state === 'ready' && motion.primary ? (
            <button type="button" data-testid="motion-swap" disabled={busy} onClick={() => void swap()} className="mt-1 text-xs underline">
              Make {motion.next.name} the primary instead
            </button>
          ) : null}
        </div>
      ) : null}
      {motion.alsoWaiting.length ? (
        <div data-testid="motion-also-waiting" className="border-t border-[var(--border)] pt-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{motion.state === 'needs_owner' ? 'On record (none is the transportation owner)' : 'Also waiting (after the next person)'}</p>
          <ul className="mt-1 space-y-2">
            {motion.alsoWaiting.map((p) => (
              <li key={p.personaId} data-testid="motion-waiting-person">
                <p>
                  {p.name}
                  <span className="ml-1 text-xs text-[var(--muted-foreground)]">({p.factors.join(' · ')})</span>
                </p>
                <AngleLine a={motion.angles[String(p.personaId)]} personaId={p.personaId} />
                {(motion.state === 'ready' && motion.primary) || motion.state === 'needs_owner' ? (
                  <button type="button" data-testid="motion-make-primary" disabled={busy} onClick={() => void makePrimary(p.personaId)} className="mt-1 text-xs underline">
                    Make {p.name} the primary{motion.state === 'needs_owner' ? '' : ' instead'}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {error ? <p role="alert" className="text-xs text-[var(--destructive)]">{error}</p> : null}
    </section>
  );
}
