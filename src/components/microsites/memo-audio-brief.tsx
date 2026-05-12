'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';

const FONT_SERIF = 'font-[family-name:var(--font-memo-serif)]';
const FONT_SANS = 'font-[family-name:var(--font-memo-sans)]';
const FONT_MONO = 'font-[family-name:var(--font-memo-mono)]';

export interface AudioChapter {
  /** Stable id used for the active-chapter state and section anchoring. */
  id: string;
  /** Display label, e.g. "What 237 facilities taught". */
  label: string;
  /** Start time in seconds. The first chapter must start at 0. */
  start: number;
}

interface MemoAudioBriefProps {
  /** Public path to the mp3 (e.g. "/audio/yard-network-brief.mp3"). */
  src: string;
  /** Chapter table — rendered as the click-to-seek list. */
  chapters: AudioChapter[];
  /** Eyebrow label. Default: "Audio register". */
  eyebrow?: string;
  /** Heading shown in Fraunces. */
  heading?: string;
  /** One- or two-sentence intro. Default supplied — can be overridden per account. */
  intro?: ReactNode;
  /** Accent color override; falls back to inheriting `--memo-accent` from MemoShell. */
  accentColor?: string;
  /** Section id for anchor + tracking. Default "audio". */
  sectionId?: string;
  /** Optional total-length hint shown next to "Run time" before audio metadata loads. */
  expectedDuration?: string;
}

/**
 * "Audio register" — a parallel section (like the personalized preamble) that
 * sits below the §-numbered registers but above the soft-action close.
 *
 * The shape mirrors the rest of the memo: eyebrow, Fraunces heading, a brief
 * editorial intro, then the working surface — in this case, an inline tape
 * player with a hairline scrub strip and a Roman-numeraled chapter list. The
 * controls are styled as part of the document, not pasted-on web chrome:
 * a single accent-bordered play disk, a 2px-tall progress hairline that
 * matches the document rules, and time/chapter labels typeset in JetBrains
 * Mono with tabular numerals.
 *
 * Tracking surfaces:
 *   data-ms-section-id="audio"     — counted as a viewed section by the
 *                                    intersection-observer in
 *                                    use-microsite-tracker.tsx.
 *   data-ms-cta-id="audio-play"    — first play click counted as a CTA.
 *   data-ms-cta-id="audio-chapter" — chapter seek counted as a CTA (the
 *                                    chapter id rides on data-chapter-id).
 *
 * Hydration safety: every dynamic readout (currentTime, duration, playing
 * state, active chapter) is initialized to deterministic defaults that match
 * what the server renders. Audio metadata is loaded after mount via
 * `loadedmetadata`; until then, the run-time slot shows `expectedDuration`
 * (or em-dashes) so layout doesn't shift.
 *
 * Mobile: play button is 44×44; chapter rows have ≥44px tap height.
 */
