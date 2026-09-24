# 6A canonical identity end-to-end run (latest)

STATUS: PASS

<!-- verified:2026-09-24 -->

Written by `scripts/gap/e2e-6a.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap6a-1790289866954
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: fd89e6cf
- Ran at: 2026-09-24T22:44:27.094Z

## Steps

- PASS seed.accounts: created GAP E2E Niagara Bottling gap6a-1790289866954, GAP E2E Real Account gap6a-1790289866954 (hubspot_company_id=hs-gap6a-1790289866954), GAP E2E Wrong Guess Co gap6a-1790289866954
- PASS seed.triggers: niagara="GAP E2E Niagara Bottling gap6a-1790289866954, LLC" unknown="Totally Unknown Company gap6a-1790289866954" conflict=(name="GAP E2E Wrong Guess Co gap6a-1790289866954", hubspot_company_id=hs-gap6a-1790289866954)
- PASS run.hypothesize: identity={"resolved":2,"aliasesRegistered":1,"conflicts":1,"refused":{"unresolved_company":1}}
- PASS assert.conflict: resolved=GAP E2E Real Account gap6a-1790289866954 conflict=GAP E2E Wrong Guess Co gap6a-1790289866954 audited=true
- PASS assert.alias_speeds_up_next_lookup: via=alias confidence=90

## Counts

- identityResolved: 2
- identityConflicts: 1
- identityAliasesRegistered: 1
- identityRefusedUnresolved: 1
- cleanup.gap_audit_events: 1
- cleanup.gap_account_aliases: 1
- cleanup.prospecting_signals: 2
- cleanup.pounce_triggers: 3
- cleanup.accounts: 3

Every row the run created was deleted in the finally block (gap_audit_events, gap_account_aliases, prospecting_signals, pounce_triggers, accounts); zero-leftover counts asserted above.
