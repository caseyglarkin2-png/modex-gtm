# GAP OS Phase 2: Seller OS (status ledger)

STATUS: ACTIVE

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
| C | Account motion v0 | feat/gap-phase2-c-account-motion | | | |
| D | Mobile buyer truth capture v0 | | | | |
| E | Seller action pack v2 | | | | |
| F | In Deals + Deal Brief v0 | | | | |
| G | Integrated seller-OS acceptance | | | | |

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
