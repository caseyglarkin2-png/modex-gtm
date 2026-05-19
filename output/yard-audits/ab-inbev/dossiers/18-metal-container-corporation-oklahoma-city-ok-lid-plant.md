# Deep-Audit Dossier — idx 18

## Metal Container Corporation - Oklahoma City OK Lid Plant

**Type:** Lid Manufacturing Plant
**Account:** AB InBev (`ab-inbev`)
**Resolved address:** 3713 Harmon Ave, Oklahoma City, OK 73179
**Best-estimate coords:** 35.425, -97.608 (EPA TRI point — exact building UNCONFIRMED)

## Step 0 — Facility confirmation (UNRESOLVED)

The roster supplied only city-level coordinates (35.4676, -97.5164) and no
street address. Web research resolved the facility to **3713 Harmon Ave,
Oklahoma City, OK 73179** — consistently confirmed across Yelp, Manta, CMac,
finduslocal, D&B, and the EPA Toxics Release Inventory (TRI facility
73179MTLCN3713H). The EPA TRI Explorer facility profile reports coordinates of
**lat 35.425, lng -97.608**, placing the facility in a SW Oklahoma City
industrial district near I-240, with a cross street of SW 36th St.

I probed that district extensively with satellite imagery (zoom 16-20) and
Street View (2024-2025 panos). The major buildings at and around the
EPA-recorded coordinate were identified as:

- **Veritiv** — a packaging distributor (large building with a curved-roof
  entrance canopy; signage and shipping/receiving wayfinding signs read
  "Veritiv"). NOT MCC.
- A **Walmart distribution center** (large DC, Walmart signage visible).
- **Self-storage complexes** (rows of small storage units east of the rail).
- **Multi-tenant spec warehouses** — generic dock-door warehouse buildings,
  one with a FedEx truck at a bay, no MCC signage.

None of these could be confirmed as the MCC OKC Lid Plant. The MCC OKC Lid
Plant is a major facility — producing ~40 million lids/day (~13 billion
annually), one of the largest lid plants in the world, operating since 1986
with an estimated 100-249 employees — and should be a distinct dedicated
manufacturing building. No such clearly-identifiable building was isolated at
or immediately around the EPA coordinate.

## What the key views showed

- The EPA TRI point lands on the SW corner of a gray-roofed industrial
  building with west-face dock doors and trailers, a rail line along its east
  side. Street View of that building shows individual multi-tenant dock bays
  (a FedEx truck present) — it reads as a generic spec warehouse, not a
  dedicated lid plant.
- The building I initially flagged as a manufacturing candidate (rooftop
  process equipment, curved-roof canopy) turned out, on Street View, to be
  Veritiv.
- S Harmon Ave at its residential segment (longitude ~-97.572) is purely
  residential — not a match; the industrial "Harmon Ave" segment is in the
  -97.608 district.

## Determination

Per the deep-audit prompt's "If you cannot locate the facility" guidance, idx
18 is recorded with **low confidence**. All 22 classification fields are listed
in `uncertainFields`; the JSON carries the EPA TRI coordinate as the best
location estimate, a nominal placeholder perimeter box, and zeroed
`yardMetrics`. `urbanRural` is set to "Urban" (the district is unambiguously
dense SW-OKC industrial fabric regardless of which exact building is MCC).

## Web findings

MCC OKC Lid Plant: Anheuser-Busch Metal Container Corporation aluminum-lid
plant, opened 1986 ("Dirty Thirty" founding crew), ~13 billion lids/year, one
of the largest lid plants in the world; address 3713 Harmon Ave, OKC 73179
(VeloCity OKC, AB newsroom, EPA TRI). Active facility — but its exact building
footprint could not be visually confirmed.

## Final confidence

**low.** Facility address known and district located, but the exact building
could not be positively identified from imagery. Flagged for human review —
recommend OKC parcel/GIS lookup of 3713 Harmon Ave or a direct facility
contact.

### 3-line summary
- Gate verdict: UNDETERMINED — exact MCC building not identified.
- Guard-shack verdict: UNDETERMINED — exact MCC building not identified.
- Confidence: low — flagged for human review.
