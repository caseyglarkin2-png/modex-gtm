# Allentown corridor contact-sourcing — brief for the clawd session

**Goal:** keep the Breinigsville tour-invite outreach flowing. Source decision-maker
contacts at the closest uninvited corridor accounts (free, no Apollo), domain-check
them, and stage them as `allentown-tour` drafts in Casey's modex Outbox for review +
send. Knock out the 8 closest now, then work down the list so the Outbox never runs dry.

**Division of labor:** clawd sources + domain-checks + stages. Casey reviews + sends in
the Outbox. modex (this doc) supplies the ranked worklist + the staging conventions.

## Constraints
- **No Apollo credits for ~2 months.** Source via free web research + email-pattern
  inference (the same no-Apollo multi-agent pattern that tagged the TAM). No paid enrichment.
- **Free domain check is required** before staging (the KDP lesson): confirm the email
  domain is the company's real corporate domain via a DNS/MX lookup + a quick web check of
  the company's actual domain. The first batch emailed `jamie.taylor@kdrp.com`; KDP's real
  domain is `keurigdrpepper.com`, and that invite went nowhere. Skip or flag any contact
  whose domain doesn't resolve or doesn't match the company's verified domain.

## Who to target per account
The senior ops decision-maker (VP / Director / SVP of Operations, Supply Chain,
Distribution, or Logistics) AND the local Lehigh Valley site GM / DC manager where one
exists. Local site leaders convert best for a "20 minutes away, come see it" tour.
One to two contacts per account.

## Worklist (proximity to the live Primo sites)

### Wave 1 — the 8 closest, do first
| # | Account | mi | Notes |
|---|---|---|---|
| 1 | DHL Supply Chain | 0.8 | closest of all; /for/dhl-supply-chain already built |
| 2 | FedEx | 1.4 | /demo + /for exist |
| 3 | Amazon | 1.4 | /demo + /for exist |
| 4 | Coca-Cola | 2.0 | /demo + /for exist |
| 5 | Blue Eagle Logistics | 2.4 | regional 3PL |
| 6 | DSC Logistics (now CJ Logistics) | 2.6 | /for/cj-logistics-america exists |
| 7 | Target | 2.6 | /demo + /for exist |
| 8 | XPO | 3.0 | LTL carrier; yard audit exists |

### Wave 2 — next tier-A by proximity
Owens & Minor (2.7), Kenco Logistics (4.5), Onvo (5.1), Cornerstone Organic Feed (5.7),
Multicell (7.0), Bison Transport (7.5), IKEA (12.4), Saia (15.3), Walmart (16.5),
ABF Freight (17.2), Kimberly-Clark (17.4), Hershey (17.6), PPG Paints (19.1),
R+L Carriers (23.6).

### Wave 3 — close tier-B (optional, lower ICP)
East Penn Manufacturing (1.1), SunOpta (1.3), Congdon Hill Warehouse (0.9),
BMS Logistics (2.2), Silgan (2.3), Jacobson Warehouse (2.3), ABC Fulfillment (2.4),
Kane Logistics (3.1), McCain Foods (4.0), WSI (4.2), GHG Logistics (4.4), Behr Process (5.0).

### Do NOT source (excluded)
- **BlueTriton Brands** — that is Primo / our own footprint.
- **Niagara Bottling** — water bottler, a Primo competitor; awkward to walk through the Primo site.
- **Nestlé** — former Primo parent, too sensitive.
- **NFI, Old Dominion** — warm / contacts already in hand; Casey owns these directly.
- Anyone at the **25 already-invited accounts** (UNFI, Home Depot, Walgreens, KDP, Redner's,
  Ryder, Kuehne+Nagel, Penske, Uline, Wakefern, Geodis, Bridgestone, Packaging Corp, Crete,
  Ocean Spray, KeHE, Lineage, Utz, Red Bull, Fastenal, Americold, ALDI, US Foods, Estes, J.B. Hunt).

## Dedup (hard rule)
Before staging, skip any `to_email` already present in `DraftQueueItem` (any campaign) or
already in `EmailLog` as sent. Do not double-touch.

## Staging conventions (match the 20 already sent)
Create one `DraftQueueItem` per contact:
- `campaign_tag`: `allentown-tour`
- `image_url`: `https://yardflow.ai/og/yardscan-demo.jpg` (the YardScan demo photo)
- `status`: `draft`
- `source`: `clawd`
- `owner` / `created_by`: `casey@freightroll.com`
- a fresh UUID `idempotency_key`

### Email template (match Casey's voice exactly)
Subject: `A live yard running in eastern PA` — or for a local Lehigh Valley contact,
`Minutes from your <City> yards`.

Body:
```
Hi <First>,

We are live with YardFlow at the Primo Brands site in Breinigsville PA, <proximity clause>, so this is in your footprint.

The yard is usually the quiet cap on <how much a DC can actually move | how much a plant can actually move | how many trucks a terminal can turn>. Primo lifted realized capacity 5 percent from the driver-journey layer alone, on flat headcount, before the full yard system went in. Autonomous yard-spotter dash-cam keeps every trailer current, machine-vision gate check-in and out, no guard shack and no clipboard.

Worth a look at how it runs, then deciding if it is worth putting a couple cameras in one of your PA yards to prove it in your lane?

Casey
```
- proximity clause: local → `and your <City> operation is right down the road`; else → `and you run distribution across the region`.
- capacity phrase: 3PL/retail/distributor → "how much a DC can actually move"; manufacturer → "how much a plant can actually move"; carrier (XPO, Saia, ABF, R+L, Bison) → "how many trucks a terminal can turn".

### Voice rules (non-negotiable)
No em dashes. "Yards" always plural. Say "realized production capacity", never "throughput".
EZ-Pass / the machine-vision gate is YardFlow's product, never the account's. No fabricated
metrics; the only numbers are Primo's real results (48 to 24 min, 5% on flat headcount).

## Done
Wave 1's 8 accounts staged in the Outbox as deliverable-domain drafts, deduped, on the
template above. Then Wave 2 in proximity order, in batches, continuously.
