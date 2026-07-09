'use client';

/**
 * Sprint G7, IndustryFlickBar.
 *
 * Floating bottom-right bar on /demo/[slug] that lets a rep flick
 * between the 11 industry templates without backing out to the
 * gallery. Reads `INDUSTRY_ANCHORS` from `industry-tags.ts` so the
 * order matches the gallery's render order.
 *
 * Behavior:
 *   - Center label: `03/11 · CPG · Food`
 *   - Prev/Next links wrap at first/last (cyclic)
 *   - Preserves ?from=gallery + &demo=1 on every link
 *   - Keyboard shortcuts: `[` = prev, `]` = next (industry-standard
 *     back/forward shortcut; same pattern as Vim/RStudio)
 *   - `prefetch={false}` on Next Link so a single microsite view
 *     does not warm 2 deep routes per load (G7.T2b)
 *   - aria-live="polite" region announces the slug change to AT
 *   - Visual hide on scroll-down past 200px, re-show on scroll-up
 *     of ≥ 8px. `aria-hidden` is NOT toggled, the bar stays
 *     keyboard-focusable + the [ ] shortcuts stay live (G7.T9)
 *   - Respects safe-area-inset-bottom, sits ABOVE any existing
 *     sticky CTA via z-index ordering
 *   - Demo Mode contract: analytics events SUPPRESSED under ?demo=1
 *     per the events spec; the bar still renders + the shortcuts
 *     still work (the rep uses the same UX in a meeting)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { INDUSTRY_ANCHORS } from '@/lib/demo/industry-tags';

interface Props {
  currentSlug: string;
}

function readDemoSuffix(): string {
  if (typeof window === 'undefined') return '';
  try {
    const v = new URLSearchParams(window.location.search).get('demo');
    if (!v) return '';
    return ['1', 'true', 'yes'].includes(v.trim().toLowerCase()) ? '&demo=1' : '';
  } catch {
    return '';
  }
}

function isDemoActive(): boolean {
  return readDemoSuffix().length > 0;
}

function trackFlick(direction: 'prev' | 'next', toSlug: string): void {
  // G.T2, haptic pulse on supported devices (mobile). iframe-safe and
  // no-throw in restricted contexts. Fires regardless of demo mode so a
  // rep gets the same tactile feedback in a meeting; no-op on desktop.
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
  } catch {
    // vibrate unavailable / blocked, ignore.
  }
  if (isDemoActive()) return; // analytics events spec, suppressed under demo
  try {
    window.dispatchEvent(
      new CustomEvent('yf:event', {
        detail: {
          name: direction === 'prev' ? 'microsite_flick_prev' : 'microsite_flick_next',
          props: { to: toSlug },
        },
      }),
    );
  } catch {
    // swallow
  }
}

export default function IndustryFlickBar({ currentSlug }: Props) {
  const total = INDUSTRY_ANCHORS.length;
  const currentIndex = useMemo(
    () => INDUSTRY_ANCHORS.findIndex((a) => a.slug === currentSlug),
    [currentSlug],
  );

  // If the slug is unknown (e.g., a non-anchor pack), hide entirely.
  const isVisible = currentIndex >= 0;
  const prev = isVisible ? INDUSTRY_ANCHORS[(currentIndex - 1 + total) % total] : null;
  const next = isVisible ? INDUSTRY_ANCHORS[(currentIndex + 1) % total] : null;
  const current = isVisible ? INDUSTRY_ANCHORS[currentIndex] : null;

  const [collapsed, setCollapsed] = useState(false);
  const [demoSuffix, setDemoSuffix] = useState('');
  const [showHint, setShowHint] = useState(false);
  const lastScrollYRef = useRef(0);
  const announceRef = useRef<HTMLDivElement | null>(null);

  // Read demo suffix once after mount.
  useEffect(() => {
    setDemoSuffix(readDemoSuffix());
  }, []);

  // E.T1, first-visit discovery hint. Shows a chip above the bar for
  // 5 seconds on the first microsite view in this browser profile, then
  // sets a localStorage flag so it never reappears. Dismisses early on
  // any key press or click.
  useEffect(() => {
    if (!isVisible) return undefined;
    try {
      if (window.localStorage.getItem('yf-flickbar-hint-seen')) return undefined;
    } catch {
      return undefined; // storage blocked, skip the hint entirely.
    }
    setShowHint(true);
    let done = false;
    const dismiss = () => {
      if (done) return;
      done = true;
      setShowHint(false);
      try {
        window.localStorage.setItem('yf-flickbar-hint-seen', '1');
      } catch {
        // ignore
      }
      window.removeEventListener('keydown', dismiss);
      window.removeEventListener('click', dismiss);
      window.clearTimeout(timer);
    };
    const timer = window.setTimeout(dismiss, 5000);
    window.addEventListener('keydown', dismiss);
    window.addEventListener('click', dismiss);
    return () => {
      window.removeEventListener('keydown', dismiss);
      window.removeEventListener('click', dismiss);
      window.clearTimeout(timer);
    };
  }, [isVisible]);

  // Direction-aware scroll hide.
  useEffect(() => {
    if (!isVisible) return undefined;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastScrollYRef.current;
      if (Math.abs(dy) >= 8) {
        if (y > 200 && dy > 0) setCollapsed(true);
        else if (dy < 0) setCollapsed(false);
        lastScrollYRef.current = y;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isVisible]);

  const navigate = useCallback(
    (direction: 'prev' | 'next') => {
      const target = direction === 'prev' ? prev : next;
      if (!target) return;
      trackFlick(direction, target.slug);
      if (announceRef.current) {
        const counter = `${String((direction === 'prev' ? currentIndex - 1 + total : currentIndex + 1) % total + 1).padStart(2, '0')}/${String(total).padStart(2, '0')}`;
        announceRef.current.textContent = `Industry ${target.label}, ${counter}`;
      }
      // Preserve ?from=gallery query if currently set.
      const fromGallery = (() => {
        try {
          return new URLSearchParams(window.location.search).get('from') === 'gallery'
            ? '?from=gallery'
            : '?from=gallery';
        } catch {
          return '?from=gallery';
        }
      })();
      window.location.href = `/demo/${target.slug}${fromGallery}${demoSuffix}`;
    },
    [prev, next, currentIndex, total, demoSuffix],
  );

  // Keyboard shortcuts.
  useEffect(() => {
    if (!isVisible) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.target && (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.key === '[') {
        e.preventDefault();
        navigate('prev');
      } else if (e.key === ']') {
        e.preventDefault();
        navigate('next');
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isVisible, navigate]);

  if (!isVisible || !current || !prev || !next) return null;

  const counter = `${String(currentIndex + 1).padStart(2, '0')}/${String(total).padStart(2, '0')}`;
  const prevHref = `/demo/${prev.slug}?from=gallery${demoSuffix}`;
  const nextHref = `/demo/${next.slug}?from=gallery${demoSuffix}`;

  return (
    <>
      {/* aria-live region, announces slug changes to AT. */}
      <div
        ref={announceRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* E.T1, first-visit discovery hint, sits just above the bar.
          Keyboard-only affordance: hidden below md (a "press [ or ]" hint is
          meaningless on touch, and it overlapped the lede on phones —
          2026-07-09 panel). */}
      {showHint && !collapsed ? (
        <div
          data-flick-hint=""
          role="status"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)',
            right: 'calc(env(safe-area-inset-right, 0px) + 14px)',
          }}
          className="motion-safe:animate-slide-up fixed z-[56] hidden max-w-[260px] rounded-[10px] border border-[#00B4FF]/[0.32] bg-[#050505]/90 px-3 py-2 font-mono text-[10.5px] font-medium tracking-[0.04em] text-white/85 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md md:block"
        >
          Flick between industries: press <span className="text-[#00B4FF]">[</span> or{' '}
          <span className="text-[#00B4FF]">]</span>
        </div>
      ) : null}

      <nav
        data-flick-bar=""
        aria-label="Industry template navigation"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
          right: 'calc(env(safe-area-inset-right, 0px) + 14px)',
          transform: collapsed ? 'translateY(120%)' : 'translateY(0)',
          opacity: collapsed ? 0 : 1,
          pointerEvents: collapsed ? 'none' : 'auto',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="fixed z-[55] inline-flex items-center gap-3 rounded-full border border-[#00B4FF]/[0.32] bg-[#050505]/85 px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md max-[480px]:!bottom-[calc(env(safe-area-inset-bottom,0px)+86px)]"
      >
        <Link
          href={prevHref}
          prefetch={false}
          onClick={() => trackFlick('prev', prev.slug)}
          data-ms-cta-id="microsite-flick-prev"
          aria-label={`Previous industry: ${prev.label}`}
          className="flex items-center gap-1.5 rounded-full px-2 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/75 transition-colors hover:bg-[#00B4FF]/[0.08] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00B4FF] max-[480px]:hidden"
        >
          <span aria-hidden>←</span>
          <span>{prev.label}</span>
        </Link>
        {/* Mobile: compact prev arrow only. */}
        <Link
          href={prevHref}
          prefetch={false}
          onClick={() => trackFlick('prev', prev.slug)}
          aria-label={`Previous industry: ${prev.label}`}
          className="hidden h-9 w-9 items-center justify-center rounded-full text-white/75 transition-colors hover:bg-[#00B4FF]/[0.08] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[2px] focus-visible:outline-[#00B4FF] max-[480px]:inline-flex"
        >
          <span aria-hidden className="text-lg leading-none">←</span>
        </Link>

        <span className="flex items-baseline gap-2 px-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/85 max-[480px]:gap-1">
          <span className="tabular-nums text-[#00B4FF]">{counter}</span>
          <span className="text-white/40">·</span>
          <span className="truncate max-w-[140px] max-[480px]:max-w-[80px]">{current.label}</span>
        </span>

        <Link
          href={nextHref}
          prefetch={false}
          onClick={() => trackFlick('next', next.slug)}
          data-ms-cta-id="microsite-flick-next"
          aria-label={`Next industry: ${next.label}`}
          className="flex items-center gap-1.5 rounded-full px-2 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/75 transition-colors hover:bg-[#00B4FF]/[0.08] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00B4FF] max-[480px]:hidden"
        >
          <span>{next.label}</span>
          <span aria-hidden>→</span>
        </Link>
        <Link
          href={nextHref}
          prefetch={false}
          onClick={() => trackFlick('next', next.slug)}
          aria-label={`Next industry: ${next.label}`}
          className="hidden h-9 w-9 items-center justify-center rounded-full text-white/75 transition-colors hover:bg-[#00B4FF]/[0.08] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[2px] focus-visible:outline-[#00B4FF] max-[480px]:inline-flex"
        >
          <span aria-hidden className="text-lg leading-none">→</span>
        </Link>
      </nav>
    </>
  );
}
