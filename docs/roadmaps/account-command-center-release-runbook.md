# Account Command Center Release Runbook

## Scope

This runbook covers the account-page outreach operating surface delivered across sprints `A0` through `A8`:

- canonical account identity resolution
- inline research refresh and signal scan
- staged contact discovery and promotion
- inline asset selection and compose/send
- durable multi-recipient send jobs
- inline post-send learning loop
- deterministic proof seed and proof coverage

## Preconditions

Before any release:

1. Pull current production env locally when needed with `vercel env pull .env.production.local --environment=production`.
2. Confirm auth is working for `casey@freightroll.com`.
3. Confirm production send credentials are present.
4. Confirm `ALLOW_PROOF_SEED_IN_PRODUCTION` is only enabled during smoke/proof windows.

## Local Release Gate

Run these before deploy:

1. `npx vitest run tests/unit/account-command-center-fixtures.test.ts tests/unit/account-command-center-performance.test.ts tests/unit/account-command-center-data.test.ts tests/unit/account-command-center.test.ts tests/unit/account-contact-candidates.test.ts tests/unit/account-contact-candidates-routes.test.ts tests/unit/account-contact-candidates-panel.test.tsx tests/unit/asset-selection.test.ts tests/unit/compose-contract.test.ts tests/unit/account-outreach-shell.test.tsx tests/unit/email-send-routes.test.ts tests/unit/email-send-bulk-async-route.test.ts tests/unit/process-send-jobs-route.test.ts tests/unit/failure-remediation-route.test.ts tests/unit/send-job-retry-failed-route.test.ts tests/unit/send-job-tracker.test.tsx tests/unit/operator-outcomes.test.ts tests/unit/operator-outcomes-route.test.ts tests/unit/account-outcome-logger.test.tsx tests/unit/account-engagement-summary-card.test.tsx`
2. `npx tsc --noEmit`
3. `npm run build`
4. `npm run test:e2e:account-command-center:proof`

## Production Deploy

Deploy the current workspace with:

1. `npx vercel deploy --prod --yes`
2. Record the deployment id and resulting production url.

## Production Smoke

Use the deployed production url as `PLAYWRIGHT_BASE_URL`.

1. Core click smoke:
   - `PLAYWRIGHT_BASE_URL=<production-url> npx playwright test tests/e2e/vercel-click-smoke.spec.ts`
2. Account-page full proof:
   - `PLAYWRIGHT_BASE_URL=<production-url> E2E_SEED_SECRET=<seed-secret> ALLOW_PROOF_SEED_IN_PRODUCTION=1 npx playwright test tests/e2e/account-page-send-proof.spec.ts tests/e2e/account-command-center-proof.spec.ts tests/e2e/account-command-center-performance.spec.ts`
3. Real send smoke:
   - `PLAYWRIGHT_BASE_URL=<production-url> npx playwright test tests/e2e/send-previews.spec.ts --grep "send one-pager preview email|send cold email preview via generator|send follow-up preview via generator"`

## Manual Smoke Checklist

Verify these in production:

1. `/accounts/e2e-boston-beer-company` loads with the seeded canonical scope.
2. `Refresh Intel` updates the intel strip without route change.
3. `Find More Contacts` / staged candidate panel is visible on the account page.
4. `Compose Outreach` opens the unified shell.
5. Single-recipient send succeeds from the account page.
6. Multi-recipient send creates a send job with tracker and remediation controls.
7. `Log Outcome` updates next-best action and learning-loop recommendation.

## Rollback Protocol

If the deploy fails smoke:

1. Revert to the previous Vercel production deployment from the Vercel dashboard or with `vercel rollback <deployment-id>`.
2. Disable `ALLOW_PROOF_SEED_IN_PRODUCTION` if it was enabled for smoke.
3. Re-run the production click smoke on the rollback deployment.
4. If seeded proof data polluted production views, reseed the proof account and delete the proof rows from:
   - `accounts`
   - `personas`
   - `generated_content`
   - `email_logs`
   - `send_jobs`
   - `send_job_recipients`
   - `operator_outcomes`
   - `account_contact_candidates`
   - `system_config` proof cache key

## Known Safe Proof Data

The deterministic proof account is:

- account slug: `e2e-boston-beer-company`
- primary name: `E2E Boston Beer Company`
- alias name: `The E2E Boston Beer Company`

This account is safe to reseed repeatedly and is the only proof account that should be used for live account-page smoke.
