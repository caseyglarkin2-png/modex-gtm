/**
 * UNIVERSAL WORK INTAKE: the service (2026-09-28).
 *
 * ONE abstraction for every reason Casey wants GAP to work a person or an
 * account: a GapWorkSource (newsletter, conference, CRM list, referrals, a
 * target list ...) and its members. Source provenance is CONTEXT: it never
 * becomes evidence, buyer truth or consent, and nothing here routes, drafts,
 * sends or enrolls.
 *
 *   preview   parse + resolve, writes nothing
 *   commit    idempotent per (source, member key); keeps exactly what was
 *             supplied (frozen by GAP_WORK_MEMBER_FROZEN); a new person at a
 *             known account is a STAGED AccountContactCandidate, never a
 *             Persona; GAP never creates an Account. A re-import may only
 *             improve the derived identity.
 *   addPerson one person from a phone into the CURRENT source (conference
 *             mode), or "People I met" when none is current
 */
import { normalizeName, normalizeTitle } from '@/lib/contact-standard';
import { loadIdentityContext } from '../identity/service';
import { soundsLikeBuyerWords } from '../capture/buyer-words';
import { parseIntake, type IntakeKind, type IntakeRow, type ParseResult } from './parse';
import { memberKey, resolveIntakeRow, type IntakeContext, type ResolvedRow } from './resolve';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const SOURCE_TYPES = ['newsletter', 'conference', 'crm_list', 'referral', 'relationship', 'target_list', 'content', 'inbound', 'other'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];
export const INTENTS = ['research', 'find_people', 'prepare_outreach', 'follow_up', 'watch'] as const;
export type Intent = (typeof INTENTS)[number];
export const MEMBER_STATUSES = ['active', 'ignored', 'not_now', 'research_requested'] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const PEOPLE_I_MET = 'People I met';

export async function loadIntakeContext(prisma: PrismaLike): Promise<IntakeContext> {
  const [identity, personas] = await Promise.all([
    loadIdentityContext(prisma),
    prisma.persona.findMany({ select: { id: true, name: true, account_name: true, email: true, linkedin_url: true } }),
  ]);
  return { identity, personas };
}

export async function createWorkSource(
  prisma: PrismaLike,
  input: { name: string; sourceType: SourceType; sourceRef?: string | null; intent?: Intent; relationshipContext?: string | null; notes?: string | null; actor: string },
): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  const name = input.name?.trim();
  if (!name) return { ok: false, reason: 'name_required' };
  if (!SOURCE_TYPES.includes(input.sourceType)) return { ok: false, reason: 'invalid_source_type' };
  const intent = input.intent ?? 'research';
  if (!INTENTS.includes(intent)) return { ok: false, reason: 'invalid_intent' };
  const s = await prisma.gapWorkSource.create({
    data: { name: name.slice(0, 200), source_type: input.sourceType, source_ref: input.sourceRef?.trim() || null, intent, relationship_context: input.relationshipContext?.trim() || null, notes: input.notes?.trim() || null, created_by: input.actor },
  });
  await prisma.gapAuditEvent.create({ data: { kind: 'work_source.created', actor: input.actor, subject_type: 'work_source', subject_id: s.id, payload: { name, sourceType: input.sourceType, intent } } });
  return { ok: true, id: s.id };
}

export interface PreviewRow {
  row: IntakeRow;
  key: string;
  resolved: ResolvedRow;
}

export interface IntakePreview {
  parse: Omit<ParseResult, 'rows'>;
  rows: PreviewRow[];
  counts: { rows: number; resolved: number; new_candidate: number; ambiguous: number; unresolved: number };
}

function resolveAll(ctx: IntakeContext, parsed: ParseResult): PreviewRow[] {
  const seen = new Set<string>();
  const out: PreviewRow[] = [];
  for (const row of parsed.rows) {
    const key = memberKey(row);
    if (seen.has(key)) continue; // the same person twice in one paste is one member
    seen.add(key);
    out.push({ row, key, resolved: resolveIntakeRow(ctx, row) });
  }
  return out;
}

const countOf = (rows: PreviewRow[]) => ({
  rows: rows.length,
  resolved: rows.filter((r) => r.resolved.resolution === 'resolved').length,
  new_candidate: rows.filter((r) => r.resolved.resolution === 'new_candidate').length,
  ambiguous: rows.filter((r) => r.resolved.resolution === 'ambiguous').length,
  unresolved: rows.filter((r) => r.resolved.resolution === 'unresolved').length,
});

/** Parse and resolve without writing anything: what Casey sees before he commits. */
export async function previewIntake(prisma: PrismaLike, input: { text: string; kind: IntakeKind }, ctx?: IntakeContext): Promise<IntakePreview> {
  const parsed = parseIntake(input.text, input.kind);
  const rows = parsed.error ? [] : resolveAll(ctx ?? (await loadIntakeContext(prisma)), parsed);
  const { rows: _drop, ...parse } = parsed;
  void _drop;
  return { parse, rows, counts: countOf(rows) };
}

