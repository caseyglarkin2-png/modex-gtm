# GAP weekend reduction pass (2026-09-26)

STATUS: SHIPPED 2026-09-26
<!-- verified:2026-09-26 -->

Goal: Casey makes only the three human decisions (do I believe this, do I
contact this person this way, what did the buyer tell me). Everything else is
system work. Primary surface: `/gap`.

## BEFORE (live production walkthrough, 2026-09-25 evening, after PR #263)

Walked read-only through the CDP rig against `modex-gtm.vercel.app`. No mutating
click, no send. Production state at the time:

- Cockpit: REVIEW 1, RESEARCH 9, READY 0, FOLLOW UP 0, REPLIES 0.
- Hypotheses: 16 `active`, 5 `approved`. Latest routing run
  `run-2026-09-25T21:14:58.645Z` (13 decisions).
- PepsiCo: 9 hypotheses. 5 `approved, not in use` (Casey pressed Approve only),
  3 `active` (adel ghanem, karen jordan, zedric bordelon) plus 1 more `active`.
  **None of the 4 active PepsiCo people has a card in the latest run**: they
  were activated after the last routing run, and nothing routes on activation.
- The Home Depot marcos jaquez: hypothesis `active`, card still says
  "Review hypothesis" (stale card from before activation).
- Kroger joey maggard: Joey hand-sent touch 1 at 21:29 UTC; card shows
  "Touch 1 sent. Nothing to do until then." (correct: WAITING).

### A. New account thesis needing review (PepsiCo, 5 people)

| step | page | click | kind |
|---|---|---|---|
| 1 | `/gap` | REVIEW tile | mechanical (page transition to `/gap/hypotheses`) |
| 2 | `/gap/hypotheses` | read thesis + evidence (auto-open) | judgment |
| 3 | | APPROVE + USE FOR 5 | **decision** |
| 4 | | ROUTE THESE 5 | mechanical |
| 5 | | "Open READY" link | mechanical (page transition) |

- 3 pages, 4 clicks, 1 decision.
- If Casey presses Approve only (he did), the thesis sits in REVIEW as
  "approved, not in use" and REVIEW keeps counting it.
- The ROUTE THESE button exists only in the success banner of that session.
  Leave the page and the only way back is the generic Run routing panel on `/gap`.

### B. Single-source thesis needing corroboration

`/gap` -> REVIEW tile -> Review thesis -> FIND CORROBORATING EVIDENCE -> read
facts -> ATTACH TO N -> (attaching changes the thesis fingerprint, the card
remounts CLOSED) -> Review thesis again -> APPROVE + USE -> ROUTE THESE -> Open READY.

- 3 pages, ~8 clicks, 2 decisions (believe the evidence, approve).
- Dead end: the card collapses after attach; success causes the work to disappear
  from view.

### C. Approved thesis becoming a recommendation

Nothing happens on its own. Casey must remember to press ROUTE THESE N (same
session only) or go to `/gap` and press Run routing, reading "21 routable
hypotheses, 7 accounts". This is the "no READY card" failure: production had 4
active PepsiCo people and 0 READY.

### D. READY person becoming an email send

`/gap?lane=ready` -> card -> "Open action pack (email + call script)" (page
transition to `/gap/preview/<id>`) -> if the copy was never compiled SEND EMAIL
is hidden; open "Save as Gmail draft instead" -> CHECK COPY -> page reload ->
SEND EMAIL -> CONFIRM + SEND -> breadcrumb back to `/gap`.

- 2 pages, 4 to 6 clicks, 1 decision (send it) plus 1 when the copy needs review.
- CHECK COPY is pure machine work when the result is PASS.

### E. Buyer reply becoming confirmed truth

REPLIES tile (page transition to `/gap/replies`) -> click reply -> "Use
suggestion" or a class chip -> Record disposition.

- 2 pages, 4 clicks, 1 decision.

### Friction inventory

- **Duplicate surfaces**: thesis review lives on `/gap/hypotheses`, not the
  cockpit; READY work lives on `/gap/preview/*`; replies on `/gap/replies`;
  the queue carries "In flight (details)" (a paragraph of text) and "Enroll
  rows (details)" (markdown for a retired manual loop) as tabs beside the work.
