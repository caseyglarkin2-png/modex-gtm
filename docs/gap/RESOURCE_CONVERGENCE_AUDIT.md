# GAP V2 resource convergence audit

STATUS: SHIPPED 2026-10-02 (V2 decision compression + resource convergence; see STABLE_BASELINE.md V2)
<!-- verified:2026-10-02 -->

Read-only audit of every account-relevant resource in modex-gtm at `39f8a619`. Five parallel inventories (account
command center + Agent Intel; Content Studio; engagement + commercial history; Work Queue / Analytics / Discovery;
GAP account intelligence) plus a read-only production probe of the golden accounts.

**Rule:** many sensors, one canonical account context, one seller decision cockpit, specialized workbenches one click
deeper. Every concept has ONE canonical state; every other resource is an input, a view or an output.

Classes: **CANONICAL INPUT** (primary data GAP should read) · **DERIVED VIEW** (a projection; rebase on canonical
state) · **EXECUTION ASSET** (something sent / shown to a buyer) · **SYSTEM / OPERATIONS** · **LEGACY / SUPERSEDED**
(an old score or recommendation: never decision authority).

Placement: NOW · BRIEF · SOURCES · PEOPLE · RELATIONSHIP · ASSETS · HISTORY · SYSTEM ONLY.

## The convergence map

