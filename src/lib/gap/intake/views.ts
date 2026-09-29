/**
 * UNIVERSAL WORK INTAKE: what GAP did with each source (read only).
 *
 * Every count is a real state a member is in (resolution, qualification,
 * status), so each one drills down to its members; nothing here is a score.
 * A person who arrived from several sources shows every source (provenance
 * edges), and is still one Persona / candidate.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface SourceSummary {
  id: string;
  name: string;
  sourceType: string;
  sourceRef: string | null;
  intent: string;
  relationshipContext: string | null;
  notes: string | null;
  current: boolean;
  createdAt: string;
  members: number;
  byResolution: Record<string, number>;
  byQualification: Record<string, number>;
  byStatus: Record<string, number>;
  accounts: number;
}

export interface MemberView {
  id: string;
  kind: string;
  name: string | null;
  title: string | null;
  company: string | null;
  email: string | null;
  linkedinUrl: string | null;
  relationshipContext: string | null;
  note: string | null;
  resolution: string;
  resolutionBasis: string | null;
  candidates: Array<{ personaId: number | null; accountName: string; why: string }>;
  accountName: string | null;
  personaId: number | null;
  candidateId: number | null;
  qualification: string | null;
  qualificationReason: string | null;
  status: string;
  ingestedAt: string;
  /** Other sources the same person (or account) arrived from. */
  alsoFrom: string[];
}

const tally = (rows: Array<{ key: string | null; n: number }>) => {
  const out: Record<string, number> = {};
  for (const r of rows) out[r.key ?? 'unplanned'] = (out[r.key ?? 'unplanned'] ?? 0) + r.n;
  return out;
};

export async function listSources(prisma: PrismaLike, opts: { includeArchived?: boolean } = {}): Promise<SourceSummary[]> {
  const sources = await prisma.gapWorkSource.findMany({ where: opts.includeArchived ? {} : { status: 'active' }, orderBy: [{ created_at: 'desc' }], take: 200 });
  if (!sources.length) return [];
  const ids = sources.map((s: { id: string }) => s.id);
  const members: Array<{ work_source_id: string; resolution: string; qualification: string | null; status: string; account_name: string | null }> = await prisma.gapWorkSourceMember.findMany({
    where: { work_source_id: { in: ids } },
    select: { work_source_id: true, resolution: true, qualification: true, status: true, account_name: true },
  });
  const current = sources.filter((s: { current_at: Date | null }) => s.current_at).sort((a: { current_at: Date }, b: { current_at: Date }) => b.current_at.getTime() - a.current_at.getTime())[0]?.id ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw rows from a narrow select
  return sources.map((s: Record<string, any>) => {
    const own = members.filter((m) => m.work_source_id === s.id);
    const count = (f: (m: (typeof own)[number]) => string | null) => tally(own.map((m) => ({ key: f(m), n: 1 })));
    return {
      id: s.id,
      name: s.name,
      sourceType: s.source_type,
      sourceRef: s.source_ref ?? null,
      intent: s.intent,
      relationshipContext: s.relationship_context ?? null,
      notes: s.notes ?? null,
      current: s.id === current,
      createdAt: new Date(s.created_at).toISOString(),
      members: own.length,
      byResolution: count((m) => m.resolution),
      byQualification: count((m) => m.qualification),
      byStatus: count((m) => m.status),
      accounts: new Set(own.map((m) => m.account_name).filter(Boolean)).size,
    };
  });
}

export const MEMBER_FILTERS = ['resolution', 'qualification', 'status'] as const;
export type MemberFilter = { field: (typeof MEMBER_FILTERS)[number]; value: string } | null;

export async function loadSource(prisma: PrismaLike, id: string, opts: { filter?: MemberFilter; limit?: number } = {}): Promise<{ source: SourceSummary; members: MemberView[]; total: number } | null> {
  const all = await listSources(prisma, { includeArchived: true });
  const source = all.find((s) => s.id === id);
  if (!source) return null;
  const f = opts.filter;
  const where: Record<string, unknown> = { work_source_id: id };
  if (f) where[f.field] = f.value === 'unplanned' && f.field === 'qualification' ? null : f.value;
  const [rows, total] = await Promise.all([
    prisma.gapWorkSourceMember.findMany({ where, orderBy: [{ account_name: 'asc' }, { name: 'asc' }], take: Math.min(opts.limit ?? 300, 1000) }),
    prisma.gapWorkSourceMember.count({ where }),
  ]);
  // Provenance edges: the same Persona / candidate / account in OTHER sources.
  const personaIds = [...new Set(rows.map((r: { persona_id: number | null }) => r.persona_id).filter(Boolean))];
  const candidateIds = [...new Set(rows.map((r: { candidate_id: number | null }) => r.candidate_id).filter(Boolean))];
  const accounts = [...new Set(rows.filter((r: { kind: string }) => r.kind === 'account').map((r: { account_name: string | null }) => r.account_name).filter(Boolean))];
  const edges: Array<{ work_source_id: string; persona_id: number | null; candidate_id: number | null; account_name: string | null; kind: string }> =
    personaIds.length || candidateIds.length || accounts.length
      ? await prisma.gapWorkSourceMember.findMany({
          where: { work_source_id: { not: id }, OR: [...(personaIds.length ? [{ persona_id: { in: personaIds } }] : []), ...(candidateIds.length ? [{ candidate_id: { in: candidateIds } }] : []), ...(accounts.length ? [{ kind: 'account', account_name: { in: accounts } }] : [])] },
          select: { work_source_id: true, persona_id: true, candidate_id: true, account_name: true, kind: true },
        })
      : [];
  const nameOf = new Map(all.map((s) => [s.id, s.name]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw rows
  const members: MemberView[] = rows.map((r: Record<string, any>) => {
    const also = edges.filter((e) => (r.persona_id && e.persona_id === r.persona_id) || (r.candidate_id && e.candidate_id === r.candidate_id) || (r.kind === 'account' && e.kind === 'account' && e.account_name === r.account_name));
    return {
      id: r.id,
      kind: r.kind,
      name: r.name ?? null,
      title: r.title ?? null,
      company: r.company ?? null,
      email: r.email ?? null,
      linkedinUrl: r.linkedin_url ?? null,
      relationshipContext: r.relationship_context ?? null,
      note: r.note ?? null,
      resolution: r.resolution,
      resolutionBasis: r.resolution_basis ?? null,
      candidates: Array.isArray(r.resolution_candidates) ? r.resolution_candidates : [],
      accountName: r.account_name ?? null,
      personaId: r.persona_id ?? null,
      candidateId: r.candidate_id ?? null,
      qualification: r.qualification ?? null,
      qualificationReason: r.qualification_reason ?? null,
      status: r.status,
      ingestedAt: new Date(r.ingested_at).toISOString(),
      alsoFrom: [...new Set(also.map((e) => nameOf.get(e.work_source_id) ?? 'another source'))],
    };
  });
  return { source, members, total };
}
