# PBNA - Twinsburg OH — Deep-Audit Dossier

**Facility:** PBNA bottling + NE Ohio distribution center, 1999 Enterprise Pkwy, Twinsburg OH 44087
**Locked center:** 41.29349, -81.447631 (roster ROOFTOP geocode confirmed correct)
**Audited:** 2026-06-12 · method: deep-audit (satellite z17-z20 + Street View 2021-09)

## Location confirmation
Roster coords landed directly on a ~225m-wide industrial complex fronting Enterprise
Pkwy (west) and E Highland Rd (south), backed by a rail corridor (north). Street View
at both south curb cuts shows Pepsi-branded trailers, Pepsi banners on the perimeter
fence, a Pepsi sign at the east drive, and stacks of blue Pepsi bottle shells in the
yard. Identity is certain.

## Entrance / gate / guard shack
- **Main truck entrance** (E Highland Rd, ~41.2918, -81.4468): a very wide, open,
  multi-lane concrete drive running ~200m north into the yard. Street View (2021-09)
  shows **no barrier arm, no gate, no guard booth** — trailers parked along the drive,
  light poles, open access. Verdict: `truckGate: false`, `guardShack: false`,
  `remoteGs: false` (no gate at all).
- **Secondary east drive** (~41.2918, -81.4458): manual chain-link sliding gate across
  the drive with a Pepsi sign (appears to be a contractor/secondary entrance). Not a
  staffed checkpoint.
- Approach is long (3+ truck queue depth) and wide, with clear room for an express
  lane → `drivewayLong: true`, `fastLaneOpportunity: true`, `backupSensitive: false`.

## Docks and yard
- Dock banks: NE gray-roof building has a bank with ~12-14 trailers docked (z19);
  the main building's SE corner has another bank (~8-10 docked, se18 frame); more
  positions along the east face. Estimated **~35 doors → band 25-50**.
- **Drop yard is the dominant feature**: dense trailer rows fill the strip between
  the building and a pond on the east boundary, from the rail line down to E Highland
  Rd. ~70 trailers visible, est. capacity ~110 → `dropArea: 50+`, `dropYard: true`.
- Route-truck/box-truck rows line the main drive; employee parking SW corner.
- A dark-roof warehouse parcel at the SE corner is ringed by Pepsi blue shells —
  treated as part of the operational site (ownership unverified, flagged).

## Geofences
- **Perimeter** (6-vertex ring, ~24 acres): Enterprise Pkwy (west, -81.4489) →
  rail corridor (north, 41.29448) → pond notch (east boundary steps from -81.44555
  to -81.44460 south of 41.2930) → E Highland Rd (south, 41.29175). Site is
  square to the road grid, so the near-rectangular ring follows the true fence lines.
- Truck gate quad on the main west drive; one large drop-yard ring (east trailer
  yard); two dock-apron quads (NE bank, SE-corner bank).
- Street View: gate/perimeter pano `DJADuchKN8yZy_VUUJIIZg` (E Highland Rd, heading
  ~0° into the main drive — the real driver arrival frame); drop yard via pano
  `mvyETOiKWgpDX5bM3yVv5Q` at the gated east drive. No pano coverage at the dock aprons.

## Web corroboration
D&B lists Pepsi-Cola Metropolitan Bottling Co (PBNA legal entity) here; the site runs
production plus Northeast Ohio distribution (roster source). Physical layout (large
plant + big route fleet + large drop yard) matches a combined plant/DC.

## Verdict
Open-yard site: no controlled truck gate, no guard shack, heavy drop-yard operation
with long uncontrolled access drives — a strong YardFlow fit (gate/check-in greenfield).
**Confidence: high.** Uncertain: dock-door band, ship/rcv separation, lane counts,
SE-parcel ownership.
