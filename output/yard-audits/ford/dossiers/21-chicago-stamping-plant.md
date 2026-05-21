# Deep-Audit Dossier — idx 21

## Ford - Chicago Stamping Plant, Chicago Heights IL

**Type:** Stamping Plant
**Resolved coordinates:** 41.50315, -87.60230
**Confidence:** High

---

## Step 0 — Location resolution

The roster supplied `41.506099, -87.673466` ("RANGE_INTERPOLATED", movedMeters 3)
and address "1000 W Lincoln Hwy, Chicago Heights, IL". A satellite probe at that
point showed a **commercial/retail strip** on West Lincoln Hwy — not a stamping
plant. Web research corrected this: the Ford Chicago Stamping Plant is at
**1000 EAST Lincoln Hwy**, on the Chicago Heights / Ford Heights line, at
approximately **41.5028, -87.6014** (the roster coordinate was ~6 km too far
west, and the address had "W" where it should be "E").

A satellite probe at the corrected location showed an unmistakable large
industrial stamping complex: a ~2,040,000 sq ft connected building on a
136-acre Ford parcel, opened 1956, with extensive rail along its south edge —
fully consistent with a high-volume sheet-metal stamping plant. Locked the
building center at 41.50315, -87.60230.

## Key views

- **Wide satellite (z16):** Single massive rectangular plant building. North
  edge fronts Lincoln Hwy across a wide grass buffer; south edge is lined by
  multiple parallel rail tracks and a curving spur. Trailer drop yards on the
  SW and SE. Auto-salvage yard immediately to the west.
- **North frontage (Street View, 2019 & 2025):** Continuous chain-link
  perimeter fence along Lincoln Hwy; office face set back behind a landscaped
  lawn with the Ford script logo and flagpoles.
- **Main truck gate (~41.5060,-87.6014):** A driveway entering at a signalized
  4-way intersection. Chain-link gate across the drive; access-control signage
  reading "STOP / NO TRUCK ... ENTRY ... ACCESS ... ONLY". A small
  1-vehicle-footprint structure sits beside the driveway just inside the line.
- **Former west truck entrance (~41.5061,-87.6045):** A wide gap in the fence
  now blocked with concrete jersey barriers — a decommissioned entrance.
- **SE drop yard (Street View 2025):** ~40+ dry-van trailers parked in tidy
  rows behind chain-link fencing; dock doors with trailers backed in on the
  adjacent building face.
- **SW area:** Trailers parked amid heavy laydown storage (steel coil racks);
  rail spur curving into the property.
- **East side:** Chain-link fence, water tower and an electrical substation
  along East End Ave — no gate.

## Gate / guard-shack / dock determinations

- **truckGate = true.** One controlled entrance off Lincoln Hwy: a gate across
  the truck drive plus explicit truck-access-control signage. A second former
  truck entrance is barricaded shut.
- **guardShack = true (medium confidence).** A small structure with a
  ~1-vehicle footprint sits beside the gate driveway (z21 satellite + Street
  View). Footprint and placement fit a guard booth; resolution does not let me
  confirm multi-side glazing, so this is flagged uncertain.
- **remoteGs = false** (a booth is present).
- **dockDoors = "25-50".** Dock banks on the south and east building faces with
  trailers backed in; ~45 doors estimated — rooftop imagery obscures exact
  counts.
- **dropArea = "50+".** Two large drop yards (SW and SE) holding well over 50
  trailers combined.
- **shipRcvSeparate = true.** Dock activity is split between two distinct
  building faces (south and SE).
- **dropYard = true** — dedicated trailer-storage lots clearly present.
- **railServed = true.** Multiple parallel tracks and a spur run the full south
  boundary with railcars present — primary inbound steel-coil delivery.
- **drivewayShort / backupSensitive = true.** Gate sits close to a busy
  signalized intersection on the 5-lane Lincoln Hwy / US-30 corridor with
  little stacking depth.

## Yard zones and counts

- **Perimeter:** ~679 m (N-S) × ~917 m (E-W) ≈ **154 acres** of fenced
  operating area (Ford records cite 136 acres for the core parcel; my box
  includes the SW/SE drop yards and laydown).
- **dockDoorCount ≈ 45** (low confidence — split across two faces, rooftop
  obscures counts).
- **trailersVisible ≈ 70**, **trailerParkingCapacity ≈ 110**.
- **truckGateCount = 1** (one active; one barricaded).
- **buildingCount = 2** (main stamping building + gate/guard structure).
- **railServed = true.**

## Web findings

- Plant opened 1956; ~2,040,220 sq ft on a 136-acre site; ~900 employees.
- Stamps sheet metal for vehicles built in Chicago, Kansas City MO and St.
  Paul MN.
- Sources: AmericanAutoWorker location profile, EPA TRI/Superfund facility
  records, City of Chicago Ford fact sheet, Macrae's Blue Book.

## Final confidence

**High** on location, archetype and the gate/dock structure. Medium-confidence
items flagged in `uncertainFields`: guard-booth confirmation, exact lane counts
and dock-door count, multi-step.
