# Primary Screen — Exhaustive UI Audit & Sprint Plan

**Status:** Drafted 2026-05-16 — awaiting approval
**Goal:** Turn modex-gtm from a tool Casey *visits* into the screen Casey *lives in* — the single app open all day, replacing the Gmail inbox, the spreadsheet, and the HubSpot tab.

## How this plan was built

A five-agent parallel audit read every page, component, and API route in `src/`:

1. Home cockpit, navigation, IA, app shell
2. Engagement workspace + inbox/reply/send + intent notifications
3. Accounts, Contacts/Personas, Pipeline
4. Content Studio, Campaigns, Work Queue, Capture, microsites
5. Analytics, Ops, and cross-cutting quality (perf, loading, mobile, a11y, design system)

Surface audited: 24 pages, ~70 API routes, ~10 nav modules, the public microsite system.

## The Thesis

"Primary screen" has a precise definition, taken from how Casey actually works and the stated north-star (full inbox replacement, gated on inbox parity):

1. **Casey opens it first every morning** and it tells him what changed overnight.
2. **The moment a prospect engages, he knows** — in-app, not buried in Slack.
3. **He reads, answers, and sends all prospect mail here** — Gmail stays closed.
4. **He acts on a hot signal in seconds** — alert → account → sent/logged/booked.
5. **It is fast and never breaks** — or he won't trust it enough to abandon his inbox.

## Gap Analysis — the verdict

modex-gtm today is a **production-grade outbound engine** and a **reply detector**. It is **not yet an inbox, not yet a morning cockpit, and not yet fast enough to be trusted as the only screen.**

| Pillar | State today | Verdict |
|---|---|---|
| Morning cockpit | Home shows what's *due*, never what *changed* | **Missing** |
| Intent the moment it happens | Intent fires to Slack only — never writes a Notification, invisible in-app; bell polls 60s, hidden when sidebar collapsed | **Critically weak** |
| Read prospect mail in-app | Only a 200-char Gmail snippet is stored; full reply body is fetched then discarded | **Missing** |
| Reply in-app | No reply action anywhere; no thread model; `email-thread.tsx` is dead code; `EmailLog.thread_id` is never written | **Missing** |
| Send fresh outreach in-app | Works — real Gmail send path with guards, approval gate, logging | **Solid** |
| Act fast on a signal | Alert → account → action is 5–7 clicks; lands on the Brief tab, send surface is collapsed inside a `<details>`; a slug bug 404s alerts for punctuation-named accounts | **Critically weak** |
| Speed / trust | 20 of 24 pages are `force-dynamic` (nothing cached); ~17 routes have no loading/error boundary (white-screen on every nav, crash nukes the app) | **Critically weak** |
| Coherence | Content Studio is ~20 nested destinations; `/replies` duplicates the Engagement inbox; three "send" doors; dead code in several places | **Sprawling** |

### What is genuinely strong (keep, do not touch)

