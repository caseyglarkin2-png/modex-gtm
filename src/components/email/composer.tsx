'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Send, Sparkles } from 'lucide-react';
import { GeneratorDialog } from '@/components/ai/generator-dialog';
import { VoicePreviewButton } from '@/components/voice-preview-button';

interface EmailComposerProps {
  accountName: string;
  personaName?: string;
  personaEmail?: string;
  trigger?: React.ReactNode;
}

export function EmailComposer({ accountName, personaName, personaEmail, trigger }: EmailComposerProps) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState(personaEmail ?? '');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  function handleAIDraft(content: string) {
    setBody(content);
    if (!subject) {
      setSubject(`FreightRoll x ${accountName} — MODEX 2026`);
    }
  }

  async function handleSend() {
    if (!to || !subject || !body) {
      toast.error('Fill in To, Subject, and Body');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          cc: cc || undefined,
          subject,
          bodyHtml: body,
          accountName,
          personaName,
        }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const err = data as { error?: string };
        throw new Error(err.error ?? 'Send failed');
      }
      toast.success(`Email sent to ${to}`);
      setOpen(false);
      setTo(personaEmail ?? '');
      setCc('');
      setSubject('');
      setBody('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Email send failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Email
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            Compose Email
            {personaName && (
              <span className="text-sm font-normal text-muted-foreground">· {personaName}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input placeholder="email@company.com" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">CC (optional)</Label>
            <Input placeholder="cc@company.com" value={cc} onChange={(e) => setCc(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Subject</Label>
            <Input placeholder="Subject line" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Body</Label>
              <GeneratorDialog
                accountName={accountName}
                personaName={personaName}
                defaultType="email"
                onUseContent={handleAIDraft}
                trigger={
                  <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs text-violet-500 hover:text-violet-600">
                    <Sparkles className="h-3 w-3" /> AI Draft
                  </Button>
                }
              />
            </div>
            <textarea
              className="w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Write your email or click AI Draft above..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {body.trim() && <VoicePreviewButton text={body} label="Listen" />}
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending} className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
