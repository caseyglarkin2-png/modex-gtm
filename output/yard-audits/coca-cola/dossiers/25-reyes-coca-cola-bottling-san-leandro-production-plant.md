# Deep-Audit Dossier — idx 25

## Reyes Coca-Cola Bottling — San Leandro Production Plant, CA

**Resolved location:** 14655 Wicks Blvd, San Leandro, CA 94577
**Locked center:** 37.69910, -122.16835
**Confidence:** medium

### Step 0 — Location resolution

The roster supplied 37.712931, -122.160869 with the address "1101 Marina Blvd."
A satellite probe of that point landed squarely in a retail/commercial district
(parking lots, strip development) — not an industrial facility. Web research
resolved the discrepancy:

- Multiple business directories (Chamber of Commerce, Superpages, ImportYeti,
  Bandana jobs) list Reyes Coca-Cola Bottling LLC at **14655 Wicks Blvd, San
  Leandro, CA 94577**.
- A Birdeye review page titled "Reyes Coca-Cola Truck Entrance" gives
  coordinates **37.7003001, -122.1658019** and the same Wicks Blvd address.
- The Coca-Cola San Leandro bottling plant was established 1967 and serves the
  SF Bay Area.

Probing the Birdeye coordinate and surrounding industrial blocks identified the
facility as the large gray-roofed warehouse centered ~37.6991, -122.1684. A
Street View shot from the Birdeye point showed an orange/red Coca-Cola trailer
parked along the building, and z19/z20 satellite of the south face showed red
Coca-Cola trailers backed into the docks. Identity confirmed.

Note: the building is a **multi-tenant** industrial warehouse — "Accu-Logistics
LLC" signage is visible on the east end. Reyes Coca-Cola occupies the larger
western/distribution portion. The roster type "Production Plant" is best
characterized physically as a large distribution warehouse with extensive
truck docks.

### Key views

- **Overview (z17):** Dense industrial business park. Coca-Cola building is the
  large gray-roof box; employee parking lot on the east, fenced dock yard on the
  south, separate white-roof warehouses to the west.
- **South face (z19/z20):** A continuous row of dock doors with dock canopies /
  levelers; ~22 trailers backed in (red Coca-Cola, white, blue).
- **Dock yard Street View:** Captured driving through the fenced dock yard —
  shows dock doors with canopies and a small office annex with red signage.
- **Griffith St Street View:** Public industrial street south of the dock yard
  where trucks queue at the curb; chain-link fencing with green privacy slats
  borders the dock yard.

### Gate / guard-shack / dock determinations

- **truckGate = true.** Driver reviews state drivers "park on the curb, just
  inside the gate" when docks are full — an explicit gate. The south dock yard
  is enclosed by chain-link fence with green privacy slats. Entrance is on the
  SE/E side. No barrier arm could be cleanly resolved in imagery, but the yard
  is fenced and access-controlled.
- **guardShack = false.** No staffed booth visible at the truck entrance in any
  satellite or Street View imagery.
- **remoteGs = true.** With a gate but no booth, and driver reviews describing
  an appointment-based remote check-in ("no check-in until 30 minutes before
  appointment," "no restroom"), check-in is kiosk/call-box style.
- **dockDoors = 25-50.** ~25-30 dock doors along the south building face;
  estimate from overhead imagery.
- **preGateStaging = true.** Drivers stage on the public Griffith St curb.
- **backupSensitive = true.** A truck queue spills onto the public industrial
  street; reviews complain of no early parking.

### Yard zones and counts

- **Perimeter:** building + south dock yard + east employee lot, ~330 m N-S x
  ~110 m E-W, ~9 acres.
- **Dock apron:** strip in front of the south-face dock bank.
- **Drop yard:** fenced paved dock yard south of the building, ~25-trailer
  capacity, ~22 trailers visible.
- **Truck gate:** SE/E entrance off Griffith St.
- **Buildings:** 1 (single large multi-tenant warehouse).
- **Rail:** not served (no spur into the property).

### Web findings

- 14655 Wicks Blvd confirmed across multiple directories; phone (510) 667-6300.
- Birdeye "Reyes Coca-Cola Truck Entrance" — 2.3 stars, 54 reviews; check-in
  30 min before appointment, hi-vis vest mandatory, no restroom, park on
  Griffith St if early.
- Multi-tenant building; Accu-Logistics LLC is a co-tenant.

### Final confidence: medium

Facility positively identified and the gate/dock layout is well supported by
satellite + Street View + driver reviews. Confidence held to medium because the
roster coordinates were wrong, the building is multi-tenant (Reyes' exact
demised footprint is inferred), the barrier-arm type at the gate could not be
resolved directly, and dock-door counts are overhead estimates.
