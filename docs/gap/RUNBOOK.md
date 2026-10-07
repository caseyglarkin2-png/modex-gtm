# GAP operations runbook

<!-- verified:2026-10-07 -->
STATUS: ACTIVE. One page for an operator: what runs, how a failure shows, how to retry it, how to roll back. Every
claim cites the file that makes it true at e7af8a57; if code moves, re-read the cited file before you trust a line.

Every GAP flag is read at call time (`src/lib/gap/flags.ts`). `assertGapEnabled(...)` checks `GAP_OS_ENABLED` first,
then each named flag, and a gated route answers the skip payload `{ skipped: true, reason: '<FLAG>=false' }`, so a
schedule with its flag off reads as skipped, never as an outage (`flags.ts:61-72`).

## 1. What runs when

| Job | Schedule (`vercel.json`) | Gate | What it does and writes |
|---|---|---|---|
| `GET /api/cron/gap-mailbox?mode=apply` | every 10 min | `GAP_OS_ENABLED` | Reads the GAP mailbox for replies and delivery notices (`pollGapMailbox`). Reconciles direct sends whose Gmail answer was lost (`reconcileUnknownSends`). Closes follow-ups sent by hand from Sent (`reconcileFollowUpsFromSent`). Without `mode=apply` it is a dry run and writes nothing, the watermark included. An unconfigured mailbox is a skip (`src/app/api/cron/gap-mailbox/route.ts:22-34`, `:40-105`). |
| `GET /api/cron/gap-background-research` | :40 every hour | `GAP_BACKGROUND_RESEARCH_ENABLED` | Bounded evidence research: 3 accounts a run by default (`?cap=1..10`), a 3-day cooldown per account, queued signals retried up to 3 times. It writes research records and the `research.background_run` audit, and never creates or routes a thesis, drafts or sends (`src/app/api/cron/gap-background-research/route.ts:18-29`; `src/lib/gap/research/background.ts:41-47`, `:73`). |
| `GET /api/cron/gap-signal-process` | every 30 min | `GAP_ROUTING_ENABLED` | Retries pages unread at capture, clusters sources of one event, and promotes verified stories (`src/app/api/cron/gap-signal-process/route.ts:16-23`). |
| `GET /api/cron/gap-signal-discovery` | :15 every 2 h | `GAP_BACKGROUND_RESEARCH_ENABLED` | Grounded source-class discovery first (2 accounts a run, 90 s), then news with the time left (10 accounts a run, `?accounts=1..40`). It queues at most 4 material grounded pages a run and 40 a day. Audits are `signal.grounded_discovery` and `signal.discovery` (`src/app/api/cron/gap-signal-discovery/route.ts:17-42`; `src/lib/gap/signals/grounded-discovery.ts:28-44`; `src/lib/gap/signals/discovery.ts:26-28`). |
| `GET /api/cron/gap-hubspot-replies?mode=apply` | 12:45 UTC daily | `GAP_ROUTING_ENABLED` | Reads HubSpot incoming-email engagements into inbound messages, read only toward HubSpot. An apply run claims the day; `?force=1` bypasses the claim; `?limit` and `?since` bound it (`src/app/api/cron/gap-hubspot-replies/route.ts:40-55`). |
| `GET /api/cron/check-inbox` | every 5 min | `GAP_OS_ENABLED` for its GAP part | The legacy inbox cron also ingests GAP replies (`ingestReply`) and reconciles pending GAP drafts (`src/app/api/cron/check-inbox/route.ts:3`, `:81-83`, `:245-251`). |
| Not scheduled | manual only | | `gap-hypothesize` and `gap-enrollment-sync` are dry runs unless `?mode=apply`. `gap-alignment-test` SENDS one internal operator message to a fixed address, at most one an hour; run it only on purpose (`src/app/api/cron/gap-alignment-test/route.ts:2-12`). |

Work-time reads (no cron). They run on each render of `/gap` (`src/app/gap/page.tsx:390-433`):
- **Follow-up sweep:** `loadWorkCommitments` derives waiting follow-ups from the send ledger and moves them for out-of-office return days, at most once a minute per instance (`src/lib/gap/work/day-load.ts:28-38`).
- **Closure sweep:** `sweepClosedDeals` reconciles deal-scoped work with HubSpot closures, five accounts at most, every five minutes per instance, and only when the open-deal read is complete (`src/lib/gap/deals/closure.ts:117-125`).
- **Summary warmer:** after the response, `warmPursuitSummaries` refreshes up to 3 account summaries, at most once a minute per instance (`src/lib/gap/pursuit/summary.ts:32-34`, `:171-182`). A summary lives 15 minutes in memory and in `system_config` key `gap:pursuit:<account>` (`summary.ts:29`, `:57-61`).

## 2. What a failure looks like

