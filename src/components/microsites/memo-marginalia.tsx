import type { ReactNode } from 'react';

const FONT_MONO = 'font-[family-name:var(--font-memo-mono)]';
const FONT_SERIF = 'font-[family-name:var(--font-memo-serif)]';

export interface MemoMarginaliaItem {
  /** Short uppercase label, e.g. "Facility count". */
  mark: string;
  /** The value or phrase to surface, e.g. "237 plants". */
  body: string;
  /** Optional sectionId the item is keyed to (for future scroll-alignment). */
  sectionId?: string;
}

interface MemoMarginaliaProps {
  items: MemoMarginaliaItem[];
}

/**
 * Right-gutter "second voice." Renders one item per section's key data
 * point in the 14rem desktop right column. Auto-extracted from
 * ObservationSection.composition by extractMarginaliaItems in
 * memo-section.tsx. Hidden on mobile (the gutter doesn't exist below lg).
 */
export function MemoMarginalia({ items }: MemoMarginaliaProps): ReactNode {
  if (items.length === 0) return null;
  return (
    <aside
      aria-label="Margin notes"
      className="hidden lg:flex lg:flex-col lg:gap-16 lg:pt-2"
    >
      {items.map((item, i) => (
        <div key={`${item.sectionId ?? 'item'}-${i}`} className="text-[#4a4641]">
          <div
            className={`${FONT_MONO} mb-2 text-[11px] uppercase tracking-[0.18em] text-[#8a847b]`}
          >
            {item.mark}
          </div>
          <div
            className={`${FONT_SERIF} text-[16.5px] leading-snug xl:text-[17.5px]`}
            style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 50" }}
          >
            {item.body}
          </div>
        </div>
      ))}
    </aside>
  );
}
