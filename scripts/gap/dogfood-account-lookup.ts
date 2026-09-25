import { PrismaClient } from '@prisma/client';
import { normalizeCompanyName } from '../../src/lib/gap/identity/normalize';
const prisma = new PrismaClient();

const CANDIDATES = [
  'LOW', "Lowe's", 'GXO', 'GXO Logistics', 'PG', 'Procter & Gamble', 'MATX', 'Matson',
  'CL', 'Colgate-Palmolive', 'ARCB', 'ArcBest', 'KNX', 'Knight-Swift', 'JBHT', 'J.B. Hunt',
  'CAG', 'Conagra', 'Conagra Brands', 'SNDR', 'Schneider National', 'Schneider',
  'Loblaw', 'Loblaws', 'Loblaw Companies', 'Walmart', 'Walmart Distribution Center',
  'Target', 'RXO', 'UNFI', 'Niagara Bottling', 'Niagara Bottling Llc', 'Amazon', 'PepsiCo',
  'John Deere', 'The Home Depot', 'FedEx', 'ODFL', 'UPS', 'Kraft Heinz', 'XPO',
  'The Coca-Cola Company', 'Coca-Cola', 'General Mills', 'Kroger',
];

async function main() {
  const allAccounts = await prisma.account.findMany({ select: { name: true, hubspot_company_id: true } });
  const byNormalized = new Map<string, string[]>();
  for (const a of allAccounts) {
    const key = normalizeCompanyName(a.name);
    const arr = byNormalized.get(key) ?? [];
    arr.push(a.name);
    byNormalized.set(key, arr);
  }
  for (const c of CANDIDATES) {
    const key = normalizeCompanyName(c);
    const matches = byNormalized.get(key) ?? [];
    console.log(JSON.stringify({ candidate: c, normalized: key, matches }));
  }
}
main().finally(() => prisma.$disconnect());
