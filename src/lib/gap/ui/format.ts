/**
 * Pure display helpers shared by server and client GAP components.
 *
 * They lived in the 'use client' module components/gap/hypothesis-drawer.tsx.
 * A Server Component that CALLS a function exported from a 'use client'
 * module gets a client reference, not the function, and React throws at
 * render time ("Attempted to call asStringList() from the server"). That is
 * exactly how /gap/preview crashed in production on its first real visit
 * (Joey Maggard, 2026-09-25). Keep plain functions in plain modules;
 * tests/unit/gap/server-client-boundary.test.ts enforces it.
 */

export function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function formatWhen(value: string | Date | null | undefined, withTime = false): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const iso = date.toISOString();
  return withTime ? `${iso.slice(0, 10)} ${iso.slice(11, 16)}Z` : iso.slice(0, 10);
}

/**
 * Red team T7: the builder's auto "why now" ("Signals observed 3 days ago:
 * <titles>", "Public source dated <date>.") restated signal age, not a reason.
 * It is no longer written; rows that still carry it render no why-now at all.
 */
export function humanWhyNow(text: string | null | undefined): string | null {
  const t = (text ?? '').trim();
  if (!t) return null;
  if (/^Signals observed \d/.test(t) || /^Public source dated \d{4}-\d{2}-\d{2}\.?$/.test(t)) return null;
  return t;
}
