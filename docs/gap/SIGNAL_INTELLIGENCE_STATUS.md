# GAP Signal Intelligence (status ledger)

STATUS: ACTIVE

<!-- verified:2026-09-28 -->

Capture broadly. Verify narrowly. Remember everything useful. Only say what we
can prove. A SIGNAL is "this may matter enough to remember and investigate".
A VERIFIED OUTREACH FACT is "GAP re-read the original source, verified the exact
statement, confirmed the account and physical-network relevance". This program
never collapses the two.

Baseline: `origin/main` 5bd94bff (Phase 2 Seller OS shipped).

## BEFORE: the signal universe on 2026-09-28

Read from code (file:line in the reconnaissance) and from production
(read-only counts).

### Producers of `PounceTrigger` (one write path: `src/lib/pounce/ingest.ts ingestTriggers`)

| Source | Status | How |
|---|---|---|
| news | LIVE | cron `/api/cron/pounce-scan/` 13:05 UTC daily. One Google News RSS query per account over the 58-account /for + demo-pack watchlist; title keyword score; only score >= 8 (PING_THRESHOLD) is ingested |
| clawd | external | `POST /api/pounce/ingest` (x-pounce-token). EDGAR-shaped tickers repaired via TICKER_TO_SLUG. Scores 0-100, so almost every clawd trigger is "hot" |
| x | external, unknown if running | same endpoint, named only in comments |
| web | dead | only in the type union |

Production: 84 triggers ever (clawd 70, news 14); 2 in the last 7 days, on 2
accounts; 55 of 70 clawd triggers never resolved to a HubSpot company.

### Ingest contract and side effects
- Requires url, accountSlug, accountName, numeric score. `url_hash` =
  sha256(url without query/fragment/trailing slash, lowercased), unique
  across the whole table (one URL can belong to only one account).
- score >= 8: Slack ping to #yardflow-intent (cap 6 per call, never retried),
  HubSpot company resolved by exact name, timeline Note, and trigger-heat
  properties OVERWRITTEN (no max-compare). Below 8: stored, no side effects.
- Ingest never starts research.

### What each thing is today
- Raw signal: a Google News RSS item or whatever a producer POSTs. Nothing
  holds a signal BEFORE an account is known.
- Scored: every PounceTrigger (keyword regex on the title). Every trigger is a
  KEYWORD HIT, not a fact.
- Account-resolved: only at ingest (registry slug or exact HubSpot name).
  Account-row resolution is exact name in background research and routing.
- ProspectingSignal (requires an Account row): `pounce_trigger` (only through
  the unscheduled hypothesize job; evidence_text null, so keyword-only),
  `evidence_record` (verified facts from research), `manual` (unverified
  public URL), `operator_knowledge`, `top100_evidence`, `pic_citation`.
  Production: 23 pounce_trigger, 28 evidence_record, 1 operator_knowledge.

### Research
- Background research: cron 10:40 UTC daily, 3 accounts per run (max 10),
  120s budget, 3-day cooldown. Targets: research work blocking people, fresh
  triggers (exact Account.name match only), expiring evidence.
  Production: 7 runs on 4 distinct accounts.
- Per account: EDGAR full-text (exact CIK name match) plus one Gemini
  google-search-grounded query. Every candidate is re-fetched and the quote
  verified verbatim, dated, physical-network, naming the account.

### Identity
- `resolveIdentity` (hubspot id, verified domain, registered alias, exact or
  normalized name; never fuzzy; ambiguity is reported). No URL-to-account
  resolution. 1,573 resolved and 133 conflict canonical links.
- Account priority lives in `tier` / `priority_band` (7 A, 7 B, 7 C, 1,687 D;
  some rows are E2E fixtures) and in HubSpot `yardflow_tam` / `tam_tier`.

### What gets lost or duplicated
- A link Casey sees cannot enter GAP at all without an account, a score and
  categories (the ingest contract), and entering fires side effects.
