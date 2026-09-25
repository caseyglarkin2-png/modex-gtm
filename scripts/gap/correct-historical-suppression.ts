/**
 * Correct individually PROVEN false historical suppressions (final pass, 2026-09-25).
 *
 *   npx tsx scripts/gap/correct-historical-suppression.ts                 # dry run (default)
 *   npx tsx scripts/gap/correct-historical-suppression.ts --apply         # write
 *   npx tsx scripts/gap/correct-historical-suppression.ts --revert        # undo exactly what --apply did
 *
 * Reads the evidence manifest docs/gap/suppression-correction-2026-09-25.json.
 * NOT a bulk unsuppress: only the persona ids named there, each with its own
 * evidence (see docs/gap/suppression-audit-2026-09-25.md for how each was
 * proven). Every precondition is re-verified LIVE before any write, and a
 * row that no longer matches is skipped, never forced:
 *
 *   - the persona row still has do_not_contact = true, email_status =
 *     'bounced' and the manifest's exact email (the state being corrected)
 *   - no unsubscribed_emails row for the address (case-insensitive)
 *   - clawd's cross-plane contract answers blocked with keys EXACTLY
 *     ['modex_do_not_contact']: no HubSpot opt-out, SendGrid list, clawd
 *     do_not_send or verbal DNC on any other plane
 *
 * The write is raw SQL that deliberately does NOT touch updated_at: the
 * sync-hubspot cron pushes every persona updated in the last 6 hours to
 * HubSpot, and this pass is not authorized to write HubSpot. It sets
 * do_not_contact = false and email_status = 'unverified' (the bounce type was
 * never recorded, so 'unverified' is the honest status), and appends one
 * GapAuditEvent `suppression.corrected` per person carrying the before/after
 * state and the evidence. --revert restores the before state from those
 * receipts and appends `suppression.correction_reverted`.
 *
 * HUBSPOT_ACCESS_TOKEN is deleted from the environment before anything loads.
 */
delete process.env.HUBSPOT_ACCESS_TOKEN;

import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const MANIFEST = 'docs/gap/suppression-correction-2026-09-25.json';
const CLAWD = process.env.CLAWD_CONTROL_PLANE_URL?.trim() || 'https://clawd-control-plane-production.up.railway.app';
const TOKEN = process.env.CLAWD_CONTROL_PLANE_TOKEN?.trim() || process.env.MC_API_TOKEN?.trim() || '';
const ACTOR = 'gap-final-pass:correct-historical-suppression';

interface Entry {
  personaId: number;
  email: string;
  account: string;
  name: string;
  tier: 'A' | 'B';
  evidence: string[];
}

interface Precheck {
  personaId: number;
  email: string;
  ok: boolean;
  why: string[];
}

const mode = process.argv.includes('--revert') ? 'revert' : process.argv.includes('--apply') ? 'apply' : 'dry-run';
const prisma = new PrismaClient();

async function contractKeys(emails: string[]): Promise<Map<string, { blocked: boolean; keys: string[]; unknown: string[] }>> {
  if (!TOKEN) throw new Error('no clawd token (CLAWD_CONTROL_PLANE_TOKEN or MC_API_TOKEN); refusing: an unread contract is not clear');
  const res = await fetch(`${CLAWD}/api/suppression/contract`, {
    method: 'POST',
    headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ emails, automated: true }),
  });
  const body = (await res.json()) as { ok?: boolean; results?: Array<{ email: string; blocked: boolean; keys?: string[]; unknown_legs?: string[] }> };
  if (!res.ok || body.ok !== true || !Array.isArray(body.results) || body.results.length !== emails.length) {
    throw new Error(`clawd contract unreadable (HTTP ${res.status}); refusing`);
  }
  return new Map(body.results.map((r) => [r.email.toLowerCase(), { blocked: r.blocked, keys: r.keys ?? [], unknown: r.unknown_legs ?? [] }]));
}

