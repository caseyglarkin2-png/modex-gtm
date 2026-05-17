#!/usr/bin/env tsx
import { composeFromMemo } from './stages/compose-from-memo';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';

const slug = process.argv[2] ?? 'kraft-heinz';
const data = getAccountMicrositeData(slug);
if (!data) {
  console.error(`unknown slug: ${slug}`);
  process.exit(1);
}
const out = composeFromMemo(data);
console.log(`=== SOURCE (${out.source.length} chars) ===\n`);
console.log(out.source);
console.log(`\n\n=== CUSTOMIZATION PROMPT ===\n`);
console.log(out.customizationPrompt);
