# MQL/SQL Qualification Engine Implementation Plan

> **STATUS: HISTORICAL.** A dated plan/spec record, retained for context and rationale. It describes intent at the time of writing; the code has moved since, so it is NOT current guidance. For present state read `git log --since=7d`, the live system, and `plans/README.md`. Last verified 2026-08-06.


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tested engine that computes a per-contact qualification verdict (`none`/`mql`/`sql`) from TAM fit × role × intent, writes it to HubSpot as `yardflow_qual_verdict`, and lets native HubSpot Lists + Workflows actuate lifecycle promotion and alerts.

**Architecture:** Hybrid. Pure-function model + dry-run/apply pipeline in `modex-gtm/src/lib/revops/qualification/`, exposed via a `CRON_SECRET`-guarded cron route (`?mode=dryrun` default, `?mode=apply`). The verdict write is side-effect-free; native HubSpot workflows (built via the browser rig, left OFF until gated activation) translate verdict → `lifecyclestage` + Slack/task. Code decides; HubSpot acts.

**Tech Stack:** Next.js App Router, TypeScript, `@hubspot/api-client`, Vitest. Existing helpers: `src/lib/hubspot/{client,contacts,companies,properties}.ts`, `src/lib/enrichment/external-write-guard.ts`.

---

## File Structure

```
src/lib/revops/qualification/
  types.ts        # Verdict, QualContact, QualCompany, VerdictDiff, EvaluateResult
  model.ts        # PURE: classifyContact(); thresholds, OPS_TITLE_TOKENS, rank tables
  model.test.ts   # Vitest: decision matrix, no network
  evaluate.ts     # fetchTamCompanies(), fetchAssociatedContacts(), evaluateQualification()
  evaluate.test.ts# Vitest: evaluate over fixtures (no live calls)
  apply.ts        # applyVerdicts(diff) — batch-writes yardflow_qual_verdict, write-guarded
src/lib/hubspot/properties.ts          # MODIFY: add ensureQualificationProperties()
src/app/api/cron/qualification/route.ts# cron entry: dryrun | apply
docs/superpowers/specs/2026-06-11-mql-sql-qualification-engine-design.md  # (exists)
```

Native HubSpot artifacts (built via `C:\Users\casey\yardflow-hubspot` rig, not code): 2 Active Lists, 2 Workflows, 2 contact properties. Documented in Sprint 3–4 tasks.

---

## Sprint 0 — Recon & properties

### Task 0.1: Define qualification types

**Files:**
- Create: `src/lib/revops/qualification/types.ts`

- [ ] **Step 1: Write the types file**

```typescript
// src/lib/revops/qualification/types.ts
export type Verdict = 'none' | 'mql' | 'sql';

/** Raw contact properties the engine reads (HubSpot returns all as strings). */
export interface QualContact {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  jobtitle: string;
  lifecyclestage: string;
  hs_seniority: string;
  hs_role: string;
  yardflow_qual_verdict: string;
  intent_score: string;
  last_intent_at: string;
  last_intent_source: string;
  hs_sales_email_last_replied: string;
  hs_email_open: string;
  hs_email_replied: string;
  engagements_last_meeting_booked: string;
}

export interface QualCompany {
  id: string;
  name: string;
  icpScore: number;
}

export interface VerdictDiff {
  contactId: string;
  name: string;
  email: string;
  companyId: string;
  companyName: string;
  icpScore: number;
  seniority: string;
  role: string;
  jobtitle: string;
  currentLifecycle: string;
  currentVerdict: Verdict;
  newVerdict: Verdict;
  changed: boolean;
  reason: string;
}

export interface EvaluateResult {
  evaluatedAt: string;
  companies: number;
  contacts: number;
  counts: Record<Verdict, number>;
  changes: number;
  diff: VerdictDiff[];
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /c/Users/casey/modex-gtm && npx tsc --noEmit -p tsconfig.json 2>&1 | grep qualification || echo OK`
Expected: `OK` (no errors referencing qualification)

- [ ] **Step 3: Commit**

```bash
git add src/lib/revops/qualification/types.ts
git commit -m "feat(qual): qualification engine types"
```

### Task 0.2: Ensure the two new contact properties

**Files:**
- Modify: `src/lib/hubspot/properties.ts` (append a new exported function, follow `ensureYardflowIcpScoreProperty` pattern at line ~115)

