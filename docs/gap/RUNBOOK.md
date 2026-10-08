# GAP operations runbook

<!-- verified:2026-10-07 -->
STATUS: ACTIVE. One page for an operator: what runs, how a failure shows, how to retry it, how to roll back. Every
claim cites the file that makes it true at the release candidate c9cff73b; if code moves, re-read the cited file before
you trust a line.

Every GAP flag is read at call time (`src/lib/gap/flags.ts`). `assertGapEnabled(...)` checks `GAP_OS_ENABLED` first,
then each named flag, and a gated route answers the skip payload `{ skipped: true, reason: '<FLAG>=false' }`, so a
schedule with its flag off reads as skipped, never as an outage (`flags.ts:70-81`).

## 1. What runs when

| Job | Schedule (`vercel.json`) | Gate | What it does and writes |
|---|---|---|---|
| `GET /api/cron/gap-mailbox?mode=apply` | every 10 min | `GAP_OS_ENABLED` | Reads the GAP mailbox for replies and delivery notices (`pollGapMailbox`). Reconciles direct sends whose Gmail answer was lost (`reconcileUnknownSends`). Closes follow-ups sent by hand from Sent (`reconcileFollowUpsFromSent`). Without `mode=apply` it is a dry run and writes nothing, the watermark included. An unconfigured mailbox is a skip (`src/app/api/cron/gap-mailbox/route.ts:22-34`, `:40-105`). |
| `GET /api/cron/gap-background-research` | :40 every hour | `GAP_BACKGROUND_RESEARCH_ENABLED` | Bounded evidence research: 3 accounts a run by default (`?cap=1..10`), a 3-day cooldown per account. A queued story is retried up to 3 times, then settles `research_failed` ("Research failed"), never `no_usable_fact`. It writes research records and the `research.background_run` audit, and never routes, drafts or sends (`src/app/api/cron/gap-background-research/route.ts:18-29`; `src/lib/gap/research/background.ts:47-53`, `:79`; `src/lib/gap/signals/research.ts:164-186`). |
| `GET /api/cron/gap-signal-process` | every 30 min | `GAP_ROUTING_ENABLED` | Retries pages unread at capture, clusters sources of one event, and promotes verified stories (`src/app/api/cron/gap-signal-process/route.ts:16-23`). |
| `GET /api/cron/gap-signal-discovery` | :15 every 2 h | `GAP_BACKGROUND_RESEARCH_ENABLED` | Grounded source-class discovery first (2 accounts a run, 90 s), then news with the time left (10 accounts a run, `?accounts=1..40`). It queues at most 4 material grounded pages a run and 40 a day, and news stories within their own 40 a day. An unreadable budget queues nothing. A transient grounded failure is still audited (`payload.transient`), so Coverage can show it, but it never counts as a turn. Audits are `signal.grounded_discovery` and `signal.discovery` (`src/app/api/cron/gap-signal-discovery/route.ts:17-42`; `src/lib/gap/signals/grounded-discovery.ts:28-44`, `:200-209`, `:225-228`; `src/lib/gap/signals/discovery.ts:26-28`, `:71`, `:191-192`). |
| `GET /api/cron/gap-hubspot-replies?mode=apply` | 12:45 UTC daily | `GAP_ROUTING_ENABLED` | Reads HubSpot incoming-email engagements into inbound messages, read only toward HubSpot. An apply run claims the day; `?force=1` bypasses the claim; `?limit` and `?since` bound it (`src/app/api/cron/gap-hubspot-replies/route.ts:40-55`). |
| `GET /api/cron/check-inbox` | every 5 min | `GAP_OS_ENABLED` for its GAP part | The legacy inbox cron also ingests GAP replies (`ingestReply`) and reconciles pending GAP drafts (`src/app/api/cron/check-inbox/route.ts:3`, `:81-83`, `:245-251`). |
| Not scheduled | manual only | | `gap-hypothesize` and `gap-enrollment-sync` are dry runs unless `?mode=apply`. `gap-alignment-test` SENDS one internal operator message to a fixed address, at most one an hour; run it only on purpose (`src/app/api/cron/gap-alignment-test/route.ts:2-12`). |

Work-time reads (no cron). They run on each render of `/gap` (`src/app/gap/page.tsx:419-477`):
- **Follow-up sweep:** `loadWorkCommitments` derives waiting follow-ups from the send ledger and moves them for out-of-office return days, at most once a minute per instance (`src/lib/gap/work/day-load.ts:29-40`).
- **Closure sweep:** `sweepClosedDeals` reconciles deal-scoped work with HubSpot closures, five accounts at most, every five minutes per instance, and only when the open-deal read is complete (`src/lib/gap/deals/closure.ts:185-205`).
- **Summary warmer:** after the response, `warmPursuitSummaries` refreshes up to 3 account summaries, at most once a minute per instance (`src/lib/gap/pursuit/summary.ts:34-36`, `:178`). A summary lives 15 minutes in memory and in `system_config` key `gap:pursuit:<account>` (`summary.ts:31`, `:39`, `:62`).

