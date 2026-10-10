# Handoff, October 10, 2026, Release 5

STATUS: HANDOFF. One concise record of the named-debt instruction of October 10 (the five defects) and the reconciliation of the checklist, written for Casey. The one checklist stays `docs/gap/INTELLIGENCE_WIRING_CHECKLIST.md` (its Release 5 block has the detail); the earlier morning handoff `docs/gap/MORNING_HANDOFF_2026-10-10.md` stands for Releases 2 to 4. Implemented, deployed, demonstrated and accepted are four different words; nothing here is accepted; acceptance is Casey's and never blocked the engineering. <!-- verified:2026-10-10 -->

## 1. What changed and deployed

- PR #451 merged to main RELEASE5_SHA; production RELEASE5_DEPLOY. Rollback: 2143cb92 (`dpl_3Btc6K6yFcdch4x7hzPbKGTbNZRQ`).
- The schema: `conversation_dispositions.hypothesis_id` is nullable (a reply-triage disposition recorded without a thesis). Pushed to production before the deploy, the eight forward SQL guard files re-applied, `verify-triggers` 33 of 33 (one rolled-back transaction).
- Three Opus builders with disjoint files, one lead integration, one independent read-only review of the integrated tip: ten verified defects, one P1 (a DONE on an "Opted out" card bound to another person's message could have suppressed that person), all ten fixed with reproducing tests before the merge; the list is in the checklist's Release 5 block. The local gate: 46 focused test files green, tsc clean. CI on GitHub is ignored by Casey's word.
- Also in this release: the Clawd import cron hourly (three pages of 100 each run; the backlog drains in about a day); the war-room review feed proven with the token production holds (one internal entry accepted); the briefing never begins with a held item.

## 2. Evidence that each named defect is resolved

| Defect | Implemented | Deployed | Demonstrated |
|---|---|---|---|
| 1 DONE activity unified | `replies/done-reply.ts` records a completion DONE on a reply through `recordDisposition` (Capture's path) with the reply read by Capture's reader, the class from `proposedReplyKind`, source `{ email_command, <command id> }`, the person and account from the reply row, the seller's note as provenance (never the buyer's words), no thesis invented; a progress note stays `progress_noted`; a reply already recorded through Capture is not recorded again; the applied row carries `receipt: mirrored | recorded_not_mirrored (reason, retryable) | recorded_before | not_recorded`; `disposition/mirror-retry.ts` retries a failed mirror from the mailbox cron, at most 3 attempts, keyed per disposition | yes | tests `done-unify` 15 (the same command twice: one disposition, one activity, one mirror call; a mirror that fails then succeeds ends `mirrored` with one CRM record; two mutations shown RED), `disposition-service` 36, `hubspot-mirror` 48, `commands-apply` 11, `contract-parity` 14 (`email_command` is server-only: the dispositions route cannot claim it). The production proof is Casey's next DONE on a reply item: the answer says "recorded" and names the mirror's outcome |
| 2 Paused replies | one source (`work/truth-text.ts` PausedReply, `pursuit/state.ts pausedOf`) for the account page's NOW, the Work card and the packet: "A reply from <name> on <date> is on record ("<their words>")." then "The proposed first touch to <person> is paused by the send gate: the reply is not recorded yet; nothing was sent."; the state line "Reply on record: <name>, <date>. First touch to <person> paused, nothing sent"; the buyer's message stays on every surface | yes | tests `paused-reply` 4 (the three surfaces from one source), `pursuit-state` 29, `work-list` 17, `r61-reply-holds` 3; no account on today's plan is in that state, so the production words appear when one is |
| 3 Account page Sent | `account-intel/sent.ts` reads through `execution/seller-sent.ts` (both mailboxes, each row carrying its mailbox); the coverage says per mailbox what was read and when ("Gmail Sent (1 message; casey@yardflow.ai read 14:02; casey@freightroll.com not read: not configured)"); nothing read says "whether we wrote is not known", never "nothing sent"; the packet's relationship reads the same reader so the two agree when both mailboxes are read | yes | tests `account-sent-coverage` 5, `seller-sent` 5, `kn-sent-story` 9; in the read-only preview both mailboxes read "not read" by name because the credentials are sensitive and the preview process cannot hold them (production can): `docs/gap/ASSIGNMENT_PACKETS_PREVIEW_2026-10-10.md` lines "Not read this time: Gmail Sent (casey@yardflow.ai not read: not configured; casey@freightroll.com not read: ...)" |
| 4 Undo for never | `never` writes one `prospect.decision` row (person or domain) read only by `loadDecided` and the re-engage list; it touches no suppression row, `do_not_contact`, disposition, activity or CRM. `relist` ("List this sender again") is its own row carrying `endsNever`; the newest of never/relist decides; refused where no never stands; on the decide page, right after a never, on the Work panel's "Not a prospect" list, and on POST `/api/gap/decide` | yes | test `people-relist` 5: pat@riserify.com listed, never'd (absent), relisted (present), two rows, the second naming the first; a fixture with a suppression row, do_not_contact, an opt-out disposition and activity byte-identical through never plus relist; `people-relist-page` 5 |
| 5 The two test accounts | read only: accounts 1884 and 1885 and 28 linked rows all from the proof seed of 2026-05-07; the one email log faked (no provider id); no ledger rows; no HubSpot contacts, companies or deals; nothing links them to The Boston Beer Company (972). No reversible archive mechanism exists on Account, so both are untouched; `scripts/gap/archive-test-accounts.ts` is prepared (parks four columns with an `account.archived` recovery row, `--restore` reverses) and not applied; `docs/gap/E2E_ACCOUNTS_CLEANUP_2026-10-10.md` | n/a | the report; the decision is Casey's (section 4) |

## 3. Remaining checklist items and exact blockers

| Item | State | Blocker |
|---|---|---|
| Drive and Gemini sync running | code deployed; BLOCKED | the credential (section 4, item 3) |
| The folder consumer on a schedule | code deployed; BLOCKED | one PowerShell command (section 4, item 1) |
| The vault cron | code deployed; BLOCKED | `GAP_VAULT_GITHUB_TOKEN` (section 4, item 2); the local push ran twice today |
| Codex's first structured export | WAITING | Codex's next weekday run (Monday October 12) writes the file; the consumer posts it |
| Sub-Zero alias | BLOCKED | no account exists (section 4, item 4) |
| The Gemini canvas | BLOCKED | one export step (section 4, item 5) |
| The Hitlist one-time read | OPTIONAL | its service key, if the Railway service exists (the MCP answered Unauthorized) |
| sales-agent research briefs | OPTIONAL | Casey's call whether undated LLM briefs are worth importing (the adapter is one reader) |
| The two E2E accounts (and four more from May 2) | DECISION | section 4, item 7 |
| Named debt (no blocker, engineering): a Drive PDF has no text extractor; a Drive copy groups with a producer report only when the words agree; Crowley's dossiers two levels down; mirror skips by policy (mirror off, no HubSpot contact) are reported, not retried; a Capture note opened before a DONE could record a second disposition; the learning layer counts conversations with no thesis; Clawd sends are not in the pursuit's answered check; a `follow_up` paused kind exists in the vocabulary but nothing produces it; the relationship reader fails the whole Sent read when one mailbox fails (the account page keeps the partial read); answered-reply facts exist once the warmer has summarized the account, so Gusto and The Boston Beer Company may show "Someone replied" once more until then | | |

## 4. Everything only Casey can supply or approve

1. The export-folder consumer's schedule: `$a = New-ScheduledTaskAction -Execute "cmd.exe" -Argument '/c cd /d C:\Users\casey\wt-gap-account-first-ux && npx tsx scripts\gap\consume-export-folder.ts --once >> C:\Users\casey\.gap\consumer.log 2>&1'; $t = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Minutes 30) -RepetitionDuration (New-TimeSpan -Days 3650); Register-ScheduledTask -TaskName "GAP export folder consumer" -Action $a -Trigger $t -Force`
2. `GAP_VAULT_GITHUB_TOKEN` in Vercel production (fine-grained, read-only Contents on `caseyglarkin2-png/yardflow-gtm-vault`), then redeploy.
3. The Drive credential, one of: (a) add the `drive.readonly` scope to the existing Workspace delegation and set `GAP_DRIVE_DELEGATION=gmail` (no new secret); (b) `GAP_DRIVE_REFRESH_TOKEN`; (c) `GAP_DRIVE_DWD_SA_JSON` + `GAP_DRIVE_USER_EMAIL`; then redeploy; set `GAP_DRIVE_FIRST_RUN_DAYS=400` for the first run.
4. Sub-Zero: add the account through Add to GAP, or name the account the SUBZERO contact belongs to.
5. The Gemini canvas "Order of Operations Thesis Asset": Share, Export to Docs.
6. Paste the ChatGPT export instruction into the Yards First and Signal Desk briefs (`docs/gap/INTELLIGENCE_PRODUCER_HANDOFF.md` holds the text).
7. The test accounts: leave them, approve the park (`scripts/gap/archive-test-accounts.ts --apply`, reversible with `--restore`), add an `archived_at` column, or delete; the same for the four E2E accounts of May 2.
8. Optional: the Hitlist service key; whether sales-agent's undated briefs are worth importing; the two public Manifest-era repositories with a seed password; sales-agent's unauthenticated GET routes.
9. Acceptance: the Gmail walkthrough below.

## 5. The shortest Gmail walkthrough for acceptance

1. Open the newest GAP briefing (Saturday's, or the next one). Check the "Walk order" and "New conversations today" lines, and that Pursued says the Kenco angle is superseded in one line.
2. Reply `START`. The first item arrives (a reply to answer, else what is due, else a first touch; never deal hygiene; never a held item). Commands answer within about three minutes.
3. On a reply item, reply `DONE: <what happened>`. The answer says "recorded" and names the mirror outcome ("mirrored", or "the HubSpot mirror failed: <reason>; it will be retried"). The item does not return.
4. On the briefing, click "Not a prospect: never list this sender again" on a re-engage person you never want listed; on the decide page that opens, confirm; then use "List this sender again" to reverse it. Both rows are on the ledger.
5. Reply `ITEM 3` (PepsiCo): the packet says Held and the move is to choose the person on the account.
6. Open an account page (Kenco): the NOW state, the Sent coverage per mailbox with its time, and the meeting of Oct 14 under commitments.
