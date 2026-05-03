# RevOps OS Product Consolidation + A+ Sprint Roadmap

**Status:** Draft for approval  
**Review:** Subagent reviewed twice. First pass A- / 91. Second pass A / 96, with one route-clarity patch. After adding canonical primary routes and acceptance-card strictness, expected grade is A+ / 98-99.  
**Purpose:** After the one-pager acceptance plan ships, stop adding isolated modules. Redesign the app into the best operator-facing RevOps OS: a consolidated operating system where Casey can see what matters, decide what to do next, create/send assets, track engagement, move pipeline, and prove every sprint with UI evidence.

## North Star

The best RevOps OS is not a menu of pages. It is a daily operating loop:

1. See what matters today.
2. Understand the account, contact, and campaign context.
3. Create or choose the right asset.
4. Send or take the next action safely.
5. Capture buyer response and engagement.
6. Move pipeline or create follow-up work.
7. Prove what happened with evidence.

## Current User-View Audit

Source evidence: current screenshot plus `src/components/sidebar.tsx`, `src/components/command-search.tsx`, and the `src/app` route tree.

### Current Sidebar Reality

The current sidebar groups are:

- Core
- Outreach
- Field
- Pipeline
- Creative

Current top-level sidebar items are:

- Dashboard
- Accounts
- Personas
- Outreach Waves
- Campaigns
- Campaign HQ
- Generation Queue
- Generated Content
- Meeting Briefs
- Search Strings
- Actionable Intel
- Mobile Capture
- Jake Queue
- Audit Routes
- QR Assets
- Pipeline Board
- Activities
- Meetings
- Analytics
- Quarterly Review
- Cron Health
- Creative Studio

### Current Product Problems

- Sidebar exposes implementation artifacts as first-class product modules.
- `CommandSearch` maintains a separate stale page list and must be consolidated with the same canonical nav config as Sidebar.
- `/contacts` exists and is operational but is missing from the sidebar despite being a core RevOps object.
- Account detail already has partial account-command-center surfaces: Overview, Personas, Waves, Brief, Routes, and Activity. The roadmap should upgrade this surface, not rebuild it from scratch.
- Campaign detail already shows linked waves, recent sends, settings, and analytics entry points. The roadmap should consolidate these into a durable campaign workspace.

### Duplicate Or Confusing Modules

- **Campaigns / Campaign HQ:** Campaign HQ is MODEX-specific and should become a campaign detail or saved view.
- **Generation Queue / Jake Queue:** one is system work and one is operator work. The best product has one Work Queue with typed views.
- **Generated Content / Creative Studio:** these overlap. The best product has one Content Studio with generated assets, source assets, generation queue, publish state, and send readiness.
- **Outreach Waves / Campaigns:** waves are campaign phases, not a separate top-level product module.
- **Meeting Briefs / Search Strings / Actionable Intel / Audit Routes / QR Assets:** these are account or campaign assets, not permanent top-level modules.
- **Activities / Meetings / Pipeline Board:** these are Pipeline views.
- **Analytics / Quarterly Review:** Quarterly Review is an Analytics view.
- **Cron Health / Generation Metrics:** these are Ops views, not Pipeline views.

### Missing First-Class Concepts

- **Engagement:** replies, opens/clicks where available, bounces/failures, notifications, microsite/proposal sessions, and hot accounts.
- **Quick Capture:** mobile capture should remain fast and global, but feed Work Queue, Account, Contacts, and Engagement.
- **Proof Ledger:** UI and click-test evidence should be visible as delivery truth.
- **Asset Library:** `/for/*`, `/proposal/*`, briefs, QR assets, audit routes, search strings, and generated content need one ownership model.

## Best-Version Product IA

The product should consolidate into 10 durable operator modules.

### Canonical Module Primary Routes

- Home: `/`
- Accounts: `/accounts`
- Contacts: `/contacts`
- Campaigns: `/campaigns`
- Engagement: `/engagement`
- Work Queue: `/queue`
- Content Studio: `/studio`
- Pipeline: `/pipeline`
- Analytics: `/analytics`
- Ops: `/ops`

Legacy routes may remain as aliases, redirects, or saved views, but every legacy route must declare one canonical owner, one canonical destination, and one proof test showing old and new paths both work.

### Module Definitions

1. **Home**
   - Daily cockpit, priorities, alerts, active campaign health, proof status.

2. **Accounts**
   - Account command center and account list.

3. **Contacts**
   - People, enrichment, readiness, relationship context.

4. **Campaigns**
   - Year-round motions. Waves and phases live inside campaigns.

5. **Engagement**
   - Inbox/replies, opens/clicks where available, bounces/failures, notifications, microsite sessions, hot-account activity, engagement triage.

6. **Work Queue**
   - Executable operator tasks, follow-ups, captures, approvals, retries, stuck jobs.

7. **Content Studio**
   - Generated content, creative studio, source assets, prompts, asset library, microsites/proposals, one-pagers, briefs, QR/routes, publish/send readiness.

8. **Pipeline**
   - Opportunities, meetings, activities, stage movement, history.

9. **Analytics**
   - Campaign/revenue performance, email/engagement reporting, quarterly review, attribution.

10. **Ops**
    - Proof ledger, cron health, generation metrics, provider health, admin controls.

### Quick Capture

Quick Capture is not a standalone module. `/capture` remains a mobile-first/global action from Home, Account, Contact, Campaign, and Work Queue.

Captured records should appear in:

- Work Queue / Captures
- Account timelines
- Contacts where person context exists
- Engagement when the capture represents a buyer signal