export function MemoAudioBrief({
  src,
  chapters,
  eyebrow = 'Audio register',
  heading = "Listen, if you'd rather",
  intro,
  accentColor,
  sectionId = 'audio',
  expectedDuration,
}: MemoAudioBriefProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubFraction, setScrubFraction] = useState<number | null>(null);
  const playStripId = useId();

  const accentStyle = accentColor ? ({ ['--memo-accent']: accentColor } as React.CSSProperties) : undefined;

  // Wire up audio element listeners after mount.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    const onLoaded = () => setDuration(a.duration);
    const onTime = () => setCurrentTime(a.currentTime);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    a.addEventListener('loadedmetadata', onLoaded);
    a.addEventListener('timeupdate', onTime);
    if (a.readyState >= 1) onLoaded();
    return () => {
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('loadedmetadata', onLoaded);
      a.removeEventListener('timeupdate', onTime);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      void a.play();
    } else {
      a.pause();
    }
  }, []);

  const seekTo = useCallback((t: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(t, a.duration || t));
    setCurrentTime(a.currentTime);
  }, []);

  // Pointer-driven scrubbing on the tape strip.
  const fractionFromEvent = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const strip = stripRef.current;
    if (!strip) return 0;
    const rect = strip.getBoundingClientRect();
    const x = e.clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  }, []);

  const onStripPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const f = fractionFromEvent(e);
      setScrubFraction(f);
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [fractionFromEvent],
  );
  const onStripPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (scrubFraction === null) return;
      setScrubFraction(fractionFromEvent(e));
    },
    [scrubFraction, fractionFromEvent],
  );
  const onStripPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (scrubFraction === null) return;
      const f = fractionFromEvent(e);
      setScrubFraction(null);
      const total = duration || audioRef.current?.duration || 0;
      if (total > 0) seekTo(f * total);
    },
    [scrubFraction, duration, fractionFromEvent, seekTo],
  );

  // Active chapter: the last chapter whose start <= currentTime.
  const activeChapterIdx = chapters.reduce(
    (acc, ch, i) => (ch.start <= currentTime ? i : acc),
    0,
  );

  const playProgress =
    scrubFraction !== null
      ? scrubFraction
      : duration > 0
        ? Math.min(1, currentTime / duration)
        : 0;

  return (
    <section
      id={sectionId}
      data-ms-section-id={sectionId}
      style={accentStyle}
      className="mb-24 scroll-mt-20"
    >
      {/* Eyebrow ─ matches the §-section eyebrow geometry but uses a non-§ mark
          (the audio register is a parallel register, not a numbered section). */}
      <p
        className={`mb-4 flex items-center gap-2.5 text-[11px] uppercase tracking-[0.24em] ${FONT_MONO}`}
      >
        <span aria-hidden="true" className="font-medium" style={{ color: 'var(--memo-accent)' }}>
          ▷
        </span>
        <span className="text-[#8a847b]">·</span>
        <span className="tracking-[0.18em] text-[#8a847b]">{eyebrow}</span>
      </p>

      <h2
        className={`m-0 mb-7 max-w-[24ch] text-[#1a1a1a] ${FONT_SERIF}`}
        style={{
          fontVariationSettings: "'opsz' 60, 'SOFT' 50",
          fontWeight: 380,
          fontSize: 'clamp(1.65rem, 1.1vw + 1.15rem, 2.2rem)',
          lineHeight: 1.2,
          letterSpacing: '-0.012em',
        }}
      >
        {heading}
      </h2>

      <p>
        {intro ?? (
          <>
            Just over five minutes, spoken aloud &mdash; the same five beats
            this memo walks in print, dictated for the commute or the office
            walk. Skip into any chapter below; the page won&rsquo;t move.
          </>
        )}
      </p>

      {/* Player band ── hairline borders top/bottom, like the soft-action close. */}
      <div
        className="my-9 border-y border-[#d8d2c2] py-7"
        aria-labelledby={`${playStripId}-label`}
      >
        <audio ref={audioRef} src={src} preload="metadata" data-testid="memo-audio-brief-element" />

        <div className="flex items-center gap-5 sm:gap-6">
          <button
            type="button"
            onClick={togglePlay}
            data-ms-cta-id="audio-play"
            aria-label={playing ? 'Pause audio brief' : 'Play audio brief'}
            aria-pressed={playing}
            className={[
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--memo-accent)] transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--memo-accent)]',
              playing
                ? 'bg-[color:var(--memo-accent)] text-[#fffdf7]'
                : 'text-[color:var(--memo-accent)] hover:bg-[color:var(--memo-accent)] hover:text-[#fffdf7]',
            ].join(' ')}
          >
            {playing ? <PauseGlyph /> : <PlayGlyph />}
          </button>

          <div className="flex flex-1 flex-col gap-2">
            <div
              id={`${playStripId}-label`}
              className={`flex items-baseline justify-between text-[11.5px] uppercase tracking-[0.18em] text-[#8a847b] ${FONT_MONO}`}
            >
              <span>
                {chapters[activeChapterIdx]
                  ? `${toRoman(activeChapterIdx + 1)} · ${chapters[activeChapterIdx].label}`
                  : 'Run time'}
              </span>
              <span className="tabular-nums text-[#4a4641]">
                {duration > 0
                  ? `${formatTime(currentTime)} / ${formatTime(duration)}`
                  : `0:00 / ${expectedDuration ?? '—:—'}`}
              </span>
            </div>

            {/* Tape strip — the click/drag surface is a fat invisible band around
                a 2px hairline so finger-touch hits don't have to be pixel-perfect. */}
            <div
              className="relative -my-2 cursor-pointer touch-none py-2"
              onPointerDown={onStripPointerDown}
              onPointerMove={onStripPointerMove}
              onPointerUp={onStripPointerUp}
              onPointerCancel={() => setScrubFraction(null)}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={duration > 0 ? Math.round(duration) : 100}
              aria-valuenow={Math.round(scrubFraction !== null ? scrubFraction * (duration || 0) : currentTime)}
              aria-label="Seek audio brief"
              tabIndex={0}
              onKeyDown={(e) => {
                if (!duration) return;
                if (e.key === 'ArrowRight') {
                  seekTo(currentTime + 5);
                  e.preventDefault();
                } else if (e.key === 'ArrowLeft') {
                  seekTo(currentTime - 5);
                  e.preventDefault();
                }
              }}
            >
              <div ref={stripRef} className="relative h-[2px] w-full bg-[#d8d2c2]">
                {/* Chapter ticks — hairline marks where each chapter starts. */}
                {duration > 0
                  ? chapters.slice(1).map((ch) => (
                      <span
                        key={ch.id}
                        aria-hidden="true"
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                        style={{
                          left: `${(ch.start / duration) * 100}%`,
                          height: '6px',
                          width: '1px',
                          background: '#a89e8b',
                        }}
                      />
                    ))
                  : null}
                <div
                  className="absolute left-0 top-0 h-full"
                  style={{
                    width: `${playProgress * 100}%`,
                    background: 'var(--memo-accent)',
                  }}
                />
                <div
                  aria-hidden="true"
                  className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    left: `${playProgress * 100}%`,
                    background: 'var(--memo-accent)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter list */}
      <ol className={`mt-2 ${FONT_SANS} text-[15px] text-[#4a4641]`}>
        {chapters.map((ch, i) => {
          const active = i === activeChapterIdx;
          return (
            <li key={ch.id} className="relative">
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute -left-4 top-1/2 block h-[1em] w-[2px] -translate-y-1/2"
                  style={{ background: 'var(--memo-accent)' }}
                />
              ) : null}
              <button
                type="button"
                data-ms-cta-id="audio-chapter"
                data-chapter-id={ch.id}
                onClick={() => {
                  seekTo(ch.start);
                  const a = audioRef.current;
                  if (a && a.paused) void a.play();
                }}
                aria-current={active ? 'true' : undefined}
                className={[
                  'group grid w-full grid-cols-[1.8rem_1fr_3.2rem] items-baseline gap-3 border-b border-[#e8e2d4] py-3 text-left transition-colors last:border-b-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--memo-accent)]',
                  active
                    ? 'text-[color:var(--memo-accent)]'
                    : 'text-[#4a4641] hover:text-[#1a1a1a]',
                ].join(' ')}
              >
                <span
                  className={[
                    `text-[11.5px] uppercase tracking-[0.22em] ${FONT_MONO}`,
                    active ? 'text-[color:var(--memo-accent)]' : 'text-[#8a847b]',
                  ].join(' ')}
                >
                  {toRoman(i + 1)}
                </span>
                <span className={`${FONT_SERIF} text-[17.5px] leading-snug`} style={{ fontVariationSettings: "'opsz' 24, 'SOFT' 50" }}>
                  {ch.label}
                </span>
                <span
                  className={[
                    `justify-self-end text-[11.5px] tabular-nums tracking-[0.04em] ${FONT_MONO}`,
                    active ? 'text-[color:var(--memo-accent)]' : 'text-[#8a847b]',
                  ].join(' ')}
                >
                  {formatTime(ch.start)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className={`mt-12 text-center text-[12px] tracking-[0.4em] text-[#8a847b] ${FONT_MONO}`}>
        ∎ &nbsp;∎ &nbsp;∎
      </div>
    </section>
  );
}

// ── helpers ────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function toRoman(n: number): string {
  const map: Array<[number, string]> = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let out = '';
  let remaining = n;
  for (const [value, sym] of map) {
    while (remaining >= value) {
      out += sym;
      remaining -= value;
    }
  }
  return out;
}

function PlayGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 3 L13 8 L4 13 Z" fill="currentColor" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="4" y="3" width="3" height="10" fill="currentColor" />
      <rect x="9" y="3" width="3" height="10" fill="currentColor" />
    </svg>
  );
}
