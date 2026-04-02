# YardFlow Outreach Engine — Sprint Plan

> Created: 2026-04-02
> Status: Active
> Goal: Unblock 50+ high-quality contacts trapped behind a stale bounce blocklist, send personalized ABM content via Gmail API, and book MODEX meetings before April 13.

---

## Situation Assessment

### What we have (GOOD)
- **Gmail API pipeline proven**: 14/14 emails delivered via `casey@freightroll.com` (Apr 2)
- **25 account microsites** deployed at `/for/[account]` with personalized hero, problem, proof, ROI, CTA sections
- **76 accounts, 222 personas** in DB — 100+ with Name + Title + Email (NTE quality)
- **Hand-crafted Wave 1 email copy** proven to deliver (General Mills, Frito-Lay, Diageo sent today)
- **CI green**, build passing, Vercel deployment live

### What's broken (BLOCKING)
- **10 target account domains blocked by `recipient-guard.ts`** — all bounces came from `casey@yardflow.ai` (burned domain, never authenticated). Zero bounces from `casey@freightroll.com`. The guard was built to protect against bad destinations, but the destinations were never the problem.
- **50 NTE-quality personas** at JM Smucker, Hormel, Home Depot, Georgia Pacific, H-E-B, John Deere, Hyundai, Kenco, Barnes & Noble, FedEx sitting idle
- **No batch send script** for Wave 2/3 — `wave1-resend-gmail.ts` was single-purpose
- **No email logging to DB** from batch scripts — sends go through Gmail API but don't write to `email_logs`
- **Poor persona data** at Coca-Cola (1 bad record), AB InBev (1, no title), Mondelez (3, no titles), KDP (3, no titles)

---

## The 10 Sniper Picks

One contact per account. Highest seniority decision-maker with proven email (NTE quality). Each has a live microsite. Ordered by strategic value.

### Pick 1: Rob Ferguson — JM Smucker
- **Title:** Chief Product Supply Officer / Executive Vice President
- **Email:** rob.ferguson@jmsmucker.com
- **Domain Status:** `jmsmucker.com` currently BLOCKED in recipient-guard (bounced from yardflow.ai only)
- **Wave:** 1 (Must-book)
- **Priority Band:** B (81)
- **Microsite:** `/for/jm-smucker` — "New product supply leadership. 25+ facilities still running local yard playbooks."
- **Why this person:** He IS the supply chain. CSPO + EVP. Reports to CEO. Owns every facility's logistics stack. New in role = greenfield for vendor evaluation. If he says yes, deal is done.
- **Why now:** Smucker's completed the Hostess acquisition (2024). Integrating 25+ facilities under new supply leadership. Yard standardization is a real problem when you're merging two distribution networks.

### Pick 2: Will Bonifant — Hormel Foods
- **Title:** Group Vice President and Chief Supply Chain Officer
- **Email:** will.bonifant@hormel.com
- **Domain Status:** `hormel.com` currently BLOCKED (bounced from yardflow.ai only)
- **Wave:** 1 (Must-book)
- **Priority Band:** B (81)
- **Microsite:** `/for/hormel-foods` — "New supply chain leadership. 40+ facilities. Zero standardized yard protocol."
- **Why this person:** CSCO. Ultimate decision-maker for any logistics tech adoption across Hormel's 40+ plants. Title matches our ICP persona lane exactly.
- **Why now:** Hormel's "Transform and Modernize" initiative is a $250M+ supply chain overhaul. Yard management is the unglamorous piece nobody's addressed yet. New CSCO = new evaluation window.
- **Note:** Also have 4 more contacts at @hormel.com (Nicholas Schwartz, Tim Whitson, Anthony Nguyen, Connor McKenney). Duplicates exist at @hormelfoods.com — same people, different domain.

