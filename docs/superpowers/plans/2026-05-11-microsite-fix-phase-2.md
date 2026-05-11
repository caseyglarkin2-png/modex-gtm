# Microsite Fix — Phase 2 (T2 Voice) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the boilerplate/sales-tell metadata across the 14 Tier-2 accounts and clean up template artifacts that leaked into renderable copy across 9 accounts. Rewrites the most prominent renderable surface — pageTitle (browser tab + share preview) and metaDescription (SEO + share card) — for every T2 account in one PR.

**Architecture:** Surgical content edits to `src/lib/microsites/accounts/*.ts`. No schema changes, no new components, no component-layer edits. Each rewrite is drafted in this plan so the implementer subagent can apply them mechanically.

**Master punch list:** `docs/audits/2026-05-11-microsite-master-punch-list.md` (commit `3e1db42`)
**Scope:** P0-10, P0-11, P0-14, P0-15, P0-16 from the master sequencing recommendation (PR batch 3)
**Out of scope:** P0-12 (framingNarrative rewrites — Phase 3), P0-13 (audio briefs — Phase 3), P0-9 (section migration — Phase 3)

---

## File structure

**Modified — 14 T2 accounts (Tasks 1 + 4):**

```
src/lib/microsites/accounts/campbell-s.ts
src/lib/microsites/accounts/caterpillar.ts
src/lib/microsites/accounts/constellation-brands.ts
src/lib/microsites/accounts/diageo.ts
src/lib/microsites/accounts/ford.ts
src/lib/microsites/accounts/georgia-pacific.ts
src/lib/microsites/accounts/h-e-b.ts
src/lib/microsites/accounts/hormel-foods.ts
src/lib/microsites/accounts/jm-smucker.ts
src/lib/microsites/accounts/keurig-dr-pepper.ts
src/lib/microsites/accounts/mondelez-international.ts
src/lib/microsites/accounts/performance-food-group.ts
src/lib/microsites/accounts/the-home-depot.ts
src/lib/microsites/accounts/toyota.ts
```

**Modified — template artifact accounts (Task 2):**

```
src/lib/microsites/accounts/ford.ts                       (emoji in openingHook)
src/lib/microsites/accounts/toyota.ts                     ("### The Killer Angle:" + "pain point 1:")
src/lib/microsites/accounts/keurig-dr-pepper.ts           ("pain point 1:" prefix)
src/lib/microsites/accounts/constellation-brands.ts       ("4a." prefix)
src/lib/microsites/accounts/the-home-depot.ts             (5 identical openingHooks)
src/lib/microsites/accounts/caterpillar.ts                (MODEX proximity note)
src/lib/microsites/accounts/georgia-pacific.ts            (MODEX proximity note)
src/lib/microsites/accounts/fedex.ts                      ("Less direct logo hunt" classification)
src/lib/microsites/accounts/kenco-logistics-services.ts   ("Less direct logo hunt" classification)
```

**Modified — Task 3:**

```
src/lib/microsites/accounts/jm-smucker.ts                 (proofBlocks quote: "45 plants" → ">200 contracted facilities")
```

---

## Task 1: T2 pageTitle + metaDescription rewrites

Each T2 account currently has identical boilerplate:

- `pageTitle: "YardFlow for {Account} - Yard Network Standardization"` — category descriptor, no thesis, no hook
- `metaDescription: "How YardFlow eliminates the yard bottleneck across {Account}'s facility network."` — disqualifying sales-tell ("eliminates the yard bottleneck")

Replace each with the per-account rewrites drafted below. Apply both fields in the same pass since the file is open anyway.

**Pattern for each file:**

1. Find the `pageTitle:` line
2. Replace with the new value
3. Find the `metaDescription:` line (typically immediately after)
4. Replace with the new value

**Rewrite drafts (Casey to review before execution):**

### `campbell-s.ts`
```ts
pageTitle: "Campbell's · The yard layer between Camden HQ and 22 plants",
metaDescription: "Campbell's runs 22 manufacturing sites across soup, sauce, snacks, and the Sovos acquisition. The yard between the carrier gate and the plant dock is where multi-temp, multi-brand, multi-acquisition execution still lives on paper.",
```

