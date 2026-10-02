# GAP stable baseline

STATUS: ACTIVE. GAP is in SELLER DOGFOOD MODE.
<!-- verified:2026-10-02 -->

Production SHA: `762da572c2219a8723946de5cfdad09b1314fc76` (deployment dpl_7qsSxFP4Viy42qieuQuNAHaBkpJS, READY 2026-10-02). Update this line when a change ships.

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
