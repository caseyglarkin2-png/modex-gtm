// Quick DB audit - accounts + personas with quality scores
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const p = new PrismaClient();

const accounts = await p.account.findMany({ orderBy: { priority_score: 'desc' } });
console.log(`=== ACCOUNTS (${accounts.length}) ===`);
for (const a of accounts) console.log(`${a.priority_band} | ${String(a.priority_score).padStart(3)} | ${a.name.padEnd(30)} | ${(a.outreach_status||'').padEnd(12)} | ${a.vertical||''}`);

const personas = await p.persona.findMany({ include: { account: true }, orderBy: { account: { priority_score: 'desc' } } });
console.log(`\n=== PERSONAS (${personas.length}) ===`);
const byAcct = {};
for (const pe of personas) {
  const key = pe.account?.name || 'unknown';
  if (!byAcct[key]) byAcct[key] = { band: pe.account?.priority_band, people: [] };
  byAcct[key].people.push(pe);
}
for (const [acct, { band, people }] of Object.entries(byAcct)) {
  console.log(`\n[${band}] ${acct} (${people.length}):`);
  for (const pe of people) {
    const hasName = pe.name && pe.name !== 'Unknown';
    const hasTitle = pe.title && pe.title !== 'Unknown';
    const hasEmail = !!pe.email;
    const quality = (hasName ? 'N' : '_') + (hasTitle ? 'T' : '_') + (hasEmail ? 'E' : '_');
    console.log(`  [${quality}] ${(pe.name||'NO NAME').padEnd(30)} | ${(pe.title||'NO TITLE').padEnd(35)} | ${pe.email||'NO EMAIL'}`);
  }
}
await p.$disconnect();
