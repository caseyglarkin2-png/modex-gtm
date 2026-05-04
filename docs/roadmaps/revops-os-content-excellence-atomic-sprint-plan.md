# RevOps OS Content Excellence + Multi-Infographic Conversion Roadmap

<!-- markdownlint-disable MD013 MD022 MD024 MD032 MD060 -->

**Status:** Draft for approval  
**Target quality bar:** A+ atomic sprint plan (proof-first, demoable each sprint)  
**Scope:** Optimize generated and sent content outcomes from cold outreach to customer conversion.

## Integration Status Snapshot (As-Is, 2026-05-04)

### Apollo Integration

- Implemented in code:
  - API client and configuration gate in `src/lib/enrichment/apollo-client.ts`.
  - Match + enrichment pipeline in `src/lib/enrichment/apollo-enrichment.ts` and `src/lib/enrichment/apollo-match.ts`.
  - Re-enrichment cron runner in `src/lib/cron/reenrich-contacts.ts` with API route at `/api/cron/reenrich-contacts`.
- Current status:
  - Functional when `APOLLO_API_KEY` is present.
  - Deployed path exists, but volume/backfill operating mode for TAM-scale enrichment is not yet productized.

### HubSpot Integration

- Implemented in code:
  - Client and retry wrapper in `src/lib/hubspot/client.ts`.
  - Contact sync/read/write functions in `src/lib/hubspot/contacts.ts`.
  - Incremental ingestion checkpointing in `src/lib/enrichment/hubspot-ingestion.ts`.
  - Bidirectional sync cron route at `/api/cron/sync-hubspot`.
  - Contact import route at `/api/contacts/import`.
- Current status:
  - Integration is feature-complete in code, but sync behavior is flag-gated.
  - Current environment shows `HUBSPOT_SYNC_ENABLED=false`, so scheduled sync will skip until explicitly enabled.
  - Bulk TAM/ICP backfill workflow and runbook are still missing as an operator-grade flow.

### Immediate Gap Summary

1. Connector capability exists, but production operating mode is not yet tuned for high-volume TAM/ICP population.
2. Coverage telemetry is incomplete for "how many of 1,000 companies and 13,000 contacts are imported, enriched, send-ready, and attributed."
3. Backfill throughput, retry envelopes, and quality gates need first-class sprint ownership.

## Why This Roadmap Exists

RevOps OS consolidation is complete through Sprint 11. The next phase is not more navigation work; it is content and send effectiveness:

1. Better message quality before send.
2. Better execution controls during send.
3. Better learning loops after response.
4. Better visual storytelling across the funnel (multiple custom infographics, not just one).

## Operator Feedback Reset (Added 2026-05-04)

This roadmap is now explicitly reoriented around reducing operator friction, not adding more review surfaces.

### Non-Negotiable Product Direction

1. **Account route is the operating surface for outreach.**
   - For account-specific outreach, `/accounts/[slug]` is the canonical launch point for generate -> preview -> send.
   - `/generated-content` remains useful for batch review, analytics, and queue management, but it must not be a required detour for common account-level sends.
2. **QA checklist becomes automated policy evaluation.**
   - Manual checkbox persistence is not the target operating model.
   - Required QA checks must be evaluated automatically from content + metadata + recipient state, with explicit exception handling only when policy requires it.
3. **Canonical account/contact/company records are mandatory.**
   - The system must stop scattering contact and company truth across disconnected tables, imports, and generated-content side state.
   - Account, company, and contact identity resolution must have explicit source precedence, conflict handling, and operator-visible canonical ownership.
4. **Less clicks is a hard requirement.**
   - Default path should minimize route changes, copy/paste steps, and modal nesting between account selection and outreach execution.
   - Any new workflow step must justify itself by automation, not by asking the operator to do more review labor.

## TAM/ICP Coverage Objective (Added)

Primary operating objective before advanced optimization:

- Load and maintain coverage measured against explicit Gate 0 threshold contracts for:
  - ~1,000 target companies.
  - ~13,000 target contacts.
- Maximize safe, high-confidence enrichment and linkage to account + campaign + deal entities.
- Make coverage and enrichment progress visible daily in product analytics and Ops views.

This roadmap now prioritizes coverage + enrichment execution first, then content optimization.

## Baseline-First KPI Framework

No arbitrary uplift targets are used in this roadmap. Each KPI starts with a measured baseline, then moves by evidence-backed iterations.

### Primary Revenue KPIs

- `deal_value`: total and average value of created/progressed/won deals linked to content and send activity.
- `deal_velocity`: median and percentile time from first outbound touch -> meeting -> proposal -> closed-won.
- `deal_quantity`: count of new qualified deals, proposal-stage deals, and closed-won deals over time.

### Activity KPIs (Sales + Marketing)

- `sales_activity`: outbound sends, follow-ups completed, meetings booked/held, opportunity stage movements.
- `marketing_activity`: campaigns launched, content variants shipped, infographic bundles sent, engagement sessions generated.

### Effectiveness and Learning KPIs

- `message_effectiveness`: reply rate, positive reply rate, meeting conversion rate by variant/segment.
- `execution_reliability`: send failure rate, retry recovery rate, blocked-send rate.
- `learning_cycle_time`: time from observed signal to approved messaging update.
- `variant_confidence`: number of experiments with sufficient sample and confidence for winner-candidate designation.

