# Deep-Audit Dossier — idx 52 — Tara Foods (Kroger)

**Type:** Grocery Plant (peanut-butter / private-label food manufacturing)
**Address:** 1900 Cowles Lane, Albany, GA 31705
**Resolved center:** 31.59955, -84.10295
**Confidence:** high
**Method:** deep-audit

## Step 0 — Facility confirmation
Supplied coordinates (31.599739, -84.103252) landed directly on the plant. Confirmed the building three ways:
1. Web search: Tara Foods is Kroger's Albany, GA plant at 1900 Cowles Lane (produces all of Kroger's store-label peanut butter, oils, juices, sauces — >8M lbs/month). Address matches Panjiva / Albany Chamber listings.
2. Street View pano O6oEgEnBB6Bx7UNIGH3Szg (2026-03, Cowles Lane) shows the **"TARA FOODS"** name on the building face.
3. Satellite z18-z20 shows a large multi-section manufacturing plant with silos at the SW corner, dock banks, and large trailer drop yards east — consistent with a food-manufacturing plant, not an office.

## Layout
A large manufacturing building (a tall/dark high-bay production block on the north, a lower processing/shipping block on the south) sits roughly N-S with a ~10° clockwise tilt. West of the building is the employee/office front and parking lot facing Cowles Lane; older warehouse buildings sit on the same parcel and across the road. East of the building are two large unpaved trailer drop yards.

## Gate / guard / docks
- **truckGate = true.** Main vehicle drive enters off Cowles Lane on the NW perimeter. Street View looking south from pano QWYYVCSlPkR7nSD6tyRZXw shows a **chain-link sliding/swing gate** (open) across the drive, with chain-link perimeter fencing running along the road frontage in both directions.
- **guardShack = false / remoteGs = true.** No staffed booth at the gate or in the front lot in any satellite (z20) or Street View frame. The gate is a manual chain-link slide gate — controlled entry without a guard, so remote/self check-in (remoteGs) applies.
- **Docks (10-25, ~16).** East building face has ~5-6 dock positions with trailers backed in (z20 east-dock view); the south/SW face has ~4-6 canopy-covered dock doors (z20 south-dock view). Banded 10-25; exact count uncertain (some doors shadowed).
- **scale = false, multiStep = false.** No truck scale or second checkpoint visible.

## Yard zones & counts
- **perimeter** — fenced operational parcel (front lot + plant + drop yards), ~21.4 acres, traced as a 7-vertex ring at true orientation (slightly rotated rectangle).
- **truckGate** — quad over the NW chain-link gate / drive.
- **dropYards** — two clusters of angled trailer rows east of the building (~50-60 trailers visible, capacity ~80). dropYard=true, dropArea 50+.
- **dockAprons** — long thin quads along the east wall and the south/SW canopy dock face.
- **staging** — large paved apron between the east docks and the drop yards (postGateStaging=true; drivewayLong — gate-to-dock approach holds 3+ trucks).
- **railServed = false** — no rail spur into the property.

## Web findings
Founded 1978; single-source supplier of Kroger private-label peanut butter and related goods; >8M lbs/month; ~part of Kroger's manufacturing network. High inbound (peanuts/ingredients) + outbound (finished goods to Kroger DCs) freight, consistent with the large on-site drop yards.

## Classification rationale (notable flags)
- urbanRural = **Rural** — edge of Albany; residential to the west, open fields/woods around; small-town industrial.
- fastLaneOpportunity = **true** — wide gravel gate apron and large internal yard width to add an express/bypass lane.
- entryExitTogether = **true** — single gate for in/out; entryLanes/exitLanes = 1 each.
- buildingCount = 3 (plant + north annex + warehouse), but multipleFacilities=false (single integrated plant, not a campus of separate large clusters).
- connectivityIssue = false (within Albany city limits, coverage expected fine).

## Final confidence: HIGH
Facility positively identified by name on building. Gate, fencing, docks, and drop yards all directly observed. Uncertain: exact dock-door count and ship/rcv separation.
