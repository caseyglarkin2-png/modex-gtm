# /demo/[account] Redesign — Design Spec

**Date:** 2026-06-02 · **Status:** Approved (brainstorm) → ready to plan/build
**Diagnosis:** see `docs/audits/2026-06-02-demo-page-design-review.md` (23 atomic findings).
**Surface:** `yardflow.ai/demo/<account>` → rewrites to modex-gtm `/demo/[account]` (`src/app/demo/[account]/page.tsx` + `src/components/demo/*`).

## 1. Goal & positioning (decided)
The demo is a **cold-email asset whose job is to provoke a reply.** It promotes a category reframe: most prospects carry a **siloed-yard-process mindset** (gate, dock, spotter, gate-out as separate tasks/tools) and don't realize the cost lives *between* those steps. The page must:
1. **Recognition** — "we mapped *your* real yards from satellite" (uncanny, personalized).
2. **Reframe** — name the invisible problem: the siloed yard.
3. **Proof** — show the cost in one of *their* yards (the replay).
4. **Shift** — present the novel solution frame: one orchestrated flow (YardFlow / YNS).
5. **Scale** — the silo tax across their network = $X.
6. **Reply** — a low-friction response, not a hard booking.

**Audience:** both cold self-serve (the harder case — design for it first) and rep-guided walkthrough. → self-serve clarity with depth on demand.

**CTA hierarchy:** primary = low-friction reply ("Is this your yard?" / "Start a conversation"); secondary = "Run your ROI"; tertiary text link = "Read the full memo". One canonical label per intent.

**Approach:** A + C's discipline — a reframe-led scrolling narrative, kept punchy, with the network atlas promoted to the recognition hero and the simulator + per-site detail demoted to depth-on-demand. Nothing valuable removed — resequenced.

## 2. Narrative spine (target IA, top → bottom)
| # | Section | Job | Key content | CTA |
|---|---------|-----|-------------|-----|
| 0 | Slim sticky bar | Orient + persistent action | `← Industries · <Brand> · confidence chip` | **Is this your yard?** (primary) |
| 1 | Recognition hero | "We mapped *your* network" | H1 "We mapped all N of <Brand>'s yards — from satellite" + one scope line + disclaimer + **the network atlas as the hero visual** | Is this your yard? · See the full audit ↓ |
| 2 | The reframe (NEW) | Name the invisible problem | "Your yard isn't one system. It's five handoffs that don't talk." + a 5-silo broken-chain diagram + "the time is lost *between* the steps" | — |
| 3 | Proof in their own yard | Make the cost concrete | The replay (FIXED layout), one site: `Today 1h16 → With YardFlow 46m → 31 min lost to the silos` | — |
| 4 | The shift | The novel frame | "What if the yard ran as one flow?" — defines **YNS once**; plain-language toggle "Today / With YardFlow" | — |
| 5 | The scale | The money, once | Friction signals (N-of-N) + one modeled $ + single Primo proof | **Run your ROI** (secondary) |
| 6 | The reply | Convert to a response | "Is this your yard?" + low-friction ask + memo link | Start a conversation · Read the full memo |
| — | Depth on demand | Self-serve depth | Atlas explore → decluttered site card (3 facts + "watch this yard"; full grid behind "Show full audit detail"); simulator as a "stress-test" expander; related networks + flick-bar (kept) | — |

The two tabs collapse: **Atlas = hero (§1) + explore (depth)**; **Simulator = a stress-test expander under §5**, not a parallel arrival-time mode.