### KPI Governance Rules

- Baseline window must be captured before optimization sprint claims.
- Every performance claim must include sample size and confidence band.
- Winner claims require control/holdout comparison or explicit quasi-experimental rationale.
- KPI views must be segmentable by persona, industry, funnel stage, and campaign type.

### Baseline + Re-Baseline Protocol (Required)

- Baseline window: minimum 28-day rolling period with no instrumentation schema changes.
- Baseline freeze: denominator definitions (`eligible_contacts`, `eligible_accounts`, `qualified_deals`) must be locked before experiment launch.
- Re-baselining allowed only when:
  - event contract version changes, or
  - material go-to-market segment definition changes are approved.
- Re-baseline cadence: monthly scheduled review plus explicit exception review.

### KPI Formula Contracts (Ground Truth)

- `deal_value`:
  - sum and avg of attributed `deal_amount` by stage transition and closed-won events.
  - de-dup key: (`deal_id`, `stage_entered_at`).
- `deal_velocity`:
  - median and p75 elapsed time from first attributed outbound send to each stage milestone.
  - required joins: `send_event -> account/persona -> deal`.
- `deal_quantity`:
  - count distinct `deal_id` entering qualification/proposal/closed-won windows.
- `sales_activity`:
  - count of sends, follow-ups, meetings booked/held, and stage changes by owner + campaign.
- `marketing_activity`:
  - count of campaigns launched, content variants published, infographic bundles sent, and tracked engagement sessions.

All KPI contracts require unit tests that assert denominator consistency and join coverage.

## Canonical Surfaces (No New Top-Level Modules)

- Content Studio: `/studio`
- Generated Content Workspace: `/generated-content`
- Work Queue: `/queue`
- Engagement: `/engagement`
- Analytics: `/analytics`
- Ops: `/ops`

All new functionality must live in these workspaces or their existing detail routes.

### Surface Ownership Rules (Added)

- `/accounts/[slug]` is the canonical route for account-level outreach execution, account-scoped content review, recipient selection, and direct send.
- `/generated-content` is the canonical route for batch operations across many accounts: bulk review, bulk publish, bulk queue/send, and cross-account filtering.
- `/contacts` is the canonical route for contact intake, conflict resolution, and canonical contact record maintenance.
- `/ops` is the canonical route for connector health, reconciliation, and data-quality command center actions.
- No feature may require the operator to visit `/generated-content` first in order to send a one-pager or other account-specific generated asset from an account detail route.

## Ground-Source Truth Rules (Required)

Every task must include:

```text
Task ID:
Current route(s):
Canonical route/view:
Seed/fixture:
User assertion:
Test command:
Required artifact:
Commit boundary:
```

Sprint closeout gate (every sprint):

- `npm run lint`
- `npx tsc --noEmit`
- affected unit tests
- affected Playwright tests
- screenshot/trace artifacts
- proof suite evidence with `executed > 0` and `skipped = 0`
- proof ledger entry update

## Shared Test Fixtures To Add Early

- Deterministic content fixture accounts:
  - `cold-account` (no engagement)
  - `warm-account` (opens/clicks, no replies)
  - `active-eval-account` (reply + meeting)
  - `late-stage-account` (proposal + commercial thread)
- Deterministic recipient confidence scenarios:
  - high confidence / medium / low / invalid
- Deterministic send outcomes:
  - sent / bounced / deferred / blocked / rate-limited
- Deterministic infographic fixtures:
  - value map, process map, ROI bridge, implementation plan, proof timeline

---

## Sprint 11.0: Connector Activation + Production Guardrails

**Goal:** Move Apollo + HubSpot from "implemented" to "operationally reliable" in production-safe mode.  
**Demo:** Operator can run controlled connector health checks and a dry-run sync with full observability.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S11.0.1 | Add connector health panel in `/ops` with Apollo configured state, HubSpot configured state, sync flag state, and last successful run timestamps. | Playwright `/ops` test | Connector health screenshot |
| S11.0.2 | Add `sync-hubspot` dry-run mode (no writes) with pull/push counters and sampled error classes. | API route unit test | Dry-run response fixture |
| S11.0.3 | Add cron runbook action buttons in `/admin/crons` for `sync-hubspot` and `reenrich-contacts` with signed audit entries. | Playwright admin-crons test | Cron action trace |
| S11.0.4 | Add per-connector failure budget alerts (429 burst, auth failure, schema mismatch) with actionable remediation text. | Unit alert-rule tests | Alert rule output |
| S11.0.5 | Add external write safety contract test pack for HubSpot write surfaces and enrichment writeback flows. | `npm run test:unit -- tests/unit/hubspot-contacts.test.ts tests/unit/enrichment-writeback-apply-route.test.ts` | Test output |
| S11.0.6 | Add connector ownership metadata (`owner`, `escalation_channel`, `runbook_link`, `last_rotation_date`) rendered in Ops connector panel. | Unit + Playwright tests | Ownership panel screenshot |
| S11.0.7 | Add connector mapping contract registry (field map version + checksum) for HubSpot/Apollo canonical merge paths. | Unit contract tests | Mapping registry output |
| S11.0.8 | Add HubSpot sync staged enablement runbook and control flow (`disabled -> canary cohort -> full`) with rollback switch verification. | Unit + Playwright rollback tests | Enablement runbook artifact |
| S11.0.9 | Add Apollo/HubSpot incident drill tests for auth failure, 429 burst, and schema drift proving alert-to-remediation path and SLA capture. | Integration + Ops test | Incident drill report |

