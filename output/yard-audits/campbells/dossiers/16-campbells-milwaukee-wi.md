# Deep-Audit Dossier — idx 16 — Campbell's - Milwaukee WI

## Facility
- **Name:** Campbell's - Milwaukee WI
- **Type:** Manufacturing - spice production (Campbell Soup Supply Co., LLC)
- **Roster address:** 445 South 32nd Street, Milwaukee, WI 53215 — **incorrect**
- **Resolved address:** 500 W Edgerton Avenue, Milwaukee, WI 53207
- **Locked coordinates:** 42.9525, -87.9182

## Step 0 — Location resolution
The roster coordinates (43.023446, -87.953873, geocoded "movedMeters: 0" for
"445 South 32nd Street") land in a dense residential neighborhood with no
industrial plant — the roster address is wrong. Web research identified the
Campbell's Milwaukee facility as the **Campbell Soup Supply Co. spice plant at
500 W Edgerton Avenue**, operating since 1966 as Campbell's only US spice
operation supplying its thermal plants. OpenStreetMap confirms the company and
building at 42.95258, -87.91817 ("Campbell Soup Supply Company, 500 West
Edgerton Avenue"). Satellite probing confirmed a brick/white industrial
building with heavy rooftop process equipment (silos/tanks) — consistent with
a spice processing plant. Locked center 42.9525, -87.9182.

## Key views
- **z18 site overview** — single brick/white plant building, large paved W-side
  truck yard with a small NW outbuilding and silos, employee parking lot to the
  SW, landscaped front lawn facing W Edgerton Ave.
- **z19/z20 W yard** — paved process/maneuvering yard; no parked trailers.
- **Street View (2025-03)** — brick building with red trim, silos, an overhead
  "TM TRUCK" loading door on the W face; chain-link perimeter fence along the
  W Edgerton frontage; a single driveway entrance with STOP/wrong-way signage.
- **z21 driveway throat** — wide open driveway from W Edgerton; no barrier arm
  or closed gate panel visible.

## Gate / guard-shack / dock determinations
- **truckGate: FALSE (medium confidence)** — The property is enclosed by
  chain-link perimeter fencing, but the single entrance driveway from W Edgerton
  Ave is open: no barrier arm, no closed sliding/swing gate panel, no checkpoint
  pinch-point with lane markings. Per rubric an open driveway = false. Noted:
  the perimeter fence gives a controlled feel; a swing gate held open cannot be
  ruled out from imagery.
- **guardShack: FALSE** — No booth structure at the entrance.
- **remoteGs: FALSE** — No gate, so no remote check-in implied.
- **Dock doors:** Modest loading on the W building face — a prominent "TM TRUCK"
  overhead door and adjacent doors; estimated 4-8 -> **"0-10"** band. This is a
  specialized spice plant, not a high-volume distribution facility.
- **Drop area:** No marked trailer stalls with parked trailers. **"NONE"**;
  dropYard false.

## Yard zones and counts
- **perimeter:** building + W truck yard + SW parking + front lawn — ~7.5 acres.
- **truckGate zone:** the open SW driveway connection to W Edgerton Ave.
- **dropYards:** none.
- **dockAprons:** the W-side paved yard fronting the loading doors.
- **dockDoorCount ~6, trailersVisible ~1, trailerParkingCapacity ~6,
  truckGateCount 1, buildingCount 1, railServed false.**

## Web findings
- BizTimes / Food Dive: Campbell's consolidated spice production at the
  Milwaukee plant; refurbished it to remain in Milwaukee. The 500 W Edgerton Ave
  facility is Campbell's only US spice operation, opened 1966.
- The building sits in a dense industrial district immediately west of General
  Mitchell International Airport.

## Final confidence
**Medium.** Facility identity is solid (OSM-confirmed company + address, plus a
matching spice-plant satellite signature). The gate call (FALSE) is medium
confidence — perimeter fence present but the driveway reads as ungated. Dock
counts are honest estimates from a specialized, modest-throughput plant.
