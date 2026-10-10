# Morning handoff, October 10, 2026

STATUS: HANDOFF (the overnight continuation of the intelligence wiring program; Casey's instruction of the evening of October 9: fix the packet's contradictions, complete the Gmail action packet, finish the Google Workspace and Gemini extension, close the recurring feeds and the reuse work, merge and deploy within the authorization already given, leave acceptance to him). The one checklist is `docs/gap/INTELLIGENCE_WIRING_CHECKLIST.md`. Implemented, deployed, demonstrated and accepted are four different words; nothing below is accepted. <!-- verified:2026-10-10 -->

## 1. What shipped

- PR #445, merged to main at RELEASE2_SHA; production RELEASE2_DEPLOY. Rollback: 4e5e552e (`dpl_G8mUVu2cW83GTaiakA4vL6ubpXZy`, the Gmail action UI release of 01:31Z).
- The packet's contradictions (three commits, e3a24cd3, 4e42307f + 1e2a8793, 90a3b12a), each pinned by tests: `gui-packet-fixes` (8), `gui-packet-fixes-2` (10), `gui-relationship-fixes` (6), `gui-relationship-fixes-2` (4), `gui-plan-hold` (3); the earlier pins updated deliberately.
- The Google Workspace and Gemini extension (four commits by builder F, merged): `signals/drive-parsers.ts`, `drive-records.ts`, `drive-client.ts`, `drive-sync.ts`, `work/evidence-group.ts`, the cron `/api/cron/gap-drive-sync` (every six hours), `scripts/gap/sync-drive.ts` (dry run by default), the contract's `evidenceGroup`, real fixtures with their Drive ids; 27 tests across six files; the readability guard proven RED when disabled.
- The Clawd cron: three pages of 100 per run (the export holds more than 8,000 rows behind the cursor; one page ran in 53 s; three pages of 200 timed out on October 9).
- An independent read-only reviewer inspected the first round and verified five defects (a draft said UNFULFILLED with Sent unread; "contact Casey Larkin" read as a referral; "let me check with Dave" read as a referral to us; a signal's headline shown as the angle's person; a short profile title linking a story). All five are fixed and pinned.
- The vault pushed again (7,434 notes on record, a ledger row). The export-folder consumer ran once by hand (0 files; Codex has not written its first structured export). The Clawd cron ran every two hours overnight with the cursor advancing and no duplicates after the 61/39 proof.

## 2. The representative assignment emails and what changed in them

The read-only preview `docs/gap/ASSIGNMENT_PACKETS_PREVIEW_2026-10-10.md` (and `.html` for the Gmail look) was re-rendered against production after the fixes. Nothing was sent; every production write was intercepted and listed at its end.

Kenco (an account off the plan, rendered as a review item):
- Before: "Who: No person is named on this item" while the moves said "Write dave.kiesling@kencogroup.com from the prepared angle"; the angle spoke of "an undated note" although we had written Dave on October 9; "Nobody at Kenco gets a cold email until then."
- After: Who lists Dave Kiesling (Vice President of Transportation Management, his direct number, his LinkedIn, his HubSpot record) and Craig Morrison (Vice President, Asset Transportation, his mobile, his record), both found in HubSpot by the addresses the logged emails carry (GAP holds no row for either; the packet says so). The angle is "superseded by later correspondence (we wrote Dave Kiesling Oct 9, 2026)", kept for reference, and the moves say "Continue the correspondence with Dave Kiesling in your own words" and "Call Dave Kiesling". The three HubSpot meetings (Jul 16 discovery, Aug 5 demo, Oct 14 next steps) now read, because the relationship reader resolves the HubSpot company from the deals when the account record carries none, the way the account story already did. No blanket instruction.

