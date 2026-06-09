# Deep-Audit Dossier — Ralphs/Food4Less Grocery Distribution Center, Compton CA

**Facility (idx 6, Kroger banner):** Ralphs/Food4Less Grocery Distribution Center
**Type:** Grocery Distribution Center
**Resolved center:** 33.8713, -118.2398
**Confidence:** High
**Method:** deep-audit (satellite + Street View + web)

---

## Step 0 — Location confirmation

The supplied address was **1100 W Artesia Blvd, Compton** with approximate coords
33.872585, -118.241093. Web research showed that 1100 W Artesia Blvd is the Ralphs
**corporate general office**, while the operating **distribution center** is a
separate, much larger freight campus addressed **2201 S Wilmington Ave, Compton CA
90220** (warehouserating.com pin 33.870924, -118.239471; "strict appointment
required, ~6 hr avg load/unload"). Since this audit targets the freight yard, I
locked onto the DC campus, not the office.

Satellite probing around the Wilmington-Ave coordinates confirmed a large
multi-building grocery distribution complex immediately south of the CA-91
(Artesia) freeway: several 100k+ sqft buildings, a refrigeration/cooling tower,
hundreds of trailers in organized rows, and a gated multi-lane truck entrance off
S Wilmington Ave. This is unambiguously the Ralphs/Food4Less Compton DC.

Locked center: **33.8713, -118.2398**.

---

## Step 1 — Layout (wide + tight satellite)

The gated property is a roughly 500 m (E-W) × 280 m (N-S) super-block, ~34.8 acres,
bounded:
- **North:** CA-91 freeway frontage (employee lot + office building between core
  and freeway, inside the fence).
- **East:** S Wilmington Ave (the trailer drop yard and the truck gate).
- **South:** an industrial surface street with a dock bank along the south face.
- **West:** an internal N-S road (tree-lined) separating Ralphs from unrelated
  smaller warehouses.

The campus holds multiple large DC buildings (dry + refrigerated), a cooling-tower
house, and an on-site fuel island near the gate. Buildings are aligned to the local
grid, which is rotated only a few degrees off true E-W — geofences traced as
slightly-rotated quads to hug the real walls and lot edges rather than
north-aligned boxes.

## Step 2 — Truck entrance, gate, guard shack (Street View)

The main truck entrance is a **signalized intersection off S Wilmington Ave** at
~33.8711, -118.2362. Street View (panos `IWSCxU0z7InXt1--9qD82g` 2025-07 and
`u9ks4NWck1522ecgs_UfFg` 2025-05) and z20 satellite show:
- A **wide multi-lane gated apron** with painted inbound/outbound lanes.
- A **canopy** spanning the inbound lanes.
- A small **white square guard booth** (~1-2 stall footprint) set in the middle of
  the lanes under/beside the canopy — a staffed check-in booth, not the main
  building.
- **Perimeter fencing** (wrought-iron + chain-link) along Wilmington on both sides
  of the drive.

Verdict: **truckGate = true, guardShack = true** (so remoteGs = false). The apron
has unused paved width and 3+ lanes → **fastLaneOpportunity = true**. Approach is
deep enough to stack 3+ trucks → **drivewayLong = true**. There is paved staging
both outside the gate (apron between road and booth) and inside before the docks →
preGateStaging and postGateStaging both true. Entry and exit share the one gate
group → **entryExitTogether = true**. Estimated ~3 inbound / ~2 outbound lanes.

No clearly identifiable truck scale/weigh pad in the path → **scale = false**
(flagged uncertain). No evidence of a second downstream checkpoint → multiStep
false. The gate sits well off the public road with a large internal apron, so a
queue would not spill onto Wilmington → **backupSensitive = false**.

## Step 3 — Docks and trailer yards

- **Dock doors:** Dock banks on multiple building faces — west face ~12 trailers
  backed in, SW faces 20+, south face ~15, plus additional interior bays. This is a
  1M+ sqft multi-building DC; total doors comfortably **50+**. Honest site estimate
  ~90.
- **Drop yard:** Extensive trailer-storage lots — dense organized rows in the east
  yard (60+ trailers) and SW rows (30+). Clearly a dedicated drop-yard operation →
  **dropYard = true**, dropArea band **50+**. Capacity ~220, ~180 trailers visible
  in captured imagery.
- **Ship/receive:** Distinct dock clusters on separate building faces suggest
  separate shipping/receiving → **shipRcvSeparate = true** (medium confidence).
- Multiple large building clusters on one property → **multipleFacilities = true**.

## Step 4 — Web findings

- 2201 S Wilmington Ave = Ralphs Grocery DC; 1100 W Artesia Blvd = Ralphs corporate
  office (Kroger umbrella; also serves Food4Less). Strict-appointment carrier
  facility, ~6 hr average load/unload, indicating high-volume scheduled freight.
- Kroger/Ralphs banner; SAFER lists Ralphs Grocery Co as an active carrier
  (USDOT 658513).

## Step 5 — Geofences & metrics

- **perimeter** — 4-corner oriented quad tracing the gated property inside the
  fence (~34.8 acres).
- **truckGate** — quad over the Wilmington gate apron/booth/lanes.
- **dropYards** — [east trailer yard, SW trailer rows].
- **dockAprons** — [west dock strip, south dock strip].
- **staging** — null (pre/post-gate staging captured by flags; no separate clean
  polygon traced).
- **streetViewMeta** — perimeter heading 277° (pano u9ks4NWck1522ecgs_UfFg),
  truckGate heading 261° (pano IWSCxU0z7InXt1--9qD82g). Interior has no Street View
  coverage (private property); both panos sit on Wilmington Ave looking west into
  the gate — the exact frame a driver sees on arrival.
- **yardMetrics:** dockDoorCount 90, trailersVisible 180, trailerParkingCapacity
  220, truckGateCount 1, buildingCount 5, siteAreaAcres 34.8, railServed false.

## Setting

Dense Compton/Rancho Dominguez industrial fabric, hard against the CA-91 freeway →
**urbanRural = Urban**, connectivityIssue false.

## Final confidence

**High.** Facility positively identified (corporate office vs DC disambiguated);
gate, guard booth, multi-lane apron, dock banks, and trailer yards all confirmed
across satellite (to z20) and ground-level Street View. Lower-confidence items
(truck scale presence, exact lane counts, ship/receive separation) are flagged in
`uncertainFields`.
