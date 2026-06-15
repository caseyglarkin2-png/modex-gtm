import Anthropic from '@anthropic-ai/sdk';

export interface ForOverride {
  heroHook?: string;
  problemHook: string;
  problemHighlights?: string[];
  pilot: { site: string; body: string };
  proofCloser?: string;
  metaDescription?: string;
}

interface LatestTrigger { title: string; url: string; source: string }

const SYSTEM = `You write the per-account "spear" for a YardFlow /for sales page. YardFlow is the Yard Network System: the software layer for truck yards between a shipper's TMS and WMS. The page frame (hero category line, why-now, identity, prize, close) is already written by a template. You write ONLY the account-specific override as STRICT JSON, no prose around it.

Writing law (hard rules):
- USA Today register. Short sentences. Active voice.
- NO em dashes. NO "Because" sentence starts. Never the words "tile", "coexist", "layer above", "throughput capacity" (say "production capacity").
- "Yards" is always plural.
- Every claim must trace to the pack or the trigger you are given. Invent nothing.

Return JSON with exactly these keys:
{
  "heroHook": string (optional, one illuminating analogy that sets up the yard problem; omit if you have nothing sharp),
  "problemHook": string (one sentence naming THIS account's worst yard choke, woven from the audit),
  "problemHighlights": string[] (0-2 short phrases from problemHook to emphasize),
  "pilot": { "site": string (a REAL site name from the pack), "body": string (the 60-day start, why this site) },
  "proofCloser": string (optional, one line: this account would be the first <industry> to standardize its yards),
  "metaDescription": string (optional, 1-2 sentence OG description)
}`;

function stripEmDashes<T>(o: T): T {
  if (typeof o === 'string') return o.replace(/\s*—\s*/g, ', ').replace(/\s*–\s*/g, ', ') as unknown as T;
  if (Array.isArray(o)) return o.map(stripEmDashes) as unknown as T;
  if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, stripEmDashes(v)])) as T;
  return o;
}

/**
 * Author the ~6-field spear from the account pack + numbers + the freshest
 * Pounce trigger (the news gate — the freshest trigger is usually the opening
 * line). Deterministic post-processing strips em dashes regardless of model.
 */
export async function authorOverride(pack: any, snap: any, latest: LatestTrigger | null): Promise<ForOverride> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const siteNames: string[] = (pack.network?.sites ?? []).map((s: any) => s.name).filter(Boolean).slice(0, 40);
  const userBlock = JSON.stringify({
    account: { name: pack.account.displayName, slug: pack.account.slug, archetype: pack.account.archetype },
    audited: { totalFacilities: snap.totalFacilities, siloTax: snap.siloTax, modeledAnnual: snap.annualValueLabel },
    realSiteNames: siteNames,
    latestTrigger: latest ? { headline: latest.title, source: latest.source, url: latest.url } : null,
  }, null, 2);

  const msg = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1500,
    system: SYSTEM,
    messages: [{ role: 'user', content: `Account data:\n${userBlock}\n\nReturn ONLY the JSON override.` }],
  });
  const text = msg.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim();
  const json = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let parsed: ForOverride;
  try { parsed = JSON.parse(json); } catch { throw new Error(`authorOverride: could not parse model output as JSON: ${text.slice(0, 120)}`); }
  if (!parsed.problemHook || !parsed.pilot?.site || !parsed.pilot?.body) throw new Error('authorOverride: missing required fields (problemHook/pilot)');
  return stripEmDashes(parsed);
}