- [ ] **Step 1: Read the existing pattern**

Run: `sed -n '115,170p' src/lib/hubspot/properties.ts`
Expected: see how `ensureYardflowIcpScoreProperty` creates a property via the client (group, type, fieldType, options). Mirror it.

- [ ] **Step 2: Append `ensureQualificationProperties`**

```typescript
// append to src/lib/hubspot/properties.ts
export const YARDFLOW_QUAL_VERDICT_PROPERTY = 'yardflow_qual_verdict';
export const YARDFLOW_QUAL_EVALUATED_AT_PROPERTY = 'yardflow_qual_evaluated_at';

/**
 * Ensure the qualification-engine contact properties exist.
 * yardflow_qual_verdict: enumeration none/mql/sql (the engine's opinion).
 * yardflow_qual_evaluated_at: datetime audit stamp.
 * Idempotent: ignores "property already exists" (409) errors.
 */
export async function ensureQualificationProperties(): Promise<void> {
  const client = getHubSpotClient();
  const defs = [
    {
      name: YARDFLOW_QUAL_VERDICT_PROPERTY,
      label: 'YardFlow Qualification Verdict',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'contactinformation',
      options: [
        { label: 'None', value: 'none', displayOrder: 0, hidden: false },
        { label: 'MQL', value: 'mql', displayOrder: 1, hidden: false },
        { label: 'SQL', value: 'sql', displayOrder: 2, hidden: false },
      ],
    },
    {
      name: YARDFLOW_QUAL_EVALUATED_AT_PROPERTY,
      label: 'YardFlow Qualification Evaluated At',
      type: 'datetime',
      fieldType: 'date',
      groupName: 'contactinformation',
    },
  ];
  for (const def of defs) {
    try {
      await withHubSpotRetry(
        () => client.crm.properties.coreApi.create('contacts', def as never),
        `ensureQualificationProperties(${def.name})`,
      );
    } catch (err: unknown) {
      const status = (err as { code?: number })?.code;
      if (status === 409) continue; // already exists
      throw err;
    }
  }
}
```

- [ ] **Step 3: Run it once (one-off script)**

Create a throwaway and run it:
```bash
cat > /tmp/ensure-qual.mjs <<'EOF'
import 'dotenv/config';
import { ensureQualificationProperties } from './src/lib/hubspot/properties.ts';
await ensureQualificationProperties();
console.log('qualification properties ensured');
EOF
npx tsx /tmp/ensure-qual.mjs
```
Expected: `qualification properties ensured` (or 409s silently skipped). If `tsx` is unavailable, run via the cron route in Task 2.3 which calls it on boot.

- [ ] **Step 4: Verify in HubSpot**

Run: `node -e "console.log('verify yardflow_qual_verdict exists on a contact in HubSpot UI or via MCP get_properties')"`
Expected: property `yardflow_qual_verdict` present (enumeration none/mql/sql).

- [ ] **Step 5: Commit**

```bash
git add src/lib/hubspot/properties.ts
git commit -m "feat(qual): ensure yardflow_qual_verdict + evaluated_at properties"
```

---

## Sprint 1 — Model + tests (TDD)

### Task 1.1: Role gate (failing test first)

**Files:**
- Create: `src/lib/revops/qualification/model.test.ts`
- Create: `src/lib/revops/qualification/model.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/revops/qualification/model.test.ts
import { describe, it, expect } from 'vitest';
import { hasRoleGate } from './model';

const base = { hs_seniority: '', hs_role: '', jobtitle: '' };

describe('hasRoleGate', () => {
  it('includes senior leaders of any function', () => {
    expect(hasRoleGate({ ...base, hs_seniority: 'vp' })).toBe(true);
    expect(hasRoleGate({ ...base, hs_seniority: 'director' })).toBe(true);
    expect(hasRoleGate({ ...base, hs_seniority: 'executive' })).toBe(true);
  });
  it('includes structured operations role', () => {
    expect(hasRoleGate({ ...base, hs_role: 'operations' })).toBe(true);
  });
  it('includes ops job titles even at manager level', () => {
    expect(hasRoleGate({ ...base, jobtitle: 'Supply Chain Manager' })).toBe(true);
    expect(hasRoleGate({ ...base, jobtitle: 'Director of Yard Operations' })).toBe(true);
    expect(hasRoleGate({ ...base, jobtitle: 'Logistics Coordinator' })).toBe(true);
  });
  it('excludes junior off-function people', () => {
    expect(hasRoleGate({ ...base, hs_seniority: 'entry', hs_role: 'information_technology', jobtitle: 'IT Analyst' })).toBe(false);
    expect(hasRoleGate({ ...base, hs_seniority: 'employee', hs_role: 'marketing', jobtitle: 'Marketing Associate' })).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /c/Users/casey/modex-gtm && npx vitest run src/lib/revops/qualification/model.test.ts`
