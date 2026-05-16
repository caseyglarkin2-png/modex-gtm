'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/** In-thread reply box — sends through the threaded reply endpoint. */
export function ThreadReplyComposer({
  threadId,
  recipient,
}: {
  threadId: string;
  recipient: string | null;
}) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!body.trim()) {
      toast.error('Write a reply first');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(
        `/api/engagement/thread/${encodeURIComponent(threadId)}/reply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Send failed');
      toast.success('Reply sent');
      setBody('');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Send failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {recipient ? `Reply to ${recipient}` : 'Reply'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={6}
          placeholder="Type your reply…"
          disabled={sending || !recipient}
        />
        <div className="flex justify-end">
          <Button onClick={handleSend} disabled={sending || !recipient || !body.trim()}>
            {sending ? 'Sending…' : 'Send Reply'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
