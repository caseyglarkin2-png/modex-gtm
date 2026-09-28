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
| B | Resolution, clustering, promotion, signal research | | | | |
| C | Account watches + scheduled discovery | | | | |
| D | Research aperture | | | | |
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