## Route Consolidation Map

| Current route | Canonical owner | Future disposition |
|---|---|---|
| `/` | Home | Keep |
| `/accounts` | Accounts | Keep |
| `/accounts/[slug]` | Accounts | Keep and upgrade into command center |
| `/personas` | Contacts | Saved view or legacy alias |
| `/contacts` | Contacts | Promote to top-level nav |
| `/campaigns` | Campaigns | Keep |
| `/campaigns/new` | Campaigns | Keep |
| `/campaigns/[slug]` | Campaigns | Keep and upgrade |
| `/campaigns/[slug]/analytics` | Campaigns + Analytics | Campaign Analytics tab; roll up globally |
| `/waves` | Campaigns | Campaign phases/tabs or alias |
| `/waves/campaign` | Campaigns | MODEX saved view or alias |
| `/capture` | Quick Capture | Keep as global/mobile action |
| `/queue` | Work Queue | Keep as canonical Work Queue |
| `/queue/generations` | Work Queue + Content Studio | System Jobs or Studio Queue view |
| `/generated-content` | Content Studio | Studio Library / Send Readiness alias |
| `/studio` | Content Studio | Keep as canonical Content Studio |
| `/briefs` | Content Studio + Accounts | Asset Library and Account Assets alias |
| `/search` | Content Studio | Asset Library alias |
| `/intel` | Content Studio + Campaigns | Asset Library / Campaign Intel alias |
| `/audit-routes` | Content Studio + Accounts | Asset Library and Account Assets alias |
| `/qr` | Content Studio + Accounts | Asset Library and Account Assets alias |
| `/for` | Content Studio + Engagement | Public asset index / asset type |
| `/for/[account]` | Content Studio + Accounts + Engagement | Account/campaign asset with engagement analytics |
| `/for/[account]/[person]` | Content Studio + Accounts + Engagement | Personalized asset with engagement analytics |
| `/proposal/[slug]` | Content Studio + Campaigns + Engagement | Proposal asset with engagement analytics |
| `/pipeline` | Pipeline | Keep |
| `/activities` | Pipeline | Pipeline Activities alias |
| `/meetings` | Pipeline | Pipeline Meetings alias |
| `/analytics` | Analytics | Keep |
| `/analytics/emails` | Analytics + Engagement | Analytics tab/view |
| `/analytics/quarterly` | Analytics | Quarterly tab alias |
| `/admin/crons` | Ops | Ops Cron Health alias |
| `/admin/generation-metrics` | Ops | Ops Generation Metrics alias |

Engagement is backed by `/api/notifications`, email webhook routes, email logs, send job recipient state, and microsite tracking.

## Ground-Source Truth Rules

The roadmap file is the source of truth only when backed by evidence.

Every sprint task must be expanded into the full acceptance card before implementation starts. A task list item is roadmap-ready only when all fields below are filled in.

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

Rules:

- A task is not atomic if it changes more than one module without an alias/test proving old and new paths both work.
- No task is done unless click tests prove the user-visible path or validation artifacts prove non-UI behavior.
- Every sprint closes with lint, typecheck, affected unit tests, affected Playwright tests, screenshots/traces, proof ledger update, and `executed > 0`, `skipped = 0` for proof suites.
- Sidebar and CommandSearch must not maintain separate route truth.
- Legacy routes may stay, but every route needs one canonical owner and one disposition.

## Sprint 0: UI Truth Audit + Proof Ledger

**Goal:** make current app layout measurable before changing it.  
**Demo:** Ops/Proof Ledger shows route inventory, screenshot evidence, duplicate module map, hidden-core route list, and current click-test status.

### Tasks

1. **S0.1 Generate current-state IA evidence**
   - Current route(s): `src/components/sidebar.tsx`, `src/components/command-search.tsx`, `src/app`
   - Canonical route/view: Ops / Proof Ledger
   - Seed/fixture: current source files
   - User assertion: inventory flags sidebar-only, command-only, route-only, and duplicate labels
   - Test command: unit or doc-generation test for inventory parser
   - Required artifact: route/nav inventory markdown
   - Commit boundary: inventory only

2. **S0.2 Add Playwright nav smoke for current sidebar**
   - Current route(s): every sidebar href
   - Canonical route/view: current routes
   - Seed/fixture: existing app data
   - User assertion: each nav click reaches route and sees heading or primary content
   - Test command: `npx playwright test tests/e2e/nav-inventory.spec.ts`
   - Required artifact: trace/screenshots
   - Commit boundary: e2e only

3. **S0.3 Add baseline UI screenshots**
   - Current route(s): sidebar, command palette, Account detail, Campaign detail, Studio, Generated Content, Capture, Contacts
   - Canonical route/view: Proof Ledger
   - Seed/fixture: current database/test data
   - User assertion: current user-view layout is captured before consolidation
   - Test command: Playwright screenshot spec
   - Required artifact: desktop expanded sidebar, collapsed rail, mobile sheet, command palette, representative route screenshots
   - Commit boundary: screenshot/proof config only

4. **S0.4 Add proof ledger document/template**
   - Current route(s): docs
   - Canonical route/view: Ops / Proof Ledger
   - Seed/fixture: one-pager proof output and nav audit output
   - User assertion: first entry records current one-pager proof and nav audit status
   - Test command: doc validation or manual proof review
   - Required artifact: `docs/roadmaps/revops-os-proof-ledger.md`
   - Commit boundary: doc only

