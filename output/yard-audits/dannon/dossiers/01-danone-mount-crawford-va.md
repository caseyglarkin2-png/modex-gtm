# Deep-Audit Dossier — Danone, Mount Crawford VA (idx 01)

## Facility
- **Name:** Danone - Mount Crawford VA
- **Type:** Multi-category beverage plant (refrigerated) — Silk, International Delight, SToK, So Delicious, Horizon, Dunkin'
- **Address:** 6364 South Valley Pike, Mount Crawford, VA 22841
- **Resolved center:** 38.36880, -78.93980

## Step 0 — Location confirmation
The roster coordinate (38.36851, -78.939384, ROOFTOP) landed squarely on the plant.
Satellite probes at z16-z18 show a very large white industrial building with an
adjacent process-tank/silo farm, wastewater treatment ponds, employee parking, and
extensive trailer yards — consistent with the stated 640,000 sq ft / 97-acre largest
Danone NA facility. Street View along South Valley Pike confirms a "DANONE" monument
sign and flagpole at the east entrance. Identity confirmed; center locked at the plant
complex centroid 38.36880, -78.93980.

## Key views
- **z16/z17 overview:** Campus block bounded by South Valley Pike on the south, farmland
  to the west, a wooded buffer to the north, and an industrial-park access road to the
  east. Main plant, a separate west annex/DC building, tank farm, and treatment ponds.
- **z18 north view:** Massive rows of parked trailers along the west and north sides of
  the main building — a true drop-yard operation (estimated 200+ slots).
- **z20 west dock face:** A long dock apron with many trailers backed into the building;
  estimated 40-50 doors on this face alone.
- **West annex (z19):** A second building with its own dock face and trailer rows.

## Gate / guard-shack / dock determinations
- **Truck gate: FALSE.** Both road accesses off South Valley Pike are wide, open
  driveways. Street View at the east main entry (pano 38.36574,-78.93761) shows an open
  driveway with no barrier arm, no sliding/swing gate, and no checkpoint pinch-point —
  only directional signage ("ALL LIQUID AND OKARA RECEIVING" / "ALL COLD & DRY STORAGE
  RECEIVING OFF #1"). The presence of self-routing signage in lieu of a checkpoint
  confirms an ungated site.
- **Guard shack: FALSE.** No staffed booth (1-3-vehicle footprint, multi-side windows)
  at any entrance in Street View or satellite.
- **Remote GS: FALSE.** No gate present, so no remote check-in implied.
- **Docks:** West face of main building carries a long dock bank (~40-50 doors). The
  annex and the liquid/cold receiving areas add more. Total estimated ~60 doors → band
  **50+**. Shipping and receiving are physically separated — posted signs route liquid/
  okara receiving and cold/dry receiving to distinct dock areas → `shipRcvSeparate: true`.

## Yard zones and counts
- **Perimeter:** S 38.36590 / W -78.94280 / N 38.37240 / E -78.93680 — ≈ 723 m × 524 m,
  about 93 acres (stated 97 acres; the difference is wooded buffer at the property edge).
- **Drop yards:** three boxed areas — the west trailer rows, the north trailer rows, and
  a smaller staging area near the west annex. 50+ band, est. capacity ~220 trailers,
  ~180 visible in imagery.
- **Dock apron:** boxed the long west dock face of the main building.
- **Truck gate box:** the east main entry off South Valley Pike (open driveway, no
  structure).
- **Buildings:** main plant, west annex/DC, treatment building, plus tank-farm
  structures → `multipleFacilities: true`, buildingCount 4.
- **Rail:** none — no spur enters the property.
- **Scale:** none confirmed in imagery (listed uncertain).

## Web findings
Roster source corroborates: Danone's largest NA facility, 640,000 sq ft, 97 acres, 700+
employees. The June 2025 Jacksonville announcement also names Mount Crawford as a
production transfer destination for the closing Bridgeton NJ plant — consistent with a
high-throughput, expanding freight operation.

## Final assessment
- **Gate verdict:** No truck gate — open driveways, self-routed by signage.
- **Archetype:** No Gate / No GS, large multi-building campus with a major drop yard.
- **Confidence:** HIGH — rooftop geocode, clear satellite at all zooms, multiple
  Street View confirmations of the open entrances.
