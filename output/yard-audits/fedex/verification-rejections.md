# FedEx — Facility Verification Rejections & Flags

FOV scrub run 2026-06-18 (agent). 30 sites verified against the divestiture /
closure / Network-2.0 gauntlet plus a positive current-operation source.
Result: **22 confirmed, 7 probable (flagged), 1 rejected.**

Watch-context applied: FedEx **Network 2.0** is consolidating Express + Ground
(as of 2025 ~290 stations converted, ~100 redundant stations closed) — closure
check run hard on every site. **FedEx Freight (LTL) spun off** as an independent
NYSE company (FDXF, June 2026); it still operates its terminals, so Freight hubs
remain valid (tagged in rationale).

---

## REJECTED (1)

- **FedEx Freight Hub - Hodgkins IL (Chicago)** (41.791181, -87.856685) —
  **REJECTED: no FedEx Freight facility at this coordinate (misgeocoded / phantom).**
  The coordinate sits in the UPS CACH / BNSF Willow Springs intermodal corridor,
  a generic multi-tenant industrial park with FedEx drop boxes only and no FedEx
  Freight LTL cross-dock or signage. The FedEx Freight Illinois service-center
  roster lists CGX Summit-Argo (5101 S Lawndale, ~7 mi east), CGT Chicago Heights,
  and BOL Bolingbrook — none in Hodgkins. The original audit JSON itself already
  flagged this site `confidence: low` with the note "FACILITY NOT POSITIVELY
  IDENTIFIED." The genuine Chicago-area FedEx Freight hub exists (CGX), just not at
  this point. [Tier 1: https://www.fedexfreight.fedex.com/locationsAll.do?opco=&shipperCountryCode=US&shipperStateList=IL , 2026-06]
  → Re-point to CGX Summit-Argo (5101 S Lawndale Ave) or drop.

---

## PROBABLE — flagged, lower confidence (7)

These have no Tier-2 negative (no closure/sale/Network-2.0 hit) but lack a clean
recent Tier-1 positive. They ship caveated and capped.

- **FedEx Ground Hub - Hagerstown MD** (39.6385, -77.7915) — durable Ground
  distribution hub (1 of 29 centralized hubs), but the only clean Tier-1 press is
  dated 2005; no recent dated press located. No closure signal.
  [Tier 1: mhlnews.com Hagerstown hub opening, 2005-10]
- **FedEx Ground Hub - Lewisberry PA** (40.1645, -76.8405) — FedEx Ground
  Harrisburg Hub at 510 Industrial Dr; only Tier-3 directory corroboration
  (current-dated), no dated Tier-1 press, no FedEx-locator hub hit. No closure.
  [Tier 3: truckmap.com 510 Industrial Dr, 2026-06]
- **FedEx Ground Hub - Grove City OH** (39.9036, -83.0966) — FedEx Ground
  Columbus-area facility at 6120 S Meadows Dr; current directory corroboration
  only, no dated Tier-1, no closure signal.
  [Tier 3: truckmap.com 6120 S Meadows Dr, 2026-06]
- **FedEx Ground Hub - Middletown PA** (40.2331, -76.7308) — Ground hub at 111
  Fulling Mill Rd is **distinct** from the FedEx Express **Ship Center at 200
  Fulling Mill Rd that is closing Mar 2026** under Network 2.0. Ground site shows
  active on the FedEx locator but flagged for the adjacent same-road closure —
  confirm the Ground hub itself is not folded into the consolidation.
  [Tier 1: local.fedex.com/en-us/pa/middletown, 2026-05]
- **FedEx Freight Hub - Earth City MO (St. Louis)** (38.835, -90.521) — FedEx
  Freight (FDXF) runs the St. Louis-area LTL hub in the Earth City / Hazelwood
  corridor; locator confirms metro-STL presence but the exact street address at
  the audit coordinate was not pinned to a single dated Tier-1 page. No closure.
  [Tier 1: fedexfreight.fedex.com MO roster, 2026-06]

(Hagerstown MD Ground and Hagerstown MD Freight are two separate facilities —
both verified; only the Ground one is "probable.")

---

## Network 2.0 closure check — what was checked and cleared

Two Express air hubs had **nearby** Network 2.0 station closures that do NOT touch
the audited airport hub (verified as separate facilities):

- **Oakland CA (Express, site 05)** — the June 2025 Network 2.0 closure was the
  **Pardee Dr Ship Center** (~95 jobs), not the OAK airport Air Freight Center
  (9190 Edes Ave), which remains locator-listed and operating. **Confirmed.**
- **Greensboro NC (Express, site 06)** — a Network 2.0 station closure ~2 miles
  from PTI did NOT touch the FedEx Express Mid-Atlantic air hub at the airport.
  **Confirmed.**

FedEx Freight 2023/2024 service-center closures (legacy American Freightways
feeder terminals, mostly Arkansas region) did **not** include any of the audited
Freight hubs (Harrison, Memphis, West Jefferson, Hagerstown, Conley, Earth City,
DFW, Stockton). All cleared.
