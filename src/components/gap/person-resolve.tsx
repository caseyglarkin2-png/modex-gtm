'use client';

/**
 * AMBIGUOUS PERSON (Entity Expansion B3): Casey says who this is. THIS IS <an existing person>, NEW PERSON AT
 * <an account> (a staged candidate, never a Persona), WRONG COMPANY, or LEAVE UNRESOLVED. GAP never merges a
 * person and never decides this itself. Voice: no em dashes.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MemberView } from '@/lib/gap/intake/views';

const btn = 'min-h-[36px] rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--muted)] disabled:opacity-60';

export function PersonResolve({ member }: { member: Pick<MemberView, 'id' | 'name' | 'candidates' | 'accountName'> }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const people = member.candidates.filter((c) => c.personaId);
  const accounts = [...new Set(member.candidates.filter((c) => !c.personaId && !c.accountName.endsWith('(not in GAP)')).map((c) => c.accountName).concat(member.accountName ? [member.accountName] : []))];
  async function send(body: Record<string, unknown>, done: string) {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/gap/sources/members/${encodeURIComponent(member.id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setBusy(false);
    if (!res.ok) return setMsg(`Not saved: ${String(((await res.json().catch(() => ({}))) as { error?: string }).error ?? res.status)}`);
    setMsg(done);
    router.refresh();
  }
  return (
    <div className="space-y-1" data-testid="person-resolve">
      <p className="text-xs font-semibold">Who is {member.name ?? 'this'}?</p>
      <div className="flex flex-wrap gap-2">
        {people.map((c) => (
          <button key={c.personaId} type="button" className={btn} disabled={busy} onClick={() => void send({ resolve: 'existing', personaId: c.personaId }, `Placed as ${c.name ?? 'that person'} at ${c.accountName}.`)} data-testid="resolve-existing">
            This is {c.name ?? `person ${c.personaId}`}
            {c.title ? `, ${c.title}` : ''} ({c.accountName})
          </button>
        ))}
        {accounts.map((a) => (
          <button key={a} type="button" className={btn} disabled={busy} onClick={() => void send({ resolve: 'new_at_account', accountName: a }, `Staged as a new person at ${a} (review before promoting).`)} data-testid="resolve-new">
            New person at {a}
          </button>
        ))}
        <button type="button" className={btn} disabled={busy} onClick={() => void send({ resolve: 'wrong_company' }, 'Unplaced: not at that company.')} data-testid="resolve-wrong">
          Wrong company
        </button>
        <button type="button" className={btn} disabled={busy} onClick={() => void send({ resolve: 'leave' }, 'Left unresolved.')} data-testid="resolve-leave">
          Leave unresolved
        </button>
      </div>
      {msg ? <p className="text-xs">{msg}</p> : null}
    </div>
  );
}