### `caterpillar.ts`
```ts
pageTitle: "Caterpillar · The gap between autonomous machines and manual yards",
metaDescription: "Caterpillar operates 60+ manufacturing and parts-distribution facilities. The autonomous machines in the field run on JIT principles. The yards between the factory and the dealer still operate on paper logs and radio dispatch.",
```

### `constellation-brands.ts`
```ts
pageTitle: "Constellation Brands · Wine, beer, spirits — three temperature regimes, one yard",
metaDescription: "Constellation Brands moves Corona, Modelo, and the Robert Mondavi portfolio through a yard layer that handles three temperature regimes and three regulatory contexts simultaneously. Single-brand WMS doesn't model that constraint.",
```

### `diageo.ts`
```ts
pageTitle: "Diageo · Premium spirits distribution and the gate-to-dock visibility gap",
metaDescription: "Diageo operates 27 production sites globally and runs Johnnie Walker, Don Julio, and Crown Royal through a North American distribution network where carrier dwell at the dock is unobserved at the network tier.",
```

### `ford.ts`
```ts
pageTitle: "Ford BlueOval City · Yard-execution protocol for the EV transition network",
metaDescription: "Ford's BlueOval City is the largest greenfield industrial site in North America — 3,600 acres, $5.6B investment, F-150 Lightning production. Every inbound parts trailer arrives at a yard still being designed. The protocol won't be inherited from Dearborn.",
```

### `georgia-pacific.ts`
```ts
pageTitle: "Georgia-Pacific · The yard layer for 150 mills, plants, and distribution sites",
metaDescription: "Georgia-Pacific runs 150+ paper, packaging, and consumer products facilities under Koch ownership. The cube-heavy tissue and packaging freight profile compounds yard dwell into a margin lever the WMS doesn't see.",
```

### `h-e-b.ts`
```ts
pageTitle: "H-E-B · Texas fresh-grocery yard execution as the shrink-rate lever",
metaDescription: "H-E-B operates 425+ stores and a Texas DC network designed for sub-24-hour fresh produce turnaround. Yard dwell on the inbound side directly translates to shelf-life loss — the yard is the shrink-rate input nobody's measuring at the network.",
```

### `hormel-foods.ts`
```ts
pageTitle: "Hormel Foods · Multi-temperature manufacturing and the yard at the dock door",
metaDescription: "Hormel runs SPAM, Jennie-O, Skippy, Applegate, Planters across refrigerated and shelf-stable plants. Multi-temp at the same plant means the yard layer handles dock-assignment decisions that no single WMS can route.",
```

### `jm-smucker.ts`
```ts
pageTitle: "J.M. Smucker · Coffee and pet food — two seasonal rhythms in one yard",
metaDescription: "J.M. Smucker manages Folgers, Smucker's, Milk-Bone, and Meow Mix across 25+ facilities. Coffee runs on a different seasonal cadence than pet food. The yard is where the two cadences collide every day, with no protocol mediating the dock-door arbitration.",
```

### `keurig-dr-pepper.ts`
```ts
pageTitle: "Keurig Dr Pepper · 300+ DSD depots and the yard inside each one",
metaDescription: "Keurig Dr Pepper's DSD operation runs 300+ distribution depots. Each depot manages inbound syrup/finished-goods trailers alongside outbound DSD route trucks — two completely different freight profiles competing for the same yard, every morning.",
```

### `mondelez-international.ts`
```ts
pageTitle: "Mondelez North America · The yard layer below 130 plants and post-acquisition integration",
metaDescription: "Mondelez operates 130+ manufacturing plants globally, with North America anchored by the Clif Bar and Ricolino integrations. The yard layer has never been standardized at this scale. The question is whether it gets standardized before or after the next acquisition.",
```

### `performance-food-group.ts`
```ts
pageTitle: "Performance Food Group · Foodservice OTIF measured at the dock door",
metaDescription: "Performance Food Group's foodservice network — Vistar, Reinhart, the Cheney Brothers integration — runs on on-time-in-full as the operational covenant. The yard outside the restaurant dock is the gap between scheduled and actual that the OTIF dashboard doesn't reach.",
```

