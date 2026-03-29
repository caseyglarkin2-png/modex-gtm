# Modex GTM - Implementation Plan
## Make It More Powerful, Less Clicky, More Actionable

**Date:** 2026-03-29
**Goal:** Transform from content generator → full GTM operating system with closed-loop workflows

---

## Executive Summary

**Current State:**
- ✅ AI generates great content (sequences, one-pagers)
- ✅ Analytics show metrics
- ✅ All CRUD operations functional
- ❌ Email workflow disconnected (generate → copy/paste → manual send)
- ❌ Queue is static, not intelligent
- ❌ Too many clicks for common actions
- ❌ No feedback loop (bounces, replies, opens)

**Target State:**
- ✅ One-click "Generate & Send" from Studio
- ✅ AI-powered "Next Best Action" queue
- ✅ Quick actions from tables (3 clicks vs 8)
- ✅ Real-time reply detection & bounce handling
- ✅ Notification center for account movement
- ✅ Polished, branded UI

**Timeline:** 6 phases, ~35 days total (7 weeks with buffer)

---

## Phase 1: Close the Email Loop ⚡ CRITICAL
**Duration:** 4 days
**Impact:** Transforms AI content into actual outreach

### Problem
AI generates content → user copies → pastes into Gmail → manual send = broken workflow

### Solution Architecture

#### Day 1: Generate & Send Flow
**Goal:** One-click email sending from Studio

**Backend Changes:**
- [x] Email send API exists: `/api/email/send`
- [x] GeneratedContent table exists
- [x] EmailLog table has `generated_content_id`
- [ ] Add email preview component with send button
- [ ] Wire Studio sequence panel → email composer
- [ ] Wire Studio one-pager panel → email composer

**Frontend Changes:**
- [ ] Update `OutreachSequenceDialog` component
  - Add "Send Email" button for each step
  - Show email preview modal
  - Pre-fill: to (persona email), subject, body
  - Validate: persona has email, not bounced
  - On send: call `/api/email/send`, track GeneratedContent ID
- [ ] Update `OnePagerDialog` component
  - Add "Email This One-Pager" button
  - Same flow as sequence
- [ ] Create `EmailPreviewModal` component
  - Shows: to, subject, body
  - Editable before send
  - "Send" button → posts to API
  - Success: "✅ Sent! Track in Analytics"

**Database:**
- No changes needed (schema already supports this)

**Testing:**
- [ ] Generate sequence → click "Send Email" on step 1
- [ ] Verify email sent via Resend
- [ ] Check EmailLog has `generated_content_id`
- [ ] Generate one-pager → click "Email This"
- [ ] Verify sent

**Success Metrics:**
- User can send AI-generated email in 3 clicks (generate → preview → send)
- EmailLog properly linked to GeneratedContent

---

#### Day 2: Sent Emails Dashboard
**Goal:** Track all sent emails in one place

**Backend:**
- [ ] New API: `/api/analytics/emails`
  - Query: EmailLog JOIN GeneratedContent
  - Filters: account, persona, date range, status
  - Return: sent count, open rate, bounce count, reply count

**Frontend:**
- [ ] New page: `/analytics/emails`
- [ ] Sections:
  1. **KPI Cards**: Total Sent, Delivered, Bounced, Opened, Replied
  2. **Recent Emails Table**: Date, To, Account, Subject, Status, Opens, Clicks
  3. **Filters**: Date range, Account, Status
- [ ] Email row click → drill-down modal:
  - Full email body (HTML preview)
  - Send time, recipient, status
  - Events: sent, delivered, opened (timestamps)
  - Link to GeneratedContent (show prompt used)
  - Link to Account page
- [ ] Link from Studio "History" tab to this page

**Database:**
- No changes (already have EmailLog data)

**Testing:**
- [ ] Send 3 test emails
- [ ] Navigate to `/analytics/emails`
- [ ] Verify all emails appear
- [ ] Click email row → see drill-down
- [ ] Filter by account → verify filtered results

**Success Metrics:**
- All sent emails visible in dashboard
- Can drill down to see full context
- Link between AI generation and email send is clear

---

#### Day 3: Resend Webhook for Events
**Goal:** Real-time event tracking (bounce, open, reply)