### Pick 3: Ryan Hutcherson — Georgia Pacific
- **Title:** Senior Vice President, Supply Chain
- **Email:** ryan.hutcherson@gapac.com
- **Domain Status:** `gapac.com` currently BLOCKED (bounced from yardflow.ai only)
- **Wave:** 2 (per outreach-waves.json), but listed as Wave 1 target in business rules
- **Priority Band:** C (75)
- **Microsite:** `/for/georgia-pacific` — "150+ manufacturing sites. Every mill yard is a different universe. Atlanta HQ is 10 miles from MODEX."
- **Why this person:** SVP Supply Chain. Owns the full logistics stack. GP is Koch Industries — these are massive, complex industrial operations.
- **Why now:** GP HQ is in Atlanta. MODEX is in Atlanta. Proximity = easy meeting. 150+ sites = enormous yard management problem. The "every mill yard is a different universe" angle is tailor-made.

### Pick 4: Troy Retzloff — H-E-B
- **Title:** Senior Director of Distribution
- **Email:** troy.retzloff@heb.com
- **Domain Status:** `heb.com` currently BLOCKED (bounced from yardflow.ai only)
- **Wave:** 2 (per outreach-waves.json), Wave 1 per business rules
- **Priority Band:** C (75 — should arguably be higher, H-E-B is a logistics powerhouse)
- **Microsite:** `/for/h-e-b`
- **Why this person:** Sr. Director of Distribution. Owns the DC network. H-E-B runs one of the most sophisticated grocery supply chains in the US. Distribution director = the person who feels yard pain daily.
- **Why now:** H-E-B has been expanding aggressively outside Texas (first stores in DFW market). New DCs = new yard challenges. Their supply chain team is operations-proud and invests in technology that works.
- **Note:** Also have Craig Stucker (Director, Parkway Transport), Troy Shaw (Supply Chain Strategy), Jeffrey Matthews (Ops & SCM), Dakota Socha (Transportation & Reverse Logistics) — all NTE quality.

### Pick 5: John Deaton — Home Depot
- **Title:** Executive Vice President — Supply Chain & Product Development
- **Email:** john.deaton@homedepot.com
- **Domain Status:** `homedepot.com` currently BLOCKED (bounced from yardflow.ai only)
- **Wave:** 1 (Must-book, warm intro + email)
- **Priority Band:** C (75)
- **Microsite:** `/for/the-home-depot`
- **Why this person:** EVP. C-suite supply chain. Owns the entire flow for 2,000+ stores. Home Depot's supply chain is top 5 in US retail.
- **Why now:** Home Depot invested $1.2B in supply chain over 3 years. They manage 200+ DCs and cross-docks. Every one of those has a yard. The scale of the dock scheduling problem is enormous.
- **Risk:** Wave plan says "warm intro + email." We don't have a warm intro path identified. Cold email to an EVP at Home Depot is a long shot but worth the attempt given the microsite quality.

### Pick 6: Jim Small — Honda
- **Title:** Senior Vice President, Honda Logistics North America
- **Email:** jim.small@honda.com
- **Domain Status:** `honda.com` NOT BLOCKED — ready to send now
- **Wave:** 2 (High-value)
- **Priority Band:** D (but NTE quality personas, automotive vertical)
- **Microsite:** `/for/honda`
- **Why this person:** SVP of Honda Logistics NA. Owns the entire inbound/outbound logistics operation for Honda manufacturing. Highest-ranking logistics executive in their NA operation.
- **Why now:** Automotive OEMs are the most yard-intensive operations in the world. Parts arrive just-in-time. A single yard delay can shut down a production line. Honda's Marysville and East Liberty plants handle thousands of inbound trailers per week.

### Pick 7: Cory Reed — John Deere
- **Title:** President, Lifecycle Solutions, Supply Management, and Customer Success
- **Email:** cory.reed@johndeere.com
- **Domain Status:** `johndeere.com` currently BLOCKED (bounced from yardflow.ai only)
- **Wave:** 2 (High-value)
- **Priority Band:** D
- **Microsite:** `/for/john-deere`
- **Why this person:** President-level. Owns supply management. Deere is a massive industrial manufacturer with complex inbound logistics across multiple factory campuses.
- **Why now:** Deere's "Smart Industrial" strategy includes digitizing every part of the operation. Yard management is an obvious gap in their otherwise advanced tech stack. Agricultural equipment manufacturing = heavy inbound trailers, seasonal peaks, complex staging.

