'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DraftQueueItem } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { listQueue, removeDraft, sendNow, updateDraft } from './queue-actions';

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  draft: { label: 'draft', className: 'text-neutral-500 border-neutral-500/30' },
  approved: { label: 'approved', className: 'text-blue-600 border-blue-600/40' },
  sending: { label: 'sending', className: 'text-blue-600 border-blue-600/40' },
  sent: { label: 'sent', className: 'text-emerald-600 border-emerald-600/30' },
  failed: { label: 'failed', className: 'text-red-600 border-red-600/40' },
  skipped: { label: 'skipped', className: 'text-amber-600 border-amber-600/40' },
};

interface OutboxRowProps {
  item: DraftQueueItem;
  onRefresh: () => void;
}

function OutboxRow({ item, onRefresh }: OutboxRowProps) {
  const [subject, setSubject] = useState(item.subject);
  const [body, setBody] = useState(item.body);
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const [removing, setRemoving] = useState(false);

  const locked = item.status === 'sent';
  const style = STATUS_STYLE[item.status] ?? STATUS_STYLE.draft;

  async function saveSubject() {
    if (subject === item.subject) return;
    const r = await updateDraft(item.id, { subject });
    if (!r.ok) {
      toast.error('Could not save subject');
      setSubject(item.subject);
    }
  }

  async function saveBody() {
    if (body === item.body) return;
    const r = await updateDraft(item.id, { body });
    if (!r.ok) {
      toast.error('Could not save body');
      setBody(item.body);
    }
  }

  async function handleSend() {
    setSending(true);
    try {
      const res = await sendNow(item.id);
      if ('status' in res && res.status === 'sent') {
        toast.success('Sent');
        onRefresh();
      } else if ('status' in res && res.status === 'skipped') {
        toast.message(`Skipped: ${res.skippedReason}`);
        onRefresh();
      } else if ('status' in res && res.status === 'failed') {
        toast.error(`Failed: ${res.errorMessage}`);
        onRefresh();
      } else if ('reason' in res) {
        toast.error(`Could not send: ${res.reason}`);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      const r = await removeDraft(item.id);
      if (r.ok) onRefresh();
      else toast.error(`Could not remove: ${r.reason}`);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <li className="space-y-2 rounded-md border border-[var(--border)] p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate font-medium">{item.to_email}</span>
            <Badge variant="outline" className={`text-[9px] ${style.className}`}>
              {style.label}
            </Badge>
          </div>
          <div className="truncate text-xs text-[var(--muted-foreground)]">
            {item.account_name}
            {item.persona_name ? ` · ${item.persona_name}` : ''}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            onClick={handleSend}
            disabled={locked || sending || removing}
          >
            {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Send now
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            onClick={handleRemove}
            disabled={locked || sending || removing}
          >
            {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            Remove
          </Button>
        </div>
      </div>

      <Input
        className="h-7 text-xs"
        value={subject}
        disabled={locked}
        onChange={(e) => setSubject(e.target.value)}
        onBlur={saveSubject}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        aria-label="Subject"
      />

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-[11px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {expanded ? 'Hide body' : 'Edit body'}
      </button>

      {expanded && (
        <textarea
          className="w-full rounded-md border border-[var(--border)] bg-transparent p-2 text-xs"
          rows={8}
          value={body}
          disabled={locked}
          onChange={(e) => setBody(e.target.value)}
          onBlur={saveBody}
          aria-label="Body"
        />
      )}

      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt="Proof preview"
          className="max-h-32 rounded-md border border-[var(--border)]"
        />
      )}
    </li>
  );
}

interface OutboxTabProps {
  onCountChange?: (n: number) => void;
}

export function OutboxTab({ onCountChange }: OutboxTabProps) {
  const [items, setItems] = useState<DraftQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    listQueue()
      .then((rows) => {
        setItems(rows);
        onCountChange?.(rows.length);
      })
      .finally(() => setLoading(false));
  }, [onCountChange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Outbox — staged drafts</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            {items.length.toLocaleString()} {items.length === 1 ? 'draft' : 'drafts'} queued
          </p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />}
      </div>

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <OutboxRow key={item.id} item={item} onRefresh={refresh} />
          ))}
        </ul>
      ) : !loading ? (
        <p className="text-xs text-[var(--muted-foreground)]">
          No drafts queued yet. Add contacts from the worklist.
        </p>
      ) : null}
    </div>
  );
}
