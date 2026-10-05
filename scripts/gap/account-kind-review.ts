/**
 * ACCOUNT KIND REVIEW, read-only diagnostic (enterprise graph, 2026-10-05). For every account whose vertical is
 * "Unknown" (or the named ones), gather the evidence GAP already holds (the latest Scout entity read, the audited
 * site mix from the demo pack, the GAP personas' title mix), run the pure classifier
 * (src/lib/gap/people/account-kind-review.ts) and print, per account:
 *
 *   account | current vertical | proposed vertical | evidence | what changes in WHO doctrine
 *
 * The proposal is ONLY a value from the live vocabulary; carriers and 3PLs both get "3PL / Logistics" because the
 * vocabulary has no separate carrier value (typeFromVertical reads it as 3pl: carrier doctrine in the person prior).
 *
 *   npx tsx --env-file=<.env.local> scripts/gap/account-kind-review.ts                       # every Unknown row with evidence
 *   npx tsx --env-file=<.env.local> scripts/gap/account-kind-review.ts --all                 # include rows with no evidence
 *   npx tsx --env-file=<.env.local> scripts/gap/account-kind-review.ts --accounts "NFI Industries" "J.B. Hunt" "UPS"
 *   npx tsx --env-file=<.env.local> scripts/gap/account-kind-review.ts --json
 *   npx tsx --env-file=<.env.local> scripts/gap/account-kind-review.ts --apply "NFI Industries=3PL / Logistics" "J.B. Hunt=3PL / Logistics"
 *
 * Never mutates by default. --apply updates ONLY the named rows (exact names, exact vocabulary values), one raw
 * `update accounts set vertical = $1 where name = $2 and vertical = 'Unknown'` per row (so a row somebody already
 * set is never overwritten, and updated_at is not bumped), and writes one account.vertical_corrected audit row per
 * row with before / after, the evidence lines and the actor. No HubSpot write (the token is removed from the
 * environment before anything loads), no Apollo, no account created.
 */
delete process.env.HUBSPOT_ACCESS_TOKEN;

import { PrismaClient } from '@prisma/client';
import { loadDemoPack } from '../../src/lib/demo/load-pack';
import { accountSlug } from '../../src/lib/gap/account-intel/href';
import { normalizeCompanyName } from '../../src/lib/gap/identity/normalize';
import { CARRIER_VERTICAL, VERTICAL_VOCABULARY, proposeAccountKind, type AccountKindEvidence, type AccountKindProposal, type Vertical } from '../../src/lib/gap/people/account-kind-review';

const ACTOR = 'who-truth:account-kind-review';
const prisma = new PrismaClient();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function parseArgs(argv: string[]) {
  const flags = new Set<string>();
  const accounts: string[] = [];
  const apply: string[] = [];
  let bucket: 'accounts' | 'apply' | null = null;
  for (const a of argv) {
    if (a === '--accounts') bucket = 'accounts';
    else if (a === '--apply') bucket = 'apply';
    else if (a.startsWith('--')) {
      flags.add(a);
      bucket = null;
    } else if (bucket === 'accounts') accounts.push(a);
    else if (bucket === 'apply') apply.push(a);
    else accounts.push(a);
  }
  return { flags, accounts, apply };
}

async function gather(names: string[] | null): Promise<AccountKindEvidence[]> {
  const accounts: Array<{ name: string; vertical: string | null }> = names
    ? await prisma.account.findMany({ where: { name: { in: names } }, select: { name: true, vertical: true } })
    : await prisma.account.findMany({ where: { vertical: 'Unknown' }, select: { name: true, vertical: true }, orderBy: { name: 'asc' } });
  const list = accounts.map((a) => a.name);
  const keys = list.map((n) => normalizeCompanyName(n));
  const [personas, candidates] = await Promise.all([
    prisma.persona.findMany({ where: { account_name: { in: list } }, select: { account_name: true, title: true } }) as Promise<Row[]>,
    prisma.gapAccountCandidate.findMany({ where: { scouted_at: { not: null }, OR: [{ account_name: { in: list }, decision: { in: ['added', 'mapped'] } }, { company_key: { in: keys } }] }, orderBy: { scouted_at: 'desc' } }) as Promise<Row[]>,
  ]);
  const titles = new Map<string, string[]>();
  for (const p of personas) titles.set(p.account_name, [...(titles.get(p.account_name) ?? []), String(p.title ?? '')]);
  const scoutFor = (name: string): AccountKindEvidence['scout'] => {
    const key = normalizeCompanyName(name);
    const c = candidates.find((x) => x.account_name === name || x.company_key === key);
    if (!c) return null;
    const s = (c.scout ?? {}) as Row;
    return { entityType: c.entity_type ?? null, basis: s.basis === 'name_rules' ? 'name_rules' : 'web', ambiguous: s.ambiguous === true, what: s.what ?? null, at: c.scouted_at ? new Date(c.scouted_at).toISOString() : null };
  };
  const out: AccountKindEvidence[] = [];
  for (const a of accounts) {
    const pack = await loadDemoPack(accountSlug(a.name));
    const sites = (pack?.network?.sites ?? []) as Array<{ verification?: { verdict?: string; operator?: string } }>;
    const kept = sites.filter((s) => s.verification?.verdict !== 'rejected');
    const by = (op: string) => kept.filter((s) => s.verification?.operator === op).length;
    out.push({ accountName: a.name, vertical: a.vertical, scout: scoutFor(a.name), sites: sites.length ? { audited: kept.length, self: by('self'), threePl: by('3PL'), jv: by('JV') } : null, titles: titles.get(a.name) ?? [] });
  }
  return out;
}

