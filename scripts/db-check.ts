import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
  const [ac, pc] = await Promise.all([p.account.count(), p.persona.count()]);
  const bands = await p.account.groupBy({ by: ['priority_band'], _count: true, orderBy: { priority_band: 'asc' } });
  const noP = await p.account.findMany({ where: { personas: { none: {} } }, select: { name: true } });
  console.log('Accounts:', ac, '| Personas:', pc);
  console.log('Bands:', bands.map((b: {priority_band:string;_count:number}) => b.priority_band+':'+b._count).join(' | '));
  console.log('Accounts with no personas (' + noP.length + '):', noP.map((a:{name:string})=>a.name).join(', '));
  await p.$disconnect();
}
run().catch(async e => { console.error(e.message); await p.$disconnect(); process.exit(1); });
