# GAP stable baseline

STATUS: ACTIVE. GAP is in SELLER DOGFOOD MODE (V2 shipped 2026-10-02; the freeze rule below applies again).
<!-- verified:2026-10-03 -->
<!-- verified:2026-10-02 (V2) -->

Production SHA: `11e26869` (GAP V2 click-test rounds 1-7, #368-#381; READY, production-verified 2026-10-03; all three adversarial click reviewers (phone, trust, UX) signed off YES on NOW). Update this line when a change ships.
<!-- verified:2026-10-03 -->

## The rule for future changes

GAP is structurally complete. Future product changes require ONE of:

1. a P0 / P1 production defect (unsafe, wrong truth, or a systemic seller-blocking problem);
2. repeated Casey feedback (the `/gap/feedback` backlog);
3. clear seller outcome evidence;
4. a deliberate next-version decision by Casey.

NOT: "an agent thought of another feature." P2 friction and P3 polish are recorded below and in the note backlog, and
fixed only when a real selling day makes them matter.

## Truth vocabulary (canonical: `src/lib/gap/sources/source-copy.ts`)

| Level | Means | Never |
|---|---|---|
| SOURCE | a document or human input, with provenance (URL, publisher, title, date, speaker, class, account) | a fact by itself |
| SIGNAL | a source that may be worth knowing about; needs no fact | "this is true", "this proves a problem", "send now" |
| CLAIM | one attributed assertion: who said it, where, when | attribution collapsed |
| VERIFIED FACT | a claim GAP checked at its own source (subject, speaker, numbers, direction, date) | assumed new, useful, first-party or sayable |
| OUTREACH EVIDENCE | the strict subset Casey may say to a buyer | weakened to raise READY counts |
| HYPOTHESIS | what GAP / Casey think may be happening; falsifiable | worded as fact |
| BUYER TRUTH | what the buyer confirmed (human-confirmed BID) | overridden by research, model or inference |

Two axes on every source card: **verification** (unchecked, verifying, verified at source, could not verify,
contradicted) and **outreach** (eligible, not eligible, not evaluated, needs your judgment), each with the factual
reason. Counts everywhere: Sources / signals · Verified at source: N claims · Eligible as outreach evidence: M.

## Contracts that MUST NOT change without a new design decision

- **The outreach evidence gate only gets stricter.** `research/run.ts` verifyCandidate mints facts;
  `research/evidence-gate.ts` outreachFactRefusal gates outreach; `research/claim-rules.ts` liveFactFailure is the one
  stored-claim re-gate (physical change, speaker = the account, a real publisher page: never a search redirect,
  aggregator or mirror). Eligible = live, not ended, not past freshness, not contradicted.
- **Attribution never collapses.** `claim-rules.ts` speakerOrg reads "said ... of/at/from Org", "Org <title> Name
  said" and "according to Org" (the page's own publisher excepted). A vendor's claim about the account is the vendor's.
- **Research maximizes recall.** Hard drops only: malformed links, exact duplicates, search redirects, market-wire
  chatter. Everything uncertain is shown with its reason (`docs/gap/RESEARCH_APERTURE.md`).
- **Verify only verifies.** Casey's Verify / Research marks the signal `manualVerify`; promotion refuses it: no
  Pounce trigger, no Slack, no HubSpot heat. Automatic discovery keeps its promotion rule.
- **No automatic seller actions.** No auto hypothesis, approval, activation, account creation, person merge, draft,
  send or enroll. Auto-send OFF, auto-enroll OFF. Every outbound click re-checks suppression, the HubSpot open deal,
  the current thesis and the family hold (fail closed).
- **Fact columns are frozen** (`GAP_SIGNAL_FROZEN`); only metadata moves (canonicalUrl, recheck, continuity).
- **Notes never change the product.** A dogfood note is an append-only audit row; it never edits code, opens anything
  outside GAP or changes seller state.

## Core workflows (production-verified)

Share a signal (link → source → account → visible with provenance → research) · unknown signal (ambiguous → Casey
assigns, source kept) · account research (sources → claims → verified facts → outreach subset; unknowns honest) ·
signal that is not a fact (third-party story visible, no fabricated fact) · verified fact that is not outreach
evidence (shown with the restriction) · outreach evidence (USE in the Research lane links it to a thesis; no
approval) · hypothesis (fact → inference → human review) · buyer truth (exact words → human confirmation → overrides
inference) · action pack (governed email / call / LinkedIn, safety gates) · open deal (HubSpot → In Deals, no cold
prospecting) · MMYQB / cohort (person → Scout → candidate → human ADD / MAP / IGNORE) · conference (note → work source
→ context → research) · product feedback (NOTE → backlog, no seller-state change).

## Source aperture

- Automated: news (Google News RSS) plus grounded search (Gemini, then OpenAI / AI Gateway) rotating four bundles:
  newsroom / SEC / earnings / leadership; jobs / labor / security / government and permits; procurement / case
  studies / technology / 3PL and partners; M&A / capex / fleet / trade press (`signals/grounded-discovery.ts`). Only
  cited pages that answer when read are captured, with the page's own title and date. Never queued, promoted or sent.
- Manual only: LinkedIn / social / professional posts (Casey-shared links and conference notes).
- Ledger: research runs record every page they looked at; Scout citations are sources (unchecked); legacy research
  records carry backfilled provenance where recoverable (unknown stays unknown).

## Health dependencies (`/api/gap/health`)

Mailbox intake (cron) · HubSpot opportunity truth (private app token) · suppression authority (clawd contract, fail
closed, 8s action-time) · GAP sender (casey@yardflow.ai Gmail) · routing (last applied run). Discovery and background
research crons: `gap-signal-discovery` (every 2h), `gap-background-research` (hourly), `gap-signal-process` (30 min).

## Feedback workflow

Tap **Note** on any GAP screen (or **Report this** beside a refusal / error) → one field → saved with safe context
(route, lane, account, card, hypothesis, surface, viewport, device, build SHA, error code; never cookies, headers,
tokens or page text). Review at `/gap/feedback` (Open / Later / Fixed / Dismissed); **Copy debug packet** hands one to
a Claude session. A future session starts from the Open notes, applies the rule above, and marks what it fixed.

## Known P2 / P3 debt (record, do not build without the rule above)

- P2: the full sources view has no source-class filter (grounded pages sort by their real date when the page has one).
- P2: the redirect resolver's search fallback could land on a later re-publication of the same sentence; the fact
  keeps its original date (canonical pages are now publisher pages only, never mirrors).
- P2: the account brief degrades its contradiction read to "none" on a read failure (display only; the send gate fails
  closed).
- P2: 34 legacy research pages have no recoverable provenance (shown as unknown); 1 redirect-stored claim (Georgia
  Pacific) had no findable publisher page and is no longer outreach evidence (kept visible).
- P3: hide the outreach pill when a claim is unchecked; "Use as outreach evidence" opens the Research lane, not the
  item; "+ N more sources" is plain text; the note dialog lacks Escape / aria-modal / focus return; feedback-list
  status and copy failures are silent; one over-long context field drops all context; the compact source list nests
  div in ul; continuity's `source_failed_recheck` rows carry no recheck reason; the brief's "(verified)" observation
  label; Scout citations have no titles.
- Pre-existing, outside GAP: lint errors in `signals/registry.ts`; GitHub Actions do not start (local suite + typecheck
  are the gate).

## Release

Stabilization PRs: #348 (truth vocabulary, Verify only verifies), #349 (source ledger gaps), #350 (dogfood notes),
#351 (grounded discovery), and the final-review PR (attribution forms, contradictions, mirrors, Note reachable, E2E
opportunity truth), #352. Merge SHAs: #348 5f8e0a8c, #349 a59458df, #350 933f172f, #351 64885971, #352 762da572.

