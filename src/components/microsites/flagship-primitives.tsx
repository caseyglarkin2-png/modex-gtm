import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import {
  FLAGSHIP_ACTION_CLASS,
  FLAGSHIP_BADGE_CLASS,
  FLAGSHIP_DISPLAY_CLASS,
  FLAGSHIP_HERO_PANEL_CLASS,
  FLAGSHIP_LABEL_CLASS,
  FLAGSHIP_PANEL_CLASS,
  FLAGSHIP_PANEL_MUTED_CLASS,
  type AccentClasses,
} from './theme';

export function splitFlagshipMeta(detail?: string) {
  return detail?.split('·').map((part) => part.trim()).filter(Boolean) ?? [];
}

export function FlagshipSurface({
  children,
  className = '',
  tone = 'default',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  tone?: 'default' | 'muted' | 'hero';
} & ComponentPropsWithoutRef<'div'>) {
  const surfaceClass =
    tone === 'hero'
      ? FLAGSHIP_HERO_PANEL_CLASS
      : tone === 'muted'
        ? FLAGSHIP_PANEL_MUTED_CLASS
        : FLAGSHIP_PANEL_CLASS;

  return <div className={`${surfaceClass} ${className}`} {...rest}>{children}</div>;
}

export function FlagshipMetaPills({
  items,
  accent,
  className = '',
}: {
  items: string[];
  accent: AccentClasses;
  className?: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className={`${FLAGSHIP_BADGE_CLASS} ${index === 0 ? `${accent.border} ${accent.textLight}` : ''}`}
        >
          {index === 0 && <span className={`h-2 w-2 rounded-full ${accent.bg}`} />}
          <span>{item}</span>
        </span>
      ))}
    </div>
  );
}

export function FlagshipSignalRail({
  label,
  title,
  items,
  accent,
  className = '',
  tone = 'muted',
}: {
  label: string;
  title?: string;
  items: string[];
  accent: AccentClasses;
  className?: string;
  tone?: 'default' | 'muted' | 'hero';
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <FlagshipSurface tone={tone} className={`rounded-[var(--fw-panel-radius-large)] p-6 sm:p-7 ${className}`}>
      <div className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>{label}</div>
      {title && <p className={`mt-4 text-2xl font-semibold leading-tight text-white ${FLAGSHIP_DISPLAY_CLASS}`}>{title}</p>}
      <div className="mt-5 space-y-3">
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex items-start gap-3 rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-slate-200"
          >
            <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${accent.bg} text-slate-950`}>
              {`${index + 1}`.padStart(2, '0')}
            </span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </FlagshipSurface>
  );
}

export function FlagshipSectionFlow({
  items,
  accent,
  className = '',
}: {
  items: Array<{
    href: string;
    label: string;
    active?: boolean;
  }>;
  accent: AccentClasses;
  className?: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <FlagshipSurface tone="muted" className={`rounded-[var(--fw-panel-radius)] p-4 sm:p-5 ${className}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-xl">
          <div className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>Section Flow</div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            This route is sequenced like a working session, not a generic landing page scroll.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <a
              key={`${item.href}-${index}`}
              href={item.href}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.18em] ${FLAGSHIP_ACTION_CLASS} ${
                item.active
                  ? `${accent.border} ${accent.bgBadge} ${accent.textLight}`
                  : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span className="text-slate-500">{`${index + 1}`.padStart(2, '0')}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </FlagshipSurface>
  );
}