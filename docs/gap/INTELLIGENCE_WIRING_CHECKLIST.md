# Intelligence wiring: the one checklist (October 9, 2026)

STATUS: ACTIVE. The consolidated scope (the wiring plan IW01-IW16, the second list 1-11, the Google Workspace and Gemini extension 12-22, the reuse inventory 23-29, the Manifest-era pair 1-5, the war-room adapter 1-8, and Casey's four priorities), each item with its state and a concrete reference. The outcome: useful information we already collect reaches Casey's GAP briefing and inbox with substance, sources, dates and uncertainty; Casey judges usefulness; nothing needs verification, a resolved account, an outreach angle or a task before he can see it. States: DONE, IN PROGRESS, BLOCKED (what unblocks it), REMAINING. Implemented, deployed, delivered and seller-accepted are four different words. <!-- verified:2026-10-10 -->

## Release 1: what shipped (October 9 and 10, 2026)

- MERGED: modex-gtm PR #440 (main d40d1d18), PR #441 (main 03572037), PR #442 (this follow-up); the Clawd control plane PR #66 (main 31bda6b8).
- DEPLOYED: Vercel `dpl_2r6v1tupEznWHEKqrUdcFu7FNVre` READY 2026-10-09T23:55:53Z on d40d1d18, then `dpl_DyLYkLPzgK8qFxE8Sg8A2QtYkDaT` READY 2026-10-10T00:11:38Z on 03572037 (rollback 16a6d67c `dpl_EaydYUttH4KJpvJQtB2y5CEXxqep`); the Clawd export live on Railway at 31bda6b8.
- PERSISTED in production `gap_signals`: 159 report records (the three briefs; the second import 159 duplicates, ledger cmv1mk0uq00007kyk8egxs6ma, cmv1mk11300017kykrve6vz9c, cmv1mk14k00027kyk6rvs3eq7); 58 war-room dossier records (ledger cmv1n2xao001m7kz88lam9rg7); the Clawd cron's runs 243, 196 (interrupted by the function's time; the cursor advanced per page), then 61 accepted and 39 duplicates under the one-page bound, the cursor advancing (`1970-01-01|1512`: the rows without a fetched_at come first).
- DELIVERED: the internal briefing resent 2026-10-09T23:59:59Z, Gmail message 1a1231bfaa5d161d (plan revision 3, 13 items), its ledger row recording 11 intelligence keys (2 from the briefs, 2 GAP found, 1 trigger, 1 from the vault, 5 people), 3,800 omitted, and the coverage paragraph naming the three briefs, the Clawd hunter and the vault with their report and import dates.
- RECEIPTS from the persisted rows alone: `docs/gap/INTELLIGENCE_BRIEFING_RECEIPT_2026-10-09.md` (six slots: eight named checks PASS) and `-wide.md` (twelve slots: a war-room dossier record, a HubSpot-report engagement and two vault calls on the same page).
- CONFIGURED: `GAP_INTEL_IMPORT_TOKEN` in Vercel production and `~/.gap/consumer.env`; the Codex automation prompt amended for its structured export; the watched folder `Documents\New project\gap-exports` created; the vault pushed with its git revision recorded.
- ACCEPTED: nothing; Casey judges the content.

## Priority 1: the existing path to the inbox

| Item | State | Reference |
|---|---|---|
| The release merged and deployed | DONE | above |
| The production import of the captured reports | DONE | above; a second import made duplicates, not copies |
| Substantive intelligence ahead of old prepared angles | DONE, DEPLOYED | Pursued follows the intelligence sections, capped at three |
| Complete browsing, pagination, filters, dispositions, overflow counts | DONE, DEPLOYED | `/gap/intelligence`; the email's omitted count and full-list link |
| Event/report date apart from collection apart from import | DONE, DEPLOYED | the contract; "Reported ... imported ..."; "reports through X, imported Y" |
| The verified SUBZERO alias | BLOCKED, honest | no GAP account named Sub-Zero exists; the record keeps the hint visibly |
| Persisted records to reader to email to mailbox, verified | DONE | the receipts; the sent row's selection and coverage read back from production |

