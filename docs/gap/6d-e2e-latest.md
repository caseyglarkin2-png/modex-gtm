# 6D generic reconciler end-to-end run (latest)

STATUS: PASS

<!-- verified:2026-09-27 -->

Written by `scripts/gap/e2e-6d.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap6d-1790522179501
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: 8191a051
- Ran at: 2026-09-27T15:16:19.701Z

## Steps

- PASS seed: 2 accounts, 1 hypothesis, 1 family/version/enrollment for the matched contact gap6d-1790522179501@example.com
- PASS matched: {"engine":"hubspot_sequence","engineEventId":"gap6d-1790522179501-evt-matched","outcome":"MATCHED","accountName":"GAP E2E 6D Matched gap6d-1790522179501","hypothesisId":"cmujyobun00017kqosgg97ao1","enrollmentId":"e947aa52-e196-4d7c-aeb6-5ad7673ccc1e"}
- PASS hypothesis_missing: {"engine":"hubspot_sequence","engineEventId":"gap6d-1790522179501-evt-nohyp","outcome":"HYPOTHESIS_MISSING","accountName":"GAP E2E 6D NoHyp gap6d-1790522179501","hypothesisId":null,"enrollmentId":null}
- PASS identity_unresolved: {"engine":"hubspot_sequence","engineEventId":"gap6d-1790522179501-evt-unknown","outcome":"IDENTITY_UNRESOLVED","accountName":null,"hypothesisId":null,"enrollmentId":null,"detail":"unresolved_company"}
- PASS freeze_trigger: reattribution refused by the real trigger
- PASS already_imported: {"engine":"hubspot_sequence","engineEventId":"gap6d-1790522179501-evt-matched","outcome":"ALREADY_IMPORTED","accountName":null,"hypothesisId":"cmujyobun00017kqosgg97ao1","enrollmentId":"e947aa52-e196-4d7c-aeb6-5ad7673ccc1e"}

## Counts

- cleanup.conversation_dispositions: 1
- cleanup.sequence_enrollments: 1
- cleanup.prospecting_hypotheses: 1
- cleanup.sequence_versions: 1
- cleanup.sequence_families: 1
- cleanup.accounts: 2

Every row the run created was deleted in the finally block; zero-leftover count asserted above.
