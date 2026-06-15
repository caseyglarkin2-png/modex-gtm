import 'dotenv/config';
import { generatePageRow } from '@/lib/for/generate';
import { upsertForPage } from '@/lib/for/store';

/** Usage: npx tsx scripts/for/gen-page.ts <slug>
 *  Builds the row and writes it live. Requires ANTHROPIC_API_KEY + DATABASE_URL. */
async function main() {
  const slug = process.argv[2];
  if (!slug) { console.error('usage: npx tsx scripts/for/gen-page.ts <slug>'); process.exit(1); }
  console.log(`Generating /for/${slug} ...`);
  const row = await generatePageRow(slug);
  await upsertForPage(row);
  console.log(`✓ live: https://yardflow.ai/for/${slug}`);
  console.log(`  modeled ${(row.snap as any).annualValueLabel} | sites ${(row.snap as any).totalFacilities} | pilot ${(row.override as any).pilot.site}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