---

## Sprint 11.1: TAM/ICP Company + Contact Backfill Ingestion

**Goal:** Ingest the initial TAM baseline at scale with deterministic dedupe and account/person linkage.  
**Demo:** System can ingest a bulk cohort and show coverage progression against 1,000 companies / 13,000 contacts.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S11.1.1 | Add `tam_import_batch` model (`batch_id`, source, row_count, accepted, rejected, linked, blocked, started_at, finished_at). | Migration + unit model tests | Migration output |
| S11.1.2 | Extend `/api/contacts/import` for chunked batch ingestion (100 ids/chunk) with resumable cursor tokens. | Route tests | Chunk import test output |
| S11.1.3 | Add deterministic dedupe precedence policy (hubspot id > verified email > normalized name+company) and conflict queue output. | Unit dedupe tests | Dedupe decision snapshot |
| S11.1.4 | Add account resolution policy with confidence score + "needs-review" fallback queue. | Unit policy tests | Resolution report |
| S11.1.5 | Add ingestion progress UI in `/ops` and `/contacts` showing companies covered, contacts covered, and unresolved entities. | Playwright UI tests | Coverage progress screenshot |
| S11.1.6 | Add seed fixture for 1,000-company/13,000-contact synthetic cohort used in scale tests. | Fixture contract tests | Fixture generation log |

---

## Sprint 11.2: Enrichment Throughput + Queueing for 13k Contacts

**Goal:** Enrich contacts at TAM scale without breaking quality and without connector overload.  
**Demo:** Re-enrichment queue processes staged cohorts with bounded retries and measurable throughput.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S11.2.1 | Add `enrichment_job_batch` model for queued enrichment cohorts with status and retry counters. | Migration + unit tests | Model test output |
| S11.2.2 | Add enrichment batching policy (`batch_size`, `max_parallel`, `retry_backoff`, `daily_budget`) in config + Ops controls. | Unit config tests | Policy config output |
| S11.2.3 | Extend `runReenrichContactsCron` to process deterministic queue slices instead of only recent-updated scan. | Unit cron-runner tests | Queue-run stats output |
| S11.2.4 | Add low-confidence/no-match triage queue with operator actions (`retry with alternate query`, `mark unresolvable`, `manual edit`). | Playwright queue tests | Triage queue screenshot |
| S11.2.5 | Add throughput telemetry (`contacts_processed_per_hour`, `match_rate`, `no_match_rate`, `avg_retry_count`). | Unit telemetry tests | Throughput metric output |
| S11.2.6 | Add scale test for 13,000-contact enrichment simulation with pass criteria on processing completeness and bounded failure rate. | Integration/contract test | Scale test report |
| S11.2.7 | Add connector cost/quota telemetry (`apollo_credits_used`, `hubspot_calls_used`, `cost_per_enriched_contact`, `p95_sync_duration`). | Unit + analytics tests | Cost telemetry output |

---

## Sprint 11.3: Company Enrichment + Relationship Graph Completeness

**Goal:** Ensure account-level enrichment and contact-to-company integrity are usable for messaging and analytics.  
**Demo:** Operator can trust company context and contact mapping in send and analytics surfaces.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S11.3.1 | Add company enrichment fields contract (industry, employee band, HQ region, domain confidence, last_verified_at). | Unit contract tests | Field contract output |
| S11.3.2 | Add account enrichment upsert path sourced from HubSpot + Apollo with merge policy precedence. | Unit merge tests | Merge output snapshot |
| S11.3.3 | Add company-contact integrity checks (`orphan contact`, `domain mismatch`, `multi-account collision`) with remediation queue. | Unit integrity tests | Integrity report |
| S11.3.4 | Surface company confidence and relationship warnings in `/contacts` and `/accounts/[slug]`. | Playwright UI tests | Integrity warning screenshot |
| S11.3.5 | Add linkage completeness metric (`linked_contacts / total_contacts`, `verified_companies / TAM_companies`). | Analytics unit tests | KPI output |
| S11.3.6 | Add Apollo/HubSpot/internal reconciliation dashboard (`field drift rate`, `record conflict rate`, `unresolved conflict SLA breach`) in `/ops?tab=coverage`. | Playwright + unit tests | Reconciliation screenshot |

---

## Sprint 11.3A: Canonical Record Model + Identity Resolution