## Priority 2: the producers

| Item | State | Reference |
|---|---|---|
| Clawd export, incremental, candidates included, no Pounce/Slack/CRM | DONE, DEPLOYED, RUNNING | Clawd PR #66; `/api/cron/gap-clawd-import` every two hours, one page of a hundred, the cursor on the ledger, duplicates proven |
| Codex structured export to a recurring consumer | IN PROGRESS | the amendment applied; `consume-export-folder.ts` runs by hand; its scheduled task needs Casey's one command (the classifier refused the agent) |
| Yards First Brief and Signal Desk export/import path | DONE (code) | save the issue into the watched folder |
| Vault/Fireflies sync and useful passages | DONE (local), BLOCKED (cron) | the push of October 10 recorded the vault's git revision; the cron waits for `GAP_VAULT_GITHUB_TOKEN` |
| Producer failures, backlog, freshness; reimport never looks current | DONE, DEPLOYED | producer status, health, the coverage paragraph |

## Priority 3: Google Workspace and Gemini (follow-up release)

| Item | State | Reference |
|---|---|---|
| Drive inventory, metadata first | DONE | Meet Recordings (Notes by Gemini), the prospect yard-audit folders, Gemini Artifacts (a canvas, export only), decks, images and receipts (not intelligence) |
| Docs, Sheets, Slides, PDF, DOCX, XLSX, PPTX, Markdown, text | IN PROGRESS | fixtures in `tests/fixtures/gap/drive/`; the parsers are the follow-up; the Inland26 PPTX yields no text (image-only): flagged unreadable, never recorded as extracted; the recent PDFs are receipts and our own collateral; the recent CSV is a contact list with personal data, skipped by choice |
| Gemini-generated work, labelled | IN PROGRESS | the notes carry the transcript: the parser takes the notes, never the transcript; the canvas needs one export step |
| Incremental sync, deletions, lost access | BLOCKED | a Google credential with `drive.readonly` |
| Duplicate evidence grouped across copies | REMAINING | the Kenco Discovery of July 16 as a Fireflies capture and as Gemini notes |

## Priority 4: recovery from existing systems (the inventory of October 9, bounded, read only)

