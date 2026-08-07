# Track A — Editable staged path + real preview (#6, #7, #5-signature)

> **STATUS: HISTORICAL.** A dated plan/spec record, retained for context and rationale. It describes intent at the time of writing; the code has moved since, so it is NOT current guidance. For present state read `git log --since=7d`, the live system, and `plans/README.md`. Last verified 2026-08-06.


**Goal:** The Outbox shows each draft exactly as the recipient will receive it (real `wrapHtml` output, owner-correct signature, inline image in place); the rich composer can save a draft to the queue instead of only sending live.

**Approach:** Parametrize the one source of truth (`wrapHtml`) by sender identity (Casey default = byte-identical), thread it through the send path, render it (server-side, since the unsubscribe token needs crypto) into the row as a sandboxed preview, and add a "Queue draft" button to the composer. No send guards.

---

## Task A1: Sender identity in templates.ts (send-path foundation)
**Files:** Modify `src/lib/email/templates.ts`; Create `src/lib/email/sender-identity.ts`; Test `tests/unit/sender-identity.test.ts`.
- `SenderIdentity { name: string; role: string; bookingLink?: string }`.
- `resolveSenderIdentity(email?: string | null): SenderIdentity` — `casey@freightroll.com` / `caseyglarkin2@gmail.com` → `{ name:'Casey Larkin', role:'GTM Lead', bookingLink: <current BOOKING_LINK> }`; `jake@freightroll.com` → `{ name:'Jake', role:'FreightRoll' }` (placeholder, no bookingLink — flagged for Casey to supply exact name/title/link); unknown/undefined → the Casey identity (preserves current behavior).
- `wrapHtml(...)` gains a 7th optional positional param `identity: SenderIdentity = resolveSenderIdentity()`; render `${identity.name}`, `${identity.role} · YardFlow by FreightRoll`, and `identity.bookingLink ?? BOOKING_LINK`.
- TDD: no-identity output still contains `Casey Larkin` + `GTM Lead` (byte-identical default); jake identity → contains `Jake`, NOT `Casey Larkin`; resolver maps the three cases.

## Task A2: Thread identity through the send path
**Files:** Modify `src/lib/email/perform-send.ts` (`wrapAndSend`); Test extend.
- In `wrapAndSend`, resolve `const identity = resolveSenderIdentity(input.sender?.userEmail ?? null)` and pass it as the new `wrapHtml(...)` arg. No `sender` → Casey identity (unchanged). This makes Jake's *actually sent* email carry his signature.
- TDD: a `PerformSendInput` with `sender.userEmail='jake@freightroll.com'` produces html containing Jake; without sender, contains Casey (assert on the returned `html`, injecting a fake `sendEmail` is unnecessary — `wrapAndSend` returns `html`).

## Task A3: Real preview in the Outbox row
**Files:** Add server action `renderDraftPreview(id)` to `src/app/discovery/queue-actions.ts` (owner-scoped; returns `wrapHtml(body, account_name, to_email, undefined, image_url, undefined, resolveSenderIdentity(owner))`); Modify `src/app/discovery/outbox-tab.tsx`.
- Row gets an "Edit | Preview" toggle. Preview renders the returned HTML in a sandboxed `<iframe srcDoc={html} sandbox="">` (no scripts) so it looks exactly like the sent email, signature + inline image included. Edit keeps the existing textarea. Lazy-load the preview on first toggle.
- No new unit test required (thin wiring); keep tsc+lint clean.

## Task A4: Composer "Queue draft"
**Files:** Modify `src/components/email/composer.tsx`.
- Add a "Queue draft" button beside Send. It calls `addToQueue({ toEmail, accountName, personaName?, subject, body, imageUrl? })` with the composer's current state, toasts the result (`Queued for review` / dedup reason), and does NOT send. Lets AI-refined composer copy be staged.
- Keep tsc+lint clean.

## Ship
One PR for Track A → merge → deploy → verify READY.
