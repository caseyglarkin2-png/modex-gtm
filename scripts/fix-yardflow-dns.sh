#!/usr/bin/env bash
# ============================================================================
# fix-yardflow-dns.sh — Add missing DNS records for yardflow.ai on Cloudflare
# ============================================================================
# Usage:
#   CF_API_TOKEN=xxx ./scripts/fix-yardflow-dns.sh
#   -- OR --
#   CF_EMAIL=xxx CF_API_KEY=xxx ./scripts/fix-yardflow-dns.sh
#
# What this fixes:
#   1. Missing root SPF TXT record → receiving servers can't verify sender
#   2. Missing DMARC TXT record → no policy = receivers distrust/defer
#   3. Missing MX records → BCC copies & replies to casey@yardflow.ai undeliverable
# ============================================================================

set -euo pipefail

DOMAIN="yardflow.ai"

# ── Auth header ──────────────────────────────────────────────────────────────
if [[ -n "${CF_API_TOKEN:-}" ]]; then
  AUTH_HEADER="Authorization: Bearer $CF_API_TOKEN"
elif [[ -n "${CF_EMAIL:-}" && -n "${CF_API_KEY:-}" ]]; then
  AUTH_HEADER="X-Auth-Email: $CF_EMAIL"
  AUTH_KEY_HEADER="X-Auth-Key: $CF_API_KEY"
else
  echo "ERROR: Set CF_API_TOKEN or (CF_EMAIL + CF_API_KEY)"
  echo "  CF_API_TOKEN=xxx ./scripts/fix-yardflow-dns.sh"
  exit 1
fi

cf_api() {
  local method="$1" url="$2" data="${3:-}"
  local args=(-s -X "$method" "https://api.cloudflare.com/client/v4$url" -H "Content-Type: application/json" -H "$AUTH_HEADER")
  if [[ -n "${AUTH_KEY_HEADER:-}" ]]; then
    args+=(-H "$AUTH_KEY_HEADER")
  fi
  if [[ -n "$data" ]]; then
    args+=(-d "$data")
  fi
  curl "${args[@]}"
}

# ── Get Zone ID ──────────────────────────────────────────────────────────────
echo "→ Looking up zone ID for $DOMAIN..."
ZONE_RESP=$(cf_api GET "/zones?name=$DOMAIN")
ZONE_ID=$(echo "$ZONE_RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['result'][0]['id'] if d.get('result') else 'NONE')")

if [[ "$ZONE_ID" == "NONE" || -z "$ZONE_ID" ]]; then
  echo "ERROR: Could not find zone for $DOMAIN. Check credentials."
  echo "$ZONE_RESP" | python3 -m json.tool 2>/dev/null || echo "$ZONE_RESP"
  exit 1
fi
echo "  Zone ID: $ZONE_ID"

# ── Helper: add record if not exists ─────────────────────────────────────────
add_record() {
  local type="$1" name="$2" content="$3" priority="${4:-}" proxied="${5:-false}"
  
  # Check if record already exists
  local existing
  existing=$(cf_api GET "/zones/$ZONE_ID/dns_records?type=$type&name=$name")
  local count
  count=$(echo "$existing" | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('result',[])))")
  
  # For MX, check specific content
  if [[ "$type" == "MX" ]]; then
    local match
    match=$(echo "$existing" | python3 -c "
import json,sys
data = json.load(sys.stdin)
for r in data.get('result',[]):
    if r.get('content','').rstrip('.') == '$content'.rstrip('.'):
        print('YES')
        sys.exit()
print('NO')
")
    if [[ "$match" == "YES" ]]; then
      echo "  ✓ $type $name → $content (already exists)"
      return
    fi
  elif [[ "$count" != "0" && "$type" != "MX" ]]; then
    echo "  ✓ $type $name (already exists, $count record(s))"
    return
  fi
  
  # Build payload
  local payload
  if [[ -n "$priority" ]]; then
    payload=$(python3 -c "
import json
print(json.dumps({
    'type': '$type',
    'name': '$name',
    'content': '$content',
    'priority': int('$priority'),
    'proxied': False,
    'ttl': 1
}))
")
  else
    payload=$(python3 -c "
import json
print(json.dumps({
    'type': '$type',
    'name': '$name',
    'content': '$content',
    'proxied': $proxied,
    'ttl': 1
}))
")
  fi
  
  local resp
  resp=$(cf_api POST "/zones/$ZONE_ID/dns_records" "$payload")
  local success
  success=$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin).get('success', False))")
  
  if [[ "$success" == "True" ]]; then
    echo "  ✅ Added $type $name → $content"
  else
    echo "  ❌ FAILED $type $name → $content"
    echo "$resp" | python3 -c "import json,sys; [print(f'     {e[\"message\"]}') for e in json.load(sys.stdin).get('errors',[])]" 2>/dev/null
  fi
}

# ── 1. SPF Record (root TXT) ────────────────────────────────────────────────
echo ""
echo "→ Adding SPF record..."
add_record TXT "$DOMAIN" "v=spf1 include:amazonses.com include:_spf.google.com ~all"

# ── 2. DMARC Record ─────────────────────────────────────────────────────────
echo ""
echo "→ Adding DMARC record..."
add_record TXT "_dmarc.$DOMAIN" "v=DMARC1; p=none; rua=mailto:casey@freightroll.com"

# ── 3. MX Records (Google Workspace) ────────────────────────────────────────
echo ""
echo "→ Adding MX records (Google Workspace)..."
add_record MX "$DOMAIN" "aspmx.l.google.com" 1
add_record MX "$DOMAIN" "alt1.aspmx.l.google.com" 5
add_record MX "$DOMAIN" "alt2.aspmx.l.google.com" 5
add_record MX "$DOMAIN" "aspmx2.googlemail.com" 10
add_record MX "$DOMAIN" "aspmx3.googlemail.com" 10

# ── Verify ───────────────────────────────────────────────────────────────────
echo ""
echo "→ Verifying records..."
ALL=$(cf_api GET "/zones/$ZONE_ID/dns_records?per_page=100")
echo "$ALL" | python3 -c "
import json, sys
data = json.load(sys.stdin)
records = data.get('result', [])
print(f'  Total records in zone: {len(records)}')
print()
for r in sorted(records, key=lambda x: (x['type'], x['name'])):
    extra = f' (priority: {r[\"priority\"]})' if r.get('priority') else ''
    print(f'  {r[\"type\"]:6s} {r[\"name\"]:45s} → {r[\"content\"][:60]}{extra}')
"

echo ""
echo "✅ DNS fix complete. Records propagate in 1-5 minutes (Cloudflare = fast)."
echo ""
echo "Next steps:"
echo "  1. Wait 2-3 minutes for propagation"
echo "  2. Test: send email from casey@yardflow.ai → external address"
echo "  3. Check email headers for SPF=pass, DKIM=pass, DMARC=pass"
echo "  4. Resend all delayed outreach emails"
