# GAP stable baseline

STATUS: ACTIVE. GAP V2 is STRUCTURALLY COMPLETE (2026-10-03) and back in SELLER DOGFOOD / FREEZE MODE: the rule below
applies. No V2.1: future changes come from real selling evidence, repeated Casey feedback, production defects, or an
explicit new-version decision. The 2026-10-04 operator-first WHO correction (below) is seller evidence (rule 3), not V3.
<!-- verified:2026-10-05 -->
<!-- verified:2026-10-02 (V2) -->

Production SHA: see "V2 finish" below (the code release is the #392 merge; this doc lands after it). Update this line when a change ships. Update this line when a change ships.
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
- **One WHO comparator** (`src/lib/gap/people/person-prior.ts`): buyer truth > relationship > initiative owner > not
  another region's remit > lane > named ownership > not outside North America > network scope > US market > seniority.
  Lanes and reasons, never a score. The brief, the buyer map and the cockpit read it. **Cold WHO is narrower than the
  buyer map** (2026-10-04, `isColdWho`): the default cold first touch is a direct freight operator (a transportation
  tech / transformation owner only with a named initiative; a site operator only for a site-scoped motion). A VP
  Supply Chain is a sponsor / alternate; with no operator on record WHO is "transportation owner not yet identified:
  research required", and the cockpit suggests nobody (`needs_owner`; Casey's choice still decides).
  `docs/gap/V2_PERSON_PRIOR.md` "Operator-first cold WHO" is canonical.
- **Geography is two facts about the PERSON** (amendment 2026-10-03; `tests/unit/gap/geography.test.ts`): LOCATION
  (their own record: US / Canada / Mexico / elsewhere / unknown; a company HQ never fills it) and OPERATING REMIT (the
  region the title says they run). North America = the United States, Canada and Mexico; generic Latin America / LATAM,
  South America, Central America and the Caribbean are another region (only explicit Mexico or North America evidence
  qualifies; "North and Latin America" includes North America; a mixed remit naming North America or Mexico counts as
  North America). States: NA_REMIT (North America remit confirmed), US_CONFIRMED, CANADA_CONFIRMED, MEXICO_CONFIRMED,
  OTHER_REGION, UNKNOWN. "NL" / "BC" with no country are ambiguous (Canadian province or Mexican state) and say nothing. The remit decides when stated (a Chicago-based Director, European Logistics
  is another region; a Toronto-based VP, North America Transportation is NA remit), else the location, else unknown.
  The three North America states rank after the lane and named ownership: geography never outranks operating
  ownership. Since 2026-10-04 US-first breaks ties among otherwise comparable people (US / NA remit or US-based >
  Canada or Mexico only > unknown).
  The buyer map tags `[North America remit]`, `[US]`, `[Canada]`, `[Mexico]`. WHY NOW treats a Mexican or Canadian
  site as a North America network change.
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
  Cross-account review: `/gap/apollo` (below).
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
extractor, then re-extract); PepsiCo economics "230 facilities" vs the 105-site footprint; legacy /accounts pages
still load slowly and tell a different story. (The account-page latency and the dark-mode token contrast are resolved:
see "V2 finish".)

