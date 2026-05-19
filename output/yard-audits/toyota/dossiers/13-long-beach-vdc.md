# Deep Audit — Toyota Logistics Services VDC, Long Beach CA (idx 13)

**Facility:** Toyota Logistics Services Vehicle Distribution Center — Port of Long Beach, Pier B
**Type:** Vehicle Distribution Center (port vehicle processing)
**Resolved coordinates:** 33.778, -118.2185
**Address:** 785 Edison Ave, Long Beach, CA 90813 (Pier B, Port of Long Beach)
**Confidence:** Medium

## Location resolution

Roster supplied a generic "Port of Long Beach, Pier B" point (33.7798, -118.2174).
Web research resolved the precise TLS facility to **785 Edison Ave** — confirmed
via Yelp, D&B, and the Oltmans/Lionakis/DCI construction-firm project pages for
the "Toyota Logistics Services Vehicle Processing & Distribution Center (VDC)."
Satellite at z15-z20 confirms a large fenced complex of striped vehicle-storage
lots packed with thousands of new cars, a cluster of processing/warehouse
buildings on the east side, fuel/car-wash structures, and multiple rail spurs
along the NE edge — exactly matching the described 155,000 sf VDC that processes
~180,000-200,000 imported vehicles per year for western North America.

## What the imagery showed

- **z15/z16 overview:** A ~60-acre fenced port parcel bounded by the rail
  corridor / Pico Ave to the N-NE and the Pier B wharf (channel) to the S-SE.
  The bulk of the site is vehicle marshalling lots; processing buildings sit
  mid-site and along the SE waterside.
- **z17/z18 building close-up:** The main processing building has a bank of
  dock-style doors along its NE face with a row of ~12-18 trailers / auto-hauler
  units staged against it. Adjacent buildings are accessory/processing shops.
- **z19/z20 north edge:** Striped lots full of new vehicles; rail spurs immediately
  north; a continuous chain-link perimeter fence with marked crossing lanes where
  the property meets the public road. Auto-haulers staged inside the fenced lot.
- **Street View (Edison Ave / Pico Ave, 2025-04):** Chain-link fencing on every
  public-road edge of the property. Rail cars (tank + covered hopper) sitting on
  the in-site track confirm active rail service. Office building at the NW corner.

## Gate / guard-shack determination

- **truckGate = true.** The entire facility is inside a port-secure fenced
  perimeter. As a Port of Long Beach maritime facility it operates under the
  Maritime Transportation Security Act — TWIC credentials required, USCG
  oversight, random security checks (documented in the VDC construction reporting).
  Controlled gated entry is certain even though a single barrier arm was not
  isolated frame-by-frame.
- **guardShack = true (inferred, medium confidence).** TWIC-controlled maritime
  facilities are staffed at the gate for credential/ID verification. A gatehouse
  is consistent with the NW office cluster by the rail crossing; a discrete booth
  could not be pinpointed in overhead imagery, so this is flagged uncertain.
- **remoteGs = false** — guard shack present.
- **multiStep = false** — no clear second post-gate checkpoint visible.

## Yard zones & counts

- **Perimeter:** ~62 acres, the contiguous TLS fenced lots + processing buildings.
- **Drop / marshalling yards:** the dominant land use — striped vehicle lots
  holding thousands of finished vehicles; effectively one giant drop yard.
- **Dock apron / staging:** dock-style door bank on the processing building's NE
  face with a deep paved apron (`drivewayLong` true — 3+ unit queue room).
- **Dock doors:** ~14, banded 10-25 (atypical for a vehicle-processing site).
- **Rail served:** YES — multiple spurs into the NE edge; rail cars on-site.

## Web findings

- TLS imports 200,000+ vehicles/yr through Long Beach; the VDC processes ~180,000/yr.
- Toyota's first port vehicle-processing facility powered by 100% on-site
  renewable electricity; largest of its kind on the west coast of the Americas.
- 155,000 sf processing/office building, car-wash building, and fuel island.
- Site falls under Port of Long Beach TWIC / MTSA maritime security.

## Final confidence: MEDIUM

Location and facility identity are certain. Gate presence is certain (port-secure
perimeter). Guard-shack, exact gate count, dock-door count, lane counts and scale
are inferred from facility type and partial imagery — flagged in uncertainFields.
This is a vehicle-processing port, so conventional dock/trailer metrics are an
imperfect fit and should be read as honest estimates.
