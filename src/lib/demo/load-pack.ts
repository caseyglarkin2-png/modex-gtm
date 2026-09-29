/**
 * The ONE demo-pack loader: the committed file under public/demo-packs, else the runtime store (no-deploy
 * demos). Used by the /demo page and by GAP account intelligence. Returns null when there is no valid pack.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { DemoPackSchema, type DemoPack } from './pack-schema';
import { getRemoteDemoPack } from './remote-pack';

export async function loadDemoPack(slug: string): Promise<DemoPack | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    const file = path.join(process.cwd(), 'public', 'demo-packs', `${slug}.json`);
    const raw = await fs.readFile(file, 'utf8');
    return DemoPackSchema.parse(JSON.parse(raw));
  } catch {
    try {
      const remote = await getRemoteDemoPack(slug);
      return remote ? DemoPackSchema.parse(remote) : null;
    } catch {
      return null;
    }
  }
}