## 2. What a failure looks like

- **Cron state:** each run writes `system_config` key `cron:<name>` as started, ok, skipped (with its reason) or failed (`src/lib/cron-monitor.ts:82-99`, `:104-184`). `/ops`, tab Cron Health, lists them all (`src/app/ops/page.tsx:71`, `:189`). A mailbox run with intake errors is a failure, never a quiet success (`gap-mailbox/route.ts:85-95`).
- **`GET /api/gap/health`** (session, read only, `GAP_ROUTING_ENABLED`): mailbox (`cron:gap-mailbox`), HubSpot reads, the clawd suppression contract, the GAP sender and the last routing run, each HEALTHY, DEGRADED or BLOCKED. The worst component wins. A component that is not healthy names its owner and its next step (`src/lib/gap/health/health.ts:2-14`, `:37`; `src/lib/gap/health/load.ts:67-87`).
- **`GET /api/gap/health?operations=1`**, the operator's view (`src/app/api/gap/health/route.ts:33-34`; `src/lib/gap/health/operations.ts:90`, `:129`, `:204`): broken handoffs (drafts stranded, proposals drafted but never submitted, the research dead letter), the research queue's age and stuck runs, failed runs and grounded turns, remembered summaries older than a day, and HubSpot changes failed or in conflict. Each failure line carries its owner and its retry path in words. A count GAP could not read says so, never zero. The plain call, which the Work strip makes on every load, carries none of it. `/gap/learning` gives Casey the decisions and outcomes only.
- **`/gap/coverage`** (`GAP_ROUTING_ENABLED`): per watched account and source-class bundle, covered, stale, never or failed, from the discovery and research audits. Accounts outside the grounded rotation are labeled news only. The rotation is sized with a 15% margin, so it carries fewer accounts than the raw allowance; the 2026-10-07 production read was 12 priority and 17 rotating. Coverage also lists every HubSpot change that stands "approved, not written" across accounts (`src/app/gap/coverage/page.tsx:2-4`, `:33`, `:56`; `src/lib/gap/signals/coverage.ts:48`, `:157-160`, `:334`; `docs/GAP_PROSPECTING_OS.md:1020`).
  - **Fixed in e972efbc (found by the R62 final pass; no longer debt):** that Coverage list could omit an approval whose attempt and result rows shared a millisecond, because it folded the ledger with a stable millisecond sort. The fold now orders one millisecond by the write lifecycle (proposed, approved, attempt, result, discarded), then by id, whatever order the rows are read in (`src/lib/gap/deals/crm-model.ts` `foldCrmSync`), so Coverage, the deal brief and the operations count agree.
- **`/gap/learning`:** what was actually sent and its outcomes, and the reply backlog, meaning replies with no human disposition older than the threshold (`src/lib/gap/learning/execution.ts:2-15`, `src/lib/gap/learning/reply-backlog.ts:2-11`).
- **`/gap/signals`:** each shared or discovered signal with its `research_status`: none, queued, researching, fact_found, no_usable_fact, contradiction or research_failed, the dead letter (`src/app/gap/signals/page.tsx:2-9`; `src/lib/gap/signals/research.ts:164-170`).
- **Work and the send panel:** a refusal names its reason (`src/components/gap/send-from-yardflow.tsx:49-102`). Typical dependency answers:
  - `opportunity_unknown` (HubSpot unreadable)
  - `suppression_unreadable` (clawd contract down)
  - `mailbox_sent_unreadable` (Sent unreadable)
  - `send_in_progress_or_unknown` (the answer was lost: check Gmail Sent, never resend)
- **The legacy composer's send (`POST /api/email/send`):** a recipient (or cc) whose opt-out reply is on file, recorded or not, is refused 409 `RECIPIENT_OPTED_OUT_BY_REPLY` with the reason in words ("<name> replied "stop" on <day>. Nobody emails them from here. Record it as do not contact from their reply."). The fix is to record the reply as do not contact, never to resend (`src/lib/email/perform-send.ts:218-228`; `src/lib/email/send-blockers.ts:79`; `src/lib/gap/replies/opt-out.ts`). No GAP page shows that composer (`src/components/global-compose-button.tsx`, `isGapPath`).
- **Repeat writes that answer the first:** a second Capture on one reply returns that reply's one note (200, `existing: true`; `src/lib/gap/capture/store.ts:196`, `:223`), and the same Work outcome twice in one New York day returns the first (200, `existing: true`; `src/lib/gap/work/outcome.ts:110-121`, `src/app/api/gap/accounts/outcome/route.ts:39`). Neither is a failure.
- **Ledger (`gap_audit_events`):**
  - `execution.gmail_direct_*` and `execution.gmail_draft_*` (`src/lib/gap/execution/draft-ledger.ts:30-106`)
  - `account.commitment` (`src/lib/gap/work/commitment-model.ts:23`) and `account.work_outcome` (`src/lib/gap/work/outcome-model.ts:8`)
  - `account.priority` (`src/lib/gap/work/priority.ts:12`), `deal.state` (`src/lib/gap/deals/closure.ts:30`) and `deal.plan_decision` (`src/lib/gap/deals/action-plan.ts:23`)
  - `crm.sync_proposed`, `_approved`, `_attempt`, `_result` and `_discarded` (`src/lib/gap/deals/crm-model.ts:29-33`)
  - `research.background_run`, `signal.discovery` and `signal.grounded_discovery`