5. **S0.5 Add duplicate-module scorecard**
   - Current route(s): sidebar and command palette
   - Canonical route/view: this roadmap + proof ledger
   - Seed/fixture: current inventory
   - User assertion: each item is classified as duplicate, legacy artifact, hidden-core route, should-be-tab, or should-remain-top-level
   - Test command: doc validation
   - Required artifact: scorecard table
   - Commit boundary: doc only

6. **S0.6 Add route disposition matrix**
   - Current route(s): `/capture`, `/for`, `/proposal`, `/contacts`, `/campaigns/[slug]/analytics`, proof/API seed routes
   - Canonical route/view: route consolidation map
   - Seed/fixture: route tree
   - User assertion: every route has owner and future disposition
   - Test command: route inventory validation
   - Required artifact: disposition matrix
   - Commit boundary: doc only

7. **S0.7 Add non-UI validation convention**
   - Current route(s): backend/admin tasks
   - Canonical route/view: proof ledger
   - Seed/fixture: template
   - User assertion: backend tasks still name route/API, seed, assertion, command, and artifact
   - Test command: doc review
   - Required artifact: validation template
   - Commit boundary: doc only

## Sprint 1: Navigation Consolidation Foundation

**Goal:** install new IA without deleting working routes.  
**Demo:** sidebar shows 10 durable modules; legacy routes remain reachable through tabs, aliases, or redirects.

### Tasks

1. **S1.1 Create canonical nav config**
   - Current route(s): Sidebar and CommandSearch
   - Canonical route/view: shared nav config
   - Seed/fixture: canonical module primary routes
   - User assertion: no duplicate hrefs or labels; every sidebar module has one owner
   - Test command: nav config unit test
   - Required artifact: unit output
   - Commit boundary: nav config only

2. **S1.2 Update Sidebar to canonical modules**
   - Current route(s): current sidebar
   - Canonical route/view: 10-module sidebar
   - Seed/fixture: app shell render
   - User assertion: Home, Accounts, Contacts, Campaigns, Engagement, Work Queue, Content Studio, Pipeline, Analytics, Ops are visible
   - Test command: component test + Playwright screenshot
   - Required artifact: sidebar screenshot
   - Commit boundary: sidebar only

3. **S1.3 Replace CommandSearch page list**
   - Current route(s): CommandSearch pages array
   - Canonical route/view: canonical nav/actions plus legacy aliases
   - Seed/fixture: command palette fixture
   - User assertion: command palette finds Contacts, Engagement, Quick Capture, old Personas, old Campaign HQ, and old Generation Queue
   - Test command: command palette component test
   - Required artifact: test output
   - Commit boundary: command search only

4. **S1.4 Define active-match and alias rules**
   - Current route(s): legacy nested routes
   - Canonical route/view: canonical owner highlighting
   - Seed/fixture: `/analytics/quarterly`, `/campaigns/[slug]/analytics`, `/waves/campaign`, `/queue/generations`
   - User assertion: legacy routes highlight the canonical owner without duplicate nav state
   - Test command: active-match helper tests
   - Required artifact: unit output
   - Commit boundary: active-match helper only

5. **S1.5 Add Contacts to top-level nav**
   - Current route(s): `/contacts`
   - Canonical route/view: Contacts
   - Seed/fixture: seeded contacts
   - User assertion: sidebar click opens Contacts
   - Test command: Playwright nav proof
   - Required artifact: screenshot/trace
   - Commit boundary: included in sidebar proof

6. **S1.6 Add minimal Ops shell**
   - Current route(s): `/admin/crons`, `/admin/generation-metrics`
   - Canonical route/view: `/ops`
   - Seed/fixture: existing admin data
   - User assertion: Ops exposes Cron Health and Generation Metrics
   - Test command: Playwright Ops click proof
   - Required artifact: screenshot/trace
   - Commit boundary: Ops shell only

7. **S1.7 Update representative breadcrumbs**
   - Current route(s): representative canonical and legacy routes
   - Canonical route/view: canonical labels
   - Seed/fixture: page render fixtures
   - User assertion: breadcrumbs match the new IA
   - Test command: breadcrumb component tests
   - Required artifact: test output
   - Commit boundary: breadcrumb mapping only

## Sprint 2: Home Daily Cockpit

**Goal:** Home answers "what matters today?"  
**Demo:** Home shows priority work, active campaign status, engagement alerts, send/generation health, upcoming meetings, and proof status.

### Tasks

1. **S2.1 Define Home dashboard data contract**
   - Current route(s): `/`
   - Canonical route/view: Home
   - Seed/fixture: dashboard fixtures
   - User assertion: each Home panel has named data source and empty state
   - Test command: query fixture tests
   - Required artifact: test output
   - Commit boundary: query helper only

2. **S2.2 Add Today panel**
   - Current route(s): `/`
   - Canonical route/view: Home / Today
   - Seed/fixture: overdue actions, engagement alert, failed job, stale account
   - User assertion: operator can see what needs action now
   - Test command: component fixture test
   - Required artifact: screenshot
   - Commit boundary: panel only

3. **S2.3 Add Active Campaigns panel**
   - Current route(s): `/`
   - Canonical route/view: Home / Campaign Health
   - Seed/fixture: generated, ready, sent, replied, blocked campaign states
   - User assertion: active campaigns are scannable from Home
   - Test command: component test
   - Required artifact: screenshot
   - Commit boundary: panel only

4. **S2.4 Add Health strip**
   - Current route(s): `/`
   - Canonical route/view: Home / Health
   - Seed/fixture: send job, generation job, cron/provider health states
   - User assertion: system health issues are visible before work starts
   - Test command: query/component tests
   - Required artifact: screenshot
   - Commit boundary: strip only

