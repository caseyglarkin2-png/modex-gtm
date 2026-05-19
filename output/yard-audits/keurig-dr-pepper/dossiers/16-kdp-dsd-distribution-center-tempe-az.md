# Deep-Audit Dossier — idx 16

## KDP DSD Distribution Center — Tempe, AZ

**Roster address:** 1850 W University Dr, Tempe, AZ 85281 (flagged "Address approximate")
**Resolved facility:** Former Kalil Bottling Co. plant, **2777 S Hardy Dr, Tempe, AZ 85282**
**Resolved center:** 33.4062, -111.9540
**Type:** Distribution Center — DSD (beverage bottling + direct-store-delivery)
**Confidence:** Medium

---

## Step 0 — Locating the facility

The roster's geocoded ROOFTOP point (1850 W University Dr) landed on an office
building with rooftop solar and surface parking — not a freight facility. The
roster itself flags the address as approximate.

Web research established the KDP Tempe DSD operation came from the **May 2024
acquisition of Kalil Bottling Co.** KDP press releases confirm KDP now operates
"sales and distribution centers in Tucson and Tempe." Multiple business
directories (yellowpages, superpages, hub.biz, Manta) give Kalil Bottling's
Tempe address as **2777 S Hardy Dr, Tempe, AZ 85282**.

S Hardy Dr is a N-S industrial street in south Tempe. Street View at the Hardy
Dr / Broadway Rd intersection confirmed the street sign reads "Hardy". The
2700-block (just south of Broadway) is occupied by a large beverage bottling
complex with a central tank/silo farm — consistent with Kalil's contract
bottling operation. This is the audited facility.

Note: a portion of the complex fronting S Hardy Dr carries a small "Schreiber"
sign (Schreiber Foods, 2122 S Hardy Dr, a dairy processor sharing the same
industrial block). The exact parcel split between the KDP/Kalil footprint and
Schreiber's is not resolvable from overhead imagery — hence medium confidence.

## Key views

- **Wide satellite (z17-18):** Connected building cluster with a prominent
  tank/silo farm (syrup/water tanks for bottling), a south warehouse, and a
  large open paved DSD fleet yard. Dense Tempe industrial corridor all around.
- **Tight satellite (z19-20):** Two long diagonal rows of **DSD route delivery
  trucks** (bay/box beverage trucks) parked in the yard, plus a row of 53'
  trailers and extensive employee parking — the signature of a DSD beverage
  distribution operation.
- **Street View (S Hardy Dr, 2025):** Plant building with tanks behind a
  chain-link fence and oleander hedge along the road frontage; a 53' tractor-
  trailer parked at a loading point; building service doors and a paved apron.
  No staffed guard booth seen.

## Gate / guard-shack / dock determinations

- **truckGate: true** — Perimeter chain-link fencing with oleander hedge along
  the S Hardy Dr frontage; driveway breaks at the NW yard and along Hardy Dr
  give controlled access. (Medium confidence — fence line is partial.)
- **guardShack: false** — No small staffed booth visible at any entrance in
  Street View or satellite imagery.
- **remoteGs: true** — Gate present, no guard shack → unmanned/remote check-in.
- **dockDoors: 10-25** — ~18 dock doors estimated across the south warehouse
  face and plant building; partly obscured by trailers — low confidence.
- **dropYard / dropArea 10-25** — Large open yard staging the DSD truck fleet
  and trailers (10-25 trailer-equivalents).

## Yard zones and counts

- **Perimeter:** ~400 m N-S x 460 m E-W, ~45.5 acres (covers the bottling
  complex + DSD fleet yard).
- **Truck gate:** NW driveway opening into the fleet yard.
- **Drop yard:** central open paved yard with diagonal DSD truck rows.
- **Dock apron:** strip in front of the south warehouse dock bank.
- **yardMetrics:** dockDoorCount ~18, trailersVisible ~8, trailerParking
  capacity ~25, truckGateCount 2, buildingCount 4, siteAreaAcres 45.5,
  railServed false.

## Web findings

- KDP acquired Kalil Bottling Co. (independent AZ bottler/distributor) in May
  2024, gaining AZ distribution rights for Canada Dry, 7UP, A&W, Snapple, Core.
- KDP operates a production facility in Tucson and sales/distribution centers
  in Tucson and Tempe post-acquisition; ~425 employees added statewide.
- Kalil's Tempe site is described as its "newest distribution facility."

## Final confidence: Medium

Facility location and DSD/bottling character are positively confirmed. Medium
(not high) because: roster address was wrong and had to be re-derived; the
exact parcel boundary between the KDP/Kalil and adjacent Schreiber Foods
footprints in the shared industrial complex cannot be drawn precisely from
imagery; dock-door count partly obscured.