**Goal:** Make account, company, and contact truth unambiguous before more send automation is layered on top.  
**Demo:** Every sendable contact and company shown in the UI resolves to a canonical record with visible provenance and conflict state.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S11.3A.1 | Define canonical identity contract for `account`, `company`, and `contact` records including external ids, normalized keys, provenance, and `canonical_record_id`. | Unit contract tests | Identity contract output |
| S11.3A.2 | Add source precedence policy for canonical merge (`hubspot company/contact id -> verified email/domain -> normalized name + company`) with deterministic tie-break rules. | Unit merge-policy tests | Merge precedence snapshot |
| S11.3A.3 | Persist provenance and field-level ownership for canonical records so operators can see which system currently owns each field. | Unit persistence tests | Provenance output |
| S11.3A.4 | Add conflict states (`duplicate_contact`, `duplicate_company`, `multi-account_collision`, `orphan_contact`, `domain_conflict`) with first-class remediation queue in `/contacts`. | Playwright + unit queue tests | Conflict queue screenshot |
| S11.3A.5 | Add canonical-record summary card on `/accounts/[slug]` showing company source, linked contacts, unresolved conflicts, and sendable contact count. | Playwright account proof | Account canonical-summary screenshot |
| S11.3A.6 | Enforce canonical record lookup in send APIs so outbound uses resolved canonical contacts/companies instead of ad hoc route payload assumptions. | API contract tests | Canonical send-lookup proof |

---

## Sprint 11.3B: Account-Native Outreach Launchpad

**Goal:** Remove the generated-content detour for account-specific outreach.  
**Demo:** Operator can generate, review, select recipients, and send one-pagers or custom generated assets directly from `/accounts/[slug]`.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S11.3B.1 | Add account-scoped generated asset panel on `/accounts/[slug]` with latest versions, send status, quality summary, and primary CTA actions. | Playwright account proof | Account asset-panel screenshot |
| S11.3B.2 | Add direct `Preview & Send` flow on `/accounts/[slug]` that hydrates latest account content and canonical recipients without opening `/generated-content`. | Playwright end-to-end account-send test | Account send trace |
| S11.3B.3 | Support account-level sending for one-pagers and other generated content types through one send launcher contract (`content_version_id`, `asset_type`, `recipient_ids`, `account_id`). | API route tests | Send launcher payload proof |
| S11.3B.4 | Add account-level quick actions (`send latest`, `regenerate`, `swap contact`, `queue follow-up`) with defaults chosen from canonical account context. | Playwright action tests | Quick actions screenshot |
| S11.3B.5 | Keep `/generated-content` as batch workspace only and remove any UX requirement that account sends originate there first. | Route + interaction regression tests | UX contract proof |
| S11.3B.6 | Add account-send telemetry (`launch_from_account`, `recipient_autoselected_count`, `clicks_to_send`, `send_block_reason`) to prove click reduction. | Unit + analytics tests | Click-reduction telemetry output |

---

## Sprint 11.4: Coverage Command Center + Go/No-Go Quality Gate

**Goal:** Make TAM/ICP coverage operationally visible and enforce go/no-go before optimization sprints.  
**Demo:** Coverage dashboard and quality gate clearly indicate readiness to start content optimization.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S11.4.1 | Build `/ops?tab=coverage` command center with progress bars for companies, contacts, enrichment confidence tiers, and send-ready rate. | Playwright Ops test | Coverage dashboard screenshot |
| S11.4.2 | Add daily delta reporting (`newly_ingested`, `newly_enriched`, `degraded`, `stale`) with downloadable table. | API + unit tests | Delta report output |
| S11.4.3 | Add go/no-go gate rules for optimization sprints (coverage, enrichment confidence, data freshness, attribution key completeness). | Unit gate-rule tests | Gate evaluation output |
| S11.4.4 | Add gate status badge on roadmap tracker and proof ledger schema extension for coverage gate evidence links. | Unit + doc contract tests | Proof ledger entry sample |
| S11.4.5 | Add operator playbook doc for TAM backfill + weekly maintenance cycle. | Docs lint + link checks | Playbook markdown artifact |
| S11.4.6 | Define hard Gate 0 threshold contract and fail-close behavior in product + proof ledger (`min coverage thresholds`, `max unresolved conflicts`, `max stale rate`). | Unit threshold tests + Playwright gate-state test | Gate contract output |

### Coverage KPI Contracts (Required for Gate 0)

- `% companies imported = imported_companies / 1000`
- `% contacts linked = linked_contacts / 13000`
- `% contacts enriched = enriched_contacts / 13000`
- `% send-ready contacts = send_ready_contacts / 13000`
- `% attributable contacts = contacts_with_attribution_keys / 13000`

All percentages must be computed per-segment and blended:
- by persona lane,
- by industry/vertical,
- by funnel stage/campaign type.

---

## Sprint 11.5: Measurement Foundation (Required Before Optimization)

**Goal:** Establish trustworthy activity tracking and attribution before optimization features.  
**Demo:** KPI dashboards can show deal value/velocity/quantity and activity flows with data quality checks.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S11.5.1 | Define canonical event taxonomy + IDs (`send_id`, `send_job_id`, `content_version_id`, `variant_id`, `account_id`, `campaign_id`, `operator_action_id`, `deal_id`). | Unit schema tests | Event schema output |
| S11.5.2 | Add attribution contract for deal quantity/value/velocity across stages with explicit windows and de-dup rules. | Unit attribution-contract tests | Contract test output |
| S11.5.3 | Add activity event QA dashboard in Ops (`event volume`, `null key rate`, `schema drift`, `late event rate`). | Playwright Ops proof | Ops QA screenshot |
| S11.5.4 | Add analytics baseline capture views for primary KPIs and sales/marketing activity KPIs. | Playwright analytics proof | Baseline dashboard screenshot |
| S11.5.5 | Add data freshness + integrity SLO checks to closeout gate (`event loss rate`, `join coverage`, `attribution completeness`). | Unit + integration checks | SLO report output |
| S11.5.6 | Define KPI claimability threshold contract (`min per-segment sample`, `min attribution completeness`, `max null-key rate`, `confidence floor`) and enforce with analytics badge/export gating. | Unit + analytics UI tests | Claimability gate report |

