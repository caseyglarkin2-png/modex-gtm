'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Send, Check } from 'lucide-react';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  to: string;
  subject: string;
  body: string;
  accountName: string;
  personaName: string;
  generatedContentId?: number;
}

export function EmailPreviewModal({
  isOpen,
  onClose,
  to: initialTo,
  subject: initialSubject,
  body: initialBody,
  accountName,
  personaName,
  generatedContentId,
}: EmailPreviewModalProps) {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    setSending(true);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          bodyHtml: body,
          accountName,
          personaName,
          generatedContentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setSent(true);
      toast.success(`✅ Email sent to ${to}!`);

      // Close after 2 seconds
      setTimeout(() => {
        onClose();
        setSent(false);
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send email');
      setSending(false);
    }
  }

  function handleCancel() {
    setTo(initialTo);
    setSubject(initialSubject);
    setBody(initialBody);
    setSent(false);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {sent ? (
              <>
                <Check className="h-5 w-5 text-green-600" />
                Email Sent!
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Preview & Send Email
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={sending || sent}
              placeholder="recipient@example.com"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {personaName} · {accountName}
            </p>
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={sending || sent}
              placeholder="Email subject..."
            />
          </div>

          <div>
            <Label htmlFor="body">Message</Label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={sending || sent}
              className="w-full min-h-[300px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Email body..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel} disabled={sending || sent}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending || sent || !to || !subject || !body}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : sent ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Sent!
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