| Resource | Class | Source of data | What it knows | Trust | GAP reads today | Should | Where | Conflict | Adapter |
|---|---|---|---|---|---|---|---|---|---|
| Account.best_intro_path | CANONICAL INPUT | Account column (human / seed) | named warm route ("Mark Shaughnessy -> Danone CSCO intro") | human, undated | no | yes | NOW (relationship line), RELATIONSHIP | GAP work-source relationship_context is a disjoint store | relationship adapter |
| Account.warm_intro (0-5) | LEGACY / SUPERSEDED | seeded int | a score dimension | seeded MODEX-era | no | no (only as "a warm path exists" corroboration of best_intro_path) | SYSTEM ONLY | score dims | none |
| Persona.intro_path / intro_route / attendance_signal | CANONICAL INPUT | Persona columns (scripts) | per-person route ("Mark -> Heiko / CSCO office"), how found | human / script, undated | no (zero reads anywhere in src/) | yes | PEOPLE, RELATIONSHIP | none | people adapter |
| Warm-intro-only restriction (Dannon) | CANONICAL INPUT (policy) | `src/lib/studio/guardrails.ts` (`WARM_INTRO_ONLY_ACCOUNTS`, substring match on the account name; callers: ai/sequence, studio/asset-pack, studio/handoff, signal-bridge/map-export). Echoed, not owned, by Account.best_intro_path, Account.outreach_status, Account.warm_intro, Persona.intro_route and the Dannon microsite data | cold outreach blocked, intro only | human rule | **no: no GAP gate, no legacy send guard, no Outbox or drip check reads it** | yes: one authority read by GAP motion, the GAP action-time check and the legacy send / Outbox / drip writers | NOW (NEXT is the intro ask) | six places echo the rule; only Studio and the AI sequence route enforce it | promote to one GAP-owned policy module; guardrails delegates |
| GapWorkSource / Member.relationship_context | CANONICAL INPUT | GAP tables | conference / referral / newsletter context per person | human | yes | yes | RELATIONSHIP, PEOPLE | disjoint from legacy intro fields | merged in relationship adapter |
| MicrositeEngagement | CANONICAL INPUT (PRIVATE) | `micrositeEngagement` (session x path) | sections, CTA ids, scroll, duration, variant, person slug, bot flag | first-party behavioural, real time | no | yes, seller-side only | NOW (only recent + material), BRIEF (Private engagement) | legacy heat score (authority) | engagement adapter, never in copy |
| Microsite heat / engagementScore / high-intent label | DERIVED VIEW | `microsites/analytics.ts` | 0-100 score, Hot/Warm/Watch | heuristic | no | facts only (counts, CTA, ROI read, last date); no score | BRIEF | GAP has no score; keep it that way | none (no lead score) |
| Meeting | CANONICAL INPUT | `meeting` (hand entered) | status, date, deal id, objective, next step | human, often stale | no | yes | HISTORY, commercial state | GAP capture meetings | history adapter |
| Activity | CANONICAL INPUT (mixed) | `activity` (manual, CTA logging, drip, legacy sends) | touches, outcomes, next steps | mixed | no | yes, as history (not tasks) | HISTORY | drip/legacy follow-ups act as tasks (see Work Queue) | history adapter |
| MobileCapture | CANONICAL INPUT | `mobileCapture` (field / conference) | intent, need trigger, next step | human field notes, unconfirmed | no | yes, as relationship / history (never buyer truth) | RELATIONSHIP, HISTORY | GAP capture pipeline (BID) | history adapter |
| OperatorOutcome | CANONICAL INPUT | `operatorOutcome` | human outcome label per send/content | human | no | yes, as history | HISTORY | legacy learning loop NBA | history adapter |
| EmailLog / EmailThread / InboundMessage | CANONICAL INPUT | GAP + legacy send paths, mailbox | sends, threads, replies | primary | yes (routing, replies) | yes | HISTORY, RELATIONSHIP (existing thread) | opens/clicks are private noise | timeline |
| SendJob / SendJobRecipient | CANONICAL INPUT | legacy bulk path | who got which generated content | primary | no | yes, as history + asset "last sent" | HISTORY, ASSETS | none | history + asset adapters |
| HubSpot open deals | CANONICAL INPUT (authority) | live HubSpot | open deal exists, stage | primary | yes | yes | NOW (motion), BRIEF | Account.pipeline_stage (legacy) | existing |
| BuyerInputData (confirmed) | CANONICAL INPUT (authority: buyer truth) | GAP | buyer's own words | human confirmed | yes | yes | NOW (KNOW/THINK/LEARN), BRIEF | none | existing |
| buildAccountTimeline | DERIVED VIEW | `account-command-center.ts:230` | one merged timeline over activity / email / meeting / microsite / capture / send / outcome | deterministic | no | **reuse** (no new history table) | HISTORY (BRIEF: last few) | its "High-intent" label must stay internal | reuse in history adapter |
| Persona (core) | CANONICAL INPUT | `persona` | people, titles, email, DNC, lane, HubSpot id | primary | yes | yes | PEOPLE, NOW (WHO) | legacy suggested recipients; cockpit `rankCandidates` vs brief owner pick | one people projection |
| AccountContactCandidate | CANONICAL INPUT | agent broker payloads | staged contacts | third party | yes | yes | PEOPLE | none | existing |
| Contact / committee coverage, buyer map cards | LEGACY / SUPERSEDED | sidecar card STRINGS, regex-parsed | counts, lanes, names | string-parsed | no | lanes only (from Persona.persona_lane), not the cards | PEOPLE | coverage is recomputed from the people projection | people adapter |
| Suggested recipient sets (operator / executive / transformation) | LEGACY / SUPERSEDED (authority) | title regex + readiness score | top-4 per lane | heuristic | no | lanes as a VIEW of the people projection, never the ranking | PEOPLE | GAP WHO | lane classification only |
| Recipient readiness score | LEGACY / SUPERSEDED | formula over persona fields | 0-100 | computed | no | no | SYSTEM ONLY | GAP reachability | none |
| Account score dims / ICP / band / priority_score | LEGACY / SUPERSEDED | seeded 0-5 ints | MODEX-era scores | stale | tier/band only | no new use (no lead score) | SYSTEM ONLY | YardFlow fit (GAP) | none |
| Account Next Best Action / Learning-loop recommendation | LEGACY / SUPERSEDED (authority) | `account-command-center.ts:55` | next step | rules over stale fields | no | no: GAP Motion is the authority | legacy page shows GAP NEXT | four competing next steps | legacy page reads GAP NEXT |
| Agent Intel cards (research summary, best angle, drafting signals) | DERIVED VIEW (advisory) | clawd + sales-agent sidecar, cached 6h | free-text summaries | LLM / third party; "fresh" = recently fetched | no | as advisory diagnostics only | SOURCES (advisory) | GAP account intelligence | none (never canonical truth) |
| Agent Intel nextActions / recommended angle / signal confidence | LEGACY / SUPERSEDED | canned strings / hard-coded confidence | | | no | no | SYSTEM ONLY | GAP NEXT | none |
| Account.why_now / next_action / primo_angle / notes | LEGACY / SUPERSEDED (human notes) | Account columns, MODEX-era | old reasons and next steps | stale | no | next_action: shown as a legacy human note on HISTORY only; never NEXT | HISTORY (dated "legacy note") | GAP NEXT, WHY NOW | none |
| Meeting brief (JSON + MeetingBrief) | DERIVED VIEW (stale thesis) | static March JSON (15 accounts) | why now, likely pain, open questions | hand / LLM written once | no | **rebase**: the meeting brief becomes a projection of current GAP intelligence; the legacy JSON is shown only as dated legacy notes | ASSETS (Meeting brief), BRIEF | GAP thesis | GAP meeting-brief projection |
| Read Brief Aloud (`/api/voice/preview`) | SYSTEM / OPERATIONS (capability) | ElevenLabs TTS | speech from text | n/a | no | reuse the endpoint over the GAP projection | NOW / BRIEF (Listen) | the legacy aloud reads the stale JSON | Listen control |
| `/api/voice` call-script LLM | LEGACY / SUPERSEDED | ungrounded LLM, off-canon prompt | | | no | no | SYSTEM ONLY | GAP call pack | none |
| GeneratedContent | EXECUTION ASSET | Studio generation | emails, one-pagers, sequences | LLM, versioned | no | yes, as an asset (type, version, created, last sent) | ASSETS | none | asset adapter |
| Microsites / demo packs / ForPage | EXECUTION ASSET | registry + packs + ForPage | the account's prospect-facing pages | hand authored | content only | yes, as an asset with engagement | ASSETS | none | asset adapter |
| Audit routes / QR assets / search strings | LEGACY / SUPERSEDED fixtures | static March JSON | UTM'd routes (modex2026), query patterns | stale, off-voice | no | search strings: query-pattern input to research focus only; audit/QR: listed as legacy assets, never recommended | ASSETS (legacy) / SYSTEM ONLY | none | asset adapter flags staleness |
| PlaybookBlock | DERIVED VIEW (methodology) | Studio | reusable copy blocks + outcome scores | performance-scored | no | reference only, never account fact | SYSTEM ONLY | none | none |
| Campaign / OutreachWave / campaign_tag | CANONICAL INPUT (provenance) | legacy tables | how an account/person entered motion | human | no | yes, as work-source / history context, never fact | HISTORY, RELATIONSHIP | GAP work sources | history adapter |
| Legacy Work Queue (`/queue`) | DERIVED VIEW (second task list) | render-time from Activity follow-ups, captures, approvals, jobs | "My Work" follow-ups (drip, CTA, legacy send) | completions not persisted | no | becomes an execution view: an account GAP decides shows GAP's NEXT, not a competing follow-up | SYSTEM ONLY (ops tabs stay) | GAP NEXT | queue reads GAP decision per account |
| Analytics | SYSTEM / OPERATIONS | EmailLog, sends, outcomes | cross-account reporting | derived | no | no (stays reporting; no score into decisions) | SYSTEM ONLY | /gap/learning | label GAP vs legacy sends (debt) |
| Discovery corridor prospects (JSON) | CANONICAL INPUT (sensor) | frozen June snapshot | 7,023 net-new facilities | stale snapshot | no | as candidate intake through GAP Candidates (on human pull), never a second research queue | SYSTEM ONLY | GAP Candidates | debt (snapshot frozen) |
| Discovery Outbox (DraftQueueItem) | EXECUTION ASSET | shared table | Clawd / warm drafts | primary | yes (GAP stamped rows) | GAP rows already guarded; unstamped rows are outside GAP | SYSTEM ONLY | GAP holds not checked for unstamped rows (outreach paused in prod) | debt |