- **Cron state:** each run writes `system_config` key `cron:<name>` as started, ok, skipped (with its reason) or failed (`src/lib/cron-monitor.ts:82-99`, `:104-184`). `/ops`, tab Cron Health, lists them all (`src/app/ops/page.tsx:71`, `:189`). A mailbox run with intake errors is a failure, never a quiet success (`gap-mailbox/route.ts:85-95`).
- **`GET /api/gap/health`** (session, read only, `GAP_ROUTING_ENABLED`): mailbox (`cron:gap-mailbox`), HubSpot reads, the clawd suppression contract, the GAP sender and the last routing run, each HEALTHY, DEGRADED or BLOCKED. The worst component wins (`src/lib/gap/health/health.ts:2-14`, `src/lib/gap/health/load.ts:67-87`).
- **`/gap/coverage`** (`GAP_ROUTING_ENABLED`): per watched account and source-class bundle, covered, stale, never or failed, from the discovery and research audits. Accounts outside the grounded rotation are labeled news only (`src/app/gap/coverage/page.tsx:2-4`, `src/lib/gap/signals/coverage.ts:314`).
- **`/gap/learning`:** what was actually sent and its outcomes, and the reply backlog, meaning replies with no human disposition older than the threshold (`src/lib/gap/learning/execution.ts:2-15`, `src/lib/gap/learning/reply-backlog.ts:2-11`).
- **`/gap/signals`:** each shared or discovered signal with its `research_status`: none, queued, researching, fact_found, no_usable_fact or contradiction (`src/app/gap/signals/page.tsx:2-9`; `prisma/schema.prisma`, model GapSignal).
- **Work and the send panel:** a refusal names its reason (`src/components/gap/send-from-yardflow.tsx:48-67`). Typical dependency answers:
  - `opportunity_unknown` (HubSpot unreadable)
  - `suppression_unreadable` (clawd contract down)
  - `mailbox_sent_unreadable` (Sent unreadable)
  - `send_in_progress_or_unknown` (the answer was lost: check Gmail Sent, never resend)
- **Ledger (`gap_audit_events`):**
  - `execution.gmail_direct_*` and `execution.gmail_draft_*` (`src/lib/gap/execution/draft-ledger.ts:30-104`)
  - `account.commitment` (`src/lib/gap/work/commitment-model.ts:23`) and `account.work_outcome` (`src/lib/gap/work/outcome.ts:21`)
  - `account.priority` (`src/lib/gap/work/priority.ts:12`), `deal.state` (`src/lib/gap/deals/closure.ts:26`) and `deal.plan_decision` (`src/lib/gap/deals/action-plan.ts:23`)
  - `crm.sync_proposed`, `_approved`, `_attempt`, `_result` and `_discarded` (`src/lib/gap/deals/crm-model.ts:24-28`)
  - `research.background_run`, `signal.discovery` and `signal.grounded_discovery`
- **CRM changes on a deal brief:** off, failed, conflict or written (`src/lib/gap/crm-sync.ts`).

## 3. How to retry

- **A cron:** GET its route with `Authorization: Bearer $CRON_SECRET` (or `x-cron-secret`). `CRON_SECRET` exists only in Vercel (`src/lib/cron-auth.ts:14-27`). `gap-mailbox` and `gap-hubspot-replies` only read until `?mode=apply`. Every other scheduled GAP route writes when run. The flag gate applies to manual runs too.
- **A lost send answer:** never send again. The next applied `gap-mailbox` run reconciles it from Sent once the claim is older than 10 minutes (`src/lib/gap/execution/unknown-send-reconcile.ts:26`).
- **Routing:** `POST /api/gap/routing/run?mode=apply` (session or header token; a dry run without `mode=apply`; `src/app/api/gap/routing/run/route.ts`).
- **Research for one card:** `POST /api/gap/research` `{ decisionId }` (session; writes research records only; `src/app/api/gap/research/route.ts:1-9`).
- **An approved CRM change:** use Retry on the deal brief (`POST /api/gap/crm-sync` `{ op: 'retry', proposalId }`). It writes only with `GAP_OS_ENABLED`, `GAP_HUBSPOT_MIRROR_ENABLED`, `HUBSPOT_SYNC_ENABLED` and a token (`src/lib/gap/crm-sync.ts:63-69`).
- **Health:** `GET /api/gap/health`, read only, any time.

## 4. How to roll back

1. **Code:** in Vercel, promote or redeploy the previous production deployment. Before this program that was `672570ed`, `dpl_5tW92dBWDxnL8VquojbfBedmu8MP` (`docs/GAP_PROSPECTING_OS.md:775`, `:783`). The release packet names the exact one for each release.
2. **Flags, narrowest first:**
   - `GAP_HUBSPOT_MIRROR_ENABLED` off stops every GAP HubSpot write.
   - `GAP_BACKGROUND_RESEARCH_ENABLED` off stops research and discovery.
   - `GAP_ROUTING_ENABLED` off stops Work, the account page, signal processing, HubSpot reply reads, health and coverage.
   - `GAP_OS_ENABLED` off stops every GAP surface and cron.

   A flag changed in Vercel takes effect on the next request after a redeploy (`src/lib/gap/flags.ts:3-11`). `OUTREACH_PAUSED` is the separate all-outreach stop (`src/lib/feature-flags.ts:42`).
3. **Data stays:**
   - `gap_audit_events`, `hypothesis_events` and `sequence_copy_events` refuse UPDATE and DELETE by trigger (`GAP_APPEND_ONLY`, `prisma/sql/2026-09-23-gap-os.sql:19`, `:334-358`). New ledger kinds go inert under older code; no row needs undoing.
   - `system_config` rows `gap:pursuit:<account>` are display summaries no send path reads. They are disposable, and deleting one costs a cold account read.
   - `cron:<name>` rows are monitor state.
   - The program adds no table and no schema change.
