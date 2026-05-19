# Deep-Audit Dossier — Cincinnati Brewery, Cincinnati OH

**Account:** The Boston Beer Company · **Roster idx:** 2
**Address:** 1625 Central Parkway, Cincinnati, OH 45214 (Over-the-Rhine)
**Locked center:** 39.1140, -84.5226
**Confidence:** High

## Location confirmation
The roster's ROOFTOP geocode (39.114319, -84.522324) landed directly on the
brewery complex. Satellite probing (z17-z20) confirmed a dense industrial
complex with extensive brewing process equipment, tank/silo clusters, and
multi-story manufacturing buildings — the unmistakable signature of a production
brewery. Web research confirms 1625 Central Parkway is the former Schoenling /
Hudepohl-Schoenling plant, acquired by Boston Beer in 1997 and operated as the
Samuel Adams Cincinnati Brewery; the company invested $85M in 2020 to quadruple
canning capacity. The attached taproom is at 1727 Logan St on the same block.

## Key views
- **Wide (z17-z18):** Brewery occupies roughly two city blocks bounded by
  Central Parkway on the south. Surrounding fabric is dense urban Over-the-Rhine.
- **Tank/process (z19-z20):** Heavy concentration of fermentation tanks, bright
  tanks, and process equipment across the rooftops — a working brewery.
- **NW trailer yard (z19-z20):** A large open paved lot with rows of parked
  trailers (multiple carriers) — the brewery's drop yard.
- **Street View (2024, Logan St and side streets):** Trailers backed against the
  brewery building dock faces; tractors and trailers staged in open paved lots;
  no fencing or gate at the brewery's own dock yards. A red barrier was visible
  far down one side street but does not control the brewery's dock access.

## Gate / guard-shack / dock determinations
- **Truck gate: FALSE.** The brewery's dock yards and trailer lot open directly
  onto Over-the-Rhine city streets with no barrier arm, sliding gate, or
  checkpoint. Flagged in uncertainFields — one distant red barrier was seen on a
  side street, but it does not control the brewery's truck access.
- **Guard shack: FALSE.** No guard booth at any yard entrance in 2024 Street
  View imagery.
- **remoteGs: FALSE** — no gate, so no remote check-in.
- **backupSensitive: TRUE.** Classic tight urban site: trucks back into dock
  doors directly off narrow city streets, and a queue would spill onto public
  streets. The 2020 $85M project explicitly funded "new routes for trucks when
  on-site," confirming truck geometry is a known constraint here.
- **Docks:** ~16 dock doors estimated along the building faces fronting the
  trailer yard (band 10-25). Not split into clearly separate ship/receive
  clusters.
- **drivewayShort: TRUE** — trucks come straight off city streets into short
  dock aprons; no deep internal approach.

## Yard zones & counts
- **Perimeter:** ~15.7 acres (urban two-block complex).
- **Drop yard:** one open paved trailer-storage lot on the NW side; dropArea
  band 10-25, dropYard TRUE.
- **Dock apron:** along the building faces on the NW/west side.
- **Trailers visible:** ~22; capacity ~35.
- **Buildings:** 5+ (brewhouse, canning building, tank structures, taproom
  block) -> multipleFacilities TRUE.
- **Rail-served:** FALSE — urban infill, no rail spur.
- **Scale:** none visible.

## Web findings
WCPO and REDI Cincinnati confirm the $85M canning expansion (2020) that
quadrupled canning capacity and funded new on-site truck routes plus new
employee/visitor parking. No driver reviews documenting a guard shack or gated
check-in — consistent with the open, street-accessed urban yard layout observed.

## Final confidence
**High** on identification and the urban-brewery archetype. truckGate and
guardShack are flagged in uncertainFields because Street View, while clear, may
not capture every yard approach — but the consistent open-lot layout strongly
supports an ungated, no-guard-shack site. Dock and trailer counts are honest
overhead estimates.