---

## Sprint 12: Pre-Send Quality Scorecard

**Goal:** Every generated asset has explainable quality scoring before send.  
**Demo:** Generated content card and send dialog show quality score, risk flags, and actionable fixes.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S12.1 | Define quality scoring contract (`clarity`, `personalization`, `cta_strength`, `compliance_risk`, `deliverability_risk`) in `src/lib/content-quality.ts`. | `npm run test:unit -- tests/unit/content-quality.test.ts` | Contract unit test output |
| S12.2 | Compute score for each generated content version in `/generated-content` query layer. | Unit test for query mapper | Updated mapper snapshot |
| S12.3 | Add quality badge + expandable score breakdown to generated content grid cards. | Playwright workspace UI proof | Screenshot: quality badges visible |
| S12.4 | Add send-block threshold and override acknowledgment in one-pager send dialog. | Unit + Playwright send dialog test | Screenshot + pass logs |
| S12.5 | Add score trend sparkline for account versions (v1..vn). | Component test | Screenshot of trend |
| S12.6 | Add Ops tab summary: low-score assets awaiting review. | Playwright `/ops` tab proof | Ops screenshot |

---

## Sprint 13: Variant Experiment Builder

**Goal:** Launch A/B/n message experiments from send workflow.  
**Demo:** Operator can create subject/body variants, allocate audience split, and queue experiment send job.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S13.1 | Define experiment schema (`experiment_id`, `variant_id`, `split`, `primary_metric`) and DB migration. | Migration + unit model tests | Migration output |
| S13.2 | Add variant builder UI in bulk preview dialog (subject/opening/CTA). | Playwright dialog test | Variant builder screenshot |
| S13.3 | Add recipient split allocator with deterministic preview counts. | Unit split algorithm tests | Allocation test output |
| S13.4 | Persist experiment assignments onto send job recipients. | API route unit tests | Route test output |
| S13.5 | Add experiment tracker panel in `/analytics?tab=email-engagement`. | Playwright analytics proof | Analytics screenshot |
| S13.6 | Add winner-candidate workflow gated by minimum sample size, confidence threshold, and holdout/control check. | Unit + interaction test | Winner-candidate panel screenshot |

---

## Sprint 14: Recipient Readiness Panel

**Goal:** Prevent low-quality targeting before send.  
**Demo:** Each recipient row has readiness tier and fix path.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S14.1 | Define readiness score composition (`contact_confidence`, `role_fit`, `account_context`, `freshness`). | Unit scoring tests | Scoring output |
| S14.2 | Add readiness columns to recipient selectors in single + bulk send dialogs. | Playwright send dialog proof | Recipient readiness screenshot |
| S14.3 | Add auto-filter toggles (`show high confidence only`, `hide stale`). | Component test | Filter behavior output |
| S14.4 | Add inline remediation actions (`replace contact`, `open contacts`, `defer`). | Playwright action test | Action trace |
| S14.5 | Add pre-send hard stop when readiness floor not met for campaign policy. | API + UI tests | Block behavior proof |

---

## Sprint 15: Send Strategy Controls

**Goal:** Improve deliverability and execution discipline.  
**Demo:** Operator configures send windows, caps, pacing, and domain controls in send flow.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S15.1 | Add send strategy model (`timezone_window`, `daily_cap`, `domain_cap`, `pacing_mode`). | Unit model test | Model test output |
| S15.2 | Add strategy controls in bulk preview/send dialogs. | Playwright dialog proof | Controls screenshot |
| S15.3 | Enforce caps and pacing in `/api/email/send-bulk-async`. | API route tests | Route pass output |
| S15.4 | Add queue-level visibility of strategy constraints in `/queue?tab=system-jobs`. | Playwright queue proof | Queue screenshot |
| S15.5 | Add safety presets (`safe`, `balanced`, `aggressive`) with explicit warnings. | Unit + component tests | Preset screenshot |

---

## Sprint 16: Automated Content QA Policy Engine

**Goal:** Standardize quality before approval/send without making the operator manually complete checklists.  
**Demo:** System evaluates required QA policies automatically, shows evidence/reasons, and only asks for intervention when a true exception exists.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S16.1 | Define automated QA policy contract for required checks (`clear_value_prop`, `account_specific_proof`, `cta_specific`, `compliance_checked`, `deliverability_checked`) with policy mapping by campaign type. | Unit tests | Policy contract output |
| S16.2 | Build evaluator pipeline that scores/passes/fails required policies from generated content, account context, and recipient metadata at generation time. | Unit evaluator tests | Evaluator fixture output |
| S16.3 | Re-run QA evaluation before send and persist structured machine verdicts + evidence on each content version. | API + unit tests | Persisted verdict output |
| S16.4 | Replace manual checklist-save UX with read-only pass/fail evidence panel plus exception override only when policy permits. | Playwright proof | QA evidence screenshot |
| S16.5 | Add QA policy filters in account and generated-content workspaces (`passed`, `exception-required`, `failed-hard`). | Component + Playwright tests | Filter screenshot |
| S16.6 | Add QA failure analytics in `/analytics?tab=campaigns` and `/ops` by policy, campaign type, provider, and account segment. | Playwright analytics proof | Analytics screenshot |