- Sub-threshold news (score < 8) is fetched every day and thrown away.
- The same event from different URLs (publisher, Reuters, trade press,
  Google News redirect) is several triggers; there is no story clustering.
- One URL relevant to two accounts goes to whichever account scanned first.
- Triggers for accounts that do not match `Account.name` are skipped by
  research silently (19 of 22 in an earlier audit).
- Hot triggers past the per-call Slack cap are never pinged later.
- A newer, lower trigger overwrites HubSpot trigger heat.

### Why a new table (and only one)
`PounceTrigger` needs a resolved account, a score, and fires Slack/HubSpot;
`ProspectingSignal` needs an Account row (non-null FK). Neither can hold
"Casey shared this link, account unknown". One coherent object, `GapSignal`,
holds each SOURCE DOCUMENT before promotion; rows sharing `event_id` are one
event. Nothing else is added.

## Release ledger

| Release | Scope | Branch | PR | Merge | Production |
|---|---|---|---|---|---|
| A | Signal intake + Share to GAP | feat/gap-signal-a-intake | #287 | 8a9cc4c7 | READY; 6 real shares through the prod UI at 390px, 0.9-1.5s each, no horizontal scroll |
| B | Resolution, clustering, promotion, signal research | feat/gap-signal-b-resolve-research | #289 | 5b936236 | READY (processing cron first tick pending at merge) |
| C | Account watches + scheduled discovery | feat/gap-signal-c-discovery | | | |
| D | Research aperture (shipped with C) | feat/gap-signal-c-discovery | | | |
| E | Inbox polish, dogfood, coverage, quality | | | | |

## Release A: signal intake + Share to GAP

- `GapSignal` (one table): each row is a SOURCE DOCUMENT; `event_id` groups
  sources of one event. States: resolution `needs_account | ambiguous |
  resolved | rejected`; research `none | queued | researching | fact_found |
  no_usable_fact | contradiction`; feedback `ignored | irrelevant |
  wrong_account | already_knew | good_context | not_sayable | use`.
- `signals/intake.ts captureSignal`: a URL alone is enough. URL normalized
  (tracking params, fragment, www, amp, trailing slash) and hashed for dedupe;
  a repeat share is recorded on the same row. Page metadata (title,
  published date, site name) is fetched bounded (8s, 400KB), never from a
  network-private host, and is never evidence. Source class from the host.
- Account resolution is conservative: Casey's explicit account (exact name or
  registered alias or one contains-match), else exactly one account named in
  the title or owning the URL's canonical domain. Two or more is AMBIGUOUS
  with candidates; none is NEEDS ACCOUNT. Generic-word names (Target, Global,
  ...) never match free text.
- Relevance (deterministic, the Pounce taxonomy): outreach evidence
  candidate, account context, leadership, risk, research lead. A label never
  changes outbound state.
- FOLLOW THIS UP: a link Casey shares is queued for research once its
  account is known (or when he assigns it).
- Casey's note is stored verbatim, attributed, never blended into the title
  or evidence. A no-link conference note is operator context: it cannot be
  researched as public evidence; if it sounds like buyer words the form points
  to Buyer Truth Capture.
- Surfaces: `/gap/signals` (Share to GAP + Signal Inbox, a "Signals" tab),
  `/gap/signals/new?url=` (pre-filled, for the iPhone Shortcut), a GET-only
  Web Share Target in `public/manifest.json` (Android / desktop Chrome; it only
  pre-fills). `POST /api/gap/signal-intake` and `/api/gap/signal-intake/[id]`
  are session-only; unknown fields (score, categories, evidence) are refused.
- Nothing in Release A writes a PounceTrigger, ProspectingSignal,
  EvidenceRecord, hypothesis, BID, HubSpot or Slack.

### Release A validation
- Unit: `signal-intake` 17, `signal-ops` 10, `signal-routes` 4. Mutations RED
  then restored: ambiguous auto-assigned, generic name matched, note became
  the title, tracking params kept, private host accepted, shared link not
  followed up, wrong account kept, route without a session.
- Scratch E2E `scripts/gap/e2e-signals.ts` S1-S4 PASS (real Postgres).