async function stageCandidate(prisma: PrismaLike, p: PreviewRow, source: { id: string; source_type: string }): Promise<number | null> {
  const r = p.row;
  if (!p.resolved.accountName || !r.name) return null;
  // The existing candidate key rule (account-contact-candidates.ts); an existing candidate keeps its state.
  const candidateKey = [r.email?.toLowerCase() || normalizeName(r.name), normalizeTitle(r.title ?? '')].filter(Boolean).join('::');
  const c = await prisma.accountContactCandidate.upsert({
    where: { account_name_candidate_key: { account_name: p.resolved.accountName, candidate_key: candidateKey } },
    update: {},
    create: {
      account_name: p.resolved.accountName,
      candidate_key: candidateKey,
      full_name: r.name,
      normalized_name: normalizeName(r.name),
      title: r.title ?? null,
      email: r.email?.toLowerCase() ?? null,
      email_valid: false,
      company_domain: r.companyDomain ?? null,
      linkedin_url: r.linkedinUrl ?? null,
      source: 'gap_work_source',
      source_action: 'gap_work_intake',
      source_provider: source.source_type,
      source_contact_id: `work_source:${source.id}`,
      source_payload: r.raw,
      recommendation_reason: 'Arrived through a GAP work source; review before promoting.',
      state: 'staged',
    },
    select: { id: true },
  });
  return c.id;
}

const identityData = (p: PreviewRow) => ({
  resolution: p.resolved.resolution,
  resolution_basis: p.resolved.basis,
  resolution_candidates: p.resolved.candidates.length ? p.resolved.candidates : undefined,
  account_name: p.resolved.accountName,
  persona_id: p.resolved.personaId,
});

async function writeMembers(prisma: PrismaLike, source: { id: string; source_type: string; relationship_context: string | null }, rows: PreviewRow[], actor: string) {
  let created = 0;
  let existing = 0;
  let staged = 0;
  const ids: string[] = [];
  for (const p of rows) {
    const found = await prisma.gapWorkSourceMember.findUnique({ where: { work_source_id_member_key: { work_source_id: source.id, member_key: p.key } } });
    const candidateId = p.row.kind === 'person' && p.resolved.resolution === 'new_candidate' ? await stageCandidate(prisma, p, source) : null;
    if (candidateId) staged += 1;
    if (found) {
      existing += 1;
      ids.push(found.id);
      // Only the derived identity moves; what Casey supplied is frozen.
      if (found.resolution !== p.resolved.resolution || found.account_name !== p.resolved.accountName || found.persona_id !== p.resolved.personaId) {
        await prisma.gapWorkSourceMember.update({ where: { id: found.id }, data: { ...identityData(p), candidate_id: candidateId ?? found.candidate_id ?? null } });
      }
      continue;
    }
    const r = p.row;
    const m = await prisma.gapWorkSourceMember.create({
      data: {
        work_source_id: source.id,
        kind: r.kind,
        member_key: p.key,
        raw: r.raw,
        name: r.name ?? null,
        title: r.title ?? null,
        company: r.company ?? null,
        email: r.email ?? null,
        linkedin_url: r.linkedinUrl ?? null,
        company_domain: r.companyDomain ?? null,
        source_identifier: r.sourceId ?? null,
        relationship_context: source.relationship_context,
        note: r.note ?? null,
        ...identityData(p),
        candidate_id: candidateId,
        created_by: actor,
      },
    });
    created += 1;
    ids.push(m.id);
  }
  return { created, existing, staged, ids };
}

export async function commitIntake(
  prisma: PrismaLike,
  input: { workSourceId: string; text: string; kind: IntakeKind; actor: string; now: Date },
): Promise<{ ok: true; created: number; existing: number; staged: number; counts: IntakePreview['counts'] } | { ok: false; reason: string }> {
  const source = await prisma.gapWorkSource.findUnique({ where: { id: input.workSourceId } });
  if (!source) return { ok: false, reason: 'source_not_found' };
  if (source.status !== 'active') return { ok: false, reason: 'source_archived' };
  const preview = await previewIntake(prisma, { text: input.text, kind: input.kind });
  if (preview.parse.error) return { ok: false, reason: preview.parse.error };
  if (preview.rows.length === 0) return { ok: false, reason: 'nothing_to_import' };
  const w = await writeMembers(prisma, source, preview.rows, input.actor);
  await prisma.gapAuditEvent.create({
    data: { kind: 'work_source.imported', actor: input.actor, subject_type: 'work_source', subject_id: source.id, payload: { kind: input.kind, format: preview.parse.format, counts: preview.counts, created: w.created, existing: w.existing, staged: w.staged, skipped: preview.parse.skipped, unmappedColumns: preview.parse.unmappedColumns } },
  });
  return { ok: true, created: w.created, existing: w.existing, staged: w.staged, counts: preview.counts };
}

