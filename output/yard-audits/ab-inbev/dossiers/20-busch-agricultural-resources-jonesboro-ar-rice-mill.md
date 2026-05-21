# Deep-Audit Dossier — idx 20

## Busch Agricultural Resources - Jonesboro AR Rice Mill

**Type:** Agricultural Processing - Rice Mill
**Account:** AB InBev (`ab-inbev`)
**Resolved coords:** 35.8748, -90.6005
**Address:** 3723 County Road 905, Jonesboro, AR 72401

## Step 0 — Facility confirmation

The roster supplied coordinates 35.874511, -90.599126 with a flagged 12,325 m
geocode "move" — suggesting possible imprecision. The Arkansas DEQ Permit Data
System facility record (AFIN 16-00104, "BUSCH AGR RESOURCES, LLC", 3723 CR 905)
reports lat 35.874178, lng -90.601151 — essentially the same spot as the roster
point, confirming the roster coordinates are correct (the "move" was a
geocoding artifact). Probed satellite there and found a grain/rice milling
facility with processing buildings, a large grain silo bank, and a rail siding
— consistent with the facility type. Positively identified; center re-set on
the facility mass at ~35.8748, -90.6005. Federal grain warehouse records list
it as "Jonesboro Rice Mill Elevator", 1,066,000-bushel capacity, 50-99
employees, milling and shipping on Hwy 49.

## Key views

- **Wide satellite (z16-17):** Rice mill in open Arkansas farmland (rice
  country) between US-49/Hwy 49 + a rail line on the west and County Road 905
  on the east.
- **Mill complex (z18-20):** Main processing building, a large bank of round
  grain storage silos/bins, additional storage buildings, conveyors, and a
  truck loadout. Open-top hopper grain trucks observed being loaded.
- **Rail (z19):** A rail siding runs along the west/SW of the property
  parallel to Hwy 49 — a string of covered hopper rail cars is parked on it
  adjacent to the mill. Facility is rail-served.
- **CR 905 entrances (Street View Dec 2024):** Two open driveways onto County
  Road 905 — a south entrance into the mill/loadout yard and a north entrance
  to the office. Both are wide gravel/paved entrances. The truck entrance has
  only loose orange jersey barriers near the apron (traffic-channeling), no
  barrier arm, no gate, no guard booth.
- **Office area (z19):** A separate office building with parking near the
  north driveway.

## Gate / guard-shack / dock determinations

- **truckGate: false.** Both CR 905 driveways are open with no access-control
  structure; Street View confirms loose jersey barriers only, no gate.
- **guardShack: false.** No staffed booth at either entrance.
- **remoteGs: false.** No gate, so no remote check-in.
- **scale: true (flagged).** Rice mills receive inbound grain by truck and a
  truck scale is operationally expected; a small structure + rectangular pad
  near the loadout are consistent with a scale/scale house but could not be
  confirmed unambiguously from imagery.
- **dockDoors: "0-10".** Not a dock-door distribution facility — bulk grain
  loadout via spouts plus a few building doors (~4).
- **dropArea: "0-10" / dropYard: false.** A few grain trucks park in the yard;
  no dedicated marked trailer drop lot.
- **railServed: true.** Confirmed rail siding with hopper cars.

## Yard zones and counts

- **Perimeter:** ~36-acre developed campus, roughly 360 m (E-W) x 400 m (N-S).
- **Truck gate zone:** the open south driveway off CR 905.
- **Staging:** the large open mill yard between the CR 905 entrance and the
  loadout — ample room to queue trucks.
- **dockDoorCount:** ~4 · **trailersVisible:** ~4 · **trailerParkingCapacity:**
  ~15 · **truckGateCount:** 2 · **buildingCount:** ~6 (mill, silo bank, storage
  buildings, office, outbuildings) · **siteAreaAcres:** ~36 · **railServed:**
  true.

## Web findings

Busch Agricultural Resources (BARI), an Anheuser-Busch subsidiary, operates the
Jonesboro Rice Mill at 3723 CR 905 — a rice mill/grain elevator with 1,066,000
bushels of federally-licensed storage, ~50-99 employees, milling ~2.6M lbs/day
of rice. The mill took a direct tornado hit in 2020 and resumed operation.
Active facility. Arkansas DEQ permits the site (AFIN 16-00104).

## Final confidence

**high.** Facility positively identified and confirmed via Arkansas DEQ
records, imagery clear at zoom 19-20, gate/guard determinations corroborated by
Dec 2024 Street View, rail service confirmed. The truck-scale call and
dock/door counts carry minor uncertainty (flagged).

### 3-line summary
- Gate verdict: NO truck gate — open CR 905 driveways, jersey barriers only.
- Guard-shack verdict: NO guard shack.
- Confidence: high.
