# Deep-Audit Dossier — Publix Refrigerated DC, Orlando FL (idx 06)

- **Facility:** Publix Refrigerated DC Orlando FL (Lee Vista)
- **Type:** Refrigerated Distribution Center
- **Address:** 7350 Hazeltine National Dr, Orlando, FL 32822
- **Confirmed center:** 28.45565, -81.28175
- **Maps (satellite):** https://www.google.com/maps/@28.45565,-81.28175,400m/data=!3m1!1e3
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

---

## Step 0 — Location confirmation

The roster supplied GEOMETRIC_CENTER coordinates (28.455671, -81.279716), which
landed just NE of the actual building. Wide satellite (z15/z16) around that point
revealed one unmistakable candidate: a very large two-mass warehouse complex
oriented ~30-35° off north, ringed by a private loop road and retention ponds,
sitting just east of SR-417 in the Lee Vista / Orlando International Airport
industrial corridor.

Web research locks it in: Whiting-Turner's project page describes the **Publix
Refrigerated Distribution Center** here as a ~120-acre campus, nine buildings,
~1,000,000 SF total, anchored by a **720,000 SF refrigerated main warehouse**
served by a **central ammonia refrigeration plant** holding -20°F to 55°F, within
nine miles of MCO. Yelp / Waze / Chamber listings confirm the 7350 Hazeltine
National Dr address, 24/7 operation, phone (407) 203-2600, and overnight driver
parking. Corrected building center: **28.45565, -81.28175**.

## Steps 1-3 — What the key views showed

- **Wide / campus (z15-z17):** single fenced parcel; main refrigerated warehouse
  (two connected masses) with continuous dock banks down the long west face,
  employee parking and an office/lobby plaza on the NE, a dedicated trailer
  drop-yard block to the SE, and retention ponds wrapping S, W and NW. One
  landscaped entrance boulevard enters from the NE off Hazeltine National Dr.
- **West perimeter (Street View, pano 2ARGANYJSJybj67KqsG7CQ, heading 217°,
  captured 2026-03):** a tall **black ornamental steel security fence** runs the
  property line with yellow bollards; palms, the office building and warehouse
  sit behind it. Confirms the campus is **fully fenced**.
- **Entrance boulevard (Street View, pano jFRJNyVIzq81PddqrXV-WQ, heading 237°):**
  Street View **cannot enter** the property; the truck approach is screened by a
  hedge/landscaped berm with bollards and a checkpoint pinch-point. Private,
  controlled access.
- **Gate / office plaza (satellite z19-z21):** the boulevard splits — cars peel
  off to employee parking and the canopied office lobby; trucks continue past a
  checkpoint into the secured operational yard.
- **Dock face (z18-z20):** a long continuous bank of dock doors with trailers
  backed in along the ~700 ft west wall, plus dock rhythm on adjoining faces.
- **Drop yard (z18-z20):** marked trailer rows on the west apron and a second
  drop block to the SE; consistent with advertised overnight driver parking.

## Steps 4 — Web findings

- Whiting-Turner project page: ~120-acre campus, 9 buildings, ~1M SF, 720k SF
  refrigerated main warehouse, central ammonia refrigeration plant (-20°F-55°F).
- Driver reviews of this DC reference a staffed **guard station**
  ("nice guys at guard station"), nice overnight parking, clean restrooms, and
  variable unload wait times. Yelp/Waze/Chamber confirm address, 24/7 hours.

## Step 5 — Classification calls (key evidence)

- **truckGate = true.** Single landscaped entrance boulevard into a fully-fenced
  campus; Street View cannot enter; screened checkpoint approach. Controlled
  gated entry.
- **guardShack = true.** Driver reviews explicitly cite a manned "guard station"
  at this DC. (remoteGs = false accordingly.) The booth itself is obscured by
  landscaping in overhead imagery, so its exact footprint is inferred from the
  driver evidence rather than directly traced.
- **dockDoors = "50+".** West face alone is dozens of doors across a ~700 ft wall
  with trailers backed in; additional banks on adjoining faces.
- **dropArea = "50+" / dropYard = true.** Extensive trailer rows on the west apron
  and a separate SE drop block; overnight driver parking advertised.
- **postGateStaging = true, drivewayLong = true.** Large internal paved yard
  between gate/office plaza and the dock face holds a 3+ truck queue.
- **fastLaneOpportunity = true.** Wide boulevard + palm median + ample gate apron
  width leave room for an express/bypass lane.
- **multipleFacilities = true.** Main warehouse + central refrigeration plant +
  ancillary buildings (9-building campus).
- **shipRcvSeparate = true (uncertain).** Dock banks on multiple faces suggest
  split inbound/outbound; not visually pinned, flagged uncertain.
- **urbanRural = "Urban".** Dense Lee Vista / MCO metro industrial fabric.
- **scale = false, multiStep = false, railServed = false.** No truck scale, no
  visible second checkpoint stage, no rail spur.
- **entryLanes ≈ 2, exitLanes ≈ 1 (uncertain).** Estimated from boulevard/apron
  width through landscaping.

## Step 6 — Yard zones & metrics

- **perimeter:** 6-vertex oriented ring tracing the fenced/paved operational core
  along the loop road and fence line (rotated to the campus's ~30-35° axis).
- **truckGate:** small oriented quad at the boulevard checkpoint into the yard
  (~28.4558, -81.2802).
- **dropYards:** two oriented blocks — west apron rows + SE drop block, both
  aligned to the trailer rows.
- **dockApron:** long thin quad hugging the warehouse west dock wall at building
  angle.
- **staging:** internal post-gate holding quad between gate and docks.
- **streetViewMeta:** perimeter pano 2ARGANYJSJybj67KqsG7CQ @217°, truckGate pano
  jFRJNyVIzq81PddqrXV-WQ @237° — both OK coverage, headings aimed from pano toward
  each zone centroid.

| Metric | Value | Basis |
|---|---|---|
| dockDoorCount | ~110 | continuous west bank + adjoining faces (estimate) |
| trailersVisible | ~180 | count from z20/z21 imagery (estimate) |
| trailerParkingCapacity | ~320 | marked stalls + apron capacity (estimate) |
| truckGateCount | 1 | single boulevard entrance |
| buildingCount | 3 | main warehouse + refrig plant + ancillary (campus = 9 total) |
| siteAreaAcres | 72.4 | shoelace of fenced operational core; full campus ~120 ac |
| railServed | false | no rail spur into property |

Counts are honest overhead estimates, not exact figures.

## Final confidence

**high** — building positively identified and corroborated by the contractor's
own project page; perimeter fence, gated private access, and a manned guard
station confirmed via Street View and driver reviews; dock/drop scale clear in
imagery. Lower-confidence fields (entry/exit lane counts, ship-vs-rcv split,
scale, multiStep) are flagged in `uncertainFields`.
