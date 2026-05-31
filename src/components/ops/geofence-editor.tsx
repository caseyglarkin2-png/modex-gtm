'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GeoShape, LatLng } from '@/lib/demo/pack-schema';
import { shapeRing } from '@/lib/demo/geofence-geometry';
import { GEOFENCE_COLORS } from '@/components/demo/archetype-palette';
import type { EditorLayer } from './geofence-editor-map';

const Map = dynamic(() => import('./geofence-editor-map'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-white/40">Loading map…</div>,
});

type Mode = 'move' | 'add' | 'remove';

/** A site as passed from the server page (only what the editor needs). */
export interface EditorSite {
  id: string;
  name: string;
  center: LatLng;
  geofences: {
    perimeter: GeoShape;
    truckGate: GeoShape | null;
    dropYards: GeoShape[];
    dockAprons: GeoShape[];
    staging: GeoShape | null;
  };
}

function buildLayers(site: EditorSite): EditorLayer[] {
  const out: EditorLayer[] = [
    { key: 'perimeter', label: 'Property line', color: GEOFENCE_COLORS.perimeter, ring: shapeRing(site.geofences.perimeter) },
  ];
  if (site.geofences.truckGate)
    out.push({ key: 'truckGate', label: 'Truck gate', color: GEOFENCE_COLORS.truckGate, ring: shapeRing(site.geofences.truckGate) });
  site.geofences.dropYards.forEach((g, i) =>
    out.push({ key: `dropYard:${i}`, label: `Drop yard ${i + 1}`, color: GEOFENCE_COLORS.dropYard, ring: shapeRing(g) }),
  );
  site.geofences.dockAprons.forEach((g, i) =>
    out.push({ key: `dockApron:${i}`, label: `Dock apron ${i + 1}`, color: GEOFENCE_COLORS.dockApron, ring: shapeRing(g) }),
  );
  if (site.geofences.staging)
    out.push({ key: 'staging', label: 'Staging', color: GEOFENCE_COLORS.staging, ring: shapeRing(site.geofences.staging) });
  return out;
}

/** Reassemble the working layers back into a SiteGeofences object (v2 polygons). */
function layersToGeofences(layers: EditorLayer[]) {
  const poly = (key: string) => {
    const l = layers.find((x) => x.key === key);
    return l ? { ring: l.ring } : null;
  };
  const drops = layers.filter((l) => l.key.startsWith('dropYard:')).map((l) => ({ ring: l.ring }));
  const aprons = layers.filter((l) => l.key.startsWith('dockApron:')).map((l) => ({ ring: l.ring }));
  return {
    perimeter: poly('perimeter') ?? { ring: [] },
    truckGate: poly('truckGate'),
    dropYards: drops,
    dockAprons: aprons,
    staging: poly('staging'),
  };
}