## Source-of-truth decisions

| Question | Canonical answer | Inputs (never independent answers) |
|---|---|---|
| WHAT SHOULD I DO? | GAP Motion (`motion/approach.ts`) -> NEXT | Agent Intel nextActions, account NBA, Work Queue follow-ups, Studio suggestions: advisory or execution views |
| WHO SHOULD I CONTACT? | the unified people projection's primary person, chosen by GAP Motion | suggested recipient sets, readiness score, buyer map card, cockpit ranking |
| WHAT IS HAPPENING? | GAP account intelligence (facts / modeled / hypotheses / unknowns) | legacy research summary, meeting brief JSON, one-pagers, Agent Intel |
| WHAT RELATIONSHIP EXISTS? | the relationship projection (intro paths, work sources, conversations, threads, meetings, captures) | Account.warm_intro score |
| WHAT HAPPENED? | the account timeline (`buildAccountTimeline` over primary events) | legacy NBA, activity follow-ups |
| WHAT ASSET EXISTS? | the asset projection (generated content, microsites, packs, meeting brief) | Studio metrics |
| IS THERE A DEAL? | live HubSpot open deals | Account.pipeline_stage, Meeting.hubspot_deal_id |

## Defects found by the audit (in scope where they block convergence)

- **Dannon warm-intro-only is invisible to GAP and to most send paths** (safety): the rule lives in `studio/guardrails.ts` and only Studio, the AI sequence route and the map export read it. GAP motion, the GAP action-time check, the legacy send guards, the Outbox writers and the campaign drip do not. Corrected by the RevOps reviewer (the first draft of this audit said the rule was hard-coded in one route).
- **Two WHO answers inside GAP**: the brief's likely-owner pick vs the cockpit's `rankCandidates`. V2's NOW uses one.
- **The legacy Work Queue can contradict GAP NEXT** (drip / CTA / legacy-send follow-ups for held accounts; completions not persisted).
- **Meeting briefs hold a stale March thesis** and feed legacy generation prompts (`getAccountContext`).
- Recorded, not V2 scope: Discovery snapshot frozen since June; unstamped Outbox drafts are not checked against GAP holds (outreach paused in production); Analytics mixes GAP and legacy sends; legacy page small defects (empty best_intro_path editor unreachable, dead "Create account asset" NBA, coverage gaps never empty, send-blocked contacts still suggested).