---

## Sprint 17: Content Performance Attribution

**Goal:** Attribute outcomes to content variants/providers/prompts.  
**Demo:** Analytics can rank content by reply/meeting/pipeline impact.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S17.1 | Create attribution pipeline joining sends, engagement events, meetings, and pipeline movements to content version IDs, with explicit attribution windows and de-dup rules. | Unit data + attribution-contract tests | Attribution output |
| S17.2 | Add analytics tab subviews for `By Variant`, `By Provider`, `By Prompt Template`. | Playwright analytics proof | Attribution dashboard screenshot |
| S17.3 | Add confidence badges for low sample sizes. | Unit tests | Badge rules output |
| S17.4 | Add campaign-level attribution summary card. | Playwright campaign analytics proof | Campaign screenshot |
| S17.5 | Add export endpoint for attribution table (`/api/export?type=content-attribution`). | API route tests | CSV contract proof |

---

## Sprint 18: Engagement-to-Content Learning Loop

**Goal:** Convert engagement signals directly into content improvements.  
**Demo:** From engagement items, operator can regenerate with context and track before/after outcomes.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S18.1 | Add signal-to-content mapping model (which send/version triggered signal). | Unit mapper tests | Mapping output |
| S18.2 | Add `Regenerate from Signal` action on Engagement cards. | Playwright engagement proof | Engagement screenshot |
| S18.3 | Pre-fill regeneration prompt with outcome context (`reply objection`, `bounce reason`, etc.). | Unit prompt tests | Prompt fixture output |
| S18.4 | Add side-by-side old/new version diff modal. | Component test | Diff screenshot |
| S18.5 | Add follow-up queue item typed as `content-revision-required`. | Queue tests | Queue trace |
| S18.6 | Add `message evolution registry` entry creation (change rationale, evidence snapshot, rollback link) for each approved messaging update. | Unit + integration tests | Registry entry proof |
| S18.7 | Add weekly learning-review workflow (`proposed update -> review -> approve/reject -> deploy/rollback`) with owner + SLA tracking. | Playwright + unit workflow tests | Weekly review board screenshot |

---

## Sprint 19: Failure Intelligence Center

**Goal:** Make failure remediation fast and systematic.  
**Demo:** Failures are clustered by cause with one-click remediation bundles.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S19.1 | Add failure classifier (`invalid-email`, `domain-reject`, `provider-throttle`, `policy-block`, `unknown`). | Unit classifier tests | Classifier output |
| S19.2 | Build failure cluster UI in `/ops?tab=generation-metrics` and `/engagement?tab=bounces-failures`. | Playwright proof | Cluster screenshot |
| S19.3 | Add bulk remediation actions (`retry later`, `switch persona`, `mark bad address`). | API + UI tests | Action trace |
| S19.4 | Add retry recommendation engine based on historical recovery rates. | Unit tests | Recommendation output |
| S19.5 | Add weekly failure trend card to analytics engagement tab. | Playwright analytics proof | Trend screenshot |

---

## Sprint 20: Playbook Library (Winning Blocks)

**Goal:** Reuse what works across accounts and campaigns.  
**Demo:** Winning intros/CTAs/story blocks are saved, tagged, and suggested during generation.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S20.1 | Create playbook block model and tagging system (industry, persona, stage, motion). | Unit model tests | Model output |
| S20.2 | Add `Save as Playbook Block` action in studio and generated-content previews. | Playwright proof | Save action screenshot |
| S20.3 | Add block recommendation chipset in generator dialogs/prompts API. | Unit + component tests | Recommendation screenshot |
| S20.4 | Add block performance ranking from attribution data with segment-aware confidence scoring (persona/industry/stage). | Unit tests | Ranking output |
| S20.5 | Add playbook management tab in `/studio`. | Playwright studio proof | Studio tab screenshot |

---

## Sprint 21: Approval Workflows for Risky Sends

**Goal:** Add governance without slowing good sends.  
**Demo:** Policy-triggered approvals route to approvers with diff + risk context.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S21.1 | Define approval policy engine (volume threshold, low score, new domain, high bounce risk). | Unit policy tests | Policy output |
| S21.2 | Add approval queue tab enhancements in Work Queue (`approvals`) with risk cards. | Playwright queue proof | Approval queue screenshot |
| S21.3 | Add approve/reject/comment actions and audit trail persistence. | API + unit tests | Audit output |
| S21.4 | Enforce policy gate in send APIs (single + bulk + async). | Route tests | Gate behavior proof |
| S21.5 | Add approval SLA metric in Ops tab. | Playwright ops proof | SLA screenshot |

---

## Sprint 22: Campaign Brief -> Generation Contract

