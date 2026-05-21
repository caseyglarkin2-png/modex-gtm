# UNFI — Vernon CA DC (Los Angeles) — Yard Audit Dossier

**Roster idx:** 25
**Facility:** UNFI Fresh / Albert's Organics West Division — Los Angeles produce & specialty DC
**Address:** 2724 Leonis Blvd, Vernon, CA 90058
**Locked coordinates:** 33.99940, -118.22170
**Confidence:** Medium

---

## Location resolution

The roster supplied only city-level, APPROXIMATE coordinates (34.003903,
-118.230073) — these landed ~1km NW in the generic Vernon industrial grid, on
no UNFI property. Web research identified the UNFI presence in Vernon as
**Albert's Organics West Division**, the UNFI Fresh certified-organic produce
distributor, at **2724 Leonis Blvd**. That address geocoded ROOFTOP to
33.99958, -118.22139. Street View along Leonis Blvd (heading 180° from the road
pano) shows the building's street number **"2724"** on the office facade —
a positive identity confirmation. The locked building center is ~33.99940,
-118.22170, the warehouse immediately south of Leonis Blvd.

---

## What the imagery showed

- **Overview (z17-18):** A single mid-size warehouse on a tightly-built Vernon
  infill parcel, fronting Leonis Blvd with a small office facade. Vernon is the
  densest concentration of industrial parcels in Los Angeles County — every lot
  here is built nearly wall-to-wall.
- **Tight satellite (z19-20):** The warehouse has a sawtooth-skylight roof
  section and a bank of **large rooftop refrigeration condenser units** (rows of
  circular evaporator fans) — unambiguous evidence this is a refrigerated
  produce / specialty DC, consistent with Albert's Organics' organic-produce
  book.
- **Rail:** An active rail spur curves tightly along the building's **south and
  west edges**, running right against the warehouse wall — a legacy Vernon
  industrial siding. `railServed` = true.
- **Dock side:** Loading doors face east into a small paved court; ~22 doors
  estimated (band 10-25). A handful of trailers park in the east court; there is
  no dedicated drop lot.

---

## Gate / guard-shack / dock determinations

- **truckGate = false.** No controlled truck entrance. The warehouse meets the
  street with an open driveway and dock apron. No barrier arm, sliding gate, or
  checkpoint pinch-point is visible at z19-z20 or in any Street View heading
  along Leonis Blvd. This is the standard open-parcel Vernon configuration.
- **guardShack = false.** No booth structure at any driveway.
- **remoteGs = false** — there is no gate, so no kiosk/call-box inference.
- **dockDoors = "10-25"** — ~22 doors on the east face.
- **dropArea = "0-10"** — minimal trailer parking in the small east court.

---

## Yard zones and counts

- **Perimeter:** ~4-acre compact single-building parcel. The perimeter box is an
  estimate — this is a tightly-built infill lot with no fenced setback.
- **Dock apron:** the east-side strip in front of the dock bank.
- **Drop yard / staging:** none meaningful — a tight urban site.
- **dockDoorCount ~22, trailersVisible ~6, capacity ~12, buildingCount 1,
  railServed true.**
- **drivewayShort = true / backupSensitive = true:** Leonis Blvd is a busy
  Vernon arterial; the dock apron holds only 1-2 trucks and any queue would back
  directly onto the public road.

---

## Web findings

Albert's Organics (acquired by UNFI in 1998) is the first nationwide certified-
organic distributor and operates regional DCs including a California (Vernon)
West Division facility. The Vernon site is the LA-metro produce/specialty hub of
the UNFI Fresh network — refrigerated, high-SKU, brittle-supply organic produce
— rather than a large conventional-grocery consolidation DC.

---

## Final confidence

**Medium.** The building is positively identified by the "2724" Street View
streetnumber and the rooftop geocode. Confidence is held at medium (not high)
because dock/trailer counts on a dense urban reefer building are imprecise from
overhead imagery and the parcel perimeter is estimated. The gate verdict (open,
no control) is high-confidence — clearly visible from multiple Street View
headings.
