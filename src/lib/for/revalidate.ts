const FLOW_STATE = process.env.FLOW_STATE_URL || 'https://yardflow.ai';

/** Fire the Flow-State- ISR revalidate so a freshly stored /for/<slug> is live
 *  immediately. Token-gated by the same POUNCE_INGEST_TOKEN. Fail-soft. */
export async function revalidateForPage(slug: string): Promise<void> {
  const token = process.env.POUNCE_INGEST_TOKEN;
  if (!token) return;
  try {
    await fetch(`${FLOW_STATE.replace(/\/$/, '')}/api/revalidate?path=/for/${encodeURIComponent(slug)}`, {
      method: 'POST', headers: { 'x-pounce-token': token }, signal: AbortSignal.timeout(10_000),
    });
  } catch { /* fail-soft */ }
}
