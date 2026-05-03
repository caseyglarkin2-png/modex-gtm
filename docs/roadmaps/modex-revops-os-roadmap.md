# Modex RevOps OS — Product Roadmap

> Last updated: 2026-05-03
> Status: Archived reference; active execution moved to consolidation roadmap + proof ledger.

## Related Execution Docs
- `docs/roadmaps/revops-os-product-consolidation-sprint-plan.md`
- `docs/roadmaps/revops-os-proof-ledger.md`
- `docs/roadmaps/revops-os-current-ia-inventory.md`
- `docs/roadmaps/one-pager-send-sprint-plan.md`
- `docs/roadmaps/one-pager-send-sprint-todos.md`
- `docs/roadmaps/one-pager-send-atomic-sprint-plan.md`

---

## 1. Executive Diagnosis

### What exists today

The YardFlow / FreightRoll go-to-market engine lives in **16 CSV files** across two Excel workbooks:

**Workbook A — Site Router (a_plus_v3)**
| Sheet | Purpose | Row count | State |
|-------|---------|-----------|-------|
| Activities | Follow-up tasks beyond first next step | Headers only — no data rows | Empty shell |
| Audit Routes | 20 ranked accounts routed to yardflow.ai/contact audit page with UTM-tracked URLs | 20 rows (Danone rank 1 → FedEx rank 19, plus Dawn Foods, Del Monte, Dollar General, Dollar Tree, IKEA) | Fully populated |
| Jake Queue | Mirror of Mobile Capture filtered to non-blank, non-closed — sorted by due date | Headers only | Empty shell |
| Mobile Capture | Field interaction log: 24 columns including 4-dimension heat scoring (Interest, Urgency, Influence, Fit → Heat Score → Band) | Headers only | Empty shell |
| Personas | 60+ personas across 20 accounts with priority, title, lane, role, intro path, audit URL | Fully populated | Complete for current target list |
| QR Assets | 20 account-specific QR cards linking to audit URLs with proof asset descriptions | 20 rows | Complete |
| QR Journey | Master QR flow definition: Scan → yardflow.ai audit → prospect submits → FreightRoll follows up | 7 config rows | Reference data |

**Workbook B — Phase 5 UI Intel**
| Sheet | Purpose | Row count | State |
|-------|---------|-----------|-------|
| Accounts | 20 scored accounts with 31 columns: rank, vertical, signal type, why now, Primo angle, 6 scoring dimensions (1-5), priority band, tier, owner, statuses | 15 data rows + 5 from Site Router not duplicated | Fully populated |
| Actionable Intel | 7 research tasks (facility footprint, tech stack, named leaders, broker pain, keynote adjacency, partner angle) | 7 rows | Defined |
| Activities | Single pre-seeded row (Dannon warm intro 3/24/2026) | 1 row | Seed data |
| Lists | Reference dropdowns + scoring weights: Fit 30%, MODEX Signal 20%, Primo Story 20%, Warm Intro 15%, Strategic Value 10%, Meeting Ease 5%; Tier cutoffs 85/70 | ~50 config entries | Complete config |
| Meeting Briefs | 15 account-specific briefs: Why This Account, Why Now, Pain Points, Primo Relevance, Best Outcome, Suggested Attendees, Prep Assets, Open Questions | 15 rows | Fully populated |
| Meetings | Meeting tracking: ID, account, persona, status, date, time, location, Primo involvement, Jake confirmation | Headers only | Empty shell |
| Outreach Waves | 4 waves (0-3) across 15 accounts: channel mix, start dates, follow-up cadence, escalation triggers | 15 rows | Fully populated |
| Personas | 75 named personas (P-001 through P-075) across 15 accounts with roles, LinkedIn URLs, intro paths, status | 75 rows | Fully populated |
| Search Strings | 210+ boolean search queries per account/wave/function for Sales Navigator, LinkedIn People, Google X-Ray | 210+ rows | Fully populated |

### Diagnosis

