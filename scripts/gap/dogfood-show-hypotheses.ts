import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const rows = await prisma.prospectingHypothesis.findMany({
    where: { created_by: 'gap-dogfood-overnight' },
    select: {
      id: true, account_name: true, problem_family: true, status: true,
      observation: true, problem_hypothesis: true, created_at: true, primary_persona_id: true,
    },
  });
  console.log(JSON.stringify(rows, null, 2));
}
main().finally(() => prisma.$disconnect());
