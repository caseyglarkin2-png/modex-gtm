# Autonomous Outbound Loop v1 — Implementation Plan

> **STATUS: HISTORICAL.** A dated plan/spec record, retained for context and rationale. It describes intent at the time of writing; the code has moved since, so it is NOT current guidance. For present state read `git log --since=7d`, the live system, and `plans/README.md`. Last verified 2026-08-06.


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Hand-to-Clawd run itself — each morning a cron hands the top-50 fresh accounts to Clawd, which sources verified contacts, leads each draft with the account's top mined signal (proximity fallback), and stages them into the Outbox; hot replies and bounces push to Casey's phone.

**Architecture:** Three components in `clawd-control-plane` (Python `scripts/`): verified sourcing + signal-led copy inside `yardflow_draft_batch.py`, and hot-reply/bounce alerts in `proactive_alerts.py` wired into `automation_scheduler.py`. One component in `modex-gtm` (Next.js): a daily Vercel cron that reuses the existing `clawd-dispatch` path. Everything ships behind env flags, default-off for the cron and alerts, default-on for verified sourcing (with automatic fallback to the current path).

**Tech Stack:** Python 3.12 stdlib + psycopg (control plane), DuckDuckGo + OpenAI `gpt-4.1-mini` via `committee_discovery`, Next.js App Router + Prisma + vitest (modex-gtm), Vercel cron.

**Repos & branches:**
- `clawd-control-plane` → branch `claude/aol-control-plane` off `main`.
- `modex-gtm` → branch `claude/autonomous-outbound-loop` off `main` (this worktree).

**Test commands:**
- Control plane: `PYTHONPATH=.pytest-packages python -m pytest scripts/tests/<file> --noconftest -q`
- modex-gtm: `npm run test:unit -- <file>`

---

## File Structure

**clawd-control-plane**
- Modify `scripts/yardflow_draft_batch.py` — add domain resolution, verified sourcing (intent-store committee → DDG+LLM+pattern fallback), `top_signal_for`, `build_draft` (signal-led), rewire `build_items_for_target`. Rename current `source_committee` body to `_synthesized_committee`.
- Modify `scripts/proactive_alerts.py` — implement `check_hot_replies()` + `check_new_bounces()`.
- Modify `scripts/automation_scheduler.py` — register a 15-minute `_run_hot_reply_bounce_alerts()` task behind `AUTO_HOT_REPLY_BOUNCE_ALERT_ENABLED`.
- Test `scripts/tests/test_yardflow_draft_batch.py` (extend), `scripts/tests/test_proactive_alerts_yardflow.py` (new).

**modex-gtm**
- Create `src/lib/discovery/auto-dispatch.ts` — `selectFreshTopAccounts(rows, n, deps)` pure-ish selector.
- Create `src/app/api/cron/dispatch-daily/route.ts` — the cron.
- Modify `vercel.json` — add the cron entry.
- Test `tests/unit/auto-dispatch.test.ts` (new), `tests/unit/dispatch-daily-route.test.ts` (new).

---

## Reference signatures (verified against the codebases)

- `committee_discovery.ddg_linkedin_people(company, title_areas, seniorities, max_results=15) -> list[{name,title,linkedin}]`
- `committee_discovery.rank_candidates_llm(candidates, target=5) -> list[{name,title,linkedin,role}]` (OpenAI `gpt-4.1-mini`, `OPENAI_API_KEY`)
- `yardflow_intent.get_account(domain) -> {company, domain, committee:[{name,title,email,linkedin}], signals:[{title,url,source,intent_category,urgency,published,angle}], links, ...}`
- `linkedin_discovery.infer_email_pattern(domain) -> {pattern, separator, samples, confidence} | None`
- `contacts_db.search_companies(query, limit=20) -> list[{company, domain, ...}]`
- `proactive_alerts._try_push(title, body, url="/", tag="proactive", urgent=False) -> bool`
- `automation_scheduler._env_flag(name, default=True) -> bool`; state via `_load_state()`/`_save_state()`; loop polls `now - state.get("last_x",0) >= INTERVAL`.
- Reply records: `artifacts/yardflow/replies/{YYYY-MM-DD}.jsonl`, fields incl. `email, company, subject, intent`; `HOT_INTENTS = {"interested","meeting","redirect"}`.
- Bounce table `do_not_send(email, reason, created_at)`; DB via `from scripts import db; with db.cursor() as cur:`.
- modex-gtm worklist: `loadLatestScored() -> ScoredOutput`; `buildCuratedRows(output) -> CuratedRow[]`; `enrichRowsWithPipeline(rows) -> Promise<CuratedRow[]>`; `prepareClawdDispatch(owner, rows)` + `dispatchDraftBatch(payload)` in `src/lib/discovery/clawd-dispatch.ts`; `CuratedRow` includes `name, cityState, segment, tier, nearestPrimoName, nearestPrimoDistance, corridor, icpScore`. Cron auth `isAuthorizedCronRequest(request)` in `src/lib/cron-auth.ts`. Prisma: `import { prisma } from '@/lib/prisma'`. Models `EmailLog` (`account_name, to_email, sent_at`), `DraftQueueItem` (`account_name, to_email, source, created_at`).