| Item | State | Reference |
|---|---|---|
| Jarvis / sales-agent | NO DEMONSTRATED BENEFIT | Jarvis is a proxy layer inside clawd-control-plane whose upstream paths are not served (`scripts/jarvis.py`, `mc_routes_jarvis.py`, `jarvis_dispatch.py`: autonomous dispatch, never activate); `sales-agent` on GitHub (last push June 2, 2026) was not read |
| Clawd collectors | REUSE NOW (done) | the signals export is the one interface; the intel ledger re-ingests GAP's own streams (never import it back); push-hubspot, signal_actuator and actuator_send write or send (never run) |
| The vault automation | ALREADY CONNECTED | the single path for Fireflies, calendar, self-mail and the war-room imports; `hubspot-sync.mjs` writes HubSpot daily (untouched) |
| GTM-YardFlow + YardFlow-Hitlist (Manifest era) | NO DEMONSTRATED BENEFIT, one option | seed lists (2,652 companies, 5,408 people, no sources) and Gemini text without URLs; only the Hitlist meetings and outreach history (dated, with Gmail thread ids) would be worth a one-time read through `GET /api/export/full?format=json` with its service key, if that Railway service and database still exist (unverified); never its frontend, sequences or crons; both repos are public with attendee names and a hardcoded seed password (Casey's call) |
| war-room | DONE (adapter), BLOCKED (feed) | existing connections traced: GAP posts review telemetry to `/api/review/log` (none since September 26 for want of the right token: the war-room's token differs from the Clawd token modex holds, and it is a sensitive variable that cannot be read back) and imports the PIC by a manual dry-run CLI (never applied to production; the charts are on disk, not on GitHub); the stores: dossiers (seller interpretation, reach GAP via the vault), intel snapshots (a copy of Clawd), engagement and heat (context), call dispositions (also in HubSpot), the daily brief (an action route, never called); the adapter `scripts/gap/import-warroom-dossiers.ts` reads the 58 dossier files from the war-room's git checkout, keeps the why-now evidence and findings, labels the intent score and views context, leaves the talk track out, and is a revision on change; imported into production; a war-room record on the twelve-slot preview; the war-room deploys by manual CLI upload (not git-connected; the last deploy August 24, 2026) so nothing of it was changed |
| Flow-State- content | NO DEMONSTRATED BENEFIT | our own site content, not prospect intelligence |

## Priority 5: the Gmail action UI (the audit of October 9, GUI-01 to GUI-12; appended October 10)

| Item | State | Reference |
|---|---|---|
| GUI-01 trace the deployed digest and START assignment renderers; the field map | DONE | `scripts/gap/preview-assignments.ts` (read only; four real packets in `docs/gap/ASSIGNMENT_PACKETS_PREVIEW_2026-10-10.md`); the field map `docs/gap/GMAIL_ACTION_UI_FIELD_MAP.md` |
| GUI-02 one shared assignment view model | IN PROGRESS | builder D: `work/assignment-packet.ts` |
| GUI-03 business contact details and CRM/profile links | IN PROGRESS | builder D: `people/contact-packet.ts` (persona phone, LinkedIn, HubSpot ids; a bounded live contact read; unavailable said, never guessed) |
| GUI-04 original-source excerpts with separated dates | IN PROGRESS | builder D (the story rows and the imported records' substance) |
| GUI-05 relationship reconciliation before proposing actions | IN PROGRESS | builder D: `work/relationship-state.ts` (Phil's request: fulfilled, unfulfilled or unknown) |
| GUI-06 relationship purpose and suppression labels | IN PROGRESS | builder D (STOP first; vendor, media, administrative labelled) |
| GUI-07 prepared-state wording matches the material | IN PROGRESS | builder D on top of the IW15 hold |
| GUI-08 sales-asset links and deal context | IN PROGRESS | builder D |
| GUI-09 direct item selection and exact command effects | IN PROGRESS | builder E: `ITEM <n>` on the existing command handler; no GET link sends |
| GUI-10 activity reconciliation verified | IN PROGRESS | builder E (focused tests over the existing recovery, idempotency and receipts) |
| GUI-11 templates simplified | IN PROGRESS | builder E on the digest; builder D on the assignment; `work/clean-text.ts` |
| GUI-12 representative packets and one inbox round trip | REMAINING | the preview harness on the merged tree: Kenco, Boston Beer, PepsiCo, Walmart, an information-only signal, an admin item; the round trip is Casey's reply |

## The consolidated request (what only Casey can do)

1. The export-folder consumer's schedule, one PowerShell command (the agent's registration was refused by the permission classifier):
   `$a = New-ScheduledTaskAction -Execute "cmd.exe" -Argument '/c cd /d C:\Users\casey\wt-gap-account-first-ux && npx tsx scripts\gap\consume-export-folder.ts --once >> C:\Users\casey\.gap\consumer.log 2>&1'; $t = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Minutes 30) -RepetitionDuration (New-TimeSpan -Days 3650); Register-ScheduledTask -TaskName "GAP export folder consumer" -Action $a -Trigger $t -Force`
2. `WAR_ROOM_TOKEN` in modex production, set to the war-room's own `MC_API_TOKEN` value (a sensitive variable the agent cannot read back), then a redeploy, so GAP's review telemetry reaches the war-room again.
3. `GAP_VAULT_GITHUB_TOKEN` in Vercel production: a fine-grained GitHub token, read-only Contents on `caseyglarkin2-png/yardflow-gtm-vault`.
4. A Google credential with `drive.readonly` (`GAP_DRIVE_REFRESH_TOKEN`) for the unattended Drive sync, when the follow-up release is ready.
5. Sub-Zero: add the account through Add to GAP (or name the account the SUBZERO contact belongs to).
6. The Gemini canvas "Order of Operations Thesis Asset": Share, Export to Docs, when wanted in the import.
7. The Hitlist service key, only if a one-time read of its meetings and outreach history is wanted and the service still exists.
