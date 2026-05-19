# Deep-Audit Dossier — GXO Logistics Distribution Center, Houston TX (Railwood)

**Roster idx:** 23
**Address:** 9255 Railwood Dr, Houston, TX 77078
**Type:** Distribution Center (large bulk distribution warehouse)
**Locked coordinates:** 29.82900, -95.25250
**Method:** deep-audit
**Confidence:** medium

## Location confirmation
The geocoded point (29.829072, -95.252448, GEOMETRIC_CENTER — lower precision)
falls in the Railwood industrial corridor of northeast Houston. Web research
(Evopra, Racklify, AWCO warehouse directories) confirms GXO Logistics operates a
3PL warehouse at 9255 Railwood Dr.

The Railwood corridor contains many industrial buildings, so the GXO building
was disambiguated by inspection: the building directly east is "Majestic Steel
USA" (logo confirmed in Street View) — ruled out. The GXO facility is the large
east–west bulk-distribution warehouse on the south side of Railwood Dr, with
docks on its north and south faces and a very large trailer drop yard on the
south side.

## Key views
- **Wide satellite (z15–17):** Dense industrial park. GXO building is a large
  white warehouse; immediately south is an extensive trailer marshalling yard
  (and beyond it a separate LTL-style cross-dock terminal).
- **Street View, Railwood Dr (multiple frames):** Continuous chain-link
  perimeter fence wraps the building; north dock face with tractors/trailers at
  the docks; building carries a distinctive maroon roof-line stripe.
- **Tight satellite (z20–21):** A small hipped-roof guard booth sits in the
  truck path on the south truck-court drive, between landscaped islands — a
  classic guarded entry. South dock face opens to the large drop yard.

## Gate / guard-shack / dock determinations
- **truckGate: true** — A chain-link perimeter fence encloses the building
  (confirmed in several Street View frames along Railwood Dr). A standalone
  gatehouse structure is positioned in the truck path at a pinch point on the
  south truck-court drive — a controlled, guarded entry.
- **guardShack: true** — The small hipped-roof structure straddling the truck
  lane (≈1–2 vehicle footprint, set beside the drive between landscaped islands)
  is a guard booth. A second small structure appears at the SW edge of the drop
  yard.
- **remoteGs: false** — a staffed guard booth is present, so not remote.
- **dockDoors: 50+** — very large warehouse with continuous dock banks on the
  north and south faces; ~130 doors estimated (low confidence on exact count).
- **dropArea: 50+** — a very large paved trailer marshalling/drop yard on the
  south side holds dozens of trailers parked without tractors.
- **dropYard: true** — dedicated trailer-storage yard.
- **shipRcvSeparate: true** — dock banks on opposite (north/south) faces.

## Yard zones and counts
- **perimeter:** GXO building plus its south drop yard — ~42.1 acres from the
  box.
- **truckGate:** the guard-booth pinch point on the south truck-court drive.
- **dropYards:** the large south-side trailer marshalling yard.
- **dockAprons:** north dock apron (off Railwood Dr) and south dock apron
  (facing the drop yard).
- **staging:** none distinct beyond the wide internal courts (postGateStaging).
- **dockDoorCount:** ~130 (estimate). **trailersVisible:** ~60 in captured
  imagery. **trailerParkingCapacity:** ~120. **truckGateCount:** 1 guarded
  entry. **buildingCount:** 1. **railServed:** false (no spur visibly enters
  the property despite the "Railwood" corridor name).

## Web findings
- Evopra, Racklify and AWCO warehouse directories list GXO Logistics as a 3PL
  warehouse operator at 9255 Railwood Dr, Houston, TX 77078.

## Final confidence
**Medium.** The building was identified from a lower-precision GEOMETRIC_CENTER
geocode and disambiguated from neighbors (Majestic Steel to the east); the south
trailer yard adjoins a separate LTL-style terminal, leaving the exact property
boundary and trailer/dock counts moderately uncertain. The gate and guard-shack
determinations are confident: a chain-link perimeter fence plus a standalone
guard booth in the south truck drive are clearly visible.
