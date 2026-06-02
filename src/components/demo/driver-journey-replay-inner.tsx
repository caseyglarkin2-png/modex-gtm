'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoShape, ScenarioStep, Site, SiteScenario } from '@/lib/demo/pack-schema';
import { shapeBounds, shapeCentroid, shapePositions } from '@/lib/demo/geofence-geometry';
import { GEOFENCE_COLORS } from './archetype-palette';

/**
 * D3.2 + D3.3 — Driver journey replay.
 *
 * Walks an animated truck dot through the site's real geofences along
 * the archetype's canonical scenario, with per-step narration and a
 * baseline ↔ YNS mode toggle. Every minute of real time compresses to
 * ~0.25s of replay time so the whole journey is ~22s.
 *
 * Implementation notes:
 *   - `mode` switches which wait-time field drives the per-step delay.
 *     The replay re-times automatically on toggle without resetting
 *     the truck position (good UX — you can see the *same* sequence
 *     compress under YNS without losing your place).
 *   - The truck is a Leaflet DivIcon (no Leaflet image-path config
 *     issues). Position updates via Marker.setLatLng() in a rAF loop.
 *   - The current step's geofence layer is highlighted via thicker
 *     stroke + higher fill alpha, so the eye tracks where the truck is.
 */

interface Props {
  site: Site;
  scenario: SiteScenario;
  mode: 'baseline' | 'yns';
  /** Replay restart key — change to force a clean restart (Reset button). */
  restartKey: number;
  /** Fires when the truck reaches the exit waypoint. */
  onComplete?: () => void;
  /** Fires every animation tick with the current step index. */
  onStep?: (stepIdx: number, phase: 'waiting' | 'moving' | 'done') => void;
}

const TARGET_TOTAL_REPLAY_MS = 22_000;
const MIN_STEP_REPLAY_MS = 600;

interface LatLng {
  lat: number;
  lng: number;
}

// Geofence shapes may be legacy bboxes or v2 oriented polygons; the
// shared helpers read either. centroid = shape centroid (vertex average).
const centroid = shapeCentroid;

function targetCentroid(site: Site, step: ScenarioStep): LatLng | null {
  const g = site.geofences;
  switch (step.geofenceTarget) {
    case 'truckGate':
      return g.truckGate ? centroid(g.truckGate) : null;
    case 'dropYard':
      return g.dropYards[step.targetIndex ?? 0]
        ? centroid(g.dropYards[step.targetIndex ?? 0]!)
        : null;
    case 'dockApron':
      return g.dockAprons[step.targetIndex ?? 0]
        ? centroid(g.dockAprons[step.targetIndex ?? 0]!)
        : null;
    case 'staging':
      return g.staging ? centroid(g.staging) : null;
    case 'exit':
      // Exit through the truck gate centroid (or perimeter if no gate).
      return g.truckGate ? centroid(g.truckGate) : centroid(g.perimeter);
  }
}

