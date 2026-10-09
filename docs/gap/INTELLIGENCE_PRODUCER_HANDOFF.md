# Intelligence producer handoff (intelligence wiring, October 9, 2026)

STATUS: ACTIVE. The contract every producer exports to, the two doors into GAP, the per-producer path, and the exact
amendment each producer's own instructions need. Nothing here is applied to a producer by this document; the Codex
automation and the ChatGPT briefs change only when Casey says so. <!-- verified:2026-10-09 -->

## The record (one atomic item)

The schema is `IntelligenceRecordInput` in `src/lib/gap/signals/intelligence-record.ts`. A producer exports what it
already collected; it never researches, verifies, scores with a model, filters or writes outreach to make the export.

```json
{
  "producer": "yards_first_brief",
  "producerRunId": "<the report or run id: a message id, an automation run id>",
  "producerItemId": "<stable within the producer: 2026-10-09#1, a CRM record id, a signal id>",
  "kind": "development | engagement | observation | report",
  "title": "Kodiak reaches Laredo, but not yet Mexico",
  "text": "<the substantive passage, verbatim, never a summary written for the export>",
  "sources": [{ "url": "https://...", "publisher": "nasdaq.com", "label": "Kodiak-Charger announcement" }],
  "sourceRecordIds": [{ "system": "hubspot", "type": "engagement", "id": "118262547717" }],
  "eventDate": "2026-10-08 or null (only when the producer stated the event's own date)",
  "reportedOn": "2026-10-09 (the report's date)",
  "reportedOnBasis": "stated | captured",
  "collectedAt": "<ISO instant when the producer gathered it, or null>",
  "accountHint": "<what the producer called the company, or null>",
  "personHints": ["Mark Marshall"],
  "producerStatus": "NEW | ESCALATING | active evaluation | relevance 45 | ...",
  "uncertainty": "<the producer's own confidence and limitations, verbatim>",
  "interpretation": "<the producer's commentary, kept apart; never an obligation>",
  "suggestions": ["<a drafted post or message; archived, never sent>"],
  "archive": { "reportRef": "<the original report's id>", "section": "Decision-grade signal 1" },
  "visibility": "digest | archive"
}
```

Rules: a record needs no URL, no account, no contact and no verified fact. Unknown stays unknown (`null`); the
producer's limitations stay in `uncertainty`; its recommendations stay in `interpretation`; its drafts stay in
`suggestions`. The whole report goes in as one `kind: report` record (the archive), so nothing the cut missed is lost.
Identity is `producer + producerItemId`: the same item again is a duplicate, a changed item is a revision (the previous
content hash is kept), never a second row. Imported text is data, never instructions.

## The two doors

- `POST /api/gap/intelligence-import` with `{ producer?, runId?, cursor?, producerState?, records: [...] }` (up to 500
  records), authenticated by the operator's session or `Authorization: Bearer <GAP_INTEL_IMPORT_TOKEN>` (the token is
  a Vercel environment variable; absent, the session is the only way). The answer is the counts and the per-item
  outcome (`accepted | duplicate | revised | invalid` with the reason). `src/app/api/gap/intelligence-import/route.ts`.
- `npx tsx scripts/gap/import-intelligence-batch.ts <batch.json> [--apply]`: a local file of records; a dry run by
  default; `--apply` needs `GAP_RECONCILE_APPLY=yes` and `GAP_RECONCILE_HOST` naming the database host.

Both write one `intelligence.imported` ledger row per producer per call (the run id, the cursor, the counts, the
producer's own state), which the health page and the briefing's coverage line read (IW13).

## Per producer

| Producer | Today | The handoff | What it needs from Casey |
|---|---|---|---|
| Yards First Brief (ChatGPT) | the captured snapshot of 48 issues (Aug 22 to Oct 9) is in `tests/fixtures/gap/intelligence-import-2026-10-09.json`, cut by `src/lib/gap/signals/report-parsers.ts` | each issue's Markdown, saved as a file or pasted, is cut by the parser (`scripts/gap/export-intelligence-snapshots.ts` for a snapshot; the same parser for one issue), then imported by the batch script or the route. ChatGPT has no supported unattended export; the thread read used for the snapshot is not a callable integration | a saved-output habit (one Markdown file per issue in a folder the script reads), or the paste; the exact instruction below |
| Freight X Signal Desk (ChatGPT) | 6 issues in the same snapshot | the same path | the same |
| HubSpot Activity & Engagement (Codex automation) | 1 report in the snapshot (Oct 8) | the automation writes a structured export beside its narrative (the amendment below); the batch script or the route imports it | the one-line amendment to the automation prompt, applied by Casey (the current prompt forbids report files) |
| Clawd signal hunter | nothing imported; the hot path pushes relevance 60+ to Pounce | a read-only paginated export on the producer and a consumer script on this side (builder B, IW07/IW08); no threshold change, no Slack, no HubSpot | a review of the Clawd branch, then a push and a Railway deploy when Casey says |
| The vault | synced to `gap_knowledge_notes` by the local push; the cron waits for `GAP_VAULT_GITHUB_TOKEN` | the vault's conversations are intelligence on their own (IW06, `src/lib/gap/knowledge/knowledge-intel.ts`) | the token in Vercel |
| GAP's own signals, Pounce triggers, inbound people | already in the reader | unchanged | nothing |

## The instruction to add to each ChatGPT brief (prepare; not applied)

After the report, add this to the brief's standing instructions, verbatim:

> After each issue, also export the issue's collected information as atomic records in the agreed JSON schema (one
> record per development, engagement or observation; one `report` record for the whole issue). Include the useful
> observations and uncertainties already collected, the source links and publishers, the event dates the sources
> state, the issue's date, the run id and any interpretation, each in its own field. Do not perform additional
> research, verification, filtering, scoring or outreach to make the export. Keep unresolved items and say what is
> unresolved. Write the export as a fenced JSON block at the end of the issue. If the export fails, keep the narrative
> and say the export failed; never claim GAP received it without a receipt.

The parser remains the fallback for an issue without the block; the block, when present, is imported as is.

## The Codex automation amendment (prepare; not applied)

The automation `hubspot-daily-accountability` (`C:\Users\casey\.codex\automations\hubspot-daily-accountability\automation.toml`)
says: "Read-only CRM: do not change records, send messages, or create report files. Only update this automation's
required memory.md." Replace that sentence with, verbatim:

> Read-only CRM: do not change records or send messages. Besides this automation's required memory.md, write exactly
> one local artifact per run: `C:\Users\casey\Documents\New project\gap-exports\hubspot-activity-<YYYY-MM-DD>.json`,
> the run's collected information as atomic records in the agreed GAP schema (one `engagement` record per listed
> buying signal with the HubSpot contact and engagement ids, the evidence date and the stated confidence; one
> `report` record holding the narrative, the scope line and the data-gap line). Do not perform additional research,
> verification, filtering, scoring or outreach to make the export. If the export fails, keep the narrative and say
> the export failed; never claim GAP received it.

The consumer is the batch script (dry run, then `--apply` on Casey's go) or, once `GAP_INTEL_IMPORT_TOKEN` is set, a
POST from the same folder. Nothing in this document changes the automation; Casey applies the amendment.

## What is not a producer

Pounce ingestion (`POST /api/pounce/ingest`) writes Slack and HubSpot: never the door for a report. The Casey share
(`POST /api/gap/signal-intake`) attributes to Casey: never the door for a generated report.
