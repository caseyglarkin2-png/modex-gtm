# Deep-Audit Dossier — Honda Manufacturing of Indiana (HMIN), Greensburg IN

**Roster idx:** 6
**Type:** Auto Assembly Plant
**Address:** 2755 North Michigan Avenue, Greensburg, IN 47240
**Resolved center:** 39.36800, -85.54100 (centroid of the main assembly building)
**Confidence:** medium

## Location confirmation
The roster pin (39.370161, -85.543533) landed inside the plant's northern trailer
lots. Satellite probes z14-z19 confirmed the building: a vast auto assembly
campus in rural Decatur County, bounded by Interstate 74 to the north and
farmland on all other sides. A vehicle proving/test-track oval occupies the
southern half of the property — characteristic of an OEM auto assembly plant.
Web research (Greensburg Chamber, Wikipedia, Honda manufacturing.honda.com)
confirms HMIN / Indiana Auto Plant builds the Civic hatchback and CR-V at
~250,000 vehicles/yr, operating 24/7. The building center was relocated south to
39.3680, -85.5410.

## Key views
- **z14 full campus** — entire fenced property: central building cluster,
  test-track oval south, retention ponds, large laydown areas east. Surrounded
  by farmland; I-74 along the north edge.
- **z17 / z18 north face** — long continuous dock lines along the north faces of
  both main buildings with dozens of trailers backed in; massive organized
  trailer drop lots immediately north and east.
- **z19 dock line** — clean rhythm of dock doors with trailers backed in.
- **z18 SE of assembly building** — a rail spur with a string of rail cars runs
  into the property: site is rail-served.
- **z19 office** — white visitor/admin building with circular drive and large
  employee parking on the west — this is the *visitor* main entrance, not the
  truck gate.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Waze lists a dedicated "Truck entrance" at 2755 N
  Michigan Ave, distinct from the visitor "Main entrance." The campus is fully
  fenced and set ~400 m back from public roads behind a managed access corridor.
  High confidence the entrance is controlled.
- **guardShack = true (flagged uncertain).** The specific booth could not be
  imaged — available satellite crops did not resolve the truck gate structure
  and Street View pano coverage ends at the employee parking lot. A 24/7 OEM
  auto assembly plant of this scale invariably runs a staffed guarded truck
  gate; classified true on facility-class grounds and listed in uncertainFields.
- **remoteGs = false** — guard shack assumed present.
- **dockDoors = 50+** — long dock lines on the north faces of two large
  buildings; ~70 doors estimated.
- **dropArea = 50+ / dropYard = true** — multiple large drop lots with hundreds
  of trailers in organized rows plus covered trailer stalls.
- **shipRcvSeparate = true** — inbound parts docks (north faces) are physically
  separate from finished-vehicle outbound staging and rail loadout (south/SE).
- **postGateStaging = true** — broad internal paved aprons between the access
  corridor and the dock lines provide deep queuing room (drivewayLong = true).
- **multipleFacilities = true** — assembly building, adjacent logistics
  building, support structures, and a separate test track.
- **scale = false / multiStep = false** — no weigh platform or second
  checkpoint identified (flagged uncertain).

## Yard zones and counts
- **Perimeter:** full fenced property incl. test track ≈ 1480 acres.
- **Drop yards:** three large trailer-storage lots north and east of buildings.
- **Dock aprons:** two long apron strips along the north building faces.
- **Staging:** finished-vehicle / queue area south of the buildings.
- **Metrics:** ~70 dock doors, ~380 trailers visible, ~600 trailer capacity,
  1 truck gate, 6 buildings, rail-served = true. Counts are honest estimates
  from overhead imagery.

## Web findings
HMIN (Indiana Auto Plant) — Civic hatchback + CR-V, ~250k vehicles/yr, 24/7
operation. Logistics noted as favorable: rural location keeps roads clear for
inbound carriers (Greensburg Chamber / ExpeditedFreight). HLNA-served plant.

## Final confidence
**Medium** — building, scale, dock lines, drop yards and rail are unambiguous,
but the truck gate structure and guard booth could not be directly imaged
(Street View does not reach the truck entrance). Gate/guard calls are made on
strong facility-class evidence and flagged in uncertainFields.
