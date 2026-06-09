# Deep-Audit Dossier — 7-Eleven Combined Distribution Center, Salt Lake City UT (E.A. Sween)

- **idx:** 4
- **Type:** Combined Distribution Center (CDC) — refrigerated/dry, operated by E.A. Sween for 7-Eleven
- **Address:** 1172 South Swaner Road, Salt Lake City, UT 84104 (Glendale industrial district)
- **Resolved center:** 40.74408, -111.95258
- **Confidence:** High
- **Method:** deep-audit (satellite + Street View probe.ts, web research)

---

## Step 0 — Location confirmation

The supplied city-level coordinates (40.744129, -111.952622) landed inside a dense
industrial park west of I-15. To pin the exact building:

- Web research confirmed E.A. Sween operates a Salt Lake City Combined Distribution
  Center at **1172 South Swaner Rd, UT 84104** (easween.com locations; OysterLink
  company profile). E.A. Sween produces ready-to-eat sandwiches and runs distribution
  for 7-Eleven and other convenience stores.
- A LoopNet/CommercialSearch cluster of Swaner Rd addresses (1239, 1303, 1310, 1320 S)
  and a Google Maps pin for "1320 S Swaner Rd @40.74087,-111.952194" established that
  **Swaner Road runs due N–S at ~lng -111.9521**, with street numbers increasing
  southward — so 1172 S sits a little north of that cluster.
- **Nominatim** geocoded "1172 Swaner Road, Salt Lake City" to **40.7441475,
  -111.9520720** — exactly the building I was probing.
- Corroboration that this is the right operation: a **Penske Truck Leasing** record
  at 1172 Swaner Rd (Yelp) matches the on-site fleet-maintenance building, and
  Street View inside the yard shows reefer trailers, tractors, fleet service bays and
  a fuel island — an active distribution operation, not an office.
- Neighboring properties were explicitly excluded from the geofence: a lumber/concrete
  materials yard to the **west** (-111.9538) and a separate large gabled
  distribution/storage building to the **south** (~40.7427).

The given coordinates were essentially correct; refined center locked at
40.74408, -111.95258.

---

## Steps 1–3 — Satellite read

Wide (z16–z18) and tight (z19–z21) crops show a compact CDC:

- **Main distribution building** — white-roof structure, center-east of the property,
  with dock doors on its **west and south faces**; reefer trailers backed in along
  the west wall in a steady door rhythm.
- **Reefer-trailer drop yard** — the dominant feature: a large paved lot west of the
  building packed with tractors + reefer trailers in a fan/herringbone pattern.
  Trailer density is very high (well over 50).
- **Penske fleet-maintenance / office building** — adjoining the main building on the
  east, with open service bays and a fuel-island canopy to the north.
- **Employee parking** — between the buildings and Swaner Road (east edge).
- **South staging yard** — additional paved trailer/equipment staging at the south end.

**Dock doors:** counted ~22 across the west + south faces from z20–z21 imagery →
**10-25 band** (flagged as an estimate).

**Rail:** a rail line runs along the **far/east side of Swaner Road** serving a
neighboring materials yard. **No spur enters the E.A. Sween property** → railServed = false.

---

## Step 2 — Gate / guard-shack determination (Street View)

This was the decisive part of the audit. Findings:

- **Multiple Street View panos exist *inside* the truck yard** (e.g. pano
  `u3lvMh_ZOrLa2xYuXjdoVA` @ 40.74377,-111.95198 and `_pS_4fGUb6U5gIbuGy9Ghg`
  @ 40.74374,-111.95174, captured 2019-05/06). The Google car drove the interior
  freely — a hallmark of an **open, uncontrolled** facility.
- Frames looking back toward Swaner Road show the truck driveways **opening directly
  off the public road**: no barrier arm, no sliding/swing gate across the truck lane,
  no checkpoint pinch-point. Only a **low decorative chain-link fence with a hedge**
  along the employee-parking edge.
- **No guard booth** anywhere near the entrance — no small windowed 1–3-space
  structure beside a lane. The only small structures are the fleet **fuel-island
  canopy** and the **Penske maintenance building**, neither of which is a gatehouse.

**Verdict: truckGate = false, guardShack = false, remoteGs = false** (no gate means
no remote check-in either; no kiosk/call-box observed).

This matches the Jake's-Kraft `#3` "No Gate / No GS" archetype — driveway runs
straight from the public road into the yard/docks with no control structure.

---

## Step 6 — Geofences, zones & yard metrics

The SLC street grid is square to N–S/E–W and the buildings follow it, so the rings
are near axis-aligned (true corners traced, not a loose box).

- **perimeter** — full fenced property: NE 40.74482,-111.95158 → NW 40.74482,-111.95362
  → SW 40.74333,-111.95362 → SE 40.74333,-111.95158.
  ΔLat ≈ 161 m, ΔLng ≈ 173 m → **≈ 6.9 acres**.
- **truckGate** — the open south driveway throat off Swaner Road (employee-parking +
  truck access point).
- **dropYards** — the large reefer-trailer drop lot west of the building.
- **dockAprons** — two thin quads hugging the west dock wall and the south dock face.
- **staging** — south paved staging strip inside the property.
- **streetViewMeta** — both perimeter and truckGate point to the in-yard entrance
  panos (headings 304° / 298°), giving a real driver's-eye arrival frame.

**yardMetrics:** dockDoorCount 22 (est), trailersVisible ~70, trailerParkingCapacity
~90, truckGateCount 2 (open driveways), buildingCount 2, siteAreaAcres 6.9,
railServed false.

---

## Step 4 — Web findings

- E.A. Sween Company (founded 1955, privately held) produces ready-to-eat sandwiches
  and runs national distribution; this is its Salt Lake City CDC supplying 7-Eleven
  and other c-stores (easween.com, OysterLink, FSIS establishment listing).
- 1172 Swaner Rd is co-listed with a **Penske Truck Leasing** presence (Yelp),
  consistent with the on-site leased fleet + maintenance bays seen in imagery.
- Surrounding parcels are independent industrial users (building materials, cold
  storage, light manufacturing) typical of the Glendale 84104 zone.

---

## Classification summary

| Field | Value | Evidence |
|---|---|---|
| truckGate | false | Open driveways off Swaner Rd; SV car drove yard freely; no arm/gate/checkpoint |
| guardShack | false | No staffed booth; only fuel canopy + Penske shop |
| remoteGs | false | No gate => no remote check-in; no kiosk seen |
| postGateStaging | true | Large internal paved holding yard before docks |
| drivewayLong | true | Deep approach holds 3+ truck queue |
| entryExitTogether | true | Shared open driveways for in/out |
| dockDoors | 10-25 | ~22 doors across west + south faces |
| dropArea | 50+ | Dense reefer drop yard, 50+ trailers |
| dropYard | true | Dedicated on-site reefer storage lot |
| urbanRural | Urban | Dense SLC Glendale industrial fabric by I-15 |
| scale | false | No weigh pad in truck path |
| railServed | false | Rail serves neighbor across the road, no on-site spur |

**Final confidence: High** — facility positively identified, gate/guard determination
backed by multiple in-yard Street View panos plus satellite. Dock-door count and lane
counts are honest overhead estimates (flagged in uncertainFields).