### Pick 8: Annette Danek-Akey — Barnes & Noble
- **Title:** Chief Supply Chain Officer
- **Email:** annette.danek-akey@bn.com
- **Domain Status:** `bn.com` currently BLOCKED (bounced from yardflow.ai only)
- **Wave:** 3 (Ecosystem)
- **Priority Band:** D
- **Microsite:** `/for/barnes-noble`
- **Why this person:** CSCO. The decision-maker. B&N runs massive distribution centers for book fulfillment — high volume, tight dock windows, seasonal spikes (holidays, back-to-school).
- **Why now:** B&N has been in a renaissance under James Daunt. They're investing in their physical supply chain after years of neglect. New DC in Dallas opened recently. The CSCO is the right person to pitch yard automation to.

### Pick 9: Kristi Montgomery — Kenco Logistics
- **Title:** Vice President of Strategic Transformation
- **Email:** kristi.montgomery@kencogroup.com
- **Domain Status:** `kencogroup.com` currently BLOCKED (bounced from yardflow.ai only)
- **Wave:** 3 (Ecosystem)
- **Priority Band:** D
- **Microsite:** `/for/kenco-logistics-services`
- **Why this person:** VP of Strategic Transformation. This is literally the person whose job is to find new technology for Kenco's operations. Kenco is a 3PL — they manage yards for OTHER companies. If Kenco adopts YardFlow, it multiplies across their entire client base.
- **Why now:** 3PLs are under margin pressure. Yard efficiency is a direct cost lever. A VP of "Strategic Transformation" at a 3PL is the perfect buyer persona for yard automation tech.

### Pick 10: Yongchul Chung — Hyundai Motor America
- **Title:** Senior Manager, Global Logistics & Supply Chain
- **Email:** yongchul.chung@hmna.com
- **Domain Status:** `hmna.com` currently BLOCKED (bounced from yardflow.ai only)
- **Wave:** 2 (High-value)
- **Priority Band:** D
- **Microsite:** `/for/hyundai-motor-america`
- **Why this person:** Global logistics & supply chain management. Hyundai's NA operation handles massive vehicle distribution logistics. Port-to-dealer pipeline involves complex yard staging at VPCs (Vehicle Processing Centers).
- **Why now:** Hyundai/Kia have been the fastest-growing auto brands in NA. Volume growth = yard congestion at their processing centers. They opened a new EV plant in Georgia (Hyundai Motor Group Metaplant America) — new facility = greenfield yard tech opportunity.
- **Risk:** All 5 @hmna.com addresses bounced in earlier sends. May need to verify the domain is correct for Hyundai Motor America. Could be @hyundai.com or @hma.com.

---

## Sprint Plan

### SPRINT 1: Unblock the Pipeline
**Goal:** Remove stale bounce blocklist for target domains and build a reusable Gmail API batch sender with DB logging.
**Demo:** Run dry-run of 10-contact send, showing per-recipient eligibility check + email preview + DB log entry.

#### Task 1.1: Unblock target domains in recipient-guard.ts
- **What:** Remove 10 target domains from `SYSTEM_BLOCKED_DOMAINS` in `src/lib/email/recipient-guard.ts`. Keep `dannon.com`, `danone.com`, `bluetriton.com`, `yardflow.ai`, `niagarawater.com`, `freightroll.com`, `lpcorp.com`, `xpo.com`, `kraftheinz.com` blocked.
- **Files:** `src/lib/email/recipient-guard.ts`
- **Validation:** Unit test — `evaluateRecipientEligibility(prisma, 'rob.ferguson@jmsmucker.com')` returns `{ ok: true }`. Same for all 10 sniper emails. `evaluateRecipientEligibility(prisma, 'heiko.gerling@danone.com')` still returns `{ ok: false }`. Also test that `evaluateRecipientEligibility(prisma, 'casey@yardflow.ai')` returns `{ ok: false }`.
- **Commit message:** `fix(email): unblock 10 target domains from stale yardflow.ai bounce guard`

