# 6D generic reconciler end-to-end run (latest)

STATUS: PASS

<!-- verified:2026-09-27 -->

Written by `scripts/gap/e2e-6d.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap6d-1790472905719
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: 409dbc2c
- Ran at: 2026-09-27T01:35:05.960Z

## Steps

- PASS seed: 2 accounts, 1 hypothesis, 1 family/version/enrollment for the matched contact gap6d-1790472905719@example.com
- PASS matched: {"engine":"hubspot_sequence","engineEventId":"gap6d-1790472905719-evt-matched","outcome":"MATCHED","accountName":"GAP E2E 6D Matched gap6d-1790472905719","hypothesisId":"cmuj5c7yk00017kogde8uoyu3","enrollmentId":"1c16ac47-4e14-4f30-9889-b37b34e1ad0d"}
- PASS hypothesis_missing: {"engine":"hubspot_sequence","engineEventId":"gap6d-1790472905719-evt-nohyp","outcome":"HYPOTHESIS_MISSING","accountName":"GAP E2E 6D NoHyp gap6d-1790472905719","hypothesisId":null,"enrollmentId":null}
- PASS identity_unresolved: {"engine":"hubspot_sequence","engineEventId":"gap6d-1790472905719-evt-unknown","outcome":"IDENTITY_UNRESOLVED","accountName":null,"hypothesisId":null,"enrollmentId":null,"detail":"unresolved_company"}
- PASS freeze_trigger: reattribution refused by the real trigger
- PASS already_imported: {"engine":"hubspot_sequence","engineEventId":"gap6d-1790472905719-evt-matched","outcome":"ALREADY_IMPORTED","accountName":null,"hypothesisId":"cmuj5c7yk00017kogde8uoyu3","enrollmentId":"1c16ac47-4e14-4f30-9889-b37b34e1ad0d"}

## Counts

- cleanup.conversation_dispositions: 1
- cleanup.sequence_enrollments: 1
- cleanup.prospecting_hypotheses: 1
- cleanup.sequence_versions: 1
- cleanup.sequence_families: 1
- cleanup.accounts: 2

Every row the run created was deleted in the finally block; zero-leftover count asserted above.
