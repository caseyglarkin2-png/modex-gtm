/**
 * RELATIONSHIP CONTEXT (Universal Work Intake, 2026-09-28): how Casey knows a
 * person, from every work source they (or their account) came through.
 *
 * It is CONTEXT: shown to Casey in the brief, never evidence, never buyer
 * truth, never consent, and never put in front of a buyer by GAP. Whether to
 * mention it ("I write MMYQB, so your name was familiar...") is Casey's call.
 * The same memberships ride on every first touch's send attribution, so the
 * learning loop can later compare sources (association, not causation).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

interface MemberRow {
  kind: string;
  persona_id: number | null;
  account_name: string | null;
  relationship_context: string | null;
  note: string | null;
  ingested_at: Date;
  work_source: { id: string; name: string; source_type: string };
}

async function memberships(prisma: PrismaLike, input: { personaId: number | null; accountName: string | null }): Promise<MemberRow[]> {
  if (!prisma?.gapWorkSourceMember?.findMany) return [];
  const or: Array<Record<string, unknown>> = [];
  if (typeof input.personaId === 'number') or.push({ persona_id: input.personaId });
  if (input.accountName) or.push({ kind: 'account', account_name: input.accountName });
  if (!or.length) return [];
  const rows: MemberRow[] = await prisma.gapWorkSourceMember
    .findMany({
      where: { OR: or, status: { not: 'ignored' } },
      select: { kind: true, persona_id: true, account_name: true, relationship_context: true, note: true, ingested_at: true, work_source: { select: { id: true, name: true, source_type: true } } },
      orderBy: { ingested_at: 'desc' },
      take: 20,
    })
    .catch(() => []);
  // Person memberships first (newest first), then account memberships.
  return [...rows.filter((r) => r.kind === 'person'), ...rows.filter((r) => r.kind === 'account')].sort((a, b) => (a.kind === b.kind ? new Date(b.ingested_at).getTime() - new Date(a.ingested_at).getTime() : a.kind === 'person' ? -1 : 1));
}

const day = (d: Date) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });

/** One line per source: "Met at Inland26 (Inland26 · Chicago, Sep 29). Your note: ...". */
export async function loadRelationshipContext(prisma: PrismaLike, input: { personaId: number | null; accountName: string | null }): Promise<string[]> {
  const rows = await memberships(prisma, input);
  const lines: string[] = [];
  for (const r of rows) {
    if (r.kind === 'account') {
      lines.push(`${r.account_name} is on ${r.work_source.name}`);
      continue;
    }
    const who = r.relationship_context ?? `From ${r.work_source.name}`;
    const where = r.relationship_context ? ` (${r.work_source.name}, ${day(r.ingested_at)})` : ` (${day(r.ingested_at)})`;
    lines.push(`${who}${where}${r.note ? `. Your note: "${r.note.split('\n').pop()}"` : ''}`);
  }
  return [...new Set(lines)].slice(0, 5);
}

export interface AttributedWorkSource {
  workSourceId: string;
  name: string;
  sourceType: string;
  relationshipContext: string | null;
  level: 'person' | 'account';
}

/** The work sources a first touch is attributed to (captured at send time, immutable in the send ledger). */
export async function workSourcesFor(prisma: PrismaLike, input: { personaId: number | null; accountName: string | null }): Promise<AttributedWorkSource[]> {
  const rows = await memberships(prisma, input);
  const seen = new Set<string>();
  const out: AttributedWorkSource[] = [];
  for (const r of rows) {
    const level = r.kind === 'account' ? 'account' : 'person';
    const k = `${r.work_source.id}|${level}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ workSourceId: r.work_source.id, name: r.work_source.name, sourceType: r.work_source.source_type, relationshipContext: r.relationship_context ?? null, level });
  }
  return out;
}
