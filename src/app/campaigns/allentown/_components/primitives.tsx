'use client';

/* ═══════════════════════════════════════════════════════════════
   Allentown Tour — Command Center · primitives (TSX port)
   SourceChip (provenance), StageChip, Avatar, Funnel, SourceHealth,
   MapMotif, icons. Typed React.
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import type {
  ViewContact,
  ViewFunnelStage,
  ViewSourceHealth,
  SourceCode,
} from '@/lib/campaigns/canonical-view';

/* The five systems this screen reconciles (color keys). */
export interface SourceMeta {
  code: string;
  label: string;
  kind: string;
  color: string;
}
export const SOURCES: Record<string, SourceMeta> = {
  HS: { code: 'HS', label: 'HubSpot', kind: 'CRM', color: '#F2994A' },
  GM: { code: 'GM', label: 'Gmail', kind: 'Email', color: '#EB5757' },
  PH: { code: 'PH', label: 'PostHog', kind: 'Web intent', color: '#9B6DFF' },
  AP: { code: 'AP', label: 'Apollo', kind: 'Enrichment', color: '#2DD4BF' },
  ICP: { code: 'ICP', label: 'ICP', kind: 'Lead score', color: '#00B4FF' },
};

export const STAGE_LABEL: Record<string, string> = {
  replied: 'Replied',
  opened: 'Opened',
  sent: 'Sent',
  draft: 'Draft',
  booked: 'Booked',
  contacts: 'New',
};

