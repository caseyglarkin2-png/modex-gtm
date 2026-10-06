# GAP account-first UX program

STATUS: ACTIVE (program opened 2026-10-05 on Casey's explicit next-version decision; baseline rule 4 in
`STABLE_BASELINE.md`). This is the ONE canonical UX / account-first document. Tickets, measurements, reviewer
findings, contracts and the production SHA live here. `STABLE_BASELINE.md` is reconciled only after ship.
<!-- verified:2026-10-05 -->

## 1. Current-state receipt (2026-10-05, before any opinion)

Reconciled live, not from the brief:

| Item | Value |
|---|---|
| Worktree | `C:\Users\casey\wt-gap-account-first-ux`, branch `feat/gap-account-first-ux`, clean |
| HEAD = origin/main | `54c11c57` (docs: baseline carries the #400 production SHA) |
| Production (modex-gtm) | Vercel READY on `54c11c57` (created 2026-10-05T21:23Z), preceded by `3da77d1e` (#400) and `4ad8b81c` (#399) |
| Open PRs | one, unrelated (#49 content drafts, May) |
| Newer UX docs or branches after #400 | none (vault and repo searched for account-first / people stack) |
| PR #399 / #400 | shipped and verified live per `OWNER_RESOLUTION.md` "Debt closed and the rep-facing surfaces" |
| GAP unit suite baseline | see section 9 (run at the program start) |

### What #399 / #400 already solved (preserved, not rebuilt)

Plain-language owner-panel framing with the question and one rule sentence; compact candidate cards with Details;
set-aside grouped by reason with counts; the three person checks (Verify role / Role is wrong / Left the company) as
small buttons, also for a HubSpot-only person; the legacy suppression review reachable from NOW's blocked list;
employment and role currentness in the pre-call brief; the action-help line that says no email is sent by choosing.

### Verified against current code (section 1 of the brief)

| Claim in the brief | Current code | Verdict |
|---|---|---|
| Owner panel renders every eligible owner | `owner-resolution-panel.tsx` maps `r.eligible` with no cap; the resolver caps only `others` names at 6 | TRUE |
| 35+ candidate rows possible | FedEx dogfood recorded ~35 eligible; nothing in the panel limits rows | TRUE |
| No top-N People Stack | none exists; the sponsor / tech / site slots are one text line under the buttons | TRUE |
| No Account Story projection | NOW has Why now / Know / Think / Impact / Ask lines (`context/now.ts`), no goal / change / network-implication / yard-opportunity / proof / unknowns synthesis | TRUE |
| Cockpit units are Review / Research / Ready / Follow Up / Replies / Deals | `gap-cockpit.tsx` six tiles; NEXT UP is item-level, one per account | TRUE |
| 8 primary subnav items | `gap-subnav.tsx`: Cockpit, Add to GAP, Sources, Signals, Capture, All hypotheses, Learning, Notes | TRUE |
| `max-w-2xl` on the account workspace | all four branches of `accounts/[slug]/page.tsx` | TRUE |
| TTS exists, no robust microphone path | `VoicePreviewButton` + `/api/voice/preview` (ElevenLabs stream); Capture says "tap the microphone on your keyboard"; no `getUserMedia` / `MediaRecorder` / transcription route anywhere in `src` | TRUE |
| No guided account-to-account loop | NEXT UP points at one item; nothing advances to the next account after an action | TRUE |

Additional facts the brief did not assume:

- The owner panel is reachable ONLY inside the hypothesis drawer (`hypothesis-drawer.tsx`), opened by clicking a row
  on `/gap/hypotheses` or in the Review lane; there is no deep link to it and the account page does not link to it.
- NOW's WHO comes from the person prior (`brief.people.primary`), not from the owner-resolution read; the two agree
  by construction for the cold first touch (the same prior) but are separate code paths.
- `PersonaAngle` (`motion/persona-angle.ts`) already exists: one human-owned "why this person" line, append-only
  audit row, machine suggestion from title + persona key only.
- The app-wide Ctrl+K `CommandSearch` reads the static `accounts.json`, not GAP accounts; GAP has no account index.
  The sidebar "Accounts" is the legacy `/accounts` table.
- Production auth is Google-only; the rig Chrome carries Casey's live session, so the audit runs read-only through it.
- Production env already holds `ELEVENLABS_API_KEY`, `OPENAI_API_KEY`, `AI_GATEWAY_API_KEY`, `GEMINI_API_KEY` and
  `NEXT_PUBLIC_POSTHOG_KEY`; PostHog is wired only on the microsite surfaces (`lib/analytics.ts`), not in the app shell.
- The Capture flow writes through `POST /api/gap/captures` (typed capture, extraction, review, save).
- Freeze rule: this program is rule 4 (Casey's explicit next-version decision); the P2 / P3 debt list in the baseline
  stays recorded unless a ticket here needs it (section 10).

## 2. Research (external guidance adopted)

Sources fetched 2026-10-05 (full brief with quotations in the UX-01 audit packet; the principles are restated here so
the document stands alone).

| # | Principle we adopt | Sources |
|---|---|---|
| 1 | The account is the object; the people stack is the first disclosure and the full candidate set is one labelled, counted step away | NN/g progressive disclosure (nngroup.com/articles/progressive-disclosure); Salesforce Account Plans (trailhead.salesforce.com, account-based-selling); Baymard truncation (baymard.com/blog/truncation-design); Vercel Geist Show More (vercel.com/geist/show-more) |
| 2 | Show 3 to 5 people, never pad to 5, and say why the cut was made | NN/g choice overload (nngroup.com/videos/choice-overload) and simplicity vs choice; Microsoft HAX G10 scope services when in doubt |
| 3 | Every ranked person carries a visible reason and a confidence cue, with Details behind it | HAX G2, G4, G11 (microsoft.com/en-us/haxtoolkit/library); NN/g recognition rather than recall |
| 4 | The human chooses and nothing sends; each choice is reversible in one visible step and its effect on future ranking is stated | NN/g user control and freedom; HAX G9 support efficient correction, G16 convey the consequences of user actions |
| 5 | Prevent slips with defaults, constraints and forgiving input rather than confirmations | NN/g error prevention (nngroup.com/articles/slips); Casey's velocity-over-guards rule |
| 6 | Always show state: ranking freshness, reads in flight, recorder status, transcription pending | NN/g visibility of system status; HAX G3 |
| 7 | Voice is an accelerator layered on a complete keyboard and pointer path: MediaRecorder plus a server transcription API; SpeechRecognition only as enhancement | MDN MediaRecorder (Baseline widely available since 2021-04); MDN SpeechRecognition ("not Baseline", Chrome sends audio to a server); caniuse speech-recognition (Firefox unsupported through 160) |
| 8 | Full keyboard operability, visible focus, meaningful focus order, no traps | WCAG 2.2 SC 2.1.1, 2.1.2, 2.4.3, 2.4.7 (w3.org/TR/WCAG22) |
| 9 | Any sticky action bar is opaque, minimal, 44 px targets, never covers focused content (scroll padding) | WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum), 2.5.8 Target Size (Minimum, 24 px), 2.5.5 Enhanced (44 px); NN/g sticky headers |
| 10 | Feedback is granular and in flow; the system remembers the recent conversation | HAX G12, G15, G17; HubSpot suggested tasks (knowledge.hubspot.com/sales-workspace/manage-sales-activities-in-the-updated-sales-workspace) |

Sales-workspace patterns noted, not cloned: Salesforce Work Queue (one queue, one next best action, the human executes)
and Agentforce account research (the agent drafts the account picture, the rep edits, every claim sourced); HubSpot's
Summary tab (suggested tasks with rep feedback, a count is the entry point to that work) and guided execution (queue
left, action centre, record preview right, Complete and arrow navigation).

Transcription providers already in the stack (no new vendor needed): ElevenLabs Scribe v2 at $0.22 per audio hour
(elevenlabs.io/pricing/api) and OpenAI whisper-1 / gpt-4o-transcribe at $0.006 per minute (developers.openai.com/api/docs/pricing).
Both keys are in production. Any use of either for transcription is a new SPEND on an existing provider and is
reported before it is built (brief section 22).

## 3. Heuristic audit of the shipped UI (UX-01, production, read-only, 2026-10-05)

Method: the live production app through the rig Chrome under Casey's session; every page captured at 1440, 768 and
390 CSS px, light and dark, full page, with innerText, interactive-element and target-size counts; four click paths
followed (NEXT UP, NOW to Review the thesis on PepsiCo and Walmart, cockpit to account to capture); the hypothesis
drawer opened for FedEx, Walmart, PepsiCo and General Mills. Nothing was clicked that writes. Screenshots and metrics:
the UX-01 audit packet (scratch, not committed; the numbers that matter are in section 7).

### 3.1 What a seller sees today, surface by surface

**Cockpit `/gap`.** One screen: health strip, six count tiles, NEXT UP (one item, three "Then" lines), System:
routing. NEXT UP is item-level and lane-labelled ("Buyer replied: timothy.cooper@walmart.com replied", "Judge 2
verified facts at PepsiCo (needs research)"). It answers "what next" but not "which accounts need me, why, with whom":
on 2026-10-05 the real work (PepsiCo needs an owner decision, Walmart is paused on a reply, FedEx has an unanswered
reply from June, General Mills has a thesis to judge) is spread over four lanes and nothing lists accounts.

**Lanes.** Review (1 one-off row in a table: Account, Family, Persona, Status, Confidence 0 %, Signals "open to see").
Research: ONE page of 25.7 screens, 7,167 words, 947 links, 974 targets under 24 px, every eligible quote of every
account expanded with Ignore / Open source under each. Ready: 0 in the tile, but the lane shows PepsiCo's ACCOUNT
MOTION with five lower-cased people ("michelle schlie", "salvador rosas gutierrez", "mohamed garana" in Cape Town), each
with the same suggested why and a "Make X the primary" button, and Walmart's motion paused on the reply. Replies: one
reply with a response-class form. In deals: 13 accounts with "0 of 6 known" and a Deal brief link each.

**Account NOW.** 1.3 to 1.8 screens at 1440 (473 words for PepsiCo) in a centred `max-w-2xl` column: roughly 60 % of
a 1440 px desktop is empty (screenshot `desk2/gap_accounts_pepsico`). Order: state line, last touch, division unknown,
NEXT (one sentence plus one link), WHO (name, title, location, HubSpot-only warning, Add to GAP, the generic reason
"Primary operator: title says they run transportation, freight or fleet; US-based; network scope.", three check
buttons, Alternate, do-not-contact list with a review link per person), WHY NOW (2-3 tagged lines), THE GAP, KNOW,
THINK, IMPACT, ASK, RELATIONSHIP, private line, tools row. Decision-grade view in 5 to 10 s (live HubSpot reads).

**Account BRIEF / SOURCES.** 3.9 and 4.8 screens for PepsiCo; SOURCES carries 54 small targets. Both are depth, not
decision.

**Hypothesis drawer (owner panel).** Walmart's approved hypothesis: "53 plausible owners for this hypothesis: choose
one. GAP does not pick.", 53 radio cards, 130 interactive elements, 12 sheet-screens; every card carries the same two
lines ("Primary operator: title says they run transportation, freight or fleet." and "Thesis fit: runs transportation:
the fact is a site opening or expansion"), so the reasons do not discriminate; the USE / Attach buttons sit under card
53; the sponsor, technology and site people are one text line at the bottom; "Show 11 set aside" is below that. The
panel is reachable only by clicking a row on All hypotheses or the Review lane; nothing on the Walmart account page
links to it. FedEx (active, Casey chose Glen Chaffee on 2026-10-05) and PepsiCo (active) no longer show the panel.

**Review the thesis (the NOW control).** PepsiCo NOW says WHO = Karen Darling; the control lands on
`/gap/preview/<id>`, an action pack addressed to **Shawn Miller** (senior supply chain specialist, "may see where
trucks wait without owning the decision"), a person NOW never mentions, with a full email and call opener for him.
Walmart NOW says WHO = Doug Estrada; its control lands on a pack that says "No person on this card" and "MISSING
PREREQUISITE: No person is attached to this action pack", while the other Walmart hypothesis is active with Doug
Estrada and the owner choice for this one lives in the drawer. The decision surface and the action surface name
different people.

**Capture.** `/gap/capture`: type chips (Meeting, Call, Conference, Email, LinkedIn), WHO, note field ("tap the
microphone on your keyboard"), Save note. One click from NOW ("Log what happened") with the account prefilled. Good.

**Tools.** Add to GAP, Sources, Signals (22.8 screens, 2,683 words, 137 small targets), All hypotheses (table with
"Confidence 0 %", "open to see", "30 hypothesises"), Learning (12.6 screens), Apollo review (76 small targets), Notes.

**Navigation.** Eight GAP tabs plus the app sidebar (Home, Accounts, Content Studio, Pipeline, Campaigns, Contacts,
Engagement, Work Queue, Analytics, Discovery, GAP OS, Ops) plus Quick Capture. No GAP account index and no GAP account
search: the Ctrl+K command search reads the static `accounts.json` and opens the legacy `/accounts/<slug>` page.
Reaching PepsiCo from the cockpit takes a lane that happens to list it (Ready tile, then the PEPSICO link) or a typed
URL. The breadcrumb is Home / GAP on every lane; the account page has no breadcrumb.

**Mobile 390.** No horizontal overflow on any captured page; the six tiles wrap to two rows; the subnav wraps to two
rows; NOW's order holds (state, NEXT, WHO above the fold); the Research lane and Signals are unusable by length;
"Listen" is a 44 px control, the three person checks are 24-32 px.

### 3.2 Findings against the eight seller questions

| Seller question | Today | Verdict |
|---|---|---|
| Can I tell what account to work? | NEXT UP names one item; the account picture needs four lanes; no account list, no state per account | NO (partial: the single next item is good) |
| Can I understand the account quickly? | NOW is good and short (state, NEXT, WHO, WHY NOW in 1.5 screens); but WHY NOW is three raw signals, THE GAP is "Unknown · Our read · Unknown", nothing says what the account is trying to do or where the yard fits | PARTLY |
| Can I see the few people that matter? | NOW: one WHO plus one Alternate plus a do-not-contact list. The owner decision: 53 cards. The Ready lane: five lower-cased people with identical reasons | NO |
| Can I understand why? | The reason line is a title-rule sentence repeated for everyone; RECOMMENDED appears only on a strong first difference (none on Walmart); Details hides the only discriminating facts (location, employment, role, source) | NO |
| Can I choose or override easily? | Choose: drawer only, under 53 cards, two buttons whose labels say "routing". Override NOW's WHO: impossible from the account page (only Add to GAP / Verify role / Role is wrong / Left). "Make X the primary" exists only in the Ready lane motion block | NO |
| Can I prepare outreach without GAP's internals? | The draft is good copy, but reaching it means Review the thesis (a word), a preview page for a hypothesis id, then "Open the Ready lane" and a card; on PepsiCo it addresses a different person than NOW chose; on Walmart it dead-ends | NO |
| Can I capture what happened? | One click from NOW, account prefilled, typed or keyboard dictation; saved through the audited capture path | YES |
| Can I move to the next account? | Back to Cockpit, read NEXT UP again; no "next account", no sequence, context lost | NO |

### 3.3 Friction register (severity: BLOCKER blocks the ordinary task; SHOULD materially slows it; NICE)

| # | Finding | Evidence | Severity |
|---|---|---|---|
| F1 | The decision surface and the action surface name different people (PepsiCo: Karen on NOW, Shawn on the pack; Walmart: Doug on NOW, nobody on the pack) | click paths `path-pepsico-thesis`, `path-walmart-thesis` | BLOCKER |
| F2 | 53 candidate cards with non-discriminating reasons before the choose button; the real discriminators are inside Details | `drawer2/drawer_Walmart_Inc_` | BLOCKER |
| F3 | No account-level work list: which accounts need me, their state, their next person, is not visible anywhere | `/gap` 111 words, item-level NEXT UP | BLOCKER |
| F4 | No way to say "make this person next" or "not a fit" from the account page; the choose control is in a drawer reached from a table of hypotheses | `account-now.tsx`, `owner-resolution-panel.tsx` mount in `hypothesis-drawer.tsx` | BLOCKER |
| F5 | Machine words in the seller path: "thesis", "hypothesis", "routing", "card", "persona", "hidden capacity for supply chain", "Confidence 0 %", "open to see", "shadow", "Attach only" | lanes, drawer, preview, action help | SHOULD |
| F6 | Research lane is one 25-screen page with 974 undersized targets; Signals 22 screens | `desk2` metrics | SHOULD |
| F7 | NOW uses about 40 % of a desktop; the decision (NEXT, WHO) and the context (WHY NOW, KNOW) compete in one narrow column | `desk2/gap_accounts_pepsico` | SHOULD |
| F8 | No account search or index inside GAP; Ctrl+K opens the legacy account page | `command-search.tsx` | SHOULD |
| F9 | Next-account flow does not exist; after capture the seller returns to the cockpit and starts over | click path `path-ready-to-account` | SHOULD |
| F10 | The Ready lane shows lower-cased names and five identical suggested whys; a Cape Town VP ranks beside a US one with "Make X the primary" on each | `desk2/gap_lane_ready` | SHOULD |
| F11 | Internal intelligence is not read for the account picture: NFI NOW says "No touch on record" while clawd holds a 2026-05-28 send to ryan.hranica@nfiindustries.com, 7 emails, 11 reply-intent rows and 6 microsite sessions; the vault and clawd are not readers of `context/load.ts` | clawd `/api/outreach/history`, `/api/yardflow/intel/account` | SHOULD |
| F12 | NEXT UP's second and third items are research chores ("Judge 2 verified facts") ranked above an owner decision that unblocks a first touch | `/gap` NEXT UP | SHOULD |
| F13 | The eight GAP tabs plus twelve sidebar items; Sources, Signals, All hypotheses, Learning, Notes are admin or diagnostic | `gap-subnav.tsx` | SHOULD |
| F14 | Listen exists on NOW and BRIEF; no "listen to today"; no dictation beyond the OS keyboard mic; no account-scoped ask | `voice-preview-button.tsx`, `capture-flow.tsx` | NICE (candidate, not yet evidenced) |
| F15 | The three person checks (Verify role / Role is wrong / Left) are 24-32 px targets; set-aside review links are 11 px text | drawer metrics small=5-9 | NICE |
| F16 | Dark mode: readable; the amber warning text and the dashed private line hold contrast; no finding | `mobile2` dark captures | KEEP |
| F17 | Capture: one click, account prefilled, audited save | `/gap/capture` | KEEP |
| F18 | Safety visibility: do-not-contact names, the legacy review link, "no email is sent by this click", the paused-on-reply motion, the In Deals rule all read clearly | NOW, drawer, Ready lane | KEEP |

Already fixed by #399 / #400 and confirmed live (not re-opened): plain-language owner framing, compact cards with
Details, grouped set-aside with counts, the three checks for a HubSpot-only person, the legacy review from NOW, role
and employment currentness in the call brief, the no-email action help.

## 4. IA alternatives and the accepted design contract

Three directions, written as text wireframes before any implementation (UX-02). All three keep every safety contract in
`STABLE_BASELINE.md` and section 43 of the brief; they differ in where the seller stands and how far the lanes recede.
The same eight seller tasks (section 3.2) are the test. Reviewer comparison and the chosen direction follow in 4.4.

### 4.1 Direction A: Work list of accounts, account workspace, lanes as filters

Top-level GAP navigation becomes three items plus an overflow:

```
WORK          ACCOUNTS          CAPTURE                              More v (Add to GAP, Sources, Signals,
                                                                              All hypotheses, Learning, Notes, Apollo)
```

WORK (`/gap`) is a list of accounts that need the seller, one card per account, ordered by the existing NEXT UP rules
(reply, follow up, ready, owner decision, review, research), with the lane chips as filters and counts:

```
WORK  [All 14] [Replied 1] [Follow up 0] [Ready 0] [Decide 2] [Research 9] [In a deal 13]   search accounts...

+------------------------------------------------------------------------------------------------+
| WALMART INC.                                           Someone replied  ·  paused for the reply |
| timothy.cooper@walmart.com wrote Oct 5: "Re: Leaving this with you"                              |
| NEXT: read the reply and record what they said                       [Open the reply]  [Open]   |
+------------------------------------------------------------------------------------------------+
| PEPSICO                                                   Choose the first person  ·  ready once |
| Network modernization: Gatik autonomous freight, plant footprint trimming                        |
| 1. Karen Darling, Sr Director PBNA Transportation (in HubSpot)   NEXT: add Karen and prepare     |
|                                                                   [Choose Karen]  [Open]         |
+------------------------------------------------------------------------------------------------+
| FEDEX                                                     Reply waiting 125 days  ·  in a thread |
| Courtney Keen wrote Jun 2. Owner chosen: Glen Chaffee.      NEXT: answer or close the thread     |
|                                                                   [Open the thread]  [Open]      |
+------------------------------------------------------------------------------------------------+
| GENERAL MILLS                                              Thesis to judge  ·  not contacting yet |
| Network redesign ($3B cost program, plant and warehouse network)                                  |
| Phillip West, Sr Director NA Logistics (in HubSpot)        NEXT: judge the fact, add Phillip      |
|                                                                   [Judge]  [Open]                |
+------------------------------------------------------------------------------------------------+
```

Each card answers account, why it deserves attention now, state, next person, next action, blocker. The lanes still
exist as filters and keep their counts; nothing is a separate inbox. [Open] goes to the account workspace with
`?from=work` so the workspace can offer "Next account" in the same order.

ACCOUNTS (`/gap/accounts`) is a searchable index of every GAP account (name, state, next person, last touch) and the
one place the Ctrl+K search also reaches. CAPTURE is the existing capture flow.

The account workspace (`/gap/accounts/<slug>`, NOW) widens to two columns on desktop and stays one column at 390:

```
PEPSICO                                           shipper · ready for a first touch · last touch Jun 10 (117 d)
[Now] [Brief] [Sources]                                                             [Listen]  [Next account >]

WHAT I WOULD DO NEXT                              | PEOPLE (top 4 of 19 on record)       [Show 15 more]
Add Karen Darling from HubSpot and prepare a      | 1. KAREN DARLING  Sr Director PBNA Transportation
first touch on the Gatik network change.          |    Best fit: runs PBNA transportation; the Gatik
                                                  |    program lands on her network. Role: verified.
WHO FIRST   Karen Darling                         |    Email on record.      [Choose]  [Why #1?]  [...]
why: owns the PBNA transportation network the     | 2. Matt Laneve  Logistics, Distribution & Transp. Sr Dir
Gatik program runs on; role verified Oct 2026     |    Next if no response. Adjacent operator.  [Make next]
                                                  | TECH    Amy Lewis (if on record)         [Details]
[Prepare email]  [Call prep]  [Log a touch]       | SPONSOR Michelle Schlie  VP Supply Chain [Details]
                                                  | Not contacted: Dr. Isaac Scott (do not contact) [Review]
--------------------------------------------------+-------------------------------------------------------
ACCOUNT STORY                                                                             [Listen to story]
Goal        Productivity and network modernization across PBNA / Frito-Lay      Our read
Changing    Gatik autonomous freight partnership (Jun 2026, ongoing); Maryland plant closing (Sep)   Checked
Network     More autonomous linehaul into DCs; fewer plants carry the same volume          Our read
Yard        Gate and dock handoffs become the constraint before doors do                   Our read
Proof       Primo: 48 to 24 minutes measured at 24 sites (modeled $1M+/site)               Checked
Unknown     Which division owns the yard decision (PBNA, Frito-Lay, Quaker, Gatorade)      Unknown
Stories that matter (3)  v           Full buyer map (19)  v           Sources (41)  v
BEST OPENING for Karen                                                                      [Use a different story]
"PepsiCo and Gatik ... autonomous freight into day-to-day operations" (pepsico.com, Aug 25, OK to cite)
Why she cares: the autonomous linehaul terminates at her DCs.   Do not use: microsite interest (private).
```

Choose / Make next / Not a fit / Not now / Wrong role / Left / Verify are the human-priority controls, recorded as
the existing audit rows (persona angle, motion choice, employment and role corrections); a new preference row only if
no existing row fits. Choosing never sends. The action pack for a person is built for THAT person (fixes F1). The
per-hypothesis owner panel stays in the drawer for the analyst path and reads the same stack.

### 4.2 Direction B: Guided focus mode (three panes)

```
+-------------------+----------------------------------------------+------------------------------+
| QUEUE (14)        | PEPSICO                                      | CONTEXT                      |
| > Walmart  replied| What I would do next ...                     | Account story (6 lines)      |
|   PepsiCo  choose | WHO: Karen Darling  [Choose] [Why]           | Best opening                 |
|   FedEx    thread | [Prepare email] [Call prep] [Log]            | Sources                      |
|   General Mills   |                                              | Buyer map                    |
|   ...             | [Skip]                      [Done, next >]   |                              |
+-------------------+----------------------------------------------+------------------------------+
```

WORK opens as a focus mode: queue left, decision and action centre, context right; Done advances. The account page
remains for deep links. Strengths: never leaves the loop; the action sits beside the decision. Weaknesses: a new
shell inside the app shell (a second sidebar), hard at 768 and impossible at 390 without collapsing into Direction A
anyway; evidence lives in a third pane that is easy to ignore; a queue with Done feels like a wizard; the most code.

### 4.3 Direction C: Keep the cockpit, add the stack and the story inside NOW

The six tiles and NEXT UP stay. NEXT UP grows into the top five accounts (one line each). NOW gains the People Stack
(top 3-5, show more) and an Account Story block in the same single column; "Next account" is added to the tools row;
the subnav drops to Cockpit, Capture, Notes with the rest under More; the Ctrl+K search learns GAP accounts.
Strengths: the smallest diff; every surface stays familiar. Weaknesses: the lanes remain the primary mental model;
the account list is still not a surface; the narrow column keeps decision and context in one scroll; the drawer stays
the only choose control unless the stack also chooses (then it is Direction A's workspace in a narrower frame).

### 4.4 Reviewer comparison and the chosen direction

Five fresh read-only reviewers (none wrote the audit or the directions; each saw the live captures, the audit and the
three wireframes; the new-BDR reviewer saw only the live captures): a senior product designer with a human-factors
brief, an enterprise AE / BDR workflow expert, a human-AI interaction and trust reviewer, an accessibility / mobile
reviewer who also answered the adversarial-minimalist question, and a new BDR given the five-actions task with no
training. Scores are 0-2 per seller question, eight questions.

| Reviewer | Live | A | B | C | Pick |
|---|---|---|---|---|---|
| AE / BDR workflow | 4 | 16 | 14 | 10 | A |
| Product designer / cognitive load | | 15 | 13 | 10 | A, with one shared pursuit state and B's "Done, next" |
| Accessibility / mobile (mobile + keyboard only) | | 2 + 2 | 0 + 1 | 1 + 1 | A, one column first |
| Human-AI interaction / trust | | A fixes the structure; its wireframe over-claims where the live code is careful | | | A, with the trust-tag and recommendation rules in section 5 |
| New BDR (live product only) | FAIL: 21 pages, ~80 min, 5 backtracks, 40 unexplained words | | | | "one ranked list for today; replies read by meaning; plain words and buttons that do what they say" |

**Chosen: Direction A**, with these changes taken from the reviews:

1. **One pursuit state per account, read by every surface.** The Work card, the NOW header, the People Stack, the
   action pack, the Ready filter and the analyst drawer all render from one read: state, chosen person (the newest
   audited choice), blocker, last inbound, last outbound, reply class. This is what the Walmart (NOW blind to today's
   "stop" reply) and FedEx (NOW blind to Casey's Oct 5 choice of Glen Chaffee) contradictions prove is missing, and
   it is what makes F1 impossible by construction. A parity test on the Walmart, FedEx and PepsiCo fixtures pins it.
2. **Replies are classified before they rank.** An opt-out ("stop"), an out-of-office, an auto-reply and a human
   reply are different states with different consequences; only a human reply heads the Work list. Today both the
   NEXT UP headline "Buyer replied" and FedEx's "Reply waiting 125 days" are wrong by this rule.
3. **"Done, next" from Direction B.** The account workspace ends with one control that records an outcome or a
   snooze, then advances to the next account in the Work order frozen when Work was opened (`?from=work&i=n`), with
   Back returning to the previous account and "Back to Work" restoring the filter and focusing that card.
4. **The left column is one decision block**: the suggested next action with its rule, the chosen person shown once
   (WHO FIRST and stack #1 are the same person), the unknown that could change the choice, the opening with its cite
   status, three actions, Done next. The right column holds the alternatives and the buyer map. Sponsor and tech
   rows are level 2 for a first touch.
5. **No manufactured certainty.** On a tie (Walmart: 43 people share one title rule) the stack shows no ordinals,
   says "GAP could not separate N people on evidence" and names the tie-breaker; "Best fit" appears only when the
   resolver returns a recommendation; "[Choose X]" is preselected only when exactly one person is eligible (the
   existing contract). Every visible reason is the discriminating one (location, role currentness, source, remit),
   never the shared title rule.
6. **Seller words.** The AE's replacement table (section 8) is the vocabulary: angle for thesis, "who hears this
   first" for owner resolution, "what did they say" for disposition, "Updated 2h ago" for routing refreshed; the
   machine labels stay on Sources and System details.
7. **Mobile and keyboard gates**: one column at 390 with the NEXT control and Choose on cards 1-3 reachable without
   scrolling past the stack; no sticky view tabs at 390; one opaque bottom bar (Listen, Log a touch, Next account,
   44 px each) with `scroll-padding` set for header and bar; the Listen player gets pause and unmount cleanup; the 24
   px floor everywhere on the seller path.

Rejected: Direction B's three-pane shell (a second sidebar; collapses into A at 768 and 390; the evidence pane is
ignorable); Direction C (the lanes stay the mental model, the drawer stays the only choose control, NOW grows past
four screens on a phone).

Resolved with Casey (2026-10-05): the 175 % zoom is his real working setting on his desktop monitor ("old and
wacky"), so his desktop renders modex-gtm at about 820 CSS px. Design consequence: the ONE-COLUMN layout is the
primary desktop design and must carry the whole decision (state, next action, chosen person, stack top 3, actions)
in the first two screens; the two-column grid is an enhancement at 1100 CSS px and wider. Every post-change
measurement is taken at 820 CSS px (his view) as well as 1440 and 390.

## 5. Contracts

These are design contracts for the tickets in section 6. Each one is pinned by a unit test when it lands; the test
names are recorded beside the ticket. Nothing here weakens a contract in `STABLE_BASELINE.md`.

### 5.1 Pursuit state (one read per account)

- One pure projection (`gap/pursuit/state.ts`, over loaders GAP already has) returns, for one account: `state`
  (replied, paused_on_reply, follow_up_due, ready, choose_person, judge_angle, research, in_deal, held, idle),
  `person` (the newest audited human choice, else the resolver's single eligible person, else null), `blocker` (one
  sentence or null), `lastInbound` and `lastOutbound` (GAP sends, Gmail threads, HubSpot activity, clawd outreach
  history, each with its source), `replyClass` (human, opt_out, auto_reply, out_of_office, bounce, none).
- Every seller surface (Work card, NOW header, stack, pack, Ready filter, drawer headline) renders from it; no
  surface computes its own state. Parity test: Walmart (paused on an opt-out), FedEx (owner chosen, old out-of-office),
  PepsiCo (choose person), Kroger (in deal) render the same state and person everywhere.
- A `held` account (open deal, family hold, warm-intro-only, paused on a reply) shows the hold in the first line on
  every surface; nothing below it offers a cold first touch.

### 5.2 People Stack

- Default visible: the top 3 to 5 of the resolver's eligible list, never padded; the exact count hidden is in the
  control ("Show 15 more, ranked lower on evidence"). Fewer than 3 eligible: show what exists, say why.
- Each visible row: name, title, pursuit slot, ONE discriminating reason (what sets this person apart from the next:
  remit, location, role currentness, relationship, source), currentness or restriction only when material,
  reachability (email on record / HubSpot only / no contact data), and the row's action.
- Ordinals appear only when the resolver's order is evidence-backed between those rows; on a tie the rows carry no
  numbers and one line says "GAP could not separate N people on evidence; tie-break: <rule>".
- "Why #1?" expands the first difference against #2, the dated basis of each, and what would change the order.
  Details (existing) holds geography, employment, role, source.
- The full list ("Show N more") is the existing grouped list with set-aside reasons and counts; it stays reachable
  from the stack and from the analyst drawer. No safety fact is hidden behind disclosure: do-not-contact, left,
  conflict and hold appear on the collapsed view as one line with a count.
- The same stack feeds NOW, the Work card's "next person" and the per-hypothesis owner panel (the panel keeps its
  USE / Attach semantics for the analyst path).

### 5.3 Pursuit slots and motion

- Slots: NEXT OPERATOR (the one active cold first touch), SECOND OPERATOR (a different reporting line), TECH /
  TRANSFORMATION (in parallel only when the trigger names their program), EXECUTIVE SPONSOR (never a cold first
  touch; unlocked by a meeting, a referral or Casey's explicit choice), SITE / REGIONAL OPERATOR (when the trigger
  names a site, or after an operator conversation), RELATIONSHIP ROUTE (first, when real: met in person, an intro, a
  customer or partner; a newsletter subscriber or a page visit is a signal, never a relationship).
- One active cold first touch per account (per division where divisions buy separately): the existing
  `account-motion.ts` rule stands. The stack shows NOW, NEXT IF NO RESPONSE (and what unlocks it: the existing 5
  business days, or at once on "wrong person", a failed address or a named referral), TECH, SPONSOR.
- A human reply anywhere at the account pauses every cold motion until it is recorded; an auto-reply or
  out-of-office pauses only that person until the return date; an opt-out marks that person do-not-contact and cools
  the account (14 days, shown); a warm touch never uses the slot; an account in a deal gets no cold touch.

### 5.4 Account Story (derived, never stored)

- One pure projection over the account brief, the account context, approved angles, buyer truth, relationship
  history, clawd outreach history and the vault's account note where one exists (readers only; no new table).
- Rows: GOAL, WHAT IS CHANGING, PHYSICAL-NETWORK IMPLICATION, YARD OPPORTUNITY, BEST PROOF, WHAT WE NEED TO LEARN,
  STORIES THAT MATTER (top 2-4). Every sentence (not every row) carries a tag: Buyer said, Checked, Unverified, Our
  read, Unknown, Contradicted; a line takes the weakest class of its inputs; a line with no basis is Our read or
  Unknown. YARD OPPORTUNITY is always Our read unless the buyer confirmed it. BEST PROOF is tagged YardFlow proof
  (measured or modeled), never Checked, and it belongs beside the opening, not in the account's facts.
- An UNVERIFIED item that names the chosen person's employer, division or a divestiture is not sunk below checked
  facts: it rises beside the person as "check before contacting" (FedEx: the CMA CGM sale of FedEx Supply Chain
  against Courtney Keen's title).
- Private engagement (microsite sessions, ROI reads) is never a story row and is never read aloud; it stays the
  labelled private line.
- The story feeds the opening but is not the email: ACCOUNT STORY is not EMAIL COPY.

### 5.5 Outreach anchor and person angle

- For the chosen person: ONE anchor (one checked, dated, citable fact on their remit), WHY THEY CARE (Our read,
  one sentence), one optional SUPPORTING FACT, and DO NOT USE (private engagement, modeled dollars as their pain,
  imagery facts, unverified items, facts marked not for outreach). The seller can pick a different story; the
  choice is recorded.
- The action pack is built for the chosen person (fixes F1). A pack with no person offers the stack inline
  ("Choose who this is for"), never "MISSING PREREQUISITE".
- The existing `PersonaAngle` stays the human-owned "why this person"; its suggestion now reads the story, the
  person's remit, the chosen anchor and the relationship, and stays labelled suggested until accepted.

### 5.6 Human priority

| Seller control | May change | May never override | Written to (existing mechanism first) |
|---|---|---|---|
| Make this person next / first | the order of the eligible stack at this account; the active motion's primary or next | unsubscribe, hard DNC, employment contradiction, entity boundary, open deal, paused reply, family hold | the account motion choice (`account.motion` audit row, `motion/account-motion.ts`) |
| I know this person | the RELATIONSHIP ROUTE slot and the reason line | nothing in the safety set | the persona angle (`persona.angle`) plus a relationship note through the capture path |
| Not a fit / Not now | sets the person aside at this account with the reason and, for Not now, a date; they stay visible in "Show more" | nothing (a set-aside is stricter, never looser) | an append-only `person.seller_preference` audit row (new kind, no new table), the only genuinely new state; it is read by the stack and expires on its date |
| Wrong role / Left the company / Verify role | role and employment currentness | nothing | the existing human corrections (`person.role_verified` with provider human; the employment correction) |
| Use a different story | the outreach anchor for this person | the outreach evidence gate (only eligible facts are offered) | the persona angle row carries the chosen anchor id |

Rules (trust review, adopted): eligibility is computed from safety first and never reads a preference; preferences
only reorder the eligible. Choose writes the motion primary (on a hypothesis, the audited persona assignment plus the
routing step; a HubSpot-only person goes through ADD TO GAP first). Make next writes the motion next. I know this
person writes a work-source member with relationship context, tagged "You said", never Buyer said. Verify role
writes a verification only with a URL. Wrong role and Left company remove only, never add. Not a fit and Not now
need the one genuinely new row, `person.seller_preference` (append-only, account-scoped, newest wins, Undo appends a
reversal; it never writes `do_not_contact`): the motion row holds only primary and next, the persona angle is a
positive line, and not-now exists only on work-source members. Never overridable by any control: unsubscribe,
opt-out, hard bounce, clawd suppression, hard DNC (the legacy review stays the only clear path, on confirm), LEFT or
CONFLICT employment, a divested entity, an open HubSpot deal, a paused reply, a live conversation, an outstanding
draft, a family hold. A preference on a held person is recorded and shown as "Next once the reply is triaged"; the
click still runs every gate. Every control states its scope and effect in one line ("Matt is next at PepsiCo only.
Nothing is sent. Undo.") with Undo in place, and NOW reads back the last decision (HAX G12). With two or more
eligible people the Work card offers "Choose who (4)" and opens the stack; a one-name [Choose Karen] button is a de
facto preselection and breaks the "nobody preselected" contract. Voice never triggers any of these.

### 5.7 Private intelligence (guards)

Private engagement (microsite sessions, ROI reads, person-named `/for/<account>/<person>` paths), field notes and
clawd reply-intent rows inform strategy and never become quotable or spoken: one typed allow-list feeds every spoken
surface (NOW listen, story listen, Listen to today, Ask GAP) and the compiler; engagement is never a rank dimension
or a reason string (a closed set of dimension names); person-named paths never leave the private block; a capture
note is never an anchor or a spoken line unless Casey marks it sayable; the "Do not use" exclusion note carries no
content (it says "private interest excluded", not what it was); the Best Opening picker calls the existing
`outreachFactRefusal` gate, never a parallel picker; only verbatim text that passed the gate may appear in an
opening; the persona angle is never read by the compiler and is flagged on save when it carries engagement words
(visited, viewed, ROI, /for/, /demo/).

Account Story additions from the same review: the YARD OPPORTUNITY line is always Our read with its Wrong if beside
it, Buyer said only on a confirmed buyer input quoting the buyer's words and date, never Checked; the proof carries
"Our proof, measured" (48 to 24) and "Our model" ($1M+/site) as separate tags.

### 5.8 Voice (candidate tickets UX-11 to UX-13; built only if the measured seller loop is otherwise clear)

- Listen to today and Listen to account start only on a press (WCAG 1.4.2); one global player survives navigation
  with pause, resume, skip by account, 1.5x speed and Media Session support; the current Listen is replaced (it has
  no pause and no unmount cleanup).
- The account brief is 60-90 s, 150-220 words written for the ear: state and last touch; the goal and what changed,
  saying "checked" or "our read"; where the yard fits and the proof, saying measured or modeled; the first person and
  why, when the role was verified, the second person if no reply, and "one person is flagged do not contact"; the
  opening and why that person cares; the unknown, the ask, the next action. Never the private line, emails, phone
  numbers, URLs or machine words. Today's Listen reads the screen (raw headlines, basis lines, "Unknown · Our read")
  and is not enough.
- Dictate: a 44 px button with `aria-pressed`, a timer, a level meter, a Recording status and a length cap; Escape
  discards and says so; MediaRecorder + getUserMedia, transcribed server-side on a provider already in production
  (ElevenLabs Scribe v2 $0.22 per hour or OpenAI gpt-4o-transcribe $0.006 per minute; the spend is reported before
  the ticket starts); on failure the audio stays local for Retry; "I heard" is an editable transcript in the capture
  field; "I am about to record" shows the extracted account, person, type and quote, each editable, with Read it
  back; Confirm is a deliberate click or key into the existing audited capture route, then Undo; audio is deleted
  after transcription; typing always works; SpeechRecognition is never the sole path.
- Ask GAP: read-only, typed or push-to-talk, grounded in the story and the stack only, answers cite their tags and
  keep session pronouns; a request to act is answered by naming where the control is.
- Never voice-triggered: send, Gmail draft, enroll, routing, Choose or Make next, Not a fit, Left, Wrong role,
  do-not-contact or clearing a flag, Apollo lookups, delete, capture Save. The visible label equals the accessible
  name so OS voice control keeps working (WCAG 2.5.3).

## 6. Tickets

Sequence re-ordered by the audit: the pursuit-state read comes first because the two blockers the reviewers found
(N1, N2) and F1 are all one missing authority, and every later surface renders from it. Each ticket is demoable on
its own; none is a foundation-only sprint (UX-03 ships the Walmart header and stack reading the new state).

| Ticket | Scope | Demo outcome | Status | Commit | Tests |
|---|---|---|---|---|---|
| UX-01 | audit + screenshots + task baselines + research | this document, sections 1-3, 7, 8, 10 | DONE 2026-10-05 | | |
| UX-02 | IA alternatives + five-reviewer comparison + design contract | sections 4, 5 | DONE 2026-10-05 (5.6, 5.7 pending the trust remainder) | | |
| UX-03 | Pursuit state (5.1) + reply classification + People Stack (5.2) on NOW, reading the chosen person; the pack built for that person (F1, N1, N2, N8) | Walmart: "Opted out" leads, Doug Estrada chosen with the hold shown, 4 rows of 46; FedEx: "Ready for a first touch: Glen Chaffee" (chosen by Casey, Oct 5) with Prepare email beside him, 4 rows of 37; Kroger: "In a deal", no choose; the analyst drawer: top 5 of 53, no ordinals on the tie | REVIEWED, merging (PR open) | 1291b5b5, 0b6de260, d7cb350f, 03704bbb, d96ce769, 6e473da3, 3ec49699 | reply-classify, people-stack, pursuit-state, pursuit-next, people-stack-view, account-now-pursuit, owner-panel-cap, ready-target-of (65 tests); GAP suite green |
| UX-04 | Account workspace hierarchy: one decision block, context column, one-column 390, no sticky tabs at 390, scroll padding, 44 px bar, Listen cleanup (N9, N10, N11, N12) | NOW reads as decision then context on desktop and phone | | | a11y unit tests; 390 overflow |
| UX-05 | Account Story (5.4) with per-sentence tags, internal readers (clawd history, vault note) (F11, N5, N6) | PepsiCo story answers goal / changing / network / yard / proof / unknown; NFI shows the May 28 send | | | tag rule (weakest class); no private row; unverified employer item rises |
| UX-06 | Outreach anchor + angle suggestion from the story + pack copy without pasted headlines, signed by the rep (5.5, N13) | one anchor per person with Do not use; a different story is one click | | | anchor never cites private / imagery / not-for-outreach |
| UX-07 | Pursuit slots + human-priority controls on the stack (5.3, 5.6) | Make next / Not a fit / Not now recorded, audited, reversible, never over a hold | | | preference never clears DNC / employment / deal / reply |
| UX-08 | Work surface: accounts needing attention, one card each, lane chips as filters, reply classes, search (F3, F12, N4) | /gap answers which account, why, state, person, next in one screen | | | card = pursuit state parity; opt-out never heads the list |
| UX-09 | Done, next: outcome or snooze, frozen order, Back, Back to Work (F9) | work five accounts without returning to the cockpit | | | URL state; Back restores |
| UX-10 | Navigation: Work / Accounts / Capture + More; GAP account search in Ctrl+K (F8, F13) | PepsiCo in two keystrokes | | | |
| UX-11 | Listen to today + 60-90 s account brief written for the ear, one global player with pause (candidate; built only if UX-15 shows the seller loop is otherwise clear) | | | | never reads the private line |
| UX-12 | Dictate note: MediaRecorder + server transcription on an existing provider, I heard / about to record / Confirm (candidate; spend reported first) | | | | no voice-triggered write |
| UX-13 | Read-only Ask GAP (candidate; grounded in the story and the stack only) | | | | |
| UX-14 | Mobile / keyboard / a11y / perceived-speed pass with a valid DPR-1 re-shoot (N15) | | | | |
| UX-15 | Multi-account dogfood: PepsiCo, FedEx, Walmart, H-E-B, NFI, General Mills, Kroger, Tyson + 10 more; post-change task metrics | | | | |
| UX-16 | Two fresh adversarial passes on the integrated experience | | | | |
| UX-17 | Production ship + STABLE_BASELINE reconciliation | | | | |

## 6a. UX-03 implementation record (2026-10-05)

Commit 1291b5b5 on `feat/gap-account-first-ux` (plus the follow-up fixes below). What shipped:

- `lib/gap/replies/classify.ts`: the reply class (human, opt_out, out_of_office, bounce), decided before anything
  ranks; only a human reply pauses the account.
- `lib/gap/pursuit/state.ts` + `load.ts`: ONE pursuit state per account from readers GAP already has (brief, context,
  the cockpit's queue and account motion, the motion choice and the audited persona assignment, the reply list, the
  one owner-resolution read); fixed priority reply > deal / hold > follow up > in motion > ready > choose > research;
  the chosen person is the newest audited human choice, read everywhere.
- `lib/gap/pursuit/next.ts`: NEXT projected from the state, so the pack is built for the person NOW names.
- `lib/gap/people/stack.ts` + `components/gap/people-stack.tsx`: the People Stack (top 3 to 5, one distinguishing
  reason, no ordinals on a tie with the tie said, a badge only on a resolver recommendation, named sponsor / tech /
  site rows only when the resolver fills them, Why this person?, Show N more with the set-aside reasons, Choose beside
  each eligible person, Prepare email / Call prep / Log a touch beside the chosen one; nothing sends).
- `owner-resolution.ts`: the resolver exposes its rank key on each eligible person (ties are detected from the
  resolver's own order, never re-ranked).
- `account-now.tsx`, `accounts/[slug]/page.tsx`: the state line, the inbound line (reply class) and NEXT read from the
  pursuit state; the stack replaces the WHO slot; the old WHO path remains for callers without a pursuit.
- `owner-resolution-panel.tsx`: the analyst panel caps its list (top 5, Show N more), drops ordinals on a tie, names
  each radio by name and title and describes it by its reasons.

First local run against the production database (read-only, `next start`, headless Chrome at DPR 1) found four
defects, all fixed before the receipt: the FedEx page failed to render because the set-aside list carried a RegExp
across the server/client boundary (now a serializable projection); a chosen person still showed Prepare email under
an opt-out hold (the chosen row now shows the hold and keeps Call prep / Log a touch); "Runs runs ..." and the title
repeated as a reason (the fallback now says nothing on record sets them apart); research and relationship-led accounts
read as "find the operator" or "choose who" when the angle, not the person, was missing (distinct lines now).

Process note: the rebuild-and-capture job was stopped once by the harness under system memory pressure (the rig
Chrome holds about 9 GB; two `next build` workers about 7 GB); the orphaned build was allowed to finish and the
capture resumed with one headless browser at a time.

## 6b. UX-04 contract (the account workspace hierarchy), drafted from the UX-03 reviews

Goal: the account page reads as one decision block then context, on Casey's 820 px desktop first, then 390, then
the wide two-column enhancement. No new state, no new reader; presentation and order only.

1. **One decision block at the top**: the state line with the hold colour (red opt-out, sky reply, amber deal /
   hold, green ready); the inbound line; NEXT as the only primary button (the chosen person's Prepare email IS the
   NEXT control, rendered once); the chosen person's row directly under it. The duplicate "Prepare the email to Glen"
   link and "Prepare email" button become one control.
2. **The stack under the decision**: eligible rows only (UX-03), the slot lines, the set-aside line, Show more. The
   do-not-contact list becomes one line with a count and one "Review N flags" disclosure (today: five 16 px links).
3. **Context below, in this order**: WHY NOW (checked lines first; an unverified finance or market headline never
   shows; the UX-05 story replaces this block later), RELATIONSHIP (today the last line on the page; a real route
   rises to the decision block), KNOW (rows marked "Never cite" move to SOURCES), THINK, ASK. THE GAP block is removed
   from NOW when every value is Unknown (it stays in BRIEF); IMPACT "unknown" is folded into the story's Unknown row.
4. **390 px**: no sticky view tabs (Brief and Sources become two links under the h1); one opaque bottom bar with
   Listen, Log a touch and Next account at 44 px each, with `scroll-padding-bottom` set for it; the Note and Compose
   pills hidden on account pages; the subnav collapses to one scrolling row. The chosen person's primary action sits
   wholly in the first 844 px.
5. **1100 px and wider**: two columns (decision + stack left, context right), DOM order unchanged (2.4.3).
6. **Perceived speed**: the page streams the header and NEXT first and the stack under a skeleton (Suspense around
   the pursuit read); the ready target and the pursuit share one queue read (done in UX-03).
7. **Gates** (the accessibility reviewer's three): Tab and Shift+Tab sweeps at 390 and 820 with the sticky bar engaged
   show zero covered focus points on any NOW control; every control at the 24 px floor and the chosen person's primary
   action wholly in the first screen, clear of the pills; a keyboard and VoiceOver run of Choose on a scratch database
   keeps focus on the chosen row, announces the result, finds NEXT in the heading list, announces no rank under a tie.
8. **Measurement**: the same eight accounts at 820, 390 and 1440, light and dark, before and after; screens, the
   pixel offset of the first action, Tab count to the first action, covered focus points.

Out of scope for UX-04: the Account Story (UX-05), the outreach anchor and "why #1 over #2" (UX-06), human-priority
controls beyond Choose (UX-07), the worklist (UX-08).

## 7. Task baselines and post-change measurements

Baseline measured on production 2026-10-05 (SHA 54c11c57) through the rig; clicks counted on the shortest path a seller
can find without typing a URL; "screens" is page height over a 900 px viewport at 1440 CSS px; time is navigation to
network idle plus 0.8 s settle (live HubSpot reads included), rounded.

| Task | Clicks | Screens | Scroll / friction | Time | Notes |
|---|---|---|---|---|---|
| T1 What account should I work? | 0 for the top item; 4 lane visits for the account picture | 1 (cockpit) + 1.3 + 25.7 + 1.2 + 3.1 | the Research lane alone is 25.7 screens | 8.5 s cockpit; 8-11 s per lane | NEXT UP names one item, lane-labelled; no account list |
| T2 Understand PepsiCo | 2 (Ready tile, PEPSICO link) or a typed URL | 1.8 | NOW holds in 1.5 screens; WHY NOW is raw signals; THE GAP is three Unknowns | 9.9 s to NOW | no account search in GAP |
| T3 See the few people who matter | 0 on NOW (one WHO, one Alternate); 2 to the Walmart owner panel | NOW 1.8; panel 12 sheet-screens | 53 cards before the buttons | 6.1 s drawer open to panel | identical reason lines |
| T4 Understand why | 1 (Details) per person | | the discriminating facts are behind Details on every card | | RECOMMENDED absent when the first difference is weak |
| T5 Choose or override | Walmart: 3 (All hypotheses, row, scroll to USE) and the drawer only; PepsiCo primary: 3 (Cockpit, Ready, Make X primary); from NOW: not possible | 12 | scroll past 53 cards; or find the right lane | | the action help says "routing (shadow)" |
| T6 Prepare outreach | PepsiCo: 2 (Review the thesis, Open the Ready lane) then the card; Walmart: dead end ("No person on this card") | 1.4 | the pack addresses Shawn Miller; NOW said Karen Darling | 6.3 s to the pack | F1 |
| T7 Capture what happened | 1 from NOW (Log what happened) + the form | 1 | account prefilled | 8.7 s to the form | keyboard mic only |
| T8 Move to the next account | 1 (Cockpit) then re-read NEXT UP; 2+ to any other account | 1 | context lost; no sequence | 8.5 s | |

Mobile 390 (light and dark): no horizontal overflow on any page; NOW 2.4-2.5 screens (PepsiCo, FedEx, Walmart);
Ready lane 2.2; All hypotheses 3.8; cockpit 1 (tiles in two rows). Tablet 768: NOW 1.7-1.8.

Time to decision-grade view (navigation to network idle, 1440): cockpit 8.5 s; PepsiCo NOW 9.9 s; FedEx 7.6 s;
Walmart 9.6 s; H-E-B 7.5 s; General Mills 5.1 s; NFI 6.5 s; Kroger 6.0 s; Tyson 5.6 s; BRIEF 7.6 s; SOURCES 8.8 s;
Walmart drawer open to owner panel 6.1 s; PepsiCo preview 6.3 s. The reads are live HubSpot calls; nothing here
needs an infrastructure project, but every account open must show a skeleton and keep the loaded context.

### 7.1 UX-03 measurement: the owner-selection task (local preview of 0b6de260 against the production database, read-only, headless Chrome at DPR 1, 2026-10-05)

The task: "choose the person you would work for this account". Before = the shipped product (the account NOW plus the
hypothesis drawer's owner panel, the only choose control). After = the People Stack on NOW.

| | Before (FedEx NOW + Walmart owner panel) | After (FedEx NOW, People Stack) |
|---|---|---|
| Visible people before the choose control | NOW: 1 WHO + 1 alternate + 5 do-not-contact; panel: 53 cards | 5 rows (of 37 on record), the chosen person first |
| Scrolling to the first action for person 1 | panel: 12 sheet-screens to USE | action at 655 px from the top (inside the first screen at 1440; second screen at 390) |
| Clicks to choose | 3 (All hypotheses, the row, scroll, USE) | 1 (Choose) or 0 (already chosen: Prepare email) |
| Where the action lives | a drawer reached from a table of hypotheses | beside the chosen person, on the account page |
| Who is named | NOW: Courtney Keen (CFO, on a June out-of-office); panel: nobody preselected | Glen Chaffee, "Chosen by you, Oct 5" (the audited assignment), with Prepare email / Call prep / Log a touch |
| Reasons | the same two title-rule lines on 43 of 53 cards | one distinguishing line per row; ties said in words with no ordinals |
| Uncertainty | "53 plausible owners: choose one" | "Choose who (21): GAP does not pick" plus the tie line; "Research: no angle yet" when the angle, not the person, blocks |
| Confusions / backtracks | the preview page drafted to a different person (Shawn) | none on the FedEx path; PepsiCo reads research because its primary fact expired in production since the audit |

Other golden accounts on the new build (1440): Walmart "Opted out: timothy.cooper@walmart.com, Oct 5" leads; the chosen
person (Doug Estrada) shows the hold, not Prepare email; 6 rows of 46. H-E-B "Research: no angle to open on yet",
Dakota Socha (left) is not a row; Jess Bess leads. Kroger "In a deal: YardFlow - Kroger (Discovery)", no Choose.
NFI "Relationship-led: Sandra Richards". General Mills "Research: no angle" with Phillip West leading. The analyst
drawer (Walmart approved hypothesis): "Best people on record (top 5 of 53)", the tie line, no ordinals, 3 sheet-screens
(was 12), "Show 48 more on record".

Widths and themes: no horizontal overflow at 1440, 1024, 820, 390 in light and dark; NOW length 2.1 to 2.9 screens at
1440, 3.1 to 3.3 at 820, 3.9 to 4.2 at 390 (the story column below the stack is UX-04's hierarchy work).

Timing, read-only probe from the workstation (`scripts/gap/time-pursuit.ts`, PepsiCo; the database is in us-west2,
so every read carries workstation latency and the absolute numbers are 2-3x what Vercel sees):

| Read | ms |
|---|---|
| loadAccountView (brief + inputs + context, pre-existing) | 26,612 |
| loadReadyTarget (pre-existing, NOW) | 6,876 |
| loadPursuit (new; queue, motions, choices, replies, owner resolution, in parallel) | 9,519 |
| of which loadOwnerResolution (547 HubSpot people, cached 15 min) | 4,459 (3,062 warm) |
| of which loadCockpitMotions | 4,230 |

The pursuit read runs in parallel with the pre-existing ready-target read, so the added wall time on the page is
about 3 s on top of a page that already took 5 to 12 s on Vercel. Local page loads measured 15 to 30 s end to end.
Carried to UX-04 / UX-14: stream the stack after the header (a skeleton), and share the queue read between
loadReadyTarget and loadPursuit (they read the same queue twice).

Post-change measurements for the full task set: filled by UX-15 against the same tasks.

## 8. Reviewer findings (UX-01 / UX-02 pass, 2026-10-05)

### 8.1 Findings the audit missed, now in the register

| # | Finding | Reviewer | Severity | Verified by the lead |
|---|---|---|---|---|
| N1 | Walmart NOW is blind to today's reply: "No touch on record", "Ready for a first touch", NEXT is a first touch to Doug Estrada, while the cockpit and Ready lane pause Walmart on Timothy Cooper's Oct 5 reply, whose whole text is "stop" (an opt-out shown as "Buyer replied") | designer, AE, BDR | BLOCKER | yes: the NOW dump has no "timothy", "replied" or "paused" |
| N2 | FedEx NOW ignores the owner Casey chose on Oct 5 (Glen Chaffee appears nowhere on NOW) and NEXT asks Casey to answer a 125-day-old out-of-office notice as a live thread; the unverified CMA CGM sale of FedEx Supply Chain, which may change Courtney Keen's employer, sits as background | designer, AE, BDR | BLOCKER | yes: the NOW dump has no "Glen"; the reply text is an out-of-office |
| N3 | Trust labels disagree across surfaces: one fact is "CHECKED, OK to cite" on NOW, "verified" on the pack, "CORROBORATED, 2 independent sources" at 42 % on All hypotheses; Walmart's approved hypothesis shows "Confidence 0 %" while its signal says 60 %; the drawer says "No trigger named" while NOW lists two checked events | designer, HAX | SHOULD | yes (dumps) |
| N4 | Counts disagree with contents: Ready tile 0 while the lane shows six people with "Make X the primary"; Research tile 9 while the lane lists about 65 accounts; four people set aside as "another region" while Mississauga, Mexico City and Halton Hills remain among the 53 | designer, BDR | SHOULD | yes (code: Ready counts cards, the motion block lists needs_owner people) |
| N5 | THE GAP line ("Unknown · Our read · Unknown · Our read") and the IMPACT "unknown" line appear on every account with no decision content | designer, a11y | REMOVE from the seller path (fold into the story's Unknown row) | yes |
| N6 | NFI: "You met them at MMYQB LinkedIn subscribers (newsletter)" is false (a subscriber is not a meeting); "RVP" names no function; NOW says "No touch on record" while clawd holds a May 28 send to Ryan Hranica | AE, BDR | SHOULD (truth) | yes (clawd outreach history) |
| N7 | Kroger: NOW says "In a deal" yet shows a GAP first touch to joey.maggard@kroger.com on Sep 25 and a cold WHO; Kroger's stage reads "Discovery" on the account page and "Appointment scheduled" in In deals | AE, BDR | SHOULD: the touch is historical, not a live guard failure; the two stage readers disagree and must read one label | verified in HubSpot: deal 62750655830 "YardFlow - Kroger" created 2026-07-17, open, stage `appointmentscheduled`; the Sep 25 touch predates the opportunity-truth gate shipped 2026-09-27 (baseline "GAP FINAL MONDAY BLOCKER"); NOW should say so instead of listing the touch neutrally |
| N8 | Owner panel keyboard path: after a radio, Tab crosses 53 Details buttons and up to 9 chips to reach USE; each radio is named only "Choose X"; buttons and inputs sit inside the radio's label (invalid nesting) | a11y | BLOCKER (WCAG 2.1.1, 4.1.2) | yes (`owner-resolution-panel.tsx` radio aria-label; buttons inside the label) |
| N9 | 2.4.11 at 390: the fixed header plus the sticky view tabs cover 112 px with no `scroll-padding` anywhere in `src`; anchors use `scroll-mt-16`; the Note pill and Compose button are fixed at the bottom; the open Note panel is a non-modal fixed bottom sheet | a11y | SHOULD | yes (grep: 0 scroll-padding hits) |
| N10 | Listen: Stop rewinds to zero (no pause); no unmount cleanup, so audio keeps playing after a route change with no control left (1.4.2); loading is aria-busy only; the toast carries an em dash | a11y | SHOULD (BLOCKER once Next account exists) | yes (`voice-preview-button.tsx` has no effect cleanup) |
| N11 | Headings: NEXT on NOW, NEXT UP on the cockpit and the owner question are paragraphs, so heading navigation skips the decision | a11y | NICE | yes |
| N12 | Target size: the person checks are 22 px, Details / glossary / set-aside / Review are 16 px text buttons; USE is 36 px, Attach 32 px; 121 of the Walmart drawer's 130 controls are under 24 px | a11y | SHOULD (2.5.8) | yes (metrics) |
| N13 | The generated email opens with a pasted headline ("Hi Shawn, PepsiCo and Gatik announce multi-year agreement...") and is signed Casey for any rep | AE, BDR | SHOULD (UX-06) | yes (pack dump) |
| N14 | H-E-B: NEXT says "Do not contact yet" while the only WHY NOW is an unverified store opening; the real heat (8 deep sessions, 7 ROI reads) is private; Dakota Socha's move to ADUSA is shown as a dead end rather than a warm route into another account | AE | NICE | yes (dump) |
| N15 | The audit's own screenshots: the desk2 and mobile2 PNGs are magnified top-left crops (the rig's per-origin zoom), and the theme labels do not match the pixels on three captures; the JS metrics and the text dumps hold; the drawer2 set is full-frame | designer, a11y | process: re-shoot at DPR 1 with the theme reset before UX-15 compares | yes |

Re-rated by the reviewers and accepted: F11 to BLOCKER (a false "No touch on record" is a wrong decision input once
the account page is home); F7 corrected to "about 57 % of the content area used"; F15 to SHOULD when the 14 px radio
is the only target; F16 to KEEP pending a valid re-shoot.

### 8.2 What should disappear from the primary workflow (minimalist and designer, merged)

The six tiles, the health strip when healthy, the "Then:" lines, "Review the thesis" and the preview page as a step,
the hypotheses table and its percentages, the per-hypothesis drawer as the choose control, THE GAP and IMPACT lines,
the "Make X the primary" lists, the Sources / Signals / All hypotheses / Learning / Notes tabs (to More), the
25-screen Research page (research becomes a panel on the account), the replies form as a lane (a reply card on the
account, 15 chips behind Classify), the generic WHO reason and Route line, the check chips as top-level controls (into
each card's More), the sticky view tabs at 390 (Brief and Sources become disclosures), the Note pill and Quick Capture
on account pages (Log a touch per account). Day one needs three surfaces: Work, Account, Capture; Listen is a control,
not a surface.

### 8.3 Seller vocabulary (AE table, adopted)

| Exact words today | Seller words |
|---|---|
| Theses waiting for you · Review the thesis · Judge 2 verified facts | Angles to approve · Check the opening |
| hidden capacity for supply chain · 30 hypothesises · One-off hypotheses | Yard capacity angle · 30 angles |
| Confidence 0 % · open to see · Family · Persona | dropped, or "Not tested with a buyer yet" · Angle · Role |
| routing refreshed 2h ago · System: routing · approve + use in routing | Updated 2h ago · (More) · Approve |
| 53 plausible owners for this hypothesis: choose one. GAP does not pick. | Who hears this first? Top 4 below, 49 more on record. |
| Primary operator: title says they run transportation, freight or fleet. + Thesis fit: ... | one specific line: "Runs regional transportation for the new Carnesville FC" |
| every gate runs at the click | Do-not-contact and open deals are checked when you send |
| no person on this card · MISSING PREREQUISITE | Choose who this is for (people inline) |
| ACCOUNT-LEVEL / COLLEAGUE REPLY · RESPONSE CLASS · BUYER INPUT (BID) · Record disposition | What did they say? |
| this family is closed for this account and we should look at yard state integrity instead | If they already measure gate time and it is fine, drop this angle |
| HYPOTHESIS (INFERENCE): My guess is · SELLER INFERENCE, UNPROVEN | Our read |
| TAM unknown, no tier, heat tier 4 · evidence_record · pounce_trigger · group review 3e1e... | System details |
| ACCOUNT MOTION · Suggested why: ... accept edit · Make shawn miller the primary | Who's next at PepsiCo · Why her: Use / Edit · Make Karen first |
| 0 of 6 known · Custom stage 1417384082 · GAP knows Ldoor7, Dcantrie | Still to learn: ... · the real stage name · junk names hidden |
| You met them at MMYQB LinkedIn subscribers | Subscribes to your newsletter. You have not met. |
| shipper / BCO · No GAP touches to there yet | shipper · No touches yet |

### 8.4 New-BDR task test (live product, no training): FAIL

Five actions found only by reconciling contradictory pages: 21 pages, about 80 minutes, 5 backtracks, 7 questions
for a manager (does "stop" cover all of Walmart; do I send as myself or as Casey; Karen or Shawn at PepsiCo; may I
approve a thesis; may I phone Isaac Scott; does CMA CGM change who we call at FedEx; what to do with 55 "Nothing to
judge" accounts). The two sentences that decided the failure: "No ready card is for a direct transportation
operator: check the BRIEF buyer map (it may name one in HubSpot to add as a GAP contact), else research." and "Do not
contact yet: the approved thesis needs review before it is used." The account NOW pages nearly pass on their own; the
lanes and tiles contradict them. The three things that would make it ten times easier: one ranked list for today
(account, person, why now, one button) where tiles, lanes and account pages agree on "ready"; replies read by
meaning ("stop" is an opt-out, an out-of-office is an auto-reply) and shown on the account page; plain words and
buttons that do what they say ("Review the thesis" opens the person NEXT named; drafts carry the rep's name).

### 8.5 HAX scores for the live product (0-2) and what Direction A must do

G1 1 (say what GAP reads and never does); G2 1 ("title only, not verified" when the title is the only basis; no
percentages; the wireframe's "Role: verified" for Karen was false and is removed); G4 0 (no two stack rows share a
reason); G9 1 (every control on the stack with an inline Undo); G10 1 (top 3-5, never pad, cut reason; "Best fit"
only when the resolver recommends; preselect only one eligible person); G11 1 ("Why #1?" = first difference, dated
basis, what would change the order; one resolver for every surface); G12 0 (show the seller's last decision from the
audit rows; read the same reply state everywhere); G15 1 ("This is wrong" on every story and reason line); G16 1
(each control states scope and effect: "Matt is next at PepsiCo only. Nothing is sent. Undo."); G17 0 (a "How GAP
ranks" page: rank order, sources read, what Listen never reads, every preference with Undo).

Trust-tag corrections to the Direction A wireframe, all accepted: "plant footprint trimming" (from an Unverified
headline) needs its tag; "Reply waiting 125 days" needs its reply class; "$3B cost program" needs Checked with source
and date; "owns the PBNA transportation network" and "the Gatik program lands on her network" are Our read; "Role
verified Oct 2026" was false; "Next if no response" must say suggested or chosen; the sponsor slot must read one
source (the resolver names Brad Stroup, the Ready lane names Michelle Schlie); GOAL needs its basis; CHANGING must
split Gatik (OK to cite) from Maryland (not for outreach); "autonomous linehaul into DCs" conflicts with the Checked
line (Gatik serves about 250 retail locations in three states) and is dropped; PROOF is YardFlow proof, not Checked.

### 8.6 Adversarial findings against the plan, each with the regression test that catches it (trust review, adopted)

1. **Holds become secondary (live today).** Walmart NOW "Ready for a first touch" over a "stop" reply; FedEx's
   out-of-office driving NEXT and a CFO WHO with no entity note. Test: fixtures for paused_reply (snippet "stop"),
   in_conversation, IN_DEAL, outstanding draft, family hold; assert the Work card state, the NOW state line, the NEXT
   source and the first spoken sentence agree, and no Prepare email is enabled.
2. **Recommendation outruns evidence** ("Role: verified", "Best fit" for a HubSpot-only unverified person). Test:
   render a ROLE_UNVERIFIED cold-first-touch stack; assert "verified" appears only as "not verified", no Best fit or
   Recommended label, no percentage anywhere in the seller path.
3. **Preference bypasses safety.** Test: a property test over random safety flags and preference rows: eligible
   after is a subset of eligible before, gate refusal reasons unchanged, Make next on a DNC persona refuses with
   do_not_contact; the existing no-`do_not_contact`-writer check covers the new row.
4. **Private intelligence leaks.** Test: seed an engagement page `/for/acme/SENTINEL-PRIV` and a capture
   "SENTINEL-NOTE"; assert absence from NOW listen, story listen, Listen to today, Best Opening, the compiled email
   and call opener, the angle suggestion and every reason line; present only in the private block.
5. **The story is concatenated inference.** Test: a PepsiCo story fixture; every line has a tag and basis ids, the
   tag equals the weakest basis class, a line containing an Unverified signal's text is Unverified, Goal / Network /
   Yard are never Checked without a buyer input or a verified fact id, Proof is Our proof or Our model.

Also live and carried as SHOULD: machine words remain on the seller path; the analyst drawer the plan keeps must
read the same capped stack (53 cards nowhere by default, including the drawer).

### 8.7 UX-03 fresh review (four read-only reviewers on the local preview captures, 2026-10-06)

Reviewers: enterprise AE (task: choose the FedEx person), product designer / IA (contract conformance and hierarchy),
human factors / HAI (trust, safety, explainability, with the code traced), accessibility / mobile (pending at the time
of writing; its findings are appended when received).

Task result (AE): FedEx owner selection went from about 8 to 10 minutes, 3 clicks and 10 screens of scrolling through 53
identical cards, to about 90 seconds, 5 cards and 1 click; the choice (Glen Chaffee, Jeffrey Tallman second) was the
same the resolver and Casey had reached. The three acceptance questions scored PARTLY, PARTLY, PARTLY before the fix
batch; the specific reasons are below with their dispositions.

| Finding | Reviewer | Severity | Disposition |
|---|---|---|---|
| "No touch on record." beside an opt-out reply (someone emailed Walmart; GAP has no record of the send) | AE, product, HAI | BLOCKER | FIXED (presentation): "No GAP touch on record; the reply below answers an earlier email GAP did not send." The missing outbound reader (Resend-era and clawd sends) is UX-05 F11 work |
| NFI "Relationship-led: Sandra Richards" rests on a newsletter subscription; Tyson's Ryan Heman named with no control; the stack's first row contradicts NEXT | AE, product, HAI | BLOCKER | FIXED: a subscriber, list member or follower is never a relationship (`isRealRelationship`); a real relationship person leads as a Relationship route row with Log the touch |
| The Walmart analyst drawer says "53 plausible owners: choose one" while NOW says "Chosen by you" | product, HAI | BLOCKER (reviewer) | NOT A DEFECT of the slice: production holds two Walmart theses, one active with Doug Estrada (the audited choice NOW reads) and one approved with no person (the drawer). Recorded as debt: a duplicate thesis at an account should show the account's chosen person in the drawer headline (UX-07) |
| A recorded opt-out or a triaged human reply flipped the account back to Ready because the state read only `in_motion` from the cockpit motion | HAI | BLOCKER | FIXED: `paused_reply`, `in_conversation` and `needs_owner` are read from the cockpit motion into the pursuit state; pinned by tests |
| Listen spoke the old NOW ("Ready for a first touch") over a page that said "Opted out" | HAI | BLOCKER | FIXED: `pursuitListenText` speaks the page's state line, NEXT and person; nobody is spoken as next under a hold |
| "Chosen by you" on GAP's single eligible pick (the loader passed the lone person as chosen) | HAI | BLOCKER | FIXED: only a human choice is passed as chosen; a lone person reads as GAP's preselection |
| Kroger under a deal showed "1." ordinals and "Choose who (13)"; Call prep offered under holds | AE, product, HAI | SHOULD | FIXED: no ordinals, choose label, tie line or call prep unless the state allows choosing or calling |
| "NEXT OPERATOR" pinned by position on a name-order tie; "SECOND OPERATOR" on a Head of Commercialization | AE, product, HAI | SHOULD | FIXED: "Next operator" only for the chosen or lone person; everyone else "Eligible operator" |
| Sponsor / tech / site rendered as full cards ("TOP 6 OF 46"), level 2 for a first touch | product, HAI | SHOULD | FIXED: compact slot lines below the rows with Why?; rows are eligible people only, at most 4 |
| Name-echo "(Kelly Kruse)" and "nothing else on record sets them apart" dressed as a reason; reasons that are only a city | AE, product | SHOULD | FIXED: the title's own distinguishing words are used before an honest shared-row note; no name suffix. A city remains the discriminator when titles and remits are identical (honest); the division question is UX-05 |
| "ranked lower on evidence" under a tie; the tie line did not name the tied people; "name order" unexplained | AE, product, HAI | SHOULD | FIXED: the tie line names the tied people and says first-name order is not a ranking; the parenthetical appears only when the order is evidence |
| "the account waits 14 days" promised, not built | HAI | REMOVE | FIXED: the opt-out text promises only what exists |
| "Out of office: Courtney Keen" for "I am in the office but my responses will be delayed" | AE | NICE | FIXED: the class label is "Automatic reply" |
| Screen-reader duplicate of the reason (sr-only span) and aria-describedby pointing at the hidden copy | HAI | SHOULD | FIXED: the Choose button is described by the visible reason; the Why section is hidden, not removed |
| Verify role / Role is wrong / Left removed from NOW | HAI | SHOULD | FIXED: the three checks live inside Why this person? (the existing control) |
| Choose under research outranked "Do not contact yet" and silently added a HubSpot person | HAI | SHOULD | FIXED: outline control reading "Choose X (adds them to GAP) for when an angle exists"; no call prep under research |
| Likely roles render "verified at" and green | HAI | SHOULD | PARTLY: confirmed and likely both read calm (not amber) by design; the "verified at" wording is the employment store's and is carried as debt |
| Lisa Lisson (President) cold-eligible; Justin Brownlee / Becky Crane / Barry Vincent as sponsors from the wrong function | AE, product | SHOULD | CARRIED to the resolver (owner-resolution sponsor and carrier rules), outside this slice; recorded in section 10 |
| Past contacts missing from the stack (Joey Maggard on Kroger's deal, Troy Retzloff, Laura Maxwell, Niccole Pippin) | AE, product | SHOULD | CARRIED to UX-05 / UX-07: a relationship-history row ("people you have touched") beside the stack |
| "Why this person?" explains why listed, not why ahead of #2 | product, HAI | SHOULD | CARRIED to UX-06: the first rank difference against the next row, with dated bases, is computable from the rank keys |
| THE GAP block, finance headlines, never-cite rows, "Email: Email sent:", five 16 px flag links | product, AE | REMOVE / NICE | CARRIED to UX-04 (hierarchy) |
| Call mode checks only the person's do-not-contact flag, never the account hold | HAI | SHOULD | CARRIED to UX-06 (call prep reads the pursuit state) |

Accessibility review (received after the table above; re-measured at 390 and 820 against the running local build):

| Finding | Criterion | Severity | Disposition |
|---|---|---|---|
| Shift+Tab onto Log a touch or Prepare email left the control fully under the sticky view tabs at 390 and 820; no scroll padding anywhere | 2.4.11 | BLOCKER | FIXED: global `scroll-padding-top` (120 px, 64 px from md) and `scroll-padding-bottom` (88 px) in `globals.css`, the exact rule the reviewer verified by injection |
| After Choose the button unmounts (the row re-renders chosen at the top): focus falls to the body | 2.4.3 | SHOULD | FIXED: focus moves to the chosen person's name after the refresh |
| NEXT is a paragraph, so heading navigation skips the decision | 1.3.1 | SHOULD | FIXED: NEXT is an h2 |
| The ordered list announces "1 of 5" under a tie the page says it cannot rank | 1.3.1 | SHOULD | FIXED: an unordered list with `role="list"`; order is said in words only |
| The status note mounts with its text, so screen readers often skip it | 4.1.3 | SHOULD | FIXED: one always-mounted polite status region whose text changes; refusals are a separate alert |
| Two of five "Review the flag" buttons and the drawer's Details fail the 24 px spacing test | 2.5.8 | SHOULD | FIXED: both carry a 24 px minimum height |
| The Note and Compose pills cover parts of Log a touch and Call prep at page load | 2.4.11 | SHOULD (AA passes) | CARRIED to UX-04 (hide the pills on account pages) |
| Drawer candidate labels wrap buttons (invalid nesting) | 4.1.2 | SHOULD | CARRIED to UX-04 (the drawer card becomes a div with the label on the name) |
| Identical "Why this person?" names | 4.1.2 | NICE | FIXED: each carries the person's name as its accessible name |
| Contrast (amber 4.9 to 5.0 light, 11 dark; muted 5.2 / 7.6; "Chosen by you" 6.5 / 5.2) | 1.4.3 | KEEP | |
| Keyboard operation and focus visibility | 2.1.1, 2.4.7 | KEEP | |

390 px (reviewer's measurements on the pre-batch build): 3.9 to 4.2 screens; the NEXT control at 495 to 531 px, the
stack at 564 to 600 px, the chosen person's first action at 791 to 877 px (inside the first 844 px screen on FedEx and
PepsiCo, 9 px past it on Walmart); no horizontal overflow; 20 Tab presses from the top to the first stack action (14
after the skip link). The reviewer's three gates for calling mobile done (zero covered focus points with the sticky
bar engaged; every control at the 24 px floor with the primary action wholly in the first screen; a keyboard and
VoiceOver run of Choose on a scratch database) are carried to UX-04.

Kept as-is on all reviews: the hold in the state line ("Opted out: timothy.cooper@walmart.com, Oct 5"), the reply
class ("An automatic notice, not an answer"), the readback ("Chosen by you, Oct 5"), "Make Jeffrey first instead",
"Nothing is sent by choosing", no Best fit without a recommendation, no ordinals on a tie, "Not a cold first touch".

## 9. Validation record

| Ticket | Validation | Result |
|---|---|---|
| UX-01 | GAP unit suite baseline at 54c11c57 (`vitest run tests/unit/gap`) | 318 files, 4,983 tests, 0 failures, 128 s |
| UX-01 | production captures: 18 pages at 1440, 6 pages at 390 and 768 in light and dark, 4 drawers, 4 click paths; no write action triggered | metrics in the scratch packet; summarized in sections 3 and 7 |
| UX-01 / UX-02 | safety during the audit | emails sent 0; enrollments 0; Apollo credits 0; HubSpot writes 0 (one read: the Kroger deal); suppression clears 0 |
| UX-02 | this document: em dashes | 0 |
| UX-02 | five independent reviewers, read-only, stopped after their reports | all five chose Direction A |

Screenshots: the scratch packet (not committed) holds `desk2/`, `mobile2/`, `drawer2/`, `path-*/`; the `drawer2`
set is full-frame and valid, the `desk2` and `mobile2` PNGs are zoom-magnified crops (N15) and must be re-shot at
DPR 1 before UX-15 compares against this baseline. The text dumps and JS metrics from every capture are valid.

## 10. Debt classification (recorded debt audited 2026-10-05)

| Debt (where recorded) | Class | Reason |
|---|---|---|
| Baseline P2: full sources view has no source-class filter | LEAVE INTENTIONALLY | SOURCES is depth; not on the seller loop |
| Baseline P2: redirect resolver search fallback date | LEAVE INTENTIONALLY | truth layer, not UX |
| Baseline P2: brief degrades contradiction read to "none" on read failure | LEAVE INTENTIONALLY | display only; the send gate fails closed |
| Baseline P2: 34 legacy research pages without provenance | LEAVE INTENTIONALLY | shown as unknown already |
| Baseline P3: outreach pill on unchecked claims; "+ N more sources" plain text; compact source list nests div in ul | LEAVE INTENTIONALLY | SOURCES surface |
| Baseline P3: the note dialog lacks Escape / aria-modal / focus return | FIX AS PART OF UX (UX-14) | on the capture loop; a keyboard trap by WCAG 2.1.2 |
| Baseline P3: feedback-list status and copy failures are silent | LEAVE INTENTIONALLY | Notes is admin |
| Baseline P3: one over-long context field drops all context | FIX AS PART OF UX (UX-04) | the account workspace depends on context; a silent drop is contradictory UI |
| Baseline P3: `source_failed_recheck` rows carry no reason; Scout citations have no titles | LEAVE INTENTIONALLY | |
| Soak P2: fund-holdings chatter among discovery mentions; place-name collisions | LEAVE INTENTIONALLY | labelled unchecked; noise, not wrong truth; surfaces as UNVERIFIED lines on NOW (Walmart "Polaris Financial Partners Purchases New Holdings"), which the Account Story must rank below checked facts (UX-05) |
| Soak P2: call-mode "FACT OBSERVED" label on a 10-K keyword hit | FIX AS PART OF UX (UX-06) | the call prep is a seller surface; the label overstates |
| Owner resolution: divestiture constant FedEx-only | LEAVE INTENTIONALLY | one verified family |
| Owner resolution: "Pilot" namesake rule | LEAVE INTENTIONALLY | |
| Owner resolution: H-E-B duplicate personas 43 / 45 stay set aside | LEAVE INTENTIONALLY | no person merge is a frozen contract |
| Owner resolution: Sub-Zero and World Market have no GAP account | LEAVE INTENTIONALLY | Casey's decision |
| Owner resolution: carriers and 3PLs share "3PL / Logistics" | LEAVE INTENTIONALLY | |
| Owner resolution: Gmail DSN evidence reported as not read | LEAVE INTENTIONALLY | |
| Pre-existing: lint errors in `signals/registry.ts`; GitHub Actions do not start | LEAVE INTENTIONALLY | outside GAP UX; local suite + typecheck + Vercel are the gate |
| New (this audit) F1: NOW's WHO and the preview pack's person differ | FIX NOW (UX-03 / UX-06) | contradictory UI on the seller loop; the pack must be built for the chosen person |
| New F11: GAP does not read clawd outreach history or the vault for the account picture | FIX AS PART OF UX (UX-05, as a reader only) | internal-intelligence-first; no new store |
| New: Ready lane lower-cases names | FIX AS PART OF UX (UX-08) | `displayName` exists; the lane bypasses it |
| New: two Walmart hypotheses, one active with Doug, one approved with a 53-person panel | FIX AS PART OF UX (UX-07): the drawer headline reads the account's chosen person when a sibling thesis already has one | the panel stays for the analyst view |
| New (UX-03 review): the resolver's sponsor slot names people from the wrong function (SVP Live Operations at Tyson, International Supply Chain Officer at General Mills, an air-side SVP at FedEx); a President is cold-eligible at a carrier | FIX AS PART OF UX (resolver rules, with the owner-resolution contracts) | the stack shows what the resolver says; the fix belongs in `people/person-prior.ts` sponsor and carrier rules, with tests |
| New (UX-03 review): the employment store prefixes every verification tier with "verified at", so a likely role reads as verified | FIX AS PART OF UX (UX-06 or the next WHO truth pass) | truth wording |
| New (UX-03 review): call mode checks only the person's do-not-contact flag, never the account hold | FIX AS PART OF UX (UX-06) | call prep must read the pursuit state |
| New (UX-03 review): GAP's history has no row for the email the Walmart opt-out answered (a Resend-era or clawd send) | FIX AS PART OF UX (UX-05 readers: clawd outreach history, Resend sends) | "No GAP touch on record" says so honestly meanwhile |
