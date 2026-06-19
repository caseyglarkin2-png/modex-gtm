# Harris Teeter — FOV Verification Rejections

FOV scrub run 2026-06-19. 3 of 3 sites verified.

**No rejections. No low-confidence (probable) sites.** All 3 sites verdict = `confirmed`.

## How each was checked
Every site ran the full protocol: V0 operating-entity resolution, V1 Tier-1
positive current-operation search, V2 closure/divestiture/consolidation gauntlet,
freight-yard sanity. Bankruptcy-era check is N/A (Harris Teeter / Kroger had no
major bankruptcy restructuring; `checkedBankruptcyEra=false`).

## Kroger double-map guard (watch-note)
Harris Teeter is a Kroger banner (acquired 2014) but is a DISTINCT account from
`kroger`. All 3 sites were confirmed as Harris Teeter banner self-distribution
DCs, NOT generic Kroger DCs. NC Commerce names the operator as "Harris Teeter,
LLC, a wholly-owned subsidiary of The Kroger Co." and the HT careers portal
lists both Indian Trail and Greensboro as HT distribution facilities. No Kroger
DC was double-mapped here.

## Consolidation gauntlet result (the real risk for this account)
The closure search surfaced a Kroger / Harris Teeter facility wind-down, but it
is a DIFFERENT facility class and does NOT touch either NC DC:
- Grocery Dive, 2025-11-25 — https://www.grocerydive.com/news/kroger-harris-teeter-fulfillment-centers-closing-e-commerce/806354/ —
  Kroger is closing the **HT Delivery e-commerce** customer-fulfillment / spoke
  network (Alexandria VA, Frederick MD, Groveland/Jacksonville/Rockledge/Tampa FL,
  Pleasant Prairie WI). These are automated online-grocery CFCs, not the
  wholesale grocery/perishable/frozen DCs. **Neither Indian Trail nor Greensboro
  is named.** No WARN notice, sale, relocation, or NC self-distribution
  consolidation was found against either site.

## Sites verified (all confirmed)
- 01 Harris Teeter Perishable DC, Indian Trail NC (6001 W Hwy 74) — perishable half of the shared campus.
- 02 Harris Teeter Grocery DC, Indian Trail NC (6001 W Hwy 74) — dry-grocery half of the same shared campus.
- 03 Harris Teeter DC, Greensboro NC (200 Distribution Dr, near PTI airport) — frozen/grocery/perishable campus.