### `the-home-depot.ts`
```ts
pageTitle: "The Home Depot · 200+ DCs, seasonal surge, and the yard between four DC types",
metaDescription: "The Home Depot operates 200+ distribution centers across RDC, BDC, FDC, and the SRS Distribution acquisition — four DC types, four yard playbooks. The seasonal garden-center surge and pro-order staging constraint isn't visible to a single-DC-type WMS.",
```

### `toyota.ts`
```ts
pageTitle: "Toyota Motor North America · JIT assembly requires JIT yard execution — the protocol gap",
metaDescription: "Toyota Motor North America. 14 manufacturing facilities. The Toyota Production System defines JIT delivery standards for the line. The yard between the gate and the dock is the one layer the Production System has not standardized.",
```

### Steps

- [ ] **Step 1: Apply pageTitle + metaDescription rewrites**

For each of the 14 files, use the `Edit` tool to replace the two fields. Match on the existing boilerplate string. Confirm replacement with `grep "Yard Network Standardization" src/lib/microsites/accounts/{slug}.ts` returning 0 after the edit.

- [ ] **Step 2: Verify all 14 files updated**

```bash
cd /mnt/c/Users/casey/modex-gtm
# Boilerplate eliminated
grep -c "Yard Network Standardization" src/lib/microsites/accounts/{campbell-s,caterpillar,constellation-brands,diageo,ford,georgia-pacific,h-e-b,hormel-foods,jm-smucker,keurig-dr-pepper,mondelez-international,performance-food-group,the-home-depot,toyota}.ts
# Expected: 0 for each file
grep -c "eliminates the yard bottleneck" src/lib/microsites/accounts/{campbell-s,caterpillar,constellation-brands,diageo,ford,georgia-pacific,h-e-b,hormel-foods,jm-smucker,keurig-dr-pepper,mondelez-international,performance-food-group,the-home-depot,toyota}.ts
# Expected: 0 for each file
```

- [ ] **Step 3: TypeScript build check**

```bash
cd /mnt/c/Users/casey/modex-gtm
timeout 240 npx tsc --noEmit 2>&1 | head -10
# Expected: clean
```

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add src/lib/microsites/accounts/{campbell-s,caterpillar,constellation-brands,diageo,ford,georgia-pacific,h-e-b,hormel-foods,jm-smucker,keurig-dr-pepper,mondelez-international,performance-food-group,the-home-depot,toyota}.ts
git commit -m "$(cat <<'EOF'
fix(microsite): T2 pageTitle + metaDescription rewrites (14 accounts)

P0-10 + P0-11 from 2026-05-11 master punch list. Every Tier 2 account
shared identical boilerplate metadata:
- pageTitle: "YardFlow for {X} - Yard Network Standardization" (no thesis)
- metaDescription: "How YardFlow eliminates the yard bottleneck..."
  (disqualifying sales-tell per editorial-style.md)

Replaces each with an account-specific memo-title + observational
metaDescription that names the thesis and avoids vendor benefit claims.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Template artifact cleanup (9 accounts)

Internal classification notes, template prefixes, emoji, and editorial annotations that leaked into renderable fields. Each is a surgical edit to a specific field.

### `ford.ts` — emoji in openingHook
**Find:** `personVariants[0].openingHook` contains `🔴 critical:`
**Replace with:**
```ts
openingHook: "BlueOval City in Stanton, Tennessee is the largest greenfield industrial site in North America — 3,600 acres, $5.6B capital investment, F-150 Lightning and next-generation EV production. Every inbound parts trailer to that facility in 2025 and 2026 is arriving into a yard that is still being built. The yard execution protocol for BlueOval City is not inherited from the Dearborn legacy — it is being designed right now.",
```

### `toyota.ts` — three artifact-leaked fields

**a. `personVariants[0].framingNarrative` (currently has `### The Killer Angle:` annotation)**
Replace with:
```ts
framingNarrative: "Toyota Motor North America's production philosophy, the Toyota Production System, defines the global standard for JIT supply chain execution. The yard between the supplier gate and the assembly line dock — where parts trailers arrive, queue, and wait — is the one surface in the TPS that still operates without a digital execution layer at most North American plants.",
```