async function precheck(entries: Entry[]): Promise<Precheck[]> {
  const contract = await contractKeys(entries.map((e) => e.email.toLowerCase()));
  const out: Precheck[] = [];
  for (const e of entries) {
    const why: string[] = [];
    const rows = (await prisma.$queryRawUnsafe(
      `select id, lower(email) email, do_not_contact, email_status from personas where id = $1`,
      e.personaId,
    )) as Array<{ id: number; email: string | null; do_not_contact: boolean; email_status: string | null }>;
    const p = rows[0];
    if (!p) why.push('persona_not_found');
    else {
      if (p.email !== e.email.toLowerCase()) why.push(`email_changed:${p.email}`);
      if (p.do_not_contact !== true) why.push('already_not_dnc');
      if (p.email_status !== 'bounced') why.push(`status_not_bounced:${p.email_status}`);
    }
    const unsub = (await prisma.$queryRawUnsafe(`select count(*)::int n from unsubscribed_emails where lower(email) = lower($1)`, e.email)) as Array<{ n: number }>;
    if ((unsub[0]?.n ?? 0) > 0) why.push('unsubscribed_row_exists');
    const c = contract.get(e.email.toLowerCase());
    if (!c) why.push('contract_no_verdict');
    else {
      if (c.unknown.length > 0) why.push(`contract_unknown_legs:${c.unknown.join('+')}`);
      if (c.keys.join(',') !== 'modex_do_not_contact') why.push(`contract_keys:${c.keys.join('+') || 'none'}`);
    }
    out.push({ personaId: e.personaId, email: e.email, ok: why.length === 0, why });
  }
  return out;
}

async function apply(entries: Entry[]) {
  const checks = await precheck(entries);
  const now = new Date().toISOString();
  for (const c of checks) {
    const e = entries.find((x) => x.personaId === c.personaId)!;
    if (!c.ok) {
      console.log(`SKIP  ${e.personaId} ${e.email}  ${c.why.join(', ')}`);
      continue;
    }
    if (mode === 'dry-run') {
      console.log(`WOULD ${e.personaId} ${e.email} (${e.account}, tier ${e.tier}): do_not_contact true->false, email_status bounced->unverified`);
      continue;
    }
    await prisma.$transaction(async (tx) => {
      const n = await tx.$executeRawUnsafe(
        `update personas set do_not_contact = false, email_status = 'unverified'
           where id = $1 and do_not_contact = true and email_status = 'bounced' and lower(email) = lower($2)`,
        e.personaId,
        e.email,
      );
      if (n !== 1) throw new Error(`persona ${e.personaId}: expected 1 row, updated ${n}`);
      await tx.gapAuditEvent.create({
        data: {
          kind: 'suppression.corrected',
          actor: ACTOR,
          subject_type: 'persona',
          subject_id: String(e.personaId),
          payload: {
            email: e.email.toLowerCase(),
            account: e.account,
            name: e.name,
            before: { do_not_contact: true, email_status: 'bounced' },
            after: { do_not_contact: false, email_status: 'unverified' },
            class: 'soft_deliverability',
            tier: e.tier,
            evidence: e.evidence,
            precheck: 'contract keys exactly [modex_do_not_contact]; no unsubscribed_emails row; row state matched',
            manifest: MANIFEST,
            correctedAt: now,
            updatedAtUntouched: true,
          },
        },
      });
    });
    console.log(`DONE  ${e.personaId} ${e.email}`);
  }
}

async function revert() {
  const receipts = (await prisma.gapAuditEvent.findMany({
    where: { kind: 'suppression.corrected', actor: ACTOR },
    orderBy: { created_at: 'asc' },
  })) as Array<{ id: string; subject_id: string; payload: { email: string } }>;
  for (const r of receipts) {
    await prisma.$transaction(async (tx) => {
      const n = await tx.$executeRawUnsafe(
        `update personas set do_not_contact = true, email_status = 'bounced' where id = $1 and lower(email) = lower($2)`,
        Number(r.subject_id),
        r.payload.email,
      );
      await tx.gapAuditEvent.create({
        data: { kind: 'suppression.correction_reverted', actor: ACTOR, subject_type: 'persona', subject_id: r.subject_id, payload: { receipt: r.id, rows: n } },
      });
    });
    console.log(`REVERTED ${r.subject_id} ${r.payload.email}`);
  }
}

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as { entries: Entry[] };
  console.log(`mode=${mode} entries=${manifest.entries.length}`);
  if (mode === 'revert') await revert();
  else await apply(manifest.entries);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