Expected: FAIL — `hasRoleGate` is not exported / module not found.

- [ ] **Step 3: Implement the model with the role gate**

```typescript
// src/lib/revops/qualification/model.ts
import type { Verdict, QualContact, QualCompany } from './types';

export const ICP_THRESHOLD = 70;
export const SENIOR_SENIORITY = new Set(['executive', 'vp', 'director', 'owner', 'partner']);
export const OPS_TITLE_TOKENS = [
  'operations', 'supply chain', 'transportation', 'transport', 'logistics',
  'warehouse', 'distribution', 'fleet', 'freight', 'dock', 'yard', 'procurement', 'planning',
];

type RoleInput = { hs_seniority: string; hs_role: string; jobtitle: string };

export function hasRoleGate(c: RoleInput): boolean {
  const sen = (c.hs_seniority || '').toLowerCase();
  if (SENIOR_SENIORITY.has(sen)) return true;
  if ((c.hs_role || '').toLowerCase() === 'operations') return true;
  const title = ` ${(c.jobtitle || '').toLowerCase()} `;
  if (OPS_TITLE_TOKENS.some((t) => title.includes(t)) || title.includes(' dc '))
    return true;
  return false;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/revops/qualification/model.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/revops/qualification/model.ts src/lib/revops/qualification/model.test.ts
git commit -m "feat(qual): role gate with tests"
```

### Task 1.2: Intent gate

**Files:**
- Modify: `src/lib/revops/qualification/model.test.ts`, `src/lib/revops/qualification/model.ts`

- [ ] **Step 1: Add failing tests for `hasIntent`**

```typescript
// append to model.test.ts
import { hasIntent } from './model';

const noIntent = {
  intent_score: '', last_intent_at: '', last_intent_source: '',
  hs_sales_email_last_replied: '', hs_email_open: '', hs_email_replied: '',
  engagements_last_meeting_booked: '',
};

describe('hasIntent', () => {
  it('false with no signals', () => { expect(hasIntent(noIntent)).toBe(false); });
  it('true on intent_score >= 1', () => { expect(hasIntent({ ...noIntent, intent_score: '1' })).toBe(true); });
  it('true on a reply', () => { expect(hasIntent({ ...noIntent, hs_sales_email_last_replied: '2026-06-01' })).toBe(true); });
  it('true on a booked meeting', () => { expect(hasIntent({ ...noIntent, engagements_last_meeting_booked: '2026-06-01' })).toBe(true); });
  it('true on demo visit source', () => { expect(hasIntent({ ...noIntent, last_intent_source: '/demo/acme' })).toBe(true); });
  it('true on 2 opens + 1 click', () => { expect(hasIntent({ ...noIntent, hs_email_open: '2', hs_email_replied: '1' })).toBe(true); });
  it('false on opens without reply', () => { expect(hasIntent({ ...noIntent, hs_email_open: '5' })).toBe(false); });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/revops/qualification/model.test.ts`
Expected: FAIL — `hasIntent` not exported.

- [ ] **Step 3: Implement `hasIntent`**

```typescript
// append to model.ts
type IntentInput = Pick<QualContact,
  'intent_score' | 'last_intent_at' | 'last_intent_source' |
  'hs_sales_email_last_replied' | 'hs_email_open' | 'hs_email_replied' |
  'engagements_last_meeting_booked'>;

const num = (s: string): number => { const n = parseFloat(s); return Number.isNaN(n) ? 0 : n; };

export function hasIntent(c: IntentInput): boolean {
  if (num(c.intent_score) >= 1) return true;
  if (c.last_intent_at) return true;
  if (c.last_intent_source) return true;
  if (c.hs_sales_email_last_replied) return true;
  if (c.engagements_last_meeting_booked) return true;
  if (num(c.hs_email_open) >= 2 && num(c.hs_email_replied) >= 1) return true;
  return false;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/revops/qualification/model.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add src/lib/revops/qualification/model.ts src/lib/revops/qualification/model.test.ts
git commit -m "feat(qual): intent gate with tests"
```