5. **S2.5 Add Proof Status card**
   - Current route(s): `/`
   - Canonical route/view: Home / Proof Status
   - Seed/fixture: proof ledger fixture
   - User assertion: latest proof result is visible
   - Test command: component test
   - Required artifact: screenshot
   - Commit boundary: card only

6. **S2.6 Add Home cockpit proof**
   - Current route(s): `/`
   - Canonical route/view: Home
   - Seed/fixture: deterministic Home proof state
   - User assertion: Home route demonstrates the daily cockpit
   - Test command: Playwright Home proof
   - Required artifact: screenshot/trace
   - Commit boundary: e2e only

## Sprint 3: Account Command Center

**Goal:** account detail becomes the single source for an account.  
**Demo:** open one account and see overview, contacts, assets, engagement, tasks, meetings, and pipeline.

### Tasks

1. **S3.1 Add account tab map contract**
   - Current route(s): `/accounts/[slug]`
   - Canonical route/view: Accounts / Account Detail
   - Seed/fixture: seeded account
   - User assertion: existing account tabs evolve into canonical account command tabs
   - Test command: config test
   - Required artifact: test output
   - Commit boundary: tab map only

2. **S3.2 Normalize account tabs**
   - Current route(s): `/accounts/[slug]`
   - Canonical route/view: Overview, Contacts, Assets, Engagement, Tasks, Meetings, Pipeline
   - Seed/fixture: seeded account with related records
   - User assertion: every canonical tab is clickable
   - Test command: Playwright tab click test
   - Required artifact: screenshot/trace
   - Commit boundary: tab shell only

3. **S3.3 Move Meeting Brief into Assets tab**
   - Current route(s): `/briefs`, `/briefs/[account]`
   - Canonical route/view: Account / Assets
   - Seed/fixture: seeded brief
   - User assertion: brief is visible from account and legacy route still works
   - Test command: component + route alias tests
   - Required artifact: screenshot
   - Commit boundary: brief surface only

4. **S3.4 Move Audit Route into Assets tab**
   - Current route(s): `/audit-routes`
   - Canonical route/view: Account / Assets
   - Seed/fixture: seeded audit route
   - User assertion: route copy/open controls remain visible
   - Test command: component/click tests
   - Required artifact: screenshot
   - Commit boundary: audit route surface only

5. **S3.5 Move QR Asset into Assets tab**
   - Current route(s): `/qr`
   - Canonical route/view: Account / Assets
   - Seed/fixture: seeded QR asset
   - User assertion: QR asset is visible from the account
   - Test command: component test
   - Required artifact: screenshot
   - Commit boundary: QR surface only

6. **S3.6 Show account generated content in Assets tab**
   - Current route(s): `/generated-content`
   - Canonical route/view: Account / Assets
   - Seed/fixture: generated content fixture
   - User assertion: account one-pagers/content are visible from account
   - Test command: component test
   - Required artifact: screenshot
   - Commit boundary: generated content account panel only

7. **S3.7 Add account engagement timeline**
   - Current route(s): `/accounts/[slug]`, `/activities`, `/meetings`
   - Canonical route/view: Account / Engagement
   - Seed/fixture: activity, send, capture, meeting fixtures
   - User assertion: account history is visible in one timeline
   - Test command: query/component tests
   - Required artifact: screenshot
   - Commit boundary: timeline only

8. **S3.8 Add account next-best-action CTA**
   - Current route(s): `/accounts/[slug]`
   - Canonical route/view: Account / Overview
   - Seed/fixture: action and no-action account states
   - User assertion: operator sees the next recommended action or an empty state
   - Test command: component tests
   - Required artifact: screenshot
   - Commit boundary: CTA only

9. **S3.9 Add account command center proof**
   - Current route(s): `/accounts/[slug]`
   - Canonical route/view: Account Command Center
   - Seed/fixture: deterministic account proof state
   - User assertion: account route is demoable as one command center
   - Test command: Playwright account proof
   - Required artifact: screenshot/trace
   - Commit boundary: e2e only

## Sprint 4: Contacts Core Workspace

**Goal:** Contacts owns people, enrichment, readiness, and relationship context.  
**Demo:** sidebar opens Contacts; operator filters send-ready contacts, sees enrichment/readiness, and opens account/person context.

### Tasks

1. **S4.1 Convert Personas into Contacts saved view or alias**
   - Current route(s): `/personas`
   - Canonical route/view: Contacts
   - Seed/fixture: persona/contact fixtures
   - User assertion: old Personas path still gets user to the right contact view
   - Test command: route alias and command search tests
   - Required artifact: trace
   - Commit boundary: alias only

2. **S4.2 Add Contacts saved views**
   - Current route(s): `/contacts`
   - Canonical route/view: Contacts
   - Seed/fixture: All, Send Ready, Needs Enrichment, Blocked/Hold, HubSpot Linked, Recently Touched
   - User assertion: operator can filter contacts by readiness state
   - Test command: component/filter tests
   - Required artifact: screenshot
   - Commit boundary: tabs/views only

3. **S4.3 Add contact detail drawer**
   - Current route(s): `/contacts`
   - Canonical route/view: Contacts / Detail
   - Seed/fixture: seeded contact with account, title, email, enrichment, recent engagement
   - User assertion: opening a contact shows enough context to act
   - Test command: component/click tests
   - Required artifact: screenshot
   - Commit boundary: drawer only

4. **S4.4 Add contact-account-campaign cross-links**
   - Current route(s): `/contacts`
   - Canonical route/view: Contacts
   - Seed/fixture: contact linked to account/campaign
   - User assertion: operator can move from contact to account/campaign
   - Test command: Playwright click test
   - Required artifact: trace
   - Commit boundary: links only

