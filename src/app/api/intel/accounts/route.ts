import { NextResponse } from 'next/server';
import { isAuthorizedIntelExport } from '@/lib/intel/export/auth';
import { lookupAccount, listAccounts } from '@/lib/intel/export/accounts';

/**
 * Account research — modex's half of a sniper job (Contract: the account-research
 * package, output/intel/account-research-package/HUBSPOT-MAPPING-SPEC.md).
 *
 *   GET /api/intel/accounts/?domain=pepsico.com   -> one account, full research
 *   GET /api/intel/accounts/?slug=boston-beer-company
 *   GET /api/intel/accounts/?cursor=<n>&limit=<=500  -> the deduped account list
 *   Header: x-queue-secret: <QUEUE_AGENT_SECRET>  (Bearer of the same also OK)
 *
 * One account returns: scores + yard-audit sites (metrics + 22-field
 * classification) + dossier refs + committee (full, for the 56 audited) or the
 * scored deduped row otherwise. Fail-soft: 200 on lookup miss.
 */
export const dynamic = 'force-dynamic';

const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 200;

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedIntelExport(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = new URL(request.url);
  const domain = url.searchParams.get('domain');
  const slug = url.searchParams.get('slug');

  try {
    if (domain || slug) {
      return NextResponse.json(lookupAccount(domain, slug));
    }
    const raw = url.searchParams.get('limit');
    const n = raw == null ? DEFAULT_LIMIT : Number.parseInt(raw, 10);
    const limit = !Number.isFinite(n) || n <= 0 ? DEFAULT_LIMIT : Math.min(n, MAX_LIMIT);
    return NextResponse.json(listAccounts(url.searchParams.get('cursor'), limit));
  } catch (err) {
    console.warn('[intel-accounts] failed:', err);
    return NextResponse.json({ found: false, detail_level: 'none', account: null, items: [], nextCursor: null });
  }
}