Acceptance on 762da572 (2026-10-02): full unit suite 575 files / 6386 passed; typecheck clean; all 17 GAP E2Es green
(224 checks); production 390px smoke (7 pages) and desktop smoke (4 pages) with no horizontal overflow; health
HEALTHY (mailbox, HubSpot, suppression, sender, routing); feedback journey verified end to end (secret query value
stripped, unknown field dropped, build recorded, note dismissed). Semantic dogfood of 10 accounts + an MMYQB candidate
+ a NOT_FIT candidate: `docs/gap/semantic-dogfood-latest.md`.

## V2: resource convergence + decision compression (2026-10-02)

Casey lifted the freeze for ONE bounded refactor: many sensors, one account context, one seller decision cockpit,
workbenches one click deeper. Design and audits: `docs/gap/RESOURCE_CONVERGENCE_AUDIT.md`,
`docs/gap/V2_RESOURCE_AND_IA_AUDIT.md`, `docs/gap/V2_PERSON_PRIOR.md`. The freeze rule above applies again now.

V2 contracts (do not change without a new design decision):

- **One restriction authority** (`src/lib/gap/policy/restriction.ts`, a reviewed code constant: Dannon is warm intro
  only through Mark Shaughnessy). Read by GAP motion (INTRO_ONLY, before the touch hold and reachability), the GAP
  action-time check (fails closed on an alias read error), the legacy send guards, the Outbox writers, the drip, Studio,
  and AT THE WIRE in the Gmail sender (`src/lib/email/restriction-gate.ts`: TO, CC, BCC; only an operator alert or a
  genuine reply to the buyer's own message passes). Account.best_intro_path, warm_intro, outreach_status and
  Persona.intro_route are display only.
- **One WHO comparator** (`src/lib/gap/people/person-prior.ts`): buyer truth > relationship > initiative owner > lane
  > North America (one tier) > network scope > seniority. Lanes and reasons, never a score. The brief, the buyer map
  and the cockpit read it.
- **Geography is two facts about the PERSON** (amendment 2026-10-03; `tests/unit/gap/geography.test.ts`): LOCATION
  (their own record: US / Canada / elsewhere / unknown; a company HQ never fills it) and OPERATING REMIT (the region
  the title says they run; Canada is North America). States: NA_REMIT (North America remit confirmed), US_CONFIRMED,
  CANADA_CONFIRMED, OTHER_REGION, UNKNOWN. The remit decides when stated (a Chicago-based Director, European Logistics
  is another region; a Toronto-based VP, North America Transportation is NA remit), else the location, else unknown.
  The three North America states rank as one tier after the lane: geography never outranks operating ownership.
  The buyer map tags `[North America remit]`, `[US]`, `[Canada]`.
- **Apollo: zero autonomous spend** (amendment 2026-10-03; `src/lib/enrichment/apollo-policy.ts`,
  `tests/unit/apollo-policy.test.ts`). Every credit-capable Apollo call takes an initiator. Automation (crons, agents,
  dogfood, golden runs) is refused unless Casey sets `APOLLO_AUTOMATED_CREDITS_PER_RUN` (default 0; a per-run cap, not a cumulative budget);
  a human-initiated action (Casey clicks enrich on /contacts) is allowed; under the test runner every live call is
  refused whoever asks. The reenrich-contacts cron skips with the reason. Reading Casey's saved Apollo lists costs no
  credits and is not gated. Clawd (separate repo): the committee-enrichment job's paid `people/match` path is capped by
  `APOLLO_ENRICH_MAX_PER_RUN=0` on Railway production (set 2026-10-03; it was enabled with the default 40/run); its
  free sweep keeps `APOLLO_FREE_SWEEP_SPEND_CAP=0`; saved-list sync reads saved contacts (free).
- **Apollo candidates** (`src/lib/gap/people/apollo-candidates.ts`, Sources view, read-only): where a lookup could change
  WHO or NEXT, GAP proposes FIND_OWNER / FIND_EMAIL / CONFIRM_TITLE with what is missing, why, the decision it could
  change, any possible match on record, what it checked first, credit cost UNKNOWN. Checked first: GAP and HubSpot
  people, staged candidates (reviewed before any spend), relationships, a live deal / thread / intro-only account (no
  request: Apollo would not change NEXT), prior Apollo results (never twice). Never for geography alone. Keyed
  account|kind|target, so re-evaluation never duplicates. No control on the page runs a lookup; WHO may stay UNKNOWN.
  Not built: a cross-account batch view (candidates are per account today).
- **One account context** (`src/lib/gap/context/*`): deterministic projections over existing stores (no table, no
  score). Private engagement is interest, never a reason, never in copy or Listen; drip tasks and opens are not
  history. Both loaders' select keys are pinned to the Prisma schema (`tests/unit/gap/loader-schema.test.ts`).
- **NOW / BRIEF / SOURCES** on `/gap/accounts/[slug]` (`?view=`), projections of the SAME brief. NOW: no live model;
  each idea once (NEXT > WHO > WHY NOW > KNOW > THINK); seller tags with the basis on the line ("their own
  publication" only on the account's own domains); the gap before the pitch (current state, impact unknown first, no
  dollars, WEDGE only after a confirmed problem or cost); ASK in discovery order; at most one unverified signal.
- **One task authority**: GAP NEXT. The legacy account page shows it first (legacy suggestions labelled); the Work
  Queue collapses a GAP-managed account's outbound-shaped legacy items into one row (never hidden; ops items
  untouched; most urgent severity kept).