5. **S4.5 Add readiness explanation badges**
   - Current route(s): `/contacts`
   - Canonical route/view: Contacts
   - Seed/fixture: send-ready, needs-enrichment, blocked/hold contacts
   - User assertion: readiness is explainable, not just a score
   - Test command: unit/component tests
   - Required artifact: screenshot
   - Commit boundary: badges only

6. **S4.6 Add Contacts proof**
   - Current route(s): `/contacts`, `/personas`
   - Canonical route/view: Contacts
   - Seed/fixture: deterministic contacts proof state
   - User assertion: Contacts is a core workspace
   - Test command: Playwright Contacts proof
   - Required artifact: screenshot/trace
   - Commit boundary: e2e only

## Sprint 5: Campaign Workspace Consolidation

**Goal:** Campaigns replaces Outreach Waves and Campaign HQ as the single campaign surface.  
**Demo:** open a campaign and see phases/waves, target accounts, contacts, content, sends, engagement, meetings, and analytics.

### Tasks

1. **S5.1 Add campaign tab map**
   - Current route(s): `/campaigns/[slug]`
   - Canonical route/view: Campaign detail
   - Seed/fixture: seeded campaign
   - User assertion: campaign workspace has canonical tabs
   - Test command: config/component tests
   - Required artifact: test output
   - Commit boundary: tab map only

2. **S5.2 Move Outreach Waves into Phases tab**
   - Current route(s): `/waves`
   - Canonical route/view: Campaign / Phases
   - Seed/fixture: wave fixture
   - User assertion: waves are visible under campaign and legacy route still works
   - Test command: component + legacy alias tests
   - Required artifact: screenshot
   - Commit boundary: phases surface only

3. **S5.3 Fold Campaign HQ into MODEX campaign saved view**
   - Current route(s): `/waves/campaign`
   - Canonical route/view: Campaign / MODEX saved view
   - Seed/fixture: MODEX campaign fixture
   - User assertion: old Campaign HQ lands in the campaign workspace
   - Test command: route alias/click test
   - Required artifact: trace
   - Commit boundary: alias/saved view only

4. **S5.4 Add target cohort table**
   - Current route(s): `/campaigns/[slug]`
   - Canonical route/view: Campaign / Targets
   - Seed/fixture: target accounts with readiness counts
   - User assertion: campaign target quality is visible
   - Test command: query/component tests
   - Required artifact: screenshot
   - Commit boundary: target table only

5. **S5.5 Add campaign content panel**
   - Current route(s): `/campaigns/[slug]`, `/generated-content`
   - Canonical route/view: Campaign / Content
   - Seed/fixture: campaign content fixture
   - User assertion: campaign content opens filtered Content Studio view
   - Test command: click test
   - Required artifact: trace
   - Commit boundary: content panel only

6. **S5.6 Add campaign engagement panel**
   - Current route(s): `/campaigns/[slug]`
   - Canonical route/view: Campaign / Engagement
   - Seed/fixture: engagement item fixtures
   - User assertion: campaign buyer response is visible from campaign
   - Test command: component test
   - Required artifact: screenshot
   - Commit boundary: engagement panel only

7. **S5.7 Add campaign proof**
   - Current route(s): `/campaigns`, `/campaigns/[slug]`, `/waves`, `/waves/campaign`
   - Canonical route/view: Campaigns
   - Seed/fixture: deterministic campaign proof state
   - User assertion: campaign workspace replaces duplicate campaign/wave/HQ concepts
   - Test command: Playwright campaign proof
   - Required artifact: screenshot/trace
   - Commit boundary: e2e only

## Sprint 6: Content Studio + Asset Library

**Goal:** generated content, creative studio, one-pagers, briefs, search strings, routes, QR, microsites, and proposals become one content workspace.  
**Demo:** Content Studio has Generate, Library, Queue, Send Readiness, and Asset Types tabs.

### Tasks

1. **S6.1 Define asset taxonomy**
   - Current route(s): content and asset routes
   - Canonical route/view: Content Studio / Asset Library
   - Seed/fixture: generated, source, microsite, proposal, brief, search string, QR, audit route
   - User assertion: every asset type has owner, status, and route behavior
   - Test command: taxonomy unit test
   - Required artifact: test output
   - Commit boundary: taxonomy only

2. **S6.2 Add Content Studio shell tabs**
   - Current route(s): `/studio`
   - Canonical route/view: Content Studio
   - Seed/fixture: empty shell fixture
   - User assertion: Generate, Library, Queue, Send Readiness, Asset Types tabs are clickable
   - Test command: component/click tests
   - Required artifact: screenshot
   - Commit boundary: shell only

3. **S6.3 Move Generated Content into Studio Library/Send Readiness**
   - Current route(s): `/generated-content`
   - Canonical route/view: Content Studio / Library and Send Readiness
   - Seed/fixture: one-pager proof fixtures
   - User assertion: existing generated-content proof still passes
   - Test command: one-pager proof and alias test
   - Required artifact: screenshot/trace
   - Commit boundary: generated content integration only

4. **S6.4 Move Generation Queue into Studio Queue/System Jobs**
   - Current route(s): `/queue/generations`
   - Canonical route/view: Content Studio / Queue or Work Queue / System Jobs
   - Seed/fixture: failed generation job fixture
   - User assertion: generation retry remains reachable
   - Test command: generation queue click test
   - Required artifact: trace
   - Commit boundary: queue integration only

