'use client';

/**
 * ADD TO GAP: the one front door (Universal Work Intake, 2026-09-28).
 *
 * Casey thinks "I've got something GAP should work"; he does not pick an
 * adapter. Every choice lands in the same system:
 *   a link or story    the existing Share to GAP flow (Signal Intelligence)
 *   a person           one person into the CURRENT source (conference mode)
 *   people / accounts  paste or a CSV into a named source: preview, then add
 *   a conversation     the existing Buyer Truth Capture
 * Nothing here researches, drafts or sends by itself; research happens later,
 * account by account, and every outreach decision stays Casey's.
 * Voice: no em dashes.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface IntakeSourceOption {
  id: string;
  name: string;
  sourceType: string;
  relationshipContext: string | null;
  members: number;
  current: boolean;
}

type Mode = 'person' | 'people' | 'accounts';
type PreviewRow = { name?: string; title?: string; company?: string; companyDomain?: string; email?: string; resolution: string; accountName: string | null };
type Preview = { counts: Record<string, number>; parse: { format: string; unmappedColumns: string[]; skipped: { blank: number; duplicate: number } }; rows: PreviewRow[] };

const SOURCE_TYPE_LABEL: Record<string, string> = {
  newsletter: 'Newsletter / content subscribers',
  conference: 'Conference (attendees, speakers, exhibitors, people I met)',
  crm_list: 'CRM list or export',
  referral: 'Referrals / introductions',
  relationship: 'People I know',
  target_list: 'Target account or people list',
  content: 'Webinar / content engagement',
  inbound: 'Inbound requests',
  other: 'Other',
};
const INTENT_LABEL: Record<string, string> = {
  research: 'Research and understand',
  find_people: 'Find people to talk to',
  prepare_outreach: 'Prepare outreach (still never sends by itself)',
  follow_up: 'Follow up',
  watch: 'Watch',
};
const RESOLUTION_COPY: Record<string, string> = {
  resolved: 'Known in GAP',
  new_candidate: 'Known account, new person (staged)',
  ambiguous: 'Ambiguous: you decide',
  unresolved: 'Needs identity',
};

const btn = 'min-h-[44px] rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--muted)] disabled:opacity-60';
const primary = `${btn} bg-[var(--primary)] font-medium text-[var(--primary-foreground)]`;
const input = 'w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-base sm:text-sm';

async function post(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { ok: res.ok, status: res.status, data: ((await res.json().catch(() => ({}))) ?? {}) as Record<string, unknown> };
}

function PersonForm({ current }: { current: IntakeSourceOption | null }) {
  const router = useRouter();
  const [f, setF] = useState({ name: '', company: '', title: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ text: string; buyerWords: boolean } | { error: string } | null>(null);
  async function save() {
    setBusy(true);
    setResult(null);
    const r = await post('/api/gap/people', { name: f.name, company: f.company || null, title: f.title || null, note: f.note || null });
    setBusy(false);
    if (!r.ok) return setResult({ error: String(r.data.error ?? `HTTP ${r.status}`) });
    const where = r.data.accountName ? ` at ${r.data.accountName}` : '';
    const what = r.data.resolution === 'resolved' ? `Matched someone GAP already knows${where}.` : r.data.resolution === 'new_candidate' ? `New person${where}, staged for your review.` : r.data.resolution === 'ambiguous' ? 'More than one match: GAP will not guess, review it in Sources.' : 'GAP does not know that company yet: saved, identity to confirm.';
    setResult({ text: `Saved to ${current?.name ?? 'People I met'}. ${what} Nothing is sent.`, buyerWords: !!r.data.buyerWords });
    setF({ name: '', company: '', title: '', note: '' });
    router.refresh();
  }
  return (
    <section data-testid="intake-person" className="space-y-3 rounded-md border border-[var(--border)] p-4">
      <p className="text-sm text-[var(--muted-foreground)]">
        Adding to <span className="font-medium text-[var(--foreground)]">{current?.name ?? 'People I met'}</span>
        {current?.relationshipContext ? ` (${current.relationshipContext})` : ''}.
      </p>
      <input aria-label="Name" data-testid="intake-person-name" className={input} placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input aria-label="Company" data-testid="intake-person-company" className={input} placeholder="Company" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
      <input aria-label="Title" className={input} placeholder="Title (optional)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <textarea aria-label="Note" data-testid="intake-person-note" className={`${input} min-h-[4.5rem]`} maxLength={1000} placeholder="What you want to remember (optional, your words)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
      <button type="button" data-testid="intake-person-save" className={`${primary} w-full sm:w-auto`} disabled={busy || !f.name.trim()} onClick={() => void save()}>
        {busy ? 'Saving...' : 'Add person'}
      </button>
      {result && 'error' in result ? <p role="alert" className="text-sm text-[var(--destructive)]">Not saved: {result.error}</p> : null}
      {result && 'text' in result ? (
        <div data-testid="intake-person-result" className="space-y-1 text-sm">
          <p>{result.text}</p>
          {result.buyerWords ? (
            <p className="text-xs" data-testid="intake-person-buyer-words">
              That note sounds like their own words. If it came from a real conversation, <Link href="/gap/capture" className="underline">capture it as buyer truth</Link> so you can confirm it.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ListImport({ kind, sources }: { kind: 'people' | 'accounts'; sources: IntakeSourceOption[] }) {
  const router = useRouter();
  const [sourceId, setSourceId] = useState(sources[0]?.id ?? 'new');
  const [draft, setDraft] = useState({ name: '', sourceType: kind === 'accounts' ? 'target_list' : 'other', relationshipContext: '', notes: '', intent: 'research' });
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; href?: string } | null>(null);

  async function ensureSource(): Promise<string | null> {
    if (sourceId !== 'new') return sourceId;
    const r = await post('/api/gap/sources', { name: draft.name, sourceType: draft.sourceType, relationshipContext: draft.relationshipContext || null, notes: draft.notes || null, intent: draft.intent });
    if (!r.ok) {
      setMsg({ ok: false, text: `Source not created: ${r.data.error ?? r.data.field ?? r.status}` });
      return null;
    }
    setSourceId(String(r.data.id));
    return String(r.data.id);
  }
  async function run(op: 'preview' | 'commit') {
    setBusy(true);
    setMsg(null);
    const id = await ensureSource();
    if (!id) return setBusy(false);
    const r = await post(`/api/gap/sources/${encodeURIComponent(id)}`, { op, kind, text });
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: `Not ${op === 'preview' ? 'previewed' : 'added'}: ${r.data.error ?? r.status}` });
    if (op === 'preview') return setPreview(r.data as Preview);
    setMsg({ ok: true, text: `Added ${r.data.created} new, ${r.data.existing} already in this source, ${r.data.staged} new people staged. Nothing is sent; GAP researches accounts, not rows.`, href: `/gap/sources/${id}` });
    setPreview(null);
    setText('');
    router.refresh();
  }
  async function readFile(file: File | undefined) {
    if (!file) return;
    setText(await file.text());
    setPreview(null);
  }
  const needsName = sourceId === 'new' && !draft.name.trim();
  return (
    <section data-testid={`intake-${kind}`} className="space-y-3 rounded-md border border-[var(--border)] p-4">
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Where did {kind === 'people' ? 'these people' : 'these accounts'} come from?</span>
        <select data-testid="intake-source" className={input} value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.members})
            </option>
          ))}
          <option value="new">New source...</option>
        </select>
      </label>
      {sourceId === 'new' ? (
        <div className="space-y-2 rounded-md bg-[var(--muted)] p-3">
          <input aria-label="Source name" data-testid="intake-source-name" className={input} placeholder={kind === 'people' ? 'e.g. MMYQB LinkedIn subscribers' : 'e.g. 2026 Top 100 shippers'} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <select aria-label="Source type" data-testid="intake-source-type" className={input} value={draft.sourceType} onChange={(e) => setDraft({ ...draft, sourceType: e.target.value })}>
            {Object.entries(SOURCE_TYPE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <input aria-label="How you know them" className={input} placeholder="How you know them (e.g. MMYQB subscriber). Context for you, never sent." value={draft.relationshipContext} onChange={(e) => setDraft({ ...draft, relationshipContext: e.target.value })} />
          <input aria-label="Why you added these" className={input} placeholder="Why you are adding these (optional)" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          <select aria-label="What you want" className={input} value={draft.intent} onChange={(e) => setDraft({ ...draft, intent: e.target.value })}>
            {Object.entries(INTENT_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <textarea
        aria-label="Paste"
        data-testid="intake-text"
        className={`${input} min-h-[9rem] font-mono text-xs`}
        placeholder={kind === 'people' ? 'Paste a table (with a header row), one person per line (Name, Title, Company), or a copied LinkedIn list.' : 'Paste one company per line, or a table with a Company column.'}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setPreview(null);
        }}
      />
      <label className="block text-xs text-[var(--muted-foreground)]">
        Or a CSV file: <input type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" data-testid="intake-file" onChange={(e) => void readFile(e.target.files?.[0])} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" data-testid="intake-preview" className={btn} disabled={busy || !text.trim() || needsName} onClick={() => void run('preview')}>
          {busy ? 'Working...' : 'Preview'}
        </button>
        <button type="button" data-testid="intake-commit" className={primary} disabled={busy || !preview || needsName} onClick={() => void run('commit')}>
          Add {preview ? preview.counts.rows : ''} to GAP
        </button>
      </div>
      {preview ? (
        <div data-testid="intake-preview-result" className="space-y-2 text-sm">
          <p className="font-medium">
            {preview.counts.rows} {kind === 'people' ? 'people' : 'accounts'} read ({preview.parse.format}): {preview.counts.resolved} known in GAP, {preview.counts.new_candidate} new at a known account, {preview.counts.ambiguous} ambiguous, {preview.counts.unresolved} need identity.
          </p>
          {preview.parse.unmappedColumns.length ? <p className="text-xs text-[var(--muted-foreground)]">Kept as supplied, not interpreted: {preview.parse.unmappedColumns.join(', ')}.</p> : null}
          <ul className="max-h-80 space-y-1 overflow-y-auto text-xs">
            {preview.rows.slice(0, 200).map((r, i) => (
              <li key={i} className="flex flex-wrap justify-between gap-x-2 border-b border-[var(--border)] py-1">
                <span className="min-w-0 break-words">
                  {kind === 'people' ? <span className="font-medium">{r.name ?? r.email ?? '(no name)'}</span> : null}
                  {kind === 'people' && (r.title || r.company) ? ' · ' : ''}
                  {[r.title, r.company ?? r.companyDomain].filter(Boolean).join(' · ')}
                </span>
                <span className="text-[var(--muted-foreground)]">
                  {RESOLUTION_COPY[r.resolution] ?? r.resolution}
                  {r.accountName ? `: ${r.accountName}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {msg ? (
        <p role={msg.ok ? undefined : 'alert'} data-testid="intake-result" className={`text-sm ${msg.ok ? '' : 'text-[var(--destructive)]'}`}>
          {msg.text} {msg.href ? <Link href={msg.href} className="underline">See what GAP did with it</Link> : null}
        </p>
      ) : null}
    </section>
  );
}

/** Conference mode in one step: name a conference (or any source), it becomes the current source for quick adds. */
function StartSource() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', sourceType: 'conference', relationshipContext: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function start() {
    setBusy(true);
    setError(null);
    const r = await post('/api/gap/sources', { name: f.name, sourceType: f.sourceType, relationshipContext: f.relationshipContext || null, intent: 'find_people' });
    if (!r.ok) {
      setBusy(false);
      return setError(String(r.data.error ?? r.data.field ?? r.status));
    }
    await post(`/api/gap/sources/${encodeURIComponent(String(r.data.id))}`, { op: 'current' });
    setBusy(false);
    setOpen(false);
    setF({ name: '', sourceType: 'conference', relationshipContext: '' });
    router.refresh();
  }
  if (!open) {
    return (
      <button type="button" data-testid="intake-start-source" className={`${btn} w-full sm:w-auto`} onClick={() => setOpen(true)}>
        Start a conference or new source
      </button>
    );
  }
  return (
    <div className="space-y-2 rounded-md bg-[var(--muted)] p-3" data-testid="intake-start-source-form">
      <input aria-label="Conference or source name" data-testid="intake-start-name" className={input} placeholder="e.g. Inland26 · Chicago" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <select aria-label="Source type" className={input} value={f.sourceType} onChange={(e) => setF({ ...f, sourceType: e.target.value })}>
        {Object.entries(SOURCE_TYPE_LABEL).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <input aria-label="How you know them" data-testid="intake-start-context" className={input} placeholder="How you know them (e.g. Met at Inland26)" value={f.relationshipContext} onChange={(e) => setF({ ...f, relationshipContext: e.target.value })} />
      <div className="flex flex-wrap gap-2">
        <button type="button" data-testid="intake-start-save" className={primary} disabled={busy || !f.name.trim()} onClick={() => void start()}>
          {busy ? 'Starting...' : 'Start and make current'}
        </button>
        <button type="button" className={btn} onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {error ? <p role="alert" className="text-sm text-[var(--destructive)]">Not started: {error}</p> : null}
    </div>
  );
}