#### Task 1.2a: Batch sender CLI skeleton + recipient-guard pre-flight
- **What:** Create `scripts/batch-send-gmail.ts` with CLI arg parsing (`--contacts=<name>`, `DRY_RUN=1`) and per-recipient guard checking. Imports contact list from `scripts/contacts/<name>.ts`. Checks each recipient against `evaluateRecipientEligibility(prisma, email)` AND `unsubscribed_emails` table. Outputs pass/fail per contact.
- **Files:** `scripts/batch-send-gmail.ts`
- **Interface:**
  ```ts
  interface BatchContact {
    to: string;
    firstName: string;
    accountName: string;  // maps to email_logs.account_name
    personaName?: string; // maps to email_logs.persona_name
    accountSlug: string;
    subject: string;
    body: string[];  // plain text lines, converted to HTML → email_logs.body_html
  }
  ```
- **Validation:** `DRY_RUN=1 npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=sniper-10` shows 10 contact previews with PASS/FAIL for recipient-guard and unsubscribed check.
- **Commit message:** `feat(scripts): batch sender CLI skeleton with recipient-guard + unsubscribe pre-flight`

#### Task 1.2b: Batch sender Gmail API send integration
- **What:** Add Gmail API send to batch sender. Reuse `sendEmail()` from `src/lib/email/gmail-sender.ts` or inline the OAuth + MIME construction from `wave1-resend-gmail.ts`. Rate limit: 6-second delay between sends (10/min max). Use `--env-file=.env.local` pattern (not `dotenv/config`).
- **Files:** `scripts/batch-send-gmail.ts`
- **Validation:** Send 1 test email to `casey@freightroll.com` via the script (not dry-run). Gmail Sent folder shows the email. Console outputs Gmail message ID.
- **Commit message:** `feat(scripts): batch sender Gmail API send with rate limiting`

#### Task 1.2c: Batch sender DB logging
- **What:** After each successful Gmail API send, write to `email_logs` via Prisma: `account_name`, `persona_name`, `to_email`, `subject`, `body_html`, `status='sent'`, `provider_message_id` (Gmail ID), `sent_at`.
- **Files:** `scripts/batch-send-gmail.ts`
- **Validation:** After a real send, query: `SELECT * FROM email_logs WHERE provider_message_id = '<gmail_id>'` returns 1 row with correct `account_name` and `to_email`.
- **Commit message:** `feat(scripts): batch sender DB logging to email_logs`

#### Task 1.3: Create sniper-10 contact definition
- **What:** Create `scripts/contacts/sniper-10.ts` — the 10 approved contacts with hand-crafted subjects and body copy. Each email references the account's microsite URL. No em dashes. Short paragraphs. Contractions.
- **Files:** `scripts/contacts/sniper-10.ts`
- **Validation:** TypeScript compiles. Each contact has: `to`, `firstName`, `accountName`, `accountSlug`, `subject` (< 60 chars, no brackets/emoji), `body` (3-6 paragraphs, no em dashes, no semicolons).
- **Commit message:** `feat(contacts): sniper-10 contact list with hand-crafted copy`

#### Task 1.4: Dry-run sniper-10 send
- **What:** Execute `DRY_RUN=1 npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=sniper-10` and capture output.
- **Validation:** All 10 contacts pass recipient-guard. All 10 email previews render correctly. Zero errors.
- **Commit message:** N/A (execution, not code change)

#### Task 1.5: Verify hmna.com domain before unblocking
- **What:** Before sending to Hyundai contacts, verify `hmna.com` is the correct corporate email domain. All 5 previous sends to @hmna.com bounced. Test by checking MX records (`dig MX hmna.com`), or try a lightweight verification. If domain is wrong, research correct domain (@hyundai.com, @hma.com, @hyundaimotoramerica.com) and update Pick 10.
- **Files:** N/A (research task)
- **Validation:** MX record lookup confirms domain accepts mail, OR replacement domain identified and updated in contact list.
- **Commit message:** N/A (manual verification)
- **Type:** `manual-research`

---

### SPRINT 2: Send & Track
**Goal:** Send the sniper-10 emails live, log to DB, confirm delivery, and display send history in the app.
**Demo:** Live emails in Gmail Sent folder + email_logs rows in DB + `/analytics` page showing updated send counts.

