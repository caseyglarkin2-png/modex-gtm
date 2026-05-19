# idx 16 — Universal Logistics San Antonio Contract Logistics Warehouse — San Antonio, TX

**Facility:** Universal Logistics - San Antonio Contract Logistics Warehouse
**Type:** Contract Logistics / Value-Added Warehouse
**Resolved address:** NOT RESOLVED — no discrete building confirmed
**Confidence:** Low — flagged for human review

## Location resolution — UNRESOLVED

The roster supplied no address and no coordinates; the source was an Indeed locations list noting a Universal Logistics San Antonio TX facility in the automotive-supplier corridor near Toyota Motor Manufacturing Texas (TMMTX).

A genuine multi-angle effort was made:

- **Universal Logistics' San Antonio presence is real.** Indeed and Glassdoor list Universal Logistics San Antonio job openings, and Universal's value-added **sequencing** service line (picking and presenting model-specific parts to the line-side in correct sequence) is explicitly aimed at automotive OEM plants — consistent with the roster's TMMTX note.
- **But no discrete building can be tied to Universal.** No public source — company pages, news, CRE listings, FMCSA SAFER results — links Universal/LINC to a specific San Antonio street address or building. Searches for a Universal facility on Applewhite Rd (the road serving TMMTX) returned only the Toyota plant and the Universal **Toyota car dealership** (an unrelated business at 12102 I-35, ruled out).
- **Likely operating environment.** TMMTX (1 Lone Star Pass, off Applewhite Rd, south San Antonio) is distinctive for integrating **20+ on-site suppliers on the same campus — some under the same roof** — plus a ~500,000 sq ft facility between the main plant and Applewhite Rd, and an adjacent supplier-logistics corridor. Universal's San Antonio sequencing / value-added operation most plausibly runs **inside the Toyota campus** or in a leased corridor warehouse — neither carrying an independent, publicly-mappable Universal street identity.

## Why this matters for the audit

A sequencing operation that runs inside an OEM campus building has no separable footprint. Auditing the Toyota plant itself, or an unrelated corridor warehouse, would produce a confidently-wrong classification — which the methodology explicitly warns against.

## Output

Per the deep-audit instructions for an unlocatable facility: the `.json` is written with `confidence: "low"`, every classification field listed in `uncertainFields`, geofences `null`/`[]`, and `yardMetrics` zeroed. `urbanRural` is set to Urban (south San Antonio metro). The classification values are best-guess defaults only and must not be relied on.

## Recommendation

Resolve via a primary source before classifying: a current Universal Logistics San Antonio job posting with an in-person apply address, an FMCSA SAFER physical-address record for the operating subsidiary, or direct confirmation from Universal of the San Antonio operating building (including whether it sits inside the TMMTX campus footprint).

## Final confidence: Low
