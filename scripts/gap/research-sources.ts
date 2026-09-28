/**
 * Research ONE account from specific public source URLs, through the real
 * research path (evidence continuity dogfood, 2026-09-28).
 *
 *   npx tsx scripts/gap/research-sources.ts "PepsiCo" <url> [<url> ...]            # dry run: what would verify
 *   npx tsx scripts/gap/research-sources.ts "PepsiCo" <url> [<url> ...] --apply    # store + establish continuity
 *   add --seek to allow the one currentness web call (case H)
 *
 * Each page is read once (SSRF-safe fetch), dated from its own article meta
 * date or a dateline naming the account, and every sentence goes through the
 * ONE verification contract (verifyCandidate). --apply writes ONLY research
 * tables: ResearchRun, EvidenceRecord, ProspectingSignal (+ continuity
 * metadata) and audit rows. It never touches a hypothesis, a trigger, routing,
 * a draft, a send or an enrollment. Prints no secrets.
 */
import { PrismaClient } from '@prisma/client';
import { runEvidenceResearch, verifyCandidate, verificationContext } from '../../src/lib/gap/research/run';
import { signalCandidates, SIGNAL_PAGES_PER_RUN, type ResearchableSignal } from '../../src/lib/gap/signals/research';
import { defaultFetchHtml, parseSignalMeta } from '../../src/lib/gap/signals/intake';
import type { Candidate } from '../../src/lib/gap/research/providers';

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const seek = args.includes('--seek');
  const [accountName, ...urls] = args.filter((a) => !a.startsWith('--'));
  if (!accountName || urls.length === 0) {
    console.error('usage: research-sources.ts "<Account>" <url> [<url> ...] [--apply] [--seek]');
    return 2;
  }
  const prisma = new PrismaClient();
  try {
    const account = await prisma.account.findFirst({ where: { name: { equals: accountName, mode: 'insensitive' } }, select: { name: true } });
    if (!account) {
      console.error(`no account named ${accountName}`);
      return 2;
    }
    // Page titles from the pages themselves (never the URL as a source title).
    const html = new Map<string, string>();
    for (const u of urls) {
      try {
        html.set(u, await defaultFetchHtml(u));
      } catch (e) {
        console.log(`UNREADABLE ${u}: ${(e instanceof Error ? e.message : String(e)).slice(0, 80)}`);
      }
    }
    const signals: ResearchableSignal[] = urls.filter((u) => html.has(u)).map((u, i) => ({ id: `src${i + 1}`, url: u, title: parseSignalMeta(html.get(u)!).title, published_at: null, source_class: 'news', resolution_basis: null, event_id: null }));
    const fetchHtml = async (u: string) => html.get(u) ?? defaultFetchHtml(u);
    const candidates: Candidate[] = [];
    const pages = new Map<string, string>();
    const notes: string[] = [];
    for (let i = 0; i < signals.length; i += SIGNAL_PAGES_PER_RUN) {
      const r = await signalCandidates(signals.slice(i, i + SIGNAL_PAGES_PER_RUN), { fetchHtml, accountName: account.name });
      candidates.push(...r.candidates);
      for (const [u, t] of r.pages) pages.set(u, t);
      notes.push(r.note);
    }
    console.log(`pages: ${notes.join('; ')}`);

    if (!apply) {
      const ctx = verificationContext(account.name);
      for (const [u, t] of pages) ctx.pages.set(u, t);
      for (const c of candidates) {
        const v = await verifyCandidate(c, ctx);
        console.log(`${v.ok ? 'VERIFIES' : `REFUSED(${v.reason})`} ${c.sourceType} ${c.publishedAt?.toISOString().slice(0, 10) ?? 'undated'} ${c.url}\n    "${c.excerpt.slice(0, 220)}"`);
      }
      console.log('DRY RUN: nothing written. Re-run with --apply to store.');
      return 0;
    }

    const r = await runEvidenceResearch(
      prisma,
      { accountName: account.name, personaId: null, hypothesisId: null, problemFamily: null, decisionId: null, actor: 'research-sources (Casey dogfood)', now: new Date(), seekCurrentness: seek, context: { purpose: 'gap_research_sources', urls } },
      { edgar: async () => ({ candidates: [], note: 'not used (explicit sources)' }), web: seek ? undefined : async () => ({ candidates: [], note: 'not used (explicit sources)' }), extra: async () => ({ candidates, note: notes.join('; '), pages }) },
    );
    console.log(`run ${r.runId}: ${r.outcome}; ${r.facts.length} verified fact(s), ${r.rejected.length} refused`);
    for (const f of r.facts) console.log(`  FACT ${f.signalId} ${f.publishedAt.slice(0, 10)} ${f.type} ${f.url}\n    "${f.excerpt.slice(0, 220)}"`);
    const reasons = new Map<string, number>();
    for (const x of r.rejected) reasons.set(x.reason, (reasons.get(x.reason) ?? 0) + 1);
    console.log(`  refused: ${JSON.stringify(Object.fromEntries(reasons))}`);
    console.log(`continuity: ${JSON.stringify(r.continuity)}`);
    return 0;
  } finally {
    await prisma.$disconnect();
  }
}

main().then((code) => process.exit(code));