- **Jargon on every card**: "Casey actually did / I did this / I did something
  else" on research cards where Casey did nothing; "routable hypotheses";
  action/lane enum filters; "GAP recommends what to do next. After you actually
  take the action, tell GAP what you did...".
- **Remember-what-next**: routing after activation; checking copy before send;
  going back to `/gap` after a send.
- **Stale cards**: an activated hypothesis keeps its "Review hypothesis" card
  until someone routes.
- **Queue invariant**: the queue shows only the latest routing run. Any
  single-account run would hide every other account's cards, so "route on
  approve" must route the whole bounded routable scope (cap 25 accounts) and
  report outcomes for the people just approved.

## AFTER (local walkthrough on the branch, 2026-09-26)

Walked with the CDP rig against `next dev` on the branch, pointed at a
disposable local Postgres (embedded, `127.0.0.1:55432`, schema + all four SQL
invariant files, `verify-triggers` 33/33) seeded with two test accounts whose
people use reserved `example.com` addresses. HubSpot was read for TAM only; a
local stub answered the suppression read. No production row was written and
nothing was sent (the driver refuses to click CONFIRM + SEND or CREATE GMAIL DRAFT).
The Vercel preview could not be used: Preview has no DB, auth or GAP flags for
this branch, and wiring production secrets into previews is a config change
this pass did not make.

| workflow | clicks from the lane | meaningful decisions | pages |
|---|---|---|---|
| shared thesis to routed results | 1 (APPROVE + USE FOR N) | 1 | `/gap` |
| research result to routed results (account thesis) | 1 (USE THIS EVIDENCE + APPROVE + USE) after FIND MORE EVIDENCE | 1 | `/gap` |
| research result to routed results (no thesis yet) | PROPOSE THIS THESIS FOR N, then APPROVE + USE in REVIEW | 2 (see below) | `/gap` |
| READY email to sent | OPEN, SEND EMAIL, CONFIRM + SEND (from NEXT UP, DO THIS NEXT opens the card) | 1 | `/gap` |
| READY email, copy needs review | + APPROVE COPY + CONTINUE | 2 | `/gap` |
| buyer reply to confirmed truth | CONFIRM (suggested class) when it needs nothing else; else chip + RECORD. The first reply opens on its own | 1 | `/gap` |

Observed live:
- APPROVE + USE on a 2-person thesis: one click, then "2 APPROVED · 2 IN USE /
  1 ready to contact · 1 on hold" with a CONTACT THEM NOW link. No routing click.
- Routing failure (the scratch DB dropped mid-run): the same card showed "In use,
  but no recommendations yet. Routing failed. (reason) Nothing was sent."
- READY: the card opens its action pack inline; a call card shows CALL and
  says the email is not recommended; an email card's first SEND EMAIL click
  compiled the copy (REJECT on scratch copy citing a news headline, shown
  inline with the reason; nothing sent).
- REPLIES: recorded a disposition in the lane; the item left and the tile went to 0.
- 390px: no horizontal overflow on home, review, research, ready, replies.

Irreducible steps kept on purpose:
- A thesis GAP wrote from scratch (no thesis yet) is a new narrative Casey has
  never read, so PROPOSE and APPROVE + USE stay two judgments.
- OPEN on a READY card is navigation, not a decision; CONFIRM + SEND is the
  send safety gate; APPROVE COPY exists only when the copy check asks for it.
- A reply class that needs the buyer's words (problem confirmed) needs typing.

## Defects found by dogfooding (fixed in this PR)

- The replier showed as READY with a cold first email: R3 `reply_pending`
  routes to `reply_triage`, which `sellerLaneOf` ignored.
- Approving the last thesis emptied REVIEW and unmounted the outcome.
- Run routing aborted at 60s; Casey's real 7-account run took 63.8s.
- REPLIES tile did not refresh after a disposition.
- Found on the production verification after merge (hotfix PR): routing treats an
  `approved` (Approve only) hypothesis as routable, so the 5 PepsiCo people Casey
  had NOT put in use showed as READY, and their send would be refused
  (`hypothesis_not_active`). `sellerLaneOf` now sends them to REVIEW, where the
  open decision (use it?) lives. Routing rules unchanged.

