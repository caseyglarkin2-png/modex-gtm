/**
 * Record ONE source-backed current-role verification for a person (WHO truth maintenance, 2026-10-05), exactly as
 * VERIFY CURRENT ROLE would after a grounded search, but from evidence a human already read: a persona (the
 * enrichment fields plus the two audit rows) or a HubSpot-only contact (the one person.role_verified audit row).
 * The URL's tier decides the weight (a profile or the employer's page is strong; an aggregator is supporting; no
 * URL asserts nothing). Never a Persona, never HubSpot, never Apollo, never do-not-contact. Dry run by default.
 *
 *   npx tsx --env-file=<.env.local> scripts/gap/record-role-evidence.ts \
 *     --hubspot-contact 220050715039 --account "Walmart Inc." --name "Christina Mannella" \
 *     --stored-title "Sr Director - West Transportation Command Center" \
 *     --verdict different_role --title "" --prior-title "Sr Director - West Transportation Command Center" \
 *     --url https://www.linkedin.com/in/christian-burton-57161518b/ --source-date "" \
 *     --summary "Christian Burton now leads the West Transportation Command Center; she was promoted." \
 *     --provider web_search --actor "who-truth:lead" --domains walmart.com [--apply]
 *   ... --persona 2187 ... (a GAP contact: the fields are written too; a human correction is never overwritten)
 */
import { PrismaClient } from '@prisma/client';
import { accountEmploymentContext, recordEmploymentVerification, recordHubSpotContactRoleVerification, type RoleVerificationInput } from '../../src/lib/gap/people/employment-store';
import type { RoleVerdict } from '../../src/lib/gap/people/employment-verify';

delete process.env.HUBSPOT_ACCESS_TOKEN;
const prisma = new PrismaClient();

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && i + 1 < process.argv.length && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : null;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const personaId = arg('persona') ? Number(arg('persona')) : null;
  const hubspotContactId = arg('hubspot-contact');
  const accountName = arg('account');
  const name = arg('name');
  const verdict = arg('verdict') as RoleVerdict | null;
  const provider = (arg('provider') ?? 'web_search') as RoleVerificationInput['provider'];
  if ((personaId === null) === (hubspotContactId === null)) throw new Error('exactly one of --persona or --hubspot-contact');
  if (!accountName || !name || !verdict) throw new Error('--account, --name and --verdict are required');
  if (!['same_role', 'different_role', 'left', 'conflict', 'unknown'].includes(verdict)) throw new Error(`bad verdict ${verdict}`);
  const url = arg('url');
  if (!url && provider !== 'human') throw new Error('--url is required unless --provider human (no source, no assertion)');
  const verification: RoleVerificationInput = {
    verdict,
    company: arg('company') ?? (verdict === 'left' ? null : accountName),
    title: arg('title') || null,
    priorTitle: arg('prior-title') || null,
    sourceUrl: url,
    sourceDate: arg('source-date') || null,
    confidence: (arg('confidence') as 'high' | 'medium' | 'low' | null) ?? 'high',
    summary: arg('summary') || null,
    provider,
  };
  const actor = arg('actor') ?? 'who-truth:record-role-evidence';
  const now = new Date();
  const ctx = await accountEmploymentContext(prisma, accountName).catch(() => ({ aliases: [] as string[], domains: [] as string[] }));
  const domains = [...new Set([...ctx.domains, ...(arg('domains') ?? '').split(',').map((d) => d.trim()).filter(Boolean)])];
  console.log(`${apply ? 'APPLY' : 'DRY RUN'}: ${personaId !== null ? `persona ${personaId}` : `HubSpot contact ${hubspotContactId}`} at ${accountName}: ${name}`);
  console.log(`  verdict ${verdict}; title ${verification.title ?? '(not established)'}; prior ${verification.priorTitle ?? '(none)'}; url ${url ?? '(none)'}; provider ${provider}; actor ${actor}; domains ${domains.join(', ') || '(none)'}`);
  if (!apply) {
    console.log('dry run: nothing written. Re-run with --apply to record.');
    return;
  }
  if (personaId !== null) {
    const r = await recordEmploymentVerification(prisma, { personaId, actor, now, ...verification, companyDomains: domains });
    if (!r.ok) {
      console.log(`  REFUSED: ${r.reason}`);
      process.exitCode = 1;
      return;
    }
    console.log(`  recorded ${r.recorded}; audit ${r.auditId}; employment ${r.read.state}; role ${r.role.state} (${r.role.effectiveTitle ?? 'title unknown'})`);
  } else {
    const r = await recordHubSpotContactRoleVerification(prisma, { hubspotContactId: hubspotContactId!, accountName, name, storedTitle: arg('stored-title') || null, actor, now, verification, companyDomains: domains });
    console.log(`  recorded ${r.recorded}; audit ${r.auditId}; evidence ${r.evidence.kind} / ${r.evidence.tier}${r.evidence.roleChanged ? ' (role changed)' : ''}`);
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
