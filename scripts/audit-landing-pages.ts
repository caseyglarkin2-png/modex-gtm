import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.account.findMany({ select: { name: true }, orderBy: { rank: 'asc' } });
  const onePagers = await prisma.generatedContent.findMany({ where: { content_type: 'one_pager' }, select: { account_name: true }, distinct: ['account_name'] });
  const onePagerSet = new Set(onePagers.map((e: { account_name: string }) => e.account_name));
  
  console.log('TOTAL ACCOUNTS:', accounts.length);
  console.log('HAVE ONE-PAGER:', onePagerSet.size);
  console.log('');
  console.log('=== ACCOUNTS WITH ONE-PAGERS ===');
  accounts.filter((a: { name: string }) => onePagerSet.has(a.name)).forEach((a: { name: string }) => {
    const slug = a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    console.log('  OK', slug, '-', a.name);
  });
  console.log('');
  console.log('=== ACCOUNTS MISSING ONE-PAGERS ===');
  accounts.filter((a: { name: string }) => !onePagerSet.has(a.name)).forEach((a: { name: string }) => {
    const slug = a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    console.log('  MISSING', slug, '-', a.name);
  });

  // Also count personas
  const personas = await prisma.persona.findMany({ select: { email: true } });
  console.log('');
  console.log('TOTAL PERSONAS:', personas.length);
  
  await prisma.$disconnect();
}
main();
