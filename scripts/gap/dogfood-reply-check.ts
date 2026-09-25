import { PrismaClient } from '@prisma/client';
import { loadReplyBacklog } from '../../src/lib/gap/learning/reply-backlog';
const prisma = new PrismaClient();
async function main() {
  const backlog = await loadReplyBacklog(prisma, new Date());
  console.log('GAP-attributed reply backlog:', JSON.stringify(backlog));
  const total = await prisma.inboundMessage.count();
  console.log('total InboundMessage rows (unfiltered):', total);
}
main().finally(() => prisma.$disconnect());