#### Runbook Step 2.1: Live send sniper-10
- **What:** Execute `npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=sniper-10` (no DRY_RUN).
- **Validation:** 10 Gmail API message IDs returned. All 10 visible in Gmail Sent folder. 10 new rows in `email_logs` table.
- **Type:** `runbook` (execution, not code change)

#### Task 2.2: Build Wave 2 contact list (25 contacts)
- **What:** Create `scripts/contacts/wave2-full.ts` — all NTE personas across JM Smucker (4 remaining), Hormel (4 remaining), Georgia Pacific (4 remaining), H-E-B (4 remaining), Home Depot (4 remaining), Honda (5). Each gets a unique subject and body referencing account-specific pain points and microsite URL.
- **Files:** `scripts/contacts/wave2-full.ts`
- **Validation:** 25 contacts, all NTE quality, unique subjects, no em dashes, no semicolons, all compile.
- **Commit message:** `feat(contacts): wave2-full — 25 NTE contacts across 6 accounts`

#### Runbook Step 2.3: Dry-run + live send Wave 2
- **What:** Dry-run, review output, then live send.
- **Validation:** 25 sends, 25 Gmail IDs, 25 email_logs rows.
- **Type:** `runbook` (execution, not code change)

#### Task 2.4: Extend analytics page with email_logs data
- **What:** Extend the existing `/analytics` page (already has `force-dynamic`) to query `email_logs` for send counts grouped by `account_name`, `status`, and date. Show total sent, total delivered (if tracking available), last send date.
- **Files:** `src/app/analytics/page.tsx`, `src/lib/db.ts` (add `dbGetEmailLogStats()`)
- **Validation:** `/analytics` page shows accurate send counts matching `email_logs` table. `npm run build` passes.
- **Commit message:** `feat(analytics): email send log stats from DB`

---

### SPRINT 3: Follow-Up Engine
**Goal:** Build threaded follow-up sends (T2: Re: thread) for all contacts who haven't replied, with automated scheduling logic.
**Demo:** Dry-run follow-up batch showing Re: threaded subjects, shorter copy, urgency escalation.

#### Task 3.0: Prisma schema migration for touch_number
- **What:** Run `npx prisma db push` after adding `touch_number` to schema (Task 3.2). Must complete before follow-up generator can write touch numbers.
- **Prerequisite:** Task 3.2 schema change committed.
- **Validation:** `npx prisma db push` succeeds. Existing email_logs rows get `touch_number=1` (default). Confirm with: `SELECT touch_number, COUNT(*) FROM email_logs GROUP BY touch_number`.
- **Type:** `runbook`

#### Task 3.1: Build follow-up contact generator
- **What:** Create `scripts/generate-follow-ups.ts` — queries `email_logs` to find contacts sent T1 (`touch_number=1`) more than 48 hours ago with no reply. Generates T2 follow-up with `Re:` subject prefix and shorter, more urgent copy. Uses `provider_message_id` from the T1 send to set `In-Reply-To` and `References` headers for proper Gmail threading.
- **Prerequisite:** Runbook Step 2.1 complete (live sends exist in email_logs with `provider_message_id`).
- **Files:** `scripts/generate-follow-ups.ts`
- **Validation:** Output matches expected contacts (those sent T1 48+ hours ago). Subjects use `Re:` prefix. Body is 2-3 paragraphs max. `In-Reply-To` header references the T1 Gmail message ID. Follow-up emails thread correctly in Gmail client.
- **Commit message:** `feat(scripts): follow-up generator — T2 Re: threads with In-Reply-To headers`

#### Task 3.2: Add touch_number tracking to email_logs
- **What:** Add `touch_number Int @default(1)` column to `EmailLog` model. Batch sender writes touch_number. Follow-up generator increments it.
- **Files:** `prisma/schema.prisma`, `scripts/batch-send-gmail.ts`
- **Validation:** `npx prisma db push` succeeds. New sends get `touch_number=1`. Follow-ups get `touch_number=2`.
- **Commit message:** `feat(schema): add touch_number to EmailLog for drip tracking`

