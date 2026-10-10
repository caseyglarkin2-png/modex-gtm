# Morning handoff, October 10, 2026

STATUS: HANDOFF (the overnight continuation of the intelligence wiring program; Casey's instruction of the evening of October 9: fix the packet's contradictions, complete the Gmail action packet, finish the Google Workspace and Gemini extension, close the recurring feeds and the reuse work, merge and deploy within the authorization already given, leave acceptance to him). The one checklist is `docs/gap/INTELLIGENCE_WIRING_CHECKLIST.md`. Implemented, deployed, demonstrated and accepted are four different words; nothing below is accepted. <!-- verified:2026-10-10 -->

## 0. The two audits you asked for, and Release 3

After Release 2 you asked for an exhaustive completion audit and an adversarial audit of your morning. Both ran on Opus, read only. The completion audit found three items marked done that were not (the Drive folder scope, the vault revision on health, the blanket "no cold email" clauses) and a dozen smaller gaps; the adversarial audit read your inbox and found what would have misled you on Saturday (Friday's email walking Friday's plan, a meeting four days ahead printed as held, an out-of-office as a reply, the superseded Kenco angle still in Pursued, "the proposal below" in an email, a ten-minute command lag). Everything bounded and testable was fixed and shipped as PR #447 (main 1725ce12, production `dpl_7ARTD9XAdH9ToLXAUNBn9eYJnrTs` READY 2026-10-10T05:49:00Z on 1725ce12); the checklist's Release 3 block lists each item. What was not done tonight is in section 3 with its owner.

What changes for you on Saturday: reply START only on Saturday's briefing (a reply to Friday's now answers with today's pointer); commands answer within about three minutes; Kenco says "a meeting is ahead on Oct 14" and Pursued no longer repeats the old angle; nothing says "no cold email until"; the first item's move never points "below".

## 1. What shipped

- PR #445, merged to main at f06a47f0; production `dpl_FjBEPuuVbMeY5mhuD9jUr4kUqDYm` READY 2026-10-10T04:15:10Z on f06a47f0. Rollback: 821c43ec (`dpl_G8mUVu2cW83GTaiakA4vL6ubpXZy`, the Gmail action UI release of 01:31Z; 4e5e552e was the docs merge over it).
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
| GitHub CI (typecheck, unit-tests) | IGNORED by your word (no budget) | it fails on every run; merges proceed on the local gate (the focused battery, tsc, eslint); nothing to do |
| Reply items never settle from email (Kenco, Boston Beer, Gusto come back every day) | TO DO (agent, your call on the rule) | a reply answered by a later outbound should not stay "Someone replied"; DONE should record the disposition instead of a one-day "logged" outcome (`work/outcome.ts`); it changes what a seller command means, so say yes and it is built with its test |
| Your October 9 Kenco DONE note lost its facts (ran before the newer parser) | DONE (Release 4) | `scripts/gap/replay-done-notes.ts` replayed it: the Oct 14 meeting is now a prepare-meeting commitment on Kenco and the sent note a claim, recorded on a `work.done_facts_replayed` ledger row that names the original |
| Deal hygiene in the START/NEXT walk; no shortage line | TO DO (agent) | seven "Confirm the real date" items sit in the walk; the briefing should say "0 of 14 are new conversations" when that is so |
| Lazer: "no exchange since Sep 21" while your reply of 14:38Z is in the mailbox | DONE (Release 4) | root cause: you replied from casey@freightroll.com, and GAP's Sent reader read only casey@yardflow.ai; `execution/seller-sent.ts` now reads both mailboxes for the briefing's people list and the assignment's relationship (either mailbox failing fails the read, never half). Named debt: the account page's own Sent read still reads the GAP mailbox only |
| A persistent "not a prospect" control; the mdlz.com alias | DONE (Release 4) | a `never` decision on a person ("Not a prospect: never list this sender again") or on a sender domain ("never list anyone at <domain>"), on the briefing's decide links, the decide page and the panel; it never expires and the re-engage list and the browse honor it (no undo yet, named debt). Mondelez: mdlz.com was neither a verified domain nor an alias and all 14 of its messages placed nowhere; a bare-domain alias now counts as the account's domain (`identity/service.ts`) and the row is registered (`scripts/gap/register-domain-alias.ts`, applied: mdlz.com places at Mondelez International by domain) |
| Two Boston Beer accounts on one plan; the Walmart opt-out still "NOT yet on the suppression list" | DONE (Release 4, you said handle it) | "Boston Beer Company" merged into "The Boston Beer Company" with `scripts/gap/merge-account.ts` (51 rows re-pointed, the duplicate row deleted, one `account.merged` ledger row); Tim Cooper's "stop" recorded through the consent writer (`scripts/gap/record-opt-out.ts`: the suppression row carries his words and the Gmail message; no HubSpot contact exists for him, so no mirror). Two test accounts remain in production from the May seed, "E2E Boston Beer Company" and "The E2E Boston Beer Company": not touched; say the word and they go |

