# Clawd ↔ Draft Queue integration (cron contract)

How the Clawd Gmail agent drives the modex-gtm Draft Queue. Clawd is the **scheduler heartbeat**; the app is the **sender** (every send goes out `casey@freightroll.com` via the app's Gmail path → Sent folder, HubSpot-logged, EmailLog).

## Auth

All three endpoints live under `/api/cron/queue/*` (the only NextAuth-middleware-exempt prefix) and authenticate with a **dedicated** secret — `QUEUE_AGENT_SECRET` — **not** the shared `CRON_SECRET`. Bearer header only; the `?secret=` query form is rejected.

```
Authorization: Bearer ${QUEUE_AGENT_SECRET}
```

Set `QUEUE_AGENT_SECRET` in Vercel (Production) and give the same value to Clawd. Rotating it instantly revokes Clawd's access without touching any other cron.

Base URL: `https://modex-gtm.vercel.app`

## 1. Add drafts — `POST /api/cron/queue`

Clawd stages drafts after it researches contacts + writes copy.

```
POST /api/cron/queue
Authorization: Bearer ${QUEUE_AGENT_SECRET}
Content-Type: application/json

{ "items": [
  {
    "toEmail": "gm@acme.com",
    "accountName": "Acme Foods",
    "personaName": "Pat Lee",
    "subject": "A live YardFlow site 2 mi from your DC",
    "body": "Hi Pat,\n\n...",          // plain text; the app wraps + signs it
    "imageUrl": "https://modex-gtm.vercel.app/artifacts/allentown-yard-proof.jpg",
    "source": "clawd",
    "owner": "casey@freightroll.com"     // optional; defaults to casey@freightroll.com
  }
] }
```

Response: `{ "added": 1, "skipped": [ { "toEmail": "...", "reason": "already_emailed" } ] }`

**Dedup is automatic and authoritative** — the app blocks `unsubscribed`, `already_emailed` (EmailLog **or** an existing Gmail thread — catches manual sends), and `already_queued` (atomic). Clawd should still apply its own prior-campaign exclusions, but it cannot create a double-send even if it retries. Max 200 items/request. Subject may not contain newlines.

Items land as `status: "draft"`. Casey reviews/approves them in the in-app Outbox; Clawd does **not** auto-approve.

## 2. Poll for due sends — `GET /api/cron/queue/due`

Clawd's Railway cron polls this every ~2–3 minutes.

```
GET /api/cron/queue/due
Authorization: Bearer ${QUEUE_AGENT_SECRET}
```

Response: `{ "items": [ { "id": 42, "to_email": "gm@acme.com", "scheduled_for": "2026-06-09T13:00:00.000Z" } ] }`

Returns only items Casey has **approved** with a `scheduled_for` in the past (max 25, oldest first). Empty `items` → nothing to do.

## 3. Fire one send — `POST /api/cron/queue/:id/send`

For each id from `/due`, Clawd triggers the actual send:

```
POST /api/cron/queue/42/send
Authorization: Bearer ${QUEUE_AGENT_SECRET}
```

Response is the send outcome:
- `{ "status": "sent", "providerMessageId": "...", "threadId": "...", "emailLogId": 99 }`
- `{ "status": "skipped", "skippedReason": "rate_limited" }` — a Gmail 429; the app already rescheduled it ~15 min out. It will reappear in `/due` later. Do nothing.
- `{ "status": "skipped", "skippedReason": "unsubscribed" | "in_thread" | "already_claimed" }` — deliberately not sent. Do nothing.
- `{ "status": "failed", "errorMessage": "...", "alreadySent": false }` — a real send failure; retryable.
- `{ "status": "failed", "alreadySent": true }` — the email DID go out but post-processing failed. **Do NOT retry** — Casey reconciles it in the Outbox "needs review" view.

## Safety guarantees (so Clawd's at-least-once cron is safe)

- **No double-send:** the send claims the row (`approved → sending`) atomically; a duplicate `POST /:id/send` for the same item returns `{ status: "skipped", skippedReason: "already_claimed" }`.
- **No re-send on partial failure:** provider message IDs are persisted the instant Gmail returns, before any DB side-effects.
- So Clawd can safely retry a network error on `/:id/send` — the app dedupes.

## Loop

```
every 2–3 min:
  due = GET /api/cron/queue/due
  for item in due.items:
    POST /api/cron/queue/{item.id}/send   # ignore skipped/rate_limited; they self-heal
```

## Casey's side (no Clawd involvement)

- **Send now** and **Approve & schedule** are in the in-app Outbox (`/discovery` → Outbox tab) — session-authed, they do not use `QUEUE_AGENT_SECRET`.
- An admin **Run due now** button fires the same `due → send` loop manually for verification/backup, so scheduled send is testable without waiting on Clawd's cron.
