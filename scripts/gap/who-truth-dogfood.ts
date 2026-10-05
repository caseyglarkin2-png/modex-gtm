/**
 * READ-ONLY WHO truth dogfood (2026-10-05). For each named account: the one owner resolution the UI reads (cold
 * first touch, or the account's approved person-less hypothesis when --hypotheses is given), with the account kind,
 * the company records searched (primary + verified family), the contacts read, the primary or recommended owner
 * and why, role and employment currentness, the sponsor / tech / site slots, who was set aside and why, alias
 * proposals and suppression conflicts, and the next action. Writes nothing; contacts nobody; spends nothing.
 *
 *   npx tsx --env-file=<.env.local> scripts/gap/who-truth-dogfood.ts "PepsiCo" "FedEx" ...
 *   ... --hypotheses     use each account's newest APPROVED hypothesis with no person (else cold)
 *   ... --json <path>    also write the raw resolutions
 *   ... --markdown <path>  write the receipt table
 */
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { loadOwnerResolution } from '../../src/lib/gap/people/owner-resolution-load';
import type { OwnerCandidate, OwnerResolution } from '../../src/lib/gap/people/owner-resolution';

const prisma = new PrismaClient();

async function resolveName(q: string): Promise<string | null> {
  const exact = await prisma.account.findUnique({ where: { name: q }, select: { name: true } });
  if (exact) return exact.name;
  const near = await prisma.account.findMany({ where: { name: { contains: q, mode: 'insensitive' } }, select: { name: true, hubspot_company_id: true }, take: 5 });
  const pick = [...near].sort((a, b) => Number(!!b.hubspot_company_id) - Number(!!a.hubspot_company_id) || a.name.length - b.name.length)[0];
  return pick?.name ?? null;
}

const who = (c: OwnerCandidate | null | undefined) => (c ? `${c.name}${c.title ? ` (${c.title})` : ''}` : 'none');

interface Row {
  account: string;
  kind: string;
  companies: string;
  contacts: string;
  familyContacts: string;
  owner: string;
  why: string;
  role: string;
  employment: string;
  source: string;
  thesisFit: string;
  sponsor: string;
  tech: string;
  site: string;
  setAside: string;
  alias: string;
  suppression: string;
  action: string;
}

