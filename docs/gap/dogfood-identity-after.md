# GAP OS dogfood, Phase 2: identity bootstrap (AFTER)

STATUS: WRITES MADE. Deterministic only. No Account created/merged/deleted. No HubSpot write.

<!-- verified:2026-09-24 -->

## What was written

**`Account.hubspot_company_id` backfill (12 accounts)**, confirmed 1:1 via HubSpot MCP `search_crm_objects` (see the ticker-lookup agent's report, folded in below) against exactly one existing Account row each:

Unfi, Niagara Bottling, Amazon, PepsiCo, John Deere, The Home Depot, Odfl, UPS, Kraft Heinz, XPO, General Mills, Kroger.

**`GapAccountAlias` (7 ticker symbols -> canonical account)**, via the real `registerAlias()` (all `CREATED`, none `CONFLICT`):

LOW -> Lowe's, GXO -> GXO Logistics, PG -> Procter & Gamble, MATX -> Matson Inc., ARCB -> ArcBest, JBHT -> J.B. Hunt, CAG -> Conagra Brands Inc.

Script: `scripts/gap/dogfood-identity-bootstrap.ts` (idempotent -- re-running skips anything already backfilled).

## Skipped, and why (no guess made)

| Candidate | HubSpot | Account table | Why skipped |
|---|---|---|---|
| CL (Colgate-Palmolive) | 1 clean match (colgatepalmolive.com) | **0 rows** | No existing Account to alias to; would require creating one, not authorized |
| KNX (Knight-Swift) | 1 clean-ish match (knightswift.com) | **0 rows** (only under other spellings, none found) | Same as above |
| SNDR (Schneider National) | **AMBIGUOUS** -- 5 "Schneider*" HubSpot records | 0 rows | Both sides fail; genuinely needs a human pick |
| CAG's HubSpot side | **AMBIGUOUS** -- 2 identical-name "Conagra Brands" HubSpot company records, different domains | 1 clean Account row | The alias write is still safe (it maps a ticker to the one Account row, not to a HubSpot id); the HubSpot-side ambiguity only blocks a future `hubspot_company_id` backfill for this account, not the alias |
| Walmart | 1 clean match (walmart.com) | **0 rows** named "Walmart"; only "Walmart Distribution Center" | Parent-vs-subsidiary judgment call -- CASEY_REVIEW_REQUIRED (queue item 1) |
| Target | 1 clean match (target.com) | **0 rows** | No Account to alias to |
| Loblaw | **AMBIGUOUS** -- "Loblaws" vs "Loblaw Companies", no exact "Loblaw" | 0 rows | Both sides fail |
| Terminal Industries, C3 Solutions, Kaleris, Pinc | **0 HubSpot matches** | -- | Not a GAP identity problem; these companies are not in HubSpot at all yet (a HubSpot/enrichment gap, out of this session's scope) |

## Pre-existing near-duplicate Account rows (found, not touched)

Account-merge is explicitly not authorized this session. Flagging for the existing dedup engine (`src/lib/gap/revops/*` conventions), not acted on:

- **"FedEx"** and **"FedEx Corporation"** -- both present, same normalized key.
- **"Coca-Cola"** and **"The Coca-Cola Company"** -- both present, same normalized key.
- **"RXO"** and **"RXO, Inc."** -- both present, same normalized key.

None of these were touched. Each currently resolves (tier C, normalized name) to whichever row the resolver's account-list scan encounters, which is a real but pre-existing risk (not introduced by this session) -- worth a human dedup pass, not a guess here.

## Coverage: BEFORE -> AFTER (Pounce cohort, 43 accounts)

| Classification | Before | After |
|---|---|---|
| RESOLVED_BY_HUBSPOT_ID | 0 | 0 (see note) |
| RESOLVED_BY_DOMAIN | 0 | 0 |
| RESOLVED_BY_ALIAS | 0 | **10** |
| RESOLVED_BY_NORMALIZED_NAME | 16 | 13 (7 tickers moved from unresolved into the new alias tier; the rest unchanged, minus the double-counted UNFI/Niagara which now resolve by alias since normalizeCompanyName gives them the same key as their new alias) |
| AMBIGUOUS | 0 | 0 |
| UNRESOLVED | 27 | **20** |

**Coverage: 23/43 (53%) resolve today, up from 16/43 (37%).**

Note on RESOLVED_BY_HUBSPOT_ID staying 0: the coverage-audit script (`dogfood-identity-audit.ts`) resolves each Pounce account name WITHOUT that trigger's own `hubspot_company_id` column (it was not selected/passed through in Phase 1's script). The 12 accounts now carrying `Account.hubspot_company_id` will resolve at tier A automatically the next time the real hypothesize cron runs, if the trigger's own row happens to carry a matching `hubspot_company_id` -- that is a Pounce-ingest-side fact this audit does not check. Tier A capability was added; whether it fires depends on data this script does not read. Worth confirming in a later pass, not a blocker now.

Global account base: `Account.hubspot_company_id` coverage moved from 0/1,707 to **12/1,707**.
