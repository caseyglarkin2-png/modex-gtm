# Deep-Audit Dossier — Amazon BFI4 Fulfillment Center, Kent WA

- **Facility:** Amazon BFI4 Fulfillment Center (9th-gen Amazon Robotics FC, launched March 2016)
- **Type:** Fulfillment Center
- **Address:** 21005 64th Ave S, Kent, WA 98032
- **Resolved center:** 47.41452, -122.25782
- **Method:** deep-audit (probe.ts satellite z16-z20 + Google Street View, 2025-05 panos)
- **Confidence:** high

## Step 0 — Location confirmation
The supplied approximate coords (47.413802, -122.257825) landed directly on a single very
large white-roofed distribution building in Kent's industrial valley. Web search confirmed
21005 64th Ave S = Amazon FC BFI4, a 9th-generation Amazon Robotics fulfillment center
(launched March 2016, open 24h). Street View from the north service road shows the building
address number "21005" on the wall and Amazon "smile" branding on trailers/building behind the
landscaped median, positively confirming the building. Center adjusted slightly to the building
centroid at 47.41452, -122.25782.

## Key views
- **z17/z18 overview:** one massive single building, long axis running roughly E-W with only a
  few degrees of rotation off true north. North face = truck/dock side (trailers backed in +
  drop row along the fence). South and west faces = employee parking (cars in marked stalls).
  East boundary is an internal drive / tree line separating BFI4 from a neighboring flex/office
  complex.
- **z19 north dock/yard:** two distinct trailer rows on the north — an outer drop row of parked
  trailers along the perimeter fence (against the north service road) and an inner row backed
  into the dock doors, with a wide truck drive/apron between them. Dock doors run the full
  building length.
- **z20 NE gate:** controlled truck gate — channelized lanes with yellow crosshatch markings,
  barrier arms / bollards across the lanes, a small guard booth beside the lanes, and a
  landscaped median splitting the entrance. "STOP" pavement markings. A truck is visible on the
  adjacent public road.
- **Street View (2025-05) at the gate:** ground-level confirmation of the gated entrance —
  gate/barrier hardware (yellow + orange bollards/arms), a guard booth structure beside the
  lanes, and chain-link perimeter fencing running both directions along the property. The
  fulfillment building runs the length of the lane.

## Gate / guard-shack / dock determinations
- **truckGate: TRUE.** NE-corner controlled entrance off the north service road. Crosshatched
  channelization + barrier arms/bollards + perimeter fence, confirmed in both z20 satellite and
  2025-05 Street View.
- **guardShack: TRUE.** Small staffed guard booth (~1-2 vehicle footprint) beside the gate
  lanes, visible overhead and at ground level. (remoteGs therefore FALSE.)
- **postGateStaging: TRUE.** Large paved holding/yard-equipment area inside the gate, ahead of
  the dock apron (parked yard tractors + open paved staging).
- **dockDoors: 50+.** A continuous bank of dock doors spans the entire north building face with
  trailers backed in along its full length; estimated ~90 doors (count flagged uncertain).
- **dropArea / dropYard: 50+ / TRUE.** A dedicated outer row of tractor-less trailers staged
  along the north fence, distinct from the docked trailers.
- **fastLaneOpportunity: TRUE.** Wide gate apron with multiple channelized lanes and spare paved
  width — physical room to add an express/bypass lane.
- **drivewayLong: TRUE.** Deep gate-to-dock approach + wide internal drive stacks well over 3
  trucks.
- **entryExitTogether: TRUE.** Single gate group handles in/out (~2 in / ~2 out lanes, lane
  counts flagged uncertain).

## Yard zones & counts (estimates from overhead imagery)
- perimeter — full fenced property, oriented quad (~47.5 acres).
- truckGate — NE gate/guard-booth checkpoint quad.
- dropYards — one ring: outer north trailer drop row along the fence.
- dockAprons — one ring: long thin strip hugging the north dock wall.
- staging — post-gate paved holding/yard-equipment area east of the gate.
- yardMetrics: dockDoorCount ~90, trailersVisible ~75, trailerParkingCapacity ~110,
  truckGateCount 1, buildingCount 1, siteAreaAcres ~47.5, railServed false.

## Web findings
- BFI4 = 9th-gen Amazon Robotics fulfillment center, Kent WA, launched March 2016, robotics-
  sortable (ships sub-microwave-size items), operates 24h. Address corroborated across multiple
  business directories and Amazon's own tour/recruiting listings.

## Setting
- urbanRural: Urban — Kent industrial valley inside the Seattle metro, dense surrounding
  distribution/industrial fabric. connectivityIssue: false (metro, not isolated).

## Final confidence: HIGH
Building unambiguous, gate + guard booth confirmed at both overhead and ground level. Numeric
counts (dock doors, trailer capacity, lane counts) are honest overhead estimates and are flagged
in uncertainFields.