V2 releases (all RED / GREEN / mutation / full suite / typecheck / 17 E2Es / preview READY / production verified):
#357 restriction authority (e03a94fd) · #358 person prior (4a9cbf0d) · #359 context + NOW / BRIEF / SOURCES
(1e46f1dd) · #360 task authority (51792b94) · #361 WHY NOW signal slot (eb56c2a0) · #362 P1 hotfix, a misspelled
GapSignal column emptied signals for ~10 minutes (24fdf835) · #363 final review: restriction at the wire, own
publication by domain (98755437) · #365 seller-review polish: undated signals, Unverified tag, slot accounting, names, View details (cf5d2e9c) · #366 NEXT display name (b7fc4baf). 69 mutants killed across the releases.
Click-test releases (adversarial phone / trust / UX / a11y reviewers, 2026-10-03): #368 operating units, the PepsiCo
division question (607777e5) · #369 deal truth from HubSpot + last touch (e7ae5a72) · #370 capture on the account,
Listen to the brief (86dada39) · #371 buyer map from HubSpot with person location (a4faf511) · #372 faster account
page, WHO tie-breaks (33cba7c5) · #373 real history, latest reply, passed close dates, relevant WHY NOW (4e48cf19) ·
#374 one first-touch answer, honest labels (e8ab3e85) · #375 accessibility + phone UX (4518814a) · #376 honest queue
actions, who Casey met, 45-day WHY NOW window, instant click feedback (a507551f). · #378 an unanswered reply leads,
one last-touch answer, one idea once (55a5ab48) · #379 network program stays WHY NOW 180 days, cockpit title-case
(5d5072e7) · #380 the transportation owner leads over a ready adjacent card, reply opens in Gmail (01813263) · #381
one idea once ignores section labels (11e26869).
Fast-follow debt from the sign-off (none blocking): Kroger WHO names a cold HubSpot contact during a live deal; BRIEF
links 16px; card shows "review_required: critic_review"; Karen Jordan twice in PepsiCo's buyer map; browser title
casing from the slug ("Pepsico"); garbled "Not modeled from public data ... daily trailer moves" YARD line; buyer
maps include non-US / non-company people (Kroger Europe, AWG, Walmart China); queue E2E debris.
Named debt (not fixed): General Mills "Caf Tr s Cora es" is stored mojibake from a filing extraction (repair the
extractor, then re-extract); PepsiCo economics "230 facilities" vs the 105-site footprint; account page 3-25s cold
because production DATABASE_URL has connection_limit=1 (Casey decision); dark-mode --primary contrast (3.68:1) is a
shared design token (Casey decision); legacy /accounts pages still load 12-36s and tell a different story.

