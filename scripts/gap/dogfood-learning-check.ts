import { PrismaClient } from '@prisma/client';
import { buildLearningReport } from '../../src/lib/gap/learning/query';
const prisma = new PrismaClient();
async function main() {
  const report = await buildLearningReport(prisma, { now: new Date() });
  console.log(JSON.stringify(report, null, 2));
}
main().finally(() => prisma.$disconnect());
