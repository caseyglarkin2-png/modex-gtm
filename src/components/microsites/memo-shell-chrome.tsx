'use client';

import { useEffect, useRef, useState } from 'react';

interface MemoRunningHeaderProps {
  title: string;
  subtitle: string;
}

const FONT_MONO = 'font-[family-name:var(--font-memo-mono)]';

/**
 * Document running header that fades in once the reader scrolls past the
 * cover spread. Watched element is `[data-memo-cover]`. Hidden state is
 * pointer-events-none + opacity 0 so it never intercepts clicks while
 * the cover is on-screen.
 */
export function MemoRunningHeader({ title, subtitle }: MemoRunningHeaderProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const cover = document.querySelector('[data-memo-cover]');
    if (!cover) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => setShow(!e.isIntersecting));
      },
      { threshold: 0.05 },
    );
    io.observe(cover);
    return () => io.disconnect();
  }, []);

  return (
    <header
      aria-hidden={!show}
      className={[
        'fixed inset-x-0 top-0 z-50 flex items-center justify-between overflow-hidden',
        'border-b border-[#e8e2d4] bg-[#f5f1e8]/90 px-6 py-2.5 backdrop-blur-md',
        'transition-opacity duration-300',
        show ? 'opacity-100' : 'pointer-events-none opacity-0',
        FONT_MONO,
        'text-[11.5px] uppercase tracking-[0.18em] text-[#4a4641]',
      ].join(' ')}
    >
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="size-[5px] rounded-full"
          style={{ background: 'var(--memo-accent)' }}
        />
        <span className="block max-w-[calc(100vw-9rem)] truncate sm:max-w-none">{title}</span>
      </div>
      <div className="hidden text-[#8a847b] sm:block">{subtitle}</div>
    </header>
  );
}

interface TocEntry {
  id: string;
  num: string;
  label: string;
}

interface MemoContentsRailProps {
  entries: TocEntry[];
}

/**
 * Sticky left-rail table of contents (desktop ≥1024px only). Scrollspy via
 * IntersectionObserver — section is "active" when its top crosses 30% of
 * the viewport. Active link gets the brand accent + a 2px hairline marker.
 */
export function MemoContentsRail({ entries }: MemoContentsRailProps) {
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (entries.length === 0) return;
    const sections = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const io = new IntersectionObserver(
      (intersecting) => {
        intersecting.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <nav
      ref={ref}
      aria-label="Memo contents"
      className="hidden lg:block lg:sticky lg:top-16 lg:self-start lg:pt-2"
    >
      <p
        className={`mb-5 border-b border-[#d8d2c2] pb-2.5 text-[11px] uppercase tracking-[0.22em] text-[#8a847b] ${FONT_MONO}`}
      >
        Contents
      </p>
      <ol className="space-y-3.5 text-[13.5px] leading-snug xl:text-[14px]">
        {entries.map((e) => {
          const active = e.id === activeId;
          return (
            <li key={e.id} className="relative">
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute -left-4 top-[0.3em] block h-[1em] w-[2px]"
                  style={{ background: 'var(--memo-accent)' }}
                />
              ) : null}
              <a
                href={`#${e.id}`}
                className={[
                  'grid grid-cols-[1.6rem_1fr] gap-2 transition-colors',
                  active ? 'text-[color:var(--memo-accent)]' : 'text-[#4a4641] hover:text-[#1a1a1a]',
                ].join(' ')}
              >
                <span
                  className={[
                    `pt-[1px] text-[11px] tracking-[0.1em] ${FONT_MONO}`,
                    active ? 'text-[color:var(--memo-accent)]' : 'text-[#8a847b]',
                  ].join(' ')}
                >
                  {e.num}
                </span>
                <span className="font-[family-name:var(--font-memo-sans)]">
                  {e.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
