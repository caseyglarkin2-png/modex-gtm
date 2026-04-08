# Raw Email Candidate Audit - 2026-04-08

Scope:

PepsiCo and The Home Depot raw-email candidates from [docs/raw-email-enrichment-queue.csv](docs/raw-email-enrichment-queue.csv).

## Verdict

None of these candidates are sendable today.

## Why

Both domains are currently listed as blocked domains in the database-backed suppression layer used by the recipient guard.

- `pepsico.com` is blocked.
- `homedepot.com` is blocked.

That means even payload-ready contacts fail eligibility before any send logic runs.

## Candidates Checked

### PepsiCo / Frito-Lay lane

1. David Chambers - `david.c@pepsico.com`
2. Laurence Roethel - `laurence.roethel@pepsico.com`
3. Cole Schmidt - `cole.schmidt@pepsico.com`

Result:

All three fail with `Bounce-suppressed domain: pepsico.com`.

Notes:

- David Chambers has strong repo evidence as a true Frito-Lay operations persona.
- The problem is not lack of targeting evidence. The problem is domain suppression.

### The Home Depot lane

1. Chris Crowder - `chris_crowder@homedepot.com`
2. Ted Halkyard - `ted_halkyard@homedepot.com`
3. Victoria Toll - `victoria_toll@homedepot.com`

Result:

All three fail with `Bounce-suppressed domain: homedepot.com`.

Notes:

- These contacts have consistent raw-export evidence and LinkedIn matches.
- They are still not sendable while domain suppression remains in place.

## Action Rule

Do not convert these raw candidates into manifests.

Use LinkedIn or phone for now.

Only revisit email if one of these happens:

1. Domain suppression is intentionally cleared after a verified deliverability review.
2. A warm intro creates a clearly safe exception path.
3. We obtain a separate validated address on a non-suppressed domain tied to the same person.