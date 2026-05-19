# Deep-Audit Dossier — Niagara Bottling, Ontario CA (idx 1)

## Resolved location
- **Address:** 5675 E Concours St, Ontario, CA 91764
- **Locked center:** 34.07480, -117.53200
- **Confirmation:** Roster coordinates landed at the building's SE corner. Satellite
  probes (z17-21) identified a white-roofed industrial building inside the dense
  Ontario industrial park. Street View of the building's south face shows the
  "niagara" company logo, positively confirming the building. Driver instructions
  from facility listings ("check in on foot at the south-side shipping office on
  Concours St") corroborate the building orientation.

## Setting
Dense Inland Empire (Ontario, CA) industrial park — block after block of large
distribution/manufacturing warehouses. Major metro fabric → **Urban**. Cellular
coverage is strong; no connectivity concern.

## Key views
- **Wide satellite (z17-18):** Niagara occupies a compact parcel relative to the
  giant neighboring warehouses. Building runs N-S; Concours St on the east face,
  a public road on the south.
- **West face (z20-21):** A row of ~12 canopied loading-dock positions facing a
  paved dock apron sandwiched between Niagara's building and the warehouse to
  its west.
- **South side (z20 + Street View):** Office frontage with "niagara" signage and
  employee parking; this is the shipping-office check-in side.
- **Dock apron inlet (z21):** The dock apron is fenced off from the employee
  parking lot, with a gate at the apron mouth.

## Gate / guard-shack / dock determinations
- **truckGate = true (medium confidence):** No barrier arm or checkpoint where the
  driveways meet the public road — those are open driveways through employee
  parking. However, the working truck dock apron on the west face is itself
  fenced and gated off from the parking lot. The controlled point is this
  internal apron gate, not a road-edge checkpoint.
- **guardShack = false:** No staffed booth visible anywhere — not at the road,
  not at the apron gate.
- **remoteGs = true:** With a gate but no guard shack, entry is via keypad /
  call-box / on-foot driver check-in at the south-side shipping office.
- **Docks:** ~12 canopied dock doors along the west face → band **10-25** (low end).
- **Drop yard:** None — no marked trailer-drop stalls; the apron only holds
  trailers actively at docks. `dropArea = NONE`, `dropYard = false`.

## Yard zones and counts
- **Perimeter:** ~9.5 acres — building, west dock apron, and south/west employee
  parking.
- **Dock apron:** one strip along the west building face.
- **Drop yards / staging:** none identified.
- **Dock doors:** ~12. **Trailers visible:** 0 in the captured imagery.
  **Trailer parking capacity:** ~8 (rough). **Truck gates:** 1. **Buildings:** 1.
  **Rail-served:** no. **Scale:** none.

## Web findings
Niagara Bottling LLC, 5675 E Concours St — beverage/bottled-water manufacturing,
~170 staff, ~$28.5M reported sales for this unit, open 24h. Driver instructions
direct check-in on foot at the south-side shipping office on Concours St, clean
trailers, doors open, 20,000 lb floor capacity.

## Final confidence
**Medium.** Building identity is certain (logo confirmed). The gate call is the
soft spot: there is no road-edge guarded checkpoint, only a fenced internal dock
apron — flagged in `uncertainFields`. Dock count is an overhead estimate.
