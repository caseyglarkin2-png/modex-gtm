interface SocialImageStat {
  label: string;
  value: string;
}

interface MicrositeSocialImageProps {
  accentColor?: string;
  eyebrow: string;
  title: string;
  summary: string;
  secondaryTitle?: string;
  stats?: SocialImageStat[];
  footer?: string;
}

export function MicrositeSocialImage({
  accentColor = '#06B6D4',
  eyebrow,
  title,
  summary,
  secondaryTitle,
  stats = [],
  footer,
}: MicrositeSocialImageProps) {
  const gradientStart = `${accentColor}26`;
  const gradientSoft = `${accentColor}12`;

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(140deg, #020617 0%, #0f172a 52%, #111827 100%)',
        color: 'white',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 14% 18%, ${gradientStart}, transparent 30%), radial-gradient(circle at 86% 0%, rgba(255,255,255,0.08), transparent 22%), linear-gradient(180deg, ${gradientSoft}, transparent 45%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: -120,
          right: -80,
          width: 360,
          height: 360,
          borderRadius: 999,
          background: `radial-gradient(circle, ${gradientStart}, transparent 65%)`,
          filter: 'blur(8px)',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          padding: '56px 60px 48px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 930 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: '#cbd5e1',
            }}
          >
            <span>{eyebrow}</span>
            <span
              style={{
                display: 'block',
                width: 52,
                height: 2,
                background: accentColor,
              }}
            />
          </div>

          {secondaryTitle ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 26, fontWeight: 600, color: '#a5b4fc' }}>{secondaryTitle}</div>
              <div style={{ fontSize: 72, lineHeight: 1.02, letterSpacing: '-0.05em', fontWeight: 900 }}>{title}</div>
            </div>
          ) : (
            <div style={{ fontSize: 72, lineHeight: 1.02, letterSpacing: '-0.05em', fontWeight: 900 }}>{title}</div>
          )}

          <div
            style={{
              maxWidth: 920,
              fontSize: 30,
              lineHeight: 1.35,
              color: '#cbd5e1',
            }}
          >
            {summary}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {stats.length > 0 && (
            <div style={{ display: 'flex', gap: 18 }}>
              {stats.slice(0, 4).map((stat) => (
                <div
                  key={`${stat.label}-${stat.value}`}
                  style={{
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    padding: '18px 20px',
                    borderRadius: 24,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(15, 23, 42, 0.72)',
                    flex: 1,
                  }}
                >
                  <div style={{ fontSize: 18, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#94a3b8' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 38, fontWeight: 800, color: 'white' }}>{stat.value}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 20, color: '#cbd5e1' }}>
              <span
                style={{
                  display: 'block',
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  background: accentColor,
                }}
              />
              <span>YardFlow by FreightRoll</span>
            </div>
            {footer ? <div style={{ fontSize: 20, color: '#94a3b8' }}>{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}