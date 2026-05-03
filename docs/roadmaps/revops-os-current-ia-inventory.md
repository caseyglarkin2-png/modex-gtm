# RevOps OS Current IA Inventory

**Status:** Sprint 0 baseline  
**Source:** current screenshot, `src/components/sidebar.tsx`, `src/components/command-search.tsx`, `src/app` route tree, and `src/lib/revops-ia/current-state.ts`.

## Current Sidebar Groups

- Core
- Outreach
- Field
- Pipeline
- Creative

## Canonical Future Modules

| Module | Primary route | Purpose |
|---|---:|---|
| Home | `/` | Daily cockpit, priorities, alerts, campaign health, and proof status. |
| Accounts | `/accounts` | Account command center and account list. |
| Contacts | `/contacts` | People, enrichment, readiness, and relationship context. |
| Campaigns | `/campaigns` | Year-round motions; waves and phases live inside campaigns. |
| Engagement | `/engagement` | Buyer response, inbox, hot accounts, microsite sessions, and engagement triage. |
| Work Queue | `/queue` | Executable operator tasks, captures, approvals, retries, and stuck jobs. |
| Content Studio | `/studio` | Generated content, source assets, asset library, prompts, and send readiness. |
| Pipeline | `/pipeline` | Opportunities, meetings, activities, stage movement, and history. |
| Analytics | `/analytics` | Campaign/revenue performance, reporting, quarterly review, and attribution. |
| Ops | `/ops` | Proof ledger, cron health, generation metrics, provider health, and admin controls. |

## Duplicate-Module Scorecard

Baseline score before consolidation:

| Classification | Count | Meaning |
|---|---:|---|
| Keep top-level | 6 | Already maps to a durable module. |
| Hidden core | 3 | Core route/concept missing from current sidebar. |
| Duplicate | 4 | Top-level item overlaps another module and should consolidate. |
| Should be tab | 11 | Useful surface, but belongs inside a canonical module or global action. |
| Legacy artifact | 1 | MODEX-specific or campaign-specific surface promoted too high. |

## Current Sidebar Disposition

| Section | Current label | Current route | Classification | Canonical owner | Future disposition |
|---|---|---:|---|---|---|
| Core | Dashboard | `/` | Keep top-level | Home | Keep as Home. |
| Core | Accounts | `/accounts` | Keep top-level | Accounts | Keep as Accounts. |
| Core | Personas | `/personas` | Should be tab | Contacts | Convert to Contacts saved view or legacy alias. |
| Outreach | Outreach Waves | `/waves` | Duplicate | Campaigns | Move into Campaign Phases/Waves. |
| Outreach | Campaigns | `/campaigns` | Keep top-level | Campaigns | Keep as Campaigns. |
| Outreach | Campaign HQ | `/waves/campaign` | Legacy artifact | Campaigns | Fold into MODEX campaign saved view. |
| Outreach | Generation Queue | `/queue/generations` | Duplicate | Work Queue / Content Studio | Move to System Jobs and/or Studio Queue. |
| Outreach | Generated Content | `/generated-content` | Duplicate | Content Studio | Move to Studio Library / Send Readiness. |
| Outreach | Meeting Briefs | `/briefs` | Should be tab | Content Studio / Accounts | Move to Asset Library and Account Assets. |
| Outreach | Search Strings | `/search` | Should be tab | Content Studio | Move to Asset Library. |
| Outreach | Actionable Intel | `/intel` | Should be tab | Content Studio / Campaigns | Move to Asset Library or Campaign Intel. |
| Field | Mobile Capture | `/capture` | Should be tab | Quick Capture / Work Queue | Keep as global mobile action feeding Work Queue and timelines. |
| Field | Jake Queue | `/queue` | Duplicate | Work Queue | Keep route as canonical Work Queue; rename product concept. |
| Field | Audit Routes | `/audit-routes` | Should be tab | Content Studio / Accounts | Move to Asset Library and Account Assets. |
| Field | QR Assets | `/qr` | Should be tab | Content Studio / Accounts | Move to Asset Library and Account Assets. |
| Pipeline | Pipeline Board | `/pipeline` | Keep top-level | Pipeline | Keep as Pipeline. |
| Pipeline | Activities | `/activities` | Should be tab | Pipeline | Move under Pipeline Activities. |
| Pipeline | Meetings | `/meetings` | Should be tab | Pipeline | Move under Pipeline Meetings. |
| Pipeline | Analytics | `/analytics` | Keep top-level | Analytics | Keep as Analytics. |
| Pipeline | Quarterly Review | `/analytics/quarterly` | Should be tab | Analytics | Move under Analytics Quarterly. |
| Pipeline | Cron Health | `/admin/crons` | Should be tab | Ops | Move under Ops Cron Health. |
| Creative | Creative Studio | `/studio` | Keep top-level | Content Studio | Keep route as canonical Content Studio; rename product concept. |

## Hidden-Core Routes And Concepts

| Route/concept | Canonical owner | Future disposition |
|---|---|---|
| `/contacts` | Contacts | Promote to top-level navigation. |
| `/engagement` | Engagement | Create as first-class buyer-response workspace. |
| `/ops` | Ops | Create as first-class system/proof workspace. |

## Route Disposition Matrix

| Current route | Canonical owner | Disposition |
|---|---|---|
| `/capture` | Quick Capture / Work Queue | Keep as a mobile-first global action; feed Work Queue/Captures and account timelines. |
| `/for` | Content Studio / Engagement | Treat as public asset index or asset type. |
| `/for/[account]` | Content Studio / Accounts / Engagement | Treat as account/campaign asset with engagement analytics. |
| `/for/[account]/[person]` | Content Studio / Accounts / Engagement | Treat as personalized asset with engagement analytics. |
| `/proposal/[slug]` | Content Studio / Campaigns / Engagement | Treat as proposal asset with engagement analytics. |
| `/contacts` | Contacts | Promote to top-level canonical module. |
| `/campaigns/[slug]/analytics` | Campaigns / Analytics | Keep reachable from Campaign Analytics; roll up into global Analytics. |
| `/api/proof/*` | Ops / Proof Ledger | Keep as deterministic proof seed routes. |

## Validation Convention

Non-UI tasks still require proof. Each backend/admin task must name:

- route or API touched,
- seed or fixture,
- assertion,
- command,
- artifact,
- commit boundary.
