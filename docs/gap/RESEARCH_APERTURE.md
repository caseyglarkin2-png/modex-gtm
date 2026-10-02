# GAP research aperture

STATUS: ACTIVE (shipped with feat/gap-research-aperture, 2026-10-01)
<!-- verified:2026-10-01 -->

Research maximizes RECALL. Execution maximizes PRECISION.

## The truth vocabulary (stabilization, 2026-10-01)

SOURCE (a document or human input, with provenance) > SIGNAL (may be worth knowing; needs no fact) > CLAIM (one attributed assertion: who, where, when) > VERIFIED FACT (a claim checked at its source: true, not necessarily new, useful or first-party) > OUTREACH EVIDENCE (the strict subset Casey may say to a buyer) > HYPOTHESIS (what we think; never fact) > BUYER TRUTH (what the buyer confirms; outranks all). Canonical text: `src/lib/gap/sources/source-copy.ts` and `docs/gap/STABLE_BASELINE.md`.

## Two axes on every source card

- **Verification**: UNCHECKED, VERIFYING, VERIFIED AT SOURCE, COULD NOT VERIFY, CONTRADICTED. A rule failed before GAP checked the page (undated, no physical change, a past event) leaves a claim UNCHECKED, never "false".
- **Outreach**: ELIGIBLE, NOT ELIGIBLE, NOT EVALUATED, NEEDS HUMAN JUDGMENT. ELIGIBLE is exactly the brief's live-fact rule (`research/claim-rules.ts` liveFactFailure, not ended, not past its freshness window).
- Counts everywhere: **Sources / signals** · **Verified at source: N claims** · **Eligible as outreach evidence: M**.

A three-month-old claim is VERIFIED AT SOURCE and NOT ELIGIBLE (not a fresh trigger). A vendor's quote is VERIFIED AT SOURCE, attributed to the vendor, and NOT ELIGIBLE as the account's evidence. The strict outreach gate (`evidence-gate.ts` outreachFactRefusal) also refuses a third-party statement and a claim stored on a search-redirect link.

## Hard-drop rules (the only things not shown; counted as "not shown")

1. Search redirects and search-result pages (`vertexaisearch.cloud.google.com`, Google search/url, Bing/DuckDuckGo search). Exception: a stored fact the brief counts is never dropped; it shows with the publisher "search redirect".
2. Malformed or non-http URLs.
3. Discovery only: machine market chatter in the market-wire shape (a fund's "stake / position / shares raised|cut|sold by", an exchange ticker in brackets, price targets, rating changes, short interest, options activity, dividend declarations). "Walmart takes stake in X" is news and is kept.
4. Exact duplicates collapse to one card per normalized URL; two different statements from one page stay two (the second under "other statements on this page", verbatim only).

A page that does not name the account by its full name is SHOWN (it may use a brand or short form: Frito-Lay, P&G). A headline that mentions the account without opening with it ("Gatik expands driverless runs for PepsiCo") is captured as a third-party mention, labelled, never queued. A second page carrying a statement already checked (syndicated copy) is a source. Every SEC filing found is a source, read or not.

Anything uncertain is surfaced. Casey's own Ignore sets a source aside (counted, listed on the view-all page, never deleted); Wrong account unassigns it to Signal intake and it stays set aside on this account even when research saw the same URL. A live verified fact is never hidden behind a set-aside. A fact whose change ended is not a verified outreach fact (the brief's live-fact rule).

## Human judgment boundary

GAP shows, sorts by publication date then discovery date, and annotates ("why found" themes, advisory only). Casey decides what matters. Source actions: Open source, Verify as evidence (queues the existing strict check; a failure stays visible with the reason), Research more (the account research plan), Ignore, Wrong account. Nothing in this layer creates a hypothesis, links evidence to one, approves, activates, promotes, drafts, enrolls or sends.

## Where it shows

- Account page: SOURCES / SIGNALS (3 newest, compact: provenance, status and reason, Verify / Ignore / Wrong account) with VIEW ALL SOURCES (`/gap/accounts/<slug>/sources`, grouped by evidence status with counts, every action per card).
- Research lane: per account "N sources found by research (45 days) · M outreach facts verified" (scoped: the account page counts every source) and the non-evidence sources with publisher, age, title, link, status and reason.
- Deepen result, RESEARCH THIS result, background research cron summary, the orchestrator's skip reason: both counts, never "came back empty".
- Dogfood: `npx tsx scripts/gap/source-aperture-dogfood.ts [Account ...]` (read-only).

## Named debt

- `scripts/gap/e2e-phase2.ts` G5 still imports `loadInDeals`, renamed to `loadInDealsSummary` in #342; the script fails at G5 on main. Rework G5 onto the summary API.
- Legacy verified facts stored on `vertexaisearch` redirect URLs (before WEAK_SOURCE) still count as live facts in the brief (Kroger 7, Walmart 2, as of 2026-10-01). Now visible and labelled; whether they should be re-checked is an evidence-gate decision, not part of this pass.
- Research runs before 2026-10-01 kept only `{url, reason}`: those sources show without title, date or excerpt until the account is researched again.
