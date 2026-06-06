# Hand-to-Clawd (Worklist → Clawd draft batch) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox syntax.

**Goal:** One click on the /discovery worklist hands a curated slice of target accounts to Clawd's control plane, which sources contacts, drafts copy, and stages drafts back into the Outbox (`source:'clawd'`) for Casey to review and send.

**Architecture:** App builds a target payload from the displayed/pinned `RankedRow`s and POSTs it to `{CLAWD_CONTROL_PLANE_URL || default}/api/yardflow/draft-batch` with `Authorization: Bearer {MC_API_TOKEN}` (reusing the established app→Clawd auth in `clawd-export-client.ts`). Clawd works the batch async and stages each finished draft via the existing `POST /api/cron/queue` inbound. No app-side content generation; no send guards.

**Tech Stack:** Next.js server action, TypeScript, vitest. DI `fetchImpl` for testable network code.

---

## Clawd-side contract (hand to the Clawd team — they build the receiver)

`POST /api/yardflow/draft-batch`  ·  `Authorization: Bearer {MC_API_TOKEN}`

Request body:
```json
{
  "owner": "casey@freightroll.com",
  "requestedBy": "casey@freightroll.com",
  "source": "discovery-worklist",
  "targets": [
    {
      "account": "Niagara Bottling",
      "facilityCityState": "Ontario, CA",
      "nearestLiveSite": "Ontario, CA",
      "distanceMi": 0.3,
      "icpTier": "A",
      "segment": "shipper",
      "corridor": "Ontario, CA",
      "hook": "we're live 0.3 mi away at the Primo Brands site in Ontario, CA"
    }
  ]
}
```
Expected behavior: respond `200 {"accepted": <n>, "batchId": "<id>"}` immediately, then async per target — source committee contacts, draft per-persona copy (proximity hook + the evergreen YardFlow spine, no em dashes), and stage each as a draft into the app via `POST /api/cron/queue` (`source:'clawd'`, `owner`). Dedup is handled app-side on intake.

---

## Task 1: Dispatch library (pure + network, DI-testable)

**Files:**
- Create: `src/lib/discovery/clawd-dispatch.ts`
- Test: `tests/unit/clawd-dispatch.test.ts`

- [ ] Step 1 (RED): write `tests/unit/clawd-dispatch.test.ts` covering: `buildDraftBatchPayload(rows, owner)` maps a RankedRow to a DraftBatchTarget with the correct `hook` string and `nearestLiveSite` resolved from `REFERENCE_SITES`; `dispatchDraftBatch` returns `{ok:false, reason:'clawd_not_configured'}` when no token; POSTs to `/api/yardflow/draft-batch` with Bearer token and parses `{accepted, batchId}` on 200; maps 404→`{ok:false,reason:'clawd_endpoint_not_ready'}`, 401→`reason:'unauthorized'`, network throw→`reason:'network_error'` (never throws).
- [ ] Step 2: run, verify fail.
- [ ] Step 3 (GREEN): implement. Types `DraftBatchTarget`, `DraftBatchPayload`. `buildDraftBatchPayload(rows: Pick<RankedRow,...>[], owner: string)`. Hook phrasing: `we're live ${distanceMi.toFixed(1)} mi away at the Primo Brands site in ${nearestLiveSite}` (no em dashes). `dispatchDraftBatch(payload, opts?: {baseUrl?; token?; fetchImpl?})` resolves baseUrl via `resolveClawdBaseUrl()` and token via `resolveClawdToken()` (reuse `clawd-export-client.ts`), wraps fetch in try/catch, returns the discriminated union. Keep `node:*`-free (client-safe import of REFERENCE_SITES only).
- [ ] Step 4: run, verify pass + tsc.
- [ ] Step 5: commit.

## Task 2: Server action

**Files:**
- Modify: `src/app/discovery/actions.ts`
- Test: `tests/unit/hand-to-clawd-action.test.ts` (mock prisma/auth not needed; action is thin — test payload assembly + auth gate via a small extracted pure helper if practical)

- [ ] Step 1 (RED): test that `dispatchSliceToClawd` returns `{ok:false,reason:'unauthenticated'}` with no session and forwards targets+owner to `dispatchDraftBatch` when authed (inject a fake dispatcher).
- [ ] Step 2-4: implement `dispatchSliceToClawd(targets: DraftBatchTarget[])` — `auth()` for owner; bail if none; call `dispatchDraftBatch(buildPayload(targets, owner))`; return result. Run, pass, tsc.
- [ ] Step 5: commit.

## Task 3: Worklist "Hand to Clawd" control

**Files:**
- Modify: `src/app/discovery/discovery-hub.tsx` (worklist toolbar, next to the slice/widen buttons)

- [ ] Step 1: add a `Hand to Clawd` button. Target set = pinned rows if `pinned.size>0`, else the displayed slice. Build `DraftBatchTarget[]` client-side from the rows (resolve `nearestLiveSite` from `REFERENCE_SITES`). On click call `dispatchSliceToClawd`; show a sonner result toast: success → `Handed ${n} to Clawd. Drafts will appear in your Outbox.`; `clawd_endpoint_not_ready` → `Clawd intake not live yet. Share the contract.`; other → error. One click, no confirm dialog. Show a small count beside the button (`N targets`).
- [ ] Step 2: manual tsc/lint; commit.

## Task 4: Contract doc + env check

**Files:**
- Create: `docs/integrations/clawd-draft-batch.md` (the contract block above, expanded)

- [ ] Verify `CLAWD_CONTROL_PLANE_URL` (or rely on default) and `MC_API_TOKEN` are set in Vercel Production; if `MC_API_TOKEN` absent, flag to Casey (do not invent it). Commit doc.
