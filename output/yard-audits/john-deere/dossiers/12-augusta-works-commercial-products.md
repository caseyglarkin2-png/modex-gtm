# Deep-Audit Dossier — John Deere Augusta Works / Commercial Products (idx 12)

**Facility:** John Deere Augusta Works (Commercial Products) — Grovetown, GA
**Type:** Assembly Plant (compact + utility tractors — 1/2/3/4/5 Family)
**Address:** 234 John Deere Pkwy, Grovetown, GA 30813 (web sources also cite 700 Horizon South Pkwy)
**Resolved center:** 33.463818, -82.185545
**Confidence:** Medium

## Location confirmation (Step 0)
The roster geocode (ROOFTOP, moved 2334 m) landed directly on a large white-roofed
manufacturing building with extensive paved trailer yards in an industrial park on the
west edge of Grovetown, GA. Web research confirms this is John Deere Augusta Works /
Commercial Products — a ~400,000+ sq ft plant on ~175 acres, ~470 employees, John
Deere's highest-volume tractor facility, producing 27 models of compact/utility
tractors. Coordinates locked at the supplied point.

## Key views
- **Context (z16):** Large industrial park; the Deere plant is the dominant white-roof
  complex with surrounding trailer lots.
- **Wide (z17):** Main building plus a separate NW building; enormous paved yards full
  of staged tractors/equipment and parked trailers.
- **SW / W yards (z18/z20):** Dense rows of 80-100+ parked trailers and large staged-
  equipment lots — a major trailer drop yard, fenced with a tree-buffer perimeter.
- **W / S building faces (z19/z20):** Long dock banks with trailers backed in along
  both the west and south faces; a small tan-roofed yard structure present.
- **NE / E (z18):** Employee parking lots and the office front (brick/light building at
  the SE corner) with a visitor entrance loop.
- **Street View (2022/2024):** Coverage limited to the office/employee parking loop;
  truck-yard entrance is set deep behind tree buffers, not directly viewable.

## Gate / guard-shack / dock determinations
- **truckGate = true (inferred).** The operational yard is enclosed by a continuous
  perimeter fence and tree-buffer screening; trucks reach it via a single internal
  route off the John Deere Pkwy / Horizon South Pkwy access loop. A controlled
  checkpoint is inferred; the specific barrier hardware is not resolvable in imagery.
- **guardShack = false / uncertain.** No guard booth was positively confirmed at a
  barrier-arm gate. Street View only covers the office loop; the truck entrance is
  hidden behind trees. A staffed entrance is plausible for a plant of this scale but
  could not be verified — flagged in uncertainFields. remoteGs set true tentatively.
- **dockDoors = "25-50".** Dock banks along the west and south faces of the main
  building plus the NW building; estimated 25-50 total (low confidence — flagged).
- **dropArea = "50+".** One of the largest drop yards in the batch — 80-100+ trailers.
- **shipRcvSeparate = true.** Dock clusters on physically separate building faces.

## Yard zones and counts
- **Perimeter:** ~175 acres (web-confirmed site area); irregular parcel with woodland
  and other industrial lots around it.
- **Truck gate:** single inferred controlled entrance off the access loop.
- **Drop yards:** large SW/W trailer lots; ~150 trailer parking capacity.
- **Dock aprons:** west face and south face of the main building.
- **Staging:** large paved internal yard between gate and docks.
- **Metrics:** ~45 dock doors (est.), ~95 trailers visible, ~150 capacity, 1 truck
  gate, 2 buildings, ~175 acres, no rail spur.

## Web findings
Augusta Metro Chamber and Columbia County development sources confirm: highest-volume
John Deere production facility, 27 tractor models, ~400,000+ sq ft, ~175 acres, ~470
employees, products exported to 40+ countries. First unit produced 1990; one-millionth
tractor milestone reached at this plant.

## Final confidence
**Medium.** Facility unambiguously identified and the truck-yard layout (fenced
perimeter, large drop yard, multi-face docks) is clear. The truck gate is inferred
with confidence from the fence line, but the presence/absence of a guard shack could
not be positively confirmed from imagery — the main reason confidence is Medium rather
than High. guardShack, remoteGs, and dockDoorCount are flagged in uncertainFields.
