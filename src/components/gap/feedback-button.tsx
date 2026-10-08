'use client';
/**
 * NOTE: the one-tap dogfood note on every GAP screen (stabilization E). One field (what did you notice?); the type
 * is optional and never required. Safe context is captured automatically from the URL and the device: route, lane,
 * object ids, viewport, and the error code a REPORT THIS button passes. Never page text, cookies or headers.
 *
 * A note is durable dogfood memory only: it never changes seller state, code or anything outside GAP.
 *
 * R63-B S5: the panel is a modal dialog for the keyboard: Escape closes it from anywhere inside (the textarea too),
 * Tab and Shift+Tab stay inside it, and focus returns to whatever opened it. Closing never discards what was typed:
 * the note is kept, said in the panel, until it is saved.
 *
 * R63-A S12: it is feedback about the app, not a note on an account, so it is called Feedback everywhere; and it sits
 * in the page flow after the content at every width (floating bottom right it covered the email body at 1280 px).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const TYPES: Array<[string, string]> = [
  ['bug', 'Bug'],
  ['friction', 'Friction'],
  ['data', 'Data'],
  ['research', 'Research'],
  ['copy', 'Copy'],
  ['idea', 'Idea'],
  ['keep', 'Worked well'],
  ['other', 'Other'],
];

export interface ReportDetail {
  errorCode?: string;
  surface?: string;
  accountName?: string;
  personId?: string;
  hypothesisId?: string;
  cardId?: string;
  signalId?: string;
  sourceUrl?: string;
}

/** Open the note form prefilled with safe context (an error code and object ids), from anywhere in GAP. */
export function openFeedback(detail: ReportDetail = {}) {
  window.dispatchEvent(new CustomEvent<ReportDetail>('gap:feedback', { detail }));
}

/** REPORT THIS: a small link beside an error or refusal; it opens the note with the error code and the objects. */
export function ReportThis(detail: ReportDetail) {
  return (
    <button type="button" onClick={() => openFeedback(detail)} className="ml-1 text-xs underline decoration-dotted" data-testid="report-this">
      Report this
    </button>
  );
}

/** What the URL itself says about where Casey is (ids only; never page text). */
export function contextFromLocation(pathname: string, search: URLSearchParams): Record<string, string> {
  const parts = pathname.split('/').filter(Boolean);
  // A query value that could carry a secret never leaves the browser (the server strips again).
  const q = new URLSearchParams([...search.entries()].filter(([k]) => !/token|code|key|secret|session|auth|password|cookie|sig/i.test(k)));
  const c: Record<string, string> = { route: `${pathname}${q.toString() ? `?${q.toString()}` : ''}`, surface: parts[1] ?? 'cockpit' };
  if (search.get('lane')) c.lane = search.get('lane')!;
  if (search.get('open')) c.cardId = search.get('open')!;
  if (parts[1] === 'accounts' && parts[2]) c.accountSlug = parts[2];
  if (parts[1] === 'hypotheses' && parts[2]) c.hypothesisId = parts[2];
  if (parts[1] === 'call' && parts[2]) c.personId = parts[2];
  if (parts[1] === 'preview' && parts[2]) c.hypothesisId = parts[2];
  return c;
}

