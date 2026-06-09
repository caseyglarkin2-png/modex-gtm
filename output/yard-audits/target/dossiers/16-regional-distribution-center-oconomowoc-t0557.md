# Deep-Audit Dossier — Target RDC Oconomowoc (T0557)

- **Facility:** Target Regional Distribution Center Oconomowoc (T0557)
- **Type:** RDC (Regional Distribution Center)
- **Address:** 1100 E Valley Rd, Oconomowoc, WI 53066
- **Resolved center:** 43.0793, -88.4773
- **Geocoded input:** 43.080753, -88.479589 (landed on the NW employee-parking corner of the same site — shifted ~250 m SE to the true building/yard centroid)
- **Confidence:** medium (site identity HIGH; gate/guard-shack specifics genuinely ambiguous from imagery)
- **Method:** deep-audit (satellite z15-z21 + Street View along E Valley Rd, captured 2024-09)

## Site confirmation
WebSearch on "Target Distribution T0557 / 1100 E Valley Rd Oconomowoc" returns the Target
RDC (Waze, Target careers T0557, Oconomowoc Chamber, gmtoday 30th-anniversary article).
The facility opened May 31, 1994, was the 7th Target DC in the country, grew from 1.1M to
**1.5M sq ft**, employs ~1,100 FT, and services 84 stores across WI/IL/MI. Street View on
the south frontage shows a **red Target bullseye sign** on the lawn and the red Target dock
wall behind the trees — positive on-the-ground confirmation. The geocoded point was on the
NW employee lot of this same building, so the address is correct; I re-centered on the
building/yard mass.

## What the key views showed
- **Overview (z15/z16):** One contiguous mega-building (gray-roof main mass + white-roof
  east section), oriented nearly N-S (very slight rotation). A central E-W **cross-dock**
  bank with two long rows of trailers backed in on opposing faces. Massive trailer drop
  yard on the east/SE. Employee parking on the NW corner. E Valley Rd runs along the south.
- **Central dock (z19):** Dense rows of trailers backed to dock doors on both faces of the
  cross-dock, plus tractor-trailers staged in the yard. Clearly a 50+ door cross-dock RDC.
- **East face + drop yard (z18):** The east building face carries a long dock row; below it
  a dedicated trailer-storage lot packed with **hundreds of trailers** in dense rows — a
  true drop yard, separate from active dock staging.
- **West side (z18):** Perimeter road, a site water tower, dock face with trailers; a dirt
  pad to the NW (possible expansion). Lake/farmland beyond to the west.
- **South frontage Street View (multiple panos, 2024-09):** Continuous landscaped lawn +
  conifer screen along E Valley Rd, with paved driveway breaks. Office/visitor parking sits
  behind the tree screen on the SE. No gate or booth fronts the public road here.

## Gate / Guard-shack / Remote determinations  (rigor focus)
- **truckGate = FALSE (flagged uncertain).** Across z18-z21 satellite of every vehicular
  entrance and several Street-View passes spanning the full south frontage, I could **not**
  identify a barrier arm, sliding/swing gate, or a checkpoint pinch-point at the property
  line. Entrances are open paved driveways cut through a landscape buffer. Per the rubric
  ("open driveway with no control = false") I scored it false. Caveat: a secured 1.5M sq ft
  Target RDC plausibly operates a manned/internal truck checkpoint that this imagery
  (treed buffer, no curbside Street View of the truck yard) simply does not resolve — hence
  medium confidence and the field flagged in `uncertainFields`.
- **guardShack = FALSE.** No small multi-window booth (1-3 vehicle footprint) appears beside
  any lane in any high-zoom crop.
- **remoteGs = FALSE.** remoteGs is true only when a gate exists without a booth; since no
  gate was positively identified, remoteGs is false.

## Yard zones & counts (estimates from overhead imagery)
- **Perimeter:** ~500 m (N-S) x ~430 m (E-W) rectangle, nearly north-aligned, traced inside
  the fence/landscape line. **~53 acres.**
- **Drop yard:** one large lot on the east/SE, hundreds of parked trailers → `dropArea` 50+,
  `dropYard = true`. Capacity ~400.
- **Dock aprons:** two long thin quads hugging the N and S faces of the central cross-dock.
- **Dock doors:** 50+ band; ~120 estimated across the cross-dock (both faces) + east face.
- **Truck gate zone:** the SE driveway break onto E Valley Rd (open; no booth).
- **Buildings:** 1. **Rail-served:** no spur into the property visible. **Scale:** none seen.

## Street View
Confirmed pano `KQ1IRr57y1yuED4jGBAT1g` @ 43.07673, -88.47746 on E Valley Rd (2024-09),
facing ~north toward the site — the driver's arrival frame. Used for both perimeter
(heading 357) and truckGate (heading 0) zones.

## Web findings
1.5M sq ft, opened 1994, ~1,100 FT employees, 84 stores served (WI/IL/MI); active inbound/
outbound semi traffic with the Target bullseye. Sources: gmtoday 30th-anniversary article,
Target careers T0557 posting, Oconomowoc Area Chamber, Waze/TruckMap listings.

## Final confidence
**Medium.** Facility identity, scale, cross-dock layout, dock-door band, and drop-yard are
all high-confidence from imagery + web. Gate/guard-shack/remote and ship-rcv-separate are
inferred under partial visibility (treed buffer blocks a clean ground view of the truck
entrance) and are flagged uncertain.
