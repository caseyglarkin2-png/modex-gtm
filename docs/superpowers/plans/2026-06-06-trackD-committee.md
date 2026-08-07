# Track D — Committee / per-persona drafts (#2 residual)

> **STATUS: HISTORICAL.** A dated plan/spec record, retained for context and rationale. It describes intent at the time of writing; the code has moved since, so it is NOT current guidance. For present state read `git log --since=7d`, the live system, and `plans/README.md`. Last verified 2026-08-06.


**Goal:** Reach the whole buyer committee per account with persona-differentiated copy, in one move. (Clawd handles committees via Hand-to-Clawd; this closes the in-app per-contact path so it isn't flat/identical.) No guards.

## Task D1: persona-aware copy (outreach.ts)
**Files:** Modify `src/lib/discovery/outreach.ts`; Test `tests/unit/outreach-persona.test.ts`.
- Add an optional 3rd param: `buildOutreach(prospect, firstName?, title?)`. Backward-compatible — existing callers passing only `firstName` are unchanged.
- Add a small pure `personaScope(title?: string): 'yard ops' | 'network' | null` — keyword match (case-insensitive): /yard|dock|terminal|plant|site|warehouse|distribution|operations|ops/ -> 'yard ops'; /transport|logistics|supply chain|fleet|network|distribution network/ -> 'network'; else null. (If both match, prefer 'yard ops' for the more operational title; keep the order so the first match wins.)
- When `personaScope(title)` is non-null, the CTA line `worth a look for your team` becomes `worth a look for your ${scope}`. When null/absent, the body is BYTE-IDENTICAL to today.
- TDD: no-title output unchanged (contains "for your team"); a transportation title yields "for your network"; a yard/ops title yields "for your yard ops"; an unknown title falls back to "for your team".

## Task D2: committee queueing (prospect-contacts.tsx)
**Files:** Modify `src/app/discovery/prospect-contacts.tsx`.
- In `handleQueue`, pass the contact's title: `buildOutreach(prospect, contact.firstName, contact.title)`.
- Add a **"Queue all"** button (when 2+ resolved contacts have emails) that queues every resolved contact with an email in one click: for each, `addToQueue({ toEmail: c.email, accountName: prospect.name, personaName: c.name, subject, body, imageUrl })` from `buildOutreach(prospect, c.firstName, c.title)`. Toast a tally (`N queued, M skipped`) using the existing dedup reasons; mark each queued. No confirmation dialog; one click. Keep the existing per-contact Queue button.
- No em/en dashes in new copy. Keep tsc + eslint clean.

## Ship
One PR → green CI → merge → deploy → verify. Final track.