export function WorkIntake({ sources, initialMode }: { sources: IntakeSourceOption[]; initialMode?: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode ?? 'person');
  const current = sources.find((s) => s.current) ?? null;
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  /** '' = back to People I met (no current source). */
  async function makeCurrent(id: string) {
    setSwitching(true);
    setSwitchError(null);
    const r = id ? await post(`/api/gap/sources/${encodeURIComponent(id)}`, { op: 'current' }) : await post(`/api/gap/sources/${encodeURIComponent(current?.id ?? 'none')}`, { op: 'clear_current' });
    setSwitching(false);
    if (!r.ok) return setSwitchError(String(r.data.error ?? r.status));
    router.refresh();
  }
  const choice = (m: Mode, label: string) => (
    <button type="button" data-testid={`intake-choice-${m}`} aria-pressed={mode === m} className={`${btn} ${mode === m ? 'border-[var(--primary)] font-medium text-[var(--primary)]' : ''}`} onClick={() => setMode(m)}>
      {label}
    </button>
  );
  return (
    <div className="space-y-4" data-testid="work-intake">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Link href="/gap/signals/new" data-testid="intake-choice-signal" className={`${btn} text-center`}>
          A link or story
        </Link>
        {choice('person', 'A person')}
        {choice('people', 'A list of people')}
        {choice('accounts', 'A list of accounts')}
        <Link href="/gap/capture" data-testid="intake-choice-conversation" className={`${btn} text-center`}>
          A conversation
        </Link>
      </div>
      {mode === 'person' ? (
        <>
          {sources.length ? (
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Current source</span>
              <select data-testid="intake-current" className={input} disabled={switching} value={current?.id ?? ''} onChange={(e) => void makeCurrent(e.target.value)}>
                <option value="">People I met (default)</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {switchError ? <span role="alert" className="text-xs text-[var(--destructive)]">Not switched: {switchError}</span> : null}
            </label>
          ) : null}
          <StartSource />
          <PersonForm current={current} />
        </>
      ) : (
        <ListImport key={mode} kind={mode} sources={sources} />
      )}
      <p className="text-xs text-[var(--muted-foreground)]">
        How you know someone is your context. It is never evidence, never consent, and never sent unless you choose to mention it. GAP researches each account once, then brings back only what is worth your judgment.
      </p>
    </div>
  );
}