**b. `personVariants[0].heroOverride.subheadline` (currently has `### The Killer Angle:` markdown)**
Replace with:
```ts
subheadline: "Toyota Production System principles define JIT delivery for every component on the line. The yard between the supplier truck and the dock is the one layer the TPS has not digitized. Nielsen's TBMNC battery plant is the clean-slate opportunity to set the protocol before the pattern hardens.",
```

**c. `personVariants[0].openingHook` (currently has `pain point 1:` prefix)**
Replace with:
```ts
openingHook: "Toyota Production System plants operate to the tightest JIT standards in the industry — parts arrive by the hour, not by the day. The yard between the supplier truck's arrival and the dock assignment is the gap between 'scheduled to arrive' and 'ready to produce.' At 14 North American plants and $13.9B in new EV capacity, that gap has a dollar value Nielsen's team is already measuring.",
```

### `keurig-dr-pepper.ts` — `pain point 1:` prefix in openingHook
**Find:** `personVariants[0].openingHook` starts with `Your team is dealing with pain point 1: dsd depot yard chaos`
**Replace with:**
```ts
openingHook: "Keurig Dr Pepper's DSD operation runs 300+ distribution depots. Each depot manages inbound syrup and finished goods trailers alongside outbound DSD route trucks — two completely different freight profiles competing for the same yard. When the morning DSD load-out window collides with the inbound trailer arrival, depot throughput collapses. That happens daily across the network.",
```

### `constellation-brands.ts` — `4a.` prefix
**Find:** Any field containing the literal `4a.` template prefix (likely in personVariants).
**Approach:** Open the file, locate the `4a.` artifact, replace with observational copy. (Implementer should report the exact field path found.)
**Suggested replacement direction:** Use the wine/beer/spirits multi-temperature framing from the pageTitle. The implementer should propose a rewrite snippet that aligns with the account's coexistence-wedge pitch shape, then ask for approval before committing.

### `the-home-depot.ts` — 5 identical openingHooks
Five `personVariants[N].openingHook` fields all contain the literal string `"This page is framed as a short private brief rather than a pitch."`. Replace each with a persona-specific observation:

**Persona 1 — John Drake (Transportation SVP) or equivalent transport role:**
```ts
openingHook: "The transportation network you run moves 10,000 trailers per day. The yard is the gap between the carrier arriving and the trailer reaching a dock — and at this scale, that gap is a measurable number the carrier satisfaction data is already capturing.",
```

**Persona 2 — Erin Donnelly (Supply Chain Development) or equivalent supply-chain-design role:**
```ts
openingHook: "Supply chain development at Home Depot means standardizing the last unstandardized layer — the yard. Four DC types run four different yard playbooks, and the SRS Distribution integration just added a fifth.",
```

**Persona 3 — DC Operations or Facility Ops role:**
```ts
openingHook: "Every Home Depot DC type — RDC, BDC, FDC, and the SRS network — has its own dock-assignment logic, but the yard outside each of them runs on the same paper logs the operation has used for two decades. The seasonal garden-center surge stress-tests it twice a year and the WMS doesn't see it.",
```

**Persona 4 — Pro / Pro-Order role:**
```ts
openingHook: "Pro orders are 50%+ of Home Depot's revenue mix and the staging requirement is unlike retail. A contractor's pickup window is 30 minutes; the yard has to position the staged trailer at the dock before that window, or the pro walks. The yard execution protocol for pro is a different surface than for retail replenishment.",
```

**Persona 5 — Other (catch-all):**
```ts
openingHook: "200+ distribution centers across four DC types serve 2,300+ stores plus the pro channel. The yard layer connecting carriers to docks is the one execution surface where each DC type's playbook diverges — and where standardization at the network tier has the largest leverage.",
```

If only 4 distinct personas exist, drop the 5th template entry rather than duplicating.

### `caterpillar.ts` — MODEX proximity note
**Find:** Any field containing `MODEX` or `MODEX proximity` as a renderable string.
**Approach:** The note is an internal ABM trigger reference; remove it. If the field is `framingNarrative` or `openingHook`, replace with account-specific observational copy. The implementer should locate the exact field, report it back, and propose a rewrite aligned with caterpillar's pitch shape (autonomous machines vs manual yards). Approve before commit.

