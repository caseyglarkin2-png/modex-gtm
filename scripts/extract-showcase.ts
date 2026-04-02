import { getAllAccountMicrositeData } from '@/lib/microsites/accounts';

const accounts = getAllAccountMicrositeData();
const showcase = accounts.filter(a => a.showcase).sort((a, b) => (a.showcaseOrder ?? 99) - (b.showcaseOrder ?? 99));

for (const a of showcase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`ACCOUNT: ${a.accountName} | slug: ${a.slug} | order: ${a.showcaseOrder}`);
  console.log(`Band: ${a.band} | Score: ${a.priorityScore} | Accent: ${a.theme?.accentColor}`);
  console.log(`Layout: ${a.layout || 'default'}`);
  console.log(`Sections: ${a.sections.map(s => s.type).join(', ')}`);
  
  const hero = a.sections.find(s => s.type === 'hero') as any;
  const problem = a.sections.find(s => s.type === 'problem') as any;
  const proofSections = a.sections.filter(s => s.type === 'proof' || s.type === 'testimonial') as any[];
  const ctaSections = a.sections.filter(s => s.type === 'cta' || s.type === 'final-cta') as any[];
  const solution = a.sections.find(s => s.type === 'solution') as any;
  
  if (hero) {
    console.log(`\nHERO: ${hero.headline}`);
    console.log(`  Sub: ${(hero.subheadline || '').substring(0, 180)}`);
  }
  if (problem) {
    console.log(`\nPROBLEM: ${problem.headline}`);
  }
  for (const p of proofSections) {
    if (p.quote) {
      const q = typeof p.quote === 'string' ? p.quote : p.quote?.text;
      const attr = typeof p.quote === 'string' ? '' : p.quote?.company;
      console.log(`\nPROOF QUOTE: "${(q || '').substring(0, 140)}"`);
      if (attr) console.log(`  Attribution: ${attr}`);
    }
    if (p.items) {
      for (const item of (p as any).items) {
        if (item.quote) {
          const q = typeof item.quote === 'string' ? item.quote : item.quote?.text;
          console.log(`  PROOF ITEM: "${(q || '').substring(0, 120)}"`);
        }
      }
    }
  }
  for (const c of ctaSections) {
    console.log(`\nCTA: ${c.headline} | Button: ${c.buttonLabel}`);
  }
  
  if (solution?.modules) {
    console.log(`\nMODULES (${solution.modules.length}):`);
    for (const m of solution.modules) {
      console.log(`  ${m.id || m.name}: ${(m.relevance || m.description || '').substring(0, 90)}`);
    }
  }
  
  console.log(`\nPERSON VARIANTS: ${a.personVariants?.length || 0}`);
  if (a.personVariants && a.personVariants.length > 0) {
    for (const v of a.personVariants) {
      const ctaLabel = v.ctaOverride?.buttonLabel || 'default';
      console.log(`  ${v.slug} | ${v.person?.name} (${(v.person?.title || '').substring(0,60)}) | CTA: ${ctaLabel}`);
      console.log(`    Hero: ${(v.heroOverride?.headline || '').substring(0, 120)}`);
    }
  }
}

// Non-showcase accounts summary
console.log(`\n${'='.repeat(60)}`);
console.log(`NON-SHOWCASE ACCOUNTS:`);
const nonShowcase = accounts.filter(a => !a.showcase).sort((a, b) => b.priorityScore - a.priorityScore);
for (const a of nonShowcase) {
  console.log(`  ${a.slug} | Band ${a.band} | Score ${a.priorityScore} | Variants: ${a.personVariants?.length || 0} | Sections: ${a.sections.length}`);
}
