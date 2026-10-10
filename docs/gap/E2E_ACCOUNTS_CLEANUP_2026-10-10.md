# The two production test accounts: cleanup report (October 10, 2026)

STATUS: REPORT, READ ONLY. Nothing was written to production. The two accounts are LEFT UNTOUCHED: they are test-only, but no existing reversible archive mechanism exists on Account, so Casey's conditional authorization does not apply. A prepared park script exists and has NOT been run; the remaining decision is Casey's (the last section).
<!-- verified:2026-10-10 -->

Casey, verbatim: "Resolve the two production test accounts. Inspect 'E2E Boston Beer Company' and its twin, their IDs, linked records and any real activity. Prepare an exact cleanup report. If they are conclusively test-only and an existing reversible archive mechanism is available, I authorize archiving those two test accounts with a recovery record. Do not hard-delete, merge with the real Boston Beer account, alter real commercial history or write changes to HubSpot as part of this cleanup. If safe reversible cleanup is unavailable, leave them untouched and report the precise remaining decision."

How this was read: `scripts/gap/archive-test-accounts.ts` in its default dry run, through the read-only production runner (the production database, no writes), plus three HubSpot searches through the HubSpot read tools (contacts, companies, deals). Regenerate with the same dry run; do not edit the numbers by hand.

## The verdict

1. **Test-only, conclusively.** Every row is the account command center proof seed's own output (`src/app/api/proof/account-command-center-seed/route.ts`, fixture `src/lib/proof/account-command-center-fixture.ts`): the fixture names, `signal_type` "E2E", ranks 991 and 992, the fixture domain `e2ebostonbeer.com`, the fixture's malformed address `not-an-email`, notes `proof-seed:journey` and `proof-seed:outcome`, the rationale "Deterministic proof seed marks generated asset as approved for send". Every seeded row was written between 2026-05-07T03:18:51Z and 03:18:54Z.
2. **No real activity.** The one email log (2319, status "opened", one reply counted) was fabricated by the seed: no provider message id, no thread, no HubSpot engagement, its `sent_at` is the seed's own clock. No inbound message from the fixture domain, no sequence enrollment, no conversation disposition, no GAP hypothesis, no routing decision, no GAP ledger row naming them. The "positive" operator outcome is the seed's fixed text.
3. **Nothing in HubSpot.** No HubSpot id on either account, any persona or either canonical company; HubSpot holds no contact at `e2ebostonbeer.com` (by the three addresses and by the email domain), no company named "E2E" or at that domain, and no deal named "E2E Boston Beer".
4. **Not linked to the real account.** "The Boston Beer Company" (account 972, Tier 3, created 2026-05-04) shares no canonical company, alias or link with them.
5. **No existing reversible archive mechanism** (the section below). So they are left untouched.

## The exact rows

The two accounts (Account has no status or archive column):

| id | name | rank | tier | band | pipeline_stage | parent_brand | hubspot_company_id | created / updated |
|---|---|---|---|---|---|---|---|---|
| 1884 | E2E Boston Beer Company | 991 | Tier 1 | A | targeted | E2E Boston Beer Company | none | 2026-05-07T03:18:51.544Z, never updated |
| 1885 | The E2E Boston Beer Company | 992 | Tier 1 | A | targeted | E2E Boston Beer Company | none | 2026-05-07T03:18:51.544Z, never updated |

Every row naming them by `account_name` (every model in the Prisma datamodel with that column was scanned; this covers the list `scripts/gap/merge-account.ts` re-points):