1. **The data model is sound** — accounts, personas, waves, briefs, and scoring logic are well-designed.
2. **The workflow is trapped in spreadsheets** — Jake and Casey cannot capture field interactions, track follow-ups, or update statuses from a phone at MODEX.
3. **Scoring is broken** — `#VALUE!` errors in priority score calculations across all 15 accounts in Accounts.csv because the weighted formula references aren't computing.
4. **No single source of truth** — the same personas appear in both workbooks with slightly different column schemas.
5. **QR journey has no backend** — QR codes route to yardflow.ai/contact but there's no capture → queue → follow-up pipeline in the tool.
6. **Mobile Capture and Jake Queue are empty shells** — the headers define a good interaction-capture workflow but nothing is wired up.
7. **210+ search strings are copy-paste artifacts** — no way to track which have been run, yielded results, or led to persona additions.

### What needs to exist

A **live web application** that:
- Imports all existing CSV data as seed
- Provides mobile-friendly capture at MODEX
- Auto-scores interactions and routes to Jake's queue
- Shows account briefs, personas, audit routes, and QR codes on demand
- Tracks outreach wave progress
- Deploys to a live URL accessible from any device

---

## 2. Product Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                      │
│  Next.js 15 App Router + TypeScript + Tailwind + shadcn  │
├─────────────────────────────────────────────────────────┤
│                     Prisma ORM                           │
├─────────────────────────────────────────────────────────┤
│               Railway PostgreSQL (Database)               │
└─────────────────────────────────────────────────────────┘
```

**Why this stack:**
- Next.js App Router = server components + API routes in one deploy
- Prisma = type-safe DB access + migration management + seed scripts
- Railway PostgreSQL = managed Postgres, no config, one-command provision
- Vercel = zero-config Next.js deploy, auto-preview on push
- shadcn/ui = copy-paste components, no dependency lock-in

---

## 3. Canonical Data Model

12 tables derived directly from the 16 CSV column headers:

### accounts
| Column | Type | Source |
|--------|------|--------|
| id | UUID PK | Generated |
| rank | Int | Accounts.csv → Rank |
| name | String | Accounts.csv → Account |
| parent_brand | String | Accounts.csv → Parent / Brand |
| vertical | Enum | Accounts.csv → Vertical (Food & Beverage, Retail, Manufacturing, 3PL / Logistics, Industrial) |
| signal_type | String | Accounts.csv → Signal Type |
| why_now | Text | Accounts.csv → Why Now |
| primo_angle | Text | Accounts.csv → Primo Angle |
| best_intro_path | Text | Accounts.csv → Best Intro Path |
| source | String | Accounts.csv → Source |
| source_url_1 | String | Accounts.csv → Source URL 1 |
| source_url_2 | String? | Accounts.csv → Source URL 2 |
| icp_fit | Int (1-5) | Accounts.csv → ICP Fit |
| modex_signal | Int (1-5) | Accounts.csv → MODEX Signal |
| primo_story_fit | Int (1-5) | Accounts.csv → Primo Story Fit |
| warm_intro | Int (1-5) | Accounts.csv → Warm Intro |
| strategic_value | Int (1-5) | Accounts.csv → Strategic Value |
| meeting_ease | Int (1-5) | Accounts.csv → Meeting Ease |
| priority_score | Float | Computed: weighted formula from Lists.csv |
| priority_band | Enum (A,B,C,D) | Computed from score |
| tier | String | Accounts.csv → Tier |
| owner | String | Accounts.csv → Owner |
| research_status | Enum | Accounts.csv → Research Status |
| outreach_status | Enum | Accounts.csv → Outreach Status |
| meeting_status | Enum | Accounts.csv → Meeting Status |
| current_motion | String | Accounts.csv → Current Motion |
| next_action | Text | Accounts.csv → Next Action |
| due_date | DateTime? | Accounts.csv → Due Date |
| last_updated | DateTime | Accounts.csv → Last Updated |
| notes | Text? | Accounts.csv → Notes |

### personas
| Column | Type | Source |
|--------|------|--------|
| id | UUID PK | Generated |
| persona_id | String UNIQUE | Personas.csv → Persona ID (P-001 etc.) |
| account_name | String FK→accounts.name | Personas.csv → Account |
| priority | Enum (P1, P2, P3) | Personas.csv → Priority |
| name | String | Personas.csv → Persona Name |
| title | String | Personas.csv → Title |
| persona_lane | String | Personas.csv → Persona Lane |
| role_in_deal | String | Personas.csv → Role in Deal |
| intro_route | Text | Personas.csv → Intro Route |
| source | String | Personas.csv → Source |
| function | String | Personas.csv → Function |
| seniority | String | Personas.csv → Seniority |
| why_this_persona | Text | Personas.csv → Why this persona |
| linkedin_url | String | Personas.csv → LinkedIn / Source URL |
| attendance_signal | String? | Personas.csv → Attendance Signal |
| relationship_source | String? | Personas.csv → Relationship Source |
| intro_path | Text | Personas.csv → Intro Path |
| persona_status | Enum | Personas.csv → Persona Status |
| last_touch | DateTime? | Personas.csv → Last Touch |
| next_step | Text? | Personas.csv → Next Step |
| notes | Text? | Personas.csv → Notes |
| account_score | Int? | Personas.csv → Account Score |

### outreach_waves
| Column | Type | Source |
|--------|------|--------|
| id | UUID PK | Generated |
| wave | String | Outreach Waves.csv → Wave |
| wave_order | Int | Outreach Waves.csv → Wave Order |
| account_name | String FK | Outreach Waves.csv → Account |
| rank | Int | Outreach Waves.csv → Rank |
| tier | String | Outreach Waves.csv → Tier |
| priority_score | Int | Outreach Waves.csv → Priority Score |
| channel_mix | String | Outreach Waves.csv → Channel Mix |
| primary_objective | Text | Outreach Waves.csv → Primary Objective |
| use_warm_intro | Boolean | Outreach Waves.csv → Use Warm Intro? |
| use_primo_asset | Boolean | Outreach Waves.csv → Use Primo Asset? |
| primary_persona_lane | String | Outreach Waves.csv → Primary Persona Lane |
| secondary_persona_lane | String | Outreach Waves.csv → Secondary Persona Lane |
| start_date | DateTime | Outreach Waves.csv → Start Date |
| followup_1 | DateTime | Outreach Waves.csv → Follow-up 1 |
| followup_2 | DateTime | Outreach Waves.csv → Follow-up 2 |
| escalation_trigger | Text | Outreach Waves.csv → Escalation Trigger |
| meeting_goal | Text | Outreach Waves.csv → Meeting Goal |
| owner | String | Outreach Waves.csv → Owner |
| status | String | Outreach Waves.csv → Status |

### meeting_briefs
| Column | Type | Source |
|--------|------|--------|
| id | UUID PK | Generated |
| account_name | String FK | Meeting Briefs.csv → Account |
| vertical | String | Meeting Briefs.csv → Vertical |
| public_modex_signal | Text | Meeting Briefs.csv → Public MODEX Signal |
| why_this_account | Text | Meeting Briefs.csv → Why This Account |
| why_now | Text | Meeting Briefs.csv → Why Now |
| likely_pain_points | Text | Meeting Briefs.csv → Likely Pain Points |
| primo_relevance | Text | Meeting Briefs.csv → Primo Relevance |
| best_first_meeting_outcome | Text | Meeting Briefs.csv → Best First Meeting Outcome |
| suggested_attendees | Text | Meeting Briefs.csv → Suggested Attendees |
| prep_assets_needed | Text | Meeting Briefs.csv → Prep Assets Needed |
| open_questions | Text | Meeting Briefs.csv → Open Questions |
| source_url_1 | String? | Meeting Briefs.csv → Source URL 1 |
| source_url_2 | String? | Meeting Briefs.csv → Source URL 2 |

### audit_routes
| Column | Type | Source |
|--------|------|--------|
| id | UUID PK | Generated |
| rank | Int | Audit Routes.csv → Rank |
| account_name | String | Audit Routes.csv → Account |
| audit_url | String | Audit Routes.csv → Audit URL |
| suggested_message | Text | Audit Routes.csv → Suggested "What should we know?" |
| fast_ask | Text | Audit Routes.csv → Fast Ask |
| proof_asset | Text | Audit Routes.csv → Proof Asset |
| warm_route | Text | Audit Routes.csv → Warm Route |
| graphic_file | String | Audit Routes.csv → Graphic File |
| owner | String | Audit Routes.csv → Owner |
| status | String | Audit Routes.csv → Status |

### qr_assets
| Column | Type | Source |
|--------|------|--------|
| id | UUID PK | Generated |
| account_name | String | QR Assets.csv → Account |
| audit_url | String | QR Assets.csv → Audit URL |
| suggested_use | Text | QR Assets.csv → Suggested Use |
| proof_asset | Text | QR Assets.csv → Proof Asset |
| graphic_file | String | QR Assets.csv → Graphic File |

### mobile_captures
| Column | Type | Source |
|--------|------|--------|
| id | UUID PK | Generated |
| captured_at | DateTime | Mobile Capture.csv → Captured At |
| account_name | String | Mobile Capture.csv → Account |
| persona_name | String | Mobile Capture.csv → Persona Name |
| title | String? | Mobile Capture.csv → Title |
| channel | String | Mobile Capture.csv → Channel |
| intent | String | Mobile Capture.csv → Intent |
| need_trigger | Text? | Mobile Capture.csv → Need / Trigger |
| requested_asset | String? | Mobile Capture.csv → Requested Asset |
| need_primo | Boolean | Mobile Capture.csv → Need Primo? |
| owner | String | Mobile Capture.csv → Owner |
| due_date | DateTime? | Mobile Capture.csv → Due Date |
| next_step | Text | Mobile Capture.csv → Next Step |
| outcome | Text? | Mobile Capture.csv → Outcome |
| notes | Text? | Mobile Capture.csv → Notes |
| interest | Int (1-5) | Mobile Capture.csv → Interest |
| urgency | Int (1-5) | Mobile Capture.csv → Urgency |
| influence | Int (1-5) | Mobile Capture.csv → Influence |
| fit | Int (1-5) | Mobile Capture.csv → Fit |
| heat_score | Int | Computed: Interest + Urgency + Influence + Fit (4-20) |
| band | String | Computed from heat_score |
| followup_template | String? | Mobile Capture.csv → Follow-Up Template |
| followup_status | String? | Mobile Capture.csv → Follow-Up Status |
| audit_url | String? | Mobile Capture.csv → Audit URL |
| source_proof_link | String? | Mobile Capture.csv → Source / Proof Link |

### meetings
| Column | Type | Source |
|--------|------|--------|
| id | UUID PK | Generated |
| meeting_id | String | Meetings.csv → Meeting ID |
| account_name | String | Meetings.csv → Account |
| persona_name | String? | Meetings.csv → Persona |
| meeting_status | String | Meetings.csv → Meeting Status |
| meeting_date | DateTime? | Meetings.csv → Meeting Date |
| meeting_time | String? | Meetings.csv → Meeting Time |
| location | String? | Meetings.csv → Location |
| primo_involved | Boolean | Meetings.csv → Primo Involved? |
| jake_confirmed | Boolean | Meetings.csv → Jake Confirmed? |
| objective | Text? | Meetings.csv → Objective |
| owner | String | Meetings.csv → Owner |
| post_meeting_next_step | Text? | Meetings.csv → Post-Meeting Next Step |
| notes | Text? | Meetings.csv → Notes |

### activities
| Column | Type | Source |
|--------|------|--------|
| id | UUID PK | Generated |
| activity_date | DateTime | Activities.csv → Activity Date |
| account_name | String | Activities.csv → Account |
| persona_name | String? | Activities.csv → Persona |
| activity_type | String | Activities.csv → Activity Type |
| owner | String | Activities.csv → Owner |
| outcome | Text? | Activities.csv → Outcome |
| next_step | Text? | Activities.csv → Next Step |
| next_step_due | DateTime? | Activities.csv → Next Step Due |
| notes | Text? | Activities.csv → Notes |

### search_strings
| Column | Type | Source |
|--------|------|--------|
| id | UUID PK | Generated |
| account_name | String | Search Strings.csv → Account |
| wave | String | Search Strings.csv → Wave |
| priority | String | Search Strings.csv → Priority |
| function | String | Search Strings.csv → Function |
| target_title_cluster | String | Search Strings.csv → Target Title Cluster |
| named_seed | String? | Search Strings.csv → Named Seed |
| sales_nav_query | Text | Search Strings.csv → Sales Nav Query |
| linkedin_query | Text | Search Strings.csv → LinkedIn People Query |
| google_xray_query | Text | Search Strings.csv → Google X-Ray Query |
| keywords_filters | Text? | Search Strings.csv → Keywords / Filters |
| source_signal | String? | Search Strings.csv → Source Signal |
| owner | String | Search Strings.csv → Owner |
| status | String | Search Strings.csv → Status |

### actionable_intel
| Column | Type | Source |
|--------|------|--------|
| id | UUID PK | Generated |
| account_name | String | Actionable Intel.csv → Account |
| intel_type | String | Actionable Intel.csv → Intel Type |
| why_it_matters | Text | Actionable Intel.csv → Why It Matters |
| how_to_find_it | Text | Actionable Intel.csv → How To Find It |
| owner | String | Actionable Intel.csv → Owner |
| status | String | Actionable Intel.csv → Status |
| field_to_update | String | Actionable Intel.csv → Field to Update |

### lists_config
| Column | Type | Source |
|--------|------|--------|
| id | UUID PK | Generated |
| category | String | Lists.csv → column header (verticals, signal_types, tiers, etc.) |
| key | String | Lists.csv → Control key |
| value | String | Lists.csv → Value |

---

## 4. Page Map

| Route | Purpose | Data source |
|-------|---------|-------------|
| `/` | Dashboard: pipeline summary, wave progress, upcoming due dates, meeting count | accounts, waves, activities |
| `/accounts` | Sortable/filterable table of all 20 accounts with rank, band, tier, status | accounts |
| `/accounts/[slug]` | Account detail with tabs: Overview, Personas, Outreach, Brief, Audit Route, Activities | accounts + joins |
| `/personas` | All 75 personas, filterable by account, priority, lane, seniority | personas |
| `/waves` | Wave timeline: Wave 0→3 with account cards, dates, status | outreach_waves |
| `/briefs` | 15 meeting briefs, click through to full detail | meeting_briefs |
| `/briefs/[account]` | Full brief: Why This Account, Why Now, Pain Points, Primo Relevance, Attendees, Prep | meeting_briefs |
| `/capture` | Mobile-optimized interaction capture form with heat scoring | mobile_captures (write) |
| `/queue` | Jake's Queue: non-blank, non-closed captures sorted by due date | mobile_captures (read) |
| `/audit-routes` | 20 ranked audit routes with clickable URLs and proof assets | audit_routes |
| `/qr` | QR code generator for all 20 account audit URLs | qr_assets |
| `/search` | 210+ search queries with copy-to-clipboard, filterable by account/wave/function | search_strings |
| `/intel` | 7 actionable intel tasks with status tracking | actionable_intel |
| `/activities` | Activity log with CRUD | activities |
| `/meetings` | Meeting tracker | meetings |

---

## 5. Technical Architecture

### Frontend
- **Next.js 15** with App Router (server components by default)
- **TypeScript** strict mode
- **Tailwind CSS** + **shadcn/ui** component library
- **Server Actions** for mutations (no separate API layer needed)

### Backend
- **Prisma ORM** for type-safe database access
- **Railway PostgreSQL** for managed database
- **Server Actions** for all writes (capture form, status updates, activity log)

### Data Layer
- **Sprint 1**: Local JSON data files generated from CSVs (zero external dependency)
- **Sprint 2+**: Prisma + Railway PostgreSQL (one env var swap)
- **Seed script**: `scripts/seed.ts` reads all 16 CSVs, parses, inserts via Prisma

### Deployment
- **Vercel**: frontend deploy, auto-preview on push
- **Railway**: PostgreSQL database
- **GitHub**: source of truth, CI/CD trigger

---

## 6. Auth & Permissions

### MVP (Sprint 1-5)
- No auth — single-team tool, protected by URL obscurity
- All users see all data

### Sprint 6
- **NextAuth.js** with credentials provider
- Two users: Casey (admin), Jake (rep)
- Middleware-based route protection
- Casey: full CRUD on all entities
- Jake: read all, write captures/activities/meetings, update own queue items

---

## 7. Import Strategy

### Automated seed pipeline
1. All 16 CSVs live in repo root (already present)
2. `scripts/seed.ts` uses Papa Parse to read each CSV
3. Maps CSV columns to Prisma model fields
4. Handles data cleaning:
   - `#VALUE!` in priority_score → recompute using weighted formula
   - `Yes`/`No` → boolean
   - Date strings → ISO DateTime
   - Empty strings → null