**Goal:** Force strategic intent before content generation.  
**Demo:** Campaign brief contract drives prompt composition and completion checks.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S22.1 | Create generation contract schema (`objective`, `persona hypothesis`, `offer`, `proof`, `cta`, `metric`). | Unit contract tests | Contract output |
| S22.2 | Add required brief form in campaign workspace before generation actions. | Playwright campaign proof | Brief screenshot |
| S22.3 | Wire prompt APIs to include contract payload and reject missing contract for policy-enabled campaigns. | API unit tests | API contract proof |
| S22.4 | Add contract completeness status chips in generated content cards. | Component tests | Status screenshot |
| S22.5 | Add analytics correlation between contract quality and outcomes. | Unit + analytics UI tests | Correlation view screenshot |

---

## Sprint 23: Operator Outcome Logging

**Goal:** Capture granular operator outcomes and feed the learning loop.  
**Demo:** One-click dispositions from engagement/queue update account, content, and analytics.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S23.1 | Define outcome taxonomy (`positive`, `neutral`, `negative`, `wrong-person`, `bad-timing`, `closed-won`, `closed-lost`). | Unit taxonomy tests | Taxonomy output |
| S23.2 | Add quick outcome actions to engagement and queue cards. | Playwright proof | Outcome action screenshot |
| S23.3 | Persist outcomes with links to account/campaign/content version. | API + unit tests | Persistence output |
| S23.4 | Add outcome trend dashboard in analytics. | Playwright analytics proof | Trend screenshot |
| S23.5 | Feed outcome labels into prompt recommendations and playbook ranking. | Unit tests | Feedback loop output |
| S23.6 | Add operator outcome quality audit (`missing`, `ambiguous`, `conflicting` labels) with remediation queue. | Unit + queue tests | Outcome quality report |

---

## Sprint 24: One-Pager Variability Foundation (Infographic Taxonomy)

**Goal:** Define and operationalize multiple infographic types by journey stage.  
**Demo:** Studio supports selecting infographic type and stage intent.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S24.0 | Add instrumentation contract for infographic events (`infographic_type`, `stage_intent`, `bundle_id`, `sequence_position`). | Unit contract tests | Instrumentation output |
| S24.1 | Define infographic taxonomy by stage: `Cold Hook`, `Diagnostic Gap`, `Value Path`, `Implementation Plan`, `Proof Snapshot`, `Executive ROI`. | Unit taxonomy tests | Taxonomy fixtures |
| S24.2 | Add stage-to-infographic recommendation logic in studio generator. | Unit recommendation tests | Recommendation output |
| S24.3 | Add infographic type selector in one-pager generation UI. | Playwright studio proof | Selector screenshot |
| S24.4 | Add template-level quality checks per infographic type. | Unit validator tests | Validation output |
| S24.5 | Add generated content tags for infographic type + stage. | Query tests | Tagged card output |

---

## Sprint 25: Multi-Infographic Bundle Builder

**Goal:** Generate more than one custom infographic per account motion.  
**Demo:** Operator can generate a 3-5 asset bundle for a single account in one flow.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S25.0 | Add bundle activity tracking (`bundle_created`, `bundle_published`, `bundle_sent`, `bundle_engaged`) linked to deal and campaign entities. | Unit + integration tests | Bundle tracking proof |
| S25.1 | Add `bundle generation` API accepting stage sequence and persona context. | API route tests | Route proof |
| S25.2 | Build bundle composer in Studio with preset journey paths (`cold->meeting`, `meeting->proposal`, `proposal->close`). | Playwright studio proof | Bundle composer screenshot |
| S25.3 | Render bundle preview with per-asset quality and readiness scores. | Component tests | Bundle preview screenshot |
| S25.4 | Add bundle publish action to Generated Content workspace. | Playwright workspace proof | Publish screenshot |
| S25.5 | Add bundle send flow with per-asset sequencing controls. | End-to-end Playwright proof | Send sequence trace |

---

## Sprint 26: Infographic Journey Orchestration (Cold to Customer)

**Goal:** Orchestrate visual narrative delivery over time, not single-shot sends.  
**Demo:** Journey engine schedules and triggers stage-appropriate infographics based on engagement outcomes.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S26.0 | Add journey transition telemetry (from-stage/to-stage reason codes + triggering signal IDs). | Unit telemetry tests | Transition telemetry output |
| S26.1 | Define journey state machine (`cold`, `engaged`, `discovery`, `evaluation`, `proposal`, `customer`). | Unit state-machine tests | State diagram output |
| S26.2 | Add rules mapping engagement outcomes to next infographic asset. | Unit rule tests | Rule output |
| S26.3 | Add journey timeline UI in account and campaign workspaces. | Playwright account/campaign proof | Timeline screenshot |
| S26.4 | Add automatic queue item generation for next infographic touch. | Queue tests | Queue proof |
| S26.5 | Add manual override controls for operator discretion. | Playwright interaction proof | Override trace |

---

## Sprint 27: Infographic Performance + Promotion Candidates

**Goal:** Learn which infographic patterns convert and produce promotion candidates with governance.  
**Demo:** Analytics ranks infographic types/stages and recommends promotion candidates for approval.

### Atomic Tasks

