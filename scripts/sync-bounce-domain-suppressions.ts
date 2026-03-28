import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MIN_BOUNCES = 3;
const PROTECTED_ALLOWED = new Set(['gmail.com', 'outlook.com', 'yahoo.com']);

async function main() {
  const rows = await prisma.$queryRawUnsafe<Array<{ domain: string; bounces: number }>>(
    `SELECT split_part(to_email,'@',2) AS domain, COUNT(*)::int AS bounces
     FROM email_logs
     WHERE status = 'bounced'
     GROUP BY domain
     HAVING COUNT(*) >= ${MIN_BOUNCES}
     ORDER BY bounces DESC`
  );

  const domains = rows
    .map(row => row.domain.toLowerCase())
    .filter(domain => domain && !PROTECTED_ALLOWED.has(domain));

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
    topDomains: rows.slice(0, 20),
  }, null, 2));

  await prisma.$disconnect();
}

main().catch(async err => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