5. Inserts via `prisma.createMany()` with `skipDuplicates`
6. Run: `npx tsx scripts/seed.ts`

### Specific data to import
- **20 accounts**: Dannon (rank 1), General Mills (1), Frito-Lay (1), Diageo (1), Hormel (1), JM Smucker (1), Home Depot (7), Georgia Pacific (7), H-E-B (7), Hyundai (10), Honda (10), John Deere (10), Kenco (13), Barnes & Noble (13), FedEx (13), Dawn Foods (7), Del Monte (7), Dollar General (12), Dollar Tree (16), IKEA (20)
- **75 personas**: P-001 (Heiko Gerling, Danone COO) through P-075 (Jake Pyke, FedEx linehaul)
- **15 outreach waves**: Wave 0 (Dannon, 3/24) → Wave 1 (6 accounts, 3/27) → Wave 2 (5 accounts, 3/30) → Wave 3 (3 accounts, 4/2)
- **15 meeting briefs**: one per account in Accounts.csv
- **20 audit routes**: UTM-tracked yardflow.ai/contact URLs
- **20 QR assets**: account-specific QR cards
- **210+ search strings**: Sales Nav + LinkedIn + Google X-Ray per account/function
- **7 actionable intel items**: facility footprint, tech stack, named leaders, broker pain, keynote, partner angle
- **1 activity**: Dannon warm intro request (3/24/2026)
- **~50 list config entries**: verticals, signal types, tiers, statuses, weights, cutoffs

