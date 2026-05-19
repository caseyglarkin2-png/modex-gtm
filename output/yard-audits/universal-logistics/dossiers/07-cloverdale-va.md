# Deep Audit — Universal Logistics, Roanoke/Botetourt Value-Added Facility, Cloverdale VA (idx 7)

**Facility:** Universal Logistics - Roanoke/Botetourt Value-Added Facility
**Address:** 1796 Lee Hwy, Cloverdale, VA 24077
**Type:** Value-Added Warehouse / Heavy-Truck Assembly Facility (owned)
**Locked coordinates:** 37.37224, -79.90340
**Confidence:** High

## Location resolution
Roster coordinates landed on the roof of a large dark-roof warehouse off
Lee Hwy (US-11) in Cloverdale, Botetourt County. Confirmed via PRNewswire,
the Roanoke Times, Commercial Property Executive, WSET-TV and LoopNet: this
is the ~254,000 sq ft building on ~37 acres at 1796 Lee Hwy that Universal
Logistics acquired for a ~$50M expansion of its heavy-truck division —
third-party assembly, sequencing, and value-added warehouse services,
announced January 2024, ~45 new jobs. The building previously served as a
Southern States Cooperative distribution center. Center locked at
37.37224, -79.90340.

## Imagery findings
- **Wide satellite (z16–z17):** one large warehouse beside Lee Hwy/US-11,
  with a rail line on the east edge and a separate large lot to the NE.
  Edge-of-town setting — residential frontage, woods and farmland around.
- **Building (z18):** an older multi-section dark-roof warehouse consistent
  with a former co-op DC; docks concentrated on the long W/SW face.
- **W/SW dock face (z19):** a continuous bank of dock doors with ~14 trailers
  backed in / parked; older dock canopies. Estimated ~26 doors.
- **SW staging lot (z19):** a large paved yard at the SW corner holding
  parked trailers and heavy equipment (a crane visible), bounded by partial
  chain-link fence — a drop/equipment yard distinct from the active docks.
- **Entrance (Street View 2023–2024):** the main truck driveway enters off
  Lee Hwy at the SW corner as an OPEN driveway running into the paved yard.
  No barrier arm, no sliding/swing gate across the lane, no guard booth.
  A small green swing gate sits on a minor side path but does not control
  the truck drive. The road frontage includes a residence and is rural
  2-lane.
- **East side (z19):** a rail line runs NE–SW behind a vegetation buffer; no
  rail spur enters the property.

## Gate / guard-shack / dock determinations
- **truckGate = false** — uncontrolled open driveway entrance; no barrier,
  gate, or checkpoint pinch-point on the main truck lane.
- **guardShack = false** — no booth observed at the entrance. remoteGs =
  false (no gate, so it cannot apply).
- **drivewayLong = true** — long internal approach from the Lee Hwy entrance
  across the SW staging lot before reaching the dock apron; 3+ truck queue
  capacity. **postGateStaging = true** — the large SW paved lot is an
  internal holding area.
- **dockDoors = "25-50"** — continuous dock bank on the W/SW face,
  ~26 doors estimated (flagged uncertain — older building, canopies obscure
  the count).
- **dropArea = "10-25", dropYard = true** — SW staging lot holds parked
  trailers and equipment separate from the dock apron.

## Yard zones & counts
- **Perimeter:** ~37 acres (matches the published site area) enclosing the
  warehouse, the W/SW dock apron, the SW staging/drop lot, and the N parking.
- **Truck gate:** none — left null.
- **Drop yard / staging:** the SW paved lot.
- **Dock apron:** the strip along the W/SW face.
- **yardMetrics:** ~26 dock doors, ~14 trailers visible, ~60 trailer parking
  capacity, 1 (uncontrolled) truck entrance, 2 buildings (warehouse + S
  office), 37 acres, not rail-served.

## Web findings
Universal's Roanoke expansion targets the heavy-truck industry — third-party
assembly and value-added services. The building is a former Southern States
Cooperative DC. The $50M buildout was still in progress as of the 2024
announcement, so current imagery may predate completion of new value-added /
assembly construction, which could change dock and yard counts.

## Final confidence
**High** on identity, location and the gate/guard-shack determinations
(open uncontrolled entrance, no booth). Dock-door count and trailer-parking
capacity are honest estimates from older overhead imagery and are flagged as
uncertain; an active expansion may also shift those figures.
