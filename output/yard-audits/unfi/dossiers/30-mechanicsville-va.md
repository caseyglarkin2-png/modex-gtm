# UNFI — Mechanicsville VA DC (Richmond) — Yard Audit Dossier

**Roster idx:** 30
**Facility:** UNFI Mechanicsville Distribution Center (legacy Richfood / SuperValu, Richmond mid-Atlantic)
**Address:** 8258 Richfood Rd, Mechanicsville, VA 23116
**Locked coordinates:** 37.63407, -77.40284
**Confidence:** High

---

## Location resolution

The roster supplied city-level, APPROXIMATE coordinates (37.608756,
-77.373314). Web research resolved the precise address to **8258 Richfood Rd,
Mechanicsville, VA 23116** (Yellow Pages, Superpages, warehouse.ninja, a UNFI
hiring flyer). That address geocoded ROOFTOP to 37.63407, -77.40284 — landing
directly on a large multi-building distribution complex. The road name
"Richfood Rd" is itself the heritage tell: this is the legacy **Richfood /
SuperValu** conventional-grocery DC that came to UNFI through the SuperValu
acquisition. Locked center 37.63407, -77.40284.

---

## What the imagery showed

- **Overview (z16-17):** A very large multi-section warehouse complex with
  extensive trailer parking wrapping the **west, north, and east** sides. A
  separate building cluster sits to the south (fleet maintenance / fuel island).
  This is a campus, not a single building.
- **Trailer yards (z17-18):** Striped trailer drop yards on three sides, well
  over 100 trailers parked in the captured imagery — a heavy-throughput
  conventional-grocery DC.
- **Truck entrance (z19-20):** The main truck road off Richfood Rd / the south
  access road enters at a checkpoint — a **guard booth** with a lane canopy /
  island, multiple queue lanes, and a checkpoint apron is clearly visible.
- **South cluster (z17-19):** Separate maintenance/fuel buildings with their own
  paved areas and staged trailers; gives the campus its multi-building
  character.

---

## Gate / guard-shack / dock determinations

- **truckGate = true.** Controlled truck entrance: a checkpoint with queue lanes
  and a checkpoint apron where the truck road enters the property.
- **guardShack = true.** A small staffed booth sits at the entry checkpoint
  beside the inbound lanes (lane canopy/island visible at z20). `remoteGs` =
  false accordingly.
- **multipleFacilities = true.** A campus — the main multi-section warehouse
  plus the separate southern maintenance/fuel cluster and adjoining structures
  (4+ distinct buildings).
- **shipRcvSeparate = true.** Distinct dock banks on different building faces
  with trailer drop yards on the west, north and east — physically separated
  shipping and receiving clusters typical of a large conventional-grocery DC.
- **drivewayLong = true / preGateStaging = true / postGateStaging = true.** Deep
  approach; paved areas and staged trailers both outside (pre-gate) and inside
  (post-gate) the checkpoint.
- **fastLaneOpportunity = true.** Wide multi-lane entry apron with unused paved
  width.
- **dockDoors = "50+"** — dock banks on multiple faces; ~110 doors estimated.
- **dropArea = "50+" / dropYard = true** — extensive multi-side trailer drop
  yards.

---

## Yard zones and counts

- **Perimeter:** ~70-acre campus including the trailer yards.
- **truckGate zone:** the south checkpoint off the Richfood Rd access road.
- **dropYards:** three boxed zones — west, north, and east trailer storage.
- **dockAprons:** two boxed dock strips on separate building faces.
- **staging:** post-gate paved holding area between the checkpoint and the
  docks.
- **dockDoorCount ~110, trailersVisible ~130, capacity ~240, buildingCount 4,
  railServed false** (no rail spur into the property).
- **scale:** a weigh platform may exist near the maintenance/fuel cluster but is
  not unambiguous in imagery — left false, flagged uncertain.

---

## Web findings

UNFI Mechanicsville is a mid-Atlantic conventional-grocery DC inherited via the
SuperValu acquisition (the Richfood lineage). It serves the Richmond region and
sits squarely in the "legacy SuperValu yard" profile the Bushway dossier
describes — the generation of facilities running PINC/Kaleris-era yard tooling
and a candidate for UNFI's network-level yard modernization wedge.

---

## Final confidence

**High.** The facility is positively resolved by a precise street address
(8258 Richfood Rd) geocoded ROOFTOP onto the complex, and the gate, guard booth,
multi-building campus and multi-side trailer yards are all clearly visible.
Door/trailer counts are honest overhead estimates (flagged uncertain).
