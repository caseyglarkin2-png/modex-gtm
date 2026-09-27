# 6A canonical identity end-to-end run (latest)

STATUS: PASS

<!-- verified:2026-09-27 -->

Written by `scripts/gap/e2e-6a.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap6a-1790472903306
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: 409dbc2c
- Ran at: 2026-09-27T01:35:03.488Z

## Steps

- PASS seed.accounts: created GAP E2E Niagara Bottling gap6a-1790472903306, GAP E2E Real Account gap6a-1790472903306 (hubspot_company_id=hs-gap6a-1790472903306), GAP E2E Wrong Guess Co gap6a-1790472903306
- PASS seed.triggers: niagara="GAP E2E Niagara Bottling gap6a-1790472903306, LLC" unknown="Totally Unknown Company gap6a-1790472903306" conflict=(name="GAP E2E Wrong Guess Co gap6a-1790472903306", hubspot_company_id=hs-gap6a-1790472903306)
- PASS run.hypothesize: identity={"resolved":2,"aliasesRegistered":1,"conflicts":1,"refused":{"unresolved_company":1}}
- PASS assert.conflict: resolved=GAP E2E Real Account gap6a-1790472903306 conflict=GAP E2E Wrong Guess Co gap6a-1790472903306 audited=true
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