Receipt reconciliation (2026-10-03, against the code): restriction authority, account context, NOW / BRIEF /
SOURCES, task authority: SHIPPED + VERIFIED (three adversarial click reviewers signed off YES on NOW). WHO comparator:
SHIPPED BUT NEEDED FIX (Canada-located people ranked "another region"; location and remit conflated): fixed #385.
"Person geography is not stored anywhere": OBSOLETE (HubSpot contact city / state / country read live since #371).
Division modeling: PARTIAL (#368 asks which division owns the yard decision; no per-division owner model). Dark mode:
SHIPPED BUT NEEDED FIX: #384 (tokens, status colors, Tailwind dark variant bound to the theme class); validated on production in both themes at 390px (screenshots; alpha- and oklch-correct contrast over every text node: NOW 63, BRIEF 118, SOURCES 735 nodes, 0 below WCAG AA in light and dark; /queue only a decorative "/"). Database: diagnosed and fixed in "V2 finish" below.

Amendment review (fresh adversarial reviewer, 2026-10-03; PRs #384 dark mode, #385 geography / Apollo). BLOCKER B1
(a Chicago-based Director, European Logistics became WHO and Apollo treated them as the owner): FIXED, a stated
other-region remit precedes the lane and never becomes the default WHO; pinned at WHO level. SHOULD FIX, all FIXED:
SF1 research ranking counted Canada as abroad; SF2 re-clicking enrich re-spent on already-matched people; SF3 the human
actor was a literal "Casey" (now the session; none, nothing runs); SF4 FIND_OWNER proposed while HubSpot was unread;
SF5 an injected env could bypass the test refusal; SF6 the automation number was named a budget but is a per-run cap.
NICE TO HAVE: "Toronto, ON, CA" read as US and "Americas" claimed a NA remit: FIXED. Mexico: Casey later decided it is
North America (see "V2 finish"). ~30 `text-amber-700 dark:text-amber-400` pairs instead of semantic
text tokens: accepted (the existing badge-variant convention; a guard test keeps them paired). `/discovery` puts
`text-white` on `--primary` (3.68:1 in dark): pre-existing, outside the GAP seller flows. The schema comment at
`prisma/schema.prisma` mentioning `connection_limit=1` is a comment only (updated in the finish). REJECTED (verified
clean): other Apollo call paths, the candidate UI, company-HQ contamination of person geography, Apollo content on NOW,
the app-wide `@custom-variant dark`, primary-foreground on non-primary fills.

V2 debt (recorded, not built):
- GitHub Actions does not run (account billing lock); Casey: not part of the gate. Local vitest / tsc / eslint, the
  17 E2Es and the Vercel production build are the gate.
- Region: Vercel functions run in iad1, Postgres in Railway us-west2 (project innovative-ambition): every query
  crosses the country. Measured option (not taken): pin functions near the DB (`regions` in vercel.json) and weigh the
  added HubSpot / Gmail latency, or move the DB east. PepsiCo still renders in ~6s warm and Dannon did not improve
  (its critical path is the live HubSpot reads, not DB queueing).
- Decorative breadcrumb "/" separators measure ~1.3:1 (decorative, not content).
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

## V2 finish (2026-10-03)

Code release: #388 semantic tokens, #389 Mexico + Apollo review, #390 badge / DNC / campaign contrast, #391 finish-review
fixes, #392 Contacts status contrast; each RED / GREEN, mutation, full suite, tsc, eslint, the 17 E2Es, a READY Vercel
production build, and production-verified. Production code verified at the #392 merge.

- **Mexico is North America** (`src/lib/gap/people/person-prior.ts`, `tests/unit/gap/geography.test.ts`): location
  MEXICO (country, or a Mexican state; New Mexico stays US), MEXICO_CONFIRMED in the North America tier; "VP, Mexico
  Transportation" is a North America remit; a Mexico City-based "Director, European Logistics" is another region (the
  stated remit wins); generic Latin America is not North America. Golden WHO re-run: identical best person and
  alternate on all eight GAP accounts (no regression); operating ownership still outranks geography.
- **Database** (owned here; no outside dependency). Diagnosis: Postgres is the Railway `Postgres` service in project
  `innovative-ambition` (shared with YardFlow-Worker and YardFlow-Hitlist), region us-west2, reached through Railway's
  public TCP proxy (a direct, unpooled URL; no PgBouncer); Vercel functions run in iad1 on Fluid compute (one instance
  serves concurrent requests over one Prisma pool). The account loader issues 44 queries; with
  `connection_limit=1` they queue on one connection. Proven locally against production (same 44 queries, same summed
  query time): 10.1s at limit 1, 3.4s at 5, 2.5s at 10. Fix (Casey authorized "the smallest safe production fix",
  2026-10-03): production `DATABASE_URL` `connection_limit=1` -> `5`, `pool_timeout=20` unchanged, redeployed (no code
  change). Production, server render time to stream complete, warm: PepsiCo 15.4s -> ~6.3s, Kroger 3.9s -> ~2.1s,
  General Mills 4.3s -> ~1.9s, Tyson 3.7s -> ~2.1s, Dannon 4.2s -> ~4.6s (before: one sample each; after: median of 3;
  first loads after deploy 2.3-12.6s include instance start). Safety: Postgres max_connections 500; after the change
  41 idle + 1 active app connections (about 8 Fluid instances x 5), then 7 idle at a quiet moment. Rollback: set
  `connection_limit=1` on the production `DATABASE_URL` and redeploy (Vercel env is snapshotted at deploy).
- **Design system** (`src/app/globals.css`, `tests/unit/ui/semantic-tokens.test.ts`, `dark-mode-contrast.test.ts`):
  Tailwind v4 had no `@theme`, so the semantic utilities the app already uses (`text-muted-foreground` 346 uses,
  `bg-background`, `border-input`, `ring-ring`, `ring-offset-background`, ...) compiled to nothing and shared focus
  rings never rendered. `@theme inline` now maps every used token to the existing variables; aliases from the existing
  palette (card / popover = background, secondary = muted, *-foreground = foreground); `--input` is a real form-control
  boundary (#8a8a8a light 3.45:1, #6b6b6b dark 3.8:1, WCAG 1.4.11; it briefly aliased the hairline border at 1.26:1);
  Button focus ring-2 with offset. Tests fail if a used token stops resolving. Production regression, light and dark,
  12 pages (GAP NOW / BRIEF / SOURCES / Apollo review / capture, queue, contacts, pipeline, campaigns, engagement,
  studio): 0 text below WCAG AA except the decorative "/"; keyboard focus visible on 12 of 12 tab stops on every page.
  Pre-existing misses the sweep found, fixed at their source: tinted badges -700 -> -800, Contacts DNC / Invalid /
  Synced / issue lines, the Campaigns mode badge.
- **Apollo review** (`/gap/apollo`; `src/lib/gap/people/apollo-review.ts`, client-safe helpers in
  `apollo-review-text.ts`): a thin reader over `apolloCandidates` (no storage, no new authority). Opening the page
  evaluates nothing; Casey picks up to 10 watched accounts (three loaded at a time, the same loader and projection as
  the account page); rows show account, lookup type, target, what is missing, why, the decision it could change,
  possible match, what GAP checked, cost unknown; filters by account / lookup / decision; copy one, selected or all
  shown (clipboard only). One row per gap (alias slugs included); unreadable accounts are listed. No Apollo call.
- **Zero autonomous Apollo spend** (unchanged contract, verified): `apollo-policy.ts` gates every credit-capable call;
  the reenrich cron skipped at 16:00 UTC 2026-10-03 with "Automated Apollo credits per run is 0"; Clawd Railway
  `APOLLO_ENRICH_MAX_PER_RUN=0`, `APOLLO_FREE_SWEEP_SPEND_CAP=0`.
- **Finish review** (fresh adversarial reviewer): B1 "the DB change contradicts a recorded owner decision": resolved by
  Casey's explicit authorization in this task (recorded above). SHOULD FIX, all fixed: `border-input` at 1.26:1 after
  the bridge; "North and Latin America" read as another region; South America read as no remit; the DB story needed
  sample sizes and the region mismatch named (above). NICE TO HAVE fixed: NL / BC ambiguity, accented "México",
  Apollo review error logging, stale schema comment. REJECTED (verified clean): any autonomous Apollo path, test spend,
  client bundle, dedupe, page load, code assuming limit 1 (advisory locks are transaction-scoped), New Mexico,
  WHY NOW for Mexico, NOW / FACT / HYPOTHESIS / BID untouched, no new source of truth.

## Operator-first WHO correction (2026-10-04)

Seller evidence: on PepsiCo GAP recommended a VP Supply Chain while 26 direct transportation / logistics operators sat
in the account's 542 HubSpot contacts. Root cause: the cockpit ranks only READY cards (GAP contacts that pass the legacy
role gate; at PepsiCo four identical VP Supply Chain titles, so Michelle Schlie won on name order), and the brief's
fact-led WHO read GAP contacts in any operating lane. Fix: cold WHO = a direct operator (`isColdWho`); the cockpit's
`needs_owner` state, ranked with each person's HubSpot location; brief sponsor / tech / site slots (one `isSponsor`
rule); mixed compliance / safety titles only when joined by a conjunction; freight finance, HR and non-freight
"operations" never the operator; US-first tie-break; operator-first, source-backed contact discovery; Apollo never
re-finds an email HubSpot holds; the read-only `scripts/gap/operator-contact-audit.ts`. A fresh adversarial review's
blocker and every SHOULD FIX are fixed (one documented: the initiative / site-scoped cold-WHO branches are not yet
wired). Doctrine, root cause, PepsiCo result and the 18-account dogfood:
`docs/gap/V2_PERSON_PRIOR.md`. Production SHA: 87128cc2 (#394, shipped and verified live 2026-10-05). The outstanding first-touch draft to
Michelle Schlie (created 2026-10-05 00:26 UTC) still holds PepsiCo: sending or deleting it is Casey's decision.

## Owner resolution + contact currentness (2026-10-05)

Seller evidence: on PepsiCo GAP named the better operator (Isaac Scott, HubSpot-only) with an instruction and no
control, and the stale first-touch draft to Michelle Schlie held the account with no way to discard it; on FedEx and
Walmart an approved account-level hypothesis (no person) answered Approve + use with the raw word `no_persona`; on
H-E-B a person who had left (Dakota Socha, now ADUSA Distribution) ranked as the operator because a HubSpot modified
date read as currentness. Fix: ONE owner-resolution read (`people/owner-resolution.ts`, loaded by
`owner-resolution-load.ts`) for NOW, hypothesis activation and Research Next; an account-type-aware prior (carrier /
3PL network roles are primary operators); thesis-aware relevance with reasons, never a number; HubSpot first, Apollo
proposed only; ADD TO GAP (account-scoped import: asserts association and the account, dedupes, links, never creates
an account, never writes HubSpot, never calls Apollo, refuses an opted-out contact); audited persona assignment on an
APPROVED hypothesis; contact currentness as a WHO dimension (five states, an evidence hierarchy, decision-time gates on
draft / cold outbound / enroll / routing / assign, human corrections first-class, verification only with a URL,
employer spellings read as the same employer); the outstanding-draft remediation (discard only the proven GAP draft;
reconcile, never infer); the owner panel in the drawer (ranked choice; one eligible person preselected; two or more is
Casey's choice). Contracts that MUST NOT change: owner resolution never picks among two or more; never creates an
account or a web-researched persona; never writes a HubSpot contact; never spends Apollo; the departed and the
conflicted are set aside upstream with the reason, never by do-not-contact; the discard touches only the draft the
ledger proves. Doctrine, root causes, the 11-account dogfood, the adversarial review and the production repair receipt:
`docs/gap/OWNER_RESOLUTION.md`. Production SHA: 71188379 (#396, shipped and verified live 2026-10-05).

**WHO truth maintenance and enterprise coverage (second correction, 2026-10-05; `docs/gap/OWNER_RESOLUTION.md`, last
section).** Role currentness is its own dimension beside employment currentness (`people/role-currentness.ts`: five
states, never a score; a contradicted stored title is never the ranking title; a verified new title is read instead;
`Persona.title` is never rewritten by automation). Ranking is purpose-specific (`owner-resolution.ts`): the cold
first touch stays operator-first; a hypothesis ranks buyer truth, a role CONFIRMED by strong evidence, thesis
relevance, then lane; RECOMMENDED FOR THIS HYPOTHESIS is a first-difference reason, never a selection. The owner
read covers the verified corporate family's linked companies (`family-people.ts`: never by domain or name, never a
divested unit, caps said), and the account-scoped import accepts that family company only after re-verifying it.
Aliases are a governed workflow over `GapAccountAlias` (`alias-review.ts`: proposed from conflict evidence of two or
more people or the account's stem, confirmed or rejected by Casey, never from name similarity). Account kind comes
from the existing vertical (`account-kind-review.ts`, "3PL / Logistics" for carriers and 3PLs). The legacy
suppression review (`suppression/legacy-review.ts`) explains why a person is blocked and clears, on Casey's confirmed
click only, the stale local flag alone (`src/lib/email/suppression-correction.ts`, the one clearer beside the one
setter); a real unsubscribe, opt-out, hard bounce or clawd suppression is never cleared. Contracts that MUST NOT
change: a role changed with no established title, or a role conflict, never ranks; a likely role never outranks a
direct fit; nobody is preselected on a recommendation; family members are read only through their own linked
company; aliases are never auto-created; Unknown stays Unknown on thin evidence; the clear needs confirmed, the
expected email and a live LEGACY_CONFLICT; no file under `src/lib/gap` writes `do_not_contact`. Production SHA:
recorded in docs/gap/OWNER_RESOLUTION.md once Vercel is READY (2026-10-05).

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