---

# Component ① + ② — Verified sourcing + signal-led copy (clawd-control-plane)

### Task 1: Domain resolution helper

**Files:**
- Modify: `scripts/yardflow_draft_batch.py`
- Test: `scripts/tests/test_yardflow_draft_batch.py`

- [ ] **Step 1: Write the failing test**

```python
def test_resolve_account_domain_uses_company_search(monkeypatch):
    monkeypatch.setattr("scripts.contacts_db.search_companies",
                        lambda q, limit=5: [{"company": "Niagara Bottling", "domain": "niagarawater.com"}])
    assert ydb.resolve_account_domain("Niagara Bottling") == "niagarawater.com"

def test_resolve_account_domain_none_when_no_hit(monkeypatch):
    monkeypatch.setattr("scripts.contacts_db.search_companies", lambda q, limit=5: [])
    assert ydb.resolve_account_domain("Nope Inc") is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=.pytest-packages python -m pytest scripts/tests/test_yardflow_draft_batch.py -k resolve_account_domain --noconftest -q`
Expected: FAIL — `AttributeError: module ... has no attribute 'resolve_account_domain'`

- [ ] **Step 3: Implement**

Add to `scripts/yardflow_draft_batch.py`:

```python
def resolve_account_domain(account: str) -> str | None:
    """Resolve a company name to its corporate email domain via the contacts DB.
    Returns None when no domain is found (caller falls back)."""
    account = (account or "").strip()
    if not account:
        return None
    try:
        from scripts.contacts_db import search_companies
    except Exception:  # pragma: no cover
        return None
    try:
        hits = search_companies(account, limit=5)
    except Exception as exc:
        _log.warning("search_companies(%s) failed: %s", account, exc)
        return None
    for h in hits or []:
        dom = str((h.get("domain") or "")).strip().lower()
        if dom and "." in dom and " " not in dom:
            return dom
    return None
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PYTHONPATH=.pytest-packages python -m pytest scripts/tests/test_yardflow_draft_batch.py -k resolve_account_domain --noconftest -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/yardflow_draft_batch.py scripts/tests/test_yardflow_draft_batch.py
git commit -m "feat(yardflow): resolve account name to domain via contacts DB"
```

---

### Task 2: Email-from-pattern + DDG people helpers

**Files:**
- Modify: `scripts/yardflow_draft_batch.py`
- Test: `scripts/tests/test_yardflow_draft_batch.py`

- [ ] **Step 1: Write the failing test**

```python
def test_email_from_pattern_first_last():
    pat = {"pattern": "first.last", "separator": "."}
    assert ydb._email_from_pattern("Niraj Jha", "niagarawater.com", pat) == "niraj.jha@niagarawater.com"

def test_email_from_pattern_flast():
    pat = {"pattern": "flast", "separator": ""}
    assert ydb._email_from_pattern("Brad Stout", "cat.com", pat) == "bstout@cat.com"

def test_email_from_pattern_default_when_none():
    assert ydb._email_from_pattern("Jane Doe", "acme.com", None) == "jane.doe@acme.com"

def test_email_from_pattern_blank_on_single_name():
    assert ydb._email_from_pattern("Cher", "acme.com", None) == ""
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=.pytest-packages python -m pytest scripts/tests/test_yardflow_draft_batch.py -k email_from_pattern --noconftest -q`
Expected: FAIL — no attribute `_email_from_pattern`

- [ ] **Step 3: Implement**

```python
def _email_from_pattern(name: str, domain: str, pattern: dict | None) -> str:
    """Build an email from a person name + domain + an inferred pattern dict
    (from linkedin_discovery.infer_email_pattern). Defaults to first.last.
    Returns '' when the name lacks a first+last."""
    parts = [p for p in re.split(r"\s+", (name or "").strip()) if p]
    if len(parts) < 2:
        return ""
    first = re.sub(r"[^a-z]", "", parts[0].lower())
    last = re.sub(r"[^a-z]", "", parts[-1].lower())
    if not first or not last:
        return ""
    p = (pattern or {}).get("pattern", "first.last")
    sep = (pattern or {}).get("separator", ".")
    if p == "flast":
        local = first[0] + last
    elif p == "firstlast":
        local = first + last
    elif p == "first":
        local = first
    elif p == "last.first":
        local = f"{last}{sep}{first}"
    elif p == "first_mi_last":
        local = f"{first}{sep}{last}"
    else:  # first.last / first_last
        local = f"{first}{sep}{last}"
    return f"{local}@{domain}"


def _ddg_people(account: str, limit: int) -> list[dict]:
    """Verified people (name/title) for a company via DDG LinkedIn + LLM ranking.
    No Apollo. Returns [] on any failure."""
    try:
        from scripts.committee_discovery import ddg_linkedin_people, rank_candidates_llm
    except Exception as exc:  # pragma: no cover
        _log.warning("committee_discovery import failed: %s", exc)
        return []
    try:
        cands = ddg_linkedin_people(
            account,
            ["supply chain", "operations", "logistics", "distribution"],
            ["VP", "Director", "Head of", "Chief", "Manager"],
            max_results=15,
        )
        return rank_candidates_llm(cands, target=max(limit, 4))
    except Exception as exc:
        _log.warning("ddg sourcing failed for %s: %s", account, exc)
        return []


def _email_pattern(domain: str) -> dict | None:
    try:
        from scripts.linkedin_discovery import infer_email_pattern
        return infer_email_pattern(domain)
    except Exception:
        return None
```

