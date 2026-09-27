# GAP red team remediation: status ledger

STATUS: ACTIVE
<!-- verified:2026-09-26 -->

Program: close accepted red-team findings T1-T10 in four release trains
(A: T1 · B: T2-T5 · C: T6-T9 · D: T10). One implementation owner, read-only
reviewers at release gates. Baseline: origin/main `945e5e1f` (PR #267).

Standing constraints until T2 + T3 + T5 + T9 are verified:

- NO cold first touches from casey@yardflow.ai (GAP direct send, GAP draft, manual).
- Kroger persona 1886 / Joey Maggard: no send from the newer duplicate first-touch card.
- PepsiCo: the evidence-deficient thesis is not approved, used or sent.
- No prospect sends or drafts during implementation or testing.

Release receipts carry `github_actions = unavailable_external_billing` until
Casey restores Actions (account locked on billing). Gates meanwhile: focused
tests, GAP suite, typecheck, local build, Vercel preview READY, read-only
review, production verification.

## Ledger

### T1 — close passwordless production login

- status: DONE. Release A merged: PR #268, merge `fc7d20a5`, production READY 2026-09-26
- commits: `0000ffeb` (T1), `74511dc6` (middleware segment anchoring),
  `feb709aa` (review follow-ups)
- files: `src/lib/auth-providers.ts` (new), `src/lib/auth.ts`,
  `src/app/login/page.tsx`, `middleware.ts`,
  `src/app/api/revops/send-approvals/route.ts`,
  `src/app/api/gap/decisions/[id]/send/route.ts`,
  `src/app/queue/work-queue-client.tsx`, tests under `tests/unit/auth/`,
  `tests/unit/send-approvals-route.test.ts`, `tests/unit/gap/send-route.test.ts`,
  `tests/unit/middleware-matcher.test.ts`
- change:
  - Credentials provider registered only when NODE_ENV is `development` or
    `test` (unset fails closed); the /login email form renders only there.
  - Production session tokens must carry `signInProvider: 'google'` (stamped
    in the jwt callback at sign-in). Tokens minted before the fix, including
    any forged through the email-only provider, are dropped on the next
    request. Consequence: every existing session, Casey's included, signs in
    once more with Google after deploy.
  - PATCH /api/revops/send-approvals: approver = session email (401 without
    one), owners only (403), only a `pending` request can be approved or
    rejected (409 `not_pending`). A body `actor` is stripped.
  - POST /api/gap/decisions/[id]/send: owners only (403). HUMAN_APPROVED_1TO1
    means Casey, not any allowlisted account.
  - middleware matcher: every named exemption is a whole path segment. The
    bare prefix `api/e` (open pixel) had exempted /api/email/*,
    /api/engagement/*, /api/enrich*, /api/enrichment/*, /api/export; an
    anonymous POST /api/email/send could send email (reviewer BLOCKER,
    confirmed live read-only: GET /api/email/send-jobs/999999999/ answered
    the handler's 404, not the wrapper's 401).
- audit of other GAP mutation routes: every `/api/gap/**` mutation already
  derives `actor` from `auth()` or, for the agent token, writes as `cron` /
  `actorKind: 'agent'` (unconfirmed rows only; no agent path approves or
  sends HUMAN_APPROVED_1TO1).
- tests: provider/env tests + source pins, token-provider gate, owner list;
  send-approval route (session actor, body actor ignored, 401, 403, 409);
  send route 403; middleware matcher RED on 11 bypassed paths then GREEN.
  Mutation: provider gate forced open -> 2 RED, restored GREEN.
- gates: GAP + auth suite 144 files / 2810 tests green; typecheck green;
  local build green; Vercel preview READY; read-only security review (1
  BLOCKER + 3 SHOULD-FIX, all fixed in the PR);
  github_actions = unavailable_external_billing.
- production mutation: deploy only (no data writes).
- production verification (2026-09-26, after `fc7d20a5` READY):
  `GET /api/auth/providers` = `{"google":...}` only; anonymous
  `/api/email/send/` = 401 `Authentication required` (the wrapper);
  `/api/email/send-jobs/1/` = 401; `/api/cron/check-inbox/` = 401
  `Unauthorized` (its own handler, still reachable); `/api/e/open/`,
  `/for/pepsico/`, `/demo/pepsico/`, `/unsubscribe/`, `/login/` = 200.
- known consequence: Playwright specs under `tests/e2e/` that sign in via
  `/api/auth/callback/credentials` against production stop working there by
  design; they still run against local `next dev`.
- named debt (outside GAP, not consumed by any GAP gate):
  `PATCH /api/revops/message-evolution` (`reviewed_by`),
  `POST /api/revops/failure-remediation` (`owner`) and
  `revops/playbook-blocks` (`createdBy`) still accept a client-named actor.
- next: T2 (Release B, branch `feat/gap-redteam-release-b`).

### T2 — one send history per person

- status: DONE (Release B: PR #269, merge `87277798`, production READY 2026-09-26)
- commit: see `git log --grep "T2"` on `feat/gap-redteam-release-b`
- files: `src/lib/gap/execution/person-history.ts` (new),
  `src/lib/gap/execution/next-touch.ts`, `src/lib/gap/execution/seller-draft.ts`,
  `src/lib/gap/execution/seller-send.ts`, `src/lib/gap/routing/queue.ts`,
  `scripts/gap/audit-person-history.ts` (read-only), tests
  `tests/unit/gap/person-send-history.test.ts`, shared fixture
  `tests/unit/gap/fixtures/where.ts` (seller-db, next-touch, seller-send
  fixtures moved onto it; unknown operators throw)
- change: `personSendHistory(prisma, personaId, recipient)` reads DRAFT_SENT
  (joined to DRAFTED), MANUAL_SENT, DIRECT_SENT, drafts and unresolved
  DIRECT_CLAIMED across every routing decision of the person, of any persona
  row sharing the address, and of any ledger row naming the address. Ordered
  (step, sentAt, event id), no row cap, no age window. Used by
  computeNextTouch (so resolveActionPack and the draft/send gates),
  prepareSellerEmail (step already sent anywhere -> `first_touch_already_sent`
  / `step_already_sent`; open claim anywhere -> `send_in_progress_or_unknown`),
  sendSellerEmail (claim key `gmail_direct:person:<id>:<recipient>:step:<n>`,
  advisory lock on the person, person history re-read inside the lock) and
  the queue's attachTouches (complete, page-scoped read; the old
  `take: 500` / 120-day scan is gone; past the evaluation cap or on a read
  failure a card with history is `unknown`, never a first email). Historical
  rows untouched; legacy per-card claim keys are parsed for their step.
- tests: 14 new (A: step 0 on newer card refused, 5 variants incl. duplicate
  persona and open claim; B: newer card's next touch = waiting; queue: 300-day
  send behind 600 rows still found, read failure fails closed). RED on the
  original per-card code: 9 failed. Mutation C (history forced back to
  decision scope): 8 failed; restored GREEN. GAP folder 141 files / 2771
  tests green; typecheck green.
- production mutation: none.
- production verification (D, READ ONLY, 2026-09-26): persona 1886 has 7
  cards; step 0 hand-sent 2026-09-25T20:59:19Z on card cmuh66pro…; the
  newest email card cmuhrmns… now resolves `waiting` for touch 2 due
  2026-10-01 and step 0 is refused. Receipt:
  `docs/gap/t2-kroger-1886-person-history.md`.
- next: T3.

### T3 — routing sees GAP sends

- status: DONE (Release B: PR #269, merge `87277798`, production READY 2026-09-26)
- files: `src/lib/gap/routing/inputs.ts` (readComms), `src/lib/gap/routing/rules.ts`,
  `src/lib/gap/routing/types.ts`, tests `routing-inputs.test.ts`, `routing-rules.test.ts`
- change: `readComms(prisma, email, personaId)` reads the person's GAP send
  history through the same named, fail-closed `read()` wrapper
  (`inputs_error:gap_send_history`). `lastOutboundAt` = latest of EmailLog,
  every GAP send (manual, draft-sent, direct, any card) and every unresolved
  claim. New `comms.gapSequence` (`none | active | complete | stopped`):
  complete = every step of the pinned version sent; stopped = a confirmed
  substantive disposition after the first send. Rule order: R14 hot_call,
  R14b `sequence_stopped` (nurture), R14c `sequence_complete` (nurture),
  R16 cooldown, then R15 hot_email. EmailLog stays auxiliary.
- tests: 9 new (hot + GAP send 3 days ago -> cooldown; manual GAP send with no
  EmailLog -> lastOutboundAt + cooldown; open claim counts; complete ->
  sequence_complete; stopped; unreadable history -> inputs_error). RED on
  the original code: 10 failed (incl. the pinned rule order). GAP folder 141
  files / 2780 tests green.
- production mutation: none.
- next: T4.

### T4 — harden the send gate

- status: DONE (Release B: PR #269, merge `87277798`, production READY 2026-09-26)
- files: `src/lib/gap/execution/seller-draft.ts`, `src/lib/gap/execution/seller-send.ts`,
  `src/lib/email/gmail-sender.ts`, `src/lib/email/autonomy-gate.ts`,
  `src/lib/email/suppression-gate.ts`; tests `tests/unit/gap/send-gate-hardening.test.ts`,
  `tests/unit/email-send-timeouts.test.ts`
- change:
  - `draft_outstanding`: an unresolved GAP Gmail draft for the person + step
    (any card) refuses a direct send and any second draft of other copy; the
    same copy on the same card returns the existing draft (idempotent). A
    discarded draft does not block.
  - any unresolved claim for person + step blocks every content hash (the T2
    claim key carries no hash).
  - AbortSignal timeouts: autonomy read (AUTONOMY_READ_TIMEOUT_MS, 5000) and
    suppression read (SUPPRESSION_READ_TIMEOUT_MS, 5000) fail closed before
    the wire; Gmail send (GMAIL_SEND_TIMEOUT_MS, 25000) -> "Gmail send outcome
    unknown" on timeout, network error or an unreadable 2xx body.
  - claim release only on a definitive Gmail 4xx
    (`/^Gmail send failed \(4\d\d\)/`); 5xx, timeout, unknown -> unresolved.
- tests: 8 gate tests (draft on same/other card, second draft refused,
  discarded draft ok, H1 lost -> H2 refused with Gmail called once, 503
  unresolved + retry no call, timeout unresolved, 400 released + one retry);
  3 timeout tests (signals present; hung authority refuses before the wire;
  Gmail timeout = outcome unknown). RED first: 4 + 3 failed. Mutation (4xx
  regex widened back to any status): the 503 test failed; restored GREEN.
  GAP + email suites 148 files / 2862 tests green; typecheck green.
- production mutation: none.
- next: T5.

### T5 — one-click unsubscribe + footer

- status: DONE (Release B: PR #269, merge `87277798`, production READY 2026-09-26)
- files: `src/lib/email/compliance.ts` (new), `src/app/api/unsubscribe/route.ts`,
  `src/lib/email/templates.ts`, `src/lib/gap/execution/seller-draft.ts`; tests
  `tests/unit/unsubscribe-one-click.test.ts`, `tests/unit/gap/seller-draft.test.ts`
  (the old assertion pinned the header at the PAGE, i.e. the defect),
  `tests/unit/gap/fixtures/seller-db.ts` (test signing secret)
- change:
  - List-Unsubscribe (GAP seller email and app templates) =
    `<https://modex-gtm.vercel.app/api/unsubscribe/?email=…&token=…>` +
    `List-Unsubscribe-Post: List-Unsubscribe=One-Click`. The trailing slash is
    load-bearing: measured 2026-09-26, POST /api/unsubscribe?… answers 308
    (trailingSlash: true), and a provider need not follow a redirect on POST.
  - POST /api/unsubscribe, form-encoded: identity and token come ONLY from the
    URL query; the body must be exactly `List-Unsubscribe=One-Click` (anything
    else 400); a token is required (403 without / invalid); no Origin needed.
    Then the existing canonical `recordUnsubscribe` (unsubscribed_emails row,
    Persona.do_not_contact case-insensitively, HubSpot opt-out mirror).
  - Footer: the physical address the app footer already carried
    (`FreightRoll Inc. · 330 E. Liberty St, Ann Arbor, MI 48104`, now one
    constant) on the GAP seller email, HTML and text parts.
  - Branded path: NOT moved. yardflow.ai has no /unsubscribe proxy
    (`GET https://yardflow.ai/unsubscribe/` = 404); branding it needs a
    Flow-State- rewrite in another repo. Recorded as follow-up; the visible
    link stays on the app origin, which is correct and working.
- tests: exact RFC 8058 POST -> unsubscribed_emails row, persona DNC, next
  touch stopped, next send refused (`persona_do_not_contact`); no Origin ok;
  bad token 403 writes nothing; extra body field 400; header targets (app +
  GAP) and postal address. RED first: 6/6 failed. Mutation (header target
  back to the page): 2 failed; restored GREEN. GAP + unsubscribe + email
  suites 146 files / 2840 tests green; typecheck green.
- production mutation: none.
- next: Release B gate.

### Release B gate — read-only review (RevOps + deliverability + reliability)

- reviewer verdict: no strict BLOCKER; 6 SHOULD-FIX, all on the release's
  own mission (same step twice / after unsubscribe). All fixed in this PR:
  - #1 reconcile read a SCHEDULED or undo-window send as `discarded`, which
    released `draft_outstanding`. Now `scheduled` stays outstanding; a draft
    gone with no SENT is recorded `execution.gmail_draft_vanished` and
    discards only after `DRAFT_VANISH_GRACE_MS` (2h). (`7693c8e3`)
  - #2 the advisory lock was keyed on persona id only. `lockPerson` now locks
    the lowercased address AND the persona id, sorted. (`7693c8e3`)
  - #3 drafts were checked outside the lock and CREATE GMAIL DRAFT took no
    lock. Drafts now claim person + step (`execution.gmail_draft_claimed`,
    closed by DRAFTED `claimKey` or a release); outstanding drafts are
    checked inside the lock; a lost draft answer leaves an open claim.
    (`7693c8e3`)
  - #4 enrolment ignored GAP history. `enrollFromDecision` refuses
    `gap_history_exists` for any send, open claim or outstanding draft.
    (`1bf8ea34`)
  - #5 a first touch did not read `unsubscribed_emails`. prepareSellerEmail
    refuses `recipient_unsubscribed`; the modex suppression leg (read by
    clawd and the wire) reports unsubscribed addresses; the idempotent
    unsubscribe path re-applies do_not_contact. (`9eb74a8a`)
  - #6 token failures never released a claim and were unbounded. Token
    acquisition is bounded (GMAIL_TOKEN_TIMEOUT_MS, 10000) and tagged
    `Gmail token unavailable:` (definitive, pre-wire). (`7693c8e3`)
  - RFC 8058 multipart/form-data accepted; malformed body 400. Manual sends
    record the bare recipient address. (`1bf8ea34`)
- mutation proofs: persona-only lock, no draft check in lock, draft path
  without claim, token not definitive -> each RED; restored GREEN.
- residual (recorded, not blocking): emails already sent with the old
  header point at the `/unsubscribe` page, where a one-click POST does not
  land (production GAP sends so far were manual, so no old-header GAP email
  is known); an outstanding Gmail draft is not deleted on unsubscribe (the
  send gates refuse, but Casey could still press Send in Gmail by hand);
  queue display finds history via persona_id only (execution is exact);
  `sequence_stopped` sits after `hot_call` by design (calls stay open).

### Release B receipt

- PR #269, merge `87277798`, production READY 2026-09-26. No schema change.
- gates: full unit suite 457 files green; typecheck green; local build
  green; 10/10 scratch e2e scripts (117 checks, 0 failed, zero residue);
  Vercel preview READY; read-only review (0 BLOCKER, 6 SHOULD-FIX, all
  fixed); github_actions = unavailable_external_billing.
- production verification (after READY):
  - T2 (read-only, `scripts/gap/audit-person-history.ts 1886`): Kroger 1886's
    newest card `cmuhrmns…` = waiting, touch 2 due 2026-10-01; step 0
    REFUSED first_touch_already_sent; no open claims.
  - T5 (live, reserved address gap-t5-oneclick-proof@example.com, no
    persona): RFC 8058 POST to `/api/unsubscribe/?email&token` with a bad
    token = 403; with an extra body field = 400; valid = 200 "Successfully
    unsubscribed"; repeat = 200 "already". Read-only DB check: the
    unsubscribed_emails row exists (unsubscribed_at 2026-09-27T02:04:16Z).
- production mutation: one unsubscribed_emails row for the reserved
  example.com test address (authorized controlled internal test). Nothing else.
- prospect sends: 0. Prospect drafts: 0.
- next: T6 (Release C, branch `feat/gap-redteam-release-c`).

### T6 — evidence gate

- status: IMPLEMENTED (Release C, not yet merged); production remediation
  planned post-deploy (dry run done)
- commit: `f139aa58` (+ remediation script)
- files: `src/lib/gap/research/evidence-gate.ts` (new), `research/facts.ts`,
  `hypothesis/machine.ts`, `hypothesis/service.ts`, `execution/seller-draft.ts`,
  `compiler/evidence-from-signals.ts`, `compiler/types.ts`, `sequence/render.ts`,
  `routing/inputs.ts`, `routing/rules.ts`, `app/api/gap/compile/route.ts`,
  `scripts/gap/audit-evidence-tiers.ts`, `scripts/gap/remediate-insufficient-active.ts`
- rule (one place): a first touch needs ONE outreach fact = verified
  (`metadata.verified = excerpt_found_at_source`), dated, quoted, public,
  external_ok, account-specific statement of a physical-network change
  (`isPhysicalOpsFact`). Keyword-only, operator hearsay, unverified or
  irrelevant quotes are INSUFFICIENT: research only.
- enforced at: approve + activate (`evidence_insufficient`); send gate
  (prepareSellerEmail `evidence_insufficient`); routing R12b `evidence_thin`
  (research_required); compiler (a keyword hit's ref is never external_ok,
  so it cannot satisfy C01); every compiler caller uses EVIDENCE_SIGNAL_SELECT.
- facts.ts now excludes restructuring charges, risk-factor/forward-looking
  boilerplate, liquidity/credit facilities/financing and generic capex.
  Pinned with the three PepsiCo 10-Q (2026-07-09) sentences verbatim (signals
  cmuhjv71a…, cmuhjv7bq…, cmuhjv7kc…).
- tests: facts (3 PepsiCo + 4 boilerplate + 2 controls), machine (keyword
  approve refused, expired fact refused, activate refused), service (operator
  text refused, verified quote without URL approves, keyword 10-Q refused),
  send gate (keyword, PepsiCo liquidity, expired fact), C01 via the real
  projection, routing evidenceThin semantics. Old tests that pinned the weak
  rule were rewritten to the new rule. Mutations (machine guard off, facts
  exclusions off, send gate off): 5 / 4 / 3 RED; restored GREEN. Full unit
  suite 457 files green.
- production READ (2026-09-26, before remediation): 16 active, 14 at
  INSUFFICIENT by the old depth label; by the T6 gate 15 INSUFFICIENT (all
  keyword_only), 1 kept (Kroger cmuhbne1z…, Giant Eagle merger 10-Q quote).
  5 PepsiCo hypotheses are `approved` (not active): the gate refuses their
  activation and any send; they are not mutated (withdraw -> `rejected`
  could be misread as buyer truth).
- remediation plan (dry run recorded, apply after Release C deploys): the
  existing audited `close_unresolved` transition for the 15, actor
  `redteam-t6-remediation`, reason tagged `evidence_insufficient:` (so T10
  Learning excludes them). No narrative edit, no delete, no email/HubSpot/
  enrollment change (mirror off in production).
- next: T7.

### T7 — honest copy

- status: IMPLEMENTED (Release C, not yet merged); live seed rewrite planned
  post-deploy (dry run done, scratch rehearsal applied + idempotent)
- files: `src/lib/gap/sequences/families.ts`, `src/lib/gap/sequence/call-pack.ts`,
  `src/lib/gap/hypothesis/build.ts`, `src/lib/gap/research/propose.ts`,
  `src/lib/gap/ui/format.ts` (humanWhyNow), `src/components/gap/{action-pack-view,
  fact-hypothesis-blocks,decision-card,hypothesis-drawer}.tsx`,
  `scripts/gap/rewrite-seed-versions.ts`, tests `honest-copy.test.ts` (new),
  `seed-families`, `hypothesis-build`, `decision-card`, `pre-call-brief`,
  `server-client-boundary`; test-only fixture
  `tests/fixtures/gap/legacy-four-step-hidden-capacity.json` (+
  `tests/unit/gap/fixtures/legacy-hc.ts`) for the multi-touch mechanics.
- change:
  - seeds: all four families are honest SINGLE-TOUCH. Steps 1-3 (Fontana,
    Columbus, Bluewater, Reno, "your careers page / investor deck / Q2
    call") are deleted, not replaced. Step 0 = the verified fact (observation
    slot) -> a hedged pattern that says it is not a claim about the account ->
    the hypothesis as a question. No analogy hook, no diagnosis, no cost
    question.
  - builder: a keyword hit, a "mentions:" title or a quote that states no
    network change is never citable (`keyword_or_non_fact_not_citable`); the
    observation is the verified quote via research's `citedQuote`, never a
    title; no auto why-now; confidence 0 (unscored).
  - research propose: quotes only outreach facts (`no_outreach_fact`
    otherwise); no auto "Public source dated" why-now; confidence 0.
  - call pack: opener = verified fact + hypothesis as a question; the cost
    question is `impactIfAcknowledged`, labeled "Only after they say it is
    real"; voicemail = fact + one question, no diagnosis; the action pack
    builds a call script only for a hypothesis with a verified outreach fact.
  - UI: the hypothesis "confidence N%" is no longer displayed; legacy auto
    why-now text ("Signals observed…", "Public source dated…") renders as
    none.
- tests: exact snapshots of a first touch (Kroger / Giant Eagle) and the call
  opener, voicemail, current-state and post-acknowledgement questions; every
  family's first touch checked for fact-first, disclaimer, question, and no
  forbidden text; PepsiCo evidence set (keyword + 3 sentences) INSUFFICIENT.
  RED on the pre-T7 copy: 5 failed; restored GREEN. Full unit suite 458
  files green; typecheck green.
- production (planned post-deploy, `scripts/gap/rewrite-seed-versions.ts
  --apply`): the four live seeded v1 drafts (cmuh640aa…, cmuh640q8…,
  cmuh64134…, cmuh641g1…) 4 steps -> 1 through `updateVersionSteps`
  (drafts only), with a `sequence.version_rewritten` audit event each. No
  compiles, enrollments or pinned hypotheses reference them.
- next: T8.
