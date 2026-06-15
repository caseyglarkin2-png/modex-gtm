import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/** A no-deploy page row, as the apps consume it (camelCase demoPack). */
export interface ForPageRow {
  slug: string;
  status: 'draft' | 'live';
  pack: unknown;     // ForPackLite
  snap: unknown;     // ForSnapshot
  override: unknown; // ForOverride
  geo: unknown | null;       // HeroMapData
  demoPack: unknown | null;  // modex DemoPack
}

/** Read a LIVE page row by slug. Draft/unknown -> null (route 404s). */
export async function getForPage(slug: string): Promise<ForPageRow | null> {
  const r = await prisma.forPage.findUnique({ where: { slug } });
  if (!r || r.status !== 'live') return null;
  return { slug: r.slug, status: 'live', pack: r.pack, snap: r.snap, override: r.override, geo: r.geo ?? null, demoPack: r.demo_pack ?? null };
}

/** Create or replace a page row (idempotent by slug). */
export async function upsertForPage(row: ForPageRow): Promise<void> {
  const data = { status: row.status, pack: row.pack as Prisma.InputJsonValue, snap: row.snap as Prisma.InputJsonValue, override: row.override as Prisma.InputJsonValue, geo: (row.geo ?? Prisma.JsonNull) as Prisma.InputJsonValue, demo_pack: (row.demoPack ?? Prisma.JsonNull) as Prisma.InputJsonValue };
  await prisma.forPage.upsert({ where: { slug: row.slug }, create: { slug: row.slug, ...data }, update: data });
}
