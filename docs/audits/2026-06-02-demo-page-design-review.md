# /demo/[account] — Design Review & Redesign

**Date:** 2026-06-02 · **Scope:** `yardflow.ai/demo/<account>` (rewrites to modex-gtm `/demo/[account]`) + the `/demo` gallery. · **Method:** live walkthrough (Home Depot, Boston Beer) + full component inventory (`src/components/demo/*`) + CTA/metric/copy audit.

---

## 0. The core problem (one sentence)

The page tries to be a homepage, an audit report, a product brochure, an emotional demo, **and** an ROI calculator at the same time — so every metric, CTA, and proof point is shown 2–4× under competing ALL-CAPS headings, and the prospect never gets a single clear narrative or a single clear next step.

**The page's actual job:** convince a prospect that *we audited THEIR real network* and there is *quantified money on the table*, then get them to *book an audit*. Everything should serve that one funnel. Today ~24 distinct blocks compete for attention with no spine.

---

## 1. Atomic findings (what's wrong)

### A. Header is overloaded (the worst offender)
- **F1.** Before the first CTA, the header stacks **seven** label rows: breadcrumb (`All Industries · Retail · The Home Depot`), `AUDIT CONFIDENCE: HIGH · 22/22 FIELDS RESOLVED`, `YARDFLOW · YNS NETWORK AUDIT`, title, metrics line, an **orphaned "rail-served" wrapping onto its own line** (visual bug), and the `Public audit. Not affiliated…` disclaimer — *then* the tab toggle, *then* a `COVERAGE NOTE` paragraph. That's ~10 stacked text rows before any content.
- **F2.** Metrics line + coverage note say overlapping things: "30 of ~70 facilities" (metrics line) and "We audited 30 representative…facilities" (coverage note) restate the same scope twice, adjacently.
- **F3.** `AUDIT CONFIDENCE` stamp is desktop-only (`md:`), so mobile users never see the credibility signal — and it sits *above* the brand name, leading with jargon instead of the company.
- **F4.** Identity flips on referrer: direct visit says "YNS network audit"; `?from=gallery` says "industry template / sample demo." Same page, two identities.

### B. Redundant CTAs (21 total; 3 intents)
- **F5.** **"Book an audit" appears 4×** with 4 different labels: "Book a network audit →" (header), "Book audit" (mobile sticky), "Book a 30-min audit →" (replay), "Book a 30-min audit →" (simulator). No canonical label.
- **F6.** **ROI calculator appears 3×**: "Run ROI →" (header), "Open the full calculator →" (network-insight band), "ROI Calculator →" (simulator) — all to `/roi`, different UTMs/labels.
- **F7.** **"Read the memo" appears 2×** (header "Read the full memo", footer "See the full network memo →") — same destination, different label.
- **F8.** The header alone fires 4 CTAs (Memo, Share, Book, Run ROI) of equal visual weight — no primary action.

### C. Repeated metrics (same number, multiple places)
- **F9.** Network **dock doors / trailer spots / rail-served** render in the header *and* again in the simulator KPI strip — identical values, no added context.
- **F10.** **Site/facility count** appears 3× (header scope blurb, simulator KPI, atlas archetype-donut label) under 3 different labels ("facilities audited" / "Facilities (audited/total)" / donut count).
- **F11.** **ROI $ / payback** shown in the network-insight band *and* recomputed on `/roi` — prospect sees the headline number twice; per-site dock counts also repeat between header total, simulator, and the detail panel.

### D. Competing, vague section headings (no IA)
- **F12.** Four section intros use different vague verbs for overlapping ideas: `WHAT THIS MEANS` (detail panel), `WHAT THE AUDIT REVEALS` (friction band), `THE SYSTEM BEHIND THIS RUN` (replay modules), `Your network's friction profile…`. None tells the prospect where they are in a story.
- **F13.** ALL-CAPS micro-labels are everywhere (`WATCH THE RUN`, `DRIVER JOURNEY · ARCHETYPE #9`, `WITHOUT YNS · EXIT THROUGH GATE`, `FLAGSHIP RESULT · PRIMO BRANDS`, `MORE AUDITED NETWORKS`, `SIMPLE → COMPLEX` …) — they read as system chrome/noise, not hierarchy, and bury the few headings that matter.

