import { promises as fs } from 'node:fs';
import path from 'node:path';
import { requireAdminPage } from '@/lib/require-admin';
import { DemoPackSchema } from '@/lib/demo/pack-schema';
import { GeofenceEditor, type EditorSite } from '@/components/ops/geofence-editor';

/**
 * Sprint B — geofence annotation tool. Admin-gated (same requireAdminPage
 * gate as the rest of /ops). Loads the chosen account's pack server-side
 * and hands the sites' geofences to the client editor, which traces them
 * into oriented v2 polygons.
 */

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Geofence editor · Ops' };

const PACK_DIR = path.join(process.cwd(), 'public', 'demo-packs');

async function listAccounts(): Promise<string[]> {
  try {
    const entries = await fs.readdir(PACK_DIR);
    return entries.filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).sort();
  } catch {
    return [];
  }
}

async function loadSites(account: string): Promise<EditorSite[]> {
  try {
    const raw = await fs.readFile(path.join(PACK_DIR, `${account}.json`), 'utf8');
    const parsed = DemoPackSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return [];
    return parsed.data.network.sites.map((s) => ({
      id: s.id,
      name: s.name,
      center: s.center,
      geofences: s.geofences,
    }));
  } catch {
    return [];
  }
}

export default async function GeofenceEditorPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();
  const params = searchParams ? await searchParams : {};
  const account = typeof params.account === 'string' ? params.account : null;
  const [accounts, sites] = await Promise.all([
    listAccounts(),
    account ? loadSites(account) : Promise.resolve([]),
  ]);

  return <GeofenceEditor accounts={accounts} account={account} sites={sites} />;
}
