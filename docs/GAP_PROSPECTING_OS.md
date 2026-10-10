# YardFlow GAP Prospecting OS: production build specification

STATUS: ACTIVE. Current corrective audit: "GAP OS COMMERCIAL CONTEXT AND EXECUTION AUDIT" below (October 8 New York, main a195467). Historical DONE labels are implementation receipts, not blanket seller acceptance.  Current state lives in `docs/gap/STABLE_BASELINE.md` (seller dogfood mode; V2 SHIPPED 2026-10-02; the account-first UX SHIPPED 2026-10-06, `docs/gap/ACCOUNT_FIRST_UX.md`). The live ticket ledger is the "GAP OS EXECUTION RECOVERY" section near the end of section 11 (2026-10-06, in progress). This file is the historical build spec and ticket ledger; the FINISH pass it once tracked on feat/gap-os-finish is long merged.
<!-- verified:2026-10-06 -->

Supersedes the draft `Downloads/YardFlow_GAP_Prospecting_OS_Spec.md` (2026-09-23), which named `caseyglarkin2-png/GTM-YardFlow` as the host. Reconnaissance showed that repo is an abandoned prototype; this document is the single master plan and lives in the repo that hosts the build. There is no second plan. Every accepted implementation or reviewer finding that changes work is folded back into this file in the same commit.

**Host:** `modex-gtm` (this repo). **Execution target:** the Top100 lane (`C:\Users\casey\yardflow-hubspot\top100\`) driving native HubSpot Sequences, with modex's Draft Queue as the secondary Gmail lane. **Hypothesis seed:** the PIC charts (`C:\Users\casey\war-room\data\pics\`). **Authorities left untouched:** clawd (suppression contract, autonomy kill-switch, signal producer) and war-room (PIC pages, review feed).

## 0. Core principle and loop

> Goal = truth, not meeting.

> Signal -> Prospecting Hypothesis -> Buyer/Persona -> GAP outreach -> Buyer Input Data (BID) -> Hypothesis resolution -> Learning -> Better routing.

The seller-inference object is `ProspectingHypothesis`. The buyer-truth object is `BuyerInputData`. A sequence is an execution mechanism, not the central object. If the result is merely a nicer sequence builder, the project failed.

Design principles (unchanged from the draft): optimize for truth; separate observed fact from inference and never render an inference as an observation; never invent personalization, unsupported prospect-specific facts fail closed; intent fields affect routing and urgency, never copy; humans approve hypothesis activation, factual observations used in copy, new live sequence versions, and AI classifications before they become CRM truth; suppression, unsubscribe, bounce and DNC override routing; a rejected hypothesis is useful learning.

Non-negotiables for the build: every ticket atomic and committable with a test or explicit validation; every sprint ends runnable; strict file ownership, no two agents on one file; existing infrastructure and conventions; unsupported observations fail closed; FACT and HYPOTHESIS distinct; BID is buyer truth, never seller or AI inference; no private intent in copy by default; suppression and DNC win; no autonomous cold enrollment until the shadow and canary gates below are earned; sequence versions immutable once used by real prospects.

## 1. What reconnaissance found (2026-09-23, four read-only agents plus lead verification of every cited line)

### 1.1 GTM-YardFlow (the draft's named host) is dead
- Public repo, last push 2026-02-09, no local checkout. Vite/React + Firebase; Firestore is the live store. Prisma/Postgres/Redis live in a separate repo `YardFlow-Hitlist` (last push 2026-02-06) running idle on Railway project `innovative-ambition` (all queues at 0; last app deploy 2026-02-18).
- Read-only prod probes: the SPA and `/api/email/health` return 200; `/api/email/unsubscribe`, `/api/email/webhook`, `/api/email/inbound` return 500 FUNCTION_INVOCATION_FAILED (the unfixed "Sprint 53" bundling blocker). Unsubscribe links from that system are broken today.
- Sequences mutable and unversioned; `AutoEnrollService`, `HubSpotSyncEngine`, `HubSpotActivityLogger` are dead code (only their tests import them); suppression checked only on the one-off send route; reply-ingest webhooks unauthenticated; HubSpot OAuth tokens base64 in localStorage; no intent or TAM fields.
- The Quiver Codex (vault audit 2026-08-02) already classifies it as "YardFlow GTM prehistory", kill. Re-verified dead 2026-09-23.
- Security flag for the owner (existence only, contents not read): public repo `YardFlow-Hitlist` commits `eventops/.env.production` (328 bytes).

### 1.2 The live outbound engine is the Top100 lane (2026-09-12 to today)
- Rig-built native HubSpot Sequences, one per account: 78 built (ids in `run_manifest.json accounts[key].sequence`), four AUTOMATED email steps at 0/4/5/6 business days (step 1 sends at enrollment), templates are token-only, per-person copy on contact properties `yf_top100_step{1..4}_{subject,body}`, `yf_top100_account` marks contacts, per-account HubSpot lists 122-226. Enrollment is done BY HAND from `scripts/enroll-table.mjs`; about 190 contacts enrolled at last read; truth read back from `hs_latest_sequence_enrolled` and `hs_sequences_actively_enrolled_count` (`scripts/enrolled-truth.mjs`). Outcomes so far: one reply (out-of-office), one bounce, zero opt-outs, zero meetings measured.
- Artifacts: `data/research/<key>.json` (research.v1: `value_hypothesis`, `causal_chain{observed_change, yard_dependency, affected_kpi, decision_owner, capability, first_conversation, disproof}`, `skeptic_objection`, `contrary_evidence`, `why_now`, evidence ledger with `class FACT|INFERENCE|UNKNOWN` and `external_ok`); `data/roster/<key>.json` (eligibility enum, `sequence_block`, touch history); `data/sequences/<key>.json` (sequences.v1: account thesis, buyer map, entry plan, four touches per person with purpose/day/condition/evidence_ids/claims_used/next_step, ten fixed `reply_handling` keys, `branch_drafts`, `stop_rules`, a `revision` counter overwritten in place); `data/review/<key>.json` (nine-criterion scorecard, gate 38/45, truth/swap/voice/identity gates); `CLAIMS.md` + `data/claims_registry.json` (claim tiers APPROVED_EXTERNAL / APPROVED_AS_QUESTION / INTERNAL_ONLY / DO_NOT_USE); `PROOF_STACK.md`; `crm_changes.jsonl` (5,283 journaled CRM ops).
- Contracts: `DRAFT_CONTRACT.md` (17 truth and voice rules), `REVIEW_CONTRACT.md`, `RESEARCH_CONTRACT.md`, `OUTBOUND_OPERATING_AUDIT.md` v3/v4 (33 operating rules; v4 on 2026-09-16 retired the daily cap and ladder for a 100/day tripwire, bounce halts remain), `LEARNING_AXLE_OCEANSPRAY_2026-09-15.md`.
- Facts that shape the design: the lane is NOT under version control; `data/sequences/<key>.json` is overwritten in place, but `crm_changes.jsonl` journals every copy push onto contacts (3,688 `update/contact` rows on the step properties with `old`, `new`, `evidence: "data/sequences/<key>.json revision N"`, `readback`) plus 78 `create/sequence` rows, so version history is reconstructable; `SEQUENCES.jsonl` is a stale 09-14 export; the manifest's `copy_review` is TODO for 94 accounts although reviews exist; `data/claims_registry.json` stops at CR-033 while CLAIMS.md and at least ten sequence files cite CR-034..040 (validator and writers read different sources); the sender is chosen at enroll time, not from the manifest; the cross-account bounce block is visible only in the UI; native unenroll-on-reply is assumed, not verified; learning-axle changes 1 (founder-intel FIRST_PERSON evidence), 5 ("strongest proof" reviewer gate) and 7 (Tier-A "what I know" column) are not done; the `gap-selling-outbound` skill was never written.

### 1.3 PIC charts (war-room)
- 43 charts (39 ready, 4 thin), 430 rows (STRONG 189, MODERATE 227, BUYER_CONFIRMED 14), typed at `war-room/src/lib/pic/types.ts:97-177`. `PicRow` = problem, rootCause, businessImpact (+derivation), personalImpact, buyingCenter, `buyerLanguage{text, predicted}`, `howWeDetect`, `whatANoMeans`, confidence, citations (internal refs such as `vault:`, `dossier:`, `for-pack:`, with an `at` date), accountSpecific, incumbentContext, lastVerified. `docs/pic-program.md`: "pre-call hypothesis charts. They are not records of confirmed buyer truth." BUYER_CONFIRMED "is the only grade a seller may state as fact." 22 rows have buyer language on tape (`predicted:false`). Only the war-room UI reads PICs; nothing in Top100 does; overlap with Top100 is about five accounts.

### 1.4 modex-gtm (this repo, HEAD 184846d1 == Vercel production, READY 2026-09-15)
Reuse, do not rebuild:
- Signal spine: `PounceTrigger` (`prisma/schema.prisma:1225`), `src/lib/pounce/{ingest,score,ranked}.ts`, `POST /api/pounce/ingest` (clawd is a producer via `pounce_push.py`, locked theme keys autonomy, yard_direct, network_capex, expansion, cost_restructure, leadership, digital_ops, freight).
- Evidence: `ResearchRun` / `EvidenceRecord` (`schema.prisma:852-900`: claim, claim_hash, source_url, freshness, supersession) and `src/lib/source-backed/*` (SourceBackedContractV1, `[[SRC:id]]` citation markers, `assertMinimumCitationThreshold`). Writer `src/lib/agent-actions/broker.ts:503` behind `SOURCE_EVIDENCE_INGEST_ENABLED` (default false; set in prod env, value unverified).
- Sequences: `Sequence` (`schema.prisma:745`, `steps Json`, no version); enrollment = columns on `DraftQueueItem` (`sequence_id`, `sequence_run_id`, `step_index`, `parent_item_id`); `src/lib/queue/sequence.ts` (pure step math), `sequence-runtime.ts` (re-reads `seq.steps` live at :18-20; `cancelDownstream` deletes unsent rows :60-69); `src/app/discovery/queue-actions.ts` (`enrollInSequence` :362, `deleteSequence` :405 with no active-run guard). Schema ships by `prisma db push` plus hand SQL in `prisma/sql/`; there is no migrations directory.
- Send wire: Gmail only. `sendViaGmail` (`src/lib/email/gmail-sender.ts:242-266`) runs the clawd autonomy gate, then the cross-plane suppression contract (clawd `POST /api/suppression/contract`, five legs, fail-closed), then the daily cap. App guards in `perform-send.ts` (`evaluateSendGuards`) cover `/api/email/send` and the Draft Queue. `OUTREACH_PAUSED` gates the queue automation only.
- Replies: cron `/api/cron/check-inbox` (5 min) -> `reply-precision.ts` (human vs machine only) -> `EmailThread` / `InboundMessage` (full body) / `Notification` / `Activity`; HubSpot `last_intent_source='email_reply_verified'` is the only reply value the qualification model trusts. Sequence stop is lazy: `send-deps.ts:76-86` checks for an inbound reply at the NEXT send attempt.
- Disposition-ish: `OperatorOutcome` taxonomy (`src/lib/revops/operator-outcomes.ts`), `engagement-learning.ts`, `campaign-intel.ts nextBestAction` (Allentown-specific). Hypothesis-ish: `CampaignGenerationContract.persona_hypothesis`, microsite `ObservationSection.hypothesis` (`src/lib/microsites/schema.ts:455`).
- Qualification and TAM: `src/lib/revops/qualification/*` (MQL/SQL verdicts, `hasIntent`), HubSpot `yardflow_tam` / `tam_tier`. Copy policy: `revops/cold-outbound-policy.ts` (CTA family per journey stage; cold email forbids meeting_request), `ai/voice-guardrails.ts`, `ai/yardflow-context.ts`.
- Flags: env at module load (`src/lib/feature-flags.ts`), `isOutreachPaused()` at call time; no DB-backed flags. `SystemConfig` is a KV for cron state.
- Hazards: `Persona.do_not_contact` is overloaded (consent, hard bounce, failure remediation, import quality gate, warm-intro-only all write it) and it is the modex leg of the cross-plane suppression contract, so dispositions must never write it for non-consent reasons; `cancelDownstream` deletes evidence of a stop; guard coverage differs by send route.
- Baseline: `npx vitest run` = 304 of 308 files pass, 1,967 tests pass, 2 fail, 1 skipped. The four failing files are environmental: `for-author-override` and `for-hero-map` cannot resolve `@anthropic-ai/sdk` and `topojson-client` locally; `gmail-thread-exists` and `hubspot-client` hit the 5 s default timeout and were not re-run in isolation. `npm run build` was not run (heavy; the merge gate is the Vercel preview build).

### 1.5 clawd-control-plane (prod `git_sha 1aa8ca4` == local HEAD)
- Every automated send lane is halted. Live `GET /api/autonomy/state`: outreach=false, actuator=false, set 2026-08-19 by Casey: "asked for NO automated sends. Reverse with one POST when automation is wanted again." The Windows DailyDrip task is Disabled. This is an owner decision the GAP OS honors: Sprint 7 automation is gated on it being reversed.
- clawd has no sequence versioning (cadence and copy are Python constants in `yardflow_followup.py` / `yardflow_body.py`), no hypothesis or disposition object, and no "parked" state in code (only `account_holds.json`). Reply taxonomy exists twice: keyword `REPLY_SIGNALS` (bounce, unsubscribe, redirect, objection, meeting, interested; first match wins) with `INTENT_RANK` and `ADVANCING_INTENTS` in `scripts/reply_scanner.py:42-456`, and an LLM `IntentHypothesis` in `reply_intelligence.py`. No Postgres reply table; bodies are not durably stored; an objection creates no hold, park or disposition.
- Landmine: `scripts/hubspot_autopush.py:44` `STAGE_MAP` pushes cold-email touches onto HubSpot deal stages (sent_t1 -> qualifiedtobuy, sent_t2+ -> presentationscheduled, replied -> decisionmakerboughtin, opted_out/bounced -> closedlost) and `AUTO_HUBSPOT_AUTOPUSH_ENABLED` defaults ON; live effect unverified. GAP writes properties and notes, never deal stages.
- Send path gates fail closed except the critic, which fails open. Suppression contract `scripts/suppression_contract.py`: legs modex, clawd, hubspot, sendgrid, verbal; any positive hit blocks; any unreadable leg refuses. Review feed `scripts/review_log.py` -> war-room `POST /api/review/log`. Critic `POST /api/critic/score`.

### 1.6 HubSpot portal 3819073
- Existing custom properties (audited via the MCP, do not duplicate): companies `yardflow_tam`, `tam_tier`, `tam_segment`, `tam_facility_count`, `tam_reason`, `tam_source`, `tam_evaluated_at`, `tam_confidence`, `yardflow_icp_score`, `yardflow_fit_score`, `yardflow_yard_*`, `yardflow_contracted_facilities`, `yardflow_live_facilities`, `intent_score`, `last_intent_at`, `last_intent_source`, `trigger_score`, `last_trigger_*`, `freightroll_fit`, `parent_category`; contacts `yardflow_qual_verdict`, `yardflow_qual_evaluated_at`, `yardflow_source`, `yardflow_variant`, `yardflow_experiment_id`, `intent_score`, `last_intent_*`, native `hs_persona`, `hs_sequences_*`; Top100 adds `yf_top100_account` and `yf_top100_step{1..4}_{subject,body}`. No `yardflow_gap_*` exists.
- Sequences API: the 2026-09 release exposes full CRUD at `/automation/sequences/2026-09/serviceaccounts/sequences` and enrollments at `/automation/sequences/2026-09/enrollments`; docs say user-level app only, scopes `automation.sequences.{read,create,edit,delete,enrollments.write}`, and a Sales Hub Pro or Enterprise seat. Verified live with the modex private-app token: `GET .../2026-09/serviceaccounts/sequences` returns 200 (92 sequences) and `GET /automation/v4/sequences/enrollments/contact/{id}?userId=85093129` returns 200 with sequenceId, sequenceName, enrolledAt, enrolledBy. Creates were NOT tested (a write). The 405 recorded in the hubspot-ops skill was on the old `/automation/v4/sequences` POST. Casey holds a `sales-pro` seat (verified). Email templates API (`/automation/email-templates/2026-09-beta/`) is user-level only.

### 1.7 What the draft's objects already map to
| Draft object | Exists as | Missing |
|---|---|---|
| ProspectingSignal | modex `PounceTrigger`; Top100 evidence rows (FACT/INFERENCE); clawd `intel_signal` | one queryable signal registry with provenance across sources |
| ProspectingHypothesis | PIC rows (problem/rootCause/impacts/howWeDetect/whatANoMeans); research `causal_chain.disproof`, `value_hypothesis` | status state machine, per-persona instance, links to signals/steps/replies, resolution |
| BuyerInputData | PIC `buyerLanguage{predicted:false}` + citation verbatim; vault raw transcripts | per-contact, per-hypothesis capture from replies and calls with human confirmation (nothing captures buyer answers today) |
| ConversationDisposition | `data/reply_audit.json` classes; `reply_handling` keys; modex `OperatorOutcome`; `reply-precision` (human vs machine) | a taxonomy applied to real replies and call outcomes, stored, driving the hypothesis |
| SequenceFamily/Version | run_id + `data/sequences/<key>.json` + HubSpot sequence id + contact-property copy (mutable in flight by design) | immutable version records per push; enrollment to version attribution; stop reason |
| Routing / NBA | `enroll-table.mjs` eligibility; audit rules; `touches[].next_step` | deterministic explainable routing over shared state |
| Learning | `sequence-monitor.mjs`; LEARNING note; audit row 32 bar | resolution and resonance metrics with sample sizes; the 30-day bar has no scorer |

## 2. Architecture decision and accepted changes to the draft

**Decision (lead, 2026-09-23; Casey deferred the host choice, leaning modex-gtm and/or war-room).** modex-gtm hosts the GAP store (Prisma/Postgres), the APIs, the logic and the five surfaces. The Top100 lane and native HubSpot Sequences remain the execution target; modex's Draft Queue is the secondary Gmail lane. PIC charts are imported as hypothesis seeds; war-room keeps the PIC pages and the review feed and links across. clawd remains the suppression and autonomy authority and a signal producer. GTM-YardFlow is mined for design only. A new repo was rejected because it would forfeit the Prisma, HubSpot and test neighbors the layer joins against. war-room was rejected as host because its storage is Blob/KV (no relational joins), its deploy is manual CLI, and it has no HubSpot write client.

Accepted changes to the draft (each one is a consequence of a verified fact above):
1. **Execution = native HubSpot Sequences built by the rig and enrolled by hand**, modex Draft Queue secondary. `SequenceVersion` therefore carries the engine (`hubspot_native | modex_draft_queue | manual`), external ids and a content hash; a version is created for every journaled shape, per-person copy pushes become append-only `SequenceCopyEvent` rows, and enrollment attribution is read back from HubSpot. "Immutable once used by real prospects" means the version row and the enrollment's `rendered_steps` snapshot are frozen; a re-push to an unfired step is journaled and surfaced as `copy_drift`, not blocked. This preserves the lane's deliberate "in-flight upgrades are cheap" practice while making every send attributable.
2. **The draft's Sprint 2 "refactor AutoEnrollService" is deleted**: that class is dead code in a dead repo. Routing produces the enroll table and, once the write probe passes, a human-approved HubSpot enrollment; it does not auto-enroll. modex `dispatch-daily` (off) is untouched.
3. **Sprint 6 (HubSpot-native publishing)** opens with a create-then-delete probe on a throwaway sequence using the private-app token. If refused, register a user-level OAuth app (the seat exists). Until then the rig builder stays the publisher.
4. **Sprint 7 automation is gated on Casey reversing the 2026-08-19 autonomy halt.** Shadow routing can run before that; canary enrollment cannot.
5. **One disposition enum** reconciled from the lane's ten `reply_handling` keys, the draft's classes and clawd's ranks. PIC `whatANoMeans` and research `causal_chain.disproof` are the falsification fields. BID is net-new.
6. **HubSpot mirror is minimal**: reuse `hs_persona`, `yardflow_qual_verdict` and the intent trio; add only company `yardflow_gap_status`, `yardflow_gap_problem_family` and contact `yardflow_gap_last_disposition`, `yardflow_gap_last_disposition_at`, plus timeline notes with `gap:` markers. Never deal stages (clawd's `STAGE_MAP` autopush already writes those).
7. **Copy validation formalizes DRAFT_CONTRACT, REVIEW_CONTRACT, CLAIMS tiers and `lint-copy.mjs` in code**, with a single claims source; `evidence_ids` must resolve to `external_ok:true` rows or FIRST_PERSON operator knowledge. No parallel rule set.
8. **The five surfaces land in modex** (`/gap` work queue, hypothesis drawer on `/accounts/[slug]` and `/gap/hypotheses`, `/gap/call/[decisionId]`, `/gap/replies`, `/gap/learning`).
9. **Learning v1 = the audit's pre-registered 30-day bar plus resolution and resonance metrics with sample sizes**, sourced from HubSpot engagements and dispositions.
10. **A first-party evidence class exists** (`operator_knowledge`, `source_type first_party`, dated): the learning axle's gap. Founder facts pass the truth gate without pretending to be public and are never quotable as public evidence.

## 3. Canonical problem families and personas (unchanged from the draft; encoded in `src/lib/gap/taxonomy.ts`)

```ts
type ProblemFamily =
  | "network_standardization" | "hidden_capacity" | "yard_state_integrity"
  | "driver_gate_scale" | "automation_readiness" | "cost_to_ship" | "chain_of_custody";
```
- Network standardization. Problem: material operating variation across facilities. Likely causes: local processes, acquired systems, different driver and gate workflows, fragmented point solutions, tribal knowledge, inconsistent events. Impacts: incomparable KPIs, bespoke integrations, slower rollout, harder automation, support burden. Signals: acquisition, new facility, network expansion, transformation program, disparate technology footprint.
- Hidden capacity. Problem: physical handoffs constrain production capacity. Likely causes: gate waiting, trailer search, stale asset state, dock and yard divergence, reactive spotting, sequential manual handoffs. Impacts: fewer turns, lost production capacity, overtime, detention, excess labor and capital. Signals: capacity expansion, production growth, new line, congestion, labor hiring.
- Yard-state integrity. Problem: operators cannot continuously trust yard state. Likely causes: periodic checks, incomplete tracking, disconnected sensors, manual updates, assets outside owned telemetry. Impacts: searching, dock starvation, wrong moves, excess moves, weak orchestration.
- Driver and gate scale. Problem: driver and gate workflows do not scale consistently. Likely causes: guard-shack dependence, paperwork, manual identity, local site rules, sequential check-in. Impacts: queues, turn-time variance, labor, carrier friction, security exposure.
- Automation readiness. Problem: physical automation is layered onto non-deterministic processes. Likely causes: site variation, poor shared state, undocumented exceptions, manual approvals, inconsistent events. Impacts: narrow pilots, manual fallback, poor scale economics, integration burden.
- Cost to ship. Problem: facility execution costs are hidden inside transportation economics. Likely causes: dwell measured after the fact, incomplete milestone chain, disconnected systems, unclear action ownership. Impacts: detention and accessorials, lost driver productivity, carrier friction, service cost.
- Chain of custody. Problem: visits and assets cannot be reconstructed reliably enough. Likely causes: paper documents, fragmented identity, disconnected timestamps, poor seal, load and event records. Impacts: claims, disputes, theft and fraud exposure, audit and compliance labor.

Personas: `executive_ops | supply_chain | transportation | distribution | site_ops | automation | security | finance_procurement | technology`. Maps maintained as data files: pounce theme key -> family (`family-rules.json`), PIC vertical and buying center -> persona, Top100 `decision_owner` title -> persona, lane step purpose -> spec purpose (`earn_reply -> intrigue`, `clarify_consequence -> root_cause`, `address_obstacle -> value_offer`, `next_step_or_close -> close_loop`).

## 4. Domain model (Prisma, additive; all new tables cuid ids, snake_case `@@map`, string FK to `Account.name`; string enums + TS `as const` unions + CHECK constraints in hand SQL; Postgres triggers in `prisma/sql/2026-09-23-gap-os.sql` with a matching rollback file, verified by `scripts/gap/verify-triggers.ts` after every `db push`)

### 4.1 ProspectingSignal (a registered FACT)
Fields: `account_name`, `hubspot_company_id?`, `persona_id?`, `source_kind` (`pounce_trigger | evidence_record | top100_evidence | pic_citation | operator_knowledge | crm | manual`), `source_id`, `type` (acquisition | new_site | site_expansion | automation_program | job_posting | technology_signal | news | intent | website_behavior | manual_research | other), `title`, `summary?`, `source_type` (public_primary | public_secondary | first_party_intent | first_party | crm | manual), `evidence_url?`, `evidence_text?`, `claim_class?`, `external_ok?`, `observed_at`, `ingested_at`, `confidence` 0..100, `freshness_expires_at?`, `metadata?`, `registered_by`. Unique `(source_kind, source_id)`; fact fields frozen after insert (trigger). Ingest never dual-writes; rows are created on demand by adapters or operators.
Adapters (`src/lib/gap/signals/projection.ts`, pure): `fromPounceTrigger` (published_at ?? first_seen_at; url; score -> confidence; category -> type via map); `fromEvidenceRecord` (refuses `is_superseded` and `stale_evidence`); `fromTop100Evidence` (class FACT only, else `not_a_fact`; observed_at = event_date ?? published ?? retrieved with the literal string `unknown` treated as absent; source_type map filing/earnings/investor_deck/leadership_page/newsroom -> public_primary, trade_press/other -> public_secondary, crm -> crm, vault -> manual; confidence high 80 / medium 55 / low 30; `external_ok` preserved and honored by the compiler); `fromPicCitation` (ref must start `for-pack:`, `dossier:`, `transcript:`, `call-intel:`, `vault:`, `http://` or `https://`, else `unresolvable_ref`; confidence BUYER_CONFIRMED 90 / STRONG 75 / MODERATE 50 / SPECULATIVE 25; a verbatim quote becomes `evidence_text` ONLY for `transcript:`, `call-intel:` and http refs, i.e. buyer speech or a public page; for `for-pack:`, `dossier:` and `vault:` refs the verbatim goes to `summary` so a seller document can never satisfy the evidence guard); `fromOperatorKnowledge` (`evidence_text` required, else `no_evidence_text`). Freshness TTL per type in `signals/freshness.ts`; `EvidenceRecord.fresh_until` wins over the TTL.

### 4.2 ProspectingHypothesis, HypothesisSignal, HypothesisEvent (seller INFERENCE)
Fields: `account_name`, `primary_persona_id?`, `problem_family` (seven + `unmapped`), `secondary_families?`, `observation` (facts only: every sentence carries at least one `[S:<signal id>]` token whose id is linked through `HypothesisSignal`; anything else fails closed with the sentence index and id), `problem_hypothesis`, `root_cause_hypotheses[]`, `impact_hypotheses[]`, `why_now?`, `falsification_questions[]`, `what_a_no_means?` (PIC `whatANoMeans` or research `disproof`, verbatim), `contrary_evidence?`, `predicted_buyer_language?` (seller-predicted, never BID), `buying_center?`, `persona`, `confidence`, `status` (`draft | review_required | approved | active | confirmed | partially_confirmed | rejected | unresolved | expired`), `source_ref?` (`pic:<slug>#<row>` | `research:<run>:<key>` | manual; partial unique), `created_by`, `reviewed_by/at`, `activated_at`, `expires_at`, `resolved_at/by`, `resolution?` ({problem, rootCause, impact, notes, dispositionIds[], bidIds[]} from human-confirmed rows only), `sequence_family_id?`, `sequence_version_id?`, `supersedes_id?` (unique), `metadata?`. Narrative columns frozen once status leaves draft/review_required (trigger). `HypothesisSignal` = join with role primary|supporting, cannot be unlinked after activation. `HypothesisEvent` = append-only audit (from_status, to_status, action, actor, reason, payload), written in the same transaction as the status change.

### 4.3 ConversationDisposition (what a reply meant, judged by a human)
Fields: `hypothesis_id`, `account_name`, `persona_id?`, `contact_email` (lowercased), `hubspot_contact_id?`, `enrollment_id?`, `activity_id?`, `inbound_message_id?` (Gmail messageId), `hubspot_engagement_id?`, `email_log_id?`, `channel` (call | email | linkedin | meeting), `response_class` (see section 7), `root_cause_class?`, `impact_class?`, `objection?`, `buyer_language?`, `next_best_action?`, `ai_suggested`, `human_confirmed`, `confirmed_by/at`, `created_by`. Unique `(source_kind, source_id)` for idempotent capture. AI-suggested unconfirmed rows have NO effects. `human_confirmed` flips false -> true only; classes and buyer language freeze once confirmed (trigger).

### 4.4 BuyerInputData (buyer TRUTH)
Fields: `hypothesis_id`, `account_name`, `persona_id?`, `contact_email`, `disposition_id?`, `inbound_message_id?`, `activity_id?`, `type` (current_state | business_problem | root_cause | impact | metric | future_state | priority | constraint | objection), `raw_buyer_language` (write-once), `normalized_summary?` (editable only while unconfirmed), `numeric_value?`, `unit?`, `source` (call | email | meeting | linkedin), `captured_at`, `captured_by`, `ai_extracted`, `human_confirmed`, `confirmed_by/at`, `supersedes_id?` (unique: one correction per row), `metadata?`. Rules: no update path for raw language, no delete path (trigger), corrections are a new row with `supersedes_id`; only `human_confirmed && !superseded` rows feed resolution; an unconfirmed correction removes the old evidence rather than adding new (fail closed); quantified impact must cite the BID rows that produced the number; `Persona.do_not_contact` is never written by any BID code.

### 4.5 SequenceFamily, SequenceVersion, SequenceCopyEvent, SequenceEnrollment
- `SequenceFamily`: the sequence OBJECT. `engine` (`hubspot_native | modex_draft_queue | manual`), `program?` (e.g. `top100-2026-09-12`), `account_name?`, `problem_family?`, `persona?`, `hubspot_sequence_id?` (unique: for hubspot_native the family IS the HubSpot sequence), `hubspot_portal_id?`, `legacy_sequence_id?` (unique: links the pre-GAP `sequences` row), `archived_at?`.
- `SequenceVersion`: one immutable SHAPE of the family: `steps` (steps.v2: per step `delay {value, unit}`, `purpose` (intrigue | root_cause | impact | value_offer | hypothesis_test | direct_diagnosis | close_loop), `sourcePurpose`, `condition`, `askType`, `productProofAllowed` (false on step 0 unless an explicit override), `requiredEvidenceTypes[]`, `claimsUsed[]`, `templates`), `steps_hash` (sha256 of canonical JSON), `status` (`draft -> frozen` on first non-test enrollment, `frozen -> retired` by hand), `hubspot_template_ids?`, `provenance` ({journal_ts, journal_evidence, source_file, source_sha256, revision, built_at, imported_at, imported_by}), `change_note?`, `frozen_at?`, `frozen_by_enrollment_id?`, `retired_at?`. Unique `(family_id, version)`. Editing a frozen version throws `GAP_VERSION_FROZEN`; "edit" = `createVersion` as draft max+1. Retiring blocks new enrollments only; in-flight enrollments keep reading their pinned version.
- `SequenceCopyEvent`: append-only per-person copy pushes (`hubspot_contact_id`, `account_key`, `property`, `step_index`, `field`, `old_value?`, `new_value`, `ts`, `evidence?`, `revision?`, `readback?`, `result?`, `pushed_by?`, `source` journal_import | gap_push). Unique `(hubspot_contact_id, property, ts)`. HubSpot templates read `{{ contact.yf_top100_stepN_body }}` at send time, so the copy a prospect received at step N is the newest event before that step's send (`copyAt`, pure).
- `SequenceEnrollment`: one prospect running one pinned version. `id` = `DraftQueueItem.sequence_run_id` for modex (no queue rewrite) or uuid v5 over `${hubspot_sequence_id}:${hubspot_contact_id}` for HubSpot (idempotent import without an external id). `engine`, `hypothesis_id?`, `account_name`, `persona_id?`, `to_email`, `hubspot_contact_id?`, `hubspot_sequence_id?`, `hubspot_enrollment_id?`, `sender`, `owner`, `status` (`active | paused | stop_pending | stopped | completed`), `stop_reason?` (replied | unsubscribed | in_thread | bounced | dnc | suppressed | manual | hypothesis_resolved | hypothesis_expired | sequence_retired | legacy_unknown), `stop_requested_at?`, `stopped_at/by?`, `current_step_index`, `rendered_steps?` (exact per-person copy as of `enrolled_at`, reconstructed from copy events; immutable; null for modex where the DraftQueueItem rows are the record), `rendered_steps_hash?`, `external_state?` / `external_synced_at?` (HubSpot readback), `is_test` (internal recipients never freeze a version; the predicate is a structural copy of `perform-send.ts:85-91`), `legacy`, `enrolled_by/at`, `completed_at?`. Pins immutable after insert (trigger). Partial unique on `to_email` while active/paused/stop_pending. Stopping records a reason; nothing is deleted.
- `DraftQueueItem` gains one nullable `sequence_version_id`. `Account` and `Persona` gain back-relations. The `sequences` table is not changed.
- `GapHubSpotMirror` (`key @id`, object_type, object_id, note_id?, written_at, error?) makes every HubSpot write idempotent. `RoutingDecision` (Sprint 2) stores each routed (account, persona) with `run_id`, `mode` shadow|live, `action`, `lane`, `rule_id`, `priority`, `explain`, `inputs_snapshot`, `human_action`, `acted_by_system_at`. `GapCompile` (Sprint 3) stores each compiler verdict.

### 4.6 Hand SQL (`prisma/sql/2026-09-23-gap-os.sql`, idempotent; rerun after every `db push` because push can recreate a table and drop its triggers)
CHECKs on every enum column; partial uniques (`sequence_enrollments(to_email)` while active/paused/stop_pending; `prospecting_hypotheses(source_ref)` where not null); triggers: versions frozen unless draft (`GAP_VERSION_FROZEN`), first non-test enrollment freezes its version, enrollment pins immutable (`GAP_ENROLLMENT_PIN`), copy events and hypothesis events append-only, BID raw language and identity immutable and any change refused once confirmed (`GAP_BID_IMMUTABLE`), signals frozen after insert including `external_ok`, `account_name`, `confidence` and `freshness_expires_at` (an operator fact never flips to public, a fact never moves accounts, expiry is never extended), hypothesis narrative frozen past review (`GAP_HYPOTHESIS_FROZEN`, including confidence, secondary families, contrary evidence, predicted buyer language and buying center), signal links cannot be unlinked OR re-pointed past review, and the database itself refuses approved/active without a reviewer and at least one evidenced signal (`GAP_HYPOTHESIS_UNSUPPORTED`), so the fail-closed rule does not depend on every writer going through the service. The rollback file drops only the new tables, triggers, functions, partial indexes and the one nullable column.

## 5. State machines (pure tables; services wrap each transition in `$transaction` with an optimistic `updateMany where {id, status: from}` that must return count 1, else `stale_status`; the audit event is written in the same transaction)

### 5.1 Hypothesis (`src/lib/gap/hypothesis/machine.ts`)
| From | Action | To | Guards (refusal reason) | Effects |
|---|---|---|---|---|
| draft | submit | review_required | at least one linked signal (`no_signals`); observation validates (`uncited_sentence`, `unlinked_citation`, `empty_observation`); `no_problem`; hypothesis text carries a hedge (`unhedged_hypothesis`); `no_falsification`; family not unmapped (`unmapped_family`) | event |
| review_required | reject_review | draft | `no_reason` | event |
| review_required | approve | approved | the full submit guard set re-run first (`no_signals`, observation validity, `no_problem`, `unhedged_hypothesis`, `no_falsification`, `unmapped_family`) so a review-stage edit cannot bypass them; then `no_actor`; at least one linked signal with url or text (`no_evidence`) not expired (`evidence_expired`) | reviewed_by, reviewed_at, event |
| approved | activate | active | submit guards re-run; `not_reviewed`; `evidence_expired`; `no_persona`; persona not DNC and email not in unsubscribed_emails (`suppressed`); version not retired (`version_retired`); step 0 product proof not allowed (`first_touch_proof`) | activated_at; expires_at = min(signal freshness, else now + 45 days); narrative frozen; event |
| active | resolve | confirmed / partially_confirmed / rejected | at least one human-confirmed disposition with a problem_* class (`no_confirmed_disposition`); the NEWEST such disposition decides the target (problem_confirmed -> confirmed, problem_partially_confirmed -> partially_confirmed, problem_rejected -> rejected); a supplied outcome that disagrees is refused `outcome_mismatch:<derived>`; resolution cites the confirmed disposition ids and, from Sprint 4, the confirmed BID ids | resolved_at/by, resolution, event; active enrollments stop (`hypothesis_resolved`) |
| active | close_unresolved | unresolved | `no_reason` | event; enrollments stop (`manual`) |
| approved, active | expire | expired | `not_yet_expired` | event; enrollments stop (`hypothesis_expired`) |
| draft, review_required, approved | withdraw | rejected | reason | event |
| terminal | any | | `terminal`; reopen = new row with `supersedes_id` | |
Observation rule (`hypothesis/observation.ts`): split on sentence terminators and newlines; every sentence needs at least one `[S:<id>]` token and every token id must be linked; the refusal names the sentence index and the offending id. This is syntactic traceability; the human reviewer is the semantic check.

### 5.2 Enrollment (`src/lib/gap/sequence/enrollment.ts`)
| From | Action | To | Guards | Effects |
|---|---|---|---|---|
| none | enroll (modex) | active | flag on (`gap_disabled`); version draft or frozen (`version_retired`); recipient not suppressed (`suppressed`); no active/paused/stop_pending enrollment for the address (`already_enrolled`, also the partial unique); hypothesis approved or active if given (`hypothesis_not_ready`); steps validate (`invalid_steps`) | insert (id = new uuid = sequence_run_id); non-test insert freezes the version; stamp sequence_id, sequence_run_id, sequence_version_id, step_index 0 on the draft item |
| none | record (hubspot_native) | active | same suppression and already_enrolled guards; readback present (`no_readback`) | insert with `rendered_steps` reconstructed at enrolled_at; freezes the version. Phase 1 never enrolls in HubSpot; it records what HubSpot says |
| active | pause | paused | actor | modex: unsent items stay approved; `send-deps.ts` refuses `sequence_paused` under the flag. hubspot_native: recorded intent plus a review-feed line |
| paused | resume | active | version not retired | |
| active, paused | stop (modex) | stopped | reason in the list (`bad_reason`) | unsent items -> status skipped, `skipped_reason 'sequence_stopped:<reason>'`; stopped_at/by |
| active, paused | stop (hubspot_native) | stop_pending | reason | stop_requested_at; review-feed line + HubSpot task naming the contact and sequence; the rig or Casey unenrolls |
| stop_pending | confirm_stop | stopped | readback shows unenrolled (`still_enrolled` otherwise) | stopped_at, external_state |
| active | complete | completed | modex: last step sent; hubspot_native: readback no longer enrolled and no stop requested | completed_at |
| active | bounce | stopped (bounced) | bounce on the prior step | as stop |
| stopped, completed | any | | `terminal` | |
Suppression wins: enroll and record refuse suppressed recipients; a `do_not_contact` disposition writes through the unsubscribe helper immediately and moves the enrollment to stop or stop_pending; no send-time guard in `gmail-sender.ts`, `perform-send.ts` or `send-deps.ts` is loosened.

### 5.3 Immutability mechanics
- Version freeze = first `SequenceEnrollment` insert with `is_test=false` (AFTER INSERT trigger, mirrored in code inside the enroll transaction so unit tests can assert it).
- `assertVersionEditable(v)` throws `GAP_VERSION_FROZEN` unless draft; `updateVersionSteps` exists only for drafts; `createVersion(familyId, steps, {fromVersionId, changeNote})` inserts max+1 as draft with a fresh hash; `retireVersion` frozen -> retired blocks new enrollments only; `stopEnrollmentsForVersion(id, 'sequence_retired')` is a separate explicit operator call.
- In-flight modex runs: `sequence-runtime.ts:18-20` becomes `resolveStepsForItem(prisma, item)` (`sequence/resolve-steps.ts`): enrollment exists -> its pinned version's steps (paused or stopped -> schedule nothing); else the item's `sequence_version_id`; else, with the flag off or for a legacy run, today's live read unchanged. Scheduling stamps `sequence_version_id` and uses the deterministic idempotency key `${owner}:${to_email}:${run}:${step}` that the schema comment at `schema.prisma:718` already promises (today `:52` uses randomUUID). Business-day delays convert through a pure `business-days.ts` (weekend skip only) before `nextStepSchedule`.
- HubSpot per-person copy: `copyAt(enrollment, stepIndex, sentAt)` picks the newest copy event before the send; `rendered_steps` never changes; any event after `enrolled_at` that changes an unsent step is surfaced as `copy_drift` on the review feed, not blocked, because the rig writes HubSpot directly. Named debt: the lane's `scripts/apply-crm.mjs` should consult this guard before pushing to an enrolled contact (outside modex).
- Dispositions: `human_confirmed` false -> true only; classes frozen once confirmed. BID: append-only API (`captureBid`, `correctBid` inserting with `supersedes_id`, `confirmBid` the only update, `setNormalizedSummary` only while unconfirmed); a structural test asserts exactly two `buyerInputData.update` sites and zero deletes in the service file.

## 6. Deterministic routing (Sprint 2; pure `routePersona(inputs)`; every run is `shadow` until the gates in section 10 are earned)

Inputs assembled per (account, persona) and snapshotted onto the decision: account (TAM, tier, heat tier, intent score and age, trigger score and age, outreach status, pipeline stage), signals (fresh triggers with score and age), persona (persona key, role gate, seniority, email and phone validity, LinkedIn, qual verdict, `do_not_contact`), hypothesis (id, status, family, confidence, evidence freshness, expiry, resume_at), comms (in flight, last outbound, last inbound, undispositioned inbound, last disposition, meeting booked), suppression verdict (`clear | suppressed | unknown` from the unsubscribed table, `do_not_contact`, clawd `POST /api/suppression/check`, `hs_email_optout`), freshness constants (evidence 45 d, hypothesis TTL 45 d, hot trigger 7 d, cooldown 14 d). Private intent is an input to rules and priority only; it is never copied into `explain` text (a test feeds intentScore 90 and asserts no "intent", "/demo", "/for", "visited" or "viewed" tokens in the explain).

Ordered rules, first match wins:
| # | id | condition | action | lane |
|---|---|---|---|---|
| R0 | suppressed | verdict suppressed | do_not_contact | blocked (explain names the leg) |
| R0b | suppression_unknown | verdict unknown | research_required | blocked; nothing outbound may be created |
| R1 | tam_out | TAM out | skip | |
| R2 | in_flight | approved or sending draft for the persona | skip (queue shows an "In flight" tab) | |
| R3 | reply_pending | undispositioned inbound | one_off_email | reply_triage |
| R4 | bounced_or_invalid | email invalid or bounced and no phone | research_required (`contact_invalid`) | work_queue |
| R5 | disp_wrong_person | last disposition wrong_person or referral | research_required (referral target from BID) | work_queue |
| R6 | disp_timing | timing with future resume_at | nurture | work_queue |
| R7 | disp_not_priority | not_priority within 90 d | nurture | work_queue |
| R8 | disp_objection | objection within 30 d | one_off_email (human-written, compiler-checked) | work_queue |
| R9 | tam_unknown | TAM unknown | research_required (`tam_unverified`) | work_queue |
| R10 | no_hypothesis | none | research_required (`no_hypothesis`) | work_queue |
| R11 | hyp_proposed | draft or review_required | approve_hypothesis | work_queue |
| R12 | hyp_stale | approved or active with stale evidence or past expiry | research_required | work_queue |
| R13 | hyp_resolved | resolved and no newer version | nurture (learning owns it) | work_queue |
| R14 | hot_call | approved or active hypothesis and hot (fresh trigger at or above the ping threshold within 7 d, or verified reply, or fresh account intent at or above 60) and usable phone and role gate | call_now (+40) | work_queue |
| R15 | hot_email | as R14 without a usable phone, email valid | one_off_email | work_queue |
| R16 | cooldown | outbound within 14 d and no reply | nurture (`cooldown`) | work_queue |
| R17 | enroll | approved hypothesis, TAM in, tier A or B or heat tier 3 or better, role gate, email valid | enroll_gap_sequence (family = hypothesis family) | work_queue |
| R18 | linkedin | approved hypothesis, no valid email, LinkedIn present | linkedin_manual_task | work_queue |
| R19 | default | | nurture (`no_fit_for_sequence`) | work_queue |
Priority = heat (0-100) + rule bonus (call_now +40, approve_hypothesis +20, enroll +15, one_off_email +10, research +5, nurture 0) + seniority x 2; shown on the card. `explain` = {whyAccount, whyPerson, whyProblem (family + observation as FACT + hedged hypothesis), whyNow (signal ids and ages, evidence freshness; never private intent), whyAction (rule id and the predicate that fired, plus what a different disposition would change), evidenceIds, signalIds, wouldProveWrong}. `enroll_gap_sequence` resolves to a target: `hubspot_native` when the Top100 manifest carries a rig-built sequence for the account and the roster marks the contact ELIGIBLE with no sequence block, `modex_queue` when the persona has no Top100 entry at all, `build_required` otherwise (a Top100 account without a built sequence is a build task, not a modex send; corrected 2026-09-23 after review nit N2; whether the contact already carries `yf_top100_step*` copy becomes an input in S3-T10, read from copy events); the decision carries an `enroll_row` in the shape of `scripts/enroll-table.mjs` (sequence id, contact, sender, a "what I know" line for Tier A). Two human-approved execution modes: table mode (rows stay unverified until the truth sync confirms them) and, if S2-T0 passes, API mode (`POST /api/gap/enrollments` -> the HubSpot enrollments endpoint with readback), gated by `GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED`, `!isOutreachPaused()`, the clawd autonomy state not halted (so refused today by design), identity not halted, compile pass and pacing. A reply unenrolls the replier natively in HubSpot; `stopRun` covers modex-lane items; a positive disposition opens a same-day "review the account's other threads" work item (the audit's row 3 review-and-continue); substantive rejection or opt-out pauses the account. `POST /api/gap/routing/run` (cron auth; at most two personas per account per run, 500 pairs per run) writes `RoutingDecision` rows; `GET /api/gap/queue` pages the latest run by (priority desc, id desc) with a stable cursor; `POST /api/gap/decisions/{id}/act` records what the human did for shadow comparison.

## 7. Dispositions and BID capture (Sprint 4)

Sources: email replies from modex `InboundMessage` (check-inbox) AND HubSpot INCOMING_EMAIL engagements for Top100 contacts (a poller over the emails object, keyed on `hs_engagement_id`); calls (Call Mode, target under 30 s: no_answer | voicemail | gatekeeper | conversation, then class chips, then BID chips); meetings (same form, channel meeting).
Response classes (one enum reconciled from the lane's ten `reply_handling` keys, the draft, and clawd's ranks): `problem_confirmed | problem_partially_confirmed | problem_rejected | wrong_person | referral | not_priority | timing | existing_solution | request_information | meeting_accepted | meeting_declined | do_not_contact | bounce | out_of_office | no_signal`, plus call-only `no_answer | voicemail | gatekeeper` (these keep the sequence running). Lane key mapping: positive_interest -> problem_confirmed or request_information (human picks), referral -> referral, already_have_yms and 3pl_runs_it -> existing_solution with `objection`, not_now -> timing or not_priority, wrong_person -> wrong_person, out_of_office -> out_of_office (no engagement inferred), bounce -> bounce, opt_out -> do_not_contact, substantive_rejection -> problem_rejected.
Service order (each step audited; failures after step 2 never roll back step 1): validate against the taxonomy (400 naming the field); create disposition and BID rows (human-created rows are confirmed; an accepted AI suggestion keeps `ai_suggested` with the confirming actor); immediate stop of the persona's runs for every class except no_answer, voicemail, gatekeeper and out_of_office (modex: `stopRunsForRecipient`; HubSpot: `stop_pending` + task, and unenroll by API once the write probe passes); resolution service (below); `do_not_contact` -> the extracted `recordUnsubscribe` helper (`UnsubscribedEmail` + `Persona.do_not_contact` + `hs_email_optout`, the same path the unsubscribe link uses; the cross-plane modex leg reads `Persona.do_not_contact`, so writing the table alone would leave clawd and Top100 able to mail the person). This is the ONLY GAP path that touches `do_not_contact` (table-driven invariant across every class); HubSpot mirror (fail-open, recorded).
AI suggestion (`GAP_REPLY_CLASSIFICATION_ENABLED`): `POST /api/gap/replies/{id}/suggest` calls `src/lib/ai/client.ts` with a JSON-only prompt (class, up to three BIDs with quote spans and a `why`), parsed with zod; unparseable -> no suggestion. A suggestion is stored on the disposition when the human submits; it is never truth.
Resolution (`hypothesis/resolution.ts`, pure, reads only human-confirmed and unsuperseded BID): problem_confirmed -> confirmed (call or meeting base 70, email 60, +15 with a quote, +10 if root cause confirmed, cap 95); problem_denied -> rejected; root_cause requires a confirmed problem (else stored `orphan:true`); impact_qualitative -> acknowledged; impact_quantified -> quantified with value and unit; timing sets `resume_at`; wrong_person clears the persona and returns the hypothesis to draft for re-targeting; referral emits a lead event consumed by R5; meeting_accepted marks the resolution. Invariant test: one unconfirmed problem_confirmed leaves the status unchanged; mutating the filter goes red.

## 8. Message compiler (Sprint 3; deterministic before generative)

Inputs: hypothesis, persona, sequence version and step index, draft {subject, body}, the SourceBackedContractV1 (angles -> evidence refs, `[[SRC:id]]` markers), fresh non-superseded evidence whose ids are linked to the hypothesis, prior step bodies, and the claims registry snapshot. Private intent is not an input.
Checks (one pure file each under `src/lib/gap/compiler/checks/`):
| code | severity | rule |
|---|---|---|
| C01 OBSERVATION_UNSUPPORTED | reject | every `[[SRC:id]]` resolves to a fresh, non-superseded, `external_ok` or first-party evidence ref; the observation paragraph carries at least one marker; every number token appears inside a cited claim or the canon set (48 to 24 measured; 24 sites live; about 5% observed; $1M+ per site modeled; 260 committed) |
| C02 HYPOTHESIS_AS_FACT | reject | the hypothesis paragraph carries a hedge token and no unhedged second-person assertion outside a question |
| C03 PROSPECT_ROI_PREDICTED | reject | second person plus money, percent or payback |
| C04 PRODUCT_LEADS | reject on step 0 | first sentence names the product or "we help" |
| C05 PROOF_UNSUPPORTED | reject | named customers or proof figures only from proof refs or canon; Primo is the only nameable reference; every other pipeline or peer company is innuendo (`named_pipeline` list from the lane) |
| C06 PRIVATE_INTENT_EXPOSED | reject | "saw you", "noticed you visited", "/demo", "/for/", "microsite", "intent" |
| C07 WORD_COUNT | reject | 45 to 80 words at step 1 and 40 to 100 on later steps after stripping markers, greeting and signature (as shipped; the earlier 45-120 wording was corrected after the Sprint 3 review, drift D2) |
| C08 ONE_PROBLEM | reject | family keyword map hits more than one family |
| C09 ONE_CTA | reject | exactly one CTA in the family allowed by `cold-outbound-policy` for the step; meeting requests fail before a meeting |
| C10 OBSERVATION_FIRST | reject | paragraph 1 carries a marker when the contract has one, else a transparent hedge |
| C11 BANNED_PHRASES | reject | `BANNED_PHRASES` and `POST_PIVOT_BANNED` from `voice-guardrails.ts`, the lane's lint classes (em dash, throughput, standardize paper, "Because" opener, simulated reply, false reply history, bespoke deliverable, false finality, relative time, exposed mechanics, headcount language), "hope you're well", "just bumping", fake breakup |
| C12 FOLLOWUP_NEW_INFO | reject on step 1+ | at least one evidence id unused in prior steps and content-word Jaccard under 0.6 versus each prior step |
| C13 CLAIMS | reject | every `claimsUsed` id resolves in the single claims source; DO_NOT_USE -> `claim_forbidden`; APPROVED_AS_QUESTION outside a question -> `claim_needs_question`; INTERNAL_ONLY never in copy |
| C14 VOICE_WARN | review | singular "yard" outside "yard network", repeated sentence openers |
| C15 SUBJECT_FORM | review | subject at most 7 words, lowercase body-style, no title case, no stray capitals, a digit may open it (lane audit row 18) |
| C16 STEP_LINKS | reject | no links on middle steps; the last step may carry one allowlisted own-site link, never as the bare last token; no image references |
External: clawd `POST /api/critic/score` (unreachable -> review, never pass). Output `CompileResult {verdict pass | review_required | reject, checks[], wordCount, ctaFamily, evidenceIdsUsed, hypothesisId, stepIndex, compilerVersion, critic}`. `review_required` creates a `SendApprovalRequest` (risk score 30 + 10 per review check, reasons = check codes, SLA 24 h) through the existing PATCH approval route; `approveBatch` in `queue-actions.ts` refuses any item stamped with a `sequence_version_id` whose latest compile (the item-level row keyed to it, else the template-level row for its version and step) is not a pass (`compile_not_passed`); items without a stamp are untouched. The lane's scorecard (nine criteria, gate 38/45) remains the editorial gate run by the reviewer; the compiler is the deterministic floor under it.

## 9. HubSpot architecture

HubSpot stays the commercial system of record; rich hypothesis state lives in modex Postgres. Reused: `intent_score`, `last_intent_at`, `last_intent_source`, `yardflow_tam`, `tam_tier`, `yardflow_qual_verdict`, native `hs_persona` (written only when the option exists), `hs_sequences_*` (read for enrollment truth), `hs_email_optout`. Added (each justified): company `yardflow_gap_status` (none | hypothesis_proposed | hypothesis_approved | in_sequence | conversation | resolved_confirmed | resolved_rejected | nurture) so lists and views can filter the GAP motion, company `yardflow_gap_problem_family` for segmentation, contact `yardflow_gap_last_disposition` and `yardflow_gap_last_disposition_at` because `hs_lead_status` is human-curated with other semantics. Not added: hypothesis text, BID content, confidence, family or version (those go in timeline notes). Notes carry a machine marker (`gap:hyp:{id}:{event}`, `gap:disp:{id}`) and a readable summary (observation with source links, hypothesis, why now, would prove wrong; or disposition, resolution, BID, quote). Writes go through `src/lib/hubspot/{notes,contacts,companies,properties}.ts` with `ensureGapProperties` (memoized, tolerant of 409), are idempotent via `GapHubSpotMirror`, carry a recency guard on `_at` properties, and are gated by `HUBSPOT_SYNC_ENABLED`, `assertExternalWriteAllowed` and `GAP_OS_ENABLED`; failures are recorded on the mirror row and never thrown to the caller. GAP never writes deal stages or lifecycle.
Native sequence adapter (Sprint 6): the 2026-09 Sequences API is readable with the private-app token (verified); creates are untested and documented as user-level only. Ticket 6.1 probes create-then-delete on a throwaway sequence; if refused, register a user-level OAuth app (Casey has the sales-pro seat). Internal `SequenceVersion` stays the source of truth; the HubSpot sequence is an execution target with external id mapping and drift detection (template ids and delays read back and compared to the frozen version).
Default cold policy: human-reviewed enrollment. Freshly imported cold contacts are never auto-enrolled.

## 10. Feature flags, safety progression and earned gates

Flags (`src/lib/gap/flags.ts`, all read at CALL time with the `isOutreachPaused` regex, default false): `GAP_OS_ENABLED`, `GAP_HYPOTHESIS_ENABLED`, `GAP_ROUTING_ENABLED`, `GAP_MESSAGE_COMPILER_ENABLED`, `GAP_REPLY_CLASSIFICATION_ENABLED`, `GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED`, `GAP_AUTO_ENROLL_ENABLED`, `GAP_AUTO_ENROLL_SHADOW`, and (added in Sprint 1 after the e2e run found the repo-wide `HUBSPOT_SYNC_ENABLED` defaults ON) `GAP_HUBSPOT_MIRROR_ENABLED`, which gates every GAP write to HubSpot independently of the repo-wide sync flag, and (batch item 9, 2026-10-07) `GAP_CRM_APPROVED_WRITES_ENABLED`, default off: the only gate for a HubSpot deal change the seller approved on the account brief (R54: a note, a task, its completion, the next step). It is separate from the mirror's flag on purpose: approved deal writes can be enabled without enabling automatic mirror writes, and the reverse; with it off an approval is recorded and stands as "approved, not written". `GAP_OS_ENABLED=false` makes every `/api/gap/*` route answer HTTP 404 with the typed skip payload for every caller (the `/api/cron/gap-*` routes answer 200 with the same payload so a scheduled run never errors) and every GAP write a no-op; flag-off behavior of the existing queue is asserted byte-identical by tests. Kill switches reused, nothing new: the clawd autonomy halt (canonical, checked at enroll and at the wire) and `OUTREACH_PAUSED`.
Progression: 1 manual hypothesis creation and approval; 2 deterministic routing recommendations (shadow); 3 human-reviewed enrollment via the enroll table; 4 AI-suggested reply and call classification with human confirmation; 5 learning dashboard; 6 HubSpot-native publishing if auth supports it; 7 shadow auto-routing; 8 canary auto-enrollment; 9 broader automation only after measured precision.
Gates that must be EARNED before `GAP_AUTO_ENROLL_ENABLED=true` (each a dashboard tile with n): G1 shadow agreement: at least 200 shadow decisions over at least 4 weeks, `enroll_gap_sequence` human agreement at or above 80% with n at least 50; G2 compiler precision: zero post-hoc reject-class violations in an audit sample of the last 100 human-approved GAP sends; G3 suppression health: zero unknown suppression verdicts in the last 7 days of routing runs and zero DNC violations ever; G4 reply classification: AI suggestion equals human confirmation at or above 90% with n at least 100; G5 truth yield: hypothesis resolution rate at or above 20% on human-run GAP with n at least 50 hypotheses; G6 canary: allowlist of at most 10 accounts, cap 5 per day, 2 weeks, zero incidents, one logged kill-switch drill (halt -> zero enrolls and zero sends within one poll cycle). G0, above all of them: Casey reverses the 2026-08-19 autonomy halt with one POST. Canary config lives in `SystemConfig` (`gap_auto_enroll_canary`: allowlist, per-rule cap, daily cap, startedAt); every refused predicate is audited as `enroll.refused` with the predicate name. Audit: `HypothesisEvent` / `GapAuditEvent` locally plus fan-out to war-room `POST /api/review/log` (bearer `MC_API_TOKEN`; see `AGENT_CLIS.md`) for hypothesis, routing, compile, approval, disposition, enroll and flag-refusal events.

## 11. Sprints

Conventions for every sprint: one commit per ticket, staged explicitly (the tree carries foreign WIP; never `git add -A`); a test or explicit validation per ticket; RED -> implement -> GREEN -> deliberately break the invariant -> prove the owning test RED -> restore, for every consequential invariant; specific failure reasons asserted, never bare booleans; no two tickets share a file within a sprint; `prisma/schema.prisma` owned by exactly one ticket per sprint; schema validated by `prisma validate`, `prisma generate`, `prisma db push` on a scratch `DATABASE_URL`, `tsc --noEmit`, then `scripts/gap/verify-triggers.ts` (prod push is an owner step; the repo has no migration pipeline); every sprint ends runnable and demoable; a fresh reviewer who did not implement the sprint tries to prove it added activity without adding prospecting truth, and accepted BLOCKER and SHOULD FIX findings become tickets in this file before the next sprint starts. Work happens on branch `feat/gap-os-*` in a worktree; nothing merges to main or deploys to production without explicit owner approval; the merge gate is a READY Vercel preview build, not an all-green local run.

### Sprint 0: Reconnaissance (DONE 2026-09-23)
Demo: this document, on branch `feat/gap-os-phase0`, with no production behavior change. Baseline recorded in section 1.4.

### Sprint 1: Hypothesis model
Demo: on a seeded test account, import one PIC row and register one pounce trigger, build a candidate hypothesis, approve it in the drawer, and see activation refused without evidence with the reason shown. Owning root: `src/lib/gap/**`, `src/app/api/gap/**`, `src/app/gap/**`, `src/components/gap/**`, `scripts/gap/**`, `prisma/sql/2026-09-23-gap-os*.sql`, `tests/unit/gap/**`.
| # | Ticket | Files owned | Test or validation |
|---|---|---|---|
| S1-T1 | GAP flags: call-time `gapFlag()` for the eight flags plus `assertGapEnabled()` skip payload | `src/lib/gap/flags.ts`, `tests/unit/gap/flags.test.ts` | env flips between assertions without re-import; flag off returns the skip payload |
| S1-T2 | Schema: all nine GAP tables (additive; nothing reads a table before its sprint): `ProspectingSignal`, `ProspectingHypothesis`, `HypothesisSignal`, `HypothesisEvent`, `ConversationDisposition`, `BuyerInputData`, `SequenceFamily`, `SequenceVersion`, `SequenceCopyEvent`, `SequenceEnrollment`, `GapHubSpotMirror`; `DraftQueueItem.sequence_version_id`; hand SQL with CHECKs, partial uniques and the immutability triggers plus the rollback file; `verify-triggers.ts` | `prisma/schema.prisma`, `prisma/sql/2026-09-23-gap-os.sql`, `prisma/sql/2026-09-23-gap-os-rollback.sql`, `scripts/gap/verify-triggers.ts` | validate, generate, db push on scratch, tsc; verify-triggers green; mutation: comment out one trigger and the script exits non-zero naming it; rollback SQL applies and re-applies cleanly |
| S1-T3 | Taxonomy as code: seven families (problem, causes, impacts, signal types), nine personas, actions, lanes, response classes, BID types, hedge tokens, family keyword map, pounce-theme and PIC-vertical maps, purpose map | `src/lib/gap/taxonomy.ts`, `src/lib/gap/hypothesis/family-rules.json`, `tests/unit/gap/taxonomy.test.ts` | enums exhaustive against this document; every pounce theme maps to exactly one family or null; every family has at least three cues |
| S1-T4 | Hypothesis pure model: transition table, guards, observation validator, expiry, versioning | `src/lib/gap/hypothesis/machine.ts`, `src/lib/gap/hypothesis/observation.ts`, `tests/unit/gap/hypothesis-machine.test.ts`, `tests/unit/gap/observation.test.ts` | one `it` per transition row with the exact reason string; terminal states refuse with `terminal`; mutation: delete the evidence guard |
| S1-T5 | Signal adapters and registry: the five projections plus `registerSignal` (idempotent on source_kind+source_id) and the freshness table | `src/lib/gap/signals/projection.ts`, `src/lib/gap/signals/freshness.ts`, `src/lib/gap/signals/registry.ts`, `tests/unit/gap/signal-projection.test.ts`, `tests/unit/gap/signal-freshness.test.ts` | INFERENCE refused `not_a_fact`; superseded refused; unknown dates fall to retrieved; ten source types map; PIC ref without a known prefix refused `unresolvable_ref`; same source twice is one row |
| S1-T6 | Hypothesis builder (pure): candidates per (persona, family) with observation assembled only from cited signal text, hedged hypothesis and would-prove-wrong templates, why_now from signal ages, confidence 30-50 | `src/lib/gap/hypothesis/build.ts`, `src/lib/gap/hypothesis/classify-family.ts`, `tests/unit/gap/hypothesis-build.test.ts`, `tests/unit/gap/family-rules.test.ts` | token-subset assertion (observation words within cited text); no candidate without an id; Honda row 1 classifies hidden_capacity |
| S1-T7 | Audit and review feed: `audit()` writes the event then fire-and-forgets war-room `POST /api/review/log`; never throws | `src/lib/gap/audit.ts`, `src/lib/gap/review-feed.ts`, `tests/unit/gap/audit.test.ts` | fetch 500 does not reject; missing env means local only |
| S1-T8 | Hypothesis service: submit, reject_review, approve, activate, withdraw, resolve, close_unresolved, expireDue over prisma with the machine guards; event in the same transaction; `stale_status` on count 0 | `src/lib/gap/hypothesis/service.ts`, `tests/unit/gap/hypothesis-service.test.ts` | prisma-mock row shapes; illegal transition returns the reason; narrative update on active refused before prisma is touched |
| S1-T9 | Hypothesis API behind `GAP_OS_ENABLED && GAP_HYPOTHESIS_ENABLED`: list, propose, transition | `src/app/api/gap/hypotheses/route.ts`, `src/app/api/gap/hypotheses/[id]/route.ts`, `tests/unit/gap/hypotheses-routes.test.ts` | 401 without session; skip payload with the flag off; 400 naming the field; 200 shapes |
| S1-T10 | Importers (dry-run default, idempotent, print reconciliation, never activate): PIC rows to draft hypotheses and `pic_citation` signals, the 22 on-tape rows to unconfirmed BID; Top100 research to draft hypotheses and FACT signals | `src/lib/gap/import/pic.ts`, `src/lib/gap/import/top100-research.ts`, `scripts/gap/import-pics.ts`, `scripts/gap/import-top100-research.ts`, `tests/unit/gap/pic-import-plan.test.ts`, `tests/unit/gap/top100-research-plan.test.ts` (fixtures) | Honda fixture: 11 rows to 11 drafts; predicted:false to one unconfirmed BID; predicted:true to zero BID; second run zero writes |
| S1-T11 | HubSpot mirror for hypothesis events: company note with marker plus the two company properties via `ensureGapProperties`; idempotent; fail-open recorded | `src/lib/gap/hubspot-mirror.ts`, `src/lib/hubspot/properties.ts` (additive `ensureGapProperties`), `src/lib/hubspot/companies.ts` (additive `updateCompanyProperties`), `tests/unit/gap/hubspot-mirror.test.ts` | second call with the same key makes zero HubSpot calls; the test write guard is recorded as an error on the mirror row |
| S1-T12 | Hypothesize cron (not registered in `vercel.json` until the Sprint 2 review): fresh non-dismissed triggers plus contact-ready personas -> build -> propose, skipping an open hypothesis for the same persona and family; `claimDailyRun('gap-hypothesize')` | `src/app/api/cron/gap-hypothesize/route.ts`, `tests/unit/gap/hypothesize-cron.test.ts` | flag off skips; no duplicates; counts in the response |
| S1-T13 | Hypothesis Drawer: list page and drawer with a FACT block (observation with source links) and a visibly labeled HYPOTHESIS block, why now, would prove wrong, confidence, Approve and Withdraw, manual evidence add (URL or first-party text plus claim -> signal) | `src/components/gap/hypothesis-drawer.tsx`, `src/app/gap/hypotheses/page.tsx`, `tests/unit/gap/hypothesis-drawer.test.tsx` | render asserts the FACT and HYPOTHESIS labels and that an unsupported observation shows the blocked state, not Approve |
| S1-T14 | Docs: this file's Sprint 1 section updated with what shipped; `CLAUDE.md` gets a GAP pointer | docs only | freshness stamp |
Order: T1, T2, T3 in parallel (distinct files) -> T4, T5, T7 -> T6, T8 -> T9, T10, T11, T12 -> T13 -> T14. Tests: evidence linkage, valid transitions, owner scoping, audit history, activation blocked without review or evidence.

#### Sprint 1 shipped (2026-09-23, branch feat/gap-os-phase0, all fourteen tickets)
| Ticket | Commit | Tests | Mutation proven red |
|---|---|---|---|
| S1-T1 flags | eb1109ee | 23 | env snapshot at load; OS-first check removed |
| S1-T2 schema + SQL + verifier | c6c91411 | 20 DB guards | BID trigger commented out -> verifier exit 1 |
| S1-T3 taxonomy | 21664b52 | 29 | sort order, terminal set, anchor cue, leadership map, cue case |
| S1-T4 machine + observation | 19bc76bc | 118 | evidence guard removed; terminal fall-through |
| S1-T5 signal adapters + registry | 8519a1da | 102 | FACT check removed; found short-circuit removed |
| S1-T6 builder (classification lives in `taxonomy.ts`, not a separate classify-family module) | 6c1ebee6 | 28 | title paraphrased; hedge removed |
| S1-T7 audit + review feed | 65cbb978 | 16 | rethrow on rejected fetch |
| S1-T8 service (+ fact-less drafts 7f1f5079, + mirror wiring f3d5bfca) | d173e124 | 25 | status predicate removed; event outside transaction |
| S1-T9 API routes | 4958e1f5 | 40 | flag gate removed from PATCH |
| S1-T10 importers (+ 5899bccc; the committed Honda fixture is 4 rows, all predicted, the on-tape BID case is a synthetic row in the test) | 6deff20e | 32 | BID emitted for predicted rows |
| S1-T11 HubSpot mirror (+ default-off mirror flag 5001ab54) | be124218 | 20 | any mirror row treated as written; mirror gate removed |
| S1-T12 hypothesize cron | c82b4a4a | 21 | open-hypothesis skip removed |
| S1-T13 drawer UI (read plus transition; "add a fact" DEFERRED to S2-T10; the demo's refused activation is the client-side disabled button plus the server reason on a 409) | cedcfc4f | 15 | evidence gate removed |
| S1 e2e on the scratch DB | 820aace2 | 8 steps | (evidence, not a mutation) |
Regression: full unit suite in the worktree 325 files, 2,442 tests, 0 failures. Preview build on Vercel READY for the branch head (flags unset, production behavior unchanged). Demo: `docs/gap/sprint1-e2e-latest.md` (seeded account, hypothesize twice, submit/approve/activate, Postgres narrative freeze, fact-less draft refused at submit, duplicate source_ref, mirror skipped, Honda PIC applied twice with zero second-run creates).
Decisions taken during the sprint (accepted): a draft may start with an empty observation and no signals (`metadata.needsObservation`) because PIC rows are inferences; submit still refuses it (`no_signals` / `empty_observation`). HypothesisSignal columns are `linked_by`/`created_at`. `predicted_buyer_language` is a JSON string column. Persona FKs are Int to Persona.id. SequenceFamily has a nullable `name`; RoutingDecision carries `hypothesis_id`, `human_actor`, `human_action_at`; the DraftQueueItem stamp has no FK. The version guard refuses draft -> retired. A dry cron run registers signals (frozen facts) but proposes nothing and never claims the day. The flags-off API answer is always 404 with the typed skip payload. The mirror records a null note id as an error so an outage cannot mark an event mirrored.
Sprint 1 adversarial review (fresh agent, 2026-09-23): verdict "scaffolding for truth, not yet prospecting truth"; five of the twelve questions answerable, none of the buyer-truth ones (7 to 10), which is consistent with the sprint plan. Findings accepted and ticketed as R1-1 to R1-13 (BLOCKER R1-1: review-stage narrative edits bypassed the submit guards; SHOULD FIX: seller-chosen resolution outcome, cron re-proposing withdrawn hypotheses, untested evidence derivation, PIC verbatims from seller documents counting as evidence, link re-pointing past review, no DB enforcement of the machine, mutable signal fields, unpredicated narrative updates and five unfrozen columns, one bad trigger aborting the cron run, mirror retry creating a second note, Top100 observations from the researcher's paraphrase instead of the excerpt, edit events without before/after) plus nits (import drafts and cron proposals never dedupe, why_now captioned as inference, no author/approver separation, unused emailValid, singular yard in one catalog string). Resolutions are recorded per ticket below when they land.
Named debt from Sprint 1 (tickets in Sprint 2 unless noted): cue matching in `classifyFamilies` is substring-based (word-boundary matcher when false positives appear); importer BIDs carry an empty `contact_email` until the speaker resolves to a contact, so `confirmBid` must require a non-empty address (Sprint 4); `src/lib/cron-monitor.ts` KNOWN_CRONS has no gap-hypothesize row; the reused cron-auth helper accepts `?secret=` on POST /api/gap/hypotheses (header-only if wanted); the mirror does not populate `version`; `runHypothesize` scans every live trigger, so on a shared database it proposes for every account with fresh triggers (cap and allowlist in Sprint 2); the Top100 root contains three flattened-path junk directories the CLI ignores; this machine's shell carries an ambient HUBSPOT_ACCESS_TOKEN, so every script that touches HubSpot writers must scrub it as the e2e does.

### Sprint 2: Routing and work queue
Demo: prospects and signals produce reviewable, explainable next actions without any auto-send; the Top100 roster and enrollment truth are visible in the same queue; an operator can register a first-party fact and cite it. Owning root as Sprint 1 plus `src/lib/gap/{routing,top100,sequence}/**`, `src/app/gap/page.tsx`, `src/app/api/gap/{routing,queue,decisions,signals}/**`, `src/app/api/cron/gap-*`.
| # | Ticket | Files owned | Test or validation |
|---|---|---|---|
| S2-T1 | Schema (sprint 2, additive): `InboundMessage.source String @default("gmail")` (gmail or hubspot; HubSpot ids are `hs:<engagementId>`) and `InboundMessage.hubspot_engagement_id String?`; add gap-hypothesize and the two new crons to `src/lib/cron-monitor.ts` KNOWN_CRONS as unscheduled | `prisma/schema.prisma`, `src/lib/cron-monitor.ts`, `tests/unit/gap/schema-sprint2.test.ts` | validate, generate, db push on scratch, forward SQL, verifier 20/20; existing cron-monitor tests green |
| S2-T2 | Stop-not-delete: `stopRun` and `stopRunsForRecipient` mark unsent items skipped with `sequence_stopped:<reason>`; `cancelDownstream` uses them under `GAP_OS_ENABLED` and keeps `deleteMany` when the flag is off; a stopped run schedules nothing | `src/lib/queue/sequence-runtime.ts`, `tests/unit/queue-sequence-runtime.test.ts` (existing fixtures reused), `tests/unit/gap/immediate-stop.test.ts` | flag off: byte-identical calls (deleteMany asserted); flag on: updateMany with the reason and deleteMany never called; mutation: revert to deleteMany under the flag |
| S2-T3 | Top100 reader (pure): typed parsers for `run_manifest.json` (accounts, sequence ids, templates, delays, enrolled), `data/roster/<key>.json` (selected_people eligibility, sequence_block, email, hubspot_contact_id, last_touch, touch_lane), `EXCLUSIONS.csv`, `data/monitor/<day>.json` | `src/lib/gap/top100/reader.ts`, `tests/fixtures/gap/top100-*.json`, `tests/unit/gap/top100-reader.test.ts` | fixtures parsed to exact shapes; unknown eligibility values preserved as strings and flagged |
| S2-T4 | Enrollment-truth sync: families from the manifest (engine hubspot_native, program, hubspot_sequence_id), enrollments from HubSpot READ-only readback (`hs_latest_sequence_enrolled`, `hs_sequences_actively_enrolled_count`, `hs_latest_sequence_enrolled_date` via the existing hubspot client batch read) as `legacy=true` rows with `external_state`; version rows deferred to Sprint 3 (a placeholder v1 per family, draft, provenance `manifest`); cron route `/api/cron/gap-enrollment-sync` (unscheduled, dry-run default) | `src/lib/gap/sequence/external-sync.ts`, `src/app/api/cron/gap-enrollment-sync/route.ts`, `tests/unit/gap/external-sync.test.ts` | readback fixture -> exact upserts; second run zero creates; a contact whose latest sequence is not the family's is reported, not guessed; no HubSpot write path exists in the module (structural test) |
| S2-T5 | Routing inputs assembler: per (account, persona) from Prisma (TAM and tier from the account's HubSpot mirror fields or the Top100 roster, hypotheses, signals, enrollments, unsubscribed, do_not_contact), the Top100 roster eligibility and `sequence_block`, and the suppression verdict `clear | suppressed | unknown` from the existing cross-plane contract read (a read-only call through the same clawd endpoint the send gate uses; unreadable -> unknown); freshness constants | `src/lib/gap/routing/inputs.ts`, `tests/unit/gap/routing-inputs.test.ts` | unreadable suppression -> unknown; every input field populated from fixtures; private intent carried as numbers only |
| S2-T6 | Rules, explain, route (pure): R0-R19 exactly as section 6, priority formula, the explain object, `enroll_gap_sequence` resolving to a target (`hubspot_native | modex_queue | build_required`) | `src/lib/gap/routing/rules.ts`, `routing/explain.ts`, `routing/route.ts`, `tests/unit/gap/routing-rules.test.ts` | one fixture per rule asserting `rule_id`; precedence (suppressed + hot -> do_not_contact); private-intent leak test on explain text; mutation: move R0 below R14 |
| S2-T7 | Routing run and queue: `POST /api/gap/routing/run` (cron or session; shadow mode always; at most two personas per account, 500 pairs per run; writes RoutingDecision with inputs_snapshot), `GET /api/gap/queue` (latest run, priority desc, stable cursor), `POST /api/gap/decisions/[id]/act` (records the human action) | `src/lib/gap/routing/run.ts`, `routing/queue.ts`, `src/app/api/gap/routing/run/route.ts`, `src/app/api/gap/queue/route.ts`, `src/app/api/gap/decisions/[id]/act/route.ts`, `tests/unit/gap/routing-run.test.ts` | cursor stability; caps; mode is shadow even with GAP_AUTO_ENROLL flags on (structural assertion); flags off -> 404 skip payload |
| S2-T8 | Enroll-row emitter: a decision with `enroll_gap_sequence` renders the lane's enroll-table row (account, sequence id and name from the manifest, contact, sender, a "what I know" line) and the queue exposes `GET /api/gap/queue/enroll-rows` as markdown in the `scripts/enroll-table.mjs` shape; nothing enrolls | `src/lib/gap/routing/enroll-row.ts`, `src/app/api/gap/queue/enroll-rows/route.ts`, `tests/unit/gap/enroll-row.test.ts` | exact table format; a contact with `sequence_block` is listed under Skip with the block reason |
| S2-T9 | HubSpot reply poller (READ-only): INCOMING_EMAIL engagements since a watermark for any persona with a HubSpot contact id (the ticket originally said contacts carrying `yf_top100_account`; the shipped scope is wider, corrected after review nit N10), through `reply-precision` (out-of-office filtered), into `InboundMessage` with source hubspot and `EmailThread`; watermark in SystemConfig; cron route `/api/cron/gap-hubspot-replies` (unscheduled, dry-run default); no sequence stop, no HubSpot write | `src/lib/gap/replies/hubspot-poller.ts`, `src/app/api/cron/gap-hubspot-replies/route.ts`, `tests/unit/gap/hubspot-poller.test.ts` | fixture engagements -> exact rows; autoresponder filtered with the precision reason; second run zero creates; structural: no write method of the hubspot client imported |
| S2-T10 | Register a fact: `POST /api/gap/signals` (operator knowledge or a URL fact -> registerSignal) and `POST /api/gap/hypotheses/[id]/signals` (link a signal, draft or review_required only); drawer gains the "Add a fact" form that the Sprint 1 drawer deferred | `src/app/api/gap/signals/route.ts`, `src/app/api/gap/hypotheses/[id]/signals/route.ts`, `src/components/gap/add-fact-form.tsx`, `src/components/gap/hypothesis-drawer.tsx` (additive), `tests/unit/gap/signals-routes.test.ts`, `tests/unit/gap/add-fact-form.test.tsx` | linking to an active hypothesis -> 409 narrative_frozen; a fact without text or url -> 422 with the reason |
| S2-T11 | Work Queue UI at `/gap`: decision cards with the five-question explain, priority, action chip, "In flight" tab from enrollments and Draft Queue items, links to the drawer and the enroll rows | `src/app/gap/page.tsx`, `src/app/gap/work-queue.tsx`, `src/components/gap/decision-card.tsx`, `tests/unit/gap/decision-card.test.tsx` | every card renders whyAccount, whyPerson, whyProblem, whyNow, whyAction; private-intent tokens never appear |
| S2-T12 | e2e sprint 2 on the scratch DB (routing run over the Sprint 1 seed, queue paging, act, enroll rows, poller fixture) + docs | `scripts/gap/e2e-sprint2.ts`, `docs/gap/sprint2-e2e-latest.md`, `docs/GAP_PROSPECTING_OS.md` | report file with PASS lines |
| S2-T0 | Enrollments-API write probe, PREPARED ONLY: a script that prints the exact request it would send (one throwaway sequence, one internal contact) and refuses to run without `--confirm` and an owner go recorded in this file; executing it is a live send from Casey's identity to an internal address and needs explicit owner approval | `scripts/gap/probe-enrollments-api.ts` | dry output only; no network call without `--confirm` |
Dropped from the draft: the AutoEnrollService refactor; `dispatch-daily` untouched; check-inbox wiring moves to Sprint 4 with the disposition service.

#### Sprint 1 review resolutions (all landed before Sprint 2 continued)
R1-1 machine re-runs the submit guards on approve and activate (7f258c42); R1-2 resolve derives its target from the newest confirmed disposition and the service cites the disposition ids (7f258c42, 39c2217b); R1-3 and R1-10 deterministic cron source_ref, terminal-superset skip, per-account isolation (b2dd3da4); R1-4 evidence derivation tested (39c2217b); R1-5 seller-document verbatims never count as evidence (aa4e175f); R1-6, R1-7, R1-8, R1-9b database guards: link re-pointing refused, approved/active refused without reviewer and evidence, signal and hypothesis columns frozen (ab48d0b8, verifier 26/26); R1-9 narrative edits are one guarded transaction (39c2217b); R1-11 mirror retry reuses its note (16dd26b0); R1-12 Top100 observations quote the excerpt (a1781ecd); R1-13 edit events carry before/after (39c2217b); nits (990aeefc). Not adopted: author/approver separation (one-person team; revisit when agents propose).

#### Sprint 2 shipped (2026-09-23, branch feat/gap-os-phase0)
| Ticket | Commit | Tests | Mutation proven red |
|---|---|---|---|
| S2-T1 schema + cron registry | 53b7d370 | 7 | gmail default dropped |
| S2-T2 stop-not-delete | b0df2d9d | 25 (+13 legacy) | flag-on branch reverted to deleteMany |
| S2-T3 Top100 reader | def9781b | 40 (real lane: 78 sequences, 123 rosters, 0 unknown eligibilities) | sequence block ignored |
| S2-T4 enrollment-truth sync | b34242b8 | 43 | stopped row reopened |
| S2-T5 routing inputs + suppression read | 4c191e15 | 38 | clear on network error |
| S2-T6 rules, explain, route (+ R2-a threshold 817dcec4, 4dde782f) | 0c00790f | 46 | R0 below R14; intentScore in whyNow; raw threshold |
| S2-T7 routing run, queue, act | 028515f4 | 44 (after 1cb3c0c9) | order by created_at; non-shadow mode |
| S2-T8 enroll-row emitter | aa2040d0 | 16 | blocked contact enrolled |
| S2-T9 HubSpot reply poller | e0d9f40e | 35 | classifier bypassed |
| S2-T10 register a fact + link | 76eb7b7e | 90 across four files | unlink re-validation skipped |
| S2-T11 work queue UI | 4db97f5a | 17 | explain as HTML; intent score rendered |
| S2-T0 probe, prepared only | 48fc15aa | dry and refused runs | (no network by construction) |
| S2 e2e on the scratch DB | 3d6e195b | 10 steps PASS at e0e6ed80 | (evidence) |
Regression: full unit suite 337 files, 2,828 tests, 0 failures. Preview builds READY on Vercel for the pushed heads (flags unset; production behavior unchanged).
Decisions taken during the sprint: the explain leak check uses anchored private-intent patterns (intent score or signal, /demo/, /for/ spear paths, microsite, visited or viewed or opened phrasing, tracking pixel), so ordinary language such as "the plant opened" and "intention" routes; the hot-trigger threshold is derived as normalizeScore(PING_THRESHOLD, 'news') = 44 on the normalized scale; the enroll-row emitter escapes pipes inside cells because every real sequence name carries them; the decision inputs_snapshot carries account, persona, hypothesis summary, comms, suppression, target, displayName, preferredSender, whatIKnow (the contract the enroll-row loader reads); families are create-if-missing and a completed or stopped enrollment is never reopened by a readback; the reply poller scopes to any persona with a HubSpot contact id and cannot use RFC headers (HubSpot's header JSON has none), so only subject and body autoresponder rules fire; the enrollment sync route gates on the GAP flags and token presence, not HUBSPOT_SYNC_ENABLED; the run route is POST-only (manual or scripted trigger, apply requires ?mode=apply); under the flag a stopped run's failed and skipped rows stay as evidence instead of being deleted.
Named debt carried into Sprint 3: the company snapshot reader (`src/lib/hubspot/companies.ts getCompanyById`) carries TAM only, so heat ranks by fresh triggers until tam_tier, intent_score, last_intent_at, trigger_score and last_trigger_at are added to its property list; the run route has no Top100 disk loader (the enrollment-sync route has one; share it); ConversationDisposition has no metadata column, so resumeAt and referral are read from ai_suggested until Sprint 4 adds the column; assembleForAccount re-reads the account per persona; the heat feed lacks SQL/MQL density, deck and /for views at this seam, so priority is comparable within a run only; unlinking the primary signal leaves no primary; HubSpot sender property and epoch-millis timestamp filter in the poller are untested against the live portal (first manual dry run confirms); the classifyFamilies cue matcher is still substring-based.
Operational note carried forward: enabling GAP_ROUTING_ENABLED in production exposes read-only routes and the shadow run; nothing acts. The three GAP crons stay unscheduled until the Sprint 2 review approves them.

#### Sprint 2 adversarial review (fresh agent, 2026-09-23, range ea9bf160..6a32d39b)
Verdict: "honest shadow activity and three real read-only truths (HubSpot enrollment readback, HubSpot replies beside Gmail ones, operator facts frozen to an account), no path enrolls, sends or writes HubSpot, but three seams let activity pass as truth." Seven of the twelve questions answerable (1 to 6 and 11); 7 to 10 and 12 wait for Sprints 4 and 5 by design. The reviewer's own mutations went red (R0b predicate, other-sequence guard, watermark clock cap, write-once human action) and the verifier passed 26/26. Every finding was re-read at the cited line by the lead before ticketing. The three crons stay unscheduled: the review did not approve scheduling and the fixes below change their behavior.
| # | Sev | Finding | Fix (ticket) | Files | Status |
|---|---|---|---|---|---|
| R2-1 | BLOCKER | `RoutingPersonaInput.doNotContact` is read by no rule; R0 fires only on the clawd verdict, so a person we recorded as never-contact routes to enroll when the remote leg lags | R0 also fires on `persona.doNotContact` with leg `modex_do_not_contact`; e2e step expectation flips to `suppressed` | rules.ts, routing-rules.test.ts, e2e-sprint2.ts, sprint2-e2e-latest.md | FIXED 390d75d1 |
| R2-2 | BLOCKER | clawd answers an unreadable leg with `blocked: true, reason: unknown_<leg>`; suppression-read maps every blocked to `suppressed`, so an outage reads as a hit and G3 reads green during the exact outage it exists to catch | `blocked` with an `unknown_*` reason or non-empty `unknown_legs` and no positive leg -> verdict `unknown`; test with clawd's real payload | suppression-read.ts, routing-inputs.test.ts | FIXED 390d75d1 |
| R2-3 | SHOULD FIX | one forbidden token in human text (observation, sequence block, would-prove-wrong) throws from `assertExplainClean` and aborts the whole run, leaving a partial run as the newest queue | wrap the route call in run.ts, count `explain_leak:<field>` as a skip, continue; the tripwire stays | run.ts, routing-run.test.ts | FIXED 559ef922 |
| R2-4 | SHOULD FIX | the assembler loads only non-terminal hypotheses, so R13 is unreachable and a resolved hypothesis re-enters the queue as research | load the newest hypothesis of any status; R13 fires on a terminal row with no newer version | inputs.ts, rules.ts, routing-inputs.test.ts, routing-rules.test.ts | FIXED 390d75d1 |
| R2-5 | SHOULD FIX | legacy readback rows are inserted with `is_test=false` against the placeholder scaffold and the trigger freezes it as v1, so every built family carries an immutable v1 nobody received | the freeze trigger and its code mirror skip `legacy=true`; the e2e assertion flips; S3-T4 reconstructs the real versions | 2026-09-23-gap-os.sql, verify-triggers.ts, external-sync.ts, e2e-sprint2.ts, sequence/enrollment.ts (S3-T3) | FIXED 172db27b |
| R2-6 | SHOULD FIX | the completion sweep marks `completed` whenever the latest sequence differs, including a contact still actively enrolled in two, and for reply, bounce and manual unenrolls | `activelyEnrolledCount > 0` and latest differs -> hold `other_sequence_active`, touch external_state only; otherwise `stopped` with `stop_reason legacy_unknown` | external-sync.ts, external-sync.test.ts | FIXED 6460d7a1 |
| R2-7 | SHOULD FIX | `stopRun` leaves `failed` rows, which the legacy delete removed; `retryDraft` re-approves them and the run revives | `failed` joins STOPPABLE_STATUSES; mutation in immediate-stop.test.ts | sequence-runtime.ts, immediate-stop.test.ts | FIXED 8d57bbd6 |
| R2-8 | SHOULD FIX | R15 and R17 test `emailValid`, so a hard-bounced address with a usable phone is enrolled | `emailUsable` in R15 and R17; fixture | rules.ts, routing-rules.test.ts | FIXED 390d75d1 |
| R2-9 | SHOULD FIX | a public URL fact is keyed `manual:<sha1(url)>` without the account, so the second account gets the first account's signal id and can link it (then GAP_SIGNAL_FROZEN pins the wrong account forever) | key on account + url as the operator branch does; `linkSignals` refuses `signal_account_mismatch` | signals/route.ts, hypothesis/service.ts, signals-routes.test.ts, hypothesis-service.test.ts | FIXED 10bc31db |
| R2-10 | SHOULD FIX | `httpUrl` admits loopback, private hosts, app.hubspot.com, docs.google.com and yardflow.ai as public facts; a public fact may carry type intent or website_behavior | reject loopback, private ranges and an own-domain list; reject those two types for public facts, with the reasons `private_host` and `private_type` | signals/route.ts, signals-routes.test.ts | FIXED 10bc31db |
| R2-11 | SHOULD FIX | the poller sorts with the string form `['hs_timestamp']`, direction unproven, and a capped run advances the watermark to the newest row | explicit ASCENDING sort object; never advance the watermark when `seen >= limit` | hubspot-poller.ts, hubspot-poller.test.ts | FIXED d2e8f92a |
| R2-12 | SHOULD FIX | the committed Top100 roster fixture holds twenty real people (names, titles, LinkedIn URLs, emails, HubSpot ids) copied from the live lane | synthesize the roster with the same shapes, ids and counts; example.com addresses | tests/fixtures/gap/top100-roster.json, top100-reader.test.ts | FIXED 6460d7a1 |
| R2-13 | SHOULD FIX | explain leak patterns miss click, download, engagement score, hot lead, own-host and page-view phrasings; an intent-engine trigger title can reach whyAccount | add the patterns; a trigger whose source is the intent engine is private by source, not by title | explain.ts, routing-rules.test.ts | FIXED 390d75d1 |
Nits: all ten landed (N1 559ef922, N2 spec-only, N3 559ef922, N4 172db27b, N5 10bc31db, N6 559ef922, N7 6460d7a1, N8 named debt for Sprint 4, N9 d2e8f92a, N10 corrected above). Sprint 2 e2e re-run PASS at 50f4df7d (10 steps; step 7 now expects the local do_not_contact persona suppressed under an unknown verdict). Nits accepted (same batch where cheap): N1 the run POST accepts `?secret=` through the reused cron helper (header-only check for the POST); N2 `resolveEnrollTarget` returns `build_required` for a Top100 entry without a sequence id while section 6 says `modex_queue` (section 6 is corrected to `build_required`: a Top100 account without a built sequence is a build task, not a modex send); N3 human action is free text (enum `enrolled_by_hand | called | emailed | dismissed | deferred` in taxonomy, validated at the route); N4 the hypothesis_signals guard has no INSERT arm (BEFORE INSERT checking the target status); N5 `unlinkSignal` depends on validator error ordering (check the citation ids directly); N6 "latest run" is the newest row, not the `gap_routing_last_run` pointer (read the pointer, fall back to newest); N7 the sync writes `enrolled_at = now` and `current_step_index 0` as facts when the readback lacks them, and one partial-unique collision aborts the whole apply (nullable enrolled_at when unknown, per-row try/catch reporting `enroll_collision:<email>`); N8 poller attribution keeps the first persona per email and recounts unknown senders every run (named debt, Sprint 4); N9 both cron routes apply on any Bearer call without `?mode` (dry-run unless `?mode=apply`, matching the run route); N10 the S2-T7 test count is 44 and the S2-T9 scope is any persona with a contact id (corrected in the table above).


### Sprint 3: GAP sequences and compiler
Demo: an approved hypothesis compiles truthful copy for a persona through the deterministic checks, a human enrolls through the enroll table, and every Top100 enrollment is attributed to an immutable version reconstructed from the lane's journal.
| # | Ticket | Files owned | Test or validation |
|---|---|---|---|
| S3-T1 | Claims snapshot as the single source: `claims/registry.snapshot.json` (committed copy of the lane's registry plus the CR-034..040 rows reconciled from CLAIMS.md with their tiers), `validate-claims.ts` (claimsUsed resolution, DO_NOT_USE -> `claim_forbidden`, APPROVED_AS_QUESTION outside a question -> `claim_needs_question`, INTERNAL_ONLY never in copy) and `scripts/gap/claims-parity.ts` that diffs the snapshot against the lane's JSON and the ids present in CLAIMS.md and exits non-zero on any id present in one and not the others | `src/lib/gap/claims/**`, `scripts/gap/claims-parity.ts`, `tests/unit/gap/claims.test.ts` | parity script run against the real lane and its output recorded (it must name CR-034..040 as the lane's own drift); mutation: drop a row |
| S3-T2 | Steps schema and hashing: `sequence/steps.ts` (zod steps.v2: delay {value, unit}, purpose, sourcePurpose, condition, askType, productProofAllowed false on step 0 unless override, requiredEvidenceTypes, claimsUsed, templates; canonical JSON sha256), `sequence/business-days.ts`, `sequence/internal-recipient.ts` (structural copy of the perform-send internal-domain rule) | `src/lib/gap/sequence/{steps,business-days,internal-recipient}.ts`, tests | hash stable across key order; step 0 proof refused `first_touch_proof`; Friday + 1 business day = Monday; structural test reads perform-send.ts |
| S3-T3 | Family and version services: createVersion (draft max+1), assertVersionEditable (`GAP_VERSION_FROZEN`), retireVersion, freeze on first non-test enrollment mirrored in code; copy-events: `copyAt`, reconstruction, `copy_drift` detection | `src/lib/gap/sequence/{family,version,copy-events}.ts`, tests | edit on frozen throws; copyAt picks the newest event before the send; drift after enrolled_at reported |
| S3-T4 | Top100 journal import: families and versions from the 78 create/sequence rows (v1) and the footer update/sequence_templates rows (v2), copy events from the 4,246 update/contact rows, enrollments re-attributed to the version whose journal_ts is the newest at or before enrolled_at with rendered_steps reconstructed; dry-run default; second run zero writes | `src/lib/gap/import/top100-journal.ts`, `scripts/gap/import-top100-journal.ts`, fixtures, tests | planner over a fixture of one create row, one footer row, ~20 update rows, one readback; real-lane dry run pasted |
| S3-T5 | modex legacy import: one family (engine modex_draft_queue) and a frozen v1 per `sequences` row, one enrollment per distinct `sequence_run_id`, stamp `sequence_version_id` on the items; runtime pin: `resolve-steps.ts` (enrollment version -> item stamp -> legacy live read when the flag is off) wired into sequence-runtime.ts with the deterministic idempotency key | `src/lib/gap/import/modex-legacy.ts`, `src/lib/gap/sequence/resolve-steps.ts`, `src/lib/queue/sequence-runtime.ts` (flag branch only), tests incl. the existing runtime fixtures | flag off: prisma.sequence.findUnique and the legacy path unchanged; flag on with an enrollment: the pinned steps are used and findUnique is not called |
| S3-T6 | Compiler checks group A: C01 observation cited (fresh, unsuperseded, external_ok or first-party), C05 proof only from canon or proof refs (Primo nameable; `named_pipeline` list read from the lane), C10 observation first | `src/lib/gap/compiler/checks/c01-evidence.ts`, tests | each check has a red mutation |
| S3-T7 | Compiler checks group B: C02 hedge, C03 no prospect ROI, C04 no product in step 0, C06 private intent (reuse the routing patterns) | `src/lib/gap/compiler/checks/c02-hedge.ts`, `c04-product.ts`, tests | |
| S3-T8 | Compiler checks group C: C07 word count (45-120; step 1 45-80), C08 one problem, C09 one CTA in the allowed family from cold-outbound-policy, C11 banned phrases (voice-guardrails plus the lane's lint classes), C12 follow-up adds an unused evidence id and Jaccard < 0.6, C13 claims via S3-T1, C14 voice warnings; a lint-copy parity test that reads the lane's `lint-copy.mjs` rule names and fails on any not ported | `src/lib/gap/compiler/checks/c07-structure.ts`, `c11-banned.ts`, `c12-newinfo.ts`, `c13-claims.ts`, tests | |
| S3-T9 | Orchestrator, critic client, approval path: `compile()` -> CompileResult; clawd `POST /api/critic/score` client (unreachable -> review, never pass); review_required -> SendApprovalRequest; `GapCompile` row; `POST /api/gap/compile` | `src/lib/gap/compiler/{compile,approval}.ts`, `src/lib/gap/critic-client.ts`, `src/app/api/gap/compile/route.ts`, tests | critic down -> review_required; reject on any reject check |
| S3-T10 | `scripts/gap/compile-top100.ts`: compile every built account's four bodies from `data/sequences/<key>.json` against its research evidence into `data/compile/<key>.json` shape (written to a directory argument, never into the lane), reporting pass/review/reject counts per check; the enroll-row emitter requires a pass or an approved review for the contact | `scripts/gap/compile-top100.ts`, `src/lib/gap/routing/enroll-row.ts` (additive gate), tests | real-lane dry run pasted with counts per check |
| S3-T11 | Seed four families (Network Standardization, Hidden Capacity, Automation Readiness, New Sites and Acquisitions) in copy-voice with jake-voice stacked, each step passing the compiler against fixture evidence; sequence service that turns an approved version into a runtime `Sequence` row; `approveBatch` guard in queue-actions.ts refusing a GAP item without a pass | `src/lib/gap/sequences/families.ts`, `scripts/gap/seed-families.mjs`, `src/lib/gap/sequences/service.ts`, `src/app/discovery/queue-actions.ts` (flag branch), tests | every seeded step compiles pass; non-GAP items untouched (call-shape snapshot) |
| S3-T12 | Enroll service and preview UX: `enroll/service.ts` (emits the enroll row; the Draft Queue path uses addOne only; refuses when the flag is off, compile not a pass, autonomy halted; shadow writes audit and creates nothing), `/gap/preview/[hypothesisId]` with the compile report per check; e2e sprint 3 on the scratch DB; docs | `src/lib/gap/enroll/service.ts`, `src/app/api/gap/enroll/route.ts`, `src/app/gap/preview/**`, `src/components/gap/compile-report.tsx`, `scripts/gap/e2e-sprint3.ts`, `docs/gap/sprint3-e2e-latest.md`, docs | e2e PASS lines |
| S3-T13 | Compiler accepts the lane citation convention (added 2026-09-23 after the S3-T10 dry run: no lane body carries a marker because HubSpot-native copy reaches the prospect verbatim, evidence is cited beside the body in `evidence_ids`): C01 and C12 take the step's `contract.evidenceIds` as the citation set when the body has no markers, with the same freshness, superseded and not-a-fact rules and an observation-first rule for the first sentence; C09 recognises the lane's conditional-offer sentence as a CTA; C14 allows "yard-network" | `src/lib/gap/compiler/checks/{c01-evidence,c12-newinfo,c07-structure,c11-banned}.ts`, tests | lane dry run re-run with the per-check table before and after; marker-carrying bodies unchanged |

#### Sprint 3 shipped (2026-09-23, branch feat/gap-os-phase0)
| Ticket | Commit | Tests | Mutation proven red |
|---|---|---|---|
| S3-T1 claims snapshot + parity | 580fb8bf | 24 | dropped row |
| S3-T2 steps.v2, business days, internal recipient | e0308e3e | 39 | first-touch proof allowed |
| S3-T3 family, version, copy events, enrollment service | 401ad0fa | 84 | frozen version edited |
| S3-T4 Top100 journal import | 5efc1c6e | 24 (real lane dry run: 78 families, 90 versions, 3,687 copy events) | attribution to a later version |
| S3-T5 modex legacy import + runtime pin | fe09bab3 | 92 | live read under the pin |
| S3-T6 compiler group A (C01, C05, C10) | d2c2dc53 | 37 | stale ref accepted |
| S3-T7 compiler group B (C02, C03, C04, C06) | 532472e2 | 47 | hedge dropped |
| S3-T8 compiler group C (C07 to C09, C11 to C14) + lint parity | 9dfa47f8 | 94 | meeting ask at step 0 |
| S3-T9 orchestrator, critic client, approval, POST /api/gap/compile | fd46cd63 | 73 | critic down read as pass |
| S3-T10 compile-top100 + enroll-row compile gate | 89c80896 + ccf730d6 | 22 + 33 | native contact without a gate result enrolled |
| S3-T11 seed families, sequence service, approveBatch guard | f4670a36 | 63 | guard skipped |
| S3-T12 enroll service, POST /api/gap/enroll, preview page, compile report, runtime render | a6ea41c8 | 124 across enroll-service (33), enroll-route (9), compile-report (11), runtime-pin (29), queue-sequence-runtime, immediate-stop, audit | shadow wrote the enrollment; live skipped the autonomy read; render skipped under the flag |
| S3-T13 compiler accepts the lane citation convention, conditional-offer CTAs, yard-network | ed9c22f5 | 166 across five files | evidence_ids ignored; prior ids dropped; adapter drops priorEvidenceIds and excerpt |
| S3 e2e on the scratch DB | a6ea41c8 | 16 steps PASS at ed9c22f5 | (evidence: docs/gap/sprint3-e2e-latest.md) |
Decisions taken during the sprint: a gap question is an accepted CTA at any pre-meeting step (C09); legacy readback rows never freeze a version (R2-5) and the pin guard carries a one-time backfill arm for legacy rows with NULL rendered_steps (the journal import's attribution UPDATE); C06 uses a copy-safe subset of the routing leak patterns; the `evidence_ids` beside-the-body citation convention from the lane is honored by C12 through `priorEvidenceIds` (S3-T13); the "New Sites and Acquisitions" family is seeded under `network_standardization` (it differs by trigger and persona, not by problem); the guard reason name is `compile_not_passed` (section 8 corrected from `gap_compile_not_passed`); the seed script is `scripts/gap/seed-families.ts` (not `.mjs`); `GapAuditKind` gained `compile.result`, `sequence.materialized`, `enroll.shadow`, `enroll.refused` and `schedule.unrendered_placeholder`; the enroll service wraps `enroll()` and never re-implements its guards, refuses in the order gap_disabled, enroll_disabled (a machine actor while GAP_AUTO_ENROLL_ENABLED is off; a human may enroll live through the UI under GAP_OS_ENABLED alone, progression step 3), compile_not_passed:<step>, autonomy_halted (live only, the same `autonomyHalted('outreach')` reader `sendViaGmail` gates on, unreachable refuses), then target; the modex live path materializes the runtime Sequence row through `materializeSequence` (idempotent, refusal passed through) and stamps its id on the step-0 item so the runtime can continue the run, compiles the created item's RENDERED copy with its `draftQueueItemId` so the approveBatch guard has an item-level row, and parks a refused orphan as `skipped` with `gap_enroll_refused:<reason>`; enroll() owns the single `enroll.live` audit row on that path; under the flag the runtime renders `{{first_name}}` and `{{account}}` from the parent item (src/lib/gap/sequence/render.ts, shared with the service) and refuses any body that still carries a `{{token}}` (audit `schedule.unrendered_placeholder`, nothing scheduled); the preview page answers 404 when its flags are off, like the other GAP pages; no live enroll button ships this sprint.
Named debt carried into Sprint 4: `FIRST_PERSON` and `DIRECT` claim rows are refused by the projection and never become evidence refs; an unpinned live read (legacy run, flag off) loses the business-day unit and schedules calendar days; two-family C08 hits and `time_relative` in lane copy are lane-side fixes, not compiler changes; `--persist` on compile-top100 was verified through the library path in the e2e (toCompileInputs + compile with prisma), the CLI `--persist` flag itself has not run against the live lane; N8 poller attribution; `approveBatch` cannot run outside a Next request scope (NextAuth `auth()`), so the e2e proves the guard's data contract and the unit suite proves the guard; the fixture lane in tests/fixtures/gap/top100-compile has no fully clean contact (Jordan rejects steps 2 to 4 on C01), so the pass side of the enroll-row gate is proven with four seed-family compiles keyed to a synthetic contact.

#### Sprint 3 adversarial review (fresh agent, 2026-09-23, range 6a32d39b..cca80739)
Verdict: "NOT MERGEABLE as reviewed: the sprint built a real immutability layer and a real deterministic compiler, and everything it says it refuses, it refuses; but the truth guarantees stop one layer short of the surfaces that act." Four blockers, eleven should-fix. Every Sprint 2 fix (R2-1 to R2-13) was verified at its line. The lane dry run (100 accounts, 1,964 steps) compiles 36 pass / 18 review / 1,910 reject with zero clean accounts, so the enroll-row gate admits nobody from the live lane today, which is the honest state. Every finding was re-read at the cited line by the lead before ticketing.
| # | Sev | Finding | Fix (ticket) | Files | Status |
|---|---|---|---|---|---|
| R3-1 | BLOCKER | the pin guard's backfill arm (R2-5b) applies to every legacy row with NULL rendered_steps, which every imported modex run has by design, so an active legacy run can be re-pointed to any version in any family forever and that draft edited | arm requires engine hubspot_native, rendered_steps set in the same statement, and a version of the row's own family; the journal attribution filter requires engine hubspot_native | gap-os.sql, verify-triggers.ts, top100-journal.ts | FIXED 9c1d1a99 |
| R3-2 | BLOCKER | the hubspot_native enroll path emits the enroll row for a persona who is do_not_contact and unsubscribed (suppression only ran inside recordExternalEnrollment, live with readback) | suppression (modex column, unsubscribed, bounced) runs before target resolution for every mode and refuses `suppressed`; the row builder takes a suppressed input and lists the contact under Skip | enroll/service.ts, enroll-row.ts | FIXED 61817cc7 |
| R3-3 | BLOCKER | the compile gate is caller-authored: the route spreads a request-body `contract` into the checks (evidence freshness, wordRange, journeyStage reaching the policy's meeting-allowed branch, prior bodies, claims list, the top100Compile key), and the pass row it mints is bound to version and step, not hypothesis or person; a 127-word body with a fabricated observation and a meeting ask compiled pass | the route builds the contract server-side from the hypothesis signals, the version and the run; the body contract is an allowlist; wordRange and journeyStage are never caller-set; top100Compile persists only from the lane script; enroll, materialize and the enroll-row gate require the hypothesis match (template rows for shadow only) | compile/route.ts, compile.ts, enroll/service.ts, sequences/service.ts, enroll-row.ts | FIXED 61817cc7 + 155bff84 |
| R3-4 | BLOCKER | the live modex path queues copy with `[[SRC:id]]` markers still in it, later steps become approved with no per-item compile, and the seed templates carry invented prospect facts as the observation sentence with no code replacing them | markers stripped at render after the compiler judged the marked text; seed step 0 carries a `{{observation}}` slot filled from the hypothesis observation (its [S:id] tokens become markers); any leftover token refuses; the runtime creates later steps as draft and compiles each per item before approving | render.ts, families.ts, enroll/service.ts, sequence-runtime.ts | FIXED 61817cc7 |
| R3-5 | SHOULD FIX | compile rows unbound to hypothesis or person; the preview admits null-hypothesis rows | covered by R3-3 plus the preview query scoped to the hypothesis with template rows labelled | preview page | FIXED 41676c24 |
| R3-6 | SHOULD FIX | C02/C10 hedge satisfied by any "?" or "if " | hedge must sit in a second-person declarative claim; assertive patterns widened | taxonomy.ts, c02-hedge.ts | FIXED 155bff84 |
| R3-7 | SHOULD FIX | reconstructed journal versions insert as draft when the family has no enrollment yet, and any UPDATE may move draft -> frozen | journal history inserts frozen; draft -> frozen only through the freeze trigger; a BEFORE INSERT arm refuses frozen inserts outside import provenance | top100-journal.ts, gap-os.sql | FIXED 9c1d1a99 |
| R3-8 | SHOULD FIX | C06 misses bare "intent" and "looked at our ... page" | patterns added to the copy list | explain.ts | FIXED c07e28f1 |
| R3-9 | SHOULD FIX | fixtures still carry the live lane's HubSpot sequence and template ids, real correspondence dates, a real reply name and a real bounced address | synthesized | top100-manifest.json, top100-monitor.json | FIXED 069cf7c7 |
| R3-10 | SHOULD FIX | enroll() suppression is local only (no bounced status, no cross-plane leg) | shares routing's suppression read; unknown refuses | sequence/enrollment.ts | FIXED 61817cc7 |
| R3-11 | SHOULD FIX | sendNow and retryDraft bypass the compile guard | one shared guard for all three writers | queue-actions.ts | FIXED 61817cc7 |
| R3-12 | SHOULD FIX | an exception after addOne leaves an un-parked, un-stamped orphan that sendNow could send | park on error, rethrow | enroll/service.ts | FIXED 61817cc7 |
| R3-13 | SHOULD FIX | the HubSpot readback is a request-body claim that records an enrollment and freezes a version | readback removed from the route and the service; the sync cron is the only recorder | enroll/route.ts, enroll/service.ts | FIXED 61817cc7 |
| R3-14 | SHOULD FIX | compile-top100 `--persist` without `--critic` writes gate rows judged by a stub that always passes | persist requires critic; the dry-run stub answers review | compile-top100.ts | FIXED 155bff84 |
| R3-15 | SHOULD FIX | materializeSequence idempotency is by row name only | compares steps, refuses `sequence_name_collision` | sequences/service.ts | FIXED 61817cc7 |
Nits landed: N1 155bff84, N3 N4 N5 N8 N9 61817cc7, N6 1c2e21ba, N11 155bff84. Nits accepted into the same batches: N1 C13 also scans the body for DO_NOT_USE and INTERNAL_ONLY claim text; N3 the shared compile guard honours an approved review like the other two surfaces; N4 the native emitted-only outcome audits enroll.row_emitted, not enroll.live; N5 the runtime audits schedule.skipped instead of a silent null; N6 is_test, persona_id, account_name, owner and sender join the pinned columns; N8 sender and owner validated against the two sending identities; N9 the live per-item compile requires GAP_MESSAGE_COMPILER_ENABLED; N11 lane persona names redacted from the compile script stdout. Named debt: N7 imports insert frozen versions by provenance (now guarded by the INSERT arm of R3-7); N10 journal twins share a steps_hash and differ only by provenance.template_change. Spec drift corrected in this record: D1 and D2 (C06 intent pattern and the C07 word range, C15/C16 rows added to the table), D3 to D7 close with R3-2, R3-3, N4 and R3-1. The reviewer's seven mutations (version freeze refusal, enroll_disabled, critic fail-open, flag-off pin, legacy freeze, guard predicate, fail-closed gate) all went red. Twelve questions: unchanged by Sprint 3 (1 to 6 and 11 answerable; 7 to 10 and 12 wait for Sprints 4 and 5).

### Sprint 4: Calls, replies and BID
Demo: a call or reply disposition resolves a hypothesis in under 30 seconds, captures buyer truth as BID, stops the sequence immediately, and syncs compact truth to HubSpot. Owning root: `src/lib/gap/{disposition,bid}/**`, `src/lib/gap/hypothesis/resolution.ts`, `src/lib/email/unsubscribe.ts`, `src/app/api/gap/{dispositions,bids,replies}/**`, `src/app/gap/{replies,call}/**`, `src/components/gap/{disposition-form,bid-chips,pre-call-brief,reply-list}.tsx`, flag branches in `src/app/api/cron/check-inbox/route.ts` and `src/lib/gap/replies/hubspot-poller.ts`, additive `src/lib/gap/hubspot-mirror.ts`.
API contract (fixed here so the UI and the service can be built in parallel): `POST /api/gap/dispositions` body `{ hypothesisId, personaId?, contactEmail, channel: call|email|linkedin|meeting, responseClass, rootCauseClass?, impactClass?, objection?, buyerLanguage?, nextBestAction?, source: { kind: inbound_message|hubspot_engagement|call|meeting|manual, id }, bids?: [{ type, rawBuyerLanguage, normalizedSummary?, numericValue?, unit? }], aiSuggestionId? }` -> 201 `{ dispositionId, bidIds, effects: { stopped: [...enrollment ids], unsubscribed: boolean, resolution: null | { outcome, confidence }, mirrored: boolean }, refusals: [] }`; 400 `{ error: 'invalid_body', field }`; 409 `{ error: reason }` (`duplicate_source`, `hypothesis_not_active`, `suppressed_target_mismatch`). `POST /api/gap/bids` body `{ hypothesisId, contactEmail, dispositionId?, type, rawBuyerLanguage, normalizedSummary?, numericValue?, unit?, source, supersedesId? }` -> 201. `GET /api/gap/replies?state=undispositioned|all&cursor=` -> `{ items: [{ id, source, contactEmail, personaId, accountName, hypothesisId, subject, snippet (first 280 chars, no HTML), receivedAt, enrollmentId, suggestion? }], nextCursor }`. `POST /api/gap/replies/[id]/suggest` -> `{ suggestion: { responseClass, bids: [{ type, quote, why }], why } | null }` (404 skip when `GAP_REPLY_CLASSIFICATION_ENABLED` is off). `GET /api/gap/call/[personaId]` -> the pre-call brief `{ persona, account, hypothesis (FACT and HYPOTHESIS blocks, wouldProveWrong), lastDispositions, openBids, suggestedQuestions }`.
| # | Ticket | Files owned | Test or validation |
|---|---|---|---|
| S4-T1 | `recordUnsubscribe` extraction: one helper writes `UnsubscribedEmail`, `Persona.do_not_contact` and the HubSpot `hs_email_optout` mirror exactly as `/api/unsubscribe` does today; the route calls the helper; idempotent; the helper is the ONLY GAP-reachable writer of `do_not_contact` | `src/lib/email/unsubscribe.ts`, `src/app/api/unsubscribe/route.ts`, `tests/unit/gap/record-unsubscribe.test.ts` | route and helper write identical rows (call-shape snapshot before and after); second call no-op; structural: no other file under src/lib/gap writes `do_not_contact` |
| S4-T2 | Disposition pure model, BID rules and resolution: class table (stops the run? resolves? writes DNC? next action) over the 18 classes; `captureBid` / `correctBid` / `selectConfirmedBids` (append-only, correction inserts with supersedes_id); `hypothesis/resolution.ts` scoring per section 7 (email 60, call or meeting 70, +15 quote, +10 root cause, cap 95; problem_rejected -> rejected; partial -> partially_confirmed; timing sets resume_at; wrong_person returns to draft; referral emits a lead event) reading only human-confirmed unsuperseded BID | `src/lib/gap/disposition/model.ts`, `src/lib/gap/bid/{capture,select}.ts`, `src/lib/gap/hypothesis/resolution.ts`, tests | table-driven: every class row asserted; exactly one class writes DNC; unconfirmed BID never changes the resolution (mutation on the filter goes red); structural: zero `buyerInputData.delete` sites, `raw_buyer_language` never in an update |
| S4-T3 | Disposition and BID services and routes: validate, create rows in one transaction (human rows confirmed), effects in order (immediate stop via `stopRunsForRecipient` and `stopEnrollmentsForHypothesis` / persona for every stopping class; HubSpot-native -> stop_pending + review line; do_not_contact -> `recordUnsubscribe`; resolution through the hypothesis service `resolve`; contact mirror); `POST /api/gap/dispositions`, `POST /api/gap/bids`, `GET /api/gap/replies`, `GET /api/gap/call/[personaId]`; AI suggestion route behind `GAP_REPLY_CLASSIFICATION_ENABLED` with strict zod (unparseable -> null) | `src/lib/gap/disposition/service.ts`, `src/lib/gap/bid/service.ts`, `src/lib/gap/replies/{list,suggest,brief}.ts`, `src/app/api/gap/{dispositions,bids,replies,call}/**`, tests | effects order asserted; a failure after the rows are written never rolls them back; `duplicate_source` on the unique; the suggestion is stored on the disposition only when a human submits; flags off -> 404 |
| S4-T4 | Reply ingestion wiring under the flag: check-inbox and the HubSpot poller mark the enrollment's run `reply_pending` (immediate stop of unsent items via `stopRunsForRecipient` with reason `replied`, enrollment `paused` with stop_reason null until dispositioned) for any inbound from an enrolled address; flag off byte-identical | `src/app/api/cron/check-inbox/route.ts` (flag branch), `src/lib/gap/replies/hubspot-poller.ts` (flag branch), `src/lib/gap/replies/ingest.ts`, tests | flag off: call-shape snapshot identical; flag on: stop called with the run and reason, enrollment paused; autoresponders (reply-precision) never pause |
| S4-T5 | Reply Triage `/gap/replies` and Call Mode `/gap/call/[personaId]`: reply list with the suggestion chip, disposition form (class chips, then root cause and impact chips, then BID chips with quote capture), pre-call brief (FACT and HYPOTHESIS blocks, would-prove-wrong, suggested questions), under-30-second flow with keyboard shortcuts; built against the API contract above with a fetch stub | `src/app/gap/replies/**`, `src/app/gap/call/[personaId]/**`, `src/components/gap/{disposition-form,bid-chips,pre-call-brief,reply-list}.tsx`, tests (.tsx) | every class renders; a BID chip requires a quote; the form posts the contract shape exactly; AI suggestion is labelled "suggested, not confirmed" and never pre-confirms |
| S4-T6 | Contact-level mirror and the native unenroll check: `yardflow_gap_last_disposition` / `_at` and a contact note with the `gap:disp:<id>` marker through `GapHubSpotMirror` (idempotent, fail-open, never deal stages); a PREPARED-ONLY probe script that prints how it would verify unenroll-on-reply on one sequence (refuses without `--confirm` and an owner go) | `src/lib/gap/hubspot-mirror.ts` (additive), `src/lib/hubspot/properties.ts` (+contact props in `ensureGapProperties`), `scripts/gap/probe-native-unenroll.ts`, tests | second mirror call zero HubSpot calls; write guard when `GAP_HUBSPOT_MIRROR_ENABLED` is off; probe dry output only |
| S4-T7 | e2e sprint 4 on the scratch DB (inbound -> paused run -> disposition problem_confirmed with a BID -> resolution confirmed with confidence -> mirror skipped; do_not_contact -> unsubscribe rows + stop; unconfirmed AI suggestion changes nothing) + docs | `scripts/gap/e2e-sprint4.ts`, `docs/gap/sprint4-e2e-latest.md`, `docs/GAP_PROSPECTING_OS.md` | PASS lines |
Order: T1, T2, T4 in parallel -> T3 and T5 and T6 -> T7 -> review.

#### Sprint 4 shipped (2026-09-23, branch feat/gap-os-phase0)
<!-- verified:2026-09-23 -->
| Ticket | Commit | Tests | Mutation proven red |
|---|---|---|---|
| S4-T1 recordUnsubscribe extracted, the only GAP-reachable writer of do_not_contact | dfe660b9 | 21 | persona flag dropped (9 red); a planted writer under src/lib/gap (red naming the file) |
| S4-T2 disposition effects table, append-only BID capture and selection, resolution scoring from confirmed buyer truth | cdc8dd0c | 195 | timing writes DNC; superseded or unconfirmed BID selected; unconfirmed quote counted |
| S4-T3 disposition and BID services with their routes, the replies list, the call brief, the AI suggestion path | 7c3256fc | 107 | an unconfirmed row given effects; do_not_contact written directly (the S4-T1 structural test names the file); the caller outcome used |
| S4-T4 an inbound human reply pauses the enrollment and stops unsent items at once, under the flag | 88c7757c | 75 | autoresponders paused; flag-off reads |
| S4-T5 Reply Triage and Call Mode pages, disposition form, BID chips, pre-call brief | a3f78184 | 60 | quote gate removed; suggestion pre-selected |
| S4-T6 contact-level disposition mirror and the prepared-only native unenroll probe | 71ced2af | 63 | the existing-row check skipped; a null note id accepted |
| S4-T7 UI-to-route contract parity, Sprint 4 e2e, docs; routing reads only confirmed dispositions | c06a7dca + ceea4fcb | 14 (contract-parity) + 7 (reply-list) + 6 (pre-call-brief) + 24 (disposition-form, one fixture line) + 11 (gap-api-client) + 42 (routing-inputs, 1 new, 1 re-pinned) | a route field dropped from list.ts (`hypothesisTitle`) fails parity naming the key; the model's quote rule narrowed to problem_confirmed fails the constant-list and the class x channel table (2 red); the `human_confirmed: true` filter dropped from the assembler's disposition read fails the AI-row test and the lastDisposition test (2 red) |
| S4 e2e on the scratch DB | c06a7dca + ceea4fcb | 12 steps + cleanup PASS at ce49c484, zero leftovers across 15 tables | (evidence: docs/gap/sprint4-e2e-latest.md) |
Contract parity (S4-T7) reconciled the S4-T5 UI to the S4-T3 routes field by field, on the UI side only: `ReplyItem.personaId` is `number | null`; `hypothesisTitle` (the problem family) and `enrollmentStatus` are always present (the list already sends both); `ReplySuggestion.id` is required (the unconfirmed ai row id the form sends back as `aiSuggestionId`); `dispositionId` rides along on `state=all` and the list shows a "dispositioned" badge; the call source the page mints (`call:<personaId>:<ms>:<random>`) parses under the route; the brief's persona carries `role` and `doNotContact` (the brief now warns on a do-not-contact persona), the account is `tier` + `vertical` (not TAM or heat, which the brief route does not read), the hypothesis carries `contraryEvidence` and `predictedBuyerLanguage`, dispositions carry `humanConfirmed`, open BIDs are unconfirmed by definition; `DispositionResult.effects.resolution.confidence` is `number | null`, `refusals` are typed `{ step, reason, id? }`, `BidResult` carries `humanConfirmed` and `supersedesId`, the body accepts the route's optional `resumeAt` and `referral`, and a flag-off 404 surfaces the skip payload's `reason` as the client error. No route contract changed; no route file was edited.
Decisions taken during the sprint: an AI suggestion is stored as an UNCONFIRMED `created_by: ai` disposition row with no effects by construction, and it BECOMES the human's row on submit with `aiSuggestionId` (the class fields set, `human_confirmed` flipped in one update, `ai_suggested` kept, `metadata.aiSuggestion` recording whether the human agreed); `duplicate_source` is only reachable on an active hypothesis (a resubmit on a resolved one is `hypothesis_not_active` first); wrong_person is `close_unresolved` plus a superseding draft with no primary persona, because the machine has no active -> draft edge; the `metadata` column (resumeAt, referral, the agreement record) is frozen with the classes once confirmed (GAP_DISPOSITION_FROZEN); the reply_pending marker lives in `SequenceEnrollment.external_state` because the enrollment has no paused_reason column, and the disposition service never resumes a paused run; out_of_office and the three call-only classes leave a paused run paused; the root-cause bonus counts on partial confirmation; existing_solution requires an objection; the suppression leg emitted after a do_not_contact disposition is `unsubscribed` (the first leg that hits, since recordUnsubscribe writes UnsubscribedEmail before the persona flag), the persona flag alone being the `modex_do_not_contact` leg; the live modex enroll path requires GAP_MESSAGE_COMPILER_ENABLED (N9), so the e2e sets it with a stub critic; the routing assembler (`src/lib/gap/routing/inputs.ts`) reads `undispositionedInbound` and `lastDisposition` from HUMAN-CONFIRMED rows only, so an unconfirmed AI suggestion row never hides a reply from R3 reply_pending (the `disposition_newest` read is gone; e2e step 4 proves the reply still pending with only the AI row and step 5 proves it dispositioned after the human confirms).
Named debt carried out of Sprint 4: there is no closed root-cause or impact class list (free text on the row; the form offers the family catalog as chips); the legacy modex run with no enrollment row is only paused lazily by send-deps; native unenroll-on-reply is unverified until the owner go in section 15 (the probe is prepared only); summary warnings carry name slugs; the runtime per-item compile is not gated on the compiler flag; there is NO human confirm path for an AGENT-created disposition row (only `created_by: ai` rows adopt through `aiSuggestionId`, an agent row answers `ai_suggestion_not_adoptable`, so it sits unconfirmed until a human writes a new row under another source id); the client's `DispositionResult.effects` is typed as the human block only (an agent submit's `effects: 'none'` is unreachable from the session pages and not represented; disposition-form.tsx reads `effects.stopped`); `scripts/**` sits outside the tsconfig include, so `tsc -p` never type-checks the e2e scripts (S4-T7 checked e2e-sprint4.ts through a temporary tsconfig that extends the project one).

### Sprint 5: Learning dashboard
Demo: diagnose targeting versus message versus ask versus discovery failures. Tickets: metric functions that always return `{value, n}` (hypothesis resolution rate, precision, problem resonance rate, root-cause confirmation rate, impact acknowledgment and quantification rate, problem to meeting, meeting to qualified problem) broken down by signal type, family, persona, tier, family and version, channel and sender; the audit's pre-registered 30-day bar as tiles; shadow-agreement per rule; minimum-sample guardrails; `/gap/learning`. Opens and clicks remain secondary diagnostics (scanner-contaminated).

#### Sprint 5 shipped (2026-09-24, branch feat/gap-os-phase0)
<!-- verified:2026-09-24 -->
| Ticket | Commit | Tests | Mutation proven red |
|---|---|---|---|
| S5-T1 learning metrics engine, pure: hypothesis funnel, conversation funnel, breakdown-by-dimension, disposition distribution, signal yield | 00f090bd | 22 | (pure module; no DB write to mutate) |
| S5-T2 learning query layer over Prisma: the human_confirmed gate, root-cause/impact join from confirmed unsuperseded BID, dimension tagging | 4bd54d8f | 7 | dropping `where: { human_confirmed: true }` from the disposition query fails the structural assertion naming the query; a correction that supersedes a confirmed root-cause BID stays excluded while itself unconfirmed |
| S5-T3 `GET /api/gap/learning` and the client's `getLearningReport` | 018975a9 | 5 | (route: gate/auth pinned; no consequential invariant beyond S5-T2's) |
| S5-T4 `/gap/learning` dashboard: hypothesis funnel, problem resonance, signal yield, family/persona/version tables, disposition distribution | 856ba328 | 4 | (presentation; `isLowSample`/zero-denominator rendering pinned) |
| S5-T5 Sprint 5 e2e on the scratch DB, docs | (this commit) | 1 e2e run PASS | (evidence: docs/gap/sprint5-e2e-latest.md) |
Sprint 5 adds no schema: every metric reads `ProspectingHypothesis`, `ConversationDisposition`, `BuyerInputData` and `ProspectingSignal` exactly as Sprints 1 and 4 left them (section 4's instruction to reuse the existing data model, not build a second analytics store).
Metric definitions locked by the e2e and the unit suite: a hypothesis counts toward the resolution-rate denominator only once it has at least one human-confirmed conversation whose response class is NOT in `no_answer | voicemail | gatekeeper | out_of_office | bounce | no_signal` ("substantive"); resolution rate and precision are computed over that substantive set, never over every hypothesis ever created. Root cause, impact-acknowledged and impact-quantified are computed per conversation from confirmed, unsuperseded BID rows tied to the conversation's hypothesis (or the disposition's own free-text `root_cause_class`/`impact_class`), never from an unconfirmed or superseded row. Problem-to-meeting and meeting-to-qualified-problem are counted per hypothesis (not per conversation) so a hypothesis with several touches cannot push either rate above 1. `breakdownByHypothesisDimension` and `breakdownByConversationDimension` are the only aggregation path; a hypothesis or conversation whose dimension key is null is left out of every group rather than folded into a silent "unknown" bucket.
Named debt carried out of Sprint 5 (explicitly deferred, not part of this finish): the audit's pre-registered 30-day bar has no tiles (no scorer exists yet to feed it); shadow-agreement per rule (RoutingDecision human_action vs action) is not surfaced on the dashboard; opens/clicks are not wired at all (spec calls them secondary and scanner-contaminated, so this is a deliberate omission, not a gap); there is no date-range filter on the report (it is computed over all GAP rows on every call); `byChannel`/`bySender` breakdowns expose only the conversation-level rates (3-8), not hypothesis resolution/precision, because a single hypothesis can span several channels and senders (documented in `metrics.ts`, not a bug).

### Sprint 6: HubSpot-native publishing (only if 6.1 passes)
6.1 create-then-delete probe with the private-app token on a throwaway sequence; on refusal, a user-level OAuth app. Then `SequencePublisher` and template publisher, external id mapping on the family and version, drift detection, and API enrollment under human approval.

### Sprint 7: Controlled automation (only after learning data exists and G0-G6 are earned)
Canary config, the G1-G6 evaluator, kill-switch drill script, per-rule and global caps, audit log, live auto-enroll behind `GAP_AUTO_ENROLL_ENABLED` with `GAP_AUTO_ENROLL_SHADOW` first.

### GAP OS FINISH (in progress; supersedes the prior Sprint 5 resume point)
Sprints 1-5 merged to `main` via PR #249 (2026-09-24, HEAD `a6de274f`). A fresh Opus adversarial review of the full merged diff (`a6de274f^1..HEAD`, ~39k lines) found 9 BLOCKERs (all lead-verified in code), 2 requirement gaps needing an owner ruling (R-A, R-B; both ruled IN SCOPE by the owner 2026-09-24), and 17 SHOULD FIX findings. Review doc: `C:\Users\casey\.claude\plans\pasted-content-id-c4bb-final-gap-tranquil-dusk.md`. This finish work lands on branch `feat/gap-os-finish`, worktree `C:\Users\casey\wt-gap-os-finish` (one writer; no reviewer shares it). Owner authorization: code, tests, feature-branch push, PR creation; no merge, no production write, no real-prospect send/enrollment, no reversing the clawd autonomy halt.

**Shipped this session (commits on `feat/gap-os-finish`, oldest first):**
- B4 `ab37b248` — unsubscribe suppression case-insensitive (LIVE bug; persona lookup, perform-send and send-bulk guards all matched exact case against a lower-cased UnsubscribedEmail table).
- B1 + B2 `db0c4d09` — disposition truth boundary: a non-terminal (not just `active`) hypothesis can record stop/DNC effects; an unconfirmed row for a source is silently adopted by a human submit regardless of who posted it first.
- B3 `a8a49d15` — an agent can never correct a human-confirmed BID (`correction_requires_human`).
- B5 `47725f29` — the kill switch (flag off) never approves a raw, uncompiled GAP step; refuses on a version stamp or a literal `{{token}}`.
- B6 `5ccfe037` — routing and enroll both refuse cold prospecting into an active opportunity (open pipeline stage at `meeting`+, a booked meeting, or a recent confirmed positive disposition).
- B7 `67dab301` — HubSpot enrollment attribution recovered from the `enroll.row_emitted` audit trail (hypothesis_id, real version, `legacy: false`); a suppressed-but-still-enrolled contact is surfaced (`suppressedButEnrolled`), never silently normalized.
- SF1 `7fa60728` — the enrollment sweep resolves `stop_pending` rows too (previously only `active`; `confirmStop` had no caller).
- B8 + B9 `379839bc` — learning's sequence family/version breakdown reads real `SequenceEnrollment` attribution, not the never-written hypothesis columns; the gate metrics exclude `is_test` enrollments and internal recipients.
- R-A `c385f65d` — campaign/program and date-range filters on the learning query, API and dashboard.
- R-B `97ef0a11` — routing-recommendation-vs-human-action agreement (`HUMAN_ACTION_AGREEMENT` mapping, `computeAgreement`, `GET /api/gap/routing/agreement`, a dashboard section); gate G1's data source.
- SF9 `ab1b668c` — enroll refuses an account-mismatched persona or a decision routed for a different persona (`account_mismatch`, `decision_persona_mismatch`).
- SF4 `fc0d30f1` — routing ignores a call-only outcome (no_answer/voicemail/gatekeeper/out_of_office) when it follows a substantive disposition, so it can no longer silently clear a `timing` resume date or a booked meeting.
- SF7 `af9a7b54` — a PIC citation's signal is titled from its own evidence (the verbatim quote, or the ref), never the sheet's seller-inferred `problem`; `sourceId` is scoped by rowIndex so two rows citing the same ref never collide in the idempotent registry.
- SF8 `8c8a463b` — a persona email shared by two rows resolves to the same (lowest-id) persona in both reply triage (`replies/list.ts`) and the HubSpot poller (`hubspot-poller.ts`), via matching `orderBy: { id: 'asc' }` + first-wins.
- SF10 `45594d85` — the live queue item sends AS the recorded `sender` (DraftQueueItem has no sender column; `owner` is the only field the send path reads), and the `owner`/`sender` fallbacks (an authenticated actor's email, a decision's `preferredSender` snapshot) are validated against `SENDING_IDENTITIES` before being trusted.
- SF11 `cbd5494b` — the step-0 draft is stamped `sequence_version_id` (gate-visible to `gapCompileGuard`) BEFORE `compile()` runs, not only after `enroll()` succeeds, so a request that dies mid-compile leaves the item refused, never silently approvable.
- SF15 `2cf77f9d` — the rollback SQL reverts `inbound_messages.source`/`.hubspot_engagement_id` and their indexes too, not only `draft_queue_items.sequence_version_id`.
- SF16 (yield only) `44872f33` — signal yield dedupes by signal id, so `hypothesisCount` can never exceed `signalCount` (was reproducibly over 100% when several hypotheses shared one primary signal).

Every commit followed RED -> fix -> GREEN -> mutate -> restore, verified by hand (a temporary WIP stash or a targeted mutation, reran the test, confirmed the failure, restored). `tsc --noEmit` and the full `tests/unit/gap` suite were green after every commit; last full check 2026-09-24: 97 files, 2312 tests, 0 failures.

**SHOULD FIX items DEFERRED, per the owner's filter (fix only what materially affects buyer truth, suppression/outbound safety, reply ingestion, execution attribution, campaign learning, idempotency or production operability):**
- **SF14** (compile verdicts have no age limit at emit, no evidence-freshness recheck): `enroll/service.ts`'s compile verification (`verifyCompiles`) checks that a named `GapCompile` row passed, is bound to the right version/step/hypothesis, but never checks `GapCompile.created_at` against `input.now`, nor rechecks whether the hypothesis's cited signals (`ProspectingSignal.freshness_expires_at`, already loaded at `EVIDENCE_SIGNAL_SELECT`) are still fresh as of enroll time. Deferred because the correct policy is a genuine design decision this session has no basis to guess at: a blanket max-compile-age would need a threshold nobody has specified, and a full evidence-freshness recheck needs a decision about which of a hypothesis's several linked signals must stay fresh (all of them? only the ones the compiled copy actually cited?) to avoid either refusing legitimate enrollments or being safety theater that gates nothing real. The data needed (`freshness_expires_at`, the same `IS NULL OR > now` predicate `signals/registry.ts:115` already uses) is already loaded where the fix would go.
- **SF16** (remainder, beyond the yield fix already shipped): no `tests/unit/gap/gap-noninterference.test.ts` exists (spec section 13 names it as a snapshot suite pinning `approveBatch`/`addOne` call shapes for non-GAP items; today's regression coverage is the scripted e2e paths, not a dedicated snapshot file). DB triggers (`prisma/sql/2026-09-23-gap-os.sql`) are exercised only by the manual `scripts/gap/verify-triggers.ts`, never wired into CI. Both are test-infrastructure builds, not fixes to a specific wrong behavior, and are tracked here as named debt rather than folded into this finish.

**Remaining for this finish (not yet done):** section 6A-6F (canonical identity, multi-engine execution contract, execution adapters, campaign reconciliation, the response/call loop, operational learning) and Sprint 7's shadow control plane are the field-pilot architecture work, not yet started. Sprint 6 (HubSpot-native publishing) and live Sprint 7 automation (`GAP_AUTO_ENROLL_ENABLED`) remain explicitly deferred, owner-gated rollout phases.

### GAP CORE RELEASE CANDIDATE (2026-09-24)
<!-- verified:2026-09-24 -->
The blocker-remediation pass above is a release candidate: PR #250, branch `feat/gap-os-finish`, HEAD `f9fd2eda` (worktree `C:\Users\casey\wt-gap-os-finish`). All 9 BLOCKERs, R-A, R-B and the in-scope SHOULD FIX items (SF1-SF13, SF15, SF16 yield) are shipped per the ledger above; SF14 and SF16's remainder are DEFERRED with named reasons.

**E2E, re-run against a fresh disposable scratch DB** (the persistent 127.0.0.1:5433/gap_dev credentials were unavailable this session; a disposable Docker Postgres 16 container was used instead, per `scripts/gap/e2e-sprint*.ts`'s own documented fallback -- schema pushed, `2026-09-23-gap-os.sql` applied, `verify-triggers.ts` 30/30 PASS confirmed before any e2e ran, container destroyed after):
- Sprint 1: PASS (`docs/gap/sprint1-e2e-latest.md`)
- Sprint 2: PASS, after fixing a stale test-only assertion (loadDecisions needed the same injected suppression reader every other call in the script already used, once SF12 made it check the cross-plane leg) -- `docs/gap/sprint2-e2e-latest.md`
- Sprint 3: PASS, after fixing a stale test-only assertion (the expected step-1 idempotency key read the administrative OWNER constant instead of the item's real `owner` column, which SF10 correctly changed to the sender) -- `docs/gap/sprint3-e2e-latest.md`
- Sprint 4: PASS, after fixing two stale test-only assertions (B1+B2 renamed `hypothesis_not_active` to the broader `hypothesis_terminal`; B1+B2 also lets a human adopt an AGENT-created unconfirmed row, so "adoption refuses" was rewritten to "adoption succeeds and resolves the hypothesis") -- `docs/gap/sprint4-e2e-latest.md`
- Sprint 5: PASS, no changes needed -- `docs/gap/sprint5-e2e-latest.md`
- Finish hardening e2e (new, `scripts/gap/e2e-finish-rc.ts`): PASS. Proves the shortest useful chain (fact/signal -> hypothesis -> approval/activation -> routing decision -> execution/enrollment attribution -> human-confirmed disposition -> BID -> hypothesis resolution -> learning) plus the six properties no single sprint e2e covers together: suppression wins, active opportunity blocks cold enrollment (B6, against a passing compile stack identical to the happy path's), the kill switch creates no raw/uncompiled continuation (B5, GAP_OS_ENABLED flipped off mid-run against this run's own GAP-stamped item), routing-vs-human-action agreement recorded from a real RoutingDecision row through the real `recordHumanAction` writer (R-B), test/internal traffic excluded from real learning metrics (B9), and the campaign/date filter returns only the intended cohort (R-A). Zero leftovers. `docs/gap/finish-rc-e2e-latest.md`.

Every stale e2e assertion fixed above was a TEST catching up to a deliberate, already-shipped, already-unit-tested fix from earlier in this session -- never a weakening of what the e2e checks, and never a change to the assertion's underlying property (each fix is documented inline in the script and in commit `f9fd2eda`).

**Regression:** `tests/unit/gap` 2312/2312. `npx tsc --noEmit` clean. Full repo `npx vitest run`: 4291/4292, 1 pre-existing skip, no flaky failures this run (a full-suite parallel-load timeout in `gmail-thread-exists.test.ts`/`hubspot-client.test.ts` was observed once earlier in this session and confirmed to pass in isolation -- unrelated to any GAP change, not repaired). Vercel build green through this branch's actual HEAD, `72a34b93` (GitHub commit status "Deployment has completed", confirmed after the build finished).

**Safety, unchanged:** no production database touched, no real HubSpot enrollment, no prospect email sent, no production GAP flag changed, `GAP_AUTO_ENROLL_ENABLED` off, the clawd autonomy halt not reversed. The disposable e2e database and Docker container are destroyed at the end of this session; nothing about them persists.

**Explicitly preserved as the NEXT PHASE, not started and not abandoned:** 6A canonical identity, 6B multi-engine execution contract, 6C HubSpot/Gmail execution adapters, 6D generic campaign reconciliation, 6E reply/call truth loop hardening, 6F operational learning extensions, and Sprint 7's shadow automation control plane. These are substantial new subsystems the current session was explicitly told not to start; they belong in a fresh context/branch once this release candidate is reviewed, while the hardened Sprints 1-5 are dogfooded.

### GAP CORE LIVE: MANUAL / SHADOW (2026-09-24)
<!-- verified:2026-09-24 -->
**Production now (2026-10-08, evening):** main 133aeee7 (PR #413, the sales execution engine X01-X12), deployment
`dpl_Daup1pG6Eo48tBCDsuZ1iwfGFywQ` READY 2026-10-08T18:33:38Z. New and ON: `GAP_BRIEFING_ENABLED`, `GAP_AGENT_TASKS_ENABLED`,
`GAP_ROUTING_CRON_ENABLED`, `GAP_ACTION_SECRET` set; the seller settings written (briefing 7 am New York to casey@freightroll.com,
command senders his two addresses, mode review). Read-only smoke on the SHA: the three cron routes and the settings route 401
signed out; health HEALTHY on mailbox, HubSpot, suppression and sender; Work renders as before. The earlier line stands below.
<!-- verified:2026-10-08 -->
**Production at the morning release (2026-10-08):** main 542a6b4d (PR #410, the execution-recovery release R00-R65), deployment
`dpl_C4THQEpA3qYy73JQt9A23sNLTx5W` READY 2026-10-08T02:27:23Z. Flags unchanged by the release: ON `GAP_OS_ENABLED`,
`GAP_HYPOTHESIS_ENABLED`, `GAP_ROUTING_ENABLED`, `GAP_MESSAGE_COMPILER_ENABLED`, `GAP_REPLY_CLASSIFICATION_ENABLED`,
`GAP_BACKGROUND_RESEARCH_ENABLED` (on the cron schedule); OFF `GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED`,
`GAP_HUBSPOT_MIRROR_ENABLED`, `GAP_AUTO_ENROLL_ENABLED`, `GAP_AUTO_ENROLL_SHADOW`; unset `GAP_CRM_APPROVED_WRITES_ENABLED`
(approved HubSpot writes stay off) and `GAP_TRANSCRIPTION_ENABLED`. Receipts: the R64 entry.
<!-- verified:2026-10-08 -->
PR #250 merged to `main` with a normal merge commit, `d9a94dc2` (no production schema delta: only the rollback SQL changed). Production deployment `dpl_DuRtGTpjdAWsHoHMxVzwLhK2c8kw` READY on `d9a94dc2`. Prod read-only checks: `verify-triggers.ts` 30/30 PASS (rolled back), `prisma migrate diff` prod vs schema empty, every GAP read path OK inside a READ ONLY transaction (all tables empty). Flags ON in Production: `GAP_OS_ENABLED`, `GAP_HYPOTHESIS_ENABLED`, `GAP_ROUTING_ENABLED`, `GAP_MESSAGE_COMPILER_ENABLED`, `GAP_REPLY_CLASSIFICATION_ENABLED` (suggestions are unconfirmed, effect-free, GAP-local rows; human session only). Flags explicitly `false`: `GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED`, `GAP_HUBSPOT_MIRROR_ENABLED`, `GAP_AUTO_ENROLL_ENABLED`, `GAP_AUTO_ENROLL_SHADOW`. GAP crons remain unregistered. `OUTREACH_PAUSED` and the clawd autonomy halt untouched. Not done at that time: an authenticated in-browser click-through (no signed-in browser reachable) and the shadow dogfood (prod has no internal/test Account/Persona; not fabricated). Findings carried into the runtime phase: 19 of 22 recent Pounce triggers do not exact-match an `accounts.name` (6A), and `/api/gap/*` agent header-token paths are unreachable behind the session middleware (6B/Sprint 7). Next phase: branch `feat/gap-os-runtime`, handoff `docs/GAP_RUNTIME_HANDOFF.md`.

**Authenticated production UI check, closed 2026-09-24:** Casey verified, signed in to production, that `/gap/`, `/gap/hypotheses/` and `/gap/learning/` all render successfully. The pages are data-empty as expected -- production GAP data has not yet been populated (consistent with the read-only prod check above finding every GAP table empty) -- and no production data was changed to make them look populated. This closes the authenticated UI check the release session above could not perform.

### GAP OS RUNTIME: 6A-6F + Sprint 7 (in progress)
<!-- verified:2026-09-24 -->
Executing `docs/GAP_RUNTIME_HANDOFF.md` end to end on branch `feat/gap-os-runtime`, worktree `C:\Users\casey\wt-gap-os-runtime` (one writer). Scratch e2e database: a disposable Docker Postgres 16 container (`gap-runtime-scratch`, inside the WSL2 Ubuntu distro, published to the Windows host at `127.0.0.1:55432/gap_finish_e2e`) -- the persistent `127.0.0.1:5433` cluster this session found already listening belongs to an unidentified prior process with unknown credentials and was left untouched, per rule 5's documented disposable-container fallback. Schema pushed, `2026-09-23-gap-os.sql` applied, `verify-triggers.ts` 30/30 PASS confirmed before any ticket work began.

**Owner addendum (2026-09-24, received mid-session, folded in without re-planning):**
1. 6A identity precedence is A) HubSpot company id, B) verified normalized domain, C) explicit alias/CanonicalCompany mapping, D) normalized legal/display name as a FALLBACK candidate only, never a silent merge. A higher tier beats a conflicting lower one; the conflict is returned to the caller for audit, never swallowed.
2. 6B/6C must model `gmail_draft` as a distinct execution state from `gmail_direct` (draft creation is not delivery); carries draft id, created timestamp, sender, recipient, content hash, hypothesis, campaign/program, thread id; sending preserves lineage to the draft intent and records the new sent message id; replies preserve `threadId`/`References`/`In-Reply-To`/matching `Subject`.
3. 6C HubSpot auth is time-boxed: inspect current auth once, use it if it covers Sequence CRUD, else record the capability boundary and complete the adapter contract with fakes/tests; no new OAuth app in this phase; `GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED` stays off.
4. 6D gets a read-only Inland26 dry-run dogfood after its scratch e2e passes: `docs/gap/inland26-runtime-reconcile-dry-run.md`, no writes, no fabricated hypotheses.

**Ticket ledger (one line per commit, oldest first):**
- 6A-T2 -- pure identity resolver (`src/lib/gap/identity/normalize.ts`, `resolve.ts`) implementing the precedence above: A/B/C/D tiers, ambiguous-within-a-tier falls through rather than winning, a higher tier's disagreement with a lower one is returned as `conflict` (never silently dropped), deterministic string normalization only (no fuzzy/edit-distance matching). 20 tests (`tests/unit/gap/identity-normalize.test.ts`, `identity-resolve.test.ts`), including the literal acceptance case ("Niagara Bottling, Llc" resolves to "Niagara Bottling"). Mutation-tested: reversing the tier precedence order breaks 5 tests with the specific conflict/tier assertions, restored.
- 6A-T1 -- schema: `GapAccountAlias` (`gap_account_aliases`, additive, cuid id, unique on `normalized_alias`) is tier C's explicit alias table; hand SQL `prisma/sql/2026-09-24-gap-identity.sql` + rollback adds the `source` provenance CHECK (`hypothesize_cron` | `manual`); `verify-triggers.ts` extended to 32 guards. Confirmed RED against the table before `db push` (the new guards' fixture inserts failed with `relation "gap_account_aliases" does not exist`), GREEN (32/32) after `db push` + hand SQL on the scratch DB.
- 6A-T3 -- prisma glue (`src/lib/gap/identity/service.ts`): `loadIdentityContext` builds tier B's verified-domain index by reading the EXISTING revops canonical/dedup engine's `CanonicalCompany`/`CanonicalAccountLink` tables read-only (both `status: 'resolved'`), rather than a second domain index; `resolveAccountName` (loads or reuses a passed context) and `registerAlias` (idempotent on the normalized key) complete the surface. 7 tests. Mutation-tested: dropping the idempotency check-then-create makes `registerAlias` always insert; the idempotency test catches it, restored.
- 6A-T4 -- **the acceptance ticket**: wired the resolver into `runHypothesize` (`src/lib/gap/hypothesis/hypothesize.ts`). Every pounce trigger is identity-resolved ONCE before grouping (one `loadIdentityContext` call per run, then the pure resolver per trigger); a trigger that does not resolve to exactly one Account is counted by reason and skipped -- it never reaches `registerSignal`, so it can no longer throw the FK violation that used to abort its whole raw-named account's processing (the 86%-ineffective bug in section 2 of the runtime handoff). `fromPounceTrigger`'s pure projection is untouched; its `accountName` is overridden with the 6A-resolved canonical name at the `registerSignal` call site. A tier conflict (company id/domain disagreeing with a name-derived guess) is audited via the new `identity.conflict` `GapAuditKind`, never swallowed, and the higher tier still wins. A resolution earned only through name normalization is cached as an explicit alias (`source: 'hypothesize_cron'`) so the next run resolves it through tier C instead of re-deriving it. Added `HypothesizeReport.identity` (`resolved`/`aliasesRegistered`/`conflicts`/`refused`). 6 new tests plus all 27 existing hypothesize-cron tests updated to the new report shape and passing unchanged behaviorally (a default passthrough `resolveIdentity` mock keeps Sprint 1-5 tests ignorant of 6A). Full `tests/unit/gap`: 100 files, 2345 tests, 0 failures. Mutation-tested: removing the `continue` after an unresolved-identity refusal breaks the two skip-tests with the specific "never reaches registerSignal" assertion, restored.
- 6A-T5 -- `assembleRoutingInputs` (`src/lib/gap/routing/inputs.ts`) gets an OPTIONAL, dependency-injected identity-resolution fallback for when the exact account lookup misses: undefined by default, so every existing caller and the ~900-line `routing-inputs.test.ts`/`routing-run.test.ts` fixture suites are byte-identical to before (95 tests unchanged, proven with a minimal prisma stub carrying no identity delegates at all). In practice `args.accountName` is already canonical by the time it reaches routing, since 6A-T4 resolves it upstream at signal registration; this is a defensive second chance for a caller that did not go through that path, not a load-bearing path. New file `tests/unit/gap/routing-inputs-identity-fallback.test.ts` (3 tests, kept separate from the large fixture suite to avoid touching its established conventions). Mutation-tested: retrying under the original unresolved name instead of the resolved one breaks the retry test, restored. Full `tests/unit/gap`: 101 files, 2348 tests, 0 failures.

- 6A-T6 -- scratch e2e `scripts/gap/e2e-6a.ts` -> `docs/gap/6a-e2e-latest.md`: PASS against a real database and the real `runHypothesize`, not mocks. Proves in one run: the Niagara-shape trigger resolves and its signal lands under the canonical account; the genuinely-unknown-company trigger produces no signal and creates no Account; the company-id-vs-name conflict trigger resolves to the company-id account with the disagreement recorded as an `identity.conflict` `gap_audit_events` row naming both accounts; a second lookup of the SAME raw name now resolves via the cached alias tier at higher confidence than the first (normalized-tier) run. Zero leftovers (cleanup counts matched creation counts exactly: 3 accounts, 3 triggers, 2 signals, 1 alias, 1 audit event).

**6A DONE.** All acceptance criteria from docs/GAP_RUNTIME_HANDOFF.md section 3 met: the Niagara Bottling case resolves, an ambiguous collision refuses, a genuinely unknown company refuses `unresolved_company` and never creates an Account. Full `tests/unit/gap`: 101 files, 2348 tests, 0 failures; `npx tsc --noEmit` clean throughout.

### 6B: multi-engine execution contract (in progress)
- 6B-T1 -- SF16 remainder closed: `tests/unit/gap/gap-noninterference.test.ts` pins the exact `draftQueueItem.create` payload `addOne` (`src/app/discovery/queue-actions.ts`) produces for a plain, non-GAP `QueueAddInput` -- every field, by full-object equality, not just the two fields the existing `tests/unit/queue-actions.test.ts` checked. `approveBatch`'s non-GAP shape was already comprehensively pinned by `tests/unit/gap/approve-batch-guard.test.ts`; this file's approveBatch case is a light corroborating check. Mutation-tested: adding a stray `sequence_version_id` field to `addOne`'s create call (simulating exactly the kind of accidental GAP-field leak SF16 exists to catch) breaks the pin with a field-level diff naming it, restored.
- 6B-T2 -- **SF14 closed**: `verifyCompiles` (`src/lib/gap/enroll/service.ts`) gains an OPT-IN staleness check (`VerifyCompilesOptions.now` + `.maxCompileAgeMs`, both undefined by default -- a no-op even against `PASSING_COMPILES`, which the existing fixtures date ~39.5h before `NOW`) that refuses `compile_stale:<stepIndex>` for the newest per-step compile row past the limit. A new pure `checkEvidenceFreshness(signals, now)` (opt-in via `EnrollDeps.checkEvidenceFreshness`, default false) refuses `evidence_expired` when a cited signal's `freshness_expires_at` is already past, same IS-NULL-OR-future predicate `signals/registry.ts` already uses. Both wired into `enrollFromDecision`'s real gate chain (staleness at the existing compile-verification step; freshness right after the hypothesis and its linked signals load). `DEFAULT_MAX_COMPILE_AGE_MS` (24h) is exported for a future opt-in caller, explicitly documented as this session's threshold choice, not a product decision -- the deferral's stated reason ("a threshold nobody has specified") is resolved by making the mechanism real and the number visible/overridable, not by picking a policy no one asked for. 6 new tests; full existing 60-test enroll-service suite (and 108 across enroll-route/enroll-row) unaffected -- proves the default-off byte-identical guarantee concretely, not just by convention. Full `tests/unit/gap`: 102 files, 2356 tests, 0 failures. Mutation-tested: neutering `staleness()` and `checkEvidenceFreshness()` each independently breaks exactly their own new tests, restored.

- 6B-T3a -- the typed execution contract (`src/lib/gap/execution/contract.ts`): `ExecutionIntent`/`ExecutionReceipt`, engine union `modex_queue | hubspot_sequence | gmail_direct | gmail_draft | manual` (per the owner addendum, `gmail_draft` is distinct from `gmail_direct` -- a draft's `engineId` is the Gmail draft id, a later send is a SEPARATE receipt naming the draft via `supersedesEngineId`, drafted never equals sent), and the documented `EXECUTION_GATE_CHAIN` ordering (kill switch/flags -> suppression -> active opportunity -> compile verification -> sender vetting). Pure types plus one ordering constant; no I/O.

- 6B-T3b -- `src/lib/gap/execution/legacy-enroll-adapter.ts`: `legacyEnrollAdapter` runs the EXISTING `enrollFromDecision` unchanged and translates in (`toEnrollInput`) and out (`toExecutionReceipt`) of the 6B-T3a contract. **Honesty note, not a gap papered over:** `enrollFromDecision` resolves its OWN target (hubspot_native readback row vs modex_queue vs build_required) from the persona's Top100 data; it does not take an engine choice from the caller. This adapter does not pretend otherwise -- it refuses `engine_not_supported_by_legacy_adapter` up front for any `ExecutionIntent.engine` other than `modex_queue`/`hubspot_sequence` rather than silently reinterpreting the caller's intent, and never calls prisma in that case. Every other outcome is a pure translation of the real, unchanged service result (a `hubspot_native enroll_row` never carries an engine id, per R3-13; `modex_enrolled` carries the real draft item id). 7 tests, including one that runs the REAL `enrollFromDecision` end to end (not a mock) and gets back a real `gap_disabled` refusal translated correctly. Mutation-tested: disabling the engine guard breaks the "refuses without calling prisma" test, restored. Full `tests/unit/gap`: 104 files, 2365 tests, 0 failures.

- 6B-T4 -- scratch e2e `scripts/gap/e2e-6b.ts` -> `docs/gap/6b-e2e-latest.md`: PASS against a real database and the real `enrollFromDecision` through `legacyEnrollAdapter`, not mocks. Proves a plain shadow enroll succeeds despite a ~40h-old compile when SF14 is not opted into; the SAME compile refuses `compile_stale:0` once the caller opts into a 1-hour `maxCompileAgeMs`; and a hypothesis linked to a real `ProspectingSignal` whose `freshness_expires_at` is already past refuses `evidence_expired` once the caller opts into `checkEvidenceFreshness`. Zero leftovers (cleanup counts matched creation counts exactly).

**6B DONE** for this phase's scope: SF16 remainder closed (6B-T1), SF14 closed (6B-T2), the typed execution contract with `gmail_draft` modeled per the owner addendum (6B-T3a), the legacy path wrapped behind it honestly (6B-T3b), proven end to end on scratch (6B-T4). Sprint 6 (HubSpot-native SequencePublisher, live API writes) remains explicitly out of scope and owner-gated, per the living spec's own Sprint 6 entry. Full `tests/unit/gap`: 104 files, 2365 tests, 0 failures; `npx tsc --noEmit` clean throughout.

### 6C: HubSpot + Gmail execution adapters (in progress)
- 6C-T0 -- extended the EXISTING Gmail sender (`src/lib/email/gmail-sender.ts`, never a new mail client, per the owner addendum) with `createGmailDraft` (calls `drafts.create`, never `messages.send`; checks suppression fresh but deliberately NOT the autonomy kill switch or the daily cap, since a draft consumes neither budget and a human reviews before it goes anywhere) and `sendGmailDraft` (calls `drafts.send`; rechecks BOTH autonomy and suppression fresh, since a recipient can unsubscribe in the gap between drafting and sending -- unlike drafting, this is the real delivery). Both reuse the existing `getAccessToken`/`buildMimeMessage` internals, no duplicated MIME or OAuth logic. 4 new tests in `tests/unit/gmail-sender-sender.test.ts`; full email suite (7 files, 79 tests) green. Mutation-tested: adding an accidental autonomy check to `createGmailDraft` breaks the "never checks autonomy" assertion, restored.

- 6C-T1 -- `src/lib/gap/execution/gmail-adapter.ts`: `gmailDirectAdapter` (engine `gmail_direct`, sends immediately, translates a thrown refusal into a refused receipt rather than throwing), `gmailDraftAdapter` (engine `gmail_draft`, creates a draft only), `sendDraftedGmailAdapter` (sends a PRIOR draft receipt, the new receipt's `supersedesEngineId` names the draft, never collapsed into one event; refuses `supersedes_receipt_not_a_draft` up front for a receipt that was never a drafted draft, without touching the wire). Thread context (`References`/`In-Reply-To`/`Subject`) carried through for reply steps. Ships DARK: nothing in production calls these yet, per the addendum's time-box. 6 tests, all against a mocked `gmail-sender` (never real network). Mutation-tested: removing the not-a-draft guard breaks its dedicated test, restored.

- 6C-T2 -- `src/lib/gap/execution/hubspot-sequence-adapter.ts`, closing the HubSpot auth time box (owner addendum #3): the capability boundary was already established in a prior session (section 1.7 -- reads 200 with the private-app token; write scope documented user-level-app-only, never tested). This phase does not probe live writes (no owner go recorded), does not register a new OAuth app, and does not let that block 6C: the adapter is COMPLETE, behind `GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED` (stays off; proven with a fetchImpl spy that is NEVER called while the flag is off), and a live 403 is handled as `hubspot_write_scope_unavailable`, the documented boundary, not a generic failure. 5 tests against a fake fetch only. Mutation-tested: disabling the flag guard breaks the "never calls fetchImpl" test, restored.

**6C DONE** for this phase's scope: Gmail (`gmail_direct`/`gmail_draft`, 6C-T0/T1) and HubSpot sequence (6C-T2) adapters both complete, both dark, both tested with fakes only. Real live Sequence CRUD stays an owner-gated future step (the browser rig remains the operational publisher until then, per the addendum). Full `tests/unit/gap`: 106 files, 2376 tests, 0 failures; `npx tsc --noEmit` clean throughout.

### 6D: generic campaign reconciliation (in progress)
- 6D-T1 -- resolved the `enrollment_id` mutability question named in section 2: `conversation_dispositions.enrollment_id` now freezes the FIRST time it is set to a non-null value (hand SQL `prisma/sql/2026-09-24-gap-reconcile.sql` + rollback, new trigger `GAP_DISPOSITION_ENROLLMENT_FROZEN`), independent of `human_confirmed` -- attribution is a fact about which send produced a reply, decided once at reconciliation time, never a judgment call `human_confirmed` governs. A row born with it already set is frozen from birth too; writing the SAME value again is a no-op, not a refused change. `verify-triggers.ts` extended to 33 guards. Confirmed RED (reattribution accepted) before applying the SQL, GREEN (33/33) after.

- 6D-T2 -- `src/lib/gap/execution/reconciler.ts`: the generic, engine-agnostic reconciler generalizing `runEnrollmentSync`'s pattern. `reconcileOne` classifies one piece of `EngineEvidence` into the six exhaustive outcomes (MATCHED, ALREADY_IMPORTED, UNATTRIBUTED, IDENTITY_UNRESOLVED, HYPOTHESIS_MISSING, AMBIGUOUS), read-only toward both the engine and GAP's own tables -- recording a MATCHED result is a deliberate separate write step, never automatic here. More than one candidate enrollment for a contact never auto-picks one (UNATTRIBUTED, not a guess -- same "never silently merge" discipline as 6A). `reconcileBatch` isolates one dep failure per piece of evidence rather than aborting the batch. 10 tests. Mutation-tested: relaxing the exactly-one-enrollment check to zero-only breaks the ambiguous-enrollment test, restored. Full `tests/unit/gap`: 107 files, 2386 tests, 0 failures.

- 6D-T3 -- scratch e2e `scripts/gap/e2e-6d.ts` -> `docs/gap/6d-e2e-latest.md`: PASS against a real database, the real 6A resolver and real GAP tables. Proves MATCHED (an unnormalized raw account name resolves and finds the real hypothesis and the one real enrollment), HYPOTHESIS_MISSING (a real hypothesis-less account), IDENTITY_UNRESOLVED (an unknown name, never creates an Account), the 6D-T1 freeze trigger firing for real on a reattribution attempt after recording a MATCHED result, and ALREADY_IMPORTED on a second reconcile of the same evidence. Zero leftovers.

**6D DONE** for this phase's scope: the `enrollment_id` mutability question resolved (6D-T1), the generic engine-agnostic reconciler built and proven end to end (6D-T2/T3). The Inland26 dogfood (owner addendum item 4) follows in its own entry below. Full `tests/unit/gap`: 107 files, 2386 tests, 0 failures; `npx tsc --noEmit` clean throughout.

### 6E: reply/call truth loop (mostly pre-existing; one gap closed)
**Scoping note:** reply ingestion from Gmail AND HubSpot into one queue, deduped, already existed before this phase (`InboundMessage.source` 'gmail'|'hubspot', unified in `src/lib/gap/replies/list.ts` since Sprint 4). The AI-suggestion-stays-unconfirmed boundary and verbatim-quote-checked BIDs are likewise pre-existing (Sprint 4). Stop/DNC effects already correctly distinguish `modex_draft_queue` (live stop) from `hubspot_native` (`stop_pending`, since this codebase cannot live-unenroll HubSpot); the 6C engines (`gmail_direct`/`gmail_draft`/`hubspot_sequence`) create no real `SequenceEnrollment` rows in this phase (6C ships dark), so there is nothing yet for a stop effect to reach on those engines -- extending the stop-effect gate chain to them is deferred until a live caller of 6C's adapters exists, named here as debt rather than built against nothing.
- 6E-T1 -- the one genuinely new piece: the "unprocessed replies older than N hours" ops metric named in the ticket. `src/lib/gap/learning/reply-backlog.ts` (`computeReplyBacklog`, pure; `loadReplyBacklog`, prisma glue) joins `InboundMessage` against `ConversationDisposition` by the SAME `(source_kind IN ('inbound_message','hubspot_engagement'), source_id)` predicate `disposition/service.ts`'s own idempotency check already uses -- a row with a disposition never counts as backlog regardless of age, confirmed/unconfirmed both stop counting the moment a human OR the ingestion path resolves them (an AI-suggested-only row still counts, since it has NO EFFECTS until a human confirms it). Wired into `buildLearningReport` as `LearningReport.replyBacklog` (new optional `LearningFilters.now`, default `new Date()`; every existing caller unaffected). 7 tests (6 in `reply-backlog.test.ts`, 1 wiring test in `learning-query.test.ts`). Mutation-tested: dropping the disposition exclusion breaks the "handled rows never count" test, restored. Full `tests/unit/gap`: 108 files, 2393 tests, 0 failures.

### 6F: operational learning
- 6F-T1 -- extended `buildLearningReport` (`src/lib/gap/learning/query.ts`, `metrics.ts`) with `byEngine` (conversations broken down by the REAL enrollment engine -- hubspot_native/modex_draft_queue/manual -- never a caller-supplied label, same pattern as the existing `byChannel`/`bySender`) and `staleHypotheses` (a `Rate`: open hypotheses older than `DEFAULT_STALE_HYPOTHESIS_DAYS` (14, a session-chosen default matching SF14's own precedent -- override via `filters.staleThresholdDays`) among all open hypotheses; a terminal hypothesis is never stale regardless of age). Both additive (new optional `LearningFilters.staleThresholdDays`; every existing caller unaffected) and both carry `{value, n, numerator, denominator}` via the existing `rate()` helper, per the ticket's own convention. Reply backlog (6E-T1), B9 (internal/test exclusion) and R-A (program/date filters) are untouched. 5 new tests. Mutation-tested: letting a terminal hypothesis count as stale breaks its dedicated test, restored. Full `tests/unit/gap`: 110 files, 2423 tests, 0 failures.

**Deferred, named as debt, not built against nothing:** time-to-disposition and routing-agreement-by-rule-over-time (the ticket's other two named metrics). Both are real, valuable extensions of the same `buildLearningReport` surface, but given this session's remaining scope this phase prioritized closing 6A-6E's concrete gaps and Sprint 7's shadow control plane over further learning-report breadth; the `rate()`/breakdown machinery this ticket extended is exactly what either would build on next.

**6A scoping note, recorded for auditability:** the "reply address matcher" wiring named in the original ticket text was deliberately left out. `src/lib/gap/replies/list.ts` resolves inbound replies to a PERSONA by exact email match (already anchored to a real enrollment/persona row, SF8's dedup-by-lowest-id already governs collisions), a different identity axis than company-name-to-account. Folding a company-name resolver into it would be a premature abstraction with no concrete caller today; the acceptance case named in the runtime handoff (Pounce triggers vs `accounts.name`) is fully covered by 6A-T4.

**Concurrent-session note (2026-09-24):** 6E and 6F were executed by a second live session (`casey-06`) sharing this worktree at the same time as this one -- a real one-writer-per-worktree violation this session flagged (message sent, held for the owner's approval) rather than silently working around. To avoid collision, this session withdrew its own independent, uncommitted 6E backlog module (`src/lib/gap/replies/backlog.ts`, never referenced elsewhere, cleanly removed) in favor of `casey-06`'s already-committed `src/lib/gap/learning/reply-backlog.ts`, and scoped its own remaining work (Sprint 7 below) to files neither session's other work touches.

### Sprint 7: shadow automation control plane (in progress)
- 7-T1 -- `src/lib/gap/automation/canary.ts`: `CanaryConfig` (allowlist, per-rule cap, daily cap, startedAt, matching spec section 10's `SystemConfig` key `gap_auto_enroll_canary`) and pure `checkCanaryCaps`, fully decoupled from any prisma query (the `SystemConfig` read/write is left to the caller) so this ticket touches no file the concurrent 6E/6F session owns. Fails closed on every ambiguous case: an empty allowlist refuses everything rather than defaulting to allowed; any cap of 0 refuses everything for that dimension. 8 tests. Mutation-tested: letting an empty allowlist fall through to "allowed" breaks the dedicated empty-allowlist test, restored.
- 7-T2 -- `src/lib/gap/automation/gates.ts`: the G0-G6 earned-gate evaluator (spec section 10's exact thresholds: G1 n>=200/4wk/80% agreement, G2 zero violations in a 100+ sample, G3 zero unknown suppression verdicts in 7d and zero DNC violations ever, G4 n>=100/90% agreement, G5 n>=50/20% resolution, G6 allowlist 1-10/daily cap<=5/2wk/zero incidents/a logged drill). Pure over caller-supplied numbers -- no prisma call of its own, so a gate check can never silently drift from whatever report computes each number, and this ticket stays fully decoupled from `learning/**`. G0 (the owner's own halt reversal) can only ever be reported, never satisfied or changed by this module -- it reads a boolean the caller supplies from the real halt state; nothing here touches the halt. 20 tests covering every threshold's boundary. Mutation-tested: hardcoding G0's pass to true breaks its dedicated test, restored.
- 7-T3 -- `src/lib/gap/automation/shadow.ts`: `recordShadowDecision`, the audit log of every would-be action. Reuses the existing append-only `gap_audit_events` ledger and the `enroll.shadow` `GapAuditKind` (already in the union; no new table, no new migration). `acted_by_system_at` is written explicitly `null` every time, from a hardcoded literal never derived from the caller's input -- `ShadowDecisionInput` has no such field at all, so a caller cannot smuggle a non-null value through even by accident. Flag off (`GAP_AUTO_ENROLL_SHADOW`, default off): zero calls to `audit`, proven with a spy. 3 tests. Mutation-tested: disabling the flag guard breaks the "never calls audit" test, restored.
- 7-T4 -- `scripts/gap/kill-switch-drill.ts` -> `docs/gap/kill-switch-drill-latest.md`: PASS. NEVER touches the real clawd autonomy halt (never reads or reverses it); proves the MECHANISM against real scratch-DB fixtures with an injected fake `autonomy` reader through `EnrollDeps.autonomy`, the same override point the real cron already supports. Not halted: the autonomy step itself does not refuse (a later, unrelated guard -- `compiler_disabled` in this run -- is fine and expected). Halted, same fixtures, same call: refuses `autonomy_halted` immediately, proving the guard reads fresh on every call with no caching or stale window ("within one poll cycle"). Logs the drill as a new `automation.kill_switch_drill` `GapAuditKind` row, satisfying G6's "one logged kill-switch drill". Zero leftovers.

**Sprint 7 DONE** for this phase's scope: canary caps (7-T1), the G0-G6 gate evaluator (7-T2), the shadow audit log (7-T3), the kill-switch drill (7-T4) -- all deliberately decoupled from `src/lib/gap/learning/**` and `src/lib/gap/replies/**`, which the concurrent `casey-06` session owned for 6E/6F. `GAP_AUTO_ENROLL_ENABLED`'s live path already refuses a non-human actor without the flag (pre-existing, S3-T12); nothing in this phase turns it or `GAP_AUTO_ENROLL_SHADOW` on anywhere, and no gate reports as earned without real data no session has yet. Full `tests/unit/gap` and `npx tsc --noEmit` clean throughout (this session's own files; the concurrent session's files are its own responsibility to keep green, confirmed clean at last check).

**Regression re-run on the merged HEAD (2026-09-24, after both sessions' commits):** all five Sprint 1-5 e2es plus `e2e-finish-rc.ts` re-run against the scratch database, all PASS (`docs/gap/sprint{1..5}-e2e-latest.md`, `docs/gap/finish-rc-e2e-latest.md`), zero leftovers each. `verify-triggers.ts` PASS on the same scratch DB (33/33, including 6A's and 6D's new guards).

**Inland26 dogfood (owner addendum item 4):** `docs/gap/inland26-runtime-reconcile-dry-run.md`. Read-only, live HubSpot evidence (six `SENT` email engagements logged this afternoon across Tyson Foods and Walmart, discovered because the field-pilot doc's own documented workaround -- paste the prepared copy into Gmail/HubSpot by hand -- was used since that doc's this-morning snapshot). The generic reconciler's logic, applied against the account-identity facts the field-pilot doc already verified, classifies Tyson AMBIGUOUS (two near-duplicate Account rows) and Walmart IDENTITY_UNRESOLVED (no canonical parent Account row at all) -- it refuses to guess rather than fabricate a MATCHED result, exactly the same identity collision 6A-T4 already resolves for Pounce triggers. No hypothesis fabricated, no write anywhere. Explicitly scoped: this session has no safe production database read path configured, so the GAP-side facts are cited from the already-dated field-pilot doc, not freshly re-queried against production.

### GAP RUNTIME RELEASE CANDIDATE (2026-09-24/25)
<!-- verified:2026-09-25 -->
Branch `feat/gap-os-runtime`, cut from `origin/main` at `d9a94dc2` (production). Two sessions wrote to this branch, sequentially, never concurrently on the same file (a live collision was detected and handled by coordination, not by overwrite -- see the concurrent-session note above): `wt-gap-os-runtime-33` shipped 6A, 6B, 6C, 6D and Sprint 7; `casey-06` shipped 6E and 6F. `wt-gap-os-runtime-33` finalized the branch: single-writer safety re-confirmed (`casey-06` idle, local HEAD matched origin exactly before any further write), the final integrated e2e built and proven, the full regression suite re-run once on the final HEAD, the production delta package prepared below, and this PR opened.

**RUNTIME**
- 6A canonical identity: DONE. Resolver + `gap_account_aliases`, wired into the hypothesize cron and an optional routing fallback. Scratch e2e: `docs/gap/6a-e2e-latest.md`.
- 6B multi-engine execution contract: DONE. SF16 remainder closed (gap-noninterference pin), SF14 closed (compile staleness + evidence freshness, both opt-in), the typed contract (`gmail_draft` modeled distinct from `gmail_direct`), the legacy path wrapped honestly. Scratch e2e: `docs/gap/6b-e2e-latest.md`.
- 6C Gmail + HubSpot adapters: DONE, ships DARK. HubSpot auth capability boundary recorded, not re-probed; no new OAuth app. Unit-tested against fakes only.
- 6D generic reconciliation: DONE. Six-outcome reconciler, `conversation_dispositions.enrollment_id` freeze-once-set trigger. Scratch e2e: `docs/gap/6d-e2e-latest.md`.
- 6E reply/call truth loop: DONE (`casey-06`). The loop was mostly pre-existing (Sprint 4); the one new piece is the reply-backlog metric (`src/lib/gap/learning/reply-backlog.ts`), wired into the learning report.
- 6F operational learning: DONE (`casey-06`). Per-engine and per-sender funnels, stale-hypothesis rate, both wired into `buildLearningReport`.
- Sprint 7 shadow control plane: DONE. Canary caps (fail closed), the G0-G6 earned-gate evaluator (pure over caller-supplied numbers), the shadow decision audit log (`acted_by_system_at` always null), the kill-switch drill (never touches the real halt).

**INTEGRATION**
- Runtime e2e: `scripts/gap/e2e-runtime.ts` -> `docs/gap/runtime-e2e-latest.md`, PASS. Proves the full chain in one run against a real scratch database, every real function called directly (never mocked): messy company identity -> 6A resolution (company-id/domain precedence with an auditable conflict; ambiguous accounts refuse rather than merge; a messy Pounce-trigger name resolves through the real hypothesize job and is cached as an alias) -> signal -> hypothesis -> routing -> `ExecutionIntent` -> the full 6B gate chain (active opportunity wins, suppression wins, SF14 `compile_stale` and `evidence_expired` both refuse) -> a fake-transport adapter receipt (HubSpot: zero network with the flag off, a real receipt through a fake fetch with it on; Gmail: `gmail_draft` distinct from `gmail_direct`, `supersedesEngineId` names the draft, ids never confused) -> 6D reconciliation (MATCHED, then ALREADY_IMPORTED, then IDENTITY_UNRESOLVED, never fabricating an Account) -> inbound reply -> an unconfirmed AI suggestion with no effects -> human confirmation turns it into BuyerInputData and resolves the hypothesis (an agent cannot overwrite a confirmed BID) -> a DNC disposition stops its own enrollment -> learning (B9 exclusion, byEngine/bySender, R-A program/date filtering, every rate carries n) -> R-B routing-vs-human agreement -> Sprint 7 (canary, gates honestly reporting NOT earned over this run's real tiny numbers, a shadow decision, the kill-switch drill) -> zero real outbound action. Confirmed deterministic across two consecutive runs; zero leftovers each time.
- Inland26 read-only reconciliation: DONE (owner addendum item 4). `docs/gap/inland26-runtime-reconcile-dry-run.md`. Live HubSpot evidence found Casey's own documented manual-send workaround was used since the field-pilot doc's snapshot (six SENT emails, Tyson Foods and Walmart). The reconciler's logic classifies Tyson AMBIGUOUS and Walmart IDENTITY_UNRESOLVED against the field-pilot doc's already-verified account-identity facts, refusing to fabricate a match. No hypothesis fabricated, no write anywhere, no production database queried.
- Authenticated production UI check: DONE. Casey verified `/gap/`, `/gap/hypotheses/` and `/gap/learning/` all render under a signed-in production session, data-empty as expected.

**REGRESSION** (re-run once, in sequence, on the final merged HEAD, against the scratch database, then the container destroyed)
- Trigger verification: `verify-triggers.ts` 33/33 PASS.
- GAP unit tests: `tests/unit/gap`, 111 files, 2426 tests, 0 failures.
- Sprint 1-5 e2es + `e2e-finish-rc.ts`: all PASS, zero leftovers each.
- `npx tsc --noEmit`: clean.
- Full repo `npx vitest run`: 4406 passed, 1 pre-existing skip, 3 files (`gmail-thread-exists.test.ts`, `hubspot-client.test.ts`, `yard-audit-fov-nondestructive.test.ts`) timed out under full parallel load and passed cleanly in isolation -- the same pre-existing flake pattern the finish-rc session already documented; none is GAP code, none was touched by this phase.

**PRODUCTION DELTA PACKAGE** (prepared for the owner's preflight; nothing here was applied)
- Schema (`git diff d9a94dc2 HEAD -- prisma/schema.prisma`): exactly one new model, `GapAccountAlias` (`@@map("gap_account_aliases")`), plus its back-relation on `Account`. No column added to, removed from, or changed on any existing table. Columns: `id` (cuid PK), `alias` (String), `normalized_alias` (String), `account_name` (String, FK to `accounts.name`), `source` (String), `created_by` (String), `created_at` (DateTime, default now). One new index (`@@unique([normalized_alias])`, which also serves as the lookup index) plus `@@index([account_name])`. One new FK (`gap_account_aliases.account_name` -> `accounts.name`).
- Hand SQL, two new dated files plus their rollbacks, both idempotent (`CREATE OR REPLACE` / `DROP ... IF EXISTS`):
  - `prisma/sql/2026-09-24-gap-identity.sql` (+ `-rollback.sql`): one CHECK constraint, `gap_ck_gap_account_aliases_source`, restricting `gap_account_aliases.source` to `('hypothesize_cron','manual')`. Depends on `gap_add_check()`, already live in production from PR #250.
  - `prisma/sql/2026-09-24-gap-reconcile.sql` (+ `-rollback.sql`): one new trigger function `gap_disposition_enrollment_freeze()` and trigger `gap_disposition_enrollment_freeze` (BEFORE UPDATE ON `conversation_dispositions`), freezing `enrollment_id` the first time it is set to non-null. No new table, no column change; the column already exists in production.
- No change to `prisma/sql/2026-09-23-gap-os.sql` (the file already live in production).
- Flags: `src/lib/gap/flags.ts` is byte-identical to production. **Zero new `GAP_*` flags.** Every flag this phase's new code reads (`GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED`, `GAP_AUTO_ENROLL_ENABLED`, `GAP_AUTO_ENROLL_SHADOW`) already existed in production, already defaulting off, and this phase does not flip any of them anywhere.
- Crons: zero. No change to `vercel.json`, no new `src/app/api/cron/*` route.
- Classification: **EXPECTED ADDITIVE.** One new table, two new hand-SQL guard objects (a CHECK and a trigger/function pair), zero modification to any existing table, column, index or constraint. No `prisma db push` was run against production; no hand SQL was executed against production. A live, read-only `prisma migrate diff --from-url <prod-url> --to-schema-datamodel prisma/schema.prisma --script` preflight against the actual production database was NOT run by this session (the connected Vercel MCP returns 404 Not Found on this project, the same connector/permission-scope issue the Inland26 field-pilot doc already recorded) -- the classification above is derived from the git diff, which is complete and reliable, but the owner's own live preflight (already named as a required action below) is the gate before any apply, not this note.

**SAFETY**
- Production database changed: NO.
- Real HubSpot write: NO.
- Gmail prospect send: NO.
- Real enrollment: NO.
- `GAP_AUTO_ENROLL_ENABLED`: OFF (never flipped anywhere in this phase).
- Clawd autonomy halt (2026-08-19): INTACT (never read, never reversed; the kill-switch drill uses an injected fake reader, not the real one).
- `OUTREACH_PAUSED`: untouched.

**PRODUCTION SCHEMA ROLLOUT (2026-09-24, release owner session)**
- Final review of PR #251 at `6a90dbb1`: 0 BLOCKER. SHOULD FIX (non-blocking, dark or advisory): `registerAlias` returns `created:false` without signalling when the normalized key already maps to a DIFFERENT account (no overwrite, so no identity corruption); the Gmail adapters do not consult `intent.mode` (no caller exists; nothing reaches them in production). DEFER: `replyBacklog` counts every `inbound_messages` row in a 90-day window, unscoped by the learning program/date filter; GitHub Actions CI jobs never start (account billing lock, same on `main`), so the Vercel build remains the merge gate.
- Preflight, read-only `prisma migrate diff --from-url <prod> --to-schema-datamodel prisma/schema.prisma --script` (Prisma 6.19.2) against the Railway production database (Vercel Production `DATABASE_URL`, hash-matched): exactly `CREATE TABLE gap_account_aliases` + PK + unique `normalized_alias` + index `account_name` + FK `account_name -> accounts.name`. Zero statements against existing tables, zero destructive statements. Prod read-only state before apply: `gap_add_check()` present, `gap_disposition_enrollment_freeze()` absent, `conversation_dispositions` 0 rows.
- Maintenance window: `GAP_OS_ENABLED=false` in Vercel Production, redeployed `d9a94dc2` (`dpl_CK2PguBRcv8rS39RhVzucdD6b8YJ`, READY). No other flag, `OUTREACH_PAUSED` (true) or the clawd autonomy halt touched.
- Applied: `prisma db push --skip-generate` (no accept-data-loss; "in sync" in 5.75s), then `2026-09-24-gap-identity.sql`, then `2026-09-24-gap-reconcile.sql`, both "executed successfully".
- Verified: `verify-triggers.ts` against production 33/33 PASS (transaction rolled back); `gap_account_aliases` has PK, FK, `gap_ck_gap_account_aliases_source`, unique `normalized_alias` and the `account_name` index; `conversation_dispositions` carries `gap_disposition_guard` + `gap_disposition_enrollment_freeze`; alias and disposition rows 0; post-apply `prisma migrate diff` prod vs schema: empty.
- Merged: PR #251, normal merge commit `76ad87f7` (30 branch commits preserved, branch kept). Production deploy `dpl_3B7Hch9eSKmPRVABfPNMM3qu7NHU` READY with `GAP_OS_ENABLED=false`; `/login`, `/demo/*` (direct and via yardflow.ai) 200, `/` and `/gap/` redirect to login, `/api/*` 401 unauthenticated. `email_logs` since the window opened: 0; `sequence_enrollments`, `gap_hubspot_mirror`: 0; `gap_audit_events` written: 0.
- GAP core restored: `GAP_OS_ENABLED=true`, redeployed `76ad87f7` as `dpl_9sKuCnuS3GnXc1QQ31oggiGo8N9i` (READY). Core subflags unchanged (hypothesis, routing, compiler, reply classification ON); `GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED`, `GAP_HUBSPOT_MIRROR_ENABLED`, `GAP_AUTO_ENROLL_ENABLED`, `GAP_AUTO_ENROLL_SHADOW` all false; no GAP cron registered; `OUTREACH_PAUSED` unchanged (true); clawd autonomy halt untouched.
- Production runtime smoke (one READ ONLY transaction): every GAP table readable (all 0 rows incl. `gap_account_aliases`); identity context loads (1707 accounts, 0 HubSpot company ids, 0 verified canonical domains, 0 aliases -- tiers A/B are empty in production today, so resolution currently runs on tiers C/D only); resolver returns normalized/100 for an exact account and `unresolved_company` for an unknown; `buildLearningReport` OK (0/0, staleHypotheses n=0); reply backlog OK (160, see the DEFER note: all inbound mail, not only GAP replies); routing agreement OK (n=0); `recordShadowDecision` refuses `gap_auto_enroll_shadow_disabled`. Installed, not unleashed. Next: dogfood + shadow data collection.
<!-- verified:2026-09-24 -->

### GAP OS FINAL PASS: seller loop + deliverability (2026-09-25)
<!-- verified:2026-09-25 -->
Branch `feat/gap-os-final`. Closes the gap between "GAP produced a recommendation" and "Casey can safely execute it and GAP records what happened". Dangerous automation stays off.

- **Suppression provenance** (`src/lib/gap/suppression/provenance.ts`): hard_compliance / hard_invalid_address / soft_deliverability / unknown_provenance / service_unreadable. R0 blocks only hard compliance; new R0c `suppression_review` (unknown -> research, never outreach); soft and invalid route on phone/LinkedIn with a warning and never to an email action. The routing reader now records every positive contract `key` (a soft primary reason used to hide an opt-out), and `unsubscribed_emails` is read as a hard leg. `assertSuppressionPermitsSend` unchanged: routing permission is not send permission. Audit: `docs/gap/suppression-audit-2026-09-25.md` (386 DNC: 2 hard compliance, 8 hard invalid, 96 soft, 280 unknown). 10 individually proven false historical suppressions corrected (reversible script, receipts); 5 Frito-Lay contacts escalated to Casey (vanished April unsubscribe rows).
- **Deliverability** (`docs/gap/deliverability-health-2026-09-25.md`): SPF and DMARC (p=none) on both domains; freightroll.com publishes no Google Workspace DKIM key; Gmail-lane hard bounces 0.80% (30 days); not a bulk sender; spam rate not measurable (no Postmaster access).
- **Seller Action Center**: `cardReadiness()` makes every card blocked, actionable, or a named missing prerequisite with a fix link (invariant test over 1,000+ combinations). Action pack links carry `personaId` and `decisionId`; `action-pack.ts` is the single loader for page and draft service. HubSpot buttons now default to portal 3819073 (production never set the env var).
- **Gmail draft**: `POST /api/gap/decisions/[id]/gmail-draft` (session only) re-reads decision, hypothesis, persona and copy, requires compiler clearance of exactly this copy (an uncompiled copy is compiled on the click; REVIEW opens an approval without drafting), and calls the existing `gmailDraftAdapter` (drafts.create, suppression wire gate inside). Never sends; never writes `human_action`.
- **Ledger**: no new table. GapAuditEvent kinds `execution.gmail_drafted` / `_draft_sent` / `_draft_discarded` / `_draft_refused` on subject `routing_decision:<id>`.
- **Reconciliation**: "Check if sent" (`.../gmail-draft/reconcile`) reads drafts.get + threads.get; a SENT message to the recipient in the draft's thread after drafting is recorded with its own message id and the draft id as `supersedesEngineId`.
- **Copy**: C01 rejects a subject specific (digit, count word, mid-subject proper noun) the body never states ("Doors versus spots at Fontana" would have reached Kroger); seed subjects fixed; lowercase stored names capitalised in greetings. COMPILER_VERSION `gap-compiler.2026-09-25.1`.
- **Contact completeness**: 21 routed personas backfilled (title / LinkedIn) from HubSpot READ data, email-matched, updated_at untouched (no HubSpot push).
- Production critic is unconfigured (no `CLAWD_BASE_URL` / `MC_API_TOKEN` in Vercel), so every compile is `review_required` until Casey approves it in /queue. That is by design (a critic failure never passes); wiring the critic is an owner decision.

### GAP OS CLOSEOUT (2026-09-25)
<!-- verified:2026-09-25 -->
- Action pack production crash fixed at the root: the server page called `asStringList`, exported from the `'use client'` hypothesis drawer (a client reference under RSC). Pure helpers now live in `lib/gap/ui/format.ts`; `server-client-boundary.test.ts` guards the pattern.
- Critic live: `makeCriticClient` falls back to `CLAWD_CONTROL_PLANE_URL` / `CLAWD_CONTROL_PLANE_TOKEN` (verified same host and credential as `MC_API_TOKEN`; `/api/critic/score` answers 200 with them).
- GAP drafts come from casey@yardflow.ai through the yardflow.ai domain-wide delegation service account (`GAP_GMAIL_USER_EMAIL`, `GAP_GOOGLE_DWD_SA_JSON`, GAP-only); draft creation, MIME From, reconciliation and the UI share one identity.
- R12b `evidence_thin`: a live hypothesis resting only on unquoted keyword triggers routes to research with the missing fact named. Joey Maggard (Kroger) is research until a sourced DC/dock/yard/site fact is linked.
- Approve-this-copy on the action pack; superseded email cards cannot draft. Frito-Lay owner decision applied (Watson, Mars cleared; Fanslow, Chambers refused as confirmed invalid).

### GAP OS LAST MILE (2026-09-25)
<!-- verified:2026-09-25 -->
- RESEARCH THIS (`lib/gap/research/*`, `POST /api/gap/research`, `POST /api/gap/research/[runId]/propose`): EDGAR (primary) and Gemini grounded search (secondary) propose candidates; each is re-fetched and kept only if the excerpt is verbatim at its source, dated, a physical-operations or definitive-acquisition fact, not a financial-statement mention. Stored in ResearchRun, EvidenceRecord and ProspectingSignal (no new store). Outcome: evidence_found / insufficient_evidence / conflicting_evidence. Proposing creates a DRAFT only.
- Multi-touch loop (`lib/gap/execution/next-touch.ts`): after a Gmail-proven send, the next step's due time from the pinned version's delays; stop on reply (sent thread in the sending mailbox, InboundMessage, dispositions), unsubscribe, DNC, invalid address, meeting booked; unreadable = unknown. Follow-ups thread from reconciled truth only.
- Passive reconciliation: the check-inbox cron reconciles up to 25 unresolved GAP drafts per run (read-only toward Gmail, idempotent).
- Signature: Gmail does not add the send-as signature to API-created drafts (verified); drafts use the sender's real signature (read-only settings read) in place of the template sign-off.
- Scheduling evaluated: passive reconciliation runs on the existing inbox cron; due follow-ups are computed on read (no cron needed); hypothesis proposal from new signals stays manual (the existing hypothesize cron remains unregistered). Nothing scheduled can send, enroll, approve or activate.

### GAP GROUP REVIEW + EVIDENCE DEPTH (2026-09-25)
<!-- verified:2026-09-25 -->
- Account thesis groups (`lib/gap/hypothesis/siblings.ts`, `thesis-groups.ts`): derived, no schema. Fingerprint = sha256 over account, family, observation, hypothesis, sorted root causes / impacts / falsification questions, what-a-no-means and the linked signal set; persona excluded. Account + family alone never groups; a person-specific note splits that row out. Review order: pending groups, corroborated before thinner, most people unlocked, then one-offs.
- `/gap/hypotheses` "Account theses" cards and `GET|POST /api/gap/theses` (`op` approve / corroborate / attach). APPROVE SELECTED SIBLINGS runs submit/approve per checked row through `transitionHypothesis`, each audited with the group reason and the operator; per-row results; ids outside the group 409. Never activates, enrolls, drafts or sends.
- Evidence depth (`lib/gap/research/depth.ts`): independent origins, not links. SEC accession, host+path, and the same excerpt across URLs each count once; an unquoted keyword trigger counts as none; operator knowledge is its own origin. INSUFFICIENT / SINGLE-SOURCE / CORROBORATED / WELL-SUPPORTED. Shown beside confidence, never converted into it. Single-source stays approvable.
- FIND CORROBORATING EVIDENCE reuses RESEARCH THIS once per thesis (run context `thesisFingerprint`, reused 24h): corroborated / no_second_source / contradicts. Attaching found facts is a separate click; frozen siblings are reported, not changed.
- Notes scoped "this hypothesis only / shared thesis siblings" (`POST /api/gap/hypotheses/[id]/sibling-note`): linked to editable siblings, recorded (audit `hypothesis.sibling_note`, shown on the card) against frozen ones, never overwriting.
- Manual sends (`lib/gap/execution/manual-send.ts`, `scripts/gap/record-manual-send.ts`): a hand-sent email is matched to exactly one Gmail sent message (or candidates are returned) and recorded as `execution.gmail_manual_sent` (engine manual, no draft row). human_action = emailed only from the owner's explicit statement. Next touch anchors on the real sent time. First use: Joey Maggard (Kroger), sent 2026-09-25T20:59:19Z, touch 2 due 2026-10-01.

### GAP FIRST-PRINCIPLES PASS: seller cockpit + direct human send (2026-09-25)
<!-- verified:2026-09-25 -->
- Operator journey audit and what was deleted, hidden or kept under the hood: `docs/gap/operator-simplification-2026-09-25.md`.
- /gap = REVIEW / RESEARCH / READY / FOLLOW UP / REPLIES (`sellerLaneOf` in `routing/card-readiness.ts` counts the tiles and filters the queue, `?lane=`). Technical filters and the In flight / Enroll rows tabs stay as details.
- APPROVE + USE (`advanceHypothesis` in `hypothesis/thesis-groups.ts`): submit, approve, activate in order via the machine, each audited; APPROVE ONLY stays. Group approve takes `use` and moves only checked rows; the card keeps a success state and offers ROUTE THESE N. Routing now routes the primary person of every approved/active hypothesis beside the top 2 by seniority (cap 10).
- SEND FROM YARDFLOW (`execution/seller-send.ts`, `POST /api/gap/decisions/[id]/send`, session only): preview, then CONFIRM + SEND bound to the confirmed content hash and recipient. `prepareSellerEmail` (shared with CREATE GMAIL DRAFT) re-runs every gate at the click plus active opportunity. Advisory-locked claim before the Gmail call; ALREADY SENT without a Gmail call; a lost answer stays unresolved and is never resent. Ledger kinds `execution.gmail_direct_{claimed,sent,released,refused}`; EmailLog row for the daily cap; human_action = emailed from the confirmed send; the multi-touch loop anchors on it. Drafts still never record a human action.
- Send purpose HUMAN_APPROVED_1TO1 (`email/autonomy-gate.ts`): passes clawd's `outreach` motion halt only; global halt and unreadable state still refuse; suppression and the daily cap unchanged; the wire requires a fresh confirmation of exactly one recipient, no cc/bcc; only seller-send.ts may declare it (source-scan test). The halt itself is unchanged.
- CRM logging: `crmLogMethod` on the receipt; casey@yardflow.ai is a connected HubSpot inbox and the portal logs all email with known contacts, proven with one internal send (`docs/gap/crm-logging-2026-09-25.md`). No BCC, no HubSpot engagement writes. Config `GAP_CRM_LOG_METHOD=connected_inbox`.
- Copy approval: a compiler PASS goes straight to the send confirmation; REVIEW is approved inline on the action pack; REJECT cannot send. No detour to /queue.

### GAP DEBT BURN: current-decision queue, targeted routing (2026-09-26)
<!-- verified:2026-09-26 -->
- The queue (`routing/queue.ts` `currentDecisions`) is each routing subject's newest decision from ANY run whose thesis still stands. Routing subject = one person at one account, `(account_name, persona_id)`; not the hypothesis, so a re-routed person replaces their older card. Only finished runs count: `runRouting` awaits its `routing.run` audit row as the completion marker, so a run the platform kills part way (2026-09-25 13:53, 68 rows) never becomes anyone's card. A card whose hypothesis ended (terminal status) or was deleted is not current and never falls back to an older card. Readiness reads the LIVE thesis status: only `active` makes a contact card READY; approved-only (or sent back to draft) is REVIEW. There is no run pointer: `gap_routing_last_run` and `resolveLatestRunId` are gone; `?runId=` still pages one run (diagnostics). Enroll rows read the same view.
- APPROVE + USE routes exactly the people put in use, at their own accounts (`routeAfterUse` -> `runRouting({ accountNames, personaIds })` -> assembler `onlyPersonaIds`). No other account is rerouted; the 25-account `routable_hypotheses` cap applies only to the diagnostic Run routing button.
- `runRouting` reads 3 accounts and 4 people at once (the person bound also caps concurrent Clawd reads; the Clawd read overlaps each person's DB reads), commits rows in account order (same report and pair budget as a sequential run), and reports a failed account (fault or 120s timeout) in `report.failed` without aborting the others; a failed account's earlier cards stay current. UseOutcome and the Run routing panel show failed people/accounts with the reason.
- Research that finds evidence proposes the draft on its own and shows the full narrative inline (facts, hypothesis, root causes, impacts, would prove wrong, evidence); Casey decides once: `POST /api/gap/research/[runId]/decide` `approve_and_use` (audited submit/approve/activate, then targeted routing) or `reject` (withdraw). Only drafts that run proposed are accepted.
- A terminal send refusal (REJECT, do not contact, superseded, first touch sent, outcome unknown) removes SEND at once and refreshes the pack. The gmail-draft `checkOnly` mode is deleted. `shouldNag` lives in `src/lib/intel/refresh-nag.ts` (local `next build` passes).
- Benchmark and dogfood evidence: `docs/gap/debt-burn-2026-09-26.md`.

### GAP WEEKEND REDUCTION: one cockpit, route on use (2026-09-26)
<!-- verified:2026-09-26 -->
- Walkthrough, click budget before/after, surface table and remaining debt: `docs/gap/weekend-reduction-2026-09-26.md`. This supersedes the "ROUTE THESE N", "In flight / Enroll rows stay as details" and "/queue detour" notes in the entry below.
- APPROVE + USE routes on its own (`routing/interactive.ts` `routeAfterUse`) and returns where each approved person landed; a failure is returned inline. (Scope superseded by the debt burn entry above: targeted to the approved people, not the routable scope.)
- The thesis approve op takes `signalIds`: USE THIS EVIDENCE + APPROVE + USE links the facts Casey ticked to the selected editable rows first; a refused link stops that row. Contradicting evidence disables approval.
- /gap renders every lane in place: `?lane=review` (thesis cards + one-off list), `research` (grouped by account + rule + hypothesis; group research proposes one draft per person via `proposeFromResearch({personaIds})`), `ready` / `follow_up` (`&open=<decisionId>` renders `<ActionPackView>` inline; the same component serves `/gap/preview/*`), `replies` (`<RepliesTriage inCockpit>`). No lane: NEXT UP.
- Copy check is invisible on PASS: SEND EMAIL shows before any compile; the send route compiles on the click. CHECK COPY is gone from the draft panel.
- `sellerLaneOf` sends an R3 reply_pending card (lane `reply_triage`) to later, never READY.

### GAP FINAL MONDAY BLOCKER: HubSpot opportunity truth, one revision, one primary fact (2026-09-27)
<!-- verified:2026-09-27 -->
- BLOCKER, live: the active-opportunity guard (routing R3b and the draft/send/enroll gates) read `accounts.pipeline_stage`, modex's own outreach progression (production: 1660 targeted, 27 contacted, 21 engaged, zero meeting). Every account read "no opportunity" while HubSpot held 16 open deals (Kroger, GXO, Ford, GM, Mondelez ...).
- `src/lib/gap/opportunity/active-opportunity.ts` is now the ONE resolver: CLEAR / ACTIVE / UNKNOWN. Company identity is a deterministic union (`hubspot_company_id`; HubSpot companies on the verified canonical domain or the people's email domains, consumer mail excluded; HubSpot's exact-name duplicates of those, the Lazerspot pair). Deals from those companies plus the people's HubSpot contacts; open/closed is `hs_is_closed`, never a stage list. Any read failure, timeout, malformed deal, stale or undeterminable company is UNKNOWN.
- Routing: ACTIVE holds at R3b (nurture, LATER, "Work it from the deal"); UNKNOWN holds at new R3c `opportunity_unknown` (RESEARCH: "Can't verify whether this account already has an active opportunity. Check HubSpot before contacting them."). Action time: draft, direct send and enroll re-read HubSpot at the click (`checkActiveOpportunityNow`); ACTIVE refuses `active_opportunity`, UNKNOWN refuses `opportunity_unknown`.
- Read-only probe: `npx tsx scripts/gap/opportunity-probe.ts "<account>" ...`. Scratch E2Es inject `scripts/gap/scratch-opportunity.ts` (no HubSpot behind fixture accounts).
- P1: `hypothesis/current-revision.ts`. The research route answers `existing_revision` before any run, `proposeFromResearch` answers `revision_exists`, `use_evidence` reuses an open revision, and the queue marks a superseded card thesis `revisedBy` ("Review the revised thesis", REVIEW). One revision per frozen thesis; history untouched.
- P1: exactly ONE primary outreach fact opens a first touch (`use_evidence` `primarySignalId`, corroborate `primaryDefault`, a single choice in the UI); other facts are research context. `research/opener.ts` pins the compiler's `MAX_QUOTED_WORDS`: readiness `opener_too_long`, the machine refuses approve/activate on it.
- Debt (not a blocker): "Review or create a hypothesis" on a no-hypothesis card links to the cockpit Review lane, which can be empty; there is no account-scoped create path to link instead.

### GAP MONDAY READINESS: never offer an approval the gate will refuse (2026-09-27)
<!-- verified:2026-09-27 -->
- Live defect: five PepsiCo rows approved on a keyword-only observation; the thesis card offered Approve + use from status alone, the server refused `evidence_insufficient`, the result read "0 approved". The evidence gate was right and is unchanged.
- `hypothesis/actionability.ts` derives each row's next step on the server from `sendableEvidence`: `approve_use`, `use`, `find_evidence` (editable, not ready), `revise` (approved, not ready), `in_use`, `none`. Thesis cards (`readiness`, `members[].next`), the drawer (`GET /api/gap/hypotheses/[id]` `actionability`), the lanes and NEXT UP (`splitThesisWork`) all read it. RESEARCH DEPTH (depth.ts) and OUTREACH READINESS are shown as two badges.
- Not-ready theses (one-person ones included) live in RESEARCH with FIND VERIFIED EVIDENCE; REVIEW holds only decisions that can succeed. Approve results report actual state (`summarizeApproval`: already vs newly approved, in use, needs research, blocked); a failed use is not green.
- `POST /api/gap/theses {op:'use_evidence'}` (`useEvidenceForThesis`): each chosen fact must be a live outreach fact. Editable rows get the observation rebuilt from the facts (one audited `updateDraftNarrative`); an approved not-ready row is never edited: a new DRAFT revision carries `supersedes_id` (the schema's reopen relation) and the old row leaves current work only (`superseded_by: { is: null }`). `proposeFromResearch` sets the same link. Nothing auto approves, activates, routes or sends.
- Seller refusal copy (what / why / next): `src/lib/gap/ui/refusal-copy.ts`.
- Proof: `tests/unit/gap/monday-readiness*.test.*`, 8 mutation proofs, `scripts/gap/dogfood-monday-readiness.ts` (scratch; `--seed-browser` for the walkthrough).
- Named debt (not fixed here): thesis cards print the raw observation with `[S:id]` tokens; the scratch browser walk cannot preview SEND EMAIL without a GAP mailbox (by design it refuses rather than fall back).

### GAP EVIDENCE CONTINUITY + RESEARCH UX: PepsiCo / Gatik (2026-09-28)
<!-- verified:2026-09-28 -->
- Two clocks. SIGNAL FRESHNESS (should this create a trigger now?) is unchanged: `signals/promote.ts`, 21 days from publication; a June story never creates a September trigger. EVIDENCE VALIDITY (is the operating fact still true?) is `research/continuity.ts`: every fact is EVENT, ONGOING_STATE or ENDED from its own words (deterministic, no model, no score).
- An older ONGOING fact is current past its own clock only when a NEWER verified source names the account and the same program (a shared distinctive proper noun) and states present operation; a report of the past announcement is not corroboration. `research/continuity-store.ts` (run after every research run) then registers a continuation signal `continuity:<source>:<date>`: the same verbatim primary sentence, URL and original date, with `freshness_expires_at` from the corroboration date and `metadata.continuity {primary, currentness, otherSources}`. Every existing gate reads `freshness_expires_at`, so none changed. The original row is never altered (GAP_SIGNAL_FROZEN). A newer "ended" source marks the fact and its continuations `continuity.kind='ended'` (metadata only) and the gate refuses them (`superseded`). An ongoing fact within 45 days of its own clock with no corroboration gets ONE focused currentness web call (case H); a continuation whose source later fails recheck is withdrawn. A filing that restates an earlier dated event ("On July 1, 2026, we announced") runs its clock from that date (`metadata.eventDate`).
- Transport-network deployments (autonomous freight, moves freight, private fleet) are physical-network facts; funding and market stories, depreciation policy and software platforms are not. Undated company pages are dated from a dateline that names the account; the account's own domain is its primary source (no hardcoded names).
- Research is account-centric (`researchSections`): one section per account with counts, BEST FACT TO CONSIDER, OTHER VERIFIED CONTEXT (never hidden), contradictions, rejected sources, one NEXT action and only that account's theses. The source chain is compact (PRIMARY SOURCE / CURRENTNESS CONFIRMED / ALSO REPORTED / CURRENT UNTIL, and from what). Seller relevance (`sellerRelevance`) orders facts and never changes verified status; among equals, confirmed current, then the company's own source, then newest. The Use button is named by what the server will do (`labelForUse`): USE IN DRAFT, USE & CREATE REVISION, USE FOR THIS THESIS, or DRAFT THESIS FROM THIS FACT. The account boundary is rechecked on every use (`outreachFactRefusal` other_account), pinned both ways.
- Production dogfood (`scripts/gap/research-sources.ts "PepsiCo" <urls> --apply`, research tables only): PepsiCo newsroom (June 8, dateline) + FreightWaves June 9 + FreightWaves August 25 + gatik.ai (undated, refused). 6 facts verified, 16 sentences refused; one continuation: the June 8 primary sentence, currentness confirmed by FreightWaves August 25 ("Gatik moves freight for PepsiCo across roughly 250 retail locations in Texas, Arizona and Arkansas."), current until 2026-12-23. Nothing approved, activated, drafted, sent or enrolled; the five approved PepsiCo rows are unchanged. The Research page offers USE & CREATE REVISION on the PepsiCo thesis. Age audit: of 33 accounts with research facts, none had a verified ongoing fact expired for age, and the 14 recheck-refused facts the new rules would accept are all genuine past events (completed acquisitions, a 2022 shutdown); nothing was reclassified. UNFI's refusals were a 403 and quotes not found at the source, not age.
- Read-only evidence review (22 live verified facts): all verbatim at their sources. Fixed here: the PepsiCo fleet sentence labelled a site opening; the filing-date clock; depreciation policy and a software rollout passing as physical facts; the best-fact tie-break; duplicate sentences shown twice; a search redirect named as a publisher.
- Caveat stated, not changed: the August 25 currentness sentence is present tense but restates the June 250-location figure (the article's next sentence cites the June announcement). The spec defines June + August as eligible; Casey judges it.
- Proof: `tests/unit/gap/evidence-continuity.test.ts` (cases A-H on the real sentences), `continuity-research.test.ts`, `research-ux.test.tsx`, `account-boundary.test.ts`; 33 mutation proofs; `scripts/gap/e2e-continuity.ts` (scratch: C1 continuation + inbox chain, C2 no trigger, C3 GAP_SIGNAL_FROZEN refuses a rewrite, C4 superseded).
- Named debt (not fixed here): completion does not yet supersede an EVENT ("agreement to sell" then "sale completed": General Mills Brazil, context only); existing EDGAR rows keep their filing-date clocks (fact columns are frozen; only new facts use the stated date); EDGAR text extraction strips non-ASCII ("Caf Tr s Cora es"); web facts store search-grounding redirect URLs instead of the resolved publisher URL (labelled honestly in the inbox); duplicate rows across runs are collapsed only at display; a filing sentence about another company inside the account's filing (KDP / JDE Peet's "the Group") still passes.

### GAP OWNER RESOLUTION: make the right WHO actionable (2026-10-05)
<!-- verified:2026-10-05 -->
- Driver: PepsiCo (the better operator named with no control; a stale first-touch draft holding the account), FedEx and Walmart (an approved account-level hypothesis with no person answered `no_persona`), H-E-B (a departed person ranked as the operator). Canonical doc: `docs/gap/OWNER_RESOLUTION.md`; the baseline's contracts: `docs/gap/STABLE_BASELINE.md`.
- ONE read, `people/owner-resolution.ts` + `owner-resolution-load.ts`, for NOW, hypothesis activation and Research Next; an account-type-aware prior (`person-prior.ts` carrier doctrine, `entity-boundary.ts`); thesis relevance with reasons (`thesis-relevance.ts`); ADD TO GAP (`account-import.ts`, `POST /api/gap/people/import`); audited persona assignment (`hypothesis/assign-persona.ts`); contact currentness (`employment.ts`, `employment-store.ts`, `employment-verify.ts`, `employment-gate.ts`; gates in the seller draft, cold outbound, enroll, routing inputs); the governed owner action (`owner-action.ts`, `GET/POST /api/gap/hypotheses/[id]/owner`); FIND OPERATOR (`find-operator.ts`); the draft discard (`execution/draft-discard.ts`, `POST /api/gap/decisions/[id]/gmail-draft/discard`); the controls (`add-to-gap-button`, `employment-control`, `outstanding-draft-panel`, `owner-resolution-panel`, the drawer, NOW).
- Dogfood (production, read-only, `scripts/gap/owner-resolution-dogfood.ts`): PepsiCo, FedEx (hypothesis and cold), Walmart (hypothesis), General Mills, Tyson Foods, Kroger, H-E-B, NFI Industries, J.B. Hunt, UPS. Every account is a ranked choice; nobody is auto-picked; contact currentness set nobody aside after the employer-spelling fix. Three defects found by the dogfood and fixed before ship: employer spellings read as another employer (35 of 35 NFI contacts set aside), a HubSpot-only person preselected over 34 eligible, likely-current managers above an unverified SVP.
- Proof: 22 pinned tests in `tests/unit/gap/` (person-prior-carrier, employment, employment-store, employment-gates, owner-resolution, owner-resolution-load, owner-resolution-now, owner-resolution-ui, account-import, assign-persona, draft-discard, owner-action, owner-routes, find-operator, hypothesis-drawer, thesis-relevance); mutation proofs on the human override, the modified-date rule, the departed-person read, the employer prefix rule, the opt-out refusal, the preselect rule and the rank order.
- Fresh adversarial review (separate worktree): 2 blockers (the gate read less evidence than the panel; a person's own email domain as an account spelling) and 5 should-fix items, all fixed and mutation-proven; the NICE list fixed but one display note; the rejected list recorded in the canonical doc.
- Safety: emails sent 0, enrollments 0, Apollo credits 0, HubSpot contacts created 0, accounts created 0. Production repairs (the Michelle draft discard, the Isaac import, the FedEx assignment, Dakota's correction) run under Casey's session after deploy and are receipted in the canonical doc.

### GAP WHO TRUTH MAINTENANCE + ENTERPRISE COVERAGE (second correction, 2026-10-05)
<!-- verified:2026-10-05 -->
- Driver: four classes of friction the #396 dogfood left: same-employer role currentness (Walmart: Christina Mannella's stored West Transportation Command Center title is no longer hers; Christian Burton leads it), hypothesis-specific owner ranking (FedEx), corporate-family contact coverage (PepsiCo / Frito-Lay, Kroger banners, carrier subsidiaries), and legacy local suppression flags with no governed review (Isaac Scott). Canonical doc: `docs/gap/OWNER_RESOLUTION.md` (last section); contracts: `docs/gap/STABLE_BASELINE.md`.
- Shipped: `people/role-currentness.ts` (five role states beside the five employment states; effective title; a contradicted stored title never ranks); five-case VERIFY CURRENT ROLE (`employment-verify.ts`, `POST /api/gap/people/verify-role` for a persona or a HubSpot-only person; `person.role_verified` audit rows); purpose-specific ranking and RECOMMENDED FOR THIS HYPOTHESIS by first difference (`owner-resolution.ts`); the fact decides thesis relevance (`thesis-relevance.ts`); the corporate-family HubSpot read (`family-people.ts`) wired into `owner-resolution-load.ts`, with the import accepting a verified family company (`account-import.ts`, `owner-action.ts`); the governed alias workflow (`alias-review.ts`, `POST /api/gap/accounts/alias-review`, `alias-proposal-control.tsx`, `scripts/gap/seed-verified-aliases.ts`); account kind through the vertical (`account-kind-review.ts`, `scripts/gap/account-kind-review.ts`); the legacy suppression review (`suppression/legacy-review.ts`, `GET/POST /api/gap/personas/[id]/suppression-review`, `legacy-suppression-review.tsx`, the clearer `src/lib/email/suppression-correction.ts`); role truth in the brief and NOW (`account-intel/load.ts`, `build.ts`, `context/now.ts`); the seller controls in the owner panel; `scripts/gap/who-truth-dogfood.ts`, `record-role-evidence.ts`, `stage-sourced-candidate.ts`.
- Proof: the suites named in the canonical doc (every numbered case of the brief), 14 mutation proofs, the reviewer's 14 failing-input cases kept green; full suite 643 files / 7,249 tests / 0 failures; typecheck, lint and production build clean. Fresh adversarial review: 1 blocker (the Pepsi Isaac review unreachable) and 9 should-fix items, all fixed; 6 nice items, 5 fixed and 1 recorded.
- Production (GAP tables only, audited): 6 aliases (Central Market, King Soopers, City Market, SDR Distribution x3); NFI Industries, J.B. Hunt, UPS = "3PL / Logistics"; role evidence for Christina Mannella (changed, title unknown), Lisa Lisson, Glen Chaffee, Jeffrey Tallman; Christian Burton staged as candidate 49. Not done: no owner selected, Isaac's flag not cleared (LEGACY_CONFLICT, Casey's click), no HubSpot write, no send, no enrollment, no Apollo credit, no Account or Persona created.
- Same day, after Casey chose the FedEx (Glen Chaffee) and Walmart (Doug Estrada) owners through the panel: PR #399 (merge 4ad8b81c) closed the debt that should close (a supporting title stands when nothing is stored; a HubSpot-only person can be corrected by Casey; the suppression review reads the GAP mailbox's delivery failures; the pre-call brief says employment and role currentness; the FedEx GAP contact "Jeffrey" completed to "Jeffrey Tallman" from its linked HubSpot contact) and made the owner panel, the person checks, NOW and the brief rep-friendly (plain-language frame, compact cards with Details, grouped set-aside with counts, a glossary, action help that says no email is sent, buttons instead of links, do-not-contact contacts named on NOW with the legacy review one click away). The #400 follow-up gives a HubSpot-only WHO the same checks and merges contact-id role evidence into the call brief. Canonical: `docs/gap/OWNER_RESOLUTION.md`, last section.

### GAP OS EXECUTION RECOVERY (2026-10-06, in progress)
<!-- verified:2026-10-06 -->
Mandate: Casey's "GAP OS: execution recovery mandate and atomic sprint plan" (2026-10-06; evidence inspected at
672570ed, production READY on 672570ed, dpl_5tW92dBWDxnL8VquojbfBedmu8MP, and on c7fbf4ef before it). The operating
promise: GAP finds and checks relevant information, prepares a defensible commercial move, puts the right work in
front of Casey, helps him execute it, remembers the result, and brings back the next commitment when it is due.
Product-policy amendments (preparation may be automatic; evidence by purpose; the day centers on commitments) are
recorded in `docs/gap/STABLE_BASELINE.md`, "Execution-recovery amendments". Branch `feat/gap-account-first-ux`
(the worktree `wt-gap-account-first-ux`), one writer. This section is the ticket ledger (R00..R65); each ticket
records ownership, dependency, positive and negative proof, rollback and the observed result.

**R00 Reconcile live and local state (DONE).** main 672570ed = production (READY, auto-deployed after c7fbf4ef);
branch at main; no open GAP PRs; worktrees of other sessions untouched. Capability matrix: hypothesis / routing /
compiler / reply classification ENABLED in production (the GAP CORE LIVE block); background research and grounded
discovery ENABLED on the cron schedule (every 2 h / hourly / 30 min, `docs/gap/STABLE_BASELINE.md` "Health
dependencies"); auto-enroll, sequence publish and the HubSpot mirror OFF; transcription DISABLED (spend); the
transport sink and the HubSpot base-path override (R05) are CODE ONLY, unset in production. Production read-only
observation: exactly ONE stranded `unmapped` draft exists (PepsiCo, `cmux0uu7r0003jw0450gb4kno`, persona 2236 "Tom",
created 2026-10-06T18:38Z by the recording, source_ref null, the Tulsa fact linked as `supporting`, one `propose`
event); PepsiCo holds 15 theses (5 active Gatik, 5 approved and 4 unresolved keyword-only 10-Q rows, the draft).
Nothing was rerun or written in production.

**R01 Authority map and policy amendments (DONE).** One owning service per concept: source -> `signals/registry.ts`
(registerSignal); claim -> `research/run.ts` + `research/claim-rules.ts`; outreach admission -> `research/evidence-
gate.ts` (outreachFactRefusal / sendableEvidence / hypothesisSendable); thesis -> `hypothesis/service.ts` +
`hypothesis/machine.ts` (the only transitions) with `hypothesis/current-revision.ts` (one revision per person and
family) and `research/propose.ts` (the research proposal path); the draft from a checked fact -> NEW
`story/draft-from-fact.ts` (R11) on top of those; person -> `people/owner-resolution*.ts` + `motion/load.ts`
(recordMotionChoice); the account read -> `pursuit/load.ts` + `pursuit/state.ts`; the Work card -> `work/list.ts`;
message -> `compiler/*` + `sequence/render.ts`; execution -> `execution/seller-send.ts` / `seller-draft.ts` /
`gmail-adapter.ts` behind `email/gmail-sender.ts` (the one wire, every gate); reply -> `replies/list.ts` +
`replies/classify.ts` + dispositions; capture -> `capture/*`; opportunity -> `opportunity/active-opportunity.ts`
(the page) and `deals/in-deals.ts` (the cockpit tile; a second READ of the same HubSpot truth, reconciled in R10).
Legacy routes left in place: `/gap?lane=review` and All hypotheses still work; the normal path no longer needs them.
Changed invariants with before/after tests: "no auto hypothesis / draft" -> internal proposals allowed (R11 tests;
R33 later); "physical change only" -> kept for the first-touch path (`research-facts`, `evidence-gate` suites
unchanged) and widened by purpose in R30 with its own positive/negative cases.

**R02 Representative corpus (DONE, scratch only).** `scripts/gap/recovery/seed-corpus.ts` seeds, through the real
intake and hypothesis authorities, eight test-safe accounts on the embedded scratch Postgres (55432/gap_finish_e2e;
rebuild: db push + the eight forward `prisma/sql` files + `verify-triggers` 33/33 + `seed-families`): Pepsi Scratch Co
(the recording: Tom chosen, closure + partner + sensitive facts, no thesis), Fedex (chosen + approved thesis: Ready),
Walmart (an approved thesis and a "stop" reply: Opted out), Kroger (an open deal in the stub: In a deal), Nfi (a 3PL,
six eligible, an approved thesis: Choose), Dannon (nothing), Mills (a legacy ACTIVE thesis on a sale abroad: the gate
refuses it), Heb (the only operator left). Each carries its expected useful outcome; none is assumed Ready.

**R03 Pepsi reproduction (DONE).** `tests/unit/gap/scratch/anchor-draft.scratch.test.ts` (real routes, service,
machine and Postgres; only the session mocked; skipped without GAP_SCRATCH_DATABASE_URL). BEFORE the fix, with the
component's exact payload: POST /api/gap/hypotheses 201 then PATCH {action: submit} answered **409
{"error":"unmapped_family"}** (the recording's "Drafted (unmapped_family); submit it from the REVIEW lane"), and the
page's own projection dropped the warehouse closure from the draft list (the recording's fact count 2 -> 1). The
browser journey on the scratch server (headless Chrome, the visible control, `journey-pepsi-draft.mjs`, receipts
`r03/pre_*`) showed the same note, "Draft a thesis from a checked fact (2)" -> "(1)", and the fact gone after refresh;
NEXT read "draft it from the opening story below" while its button read "Open the research plan". Duplicate-click
and retry variants are in the same file.

**R04 Baseline tasks and latency (DONE, carried from the account-first record).** `docs/gap/ACCOUNT_FIRST_UX.md`
7.5: Work 21.4 s cold / 78 ms repeat; the account read 10 to 49 s cold; the shell 0.3 to 4.9 s warm. New: the draft
transaction on the scratch server, 7.5 s from click to the note (pre-fix) and 4.7 s (post-fix, incl. the family
question); approve and use 4.8 s incl. routing. Targets (section 8 of the mandate) are not met yet; R15/R61 own them.

**R05 Safety harness (DONE).** `src/lib/email/transport-sink.ts` behind every gate in `gmail-sender.ts`
(GAP_SEND_TRANSPORT=sink; a real address refused before any network call, the attempt recorded; proven by
`tests/unit/gap/transport-sink.test.ts`), `HUBSPOT_API_BASE_PATH` on the SDK singleton, `scripts/gap/recovery/
stubs.mjs` (HubSpot + clawd, every request logged), the scratch database rebuild, the corpus. The local server runs
with no production credential (scratch-env). Rollback: the variables are unset in production; the code paths are
inert without them.

**Sprint 1, the account-to-action spine.** R11 **Proposal creation recoverable and idempotent (DONE):**
`story/propose-family.ts` derives the problem family from the fact (a clear cue wins; a tie is decided by the change
class with its basis; nothing derivable asks the seller ONE question, never `unmapped` on the submit path);
`story/draft-from-fact.ts` + `POST /api/gap/story/draft` gate the fact (the outreach gate and sensitivity), keep one
draft per fact and person (`source_ref anchor:<fact>:p<persona>`; a stranded legacy draft that cites the fact is
ADOPTED and stamped, never twinned), return a person's existing open thesis in the family instead of a twin, edit an
existing draft (audited `edit`) and submit a complete one in the same call; a refused submit leaves the draft
recoverable and says why. Proof: `propose-family.test.ts`, the scratch transaction (6 cases: start, submit, retry,
approve and use, adopt, sensitive refused), `ux06-views` and `outreach-anchor` suites. R12 **Review where the action
lives (DONE):** `AnchorPending` in `story/anchor.ts` (an open draft or a thesis under review grounded on a checked
fact stays visible with its status, the exact opening sentence, the guess, the person, what would prove it wrong,
the family and the gate read); the panel in `outreach-anchor.tsx` with ONE labeled control, APPROVE AND USE (the
existing audited `advance: approve_and_use`: submit if needed, approve, activate, route), NOT THIS STORY (withdraw
with a reason) and the family question; NEXT names the proposal; `pursuit/load.ts` no longer reads a chosen person
with only a thesis under review as Ready (parity with Work's cold card). Observed: on the scratch server the whole
loop ran through the browser (set the family -> under review -> Approve and use -> "Ready for a first touch: Tom
Scratch", "Prepare the email to Tom"; the second story drafted lands under review and is NOT approved: one motion per
account) and the Work card read Ready.

R10 **The shared actionable result (DONE):** `pursuit/actionable.ts` derives from the one pursuit state and its NEXT
the intent (reply, opt-out, deal, hold, follow-up, in motion, warm touch, cold first touch, review a proposal,
choose, research), the person, the one allowed action, the blocker, the preparation (ready, under review,
incomplete, none) and the completion event; the account page derives it once and remembers it with the summary;
Work's card takes the summary's allowed action and preparation. Identical state yields the identical move on both
surfaces; a held account carries no cold action anywhere (`actionable.test.ts`); the cold-card rule stays
conservative (never READY without the database's own chosen person and usable thesis; never a cold action on a
held account). Two HubSpot reads remain (the page's resolver; the cockpit's In Deals summary) and now agree on the
corpus once the summary serves both legs (the stub's deal associations use HubSpot's `from` key).
R13 **Approval bound across the right boundaries (DONE, verified):** `tests/unit/gap/scratch/send-spine.scratch.
test.ts` runs the real send route, gates, compiler, ledger and Postgres with the boundaries controlled (the sink as
the mailbox, an in-process clawd stub for autonomy, suppression and the critic, the scratch opportunity reader): the
preview binds the recipient and the exact rendered copy (a content hash, so a refresh never demands a second
approval); a changed recipient or copy is refused; a suppressed recipient is refused at the wire; a buyer reply
between preview and confirm makes the card stale and the confirm is refused; a real address is refused by the sink
before any network call and recorded; CONFIRM + SEND writes exactly one message, one DIRECT_SENT row and one
EmailLog row; a replayed confirm answers ALREADY SENT and writes nothing. All send paths share the wire
(`gmail-sender.ts`). Under the sink, the Sent-folder read for a first touch GAP did not record reads the sink.
R14 **An outcome, not a navigation event (DONE):** `work/outcome.ts` + `POST /api/gap/accounts/outcome` record
skipped (until tomorrow), snoozed (until the seller's date, within 90 days) and logged outside GAP as append-only
`account.work_outcome` rows; Work drops a snoozed account to a footer and ranks a skipped or logged one last with
its line; a reply or an opt-out is never hidden by a seller note; the Done/Next bar keeps its plain links (Next
account records nothing, pinned) and adds the three controls that record first, then move on. Sent, drafted, failed
and unknown sends stay with the execution ledger (a lost answer leaves the claim open: outcome unknown, never a
resend; `unknown-send-reconcile` reads Sent for truth). Observed on the scratch server through the browser: Skip ->
"Skipped for today, you, today. Moving to the next account." -> Work shows the card last with the line; Snooze ->
the footer "Snoozed (1): back on their dates".
R15 **The working panel without the blocking read (DONE, measured on the production build at the gate):**
`pursuit/summary.ts` now keeps the summaries in memory AND one durable `system_config` row per account
(`gap:pursuit:<account>`; source: the page's own pursuit read; rebuild: any visit or the warmer; owner: that
module), read on a miss, so a cold instance's Work says what the last read said and the account shell shows the
last-known state (up to a day old, labeled with its age); `forgetPursuitSummary` drops both layers after an
outcome, a decision or a choice. Display state only: no send, draft or enroll path reads it. The full account read
itself is unchanged (R61 owns its speed).

**Sprint 1 gate (2026-10-06).** Exit met: Pepsi and two other conditions (Fedex ready, the corpus opt-out, the
corpus deal) reach a persisted outcome through the UI with no REVIEW-lane repair. Receipts:
- Unit: the full GAP suite 348 files / 5,232 tests green; the rest of the repository 325 files / 2,283 green (one
  skipped); tsc clean; eslint clean on every changed file.
- Scratch (real routes, services, machine, Postgres; boundaries controlled): `anchor-draft.scratch.test.ts` 6/6
  (the Pepsi transaction: start, submit, retry, approve and use, adopt a stranded draft, a sensitive fact refused);
  `send-spine.scratch.test.ts` 8/8 (route, preview binding, suppression, confirm + sink, replay, in motion, a real
  address refused by the sink, a reply between preview and confirm).
- Browser (headless Chrome against the scratch server, the sink as the mailbox): the Pepsi loop (set the missing
  family -> under review -> Approve and use -> Ready for Tom -> the email control; the second story lands under
  review, not approved); the outcomes loop (Skip today -> the next account; Snooze -> the footer; Work reflects both);
  the send loop (account -> Put the story in use -> NEXT "Prepare the email to Glen" -> the card -> Send email -> the
  final check from casey@yardflow.ai to the person with the exact copy -> confirm -> exactly one message written to
  the sink -> Work reads "First touch in motion: Glen Scratch"). Receipts: scratchpad `r03/`, `r14/`, `send/`.
- Defects found and fixed on the way (all in this sprint's commits): a stranded legacy draft twinned instead of
  adopted; a chosen person with only a thesis under review read Ready; a proven send read research when the queue
  held no card; a one-card READY account had no ready target so NEXT pointed at a preview that pointed at the lane;
  the rendered NEXT control was derived before the page's overrides; an in-motion account vanished from Work after
  its card was acted; a READY summary older than the ledger's touch overrode the touch; the send route left the
  remembered summary in place.
- Carried into Sprint 2+: the dev server rendered the Work list twice in one headless probe (the served HTML holds
  one list; re-check on the production build, R60); the full account read's own speed (R61); the Work page's own
  heavy cockpit read behind `cachedRead` (R61); the production stranded draft (`cmux0uu7r0003jw0450gb4kno`) is
  repaired by Casey answering the family question on the PepsiCo page after deploy (the service adopts it; no
  script needed, R64 records it).

**Sprint 2. R20 Monitored coverage and capacity (DONE; the choice is Casey's).** `signals/coverage.ts` reads the
ledgers the jobs already write (`signal.grounded_discovery` with the classes it asked and its error,
`signal.discovery`, `research.background_run`) and says per watched account and per source-class bundle: covered
(asked within seven days), stale, never, failed (the last turn failed and nothing fresh stands: never read as "no
news"); priority accounts (in motion, a chosen person, a thesis in use, an open deal, a meeting within 14 days) are
marked and the rotation (`discoveryOrder`, now used by grounded discovery) asks them first, least-recently asked,
with starvation protection: an account whose last turn failed within six hours waits behind every account that has
not failed. `/gap/coverage` (under More) renders it with the capacity statement. Production, read only, 2026-10-06:
75 watched accounts, 12 priority; the news pass asks at most 10 accounts a run with the time the grounded turns leave,
so each account about every 15 hours at best (corrected by batch item 10: it does not cover every account every two
hours); grounded bundle 1
(newsroom / SEC / earnings / leadership) covered for 74, bundle 2 (jobs / WARN / security / government) for 40 with
34 never, bundles 3 (procurement / case studies / technology / 3PL) and 4 (M&A / capex / fleet / trade press) NEVER
for all 75: at 2 accounts a run, 12 runs a day (24 turns), 75 x 4 bundles take 12.5 days per rotation and the
twelve priorities need 12 of those turns daily. The seven-day objective needs 43 turns a day. THE CHOICE (nothing
changed): run the grounded cron hourly (48 turns a day, about twice the grounded-search calls) or cut the rotation to
about 30 accounts beside the priorities. Not done here: no spend raised, no cadence changed, no cap raised.
R25 **Discovery connected to bounded research (DONE for grounded pages).** News discovery already queued headlines
that classify as a physical-network change; grounded pages were never queued ("the date is the search's claim").
Now a grounded page that is MATERIAL (newsroom, SEC, earnings, jobs, government/permits, procurement, case study,
technology, 3PL/partner, M&A, capex, fleet, trade press; never leadership, labor or security), whose title names the
account, that the reader could open and that carries the page's OWN date is queued (`research_status: queued`,
`metadata.grounded.queuedAt`) for the existing background research, which keeps its cap, its cooldown and its
three-attempt dead letter (batch item 10, 2026-10-07: its own status `research_failed`, labelled "Research failed" and
retryable, never `no_usable_fact`, for a thrown run, a provider that did not answer and a run that never finished;
`researchAttempts`, `deadLetteredAt`); bounded here too: 4 a run, 40 a day (an unreadable budget queues nothing). A
"may be relevant" page, an unread page and a search-dated page are never queued. Pinned in
`grounded-discovery.test.ts`. No automatic communication, no contact enrichment, no spend beyond the research the
cron already runs.
R21 **Source provenance and identity (VERIFIED, one addition).** Intake already keeps the canonical final URL
(`url_hash`), the page's own title and publication date, the retrieval time, the origin, the resolution basis
(explicit, named in source, alias, domain, discovery query, human), the grounded class and the search's date claim
apart from the page's date; a claim keeps its verbatim span, its speaker (`speakerOrg`), its event date when stated
and its account/division mapping through the governed aliases and family links (owner resolution). Added: a grounded
page found AS a job board, a procurement notice, a filing, the company's own site or a vendor page keeps that
`source_class` on its row when the host alone could only say "news". Family research (PBNA / Frito-Lay with PepsiCo)
runs through the existing alias and family-people reads; namesakes and sold subsidiaries stay unresolved by the
existing identity rules; no frozen fact is rewritten.
R22 / R23 **Job, procurement and other claims as their own types (DONE at the verifier).**
`research/claim-types.ts` classifies a verified sentence as physical_change (the existing first-touch path),
job_posting (role; open / closed / reposted / unknown only when stated), procurement (due date and issuer when
stated), technology, partnership, leadership (appointed / departed) or financial / other, each with its permitted
interpretation and forbidden leap (the mandate's table). The verifier (`research/run.ts`) now admits a job,
procurement, technology, partnership or leadership sentence that is verbatim at its source, dated and the account's
own statement (the speaker rule and the account-as-subject rule unchanged), and mints it with its `claim_class` and
`claimType` / `claimAttributes`; a finance line and an unclassified sentence are not minted. The outreach evidence
gate is unchanged: only a physical-network change is first-touch evidence (`not_a_physical_network_change` for the
rest), so nothing widens until R30's purpose policy says what each type may support. Pinned by `claim-types.test.ts`
and `research-claim-admission.test.ts`; the twelve existing research and evidence suites stay green (206 tests).
R24 **Events and temporal meaning (VERIFIED existing, recorded).** `signals/cluster.ts` already groups a press
release, a wire copy and a trade rewrite into one event (`event_id`) at the same account within four days by shared
specific words, keeping every source; `research/continuity.ts` tracks ongoing / event / ended and a newer contrary
source marks a fact superseded (the gate refuses it); contradictions are recorded by `research/conflicts.ts`. Not
built: an explicit pending / announced / active / completed state machine over events (carried as debt; the
continuity read covers ended and contradicted).

**Sprint 2 gate (2026-10-06).** Full GAP suite 351 files / 5,247 tests green on the Sprint 2 tree (before R30);
typecheck and lint clean on every changed file; the coverage read run read-only against production (the receipt
under R20). Exit met in part: every supported source class has a measured path to a checked claim (R22/R23 at the
verifier) and a no-action outcome (not minted, or verified-not-eligible), and coverage is measured; the seven-day
objective is NOT met at the current allowance (the choice is Casey's, R20). Carried: an explicit event state
machine (R24), job-board and procurement connectors beyond grounded search (the classes are reached through grounded
search today), the first-touch copy family for a job-led thesis (R34).

**Sprint 3. R30 Approach-specific evidence policy (DONE at the gate; the copy and the UI paths follow in R31-R35).**
`research/approach-policy.ts`: event_led (the existing physical-change path, unchanged), job_procurement_led (a
verified posting with yard / dock / trailer / gate / fleet duties not known closed, or a notice the account issued;
the copy may state only its own text and must ask whether it is still open; never "they lack a system",
"understaffed", "budget", "the contract is open"), report_led (NOT ENABLED; refused with its reason, never a bypass),
fit_led (a stable operating fact, a transparent fit question, no why-now), and the three that need no thesis:
warm_intro, existing_thread_reply, active_deal_follow_up, each with what it requires and forbids. The gate
(`evidence-gate.ts`) reads the thesis's declared approach (`metadata.approach`, default event_led) at approval,
activation, the pursuit read and the wire: under event_led nothing changed; under job_procurement_led a JOB_POSTING
or PROCUREMENT claim passes the verified / dated / own-account / publisher / speaker rules without the physical
rule, a closed posting is refused, and every other class is refused as not admitted. `draft-from-fact.ts` declares
job_procurement_led on a thesis drafted from a job or procurement claim. Pinned by `approach-policy.test.ts`; the
evidence-gate, machine, service, actionability and thesis-group suites stay green. Not done yet: the account read
(`account-intel/load.ts`) kept only physical facts as story facts; now (R31/R33, same day) a JOB_POSTING or
PROCUREMENT claim is a live story fact of its own class (re-gated by the publisher and speaker rules), the opening
story offers it as a draftable story, and the draft the service makes declares job_procurement_led. R34 is NOT
built: the compiler's first-touch copy exists for the physical-change path only, so every send and enroll gate
refuses a job-led thesis with `approach_copy_unsupported` / the stated detail (fail closed) until that copy family
ships; a job-led thesis is prepared and reviewed, never mailed in the physical-change words. Post-R30 regression:
the full GAP suite 352 files / 5,253 green.

R20 **follow-up: the bounded grounded rotation (DONE; the capacity choice decided).** The lead decided on 2026-10-06:
NO spend increase and no cron change; the rotation is bounded instead. `signals/coverage.ts` now owns, pure:
`groundedRotationSlots` (each priority account takes one turn a day for its daily pass; what the allowance leaves over
seven days, divided by the four bundles, is how many other accounts get every bundle within seven days:
floor(7 x (turnsPerDay - priorities) / bundles)) and `groundedRotation` (every priority rotates; the rest are ordered
by tier, then band, then name, and the first `slots` rotate; the input order never changes the choice).
`grounded-discovery.ts` asks only that population; the others stay watched for NEWS only, and `/gap/coverage` says
so on each such row ("news only: outside the grounded rotation at the current allowance") and counts them beside the
capacity with the decision and its alternative. Defect fixed on the way (same surface, it blocked the bound):
`discoveryOrder` put every priority account first on every run, so twelve priorities at two accounts a run took all
24 daily turns and no other account would ever rotate; a priority account now leads only while DUE (not asked within
its one-day target) and otherwise waits its turn by recency. The arithmetic the earlier choice text used
(floor(turns x 7 / bundles) - priorities = 30) ignored that the priorities' daily pass costs seven turns a week each,
not four; with it the "30 rotating" rotation would take ten days, not seven, so the honest bound was 21. Batch item
10 (2026-10-07): 21 met the objective with zero slack (21 x 4 / 12 = 7.0 days), so one failed or skipped turn missed
it; the rotation now keeps a 15% margin (`ROTATION_MARGIN`) and "met" is read against it: 12 priority, 17 rotating
(every bundle every 5.7 days), 46 news only. A provider outage turn is now recorded (`transient`; Coverage shows it as
failed) and never counted as a turn; an unreadable daily queue budget queues nothing. Production, read only,
2026-10-06: 75 watched, 12 priority, 21 rotating (every bundle every 7 days), 42 news only; covering
every watched account in seven days needs 48 turns a day (the hourly cron), the alternative declined. Pinned by
`coverage.test.ts` (slots, the deterministic choice, the capacity statement, the due-priority order),
`coverage-page.test.tsx` (the page line on exactly the news-only rows) and `grounded-discovery.test.ts` (a news-only
account never takes a grounded turn even when it is the least recently asked; mutating the runner to ask every
watched account turns it red). Rollback: revert the commit; nothing persisted changes. Debt: tier and band are the
only ranking inputs (no seller override of the rotating set yet; a seller-priority account enters through the
priority reasons).

R32 **The person matched to the motion and its scope (DONE).** One authority, extended: `people/thesis-relevance.ts`
now reads the thesis's APPROACH and SCOPE beside the title. A job or procurement-led thesis whose posting names a
role is matched on that role's function (the hiring manager's remit; the role comes from the claim attributes, else
the posting sentence), never on every yard or trailer word in the posting: on "hiring a Yard Operations Manager at its
Tulsa distribution center to manage trailer moves", transportation is direct and the fleet is adjacent (the event-led
reading of the same text would call the fleet direct). A fact that names a site (`factSite`: "its Tulsa distribution
center", "in Tulsa, Oklahoma"; never a state, region or month) makes a person who runs ANOTHER site related, never
direct (`personSite` from the title or, for a site-level title only, the CRM location; a network remit is never
capped). At a multi-division parent a fact one division states is never attributed to another division's contact
(a PBNA fact reads related for a Frito-Lay title or CRM company; a contact with no division on record keeps the tier
and the reason says whose fact it is). `people/owner-resolution.ts`: a contact on the account's open HubSpot deal
ranks right after a relationship and ahead of every cold alternative (a strong dimension, said in words); under a
job or procurement-led thesis only, the site operator AT the site the posting names is eligible and leads the direct
fits on thesis relevance (the hiring manager; event-led stays operator-first); `focus` says what the owner must own.
`people/stack.ts`: a genuine tie asks ONE concrete question ("Who owns the Yard Operations Manager posting at Tulsa
at PepsiCo: Ann or Bob?") only when nobody is chosen and choosing is the next action (`pursuit/load.ts` passes the
state after its research downgrades); the view renders it. The loader carries `metadata.approach`, the primary
claim's role and the open deals' contacts from the account read already made (no new HubSpot read; the account
read's deals now keep their contact ids). The anchor's "fits better" caution reads the same job-led context. Kept:
the resolver selects nobody; Tom's recorded choice leads the stack while the recommendation is a badge on Ana, and
only a material invalidation (left, set aside) drops it, said by `chosenMissing`; a large map shows three rows with
distinct reasons and the rest one counted step away. Pinned by `owner-motion-scope.test.ts` (13) and
`people-stack-view.test.tsx`; six deliberate mutations (site cap, division cap, the posting-role path, the open-deal
dimension, the hiring-site eligibility, the blocking condition) each turn their owning test red. Adjacent: 37 files /
420 green. Rollback: revert the commit; nothing persisted changes. Debt: the site read is a pattern over the fact
text and the title (no site entity table); the open-deal dimension is read only where the account read has the
deal's contacts (the hypothesis owner route has none and says nothing about deals); division vocabulary exists for
PepsiCo only (`people/division.ts`).

R34 **Channel-specific copy per approach (DONE; sent through the sink).** `sequences/families.ts` keeps the four
event-led seed families byte-identical (their steps hashes and rendered bytes pinned to the pre-R34 values; on the
scratch database the seeder found every stored event-led version unchanged and created none) and adds
APPROACH_FAMILIES, each under its own program (`gap-approach-2026-10:<approach>`) with no problem family:
**job / procurement-led** ("A question on the posting": the posting's or notice's own words through the
`{{observation}}` slot, the verified quote with its citation exactly as the event-led step 0 carries its fact; one
hedged sentence, "A posting says what a role covers, not how the day actually goes, so I might be reading too much
into it."; ONE question, "Is the posting still open, and are the yards where the day gets lost at {{account}}?") and
**fit-led** ("Nothing new prompted this note.", a hedged fit sentence, one question). Neither carries the
physical-change words, ROI, an engagement reference, a layoff hook or familiarity; both pass all sixteen compiler
checks. `copyFamilySupports` now opens for event-led, job / procurement-led and fit-led (report-led stays closed;
the list is pinned equal to the families). One authority picks the copy: `execution/action-pack.ts`
`resolvePackVersion` renders a thesis from ITS approach's family and never uses a version written for another
approach, wherever it came from (a pinned version, a pinned family or the lookup); `enroll/service.ts` and
`sequence/enrollment.ts` refuse a version of another approach, and an approach family never runs without its thesis;
`sequences/seed-drift.ts` judges approach versions against their family's current copy; `scripts/gap/seed-families.ts`
seeds both lists. The call opening follows the approach too (`sequence/call-pack.ts`: the posting question, no
guess; the event-led opening byte-identical). Compiler: the singular-"yard" voice warning (C14) now judges our prose
only; a verified cited quote and its source label (a posting titled "Yard Operations Manager") are the source's
words, set aside the way C07 and C08 already set the quote aside; an unverified quote is still judged. **Defect found
by the scratch run and fixed (R30 omission, blocking):** routing judged a thesis's evidence without its approach
(`routing/inputs.ts` evidenceThin), so a job-led thesis could only ever route to research_required; the readiness
read (`hypothesis/actionability.ts`, its four callers) had the same omission. Both now read `metadata.approach`.
Proof: `approach-copy.test.ts` (18; eight deliberate mutations each turn their owning test red);
`tests/unit/gap/scratch/job-led-send.scratch.test.ts` (5, real routes / services / machine / compiler / gates /
ledger / Postgres; a new corpus account, Tyson Scratch Co, carries a JOB_POSTING claim and a chosen person): draft
from the posting (job_procurement_led, submitted) -> APPROVE AND USE -> a routed card -> the preview renders from
the job family with the posting's exact quote and one question, none of the physical-change words -> CONFIRM +
SEND writes exactly one message to the sink with that copy in its MIME body; an event-led thesis at another account
still renders from its event-led family. Before the routing fix the same run stopped at the preview with
`not_an_email_action: research_required` (receipt: scratchpad `r34/preview.txt`). All three scratch files pass in
sequence on a freshly reset database (19). Adjacent: 43 files / 817 and 32 files / 808 green. Rollback: revert the
commit; the two approach families stay inert rows (archive them, or leave them: nothing resolves to them once the
gate closes). Production: the approach families need `seed-families.ts --apply --remote` before a job-led thesis can
render there (until then the pack answers `no_version` and nothing goes out). Debt: the job-led copy says "posting"
for a procurement notice too; no follow-up steps exist for either approach family (single touch, as the event-led
seeds); `hypothesis/thesis-groups.ts` group readiness reads the first member's metadata only.

R35 **Ask GAP requests use the same preparation service (DONE).** A request to PREPARE something now comes back
with ONE typed `proposal` built from the page's own controls (`lib/gap/ask/proposal.ts`, pure): "help me approach
this person" (or "how should I approach Ana") returns the link to NEXT's prepared email when an approved opening is
usable, the review panel when a proposal waits, else the opening story's DRAFT A THESIS on a checked fact for that
person, else one research pass; "draft an angle from the job posting" returns the draft on the checked posting
(the posting's own draft text) or says there is none and links Coverage; "research their footprint deeper" returns
the research plan's DEEPEN on that section. Kinds: `draft_thesis` (POST /api/gap/story/draft with the exact payload
the page's control posts: the defaults and the persona key moved to `story/draft-defaults.ts`, one module for both
callers; the event-led draft text is unchanged, a posting gets its own), `research` (POST /api/gap/accounts/deepen,
which re-plans and refuses an unplanned section) and `open_control` (a link). The route reads the intent before
anything else and answers a proposal with NO model call; the controls ride in the remembered context and are dropped
from the model's prompt; an explanation ("Why this approach?", "What research has been done?") stays a read-only
answer, and a request to send, enroll, look up, suppress, choose or write copy is still answered by naming its
control. The component renders the proposal as a button that calls only that route with that payload (or a plain
link) and says what happened; the press is the seller's and the route runs its own gates. Ask GAP still cannot
send, choose permanently, spend, suppress or write the CRM. The people stack section gained the anchor the links
land on. Pinned by `ask-proposal.test.tsx` (10: the intents and the non-intents, each proposal against the page's
controls, the prompt without the controls, the real route with only the session and the model provider replaced,
the component's button and link); six deliberate mutations (the route asking the model, the controls reaching the
model, a payload that is not the page's, a copy request read as a proposal, the button posting elsewhere, an
explanation read as a request) each turn their owning test red; adjacent 10 files / 131 green. Rollback: revert
the commit. Debt: the research proposal does not read the plan first (the deepen route refuses an unplanned section
with its reason, said on the button); intents are English patterns over the question, not a model classification.

**Sprint 3 batch gate (2026-10-06; R20 follow-up, R32, R34, R35).** The full GAP suite 356 files / 5,304 tests
green; the rest of the repository 325 files / 2,284 green (one skipped); typecheck clean; eslint clean on every
changed line (the remaining errors in `enroll/service.ts`, `sequence/enrollment.ts`, `hypothesis/thesis-groups.ts`
and `outreach-anchor.tsx` are identical at the pre-batch commit). Scratch, on a freshly reset database, in sequence:
`anchor-draft`, `job-led-send` and `send-spine` 19 / 19 (the global EmailLog count in `anchor-draft` holds only on a
fresh database; run the scratch files one at a time). Production stays as it was: no write, no flag change; the
approach families are not seeded there yet (the R34 entry says how).

**Sprint 4. R40 Commitment identity and lifecycle (DONE).** `work/commitment-model.ts` (pure, client-safe),
`work/commitments.ts` (the store) and `work/dates.ts` (New York days): ONE durable record per obligation, an
append-only `account.commitment` ledger row (subject the account; each row a full snapshot keyed by
`payload.commitmentId`; the newest row wins) carrying the owner, the due time (a date-only obligation is due at 9 am
New York that day), the account, person, deal and thread, the status (open, waiting, blocked, snoozed, done,
skipped), the dependency in words, the completion proof (the ledger row, the disposition, the capture, the mailbox
message, the outcome, or the seller's own recorded note) and its source. The id IS the source (`disposition:<id>`,
`send:<person + step key>`, `snooze:<outcome row>`, `capture:<note>:<candidate>`, `seller:<uuid>`) and the create is
one-shot under an advisory lock, so a duplicate event, a retry, a refresh or another instance finds the record and
writes nothing; done and skipped are terminal (the writer refuses every transition and the fold ignores any later
row), so nothing resurrects a completed item. Sources: a human-confirmed disposition (`disposition/service.ts` step
7, fail-open, injectable: request_information -> answer the request; meeting_accepted -> prepare the meeting; timing
with a date -> a reminder snoozed until then; referral -> decide how to approach the NAMED person, recorded as that
person and never as the referrer; any stopping answer closes that person's waiting follow-ups with the disposition as
proof), a snooze (`work/outcome.ts`, loaded on demand because the outcome module is reachable from the Work list's
client component: a reminder that returns on its date; a newer outcome settles the older ones, done when they had
come back, skipped when replaced or cleared) and every proven send of the last 30 days (`syncFollowUpsFromLedger`,
run on the Work read: one waiting follow-up per person, due when the pinned version's next step is, else the house
four-business-day interval flagged `noFollowUpCopy`, because every seeded family is single-touch today; a newer send
closes the older follow-up with its ledger row). `GET / POST /api/gap/commitments` lists an account's obligations with
their phase and records the seller's own obligations and transitions (done needs proof, waiting and blocked need the
dependency, a snooze a future date within 90 days). The phase at `now` (due before the end of the New York day,
upcoming, waiting, blocked, snoozed, done, skipped) is derived, never stored: a snooze returns on its date or early
when the buyer moves; a follow-up the buyer answered is blocked by the answer; a buyer promise past its day becomes a
chase. Storage decision: no new table; one indexed read by kind (every obligation) or by subject (one account); the
additive (status, due_at) projection is the next step if the rows pass about ten thousand (owner: this module; rebuild:
the rows). Proof: `commitments.test.ts` (9: the New York calendar across a late evening and daylight saving, the
one-shot create, proof and terminal states across a reload, the five statuses, two obligations at one account, the
three sources); six deliberate mutations (the one-shot create, the terminal refusal, the fold's terminal guard, done
without proof, a UTC day, the referral naming the referrer) each turn it red. Adjacent: disposition, outcome, capture,
BID and Work suites 8 files / 188 green; typecheck clean. Rollback: revert the commit; the rows stay inert (nothing
else reads the kind). Debt: a meeting accepted by email has no time on record, so its preparation is due at once
until the seller adds the time.

R41 **Today's work ranked by commercial obligations (DONE).** `work/list.ts` now builds the DAY (`workDay`: cards,
the Waiting footer, the Snoozed footer and their counts; `buildWorkList` is its cards): the tiers are a buyer
commitment due today (a deliverable the seller promised, a request the buyer made), an actionable reply (and a
referral to decide on), a meeting within 24 hours (the Meeting table, read in New York; prepare it), an open deal with
a step due (deal work on the same card that still says no cold first touch), a follow-up due (and a reminder that came
back), prepared prospecting (a first touch ready, a GAP draft to send or discard), a proposal to review, research,
then the admin (an opt-out to record), the seller's own "not today" and the holds. Inside a tier: the due time, then
the newest buyer activity, then the seller's explicit priority (NEW `work/priority.ts` + `POST /api/gap/accounts/
priority`: an append-only `account.priority` row with a one-line reason, newest wins, `clear` ends it; it never lifts
a hold and never puts cold work above a buyer's obligation), then the lane's own order; each card says why it sits
where it does (`rankWhy`: "A buyer commitment is due: Send the comparison (due today)", "A prepared first touch; you
prioritized it (their CFO asked)"). Every obligation due today is its own row on its account's card with Done (the
seller's note is the proof), Snooze (a date) and Skip (a reason) through `/api/gap/commitments`; an account whose only
work is an obligation gets a card of its own, so no task is silently omitted. Waiting work is counted, never a card:
an obligation due on a later day, one waiting on someone, a blocked one, and (the one R14 rule changed on purpose) a
first touch that WENT OUT, which now waits on the buyer and then on its follow-up instead of inflating "needs you"
(an outstanding GAP draft is still a card). A snooze returns on its date, or early when the buyer moves after it was
set (a reply before it is not a change); the seller's snooze of an account never hides a buyer obligation due there.
The counts are the contents: needs you = the cards; obligations due = the rows on them; Waiting and Snoozed count what
they list; a new "Due" chip filters the cards a commitment, meeting or deal step placed. The Work page reads the
commitments (after the bounded follow-up sweep, at most once a minute per instance), the next two days' meetings and
the priorities on every render (`work/day-load.ts`), never cached with the lanes. Proof: `work-rank.test.ts` (6: a
customer-promised deliverable outranks a new article and the full tier order; the three tie-breaks in order, said on
the card; waiting never inflates needs you; a snooze returns only when due or materially changed; two obligations on
one account stay two and every open obligation appears exactly once; a seller snooze never hides a buyer obligation),
`work-list.test.ts` (the R14 motion case rewritten to the waiting rule, the counts with the Due chip) and
`work-list-view.test.tsx` (the rank line, the obligation rows with their actions, Done through the route, the Waiting
footer, the priority); seven deliberate mutations (a research card above a commitment, an upcoming obligation as a
card, the priority tie-break dropped, a sent touch kept as a card, a snooze hiding a buyer obligation, a snooze
returning on an older reply, an obligation-only account omitted) each turn their owning test red. Adjacent: 9 files /
67 green; typecheck clean. Rollback: revert the commit (the commitment and priority rows stay; nothing else reads
`account.priority`). Debt: Work reads every commitment row on each render (fine at today's volume; the indexed
projection named in R40 is the step when it grows); a meeting row with no time is placed at 9 am New York on its day.

R42 **Reply triage through reply execution (DONE; the answer is prepared and editable since R42b, below).** `replies/classify.ts` now says what a
HUMAN reply is without changing its kind (`human`: a real reply, a referral, an objection; each still pauses the
account and stops every cold follow-up there; an opt-out inside a longer message stays an opt-out). NEW
`replies/prepare.ts` (pure) + `components/gap/reply-prep.tsx`: on the Work reply card and on the account page right
after NEXT, the incoming message (who, when, subject, their words), its kind, prepared notes read off their words
(what they asked, the day they named in New York, who they named, the objection quoted), "Answer in Gmail" (the
thread in the GAP mailbox, else a search for the sender there) and "Record what they said" (the triage form). As first
shipped (superseded by R42b): NO reply copy family exists (the compiler and governed copy have first-touch families
only), so it failed closed: `copyFamily` is always null, the panel said "No reply copy family yet: GAP does not write
this reply. Answer it yourself in the thread.", there was no send, draft or preview control and no model is asked
for words. A referral: the card reads
"They named someone" with "Record who they named"; the disposition form now carries who they named (and, for a
not-now, the day to come back), prefilled from the message's words for the seller to confirm; the R40 referral
obligation records the NAMED person, "named by" the one who named them, with no cold action and no implied consent or
relationship, and the account page lists it under "Obligations here" (every open obligation at the account, each its
own row with Done, Snooze and Skip). An out-of-office notice with a return day (`dates.ts` `parseReturnDate`; an
explicit date now beats a weekday in the same phrase) moves the person's waiting follow-up to that day, never earlier,
or with none waiting makes ONE reminder snoozed until then, keyed by the person and the day. Duplicate imports: the
same Gmail id and the same HubSpot engagement were already stored once; the remaining duplicate, the same reply from
the GAP mailbox AND HubSpot's connected inbox, is now one reply (`replies/twins.ts`: same sender, subject, opening
words, within ten minutes); the list keeps the Gmail copy, names the others (`twinIds`), and a HUMAN-confirmed
disposition on ANY copy, on the page or not, settles it (an AI suggestion never does). The reply item gains
`threadId`, `fromName` and `twinIds`, added to the client type on purpose (contract parity). Proof: `reply-prep.test.ts`
(9: the kinds; the prepared reply with no copy family and no send path; referral, objection, opt-out, automatic notice
and bounce notes; a real reply, a referral and an objection all read replied with no cold touch and block the follow-up
there; the out-of-office move and the one reminder; twins and their settlement, inside and outside the page; the form
body) and `reply-prep-view.test.tsx` (the panel offers exactly two ways out); eight deliberate mutations (a send in
the prepared reply, every human reply read as plain, a follow-up offered over a reply, the out-of-office move re-applied
on every read, a weekday beating the explicit date, a twin's disposition ignored, an AI suggestion settling a twin, the
referral naming the referrer) each turn their owning test red. Adjacent: the whole GAP suite 360 files / 5,331 green
(the three scratch files skipped without the scratch URL); typecheck clean. Rollback: revert the commit (no stored
shape changes; reminders already written stay inert rows). Debt: the referral name and the asked question are pattern
reads of the message (the seller confirms the name in the form); the answer itself is R42b (below), prepared from
their words with no governed reply copy family. Found on the way, OUTSIDE this sprint's surfaces and not
fixed here (named debt for the lead): earlier heredoc edits left literal backspace characters where a word boundary was
meant in three files, so `story/propose-family.ts` line 49 (the closure cue for the problem family) can never match,
`entity/providers.ts` `modelGone` never matches the "404" alternative, and three guard assertions in
`tests/unit/gap/hubspot-poller.test.ts` (lines 708 to 710) pass vacuously.

R42b **The prepared answer (DONE for a reply in the GAP mailbox thread; PARTIAL for a reply that came in only
through HubSpot's connected inbox, the dependency named: the Gmail thread).** Casey reconciled R42 on 2026-10-06: the
fail-closed line was a safe fallback, but the mandate is a PREPARED, EDITABLE answer to what was asked. NEW
`replies/answer.ts` (pure): every ask is read from their message (pricing; a security, legal or contract question; a
commitment or timing; a material; their availability, with the day they named in New York; any other question; an
objection is acknowledged) and the text is prepared as a greeting and one line per ask. What GAP holds is written in
and cited (the account's demo or microsite, trust "Ours"); everything else is a "[Fill in: ...]" placeholder in the
text AND a line under Missing information. It never writes a price, a time, an attachment, a commitment or the buyer's
agreement. Beside the text, what GAP can cite, each with its trust word: the sender's own human-confirmed statements
("Buyer confirmed", read for that person at that account, so no other deal's context can appear), the fact the thesis
started from ("Public source"), the last touch ("Recorded"). A referral, an opt-out, an automatic notice or a bounce
prepares no answer and says why. NEW `execution/seller-reply.ts`, `sendSellerReply` in `execution/seller-send.ts`,
`GET` / `POST /api/gap/replies/[id]/answer` and `components/gap/reply-answer.tsx` (on the reply panel, loaded when the
seller presses "Prepare the answer"): three DISTINCT actions, each its own ledger kind on the inbound message. COPY
(`execution.reply_copied`; nothing leaves GAP). SAVE AS A GMAIL DRAFT in their thread (`execution.reply_drafted`; a
draft, not a send; the same text twice is one draft; a different text while it exists is refused). SEND: a preview of
exactly what leaves, then CONFIRM + SEND bound to one hash of the sending mailbox, the recipient, the subject and the
edited text (`execution.reply_sent` plus an EmailLog row); a newer message from them after the preview makes the
confirm stale. Draft and send run under a per-message advisory lock and claim (`execution.reply_claimed` /
`execution.reply_released`), so nothing goes out twice and a send while a draft exists is refused. The send is the only
new HUMAN_APPROVED_1TO1 use and lives in seller-send.ts (the structural pin holds); it carries In-Reply-To and
References so it lands in their thread, and the wire re-runs the restriction, autonomy, suppression and daily-cap
gates. Every press re-reads current state: an opt-out (this message, a later one, or a recorded do-not-contact), a
referral, a person marked do-not-contact or a notice refuse copy, draft and send; a newer message from them, an answer
already in the GAP mailbox's Sent (sent by hand) or an unreadable Sent folder refuse the draft and the send; a text
with an unfilled placeholder or an em dash, an empty one or one over 8,000 characters is refused, and the edited text
passes the deal-artifact guard (`deals/artifacts.ts` `artifactProblems`: no "throughput", no claim of approval or
acceptance the buyer did not make, their own quoted sentences exempt, a canon figure only with its label). Draft and send need
an owner (403 otherwise). No model writes the answer and no governed copy family runs, so the congruence critic is not
called: the seller's edited words are the copy. A missing GAP mailbox sender, like the HubSpot-inbox case, prepares
the answer as PARTIAL with the dependency named, and copy still works. The R42 fail-closed line is gone: a real reply
or an objection shows "Prepare the answer"; a referral or an opt-out says why no answer is prepared. Folded in
from the independent audit at 31f09c71 (each line opened and confirmed first). (a) The out-of-office reader matched a
real reply that mentions "delayed response", "on vacation" or "out of the office" in passing, and such a reply then
got no Work card, did not count as a buyer move, could not be recorded and was not a material change. `classify.ts`
now reads an out-of-office as an automatic notice only: the Auto-Submitted and autoresponder headers are already
rejected at ingestion (`email/reply-precision.ts`), so here it is the canonical subject, or the canonical notice
body (present or future tense) WITH no first-person answer to our ask (no question back, no yes, no day that works,
no "send me"); an apology or the past ("sorry for the delayed response", "I was on vacation") is a person; and an
explicit opt-out now wins over a notice in the same message. The account-reply hold (`account-reply.ts`) read the
subject only, so a notice without the canonical subject held every first touch with no card to say why; it now reads
the same classification as the card: a notice or a bounce holds nobody, a person or an opt-out holds until recorded.
(b) The prepared reply did not exist: this entry. The
follow-up side is R43, now marked PARTIAL with its dependency. (c) "Nobody they named gets a cold email until you
choose" was said on the card and enforced nowhere: R5 held the person who pointed elsewhere, never the person named.
NEW `replies/referral-hold.ts`: an open R40 referral obligation naming the person (by email anywhere, else by full
name at the account; never a first name alone) holds them until the seller marks it done or skipped, read from the
ledger by its JSON path (an unreadable ledger throws, never clear). Enforced where the other holds live: the send
gate's step 0 (`named_in_referral`, shared by the draft and the send path), live enrollment, and routing (NEW rule R5b
`named_in_referral`, after R5: research_required with the obligation's words), with the seller words in
`ui/refusal-copy.ts` and the send panel. Proof:
`reply-answer.test.tsx` (11: the asks and their topics; planted asks for a price, a time, an attachment GAP lacks, a
security answer, a commitment and buyer agreement, with no value written outside the placeholders and each listed as
missing; a held material linked and cited; no answer for an opt-out, a referral or a notice; the PARTIAL dependency;
copy, preview, a changed text refused, CONFIRM + SEND once in their thread as HUMAN_APPROVED_1TO1, a replay already
sent; a draft not a send and the send refused over it; every control at the click; the route with no sender, with
placeholders, an em dash and a non-owner; the panel's three actions; the mailbox bound at confirm and a newer message making it stale; the copy guard) and
scratch `reply-answer.scratch.test.ts` (7; the first six through
the real route on Postgres with the sink and the clawd stub: a reply with three asks prepared with three placeholders
and nothing invented; copy recorded with nothing sent; the placeholder text refused; a suppressed recipient refused
at the wire after preview; CONFIRM + SEND one threaded message, one EmailLog row; a replay already sent; a second reply
drafted in its thread, then its send refused; a referral and the corpus opt-out refused on all three with nothing in
the sink). `work-today.test.tsx` (+1: more than 500 rows today keeps the newest, and a reply answered from GAP counts);
`reply-prep.test.ts` and `reply-prep-view.test.tsx` now pin the prepare control and the no-answer lines;
`reply-classify.test.ts` (+3: six real replies that mention a delay, a vacation or the office STAY HUMAN and hold the
account; the canonical notice stays out-of-office with a colleague to contact; an opt-out inside a notice is an
opt-out); `seller-draft.test.ts` (+2: a real reply that mentions a vacation holds, a notice by its body and a
bounce do not); `referral-hold.test.ts` (4: by email anywhere or full name at the account, never the referrer or a first
name; done or skipped releases, a snooze does not; only referral rows are read and folded; unreadable throws); the
gate tests in `seller-draft.test.ts`, `enroll-service.test.ts` and `routing-rules.test.ts` (R5b, the rule order); and
a seventh scratch step (the referral obligation written by the real commitment writer and read by its JSON path on
Postgres; another kind naming the same person holds nothing; skipped releases).
Eighteen deliberate mutations (a fabricated price, a referral answered, a later opt-out ignored, placeholders let
out, a send previewed over an open draft, a changed text confirmed, a non-owner drafting or sending; any notice phrase
read as an out-of-office, a notice beating an opt-out, the send gate, live enrollment or routing ignoring the
referral hold, a done or skipped referral still holding, a first name alone matching, the account-reply hold reading the subject
only, the confirm not binding the mailbox, the copy guard skipped, "done today" keeping the oldest rows) each turn
the owning test red. Adjacent: the whole GAP suite 371 files / 5,434 green (scratch excluded); the rest of the repository 325 files / 2,294 green (one skipped); the six scratch
files 37 / 37 on a freshly rebuilt database, one file at a time; typecheck clean. Rollback: revert the commits (new
ledger kinds only, on the inbound message; nothing outside this panel reads
them). Debt: the asks are pattern reads of their words (the seller sees each ask and edits the text); a reply that came
in only through HubSpot's connected inbox is prepared and copyable but not drafted or sent from GAP (the Gmail thread);
after a send the reply card still asks the seller to record what they said (recording is the triage, a separate step);
the audit's reuse note suggested a referral answer that thanks them and asks about the named person; the brief for
this ticket says a referral prepares no reply, and that stands. Found at the gate and fixed in its own commit:
Work's "done today" read the OLDEST 500 ledger rows of the New York day, so on a busy day the newest completions
vanished (the work-day scratch failed after three other scratch files ran the same day); it now keeps the newest 500,
shown in order, and an answer sent from GAP counts ("Answered <them> in their thread").

R43 **Follow-up execution and recovery (DONE for the plan, the holds and the recovery; PARTIAL for touch 2 and later
on the four seeded event-led families: the dependency is human-written step 1+ copy for those families, deleted by
red team T7 on 2026-09-26 and not replaced, so the plan says follow up by hand and "prepare" is reachable only for
a version that carries step 1+ copy; audit at 31f09c71).** NEW `execution/follow-up-
plan.ts` (pure): a follow-up due today says what to do from the PERSON's actual history (person-history.ts: every
proven send, every Gmail draft and its fate, every send whose outcome is unknown), the obligation's due day and the
holds: held (an open or unreadable deal, an opt-out; no follow-up while it stands, and it never promotes a held
account), outcome unknown (a send of the next touch was started and its answer lost: check Gmail Sent, never resend),
complete (the next touch already went out), draft saved (a Gmail draft of the next touch is SAVED, not sent; GAP counts
it only once Gmail shows it sent), a justified wait (when, and since which touch), prepare (the family has copy for
the next step: the existing card and its seller-send preview) or by hand (no follow-up copy, which is every seeded
family today: follow up in the same thread, then mark it done). `execution/follow-up-load.ts` reads the plans for the
follow-ups due on Work (bounded) and `reconcileFollowUpsFromSent` (run by the `gap-mailbox` cron after the unknown-send
reconcile) closes a follow-up sent by hand from the GAP mailbox: Sent after the last recorded touch, minus every
message GAP recorded, holding a message to that person, is the proof (`mailbox_sent`); no ledger send is fabricated
for copy GAP did not render; an unreadable mailbox writes nothing. At the click (`seller-draft.ts`, the one send
authority, stricter only): a follow-up is now refused `emailed_outside_gap` when Sent holds an unrecorded message to
the person after the last recorded touch (`mailbox_sent_unreadable` when Sent cannot be read), as the first touch
already was. Harness only: `GAP_SINK_FAULT=timeout_after_write` makes the sink keep the message and then lose the
answer, the way a provider timeout after acceptance looks (the sink never runs in production). Proof:
`follow-up.test.ts` (5: prepare versus by hand; the justified wait, a saved draft never a send, a sent draft complete,
the unknown send, the hold; the plan on Work and a held follow-up not promoting a held account; the Sent reconcile
closing the obligation with the message, ignoring GAP's own recorded send and writing nothing on an unreadable read;
the click refusing a follow-up over one sent by hand) and the sprint's scratch file
`tests/unit/gap/scratch/work-day.scratch.test.ts` (real routes, gates, ledger, Postgres; the sink as the mailbox):
three tabs press CONFIRM + SEND on one email together and exactly one leaves (one sink message, one DIRECT_SENT, one
EmailLog row), every other tab refused by whichever gate first sees the winner (the open claim, the ledger, the
stale-card read of the EmailLog, the mailbox Sent read) or answered ALREADY SENT (stressed ten runs, green); the provider
accepts and the answer is lost: the claim stays open, the retry is refused `send_in_progress_or_unknown` and writes
nothing, and the Sent read reconciles it so the next press answers ALREADY SENT; a deal opens between preview and send:
the confirm is refused `active_opportunity` and nothing leaves; every proven send leaves one waiting follow-up and a
re-read makes no second. Six deliberate mutations (a follow-up over one sent by hand, a saved draft read as sent, the
Sent reconcile counting GAP's own send, an unknown send offered again, a lost answer read as not sent so the claim is
released, an open deal ignored at the click) each turn their owning test red, the last two on the scratch database.
Adjacent: 21 files / 278 green; typecheck clean. Rollback: revert the commit (the cron report gains one key; the
reconcile writes only commitment rows). Debt: no next follow-up is proposed after a by-hand follow-up (the obligation
closes; the next touch waits for a new send or the seller's own task); the follow-up copy family (step 1+) does not
exist, so "prepare" is reachable only for legacy multi-step versions.

R44 **Capture a conversation once (DONE; dictation stays off).** The note is kept verbatim WITH its source: Capture
opened from a Work card, a reply, an obligation, a meeting or the account page carries the account, the person (only
one at that account, checked by the page and the store), the deal (its name: the account read holds no deal id) and
the conversation in the link (`/gap/capture?account=&person=&deal=&context=&from=kind:id`), and the note stores
`dealId` and `source` (an unknown source kind is dropped, never trusted). Each Work card offers it ("Log what they
said" on a reply, as an email with the person who wrote; "Log the meeting" with a meeting due; "Log a conversation"
otherwise, with the deal on a deal card); the account page's "Log what happened" carries the deal and the chosen
person. `capture/extract.ts` now reads every sentence with its speaker and whether the seller said it
(`noteSentences`): a pasted summary (a "Summary:", "AI summary:", "TL;DR:", "Key takeaways:", "Action items:" or
note-taker block, to the next blank line) and the seller's own read on an unlabelled line ("I think", "my guess",
"probably") are NEVER proposed as buyer words and are listed with why; a labelled buyer line saying "I think" is still
theirs; a bullet marker is layout, not words. NEW `extractCommitments`: a buyer asking the seller for something (the
seller owes a deliverable), the seller promising something (the seller's own words, recorded as "You", never a buyer
quote), a buyer promising something (waiting on them, then a chase), a meeting named with a day (prepare it); the day
is read in New York from when the note was saved, the thing owed without the day words, and an ambiguous day ("next
Friday") is flagged for the seller to check. The review is ONE concise press (`decideBatch`, op `batch`): every
statement and every obligation kept by default or rejected, each corrected on its own (a relabelled type, a shortened
quote that must stay inside its sentence, who said it, what is owed, the day), each item through the same single
decision (a statement becomes a human-confirmed BID only with its exact words and its speaker, as before; an obligation
becomes an R40 commitment with the note and candidate as its one-shot source, the deal from the note, the verbatim
sentence and its speaker as its basis), one refusal never blocking the others and each answer said per item; the
single Confirm / Reject per statement stays for a one-off correction. Dictation: unchanged and off (transcription spend
not authorized; a press shows why and records nothing). Proof: `capture-once.test.tsx` (7: speakers, owners, kinds and
New York days of the four obligations in one note saved late in the evening; summaries and the seller's own read never
proposed, a seller line that sounds like data never a statement, a buyer's "I think" kept; the note keeps its source,
deal and person; confirm all, correct one, reject one in one press, the commitments with the edited title and day and
the right status, a second press recording nothing twice; one refusal not blocking the others and a seller promise in
the seller's own words; Capture opened prefilled from a reply, a deal and a meeting; the screen saving the prefill and
dictation recording nothing) and the scratch file (the note through the real routes, one batch, the commitment due on
that Friday at 9 am New York, a second press recording nothing); seven deliberate mutations (the seller's read as a
quote, a summary as quotes, a seller line as a statement, an obligation decided twice, a refusal stopping the batch, a
buyer promise made the seller's, Capture forgetting what opened it) each turn their owning test red. Adjacent: 26 files
/ 367 green; typecheck and lint clean. Rollback: revert the commit (older notes read with no obligations; the
commitments already written stay). Debt: the obligation and object reads are patterns over the sentence (the seller
edits the title and the day in the review); a deal is referenced by name.

R45 **Close the day and retain tomorrow (DONE).** NEW `work/today.ts` (pure) + `components/gap/work-today.tsx`: a small
"Today" panel on Work, derived from actual state with NO new storage: done today (the New York day; read from the
ledger and the dispositions by `loadCompletedToday`: sends GAP proved, answers recorded by a person, obligations done or
skipped, notes saved, the seller's outcomes; an AI suggestion is never "done"), owed to buyers (every open buyer
obligation, whatever its day), waiting on them (follow-ups not due, a buyer's promise not due, a first touch out) and
tomorrow (what becomes due at any time tomorrow that is not due today: an obligation's day, a snooze coming back, a
meeting on tomorrow's calendar), each group counted and listed (the count is its list). "See tomorrow"
(`/gap?day=tomorrow`) shows Work as it will stand at 8 am New York tomorrow, read only and labelled (every write
still happens at the real time; the follow-up sweep never writes in the future; every gate re-runs at the press).
Legacy competition removed from the Work surface, the actionable result wins: a fresh pursuit summary's actionable
result IS the card's action, its ABSENCE included (before, a summary that allowed nothing fell back to the lane's
mapping, so a follow-up state the workspace held could still offer "Open the follow-up"; the lane mapping now speaks
only for a summary written before R10), and the legacy NEXT UP list no longer renders beside an empty Work list (its
pick is no longer computed). Proof: `work-today.test.tsx` (7: done is today only in New York at 11:30 pm, owed, waiting
and tomorrow including a 9 am snooze return and a meeting; the panel's counts equal its lists; done read from the
ledger with yesterday's rows and an unconfirmed disposition left out; the actionable result's absence wins where the
lane mapping would offer an action; Work renders no NEXT UP; a pure mixed session read today and the next day with
no omitted task, the Friday obligation still on Friday, the snooze away until its day, the reply still waiting, the
meeting tomorrow's work) and the sprint's scratch file: a mixed session through the real routes (a reply, two sends,
a snooze through the outcome route, a captured obligation due Friday, a meeting tomorrow as the meetings table stores
it) read today, then the next morning and a day later by ANOTHER database client (a restart, another instance): no
task omitted on any read (every open obligation is on a card, in Waiting or in Snoozed), nothing done by itself and no
phantom Done the next day, the Friday obligation still due that Friday at 9 am New York and every follow-up's due time
unchanged, the snooze away until its own day, the reply still waiting until recorded, the meeting an obligation the
next morning. Browser receipt (headless Chrome on the scratch server; scratchpad `r45-journey/`: `journey.json` and six
step screenshots plus the card, the Today panel and the tomorrow preview): Work shows Jo's reply as the card with the
message, the prepared notes ("They asked...", "They named a day: Friday (Oct 9)"), the no-copy line and exactly two
ways out -> "Log what they said" opens Capture with the account, Jo, Email and "Opened from a reply" -> the note's
obligation "Send Jo the two-site comparison" due Oct 9, the statement with Jo as speaker and the "I think" line never
proposed -> one press records both -> Work's Today panel owes it ("Due Oct 9") and lists the note as done, the reply
still the card -> tomorrow's preview ("Tomorrow, Wed, Oct 7") still owes it on Oct 9 with nothing done. Five
deliberate mutations (yesterday read as done today, the done read from UTC midnight, a lane card competing with the
actionable result, tomorrow read in the morning so a 9 am return is missed, and both layers of the done-today filter
removed on the scratch database) each turn their owning test red. Rollback: revert the commit (nothing stored).
Debt: the preview carries no pursuit summaries (they are fresh for 15 minutes of the real clock), so its cards speak
the lanes' words; "owed to buyers" lists every open buyer obligation, not only those due this week.

**Sprint 4 batch gate (2026-10-06; R40 to R45).** Exit met on the scratch harness: replies, follow-ups, meetings,
buyer obligations and prepared prospecting form one persistent, explainable daily queue, and a mixed session resumes
correctly the next day. The full GAP suite 363 files / 5,350 tests green; the rest of the repository 325 files /
2,288 green (one skipped); typecheck clean; eslint on the 51 changed TypeScript files: the 20 remaining errors are
identical at the pre-batch commit (the house `prisma: any` signatures in `disposition/service.ts` and
`replies/list.ts`, the mock generics in `contract-parity.test.ts`). Scratch, on a freshly rebuilt database, one file at
a time: `anchor-draft` 6, `job-led-send` 5, `send-spine` 8, `work-day` 6 (25 / 25). Browser receipt: scratchpad
`r45-journey/` (Work -> reply -> Capture -> the obligation -> tomorrow). Deliberate mutations across the batch: 39,
each turning its owning test red (two on the scratch database). Production: nothing written, no flag changed, no
send, no paid call. Deploy notes: no schema change and no new table (the new ledger kinds are `account.commitment`
and `account.priority`); the `gap-mailbox` cron report gains `followUpsFromSent`; the first Work load after deploy
runs the follow-up sweep over the last 30 days of proven sends (it creates waiting follow-ups, writes nothing else).
Carried debt (each recorded in its entry): the indexed commitment projection when the rows grow; pattern reads for
names, asks and obligations in replies and notes (the seller confirms them); no reply copy family (the reply answer
is now prepared and editable: R42b) and no follow-up copy family (fails closed); no next follow-up proposed after a by-hand one; the tomorrow preview speaks the lanes' words;
a meeting accepted by email has no time on record; three pre-existing backspace-mangled patterns outside this sprint
(`story/propose-family.ts` line 49, `entity/providers.ts` `modelGone`, `hubspot-poller.test.ts` lines 708 to 710).

**Sprint 5. R50 Intelligence and actions scoped to the right opportunity (DONE).** HubSpot stays the deal authority:
the account read now keeps each open deal's HubSpot id beside its name, stage, next step, close date and contacts
(`account-intel/load.ts`; the In Deals summary keeps the id, close date and next step too). ONE scope rule, NEW
`deals/scope.ts` (pure): a row's RECORDED scope wins (a commitment's `dealId`, plus an optional division / site now
accepted by `POST /api/gap/commitments`; a BID's `metadata.scope`, now accepted by `POST /api/gap/bids` as an optional
`scope` and written by Capture when the note was opened on a deal); else the person's single open deal through their
HubSpot contact, said as "through <person>"; else ACCOUNT-LEVEL, labeled so wherever it is shown. A person on two
deals stays account-level (one person's words are never transferred to every opportunity they touch); a legacy deal
NAME (R44 notes) resolves only when it names exactly one open deal; a closed deal's id or an unmatched name keeps its
own label ("scoped elsewhere"), never guessed and never dropped. NEW `deals/opportunities.ts` (pure) +
`deals/workspace.ts` (the read) + `components/gap/deal-opportunities.tsx`: on the account BRIEF each open deal shows
ONLY its own open obligations, its own confirmed buyer words, the people GAP holds who are its contacts, HubSpot's own
next step and close date, and its own actions (Capture opened on that deal by id; the deal in HubSpot); account-level
rows are their own group; one deal brief per deal (`buildDealBrief` with the deal and the scope rule: that deal's words
plus the tagged account-level ones, never the other deal's; without a deal it is unchanged). The NOW obligations list
says each row's scope. Capture links carry the deal's HubSpot id and its name (`deal`, `dealName`; the note stores
both), from the account page and from a Work card (the card's top obligation's deal, else the account's only deal).
An open deal still blocks cold outreach (unchanged gates; the pursuit state stays in_deal with no cold touch) without
suppressing deal work: NEXT names every open deal ("Work the 2 open deals (...) each on its own"), Work ranks a due
deal step as deal work with "Deal: <name>" on the obligation. Proof: `deal-scope.test.tsx` (9: the scope rule, the
legacy name, two deals under one company each holding only its own obligations and words with nothing listed twice,
the per-deal brief, the rendered view, the pursuit state and NEXT, the Work card and its Capture link); five
deliberate mutations (a person on two deals transferred to the first, account-level rows shown as every deal's, a
per-deal brief keeping another deal's words, a legacy name guessed onto the first deal, Capture binding to the first
deal) each turn it red. Corpus: Kroger Scratch Co now carries two open deals in the stub, each with its own contact
(Ann on the yard pilot, Ben on the Columbus DC deal; tag-unique ids); the stub answers deal -> contacts and contact ->
deals from the deals file. Adjacent: 18 files / 256 green; typecheck clean. Rollback: revert the commit (older rows
read account-level; the new optional fields are ignored). Debt: the contact-derived binding needs the person's HubSpot
contact id (a person GAP holds without one reads account-level); division and site are free text the seller names (no
site entity).

R51 **Meetings prepared from the current conversation (DONE; no new calendar connector).** NEW
`deals/meeting-prep.ts` (pure) + `components/gap/meeting-prep.tsx`: ONE preparation per meeting on record (the
Meeting table the account context and Work already read): the objective (the row's own, "Recorded", else the first
thing still unknown, "Suggested"), who is coming with their role (the names on the row matched to the people GAP holds,
then the deal's own contacts, "HubSpot"), the last commitment (the newest obligation on that deal or account-level),
the confirmed needs (ONLY human-confirmed buyer words scoped to that deal plus the labeled account-level ones, "Buyer
confirmed"), the open questions (the seller's own learning objective first, then the deal brief's discovery question
for every truth section still unknown, "To learn"; `deal-brief.ts` now exports `unknownSectionsOfTypes` and
`openQuestionsFor`), the working thesis as a guess to test ("Our guess", never a finding), at most two verified public
facts AFTER the buyer's words and never in their place ("Public source", "not the buyer's words"), and the account's
materials ("Ours"). Every line carries its trust word. A meeting belongs to its row's deal (`hubspot_deal_id`), else
to the one deal whose contact is named, else to the account (`meetingDeal`). On the account BRIEF each deal's meetings
render inside that deal (R50's slot), the others under "Meetings"; the loader (`deals/workspace.ts`) reads the meeting
rows, the confirmed words and the learning objective once, soft. Work follows the calendar, read on every load
(`work/day-load.ts` `loadMeetingRows`, `meetingInstant` moved beside the prep): a meeting within 24 hours is an
obligation carrying its prepared starting point ("Prepared: Objective: ... First to learn: ... Last commitment: ...")
and opening `?view=brief#meeting-<id>` (`loadMeetingStartingPoints`, one read of the meeting accounts' confirmed
words, a deal's meeting never reading another deal's); a moved meeting is read at its new time; a CANCELED meeting is
said once in Waiting ("Canceled: nothing to prepare unless it is rebooked") and an open "prepare the meeting"
obligation at that account waits until a meeting is booked again. Proof: `meeting-prep.test.tsx` (10: the full
preparation and its trust words; nothing confirmed means no confirmed needs while the guess and the news keep their own
words; the suggested objective and the seller's own; canceled and moved; the meeting's deal; the view; Work's
obligation with its starting point, the moved meeting, the canceled meeting and its preparation, the rebooked one; the
loader's canceled rows and the per-deal starting point); six deliberate mutations (public facts read as confirmed
needs, the guess tagged as confirmed, a canceled meeting prepared, Work asking to prepare a canceled meeting, a meeting
reading another deal's words, the card losing its starting point) each turn it red. Corpus: Kroger carries a
Columbus yard walk with Ben tomorrow at 10 am New York on the Columbus deal and a CANCELED pilot scope call with Ann on
the pilot deal. Adjacent: 13 files / 125 green; typecheck clean. Rollback: revert the commit (no stored shape changes).
Debt: attendees are the row's free text (no calendar attendee list); a meeting's history (the old time of a moved
meeting) is not kept, only its current row.

R52 **A practical mutual action plan (DONE).** NEW `deals/action-plan.ts` (pure) + `deals/action-plan-store.ts` +
`POST/GET /api/gap/deals/plan` + `components/gap/deal-plan.tsx`, inside each deal on the account BRIEF. A milestone
IS an R40 commitment scoped to the deal (kind `deal_step`, the deal's id, source `plan:<dealId>:<step>`, one-shot: a
second agreement makes no second record): the next milestone, the responsible person (the seller, or someone on the
buyer's side: theirs waits on them and becomes due on its day), the due day, what it follows and what proves it done
(`detail.milestone / proofNeeded / after / responsible`). GAP proposes the five standard steps (discovery, site
validation, pilot, stakeholder alignment, procurement); a proposal is NOT a commitment and never Work, and the seller
reviews them in ONE press (keep with edits, or decline; each answered on its own, one refusal never blocking the
others; R44's review shape). A declined step is an append-only `deal.plan_decision` row and is not proposed again; an
agreed step cannot be declined. Unknown fields create no administrative task: an agreed milestone with no date reads
"No date agreed yet" (`commitmentPhase` now says upcoming, never due now), stays out of Work, Waiting and Today's
"owed" (it lives in the plan), and "Who: not set" asks nothing. The buyer's agreement is ALWAYS shown and never
fabricated: "Buyer agreement: not recorded" until the seller names who on their side agreed and the day (in the
review, or later through `op: buyer_agreed`, only on a milestone); agreeing in the review is the seller's agreement,
not the buyer's. `work/commitments.ts` gains `amendCommitment` (a new snapshot of title, due or detail, same lock,
terminal refused); `SOURCE_KINDS` gains `plan` and `deal`. Proof: `action-plan.test.tsx` (7: five proposals and no task;
one review agreeing, editing, declining and refusing a malformed buyer agreement; one record per step, no decline
after agreement, a declined step stays declined; an undated milestone never due, never in Waiting or owed, a dated one
deal work on its day; the buyer's agreement recorded later, only on a milestone; the real route; the view); six
deliberate mutations (the seller's agreement read as the buyer's, an undated milestone due now, an undated milestone
in Waiting, a declined step proposed again, agreeing twice making a second record, an agreed step declined) each turn
it red. Adjacent: 12 files / 109 green; typecheck clean. Rollback: revert the commit (agreed milestones stay ordinary
deal-step commitments; decision rows go inert). Debt: the standard steps are one fixed list (no per-deal template);
the plan is not mirrored to HubSpot (R54 proposes notes and fields, never a plan object).

R53 **The next deal artifact or stakeholder move, prepared (DONE; nothing is sent).** NEW `deals/artifacts.ts` (pure)
+ `components/gap/deal-artifacts.tsx`, inside each deal on the account BRIEF, from the deal's own confirmed context
(R50), its plan (R52) and its open obligations: the AGREED RECAP (the buyer's confirmed statements in order and in
their words, each cited by its BID, the account-level ones labeled; then only the next steps the BUYER agreed, i.e.
milestones whose buyer agreement the seller recorded, the others left out and said so; then what the seller owes, as
the seller's; an open invitation to correct it), the INTRODUCTION REQUEST (to the deal's contact, naming who else must
agree and the stakeholder-alignment step's state), the PILOT SUCCESS CRITERIA (only the buyer's own measures: their
numbers, their picture of good, their requirements; with none confirmed it asks the question and invents no target)
and the BUSINESS-CASE INPUTS (the ROI model stays "Modeled, not measured" with its version and inputs shown, the buyer's
numbers cited as theirs, YardFlow's proof in the canon's words labeled as YardFlow's measured result at 24 live Primo
Brands sites and "not a forecast for your yards", and what is still needed from them). `nextArtifact` picks the one
the deal needs now, deterministically, and its `why` names the actual commitment or blocker and the person ("3
confirmed statements from Ann Scratch and Cal Scratch on YardFlow - Kroger: send them back so Ann can correct them,
with the 1 step they agreed"). No governed copy family exists for deal artifacts (the compiler's families are
first-touch), so each is a text block labeled "Prepared, not sent" with its citations, what it could not say, and a
copy control that sends nothing. `artifactProblems` (the guard) refuses an em dash, "throughput", a canon figure
without its qualifier (`compiler/canon.ts`) and any claim of the prospect's acceptance or of legal, security or
procurement approval that is not inside the buyer's own quoted words; a flagged text cannot be copied. Proof:
`deal-artifacts.test.tsx` (7: the recap and its citations and left-out steps; nothing confirmed; the introduction and
the business case; the guard including the buyer-quote exemption; the next-artifact order; the view and its copy
control; a flagged text not copyable); six deliberate mutations (the seller's agreement presented as the buyer's, the
model losing MODELED, the guard missing an approval claim, the guard flagging the buyer's own words, invented pilot
criteria, the recap always chosen) each turn it red. Adjacent: 5 files / 51 green; typecheck clean. Rollback: revert
the commit (nothing stored). Debt: the texts are fixed templates around the buyer's words (no generated prose); the
recap does not know whether one was already sent (no record of a sent recap exists outside the seller's mailbox).

R54 batch item 9 (2026-10-07): approved writes moved to their own flag, `GAP_CRM_APPROVED_WRITES_ENABLED` (default
off; the automatic mirror keeps `GAP_HUBSPOT_MIRROR_ENABLED`), so "the same flag" below now reads that one. An approval
and a retry are bounded to live work (`originProblem`: an obligation done or skipped, or a deal the closure ledger
closed, answers 409 `origin_closed` with nothing recorded or called; an origin GAP does not hold, or a recap whose id is
not its own text, answers 400 `bad_origin`); the approve route also requires the deal to be an open deal of the account
(the In Deals read, a stale cache re-read once; unreadable is 409 `deal_unverified`). An obligation's task is keyed on
the obligation and the kind, so amending it revises its ONE task (approve again; a written task is updated in place,
never created twice); a done obligation proposes `task_complete` (its task, found by its GAP reference, is marked
COMPLETED); a deal field's id carries the value the seller saw, so after a conflict the step is proposed again from
HubSpot's newer value. Tasks carry the approver's HubSpot owner and, undated in GAP, are due the next business day.

R54 **Bounded, recoverable CRM sync (DONE; HubSpot writes stay OFF in production).** Inspected first: the only
HubSpot WRITE path is `hubspot-mirror.ts` (automatic hypothesis and disposition notes and two GAP properties, behind
GAP_OS_ENABLED + GAP_HUBSPOT_MIRROR_ENABLED + HUBSPOT_SYNC_ENABLED, idempotent through `gap_hubspot_mirror`); that
already-authorized automatic logging is reused unchanged and nothing new is automatic. NEW `deals/crm-model.ts` (pure),
`crm-sync.ts` (the store) and `crm-writer.ts` (the SDK writer, beside the mirror and gated by the same flag: the deals
surface stays write-free and the mirror stays deal-free, both existing structural contracts kept and the writer
pinned never to touch a stage, pipeline or lifecycle), `POST/GET /api/gap/crm-sync` and
`components/gap/crm-sync.tsx`, inside each deal on the account BRIEF: any OTHER HubSpot change GAP would make (the
agreed recap as a deal note, a task per open seller obligation on the deal, at most three, and the deal's next step
from the plan's next agreed milestone when it differs) is shown EXACTLY as HubSpot would hold it, with its origin, and
needs ONE explicit approval click: append-only `crm.sync_proposed` (once: the id is the origin, kind and exact content)
then `crm.sync_approved`, recorded whether or not the write may run, then a `crm.sync_attempt` and a `crm.sync_result`
(subject `crm_sync`, the account in every payload; no new table). The write runs only with GAP_OS_ENABLED,
GAP_HUBSPOT_MIRROR_ENABLED, HUBSPOT_SYNC_ENABLED and a token; otherwise the state is "Approved, not written: HubSpot
writes are off here (<the flag>). Nothing reached HubSpot." Idempotent retries, three layers each pinned on its own:
the claim (a written proposal answers written with no call; an attempt in flight under a minute answers "in
progress", so a double click or two tabs never write twice; the claim is taken under an advisory lock, the HTTP call
is outside the transaction), the mirror ledger row (`gap:crm:<proposal id>`, the hubspot-mirror encoding), and the
stable external id in the payload (`GAP reference gapcrm<id>`, searched for before any create, so a write whose
answer was lost is RECOVERED, never duplicated). Visible states: proposed, approved (in flight), off, written (its
record id), failed (the reason; the full text kept; retry is safe), conflict, discarded. Conflict resolution: a deal
field is read with its history before it is changed; a value different from the one the seller saw, or a change
after the proposal by anything but GAP, is a CONFLICT and never overwritten; only `hs_next_step` may be proposed.
Origin tracking: every proposal names what in GAP produced it, and the route accepts only an origin GAP holds for that
deal (an obligation or milestone at the account and deal, the deal's recap). A CRM outage loses neither the text nor a
local completion (the obligation's done stands; the proposal keeps its body). Stub: write endpoints that record
(notes and tasks with their search, a deal's properties with history and their update; STUB_WRITES_FILE) and can be
told to fail (`/__stub/control` failWrites true or after_write: the write kept and the answer lost) or to play a human
edit (`/__stub/deal-property`). Proof: `crm-sync.test.tsx` (12, with a controlled HubSpot writer: the exact change
recorded once; writes off with the approval standing and no call; written once and no second call; each idempotency
layer on its own; down then retried once; the lost answer recovered by its external id; the newer human value never
overwritten and the unchanged one updated; in flight and discard; the outage keeping the completion; the candidates;
the real route with writes off and the origin refusals; the view); eight deliberate mutations (writing with writes
off, no read before write, overwriting a newer value, the claim forgetting a written result, the mirror row ignored,
a double click writing, the approval not recorded, an unknown origin accepted) each turn it red. Adjacent: 7 files /
102 green; typecheck clean. Rollback: revert the commit (the rows go inert; nothing was written to HubSpot in
production). Debt: a deal task's owner in HubSpot is not set (the portal's default); the search-before-create needs
HubSpot's search index to have caught up (a retry inside its indexing delay could still create a second note; the
mirror row and the claim cover the ordinary retry).

R55 **Stalled, won, lost and reactivated work (DONE).** Closure is read from HubSpot, never from a stage name: the
deal reads now ask `hs_is_closed_won` with `closedate`, and the ONE opportunity resolver keeps every closed deal with
how it ended and when (`ClosedDeal`; CLEAR and ACTIVE carry `closed`). With no deal open, `closureOf` (pure) says
what a closed deal means and `resolveAccountOpportunity` attaches it to CLEAR (`closure`), so every reader gets the
same answer: a deal closed WON makes a CUSTOMER (whatever else was lost): no first-touch campaign, ever automatically,
and post-sale expansion is explicit context ("any expansion is your explicit call, worked with the customer, never a
cold sequence"); otherwise the newest closed deal PARKS the account ("closed lost" or "without an outcome") until
something material happened after it closed (`materialChangeSince`: a verified fact registered for the account, or a
reply a PERSON wrote; an automatic notice, a bounce or an opt-out is not; an unreadable store keeps it parked). The
closure holds everywhere through the existing authorities: the action-time check (`makeActiveOpportunityCheck`, the
same terminal refusal as a live deal, worded as the closure, so no draft, send or enroll), routing (R3b
`active_opportunity:closed_won_customer` / `closed_lost_parked`), the approach (`decideApproach`: no cold motion,
the closure's words), the brief's deal statement and the pursuit state (`held`: "a customer (closed won)" or "parked
after a lost deal", with what unlocks it). History is preserved and obsolete work stops (NEW `deals/closure.ts`): an
append-only `deal.state` row per deal per change; when a deal closes, every open obligation on it is SKIPPED with its
reason ("the deal "X" closed won on Oct 5; kept for history"), terminal and kept, and when no deal is left open the
account's cold follow-ups stop (a customer: "no cold follow-up"; lost: "parked"); when a deal REOPENS, ONE current next
step ("Reopened: decide the next step on X", source `deal:reopen:<id>:<day>`) and nothing skipped at the closure comes
back; first sight records the baseline; an UNKNOWN read changes nothing. It runs on the account page read and in a
bounded Work sweep (`sweepClosedDeals`: accounts whose deal-scoped work left the portal's open deals, five at most,
every five minutes per instance, never without the open-deal read). Stalled work (NEW `deals/stalled.ts`, pure) comes
only from the record, never a probability: an obligation on the deal overdue by more than two days (the seller's, or
a buyer's promise that did not arrive), no HubSpot activity on the deal for 21 days, a close date that passed while
the deal is open (a HubSpot date stored at UTC midnight reads as its calendar day); on the account BRIEF inside the
deal and on Work, where a stalled open deal becomes deal work with "A stalled deal: ..." on its card (a healthy one
stays held). Contract change, on purpose: a CLEAR read now carries the closed deals, and a closed deal with nothing
material since parks the account at the gates (four older controls that read "a closed deal does not count, proceed",
in the resolver, draft, enroll and cold call / LinkedIn suites, now prove both sides: with a newer verified fact it
proceeds; without it is parked). Corpus: Costco Scratch Co (a
closed-won deal, an approved thesis and a chosen person: held as a customer) and Sysco Scratch Co (closed lost Sep 1,
only an older fact: parked); the stub reports `hs_is_closed_won` and `closedate`. Proof: `deal-closure.test.ts` (11:
the resolver's closed deals; customer, parked, unparked, no outcome; the material change; the gate refusing at a
customer and a parked account and proceeding after a newer fact; routing, the approach and the pursuit state; the won
closure skipping the deal's work and a re-read changing nothing; the lost closure stopping cold follow-ups; the reopen
making one next step and reviving nothing; the bounded Work sweep; the stalled lines; Work's stalled card); eight
deliberate mutations (the gate, routing, a lost deal never unparking, an automatic reply as a change, the pursuit
state reading a customer as ready, a closed deal's work left open, every re-read making another next step, a healthy
deal read as stalled) each turn it red. Adjacent: 21 files / 536 and 9 files / 60 green after the three controls were
restated; typecheck clean. Rollback: revert the commit (the `deal.state` rows go inert; skipped obligations stay
skipped, their reasons on record). Debt: "paused" has no HubSpot field of its own (a custom open stage still reads as
an open deal); the Work held card for a closure says the routing hold's generic words until the account's pursuit
summary is fresh.

**Sprint 5 batch gate (2026-10-06; R50 to R55).** Exit met on the scratch harness: GAP supports commercial execution
after the first reply and through an active deal while HubSpot remains the deal authority (every deal, stage, contact,
next step and closure is read from HubSpot; GAP writes HubSpot only through an approved, flag-gated proposal).
Commits: R50 b5b961a9 (+ 3087ee2c the Work page kept the deal ids, 31f09c71 the two-deal state line), R51 0b0676fe
(+ 79442298 a meeting on another deal is not a rebooking), R52 ea3645f2, R53 7eb8bcc8 (+ 47c61140 the em-dash
escape), R54 bef11ba1 (+ 32683cdd the writer and the store moved out of the deals surface, keeping its write-free contract and the mirror's deal-free one), R55 f214bcc3 (+ 359b790f the cold call and LinkedIn control restated), the scratch run 5488552c. The full GAP suite 369 files / 5,408 tests green (its first run found the two structural and control failures fixed in 32683cdd and 359b790f); the rest of the repository 325 files / 2,293 green (one skipped); typecheck clean; eslint on the 62 changed TypeScript and script files: no finding on any changed line (the 50 errors left in those files are the house `prisma: any` signatures and fixture generics, untouched). Scratch, on a freshly rebuilt database,
one file at a time: `anchor-draft` 6, `job-led-send` 5, `send-spine` 8, `work-day` 6, `deal-work` 5 (30 / 30); the new `deal-work.scratch.test.ts` runs the real routes, services, ledger and
Postgres with the harness's own HubSpot stub spawned on a loopback port (the real resolver and the real CRM writer
against it; GAP_HUBSPOT_MIRROR_ENABLED turned on only inside that test, only against the stub, with the loopback
asserted): two deals under one company, the closed-won customer, the closed-lost account, the scheduled and the
canceled meeting (three deliberate mutations red on the scratch database). Browser receipt (headless Chrome on the
scratch server, GAP_HUBSPOT_MIRROR_ENABLED unset; scratchpad `r5-journey/`: `journey.json` and six screenshots): the
Kroger account in two deals ("Work the 2 open deals (...) each on its own, never a cold first touch"; the obligation
labeled "Deal: YardFlow - Kroger") -> the deal brief with each deal's own obligations, words, contacts and HubSpot next
step and one deal brief per deal -> the Columbus walk prepared inside the Columbus deal, every line tagged (Recorded,
Buyer confirmed, To learn, Public source) and the pilot call shown "Canceled ... Nothing to prepare unless it is
rebooked" -> the plan reviewed in one press ("Record the plan (4 agreed, 1 declined)": undated milestones "No date
agreed yet", the pilot "Waiting on Ann Scratch ... due Oct 30", every "Buyer agreement: not recorded", procurement
declined) -> the recap "Prepared, not sent" in Ann's words with its citation, copied with "Copied. Nothing was sent."
-> the HubSpot note shown exactly with its GAP reference and approved: "Approved by casey@freightroll.com, not
written: HubSpot writes are off here (GAP_HUBSPOT_MIRROR_ENABLED is off). Nothing reached HubSpot.", the stub's request
log holding no note, task or deal write. Deliberate mutations across the batch: 44 (three on the scratch database), each turning its owning
test red. Production: nothing written, no flag changed, no send, no paid call, no HubSpot write. Deploy notes: no
schema change and no new table (new ledger kinds `deal.plan_decision`, `deal.state`, `crm.sync_proposed`,
`crm.sync_approved`, `crm.sync_attempt`, `crm.sync_result`, `crm.sync_discarded`; the mirror table gains `gap:crm:`
keys only when the mirror flag is on); the deal reads add `hs_is_closed_won`; with this deployed, an account whose
only HubSpot deals are closed lost and that has no newer verified fact or buyer reply is PARKED at every gate (a
deliberate policy change, R55), and a closed-won account is held as a customer. Carried debt (each recorded in its
entry): the contact-derived scope needs a HubSpot contact id; division and site are free text; meeting attendees are
the row's free text and a moved meeting keeps no history; the standard plan steps are one fixed list; deal artifacts
are templates around the buyer's words (no governed deal copy family) and no record of a sent recap exists; a deal
task's HubSpot owner is the portal default and search-before-create depends on HubSpot's search index; "paused" has
no HubSpot field; the Work held card for a closure speaks the routing hold's generic words until the account's
pursuit summary is fresh.

### ACCEPTANCE B DEFECT BATCH: dispositions by ticket (2026-10-07; base 7ab63c7a)

One line per ticket: fixed (with the commit) or PARTIAL (with the dependency named). Every fix has a focused test and
a deliberate mutation that turns it red; nothing here sends, enrolls, spends Apollo or writes HubSpot.

- R05 production guard: FIXED f4b3c70f (GAP_SEND_TRANSPORT=sink and HUBSPOT_API_BASE_PATH are refused under VERCEL_ENV=production).
- R24 / R30 one freshness authority (the Tulsa story): FIXED daa61ff3 (`research/currentness.ts` is the only clock).
- R33 / section 4 a story set aside comes back: FIXED 5f5e76cf (never offered again; redrafting answers story_set_aside).
- R11 / R12 / section 8 the family question: FIXED 42b21547 (never asked for job or procurement drafts; a suggested default with its basis).
- R31 / R23 Gatik is not an event, one guess everywhere: FIXED 4cf3fdb1 (partnership and software claims; fit-led; the guess and falsification read off the fact, editable).
- R33 automatic reversible preparation: FIXED c0a4e214 (Casey's approved policy; never approved, routed or sent).
- R34 production dead end until the families are seeded: FIXED 372f6609 (copy read from the seeded rows; never READY without it). Seeding the families stays a release precondition (owner action).
- R22 / R30 a closed RFP and a reposted posting: FIXED 1b6416a9 (a past due date is not current; a repost is never a job-led trigger).
- R13 binding: FIXED 1b6416a9 (the confirm binds the sending mailbox; a live enrollment binds the recipient; a losing duplicate tab is told already sent).
- R10 / R15 state vs anchor on an unread send gate: FIXED 1b6416a9 (research with the reason, no Ready target).
- R35 copy outside the compiler: FIXED 1b6416a9 (a question asking what to write is answered with the control, never the model).
- R21 / R23 a vendor announcing news about the account: FIXED 1b6416a9 (the vendor's claim, quoted_third_party).
- Family hold at routing (R62 matrix): FIXED 1b6416a9 (R3d family_hold, fail closed when unread).
- R41 / R45 / R40 Work's counts are not completions: FIXED 1e7b4aa4 (parked research and holds; Done counts completions only; a returned reminder is never completed by a skip; Done needs its proof).
- R42 out-of-office date: FIXED 7f46b334 (read from the received time).
- R50 / R44 capture scope, R51 rebooking and meeting context, R41 / R51 evening meetings, a deal contact's reply: FIXED 6abad07a.
- R43 by-hand follow-ups past the first ten, R55 legacy-name closure and sweep starvation: FIXED e2da206e (rotation cursors).
- R53 the recap is always next: FIXED 5486471f (a copied or written recap is recorded; the deal moves on).
- R42b finding 3, a sent answer is the record of the reply: FIXED 71b6ff36 (completes what it answered; the account stays in a conversation).
- R54 approved HubSpot changes bounded to live work: FIXED 280faa5a (origin_closed, one task per obligation, completion, conflict re-proposed, owner and due time, GAP_CRM_APPROVED_WRITES_ENABLED); (f) the cross-account list: FIXED 4dfa32ec.
- R20 coverage claims: FIXED 71c4c3a8 (the news cap stated; a 15% rotation margin; an outage turn recorded and never counted).
- R25 dead letter and budget: FIXED 71c4c3a8 (research_failed; an unreadable grounded budget queues nothing) and 0beca6b3 (a news daily budget). "A re-seen signal erases queuedAt" does not reproduce at this tip: a re-seen URL returns created false at capture and the runner never rewrites its metadata.
- R43 follow-up copy (touch 2 and later): PARTIAL, dependency: every seeded approach family is single-touch; a step-1 copy family must be written and seeded before a prepared follow-up exists.
- Section 8 generated quality: PARTIAL, dependency: a held-out, human-graded corpus of at least 30 cases with model, prompt and policy versions recorded.
- R15 / R61 latency: measured since (R61, below): 30 navigations per condition on the production build, judged on the full page (no remembered shell counted as content), p50, p90 and p95 recorded.
- R24 / R30 Tulsa on the production row's own fields (read-only by the lead): the corpus fact now carries them (type site_expansion, observed 2026-07-23T10:17:19Z, explicit expiry 2026-11-20T10:17:19Z, no claim class, public_secondary, metadata.change closure, no continuity key). Result: the page OFFERS it for Tom with "Current until Nov 20, 2026." (anchor-draft scratch, exact line).
- One reader for "a person wrote back" (the hold, the follow-up stop, learning): FIXED e4b555ed (`replies/classify.ts` isPersonReply; a body-only notice stops nothing and is no reply).
- DEBT, a closure typed as an expansion: `research/facts.ts:308` classifyFact gives a closure signal type site_expansion with change closure, because the signal type set is a database CHECK with no closure value (`prisma/sql/2026-09-23-gap-os.sql:51`). The change field and the family derivation read closure; anything that words `type` says expansion. The fix needs a new type value in that hand SQL applied to production (an owner-approved schema change), then the readers worded from it. The Tulsa sentence is pinned as a closure change (`continuity-research.test.ts`).

**Sprint 5 checkpoint 7cbfaf94 (2026-10-07).** Demonstrated through the running application: the production build
(`next build`, then `next start` on the scratch database, the HubSpot stub on a loopback port, GAP_HUBSPOT_MIRROR_ENABLED
unset, the send transport a sink), one headless Chrome journey on a fresh corpus copy (Kroger, two open deals), 11 steps,
all passed; scratchpad `r5-exit/` holds `journey.json` and the 11 screenshots.
- Active opportunity as actionable work: the Work card reads "In a deal", why "A buyer commitment is due: Send Ann the dock schedule template (due today)", the obligation labeled "Deal: YardFlow - Kroger ...", next "Open the deal brief", and "No cold first touch while the deal is open: work it from the deal."
- The deal state on the account page: "In 2 open deals: ..." with Next "Prepare for the meeting on Oct 8, 2026: Columbus yard walk with Ben" and each obligation labeled with its own deal; the brief shows each deal with its stage in words ("Appointment scheduled", "Qualified to buy"), its own obligations and its own buyer words.
- Meeting context: the Columbus walk is prepared inside the Columbus deal, every line tagged (Recorded, Buyer confirmed, To learn) and only Columbus words in it; the canceled pilot call says "Nothing to prepare".
- Commitments and milestones scoped to the right deal: the plan is recorded on the pilot deal (the pilot milestone "Waiting on Ann Scratch ... due Oct 30", undated milestones "No date agreed yet", every "Buyer agreement: not recorded").
- The next deal artifact: the recap is proposed on the pilot deal from Ann's confirmed words and copied: "Copied and recorded. Nothing was sent."
- Persists after a reload: the next artifact has moved on to the introduction, the plan and the CRM state are kept, the pilot obligation is done, and Work lists "Done: Send Ann the dock schedule template." under Done today.
- CRM sync, honest and recoverable: the HubSpot note shows the approved text and says the reference line in words; approved, it reads "Approved by casey@freightroll.com, not written: approved HubSpot writes are turned off here. Nothing reached HubSpot."; the stub logged 0 writes before and 0 after; Coverage offers the retry once approved writes are on.
- Closed and reopened: the Columbus deal closed in HubSpot leaves the open deals with its work kept for history; reopened, it carries one "Reopened: decide the next step on ..." step and nothing is revived.
- What Casey reads: every step's visible text is scanned for internal ids, CRM reference ids, flag or constant names, snake_case, raw null or undefined, and lane or tier words. Zero real hits; the only match is the corpus person "Bob Lane".
- Fixed to get there: 2892a800 (the HubSpot change states in seller words), 17e39096 (the production build: the Work list reached a server module that hashes with node:crypto), 7cbfaf94 (a deal stage in words wherever the seller reads it, never the id; the legacy tier / band rating no longer shown; the HubSpot link in words).
- Gates, once each, in the foreground on 7cbfaf94: typecheck clean; the GAP suite 382 files / 5,543 tests green (its 8 scratch files skip there and were run against the scratch database: 8 files / 47 tests green); the rest of the repository 326 files / 2,296 tests green (one skipped).
- Production: nothing written, no flag changed, no send, no paid call, no HubSpot write.

**Sprint 5 review dispositions (2026-10-07).** One line each; every fix landed with focused tests and a deliberate
mutation that turned its owning test red, then was restored.
- BLOCKER, meeting preparation mixed two deals' words (R50 / R51): DONE f43d5280. A meeting reads its own deal's rows; one on a deal that has since closed reads that deal's kept rows, named with its outcome; one bound to no deal labels each line with its deal; Work's starting point for an unbound meeting counts the account-level words only.
- SHOULD, a closed deal showed its raw HubSpot id and the brief dropped it (R50 / R55): DONE f43d5280 (the label) and 9f283f1a (the brief's "Closed here" line with name, outcome and date; Work names a meeting or obligation on a closed deal from the deal.state record and claims nothing when the open deals were not read). The exit journey's internal-text scan now flags any number of six or more digits.
- SHOULD, closure dropped a live promise (R55): DONE 8feafd40. The reopen step lists what the closure skipped with due dates, on the brief and on Work; Restore makes a new open obligation (the skipped record stays terminal), once per skip, refused while the deal is closed.
- SHOULD, a stale unwritten recap stayed retryable beside a new one (R54): DONE 4834eb2d. A new recap retires the earlier unwritten recaps on its deal; a replaced recap is refused at approval and at retry, is not offered on Coverage, and shows as replaced with no Retry.
- SHOULD, account-level sections showed one deal's words unlabeled (R50): DONE 6e16babd. Every buyer input carries its opportunity's label into NOW, the brief and the story; a cost in money or detention terms counts as what it costs them.
- SHOULD, artifact copy in the third person and with the CRM deal name (R53): DONE 20f244a3. Owed lines in the second person, another person's under "What I owe your team", the pilot question asked of the recipient, the CRM deal name refused in buyer text.
- NICE, a meeting within 14 days outranked a promise due today: DONE 9c0e5b14 (a meeting within a day still leads).
- NICE, "1 confirmed statement ... send them back": DONE 9c0e5b14.
- NICE, a future canceled meeting tagged Checked under What has happened between us: DONE 9c0e5b14.
- NICE, "Rests on: Ben Scratch, Oct 7" twice: DONE 0e06651c.
- NICE, a raw "2026-10-08" date in the brief: NOT TAKEN, not in a file the fixes touched (context/brief.ts); listed for R62.
- NICE, the canceled pilot call offers no rebook and HubSpot's next step still names it: NOT TAKEN, needs a decision on where rebooking runs (GAP holds no calendar write); listed for R62.

**R60 one product from Work (2026-10-07).** The loop Casey runs: see what deserves attention, open the right account,
get the prepared context, do or approve the move, record the result once, go to the next account, never learning GAP
internals. Walked first on the accumulated scratch database (201 cards: 1,273 controls and 11,563 words on Work, the
next move of 167 cards pointing into a cockpit lane, the routing repair above the work), then on a clean corpus after
each change. Checklist, what was checked and what changed:
- Work, the first screen: CHANGED 6ddb61bf. The routing repair ("N people in use without a current recommendation", Run routing) moved from above the work into System at the foot (an analyst lane still leads with it); the subtitle says the loop. 28ea4715: the health line says "recommendations", never "routing".
- Work cards into the lanes: CHANGED 90e669a0. Decide, judge, evidence and research cards opened the list of every account's cards (analyst words, no Next account); they now open their account, where NEXT holds the move, in the seller's words without the account name the card already shows. A first touch or follow-up opens its card's pack page through /gap/pack/:card (the email, the call, Send from YardFlow), which ends with Back to Work / Next account. f14b70cc: a summary remembered before this change with a lane link opens the account's own action instead.
- Replies: CHANGED 2f23daee. A reply is read and recorded on its own account (that account's waiting replies in place, under the reply), never the all-replies lane; every reply control on Work, NEXT, the follow-up card and next-up opens it there. f14b70cc: the account read takes that account's replies (the newest 200 across every account hid an older reply), and the card says the fact once, by name (it said the replier's address four times beside a panel that named her).
- The workspace: CHANGED 2f23daee. Every view, anchor, obligation and next move of the account keeps Back to Work and Next account; deal work opened from Work (the brief) ends with the same bar.
- Account and deal text: CHANGED a72d4b4b. "HubSpot could not be read just now (identity_unresolved)" in NEXT and in a refused send is said in words with what unlocks it; no "hypothesis <id>" on a reply row; no HubSpot deal id for an unnamed or closed deal; an empty reply list names the account once.
- Add to GAP (More): CHANGED 329f840a. A result's Review opened the research lane; "Open the account" opens its page.
- Capture, Ask, Accounts, the replies history: CHECKED, unchanged. Capture opens prefilled from the action (R44); Ask answers over the page's own projections and links no lane; Accounts lists and opens accounts; /gap/replies stays the all-replies history (reachable only as a fallback), its filter and "disposition" words kept there.
- Capture once on a reply: DONE 8283a9cc and de14c0fa (the lead's decision 1). Work's reply card offers one entry, "Log what they said" (an opt-out: "Record the opt-out"), into Capture prefilled with the reply itself (its words as the note, the person who wrote it, their own deal, the message as the source); Capture's single review holds what the reply means as one more confirmable item (proposed only where the message says it), and confirming records the disposition through the disposition service once, then each kept statement through the BID human confirmation, linked to it. The account page lists its waiting replies, each with that one link, and shows no reply form; NEXT on a replied account opens the same place. de14c0fa: the walk on the production build found the logged reply's card still on Work (its two-minute remembered read); one live read in Work's wave now drops recorded replies. Pinned by r60-capture-reply.test.tsx and r60-recorded-replies.test.ts; walked on the production build (scratchpad `r62-capture2/`, 6 steps, zero internal-text hits).
- The vocabulary: CHANGED 216cd80a (the lead's decision 2). Seller-facing headings and labels say "What we think is happening" for the read itself, "thesis" where it names the object (Review, Approve and Reject the thesis; All theses; the Thesis funnel) and "What the buyer said" for buyer inputs; ids, routes, flags, ledger kinds and the CRM note format keep their names (pinned by r60-vocabulary.test.ts). Kept by contract: "Tier 1" on Accounts (its ordering contract) and the analyst views under More with their own words; the lanes stay reachable from those views only.
- Outside GAP, observed, not changed: the app's main sidebar still lists Accounts and Work Queue beside GAP OS (two account surfaces); a sidebar change is system-wide and needs Casey.
- Found for R61: after recording a reply the page re-read itself and NEXT moved after 13.2 s with no reload.
Receipt (production build, the scratch corpus, the HubSpot stub, mirror unset; scratchpad `r60-final/` and `r60-walk-final/`): Work's first card at 641 px with nothing above it but the day and the health line; the opt-out card opened Walmart at its record section (the Work position kept), recorded there, NEXT moved to "Find the operator", Next account went to account 6 of 9; Fedex's NEXT put the approved story in use on the page, then "Prepare the email to Glen" opened the pack (/gap/pack, then the pack page with Back to Work / Next account); Kroger's deal card opened the brief with both deals' stages in words and the bar; Heb's research NEXT said its move. Lane links on Work and every account page: 0. Internal words outside the sanctioned vocabulary: 0. Each change has focused tests and a deliberate mutation that turned its owning test red (6 mutations).

**R61 what makes Casey wait (2026-10-07).** Measured on the production build (`next build`, then `next start` against
the scratch corpus with the HubSpot stub), headless Chrome, 30 navigations per condition: Work, a corpus account
(Fedex) and a 100-person account (the corpus Nfi with 94 contacts added), cold (a fresh server process and a fresh
browser profile for every navigation: empty memory caches, no asset cache) and warm (one server, primed twice, then 30
navigations). Local reads are loopback and hide the cost production pays per round trip (Vercel iad1 to the us-west2
database, the HubSpot API), so each warm condition was also measured through two counting proxies that add 66 ms per
database round trip and 150 ms per HubSpot call, with one navigation's statements logged (Postgres protocol) to find
the serial chains; Work's two-minute read, rebuilt (`?fresh=1`), was timed with curl through the same proxies.
Fixed, each with focused tests and a deliberate mutation that turned its owning test red:
- 19c0c20e, an in-place action showed its result after 13.9 s: on the account page, router.refresh() fetched the new page in about 200 ms but the browser showed it only on the next React update anywhere (the notification bell's 15 s poll; with the poll held, never; Work committed the same refresh in 119 ms). Every GAP refresh now announces itself and the GAP layout's nudge updates over the next seconds: a recorded reply's NEXT moves at 236 ms (poll held). Two experiments ruled out the account page's streamed boundary and the links' pending status; the framework cause is DEBT (named in refresh-now.tsx), the wait itself is fixed.
- 11dd56f0 and 31addc8d, the account page's reads in series and repeated: owner resolution read the account row first and its people-dependent reads one after another, the send gate and its copy check waited for every other pursuit read, the copy families were asked twice per page, the employment context twice per request, the deal-state reconciliation blocked the page, an account-scoped card read pulled every account's routing decisions, a contact's employment read its three tables in series, and the HubSpot identity asked the company read and the domain search in series. Now they start together or are read once, the decisions read is scoped to the account, and the reconciliation runs beside the page (the obligations wait for it). 0ce5b99c corrected one of them: a minute-long copy-family cache kept "not installed" after a family was restored (the copy-readiness scratch test caught it); the answer is now kept for one request only.
- 64ede221, 2d3d3944, 303092ca, 31c44d1f, Work's two-minute read, rebuilt: 67.6 s under production-like latency on the corpus (209 accounts): the send gate was read once per Work account, one after another (about 180 reads, 40 s); up to twenty cards' next touches were evaluated one after another (about twenty round trips each, 20 s), each asking its seven stop-rule reads in series; the reply holds were read one account after another; and the follow-up sweep, on Work's path once a minute per instance, opened a locked transaction per recent send only to find its follow-up on record. Now: one send-gate read for every Work account, the next touches five at a time (the production pool's width) with their stop reads together (judged in the original order, so a stop found earlier still wins), the reply holds five at a time, and the sweep writes only what is new. A rebuilt read takes 10.5 to 12.6 s (first 17.8 s); a cached Work load 0.39 to 0.68 s.
Result, the baseline and final builds measured back to back (the same proxies, the same corpus, the same hour): the corpus account's full page p50 5,183 ms to 3,137 ms and p90 6,182 ms to 3,629 ms; the 100-person account's p50 5,177 ms to 3,114 ms and p90 6,219 ms to 3,718 ms; warm Work unchanged (p50 1,012 ms and 1,016 ms, served from its two-minute read). The serial database waves of one corpus account view went from 56 to 30 and its executions from 147 to 95. Runs taken hours apart drift with the machine (local warm first content 132 ms at the start, 222 ms at the end), so the back-to-back pair is the comparison; every run is below with its raw values.
The principles, checked:
- Useful content first, decision-critical before secondary: the account's state and NEXT are on screen at about a third of a second (the remembered summary, UX-14), its full page follows; Work's cards arrive with the page from its two-minute read.
- No repeated expensive reads where durable state exists: CHANGED as above (the send gate per account, the copy families, the employment context, the account's routing decisions). The account row is still read by several loaders with different fields (in parallel, off the critical path): named.
- No busy UI over bookkeeping: CHANGED (the stalled refresh; the deal-state reconciliation off the account page's path; the follow-up sweep's needless locked transactions). The summary write after a render is not awaited. Work's closed-deal sweep is still awaited but bounded (five accounts, once per five minutes per instance): named.
- No freshness recomputation of unchanged facts in a normal session: CHANGED for the follow-up sweep (nothing written when nothing changed). HubSpot deal truth is read live on every account view by design (every gate depends on it).
- PARTIAL, dependency (the platform): a cold first byte is 1.47 s on the sign-in page (no session, no database) against 1.62 to 1.71 s on GAP's pages, so a cold start is the server starting (module loading), not GAP's reads; it needs a platform-level change (bundle size or warm instances). The Prisma engine checks each idle pooled connection with a SELECT 1 before reuse (29 per account view, one round trip each); it is the engine's own behavior, not configurable from GAP.
- PARTIAL, dependency (the next pass on the routing inputs): Work's rebuilt read is still 10.5 to 12.6 s under production-like latency; most of it is each card's send history and meeting state (routing/inputs.ts readComms and execution/person-history.ts, about ten reads in series per card, shared with the routing rules). Making those concurrent touches the safety-critical routing inputs and needs its own reviewed change.

The comparison to read first: the baseline build (19c0c20e, before the read fixes) and the final build (31c44d1f), measured back to back through the same production-like proxies (the database 66 ms and HubSpot 150 ms per round trip), so machine drift cancels (n = 30 per account, 20 for Work):
  - warm a corpus account (Fedex), decision: before: p50 311, p90 409, max 419; after: p50 310, p90 407, max 431.
  - warm a corpus account (Fedex), the page arrived: before: p50 5001, p90 5944, max 6572; after: p50 3031, p90 3540, max 3850.
  - warm a corpus account (Fedex), full page: before: p50 5183, p90 6182, max 7138; after: p50 3137, p90 3629, max 4120.
  - warm a corpus account (Fedex), database round trips: before: p50 157, p90 197, max 222; after: p50 148, p90 178, max 221.
  - warm the 100-person account (Nfi), decision: before: p50 325, p90 415, max 493; after: p50 329, p90 412, max 420.
  - warm the 100-person account (Nfi), the page arrived: before: p50 5029, p90 6130, max 6358; after: p50 3021, p90 3495, max 3694.
  - warm the 100-person account (Nfi), full page: before: p50 5177, p90 6219, max 6727; after: p50 3114, p90 3718, max 4099.
  - warm the 100-person account (Nfi), database round trips: before: p50 154, p90 196, max 208; after: p50 152, p90 184, max 195.
  - warm Work, decision: before: p50 1012, p90 1050, max 4677; after: p50 1017, p90 1037, max 1540.
  - warm Work, the page arrived: before: p50 528, p90 685, max 4082; after: p50 525, p90 710, max 1082.
  - warm Work, full page: before: p50 1013, p90 1050, max 4678; after: p50 1018, p90 1037, max 1541.
  - warm Work, database round trips: before: p50 19, p90 161, max 169; after: p50 17, p90 166, max 172.

Percentiles (ms from the navigation start; n = 30 per condition; "decision" is the move on screen: Work's first card, an account's NEXT from the remembered summary or the full page; "full" is the full page: Work's list, the account's own NEXT):
- Local (loopback database and HubSpot stub):
  - warm Work, first byte: before: p50 5, p90 7, max 10; after: p50 5, p90 6, max 7.
  - warm Work, decision: before: p50 198, p90 205, max 208; after: p50 199, p90 208, max 229.
  - warm Work, full page: before: p50 198, p90 206, max 209; after: p50 200, p90 204, max 212.
  - warm a corpus account (Fedex), first byte: before: p50 6, p90 8, max 9; after: p50 5, p90 7, max 8.
  - warm a corpus account (Fedex), decision: before: p50 132, p90 148, max 216; after: p50 132, p90 142, max 149.
  - warm a corpus account (Fedex), full page: before: p50 207, p90 215, max 216; after: p50 205, p90 214, max 220.
  - warm the 100-person account (Nfi), first byte: before: p50 6, p90 7, max 8; after: p50 6, p90 7, max 8.
  - warm the 100-person account (Nfi), decision: before: p50 130, p90 138, max 147; after: p50 131, p90 140, max 156.
  - warm the 100-person account (Nfi), full page: before: p50 207, p90 218, max 410; after: p50 207, p90 217, max 219.
  - cold Work, first byte: before: p50 1602, p90 1622, max 1630; after: p50 1621, p90 1688, max 1705.
  - cold Work, decision: before: p50 1987, p90 2496, max 2526; after: p50 2002, p90 2546, max 2567.
  - cold Work, full page: before: p50 1987, p90 2496, max 2526; after: p50 2002, p90 2546, max 2567.
  - cold a corpus account (Fedex), first byte: before: p50 1677, p90 1701, max 1716; after: p50 1714, p90 1773, max 1780.
  - cold a corpus account (Fedex), decision: before: p50 1983, p90 2023, max 2103; after: p50 2016, p90 2149, max 2160.
  - cold a corpus account (Fedex), full page: before: p50 2581, p90 2618, max 2629; after: p50 2616, p90 2666, max 2680.
  - cold the 100-person account (Nfi), first byte: before: p50 1708, p90 1742, max 1756; after: p50 1686, p90 1729, max 1737.
  - cold the 100-person account (Nfi), decision: before: p50 2001, p90 2049, max 2121; after: p50 1966, p90 2096, max 2129.
  - cold the 100-person account (Nfi), full page: before: p50 2613, p90 2654, max 2662; after: p50 2579, p90 2641, max 2642.
- Production-like (the database 66 ms and HubSpot 150 ms per round trip, through counting proxies); "after" is the build with the account-page fixes (0ce5b99c):
  - warm Work, decision: before: p50 404, p90 932, max 938; after: p50 913, p90 949, max 3474.
  - warm Work, full page: before: p50 404, p90 932, max 939; after: p50 914, p90 949, max 3474.
  - warm Work, database round trips: before: p50 16, p90 109, max 112; after: p50 18, p90 160, max 170.
  - warm a corpus account (Fedex), decision: before: p50 230, p90 413, max 421; after: p50 406, p90 425, max 426.
  - warm a corpus account (Fedex), full page: before: p50 4503, p90 5533, max 6034; after: p50 2976, p90 3497, max 3983.
  - warm a corpus account (Fedex), database round trips: before: p50 144, p90 188, max 190; after: p50 151, p90 186, max 208.
  - warm the 100-person account (Nfi), decision: before: p50 399, p90 421, max 423; after: p50 337, p90 417, max 425.
  - warm the 100-person account (Nfi), full page: before: p50 5003, p90 5553, max 6044; after: p50 2959, p90 3493, max 3534.
  - warm the 100-person account (Nfi), database round trips: before: p50 153, p90 182, max 198; after: p50 155, p90 176, max 199.
- Production-like, the final build (31c44d1f, every R61 fix); measured last, on a slower machine (local warm first content 222 ms against 132 ms at the start), so compare its serial waves rather than its milliseconds:
  - warm Work, decision: before: p50 404, p90 932, max 938; after: p50 1039, p90 1146, max 1535.
  - warm Work, full page: before: p50 404, p90 932, max 939; after: p50 1041, p90 1146, max 1535.
  - warm Work, database round trips: before: p50 16, p90 109, max 112; after: p50 17, p90 165, max 169.
  - warm a corpus account (Fedex), decision: before: p50 230, p90 413, max 421; after: p50 375, p90 414, max 543.
  - warm a corpus account (Fedex), full page: before: p50 4503, p90 5533, max 6034; after: p50 3575, p90 4090, max 4101.
  - warm a corpus account (Fedex), database round trips: before: p50 144, p90 188, max 190; after: p50 152, p90 183, max 221.
  - warm the 100-person account (Nfi), decision: before: p50 399, p90 421, max 423; after: p50 374, p90 416, max 531.
  - warm the 100-person account (Nfi), full page: before: p50 5003, p90 5553, max 6044; after: p50 3572, p90 4102, max 4116.
  - warm the 100-person account (Nfi), database round trips: before: p50 153, p90 182, max 198; after: p50 152, p90 185, max 201.
- The cold floor: cold the sign-in page first byte p50 1474 ms; cold Notes first byte p50 1571 ms (no session or database on the sign-in page): a cold first byte is the server starting, not GAP's reads.

Raw values (ms, in measurement order), decision then full page; production-like rows add the database round trips:
- A/B baseline build, warm:work, decision: 1028,1003,1011,1004,1013,1014,1031,1011,575,1012,1050,589,1027,576,989,633,1027,614,4677,1038
- A/B baseline build, warm:work, full: 1029,1003,1012,1004,1014,1014,1032,1011,575,1013,1050,589,1027,577,990,633,1028,614,4678,1039
- A/B baseline build, warm:work, db: 147,133,161,112,37,20,19,16,13,20,16,13,13,13,18,13,14,13,169,122
- A/B baseline build, warm:corpus, decision: 289,403,372,285,411,316,409,340,407,419,334,315,305,305,311,295,336,332,301,293,293,316,309,294,327,290,309,294,292,305
- A/B baseline build, warm:corpus, full: 6153,6147,7138,6702,6182,5682,5657,5689,5618,5183,5213,5696,6181,5665,5139,5117,4631,5155,5119,5155,5114,5165,4676,4633,5254,4589,4653,4637,4628,4131
- A/B baseline build, warm:corpus, db: 204,183,222,188,197,173,189,166,184,162,152,173,157,169,161,155,138,155,157,159,145,150,144,143,140,141,135,127,142,133
- A/B baseline build, warm:hundred, decision: 415,311,286,402,381,325,384,387,393,493,385,303,328,313,314,316,325,294,397,306,301,425,351,309,323,303,319,287,300,327
- A/B baseline build, warm:hundred, full: 6727,6219,6150,6709,6151,6186,5241,6133,5633,6157,5186,4639,5177,5164,5149,5168,5153,5217,5117,4615,6150,4112,4665,4636,4666,4646,4654,5146,4114,5250
- A/B baseline build, warm:hundred, db: 208,203,196,189,184,176,166,180,181,167,177,145,166,151,146,152,152,158,154,147,160,126,138,131,130,136,134,135,124,142
- A/B final build, warm:work, decision: 1018,1037,1013,1009,1017,1020,562,1028,1021,1037,1013,581,1016,596,565,1034,1032,1540,586,1005
- A/B final build, warm:work, full: 1018,1037,1013,1009,1017,1020,562,1028,1022,1037,1014,582,1018,596,567,1035,1033,1541,586,1006
- A/B final build, warm:work, db: 166,45,22,17,21,17,14,15,14,17,16,13,14,13,15,14,14,21,156,172
- A/B final build, warm:corpus, decision: 285,394,391,431,429,307,355,323,310,335,304,291,297,391,391,305,407,281,349,293,286,283,276,307,345,285,297,396,294,388
- A/B final build, warm:corpus, full: 3624,4120,3602,3664,3619,3629,3137,3617,2580,3626,3623,3115,3057,3596,3049,3613,3617,3074,3123,3092,3066,3591,3056,3138,2622,3045,3082,3059,2639,2558
- A/B final build, warm:corpus, db: 174,221,169,166,196,169,151,178,140,161,168,148,142,161,138,154,174,148,140,142,135,137,145,139,134,143,134,128,131,120
- A/B final build, warm:hundred, decision: 413,399,412,411,388,307,290,292,297,400,401,292,291,289,377,395,408,391,327,293,329,305,306,407,392,320,310,288,420,301
- A/B final build, warm:hundred, full: 3718,4098,3606,3610,4099,3610,3063,3604,3622,3588,3092,3619,3586,3078,3058,3094,3114,3582,3105,2601,3122,2636,3606,3096,3074,2591,3098,3076,2577,2578
- A/B final build, warm:hundred, db: 175,193,195,165,184,165,152,181,164,161,170,149,141,164,145,141,160,153,138,136,145,130,151,153,134,132,142,129,135,134
- local before, warm:work, decision: 196,208,198,201,139,199,203,205,198,198,191,205,195,196,191,198,198,194,144,197,192,197,196,139,200,200,133,192,198,208
- local before, warm:work, full: 196,209,198,201,139,199,203,205,198,198,192,206,195,196,191,203,198,194,144,197,192,197,196,139,200,200,133,193,198,208
- local before, warm:corpus, decision: 216,211,135,138,127,134,137,119,136,128,124,130,129,119,128,132,134,129,130,123,129,137,135,128,131,148,134,132,132,126
- local before, warm:corpus, full: 216,211,215,215,210,210,213,201,213,181,206,206,206,198,203,208,210,204,205,201,203,215,212,205,205,184,215,212,207,207
- local before, warm:hundred, decision: 135,144,135,130,138,123,126,136,130,135,128,132,131,130,126,126,128,121,130,128,129,125,128,130,121,130,120,147,132,121
- local before, warm:hundred, full: 331,218,211,205,211,410,207,213,209,212,209,209,210,209,203,206,203,204,204,207,207,203,212,205,203,205,200,189,211,202
- local before, cold:work, decision: 1959,1984,1962,2451,2439,1958,1949,1991,1964,2006,1979,2003,1963,1978,2481,2012,1980,1977,1976,2496,1973,2007,2526,1966,1987,2019,2500,1992,1982,1994
- local before, cold:work, full: 1959,1984,1962,2451,2439,1959,1949,1991,1964,2006,1979,2003,1963,1978,2481,2012,1980,1977,1976,2496,1973,2007,2526,1966,1987,2019,2501,1992,1982,1994
- local before, cold:corpus, decision: 1904,1877,1992,2012,2023,1907,1919,1930,1909,1966,1955,1957,1966,2046,1982,1962,1963,1952,1994,1991,1995,1983,1988,1957,1994,1989,1999,1983,2014,2103
- local before, cold:corpus, full: 2511,2496,2505,2526,2534,2529,2542,2558,2516,2581,2575,2588,2574,2550,2600,2576,2582,2565,2620,2614,2603,2598,2604,2578,2610,2608,2615,2601,2629,2618
- local before, cold:hundred, decision: 2017,2001,2006,1983,2019,2016,2018,2047,2121,2104,1976,2034,2025,2049,2014,2026,2025,1997,1913,1940,1925,1881,1910,1959,1786,1870,1793,1901,1994,1884
- local before, cold:hundred, full: 2627,2625,2634,2590,2639,2634,2631,2654,2625,2613,2590,2642,2655,2662,2636,2645,2639,2603,2545,2558,2536,2505,2539,2591,2526,2519,2504,2520,2501,2496
- local after, warm:work, decision: 212,196,200,198,199,229,196,203,197,193,194,197,195,199,199,197,204,177,196,198,198,200,200,194,200,203,203,203,200,208
- local after, warm:work, full: 212,197,201,200,199,178,196,203,198,193,194,197,196,199,200,197,204,177,201,198,199,200,202,194,201,203,203,203,201,208
- local after, warm:corpus, decision: 129,145,133,138,132,140,149,126,132,130,124,127,131,142,125,138,133,122,129,129,125,132,129,142,135,132,129,131,132,129
- local after, warm:corpus, full: 208,220,211,214,210,178,188,210,208,210,203,204,206,182,203,218,175,201,205,205,167,207,204,181,181,212,205,207,211,205
- local after, warm:hundred, decision: 127,140,156,134,130,133,137,131,132,128,131,135,125,133,134,135,125,121,121,121,140,131,136,127,128,131,127,133,130,126
- local after, warm:hundred, full: 207,217,198,213,214,210,217,209,208,202,212,211,204,176,177,210,203,200,200,200,214,207,219,202,205,207,169,208,205,201
- local after, cold:work, decision: 2410,1993,1970,1972,1987,1982,1967,1995,1990,1979,1986,1978,2011,2013,2018,2087,1960,1997,2002,1992,2016,1987,2546,2030,2016,2081,2102,2567,2070,2566
- local after, cold:work, full: 2410,1993,1970,1972,1987,1983,1967,1995,1990,1979,1987,1978,2012,2028,2018,2087,1960,1997,2002,1992,2016,1987,2546,2031,2016,2081,2102,2567,2070,2566
- local after, cold:corpus, decision: 1971,2045,2047,1995,1947,2071,2056,1985,1986,1991,2148,2152,2044,2042,2054,2149,2160,2118,2009,1983,1992,2005,1983,1995,1990,2010,2016,1979,2025,2060
- local after, cold:corpus, full: 2593,2659,2658,2614,2562,2578,2563,2589,2596,2611,2680,2654,2659,2654,2666,2656,2668,2624,2616,2595,2619,2635,2589,2611,2609,2613,2628,2602,2645,2564
- local after, cold:hundred, decision: 1995,1997,2018,2033,2129,2096,2013,1997,2028,2006,1985,2025,2110,1994,1934,1926,1937,1887,1875,1913,1950,1966,1938,1934,1923,1930,1957,1917,1923,1894
- local after, cold:hundred, full: 2620,2617,2641,2641,2635,2597,2635,2615,2635,2623,2602,2642,2627,2626,2551,2539,2579,2506,2483,2537,2578,2578,2554,2560,2541,2555,2578,2544,2544,2527
- production-like before, warm:work, decision: 936,904,932,926,930,400,938,399,404,396,393,923,395,318,403,401,399,327,400,397,397,903,928,904,453,916,432,455,314,394
- production-like before, warm:work, full: 936,904,932,927,930,400,939,399,404,396,393,923,395,318,403,401,399,327,400,397,397,903,929,905,454,916,432,455,314,394
- production-like before, warm:work, db: 99,112,102,109,31,17,15,16,14,17,16,16,13,13,13,14,16,13,13,13,13,95,109,106,44,18,15,16,12,13
- production-like before, warm:corpus, decision: 318,315,230,202,228,213,278,210,421,219,220,198,252,310,233,308,224,230,206,232,215,207,206,203,211,313,406,413,203,413
- production-like before, warm:corpus, full: 6034,5493,5522,5495,5016,5003,5610,5533,5015,5013,4007,3979,5064,5002,4536,5006,3999,3990,4013,3511,3998,3991,3979,3466,3993,4004,4481,4503,3987,3974
- production-like before, warm:corpus, db: 190,190,188,183,170,176,170,164,155,165,144,143,159,162,149,149,141,138,142,128,122,132,122,115,128,129,142,128,119,117
- production-like before, warm:hundred, decision: 410,422,396,196,404,411,423,407,316,396,421,399,407,197,329,197,408,199,198,409,203,205,405,409,198,202,406,413,202,204
- production-like before, warm:hundred, full: 6044,5501,6032,5515,5507,5520,5553,4978,5036,5527,5013,5509,4492,5023,4555,5514,3991,3987,5003,3962,4014,4978,5010,3975,3989,4505,4516,3479,3487,3998
- production-like before, warm:hundred, db: 197,178,198,174,182,168,175,161,153,167,153,159,161,160,147,158,129,126,143,136,141,144,148,130,122,133,127,111,121,123
- production-like after, warm:work, decision: 949,956,945,915,899,903,442,397,440,916,432,413,913,433,416,449,923,390,3474,944,909,926,907,923,914,931,914,903,915,401
- production-like after, warm:work, full: 949,956,945,916,899,904,442,397,440,916,432,413,914,433,416,449,924,390,3474,944,909,926,907,923,915,931,914,903,916,401
- production-like after, warm:work, db: 153,111,29,21,19,18,15,14,15,18,14,13,15,13,13,15,14,13,56,162,170,160,111,31,18,18,14,16,16,13
- production-like after, warm:corpus, decision: 426,399,409,407,419,413,415,414,199,425,403,425,398,209,200,203,422,401,414,389,323,416,406,198,416,320,417,200,220,405
- production-like after, warm:corpus, full: 3478,3983,3476,3474,3492,2970,3485,2968,2981,2976,3468,3527,2944,2967,2968,2963,3002,2974,3497,2971,2988,2964,2452,2460,2962,2454,2971,2994,2988,2959
- production-like after, warm:corpus, db: 190,208,166,176,186,168,169,175,168,154,163,161,155,146,141,151,139,139,163,150,138,139,142,133,131,131,141,139,133,132
- production-like after, warm:hundred, decision: 410,417,413,425,424,197,404,388,403,401,408,406,414,395,337,341,331,216,321,213,216,256,226,311,248,209,315,321,222,199
- production-like after, warm:hundred, full: 3464,3493,2982,2971,2954,2951,3450,2942,2944,2922,2962,2949,2943,2959,3523,3534,2974,2989,2963,2979,2992,2484,2469,2936,2501,2467,2972,2461,2478,2456
- production-like after, warm:hundred, db: 174,199,170,162,175,178,168,175,176,153,161,161,161,159,155,148,140,138,155,143,132,141,133,138,119,139,134,140,123,138
- production-like final, warm:work, decision: 1028,1040,1117,1018,1035,590,1080,1008,1039,1059,1130,1043,626,1046,726,636,1529,725,1004,1535,1025,1039,1077,1091,1146,684,1031,1080,1008,1056
- production-like final, warm:work, full: 1029,1041,1117,1018,1035,590,1080,1008,1044,1060,1130,657,626,1046,727,636,1529,725,1004,1535,1025,1041,1077,1093,1146,684,1032,1081,1008,1057
- production-like final, warm:work, db: 169,30,19,21,17,14,15,18,18,14,14,13,13,17,13,13,21,165,169,132,20,19,19,14,15,13,13,15,14,14
- production-like final, warm:corpus, decision: 306,392,299,387,375,436,396,402,306,318,543,298,306,393,383,407,387,277,319,374,302,394,381,317,285,407,311,303,414,371
- production-like final, warm:corpus, full: 3617,4081,3585,3674,4090,3600,3591,3591,3134,3139,3625,3091,3586,3575,3163,3600,4100,3086,3124,3584,3175,3073,4101,3071,3049,3093,3099,3098,3089,3047
- production-like final, warm:corpus, db: 174,221,175,165,201,164,156,182,152,144,183,145,147,176,135,147,166,128,125,177,141,133,163,134,135,153,131,133,148,125
- production-like final, warm:hundred, decision: 384,401,393,297,384,531,304,379,381,359,374,394,396,427,398,310,310,392,293,281,416,315,301,337,321,305,338,376,325,301
- production-like final, warm:hundred, full: 4103,4116,4068,3609,4102,3587,3604,3572,3583,3651,3551,3060,3575,3614,3585,3082,3188,3102,3086,3572,3100,3142,2572,3118,2579,3623,3682,2529,2590,2563
- production-like final, warm:hundred, db: 184,201,183,168,185,173,166,175,157,152,186,151,146,161,154,135,152,139,150,162,138,137,146,131,127,141,146,122,134,124

Serial database waves in one warm corpus account view (the statement log): 56 before, 31 after the account-page fixes, 30 on the final build; executions 147, 108, 95.
Work's two-minute read rebuilt (`/gap/?fresh=1`, curl, production-like latency, seconds): before 70.8 (the first request), 67.6; after the first two Work fixes 22.7, 16.4, 13.9, 13.6, 16.0; after every fix 17.827296. A cached Work load after every fix: 12.579140.

**R61 re-judged on the full page, with p95 (2026-10-07).** No remembered shell counts as content, so the account's
"decision" time (the remembered summary at about a third of a second) is not the measure; the full page is. The
production build, 30 navigations per condition unless said; the raw values are the scratchpad files named here.
- An account, production-like latency, warm, the same-time A/B (`r61-ab.json` against `r61-ab-head.json`): the corpus account p50 5,174 to 3,130 ms, p90 6,181 to 3,626, p95 6,468 to 3,648; the 100-person account p50 5,172 to 3,110, p90 6,189 to 3,632, p95 6,488 to 3,927.
- Work, production-like latency, warm (`r61-final-rtt.json`): p50 1,038, p90 1,132, p95 1,357 ms. The A/B measured Work 20 times only (p95 1,231 to 1,062), so it is not the p95 of record.
- Cold, local (`r61-after-local.json`, a fresh server and browser per navigation): Work p50 2,000, p95 2,557; an account p50 2,578 to 2,615, p95 2,641 to 2,667, of which the first byte is p95 1,692 to 1,773 (the server starting; the sign-in page alone takes 1.47 s).
- Warm, local: every page p95 206 to 217 ms.
Verdict: DONE for GAP's own reads on the account page and Work; PARTIAL with the two dependencies recorded above (the
platform's cold start, Work's rebuilt read). The commits after 31c44d1f add no serial read on these paths (one closure
read and one recorded-reply read ride Work's existing parallel wave; the account page reuses data it already loaded);
they were not re-measured.

**R65 operations and the stranded-draft dry run (2026-10-07).** The operator sees failures, Casey sees decisions.
- The counts: e5b0b567, `lib/gap/health/operations.ts`, from the ledgers GAP already keeps (no table, no model call, no write). Broken handoffs (drafts stranded, proposals drafted and never submitted, dead-letter signals), the research queue's oldest age and stuck runs, research freshness and cost over seven days (runs, grounded turns, pages queued, facts verified, failures), preparation latency (the remembered summaries' ages), seller corrections, outcomes (obligations, replies, meetings) and the HubSpot changes waiting for approval, approved and not written, or failed, each with its owner and where to decide or retry. Every read stands alone and is soft: a count GAP could not read is unreadable, never zero, and degrades the state. The operator's view is `GET /api/gap/health?operations=1` (the Work strip's call is unchanged, so it stays light); Casey's is the "Your decisions and what happened" section on /gap/learning.
- The dry run: c72e6a2f, `scripts/gap/recovery/repair-stranded-drafts.ts --dry-run [--json]`. It lists each stranded draft and what the R11 service would do with it, ADOPT (the fact, the key) or why not. It refuses to write twice over (exit 2 without --dry-run before any read; a read-only client that throws on every write, raw SQL and transaction) and names the database without credentials. The service's fact checks are one exported function (`draftFactRefusal`), and on the scratch database the real service then adopts the very draft the plan named and refuses the sensitive one for the same reason (`stranded-repair.scratch.test.ts`).
- Found by the live check and fixed: 4e936a90, a HubSpot conflict read "changed 2026-10-07 by CRM_UI"; it now says the day and who in words.
- Observed, not changed: the analyst tables lower on /gap/learning show sequence version ids, the evidence tier name VERIFIED_FACT and campaign program keys. They are kept by contract as the analyst views' own words (R60). DECIDED by the lead (2026-10-07): they keep their words.
- Live check on the production build (scratchpad `r65-live/`): the operator view listed 4 stranded drafts and 2 HubSpot conflicts with owners and where to act; the strip's call carried no operations; /gap/learning showed the decisions, the approved-not-written note with its retry place, the conflicts, the outcomes and research cost.

**R63 seller review dispositions (2026-10-07).** Fresh seller reviewers on the production build of c00b94ca (code
d9902641), on the scratch database and the stubs, corpus tag r63.
- BLOCKER, fixed (found by reviewer B, verified by the lead): the floating "Compose email" button opened the legacy composer on a GAP page, and its send (POST /api/email/send) went to Doug Scratch at Walmart Scratch Co r63, whose "stop" reply was on file but not yet recorded as do not contact. The send was accepted. GAP's own gate stops on that reply; the legacy send never read replies. Two commits:
  - 8f7c20d5: `performSend`, the one legacy send authority, reads each recipient's replies the way GAP's stop rules do (`lib/gap/replies/opt-out.ts` over `replies/classify.ts`, never a second classifier) and refuses when an opt-out reply from that address is on file, recorded or not: 409 RECIPIENT_OPTED_OUT_BY_REPLY, details.reason recipient_opted_out_by_reply, and the error the composer shows, "Doug Scratch replied "stop" on Oct 5, 2026. Nobody emails them from here. Record it as do not contact from their reply." A person's ordinary reply, an automatic notice and a bounce do not block; a cc is read the same way; internal addresses bypass as they do for unsubscribes; the unsubscribed blocker is unchanged and still checked first. Test: `tests/unit/r63-opt-out-send.test.ts` (4); removing the refusal turned it red, then restored. The six other legacy-send test files mock an empty inbox.
  - 3fe2c39e: the button renders nothing on every route under /gap (it hid only on the account pages), so GAP's send spine and its gate are the only way to email from GAP; unchanged elsewhere, and a path that merely starts with the letters (/gapfoo) is not GAP. Test: `tests/unit/r63-compose-on-gap.test.tsx` (2, on the component with the pathname); the accounts-only rule turned it red, then restored.
  - Receipts at 3fe2c39e: the eight files run singly with --maxWorkers=1, 41 tests green; eslint and tsc clean. No full suite and no build under the lead's load cap; the full gates and the rebuild come after the R63 reports.
- Harness event: the R63 server on 3100 exited (code 127) at about 18:01 local, after reviewer B's double-send attempt. It was restarted once on the same `.next` build, database, stub and session; the lead was told. The dead log is kept in the scratchpad.
- The analyst tables lower on /gap/learning keep their words (sequence version ids, VERIFIED_FACT, program keys): DECIDED by the lead.

**R63-B dispositions (reviewer B: accessibility, trust, engineering; 2026-10-07).** 1 BLOCKER, 15 SHOULD, 13 NICE on
c00b94ca; screenshots in the scratchpad `r63-B/`. Each fix is its own commit with focused single-file tests
(--maxWorkers=1) and one red mutation, restored; no full suite and no rebuild under the lead's load cap.
- B1 FIXED 8f7c20d5 and 3fe2c39e (above).
- S12 FIXED 77261d91: a parked account (Sysco, closed lost Sep 1) never carries a first-touch card on Work. Work asks the gate's own resolver for the accounts it would offer cold work (eight at most, in Work's order, remembered five minutes) and holds them in the closure's words; the gate refuses the same touch with the same sentence (pinned).
- S10 FIXED 66b1e9ce: a proposed plan stays proposed: each milestone starts at Not decided, the button counts only what was chosen, only those are recorded.
- S9 FIXED 67010fe2: one reader for "has anything happened" (the touches, the buyer's words, a recorded conversation, the open deals, a meeting ahead) feeds both "What has happened between us" and the learn line's basis.
- S11 FIXED a9f53e3f: a restored skip leaves SET ASIDE OR LOGGED TODAY; the obligation stands once, under OWED; the skip stays in the account's history.
- S1 FIXED 0fa50dfa: an opt-out on file (their reply, recorded or not, or a recorded do not contact) makes the pack show no draft ("No email: they opted out", no subject, no body, no copy, no call script); the words are not temporary and say what to do. The approach, the motion line and the intake card say "Do not contact: ... Nothing goes to them from here."
- S2 FIXED 002e4829: an opt-out or a bounce offers no "Answer in Gmail"; an email sent after the opt-out carries it beside the send.
- S3 FIXED 21331eae: one Work outcome per account per day (a stale tab's second press answers 200 with the existing row, one line on Work); the day boundary no longer carries the press's milliseconds.
- S7 FIXED IN PART 58b953d6: GAP's own not-found ("This account is not on your list", "This action pack is not on your list", "This page is not in GAP"), one link Back to Work, the title "Not found | GAP", the call page in words. NOT FIXED, the lead's decision: the HTTP status stays 200, because the page streams under the root and GAP loading boundaries before it can know the id is unknown (Next's docs: a real 404 needs the check in the proxy). The fix is a system-wide change: move the root `middleware.ts` to `proxy.ts` (Node runtime) and check the GAP detail ids there, or drop the loading boundaries above the GAP detail pages. DECIDED by the lead (2026-10-07): named debt after R64; the seller-facing fix (what is missing, one way back) ships now.
- S8 FIXED 3967165c: sign-in comes back to the page (every GAP page's fallback carries it; the login page honors the session gate's callbackUrl, same site only). Production's gate already sends the callback (read-only check: GET /gap/ answers 307 to /login/?callbackUrl=...).
- S4 FIXED 2666398e: Capture keeps one polite live region for the whole flow and says every save, refusal and record in it.
- S5 FIXED d97fd055: the Note panel is a modal dialog for the keyboard (Escape from anywhere inside, Tab and Shift+Tab wrap, focus returns to the opener); closing keeps the typed note.
- S6 FIXED a51fd852: real headings: the brief's rows and the pack's sections are h2, each Work card an h3 named by its account.
- S13 and S14 FIXED 624b9e27 (and the plan's 24 px radios in 66b1e9ce, the citations in e1046642): 24 px targets; at phone width the Note pill sits in the page flow after the content (fixed from 640 px up), so it covers nothing.
- S15 FIXED c31cab0c: "No open HubSpot deal, checked moments ago" (never "HubSpot opportunity CLEAR"); a thesis row named in the words its cells show ("hidden capacity"); the call page's "not_found" in 58b953d6.
- NICE fixed: N2 6891aa7b (a stale Record says it was refused); N1 part, N3, N4, N5, N8, N10 6c25eed2 ("7 theses", the composer's em dashes, Escape on "Why this person?", screen-reader spacing, the proof line from the canon's phrases with "260 sites committed" and passing the compiler's nearest-qualifier rule, a canceled meeting never the next step); N11 1f2ce814 (a capture link to a reply GAP does not hold opens a plain note); N12 e1046642 (a citation named "Source 1: title (site)"; an unlinked one never says "evidence_record"); N9 b63f2e69 (a fact's date is one calendar day everywhere).
- NICE as debt (owners in the debt list below): N1 rest, N6, N7, N13.
- N8 DECIDED by the lead (2026-10-07): keep "observed". The compiler enforces it (top100/CLAIMS.md forbids "measured" beside the 5%); the repository canon line ("~5% measured", CLAUDE.md) is for the native site's copy, not GAP's compiled text. It stays listed for Casey in the final packet as a wording decision, not a blocker.
- Harness finding, not a product defect: the local Windows `next build` registers no middleware (`.next/server/middleware-manifest.json` is empty), so on the R63 server a signed-out page renders its own fallback and an API answers without the session gate; production runs the gate (read-only checks: GET /api/email/send/ answers 401, GET /gap/ 307 with the callback). Signed-out and API probes on the local server do not describe production.
- Passing (reviewer B): the skip link; 182 focus stops with a visible ring; the keyboard walk completes; no horizontal scroll at 390 on five pages; no unnamed controls; one capture per reply across tabs; a recorded do not contact removes Doug from the composer; direct links load in a fresh signed-in context; a bogus view parameter falls back to Now.
- Receipts at b63f2e69: the 19 R63 test files run singly with --maxWorkers=1, 59 tests green; each fix's neighboring files run singly at its commit (the tests that pinned old wording or old source lines moved to the new contract in the same commit); eslint and tsc clean on every changed file.

**R63-A dispositions (reviewer A: the seller walk; 2026-10-07).** 4 BLOCKER, 17 SHOULD, 11 NICE on the c00b94ca
build; screenshots and page text in the scratchpad `r63-A/`. Each fix is its own commit with focused single-file tests
(--maxWorkers=1) and one red mutation, restored; no full suite and no rebuild under the lead's cap. Order as the lead
set it: the four blockers, the two matrix additions, then the MUST list.
- B1 FIXED 0fad39a5: a seller's own promise is owed by the seller. An unlabelled first-person promise in a note ("I will send Ben a one-pager") is the seller's deliverable; a third-person one ("Ben will send us...") is the buyer's promise to chase; Capture shows "Who owes it: Me / Them" and retitles an untouched title.
- B2 FIXED 5090fe4a: a customer or lost-deal account never reads Ready on Work: the opportunity holds read twenty accounts, five at a time, remembered five minutes, so a restart or a Refresh holds them in the closure's words without a page visit.
- B3 FIXED 9893899f: the tomorrow preview goes through the same stop rules as today (a live reply, a recorded do not contact, a decline, a not-a-priority answer hold the account), and it starts from what the workspace says now.
- B4 FIXED e6d1038f (with the matrix's speaker case): the story names who actually spoke, resolved from the reply's address before any name, digits kept in the name key; the deal brief and the conversation read the person on record.
- Matrix item 2 FIXED 3f8753cd: card readiness says "thesis" in its body text (R60).
- S4 FIXED 1bcc2ccf: a recorded reply is owed its answer (R42): its Work card reads "Answer <name>" until the answer is sent or copied, and the account page keeps the prepared answer at #reply-answer; a stop or a bounce owes none ("No reply goes back.").
- S5 FIXED 048c61d3, with 3ab2a345 and f5d3aaac: a paraphrase is what the seller noted they said, never a quote: the wording is recorded at capture (bid/wording.ts), and the deal list, the meeting brief, the story, Listen, the recap, the pilot draft, the business-case inputs and the deal brief all say "You noted" or "as I understood it", without quotation marks.
- S1 FIXED 04e5d217: a recorded reply's card clears on the next Refresh, and a reply card's day is the message's received date (never "Dec 31").
- S2 FIXED 115dda98: "Open the reply" always lands on a real place: the account page keeps the reply's anchor and says what happened to it.
- S3 FIXED 4ad5e063: a reply that has its capture opens it at once, with its review, saying it already has one.
- S11 FIXED 67db8037: the day can finish: a meeting card has "Prepared" (recorded with the outcomes); Work says "Done for today: nothing needs you."; the preview speaks of tomorrow.
- S8 FIXED a8110a38: the Work card keeps the page's move until the seller acts. Cause: the account page refined NEXT with the outreach anchor ("Put the story in use"), the Work warmer and Ask did not ("Prepare the email to Glen"), so a page visit flipped the remembered card and its aging flipped it back. One function (pursuit/next-anchor.ts) over one composition (story/compose.ts) now serves all three.
- S9 FIXED 8247574b: the email page says HubSpot once: "No open deal, read moments ago. This email is not logged in HubSpot; GAP records it as emailed."
- S13 FIXED 930bfa3c: the Accounts search covers every account (the ones GAP has not worked are listed after, "Not worked in GAP yet"), Work's search links to it, and an unlinked account says "No HubSpot company is linked to this account. Link it in HubSpot; until then no cold touch." with the link: "Link it in HubSpot" on NEXT and on its Work card opens HubSpot's company search for the account (2684beae).
- S15 FIXED a4db626e: one line per obligation: a buyer obligation stays in Owed with its day and never repeats under tomorrow.
- S16 FIXED 91c8bc0f: a blocked health line names its owner and the retry path (the R65 shape), on the line itself.
- S17 FIXED 0380d5b5: a constraint is never a pilot success measure; it is listed apart as what the pilot has to respect.
- S10 FIXED 0d4e5eff: after one send: "Touch 1 sent; the follow-up is on Oct 13." (the send's own follow-up obligation, by the sweep's day rule), and one motion line with the person's name and a readable date.
- S12 FIXED 562e0f0b: the floating Note is Feedback and sits in the page flow at every width.
- S6, S7 and S14 are R63-B S9 (67010fe2), S11 (a9f53e3f) and S10 (66b1e9ce).
- NICE fixed: N1 part d126588d (clawd, Wedge, "hidden capacity (approved)", "0 candidates waiting"); N3 f5d3aaac (names on Done today and the deal brief); N4 part 73a9a4bc, d126588d and 0d4e5eff (the meeting context, Capture's recent notes, the motion line); N5 and N7 670dbbd8 (yards plural; the canon proof line); N6 part 73a9a4bc and 0380d5b5 (a currentness said twice, "also leads", "...lost Wrong if: If", "Read BRIEF", "1 of their own measure"); N10 772de979 ("CSCO" spelled out) and 1b240b19 (a person with no title reads "title not on record": Dannon's Mark Shaughnessy).
- NICE by design: N10's intro ask lives only on the account (warm intro only: the account is the one place that asks Mark).
- NICE as debt (owners in the debt list below): N1 rest, N4 rest, N6 rest, N8, N9, N11. N2 is by design (the lead's decision, below).
- Acceptance, each proven by a test: a first-person promise is owed by the seller (`r63a-seller-promise.test.tsx`); a customer or lost-deal account never reads Ready on Work or the preview after a restart or Refresh (`r63a-held-never-ready.test.ts`); the preview offers no outreach to an account with a live reply or a recorded do not contact (`r63a-preview-stop-rules.test.ts`); the story names the person who replied (`r63a-story-names.test.ts`); a recorded reply's card clears on the next Refresh with a real date (`r63a-reply-clears.test.ts`); Work reaches done when the only item left is a prepared meeting (`r63a-day-done.test.tsx`).
- Receipts at 772de979: the 43 R63 test files run singly with --maxWorkers=1, 115 tests green; each fix's neighboring files run singly at its commit (tests that pinned old wording moved to the new contract in the same commit); eslint and tsc clean on every changed file.

**R62 final pass and the merge (2026-10-07).** acceptB's final matrix on the release candidate c9cff73b: 100 of 100
cases green on its own scratch database (55433), feat/gap-matrix 8dbb9c57 (tests, the matrix seed and stubs, and
docs/gap/RUNBOOK.md only; no source), re-headed by acceptB as 79bfdd4a on b441983a with the same content. The reds the
pass classified:
- deals, the speaker case: the product defect it found (the story named the buyer by contact email) was fixed by the writer in e6d1038f; the case now checks that every buyer sentence shown on Ben's deal names Ben (the extra statement it had assumed was a test assumption, not a contract change).
- deals, the recap case: an intermittent product defect. Coverage's "approved, not written" list folded the CRM ledger with a stable millisecond sort; an approval's attempt and result rows that share a millisecond, read result first, folded to "approved", so the approval dropped off Coverage and GET /api/gap/crm-sync?state=off while the deal brief said HubSpot writes are turned off (seen as crm538d9d3b9eb3b). FIXED e972efbc before the merge: the fold orders one millisecond by the write lifecycle, then by id, whatever order the rows are read in; the ledger reads select the id and order by time then id. Test `r62-crm-tie.test.ts` (the same rows in three read orders and the Coverage list read result first, all "off"; dropping the tie-break turns both red); crm-sync 22, deal-artifacts 10, s5-review-recap 3, coverage 10, coverage-page 1 and deal-brief 18 run singly, green; eslint and tsc clean on the touched files. The two notes that called it open now name the fix: the recap case's comment in matrix-deals.scratch.test.ts and the runbook's section 2 line (fixed in e972efbc, no longer debt).
- The merge 307f3ee6 (`git merge --no-ff`, no conflict; the ledger file untouched by the matrix branch): `git diff --stat c9cff73b..307f3ee6 -- src` is the Coverage fix alone (src/lib/gap/crm-sync.ts and src/lib/gap/deals/crm-model.ts, 14 insertions, 4 deletions). After the merge, `npx tsc --noEmit -p .` reports 4 type errors, all in the merged matrix test files (matrix-dependencies 208 and 272, matrix-identity 86, matrix-pepsi 286): vitest runs them (types are stripped), and `next build` drops diagnostics in `*.test.*` files (next/dist/lib/typescript/runTypeCheck.js), so the Vercel build is not affected; the release branch owns them since the merge and they are fixed, types only, in e8163c33 (whole-project tsc clean, 7 s; eslint clean on the three files; no assertion or exercised path changed; acceptB reruns them on 55433). The matrix files need 55433 and were not rerun here (acceptB's 100 of 100 is the receipt).

**R63 gates on the final SHA (2026-10-07, the lead's go after R63 was accepted).** Serial, one job at a time, on
c9cff73b; logs in the scratchpad `gates/`, journeys in `r64/journeys/`. Two gates went red once; each was fixed atomically
on the critical path and only what it touched was rerun.
- tsc, whole project (`npx tsc --noEmit -p .`): clean, 8 s (incremental).
- eslint, whole project (`npx eslint .`, 14 s): exits 1 with 1,045 errors and 84 warnings in 171 files, every one present at the production base 672570ed (the lint configuration is unchanged on the branch; no file the branch touched has more errors than at the base). The one error the branch added (react-hooks/rules-of-hooks on a click handler named usePrimary in outreach-anchor.tsx) is fixed in ba29d430 (renamed putPrimaryInUse; renaming it back turns eslint red). The pre-existing errors are named debt below.
- The GAP suite (445 files, four chunks with --maxWorkers=2): 5,765 of 5,765 green, 278 s (72, 69, 67, 70). The first run had one red: pre-call-brief.test.tsx still asked for a citation link named "1" after R63-B N12 named it "Source 1: title (site)"; fixed in c9cff73b (returning the bare number turns it red) and its chunk rerun green (108 files, 827 tests).
- The scratch suite on 55432 (`GAP_SCRATCH_DATABASE_URL=<scratch> npx vitest run tests/unit/gap/scratch --maxWorkers=1`, the nine non-matrix files): 50 of 50 green, 33 s.
- The rest suite (`npx vitest run --maxWorkers=2 --exclude tests/unit/gap/**`): 328 files, 2,311 passed and 1 skipped of 2,312, 156 s.
- The production build (`npm run build` at c9cff73b, the scratch environment, no production credential): compiled, 99 s in all (the prebuild VOICE CI and pack validations passed; compiled in 38.2 s; 60 of 60 static pages), BUILD_ID 5wDGj3pLDgnc1LvFwrTXM.
- The review server: the old server (Windows PID 45732) stopped before the build, which writes the same `.next`; the scratch database reset (`reset-scratch.sh`: schema, hand SQL, 33 of 33 guards, families) and reseeded with the R63 harness (`journey-exit-seed.ts r63`, which runs seed-corpus.ts and adds Kroger's buyer words, Nfi's reply from Person1 and the pilot obligation, plus `r63-extra-seed.ts r63` for Unlinked); the stub on 4545 left running, its deals file refreshed from the new corpus (it rereads the file per request). seed-matrix.ts was not run on 55432: it is Worker B's on feat/gap-matrix and is written for the matrix database (55433) only; the journeys' accounts all come from the corpus and journey seeds. `next start -p 3100` on the new build (PID 26584).
- Read-only journeys (`r64/journeys.cjs`, a fresh signed-in headless browser, nothing pressed that writes): 15 of 15 checks. Work loads (200, 1.6 s); Costco ("Held: a customer (closed won)") and Sysco ("Held: parked after a lost deal") held on Work and on ?day=tomorrow; Walmart's pack says "No email: they opted out" with no send control; Kroger's story says "In 2 open deals" (never "Nothing has happened between us yet") and its Work card offers Prepared on the meeting; Nfi's story says "Person1 Scratch, VP Transportation replied on Oct 7"; no "Compose email" control on Work, the pack, Nfi or Accounts; a nonsense account id (/gap/accounts/no-such-account-zz9/) says "This account is not on your list" with Back to Work (HTTP 200, the named S7 debt). Kroger's Prepared outcome is checked as offered, not pressed (pressing it writes). The stub's write log reads zero notes and zero tasks (no HubSpot write).
- Decision recorded (the lead, 2026-10-07): R63-A N2 is by design: UNKNOWN is the truth vocabulary (STABLE_BASELINE), and EMAIL, PREPARED and RECORDED are CSS uppercase over sentence-case text.

**R64 Release (DONE, 2026-10-08).** The execution-recovery program (R00-R65) in production. Receipts, each verified
by the lead:
<!-- verified:2026-10-08 -->
- PR #410 merged with a merge commit: main 542a6b4d (branch head 85716b81; code e8163c33; gated at c9cff73b, plus the Coverage fix e972efbc and the types-only e8163c33).
- Vercel production: deployment dpl_C4THQEpA3qYy73JQt9A23sNLTx5W READY at 2026-10-08T02:27:23Z on 542a6b4d (build started 02:25Z), aliased to modex-gtm.vercel.app.
- Signed-out gates in production: GET /gap/ answers 307 to /login/?callbackUrl=https%3A%2F%2Fmodex-gtm.vercel.app%2Fgap%2F (R63-B S8 live); GET /api/email/send/ answers 401.
- `scripts/gap/verify-triggers.ts` against production: 33 of 33 guards passed, the transaction rolled back (the scratchpad `r64/verify-triggers-prod-*.txt`).
- The one additive production write, after its dry run (2026-10-07, 20:00 local: the 4 event-led families present, 2 to create): `GAP_OS_ENABLED=true npx tsx scripts/gap/seed-families.ts --apply --remote --created-by gap-r64-release` at 02:27Z created 2 families and 2 versions (job_procurement_led "Job or Procurement Posting", program gap-approach-2026-10:job_procurement_led, version 1; fit_led "Operating Fit", program gap-approach-2026-10:fit_led, version 1). A second run created 0 families and 0 versions (idempotent).
- The stranded PepsiCo draft: the read-only dry run before the repair found 1 stranded, 1 adoptable (cmux0uu7r0003jw0450gb4kno, persona 2236 "Tom", family unmapped, fact cmux0mg4s0005l204hrz6xd7x, key anchor:cmux0mg4s0005l204hrz6xd7x:p2236). Repaired through the production page at 02:31Z: on /gap/accounts/pepsico/ the proposal panel "One thing missing" offered the family question with GAP's derived suggestion (hidden capacity: a site closure or consolidation moves load onto the physical handoffs that remain), and "Submit for review with this problem" was pressed with that suggestion. The page reads "Proposal under review"; NEXT: "Review the proposal: approve it and the first touch is prepared, or set it aside." The dry run after: 0 stranded. The approval (approve and use) stays Casey's.
- Signed-in smoke through the rig: Work renders, its health line "Recommendations refreshed 2d ago · cards may be stale" with "Owner: operator" and the retry step (R63-A S16 live); /gap/accounts/pepsico/ renders; GET /api/gap/health/?operations=1 signed in: DEGRADED on routing only (the last completed routing run 2026-10-05T20:46Z; owner operator; retry "Run routing from a GAP lane"), mailbox HEALTHY (last run 8 minutes before), HubSpot reads OK in 172 ms, suppression OK, sender casey@yardflow.ai; operations: 1 draft stranded at that moment (before the repair).
- Rollback: promote 672570ed (dpl_5tW92dBWDxnL8VquojbfBedmu8MP). No schema, cron or dependency delta between 672570ed and 542a6b4d (prisma/, vercel.json and package.json unchanged).
- Canary window: open from 02:27Z; nothing else changes in production until Casey's next decision.
- New named debt (the list below): GitHub Actions never start.
- R65 is in production with this release: the health counts, the owners and retry paths, the stranded-draft dry run and the repair through the page.

**Consolidated debt (2026-10-07).** Every debt this recovery named, one line each, with its owner and the guard that
holds today; the entries above keep the detail. Owners: engineering (the GAP engineer of record), Casey (a product or
spend decision), operator (runs the system), copy (human-written words, Casey's).
- The account page's refresh stall: a router refresh result commits only on the next React update (a framework cause). Guard: 19c0c20e (`refreshNow` and the `RefreshNudge` follow-ups). Owner: engineering. No further work in this program (the lead's decision 2).
- A cold first byte of 1.6 to 1.8 s (the server starting; the sign-in page alone takes 1.47 s). Guard: none needed for correctness; the remembered summary shows first. Owner: engineering (platform).
- Prisma's idle `SELECT 1` on each pooled connection (the Rust engine). Guard: connection_limit 5. Owner: engineering.
- Work's rebuilt read takes 10.5 to 12.6 s under production-like latency (routing/inputs.ts readComms and execution/person-history.ts per card). Guard: the two-minute remembered read and the live reads beside it. Owner: engineering.
- A closure typed as `site_expansion` (the signal type set is a database CHECK with no closure value; research/facts.ts classifyFact). Guard: `metadata.change` carries "closure". Owner: engineering (a schema change).
- Work reads every commitment row on each render. Guard: today's volume. Owner: engineering (the indexed projection when rows grow).
- Pattern reads for referral names, asks, obligations, deal intents and research intents. Guard: the seller confirms or edits each. Owner: engineering.
- Free-text meeting attendees, no history for a moved meeting, no time for a meeting accepted by email. Guard: the seller adds the time. Owner: engineering.
- Deal scope needs a HubSpot contact id; division and site are free text. Guard: account-level is said as account-level. Owner: engineering.
- The plan's standard steps are one fixed list and are not mirrored to HubSpot. Guard: R54 proposes notes and fields only. Owner: engineering.
- Artifact texts are fixed templates; a recap sent outside GAP is not known. Guard: the seller records "copied". Owner: engineering.
- A HubSpot task's owner is the portal default; search-before-create depends on HubSpot's index delay. Guard: the mirror row and the marker search. Owner: engineering.
- "Paused" has no HubSpot field; a closure's held card speaks generic words until its summary is fresh. Guard: the routing hold. Owner: engineering.
- No next follow-up is proposed after a by-hand follow-up. Guard: the obligation closes and the next touch waits for a send or the seller's task. Owner: engineering.
- The rotation ranks by tier and band only; the site read is a pattern over the fact text; the job-led copy says "posting" for a procurement notice. Guard: the seller's priority reasons; review. Owner: engineering.
- R43 touch 2 and later have no copy family (every seeded approach family is single-touch). Guard: "prepare" is offered only for a version with step 1+ copy; the plan says follow up by hand. Owner: copy.
- No reply copy family. Guard: the answer is prepared from the buyer's own words and edited before use. Owner: copy.
- Generated quality has no held-out graded corpus (30 or more cases with model, prompt and policy versions). Guard: every generated line is reviewed by the seller. Owner: Casey and engineering.
- R42b: a reply seen only in HubSpot's connected inbox is prepared and copyable, not drafted or sent from GAP. Guard: the Gmail thread is required. Owner: engineering.
- The analyst tables on /gap/learning show sequence version ids, VERIFIED_FACT and campaign program keys. DECIDED by the lead (2026-10-07): they keep their words, analyst words by contract (R60). Kept here for the record; no longer open.
- One Sprint 5 review NICE not taken: a canceled meeting's rebook offer with HubSpot's stale next step. Guard: none. Owner: engineering (R62 lists it). The raw date in the brief (context/brief.ts) is fixed in 73a9a4bc.
- The app's main sidebar lists Accounts and Work Queue beside GAP OS. Guard: none (outside GAP). Owner: Casey (a system-wide change).
- Transcription stays off pending its spend. Guard: `GAP_TRANSCRIPTION_ENABLED` unset. Owner: Casey.
- R63-B S7: GAP detail pages answer 200 for an unknown id; the real 404 needs the id check in the proxy. Guard: the body says what is missing, links back to Work, and Next marks the response noindex. Owner: the lead. After R64 (the lead's decision 2026-10-07).
- R63-B N1 rest: admin words on the preview page's system details ("review_required to approved", "Emit enroll row (shadow)", "Hidden Capacity v1draft", "{{first_name}}", "Confidence 40%" without a trust word). Guard: they sit in the collapsed System details and the analyst views. Owner: engineering, copy for the words.
- R63-B N6: Mills reads "active" in the thesis list and "No usable thesis yet" on its page (the list shows the record's state, the page the gate's). Guard: the send gate refuses it. Owner: engineering.
- R63-B N7: "The opening story, above." can show when the anchor above is not shown (an account on hold). Guard: its basis names the anchor's fact. Owner: engineering.
- R63-B N13: a first-touch email opens by quoting the raw fact title. Guard: the seller reads every email before it goes. Owner: copy (Casey).
- R63-B N8: DECIDED by the lead, GAP keeps "about 5% ... observed" (the compiler enforces it; the repository canon line is the native site's copy). Listed for Casey in the final packet as a wording decision, not a blocker. Owner: Casey (wording only).
- R63-A N1 rest: "remit" in seller text (the remit caution, "it lands on their remit", "Location / remit unknown"; 19 test files pin it) and the "Next operator" slot name (a typed slot). Guard: words only. Owner: copy (Casey) for the word, engineering for the change.
- R63-A N2: DECIDED by the lead (2026-10-07), by design: UNKNOWN is the truth vocabulary (STABLE_BASELINE: an empty section says UNKNOWN); EMAIL, PREPARED and RECORDED are CSS uppercase over sentence-case text. Kept here for the record; no longer open.
- The whole-project eslint run: 1,045 errors and 84 warnings in 171 files, all present at the production base 672570ed (mostly `no-explicit-any` in GAP tests and services). Guard: tsc is clean and every file a change touches is linted clean of new errors. Owner: engineering.
- R63-A N4 rest: about 33 seller-visible strings still print an ISO date (`slice(0, 10)`: person factors, the paused-reply headline, a family's separate-motion line). Guard: the date is right, only its form. Owner: engineering.
- R63-A N6 rest: the Fedex first touch names the account three times (the headline, inside the quoted fact, "That might not be true at ..."); it is governed copy in a seeded approach family. Guard: the seller reads every email. Owner: copy (Casey), with R63-B N13.
- R63-A N8: the Accounts list says "no GAP touch yet" where a conversation or a deal exists (it reads GAP first touches only) and shows the record's vertical, not the page's industry words. Guard: the account page says what has happened. Owner: engineering (the index stays three cheap reads, UX-10).
- R63-A N9: a reply's meaning allows one choice. Guard: the seller records the strongest meaning and notes the rest. Owner: engineering.
- R63-A N11: the older Accounts page (/accounts, outside GAP) shows database id 9212 and recommends outreach at 0 contacts. Guard: none (legacy). Owner: the lead.
- GitHub Actions (typecheck, unit-tests) fail with zero steps in about 2 s on every main commit since at least 2026-10-06, 672570ed and #410 included: the runner never starts (Actions runner or billing). Main has no required checks. Guard: the local gates are the release gate (R63 gates, R64). Owner: Casey.

#### Post-release defects (the canary window)

- **2026-10-08, PepsiCo in production (Casey's screenshot 09:19 local): "Approve and use this story" greyed out, the button's tooltip reading as a hold.** Root cause: `outreach-anchor.tsx` disabled APPROVE AND USE on `!coldTouchAllowed`, and `coldTouchAllowed` is false under RESEARCH because no thesis is usable yet, which is exactly the state a proposal under review exists to change (`pursuit/load.ts`'s own NEXT said "Approve the proposal on this page"). The server never had that hold (`advance: approve_and_use` runs the audited transitions and the gate); only the button did, so approve-and-use through the page could not work on any account without a usable thesis. The R62 matrix approved through the API, the ux06 suite rendered the panel with `coldTouchAllowed` on, and the R64 repair stopped at submit (approval is Casey's), so it reached production. Fix: `approvalHoldFor(state)` in `pursuit/state.ts` names a hold only under a reply, an opt-out, a deal or a held account (the state's own blocker sentence); the anchor takes `approvalHold` and disables approval on that alone; the page passes it from the one pursuit read. Proof: `pursuit-state.test.ts` (the helper, research and ready open, the four holds named; mutation-tested: the helper returning null for every state breaks the hold case) and `ux06-views.test.tsx` (under research with `coldTouchAllowed` off the control is enabled and runs the audited advance; under a hold it is disabled with the hold sentence as its title). PR #412. <!-- verified:2026-10-08 -->

### HANDOFF

HANDOFF commit: 8e0bdaaf (docs only, branch docs/gap-r64-release off main 542a6b4d; the block below describes head_sha e8163c33 on feat/gap-account-first-ux, released as main 542a6b4d; first written in d3b6592a).

```yaml
# HANDOFF (this block's own commit SHA is on the ledger line directly above the block)
branch: feat/gap-account-first-ux
base_sha: e66a9853
head_sha: e8163c33
production_sha: 542a6b4d   # main, PR #410; dpl_C4THQEpA3qYy73JQt9A23sNLTx5W READY 2026-10-08T02:27:23Z (rollback: 672570ed)
tickets:
  R00: {disposition: DONE, evidence: "2113361c: production 672570ed reconciled; the capability matrix and the one stranded PepsiCo draft recorded"}
  R01: {disposition: DONE, evidence: "2113361c: the authority map and the scoped policy amendments"}
  R02: {disposition: DONE, evidence: "c0883ca4: scripts/gap/recovery/seed-corpus.ts, scratch only"}
  R03: {disposition: DONE, evidence: "2113361c: tests/unit/gap/scratch/anchor-draft.scratch.test.ts"}
  R04: {disposition: DONE, evidence: "2113361c: carried from docs/gap/ACCOUNT_FIRST_UX.md"}
  R05: {disposition: DONE, evidence: "f4b3c70f: GAP_SEND_TRANSPORT=sink and HUBSPOT_API_BASE_PATH refused under VERCEL_ENV=production"}
  R10: {disposition: DONE, evidence: "1b6416a9: state and anchor agree on an unread send gate"}
  R11: {disposition: DONE, evidence: "42b21547: the family derived with its basis, never asked for job or procurement drafts"}
  R12: {disposition: DONE, evidence: "42b21547: review where the action lives"}
  R13: {disposition: DONE, evidence: "1b6416a9: the confirm binds the sending mailbox; a live enrollment binds the recipient"}
  R14: {disposition: DONE, evidence: "32a67597: an outcome, not a navigation event"}
  R15: {disposition: DONE, evidence: "31c44d1f: measured with R61"}
  R20: {disposition: DONE, evidence: "71c4c3a8: coverage honesty; the coverage choice stays Casey's"}
  R21: {disposition: DONE, evidence: "1b6416a9: a vendor's claim about the account is quoted_third_party"}
  R22: {disposition: DONE, evidence: "1b6416a9: a closed RFP is not current; a repost is never a job-led trigger"}
  R23: {disposition: DONE, evidence: "4cf3fdb1: partnership and software claims are their own type"}
  R24: {disposition: DONE, evidence: "daa61ff3: research/currentness.ts is the one freshness authority"}
  R25: {disposition: DONE, evidence: "0beca6b3 and 71c4c3a8: the news budget and the research dead letter"}
  R30: {disposition: DONE, evidence: "1b6416a9: the approach's evidence policy at the gate"}
  R31: {disposition: DONE, evidence: "4cf3fdb1: Gatik is not an event, one guess everywhere"}
  R32: {disposition: DONE, evidence: "6f3fa5eb: the person matched to the motion and its scope"}
  R33: {disposition: DONE, evidence: "5f5e76cf and c0a4e214: a story set aside never returns; automatic reversible preparation"}
  R34: {disposition: DONE, evidence: "372f6609: copy read from the seeded rows, never READY without it"}
  R35: {disposition: DONE, evidence: "1b6416a9: a question asking what to write is answered with the control"}
  R40: {disposition: DONE, evidence: "1e7b4aa4: one durable commitment per obligation; counts are completions"}
  R41: {disposition: DONE, evidence: "1e7b4aa4: Work ranks today by commercial obligations"}
  R42: {disposition: DONE, evidence: "71b6ff36: reply triage through reply execution; R42b PARTIAL for a reply seen only in HubSpot's inbox (dependency: its Gmail thread)"}
  R43: {disposition: PARTIAL, evidence: "e2da206e: the plan, the holds and the recovery", dependency: "human-written step 1+ copy for the seeded approach families"}
  R44: {disposition: DONE, evidence: "16971d2c: capture once, one capture per reply"}
  R45: {disposition: DONE, evidence: "1e7b4aa4: close the day and keep tomorrow"}
  R50: {disposition: DONE, evidence: "6e16babd: buyer words carry their deal in every view"}
  R51: {disposition: DONE, evidence: "f43d5280: meeting preparation never mixes two deals' words"}
  R52: {disposition: DONE, evidence: "ea3645f2: a practical mutual action plan"}
  R53: {disposition: DONE, evidence: "20f244a3 and a0f6bb77: artifacts written to their recipient"}
  R54: {disposition: DONE, evidence: "4834eb2d and 4e936a90: no outdated recap written; conflicts in words; approved writes OFF in production"}
  R55: {disposition: DONE, evidence: "8feafd40: a reopened deal lists what its closure skipped, each restorable"}
  R60: {disposition: DONE, evidence: "8283a9cc, de14c0fa, 16971d2c (one capture per reply) and 216cd80a (the vocabulary)"}
  R61: {disposition: PARTIAL, evidence: "31c44d1f; the p95 re-judgment in the R61 entry", dependency: "cold first byte (platform); Prisma idle SELECT 1 per pooled connection; Work's rebuilt read"}
later_tickets:
  R62: {disposition: DONE, evidence: "acceptB's final pass on c9cff73b: 100 of 100 (feat/gap-matrix 8dbb9c57, re-headed 79bfdd4a); the one product defect it found fixed in e972efbc; merged in 307f3ee6"}
  R63: {disposition: DONE, evidence: "both reports dispositioned: R63-B (B1 8f7c20d5 3fe2c39e; S1-S15 fixed, S7 in part, its 404 named debt after R64) and R63-A (B1-B4 0fad39a5 5090fe4a 9893899f e6d1038f; the matrix's two 3f8753cd e6d1038f; S1-S17 fixed, S13 with its link 2684beae; S6 S7 S14 as R63-B's; NICE fixed, by design or named debt); the full gates and the rebuild run on the lead's word", dependency: "none for R63 (R63-A N2 decided by design); the 5% wording is listed for Casey, not a blocker"}
  R64: {disposition: DONE, evidence: "main 542a6b4d (PR #410); production dpl_C4THQEpA3qYy73JQt9A23sNLTx5W READY 2026-10-08T02:27:23Z; seed-families 2 families and 2 versions, idempotent; the PepsiCo draft repaired through the page; verify-triggers 33 of 33; the R64 entry"}
  R65: {disposition: DONE, evidence: "e5b0b567 the counts, d9902641 owners and retry paths, c72e6a2f the read-only dry run; in production at 542a6b4d (the dry run and the repair run there, the R64 entry)"}
reopened_unresolved:
  - "R43 touch 2 and later: human-written copy"
  - "generated quality: the graded corpus (30 or more cases with model, prompt and policy versions)"
  - "R61: cold first byte 1.6 to 1.8 s"
  - "R61: Prisma idle SELECT 1 per pooled connection"
  - "R61: Work's rebuilt read 10.5 to 12.6 s under production-like latency"
  - "a closure typed as site_expansion (research/facts.ts classifyFact; the signal type CHECK has no closure value)"
  - "one Sprint 5 review NICE not taken: a canceled meeting's rebook offer and HubSpot's stale next step (the raw date in the brief is fixed in 73a9a4bc)"
r62_cases:
  matrix: {branch: feat/gap-matrix, sha: 79bfdd4a, content_of: 8dbb9c57, merged_in: 307f3ee6, files: "tests/unit/gap/scratch/matrix-*.scratch.test.ts", file_count: 9, cases: 100, note: "100 of 100 on c9cff73b is acceptB's receipt (55433); the matrix seed, stubs and docs/gap/RUNBOOK.md came with it"}
  groups: [migration and boundaries, daily work, dependencies, execution, identity and scope, Pepsi regression, replies and capture, source truth and commercial relevance]
  stub_controls: "scripts/gap/recovery/stubs.mjs: POST /__stub/matrix (the matrix failure controls), POST /__stub/control, POST /__stub/deal-property, GET /__stub/writes"
  add:
    - "a reply logged through Capture with the real disposition and BID services: one capture, one disposition sourced to the message, the kept statements linked; opened again it returns the same note; Work drops the card"
    - "a reply card and the account page offer only Capture; no reply form on the account"
    - "a deal closed in HubSpot is named with its outcome on its kept rows, in Work and in meeting preparation; never its id"
    - "a reopened deal lists what its closure skipped; Restore makes one open obligation, refused while the deal is closed"
    - "a new recap retires the earlier unwritten recap on its deal; the replaced one is refused at retry and absent from Coverage"
    - "buyer words in NOW, the brief and the story carry their deal; a detention figure counts as cost"
    - "artifacts in the second person; no CRM deal name in buyer text"
    - "no seller heading or label says HYPOTHESIS or BID"
    - "the stranded-draft dry run names ADOPT for the Pepsiprod Tulsa draft; the R11 service then adopts that id"
    - "GET /api/gap/health?operations=1 counts the broken handoffs and HubSpot failures with owners and retry paths; the plain call carries none"
    - "an opt-out reply on file, unrecorded, refuses the legacy composer's send with the reason text; the composer is absent on GAP pages"
    - "a parked account (closed lost, nothing since) holds on Work's first load in the closure's words; the gate refuses its first touch"
    - "an opt-out on file shows no draft on the pack page; no Answer in Gmail on an opt-out or a bounce"
    - "a proposed plan records only what was chosen; a stale Skip today is one row and one line on Work"
    - "a restored skip leaves the day's set-aside list; Kroger's story says what has happened (deals, their words, the meeting)"
    - "a seller's own promise in a note is owed by the seller; a buyer's third-person promise is chased"
    - "a customer or lost-deal account holds on Work and on the tomorrow preview after a restart, with no page visit"
    - "the tomorrow preview offers no outreach where a reply waits or a do not contact is recorded"
    - "the story names the person who replied (resolved from the address)"
    - "a recorded reply's card clears on the next Refresh; its answer stays owed until sent or copied"
    - "Prepared on a meeting card closes the day: Work says Done for today"
    - "the Work card's action equals the account page's NEXT for an approved story not in use, before any visit"
    - "the Accounts search finds an account GAP has not worked; an unlinked account says no HubSpot company is linked"
    - "after one send on a single-touch family: Touch 1 sent and the follow-up day; one motion line with a name"
  decide: "DECIDED by the lead 2026-10-07: the analyst tables lower on /gap/learning keep their words (sequence version ids, VERIFIED_FACT, program keys), analyst words by contract (R60)"
r63_seller_tasks:
  - work today's list
  - handle a reply (Log what they said, one capture)
  - prepare a first touch
  - record a note
  - resume tomorrow
  - a no-action account
  - an unsupported-data account
  - the accessibility and trust pass
r64_release_requirements:
  - "DONE: a PR from feat/gap-account-first-ux to main with the attribution lines (PR #410)"
  - "DONE: merged with a merge commit, main 542a6b4d; Vercel production dpl_C4THQEpA3qYy73JQt9A23sNLTx5W READY 2026-10-08T02:27:23Z on 542a6b4d"
  - "DONE: the one named additive production write, GAP_OS_ENABLED=true npx tsx scripts/gap/seed-families.ts --apply --remote --created-by gap-r64-release at 02:27Z, after its dry run (2026-10-07 20:00 local): 2 families, 2 versions (job_procurement_led, fit_led); a second run 0 and 0"
  - "DONE: the stranded PepsiCo draft cmux0uu7r0003jw0450gb4kno repaired through the page at 02:31Z (submitted for review with GAP's derived family; approve and use is Casey's); the dry run before (1 adoptable) and after (0 stranded)"
  - "DONE: read-only smoke: verify-triggers.ts 33 of 33 against production (rolled back); signed out /gap/ 307 with the callback and /api/email/send/ 401; signed in Work, /gap/accounts/pepsico/ and /api/gap/health/?operations=1 (DEGRADED on routing only)"
  - "DONE: the canary window, open from 02:27Z; nothing else changes until Casey's next decision"
  - "DONE: rollback recorded: promote 672570ed (dpl_5tW92dBWDxnL8VquojbfBedmu8MP); no schema, cron or dependency delta"
  - "CANARY DEFECT 2026-10-08: APPROVE AND USE disabled under RESEARCH (the anchor read coldTouchAllowed as a hold); fixed in PR #412 (approvalHoldFor); see Post-release defects above the block"
r65_requirements:
  counts: [stranded drafts, incomplete proposals, dead-letter signals, queue age, research freshness and cost, preparation latency, seller corrections, outcomes, R54 sync failures]
  where: "GET /api/gap/health?operations=1 (the operator: failures with owners and retry paths); /gap/learning (Casey: decisions only, with outcomes and research cost)"
  dry_run: "scripts/gap/recovery/repair-stranded-drafts.ts --dry-run [--json]; refuses without --dry-run; a read-only client; tests/unit/gap/r65-stranded-repair.test.ts and tests/unit/gap/scratch/stranded-repair.scratch.test.ts"
  runbook: "docs/gap/RUNBOOK.md on feat/gap-matrix at caa0772c (a43b46b3 on origin)"
  debt: "the consolidated debt list directly above this block, each with its owner and guard"
enabled_vs_code_complete_disabled:
  production_flags:   # the GAP CORE LIVE block and R00, unless said
    GAP_OS_ENABLED: "on"
    GAP_HYPOTHESIS_ENABLED: "on"
    GAP_ROUTING_ENABLED: "on"
    GAP_MESSAGE_COMPILER_ENABLED: "on"
    GAP_REPLY_CLASSIFICATION_ENABLED: "on"
    GAP_BACKGROUND_RESEARCH_ENABLED: "on (R00, on the cron schedule)"
    GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED: "off"
    GAP_AUTO_ENROLL_ENABLED: "off"
    GAP_AUTO_ENROLL_SHADOW: "off"
    GAP_HUBSPOT_MIRROR_ENABLED: "off"
    GAP_CRM_APPROVED_WRITES_ENABLED: "unset (added on this branch; default off; stays off)"
    GAP_TRANSCRIPTION_ENABLED: "unset (R00: transcription disabled pending its spend)"
  code_complete_but_off:
    - "approved HubSpot writes (R54, GAP_CRM_APPROVED_WRITES_ENABLED): proposals and approvals record; nothing is written"
    - "the automatic HubSpot mirror (GAP_HUBSPOT_MIRROR_ENABLED)"
    - "auto-enroll and its shadow"
    - "HubSpot sequence publishing"
    - "dictation (transcription)"
    - "the transport sink and the HubSpot base-path override: test harness only; refused under VERCEL_ENV=production (f4b3c70f)"
environment:
  postgres: "embedded, postgresql://postgres:scratch@127.0.0.1:55432/gap_finish_e2e; reset with the scratchpad reset-scratch.sh (schema, hand SQL, 33 guards, families)"
  stub: "node scripts/gap/recovery/stubs.mjs 4545 (HubSpot and clawd), STUB_DEALS_FILE and STUB_COMPANIES from the seed"
  seed: "scripts/gap/recovery/seed-corpus.ts (and seed-matrix.ts on feat/gap-matrix)"
  env: "scratch-env.sh: GAP flags on, GAP_SEND_TRANSPORT=sink, HUBSPOT_API_BASE_PATH at the stub, DATABASE_URL at the scratch database"
  build_and_serve: "npm run build, then next start -p 3100 (NODE_ENV=production, PORT unset)"
  session: "AUTH_SECRET=<scratch secret> node mint-cookie.mjs, sent as authjs.session-token"
  rules: "scratch tests with --maxWorkers=1 (one shared database); stop the server and the stub after a run"
test_receipts:
  r61_run: {sha: e66a9853, source: "as reported at the R61 checkpoint; not repeated in the ledger", typecheck: clean, gap: "390 files / 5,593 tests", scratch: "8 files / 47 tests", rest: "326 files / 2,298 tests, 1 skipped", journeys: "r5-exit/ 11 steps; r60-final/ 7 of 7"}
  latest: {sha: c9cff73b, typecheck: "npx tsc --noEmit -p . (clean, 8 s)", lint: "npx eslint .: 1,045 errors and 84 warnings, all present at 672570ed; the branch adds none after ba29d430", gap: "npx vitest run tests/unit/gap/<four chunks> --maxWorkers=2: 445 files / 5,765 tests, 278 s", scratch: "GAP_SCRATCH_DATABASE_URL=<scratch> npx vitest run tests/unit/gap/scratch --maxWorkers=1: 9 files / 50 tests, 33 s", rest: "npx vitest run --maxWorkers=2 --exclude tests/unit/gap/**: 328 files / 2,311 passed, 1 skipped, 156 s", build: "npm run build: compiled, 99 s, BUILD_ID 5wDGj3pLDgnc1LvFwrTXM", journeys: "r64/journeys/ 15 of 15 checks on the rebuilt server (PID 26584), zero HubSpot writes", forced_fixes: "ba29d430 (lint), c9cff73b (a test pinned the old citation name)"}
  r62_final_307f3ee6: "e972efbc (the Coverage tie): r62-crm-tie 2, crm-sync 22, deal-artifacts 10, s5-review-recap 3, coverage 10, coverage-page 1, deal-brief 18, singly, green; a red mutation; eslint and tsc clean on the touched files. The merge 307f3ee6: src diff from c9cff73b is the fix alone; whole-project tsc has 4 errors in the merged matrix test files (acceptB's; next build skips test files); no full suite, no rebuild (Vercel builds the merge)"
  matrix_types_e8163c33: "the four matrix type errors fixed, types only: npx tsc --noEmit -p . clean (7 s); eslint clean on matrix-dependencies, matrix-identity and matrix-pepsi; the files run on 55433 (acceptB)"
  gates_4e936a90: {sha: 4e936a90, typecheck: "npx tsc --noEmit -p . (clean)", gap: "npx vitest run tests/unit/gap/<four chunks> --maxWorkers=2: 403 files / 5,653 tests", scratch: "GAP_SCRATCH_DATABASE_URL=<scratch> npx vitest run tests/unit/gap/scratch --maxWorkers=1: 9 files / 50 tests", rest_e5b0b567: "npx vitest run --maxWorkers=2 --exclude tests/unit/gap/**: 326 files / 2,299 passed, 1 skipped", build_e5b0b567: "npm run build: compiled", journeys_a0f6bb77: "r62-exit2/ 12 steps and r62-capture2/ 6 steps, zero internal-text hits, zero HubSpot writes", r65_live_e5b0b567: "r65-live/"}
  after_4e936a90: "16971d2c and d9902641: focused tests only under the load cap (r60-capture-reply 11, capture-once and capture 25, r65-operations and learning-dashboard 19), each with a red mutation"
  r63_fix_3fe2c39e: "8f7c20d5 and 3fe2c39e: eight files run singly with --maxWorkers=1, 41 tests (r63-opt-out-send 4, r63-compose-on-gap 2, email-send-routes 11, queue-send-deps 10, warm-intro-writers 7, perform-send-parity 3, campaign-tag-flow 2, b4-unsubscribe-case-insensitive 2), a red mutation on each fix; eslint and tsc clean"
  r63_b_b63f2e69: "77261d91..b63f2e69: the 19 R63 test files run singly with --maxWorkers=1, 59 tests green; neighbors run singly at each commit; a red mutation on each fix; eslint and tsc clean; no full suite, no build"
  r63_a_772de979: "0fad39a5..772de979: the 43 R63 test files (R63-B and R63-A) run singly with --maxWorkers=1, 115 tests green; neighbors run singly at each commit; a red mutation on each fix; eslint and tsc clean; no full suite, no build"
  r63_a_1b240b19: "after 2684beae (S13's link) and 1b240b19 (N10's title): the 44 R63 test files run singly with --maxWorkers=1, 116 tests green; a red mutation on each; eslint and tsc clean; no full suite, no build"
genuine_blockers: []   # 2026-10-08, after R64
```

### GAP OS SALES EXECUTION ENGINE (2026-10-08, in progress)
<!-- verified:2026-10-08 -->

STATUS: ACTIVE. Casey's "GAP OS FINAL PRODUCT MANDATE AND BUILD INSTRUCTIONS" (2026-10-08) is the deliberate
next-version decision (STABLE_BASELINE rule 4). It continues the R00-R65 program above; that record is preserved
unchanged. One writer: branch `feat/gap-execution-engine` from main 2759f2ab in worktree `wt-gap-account-first-ux`.

#### Product definition

GAP OS is Casey's AI-powered sales execution engine: every morning it knows which accounts and people deserve
attention, why, and the next action; it mails a briefing; Casey works the day from email or the app; each item
arrives prepared (intelligence, evidence, the message or the call opener) and can be approved, revised, deferred or
skipped; a revision request becomes durable agent work that returns an improved recommendation; an executed action
is recorded as what actually happened; unfinished work stays until resolved. The objective is substantially more
quality selling activity with substantially less administrative effort, not more software.

#### The seller operating loop

Briefing (email, the day's plan) -> START (the first assignment, by email or in the app) -> read the prepared item
-> APPROVE (a real Gmail draft, then CONFIRM + SEND in the app) | REVISE: words (an agent task; the revision
returns in the same thread) | DEFER | SKIP | DONE: words -> NEXT (the next assignment) -> the ledger records what
happened -> tomorrow's plan carries what is unresolved. Deals, replies, meetings and follow-ups are items in the same
plan; account research is background.

#### Baseline (2026-10-08, verified against production and the code)

Production: main 2759f2ab (PR #412) == `dpl_Dv77MfLrk62bNXYm7ToWRUpKKB8u` READY 13:42Z; flags as the GAP CORE LIVE
block. The live Work page that morning: a degraded banner telling the seller to "Run routing from a GAP lane"
(recommendations three days old; routing has no schedule); the first two cards were untriaged replies from Jun 2
(Boston Beer) and Aug 18 (Gusto, a benefits vendor writing to Jake, not a prospect); eight in-deal cards all saying
"the close date has passed, confirm the real date"; 1 Ready, 11 Research, 13 held; Done today 0. The feedback
backlog held no Casey note.

| Capability | Verdict | Where |
|---|---|---|
| One ranked day (commitments, replies, meetings, deal work, follow-ups, prepared prospecting, review, research, admin, parked); the Today panel; the tomorrow preview; Skip, Snooze, Logged; commitments with proof | VERIFIED | `work/list.ts`, `work/today.ts`, `work/outcome.ts`, `work/commitments.ts` (R41, R45, R14, R40) |
| Account page: pursuit state, NEXT, proposal review, approve and use, people stack, story, deal brief (plan, artifacts, meeting prep, CRM proposals) | VERIFIED | `account-now.tsx`, `pursuit/*`, `deals/*` |
| First touch: preview, CONFIRM + SEND through the GAP Gmail identity, one DIRECT_SENT row, a replay refused; Gmail drafts of a first touch and of a reply answer; draft -> sent / vanished reconcile; unknown-send reconcile; a follow-up sent by hand closed from Sent | VERIFIED | `execution/seller-send.ts`, `seller-draft.ts`, `seller-reply.ts`, `draft-reconcile.ts`, `gap-mailbox.ts` |
| Reply intake (the GAP mailbox every 10 minutes; HubSpot's inbox daily), classification, opt-outs, bounces, the prepared editable answer | VERIFIED | `replies/*` |
| Calls: the brief, the opener from the thesis, outcomes (18 classes plus no answer, voicemail, gatekeeper), BID | VERIFIED | `app/gap/call/[personaId]`, `disposition/*` |
| Research: the hourly background cron (cap 3), RESEARCH THIS, deepen, the verified-evidence inbox, auto-prepared proposals | VERIFIED | `research/background.ts`, `research/auto-prepare.ts` |
| Approved HubSpot writes (note, task, hs_next_step) and the hypothesis mirror | VERIFIED code, flags OFF | `crm-writer.ts`, `crm-sync.ts`, `hubspot-mirror.ts` |
| HubSpot sequence enrollment write | PARTIAL, dark | `execution/hubspot-sequence-adapter.ts`; write scope never proven; no caller |
| Routing on a schedule | MISSING | `/api/gap/routing/run` is a session or token POST; nothing schedules it |
| A persisted day: START, a record of the day, day over day, targets and counts | MISSING | `today.ts` is "NO new storage"; only sessionStorage order |
| A morning briefing from GAP's day; delivery preferences; once per day; retries; signed links | MISSING | the legacy `daily-digest` cron mails a HubSpot pipeline digest to an env address |
| Email commands, authenticated, mapped to an item; replay and stale approvals refused | MISSING | `classifyMailboxMessage` returns `own` for the mailbox's own address and ignores it; no signed action link exists beyond unsubscribe and the open pixel |
| A seller's critique becoming durable agent work that returns an improved recommendation | MISSING | feedback notes never change state; Ask GAP maps regexes to fixed proposals; no job table (ResearchRun is written after the run; GenerationJob never retries) |
| A per-recipient revised copy the draft and send services can bind | MISSING | `prepareSellerEmail` renders only the version's step template (`action-pack.ts` loadActionPack) and binds that hash |
| Copied is not sent | PARTIAL, inconsistent | a copied reply clears "Answer them" (`work/recorded-replies.ts` counts REPLY_COPIED), a copied recap counts as sent back (`deals/workspace.ts` recapSentAtOf); a copied cold email is recorded (`copy_released`) and never read |
| Aging windows | PARTIAL | overdue commitments never drop; a recorded reply stops being owed after 14 days; a send older than 30 days makes no follow-up |
| Call follow-ups from no answer or voicemail; objection prep; the person's activity timeline on the brief; a dial attempt recorded | MISSING / PARTIAL | `commitmentsFromDisposition` creates none for those; `outbound-check` is read-only |
| Operating modes (prepare / review / execute) as a product setting | MISSING | implicit in flags |
| Delivered state from a provider event | MISSING | no writer; never claimed |

#### Architecture: one durable day, every consumer reads it

- **One day builder.** `work/load-day.ts` `loadWorkDay(prisma, {now})` is the single function the Work page and
  the briefing cron call (the page's `loadCockpit` plus its second wave, extracted). A briefing never rebuilds a
  second, inconsistent list.
- **The day snapshot** is ONE `work.day_planned` GapAuditEvent per New York day (claimed under an advisory lock,
  the commitments pattern): the ordered items with an episode-bearing key (`reply:<messageId>`,
  `commitment:<id>`, `first_touch:<decisionId>`, `deal:<dealId>:<signal>:<day>`, `meeting:<id>`,
  `review:<hypothesisId>`, `research:<account>:<day>`), their object references and an unguessable per-item
  token. No new table in this program's first increments. Transitions stay with their OWNERS: an obligation's Done,
  Snooze, Skip and Restore in `work/commitments.ts`; an account's skip, snooze and "logged outside GAP" in
  `work/outcome.ts`; a send in the execution ledger. The plan records only START (`work.day_started`), the
  assignments and the revisions. A card the builder no longer produces while its owner still holds it open is
  reported as carried, never dropped silently; a degraded read (HubSpot unavailable, a cold instance) never marks
  anything dropped.
- **Provider ownership.** Gmail through the GAP identity (casey@yardflow.ai) owns drafts, sends and the briefing;
  HubSpot owns engagement logging (the connected inbox) and, behind their flags, approved notes, tasks and the next
  step; SendGrid has no GAP role; sequence enrollment stays dark until its write scope is proven. One wire
  (`gmail-sender.ts`); internal mail goes through `sendViaGmail` with purpose OPERATOR_ALERT and an
  `Auto-Submitted: auto-generated` header, never through `sendEmail` (which logs every send to HubSpot).
- **Seller settings** in SystemConfig `gap:seller:settings`: briefing_to, briefing_hour (New York),
  command_senders, mode (`prepare | review`; `execute` is defined below and refused until its amendment is
  recorded), targets per activity kind (later). The GAP mailbox itself is refused as briefing_to or a command
  sender (a reply to oneself lands in Sent and is never read).
- **The briefing** (`/api/cron/gap-briefing`, hourly tick, flag `GAP_BRIEFING_ENABLED`): at or after the
  configured hour it claims the day (SystemConfig plus a `briefing.sent` row), plans the day, renders the briefing
  from the snapshot (`work/briefing.ts`, pure), sends it from the GAP identity to briefing_to, Reply-To the GAP
  mailbox, subject carrying `[GAP#<day token>]`. Before any resend it checks Sent for the day token (the
  unknown-send pattern). A failure is recorded and retried on the next tick, three attempts, then visible on
  health. Links are HMAC-signed (`work/action-token.ts`, `GAP_ACTION_SECRET`, an expiry) and open the
  session-protected app at the item; a link never executes an external action by itself.
- **Assignments and commands.** START sends one assignment email per item (built from `ask/context.ts`
  buildAskContext and `loadActionPack` copy with its citations), recorded as `work.assignment_sent` with the Gmail
  threadId, the RFC message id, the item key, the revision and the content hash. The mailbox cron (already every
  10 minutes) gains a `command` verdict judged BEFORE `own` and before attribution: the sender is in
  command_senders, the message's thread or In-Reply-To matches a recorded assignment, Authentication-Results shows
  DMARC pass aligned to the From domain (freightroll.com and yardflow.ai both publish SPF including Google and a
  DMARC record, checked 2026-10-08), no Auto-Submitted or Precedence bulk header, not a forward. The parser
  (`replies/commands.ts`, pure) reads the first non-quoted line: `APPROVE | REVISE: <words> | SKIP | DEFER [date]
  | DONE: <words> | NEXT | HELP`; a line of sentence length that is none of these is REVISE with the body as the
  critique; a short unknown line gets one HELP reply (rate-limited) and nothing executes. A command is consumed
  once per (assignment, revision, command); a token for an older revision is a stale approval, refused and
  explained; every effect runs after the verdict row is written and re-runs every click-time gate. HTML-only mail
  falls back to its text.
- **Agent tasks** as ledger rows (`agents/tasks.ts`: `agent.task_queued | task_claimed | task_succeeded |
  task_failed | task_superseded`), claimed under an advisory lock with a lease longer than the function limit,
  attempts counted at claim, a fence token on completion; drained by `/api/cron/gap-agent-tasks` (every 5
  minutes, flag `GAP_AGENT_TASKS_ENABLED`) and kicked immediately with `after()` from the command handler. One
  handler first, `revise_message`: the critique, the current copy and the account's verified facts go to the
  existing LLM client; the result must pass the compiler's checks (`compiler/compile.ts`) or the task ends
  `could_not_satisfy` with the reasons (never invented evidence); a success writes `work.item_revised` (revision
  + 1) and re-sends the assignment in the same thread. A newer REVISE supersedes a queued one; a result arriving
  after an APPROVE is a proposal only. Failures show on the item and on `health?operations=1`.
- **The revised copy reaches the draft** through `execution/copy-revision.ts`: an approved per-decision,
  per-step revision (`execution.copy_revision_approved`: subject, body, hash, revision, the facts it rests on)
  that `loadActionPack` reads in place of the template render, with its own compile row, so `prepareSellerEmail`
  and the send bind the revised hash end to end. A revision that needs a fact the thesis does not carry is refused
  at the evidence gate like any other copy.
- **APPROVE** in `review` mode records the approved revision (when one exists) and creates the real Gmail draft
  through `createSellerGmailDraft` (every gate), then replies with the Gmail link and the CONFIRM + SEND link. The
  send itself stays the session-authenticated route: STABLE_BASELINE R42b and amendment 1 ("an actual send ...
  still human and explicit") and `seller-send.ts` ("reached only from the session-authenticated route, never from
  a cron") are not amended by this program. `execute` mode (a send on APPROVE for recipients on an allowlist) is
  defined in settings and REFUSED until Casey records that amendment; it is the one open product decision.
- **Routing on a schedule** (`/api/cron/gap-routing`, apply mode over the routable-hypothesis scope, bounded,
  flag `GAP_ROUTING_CRON_ENABLED`) runs before the briefing hour: automatic, reversible, internal preparation under
  amendment 1. The degraded banner on Work moves to System in seller words.
- **Activity semantics** (the mandate's section 10): a projection over the existing ledger, one module
  (`work/activity.ts`): research_generated, proposal_prepared, draft_created, message_approved, content_copied,
  message_sent (provider-proven), reply_received, call_attempted, conversation_completed, meeting_booked,
  deal_advanced, task_deferred, work_blocked, each with `basis: provider | self_reported`. Delivered is never
  claimed. The three copy conflations are fixed at their readers: a copied reply or recap stays owed as "copied,
  GAP has not seen it sent" until Sent shows it (the follow-up-by-hand pattern) or the seller says sent by hand
  (self-reported, labelled).
- **Calls**: the brief gains the person's timeline (sends, drafts, replies, dispositions) and likely objections
  (an agent task, grounded); releasing the dial link records `call.attempt_started` (self-reported); no answer and
  voicemail create a follow-up (two business days, up to the existing three-attempt hold); gatekeeper creates a
  task. A script is never a call.
- **Deals**: the buyer's next step (HubSpot hs_next_step) leads the deal card and shows on NOW, the hygiene line
  second; deal obligations are plan items like any other; approved writes stay behind their flag.

#### Independent review (2026-10-08, a fresh read-only agent) and its dispositions

Six blockers, all verified in the code and all taken: B1 an email APPROVE must not send (the HUMAN_APPROVED_1TO1
contract and the autonomy halt): APPROVE drafts, the send stays CONFIRM + SEND; B2 the revised copy had no route
into the draft service: the copy-revision ticket (X10); B3 a work-item status machine would conflict with the
commitment and outcome owners: the snapshot records START, assignments and revisions only; B4 the page assembled
the day inside the component: `loadWorkDay` first (X01); B5 "sender plus subject token" is spoofable: thread
match plus DMARC alignment required; B6 the mailbox cron would classify a self-addressed reply as `own`:
the command verdict runs first and the GAP mailbox is refused as a command sender. Its SHOULD list is taken
(sendViaGmail with OPERATOR_ALERT and Auto-Submitted; the threadId as the binding; buildAskContext as the
grounding; one handler first; the snapshot as a ledger row; effects after the verdict row; each ranking repair
alone). Documented disagreements: (1) the legacy `daily-digest` cron is not retired in the same ticket that turns
the briefing on; two morning emails for a few days is Casey's call, named in settings; (2) the scorecard and
targets are kept (Casey asked for daily activity counts against a target) but after the demonstration path;
(3) `execute` mode is defined now so the rollout policy lives in the product, and refused until amended.

#### Atomic backlog (the demonstration path first; each ticket: outcome, boundary, files, dependencies, acceptance, test, demo evidence, commit)

- **X01 `loadWorkDay`** Outcome: the Work page and any cron build the identical day. Boundary: move
  `loadCockpit` and the second wave from `src/app/gap/page.tsx` into `src/lib/gap/work/load-day.ts`; the page
  calls it. Deps: none. Acceptance: the page renders unchanged; a source test proves the page builds no day of
  its own; a unit test runs `loadWorkDay` over fakes. Test: `tests/unit/gap/load-day.test.ts`. Demo: Work on the
  harness unchanged.
- **X02 routing cron** Outcome: recommendations are never days old before the briefing. Boundary:
  `src/app/api/cron/gap-routing/route.ts` (apply over the routable scope, bounded), `vercel.json` (weekdays 10:30
  UTC), flag `GAP_ROUTING_CRON_ENABLED` default off, health copy in seller words. Deps: none. Acceptance: off
  answers the skip payload; on runs `runRouting` once per day under a claim. Test: `gap-routing-cron.test.ts`.
- **X03 seller settings** Outcome: the briefing address, hour, command senders and mode live in the product.
  Boundary: `src/lib/gap/work/settings.ts` (SystemConfig `gap:seller:settings`, validation: the GAP mailbox
  refused; mode `execute` refused), `GET/POST /api/gap/settings` (session), `scripts/gap/set-seller-settings.ts`.
  Deps: none. Acceptance: round trip; refusals named. Test: `seller-settings.test.ts`.
- **X04 the day snapshot** Outcome: one durable plan per day with tokens. Boundary: `src/lib/gap/work/plan.ts`
  (`planDay`, `loadDayPlan`, item keys, tokens, `work.day_planned`), the advisory-lock claim. Deps: X01.
  Acceptance: two concurrent plans write one row; keys carry an episode; the snapshot lists what workDay listed.
  Test: `day-plan.test.ts` (plus a scratch test over Postgres for the lock).
- **X05 the briefing** Outcome: a useful morning email from the canonical day, once. Boundary:
  `src/lib/gap/work/briefing.ts` (pure render), `src/lib/gap/work/action-token.ts`, `src/app/api/cron/gap-briefing/
  route.ts`, `vercel.json` (hourly), flag `GAP_BRIEFING_ENABLED`, `briefing.sent | briefing.failed` rows. Deps:
  X01, X03, X04. Acceptance: sent at the hour, once per day, retried after a failure, resend only after Sent is
  checked; links signed with an expiry; the GAP mailbox never the recipient. Test: `briefing.test.ts`,
  `action-token.test.ts` (mutation: a forged token is refused).
- **X06 START and the assignment** Outcome: one prepared assignment per item, by email or in the app.
  Boundary: `src/lib/gap/work/assignment.ts` (render from buildAskContext plus the pack copy with citations;
  `work.day_started`, `work.assignment_sent` with threadId, rfc id, key, revision, hash), `/gap/start` (session),
  NEXT. Deps: X04, X05. Acceptance: the record carries the threadId and hash; the body never starts a line with a
  command word. Test: `assignment.test.ts`.
- **X07 the command verdict** Outcome: Casey's reply acts on the right item, authenticated, once. Boundary:
  `src/lib/gap/replies/commands.ts` (pure parser and authentication), `gap-mailbox.ts` (`command` before `own`),
  `mailbox.command` and `work.command_applied | command_refused` rows, effects for SKIP, DEFER, DONE: words,
  NEXT, HELP. Deps: X03, X06. Acceptance: forged sender, missing DMARC alignment, a forward, an auto-reply, a
  stale revision, a replayed command are each refused with the reason; effects run after the verdict row. Test:
  `commands.test.ts` (mutation: removing the DMARC check lets a forged command through).
- **X08 agent task ledger and cron** Outcome: durable, visible agent work. Boundary:
  `src/lib/gap/agents/tasks.ts`, `/api/cron/gap-agent-tasks` (every 5 minutes), flag `GAP_AGENT_TASKS_ENABLED`,
  health counts. Deps: none. Acceptance: a claim is exclusive; a lease outlives the function limit; attempts count
  at claim; a zombie cannot complete a newer attempt; three failures end the task. Test: `agent-tasks.test.ts`.
- **X09 `revise_message`** Outcome: a critique returns an improved, compiled recommendation in the same thread.
  Boundary: `src/lib/gap/agents/revise-message.ts`, the REVISE command creating the task, `work.item_revised`,
  the re-sent assignment. Deps: X07, X08. Acceptance: a revision passes compile or ends could_not_satisfy with
  reasons; no invented fact; a newer REVISE supersedes. Test: `revise-message.test.ts` (fake LLM).
- **X10 copy revision binding** Outcome: the approved revision is what the draft and the send carry. Boundary:
  `src/lib/gap/execution/copy-revision.ts`, `loadActionPack` reads it, a compile row for it,
  `execution.copy_revision_approved`. Deps: none. Acceptance: after approval the pack's hash is the revision's;
  the draft idempotency key carries it; a superseded revision never renders. Test: `copy-revision.test.ts`
  (mutation: the pack ignoring the revision makes the draft carry the template hash).
- **X11 APPROVE by email** Outcome: APPROVE yields a real editable Gmail draft and the send link. Boundary: the
  APPROVE effect in `commands.ts`, `createSellerGmailDraft`, the acknowledgment email; `prepare` mode refuses.
  Deps: X07, X10. Acceptance: one draft per decision, step and hash; the acknowledgment carries both links; the
  send remains the session route. Test: `approve-command.test.ts`.
- **X12 the demonstration** Outcome: the mandate's section 17, steps 1-12, on the harness (sink mailbox,
  labelled simulated), then the real-Gmail variant from the legacy identity to Casey's own address (labelled
  real). Deps: X01-X11. Evidence: `docs/gap/execution-engine-demo-latest.md`.
- Then, each alone: **X13** settings page, targets and the scorecard (today against target, yesterday, the week);
  **X14a** a copied reply stays owed until Sent shows it; **X14b** a copied recap likewise; **X14c** a copied cold
  email shown as copied, send pending; **X15a** an untriaged reply older than 14 days ranks as admin; **X15b** a
  non-prospect inbound (a vendor writing to a teammate) is excluded; **X15c** the deal card leads with
  hs_next_step; **X15d** the degraded banner in seller words at the foot; **X16a** call attempt recorded; **X16b**
  no answer and voicemail make a follow-up; **X16c** the person's timeline on the brief; **X16d** objections
  task; **X17** the deal next step on NOW; **X18** carried work reported; **X19** retire the legacy digest (Casey's
  call); **X20** `activity.ts` and the accountability view.

#### Receipts (each ticket one commit on `feat/gap-execution-engine`, RED then GREEN then one mutation per invariant; focused vitest, tsc, eslint on the touched files)
<!-- verified:2026-10-08 -->

- X01 16270691 `work/load-day.ts` + `work/cockpit-read.ts` (load-day.test.ts 5)
- X02 062f1b24 `/api/cron/gap-routing`, flag GAP_ROUTING_CRON_ENABLED (gap-routing-cron.test.ts 6)
- X03 ab278020 `work/settings.ts`, `/api/gap/settings`, `scripts/gap/set-seller-settings.ts` (seller-settings.test.ts 11)
- X04 84b5b285 `work/plan.ts` (day-plan.test.ts 6)
- X05a bdcd042c `work/action-token.ts`, `work/briefing.ts` (briefing.test.ts 6); X05b 74abedd1 `work/briefing-send.ts`, `/api/cron/gap-briefing`, flag GAP_BRIEFING_ENABLED (briefing-send.test.ts 6, gap-briefing-cron.test.ts 4)
- X06 84691a40 `work/assignment.ts`, `/gap/start`, `/gap/item` (assignment.test.ts 5)
- X07a 753f23ca `replies/commands.ts`, the `mailbox.command` verdict (commands.test.ts 12); X07b ee25927a `replies/commands-apply.ts` wired into `/api/cron/gap-mailbox` (commands-apply.test.ts 7)
- X08 718ffefc `agents/tasks.ts`, `agents/handlers.ts`, `/api/cron/gap-agent-tasks`, flag GAP_AGENT_TASKS_ENABLED (agent-tasks.test.ts 4, gap-agent-tasks-cron.test.ts 3)
- X10 b2610288 `execution/copy-revision.ts`, the `loadActionPack` binding (copy-revision.test.ts 3)
- X09 0b379c2e `agents/revise-message.ts`, REVISE queues and the drain runs with `after()` (revise-message.test.ts 5)
- X11 1b430569 `agents/approve-request.ts`, APPROVE wired (approve-request.test.ts 4)
- X12 DONE 2026-10-08 on the scratch harness, provider boundary SIMULATED (the sink, the stub; the model call real): all twelve steps of section 17 with their receipts in `docs/gap/execution-engine-demo-latest.md`. The walk found and fixed, each its own commit: 7992ae81 (a provider answering no thread id), 626b4a17 (approving a story forgets the stale Work summary), bde214a3 (a ready card's decision read off the NEXT UP candidate), 2cb74376 (a refused APPROVE never consumes the command), d3de26ff (the revise prompt states the subject form). The real-Gmail variant ran on Casey's go the same day: a real draft (r5338182872211554541) in casey@freightroll.com and one real send (Gmail 1a11cc94d7fc0926) to his own plus-address, through every gate; the briefing and the assignments as real email to caseyglarkin2@gmail.com. Not exercised for real: the mailbox cron's inbox listing. Merged to main 133aeee7 (PR #413) on his go; GAP_ACTION_SECRET and the three cron flags set in Vercel; the production seller settings written (briefing 7 am New York to casey@freightroll.com; command senders his two addresses; mode review).
- X21b e71072d2 `work/plan.ts` (`PLAN_TX_OPTIONS`: the lock opens its transaction with maxWait 5 s and timeout 15 s; production timed out at 500 ms on three round trips to a database in another region) (day-plan.test.ts +1); merged to main d13802a9 (PR #419), READY 2026-10-08 20:57Z. THE FIRST PRODUCTION BRIEFING WENT OUT at 20:59Z, run once by hand with the cron secret on the fixed build: `{sent: true, day: 2026-10-08, to: casey@freightroll.com, gmailMessageId: 1a11d5029f293935, items: 18}`; the 21:05Z tick then reads already_sent. Attempts 1 and 2 (19:05Z, 20:05Z) had failed on the builds before X21.
- X14b merged to main 0626d811 (PR #418), production READY 2026-10-08 20:32Z; smoke: the artifact-used route 401 signed out, health as before.
- X14b `deals/artifacts.ts` (`ARTIFACT_SENT`, `ArtifactProof`), `/api/gap/deals/artifact-used` (`recipient`), `components/gap/deal-artifacts.tsx` (`recipientFor`: the addressee by name, else the deal's one person with an address; the proof line "Copied ...; GAP has not seen it sent" or "Sent ... (found in Sent)"), `deals/workspace.ts` (`artifactProofOf`, the deal's people per artifact entry), `execution/copies-reconcile.ts` (the third pass: a copy with a recipient found in Sent after the copy writes `deal.artifact_sent` with the Gmail id; without a recipient the copy stays a copy), `work/activity.ts` (the copy is content copied, the sent row a message sent, provider-proven) (x14b-artifact-proof.test.tsx 5, artifact-used-route.test.ts +1; two mutations RED). The backlog's sub-tickets are now all shipped except X19 (Casey's call).
- X15b + X15d merged to main cb6f47b4 (PR #417), production READY 2026-10-08 20:20Z; the X21 fix c5ae401d (PR #416) READY 20:07Z. The briefing's second attempt (20:05Z) ran on the build before the fix and failed the same way; the third and last tick for the day is 21:05Z on the fixed build.
- X15b `replies/hubspot-poller.ts` (`gapIdentities`, `PollOptions.gapIdentities`, `report.notToGap`) + `/api/cron/gap-hubspot-replies`: HubSpot logs every teammate's inbound email, and the poller landed any from a known person as a reply to GAP; now an engagement addressed to someone other than a GAP identity (the GAP mailbox, the briefing address, the command senders) is counted and never landed; a row with no recipient still lands; older callers without the identities are unchanged (hubspot-poller.test.ts +3, RED on the production code). Rows landed before this stay; X15a ranks the old ones as admin.
- X15d `components/gap/health-strip.tsx` (`placement`): the health line lives in System at the foot of Work; the head carries it only when outbound is BLOCKED or health could not be checked (the live page led with "Degraded: recommendations refreshed 3d ago" above the seller's day) (health.test.tsx +2, RED on the production code)
- X21 (a P1 found by X20a on production, 2026-10-08 19:05Z: the first briefing tick failed "Transaction already closed", the cron state read "never completed", no plan for the day) `work/plan.ts`: `planDay` ran the whole day builder (HubSpot reads, the cockpit read) INSIDE the advisory-lock transaction, which has a short timeout; the harness never saw it (scratch is fast). Now the day is built before the lock; the lock guards only the re-check and the one write, and a plan written meanwhile wins (day-plan.test.ts +1, RED on the production code). X17-X20 merged to main 146fb342 (PR #415), production READY 19:59Z (dpl_AkHc9jyjsvDKvfiF6s7kcJeF1Eif); smoke: health shows the two new components (and the briefing failure above), `/gap/activity` renders (112 research runs today, provider-proven), no stepped deal card today.
- X22 (Casey, 2026-10-09: "was the email sent? havent received the new one i dont think"): an explicit resend of the morning briefing. `GET /api/cron/gap-briefing/?resend=1` with the secret sends the briefing again now, past the hour window and past the day's already-sent row, with no day claim taken; the `briefing.sent` row says `resend: true`; the schedule itself never takes that path. Commit 65ceae9d, merged to main a195467f (PR #431), production READY `dpl_G9KX6ZmwES9f719vk8jsrCcay6r1` 2026-10-09 01:47Z (the C45 receipt binds the alias to it); the fresh briefing on the prospecting-first composition was resent to Casey after the deploy (thread 1a11e5845f5964a2; the acceptance reply START/REVISE/APPROVE is Casey's, never simulated).
- X20b `work/activity.ts` (the projection: thirteen activity kinds over the existing ledger, each with `basis: provider | self_reported`; a copy is content copied, a dial link is a call attempted, a manual send without its Gmail id is self-reported, delivered is never a kind; `accountability()`: what I intended against the plan's items, each done, set aside or open by the events that complete them, what was completed by kind and basis, what needs attention, what the agents are handling) + `/gap/activity` (`components/gap/activity-view.tsx`, `?day=` for an earlier day; Activity under More) (activity.test.ts 6, activity-view.test.tsx 2)
- X20a `health/health.ts` + `health/load.ts`: two health components, `briefing` (off says off; no address degraded; sent today with the time; unsent past a 90-minute grace after the seller's hour degraded; failed today degraded; before the hour "due") and `agents` (off says off; never run, stale past 30 minutes, a task waiting past 20 minutes or a task failed today degraded), each with an owner and a retry path; read from the cron-monitor states, the seller settings, the day's briefing rows and the task rows (health.test.tsx +3, health-route.test.ts pin 7). Closes the named debt below.
- X18 `work/plan.ts` (`markCarried`, `loadPreviousPlan`: an item carried when the newest earlier plan within the lookback held the same object, or the same kind at the same account; `carriedFrom` stored on the plan row) + `work/briefing.ts` (the item says "Carried from <day>"; the body counts "Carried over: n of N (one from <day>, ...)") (day-plan.test.ts +2, briefing.test.ts +1)
- X17 `work/list.ts` + `work/plan.ts`: an in-deal card with a HubSpot next step is deal work (tier deal, never held: before, it was parked and never reached the plan or the briefing); its action is the step ("Next step: ..."), its own move names it (`move`, the plan item's title), so NOW, the briefing and the assignment say the step (x15-ranking.test.ts +1, day-plan.test.ts +1)
- X13-X16 merged to main 6a9c3990 (PR #414) on the standing go, production READY 2026-10-08 19:31Z (dpl_L1Eh7PBBF78p5mjMebHAojEARWys); smoke: health as before (routing DEGRADED until the 10:30Z cron's first run), `/gap/settings` renders, the Scorecard on Work, the write routes 401 signed out.
- Production since 2026-10-08 18:33Z (main 133aeee7): GAP_ACTION_SECRET set, GAP_BRIEFING_ENABLED, GAP_AGENT_TASKS_ENABLED and GAP_ROUTING_CRON_ENABLED on, the seller settings written; the legacy `daily-digest` keeps running until Casey says stop. The first production briefing tick was 19:05Z the same day; its proof is Casey's inbox; since X20a the health route reports the briefing cron (sent today, with the time).
- X13 b57ed544 `/gap/settings` (`components/gap/seller-settings-form.tsx`), `work/scorecard.ts`, the Scorecard on Work (today's activity from the ledger against the targets; a set-aside counts nothing) (scorecard.test.tsx, seller-settings-form.test.tsx)
- X14a/c 1e5352ab `execution/copies-reconcile.ts` wired into `/api/cron/gap-mailbox`: a copied reply stays owed until Sent shows it went (REPLY_SENT with `reconciledFromSent`), a copied cold email is a touch only once Sent shows it (the manual-send recorder); `loadCopiedReplyIds` (copies-reconcile.test.ts 4). X14b (a copied recap) is open: the recipient is not recorded on the copy.
- X15a/c 328088fb `work/list.ts`: an untriaged reply older than REPLY_TRIAGE_DAYS (14) ranks admin, "An old reply to triage", still listed; an in-deal card leads with HubSpot's `hs_next_step` (`dealNextStep`), the hygiene line second (x15-ranking.test.ts 3). X15b (a non-prospect inbound) and X15d (the degraded banner) are open.
- 42115be5 two R60/R63-A source scans repointed at `work/load-day.ts` (where X01 moved the code; the scans read page.tsx). The bounded regression over the X13-X15 surfaces: 114 files, 1003 passed, these two the only failures.
- X16a/b 308df9e0 `execution/call-attempt.ts` (a CLEAR call release from `/api/gap/decisions/[id]/outbound-check` records `call.attempt_started`, self-reported, never a call), `work/commitments.ts` (`MAX_CALL_FOLLOW_UPS` = the routing hold of 3: a confirmed no-answer or voicemail makes "Call <who> again (attempt n of 3)" due in two business days, the next call outcome settles the previous call-again; a gatekeeper makes a task), `disposition/service.ts` (the commitment builder now runs for confirmed non-stopping classes too: before, the early return skipped them, so a no-answer never made its follow-up; it hands the builder the channel and the unanswered-call count) (x16-calls.test.ts 4, outbound-check-route.test.ts +2, disposition-service.test.ts +1)
- X16c 724f9984 `disposition/unanswered-calls.ts` (one reader for the count: the builder, the brief and routing agree), the brief's `timeline` (dial attempts and dispositions newest first, the unanswered calls and the calls left before the hold) on `/gap/call/[personaId]` (call-brief.test.ts +2, pre-call-brief.test.tsx +2)
- X16d 063c2599 `agents/answer_objection` (`agents/answer-objection.ts`): a confirmed objection (the existing_solution class, or a captured objection BID) queues the task behind GAP_AGENT_TASKS_ENABLED; the agent prepares one talking point from the objection, the buyer's words and the thesis's own facts, checked (cited facts only, no product name, no money, no em dash, yards plural; could_not_satisfy is final); the brief shows it under the objection from the task result (answer-objection.test.ts 4, disposition-service.test.ts +1, pre-call-brief.test.tsx +2)

#### Demonstration acceptance (section 17)

1 a plan from existing intelligence (X04 over X01); 2 the briefing to an internal mailbox (X05); 3 START (X06);
4 a specific evidence-backed action (the assignment); 5 REVISE by reply (X07); 6 the agent revises (X09); 7 the
revision returns (X09); 8 APPROVE (X11); 9 a real editable draft (X11 through the existing draft service);
10 a permitted test send confirmed (CONFIRM + SEND in the app to an allowlisted test recipient; the sink locally,
labelled simulated; the real-Gmail variant labelled real); 11 the ledger shows DRAFTED then DIRECT_SENT and the
Today panel counts it; 12 NEXT surfaces the next item. Nothing simulated is ever presented as a confirmed
provider event.

#### Remaining technical risks

The mailbox cron is the command transport (up to 10 minutes; a Gmail push subscription is the upgrade); a client
that rewrites the subject or drops References falls back to HELP; the agent revision is bounded by the evidence
gate (a critique that cannot be met with verified facts returns could_not_satisfy); every internal email counts
against the daily send cap (a loop would starve prospect sends: HELP is rate-limited and auto-submitted mail is
never answered); HubSpot sequence write scope unproven; the local box overheats under parallel heavy jobs (serial
validation only, the full suite at the release gate).

### GAP OS PROSPECTING FIRST (2026-10-08, in progress)

Casey's second and third mandates of the day, verbatim in `docs/gap/PROSPECTING_FIRST_MANDATE_2026-10-08.md`: the
first production briefing (18 items) was deal hygiene, not demand generation; then the course correction: STOP designing
freshness gates and research prerequisites; surface the intelligence GAP already holds, let Casey decide (pursue, explore,
save, skip, dismiss, more), and turn what he chooses into prepared outreach. The operating model is DISCOVER, SURFACE,
LET CASEY DECIDE, DEVELOP THE ANGLE, PREPARE OUTREACH, EXECUTE, RECORD, FOLLOW UP. Signal age is shown, never a gate.
Execution safety (opt-outs, suppression, authorization, CONFIRM + SEND) is unchanged.
<!-- verified:2026-10-08 -->

#### The October 8 briefing, measured (production, read-only)

The 18 items by kind (the plan row `work.day_planned` 2026-10-08): 9 "In a deal" cards whose only move was a stalled
close date, 1 follow-up at a deal account (held), 4 prospect follow-ups that were 2 (a reminder and a follow-up for the
same return at Southern Glazer's and at Swire, both from a May out-of-office), 1 ready first touch (PepsiCo, Tom
Kamantauskas, the only item with a prepared angle), 1 opted-out admin line, 2 "Someone replied" (Gusto, a vendor; The
Boston Beer Company, June). New-conversation work: 1 of 18. Carried over: none (the first plan).

Why, traced through `work/list.ts`, `work/plan.ts`, `work/briefing.ts` and upstream:

- Ranking: `TIER_RANK` put deal (3) above follow_up (4) and ready (5), so stalled-deal hygiene led by design; the
  briefing listed the plan's items in that order with no sections.
- Supply: the ready lane is routing's `enroll` decisions over ACTIVE theses with a fresh verified outreach fact. The
  whole system holds 31 theses at 8 accounts (16 unresolved, 8 active, 6 approved, 1 waiting review); PepsiCo's are
  "not ready: evidence expired". Routing last ran 2026-10-05 (the daily cron first fires 2026-10-09 10:30Z).
- Upstream of that: research ran 187 times in 7 days (170 insufficient_evidence, 17 evidence_found) and verified
  evidence that was already STALE against the freshness window (23 signal, 15 EDGAR, 3 web records, all stale);
  `research.proposal_prepared` rows: zero, ever (auto-prepare skips a fact that is not fresh). 67 of the 75 watched
  accounts have no thesis. Discovery captured 2,916 signals (2,748 under 45 days old; 253 rated outreach
  candidates, 2,323 account context, 226 research leads, 64 risk, 50 leadership) and queued 30 for research; the rest
  were never put in front of Casey (feedback: null on every one). 91 Pounce triggers are live, 67 at companies that
  are not GAP accounts (Tractor Supply, Costco, Daimler, Outpost). 229 people have written to the mailbox since May
  (596 threads; 21 are known personas at known accounts). The universe: 1,708 accounts, 1,939 people (1,455 with an
  address, 375 do-not-contact); GAP has emailed 1 of them.

So the briefing was starved, not mis-sorted: the funnel demanded a fresh verified fact before anything reached Casey,
and the intelligence GAP already held never got a decision from him. The course correction says exactly that.

#### Backlog (atomic, each a commit; focused tests; one reviewer; Casey owns time)

- **I01 the intelligence reader** `work/intel.ts`: the day's intelligence selection from what GAP holds, with no age
  gate: undecided signals (any age, one per event, Casey's shares first, then outreach candidates, leadership and risk
  by score, then research leads and context with themes), live Pounce triggers (matched to an account or not), and
  the people who wrote in and went quiet (previously contacted, no live opportunity). Each item carries its source,
  its published and observed dates, a truth label (historical observation, verified, unverified, contradicted),
  the account when known, and the decisions it takes.
- **I02 decide** one route and one page for Pursue, Explore, Save, Skip, Dismiss, More over signals, triggers and
  people, reusing the signal feedback fields and one append-only decision row for people and triggers; signed links
  from the briefing (`op: decide`) and buttons on Work; a skip hides for 30 days, a dismiss for good, both reversible
  on the Signals page.
- **I03 develop the angle** an agent task `develop_angle` queued by Pursue: why this could matter to YardFlow, the
  accounts and buyer roles it points at (named people at a known account), two conversation starters, the dated
  source line; checked (cited only, no product claims, no money, no em dash, yards plural); the result shown on the
  item and the account. Pursue also queues the existing evidence research when the item has a source and an account,
  and auto-prepare no longer skips a fact for its age (the date rides in the observation).
- **I04 composition** the briefing and Work: Intelligence worth a look, Prospects to reengage, Ready to send,
  Follow-ups owed, Deals in one compact line; `TIER_RANK` puts new conversations and prospect follow-ups above
  stalled-deal hygiene; a reminder and a follow-up for the same return are one item.
- **I05** the ledger, `CLAUDE.md`, one independent review, the demonstration (three examples on production: an older
  signal, an insight with no account, a quiet prospect; Pursue on each), the START/REVISE/APPROVE verification with
  Casey's reply.

#### Receipts
<!-- verified:2026-10-08 -->

- I01 f5d7ff86 `work/intel.ts` (`loadIntelligence`, `rankSignals`, `rankTriggers`, `rankPeople`, `loadDecided`; no age gate; the truth labels; `prospect.decision` is the decision row kind) + the ledger fixture's signal, trigger and thread tables (intel.test.ts 6; mutation: an age gate turns the older-signal case RED)
- I02 5e2a2534 `work/decide.ts` (`applyDecision`: a signal's decision on its own feedback, `skip` added to the signal feedback; a trigger or a person gets one `prospect.decision` row; Pursue and More queue `develop_angle` and the existing research when there is a link and an account; a pursued trigger is captured as a signal first), `POST /api/gap/decide`, `/gap/decide` (the signed-link page, op `decide` on the action token) (decide.test.ts 5, decide-route.test.ts 1; mutation: Pursue spending nothing turns three cases RED)
- I03 5b73962a `agents/develop-angle.ts` (`developAngle`: why it could matter, accounts and roles, people from the roster only, two starters, the proposed action, the caveat, the dated source line; `loadAngles`) registered in `agents/handlers.ts` (develop-angle.test.ts 4; mutation: naming anyone outside the roster turns two cases RED). I03b 7251bb49 `research/auto-prepare.ts`: a fact past its freshness window is prepared too, marked historical (the auto-prepare pin changed from `not_fresh` to `prepared`).
- I04 c19c0bc6 `work/briefing.ts` (the intelligence sections with signed decision links, the item sections, the stalled deals in one line; an older caller without `intel` renders as before), `work/briefing-send.ts` (`defaultIntel`, the `decide` link signer), `work/list.ts` (`TIER_RANK`: follow_up 3, ready 4, deal 5; a reminder and a follow-up for the same return are one obligation), `/gap` + `components/gap/intel-panel.tsx` (the panel with the decision buttons above Today) (briefing.test.ts +2, x15-ranking.test.ts +2, intel-panel.test.tsx 2; mutation: the deals-first order turns the ranking case RED)
- **Independent review (a fresh read-only subagent, 2026-10-08) and its dispositions.** Seven defects, eight smaller. Fixed in I05 (below): (2) a pursued item vanished and its angle was shown nowhere: `loadPursued` reads the angle tasks and the briefing and Work carry a Pursued section (in progress, ready with the angle, failed with the error); (3) the R41 ordering test was RED and a due deal commitment had been demoted below a cold first touch: `TIER_RANK` is back to its order and only a hygiene-only deal card (no due obligation, no next step) ranks after the first touches (`DEAL_HYGIENE_RANK`); (4) Pounce triggers never reached the email: the briefing reserves slots (four signals, two triggers); (5) the newest-600 signal window was a recency gate: three bounded pulls by class (shares, strongest by score, rest newest) and the total is a count; (6) the email claimed "no open deal" without reading the deal state, and a person at a deal account was dropped: the loader takes the deal state as known or unknown and says it, and an in-deal person is shown and labelled, never dropped; (7) the decide page built its own account slug: `accountHref`; (13) Explore now records the look and opens the source; (14) research first, then one mark; (11) the "- " rides in the HTML text too. Accepted as fine or named debt: (8) no path from a decision contacts anyone or writes HubSpot; (9) a replayed decision link re-queues one angle task at most (same pattern as start and open); (10) the inbound read is newest-first 2,000 (a groupBy later); (12) the event collapse and the relevance rank parallel `signals/ops.ts` (one `HISTORICAL_DAYS` now); (15) the hygiene regex on the title.
- **REVERTED, and the one open product decision for Casey (finding 1):** I03b (auto-prepare keeping a stale fact) is reverted (d049c3f2). A thesis drafted from a fact past its freshness window is parked by three downstream gates that all read the one freshness authority (`research/currentness.ts isCurrentFact`: `hypothesis/actionability.ts` evidence_expired, routing rule R12 hyp_stale, `enroll/service.ts checkEvidenceFreshness`), so preparing it only made review work that could not ship. The course correction says to remove freshness from recommendation eligibility; doing that honestly is one change at that authority (a dated fact stays usable, labelled historical) plus the compiler stating the fact's date in the copy, so a June event is never written as today. That is I06, and it is Casey's call: a thesis on an old fact becomes sendable once the copy says the date. Until then, Pursue delivers the prepared angle and the account page's existing paths (draft a thesis, research, email) are the way on.
- Merged to main f374ec3f (PR #420), production READY 2026-10-08 23:00Z (dpl_7cJJkwhVNujPbsK3LcEk2bRtGX1J). The three examples on production Work, read from the DOM: 24 intelligence items of 3,019 undecided (Casey's shares first: the PepsiCo and Gatik facts, a 2018 Hormel expansion and a 2013 General Mills DC labelled historical observations, never dropped), the triggers at companies that are not accounts (Tractor Supply, Costco, Daimler, CAG, UNFI, Loblaw and Eaigle) labelled "no account yet", and eight people who wrote in and went quiet. Pursue applied to one of each through Casey's session at 23:07Z: `signal:cmul61cvx0000l004sd6fb09s` (Hormel, 2018: research queued, marked, angle task at_4f0965bf12a631cc), `trigger:94` (Tractor Supply: captured as a signal, marked, angle task at_4743119b3a5c9230), `person:dave.kiesling@kencogroup.com` (angle task at_8668989ea934aeb8). The decide route 401 and the decide page 307 signed out.
- The first three angle tasks on production FAILED on every attempt (23:05Z, 23:10Z, 23:15Z): no model path worked there. The AI Gateway key is free tier (403 on its configured model), and the Gemini 404 for the retired `gemini-2.5-flash-lite` was classified a timeout by its wording ("Error fetching ..."), which abandons the whole Gemini list instead of trying the next model. The Pursued section said so truthfully ("GAP could not develop the angle ... Decide it again to retry"). Fixed 8172d479 (PR #421, live 23:22Z) `src/lib/ai/client.ts` (model-missing judged before timeout, the retired wordings named; ai-client.test.ts +1) and `agents/tasks.ts` (a task error keeps 1,500 characters). Re-pursued at 23:23Z on the fixed build (tasks at_991c72549251a553, at_3cc467d799932ab8, at_010dde6bd6dc4ac9): the chain is now fully visible in the ledger and it is a billing fact, not a code fact. Every Gemini model GAP names (2.5-flash-lite, 2.5-flash, 2.0-flash-lite, 2.0-flash) answers 404 no longer available for the production key, the AI Gateway key is free tier (403), and OpenAI answers 429 (quota exhausted). PRODUCTION HAS NO FUNDED MODEL PATH: every agent task (revise, objection, angle) fails there until Casey funds one (paid AI Gateway credits for the configured model, an OpenAI quota, or a current Gemini model on a key that reaches it). The Pursued section says so on each item after the third attempt. The angle flow itself is proven on the harness with a real model (develop-angle.test.ts and the X12 real variant).
- I05 522d9814 `work/list.ts` (`DEAL_HYGIENE_RANK`), `work/intel.ts` (`loadPursued`, `PursuedItem`, the pulls by class, `HISTORICAL_DAYS`, `inDeal`), `work/decide.ts`, `agents/develop-angle.ts`, `work/briefing.ts` (Pursued, the slots, the people header), `work/briefing-send.ts` (`links.account`), `components/gap/intel-panel.tsx` (Pursued with "Open <account>" and "Done with it"; Explore posts) (decide.test.ts +1, intel.test.ts +1, briefing.test.ts +1, x15-ranking.test.ts rewritten for the hygiene rule, intel-panel.test.tsx +1; work-rank.test.ts green again; mutation: dropping the pursued list turns the vanish case RED)
### GAP OS AI RECOVERY, COST CONTROL AND SELLER ACCEPTANCE (2026-10-08, in progress)
<!-- verified:2026-10-08 -->

STATUS: ACTIVE. Casey's fourth mandate of the day ("Final AI Recovery, Cost Control and Seller Acceptance") and its
clarification ("Preserve I06 and Complete the Original Execution Roadmap"), both verbatim in
`docs/gap/AI_RECOVERY_MANDATE_2026-10-08.md`. The funded-model recovery is an operational blocker, not a replacement
for the roadmap: the execution order is (1) the funded route and bounded costs, (2) recover and demonstrate the
failed Pursue actions, (3) I06 across the downstream eligibility authorities, (4) the email-driven seller workflow,
(5) the remaining execution-state, outreach, call and follow-up gaps, (6) a focused seller acceptance review. The
completion matrix at the end of this section is the roadmap's one ledger from here on.

#### Credential inventory (2026-10-08, names and states only; no value was displayed, logged or written anywhere)

Every candidate was probed with one minimal read-only request (a model listing, the gateway's credits read) and, where
that passed, one minimal generation ("Reply with the single word OK", 5 to 20 output tokens), reading each value at
run time from the Vercel API (production values of type `encrypted` decrypt through the API; `sensitive` ones cannot be
read at all) or the Railway CLI and discarding it. "Funded" below means a generation succeeded, never that a key exists.

| Where | Provider | Variable | Available | Funded | Intended model | For GAP |
|---|---|---|---|---|---|---|
| Vercel modex-gtm, production and preview | Vercel AI Gateway | `AI_GATEWAY_API_KEY`, `AI_GATEWAY_MODEL` (= `openai/gpt-5.4`) | yes: credits read answers (balance $4.12, $1.28 used; the free tier's monthly credit, auto top-up off) | FREE TIER: `openai/gpt-5.4` and `anthropic/claude-haiku-5.5` answer 403 "Free tier users do not have access to this model"; `google/gemini-2.5-flash-lite` and `google/gemini-2.5-flash` generate, with the cost in the usage block | gemini-2.5-flash-lite ($0.10 / $0.40 per million tokens; one angle-sized call, 1,285 in and 180 out, cost $0.0002) | YES: the same project, already in the GAP runtime, no copy, no cross-project reuse. THE ROUTE. |
| Vercel modex-gtm, production | Google Gemini (direct) | `GEMINI_API_KEY` (sensitive) | the production tasks' own errors: every 2.x model "no longer available to new users", the message names `gemini-3.5-flash-lite` | unknown: a Google free-tier key reports no billing by API; the project's billing state is in Google AI Studio (Casey) | gemini-3.5-flash-lite (the fallback after the gateway) | fallback only; its cost is estimated, not reported |
| Vercel modex-gtm, preview; local `.env.local` (modex, flow-state-site, war-room: three different keys) | Google Gemini (direct) | `GEMINI_API_KEY` | yes: 31 models listed; `gemini-2.5-flash-lite` generates ("OK", 8 tokens) | unknown (same caveat) | 2.5-flash-lite | NOT used: a preview or local key is not a production credential, and the production key is a different one |
| Vercel modex-gtm, production (the same key on nextjs-boilerplate and Railway) | OpenAI | `OPENAI_API_KEY` | auth ok, 78 models listed | NO: `gpt-5-nano` answers 429 `insufficient_quota` "You have no credits remaining" | none | the last fallback, dead until OpenAI is funded (Casey) |
| Railway dazzling-spirit, clawd-control-plane | Google Gemini, OpenAI, xAI | `GEMINI_API_KEY` (a fourth key: 2.5 retired), `GEMINI_API_KEY_2` (= the modex local/preview key), `GEMINI_MODEL` (= gemini-2.0-flash, retired), `OPENAI_API_KEY` (= modex production), `OPENAI_MODEL`, `XAI_API_KEY` | xAI: 400 "Incorrect API key" | no | none | NOT reused; clawd's own model path is also broken (a retired default model and the same exhausted OpenAI key): named debt for clawd-ops, not GAP |
| Vercel flow-state-klbt (yardflow.ai), yardflow-war-room, mysavant | Google Gemini | `GEMINI_API_KEY` (one sensitive, two encrypted) | listed only | not probed for generation | none | NOT reused: another website's credential is not GAP's (mandate section 1) |

Cross-project reuse that would need Casey's permission: none is needed. The route is the modex-gtm production
gateway key itself. What only Casey can do: top up or set auto top-up on AI Gateway credits (team billing), set a
gateway budget (AI Gateway, Budgets: the hard provider-side cap), fund OpenAI, or confirm the Google project's billing.

#### Receipts (each ticket one commit on `feat/gap-execution-engine`; RED then GREEN then one mutation per invariant; focused vitest, tsc, eslint on the touched files)
<!-- verified:2026-10-08 -->

- A01 9215c345 `src/lib/ai/client.ts` (`GenerateOptions.model`, the answer's `model` and `usage` with the gateway's cost, `AIAllProvidersFailed` with every provider's reason, `billing` judged before the rate-limit wording and never retried, `authentication`, `service`; `GEMINI_MODELS` = 2.5-flash-lite then 3.5-flash-lite, the retired 2.0 models gone), `src/lib/gap/ai/spend.ts` (`gapGenerate`: the routine model `google/gemini-2.5-flash-lite` and the strong `google/gemini-2.5-flash` for a More, overridable by `GAP_AI_MODEL` / `GAP_AI_MODEL_STRONG`; `ai.model_call_reserved` before the call at the worst-case estimate, `ai.model_call` after with task, model, tokens, cost, `estimated`, outcome; the ceiling `GAP_AI_MONTHLY_CEILING_USD` default $25 and the per-task budget `GAP_AI_TASK_BUDGET_USD` default $0.10 refused before the call; the prompt bounded to 24,000 characters and the output to 1,024 tokens; `loadSpend`), `agents/errors.ts` (`PermanentAgentError`), `agents/tasks.ts` (a permanent error is final on its attempt), the three handlers call `gapGenerate` (ai-spend.test.ts 9, ai-client.test.ts +2; mutations: the ceiling check removed, a permanent error no longer final, billing judged after quota: each turns its case RED).
- A02 d153cece `work/decide.ts` (a Pursue without a note on a prepared item keeps the angle, `angle_kept`; a running task is never doubled), `health/health.ts` + `health/load.ts` (the `model` component: healthy with the month's figure, degraded past 80% or after a refusal, blocked at the ceiling or when the last call failed for a permanent reason; owner Casey) (decide.test.ts +1, health.test.tsx +1; mutations: the kept angle and the block each turn RED).
- Pre-deploy verification of the production configuration (2026-10-08, from this machine with the production gateway key read at run time): `google/gemini-2.5-flash-lite` through `https://ai-gateway.vercel.sh/v1/chat/completions` answered "OK" (7 in, 1 out, cost $0.0000011 reported in `usage.cost`); the angle-sized request answered 180 tokens of prose at $0.0002005; the credits read showed the balance move from 4.1155820 to 4.1155382. No production environment variable needs to change for GAP: the route is the key already there and the model is the code's default (`AI_GATEWAY_MODEL` stays `openai/gpt-5.4` for the non-GAP features, which still answer 403 on the free tier; changing it is a separate decision).
- A03 c4d6f821 (PR #423) one bounded re-ask on a voice-rule break; A03b 158ebbe3 (PR #424) the validators use the canonical `SINGULAR_YARD_RE` (compounds keep the singular), refuse "throughput", parse "id 1"; A03c 04367863 (PR #425) the re-ask quotes the offending place, at most twice (three calls per task); A03d 86b84890 a singular "yard" that survives the re-asks is a WARNING on the angle (shown in amber on Work), never a refusal, as the compiler's C14 treats it (develop-angle.test.ts +1 each step, answer-objection.test.ts; mutations: the re-ask removed, the compound refused again, two calls again: each RED).
- I06a 9b3daf19 `research/currentness.ts` (`factUsability`, `isUsableFact`, `usabilityLine`: unusable only for ended, closed, undated, superseded; the historical label says the date) (i06-usability.test.ts 3). I06b 2eaa4fb5 the hypothesis machine, the snapshot loader (`usable`), the builder (no calendar expiry: `expiresAtFor` is null), actionability, use-evidence, corroboration, draft-from-fact (PR #423). I06c 2a13dff3 routing (`evidenceUsable`; R12 fires only on unusable evidence), the explanation, the card wording, the account story, the brief, the NOW view, the outreach anchor (a historical story is draftable with its line; the not-offered list is for unusable facts), the research inbox (historical, not days left; a current duplicate wins), the conflict reader, the seller wording (PR #424). I06d 6fbed554 enrollment, `hypothesisSendable`, the seller draft, the six-line brief, the compiler ref (`usable`, `observedAt`) (PR #425). I06e 5b5a5f5c `citedQuote` writes "(reported May 2018)" into the source label for a historical fact on every observation path; C01 refuses an unusable ref outright and a historical ref unless the body states its month and year (PR #425). I06f 09b073f2 the full path pinned (i06f-historical-path.test.ts 6): a verified 2018 site expansion at Hormel Foods passes the draft gate, is written with its date, is READY, approves and activates, is not held by routing, compiles under C01 only with "May 2018" in the copy, reads usable at the send gate and enrollment; the same fact a newer source says ended is refused at every gate by name; the evidence gate accepts the fact's own reported-date label as its word. Every test that pinned age as a refusal was updated deliberately and says I06 in its title. The one chronological reader left on purpose: the explicit `expire` action and the `expireDue` sweep still honour a row's `expires_at` written before I06 (no caller schedules the sweep; new activations write null).
- **The production demonstration (2026-10-09, through Casey's session and the cron secret, every run on the ledger).** After PR #422 (model route): three angle tasks ran on `google/gemini-2.5-flash-lite` and all failed `could_not_satisfy: yard_singular` (the model wrote "yard" alone). After PR #423 (one re-ask): all three failed again. After PR #424 (the canonical compound rule): `person:dave.kiesling@kencogroup.com` SUCCEEDED (task at_9d9395270f174172, 00:32Z): why it could matter (an undated note from Dave suggests Kenco Group might have previously expressed interest in optimizing their yards; manual gate check-in, radio dispatching and tribal knowledge affecting dwell and dock friction), roles (Director of Operations, VP of Supply Chain, Logistics Manager), two starters (gate check-in and driver communication during busy periods; standardizing the processes in their yards across facilities), proposed an email, the caveat that the note is undated. The Hormel 2018 signal and the Tractor Supply trigger failed on "yard operations" and "current yard operations" (A03c on the A03c build: after 2 re-asks), which A03d now carries as a warning. Health at 00:32Z: Model spend $0.0027 of $25.00 for October, 15 calls, 0 failed, 0 refused. Re-pursue both on the A03d build to finish the three (below).
- **All three examples prepared on production (2026-10-09 00:55Z, main a76f3440 = PR #426, `dpl_4ZvJYBXFSPUJztoHT5723LcFUiXt` READY 00:54:30Z).** Re-pursued on the A03d build and drained by one cron run (2 claimed, 2 succeeded): `signal:cmul61cvx0000l004sd6fb09s` (Hormel, at_5b274554e3e51c22): the 2018 observation said as 2018, why it could matter (more trucks through the plants and distribution centers; manual gate check-in, radio dispatching, tribal knowledge; dwell and hidden lost production capacity), one roster person (Nicholas Schwartz, supply chain planning COE and strategy lead), two starters ("How have your yards evolved since the 2018 expansion plans were announced?"), proposed an email, source powderbulksolids.com published Sep 26, 2018 (a historical observation); `trigger:94` (Tractor Supply, at_d65478b19f9426e5): the October 7, 2026 report, roles, two starters, proposed research first with the caveat (verify the Idaho DC is operational), and the A03d voice warning in amber ("yard routing" in the singular; the canon says yards). With the Kenco angle from 00:32Z that is three of three, none contacted anyone. Health at 00:55Z: Model spend $0.0056 of $25.00 for October, 30 calls, 0 failed, 0 refused.
- **Production flags, read 2026-10-09 00:48Z (plain values):** GAP_OS_ENABLED, GAP_HYPOTHESIS_ENABLED, GAP_ROUTING_ENABLED, GAP_ROUTING_CRON_ENABLED, GAP_MESSAGE_COMPILER_ENABLED, GAP_REPLY_CLASSIFICATION_ENABLED, GAP_BACKGROUND_RESEARCH_ENABLED, GAP_BRIEFING_ENABLED, GAP_AGENT_TASKS_ENABLED = true; GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED, GAP_AUTO_ENROLL_ENABLED, GAP_AUTO_ENROLL_SHADOW, GAP_HUBSPOT_MIRROR_ENABLED = false; GAP_CRM_LOG_METHOD = connected_inbox. HubSpot sequence publishing and enrollment are code-complete (sequence/*, enroll/*) and OPERATIONALLY OFF; the private app's sequences scope has not been verified against the portal; turning either on is Casey's decision after that check.
- **The email interface in production:** the briefing goes out (20:59Z on 2026-10-08, the hourly cron with `already_sent` after), the mailbox cron applies commands every 10 minutes (health: "apply: 2 inbox messages" at 00:00Z), START, REVISE and APPROVE are wired through `replies/commands.ts` + `commands-apply.ts` with the signed token and the sender allowlist, and the model route they call now works. The production proof of the loop (Casey's own reply START, the first assignment, REVISE, the revised recommendation, APPROVE, the Gmail draft, a safe internal send) needs a reply from Casey's own address: it is not simulated from his mailbox by an agent. BLOCKED on Casey's reply; the harness variant (X12) remains the only proof.
- **Model billing facts a reader needs:** the gateway free tier's monthly credit is what funds the route (balance $4.12 at the start, auto top-up off; the free tier blocks gpt-5.4 and Haiku and rate-limits per model); a provider-side hard cap (AI Gateway, Budgets) is not set; OpenAI is out of credits; the production Gemini key's project has lost every 2.x model. Nothing was purchased or raised.

- **Independent review (a fresh read-only subagent over 363e3b3e..4cf81510, 2026-10-09) and its dispositions.** Seven findings, ranked by the reviewer; every one opened at its file and line before a decision. FIXED: (1) HIGH, routing's `evidenceThin` (R12b, and R11's approve card) still filtered facts by `isCurrentFact`, so the Hormel thesis would have been held as research for its age: I06g reads usability (routing-inputs.test.ts now pins a past-expiry fact as not thin and an ended one as thin). (2) HIGH, the inner `sequence/enrollment.ts` enroll still filtered by age behind the service's own usability pre-check: I06g (sequence-enrollment.test.ts). (3) MEDIUM, GAP model calls outside the ledger: the Ask route and the reply-suggest route called the bare client (its 403 default, then the retired, exhausted and control-plane fallbacks, unrecorded): A04 routes both through `gapGenerate` (metered, budgeted, the working model). The discovery cron's grounded providers (`entity/providers.ts`: a Gemini scout, `openaiWeb` on gpt-5-mini, `gatewayWeb` on `openai/gpt-5.4-nano` with the gateway's search tool), `research/providers.ts webCandidates` and `entity/scout.ts` still call the providers directly, on the same gateway credit: NAMED DEBT A06 (meter them through one ledger entry per run), and the watch is in place now: health reads the gateway's own credit balance (every path on the route draws on it) and blocks when it is spent. (4) MEDIUM, the ledger failed open (an unreadable table read as $0, a lost reservation still called): A04 fails closed for a call (a permanent configuration refusal: the item and the decision stay, the task row says what to check) while health stays soft; a month at the 5,000-row read cap refuses too (ai-spend.test.ts +1; mutation: fail-open restored turns it RED). (6) LOW, the clawd control plane as a fallback for a GAP prompt: A04 `skipControlPlane` on every GAP call (ai-client.test.ts +1); the pre-call estimate prices the tier model while a Gemini fallback can answer on gemini-3.5-flash-lite (about 6x the estimate, still far under the $0.10 budget at the 24,000-character cap; the recorded row uses the answering model): accepted, stated here. (7) LOW, an observation written while its fact was current carries no date, so the day the window lapsed C01 refused every compile until an edit: I06g's renderer adds "(reported May 2018)" for a cited fact that is historical at render time (the action pack and the enroll service pass the cited facts); the NOW line's "usable until" became "current until, then cited with its date". ACCEPTED: (5) LOW, two drainers (the cron and the mailbox's `after()` kick) can each see the same headroom and overrun the ceiling by one task estimate (under $0.01). Cosmetic: the A03 test title still says "exactly two calls" (the assertion says three).
- **Corrections to the claims above after the review:** "I06 DONE" holds from I06g (the reviewer proved R12b and the inner enroll were still age gates; the i06f harness built the routing inputs by hand and never ran the assembler, which is why it missed R12b); "Cost observability DONE" holds for the agent tasks, Ask and reply-suggest; the discovery and research providers are the named debt A06 with the gateway credit balance on health as the provider-side watch.

- Production at 4976f1e5 (PR #427, `dpl_A3wfy29ckQtKmnhym4TLSaQkkaMB` READY 2026-10-09T01:09:38Z): health reads "Model spend $0.0056 of $25.00 for October · gateway credits $4.11" ($1.29 used, every path on the route); the program's code is all in production.

- **Casey, 2026-10-09 01:20Z: "are blocks really blockers? set the budget, do everything that is hanging; the token allows read and write for sequences."** Done in this order, each verified: (1) an AI Gateway TEAM budget of $25 a month with alerts at 50, 75 and 100 percent, set through the Vercel API (`PUT /ai-gateway/budgets`, scope team, read back: limit 25, monthly, active); a $25.00 request now answers 402 `quota_for_entity_exceeded` at the provider, the first hard cap outside this code. (2) HubSpot sequences: the production token lists the portal's sequences (96, `GET /automation/v4/sequences`), so the read scope is proven and the write (`POST /automation/v4/sequences/enrollments`, the adapter's one call) is the same scope family; `GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED` is now `true` in the production environment (active from the deployment that carries this entry); GAP_AUTO_ENROLL stays off: an enrollment is the seller's own CONFIRM in the app, never automatic. Nothing was enrolled. (3) X19 the legacy daily digest is retired (the cron entry and the route are gone; the briefing no longer announces it). (4) A06 the grounded discovery and research providers are metered (a $0.02 conservative reservation per provider attempt, recorded with the outcome; the ceiling stops the chain), so every GAP model path counts against the one ceiling and health. (5) The acceptance test is ready for Casey's reply: the seller settings carry both of his addresses as command senders, the October 8 briefing is in his inbox (Gmail thread 1a11d5029f293935, 18 items) and its links are valid for seven days from 20:59Z; a reply of START to it from either address is picked up by the mailbox cron within ten minutes, the first assignment comes back by email, then REVISE and APPROVE in the same thread. Still Casey's own (judgment or money, not configuration): the PepsiCo thesis approval, the 5% wording, transcription spend.
- A06 (this entry) `gap/ai/spend.ts` (`groundedMeter`, `GROUNDED_ESTIMATE_USD`), `entity/providers.ts` (`askGrounded` takes the meter; a ceiling refusal stops the chain with the reason on the attempt), the signal-discovery cron, the entity scout and the evidence research pass it (ai-spend.test.ts +1; mutation: the grounded ceiling check removed turns it RED). X19 `vercel.json`, `cron-monitor.ts`, the route deleted, `gap-briefing/route.ts` (schema-sprint2.test.ts updated).

#### The completion matrix (the roadmap's one ledger from here; keep it current)
<!-- verified:2026-10-09 -->

| Capability | Status | Where | Remaining gap | Evidence | Next action |
|---|---|---|---|---|---|
| Intelligence discovery and visibility | DONE (production) | I01, I04, I05: `work/intel.ts`, `intel-panel.tsx`, the briefing | a person who wrote in with no matching persona shows "No account yet" (Dave Kiesling at Kenco) | the production DOM 2026-10-08 23:07Z (24 items, no age gate) | debt: resolve the person's account by domain before the angle |
| Prospecting and reengagement | DONE (production) | I01 `rankPeople`, the briefing's "Prospects to reengage" | the same person gap | same | same debt |
| Seller selection and pursuit | DONE (production) | I02 `/api/gap/decide`, `/gap/decide`, A02 (no regeneration, no doubled task) | none | three Pursues applied after every deploy | none |
| Angle development | DONE (production, 1 of 3 shown; the other two now warn instead of refusing) | I03, A01 to A03d | the model's "yard operations" habit is a warning Casey edits | at_9d9395270f174172 (Kenco) | re-pursue Hormel and Tractor Supply on the A03d build |
| Contact identification | DONE | WHO truth (#397), owner resolution (#396), the roster in the angle (never anyone outside it) | none | develop-angle.test.ts | none |
| Gmail drafts | DONE (production code; unverified by Casey) | X11 APPROVE, `createSellerGmailDraft`, UX-06 send gate | production APPROVE by email not yet exercised by Casey | X12 harness + the real-Gmail variant | Casey's reply |
| Approved sending | DONE, gated (CONFIRM + SEND in the app) | the R-series send gate; `GAP_CRM_LOG_METHOD=connected_inbox` | no production send since the first (GAP has emailed 1 person) | the ledger | Casey |
| HubSpot sequences and enrollment | DONE, ON for seller-confirmed enrollment (auto-enroll off) | `sequence/*`, `enroll/*`, `execution/hubspot-sequence-adapter.ts`; `GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED=true` since 2026-10-09 | a GAP sequence version must carry a HubSpot sequence id before an enrollment can land (96 sequences exist in the portal); no enrollment has run yet | the sequences read 2026-10-09 (HTTP 200, 96); the flag read | the first seller-confirmed enrollment, watched |
| Calls and call outcomes | DONE | X16a to X16d | none | x16-calls.test.ts | none |
| Activity recording | DONE | X20b `work/activity.ts`, `/gap/activity` | none | activity.test.ts | none |
| Feedback-driven agent revisions | DONE (the route now works) | X09 `revise_message`, A01 to A03d | production REVISE not yet exercised by Casey | revise-message.test.ts, the harness | Casey's reply |
| Daily briefing and work queue | DONE (production) | X04, X05, X21, I04, I05 | none | sent 2026-10-08 20:59Z | none |
| Active-deal awareness | DONE | X15c, X17, the in-deal labels (I05) | none | tests | none |
| Durable follow-ups and commitments | DONE | `work/commitments.ts`, X16b, X18 | none | tests | none |
| Cost observability | DONE (production) | A01 spend ledger, A02 + A04 health with the gateway credit balance, A06 the grounded providers metered, the $25 monthly AI Gateway team budget (the provider-side hard cap) | none | health 00:55Z: $0.0056, 30 calls; the budget read back | none |
| Recovery and reliability | DONE | A01 permanent vs transient, A02 kept angle, X21 | none | tests + the production runs | none |

#### Backlog classification (every ticket, none dropped or renumbered)
<!-- verified:2026-10-09 -->

- R00 to R65: DONE (the HANDOFF block above). UX-01 to UX-17: DONE (`docs/gap/ACCOUNT_FIRST_UX.md`).
- X01 to X21: DONE (X19 retired the legacy digest on Casey's word, 2026-10-09).
- I01 to I05: DONE. **I06: DONE (I06a to I06g; the review closed the last two age gates).**
- A01 to A06: DONE. **The seller acceptance test (section 7 of the mandate): ready for Casey's reply** (START to the October 8 briefing, then REVISE and APPROVE in the thread).
- Owner items still with Casey (judgment or money): the PepsiCo thesis approval, the 5% wording, transcription spend, the GitHub Actions runner (not asked for), the acceptance-test reply.
- Named debt from this program: the person item's account by domain (above); the non-GAP AI features still answer 403 on `openai/gpt-5.4` (changing `AI_GATEWAY_MODEL` is a separate decision); clawd-control-plane's own model path (a retired default model and the same exhausted OpenAI key).


## GAP OS COMMERCIAL CONTEXT AND EXECUTION AUDIT — October 8, 2026 New York

This is the current corrective audit addendum, based on main `a195467f6c723b8859a8d6ce7165d3a86ae02394` (PR #431). It supplements the historical R/UX/X/I/A receipts; it does not reset completed implementation or authorize production actions. Some earlier receipts use October 9 UTC for the same October 8 New York evening.

**Decision:** repair the joins and evidence flow across the existing identity, opportunity, story, context, mailbox, compiler and task ledger. Do not rebuild GAP, add another CRM, replace the task framework or switch models as a substitute for missing context. The model generating `develop_angle` does not receive the commercial conversation. Passing style validation cannot repair omitted buyer facts.

**Owner constraints:** Casey owns time management. No delivery dates, sprint durations, staffing estimates or activity quotas are assigned here. Buyer commitments and observed event dates remain part of commercial truth. Intelligence of any age remains visible for Casey to judge; factual attribution, supersession and execution safety remain intact. This audit performs no external sends, CRM changes, enrollments, production flag changes, model purchases or deployment mutations.

**Actual runtime:** HubSpot reads work; Kenco company 55608495412 has open deal 62704698979 and associated contacts Craig 234991610011 and Dave 217664765537. Gmail contains the dated roadmap and existing drafts. Local Brain contains deeper context but conflicting older content. Production Clawd serves an October8 rebuilt snapshot whose wedge notes are July/August. Vercel preparation flags are on, sequence publishing is on, automatic enrollment and CRM mirror are off; Clawd outreach/actuator are false. Enabled publishing is not permission or proof of live enrollment. The production alias was inspected as deployment dpl_G9KX6ZmwES9f719vk8jsrCcay6r1, READY, with SHA a195467f6c723b8859a8d6ce7165d3a86ae02394. Full runtime source coverage remains unverified.

**Proof vocabulary:** REPRODUCED means an actual source function exhibited the defect under a controlled fixture. SOURCE means static path evidence. LIVE READ means provider returned the stated record now, not that every portal record was audited. ACCEPTANCE SPECIFIED means a future test, not a passing result. No new corrective ticket is marked implemented by this audit. The exhaustive backlog below covers the requested audit surfaces and observed failure classes; uninspected data is explicitly not certified.

**Architecture contract:** source adapters -> identity/association resolution -> attributed commercial-context packet -> purpose/motion classification -> specific action proposal -> existing compiler/approval -> selected execution lane -> provider/self-reported receipt -> commitments, brief and learning. Each source envelope carries identity, event date, observation/index date, provenance, visibility, authority, completeness and version. Internal planning may use private context; externally usable facts remain separately validated. Retrieval never grants instructions from emails, notes or documents permission to call tools.

**Ticket discipline:** each ID is one committable behavior or bounded validation task. Acceptance includes both positive and negative cases below. Dependencies are technical, not a schedule. Use focused tests serially with one worker, never the full local suite per ticket. Add one meaningful mutation or fault injection for each central invariant. Preserve stable negative controls: historical intelligence remains visible, opt-out remains blocked, ambiguous identity remains unresolved, copied remains unsent, unknown remains unknown. Render each slice in the actual app/email consumer using fixtures and sink adapters. Do not call production GET pages that perform sweeps as a shortcut for read-only inspection.


### V1 — One Kenco relationship across email, CRM and Work

**Demo:** Replay Craig and Dave with no GAP persona. Email, app and pursuit all show the same company and open deal, with a dated source. Repeat with CRM unavailable: unknown, never no opportunity.


#### C01 [P1] Carry deal coverage into briefing intelligence

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Commit b21b8230 (V1, C01-C06 together; `tests/unit/gap/v1-kenco.test.ts` 6, the joined Kenco fixture: Kenco Logistics with alias kenco, domain kencogroup.com, HubSpot company 55608495412, the open deal at presentationscheduled, Dave and Craig as contacts; focused run green, serial, one worker). `work/deal-coverage.ts` (new): the day's in-deals read becomes a `DealCoverage` with its status (complete, unavailable, absent) and `checkedAt`; `defaultIntel` in `work/briefing-send.ts` takes the same read the day took (`deps.inDeals`, soft) and the cockpit page passes it through `dealCoverageFrom`; the real composition is exercised, not a hand-built ranker fixture.
- **Change boundary:** work/briefing-send.ts defaultIntel and its caller: pass the same complete/unavailable deal snapshot used by the day, including checkedAt.
- **Acceptance:** Complete Kenco snapshot reaches rankPeople in both surfaces; failed snapshot produces unknown. Exercise the real defaultIntel composition, not a manually built ranker fixture.
- **Depends on:** none.
- **Evidence/test state:** Code: defaultIntel:102 omits dealAccounts; P01.


#### C02 [P1] Resolve a mailbox person through existing identity machinery

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Commit b21b8230 (V1, C01-C06 together; `tests/unit/gap/v1-kenco.test.ts` 6, the joined Kenco fixture: Kenco Logistics with alias kenco, domain kencogroup.com, HubSpot company 55608495412, the open deal at presentationscheduled, Dave and Craig as contacts; focused run green, serial, one worker). `work/person-identity.ts` (new): `resolvePersonAccount` places a mailbox person through the existing identity service (persona, the CRM contact's company id, the thread's alias, the verified domain; freemail never places; ambiguity is kept, not resolved by guess); `opportunity/contact-reads.ts` (new) reads a HubSpot contact by address with its company and deal associations, supplied by the routes only (the library never calls the CRM by default, so a test cannot make a live call).
- **Change boundary:** work/decide.ts and identity/opportunity adapters: exact normalized email -> CRM contact associations -> company IDs/domain aliases. Preserve competing matches; do not auto-create CRM records.
- **Acceptance:** Dave without Persona resolves to company 55608495412 and deal 62704698979; shared corporate domain with two candidate subsidiaries stays ambiguous.
- **Depends on:** none.
- **Evidence/test state:** P02; live HubSpot associations.


#### C03 [P1] Use stable IDs and alias-aware relationship matching

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Commit b21b8230 (V1, C01-C06 together; `tests/unit/gap/v1-kenco.test.ts` 6, the joined Kenco fixture: Kenco Logistics with alias kenco, domain kencogroup.com, HubSpot company 55608495412, the open deal at presentationscheduled, Dave and Craig as contacts; focused run green, serial, one worker). Coverage is folded by every recorded deal name and alias (`byName`) and by contact id (`byContactId`); `dealsAt(coverage, name, extraNames)` answers for the canonical name and its aliases; `dealsByContactId` for a person; the `kenco` alias finds the Kenco Logistics deal.
- **Change boundary:** work/intel.ts: replace exact account-name Set membership with existing resolved identity references; retain display names as labels.
- **Acceptance:** Kenco, Kenco Logistics and kencogroup.com map to one supported identity; unrelated similarly named company does not.
- **Depends on:** C02.
- **Evidence/test state:** P03; in-deals.ts already has identity-aware joins.


#### C04 [P1] Make negative opportunity claims conditional on complete reads

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Commit b21b8230 (V1, C01-C06 together; `tests/unit/gap/v1-kenco.test.ts` 6, the joined Kenco fixture: Kenco Logistics with alias kenco, domain kencogroup.com, HubSpot company 55608495412, the open deal at presentationscheduled, Dave and Craig as contacts; focused run green, serial, one worker). `dealWords`: "their account is in an open deal (name, stage): work it from the deal" under a complete read with a deal; "no open deal found (HubSpot read <time> New York)" only under a complete read; "open deal unknown: HubSpot could not be read" or "not read for this list" otherwise; `rankPeople` sets `IntelItem.opportunity` to open, none or unknown and never writes "no live opportunity"; the briefing composition carries the same words.
- **Change boundary:** work/intel.ts and intel line model: present open, none-confirmed, unknown, ambiguous explicitly.
- **Acceptance:** Missing identity, timeout, pagination truncation and absent dealAccounts never say no live opportunity; complete empty association read may.
- **Depends on:** C01,C03.
- **Evidence/test state:** P01.


#### C05 [P1] Preserve message provenance on Pursue

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Commit b21b8230 (V1, C01-C06 together; `tests/unit/gap/v1-kenco.test.ts` 6, the joined Kenco fixture: Kenco Logistics with alias kenco, domain kencogroup.com, HubSpot company 55608495412, the open deal at presentationscheduled, Dave and Craig as contacts; focused run green, serial, one worker). `work/decide.ts`: a Pursue on a person reloads the newest inbound row by address and carries the date, thread id, subject, inbound message id, message count and a bounded excerpt (600 chars of the body or the snippet) into the task input; `recordDecision` carries `resolvedVia`, `ambiguous` and `inboundMessageId`; a prepared angle is kept across a note-less Pursue (A02).
- **Change boundary:** work/decide.ts person branch: carry source message/thread IDs, mailbox identity, receivedAt, lastWroteAt, body reference and account resolution; reload authoritative source rather than trusting URL payload.
- **Acceptance:** Dave September 16 remains dated after queue -> task -> angle; missing body is an explicit retrieval gap. Replaying cannot attach another sender’s thread.
- **Depends on:** C02.
- **Evidence/test state:** P06; decide.ts person branch drops dates and thread.


#### C06 [P1] Scope active-deal preparation to the right opportunity

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Commit b21b8230 (V1, C01-C06 together; `tests/unit/gap/v1-kenco.test.ts` 6, the joined Kenco fixture: Kenco Logistics with alias kenco, domain kencogroup.com, HubSpot company 55608495412, the open deal at presentationscheduled, Dave and Craig as contacts; focused run green, serial, one worker). `agents/develop-angle.ts`: the person's open deals (id, name, stage, next step) ride with the task; the prompt says the angle is deal work from the deal's next step, never a cold opener; the result is scoped (`inDeal`, `dealId`, `dealIds`), and more than one deal leaves the scope said as ambiguous rather than picked. The negative control (no deal, a complete read) still says none.
- **Change boundary:** Reuse deals/scope.ts and active-opportunity resolver before angle/action selection. Resolve Dave and Craig through contact-deal associations; multiple deals require explicit supported scope.
- **Acceptance:** Two deals at one company with shared contacts do not inherit each other’s next step; active deal proposes deal work without authorizing cold enrollment.
- **Depends on:** C03,C05.
- **Evidence/test state:** Live Kenco company+two-contact associations; existing R50-R55.


### V2 — Read the conversation before recommending outreach

**Demo:** Kenco shows Dave’s September roadmap, October 1 sent message and existing unsent drafts; Lazer shows site support and Riserify vendor outreach. None becomes a generic cold opener.


#### C07 [P1] Read complete bounded thread context

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder A (`feat/gap-stream-a`), merged by the lead. Commit 38377c26 (`stream-a-thread-context.test.ts` 7): `context/thread-context.ts` (new): stored inbound rows plus an injected Sent and Drafts reader become typed `TimelineEvent`s; the excerpt is the author's own text with the quoted history cut (`quotedBelow`), bounded; coverage says complete, partial (a cut read, an unread Sent) or unknown (an unreadable store), never no activity.
- **Change boundary:** Add a reusable context adapter over existing Gmail/InboundMessage and HubSpot engagement readers: inbound and outbound, quoted-text boundaries, participants and pagination coverage.
- **Acceptance:** Nested MIME September thread retains current author text; quoted earlier messages are not new buyer statements; truncated thread reports partial.
- **Depends on:** C05.
- **Evidence/test state:** Live Gmail MIME read; no thread body in develop-angle.ts.


#### C08 [P1] Distinguish draft, sent, received and calendar mail

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder A (`feat/gap-stream-a`), merged by the lead. Commit 38377c26: a draft is typed draft and never counts as contact; calendar invitations and RSVPs are typed calendar with their meeting (kind, meeting key, start) and duplicate RSVP copies collapse to one; provider ids are kept (gmail, hubspot, rfc) and one email seen through both providers merges by RFC Message-ID then provider id, never by subject.
- **Change boundary:** Context timeline records provider IDs, labels, direction, authoredAt and source; DRAFT never counts as contact; invitations/RSVPs are typed events.
- **Acceptance:** October 5 Kenco drafts are available as preparation, October 1 is sent, duplicate Oct14 RSVP messages yield one meeting response.
- **Depends on:** C07.
- **Evidence/test state:** Gmail Kenco sample, 21 records, no next page.


#### C09 [P1] Classify commercial relationship and message purpose separately

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder A (`feat/gap-stream-a`), merged by the lead. Commit d112df10 (`stream-a-purpose.test.ts` 6: the Lazer support ask, the Riserify pitch, a referral request, a court-summons invite, a calendar RSVP, an automated notice): `context/purpose.ts` (new): `classifyPurpose` reads one message with the mailbox's reply vocabulary and says buyer_conversation, customer_support, vendor_solicitation, partner_referral, media, internal, calendar, automated, suspicious or unknown with the cue it matched; `classifyRelationship` reads CRM and ledger evidence only (an open deal under a complete read, customer, persona, placed account, flags; several at once is mixed; nothing is unknown and says the CRM was not read); purpose never proves relationship. Wired into the people ranker by the lead (commit c06d5c1a, `lead-c09-c10-wiring.test.ts` 3): every inbound message's purpose from its subject and snippet, the sender's verdict from all of them.
- **Change boundary:** Reuse disposition/reply precision; add evidence-backed purposes: buyer conversation, customer support, vendor solicitation, partner/referral, media, internal, calendar, automated, suspicious, unknown. Do not make these CRM truth automatically. Relationship is a separate evidenced axis: active opportunity, customer, prospect, partner, vendor, media, internal, mixed or unknown. One person may have multiple roles by thread/deal; purpose never proves relationship.
- **Acceptance:** Lazer device-support message routes to support context; Seb sales-service pitch to vendor; referral request remains referral. Unknown is visible for review. A customer can ask a new buying question; a partner can send a vendor pitch; classify each axis separately and preserve unknown.
- **Depends on:** C07.
- **Evidence/test state:** P04 plus Gmail Lazer/Riserify reads.


#### C10 [P1] Compute answer owed and quietness from both sides

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder A (`feat/gap-stream-a`), merged by the lead. Commit e85e4bc3 (`stream-a-people-state.test.ts` 5): `work/people-state.ts` (new, pure): per person lastInboundAt (a calendar RSVP and an automatic reply are not them writing), lastOutboundAt (sent, never a draft), answerOwed when their newest buyer or support message came after our last send (a September 24 inbound answered the same day is not owed), quiet only when no meaningful exchange either way for 14 days and no accepted meeting ahead, with the basis in words (an October 1 send and an accepted October 14 meeting prevent a went-quiet claim built on the September 16 inbound alone), nextMeetingAt, outstanding commitments by the message they came from. Wired by the lead (c06d5c1a): `loadIntelligence` takes the briefing's Gmail Sent reader (`defaultIntel` passes the one the briefing holds), reads Sent for the people that would be listed only, builds the two-sided state, and `rankPeople` judges by it (an owed answer is C35's list, not a re-engagement; a person we wrote to or with a meeting ahead is not quiet; a quiet person carries the basis on the line and the state on the item); without the reader, or when a read fails, the line says our Sent was not read so a reply of ours may exist, and the selection says which.
- **Change boundary:** work/intel.ts people ranking: newest meaningful conversation state, latest sent action, accepted future meeting and outstanding commitments; date is descriptive and seller-overridable.
- **Acceptance:** September 24 inbound followed by same-day reply is not answer owed; October 1 send and future meeting prevent went-quiet claim based only on inbound date.
- **Depends on:** C08,C09.
- **Evidence/test state:** rankPeople uses inbound timestamp only.


#### C11 [P1] Expose suspect correspondence for review without prospect claims

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder A (`feat/gap-stream-a`), merged by the lead. Commit d112df10: `reengageEligible` keeps suspicious-only, calendar-only, automated, vendor, media, internal and opted-out senders out of re-engagement and sends an unknown purpose to review (listed with a review note, never silently dropped); the module follows no link and deletes nothing. Wired by the lead (c06d5c1a): an ineligible sender is out of the people list, a review note rides on the line and the item.
- **Change boundary:** Classifier presentation excludes suspicious/calendar-only messages from prospects by default, retains searchable source and reversible classification. Do not click links or auto-delete.
- **Acceptance:** Court-summons invitation cannot yield a buyer-interest assertion or automatic outreach; seller can inspect and correct classification.
- **Depends on:** C09.
- **Evidence/test state:** P04; actual summons contents not independently retrieved.


#### C12 [P1] Make classification corrections durable and explainable

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder A (`feat/gap-stream-a`), merged by the lead. Commit 793c9666 (`stream-a-overrides.test.ts` 2): `context/classification-overrides.ts` (new): a seller correction is one append-only `conversation.classified` row in the GAP audit ledger with the source id (one thread or one message; a domain scope is refused), the rationale, the version and the machine suggestion it replaced; `loadOverrides` reads the newest version per source id; `applyOverrides` changes only the conversation named and keeps the machine purpose beside it, so correcting one media thread never touches another thread from the same domain.
- **Change boundary:** Store seller override with source ID, rationale, version and scope in existing ledger; apply across brief/app/tasks without changing unrelated conversations.
- **Acceptance:** Correcting one media thread does not blacklist all people at that domain; subsequent agent run honors override and retains original machine suggestion.
- **Depends on:** C09.
- **Evidence/test state:** Design acceptance; no claim existing disposition system absent.


### V3 — Brain and Clawd supply usable, attributed knowledge

**Demo:** Kenco packet displays buyer statements, internal standup interpretation and historical research separately. Older contradictory no-deal text cannot override CRM. A missing source stays visible as missing.


#### C13 [P1] Define the shared commercial-context contract

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Commit 45a335bb: `context/commercial-context.ts` (new; `tests/unit/gap/commercial-context.test.ts` 4): the one packet (identity, opportunity with coverage and `scopedDealId`, relationship, a typed timeline with drafts and calendar apart, attributed claims with source id, kind, authority, class, visibility, event and observation dates, commitments, incumbents, external facts, per-source coverage, `assembledAt`, `revision`); `validateClaims` refuses an untyped claim by its fault and a refresh time passed as an observation date; `externallyUsable` keeps internal, modeled, inferred and superseded claims out of buyer use; `byAuthority` answers one question by its authoritative source (deal existence is the CRM's, not the vault's); `contextFingerprint` is order independent and moves only with a source id, version or date (C23 keys on it); `emptyPacket` says every source absent, never an empty history. Builders A, B and C build to this contract.
- **Change boundary:** Extend existing AccountContext/Story rather than a new CRM. Packet: identity, opportunity, timeline, buyer facts, seller hypotheses, commitments, incumbent systems, source IDs, event dates, observed dates, visibility and coverage.
- **Acceptance:** Contract fixture requires provenance and coverage for each source; API/schema tests reject untyped facts and maintain compatibility.
- **Depends on:** C06,C08,C09.
- **Evidence/test state:** Existing context/story/deals readers; thin angle prompt.


#### C14 [P1] Retrieve linked account, people and meeting notes

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder B (`feat/gap-stream-b`), merged by the lead. Commit a7a7d340 (`stream-b-retrieval.test.ts` 7): `context/retrieval.ts` (new): the vault account note read section by section with its wiki-links followed one level into meeting notes, raw transcript spans and people notes, bounded (12 linked notes, 80 claims, 12 per section, 8 transcript spans, 500 chars a claim), every claim keeping its path and heading as the source id; a note at another account is not followed; private detail, engagement and modeled figures are internal; `story/load.ts` reads through it (`knowledgeAdapters`, `loadAccountKnowledge`), the one-paragraph note keeps its outputs.
- **Change boundary:** Replace wedge-only adapter with bounded account-specific retrieval from canonical vault/index, following relevant wiki-links to meeting notes/raw transcript spans and source references. Preserve raw text attribution.
- **Acceptance:** Kenco recent inbox notes and July discovery are retrievable alongside account note; unrelated accounts and private personal details are excluded from outbound context.
- **Depends on:** C13.
- **Evidence/test state:** P07; local vault files inspected.


#### C15 [P1] Separate document refresh time from claim time

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder B (`feat/gap-stream-b`), merged by the lead. Commit a7a7d340: a file's `last_refreshed` and a snapshot's `rebuilt_at` go to `indexedAt`, never `observedAt` (an undated wedge stays undated); the contract's `validateClaims` refuses a refresh time passed as an observation date (C13, 45a335bb).
- **Change boundary:** story/load.ts and source envelope: file/index rebuilt time never becomes claim observation date. Retain section date and unknown dates.
- **Acceptance:** October 8 refreshed account with July wedge remains July/undated claim; September buyer mail keeps September date.
- **Depends on:** C14.
- **Evidence/test state:** P07; live Clawd rebuilt Oct8 with July/Aug wedges.


#### C16 [P1] Select Clawd knowledge by source identity and version

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder B (`feat/gap-stream-b`), merged by the lead. Commit a7a7d340: Clawd notes are selected by identity and version; identical copies are one claim; an older different text is kept, marked superseded and in conflict; the selection is order independent; `currentClawdClaim` answers the current version. Coverage says offline, timeout, not found, not configured and the bounds, apart from empty.
- **Change boundary:** story/load.ts cloud adapter: replace first matching Vault wedge with version-aware source retrieval; deduplicate identical claims, preserve superseded history.
- **Acceptance:** July11 and Aug7 notes select appropriate newest version, retaining citation; unordered array gives same result; contradictory assertions remain visible.
- **Depends on:** C13.
- **Evidence/test state:** P08; live reasoning_notes order.


#### C17 [P1] Resolve conflicting sources with field-specific authority

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder B (`feat/gap-stream-b`), merged by the lead. Commit d2889e6b (`stream-b-assemble.test.ts` 7): `context/assemble.ts` (new): the packet is built from injected adapters (identity, the CRM read, builder A's timeline, the vault and Clawd through retrieval.ts, verified public facts, commitments) and each question is answered by its authority: deal existence by the CRM only (a stale vault or Clawd no-deal line stays a seller note), sent and received by the provider, buyer words by buyer sources only (a seller note quoting the buyer is interpretation), public facts with their dates; two buyer sources that keep and drop one system are shown in conflict, both visible.
- **Change boundary:** Use CRM for deal existence, provider mail for sent/received, buyer source for buyer words, seller notes for interpretation, public citations for external facts. No universal newest-wins rule.
- **Acceptance:** Kenco stale vault no-deal claim cannot override associated open deal; seller assertion cannot become a buyer quote; two conflicting buyer sources display conflict.
- **Depends on:** C13,C14,C16.
- **Evidence/test state:** Kenco vault contains research status, no-deal source line and newer meeting history.


#### C18 [P1] Separate seller knowledge from externally usable evidence

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder B (`feat/gap-stream-b`), merged by the lead. Commit d2889e6b: every chunk is bucketed by the trust vocabulary (a deck-scanner line internal only, a modeled figure modeled and internal, the standup read available to planning); an instruction inside a note or an email is quoted data that changes nothing returned or called; `externallyUsable` (C13) is the gate for buyer use.
- **Change boundary:** Apply existing trust vocabulary/compiler controls to retrieved chunks: internal-only, buyer-attributed, approved external fact, modeled, inference. Keep useful private context available to internal planning.
- **Acceptance:** Deck scanner activity cannot be quoted as buyer intent; modeled $98.9M remains modeled/internal unless approved; private standup guides strategy without leaking. Malicious email/vault instructions to send, change flags or reveal secrets remain quoted source data and trigger no tool action.
- **Depends on:** C17.
- **Evidence/test state:** ask/grounding.ts intentionally excludes vault; account note mixes claim classes.


#### C19 [P2] Index Claude knowledge as attributed artifacts, not implicit memory

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder B (`feat/gap-stream-b`), merged by the lead. Commit cb2a7fd0: `docs/gap/CLAUDE_KNOWLEDGE_INVENTORY.md`: no model API reads Claude chat, project memory or CLAUDE.md; which canonical accepted decisions may be imported as attributed artifacts with origin and version (through the retrieval claim vocabulary, C13) and which never; the stale memory lines named against the ledger. Nothing in a generation path assumes a model can see Claude memory.
- **Change boundary:** Inventory relevant CLAUDE.md, project memory and accepted plans; import only canonical accepted decisions/approved commercial notes with origin/version. Do not copy chat instructions into tool authority.
- **Acceptance:** Stale Claude memory X19-open does not override later canonical X19-retired; no assumption that selecting a Claude model grants project-chat access.
- **Depends on:** C13.
- **Evidence/test state:** Local Claude execution-engine memory read; current canon differs.


#### C20 [P1] Expose retrieval coverage and source freshness

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder B (`feat/gap-stream-b`), merged by the lead. Commit d2889e6b: one coverage row per source (configured, reachable, completeness, watermark, indexedAt, the query, what was omitted and why); a vault offline, a Clawd timeout and an unread Sent are reported as such, never as an empty history; `coverageLine` (C13) says it in words. C46 reads these rows into health (lead).
- **Change boundary:** Packet includes configured, reachable, complete/partial, source watermark, indexedAt, query and omitted source reason; distinguish empty from unavailable.
- **Acceptance:** Vault offline, Clawd timeout and partial CRM associations produce useful internal packet plus honest gaps; no fabricated empty history.
- **Depends on:** C13,C14,C16.
- **Evidence/test state:** Current soft catches return null/empty; live adapters partially connected.


### V4 — Pursue becomes specific prepared work

**Demo:** Pursue Kenco prepares a deal-specific follow-up draft proposal grounded in Dave’s roadmap; Pursue Hormel retains the dated 2018 signal; no message is sent.


#### C21 [P1] Use the shared context in angle generation

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder B (`feat/gap-stream-b`), merged by the lead. Commit 46b092ff (`develop-angle.test.ts` 7; `v1-kenco.test.ts` 6 unchanged): `agents/angle-claims.ts` (new), `agents/develop-angle.ts`: the handler assembles the commercial-context packet (seeded from what the Pursue carried, joined with the vault and Clawd from the env, the verified public facts from the database and whatever the caller wires) and the prompt carries its record block labelled [K1]...: the systems on record with class and date, the buyer's words (external lines only), the last exchange, the deal's recorded next step, the seller's hypotheses as hypotheses, the checked facts with dates, the gaps. A date-only record renders as the day it names.
- **Change boundary:** agents/develop-angle.ts: consume bounded C13 packet rather than title+generic pains+three hypotheses. Include incumbent, buyer objective, last exchange and existing next step.
- **Acceptance:** Kenco output mentions source-supported Open Dock/Birdseye/Blue Yonder context and prior conversation; it does not ask how gate check-in is managed as if unknown.
- **Depends on:** C13,C17,C18,C20.
- **Evidence/test state:** Current buildAnglePrompt inputs inspected.


#### C22 [P1] Require traceable commercial claims in generated angles

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder B (`feat/gap-stream-b`), merged by the lead. Commit 46b092ff: the answer carries support per sentence and starter (labels, fact or inference), validated after the voice: an unsupported buyer claim, an installed system the record does not name and an unhedged pain with no record are re-asked naming the break, then refused unless labelled an inference; a label the record lacks is refused; a supported July observation stays usable with its date; an answer without a support block is matched to the record by its words; the result carries the claim references, the packet revision, the gaps and the incumbents.
- **Change boundary:** Add claim/source references and fact-vs-inference annotations to internal angle result; validate references and unsupported assertions alongside existing voice checks.
- **Acceptance:** Invented facility pain, buyer interest or installed system is rejected/labelled inference; a supported historical observation stays usable with its date.
- **Depends on:** C21.
- **Evidence/test state:** validateAngle checks style/roster/length, not factual support.


#### C23 [P1] Bind cached agent output to its context revision

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder B (`feat/gap-stream-b`), merged by the lead. Commit 20ff7a5b (`decide.test.ts` +2; mutation: the sameContext term removed turns both RED): `work/decide.ts` queueAngle binds the kept angle to its context revision (`seedRevision`: the placement, the CRM read, the message; never the clock or the note) carried on the task input as `contextRevision`; an unchanged Pursue reuses the prepared angle with no new task; a changed buyer or CRM context (the person placed at the account after the identity fix, a new deal next step, a newer message) queues a fresh one so the old no-account Kenco angle is replaced; a succeeded task from before the rule (no revision) is replaced; a running task is still kept so two never run at once.
- **Change boundary:** queueAngle cache keyed by source revision/context fingerprint and seller request; unchanged Pursue reuses output, changed buyer/CRM context invalidates it.
- **Acceptance:** An old no-account Kenco angle is replaced after identity/context fix; repeat unchanged click creates no duplicate spend.
- **Depends on:** C21.
- **Evidence/test state:** A02 cache keeps succeeded angle on unchanged Pursue.


#### C24 [P1] Promote an accepted angle into the existing draft workflow

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder B (`feat/gap-stream-b`), merged by the lead. Commit 4272635b (`stream-b-promote-angle.test.ts` 3): `agents/promote-angle.ts` `promoteAngle`: the seller accepts a prepared angle for one offered person and one action; when they wrote in, the reply is composed from the angle's starters, editable, and created as a Gmail draft in their thread through `execution/seller-reply.ts` `createSellerReplyDraft` with every click-time gate (a second acceptance returns the same draft, an edited text while that draft stands is refused in words, an em dash never reaches Gmail); when nobody wrote in and the item has a verified fact, the angle becomes a proposal through `story/draft-from-fact.ts` with a cited observation, the thesis, the starters as the questions and the persona key, for the existing review, routing, compile and draft path; a call or research drafts nothing and says where to go; a stranger is never drafted to; prepared and sent stay two ledger facts and every promotion is one `angle.promoted` row carrying the task, the context revision, the claim references and the destination; nothing sends. Commit 021ff718: `competingWork` reads the thread id builder A's ThreadEvent carries; the handler inventory names the promotion as a seller-clicked bridge to the existing paths (no task kind, no handler).
- **Update (builder B, commit dd768387; `stream-b-promote-angle.test.ts` 3, `stream-b-promote-route.test.ts` 2, `stream-b-angle-promote.test.tsx` 3):** C25 folded in: `promoteAngle` reads the competing drafts server side before any draft or proposal (the typed timeline with its Gmail drafts when the mailbox is wired, GAP's own reply-draft state, or an injected read) and judges them with `competingWork`: found and unchosen it refuses with the items, the line and the offers; an unsent draft with the seller's own edits is never overwritten (revise only; fresh refused); a reusable draft offers reuse or fresh; reuse and revise return the existing item and create nothing, recorded as a promotion. `POST /api/gap/angles/promote` (session only; 200 the result, 409 competing with the line and offers, 404 unknown task, 400 a refusal in words). `components/gap/angle-promote.tsx` is the one control that fires the promotion (the offered people only, the proposed action marked, the competing drafts with only the offered choices); the lead mounts it beside the prepared angle.
- **Change boundary:** Bridge selected people/action to existing hypothesis/proposal/compiler and editable draft preparation. Track prepared versus sent separately; no second orchestration framework.
- **Acceptance:** Pursue -> specific proposed person/action -> seller approval -> compiled mock Gmail draft, with source and revision links; no automatic buyer send.
- **Depends on:** C21,C22,C23,C39.
- **Evidence/test state:** develop_angle returns prose/result; does not itself create outreach.


#### C25 [P1] Reuse existing drafts and check for competing work

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder B (`feat/gap-stream-b`), merged by the lead. Commit 76219a85 (`stream-b-competing-work.test.ts`): `competingWork` in `context/assemble.ts`: the existing drafts and in-flight work for the same identity, deal, thread and purpose are found and offered for reuse or revision before a proposal is generated from an angle; the same thread competes on its own, the same person competes when the deal or the purpose matches or neither is known, so a vendor or support draft to another person at the account does not; an unsent seller edit and a timeline draft no proposal wrote are revise-only and never overwritten (overwrite is always false); deterministic, newest first, the same inputs give the same answer on a retry. The UI wiring on the outreach anchor is the lead's (see C24).
- **Change boundary:** Before generating another draft, compare same identity/deal/thread/purpose and existing draft revision. Offer reuse/revise; do not overwrite unsent seller edits.
- **Acceptance:** October 5 Kenco draft appears as existing work; retry does not create a second conflicting agenda.
- **Depends on:** C08,C24.
- **Evidence/test state:** Live Kenco drafts exist; absence from test email.


#### C26 [P2] Inventory handler coverage and make unsupported actions explicit

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder B (`feat/gap-stream-b`), merged by the lead. Commit cb2a7fd0: `docs/gap/HANDLER_INVENTORY.md`: every declared task kind, email command, signed link op and intelligence decision against the code that answers it; research_focus, prepare_call, prepare_follow_up and prepare_meeting are declared, unsupported and unreachable, promised by no exposed action, so nothing was registered; the scope every generated result must carry. An unsupported command is refused in words by the existing command path.
- **Change boundary:** Compare every exposed call/follow-up/meeting action and declared task kind with registered handlers; mark unsupported paths explicitly and create individually scoped implementation children only for demonstrated missing promises.
- **Acceptance:** Each exposed action has a registered tested handler or is explicitly unavailable; generated follow-up/call brief keeps account/deal scope and sources.
- **Depends on:** C13.
- **Evidence/test state:** handlers.ts registers revise_message, answer_objection, develop_angle; broader coverage needs inventory.


### V5 — A truthful, navigable daily briefing

**Demo:** Render the October 8 fixture locally. One Kenco deal thread, one obligation per Diego/Bryan, historical intelligence retained, explicit count basis and matching app/email actions.


#### C27 [P1] Deduplicate obligations by durable origin

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder C (`feat/gap-stream-c`), merged by the lead. Commit 3008563b (`stream-c-c27-c28-obligations.test.ts` 9): `work/list.ts`, `work/plan.ts`: an obligation is one per durable origin (account, deal, person by address, persona or name, kind, source kind and id); a reminder about a person folds into the follow-up waiting on them by relationship or by the commitment it derives from, never by title, in every phase (a follow-up plus its derived reminder renders once; two promises to one person stay two); the plan keeps one item per durable object (commitment, meeting, reply) as well as per key.
- **Change boundary:** work/list.ts, commitments and plan projection: use shared originating message/disposition/commitment ID and relationship scope, not titles alone; retain distinct obligations.
- **Acceptance:** Diego follow-up plus derived reminder renders once; two different promises to same person remain two. Repeat with missing email and alternate title.
- **Depends on:** none.
- **Evidence/test state:** Test email duplicates; existing list.ts:668 has only conditional reminder dedup.


#### C28 [P1] Describe return dates accurately

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder C (`feat/gap-stream-c`), merged by the lead. Commit 3008563b: return dates say due today, overdue since <day>, returned on <day>; overdue since then, scheduled for <day> (a May 26 or June 16 reminder read on October 8 never says back today); date-only values are New York days at the due hour, never UTC midnight.
- **Change boundary:** Follow-up presentation distinguishes due today, overdue since, returned on and scheduled for; date-only values do not shift through UTC conversion.
- **Acceptance:** May26/Jun16 on Oct8 never says back today; DST and New York midnight cases remain correct.
- **Depends on:** none.
- **Evidence/test state:** Observed email; targeted expected behavior.


#### C29 [P1] Preserve publication date semantics

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Commit 69909205 (`tests/unit/gap/lead-intel-c29-c34.test.ts` 3): `isDateOnly` in `work/intel.ts`: a publication value stored at exactly midnight UTC is a date (an EDGAR filing day) and is formatted in UTC, so an October 8 filing says Oct 8, never Oct 7 New York; a real instant still converts; the item carries `publishedDateOnly`. The proven fault: `2026-10-08T00:00:00Z` rendered "Oct 7, 2026" before.
- **Change boundary:** Signal/trigger display carries date-only versus timestamp type; do not interpret an EDGAR filing date at UTC midnight as prior New York day.
- **Acceptance:** 2026-10-08 filing displays Oct8; actual timestamp converts correctly. Do not alter underlying factual date without source evidence.
- **Depends on:** none.
- **Evidence/test state:** P10; test email PEP/COST title versus display mismatch.


#### C30 [P2] Cluster related intelligence with retained sources

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Commit 69909205: `rankSignals` clusters related reports of one event at one account (the same idea in the title by `sameIdea`, published within 14 days of each other) under the strongest report; every other source is kept on the item (`alsoReported` with id, source, url, date; `clusterIds`) and the line ends "Also reported by X, Y"; distinct events (a Denver DC, another account) and a recurring title months apart (a 10-Q each quarter) stay separate; a decision on any member removes the whole cluster for the day. The intel fixture signals became distinct events (a site number each) so the old placeholder title no longer masks clustering.
- **Change boundary:** Reuse signal event IDs and cross-source identity; group related Pepsi/Gatik reports rather than losing three of six slots; avoid merging distinct launches.
- **Acceptance:** Three corroborating reports one event with three sources; different dates/expansions stay separate when evidence does not establish same event.
- **Depends on:** none.
- **Evidence/test state:** Email shows three Pepsi/Gatik stories; exact event equivalence needs verification.


#### C31 [P1] Align brief counts, ordering and START target

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder C (`feat/gap-stream-c`), merged by the lead. Commit 37ad37c5 (`stream-c-c31-c33-briefing.test.ts`): `work/briefing.ts`, `briefing-send.ts`, `plan.ts`, `list.ts`: the headline names its count basis ("N to execute" is the plan's items, the same durable list START and NEXT walk, with item 1 named beside the START link; "M to decide" is the intelligence shown, counted apart, the backlog said in words; zero and mixed states said).
- **Change boundary:** Brief presentation names count categories and uses the same durable actionable items/order as START/NEXT. Intelligence discovery stays first if chosen but is labelled separately from execution count.
- **Acceptance:** Headline, visible actionable rows and START target reconcile; no “first” pointer secretly starts on a different category. Test zero and mixed states.
- **Depends on:** C01,C27.
- **Evidence/test state:** briefing.ts uses plan.items.length, independently grouped intelligence.


#### C32 [P1] Show account/deal context and item-specific destinations

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder C (`feat/gap-stream-c`), merged by the lead. Commit 37ad37c5: each card carries the relationship or motion, the last material exchange, the next prepared action whole, the source and date under its own deep link (PlanItemContext read off the Work card and the obligation); an intelligence item at an account with an open deal names the deal, its stage and its whole next step and links to the deal brief, never generic Work (BriefingLinks.deal); a long deal next step is cut at a sentence end or kept whole, never mid-sentence (clipAtSentence on the Work card, the plan item and the one-line deals).
- **Change boundary:** Brief card: identity, relationship/motion, why surfaced, last material exchange, next prepared action, source/date and precise deep link; unresolved items link to resolution context.
- **Acceptance:** Kenco never falls back to generic Open Work when a supported deal exists; long deal next steps are not cut mid-sentence.
- **Depends on:** C06,C21,C31.
- **Evidence/test state:** Observed generic links and truncated deals line.


#### C33 [P2] Use greeting appropriate to actual send and replay

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder C (`feat/gap-stream-c`), merged by the lead. Commit 37ad37c5: the greeting follows the New York hour of the send (21:47 is "Good evening"); a replay or resend states when its plan was made and that changes since are on Work.
- **Change boundary:** briefing.ts uses neutral greeting or seller-local hour; replay states snapshot date/time and whether current state changed.
- **Acceptance:** 21:47 New York does not say good morning; yesterday snapshot cannot be mistaken for fresh live plan.
- **Depends on:** none.
- **Evidence/test state:** briefing.ts:94; email sent 21:47.


#### C34 [P2] Maintain visibility beyond bounded selection windows

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Commit 69909205: `loadDecided` reads every decision row in pages of 2000 (a capped read let a dismissed item resurface past the cap; the fixture now honors `skip`); `loadIntelligence` returns `selection` (the three pulls and their caps in words, the people window in days, the intake cap and whether it was hit, the page shown, `moreSignals`/`morePeople`), accepts `skipSignals`/`skipPeople`/`peopleWindowDays`; `/gap?moreSignals=N&morePeople=N` pages the Work panel and each section says "How this was chosen" with a More link. No age gate was added anywhere (I06 intact).
- **Change boundary:** Reader coverage/pagination for signals, people, decisions and pursued tasks. Retain any-age intelligence; explain selection and allow more/search. Do not reintroduce age cutoff as relevance policy.
- **Acceptance:** An older relevant signal beyond initial windows can be retrieved; 3,023 is not labelled completely reviewed; skipped/dismissed state survives capped decision reads.
- **Depends on:** C20.
- **Evidence/test state:** intel pulls 100/300/200; people 180d/2000; decisions 2000; tasks14d.


#### C35 [P1] Keep unresolved obligations durable until resolved

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder A (`feat/gap-stream-a`), merged by the lead. Commit fca6151e (`stream-a-answers-owed.test.ts` 3; r63a-answer-owed, r60-recorded-replies and load-day still green): `loadAnswersOwed` in `work/recorded-replies.ts` queries confirmed dispositions by status, a page at a time until the ledger is exhausted, with no 14-day window and no 100-row take (ANSWER_OWED_DAYS removed); resolution is explicit: the answer sent (REPLY_SENT) or the seller's `execution.reply_resolved` row with the reason; a copy is still not an answer; the 15-day-old reply and the 101st reply stay owed.
- **Change boundary:** work/recorded-replies.ts and task projection: query unresolved status independently of age windows; pagination cannot delete owed work.
- **Acceptance:** Unanswered confirmed reply aged15d and the 101st reply stay owed; old task remains visible until terminal. Resolution is explicit.
- **Depends on:** C10.
- **Evidence/test state:** ANSWER_OWED_DAYS14/take100 remain after X14.


### V6 — Activity means what it says

**Demo:** Replay draft, send, meeting outcome, CRM note and recovered write. The scorecard reports preparation, actual contact and commercial progress distinctly.


#### C36 [P1] Separate draft preparation from first-touch completion

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder C (`feat/gap-stream-c`), merged by the lead. Commit b0370d1d (`stream-c-activity-truth.test.ts` 10): `work/activity.ts`, `activity-view.tsx`: a draft or an approval PREPARES an outreach item (kind prepares, status prepared, "awaiting your send") and never completes it; a provider send or an explicit seller-reported send completes it with its basis.
- **Change boundary:** work/activity.ts/accountability: drafted or copy-approved may complete a preparation item, never an outreach item.
- **Acceptance:** Draft-only first_touch remains awaiting send; provider send or explicit seller-reported send completes correct action with its basis.
- **Depends on:** none.
- **Evidence/test state:** Independent probe: reproduced.


#### C37 [P1] Separate meeting outcome from meeting booked

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder C (`feat/gap-stream-c`), merged by the lead. Commit b0370d1d: meeting accepted, meeting booked (a calendar proof row) and meeting outcome captured are three kinds; no outcome increments booked.
- **Change boundary:** work/activity.ts event mapping and scorecard consumers; preserve capture.meeting outcome enum.
- **Acceptance:** disqualified_problem/no_decision/more_discovery do not increment booked; meeting accepted, booked and outcome captured remain distinguishable.
- **Depends on:** none.
- **Evidence/test state:** Independent probe: reproduced.


#### C38a [P1] Label CRM maintenance as CRM updated

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder C (`feat/gap-stream-c`), merged by the lead. Commit b0370d1d: a HubSpot note, task, task completion or next step is `crm_updated`, never `deal_advanced`; every kind carries a class (preparation, contact, commercial, maintenance, other) and the view groups the counts by it (17 kinds).
- **Change boundary:** work/activity.ts taxonomy and scorecard: note/task/next-step write is CRM updated.
- **Acceptance:** Successful note/task write never increments deal advanced.
- **Depends on:** none.
- **Evidence/test state:** Independent activity review and probes.


#### C38b [P2] Treat recovered CRM writes as successful reconciliation

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder C (`feat/gap-stream-c`), merged by the lead. Commit b0370d1d: a recovered CRM write is an update; off, conflict and failed map apart in words.
- **Change boundary:** work/activity.ts maps recovered/off/conflict/failed separately.
- **Acceptance:** Recovered write creates no failure count; failed remains failed.
- **Depends on:** none.
- **Evidence/test state:** Independent activity review and probes.


#### C38c [P1] Require evidence for commercial advancement

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder C (`feat/gap-stream-c`), merged by the lead. Commit b0370d1d: `deal_advanced` needs an explicit `deal.stage_changed` row or a defined milestone done on one deal id, with basis and deal id; otherwise `obligation_done`.
- **Change boundary:** work/activity.ts milestone projection uses explicit stage transition or defined confirmed commercial milestone, scoped to a deal.
- **Acceptance:** No generic CRM update is advancement; validated milestone is one event with basis and deal ID.
- **Depends on:** none.
- **Evidence/test state:** Independent activity review and probes.


### V7 — Approval, send and reconciliation stay bound

**Demo:** A mock START -> REVISE -> APPROVE -> draft -> app-confirmed send -> receipt flow completes once; stale initial approval refuses before draft creation. Direct Gmail is shown as a separate seller route.


#### C39 [P1] Bind initial APPROVE to the assigned revision

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder C (`feat/gap-stream-c`), merged by the lead. Commit d6871281 (`stream-c-c39-approve-binding.test.ts` 10; `approve-request.test.ts` 4 updated to seed the assignment row; the audit's revision-0 probe converted into a regression): `agents/approve-request.ts`, `execution/seller-draft.ts`: every APPROVE loads the assignment row of THAT revision and takes its immutable snapshot (copy hash, recipient, subject, body, sender), refuses a hash the reply does not carry, a missing row or a snapshot that does not hash to itself, preflights the current copy (pack hash, persona address, GAP sender) before any provider side effect, passes the snapshot into `createSellerGmailDraft` which rechecks it immediately before the Gmail adapter (copy, recipient and sender drift refuse and are ledgered; an existing draft counts only when it is of the snapshot; the race between preflight and creation is closed there), and validates the returned draft hash (a draft of other copy is reported as `draft_mismatch` naming the id, never as the approval). The send stays CONFIRM + SEND in the app.
- **Change boundary:** agents/approve-request.ts: validate revision0 exact content/sender/recipient before calling draft adapter, as well as revised content; validate returned draft hash. Pass the expected revision/hash into the draft service and recheck the pinned content immediately before the provider adapter; a post-creation comparison alone is insufficient.
- **Acceptance:** Assigned A/current B revision0 refuses and draft spy stays zero; unchanged A creates one draft. Recipient-only and sender-only changes refuse. Change source between preflight and creation: refuse before provider side effect or use the exact immutable approved snapshot.
- **Depends on:** none.
- **Evidence/test state:** Independent pure probe reproduced bypass at revision0.


#### C40 [P1] Make direct Gmail and app-send boundaries explicit

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder C (`feat/gap-stream-c`), merged by the lead. Commit 108098f3 (`stream-c-c40-c42-execution.test.ts` 5): the APPROVE answer says sending from Gmail is outside GAP's checks and an edited draft is never recorded as the approved copy; a by-hand send reconciled from Sent (`execution/copies-reconcile.ts`) carries route `gmail_by_hand`, `bodyRead false` and the copied hash apart from the sent message (never as its contentHash; a manual record's matchedOn says body_not_read) and the activity line says the copy as sent was not checked.
- **Change boundary:** UI and handoff: approval creates a draft; app send rechecks gates at action time; Gmail manual editing/sending is outside that app gate and must be reconciled.
- **Acceptance:** No screen claims manual Gmail was app-validated at send; edited Gmail draft is not falsely attributed to approved copy.
- **Depends on:** C39.
- **Evidence/test state:** approve-request.ts:77 offers direct Gmail; seller-send checks present.


#### C41 [P1] Verify provider receipts and uncertain-send recovery

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder C (`feat/gap-stream-c`), merged by the lead. Commit 108098f3: the send preview carries subject and thread so a send whose answer was lost can be attributed; an injected suppression reader runs at confirm time before the claim (suppressed and unreadable refuse, fail closed; the wire adapter's own read is unchanged); a timeout after Gmail accepted the send is reconciled from the eventual Sent readback with no blind retry and no double send; delivered is never claimed from queued.
- **Change boundary:** Focused contract tests on seller-send, copies-reconcile, native sequence adapter; inject timeout after provider acceptance and eventual provider readback.
- **Acceptance:** No retry double-send after uncertain outcome; sender/recipient/thread/body hash attribution survives reconciliation; delivered is not inferred from accepted/sent.
- **Depends on:** C39,C40.
- **Evidence/test state:** Existing send claims present; new end-to-end fault cases required.


#### C42 [P1] Verify sequence enrollment against all execution lanes

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder C (`feat/gap-stream-c`), merged by the lead. Commit 108098f3: the native sequence adapter (`execution/hubspot-sequence-adapter.ts`) reads back after a lost answer (a throw or a 5xx after the request went out) and answers queued with the real id, a definite refusal when the readback proves none, or `hubspot_enroll_outcome_unknown` (`isUncertainEnrollment`) that a caller must never retry blind; queued is never sent or delivered; the enroll lane is proven to refuse a suppression set between approval and confirm, autonomy halted with the native publish flag on, and an active deal. No flag changed; the outreach halt stands.
- **Change boundary:** Reuse cross-plane suppression/autonomy, contact employment, duplicate-contact/active enrollment and immutable copy/version guards for native HubSpot, Gmail and manual recorded sends. Prospective app/native-sequence gate checks are distinct from recording an already-sent manual Gmail event; reconciliation cannot retroactively block that send.
- **Acceptance:** Suppression change between approval and confirm blocks app send/enroll; active deal routes deal work; enabled publish with autonomy halted does not imply executable enrollment.
- **Depends on:** C06,C41.
- **Evidence/test state:** Live publish=true, auto_enroll=false; Clawd outreach=false; existing gates retained.


#### C43 [P1] Test command authenticity, stale links and replay idempotency

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder C (`feat/gap-stream-c`), merged by the lead. Commit 0bc89af0 (`stream-c-c43-c44-commands.test.ts` 17): `replies/commands-apply.ts`, `work/action-token.ts`: one provider message is one command (a second pass over the same Gmail id applies nothing and sends nothing); a forged sender, a missing, failed or unaligned DMARC, an auto-response, a forward and an APPROVE only inside quoted text run nothing; `executionAllowed` says a bare GET (a link preview, a prefetch, a scanner) may never execute start, decide, defer or review (a POST or a confirmed GET may; open is navigation), for the pages to ask before any effect.
- **Change boundary:** Focused commands/commands-apply/action-token integration fixtures: sender identity, trusted auth headers, original thread, quoted commands, duplicate provider IDs and expired day tokens.
- **Acceptance:** Forwarded/forged/auto-response and quoted APPROVE never mutate work; duplicate valid command applies once; a link preview cannot execute a commercial decision.
- **Depends on:** C39.
- **Evidence/test state:** Existing X07 checks; cross-surface adversarial validation required.


#### C44 [P1] Make every visible action end in a recoverable state

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Two halves, merged by the lead at c4b5c9be with no file overlap. Builder A, commit e25b7ddd (`stream-a-c44-actions.test.tsx`): `ui/action-result.ts`, `components/gap/action-status.tsx`: one reading of an action request into accepted, refused, queued, prepared, failed or unknown with the source item, a seller line and the next path; `runAction`/`postAction` never throw; a 4xx is refused with the originals standing and no retry consumed (an unknown handler names the field, a stale revision opens the current one, GAP off and signed out say so), a transient CRM read retries with the same click, a 5xx is failed and retries, a thrown fetch or a 504 is unknown (it may have applied: reload, then try again), never "nothing changed" and never a spinner left on; wired into Pursue, More, Skip, Save, Dismiss and the pursued Done, DONE and NEXT, Done, Snooze, Skip and Restore, resolve a person, qualify a source, set a deal objective, the candidate queue and the seller draft Approve. Builder C, commit 0bc89af0: every email command (START, NEXT, REVISE, APPROVE, SKIP, DEFER, DONE, HELP) answers accepted, refused, queued, prepared, failed or unknown with the source item and the next path; an effect that throws is recorded refused `handler_failed` with the error, never applied, the originals stand, the seller is told and the same command may be sent again; an effect GAP cannot read is unknown and consumes nothing.
- **Change boundary:** START/NEXT/REVISE/APPROVE/SKIP/DEFER/DONE/Pursue/More each reports accepted, refused, queued, prepared, failed or unknown with source item and next path. Preserve originals on failure.
- **Acceptance:** Unknown handler, invalid revision and CRM outage produce actionable result without consuming future retry; no orphaned task disappears after14d.
- **Depends on:** C24,C35,C43.
- **Evidence/test state:** Existing durable ledger; test whole action chain.


### V8 — Integration health describes the actual runtime

**Demo:** Read-only diagnostics distinguish configured credentials, actual source coverage and successful operations. Snapshot and source versions are visible; no flags or budgets are changed by the audit.


#### C45 [P2] Record a single deployment/configuration receipt

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Commit 92a7b984: `scripts/gap/deployment-receipt.ts` (reads only) composes `docs/gap/DEPLOYMENT_RECEIPT.md` through `health/deployment-receipt.ts` (`tests/unit/gap/lead-c45-deployment-receipt.test.ts` 3): local code (commit, branch, origin/main, clean or not), the deployed environment (the deployment the production alias is bound to by the alias API, its commit and ready time, the other recent production deployments, the rule that a deployment runs the environment snapshotted at ITS build), the project settings now (64 production env NAMES with their Vercel type, 17 GAP flags with values only when the value is a flag word, the local vercel.json crons), the baseline pointer (marked HISTORICAL when it names another commit than the deployed one: ed9976e8 vs the live a195467f at generation), and the last health read from a saved capture (`docs/gap/health-capture-2026-10-08.json`; absent means unread, never healthy). No value that is not a flag word can reach the file: every other configuration value seen is redacted by its key (the sender address quoted by the health sender line became "[value of GAP_GMAIL_USER_EMAIL]") and a final guard refuses the write otherwise. Generated 2026-10-09T03:13Z against the live project.
- **Change boundary:** A read-only operator report records repo SHA, deployment ID/alias binding, environment, nonsecret flags, cron settings and last successful source reads; avoid printing keys.
- **Acceptance:** Receipt distinguishes Vercel project settings from deployed environment and local code; stale baseline pointers marked historical.
- **Depends on:** none.
- **Evidence/test state:** Live Vercel alias Ready and env list; deployment API binds dpl_G9KX6ZmwES9f719vk8jsrCcay6r1 to a195467; repeatable runtime receipt still required.


#### C46 [P1] Make health cover contextual completeness

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Commit eb373440 (`tests/unit/gap/lead-c46-context-health.test.ts` 5; `health.test.tsx` extended for the ninth component; the health route answers 9 components): `health/health.ts` adds the Commercial context component and `health/load.ts` reads its sources soft and bounded: the identity tables (canonicalCompany and gapAccountAlias counts), the HubSpot contact association read (the C02 path, a probe address), the GAP sender's Gmail Sent (a seven-day window to the sender's own address), and the vault and Clawd coverage rows from `context/retrieval.ts` (C20) for a canary account (the newest resolved canonical company with a domain, else the newest account by name). DEGRADED when a configured source cannot be read, when identity cannot be read, or when a source's newest knowledge (its watermark, the observation date, never the rebuild time) is older than 60 days although it was rebuilt this week ("the rebuild carried no newer knowledge": the audit's rebuilt-but-old Kenco wedge); an unreadable Sent says who we wrote to is unknown so quiet and answer owed are one-sided; a source that is not configured (the vault on Vercel) is said as partial, never complete; "complete and fresh" is said only when every configured source read whole and fresh. Never BLOCKED: send safety stays with the suppression, sender and HubSpot components; the detail says a prepared angle on this context is labelled partial. The repair words name the owner and that refreshing the source, not the timestamp, is the fix.
- **Change boundary:** Extend existing health/operations with identity, HubSpot associations, Gmail inbox/Sent coverage, vault index and Clawd knowledge watermark; degraded internal generation is labelled, send safety unchanged.
- **Acceptance:** A rebuilt-but-old Kenco wedge or unreadable Sent mailbox cannot report complete commercial context.
- **Depends on:** C20,C45.
- **Evidence/test state:** Live partial knowledge vs available services.


#### C47 [P1] Reconcile ingestion idempotency across Gmail and HubSpot

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder A (`feat/gap-stream-a`), merged by the lead. Commit 7853233b (`stream-a-ingest-idempotency.test.ts` 5; hubspot-poller 54 and gap-mailbox 54 still green): `replies/hubspot-poller.ts` asks HubSpot for `hs_email_message_id` and, when the same RFC Message-ID is already stored through Gmail, links the engagement id onto that row (or records `inbound.provenance_linked` when the row already carries another engagement) instead of a second row, a second bell or a second ingest, with a `read=true` linked_inbound marker so a retry or an overlapping page reads it as existing; `replies/gap-mailbox.ts` storeInbound records the Gmail id as a provenance link on a HubSpot-stored row, once; never a merge by subject; the thread context reads one event with both ids; associations to several deals are kept without double-counting content.
- **Change boundary:** Use provider message IDs/RFC Message-ID plus mailbox and engagement IDs; preserve associations to multiple deals without double counting content.
- **Acceptance:** Same email in Gmail and HubSpot yields one communication event with two provenance links; pagination/retry adds no duplicate dispositions.
- **Depends on:** C07,C08.
- **Evidence/test state:** Multiple ingress paths exist; cross-source duplicate incidence not measured.


#### C48 [P2] Validate source indexing and deletion lifecycle

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder B (`feat/gap-stream-b`), merged by the lead. Commit b18c068e (`stream-b-index-lifecycle.test.ts` 4; retrieval 7 and story-readers 9 unchanged; mutation: the tombstone filter removed turns two tests red): `context/retrieval.ts` takes an optional in-memory cache the caller injects (`createKnowledgeCache()`; no file writes, no table). Every vault file is content-hashed; an unchanged file reuses its chunks without a re-parse; a changed note refreshes only its own chunks (chunk identity = source id + text hash) and a chunk that vanished is tombstoned as superseded or deleted; a note that reads as absent, a Clawd note missing from a newer snapshot and a vanished snapshot are tombstoned with the reason and time, kept in the history and never served again from the cache (the deleted private person note stays out across unchanged reads, offline reads and the history; a restore on disk reads as a fresh file). A source that cannot be read serves the last successful sync with `reachable: false` and "stale: served from the cache, last successful sync <time>" on its coverage row (the C46 health component sees it with no contract change); a sync older than 24 hours is stale; never synced is said. `AccountKnowledge` gains `sync` and `tombstones`; `syncLine` gives the seller words. No caller passes a cache yet, so production behaviour is unchanged until one is held (a process-level cache in story/load.ts is the one-line follow-up, named debt).
- **Change boundary:** Use content hashes and incremental watermarks for vault/Clawd artifacts; deleted or superseded notes tombstoned in retrieval, history retained.
- **Acceptance:** Changing one Kenco note refreshes affected chunks; deleted private note cannot reappear from cache; stale index reports last successful sync.
- **Depends on:** C14,C16.
- **Evidence/test state:** No full production vault index verified.


#### C49 [P1] Make activity-read coverage honest

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder C (`feat/gap-stream-c`), merged by the lead. Commit 87151412 (`stream-c-c49-activity-coverage.test.ts` 5, `activity-view.test.tsx` 3): `loadActivity` pages the window by a (created_at, id) cursor (1,000 a page, 20 pages) and answers complete, partial (the cap stopped it; the newest rows were read and the counts are a floor, said in words) or unavailable (the ledger threw or no client: the error in words, never a zero-activity day); the same provider evidence recorded twice (a Gmail id, a HubSpot record id, a calendar event, a stage move) counts once while distinct ids and self-reported rows never collapse; the accountability view carries the coverage and its empty state says unknown, not zero.
- **Change boundary:** work/activity.ts loadActivity returns complete/partial/unavailable; paginate beyond1,000 and handle duplicate provider evidence.
- **Acceptance:** 1,001 rows show complete counts after paging or explicit partial; thrown read yields unavailable, not a zero-activity day.
- **Depends on:** C36,C37,C38a,C38b,C38c.
- **Evidence/test state:** Independent code review: cap1000 and catch[].


#### C50 [P2] Verify every model path is metered without losing task truth

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Commit f9b149f9 (`tests/unit/gap/lead-c50-spend-concurrency.test.ts` 4): a post-reservation re-read in `gapGenerate` (`committedAt`: every recorded cost plus every open reservation the ledger ordered at or before this one, by created_at then callId) makes the later of two racing reservations yield with `monthly_ceiling`, release its row (a refused row closes it) and make no call, so two workers that both passed the pre-check cannot spend past the ceiling (the race test: one model call, one refusal, month at or under $25, no reservation left open; proven RED with the check removed, then restored); an untyped throw from the model route (a socket reset, a timeout outside the provider chain) is an `outage`, transient, never a permanent configuration fault, so the task and the decision wait for the next attempt; a fallback model is priced at the model that answered and the row says which and that the price is estimated. No cap was raised; A01-A06 unchanged.
- **Change boundary:** Retain A01-A06 model route and budgets. Test reservation/concurrency, fallback price, failed/partial runs, context retrieval cost and per-task reason; no cap increases.
- **Acceptance:** Two competing workers cannot spend beyond intended policy; failed reservation makes no call; model outage preserves decision and work for retry.
- **Depends on:** none.
- **Evidence/test state:** Canon records A06 implemented; current spend concurrency accepted debt.


#### C51 [P1] Audit cross-system authority for CRM stages

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Builder A (`feat/gap-stream-a`), merged by the lead. Commit ef48447d (`stream-a-c51-stage-authority.test.ts` 5; `docs/gap/CRM_STAGE_AUTHORITY.md`): `opportunity/stage-authority.ts`: a deal stage is HubSpot's to answer under a complete read (`dealStage`: known with the read time, none, unknown; `stageWords`); GAP's ledger never moves or reports one; `deal_advanced` has exactly one evidence shape (`stageChangedFromCrm`: two CRM reads of the same deal that moved, basis provider; never from a send, a reply, an obligation or a meeting outcome). Every writer of a HubSpot deal stage is registered with owner, trigger, kind and gate, and the doc carries the enablement as read on 2026-10-08 (modex: four deals.ts writers under HUBSPOT_SYNC_ENABLED default on, the check-inbox link path re-stages engine stubs on a reply; Clawd: hubspot_autopush update_deal_stage via the scheduler and the reply scan are ENABLED because their flags are unset and default true, token present, DRY_RUN unset, runtime effect not established; the sequence-send path is off). The structural test walks `src/lib/gap` for any stage-writer import or dealstage write, holds the registry to deals.ts and the doc, and the sent_t1 fixture (every send, reply, obligation done, meeting outcome and next step written) projects no deal_advanced. No flag changed. The Clawd autopush enablement is an OWNER ITEM for Casey (it writes deal stages outside GAP's gates).
- **Change boundary:** Read Clawd hubspot_autopush and runtime enablement/invocations; retire or isolate touch->stage writes only through separately authorized change.
- **Acceptance:** Fixture sent_t1 never advances commercial stage; any remaining external writer is named with owner and enablement proof.
- **Depends on:** none.
- **Evidence/test state:** Clawd source STAGE_MAP exists; runtime effect not established.


### V9 — Commercial preparation is useful and measurable

**Demo:** Held-out examples cover active deal, cold prospect, historic signal, support, vendor, referral and conflicted knowledge. Quality is judged by grounded usefulness, not merely a parser or voice check.


#### C52 [P1] Assemble the reference evaluation set

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Commit (lead; `tests/unit/gap/lead-c52-reference-set.test.ts` 4): `tests/unit/gap/fixtures/reference-set.ts`, frozen by `reference-set.lock` (`1:149869c91330de44`; a deliberate change bumps REFERENCE_SET_VERSION and the lock together with the reason here): twelve de-identified cases grounded in the audit's shapes (the Kenco positive with the deal, the roadmap thread, the Oct 1 send, the accepted meeting, the July vault note and the August Clawd wedge each with its own date apart from the October 8 rebuild; an ambiguous subsidiary domain; three reports of one event; a 2018 fact; a 2013 fact superseded in 2025; a customer support ask; a vendor pitch; a suspicious notice carrying an instruction; an opt-out; an old unanswered buyer reply; two open deals; a model outage), each with source ids, expected identity, opportunity, purposes, relationship and motion, the phrases an output must say, the claims it must never make with the reason, the sources it must retrieve (C53 recall), the quoted instructions it must never execute, and the missing-source variant with its expected words. Every source is a typed claim the C13 contract accepts, the external-use rule holds over the set, and the pure classifiers (purpose, re-engage eligibility) agree with every case on the first run. Not an approved fact about any real buyer: every claim carries its class.
- **Change boundary:** Create de-identified fixtures grounded in sources: Kenco positive, ambiguous subsidiary, Pepsi repeats, Hormel2018, GeneralMills2013, Lazer support, Riserify vendor, suspicious invite, opt-out, old unanswered reply, two deals, model outage.
- **Acceptance:** Each fixture has source IDs, expected identity/motion, prohibited claims and missing-source cases; frozen before prompt changes.
- **Depends on:** C13.
- **Evidence/test state:** Audit sources + synthetic adverse variants.


#### C53 [P1] Evaluate retrieval before prose quality

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Commit 21449b2a (`tests/unit/gap/lead-c53-retrieval-eval.test.ts` 4; `docs/gap/RETRIEVAL_EVAL.md` generated by `scripts/gap/retrieval-eval.ts`): `src/lib/gap/evaluation/retrieval-eval.ts` turns each reference case into sink adapters for the REAL assembler (`context/assemble.ts` with `context/retrieval.ts` behind it: an identity read, a CRM read that parses the case's deal lines, a Gmail timeline with drafts and calendar typed, a vault note with its `last_refreshed` and dated bullets, a Clawd snapshot with versioned wedge notes, verified public facts) and measures the packet per class with the sample size, never one aggregate: source_recall (every required source reached the packet by id, url, deal id or verbatim text), claim_provenance (a source id and a date on every claim; a refresh time never doubles as the observation date; refusals counted), thread_coverage (every message of the person on the timeline, drafts as drafts, calendar apart, a draft never a buyer fact), conflict_handling (a vault no-deal line never moves opportunity; an older fact keeps its own date), unauthorized_exclusion (no seller note, inference, modeled figure or internal line externally usable), instruction_safety (the adapters saw reads only; the quoted instruction never leaves its claim and is never externally usable), opportunity_status (the CRM's answer under a complete read; unknown when the read is missing). 12 cases, 24 runs (each whole and with one source removed). A known-bad adapter (a seller note promoted to a buyer message) is caught, so a clean class is a measurement. The required Kenco roadmap words, the deal and the accepted meeting are retrieved; the vault no-deal line and the Clawd wedge stay seller context dated by their own day with the October 8 rebuild as indexedAt. FINDINGS on the first run: C53-1 (open, routed to builder B): `buyerClaimsFromTimeline` makes a vendor pitch on the timeline an external `buyer_said` claim (seen as one unauthorized_exclusion and one instruction_safety failure on the vendor case; pinned in the test until the fix lands); C53-2 (fixed): the reference set's two-deals missing-source variant expected unknown where the CRM still holds the other deal under a complete read (open), so the set moved to v2 with the lock (`2:<fingerprint>`), the scope being what the angle must call unknown. Every other class is at zero failures over 24 runs.
- **Finding C53-1: FIXED** by builder B, commit 4850307b (`context/assemble.ts` buyerClaimsFromTimeline: only buyer_conversation, customer_support and an unclassified purpose are buyer_said with buyer authority and external visibility; a vendor solicitation, media, internal mail, a partner referral, a calendar message, an automated notice and a suspicious message are internal_only under the seller's authority, their text kept as data; the newest six buyer messages and eight others are read); the evaluator's pin is back to [] in both classes and `docs/gap/RETRIEVAL_EVAL.md` regenerates at zero failures across all seven classes over 24 runs.
- **Change boundary:** Measure source recall, claim provenance, relevant thread coverage, conflict handling and unauthorized-content exclusion on C52.
- **Acceptance:** Required Kenco roadmap retrieved; private intent never promoted; report per-class failures and sample size rather than one aggregate score. Malicious email/vault instructions to send, change flags or reveal secrets remain quoted source data and trigger no tool action.
- **Depends on:** C52,C21.
- **Evidence/test state:** Design evaluation not yet run.


#### C54 [P1] Evaluate generated commercial usefulness

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Commit 65013f74 (`tests/unit/gap/lead-c54-quality-eval.test.ts` 3; `docs/gap/QUALITY_EVAL.md` generated by `scripts/gap/quality-eval.ts --mocked`): `src/lib/gap/evaluation/quality-eval.ts` runs the REAL handler (`agents/develop-angle.ts`) over the frozen reference set on the C53 packets, each generating case whole and with one source removed, for pursue, more and explore: 6 cases x 2 x 3 = 36 held-out outputs, scored per check with the sample size, never one aggregate (produced; motion and person including the deal the work is scoped to; the known answer said; no prohibited claim; no authority leak, by six-word spans from any seller, inference, internal or modeled source; supported claims per C22; a specific next step that fits the motion with two open questions; a disconfirming starter; house voice). The run records the packet revision and the prompt hash of every output, the models that answered and the cost from the spend ledger. HARNESS CHECK ONLY so far: the scripted generator (`tests/unit/gap/fixtures/mocked-angle-generator.ts`) proves the harness end to end and the report is labelled MOCKED, NOT a live model evaluation and no quality claim; the live run (`--live`, the metered route, in-memory ledger, cost reported) needs AI_GATEWAY_API_KEY in the environment and Casey's go, and the seller review of usefulness is recorded apart. A deliberately bad answer (a prohibited claim, a leaked seller note, a pitch, no disconfirming question, no support) is caught on four checks. FINDING C54-1 (open, routed to builder B): `sourceLineFor`/`dayText` in `agents/develop-angle.ts` render a date-only publication (midnight UTC, an EDGAR filing day) as the prior New York day ("published Oct 2, 2026" for an October 3 filing), the C29 fault at a second surface; pinned in the test (three failures on the pepsi case) until the fix lands with `isDateOnly` from `work/intel.ts`.
- **Finding C54-1: FIXED** by builder B, commit e5af3827 (`agents/develop-angle.ts` sourceLineFor and dayText through the shared `work/intel.ts` isDateOnly; `angle-claims.ts` dayText takes the same rule); the harness pin is back to [] with no_prohibited_claim 36 | 0 (develop-angle.test.ts +2: an October 3 filing day says Oct 3, an 02:30Z instant says Oct 2).
- **Change boundary:** Held-out at least30 generated outputs: correct motion/person, acknowledges known answer, specific next step, disconfirming question, no invented pain, concise house voice. Version prompt/model/context.
- **Acceptance:** Zero critical unsupported buyer claims or authority leaks in release set; seller reviews usefulness; cost reported. Do not claim live model evaluation from mocked tests.
- **Depends on:** C52,C53.
- **Evidence/test state:** Prior quality debt; no 30-output assessment executed.


#### C55 [P2] Close the loop from real outcomes to recommendations

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Commit c1e9f33d (lead; `tests/unit/gap/lead-c55-outcome-loop.test.ts` 3; routing-rules, now-projection and decision-card green): `learning/outcome-loop.ts` (new, pure) turns the outcomes the existing layers already record into attributed, cited evidence: a human-confirmed disposition's quote is `buyer_said` with buyer authority cited by `disposition:<id>` (an unconfirmed row is nothing, as `disposition/model.ts` NO_EFFECTS says); a rejected hypothesis marks its family at the account from the resolution date with its citations, and `guardFacts` supersedes any later claim that restates it (a vault wedge, a thesis seed; the same idea by `context/same-idea.ts`) so `externallyUsable` drops it while the words stay visible with the rejection and its citations; a seller edit, correction or done note is `seller_noted` with seller authority and never buyer evidence; a meeting outcome is `seller_noted` with its basis and moves no stage; a not-now with a return date and a referral become advice attributed to the buyer; a win or loss carries the reason given. `upliftLine` never implies a cause: under the reliable n (`learning/metrics.ts`) it is an early observation, above it observed-not-causal with a control still needed. Routing's why-now (`routing/explain.ts`) now cites the disposition row (`RoutingLastDisposition.id`, read by `routing/inputs.ts`) and says the return date or the referral in words. The angle prompt already excludes rejected theses (`develop-angle.ts` loads active, approved and review_required only); the packet-side guard is this module's, consumed by the replay (C56) and offered to the assembler as a commitments-side read.
- **Change boundary:** Reuse BID/disposition/learning: seller correction, buyer objection, not-now, referral, meeting and loss/win feedback inform future routing with cited evidence and explicit attribution.
- **Acceptance:** Hypothesis rejected does not recur as fact; a seller edit is not buyer evidence; small samples do not imply causal uplift.
- **Depends on:** C12,C22,C36,C37,C38a,C38b,C38c.
- **Evidence/test state:** Existing learning layer, regression/coverage extension.


### V10 — Demonstrate and hand off without dropping the plan

**Demo:** Replay the full October 8 case in a safe local/sink environment, then hand Claude one canonical ledger with evidence, explicit residuals and no implied production authorization.


#### C56 [P1] Build one replay of the actual October8 brief

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). Commit 86a0869c (lead; `tests/unit/gap/lead-c56-replay.test.ts` 1; `docs/gap/REPLAY_OCTOBER8.md` generated by `scripts/gap/replay-october8.ts`): `src/lib/gap/evaluation/replay-october8.ts` runs the REAL orchestration over a sink-backed world shaped like the measured October 8 day (the ledger's record above: nine stalled deal cards, a held follow-up at the deal account, two reminder-and-follow-up pairs of one origin, a ready first touch, an opted-out line, two replies; one Kestrel relationship across email, CRM and Work; the starved intelligence with a date-only filing, three reports of one event, a 2018 fact, a vendor pitch, a support ask, a suspicious notice, an unknown-purpose writer), de-identified to the reference set's names: `planDay` over the Work day, `defaultIntel` with the in-deals read, the identity and a Sent sink, `renderBriefing` on both paths (text and HTML), Pursue on the quiet person through `applyDecision` with the provenance on the task, the angle through the real handler on the C53 packet (scripted generator), a second Pursue keeping it (C23), `promoteAngle` into a Gmail draft sink twice (one draft, nothing sent), a seller correction on one conversation (C12), and `loadAccountability`. Every ticket C01-C44 receives an explicit disposition: 33 demonstrated with their evidence in words, 11 covered by a named focused test (C28, C35, C37, C38a, C38b, C39, C40, C41, C42, C43, C44), 2 documented (C19, C26), 0 exceptions. Signed action tokens are redacted from the receipt; no production database, no mail credential, no model, no quality claim. The before (the measured October 8 briefing) and the after (the replayed day's text) sit side by side in the receipt.
- **Change boundary:** Safe fixtures/sink adapters; invoke real orchestration and both renderer paths, not isolated invented outputs. Include observed snapshot IDs but remove signed action tokens.
- **Acceptance:** All supplied email sections reconcile; C01-C44 behaviors demonstrated, exceptions recorded, no production DB or mail credentials available. Record an explicit acceptance disposition for every C01-C44 ID; no silent exception.
- **Depends on:** C01,C02,C03,C04,C05,C06,C07,C08,C09,C10,C11,C12,C13,C14,C15,C16,C17,C18,C19,C20,C21,C22,C23,C24,C25,C26,C27,C28,C29,C30,C31,C32,C33,C34,C35,C36,C37,C38a,C38b,C38c,C39,C40,C41,C42,C43,C44.
- **Evidence/test state:** Current audit probes are not this end-to-end demo.


#### C57 [P1] Run independent adversarial review after each vertical slice

- **Status:** SHIPPED on `feat/gap-execution-engine` as a standing gate: two passes delivered (17 and 9 findings) and every finding dispositioned in `docs/gap/C57_REVIEW.md` (FIXED with its commit, ACCEPTED with its reason, or DEFERRED as named debt); the reviewers were separate agents in disposable read-only worktrees, every edit made by the owning writer and verified by it. A third pass is owed after any further change before a release. History: Pass 1: an independent reviewer (a separate agent, read-only, in the disposable worktree `wt-gap-review` at 9edf2edd, the first three merges) over V1-V8 as merged then; its report is awaited (it ran, went idle, and was asked to resend; nothing was integrated from it). Pass 2: a second reviewer in `wt-gap-review-2` at a97d7480 over the final integrated tree, the slices merged since (C21-C26, C31-C33, C40-C44, C47, C49, C51, C55, C46) and the evaluators and the replay (whether a demonstrated disposition exercises the production path or a fixture, whether the harness can pass while the real path is wrong). Each finding receives fixed / accepted / deferred with its ticket in `docs/gap/C57_REVIEW.md`, aggregated into the C59 receipt; the writer verifies every proposed edit before it lands (one writer per file: the owning builder or the lead).
- **Change boundary:** Separate reviewer, read-only source or disposable exclusive mutation workspace. Review evidence joins and product behavior, not just test count. This is a standing gate on each slice; aggregate the per-slice receipts at C56, rather than waiting for C56 to start review.
- **Acceptance:** Reviewer checks negative controls; writer verifies proposed edits; findings receive fixed/accepted/deferred disposition and linked ticket.
- **Depends on:** none.
- **Evidence/test state:** Initial independent review executed; implementation review remains.


#### C58 [P1] Reconcile all old ledger families and known debt

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432). The reconciliation below ("C58 reconciliation") gives every prior family and every named owner decision a disposition with code, tests, deployed and accepted kept apart, and names the owner and the reason for each deferred item. The completion matrix above keeps its rows; its "DONE" means code merged, focused tests green and deployed to production, never seller acceptance, which the matrix never claimed and C58 says in words. R43 and R61 debt have explicit dispositions. No family is marked DONE as a whole.
- **Change boundary:** Retain R00-R65, UX01-17, X01-X21, I01-I06, A01-A06 history. Add code/test/deployed/accepted distinctions, owners and reasons for deferred work; no mass DONE claims.
- **Acceptance:** Every prior family and named owner decision has a disposition; no follow-on prompt abandons remaining tickets.
- **Depends on:** C45,C56.
- **Evidence/test state:** Current completion matrix overstates acceptance.


#### C59 [P1] Publish the next-version demonstration receipt locally

- **Status:** SHIPPED (in production since 2026-10-09 at fd4091bc, PR #432), the reviewer section pending the C57 report. Commit a97d7480: `scripts/gap/demonstration-receipt.ts` writes `docs/gap/DEMONSTRATION_RECEIPT.md` from artifacts another developer reproduces locally (the three evaluation scripts, then this one): the before and after rendered briefing and the source manifest and dispositions from the C56 replay, the 34 focused suites with their case counts, the mocked and live boundaries said apart (the model, Gmail, HubSpot, the vault, Clawd and the ledger mocked; the deployment receipt read-only live; the live model evaluation and the production seller round trip not run), the retrieval and quality measurements, the reviewer findings section (filled from `docs/gap/C57_REVIEW.md` when the report is on file, each finding with its fixed / accepted / deferred disposition and ticket), the residuals and the owner items, the rollback plan (nothing deployed; production stays at a195467f; after a merge, the previous deployment named in the baseline), the commits on the branch since production; the writer refuses any text shaped like a secret, a key, a connection string or a signed action token.
- **Change boundary:** Include before/after rendered email, source manifest, targeted tests, mocked/live boundaries, reviewer findings, residuals and rollback plan. No live sends needed.
- **Acceptance:** Another developer reproduces fixture replay; linked canonical tickets resolve; no credentials, signed actions or raw private mail in shareable report.
- **Depends on:** C54,C56,C57,C58.
- **Evidence/test state:** Audit deliverables prepared; implementation demo pending.


#### C60 [P2] Exercise owner-controlled production acceptance separately

- **Status:** CASEY'S, STARTED 2026-10-09 and never simulated: on Casey's go ("start the acceptance test") the morning briefing was resent on the released code (`GET /api/cron/gap-briefing/?resend=1`, X22) after production reached fd4091bc: HTTP 200, 19 items, Gmail thread 1a12081614cc3dd5 to Casey's address at 11:52Z; the START / REVISE / APPROVE reply is his. The rule as written: after a release Casey authorizes (the merge and deploy of `feat/gap-execution-engine`, the C58 owner table) and an explicit authorization in that session: the real START / REVISE / APPROVE on the production briefing thread, the mail listing, the command ingest, the revised assignment and one editable Gmail draft verified with provider receipts; any send separately authorized and sink-addressed; external buyer sends and flag changes stay outside. The fresh briefing already sent on the prospecting-first composition (thread 1a11e5845f5964a2) is the acceptance test for X01-X22 today; the C program's acceptance waits for its release.
- **Change boundary:** After code release and explicit authorization in that future session: seller uses real START/REVISE/APPROVE; any send is separately authorized and sink-addressed. Never simulate Casey’s authenticated reply.
- **Acceptance:** Mail listing, command ingest, revised assignment and one editable draft verified with provider receipts; external buyer sends and flag changes remain outside this audit.
- **Depends on:** C59.
- **Evidence/test state:** Canon records real-Gmail harness but production mailbox listing and seller acceptance incomplete.


### Prior-plan reconciliation and residual ownership

| Prior plan | Keep / correction / acceptance |
|---|---|
| R00-R65 execution recovery | Preserve shipped source and historical receipts. Reopen only demonstrated semantics through C35-C38/C49. Prior R43/R61 quality/performance debt must have explicit disposition; do not silently erase because family says DONE. |
| UX01-UX17 | Preserve account-first story, proposal approvals and existing send controls. C13-C24 extend context into the newer prospecting path. |
| X01-X21 | Day builder, plan, briefing, commands, draft approval, activity and legacy-digest retirement exist. C01/C27-C44 correct integration/semantic gaps; production seller round trip remains unaccepted. |
| I01-I05 | Intelligence surface, decisions, angles and briefing shipped. Kenco and noise classification prove the completion label is not acceptance. C01-C34 address the delta. |
| I06a-I06g | Age-as-gate fixes already recorded as complete. Do not build I06 again. Retain dated historic facts and tests; C29/C34 correct display and coverage without age-based suppression. |
| A01-A06 | Model recovery and cost-metering changes recorded as shipped. C50 verifies current coverage/concurrency; do not reopen a generic funded-key hunt or increase budgets. |
| Earlier audit X14 copy/recap concern | X14a/b/c now implemented; reviewer finds different draft-only accountability defect, C36. Do not claim original copy-as-sent implementation is still absent. |
| Person account by domain | Previously named debt is now C02/C03/C05/C06, supported by live Kenco associations. |
| Non-GAP model routes and Clawd model fallback | Separate named debt, not fixed by enabling broad fallback or sharing private GAP prompts. Inventory remains; no model changes in this audit. |
| Top100/PIC/war-room | Preserve existing lane, evidence contracts, claims and import history. C42/C47/C51 check cross-lane activity and authority; do not revive abandoned GTM-YardFlow. |
| Owner commercial judgments | Pepsi thesis approval, 5% wording and transcription spend remain Casey decisions. A code change does not approve them. |
| Infrastructure/acceptance | No GitHub Actions work requested; no production mailbox command/send test in this audit. C45/C60 own missing proof, not a false completed checkbox. |

### C58 reconciliation: every family and owner decision, with code, tests, deployed and accepted apart
<!-- verified:2026-10-09 -->

Vocabulary: **code** = merged on the branch named; **tests** = the focused suites green on that tree (never the full suite); **deployed** = READY on the production alias (the C45 receipt binds the alias to a commit); **accepted** = Casey exercised it on production with a real reply, click or outcome. A row says all four apart; none is implied by another.

| Family | Code | Tests | Deployed | Accepted | Deferred or owner items, with the owner and the reason |
|---|---|---|---|---|---|
| R00-R65 execution recovery | main 542a6b4d (PR #410) and the fixes through PR #412 | the R-series suites, green at release | yes, since 2026-10-08 | partially: Casey used Work and the cockpit; the production seller round trip (an email command on an assignment) is not yet exercised | R43 touch 2 and later: PARTIAL, owner copy (every seeded approach family is single-touch; a step-1 copy family must be written and seeded before a prepared follow-up exists; the plan says follow up by hand). R61 speed targets: PARTIAL, owner engineering (measured on the production build, p50/p90/p95 recorded; the full account read and the cockpit read behind cachedRead remain the slow paths; not reopened by this audit). R55 legacy-name closure: FIXED (e2da206e). |
| UX-01 to UX-17 account-first UX | main through PR #409 | the UX suites | yes, since 2026-10-06 | partially (dogfood); transcription OFF pending spend approval | transcription spend: OWNER Casey (a paid feature; off until approved). |
| X01-X22 sales execution engine | main through a195467f (X22, PR #431) | the X suites; briefing-send 7 incl. the X22 resend | yes (dpl_G9KX6ZmwES9f719vk8jsrCcay6r1) | NOT accepted: the START / REVISE / APPROVE round trip on the fresh briefing (thread 1a11e5845f5964a2) is Casey's reply and was never simulated | X19 (the legacy digest retirement) shipped; the production seller reply is the acceptance test (section 7 of the mandate), OWNER Casey. |
| I01-I05 prospecting first | main f374ec3f (PR #420) and after | the I suites | yes | partially: three Pursues applied on production by the lead after each deploy; no seller decision cycle yet | the Kenco "No account yet" defect the audit found is corrected by C01-C06 on the lead branch (not deployed). |
| I06a-I06g currentness as a label | main through PR #428 | currentness, render, routing suites | yes | n/a (a display and routing rule) | C29/C34 corrected the display and the coverage on the lead branch without any age gate (I06 not rebuilt). |
| A01-A06 AI recovery and cost control | main through PR #429 | ai-spend 11 and the harness | yes | n/a; the $25 monthly AI Gateway TEAM budget is set (alerts at 50/75/100%) | C50 adds the race guard and the outage class on the lead branch; no cap raised; the C54 LIVE run (a few dollars at most, metered) needs Casey's go. |
| C01-C60 commercial context and execution audit | main fd4091bc (PR #432, ten merges of three builder streams; the client-chunk build fix b76dc1d5 after the first PR build failed) | every ticket's focused suite named in its Status line; the final gate 426 tests, 0 failed; `tsc --noEmit` clean on src and tests | yes (dpl_91j7Tf4qZPjJqqbBo7AMWCX6eVNU READY 2026-10-09T11:51:11Z) | NO: the C60 round trip is Casey's reply on the production briefing thread, never simulated | C57 review 2 after the last merge (lead); C59 the demonstration receipt (lead); C60 the owner-controlled production acceptance (Casey, after a release he authorizes). |

Named owner decisions (unchanged by any code in this program; a code change approves nothing):

| Decision | Owner | State | What it gates |
|---|---|---|---|
| PepsiCo thesis approval | Casey | open | the PepsiCo first touch (the only ready item on October 8) |
| The "5%" measured-capacity wording | Casey | open | copy that cites the Primo number |
| Transcription spend | Casey | open (OFF) | UX call transcription |
| The production seller reply (START, REVISE, APPROVE on the real briefing thread) | Casey | open; never simulated | acceptance of X01-X22 and, after a release, C60 |
| Merge and deploy of `feat/gap-execution-engine` | Casey | DONE 2026-10-09 (Casey: "open a PR to main and start the acceptance test, merge and deploy when ready"; PR #432 merged as fd4091bc, production dpl_91j7Tf4qZPjJqqbBo7AMWCX6eVNU READY 2026-10-09T11:51:11Z) | every C ticket in production; the rollback is a195467f `dpl_G9KX6ZmwES9f719vk8jsrCcay6r1` |
| The C54 live model evaluation (metered, a few dollars at most) | Casey | open | a quality claim about generated angles (today's receipt is a mocked harness check, no claim) |
| Clawd `hubspot_autopush update_deal_stage` enabled by default outside GAP's gates (found by C51) | Casey | open | deal stages written by a system GAP does not gate; no flag changed here |
| GitHub Actions runner work | Casey | declined for now (the mandate) | CI on the repository |
| The outreach halt | Casey | in force | any external send; nothing in this program sends |

Debt named and left as debt (incidental to this program, recorded, not rewritten): non-GAP model routes and the Clawd model fallback (a separate inventory; no fallback enabled); the vault is not readable on Vercel (C46 says partial, never complete); the Work page does not read Gmail Sent (the briefing does; the page line says so); `tests/unit/gap/stream-*` names carry the stream, not the ticket, by design (one suite per slice).

### Codex-to-Claude execution handoff

Read CLAUDE.md, STABLE_BASELINE.md and this addendum in the existing canonical file. Rebase onto the current main and verify this audit's source paths before editing. Begin with V1 and its failing Kenco fixture, then V2 and V3 so V4 receives actual commercial context. C39 is independently actionable as an approval-correctness fix. Retain all remaining slices in this file; completing V1 does not abandon V2-V10. Do not equate a stronger model, a passed parser or a recreated email with end-to-end completion.

For each ticket record changed files, code revision, exact focused tests and counts, before/after fixture behavior, mutation result, review disposition and residuals. Report code implemented, tests passed, deployed and seller accepted separately. Never mark an entire family DONE while required acceptance is missing. Update this single ledger in the same commit as the change. Existing historical receipts stay historical.

This handoff is a work specification for a future implementation session, not authorization here to push, deploy, send, enroll, buy credits, alter production settings or write CRM records. Keep demonstrations local/sink-backed until authorized otherwise. Casey controls priorities and time management; do not invent dates or estimates. End every slice with a demoable result and the exact next unresolved ticket, carrying forward every remaining obligation.

### Implementation log (2026-10-09, the coordinated implementation session)

Casey's execution clarifications (2026-10-08/09, verbatim in spirit): build the 62-ticket plan as the implementation backlog, keep working without stopping for approval after every ticket or slice, no mutation test, independent review or polished demo per ticket, no repeated full suite, defer comprehensive replay, generated-quality evaluation, consolidated independent review and seller acceptance until the implementation is integrated; one lead and up to three builders in separate worktrees with explicit file ownership, one writer per file, small working changes integrated continuously, never two heavy test runs or builds at once; ask Casey only for a material product decision, missing access or an action requiring new authorization. External sends, CRM and production mutations, flag changes, enrollments, purchases, deployment and pushes stay unauthorized in this session; the outreach halt stays until Casey changes it.

Team: the lead on `feat/gap-execution-engine` (worktree `wt-gap-account-first-ux`: dependency management, the C13 contract, integration, this ledger; implements V1, C13, C29, C30, C34, C45, C50, C46 after C20 and C45, and V9/V10 at the end). Builder A on `feat/gap-stream-a` (`wt-gap-stream-a`: C07, C08, C09, C10, C11, C12, C35, C47; owns `context/thread-context.ts`, `context/purpose.ts`, `context/obligations.ts`). Builder B on `feat/gap-stream-b` (`wt-gap-stream-b`: C14-C23, C25, C26, C24 after C39; owns `context/retrieval.ts`, `context/claims.ts`, `agents/develop-angle.ts`, `agents/prompt-context.ts`). Builder C on `feat/gap-stream-c` (`wt-gap-stream-c`: C39, C36-C38c, C49, C27, C28, C31-C33, C40-C44, C51; owns `agents/approve-request.ts`, `execution/seller-draft.ts`, `work/activity*.ts`, `work/briefing.ts`, `work/obligations*.ts`). Each builder commits on its branch with focused tests, never pushes; the lead merges each slice into the lead branch and runs the slice's focused tests only. `node_modules` is a junction into the lead's worktree; one test or build runs at a time across the four worktrees.

Receipts so far (each ticket's Status line above carries the commit and the tests): lead V1 C01-C06 b21b8230; C13 45a335bb; C29/C30/C34 69909205; C50 f9b149f9; C45 92a7b984; C09/C10/C11 wiring c06d5c1a; C52 (the frozen reference set); X22 65ceae9d (in production at a195467f). Builder A merged: C07/C08 38377c26, C09/C11 d112df10, C12 793c9666, C10 e85e4bc3, C35 fca6151e. Builder B merged: C14/C15/C16 a7a7d340, C17/C18/C20 d2889e6b. Builder C merged: C39 d6871281, C36-C38c b0370d1d, C49 87151412, C27/C28 3008563b. Focused tests on the merged tree: 60 across the first merge, 28 across the second, all green; `tsc --noEmit` clean on the GAP surfaces but for a typing gap in builder A's thread-context test fixture (reported to A). Third merge (9edf2edd): A C47 7853233b; B C21/C22 46b092ff, C23 20ff7a5b; C C31-C33 37ad37c5; lead C46 eb373440; 81 focused tests green across the touched surfaces, tsc clean. Fourth merge (e047b318): A C51 ef48447d; B C24 4272635b, C25/C26 021ff718; C C40-C42 108098f3; lead C52 (the reference set), C53 21449b2a, C54 65013f74. Ninth and tenth merges (343c4b35, cfe10c4c; the builders' last commits before their session ended): B P2-7 b30b6d29, the meeting line e66d18ac, P2-8 6add943c; C the reply-side drafts read 276d954d and the sender-side read 997cee66; the lead the writer wiring and the C55 replay assertion ccd779b2, the P2-1 route wiring 4a90a0fa, the F14 refinement and the suite hygiene. FINAL GATE at 0d4d1352: every program suite plus the pre-existing GAP suites the changes touch (develop-angle, briefing, briefing-send, intel, decide, approve-request, seller-draft, reply-answer, health, health-route, ai-spend, routing-rules, commands-apply, intel-panel) run serially in one worker: 426 tests, 0 failed; `tsc --noEmit` clean on src and tests (the only noise is the stale `.next` validator for the deleted daily-digest route, a build artifact that regenerates). Every C57 finding of both passes is now FIXED, ACCEPTED with its reason or DEFERRED as named debt; nothing is routed any more. RELEASE 2026-10-09 (Casey: "open a PR to main and start the acceptance test, merge and deploy when ready"): PR #432 opened at 36461259 (the branch merged with origin/main); its first Vercel build FAILED (Turbopack: `intel-panel.tsx`, a client component, imported the value `TRUTH_TEXT` from `work/intel.ts`, which this program grew into a server module reaching Gmail, DNS and node:crypto; the local webpack build failed the same way); fixed at b76dc1d5 (`work/truth-text.ts`, client-safe, re-exported by intel.ts; intel-panel 3 and intel 7 green, tsc clean), preview `dpl_gthg2qDtiVWDJshwpUN3kchBc5pT` READY; merged as fd4091bc; production `dpl_91j7Tf4qZPjJqqbBo7AMWCX6eVNU` READY 2026-10-09T11:51:11Z and bound to the alias (the C45 receipt regenerated against it). Live after the deploy: `/gap/` redirects to login, `/api/gap/health/` and the briefing cron answer 401 without the secret. NAMED DEBT (pre-existing, not this program's): the local `npm run build` (webpack mode) fails its type-check step on `.next/types` because `src/app/api/cron/gap-agent-tasks/route.ts` exports the non-route constant `AGENT_TASKS_PER_RUN` (X08, 718ffefc); Vercel's build has passed with it since X08 and passed again here, so the local build is not a release gate until that export moves out of the route file. Eighth merge (dedbdc75, the C57 fixes): A F2 cbbfc523 corrected at 34ce68f5 + f7e9ace3, F16 and the check-inbox link 2ba738e2, the GET-page gate 5b41a12b, the drafts reader 7dabebff; B F4 23bfc478, F9 093aefcd, F10/F11 23e6dafb, P2-3 052c901e, P2-1 service half f4bf2d66; C the multi-deal briefing line 413ed9ff; lead the C06 scope af8b9f2b, the evaluator rework f8109d2c (reference set v3). Integrated gate at dedbdc75: 42 program suites, 231 tests green in one worker; tsc clean. Seventh merge: B C48 b18c068e; C the C57 F15 fix and the C41 residual 82c1e489; lead the C57 pass-1 fixes 27fbfa47 (`docs/gap/C57_REVIEW.md`). Sixth merge: B C53-1 fix 4850307b, C24+C25 with the route and the control dd768387, C54-1 fix e5af3827; lead C56 86a0869c. Fifth merge (c4b5c9be): A C44 e25b7ddd; C C43/C44 0bc89af0; lead C55 c1e9f33d. Every builder ticket in V1-V8 is merged but B's two fixes (C53-1 in assemble.ts, C54-1 in develop-angle.ts, both in progress in B's worktree). Still open for the lead: C56 (the October 8 replay), C57 (review 1 running read-only in `wt-gap-review` at 9edf2edd; a second pass follows the last merge), C58, C59, C60 (Casey's). OWNER ITEM surfaced by C51: Clawd's hubspot_autopush update_deal_stage is enabled by default outside GAP's gates (Casey decides; no flag changed here).

Integrated gate at 8b21fd6b (after the sixth merge): every program suite run serially in one worker (34 files: the lead-*, stream-*, v1-kenco and commercial-context suites), 176 tests green; `tsc --noEmit` clean on the GAP surfaces; eslint clean on the lead-owned files; the three evaluation receipts and the demonstration receipt regenerated at zero failures and zero exceptions. Not run on purpose: the full repository suite (the cadence rule), the live model evaluation (Casey's go), anything against production.

Traps met and closed this session: the ledger fixture ignored `skip`, so a paged read looped until the heap died (the fixture honors `skip` now; the reader bounds the loop); the intel fixture's shared placeholder title clustered every signal into one under C30 (distinct titles per fixture signal); a bash heredoc with quotes and backticks fails on this box (patches are written as files and run with `python -I`).

## GAP OS SELLER ACCEPTANCE FOLLOW-UP — October 9, 2026 New York

**Status words, kept apart:** IMPLEMENTED (code on the branch, focused suites green), DEPLOYED (on `modex-gtm.vercel.app`), SELLER-ACCEPTED (Casey's own round trip passed). As of this section's last stamp: IMPLEMENTED; DEPLOYED (Casey, 2026-10-09: "continue, merge and deploy 434": PR #434 merged as 6c87d497, production `dpl_5GuaGMKtmVDPoTwKjNfqZjL9huM7` READY 2026-10-09T14:25:08Z, the alias bound; `/gap/` redirects to login and the APIs answer 401 without the secret); NOT ACCEPTED (the acceptance is Casey's reply, never marked on his behalf). After the deploy, on Casey's go: the October 9 reconcile APPLIED (two append-only rows at 2026-10-09: the Southern Glazer's reminder returned to its pre-DONE state and the note recorded as progress); Kenco Logistics Services MERGED into Kenco (`scripts/gap/merge-account.ts`, dry run then `--apply`: 74 rows re-pointed across 13 models, the canonical link and 21 open conflicts dropped, the account row deleted, the alias "Kenco Logistics Services" created through confirmAlias with the evidence, the canonical records re-synced: kencogroup.com now verified to Kenco, 0 open conflicts, the link resolved, Dave Kiesling and Craig Morrison placed by domain; one `account.merged` ledger row); the resend KEEPS refreshing the plan by default (the lead's call on Casey's "your call": an operator who asks for the briefing again wants the current plan, and the scheduled tick never refreshes); the refreshed briefing went out on the deployed code (revision 1, 14 items, Gmail thread 1a1210fc8fc58b7e, 2026-10-09T14:27:25Z). The START / NEXT / DONE / APPROVE round trip on that thread is the acceptance test, Casey's. <!-- verified:2026-10-09 -->

**Casey's verdict (2026-10-09, after the first START on the released C01-C60 code):** the release shipped, the real START did not pass seller acceptance. Observed: the 7:51 resend replayed the 7:05 plan; START delivered Southern Glazer's / Diego Fonseca first on a May 20 automatic reply and a May 26 return date, said "Back today", acknowledged no supported angle and told him to research catalysts; the briefing duplicated that follow-up and showed Kenco's prepared angle as "No account yet". The outcome he needs: GAP uses the intelligence it holds to prepare and prioritize the most commercially useful work; his attention goes to judgment, relationships and execution, not routine research the agent can perform. No broad audit, no large backlog; fix the actual workflow.

### The trace (production ledger, read only)

| Step | Row | What it says |
|---|---|---|
| Plan | `work.day_planned` 2026-10-09, 11:05:41Z, cron, 19 items | Ranks 0 to 3: the Southern Glazer's pair and the Swire pair, each an out-of-office reminder (kind reminder, source reply, basis "Out of office: ... returning on 05/26") and the same obligation again as the account card's own item ("Reminder: Follow up with ..."); PepsiCo's prepared first touch at 4; the open deals from 5; Coca-Cola's review at 15. Built on a195467f (before the C release). |
| Briefing | `briefing.sent` 11:05:44Z, then `resend: true` 11:51:52Z (thread 1a12081614cc3dd5) | The resend reused the stored plan (first claim of a day wins) and said so: "This replays the plan GAP made at 7:05". |
| START | `mailbox.command` 12:20:50Z, `work.day_started` 12:20:51Z, `work.assignment_sent` 12:20:59Z | Item 1 = commitment:reply:ooo:diego.fonseca@sgws.com:2026-05-26; `prepared: { kind: 'none' }`; the move came from the pursuit's research state ("find the operator / no grounded angle"). |
| Research after the fact | `research.completed` 12:23:58Z and 12:29:15Z | insufficient_evidence, 0 facts, 9 and 7 rejected; `entity.scouted` DIRECT_BUYER distributor. The agent did research, but after the assignment and without changing it. |
| DONE | `mailbox.command` 12:30:49Z, `account.commitment` status done, `work.command_applied` effect commitment_done, basis self_reported | Note "researching catalysts" plus the signature; the reminder was closed and the activity view read "Done: Follow up with Diego Fonseca when they are back". |
| Kenco | `prospect.decision` person:dave.kiesling@kencogroup.com x5 (23:03Z to 00:32Z), `agent.task_queued` x5, one `agent.task_succeeded` 00:32Z | Every row carries accountName null. Production data: kencogroup.com is claimed by two accounts, Kenco (the open deal) and Kenco Logistics Services (parent_brand Kenco), through canonical links in status conflict and three open duplicate_company conflicts since 2026-05-05, so the identity rules keep the person ambiguous and the surfaces said "No account yet". |

### The causes, apart

1. **Ranking by tier, then by the oldest due date.** `work/list.ts` ordered the executable day by TIER_RANK (follow_up above ready and the deals) and then by dueMs ascending, so a reminder with a May due date won. Evidence (a buyer wrote, an open deal, something prepared, a prior reply) was not in the sort.
2. **An expired out-of-office reminder treated as a due buyer obligation.** The reminder a notice creates (`commitments.ts`) became a due follow-up the day after its return date and stayed one for months; the C28 wording fix ("Returned on May 26; overdue since then") had not reached the stored plan and would still have called it due.
3. **The same obligation twice.** `plan.ts itemsForDay` pushed the account card's own item after its obligations when their tiers matched; a card built from its top obligation alone has no own move.
4. **A stale stored plan on resend.** First claim of a day wins; the explicit resend replayed it without a revision.
5. **Routine research assigned to the seller.** An item with nothing prepared and a research-shaped move was assigned by START instead of held for the agent; the agent's own research ran afterwards and changed nothing.
6. **A progress note recorded as completion.** DONE closed the obligation on any note; the activity view read a closed follow-up.
7. **Ambiguity said as absence.** A person whose domain two accounts claim is ambiguous by C02; the pursued item and the briefing said "No account yet", hiding the decision (merge or alias the duplicate) that only Casey can make.
8. **Coverage not said on the assignment.** "What we know" came from the Ask context without saying what was not read (Gmail Sent, drafts, the vault, Clawd).

### The fixes (atomic, one writer per file; the builders' commits are on their branches, merged by the lead)

| Cause | Fix | Where | Commit | Pinned by |
|---|---|---|---|---|
| 1 ranking by tier then oldest due date | After the buyer obligations (commitment, reply, meeting, in their order), the executable work ranks by an explicit evidence tuple: an answer owed; deal context (a next step or a stalled date); something prepared (a first touch, or an angle GAP prepared for a person at the account); a prior reply from them; the seller's priority; deal hygiene alone; a proposal to review; a cold follow-up with no reply ever. `rankWhy` says which evidence placed the card ("Ranked here: open deal, close date passed; an angle prepared for Craig Morrison"). I04 kept: a hygiene-only stalled deal still ranks after a prepared first touch. | `work/list.ts` evidenceRank, EVIDENCE_TIERS; `work/load-day.ts` preparedAnglesByAccount (the ready, placed angles ride in as `WorkInput.preparedAngles`) | A 300abdd0, 7b6f90f3; lead 0c540321 | work-rank 9, work-list 15, load-day 6 |
| 2 an expired out-of-office reminder as a due obligation | An out-of-office reminder (kind reminder, source reply, basis "Out of office") is availability: snoozed before its return day as before; on or after it, never a due obligation, never a follow_up item, never a Waiting row. It rides on the account's card as `availability` ("Diego Fonseca returned May 26 (their out-of-office notice); no reply from them since.") when the account has other work; an account with nothing else is a parked research card ("Back since Jun 16 (out-of-office notice); nothing prepared yet" / "No supported angle yet: GAP researches it; it returns when there is one"), counted as `counts.availability`. The commitment row is never written. people-state carries `availability` too, descriptive only. | `work/list.ts` isAvailabilityReminder; `work/people-state.ts` | A 300abdd0, b36dee69 | sa-availability 5 (mutation: the branch forced off turns 4 of 5 red), stream-a-people-state 6 |
| 3 the same obligation twice | A card's own item is not pushed when the card is its top obligation said again (`ownMoveIsObligation`) or an obligation on the card has the same tier and the same person; an obligation at a parked tier (later, held, research) is never an item. R41 (a deal plus its due commitment stays two items) unchanged. | `work/plan.ts` itemsForDay | B 92d51257, 28808044 | sa-plan-refresh 11, day-plan 12 |
| 4 a stale stored plan on resend | `planDay(..., { refresh: true })` writes a new `work.day_planned` REVISION for the day when the change is material (the key set differs or the first five reorder), with `revision`, `supersedes` and `changes` (added, removed, moved, with seller-word labels); kept keys keep their tokens so links and assignment bindings stay valid; an immaterial refresh writes nothing (`unchanged`). `loadDayPlan` is the newest revision; `findPlanItemByToken` marks `retired`. The explicit resend (`?resend=1`) refreshes and the briefing says "Refreshed plan (revision N, H:MM New York): added ...; removed ...; moved ... up" or "Unchanged since the H:MM plan"; the scheduled tick never refreshes (first claim of a day wins, X21 kept). | `work/plan.ts`, `work/briefing-send.ts`, `work/briefing.ts` planStatusLine | B 92d51257, 624c7b01 | sa-plan-refresh 11, briefing-send 8, stream-c-c31-c33-briefing 10, briefing 10 |
| 5 routine research assigned to the seller | START and NEXT walk the newest revision and hand over only ASSIGNABLE work: an item already assigned in any revision, settled by SKIP/DEFER/DONE, or whose assignment would carry nothing prepared and a research-shaped move ("research", "find the operator", "no grounded angle", "review the angle") is skipped; the held item gets a `work.command_applied` row with effect `item_held_for_research` (once) and the answer says "Held for GAP research: <account> (nothing supported to send yet)". A deal, follow-up or review item at an account where GAP prepared an angle for a placed person prints the angle and its opener ("GAP has prepared an angle for Dave Kiesling: ...", "Opener: ...") and is assignable (`prepared.kind === 'angle'`). The assignment prints "Not read this time: ..." from the Ask context's coverage. | `work/assignment.ts` assignable, nextAssignableItem; `replies/commands-apply.ts`; `ask/context.ts`, `ask/grounding.ts` coverage | B e882840b, 28808044, 59c6157d; C 630c53ab | assignment 9, commands-apply 11, sa-ask-coverage 4 |
| 6 a progress note recorded as completion | `work/done-note.ts` reads the note before it is recorded: the first clause decides, a signature block is cut; "researching catalysts" is progress (cue "researching"), "called Joey, he will send the comparison Friday" is a completion. DONE with a progress note records `work.command_applied` effect `progress_noted` (the note, the cue, basis self_reported) WITHOUT changing the commitment or the outcome, answers "Recorded as in progress, not done ...", and never blocks the later real DONE. The activity view: a commitment closed on a progress note reads "Marked done by your note "...", which reads as work in progress, not a completed follow-up" (class other, self_reported, completes only the commitment key); `progress_noted` is its own kind (class other); a held item and the agent's own research run (`research.completed`: "GAP researched Kenco: insufficient evidence (0 facts, 9 rejected)") read as preparation, never contact. | `work/done-note.ts`; `replies/commands-apply.ts`; `work/activity.ts` | lead 2b86ddba, 2f3abb35; B e882840b; C 1ec36a26 | done-note 4, commands-apply 11 (mutation: the progress branch disabled turns B6 red), stream-c-activity-truth 14, activity 6 |
| 7 ambiguity said as absence | A pursued person with no account on the task is placed at read time through the identity machinery (persona, CRM contact's company, thread alias, verified domain; freemail never); the item carries `placedVia`, `placementChanged` ("the angle was developed before placement, so Pursue again to develop it as deal work") and "In an open deal: ..." from the C01 coverage. When two accounts claim the domain, the ambiguity is SAID with the candidates ("kencogroup.com is claimed by Kenco and Kenco Logistics Services (an open duplicate since May 5): choose the account") instead of "No account yet"; when the candidates are one family (parent brand, or an open duplicate_company conflict between them) and exactly one is in an open deal under a complete CRM read, the person is placed there via `family_deal` and the line names the unmerged duplicate. The identity context reads the conflict-status links too, and a canonical company whose `domain` is null but whose key is `domain:<host>` yields the host. Repeated Pursue clicks never queue a second task (a queued or running one is kept: "Already queued; GAP is on it"). | `work/intel.ts` loadPursued, loadFamilyFacts; `work/person-identity.ts` tieBreakFamily; `identity/resolve.ts`, `identity/service.ts`; `work/decide.ts`; `components/gap/intel-panel.tsx`, `work/briefing.ts` | C 28a540d4, 44fa553f, c961173f, 7f37e8a4, bb0fff53 (the host from the canonical company key when its domain is null; family facts by name without case and by company id), 35a47c17 (one deal shared by the family places at the name the CRM records it under) | sa-pursued-placement 8, identity-resolve 14, identity-service 8, decide 9, intel-panel 5 |
| 8 coverage not said; placed inbound not on the story | C4 above, and C6: inbound mail whose sender the identity machinery places at the account (including the family tie-break) reaches the account story's "They said" lines, marked by its placement route, bounded; coverage says partial when the identity context was not readable. | `ask/grounding.ts`, `ask/context.ts`, `account-intel/load.ts` | C 630c53ab, 5bd4e11d (C6), 54d7d314 (C7: HTML entities decoded in the excerpts) | sa-ask-coverage 4, sa-account-inbound 6, history-trust 7, story-projection 16 |

### The refreshed plan, on real data (read only)

Receipt: `docs/gap/REFRESHED_PLAN_PREVIEW_2026-10-09.md`, written by `scripts/gap/preview-refreshed-plan.ts` against PRODUCTION data, READ ONLY (every write intercepted and listed; the day builder, the plan composition, the assignment builder and the intelligence ranker run as they would on the live page; no model call, no send, no draft, no queue). It is a preview, not a plan GAP made: the stored plan stays until an operator refreshes it. The stored plan (11:05Z, 19 items) beside what GAP would plan on the merged tree (14 items):

| # | Account | Kind | Ranked here because | Prepared |
|---|---|---|---|---|
| 1 | Kenco | deal | A stalled deal: the close date (Sep 30) has passed and the deal is still open. Confirm the real date; GAP prepared an angle for dave.kiesling@kencogro | an angle for dave.kiesling@kencogroup.com: The undated note from Dave Kiesling s |
| 2 | PepsiCo | ready | A prepared first touch. Ranked here: a first touch prepared. | an email to shawn.miller@pepsico.com, subject "Doors versus spots" |
| 3 | Boston Beer Company | deal | A stalled deal: the close date (Sep 30) has passed and the deal is still open. Confirm the real date. Ranked here: deal hygiene only (close date passe | nothing prepared |
| 4 | Crowley | deal | A stalled deal: crowley - Pilot: The close date (Sep 29) has passed and the deal is still open. Confirm the real date. Ranked here: deal hygiene only  | nothing prepared |
| 5 | General Motors | deal | A stalled deal: the close date (Sep 30) has passed and the deal is still open. Confirm the real date. Ranked here: deal hygiene only (close date passe | nothing prepared |
| 6 | GXO Logistics | deal | A stalled deal: no activity on the deal in HubSpot since Sep 8 (30 days). Agree the next step, or close it out. Ranked here: deal hygiene only (close  | nothing prepared |
| 7 | Kraft Heinz | deal | A stalled deal: no activity on the deal in HubSpot since Sep 8 (30 days). Agree the next step, or close it out. Ranked here: deal hygiene only (close  | nothing prepared |
| 8 | Kroger | deal | A stalled deal: the close date (Sep 30) has passed and the deal is still open. Confirm the real date. Ranked here: deal hygiene only (close date passe | nothing prepared |
| 9 | Mondelez International | deal | A stalled deal: the close date (Sep 30) has passed and the deal is still open. Confirm the real date. Ranked here: deal hygiene only (close date passe | nothing prepared |
| 10 | Wesco International | deal | A stalled deal: no activity on the deal in HubSpot since Sep 9 (30 days). Agree the next step, or close it out. Ranked here: deal hygiene only (no rec | nothing prepared |

Removed from the stored plan (5): both Southern Glazer's items (the DONE closed the reminder; after the reconcile it is a parked availability card like Swire), both Swire items (parked: "Back since Jun 16 (out-of-office notice); nothing prepared yet", counts.availability 1), Kroger's parked "later" follow-up. Moved: Kenco 10 to 1 (open deal, close date passed; an angle prepared for Dave Kiesling via the family deal; Craig Morrison's Sep 24 reply now on the account story, placed by the family's deal-holding account), PepsiCo 5 to 2 (a prepared first touch), the stalled deals in their hygiene order, Coca-Cola's review after them. Kenco's assignment now says "GAP has prepared an angle for ...: ... Opener: How do you currently manage gate check-in and driver communication during busy periods?" and "Not read this time: Gmail Sent (not read on the account page), Gmail drafts (Gmail drafts not read), the vault (not configured). Partly read: the Gmail thread (GAP's synced inbox, not a live thread read; 19 placed sender messages merged)". The pursued Kenco item reads "Placed at Kenco, the family's deal-holding account; Kenco Logistics Services is its open duplicate, unmerged; the angle was developed before placement, so Pursue again to develop it as deal work" instead of "No account yet". The intercepted writes are the in-deals summary's SystemConfig cache upserts (the harness stubs the write, so every read re-reads HubSpot and tries again; production writes the cache once) and the plan lock's executeRaw; nothing else tried to write.

Still said honestly in the preview: the stalled deals from Boston Beer to Wesco carry nothing prepared and a CRM hygiene move ("confirm the real date", "agree the next step"); GAP holds nothing there because the move is not research, but it prepares nothing either. Southern Glazer's shows as absent (not parked) only because the DONE closed its reminder; the reconcile script restores the pre-DONE state, after which it parks like Swire.


### The integrated review (focused during implementation; one gate at the end, on the merged tree)

- During implementation every builder ran its owned suites one file at a time (`--maxWorkers=1`), and the consequential pins were proven RED under a deliberate mutation and restored (A1 the availability branch forced off: 4 of 5 red; B5 the retired refusal and B6 the progress branch disabled: exactly those pins red).
- The gate on the merged tree at 0aab4254 (the commits after it, ddb9c3b2 and 0cef6170, touch the harness script only): 59 suites, 473 tests, 0 failed, run serially in one worker: the eight new `sa-*` and `done-note` suites, every suite the builders own or touched (work-rank, work-list, work-list-view, commitments, people-state, x15-ranking, r63-work-parked, day-plan, assignment, briefing, briefing-send, the C31-C33 briefing, the briefing cron, commands-apply, the C43/C44 commands, approve-request, intel, intel-panel, decide, decide-route, activity, activity-view, the activity truth and coverage suites, develop-angle, identity-resolve, identity-service, identity-normalize-compat, hypothesize-cron, load-day, the story suites, loader-schema, account-intel-regate, execution-acceptance, account-intel-accents, history-trust, ask-gap, ask-proposal, v1-kenco, the C46 health probe, contract-parity, the C52-C54 and C56 evaluator suites, seller-preference, the promote-angle service and route, health, health-route). `tsc --noEmit` clean on src and tests. The reference set was re-frozen at version 4 (builder C's line vocabulary gained "is claimed by"; lock `4:2511941bc118328b`).
- Against real retrieved data: the preview above, run four times through the merges (the baseline on the released code, after A, after A+B+C, final), with external actions disabled by construction.

### Named debt (not fixed here)

- The in-deals summary read runs once per assignment build (C6's placed inbound read and B9's pursued read both call the cached `loadInDealsSummary`); the cache makes it one HubSpot read per two minutes per instance, but the harness shows the pattern.
- A human reply older than 14 days at a deal account becomes the account's card as admin (X15a) and never reaches the evidence band; the prepared angle, not the prior reply, is what lifted Kenco. Whether a prior reply should count as evidence without becoming the card is a decision on X15a (Casey).
- The stalled deals with nothing prepared keep a CRM hygiene move; GAP does not yet prepare a next action for them (the deal brief's "what to learn next" is the hook).
- `StateEvent.outOfOffice` exists on the people-state contract but the timeline reader does not set it yet.

### Branch and commits

Branch `feat/gap-seller-acceptance` (the lead), merged from `feat/gap-sa-a` (A: 300abdd0, b36dee69, 7b6f90f3), `feat/gap-sa-b` (B: 92d51257, 624c7b01, e882840b, 28808044, 59c6157d, 0b0075eb, 4e0fb577) and `feat/gap-sa-c` (C: 28a540d4, c961173f, 1ec36a26, 44fa553f, 630c53ab, 7f37e8a4, 5bd4e11d, bb0fff53, 35a47c17, 54d7d314); the lead's own: 2b86ddba and 2f3abb35 (done-note), d88cff88 (the harness and the reconcile script), 0c540321 and 14e6755e (the loader wiring and the re-frozen reference set), 0aab4254 (the coverage shape), the harness commits. One writer per file throughout; the builders' worktrees `wt-gap-stream-a|b|c` were re-pointed at fresh branches and their leftover edits from the C-program session preserved as WIP commits on the old branches.

### Reconciliation of existing rows (prepared, NOT run)

- `scripts/gap/reconcile-october9.ts` (dry run by default; `--apply` needs `GAP_RECONCILE_APPLY=yes` and the database host named): appends two rows, an `account.commitment` status row returning the Southern Glazer's reminder to its pre-DONE state (snoozed until May 26, which the day builder now reads as availability) with the reason and the message id, and a `work.command_applied` row with effect `progress_noted` carrying the note as progress. Its dry run against production at 12:58Z read the note as progress (cue "researching") and printed both rows; nothing was written. Runs once (the reversal mark is found on a second run).
- Kenco: no row to reconcile. The person is placed at read time; the stored task input and decision rows stay as history. The duplicate account (Kenco Logistics Services beside Kenco, open conflicts since May 5) is Casey's to merge or alias; GAP says the ambiguity and, when one of the family holds the open deal, places there and names the duplicate.

### Owner items (Casey)

- The acceptance round trip itself: START on a refreshed plan, the first assignment, NEXT, a real DONE, an APPROVE on a prepared item. Never simulated.
- DONE 2026-10-09 on Casey's go: Kenco Logistics Services merged into Kenco (see the status line above); nothing to do in HubSpot (the duplicate had no HubSpot company).
- The resend (`?resend=1`) keeps refreshing the plan by default (decided 2026-10-09 on Casey's "your call").

## GAP OS KNOWLEDGE PROGRAM — October 9, 2026 New York

**Status words, kept apart:** IMPLEMENTED (code on the branch, the integrated gate green), DEPLOYED (on `modex-gtm.vercel.app`), SELLER-ACCEPTED (Casey's own round trip passed). As of this section's last stamp: IMPLEMENTED and DEPLOYED (PR #436 merged as 22ea1be6; production `dpl_6xbJZVMTvri3u5E8jRkwrPyfNVh5` READY 2026-10-09T19:12:25Z, the alias bound; the vault sync cron answers `skipped: gap_vault_github_token_not_set` until Casey sets the token, as designed); the knowledge table holds 7,434 notes in the production database; the briefing was resent on the deployed code (plan revision 2, 12 items, Gmail thread 1a12215b5c44281e, 19:1xZ) so the day Casey works from carries the knowledge; NOT ACCEPTED (Casey's round trip on that thread is the test, never marked for him). <!-- verified:2026-10-09 -->

**Casey's mandate (2026-10-09, after the seller acceptance follow-up deployed):** "Are you sure we're not missing anything else? Pretty sure a lot of this information already exists in the vault. Did we not ever get that connected? Need to be sure we're really using everything to the best of our ability. Got to audit and optimize. Do not lose the forest for the trees with Kenco. We think in systems." The system fact: the Obsidian vault (the private repo yardflow-gtm-vault, pushed daily by its librarian; 92 Fireflies calls with verbatim, account notes with next actions, meeting notes prepped from the calendar, people and deal notes) was never readable from production; every assignment said "the vault (not configured)". Our own Sent mail and HubSpot's logged notes, calls and meetings were never on the account story either.

### Phase 0: the baseline, known versus used (read only)

`scripts/gap/knowledge-coverage-audit.ts` writes `docs/gap/KNOWLEDGE_COVERAGE_AUDIT_2026-10-09.md`: for the 13 accounts in open deals or with a person who wrote in, what each source holds against what the Ask context (the composition the assignment prints) says. Baseline at 17:5xZ, before any change: 9 accounts with a vault next action, named by 0 stories; 42 vault meeting notes and 13 Fireflies calls on these accounts, a call or meeting named on 3 stories; 489 HubSpot engagements on the open deals (Crowley alone 7 logged meetings and 125 logged emails), used by 0; our Sent read for 0 accounts; the vault on 0 coverage lines. Commits a900c362 (the audit), ddc13d88 (the baseline).

### Phase 1: the vault into production (builder A: 737d57a8, c19d34ba, cc096915)

- `GapKnowledgeNote` (`gap_knowledge_notes`: path unique, sha, git_sha, kind account|person|deal|meeting|raw|other, account_name resolved through the identity context, domain, people[], note_date, title, frontmatter, text, source fireflies|calendar-prep|librarian|null, synced_at). Pushed to production by the lead with `prisma db push`, the hand SQL guards re-applied, `verify-triggers` 33 of 33.
- One pure parser (`knowledge/vault-note.ts`), one upsert path idempotent by path and sha (`knowledge/vault-sync.ts`; the per-run cap counts remote fetches and writes only, lead fix 6c54bfa2), two ways in: `scripts/gap/vault-push.ts` from the local vault (the backfill: 7434 notes on record after eight capped runs on 2026-10-09 (6731 account notes, 508 people notes, 103 raw captures of which 92 Fireflies calls, 85 meeting notes, 7 deal notes); 52 rows re-resolved to their GAP account through the vault's own account notes (`--reresolve`)) and the cron `/api/cron/gap-vault-sync/` (12 and 42 past each hour) through the GitHub tree API with `GAP_VAULT_GITHUB_TOKEN` (absent: skipped with the reason, never an error; the token is Casey's to set). Every run records one `knowledge.vault_synced` ledger row.
- The table adapter (`knowledge/vault-table-adapter.ts`: `vaultTableAdapter`, `vaultTableStatus`, `knowledgeForAccount(prisma, name, { domains, aliases, limit })`: the account note, meetings, calls by participant domain or placed address, deals, people, newest first) is what `story/load.ts` uses in production when no local folder is set; the retrieval (C13/C15) turns the notes into dated claims as before; the vault coverage row carries the sync time and "92 calls, 78 account notes"; health's context component says the vault as read, empty, or failed.

### Phase 2: the reads the vault does not carry (builder B: a0609e32, bdc33ac7)

- Our Sent on the account story (`account-intel/sent.ts` through the existing Gmail Sent reader, per account domain and outside address, 180 days, bounded): "We wrote Craig Morrison, VP Operations on Oct 9: <subject>. No answer owed yet." within a three-day grace; "No answer on record" only after an older send with no later inbound; the silence counts from our last send.
- HubSpot engagements on the account story (`hubspot/engagements.ts`: notes, calls, meetings and logged emails by read-only search, 365 days, 50 each, a 30-minute cache per company): dated HubSpot rows, never buyer words unless the logged email came from them.
- The coverage line reads what it holds: "Not read this time: Gmail drafts (...). Read: the vault (synced 10:39 New York, 92 calls, 78 account notes), Gmail Sent (3 messages), HubSpot engagements (7)".

### Phase 3: the knowledge in the decisions (builder C: 3ca89807, a006f7d7, ccac1111, 9327ea3d; the lead e45bbe72, 82f260ab)

- A held meeting or call is a conversation (people-state `StateEvent.conversation`, `PersonState.lastConversationAt`): quiet counts from it and an answer is not owed after it; the lead's `conversationEvents` (intel.ts) feeds the people ranker from the knowledge table (meeting notes and Fireflies calls with the person among the participants).
- The vault as ranking evidence (`WorkInput.knowledge`, `evidenceRank`): a conversation within 30 days is relationship history; a vault next action due within 7 days or past is deal context; both named in rankWhy; the lead's default reader in load-day.ts makes the page, the briefing cron, /gap/start and the preview read it without edits.
- The DONE note becomes records (`readDoneNote(note, { now }).facts`, `commitmentsFromSellerNote`): a dated meeting writes one idempotent prepare_meeting commitment (waiting, 8 am New York, source seller_note keyed by the Gmail id and the day); a sent note is recorded as a claim GAP checks against Sent; nothing is marked contact on the seller's word.
- Auto-advance: every applied SKIP, DEFER or DONE sends the next assignable item in the same mailbox tick (`advancedTo` on the applied row; the answer names it); a progress-noted or refused DONE never advances.
- The vault's calls on the story (the lead, 1fce9ae9, c46eb396, after the first deploy): a pure reader of a Fireflies capture (`knowledge/fireflies-summary.ts`: the summary bullets, the action items under their names, the keywords; never the transcript, which the vault's own rule keeps as the ground truth); the account inputs carry the account's Fireflies calls and calendar-prepped meetings from the knowledge table, found by the account's domains (the canonical company's and the GAP contacts' own) and its aliases; a call and a held meeting are touches of source vault with the buyers named from the record; the between-us row says "Call Jul 16 with Craig Morrison and Dave Kiesling (Fireflies): <title>. <two summary bullets> Action item (...)" and "Meeting Sep 16 with ...: <title> (on the calendar; the vault's prep note)", tagged Checked with the vault as the basis and the summary said as advisory; DEPLOYED as PR #438, main 41e2094e, production `dpl_DgQ2rTQCgDxsYDXznutjvR5aktMW` READY 2026-10-09T19:47:43Z (no resend: the revision 2 briefing stands and every assignment is built live). The audit after it: a call or meeting named on 8 of 13 stories, the accounts with calls whose story names one 4 of the accounts with calls (was 2). Gate 83 suites, 594 tests, 0 failed.

### Phase 4: the receipt, after

`docs/gap/KNOWLEDGE_COVERAGE_AUDIT_2026-10-09-after.md` (the same audit, the same 13 accounts, after the vault backfill, the re-resolve and the wiring, run read-only against production): the vault next action named on 8 of the 9 accounts that carry one (baseline 0); a call or meeting named on 6 stories (baseline 3); the vault on 13 of 13 coverage lines (baseline 0), each saying the sync time and the counts ("103 calls, 6731 account notes, 85 meeting notes, 7 deal notes, 508 people notes"); HubSpot engagements read on the story (Kenco: 58, Crowley: 7 logged meetings among 125 logged emails) where the baseline used 0. Our Sent still reads as not read in the audit process (the GAP sender's credentials are production-only; the production page reads it) and the two Kenco Fireflies calls reach the people state and the ranking but their content is not yet on the story (named debt below).

`docs/gap/REFRESHED_PLAN_PREVIEW_2026-10-09-knowledge.md` (the plan preview on production data, read only): the day now ranks Crowley, GXO Logistics, Kraft Heinz and Kroger first, each "Ranked here: the vault's next action: ..." with the vault's own words and due day (a due or past next action is deal context), PepsiCo's prepared first touch fifth, the hygiene-only stalled deals after it, Coca-Cola's review ninth; Kenco is set aside for the day by Casey's own DONE at 12:52 (the account outcome "logged" until tomorrow), which is the R14 rule and said as such; the Swire out-of-office stays parked. Every top assignment now carries "Your vault note (for you, never quote it to the buyer)" with the wedge read and "Next action on record, due <day>: ...", the HubSpot rows ("HubSpot note Oct 9: Vault wedge ...", the logged calls and meetings) and the coverage line that names the vault as read with its counts.

The integrated gate on the final tree (0cef... lineage, the knowledge program at 82bbce02): 82 suites, 591 tests, 0 failed, serial in one worker (every kn-* and sa-* suite, the builders' and the lead's touched suites, the evaluator suites, health); `tsc --noEmit` clean on src and tests. The vault backfill, the re-resolve, the schema push and the SQL guards are production operations done on Casey's go ("go"), each recorded in the ledger (`knowledge.vault_synced` rows; `verify-triggers` 33 of 33).

### Named debt

- The cron needs `GAP_VAULT_GITHUB_TOKEN` in Vercel (a read-only fine-grained token on the vault repo), Casey's to create; until then the local push (run by the lead today) is the sync path and the table ages with the vault.
- (closed by the calls slice) The assignment prints a coverage line that starts with "Read:" verbatim as well.
- HubSpot contacts on the account inputs carry no address, so Sent is asked by the account domains and the persona, inbound and first-touch addresses only.
- A Fireflies capture without participant addresses in its frontmatter matches an account only by its path; the vault's own sweep writes the participants, so the gap is historical.

## GAP OS INTELLIGENCE WIRING — October 9, 2026 New York

STATUS: IMPLEMENTED on `feat/gap-knowledge` (the merged lead tree); NOT DEPLOYED and NOT SELLER-ACCEPTED at the time of writing; this entry says which is which. <!-- verified:2026-10-09 -->

**The mandate (Casey, the wiring plan of October 9, the Codex handoff):** the briefs and reports that already exist (the Yards First Brief, the Freight X Signal Desk, the Codex HubSpot Activity & Engagement report, the Clawd signal hunter, the vault) never reached GAP's email. Surface collected facts, reports, potential signals, hypotheses, conflicts and historical observations with their substance and provenance; Casey judges usefulness; verification and an outreach angle are labels, never prerequisites for display; imported recommendations never become obligations or commands; preserve the existing deployment and send boundaries. Sixteen atomic tasks IW01-IW16 in four slices; the plan and the snapshots are Casey's uploads of October 9 (not in the repository); the handoff is `docs/gap/INTELLIGENCE_PRODUCER_HANDOFF.md`.

**The system, in one paragraph.** A producer's collected report becomes atomic records under one contract (`src/lib/gap/signals/intelligence-record.ts`: producer + item id as the stable identity; the passage verbatim; the sources and CRM record ids; the event date apart from the report date apart from the import time; the producer's confidence and its commentary each in its own field; its drafted messages archived, never sent). The records are `gap_signals` rows of origin `report_import` with the contract under `metadata.import` (no schema change), so the existing decisions (pursue, explore, save, skip, dismiss, more), the Work panel, the account pages and the briefing read them. The reader (`work/intel.ts`) carries the substance whole on the item and returns the briefs as their own group, newest report first with the producers taking turns within a date; the vault's held calls and meetings with somebody from the account on them are a group of their own (`knowledge/knowledge-intel.ts`; no decisions, an Open link). The briefing's digest is composed by a rule the email states (`composeDigest` in `work/briefing.ts`: reserved slots 2 briefs, 2 found, 1 trigger, 1 vault of six, then the sections in turn; the keys of the last seven days' briefings rotate behind the unseen; the omitted are counted and the complete list is linked; the sizes are configurable by `GAP_BRIEFING_DIGEST_SIGNALS` and `GAP_BRIEFING_DIGEST_PEOPLE`); each item prints the passage (cut at a sentence end past 700 characters), "In the producer's words" (the confidence), "The producer's read (not an obligation)", the sources as links, the CRM ids and the dates said as what they are; the `briefing.sent` row records the keys shown and omitted. The complete retained pool is `/gap/intelligence` (`signals/intelligence-browse.ts`: a deterministic cursor over created_at and id, filters for producer, kind, account, decided and archive). The continuing sync is `signals/producer-status.ts` (one status per producer and the vault from the `intelligence.imported` and `knowledge.vault_synced` ledger rows; never, current, stalled since a date, failed), printed under the digest's head and on health as "Intelligence producers".

**The tasks.**
- IW01 the record contract (lead): `intelligence-record.ts`; a hypothetical, unresolved item with no url, no account and no fact validates; the refusals name the field. Test `iw-report-parsers.test.ts`.
- IW02 the batch import (lead): `signals/intelligence-import.ts` (idempotent: duplicate, revision with the previous hash kept, invalid by index; the account resolved conservatively by the existing resolver; research `none`; never a fetch, a Slack post, a HubSpot write or a model call; one `intelligence.imported` ledger row per producer per call), the door `POST /api/gap/intelligence-import` (session or the `GAP_INTEL_IMPORT_TOKEN` bearer; the origin is `report_import`, never a Casey share) and the local `scripts/gap/import-intelligence-batch.ts` (dry run; `--apply` under the reconcile guard). Tests `iw-intelligence-import.test.ts`, `iw-intelligence-import-route.test.ts`.
- IW03 the three snapshots (lead): `signals/report-parsers.ts` cuts the Yards First Daily (the decision-grade signals: Development verbatim, Score/Confidence as uncertainty, the commentary labels as interpretation, the links as sources), the Signal Desk (the three moves and the other conversations as observations, drafted posts and replies as suggestions, the reserve posts archived, the people as hints) and the HubSpot report (the buying-signal bullets as engagement records with the contact and engagement ids from the urls, the evidence date, the label and what is not verified; the scorecard and the data gap in the container) along their own structure, deterministically, no model; a capture's private-use wrappers around entity markers are cut. `scripts/gap/export-intelligence-snapshots.ts` writes `tests/fixtures/gap/intelligence-import-2026-10-09.json`: 159 records from 56 distinct reports (83 developments, 21 observations, 3 engagements, 52 report containers; four captures skipped as not reports). Checked on the fixtures: the Kodiak limitations, the 7-Eleven uncertainty, the Sub-Zero and World Market ids stay visible.
- IW04 the producer handoff (lead): `docs/gap/INTELLIGENCE_PRODUCER_HANDOFF.md` (the record, the two doors, the per-producer path, the ChatGPT instruction and the exact Codex prompt amendment, prepared and NOT applied; the Codex automation still forbids report files until Casey changes it).
- IW05 the complete pool (builder C): `signals/intelligence-browse.ts`, `GET /api/gap/intelligence`, `/gap/intelligence` (no decisions, imported text rendered as text), the subnav entry. Record 601 reached with equal timestamps, no duplicate, no skip; a report container only with the archive filter; a decided row recoverable. Tests `iw-browse.test.ts`, `iw-intelligence-route.test.ts`, `iw-intelligence-page.test.tsx`.
- IW06 the vault projected (lead): `knowledge/knowledge-intel.ts`; a useful call passage surfaces with no quiet person and no action in play; no wedge is generated. Test `iw-knowledge-intel.test.ts`.
- IW07 the Clawd export (builder B): on the Clawd repository, branch `feat/intel-export` in `C:\Users\casey\wt-clawd-intel-export` (commit 5106e448, NOT pushed, NOT deployed): `GET /api/yardflow/signals/export` (a keyset cursor over fetched_at and id, `limit`, `min_relevance` default 0, `since`, `include=candidates`; behind the MC_API_TOKEN gate; no threshold, no Slack, no HubSpot, no Pounce push). On this side `signals/clawd-export.ts` (the mapper) and `scripts/gap/import-clawd-signals.ts` (dry run; `--apply` under the reconcile guard; the cursor on the ledger). Verified against a local stand-in server, NOT against Railway. Test `iw-clawd-export.test.ts`; Clawd pytest 57 passed.
- IW08 the candidates before the cut (builder B, Clawd): the deduped, classified candidates below relevance 40 are stored in `yardflow_signal_candidates` (migration `0020`, also created lazily on first write) before the unchanged cut, purged after 60 days; served by the export with `include=candidates`. Previously discarded data stays unavailable.
- IW09 existing evidence without obligations: the HubSpot report's engagement records carry their ids and what is not verified (World Market's company association); the Southern Glazer's May out-of-office writer is availability (parked by the seller-acceptance follow-up), not a prospect to reengage and not an item; a draft never counts as sent (the conversation reader, unchanged). Pinned by the harness's named checks.
- IW10 the substance through reader and renderer (lead): `IntelItem.substance`, the email lines above, the Work panel's substance block. Test `iw-reader-renderer.test.ts` (text and HTML both carry the Kodiak development and the supervised-operation caveat; imported text is escaped; no body line starts with a command word).
- IW11 the composition (lead): `composeDigest`, the briefs and the vault as groups, the stated rule, the sizes. A six-slot cap cannot monopolise: each section keeps its reserved slots and the omitted are counted; an out-of-office task is a plan item and never displaces intelligence (intelligence prints first).
- IW12 coverage and overflow (lead): the sent row's `intelKeys`, `intelOmitted`, `intelBreakdown`, `intelRotated`, `coverage`; `shownRecently` rotates; the Intelligence page link. Repeated producer batches are duplicates, never resent as new facts (the identity hash); a new import appears in the next digest without touching the plan or any approval binding (the plan is the day snapshot; approvals bind to the assigned revision; the harness proves no assignment or approval row is written).
- IW13 the continuing sync (builder C): `signals/producer-status.ts`, the health component "Intelligence producers" (omitted when not read; DEGRADED when a producer that has imported is stalled or failed; the vault's state included, with the GitHub token's absence said), the coverage paragraph printed by the briefing (`defaultCoverage` in `work/briefing-send.ts`) and by the harness. Tests `iw-producer-status.test.ts`, `iw-health-producers.test.ts`.
- IW14 the integrated replay (lead): `scripts/gap/preview-intelligence-briefing.ts`, READ ONLY against production: the fixture imported into an in-memory overlay seeded with production's account universe, a hybrid client reading the overlay and production together, the stored plan (revision 2), `defaultIntel`, the renderer; the receipt `docs/gap/INTELLIGENCE_BRIEFING_PREVIEW_2026-10-09.md` and the HTML beside it; eight named checks (the Kodiak caveat in text and HTML, the 7-Eleven uncertainty, the Sub-Zero ids, World Market unresolved, Southern Glazer's parked, nothing imported became a plan item, no production write but the in-deals cache, no assignment or approval row) all PASS; one intercepted write (`systemConfig.upsert`, the in-deals cache).
- IW15 the execution mismatches (lead): the PepsiCo card named Tom Kamantauskas while the prepared email was to Shawn Miller (still present in the current plan preview). `work/assignment.ts` now holds an item whose prepared email is addressed to a different person than the item names (the pack persona's name, else the persona record for the address; "Morrison, Craig" is "Craig Morrison"): the email is not presented as prepared, the text says why, `assignable` refuses with `recipient_mismatch`, the walk records the hold with its own line and hands over the next item; no approval can bind to it. The action-scoped DONE (a DONE settles only its item; a progress note settles nothing) was checked against the current code and needed no change. Test `iw-recipient-mismatch.test.ts`.
- IW16 this entry, `CLAUDE.md`, the memory note.

**Receipts.** The gate on the merged tree: 89 suites, 183 tests, 0 failed (the `iw-*` suites, the briefing, intel, assignment, health, subnav and signal-route suites); `tsc --noEmit` clean but for the known `.next/types` debt (`AGENT_TASKS_PER_RUN`). The production preview (read only): 159 records imported into the overlay (12 resolved, 3 ambiguous, 144 with no account, all kept); the digest shows 2 from the briefs (the Signal Desk's relationship move and the Kodiak development with its caveat and three sources), 2 GAP found, 1 trigger, 1 from the vault (the World Market demo of October 6 with Jarrod Black, the same person the HubSpot report names), 8 people; thousands omitted and reachable on the Intelligence page; the coverage paragraph names the three briefs as read and the Clawd hunter as never imported.

**What is implemented, deployed, delivered and accepted (release 1, Casey's final execution instruction of 2026-10-09).** IMPLEMENTED: everything above plus the second list's Priority 1 and 2 (the recurring Clawd import cron `/api/cron/gap-clawd-import`, the export-folder consumer `scripts/gap/consume-export-folder.ts` with `signals/export-folder.ts`, the pursued section after the intelligence, two dates on every producer line, the vault's git revision on the local push). DEPLOYED: PR #440 = main d40d1d18, Vercel `dpl_2r6v1tupEznWHEKqrUdcFu7FNVre` READY 2026-10-09T23:55:53Z (rollback 16a6d67c); the Clawd control plane PR #66 = 31bda6b8 on Railway, its export live. PERSISTED: 159 report records (the second import 159 duplicates); the Clawd cron's runs 243 then 196 items. DELIVERED: the internal briefing resent 23:59:59Z, Gmail 1a1231bfaa5d161d, revision 3, 13 items, 11 intelligence keys (2 briefs, 2 found, 1 trigger, 1 vault, 5 people), the coverage paragraph on it. CONFIGURED: `GAP_INTEL_IMPORT_TOKEN` in Vercel; the Codex automation prompt amended for its structured export; the watched folder created. ACCEPTED: nothing; Casey judges. The receipt from the persisted rows: `docs/gap/INTELLIGENCE_BRIEFING_RECEIPT_2026-10-09.md`. The one checklist with the remaining priorities and the consolidated request: `docs/gap/INTELLIGENCE_WIRING_CHECKLIST.md`. The follow-ups of October 10: the Clawd cron bounded to one page of a hundred (the three-page run timed out; the cursor had advanced per page), producers taking turns across the whole briefs group, the war-room adapter (`signals/warroom-export.ts`, `scripts/gap/import-warroom-dossiers.ts`: the 58 dossiers' why-now evidence and findings as records, the intent score and views labelled context, the talk track left out; imported into production, ledger cmv1n2xao001m7kz88lam9rg7; shown on the twelve-slot preview `docs/gap/INTELLIGENCE_BRIEFING_RECEIPT_2026-10-09-wide.md`), and the review feed reading `WAR_ROOM_TOKEN` (the feed had posted nothing to the war-room since September 26 because modex holds the Clawd token under MC_API_TOKEN's readers and the war-room's token differs; the value is sensitive and waits for Casey). The reuse inventory (bounded, read only): Jarvis is a proxy layer with no served upstream (no benefit; its dispatch is autonomous and stays off); the Manifest-era GTM-YardFlow and YardFlow-Hitlist hold seed lists and sourceless model text, their only human records (meetings, outreach history) readable once through Hitlist's full export if that service still exists (unverified); the war-room's stores are copies of Clawd, HubSpot and PostHog or seller interpretation, its deployment a manual CLI upload (nothing of it changed).

**Named debt.** The resolver did not place "SUBZERO" on the Sub-Zero account (no alias; the record keeps the hint); the Signal Desk's post titles are the first bold sentence of the post (occasionally a fragment such as "today"); the digest sizes are environment variables, not yet on the settings page; the Clawd `relevance` column is text, so a positive `min_relevance` never passes a non-numeric row; the harness cannot read Gmail Sent; the four captures skipped as not reports include the Signal Desk's drafted essay (kept out of the import by design).

## 12. Migration, backfill and rollback

Order of commits inside Sprint 1 and 3: schema + SQL first (no reader), then pure core, then importers (Top100 before PIC before modex legacy), then runtime pin, then services, then queue actions under the flag, then `GAP_OS_ENABLED=true` in Vercel after `verify-triggers.ts` passes against prod (env is snapshot at deploy; redeploy after setting). Before the prod `db push`, preview it with `prisma migrate diff --from-url <prod> --to-schema-datamodel prisma/schema.prisma --script` and confirm the script is additive only; also confirm the prod role can `CREATE FUNCTION` (not yet verified). Rollback: the flag off restores byte-identical behavior instantly; full removal is the rollback SQL plus reverting the runtime, service and queue-action commits; `sequences` is never modified; the only two pre-existing tables GAP OS's schema touches at all are `draft_queue_items` (one nullable `sequence_version_id` stamp, S1-T2) and `inbound_messages` (`source String @default("gmail")` and `hubspot_engagement_id String?`, S2-T1, needed so the reply cron and the HubSpot poller can tell a Gmail-sourced row from a HubSpot-engagement-sourced one and attribute the engagement id idempotently) — both additive-only, both confirmed by the production preflight below; the lane and PIC files are read, never written.

**Production preflight, run 2026-09-24 against the live Railway database (read-only: `prisma migrate diff --from-url <prod> --to-schema-datamodel prisma/schema.prisma --script`, plus a single read-only `SELECT has_schema_privilege(...), has_language_privilege(...)`; nothing was written).** Verdict: **GO**. Prod role `postgres` has `has_schema_privilege(current_user, 'public', 'CREATE') = true` and `has_language_privilege(current_user, 'plpgsql', 'USAGE') = true` (the `CREATE FUNCTION` uncertainty this section used to flag is resolved). The diff is 14 `CREATE TABLE` (all nine-plus GAP tables, section 4), 58 `CreateIndex`, 29 `AddForeignKey`, and exactly 2 `AlterTable` blocks against pre-existing tables — `draft_queue_items.sequence_version_id` and the two `inbound_messages` columns above, both Casey-approved 2026-09-24 as the intended, disclosed production schema delta. Zero destructive statements (no `DROP`, `TRUNCATE`, `ALTER COLUMN` type change, or `RENAME`) anywhere in the diff. The hand SQL (`prisma/sql/2026-09-23-gap-os.sql`) was inspected, not executed: every `CREATE TRIGGER`, every `gap_add_check(...)` CHECK constraint, and both partial `CREATE UNIQUE INDEX` statements target only the 14 new GAP tables; it does not touch `draft_queue_items` or `inbound_messages`. Risks: copy mutates in place on contact properties (versions come from the journal, and the lane's `apply-crm.mjs` does not yet consult the drift guard); clawd's deal-stage autopush defaults on with unverified effect (verify before the first GAP HubSpot write ships); the prod Postgres role may not allow `CREATE FUNCTION` (verify in S1-T2); 18 manifest accounts have `crm_apply TODO` and import as stub accounts flagged `unresolved_company`; contacts enrolled in two Top100 sequences over time are reported, not guessed; whether a HubSpot UI edit to a native sequence affects already-enrolled contacts is unknown (journaled as a new version either way).

## 13. Regression path

Scripted, API-level, against local or preview with the GAP flags on, `HUBSPOT_SYNC_ENABLED=false` and a scratch `DATABASE_URL` (`scripts/gap/e2e-loop.mjs`): 1 seed a test prospect (`GAP Test Co`, TAM in, one persona with a phone, one pounce trigger at score 9); 2 hypothesize cron proposes a hypothesis whose observation cites the trigger; 3 approve; 4 routing run yields `call_now` with an explain, and the queue pages it; 5 compile a family step 0 draft to pass, and a tampered draft ("you'd save $2M") to reject C03; 6 enroll produces an approved item with `hypothesis_id` and a run id (or an enroll-table row), and the due endpoint lists it without sending; 7 simulate a reply (seeded `InboundMessage` and `Notification`); Reply Triage lists it; suggestion with a stubbed provider; disposition `problem_confirmed` with a BID; 8 assert the hypothesis is `confirmed` with a confidence, the unsent item is `skipped` with `sequence_stopped:disposition`, and mirror rows record skipped writes; 9 learning shows resolution 1 of 1 with n=1; 10 the due endpoint is empty; 11 HubSpot reflects compact truth when sync is on against a sandbox company; 12 the sequence stopped on reply. What protects existing behavior: the existing queue, send, send-deps, cron and gmail-sender suppression tests run unchanged except the cancelDownstream assertions; `gap-noninterference.test.ts` snapshots `approveBatch` and `addOne` call shapes for non-GAP items; invariant tests for DNC, unconfirmed AI, private intent in explain, C06 leak, stop-never-deletes.

## 14. Definition of done: the twelve questions, and where each answer lives
<!-- verified:2026-09-23 -->
Every answer is a query over these tables, not a narrative. "Answerable" means the table and the write path that fills it are shipped and the e2e for that sprint proves a row lands; a question whose write path is a later sprint is marked with that sprint.
| # | Question | Where the answer lives | Answerable | The query that answers it |
|---|---|---|---|---|
| 1 | Why this account | `RoutingDecision.explain.whyAccount` (TAM, tier, heat, public trigger) | Sprint 2 | `select explain->'whyAccount' from routing_decisions where account_name = $1 order by created_at desc limit 1` |
| 2 | Why this person | `explain.whyPerson` (persona, role gate, seniority, validity) | Sprint 2 | `select explain->'whyPerson' from routing_decisions where persona_id = $1 order by created_at desc limit 1` |
| 3 | Why this problem | `ProspectingHypothesis.problem_family` + `observation` (FACT) + `problem_hypothesis` | Sprint 1 | `select problem_family, observation, problem_hypothesis from prospecting_hypotheses where id = $1` |
| 4 | Why now | `why_now` + linked `ProspectingSignal` ids and ages | Sprint 1 | `select h.why_now, s.id, s.observed_at from prospecting_hypotheses h join hypothesis_signals l on l.hypothesis_id = h.id join prospecting_signals s on s.id = l.signal_id where h.id = $1` |
| 5 | What evidence supports it | `HypothesisSignal` -> `ProspectingSignal` (url or first-party text, observed_at, confidence) | Sprint 1 | `select s.evidence_url, s.evidence_text, s.observed_at, s.confidence from hypothesis_signals l join prospecting_signals s on s.id = l.signal_id where l.hypothesis_id = $1` |
| 6 | What would prove us wrong | `falsification_questions` + `what_a_no_means` (+ `contrary_evidence`) | Sprint 1 | `select falsification_questions, what_a_no_means, contrary_evidence from prospecting_hypotheses where id = $1` |
| 7 | What did the buyer say | `BuyerInputData.raw_buyer_language`, human-confirmed and unsuperseded (`selectConfirmedBids`), plus `ConversationDisposition.buyer_language` on confirmed rows; a correction is a new row carrying `supersedes_id`, the old row is never edited (GAP_BID_IMMUTABLE) | Sprint 4 (e2e steps 5 and 6) | `select b.type, b.raw_buyer_language, b.source, b.captured_at from buyer_input_data b where b.hypothesis_id = $1 and b.human_confirmed and not exists (select 1 from buyer_input_data s where s.supersedes_id = b.id) order by b.captured_at` |
| 8 | Was the problem confirmed | `prospecting_hypotheses.status` (confirmed, partially_confirmed, rejected) and `resolution->>'problem'`, decided by the newest human-confirmed problem_* disposition; `resolution->'dispositionIds'` names the rows, `resolution->>'confidence'` the score (email 60 or call 70, +15 quote, +10 root cause, cap 95, partial minus 20) | Sprint 4 (e2e step 5: confirmed at 85) | `select status, resolution->>'problem' as problem, resolution->>'confidence' as confidence, resolution->'dispositionIds' as by_dispositions, resolved_at from prospecting_hypotheses where id = $1` |
| 9 | Was root cause confirmed | `resolution->>'rootCause'` (confirmed when a confirmed root_cause BID sits under a confirmed or partial problem; orphan when it has no problem to attach to; unknown otherwise), the `root_cause_class` on the confirmed disposition, and the root_cause BID rows | Sprint 4 (e2e step 5) | `select h.resolution->>'rootCause' as root_cause, d.root_cause_class, b.raw_buyer_language from prospecting_hypotheses h left join conversation_dispositions d on d.hypothesis_id = h.id and d.human_confirmed left join buyer_input_data b on b.hypothesis_id = h.id and b.type = 'root_cause' and b.human_confirmed where h.id = $1` |
| 10 | Was impact acknowledged or quantified | `resolution->>'impact'` (none, acknowledged, quantified) with `resolution->'quantified'` (value, unit, bidIds) from confirmed impact or metric BIDs carrying `numeric_value` and `unit`; `impact_class` on the confirmed disposition | Sprint 4 (table and scoring shipped; the e2e records no impact BID, so the run proves `impact: none`, and the unit suite proves acknowledged and quantified) | `select h.resolution->>'impact' as impact, h.resolution->'quantified' as quantified, b.raw_buyer_language, b.numeric_value, b.unit from prospecting_hypotheses h left join buyer_input_data b on b.hypothesis_id = h.id and b.type in ('impact', 'metric') and b.human_confirmed where h.id = $1` |
| 11 | What happens next | the latest `RoutingDecision.action` and its rule; after a disposition, the class's `nextAction` in the effects table (call_now, nurture, research_required, one_off_email, do_not_contact) and `metadata.resumeAt` for timing, which the assembler reads (e2e step 8) | Sprint 2 (routing) + Sprint 4 (disposition inputs) | `select action, lane, rule_id, explain from routing_decisions where persona_id = $1 order by created_at desc limit 1` |
| 12 | What did the system learn | `src/lib/gap/learning/{metrics,query}.ts` (hypothesis resolution rate, precision, problem resonance, root-cause/impact acknowledgment and quantification, problem-to-meeting, meeting-to-qualified-problem, each `{ value, n, numerator, denominator }`), broken down by problem family, persona, signal type, TAM tier, sequence family/version, channel and sender; the disposition distribution and signal yield ride along | Sprint 5 (e2e: docs/gap/sprint5-e2e-latest.md) | `GET /api/gap/learning`, or `buildLearningReport(prisma)` directly |

## 15. Owner decisions and open items surfaced by Phase 0
- GO for Sprint 1 (this document is the spec; the branch is `feat/gap-os-phase0`).
- Public repo `YardFlow-Hitlist` commits `eventops/.env.production`: check for live secrets and rotate.
- Decommission the dormant GTM-YardFlow Vercel project (`gtm-yard-flow`) and the Railway project `innovative-ambition` (YardFlow-Hitlist, worker, Postgres, Redis): still running and billing; Quiver already says kill.
- Put `yardflow-hubspot/top100` under version control, or move its contracts and scripts into this repo under `scripts/gap/top100/`; it is the live GAP practice and it is unversioned.
- Reconcile `data/claims_registry.json` with CLAIMS.md (CR-034..040); S3 makes the snapshot in this repo the single source.
- Verify the live effect of clawd's `hubspot_autopush` STAGE_MAP before any GAP HubSpot write ships.
- The `gap-selling-outbound` skill named in the operating audit is still unwritten; this document is its substrate.
- Sprint 7 needs the 2026-08-19 autonomy halt reversed by one POST; nothing here reverses it.

## 16. Provenance
Read this session: the draft spec and bootstrap prompt (Downloads); GTM-YardFlow via the GitHub API and a scratch shallow clone; `modex-gtm` at 184846d1 (schema, queue, email, hubspot, pounce, revops, source-backed, feature flags, tests); `clawd-control-plane` at 1aa8ca4 (reply scanner, autopush, suppression contract, autonomy, migrations); `yardflow-hubspot/top100` (contracts, audit, plan, journal, scripts, data); `war-room/data/pics` and `src/lib/pic/types.ts`; HubSpot properties, seats and the Sequences API via the MCP and the private-app token (reads only); the vault ledger, daily notes and the Quiver Codex. Companion design notes (read-only inputs): `~/.claude/plans/pasted-content-id-4e2d-yardflow-wondrous-newt.md`, `...-agent-plan-domain.md` (7,893 words: models, triggers, backfill, tests) and `...-agent-aplan-routing-1cfe807b619cd2f7.md` (revision 2 plus the section 10 Top100 delta: rules, compiler port, reply poller, enrollment modes). Where the two agents disagreed, the lead ruled: `hubspot_sequence_id` lives on the family (domain); a `do_not_contact` disposition goes through the unsubscribe helper that also sets `Persona.do_not_contact` (routing), because the modex suppression leg reads that column; the claims source is the committed snapshot with a parity script (both), not a live read of an unversioned file. Four reconnaissance agents (domain, methodology, HubSpot, quality) and two design agents (domain model, routing and gates) contributed; every cited line above was re-opened by the lead before it drove a decision.
