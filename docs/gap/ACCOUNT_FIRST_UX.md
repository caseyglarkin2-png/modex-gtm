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
| UX-04 | Account workspace hierarchy: one decision block, context column, one-column 390, no sticky tabs at 390, scroll padding, 44 px bar, Listen cleanup (N9, N10, N11, N12) | FedEx at 820: state (green), one automatic-reply line, NEXT with one filled control, Glen chosen with Call prep and Log a touch, three eligible rows, compact sponsor and tech lines, one flags disclosure, then WHY NOW; the decision ends at 1.07 to 1.34 screens on six accounts; zero covered focus points | REVIEWED, merged (PR #402, 5c321ac6) | 7065fc24, caa5380a, 189eb183, 49e276f7, 7131b5a0 | now-hierarchy, blocked-people, voice-preview-button, the market-chatter and never-cite filters, the review-fix tests (GAP suite 329 files / 5,069 tests green) |
| UX-05 | Account Story (5.4) with per-sentence tags, internal readers (clawd history, vault note) (F11, N5, N6) | PepsiCo story answers goal / changing / network / yard / proof / unknown; NFI shows the May 28 send | SHIPPED 2026-10-06 (6e, 7.3, 8.9) | | tag rule (weakest class); no private row; unverified employer item rises |
| UX-06 | Outreach anchor + angle suggestion from the story + pack copy without pasted headlines, signed by the rep (5.5, N13) | one anchor per person with Do not use; a different story is one click | SHIPPED 2026-10-06 (6g, 7.4, 8.10) | | anchor never cites private / imagery / not-for-outreach |
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

## 6c. UX-04 implementation record (2026-10-06)

Commit 7065fc24 on `feat/gap-account-first-ux`. What shipped, against the 6b contract:

1. One decision block: the state line in its hold colour (red opt-out, sky reply or follow-up, amber deal or hold,
   green ready); the inbound line; NEXT with the ONE primary control (a filled button; the chosen person's row no
   longer carries a second Prepare email, keeping Call prep and Log a touch); the People Stack unchanged from UX-03
   with the chosen person first; the relationship route directly after the stack; the do-not-contact names as one
   line with one "Review N flags" disclosure.
2. Context after the decision, in order: WHY NOW (a fund-holdings, stake or ticker headline is market chatter and
   never a line), KNOW (imagery facts marked never cite stay in SOURCES), THINK, ASK, the private line, WEDGE, ASSET,
   the tools row with an inline Note. THE GAP shows only when the buyer confirmed something; IMPACT only when a cost
   is known (pinned by `now-hierarchy.test.tsx`; the old "Unknown · Our read · Unknown · Our read" line is gone).
3. One column is the primary design; from 1100 CSS px the context sits beside the decision (a 7:5 grid) with DOM
   order unchanged (decision, then context), so reading order and Tab order are the same at every width.
4. Phone: the view tabs are no longer sticky (they stay sticky from md up, with the UX-03 scroll padding); the GAP
   subnav is one horizontally scrolling row; the Note and Compose pills are hidden on account pages; one opaque bottom
   bar carries Listen and Log a touch at 44 px, with `scroll-padding-bottom` already set for it.
5. Listen cleanup: one player on the page (a second Listen stops the first), pause and resume in place, the audio
   stops and its object URL is released on unmount, the state is announced through a polite status region
   (`voice-preview-button.test.tsx`).
6. Not done in this slice, by the contract: streaming the stack under a skeleton (the pursuit read already shares the
   queue read; the page-level Suspense is carried to UX-14 with the perceived-speed pass, because the brief read,
   not the pursuit read, is the long pole).

Validation: GAP folder suite 329 files / 5,059 tests green; `tsc --noEmit` clean; eslint clean on the changed files;
production build green. Measurements and the fresh review follow in 7.2 and 8.8.

## 6d. UX-05 contract (the derived Account Story), drafted from the UX-03 and UX-04 reviews

Goal: the seller reads what is going on at the account, what has already happened between us and them, and why that
leads to this person now, in a few tagged lines above or beside NEXT. One DERIVED projection (`gap/story/*`) over
readers GAP already has; no new table, no model call, no second recommendation authority.

1. **Rows** (each present only when it has a basis; nothing manufactured): WHAT HAS HAPPENED BETWEEN US (the last
   person touched with their title and what came back: Courtney Keen's automatic reply, Timothy Cooper's opt-out,
   Laura Maxwell's June email with no answer; read from the context history, the reply class and clawd's outreach
   history), GOAL, WHAT IS CHANGING, PHYSICAL-NETWORK IMPLICATION, YARD OPPORTUNITY, WHAT WE NEED TO LEARN, and
   STORIES THAT MATTER (top 2 to 4, collapsed). BEST PROOF is UX-06's (it belongs beside the opening, tagged
   "Our proof, measured" or "Our model", never Checked).
2. **Trust per sentence**: Buyer said, Checked, Unverified, Our read, Unknown, Contradicted; a line takes the weakest
   class of its inputs; a line with no basis is Our read or Unknown; YARD OPPORTUNITY is always Our read with its
   Wrong if beside it unless the buyer confirmed it; an UNVERIFIED item that names the chosen person's employer,
   division or a divestiture rises beside the person as "check before contacting" (FedEx: the CMA CGM sale against
   Courtney Keen; Ray Hatton "divested unit" rests on that unverified sale and the story must say so).
3. **Readers**: the brief's sections and hypotheses, buyer inputs, the context history, the reply class, clawd
   `/api/outreach/history` and `/api/yardflow/intel/account` (sends, reply intent; never engagement as a reason), the
   vault's account note when one exists (seller-visible, never quotable), the pursuit state. Private engagement is
   never a story row and never spoken.
4. **Placement**: at 820 the story's first three lines (what happened between us, what is changing, yard opportunity)
   sit inside the second screen, above WHY NOW; at 1100+ the story sits beside NEXT in the right column, replacing the
   raw WHY NOW list (the checked lines move under STORIES THAT MATTER with their cite status). To make room, the
   stack compacts: a card only for the chosen person, one-line rows (name, title, reason, Make first, Why) for the
   alternatives, no cards under a hold or a deal.
5. **Listen** reads the story rows with their tags ("checked", "our read"), never the private line.
6. **Tests**: the PepsiCo and FedEx fixtures: every line has a tag and basis ids, the tag equals the weakest basis
   class, Goal / Network / Yard are never Checked without a buyer input or a verified fact id, a line containing an
   Unverified signal's text is Unverified, the "what happened between us" row names the last person touched and the
   reply class, the sentinel private page never appears in any story or listen text.
7. **Out of scope**: the outreach anchor and "why #1 over #2" (UX-06), human-priority controls beyond Choose (UX-07),
   the worklist (UX-08), voice beyond Listen (UX-11+).

## 6e. UX-05 implementation record (2026-10-06)

Commits c55a2125, 52066d84, 1e9e194d and 8173e19e on `feat/gap-account-first-ux`. What shipped, against the 6d contract:

1. One pure projection, `src/lib/gap/story/story.ts` (`projectStory`), over readers GAP already has: the brief's
   sections and hypotheses, the buyer inputs, NOW's own why-now and know lines, the merged touches
   (`story/touches.ts`: the account history, GAP's first-touch ledger, clawd's outreach history by address, the
   classified replies), the pursuit state, the resolver's set-aside list, the vault note. No table, no model call,
   no second recommendation authority.
2. Rows, each present only with a basis: WHAT HAS HAPPENED BETWEEN US (the last email to a named person with their
   title and subject, the silence or what came back by reply class, the count of emails and people, a meeting),
   WHAT IS CHANGING (NOW's why-now lines), YARD OPPORTUNITY (the buyer's words when a problem BID exists, else the
   top grounded angle's problem as Our read with its Wrong if), THEIR GOAL (a future-state or priority BID, else a
   verified program statement, else an unverified one), NETWORK IMPLICATION (the angle's inference, only when it adds
   a sentence to YARD; the brief builder sets both to the problem, so it is usually absent), WHAT WE NEED TO LEARN
   (the unknown gap elements), STORIES THAT MATTER (checked lines not already told, with their cite status,
   collapsed), YOUR NOTE (the vault wedge, marked never to quote).
3. Trust per sentence: Buyer said, Checked, Unverified, Our read, Unknown, Contradicted, with basis ids
   (`evidence:`, `bid:`, `hypothesis:`, `signal:`, `touch:`, `vault:`); a row takes the weakest class
   (`weakestTag`); a sentence with no basis is Our read or Unknown; a line carrying an unverified signal's text is
   Unverified; a divested-unit set-aside that rests on an unverified report is said so, one sentence per report.
4. Check before contacting: an unverified sale or divestiture that names the chosen person's unit rises beside the
   person, after NEXT and before the stack (FedEx: the CMA CGM sale against a FedEx Supply Chain title; nothing rises
   for Glen Chaffee).
5. Readers (`story/load.ts`): clawd `GET /api/outreach/history?domain=` and the intel snapshot's vault wedge, each
   bounded at 4 s and soft ('not_configured' when the pair is absent, 'unavailable' on a failed read, and the story
   says which); the local vault file when `GAP_VAULT_DIR` is set (Casey's machine). clawd is asked by the record
   domain, else the domain the account's own addresses share (FedEx's company row carried no domain).
6. Placement: the story leads the context column and takes WHY NOW's place; KNOW and THINK hide under a story (the
   stories row and the yard row tell them); from 1100 px it sits beside NEXT. The stack compacts: a card only for the
   chosen person while a cold touch is a live choice, one compact row per alternative (name, title, reason with its
   material cue, Make first, Why), no cards under a hold or a deal.
7. Listen reads the story rows with their tags in words after the state, NEXT and the person; never the vault note,
   never the private line.
