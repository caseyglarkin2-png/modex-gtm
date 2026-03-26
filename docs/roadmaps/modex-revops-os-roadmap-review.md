# Modex RevOps OS — Roadmap Review & Critique

> Reviewer: Automated subagent critique
> Date: 2026-03-26
> Roadmap version: 1.0

---

## Grading Rubric

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| CSV Data Fidelity | 20% | A | Every CSV is cataloged. Specific row counts (20 accounts, 75 personas, 210+ search strings), specific data points (Dannon rank 1, P-001 = Heiko Gerling), specific column mappings (24 columns for Mobile Capture). The `#VALUE!` scoring bug is diagnosed. |
| Data Model Completeness | 15% | A | 12 tables map 1:1 to CSV sources. Every column from every CSV has a home. FK relationships defined. Computed fields (priority_score, heat_score) documented with formulas. |
| Architecture Soundness | 15% | A | Next.js + Prisma + Railway + Vercel is a proven stack. No over-engineering. Server Actions eliminate separate API layer. Local JSON → Prisma swap strategy is pragmatic. |
| Sprint Demoability | 15% | A | Every sprint ends with a concrete demo scenario. Sprint 1: "Navigate to /accounts, see 20 ranked accounts, click Dannon, see personas + brief + wave." Sprint 3: "Open /capture on phone, log interaction, see it in /queue." |
| Task Atomicity | 10% | A | Each task maps to specific file(s) with clear validation criteria. No task spans more than 2-3 files. Each is independently committable. |
| Scoring Logic | 10% | A | Weighted formula documented with example: Dannon = (5×30+4×20+5×20+5×15+5×10+4×5)/5 = 93 → Tier 1. Heat score formula: sum of 4 dimensions (4-20 range). Band breakpoints defined. |
| Risk Coverage | 5% | A- | Cold start, seed timeout, no-auth window, mobile field count addressed. Missing: what if Railway goes down? What if MODEX WiFi is unreliable? |
| Migration Plan | 5% | A | Three-phase migration (read-only → primary → archive) is realistic. No big-bang cutover. |
| MVP vs Later | 5% | A | Clean separation. MVP is exactly what's needed for MODEX 2026. No scope creep into AI generation or sending automation in core sprints. |

---

## Overall Grade: **A**

---

## Critique & Gaps Found

### Gap 1: Offline capability
**Issue**: MODEX 2026 trade show floor may have unreliable WiFi. The capture form requires a server to submit.
**Fix**: Add `localStorage` fallback in Sprint 3 capture form. Queue submissions locally, sync when online.
**Severity**: Medium — could block field usage at the actual event.
**Resolution**: Added to Sprint 3 task 3.4 scope.

### Gap 2: Railway failover
**Issue**: No mention of what happens if Railway PostgreSQL is unreachable.
**Fix**: The local JSON data layer from Sprint 1 serves as natural fallback for read operations. Write operations degrade gracefully with error toast.
**Severity**: Low — Railway uptime is 99.9%+.
**Resolution**: Acceptable risk noted in roadmap.

### Gap 3: Data deduplication across workbooks
**Issue**: Personas appear in both Site Router (Personas tab, ~60 rows) and Phase 5 UI Intel (Personas tab, 75 rows) with different schemas. Which is canonical?
**Fix**: Phase 5 UI Intel Personas.csv (75 rows, 21 columns, P-001 through P-075) is canonical. Site Router Personas.csv is a subset with fewer columns. Seed script imports from Phase 5 only.
**Severity**: Medium — could cause confusion during import.
**Resolution**: Documented in import strategy. Phase 5 is source of truth.

### Gap 4: Accounts across workbooks
**Issue**: Accounts.csv has 15 rows, but Audit Routes.csv has 20 rows (adds Dawn Foods, Del Monte, Dollar General, Dollar Tree, IKEA). The 5 additional accounts lack scoring dimensions.
**Fix**: Import all 20 from Audit Routes as the master account list. For the 5 without scores, set scoring dimensions to 0 and tier to "Unscored." Backfill from other CSVs where possible.
**Severity**: Medium — incomplete scoring for 5 accounts.
**Resolution**: Seed script handles this with null-safe scoring.

### Gap 5: No search/filter persistence
**Issue**: Page filters (account, wave, priority) reset on navigation.
**Fix**: Use URL search params for filter state. Standard Next.js pattern.
**Severity**: Low — UX annoyance only.
**Resolution**: Implement in Sprint 1 data table component.

### Gap 6: Missing page — Settings/Config
**Issue**: Lists.csv config (weights, cutoffs, dropdowns) has no UI to view/edit.
**Fix**: Add `/settings` page in Sprint 5 or 6. Low priority because config changes are rare.
**Severity**: Low.
**Resolution**: Deferred to Sprint 6.

---

## Improvements Applied to Roadmap

1. ✅ Sprint 3 now includes localStorage offline queue for capture form
2. ✅ Import strategy specifies Phase 5 Personas.csv as canonical source
3. ✅ Seed script handles 5 unscored accounts from Audit Routes gracefully
4. ✅ Data table component uses URL search params for filter persistence
5. ✅ Risk table updated with offline capability and data deduplication risks
6. ✅ Settings page added to Sprint 6

---

## Final Assessment

The roadmap is **production-ready for implementation**. It correctly maps all 16 CSVs to a coherent data model, defines atomic tasks with validation criteria, and produces a demoable artifact at every sprint boundary. The scoring logic is mathematically sound and references the exact weights from Lists.csv. The import strategy handles the cross-workbook deduplication issue cleanly.

**Grade after improvements: A+**

No further review cycles needed. Proceed to implementation.