export function GeofenceEditor({
  accounts,
  account,
  sites,
}: {
  accounts: string[];
  account: string | null;
  sites: EditorSite[];
}) {
  const router = useRouter();
  const [siteId, setSiteId] = useState<string | null>(sites[0]?.id ?? null);
  const site = sites.find((s) => s.id === siteId) ?? sites[0] ?? null;

  // Working layers, keyed by site id so switching sites preserves edits.
  const [edits, setEdits] = useState<Record<string, EditorLayer[]>>({});
  const layers = useMemo(() => {
    if (!site) return [];
    return edits[site.id] ?? buildLayers(site);
  }, [site, edits]);

  const [selectedKey, setSelectedKey] = useState<string | null>('perimeter');
  const [mode, setMode] = useState<Mode>('move');
  const [copied, setCopied] = useState(false);

  function update(next: EditorLayer[]) {
    if (!site) return;
    setEdits((e) => ({ ...e, [site.id]: next }));
  }
  function mutateLayer(key: string, fn: (ring: LatLng[]) => LatLng[]) {
    update(layers.map((l) => (l.key === key ? { ...l, ring: fn(l.ring) } : l)));
  }

  const geofencesJson = useMemo(() => JSON.stringify(layersToGeofences(layers), null, 2), [layers]);

  if (!account) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold text-white">Geofence editor</h2>
        <p className="mt-2 text-sm text-white/60">Pick an account to begin.</p>
        <AccountPicker accounts={accounts} account={account} onPick={(a) => router.push(`/ops/geofence-editor?account=${a}`)} />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col bg-[#050505] text-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-2.5">
        <AccountPicker accounts={accounts} account={account} onPick={(a) => router.push(`/ops/geofence-editor?account=${a}`)} />
        <select
          value={site?.id ?? ''}
          onChange={(e) => setSiteId(e.target.value)}
          className="max-w-[280px] rounded border border-white/15 bg-[#0a0c10] px-2 py-1.5 text-[13px]"
        >
          {sites.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-1 rounded border border-white/15 p-0.5 text-[12px]">
          {(['move', 'add', 'remove'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded px-2.5 py-1 capitalize ${mode === m ? 'bg-[#00B4FF]/25 text-white' : 'text-white/70 hover:text-white'}`}
            >
              {m}
            </button>
          ))}
        </div>
        {site && (
          <button
            onClick={() => update(buildLayers(site))}
            className="rounded border border-white/15 px-2.5 py-1 text-[12px] text-white/70 hover:text-white"
          >
            Reset site
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Layer list */}
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-white/10 p-3">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Layers</div>
          {layers.map((l) => (
            <button
              key={l.key}
              onClick={() => setSelectedKey(l.key)}
              className={`mb-1 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] ${selectedKey === l.key ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'}`}
            >
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: l.color }} />
              <span className="truncate">{l.label}</span>
              <span className="ml-auto font-mono text-[10px] text-white/40">{l.ring.length}</span>
            </button>
          ))}
          <p className="mt-3 text-[11px] leading-relaxed text-white/45">
            <b>Move</b>: drag vertices. <b>Add</b>: click map to append a point to the selected layer. <b>Remove</b>: click a vertex.
          </p>
        </aside>

        {/* Map */}
        <div className="relative min-h-0 flex-1">
          {site && (
            <Map
              layers={layers}
              selectedKey={selectedKey}
              mode={mode}
              center={site.center}
              onVertexDrag={(key, i, lat, lng) =>
                mutateLayer(key, (ring) => ring.map((p, j) => (j === i ? { lat, lng } : p)))
              }
              onAddVertex={(lat, lng) => selectedKey && mutateLayer(selectedKey, (ring) => [...ring, { lat, lng }])}
              onRemoveVertex={(key, i) => mutateLayer(key, (ring) => (ring.length > 3 ? ring.filter((_, j) => j !== i) : ring))}
            />
          )}
        </div>

        {/* Export */}
        <aside className="flex w-80 shrink-0 flex-col border-l border-white/10 p-3">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
            Export · {account} / {site?.id}
          </div>
          <textarea
            readOnly
            value={geofencesJson}
            className="min-h-0 flex-1 resize-none rounded border border-white/15 bg-[#0a0c10] p-2 font-mono text-[10.5px] text-white/80"
          />
          <button
            onClick={() => {
              navigator.clipboard?.writeText(geofencesJson).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              });
            }}
            className="mt-2 rounded border border-[#00B4FF]/55 bg-[#00B4FF]/[0.12] px-3 py-2 text-[13px] font-bold text-white hover:bg-[#00B4FF]/[0.22]"
          >
            {copied ? 'Copied ✓' : `Copy ${site?.id ?? ''} geofences`}
          </button>
          <p className="mt-2 text-[11px] leading-relaxed text-white/45">
            Paste into <code>public/demo-packs/{account}.json</code> → the matching site&apos;s{' '}
            <code>geofences</code>. (Auto-commit-to-repo is the next increment.)
          </p>
        </aside>
      </div>
    </div>
  );
}

function AccountPicker({
  accounts,
  account,
  onPick,
}: {
  accounts: string[];
  account: string | null;
  onPick: (a: string) => void;
}) {
  return (
    <select
      value={account ?? ''}
      onChange={(e) => onPick(e.target.value)}
      className="rounded border border-white/15 bg-[#0a0c10] px-2 py-1.5 text-[13px]"
    >
      <option value="" disabled>
        Account…
      </option>
      {accounts.map((a) => (
        <option key={a} value={a}>{a}</option>
      ))}
    </select>
  );
}
