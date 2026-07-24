'use client';

import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

/**
 * On-page booking close for the /demo microsites. Mirrors the Flow-State- /for
 * `#book` close so the demo Book CTAs land on a live conversation panel instead
 * of dead-ending at /contact. Under yardflow.ai the /demo subtree is same-origin
 * with the /api/for/* booking endpoints, so this offers Casey's real open times
 * as chips and books the exact slot. On any origin without those endpoints it
 * degrades to the hosted scheduler CTA plus an email and phone fallback. Renders
 * a section with id="book" that every Book anchor on the page scrolls to.
 */

const DEFAULT_SCHEDULER =
  process.env.NEXT_PUBLIC_HUBSPOT_MEETING_URL || 'https://meetings.hubspot.com/casey416';
const CONTACT_EMAIL = 'casey@freightroll.com';
const PHONE_DISPLAY = '410-236-7434';
const PHONE_HREF = 'tel:+14102367434';

type Chip = { ms: number; label: string; date: string };

export function ForBookingPanel({
  slug,
  schedulerHref,
}: {
  slug: string;
  /** External scheduler override (e.g. a configured HubSpot meetings slug URL). */
  schedulerHref?: string;
}) {
  const scheduler = schedulerHref || DEFAULT_SCHEDULER;
  const [slots, setSlots] = useState<number[] | null>(null);
  const [sel, setSel] = useState<Chip | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'booking' | 'booked' | 'error'>('idle');

  useEffect(() => {
    let alive = true;
    fetch('/api/for/booking-slots')
      .then((r) => (r.ok ? r.json() : { slots: [] }))
      .then((d) => {
        if (alive) setSlots(Array.isArray(d.slots) ? d.slots : []);
      })
      .catch(() => {
        if (alive) setSlots([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Up to 3 chips: a morning plus an afternoon across the next open days.
  const chips: Chip[] = [];
  if (slots) {
    const days: string[] = [];
    const byDay = new Map<string, number[]>();
    for (const ms of slots) {
      const key = new Date(ms).toDateString();
      if (!byDay.has(key)) {
        byDay.set(key, []);
        days.push(key);
      }
      byDay.get(key)!.push(ms);
    }
    const toChip = (ms: number): Chip => {
      const dt = new Date(ms);
      return {
        ms,
        label: dt.toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        date: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`,
      };
    };
    for (const key of days) {
      if (chips.length >= 3) break;
      const ds = byDay.get(key)!;
      const picks = [ds[0]];
      const pm = ds.find((ms) => new Date(ms).getHours() >= 13);
      if (pm && pm !== ds[0]) picks.push(pm);
      for (const ms of picks) {
        if (chips.length >= 3) break;
        chips.push(toChip(ms));
      }
    }
  }

  async function submitBooking(firstName: string, lastName: string, addr: string) {
    if (!sel || !firstName || !addr) return;
    setStatus('booking');
    trackEvent('booking_submit', { slug, surface: 'demo', slot: sel.label });
    try {
      const r = await fetch('/api/for/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email: addr, startTime: sel.ms, slug }),
      });
      const d = await r.json().catch(() => ({ ok: false }));
      if (d.ok) {
        setStatus('booked');
        trackEvent('booking_success_view', { slug, surface: 'demo', slot: sel.label });
      } else {
        setStatus('error');
        trackEvent('booking_failed', { slug, surface: 'demo', slot: sel.label });
      }
    } catch {
      setStatus('error');
    }
  }

  function bookForm(e: React.FormEvent) {
    e.preventDefault();
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const firstName = parts.slice(0, -1).join(' ') || parts[0] || '';
    const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0] || '';
    submitBooking(firstName, lastName, email.trim());
  }

  const inputCls =
    'w-full rounded-[10px] border border-white/15 bg-white/[0.03] px-4 py-3 text-[15px] text-white placeholder:text-white/40 focus:border-[#00B4FF]/60 focus:outline-none';

  return (
    <section
      id="book"
      data-ms-section-id="book"
      className="scroll-mt-20 border-t border-[#00B4FF]/[0.16] bg-[#070809] px-5 py-12"
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00B4FF]/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00B4FF]" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#00B4FF]/80">
            The only step left
          </span>
        </div>
        <h2 className="mt-4 text-2xl font-bold leading-tight text-white sm:text-[28px]">
          We are not asking for a pilot. We are asking for a conversation.
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/70">
          A 30-minute call, direct with Casey. We show you what we found across your yards, you tell
          us straight where it fits and where it does not. If the call goes well, we talk pilot. If
          not, you keep the analysis.
        </p>

        {status === 'booked' ? (
          <div className="mt-7 rounded-[14px] border border-[#00B4FF]/30 bg-[#00B4FF]/[0.06] p-6">
            <p className="text-lg font-bold text-white">You&rsquo;re booked for {sel?.label}.</p>
            <p className="mt-2 text-[15px] leading-relaxed text-white/70">
              A Google Meet invite is on its way to <span className="text-white">{email}</span>. Talk
              soon. Casey
            </p>
          </div>
        ) : chips.length > 0 ? (
          <div className="mt-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#00B4FF]/70">
              A few times that work, your local time
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {chips.map((c) => {
                const on = sel?.ms === c.ms;
                return (
                  <button
                    key={c.ms}
                    type="button"
                    onClick={() => {
                      setSel(c);
                      setStatus('idle');
                      trackEvent('booking_slot_pick', { slug, surface: 'demo', slot: c.label });
                    }}
                    className={`rounded-[10px] border px-4 py-3 text-center text-[13px] font-semibold transition-colors ${
                      on
                        ? 'border-[#00B4FF] bg-[#00B4FF]/15 text-white'
                        : 'border-white/12 bg-white/[0.03] text-white/90 hover:border-[#00B4FF]/50 hover:bg-[#00B4FF]/[0.08] hover:text-white'
                    }`}
                  >
                    <span className="whitespace-nowrap">{c.label}</span>
                  </button>
                );
              })}
            </div>
            {sel && (
              <form
                onSubmit={bookForm}
                className="mt-4 rounded-[14px] border border-white/10 bg-white/[0.02] p-4 sm:p-5"
              >
                <p className="text-[13px] text-white/70">
                  Booking <span className="font-semibold text-white">{sel.label}</span>. Two lines
                  and you&rsquo;re on Casey&rsquo;s calendar.
                </p>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  <input
                    className={inputCls}
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                  <input
                    className={inputCls}
                    type="email"
                    placeholder="Work email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="mt-3.5 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={status === 'booking'}
                    className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#00B4FF] px-6 py-3 text-sm font-bold text-[#050505] transition-all hover:shadow-[0_0_22px_rgba(0,180,255,0.45)] disabled:opacity-60"
                  >
                    {status === 'booking' ? 'Booking...' : `Book ${sel.label}`}
                  </button>
                  {status === 'error' && (
                    <span className="text-[13px] text-white/80">
                      That slot just slipped.{' '}
                      <a
                        href={`${scheduler}?date=${sel.date}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#00B4FF] underline underline-offset-2"
                      >
                        Pick another
                      </a>{' '}
                      or email me below.
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="mt-7">
            <a
              href={scheduler}
              target="_blank"
              rel="noopener noreferrer"
              data-ms-cta-id="demo-book-panel"
              onClick={() =>
                trackEvent('booking_link_click', { slug, surface: 'demo', location: 'demo-book-panel' })
              }
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[10px] bg-[#00B4FF] px-7 py-3.5 text-base font-bold text-[#050505] transition-all hover:shadow-[0_0_28px_rgba(0,180,255,0.5)]"
            >
              Pick a time with Casey &rarr;
            </a>
          </div>
        )}

        <div className="mt-7 border-t border-white/10 pt-4 text-[13px] leading-relaxed text-white/70">
          <p>
            None of these times work? Email me at{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              onClick={() => trackEvent('booking_email_click', { slug, surface: 'demo' })}
              className="font-semibold text-[#00B4FF]/90 underline underline-offset-2 hover:text-[#00B4FF]"
            >
              {CONTACT_EMAIL}
            </a>{' '}
            or call or text me at{' '}
            <a
              href={PHONE_HREF}
              onClick={() => trackEvent('booking_phone_click', { slug, surface: 'demo' })}
              className="whitespace-nowrap font-semibold text-[#00B4FF]/90 underline underline-offset-2 hover:text-[#00B4FF]"
            >
              {PHONE_DISPLAY}
            </a>
            , and we&rsquo;ll find one.
          </p>
          <p className="mt-1.5 text-white/50">
            Casey Larkin, YardFlow. Jake, our founder, joins when it helps.
          </p>
        </div>
      </div>
    </section>
  );
}