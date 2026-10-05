/**
 * Stage ONE source-backed contact candidate for Casey's review (WHO truth maintenance, 2026-10-05): the same row
 * FIND OPERATOR stages from research, but from a public page a human already read (a promotion announcement, a
 * leadership page). Never a Persona, never a HubSpot contact, never an email guess, never Apollo; never
 * recommended by default; idempotent on (account, name, title). Dry run by default.
 *
 *   npx tsx --env-file=<.env.local> scripts/gap/stage-sourced-candidate.ts --account "Walmart Inc." \
 *     --name "Christian Burton" --title "Senior Director, West Transportation Command Center" \
 *     --url https://www.linkedin.com/in/christian-burton-57161518b/ --linkedin https://www.linkedin.com/in/christian-burton-57161518b/ \
 *     --reason "His own post: promoted to Senior Director leading the West Transportation Command Center (Christina Mannella's former organization)." \
 *     --actor who-truth:lead [--apply]
 */
import { PrismaClient } from '@prisma/client';
import { normalizeName, normalizeTitle } from '../../src/lib/contact-standard';

delete process.env.HUBSPOT_ACCESS_TOKEN;
const prisma = new PrismaClient();

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && i + 1 < process.argv.length && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : null;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const accountName = arg('account');
  const name = arg('name');
  const title = arg('title');
  const url = arg('url');
  const reason = arg('reason');
  if (!accountName || !name || !url || !reason) throw new Error('--account, --name, --url and --reason are required');
  if (!/^https?:\/\/\S+\.\S+/i.test(url)) throw new Error('--url must be a public page');
  const account = await prisma.account.findUnique({ where: { name: accountName }, select: { name: true } });
  if (!account) throw new Error(`no GAP account named ${accountName} (never created here)`);
  const key = `${normalizeName(name)}::${normalizeTitle(title ?? '')}`;
  const existing = await prisma.accountContactCandidate.findUnique({ where: { account_name_candidate_key: { account_name: account.name, candidate_key: key } }, select: { id: true, state: true } });
  const actor = arg('actor') ?? 'who-truth:stage-sourced-candidate';
  const now = new Date();
  console.log(`${apply ? 'APPLY' : 'DRY RUN'}: stage ${name}${title ? ` (${title})` : ''} at ${account.name} from ${url}`);
  if (existing) {
    console.log(`  already on record: candidate ${existing.id} (${existing.state}); nothing written.`);
    return;
  }
  if (!apply) {
    console.log('dry run: nothing written. Re-run with --apply to stage.');
    return;
  }
  const row = await prisma.accountContactCandidate.create({
    data: {
      account_name: account.name,
      candidate_key: key,
      full_name: name,
      normalized_name: normalizeName(name),
      title: title ?? null,
      email: null,
      email_valid: false,
      linkedin_url: arg('linkedin') ?? (/linkedin\.com\/in\//i.test(url) ? url : null),
      source: 'web_research',
      source_action: 'who_truth_sourced_candidate',
      source_provider: 'human_web_search',
      source_payload: { name, title, sourceUrl: url, reason, retrievedAt: now.toISOString(), stagedBy: actor, stagedAt: now.toISOString(), apolloSpent: 0, hubspotWritten: false, personaCreated: false } as never,
      recommended: false,
      recommendation_reason: `Source-backed candidate from a public page (${url}); verify the current role and the source before promoting.`,
      state: 'staged',
    },
    select: { id: true },
  });
  console.log(`  staged candidate ${row.id}. Nothing became a GAP contact or a HubSpot record; no Apollo credit was spent.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
