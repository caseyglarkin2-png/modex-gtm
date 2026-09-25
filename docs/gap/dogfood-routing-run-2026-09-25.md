# GAP OS dogfood: first real routing run (2026-09-25)

STATUS: production writes made (RoutingDecision only). No send, no enroll, no HubSpot write.

<!-- verified:2026-09-25 -->

## What ran

`scripts/gap/dogfood-run-routing.ts` calls the exact same `runRouting()` and
the exact same real dependencies (`createClawdSuppressionReader`,
`createHubSpotSnapshotProvider`) that `POST /api/gap/routing/run?mode=apply`
wires up -- the same code path the new "Run routing" button in `/gap` uses.
Scoped to the two accounts with an active hypothesis: **General Mills,
Kroger** (`accountNames` param), not the whole database.

## Result

```json
{
  "runId": "run-2026-09-25T13:06:05.393Z",
  "mode": "shadow",
  "accountsScanned": 2,
  "pairs": 4,
  "decisions": 4,
  "skips": {},
  "byRule": { "suppressed": 2, "suppression_unknown": 2 },
  "byAction": { "do_not_contact": 2, "research_required": 2 },
  "dryRun": false
}
```

4 real `RoutingDecision` rows created, all `mode: 'shadow'`, all
`acted_by_system_at: null`, all `human_action: null`. Zero skips -- every
eligible pair got a decision, not silently dropped.

## Why the recommendations are do_not_contact / research_required, not enroll

- **General Mills (2 personas): `do_not_contact`, rule `suppressed`.** The
  Clawd suppression read came back positive for both -- these two contacts
  are genuinely suppressed. Routing correctly refuses to recommend contact.
- **Kroger (2 personas): `research_required`, rule `suppression_unknown`.**
  This script's local `.env.local` does not carry `CLAWD_CONTROL_PLANE_URL`/
  `TOKEN` (production has these; this script ran with what was copied for
  dogfood reads). Per the suppression reader's own contract, missing config
  answers `unknown`, never `clear`, and R0b routes an unknown suppression
  answer to `research_required` rather than guessing it's safe to contact.
  This is the router working exactly as designed under a real outage/
  missing-config condition, not a fabricated result. If re-run through the
  actual production route (which has the real Clawd credentials), Kroger's
  two personas would likely resolve to a real suppression verdict instead.

This is a legitimate example of task 8's "if zero decisions, produce a
diagnostic" instruction, inverted: here decisions were NOT zero, but the
reasoning behind each of the 4 is fully accounted for above, none guessed.

## Safety verification

- `RoutingDecision` rows for these accounts: 4, all `mode: shadow`, all
  `acted_by_system_at: null`, all `human_action: null`.
- `SequenceEnrollment` rows for these accounts: **0**.
- Emails sent: **0**. HubSpot writes: **0** (two reads only, matching the
  route's own documented contract).
- `GAP_AUTO_ENROLL_ENABLED`: unchanged, `false`.
- `GAP_AUTO_ENROLL_SHADOW`: unchanged, `false`.

## What Casey sees now

Opening `/gap` and clicking **Run routing** will pick up this same run
(or a fresh one) and show these 4 cards: 2 "do not contact" for General
Mills, 2 "research required" for Kroger. Clicking through to "I did this" /
"I did something else" on any of them is the first real human-action
data point this dogfood program has produced.
