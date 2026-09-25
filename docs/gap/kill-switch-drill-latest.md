# Kill-switch drill (latest)

STATUS: PASS

<!-- verified:2026-09-24 -->

Written by `scripts/gap/kill-switch-drill.ts`. Never touches the real clawd autonomy halt -- proves the MECHANISM with an injected fake autonomy reader against real database fixtures on the scratch DB.

- Run tag: killdrill-1790292690017
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: 989802a4
- Ran at: 2026-09-24T23:31:30.157Z

## Steps

- PASS seed: account, persona, hypothesis, family/version/compile for the drill
- PASS not_halted_autonomy_step_passes: {"ok":false,"reason":"compiler_disabled"}
- PASS halted_refuses_immediately: {"ok":false,"reason":"autonomy_halted","detail":"drill"}
- PASS drill_logged: automation.kill_switch_drill row stored

## Cleanup

- gap_audit_events: 1
- gap_compiles: 1
- prospecting_hypotheses: 1
- sequence_versions: 1
- sequence_families: 1
- personas: 1
- accounts: 1

Every row the run created was deleted in the finally block; zero-leftover count asserted above. The real clawd autonomy halt was never read, reversed, or otherwise touched.