### Release A review (verified P1s fixed before merge)
- SSRF: the metadata fetch followed redirects and never checked DNS. Now every
  redirect hop is re-checked, every host's resolved addresses must be public
  (a lookup failure fails closed; CGNAT, benchmarking and multicast ranges
  included), only HTML/XML/text is read, and the body is read to 400KB at most.
- A partial account hint ("Dana") resolved to the only contains-match
  (Danaher) and auto-queued research. Now only a 5+ letter PREFIX of exactly
  one account resolves (`hint_prefix`); anything else is shown to Casey.
- Short or everyday single-word account names (Ford, Mars, Dover, ...) matched
  headlines. Single words must be 5+ letters and off a stoplist.
- WRONG ACCOUNT hid the signal. It now returns to Casey as Needs you (the
  label stays in the audit row); GOOD CONTEXT / USE stay listed.
- P2s fixed: a concurrent capture of the same link returns the winner (no
  500); a re-share that names the account resolves an unresolved row; only
  unambiguous tracking params are stripped (`s`, `cid`, `src`, `source` are
  kept, `amp` is stripped); the account universe is cached per process for 5
  minutes; trailing punctuation is not part of a shared URL; 44px tap targets.
- Mutations RED then restored for each.

### Release A production dogfood (2026-09-28) and hotfix
Six real links shared through the production UI (`/gap/signals/new?url=`, 390px,
the signed-in rig): each saved in 0.9-1.5s after page load, no horizontal scroll.
The dogfood found two defects, fixed on `fix/gap-signal-a-ipv6-newsroom`:
- Every metadata fetch from Vercel failed "private host": Vercel resolves most
  publishers to IPv6 and the DNS check treated every IPv6 answer as private.
  Now a resolved IPv6 address is private only in loopback, unspecified,
  fc00::/7, fe80::/10, ff00::/8 or IPv4-mapped private ranges.
- The PepsiCo newsroom release ("PepsiCo and Gatik announce...") went
  AMBIGUOUS: the vendor is named too, and pepsico.com is linked to two brands.
  A domain shared by several accounts is no longer identity evidence, and a page
  on a host named for exactly one of the named accounts resolves to that
  publisher (`company_newsroom`). Off the newsroom, two named companies stay
  ambiguous.

## Release B: resolution, clustering, promotion, signal research

- RESOLVING (`signals/process.ts`, cron `gap-signal-process` every 30 min):
  a link whose page could not be read at capture is retried up to 3 times;
  the title it yields can resolve the account (and queue a shared link).
- CLUSTERING (`signals/cluster.ts`): same resolved account, within 4 days,
  and the same URL slug (>= 0.8 overlap) or the same story words (title
  overlap >= 0.5, account name removed). Different events at one account stay
  apart; never across accounts. Every source keeps its row (`event_id`).
- SIGNAL -> RESEARCH (`signals/research.ts`, `research/background.ts`):
  a queued signal is a `shared_signal` (Casey) or `discovered_signal` target.
  Priority: research blocking people, then Casey-shared, then fresh
  discovered / Pounce trigger, then expiring evidence. A queued signal is
  followed up despite the account cooldown. Research gets the signal's OWN
  page (fetched SSRF-safe, dated by the page) as an extra candidate source;
  every candidate passes the SAME `verifyCandidate` contract. The web search
  is told to find the story's primary source.
- HONEST SETTLING: a signal is FACT READY only when a verified fact came from
  its own page or shares 3+ of its story's specific words; a contradiction
  among those facts is CONTRADICTION; otherwise NOTHING USABLE (other verified
  facts about the account are counted, not credited). A failed run returns
  the signal to the queue; after 3 failures it settles with the reason.
- PROMOTION (`signals/promote.ts`): only a resolved signal whose story was
  VERIFIED enters the canonical `ingestTriggers` path (source `web`, the
  deterministic Pounce score and categories, the publication date). The spine
  decides Slack/HubSpot (score >= 8) and dedupe. A raw, ambiguous, ignored or
  conference signal never reaches it.

