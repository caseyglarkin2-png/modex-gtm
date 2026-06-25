# modex → clawd intel export: data contract (the engagement bridge)

From: the canonical intel layer session (clawd, the brain).
To: the modex-gtm session (owner of the engagement Postgres).
Date: 2026-06-13.
Related: `docs/superpowers/specs/2026-06-13-phase0-signal-model-and-projections.md` (the unified Signal model), `2026-06-13-command-center-canonical-view-contract.md` (the existing `campaign_stats` bridge this extends).

## Handoff status (2026-06-13) — read this first

The clawd (brain) side is ready and this contract is live. Three things for you:

1. **The canonical campaign view now returns `person.email`** (clawd deploy
   `d810abac`, live on `GET /api/canonical/campaign/<tag>`). Switch your Phase 5b
   EmailLog/DraftQueueItem join from the normalized-persona-name match to `email`.
   The `kdrp.com` alias is preserved on the person (Jamie Taylor stays
   `jamie.taylor@kdrp.com`) while the account still canonicalizes to
   `keurigdrpepper.com`, so the email join is stable and account resolution holds.
2. **Build this contract, starting with stream 1 (`replies`) + stream 2
   (`email_events`).** Those close the two gaps your 5b had to work around by
   reaching into EmailLog directly: once clawd ingests them, the canonical view
   carries engagement and your heat model can read it from the canonical view
   instead of a local join. One open question for you is at the very bottom:
   can `email_logs` / `inbound_messages` emit a resolvable `account_domain`, or
   only `account_name`?
3. **Whole-site page traffic is now live on clawd** (`pages` block on
   `GET /api/intel/rollups`, plus `GET /api/intel/analytics/pageview`). Every
   yardflow.ai page with views, busiest first. If the terminal wants a
   site-traffic widget beyond the campaign lens, the data is there now.

clawd builds the per-stream connectors the moment these endpoints return data;
they no-op fail-soft until then, so there is no ordering dependency.

## Why this exists

The three-repo signal audit found that the highest-fidelity GTM signal already
collected lives in **modex's Postgres**, which clawd (a separate database)
cannot read. That is why the ledger and the terminal currently show `reply=0`
and `email_open=0`: clawd's own reply/pipeline files are ephemeral container
artifacts and the HubSpot portal does not track Gmail-send opens. More clawd
connectors cannot fix this — the durable truth is in modex.

This contract defines the **read endpoints modex exposes** so clawd can ingest
that truth into the canonical ledger (and from there into the five terminal
projections). modex builds the endpoints; clawd builds the connectors that poll
them. Nothing about the modex app's behavior changes — these are read-only
projections over tables modex already writes.

## Transport: PULL, watermarked, over the existing bridge

clawd already calls modex `GET /api/campaigns/<tag>/stats` authed by
`QUEUE_AGENT_SECRET`. Reuse exactly that:

```
GET /api/intel/export/<stream>?since=<ISO8601>&cursor=<opaque>&limit=<=500
Header: x-queue-secret: <QUEUE_AGENT_SECRET>     # same secret, same validation
```

Response envelope (identical for every stream):

```jsonc
{
  "stream": "email_events",
  "items": [ <record>, ... ],      // <= limit, ascending by (occurred_at, id)
  "nextCursor": "<opaque>|null",   // pass back to page forward; null = caught up
  "watermark": "<ISO8601>"         // max occurred_at in this batch; clawd persists it as the next `since`
}
```

Rules:
- **Keyset pagination** on `(occurred_at, id)`, not OFFSET (stable under concurrent inserts). `cursor` is opaque to clawd; modex encodes the last `(occurred_at,id)`.
- **Incremental**: clawd persists a per-stream high-watermark and passes it as `since`. Cold start: `since` omitted = from the beginning (clawd will page through history once, then stay incremental).
- **Idempotent**: every record carries a globally-unique `idempotency_key`. clawd folds it into its ledger dedup hash, so re-pulling an overlapping window is a no-op. This is the single most important field — get it stable and re-pulls never double-count.
- `limit` caps at 500. Fail-soft: on error return `200 {items:[],nextCursor:null,watermark:since}` rather than 5xx, so a bad batch never wedges the poller.

## Every record carries this envelope

```jsonc
{
  "idempotency_key": "open:emlog_88213",   // stable, unique per logical signal (see per-stream keys)
  "occurred_at": "2026-06-12T20:31:00Z",   // when it happened in the world -> ledger observed_at
  "account_name": "PepsiCo",               // at least one of account_name / account_domain required
  "account_domain": "pepsico.com",         // preferred (clawd resolves accounts by domain)
  "person_email": "george.sebastian@pepsico.com",  // when the signal is person-scoped (else omit)
  "person_name": "George Sebastian",
  ... stream-specific payload ...
}
```

clawd resolves the account by `account_domain` (falling back to `account_name`)
and the person by `person_email`, using the same resolver + domain-alias map the
ledger already runs (so `kdrp.com → keurigdrpepper.com` keeps working).

## The five streams (priority order)

### 1. `replies` — THE reply=0 fix (highest value)
Source: `inbound_messages` joined to `email_threads`. One record per inbound message.