**Backend:**
- [ ] New API: `/api/webhooks/resend` (POST)
  - Verifies Resend signature
  - Handles events:
    - `email.bounced` → update EmailLog status to 'bounced'
    - `email.opened` → update EmailLog `opened_at`, increment `open_count`
    - `email.clicked` → update EmailLog `clicked_at`
    - `email.delivered` → update EmailLog status to 'delivered'
    - `email.sent` → update EmailLog status to 'sent'
  - For bounces: also update Persona email validation status
- [ ] Add fields to EmailLog schema:
  - `open_count` (Int, default 0)
  - `clicked_at` (DateTime, nullable)
  - `last_opened_at` (DateTime, nullable)
  - `bounce_type` (String, nullable: 'hard', 'soft')

**Database Migration:**
```prisma
model EmailLog {
  // ... existing fields
  open_count       Int       @default(0)
  clicked_at       DateTime?
  last_opened_at   DateTime?
  bounce_type      String?
}
```

**Resend Setup:**
- [ ] Configure webhook endpoint in Resend dashboard
- [ ] Set webhook URL: `https://modex-gtm.vercel.app/api/webhooks/resend`
- [ ] Enable events: bounce, open, click, delivered

**Testing:**
- [ ] Send test email to valid address
- [ ] Open email → verify webhook fires
- [ ] Check EmailLog updated with `opened_at`
- [ ] Send to invalid address → verify bounce webhook
- [ ] Check EmailLog status = 'bounced'

**Success Metrics:**
- Real-time event tracking working
- Bounce detection prevents future sends to bad emails
- Open tracking visible in analytics

---

#### Day 4: Reply Detection & Inbox
**Goal:** Surface replies so they don't get lost

**Backend:**
- [ ] Add `reply_received` field to EmailLog (Boolean, default false)
- [ ] Add `reply_body` field to EmailLog (Text, nullable)
- [ ] Add `reply_received_at` field to EmailLog (DateTime, nullable)
- [ ] Resend webhook handler: detect `email.replied` event
  - Update EmailLog with reply data
  - Create Activity record: type='Reply Received'
  - Update account `outreach_status` to 'Replied'

**Frontend:**
- [ ] New page: `/inbox/replies`
- [ ] Show all emails where `reply_received = true`
- [ ] Sections:
  1. **Unread Replies** (new replies not triaged)
  2. **All Replies** (history)
- [ ] Reply card shows:
  - Account name
  - Persona name
  - Original email subject
  - Reply body (preview)
  - Time received
  - Actions: "View Account", "Mark as Triaged", "Generate Follow-Up"
- [ ] Add notification badge to nav: "Inbox (3)"
- [ ] Clicking notification → goes to `/inbox/replies`

**Database Migration:**
```prisma
model EmailLog {
  // ... existing fields
  reply_received    Boolean   @default(false)
  reply_body        String?   @db.Text
  reply_received_at DateTime?
  triaged           Boolean   @default(false)
}
```

**Testing:**
- [ ] Simulate reply webhook payload
- [ ] Verify EmailLog updated
- [ ] Navigate to `/inbox/replies`
- [ ] See reply in inbox
- [ ] Click "Mark as Triaged" → reply moves to history
- [ ] Click "View Account" → goes to account page

**Success Metrics:**
- Replies don't get lost
- User sees notification badge
- Can triage replies from inbox

---

### Phase 1 Success Criteria
- ✅ Email send button in Studio works
- ✅ Sent emails visible in analytics dashboard
- ✅ Webhook tracks opens, bounces, clicks
- ✅ Replies surface in inbox with notification
- ✅ Full loop: generate → send → track → reply → action

**Test Coverage:**
- [ ] E2E test: Generate sequence → send → verify in dashboard
- [ ] E2E test: Simulate webhook events → verify UI updates
- [ ] E2E test: Reply webhook → see in inbox

---

## Phase 2: Smart Queue 🧠 HIGH IMPACT
**Duration:** 3 days
**Impact:** Tells users what to do next

### Problem
Queue shows manual captures but no intelligence. User asks: "What should I work on now?"

### Solution Architecture

#### Day 1: Queue Priority Scoring
**Goal:** AI-scored queue with "Next Best Action"

