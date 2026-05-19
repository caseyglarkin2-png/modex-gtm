# UNFI — Richburg SC DC (Charlotte area) — Yard Audit Dossier

**Roster idx:** 29
**Facility:** UNFI Richburg Distribution Center (Southeast region, Charlotte-area)
**Address:** ~578 / 578B L&C Distribution Park, Richburg, SC 29729
**Locked coordinates:** 34.70980, -81.00420
**Confidence:** Medium

---

## Location resolution

The roster supplied only city-level, APPROXIMATE coordinates (34.715975,
-81.019526), which landed in rural residential Richburg town center — no
industrial property. Web research confirms a UNFI DC in the **L&C Distribution
Park, Richburg SC 29729**: directories give the UNFI address as 578 / 578B L&C
Distribution Park, and a separate LoopNet listing for the adjacent building
**546 L&C Distribution Park** describes a ±109,938 sq ft industrial warehouse —
i.e. UNFI occupies one building in a multi-building distribution park off Old
Richburg Rd E.

The L&C Distribution Park industrial cluster sits ~1.7km SE of the roster point,
along a highway. Within that cluster, the audited building (locked ~34.70980,
-81.00420) is the warehouse whose physical layout — a dock bank with dock
canopies and a trailer-parking apron — is most consistent with a UNFI
conventional-grocery satellite DC. Street View could not corroborate the
identity directly: the road panos snap to the adjacent highway, not the L&C
Distribution Park internal access road, so UNFI signage was not visible. **The
specific building within the multi-tenant park is therefore not 100% certain.**

---

## What the imagery showed

- **Overview (z16):** Several large industrial buildings in the L&C Distribution
  Park along the highway corridor, ringed by woodland. Multiple tenants.
- **Audited building (z17-19):** A substantial warehouse with a **dock bank on
  its west face** — a row of dark dock canopies with several trailers backed
  in — and an open paved truck apron alongside. Trailers are parked on the
  apron.
- **Street View (highway-side):** Industrial buildings with trailer yards behind
  chain-link fencing are visible across the L&C park; tractors and trailers are
  staged in the lots.
- **South side (z18):** The audited building's dock canopies and an open paved
  yard, surrounded by trees; no perimeter checkpoint structure visible.

---

## Gate / guard-shack / dock determinations

- **truckGate = false (flagged uncertain).** No controlled gate is visible at
  the audited building — the truck yard and dock apron appear open to the L&C
  Distribution Park internal road. No barrier arm or booth seen at z19. Flagged
  uncertain because Street View could not corroborate the property line.
- **guardShack = false.** No booth structure visible.
- **remoteGs = false** — left false as no gate is confirmed.
- **dockDoors = "10-25"** — ~20 doors estimated under the west-face dock
  canopies.
- **dropArea = "10-25" / dropYard = true** — trailers parked on the apron
  alongside the dock bank, separate from active dock positions.

---

## Yard zones and counts

- **Perimeter:** ~9-acre parcel estimated for the audited building (the L&C
  park as a whole is larger).
- **Dock apron:** the west-face dock-canopy strip.
- **Drop yard / staging:** modest apron trailer parking; not boxed separately.
- **dockDoorCount ~20, trailersVisible ~14, capacity ~30, buildingCount 1,
  railServed false.**
- **drivewayLong = true:** the internal park road and yard give a deep approach
  with no public-road spillover risk.

---

## Web findings

UNFI Richburg is a Southeast-region DC serving the Charlotte NC metro. It is a
smaller regional/satellite facility (the ~110k sq ft neighbor building gives the
scale of the park), not one of UNFI's million-square-foot consolidation builds.
Directories (Yahoo Local, BBB, warehouse.ninja, Glassdoor, Apple Maps) all
confirm an active UNFI presence in Richburg SC.

---

## Final confidence

**Medium.** The L&C Distribution Park location is confirmed by multiple
directories, but the exact UNFI building within this multi-tenant park could not
be pinned with Street View signage. The gate/guard-shack and dock-count calls
are flagged uncertain accordingly. Recommend a human cross-check against a UNFI
corporate facility list or a parcel record if a precise geofence is needed.