```jsonc
{
  "idempotency_key": "reply:inmsg_<id>",
  "occurred_at": "<received_at>",
  "account_name": "...", "account_domain": "...",
  "person_email": "<from_email>", "person_name": "<from_name>",
  "subject": "...", "snippet": "<first 280 chars>",
  "thread_id": "...",
  "intent": "meeting|interested|objection|unsubscribe|bounce|neutral|redirect",  // modex's classification if it has one, else omit and clawd classifies
  "intent_confidence": 0.9                                                        // optional
}
```
clawd maps → `reply` (base, scored in pulse) + `reply_intent` (enrichment carrying intent). `intent=meeting` also emits `meeting`; `unsubscribe` → `unsubscribe`; `bounce` → `bounce`.

### 2. `email_events` — opens / clicks / bounces
Source: `email_logs`. modex expands each row into discrete events for the columns that are set. (Replies come from stream 1, not here, to avoid double-count.)

```jsonc
{
  "idempotency_key": "open:emlog_<id>",   // one of: open:|click:|bounce: per email_log
  "occurred_at": "<opened_at | clicked_at | bounced_at>",
  "account_name": "...", "account_domain": "...",
  "person_email": "<to_email>",
  "event_type": "open|click|bounce",
  "campaign_tag": "...",
  "destination_url": "...",               // click only
  "bounce_type": "hard|soft"              // bounce only
}
```
clawd maps → `email_open` / `email_click` (new) / `bounce`. Because `email_logs`
stores first-touch `opened_at` + a count (not per-open timestamps), one `open`
and one `click` per email_log in v1 is correct and sufficient.

### 3. `engagements` — full /demo + /for session depth
Source: `microsite_engagements`. **One record per session** (keyed by `session_id`), emitted as the session's current summary. Recommendation: emit when the session qualifies or closes; clawd dedups on `session_id`, so re-emitting a deepened session is safe if you advance `occurred_at` (it then shows progression) or a no-op if you don't.

```jsonc
{
  "idempotency_key": "ms:<session_id>",   // advance with a :v2 suffix only if you want progression rows
  "occurred_at": "<last_event_at>",
  "account_name": "...", "account_domain": "...",
  "person_email": "...", "person_slug": "...",
  "surface": "demo|for|compare", "path": "/demo/pepsico",
  "sections_viewed": 5, "cta_ids": ["gallery-run-roi-food"], "variant_history": [...],
  "scroll_depth_pct": 82, "duration_seconds": 145,
  "audio_progress_pct": 0, "video_progress_pct": 60,
  "traffic_quality": "human|bot", "intent_score": 64
}
```
clawd maps → one `microsite_session` (new kind, carries the full depth payload as
provenance) + `web_anon` (views) + `web_anon_click` (when `cta_ids` non-empty).
Bot-quality sessions are ingested but flagged `traffic_quality:"bot"` so the
terminal can exclude them.

### 4. `captures` — field / booth captures (human channel)
Source: `mobile_captures`.

```jsonc
{
  "idempotency_key": "cap:<id>",
  "occurred_at": "<created_at>",
  "account_name": "...", "person_email": "...", "person_name": "...",
  "interest": 4, "urgency": 3, "influence": 5, "fit": 4, "heat_score": 80,
  "intent": "...", "channel": "conference|booth|...", "notes": "<first 280 chars>"
}
```
clawd maps → `field_capture` (new kind, confidence `verified` — a human met them;
this is a channel no integration covers, like manual signals).

### 5. `outcomes` — rep-labeled ground truth (feeds the Phase 4 synthesis loop)
Source: `operator_outcomes`.

```jsonc
{
  "idempotency_key": "out:<id>",
  "occurred_at": "<created_at>",
  "account_name": "...", "person_email": "...",
  "outcome_label": "positive|negative|wrong-person|bad-timing|closed-won|closed-lost",
  "source_kind": "...", "source_id": "...", "created_by": "..."
}
```
clawd maps → `outcome` (new kind). These are the labels the synthesis ranker
learns from (what actually converted), so they are worth exposing even though
they are low-volume.

## Ledger kinds clawd adds for this (clawd's side, FYI)
`microsite_session`, `email_click`, `field_capture`, `outcome`. (`reply`,
`reply_intent`, `email_open`, `bounce`, `unsubscribe`, `web_anon`,
`web_anon_click` already exist.) None of these perturb `account_pulse` /the
Daily Shot unless we deliberately weight them; they surface in the terminal via
the projection layer.

## Build split
- **modex (you):** the five `GET /api/intel/export/<stream>` endpoints over the
  existing tables, `x-queue-secret` auth, keyset pagination, the stable
  `idempotency_key` per record. Read-only; no app-behavior change. Start with
  stream 1 (`replies`) and 2 (`email_events`) — they close the two visible gaps
  and are the smallest (one is a table read, the other a column-expansion).
- **clawd (me):** one watermarked connector per stream in `intel_ingest`, a
  per-stream watermark store, mapping to ledger kinds, idempotent append. I wire
  these the moment an endpoint returns data; until then they no-op fail-soft.

## One open question for you
Do `inbound_messages` / `email_logs` carry a resolvable **account_domain**, or
only `account_name`? clawd resolves best by domain. If only name is present,
include it and clawd will name-resolve (slightly lossier); if you can join to the
company/persona to emit `account_domain`, that is the higher-fidelity path.