- [ ] **Step 4: Run test**

Run: `PYTHONPATH=.pytest-packages python -m pytest scripts/tests/test_yardflow_draft_batch.py -k email_from_pattern --noconftest -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/yardflow_draft_batch.py scripts/tests/test_yardflow_draft_batch.py
git commit -m "feat(yardflow): email-from-pattern + DDG people helpers"
```

---

### Task 3: Verified committee (intent store → DDG fallback) behind a flag

**Files:**
- Modify: `scripts/yardflow_draft_batch.py` (rename current `source_committee` body to `_synthesized_committee`; add `verified_committee`, `_verified_sourcing_enabled`, new `source_committee` dispatcher with optional `domain` param)
- Test: `scripts/tests/test_yardflow_draft_batch.py`

- [ ] **Step 1: Write the failing test**

```python
def test_verified_committee_prefers_intent_store(monkeypatch):
    monkeypatch.setattr("scripts.yardflow_intent.get_account", lambda d: {
        "committee": [{"name": "Niraj Jha", "title": "Sr Dir Logistics", "email": "njha@niagarawater.com"}]})
    out = ydb.verified_committee("Niagara Bottling", "niagarawater.com", limit=2)
    assert out and out[0]["email"] == "njha@niagarawater.com"
    assert out[0]["source"] == "intent_committee"

def test_verified_committee_ddg_fallback(monkeypatch):
    monkeypatch.setattr("scripts.yardflow_intent.get_account", lambda d: {"committee": []})
    monkeypatch.setattr(ydb, "_ddg_people", lambda a, limit: [{"name": "Brad Stout", "title": "Dir Logistics"}])
    monkeypatch.setattr(ydb, "_email_pattern", lambda d: {"pattern": "flast", "separator": ""})
    out = ydb.verified_committee("Caterpillar", "cat.com", limit=2)
    assert out and out[0]["email"] == "bstout@cat.com"
    assert out[0]["source"] == "committee_discovery"

def test_source_committee_falls_back_to_synthesized_when_unverified(monkeypatch):
    monkeypatch.setenv("YARDFLOW_VERIFIED_SOURCING", "true")
    monkeypatch.setattr(ydb, "resolve_account_domain", lambda a: None)
    monkeypatch.setattr(ydb, "_synthesized_committee", lambda a, limit: [{"name": "X", "email": "x@acme.com"}])
    out = ydb.source_committee("Acme")
    assert out == [{"name": "X", "email": "x@acme.com"}]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=.pytest-packages python -m pytest scripts/tests/test_yardflow_draft_batch.py -k "verified_committee or falls_back_to_synthesized" --noconftest -q`
Expected: FAIL — `verified_committee` / `_synthesized_committee` not defined.

- [ ] **Step 3: Implement**

In `scripts/yardflow_draft_batch.py`, rename the existing `source_committee` function to `_synthesized_committee` (keep its body verbatim), then add:

```python
def _verified_sourcing_enabled() -> bool:
    return os.environ.get("YARDFLOW_VERIFIED_SOURCING", "true").strip().lower() in ("1", "true", "yes", "on")


def verified_committee(account: str, domain: str | None,
                       limit: int = CONTACTS_PER_ACCOUNT) -> list[dict[str, Any]]:
    """Verified contacts: prefer the intent-store committee (curated, has emails);
    else DDG+LLM people + inferred email pattern. Returns [] if nothing verifiable."""
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    if not domain:
        return out
    # 1. intent-store committee (already curated, real emails)
    try:
        from scripts.yardflow_intent import get_account
        acct = get_account(domain) or {}
    except Exception as exc:
        _log.warning("get_account(%s) failed: %s", domain, exc)
        acct = {}
    for m in acct.get("committee") or []:
        email = (m.get("email") or "").strip().lower()
        if _email_ok(email) and email not in seen:
            seen.add(email)
            out.append({"name": m.get("name", ""), "email": email,
                        "title": m.get("title", ""), "source": "intent_committee",
                        "confidence": "high"})
        if len(out) >= limit:
            return out[:limit]
    if out:
        return out[:limit]
    # 2. DDG + LLM + pattern
    pat = _email_pattern(domain)
    for p in _ddg_people(account, limit):
        email = _email_from_pattern(p.get("name", ""), domain, pat).lower()
        if _email_ok(email) and email not in seen and _domain_plausible(account, email):
            seen.add(email)
            out.append({"name": p.get("name", ""), "email": email,
                        "title": p.get("title", ""), "source": "committee_discovery",
                        "confidence": "medium" if pat else "low"})
        if len(out) >= limit:
            break
    return out[:limit]


def source_committee(account: str, limit: int = CONTACTS_PER_ACCOUNT,
                     domain: str | None = None) -> list[dict[str, Any]]:
    """Top <= limit contacts for an account. With YARDFLOW_VERIFIED_SOURCING on
    (default), prefer verified sourcing (intent committee -> DDG+LLM); on empty
    or flag-off, fall back to the synthesized+domain-gated path."""
    if _verified_sourcing_enabled():
        dom = domain if domain is not None else resolve_account_domain(account)
        verified = verified_committee(account, dom, limit)
        if verified:
            return verified
    return _synthesized_committee(account, limit)
```

