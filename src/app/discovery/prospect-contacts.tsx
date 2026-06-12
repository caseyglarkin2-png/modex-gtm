'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ListPlus, Loader2, Mail, Plus, Linkedin, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmailComposer } from '@/components/email/composer';
import { buildOutreach } from '@/lib/discovery/outreach';
import { assignCommitteeAngles } from '@/lib/discovery/angles';
import type { RankedRow } from '@/lib/discovery/scoring';
import type { ProspectContact } from '@/lib/discovery/contacts';
import { findProspectContacts, inferContactEmail, researchProspectContacts, saveProspectContact, type ProspectContactsResult } from './actions';
import { addToQueue } from './queue-actions';

/** Maps dedup reason codes from addToQueue to rep-friendly text. */
const QUEUE_REASON_LABEL: Record<string, string> = {
  unsubscribed: 'Unsubscribed',
  already_emailed: 'Already emailed',
  already_queued: 'Already queued',
  unauthenticated: 'Sign in to queue',
};

const SOURCE_LABEL: Record<ProspectContact['source'], string> = {
  records: 'Our records',
  hubspot: 'HubSpot',
  added: 'Added',
  research: 'AI · verify',
  saved: 'Saved',
};

/** Reliable LinkedIn people-search for a researched name (model URLs can be wrong). */
function linkedinHref(c: ProspectContact, company: string): string | undefined {
  if (c.source === 'research') {
    return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${c.name} ${company}`)}`;
  }
  return c.linkedinUrl;
}

function nameKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z]+/g, ' ').trim();
}

/** Prospect-scoped saved-state key, so an in-flight save resolving after the
 *  drawer moved to another prospect can never mark a same-named contact there. */
function savedKey(prospectName: string, contactName: string): string {
  return `${prospectName}::${nameKey(contactName)}`;
}

const CONFIDENCE_STYLE: Record<string, { label: string; className: string }> = {
  known: { label: 'verified', className: 'text-emerald-600 border-emerald-600/30' },
  high: { label: 'high', className: 'text-emerald-600 border-emerald-600/30' },
  medium: { label: 'inferred', className: 'text-amber-600 border-amber-600/40' },
  low: { label: 'low conf.', className: 'text-orange-600 border-orange-600/40' },
  none: { label: 'no email', className: 'text-neutral-500 border-neutral-500/30' },
};

