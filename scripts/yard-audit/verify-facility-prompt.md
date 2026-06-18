# Facility Verification Protocol (Step -1)

Run this BEFORE any imaging, geofencing, or classification. Its only job:
**prove the account operates this exact facility, today.** If you cannot, the
site does not get audited and does not ship.

The real failure this prevents: a "GM parts plant in Jacksonville" was mapped
and slated for audit, but GM divested that site ~15 years ago in the 2009
bankruptcy (assets went to Motors Liquidation / RACER Trust). It is not GM's.
A current-operations audit of a divested, closed, sold, idled, or phantom site
is a lie shipped to a prospect. Catch it here.

You run this per-site, for EACH candidate facility, and emit a `verification`
JSON block (exact shape at the bottom) with a `verdict` of `confirmed`,
`probable`, or `rejected`, backed by at least one cited source.

---

## Source hierarchy

Rank every source you find. A higher tier outranks lower tiers. Lower-tier
sources can corroborate but never overrule a credible higher-tier signal.

### Tier 1 — self-attested, current (one good hit can CONFIRM)
These are the company telling you, on the record, that it operates the site now.
- **Latest 10-K / 20-F, Item 2 "Properties"** — the company's own SEC filing of
  its operating facilities. Proves: self-attested current ownership/lease of the
  site or region. Failure mode: lists by region/segment, not street address;
  may lag a recent sale by up to a year — cross-check against Tier 2.
- **The company's own facility / plant / store / DC locator** containing the
  EXACT address, on the company's own domain. Proves: current operation.
  Failure mode: stale cached pages; franchisee/dealer locators that list
  independently-owned sites (not company-operated).
- **Active careers requisitions at that address** on the company domain (or its
  official ATS). Proves: the company staffs the site now. Failure mode: remote
  reqs tagged to a metro; reqs at a nearby different site.
- **Dated company PR / investor material naming the operating site** (earnings
  deck, ribbon-cutting, press release). Proves: operation as of that date.
  Failure mode: announcement of a FUTURE site (under construction) reads as
  current if you ignore the date and tense.

### Tier 2 — the change-event / divestiture detectors (negatives that REJECT)
These find the sale, closure, or idling. A credible Tier-2 negative of ANY age
forces the verdict toward `rejected`, even against a stale Tier-1 positive.
- **8-K or press on a sale / closure / divestiture / idle** of the site.
  Proves: the account no longer operates it. Failure mode: a sale that later
  fell through — confirm it closed.
- **State economic-development announcements + WARN Act layoff notices** for the
  site/city. Proves: mass layoff or shutdown at that address. Failure mode:
  partial layoff (site still runs) — read the notice.
- **Reputable trade press dated to the event** (industry outlet covering the
  closure/sale). Proves: the change happened. Failure mode: rumor/speculation
  pieces — require a dated, sourced report.

### Tier 3 — corroborating only (NEVER sufficient alone)
- **Satellite signage + imagery capture date** (from the probe). Corroborates:
  who is on the building now, and when the picture was taken. Limit: a sign can
  be stale or freshly changed; capture date can be years old.
- **Property / parcel / assessor records.** Corroborates: legal owner. Limit:
  **owner ≠ operator** — a REIT/landlord owns; the account may lease.
- **Google Maps / Places listing.** Corroborates: a name at a pin. Limit:
  crowd-edited, frequently wrong/stale.
- **Aggregators — D&B, Apollo, Wikipedia, ZoomInfo, etc.** Corroborates a hunch
  only. **Never a citation of record.** Do not cite these in `citations`.

---

## The protocol

### V0 — Resolve the operating legal entity
Determine WHO actually operates this address. Acquisitions and divestitures
detach brands from sites: the brand on your list may now be run by a co-packer,
a new owner, or a spun-off entity. Ask: is this still the account's site, or a
former site now under a different operating company? Pin the operating legal
entity before you search anything else.

### V1 — Positive current-operation search
Find at least one **Tier-1** source for THIS exact address. Record its `url` and
`date`. Searches like:
- `"<account>" "<full street address>"`
- `"<account>" "<city>" plant OR "distribution center" OR DC OR facility`
- `<account> facility locator` / `<account> plant locations`
- `"<account>" careers "<city>"`
- `<account> 10-K "Item 2" properties`

