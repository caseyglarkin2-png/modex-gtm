import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAction } from '@/lib/require-admin';
import { DemoPackSchema } from '@/lib/demo/pack-schema';

/**
 * Sprint B (increment 2) — auto-commit a site's edited geofences from the
 * annotation tool straight into the pack JSON in the repo, via the GitHub
 * Contents API. Admin-gated; the token is server-side only.
 *
 * Env:
 *   GEOFENCE_REPO_TOKEN     — fine-grained PAT with Contents:write on the
 *                             modex-gtm repo (server-side; never exposed).
 *   GEOFENCE_COMMIT_BRANCH  — target branch (default 'main'). Point at a
 *                             review branch to keep edits out of prod
 *                             until merged.
 */

const OWNER = 'caseyglarkin2-png';
const REPO = 'modex-gtm';
const GH = 'https://api.github.com';

function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminAction();
  } catch {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const token = process.env.GEOFENCE_REPO_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'GEOFENCE_REPO_TOKEN not configured' },
      { status: 503 },
    );
  }
  const branch = process.env.GEOFENCE_COMMIT_BRANCH || 'main';

  let body: { account?: string; siteId?: string; geofences?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  const { account, siteId, geofences } = body;
  if (!account || !siteId || !geofences || !/^[a-z0-9-]+$/.test(account)) {
    return NextResponse.json({ ok: false, error: 'missing_or_invalid_fields' }, { status: 400 });
  }

  const filePath = `public/demo-packs/${account}.json`;
  try {
    // 1. Fetch the current file (content + sha).
    const getRes = await fetch(
      `${GH}/repos/${OWNER}/${REPO}/contents/${filePath}?ref=${encodeURIComponent(branch)}`,
      { headers: ghHeaders(token) },
    );
    if (!getRes.ok) {
      return NextResponse.json({ ok: false, error: `github_get_${getRes.status}` }, { status: 502 });
    }
    const file = (await getRes.json()) as { sha: string; content: string };
    const current = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));

    // 2. Splice in the edited site's geofences.
    const site = current?.network?.sites?.find((s: { id: string }) => s.id === siteId);
    if (!site) {
      return NextResponse.json({ ok: false, error: 'site_not_found' }, { status: 404 });
    }
    site.geofences = geofences;

    // 3. Validate the whole pack still conforms before committing.
    const parsed = DemoPackSchema.safeParse(current);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'schema_validation_failed', detail: parsed.error.issues.slice(0, 3) },
        { status: 422 },
      );
    }

    // 4. Commit.
    const newContent = JSON.stringify(current, null, 2) + '\n';
    const putRes = await fetch(`${GH}/repos/${OWNER}/${REPO}/contents/${filePath}`, {
      method: 'PUT',
      headers: ghHeaders(token),
      body: JSON.stringify({
        message: `chore(geofence): update ${siteId} geofences (annotation tool)`,
        content: Buffer.from(newContent, 'utf8').toString('base64'),
        sha: file.sha,
        branch,
      }),
    });
    if (!putRes.ok) {
      const detail = await putRes.text().catch(() => '');
      return NextResponse.json({ ok: false, error: `github_put_${putRes.status}`, detail: detail.slice(0, 200) }, { status: 502 });
    }
    const result = (await putRes.json()) as { commit?: { sha?: string; html_url?: string } };
    return NextResponse.json({ ok: true, branch, commit: result.commit?.sha, url: result.commit?.html_url });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'exception', detail: String(err).slice(0, 200) }, { status: 500 });
  }
}