### Task 1.3: classifyContact (compose the gates)

**Files:**
- Modify: `model.test.ts`, `model.ts`

- [ ] **Step 1: Add failing tests for `classifyContact`**

```typescript
// append to model.test.ts
import { classifyContact } from './model';
import type { QualContact, QualCompany } from './types';

const tam: QualCompany = { id: 'c1', name: 'Acme', icpScore: 85 };
const offTam: QualCompany = { id: 'c2', name: 'Tiny', icpScore: 40 };
const opsDir = { ...noIntent, hs_seniority: 'director', hs_role: 'operations', jobtitle: 'Director of Operations' } as QualContact;

describe('classifyContact', () => {
  it('none when account below ICP threshold', () => {
    expect(classifyContact(offTam, opsDir)).toBe('none');
  });
  it('none when no company', () => {
    expect(classifyContact(null, opsDir)).toBe('none');
  });
  it('none for off-role at TAM account', () => {
    expect(classifyContact(tam, { ...noIntent, hs_seniority: 'entry', hs_role: 'finance', jobtitle: 'Accountant' } as QualContact)).toBe('none');
  });
  it('mql for ops director at TAM, no intent', () => {
    expect(classifyContact(tam, opsDir)).toBe('mql');
  });
  it('sql for ops director at TAM with intent', () => {
    expect(classifyContact(tam, { ...opsDir, intent_score: '2' })).toBe('sql');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/revops/qualification/model.test.ts`
Expected: FAIL — `classifyContact` not exported.

- [ ] **Step 3: Implement `classifyContact`**

```typescript
// append to model.ts
export function classifyContact(company: QualCompany | null, contact: QualContact): Verdict {
  if (!company || company.icpScore < ICP_THRESHOLD) return 'none';
  if (!hasRoleGate(contact)) return 'none';
  if (hasIntent(contact)) return 'sql';
  return 'mql';
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/revops/qualification/model.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add src/lib/revops/qualification/model.ts src/lib/revops/qualification/model.test.ts
git commit -m "feat(qual): classifyContact composes TAM + role + intent gates"
```

---

## Sprint 2 — Evaluate (dry-run pipeline)

### Task 2.1: Fetch TAM companies + associated contacts

**Files:**
- Create: `src/lib/revops/qualification/evaluate.ts`

- [ ] **Step 1: Implement the fetchers**

