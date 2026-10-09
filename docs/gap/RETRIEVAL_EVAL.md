# GAP OS retrieval evaluation (C53)

STATUS: MEASUREMENT, generated 2026-10-09T04:23:27.215Z by scripts/gap/retrieval-eval.ts over reference set v2 (12 cases, 24 runs: each case whole and with one source removed). Sink adapters, the real assembler; no model, no network. Regenerate rather than edit.
<!-- verified:2026-10-09 -->

## Per class (failures over runs checked; never one aggregate score)

| Class | Checked | Failures |
|---|---|---|
| source_recall | 24 | 0 |
| claim_provenance | 24 | 0 |
| thread_coverage | 24 | 0 |
| conflict_handling | 24 | 0 |
| unauthorized_exclusion | 24 | 0 |
| instruction_safety | 24 | 0 |
| opportunity_status | 24 | 0 |

## Runs

- kenco-positive (full): 3 claims, 4 timeline events, opportunity open; reads: identity.read, crm.read, gmail.read, vault.readFile, clawd.fetchSnapshot, public.read, commitments.read
- kenco-positive (missing_source): 3 claims, 4 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, vault.readFile, clawd.fetchSnapshot, public.read, commitments.read; gaps: crm: no read returned
- ambiguous-subsidiary (full): 1 claims, 1 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, commitments.read; gaps: crm: no read returned; vault: no account to read; clawd: no account to read; public: not configured
- ambiguous-subsidiary (missing_source): 1 claims, 1 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, commitments.read; gaps: crm: no read returned; vault: no account to read; clawd: no account to read; public: not configured
- pepsi-repeats (full): 3 claims, 0 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, vault.readFile, clawd.fetchSnapshot, vault.readFile, public.read, commitments.read; gaps: crm: no read returned
- pepsi-repeats (missing_source): 2 claims, 0 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, vault.readFile, clawd.fetchSnapshot, vault.readFile, public.read, commitments.read; gaps: crm: no read returned
- hormel-2018 (full): 1 claims, 0 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, vault.readFile, clawd.fetchSnapshot, vault.readFile, public.read, commitments.read; gaps: crm: no read returned
- hormel-2018 (missing_source): 0 claims, 0 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, vault.readFile, clawd.fetchSnapshot, vault.readFile, public.read, commitments.read; gaps: crm: no read returned
- general-mills-2013 (full): 2 claims, 0 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, vault.readFile, clawd.fetchSnapshot, vault.readFile, public.read, commitments.read; gaps: crm: no read returned
- general-mills-2013 (missing_source): 1 claims, 0 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, vault.readFile, clawd.fetchSnapshot, vault.readFile, public.read, commitments.read; gaps: crm: no read returned
- lazer-support (full): 1 claims, 1 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, vault.readFile, clawd.fetchSnapshot, vault.readFile, public.read, commitments.read; gaps: crm: no read returned
- lazer-support (missing_source): 0 claims, 0 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, vault.readFile, clawd.fetchSnapshot, vault.readFile, public.read, commitments.read; gaps: crm: no read returned
- riserify-vendor (full): 1 claims, 1 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, commitments.read; gaps: crm: no read returned; vault: no account to read; clawd: no account to read; public: not configured
- riserify-vendor (missing_source): 0 claims, 0 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, commitments.read; gaps: crm: no read returned; vault: no account to read; clawd: no account to read; public: not configured
- suspicious-invite (full): 1 claims, 1 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, commitments.read; gaps: crm: no read returned; vault: no account to read; clawd: no account to read; public: not configured
- suspicious-invite (missing_source): 0 claims, 0 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, commitments.read; gaps: crm: no read returned; vault: no account to read; clawd: no account to read; public: not configured
- opt-out (full): 2 claims, 1 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, vault.readFile, clawd.fetchSnapshot, vault.readFile, public.read, commitments.read; gaps: crm: no read returned
- opt-out (missing_source): 1 claims, 0 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, vault.readFile, clawd.fetchSnapshot, vault.readFile, public.read, commitments.read; gaps: crm: no read returned
- old-unanswered-reply (full): 1 claims, 2 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, vault.readFile, clawd.fetchSnapshot, vault.readFile, public.read, commitments.read; gaps: crm: no read returned
- old-unanswered-reply (missing_source): 1 claims, 1 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, vault.readFile, clawd.fetchSnapshot, vault.readFile, public.read, commitments.read; gaps: crm: no read returned
- two-deals (full): 1 claims, 1 timeline events, opportunity open; reads: identity.read, crm.read, gmail.read, vault.readFile, clawd.fetchSnapshot, vault.readFile, public.read, commitments.read
- two-deals (missing_source): 1 claims, 1 timeline events, opportunity open; reads: identity.read, crm.read, gmail.read, vault.readFile, clawd.fetchSnapshot, vault.readFile, public.read, commitments.read
- model-outage (full): 1 claims, 1 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, vault.readFile, clawd.fetchSnapshot, vault.readFile, public.read, commitments.read; gaps: crm: no read returned
- model-outage (missing_source): 0 claims, 0 timeline events, opportunity unknown; reads: identity.read, crm.read, gmail.read, vault.readFile, clawd.fetchSnapshot, vault.readFile, public.read, commitments.read; gaps: crm: no read returned
