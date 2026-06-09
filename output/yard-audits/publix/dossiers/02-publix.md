# Deep-Audit Dossier — Publix Frozen DC, Lakeland FL (idx 2)

- **Facility:** Publix Frozen DC Lakeland FL (Frozen DC)
- **Roster address:** 3300 Airport Rd, Lakeland, FL 33811 (Publix Frozen Foods Warehouse, phone 863-688-1188)
- **Resolved center:** 28.0070, -82.0420
- **Confidence:** medium
- **Method:** deep-audit (satellite probe + Street View + web research)

## Step 0 — Locating the building

The roster coordinates (28.004224, -82.017896) are **wrong**: a z17 satellite probe at
that point showed a US-98 / Polk Parkway interchange with stormwater ponds and an
office-amenity parking lot northeast of Lakeland Linder Airport — no industrial building.

Web research resolved the Publix Frozen Foods Warehouse (3300 Airport Rd, phone
863-688-1188) as part of the **Publix Lakeland logistics complex on the WEST side of
the airport**, in the Drane Field / County Line Rd corridor. The same phone number also
serves the "Publix HV/LV Warehouse, 2600 County Line Rd," confirming the Publix DC
operations are clustered in one large multi-building campus with several gate addresses.

Walking the satellite imagery west of the airport revealed a corridor of very large
warehouses. The decisive discriminator for a **frozen / refrigerated** DC is refrigeration
infrastructure. A z18 probe at 28.0058,-82.0428 shows a full **industrial ammonia
refrigeration plant**: a tank farm of 6+ large horizontal ammonia tanks, round process
tanks, a condenser/utility building, and parked tanker trailers, all in a fenced compound.
This is the **only** refrigeration plant in the entire corridor — it pins the frozen DC to
the building cluster immediately around it (~28.007, -82.043).

This cluster is **distinct from roster idx 1** ("Publix Distribution Campus, County Line,"
28.014, -82.051), which a z16 probe confirmed is a separate massive standalone DC building
~1.5 km NW. The Land O'Lakes Purina Feed sign seen in one Street View frame is a co-located
tenant on a small SW lot, not the main complex.

## Key views

- **Satellite z16/z17 (28.007,-82.043):** three large white-roofed warehouse buildings
  (east, north, and a long "big" west building) plus the shared refrigeration plant to the
  south. Bright solid roofs with minimal skylights are consistent with insulated
  refrigerated/frozen construction.
- **Satellite z19 east-building south face (28.0071,-82.0415):** a long dock bank with a
  wide concrete apron, dock-door rhythm of ~25-35 positions, several trailers backed in.
- **Satellite z19 drop yard (28.0082,-82.0408):** a large trailer-storage lot NE of the
  east building, packed with ~50-70 trailers parked in angled rows.
- **Street View, SW rural lane (27.9978,-82.0465):** the DC's west wall behind chain-link
  perimeter fence with tractors/trailers staged inside; open fields opposite — an
  edge-of-town / rural setting.
- **Street View, internal road (28.0059,-82.0432 / 28.0074,-82.0442):** tan/white DC walls,
  fence lines, internal drives. SV does not penetrate the gated interior, so building
  signage and any gate booth could not be read directly.

## Gate / guard-shack / dock determinations

- **truckGate = true.** The frozen DC sub-campus is ringed by chain-link perimeter fencing
  (clear in the SW-lane Street View and in z18/z19 satellite). Trucks enter through fenced
  gates off the internal campus drive; there is no open public-road-to-dock driveway.
- **guardShack = false (uncertain).** No staffed beside-lane booth was resolvable. The
  public-road approaches show fence gates, and Street View cannot enter the gated interior.
  Flagged uncertain.
- **remoteGs = true (inferred).** Gate present, no visible staffed shack -> kiosk / app /
  remote check-in implied. Medium confidence.
- **dockDoors = "50+".** East building south face ~25-35 doors, north building south face
  ~15-20, plus the long west/big building dock bank — comfortably 50+ in aggregate.
- **dropArea = "50+" / dropYard = true.** The dedicated trailer-storage lot NE of the east
  building holds ~50-70 trailers, separate from the active dock aprons.
- **shipRcvSeparate = true (medium).** Distinct dock banks on different building faces (east
  south face, north south face, big-west NE face) imply separate ship/receive clusters.

## Yard zones and counts

- **perimeter:** oriented quad tracing the ~52-acre frozen DC sub-cluster (3 buildings +
  refrigeration plant + drop yard), rotated to the buildings' NE-SW axis.
- **truckGate:** oriented quad on the south entrance drive where the campus meets the rural
  lane (centroid ~27.9995,-82.0465).
- **dropYards[0]:** the NE trailer-storage lot (~3.9 ac).
- **dockAprons[0]:** east-building south dock apron, long thin quad parallel to the dock wall.
- **dockAprons[1]:** north-building south dock apron, parallel to that wall.
- **staging:** null (not separately resolvable; post-gate holding folded into the wide internal aprons).
- **streetViewMeta.perimeter:** pano `YB-55VL3YqcUw6acqLF9zA` (2023-12), heading 144°.
- **streetViewMeta.truckGate:** pano `-LayFXJPmfxr4auF-oDVqw` (2023-12), heading 32°.

**yardMetrics:** dockDoorCount ~60, trailersVisible ~70, trailerParkingCapacity ~90,
truckGateCount 1, buildingCount 3, siteAreaAcres ~52.0, railServed false. All overhead
estimates.

## Web findings

- Publix Frozen Foods Warehouse confirmed at 3300 Airport Rd, Lakeland FL 33811
  (hub.biz, Baxter Bailey, Manta listings; phone 863-688-1188).
- The Lakeland Publix DC operations span multiple addresses on one logistics campus
  (3300 Airport Rd, 2600 County Line Rd, 3045 New Tampa Hwy for produce/deli), all under
  the Publix Super Markets corporate hub in Lakeland.
- Whiting-Turner and LEO A DALY list "Publix Refrigerated Distribution Center" projects,
  corroborating that Publix runs purpose-built refrigerated DCs of this type.

## Final confidence

**Medium.** Building identity is well-supported (unique ammonia refrigeration plant pins
the frozen DC, and it is clearly distinct from the separately-rostered County Line DC).
The gate/dock/drop-yard physical reads are solid from satellite. Confidence is held at
medium rather than high because the roster coordinates were wrong (re-located by research)
and because Street View cannot enter the gated interior to confirm guard-shack vs.
remote-kiosk check-in, lane counts, or any internal scale/second checkpoint.
