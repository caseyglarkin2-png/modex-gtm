'use client';

/**
 * ADD TO GAP (owner resolution, 2026-10-05): NOW names a person who exists only in HubSpot; this is the control
 * beside that line. One click links that exact HubSpot contact into this exact GAP account
 * (POST /api/gap/people/import): never a new account, never a duplicate, never HubSpot, never Apollo. The page
 * refreshes and the warning disappears. Voice: no em dashes.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { refusalSentence } from '@/lib/gap/ui/refusal-copy';

const STATUS_COPY: Record<string, string> = {
  created: 'Added as a GAP contact.',
  linked: 'Linked to the existing GAP contact.',
  already: 'Already a GAP contact.',
  rehomed: 'Moved to this account from a family account.',
};

export function AddToGapButton({ accountName, hubspotContactId, name, title, label = 'Add to GAP', onDone }: { accountName: string; hubspotContactId: string; name: string; title?: string | null; label?: string; onDone?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; notes: string[] } | null>(null);

  async function add() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/gap/people/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accountName, hubspotContactId }) });
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const code = typeof body.error === 'string' ? body.error : `HTTP ${res.status}`;
        setResult({ ok: false, text: refusalSentence(code) ?? `Not added: ${code.replace(/_/g, ' ')}.${typeof body.detail === 'string' ? ` ${body.detail}` : ''}`, notes: [] });
        return;
      }
      setResult({ ok: true, text: `${STATUS_COPY[String(body.status)] ?? 'Done.'} ${name} is now available to routing at ${accountName}.`, notes: Array.isArray(body.notes) ? (body.notes as string[]) : [] });
      onDone?.();
      router.refresh();
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : 'network error', notes: [] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-1 space-y-1" data-testid="add-to-gap">
      <Button type="button" size="sm" disabled={busy} onClick={() => void add()} data-testid="add-to-gap-button" aria-label={`${label}: ${name}${title ? `, ${title}` : ''}`}>
        {busy ? 'Adding...' : label}
      </Button>
      {result ? (
        <div role={result.ok ? 'status' : 'alert'} className={`text-xs ${result.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-[var(--destructive)]'}`} data-testid="add-to-gap-result">
          <p>{result.text}</p>
          {result.notes.map((n) => (
            <p key={n} className="text-[var(--muted-foreground)]">{n}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