- [ ] **Step 4: Run test**

Run: `PYTHONPATH=.pytest-packages python -m pytest scripts/tests/test_yardflow_draft_batch.py --noconftest -q`
Expected: PASS (all, including the previously-passing suite).

- [ ] **Step 5: Commit**

```bash
git add scripts/yardflow_draft_batch.py scripts/tests/test_yardflow_draft_batch.py
git commit -m "feat(yardflow): verified contact sourcing behind YARDFLOW_VERIFIED_SOURCING"
```

---

### Task 4: Signal lookup + signal-led copy

**Files:**
- Modify: `scripts/yardflow_draft_batch.py` (add `top_signal_for`, `build_draft`; rewire `build_items_for_target`)
- Test: `scripts/tests/test_yardflow_draft_batch.py`

- [ ] **Step 1: Write the failing test**

```python
def test_top_signal_for_returns_first(monkeypatch):
    monkeypatch.setattr("scripts.yardflow_intent.get_account", lambda d: {
        "signals": [{"title": "Opening 4 new DCs", "angle": "Your 10-K flags 4 new DCs this year",
                     "intent_category": "expansion"}]})
    sig = ydb.top_signal_for("acme.com")
    assert sig["angle"] == "Your 10-K flags 4 new DCs this year"

def test_build_draft_leads_with_signal():
    sig = {"angle": "Your 10-K flags 4 new DCs this year", "title": "x", "category": "expansion"}
    subject, body = ydb.build_draft(_TARGET, "Niraj", sig)
    assert body.startswith("Hi Niraj,")
    assert "Your 10-K flags 4 new DCs this year." in body
    assert "Small world." in body  # proximity still present after the signal
    for ch in "—–": assert ch not in subject and ch not in body

def test_build_draft_proximity_fallback_when_no_signal():
    subject, body = ydb.build_draft(_TARGET, "Niraj", None)
    assert subject == "a live yard 0.3 mi from your Ontario operation"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=.pytest-packages python -m pytest scripts/tests/test_yardflow_draft_batch.py -k "top_signal_for or build_draft" --noconftest -q`
Expected: FAIL — `top_signal_for` / `build_draft` not defined.

- [ ] **Step 3: Implement**

```python
def top_signal_for(domain: str | None) -> dict[str, Any] | None:
    """Highest-ranked current signal for an account, or None."""
    if not domain:
        return None
    try:
        from scripts.yardflow_intent import get_account
        acct = get_account(domain) or {}
    except Exception:
        return None
    sigs = acct.get("signals") or []
    if not sigs:
        return None
    s = sigs[0]
    angle = s.get("angle") or s.get("title")
    if not angle:
        return None
    return {"angle": angle, "title": s.get("title"), "category": s.get("intent_category")}


def build_draft(target: dict[str, Any], first_name: str,
                signal: dict[str, Any] | None = None) -> tuple[str, str]:
    """Signal-led draft: lead with the account's 'why now', then proximity, spine,
    pilot ask. Falls back to build_proximity_draft when no signal. No em dashes."""
    if not signal or not (signal.get("angle") or signal.get("title")):
        return build_proximity_draft(target, first_name)
    city = _city_of(target.get("facilityCityState", ""))
    first = (first_name or "there").strip() or "there"
    angle = _no_emdash(str(signal.get("angle") or signal.get("title")).strip().rstrip("."))
    lead = f"{angle}."
    prox = _lead_sentence(target.get("hook", ""))
    cta = (f"Worth putting a couple cameras in your {city} yard to prove it in "
           f"your lane, then standardizing from there?")
    subject = _no_emdash(angle).replace("\n", " ").strip()
    if len(subject) > 90:
        subject = subject[:87].rstrip() + "..."
    body = (f"Hi {first},\n\n{lead}\n\n{prox}\n\n{_STACCATO}\n\n{_SCALE}\n\n"
            f"{cta}\n\n{_SIGNATURE}")
    return subject, _no_emdash(body)
```

Then rewire `build_items_for_target` to resolve the domain once, source with it, look up the signal, and draft signal-led. Replace its body with:

```python
def build_items_for_target(target: dict[str, Any], owner: str) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    account = str(target.get("account") or "").strip()
    domain = resolve_account_domain(account)
    contacts = source_committee(account, domain=domain)
    signal = top_signal_for(domain)
    items: list[dict[str, Any]] = []
    for c in contacts:
        email = (c.get("email") or "").strip()
        first_name = (c.get("name") or "").strip().split(" ", 1)[0] or "there"
        subject, body = build_draft(target, first_name, signal)
        items.append({
            "toEmail": email, "accountName": account,
            "personaName": (c.get("name") or "").strip(),
            "subject": subject, "body": body, "imageUrl": PROOF_IMAGE_URL,
            "owner": owner, "source": "clawd",
        })
    summary = {"account": account, "contacts_sourced": len(contacts),
               "items_built": len(items), "signal_led": bool(signal),
               "domain": domain or ""}
    return items, summary
```

