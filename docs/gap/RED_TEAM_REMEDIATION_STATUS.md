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

- status: IMPLEMENTED (Release B, not yet merged)
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

- status: IMPLEMENTED (Release B, not yet merged)
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
