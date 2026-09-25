/**
 * Deterministic LOCAL Persona contact backfill from HubSpot READ data (final
 * pass, 2026-09-25).
 *
 *   npx tsx scripts/gap/backfill-persona-contact-from-hubspot.ts            # dry run (default)
 *   npx tsx scripts/gap/backfill-persona-contact-from-hubspot.ts --apply
 *
 * Scope: every persona on a routing decision from the last 2 days (the cards
 * Casey is actually looking at). For each persona linked to a HubSpot
 * contact, fill ONLY a local field that is empty, ONLY from the same field in
 * HubSpot, and ONLY when the HubSpot contact's email equals the persona's
 * email (the link is proven, not assumed):
 *
 *   title         <- jobtitle
 *   phone         <- phone, else mobilephone
 *   linkedin_url  <- hs_linkedin_url, only a real linkedin.com/in/ profile URL
 *                    (a search URL or anything else is refused, never guessed)
 *
 * Never overwrites a non-empty local value. Never writes HubSpot (HubSpot is
 * read with a batch READ; nothing else is called). The local write is raw SQL
 * that leaves updated_at alone, because the sync-hubspot cron pushes every
 * persona updated in the last 6 hours back to HubSpot. One GapAuditEvent
 * `persona.contact_backfilled` per persona records before/after/source.
 */
import { PrismaClient } from '@prisma/client';

const APPLY = process.argv.includes('--apply');
const HS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN?.trim() ?? '';
const ACTOR = 'gap-final-pass:backfill-persona-contact';
const prisma = new PrismaClient();

const LINKEDIN_PROFILE_RE = /^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[^/?#\s]+\/?$/i;

interface Row {
  id: number;
  account_name: string;
  name: string;
  email: string | null;
  title: string | null;
  phone: string | null;
  linkedin_url: string | null;
  hubspot_contact_id: string;
}

type Props = Record<string, string | null | undefined>;

const blank = (v: string | null | undefined) => v == null || v.trim() === '';

export function planBackfill(row: Row, hs: Props): Record<string, string> {
  const fill: Record<string, string> = {};
  if (!row.email || !hs.email || row.email.trim().toLowerCase() !== hs.email.trim().toLowerCase()) return fill;
  if (blank(row.title) && !blank(hs.jobtitle)) fill.title = hs.jobtitle!.trim();
  const phone = !blank(hs.phone) ? hs.phone! : !blank(hs.mobilephone) ? hs.mobilephone! : null;
  if (blank(row.phone) && phone) fill.phone = phone.trim();
  const li = (hs.hs_linkedin_url ?? '').trim();
  if (blank(row.linkedin_url) && LINKEDIN_PROFILE_RE.test(li)) fill.linkedin_url = li;
  return fill;
}

async function main() {
  if (!HS_TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN is required for the HubSpot READ');
  const rows = (await prisma.$queryRawUnsafe(`
    select distinct p.id, p.account_name, p.name, p.email, p.title, p.phone, p.linkedin_url, p.hubspot_contact_id
      from routing_decisions d join personas p on p.id = d.persona_id
     where d.created_at > now() - interval '2 days' and p.hubspot_contact_id is not null`)) as Row[];

  const hs = new Map<string, Props>();
  const ids = rows.map((r) => r.hubspot_contact_id);
  for (let i = 0; i < ids.length; i += 100) {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/batch/read', {
      method: 'POST',
      headers: { authorization: `Bearer ${HS_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ properties: ['email', 'jobtitle', 'phone', 'mobilephone', 'hs_linkedin_url'], inputs: ids.slice(i, i + 100).map((id) => ({ id })) }),
    });
    if (!res.ok) throw new Error(`HubSpot batch read failed (${res.status})`);
    const body = (await res.json()) as { results?: Array<{ id: string; properties: Props }> };
    for (const r of body.results ?? []) hs.set(r.id, r.properties);
  }

  let planned = 0;
  for (const row of rows) {
    const props = hs.get(row.hubspot_contact_id);
    if (!props) continue;
    const fill = planBackfill(row, props);
    const keys = Object.keys(fill);
    if (keys.length === 0) continue;
    planned += 1;
    console.log(`${APPLY ? 'FILL ' : 'WOULD'} ${row.id} ${row.account_name} / ${row.name}: ${keys.map((k) => `${k}=${fill[k]}`).join('; ')}`);
    if (!APPLY) continue;
    const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const guards = keys.map((k) => `(${k} is null or btrim(${k}) = '')`).join(' and ');
    await prisma.$transaction(async (tx) => {
      const n = await tx.$executeRawUnsafe(`update personas set ${sets} where id = $1 and ${guards}`, row.id, ...keys.map((k) => fill[k]));
      if (n !== 1) throw new Error(`persona ${row.id}: expected 1 row, updated ${n}`);
      await tx.gapAuditEvent.create({
        data: {
          kind: 'persona.contact_backfilled',
          actor: ACTOR,
          subject_type: 'persona',
          subject_id: String(row.id),
          payload: {
            source: 'hubspot_read',
            hubspotContactId: row.hubspot_contact_id,
            matchedOn: 'email',
            before: Object.fromEntries(keys.map((k) => [k, (row as unknown as Record<string, unknown>)[k] ?? null])),
            after: fill,
            updatedAtUntouched: true,
          },
        },
      });
    });
  }
  console.log(`mode=${APPLY ? 'apply' : 'dry-run'} personas=${rows.length} withHubSpot=${hs.size} ${APPLY ? 'filled' : 'would fill'}=${planned}`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