5. **S6.5 Add Brief asset type**
   - Current route(s): `/briefs`
   - Canonical route/view: Content Studio / Library
   - Seed/fixture: seeded brief
   - User assertion: brief visible and searchable in library
   - Test command: component/click test
   - Required artifact: screenshot
   - Commit boundary: brief asset only

6. **S6.6 Add Search String asset type**
   - Current route(s): `/search`
   - Canonical route/view: Content Studio / Library
   - Seed/fixture: seeded search string
   - User assertion: search string visible and copyable
   - Test command: component/click test
   - Required artifact: screenshot
   - Commit boundary: search asset only

7. **S6.7 Add Intel asset type**
   - Current route(s): `/intel`
   - Canonical route/view: Content Studio / Library or Campaign Intel
   - Seed/fixture: seeded intel item
   - User assertion: intel visible with status
   - Test command: component test
   - Required artifact: screenshot
   - Commit boundary: intel asset only

8. **S6.8 Add Audit Route asset type**
   - Current route(s): `/audit-routes`
   - Canonical route/view: Content Studio / Library
   - Seed/fixture: seeded audit route
   - User assertion: route visible and copyable
   - Test command: component/click test
   - Required artifact: screenshot
   - Commit boundary: route asset only

9. **S6.9 Add QR asset type**
   - Current route(s): `/qr`
   - Canonical route/view: Content Studio / Library
   - Seed/fixture: seeded QR asset
   - User assertion: QR asset visible
   - Test command: component test
   - Required artifact: screenshot
   - Commit boundary: QR asset only

10. **S6.10 Add Microsite/Proposal asset type**
    - Current route(s): `/for/*`, `/proposal/*`
    - Canonical route/view: Content Studio / Library
    - Seed/fixture: public asset fixtures
    - User assertion: public assets are visible with account/campaign owner
    - Test command: route/component tests
    - Required artifact: screenshot
    - Commit boundary: public asset integration only

11. **S6.11 Add Content Studio proof**
    - Current route(s): `/studio`, `/generated-content`, asset legacy routes
    - Canonical route/view: Content Studio
    - Seed/fixture: deterministic asset proof state
    - User assertion: Content Studio replaces fragmented content/asset nav
    - Test command: Playwright Content Studio proof
    - Required artifact: screenshot/trace
    - Commit boundary: e2e only

## Sprint 7: Engagement Center

**Goal:** make buyer response and engagement triage first-class.  
**Demo:** open Engagement and see unread replies, opens/clicks where available, bounces/failures, hot microsite sessions, account/person context, and next action.

### Tasks

1. **S7.1 Define Engagement item contract**
   - Current route(s): Notification, EmailLog, SendJobRecipient, MicrositeEngagement, Meeting, Activity sources
   - Canonical route/view: Engagement
   - Seed/fixture: each engagement source
   - User assertion: engagement items have one normalized display contract
   - Test command: mapping unit tests
   - Required artifact: test output
   - Commit boundary: contract only

2. **S7.2 Add Engagement shell tabs**
   - Current route(s): none canonical yet
   - Canonical route/view: `/engagement`
   - Seed/fixture: empty and populated states
   - User assertion: Inbox, Hot Accounts, Microsite Sessions, Bounces/Failures, Recent Touches tabs are clickable
   - Test command: component/click tests
   - Required artifact: screenshot
   - Commit boundary: shell only

3. **S7.3 Add reply card**
   - Current route(s): notification/reply sources
   - Canonical route/view: Engagement / Inbox
   - Seed/fixture: seeded notification
   - User assertion: reply is visible and linked to account/contact/campaign
   - Test command: component/click test
   - Required artifact: screenshot
   - Commit boundary: reply card only

4. **S7.4 Add microsite session card**
   - Current route(s): `/for/*`, tracking sources
   - Canonical route/view: Engagement / Microsite Sessions
   - Seed/fixture: seeded microsite engagement
   - User assertion: session links to account and asset
   - Test command: component/click test
   - Required artifact: screenshot
   - Commit boundary: microsite card only

5. **S7.5 Add failure/bounce card**
   - Current route(s): send job recipient/email log sources
   - Canonical route/view: Engagement / Bounces/Failures
   - Seed/fixture: seeded failed recipient
   - User assertion: failure is visible and actionable
   - Test command: component test
   - Required artifact: screenshot
   - Commit boundary: failure card only

6. **S7.6 Add Engagement triage actions**
   - Current route(s): Engagement
   - Canonical route/view: Engagement
   - Seed/fixture: reply/session/failure fixtures
   - User assertion: operator can mark read, create follow-up, open account, open campaign, open asset
   - Test command: action tests
   - Required artifact: trace
   - Commit boundary: actions only

7. **S7.7 Add Engagement proof**
   - Current route(s): `/engagement`
   - Canonical route/view: Engagement
   - Seed/fixture: deterministic engagement proof state
   - User assertion: Engagement is a first-class buyer-response workspace
   - Test command: Playwright Engagement proof
   - Required artifact: screenshot/trace
   - Commit boundary: e2e only

## Sprint 8: Unified Work Queue

**Goal:** one queue for executable work and system work, with typed views.  
**Demo:** Work Queue shows next actions, follow-ups, captures, approvals, failed jobs, and stuck jobs. Engagement signals originate in Engagement and can create tasks.

### Tasks

1. **S8.1 Define queue item types and source mapping**
   - Current route(s): `/queue`, `/queue/generations`, capture/job sources
   - Canonical route/view: Work Queue
   - Seed/fixture: operator action, capture, approval, generation job, send job, stuck job
   - User assertion: each queue item type has source and display behavior
   - Test command: mapping unit tests
   - Required artifact: test output
   - Commit boundary: mapping only

