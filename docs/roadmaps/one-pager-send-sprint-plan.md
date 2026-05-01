# One-Pager Generation & Batch Send Sprint Plan
## Q2 2026 Platform Enhancement — Shipped Software Focus

**Status:** Ready for review (May 1, 2026)  
**Owner:** Implementation team  
**Baseline:** Current one-pager + email send workflowv(synchronous, manual, no chaining)  
**Goal:** Enable batch generation, queue management, one-click send, and extensible account onboarding  

---

## EXECUTIVE SUMMARY

### Current State
- **One-pager generation**: Synchronous endpoint `/api/ai/one-pager` hits Gemini (free tier quota exhaustion = 429). Falls back to OpenAI, but 429 errors are indistinguishable from app-level rate limiting.
- **Email sending**: Unified EmailComposer dialog reused across 6+ surfaces. Supports single + bulk send. HubSpot logging enabled. But requires manual copy-paste of generated content.
- **Rate limiting**: In-memory Map (10/min per IP). No handling for Gemini quota vs app-level backoff.
- **Workflow friction**: Generate one-pager → manually copy → open EmailComposer → manually paste → manually select recipients → send.
- **Account extensibility**: Only hand-crafted accounts get custom one-pager contexts. New accounts must be seeded manually.

### Problem Statement
**Mission constraint**: Casey operates this platform all day. Every outreach motion must minimize clicks and maximize confidence. Currently:
- **3 manual steps** between "generate one-pager" and "send to N recipients"
- **No retry queue** for failed generations (user must regenerate manually)
- **No batch generation** (one account at a time)
- **No template versioning** (overwrite conflict risk if two campaigns run simultaneously)
- **No account-scoped context** for new verticals/campaigns (MODEX assumptions baked in)
- **No way to chain** generator output → email send → activity log atomically

### Business Impact (Success Criteria)
1. **Productivity gain**: 10→3 minutes per outreach motion (70% time savings)
2. **Reliability**: Zero manual regenerations due to timeouts; 99.5% queue completion rate
3. **Extensibility**: Add new non-MODEX accounts in <10 minutes, auto-generate contextual one-pagers
4. **Confidence**: Casey sees failed generations in queue with logs, can retry atomically
5. **Scale**: Support batch generation of 50 one-pagers in <2 minutes

---

## SPRINT BREAKDOWN

### Sprint 0: Queue Technology Choice
**Goal**: Choose the background job processing approach before building the queue and batch workflows.
**Duration**: 1 day
**Demoable**: Documented implementation decision and prototype health check.

#### Why First?
- The queue model is the highest-risk dependency for Sprint 2 and beyond.
- Choosing the right processing approach early prevents wasted refactor effort and deployment rework.

#### Deliverable
- **Decision**: Use Vercel Cron + Prisma polling.
- **Why**: The repo already has a secure cron framework, health monitoring, and system config state for polling jobs.
- **Evaluation**: External queues (Upstash/Bull) are viable but introduce new infra and deployment complexity for this phase.
- **Prototype**: Minimal proof-of-concept can be built by extending the existing cron route pattern.
- **Documentation**: Add `docs/roadmaps/queue-implementation-decision.md` to capture the choice and tradeoffs.

---

### Sprint 1: Provider Resilience & Quota Management
**Goal**: Distinguish API-level quota errors from app-level rate limiting. Implement exponential backoff with provider-aware error handling.  
**Duration**: 2 days  
**Demoable**: New `/api/ai/health` endpoint shows active providers + quota status. Exception logs distinguish 429 (Gemini quota) vs 429 (app rate limit).

#### Why First?
- Blocks Sprint 2 batch generation (cannot build queue without knowing which provider will succeed)
- Current 429 responses are opaque — Casey has no visibility into whether retry will work