/** The current source (conference mode): the active source most recently made current. */
export async function currentWorkSource(prisma: PrismaLike): Promise<{ id: string; name: string; relationship_context: string | null } | null> {
  return prisma.gapWorkSource.findFirst({ where: { status: 'active', current_at: { not: null } }, orderBy: { current_at: 'desc' } });
}

export async function setCurrentWorkSource(prisma: PrismaLike, input: { workSourceId: string; actor: string; now: Date }): Promise<{ ok: boolean; reason?: string }> {
  const s = await prisma.gapWorkSource.findUnique({ where: { id: input.workSourceId } });
  if (!s || s.status !== 'active') return { ok: false, reason: 'source_not_found' };
  await prisma.gapWorkSource.update({ where: { id: s.id }, data: { current_at: input.now } });
  await prisma.gapAuditEvent.create({ data: { kind: 'work_source.current', actor: input.actor, subject_type: 'work_source', subject_id: s.id, payload: { name: s.name } } });
  return { ok: true };
}

/** One person from a phone: name + company (+ title, note), into the current source. */
export async function addPerson(
  prisma: PrismaLike,
  input: { name: string; company?: string | null; title?: string | null; email?: string | null; linkedinUrl?: string | null; note?: string | null; workSourceId?: string | null; actor: string; now: Date },
): Promise<{ ok: true; workSourceId: string; memberId: string; resolution: string; accountName: string | null; buyerWords: boolean } | { ok: false; reason: string }> {
  const name = input.name?.trim();
  if (!name) return { ok: false, reason: 'name_required' };
  let source = input.workSourceId ? await prisma.gapWorkSource.findUnique({ where: { id: input.workSourceId } }) : await currentWorkSource(prisma);
  if (input.workSourceId && (!source || source.status !== 'active')) return { ok: false, reason: 'source_not_found' };
  if (!source) {
    source = await prisma.gapWorkSource.findFirst({ where: { status: 'active', name: PEOPLE_I_MET } });
    if (!source) {
      const created = await createWorkSource(prisma, { name: PEOPLE_I_MET, sourceType: 'relationship', relationshipContext: 'Casey met them', actor: input.actor });
      if (!created.ok) return created;
      source = await prisma.gapWorkSource.findUnique({ where: { id: created.id } });
    }
  }
  const raw: Record<string, string> = { name };
  for (const [k, v] of Object.entries({ company: input.company, title: input.title, email: input.email, linkedin_url: input.linkedinUrl, note: input.note })) if (v?.trim()) raw[k] = v.trim();
  const row: IntakeRow = { kind: 'person', name, raw, ...(input.company?.trim() ? { company: input.company.trim() } : {}), ...(input.title?.trim() ? { title: input.title.trim() } : {}), ...(input.email?.trim() ? { email: input.email.trim() } : {}), ...(input.linkedinUrl?.trim() ? { linkedinUrl: input.linkedinUrl.trim() } : {}), ...(input.note?.trim() ? { note: input.note.trim() } : {}) };
  const ctx = await loadIntakeContext(prisma);
  const p: PreviewRow = { row, key: memberKey(row), resolved: resolveIntakeRow(ctx, row) };
  const w = await writeMembers(prisma, source, [p], input.actor);
  await prisma.gapAuditEvent.create({ data: { kind: 'work_source.person_added', actor: input.actor, subject_type: 'work_source', subject_id: source.id, payload: { memberId: w.ids[0], resolution: p.resolved.resolution, accountName: p.resolved.accountName } } });
  return { ok: true, workSourceId: source.id, memberId: w.ids[0], resolution: p.resolved.resolution, accountName: p.resolved.accountName, buyerWords: soundsLikeBuyerWords(input.note) };
}

export async function setMemberStatus(prisma: PrismaLike, input: { memberId: string; status: MemberStatus; actor: string }): Promise<{ ok: boolean; reason?: string }> {
  if (!MEMBER_STATUSES.includes(input.status)) return { ok: false, reason: 'invalid_status' };
  const m = await prisma.gapWorkSourceMember.findUnique({ where: { id: input.memberId } });
  if (!m) return { ok: false, reason: 'member_not_found' };
  await prisma.gapWorkSourceMember.update({ where: { id: m.id }, data: { status: input.status } });
  await prisma.gapAuditEvent.create({ data: { kind: 'work_source.member_status', actor: input.actor, subject_type: 'work_source_member', subject_id: m.id, payload: { from: m.status, to: input.status } } });
  return { ok: true };
}