### `georgia-pacific.ts` — MODEX proximity note
Same shape as caterpillar above. Find, report field path, propose georgia-pacific-specific rewrite (Koch ownership, 150+ facilities, cube-heavy tissue/packaging), approve before commit.

### `fedex.ts` — "Less direct logo hunt" classification note
**Find:** Any field containing `Less direct logo hunt` or `partnership / ecosystem / referral opportunity`.
**Approach:** Same Kenco-style classification leak. Remove. Replace with FedEx-specific observation. The audit noted the underlying business is a carrier/LSP not a CPG shipper — the rewrite should reframe to hub-gate constraints, not CPG-style detention. Propose rewrite, approve before commit.

### `kenco-logistics-services.ts` — "Less direct logo hunt" in 5 personVariants
**Find:** All 5 `personVariants[N].heroOverride.subheadline` fields contain the literal string `"Less direct logo hunt, more partnership / ecosystem / referral opportunity."`
**Replace each with:** The same persona-specific replacement pattern as the-home-depot above. The audit gave a Kristi-Montgomery-specific replacement; reuse for persona 1 and author observational alternatives for the other 4 (3PL operational complexity, partner referral economics, MODEX speaking circuit, warehouse-automation upstream context).

**Replacement for `personVariants[0]` (Kristi Montgomery — VP Strategic Transformation):**
```ts
subheadline: "Kenco manages 100+ warehouses for 70+ enterprise clients. Each client has different carrier requirements, different dock rules, different yard protocols. The operational complexity isn't the warehouse — it's the yard outside the warehouse, multiplied by 70 different shipper contracts. A single yard operating standard applied at the managed-services level would deliver 100+ deployments from one partnership decision.",
```

**Replacements for personas 2–5:** Implementer drafts based on each persona's role; report drafts for approval before commit.

### Steps

- [ ] **Step 1: Apply ford emoji removal**
- [ ] **Step 2: Apply toyota's 3 field rewrites**
- [ ] **Step 3: Apply keurig-dr-pepper rewrite**
- [ ] **Step 4: Locate + draft + apply constellation-brands `4a.` rewrite** (request approval before commit if uncertain about field location)
- [ ] **Step 5: Apply the-home-depot's 5 openingHook rewrites**
- [ ] **Step 6: Locate + draft + apply caterpillar MODEX rewrite** (request approval before commit)
- [ ] **Step 7: Locate + draft + apply georgia-pacific MODEX rewrite** (request approval before commit)
- [ ] **Step 8: Locate + draft + apply fedex classification rewrite** (request approval before commit; this is Tier 3 but the leak is sales-tell severity, so included in Phase 2)
- [ ] **Step 9: Apply kenco-logistics-services Kristi Montgomery rewrite + draft 4 more** (request approval for 2–5)

- [ ] **Step 10: Verify no remaining template artifacts**

```bash
cd /mnt/c/Users/casey/modex-gtm
# Catch-all leak scan against the file set
grep -E "🔴|Killer Angle:|pain point [0-9]+:|^4a\.|Less direct logo hunt|MODEX proximity|This page is framed" src/lib/microsites/accounts/{ford,toyota,keurig-dr-pepper,constellation-brands,the-home-depot,caterpillar,georgia-pacific,fedex,kenco-logistics-services}.ts
# Expected: no matches in renderable strings (matches in JSDoc-only comments are acceptable but the audit suggests there shouldn't be any)
```

- [ ] **Step 11: Commit**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add src/lib/microsites/accounts/{ford,toyota,keurig-dr-pepper,constellation-brands,the-home-depot,caterpillar,georgia-pacific,fedex,kenco-logistics-services}.ts
git commit -m "$(cat <<'EOF'
fix(microsite): strip template artifacts from renderable copy (9 accounts)

P0-15 from 2026-05-11 master punch list. Internal classification notes,
template prefixes, emoji, and editorial annotations had leaked into
renderable personVariants fields:

