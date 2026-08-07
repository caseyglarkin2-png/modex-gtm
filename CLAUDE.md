# modex-revops-os

Next.js GTM / RevOps application (deployed to modex-gtm.vercel.app).

---

## Current work

Current work is visible in `git log` — do not trust a dated banner here to be
current. Open owner items live in the Obsidian vault ledger:
`10_Operating_System\RETIREMENT-HANDOFF.md`.

---

## 🎯 THE PROSPECT-FACING STANDARD — /demo, /for, microsites (2026-07-09)

Everything this app serves under **yardflow.ai** (the `/demo` subtree, `/for`
packs, microsites) holds the same bar as the native site. The canon lives in
`Flow-State-/flow-state-site/CLAUDE.md` + `docs/DESIGN-SYSTEM.md`; the parts
enforced HERE:

- **Voice:** no em dashes, no "throughput" (say production capacity), yards
  plural, measured-vs-modeled labeled. `npm run validate:packs` is the gate —
  it runs VOICE CI over all 57 demo packs and must pass before any pack ships.
  The AI copy context (`src/lib/ai/yardflow-context.ts`) carries the canon
  positioning; generated copy inherits whatever it says, so keep it current.
- **Number canon:** 48→24 measured · 24 sites live · ~5% measured · $1M+/site
  MODELED · 260 sites committed (100% of Primo, owner-confirmed 2026-07-09,
  Primo-specific). Never hand-type a variant.
- **Chrome:** `src/components/demo/demo-chrome.tsx` mirrors the canonical top
  bar (Product, Solutions, Demo, ROI, Research→/resources) and the canonical
  CTA "Book a Yard Network Audit". If Flow-State- changes
  `config/navigation.ts`, mirror it here.
- **SEO:** microsites are noindexed by design (sales weapons, not search
  bait); canonical/OG URLs are absolute yardflow.ai WITH trailing slash
  (`buildMicrositeAbsoluteUrl` enforces it). The title template is
  "%s | YardFlow by FreightRoll" — no em dash.
- **Deploy:** push main → Vercel; verify the LIVE yardflow.ai/demo/* pages
  after (the proxy adds failure modes the preview doesn't show).