The Boston Beer Company (Phil Savastano's reply item):
- Before: "Why now: ... Someone replied: Cowan, David, Jun 10"; "The move: Read Cowan, David's reply"; "Nothing from us to Savastano, Philip; an answer is owed: they wrote Jun 3; nothing sent since" with our Sent unread; Phil's June 3 referral to Brian Kellogg ignored though we wrote Brian on October 2; "first stop per [[RE"; the four documents "(no link on record)".
- After: the first line and the move are about Phil ("Read Savastano, Philip's reply of Jun 3, 2026 and record what they said"); David Cowan's words are attributed to him, after Phil's. With HubSpot's logged emails now read as our outbound record, Phil's June 2 request is MET (we replied the same day under the same subject) and the relationship says "Last from us: Aug 18, 2026". Where Sent is not read the packet says "What we sent X is not known: ..." instead of inventing an absence. "Feel free to reach out to Brian Kellog" is read as a referral to Brian Kellogg (resolved to his address from the correspondence) and followed to our email to him the same day ("They pointed to Brian Kellogg on Jun 3, 2026; we wrote Brian Kellogg Jun 3, 2026"); the October 2 email to Brian is on the between-us lines. The dossier passage prints as "Our read (interpretation, not a reported fact or a buyer statement) ... (written Jun 25, 2026; imported Oct 9, 2026)". The four documents link to the app's own PDFs (`/docs/pilot-program.pdf` and the three others), said as not tracked links. The "[[RE" fragment is gone. Phone, LinkedIn, HubSpot contact and company links and the deal link are on the Who line.

PepsiCo (the held item):
- Before: the subject "Ready for a first touch: Tom Kamantauskas" over a packet that held the item because the prepared email was to Shawn.
- After: the plan item, the digest line, the subject and the packet's first line all say "Held: the prepared email names Shawn Miller, not Tom Kamantauskas" (the hold is computed at plan time and again at assignment time with one title); nothing is presented as ready; the move is to choose the person on the account.

Walmart (the opt-out): STOP still leads with Tim Cooper's own word and "NOT yet on the suppression list"; no outbound move; the move's reason no longer says "the account cools before anyone else is touched" (no gate enforces it; the opt-out itself is the rule).

Every packet: the bookkeeping ("Searched: ...", "Not read this time: ...") is the last section, after the controls; the buyer's words are attributed by name; a reply quote is cut at a word with an ellipsis, never "a fe"; a story excerpt links to its original article when the signal row GAP holds starts with the same words; "unverified" is said apart from "only the producer's claim".

What the preview cannot show: our Sent and Drafts. Production holds the GAP mailbox (`GAP_GMAIL_USER_EMAIL` and the delegation credential), so the production assignment path reads them; the credential is sensitive and cannot be read back, so the preview process runs without it and its packets say "not known" there. The proof is your next START assignment.

## 3. Every remaining item and its exact blocker

| Item | State | Blocker or next step |
|---|---|---|
| The inbox round trip and seller acceptance | AWAITING YOU | reply to the next briefing or assignment; nothing is marked accepted for you |
| The export-folder consumer on a schedule | BLOCKED | one PowerShell command (the permission classifier refused the agent's registration); the consumer itself ran clean |
| The vault cron | BLOCKED | `GAP_VAULT_GITHUB_TOKEN` in Vercel production (the local push works and ran tonight) |
| The war-room review feed | BLOCKED | `WAR_ROOM_TOKEN` in modex production (the war-room's own token, a sensitive value the agent cannot read back), then a redeploy |
| The Drive sync running | BLOCKED | `GAP_DRIVE_REFRESH_TOKEN` (or the delegation pair) in Vercel production, then a redeploy; until then the cron writes one not-configured ledger row and health says so |
| The Gemini canvas | BLOCKED | one export step (Share, Export to Docs) |
| Sub-Zero | BLOCKED | add the account (none exists) |
| Codex's first structured export | WAITING | Codex's next daily run writes `gap-exports\hubspot-activity-<date>.json`; the consumer posts it |
| PDF text extraction in the Drive sync | NAMED DEBT | no PDF library; a PDF is recorded unreadable by its link |
| Grouping a Drive copy with a producer report | NAMED DEBT | the key needs the same words in both; the vault's captures group today |
| The Hitlist one-time read | OPTIONAL | only with its service key, if the Railway service still exists; never its frontend or sequences |
| sales-agent | READ, one optional candidate | the bounded read found one candidate (per-account LLM research briefs, undated, no sources, through its export endpoint with the key modex already holds) and nothing else GAP lacks; the checklist's Priority 4 row has the table; not imported unless you say undated LLM briefs are worth it; its signals, intel-vault and export GET routes carry no auth (worth a look) |
| Stray folder `C:\Users\casey\wt-clawd-main` | NAMED DEBT | not a registered worktree; delete by hand when convenient |

## 4. The one consolidated list of credentials and user actions

1. `$a = New-ScheduledTaskAction -Execute "cmd.exe" -Argument '/c cd /d C:\Users\casey\wt-gap-account-first-ux && npx tsx scripts\gap\consume-export-folder.ts --once >> C:\Users\casey\.gap\consumer.log 2>&1'; $t = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Minutes 30) -RepetitionDuration (New-TimeSpan -Days 3650); Register-ScheduledTask -TaskName "GAP export folder consumer" -Action $a -Trigger $t -Force`
2. `WAR_ROOM_TOKEN` in modex production (the war-room's `MC_API_TOKEN` value), then redeploy.
3. `GAP_VAULT_GITHUB_TOKEN` in Vercel production (fine-grained, read-only Contents on `caseyglarkin2-png/yardflow-gtm-vault`).
4. `GAP_DRIVE_REFRESH_TOKEN` (OAuth refresh token for the app's Google client with `https://www.googleapis.com/auth/drive.readonly`), or `GAP_DRIVE_DWD_SA_JSON` + `GAP_DRIVE_USER_EMAIL`, in Vercel production, then redeploy.
5. Add Sub-Zero through Add to GAP, or name the account the SUBZERO contact belongs to.
6. The Gemini canvas "Order of Operations Thesis Asset": Share, Export to Docs.
7. The Hitlist service key, only if the optional read is wanted.

## 5. The shortest Gmail steps to exercise the finished workflow

1. Open the newest GAP briefing in your inbox (or the one that arrives on the next cron). Reply with `START` on the first line: the first assignable item arrives as its own email with the packet.
2. In that email: read Who (phones, LinkedIn, HubSpot links), the Relationship lines (the request's MET / UNFULFILLED / UNKNOWN / REDIRECTED with its basis), the Evidence links, then the Possible next move. The bookkeeping is at the end.
3. Reply with one word on the first line: `DONE: what happened` (records it), `SKIP` (drops it for today), `DEFER` (it returns tomorrow), `NEXT` (the next item), or `ITEM 6` (any item of the plan as its own email). `APPROVE` on a prepared email only queues it for the send step in the app (CONFIRM + SEND there); nothing goes to a buyer from a reply.
4. For PepsiCo: the item is held; open the account (the link in Controls), choose the person, and the next revision carries the email to that person.
5. For Kenco: the angle is kept for reference; "Continue the correspondence with Dave Kiesling" is your own email from Gmail, then `DONE: wrote Dave` on the assignment.
