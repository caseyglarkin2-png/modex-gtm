# GAP research aperture

STATUS: ACTIVE (shipped with feat/gap-research-aperture, 2026-10-01)
<!-- verified:2026-10-01 -->

Research maximizes RECALL. Execution maximizes PRECISION.

## Two different things

| | What it is | Who decides | Where it lives |
|---|---|---|---|
| SOURCE / SIGNAL | something GAP found: a story, a page, a filing, a link Casey shared | nobody; it is shown | `gap_signals`, `ResearchRun.provider_status.result.sources`, stored facts |
| VERIFIED OUTREACH EVIDENCE | a fact Casey may state to a buyer | the strict `verifyCandidate` contract (unchanged) | `prospecting_signals` `source_kind='evidence_record'`, `metadata.verified='excerpt_found_at_source'`, re-gated on read by `liveFactFailure` |

A source that fails the outreach contract stays visible, with its provenance and the factual reason. "Not verified" never means "irrelevant". "No verified outreach fact" never means "no information found": every surface shows **Sources found** apart from **Outreach facts verified**.

## Evidence status on every source card

- **VERIFIED FOR OUTREACH**: a live stored fact at this URL (the same re-gate as the account brief).
- **NOT VERIFIED FOR OUTREACH**: checked, and the reason says why (past event, third-party statement, not about the account itself, no physical operations change, undated, failed a later recheck, not checked yet, being checked).
- **COULD NOT VERIFY**: the page could not be fetched, had no readable text, or was not read within the run's time budget.

Third-party statements are attributed ("Said by Gatik (third party), not PepsiCo"). A search model's paraphrase is labelled "Search summary, not a quote". Two statements from one page stay two statements, each with its own status and speaker. An old source carries its age ("published Jun 8, 2026 · 3 months old") and a NOT A FRESH TRIGGER label; it is never hidden.

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