#### Task 3.3: T3 — last-before-MODEX template
- **What:** Create `scripts/contacts/t3-last-before-modex.ts` — final pre-show email for all contacted personas. Short, direct, MODEX-specific. References actual MODEX booth number (must be filled in before send). Includes Google Calendar booking link (existing: `https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-...`).
- **Files:** `scripts/contacts/t3-last-before-modex.ts`
- **Validation:** Touch 3 copy is < 100 words per email. References MODEX dates (April 13-16). Includes microsite link + booking link. No em dashes. No semicolons.
- **Commit message:** `feat(contacts): T3 last-before-MODEX template`

#### Task 3.4: Reply monitoring SOP
- **What:** Document reply monitoring cadence: Casey checks Gmail inbox 3x/day (9 AM, 1 PM, 5 PM) for replies. Any positive reply triggers immediate manual follow-up + `reply_status` update in DB. Any bounce triggers investigation and possible re-block of domain.
- **Files:** `docs/REPLY_MONITORING_SOP.md`
- **Validation:** Document exists and covers: check frequency, positive reply workflow, bounce workflow, escalation to Jake.
- **Commit message:** `docs: reply monitoring SOP for MODEX outreach window`
- **Type:** `documentation`

---

### SPRINT 4: Persona Enrichment + Scale
**Goal:** Fix poor-quality personas at high-value accounts (Coca-Cola, AB InBev, Mondelez, KDP) and expand coverage to all 20 target accounts.
**Demo:** Enriched personas in DB with NTE quality, ready for outreach.

#### Task 4.1: Research and add Coca-Cola personas (P1 — highest strategic value)
- **What:** Replace "Dcoe" placeholder with 3-5 real supply chain decision-makers at Coca-Cola. Titles: VP Supply Chain, Director Logistics, VP Warehouse Operations. Coca-Cola is Band B (priority_score 88) — highest-value under-covered account.
- **Files:** `scripts/enrich-personas.ts` (new script to upsert personas via Prisma)
- **Validation:** `SELECT * FROM personas WHERE account_name = 'Coca-Cola'` returns 3-5 rows with non-null `name`, `title`, `email`.
- **Commit message:** `feat(data): enrich Coca-Cola personas with NTE quality contacts`
- **Type:** `manual-research` + code

#### Task 4.2: Research and add AB InBev personas
- **What:** Add 3-5 real supply chain decision-makers at AB InBev NA.
- **Validation:** `SELECT * FROM personas WHERE account_name = 'AB InBev'` returns 3-5 rows with non-null `name`, `title`, `email`.
- **Commit message:** `feat(data): enrich AB InBev personas`
- **Type:** `manual-research` + code

#### Task 4.3: Enrich Mondelez and KDP personas with titles
- **What:** Add titles to existing Mondelez (3) and KDP (3) personas. Research via LinkedIn.
- **Validation:** `SELECT name, title FROM personas WHERE account_name IN ('Mondelez International', 'Keurig Dr Pepper') AND title IS NOT NULL` returns 6 rows.
- **Commit message:** `feat(data): add titles to Mondelez and KDP personas`
- **Type:** `manual-research` + code

#### Task 4.4: Deduplicate Hormel personas
- **What:** Merge @hormel.com and @hormelfoods.com duplicates. Keep @hormel.com as primary (matches corporate domain). Delete @hormelfoods.com duplicates.
- **Files:** `scripts/dedup-hormel.ts`
- **Validation:** `SELECT COUNT(*) FROM personas WHERE email LIKE '%hormelfoods.com'` returns 0. Hormel account still has 5 distinct personas.
- **Commit message:** `fix(data): deduplicate Hormel personas — merge hormelfoods.com into hormel.com`

#### Task 4.5: Clean junk persona records
- **What:** Remove or fix placeholder personas: "Research Needed" at Dollar General/IKEA/Dawn Foods, "Dcoe" at Coca-Cola, "Hawk" at Fairlife, "Sam3" at FS Fresh Foods, single-name-only records (Roweng, Ttaylor, Mbergson, etc.)
- **Files:** `scripts/clean-personas.ts`
- **Validation:** `SELECT COUNT(*) FROM personas WHERE name IN ('Research Needed', 'Dcoe', 'Hawk', 'Sam3')` returns 0.
- **Commit message:** `fix(data): remove placeholder and junk persona records`

