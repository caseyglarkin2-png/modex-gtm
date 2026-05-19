# idx 17 — Universal Logistics Huntsville Contract Logistics Warehouse — Huntsville/Madison, AL

**Facility:** Universal Logistics - Huntsville Contract Logistics Warehouse
**Type:** Contract Logistics / Value-Added Warehouse
**Resolved address:** 7049 Greenbrier Pkwy NW, Madison, AL 35756 (Polaris Industries plant) — confirmed by address evidence; building footprint NOT visually locked
**Confidence:** Low — flagged for human review

## Location resolution — PARTIALLY RESOLVED

The roster supplied no address/coordinates; the source was an Indeed locations list noting a Universal Logistics Huntsville AL facility "near Mazda Toyota Manufacturing."

Research produced a better-supported attribution:

- **Operator + customer + address confirmed.** Universal Logistics runs an active Huntsville-area contract-logistics / value-added warehouse operation, and multiple business listings and Universal job postings give the work address as **7049 Greenbrier Pkwy NW, Madison, AL 35756** — the **Polaris Industries** ATV/ORV manufacturing plant. A Snagajob listing ("Universal Logistics Holdings Warehouse Associates - Huntsville") and a dedicated "Universal Logistics - Huntsville" Facebook page confirm the operation; Universal/ZipRecruiter list active Huntsville dock/warehouse hiring.
- **Customer correction.** The roster guessed "near Mazda Toyota Manufacturing," but the address evidence points to the **Polaris Madison plant**, not MTM. Universal does serve MTM through its **Tanner, AL** facility (idx 14, separately audited at 5271 Endeavor Way, SouthPoint Business Park). idx 17 is a distinct operation — value-added / line-feed logistics at/for the Polaris plant.

## Why the building could not be locked

Repeated satellite probes were run across Greenbrier Pkwy NW, the Madison/Limestone County industrial corridor, the I-565 Greenbrier interchange, and the Madison industrial areas. High-resolution coverage in this corridor is sparse, and coordinate estimates for "Greenbrier Pkwy NW" consistently landed in farmland or unrelated commercial/residential development. The specific Polaris building (and the dock/yard layout of Universal's operation within or beside it) could not be positively isolated.

Per the deep-audit methodology's explicit warning against auditing the wrong building, no geofence or yardMetrics were fabricated. The `.json` carries the verified address in `fieldNotes` but leaves geofences `null`/`[]` and `yardMetrics` zeroed.

## Output

`confidence: "low"`, all 22 classification fields in `uncertainFields`, classification values are best-guess defaults only (open-site / no-gate is typical for a Tier-1-plant value-added warehouse; corridor is Rural). These must not be relied on.

## Recommendation

This site is the most resolvable of the address-less idx 13/15/16/17 set — the street address (7049 Greenbrier Pkwy NW, Madison AL 35756 / Polaris plant) is firm. A human with a working Google Maps / geocoding lookup can lock rooftop coordinates for that address in seconds and then re-run the imagery audit. Confirm whether Universal's operation occupies the Polaris building itself or an adjacent leased warehouse.

## Final confidence: Low (address confirmed; building footprint unverified)
