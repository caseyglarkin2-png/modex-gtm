# Intelligence wiring: the one checklist (October 9, 2026)

STATUS: ACTIVE. The consolidated scope (the wiring plan IW01-IW16, the second list 1-11, the Google Workspace and Gemini extension 12-22, the reuse inventory 23-29, the Manifest-era pair 1-5, and Casey's four priorities), each item with its state and a concrete reference. The outcome: useful information we already collect reaches Casey's GAP briefing and inbox with substance, sources, dates and uncertainty; Casey judges usefulness; nothing needs verification, a resolved account, an outreach angle or a task before he can see it. States: DONE, IN PROGRESS, BLOCKED (what unblocks it), REMAINING. Implemented, deployed, delivered and seller-accepted are four different words. <!-- verified:2026-10-09 -->

## Priority 1: the existing path to the inbox

| Item | State | Reference |
|---|---|---|
| The intelligence-wiring release (PR #440) merged and deployed | IN PROGRESS | PR #440 open; the gate 89 suites / 183 tests / 0 failed on the merged tree; merge and deploy under the existing permission once the Priority 1 code below is on the branch |
| The production import of the captured reports | REMAINING | `scripts/gap/import-intelligence-batch.ts --apply` with the fixture after the deploy |
| Substantive intelligence ahead of old prepared angles | DONE (code) | `work/briefing.ts` renderPursued: Pursued follows the intelligence sections, capped at three, the rest on Work |
| Complete browsing, pagination, filters, dispositions, overflow counts | DONE (code) | `signals/intelligence-browse.ts`, `/gap/intelligence`, `iw-browse.test.ts`; the harness's omitted count and full-list link |
| Event/report date apart from collection apart from import | DONE (code) | the record contract (`eventDate`, `reportedOn`, `collectedAt`, `importedAt`); the email's "Reported ... imported ..." line; producer status "reports through X, imported Y" |
| The verified SUBZERO alias | BLOCKED, honest | no GAP account named Sub-Zero exists in production (no account, alias, persona or canonical company matches "zero"); the record keeps the hint "SUBZERO" visibly; an alias needs an account to point at: Casey adds Sub-Zero through Add to GAP, or names the account it belongs to |
| Persisted records to reader to rendered email to mailbox, verified | IN PROGRESS | the read-only preview proves record to reader to email (`docs/gap/INTELLIGENCE_BRIEFING_PREVIEW_2026-10-09.md`, eight checks PASS); the mailbox delivery follows the deploy and the import (an internal resend) |

## Priority 2: the producers

| Item | State | Reference |
|---|---|---|
| Clawd export, incremental, candidates included, no Pounce/Slack/CRM | IN PROGRESS | producer side built on the Clawd branch `feat/intel-export` (5106e448, not pushed); consumer `signals/clawd-import.ts` + cron `/api/cron/gap-clawd-import` (every two hours, three pages, one retry, a failed ledger row) written; the Clawd push and deploy remain |
| Codex structured export to a recurring consumer | IN PROGRESS | `scripts/gap/consume-export-folder.ts` (idempotent by path and hash, state file, one retry, failures recorded) written; the scheduled run and the prompt amendment (verbatim in `INTELLIGENCE_PRODUCER_HANDOFF.md`) remain under Casey's authority |
| Yards First Brief and Signal Desk export/import path | IN PROGRESS | the Markdown fallback and the fenced JSON block both read by `signals/export-folder.ts`; one step: save the issue into the watched folder |
| Vault/Fireflies sync and useful passages | IN PROGRESS | the local push now records the vault's git revision; the cron waits for `GAP_VAULT_GITHUB_TOKEN`; passages surface through `knowledge/knowledge-intel.ts` |
| Producer failures, backlog, freshness; reimport never looks current | DONE (code) | `signals/producer-status.ts` (never/current/stalled/failed; two dates), health "Intelligence producers", the coverage paragraph |

## Priority 3: Google Workspace and Gemini

| Item | State | Reference |
|---|---|---|
| Drive inventory, metadata first | DONE | the inventory in the ledger section: Meet Recordings (Gemini notes), the prospect yard-audit folders (Docs, Markdown, Sheets per account), Gemini Artifacts (a canvas: export only), images and receipts (not intelligence) |
| Docs, Sheets, Slides, PDF, DOCX, XLSX, PPTX, Markdown, text | IN PROGRESS | `signals/drive-parsers.ts` (Docs by heading, Sheets by tab with cell references, Slides by number, Gemini notes without the transcript); PPTX with image-only slides flagged unreadable; the session reader handles PDF/DOCX/XLSX; the unattended sync needs a Drive credential |
| Gemini-generated work, labelled, citations kept | IN PROGRESS | Notes by Gemini as producer `gemini_notes` (generated, never the transcript); the Gemini canvas needs one export step (Share, Export to Docs) into the watched folder |
| Incremental sync, deletions, lost access | REMAINING | `signals/drive-sync.ts` with the changes token; BLOCKED for the unattended run on a `drive.readonly` credential |
| Duplicate evidence grouped across copies | IN PROGRESS | the same meeting as a Fireflies capture (vault) and Gemini notes (Drive): grouped by account and date, each source kept |

## Priority 4: recovery from existing systems

| Item | State | Reference |
|---|---|---|
| sales-agent / CaseyOS / Jarvis inventory | IN PROGRESS | one bounded read-only inventory running; Jarvis lives inside clawd-control-plane (`scripts/jarvis*.py`); no separate sales-agent checkout under the home directory |
| GTM-YardFlow + YardFlow-Hitlist (Manifest era) | IN PROGRESS | in the same inventory: stores, endpoints, retained research, seed versus real |
| Flow-State- content and war-room dossiers | REMAINING | after the inventory names what adds information |
| One real retained Manifest-era record in the briefing | REMAINING | depends on the inventory's read interface |

## The consolidated request (filled when everything independent is ready)

To be written once: the credentials and authorizations genuinely missing, each with the exact variable or step.