---

## 8. Scoring & Queue Logic

### Account Priority Score (from Lists.csv weights)
```
priority_score = (icp_fit × 30 + modex_signal × 20 + primo_story_fit × 20 + warm_intro × 15 + strategic_value × 10 + meeting_ease × 5) / 5
```
- Max possible: (5×30 + 5×20 + 5×20 + 5×15 + 5×10 + 5×5) / 5 = 100
- **Tier 1**: score ≥ 85
- **Tier 2**: score ≥ 70
- **Tier 3**: score < 70

### Priority Band
- **A**: Top quartile of computed scores
- **B**: Second quartile
- **C**: Third quartile
- **D**: Bottom quartile

### Heat Score (from Mobile Capture)
```
heat_score = interest + urgency + influence + fit
```
- Range: 4-20
- **Hot (16-20)**: Immediate follow-up, top of Jake Queue
- **Warm (10-15)**: Standard follow-up cadence
- **Cool (4-9)**: Nurture / deprioritize

### Jake Queue Rules
1. Filter: `account IS NOT NULL AND status != 'Closed'`
2. Sort: `due_date ASC` (soonest first)
3. Secondary sort: `heat_score DESC` (hottest first within same date)

---

## 9. Content Generation Architecture

### Meeting Briefs (pre-built, imported from CSV)
Each brief contains:
- **Why This Account**: e.g., "Closest analog to Primo and strongest warm-intro path" (Dannon)
- **Why Now**: e.g., "New CSCO in March 2026" (General Mills, Hormel)
- **Likely Pain Points**: "Trailer queue variability, gate/dock congestion, inconsistent driver journey, poor site-to-site standardization"
- **Primo Relevance**: account-specific proof angle
- **Suggested Attendees**: role-based (COO, CSCO, VP Logistics, etc.)
- **Prep Assets**: Primo infographic, one-pagers, reference calls