- [ ] **Step 4: Run full file test**

Run: `PYTHONPATH=.pytest-packages python -m pytest scripts/tests/test_yardflow_draft_batch.py --noconftest -q`
Expected: PASS (existing `build_items_for_target` tests stub `source_committee`; update them to also stub `resolve_account_domain` + `top_signal_for` returning None if they fail — adjust inline).

- [ ] **Step 5: Commit**

```bash
git add scripts/yardflow_draft_batch.py scripts/tests/test_yardflow_draft_batch.py
git commit -m "feat(yardflow): signal-led drafts with proximity fallback"
```

---

# Component ④ — Hot-reply + bounce alerts (clawd-control-plane)

### Task 5: `check_hot_replies()` in proactive_alerts

**Files:**
- Modify: `scripts/proactive_alerts.py`
- Test: `scripts/tests/test_proactive_alerts_yardflow.py` (new)

- [ ] **Step 1: Write the failing test**

```python
import sys, json, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from scripts import proactive_alerts as pa

def test_check_hot_replies_pushes_hot_and_dedupes(monkeypatch, tmp_path):
    day = tmp_path / "2026-06-07.jsonl"
    day.write_text(
        json.dumps({"email": "vp@acme.com", "company": "Acme", "subject": "re: yard", "intent": "interested"}) + "\n" +
        json.dumps({"email": "no@acme.com", "company": "Acme", "subject": "stop", "intent": "objection"}) + "\n")
    monkeypatch.setattr(pa, "_yardflow_replies_path", lambda: day)
    state = {"hot_reply_alerted": []}
    monkeypatch.setattr(pa, "_load_state", lambda: state)
    monkeypatch.setattr(pa, "_save_state", lambda s: state.update(s))
    pushed = []
    monkeypatch.setattr(pa, "_try_push", lambda **kw: pushed.append(kw) or True)
    n = pa.check_hot_replies()
    assert n == 1
    assert "Acme" in pushed[0]["body"] and "interested" in pushed[0]["body"].lower()
    # second run: already alerted -> no new push
    assert pa.check_hot_replies() == 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=.pytest-packages python -m pytest scripts/tests/test_proactive_alerts_yardflow.py -k check_hot_replies --noconftest -q`
Expected: FAIL — `check_hot_replies` / `_yardflow_replies_path` not defined.

- [ ] **Step 3: Implement**

Add to `scripts/proactive_alerts.py` (reuse existing `_try_push`, `_load_state`, `_save_state`):

```python
import json as _json
from datetime import datetime as _dt, timezone as _tz
from pathlib import Path as _Path

_HOT_INTENTS = {"interested", "meeting", "redirect"}
_NEXT_MOVE = {
    "interested": "Send the 2-camera pilot ask.",
    "meeting": "Send a calendar link now.",
    "redirect": "Ask for the right name + intro.",
}


def _yardflow_replies_path() -> _Path:
    day = _dt.now(_tz.utc).strftime("%Y-%m-%d")
    return _Path(__file__).resolve().parents[1] / "artifacts" / "yardflow" / "replies" / f"{day}.jsonl"


def check_hot_replies() -> int:
    """Push hot replies (interested/meeting/redirect) not yet alerted. Returns
    the number of new alerts sent."""
    path = _yardflow_replies_path()
    if not path.exists():
        return 0
    state = _load_state()
    alerted = set(state.get("hot_reply_alerted", []))
    sent = 0
    new_keys: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rec = _json.loads(line)
        except Exception:
            continue
        intent = str(rec.get("intent") or "").lower()
        email = str(rec.get("email") or "").lower()
        if intent not in _HOT_INTENTS or not email:
            continue
        key = f"{email}|{rec.get('subject','')}"
        if key in alerted:
            continue
        company = rec.get("company") or email.split("@")[-1]
        move = _NEXT_MOVE.get(intent, "Follow up.")
        if _try_push(title=f"Hot reply: {company} ({intent})",
                     body=f"{company} <{email}> replied {intent}. {move}",
                     url="/discovery", tag="yardflow_hot_reply", urgent=True):
            sent += 1
        new_keys.append(key)
    if new_keys:
        state["hot_reply_alerted"] = list(alerted | set(new_keys))[-500:]
        _save_state(state)
    return sent
```

- [ ] **Step 4: Run test**

Run: `PYTHONPATH=.pytest-packages python -m pytest scripts/tests/test_proactive_alerts_yardflow.py -k check_hot_replies --noconftest -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/proactive_alerts.py scripts/tests/test_proactive_alerts_yardflow.py
git commit -m "feat(alerts): push hot yardflow replies"
```

---

### Task 6: `check_new_bounces()` in proactive_alerts

**Files:**
- Modify: `scripts/proactive_alerts.py`
- Test: `scripts/tests/test_proactive_alerts_yardflow.py`

- [ ] **Step 1: Write the failing test**