- The outbound send path: rate limiting, recipient-eligibility guard, unsubscribe suppression, one-account invariant, source-approval gate, `EmailLog` + Activity logging, Gmail-Sent mirror.
- Inbound *detection*: 5-min Gmail poll, dedup by message ID, persona matching, auto-Activity, pipeline auto-advance, failure tracking + Sentry.
- The Work Queue: action-oriented (Complete / Snooze / Retry / Approve), curated `my-work`, operator-outcome taxonomy.
- Inline editing on accounts (status, persona status, thesis fields) — no dialog round-trip.
- The Engagement Recent Activity feed (PR #177) — relative time, look-back windows.
- `MetricCard` and `DataTable` (j/k keyboard nav, a11y region) are well-built primitives.

## Sprint Plan

Nine sprints, each independently shippable with its own demo. Tasks are atomic — **one commit per task unless atomically inseparable.** Every sprint closes with a proof-ledger entry (tsc / lint / affected tests / artifact / carryover).

**Recommended order:** 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. **Hard dependencies:** Sprint 4 requires Sprint 3. Sprint 7's dead-code cleanup (7.5) requires Sprint 4. Everything else is order-independent and operator-driven — pick what matches focus.

---

### Sprint 0 — Critical Fixes & Build Risk

**Goal:** Three latent failures that silently break the north-star path or the build are gone.
**Demo:** Clicking a notification for a punctuation-named account ("J.M. Smucker", "Coca-Cola") lands on the live account page, not a 404. `next build` emits no client-bailout error for `/unsubscribe`. Newly booked meetings carry owner "Casey".

| ID | Task | Assertion | Commit |
|---|---|---|---|
| 0.1 | Fix the notification → account slug bug — use the shared `slugify` in `notification-bell.tsx:62` instead of the ad-hoc `replace(/\s+/g,'-')` | A notification for an account with punctuation routes to the live account page | one component |
| 0.2 | Wrap the `/unsubscribe` `useSearchParams` consumer in `<Suspense>` | `next build` produces no CSR-bailout warning for `/unsubscribe` | one page |
| 0.3 | Default activity/meeting owner to "Casey" everywhere; remove the "Jake" default | `book-meeting-dialog.tsx:42` + `api/meetings/route.ts:21` default to Casey; grep "Jake" in both returns nothing | 2 files |
| 0.4 | Replace the hardcoded personal Google Calendar URL in `account-row-actions.tsx:79` with the env booking link used elsewhere | Row-action "Book Meeting" uses the configured link | one component |

---

### Sprint 1 — Real-Time Intent Layer

**Goal:** The moment a real prospect engages, Casey sees it in-app — no Slack, no manual refresh. This is the highest-value feature.
**Demo:** A synthetic high-intent microsite track POST → within ~15s a toast fires, the browser tab title shows an unread badge, the notification bell shows the unread (sidebar expanded **and** collapsed), and the signal appears in the Engagement Inbox tab.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| 1.1 | `intent-notifications.ts` writes a `Notification` row (`type: 'hot_engagement'`) alongside the existing Slack post | A high-intent track POST creates a Notification row; unit test covers the decision → row mapping | intent-notifications.ts + track route + 1 test |
| 1.2 | Render `NotificationBell` in the collapsed sidebar icon rail (`CollapsedNav`) | With the sidebar collapsed, the bell and unread badge are visible | sidebar component only |
| 1.3 | Convert `NotificationBell` from hardcoded `bg-white`/`gray` colors to CSS theme tokens | The bell dropdown renders correctly in dark mode | one component |
| 1.4 | Fire a Sonner toast + set a `document.title` unread badge when polling detects a new unread `hot_engagement`/`reply` | A new hot signal triggers a toast and a `(n)` title prefix | notification-bell.tsx + 1 small hook |
| 1.5 | Reduce the notification poll interval from 60s to 15s | The bell refetches every ~15s (verify in the network panel); SSE streaming is an explicit out-of-scope follow-up | notification-bell.tsx |
| 1.6 | "Hot" badge on the accounts table + triage board for any account with an unread `hot_engagement` in the last 24h | A hot account is visible without opening the bell | accounts table + triage board components |

---

### Sprint 2 — Morning Cockpit & Recency

**Goal:** Home answers "what changed since I last looked?" — not only "what's due."
**Demo:** Open Home after engagement happened → a "Since your last visit" feed lists new replies / opens / microsite sessions newest-first; items newer than last visit are flagged "new"; the flag clears on the next visit.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| 2.1 | `lastSeen` tracking — a hook that reads/writes a `home:lastSeenAt` localStorage timestamp on Home view | The hook returns the prior visit time and updates on mount | one hook |
| 2.2 | "Since your last visit" recency feed on Home, reusing `buildEngagementItems` | Home renders a reverse-chron feed of replies, opens/clicks, microsite sessions, and bookings; items after `lastSeenAt` carry a "new" flag | home page + 1 component |
| 2.3 | Resolve the dead `buildHomeCockpitSnapshot` — adopt its richer campaign/proof health on Home, or delete it and its types | Either Home renders the snapshot, or grep for `buildHomeCockpitSnapshot` outside tests returns nothing | home-cockpit.ts + home page |
| 2.4 | Conditional Home alert tile: "N new replies / meetings this week" | When replies/meetings exist this week, a tile shows the count and links to Engagement | home page + AlertTile |
| 2.5 | Replace the injected `<main>` `<style>` tag in `main-content.tsx` with a CSS variable / data-attribute | Sidebar collapse animates via a CSS var; no layout flash before hydration | main-content + layout |

---

### Sprint 3 — Inbox Foundations (capture & model)

**Goal:** Every inbound reply is fully captured and threaded — the data layer that makes inbox replacement possible.
**Demo:** A real reply arrives → the DB holds the full body (HTML + text, quoted history stripped), linked to a thread, linked back to the original send via the Gmail `threadId`.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| 3.1 | `InboundMessage` + `EmailThread` Prisma models keyed on Gmail `threadId` / `messageId` | `prisma db push` applies cleanly; models indexed on the Gmail IDs | migration + schema |
| 3.2 | `check-inbox` fetches Gmail messages with `format=full`, parses the MIME body (HTML + text), strips quoted history | A captured reply persists the full body; unit test covers the quote-stripper | gmail-inbox.ts + check-inbox route + 1 test |
| 3.3 | Persist captured replies as `InboundMessage` rows linked to an `EmailThread` | Each polled reply writes one `InboundMessage`, deduped by Gmail `messageId` | check-inbox route |
| 3.4 | Stamp the Gmail `threadId` onto `EmailLog` on every send path | `send`, `send-bulk`, `send-bulk-async` all write `thread_id`; the existing unused index is now populated | 3 send routes + sender lib |
| 3.5 | Backfill thread linkage for existing `EmailLog` + `Notification` rows | A one-shot script links historical sends/replies to threads where the Gmail `threadId` resolves; before/after counts in the proof ledger | script only |

---

### Sprint 4 — Inbox Workspace (read + reply in-app)

**Goal:** Casey reads a full conversation and replies without opening Gmail. *(Requires Sprint 3.)*
**Demo:** Click a reply in Engagement → a threaded view shows the full conversation with sanitized HTML → type a reply → it sends, threads correctly in the prospect's client, and appears in the thread.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| 4.1 | `/engagement/thread/[id]` route rendering an email thread (sent + received, full bodies, sanitized HTML) — rebuilds the dead `email-thread.tsx` against the Sprint 3 model | Opening a thread shows messages chronologically with rendered bodies | route + rebuilt thread component |
| 4.2 | Reply composer inside the thread view — prefilled To / "Re:" subject, posts through the guarded `/api/email/send` | Replying from a thread sends through the existing guarded path | composer + thread route |
| 4.3 | Threading headers — `gmail-sender` sets `In-Reply-To` / `References` from the thread's last `messageId` | A test reply lands in the same Gmail thread for the recipient | gmail-sender call site |
| 4.4 | Per-message read/unread state; mark inbound messages read on thread open | Opening a thread clears its unread count | thread route + model field |
| 4.5 | Make the Engagement "Inbox" tab a true thread list — rows with snippet, unread dot, open-thread action | The Inbox tab lists threads, each opening the 4.1 view | engagement page Inbox tab |
| 4.6 | Retire `/replies` — fold its HubSpot reply table into the Engagement Inbox; delete the orphan route | `/replies` is removed; its data appears in Engagement; nav unaffected | delete page + engagement augmentation |

---

### Sprint 5 — Act-Fast Action Surfaces

**Goal:** From any hot signal, Casey logs / sends / books in ≤3 clicks.
**Demo:** Click a hot-engagement alert → land on the account's action surface → send a follow-up in two more clicks. Log Call and Book Meeting are one click from the account hero.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| 5.1 | Persistent action bar on the account hero — Log Call, Book Meeting, Send Next Touch always visible | The three actions render outside the `<details>` and outside the History tab | account detail page |
| 5.2 | Un-collapse the Outbound Command Center / Suggested Recipients from the hero `<details>` | The recipients + send surface are visible without expanding a disclosure | account detail page |
| 5.3 | Route `hot_engagement` alert clicks to `/accounts/[slug]?tab=outreach` (the action surface), not the Brief tab | Clicking a hot alert lands on Outreach | notification-bell + account page param |
| 5.4 | Recipient search in the global compose FAB — search any persona/account from a cold start | Opening compose with no account context lets Casey search and pick a recipient; context auto-fills | composer + global-compose-button |
| 5.5 | Engagement/intent column + sort on the Contacts table — last open / click / microsite signal per contact | Contacts can be scanned and sorted by "who is hot" | contacts table |
| 5.6 | Route `StudioClient`'s outreach-sequence send through the guarded `AssetSendDialog` instead of raw `/api/email/send` | The QA-checklist and risk gating apply to every send path | studio-client send path |

---

### Sprint 6 — Performance & Trust

**Goal:** The app feels instant and never white-screens.
**Demo:** Route changes show skeletons, not blank screens; a thrown error shows a scoped boundary, not a dead app; analytics and ops self-refresh; the heaviest pages render measurably faster.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| 6.1 | Add `loading.tsx` + `error.tsx` to engagement, analytics, ops, pipeline, contacts, campaigns, studio | Each route shows a skeleton during fetch and a scoped error boundary on throw | loading/error files only — one commit per route segment |
| 6.2 | Replace blanket `force-dynamic` with `revalidate` / Cache Components on the analytics & ops aggregate queries | Both pages cache aggregates (≈60s revalidate); data stays fresh enough for operator use | 2 pages |
| 6.3 | Audit the remaining `force-dynamic` pages; keep the directive only where per-request data truly requires it | A documented list in the proof ledger; non-essential pages moved to `revalidate` | per-page, one commit each |
| 6.4 | Mount the existing `AutoRefresh` component on analytics & ops | Both pages refresh on an interval; "last run" timestamps stay live | 2 pages |
| 6.5 | Replace `window.location.reload()` with `router.refresh()` in the generated-content workspace + queue actions | Publish / retry / approve preserve scroll and filter state | affected components |
| 6.6 | Client-side tab switching + `role="tablist"`/`role="tab"`/`aria-selected` semantics on the analytics & ops tab bars | Tabs switch without a full page reload; screen readers get tab semantics | 2 pages |

---

### Sprint 7 — Coherence, Dedup & Cleanup

**Goal:** One canonical surface per job; duplicated and dead code gone. *(7.5 requires Sprint 4.)*
**Demo:** Content Studio is a flat, coherent set of destinations; there is one send door and one brief surface; grep finds no dead components.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| 7.1 | Flatten Content Studio — promote the 8 nested `generate` sub-tabs into a real layout; delete the filler tabs (`library`, `queue`, `send-readiness`) | No Studio tab exists whose only content is links to other tabs; top-level destination count drops | studio page + content-studio.ts |
| 7.2 | URL-sync `StudioClient`'s inner sub-tab state | Inner generate tabs are deep-linkable and survive a reload | studio-client |
| 7.3 | Designate one canonical review-and-send surface; remove the redundant doors into `GeneratedContentWorkspace` | Exactly one route opens the workspace | content-studio.ts + studio page |
| 7.4 | Unify briefs — fold `/briefs/[account]` into the account Outreach tab; remove the "Open legacy brief" link | Brief content lives in one place; the "legacy" link is gone | account page + briefs route |
| 7.5 | Delete dead code: `sprint-board.tsx`, the dormant `webhooks/email` route, and `buildHomeCockpitSnapshot` if not adopted in 2.3 | Grep confirms each is unreferenced before removal | deletions only |
| 7.6 | Make `/campaigns/[slug]` executable — add "generate for all targets" and "send wave" actions on the content/phases tabs | A campaign runs end-to-end from its detail page without bouncing to `/generated-content` | campaign detail + actions |
| 7.7 | Design-system unification — convert hardcoded `bg-emerald/amber/red` badges to the `success`/`warning` variants; replace the 4+ duplicate mini-metric components with `MetricCard variant="plain"`; replace inline "No X yet" strings with `EmptyState` | Grep finds no hardcoded status-color badges; one mini-metric component; `EmptyState` used app-wide | per-area, one commit each |

---

### Sprint 8 — Microsite Operations In-App

**Goal:** Casey runs the microsite lifecycle — generate, distribute, watch engagement — without a terminal.
**Demo:** From `/studio?tab=microsites`, Casey sees per-account engagement, manages batch distribution status, and triggers audio/video regeneration.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| 8.1 | Microsite engagement panel in `/studio?tab=microsites` — per-account views, CTAs tripped, high-intent sessions | The tab shows live engagement, not just a static gallery | microsites-tab |
| 8.2 | Wire microsite high-intent sessions into Work Queue follow-ups | A high-intent microsite session raises a Work Queue item | queue lib + intent path |
| 8.3 | Batch-distribution status surface — a per-account readiness matrix (sent, audio ready, video ready) | The tab reads the batch manifest and shows per-account readiness | microsites-tab + manifest read |
| 8.4 | "Regenerate audio/video" trigger from the UI — enqueues a job the audio pipeline consumes | A button enqueues a generation job; status reflects back into the UI | API route + tab + job model |

---

## Do-Not-Build Boundaries

- Do not start a sprint without filling in the acceptance card (assertion + commit scope) for every task in it.
- Do not let a sprint cross-pollinate (e.g. no design-system cleanup inside an inbox PR).
- Do not skip the proof-ledger closeout — each sprint ends with tsc / lint / affected tests / artifact / carryover.
- **Mobile/PWA polish is explicitly out of scope.** The "primary screen" is a desktop screen; the `manifest.json` + apple-mobile meta tags can stay, but no mobile-density work until the desktop loop is complete.
- Do not build SSE/websocket streaming for notifications in Sprint 1 — 15s polling is sufficient; streaming is a separate later decision.
- Do not extend the inbox beyond Gmail (no multi-provider) — Casey sends and receives from one mailbox.
- Do not add attachment support, draft management, or mail search until Sprints 3–4 land — read + reply parity first, power features second.

## Approval Gate

Plan drafted 2026-05-16. Sprint 0 is a pure-fix prerequisite; Sprints 1–2 deliver the intent + cockpit wins fastest; Sprints 3–4 are the inbox-replacement core and the largest build. Approve the sprint set (or re-cut priorities) before Sprint 0 begins.