Receipt reconciliation (2026-10-03, against the code): restriction authority, account context, NOW / BRIEF /
SOURCES, task authority: SHIPPED + VERIFIED (three adversarial click reviewers signed off YES on NOW). WHO comparator:
SHIPPED BUT NEEDED FIX (Canada-located people ranked "another region"; location and remit conflated): fixed #385.
"Person geography is not stored anywhere": OBSOLETE (HubSpot contact city / state / country read live since #371).
Division modeling: PARTIAL (#368 asks which division owns the yard decision; no per-division owner model). Dark mode:
SHIPPED BUT NEEDED FIX: #384 (tokens, status colors, Tailwind dark variant bound to the theme class). Database:
BLOCKED EXTERNALLY on McKay (production `connection_limit=1`, last changed 2026-05-02; server max_connections 500,
8 in use at check; no application code encodes the limit; nothing built around it).

Amendment review (fresh adversarial reviewer, 2026-10-03; PRs #384 dark mode, #385 geography / Apollo). BLOCKER B1
(a Chicago-based Director, European Logistics became WHO and Apollo treated them as the owner): FIXED, a stated
other-region remit precedes the lane and never becomes the default WHO; pinned at WHO level. SHOULD FIX, all FIXED:
SF1 research ranking counted Canada as abroad; SF2 re-clicking enrich re-spent on already-matched people; SF3 the human
actor was a literal "Casey" (now the session; none, nothing runs); SF4 FIND_OWNER proposed while HubSpot was unread;
SF5 an injected env could bypass the test refusal; SF6 the automation number was named a budget but is a per-run cap.
NICE TO HAVE: "Toronto, ON, CA" read as US and "Americas" claimed a NA remit: FIXED. Mexico is OTHER_REGION everywhere:
Casey's call (the amendment names Canada only). ~30 `text-amber-700 dark:text-amber-400` pairs instead of semantic
text tokens: accepted (the existing badge-variant convention; a guard test keeps them paired). `/discovery` puts
`text-white` on `--primary` (3.68:1 in dark): pre-existing, outside the GAP seller flows. The schema comment at
`prisma/schema.prisma` mentioning `connection_limit=1` is a comment only. REJECTED (verified clean): other Apollo call
paths, the candidate UI, company-HQ contamination of person geography, Apollo content on NOW, duplication of McKay's
DB work, the app-wide `@custom-variant dark`, primary-foreground on non-primary fills.

V2 debt (recorded, not built):
- GitHub Actions does not run: "The job was not started because your account is locked due to a billing issue"
  (every PR since at least #383). Local vitest / tsc / eslint / the 17 E2Es are the gate until Casey clears billing.
- Tailwind token utilities (`text-muted-foreground`, `bg-background`, `ring-ring`; 345+ uses) map to nothing (no
  `@theme`), so focus rings on the shared UI primitives do not render. Mapping them restyles the whole app: Casey's call.
- Apollo candidates are per account; no cross-account batch view yet.
- Division-level owner modeling (PepsiCo: Frito-Lay / PBNA / Quaker) is not built; NOW asks the division question.
- Sub-Zero and World Market (Casey's JOC accounts) are not GAP accounts; their transportation contacts are not in
  HubSpot by title.
- Legacy-path name matching misses brand aliases such as "DanoneWave" (recipient domains are still caught at the
  wire); C06 does not list "you checked out" / "your recent visit" (engagement never reaches the compiler).
- The VP variance ASK needs a title, so a follow-up or referral WHO never gets it.
- The legacy `/accounts/[slug]` page has 7 inner elements wider than 390px (pre-existing).
- clawd's engagement_sync stall alert does not know outreach is paused (fires as a feed break); a connector failure
  looks like a quiet day (debug log, zero rows). clawd repo.
- From the audit: the Discovery snapshot is frozen since June; unstamped Outbox drafts are not checked against GAP
  holds; Analytics mixes GAP and legacy sends; audit-route / QR legacy cards remain on the legacy page.

## Soak (2026-10-02)

Production soak of the baseline: health HEALTHY on every read over ~11h; crons ok with 0 consecutive failures; no
stuck research, signals or send/draft claims; no account auto-created, person merged, buyer truth confirmed,
hypothesis approved or activated, draft, send or enrollment; 147 sources sampled with 0 semantic leaks; Verify proven
side-effect-free on scratch (automatic discovery still promotes); feedback dogfooded end to end with no secret in the
packet; seller journeys 200 at desktop and 390px. Three verified P1s fixed (RED, GREEN, mutation proof each):

- #354: grounded discovery dropped cited pages that block a server read (403, refused connection) as dead; they are
  now kept, labelled unread (verified in production: 14 kept, 0 dead).
- #355: a web-research fact took the search model's date; it is now dated by its page (article metadata or a
  dateline), and an undated page is not verified. Stricter only.
- #355: a thesis held for "a better current fact exists" had no exit in the product; it is now a review reason, so
  Reviewed, keep it shows and clears it (verified on the General Mills page; the decision stays Casey's).

Recorded, not fixed (P2): fund-holdings chatter and place-name collisions among discovery mentions; the call-mode
"FACT OBSERVED" label on a 10-K keyword hit; grounded rotation would treat a content failure as transient if a
provider key were missing (all three keys are set in production). Both soak notes are in /gap/feedback.
