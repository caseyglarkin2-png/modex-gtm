/**
 * ROTATION CURSORS (batch item 8, 2026-10-07). Server only.
 *
 * A bounded sweep (at most N items per run) that always starts from the top of a stable order reaches the same first N
 * forever: past the first ten open follow-ups, a by-hand follow-up was never reconciled from Sent, and the closure
 * sweep's first five accounts could starve the rest. A cursor kept in system_config makes the next run resume after the
 * last item it handled, so every item is reached over successive runs. Soft: an unreadable or unwritable store starts
 * from the top (the old behavior) and never fails the sweep.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export async function readCursor(prisma: PrismaLike, key: string): Promise<string | null> {
  if (typeof prisma?.systemConfig?.findUnique !== 'function') return null;
  const row: { value?: unknown } | null = await prisma.systemConfig.findUnique({ where: { key } }).catch(() => null);
  return typeof row?.value === 'string' && row.value ? row.value : null;
}

export async function writeCursor(prisma: PrismaLike, key: string, value: string): Promise<void> {
  if (typeof prisma?.systemConfig?.upsert !== 'function') return;
  await prisma.systemConfig.upsert({ where: { key }, create: { key, value }, update: { value } }).catch(() => undefined);
}

/** The items in their stable order (by key), starting after `cursor` and wrapping round to the top. */
export function rotateFrom<T>(items: readonly T[], keyOf: (t: T) => string, cursor: string | null): T[] {
  const sorted = [...items].sort((a, b) => (keyOf(a) < keyOf(b) ? -1 : keyOf(a) > keyOf(b) ? 1 : 0));
  if (!cursor) return sorted;
  const at = sorted.findIndex((t) => keyOf(t) > cursor);
  return at <= 0 ? sorted : [...sorted.slice(at), ...sorted.slice(0, at)];
}
