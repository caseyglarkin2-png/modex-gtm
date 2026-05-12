/**
 * Memo-aesthetic OG image for the YNS Microsite Redesign.
 *
 * Cream-paper "private analysis" card matching the in-page MemoShell
 * aesthetic. 1200×630. Accent rule left + content on right.
 *
 * Satori notes: every container with children needs an explicit
 * `display: 'flex'`. Leaf text goes inside <div style={{display:flex}}>
 * (NOT <span>) for reliable rendering.
 */

interface MemoSocialImageStat {
  label: string;
  value: string;
}

interface MicrositeMemoSocialImageProps {
  /** Account accent — drives the left rule + accent dot color. */
  accentColor?: string;
  /** "PRIVATE ANALYSIS · 2026-05-08" — top eyebrow line. */
  eyebrow: string;
  /** Headline ("Yard execution as a network constraint for General Mills"). */
  title: string;
  /** Account name — used in the initial badge. */
  accountName?: string;
  /** Author byline ("Casey Larkin · YardFlow"). */
  byline: string;
  /** Optional reader name ("prepared for Dan Poland") for personalized previews. */
  preparedFor?: string;
  /** Optional 1-line context — e.g. "47-plant footprint · CPG / Beverage". */
  contextLine?: string;
  /** Up to 3-4 short stats shown as a footer strip. */
  stats?: MemoSocialImageStat[];
}

const COVER_BG = '#f5f1e8';
const INK = '#1a1a1a';
const HAIRLINE = '#d8d2c2';
const MUTED = '#8a847b';
const SUBTLE = '#4a4641';

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
        background: COVER_BG,
        color: INK,
        fontFamily: '"Mona Sans", "Inter", system-ui, sans-serif',
      }}
    >
      {/* Left accent rule */}
      <div
        style={{
          display: 'flex',
          width: 18,
          height: '100%',
          background: accentColor,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          paddingTop: 64,
          paddingRight: 72,
          paddingBottom: 52,
          paddingLeft: 72,
        }}
      >
        {/* Top — eyebrow + headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: MUTED,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                display: 'flex',
                width: 8,
                height: 8,
                borderRadius: 8,
                background: accentColor,
                marginRight: 14,
              }}
            />
            <div style={{ display: 'flex' }}>{eyebrow}</div>
          </div>

          {/* Headline */}
          <div
            style={{
              display: 'flex',
              fontFamily: '"Fraunces", "Iowan Old Style", Georgia, serif',
              fontSize: 64,
              lineHeight: 1.05,
              fontWeight: 400,
              letterSpacing: -1.4,
              color: INK,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>

          {preparedFor ? (
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                fontWeight: 500,
                color: INK,
                marginTop: 28,
              }}
            >
              {preparedFor}
            </div>
          ) : null}

          {contextLine ? (
            <div
              style={{
                display: 'flex',
                fontSize: 21,
                color: SUBTLE,
                marginTop: preparedFor ? 6 : 28,
              }}
            >
              {contextLine}
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
            borderTop: `1px solid ${HAIRLINE}`,
            paddingTop: 22,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', fontSize: 16, fontWeight: 600, color: INK, marginBottom: 6 }}>
              {byline}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: MUTED,
              }}
            >
              YardFlow by FreightRoll
            </div>
          </div>

          {stats.length > 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
              }}
            >
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginLeft: i === 0 ? 0 : 32,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 3,
                      textTransform: 'uppercase',
                      color: MUTED,
                      marginBottom: 4,
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 24,
                      fontWeight: 400,
                      color: INK,
                      fontFamily: '"Fraunces", "Iowan Old Style", Georgia, serif',
                    }}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