2. **S8.2 Add Work Queue shell tabs**
   - Current route(s): `/queue`
   - Canonical route/view: Work Queue
   - Seed/fixture: empty/populated states
   - User assertion: My Work, Follow-ups, Captures, Approvals, System Jobs, Stuck/Failed tabs are clickable
   - Test command: component/click tests
   - Required artifact: screenshot
   - Commit boundary: shell only

3. **S8.3 Fold Jake Queue into My Work/Captures**
   - Current route(s): `/queue`
   - Canonical route/view: Work Queue / My Work and Captures
   - Seed/fixture: seeded capture
   - User assertion: old Jake Queue work appears in canonical Work Queue
   - Test command: component/click tests
   - Required artifact: screenshot
   - Commit boundary: capture queue only

4. **S8.4 Fold Generation Queue into System Jobs**
   - Current route(s): `/queue/generations`
   - Canonical route/view: Work Queue / System Jobs
   - Seed/fixture: failed generation job
   - User assertion: generation retry remains reachable
   - Test command: generation retry click test
   - Required artifact: trace
   - Commit boundary: generation job view only

5. **S8.5 Add send job failures to System Jobs**
   - Current route(s): send job routes
   - Canonical route/view: Work Queue / System Jobs
   - Seed/fixture: failed send job
   - User assertion: failed send job is visible and retryable
   - Test command: component/action tests
   - Required artifact: screenshot/trace
   - Commit boundary: send job view only

6. **S8.6 Add Quick Capture global action**
   - Current route(s): `/capture`
   - Canonical route/view: Quick Capture
   - Seed/fixture: capture route
   - User assertion: Home/global action opens capture
   - Test command: Playwright click test
   - Required artifact: trace
   - Commit boundary: global action only

7. **S8.7 Add unified quick actions**
   - Current route(s): `/queue`
   - Canonical route/view: Work Queue
   - Seed/fixture: queue items with complete, snooze, retry, open account, open campaign
   - User assertion: queue items can be acted on in place
   - Test command: action tests
   - Required artifact: trace
   - Commit boundary: quick actions only

8. **S8.8 Add Work Queue proof**
   - Current route(s): `/queue`, `/queue/generations`, `/capture`
   - Canonical route/view: Work Queue
   - Seed/fixture: deterministic queue proof state
   - User assertion: Work Queue unifies executable work
   - Test command: Playwright Work Queue proof
   - Required artifact: screenshot/trace
   - Commit boundary: e2e only

## Sprint 9: Pipeline + Activity Consolidation

**Goal:** Pipeline owns meetings, activities, opportunities/stages, and history.  
**Demo:** Pipeline route has board, meetings, activities/timeline, and stage changes.

### Tasks

1. **S9.1 Add Pipeline tabs**
   - Current route(s): `/pipeline`
   - Canonical route/view: Pipeline
   - Seed/fixture: pipeline fixtures
   - User assertion: Board, Meetings, Activities, Stage History tabs are clickable
   - Test command: component/click tests
   - Required artifact: screenshot
   - Commit boundary: shell only

2. **S9.2 Move Meetings under Pipeline**
   - Current route(s): `/meetings`
   - Canonical route/view: Pipeline / Meetings
   - Seed/fixture: seeded meetings
   - User assertion: meetings visible in Pipeline and old route still works
   - Test command: alias/click tests
   - Required artifact: screenshot/trace
   - Commit boundary: meetings integration only

3. **S9.3 Move Activities under Pipeline**
   - Current route(s): `/activities`
   - Canonical route/view: Pipeline / Activities
   - Seed/fixture: seeded activities
   - User assertion: activities visible in Pipeline and old route still works
   - Test command: alias/click tests
   - Required artifact: screenshot/trace
   - Commit boundary: activities integration only

4. **S9.4 Add account/campaign filters**
   - Current route(s): `/pipeline`
   - Canonical route/view: Pipeline
   - Seed/fixture: account and campaign filter fixtures
   - User assertion: operator can filter pipeline views by account/campaign
   - Test command: filter tests
   - Required artifact: screenshot
   - Commit boundary: filters only

5. **S9.5 Add stage movement action**
   - Current route(s): `/pipeline`
   - Canonical route/view: Pipeline / Board
   - Seed/fixture: seeded account with stage
   - User assertion: account can move stage and history records it
   - Test command: action + click proof
   - Required artifact: trace
   - Commit boundary: stage action only

6. **S9.6 Add Pipeline proof**
   - Current route(s): `/pipeline`, `/meetings`, `/activities`
   - Canonical route/view: Pipeline
   - Seed/fixture: deterministic pipeline proof state
   - User assertion: Pipeline owns revenue-motion history
   - Test command: Playwright Pipeline proof
   - Required artifact: screenshot/trace
   - Commit boundary: e2e only

## Sprint 10: Analytics + Ops Split

**Goal:** Analytics is business performance; Ops is system reliability and proof.  
**Demo:** Analytics has campaign/revenue performance; Ops has proof ledger, crons, generation metrics, provider health.

### Tasks

1. **S10.1 Add Analytics tabs**
   - Current route(s): `/analytics`
   - Canonical route/view: Analytics
   - Seed/fixture: analytics fixtures
   - User assertion: Overview, Campaigns, Email/Engagement, Pipeline, Quarterly tabs are clickable
   - Test command: component/click tests
   - Required artifact: screenshot
   - Commit boundary: shell only

