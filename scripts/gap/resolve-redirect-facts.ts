/**
 * Stabilization C2: resolve verified claims stored on search-redirect links (src/lib/gap/research/resolve-redirect.ts).
 *
 *   npx tsx scripts/gap/resolve-redirect-facts.ts            # dry run: report only
 *   npx tsx scripts/gap/resolve-redirect-facts.ts --apply    # write metadata only
 *
 * Resolved: metadata.canonicalUrl (+ canonicalizedFrom) so every surface links the publisher page; the quote and
 * the frozen fact columns are untouched. Unresolved: metadata.verified moves to failed_recheck with reason
 * redirect_unresolved (the claim stays visible as intelligence; it is no longer outreach evidence). Nothing deleted.
 */
import { PrismaClient } from '@prisma/client';
import { htmlToText } from '../../src/lib/gap/research/facts';
import { resolveRedirectFact } from '../../src/lib/gap/research/resolve-redirect';
import { askGrounded, defaultProviders } from '../../src/lib/gap/entity/providers';
import { SEARCH_REDIRECT } from '../../src/lib/gap/sources/source-copy';

async function follow(url: string): Promise<{ finalUrl: string; text: string }> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; YardFlowResearch/1.0)', Accept: 'text/html,*/*;q=0.8' }, redirect: 'follow', signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  return { finalUrl: res.url, text: htmlToText(await res.text()) };
}

async function search(sentence: string, accountName: string): Promise<string[]> {
  const r = await askGrounded(`Find the original public web page (the publisher's own article or ${accountName}'s own release) that contains this exact sentence about ${accountName}: "${sentence}". Reply with the page URL only.`, (a) => a.citations, defaultProviders());
  return r.ok ? r.value : [];
}

async function main() {
  const apply = process.argv.includes('--apply');
  const prisma = new PrismaClient();
  try {
    const rows: Array<{ id: string; account_name: string; evidence_text: string | null; evidence_url: string | null; metadata: Record<string, unknown> | null }> = await prisma.prospectingSignal.findMany({
      where: { source_kind: 'evidence_record', metadata: { path: ['verified'], equals: 'excerpt_found_at_source' } },
      select: { id: true, account_name: true, evidence_text: true, evidence_url: true, metadata: true },
    });
    const targets = rows.filter((r) => r.evidence_url && SEARCH_REDIRECT.test(r.evidence_url) && r.evidence_text && typeof r.metadata?.canonicalUrl !== 'string');
    console.log(`verified claims on search-redirect links: ${targets.length}`);
    const now = new Date().toISOString();
    let resolved = 0;
    let withdrawn = 0;
    for (const t of targets) {
      const r = await resolveRedirectFact({ evidence_text: t.evidence_text!, evidence_url: t.evidence_url!, account_name: t.account_name }, { follow, search });
      console.log(`${t.account_name} | ${r.resolved ? `RESOLVED via ${r.via}: ${r.canonicalUrl}` : `UNRESOLVED (${r.reason})`} | ${t.evidence_text!.slice(0, 90)}`);
      if (!apply) continue;
      const meta = t.metadata ?? {};
      if (r.resolved) {
        await prisma.prospectingSignal.update({ where: { id: t.id }, data: { metadata: { ...meta, canonicalUrl: r.canonicalUrl, canonicalizedFrom: { url: t.evidence_url, at: now, via: r.via } } } });
        resolved += 1;
      } else {
        await prisma.prospectingSignal.update({ where: { id: t.id }, data: { metadata: { ...meta, verified: 'failed_recheck', recheck: { at: now, reason: 'redirect_unresolved', previous: 'excerpt_found_at_source', rule: 'stabilization C2 2026-10-01: outreach evidence needs a publisher page' } } } });
        withdrawn += 1;
      }
    }
    console.log(apply ? `applied: ${resolved} resolved to a publisher page, ${withdrawn} withdrawn as outreach evidence (kept visible)` : 'dry run: nothing written (pass --apply)');
  } finally {
    await prisma.$disconnect();
  }
}

main();
