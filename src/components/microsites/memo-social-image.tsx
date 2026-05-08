/**
 * Memo-aesthetic OG image for the YNS Microsite Redesign.
 *
 * Replaces the dark slate-950 + glow social card with a clean white
 * "private analysis" memo card that matches the in-page MemoShell
 * aesthetic. Same 1200×630 dimensions.
 *
 * The dark MicrositeSocialImage stays around until Sprint M7 (when the
 * dark MicrositeShell is deleted) so any callers still using it keep
 * working during the transition.
 */

interface MemoSocialImageStat {
  label: string;
  value: string;
}

interface MicrositeMemoSocialImageProps {
  /** Account accent — drives the left rule + section eyebrow color. */
  accentColor?: string;
  /** "PRIVATE ANALYSIS · 2026-05-08" — top eyebrow line. */
  eyebrow: string;
  /** Headline ("Yard execution as a network constraint for General Mills"). */
  title: string;
  /** Author byline ("Casey Larkin · YardFlow"). */
  byline: string;
  /** Optional reader name ("prepared for Dan Poland") for personalized previews. */
  preparedFor?: string;
  /** Optional 1-line context — e.g. "47-plant footprint · CPG / Beverage". */
  contextLine?: string;
  /** Up to 3-4 short stats shown as a footer strip. */
  stats?: MemoSocialImageStat[];
}

export function MicrositeMemoSocialImage({
  accentColor = '#0E7490',
  eyebrow,
  title,
  byline,
  preparedFor,
  contextLine,
  stats = [],
}: MicrositeMemoSocialImageProps) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background: '#FFFFFF',
        color: '#0F172A',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
    >
      {/* Left accent rule */}
      <div
        style={{
          width: 14,
          height: '100%',
          background: accentColor,
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          padding: '64px 72px 56px',
        }}
      >
        {/* Top — eyebrow */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            maxWidth: 980,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#475569',
            }}
          >
            <span>{eyebrow}</span>
          </div>

          {/* Headline (serif feel via Georgia fallback chain) */}
          <div
            style={{
              fontFamily: 'Georgia, "Iowan Old Style", "Palatino Linotype", serif',
              fontSize: 64,
              lineHeight: 1.05,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#0F172A',
              maxWidth: 1000,
            }}
          >
            {title}
          </div>

          {/* Sub-line: prepared for + context */}
          {(preparedFor || contextLine) ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: 22,
                color: '#334155',
              }}
            >
              {preparedFor ? (
                <span style={{ fontWeight: 500, color: '#1E293B' }}>{preparedFor}</span>
              ) : null}
              {contextLine ? <span>{contextLine}</span> : null}
            </div>
          ) : null}
        </div>

        {/* Bottom — byline + stats */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>{byline}</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#94A3B8',
              }}
            >
              YardFlow by FreightRoll
            </span>
          </div>

          {stats.length > 0 ? (
            <div
              style={{
                display: 'flex',
                gap: 36,
                alignItems: 'flex-end',
              }}
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: '#64748B',
                    }}
                  >
                    {stat.label}
                  </span>
                  <span
                    style={{
                      fontSize: 26,
                      fontWeight: 600,
                      color: '#0F172A',
                      fontFamily: 'Georgia, "Iowan Old Style", serif',
                    }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
