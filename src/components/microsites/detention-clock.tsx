'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

const FONT_MONO = 'font-[family-name:var(--font-memo-mono)]';
const FONT_SANS = 'font-[family-name:var(--font-memo-sans)]';

interface DetentionClockProps {
  /** Dollars-per-second from computeDetentionPerSecond(facilityCount). */
  perSecond: number;
  /** Optional account accent override; falls back to inheriting --memo-accent. */
  accentColor?: string;
}

/**
 * Documentary "while you read" chip that shows modeled detention dollars
 * accruing across the account's network. Atmosphere, not pressure — the
 * chip carries `aria-hidden="true"` so screen-reader users skip it (the
 * memo's prose, comparable section, and footnotes already convey the
 * cost story accessibly).
 *
 * Hydration-safe: server renders $0.00 (the same initial state the client
 * begins from). Only the timer is client-only.
 *
 * Lives in the layout, not the page, so navigating between the index
 * memo and child routes (e.g. /for/[account]/[person]) keeps the
 * accrued total continuous.
 */
export function DetentionClock({ perSecond, accentColor }: DetentionClockProps) {
  const mountTimeRef = useRef<number | null>(null);
  const [accrued, setAccrued] = useState(0);

  useEffect(() => {
    mountTimeRef.current = Date.now();
    const tick = () => {
      const start = mountTimeRef.current;
      if (start === null) return;
      const elapsedMs = Date.now() - start;
      setAccrued((elapsedMs / 1000) * perSecond);
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [perSecond]);

  const wrapperStyle: CSSProperties = accentColor
    ? ({ ['--memo-accent']: accentColor } as CSSProperties)
    : {};

  return (
    <div
      data-detention-clock
      aria-hidden="true"
      style={wrapperStyle}
      className={[
        'fixed bottom-6 right-6 z-50 flex items-start gap-2.5',
        'rounded-sm bg-[#fffdf7] px-3 py-2.5',
        'border border-[#d8d2c2] border-l-2',
        'border-l-[color:var(--memo-accent)]',
        'shadow-[0_2px_12px_rgba(40,30,20,0.06)]',
        'sm:px-3.5 sm:py-3',
      ].join(' ')}
    >
      <span
        data-detention-clock-dot
        aria-hidden="true"
        className="mt-1.5 inline-block size-[6px] flex-shrink-0 rounded-full detention-clock-pulse"
        style={{ background: 'var(--memo-accent)' }}
      />
      <div className="flex flex-col leading-tight">
        <span
          className={[
            FONT_MONO,
            'text-[15px] font-medium tabular-nums leading-tight text-[#1a1a1a]',
            'sm:text-[16px]',
          ].join(' ')}
        >
          {formatAccrued(accrued)}
        </span>
        <span
          className={[
            FONT_SANS,
            'mt-0.5 max-w-[12rem] text-[11px] leading-snug text-[#8a847b]',
            'hidden sm:block',
          ].join(' ')}
        >
          modeled detention accrued while reading
        </span>
        <span
          className={[
            FONT_MONO,
            'mt-1 text-[9.5px] uppercase tracking-[0.16em] text-[#a89e8b]',
            'hidden sm:block',
          ].join(' ')}
        >
          rate · ATA 2024 yard ops
        </span>
      </div>
      <DetentionClockStyles />
    </div>
  );
}

/**
 * Inline keyframes for the dot pulse. Honors `prefers-reduced-motion` so
 * users with that preference get a static dot. Scoped via the named class
 * so the rule doesn't leak into the rest of the app.
 */
function DetentionClockStyles() {
  return (
    <style>{`
      @keyframes detention-clock-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.35; }
      }
      .detention-clock-pulse {
        animation: detention-clock-pulse 1.6s ease-in-out infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .detention-clock-pulse { animation: none; }
      }
    `}</style>
  );
}

function formatAccrued(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
