import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MIN_BOUNCES = 3;
const PROTECTED_ALLOWED = new Set(['gmail.com', 'outlook.com', 'yahoo.com']);

type DomainBounceSummary = {
  domain: string;
  bounces: number;
  last_bounced_at: Date | null;
  last_positive_at: Date | null;
};

async function main() {
  const rows = await prisma.$queryRawUnsafe<DomainBounceSummary[]>(
    `SELECT
        split_part(to_email,'@',2) AS domain,
        COUNT(*) FILTER (WHERE status = 'bounced')::int AS bounces,
        MAX(CASE WHEN status = 'bounced' THEN sent_at END) AS last_bounced_at,
        MAX(CASE WHEN status IN ('sent','delivered','opened','clicked') THEN sent_at END) AS last_positive_at
     FROM email_logs
     GROUP BY domain
     HAVING COUNT(*) FILTER (WHERE status = 'bounced') >= ${MIN_BOUNCES}
     ORDER BY bounces DESC`
  );

  const summaries = rows
    .map((row) => {
      const domain = row.domain.toLowerCase();
      const recoveredAfterBounce = Boolean(
        row.last_bounced_at && row.last_positive_at && row.last_positive_at > row.last_bounced_at
      );

      return {
        ...row,
        domain,
        recoveredAfterBounce,
      };
    })
    .filter((row) => row.domain && !PROTECTED_ALLOWED.has(row.domain));

  const domains = summaries
    .filter((row) => !row.recoveredAfterBounce)
    .map((row) => row.domain);

  await prisma.listsConfig.deleteMany({ where: { key: 'blocked_domain' } });

  if (domains.length > 0) {
    await prisma.listsConfig.createMany({
      data: domains.map(domain => ({ key: 'blocked_domain', value: domain })),
      skipDuplicates: true,
    });
  }

  console.log(JSON.stringify({
    minBounces: MIN_BOUNCES,
    suppressedDomains: domains.length,
    blockedDomains: summaries.filter((row) => !row.recoveredAfterBounce),
    recoveredDomains: summaries.filter((row) => row.recoveredAfterBounce),
  }, null, 2));

  await prisma.$disconnect();
}

main().catch(async err => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
