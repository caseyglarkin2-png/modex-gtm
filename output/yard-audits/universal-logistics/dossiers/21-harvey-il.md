# Deep-Audit Dossier — idx 21

## Universal Intermodal Services — Harvey Chicago Operations Center — Harvey, IL

**Status: RESOLVED — confidence HIGH** (re-audit; earlier audit geocoded the wrong building)

### Step 0 — Location
Confirmed address: **250 E 167th St, Harvey IL 60426** — Universal Intermodal
Services' Chicago operations center, an open container/chassis drayage yard
against the CN Harvey rail corridor. Google geocode returned `41.5877278,
-87.6439306`. Locked center: `41.58770, -87.64400`.

> The **earlier audit geocoded the wrong building** — it placed the site at
> `41.58590, -87.64029`, an older brick industrial building on a mixed
> residential block — and was correctly flagged low-confidence. This re-audit
> uses the confirmed address and pins the **actual operating drayage yard**:
> satellite shows a large open container/chassis yard with an office and
> maintenance shops, directly against the CN rail corridor.

### Steps 1-5 — Audit

**Facility nature.** An **open intermodal/drayage yard**, not a warehouse — a
large paved lot for chassis storage, container storage, and drayage-tractor
parking, with a small office building and maintenance/repair shop buildings.
Essentially no dock-warehouse function.

**Truck gate.** The yard is fully enclosed by chain-link fence along E 167th
St. Street View (Jul 2024) shows a defined truck-entrance pinch-point — a wide
paved gate opening in the fence line off 167th St. `truckGate: true`
(controlled fenced perimeter with a single defined entrance).

**Guard shack.** No staffed standalone guard booth at the gate opening — a
fenced entrance with no median booth and no visible barrier arm. Check-in is
presumed handled at the interior office building. Classed `remoteGs: true`;
`guardShack` flagged uncertain (a small gate booth could exist but is not
visible in imagery).

**Docks.** No warehouse dock bank — the maintenance/repair shops have a
handful of service-bay doors only (`dockDoors: 0-10`, effectively a
maintenance shop).

**Drop / storage.** The dominant feature is massive chassis and container
storage — hundreds of chassis in skeletal rows plus stacked containers across
the open lot (`dropArea: 50+`, `dropYard: true`).

**Rail.** The CN Harvey (CN Gateway) intermodal rail corridor runs immediately
**west** of the yard, and the yard exists to dray containers to/from that
ramp — but **no rail spur runs into this property itself**. `railServed: false`.

**Fast lane.** Very large open paved yard with abundant unused width at the
entrance — ample room for an express/bypass lane (`fastLaneOpportunity: true`).

**Setting.** Harvey IL — dense south-suburban Chicago metro fabric — **Urban**.

**Geofence.** Perimeter captures the fenced drayage yard: ~290 m N-S x ~292 m
E-W ≈ **21 acres**.

### Verdicts
- **Gate verdict:** truck gate present — fenced perimeter with a single
  defined truck-entrance pinch-point off 167th St.
- **Guard-shack verdict:** no standalone guard shack observed — interior-office
  / remote check-in inferred; flagged uncertain.
- **Confidence:** high.