**Backend:**
- [ ] New function: `calculateQueueScore(capture)`
  - Inputs: heat_score, priority_band, last_touch_days, reply_received, meeting_status
  - Formula:
    ```
    score =
      (heat_score * 2) +              // 0-40 points
      (band_points * 3) +              // P1=30, P2=20, P3=10, P4=0
      (recency_penalty) +              // -5 per week since last touch
      (reply_boost) +                  // +50 if reply_received
      (overdue_boost)                  // +30 if follow-up overdue
    ```
  - Returns: score (0-150)

- [ ] Update `/api/queue` endpoint:
  - Calculate score for each item
  - Add sections:
    1. **Action Required** (score >= 100): Replies, Overdue Follow-Ups
    2. **High Priority** (score 60-99): High-heat P1/P2 accounts
    3. **Standard** (score < 60): Rest of queue
  - Auto-hide if: email sent < 2 days ago (auto-snooze)
  - Auto-hide if: meeting_status = 'Meeting Booked' or 'Meeting Held'

**Database:**
- No schema changes (calculate score on-the-fly)

**Frontend:**
- [ ] Update `/queue` page layout:
  - Section 1: **🔥 Action Required** (red badge)
    - Show: replies, overdue follow-ups
    - Sort: most urgent first
  - Section 2: **⭐ High Priority** (amber badge)
    - Show: high-heat P1/P2 accounts
    - Sort: by score DESC
  - Section 3: **📋 Standard Queue** (collapsed by default)
    - Show: everything else
    - Sort: by due date
- [ ] Visual indicators:
  - Red dot: reply received
  - Orange dot: overdue (> 7 days)
  - Fire emoji: heat_score >= 16
- [ ] Add "Why is this here?" tooltip showing score breakdown

**Testing:**
- [ ] Create capture with reply_received=true → verify in Action Required
- [ ] Create capture with last_touch = 10 days ago → verify in Action Required
- [ ] Create capture with heat_score=18 → verify in High Priority
- [ ] Create capture, send email today → verify hidden (auto-snoozed)

**Success Metrics:**
- Queue clearly shows what to work on first
- User doesn't need to think about prioritization

---

#### Day 2: Auto-Snooze & Smart Filters
**Goal:** Queue adapts based on recent actions

**Backend:**
- [ ] Update queue API logic:
  - If EmailLog exists for account/persona in last 2 days → auto-snooze
  - If meeting booked → hide from queue
  - If account status = 'Not Interested' → hide from queue
- [ ] Add query params: `?filter=all|active|snoozed`

**Frontend:**
- [ ] Add filter chips above queue:
  - "Active" (default) - shows non-snoozed
  - "Snoozed" - shows auto-snoozed items
  - "All" - shows everything
- [ ] Snoozed items show:
  - Gray background
  - Label: "Auto-snoozed - follow-up in 2 days"
  - Un-snooze button (moves to active)
- [ ] Manual snooze button:
  - Click → snooze for 3 days
  - Shows countdown: "Reappears in 3 days"

**Testing:**
- [ ] Send email to account → verify auto-snoozed
- [ ] Click "Snoozed" filter → see item
- [ ] Book meeting → verify item hidden
- [ ] Click manual snooze → verify 3-day countdown shown

