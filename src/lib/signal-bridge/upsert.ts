/**
 * Idempotent array upsert keyed by a stable identity.
 *
 * Existing entries keep their position (replaced in place when re-imported);
 * net-new entries are appended. Used to merge signal-bridge accounts/personas
 * into accounts.json / personas.json so re-running an import is a no-op-ish update.
 */
export function upsertByKey<T>(existing: T[], incoming: T[], keyFn: (item: T) => string): T[] {
  const incomingByKey = new Map(incoming.map((item) => [keyFn(item), item]));
  const seen = new Set<string>();

  const merged = existing.map((item) => {
    const key = keyFn(item);
    seen.add(key);
    const replacement = incomingByKey.get(key);
    return replacement ?? item;
  });

  for (const item of incoming) {
    if (!seen.has(keyFn(item))) {
      merged.push(item);
    }
  }

  return merged;
}