export function FeedbackButton() {
  const pathname = usePathname() ?? '/gap';
  const search = useSearchParams();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [extra, setExtra] = useState<ReportDetail>({});
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorText, setErrorText] = useState('');
  const area = useRef<HTMLTextAreaElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  // R63-B S5: what had focus when the panel opened; focus goes back there when it closes.
  const opener = useRef<HTMLElement | null>(null);
  const remember = () => {
    if (!opener.current) opener.current = typeof document !== 'undefined' && document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
  };
  const close = useCallback(() => {
    setOpen(false);
    const back = opener.current;
    opener.current = null;
    if (back && back.isConnected) back.focus();
  }, []);
  /** Escape closes from anywhere in the panel; Tab and Shift+Tab wrap inside it. */
  const onPanelKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== 'Tab' || !panel.current) return;
    const stops = [...panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')];
    if (stops.length === 0) return;
    const first = stops[0];
    const last = stops[stops.length - 1];
    const at = document.activeElement;
    if (e.shiftKey && (at === first || !panel.current.contains(at))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (at === last || !panel.current.contains(at))) {
      e.preventDefault();
      first.focus();
    }
  };

  useEffect(() => {
    const on = (e: Event) => {
      remember();
      setExtra((e as CustomEvent<ReportDetail>).detail ?? {});
      setState('idle');
      setOpen(true);
    };
    window.addEventListener('gap:feedback', on);
    return () => window.removeEventListener('gap:feedback', on);
  }, []);
  useEffect(() => {
    if (open) area.current?.focus();
  }, [open]);

  const save = useCallback(async () => {
    if (!note.trim()) return;
    setState('saving');
    const w = window.innerWidth;
    const context = { ...contextFromLocation(pathname, new URLSearchParams(search?.toString() ?? '')), ...extra, viewport: { w, h: window.innerHeight }, device: w < 640 ? 'phone' : w < 1024 ? 'tablet' : 'desktop' };
    try {
      const res = await fetch('/api/gap/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note, type, context }) });
      if (!res.ok) throw new Error(res.status === 401 ? 'signed_out' : res.status === 404 ? 'off' : String(res.status));
      setState('saved');
      setNote('');
      setType(null);
      setExtra({});
      setTimeout(() => close(), 900);
    } catch (e) {
      setErrorText(e instanceof Error && e.message === 'signed_out' ? 'Signed out. Sign in in another tab, then Save again (your feedback is kept).' : e instanceof Error && e.message === 'off' ? 'Feedback is off on this deployment.' : 'Not saved. Try again (your feedback is kept).');
      setState('error');
    }
  }, [note, type, extra, pathname, search, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          remember();
          setExtra({});
          setState('idle');
          setOpen(true);
        }}
        // UX-04: on the GAP account workspace the pill is hidden (it covered Log a touch and Call prep at 390); the
        // workspace's own tools row carries a Note control that opens this same dialog (openFeedback).
        // R63-B S14 / R63-A S12: a fixed pill covered the text under it (HISTORY at phone width, the email body at
        // 1280 px), so it sits in the page flow after the content at every width and covers nothing.
        className={`mx-4 mb-6 mt-8 inline-flex min-h-11 items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-3 text-xs font-semibold hover:bg-[var(--muted)] sm:min-h-9 ${/^\/gap\/accounts\//.test(pathname) ? 'hidden' : ''}`}
        data-testid="feedback-open"
        aria-label="Send feedback about GAP"
      >
        Feedback
      </button>
      {open ? (
        <div ref={panel} onKeyDown={onPanelKey} className="fixed inset-x-0 bottom-0 z-[60] border-t border-[var(--border)] bg-[var(--background)] p-3 shadow-lg sm:inset-x-auto sm:bottom-16 sm:right-4 sm:w-96 sm:rounded-md sm:border" role="dialog" aria-modal="true" aria-label="Feedback about GAP" data-testid="feedback-form">
          <label className="block text-sm font-semibold" htmlFor="gap-feedback-note">
            What did you notice?
          </label>
          {extra.errorCode ? <p className="text-xs text-[var(--muted-foreground)]" data-testid="feedback-error-code">About: {extra.errorCode}</p> : null}
          <textarea id="gap-feedback-note" ref={area} value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={4000} className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent p-2 text-sm" data-testid="feedback-note" />
          <div className="mt-1 flex flex-wrap gap-1" aria-label="Type (optional)">
            {TYPES.map(([v, label]) => (
              <button key={v} type="button" onClick={() => setType(type === v ? null : v)} className={`rounded border px-2 py-0.5 text-[11px] ${type === v ? 'border-[var(--primary)] font-semibold' : 'border-[var(--border)]'}`} aria-pressed={type === v}>
                {label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" onClick={() => void save()} disabled={!note.trim() || state === 'saving'} className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] disabled:opacity-50" data-testid="feedback-save">
              {state === 'saving' ? 'Saving' : 'Save feedback'}
            </button>
            <button type="button" onClick={close} className="text-xs underline" data-testid="feedback-close">
              Close
            </button>
            <span role="status" className="text-xs" data-testid="feedback-status">
              {state === 'saved' ? 'Saved to GAP feedback.' : state === 'error' ? errorText : ''}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Saves your words with this screen&apos;s location and build. Nothing about the account or buyer changes.{note.trim() ? ' Closing keeps your feedback here until you save it.' : ''}</p>
        </div>
      ) : null}
    </>
  );
}