### Future: AI-generated outreach (post-MVP)
- Feed persona + brief + wave into LLM to generate personalized outreach
- Template library per channel (email, LinkedIn, call script)

---

## 10. Sending Architecture

### MVP
- **No automated sending** — this is an internal ops tool
- Copy-to-clipboard for:
  - Audit route URLs (with UTM parameters)
  - Search strings (Sales Nav, LinkedIn, Google X-Ray)
  - Fast Ask messaging (from Audit Routes.csv → Fast Ask column)
  - Suggested messaging (from Audit Routes.csv → Suggested "What should we know?" column)

### Future
- Email integration (SendGrid/Resend) for outreach wave automation
- LinkedIn message templates with tracking
- Calendar integration for meeting booking

---

## 11. Sprint Plan

### Sprint 1 — Foundation (demoable: accounts dashboard with real data)
| # | Task | Atomic file(s) | Validation |
|---|------|----------------|------------|
| 1.1 | Next.js scaffold with App Router + TS + Tailwind | `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs` | `npm run build` passes |
| 1.2 | Install shadcn/ui + Lucide icons | `components/ui/*` | Import renders |
| 1.3 | Create Prisma schema (12 models) | `prisma/schema.prisma` | `npx prisma validate` passes |
| 1.4 | Generate local JSON seed data from all 16 CSVs | `lib/data/*.json` (12 files) | JSON files contain correct row counts |
| 1.5 | Create data access layer (reads JSON for now, Prisma-ready) | `lib/data.ts` | Functions return typed data |
| 1.6 | Build sidebar + app layout | `app/layout.tsx`, `components/sidebar.tsx` | Navigation renders on all routes |
| 1.7 | Build accounts list page | `app/accounts/page.tsx` | All 20 accounts render with rank, band, vertical |
| 1.8 | Build account detail page with tabs | `app/accounts/[slug]/page.tsx` | Dannon shows 5 personas, Wave 0, brief |
| 1.9 | Build reusable data table component | `components/data-table.tsx` | Sort + filter works |
| 1.10 | Build scoring engine | `lib/scoring.ts` | Dannon: (5×30+4×20+5×20+5×15+5×10+4×5)/5 = 93 → Tier 1 |
| **Demo** | Navigate to /accounts, see 20 ranked accounts, click Dannon, see personas + brief + wave assignment |