2. **S10.2 Preserve Quarterly Review as Analytics tab alias**
   - Current route(s): `/analytics/quarterly`
   - Canonical route/view: Analytics / Quarterly
   - Seed/fixture: quarterly fixture
   - User assertion: old Quarterly route still works
   - Test command: route alias test
   - Required artifact: trace
   - Commit boundary: alias only

3. **S10.3 Add Ops shell tabs**
   - Current route(s): admin routes
   - Canonical route/view: `/ops`
   - Seed/fixture: ops fixtures
   - User assertion: Proof Ledger, Cron Health, Generation Metrics, Provider Health, Feature Flags tabs are clickable
   - Test command: component/click tests
   - Required artifact: screenshot
   - Commit boundary: shell only

4. **S10.4 Move Cron Health into Ops**
   - Current route(s): `/admin/crons`
   - Canonical route/view: Ops / Cron Health
   - Seed/fixture: cron fixture
   - User assertion: cron health visible under Ops and old route still works
   - Test command: legacy route + Ops tab test
   - Required artifact: screenshot/trace
   - Commit boundary: cron integration only

5. **S10.5 Move Generation Metrics into Ops**
   - Current route(s): `/admin/generation-metrics`
   - Canonical route/view: Ops / Generation Metrics
   - Seed/fixture: generation metrics fixture
   - User assertion: generation metrics visible under Ops and old route still works
   - Test command: legacy route + Ops tab test
   - Required artifact: screenshot/trace
   - Commit boundary: generation metrics integration only

6. **S10.6 Add latest proof artifact links to Ops**
   - Current route(s): proof ledger docs/artifacts
   - Canonical route/view: Ops / Proof Ledger
   - Seed/fixture: proof ledger fixture
   - User assertion: latest proof artifacts are reachable from Ops
   - Test command: component test
   - Required artifact: screenshot
   - Commit boundary: proof links only

7. **S10.7 Add Analytics/Ops proof**
   - Current route(s): `/analytics`, `/analytics/quarterly`, `/ops`, `/admin/crons`, `/admin/generation-metrics`
   - Canonical route/view: Analytics and Ops
   - Seed/fixture: deterministic analytics/ops proof state
   - User assertion: business performance and system reliability are cleanly split
   - Test command: Playwright Analytics/Ops proof
   - Required artifact: screenshot/trace
   - Commit boundary: e2e only

## Sprint 11: End-to-End Operator Journey + Cleanup

**Goal:** prove the consolidated app works as one OS and remove obsolete nav duplication.  
**Demo:** Home -> Work Queue -> Account -> Contacts -> Campaign -> Content Studio -> Engagement -> Pipeline -> Analytics -> Ops proof.

### Tasks

1. **S11.1 Add full operator journey proof**
   - Current route(s): all canonical modules
   - Canonical route/view: end-to-end RevOps OS journey
   - Seed/fixture: deterministic full-journey state
   - User assertion: operator can complete the core workflow without dead ends
   - Test command: Playwright full journey proof
   - Required artifact: screenshots/traces, `executed > 0`, `skipped = 0`
   - Commit boundary: e2e only

2. **S11.2 Add dead-route/dead-nav detector**
   - Current route(s): Sidebar, CommandSearch, route tree
   - Canonical route/view: nav/route ownership
   - Seed/fixture: route tree
   - User assertion: sidebar hrefs have routes and routes have owner disposition
   - Test command: detector test
   - Required artifact: test output
   - Commit boundary: detector only

3. **S11.3 Remove obsolete top-level nav items after aliases are proven**
   - Current route(s): legacy sidebar items
   - Canonical route/view: 10-module nav
   - Seed/fixture: alias proof from prior sprints
   - User assertion: sidebar is consolidated and legacy paths still work
   - Test command: nav config test + screenshot
   - Required artifact: before/after screenshot
   - Commit boundary: nav cleanup only

4. **S11.4 Update command search aliases**
   - Current route(s): CommandSearch
   - Canonical route/view: canonical nav/actions
   - Seed/fixture: legacy query terms
   - User assertion: old names still find the right canonical destination
   - Test command: command tests
   - Required artifact: test output
   - Commit boundary: aliases only

5. **S11.5 Update roadmap index links**
   - Current route(s): docs
   - Canonical route/view: docs/roadmaps
   - Seed/fixture: roadmap file list
   - User assertion: active docs point to this roadmap and proof ledger
   - Test command: doc check
   - Required artifact: doc output
   - Commit boundary: docs only

6. **S11.6 Final proof ledger closeout**
   - Current route(s): all canonical and key legacy routes
   - Canonical route/view: Ops / Proof Ledger
   - Seed/fixture: final proof suite output
   - User assertion: before/after screenshots show duplicate-module score improvement
   - Test command: full proof suite
   - Required artifact: proof ledger closeout
   - Commit boundary: proof ledger only

## Do-Not-Build Boundaries

- Do not build another standalone module for a feature that belongs inside Account, Campaign, Engagement, Content Studio, Work Queue, Pipeline, Analytics, or Ops.
- Do not delete working legacy routes until click tests prove canonical route and alias behavior.
- Do not expand backend CRM/event architecture until user-facing IA and evidence baseline are stable.
- Do not turn MODEX-specific artifacts into permanent product nouns; treat MODEX as a campaign.
- Do not let Sidebar and CommandSearch maintain separate route truth.
- Do not mark a task complete without the acceptance card and proof artifact.

## Approval Gate

Do not implement this roadmap until approved.

Recommended first implementation sprint after approval: **Sprint 0: UI Truth Audit + Proof Ledger**.
