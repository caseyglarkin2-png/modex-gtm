# GAP OS Phase 2: Seller OS (status ledger)

STATUS: SHIPPED 2026-09-28 (Releases A-G and the final review fixes merged and production-verified)

<!-- verified:2026-09-28 -->

Objective: maximize verified buyer truth per minute of Casey's time. Machines
find, fetch, verify, remember, route, stop and organize. Casey decides what we
believe, who hears it, what the buyer said, and what we learn next.

Baseline: `origin/main` 3fde96a9 (last-mile hardening, PR #277). The safety
architecture (evidence gate, human approval, human BID confirmation, send
gates, suppression, opportunity protection, stale-card protection,
HUMAN_APPROVED_1TO1, auto-send OFF, auto-enroll OFF) is authoritative and is
not reopened here.

One implementation owner per release; read-only reviewers only. One PR per
release, merged and production-verified before the next starts.

## Release ledger

| Release | Scope | Branch | PR | Merge | Production |
|---|---|---|---|---|---|
| A | Truth infrastructure + health | feat/gap-phase2-a-truth-health | #278 | 6df1938f | READY, health endpoint HEALTHY in prod |
| B | Verified evidence inbox | feat/gap-phase2-b-evidence-inbox | #279 | 6d34cd6a | READY; one prod background run, protected diff identical |
| C | Account motion v0 | feat/gap-phase2-c-account-motion | #280 | ded3ac0b | READY; cockpit NEXT UP v2 verified in prod |
| D | Mobile buyer truth capture v0 | feat/gap-phase2-d-buyer-truth | #281 | c15aa366 | READY; /gap/capture checked at phone width |
| E | Seller action pack v2 | feat/gap-phase2-e-action-pack | #282 | 455be384 | READY; brief on a prod PepsiCo card at phone width, no horizontal scroll, KNOW refuses the 10-Q keyword hit |
| F | In Deals + Deal Brief v0 | feat/gap-phase2-f-in-deals | #283 | b55b7b2b | READY; prod In Deals lists Kroger ("YardFlow - Kroger", Appointment scheduled); its brief shows 6 UNKNOWN + 4 deal contacts, no horizontal scroll |
| G | Integrated seller-OS acceptance | feat/gap-phase2-g-acceptance | #284 | 14d1f565 | READY; scratch acceptance only (no product code) |
| Final | Final expert review fixes (verified P1s) | fix/gap-phase2-final-review | #285 | e20da6a6 | READY; prod health HEALTHY (5/5), /gap, In Deals (Kroger) and /gap/capture at 390px with no horizontal scroll |

## Release A: truth infrastructure + health

### A1. Hand-added public facts use the one verification contract
- `research/run.ts` now exposes the contract research always used:
  `verifyCandidate` (dated, physical-network change, excerpt verbatim at its own
  URL, non-EDGAR page names the account) and `storeVerifiedFact` (EvidenceRecord
  + evidence_record signal with `metadata.verified = excerpt_found_at_source`).
  Research itself calls the same two functions (behavior unchanged).
- `research/manual-fact.ts verifyPublicFact`: a public URL + sentence + date
  typed by Casey runs `verifyCandidate`. Pass: stored by `storeVerifiedFact`
  (may satisfy the evidence gate). Fail: the old `manual` context signal (the
  gate always refuses it) plus the reason. Every attempt writes a ResearchRun
  (`purpose gap_manual_fact`) and a `research.manual_fact` audit row.
- `POST /api/gap/signals` public: account checked first, then verification. A
  missing date is NOT today (only an explicit publication date can be verified).
  Response `{id, created, verified, reason}`. The body cannot carry metadata or a
  source kind (zod strips unknown keys), so no route can mint the stamp.
- Add Fact form: no "Quotable" promise; "Exact sentence" + "Published on" (never
  defaulted); the notice says verified or exactly why not.
- Operator knowledge is unchanged: first-party, never quotable.

### A2. Send-time attribution + read-only deal observation
- `execution/send-attribution.ts captureSendAttribution`: stamped INTO every
  Gmail-proven send ledger row (DIRECT_SENT, DRAFTED, DRAFT_SENT, MANUAL_SENT,
  unknown-send reconcile): primary outreach fact id, signal type / source kind /
  source type, opener approach (`verified_fact_observation` for step 0,
  `follow_up:<purpose>` after), persona title / seniority / role in deal /
  persona key, account name / tier / HubSpot company / canonical company (only
  a `resolved` link), problem family. Version and evidence tier were already
  on the rows. Never throws, never blocks a send; failures and all older rows
  read `unrecorded` (`sendAttributionOf`). No backfill. Learning UI unchanged.
- `learning/deal-observation.ts`: read only. First Gmail-proven GAP send per
  account, then HubSpot deals (createdate) on the SAME company identity the
  opportunity resolver uses (`resolveCompanyIdentity`, extracted, behavior
  unchanged). 60 / 120 day windows reported open until elapsed; unreadable is
  `unknown`, never "no deal"; deals created before the first touch are context.
  Script: `scripts/gap/deal-observation.ts`. No HubSpot writes, no causality.

### A3. Health strip
- `health/health.ts evaluateHealth` (pure) over five dependencies: mailbox
  intake (cron `gap-mailbox` state), HubSpot reads (bounded ping), suppression
  authority (bounded contract read of a reserved probe address), GAP sender
  config, last completed routing run. Overall = worst; never green because
  another dependency works. `GET /api/gap/health` (session, no-store) and
  `<HealthStrip>` at the top of /gap, loaded after the page, details under a
  disclosure, "could not be checked" when it cannot load.
- Thresholds: mailbox healthy <=30m, degraded <=3h, blocked after; HubSpot
  degraded >5s, blocked on error; routing degraded >24h (click-time gates keep
  stale cards safe, so old routing is never "blocked").

### A4. Identity status audit
- Opportunity identity deliberately reads EVERY canonical link status
  (PepsiCo and Dannon are `conflict` in production): a conflicting domain can
  only add companies to the open-deal check. Identity resolution and send
  attribution use only `resolved`. Kept the union, documented it in
  `loadOpportunityIdentity`, pinned it (tests/unit/gap/identity-status.test.ts).
  No identity layer.

### Release A validation
- Mutations proven RED then restored: unverified manual fact stored as
  verified; verifier skips the verbatim check; attribution dropped from a
  direct send; health overall ignores a blocked dependency; opportunity
  identity filtered to resolved links.

### Release A production verification (2026-09-28)
- Merge 6df1938f served by modex-gtm.vercel.app (dpl_3iPA3h6HBP5v2FNUrQRSS31SLGiV).
- `GET /api/gap/health` through the signed-in rig: HEALTHY (mailbox 8m, HubSpot
  725ms, suppression 4.9s, sender casey@yardflow.ai, routing 40m).
- `scripts/gap/deal-observation.ts` read only against production: Kroger first
  GAP touch 2026-09-25; 60/120 day windows open; its one deal existed before
  the first touch (context, not attributed).

## Release B: verified evidence inbox

### B1. Background evidence research
- `research/background.ts runBackgroundResearch`: the SAME `runEvidenceResearch`
  RESEARCH THIS uses, for the top targets by a deterministic order (no score):
  research work blocking the most people (research theses + evidence research
  cards), then fresh Pounce triggers mapped to a real modex account (vendor
  noise has no account and is never researched), then approved / in-use
  outreach facts expiring within 21 days; ties by account tier, oldest work,
  name. A trigger headline is passed as web search focus; candidates are still
  verified at their own source.
- Bounded: cap 3 per run (max 10, `?cap=`), 200s time budget. Idempotent: an
  account researched in the last 3 days is skipped unless a newer trigger
  arrived. Retry-safe: failures are recorded, the next account runs.
  Observable: cron state + `research.background_run` audit row.
- Writes only ResearchRun / EvidenceRecord / ProspectingSignal / audit.
  Never creates, submits, approves, activates or links a hypothesis; never
  routes, drafts, enrolls or sends. Proven by a write-recording unit test and
  by the scratch E2E table diff (G1).
- Cron `/api/cron/gap-background-research` daily 10:40 UTC (6:40 ET), behind
  `GAP_OS_ENABLED` + new flag `GAP_BACKGROUND_RESEARCH_ENABLED` (default off).

### B2. Verified Evidence Inbox (top of the RESEARCH lane)
- `research/inbox.ts loadEvidenceInbox`, grouped by account: ready facts
  (verified, live, passing the outreach gate, not on a thesis, not ignored)
  with exact quote, source, publication date, why it qualifies and days left;
  contradictions (same named site moving both ways) shown, never filtered;
  rejected sources with reasons; the last research run's outcome, so "nothing
  verifiable" is an explicit answer.
- USE = the existing audited `use_evidence` op (editable row: observation
  rebuilt from this ONE primary fact; frozen approved row: a new draft
  revision). Never approves. No thesis at the account: "Draft a thesis from
  this fact" (the existing propose route; a DRAFT). IGNORE =
  `POST /api/gap/evidence/ignore`, one append-only `evidence.ignored` row;
  research history kept. OPEN SOURCE = the URL.

### B3. Research priority
- Covered by `compareTargets` (pinned by test): research work > fresh
  trigger > expiring evidence; then people unblocked, trigger freshness,
  soonest expiry, tier, oldest work, name.

### Release B review fixes (verified P1s, fixed before merge)
- A contradicted fact was also listed as "ready" with a working USE. Now both
  sides show only under the contradiction ("Ignore this side" / Open source);
  ignoring one side makes the other ready.
- "Draft a thesis from this fact" sent no fact, so propose used whichever fact
  the run listed first (and a later run re-finding facts moved the records,
  giving `no_fresh_evidence`). `proposeFromResearch` now takes `signalIds`
  (same account, same outreach gate, the chosen fact first) and the inbox sends
  the clicked fact.
- Background start budget lowered to 120s so one slow account cannot push a
  run past the 300s function limit (non-blocking reviewer note).

### Release B validation
- Mutations proven RED then restored: background links evidence to a
  hypothesis; cooldown ignored; cap not enforced; vendor noise researched;
  ignored candidates resurface; contradictions filtered.
- Review-fix mutations RED then restored: contradicted facts ready again; propose ignores the chosen fact; client sends no fact.
- `scripts/gap/e2e-phase2.ts` G1 on scratch Postgres: research work (3 people)
  outranked the trigger; 11 protected counts identical before/after; all
  hypotheses still draft; inbox shows the verified fact with USE on the thesis.

### Release B production verification (2026-09-28)
- Merge 6d34cd6a served (dpl_45AmtXp9Yti1U97fjCo4XSUz9z9h).
  `GAP_BACKGROUND_RESEARCH_ENABLED=true` set in Vercel production (plain,
  production only) so the 10:40 UTC cron runs.
- One background run against production (the shipped code, cap 3): targets in
  order PepsiCo (research work, 5 people), General Mills (2), UNFI (research
  work + the "Consolidates Midwest Distribution" trigger), Kroger. PepsiCo,
  General Mills and Kroger were skipped by the 3-day cooldown (researched
  2026-09-25; PepsiCo is eligible on the next scheduled run). UNFI: 1 verified
  fact, 3 rejected sources with reasons. Protected-table diff (hypotheses,
  events, links, routing, enrollments, email logs, draft queue, execution
  ledger, BIDs, dispositions, status counts): identical.
- Inbox in production: General Mills 4 ready, Kroger 1, UNFI 1 (3 rejected),
  PepsiCo 0 ready with 4 rejected sources (explicit answer).

## Release C: account motion v0

### C1. PersonaAngle (human-owned "why this person")
- `motion/persona-angle.ts`: one line per person, stored as append-only
  `persona.angle` audit rows (newest wins; keyed on the person, so it survives
  hypothesis revision). `suggestAngle` drafts from the title only (labelled
  "Suggested why", never authoritative, nothing inferred beyond the role, no
  LinkedIn); Casey accepts (source `accepted_suggestion`) or writes/edits it
  (source `human`). `POST /api/gap/personas/[id]/angle`.

### C2-C4. Account motion (one cold email motion per account)
- `motion/account-motion.ts computeAccountMotion` (pure), states:
  `paused_reply` (someone at the account wrote in and it is untriaged: no email
  card READY), `in_motion` (a GAP first touch at the account inside 5 business
  days holds everyone else; a failed address releases it at once),
  `ready` (one PRIMARY: Casey's recorded choice, else a suggestion ranked by
  visible factors: thesis-role relevance, seniority from title, reachability;
  every other email card is NEXT with its unlock condition), `idle`.
- Choice: `POST /api/gap/accounts/motion` (append-only `account.motion` row).
- Enforced at the send gate too (`account_motion_active`, step 0, seller
  draft/send and live enroll), not only in the UI. Calls and LinkedIn are
  human judgment and never held.
- C4 builds on the existing account-reply hold (first touches refused until
  the reply is dispositioned) and the colleague-reply follow-up stop; the
  motion now shows the pause instead of a READY card that would be refused.

### C5. NEXT UP v2
- `routing/next-up.ts`: replies oldest first, due follow-ups most overdue,
  READY primaries by soonest primary-fact expiry then tier then oldest, review
  by people unlocked then tier, research (inbox facts, research theses,
  research cards) by people unlocked, trigger freshness, tier. At most one item
  per account; never an account with an open deal or unknown opportunity truth;
  never an item marked failing its gate.

### Release C review fixes (verified P1s, fixed before merge)
- A first touch sent from a Gmail draft was dated by the draft's creation, and
  the ledger read had a 30-day created_at window: a draft made Monday and sent
  the next Tuesday let a second person through the same day. Now a draft is
  dated by its DRAFT_SENT `sentAt`; an outstanding first-touch draft holds the
  account until it is sent or deleted, however old ("unlocks after that draft is
  sent or deleted").
- With 3+ email-ready people only the primary and one NEXT were visible; the
  rest were in no lane. Now `alsoWaiting` lists everyone else, each with their
  angle and "Make X the primary instead".

### Release C validation
- Mutations RED then restored: send gate removed; two email cards READY at one
  account; bounced owner still holds; reply pause ignored; Casey's choice
  ignored; held account picked by NEXT UP; two NEXT UP items per account; an
  accepted suggestion saved as human-owned.
- Review catch during RED: thesis-role relevance was first measured against
  the candidates' own roles (everyone matched); it now uses the hypothesis
  persona key.
- `e2e-phase2.ts` G2 (USE -> review -> approve + use -> routing -> exactly one
  email READY of 3; second first touch refused `account_motion_active`) and G3
  pause (colleague reply: no READY email card, `account_replied` refusal,
  primary follow-ups stop). Triage visibility of that colleague reply is
  Release D (D5).

### Release C production verification (2026-09-28)
- Merge ded3ac0b served (dpl_fTvC3xdiJCGBnpxSpwJM5VfhvBmD). Signed-in /gap:
  NEXT UP v2 reads "Find verified evidence for the PepsiCo thesis · 5 people
  waiting", then General Mills, FedEx, The Home Depot (one per account). READY
  is 0 in production today, so no motion panel shows yet; the scratch E2E
  (G2/G3) is the motion proof.

## Release D: mobile buyer truth capture v0

### D1. Quick capture (`/gap/capture`, phone first; "Capture" tab)
- Search an account or person (plain contains, Casey picks), choose the
  conversation (meeting, call, conference, email, LinkedIn), paste notes or a
  transcript or dictate with the keyboard mic, Save. The raw note is kept
  exactly as written (append-only `capture.note`). An unknown account stays
  UNLINKED with Casey's hint; nothing can be confirmed until he links it
  (`capture.linked`). Recent notes list unlinked first; `/gap/capture/[id]`
  reopens one.

### D2. Candidate BID extraction
- `capture/extract.ts`: deterministic. Sentences cut verbatim from the note
  (never paraphrased), seller lines ("Casey:", "Me:", ...) never proposed, a
  proposed BID type from visible cue words (shown). A candidate is not truth.
- CONFIRM = the existing BID service as a HUMAN (`recordBid`, actorKind human),
  exact quote re-checked verbatim against the note, optional relabel or a
  shortened quote that is still verbatim, a thesis at the note's account and
  the person who said it (never guessed). REJECT is recorded. Each candidate is
  decided once (`capture.candidate`). Unconfirmed candidates write no BID and
  no disposition (zero Learning / CRM effect). No AI summary is produced.

### D3. Truth types
- Existing taxonomy only: BID types (current_state, business_problem,
  root_cause, impact, metric, future_state, priority, constraint, objection)
  plus the meeting outcomes below; no new categories.

### D4. Meeting outcome
- `recordMeetingOutcome`: qualified problem (needs the buyer's own words from
  the note, verbatim) -> problem_confirmed; disqualified -> problem_rejected;
  more discovery / no decision -> no_signal; next meeting -> meeting_accepted.
  A human-confirmed disposition on channel `meeting` (what
  meetingToQualifiedProblemRate reads), plus the five-way outcome and an
  optional next learning objective (`capture.meeting`).

### D5. Colleague replies in triage
- `listReplies` adds replies from someone at a GAP account's domain who is not
  a known GAP recipient, labelled ACCOUNT-LEVEL / COLLEAGUE REPLY, with their
  own address as the contact and no persona (their words are never assigned to
  the person GAP emailed). First page, 60-day window, auto-replies excluded.
  Account motion stays paused until one is dispositioned.

### D6. Hold clearing
- The account-reply hold now clears on a human disposition of either source
  kind (`inbound_message` or `hubspot_engagement`); a HubSpot-sourced reply no
  longer holds the domain forever.

### Release D review fixes (verified P1s, fixed before merge)
- "Who said it" defaulted to the note's person for every candidate, and a
  full-name seller label ("Casey Larkin:") was not recognized: on a
  multi-speaker transcript one press could put Casey's or Bob's words on Jane.
  Now each candidate keeps its speaker label ("In the note: Jane Doe"), any
  "Casey ..." label is a seller line, and on a note with more than one buyer
  speaker the server refuses a confirm without an explicit speaker
  (`speaker_required`) and the UI pre-selects nobody.
- The meeting form silently chose a thesis (a qualified / disqualified outcome
  resolves it). Now Casey chooses the thesis the meeting tested (pre-chosen
  only when exactly one exists) and the form says what it will resolve.
- Also closed (review P2, same truth surface): an explicit contact email must
  be a person at the account (`contact_not_at_account`); an edited quote must
  stay inside its own candidate sentence with at least four words; decisions
  on one capture are serialized by an advisory lock (no double confirm).

### Release D validation
- Mutations RED then restored: a non-verbatim quote confirmable; candidates
  auto-confirmed at capture; a confirm recorded as an agent; seller lines
  proposed (first survived: the fixture had no cue words in seller lines; a
  seller claim with "2 hours per shift" was added, then RED); an unlinked note
  confirmable; a qualified meeting without buyer words; colleague replies
  dropped; colleague words assigned to the emailed person; HubSpot disposition
  not clearing the hold.
- `e2e-phase2.ts` G3 triage (colleague reply listed as account-level with its
  own sender; a human referral disposition clears the hold) and G4 (conference
  note -> 4 verbatim candidates, zero BIDs before confirmation -> confirm 2,
  reject 1 -> exactly 2 human-confirmed BIDs with the exact quotes).

### Release D production verification (2026-09-28)
- Merge c15aa366 served (dpl_RuMZZk82MBSq2tZVqEXesj3g7Y6f). `/gap/capture` in a
  signed-in rig tab at phone width: renders (Who / conversation / note / Save),
  no horizontal page scroll. Found: the GAP sub-nav clipped its 4th tab on a
  phone after "Capture" was added; fixed in Release E (sub-nav wraps). Nothing
  was saved in production.

## Release E: seller action pack v2

### E1. Six-line brief (top of every action pack)
- `execution/six-line-brief.ts` + `components/gap/six-line-brief.tsx`:
  KNOW = the primary verified outreach fact only (title, date, "✓ verified",
  the quote; a keyword hit is "No verified fact"); THINK = problem hypothesis
  labelled "Hypothesis (inference)"; LEARN = the first falsification question;
  WHY YOU = Casey's PersonaAngle (edit in place) or a suggestion labelled "not
  yours yet"; HISTORY = this person's GAP touches, colleagues in motion,
  an untriaged account reply, the last buyer response, and HubSpot opportunity
  truth read at render (bounded, UNKNOWN on failure), coloured clear / caution
  / blocked; WRONG IF = what_a_no_means (else the second falsification
  question). History that cannot be read says so. It replaces the separate
  "Why now" block (why now stays in the collapsed evidence). No gate changed.

### E2. Clutter removed (data kept)
- A call_now card offers Call once (its primary); a LinkedIn card offers
  LinkedIn once; an email card keeps Call / LinkedIn as secondary channels.
- The embedded action pack no longer repeats the card's Call button (shows the
  number); a call card's pack leads with the call script.
- No "Action pack (history)" link on live cards (waiting / replied / complete).
- Routing internals (rule id, priority, lane, target chip, evidence counts)
  stay under a collapsed "System details (routing)" disclosure.
- Inbox copy: a generic network fact reads "a change to the physical network"
  (was "a network investment", shown on a divestiture in production).

### E3. Mobile
- The brief is one column below `sm` (label column from `sm`), words break;
  the GAP sub-nav wraps instead of clipping.

### Release E review fixes (verified P1s, fixed before merge)
- KNOW showed an EXPIRED verified fact as "✓ verified" (the outreach-fact check
  does not test freshness; every send gate drops expired facts). Expired facts
  are now excluded and the brief says "The verified fact expired on <date>: it
  cannot be quoted to a buyer."
- HISTORY printed "No account reply waiting" when it had not checked (a person
  with no email, or a consumer address). The reply check now uses the person's
  company address or any company address GAP holds at the account; with none
  it says "Account reply status unknown" and marks caution.

### Release E validation
- Mutations RED then restored: KNOW shows an unverified fact; a suggested angle
  shown as owned; an open deal not flagged in HISTORY; unreadable history shown
  as clear; a duplicate Call on call cards.
- `e2e-phase2.ts` G6: the READY primary's brief from real rows (KNOW the
  verified fact, THINK inference, LEARN, WHY YOU Casey's angle, HISTORY "No GAP
  touches ... HubSpot opportunity CLEAR, checked moments ago", WRONG IF); the
  send preview ran every gate and nothing was sent.

## Release F: In Deals + Deal Brief v0

### F1. In Deals
- Cockpit tile "In deals" counts accounts the current routing cards hold for an
  open deal (`deals/in-deals.ts heldDealAccounts`, rule `active_opportunity`;
  no HubSpot call per cockpit load).
- `?lane=deals` reads LIVE opportunity truth per GAP account (held accounts
  first, max 40, five at a time, 8s each): open deals with name, stage in words
  (a custom stage says so), last activity (`notes_last_updated`, else
  `hs_lastmodifieddate`, display only; never changes ACTIVE), the people GAP
  holds, contacts on the deal, and "N of 6 known". UNKNOWN truth (or a thrown
  read) is listed apart as "Could not verify"; CLEAR is omitted.
- Cold prospecting stays stopped by the existing rule and send gates (G5: every
  card routes to nurture, none READY, a send attempt is refused).

### F2. Deal Brief v0 (read-only)
- `deals/deal-brief.ts`: sections from human-confirmed, uncorrected BIDs only
  (CURRENT STATE, PROBLEM, ROOT CAUSE, BUSINESS IMPACT = impact/metric/priority,
  DESIRED FUTURE STATE, SOLUTION REQUIREMENTS = constraint), each with the quote,
  who said it, source and who confirmed it; STAKEHOLDERS = BID speakers plus
  the deal contact count; BUYER COMMITMENTS = confirmed meeting_accepted
  outcomes; CONTRADICTIONS = a confirmed vs a rejected problem, objection BIDs,
  and contradicting public facts (evidence inbox); UNKNOWNS = every empty truth
  section, rendered UNKNOWN. An AI-extracted or unconfirmed row never appears.

### F3. Next learning objective
- Casey's: newest `deal.learning_objective` audit row on the account
  (`POST /api/gap/deals/objective`), else the objective he typed when recording
  a meeting (`capture.meeting`), else a deterministic suggestion aimed at the
  first unknown, shown as "Suggested (not yours yet)".

### F4. No HubSpot writes
- Pinned by a source scan: the deals modules, route and view import no HubSpot
  client or write helper.

### Release F validation
- `tests/unit/gap/deal-brief.test.tsx` 17 tests. Mutations RED then restored:
  unconfirmed BID shown, empty section not UNKNOWN, suggestion shown as owned,
  unconfirmed commitment counted, UNKNOWN truth dropped, unbounded concurrency,
  a throw treated as clear, tile counting unknown accounts.
- `e2e-phase2.ts` G5 (scratch): the account gets an open deal; 3 cards route to
  nurture, none READY, a send is refused; In Deals lists it (2 on the deal,
  2 of 6 known); the Deal Brief shows only the 2 confirmed quotes, 4 UNKNOWN,
  and Casey's objective. Scratch E2E: integrated 14, sprint2 10, sprint3 16,
  sprint4 14, phase2 19, all PASS.

### Release F review (no P0/P1; verified P2s fixed before merge)
- A confirmed problem on one thesis and a rejected problem on another was shown
  as a contradiction; now only the same thesis confirmed and rejected is.
- An older set objective beat a newer meeting objective; now the newest wins.
- Accounts past the 40-account cap vanished; they are now listed under "could
  not verify" (not checked), and an opened account says whether HubSpot could
  not be checked, shows no open deal, or is not a GAP account.
- Suggestion copy uses "yards" plural; the lane says the tile and the live read
  can differ. Mutations RED then restored for all three fixes.

## Release G: integrated seller-OS acceptance

`scripts/gap/e2e-phase2.ts` (scratch only; report `docs/gap/phase2-e2e-latest.md`),
23 PASS, alongside integrated 14, sprint2 10, sprint3 16, sprint4 14:

| Journey | What it proves |
|---|---|
| G1 | Background research prepared a verified fact before Casey arrived; no protected state changed; nothing approved |
| G2 | USE rebuilt the thesis from the one fact; review; APPROVE + USE; exactly ONE email READY per account; a second first touch refused |
| G3 | A colleague reply pauses the whole account; it is triaged as account-level; the hold clears only on Casey's disposition |
| G4 | A conference note becomes verbatim candidates; only the two Casey confirmed are BIDs |
| G5 | An open deal: every card routes to nurture, none READY, a send refused; In Deals lists it; the Deal Brief shows confirmed truth, unknowns and Casey's objective |
| G6 | The READY person's six-line brief from real rows; the send preview runs every gate; nothing sent |
| G7 | HubSpot unavailable + mailbox stale + suppression unavailable: health BLOCKED (HubSpot, suppression) / DEGRADED (mailbox); the send refuses on opportunity_unknown; the wire suppression gate refuses; nothing sent |
| LEARNING | The first touch carries its attribution (fact id and kind, opener, persona, account); both BIDs carry source, verbatim quote, confirmer, timestamps, thesis, person and capture note |

## Final expert review (four read-only lenses, after G)

No lens found a P0. The lead read the code for every P1 claim; all eight were
real and are fixed on `fix/gap-phase2-final-review`, each with tests and a
mutation proven RED then restored:

| # | Lens | Verified P1 | Fix |
|---|---|---|---|
| 1 | Practitioner, buyer | After a buyer ANSWERED (not priority, a meeting, a rejection), a human disposition cleared the hold and a colleague unlocked for a cold first touch "with no response" | A confirmed buyer answer at the account (`CONVERSATION_RESPONSE_CLASSES`, 90 days) puts the account in a conversation: the send gate refuses a colleague's first touch and the cockpit shows `in_conversation`, all email cards held. Referral, voicemail, no answer, gatekeeper, out of office, bounce and no signal do not hold |
| 2 | Buyer, reliability | The account-reply pause was keyed on the recipient's email domain (a multi-domain account such as pepsico.com / fritolay.com leaked) | `accountRepliedRecently` checks every company domain GAP holds at the account (send gate, enroll, brief, cockpit) |
| 3 | Reliability | Two first touches at one account in the same second could both pass the one-motion check | `claimSendKey` takes an account advisory lock for step 0 and re-runs the motion check inside it |
| 4 | Reliability | A send whose outcome was unrecorded (claimed, not reconciled) or a live enrollment did not hold the account | Unresolved DIRECT/DRAFT claims count as outstanding first touches; enrollments in the lookback count as first touches |
| 5 | Practitioner | A meeting "qualified problem" accepted a line Casey said, and skipped the who-said-it guard | The quote must sit inside one buyer sentence (seller-labelled lines never qualify); with two buyer speakers Casey names who said it |
| 6 | Practitioner | KNOW and the send path quoted a fact another verified fact contradicts | `research/conflicts.ts contradictedFactIds`: KNOW refuses it (and says so when the check cannot run); the send gate refuses `fact_contradicted` until Casey ignores one side |
| 7 | UX | Phone capture froze on "Saving..." with no connection and a reload lost the note | Every capture call catches a network failure, says "no connection", re-enables; the unsaved note is kept on the phone and restored |
| 8 | UX | "Do this next" landed at the top of the lane, not on the opened card | The lane scrolls to the opened card once its cards have loaded |

A fresh read-only review of the fix branch found no P0/P1. Three of its P2s
were fixed before merge:
- an unresolved claim is attributed from its own row, not only its key;
- enrollments exclude test and legacy rows and carry their address;
- clearing the capture text clears the kept note.

The rest are recorded below.

Validation on the fix branch: GAP suite 187 files / 3468 tests, full suite
504 files / 5560 tests, typecheck, build, scratch E2E integrated 14, sprint2
10, sprint3 16, sprint4 14, phase2 23, all PASS.

## Debt recorded (not fixed in this program unless it blocks)

- Release A review (non-blocking): `verifyPublicFact` reports `created: true`
  for a verified fact even when its row already existed; `sourceTypeOf` labels
  any host ending in `sec.gov` as primary (the gate accepts either type); the
  seller-typed publication date is trusted as given (like research dates); the
  public-fact route fetches an operator-supplied URL server-side following
  redirects (hostname private-host check only, authenticated callers only;
  same fetcher research already uses); a future-dated mailbox `lastSuccessAt`
  would read as healthy.
- Release B production observation: the existing physical-network classifier
  (`research/facts.ts isPhysicalOpsFact`) accepted UNFI's "rollout of an
  AI-powered supply chain and procurement planning platform" as a network
  fact. The evidence gate is out of scope for this program; recorded for a
  future gate review.
- Release C review (non-blocking): an unresolved DIRECT_CLAIMED /
  DRAFT_CLAIMED (send outcome unknown) is not counted as an account first touch
  by the motion gate (the per-person gate still treats it as sent); NEXT UP v2
  skips a buyer reply at an account held by an open deal or unknown opportunity
  truth, per the Phase 2 hard constraint (the Replies lane still shows it).
- Release F review (non-blocking): the In Deals lane awaits its live HubSpot
  fan-out inside the page render (worst case about 8 waves of 8s at 40
  accounts); the resolver timeout races but does not abort, so real HubSpot
  concurrency can briefly exceed 5; each objective save refreshes the whole
  lane. The objective route accepts any Account row (audit only).
- Final review P2/P3 (recorded, not blocking):
  - Deal Brief: a confirmed problem outcome's buyer quote is not shown under
    PROBLEM (only BIDs fill sections).
  - WRONG IF can fall back to a question.
  - HISTORY does not turn caution on a last response of not_priority /
    problem_rejected (the conversation gate now refuses the colleague send).
  - Two dispositions with no thesis could pair as a contradiction.
  - The capture extractor can propose continuation lines or Otter-style
    transcripts (speaker header on its own line) as buyer candidates. A human
    still confirms each one.
  - Account motion also has these gaps:
    - enroll's motion check is not under the account lock;
    - an unsubscribe with no disposition releases the account at once;
    - the owner's follow-ups continue while a colleague's motion starts after
      the 5-day unlock.
  - Old first-touch Gmail drafts stay live after a later hold (pre-Phase 2).
  - Health:
    - the HubSpot probe reads companies only, not deals scope;
    - a gap-mailbox dryrun advances lastSuccessAt.
  - Deal observation skips a deal with an unreadable createdate.
  - The meeting outcome is not under the capture lock.
  - Concurrent background runs can repeat research (cost only).
  - UX:
    - evidence USE / Draft success messages unmount with the fact;
    - "System details on the full action pack" copy points at a link removed
      in E;
    - silent failures in motion / angle / link actions;
    - the meeting outcome preselects "Qualified problem";
    - an unconfirmable candidate gives no reason;
    - tap targets are under 44px;
    - iOS zooms small inputs;
    - suggested angles say "yard".
- Final fix review P2/P3 (recorded):
  - An unresolved claim holds the account until it is reconciled (no
    expiry). A human reconciles; the mailbox cron repairs unknown sends.
  - `detectConflicts` flags every fact at a contradicted site, and its site
    regex is coarse, so a neutral fact there is also refused until one side
    is ignored.
  - The meeting "who said it" guard is satisfied by the pre-filled main
    attendee.
  - A persona filed under the account with an outside domain widens the
    reply hold.
  - The kept capture note is one key per device.
  - An `in_conversation` account holds the answering buyer's own email card
    in the cockpit (the send gate allows it).
  - Live enroll's motion check is not under the account lock (auto-enroll is
    OFF).
  - The cockpit reply-hold read is one query per account.