### Sprint 2 — People & Outreach (demoable: persona directory + wave timeline)
| # | Task | Atomic file(s) | Validation |
|---|------|----------------|------------|
| 2.1 | Build personas list page with filters | `app/personas/page.tsx` | 75 personas render |
| 2.2 | Build outreach waves page with timeline | `app/waves/page.tsx` | 4 waves with correct accounts |
| 2.3 | Build meeting briefs list | `app/briefs/page.tsx` | 15 briefs listed |
| 2.4 | Build meeting brief detail page | `app/briefs/[account]/page.tsx` | Full brief content renders |
| 2.5 | Wire persona links on account detail | `app/accounts/[slug]/page.tsx` update | Click persona → persona detail |
| **Demo** | Navigate to /personas, filter by Diageo, see 5 personas. Click Waves, see timeline. Open Dannon brief. |

### Sprint 3 — Field Ops (demoable: capture interaction at MODEX, see it in queue)
| # | Task | Atomic file(s) | Validation |
|---|------|----------------|------------|
| 3.1 | Build mobile capture form | `app/capture/page.tsx` | Form renders, validates on mobile |
| 3.2 | Implement heat score calculation | `lib/scoring.ts` update | Score = sum of 4 dimensions |
| 3.3 | Build Jake Queue page | `app/queue/page.tsx` | Filter non-blank, non-closed, sort by due date |
| 3.4 | Wire capture → queue pipeline | Server action | Submit capture → appears in queue |
| 3.5 | Connect to Railway PostgreSQL | `.env`, `lib/db.ts` | `npx prisma db push` succeeds |
| 3.6 | Run seed script against live DB | `scripts/seed.ts` | Row counts match |
| **Demo** | Open /capture on phone, log interaction with Dannon, see it appear in /queue sorted correctly. |

