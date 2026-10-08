/**
 * The seller trust tag (Buyer said / Checked / Unverified / Our read / Unknown / Contradicted), one look everywhere
 * it appears (NOW's lines, the Account Story's sentences). Server-renderable.
 */
import type { SellerTag } from '@/lib/gap/context/now';

export const TAG_TONE: Record<SellerTag, string> = {
  'Buyer said': 'border-emerald-600 text-emerald-700 dark:text-emerald-400',
  'You noted': 'border-dashed border-emerald-600 text-emerald-700 dark:text-emerald-400',
  Checked: 'border-sky-600 text-sky-700 dark:text-sky-400',
  Unverified: 'border-dashed border-[var(--border)] text-[var(--muted-foreground)]',
  'Our read': 'border-[var(--border)] text-[var(--muted-foreground)]',
  Unknown: 'border-[var(--border)] text-[var(--muted-foreground)]',
  Contradicted: 'border-red-600 text-red-700 dark:text-red-400',
};

export function Tag({ tag }: { tag: SellerTag }) {
  return <span className={`inline-block shrink-0 whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TAG_TONE[tag]}`}>{tag}</span>;
}
