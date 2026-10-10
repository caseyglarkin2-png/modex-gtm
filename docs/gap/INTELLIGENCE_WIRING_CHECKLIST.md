# Intelligence wiring: the one checklist (October 9, 2026)

STATUS: ACTIVE. The consolidated scope (the wiring plan IW01-IW16, the second list 1-11, the Google Workspace and Gemini extension 12-22, the reuse inventory 23-29, the Manifest-era pair 1-5, the war-room adapter 1-8, and Casey's four priorities), each item with its state and a concrete reference. The outcome: useful information we already collect reaches Casey's GAP briefing and inbox with substance, sources, dates and uncertainty; Casey judges usefulness; nothing needs verification, a resolved account, an outreach angle or a task before he can see it. States: DONE, IN PROGRESS, BLOCKED (what unblocks it), REMAINING. Implemented, deployed, delivered and seller-accepted are four different words. <!-- verified:2026-10-09 -->

## Release 1 (this release): what shipped

- MERGED: PR #440 (modex-gtm main d40d1d18), the Clawd control plane PR #66 (main 31bda6b8).
- DEPLOYED: Vercel `dpl_2r6v1tupEznWHEKqrUdcFu7FNVre` READY 2026-10-09T23:55:53Z on d40d1d18 (rollback 16a6d67c `dpl_EaydYUttH4KJpvJQtB2y5CEXxqep`); the Clawd export live on Railway (the cron imported from it).
- PERSISTED: 159 report records imported into production (Yards First Brief 129 rows incl. 46 containers, Signal Desk 26, HubSpot report 4), then 159 duplicates on the second run (ledger rows cmv1mk0uq00007kyk8egxs6ma, cmv1mk11300017kykrve6vz9c, cmv1mk14k00027kyk6rvs3eq7); the Clawd cron's first run imported 243 items, a second run 196 more before the function's time ran out (the cursor advanced per page; the bound is one page of a hundred from the follow-up commit).
- DELIVERED: the internal briefing resent 2026-10-09T23:59:59Z, Gmail message 1a1231bfaa5d161d (plan revision 3, 13 items), its ledger row recording 11 intelligence keys (2 from the briefs, 2 GAP found, 1 trigger, 1 from the vault, 5 people), 3,800 omitted, and the coverage paragraph naming the three briefs, the Clawd hunter and the vault with their report and import dates.
- RECEIPT: `docs/gap/INTELLIGENCE_BRIEFING_RECEIPT_2026-10-09.md` rendered from the persisted rows alone (no overlay): eight named checks PASS (the Kodiak caveat in text and HTML, the 7-Eleven uncertainty, the Sub-Zero ids, World Market unresolved, Southern Glazer's parked, no plan item from an import, no production write, no approval row).
- CONFIGURED: `GAP_INTEL_IMPORT_TOKEN` in Vercel production (the producers' door); the local `~/.gap/consumer.env`; the Codex automation prompt amended (the structured export into `Documents\New project\gap-exports`); the watched folder created.
- ACCEPTED: nothing; Casey judges the content.

## Priority 1: the existing path to the inbox

| Item | State | Reference |
|---|---|---|
| The release merged and deployed | DONE | above |
| The production import of the captured reports | DONE | above; a second import made duplicates, not copies |
| Substantive intelligence ahead of old prepared angles | DONE, DEPLOYED | `work/briefing.ts` renderPursued after the intelligence sections, capped at three |
| Complete browsing, pagination, filters, dispositions, overflow counts | DONE, DEPLOYED | `/gap/intelligence`, `signals/intelligence-browse.ts`; the email's omitted count and full-list link |
| Event/report date apart from collection apart from import | DONE, DEPLOYED | the contract fields; the email's "Reported ... imported ..." line; the producer line "reports through X, imported Y" (follow-up commit) |
| The verified SUBZERO alias | BLOCKED, honest | no GAP account named Sub-Zero exists (no account, alias, persona or canonical company); the record keeps the hint visibly; Casey adds the account or names the one it belongs to |
| Persisted records to reader to email to mailbox, verified | DONE | the receipt above; the sent row's selection and coverage read back from production |

## Priority 2: the producers

| Item | State | Reference |
|---|---|---|
| Clawd export, incremental, candidates included, no Pounce/Slack/CRM | DONE, DEPLOYED | Clawd PR #66; `/api/cron/gap-clawd-import` every two hours (one page of a hundred per run from the follow-up commit; one retry; a failed ledger row) |
| Codex structured export to a recurring consumer | IN PROGRESS | the amendment applied to `automation.toml`; `scripts/gap/consume-export-folder.ts` runs by hand or on a schedule; the scheduled-task registration was refused to the agent by the permission classifier: Casey runs one command (in the consolidated request) |
| Yards First Brief and Signal Desk export/import path | DONE (code) | save the issue into the watched folder; the consumer reads the fenced JSON block or the Markdown fallback |
| Vault/Fireflies sync and useful passages | IN PROGRESS | the local push records the vault's git revision (follow-up commit); the cron waits for `GAP_VAULT_GITHUB_TOKEN`; passages surface through `knowledge/knowledge-intel.ts` |
| Producer failures, backlog, freshness; reimport never looks current | DONE, DEPLOYED | `signals/producer-status.ts`, health "Intelligence producers", the coverage paragraph |

## Priority 3: Google Workspace and Gemini (follow-up release)

| Item | State | Reference |
|---|---|---|
| Drive inventory, metadata first | DONE | Meet Recordings (Notes by Gemini: Kenco Discovery Jul 16, Kenco Aug 5, Ball Corp Jul 16 and Jul 23, Mondelez May 19, Sales Standup and Weekly Round Up Oct 9), the prospect yard-audit folders (Crowley, United Natural Foods, Niagara Bottling, Bob Evans Farms, Westrock Coffee: Docs, Markdown, Sheets), Gemini Artifacts (one Gemini canvas, export only), decks (Boston Beer onsite, GM, Volkswagen, Kenco demo), many images and receipts (not intelligence) |
| Docs, Sheets, Slides, PDF, DOCX, XLSX, PPTX, Markdown, text | IN PROGRESS | fixtures captured (`tests/fixtures/gap/drive/`: the Crowley dossier as a Doc and as its Markdown twin, the Crowley yard-audit Sheet, the Boston Beer Slides, the Kenco Gemini notes); the parsers and the records are the follow-up release; the Inland26 tactical dossier PPTX yields no text (image-only slides): flagged unreadable, never recorded as extracted |
| Gemini-generated work, labelled | IN PROGRESS | the Notes by Gemini carry the transcript: the parser takes the notes, never the transcript; the Gemini canvas needs one export step |
| Incremental sync, deletions, lost access | BLOCKED | needs a Google credential with `drive.readonly` in Vercel (the Gmail refresh token has no Drive scope) |
| Duplicate evidence grouped across copies | REMAINING | the Kenco Discovery of July 16 exists as the vault's Fireflies capture and as Gemini notes: to be grouped by account and date in the follow-up |

## Priority 4: recovery from existing systems

| Item | State | Reference |
|---|---|---|
| sales-agent / CaseyOS / Jarvis inventory | IN PROGRESS | one bounded read-only inventory running (Jarvis lives in clawd-control-plane) |
| GTM-YardFlow + YardFlow-Hitlist | IN PROGRESS | in the same inventory |
| war-room adapter (dossiers, PIC, snapshots, engagement, dispositions, briefs; its deployment mechanism) | IN PROGRESS | in the same inventory; the existing connections (`review-feed.ts`, `import/pic.ts`) preserved |
| Flow-State- content and war-room dossiers | REMAINING | after the inventory |
| One real retained Manifest-era record in the briefing | REMAINING | after the inventory |

## The consolidated request (what only Casey can do)

1. The export-folder consumer's schedule: run once in a PowerShell window (the agent's registration was refused by the permission classifier):
   `$a = New-ScheduledTaskAction -Execute "cmd.exe" -Argument '/c cd /d C:\Users\casey\wt-gap-account-first-ux && npx tsx scripts\gap\consume-export-folder.ts --once >> C:\Users\casey\.gap\consumer.log 2>&1'; $t = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Minutes 30) -RepetitionDuration (New-TimeSpan -Days 3650); Register-ScheduledTask -TaskName "GAP export folder consumer" -Action $a -Trigger $t -Force`
2. `GAP_VAULT_GITHUB_TOKEN` in Vercel production: a fine-grained GitHub token, read-only Contents on `caseyglarkin2-png/yardflow-gtm-vault`, so the vault cron syncs without the local push.
3. A Google credential with `drive.readonly` for the unattended Drive sync (a refresh token for casey@freightroll.com with that scope, as `GAP_DRIVE_REFRESH_TOKEN`), when the Drive follow-up release is ready.
4. Sub-Zero: add the account through Add to GAP (or name the account the SUBZERO contact belongs to) so the alias can point somewhere.
5. The Gemini canvas "Order of Operations Thesis Asset": Share, Export to Docs, into the Gemini Artifacts folder, when wanted in the import.
