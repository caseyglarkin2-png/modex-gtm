import bundle from './scored-universe.json';
const UNIVERSE = (bundle as { data: unknown[] }).data;
export function listScored(cursor: string | null, limit: number) {
  const start = cursor ? Math.max(0, Number.parseInt(cursor, 10) || 0) : 0;
  const items = UNIVERSE.slice(start, start + limit);
  const next = start + limit;
  return { items, nextCursor: next < UNIVERSE.length ? String(next) : null, total: UNIVERSE.length };
}