### V2 — The divestiture / closure gauntlet (run ALL of these)
Substitute the account, city, and site name. Run every query — do not stop at
the first clean result. A credible hit on ANY of these forces re-evaluation
toward `rejected`.
- `"<account>" sells OR sold "<city>" plant OR DC`
- `"<account>" closes OR closed OR shuttered "<city>"`
- `"<account>" divests OR "spun off" "<city>"`
- `"<account>" "<city>" WARN notice layoff`
- `"<account>" "<city>" idled OR "ceased production"`
- `"<site name>" now owned by OR acquired by`
- **MANDATORY bankruptcy-era check** (for any company that went through a major
  restructuring — GM / Chrysler 2009, Motors Liquidation, RACER Trust, and
  similar):
  `"<account>" "<city>" 200X bankruptcy divest OR "old GM"`
  (substitute the real restructuring year for `200X`; for GM/Chrysler use 2009).
Set `checkedDivestiture: true` once you have run the gauntlet, and
`checkedBankruptcyEra: true` once you have run the bankruptcy-era query.

### V3 — Imagery date + signage sanity
Read the capture date off the probe imagery (the `sv` probe prints the pano's
capture date; note the satellite vintage too). Record it in `imageryDate`.
Hard flags — any of these pushes toward `rejected`:
- vacant lot / empty building,
- demolished / cleared site,
- re-signed for a DIFFERENT company,
- now a parking lot, retail, or unrelated use.

### V4 — Owner-vs-operator disambiguation
- A REIT / 3PL / SPV OWNS the building but the ACCOUNT OPERATES it → **OK**.
  Tag it: `tenancy: "leased"` and, if a third party runs it on the account's
  behalf, `operator: "3PL"`.
- A DIFFERENT operating company is at the address (not running it for the
  account) → **reject**.
Do not let a parcel record showing a landlord trick you into rejecting a site
the account genuinely operates under lease.

### V5 — Adjudicate
- **confirmed** — at least one **Tier-1 positive dated within ~24 months**, AND
  no credible Tier-2 negative, AND imagery is consistent with current operation.
- **probable** — no clean Tier-1, but **multiple Tier-3 sources agree** and there
  is **no Tier-2 negative**. Ships **caveated and capped** (lower confidence).
- **rejected** — ANY of:
  - a credible **Tier-2 negative of any age** (sold / closed / divested / idled /
    WARN shutdown / bankruptcy-era divestiture),
  - a **different operating company** at the address,
  - **no positive** found after a genuine Tier-1/Tier-3 search,
  - imagery shows **vacant / demolished / re-signed**,
  - the site is **future / under construction** (this is a current-ops audit),
  - the site is **idled / ceased production**,
  - it is a **non-freight HQ / R&D / office** (no yard to audit).

---

## Ambiguity rules

| Situation | Action |
|---|---|
| Leased from a REIT/landlord, account-operated | **INCLUDE**, `tenancy: "leased"` |
| 3PL runs the yard for the account, verifiable | **INCLUDE** (caveated), `operator: "3PL"` |
| Co-pack / co-manufacturer site (someone else makes the product) | **EXCLUDE** |
| Divested brand now under a new owner | **EXCLUDE** |
| JV the account does not operate | **EXCLUDE** |
| Announced / under construction | **EXCLUDE** (current-ops audit only) |
| Idled / ceased production | **EXCLUDE** |
| Non-freight HQ / R&D / corporate office | **EXCLUDE** |

**Default: EXCLUDE unless the site is verifiably current AND account-operated.**

---

## Output

Emit this exact block (it matches the Zod schema). `operator` is `"self"` or
`"3PL"`; `tenancy` is `"owned"` or `"leased"`. `citations` carries at least one
entry (its `tier` is `1`, `2`, or `3`; Tier-3 aggregators are never cited).

```json
"verification": {
  "verdict": "confirmed",
  "operator": "self",
  "tenancy": "leased",
  "citations": [{ "tier": 1, "url": "...", "date": "2026-02-14", "type": "10-K Item 2", "claim": "lists this site/region" }],
  "imageryDate": "2024-08",
  "checkedDivestiture": true,
  "checkedBankruptcyEra": false,
  "rationale": "one line",
  "verifiedBy": "agent",
  "verifiedAt": "2026-06-18"
}
```

### If verdict = rejected
Do NOT image, geofence, or classify the site. Append a line recording the
slug, the site, and the reason to:

`output/yard-audits/<slug>/verification-rejections.md`

(create the file/parent dir if needed), then STOP for this site. Example line:

```
- <site name> (<city>, <address>) — REJECTED: GM divested this plant in the
  2009 bankruptcy (assets to Motors Liquidation / RACER Trust). [Tier 2: <url>, <date>]
```

Only `confirmed` and `probable` sites proceed to Step 0, and they must carry the
`verification` block in their audit JSON.
