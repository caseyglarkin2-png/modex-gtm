# Westrock Coffee — Concord, NC Roasting & Extract Campus, S&D legacy (idx 5)

**Address:** 300 Concord Parkway South, Concord, NC 28027
**Resolved coordinates:** 35.396271, -80.614895
**Confidence:** medium

## Resolved location
The roster geocode (ROOFTOP, moved 90 m) lands on the correct building cluster.
Web search confirms S&D Coffee & Tea / Westrock Coffee at 300 Concord Parkway
South, Concord NC — the legacy S&D headquarters and primary custom-roasting and
iced-tea/extract complex, in operation since 1927 and acquired by Westrock
Coffee. CoPack Connect, Dun & Bradstreet, Encyclopedia.com and Panjiva buyer
records all tie 300 Concord Parkway South to S&D Coffee roasting operations.

The site is the large multi-building industrial campus on the NW side of
Concord Parkway South. It is distinguished from the unrelated big-box retail
and car dealership on the opposite (SE) side of the parkway, and from idx 6
(101 Commercial Park Dr SW, ~0.4 mi SW — a separate building).

## Key views
- **Satellite z17:** A campus of ~4 large connected/adjacent buildings between
  Concord Parkway South and a wooded edge, with a big employee parking field on
  the east side and apartment complexes to the west.
- **Satellite z19/z20 (NW offset):** A long dock apron runs along the NE face of
  the north building with a row of trailers backed in; a curved private drive
  loops in from the parkway.
- **Satellite z20 dock-bank close-up:** ~14 distinct trailer/dock positions
  visible along that one apron with a tractor actively maneuvering — a clearly
  high-throughput dock face. Additional bays exist around the building cluster.
- **Street View (Concord Pkwy S frontage, 2017 / 2026):** Shows the campus
  building corner and rental-truck parking; the across-road side is a car
  dealership and U-Haul outlet (unrelated). The actual truck-yard entrance on
  the private campus drive is not directly covered by an on-yard pano.

## Gate / guard-shack / dock determinations
- **truckGate: false (uncertain)** — No barrier arm, sliding/swing gate, or
  marked checkpoint pinch-point is visible in overhead imagery at the truck-yard
  entrance off the campus drive; the yard aprons are wide and open. Street View
  does not place a pano exactly at the yard gate, so this is flagged uncertain —
  but nothing in the imagery indicates a controlled gate.
- **guardShack: false** — No small staffed booth visible at the entrance or
  along the campus drive.
- **remoteGs: false** — No gate identified, so no remote check-in.
- **dockDoors: "10-25"** — ~14 dock positions on the NE apron alone, ~22
  estimated campus-wide. Multi-building layout makes an exact total uncertain.
- **dropArea: "10-25"** — A trailer-parking yard sits NW of the active dock
  apron, holding trailers separate from dock staging.

## Yard zones and counts
- **Perimeter:** ~23 acres — the 4-building campus plus dock aprons, drop yard
  and employee parking, bounded by Concord Parkway South and the wooded edge.
- **Drop yard:** one area NW of the dock apron (dropYard: true).
- **Dock apron:** the long NE-face apron of the north building.
- **Staging:** generous interior paved yard between entrance and docks
  (postGateStaging: true).
- **Building count:** ~4 (multipleFacilities: true). **Rail:** none.
  **Scale:** none.
- Entry/exit share the campus drive; the gate-to-dock approach is long (3+
  trucks). Wide aprons leave room for a fast/express lane.

## Web findings
S&D Coffee & Tea — founded 1927, headquartered Concord NC; nation's largest
custom coffee roaster and largest foodservice iced-tea blender; ~650 employees
at this location; roasts on the order of 275,000 lb of beans per day
historically. Acquired by and now operating as Westrock Coffee. Sources:
CoPack Connect, Dun & Bradstreet, Encyclopedia.com, Panjiva.

## Final confidence
**Medium.** Location and campus identity are unambiguous and well corroborated,
and the dock/drop-yard layout is clear from satellite. The gate verdict relies
on overhead imagery because no Street View pano sits at the truck-yard entrance
itself — hence truckGate is flagged uncertain and overall confidence is medium.
