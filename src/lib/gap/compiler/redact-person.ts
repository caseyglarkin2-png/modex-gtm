/**
 * Persona-name redaction for compile reports that leave the machine (N11,
 * 2026-09-23). Pure.
 *
 * compile-top100's stdout and its `_summary.json` worst list are pasted into
 * chat and docs; real lane persona names must not ride along. A person is
 * shown as the HubSpot contact id when the lane has one (the same key the
 * enroll-row gate uses), else as initials. The per-account report files keep
 * the names: they stay in `<outDir>` and are the working record.
 */

export function initialsOf(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .map((p) => p.replace(/[^A-Za-z0-9]/g, ''))
    .filter((p) => p.length > 0);
  if (parts.length === 0) return '?';
  return parts.map((p) => `${p.charAt(0).toUpperCase()}.`).join('');
}

/** The contact id when the person key is one (all digits), else initials of the name. */
export function redactPerson(person: string, personKey: string | null | undefined): string {
  if (typeof personKey === 'string' && /^\d+$/.test(personKey)) return personKey;
  return initialsOf(person);
}

interface StepLike {
  account: string;
  personKey: string;
  person: string;
}

/** Redact `person` on every worst entry, resolving the key through the compiled steps by account and name. */
export function redactWorst<T extends { account: string; person: string }>(worst: readonly T[], steps: readonly StepLike[]): T[] {
  const keys = new Map<string, string>();
  for (const s of steps) keys.set(`${s.account}\u0000${s.person}`, s.personKey);
  return worst.map((w) => ({ ...w, person: redactPerson(w.person, keys.get(`${w.account}\u0000${w.person}`) ?? null) }));
}