function summarize(name: string, x: OwnerResolution, hubspot: { via: string; detail: string }, family: { searched: string[]; count: number; capHit: boolean; excluded: string[] } | null, aliasProposals: string[], suppression: string[]): Row {
  const top = x.recommended ? x.eligible.find((c) => c.key === x.recommended!.key) ?? x.eligible[0] : x.eligible[0] ?? null;
  const setAside = x.excluded.slice(0, 6).map((e) => `${e.candidate.name}: ${e.code.replace(/_/g, ' ')}`).join('; ') + (x.excluded.length > 6 ? `; +${x.excluded.length - 6} more` : '');
  return {
    account: name,
    kind: `${x.account.kind}${x.account.entityType ? ` (${x.account.entityType})` : ''}`,
    companies: family?.searched.length ? family.searched.join('; ') : hubspot.detail,
    contacts: x.checked.find((c) => /HubSpot contacts/.test(c))?.replace(/^HubSpot contacts \(|\)$/g, '') ?? 'not read',
    familyContacts: family ? `${family.count} from family${family.capHit ? ' (cap hit)' : ''}${family.excluded.length ? `; not read: ${family.excluded.join('; ')}` : ''}` : 'no family read',
    owner: top ? `${x.recommended?.key === top.key ? 'RECOMMENDED ' : x.preselected === top.key ? 'PRESELECTED ' : 'top of the choice: '}${who(top)}` : 'none (find the operator)',
    why: x.recommended?.why ?? top?.reasons[0] ?? x.headline,
    role: top?.role ? `${top.role.state}: ${top.role.why}` : 'ROLE_UNVERIFIED (nothing read)',
    employment: top?.employment ? `${top.employment.state}: ${top.employment.why}` : 'none',
    source: top ? `${top.source}${top.provenance && top.provenance.relation !== 'primary' ? ` via ${top.provenance.accountName} (${top.provenance.relation})` : ''}` : 'none',
    thesisFit: top?.relevance ? `${top.relevance.tier}: ${top.relevance.why}` : 'no hypothesis',
    sponsor: who(x.sponsor),
    tech: who(x.tech),
    site: who(x.site),
    setAside: setAside || 'none',
    alias: aliasProposals.length ? aliasProposals.join('; ') : 'none',
    suppression: suppression.length ? suppression.join('; ') : 'none',
    action: x.nextStep === 'choose' ? `Casey chooses among ${x.eligible.length}${x.recommended ? ' (one recommended)' : ''}` : x.nextStep === 'find_operator' ? 'Find the operator (research)' : x.nextStep === 'add_and_use' ? 'Add + use (one eligible)' : 'Use (one eligible)',
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const take = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : null;
  };
  const jsonPath = take('--json');
  const mdPath = take('--markdown');
  const useHypotheses = argv.includes('--hypotheses');
  const valued = new Set([argv.indexOf('--json'), argv.indexOf('--markdown')].filter((i) => i >= 0).map((i) => i + 1));
  const names = argv.filter((a, i) => !a.startsWith('--') && !valued.has(i));
  const now = new Date();
  const raw: unknown[] = [];
  const rows: Row[] = [];
  try {
    for (const q of names) {
      const name = await resolveName(q);
      if (!name) {
        console.log(`\n## ${q}: no account on record`);
        rows.push({ account: q, kind: 'no account', companies: '', contacts: '', familyContacts: '', owner: '', why: '', role: '', employment: '', source: '', thesisFit: '', sponsor: '', tech: '', site: '', setAside: '', alias: '', suppression: '', action: 'create the account deliberately, or spell it as GAP does' });
        continue;
      }
      let hypothesisId: string | null = null;
      if (useHypotheses) {
        const h = await prisma.prospectingHypothesis.findFirst({ where: { account_name: name, status: 'approved', primary_persona_id: null }, orderBy: { created_at: 'desc' }, select: { id: true } });
        hypothesisId = h?.id ?? null;
      }
      const t0 = Date.now();
      const r = await loadOwnerResolution(prisma, { accountName: name, purpose: hypothesisId ? 'HYPOTHESIS_ACTIVATION' : 'COLD_FIRST_TOUCH', hypothesisId, now });
      if (!r.ok) {
        console.log(`\n## ${name}: ${r.reason}`);
        continue;
      }
      const x = r.resolution;
      const family = (r as { family?: { searched: string[]; count: number; capHit: boolean; excluded: string[] } }).family ?? null;
      const aliasProposals = ((r as { aliasProposals?: Array<{ company: string; canonical: string }> }).aliasProposals ?? []).map((p) => `${p.company} -> ${p.canonical}?`);
      // Suppression conflicts: GAP contacts set aside as do-not-contact whose record carries only the historical bounced status.
      const suppression = x.excluded.filter((e) => e.code === 'do_not_contact' && e.candidate.personaId !== null).map((e) => `${e.candidate.name} (persona ${e.candidate.personaId}): review the legacy flag`);
      raw.push({ account: name, hubspot: r.hubspot, family, resolution: x });
      const row = summarize(name, x, r.hubspot, family, aliasProposals, suppression);
      rows.push(row);
      console.log(`\n## ${name} (${row.kind}) · ${Date.now() - t0}ms`);
      for (const [k, v] of Object.entries(row)) if (k !== 'account' && k !== 'kind') console.log(`  ${k}: ${v}`);
    }
    if (jsonPath) writeFileSync(jsonPath, JSON.stringify(raw, null, 2));
    if (mdPath) {
      const head = ['account', 'kind', 'owner / recommendation', 'current role state', 'family coverage', 'alias issue', 'suppression issue', 'next action'];
      const lines = [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`];
      for (const r of rows) lines.push(`| ${[r.account, r.kind, r.owner, r.role.split(':')[0], r.familyContacts, r.alias, r.suppression, r.action].map((v) => String(v).replace(/\|/g, '/')).join(' | ')} |`);
      writeFileSync(mdPath, `${lines.join('\n')}\n`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