```typescript
// src/lib/revops/qualification/evaluate.ts
import { getHubSpotClient, withHubSpotRetry, isHubSpotConfigured } from '@/lib/hubspot/client';
import { YARDFLOW_ICP_SCORE_PROPERTY } from '@/lib/hubspot/properties';
import { classifyContact } from './model';
import type { QualCompany, QualContact, VerdictDiff, EvaluateResult, Verdict } from './types';

const CONTACT_READ_PROPS = [
  'email', 'firstname', 'lastname', 'jobtitle', 'lifecyclestage', 'hs_seniority', 'hs_role',
  'yardflow_qual_verdict', 'intent_score', 'last_intent_at', 'last_intent_source',
  'hs_sales_email_last_replied', 'hs_email_open', 'hs_email_replied', 'engagements_last_meeting_booked',
];

/** Companies scoring >= threshold on the ICP score (the TAM). Paginated. */
export async function fetchTamCompanies(minScore = 70): Promise<QualCompany[]> {
  if (!isHubSpotConfigured()) return [];
  const client = getHubSpotClient();
  const out: QualCompany[] = [];
  let after = '0';
  for (;;) {
    const res = await withHubSpotRetry(
      () => client.crm.companies.searchApi.doSearch({
        filterGroups: [{ filters: [{ propertyName: YARDFLOW_ICP_SCORE_PROPERTY, operator: 'GTE' as never, value: String(minScore) }] }],
        properties: ['name', YARDFLOW_ICP_SCORE_PROPERTY],
        limit: 100, after, sorts: [],
      }),
      'fetchTamCompanies',
    );
    for (const r of res.results) {
      out.push({ id: r.id, name: r.properties.name || '', icpScore: parseFloat(r.properties[YARDFLOW_ICP_SCORE_PROPERTY] || '0') || 0 });
    }
    const next = res.paging?.next?.after;
    if (!next) break;
    after = next;
  }
  return out;
}

/** Associated contact IDs for a company (default association). */
export async function fetchAssociatedContactIds(companyId: string): Promise<string[]> {
  const client = getHubSpotClient();
  const res = await withHubSpotRetry(
    () => client.crm.associations.v4.basicApi.getPage('companies', companyId, 'contacts', undefined, 500),
    `assoc(${companyId})`,
  );
  return res.results.map((a) => String((a as { toObjectId: number }).toObjectId));
}

/** Batch-read contacts with the qualification property set. */
export async function readContacts(ids: string[]): Promise<QualContact[]> {
  if (ids.length === 0) return [];
  const client = getHubSpotClient();
  const out: QualContact[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);
    const res = await withHubSpotRetry(
      () => client.crm.contacts.batchApi.read({
        inputs: batch.map((id) => ({ id })),
        properties: CONTACT_READ_PROPS, propertiesWithHistory: [],
      }),
      `readContacts(${batch.length})`,
    );
    for (const r of res.results) {
      const p = r.properties as Record<string, string | null>;
      out.push({
        id: r.id,
        email: p.email || '', firstname: p.firstname || '', lastname: p.lastname || '',
        jobtitle: p.jobtitle || '', lifecyclestage: p.lifecyclestage || '',
        hs_seniority: p.hs_seniority || '', hs_role: p.hs_role || '',
        yardflow_qual_verdict: p.yardflow_qual_verdict || 'none',
        intent_score: p.intent_score || '', last_intent_at: p.last_intent_at || '',
        last_intent_source: p.last_intent_source || '',
        hs_sales_email_last_replied: p.hs_sales_email_last_replied || '',
        hs_email_open: p.hs_email_open || '', hs_email_replied: p.hs_email_replied || '',
        engagements_last_meeting_booked: p.engagements_last_meeting_booked || '',
      });
    }
  }
  return out;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep qualification/evaluate || echo OK`
Expected: `OK`. If the associations v4 signature differs in the installed SDK version, adjust the call to match `npm ls @hubspot/api-client` — keep the function contract (returns string[] ids).

- [ ] **Step 3: Commit**

```bash
git add src/lib/revops/qualification/evaluate.ts
git commit -m "feat(qual): TAM company + associated contact fetchers"
```

### Task 2.2: evaluateQualification — build the diff (tested over fixtures)

**Files:**
- Create: `src/lib/revops/qualification/evaluate.test.ts`
- Modify: `src/lib/revops/qualification/evaluate.ts`

- [ ] **Step 1: Write the failing test (pure diff builder over fixtures)**

```typescript
// src/lib/revops/qualification/evaluate.test.ts
import { describe, it, expect } from 'vitest';
import { buildDiff } from './evaluate';
import type { QualCompany, QualContact } from './types';

const co: QualCompany = { id: 'c1', name: 'Acme', icpScore: 90 };
const mk = (over: Partial<QualContact>): QualContact => ({
  id: 'x', email: 'a@acme.com', firstname: 'A', lastname: 'B', jobtitle: '', lifecyclestage: 'lead',
  hs_seniority: '', hs_role: '', yardflow_qual_verdict: 'none', intent_score: '', last_intent_at: '',
  last_intent_source: '', hs_sales_email_last_replied: '', hs_email_open: '', hs_email_replied: '',
  engagements_last_meeting_booked: '', ...over,
});

describe('buildDiff', () => {
  it('flags an MQL change for an ops director with no current verdict', () => {
    const rows = buildDiff([{ company: co, contact: mk({ hs_seniority: 'director', hs_role: 'operations' }) }]);
    expect(rows[0].newVerdict).toBe('mql');
    expect(rows[0].changed).toBe(true);
  });
  it('marks unchanged when current verdict already matches', () => {
    const rows = buildDiff([{ company: co, contact: mk({ hs_seniority: 'director', yardflow_qual_verdict: 'mql' }) }]);
    expect(rows[0].changed).toBe(false);
  });
  it('produces sql with intent', () => {
    const rows = buildDiff([{ company: co, contact: mk({ hs_seniority: 'vp', intent_score: '3' }) }]);
    expect(rows[0].newVerdict).toBe('sql');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/revops/qualification/evaluate.test.ts`