```python
def test_check_new_bounces_pushes_new_only(monkeypatch):
    rows = [{"email": "a@x.com", "reason": "hard_bounce"}, {"email": "b@y.com", "reason": "hard_bounce"}]
    monkeypatch.setattr(pa, "_recent_bounces", lambda since_iso: rows)
    state = {"bounce_alerted": ["a@x.com"]}
    monkeypatch.setattr(pa, "_load_state", lambda: state)
    monkeypatch.setattr(pa, "_save_state", lambda s: state.update(s))
    pushed = []
    monkeypatch.setattr(pa, "_try_push", lambda **kw: pushed.append(kw) or True)
    n = pa.check_new_bounces()
    assert n == 1 and "b@y.com" in pushed[0]["body"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=.pytest-packages python -m pytest scripts/tests/test_proactive_alerts_yardflow.py -k check_new_bounces --noconftest -q`
Expected: FAIL — not defined.

- [ ] **Step 3: Implement**

```python
def _recent_bounces(since_iso: str) -> list[dict]:
    """do_not_send rows created since `since_iso`. [] on any DB error."""
    try:
        from scripts import db
        with db.cursor() as cur:
            cur.execute("SELECT to_regclass('do_not_send') AS t")
            if not (cur.fetchone() or {}).get("t"):
                return []
            cur.execute(
                "SELECT lower(email) AS email, reason FROM do_not_send "
                "WHERE created_at >= %s ORDER BY created_at DESC LIMIT 200",
                (since_iso,))
            return [dict(r) for r in cur.fetchall()]
    except Exception as exc:
        _log.warning("recent bounces read failed: %s", exc)
        return []


def check_new_bounces() -> int:
    """Push newly-suppressed bounced addresses. Returns count of new alerts."""
    state = _load_state()
    alerted = set(state.get("bounce_alerted", []))
    since = state.get("last_bounce_alert_iso") or "1970-01-01T00:00:00Z"
    sent = 0
    fresh: list[str] = []
    for row in _recent_bounces(since):
        email = (row.get("email") or "").lower()
        if not email or email in alerted:
            continue
        if _try_push(title="Bounce", body=f"{email} bounced ({row.get('reason','')}). Suppressed.",
                     url="/discovery", tag="yardflow_bounce", urgent=False):
            sent += 1
        fresh.append(email)
    if fresh:
        state["bounce_alerted"] = list(alerted | set(fresh))[-1000:]
    state["last_bounce_alert_iso"] = _dt.now(_tz.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    _save_state(state)
    return sent
```

- [ ] **Step 4: Run test**

Run: `PYTHONPATH=.pytest-packages python -m pytest scripts/tests/test_proactive_alerts_yardflow.py --noconftest -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/proactive_alerts.py scripts/tests/test_proactive_alerts_yardflow.py
git commit -m "feat(alerts): push new yardflow bounces"
```

---

### Task 7: Schedule the alerts at ~15 min behind a flag

**Files:**
- Modify: `scripts/automation_scheduler.py`

- [ ] **Step 1: Add interval + flag (near the other interval/flag declarations, ~lines 178-301)**

```python
HOT_REPLY_BOUNCE_ALERT_INTERVAL = int(os.environ.get("AUTO_HOT_REPLY_BOUNCE_MINS", "15")) * 60
HOT_REPLY_BOUNCE_ALERT_ENABLED = _env_flag("AUTO_HOT_REPLY_BOUNCE_ALERT_ENABLED", default=False)
```

- [ ] **Step 2: Add the task function (near the other `_run_*` functions)**

```python
def _run_hot_reply_bounce_alerts() -> dict:
    if not HOT_REPLY_BOUNCE_ALERT_ENABLED:
        return {"skipped": True, "reason": "AUTO_HOT_REPLY_BOUNCE_ALERT_ENABLED=false"}
    from scripts.proactive_alerts import check_hot_replies, check_new_bounces
    replies = check_hot_replies()
    bounces = check_new_bounces()
    return {"hot_replies": replies, "bounces": bounces}
```

- [ ] **Step 3: Register in the scheduler loop (alongside the other interval polls, ~line 4200)**

```python
        if HOT_REPLY_BOUNCE_ALERT_ENABLED and now - state.get("last_hot_reply_bounce_alert", 0) >= HOT_REPLY_BOUNCE_ALERT_INTERVAL:
            _log.info("Running hot reply + bounce alerts...")
            result = _safe_run("hot_reply_bounce_alerts", _run_hot_reply_bounce_alerts)
            _log_run("hot_reply_bounce_alerts", result, "error" not in result)
            state["last_hot_reply_bounce_alert"] = now
            ran_something = True
```

- [ ] **Step 4: Smoke-check the module imports**

Run: `python -c "import scripts.automation_scheduler" ` (from repo root; expect no error, or the usual psycopg-absent warning which is fine locally).

- [ ] **Step 5: Commit**

```bash
git add scripts/automation_scheduler.py
git commit -m "feat(scheduler): 15-min hot-reply/bounce alert task (flag-gated, default off)"
```

---

# Component ③ — Daily auto-dispatch (modex-gtm)

### Task 8: Fresh-account selector