## 3. Per-section detail
- **§0 Sticky bar** — replaces the ~10-row header. Left: back + brand + small confidence chip (visible on mobile). Right: one primary CTA. No metrics here (they live in §1/§5 once).
- **§1 Recognition hero** — H1 leads with the **company**, not "YNS network audit". One non-wrapping stat line (fixes the orphaned "rail-served" wrap, finding F1/F3). Disclaimer one line. Hero visual = the existing network atlas map (their pins). Coverage-honesty note inline here, not a separate header band.
- **§2 Reframe** — new content block + a simple SVG/CSS diagram of 5 siloed steps with broken links. This is the cold-email payload. Replaces the scattered `flowGATE/flowTWIN` chip row (module names move to §4 prose or the memo).
- **§3 Replay** — reuse `driver-journey-replay`; **fix the desktop empty driver's-eye pane** (F17) so map + Street View sit side-by-side and both fill (collapse to full-width map if no pano). **Fixed comparison labels**: always Today / With YardFlow / You save (F19). Positioned after recognition (F18).
- **§4 Shift** — defines YNS once ("YardFlow Network Simulator — our yard operating system"). Toggle copy becomes "Today / With YardFlow" everywhere (replace "Without YNS/With YNS/Baseline").
- **§5 Scale** — ONE place for the modeled $ and payback; the friction profile signals; the Primo "48→24 min" proof shown **once** here (F22). "Run your ROI" is the only ROI CTA (removes the 3× duplication, F6).
- **§6 Reply** — low-friction conversion. Canonical reply CTA + a single memo link (footer's duplicate removed, F7).
- **Detail panel** — defaults to 3 headline facts + "watch this yard"; the two dense grids (yard metrics + classification) + field notes + low-confidence disclaimer go behind one "Show full audit detail" disclosure (F20–F21). One representation per fact.

## 4. System rules (apply globally)
- **CTAs:** two canonical actions only — reply (primary) and Run your ROI (secondary); memo is a text link. Same visible label per intent; vary UTMs by section in code, not in the label (F5–F7).
- **Metrics single-source:** each network metric shown once (hero or scale, not header *and* simulator); per-site metrics only in the detail panel; never the same number at two scopes without explicit "this site vs network" framing (F9–F11).
- **Terminology:** define **YNS** on first use, then use plain language ("with YardFlow"). Hide raw audit codes (`archetype #9`, `entryLanes`, dock/drop "bands") behind the detail disclosure (F14–F16).
- **Visual system:** retire the ALL-CAPS micro-label system; use a real type scale (section title / subtitle / small eyebrow). Target ~5–6 real headings, not ~20 caps strings (F12–F13). One consistent non-affiliation disclaimer string shared with the gallery; label example figures ("Example: …") so they're never mistaken for the prospect's number (F23).
- **Identity:** one identity regardless of `?from=gallery` (keep the "← back to gallery" affordance, drop the headline flip) (F4).

## 5. Bugs to fix in-flight
- F1: orphaned "rail-served" wraps to its own line → render metrics as a non-wrapping inline stat row.
- F17: replay driver's-eye renders as an empty black box at desktop width → fix the side-by-side layout; collapse to full-width map when a zone has no pano.
- F3: confidence stamp desktop-only → show the chip on mobile too.

## 6. Build phases (incremental, preview-deploy each before prod)
- **Phase 1 — Quick wins (low risk, ship first):** collapse header → slim sticky bar; fix the orphaned-wrap + confidence-on-mobile; dedupe CTAs to the two canonical actions; kill the ALL-CAPS micro-label noise; define YNS once + plain-language toggle labels.
- **Phase 2 — IA reorder:** atlas → recognition hero; replay moved below; simulator demoted to a stress-test expander; detail-panel progressive disclosure (3 facts + "show full audit detail").
- **Phase 3 — New narrative + replay fix:** add §2 reframe (silo diagram) + §5 single-source scale/ROI + §6 reply; fix the replay driver's-eye layout; single Primo proof.

Each phase: implement on a branch → Vercel **preview** deploy → screenshot review → merge to `main` (prod) on approval. Verify build (tsc + lint) and that `DemoPackSchema` still validates (no data-shape changes expected — this is presentation/IA).

## 7. Non-goals
- No change to the audit data, geofences, or Street View panos (just-completed work).
- No change to the demo-pack schema or `build-demo-pack` pipeline.
- No rewrite of the `/roi` calculator or the memo (`/for/`); only the links to them.