export function ProspectContactsPanel({ prospect }: { prospect: RankedRow }) {
  const [data, setData] = useState<ProspectContactsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<ProspectContact[]>([]);
  const [researched, setResearched] = useState<ProspectContact[]>([]);
  const [researching, setResearching] = useState(false);
  const [researchDone, setResearchDone] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', title: '', linkedinUrl: '' });
  const [adding, setAdding] = useState(false);
  const [composeFor, setComposeFor] = useState<ProspectContact | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [queuingKey, setQueuingKey] = useState<string | null>(null);
  const [queuedKeys, setQueuedKeys] = useState<Set<string>>(new Set());
  const [queuingAll, setQueuingAll] = useState(false);
  // savedKey(prospect, name) -> save round-trip result, for the per-row "Saved" state.
  const [savedByKey, setSavedByKey] = useState<Map<string, { hubspotUrl?: string }>>(new Map());
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  // The prospect the drawer currently shows; gates stale save toasts.
  const activeProspectRef = useRef(prospect.name);
  const savingAllRef = useRef(false);

  useEffect(() => {
    activeProspectRef.current = prospect.name;
    let cancelled = false;
    setData(null);
    setAdded([]);
    setResearched([]);
    setResearchDone(false);
    setSavedByKey(new Map());
    setLoading(true);
    findProspectContacts({ company: prospect.name, accountSlug: prospect.existingAccountSlug })
      .then((d) => { if (!cancelled) setData(d); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [prospect.placeId, prospect.name, prospect.existingAccountSlug]);

  // Merge sources, preferring our real-email record over an inferred duplicate.
  const contacts = useMemo(() => {
    const known = new Map((data?.contacts ?? []).map((c) => [nameKey(c.name), c]));
    const out: ProspectContact[] = [];
    const seen = new Set<string>();
    for (const c of [...added, ...researched, ...(data?.contacts ?? [])]) {
      const k = nameKey(c.name);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push(known.get(k) ?? c);
    }
    return out;
  }, [added, researched, data]);

  async function handleResearch() {
    setResearching(true);
    try {
      const [city, state] = (prospect.cityState ?? '').split(',').map((s) => s.trim());
      const found = await researchProspectContacts({
        company: prospect.name,
        accountSlug: prospect.existingAccountSlug,
        city,
        state,
        corridor: prospect.corridor,
      });
      setResearched(found);
      setResearchDone(true);
    } finally {
      setResearching(false);
    }
  }

  /** Persist a panel contact as a durable DiscoveryContact (+ guarded HubSpot upsert). */
  async function persistContact(c: ProspectContact): Promise<boolean> {
    // Capture the prospect at call time: the result must land under (and toast
    // for) the prospect the save was issued from, not whatever is open later.
    const forProspect = prospect.name;
    const res = await saveProspectContact({
      prospectName: forProspect,
      name: c.name,
      title: c.title,
      email: c.email ?? undefined,
      linkedinUrl: c.linkedinUrl,
      source: c.source === 'added' ? 'added' : 'research',
      confidence: c.confidence,
    });
    if (res.ok) {
      setSavedByKey((prev) => new Map(prev).set(savedKey(forProspect, c.name), { hubspotUrl: res.hubspotUrl }));
      return true;
    }
    if (activeProspectRef.current === forProspect) {
      toast.error(res.reason === 'unauthenticated' ? 'Sign in to save' : 'Save failed');
    }
    return false;
  }

  async function handleSave(c: ProspectContact) {
    const key = savedKey(prospect.name, c.name);
    setSavingKey(key);
    try {
      await persistContact(c);
    } finally {
      setSavingKey(null);
    }
  }

  async function handleSaveAll() {
    // Ref guard: a double-click in the same tick beats the disabled re-render.
    if (savingAllRef.current) return;
    savingAllRef.current = true;
    setSavingAll(true);
    try {
      let saved = 0;
      for (const c of researched) {
        if (savedByKey.has(savedKey(prospect.name, c.name))) continue;
        if (await persistContact(c)) saved += 1;
      }
      if (saved > 0) toast.success(`${saved} saved`);
    } finally {
      savingAllRef.current = false;
      setSavingAll(false);
    }
  }

  async function handleAdd() {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    setAdding(true);
    try {
      const inf = await inferContactEmail({
        firstName: form.firstName,
        lastName: form.lastName,
        company: prospect.name,
        accountSlug: prospect.existingAccountSlug,
      });
      const contact: ProspectContact = {
        name: `${form.firstName} ${form.lastName}`.trim(),
        firstName: form.firstName,
        lastName: form.lastName,
        title: form.title || undefined,
        email: inf.email,
        confidence: inf.confidence,
        emailBasis: inf.basis,
        source: 'added',
        linkedinUrl: form.linkedinUrl || undefined,
      };
      setAdded((prev) => [contact, ...prev]);
      setForm({ firstName: '', lastName: '', title: '', linkedinUrl: '' });
      // The user already acted; persist without an extra confirm. Fire-and-forget
      // so the form frees up immediately; the row flips to Saved when it lands.
      void persistContact(contact);
    } finally {
      setAdding(false);
    }
  }

  function handleEmail(contact: ProspectContact) {
    setComposeFor(contact);
    setComposerOpen(true);
  }

  async function handleQueue(contact: ProspectContact, key: string) {
    if (!contact.email) return;
    setQueuingKey(key);
    try {
      const o = buildOutreach(prospect, contact.firstName, contact.title);
      const res = await addToQueue({
        toEmail: contact.email,
        accountName: prospect.name,
        personaName: contact.name,
        subject: o.subject,
        body: o.body,
        imageUrl: o.imageUrl,
        source: 'casey',
      });
      if (res.ok) {
        setQueuedKeys((prev) => new Set(prev).add(key));
        toast.success('Queued');
      } else {
        toast.error(QUEUE_REASON_LABEL[res.reason] ?? res.reason);
      }
    } finally {
      setQueuingKey(null);
    }
  }

  async function handleQueueAll() {
    setQueuingAll(true);
    try {
      let queued = 0;
      let skipped = 0;
      // Give each committee member a distinct angle so the thread isn't N copies
      // of one template. Single-contact Queue and the composer keep the default.
      const angleKeys = assignCommitteeAngles(prospect, contacts.length);
      for (let i = 0; i < contacts.length; i++) {
        const c = contacts[i];
        const key = `${c.name}-${i}`;
        if (!c.email || queuedKeys.has(key)) continue;
        const o = buildOutreach(prospect, c.firstName, c.title, angleKeys[i]);
        const res = await addToQueue({
          toEmail: c.email,
          accountName: prospect.name,
          personaName: c.name,
          subject: o.subject,
          body: o.body,
          imageUrl: o.imageUrl,
          source: 'casey',
        });
        if (res.ok) {
          queued += 1;
          setQueuedKeys((prev) => new Set(prev).add(key));
        } else {
          skipped += 1;
        }
      }
      toast.success(`${queued} queued with varied angles${skipped > 0 ? `, ${skipped} skipped` : ''}`);
    } finally {
      setQueuingAll(false);
    }
  }

  const emailContactCount = contacts.filter((c) => c.email).length;

  const outreach = composeFor ? buildOutreach(prospect, composeFor.firstName, composeFor.title) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          Contacts
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
        </p>
        {emailContactCount >= 2 && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            onClick={handleQueueAll}
            disabled={queuingAll}
          >
            {queuingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <ListPlus className="h-3 w-3" />}
            Queue all
          </Button>
        )}
      </div>

      {/* Email pattern provenance */}
      {data && (
        <p className="text-[11px] text-[var(--muted-foreground)]">
          {data.domain
            ? data.pattern
              ? <>Email pattern: <span className="font-mono">{data.pattern}@{data.domain}</span> · {data.patternBasis}</>
              : <>Domain <span className="font-mono">{data.domain}</span> · {data.patternBasis}</>
            : 'No company domain known — add a known email to infer addresses.'}
        </p>
      )}

      {/* Contact list */}
      {contacts.length > 0 ? (
        <ul className="space-y-1.5">
          {contacts.map((c, i) => {
            const conf = CONFIDENCE_STYLE[c.confidence] ?? CONFIDENCE_STYLE.none;
            const saveKey = savedKey(prospect.name, c.name);
            const savedInfo =
              savedByKey.get(saveKey) ?? (c.source === 'saved' ? { hubspotUrl: c.hubspotUrl } : undefined);
            const savable = (c.source === 'research' || c.source === 'added') && !savedInfo;
            return (
              <li key={`${c.name}-${i}`} className="flex items-start justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{c.name}</span>
                    {linkedinHref(c, prospect.name) && (
                      <a href={linkedinHref(c, prospect.name)} target="_blank" rel="noopener noreferrer" aria-label="Find on LinkedIn">
                        <Linkedin className="h-3 w-3 text-[var(--muted-foreground)] hover:text-[var(--primary)]" />
                      </a>
                    )}
                    {c.scope && (
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${c.scope === 'local' ? 'text-blue-600 border-blue-600/40' : 'text-[var(--muted-foreground)] border-[var(--border)]'}`}
                      >
                        {c.scope === 'local' ? 'Local' : 'Corporate'}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${c.source === 'research' ? 'text-violet-600 border-violet-600/40' : 'text-[var(--muted-foreground)] border-[var(--border)]'}`}
                    >
                      {SOURCE_LABEL[c.source]}
                    </Badge>
                  </div>
                  {c.title && <div className="truncate text-xs text-[var(--muted-foreground)]">{c.title}</div>}
                  {c.reason && <div className="truncate text-[10px] italic text-[var(--muted-foreground)]" title={c.reason}>{c.reason}</div>}
                  {c.email ? (
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-mono text-[11px] text-[var(--muted-foreground)]" title={c.emailBasis}>{c.email}</span>
                      {c.confidence !== 'known' && (
                        <Badge variant="outline" className={`text-[9px] ${conf.className}`} title={c.emailBasis}>{conf.label}</Badge>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-[var(--muted-foreground)]">{c.emailBasis ?? 'no email'}</div>
                  )}
                </div>
                {(c.email || savable || savedInfo) && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    {savedInfo ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                        <Check className="h-3 w-3" /> Saved
                        {savedInfo.hubspotUrl && (
                          <a
                            href={savedInfo.hubspotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-emerald-700"
                          >
                            HubSpot
                          </a>
                        )}
                      </span>
                    ) : savable ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs"
                        onClick={() => handleSave(c)}
                        disabled={savingKey === saveKey || savingAll}
                      >
                        {savingKey === saveKey ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Save
                      </Button>
                    ) : null}
                    {c.email && (
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => handleEmail(c)}>
                        <Mail className="h-3 w-3" /> Email
                      </Button>
                    )}
                    {c.email && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs"
                        onClick={() => handleQueue(c, `${c.name}-${i}`)}
                        disabled={queuingKey === `${c.name}-${i}` || queuedKeys.has(`${c.name}-${i}`)}
                      >
                        {queuingKey === `${c.name}-${i}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <ListPlus className="h-3 w-3" />}
                        {queuedKeys.has(`${c.name}-${i}`) ? 'Queued' : 'Queue'}
                      </Button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : !loading ? (
        <p className="text-xs text-[var(--muted-foreground)]">No contacts in our records yet — add one below.</p>
      ) : null}

      {/* AI web research — propose decision-makers to verify */}
      {!researchDone ? (
        <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" onClick={handleResearch} disabled={researching}>
          {researching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {researching ? 'Researching decision-makers…' : 'Find contacts (AI web research)'}
        </Button>
      ) : researched.length === 0 ? (
        <p className="text-[11px] text-[var(--muted-foreground)]">No contacts found via research — add one manually below.</p>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-violet-600">{researched.length} AI-proposed contacts added — verify on LinkedIn before sending.</p>
          {researched.some((c) => !savedByKey.has(savedKey(prospect.name, c.name))) && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 shrink-0 gap-1 text-xs"
              onClick={handleSaveAll}
              disabled={savingAll || savingKey !== null}
            >
              {savingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save all
            </Button>
          )}
        </div>
      )}

      {/* Add contact */}
      <div className="space-y-1.5 rounded-md border border-dashed border-[var(--border)] p-2">
        <p className="flex items-center gap-1 text-[11px] font-medium text-[var(--muted-foreground)]">
          <Plus className="h-3 w-3" /> Add a contact (from LinkedIn) — we infer the email
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <Input className="h-7 text-xs" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <Input className="h-7 text-xs" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </div>
        <Input className="h-7 text-xs" placeholder="Title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input className="h-7 text-xs" placeholder="LinkedIn URL (optional)" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} />
        <Button size="sm" variant="outline" className="h-7 w-full gap-1 text-xs" onClick={handleAdd} disabled={adding || !form.firstName.trim() || !form.lastName.trim()}>
          {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          {adding ? 'Inferring email…' : 'Add + infer email'}
        </Button>
      </div>

      {/* Composer, prefilled with the angle; recipient/subject/body editable */}
      {composeFor && outreach && (
        <EmailComposer
          accountName={prospect.name}
          personaName={composeFor.name}
          personaEmail={composeFor.email ?? undefined}
          initialSubject={outreach.subject}
          initialBody={outreach.body}
          initialImageUrl={outreach.imageUrl}
          open={composerOpen}
          onOpenChange={(o) => { setComposerOpen(o); if (!o) setComposeFor(null); }}
        />
      )}
    </div>
  );
}