**Files:**
- Create: `src/lib/discovery/auto-dispatch.ts`
- Test: `tests/unit/auto-dispatch.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { selectFreshTopAccounts } from '@/lib/discovery/auto-dispatch';

const row = (name: string, icpScore: number) => ({
  name, cityState: 'Ontario, CA', segment: 'shipper', tier: 'A',
  nearestPrimoName: 'Ontario', nearestPrimoDistance: 0.3, corridor: 'Ontario, CA', icpScore,
}) as any;

describe('selectFreshTopAccounts', () => {
  it('drops already-contacted, sorts by score, caps at n', () => {
    const rows = [row('Chewy', 90), row('Niagara', 95), row('Staples', 80)];
    const out = selectFreshTopAccounts(rows, 2, { contactedNames: new Set(['Staples']) });
    expect(out.map(r => r.name)).toEqual(['Niagara', 'Chewy']);
  });

  it('excludes excluded + existing-account rows', () => {
    const rows = [{ ...row('Excl', 99), excluded: true }, { ...row('Exist', 98), isExistingAccount: true }, row('Ok', 50)];
    const out = selectFreshTopAccounts(rows as any, 10, { contactedNames: new Set() });
    expect(out.map(r => r.name)).toEqual(['Ok']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/auto-dispatch.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
import type { CuratedRow } from './types';

export interface FreshDeps {
  /** lowercased account names already emailed or queued */
  contactedNames: Set<string>;
}

/** Pick the top `n` fresh accounts: drop excluded / existing-account / already
 * contacted, sort by icpScore desc, cap at n. Pure. */
export function selectFreshTopAccounts(
  rows: CuratedRow[],
  n: number,
  deps: FreshDeps,
): CuratedRow[] {
  return rows
    .filter((r) => !r.excluded && !r.isExistingAccount)
    .filter((r) => !deps.contactedNames.has(r.name.trim().toLowerCase()))
    .sort((a, b) => (b.icpScore ?? 0) - (a.icpScore ?? 0))
    .slice(0, n);
}
```

- [ ] **Step 4: Run test**

Run: `npm run test:unit -- tests/unit/auto-dispatch.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/discovery/auto-dispatch.ts tests/unit/auto-dispatch.test.ts
git commit -m "feat(discovery): fresh-account selector for daily dispatch"
```

---

### Task 9: The daily-dispatch cron route

**Files:**
- Create: `src/app/api/cron/dispatch-daily/route.ts`
- Test: `tests/unit/dispatch-daily-route.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/cron-auth', () => ({ isAuthorizedCronRequest: vi.fn(() => true) }));
const prismaMock = {
  emailLog: { findMany: vi.fn(async () => [{ account_name: 'Staples' }]) },
  draftQueueItem: { findMany: vi.fn(async () => []) },
};
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/discovery/data', () => ({
  loadLatestScored: () => ({ prospects: [] }),
  buildCuratedRows: () => ([
    { name: 'Niagara', cityState: 'Ontario, CA', segment: 'shipper', tier: 'A', nearestPrimoName: 'Ontario', nearestPrimoDistance: 0.3, corridor: 'Ontario, CA', icpScore: 95, excluded: false, isExistingAccount: false },
    { name: 'Staples', cityState: 'Ontario, CA', segment: 'shipper', tier: 'A', nearestPrimoName: 'Ontario', nearestPrimoDistance: 1.8, corridor: 'Ontario, CA', icpScore: 80, excluded: false, isExistingAccount: false },
  ]),
}));
vi.mock('@/lib/discovery/enrich', () => ({ enrichRowsWithPipeline: async (r: any) => r }));
const dispatchMock = vi.fn(async () => ({ ok: true, accepted: 1, batchId: 'wf_x' }));
vi.mock('@/lib/discovery/clawd-dispatch', () => ({
  prepareClawdDispatch: (owner: string, rows: any[]) => ({ ok: true, payload: { owner, requestedBy: owner, source: 'discovery-worklist', targets: rows } }),
  dispatchDraftBatch: dispatchMock,
}));

beforeEach(() => { vi.clearAllMocks(); process.env.AUTO_DISPATCH_DAILY_ENABLED = 'true'; });

it('dispatches the fresh top-N when enabled + authorized', async () => {
  const { GET } = await import('@/app/api/cron/dispatch-daily/route');
  const res = await GET(new Request('http://x/api/cron/dispatch-daily', { headers: { Authorization: 'Bearer s' } }));
  const body = await res.json();
  expect(res.status).toBe(200);
  expect(dispatchMock).toHaveBeenCalledOnce();
  // Staples was already emailed -> only Niagara dispatched
  expect(body.dispatched).toBe(1);
});

it('no-ops when flag off', async () => {
  process.env.AUTO_DISPATCH_DAILY_ENABLED = 'false';
  const { GET } = await import('@/app/api/cron/dispatch-daily/route');
  const res = await GET(new Request('http://x', { headers: { Authorization: 'Bearer s' } }));
  expect((await res.json()).skipped).toBe(true);
  expect(dispatchMock).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/dispatch-daily-route.test.ts`
Expected: FAIL — route module not found.

- [ ] **Step 3: Implement**