Expected: FAIL — `buildDiff` not exported.

- [ ] **Step 3: Implement `buildDiff` and `evaluateQualification`**

```typescript
// append to evaluate.ts
export function buildDiff(pairs: { company: QualCompany; contact: QualContact }[]): VerdictDiff[] {
  return pairs.map(({ company, contact }) => {
    const newVerdict = classifyContact(company, contact);
    const currentVerdict = (contact.yardflow_qual_verdict || 'none') as Verdict;
    return {
      contactId: contact.id,
      name: `${contact.firstname} ${contact.lastname}`.trim(),
      email: contact.email,
      companyId: company.id, companyName: company.name, icpScore: company.icpScore,
      seniority: contact.hs_seniority, role: contact.hs_role, jobtitle: contact.jobtitle,
      currentLifecycle: contact.lifecyclestage,
      currentVerdict, newVerdict, changed: newVerdict !== currentVerdict,
      reason: `icp=${company.icpScore} seniority=${contact.hs_seniority || '-'} role=${contact.hs_role || '-'} -> ${newVerdict}`,
    };
  });
}

/** Full live evaluation across the TAM. Read-only. */
export async function evaluateQualification(minScore = 70): Promise<EvaluateResult> {
  const evaluatedAt = new Date().toISOString();
  const companies = await fetchTamCompanies(minScore);
  const pairs: { company: QualCompany; contact: QualContact }[] = [];
  for (const company of companies) {
    const ids = await fetchAssociatedContactIds(company.id);
    const contacts = await readContacts(ids);
    for (const contact of contacts) pairs.push({ company, contact });
  }
  const diff = buildDiff(pairs);
  const counts: Record<Verdict, number> = { none: 0, mql: 0, sql: 0 };
  for (const d of diff) counts[d.newVerdict] += 1;
  return {
    evaluatedAt, companies: companies.length, contacts: pairs.length,
    counts, changes: diff.filter((d) => d.changed).length, diff,
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/revops/qualification/evaluate.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/revops/qualification/evaluate.ts src/lib/revops/qualification/evaluate.test.ts
git commit -m "feat(qual): buildDiff + evaluateQualification with fixture tests"
```

### Task 2.3: Cron route (dryrun default)

**Files:**
- Create: `src/app/api/cron/qualification/route.ts`
- Reference pattern: `src/app/api/cron/daily-digest/route.ts` (CRON_SECRET guard)

- [ ] **Step 1: Read the guard pattern**

Run: `sed -n '1,40p' src/app/api/cron/daily-digest/route.ts`
Expected: see how `CRON_SECRET` is checked (query `?secret=` or `authorization` header). Mirror exactly.

- [ ] **Step 2: Implement the route**

```typescript
// src/app/api/cron/qualification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ensureQualificationProperties } from '@/lib/hubspot/properties';
import { evaluateQualification } from '@/lib/revops/qualification/evaluate';
import { applyVerdicts } from '@/lib/revops/qualification/apply';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const url = new URL(req.url);
  if (url.searchParams.get('secret') === secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode') === 'apply' ? 'apply' : 'dryrun';
  const minScore = Number(url.searchParams.get('minScore') || '70');

  await ensureQualificationProperties();
  const result = await evaluateQualification(minScore);

  if (mode === 'dryrun') {
    return NextResponse.json({
      mode, evaluatedAt: result.evaluatedAt, companies: result.companies,
      contacts: result.contacts, counts: result.counts, changes: result.changes,
      sample: result.diff.filter((d) => d.changed).slice(0, 50),
    });
  }

  const applied = await applyVerdicts(result.diff.filter((d) => d.changed));
  return NextResponse.json({ mode, counts: result.counts, changes: result.changes, applied });
}
```

- [ ] **Step 3: Typecheck (apply import will fail until Task 3.1 — expected)**

