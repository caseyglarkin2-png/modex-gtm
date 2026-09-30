/**
 * RESEARCH YIELD HARNESS (read only). For each account: the web proposals the research pipeline gets, each run
 * through THE verification contract (verifyCandidate), with the failure class and the source domain of every
 * rejection. Nothing is stored. Answers "is yield low because search is bad, or because the internet has no
 * good fact?" without guessing.
 *
 *   npx tsx scripts/gap/research-yield.ts "PepsiCo|General Mills" [--focus catalysts|footprint|technology|freight]
 *
 * Providers come from the environment (GEMINI_API_KEY first, then the configured fallbacks).
 */
import { webCandidates } from '../../src/lib/gap/research/providers';
import { failureClass, verificationContext, verifyCandidate } from '../../src/lib/gap/research/run';
import { DEEPEN_FOCUS } from '../../src/lib/gap/account-intel/orchestrate';

async function main() {
  const names = (process.argv[2] ?? '').split('|').filter(Boolean);
  const fi = process.argv.indexOf('--focus');
  const section = (fi >= 0 ? process.argv[fi + 1] : 'catalysts') as keyof typeof DEEPEN_FOCUS;
  const focus = DEEPEN_FOCUS[section] ?? '';
  const total = { proposals: 0, verified: 0, classes: {} as Record<string, number> };
  for (const acct of names) {
    const t = Date.now();
    const w = await webCandidates(acct, focus).catch((e) => ({ candidates: [], note: `PROVIDER_UNAVAILABLE ${String(e).slice(0, 140)}` }));
    const ctx = verificationContext(acct);
    const classes: Record<string, number> = {};
    const domains: Record<string, number> = {};
    const kept: string[] = [];
    for (const c of w.candidates) {
      const v = await verifyCandidate(c, ctx);
      if (v.ok) {
        kept.push(`${v.excerpt.slice(0, 110)} <${new URL(c.url).hostname.replace(/^www\./, '')}>`);
        continue;
      }
      const k = failureClass(v.reason);
      if (process.argv.includes('--verbose')) console.log(`  x ${k}: ${c.excerpt.slice(0, 170)} <${c.url.slice(0, 70)}> ${c.publishedAt?.toISOString().slice(0, 10) ?? 'undated'}`);
      classes[k] = (classes[k] ?? 0) + 1;
      total.classes[k] = (total.classes[k] ?? 0) + 1;
      let d = 'invalid';
      try {
        d = new URL(c.url).hostname.replace(/^www\./, '');
      } catch {}
      domains[d] = (domains[d] ?? 0) + 1;
    }
    // The run's bounded alternate-source step for blocked / unreadable pages (same as runEvidenceResearch).
    const blocked = w.candidates.filter((c) => false || (classes && true)).filter(() => false);
    for (const c of w.candidates) {
      const v = await verifyCandidate(c, ctx);
      if (v.ok || !['SOURCE_FETCH_BLOCKED', 'SOURCE_NOT_FOUND'].includes(failureClass(v.reason))) continue;
      blocked.push(c);
    }
    let alt = 0;
    for (const c of blocked.slice(0, 2)) {
      const host = new URL(c.url).hostname.replace(/^www\./, '');
      const r = await webCandidates(acct, `Find ONE other accessible source (${acct}'s own announcement, a filing, a government release or a credible publication) that states this event: "${c.excerpt}". Do not use ${host}.`).catch(() => ({ candidates: [] as typeof w.candidates }));
      for (const a of r.candidates.filter((x) => { try { return new URL(x.url).hostname.replace(/^www\./, '') !== host; } catch { return false; } }).slice(0, 2)) {
        const v = await verifyCandidate(a, ctx);
        if (v.ok) { kept.push(`[alternate] ${v.excerpt.slice(0, 100)} <${new URL(a.url).hostname.replace(/^www\./, '')}>`); alt++; break; }
      }
    }
    if (blocked.length) console.log(`- alternate source: ${alt} of ${Math.min(blocked.length, 2)} blocked found elsewhere`);
    // The run's cited-page step: GAP reads the pages the search cited and proposes their own sentences.
    const { signalCandidates } = await import('../../src/lib/gap/signals/research');
    const pages = ((w as { sources?: string[] }).sources ?? []).slice(0, 6);
    const sc = pages.length ? await signalCandidates(pages.map((url, i) => ({ id: `cited${i + 1}`, url, title: null, published_at: null, source_class: '', resolution_basis: null, event_id: null })), { accountName: acct }) : { candidates: [], note: 'no cited pages', pages: new Map<string, string>() };
    for (const [u, t] of sc.pages) ctx.pages.set(u, t);
    let fromPages = 0;
    for (const c of sc.candidates) {
      const v = await verifyCandidate(c, ctx);
      if (v.ok) { fromPages++; kept.push(`[cited page] ${v.excerpt.slice(0, 260)} <${new URL(c.url).hostname.replace(/^www\./, '')}>`); }
    }
    console.log(`- cited pages read ${pages.length}: ${sc.candidates.length} sentences, ${fromPages} verified`);
    total.proposals += sc.candidates.length;
    total.proposals += w.candidates.length;
    total.verified += kept.length;
    console.log(`\n## ${acct} (${section}, ${Date.now() - t}ms)`);
    console.log(`- ${w.note}`);
    console.log(`- verified ${kept.length} of ${w.candidates.length}`);
    if (Object.keys(classes).length) console.log(`- failures ${JSON.stringify(classes)}`);
    if (Object.keys(domains).length) console.log(`- rejected domains ${JSON.stringify(domains)}`);
    for (const k of kept) console.log(`- KEPT: ${k}`);
  }
  console.log(`\n## TOTAL: ${total.verified} verified of ${total.proposals} proposals; failures ${JSON.stringify(total.classes)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
