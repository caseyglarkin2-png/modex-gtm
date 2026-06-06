# Clawd contract: `/api/yardflow/draft-batch` (Hand-to-Clawd)

The modex-gtm `/discovery` worklist has a **Hand to Clawd** button. One click dispatches a
curated slice of target accounts to Clawd's control plane. Clawd sources contacts, drafts
per-persona copy, and stages each draft back into the modex-gtm Outbox. Casey reviews and sends.

This doc is the contract **the Clawd team implements** (the receiver). The modex-gtm caller is
already built and deployed (`src/lib/discovery/clawd-dispatch.ts`).

## Direction & auth

modex-gtm (caller) → Clawd control plane (receiver).

```
POST {CLAWD_CONTROL_PLANE_URL}/api/yardflow/draft-batch
Authorization: Bearer {token}
Content-Type: application/json
```

- Base URL: `CLAWD_CONTROL_PLANE_URL` (set in modex-gtm Vercel; defaults to
  `https://clawd-control-plane-production.up.railway.app`).
- Token: resolved as `MC_API_TOKEN || CLAWD_API_TOKEN || CLAWD_CONTROL_PLANE_TOKEN`. In prod
  today `CLAWD_CONTROL_PLANE_TOKEN` is set, so that is the bearer Clawd will receive. Validate
  it the same way the existing control-plane endpoints (committee/outreach) do.

## Request body

```jsonc
{
  "owner": "casey@freightroll.com",       // who the staged drafts belong to
  "requestedBy": "casey@freightroll.com", // the signed-in dispatcher
  "source": "discovery-worklist",
  "targets": [
    {
      "account": "Niagara Bottling",
      "facilityCityState": "Ontario, CA",
      "nearestLiveSite": "Ontario, CA",   // a live YardFlow (Primo Brands) site
      "distanceMi": 0.3,
      "icpTier": "A",
      "segment": "shipper",               // shipper | carrier | 3pl | parcel
      "corridor": "Ontario, CA",
      "hook": "we're live 0.3 mi away at the Primo Brands site in Ontario, CA"
    }
    // ... up to the full displayed/pinned slice
  ]
}
```

## Expected response

Respond immediately (do the work async):

```json
{ "accepted": 12, "batchId": "wf_or_run_id" }
```

The caller surfaces `accepted` in a toast ("Handed 12 to Clawd. Drafts will appear in your
Outbox."). `batchId` is optional, for your own tracing.

## What Clawd does per target (async)

1. **Source contacts** for the account (committee / decision-makers) — reuse the existing
   committee-build path. Prefer the local/regional ops owner + a corporate supply-chain owner.
2. **Draft per-persona copy** in Casey's voice. Lead with the `hook` (proximity), then the
   evergreen YardFlow spine (autonomous yard-spotter dash-cam + machine-vision gate; Primo
   rolling it out and ripping out PINC; standard-at-scale thesis; pilot ask, not a tour).
   **No em dashes** (project copy rule).
3. **Stage each draft** back into modex-gtm via the existing inbound:

   ```
   POST https://modex-gtm.vercel.app/api/cron/queue
   Authorization: Bearer {QUEUE_AGENT_SECRET}
   { "items": [ { "toEmail", "accountName", "personaName?", "subject", "body", "imageUrl?", "owner", "source": "clawd" } ] }
   ```

   Dedup (unsubscribe / already-emailed / already-queued / open Gmail thread) runs app-side on
   intake, so you can post optimistically; skips come back in the response `skipped[]`.

## Failure handling (caller side, already built)

| Clawd response | modex-gtm behavior |
|---|---|
| `200 {accepted}` | success toast |
| `404` (endpoint not built yet) | "Clawd intake is not live yet. Share the contract." |
| `401/403` | "unauthorized" |
| network error / unconfigured | graceful toast, no throw |

Until `/api/yardflow/draft-batch` exists on the control plane, the button works but every
click returns 404 → the "intake not live yet" toast. Nothing else breaks.