## Surfaces

| surface | old role | new role | action |
|---|---|---|---|
| `/gap` | counts + a queue with tabs and filters | the cockpit: five lanes in place, NEXT UP | CANONICAL |
| `/gap?lane=review` | link out to /gap/hypotheses | thesis cards + one-off hypotheses inline | CANONICAL |
| `/gap/hypotheses` | required review step | All hypotheses: history, every status | DIAGNOSTIC (kept, relabelled) |
| `/gap/preview/*` | required page for READY | deep link + compile report + shadow enroll row | DIAGNOSTIC (kept) |
| `/gap/replies` | required reply page | Reply history (filter kept) | DIAGNOSTIC (kept, relabelled) |
| generic `/queue` copy approval | approval detour | not needed: review is approved inline | LEGACY (not linked from GAP) |
| Discovery draft queue | not GAP | untouched (non-GAP workflow) | kept |
| In flight tab | a paragraph of text | gone | DELETED |
| Enroll rows tab | markdown for a retired manual loop | gone from UI; `GET /api/gap/queue/enroll-rows` kept for agents | DELETED (UI) |
| action / lane enum filters | on the queue | gone | DELETED |
| `GapQueueSection` | wrapper | gone | DELETED |
| ROUTE THESE N | after approve | gone; approve routes | DELETED |
| CHECK COPY | before send / draft | gone; compile runs on the click | DELETED |
| Run routing panel | primary control | "System: routing" details; promoted only while people are in use without a card | DIAGNOSTIC |
| "Casey actually did" | on every card | collapsed "Log what you did" (a GAP send records itself) | HIDDEN |
| subnav Queue / Hypotheses | | Cockpit / All hypotheses | renamed |

Code: 28 source files, +1370 / -960 (net +410). The action pack moved into one
server component (`ActionPackView`) shared by the cockpit and the deep link; the
preview page went from 518 to about 200 lines and `work-queue.tsx` from 375 to
about 240. The net growth is the cockpit doing work that used to live on other pages.

## PepsiCo (production, 2026-09-26 read)

- 9 PepsiCo hypotheses. 5 are `approved, not in use` (Casey pressed Approve
  only): left alone; this pass never activates what Casey did not choose to use.
- 4 are `active` (in use) but have no current card because they were put in use
  after the last routing run. The cockpit shows "N people are in use without a
  current recommendation" with one routing pass.
- What Casey still decides: whether to APPROVE + USE the 5 approved people (one
  click on the thesis card in REVIEW). GAP then routes them and shows who is
  ready, on hold or needs research.

## Debt remaining

PRODUCT
- Research that finds no thesis still needs PROPOSE then APPROVE + USE (two
  judgments). Why: a brand-new narrative. Next: show the proposed narrative
  inline with APPROVE + USE in the research result. Monday: no.
- An open READY card after a REJECT still shows SEND EMAIL until refresh. Why:
  the pack re-reads the compile only on reload. Next: `router.refresh()` on
  refusal. Monday: no.

TECHNICAL
- Routing is sequential per account (about 9s per account in production), and
  approve + use waits for it (about a minute for 7 accounts). Next: parallelize
  account reads inside `runRouting` under the pair cap. Monday: no.
- The queue shows only the latest run, which is why approve routes the whole
  routable scope (cap 25 accounts). Past 25 accounts in use, approve returns
  `routable_scope_too_large` inline. Next: a per-person newest-decision queue
  read. Monday: no.
- PAID (debt burn, 2026-09-26): `shouldNag` moved to `src/lib/intel/refresh-nag.ts`;
  local `npm run build` passes.
- PAID (debt burn, 2026-09-26): the gmail-draft `checkOnly` mode is deleted (the
  route is session-only and no caller sent it).

DATA
- The ambiguous historical bounce population stays suppressed at send (FedEx x2,
  Home Depot Erin show as RESEARCH "no usable email or phone"). Next: per-person
  review with the existing correction script when one becomes a live prospect.
  Monday: no.

EXTERNAL / INFRA
- Vercel Preview has no DB, auth or GAP env, so previews cannot be dogfooded.
  Next: a scratch database branch wired to Preview only (owner decision). Monday: no.
