/**
 * Complete a GAP contact's name from its OWN linked HubSpot contact (WHO truth maintenance, 2026-10-05): a record
 * that holds a fragment ("Jeffrey") while HubSpot holds the full name. Reads the linked contact only; writes the
 * name fields with raw SQL that never touches updated_at (the sync-hubspot cron pushes every persona updated in the
 * last 6 hours to HubSpot, and this is not a HubSpot write); one 'person.record_corrected' audit row. Dry run by
 * default; refuses when the record is not linked, when HubSpot has no fuller name, or when the names disagree on the
 * first name.
 *
 *   npx tsx --env-file=<.env.local> scripts/gap/correct-persona-name-from-hubspot.ts --persona 2187 [--apply]
 */
import { PrismaClient } from '@prisma/client';
import { normalizeName, splitName } from '../../src/lib/contact-standard';

const prisma = new PrismaClient();

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && i + 1 < process.argv.length && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : null;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const personaId = Number(arg('persona'));
  if (!Number.isInteger(personaId) || personaId <= 0) throw new Error('--persona <id> is required');
  const actor = arg('actor') ?? 'who-truth:correct-persona-name-from-hubspot';
  const p = await prisma.persona.findUnique({ where: { id: personaId }, select: { id: true, name: true, first_name: true, last_name: true, account_name: true, hubspot_contact_id: true } });
  if (!p) throw new Error(`no persona ${personaId}`);
  if (!p.hubspot_contact_id) throw new Error(`persona ${personaId} is not linked to a HubSpot contact; nothing to read`);
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error('HUBSPOT_ACCESS_TOKEN is required to READ the linked contact');
  const res = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${encodeURIComponent(p.hubspot_contact_id)}?properties=firstname,lastname`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`HubSpot read failed (${res.status})`);
  const body = (await res.json()) as { properties?: { firstname?: string | null; lastname?: string | null } };
  const first = (body.properties?.firstname ?? '').trim();
  const last = (body.properties?.lastname ?? '').trim();
  const full = [first, last].filter(Boolean).join(' ');
  console.log(`${apply ? 'APPLY' : 'DRY RUN'}: persona ${p.id} at ${p.account_name}: GAP "${p.name}" / HubSpot ${p.hubspot_contact_id} "${full}"`);
  if (!full || full.length <= p.name.trim().length) {
    console.log('  nothing to complete: HubSpot holds no fuller name.');
    return;
  }
  const gapFirst = splitName(p.name).firstName || p.name.trim().split(/\s+/)[0];
  if (gapFirst.toLowerCase() !== first.toLowerCase()) {
    console.log(`  REFUSED: the first names disagree ("${gapFirst}" versus "${first}"); not the same person by name, review by hand.`);
    process.exitCode = 1;
    return;
  }
  if (!apply) {
    console.log(`  would set name "${full}", first_name "${first}", last_name "${last}", normalized_name "${normalizeName(full)}" (updated_at untouched). Re-run with --apply.`);
    return;
  }
  await prisma.$transaction(async (tx) => {
    const n = await tx.$executeRawUnsafe('update personas set name = $1, first_name = $2, last_name = $3, normalized_name = $4 where id = $5 and name = $6', full, first, last, normalizeName(full) || null, p.id, p.name);
    if (n !== 1) throw new Error(`expected 1 row, updated ${n}`);
    await tx.gapAuditEvent.create({
      data: {
        kind: 'person.record_corrected',
        actor,
        subject_type: 'persona',
        subject_id: String(p.id),
        payload: { field: 'name', before: { name: p.name, first_name: p.first_name, last_name: p.last_name }, after: { name: full, first_name: first, last_name: last }, source: `linked HubSpot contact ${p.hubspot_contact_id}`, at: new Date().toISOString(), updatedAtUntouched: true, hubspotWritten: false },
      },
    });
  });
  console.log(`  done: "${p.name}" is now "${full}" (audited; HubSpot not written; updated_at untouched).`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
