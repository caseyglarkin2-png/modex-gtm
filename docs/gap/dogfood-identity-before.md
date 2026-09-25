# GAP OS dogfood, Phase 1: identity coverage audit (BEFORE)

STATUS: READ-ONLY. No production write. Run against live production Postgres via `scripts/gap/dogfood-identity-audit.ts`.

<!-- verified:2026-09-24 -->

## Method

`loadIdentityContext` (the real runtime context builder, `src/lib/gap/identity/service.ts`) loaded from production, then every distinct, non-dismissed `PounceTrigger.account_name` from the 500 most recent triggers was run through the real `resolveIdentity` resolver (`src/lib/gap/identity/resolve.ts`) -- the exact same tiers the hypothesize cron uses. Nothing here is a hand-simulated guess.

## Global account coverage (1,707 Account rows)

| Signal | Count |
|---|---|
| `Account.hubspot_company_id` populated | **0 / 1,707** |
| `CanonicalCompany` with a resolved domain | **0** (verifiedDomainToAccounts map size 0) |
| `GapAccountAlias` rows | **0** |

This confirms the prior release-smoke finding stands in production right now: zero deterministic (tier A/B) identity coverage exists anywhere in the account base. Every resolution today happens through tier C (normalized name) or fails.

## Pounce cohort (the dogfood population): 43 distinct non-dismissed accounts, last 500 triggers

| Classification | Count | Accounts |
|---|---|---|
| RESOLVED_BY_HUBSPOT_ID | 0 | -- |
| RESOLVED_BY_DOMAIN | 0 | -- |
| RESOLVED_BY_ALIAS | 0 | -- |
| RESOLVED_BY_NORMALIZED_NAME | 16 | UNFI, Niagara Bottling Llc, Amazon, PepsiCo, John Deere, The Home Depot, FedEx, RXO, ODFL, UPS, Kraft Heinz, XPO, The Coca-Cola Company, Coca-Cola, General Mills, Kroger |
| AMBIGUOUS | 0 | -- |
| UNRESOLVED | 27 | Yardview, Loblaw, Eaigle, Target, Outpost, Kaleris, Vector, China Three Gorges Corporation, C3 Solutions, Walmart, LOW, Pinc, WERN, CLX, GXO, PG, MATX, SNDR, CHRW, CL, Terminal Industries, ARCB, KNX, JBHT, CAG, "Pinc plans", Cloumbian |

**Coverage: 16/43 (37%) resolve today; 27/43 (63%) do not.**

## Notable finding: ticker-symbol signals

11 of the 27 unresolved names are bare NYSE/NASDAQ ticker symbols, not company names: `LOW` (Lowe's), `GXO` (GXO Logistics), `PG` (Procter & Gamble), `MATX` (Matson), `SNDR` (Schneider National), `CHRW` (C.H. Robinson), `CL` (Colgate-Palmolive), `ARCB` (ArcBest), `KNX` (Knight-Swift), `JBHT` (J.B. Hunt), `CAG` (Conagra Brands). This looks like a Pounce ingest source (likely SEC/investor-relations signals) that reports the issuer by ticker rather than legal or trade name. Normalization cannot bridge a ticker to a name -- this is exactly what an explicit `GapAccountAlias` is for, IF each ticker deterministically maps to exactly one existing `Account` row.

Also unresolved: `Walmart` (no canonical parent `Account`, matches the same finding as the earlier Inland26 dry run doc), `Target`, `Loblaw`, `Yardview`, `Eaigle`, `Outpost`, `Kaleris`, `Vector`, `China Three Gorges Corporation`, `C3 Solutions`, `Pinc` / `"Pinc plans"` (likely the same company, two raw strings), `Terminal Industries`, `Cloumbian` (likely a typo for "Colombian" or a mis-OCR'd name -- needs human judgment, not a guessed alias).

## Next

Phase 2 bootstraps identity for the deterministic cases in this cohort (ticker-to-account aliases, HubSpot company id/domain backfill) using HubSpot as the trusted source, then re-runs this same audit for a BEFORE/AFTER comparison. See `docs/gap/dogfood-identity-after.md`.