### E. Jargon shown without definition
- **F14.** **"YNS" appears 40+ times** (mode toggles, "YNS saves", "YNS levers", "YNS network audit") and is **never expanded** on the page. New prospects don't know it = YardFlow Network Simulator/System.
- **F15.** Product module names (`flowGATE`, `flowTWIN`, `Yard Spot Mgt`, `Dock Mgt`, `Appointments`) appear only as a chip row in the replay, with inconsistent naming (two code-style, three prose) and no "what these are" framing.
- **F16.** `archetype #9`, classification field codes (`entryLanes`, `exitLanes`, dock/drop "bands"), and "modeled vs. read" boundary are surfaced raw to a sales audience.

### F. The replay (the emotional centerpiece) has layout problems
- **F17.** At desktop width the driver's-eye pane beside the map renders as a **large empty black box with a scrollbar** (the narration/delta is crammed below the map instead) — the single most important "aha" visual looks broken. *(verify in browser; reproduced on Home Depot at 1440px.)*
- **F18.** The replay is forced as a tall hero **above** proof that we audited the whole network — a single-site animation leads before the prospect knows it's *their* network.
- **F19.** Timeline labels shift with the toggle ("Under YNS" ↔ "Baseline"), so the comparison frame moves under the user.

### G. Detail panel overload (progressive disclosure done backwards)
- **F20.** The site detail panel stacks: zone Street View → `WHAT THIS MEANS` (3 bullets) → an 8-cell **Yard metrics** grid → a 9-cell **Classification** grid → collapsible field notes → low-confidence disclaimer → Google Maps link. Two dense grids of internal audit fields are shown by default to a buyer who needs 3 facts.
- **F21.** "What this means" (narrative) and the metric/classification grids restate the same yard facts twice (e.g., "high dock-door count" prose + `DOCK DOORS 220` cell + `DOCK BAND 50+` cell — three views of one fact).

### H. Proof / disclaimer inconsistencies
- **F22.** Primo Brands "48→24 min" flagship proof appears **twice within one scroll** (replay narration + network-insight proof box), diluting it.
- **F23.** Non-affiliation disclaimer is worded differently on the demo header vs. the gallery; the `$87.4M / 11.5×/ 50 sites` example figure in the simulator CTA can be misread as *the prospect's* number (no "example" caveat).

---

## 2. The recommended design — narrative spine

Replace the "everything, everywhere" layout with **one linear story, one job per section, one primary CTA.** Target order top→bottom:

