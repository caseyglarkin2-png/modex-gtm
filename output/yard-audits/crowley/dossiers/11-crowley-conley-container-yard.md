# Deep-Audit Dossier — Crowley Conley Container Yard (Conley GA / Atlanta)

**Roster idx:** 11
**Account:** Crowley
**Type:** Inland container yard / intermodal logistics hub
**Address:** 4252 Transport City Drive, Conley, GA 30288
**Resolved center:** 33.65645, -84.34470
**Method:** deep-audit
**Confidence:** medium

## Step 0 — Facility identification

The roster supplied 33.656392, -84.344522 (geocoding-api, ROOFTOP, moved 52 m).
Satellite probes (z16-z20) around that point show the **"Transport City"
industrial outdoor-storage (IOS) park** off Transport City Drive in Conley,
the dense SE industrial edge of metro Atlanta ("Trucker's Alley").

Web research confirmed:
- LoopNet / property listings describe Transport City as a full-service IOS
  asset offering trailer/truck parking, service & maintenance, and
  equipment/material storage along the I-285/I-675 corridor.
- Crowley's locations page lists a Conley (Atlanta-area) container yard;
  Crowley's land-transportation arm runs intermodal/drayage container service.

Crowley's Conley operation is a **drayage / intermodal container drop yard** —
a large fenced lot for trailer and container storage with a small office, not
a dock-door distribution warehouse. The geocoded point lands on the trailer
drop yard. The locked center (33.65645, -84.34470) is the centroid of the
fenced yard.

## Key views

- **z16 region** — Maps the Transport City park: container/trailer drop yards
  in the upper-center; a large LTL cross-dock terminal (ABF) to the lower-left
  (a separate facility, not Crowley); auto-storage and equipment lots around.
- **z18 / z19 center** — The Crowley yard: a large gravel/paved trailer drop
  yard (~50-55 trailers parked in diagonal rows) plus an adjacent container
  storage area with stacked containers and chassis. A single internal drive
  links the yard to Transport City Drive.
- **z20 tight** — Confirms mixed container/chassis storage and equipment;
  no warehouse dock face anywhere on the parcel.

## Gate / guard-shack / dock determinations

- **Truck gate — TRUE.** Street View (pano 33.65675, -84.34416, captured
  2025-02; headings 250-270°) clearly shows a **chain-link swing gate** across
  a single yard drive, with multiple signs mounted on the gate and fence. The
  entire yard is enclosed by a chain-link perimeter fence.
- **Guard shack — FALSE.** No staffed booth sits beside the gate. The only
  structures are a single-story metal office building and an office
  trailer/shed set well back from the entrance — not a gate-side booth.
- **Remote GS — TRUE.** Gate exists but no guard shack, implying
  sign/kiosk/phone check-in.
- **Dock doors — NONE.** This is a container/trailer storage and drayage yard;
  no loading-dock doors or dock-leveler rhythm anywhere on the building.
- **Drop area — 50+.** ~50-55 trailers/containers visible parked; the lot plus
  container storage area can hold well over 50.

## Yard zones & counts

- **Perimeter:** S 33.65480 / W -84.34620 / N 33.65730 / E -84.34330 — the
  fenced container/trailer yard, approx 13.5 acres.
- **Truck gate zone:** the single swing-gate drive off Transport City Drive.
- **Drop yards:** the main NW gravel trailer lot and a SE container-storage
  area (two boxes).
- **Dock aprons / staging:** none — no docks; open paved apron inside the gate
  provides post-gate staging.
- **yardMetrics:** dockDoorCount 0; trailersVisible ~55; capacity ~130;
  truckGateCount 1; buildingCount 2; siteAreaAcres ~13.5; railServed false
  (no rail spur into the parcel — rail intermodal handled off-site).

## Web findings

- Transport City is a managed industrial outdoor-storage park; Crowley leases
  a container yard there for its Atlanta intermodal/drayage operation.
- Crowley Land Transportation provides intermodal truck/rail/drayage container
  movement; the Conley yard is a regional container staging/storage hub.

## Final confidence — MEDIUM

The facility is unambiguously Crowley's Conley container yard within Transport
City; the gate, fence, and yard layout are clearly visible in 2025 Street View
and Maxar satellite. Confidence is held at medium because the exact parcel
line between Crowley's leased yard and neighboring IOS tenants is approximate,
and entry/exit lane counts are inferred from a single-drive gate.