---

### SPRINT 5: Reply Detection + Meeting Booking
**Goal:** Build reply detection (manual check via Gmail inbox review) and one-click meeting booking flow from the app.
**Demo:** Casey checks for replies, marks interested accounts, books meeting via Calendly embed in app.

#### Task 5.1: Add reply_status to personas
- **What:** Add `reply_status` enum to Persona model: `none`, `opened`, `replied`, `interested`, `meeting_booked`, `declined`. Add server action to update it.
- **Files:** `prisma/schema.prisma`, `src/lib/actions.ts`
- **Validation:** `npx prisma db push` succeeds. `updatePersonaReplyStatus()` server action works from UI.
- **Commit message:** `feat(schema): add reply_status tracking to Persona model`

#### Task 5.2: Build outreach status dashboard
- **What:** New page at `/outreach` — shows all contacted personas grouped by account with send date, touch number, reply status, and quick-action buttons (mark replied, book meeting, escalate).
- **Files:** `src/app/outreach/page.tsx`, `src/lib/db.ts` (add `dbGetOutreachStatus()`)
- **Validation:** Page renders with all sent-to personas. Status badges show correctly. Build passes. `force-dynamic` present.
- **Commit message:** `feat(ui): outreach status dashboard with reply tracking`

#### Task 5.3: One-click meeting booking
- **What:** "Book Meeting" button on outreach dashboard opens a modal with Google Calendar appointment scheduling embed (existing link from microsite configs). Creates a meeting record in DB using existing `createMeeting()` server action from `src/lib/actions.ts`.
- **Files:** `src/app/outreach/book-meeting-modal.tsx`
- **Validation:** Click "Book Meeting" on a persona → modal opens with Google Calendar scheduling link. After booking, meeting appears in `/meetings` page.
- **Commit message:** `feat(ui): one-click meeting booking from outreach dashboard`

---

### SPRINT 6: MODEX Floor Operations
**Goal:** Mobile-optimized capture + real-time queue for Jake at the MODEX floor.
**Demo:** Casey captures a badge scan on mobile → Jake sees it in his queue within 5 seconds.

#### Task 6.1: Fix Mobile Capture offline queue
- **What:** Wire `queueFlush()` from `src/lib/offline-queue.ts` to the capture form submit. When online, POST to DB immediately. When offline, store in localStorage and auto-flush when connectivity returns.
- **Files:** `src/app/capture/page.tsx`, `src/lib/offline-queue.ts`
- **Validation:** Turn off WiFi → submit capture → turn on WiFi → capture appears in DB within 10 seconds. Playwright test with offline simulation.
- **Commit message:** `feat(capture): wire offline queue flush for MODEX floor reliability`

#### Task 6.2: Real-time Jake Queue refresh
- **What:** Add 10-second polling to Jake Queue page (`/queue`). New captures appear without page refresh.
- **Files:** `src/app/queue/page.tsx` (add client-side polling component)
- **Validation:** Submit a capture → queue page shows new item within 10 seconds without manual refresh.
- **Commit message:** `feat(queue): 10-second auto-refresh for Jake's MODEX floor queue`

#### Task 6.3: QR code quick-capture
- **What:** Scan attendee badge QR → pre-populate capture form with name/company from QR data.
- **Files:** `src/app/capture/qr-scanner.tsx` (new component using browser camera API)
- **Validation:** Camera opens, scans a test QR code, capture form pre-fills. Works on mobile Chrome/Safari.
- **Commit message:** `feat(capture): QR badge scanner for quick floor capture`

---

## Recipient-Guard Domain Decisions

