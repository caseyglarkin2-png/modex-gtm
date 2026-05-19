# Deep-Audit Dossier — FedEx Ground Hub, Richfield OH (idx 20)

## Facility
- **Name:** FedEx Ground Hub - Richfield OH (Cleveland/Akron mini-hub)
- **Type:** Ground automated regional facility (229K sq ft mini-hub)
- **Roster address:** 4500 Renaissance Pkwy, Cleveland, OH 44128 — **WRONG**
- **Real address:** 3245 Henry Rd / 3900 Brecksville Rd, Richfield, OH 44286

## RESULT: FACILITY NOT POSITIVELY LOCATED — confidence LOW

### Step 0 — location problem
The roster address and coordinates are incorrect for this facility:
- **4500 Renaissance Pkwy, Cleveland OH 44128** is confirmed by web research
  (LoopNet APN 763-07-007, BBB) to be **Great Lakes Petroleum Co. /
  Northeast Lubricants** in Warrensville Heights — a ~90,000 sq ft petroleum
  property, NOT a FedEx facility.
- The roster lat/lng (41.437354, -81.493674) matches that wrong address.
- Satellite probing of the roster coordinates showed a petroleum/lubricants
  property and surrounding office buildings — not a FedEx Ground hub.

### The real facility
Web research (Truckinginfo, FleetOwner, FreightWaves) describes the actual
facility as the **FedEx Ground automated regional "mini-hub" in Richfield,
OH 44286**, situated between Cleveland and Akron:
- 229,000 sq ft, latest camera-based package-sorting technology.
- Capacity for **144 pickup-and-delivery vans**.
- Consolidated four older separate sites — three in the Cleveland metro,
  one in Akron.
- Located in Richfield's planned **Crossroads District** (550 acres at
  Wheatley Rd x Brecksville Rd, bounded by I-271 and I-77). The FedEx parcel
  forms the southern boundary of the district's "South Wheatley" focus area.
- Listed addresses: 3245 Henry Rd and 3900 Brecksville Rd, Richfield 44286.

### Search effort
Probed (z15-z18) Richfield village, the Wheatley/Brecksville intersection,
the South Wheatley triangle (Brecksville Rd W / Wheatley Rd N / I-77 E), and
the Brecksville/Richfield-Township border industrial area; walked Street
View at multiple points. The South Wheatley zone is largely undeveloped /
wooded. Large cross-dock distribution buildings exist near the
Brecksville/Richfield border (~41.276, -81.615), but **none displayed FedEx
branding or the distinctive ~144-van FedEx Ground P&D fleet** that a Ground
mini-hub would show. The exact FedEx building could not be confirmed.

## Determinations
All classification fields left at safe defaults and flagged uncertain — no
gate, guard-shack, or dock call can be made without the correct building.

## Recommendation
Correct the roster address/coords to the Richfield 44286 location (3245
Henry Rd / 3900 Brecksville Rd) and re-audit. The placeholder coordinates
in the JSON point only to the candidate Crossroads-District vicinity.

## Confidence
**Low.** Roster address confirmed wrong; correct facility researched but not
visually pinpointed. Flagged for human review / re-audit with corrected
coordinates.