const hasEvidence = (e: AccountKindEvidence) => !!e.scout || !!e.sites || e.titles.some((t) => t.trim());

async function applyRows(pairs: string[], proposals: Map<string, AccountKindProposal>) {
  const now = new Date();
  let failed = 0;
  for (const pair of pairs) {
    const i = pair.indexOf('=');
    const name = i > 0 ? pair.slice(0, i).trim() : '';
    const vertical = i > 0 ? pair.slice(i + 1).trim() : '';
    if (!name || !vertical) {
      console.log(`  ${pair}: REFUSED (expected "Account name=Vertical")`);
      failed += 1;
      continue;
    }
    if (!(VERTICAL_VOCABULARY as readonly string[]).includes(vertical) || vertical === 'Unknown') {
      console.log(`  ${name}: REFUSED ("${vertical}" is not in the vocabulary: ${VERTICAL_VOCABULARY.filter((v) => v !== 'Unknown').join(' | ')})`);
      failed += 1;
      continue;
    }
    const proposal = proposals.get(name) ?? proposeAccountKind((await gather([name]))[0] ?? { accountName: name, vertical: null, scout: null, sites: null, titles: [] });
    const row = (await prisma.account.findUnique({ where: { name }, select: { name: true, vertical: true } })) as { name: string; vertical: string } | null;
    if (!row) {
      console.log(`  ${name}: REFUSED (no account row with that exact name)`);
      failed += 1;
      continue;
    }
    if (row.vertical !== 'Unknown') {
      console.log(`  ${name}: SKIPPED (vertical is already "${row.vertical}", not Unknown; this tool only fills Unknown)`);
      continue;
    }
    const n = await prisma.$executeRawUnsafe('update accounts set vertical = $1 where name = $2 and vertical = $3', vertical, name, 'Unknown');
    if (n !== 1) {
      console.log(`  ${name}: SKIPPED (the row changed under us: ${n} rows updated)`);
      continue;
    }
    const audit = (await prisma.gapAuditEvent.create({
      data: { kind: 'account.vertical_corrected', actor: ACTOR, subject_type: 'account', subject_id: name, payload: { before: 'Unknown', after: vertical as Vertical, proposed: proposal.proposed, strength: proposal.strength, evidence: proposal.evidence, doctrine: proposal.doctrine, actor: ACTOR, at: now.toISOString(), hubspotWritten: false } },
      select: { id: true },
    })) as { id: string };
    console.log(`  ${name}: Unknown -> ${vertical} (audit ${audit.id})${proposal.proposed !== vertical ? ` [note: the classifier proposed ${proposal.proposed ?? 'no change'}; Casey's value stands]` : ''}`);
  }
  if (failed) process.exitCode = 1;
}

async function main() {
  const { flags, accounts, apply } = parseArgs(process.argv.slice(2));
  const names = accounts.length ? accounts : apply.length ? apply.map((p) => p.split('=')[0].trim()).filter(Boolean) : null;
  const evidence = await gather(names);
  const proposals = new Map(evidence.map((e) => [e.accountName, proposeAccountKind(e)]));
  const shown = evidence.filter((e) => names || flags.has('--all') || hasEvidence(e));
  if (flags.has('--json')) {
    console.log(JSON.stringify(shown.map((e) => ({ evidence: e, proposal: proposals.get(e.accountName) })), null, 2));
  } else {
    console.log(`account-kind-review: ${evidence.length} account${evidence.length === 1 ? '' : 's'} read (${names ? 'named' : 'vertical Unknown'}), ${shown.length} shown${names || flags.has('--all') ? '' : ' (with evidence; --all for the rest)'}. Read only. Carriers and 3PLs both propose "${CARRIER_VERTICAL}": the vocabulary has no separate carrier value.`);
    console.log('account | current vertical | proposed vertical | evidence | what changes in WHO doctrine');
    for (const e of shown) {
      const p = proposals.get(e.accountName)!;
      console.log(`${p.accountName} | ${p.current} | ${p.proposed ?? '(no change)'} | ${p.evidence.join('; ')} | ${p.doctrine}`);
    }
    const proposed = [...proposals.values()].filter((p) => p.proposed);
    console.log(`\n${proposed.length} proposal${proposed.length === 1 ? '' : 's'}: ${proposed.map((p) => `${p.accountName}=${p.proposed}`).join(', ') || 'none'}.`);
    if (!apply.length) console.log('Nothing written. To correct a row: --apply "Account name=Vertical" (exact name, exact vocabulary value); only rows still Unknown are touched.');
  }
  if (apply.length) {
    console.log(`\nAPPLY (${apply.length} row${apply.length === 1 ? '' : 's'}, actor ${ACTOR}):`);
    await applyRows(apply, proposals);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