**Success Metrics:**
- Queue stays clean
- No duplicate work (don't email someone twice in 2 days)
- User can still see snoozed items if needed

---

#### Day 3: Queue Intelligence Panel
**Goal:** Show AI suggestions for each queue item

**Backend:**
- [ ] New API: `/api/queue/suggestions/:id`
  - Analyzes: latest intel, recent activities, persona engagement
  - Returns: suggested_action, talking_points[], why_now

**Frontend:**
- [ ] Add "Show Suggestion" button on queue item
- [ ] Expands to show:
  - **Suggested Action:** "Send follow-up email mentioning their Q2 expansion"
  - **Why Now:** "Last contact was 8 days ago, they opened previous email"
  - **Talking Points:**
    - Recent intel about their Q2 expansion
    - Mention YardFlow demo from previous email
    - Offer specific time slots for meeting
  - **Quick Actions:**
    - "Generate Email with These Points"
    - "Book Meeting"
    - "Mark as Done"

**Testing:**
- [ ] Click "Show Suggestion" on queue item
- [ ] Verify talking points are relevant
- [ ] Click "Generate Email" → verify prompt includes suggestions
- [ ] Verify action buttons work

**Success Metrics:**
- User knows exactly what to say
- AI suggestions reduce "blank page" problem
- Queue becomes action-oriented, not just a list

---

### Phase 2 Success Criteria
- ✅ Queue sections: Action Required, High Priority, Standard
- ✅ Auto-snooze prevents duplicate work
- ✅ Priority scoring surfaces urgent items
- ✅ AI suggestions tell user what to do
- ✅ Queue is actionable, not administrative

**Test Coverage:**
- [ ] E2E test: Create high-priority item → verify in correct section
- [ ] E2E test: Send email → verify auto-snoozed
- [ ] E2E test: Get reply → verify moves to Action Required

---

## Phase 3: Reduce Clicks ⚡ UX IMPROVEMENT
**Duration:** 3 days
**Impact:** Power users fly through workflows

### Problem
Common actions require too many clicks: Account detail page → button → modal → form → generate = 5+ steps

### Solution Architecture

#### Day 1: Quick Actions Dropdown
**Goal:** Context menu on every account row

**Frontend:**
- [ ] Add `RowActionsMenu` component:
  - Trigger: ⋮ icon (shows on hover)
  - Menu items:
    1. "Generate One-Pager" → opens modal inline
    2. "Generate Sequence" → opens modal inline
    3. "Book Meeting" → opens Calendly modal
    4. "Log Activity" → opens activity form
    5. "Send Email" → opens composer
    6. Separator
    7. "View Details" → navigates to account page
    8. "Copy Account Link" → copies URL to clipboard

- [ ] Wire up to accounts table:
  - Each row gets ⋮ icon in new column
  - Click → dropdown expands
  - All actions pre-filled with account context

**Testing:**
- [ ] Hover over account row → see ⋮ icon
- [ ] Click ⋮ → see menu
- [ ] Click "Generate One-Pager" → modal opens with account pre-selected
- [ ] Click "View Details" → navigates to page
- [ ] Click "Copy Link" → verify clipboard

**Success Metrics:**
- Generate one-pager: 8 clicks → 2 clicks
- Generate sequence: 8 clicks → 2 clicks
- Time to action: 15 seconds → 3 seconds

---

#### Day 2: Bulk Actions
**Goal:** Select multiple accounts, act on all at once

**Frontend:**
- [ ] Add checkbox column to accounts table (leftmost)
- [ ] Add "Select All" checkbox in header
- [ ] When ≥1 row selected → show floating action bar:
  - Position: bottom of screen, sticky
  - Shows: "3 accounts selected"
  - Actions:
    1. "Generate Sequences for All" → batch API call
    2. "Add to Wave" → select wave number
    3. "Export to CSV" → download
    4. "Change Owner" → select owner
    5. "Clear Selection"

- [ ] Batch generation modal:
  - Shows: list of selected accounts
  - Option: "Generate for all P1 personas" checkbox
  - Progress indicator: "Generating 3/5..."
  - Results: success count, failures (if any)

**Backend:**
- [ ] New API: `/api/ai/sequence/batch` (POST)
  - Body: `{ account_ids: string[], persona_priority?: string }`
  - Generates sequence for each account
  - Returns: `{ results: { account_id, success, content_id?, error? }[] }`

**Testing:**
- [ ] Select 3 accounts via checkboxes
- [ ] Verify floating bar appears
- [ ] Click "Generate Sequences for All"
- [ ] Wait for batch completion
- [ ] Verify all 3 sequences in Studio history

**Success Metrics:**
- Can generate content for 5 accounts in one action
- Bulk operations save 5x time vs individual clicks

---

#### Day 3: Keyboard Shortcuts
**Goal:** Power users never touch mouse

**Frontend:**
- [ ] Implement keyboard shortcut handler:
  - `J` / `K` - Navigate rows (Gmail-style)
  - `X` - Select/deselect current row
  - `G` - Open "Generate Sequence" for selected
  - `O` - Open account detail for selected
  - `E` - Open email composer for selected
  - `/` - Focus search bar
  - `Esc` - Clear selection / close modal
  - `?` - Show keyboard shortcuts cheat sheet

- [ ] Add shortcuts modal (`?` key):
  - Lists all shortcuts with descriptions
  - Grouped by context: Navigation, Actions, Modals
  - Design: dark overlay, centered card

- [ ] Visual feedback:
  - Selected row: blue highlight
  - Keyboard focus indicator: border glow
  - Shortcut hints: subtle "(G)" labels on hover

**Testing:**
- [ ] Press `J` → verify row selection moves down
- [ ] Press `K` → verify row selection moves up
- [ ] Press `X` → verify row checked
- [ ] Press `G` → verify generate modal opens
- [ ] Press `?` → verify shortcuts modal appears

**Success Metrics:**
- Power users can navigate entire accounts table without mouse
- Shortcuts reduce time to action by 50%

---

### Phase 3 Success Criteria
- ✅ Quick actions menu on every row
- ✅ Bulk selection + batch generation
- ✅ Keyboard shortcuts for all major actions
- ✅ Time to generate sequence: 15s → 3s
- ✅ Time to send email: 20s → 5s

**Test Coverage:**
- [ ] E2E test: Click quick action menu → generate sequence
- [ ] E2E test: Select 3 accounts → bulk generate → verify results
- [ ] E2E test: Use only keyboard to navigate and generate

---

## Phase 4: Intel Action Loop 🔗 MEDIUM IMPACT
**Duration:** 2 days
**Impact:** Close research → enrichment → outreach loop

### Problem
Intel page shows research tasks but no action loop. Found intel → now what?

### Solution Architecture

#### Day 1: Intel Action Buttons
**Goal:** One-click from intel to account update or email

**Frontend:**
- [ ] Update `IntelList` component → add action column:
  1. **"Update Account"** button
     - Opens modal with account field pre-filled
     - Field determined by `field_to_update`
     - User confirms → updates account
     - Marks intel status as "Actioned"
  2. **"Use in Email"** button
     - Opens email composer
     - Pre-fills talking points with intel info
     - Auto-includes: "I saw that you [intel finding]..."

**Backend:**
- [ ] Update `/api/intel/:id/action` (POST)
  - Actions: 'update_account', 'mark_actioned'
  - Updates intel status
  - If update_account: also updates Account record

**Testing:**
- [ ] Click "Update Account" on intel item
- [ ] Verify modal pre-filled correctly
- [ ] Confirm → verify account updated
- [ ] Verify intel status = "Actioned"
- [ ] Click "Use in Email" → verify composer pre-filled

**Success Metrics:**
- Intel status updated after action
- Account data enriched from intel findings
- Zero manual copy/paste

---

#### Day 2: Intel → Prompt Injection
**Goal:** AI uses intel automatically when generating

**Backend:**
- [ ] Update AI sequence generation:
  - Query: "Get unactioned intel for this account"
  - Inject into prompt: "Recent findings: [intel items]"
  - System prompt: "Incorporate these recent findings naturally"
- [ ] Update AI one-pager generation:
  - Same intel injection logic
  - Highlight intel facts in output with 🔍 icon

**Frontend:**
- [ ] Show intel badge on sequence steps: "🔍 Uses 2 intel findings"
- [ ] Hover → tooltip shows which intel was used
- [ ] Click intel badge → links to intel page for that account

**Testing:**
- [ ] Add intel for account: "Expanding to 3 new terminals"
- [ ] Generate sequence for that account
- [ ] Verify email mentions expansion
- [ ] Verify 🔍 badge shown

**Success Metrics:**
- AI naturally incorporates latest research
- Emails feel personalized and timely
- Intel findings get used, not lost

---

### Phase 4 Success Criteria
- ✅ Intel items have clear action buttons
- ✅ Intel data flows into account records
- ✅ Intel auto-injected into AI prompts
- ✅ Full loop: research → intel → enrich → outreach

**Test Coverage:**
- [ ] E2E test: Add intel → update account → verify updated
- [ ] E2E test: Add intel → generate sequence → verify used

---

## Phase 5: Notification System 🔔 MEDIUM IMPACT
**Duration:** 2 days
**Impact:** Real-time awareness of account movement

### Problem
User doesn't know when important events happen: reply received, meeting booked, bounce detected

### Solution Architecture

#### Day 1: Notification Data Model
**Goal:** Store and retrieve notifications

**Backend:**
- [ ] New table: `Notification`
  ```prisma
  model Notification {
    id           String   @id @default(cuid())
    user_id      String?
    type         String   // 'reply', 'bounce', 'meeting_booked', 'intel_found'
    title        String
    message      String
    link         String?  // Where to go when clicked
    read         Boolean  @default(false)
    created_at   DateTime @default(now())

    // Context
    account_name String?
    persona_name String?
    email_log_id String?
  }
  ```

- [ ] New API: `/api/notifications`
  - GET → returns unread count + recent notifications
  - POST → mark as read
  - DELETE → dismiss notification

- [ ] Create notifications on:
  - Email reply received (via webhook)
  - Hard bounce detected (via webhook)
  - Meeting booked (via dialog)
  - High-priority intel found

**Testing:**
- [ ] Simulate reply webhook → verify notification created
- [ ] Query `/api/notifications` → see unread count
- [ ] Mark as read → verify count decreases

---

#### Day 2: Notification UI
**Goal:** Notification bell with dropdown

**Frontend:**
- [ ] Add `NotificationBell` component to navbar:
  - Icon: 🔔 with unread count badge
  - Click → dropdown panel
  - Sections:
    1. **Unread** (bold)
    2. **Earlier Today**
    3. **This Week**
  - Each notification card:
    - Icon (based on type)
    - Title + message
    - Time ago ("2 hours ago")
    - Click → navigate to link + mark as read
  - Footer: "Mark All as Read" | "View All"

- [ ] Notification types:
  - 📧 Reply: "Jane Doe replied to your email"
  - ⚠️ Bounce: "Email bounced for John Smith"
  - 📅 Meeting: "Meeting booked with Acme Corp"
  - 🔍 Intel: "New high-priority intel for Target Co"

- [ ] Real-time updates:
  - Poll `/api/notifications` every 30 seconds
  - Update badge count
  - Show toast for new notifications

**Testing:**
- [ ] Create test notification
- [ ] Verify bell badge shows count
- [ ] Click bell → see dropdown
- [ ] Click notification → navigate to link
- [ ] Verify marked as read

**Success Metrics:**
- User sees important events in real-time
- Zero missed replies
- Notification click-through rate > 80%

---

### Phase 5 Success Criteria
- ✅ Notification table and API working
- ✅ Bell icon with unread count in navbar
- ✅ Dropdown shows recent notifications
- ✅ Click notification → navigate + mark read
- ✅ Real-time polling (30s interval)

**Test Coverage:**
- [ ] E2E test: Trigger event → verify notification appears
- [ ] E2E test: Click notification → verify navigation + read

---

## Phase 6: UI Branding & Polish 🎨 POLISH
**Duration:** 2 days
**Impact:** Professional, cohesive brand identity

### Problem
UI is functional but generic. Needs brand differentiation and polish.

### Solution Architecture

#### Day 1: Brand Identity System
**Goal:** Define and implement brand system

**Design System:**
- [ ] Color Palette:
  - Primary: `#0066FF` (Electric Blue) - CTAs, links, brand
  - Secondary: `#FF6B00` (Vibrant Orange) - Accents, alerts, heat
  - Success: `#00CC66` (Emerald Green) - Success states, positive actions
  - Warning: `#FFB800` (Amber Gold) - Warnings, medium priority
  - Danger: `#FF3B30` (Crimson Red) - Errors, critical alerts
  - Neutral: `#1A1D29` (Gunmetal) - Dark mode base
  - Neutral Light: `#F7F9FC` (Cloud) - Light mode base

- [ ] Typography:
  - Headings: `Inter` (Bold, 700)
  - Body: `Inter` (Regular, 400)
  - Mono: `JetBrains Mono` (for code, emails)

- [ ] Component Library Updates:
  - Update `tailwind.config.ts` with brand colors
  - Create custom button variants:
    - `primary` (blue, main CTAs)
    - `secondary` (orange, AI actions)
    - `success` (green, confirmations)
    - `ghost` (transparent, secondary actions)
  - Update badge styles:
    - Priority bands: P1=red, P2=orange, P3=amber, P4=neutral
    - Status badges: custom colors per status
  - Card shadows: subtle elevation
  - Form inputs: rounded corners, blue focus rings

**Implementation:**
- [ ] Update `globals.css` with CSS variables
- [ ] Update `tailwind.config.ts` theme
- [ ] Create `brand.ts` with exported constants
- [ ] Update Button, Badge, Card components

**Testing:**
- [ ] Visual regression: screenshot all pages
- [ ] Compare before/after
- [ ] Ensure consistent spacing, colors, typography

---

#### Day 2: Brand Touchpoints
**Goal:** Apply branding to key pages and components

**Branding Updates:**
- [ ] **Logo & Header:**
  - Replace "Dashboard" text with logo
  - Design: "Modex" wordmark + "RevOps" subtitle
  - Style: Electric blue gradient
  - Add tagline: "GTM Operating System"

- [ ] **Studio Branding:**
  - Rename tabs with icons:
    - "Asset Pack" → "🎨 Asset Pack"
    - "Full Sequence" → "📧 Sequences"
    - "One-Pager" → "📄 One-Pagers"
    - "History" → "📚 History"
  - AI generation buttons:
    - Use secondary (orange) color
    - Add sparkle icon ✨
    - Animated gradient on hover

- [ ] **Analytics Dashboard:**
  - Hero cards: custom gradients per metric
  - Chart colors: match brand palette
  - Add "powered by AI" badge

- [ ] **Account Detail:**
  - Hero card: gradient background (blue to purple)
  - Status badges: custom colors
  - AI action buttons: prominent, branded

- [ ] **Queue:**
  - Section headers: colored left border
  - Priority badges: match brand colors
  - Fire emoji for high-heat items

- [ ] **Empty States:**
  - Custom illustrations (use https://undraw.co)
  - Branded CTAs
  - Friendly copy with personality

**Polish Touches:**
- [ ] Micro-interactions:
  - Button hover: subtle scale + shadow
  - Card hover: lift elevation
  - Table row hover: highlight
- [ ] Loading states:
  - Skeleton screens (not spinners)
  - Branded loader animation
- [ ] Success confirmations:
  - Toast notifications: branded colors
  - Confetti animation for big wins (meeting booked)

**Testing:**
- [ ] Review each page for brand consistency
- [ ] Check dark mode compatibility
- [ ] Test animations on slow devices

---

### Phase 6 Success Criteria
- ✅ Cohesive brand identity across all pages
- ✅ Professional, polished UI
- ✅ Brand colors, typography consistently applied
- ✅ Micro-interactions add delight
- ✅ Dark mode looks sharp

**Test Coverage:**
- [ ] Visual regression suite
- [ ] Screenshot before/after comparison
- [ ] Accessibility check (WCAG AA)

---

## Testing Strategy

### Unit Tests
- [ ] API endpoints: all return correct data shapes
- [ ] Validation: email format, required fields
- [ ] Scoring logic: queue priority formula
- [ ] Webhook signature verification

### Integration Tests
- [ ] Email send flow: Studio → API → Resend
- [ ] Webhook handling: Resend → API → DB
- [ ] Bulk generation: batch API → multiple AI calls
- [ ] Notification creation: event → DB → UI

### E2E Tests (Playwright)
- [ ] Existing tests (17) continue to pass
- [ ] New test: Generate & send email flow
- [ ] New test: Webhook simulation → UI updates
- [ ] New test: Reply inbox flow
- [ ] New test: Smart queue sections
- [ ] New test: Bulk actions
- [ ] New test: Keyboard shortcuts
- [ ] New test: Intel action buttons
- [ ] New test: Notification bell

**Target: 25+ E2E tests, 95%+ pass rate**

---

## Deployment Strategy

### Phase Rollouts
- **Phase 1:** Deploy after Day 4 → validate email loop
- **Phase 2:** Deploy after Day 3 → validate smart queue
- **Phase 3:** Deploy after Day 3 → validate UX improvements
- **Phase 4:** Deploy after Day 2 → validate intel loop
- **Phase 5:** Deploy after Day 2 → validate notifications
- **Phase 6:** Deploy after Day 2 → final polish

### Rollback Plan
- Each phase is additive (no breaking changes)
- If critical bug: revert to previous commit
- Feature flags for major features (if needed)

### Monitoring
- [ ] Sentry for error tracking
- [ ] Posthog for analytics
- [ ] Vercel logs for API performance
- [ ] Resend dashboard for email deliverability

---

## Success Metrics

### Quantitative
- **Email Send Rate:** 0 → 50+ emails/week (via Studio send button)
- **Queue Conversion:** Static list → 80%+ items actioned within 7 days
- **Click Reduction:** 8 clicks → 3 clicks (common workflows)
- **Reply Response Time:** Manual check → real-time notifications (<1 min)
- **Bounce Rate:** Untracked → <5% (via webhook + email validation)

### Qualitative
- **User Feedback:** "Finally feels like a complete system, not just tools"
- **Workflow Completion:** "I can do everything in one place now"
- **Trust:** "I trust the queue to tell me what to do next"
- **Brand Perception:** "This looks professional and polished"

---

## Risk Assessment

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Resend webhook failures | High | Low | Retry logic, fallback polling |
| Bulk generation timeouts | Medium | Medium | Queue system, batch processing |
| Database migration issues | High | Low | Test in dev, schema backups |
| Email deliverability issues | High | Low | Proper SPF/DKIM setup |

### Product Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Users ignore smart queue | Medium | Low | Education, clear value prop |
| Too many notifications | Medium | Medium | Smart defaults, user preferences |
| Brand refresh feels "off" | Low | Low | A/B test, user feedback |

### Timeline Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Phases take longer than estimated | Medium | Medium | Prioritize P1, defer nice-to-haves |
| Unexpected bugs delay deployment | High | Medium | Comprehensive testing, staged rollout |

---

## Post-Launch

### Week 1: Validation
- [ ] Monitor error rates (target: <1%)
- [ ] Track email send adoption (target: 10+ sends)
- [ ] Gather user feedback
- [ ] Fix critical bugs

### Week 2: Optimization
- [ ] A/B test notification frequency
- [ ] Tune queue scoring algorithm
- [ ] Optimize slow API endpoints
- [ ] Polish rough edges

### Week 3: Expansion
- [ ] Add requested features
- [ ] Expand keyboard shortcuts
- [ ] Improve AI prompt quality
- [ ] Documentation & training

---

## Appendix: API Endpoints

### New Endpoints
- `POST /api/email/send` - Already exists, enhanced
- `GET /api/analytics/emails` - Sent emails dashboard
- `POST /api/webhooks/resend` - Resend event handler
- `GET /api/inbox/replies` - Reply inbox
- `POST /api/queue/suggestions/:id` - AI suggestions
- `POST /api/ai/sequence/batch` - Bulk sequence generation
- `POST /api/intel/:id/action` - Intel action handler
- `GET /api/notifications` - Notification list
- `POST /api/notifications/:id/read` - Mark notification as read

### Modified Endpoints
- `GET /api/queue` - Add scoring and sections
- `POST /api/ai/sequence/route` - Add intel injection
- `POST /api/ai/one-pager/route` - Add intel injection

---

## Appendix: Database Schema Changes

### EmailLog Enhancements
```prisma
model EmailLog {
  // Existing fields...

  // Phase 1 additions
  open_count       Int       @default(0)
  clicked_at       DateTime?
  last_opened_at   DateTime?
  bounce_type      String?   // 'hard' | 'soft'
  reply_received   Boolean   @default(false)
  reply_body       String?   @db.Text
  reply_received_at DateTime?
  triaged          Boolean   @default(false)
}
```

### Notification Table (New)
```prisma
model Notification {
  id           String   @id @default(cuid())
  user_id      String?
  type         String   // 'reply' | 'bounce' | 'meeting_booked' | 'intel_found'
  title        String
  message      String
  link         String?
  read         Boolean  @default(false)
  created_at   DateTime @default(now())

  account_name String?
  persona_name String?
  email_log_id String?

  @@index([user_id, read])
  @@index([created_at])
}
```

---

## Timeline Summary

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: Email Loop | 4 days | Day 1 | Day 4 |
| Phase 2: Smart Queue | 3 days | Day 5 | Day 7 |
| Phase 3: Reduce Clicks | 3 days | Day 8 | Day 10 |
| Phase 4: Intel Loop | 2 days | Day 11 | Day 12 |
| Phase 5: Notifications | 2 days | Day 13 | Day 14 |
| Phase 6: UI Branding | 2 days | Day 15 | Day 16 |
| **Total** | **16 days** | - | - |

**Estimated completion:** 2-3 weeks (allowing for testing and fixes)

---

## Sign-Off

This plan transforms Modex GTM from a collection of tools into a true GTM operating system.

**Key Wins:**
- 🎯 One-click email sending
- 🧠 AI-powered queue
- ⚡ 60% fewer clicks
- 🔔 Real-time notifications
- 🎨 Professional branding

**Ready to build?** ✅
