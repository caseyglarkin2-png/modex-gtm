'use client';

/**
 * CANDIDATE ACCOUNTS (Entity Expansion B): companies GAP met in a work source but could not place. For each:
 * COMPANY, WHY ICP (Scout's verdict, derived from cited evidence), NETWORK and FREIGHT EVIDENCE (links),
 * RELATIONSHIP SOURCE (context, never evidence or consent), WHAT WE DON'T KNOW, and Casey's four choices:
 * ADD ACCOUNT (the creation check runs first and shows what it found), MAP TO EXISTING, RESEARCH MORE, IGNORE.
 * GAP never creates an account on its own. Voice: no em dashes.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { QueueItem } from '@/lib/gap/entity/candidates';

const VERDICT_LABEL: Record<string, string> = { LIKELY_ICP: 'Likely ICP', MAYBE_ICP: 'Maybe ICP', NOT_ICP: 'Not ICP', AMBIGUOUS: 'Ambiguous', INSUFFICIENT: 'Not enough to say' };
const VERDICT_TONE: Record<string, string> = {
  LIKELY_ICP: 'border-emerald-600 text-emerald-700 dark:text-emerald-400',
  MAYBE_ICP: 'border-sky-600 text-sky-700 dark:text-sky-400',
  AMBIGUOUS: 'border-amber-600 text-amber-700 dark:text-amber-400',
  NOT_ICP: 'border-[var(--border)] text-[var(--muted-foreground)]',
  INSUFFICIENT: 'border-[var(--border)] text-[var(--muted-foreground)]',
};
const REFUSAL: Record<string, string> = {
  exists: 'An account with exactly this name already exists.',
  possible_duplicate: 'An account with the same name (spelled differently) already exists:',
  alias_of: 'This name is already an alias of:',
  domain_of: 'This domain already belongs to:',
  name_required: 'A name is required.',
};

const safe = (u: string) => {
  try {
    const p = new URL(u).protocol;
    return p === 'http:' || p === 'https:';
  } catch {
    return false;
  }
};

async function post(body: Record<string, unknown>) {
  const res = await fetch('/api/gap/candidates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { ok: res.ok, status: res.status, body: ((await res.json().catch(() => ({}))) ?? {}) as Record<string, unknown> };
}

function Claims({ label, items }: { label: string; items: Array<{ claim: string; url: string }> }) {
  if (!items.length) return null;
  return (
    <div className="text-xs">
      <p className="font-semibold">{label}</p>
      <ul className="list-disc pl-4">
        {items.map((c) => (
          <li key={c.claim} className="break-words">
            {c.claim}{' '}
            {safe(c.url) ? (
              <a href={c.url} target="_blank" rel="noreferrer" className="underline">
                source
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddForm({ c, onDone }: { c: QueueItem; onDone: (msg: string) => void }) {
  const router = useRouter();
  const [name, setName] = useState(c.company);
  const [vertical, setVertical] = useState('');
  const [domain, setDomain] = useState(c.domain ?? '');
  const [reason, setReason] = useState(`${c.sources.join(', ')}${c.why ? `: ${c.why}` : ''}`.slice(0, 480));
  const [check, setCheck] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  async function runCheck() {
    setBusy(true);
    const r = await post({ op: 'check', name: name.trim(), ...(domain.trim() ? { domain: domain.trim() } : {}) });
    setBusy(false);
    setCheck(r.body);
  }
  async function add() {
    setBusy(true);
    const r = await post({ op: 'add', company: c.company, name: name.trim(), vertical: vertical.trim(), reason: reason.trim(), ...(domain.trim() ? { domain: domain.trim() } : {}) });
    setBusy(false);
    if (!r.ok) return setCheck({ ok: false, reason: r.body.error, matches: r.body.matches ?? [] });
    onDone(`Added ${name.trim()}. It is in the watched band and can be researched; ${((r.body.replan as { reresolved?: number })?.reresolved ?? 0)} people were placed there.`);
    router.refresh();
  }
  const refused = check && check.ok === false;
  const input = 'min-h-[36px] w-full rounded-md border border-[var(--border)] bg-transparent px-2 text-sm';
  return (
    <div className="space-y-2 rounded-md border border-[var(--border)] p-2" data-testid="candidate-add-form">
      <label className="block text-xs">
        Account name
        <input className={input} value={name} onChange={(e) => { setName(e.target.value); setCheck(null); }} />
      </label>
      <label className="block text-xs">
        Vertical
        <input className={input} placeholder="cpg, food, retail, chemicals..." value={vertical} onChange={(e) => setVertical(e.target.value)} />
      </label>
      <label className="block text-xs">
        Domain (optional)
        <input className={input} value={domain} onChange={(e) => { setDomain(e.target.value); setCheck(null); }} />
      </label>
      <label className="block text-xs">
        Why add it
        <textarea className={`${input} min-h-[60px] py-1`} value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      {check ? (
        <div className="text-xs" data-testid="candidate-check">
          {refused ? (
            <p className="text-amber-700 dark:text-amber-400">
              {REFUSAL[String(check.reason)] ?? `Refused: ${String(check.reason)}`} {((check.matches as string[]) ?? []).join(', ')}
              {(check.matches as string[] | undefined)?.length ? ' Map to it instead.' : ''}
            </p>
          ) : (
            <p>Clear: no account, alias or domain match. {((check.notes as string[]) ?? []).join(' ')}</p>
          )}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {!check || refused ? (
          <button type="button" disabled={busy || !name.trim()} onClick={() => void runCheck()} className="min-h-[36px] rounded-md border border-[var(--border)] px-2 text-xs hover:bg-[var(--muted)] disabled:opacity-60" data-testid="candidate-check-button">
            {busy ? 'Checking...' : 'Check for duplicates'}
          </button>
        ) : (
          <button type="button" disabled={busy || !vertical.trim() || !reason.trim()} onClick={() => void add()} className="min-h-[36px] rounded-md bg-[var(--primary)] px-3 text-xs font-medium text-[var(--primary-foreground)] disabled:opacity-60" data-testid="candidate-add-confirm">
            {busy ? 'Adding...' : `Add ${name.trim()} to GAP`}
          </button>
        )}
      </div>
    </div>
  );
}

function MapForm({ c, onDone }: { c: QueueItem; onDone: (msg: string) => void }) {
  const router = useRouter();
  const [account, setAccount] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    const q = account.trim();
    if (q.length < 2 || options.includes(q)) return;
    const t = setTimeout(() => {
      fetch(`/api/gap/capture/lookup?q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : { accounts: [] }))
        .then((b: { accounts?: string[] }) => setOptions(b.accounts ?? []))
        .catch(() => setOptions([]));
    }, 250);
    return () => clearTimeout(t);
  }, [account, options]);
  async function map() {
    setBusy(true);
    const r = await post({ op: 'map', company: c.company, accountName: account.trim() });
    setBusy(false);
    if (!r.ok) return setErr(r.body.error === 'account_not_found' ? 'GAP has no account by that name.' : String(r.body.error ?? r.status).startsWith('alias_conflict:') ? `That name already means ${String(r.body.error).split(':')[1]}.` : `Not saved: ${String(r.body.error ?? r.status)}`);
    onDone(`Mapped to ${account.trim()}. ${((r.body.replan as { reresolved?: number })?.reresolved ?? 0)} people were placed there.`);
    router.refresh();
  }
  const listId = `map-${c.companyKey.replace(/[^a-z0-9]/g, '')}`;
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="candidate-map-form">
      <input aria-label={`Which account is ${c.company}`} list={listId} className="min-h-[36px] w-full rounded-md border border-[var(--border)] bg-transparent px-2 text-sm sm:w-64" placeholder="This is which GAP account?" value={account} onChange={(e) => setAccount(e.target.value)} />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
      <button type="button" disabled={busy || account.trim().length < 2} onClick={() => void map()} className="min-h-[36px] rounded-md border border-[var(--border)] px-2 text-xs hover:bg-[var(--muted)] disabled:opacity-60">
        {busy ? 'Saving...' : 'Same company'}
      </button>
      {err ? <p className="w-full text-xs text-amber-700 dark:text-amber-400">{err}</p> : null}
    </div>
  );
}

function Candidate({ c }: { c: QueueItem }) {
  const router = useRouter();
  const [mode, setMode] = useState<'none' | 'add' | 'map'>('none');
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  async function act(op: 'scout' | 'research_more' | 'ignore') {
    setBusy(op);
    const r = await post({ op, company: c.company, ...(op === 'scout' && c.titles.length ? { hint: `people there: ${c.titles.join(', ')}` } : {}) });
    setBusy(null);
    if (!r.ok) return setMsg(`Not saved: ${String(r.body.error ?? r.status)}`);
    setMsg(op === 'scout' ? `Scouted: ${VERDICT_LABEL[String(r.body.verdict)] ?? r.body.verdict}.` : op === 'ignore' ? 'Ignored.' : 'Marked for more research.');
    router.refresh();
  }
  const btn = 'min-h-[36px] rounded-md border border-[var(--border)] px-2 text-xs hover:bg-[var(--muted)] disabled:opacity-60';
  return (
    <li className="space-y-2 border-b border-[var(--border)] py-3 text-sm" data-testid="candidate" data-verdict={c.verdict ?? 'unscouted'}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{c.company}</span>
        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${c.verdict ? VERDICT_TONE[c.verdict] : 'border-[var(--border)] text-[var(--muted-foreground)]'}`} data-testid="candidate-verdict">
          {c.verdict ? VERDICT_LABEL[c.verdict] : 'Not scouted'}
          {c.verdict && !c.scouted ? ' (name only)' : ''}
        </span>
        {c.decision === 'research_more' ? <span className="text-xs text-[var(--muted-foreground)]">research more</span> : null}
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">
        {c.people} {c.people === 1 ? 'person' : 'people'}
        {c.titles.length ? ` · ${c.titles.join(' / ')}` : ''}
      </p>
      {c.why ? (
        <p className="text-xs">
          <span className="font-semibold">Why ICP: </span>
          {c.why}
          {c.what ? ` ${c.what}` : ''}
          {c.domain ? ` (${c.domain})` : ''}
        </p>
      ) : null}
      <Claims label="Network evidence" items={c.network} />
      <Claims label="Freight evidence" items={c.freight} />
      <p className="text-xs">
        <span className="font-semibold">Relationship source: </span>
        {[...c.sources, ...c.relationship].join('; ') || 'None'} <span className="text-[var(--muted-foreground)]">(context, never evidence or consent)</span>
      </p>
      {c.unknowns.length ? (
        <p className="text-xs">
          <span className="font-semibold">What we don&apos;t know: </span>
          {c.unknowns.slice(0, 4).join('; ')}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} disabled={!!busy} onClick={() => void act('scout')} data-testid="candidate-scout">
          {busy === 'scout' ? 'Scouting...' : c.scouted ? 'Scout again' : 'Scout'}
        </button>
        <button type="button" className={btn} onClick={() => setMode(mode === 'add' ? 'none' : 'add')} data-testid="candidate-add">
          Add account
        </button>
        <button type="button" className={btn} onClick={() => setMode(mode === 'map' ? 'none' : 'map')} data-testid="candidate-map">
          Map to existing
        </button>
        <button type="button" className={btn} disabled={!!busy} onClick={() => void act('research_more')}>
          Research more
        </button>
        <button type="button" className={btn} disabled={!!busy} onClick={() => void act('ignore')} data-testid="candidate-ignore">
          Ignore
        </button>
      </div>
      {mode === 'add' ? <AddForm c={c} onDone={(m) => { setMsg(m); setMode('none'); }} /> : null}
      {mode === 'map' ? <MapForm c={c} onDone={(m) => { setMsg(m); setMode('none'); }} /> : null}
      {msg ? <p className="text-xs" data-testid="candidate-result">{msg}</p> : null}
    </li>
  );
}

export function CandidateQueue({ items, title, collapsed = false }: { items: QueueItem[]; title: string; collapsed?: boolean }) {
  if (!items.length) return null;
  const body = (
    <>
      <p className="text-xs text-[var(--muted-foreground)]">Scout is one cheap web pass; its verdict comes from cited evidence, never a guess. Nothing becomes an account until you add it, and adding checks for duplicates first.</p>
      <ul data-testid="candidate-list">
        {items.map((c) => (
          <Candidate key={c.companyKey} c={c} />
        ))}
      </ul>
    </>
  );
  if (!collapsed) {
    return (
      <section className="space-y-1" data-testid="candidate-queue">
        <h2 className="text-sm font-semibold">{title}</h2>
        {body}
      </section>
    );
  }
  // Collapsed on a source page: on a phone a long list would bury everything below it.
  return (
    <details className="space-y-1 rounded-md border border-[var(--border)] p-3" data-testid="candidate-queue">
      <summary className="cursor-pointer text-sm font-semibold">{title}</summary>
      {body}
    </details>
  );
}