| Task ID | Atomic ticket | Validation | Required artifact |
| :--- | :--- | :--- | :--- |
| S27.0 | Add infographic analytics confidence and holdout checks before promotion candidacy. | Unit + analytics tests | Confidence check output |
| S27.1 | Add infographic performance attribution dimensions (`type`, `stage`, `sequence_position`). | Unit attribution tests | Attribution output |
| S27.2 | Add infographic leaderboard dashboard in analytics. | Playwright analytics proof | Leaderboard screenshot |
| S27.3 | Add promotion-candidate rules for winning infographic templates with approval gate. | Unit rules tests | Promotion output |
| S27.4 | Add recommendation updates to Studio based on leaderboard winners. | Studio component tests | Recommendation screenshot |
| S27.5 | Add Ops monitor for drift (when winner performance decays). | Playwright ops proof | Drift monitor screenshot |
| S27.6 | Add promotion safety gate requiring holdout stability across two review windows before default recommendation enablement. | Unit gate tests | Promotion gate report |

---

## Release Gates By Phase

### Gate 0 (S11.0-S11.4): TAM/ICP Population and Enrichment Readiness
- Connector activation complete and monitored in Ops.
- Backfill ingestion pipeline proven on large synthetic cohort and real staged cohorts.
- Coverage command center live with company/contact/enrichment completeness visibility.
- Go/No-Go quality gate passing before optimization starts.
- Reconciliation dashboard passing conflict SLAs.
- Connector ownership, escalation, and runbook metadata present for Apollo + HubSpot.

### Gate A (S12-S15): Send Quality and Safety
- Measurement foundation sprint completed and data quality gate passing.
- Quality score and recipient readiness live.
- Strategy controls enforced in async send route.
- Zero critical regressions in send flows.

### Gate B (S16-S19): Learning Loop and Reliability
- Automated QA policy engine + attribution + failure intelligence operational.
- Engagement-to-content loop proven in UI click tests.
- Weekly trend cards available in analytics.

### Gate C (S20-S23): Repeatability and Governance
- Playbook library and approval workflows active.
- Campaign generation contracts required by policy.
- Outcome logging feeding recommendations.

### Gate D (S24-S27): Multi-Infographic Conversion System
- Bundle generation and journey orchestration live.
- Infographic events are attributable end-to-end from generation to deal outcomes.
- Infographic leaderboard and promotion-candidate workflow active with approval.

### Cross-Phase Data Quality Gate (Required)
- Event loss rate below agreed threshold for all canonical event families.
- Schema drift detection passing for tracked event contracts.
- Late-event tolerance metrics published and within expected bounds.
- Attribution completeness and join coverage reported for deal quantity/value/velocity.

---

## Proof-First Test Pack (Minimum)

- Unit:
  - `tests/unit/hubspot-ingestion.test.ts`
  - `tests/unit/reenrich-contacts-runner.test.ts`
  - `tests/unit/apollo-enrichment.test.ts`
  - `tests/unit/enrichment-connectors-contract.test.ts`
  - `tests/unit/tam-dedupe-policy.test.ts`
  - `tests/unit/coverage-gate-rules.test.ts`
  - `tests/unit/activity-event-contracts.test.ts`
  - `tests/unit/deal-attribution-contract.test.ts`
  - `tests/unit/content-quality.test.ts`
  - `tests/unit/experiment-allocation.test.ts`
  - `tests/unit/recipient-readiness.test.ts`
  - `tests/unit/approval-policy.test.ts`
  - `tests/unit/infographic-journey.test.ts`
- E2E:
  - `tests/e2e/ops-coverage-command-center.spec.ts`
  - `tests/e2e/tam-backfill-import.spec.ts`
  - `tests/e2e/connector-health-crons.spec.ts`
  - `tests/e2e/content-quality-send-gate.spec.ts`
  - `tests/e2e/variant-experiment-send.spec.ts`
  - `tests/e2e/engagement-learning-loop.spec.ts`
  - `tests/e2e/infographic-bundle-journey.spec.ts`
  - `tests/e2e/infographic-performance-analytics.spec.ts`

Each sprint must add or update only the affected tests, plus screenshot/trace artifacts.

## Explicit Non-Goals

- No new top-level sidebar modules.
- No large backend re-architecture unrelated to content/send outcomes.
- No removal of legacy aliases without alias proof.
- No sprint closes without proof ledger evidence.

## Approval Gate

Do not execute this roadmap until approved.  
Recommended impact-first implementation order:

1. **Sprint 11.0 (Connector Activation + Guardrails)**
2. **Sprint 11.5 partial (S11.5.1-S11.5.3 only) for instrumentation + attribution contracts**
3. **Sprint 11.1 (TAM/ICP Backfill Ingestion)**
4. **Sprint 11.2 (Enrichment Throughput + Queueing)**
5. **Sprint 11.3 (Company Enrichment + Relationship Integrity)**
6. **Sprint 11.3A (Canonical Record Model + Identity Resolution)**
7. **Sprint 11.3B (Account-Native Outreach Launchpad)**
8. **Sprint 11.4 (Coverage Command Center + Go/No-Go Gate)**
9. **Sprint 11.5 remainder (S11.5.4-S11.5.5)**
10. **Sprint 12 (Pre-Send Quality Scorecard)**
11. **Sprint 14 (Recipient Readiness Panel)**
12. **Sprint 16 (Automated Content QA Policy Engine)**
13. **Sprint 17 (Content Performance Attribution)**
14. **Sprint 23 (Operator Outcome Logging)**
15. **Sprint 18 (Engagement-to-Content Learning Loop)**
16. **Sprints 13, 15, 19-22, 24-27 in numerical order unless blocked dependencies require local reorder**
