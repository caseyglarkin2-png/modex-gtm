const fs = require('fs');
const personas = JSON.parse(fs.readFileSync('src/lib/data/personas.json', 'utf8'));
const accounts = JSON.parse(fs.readFileSync('src/lib/data/accounts.json', 'utf8'));

const byAcct = {};
for (const p of personas) {
  if (!byAcct[p.account]) byAcct[p.account] = [];
  byAcct[p.account].push({
    name: p.name,
    title: p.title,
    seniority: p.seniority,
    lane: p.persona_lane,
    priority: p.priority,
    status: p.persona_status,
    hasEmail: !!p.email,
    roleInDeal: p.role_in_deal
  });
}

for (const a of accounts.sort((x, y) => y.priority_score - x.priority_score)) {
  const ps = byAcct[a.name] || [];
  const withEmail = ps.filter(p => p.hasEmail).length;
  const p1 = ps.filter(p => p.priority === 'P1').length;
  const clevel = ps.filter(p => p.seniority && (p.seniority.includes('C-level') || p.seniority.includes('EVP') || p.seniority.includes('SVP'))).length;
  const decisionMakers = ps.filter(p => p.roleInDeal === 'Decision-maker').length;
  console.log(`${a.name} | score:${a.priority_score} band:${a.priority_band} | personas:${ps.length} email:${withEmail} P1:${p1} C-level:${clevel} DMs:${decisionMakers} | showcase:${a.showcase || false}`);
  for (const p of ps) {
    console.log(`  ${p.name} | ${(p.title || '').substring(0, 55)} | ${p.seniority} | ${p.lane} | ${p.roleInDeal} | email:${p.hasEmail}`);
  }
}
