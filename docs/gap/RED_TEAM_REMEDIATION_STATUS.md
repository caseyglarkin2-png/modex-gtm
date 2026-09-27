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

- status: IMPLEMENTED (Release A, not yet merged)
- commit: see `git log --grep "T1"` on `feat/gap-redteam-remediation`
- files: `src/lib/auth-providers.ts` (new), `src/lib/auth.ts`,
  `src/app/login/page.tsx`, `src/app/api/revops/send-approvals/route.ts`,
  `src/app/queue/work-queue-client.tsx`, `tests/unit/auth/production-providers.test.ts`,
  `tests/unit/send-approvals-route.test.ts`
- change: Credentials provider registered only when NODE_ENV is `development`
  or `test` (unset fails closed to Google only); the email form on /login
  renders only there. PATCH /api/revops/send-approvals takes the approver from
  the session (401 without one) and strips any body `actor`.
- audit of other GAP mutation routes: every `/api/gap/**` mutation already
  derives `actor` from `auth()` or, for the agent token, writes as `cron` /
  `actorKind: 'agent'` (unconfirmed rows only). No other client-supplied actor
  reaches a GAP gate.
- tests: 4 provider tests + source pin; 4 send-approval route tests; mutation
  (gate forced open) proved 2 RED, restored GREEN.
- production mutation: none.
- production verification: pending merge (`GET /api/auth/providers` must list google only).
- known consequence: the Playwright specs under `tests/e2e/` that sign in via
  `/api/auth/callback/credentials` against production stop working there by
  design; they still run against local `next dev`.
- named debt (outside GAP, not consumed by any GAP gate):
  `PATCH /api/revops/message-evolution` (`reviewed_by`) and
  `POST /api/revops/failure-remediation` (`owner`) still accept a client actor.
- next: Release A gate (security reviewer), PR, merge, verify providers.
