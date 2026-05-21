# Deep-Audit Dossier — idx 26

## Reyes Coca-Cola Bottling — Rancho Cucamonga Bottling & Distribution Center, CA

**Resolved address:** 10670 6th St, Rancho Cucamonga, CA 91730
**Best-estimate center:** 34.0824, -117.5530 (NOT confirmed)
**Confidence:** low — facility under active demolition/reconstruction

### Status — facility under construction

This site **cannot be given a stable yard audit** because the facility is in
the middle of a full demolition-and-rebuild. Multiple 2026 news sources confirm:

- Reyes Coca-Cola Bottling **broke ground in February 2026** on a complete
  demolition and reconstruction of its Rancho Cucamonga facility.
- The existing **125,000 sq ft distribution building (built 1984)** at
  10670 6th St is being torn down and replaced.
- The new facility will be a **620,000+ sq ft production + distribution
  campus** occupying about one city block, with 4 production lines, expanded
  break/training rooms, a parking garage with EV charging, and a recycling
  center.
- It will be the first new Coca-Cola production facility built in California
  in nearly 60 years; a ~$500M investment producing ~30M cases/year.
- **Construction runs through 2027.** Operations are **temporarily relocated to
  Fontana, CA** during construction.

The auditable operating yard therefore does not currently exist in a stable
form, and the new campus's as-built gate/dock/yard layout is unknown.

### Step 0 — Location resolution

- Roster supplied "11251 6th St" and coords 34.084004, -117.559144.
- The correct address per the Rancho Cucamonga Chamber of Commerce, Waze,
  TruckMap and multiple business directories is **10670 6th St, Rancho
  Cucamonga, CA 91730** (phone 909-980-3121).
- 6th St was confirmed via Street View as a 4-lane divided arterial running
  E-W through the industrial district north of Ontario Mills, at ~lat 34.0845.
  10670 6th St lies east of Milliken Ave (~-117.5555).
- The exact parcel could **not** be unambiguously pinned within the dense 6th
  St warehouse corridor: no Coca-Cola signage was found in Street View, and the
  current 2026 satellite imagery still shows intact warehouses (likely captured
  before the February 2026 demolition began). No clearly-imaged demolition site
  was resolvable.

### Key views

Extensive satellite and Street View probing of the 6th St industrial corridor
(Milliken Ave east toward I-15) showed a dense cluster of large tilt-up
distribution warehouses — none distinguishable as the Coca-Cola parcel or as an
active demolition site. The roster coordinates landed on an unrelated
retail/residential arterial.

### Gate / guard-shack / dock determinations

Not determinable. All physical-layout classification flags are left
`false`/`null` and listed in `uncertainFields` because there is no stable
facility to classify mid-demolition.

### Yard zones and counts

Not measurable. `perimeter` is an estimated one-city-block box per the news
description ("about one city block," 620,000+ sq ft); `truckGate`, `dropYards`,
`dockAprons`, `staging` left null/empty. `yardMetrics` set to 0 / defaults.

### Web findings

- Reyes Coca-Cola newsroom: "RCCB breaks ground on new industry-leading
  manufacturing and distribution center in Rancho Cucamonga."
- IE Business Daily, PRNewswire, BeverageDaily, Connect CRE: $500M investment,
  620,000 sq ft, demolition/rebuild of the 1984 facility at 10670 6th St,
  completion 2027, operations temporarily in Fontana.

### Final confidence: low

The facility is positively identified by name and address but is an active
demolition-and-reconstruction site as of May 2026. Its stable operating yard
does not currently exist, and the exact parcel could not be unambiguously
located in imagery. **Recommend re-auditing after the new campus completes
(expected 2027).**