```typescript
import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { prisma } from '@/lib/prisma';
import { loadLatestScored, buildCuratedRows } from '@/lib/discovery/data';
import { enrichRowsWithPipeline } from '@/lib/discovery/enrich';
import { selectFreshTopAccounts } from '@/lib/discovery/auto-dispatch';
import { prepareClawdDispatch, dispatchDraftBatch } from '@/lib/discovery/clawd-dispatch';

const OWNER = 'casey@freightroll.com';
const DAILY_N = Number(process.env.AUTO_DISPATCH_DAILY_N || '50');

function enabled(): boolean {
  return (process.env.AUTO_DISPATCH_DAILY_ENABLED || 'false').toLowerCase() === 'true';
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!enabled()) {
    return NextResponse.json({ skipped: true, reason: 'AUTO_DISPATCH_DAILY_ENABLED=false' });
  }
  const output = loadLatestScored();
  if (!output) return NextResponse.json({ dispatched: 0, reason: 'no worklist' });

  const rows = await enrichRowsWithPipeline(buildCuratedRows(output));

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [emailed, queued] = await Promise.all([
    prisma.emailLog.findMany({ where: { sent_at: { gte: since } }, distinct: ['account_name'], select: { account_name: true } }),
    prisma.draftQueueItem.findMany({ where: { created_at: { gte: since } }, distinct: ['account_name'], select: { account_name: true } }),
  ]);
  const contactedNames = new Set<string>(
    [...emailed, ...queued].map((r) => (r.account_name || '').trim().toLowerCase()).filter(Boolean),
  );

  const fresh = selectFreshTopAccounts(rows, DAILY_N, { contactedNames });
  if (fresh.length === 0) return NextResponse.json({ dispatched: 0, reason: 'no fresh accounts' });

  const prepared = prepareClawdDispatch(OWNER, fresh);
  if (!prepared.ok) return NextResponse.json({ dispatched: 0, reason: prepared.reason });
  const result = await dispatchDraftBatch(prepared.payload);

  return NextResponse.json({
    dispatched: fresh.length,
    accepted: result.ok ? result.accepted : 0,
    batchId: result.ok ? result.batchId : null,
    dispatchOk: result.ok,
  });
}
```

- [ ] **Step 4: Run test**

Run: `npm run test:unit -- tests/unit/dispatch-daily-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/cron/dispatch-daily/route.ts tests/unit/dispatch-daily-route.test.ts
git commit -m "feat(cron): daily auto-dispatch of top-50 fresh accounts (flag-gated)"
```

---

### Task 10: Register the Vercel cron

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Add the cron entry to the `crons` array**

```json
    {
      "path": "/api/cron/dispatch-daily",
      "schedule": "0 11 * * 1-5"
    }
```

(11:00 UTC = ~6–7am ET, weekdays. Sending stays manual in the Outbox.)

- [ ] **Step 2: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('ok')"`
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "chore(cron): schedule daily auto-dispatch weekday mornings"
```

---

## Task 11: Full-suite regression + live E2E

- [ ] **Step 1: Control-plane suite (the new files)**

Run: `PYTHONPATH=.pytest-packages python -m pytest scripts/tests/test_yardflow_draft_batch.py scripts/tests/test_proactive_alerts_yardflow.py --noconftest -q`
Expected: PASS

- [ ] **Step 2: modex-gtm unit suite (new files)**

Run: `npm run test:unit -- tests/unit/auto-dispatch.test.ts tests/unit/dispatch-daily-route.test.ts`
Expected: PASS

- [ ] **Step 3: Live E2E (after both deploy, flags still off)** — reuse the proven harness: POST a small real batch to the deployed receiver with `MC_API_TOKEN`, then query `draft_queue_items` (modex-gtm DB) and assert drafts have verified domains and (where a signal exists) signal-led subjects. Delete the test rows after. This is the same script pattern used to validate the original receiver.

- [ ] **Step 4: Commit any fixes uncovered, then open PRs (one per repo).**

---

## Rollout (after merge + deploy)

1. Ship all tasks with `AUTO_DISPATCH_DAILY_ENABLED` and `AUTO_HOT_REPLY_BOUNCE_ALERT_ENABLED` **off**; `YARDFLOW_VERIFIED_SOURCING` **on** (with synthesized fallback). Ensure `OPENAI_API_KEY` is set on the control plane (required by `rank_candidates_llm`).
2. Validate ①+② via a manual Hand-to-Clawd + the E2E harness; confirm verified domains + signal-led copy.
3. Flip `AUTO_HOT_REPLY_BOUNCE_ALERT_ENABLED=true` (low blast radius).
4. Flip `AUTO_DISPATCH_DAILY_ENABLED=true` at N=50 last, once ①+② quality is confirmed.

## Self-review notes

- **Spec coverage:** ① Tasks 1-3, ② Task 4, ③ Tasks 8-10, ④ Tasks 5-7. Rollout + E2E in Task 11.
- **Type consistency:** `source_committee(account, limit, domain=None)`, `verified_committee(account, domain, limit)`, `build_draft(target, first_name, signal=None)`, `selectFreshTopAccounts(rows, n, deps)`, `check_hot_replies()`/`check_new_bounces()` used consistently across tasks.
- **Open risk:** email-from-pattern accuracy (Task 2) — mitigated by `_domain_plausible` backstop + existing bounce suppression; verified-sourcing is flagged with synthesized fallback.