function makeTruckIcon(): L.DivIcon {
  return L.divIcon({
    className: 'demo-truck-marker',
    html: `<svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
      <circle cx="13" cy="13" r="11" fill="#fbbf24" stroke="#0f172a" stroke-width="3" />
      <text x="13" y="17" text-anchor="middle" fill="#0f172a" font-size="11" font-weight="800" font-family="system-ui">▶</text>
    </svg>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function FitToPerimeter({ perimeter }: { perimeter: GeoShape }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(shapeBounds(perimeter), { padding: [20, 20], animate: false });
  }, [map, perimeter]);
  return null;
}

function lerp(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

export default function DriverJourneyReplayInner({
  site,
  scenario,
  mode,
  restartKey,
  onComplete,
  onStep,
}: Props) {
  // Pre-compute waypoints once per (site, scenario). Waypoint 0 is the
  // initial position; waypoints [1..N] are the per-step destinations.
  const waypoints = useMemo<LatLng[]>(() => {
    const start = site.geofences.truckGate
      ? centroid(site.geofences.truckGate)
      : centroid(site.geofences.perimeter);
    const pts: LatLng[] = [start];
    for (const step of scenario.steps) {
      const c = targetCentroid(site, step) ?? pts[pts.length - 1]!;
      pts.push(c);
    }
    return pts;
  }, [site, scenario]);

  // Per-mode timing. Recomputed when mode changes so the toggle re-paces
  // mid-replay without restart.
  const timings = useMemo(() => {
    const totalReal = mode === 'baseline' ? scenario.totalBaselineMs : scenario.totalYnsMs;
    const speed = totalReal > 0 ? TARGET_TOTAL_REPLAY_MS / totalReal : 1;
    // Cumulative replay-ms for each step. waitStart[i] = when step i's
    // wait begins; moveStart[i] = when truck starts physically moving.
    let cursor = 0;
    const slots: { waitStart: number; moveStart: number; moveEnd: number; waitMs: number; durMs: number }[] = [];
    for (const step of scenario.steps) {
      const waitMs = (mode === 'baseline' ? step.baselineWaitMs : step.ynsWaitMs) ?? 0;
      const waitRepl = waitMs * speed;
      const moveRepl = Math.max(step.durationMs * speed, MIN_STEP_REPLAY_MS);
      const waitStart = cursor;
      const moveStart = cursor + waitRepl;
      const moveEnd = moveStart + moveRepl;
      slots.push({ waitStart, moveStart, moveEnd, waitMs, durMs: step.durationMs });
      cursor = moveEnd;
    }
    return { slots, total: cursor };
  }, [mode, scenario]);

  const [pos, setPos] = useState<LatLng>(waypoints[0]!);
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState<'waiting' | 'moving' | 'done'>('waiting');
  const startedAtRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  // Restart on (restartKey, mode) change.
  useEffect(() => {
    startedAtRef.current = performance.now();
    completedRef.current = false;
    setPos(waypoints[0]!);
    setCurrentStep(0);
    setPhase('waiting');
  }, [restartKey, mode, waypoints]);

  // Drive the animation loop.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const start = startedAtRef.current;
      if (start === null) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const now = performance.now() - start;
      const slots = timings.slots;
      // Find the current step
      let stepIdx = slots.length - 1;
      let nextPhase: 'waiting' | 'moving' | 'done' = 'done';
      for (let i = 0; i < slots.length; i++) {
        const s = slots[i]!;
        if (now < s.moveStart) {
          stepIdx = i;
          nextPhase = 'waiting';
          break;
        }
        if (now < s.moveEnd) {
          stepIdx = i;
          nextPhase = 'moving';
          break;
        }
      }
      const slot = slots[stepIdx]!;
      const from = waypoints[stepIdx]!;
      const to = waypoints[stepIdx + 1]!;

      let newPos: LatLng;
      if (nextPhase === 'waiting') {
        newPos = from;
      } else if (nextPhase === 'moving') {
        const t = Math.min(1, (now - slot.moveStart) / Math.max(1, slot.moveEnd - slot.moveStart));
        newPos = lerp(from, to, t);
      } else {
        newPos = to;
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
      }

      setPos(newPos);
      setCurrentStep(stepIdx);
      setPhase(nextPhase);
      onStep?.(stepIdx, nextPhase);

      if (nextPhase !== 'done') {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [timings, waypoints, onComplete, onStep]);

  const truckIcon = useMemo(() => makeTruckIcon(), []);

  const gf = site.geofences;
  const cur = scenario.steps[currentStep]!;

  /** Returns the styling for one geofence layer — bolder when the truck is currently in/heading toward it. */
  function layerStyle(target: ScenarioStep['geofenceTarget'], idx: number = 0) {
    const isActive = cur.geofenceTarget === target && (cur.targetIndex ?? 0) === idx;
    const colorMap = {
      truckGate: GEOFENCE_COLORS.truckGate,
      dropYard: GEOFENCE_COLORS.dropYard,
      dockApron: GEOFENCE_COLORS.dockApron,
      staging: GEOFENCE_COLORS.staging,
      exit: GEOFENCE_COLORS.truckGate,
    } as const;
    return {
      color: colorMap[target],
      weight: isActive ? 4 : 2,
      fillOpacity: isActive ? 0.35 : 0.12,
    };
  }

  return (
    <MapContainer
      style={{ width: '100%', height: '100%', background: '#0f172a' }}
      center={[site.center.lat, site.center.lng]}
      zoom={17}
      scrollWheelZoom
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri"
        maxZoom={19}
      />
      <FitToPerimeter perimeter={gf.perimeter} />

      <Polygon
        positions={shapePositions(gf.perimeter)}
        pathOptions={{ color: GEOFENCE_COLORS.perimeter, weight: 2, fillOpacity: 0.04, dashArray: '4 4' }}
      />
      {gf.dropYards.map((b, i) => (
        <Polygon key={`d-${i}`} positions={shapePositions(b)} pathOptions={layerStyle('dropYard', i)} />
      ))}
      {gf.dockAprons.map((b, i) => (
        <Polygon key={`a-${i}`} positions={shapePositions(b)} pathOptions={layerStyle('dockApron', i)} />
      ))}
      {gf.staging && <Polygon positions={shapePositions(gf.staging)} pathOptions={layerStyle('staging')} />}
      {gf.truckGate && <Polygon positions={shapePositions(gf.truckGate)} pathOptions={layerStyle('truckGate')} />}

      <Marker position={[pos.lat, pos.lng]} icon={truckIcon} />
    </MapContainer>
  );
}