### Release B validation
- Unit `signal-resolve-research` 16. Mutations RED then restored: promote
  unverified, promote unresolved, unrelated fact marks fact ready,
  contradiction ignored, cross-account cluster, different events cluster,
  shared signal ranked below triggers, signal stuck researching, no signal
  candidates, new rows never clustered.
- Scratch E2E S5-S7: REAL background research verified the sentence on the
  signal's own page (stored as a verified fact, signal FACT READY, no
  hypothesis or link touched); only the verified signal was promoted; two
  outlets carrying one story became one event with both sources kept.
- The E2E found a real defect before merge: a Prisma JSON-path NOT filter
  drops rows where the key is absent, so new sources were never clustered.

### Release B review (verified P1s fixed before merge)
- A STALE verified fact (an old story, stored for the record) could settle a
  signal FACT READY and promote it to Pounce as a fresh trigger. Only a FRESH
  matched fact counts now (stale matches are recorded as `staleMatches`).
- Three generic shared words ("million", "distribution", "center") credited an
  unrelated fact to the signal and promoted the headline. A fact now matches
  only from the signal's own page, or with the same DIRECTION of change (a
  closure never matches an opening or investment) plus 2+ specific words
  (generic operations vocabulary excluded).
- P2s fixed: only an article publication date is read (no generic `date` meta,
  no stray `<time>`); one event is promoted once whichever source verified;
  clustering reads newest first so a full window cannot starve new sources;
  capped retries and already-promoted rows are filtered before the limit; a
  run that dies mid-flight returns its signals to the queue, counting as an
  attempt (settled after 3). Cluster peers exclude ignored and unresolved rows.
- Mutations RED then restored for each (two initially SURVIVED because one
  negative case tripped both checks; isolating tests added).

## Release C: account watches + scheduled discovery

- WATCH PROFILES (`signals/watch.ts`), generated, never configured: Account
  rows in priority band A-C or Tier 1-2, every account with a GAP thesis, every
  audited /for + demo-pack account, and every account where GAP holds a
  buying committee (5+ people); E2E fixtures, "Unknown" and domain-named
  placeholder rows excluded. Production: 74 accounts (16 priority, 7 thesis,
  36 /for, plus buying committees; 47 with a canonical domain, 21 with a
  ticker, 10 with aliases). Aliases from registered aliases and the parent
  brand; Casey can add or remove one (`POST /api/gap/signal-watch`, a
  "Watching N accounts" panel on /gap/signals). Themes: thesis problem
  families first, then eight physical-network questions.
- DISCOVERY (`signals/discovery.ts`, cron `gap-signal-discovery` every 2 hours):
  the 10 least recently asked watched accounts per run, 2 themes each rotated
  by day (every theme comes round in 4 days), Google News RSS (zero cost, the
  Pounce news source), a politeness gap, a 200s budget. Kept only if the
  headline names the account (or an alias), is under 21 days old and hits the
  physical-network / risk / leadership taxonomy (finance noise dropped).
  Captured through the one intake path (resolved by construction, basis
  `discovery_query`, the page is not fetched). A strong operational story
  (score >= 8) is queued for research as a `discovered_signal`.
- Coverage: ~120 account-asks per day over 74 accounts (every account daily,
  two themes each). Source classes: NEWS via Google News (links are Google
  redirects: dedupe by article link, clustering by title; research finds the
  primary source). SEC filings are covered by research (EDGAR), not discovery.
  Jobs, procurement/government, vendor case studies and social are NOT
  discovered automatically; Casey-shared links cover them.

### Release C validation
- Unit `signal-discovery` 7. Mutations RED then restored: headline need not
  name the account (initially SURVIVED; an isolating item added), finance noise
  kept, old stories kept, no rotation, strong story not queued, fixtures
  watched, buying committee ignored, alias correction ignored.
- Scratch E2E S8: two bounded questions; of three stories only the one naming
  the account on the taxonomy was captured and queued; no trigger written.

