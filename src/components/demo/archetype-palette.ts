/**
 * Per-archetype color palette — single source of truth for both the network
 * atlas markers and the archetype mix chart. Colors picked to stay visible
 * on satellite tiles (no dark blues or greens that blend with water or
 * vegetation) and to remain distinguishable from each other at marker size.
 */

import type { ArchetypeId } from '@/lib/demo/pack-schema';

export const ARCHETYPE_COLORS: Record<ArchetypeId, string> = {
  '#1': '#3B82F6', // gate + GS standard      — blue
  '#2': '#0EA5E9', // gate + GS + separate    — sky
  '#3': '#9CA3AF', // no gate / no GS         — gray
  '#4': '#EF4444', // backup-sensitive        — red
  '#5': '#F59E0B', // multi-step check-in     — amber
  '#6': '#8B5CF6', // campus                  — violet
  '#7': '#10B981', // fast-lane opportunity   — emerald
  '#8': '#F97316', // scale                   — orange
  '#9': '#06B6D4', // remote check-in         — cyan
  '#10': '#EC4899', // ship/rcv separate       — pink
};

/** Short labels used in the donut + filter chips. */
export const ARCHETYPE_LABELS: Record<ArchetypeId, string> = {
  '#1': 'Gate + GS',
  '#2': 'Gate + GS + separate',
  '#3': 'No gate',
  '#4': 'Backup-sensitive',
  '#5': 'Multi-step',
  '#6': 'Campus',
  '#7': 'Fast-lane opp',
  '#8': 'Scale',
  '#9': 'Remote check-in',
  '#10': 'Ship/rcv separate',
};

/** Per-geofence-layer colors for the site detail polygons. */
export const GEOFENCE_COLORS = {
  perimeter: '#06B6D4', // cyan        — site outline
  truckGate: '#F97316', // orange      — the key feature
  dropYard: '#84CC16', //  lime        — trailer storage
  dockApron: '#EC4899', // magenta     — where loading happens
  staging: '#FBBF24', //  amber        — queue area
} as const;