Run: `npx tsc --noEmit 2>&1 | grep "cron/qualification" || echo OK`
Expected: error about missing `./apply` export — resolved in Sprint 3. Leave the import; do NOT stub.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cron/qualification/route.ts
git commit -m "feat(qual): cron route (dryrun default, apply gated)"
```

---

## Sprint 3 — Apply path + native surfaces

### Task 3.1: applyVerdicts (write-guarded batch write)

**Files:**
- Create: `src/lib/revops/qualification/apply.ts`

- [ ] **Step 1: Implement apply**

```typescript
// src/lib/revops/qualification/apply.ts
import { getHubSpotClient, withHubSpotRetry } from '@/lib/hubspot/client';
import { assertExternalWriteAllowed } from '@/lib/enrichment/external-write-guard';
import {
  YARDFLOW_QUAL_VERDICT_PROPERTY, YARDFLOW_QUAL_EVALUATED_AT_PROPERTY,
} from '@/lib/hubspot/properties';
import type { VerdictDiff } from './types';

/** Batch-write yardflow_qual_verdict + evaluated_at for changed rows. Side-effect-free in CRM terms. */
export async function applyVerdicts(changed: VerdictDiff[]): Promise<{ updated: number }> {
  assertExternalWriteAllowed('hubspot', 'applyVerdicts');
  if (changed.length === 0) return { updated: 0 };
  const client = getHubSpotClient();
  const now = new Date().toISOString();
  let updated = 0;
  for (let i = 0; i < changed.length; i += 100) {
    const batch = changed.slice(i, i + 100);
    await withHubSpotRetry(
      () => client.crm.contacts.batchApi.update({
        inputs: batch.map((d) => ({
          id: d.contactId,
          properties: {
            [YARDFLOW_QUAL_VERDICT_PROPERTY]: d.newVerdict,
            [YARDFLOW_QUAL_EVALUATED_AT_PROPERTY]: now,
          },
        })),
      }),
      `applyVerdicts(${batch.length})`,
    );
    updated += batch.length;
  }
  return { updated };
}
```

- [ ] **Step 2: Add a write-guard test**

```typescript
// src/lib/revops/qualification/apply.test.ts
import { describe, it, expect } from 'vitest';
import { applyVerdicts } from './apply';
import type { VerdictDiff } from './types';

const row = { contactId: '1', newVerdict: 'mql' } as VerdictDiff;

