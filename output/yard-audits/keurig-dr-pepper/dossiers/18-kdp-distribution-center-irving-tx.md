# Deep-Audit Dossier — idx 18

## KDP Distribution Center — Irving, TX

**Roster address:** 2304 Century Center Blvd, Irving, TX 75062 ("Verified street address")
**Resolved facility:** Dr Pepper / Dallas-Fort Worth Bottling Company campus, 2304 Century Center Blvd
**Resolved center:** 32.8428, -96.89475
**Type:** Distribution Center — Beverage/DSD
**Confidence:** High

---

## Step 0 — Locating the facility

Although the roster geocode was flagged GEOMETRIC_CENTER with a 6,209 m move,
the supplied coordinate (32.843407,-96.894755) landed directly on a very large
industrial facility. Street View of the main entrance off Century Center Blvd
shows a **"Keurig Dr Pepper" monument sign reading "2304"** — positively
confirming the address. This is the Dr Pepper / Dallas-Fort Worth Bottling
Company (The American Bottling Company, a KDP subsidiary) — a major DFW
beverage manufacturing + distribution campus.

## Key views

- **Wide satellite (z16-17):** A massive main warehouse/bottling building with
  rooftop processing equipment; a very large trailer drop yard on the SE; the
  Trinity River floodway/levee wrapping the NE-E; a freeway on the NW; office
  and dock buildings extending south.
- **Tight satellite (z18-21):** Extensive dock banks with trailers backed in;
  DSD delivery vans/box trucks docked on the SW; dozens of rows of 53'
  trailers in the SE drop yard; a circular drive at the office entrance.
- **Street View (Century Center Blvd, 2025):** KDP monument sign ("2304") at
  the main entrance; a small booth-footprint structure beside the entrance
  lane; tractor-trailers parked along the campus roads.

## Gate / guard-shack / dock determinations

- **truckGate: true** — Main entrance off Century Center Blvd is a controlled
  drive with the KDP monument sign; multiple entry/exit driveways serve the
  campus and dock yards.
- **guardShack: true** — A small structure with a guard-booth footprint sits
  beside the main entrance lane. Medium confidence — flagged uncertain.
- **remoteGs: false** — Guard booth present.
- **dockDoors: 50+** — Extensive dock banks along the main building's south/
  southeast faces with trailers backed in; ~70 doors estimated (partly
  obscured — uncertain).
- **shipRcvSeparate: true** — Distinct dock clusters on different building
  faces (DSD van docks on the SW; large-trailer docks toward the SE yard).
- **dropYard / dropArea 50+** — Very large dedicated trailer drop yard on the
  SE; dozens of rows of 53' trailers plus pallet/material storage.
- **entryExitSeparate: true** — Multiple separate entry/exit driveways around
  the campus perimeter (flagged uncertain).
- **fastLaneOpportunity: true** — Wide entry drives and large paved aprons.
- **multipleFacilities: true** — Campus: one massive main building plus
  separate office, dock and shop buildings.

## Yard zones and counts

- **Perimeter:** ~720 m N-S x ~660 m E-W, ~117 acres (large campus).
- **Truck gate:** main entrance off Century Center Blvd (KDP monument sign).
- **Drop yard:** SE trailer storage yard.
- **Dock apron:** strip in front of the main building's south dock bank.
- **Staging:** paved circulation area inside the entrance before the docks.
- **yardMetrics:** dockDoorCount ~70, trailersVisible ~180, trailerParking
  capacity ~240, truckGateCount 2, buildingCount 6, siteAreaAcres 117.4,
  railServed false.

## Web findings

- 2304 Century Center Blvd, Irving TX 75062 — Dr Pepper / Dallas-Fort Worth
  Bottling Company (The American Bottling Company), a KDP operation; soft-drink
  bottling/canning; ~100 employees at this branch.
- Listed across Yelp, Waze, Foursquare, Wikimapia, and the Irving Chamber as
  the KDP / Dr Pepper Irving facility.

## Final confidence: High

Facility positively identified by the on-site KDP monument sign with the
matching street number. Counts (dock doors, trailer capacity) and the
guard-shack call are honest overhead estimates and flagged uncertain, but the
identification, scale, and DSD/bottling character are unambiguous.
