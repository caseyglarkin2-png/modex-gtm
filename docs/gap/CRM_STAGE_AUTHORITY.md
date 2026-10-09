# CRM stage authority

STATUS: ACTIVE. C51 of the commercial-context and execution audit (`docs/GAP_PROSPECTING_OS.md`, V8). The registry in code is `src/lib/gap/opportunity/stage-authority.ts` (`STAGE_WRITERS`); the structural test `tests/unit/gap/stream-a-c51-stage-authority.test.ts` fails when a writer named here is missing from the registry, when a registry entry names a function its module does not hold, or when anything under `src/lib/gap` imports a stage writer or writes `dealstage`.

<!-- verified:2026-10-08 -->

## The rule

A deal's stage is HubSpot's to answer, under a complete read. GAP reads it through the day's in-deals read (`src/lib/gap/deals/in-deals.ts` into `work/deal-coverage.ts`); `dealStage()` answers known (with the read time), none (a complete read with no open deal) or unknown (the CRM was unavailable or not read). GAP's own ledger never moves a stage and never reports one: a send, a reply, an obligation done, a meeting outcome and a HubSpot note or task are not advancement (C36 to C38c). The activity `deal_advanced` is projected only from a `deal.stage_changed` row (`work/activity.ts`), and the one builder of that row in GAP, `stageChangedFromCrm()`, takes two CRM reads of the same deal and nothing else. Nothing in this repository writes that row yet.

The Clawd fixture `sent_t1` (a first touch sent) never advances a commercial stage in GAP: the projection of every send kind is `message_sent`, and the structural test holds the fixture.

## Every writer of a HubSpot deal stage, with owner and enablement

Read on 2026-10-08 (New York evening). Production values: modex from the Vercel project `prj_rSVCgdXqOqsXEmlrS1v8v2eoPV9V` production environment (a flag that is not set takes the code default); Clawd from the Railway project dazzling-spirit (`railway variables`, only the flag keys read).

| # | System | Writer | Trigger | Kind | Owner | Gate and the value read |
|---|---|---|---|---|---|---|
| 1 | modex-gtm | `src/lib/hubspot/deals.ts` `advanceDealStageForward` | `POST /api/concierge/booked`: a booked meeting moves the open deal forward to Discovery, never backward | human event | Casey (a booking) | `HUBSPOT_SYNC_ENABLED`: not set in production, default on |
| 2 | modex-gtm | `src/lib/hubspot/deals.ts` `createBookingDeal` | `POST /api/concierge/booked`: a booking with no open deal opens one at Discovery | human event | Casey (a booking) | `HUBSPOT_SYNC_ENABLED`: default on |
| 3 | modex-gtm | `src/lib/hubspot/deals.ts` `createDealIfMissing` | `POST /api/microsites/roi-lead`: an ROI lead opens a deal | human event (the prospect's) | Casey (microsites) | `HUBSPOT_SYNC_ENABLED`: default on |
| 4 | modex-gtm | `src/lib/hubspot/deals.ts` `upsertDealForAccount` through `ensureLocalMeetingDealLink` | `src/app/pipeline/actions.ts` (a rep drags an account into a stage; may create), `src/lib/actions.ts` (a logged meeting may create; a status dropdown links only), `src/app/api/cron/check-inbox/route.ts` (a reply; links only). On a `link` decision nothing is written. On an `update` decision (only an engine-named "YardFlow - Account" stub matched by name, `src/lib/hubspot/deal-dedup.ts`) the stub's `dealstage` is rewritten to the local pipeline stage. | touch automation on the check-inbox path (a reply is a touch); human event on the other two | legacy modex pipeline | `HUBSPOT_SYNC_ENABLED`: default on; `INBOX_POLLING_ENABLED`: not set, default on. The check-inbox path re-stages only an engine stub; a human-made deal is never touched (`link`). |
| 5 | clawd-control-plane | `scripts/hubspot_autopush.py` `update_deal_stage` | `scripts/automation_scheduler.py` `_run_hubspot_autopush`, every `PIPELINE_SYNC_INTERVAL`: every campaign pipeline entry past `approved` is pushed through `STAGE_MAP` (`sent_t1` and `waiting_t2` to `qualifiedtobuy`; `sent_t2` through `sent_t5` to `presentationscheduled`; `replied` to `decisionmakerboughtin`; `meeting` to `contractsent`; `opted_out`, `bounced`, `denied` to `closedlost`; `closed` to `closedwon`). The deal is the contact's associated deal; the PATCH is `/crm/v3/objects/deals/{id}` `dealstage`. | touch automation | Clawd | `AUTO_HUBSPOT_AUTOPUSH_ENABLED`: NOT SET on Railway, and `_env_flag` defaults to TRUE, so the job is ENABLED; `DRY_RUN`: not set (live); `HUBSPOT_PRIVATE_APP_TOKEN`: present. Runtime effect not established: the Railway log read returned no autopush lines, and the pipeline it reads (`pipeline.jsonl`) lives on ephemeral disk. |
| 6 | clawd-control-plane | `scripts/reply_scanner.py` (line of "CC-27 S1-T3") calling `update_deal_stage` | the reply scan: a match whose `stage_after` differs from `stage_before` | touch automation | Clawd | `AUTO_REPLY_SCAN_ENABLED`: NOT SET on Railway, default TRUE, so the scan is ENABLED; `DRY_RUN` not set; token present |
| 7 | clawd-control-plane | `scripts/mc_server.py` `handle_sequence_send_touch` calling `auto_push_on_send(new_stage="sent_t<n>")` | a sequence touch send | touch automation | Clawd | its callers are the sequence advance and the actuator: `AUTO_SEQUENCE_CHECK_ENABLED=false`, `AUTO_ACTUATOR_SEND_ENABLED=false` on Railway, so this path is OFF today |

Not writers: `src/lib/gap/crm-sync.ts` (deal fields limited to `hs_next_step`, `CRM_DEAL_PROPERTIES`), `src/lib/gap/hubspot-mirror.ts` (`yardflow_gap_*` properties and notes only), `scripts/email_send.py` (calls `auto_push_on_send` without `new_stage`: contact ensure only), `scripts/hubspot_push_worker.py` (engagements and the sync queue; no `dealstage`).

## What C51 asks next (Casey's call, never an agent's)

- Writers 5 and 6 are touch-to-stage automation that is enabled by default because the flag is unset. Retiring or isolating them is a separately authorized change on the Clawd side: set `AUTO_HUBSPOT_AUTOPUSH_ENABLED=false` and decide the reply scan's stage push (the scan itself is wanted; its `update_deal_stage` call is the writer). This audit changed no flag.
- Writer 4's check-inbox path re-stages engine stubs on a reply. It is legacy modex (not GAP); the owner decides whether a reply should move a stub's stage at all.
- Writers 1 to 3 are human commercial events and stay.

## How GAP reports a stage

`dealStage(coverage, { dealId | accountName })` from `stage-authority.ts`, said with `stageWords()`: "YardFlow - Kenco is at presentationscheduled (HubSpot read Oct 8, 10:55 AM New York)", "no open deal (HubSpot read ...)", or "deal stage unknown: HubSpot could not be read". Never a stage from `accounts.pipeline_stage` (the legacy local field; `opportunity/active-opportunity.ts` stopped reading it) and never from a GAP ledger row.
