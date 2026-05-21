# idx 13 — Universal Logistics Vance Value-Added Facility — Vance, AL

**Facility:** Universal Logistics - Vance Value-Added Facility
**Type:** Value-Added Logistics / Sequencing Warehouse
**Resolved address:** NOT RESOLVED — no discrete building confirmed
**Confidence:** Low — flagged for human review

## Location resolution — UNRESOLVED

The roster supplied no address and no coordinates for idx 13; the only source was an "Indeed locations list" entry showing Universal Logistics has a Vance, AL presence serving the Mercedes-Benz U.S. International (MBUSI) assembly plant.

A genuine multi-angle effort was made:

- **Universal Logistics presence in Vance is real.** Universal Logistics Holdings posts Vance/Brookwood AL job openings — a "Warehouse Supervisor — Vance, AL" listing (Salary.com archive, Nov 2021) and Glassdoor "Universal Logistics Holdings Jobs in Vance." Universal's corporate materials describe automotive value-added services (sequencing, sub-assembly, kitting, returnable-container management) and the Vance corridor is squarely automotive-supplier territory.
- **But no discrete building can be tied to Universal.** The publicly-named MBUSI on-site / supplier-park logistics partners are **BLG Logistics** (operates the "Supplier Logistics Center Vance"), **ARD Logistics-Alabama**, and **Schnellecke Logistics**. Universal/LINC does not appear in any public source as a named MBUSI sequencing LSP at a specific address. Mercedes' own Will Walker Road parts/sequence facility (~530,000 sq ft, built 2021) and the MLC at 11019 M-Class Blvd are Mercedes-controlled buildings; their operators in public reporting are Penske, Schnellecke, and Celadon historically, not Universal.
- **Imagery reviewed but not conclusive.** Satellite probes of the MBUSI plant complex, the Will Walker Road logistics-warehouse corridor (~33.184, -87.272 — several large DCs), and the Vance/Brookwood industrial cluster south of I-20/59 show numerous candidate large warehouses, but none can be positively attributed to Universal Logistics. Universal most plausibly runs a value-added/sequencing **line inside** an MBUSI-owned or supplier-park building (a sub-tenant operation that would not carry its own street identity), or operates a leased warehouse in the broader Brookwood/Cottondale corridor.

## Why this matters for the audit

A value-added/sequencing operation that runs inside an OEM-controlled or third-party-leased building is exactly the kind of facility that has no independently-mappable footprint. Auditing the wrong building (a BLG, ARD, or Schnellecke warehouse, or the Mercedes plant itself) would produce a confidently-wrong classification, which the methodology explicitly warns against ("do not audit the wrong site").

## Output

Per the deep-audit instructions for an unlocatable facility: the `.json` is written with `confidence: "low"`, every classification field listed in `uncertainFields`, geofences `null`/`[]`, and `yardMetrics` zeroed. The classification values are best-guess defaults only (open-site / no-gate is typical for OEM supplier-park value-added warehouses, corridor is Rural) and must not be relied on.

## Recommendation

Resolve via a primary source before classifying: a current Universal Logistics Vance job posting with an in-person apply address, an FMCSA SAFER record for the operating subsidiary at a Vance physical address, or direct confirmation from Universal/LINC of the Vance operating building.

## Final confidence: Low