## 4. The one consolidated list of credentials and user actions

1. `$a = New-ScheduledTaskAction -Execute "cmd.exe" -Argument '/c cd /d C:\Users\casey\wt-gap-account-first-ux && npx tsx scripts\gap\consume-export-folder.ts --once >> C:\Users\casey\.gap\consumer.log 2>&1'; $t = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Minutes 30) -RepetitionDuration (New-TimeSpan -Days 3650); Register-ScheduledTask -TaskName "GAP export folder consumer" -Action $a -Trigger $t -Force`
2. `WAR_ROOM_TOKEN` in modex production (the war-room's `MC_API_TOKEN` value), then redeploy.
3. `GAP_VAULT_GITHUB_TOKEN` in Vercel production (fine-grained, read-only Contents on `caseyglarkin2-png/yardflow-gtm-vault`).
4. The Drive credential, three ways, pick one: (a) the least work: add the `https://www.googleapis.com/auth/drive.readonly` scope to the existing Workspace delegation (the service account behind `GAP_GOOGLE_DWD_SA_JSON`) in the admin console, then set the plain flag `GAP_DRIVE_DELEGATION=gmail` in Vercel production and redeploy (no new secret); (b) `GAP_DRIVE_REFRESH_TOKEN` (an OAuth refresh token for the app's Google client with that scope); (c) `GAP_DRIVE_DWD_SA_JSON` + `GAP_DRIVE_USER_EMAIL`. Most yard-audit files are older than the 120-day first-run window: set `GAP_DRIVE_FIRST_RUN_DAYS=400` for the first run.
5. Add Sub-Zero through Add to GAP, or name the account the SUBZERO contact belongs to.
6. The Gemini canvas "Order of Operations Thesis Asset": Share, Export to Docs.
7. The Hitlist service key, only if the optional read is wanted (the Railway MCP answered Unauthorized, so whether the service still exists is unverified; `railway login` on your side would settle it).
8. Paste the ChatGPT export instruction (the JSON block plus the Markdown fallback, one save into the watched folder) into the Yards First and Signal Desk briefs: `docs/gap/INTELLIGENCE_PRODUCER_HANDOFF.md` holds the exact text.
9. The two public Manifest-era repositories (GTM-YardFlow, YardFlow-Hitlist) carry attendee names and a hardcoded seed password: make them private or remove the seed, your call.
10. sales-agent's signals, intel-vault and export GET routes carry no auth: worth a look on that service.

## 5. The shortest Gmail steps to exercise the finished workflow

1. Open the newest GAP briefing in your inbox (or the one that arrives on the next cron). Reply with `START` on the first line: the first assignable item arrives as its own email with the packet.
2. In that email: read Who (phones, LinkedIn, HubSpot links), the Relationship lines (the request's MET / UNFULFILLED / UNKNOWN / REDIRECTED with its basis), the Evidence links, then the Possible next move. The bookkeeping is at the end.
3. Reply with one word on the first line: `DONE: what happened` (records it), `SKIP` (drops it for today), `DEFER` (it returns tomorrow), `NEXT` (the next item), or `ITEM 6` (any item of the plan as its own email). `APPROVE` on a prepared email only queues it for the send step in the app (CONFIRM + SEND there); nothing goes to a buyer from a reply.
4. For PepsiCo: the item is held; open the account (the link in Controls), choose the person, and the next revision carries the email to that person.
5. For Kenco: the angle is kept for reference; "Continue the correspondence with Dave Kiesling" is your own email from Gmail, then `DONE: wrote Dave` on the assignment.