- ford:              🔴 emoji in openingHook
- toyota:            "### The Killer Angle:" + "pain point 1:" in 3 fields
- keurig-dr-pepper:  "pain point 1:" prefix in openingHook
- constellation:     "4a." template prefix
- the-home-depot:    5 identical "This page is framed..." openingHooks
- caterpillar:       MODEX proximity classification note
- georgia-pacific:   MODEX proximity classification note
- fedex:             "Less direct logo hunt" classification note
- kenco-logistics:   "Less direct logo hunt" in 5 heroOverride subheadlines

All replaced with account/persona-specific observational copy.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: jm-smucker Primo correction (P0-16)

The same "45 plants" Primo error that was patched in `hormel-foods.ts:418` (commit `5b3c2a3`, PR #72) is also in `jm-smucker.ts`'s `proofBlocks` quote. Anonymized framing is fine; the number is wrong.

**Files:**
- Modify: `src/lib/microsites/accounts/jm-smucker.ts`

- [ ] **Step 1: Locate the "45 plants" reference**

```bash
cd /mnt/c/Users/casey/modex-gtm
grep -n "45 plants" src/lib/microsites/accounts/jm-smucker.ts
```
Expected: one match in `proofBlocks[N].quote.text`.

- [ ] **Step 2: Apply the correction**

The audit's note: "Smucker proofBlocks anonymizes correctly ('When a beverage manufacturer integrated 45 plants...') but uses the same wrong '45 plants' count."

Use the Edit tool to replace `45 plants` with `>200 contracted facilities` in the quote text. Adjust surrounding sentence so it scans well — e.g., if the original is:

```ts
quote: { text: "When a beverage manufacturer integrated 45 plants under a single yard operating model, dock turn fell from 48 to 24 minutes.", ... }
```

Replace with:

```ts
quote: { text: "When a beverage manufacturer integrated >200 contracted facilities under a single yard operating model, dock turn fell from 48 to 24 minutes.", ... }
```

(The implementer should preserve the surrounding sentence shape and only edit the number — `45 plants` → `>200 contracted facilities`.)

- [ ] **Step 3: Verify**

```bash
grep "45 plants" src/lib/microsites/accounts/jm-smucker.ts
# Expected: no matches
grep ">200 contracted facilities" src/lib/microsites/accounts/jm-smucker.ts
# Expected: 1 match
```

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add src/lib/microsites/accounts/jm-smucker.ts
git commit -m "$(cat <<'EOF'
fix(microsite/jm-smucker): correct Primo facility count in proofBlocks quote

P0-16 from 2026-05-11 master punch list. The anonymized proofBlocks
quote referenced "45 plants" — the same incorrect figure caught + patched
in hormel-foods.ts (5b3c2a3, PR #72). Correct figure: >200 contracted
facilities (post-BlueTriton merger).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Replace legacy CTA pattern in T2 commented blocks (P0-14)

The 14 T2 files contain commented-out legacy `cta` blocks with sales-tell copy:

```ts
// {
//   ...
//   type: 'cta',
//   buttonLabel: 'Book a Network Audit',
//   closingLine: 'One conversation. Your yard network. A clear path to $10M-$15M in annual savings.',
// }
```

These don't render today (the comments are stripped from the bundle), but Phase 3's section migration will lift this content into live sections — at which point the sales-tell goes live. Fix the commented source now so Phase 3 picks up the right pattern.

**Approach:** For each T2 file, replace the commented-out CTA block with a commented-out soft-action template matching the T1 anti-sales register.

**Soft-action template to substitute:**

```ts
// (Phase 3 will migrate this into a live MemoSoftAction section)
// type: 'soft-action',
// description: "If the network-tier yard question is already on someone's desk internally, this is more useful than starting cold. The next useful step is a conversation about what {COMPARABLE} has done to {ACCOUNT-SHORT}'s yard cadence — theirs, not ours.",
// (No buttonLabel. No closingLine with savings claims. No "Your yard network" second-person address.)
```

The `{COMPARABLE}` and `{ACCOUNT-SHORT}` placeholders should be filled in per-account by the implementer. Where the audit gave specific account guidance (PFG's Cheney Brothers integration, for example), use that. Otherwise default to "Primo Brands" as the comparable since it's the canonical public reference.

**Per-account values for the template:**

| Account | COMPARABLE | ACCOUNT-SHORT context |
|---|---|---|
| campbell-s | Primo Brands | Campbell's plant network |
| caterpillar | Primo Brands | Caterpillar's distribution yards |
| constellation-brands | Primo Brands | Constellation's multi-temp portfolio |
| diageo | Primo Brands | Diageo's North American network |
| ford | Primo Brands | Ford's inbound parts yards |
| georgia-pacific | Primo Brands | Georgia-Pacific's tissue/packaging mills |
| h-e-b | Primo Brands | H-E-B's Texas DC network |
| hormel-foods | Primo Brands | Hormel's multi-temp plants |
| jm-smucker | Primo Brands | Smucker's coffee+pet-food network |
| keurig-dr-pepper | Primo Brands | KDP's DSD depot network |
| mondelez-international | Primo Brands | Mondelez's NA plant network |
| performance-food-group | Cheney Brothers | PFG's foodservice DCs |
| the-home-depot | Primo Brands | Home Depot's four DC types |
| toyota | Primo Brands | Toyota's TBMNC and NA plants |

### Steps

- [ ] **Step 1: For each of the 14 T2 files, find the commented-out CTA block**

```bash
grep -l "Book a Network Audit\|Book a Meeting at MODEX" src/lib/microsites/accounts/*.ts
```

Confirm all 14 T2 accounts (or whichever subset has the legacy block) are returned.

- [ ] **Step 2: For each match, replace the commented-out CTA block with the soft-action template**

Use the Edit tool on each file. Substitute the appropriate `{COMPARABLE}` and `{ACCOUNT-SHORT context}` from the table above.

- [ ] **Step 3: Verify all legacy CTA copy is gone**

```bash
cd /mnt/c/Users/casey/modex-gtm
grep -c "Book a Network Audit\|Book a Meeting at MODEX\|\\$10M-\\$15M in annual savings\|Your yard network" src/lib/microsites/accounts/*.ts
# Expected: 0 across all account files
```

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add src/lib/microsites/accounts/
git commit -m "$(cat <<'EOF'
fix(microsite): replace legacy CTA pattern in T2 commented blocks (P0-14)

P0-14 from 2026-05-11 master punch list. The commented-out legacy cta
blocks across 14 T2 accounts contained "Book a Network Audit" /
"Book a Meeting at MODEX" + "$10M-$15M annual savings" boilerplate —
disqualifying sales-tell that would migrate into live sections during
Phase 3.

Replaced with a soft-action template matching the T1 anti-sales
register: no booking CTA, no savings promise, observational tone,
per-account comparable + scope.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-review

Reviewed against master punch list `3e1db42`:

**Spec coverage:**
- ✅ P0-10 (T2 pageTitle rewrites) — Task 1
- ✅ P0-11 (T2 metaDescription rewrites) — Task 1
- ✅ P0-15 (template artifact cleanup) — Task 2
- ✅ P0-16 (jm-smucker Primo correction) — Task 3
- ✅ P0-14 (T2 legacy CTA pattern) — Task 4

**Out of scope (per master sequencing):**
- ❌ P0-12 (T2 framingNarrative rewrites) — Phase 3
- ❌ P0-13 (audio briefs for T2) — Phase 3
- ❌ P0-9 (section migration for 16 accounts) — Phase 3
- ❌ Per-account accent duplication cleanup (red/violet/blue clusters) — Phase 5

**No placeholders detected.** Every rewrite is drafted inline for Casey's pre-execution review. Five template-artifact rewrites (constellation-brands `4a.`, caterpillar + georgia-pacific MODEX, fedex classification, kenco-logistics personas 2–5) are intentionally "implementer drafts + approves before commit" because the exact field location and persona context isn't pre-known.

**Path + slug consistency:** All 14 T2 slugs are listed explicitly in Tasks 1 and 4. The 9 template-artifact accounts in Task 2 are listed explicitly. jm-smucker in Task 3 is single-file.

**Type consistency:** No new types introduced. All edits are string-content changes to existing fields.
