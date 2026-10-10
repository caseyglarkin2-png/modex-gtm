/**
 * RECORD AN OPT-OUT THE BUYER STATED IN THEIR OWN WORDS, through the one consent writer. DRY RUN BY DEFAULT.
 *
 *   npx tsx scripts/gap/record-opt-out.ts --email timothy.cooper@walmart.com --words "stop" --message 1a10c5b93faff47d --on 2026-10-05
 *   npx tsx scripts/gap/record-opt-out.ts ... --apply   (needs GAP_RECONCILE_APPLY=yes and GAP_RECONCILE_HOST=<db host>)
 *
 * The morning audit of October 10: Tim Cooper (Walmart) wrote "stop" on October 5 and five days later the packet still
 * said "NOT yet on the suppression list", the item returning every day. This records it the way the Capture page's
 * do-not-contact disposition does: `recordUnsubscribe` (src/lib/email/unsubscribe.ts), the only writer of
 * Persona.do_not_contact and of the suppression row, with the reason carrying their words and the message that holds
 * them; the HubSpot opt-out mirror stays as the writer does it by default. Idempotent: an existing row is repaired,
 * never duplicated. Nothing is sent.
 */
import { PrismaClient } from '@prisma/client';
import { recordUnsubscribe } from '../../src/lib/email/unsubscribe';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null; };
const APPLY = process.argv.includes('--apply');

async function main() {
  const email = arg('--email')?.trim().toLowerCase();
  const words = arg('--words')?.trim();
  const message = arg('--message')?.trim();
  const on = arg('--on')?.trim();
  if (!email || !email.includes('@') || !words) throw new Error('--email and --words are required');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const host = new URL(process.env.DATABASE_URL).hostname;
  if (APPLY && (process.env.GAP_RECONCILE_APPLY !== 'yes' || process.env.GAP_RECONCILE_HOST !== host)) throw new Error('--apply needs GAP_RECONCILE_APPLY=yes and GAP_RECONCILE_HOST equal to the database host');
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.unsubscribedEmail.findUnique({ where: { email } });
    const personas = await prisma.persona.findMany({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true, name: true, account_name: true, do_not_contact: true } });
    const reason = `asked not to be contacted in their own words: "${words}"${on ? ` (their message of ${on}` : ''}${message ? `${on ? ', ' : ' ('}Gmail ${message}` : ''}${on || message ? ')' : ''}`;
    console.log(`${APPLY ? 'APPLY' : 'PLAN'}: ${email}; suppression row ${existing ? `exists since ${existing.unsubscribed_at?.toISOString?.() ?? existing.unsubscribed_at}` : 'absent'}; GAP contact rows ${personas.length} (${personas.map((p) => `${p.name} at ${p.account_name}, do_not_contact ${p.do_not_contact}`).join('; ') || 'none'}); reason: ${reason}`);
    if (!APPLY) { console.log('dry run: nothing written'); return; }
    const r = await recordUnsubscribe(prisma, { email, source: 'manual', reason, actor: 'record-opt-out', now: new Date() });
    console.log('result', JSON.stringify(r).slice(0, 400));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });
