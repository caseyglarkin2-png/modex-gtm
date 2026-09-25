# 6B execution contract end-to-end run (latest)

STATUS: PASS

<!-- verified:2026-09-24 -->

Written by `scripts/gap/e2e-6b.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap6b-1790290942975
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: d67b6466
- Ran at: 2026-09-24T23:02:23.129Z

## Steps

- PASS seed: account, persona, family, 2 versions (A stale-compile, C expired-evidence), 2 compiles (A ~40h old, C fresh), 2 hypotheses (A no signals, C linked to an expired signal)
- PASS plain_shadow: {"engine":"modex_queue","status":"shadow","engineId":null,"createdAt":"2026-09-24T23:02:23.013Z"}
- PASS compile_stale: {"engine":"modex_queue","status":"refused","engineId":null,"createdAt":"2026-09-24T23:02:23.013Z","refusalReason":"compile_stale:0"}
- PASS evidence_expired: {"engine":"modex_queue","status":"refused","engineId":null,"createdAt":"2026-09-24T23:02:23.013Z","refusalReason":"evidence_expired"}

## Counts

- cleanup.hypothesis_signals: 1
- cleanup.gap_compiles: 2
- cleanup.prospecting_hypotheses: 2
- cleanup.prospecting_signals: 1
- cleanup.sequence_versions: 2
- cleanup.sequence_families: 1
- cleanup.personas: 1
- cleanup.accounts: 1

Every row the run created was deleted in the finally block; zero-leftover count asserted above. Every enroll in this run was shadow mode: no queue item, no HubSpot call, no send.