- **CRM changes on a deal brief:** off, failed, conflict or written (`src/lib/gap/crm-sync.ts`). Every standing "approved, not written" item, across accounts: `GET /api/gap/crm-sync?state=off` (`src/app/api/gap/crm-sync/route.ts:3`, `:55`), with the known gap above.

## 3. How to retry

- **A cron:** GET its route with `Authorization: Bearer $CRON_SECRET` (or `x-cron-secret`). `CRON_SECRET` exists only in Vercel (`src/lib/cron-auth.ts:14-27`). `gap-mailbox` and `gap-hubspot-replies` only read until `?mode=apply`. Every other scheduled GAP route writes when run. The flag gate applies to manual runs too.
- **A lost send answer:** never send again. The next applied `gap-mailbox` run reconciles it from Sent once the claim is older than 10 minutes (`src/lib/gap/execution/unknown-send-reconcile.ts:26`).
- **Routing:** `POST /api/gap/routing/run?mode=apply` (session or header token; a dry run without `mode=apply`; `src/app/api/gap/routing/run/route.ts`).
- **Research for one card:** `POST /api/gap/research` `{ decisionId }` (session; writes research records only; `src/app/api/gap/research/route.ts:1-9`).
- **An approved CRM change:** use Retry on the deal brief (`POST /api/gap/crm-sync` `{ op: 'retry', proposalId }`). It writes only with `GAP_OS_ENABLED`, `GAP_CRM_APPROVED_WRITES_ENABLED`, `HUBSPOT_SYNC_ENABLED` and a token (`src/lib/gap/crm-sync.ts:72-77`). A retry rechecks the origin: a done or skipped obligation, or a closed deal, answers `origin_closed`, and a recap a newer one replaced answers `discarded`; neither writes.
- **Stranded drafts** (the operations line "drafts stranded"): list them read only, then let the seller adopt each from the account page.

  ```
  DATABASE_URL=<database> npx tsx scripts/gap/recovery/repair-stranded-drafts.ts --dry-run [--json]
  ```

  Without `--dry-run` it exits 2 before reading anything; the client refuses every write; it prints the host and database name, never credentials (`src/lib/gap/recovery/read-only.ts:24`, `:49`, `:59`). Each ADOPT completes when the seller drafts from that fact for that person on the account page (the R11 service, `src/lib/gap/story/draft-from-fact.ts`).
- **Health:** `GET /api/gap/health` (add `?operations=1` for the operator's view), read only, any time.

## 4. How to roll back

1. **Code:** in Vercel, promote or redeploy the previous production deployment. Before this program that was `672570ed`, `dpl_5tW92dBWDxnL8VquojbfBedmu8MP` (`docs/GAP_PROSPECTING_OS.md:775`, `:783`). The release packet names the exact one for each release.
2. **Flags, narrowest first:**
   - `GAP_CRM_APPROVED_WRITES_ENABLED` off stops the seller-approved HubSpot changes, and `GAP_HUBSPOT_MIRROR_ENABLED` off stops the automatic mirror. They are separate on purpose (`src/lib/gap/flags.ts:4-14`).
   - `GAP_BACKGROUND_RESEARCH_ENABLED` off stops research and discovery.
   - `GAP_ROUTING_ENABLED` off stops Work, the account page, signal processing, HubSpot reply reads, health and coverage.
   - `GAP_OS_ENABLED` off stops every GAP surface and cron.

   A flag changed in Vercel takes effect on the next request after a redeploy (`src/lib/gap/flags.ts:3-16`). `OUTREACH_PAUSED` is the separate all-outreach stop (`src/lib/feature-flags.ts:42`).
3. **Data stays:**
   - `gap_audit_events`, `hypothesis_events` and `sequence_copy_events` refuse UPDATE and DELETE by trigger (`GAP_APPEND_ONLY`, `prisma/sql/2026-09-23-gap-os.sql:19`, `:334-358`). New ledger kinds go inert under older code; no row needs undoing.
   - `system_config` rows `gap:pursuit:<account>` are display summaries no send path reads. They are disposable, and deleting one costs a cold account read.
   - `cron:<name>` rows are monitor state.
   - The program adds no table and no schema change (`prisma/` is unchanged from `672570ed` to `c9cff73b`).