### Sprint 4 — GTM Tools (demoable: scan QR → see audit route → copy search string)
| # | Task | Atomic file(s) | Validation |
|---|------|----------------|------------|
| 4.1 | Build audit routes page | `app/audit-routes/page.tsx` | 20 routes with clickable URLs |
| 4.2 | Build QR code generator page | `app/qr/page.tsx` | 20 QR codes scan correctly |
| 4.3 | Build search strings page | `app/search/page.tsx` | 210+ queries with copy button |
| 4.4 | Add copy-to-clipboard for messaging | Components | Fast Ask + Suggested messaging copy works |
| **Demo** | Open /qr, show Dannon QR → scan → lands on yardflow.ai audit page. Copy Dannon Sales Nav query. |

### Sprint 5 — Intel & Tracking (demoable: complete activity tracking loop)
| # | Task | Atomic file(s) | Validation |
|---|------|----------------|------------|
| 5.1 | Build actionable intel page | `app/intel/page.tsx` | 7 intel items render |
| 5.2 | Build activity log page | `app/activities/page.tsx` | CRUD works |
| 5.3 | Build meetings page | `app/meetings/page.tsx` | Meeting tracking works |
| 5.4 | Add status update actions throughout | Server actions | Status changes persist |
| 5.5 | Wire scoring engine to compute priority_score replacing #VALUE! | `lib/scoring.ts` | All 20 accounts have numeric scores |
| **Demo** | Log activity for Dannon, update meeting status, see intel tasks. All scores computed correctly. |