#### Deliverable
- **API**: Enhanced `generateText()` in `src/lib/ai/client.ts` with provider-level retry logic
- **DB**: Minimal logging (GeneratedContent stores `ai_error` field with provider + error type)
- **Component**: New `/api/ai/health` endpoint for Casey's dashboard
- **Behavior**: API 429 from Gemini triggers `tryOpenAI()` immediately (don't wait 1 min). Retry 1x with exponential backoff.

---

### Sprint 2: Generation Job Queue System
**Goal**: Enable batch generation with persistent job tracking, retry logic, and resume-after-failure.  
**Duration**: 3 days  
**Demoable**: Casey bulk-selects 10 accounts on `/accounts` page → clicks "Generate one-pagers" → sees 10 jobs in new `/queue/generations` view → each job shows progress, error logs, retry button.

#### Why Second?
- Builds on Sprint 1 provider resilience
- Unblocks Sprint 3 (send endpoints need to query GeneratedContent efficiently)
- Enables atomic account → generation → send chains

#### Deliverable
- **DB**: New `GenerationJob` table (account_name, campaign_id, persona_name, content_type, status, provider, error_message, attempted_at, completed_at, retry_count)
- **API**: New `/api/ai/generate-batch` endpoint (POST, accepts array of account names, returns job IDs)
- **Worker**: New background job processor (either Next.js Cron + API polling, or Bull queue integration) based on the Sprint 0 decision
- **Component**: New `/queue/generations` page showing job list with status, logs, retry buttons
- **Behavior**: Max 3 retries per job. Exponential backoff: 2s → 4s → 8s. Failed jobs surface in Casey's dashboard.

---

### Sprint 3: Direct Send from Generated Content
**Goal**: One-click send from generated one-pager to multiple recipients (no copy-paste).  
**Duration**: 2 days  
**Demoable**: Casey views generated one-pager → clicks "Send to..." → multi-select recipients (persona list) → preview subject + body → send. Activity log auto-created.

#### Why Third?
- Builds on Sprint 2 (batch generation means multiple GeneratedContent rows to send from)
- Completes the core workflow: generate → send → log atomically

#### Deliverable
- **Component**: New `OnePageSendDialog` component (extends EmailComposer logic)
  - Pre-populates body from GeneratedContent
  - Multi-select recipients from Persona table filtered by account
  - Preview mode (show formatted HTML)
  - Send button triggers `/api/email/send-bulk` with `generated_content_id` link
- **DB**: Update `EmailLog` to include `generated_content_id` FK (linking sent emails to source generation)
- **API**: Extend `/api/email/send-bulk` to accept `generated_content_id` parameter (optional)
- **Behavior**: After send, auto-create Activity log entries for each recipient. Update Account.outreach_status if first send.

---

### Sprint 4: Send Template Versioning
**Goal**: Enable multiple one-pager versions per account/campaign. Version control to prevent conflicts.  
**Duration**: 2 days  
**Demoable**: Casey generates 2 versions of General Mills one-pager (same account, MODEX campaign). Both versions shown in dropdown. Can toggle between versions. Sent emails link to specific version.

#### Why Fourth?
- Enables A/B testing on one-pager copy across campaigns
- Reduces confusion if two campaigns generate content for same account simultaneously
- Supports "persona variant" one-pagers (one-pager for each decision-maker lane)

#### Deliverable
- **DB**: Add `GeneratedContent.version` INT + `GeneratedContent.version_metadata` JSON (stores tone, length, variant_slug)
- **Component**: Extend one-pager preview UI to show version selector + toggle between versions
- **API**: Update `/api/ai/one-pager` to accept optional `version` parameter (default: auto-increment)
- **Behavior**: When pulling GeneratedContent for send, default to latest version. Allow manual override.

---

### Sprint 5: Account Template Extensions
**Goal**: Enable Casey to add new non-MODEX accounts via simple UI. Auto-generate contextual one-pager templates based on vertical/persona class.  
**Duration**: 3 days  
**Demoable**: Casey goes to `/accounts/new` → fills "Account name, vertical, why now" → system pre-fills `icp_fit`, `priority_score`, `primo_angle` based on vertical rules → generates sample one-pager → save. New account appears in `/accounts` with full context.

#### Why Fifth?
- Unlocks future campaigns (not just MODEX)
- Allows Casey to onboard new accounts without engineer involvement
- Demonstrates platform extensibility

#### Deliverable
- **Component**: Enhanced `/accounts/new` form
  - Account name, vertical (dropdown: manufacturing, 3PL, retail, etc.)
  - "Why now" textarea (freeform, optional template suggestions)
  - "Primo angle" textarea
  - Auto-calculate `icp_fit`, `modex_signal`, `priority_score` based on vertical
  - "Generate sample one-pager" button (shows preview before save)
- **Logic**: New `src/lib/templates/account-templates.ts` with vertical-specific one-pager contexts
  - Manufacturing: Focus on multi-site standardization, seasonal peaks
  - 3PL: Focus on margin pressure, client network effect
  - Retail: Focus on DC throughput, seasonal variance, SKU velocity
- **DB**: Seed `AccountTemplate` reference table (vertical, scoring_rules_json, sample_primo_angle)
- **Behavior**: When creating new account, populate one-pager context from template rules. Save to GeneratedContent immediately (no queue needed for sample).

---

### Sprint 6: DX Polish & Performance
**Goal**: Minimize clicks, maximize throughput. Add quick-send chains, batch previews, performance optimization.  
**Duration**: 2 days  
**Demoable**: Casey selects multiple generated one-pagers from `/generated-content` → "Preview all" shows side-by-side → "Send all" bulk-sends to per-account recipient lists in <5s. Dashboard shows "5 outreach motions shipped" badge.

#### Why Sixth?
- Polish pass (not MVP-blocking, but high-value DX)
- Demonstrates momentum and iteration speed

#### Deliverable
- **Component**: New `/generated-content` page
  - Grid view showing published one-pagers
  - Multi-select + bulk "Send to recipients" action
  - Quick-preview modal (show formatted HTML)
  - Filter by campaign, account, status (draft/published)
- **Optimization**: Pre-fetch account + persona lists in parallel on `/queue/generations` page (reduce wait time when viewing generations)
- **Behavior**: Bulk send triggers background job processing (not blocking UI). Show toast with job ID for tracking.
- **Admin feature**: New `/admin/generation-metrics` showing avg generation time, provider breakdown, queue depth

---

## DETAILED TASK LIST

### Sprint 1: Provider Resilience & Quota Management

#### Task 1.1: Distinguish API vs App-Level 429 Errors
- **Title**: Implement provider-aware error classification in AI client
- **Acceptance Criteria**:
  1. `generateText()` distinguishes Gemini 429 (quota exhausted) from app rate limit (10/min exceeded)
  2. Returns error with `{ provider: 'gemini', retryable: true, backoffMs: 2000 }`
  3. Caller (API endpoints) can retry based on `retryable` flag
- **Test/Validation**:
  - Unit test: Mock Gemini 429 response, assert `retryable: true`
  - Unit test: Mock app rate limit 429, assert `retryable: false`
  - Integration test: Verify fallback to OpenAI on Gemini 429
- **Dependencies**: None (refactoring existing `src/lib/ai/client.ts`)
- **Est. LOC**: 80–120 lines changed

#### Task 1.2: Implement Exponential Backoff in Provider Fallback
- **Title**: Add retry loop with exponential backoff in `generateText()`
- **Acceptance Criteria**:
  1. On Gemini 429: Wait 2s, retry once with same prompt
  2. On second failure: Immediately try OpenAI (no additional backoff)
  3. Max total wait: 4s before giving up
  4. Log each retry attempt to console/error tracking
- **Test/Validation**:
  - Unit test: Mock Gemini timeout, verify exponential backoff timing
  - Integration test: Verify OpenAI fallback after Gemini retry fails
  - Manual test: Trigger Gemini quota exhaustion, confirm automatic fallback
- **Dependencies**: Completes Task 1.1
- **Est. LOC**: 40–60 lines added

#### Task 1.3: Add provider-aware Error Logging to GeneratedContent
- **Title**: Store provider + error type in GeneratedContent table when generation fails
- **Acceptance Criteria**:
  1. GeneratedContent row includes `ai_error` field (text): "gemini_429" | "openai_timeout" | "control_plane_error" | null
  2. `/api/ai/one-pager` catches generation error, returns 500 with `{ error, ai_error: "gemini_429" }`
  3. Client (UI) shows user-friendly message: "Gemini quota exhausted, trying OpenAI..." vs "Network timeout"
- **Test/Validation**:
  - Unit test: Verify error is correctly classified and logged
  - Integration test: End-to-end call to `/api/ai/one-pager` with mocked Gemini failure, verify DB record
  - Manual test: Check generatedContent table has error classification
- **Dependencies**: Completes Task 1.2
- **Est. LOC**: 30–50 lines changed

#### Task 1.4: New `/api/ai/health` Endpoint (Dashboard Visibility)
- **Title**: Create endpoint showing active providers + recent quota status
- **Acceptance Criteria**:
  1. GET `/api/ai/health` returns `{ status: "ok" | "degraded", providers: [{ name, last_error, retry_available }] }`
  2. Caches status for 30s (don't hammer API on every dashboard load)
  3. Shows which provider is "fallback active" (e.g., OpenAI if Gemini is exhausted)
- **Test/Validation**:
  - Unit test: Mock and verify provider status parsing
  - Integration test: Call endpoint, verify cache behavior
  - Manual test: Check dashboard shows provider health
- **Dependencies**: Completes Task 1.3
- **Est. LOC**: 50–80 lines

---

### Sprint 2: Generation Job Queue System

#### Task 2.1: Create GenerationJob Database Table
- **Title**: Add schema for persistent job tracking
- **Acceptance Criteria**:
  1. New `GenerationJob` model with fields:
     - `id` (primary key)
     - `account_name` (FK to Account)
     - `campaign_id` (FK to Campaign, optional)
     - `persona_name` (optional, for persona-specific one-pagers)
     - `content_type` ("one_pager" | "email" | "sequence")
     - `status` ("pending" | "processing" | "completed" | "failed")
     - `provider_used` ("gemini" | "openai" | "control_plane")
     - `error_message` (text, nullable)
     - `attempted_at`, `completed_at` (timestamps)
     - `retry_count` (INT, default 0)
     - `batch_id` (UUID, groups related jobs)
     - `created_at`, `updated_at`
  2. Indexes on: `(status, updated_at)`, `(account_name, campaign_id)`, `(batch_id)`
  3. Migration created and tested locally
- **Test/Validation**:
  - Unit test: Verify schema via Prisma type checking
  - Local test: `npx prisma db push && npm run seed`, check table exists
  - Verify no FK constraint errors with Account/Campaign tables
- **Dependencies**: None (DB-only change)
- **Est. LOC**: 40 lines (schema)

#### Task 2.2: Implement Batch Generator API Endpoint
- **Title**: Create `/api/ai/generate-batch` endpoint
- **Acceptance Criteria**:
  1. POST `/api/ai/generate-batch` accepts:
     ```json
     {
       "accounts": ["General Mills", "Frito-Lay"],
       "campaign_id": 1,
       "content_type": "one_pager"
     }
     ```
  2. Returns immediately with:
     ```json
     {
       "batch_id": "uuid-xxx",
       "jobs": [{"id": 1, "account_name": "General Mills", "status": "pending"}]
     }
     ```
  3. Creates one GenerationJob row per account (status: pending)
  4. Rate limit: 100 jobs/min per IP (batch endpoint, not per-job)
  5. Validates all accounts exist before queuing
- **Test/Validation**:
  - Unit test: Validate input, verify job creation in DB
  - Integration test: Send batch request, verify jobs queued + returned
  - Test: Attempt batch with non-existent account, expect 400
  - Performance test: Queue 50 jobs, verify <1s response time
- **Dependencies**: Completes Task 2.1
- **Est. LOC**: 100–150 lines

#### Task 2.3: Implement Job Processing Worker (Background)
- **Title**: Create background job processor to dequeue and generate content
- **Acceptance Criteria**:
  1. New file: `src/lib/job-processor.ts` (or use existing pattern)
  2. Polls GenerationJob table for `status = "pending"` (FIFO, max 5 concurrent)
  3. For each job:
     - Set `status = "processing"`, `attempted_at = now()`
     - Call `generateText()` with account context (reuse `/api/ai/one-pager` prompt logic)
     - On success: Create GeneratedContent row, set job `status = "completed"`
     - On failure: Increment `retry_count`, if <3 then status = "pending", else status = "failed"
  4. Worker runs every 5 seconds (can be Cron job or polling endpoint)
  5. Error logs include provider + retry context
- **Test/Validation**:
  - Unit test: Mock GenerationJob table, verify FIFO processing + retry logic
  - Integration test: Queue 5 jobs, poll worker, verify 5 GeneratedContent rows created
  - Test: Simulate provider failure on job 2, verify retry + eventual success
  - Load test: Process 50 jobs, track completion time + provider distribution
- **Dependencies**: Completes Task 2.2
- **Est. LOC**: 150–200 lines

#### Task 2.4: Create `/queue/generations` Page (Status Dashboard)
- **Title**: Build UI to view + manage queued generations
- **Acceptance Criteria**:
  1. New page: `/app/queue/generations/page.tsx` (server component + client filters)
  2. Shows table with:
     - Account name (link to account)
     - Campaign name
     - Status badge (pending | processing | completed | failed)
     - Retry count
     - Error message (revealed on click)
     - Actions: "Retry" button (copies job to pending status), "View result" (links to GeneratedContent)
  3. Filters: by status, campaign, account
  4. Pagination: 25 per page
  5. Real-time refresh via SWR (10s poll) or WebSocket (if available)
- **Test/Validation**:
  - E2E test: Create batch, verify jobs appear in table
  - E2E test: Retry failed job, verify status updates
  - Manual test: Check page loads in <2s with 100 jobs
  - Manual test: Filter by campaign, verify results
- **Dependencies**: Completes Task 2.3
- **Est. LOC**: 200–250 lines (component + styling)

#### Task 2.5: Add Batch Selection to `/accounts` Page
- **Title**: Extend accounts page to allow bulk job creation
- **Acceptance Criteria**:
  1. New "Generate one-pagers" button when ≥1 account selected
  2. Modal: Select campaign (dropdown), confirm batch size
  3. On submit: Call `/api/ai/generate-batch`, redirect to `/queue/generations?batch_id=xxx`
  4. Toast: "5 generations queued. Track progress here."
- **Test/Validation**:
  - E2E test: Select 3 accounts, generate batch, verify redirect + jobs shown
  - E2E test: Attempt batch with no campaign, expect warning + confirmation
  - Manual test: Bulk select 50 accounts, verify batch creates in <2s
- **Dependencies**: Completes Task 2.4
- **Est. LOC**: 80–120 lines

---

### Sprint 3: Direct Send from Generated Content

#### Task 3.1: Create OnePageSendDialog Component
- **Title**: New component to send generated one-pager to multiple recipients
- **Acceptance Criteria**:
  1. New file: `src/components/email/one-pager-send-dialog.tsx`
  2. Props: `generatedContentId: number, trigger?: React.ReactNode, onSuccess?: () => void`
  3. Dialog includes:
     - Generated one-pager preview (formatted HTML, read-only)
     - Multi-select recipients (Persona list filtered by account_name)
     - Subject line (editable, prefilled from GeneratedContent.campaign or default)
     - CC/BCC fields (optional, standard EmailComposer fields)
     - "Preview email" button (shows full formatted email for each recipient)
     - "Send to X recipients" button
  4. Replaces copy-paste workflow
- **Test/Validation**:
  - Unit test: Component renders with mock data
  - E2E test: Select 5 recipients, send, verify 5 EmailLog rows created
  - Manual test: Check email arrives in inbox with correct subject/body
  - Manual test: Verify activity logs auto-created for each recipient
- **Dependencies**: Sprint 3 start (no prior sprint deps)
- **Est. LOC**: 250–300 lines

#### Task 3.2: Update EmailLog Schema for GeneratedContent Linkage
- **Title**: Add FK + cascade delete rules for sent emails
- **Acceptance Criteria**:
  1. GeneratedContent adds field: `external_send_count` INT (default 0, increments on each send)
  2. EmailLog adds field: `generated_content_id` INT (FK to GeneratedContent, nullable, cascade on delete)
  3. Migration created + tested
  4. When emailing from one-pager: set `generated_content_id` on all EmailLog rows
- **Test/Validation**:
  - Unit test: Verify schema compiles
  - Local test: `npx prisma db push`, manually verify FK constraints
  - Integration test: Create GeneratedContent, send email, verify `generated_content_id` is set
- **Dependencies**: Task 3.1 (need schema before component can link)
- **Est. LOC**: 20 lines (schema)

#### Task 3.3: Extend `/api/email/send-bulk` to Use OnePageSendDialog
- **Title**: Accept `generated_content_id` parameter, auto-link to source generation
- **Acceptance Criteria**:
  1. `/api/email/send-bulk` accepts optional `generated_content_id` in request
  2. When provided: set field on all EmailLog rows + increment GeneratedContent.external_send_count
  3. Response includes count: `"sent": 5, "source_generation_id": 123`
- **Test/Validation**:
  - Unit test: Verify field is set correctly
  - Integration test: Bulk send with `generated_content_id`, verify DB records
  - Manual test: Send one-pager to 3 recipients, check GeneratedContent.external_send_count = 3
- **Dependencies**: Completes Task 3.2
- **Est. LOC**: 30–40 lines

#### Task 3.4: Auto-Create Activity Log from OnePageSendDialog Send
- **Title**: Create Activity entry for each recipient after send
- **Acceptance Criteria**:
  1. After successful send from OnePageSendDialog:
     - Create Activity row with:
       - `account_name` (from GeneratedContent)
       - `persona` (recipient persona name)
       - `activity_type` = "Email"
       - `outcome` = `"Sent from generated one-pager: [campaign name]"`
       - `next_step` = "Wait 48h → follow up if no reply"
       - `next_step_due` = now + 3 days
     - Update Account.outreach_status = "Contacted" if currently "Not started"
     - Update Account.current_motion = "Awaiting reply"
  2. All operations in single transaction (no partial updates)
- **Test/Validation**:
  - Integration test: Send one-pager, verify Activity rows created
  - Manual test: Check Account.outreach_status updates correctly
  - Test: Verify Activity.next_step_due is 3 days from send
- **Dependencies**: Completes Task 3.3
- **Est. LOC**: 40–60 lines

#### Task 3.5: Integrate OnePageSendDialog into GeneratedContent Views
- **Title**: Surface "Send" button on one-pager previews
- **Acceptance Criteria**:
  1. On `/generated-content` page (new, created in Sprint 6 task 6.1, but can add button to existing pages first):
     - Each GeneratedContent row has "Send" button (or action menu)
     - Clicking "Send" opens OnePageSendDialog
  2. Also accessible from `/queue/generations` page:
     - Completed jobs show "View & Send" button
     - Clicking opens generated one-pager + OnePageSendDialog
- **Test/Validation**:
  - E2E test: Generate one-pager, navigate to queue, click "Send", verify dialog opens
  - E2E test: Complete send workflow end-to-end
- **Dependencies**: Completes Task 3.4
- **Est. LOC**: 60–80 lines

---

### Sprint 4: Send Template Versioning

#### Task 4.1: Add Version Fields to GeneratedContent Schema
- **Title**: Support multiple versions per account/campaign
- **Acceptance Criteria**:
  1. New fields on GeneratedContent:
     - `version` INT (default 1, auto-increment per account+campaign+content_type)
     - `version_metadata` JSON (stores: tone, length, variant_slug, notes)
     - `published_at` TIMESTAMP (nullable, marks draft vs published)
  2. Migration created
  3. Unique constraint: `(account_name, campaign_id, content_type, version)`
- **Test/Validation**:
  - Unit test: Verify schema
  - Local test: Create 2 generations for same account → verify version increments
  - Test: Query latest version for (account, campaign), verify sorting
- **Dependencies**: None (schema-only)
- **Est. LOC**: 15 lines

#### Task 4.2: Update One-Pager Generation to Compute Version
- **Title**: Auto-increment version when generating
- **Acceptance Criteria**:
  1. Before inserting new GeneratedContent:
     - Query: SELECT MAX(version) FROM GeneratedContent WHERE account_name = X AND campaign_id = Y AND content_type = 'one_pager'
     - Set version = (max_version ?? 0) + 1
  2. `/api/ai/one-pager` endpoint accepts optional `campaign_id` parameter
  3. Response includes `{ content, version: 2, account_name: "..." }`
- **Test/Validation**:
  - Unit test: Verify version computation
  - Integration test: Create 3 generations for same account → versions 1, 2, 3
  - Test: Verify unique constraint prevents duplicates
- **Dependencies**: Completes Task 4.1
- **Est. LOC**: 40–50 lines

#### Task 4.3: Create Version Selector UI Component
- **Title**: Allow toggling between one-pager versions
- **Acceptance Criteria**:
  1. New component: `src/components/ai/one-pager-version-selector.tsx`
  2. Shows dropdown: "Version 1 (draft)", "Version 2 (published)", etc.
  3. Clicking version switches preview below
  4. "Publish" button marks version as live (sets `published_at`)
  5. Shows metadata: tone, created_at, author, sent_count
- **Test/Validation**:
  - Unit test: Component renders with mock versions
  - E2E test: Create 2 versions, toggle between them, verify preview updates
  - Manual test: Check version selector on generated content pages
- **Dependencies**: Completes Task 4.2
- **Est. LOC**: 120–150 lines

#### Task 4.4: Update OnePageSendDialog to Use Latest Published Version
- **Title**: Default to latest published version when sending
- **Acceptance Criteria**:
  1. When opening OnePageSendDialog with `generated_content_id`:
     - If that specific ID is not published, query latest published version for (account, campaign)
     - If no published version exists, use draft (warn user: "This is a draft. Publish before sending?")
  2. Show version badge in send dialog: "Sending version 2 (published)"
  3. Allow override: "Use different version" dropdown
- **Test/Validation**:
  - Unit test: Verify version selection logic
  - E2E test: Create draft, try to send → warn + option to publish
  - E2E test: Publish version 1, create draft version 2, send v1
- **Dependencies**: Completes Task 4.3
- **Est. LOC**: 50–70 lines

#### Task 4.5: Update Email Analytics to Show Source Version
- **Title**: Track which one-pager version was sent
- **Acceptance Criteria**:
  1. EmailLog includes computed field: `generated_content_version` (pulled from GeneratedContent.version via FK)
  2. Email analytics page shows:
     - Filter by version
     - Metrics per version (send count, open rate, reply rate)
  3. Email list shows "from version 1" vs "from version 2"
- **Test/Validation**:
  - Integration test: Send version 1 to 3 people, version 2 to 2 people, verify counts
  - Manual test: Check analytics filters by version, shows correct metrics
- **Dependencies**: Completes Task 4.4
- **Est. LOC**: 60–80 lines

#### Task 4.6: Add Queue-Aware Send Preview for Versioned Content
- **Title**: Ensure send preview and job queue honor selected content versions
- **Acceptance Criteria**:
  1. When sending from an older or unpublished version, the queue job stores `generated_content_id` and `version` explicitly
  2. The send preview renders the exact version content, not the latest version, unless user chooses "Use latest"
  3. If the version is unpublished, send job logs show `draft_version_used: true` and require explicit user confirmation
- **Test/Validation**:
  - E2E test: Open OnePageSendDialog on version 1, send, verify queued job uses version 1 content
  - Manual test: Send draft version after confirmation, verify log metadata
- **Dependencies**: Completes Task 4.5
- **Est. LOC**: 40–50 lines

---

### Sprint 5: Account Template Extensions

#### Task 5.1: Create Account Template Reference Data
- **Title**: Define vertical-specific one-pager contexts + scoring rules
- **Acceptance Criteria**:
  1. New file: `src/lib/templates/account-templates.ts`
  2. Exports:
     ```typescript
     type VerticalTemplate = {
       vertical: string;
       defaultScoringRules: {
         icp_fit: number;      // 1-5
         modex_signal: number; // 1-5 (or 0 if non-MODEX)
         primo_story_fit: number;
         strategic_value: number;
       };
       sampleOnePagerContext: OnePagerContext;
       sampleWhyNow: string;
       samplePrimoAngle: string;
     };
     ```
  3. Templates for: Manufacturing, 3PL, Retail, Pharma, Food & Beverage, Automotive
  4. Each template includes:
     - Why-now hooks tailored to vertical (e.g., "seasonal variance" for retail, "margin pressure" for 3PL)
     - Primo angle focused on vertical pain (e.g., "multi-site standardization" for mfg)
     - Sample one-pager request context
- **Test/Validation**:
  - Unit test: Verify template data structure
  - Manual test: Load templates, verify all required fields present
- **Dependencies**: None (data-only)
- **Est. LOC**: 200–250 lines

#### Task 5.2: Create `/accounts/new` Enhanced Form
- **Title**: New account creation UI with vertical selection + context population
- **Acceptance Criteria**:
  1. New page: `/app/accounts/new/page.tsx`
  2. Form fields:
     - Account name (text input, required)
     - Vertical (dropdown: Manufacturing, 3PL, Retail, etc.)
     - Parent brand (text, optional)
     - Why now (textarea, prefilled with vertical template sample, editable)
     - Primo angle (textarea, prefilled with vertical template sample, editable)
     - Best intro path (textarea, optional)
  3. On vertical change: auto-fill Why Now + Primo angle (show "✨ Auto-filled from template")
  4. Below form: "Preview one-pager" button → shows sample generation
  5. "Save & Generate" button → creates Account + queues GenerationJob
  6. Success: toast "Account created" + redirect to `/accounts/[slug]`
- **Test/Validation**:
  - E2E test: Create new account via form, verify Account + GenerationJob created
  - E2E test: Change vertical, verify autocomplete updates
  - E2E test: Preview before save, verify sample looks good
  - Manual test: Form validation (account name required, vertical required)
- **Dependencies**: Completes Task 5.1
- **Est. LOC**: 300–350 lines

#### Task 5.3: Implement Account Creation Server Action
- **Title**: Add `createAccountWithContext` server action to augment `createAccount`
- **Acceptance Criteria**:
  1. New file: `src/lib/actions/create-account-with-context.ts`
  2. Accepts:
     ```typescript
     {
       name: string;
       vertical: string;
       why_now: string;
       primo_angle: string;
       // ... other standard fields
     }
     ```
  3. Computes priority_score using `src/lib/scoring.ts` rules + vertical adjustments
  4. Creates Account record
  5. Queues GenerationJob (status: pending) for one-pager generation
  6. Returns: `{ account, generation_job_id }`
- **Test/Validation**:
  - Unit test: Verify priority score computation
  - Integration test: Create account, verify Account + GenerationJob rows
  - Test: Verify priority_band is computed correctly (A/B/C/D)
- **Dependencies**: Completes Task 5.2
- **Est. LOC**: 80–100 lines

#### Task 5.4: Link Enhanced Account Form to New Verticals
- **Title**: Make vertical selector dynamic from AccountTemplate
- **Acceptance Criteria**:
  1. Vertical dropdown populated from `Object.keys(templates)` (not hardcoded)
  2. Each vertical shows description: "Manufacturing: Focus on multi-site standardization"
  3. Form stores user edits locally (don't reset on vertical change if user has modified fields)
  4. "Reset to template" button to revert to sample text
- **Test/Validation**:
  - E2E test: Form loads, vertical dropdown shows all templates
  - E2E test: Edit field → change vertical → verify edit NOT lost
  - E2E test: Click "Reset to template", verify fields revert
  - Manual test: Check form responsiveness on mobile
- **Dependencies**: Completes Task 5.3
- **Est. LOC**: 60–80 lines

#### Task 5.5: Add Non-MODEX Campaign Support
- **Title**: Extend one-pager generation to support campaign-specific contexts
- **Acceptance Criteria**:
  1. Campaign model adds optional fields:
     - `messaging_angle` (text)
     - `tone_preference` ("professional" | "casual" | "bold")
     - `one_pager_context_override` (JSON, optional template context overrides)
  2. When generating one-pager with campaign_id: merge campaign context into prompt
  3. Account template defaults used if campaign context empty
  4. Example: "Post-MODEX Q2 Push" campaign can override "why now" to be Q2-specific
- **Test/Validation**:
  - Unit test: Verify context merging logic
  - Integration test: Create Campaign + Account, generate one-pager, verify campaign context applied
  - Manual test: Create MODEX vs non-MODEX campaigns, verify different one-pagers generated
- **Dependencies**: Completes Task 5.4
- **Est. LOC**: 50–70 lines

---

### Sprint 6: DX Polish & Performance

#### Task 6.1: Create `/generated-content` Page
- **Title**: Centralized view of all generated content (one-pagers, emails, sequences)
- **Acceptance Criteria**:
  1. New page: `/app/generated-content/page.tsx` (server component with client filters)
  2. Grid/list view showing:
     - Account name (link to account)
     - Campaign name (link to campaign)
     - Content type badge (one-pager | email | sequence)
     - Status (draft | published)
     - Version number
     - Created date
     - Send count (number of times this content was sent)
     - Actions: "View", "Send", "Edit", "Delete"
  3. Filters: by status, campaign, account, content_type
  4. Multi-select + "Bulk send" action (select multiple one-pagers, send to per-account recipients)
  5. Pagination: 25 per page
  6. Sorting: by created_at (reverse), send_count, account_name
- **Test/Validation**:
  - E2E test: Create 10 pieces of content, verify page loads < 2s
  - E2E test: Filter by campaign, verify results
  - E2E test: Multi-select 3 pieces, bulk send, verify dialog opens with correct recipients
  - Manual test: Check responsive design on mobile
- **Dependencies**: Sprint 6 start (no prior task deps, but improves Sprints 2-5 UX)
- **Est. LOC**: 350–400 lines

#### Task 6.2: Implement Bulk Preview + Send from Generated Content
- **Title**: Select multiple one-pagers, preview all, send in batch
- **Acceptance Criteria**:
  1. Multi-select on `/generated-content` page:
     - Checkboxes next to each content row
     - "Bulk actions" toolbar appears when ≥1 selected
  2. "Preview all" button → modal with side-by-side previews (carousel or tabs)
  3. "Send all" button → dialog showing:
     - Each content + recipient list for its account
     - Aggregate: "5 one-pagers → 12 total recipients"
     - Confirmation screen
     - On send: queues background jobs, shows progress toast
  4. Response: returns batch_id + links to `/queue/generations?batch_id=xxx`
- **Test/Validation**:
  - E2E test: Select 3 pieces, preview all, send, verify all emails queued
  - E2E test: Preview modal navigates through pieces
  - Performance test: Preview 20 pieces, verify < 3s load
- **Dependencies**: Completes Task 6.1
- **Est. LOC**: 200–250 lines

#### Task 6.3: Parallelize Account + Persona Fetching (Performance)
- **Title**: Optimize `/queue/generations` page load time
- **Acceptance Criteria**:
  1. When page loads, fetch in parallel:
     - GenerationJob list (with account names, campaign names)
     - Account list (for lookup)
     - Campaign list (for lookup)
     - Use `Promise.all()` to run all queries in parallel (not sequential)
  2. Page server component uses `Promise.all([getJobs(), getAccounts(), getCampaigns()])`
  3. Verify load time < 500ms with 100 jobs
- **Test/Validation**:
  - Performance test: Load page with 100 jobs, measure time
  - Verify Lighthouse score (Core Web Vitals)
  - Compare before/after parallel fetch: should save ~200-300ms
- **Dependencies**: None (optimization only, can be applied retroactively)
- **Est. LOC**: 40–60 lines

#### Task 6.4: Add Generation Metrics Dashboard
- **Title**: New `/admin/generation-metrics` showing stats + trends
- **Acceptance Criteria**:
  1. New page showing:
     - Avg generation time (per provider, per content_type)
     - Success rate (completed / total)
     - Provider breakdown (pie chart: % Gemini vs OpenAI)
     - Queue depth (pending + processing)
     - Retry rate (jobs retried / total)
     - Timeline: completions over last 7 days
  2. Filters: by date range, content_type, campaign
  3. Refresh rate: 30s (SWR poll)
- **Test/Validation**:
  - Manual test: Generate 10 pieces, check metrics appear
  - Manual test: Trigger a failure, verify retry rate updates
  - Manual test: Check timestamps + sorting
- **Dependencies**: None (admin-only, builds on existing data)
- **Est. LOC**: 250–300 lines

#### Task 6.5: Quick-Send Chain: Generate → Send → Log Atomically
- **Title**: Single-button workflow: "Generate & send to X recipients"
- **Acceptance Criteria**:
  1. New button on Account page: "Quick send to [Persona 1, Persona 2, Persona 3]"
  2. On click:
     - Opens dialog: select 1-3 recipients
     - Click "Generate & send"
     - Backend:
       a. Calls `/api/ai/one-pager` synchronously (not queued)
       b. On success: calls `/api/email/send-bulk` immediately
       c. Creates Activity log for each recipient
       d. Updates Account.outreach_status
       e. Returns: success toast with email count
  3. If generation fails: show error, don't send emails
  4. All-or-nothing transaction: generation + send + log or rollback
- **Test/Validation**:
  - E2E test: Click "Quick send", select 2 recipients, verify emails sent + activities created
  - E2E test: Simulate generation failure, verify no emails sent
  - Integration test: Verify transaction semantics (all-or-nothing)
- **Dependencies**: Completes Task 6.2
- **Est. LOC**: 150–200 lines

---

## DATA MODEL CHANGES

### New Tables

#### `GenerationJob`
```prisma
model GenerationJob {
  id                Int      @id @default(autoincrement())
  batch_id          String   @default(cuid())           // Groups related jobs
  account_name      String
  campaign_id       Int?
  persona_name      String?
  content_type      String   // "one_pager" | "email" | "sequence"
  status            String   @default("pending")       // pending | processing | completed | failed
  provider_used     String?                             // "gemini" | "openai" | "control_plane"
  error_message     String?
  ai_error_type     String?                             // "429_quota" | "timeout" | "parse_error"
  attempted_at      DateTime?
  completed_at      DateTime?
  retry_count       Int      @default(0)
  
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  account           Account  @relation(fields: [account_name], references: [name])
  campaign          Campaign? @relation(fields: [campaign_id], references: [id])
  
  @@index([status, updated_at])
  @@index([account_name, campaign_id])
  @@index([batch_id])
  @@map("generation_jobs")
}
```

#### `AccountTemplate` (Reference Data)
```prisma
model AccountTemplate {
  id                    Int      @id @default(autoincrement())
  vertical              String   @unique
  default_icp_fit       Int
  default_modex_signal  Int
  default_primo_fit     Int
  default_strategic_val Int
  sample_why_now        String
  sample_primo_angle    String
  template_context      Json     // OnePagerContext
  
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  
  @@map("account_templates")
}
```

### Modified Tables

#### `GeneratedContent`
**Add columns:**
```prisma
  version           Int      @default(1)
  version_metadata  Json?
  published_at      DateTime?
  external_send_count Int    @default(0)
  ai_error          String?  // "gemini_429" | "openai_timeout"
```

**Add constraint:**
```prisma
  @@unique([account_name, campaign_id, content_type, version])
```

#### `EmailLog`
**Add columns:**
```prisma
  generated_content_id Int?
  generated_content  GeneratedContent? @relation(fields: [generated_content_id], references: [id], onDelete: SetNull)
```

#### `Campaign`
**Add columns:**
```prisma
  tone_preference      String?  // "professional" | "casual" | "bold"
  one_pager_context_override Json?
```

#### `Account`
Add optional field (if not present):
```prisma
  vertical         String?
```

---

## API CHANGES

### New Endpoints

#### POST `/api/ai/generate-batch`
**Request:**
```json
{
  "accounts": ["General Mills", "Frito-Lay", "Diageo"],
  "campaign_id": 1,
  "content_type": "one_pager"
}
```

**Response (202 Accepted):**
```json
{
  "batch_id": "cuid-xxx",
  "jobs": [
    { "id": 1, "account_name": "General Mills", "status": "pending" },
    { "id": 2, "account_name": "Frito-Lay", "status": "pending" },
    { "id": 3, "account_name": "Diageo", "status": "pending" }
  ]
}
```

**Rate limit:** 100 jobs/min per IP

---

#### GET `/api/ai/health`
**Response:**
```json
{
  "status": "ok",
  "providers": [
    {
      "name": "gemini",
      "last_error": null,
      "retry_available": true,
      "last_checked": "2026-05-01T10:30:00Z"
    },
    {
      "name": "openai",
      "last_error": null,
      "retry_available": true,
      "last_checked": "2026-05-01T10:30:00Z"
    }
  ]
}
```

**Cache:** 30s

---

### Modified Endpoints

#### POST `/api/ai/one-pager`
**Add optional parameter:**
```json
{
  "accountName": "General Mills",
  "campaign_id": 1,  // NEW: optional
  "version": 2       // NEW: optional, defaults to auto-increment
}
```

**Response includes:**
```json
{
  "content": { /* one-pager JSON */ },
  "accountName": "General Mills",
  "version": 2,      // NEW
  "ai_error": null   // NEW: set if generation had errors but fallback succeeded
}
```

---

#### POST `/api/email/send-bulk`
**Add optional parameter:**
```json
{
  "recipients": [ /* ... */ ],
  "subject": "...",
  "bodyHtml": "...",
  "accountName": "...",
  "generated_content_id": 123  // NEW: optional
}
```

**Response includes:**
```json
{
  "success": true,
  "sent": 5,
  "failed": 0,
  "generated_content_id": 123  // NEW: echoed back
}
```

---

### New Background Job Endpoint

#### POST `/api/jobs/process-generations` (Internal Cron)
**Trigger:** Every 5 seconds (can be Vercel Cron or external scheduler)  
**Behavior:**
- Query GenerationJob where `status = "pending"` (limit 5)
- Process each job (call `generateText()`, save result)
- Update job status + GeneratedContent

**No response body** (internal only)

---

## COMPONENT CHANGES

### New Components

#### `src/components/email/one-pager-send-dialog.tsx`
- Multi-select recipients
- Preview generated one-pager
- Send button
- Activity log auto-creation

**Props:**
```typescript
{
  generatedContentId: number;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}
```

---

#### `src/components/ai/one-pager-version-selector.tsx`
- Dropdown: list versions with status (draft/published)
- Metadata display (tone, created_at, sent_count)
- "Publish" button
- "Reset" button

**Props:**
```typescript
{
  accountName: string;
  campaignId?: number;
  onVersionChange?: (versionId: number) => void;
}
```

---

#### `src/components/queue/generation-job-list.tsx`
- Table: job status, account, error message, actions
- Filters: by status, campaign, account
- Pagination
- Real-time updates (SWR or polling)

**Props:**
```typescript
{
  filter?: { status?: string; campaign_id?: number };
  refreshInterval?: number;
}
```

---

### Modified Components

#### `src/components/email/composer.tsx` (EmailComposer)
- Add "Generate one-pager" button (if account selected)
- Link to `/queue/generations` page
- Show generation status (pending/completed/failed)

---

#### `src/app/accounts/[slug]/page.tsx`
- Add "Generate one-pager" button
- Show generated one-pagers list with versions
- Add "Quick send" button (links to quick-send chain from Task 6.5)

---

#### `src/app/accounts/page.tsx`
- Add multi-select checkboxes
- "Bulk generate one-pagers" button (Task 2.5)
- Show generation queue status

---

## CONFIGURATION CHANGES

### Environment Variables
**New (optional):**
```
GENERATION_JOB_POLLING_INTERVAL=5000  # ms, how often to check for pending jobs
GENERATION_MAX_CONCURRENT=5            # max jobs to process simultaneously
GENERATION_RETRY_MAX=3                 # max retries per job
GENERATION_TIMEOUT=30000               # ms, timeout per generation
```

**Existing (no changes):**
- `GEMINI_API_KEY`, `OPENAI_API_KEY` (already used)
- `FROM_EMAIL`, `FROM_NAME` (already used)
- `DATABASE_URL` (already used)

---

### Rate Limiting
**Updates:**
- `/api/ai/generate-batch`: 100 jobs/min per IP (batch-level, not per-job)
- `/api/email/send-bulk`: 10 requests/min per IP (existing, maintained)
- All other `/api/ai/*`: 10 requests/min per IP (existing, maintained)

---

## TESTING STRATEGY

### Unit Tests (per sprint)

**Sprint 1:**
- Provider error classification (Gemini 429 vs app rate limit)
- Exponential backoff timing
- Provider selection logic

**Sprint 2:**
- GenerationJob creation + versioning
- Batch job queueing logic
- FIFO + retry logic in processor

**Sprint 3:**
- OnePageSendDialog recipient selection
- Activity log creation transaction
- EmailLog FK linkage

**Sprint 4:**
- Version computation + uniqueness
- Version selector logic

**Sprint 5:**
- Account template merging
- Priority score computation for verticals

**Sprint 6:**
- Bulk preview logic
- Multi-select state management
- Metrics aggregation

---

### Integration Tests (per sprint end)

**End-to-end workflows:**
1. Generate one-pager → save → send to 3 recipients → verify emails + activities
2. Batch generate 10 accounts → queue visible → retry failing job → verify completion
3. Create new account (non-MODEX) → auto-populate context → generate → preview
4. Create 2 versions → publish v1 → send both → verify tracking separate

**DB integrity:**
- FK constraints verified on all relations
- No orphaned GeneratedContent if GenerationJob deleted
- Cascade delete tested

---

### E2E Tests (Playwright)

**Critical paths:**
- Account detail → Generate one-pager → Preview → Send to 2 personas → Check activity log
- Accounts page → Multi-select 5 → Bulk generate → Queue page loads → Track completion
- New account flow → Fill form → Preview → Save → Generation starts
- Generated content page → Multi-select 3 → Bulk send → Track emails

---

## SUCCESS METRICS

### Quantitative
| Metric | Target | Current | Improvement |
|--------|--------|---------|------------|
| Clicks to send (per account) | 3 | 8 | -62% |
| Generation time (per account) | <2s avg | varies (Gemini quota) | 99.5% success rate |
| Max batch size | 50 accounts | N/A | new capability |
| Queue job completion rate | 99.5% | N/A | new system |
| One-click send success rate | 99% | N/A | new feature |

### Qualitative
- Casey can onboard new non-MODEX accounts without engineer help
- Generation failures are visible + retryable (not silent 500 errors)
- Campaign-scoped one-pagers enable A/B testing
- Bulk send chains maximize campaign velocity

---

## ROLLOUT PLAN

### Staging
- Deploy each sprint to Vercel Preview environment
- Run full Playwright E2E suite before merging to `main`
- Manual testing by Casey on each sprint end (demo day)

### Production
- Merge to `main` → Vercel auto-deploys
- Gradual rollout: enable new features via feature flags (if high risk)
- Monitor: generation success rate, email send errors, queue depth

### Rollback Risk
- Sprint 1: Low (provider fallback only)
- Sprint 2: Medium (new job table + background worker)
- Sprint 3: Low (new component, existing send API)
- Sprint 4: Low (versioning is additive)
- Sprint 5: Medium (new account creation flow)
- Sprint 6: Low (UI polish, no backend changes)

---

## DEPENDENCIES & BLOCKERS

**Hard dependencies:** None (each sprint can be deployed independently)

**Soft dependencies (for full workflow):**
- Sprint 1 → Sprint 2 (queue system relies on improved error handling)
- Sprint 2 → Sprint 3 (send dialog queries GeneratedContent efficiently)
- Sprint 4 → Sprint 3 (optional, but improves send feature)
- Sprint 5 → account creation (enables new campaigns)
- Sprint 6 → all previous (polish layer)

**Known constraints:**
- Railway database: Ensure migrations tested before Vercel deploy
- Vercel Cron: Verify cron trigger rate (5s polling may require Vercel Business plan)
- Gmail API: Rate limit 500 req/min (bulk send limited to 10/min app-level to be conservative)

---

## ACCEPTANCE CRITERIA (DONE-DONE)

Each sprint is complete when:
1. ✅ All acceptance criteria from task list met
2. ✅ Unit tests pass + coverage >80%
3. ✅ E2E tests pass on Vercel Preview
4. ✅ Manual testing completed by team lead
5. ✅ Database migrations tested locally + on Railway
6. ✅ Performance baseline established (Lighthouse >80)
7. ✅ Security review passed (no exposed secrets, SQL injection vectors checked)
8. ✅ Code reviewed + approved by senior engineer
9. ✅ Deployed to production without rollback
10. ✅ Casey confirms feature works as designed (demo sign-off)

---

## ESTIMATED TIMELINE

| Sprint | Tasks | Est. Days | End Date |
|--------|-------|----------|----------|
| 1: Provider Resilience | 4 | 2 | May 5 |
| 2: Queue System | 5 | 3 | May 8 |
| 3: Direct Send | 5 | 2 | May 10 |
| 4: Versioning | 4 | 2 | May 12 |
| 5: Templates | 5 | 3 | May 15 |
| 6: Polish | 5 | 2 | May 17 |
| **Total** | **28** | **14** | **May 17** |

**Assumptions:** 1 developer, 8h/day, no blockers

---

## FILES TO CREATE

### New Source Files
```
src/lib/ai/provider-classifier.ts          (Sprint 1) — 80 lines
src/lib/job-processor.ts                    (Sprint 2) — 200 lines
src/lib/templates/account-templates.ts      (Sprint 5) — 250 lines
src/lib/actions/create-account-with-context.ts (Sprint 5) — 100 lines

src/components/email/one-pager-send-dialog.tsx  (Sprint 3) — 300 lines
src/components/ai/one-pager-version-selector.tsx (Sprint 4) — 150 lines
src/components/queue/generation-job-list.tsx (Sprint 2) — 250 lines

src/app/queue/generations/page.tsx         (Sprint 2) — 200 lines
src/app/accounts/new/page.tsx              (Sprint 5) — 350 lines
src/app/generated-content/page.tsx         (Sprint 6) — 400 lines
src/app/admin/generation-metrics/page.tsx  (Sprint 6) — 300 lines

src/app/api/ai/generate-batch/route.ts     (Sprint 2) — 120 lines
src/app/api/ai/health/route.ts             (Sprint 1) — 60 lines
src/app/api/jobs/process-generations/route.ts (Sprint 2) — 150 lines
```

### Modified Source Files
```
src/lib/ai/client.ts                       (Sprint 1, 2) — +120 lines
src/app/api/ai/one-pager/route.ts          (Sprint 1, 2, 4) — +80 lines
src/app/api/email/send-bulk/route.ts       (Sprint 3) — +40 lines
src/components/email/composer.tsx          (Sprint 3, 6) — +50 lines
src/app/accounts/[slug]/page.tsx           (Sprint 3, 5, 6) — +80 lines
src/app/accounts/page.tsx                  (Sprint 2, 5) — +60 lines
```

### New Database Files
```
prisma/migrations/[timestamp]_add_generation_jobs_table/migration.sql
prisma/migrations/[timestamp]_add_account_templates_table/migration.sql
prisma/migrations/[timestamp]_extend_generated_content_versioning/migration.sql
prisma/migrations/[timestamp]_extend_email_log_generated_content_fk/migration.sql
prisma/migrations/[timestamp]_extend_campaign_context_overrides/migration.sql
```

---

## REVIEW CHECKLIST FOR APPROVER

Before sprint deployment:

- [ ] All acceptance criteria achieved (verified in PR description)
- [ ] Test coverage ≥80% (coverage report attached)
- [ ] E2E tests pass on Vercel Preview
- [ ] Database migrations tested on Railway (test pushed + verified)
- [ ] No TypeScript errors (`npm run build` passes)
- [ ] No console warnings/errors on manual test
- [ ] Secret/ENV handling reviewed (no hardcoded keys)
- [ ] Performance baseline established (Lighthouse >80)
- [ ] Code follows project conventions (checked against copilot-instructions.md)
- [ ] Security review: SQL injection, XSS, rate limit bypass not possible
- [ ] Rollback plan documented in PR
- [ ] Demo completed + Casey sign-off obtained

---

**END OF SPRINT PLAN**