| Table | Rows | Ids | Written | What it is |
|---|---|---|---|---|
| personas | 3 | 2149 Pat Brewer (pat.brewer@e2ebostonbeer.com), 2150 Alex Badpayload (not-an-email), 2151 Taylor Optout (taylor.optout@e2ebostonbeer.com) | 2026-05-07T03:18:51Z; 2151 updated 2026-09-27T14:42:27Z (do_not_contact true, the legacy suppression reconcile acting on the seed's unsubscribe row) | the seed's three recipients, all on the twin (1885); no hubspot_contact_id |
| account_contact_candidates | 1 | 29 Jamie Yardley | 03:18:52Z | the seed's staged candidate |
| activities | 2 | 4622, 4623 | 03:18:52Z | notes `proof-seed:journey`, `proof-seed:outcome` |
| meetings | 1 | 31 | 03:18:53Z | status draft, no date |
| mobile_captures | 1 | 27 | 03:18:53Z | "Proof capture" |
| generated_content | 1 | 416 | 03:18:51Z | the proof one-pager; external_send_count 0 |
| operator_outcomes | 1 | cmoux2w4e00095wjc7cg971ke | 03:18:53Z | the seed's "positive" outcome on email log 2319 |
| message_evolution_registry | 1 | cmoux2uso00015wjchq7hb7c1 | 03:18:52Z | the seed's approval |
| email_logs | 1 | 2319 | 03:18:52Z | fabricated "opened" send; provider_message_id, thread_id, hubspot_engagement_id all null |
| send_job_recipients | 3 | 254 (sent), 255 (failed, not-an-email), 256 (skipped, unsubscribed) | 03:18:53Z | of send job 159 (status partial, requested_by Casey, written by the seed) |
| research_runs | 4 | 2 seed runs (cmoux2v1u..., cmoux2v64...), 2 `hubspot-import:2026-05-07T05:05:15.316Z:1884/1885` runs | 03:18:52Z and 05:05:19Z | the import pass found no HubSpot match ("hubspot": "no_match") and wrote local-curation evidence |
| evidence_records | 10 | 2 seed claims, 8 local-curation claims from the account fields | 03:18:52Z to 05:05:19Z | source_url `https://yardflow.local/...` |

Also naming them, outside `account_name`:

- `accounts.parent_brand` = "E2E Boston Beer Company" on both rows (each other's family; no other account).
- `unsubscribed_emails` cmoux2wcw000a5wjc5py9h92s: taylor.optout@e2ebostonbeer.com, "Deterministic proof unsubscribed recipient" (a suppression row; leave it).
- `system_config` key `agent-action:content_context:account:e2e-boston-beer-company:company:e2e-boston-beer-company` (the seed's cached research context, 03:18:53Z).
- `canonical_companies` `account:e2e boston beer company` and `domain:e2ebostonbeer.com` (status resolved, primary_account_name "E2E Boston Beer Company", no HubSpot id, created 2026-05-05, two days before these rows: an earlier seed run whose accounts the seed itself deleted and recreated). No `canonical_account_links` row points at them; no other account shares them.
- `gap_account_aliases`, `gap_signals.account_hint`, `gap_account_candidates`: none. `gap_audit_events` by subject or payload (names or the fixture domain): none.

## Where they show and where they do not

- GAP Work and the briefing: absent. The day is built from hypotheses, routing decisions, replies, obligations and the In Deals read; they have none of these.
- `/gap/accounts`: already hidden by name (`isFixture`, `/\bE2E\b/i`, src/app/gap/accounts/page.tsx).
- Signal discovery: already excluded by name (`isFixture`, `/^(the )?e2e /i`, src/lib/gap/signals/watch.ts), although Tier 1 and band A would otherwise select them.
- Shown: the legacy all-accounts surfaces and any count of Tier 1 or band A accounts (rank 991 and 992).

## The archive mechanism: none exists

- Account has no `status`, `archived_at` or `is_active` column.
- `pipeline_stage` is a free string. GAP stopped reading it (src/lib/gap/opportunity/active-opportunity.ts, routing/rules.ts and enroll/service.ts say so); the legacy pipeline board (src/lib/pipeline.ts `derivePipelineStage`) knows six stages and reads any other value as `targeted`, so no value of it hides an account.
- The Work outcome `snoozed` (`account.work_outcome`) holds one card for at most 90 days and returns; it is not an archive.
- The `parked` closure is derived from a HubSpot closed-lost deal; it cannot be set.
- The fixture filters above are by NAME; there is nothing to set.

So "an existing reversible archive mechanism" is not available, and under Casey's terms the two accounts are left untouched.

## The prepared script (not run)

`scripts/gap/archive-test-accounts.ts`:

- default: the read-only inventory above and the plan; nothing written.
- `--apply` (needs `GAP_RECONCILE_APPLY=yes` and `GAP_RECONCILE_HOST` equal to the database host): PARKS the two rows by editing four existing columns (`pipeline_stage` targeted to `archived_test_fixture`, `tier` Tier 1 to Tier 3, `priority_band` A to D, `outreach_status` "Not started" to "Archived (test fixture)"), and writes one `account.archived` row in gap_audit_events per account with every changed field and its previous value, the full row as it stood, the linked-row counts, the restore command and the authorization text. Related rows, HubSpot and the real account are not touched; nothing is deleted. It refuses when a canonical company is shared with another account.
- `--restore` (the same guards): writes the previous values back from the newest standing `account.archived` row and one `account.restored` row; it refuses an account, writing nothing, when any parked field was changed after the park.
- Pinned by tests/unit/gap/archive-test-accounts.test.ts (the four columns and their previous values; the exact restore; the named refusal).

It is a park of existing columns, not an archive any reader honors: after it the rows still exist and still show on the legacy all-accounts surfaces; they leave the Tier 1 and band A counts and selectors.

## The remaining decision (Casey)

Pick one:

1. **Leave them** (the current state). They are inert: no GAP footprint, no HubSpot record, already hidden by name from the GAP accounts list and discovery. Cost: they show in the legacy all-accounts views and the Tier 1 counts.
2. **Approve the park**: run `scripts/gap/archive-test-accounts.ts --apply` (reversible with `--restore`, one recovery row per account). This is a new use of existing columns, not an existing archive mechanism, which is why it waits for your word.
3. **Approve a real archive mechanism**: an `archived_at` column on Account that the account readers honor. A product change with a schema migration; not started.
4. **Approve deletion** through the seed's own teardown list (the seed deletes exactly these rows before each run). Irreversible except from this report; you excluded hard deletes, so only on a new explicit decision.

Named debt, outside these two accounts (not touched):

- Four more fixture accounts in production from the one-pager and intake proof seeds, created 2026-05-02: 199 E2E Failed Logistics, 200 E2E Guarded Warehouse, 201 E2E No Recipient Yard, 202 E2E Intake Existing. The same decision applies to them.
- The proof seed refuses in production unless `ALLOW_PROOF_SEED_IN_PRODUCTION=1`; that variable is not set on the Vercel project today, so the May rows came from a run with it set at the time or from a local run against the production database. Running `tests/e2e/account-command-center-*.spec.ts` against a server on the production database would recreate them.
