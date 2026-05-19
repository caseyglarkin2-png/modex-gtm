# Deep-Audit Dossier — idx 11

## KDP Beverage Concentrates Plant — St. Louis MO

**Type:** Manufacturing - Concentrates/Syrups
**Resolved location:** 8900 Page Ave, Overland, MO 63114 — `38.685300, -90.355900`
**Gate verdict:** No controlled truck gate · **Guard shack:** None · **Confidence:** High

## Location resolution
The roster entry gave 8400 N Broadway, St. Louis (38.7153, -90.2296). Step-0 satellite probes
showed that point sits in a residential/mixed-use stretch of north St. Louis city — no plant.
Web research (Yelp, Manta, Dun & Bradstreet, IndustryNet, whereorg) consistently identifies the
real facility as **Dr Pepper/Seven Up Manufacturing Company, 8900 Page Ave, Overland, MO 63114** —
KDP's beverage concentrate and syrup compounding plant (~165 employees, the company's principal
US concentrate manufacturing source). Geocoding placed 8900 Page Ave at a Schnucks-anchored
retail strip; cross-referencing a Google Maps coordinate citation (38.6855, -90.3555) and
satellite probes located the actual industrial plant immediately south of the Page Ave / I-170
interchange. Center locked at 38.6853, -90.3559.

## Key views
- **Wide (z17/z18):** Large white industrial building between Page Ave (north), I-170 (east),
  and a rail line (south). A construction/foundation site sits on a separate property to the west.
- **West face (z19/z20):** Dock apron with multiple trailers backed in; trailer parking along
  the internal access drive. Tanks/process equipment on the east wing.
- **SE / rail-side apron (z20):** A row of roughly 8-12 trailers backed into dock doors, with a
  rail spur running along the right edge.
- **South face (z20):** Building wall runs adjacent to a through rail line; rail cars seen at the
  SW corner. Additional dock doors on the south face.
- **Truck entrance (z21):** The plant's truck access is a private industrial drive off Page Ave
  on the NW. The junction shows only painted lane arrows — no barrier arm, no guard booth.

## Gate / guard-shack / dock determinations
- **truckGate = false:** The access point is an open industrial drive shared with the neighboring
  property; no barrier arm, sliding gate, or checkpoint pinch-point visible at the Page Ave junction.
- **guardShack = false:** No booth structure at the entrance or along the drive. Street View does
  not cover the private drive interior (flagged uncertain), but overhead imagery shows none.
- **remoteGs = false:** No gate, so no remote check-in inference.
- **dockDoors = "25-50":** Estimated ~32 doors total — SE/rail apron ~10-12, west face ~10-12,
  south face ~8. Exact count is approximate (flagged).
- **shipRcvSeparate = true:** Distinct dock banks on physically separate building faces.
- **dropYard = true / dropArea = "10-25":** Trailer parking lined up along the west access drive,
  separate from the active dock aprons.

## Yard zones and counts
- **Perimeter:** ~22 acres bounded by Page Ave (N), I-170 (E), the rail line (S), and the west
  access drive — derived from the locked center coordinate.
- **truckGate zone:** the Page Ave / access-drive junction at the NW.
- **dropYards:** one drop area along the west access drive.
- **dockAprons:** three — west face, SE/rail-side, and south face.
- **staging:** internal yard area between the access drive and the west/south docks.
- **yardMetrics:** ~32 dock doors, ~18 trailers visible, ~30 trailer capacity, 1 truck gate,
  2 buildings (main plant + east process wing), ~22 acres, rail-served.

## Web findings
- Dr Pepper/Seven Up Manufacturing — concentrate/syrup compounding; KDP's primary US concentrate
  source. ~165 employees, ~$151M reported sales (D&B/whereorg).
- Job postings describe chemical operators compounding concentrates, syrups, extracts, flavor
  blends, emulsions, and juice products — consistent with a bulk-ingredient, rail-served plant.

## Final confidence
**High.** Facility positively identified and the plant footprint, docks, rail, and access are
clearly visible in satellite imagery. Exact dock-door count and the absence of an internal guard
booth carry mild uncertainty (no Street View on the private drive) and are flagged.