describe('applyVerdicts', () => {
  it('no-ops on empty input', async () => {
    expect(await applyVerdicts([])).toEqual({ updated: 0 });
  });
  it('is blocked by the external-write-guard in test mode', async () => {
    // NODE_ENV=test + default BLOCK_EXTERNAL_WRITES_IN_TEST -> throws
    await expect(applyVerdicts([row])).rejects.toThrow(/external-write-guard/);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/lib/revops/qualification/apply.test.ts`
Expected: PASS (2 tests — the guard throws as designed).

- [ ] **Step 4: Full typecheck now resolves the cron import**

Run: `npx tsc --noEmit 2>&1 | grep qualification || echo OK`
Expected: `OK`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/revops/qualification/apply.ts src/lib/revops/qualification/apply.test.ts
git commit -m "feat(qual): write-guarded applyVerdicts"
```

### Task 3.2: Build the 2 Active Lists (native, via browser rig)

**Files:**
- Reference: `C:\Users\casey\yardflow-hubspot\list-step*.mjs` (proven Active-List builder flow)

- [ ] **Step 1: Build "MQL — Qualified, awaiting intent"**

Active list, Contacts, single filter: `yardflow_qual_verdict` is equal to `MQL`. Save as active. Use the `list-step*.mjs` pattern (Create segment → Contacts → Next → Add filter → property `YardFlow Qualification Verdict` → MQL → name → Active → Save and process).

- [ ] **Step 2: Build "SQL — Qualified + intent"**

Same flow, filter `yardflow_qual_verdict` is equal to `SQL`.

- [ ] **Step 3: Record list IDs**

Capture both list IDs (URL `…/contacts/3819073/objectLists/<ID>`). Note them in the memory file `project_yardflow_hubspot.md`.

### Task 3.3: Build the 2 Workflows (native, via browser rig, LEFT OFF)

**Files:**
- Reference: `C:\Users\casey\yardflow-hubspot\wf-*.mjs` (incremental workflow builder)

- [ ] **Step 1: Workflow A — MQL promotion (OFF)**

Contact-based. Enrollment trigger: `yardflow_qual_verdict` is `MQL` AND `lifecyclestage` is any of {Prospect/lead, Warm Prospect, Interested, Holding Pattern}. Action: set `lifecyclestage` = `Engaged` (marketingqualifiedlead). Re-enrollment off. **Do not turn on.**

- [ ] **Step 2: Workflow B — SQL promotion + alert (OFF)**

Enrollment: `yardflow_qual_verdict` is `SQL` AND `lifecyclestage` is any of {Prospect, Warm, Interested, Holding, Engaged}. Actions: set `lifecyclestage` = `Sales Qualified Lead`; send internal notification / create task for Casey (owner 85093129); (optional) Slack via the existing #yardflow-intent connection. **Do not turn on.**

- [ ] **Step 3: Screenshot both workflow summaries**

Confirm triggers/actions correct, both showing OFF. Save screenshots for the S4 review.

---

## Sprint 4 — Gated activation (DESTRUCTIVE — requires Casey's go)

### Task 4.1: Run dry-run, present the diff

- [ ] **Step 1: Trigger dry-run in prod (after deploy of S0–S3)**

Run: `curl -s "https://modex-gtm.vercel.app/api/cron/qualification?secret=$CRON_SECRET&mode=dryrun"`
Expected: JSON with `counts` (none/mql/sql), `changes`, and a `sample` of up to 50 changed rows.

- [ ] **Step 2: Present counts + sample to Casey. STOP for approval.**

Show: how many contacts become MQL vs SQL, the sample rows (name, company, icp, seniority, current lifecycle → new verdict). Do not proceed without explicit go.

### Task 4.2: Apply verdicts (writes the marker field only — still no lifecycle change)

- [ ] **Step 1: After Casey approves, run apply**

Run: `curl -s "https://modex-gtm.vercel.app/api/cron/qualification?secret=$CRON_SECRET&mode=apply"`
Expected: JSON `{ applied: { updated: N } }`. This sets `yardflow_qual_verdict` on N contacts. No lifecycle change yet (workflows still OFF).

- [ ] **Step 2: Verify the Active Lists populate**

Check the MQL and SQL lists now show the expected membership counts.

### Task 4.3: Turn on the workflows (the lifecycle actuation)

- [ ] **Step 1: Turn on Workflow A, then B (via rig `wf-turnon.mjs` pattern)**

Enrolling existing contacts that meet the trigger = the backfill. Watch the first enrollments.

- [ ] **Step 2: Verify funnel deltas**

Re-query lifecycle distribution (MCP): MQL and SQL counts should rise by the applied amounts; #yardflow-intent should receive SQL alerts.

### Task 4.4: Schedule the daily cron

- [ ] **Step 1: Add the cron to `vercel.json`**

```json
{ "path": "/api/cron/qualification?mode=apply", "schedule": "0 11 * * *" }
```
(Daily 11:00 UTC. `mode=apply` writes verdicts; workflows actuate continuously.)

- [ ] **Step 2: Commit + deploy**

```bash
git add vercel.json
git commit -m "feat(qual): schedule daily qualification cron"
git push origin main
```

- [ ] **Step 3: Update memory**

Append to `project_yardflow_hubspot.md`: engine live, list IDs, workflow IDs, applied counts, dry-run baseline.

---

## Self-Review

- **Spec coverage:** verdict property (0.2), model TAM×role×intent (1.1–1.3), dry-run diff (2.2–2.3), apply write-guarded (3.1), 2 lists (3.2), 2 workflows OFF (3.3), gated activation + backfill + schedule (4.x). All spec sections mapped.
- **Placeholder scan:** all code blocks concrete; the only adapt-on-contact note is the associations-v4 SDK signature (Task 2.1 Step 2) with an explicit contract to preserve.
- **Type consistency:** `Verdict`, `QualContact`, `QualCompany`, `VerdictDiff`, `EvaluateResult` defined in `types.ts` (0.1) and used unchanged in model/evaluate/apply. `classifyContact(company|null, contact)`, `buildDiff(pairs)`, `evaluateQualification(minScore)`, `applyVerdicts(changed)` signatures consistent across tasks and the cron route. Property constants (`YARDFLOW_QUAL_VERDICT_PROPERTY`, `YARDFLOW_QUAL_EVALUATED_AT_PROPERTY`, `YARDFLOW_ICP_SCORE_PROPERTY`) referenced consistently.
```
