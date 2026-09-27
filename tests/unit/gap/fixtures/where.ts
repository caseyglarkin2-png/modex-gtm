/**
 * A small Prisma `where` / `orderBy` evaluator for in-memory test tables.
 *
 * Person-level execution truth (red team T2) queries across routing cards
 * (`subject_id: { in }`, `persona_id: { in }`, `email: { equals, mode }`,
 * JSON `payload: { path, equals }`). Fixtures that hand-matched one query
 * shape each would silently answer a new shape wrong, so they share this.
 * Unknown operators THROW: a fixture must never quietly match everything.
 */
type Row = Record<string, any>;

const OPS = new Set(['in', 'notIn', 'gt', 'gte', 'lt', 'lte', 'equals', 'mode', 'path', 'not', 'has', 'contains', 'endsWith']);

const norm = (v: unknown, insensitive: boolean) => (insensitive && typeof v === 'string' ? v.toLowerCase() : v instanceof Date ? v.getTime() : v);

function cond(value: unknown, c: unknown): boolean {
  if (c === undefined) return true;
  if (c === null || typeof c !== 'object' || c instanceof Date || Array.isArray(c)) return norm(value, false) === norm(c, false);
  const o = c as Record<string, unknown>;
  for (const k of Object.keys(o)) if (!OPS.has(k)) throw new Error(`where fixture: unsupported operator ${k}`);
  const ci = o.mode === 'insensitive';
  let v = value;
  if (Array.isArray(o.path)) {
    for (const seg of o.path as string[]) v = v && typeof v === 'object' ? (v as Row)[seg] : undefined;
  }
  if ('equals' in o && norm(v, ci) !== norm(o.equals, ci)) return false;
  if ('in' in o && !(o.in as unknown[]).map((x) => norm(x, ci)).includes(norm(v, ci))) return false;
  if ('notIn' in o && (o.notIn as unknown[]).map((x) => norm(x, ci)).includes(norm(v, ci))) return false;
  if ('gt' in o && !(v != null && (norm(v, false) as number) > (norm(o.gt, false) as number))) return false;
  if ('gte' in o && !(v != null && (norm(v, false) as number) >= (norm(o.gte, false) as number))) return false;
  if ('lt' in o && !(v != null && (norm(v, false) as number) < (norm(o.lt, false) as number))) return false;
  if ('lte' in o && !(v != null && (norm(v, false) as number) <= (norm(o.lte, false) as number))) return false;
  if ('not' in o && cond(v, o.not)) return false;
  if ('has' in o && !(Array.isArray(v) && v.includes(o.has))) return false;
  if ('contains' in o && !(typeof v === 'string' && (norm(v, ci) as string).includes(norm(o.contains, ci) as string))) return false;
  if ('endsWith' in o && !(typeof v === 'string' && (norm(v, ci) as string).endsWith(norm(o.endsWith, ci) as string))) return false;
  return true;
}

export function matchesWhere(row: Row, where: Row | undefined): boolean {
  if (!where) return true;
  for (const [k, c] of Object.entries(where)) {
    if (k === 'OR') {
      if (!(c as Row[]).some((w) => matchesWhere(row, w))) return false;
    } else if (k === 'AND') {
      if (!(c as Row[]).every((w) => matchesWhere(row, w))) return false;
    } else if (!cond(row[k], c)) return false;
  }
  return true;
}

export function sortBy(rows: Row[], orderBy: Row | Row[] | undefined): Row[] {
  const keys = (Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : []).flatMap((o) => Object.entries(o));
  return [...rows].sort((a, b) => {
    for (const [k, dir] of keys) {
      const x = norm(a[k], false) as any;
      const y = norm(b[k], false) as any;
      if (x === y) continue;
      return (x < y ? -1 : 1) * (dir === 'desc' ? -1 : 1);
    }
    return 0;
  });
}

export function findManyFrom(rows: Row[], args: { where?: Row; orderBy?: Row | Row[]; take?: number } = {}): Row[] {
  const out = sortBy(rows.filter((r) => matchesWhere(r, args.where)), args.orderBy);
  return typeof args.take === 'number' ? out.slice(0, args.take) : out;
}

export function findFirstFrom(rows: Row[], args: { where?: Row; orderBy?: Row | Row[] } = {}): Row | null {
  return findManyFrom(rows, args)[0] ?? null;
}
