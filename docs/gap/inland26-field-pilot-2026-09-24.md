# Inland26 field pilot: morning command center (aggregate, public-safe)

STATUS: PREP ONLY — nothing sent, nothing enrolled, nothing enrolled into HubSpot, no flags changed.

<!-- verified:2026-09-24 -->

This file is safe to commit (no PII). Contact-level detail (names, emails, exact copy, HubSpot links) lives at `docs/gap/.local/inland26-wave1-full.md`, which is `.gitignore`d and never leaves this machine.

## EXECUTIVE SUMMARY

- Source cohort: HubSpot list 227, "YF | JOC Inland 2026 | Hitlist", portal 3819073. **DYNAMIC** segment (not static) — created 2026-09-24, size 75 at read time. Segment was read-only queried, never modified.
- Snapshot time: 2026-09-24, ~04:2x UTC.
- Eligible after the mechanical gate: 62 of 75.
- Excluded (mechanical): 13 — 4 no email, 6 `yardflow_tam=out` (including one junk placeholder company record), 2 no job title, 1 weak-role title.
- Judgment-held outside the mechanical gate: 15 contacts across 5 carrier/3PL companies (J.B. Hunt, Schneider National, Werner Enterprises, Reed TMS Logistics, C.R. England) — mechanically eligible, but every one of these specific contacts is sales/commercial leadership at a carrier, not the operational buying center for a yard-technology purchase at that carrier. Held, not excluded outright: the company may be a legitimate account through a different, operational contact later.
- Wave 1 (content complete, gate-checked, call-prepped tonight): **3** — quality bar prioritized over count, per explicit instruction (8 exceptional beats 15 mediocre; 3 fully rigorous beat a padded 8 given tonight's time budget).
- Wave 2 (real evidence exists, not yet built to the same bar): 3, all with existing account-level research on file.
- Blockers: see "Blockers" section below. None are content quality issues; all are infrastructure/data-model issues.

## WAVE 1

| Rank | Company | Problem family | Draft status | Compiler | Suppression | Sequence conflict | Human check needed |
|---|---|---|---|---|---|---|---|
| 1 | Tyson Foods | cost_to_ship | FALLBACK READY | Manually verified against C01-C16 (not run through live `compile()`) | PASS | PASS | Pick the canonical Account row (2 near-duplicates exist) |
| 2 | Ingredion | hidden_capacity | FALLBACK READY | Manually verified against C01-C16 | PASS | PASS | Pick the canonical Account row (2 near-duplicates exist); a different Ingredion contact (not this one) is already in an active outreach series — don't double-send into the account |
| 3 | Walmart | automation_readiness | FALLBACK READY | Manually verified against C01-C16 | PASS | PASS | No canonical Account row exists at all for parent "Walmart" (only a narrower "Walmart Distribution Center" record); also confirm on the Friday call that this contact, not one of the two others on the list, is the right seat |

READY IN HUBSPOT: 0
FALLBACK READY: 3
HOLD: 0 (of the three selected; see Wave 2 and Excluded sections for everyone else)

Full per-prospect detail (observation, hypothesis, exact email, call script, HubSpot links): `docs/gap/.local/inland26-wave1-full.md`.

## WAVE 2 (good candidates, not built to Wave-1 bar tonight)

- John Deere — existing Top100 research on file (`yardflow-hubspot/top100/data/research/johndeere-com.json`); persona fit reasonable but not cross-checked against the research's own named decision owners.
- Target — existing Top100 research on file (`target-com.json`); the specific contact's job title is too generic in HubSpot to confirm department without one more look.
- P&G — existing Top100 research on file (`pg-com.json`); the specific contact is Purchasing/Procurement, which is adjacent to but not clearly inside the supply-chain-ops buying center the research points to.

## EXCLUDED / HOLD (aggregate; full per-contact reasons in the local file)

- 13 mechanical exclusions (no email, TAM out, no title, weak role) — see counts above.
- 15 judgment holds across 5 carrier/3PL companies — sales/commercial leadership, not the yard-ops buying center, at each.
- 44 remaining eligible contacts across ~30 other companies were not individually researched tonight (time budget), consistent with "do not research the whole world" — they remain valid candidates for a future wave.

## PILOT MEASUREMENT (pre-registered before any send)

What we will learn, once real sends happen and real dispositions come back through `/gap/replies` and `/gap/learning` (once `GAP_OS_ENABLED` and `GAP_HYPOTHESIS_ENABLED` are on):

- Problem resonance rate (buyer confirms or partially confirms the business problem)
- Hypothesis resolution: confirmed / partially confirmed / rejected, and precision across those
- Root cause confirmation rate
- Impact acknowledgment rate
- Meeting acceptance rate
- Buyer language captured as BID, provenance-preserving, human-confirmed only

This is explicitly NOT optimized around open rate. See `docs/gap/GAP_PROSPECTING_OS.md` sections 0 and 11 (Sprint 5) for the metric definitions this pilot will populate.

## BLOCKERS (infrastructure/data, not content)

1. **Vercel production flags could not be changed this session.** The connected Vercel MCP account returns 404 "Project not found" on every project-scoped call (`get_project`, `filter_project_envs`, `create_project_env`) despite `list_projects`/`list_teams` correctly finding the right team and project — a connector/permission-scope issue, not a code or safety issue. `GAP_OS_ENABLED` and `GAP_HYPOTHESIS_ENABLED` remain OFF in production. Exact manual action for Casey: in the Vercel dashboard, Project Settings -> Environment Variables -> Production, add `GAP_OS_ENABLED=true` and `GAP_HYPOTHESIS_ENABLED=true`, then redeploy (or trigger a redeploy from the dashboard). Everything else (`GAP_ROUTING_ENABLED`, `GAP_MESSAGE_COMPILER_ENABLED`, and the rest) stays OFF per the dark-launch plan until Casey decides otherwise.
2. **No HubSpot API capability exists to create a genuine one-to-one email draft that opens, editable, in a connected mailbox for a one-click send.** HubSpot's public CRM API has an Engagements/emails endpoint for LOGGING a message as already sent, and one-to-one compose is a client-side (browser extension / Gmail) feature with no public "create pending draft" endpoint. This was determined by reasoning from the documented API surface, not by a live write-test against a real contact record (a live test would itself have been a production HubSpot mutation on someone's real timeline, which felt like the wrong way to find out). The closest safe, already-existing equivalent in this codebase is modex's own Discovery Draft Queue (`DraftQueueItem`, reviewed and sent via Gmail from casey@freightroll.com through the existing `/discovery` Outbox UI) — but loading Wave 1 into it requires resolving blocker 3 first.
3. **Canonical `Account` row ambiguity for all three Wave 1 companies.** Tyson and Ingredion each have two near-duplicate `Account` rows in production (e.g., "Tyson Foods" and "Tyson"), neither carrying the real HubSpot `hubspot_company_id`; Walmart has no matching parent row at all (only a narrower "Walmart Distribution Center" record). Writing a `ProspectingHypothesis` or a `DraftQueueItem` against a guessed account name risks compounding an existing dedup problem this system has known tooling for elsewhere, so none of the three GAP hypothesis/draft rows were created in production tonight. Exact manual action for Casey: a one-line canonical-account pick (or a real dedup merge) per company, after which the Wave 1 content in the local file can be loaded into GAP OS and the Draft Queue in minutes.

## MORNING PATH

1. Read `docs/gap/.local/inland26-wave1-full.md` (3 prospects, full detail, ready to send from — content already gate-checked).
2. Resolve blocker 3 (one canonical account name per company).
3. Resolve blocker 1 (flip the two Vercel flags, redeploy) if you want to work through the GAP UI rather than directly.
4. Either paste the three emails from the local file straight into HubSpot/Gmail yourself (fastest path tonight's work actually enables), or ask for the three `DraftQueueItem` rows to be created now that the account names are resolved, then review and send from `/discovery`.

NO EMAILS SENT. NO CONTACTS ENROLLED. ALL CONTENT REQUIRES CASEY'S OWN SEND ACTION.