### REMOVE from SYSTEM_BLOCKED_DOMAINS (unblock):
| Domain | Account | Reason to unblock |
|--------|---------|-------------------|
| `homedepot.com` | Home Depot | All 10 bounces were from yardflow.ai. 0 bounces from freightroll.com. |
| `heb.com` | H-E-B | Same — yardflow.ai sender caused bounces, not destination. |
| `fedex.com` | FedEx | Same. |
| `johndeere.com` | John Deere | Same. |
| `kencogroup.com` | Kenco | Same. |
| `bn.com` | Barnes & Noble | Same. |
| `hmna.com` | Hyundai Motor | Same. Needs domain verification — may need to use @hyundai.com. |
| `hormel.com` | Hormel Foods | Same. |
| `gapac.com` | Georgia Pacific | Same. |
| `jmsmucker.com` | JM Smucker | Same. |

### KEEP blocked:
| Domain | Reason |
|--------|--------|
| `dannon.com` | Warm intro only — Mark Shaughnessy |
| `danone.com` | Same as dannon.com |
| `bluetriton.com` | Existing FreightRoll relationship, not cold targets |
| `yardflow.ai` | Burned domain — 213 bounces, never authenticated |
| `niagarawater.com` | Non-target, low quality personas |
| `freightroll.com` | Our own domain |
| `lpcorp.com` | Non-target |
| `xpo.com` | Excluded per Casey |
| `kraftheinz.com` | Deal in progress, demo Monday |

---

## Dependency Chain

```
Sprint 1 (Unblock) → Sprint 2 (Send) → Sprint 3 (Follow-up)
                                      ↘ Sprint 4 (Enrichment — parallel with Sprint 3)
                   → Sprint 5 (Reply tracking + booking) ← Sprint 2
                   → Sprint 6 (MODEX floor — independent, can parallel Sprint 5)
```

Sprint 1 is the critical path. Nothing moves until the domains are unblocked and the batch sender works.
Sprint 4 and Sprint 3 can run in parallel — enrichment feeds back into the batch sender.
Sprint 5 and Sprint 6 are independent — they can run in parallel.

### Timeline Mapping (MODEX Apr 13-16, today = Apr 2)

| Sprint | Window | Days |
|--------|--------|------|
| Sprint 1: Unblock | Apr 2-3 | 1-2 days |
| Sprint 2: Send | Apr 3-4 | 1 day |
| Sprint 3: Follow-up | Apr 5-7 | 2 days (need 48h gap after T1) |
| Sprint 4: Enrichment | Apr 4-7 | parallel with Sprint 3 |
| Sprint 5: Reply tracking | Apr 7-9 | 2 days |
| Sprint 6: MODEX floor | Apr 9-12 | parallel with Sprint 5 |
| **MODEX** | **Apr 13-16** | **Show time** |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Gmail API daily send limit** (~500/day for Workspace) | Medium | Sends throttled mid-batch | Spread sends across 2+ days. Max 15 emails per batch run. Monitor for 429 responses. |
| **Gmail OAuth token expiry** | Low | All sends blocked | Test refresh token exchange before every batch send. Script already tests token as first step. Keep backup: re-auth via Google OAuth in app. |
| **Deliverability to enterprise domains** (homedepot.com, heb.com land in spam) | Medium | Emails sent but never seen | Verify SPF/DKIM/DMARC for freightroll.com before Sprint 2 live sends. If > 2 bounces from freightroll.com on a domain, halt and investigate before sending more. |
| **hmna.com domain incorrect** (all 5 previous sends bounced) | High | Wasted sniper shot on Hyundai | Task 1.5 verifies MX records before unblocking. If wrong, research correct domain before sending. |
| **Stale personas** (contact left company) | Medium | Bounce or wrong-person reply | Monitor bounces per-send. Any "user not found" bounce = remove persona and research replacement. |
| **CAN-SPAM compliance** (sending to unsubscribed) | Low | Legal risk | Task 1.2a checks `unsubscribed_emails` table in pre-flight. Every email includes unsubscribe link. |
| **Hormel dual-domain confusion** (@hormel.com vs @hormelfoods.com) | Low | Duplicate sends to same person | Task 4.4 deduplicates before any Hormel sends. |
| **Rollback needed** (freightroll.com blacklisted by a domain) | Low | Permanent damage to sender reputation | If > 2 bounces from `casey@freightroll.com` on any single domain, immediately re-add domain to `SYSTEM_BLOCKED_DOMAINS` and investigate. |
