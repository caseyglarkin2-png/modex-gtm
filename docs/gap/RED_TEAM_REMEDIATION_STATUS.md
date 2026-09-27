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

- status: IMPLEMENTED, Release A gate running (not yet merged)
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
- production mutation: none yet.
- production verification: pending merge. Must show `GET /api/auth/providers`
  = google only, and an anonymous GET /api/email/send-jobs/1/ = 401.
- known consequence: Playwright specs under `tests/e2e/` that sign in via
  `/api/auth/callback/credentials` against production stop working there by
  design; they still run against local `next dev`.
- named debt (outside GAP, not consumed by any GAP gate):
  `PATCH /api/revops/message-evolution` (`reviewed_by`),
  `POST /api/revops/failure-remediation` (`owner`) and
  `revops/playbook-blocks` (`createdBy`) still accept a client-named actor.
- next: merge Release A, verify production, then T2.
