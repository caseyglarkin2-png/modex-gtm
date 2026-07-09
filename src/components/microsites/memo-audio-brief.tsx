'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

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

export interface VideoFollowUp {
  /** Self-hosted video path under /public (e.g. "/video/kraft-heinz.mp4"). */
  src: string;
  /** Optional intro line above the player. */
  intro?: ReactNode;
  /** Optional poster image path. */
  poster?: string;
}

interface MemoAudioBriefProps {
  /** Public path to the audio (e.g. "/audio/yard-network-brief.mp3"). */
  src: string;
  /** Chapter table, rendered as the click-to-seek list. */
  chapters: AudioChapter[];
  /** Eyebrow label. Default: "Audio register". */
  eyebrow?: string;
  /** Heading shown in Fraunces. */
  heading?: string;
  /** One- or two-sentence intro. Default supplied, can be overridden per account. */
  intro?: ReactNode;
  /** Accent color override; falls back to inheriting `--memo-accent` from MemoShell. */
  accentColor?: string;
  /** Section id for anchor + tracking. Default "audio". */
  sectionId?: string;
  /** @deprecated The native control shows duration on its own; kept so existing
   *  call sites that still pass it don't break. No longer rendered. */
  expectedDuration?: string;
  /** Optional follow-up video CTA rendered as a hairline-separated footer below chapters. */
  videoFollowUp?: VideoFollowUp;
}

/**
 * "Audio register", the spoken version of the memo.
 *
 * The player is the browser's own native `<audio controls>`. We used to wrap
 * it in a bespoke accent-colored play disk, tape-strip scrubber, and speed
 * toggle; that chrome was decorative and did not reliably play, so it's gone.
 * The real control does the talking. The chapter list below still click-to-
 * seeks the same element, and the optional follow-up video uses native
 * `<video controls>` too.
 *
 * Tracking surfaces:
 *   data-ms-section-id="audio"    , counted as a viewed section by the
 *                                    intersection-observer in use-microsite-tracker.
 *   data-ms-cta-id="audio-chapter", chapter seek counted as a CTA (the
 *                                    chapter id rides on data-chapter-id).
 *   audioProgressPct              , captured by the tracker directly off the
 *                                    <audio> element (querySelector + timeupdate),
 *                                    so playback engagement is still measured.
 *
 * The playhead is tracked here only to highlight the active chapter row.
 */
export function MemoAudioBrief({
  src,
  chapters,
  eyebrow = 'Audio register',
  heading = "Listen, if you'd rather",
  intro,
  accentColor,
  sectionId = 'audio',
  videoFollowUp,
}: MemoAudioBriefProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const accentStyle = accentColor ? ({ ['--memo-accent']: accentColor } as React.CSSProperties) : undefined;

  // Track the playhead only to highlight the active chapter row.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrentTime(a.currentTime);
    a.addEventListener('timeupdate', onTime);
    return () => a.removeEventListener('timeupdate', onTime);
  }, []);

  const seekTo = useCallback((t: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(t, a.duration || t));
    setCurrentTime(a.currentTime);
  }, []);

  // Active chapter: the last chapter whose start <= currentTime.
  const activeChapterIdx = chapters.reduce(
    (acc, ch, i) => (ch.start <= currentTime ? i : acc),
    0,
  );

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
          fontSize: 'clamp(1.75rem, 1.4vw + 1.15rem, 2.6rem)',
          lineHeight: 1.18,
          letterSpacing: '-0.014em',
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

      {/* Player band ── the browser's native audio control, hairline-bordered
          top/bottom to sit inside the document rules. No custom chrome. */}
      <div className="my-9 border-y border-[#d8d2c2] py-7">
        <audio
          ref={audioRef}
          src={src}
          controls
          preload="metadata"
          data-testid="memo-audio-brief-element"
          className="w-full"
        >
          Your browser does not support the audio element.
        </audio>
      </div>

      {/* Chapter list, each row seeks the same native element. */}
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

      {videoFollowUp ? (
        <div className="mt-10 border-t border-[#d8d2c2] pt-9">
          {videoFollowUp.intro ? (
            <p className="mb-6">{videoFollowUp.intro}</p>
          ) : null}
          <video
            controls
            preload="metadata"
            poster={videoFollowUp.poster}
            data-ms-cta-id="audio-video-follow-up"
            data-testid="memo-video-brief-element"
            className="w-full border border-[#d8d2c2] bg-black"
          >
            <source src={videoFollowUp.src} />
            Your browser does not support the video tag.
          </video>
        </div>
      ) : null}

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