| # | Section | The one job | Primary content | CTA |
|---|---------|-------------|-----------------|-----|
| 1 | **Identity bar** (slim, sticky) | Orient + persistent action | `← Industries` · brand · small confidence chip · **Book an audit** (primary) | Book audit |
| 2 | **Hero** | "We audited *your* real network, and it's worth $X" | Brand H1 + one scope line (`30 of ~70 facilities mapped from satellite`) + **the single headline number** (modeled annual $ opportunity) | Book audit (primary) · Run your ROI (secondary) |
| 3 | **The network (proof it's real)** | Show we mapped *all* their yards | The atlas map as centerpiece + coverage-honesty inline; click a pin → site detail | (none; exploration) |
| 4 | **One yard, up close (the friction)** | The emotional "aha" | The replay: one truck, gate→dock→exit, with the **single delta** (`1h16 → 46m, save 31m`) and a one-line "here's what removed it" | — |
| 5 | **What it's worth** | The money, in one place | Friction profile (the N-of-N signals) → modeled annual value + payback → calculator handoff | **Run your ROI** (primary here) |
| 6 | **Convert** | Close | Recap line + **Book an audit** + "Read the full memo" (secondary) | Book audit |
| — | **Site detail** (on map click) | Depth on demand | 3 headline facts + replay link; everything else behind "Show full audit detail" | — |
| — | **Related networks + nav** | Keep browsing | 3 cards + flick bar | — |

Tabs (Atlas / Simulator) collapse into this spine: the **Atlas is section 3**; the **Simulator becomes an optional "Stress-test the network" expander** under section 5 (it's a power feature, not a parallel mode the prospect must choose between on arrival).

---

## 3. Atomic recommendations (the fixes)

### Header / identity (fixes F1–F4, F8)
- **R1.** Collapse the 7 label rows to **3**: (1) slim breadcrumb+confidence chip, (2) brand H1 + one scope line, (3) one-line disclaimer. Move the coverage note inline next to the atlas (section 3), not the header.
- **R2.** Lead with the **company name**, not "YNS network audit." Confidence becomes a small chip next to the name, visible on mobile too.
- **R3.** Fix the orphaned "rail-served" wrap (F1) — render the metrics as a single non-wrapping inline list or a 3-stat row.
- **R4.** One **primary** CTA (Book an audit) + one secondary (Run ROI). Demote Share/Memo to text links. Drop the duplicate header metrics if they reappear in the simulator.
- **R5.** Kill the referrer-based identity flip — one identity ("a real audit of <brand>'s yard network"); keep the gallery "← back" affordance but not a different headline.

### CTAs (fixes F5–F7)
- **R6.** **One canonical label per intent**, repeated only where the funnel needs it: **"Book a 30-min network audit"** (hero + convert + sticky-mobile), **"Run your ROI"** (hero secondary + the worth section). Remove the simulator's third ROI button and the footer's second memo button (keep one memo link).
- **R7.** Standardize UTMs by section automatically; don't vary the visible label to differentiate analytics.

### Metrics (fixes F9–F11)
- **R8.** **Show each network metric once.** Dock doors / trailer spots / rail-served live in ONE stat strip (hero or atlas), not header *and* simulator.
- **R9.** **One ROI number, one place** (section 5). The hero may tease the headline $ but should link down to the same number, not recompute a different-looking one.
- **R10.** Per-site facts live only in the detail panel; the network totals live only at network level. No metric appears at both scopes without an explicit "this site vs. network" framing.

### Information architecture / headings (fixes F12–F13)
- **R11.** Replace vague headings with **story-step headings** that say where you are: e.g. *"1 · Your network, mapped"* (atlas), *"2 · Watch one yard run"* (replay), *"3 · What the friction costs you"* (worth). Remove `WHAT THIS MEANS` / `WHAT THE AUDIT REVEALS` / `THE SYSTEM BEHIND THIS RUN`.
- **R12.** **Retire the ALL-CAPS micro-label system.** Use a real type scale (section title / subtitle / label) and reserve caps for at most tiny eyebrow labels. The page should have ~5 headings that matter, not ~20 caps strings.

### Terminology (fixes F14–F16)
- **R13.** Define **YNS once**, on first use ("YardFlow Network Simulator — our yard operating system"), then use plain language ("with YardFlow" / "without YardFlow") for the toggles instead of "With YNS/Without YNS/Baseline."
- **R14.** Replace the module chip row with a single plain line ("Removed by: machine-vision gate check-in, RTLS yard twin, spotter dispatch, dock scheduling") — or move the product-module names entirely to the memo; the demo should sell the *outcome*, not the SKU list.
- **R15.** Hide raw audit codes (`archetype #9`, `entryLanes`, classification bands) behind the "Show full audit detail" disclosure; never lead with them.

### Replay (fixes F17–F19)
- **R16.** **Fix the empty driver's-eye pane** at desktop width (F17) — map + Street View should sit side-by-side and both fill; if no pano, collapse to a full-width map (don't leave a black void). Verify across breakpoints.
- **R17.** Move the replay **below** the atlas (section 4, after we've shown it's their whole network). Keep it auto-playing but shorter — it's the proof of the *mechanism*, not the opener.
- **R18.** Fix fixed comparison columns: always "Today" vs "With YardFlow" vs "You save" — never relabel based on toggle.

### Detail panel (fixes F20–F21)
- **R19.** Default the panel to **3 headline facts** + the "watch this yard" link. Put both dense grids (yard metrics + classification) and field notes behind one **"Show full audit detail"** disclosure.
- **R20.** Pick ONE representation per fact — either the prose insight ("coordination-heavy yard") **or** the metric cell, not both for the same attribute.

### Proof / honesty (fixes F22–F23)
- **R21.** Show the Primo "48→24 min" proof **once**, at the worth section, as the credibility anchor for the modeled number.
- **R22.** One consistent non-affiliation disclaimer string, shared by gallery + demo. Label example figures explicitly ("Example: $87.4M across a 50-site network") so they're never mistaken for the prospect's modeled value.

---

## 4. Net effect

- ~24 competing blocks → **6 story sections + on-demand depth.**
- 21 CTAs → **2 canonical** (Book audit, Run ROI) placed at 3 funnel moments.
- Each network metric and the ROI number shown **once**.
- ~20 ALL-CAPS labels → **~5 real headings**.
- "YNS"/module jargon **defined once or removed**; raw audit codes behind disclosure.
- The replay fixed and repositioned so the *aha* lands after the prospect knows it's their network.

**Suggested sequencing if implemented:** (1) quick wins — header collapse + orphaned-wrap fix + CTA dedupe + kill caps-noise + define YNS (low risk, high clarity); (2) IA reorder (atlas-before-replay, simulator-as-expander) + detail-panel disclosure; (3) replay layout fix + single-source metrics/ROI.