/* ─── inline icons ──────────────────────────────────────────────── */
type IcoProps = React.SVGProps<SVGSVGElement>;
export const Ico = {
  chevron: (p: IcoProps) => (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" {...p}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  arrow: (p: IcoProps) => (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" {...p}>
      <path d="M3 8h9M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  bolt: (p: IcoProps) => (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" {...p}>
      <path d="M8.5 1.5L3 9h4l-1 5.5L12 7H8l.5-5.5z" fill="currentColor" />
    </svg>
  ),
  warn: (p: IcoProps) => (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" {...p}>
      <path d="M8 1.7l6.4 11.1a.8.8 0 01-.7 1.2H2.3a.8.8 0 01-.7-1.2L8 1.7z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 6v3.4M8 11.4v.05" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  merge: (p: IcoProps) => (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" {...p}>
      <path d="M4 2v3.5a3 3 0 003 3h2a3 3 0 013 3V14M4 2L2 4M4 2l2 2M12 14l-2-2M12 14l2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  mail: (p: IcoProps) => (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" {...p}>
      <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 4l6 4.5L14 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  check: (p: IcoProps) => (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" {...p}>
      <path d="M3 8.5l3 3 7-7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  link: (p: IcoProps) => (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" {...p}>
      <path d="M6.5 9.5l3-3M5 7L3.5 8.5a2.1 2.1 0 003 3L8 10M11 9l1.5-1.5a2.1 2.1 0 00-3-3L8 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  pin: (p: IcoProps) => (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" {...p}>
      <path d="M8 14s4.5-4 4.5-7.5a4.5 4.5 0 10-9 0C3.5 10 8 14 8 14z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="6.5" r="1.6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
  pulse: (p: IcoProps) => (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" {...p}>
      <path d="M1 8h3l2-5 3 10 2-5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  target: (p: IcoProps) => (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" {...p}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  hand: (p: IcoProps) => (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" {...p}>
      <path d="M5 8V3.6a1 1 0 012 0V7m0-.5V2.8a1 1 0 012 0V7m0-.8a1 1 0 012 0V8m0-1.2a1 1 0 012 0v4a3.8 3.8 0 01-3.8 3.8H8.5A3.5 3.5 0 015 12.3L3.2 10a1.1 1.1 0 011.7-1.4L5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  globe: (p: IcoProps) => (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" {...p}>
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.8 8h12.4M8 1.8c1.7 1.7 2.6 3.9 2.6 6.2S9.7 12.5 8 14.2C6.3 12.5 5.4 10.3 5.4 8S6.3 3.5 8 1.8z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
};

/* signal-type -> icon, by source */
export function srcIcon(code: string): React.ReactNode {
  switch (code.split('+')[0]) {
    case 'PH':
      return <Ico.pulse />;
    case 'GM':
      return <Ico.mail />;
    case 'HS':
      return <Ico.check />;
    default:
      return <Ico.bolt />;
  }
}

/* hex + alpha helper */
export function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ─── SourceChip — the provenance primitive ─────────────────────── */
export function SourceChip({
  code,
  size,
  title,
}: {
  code: SourceCode | undefined;
  size?: 'lg' | null;
  title?: string;
}) {
  if (!code) return null;
  if (code.indexOf('+') >= 0) {
    const parts = code.split('+').filter((p) => SOURCES[p]);
    if (parts.length === 0) return null;
    return (
      <span
        className={'cc-src compound' + (size === 'lg' ? ' lg' : '')}
        style={{
          color: SOURCES[parts[0]].color,
          borderColor: hexA(SOURCES[parts[0]].color, 0.4),
          background: hexA(SOURCES[parts[0]].color, 0.08),
        }}
        title={title || parts.map((p) => SOURCES[p].label).join(' + ')}
      >
        {parts.map((p, i) => (
          <React.Fragment key={p}>
            {i > 0 && <span style={{ opacity: 0.4 }}>+</span>}
            <span style={{ color: SOURCES[p].color }}>{SOURCES[p].code}</span>
          </React.Fragment>
        ))}
      </span>
    );
  }
  const s = SOURCES[code];
  if (!s) return null;
  return (
    <span
      className={'cc-src' + (size === 'lg' ? ' lg' : '')}
      style={{ color: s.color, borderColor: hexA(s.color, 0.42), background: hexA(s.color, 0.09) }}
      title={title || `${s.label} · ${s.kind}`}
    >
      <span className="cc-src-dot" style={{ background: s.color }} />
      {s.code}
    </span>
  );
}

/* ─── StageChip ─────────────────────────────────────────────────── */
export function StageChip({ stage }: { stage: string }) {
  return (
    <span className={'cc-stage-chip ' + stage}>
      <span className="pt" />
      {STAGE_LABEL[stage] || stage}
    </span>
  );
}

/* ─── Avatar ────────────────────────────────────────────────────── */
export function Avatar({
  contact,
  selected,
  size,
  onClick,
  title,
}: {
  contact: ViewContact;
  selected?: boolean;
  size?: 'lg' | null;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}) {
  return (
    <span
      className={
        'cc-av eng-' +
        contact.engagement +
        (selected ? ' is-selected' : '') +
        (size === 'lg' ? ' lg' : '')
      }
      onClick={onClick}
      title={title || `${contact.name} · ${STAGE_LABEL[contact.engagement] || contact.engagement}`}
    >
      {contact.initials}
    </span>
  );
}

/* ─── Funnel ────────────────────────────────────────────────────── */
export function Funnel({
  data,
  activeStage,
  onPick,
}: {
  data: ViewFunnelStage[];
  activeStage: string;
  onPick: (stage: string) => void;
}) {
  return (
    <div className="cc-funnel">
      {data.map((s, i) => {
        const prev = i > 0 ? data[i - 1].count : null;
        const rate = prev && prev > 0 ? Math.round((s.count / prev) * 100) + '%' : null;
        return (
          <React.Fragment key={s.stage}>
            {i > 0 && (
              <div className="cc-funnel-arrow">
                {rate && <span className="rate">{rate}</span>}
                <Ico.arrow />
              </div>
            )}
            <div
              className={
                'cc-funnel-stage' +
                (s.count === 0 ? ' zero' : '') +
                (activeStage === s.stage ? ' is-active' : '')
              }
              onClick={() => onPick(activeStage === s.stage ? 'all' : s.stage)}
            >
              <span className="fc">{s.count}</span>
              <span className="fl">{s.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Source health row ─────────────────────────────────────────── */
export function SourceHealth({ health }: { health: ViewSourceHealth[] }) {
  return (
    <div className="cc-health">
      <span className="cc-health-lbl">Sources</span>
      {health.map((h) => {
        const s = SOURCES[h.code] || { label: h.code, color: '#9CA3AF' };
        return (
          <div
            className="cc-health-chip"
            key={h.code}
            title={`${s.label} — synced ${h.synced}${h.fresh ? '' : ' · stale'}`}
          >
            <span className={'dot ' + (h.fresh ? 'fresh' : 'stale')} />
            <span className="nm" style={{ color: s.color }}>
              {s.label}
            </span>
            <span className="ts">{h.synced}</span>
          </div>
        );
      })}
    </div>
  );
}

