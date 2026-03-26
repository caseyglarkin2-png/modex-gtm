// Offline-first capture queue — persists to localStorage, syncs to API when online
import type { CaptureInput } from './validations';

const QUEUE_KEY = 'modex_offline_queue';

export interface QueuedCapture extends CaptureInput {
  _id: string;        // local uuid
  _queuedAt: string;  // ISO timestamp
  _synced: boolean;
}

function genId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function queuePush(data: CaptureInput): QueuedCapture {
  const item: QueuedCapture = { ...data, _id: genId(), _queuedAt: new Date().toISOString(), _synced: false };
  const all = queueAll();
  all.push(item);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(all));
  return item;
}

export function queueAll(): QueuedCapture[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as QueuedCapture[];
  } catch {
    return [];
  }
}

export function queuePending(): QueuedCapture[] {
  return queueAll().filter((c) => !c._synced);
}

export function queueMarkSynced(id: string) {
  const all = queueAll().map((c) => (c._id === id ? { ...c, _synced: true } : c));
  localStorage.setItem(QUEUE_KEY, JSON.stringify(all));
}

export function queueRemove(id: string) {
  const all = queueAll().filter((c) => c._id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(all));
}

/** Try to flush all pending captures to the API. Returns { sent, failed } */
export async function queueFlush(): Promise<{ sent: number; failed: number }> {
  const pending = queuePending();
  let sent = 0;
  let failed = 0;
  for (const item of pending) {
    try {
      const res = await fetch('/api/captures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: item.account,
          contact: item.contact,
          notes: item.notes,
          interest: item.interest,
          urgency: item.urgency,
          influence: item.influence,
          fit: item.fit,
          heat_score: item.heat_score,
          due_date: item.due_date,
          status: item.status,
        }),
      });
      if (res.ok) {
        queueMarkSynced(item._id);
        sent++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }
  return { sent, failed };
}