### Sprint 6 — Auth, Dashboard & Deploy (demoable: live URL with login)
| # | Task | Atomic file(s) | Validation |
|---|------|----------------|------------|
| 6.1 | Build summary dashboard | `app/page.tsx` | Stats match data |
| 6.2 | Add NextAuth.js with credentials | `app/api/auth/*`, `middleware.ts` | Login/logout works |
| 6.3 | Deploy to Vercel | Vercel config | Live URL accessible |
| 6.4 | Connect Railway PostgreSQL to Vercel | Environment variables | Data persists across deploys |
| 6.5 | Polish responsive design for mobile | CSS updates | Mobile-friendly at MODEX |
| **Demo** | Log in as Jake, open on phone, capture interaction, see queue, open brief, scan QR — full loop. |

---

## 12. Risks & Tradeoffs

| Risk | Impact | Mitigation |
|------|--------|------------|
| Railway PostgreSQL cold start latency | First query slow after idle | Acceptable for internal tool; add connection pooling if needed |
| 75 personas + 210 search strings = lots of seed data | Seed script may timeout | Use `createMany` with batching |
| No auth in Sprint 1-5 | Anyone with URL can access | Acceptable for pre-MODEX internal use; auth added Sprint 6 |
| QR codes generated client-side | Slight load time | Use server-side generation + cache |
| Scoring formula may need tuning | Tiers could shift | Formula is configurable via lists_config table |
| Mobile Capture has 24 fields | User friction at MODEX | Progressive form: required fields first, optional later |

---

## 13. Migration Plan

### Phase 1: CSV → App (Sprint 1-2)
1. Import all CSV data as seed
2. Team starts using app for read-only reference
3. CSVs remain as backup

### Phase 2: App becomes primary (Sprint 3-4)
1. Mobile Capture moves to app (no more sheet logging)
2. Jake Queue is live computed, not manually filtered
3. Status updates happen in app

### Phase 3: CSVs archived (Sprint 5-6)
1. All writes happen in app
2. CSVs moved to `/archive/` folder
3. Export functionality added for reporting

---

## 14. MVP vs Later Enhancements

### MVP (Sprints 1-6)
- [x] All CSV data imported and queryable
- [x] Accounts dashboard with scoring
- [x] Persona directory
- [x] Outreach wave tracking
- [x] Meeting briefs
- [x] Mobile capture + heat scoring
- [x] Jake Queue
- [x] Audit routes + QR codes
- [x] Search string library
- [x] Activity tracking
- [x] Basic auth
- [x] Vercel deploy

### Later
- [ ] AI-generated outreach copy per persona/wave
- [ ] Email sending integration (Resend/SendGrid)
- [ ] LinkedIn automation
- [ ] Calendar integration (Cal.com)
- [ ] CRM sync (HubSpot/Salesforce)
- [ ] Real-time collaboration (WebSocket updates)
- [ ] Analytics dashboard (conversion funnel, wave performance)
- [ ] Mobile native app (React Native)
- [ ] Multi-campaign support (beyond MODEX 2026)