8. The fresh-review batch (8.9): the header says the last touch and the reply once (the story's between-us row
   carries them); the same project or deal under two sources is one sentence with the stronger tag; a Checked line
   whose dollar figure does not parse is Unverified and never leads; a program statement (a merger, a multi-year
   investment) is a change and outranks an incidental headline; a source speaking as itself is attributed ("FedEx
   says: ..."); THEIR GOAL only in the buyer's words; one Unknown line for what to learn; the silence is judged
   against the last email and an orphan reply says so; alternatives are plain rows with their reachability and the
   hold sentence is said once; the divested-unit caveat sits under the set-aside line inside the stack; the collapsed
   stories row keeps a heading and a visible Show; the private line sits after ASSET; a story sentence is cut at a
   word past 200 characters.
9. Not done, by the contract: the outreach anchor and BEST PROOF (UX-06), human priority beyond Choose (UX-07).

Validation: GAP folder suite 332 files / 5,101 tests green (35 new across 3 files); full unit suite green on the
first slice (657 files / 7,371 tests) and the GAP folder on every batch since; `tsc --noEmit` clean; eslint clean on
the changed files; five local production builds green. Measurements and the fresh review follow in 7.3 and 8.9.

## 6f. UX-06 contract draft (the outreach anchor, BEST PROOF, call prep on the pursuit state), drafted 2026-10-06 from 5.5, N13 and the UX-03 to UX-05 carried items

STATUS: ACCEPTED 2026-10-06 (Casey: Option A, the approved-thesis model; Option B is not implemented in this program; C01, the compiler's evidence scope and approval semantics stay as they are). Implementation record in 6g.

What the code does today (read 2026-10-06): step 0 of every seed family (`sequences/families.ts`) carries the slot
`{{observation}}`, filled per person by `sequence/render.ts` from the HYPOTHESIS observation (a cited sentence whose
`[S:<signal id>]` tokens become compile markers); the compiler's C01 resolves every cited sentence against that
hypothesis's own linked signals; the evidence gate (`research/evidence-gate.ts`) requires one verified, dated, quoted,
account-specific outreach fact; the action pack (`execution/action-pack.ts`) is built for the routing decision's
person, else an explicit `personaId`, else the hypothesis primary (UX-03 fixed the card-to-pack mismatch, F1); the
draft service replaces the template sign-off with the sender's real Gmail signature at the click (`seller-draft.ts`),
so N13's "signed Casey for any rep" is already the sender's signature in the draft and only the preview shows the
template line; call prep (`replies/brief.ts` `callBrief`) reads the person's do-not-contact flag and the hypothesis,
never the account's pursuit state.

1. **Anchor selection (no decision needed).** A pure projection `story/anchor.ts` for the chosen person: ONE anchor
   (the hypothesis's verified outreach fact when it lands on the person's remit; else the newest checked, dated,
   citable fact whose text names their remit, by the story's relevance order), WHY THEY CARE (Our read, one sentence
   from the person's lane and the fact), one optional SUPPORTING FACT, and DO NOT USE with reasons (private
   engagement, modeled dollars as their pain, imagery facts, unverified items, facts marked not for outreach, a
   Checked line whose number does not parse). Rendered beside the opening in the action pack and in the six-line
   brief's KNOW line. Tests: PepsiCo and FedEx fixtures; the anchor is never private, imagery, unverified or
   not-for-outreach; a person with no eligible anchor shows "No fact on their remit is citable yet" and the pack
   stays unsendable as today.
2. **"Use a different story" (DECISION for Casey).** The anchor is keyed to the person (5.5) but the opening is keyed
   to the hypothesis. Two honest ways to give the seller "a different story is one click":
   - **Option A (recommended): switch the thesis, keep the pipeline.** A different story means a different grounded
     hypothesis at the account (one observation each); the control opens the pack for that hypothesis and records
     the choice on the person's angle row (`persona.angle`, existing mechanism: `{ anchorHypothesisId }`). The
     opening stays the approved observation; the compiler, the evidence gate and the approval flow are untouched.
     Cost: a story that has no approved hypothesis yet is "draft and review one", not a click.
   - **Option B: a per-person anchor slot in the copy.** The renderer fills `{{observation}}` from the chosen anchor
     fact (any citable signal at the account) and the compiler resolves markers against the account's signals, not
     only the hypothesis's. Cost: C01's contract widens, the approval row no longer proves the exact sentence a human
     read, and the "pasted headline" (N13) is still the signal's own text; this is the architecture expansion the
     program said to pause on.
   N13 itself (the opening pastes a headline) is an authoring rule, not a renderer change: an observation must be a
   sentence about the change in the account's own words with its citation, never a title; enforce it at thesis
   review (a title-shaped observation is refused with the reason) and in the story's attribution rule ("PepsiCo
   says: ...").
3. **BEST PROOF.** One canon line beside the opening (`compiler/canon.ts` phrasing only: 48 to 24 minutes measured,
   about 5 % observed, 24 sites live, 260 sites under contract; Primo Brands the only named customer), tagged "Our
   proof, measured" or "Our model", never Checked, never a story row (5.4).
4. **"Why #1 over #2" (UX-03 carried).** The stack's chosen card shows the first rank dimension on which the chosen
   person leads the next row, from the resolver's rank keys (`owner-resolution.ts` `rankDimensions`), with dated
   bases; null on a tie (the tie line already says so); never a badge for a cold first touch.
5. **Call prep reads the pursuit state (UX-03 carried).** `/gap/call/[personaId]` loads `loadPursuit` for the
   person's account; under a reply, an opt-out, a deal or a hold the call page says the hold first and offers no
   opener (the same rule as the stack's Call prep control); the "FACT OBSERVED" label on a keyword hit reads
   "keyword hit, not a fact" (soak P2).
6. **Not in UX-06:** human-priority controls beyond Choose (UX-07), the worklist (UX-08), voice (UX-11+), the
   hypothesis authoring UI beyond the title-shaped refusal.
7. **Validation:** the UX-05 recipe (local preview against the production database, read-only; 820 / 390 / 1440 light
   and dark; a fresh AE, product and accessibility review on the captures); the pack's copy bytes for an unchanged
   hypothesis are byte-identical before and after (pinned), so nothing outbound changes until Casey chooses A or B.

## 6g. UX-06 implementation record (2026-10-06), with the two UX-05 calls

Casey's calls on the UX-05 open items, both landed in this slice: the People Stack shows THREE full people by default
(never padded; a hidden eligible person with a currentness caution is counted in the Show-more label; the named
sponsor / tech / site slots stay compact lines), and the FedEx entity boundaries now carry their FIRST-PARTY sources
(`people/entity-boundary.ts`: the FedEx newsroom releases of Oct 1, 2026 for the FedEx Supply Chain sale to CMA CGM
Group at an enterprise value of $1.4B, and Jun 1, 2026 for the FedEx Freight spin-off, NYSE: FDXF); the resolver's
set-aside carries the source, the story says a divested-unit set-aside stands on the company's own release (Checked)
and never tells the same deal from a third party beside it. `scripts/gap/store-first-party-entity-facts.ts` offered
both releases to the one research contract, which refused them as non-physical-network facts (as designed: they are
provenance for a boundary, not outreach); the constant is the provenance.

Commits 2e184cdb through cf0fa7a1 on `feat/gap-account-first-ux` (the pure modules, the wiring, two dogfood batches,
the fresh-review batch). What shipped, against 6f under Option A:

1. **The outreach anchor** (`src/lib/gap/story/anchor.ts`, pure): for the chosen person, ONE usable thesis (approved
   or active, grounded, not contradicted, not needing review, and one the send gate would let out: the loader reads
   `hypothesisSendable` over each open thesis's linked signals; an unread gate makes nothing usable) chosen by the
   person's recorded choice, else the thesis whose fact lands on their remit (thesis relevance), else the top usable
   one; WHY THIS PERSON CARES (Our read from the remit; a person the fact misses is told to ask who owns it); one
   SUPPORTING FACT (checked, citable, parsable, not the anchor's); BEST PROOF in the canon phrasing, tagged "Our
   proof, measured", never Checked; DO NOT USE named with reasons (private engagement, our modeled value, unverified
   items, imagery, not-for-outreach, a broken number); the other theses as USE A DIFFERENT STORY (a thesis the gate
   would refuse, or one needing review, is listed as not usable with the reason and no button); a checked, citable
   story line no thesis is grounded on as DRAFT + REVIEW (one entry per deal).
2. **A different story switches the thesis** (`POST /api/gap/personas/[id]/anchor`, `setAnchor` /
   `loadAnchorChoices` in `motion/persona-angle.ts`): an append-only `persona.angle` row carrying
   `anchorHypothesisId`; the loader (`pursuit/load.ts`) opens the pack on that thesis when it is grounded and open
   here; nothing sends, nothing bypasses approval, the renderer, the compiler and the approval are untouched
   (`tests/unit/gap/copy-bytes.test.ts` pins every seed family's step-0 bytes for an unchanged observation).
3. **Draft + review, low friction**: the block prefills STORY / SOURCE / PROPOSED OUTREACH OBSERVATION (the house
   cited-quote form: source label, the quote, the citation before the period) and OUR GUESS (hedged), proposes
   through `POST /api/gap/hypotheses` and submits through the existing transition; approval stays a human click in
   the REVIEW lane. When nothing is usable the draft path is open by default (the way out of research).
4. **Title-shaped observations are refused** (`hypothesis/observation.ts` `titleShapedReason`, inside
   `validateObservation`, so propose, draft edits and submit all refuse it) with plain language
   (`OBSERVATION_REFUSAL_TEXT`; the drawer and the draft form word it); a sentence in the source's words with its
   citation passes; attribution is preserved.
5. **Why #1 over #2** (`owner-resolution.ts` `leadOver` and `rankDimensionNames`, `stack.ts` `leadOver` on the first
   row): the first rank dimension on which the chosen person leads the next visible row, in words from the two reads;
   a tie reads "GAP cannot separate these two on current evidence."; never invented.
6. **Call prep reads the pursuit state** (`replies/call-pursuit.ts`, `GET /api/gap/call/[personaId]/pursuit`, a second
   request beside the brief so the brief stays fast): under a reply, an opt-out, a deal or a hold the page says the
   hold first and offers no opener; while the state is being read, or when it could not be read, no opener either
   (fail closed). The FACT caption tells the truth: the call brief now selects the fields the send gate reads (it
   selected six, so every thesis had captioned as a keyword hit); a real keyword hit reads "KEYWORD HIT, not a
   verified fact: never read aloud as one".
7. **The six-line brief carries BEST PROOF** (a Proof row under KNOW, "YardFlow's own number, never theirs").
8. **Placement**: the "Opening story for Glen" block sits after NEXT and before the stack, compact (the opening and
   why they care in the open; best proof, supporting fact and the do-not-use list behind one disclosure; the other
   stories, or "Draft a thesis from a checked fact", behind another, closed by default).
9. **The fresh-review batch** (8.10): the pack opens only on a thesis the block calls usable (an unread gate opens
   nothing); a remit mismatch travels to NEXT as a caution naming the eligible person the fact fits (FedEx: the air
   network thesis against Glen Chaffee names Lisa Lisson, President, Air Network Operations); the story is told once
   beside the anchor (its own fact becomes "The opening story, above."); the chosen card reads the human choice first
   and says a lower-ranked choice as what it is ("You chose Glen (you, Oct 5). On evidence GAP ranks Jeffrey
   ahead: ..."), never as a tie; a thesis of any live status is never offered again as a draft; the tie line names
   the people on screen first; a broken dollar figure renders as "[figure unverified]"; the title-shaped rule accepts
   an honest Title Case sentence with an ordinary verb; focus moves to the status line after a switch or a submit;
   the textareas are labelled and described; a keyword hit loses the green border; the call-prep timer is cleared;
   the client block imports its text from a client-safe module (the anchor projection reaches node:fs).

Validation: GAP folder suite 335 files / 5,124 tests green at a56c2a5f (the later batches re-ran their files green:
outreach-anchor, ux06-views, copy-bytes, call-route, contract-parity, call-brief, call-truth); `tsc --noEmit`
clean; eslint clean on every changed file except `replies/brief.ts`, whose 10 `any` errors pre-date this slice
(house glue, recorded in section 10); five local production builds green. Measurements and the fresh review follow
in 7.4 and 8.10.

## 6h. UX-07 implementation record (2026-10-06): human priority on the stack

Validation policy from here (Casey, 2026-10-06): risk-tiered. UX-07 to UX-10 run focused tests, adjacent module
tests, one typecheck, the Vercel preview build, two to four representative account smokes, one browser check at 820
(390 as a guard), and ONE fresh seller/product review per slice; the full suite, the broad capture and the full review
team run once at the integration gate after UX-10. A machine restart is not a code change.

What shipped, against 5.3 and 5.6:

1. **The one new state**: `person.seller_preference`, an append-only audit row (`lib/gap/people/seller-preference.ts`,
   no new table): `not_a_fit` or `not_now` (until a date within a year) with an optional reason; newest row per
   person at the account wins; `clear` is Undo (a reversal row, never a delete); a lapsed Not now reads as none. It
   never writes `do_not_contact` and no send path reads it. `POST /api/gap/personas/[id]/preference`, session only.
2. **Stricter, never looser**: the stack (`people/stack.ts`) parks a preferred-aside person out of the default rows
   into "Show more" with the seller's own line ("Not a fit here (buys software), you, Oct 4."); eligibility is the
   resolver's and untouched; the chosen person is never parked under their own preference; the Show-more label counts
   "N set aside by you"; "Choose who (N)" counts the active people.
3. **Make next**: records the motion's NEXT IF NO RESPONSE person on the existing motion row with the chosen primary
   (`POST /api/gap/accounts/motion`, append-only); Undo clears the explicit next (the motion's own pick returns). The
   row reads "Next if no response"; the heading line says who is next and what unlocks them (the 5 business days, or
   at once on a failed address), from the pursuit state.
4. **Wrong role / Left the company / Verify role**: the existing human corrections (`POST .../employment` with
   `left` or `role_changed`, Undo posts `current`) and the public role check (`POST .../employment/verify`, verdict
   read back); nothing new is written.
5. **Read-back**: every decision reads back in one line with its scope and effect ("Kelly is next at Walmart Inc
   only, after Doug if no response. Nothing is sent.") with Undo in place; failures say nothing changed.
6. **Never over a hold**: no priority control renders under a reply, an opt-out, a deal or a hold (`chooseAllowed`
   false), and none on the chosen person, a HubSpot-only person (Choose adds them first) or a non-eligible slot.
7. **Not in UX-07**: "I know this person" (the relationship route through capture; deferred, section 10); a
   preference recorded on a held person shown as "Next once the reply is triaged" (the controls are hidden under a
   hold instead; deferred); the Work card's "Choose who (4)" (UX-08).

Validation: `tests/unit/gap/seller-preference.test.ts` (newest wins, clear, lapse, account scope, the payload never
carries do_not_contact, the date and reason bounds), `people-stack.test.ts` (parking, the chosen person, the next
tag), `people-stack-view.test.tsx` (the next line and tag, Make next and its Undo bodies, Not a fit and Not now
bodies, the parked line with Undo, the employment and verify posts, nothing under a hold; every POST url checked
against send, enroll, draft, HubSpot and Apollo); adjacent suites (motion routes, contract parity, owner resolution
family, pursuit state) green; tsc clean; eslint clean on the changed files (`audit.ts` carries three pre-existing
`any` errors). Browser check and the fresh review: section 9.

## 6i. UX-08 implementation record (2026-10-06): the account-first Work surface

What shipped, against Direction A (4.1) and F3 / F12 / N4:

1. **WORK is the landing** (`/gap` with no lane): the accounts that need the seller, ONE card per account, in the
   existing NEXT UP order (reply, follow up, ready, decide, research, then the held accounts). Each card answers
   account, state, why now, next person, next action, blocker, with Open to the workspace carrying the Work order
   (`?from=work&i=n`, the hook UX-09 uses). NEXT UP's panel shows only when the list is empty.
2. **Not a second state engine**: `lib/gap/work/list.ts` projects the cards from the candidates the cockpit already
   builds (`routing/next-up.ts`, now returned in full, with `pickNextUpV2` still picking the four for NEXT UP), the
   account motions it already reads (the next person is the motion's primary), the In Deals summary it already shows,
   and the reply class decided before anything ranks (`replies/classify.ts`).
3. **Replies classified before they rank** (Direction A change 2): a human reply heads the list with "No cold email
   to anyone here until it is recorded"; an opt-out is "Opted out: record it" and ranks after READY (quick admin,
   never a conversation); an automatic reply is not work and does not list; a bounce is research (find a working
   address). Walmart's "stop" can no longer head the list.
4. **A held account is never a cold action**: an account in a deal (the summary, when complete) or held by a card
   for an open deal lists last under In a deal with "Open the deal brief" and the blocker; an UNKNOWN opportunity
   read is a caution with no action ("Check HubSpot directly"). Its READY card is dropped from the list.
5. **Lanes as filters, counts as contents** (N4): the chips (All, Replied, Follow up, Ready, Decide, Research, In a
   deal) filter the one list and their counts are what the list holds; a name search narrows it; both live in the
   URL (`?filter=`, `?q=`) so Back to Work can restore them, and `?focus=n` focuses a card on return (UX-09). The
   old lane tiles and lane views stay (the analyst path) until UX-10 moves them out of the seller's way.
6. **Parity with the one canonical pursuit state** (the Train A browser check found FedEx reading "Research" on its
   card while NOW said "Ready for a first touch: Glen Chaffee"): the workspace remembers its pursuit state per account
   in process memory (`lib/gap/pursuit/summary.ts`, 15 minutes, nothing written anywhere), and the Work page warms
   the first three accounts with no fresh summary after its response is sent (`next/server` `after()`, serial,
   bounded). A fresh summary overrides the cockpit lane's state, person and rank on the card (`source: 'pursuit'`);
   a cold start falls back to the lanes. The opt-out ranks after research: admin, never cold work, never at the head
   even when nothing else is ready (the first check showed Walmart's "stop" heading the list).

Validation: `tests/unit/gap/work-list.test.ts` (one card per account in order, the human reply first, the opt-out
never first and what it says, the automatic reply dropped, the held account last with no cold action and its READY
card dropped, UNKNOWN as a caution, the gate-failing candidate skipped, an unavailable deals read claims nothing,
counts equal contents, search keeps the order); `work-list-view.test.tsx` (every card field, Open carries the order,
chips and search filter and write the URL, restore from the URL, the empty state); `next-up.test.tsx` green; tsc and
eslint clean. Browser check: section 9.

## 6j. UX-09 implementation record (2026-10-06): Done, next

What shipped, against Direction A change 3 and F9:

1. **The frozen order**: when Work renders it saves the order it shows (every card, with the filter and the search)
   to the browser's session storage (`lib/gap/work/order.ts`); the account hrefs carry `?from=work&i=n` into it.
   No server state, no new table: the order is the seller's own view at the moment Work was opened.
2. **The bar** (`components/gap/done-next.tsx`), under NEXT on the account page only when opened from Work: "Account
   3 of 14 in Work.", Back (the previous account), Next account (the next one), Back to Work (restores the filter
   and the search and focuses this card, `/gap?filter=&q=&focus=n`). Plain links only, with the account names for
   assistive tech; the seller can leave at any point. It records nothing: the outcome is whatever the seller did
   above (the email, the call, the touch, the disposition), and the list drops the account on its own.
3. **Fail-safe**: a deep link, a private window or an order that moved (the account at `i` is no longer this one)
   renders "Opened from Work." with Back to Work only, never a wrong Next. The last account says "The last one." and
   makes Back to Work the primary.
4. **Not in UX-09**: a snooze control (Not now exists per person; an account-level snooze is a UX-10+ call if the
   seller asks for it); the 390 bottom bar does not carry Next account yet (the bar sits under NEXT, inside the first
   screen).

Validation: `tests/unit/gap/done-next.test.tsx` (the links in order, Back to Work with filter, search and focus, the
first and the last, the stale order and the deep link, the storage round trip and a broken value, the rendered bar
with names for assistive tech, no buttons); the account-now and ux06 view suites green; tsc and eslint clean.
Browser check: section 9.

## 6k. UX-10 implementation record (2026-10-06): navigation and fast account access

What shipped, against Direction A (4.1):

1. **Three seller items**: the GAP subnav reads WORK (`/gap`), ACCOUNTS (`/gap/accounts`), CAPTURE (`/gap/capture`)
   and More (Add to GAP, Sources, Signals, All hypotheses, Learning, Notes). Nothing is deleted: the intelligence and
   admin tools live under More, out of the normal path; a current More item marks the menu; the menu closes on
   navigation; an account workspace counts as Accounts.
2. **ACCOUNTS** (`/gap/accounts`, new): every GAP account on one line (name, tier, vertical, people on record, the
   newest proven GAP first touch from the same loader the motion reads), Tier 1 first, then band, then name. The
   search box has focus on arrival, narrows as you type (tokens in any order, by name or vertical), shows a live
   count, and Enter opens the first match. Three cheap reads; no pursuit read here (that is the workspace's job).
3. **GAP accounts only**: the index lists the accounts GAP has worked (people, a thesis or a proven first touch on
   record), not the 1,708-row TAM universe the first check rendered on a 95,000 px page; it shows its first 60 until
   a query narrows it and says so.
4. **Not in UX-10**: the app-wide Ctrl+K palette still reads the static account JSON and routes to the old
   intelligence pages; teaching it GAP accounts is recorded in section 10 (the ACCOUNTS search is the fast path
   inside GAP for now); a Work state column on the index waits for a cheap per-account state read.

Validation: `tests/unit/gap/gap-subnav.test.tsx` (three top-level links and every tool under More, the current
item, the workspace under Accounts, a More item marking the menu), `accounts-index.test.tsx` (the order, the token
search, focus on arrival, the live count, Enter opens the first match, the empty state); tsc and eslint clean.
Browser check: section 9.

## 6l. UX-11 implementation record (2026-10-06): the auditory layer

What shipped, against 5.8 (Listen), on the existing player (`VoicePreviewButton`, `/api/voice/preview`, ElevenLabs
TTS: one player at a time, pause and resume, a route change stops and releases the audio; nothing new was invented):

1. **For the ear** (`lib/gap/voice/for-the-ear.ts`): what spoken text may carry. Never an email address, a phone
   number, a URL, a citation token, a provenance id, a basis parenthesis or a machine word; the trust tag is a
   spoken aside ("checked", "our read", "the buyer said it", "not verified", "unknown") unless the words say it.
2. **Listen to today** (`voice/today.ts`, the button beside the Work heading): "Today. 27 accounts need you: 1 reply
   to read, 1 ready for a first touch, 13 in a deal or held." then the first five cards in order, each as state, why
   now, next person, next action and the hold, then "N more wait below, in order." A spoken projection of the same
   cards, never the screen's DOM; the cards carry nothing private.
3. **Listen to account** (`voice/account.ts`, the existing Listen on NOW): 150 to 220 words: state and the last
   touch; the goal and what changed with their tags; where the yard fits; our proof, measured; the first person, why,
   whether the role is verified; the second if no reply; how many are flagged do not contact (a count only); the
   opening and why they care; the unknown; next. Under a hold nobody is named as if they were next and no opening is
   spoken. Never the private line, the do-not-use list, the vault note, an address or a URL (the old screen-read
   concatenation stays only when the pursuit read failed).
4. **Not in UX-11**: skip by account, 1.5x speed and Media Session (the contract's player extras); push-to-talk.

Validation: `tests/unit/gap/voice-listen.test.ts` (the scrubber, the spoken tag, the today brief in order with the
hold and the tail, the account brief's sections and word count, the exclusions, the hold case); tsc and eslint
clean. Browser and ear check: section 9 (Train B).

## 6m. UX-12 implementation record (2026-10-06): Dictate

What shipped, against 5.8 (Dictate) and Casey's spend boundary:

1. **The recorder** (`components/gap/dictate.tsx`): a 44 px Dictate button with `aria-pressed`; Recording shows a
   timer against the 2-minute cap, a visible state and Cancel; Escape discards and says so; Stop posts the audio
   (`getUserMedia` + `MediaRecorder`; SpeechRecognition is never the path); a failure keeps the audio in memory for
   Retry and says to type instead; the microphone is released on stop, cancel and unmount; audio is never stored.
2. **The boundary** (`capture-flow.tsx`): the transcript lands as "I heard", editable; "I am about to record" names
   the account, the person, the conversation and the quote; Confirm saves through the existing audited capture route
   (the same POST as Save), Edit moves the words into the note, Discard writes nothing. Nothing is written before
   Confirm; no voice path reaches send, enroll, a flag or a delete.
3. **The provider capability** (`lib/gap/voice/transcribe.ts`, `POST /api/gap/voice/transcribe`): paid transcription
   (ElevenLabs Scribe, the provider already configured for TTS) runs only when `GAP_TRANSCRIPTION_ENABLED=true` and
   `GAP_TRANSCRIPTION_PROVIDER=elevenlabs` are set with the key; a `mock` provider exists outside production; else
   the route answers `transcription_disabled` and the page says "Dictate is off until transcription spend is
   approved. Typing always works, and the keyboard microphone dictates into the note." OpenAI is never used.
   **UX-12 CODE COMPLETE. PRODUCTION TRANSCRIPTION DISABLED PENDING SPEND APPROVAL** (no env flag is set; no paid
   call has been made). Enabling is two env vars and a redeploy, no code change.
4. **Not in UX-12**: a level meter; Undo after Confirm (the saved note is editable in the capture review, as today).

Validation: `tests/unit/gap/dictate.test.tsx` (the provider resolution incl. never OpenAI, disabled makes no call,
the mock reads no audio, the paid path posts once and reads the text; Recording with the timer, Cancel and Escape
discard with no post, Stop posts multipart and hands the transcript up, the off state never opens the microphone,
Retry after a failure; the confirmation boundary: I heard editable, I am about to record, Discard writes nothing,
Confirm writes once through `/api/gap/captures` with the edited words, no send, enroll, suppress or delete URL
anywhere); the capture suites green; tsc and eslint clean.

## 6n. UX-13 implementation record (2026-10-06): Ask GAP

What shipped, against 5.8 (Ask GAP):

1. **Grounding** (`lib/gap/ask/grounding.ts`, `ask/context.ts`): one bounded structured context from the SAME
   projections the page renders (the pursuit state and NEXT, the people with why-over-next and the seller's
   set-asides, the story rows with their tags and bases, the opening with why they care and our proof, the other
   stories, buyer inputs). Never the vault note, the private line, the do-not-use list or an address (scrubbed).
   Not the database, not the vault.
2. **The prompt**: read-only copilot; cite with the trust words (the buyer said, checked, our read, not verified,
   unknown); "GAP does not know that yet" and what would answer it; name a conflict; never recommend sending,
   enrolling, an Apollo lookup, a flag change or a delete; plain words, at most 160 words, no em dashes.
3. **A request to act** (send, enroll, Apollo, DNC, delete, choose or reorder) is answered by naming where the
   control is, with no model call at all.
4. **The provider**: the existing abstraction (`lib/ai/client.ts` `generateTextWithMetadata`: the AI gateway, then
   Gemini, then OpenAI, then the control plane, as configured). `POST /api/gap/ask` is session-only, writes nothing,
   503 when no provider answers; the box on the account page says it answers from this page only and cannot act,
   shows the answer with its grounding line, and offers five example questions. Typed only (push-to-talk later).

Validation: `tests/unit/gap/ask-gap.test.tsx` (the context's contents and exclusions, the prompt's rules, every
action pattern answered by the control, plain questions not, the answer tidy, the box's POST and rendering, the
outage line); tsc and eslint clean. Live answers on PepsiCo, FedEx and NFI: section 9 (Train B).

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

### 7.2 UX-04 measurement: where the decision ends (local preview of 7065fc24 against the production database, read-only, DPR 1, 2026-10-06)

The contract: at about 820 CSS px (Casey's real desktop) the first two screens hold the full decision (state, NEXT,
the chosen or next person, the People Stack top 3, the primary actions). Measured as the bottom pixel of the NEXT
control or the third stack row's action, whichever is lower, over the viewport height (900 at 820 and 1440; 844 at 390).

| Account | 820 px: decision ends | context starts | page | 390 px: decision ends | page | 1440 px: layout |
|---|---|---|---|---|---|---|
| FedEx | 1,203 px (1.34 screens) | 1,770 px | 2.9 screens | 1,343 px (1.59) | 3.6 | grid; context beside the decision from 200 px |
| Walmart | 1,026 px (1.14) | 1,631 px | 2.8 | 1,249 px (1.48) | 3.7 | grid |
| PepsiCo | 1,182 px (1.31) | 1,792 px | 2.8 | 1,301 px (1.54) | 3.5 | |
| H-E-B | 996 px (1.11) | 1,446 px | 2.3 | | | |
| Kroger | 960 px (1.07) | 1,433 px | 2.3 | | | |
| NFI | 1,042 px (1.16) | 1,556 px | 2.2 | | | |

Before UX-04 (UX-03 captures of the same build family): pages 2.5 to 2.9 screens at 1440 (one column), 3.1 to 3.3 at
820 and 3.9 to 4.2 at 390; THE GAP, IMPACT "unknown", finance headlines and imagery rows were on every page.

Keyboard, with the sticky elements engaged: 60 Tab and 60 Shift+Tab presses at 820, 390 and 1440 found zero NOW
controls fully covered (the UX-03 review's blocker was five of five sample points covered). The view tabs are static at
390 (sticky from md up), the bottom bar is present at 390 only, and no page overflows horizontally.

Post-change measurements for the full task set: filled by UX-15 against the same tasks.

### 7.3 UX-05 measurement: where the story sits (local preview of 8173e19e against the production database, read-only, DPR 1, 2026-10-06)

The contract: at 820 the story's first three rows (between us, what is changing, the yard opportunity) sit inside the
second screen, above where WHY NOW was; at 1100+ the story sits beside NEXT. Measured as the bottom pixel of the row
over the viewport height (900 at 820 and 1440; 844 at 390). The decision end is measured as in 7.2.

| Account | 820: decision ends | story starts | first three rows end | page (UX-04) | 1440: first three rows end | 390: first three rows end |
|---|---|---|---|---|---|---|
| FedEx [ready] | 977 px (1.09 screens) | 1,458 px (1.62) | 2,081 px (2.31) | 3.0 screens (3.2) | 823 px (0.91), beside NEXT | 2,359 px (2.80) |
| Walmart [opted out] | 809 px (0.90) | 1,298 px (1.44) | 1,727 px (1.92) | 2.4 (2.8) | | 2,156 px (2.55) |
| PepsiCo [research] | 906 px (1.01) | 1,418 px (1.58) | 1,768 px (1.96) | 2.6 (2.8) | 590 px (0.66) | |
| H-E-B [research] | 830 px (0.92) | 1,204 px (1.34) | 1,511 px (1.68) | 2.4 (2.3) | | |
| Kroger [in deal] | 805 px (0.89) | 1,190 px (1.32) | 1,520 px (1.69) | 2.4 (2.3) | | |
| NFI [choose] | 846 px (0.94) | 1,256 px (1.40) | 1,343 px (1.49) | 2.1 (2.2) | | |
| General Mills [research] | 866 px (0.96) | 1,252 px (1.39) | 1,673 px (1.86) | 2.5 | | |
| Tyson [relationship] | 943 px (1.05) | 1,273 px (1.41) | 1,537 px (1.71) | 2.4 | | |

Before the review batch (52066d84): the first three rows ended at 1.57 to 2.32 screens with two accounts past the
second screen; the compact stack still drew a bordered card per alternative and repeated the hold sentence per row.

Read honestly: on every account the story starts inside the second screen and the decision ends inside the first
(0.89 to 1.09, down from 0.96 to 1.16); on seven of eight the first three rows also end inside the second screen; on
FedEx they end at 2.3 because its between-us row holds three sentences (the August send, the June automatic reply, the
count) and its two filing quotes are long. The stack's default row count stays at 4 (the UX-03 contract allows 3 to 5;
the product reviewer measured that 3 rows would save about a tenth of a screen, not the three tenths FedEx needs).
Every sentence on every page carried a tag (0 untagged of 4 to 10 per page); the private sentinel never appeared in a
story; clawd's sends merged on FedEx (Aug 7 to Michael Jeannotte), PepsiCo (29 emails to 20 people), General Mills
and Tyson once the domain fallback landed. Keyboard, with the sticky elements engaged: 40 Tabs at 820, 390 and 1440 in
light and dark found zero obscured focused controls; no page overflows horizontally. Page load on the local preview:
13 to 27 s (unchanged from UX-04; the brief read is the long pole; the story readers add under 1 s in parallel).

### 7.4 UX-06 measurement: the anchor on the dogfood accounts (local preview of cf0fa7a1 against the production database, read-only, DPR 1, 2026-10-06; the e3dba3e5 run gave the same numbers)

| Account | state | stack | opening story | decision ends (third row action) | story's first three rows end |
|---|---|---|---|---|---|
| PepsiCo | research | 3 rows, no card | no usable thesis; one draftable story (the Gatik partnership, once); NEXT: open the research plan | 1,116 px (1.24 screens) | 1,868 px (2.08) |
| FedEx | ready, Glen chosen | 3 rows, 1 card | the active Network 2.0 thesis, basis the highest-ranked usable thesis; why: the fact is an air network change and may not land on Glen's remit, Lisa Lisson (President, Air Network Operations) fits it; NEXT carries the same caution; a supporting fact; "You chose Glen (you, Oct 5). On evidence GAP ranks Jeffrey ahead: Jeffrey is the more senior title; the remits read the same." | 1,383 px (1.54) | 2,313 px (2.57) |
| Walmart | opted out | 3 rows, no card | none (a hold shows no opening story) | 809 px (0.90) | 1,624 px (1.80) |
| H-E-B | research | 3 rows, no card | no usable thesis, nothing draftable ("Open the research plan to find a fact") | 988 px (1.10) | 1,514 px (1.68) |
| NFI | choose person | 3 rows, no card | no usable thesis, nothing draftable | 1,004 px (1.12) | 1,371 px (1.52) |
| General Mills | research | 3 rows, no card | no usable thesis: "The open thesis would be refused by the send gate: the angle needs your review: It opens on activity outside the North America network, but a better current fact exists."; one draftable fact, not the refused one | 1,096 px (1.22) | 1,726 px (1.92) |
| Kroger | in a deal | 3 rows, no card | none | 785 px (0.87) | 1,353 px (1.50) |
| Tyson Foods (`tyson-foods`) | relationship-led | 3 rows, no card | none | 887 px (0.99) | 1,370 px (1.52) |
| Tyson (`tyson`, an empty duplicate account: no people, no HubSpot id, no domain link) | held: HubSpot could not be checked (identity_unresolved) | none | none (a hold shows no opening story) | n/a | 537 px (0.60) |

Read honestly: the three-row default brought the decision end down to 0.87 to 1.54 screens on every account (1.09 to
1.16 before, with four rows and no opening story); the block costs 150 to 380 px; the story's first three rows end
inside the second screen on six of eight, and at 2.1 and 2.6 on PepsiCo and FedEx. No private fact, unverified item
or modeled value reached an anchor on any account (the probe checked the block's text against the private pages
and the DO NOT USE list); the anchor, NEXT and the call page agree with the send gate on every account. Call prep:
Walmart (opted out) says the hold first and offers no opener; General Mills says "Research: the angle needs your
review" and its FACT block is captioned as a fact (the brief's select carries the gate's fields now); FedEx says
"Ready for a first touch: Glen Chaffee." and shows the brief. Keyboard: 40 Tabs at 820 and 390 in light and dark on
24 pages found zero obscured focused controls; no page overflows. The empty `Tyson` account row is the fail-safe
working as designed (UX-04: an unreadable HubSpot identity is a hold, never a cold touch), recorded here so nobody
reads it as a UX-06 defect; the duplicate itself is dedup debt (section 10).

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

### 8.8 UX-04 fresh review (three read-only reviewers on the 820 / 390 / 1440 captures, 2026-10-06)

Reviewers: enterprise AE (five accounts, first two screens at 820), product designer / IA (contract conformance and
hierarchy), accessibility / mobile (the three gates from the UX-03 review plus WCAG 2.2 on the new page).

Task result (AE, first two screens at 820): FedEx, Walmart and PepsiCo answered state, next step, control and who in
10 to 20 seconds; H-E-B stopped on a contradiction (a Troy Shaw record offered as eligible beside a flagged Troy Shaw);
Kroger answered state and control but not who (the deal's contacts are not on the page). Product: clauses 1, 2 and 5
of the 6b contract MET; 3 PARTLY (two bracketed-ticker headlines still showed); 4 PARTLY (no Next account control,
which is UX-09); 6 deferred as declared; 7 and 8 PARTLY (no screen-reader run recorded; fewer than eight accounts
in the table). Accessibility: gates 1 and 2 PASS on the measurements; gate 3 FAIL on one path inferred from code.

| Finding | Reviewer | Severity | Disposition |
|---|---|---|---|
| H-E-B offers Choose for a Troy Shaw record while another Troy Shaw record is set aside as do not contact | AE | BLOCKER | FIXED: a name set aside as do not contact, unsubscribed, opted out or left is never a row under another record of the same person; said in the set-aside line |
| "Walmart (WMT) Delivers..." and "Kroger (KR) Stock Looks..." still show in WHY NOW (bracketed tickers) | product | BLOCKER | FIXED: a case-sensitive ticker-in-brackets rule beside the market-chatter rule, pinned by test |
| Focus after Choose is lost on the import path (the row's key changes from hubspot: to gap:) | a11y | BLOCKER | FIXED: focus follows the imported person's new key |
| The Why button's accessible name ("Why Glen Chaffee?") does not contain its visible text (WCAG 2.5.3) | a11y | BLOCKER | FIXED: "Why this person? Glen Chaffee" |
| "Title: Senior", "Title: Inbound", "Based in Seattle" as reasons; "Same responsibility ... as the row above" read false beside a different job | AE, product | SHOULD | FIXED: rank and filler words never make a reason; the honest line no longer claims the row above is the same |
| Kroger under a deal: heading "4 of 13 eligible for a first touch" over full cards; the deal sentence twice under NEXT; "(no name in HubSpot) (no name on record)" listed three times | AE, product | SHOULD | FIXED: "People on record: in a deal, work it from the deal"; no blocker line under a deal; nameless records counted, never listed |
| FedEx: two lines about one June out-of-office; Glen named four times; "(every gate runs when you send)" | product | SHOULD | FIXED: one inbound line; NEXT names the person once without the title; the gate phrase removed |
| The opt-out said three times on Walmart | product | SHOULD | FIXED: the inbound line says only who and when under an opted-out state |
| The set-aside line before the slot lines; the show-more label repeats the set-aside count | product | SHOULD | FIXED |
| "ELIGIBLE OPERATOR" chip and the static "Choosing records your choice" footnote | product | REMOVE | FIXED: removed |
| The role line is a sentence ("Role current (confirmed): Recent evidence confirms ... verified at linkedin.com, 2026-10-05: ...") | product | SHOULD | FIXED: "Role confirmed Oct 5 (linkedin.com)"; the sentence stays behind Why this person? |
| The phone bar's second control: Log a touch while the page says no cold touch; the primary scrolls away | AE | SHOULD | FIXED: the bar carries the NEXT control when there is one, else Log a touch |
| The phone bar's toolbar role promises arrow-key navigation it does not have; Listen's name change plus pressed state double-signals; the hidden Listen copy leaves an empty live region exposed | a11y | SHOULD | FIXED: role group; no pressed state (the name carries it); the status region hides with its button |
| The Note control opens the shared non-modal dialog (no Escape, no focus return) | a11y | SHOULD | CARRIED: the dialog is the pre-existing feedback form (baseline P3 note-dialog a11y, already in the debt table) |
| The last person touched never appears as a person (Courtney Keen, timothy.cooper, laura.maxwell, troy.retzloff, joey.maggard); FedEx has no ASK; Kroger's deal contacts are absent; interest is buried at 820 | AE | SHOULD | CARRIED to UX-05 (the story's "what has already happened between us and this account" row) and UX-07 (a relationship-history row); the private line stays private by contract |
| H-E-B "$175 new refrigerated facility" marked OK to cite | AE | SHOULD | CARRIED: a stored fact text defect (truth layer), recorded in section 10 |
| The app sidebar takes about 257 px at 820, leaving about 517 px for content | product | SHOULD | OPEN QUESTION for Casey: collapsing the sidebar on account pages below 1100 px is a shell change for every page |
| Compact the stack: a card only for the chosen person, one-line rows for the alternatives, no cards under a hold or deal | product | NICE (the one change for UX-05) | CARRIED into the UX-05 contract |
| "(840) Fedex" tab title (the notification count prefix), "Email: Email sent:", "Role current (likely)" twice on H-E-B | AE | NICE | CARRIED |

Kept as-is on all reviews: one primary control in NEXT, the hold colours, the dropped THE GAP and IMPACT lines, the one
flags disclosure, the tie line, "Wrong if", "OK to cite to the buyer" against "Checked, not for outreach", the 1440
right column, DOM order equal to reading order, the contrast table (emerald 5.4 / 10.2, red 6.4 / 6.9, sky 7.5 / 11.9,
amber 5.1 / 11.5 in light / dark).

### 8.9 UX-05 fresh review (three read-only reviewers on the 820 / 390 / 1440 captures, 2026-10-06)

| Finding | Reviewer | Severity | Disposition |
|---|---|---|---|
| PepsiCo showed two "last" facts that disagreed: the header "Last touch Jun 10 ... laura.maxwell@pepsico.com" (GAP only) and the story "Last email to Santosh Gupta, Aug 17" (GAP plus clawd) | AE, product | BLOCKER | FIXED: when the story's between-us row exists the header says neither the last touch nor the inbound line again; one reader feeds the answer |
| Walmart carried the same $300M Cincinnati project as Unverified under WHAT IS CHANGING and as Checked under THEIR GOAL, the Checked one with a press-release dateline | AE, product | BLOCKER | FIXED: the same project (same money and a shared name) or the same deal (same counterparty) is one sentence with the stronger tag; the dateline is stripped |
| Kroger and Walmart under a hold still drew four bordered cards each repeating "No cold touch right now (see Next)" (five times on Kroger) | product | BLOCKER | FIXED: alternatives are plain rows separated by a rule; the hold is said once in the heading line |
| H-E-B "plans to build a $175 new refrigerated facility" was Checked and OK to cite; the vault note says $700M | AE | BLOCKER | FIXED at the story: a Checked line whose dollar figure does not parse is Unverified, never leads and is never marked citable; the truth-layer fix stays recorded in section 10 |
| Kroger's WHAT IS CHANGING was a staff-uniform story while the Giant Eagle merger sat under THEIR GOAL | AE, product | BLOCKER | FIXED: a program statement (a merger, a multi-year investment) is a change and outranks an incidental headline; THEIR GOAL only in the buyer's words |
| First-person filing quotes ("With Tricolor, we are redesigning our international air network...") read as GAP's claims | AE, product | BLOCKER | FIXED: a source speaking as itself is attributed, "FedEx says: ..." |
| Three identical boilerplate Unknown rows on every account; ASK asked the first one again | AE, product | SHOULD | FIXED: one Unknown line ("Nothing from the buyer yet on how they run the yards today, what it costs them or why it happens."); ASK keeps the question |
| FedEx's first row claimed no silence after the August send because a June automatic reply existed | AE | SHOULD | FIXED: the silence is judged against the last email; an older notice does not answer it |
| Walmart's opt-out named no email it answered | AE | SHOULD | FIXED: "The email it answered is not in GAP's ledgers." when no send to that person precedes the reply |
| Kroger quoted the placeholder subject "GAP first touch" | AE, product | SHOULD | FIXED: "(a GAP first touch)" without quotes |
| Kroger's set-aside line read "4 set aside: and 1 more." | AE | SHOULD | FIXED in the stack: "4 set aside, none with a name on record." |
| The private line sat visually inside the story column | AE, product | SHOULD | FIXED: it sits after ASSET, before the tools |
| The divested-unit caveat was said twice (the set-aside line and a separate list after the stack) and sat between regions | product, a11y | SHOULD | FIXED: one sentence per report, rendered inside the stack directly under the set-aside line |
| FedEx alternatives lost the reachability cue ("Email on record") | product | SHOULD | FIXED: every compact row carries its reachability after its reason |
| The collapsed "Stories that matter" summary lost the native marker (flex) and had no h3, so heading navigation skipped it | a11y, product | SHOULD | FIXED: the summary carries an h3 and a visible "Show" |
| Listen read "...is not verified (unverified)" and "unknown (unknown)" | a11y | SHOULD | FIXED: a sentence that already says it is unverified or unknown gets no tag suffix |
| "Wrong if: If trailers..." doubles the word | product | NICE | FIXED |
| "(current as of 2026-08-25)." and "CINCINNATI -" leaked into sentences | AE, product | NICE | FIXED |
| The yard opportunity and the vault note read in the second person ("the yards you run") | AE | SHOULD | CARRIED (section 10): the hypothesis problem text is authored in the buyer's voice; rewriting it is the hypothesis authoring pass, not the story |
| Reduce the stack to 3 rows to fix the 820 placement miss | product (against) | SHOULD | NOT DONE, by the product reviewer's own measurement (a tenth of a screen); the compact rows were made true rows instead |
| Walmart's RELATIONSHIP line belongs in the between-us row | product | NICE | CARRIED: the relationship route is a UX-04 placement; folding it into the story is a UX-06 question |
| "YOUR NOTE" tagged "OUR READ" mixes voice | product | NICE | CARRIED: the tag vocabulary is fixed (contract 5.4); the basis line says "your vault note" |
| " · " separators are read as "middle dot" at high punctuation levels; uppercase tags may be read as initialisms | a11y | NICE | FIXED the separators (commas); the tag transform stays (text is lowercase in the DOM) |

### 8.10 UX-06 fresh review (three read-only reviewers: AE, trust, product + accessibility, 2026-10-06; a re-check on captures with every disclosure opened)

| Finding | Reviewer | Severity | Disposition |
|---|---|---|---|
| The call captures the reviewers saw answered 500 (the brief's select lacked the hypothesis account name the gate reads) | AE, product | BLOCKER | FIXED and recaptured: Walmart's call page says the opt-out first and offers no opener; FedEx reads "Ready for a first touch"; General Mills reads "Research: the angle needs your review" |
| FedEx's anchor is an air-network thesis for a FedEx Ground transportation MD; the block admitted the mismatch while NEXT said "Prepare the email to Glen" with no caution; Lisa Lisson (air network) was on the page | AE | BLOCKER | FIXED: the caution travels to NEXT and names the eligible person the fact fits; the block says it in one sentence |
| The anchor's sentence repeated verbatim in WHAT IS CHANGING (three Tricolor blocks on one page) | AE, product | BLOCKER | FIXED: the story is told once; the anchor's own fact becomes "The opening story, above." |
| "Why Glen over Jeffrey? GAP cannot separate these two" sat under "Chosen by you, Oct 5" and read as empty; a seller's choice of the resolver's #2 was reported as a tie | AE, trust | BLOCKER | FIXED: `leadOver` reports the leader's side; the card reads "You chose Glen (you, Oct 5). On evidence GAP ranks Jeffrey ahead: ..." (or cannot separate, or also leads) |
| General Mills: doubly parenthesised, garbled refusal text, and "Draft + review" offered on the exact fact just marked not usable | AE, product | BLOCKER | FIXED: one plain sentence; a fact any live thesis is grounded on is never offered as a draft |
| The pack and the block could disagree on the thesis (the loader opened on a recorded choice without the gate; the fallback ignored status and sendability) | trust | SHOULD | FIXED: the pack opens only on the usable set the block shows; an unread gate opens nothing |
| The supporting fact skipped the gate's rules (ended continuity, physical-network) and hardcoded citable | trust | SHOULD | FIXED: live, not ended, physical-network, sensitivity and number checks |
| The title-shaped rule's second branch made the first dead and refused honest Title Case sentences with an unlisted verb | trust | SHOULD | FIXED: Title Case with no ordinary verb is a headline; more verbs listed; a headline with a listed verb is the reviewer's call (said so in the caption) |
| PepsiCo offered the same Gatik deal as three draftable stories | AE | SHOULD | FIXED: one entry per counterparty |
| H-E-B rendered "$175 new refrigerated facility" | AE | SHOULD | FIXED: "[figure unverified]" |
| General Mills' tie line named a hidden person while a visible one was tied | AE | SHOULD | FIXED: the people on screen first |
| "chosen by the top grounded thesis" read as circular | AE, product | SHOULD | FIXED: "basis: the highest-ranked usable thesis" / "it lands on their remit" / "your choice" |
| Nested parentheses in the refusal text; the disclosure count misread as the item total; "Review + use" overpromised; "Outreach anchor" is internal vocabulary; 390 draftable rows squeezed the text; Show never became Hide | product | SHOULD | FIXED: one plain sentence; "Best proof, supporting fact and the do-not-use list (N)"; "Submit for review"; "Opening story for Glen"; rows stack below sm; Show / Hide |
| Focus lost after Use this story and Submit for review; the textarea helper sat inside the label; KEYWORD HIT kept the green border | a11y | SHOULD | FIXED: focus moves to the status line; labels with aria-describedby; amber border |
| The call-prep race timer was never cleared | trust | NICE | FIXED |
| The draft list open by default on research accounts pushed the people a screen down | AE | SHOULD | FIXED: closed by default, the summary says what it holds |
| PepsiCo's division warning ignores "PBNA Transportation" on the page | AE | SHOULD | CARRIED (section 10): the division read is the brief's (UX-04 surface), not the anchor's |
| "Story" reads as a press item; suggested "Draft a thesis from this fact (goes to review)" | AE | NICE | FIXED: "Draft a thesis from this fact" with "(it goes to review)" in the line above |
| Re-check (seller): Walmart's call page said the hold first but still offered a suggested question and the outcome row; General Mills' call page presented the thesis the account page said the send gate would refuse; FedEx's call page dropped the remit caution NEXT carries | AE | BLOCKER | FIXED: the pursuit read carries the usable set and the caution; under a hold, an unusable thesis, or an unread state the brief withholds every opener element (fact, thesis, questions, after-acknowledgement); the outcome recorder and the history stay; the caution renders above the opener, never under a hold |
| Re-check (seller): the Memphis/Indianapolis hub fact read three times (supporting fact, a different story, stories that matter); PepsiCo's Maryland layoffs listed twice in do-not-use; "$1202M a year"; "Would prove wrong" twice on the call page | AE | SHOULD | FIXED: the supporting fact prefers a fact no other usable thesis is grounded on and an alternative on the same fact says so; the story points at the supporting fact once; one do-not-use line per fact with every reason; $1.2B; "Would prove wrong" once, inside the HYPOTHESIS block |
| Re-check (seller): the call page tags FedEx "3PL / Logistics" while the account page says carrier; "Caf Tr s Cora es S.A" on both surfaces | AE | SHOULD | CARRIED (section 10): the call brief's vertical is the accounts table's old column (UX-04 header surface); the accents were dropped at ingest (the stored evidence text already reads "Caf Tr s", a research-extractor defect, not a render one) |
| Re-check (product + a11y): every original item fixed; NICE: the "Not usable" line repeated the refusal; the "Conversation" button clips at 820 under the floating buttons; no visible focus ring on the status line | product | NICE | FIXED: "The reason above."; a focus-visible ring on the status line; the clipped button is carried (section 10, pre-existing call-page layout) |
| A client without the pursuit method renders the brief as before (fail-open for mocked clients only) | trust | NICE | LEAVE: the default client always has it; recorded |

### 8.11 UX-07 review (one fresh read-only seller + product reviewer, 2026-10-06; one focused re-check)

| Finding | Severity | Disposition |
|---|---|---|
| Undo after Left the company / Wrong role posted `status: current`, a permanent human correction that stands over later evidence and that a role check never overwrites: a loosening in the seller's name | BLOCKER | FIXED (ef569173): no Undo on the two corrections; they sit under "Correct their record" with the consequence said; the read-back says to reverse with a new correction; pinned (no POST ever carries `status: current`) |
| Make next was offered on any eligible contact while the motion lines up a next only from its waiting ready cards: a recorded wish the motion ignores ("is next" untrue) | BLOCKER | FIXED (ef569173): offered only where the motion can honour it (`canBeNext` from the motion's waiting cards); the button and the read-back say "next if Glen is silent" |
| A parked person could still be the motion's next (and promoted after 5 business days by the cockpit and the Work list) | SHOULD | FIXED (ef569173): the cockpit reads the seller preferences for every account and the motion ranks without parked people; the stack never tags a parked person next |
| Re-check: the parked filter also dropped parked cards from the held ids, so a set-aside person's card read READY in the lane (the opposite of the decision) | BLOCKER | FIXED (the commit after ef569173): ranked without the parked cards, held ids keep them; a parked card is HELD in ready, in motion, paused and all-parked states (pinned) |
| "a set-aside never loosens a safety rule" is internal language; the row carried two employment sets; the read-back said next twice; the Show-more label said "ranked lower on evidence" over a parked person; Not now showed a day off outside Eastern time | NICE | FIXED: plain words; one disclosure for the record corrections; said once; the label counts only the set-aside when nothing else is hidden; noon UTC on the chosen day |
| Preference Undo also clears an older preference; the chosen person's own live preference never renders | NICE | LEAVE: append-only and recorded; the controls are hidden on the chosen person |

### 8.12 Train A review (one fresh read-only seller + product reviewer, 2026-10-06)

| Finding | Severity | Disposition |
|---|---|---|
| The best-ranked card per account erased the account's reply: Walmart headed Work as "Decide the angle, 1 person ready for outreach" with no word of yesterday's "stop"; the blocker line was a no-op | BLOCKER | FIXED: a reply (human, opt-out) IS the account's card whatever the lanes hold; the opt-out carries "no cold work here until it is recorded"; pinned with Walmart's competing review candidate |
| Under a fresh pursuit summary the card kept the lane's why and action: FedEx "Ready for a first touch: Glen Chaffee. 3 cards missing evidence [Research FedEx]"; The Home Depot "Choose who hears this first [Research]"; Kraft Heinz "In a deal. Use or ignore." | BLOCKER | FIXED: the summary carries NEXT (`nextText`) and the card takes its why from it and its action from the state (the workspace carries the control: Prepare the first touch, Choose who hears this first, Open the research plan, the deal brief, the reply lane); a held read gets no action |
| The six lane tiles sat above the chips on Work with contradicting counts | SHOULD | FIXED: the tiles show only inside a lane; the chips are Work's counts |
| The Work order saved the full list, not the shown one, so after a chip "Account 1 of 27" walked into research; Back to Work focused by index after the list moved | SHOULD | FIXED: the shown list is the order (its hrefs count from zero); Back to Work focuses by account (slug); the account is the key and the index only a hint |
| The Work tab was never marked current (`trailingSlash: true` gives `/gap/`) | SHOULD | FIXED: a trailing slash is the same path; pinned |
| Every blue card button went to an unfiltered old lane | SHOULD | FIXED for pursuit-sourced cards (the workspace with the order); a cockpit-sourced card still names its lane until the warmer reads it (the lane is where that work runs) |
| A pursuit hold that is not a deal (family hold, HubSpot timeout) read "Open the deal brief" under the In a deal chip | SHOULD | FIXED: a held read is "Held" with its blocker and no action; the chip reads "Held or in a deal" |
| 390: the Work search shrank to "Search a" in the chip row; the Accounts search box was 88 px wide | SHOULD | FIXED: both searches take their own row below sm |
| The Accounts index listed E2E fixtures as Tier 1 and bare domains (aol.com) as accounts; Enter in an empty box opened Dannon (frozen) | NICE | FIXED: fixtures and bare-domain rows are out; Enter opens the first match of a typed query only |
| FedEx NEXT printed its family-hold paragraph twice | NICE | FIXED: a held account's blocker is NEXT already, never repeated |
| The head of the list moved across loads as the warmer rewrote states (cockpit lanes then the canonical read) | NICE | LEAVE, said in 6i.6: the canonical read wins as it arrives (at most two accounts a minute); the frozen order keeps Done/Next stable for the seller |
| 390: the Note pill and the mail button sit over card buttons | NICE | CARRIED to UX-14 (fixed-element collisions) |

## 9. Validation record

| Ticket | Validation | Result |
|---|---|---|
| UX-01 | GAP unit suite baseline at 54c11c57 (`vitest run tests/unit/gap`) | 318 files, 4,983 tests, 0 failures, 128 s |
| UX-01 | production captures: 18 pages at 1440, 6 pages at 390 and 768 in light and dark, 4 drawers, 4 click paths; no write action triggered | metrics in the scratch packet; summarized in sections 3 and 7 |
| UX-01 / UX-02 | safety during the audit | emails sent 0; enrollments 0; Apollo credits 0; HubSpot writes 0 (one read: the Kroger deal); suppression clears 0 |
| UX-02 | this document: em dashes | 0 |
| UX-02 | five independent reviewers, read-only, stopped after their reports | all five chose Direction A |
| UX-03 | GAP folder suite on the merged state (`vitest run tests/unit/gap`) | 326 files, 5,048 tests, 0 failures (65 new across 8 files) |
| UX-03 | `tsc --noEmit`; eslint on the changed files | 0 errors; 0 problems |
| UX-03 | production build | Vercel preview READY on the branch tip 19902f18 (the same build pipeline as production); local builds green except one EPERM when a local server still held Prisma's engine (operator error, re-run clean) |
| UX-03 | local preview (production database, read-only, DPR 1): 8 golden accounts at 1440, FedEx / Walmart / PepsiCo at 820 and 390 light and dark, the Walmart drawer | no horizontal overflow anywhere; 4 rows by default; states as in section 7.1; captures in the scratch packet |
| UX-03 | four fresh read-only reviewers on the preview (AE, product / IA, HAI, accessibility) | every BLOCKER fixed before merge (section 8.7); carried items in section 10 |
| UX-03 | safety during build and review | emails sent 0; enrollments 0; Apollo credits 0; HubSpot writes 0; suppression clears 0; no Choose clicked against production |
| UX-03 | merge | PR #401, merge commit 132958e7 on main (2026-10-06) |
| UX-03 | production | Vercel deployment dpl_HuoDYqdgUFbipivj4d5UxtsBwUKf READY on 132958e7 (2026-10-06 01:05 local) |
| UX-04 | GAP folder suite on the final state | 329 files, 5,069 tests, 0 failures; `tsc --noEmit` clean; eslint clean on the changed files |
| UX-04 | production build | Vercel preview READY on the branch tip (330bb1a0, the same pipeline as production); the local build for the final captures was stopped twice by the harness under memory pressure, so the final visual receipt is the production smoke below plus the DPR-1 measurements in 7.2 taken on 7065fc24 |
| UX-04 | three fresh read-only reviewers on the captures (AE, product / IA, accessibility) | every BLOCKER fixed before merge (section 8.8) |
| UX-04 | merge | PR #402, merge commit 5c321ac6 on main (2026-10-06) |
| UX-04 | production | Vercel deployment dpl_CbeT3Z9VJQATVFdToXKQut2H4EcS READY on 5c321ac6 (2026-10-06 02:25 local) |
| UX-04 | production smoke at 820 CSS px (read-only, the rig's live session, nothing clicked) | FedEx [ready] "Ready for a first touch: Glen Chaffee", 4 rows, 2 slot lines, decision ends 1,075 px (1.19 screens), 15.6 s; Walmart [opted_out], no Choose, 985 px (1.09), 11.2 s; PepsiCo and H-E-B [research] "a verified fact, no angle grounded on it yet", tie named, 1,158 / 1,058 px, 11.8 / 7.4 s; Kroger [in_deal] no Choose, 954 px, 6.4 s; NFI [choose_person] "133 eligible", 1,018 px, 10.0 s; General Mills [research] "the angle needs your review", 1,030 px, 7.1 s; Tyson [ready] "Relationship-led: Ryan Heman", 1,085 px, 9.1 s; pages 2.1 to 2.8 screens; no horizontal overflow; no ordinals on any tie; no render errors |
| UX-04 | production smoke at 390 | FedEx decision ends 1,156 px (1.37 screens), 3.3 screens; Walmart 1,198 px (1.42), 3.6 screens; no overflow |
| UX-05 | GAP folder suite on the final state (8173e19e) | 332 files, 5,101 tests, 0 failures (35 new: `story-projection`, `story-readers`, `account-story-view`); full unit suite 657 files, 7,371 tests, 0 failures on the first slice; `tsc --noEmit` clean; eslint clean on the changed files |
| UX-05 | production build | five local `npm run build` runs green (c55a2125 through 8173e19e); Vercel previews READY on 52066d84 (dpl_7P8Aw9WW3BLJqVq348Z3YYR5uwJB), 8173e19e and e1095a29 (the same pipeline as production) |
| UX-05 | local preview (production database, read-only, DPR 1): 8 golden accounts at 820; FedEx / Walmart / PepsiCo / Kroger / H-E-B at 820 and 390 light and dark; FedEx / PepsiCo / Walmart at 1440 light and dark, before and after the review batch | measurements in 7.3; every sentence tagged; no private leak; no overflow; zero obscured focus |
| UX-05 | three fresh read-only reviewers on the captures (AE, product / IA, accessibility) | six BLOCKERs and eleven SHOULDs fixed before the PR (section 8.9); carried items in section 10 |
| UX-05 | live clawd readers (read-only GETs with the token from the local env; nothing written) | outreach history answered for fedex.com (4 sends), walmart.com (8), pepsico.com (26); the intel snapshot carried the vault wedge for FedEx (2026-07-10) |
| UX-05 | safety during build and review | emails sent 0; enrollments 0; Apollo credits 0; HubSpot writes 0; suppression clears 0; no Choose clicked against production |
| UX-05 | merge | PR #403, merge commit 5b1d2f26 on main (2026-10-06); the branch tip's previews dpl_GKzrgQqVx6ZcoziAudCUSf4wegQC (8173e19e) and dpl_GRCtpAfp59ZBzMC1Dt3osGHRP1vh (e1095a29) READY before the merge |
| UX-05 | production | Vercel deployment dpl_5BeQk1FAdLqAHsaoj3iC6Mf2SbEJ READY on 5b1d2f26 (2026-10-06 04:15 local) |
| UX-05 | production smoke at 820 CSS px (read-only, the rig's live session, nothing clicked) | all eight golden accounts 200, no render error, no private leak, no overflow, every story sentence tagged; the header carries no last-touch or inbound line on any account (the story's between-us row has them); FedEx [ready] story between us / changing / yard / learn / stories / note, "Last email to Michael Jeannotte, Chief Operating Officer, Aug 7 ... No answer on record" (clawd ledger), one card and three plain rows, first three rows end 2,081 px (2.31 screens), 15.0 s; Walmart [opted_out] "Timothy Cooper opted out on Oct 5 ("stop"). The email it answered is not in GAP's ledgers.", no card, the hold said once, 1,751 px (1.95), 10.6 s; PepsiCo [research] "Last email to Santosh Gupta ... Aug 17. No answer on record." (clawd), 1,768 px (1.96), 10.1 s; H-E-B [research] 1,510 px (1.68), 10.0 s; Kroger [in_deal] "(a GAP first touch)", the hold said once, 1,544 px (1.72), 8.9 s; NFI [choose_person] "No touch on record between us", 1,343 px (1.49), 7.2 s; General Mills [research] 1,672 px (1.86), 7.7 s; Tyson [ready, relationship-led] 1,537 px (1.71), 6.6 s; pages 2.0 to 3.0 screens |
| UX-05 | production smoke at 390 | FedEx first three rows end 2,366 px (2.80 screens), 3.7 screens; Walmart 2,164 px (2.56), 3.2 screens; no overflow |
| UX-06 | GAP folder suite | 335 files, 5,128 tests, 0 failures at da421115 (50 new: `outreach-anchor`, `ux06-views`, `copy-bytes`); `tsc --noEmit` clean; eslint clean on the changed files (the call brief's 10 pre-existing `any` errors excepted) |
| UX-06 | production build | eight local `npm run build` runs green (one refused the client bundle for a node:fs reach, fixed in e3dba3e5); Vercel previews READY on a56c2a5f, a4bba645, cb2e6d77, ce684402, fbf55665 and the later tips recorded at merge |
| UX-06 | three fresh read-only reviewers on the captures (AE, trust, product + accessibility), then a re-check on captures with every disclosure opened | five BLOCKERs and twelve SHOULDs fixed before the PR (section 8.10); carried items in section 10 |
| UX-06 | dogfood (local preview, production database, read-only; nothing clicked that writes) | eight accounts at 820, the six dogfood accounts at 820 and 390 light and dark, PepsiCo and FedEx at 1440, three call pages; measurements in 7.4 |
| UX-06 | live clawd readers | unchanged from UX-05 |
| UX-06 | safety during build and review | emails sent 0; enrollments 0; Apollo credits 0; HubSpot writes 0; suppression clears 0; no Choose, Use this story or Draft clicked against production; the two first-party entity facts were offered to the research contract (two context signals created, both refused as non-physical-network facts, nothing quotable) |
| UX-03 | production smoke (read-only, the rig's live session, nothing clicked) | FedEx "Ready for a first touch: Glen Chaffee" [ready], 4 rows, 2 slots, Prepare email present, 15.0 s; Walmart "Opted out: timothy.cooper@walmart.com, Oct 5" [opted_out], 4 rows, no Choose, 11.2 s; PepsiCo and H-E-B "Research: a verified fact, no angle grounded on it yet" [research], tie named, 10.5 s / 9.5 s; Kroger "In a deal: YardFlow - Kroger (Discovery)" [in_deal], no Choose, 9.1 s; NFI "Choose who hears this first (133 eligible)" [choose_person], 8.7 s; General Mills "Research: the angle needs your review before it is used", 9.6 s; Tyson "Relationship-led: Ryan Heman", 6.9 s; no horizontal overflow, no ordinals on any tie, no render errors |

Screenshots: the scratch packet (not committed) holds `desk2/`, `mobile2/`, `drawer2/`, `path-*/`; the `drawer2`
set is full-frame and valid, the `desk2` and `mobile2` PNGs are zoom-magnified crops (N15) and must be re-shot at
DPR 1 before UX-15 compares against this baseline. The text dumps and JS metrics from every capture are valid.

| UX-06 | merge | PR #404 merged 2026-10-06 as 8ff5623c (tip c7d4fae1 after the seller re-check batch; preview READY dpl_BC6ixTF7bkoFEGHKmMcLzQbBvrbv) | production READY dpl_Cdsc6n2ybZUTUaiyNBM3bQw7hDqZ on 8ff5623c |
| UX-06 | production smoke (rig Chrome, Casey's live session, read-only, 820) | FedEx account: NEXT carries the remit caution naming Lisa Lisson; the opening story is the active Network 2.0 thesis; two draftable facts. Walmart call 2235: the opt-out said first, no opener, no questions, the recorder stays. General Mills call 7: "Research: the angle needs your review" and "No opener until the thesis is usable". FedEx call 2234: the caution above the FACT block, questions shown | 4 of 4 pages agree with the send gate and NEXT; no overflow |

| UX-07 | production smoke (rig Chrome, read-only, 820) | FedEx: the eligible row carries "Set aside or correct" and the Next-if-silent control where the motion can honour it; Walmart (opted out): no control | 3b3a063f in production |

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
| New (UX-04 review): a stored fact reads "H-E-B plans to build a $175 new refrigerated facility" and is marked OK to cite | FIX NOW (truth layer): a quote with a broken number must not be outreach evidence; re-verify at the source | the claim re-gate (`claim-rules.ts`) should refuse a currency amount with no magnitude |
| New (UX-04 review): the app sidebar takes about 257 px at 820, leaving about 517 px for the account page | OPEN QUESTION for Casey: collapse the sidebar on account pages below 1100 px (a shell change for every page) | |
| New (UX-04 review): the Note control opens the shared non-modal feedback dialog with no Escape and no focus return | FIX AS PART OF UX (UX-14), the baseline P3 note-dialog item | |
| New (UX-04 review): the tab title carries the notification count ("(840) Fedex"); "Email: Email sent:" in the last-touch line; "Role current (likely)" twice on H-E-B | NICE, carried to UX-14 | |
| New (UX-05 review): the yard opportunity and the vault note read in the second person ("the gates, yards and docks you run") on a page the seller reads | FIX AS PART OF UX (hypothesis authoring pass): the problem text is authored in the buyer's voice | the story shows the angle as approved; rewriting voice there would be a second authority |
| New (UX-05 review): the relationship route ("Chris Anderson: Inland26 contact") is a UX-04 block between the stack and the story | OPEN (UX-06): fold it into WHAT HAS HAPPENED BETWEEN US when the outreach anchor lands | |
| New (UX-05 review): FedEx's between-us row holds three sentences and two long filing quotes, so its first three story rows end at 2.3 screens at 820 | LEAVE INTENTIONALLY for now: seven of eight accounts meet the placement; the lever is the stack's default row count (UX-03 contract allows 3) | Casey's call, not the slice's |
| New (UX-06 dogfood): `Tyson` is an empty duplicate of `Tyson Foods` in `accounts` (no personas, no HubSpot id, a self-referential canonical link); it renders as a permanent identity hold | DEDUP DEBT (revops canonical engine), not a GAP UX item | |
| New (UX-10): the app-wide Ctrl+K palette reads `lib/data/accounts.json` and routes to `/accounts/<slug>`, not the GAP workspace | FIX AS PART OF UX (after the integration gate): a GAP accounts group in the palette over the same index read | |
| New (UX-06 re-check): the call brief's account header reads `accounts.vertical` ("3PL / Logistics" for FedEx) while NOW says carrier (the GAP account kind) | FIX AS PART OF UX (the brief header, UX-04 surface): read the account kind, drop the old column | |
| New (UX-06 re-check): the research extractor drops accented letters from SEC filings at ingest (General Mills' buyer stored as "Caf Tr s Cora es S.A.", two evidence rows) | RESEARCH DEBT: fix the HTML entity decode in the extractor, then re-verify the two rows; never patch the text by hand | |
| New (UX-06 re-check): the call page's fourth disposition button clips under the floating Note and mail buttons at 820 | FIX AS PART OF UX-09 (the Done/Next loop touches the recorder) | |
| New (UX-06 review): PepsiCo's header asks which division owns the yard decision while the chosen person's title says PBNA Transportation | FIX AS PART OF UX (the brief's division read, UX-04 surface): read the chosen person's division before asking | |
| New (UX-06): `replies/brief.ts` carries 10 pre-existing `@typescript-eslint/no-explicit-any` errors (house glue over the getHypothesis row) | LEAVE INTENTIONALLY | outside the slice; the file is typed by its contract tests |
| New (UX-06): the anchor's DRAFT + REVIEW proposes with `problemFamily: 'unmapped'` and a generic hedged guess; the reviewer sets the family and sharpens the guess in REVIEW | LEAVE INTENTIONALLY (by design: the draft is a prefilled start, the review is the authority) | |
| New (UX-06): the research contract refuses a first-party corporate-transaction release as a non-physical-network fact, so provenance for an entity boundary lives in the reviewed constant, not in a quotable fact row | LEAVE INTENTIONALLY | the rule is right for outreach; the constant carries the source |
| New (UX-05): the reply classifier reads "Please stop emailing me" as a human reply (the opt-out rule wants the whole message to be the refusal, or "do not email me" / "remove me from" / "unsubscribe me") | FIX AS PART OF UX (the next reply pass): a human reply still holds the account, so it fails safe; the state line just says "Someone replied" instead of "Opted out" | the UX-03 classifier contract was left alone in UX-05 |
| New (UX-05): the brief builder sets an angle's inference to its problem, so NETWORK IMPLICATION never differs from YARD OPPORTUNITY on live data | LEAVE INTENTIONALLY (the story shows the row only when it adds a sentence) | a distinct inference belongs to the hypothesis authoring pass, not the story |
| New (UX-05): FedEx's company row carries no domain, so clawd is asked by the domain the account's own addresses share | FIX AS PART OF UX (account record hygiene): set the domain on the record | the fallback is tested and honest |
| New (UX-05): the resolver's FedEx Supply Chain divestiture rule is hard-coded with a date (2026-10-01) while GAP's own facts hold only an unverified report of the sale, so the story says the set-aside rests on an unverified report | OPEN QUESTION for Casey: verify the sale at its source and store the fact, or keep the rule and the caveat | truth layer |
