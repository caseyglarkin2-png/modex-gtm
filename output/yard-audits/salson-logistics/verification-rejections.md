# SalSon Logistics — FOV verification rejections

Run: 2026-06-18 (agent). Protocol: `scripts/yard-audit/verify-facility-prompt.md`.
SalSon Logistics is a drayage + warehousing 3PL (operator `3PL`, leased). 14 sites verified.
Verdicts: 9 confirmed, 2 probable (flagged), 3 rejected.

## Rejected (3) — do NOT image, geofence, or classify

- **SalSon Logistics - Chesapeake VA (Norfolk)** (Chesapeake, 3832 South Military Hwy, VA 23321) —
  REJECTED: the Port of Virginia's official 2024 motor-carrier listing registers this EXACT
  address to **Sheridan Logistics, Inc.** (a different drayage carrier), and SalSon does not
  appear anywhere in the registry. Original audit source was aggregator-only (logicoreapp).
  [Tier 1: https://www.portofvirginia.com/wp-content/uploads/2024/03/POV-Motor-Carrier-Listing-2024v3.pdf, 2024-03]

- **SalSon Logistics - Houston TX** (Houston, 8357 Liberty Rd, TX 77028) —
  REJECTED: the exact building is today an **Outpost**-operated public truck/trailer-parking
  yard ("managed by Outpost", 16 acres, open 24h), a different company at the address. Original
  audit source was aggregator-only (logicoreapp).
  [Tier 1: https://outpost.us/locations/houston-liberty/, 2026]

- **SalSon Logistics - Savannah GA** (Savannah, 1501 Lissner Avenue, GA 31408) —
  REJECTED: the exact building (truck terminal / container yard + crossdock) is currently
  **vacant and listed FOR LEASE "delivered vacant" by Colliers**; no SalSon's-own source ties
  SalSon to 1501 Lissner (SalSon's real Savannah presence appears to be a different building).
  Original audit source was aggregator-only (logicoreapp).
  [Tier 2: https://www.colliers.com/en/properties/truck-terminalcontainer-yard-with-crossdock-warehouse/usa-1501-lissner-ave-savannah-ga-31408-usa/usa1113355, 2024]

## Probable — flagged (ship caveated / capped, or hold for a confirmed address)

- **SalSon Logistics - Oakland CA** (Oakland, no street address) —
  PROBABLE-FLAG: documented as a current SalSon West Coast drayage MARKET (Transport Topics,
  2025-03), but NO specific operating building/street address could be confirmed. Likely a
  port-drayage service area with no auditable yard. Do not geofence without a confirmed address.

- **SalSon Logistics - Bakersfield CA** (Bakersfield, no street address) —
  PROBABLE-FLAG: named as a current SalSon West Coast intermodal/fleet MARKET (Transport
  Topics, 2025-03), but NO specific operating building/street address could be confirmed. May
  have no auditable yard. Do not geofence without a confirmed address.

## Confirmed-with-caveat (note for the auditor, not a rejection)

- **SalSon Logistics - Compton CA** (Compton, 18735 S Ferris Pl, CA 90220) —
  CONFIRMED at 18735 S Ferris Pl (the established TTSI/SalSon Compton drayage HQ, FMCSA ACTIVE).
  CAVEAT: the audit's "260,000 sq ft / 66 docks / 20-acre yard / under construction" metrics
  describe a SEPARATE new West Compton build whose 2026 open status could NOT be confirmed.
  Reconcile which physical building the geofence/metrics target before shipping; if the audit
  means the new 260k build, that one is not verified open.

## How verified

Per-site real web research (SalSon's own locator pages on salson.com, Transport Topics /
FreightWaves trade press, FMCSA SAFER carrier snapshots, the Port of Virginia carrier registry,
operator-of-record pages, careers/driver-application postings, and the Aug-2024 SalSon 7-company
merger record). salson.com bot-blocks direct fetch (404/403) so its pages were corroborated via
indexed search content + independent press/careers. Aggregator listings (logicoreapp, D&B,
ZoomInfo, Racklify, Yelp) were NOT used as citations of record. Each non-rejected site carries
>=1 real citation in its `verification` block.