### Release C review (verified P1s fixed before merge)
- A parent-brand alias pinned a parent's story on a subsidiary ("PepsiCo breaks
  ground..." captured as Frito-Lay). The parent brand is no longer a search
  alias, and a headline the resolver attributes to a DIFFERENT account is left
  for that account's own ask (`otherAccount`).
- A mention was treated as the subject ("Walmart supplier Acme opens a DC"
  captured as Walmart). A discovered headline must now OPEN with the account's
  name or alias (optionally possessive) and the next word must not make it a
  bystander (supplier, vendor, partner, customer, rival, former ...). Name keys
  are intake's one definition (generic and short single words never match).
- P2s fixed: a failed news fetch (429, timeout) is reported and a turn where
  every question failed does not consume the account's rotation; themes rotate
  per ask (two asks in a day never repeat a question); profiles are cached per
  process for 5 minutes on the Signals page.
- Known limits (recorded): Google News links are Google redirects, so a
  discovered signal's own page is not read; research finds the primary source
  through web search and EDGAR. Account names shorter than 4 letters (3M, GE,
  UPS) are not discovered automatically; Casey can share them.

## Release D: research aperture (shipped in the same PR as C)

- Eligible universe: the watched priority accounts (74 in production),
  minus accounts routing holds for an open HubSpot deal.
- Priority (deterministic): research blocking people, then Casey-shared
  signals, then fresh discovered signals / Pounce triggers, then evidence
  nearing expiry, then the proactive backlog (`priority_backlog`: a watched
  account not researched in 7 days; never researched first, then the oldest,
  tier first).
- Cadence: background research moves from once a day to HOURLY (`40 * * * *`),
  3 accounts per run, a 120s budget, a 3-day account cooldown and a 3-day
  backlog staleness: at most 72 account slots a day; in steady state the
  backlog covers the 74 watched accounts about every 3 days (~25 distinct
  accounts a day, ~25 Gemini searches + EDGAR passes). Day one can use up to
  72 runs while never-researched accounts drain. Each run is independent
  (failure isolation, idempotent cooldown).
- The cooldown bypass is Casey's alone: a story he shared is followed up at
  once; a discovered story waits out the cooldown unless it was published after
  the last research.

### Release D validation
- Unit `signal-research-aperture` 4. Mutations RED then restored: open-deal
  accounts in the backlog, recently researched in the backlog, never-researched
  not first, backlog outranking shared signals, discovered stories bypassing
  the cooldown, Casey's share waiting on the cooldown (initially SURVIVED; the
  test's timestamps fixed).

### Release C+D review (verified P1 fixed before merge)
- The stricter name rule made short or everyday account names (Ford, UNFI,
  Target) impossible to discover, and an alias could not fix it. Discovery now
  has its own name keys: the query quoted the name and the headline must OPEN
  with it, so short names are allowed; a multi-word account's distinctive
  leading word counts ("Hormel to close" for Hormel Foods); an alias that is
  itself another account's name is left for that account, while Casey's own
  aliases are trusted.
- P2/P3 fixed: the backlog also skips accounts whose deal state is UNKNOWN; a
  backlog entry never overwrites a real target's tiebreak; backlog staleness
  3 days (the stated daily target); an alias correction clears the profile
  cache; franchise words (bottler, distributor, franchisee, dealer) make the
  named brand a bystander (from a live dry run: "Coca-Cola bottler boosts San
  Antonio capacity" is the franchise bottler's story).
- Live dry run before merge (no writes): 8 watched accounts x 2 questions,
  255 stories seen, 76 about the account, 12 kept (a Coca-Cola DC in Idaho
  Falls, a $42M San Antonio plant expansion, a Teamsters strike as risk,
  PepsiCo plant layoffs).
- Coverage telemetry: `scripts/gap/signal-coverage.ts` (read-only), report in
  `docs/gap/signal-coverage-latest.md`. BEFORE dogfood: 2/74 watched accounts
  with a signal in 7 days, 4/74 with a live verified fact, 70 never researched.

