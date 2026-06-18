# Walmart — FOV Verification Rejections / Flags

Run date: 2026-06-18 (verifiedBy: agent). 12 sites verified.

## Rejected sites

None. No site was found sold, closed, divested, idled, under-construction-only,
a retail store, or a Sam's Club. The two real traps for this account were checked
and cleared:

- **Walmart e-commerce FC closures (2024-2026)** — Walmart's closed-FC list is
  Swedesboro NJ, Pedricktown NJ, Worcester MA, Matteson IL, and Fort Worth TX.
  Neither McCordsville IN (05) nor Joliet IL (06) is on it. The Joliet "next-gen
  FC shutting" headlines were a conflation with **Matteson IL** (a different
  city); April 2026 trade press names Joliet as the operating model facility that
  Matteson's ops are being consolidated INTO. [Tier 2:
  https://www.supermarketnews.com/grocery-operations/walmart-shutters-two-ecommerce-fulfillment-centers, 2026-04]
- **Sam's Club vs Walmart** — the Williamsburg VA import campus (07) renders one
  careers posting under the Sam's Club banner. Sam's Club is a Walmart Inc.
  division running import volume on this campus, and the site is consistently
  identified as Walmart Stores Inc. Distribution Center 6088. Operator = Walmart
  Inc. (self). Not a standalone Sam's Club account site.

## Low-confidence / flagged (not rejected)

- **Walmart Regional DC 4047, Atlanta GA (09)** — PROBABLE, operator = 3PL,
  tenancy = leased. The pin (33.7146, -84.6001) and DC 4047 resolve to 6500 Trade
  Water Pkwy SW, Atlanta GA 30336 (west metro / Fulton Industrial corridor) — the
  pin is correct and is NOT a store and NOT the Sam's Club Lithia Springs FC.
  However, the operator at that exact address is **Americold Logistics** (3PL
  cold-storage), not a self-operated Walmart yard, and no Tier-1 Walmart
  self-attestation pins 4047 to this address (Tier-3 DC list + Indeed only).
  RE-PIN FLAG: treat as a 3PL-run perishables DC serving Walmart, capped at
  lower confidence; confirm operator before using as a self-operated-yard example.
  [Tier 3: https://www.americold.com/atlanta-ga-americold-logistics-atlanta-tradewater/, 2026-06]

## Operator / banner notes carried into the JSON

- **07 Williamsburg** — Sam's Club banner overlap on one careers posting; operator
  held as Walmart Inc. (self), tenancy unknown.
- **08 Eastvale** — Walmart Import DC 6060, 4250 Hamner Ave (Inland Empire import
  cluster). Strongest Tier-1 (city econ-dev) is ~2019; corroborated current by
  import records + DC list. Tenancy unknown.
- **11 Grantsville** — DC 7026 is the established 2005 GM DC; do NOT conflate with
  the separate 2022 Salt Lake City fulfillment center. Address rendered as both
  929 and 945 UT-138 across sources (same facility).
- **12 Conklin** — DC 4020 is the Walmart Regional DC on Broome Corporate Pkwy;
  do NOT confuse with the Lineage Logistics 3PL cold-storage in the same office
  park (101/215 Broome Corporate Pkwy).
- **01 Bentonville** — type nuance: older press calls 6094 the consolidated
  apparel/footwear DC; Walmart careers labels it "Supply Chain Regional #6094"
  (general merchandise). Either way a self-operated Walmart freight DC.
